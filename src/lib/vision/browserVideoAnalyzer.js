/**
 * ==============================================================================
 * BallR Browser Video Analyzer (In-Browser MP4/WebM Pitch-Aware Computer Vision)
 * ==============================================================================
 * Menganalisis berkas video pertandingan (.mp4/.webm) langsung di browser
 * tanpa mengunggah video ke server eksternal.
 *
 * Alur kerja deterministik (tanpa angka acak):
 * 1. Sample frame video pada resolusi ringan (lebar default 320px) via Canvas 2D.
 * 2. Segmentasi area rumput lapangan berbasis HSV untuk menyaring tribun/papan skor.
 * 3. Ekstraksi blob pemain non-rumput di dalam lapangan (saring garis putih tipis).
 * 4. Pelacakan posisi pemain lintas frame berbasis jarak centroid & IoU ringan.
 * 5. Pemisahan 2 tim menggunakan K-Means deterministik (berdasarkan warna jersey).
 * 6. Deteksi bola berbasis gerak + kontras terang kecil di sekitar pemain/jalur bola.
 * 7. Inferensi kejadian (pass, ball_loss, ball_recovery, shot) sesuai skema ballr-vision-v1.
 */

const ANALYSIS_WIDTH = 400;
const DEFAULT_SAMPLE_FPS = 1.0;
const DEFAULT_MAX_DURATION_SEC = 180;
const DEFAULT_MAX_FRAMES = 75;

/**
 * Mengurai format waktu "MM:SS", "HH:MM:SS", atau angka detik menjadi total detik.
 * Mengembalikan null bila kosong atau tidak valid.
 */
export function parseTimecodeToSeconds(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? Math.floor(input) : null;
  }
  const str = String(input).trim();
  if (!str) return null;

  if (/^\d+(?:\.\d+)?$/.test(str)) {
    const val = Number(str);
    return Number.isFinite(val) && val >= 0 ? Math.floor(val) : null;
  }

  const parts = str.split(':').map((p) => p.trim());
  if (parts.length === 2 || parts.length === 3) {
    const nums = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
    if (parts.length === 2) {
      const [mm, ss] = nums;
      if (ss >= 60) return null;
      return mm * 60 + ss;
    }
    const [hh, mm, ss] = nums;
    if (mm >= 60 || ss >= 60) return null;
    return hh * 3600 + mm * 60 + ss;
  }

  return null;
}

/**
 * Memformat total detik menjadi "MM:SS" (atau "H:MM:SS" jika >= 1 jam).
 */
export function formatSecondsToTimecode(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(Number(totalSeconds))) {
    return '';
  }
  const s = Math.max(0, Math.floor(Number(totalSeconds)));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hh > 0) return `${hh}:${pad(mm)}:${pad(ss)}`;
  return `${pad(mm)}:${pad(ss)}`;
}

/**
 * Menyusun daftar segmen Babak 1 & (opsional) Babak 2 dari input pengguna.
 * Memvalidasi agar waktu akhir > waktu mulai dan mengembalikan segmen siap pakai.
 */
export function buildMatchSegments(config = {}, options = {}) {
  const defaultDurationSec = Math.max(10, Number(options.defaultDurationSec) || 60);
  const maxDurationSec = options.maxVideoDurationSec != null ? Number(options.maxVideoDurationSec) : null;
  const halfDurationMin = Math.max(10, Number(config.halfDurationMin) || 45);
  const flipHalf2 = config.flipHalf2 !== false;

  const h1StartParsed = parseTimecodeToSeconds(config.half1Start);
  const h1EndParsed = parseTimecodeToSeconds(config.half1End);

  const hasH1StartText = String(config.half1Start ?? '').trim() !== '';
  const hasH1EndText = String(config.half1End ?? '').trim() !== '';

  if (hasH1StartText && h1StartParsed === null) {
    throw new Error('Format waktu mulai Babak 1 tidak valid. Gunakan MM:SS (contoh 01:10) atau detik.');
  }
  if (hasH1EndText && h1EndParsed === null) {
    throw new Error('Format waktu selesai Babak 1 tidak valid. Gunakan MM:SS (contoh 01:30) atau detik.');
  }

  const start1 = h1StartParsed ?? 0;
  let end1 = h1EndParsed;
  if (end1 === null) {
    end1 = maxDurationSec != null ? Math.min(maxDurationSec, start1 + defaultDurationSec) : start1 + defaultDurationSec;
  } else if (maxDurationSec != null) {
    end1 = Math.min(maxDurationSec, end1);
  }

  if (end1 <= start1) {
    throw new Error('Waktu selesai Babak 1 harus lebih besar daripada waktu mulai Babak 1.');
  }

  const segments = [
    {
      period: 1,
      startSec: start1,
      endSec: end1,
      startMinute: 0,
      flipPitch: false
    }
  ];

  if (config.enableHalf2) {
    const h2StartParsed = parseTimecodeToSeconds(config.half2Start);
    const h2EndParsed = parseTimecodeToSeconds(config.half2End);
    const hasH2StartText = String(config.half2Start ?? '').trim() !== '';
    const hasH2EndText = String(config.half2End ?? '').trim() !== '';

    if (!hasH2StartText || h2StartParsed === null) {
      throw new Error('Waktu mulai Babak 2 wajib diisi dengan format MM:SS (contoh 46:00) saat Babak 2 aktif.');
    }
    if (hasH2EndText && h2EndParsed === null) {
      throw new Error('Format waktu selesai Babak 2 tidak valid. Gunakan MM:SS atau detik.');
    }

    const start2 = h2StartParsed;
    let end2 = h2EndParsed;
    if (end2 === null) {
      end2 = maxDurationSec != null ? Math.min(maxDurationSec, start2 + defaultDurationSec) : start2 + defaultDurationSec;
    } else if (maxDurationSec != null) {
      end2 = Math.min(maxDurationSec, end2);
    }

    if (end2 <= start2) {
      throw new Error('Waktu selesai Babak 2 harus lebih besar daripada waktu mulai Babak 2.');
    }

    segments.push({
      period: 2,
      startSec: start2,
      endSec: end2,
      startMinute: halfDurationMin,
      flipPitch: flipHalf2
    });
  }

  return segments;
}

