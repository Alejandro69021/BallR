/// <reference types="vitest" />
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isValidYouTubeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  try {
    const parsed = new URL(rawUrl.trim())
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be'
  } catch {
    return false
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0
    const chunks = []
    req.on('data', (chunk) => {
      total += chunk.length
      if (total > maxBytes) {
        reject(new Error('Body permintaan terlalu besar.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8').trim()
        resolve(text ? JSON.parse(text) : {})
      } catch {
        reject(new Error('Format JSON permintaan tidak valid.'))
      }
    })
    req.on('error', (err) => reject(err))
  })
}

function extractStderrSummary(stderr) {
  if (!stderr || typeof stderr !== 'string') return ''
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return ''
  const prioritized = lines.filter(
    (line) =>
      line.includes('ERROR:') ||
      line.includes('[ballr-vision]') ||
      line.includes('Sign in') ||
      line.includes('HTTP Error')
  )
  const chosen = prioritized.length > 0 ? prioritized.slice(-4) : lines.slice(-4)
  return chosen.join('\n')
}

function runPythonSegment({
  pyExecutable,
  pythonScriptPath,
  visionDir,
  rawUrl,
  engine,
  fps,
  ownCluster,
  cookiesFromBrowser,
  teamA,
  teamB,
  seg,
  segOutPath,
  onSpawn,
  onProgress
}) {
  return new Promise((resolve, reject) => {
    const tempClipPath = path.join(visionDir, 'match_clip.mp4')
    try {
      if (fs.existsSync(tempClipPath)) fs.unlinkSync(tempClipPath)
    } catch {
      // Abaikan bila berkas tidak bisa dihapus sebelum proses baru
    }

    const args = [
      pythonScriptPath,
      '--youtube', rawUrl,
      '--engine', engine,
      '--start', String(seg.startSec),
      '--end', String(seg.endSec),
      '--fps', String(fps),
      '--period', String(seg.period),
      '--start-minute', String(seg.startMinute),
      '--own-cluster', String(ownCluster),
      '--clip-start-s', String(seg.startSec),
      '--out', segOutPath
    ]
    if (seg.flipPitch) {
      args.push('--flip-pitch')
    }
    if (cookiesFromBrowser) {
      args.push('--cookies-from-browser', cookiesFromBrowser)
    }
    if (teamA) {
      args.push('--team-a', teamA)
    }
    if (teamB) {
      args.push('--team-b', teamB)
    }

    const child = spawn(pyExecutable, args, {
      cwd: visionDir,
      shell: false,
      windowsHide: true
    })
    if (typeof onSpawn === 'function') onSpawn(child)

    let stdout = ''
    let stdoutBuf = ''
    let stderr = ''
    const timeoutMs = 900000
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
    }, timeoutMs)

    child.stdout.on('data', (d) => {
      const chunk = d.toString()
      stdout += chunk
      if (stdout.length > 8000) stdout = stdout.slice(-8000)
      stdoutBuf += chunk
      const lines = stdoutBuf.split(/\r?\n/)
      stdoutBuf = lines.pop() || ''
      for (const line of lines) {
        const prefix = '[ballr-progress] '
        if (line.startsWith(prefix) && typeof onProgress === 'function') {
          try {
            const parsed = JSON.parse(line.slice(prefix.length))
            onProgress(parsed)
          } catch {
            // Abaikan baris progres yang tidak lengkap
          }
        }
      }
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString()
      if (stderr.length > 8000) stderr = stderr.slice(-8000)
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject({
        status: 500,
        message: `Gagal menjalankan Python lokal (${pyExecutable}): ${err.message}`,
        stderr_tail: stderr.slice(-1200),
        error_detail: extractStderrSummary(stderr)
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        const stderrTail = stderr.slice(-1200).trim()
        const errorDetail = extractStderrSummary(stderrTail)
        const isYtDlpIssue = /yt-dlp|youtube|ERROR:|Sign in|cookies|HTTP Error|Unavailable|Private video|Requested format/i.test(
          stderrTail
        )
        const baseMessage = isYtDlpIssue
          ? `Unduh YouTube (yt-dlp) gagal pada Babak ${seg.period} (exit ${code}).`
          : `Proses vision/ballr_vision.py gagal pada Babak ${seg.period} (exit ${code}). Pastikan yt-dlp, opencv-python, dan numpy terpasang.`
        reject({
          status: 500,
          message: baseMessage,
          exit_code: code,
          stderr_tail: stderrTail,
          error_detail: errorDetail || stderrTail
        })
        return
      }
      try {
        const raw = fs.readFileSync(segOutPath, 'utf-8')
        const data = JSON.parse(raw)
        resolve({ data, stdout })
      } catch (err) {
        reject({
          status: 500,
          message: `Skrip selesai tetapi keluaran JSON Babak ${seg.period} gagal dibaca: ${err.message}`
        })
      }
    })
  })
}