/**
 * Konversi RGB (0..255) ke HSV skala OpenCV-like: H [0..180], S [0..255], V [0..255].
 */
export function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let hDeg = 0;
  if (delta > 1e-6) {
    if (max === rn) {
      hDeg = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      hDeg = 60 * ((bn - rn) / delta + 2);
    } else {
      hDeg = 60 * ((rn - gn) / delta + 4);
    }
    if (hDeg < 0) hDeg += 360;
  }

  const s = max <= 1e-6 ? 0 : delta / max;
  return [hDeg * 0.5, s * 255, max * 255];
}

function isGrassHsv(h, s, v) {
  return h >= 26 && h <= 92 && s >= 34 && v >= 35;
}

function isWhiteLineHsv(s, v) {
  return s <= 52 && v >= 182;
}

/**
 * Connected components 4-connectivity ringan pada binary mask (Uint8Array 0/1).
 */
function findBlobs(mask, width, height, minArea, maxArea) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const blobs = [];

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const start = rowOffset + x;
      if (mask[start] === 0 || visited[start] === 1) continue;

      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      visited[start] = 1;

      let area = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      while (head < tail) {
        const idx = queue[head++];
        const cx = idx % width;
        const cy = (idx - cx) / width;

        area++;
        sumX += cx;
        sumY += cy;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        if (cx > 0) {
          const left = idx - 1;
          if (mask[left] === 1 && visited[left] === 0) {
            visited[left] = 1;
            queue[tail++] = left;
          }
        }
        if (cx + 1 < width) {
          const right = idx + 1;
          if (mask[right] === 1 && visited[right] === 0) {
            visited[right] = 1;
            queue[tail++] = right;
          }
        }
        if (cy > 0) {
          const up = idx - width;
          if (mask[up] === 1 && visited[up] === 0) {
            visited[up] = 1;
            queue[tail++] = up;
          }
        }
        if (cy + 1 < height) {
          const down = idx + width;
          if (mask[down] === 1 && visited[down] === 0) {
            visited[down] = 1;
            queue[tail++] = down;
          }
        }
      }

      if (area >= minArea && area <= maxArea) {
        blobs.push({
          x1: minX,
          y1: minY,
          x2: maxX + 1,
          y2: maxY + 1,
          w: maxX - minX + 1,
          h: maxY - minY + 1,
          area,
          cx: sumX / area,
          cy: sumY / area
        });
      }
    }
  }

  return blobs;
}

/**
 * Ekstraksi warna jersey (median RGB non-rumput pada area dada-torso).
 */
function extractJerseyRgb(rgba, width, height, box) {
  const bw = Math.max(1, box.x2 - box.x1);
  const bh = Math.max(1, box.y2 - box.y1);
  const top = Math.max(0, Math.floor(box.y1 + bh * 0.14));
  const bottom = Math.min(height, Math.ceil(box.y1 + bh * 0.58));
  const left = Math.max(0, Math.floor(box.x1 + bw * 0.15));
  const right = Math.min(width, Math.ceil(box.x2 - bw * 0.15));

  const rList = [];
  const gList = [];
  const bList = [];

  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const p = (y * width + x) * 4;
      const r = rgba[p];
      const g = rgba[p + 1];
      const b = rgba[p + 2];
      const [h, s, v] = rgbToHsv(r, g, b);
      if (!isGrassHsv(h, s, v)) {
        rList.push(r);
        gList.push(g);
        bList.push(b);
      }
    }
  }

  if (rList.length < 3) return null;
  rList.sort((a, b) => a - b);
  gList.sort((a, b) => a - b);
  bList.sort((a, b) => a - b);
  const mid = Math.floor(rList.length / 2);
  return [rList[mid], gList[mid], bList[mid]];
}