function normalizeYouTubeSegments(body) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
  const MAX_SEGMENT_SEC = 3600 // Dukung hingga 60 menit (full-time 1 babak 45 menit + tambahan waktu)
  if (Array.isArray(body.segments) && body.segments.length > 0) {
    const out = []
    for (let i = 0; i < Math.min(2, body.segments.length); i++) {
      const seg = body.segments[i] || {}
      const period = Number(seg.period) === 2 ? 2 : i === 0 ? 1 : 2
      const startSec = clamp(Math.floor(Number(seg.startSec ?? 0) || 0), 0, 21600)
      const rawEnd = Math.floor(Number(seg.endSec ?? startSec + 60) || startSec + 60)
      const endSec = Math.max(startSec + 10, Math.min(startSec + MAX_SEGMENT_SEC, rawEnd))
      const defaultStartMin = period === 2 ? 45 : 0
      const startMinute = clamp(
        Number(seg.startMinute != null ? seg.startMinute : defaultStartMin) || 0,
        0,
        130
      )
      out.push({
        period,
        startSec,
        endSec,
        startMinute,
        flipPitch: Boolean(seg.flipPitch)
      })
    }
    return out
  }

  const startSec = clamp(Math.floor(Number(body.startSec ?? 900) || 0), 0, 21600)
  const rawEnd = Math.floor(Number(body.endSec ?? startSec + 60) || startSec + 60)
  const endSec = Math.max(startSec + 10, Math.min(startSec + MAX_SEGMENT_SEC, rawEnd))
  const period = Number(body.period) === 2 ? 2 : 1
  const startMinute = clamp(
    Number(body.startMinute != null ? body.startMinute : period === 2 ? 45 : 0) || 0,
    0,
    130
  )
  return [
    {
      period,
      startSec,
      endSec,
      startMinute,
      flipPitch: Boolean(body.flipPitch)
    }
  ]
}

function ballrVisionLocalApiPlugin() {
  const visionDir = path.resolve(__dirname, 'vision')
  const latestAnalysisPath = path.join(visionDir, 'ballr_analysis.json')
  const pythonScriptPath = path.join(visionDir, 'ballr_vision.py')
  let activeRun = false
  let activeChild = null
  let cancelRequested = false
  let activeProgress = null

  return {
    name: 'ballr-vision-local-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url || '').split('?')[0]

        if (reqPath === '/api/vision/youtube/status' && req.method === 'GET') {
          const progress = activeProgress
            ? {
                ...activeProgress,
                elapsedSec: Math.max(0, Math.floor((Date.now() - activeProgress.startedAt) / 1000))
              }
            : null
          sendJson(res, 200, {
            ok: true,
            active: activeRun,
            progress
          })
          return
        }

        if (reqPath === '/api/vision/youtube/cancel' && req.method === 'POST') {
          if (!activeRun) {
            sendJson(res, 200, { ok: true, cancelled: false })
            return
          }
          cancelRequested = true
          try {
            if (activeChild && !activeChild.killed) {
              activeChild.kill('SIGTERM')
            }
          } catch {
            // Abaikan bila proses sudah berhenti
          }
          sendJson(res, 200, { ok: true, cancelled: true })
          return
        }

        if (reqPath === '/api/vision/latest' && req.method === 'GET') {
          try {
            if (!fs.existsSync(latestAnalysisPath)) {
              sendJson(res, 404, {
                ok: false,
                error: 'Belum ada berkas vision/ballr_analysis.json di disk lokal.'
              })
              return
            }
            const raw = fs.readFileSync(latestAnalysisPath, 'utf-8')
            const data = JSON.parse(raw)
            sendJson(res, 200, {
              ok: true,
              source: 'vision/ballr_analysis.json',
              data
            })
          } catch (err) {
            sendJson(res, 500, {
              ok: false,
              error: `Gagal membaca vision/ballr_analysis.json: ${err.message}`
            })
          }
          return
        }

        if (reqPath === '/api/vision/youtube' && req.method === 'POST') {
          if (activeRun) {
            sendJson(res, 409, {
              ok: false,
              error: 'Proses analisis YouTube sebelumnya masih berjalan. Tunggu hingga selesai.'
            })
            return
          }

          readJsonBody(req)
            .then(async (body) => {
              const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
              if (!isValidYouTubeUrl(rawUrl)) {
                sendJson(res, 400, {
                  ok: false,
                  error: 'URL YouTube tidak valid. Gunakan tautan youtube.com atau youtu.be.'
                })
                return
              }

              if (!fs.existsSync(pythonScriptPath)) {
                sendJson(res, 500, {
                  ok: false,
                  error: 'Skrip vision/ballr_vision.py tidak ditemukan di direktori proyek.'
                })
                return
              }

              const segments = normalizeYouTubeSegments(body)
              const requestedFps = Math.max(0.25, Math.min(4, Number(body.fps ?? 2.0) || 2.0))
              const ownCluster = Number(body.ownCluster) === 1 ? 1 : 0
              const allowedEngines = new Set(['auto', 'pitch_cv', 'yolox'])
              const engine = allowedEngines.has(body.engine) ? body.engine : 'pitch_cv'
              const allowedBrowsers = new Set(['chrome', 'edge', 'firefox', 'brave', 'opera'])
              const rawBrowser =
                typeof body.cookiesFromBrowser === 'string'
                  ? body.cookiesFromBrowser.trim().toLowerCase()
                  : ''
              const cookiesFromBrowser = allowedBrowsers.has(rawBrowser) ? rawBrowser : ''
              const teamA = typeof body.teamA === 'string' ? body.teamA.trim().slice(0, 80) : ''
              const teamB = typeof body.teamB === 'string' ? body.teamB.trim().slice(0, 80) : ''
              const pyExecutable = process.env.BALLR_PYTHON || 'python'

              activeRun = true
              cancelRequested = false
              const jobStartedAt = Date.now()
              activeProgress = {
                stage: 'download',
                pct: 4,
                detail: 'Menyiapkan unduhan segmen YouTube...',
                period: segments[0]?.period || 1,
                segmentIndex: 1,
                totalSegments: segments.length,
                startedAt: jobStartedAt
              }
              try {
                const segOutputs = []
                let combinedStdout = ''

                for (let idx = 0; idx < segments.length; idx++) {
                  if (cancelRequested) {
                    throw { status: 499, cancelled: true, message: 'Analisis YouTube dibatalkan.' }
                  }
                  const seg = segments[idx]
                  const segDur = Math.max(10, seg.endSec - seg.startSec)
                  // Sesuaikan FPS otomatis untuk segmen panjang (mis. 45 menit penuh) agar tetap cepat
                  const segFps =
                    segDur > 1200
                      ? Math.min(requestedFps, 0.35)
                      : segDur > 300
                        ? Math.min(requestedFps, 0.75)
                        : requestedFps
                  const segOutPath =
                    segments.length === 1
                      ? latestAnalysisPath
                      : path.join(visionDir, `ballr_analysis_p${seg.period}.json`)
                  activeProgress = {
                    stage: 'download',
                    pct: Math.round((idx / segments.length) * 100) + 5,
                    detail: `Babak ${seg.period}: Mengunduh segmen video YouTube...`,
                    period: seg.period,
                    segmentIndex: idx + 1,
                    totalSegments: segments.length,
                    startedAt: jobStartedAt
                  }
                  const segRes = await runPythonSegment({
                    pyExecutable,
                    pythonScriptPath,
                    visionDir,
                    rawUrl,
                    engine,
                    fps: segFps,
                    ownCluster,
                    cookiesFromBrowser,
                    teamA,
                    teamB,
                    seg,
                    segOutPath,
                    onSpawn: (child) => {
                      activeChild = child
                    },
                    onProgress: (p) => {
                      const base = (idx / segments.length) * 100
                      const span = 100 / segments.length
                      const combinedPct = Math.min(99, Math.round(base + ((Number(p?.pct) || 0) / 100) * span))
                      activeProgress = {
                        stage: p?.stage || 'analyze',
                        pct: combinedPct,
                        detail: `Babak ${seg.period}: ${p?.detail || 'Memproses video...'}`,
                        processed: p?.processed,
                        total: p?.total,
                        period: seg.period,
                        segmentIndex: idx + 1,
                        totalSegments: segments.length,
                        startedAt: jobStartedAt
                      }
                    }
                  })
                  activeChild = null
                  if (cancelRequested) {
                    throw { status: 499, cancelled: true, message: 'Analisis YouTube dibatalkan.' }
                  }
                  segOutputs.push({ seg, data: segRes.data })
                  combinedStdout += segRes.stdout
                }

                let finalData
                if (segOutputs.length === 1) {
                  finalData = segOutputs[0].data
                  finalData.source = {
                    type: 'youtube_local',
                    segments: segments.map((s) => ({
                      period: s.period,
                      start_s: s.startSec,
                      end_s: s.endSec,
                      flip_pitch: s.flipPitch
                    }))
                  }
                  fs.writeFileSync(latestAnalysisPath, JSON.stringify(finalData, null, 2), 'utf-8')
                } else {
                  let counter = 1
                  const mergedEvents = []
                  const mergedPlayersMap = new Map()
                  const mergedPlayerSources = new Set()
                  let totalFramesProcessed = 0
                  let totalVideoFrames = 0
                  let totalElapsed = 0
                  let weightedBallHits = 0
                  let weightedPlayers = 0

                  for (const { data } of segOutputs) {
                    const vq = data.vision_quality || {}
                    const fp = Number(vq.frames_processed) || 0
                    totalFramesProcessed += fp
                    totalVideoFrames += Number(vq.total_video_frames) || 0
                    totalElapsed += Number(vq.elapsed_s) || 0
                    weightedBallHits += ((Number(vq.ball_detection_rate_pct) || 0) / 100) * fp
                    weightedPlayers += (Number(vq.avg_players_detected) || 0) * fp

                    for (const dp of data.detected_players || []) {
                      const k = String(dp?.name || '').toLowerCase()
                      if (k && !mergedPlayersMap.has(k)) {
                        mergedPlayersMap.set(k, dp)
                      }
                    }
                    for (const src of data.player_detection?.sources_used || []) {
                      mergedPlayerSources.add(src)
                    }

                    for (const evt of data.events || []) {
                      const newId = `vision-evt-${String(counter++).padStart(4, '0')}`
                      mergedEvents.push({
                        ...evt,
                        id: newId,
                        client_event_id: newId
                      })
                    }
                  }

                  const mergedDetectedPlayers = Array.from(mergedPlayersMap.values())
                  const baseVq = segOutputs[0].data.vision_quality || {}
                  finalData = {
                    schema: 'ballr-vision-v1',
                    generated_at: new Date().toISOString(),
                    source: {
                      type: 'youtube_local',
                      segments: segments.map((s) => ({
                        period: s.period,
                        start_s: s.startSec,
                        end_s: s.endSec,
                        flip_pitch: s.flipPitch
                      }))
                    },
                    vision_quality: {
                      frames_processed: totalFramesProcessed,
                      total_video_frames: totalVideoFrames,
                      elapsed_s: Number(totalElapsed.toFixed(2)),
                      ball_detection_rate_pct: Number(
                        ((weightedBallHits / Math.max(1, totalFramesProcessed)) * 100).toFixed(1)
                      ),
                      avg_players_detected: Number(
                        (weightedPlayers / Math.max(1, totalFramesProcessed)).toFixed(1)
                      ),
                      detected_players_count: mergedDetectedPlayers.length,
                      player_name_sources: Array.from(mergedPlayerSources),
                      segments_analyzed: segments.length,
                      model: baseVq.model || 'BallR Pitch-Aware CV',
                      disclaimer:
                        baseVq.disclaimer ||
                        'Hasil estimasi otomatis dari 1 kamera; wajib ditinjau pelatih sebelum dijadikan laporan resmi.'
                    },
                    detected_players: mergedDetectedPlayers,
                    player_detection: {
                      sources_used: Array.from(mergedPlayerSources),
                      detected_count: mergedDetectedPlayers.length
                    },
                    events: mergedEvents
                  }
                  fs.writeFileSync(latestAnalysisPath, JSON.stringify(finalData, null, 2), 'utf-8')
                }

                sendJson(res, 200, {
                  ok: true,
                  source: 'vision/ballr_analysis.json',
                  segments,
                  data: finalData,
                  stdout_tail: combinedStdout.slice(-500)
                })
              } catch (err) {
                sendJson(res, err?.status || 500, {
                  ok: false,
                  cancelled: Boolean(err?.cancelled || cancelRequested),
                  error: err?.message || 'Gagal menjalankan analisis YouTube lokal.',
                  exit_code: err?.exit_code,
                  stderr_tail: err?.stderr_tail,
                  error_detail: err?.error_detail
                })
              } finally {
                activeRun = false
                activeChild = null
                cancelRequested = false
                activeProgress = null
              }
            })
            .catch((err) => {
              sendJson(res, 400, {
                ok: false,
                error: err.message || 'Permintaan tidak valid.'
              })
            })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ballrVisionLocalApiPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'react-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor'
            }
            if (id.includes('html-to-image')) {
              return 'export-vendor'
            }
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    testTimeout: 15000,
    env: {
      VITE_DEMO_MODE: '',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: ''
    }
  }
})