/**
 * K-Means 2 klaster deterministik murni untuk memisahkan 2 warna jersey tim.
 * Diurutkan berdasarkan luminansi (klaster 0 = lebih gelap, klaster 1 = lebih terang).
 */
export function fitKMeans2Deterministic(samples, maxIter = 30) {
  if (!Array.isArray(samples) || samples.length < 8) return null;

  const mean = [0, 0, 0];
  for (let i = 0; i < samples.length; i++) {
    mean[0] += samples[i][0];
    mean[1] += samples[i][1];
    mean[2] += samples[i][2];
  }
  mean[0] /= samples.length;
  mean[1] /= samples.length;
  mean[2] /= samples.length;

  const distSq = (a, b) =>
    (a[0] - b[0]) * (a[0] - b[0]) +
    (a[1] - b[1]) * (a[1] - b[1]) +
    (a[2] - b[2]) * (a[2] - b[2]);

  let c0 = samples[0].slice();
  let bestMeanDist = -1;
  for (let i = 0; i < samples.length; i++) {
    const d = distSq(samples[i], mean);
    if (d > bestMeanDist) {
      bestMeanDist = d;
      c0 = samples[i].slice();
    }
  }

  let c1 = samples[0].slice();
  let bestC0Dist = -1;
  for (let i = 0; i < samples.length; i++) {
    const d = distSq(samples[i], c0);
    if (d > bestC0Dist) {
      bestC0Dist = d;
      c1 = samples[i].slice();
    }
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const sum0 = [0, 0, 0];
    const sum1 = [0, 0, 0];
    let n0 = 0;
    let n1 = 0;

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (distSq(s, c0) <= distSq(s, c1)) {
        sum0[0] += s[0];
        sum0[1] += s[1];
        sum0[2] += s[2];
        n0++;
      } else {
        sum1[0] += s[0];
        sum1[1] += s[1];
        sum1[2] += s[2];
        n1++;
      }
    }

    const next0 = n0 > 0 ? [sum0[0] / n0, sum0[1] / n0, sum0[2] / n0] : c0;
    const next1 = n1 > 0 ? [sum1[0] / n1, sum1[1] / n1, sum1[2] / n1] : c1;

    const shift = Math.sqrt(distSq(next0, c0)) + Math.sqrt(distSq(next1, c1));
    c0 = next0;
    c1 = next1;
    if (shift < 0.05) break;
  }

  const lum = (c) => c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
  return lum(c0) <= lum(c1) ? [c0, c1] : [c1, c0];
}

export function predictJerseyCluster(centroids, color) {
  if (!centroids || !color) return 0;
  const d0 = Math.hypot(color[0] - centroids[0][0], color[1] - centroids[0][1], color[2] - centroids[0][2]);
  const d1 = Math.hypot(color[0] - centroids[1][0], color[1] - centroids[1][1], color[2] - centroids[1][2]);
  return d0 <= d1 ? 0 : 1;
}

/**
 * Analisis satu frame RGBA untuk mendeteksi batas lapangan, pemain, dan kandidat bola.
 * Dapat dipanggil baik dari browser Canvas maupun unit test murni.
 */
export function analyzeFrameRgba(rgba, width, height, prevGray = null, lastBall = null) {
  const totalPixels = width * height;
  const grassMask = new Uint8Array(totalPixels);
  const gray = new Uint8Array(totalPixels);
  const whiteMask = new Uint8Array(totalPixels);
  const topIgnoreY = Math.floor(height * 0.12);

  let grassPixels = 0;
  let pitchMinX = width;
  let pitchMaxX = 0;
  let pitchMinY = height;
  let pitchMaxY = 0;

  for (let y = 0; y < height; y++) {
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOff + x;
      const p = idx * 4;
      const r = rgba[p];
      const g = rgba[p + 1];
      const b = rgba[p + 2];

      gray[idx] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
      const [h, s, v] = rgbToHsv(r, g, b);

      if (y >= topIgnoreY && isGrassHsv(h, s, v)) {
        grassMask[idx] = 1;
        grassPixels++;
        if (x < pitchMinX) pitchMinX = x;
        if (x > pitchMaxX) pitchMaxX = x;
        if (y < pitchMinY) pitchMinY = y;
        if (y > pitchMaxY) pitchMaxY = y;
      } else if (isWhiteLineHsv(s, v)) {
        whiteMask[idx] = 1;
      }
    }
  }

  const grassCoverage = grassPixels / Math.max(1, totalPixels);
  if (grassCoverage < 0.08 || pitchMaxX <= pitchMinX || pitchMaxY <= pitchMinY) {
    return {
      pitchBbox: [0, topIgnoreY, width, height],
      players: [],
      ball: null,
      gray,
      grassCoverage
    };
  }

  // Sedikit margin ke dalam agar papan iklan di tepi lapangan tidak masuk
  const padX = Math.max(2, Math.floor((pitchMaxX - pitchMinX) * 0.02));
  const padY = Math.max(2, Math.floor((pitchMaxY - pitchMinY) * 0.03));
  const bx1 = Math.min(width - 1, pitchMinX + padX);
  const by1 = Math.min(height - 1, pitchMinY + padY);
  const bx2 = Math.max(bx1 + 1, pitchMaxX - padX);
  const by2 = Math.max(by1 + 1, pitchMaxY - padY);

  const playerFg = new Uint8Array(totalPixels);
  const ballCandMask = new Uint8Array(totalPixels);

  for (let y = by1; y < by2; y++) {
    const rowOff = y * width;
    for (let x = bx1; x < bx2; x++) {
      const idx = rowOff + x;
      if (grassMask[idx] === 1) continue;

      // Saring garis lapangan horizontal/vertikal tipis berwarna putih
      if (whiteMask[idx] === 1) {
        const horizRun =
          x >= 3 && x + 3 < width &&
          whiteMask[idx - 3] === 1 && whiteMask[idx - 2] === 1 && whiteMask[idx - 1] === 1 &&
          whiteMask[idx + 1] === 1 && whiteMask[idx + 2] === 1 && whiteMask[idx + 3] === 1;
        const vertRun =
          y >= 3 && y + 3 < height &&
          whiteMask[idx - width * 2] === 1 && whiteMask[idx - width] === 1 &&
          whiteMask[idx + width] === 1 && whiteMask[idx + width * 2] === 1;
        if (!horizRun && !vertRun) {
          playerFg[idx] = 1;
        }
      } else {
        playerFg[idx] = 1;
      }

      if (prevGray !== null) {
        const diff = Math.abs(gray[idx] - prevGray[idx]);
        if (diff >= 15 && gray[idx] >= 135) {
          ballCandMask[idx] = 1;
        }
      }
    }
  }

  const scale = width / 320;
  const minPlayerArea = Math.max(5, Math.floor(6 * scale * scale));
  const maxPlayerArea = Math.floor(380 * scale * scale);
  const minH = Math.max(4, Math.floor(5 * scale));
  const maxH = Math.floor(42 * scale);
  const minW = Math.max(2, Math.floor(2 * scale));
  const maxW = Math.floor(26 * scale);

  const rawPlayerBlobs = findBlobs(playerFg, width, height, minPlayerArea, maxPlayerArea);
  const players = [];
  for (let i = 0; i < rawPlayerBlobs.length; i++) {
    const b = rawPlayerBlobs[i];
    if (b.h < minH || b.h > maxH || b.w < minW || b.w > maxW) continue;
    const aspect = b.h / Math.max(1, b.w);
    if (aspect < 0.75 || aspect > 4.6) continue;
    const color = extractJerseyRgb(rgba, width, height, b);
    players.push({
      x1: b.x1,
      y1: b.y1,
      x2: b.x2,
      y2: b.y2,
      px: (b.x1 + b.x2) * 0.5,
      py: b.y2,
      color
    });
  }

  // Deteksi bola: blob kecil terang yang bergerak, diprioritaskan dekat pemain atau posisi bola sebelumnya
  let ball = null;
  if (prevGray !== null) {
    const rawBallBlobs = findBlobs(
      ballCandMask,
      width,
      height,
      Math.max(2, Math.floor(2 * scale * scale)),
      Math.max(18, Math.floor(22 * scale * scale))
    );
    let bestScore = -1;
    for (let i = 0; i < rawBallBlobs.length; i++) {
      const b = rawBallBlobs[i];
      if (b.w > Math.ceil(9 * scale) || b.h > Math.ceil(9 * scale)) continue;
      const ratio = Math.max(b.w, b.h) / Math.max(1, Math.min(b.w, b.h));
      if (ratio > 2.0) continue;

      let score = 1.0 / (ratio + 0.15);
      if (lastBall) {
        const dPrev = Math.hypot(b.cx - lastBall[0], b.cy - lastBall[1]);
        if (dPrev < 55 * scale) {
          score += 2.0 * (1 - dPrev / (55 * scale));
        }
      }
      if (players.length > 0) {
        let minPlayerDist = Infinity;
        for (let j = 0; j < players.length; j++) {
          const d = Math.hypot(b.cx - players[j].px, b.cy - players[j].py);
          if (d < minPlayerDist) minPlayerDist = d;
        }
        if (minPlayerDist < 38 * scale) {
          score += 1.6 * (1 - minPlayerDist / (38 * scale));
        }
      }

      if (score > bestScore) {
        bestScore = score;
        ball = [b.cx, b.cy];
      }
    }
  }

  return {
    pitchBbox: [bx1, by1, bx2, by2],
    players,
    ball,
    gray,
    grassCoverage
  };
}

function mapPixelToPitch(px, py, pitchBbox, pitchLengthM, pitchWidthM) {
  const [bx1, by1, bx2, by2] = pitchBbox;
  const pw = Math.max(1, bx2 - bx1);
  const ph = Math.max(1, by2 - by1);
  const nx = (px - bx1) / pw;
  const ny = (py - by1) / ph;
  const x_m = Number(Math.max(0, Math.min(pitchLengthM, nx * pitchLengthM)).toFixed(1));
  const y_m = Number(Math.max(0, Math.min(pitchWidthM, ny * pitchWidthM)).toFixed(1));
  return [x_m, y_m];
}

class SimpleCentroidTracker {
  constructor(maxLost = 6, maxDistPx = 22) {
    this.nextId = 1;
    this.tracks = new Map();
    this.maxLost = maxLost;
    this.maxDistPx = maxDistPx;
  }

  update(players) {
    const assigned = new Set();
    const out = [];

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      let bestId = null;
      let bestDist = this.maxDistPx;

      for (const [tid, track] of this.tracks.entries()) {
        if (assigned.has(tid)) continue;
        const d = Math.hypot(p.px - track.px, p.py - track.py);
        if (d <= bestDist) {
          bestDist = d;
          bestId = tid;
        }
      }

      if (bestId === null) {
        bestId = this.nextId++;
      }
      assigned.add(bestId);
      this.tracks.set(bestId, { px: p.px, py: p.py, lost: 0 });
      out.push({ ...p, id: bestId });
    }

    for (const [tid, track] of this.tracks.entries()) {
      if (!assigned.has(tid)) {
        track.lost += 1;
        if (track.lost > this.maxLost) {
          this.tracks.delete(tid);
        }
      }
    }

    return out;
  }
}

/**
 * Mengonversi rangkaian frame terdeteksi menjadi daftar kejadian skema ballr-vision-v1.
 */
export function inferEventsFromFrameRecords(frameRecords, options = {}) {
  const pitchLengthM = Number(options.pitchLengthM) || 90;
  const pitchWidthM = Number(options.pitchWidthM) || 60;
  const period = Number(options.period) || 1;
  const ownCluster = Number(options.ownCluster) === 1 ? 1 : 0;
  const frameWidth = Number(options.frameWidth) || ANALYSIS_WIDTH;
  const frameHeight = Number(options.frameHeight) || 180;

  const jerseySamples = [];
  for (let i = 0; i < frameRecords.length; i++) {
    const players = frameRecords[i].players || [];
    for (let j = 0; j < players.length; j++) {
      if (players[j].color) jerseySamples.push(players[j].color);
    }
  }

  const centroids = fitKMeans2Deterministic(jerseySamples);
  const events = [];
  let prevOwner = null;
  let evtCounter = 1;
  const maxBallOwnerDistPx = Math.max(frameWidth, frameHeight) * 0.16;

  for (let i = 0; i < frameRecords.length; i++) {
    const rec = frameRecords[i];
    if (!rec.ball || !rec.players || rec.players.length === 0) continue;

    const [bx, by] = rec.ball;
    let nearest = rec.players[0];
    let nearestDist = Math.hypot(nearest.px - bx, nearest.py - by);
    for (let j = 1; j < rec.players.length; j++) {
      const cand = rec.players[j];
      const d = Math.hypot(cand.px - bx, cand.py - by);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = cand;
      }
    }

    if (nearestDist > maxBallOwnerDistPx) continue;

    const cluster = predictJerseyCluster(centroids, nearest.color);
    const team = cluster === ownCluster ? 'own' : 'opponent';
    let [x_m, y_m] = mapPixelToPitch(bx, by, rec.pitchBbox, pitchLengthM, pitchWidthM);
    if (rec.flipPitch) {
      x_m = Number(Math.max(0, Math.min(pitchLengthM, pitchLengthM - x_m)).toFixed(1));
      y_m = Number(Math.max(0, Math.min(pitchWidthM, pitchWidthM - y_m)).toFixed(1));
    }

    const recPeriod = Number(rec.period) || period;
    if (prevOwner && prevOwner.period !== recPeriod) {
      prevOwner = null;
    }

    if (prevOwner) {
      const movedM = Math.hypot(x_m - prevOwner.x_m, y_m - prevOwner.y_m);
      const dt = Math.max(0.25, rec.video_time_s - prevOwner.video_time_s);
      const speedMps = movedM / dt;

      const inOwnTargetBox =
        team === 'own' &&
        x_m >= pitchLengthM * 0.82 &&
        Math.abs(y_m - pitchWidthM * 0.5) <= pitchWidthM * 0.3;
      const inOppTargetBox =
        team === 'opponent' &&
        x_m <= pitchLengthM * 0.18 &&
        Math.abs(y_m - pitchWidthM * 0.5) <= pitchWidthM * 0.3;

      if ((inOwnTargetBox || inOppTargetBox) && movedM >= 6.0 && speedMps >= 8.0) {
        const id = `browser-evt-${String(evtCounter++).padStart(4, '0')}`;
        events.push({
          id,
          client_event_id: id,
          period: recPeriod,
          minute: prevOwner.minute,
          team: prevOwner.team,
          player_id: null,
          player_number: prevOwner.team === 'own' ? ((prevOwner.tid % 11) + 1) : null,
          opponent_number: prevOwner.team === 'opponent' ? (prevOwner.tid % 98) + 1 : null,
          event_type: 'shot',
          outcome: 'fail',
          x_m: prevOwner.x_m,
          y_m: prevOwner.y_m,
          end_x_m: x_m,
          end_y_m: y_m,
          video_time_s: prevOwner.video_time_s,
          note: 'Estimasi tembakan ke kotak penalti · browser-vision'
        });
      } else if (team === prevOwner.team && movedM >= 4.0) {
        const id = `browser-evt-${String(evtCounter++).padStart(4, '0')}`;
        events.push({
          id,
          client_event_id: id,
          period: recPeriod,
          minute: prevOwner.minute,
          team,
          player_id: null,
          player_number: team === 'own' ? ((prevOwner.tid % 11) + 1) : null,
          opponent_number: team === 'opponent' ? (nearest.id % 98) + 1 : null,
          event_type: 'pass',
          outcome: 'success',
          x_m: prevOwner.x_m,
          y_m: prevOwner.y_m,
          end_x_m: x_m,
          end_y_m: y_m,
          video_time_s: prevOwner.video_time_s,
          note: 'Estimasi umpan antar pemain · browser-vision'
        });
      } else if (team !== prevOwner.team) {
        const lossId = `browser-evt-${String(evtCounter++).padStart(4, '0')}`;
        events.push({
          id: lossId,
          client_event_id: lossId,
          period: recPeriod,
          minute: prevOwner.minute,
          team: prevOwner.team,
          player_id: null,
          player_number: prevOwner.team === 'own' ? ((prevOwner.tid % 11) + 1) : null,
          opponent_number: prevOwner.team === 'opponent' ? (prevOwner.tid % 98) + 1 : null,
          event_type: 'ball_loss',
          outcome: 'fail',
          x_m: prevOwner.x_m,
          y_m: prevOwner.y_m,
          end_x_m: null,
          end_y_m: null,
          video_time_s: prevOwner.video_time_s,
          note: 'Estimasi kehilangan penguasaan · browser-vision'
        });

        const recId = `browser-evt-${String(evtCounter++).padStart(4, '0')}`;
        events.push({
          id: recId,
          client_event_id: recId,
          period: recPeriod,
          minute: rec.minute,
          team,
          player_id: null,
          player_number: team === 'own' ? ((nearest.id % 11) + 1) : null,
          opponent_number: team === 'opponent' ? (nearest.id % 98) + 1 : null,
          event_type: 'ball_recovery',
          outcome: 'success',
          x_m,
          y_m,
          end_x_m: null,
          end_y_m: null,
          video_time_s: rec.video_time_s,
          note: 'Estimasi perebutan bola · browser-vision'
        });
      }
    }

    prevOwner = {
      period: recPeriod,
      team,
      tid: nearest.id,
      x_m,
      y_m,
      minute: rec.minute,
      video_time_s: rec.video_time_s
    };
  }

  return events;
}

function waitForEvent(target, eventName, signal, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Analisis dibatalkan oleh pengguna.', 'AbortError'));
      return;
    }

    let timer = null;
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Gagal memuat atau memproses berkas video di browser.'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Analisis dibatalkan oleh pengguna.', 'AbortError'));
    };
    const cleanup = () => {
      if (timer !== null) clearTimeout(timer);
      target.removeEventListener(eventName, onSuccess);
      target.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Waktu tunggu video habis (${eventName}). Pastikan codec MP4/WebM didukung browser.`));
      }, timeoutMs);
    }

    target.addEventListener(eventName, onSuccess, { once: true });
    target.addEventListener('error', onError, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Menganalisis berkas MP4/WebM langsung di browser dan menghasilkan JSON ballr-vision-v1.
 *
 * @param {File|Blob} file
 * @param {Object} [options]
 * @param {number} [options.pitchLengthM=90]
 * @param {number} [options.pitchWidthM=60]
 * @param {number} [options.sampleFps=1.5]
 * @param {number} [options.startSec=0]
 * @param {number} [options.maxDurationSec=90]
 * @param {number} [options.period=1]
 * @param {number} [options.startMinute=0]
 * @param {number} [options.ownCluster=0]
 * @param {Function} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 */
export async function analyzeVideoFileInBrowser(file, options = {}) {
  if (!file) {
    throw new Error('Berkas video belum dipilih.');
  }
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Analisis video langsung hanya dapat dijalankan pada lingkungan browser.');
  }

  const pitchLengthM = Number(options.pitchLengthM) || 90;
  const pitchWidthM = Number(options.pitchWidthM) || 60;
  const sampleFps = Math.max(0.5, Math.min(4, Number(options.sampleFps) || DEFAULT_SAMPLE_FPS));
  const startSecReq = Math.max(0, Number(options.startSec) || 0);
  const maxDurationSec = Math.max(5, Math.min(300, Number(options.maxDurationSec) || DEFAULT_MAX_DURATION_SEC));
  const maxFrames = Math.max(15, Math.min(180, Number(options.maxFrames) || DEFAULT_MAX_FRAMES));
  const period = Number(options.period) || 1;
  const startMinute = Number(options.startMinute) || 0;
  const ownCluster = Number(options.ownCluster) === 1 ? 1 : 0;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const signal = options.signal || null;

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = objectUrl;

  try {
    onProgress?.({ pct: 2, stage: 'Membaca metadata video...', framesProcessed: 0, currentSec: 0, totalSec: 0 });
    await waitForEvent(video, 'loadeddata', signal, 20000);

    const rawDuration = Number(video.duration);
    if (!Number.isFinite(rawDuration) || rawDuration <= 0) {
      throw new Error('Durasi video tidak valid atau format video tidak didukung oleh browser ini.');
    }

    // Normalisasi segmen (Babak 1 & opsional Babak 2)
    let activeSegments = [];
    if (Array.isArray(options.segments) && options.segments.length > 0) {
      activeSegments = options.segments
        .map((seg, idx) => {
          const s = Math.max(0, Math.min(rawDuration - 0.2, Number(seg.startSec) || 0));
          const requestedEnd =
            seg.endSec != null && Number.isFinite(Number(seg.endSec))
              ? Number(seg.endSec)
              : s + maxDurationSec;
          const e = Math.min(rawDuration, Math.max(s + 0.5, requestedEnd));
          return {
            period: Number(seg.period) === 2 ? 2 : idx === 0 ? 1 : 2,
            startSec: s,
            endSec: e,
            startMinute:
              seg.startMinute != null && Number.isFinite(Number(seg.startMinute))
                ? Number(seg.startMinute)
                : Number(seg.period) === 2
                  ? 45
                  : 0,
            flipPitch: Boolean(seg.flipPitch)
          };
        })
        .filter((seg) => seg.endSec > seg.startSec + 0.1);
    }

    if (activeSegments.length === 0) {
      const startSec = Math.min(startSecReq, Math.max(0, rawDuration - 1));
      const endSec = Math.min(rawDuration, startSec + maxDurationSec);
      activeSegments = [
        {
          period,
          startSec,
          endSec,
          startMinute,
          flipPitch: Boolean(options.flipPitch)
        }
      ];
    }

    const totalSec = Math.max(
      0.5,
      activeSegments.reduce((acc, seg) => acc + Math.max(0.5, seg.endSec - seg.startSec), 0)
    );

    const nativeW = video.videoWidth || 640;
    const nativeH = video.videoHeight || 360;
    const scale = ANALYSIS_WIDTH / Math.max(1, nativeW);
    const canvasW = ANALYSIS_WIDTH;
    const canvasH = Math.max(90, Math.round(nativeH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 2D tidak tersedia pada browser ini.');
    }

    const frameRecords = [];
    let ballHits = 0;
    let totalPlayers = 0;
    let framesProcessed = 0;
    let scannedSecSoFar = 0;

    for (let segIdx = 0; segIdx < activeSegments.length; segIdx++) {
      const seg = activeSegments[segIdx];
      const segDur = Math.max(0.5, seg.endSec - seg.startSec);
      const segFrameBudget = Math.max(
        8,
        Math.round((segDur / totalSec) * maxFrames)
      );
      const stepSec = Math.max(1 / sampleFps, segDur / segFrameBudget);

      // Reset pelacak & deteksi gerak antar babak agar jeda turun minum tidak dianggap operan
      const tracker = new SimpleCentroidTracker();
      let prevGray = null;
      let lastBall = null;

      for (let t = seg.startSec; t <= seg.endSec + 1e-6; t += stepSec) {
        if (signal?.aborted) {
          throw new DOMException('Analisis dibatalkan oleh pengguna.', 'AbortError');
        }

        const targetTime = Math.min(Math.max(0, rawDuration - 0.05), Math.max(0, t));
        if (Math.abs((video.currentTime || 0) - targetTime) > 0.02) {
          const seekPromise = waitForEvent(video, 'seeked', signal, 8000);
          video.currentTime = targetTime;
          await seekPromise;
        }

        ctx.drawImage(video, 0, 0, canvasW, canvasH);
        const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
        const analyzed = analyzeFrameRgba(imageData.data, canvasW, canvasH, prevGray, lastBall);

        const trackedPlayers = tracker.update(analyzed.players);
        prevGray = analyzed.gray;
        if (analyzed.ball) {
          lastBall = analyzed.ball;
          ballHits++;
        }
        totalPlayers += trackedPlayers.length;
        framesProcessed++;

        const videoTimeS = Number(targetTime.toFixed(1));
        const elapsedInHalf = Math.max(0, targetTime - seg.startSec);
        const minute = Number((seg.startMinute + elapsedInHalf / 60).toFixed(1));

        frameRecords.push({
          period: seg.period,
          flipPitch: seg.flipPitch,
          video_time_s: videoTimeS,
          minute,
          ball: analyzed.ball,
          pitchBbox: analyzed.pitchBbox,
          players: trackedPlayers
        });

        const currentProgressSec = scannedSecSoFar + elapsedInHalf;
        const pct = Math.min(96, Math.max(5, Math.round((currentProgressSec / totalSec) * 92) + 4));
        onProgress?.({
          pct,
          stage: `Babak ${seg.period} · Frame ${framesProcessed} (${formatSecondsToTimecode(videoTimeS)})...`,
          framesProcessed,
          currentSec: Number(currentProgressSec.toFixed(1)),
          totalSec: Number(totalSec.toFixed(1))
        });

        // Beri jeda ke event loop agar UI tetap responsif saat memproses banyak frame
        await new Promise((r) => setTimeout(r, 0));
      }

      scannedSecSoFar += segDur;
    }

    onProgress?.({
      pct: 98,
      stage: 'Mengelompokkan jersey tim & menyusun kejadian taktis...',
      framesProcessed,
      currentSec: Number(totalSec.toFixed(1)),
      totalSec: Number(totalSec.toFixed(1))
    });

    const events = inferEventsFromFrameRecords(frameRecords, {
      pitchLengthM,
      pitchWidthM,
      period,
      ownCluster,
      frameWidth: canvasW,
      frameHeight: canvasH
    });

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedS = Number(((t1 - t0) / 1000).toFixed(2));

    const payload = {
      schema: 'ballr-vision-v1',
      generated_at: new Date().toISOString(),
      source: {
        type: 'browser_upload',
        file_name: file.name || 'video-lokal',
        analyzed_range_s: [
          Number(activeSegments[0].startSec.toFixed(1)),
          Number(activeSegments[activeSegments.length - 1].endSec.toFixed(1))
        ],
        segments: activeSegments.map((s) => ({
          period: s.period,
          start_s: Number(s.startSec.toFixed(1)),
          end_s: Number(s.endSec.toFixed(1)),
          flip_pitch: s.flipPitch
        }))
      },
      vision_quality: {
        frames_processed: framesProcessed,
        total_video_frames: Math.round(rawDuration * 25),
        elapsed_s: elapsedS,
        ball_detection_rate_pct: Number(((ballHits / Math.max(1, framesProcessed)) * 100).toFixed(1)),
        avg_players_detected: Number((totalPlayers / Math.max(1, framesProcessed)).toFixed(1)),
        segments_analyzed: activeSegments.length,
        model: 'BallR In-Browser Pitch-Aware CV (Canvas HSV Turf + Centroid Tracker + K-Means Jersey)',
        disclaimer:
          'Hasil estimasi otomatis di browser dari 1 sudut kamera tanpa unggah server; wajib ditinjau pelatih sebelum dijadikan laporan resmi.'
      },
      events
    };

    onProgress?.({
      pct: 100,
      stage: `Selesai (${events.length} kejadian terdeteksi).`,
      framesProcessed,
      currentSec: Number(totalSec.toFixed(1)),
      totalSec: Number(totalSec.toFixed(1))
    });

    return payload;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
