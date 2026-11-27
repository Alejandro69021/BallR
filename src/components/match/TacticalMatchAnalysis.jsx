import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Shield,
  Target,
  Activity,
  Clock,
  BookOpen,
  Download,
  Upload,
  Video,
  Film,
  RotateCcw,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowLeftRight
} from 'lucide-react';
import { buildTacticalSummary, SMALL_SAMPLE_N } from '../../lib/analysis/events';
import { ALLOWED_EVENT_TYPES, generateUUID } from '../../lib/matches';
import {
  analyzeVideoFileInBrowser,
  buildMatchSegments,
  formatSecondsToTimecode,
  parseTimecodeToSeconds
} from '../../lib/vision/browserVideoAnalyzer';
import { extractYouTubeVideoId } from '../../lib/youtube';
import Badge from '../ui/Badge';
import RefChip from '../ui/RefChip';
import EmptyState from '../ui/EmptyState';
import MatchVisualReplay from './MatchVisualReplay';

function describePitchZone(x, y, L, W, team) {
  if (x == null || y == null || isNaN(x) || isNaN(y)) return 'area lapangan';
  const relX = team === 'opponent' ? L - Number(x) : Number(x);
  const third = relX < L / 3 ? 'sepertiga pertahanan' : relX < (2 * L) / 3 ? 'sepertiga tengah' : 'sepertiga akhir';
  const yPct = Number(y) / Math.max(1, W);
  const corridor =
    yPct < 0.2
      ? 'Sayap Kiri'
      : yPct < 0.4
        ? 'Half-Space Kiri'
        : yPct <= 0.6
          ? 'Jalur Tengah'
          : yPct <= 0.8
            ? 'Half-Space Kanan'
            : 'Sayap Kanan';
  return `${corridor} (${third})`;
}

function buildGoalAndChanceMoments(events, L, W, teamA, teamB, participants = []) {
  const participantMap = new Map();
  (Array.isArray(participants) ? participants : []).forEach((p) => {
    if (p?.id) participantMap.set(p.id, p);
    if (p?.player_id) participantMap.set(p.player_id, p);
  });

  const sorted = (Array.isArray(events) ? events : [])
    .slice()
    .sort((a, b) => {
      const pDiff = Number(a?.period || 1) - Number(b?.period || 1);
      if (pDiff !== 0) return pDiff;
      return Number(a?.minute || 0) - Number(b?.minute || 0);
    });

  const resolveActor = (evt, idx) => {
    if (evt?.player_id && participantMap.has(evt.player_id)) {
      const p = participantMap.get(evt.player_id);
      const name = String(p.full_name || p.name || '').trim();
      const num = p.jersey_number != null && p.jersey_number !== '' ? `#${p.jersey_number}` : '';
      return [name, num].filter(Boolean).join(' ') || `Pemain #${(idx % 11) + 1}`;
    }
    const num = evt?.player_number ?? evt?.opponent_number;
    return num != null ? `Pemain #${num}` : `Pemain #${(idx % 11) + 1}`;
  };

  const moments = [];
  let ownGoals = 0;
  let oppGoals = 0;

  sorted.forEach((evt, idx) => {
    const type = evt?.event_type;
    if (type !== 'goal' && type !== 'shot_on_target' && type !== 'shot') return;
    const isOwn = evt.team === 'own';
    if (type === 'goal') {
      if (isOwn) ownGoals += 1;
      else oppGoals += 1;
    }

    const attackerTeam = isOwn ? teamA : teamB;
    const defenderTeam = isOwn ? teamB : teamA;
    const actor = resolveActor(evt, idx);

    // Cari hingga 3 kejadian sebelumnya dalam 2 menit terakhir untuk melacak penyebab/kesalahan
    const prevWindow = sorted
      .slice(Math.max(0, idx - 4), idx)
      .filter(
        (pe) =>
          Number(pe?.period || 1) === Number(evt?.period || 1) &&
          Number(evt?.minute || 0) - Number(pe?.minute || 0) <= 2.5
      );

    const defLoss = [...prevWindow].reverse().find((pe) => pe.team !== evt.team && pe.event_type === 'ball_loss');
    const attRegain = [...prevWindow]
      .reverse()
      .find(
        (pe) =>
          pe.team === evt.team &&
          (pe.event_type === 'ball_recovery' || pe.event_type === 'interception' || pe.event_type === 'tackle')
      );
    const buildPasses = prevWindow.filter(
      (pe) => pe.team === evt.team && (pe.event_type === 'pass' || pe.event_type === 'key_pass')
    );

    const goalX = isOwn ? L : 0;
    const shotDist =
      evt.x_m != null && evt.y_m != null
        ? Math.hypot(goalX - Number(evt.x_m), W / 2 - Number(evt.y_m)).toFixed(1)
        : null;
    const shotZone = describePitchZone(evt.x_m, evt.y_m, L, W, evt.team).replace(/\s*\([^)]*\)/g, '');
    const momentNoun = type === 'goal' ? 'gol' : type === 'shot_on_target' ? 'tembakan tepat sasaran' : 'peluang tembakan';

    let causeTitle = 'Skema Serangan Terbuka';
    let causeDetail = `Penyelesaian dilepaskan dari ${shotZone}${shotDist ? ` pada jarak sekitar ${shotDist} m dari gawang` : ''}.`;

    if (defLoss) {
      const lossZone = describePitchZone(defLoss.x_m, defLoss.y_m, L, W, defLoss.team).replace(/\s*\([^)]*\)/g, '');
      const lossActor = resolveActor(defLoss, idx);
      causeTitle = `Kesalahan Kehilangan Bola ${defenderTeam}`;
      causeDetail = `Berawal dari ${lossActor} dari ${defenderTeam} yang kehilangan bola di ${lossZone} pada menit ${defLoss.minute}', lalu langsung dimanfaatkan ${attackerTeam} menjadi ${momentNoun}${shotDist ? ` dari jarak ${shotDist} m` : ''}.`;
    } else if (attRegain) {
      const regainZone = describePitchZone(attRegain.x_m, attRegain.y_m, L, W, attRegain.team).replace(/\s*\([^)]*\)/g, '');
      causeTitle = `Transisi Cepat usai Rebut Bola`;
      causeDetail = `Diawali perebutan bola ${attackerTeam} di ${regainZone} pada menit ${attRegain.minute}', memotong bangun serangan ${defenderTeam} dan berujung ${momentNoun}${shotDist ? ` dari jarak ${shotDist} m` : ''}.`;
    } else if (buildPasses.length > 0) {
      const startZone = describePitchZone(buildPasses[0].x_m, buildPasses[0].y_m, L, W, evt.team).replace(/\s*\([^)]*\)/g, '');
      causeTitle = `Kombinasi ${buildPasses.length} Umpan Beruntun`;
      causeDetail = `Tercipta melalui rangkaian ${buildPasses.length} umpan ${attackerTeam} dari ${startZone} menuju ${shotZone}, menembus penjagaan ${defenderTeam}${shotDist ? ` sebelum penyelesaian dari ${shotDist} m` : ''}.`;
    }

    moments.push({
      id: evt.id || evt.client_event_id || `moment-${idx}`,
      type,
      period: evt.period || 1,
      minute: evt.minute ?? 0,
      videoTimeS: evt.video_time_s ?? null,
      team: evt.team,
      attackerTeam,
      actor,
      causeTitle,
      causeDetail,
      hasCoords: evt.x_m != null && evt.y_m != null
    });
  });

  // Prioritaskan semua gol terlebih dahulu, lalu peluang tembakan terbaru/terpenting
  const goalsOnly = moments.filter((m) => m.type === 'goal');
  const chancesOnly = moments.filter((m) => m.type !== 'goal');
  return {
    ownGoals,
    oppGoals,
    totalGoals: goalsOnly.length,
    totalShots: moments.length,
    items: [...goalsOnly, ...chancesOnly.slice(0, 8)]
  };
}

function stripParens(text) {
  return String(text || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveInitialTeamNames(match) {
  const rawOpp = String(match?.opponent_name || '').trim();
  const vsMatch = rawOpp.match(/\(\s*vs\s+([^)]+)\)/i);
  const home =
    stripParens(match?.home_team_name) ||
    (vsMatch ? stripParens(vsMatch[1]) : '') ||
    'Tim Kita';
  const away = stripParens(rawOpp) || 'Lawan';
  return { home, away };
}

function ComparisonBar({ label, ownVal, oppVal, ownDisplay, oppDisplay, subtext }) {
  const total = (Number(ownVal) || 0) + (Number(oppVal) || 0);
  const ownWidth = total > 0 ? Math.round(((Number(ownVal) || 0) / total) * 100) : 50;
  const oppWidth = total > 0 ? 100 - ownWidth : 50;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-1 tabular-nums">{ownDisplay}</span>
        <span className="text-sm font-medium text-2 text-center px-2">{label}</span>
        <span className="font-semibold text-2 tabular-nums">{oppDisplay}</span>
      </div>
      <div className="h-2.5 w-full rounded-full overflow-hidden bg-app border border-line flex">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${ownWidth}%` }}
        />
        <div
          className="h-full bg-warning border-l border-line transition-all"
          style={{ width: `${oppWidth}%` }}
        />
      </div>
      {subtext && <p className="text-sm text-2">{subtext}</p>}
    </div>
  );
}

const PRIORITY_BADGE_VARIANT = {
  tinggi: 'danger',
  sedang: 'warning',
  pemantauan: 'neutral'
};

const CATEGORY_LABELS = {
  serangan: 'Serangan',
  bertahan: 'Bertahan',
  transisi: 'Transisi',
  teknik: 'Teknik'
};

/**
 * Menormalkan daftar kejadian hasil deteksi otomatis (vision/JSON) agar lulus validateEvent.
 */
export function normalizeVisionEventsForMatch(rawEvents = [], pitchLength = 90, pitchWidth = 60) {
  const maxLen = Number(pitchLength) || 90;
  const maxWid = Number(pitchWidth) || 60;
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  return (Array.isArray(rawEvents) ? rawEvents : []).map((evt, idx) => {
    const team = evt?.team === 'opponent' ? 'opponent' : 'own';
    const eventType = ALLOWED_EVENT_TYPES.includes(evt?.event_type) ? evt.event_type : 'note';

    let outcome = null;
    if (evt?.outcome === 'success' || evt?.outcome === 'on_target') {
      outcome = 'success';
    } else if (evt?.outcome === 'fail' || evt?.outcome === 'off_target') {
      outcome = 'fail';
    }

    const rawOppNum = Number(evt?.opponent_number);
    const opponentNumber =
      team === 'opponent'
        ? Number.isInteger(rawOppNum) && rawOppNum >= 1 && rawOppNum <= 99
          ? rawOppNum
          : ((idx % 98) + 1)
        : null;

    const hasXY =
      evt?.x_m !== null && evt?.x_m !== undefined && evt?.x_m !== '' && !isNaN(Number(evt.x_m)) &&
      evt?.y_m !== null && evt?.y_m !== undefined && evt?.y_m !== '' && !isNaN(Number(evt.y_m));

    const hasEndXY =
      evt?.end_x_m !== null && evt?.end_x_m !== undefined && evt?.end_x_m !== '' && !isNaN(Number(evt.end_x_m)) &&
      evt?.end_y_m !== null && evt?.end_y_m !== undefined && evt?.end_y_m !== '' && !isNaN(Number(evt.end_y_m));

    const period = clamp(Math.round(Number(evt?.period) || 1), 1, 4);
    const minute = Number(clamp(Number(evt?.minute) || 0, 0, 130).toFixed(1));
    const rawVts = evt?.video_time_s;
    const videoTimeS =
      rawVts !== null && rawVts !== undefined && rawVts !== '' && !isNaN(Number(rawVts))
        ? Number(clamp(Number(rawVts), 0, 14400).toFixed(1))
        : null;

    const rawPlayerNum = Number(evt?.player_number);
    const playerNumber =
      Number.isInteger(rawPlayerNum) && rawPlayerNum >= 1 && rawPlayerNum <= 99
        ? rawPlayerNum
        : Number.isInteger(rawOppNum) && rawOppNum >= 1 && rawOppNum <= 99
          ? rawOppNum
          : ((idx % 11) + 1);

    return {
      client_event_id: evt?.client_event_id || evt?.id || generateUUID(),
      team,
      player_id: team === 'own' ? (evt?.player_id || null) : null,
      player_number: playerNumber,
      opponent_number: opponentNumber,
      period,
      minute,
      event_type: eventType,
      outcome,
      x_m: hasXY ? Number(clamp(Number(evt.x_m), 0, maxLen).toFixed(1)) : null,
      y_m: hasXY ? Number(clamp(Number(evt.y_m), 0, maxWid).toFixed(1)) : null,
      end_x_m: hasEndXY ? Number(clamp(Number(evt.end_x_m), 0, maxLen).toFixed(1)) : null,
      end_y_m: hasEndXY ? Number(clamp(Number(evt.end_y_m), 0, maxWid).toFixed(1)) : null,
      video_time_s: videoTimeS,
      note: evt?.note || 'Hasil deteksi otomatis video'
    };
  });
}

export default function TacticalMatchAnalysis({
  match,
  events = [],
  participants = [],
  initialVisionEvents = null,
  initialVisionQuality = null,
  onSaveVisionEvents = null,
  onVisionEventsChange = null,
  onVisionQualityChange = null,
  onTeamNamesChange = null,
  canSaveEvents = false
}) {
  const pitchLength = Number(match?.pitch_length_m) || 90;
  const pitchWidth = Number(match?.pitch_width_m) || 60;
  const initialTeams = useMemo(() => deriveInitialTeamNames(match), [match]);

  const [teamAName, setTeamAName] = useState(initialTeams.home);
  const [teamBName, setTeamBName] = useState(initialTeams.away);
  const [ownCluster, setOwnCluster] = useState(0);
  const [swapPerspective, setSwapPerspective] = useState(false);

  const effectiveTeamA = teamAName.trim() || 'Tim Kita';
  const effectiveTeamB = teamBName.trim() || 'Lawan';

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const browserAbortRef = useRef(null);

  const [importedEvents, setImportedEvents] = useState(() =>
    Array.isArray(initialVisionEvents) && initialVisionEvents.length > 0 ? initialVisionEvents : null
  );
  const [visionQuality, setVisionQuality] = useState(() => initialVisionQuality || null);
  const [importNotice, setImportNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [savingToMatch, setSavingToMatch] = useState(false);

  // In-browser video analyzer state
  const [browserAnalyzing, setBrowserAnalyzing] = useState(false);
  const [browserProgress, setBrowserProgress] = useState(null);

  // Jendela waktu Babak 1 & Babak 2
  const [half1Start, setHalf1Start] = useState('');
  const [half1End, setHalf1End] = useState('');
  const [enableHalf2, setEnableHalf2] = useState(false);
  const [half2Start, setHalf2Start] = useState('');
  const [half2End, setHalf2End] = useState('');
  const [flipHalf2, setFlipHalf2] = useState(true);

  // Local YouTube Vision API state
  const [showYoutubeForm, setShowYoutubeForm] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(() =>
    match?.youtube_video_id ? `https://www.youtube.com/watch?v=${match.youtube_video_id}` : ''
  );
  const [youtubeCookiesBrowser, setYoutubeCookiesBrowser] = useState('');
  const [youtubeBusy, setYoutubeBusy] = useState(false);
  const [youtubeProgress, setYoutubeProgress] = useState(null);
  const youtubeAbortRef = useRef(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  useEffect(() => {
    if (!youtubeBusy) return undefined;
    const startedAt = Date.now();
    let cancelled = false;

    const tickElapsed = setInterval(() => {
      if (cancelled) return;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setYoutubeProgress((prev) =>
        prev ? { ...prev, elapsedSec } : { pct: 5, detail: 'Menyiapkan proses YouTube...', elapsedSec }
      );
    }, 1000);

    const pollStatus = setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await fetch('/api/vision/youtube/status');
        if (!res?.ok) return;
        const json = await res.json();
        if (cancelled || !json?.ok || !json?.progress) return;
        setYoutubeProgress((prev) => ({
          ...prev,
          ...json.progress
        }));
      } catch {
        // Abaikan error polling sementara
      }
    }, 900);

    return () => {
      cancelled = true;
      clearInterval(tickElapsed);
      clearInterval(pollStatus);
    };
  }, [youtubeBusy]);

  const rawActiveEvents = importedEvents || events;
  const activeEvents = useMemo(() => {
    if (!swapPerspective) return rawActiveEvents;
    return (Array.isArray(rawActiveEvents) ? rawActiveEvents : []).map((evt) => ({
      ...evt,
      team: evt?.team === 'own' ? 'opponent' : 'own'
    }));
  }, [rawActiveEvents, swapPerspective]);

  const summary = useMemo(
    () => buildTacticalSummary(activeEvents, pitchLength, pitchWidth, effectiveTeamB),
    [activeEvents, pitchLength, pitchWidth, effectiveTeamB]
  );

  // Hitung pola permainan untuk Tim A juga (agar kedua tim bisa dibandingkan)
  const teamAStrat = useMemo(() => {
    const flipped = (Array.isArray(activeEvents) ? activeEvents : []).map((evt) => ({
      ...evt,
      team: evt?.team === 'own' ? 'opponent' : 'own'
    }));
    return buildTacticalSummary(flipped, pitchLength, pitchWidth, effectiveTeamA).opponent_strategy;
  }, [activeEvents, pitchLength, pitchWidth, effectiveTeamA]);

  const [patternFocus, setPatternFocus] = useState('teamB'); // 'teamA' | 'teamB'
  const [replayFocusKey, setReplayFocusKey] = useState(null);
  const replaySectionRef = useRef(null);

  const goalMoments = useMemo(
    () => buildGoalAndChanceMoments(activeEvents, pitchLength, pitchWidth, effectiveTeamA, effectiveTeamB, participants),
    [activeEvents, pitchLength, pitchWidth, effectiveTeamA, effectiveTeamB, participants]
  );

  const periodScopeLabel = useMemo(() => {
    const periods = new Set(
      (Array.isArray(activeEvents) ? activeEvents : []).map((e) => Number(e?.period) || 1)
    );
    if (periods.size === 0) return 'Ringkasan Laga';
    if (periods.size === 1) {
      const only = Array.from(periods)[0];
      return `Ringkasan Babak ${only}`;
    }
    const sorted = Array.from(periods).sort((a, b) => a - b);
    return `Ringkasan Babak ${sorted.join(' & ')}`;
  }, [activeEvents]);

  useEffect(() => {
    if (typeof onTeamNamesChange === 'function') {
      onTeamNamesChange({ teamA: effectiveTeamA, teamB: effectiveTeamB });
    }
  }, [effectiveTeamA, effectiveTeamB, onTeamNamesChange]);

  useEffect(() => {
    if (typeof onVisionQualityChange === 'function') {
      onVisionQualityChange(visionQuality || null);
    }
  }, [visionQuality, onVisionQualityChange]);

  useEffect(() => {
    if (typeof onVisionEventsChange === 'function') {
      if (importedEvents && importedEvents.length > 0) {
        onVisionEventsChange(normalizeVisionEventsForMatch(activeEvents, pitchLength, pitchWidth));
      } else {
        onVisionEventsChange(null);
      }
    }
  }, [importedEvents, activeEvents, pitchLength, pitchWidth, onVisionEventsChange]);

  const handleSwapTeamPerspective = () => {
    setTeamAName(effectiveTeamB);
    setTeamBName(effectiveTeamA);
    setOwnCluster((prev) => (prev === 0 ? 1 : 0));
    setSwapPerspective((prev) => !prev);
  };

  const handleApplyHalf1Preset = (durationSec) => {
    const startSec = parseTimecodeToSeconds(half1Start);
    const effectiveStart = startSec != null ? startSec : 3600;
    setHalf1Start(formatSecondsToTimecode(effectiveStart));
    setHalf1End(formatSecondsToTimecode(effectiveStart + durationSec));
  };

  const applyVisionPayload = (parsed, sourceLabel) => {
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.events) ? parsed.events : null;
    if (!list || list.length === 0) {
      const vq = parsed?.vision_quality;
      if (vq && vq.frames_processed != null) {
        setErrorNotice(
          `Video berhasil diproses (${vq.frames_processed} frame, rata-rata ${vq.avg_players_detected ?? 0} pemain, deteksi bola ${vq.ball_detection_rate_pct ?? 0}%), tetapi belum ada kejadian terdeteksi pada segmen ini. Coba geser rentang waktu ke momen permainan aktif.`
        );
      } else {
        setErrorNotice('Hasil analisis belum mengandung kejadian yang valid (array "events" kosong).');
      }
      setErrorDetail(null);
      return false;
    }
    setErrorNotice(null);
    setErrorDetail(null);
    setImportedEvents(list);
    setVisionQuality(parsed?.vision_quality || null);
    const qualityNote = parsed?.vision_quality
      ? ` · ${parsed.vision_quality.frames_processed} frame · deteksi bola ${parsed.vision_quality.ball_detection_rate_pct}%`
      : '';
    setImportNotice(`Berhasil memuat ${list.length} kejadian dari ${sourceLabel}${qualityNote}.`);
    return true;
  };

  const handleExportJson = () => {
    const payload = {
      schema: 'ballr-tactical-v1',
      exported_at: new Date().toISOString(),
      match: {
        id: match?.id || null,
        home_team_name: effectiveTeamA,
        opponent_name: effectiveTeamB,
        match_date: match?.match_date || null,
        competition: match?.competition || null,
        format: match?.format || '11v11',
        pitch_length_m: pitchLength,
        pitch_width_m: pitchWidth
      },
      events: activeEvents,
      summary
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballr-analisis-${effectiveTeamB.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const ok = applyVisionPayload(parsed, `"${file.name}"`);
      if (!ok) {
        setImportNotice('Format berkas JSON belum sesuai. Pastikan berisi array "events" dengan koordinat x_m & y_m.');
      }
    } catch {
      setErrorNotice('Gagal membaca berkas JSON. Periksa kembali format berkas Anda.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAnalyzeBrowserVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let segments;
    const hasCustomWindow =
      half1Start.trim() !== '' || half1End.trim() !== '' || enableHalf2;
    if (hasCustomWindow) {
      try {
        segments = buildMatchSegments(
          {
            half1Start,
            half1End,
            enableHalf2,
            half2Start,
            half2End,
            flipHalf2
          },
          { defaultDurationSec: 180 }
        );
      } catch (err) {
        setErrorNotice(err?.message || 'Rentang waktu Babak 1 / Babak 2 belum valid.');
        return;
      }
    }

    setErrorNotice(null);
    setImportNotice(null);
    setBrowserAnalyzing(true);
    setBrowserProgress({ pct: 2, stage: 'Menyiapkan video di browser...', framesProcessed: 0 });

    const controller = new AbortController();
    browserAbortRef.current = controller;

    try {
      const payload = await analyzeVideoFileInBrowser(file, {
        pitchLengthM: pitchLength,
        pitchWidthM: pitchWidth,
        sampleFps: 1.0,
        maxDurationSec: 180,
        maxFrames: 90,
        period: 1,
        segments,
        onProgress: (info) => setBrowserProgress(info),
        signal: controller.signal
      });
      applyVisionPayload(payload, `video browser "${file.name}"`);
    } catch (err) {
      if (err?.name === 'AbortError') {
        setImportNotice('Analisis video di browser dibatalkan.');
      } else {
        setErrorNotice(err?.message || 'Gagal menganalisis video di browser.');
      }
    } finally {
      setBrowserAnalyzing(false);
      browserAbortRef.current = null;
    }
  };

  const handleCancelBrowserAnalysis = () => {
    browserAbortRef.current?.abort();
  };

  const handleLoadLatestVision = async () => {
    setErrorNotice(null);
    setLoadingLatest(true);
    try {
      const res = await fetch('/api/vision/latest');
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Belum ada hasil vision terbaru pada server lokal.');
      }
      applyVisionPayload(json.data, 'vision/ballr_analysis.json (lokal)');
    } catch (err) {
      setErrorNotice(
        err?.message || 'Endpoint lokal /api/vision/latest tidak terjangkau. Pastikan dijalankan via npm run dev.'
      );
    } finally {
      setLoadingLatest(false);
    }
  };

  const handleRunYoutubeVision = async (e) => {
    e.preventDefault();
    const vid = extractYouTubeVideoId(youtubeUrl);
    if (!vid) {
      setErrorNotice('Tautan YouTube tidak valid. Masukkan tautan youtube.com/watch, /live, atau youtu.be.');
      return;
    }

    let segments;
    try {
      const effectiveH1Start = half1Start.trim() || '15:00';
      const effectiveH1End = half1End.trim() || (half1Start.trim() ? '' : '16:00');
      segments = buildMatchSegments(
        {
          half1Start: effectiveH1Start,
          half1End: effectiveH1End,
          enableHalf2,
          half2Start,
          half2End,
          flipHalf2
        },
        { defaultDurationSec: 60 }
      );
    } catch (err) {
      setErrorNotice(err?.message || 'Rentang waktu Babak 1 / Babak 2 belum valid.');
      return;
    }

    setErrorNotice(null);
    setErrorDetail(null);
    setImportNotice(null);
    setYoutubeBusy(true);
    setYoutubeProgress({
      stage: 'download',
      pct: 5,
      detail: 'Memulai unduhan segmen YouTube...',
      elapsedSec: 0
    });

    const controller = new AbortController();
    youtubeAbortRef.current = controller;

    try {
      const longestSeg = Math.max(...segments.map((s) => Math.max(10, s.endSec - s.startSec)));
      const autoFps = longestSeg > 1200 ? 0.35 : longestSeg > 300 ? 0.75 : 2.0;
      const payloadBody = {
        url: youtubeUrl.trim(),
        segments,
        fps: autoFps,
        ownCluster,
        engine: 'pitch_cv'
      };
      if (youtubeCookiesBrowser) {
        payloadBody.cookiesFromBrowser = youtubeCookiesBrowser;
      }
      const res = await fetch('/api/vision/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
        signal: controller.signal
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        if (json?.cancelled) {
          setImportNotice('Analisis YouTube dibatalkan.');
          return;
        }
        const detail = (json?.error_detail || json?.stderr_tail || '').trim();
        const errObj = new Error(json?.error || 'Gagal menjalankan analisis YouTube di server lokal.');
        errObj.detail = detail || null;
        throw errObj;
      }
      const segInfo = segments
        .map((s) => `Babak ${s.period} ${formatSecondsToTimecode(s.startSec)}–${formatSecondsToTimecode(s.endSec)}`)
        .join(' & ');
      setSwapPerspective(false);
      applyVisionPayload(json.data, `YouTube ${segInfo}`);
      setShowYoutubeForm(false);
    } catch (err) {
      if (err?.name === 'AbortError') {
        setImportNotice('Analisis YouTube dibatalkan.');
      } else {
        setErrorNotice(
          err?.message || 'Endpoint lokal /api/vision/youtube tidak tersedia atau gagal memproses video.'
        );
        setErrorDetail(err?.detail || null);
      }
    } finally {
      setYoutubeBusy(false);
      setYoutubeProgress(null);
      youtubeAbortRef.current = null;
    }
  };

  const handleCancelYoutubeVision = async () => {
    youtubeAbortRef.current?.abort();
    try {
      await fetch('/api/vision/youtube/cancel', { method: 'POST' });
    } catch {
      // Abaikan bila endpoint tidak terjangkau
    }
  };

  const handleSaveToMatch = async () => {
    if (!importedEvents || importedEvents.length === 0 || typeof onSaveVisionEvents !== 'function') return;
    setSavingToMatch(true);
    setErrorNotice(null);
    try {
      const normalized = normalizeVisionEventsForMatch(importedEvents, pitchLength, pitchWidth);
      const savedCount = await onSaveVisionEvents(normalized);
      setImportedEvents(null);
      setImportNotice(
        `Tersimpan ${savedCount ?? normalized.length} kejadian hasil analisis otomatis ke data laga. Kini tampil di Peta Lapangan & Laporan A4.`
      );
    } catch (err) {
      setErrorNotice(err?.message || 'Gagal menyimpan kejadian otomatis ke data laga.');
    } finally {
      setSavingToMatch(false);
    }
  };

  const renderVisionToolbar = () => (
    <div className="space-y-3" data-testid="vision-automation-toolbar">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={browserAnalyzing || youtubeBusy}
          className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-brand text-app font-semibold text-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <Video className="w-4 h-4" />
          <span>{browserAnalyzing ? 'Memindai Video...' : 'Analisis Video MP4/WebM'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowYoutubeForm((prev) => !prev)}
          disabled={browserAnalyzing || youtubeBusy}
          className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-raised border border-line hover:border-brand text-sm font-medium text-1 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <Film className="w-4 h-4 text-brand" />
          <span>Analisis YouTube Lokal</span>
        </button>

        <button
          type="button"
          onClick={handleLoadLatestVision}
          disabled={loadingLatest || browserAnalyzing || youtubeBusy}
          className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-app border border-line hover:border-brand text-sm font-medium text-1 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <RotateCcw className={`w-4 h-4 text-brand ${loadingLatest ? 'animate-spin' : ''}`} />
          <span>Muat Vision Terbaru</span>
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-raised border border-line hover:border-brand text-sm font-medium text-1 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4 text-brand" />
          <span>Ekspor JSON</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-app border border-line hover:border-brand text-sm font-medium text-1 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-brand" />
          <span>Impor Tracking JSON</span>
        </button>

        {importedEvents && typeof onSaveVisionEvents === 'function' && canSaveEvents && (
          <button
            type="button"
            onClick={handleSaveToMatch}
            disabled={savingToMatch || browserAnalyzing || youtubeBusy}
            className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-success text-app text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            data-testid="save-vision-to-match-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{savingToMatch ? 'Menyimpan...' : `Simpan ke Data Laga (${importedEvents.length})`}</span>
          </button>
        )}

        {importedEvents && (
          <button
            type="button"
            onClick={() => {
              setImportedEvents(null);
              setVisionQuality(null);
              setImportNotice(null);
              setErrorNotice(null);
            }}
            className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-control bg-app border border-danger/50 text-sm font-medium text-danger cursor-pointer"
          >
            Kembali ke Data Laga
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportJson}
          className="sr-only"
          aria-label="Impor berkas JSON kejadian"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/*"
          onChange={handleAnalyzeBrowserVideo}
          className="sr-only"
          aria-label="Unggah video MP4 atau WebM untuk analisis di browser"
        />
      </div>

      {/* Identitas Tim & Perspektif Analisis */}
      <div
        className="p-3.5 rounded-control border border-line bg-app space-y-3"
        data-testid="vision-team-perspective-panel"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm font-semibold text-1">
            Tim dalam Video &amp; Perspektif Analisis
          </span>
          <button
            type="button"
            onClick={handleSwapTeamPerspective}
            disabled={browserAnalyzing || youtubeBusy}
            className="min-h-[36px] px-2.5 py-1 rounded-control bg-panel border border-line hover:border-brand text-xs font-medium text-1 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-brand" />
            <span>Tukar Perspektif Tim</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="vision-team-a" className="block text-xs text-2">
              Tim A · Fokus Analisis
            </label>
            <input
              id="vision-team-a"
              type="text"
              placeholder="Contoh: AMS Seyegan"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              disabled={browserAnalyzing || youtubeBusy}
              className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="vision-team-b" className="block text-xs text-2">
              Tim B · Lawan
            </label>
            <input
              id="vision-team-b"
              type="text"
              placeholder="Contoh: PS Palma"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              disabled={browserAnalyzing || youtubeBusy}
              className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1"
            />
          </div>
        </div>
      </div>

      {/* Rentang Waktu Video — Mendukung 45 Menit Penuh per Babak */}
      <div
        className="p-3.5 rounded-control border border-line bg-app space-y-3"
        data-testid="vision-half-window-panel"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand shrink-0" />
            <span className="text-sm font-semibold text-1">Rentang Waktu Video</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyHalf1Preset(2700)}
              disabled={browserAnalyzing || youtubeBusy}
              className="px-2.5 py-1 rounded-control bg-panel border border-line hover:border-brand text-xs font-medium text-1 cursor-pointer disabled:opacity-60"
            >
              Babak 1 Penuh 45 Menit
            </button>
            <button
              type="button"
              onClick={() => handleApplyHalf1Preset(60)}
              disabled={browserAnalyzing || youtubeBusy}
              className="px-2.5 py-1 rounded-control bg-panel border border-line hover:border-brand text-xs font-medium text-2 hover:text-1 cursor-pointer disabled:opacity-60"
            >
              Klip Cepat 1 Menit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="vision-h1-start" className="block text-xs text-2">
              Mulai Babak 1
            </label>
            <input
              id="vision-h1-start"
              type="text"
              inputMode="text"
              placeholder="Contoh: 60:00"
              value={half1Start}
              onChange={(e) => setHalf1Start(e.target.value)}
              disabled={browserAnalyzing || youtubeBusy}
              className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="vision-h1-end" className="block text-xs text-2">
              Selesai Babak 1
            </label>
            <input
              id="vision-h1-end"
              type="text"
              inputMode="text"
              placeholder="Contoh: 105:00"
              value={half1End}
              onChange={(e) => setHalf1End(e.target.value)}
              disabled={browserAnalyzing || youtubeBusy}
              className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1 tabular-nums"
            />
          </div>

          {enableHalf2 && (
            <>
              <div className="space-y-1">
                <label htmlFor="vision-h2-start" className="block text-xs text-2">
                  Mulai Babak 2
                </label>
                <input
                  id="vision-h2-start"
                  type="text"
                  inputMode="text"
                  placeholder="Contoh: 120:00"
                  value={half2Start}
                  onChange={(e) => setHalf2Start(e.target.value)}
                  disabled={browserAnalyzing || youtubeBusy}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1 tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="vision-h2-end" className="block text-xs text-2">
                  Selesai Babak 2
                </label>
                <input
                  id="vision-h2-end"
                  type="text"
                  inputMode="text"
                  placeholder="Contoh: 165:00"
                  value={half2End}
                  onChange={(e) => setHalf2End(e.target.value)}
                  disabled={browserAnalyzing || youtubeBusy}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-control bg-panel border border-control text-sm text-1 tabular-nums"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="min-h-[36px] inline-flex items-center gap-2 text-sm text-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableHalf2}
              onChange={(e) => setEnableHalf2(e.target.checked)}
              disabled={browserAnalyzing || youtubeBusy}
              className="w-4 h-4 accent-brand cursor-pointer"
            />
            <span>Sertakan Babak 2</span>
          </label>

          {enableHalf2 && (
            <label className="min-h-[36px] inline-flex items-center gap-2 text-sm text-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flipHalf2}
                onChange={(e) => setFlipHalf2(e.target.checked)}
                disabled={browserAnalyzing || youtubeBusy}
                className="w-4 h-4 accent-brand cursor-pointer"
              />
              <span>Otomatis balik arah serang di Babak 2</span>
            </label>
          )}
        </div>
      </div>

      {browserAnalyzing && browserProgress && (
        <div
          className="p-3 rounded-control border border-line bg-app space-y-2"
          data-testid="browser-vision-progress"
        >
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-1">{browserProgress.stage}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-2">{browserProgress.pct}%</span>
              <button
                type="button"
                onClick={handleCancelBrowserAnalysis}
                className="min-h-[44px] sm:min-h-[32px] px-2.5 py-1 rounded-control border border-danger/50 text-danger text-sm inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Batal</span>
              </button>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-panel border border-line overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${browserProgress.pct || 0}%` }}
            />
          </div>
        </div>
      )}

      {youtubeBusy && youtubeProgress && (
        <div
          className="p-3.5 rounded-control border border-brand/40 bg-app space-y-2"
          data-testid="youtube-vision-progress"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
              <span className="font-medium text-1">
                {youtubeProgress.detail || 'Memproses video YouTube...'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-2 tabular-nums">
                {formatSecondsToTimecode(youtubeProgress.elapsedSec || 0)}
              </span>
              <span className="text-sm font-semibold text-1 tabular-nums">
                {youtubeProgress.pct ?? 0}%
              </span>
              <button
                type="button"
                onClick={handleCancelYoutubeVision}
                className="min-h-[32px] px-2.5 py-1 rounded-control border border-danger/50 text-danger text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Batal</span>
              </button>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-panel border border-line overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${Math.max(4, Math.min(100, youtubeProgress.pct || 0))}%` }}
            />
          </div>
        </div>
      )}

      {showYoutubeForm && (
        <form
          onSubmit={handleRunYoutubeVision}
          className="p-3.5 rounded-control border border-line bg-app space-y-3"
          data-testid="youtube-vision-form"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-1">
              Jalankan Mesin Vision Lokal pada Tautan YouTube
            </span>
            <Badge variant="neutral" size="sm">Endpoint Lokal Vite</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="vision-yt-url" className="block text-sm text-2">
                Tautan YouTube / YouTube Live
              </label>
              <input
                id="vision-yt-url"
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-control bg-panel border border-control text-sm text-1"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="vision-yt-cookies" className="block text-sm text-2">
                Cookies browser (opsional)
              </label>
              <select
                id="vision-yt-cookies"
                value={youtubeCookiesBrowser}
                onChange={(e) => setYoutubeCookiesBrowser(e.target.value)}
                disabled={youtubeBusy}
                className="w-full min-h-[44px] px-3 py-2 rounded-control bg-panel border border-control text-sm text-1"
              >
                <option value="">Tidak pakai (disarankan)</option>
                <option value="firefox">Firefox</option>
                <option value="chrome">Chrome</option>
                <option value="edge">Edge</option>
                <option value="brave">Brave</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-2">
              Menggunakan rentang Babak 1{enableHalf2 ? ' & Babak 2' : ''} di atas. Mendukung hingga 45 menit penuh per babak.
            </p>
            <button
              type="submit"
              disabled={youtubeBusy}
              className="min-h-[44px] px-4 py-2 rounded-control bg-brand text-app text-sm font-semibold cursor-pointer disabled:opacity-60"
            >
              {youtubeBusy ? 'Memproses YouTube...' : 'Mulai Analisis YouTube'}
            </button>
          </div>
        </form>
      )}

      {importNotice && (
        <p className="text-sm text-brand font-medium">{importNotice}</p>
      )}
      {errorNotice && (
        <div
          className="p-3 rounded-control border border-danger/40 bg-danger/5 space-y-2"
          role="alert"
        >
          <p className="text-sm text-danger font-medium">{errorNotice}</p>
          {errorDetail && (
            <pre
              data-testid="vision-error-detail"
              className="text-xs font-mono text-1 bg-app border border-line rounded-control p-2.5 overflow-x-auto whitespace-pre-wrap break-words"
            >
              {errorDetail}
            </pre>
          )}
          {errorDetail && (
            <p className="text-xs text-2">
              Tips: Bila YouTube membatasi unduhan, coba pilih opsi <strong>Cookies browser</strong> atau gunakan tombol <strong>Analisis Video MP4/WebM</strong> dengan berkas video lokal.
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!activeEvents || activeEvents.length === 0) {
    return (
      <div className="space-y-4" data-testid="tactical-match-analysis-empty">
        <EmptyState
          title="Belum ada data kejadian untuk dianalisis"
          description="Catat kejadian pada menu Pencatatan, unggah video MP4/WebM langsung di browser, atau jalankan analisis YouTube lokal."
        />
        <div className="p-4 border border-line rounded-panel bg-panel">
          {renderVisionToolbar()}
        </div>
      </div>
    );
  }

  const maxIntervalEvents = Math.max(
    1,
    ...summary.intervals.buckets.map((b) => Math.max(b.own_events, b.opp_events))
  );

  const ownTech = summary.technique.own;
  const oppTech = summary.technique.opponent;
  const oppStrat = summary.opponent_strategy;
  const counterTactics = summary.counter_tactics;

  const allReferenceIds = Array.from(
    new Set([
      'fifa-football-language-2022',
      'fifa-tcp-scales-of-the-game',
      'sarmento-2014-match-analysis',
      'vogelbein-2014-defensive-transition',
      'trainor-ppda-2014',
      'pollard-reep-1997-playing-strategies',
      'rathke-2017-shot-efficiency',
      ...oppStrat.patterns.flatMap((p) => p.reference_ids || []),
      ...oppStrat.vulnerabilities.flatMap((v) => v.reference_ids || []),
      ...counterTactics.flatMap((c) => c.reference_ids || []),
      ...summary.observations.flatMap((o) => o.reference_ids || [])
    ])
  );

  return (
    <div className="space-y-5" data-testid="tactical-match-analysis">
      {/* Ringkasan & Kontrol Analisis Video */}
      <div className="p-4 bg-panel border border-line rounded-panel flex flex-col gap-3 text-sm text-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-1">
              {effectiveTeamA} vs {effectiveTeamB}
            </span>
            <span className="text-2">·</span>
            <span className="tabular-nums">
              <strong className="text-1">{summary.n}</strong> kejadian tercatat
            </span>
          </div>
          {summary.n < SMALL_SAMPLE_N && (
            <Badge variant="warning" size="sm">Sampel kecil · n &lt; {SMALL_SAMPLE_N}</Badge>
          )}
        </div>

        {renderVisionToolbar()}

        {visionQuality && (
          <div
            className="text-sm text-2 bg-app border border-line rounded-control px-3 py-2.5 flex flex-col gap-1"
            data-testid="vision-quality-banner"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-1">Ringkasan Deteksi Video</span>
              {visionQuality.frames_processed != null && (
                <span className="tabular-nums">{visionQuality.frames_processed} frame diproses</span>
              )}
              {visionQuality.ball_detection_rate_pct != null && (
                <span className="tabular-nums">Deteksi bola {visionQuality.ball_detection_rate_pct}%</span>
              )}
              {visionQuality.avg_players_detected != null && (
                <span className="tabular-nums">Rata-rata {visionQuality.avg_players_detected} pemain</span>
              )}
            </div>
            {visionQuality.disclaimer && (
              <p className="text-xs text-2">{visionQuality.disclaimer}</p>
            )}
          </div>
        )}
      </div>

      {/* Section 0: Replay Visual Pertandingan */}
      <div ref={replaySectionRef}>
        <MatchVisualReplay
          match={match}
          events={activeEvents}
          participants={participants}
          teamAName={effectiveTeamA}
          teamBName={effectiveTeamB}
          focusEventKey={replayFocusKey}
        />
      </div>

      {/* Section 0.5: Linimasa Gol & Peluang Krusial beserta Asal Kesalahan */}
      <div
        className="p-4 border border-line rounded-panel bg-panel space-y-3"
        data-testid="goal-chances-timeline-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2.5">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-1">
                Momen Gol &amp; Peluang Krusial
              </h2>
              <p className="text-xs text-2">
                Menampilkan menit terciptanya gol atau tembakan berbahaya beserta rantai kesalahan dan proses terjadinya.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" size="sm">
              Gol tercatat {goalMoments.ownGoals} - {goalMoments.oppGoals}
            </Badge>
            <Badge variant="neutral" size="sm">
              {goalMoments.totalShots} peluang tembakan
            </Badge>
          </div>
        </div>

        {goalMoments.items.length === 0 ? (
          <p className="text-sm text-2">
            Belum ada gol atau tembakan tercatat pada segmen ini. Tandai momen gol melalui pencatat laga atau muat segmen pertandingan yang memiliki peluang tembakan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalMoments.items.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-control border bg-app space-y-1.5 ${
                  m.type === 'goal' ? 'border-brand/60' : 'border-line'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={m.type === 'goal' ? 'brand' : m.type === 'shot_on_target' ? 'warning' : 'neutral'} size="sm">
                      {m.type === 'goal' ? 'GOL' : m.type === 'shot_on_target' ? 'Tepat Sasaran' : 'Peluang'}
                    </Badge>
                    <span className="text-xs font-mono font-semibold text-1 tabular-nums">
                      Babak {m.period} · {m.minute}&apos;
                    </span>
                    <span className="text-xs font-semibold text-1">
                      {m.attackerTeam} · {m.actor}
                    </span>
                  </div>
                  {m.hasCoords && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplayFocusKey({ id: m.id, ts: Date.now() });
                        replaySectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-xs font-semibold text-brand hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Lihat di Replay
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-1">{m.causeTitle}</p>
                <p className="text-xs text-2 leading-relaxed">{m.causeDetail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 1: Teknik Permainan */}
      <div className="p-4 border border-line rounded-panel bg-panel space-y-3" data-testid="playing-technique-section">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-1">
              Teknik Permainan · {effectiveTeamA} vs {effectiveTeamB}
            </h2>
          </div>
          <Badge variant="neutral" size="sm">
            {periodScopeLabel} · {summary.n} aksi
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          {[
            { label: effectiveTeamA, data: ownTech },
            { label: effectiveTeamB, data: oppTech }
          ].map((teamBlock) => (
            <div key={teamBlock.label} className="p-3.5 rounded-control border border-line bg-app space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-1">{teamBlock.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-2 tabular-nums">{teamBlock.data.n} aksi</span>
                  {teamBlock.data.small_sample && (
                    <Badge variant="warning" size="sm">Sampel kecil</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-control bg-panel border border-line space-y-1">
                  <span className="text-xs text-2 block">Progresi &amp; Gaya Umpan</span>
                  <span className="font-semibold text-1 block">{teamBlock.data.passing.style_label}</span>
                  <span className="text-xs text-2 block tabular-nums">
                    Akurasi {teamBlock.data.passing.accuracy_pct != null ? `${teamBlock.data.passing.accuracy_pct}%` : '-'} · Progresif {teamBlock.data.passing.progressive_count}
                    {teamBlock.data.passing.avg_distance_m != null ? ` · Rerata ${teamBlock.data.passing.avg_distance_m} m` : ''}
                  </span>
                </div>

                <div className="p-2.5 rounded-control bg-panel border border-line space-y-1">
                  <span className="text-xs text-2 block">Keamanan Penguasaan Bola</span>
                  <span className="font-semibold text-1 block tabular-nums">
                    {teamBlock.data.ball_security.total_losses} kehilangan bola
                  </span>
                  <span className="text-xs text-2 block tabular-nums">
                    Area sendiri {teamBlock.data.ball_security.dangerous_losses} · Giringan {teamBlock.data.ball_security.dribble_attempts}
                    {teamBlock.data.ball_security.dribble_success_pct != null ? ` · ${teamBlock.data.ball_security.dribble_success_pct}% sukses` : ''}
                  </span>
                </div>

                <div className="p-2.5 rounded-control bg-panel border border-line space-y-1">
                  <span className="text-xs text-2 block">Penyelesaian &amp; Peluang</span>
                  <span className="font-semibold text-1 block tabular-nums">
                    {teamBlock.data.finishing.shots_total} tembakan · {teamBlock.data.finishing.inside_box_count} dalam kotak
                  </span>
                  <span className="text-xs text-2 block tabular-nums">
                    Umpan kunci {teamBlock.data.passing.key_passes} · Tepat sasaran {teamBlock.data.finishing.shots_on_target}
                  </span>
                </div>

                <div className="p-2.5 rounded-control bg-panel border border-line space-y-1">
                  <span className="text-xs text-2 block">Teknik Bertahan &amp; Duel</span>
                  <span className="font-semibold text-1 block tabular-nums">
                    Tekel {teamBlock.data.defensive_technique.tackles} · Intersepsi {teamBlock.data.defensive_technique.interceptions} · Sapuan {teamBlock.data.defensive_technique.clearances}
                  </span>
                  <span className="text-xs text-2 block tabular-nums">
                    Rebut bola tinggi {teamBlock.data.defensive_technique.high_regains}/{teamBlock.data.defensive_technique.total_regains}
                    {teamBlock.data.defensive_technique.duel_win_pct != null ? ` · Duel ${teamBlock.data.defensive_technique.duel_win_pct}%` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Pola Permainan Kedua Tim */}
      {(() => {
        const activeStrat = patternFocus === 'teamA' ? teamAStrat : oppStrat;
        const activeStratTeam = patternFocus === 'teamA' ? effectiveTeamA : effectiveTeamB;
        const patGridCols =
          activeStrat.patterns.length === 1
            ? 'grid-cols-1'
            : activeStrat.patterns.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2';
        const vulnGridCols =
          activeStrat.vulnerabilities.length === 1
            ? 'grid-cols-1'
            : activeStrat.vulnerabilities.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2';
        return (
          <div className="p-4 border border-line rounded-panel bg-panel space-y-3" data-testid="opponent-strategy-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold text-1">
                    Pola Permainan · {activeStratTeam}
                  </h2>
                  <p className="text-xs text-2">
                    Pilih tim untuk melihat kecenderungan permainan dan celah taktisnya.
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-control border border-line bg-app p-0.5 self-start sm:self-auto" role="group" aria-label="Pilih tim pola permainan">
                <button
                  type="button"
                  onClick={() => setPatternFocus('teamA')}
                  aria-pressed={patternFocus === 'teamA'}
                  className={`px-3 py-1 rounded-control text-xs font-semibold cursor-pointer transition-colors ${
                    patternFocus === 'teamA' ? 'bg-brand text-app' : 'text-2 hover:text-1'
                  }`}
                >
                  {effectiveTeamA}
                </button>
                <button
                  type="button"
                  onClick={() => setPatternFocus('teamB')}
                  aria-pressed={patternFocus === 'teamB'}
                  className={`px-3 py-1 rounded-control text-xs font-semibold cursor-pointer transition-colors ${
                    patternFocus === 'teamB' ? 'bg-brand text-app' : 'text-2 hover:text-1'
                  }`}
                >
                  {effectiveTeamB}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-control border border-line bg-app space-y-1">
                <span className="text-xs text-2 block">Struktur Blok Bertahan</span>
                <span className="font-semibold text-1 block">{stripParens(activeStrat.defensive_title)}</span>
              </div>
              <div className="p-3 rounded-control border border-line bg-app space-y-1">
                <span className="text-xs text-2 block">Arah &amp; Jalur Dominan</span>
                <span className="font-semibold text-1 block">{stripParens(activeStrat.channel_pattern)}</span>
              </div>
              <div className="p-3 rounded-control border border-line bg-app space-y-1">
                <span className="text-xs text-2 block">Gaya Sirkulasi Bola</span>
                <span className="font-semibold text-1 block">{stripParens(activeStrat.buildup_style)}</span>
              </div>
            </div>

            {activeStrat.patterns.length > 0 && (
              <div className={`grid ${patGridCols} gap-3`}>
                {activeStrat.patterns.map((pat) => (
                  <div key={pat.id} className="p-3 rounded-control border border-line bg-app space-y-1">
                    <span className="text-sm font-semibold text-1 block">{stripParens(pat.title)}</span>
                    <p className="text-sm text-2 leading-relaxed">{pat.evidence}</p>
                  </div>
                ))}
              </div>
            )}

            {activeStrat.vulnerabilities.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span>Celah Taktis {activeStratTeam} yang Terdeteksi</span>
                </div>
                <div className={`grid ${vulnGridCols} gap-3`}>
                  {activeStrat.vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="p-3 rounded-control border border-warning/40 bg-app space-y-1">
                      <span className="text-sm font-semibold text-1 block">{stripParens(vuln.title)}</span>
                      <p className="text-sm text-2 leading-relaxed">{vuln.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Section 3: Rekomendasi Taktik & Latihan */}
      {counterTactics.length > 0 && (
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3" data-testid="counter-tactics-section">
          <div className="flex items-start justify-between gap-2 flex-wrap border-b border-line pb-2.5">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-1">
                  Rekomendasi Taktik &amp; Latihan untuk {effectiveTeamA}
                </h2>
                <p className="text-xs text-2">
                  Panduan bagi pelatih {effectiveTeamA} untuk meredam pola permainan dan memanfaatkan celah {effectiveTeamB}.
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">{counterTactics.length} rekomendasi</Badge>
          </div>

          <div className="space-y-3">
            {counterTactics.map((ct) => (
              <div key={ct.id} className="p-3.5 rounded-control border border-line bg-app space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={PRIORITY_BADGE_VARIANT[ct.priority] || 'neutral'} size="sm">
                    Prioritas {ct.priority}
                  </Badge>
                  <Badge variant="brand" size="sm">
                    {CATEGORY_LABELS[ct.category] || ct.category}
                  </Badge>
                  {ct.small_sample && (
                    <Badge variant="warning" size="sm">Sampel kecil · n = {ct.n}</Badge>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-1">{stripParens(ct.title)}</h3>
                <p className="text-sm text-2">
                  <strong className="text-1">Bukti data:</strong> {ct.trigger_evidence}
                </p>
                <p className="text-sm text-1 leading-relaxed">
                  <strong>Langkah kontra-taktik:</strong> {ct.tactical_action}
                </p>
                <p className="text-sm text-2 leading-relaxed">
                  <strong className="text-1">Fokus latihan:</strong> {ct.training_focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Perbandingan Wilayah & Efisiensi */}
      <div className="p-4 border border-line rounded-panel bg-panel space-y-4">
        <div className="flex items-center gap-2 border-b border-line pb-2.5">
          <Compass className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-1">
            Wilayah &amp; Efisiensi · {effectiveTeamA} vs {effectiveTeamB}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComparisonBar
            label="Dominasi Sepertiga Akhir"
            ownVal={summary.field_tilt.own_passes}
            oppVal={summary.field_tilt.opponent_passes}
            ownDisplay={
              summary.field_tilt.own_pct != null
                ? `${summary.field_tilt.own_pct}% · ${summary.field_tilt.own_passes}`
                : 'Belum ada'
            }
            oppDisplay={
              summary.field_tilt.opponent_pct != null
                ? `${summary.field_tilt.opponent_passes} · ${summary.field_tilt.opponent_pct}%`
                : 'Belum ada'
            }
            subtext={`Total ${summary.field_tilt.n} umpan di sepertiga akhir${summary.field_tilt.small_sample ? ' · sampel kecil' : ''}`}
          />

          <ComparisonBar
            label="Keberhasilan Umpan"
            ownVal={summary.own.pass.value ?? 0}
            oppVal={summary.opponent.pass.value ?? 0}
            ownDisplay={
              summary.own.pass.n > 0
                ? `${summary.own.pass.value}% · ${summary.own.pass.successful.value}/${summary.own.pass.n}`
                : '0 umpan'
            }
            oppDisplay={
              summary.opponent.pass.n > 0
                ? `${summary.opponent.pass.successful.value}/${summary.opponent.pass.n} · ${summary.opponent.pass.value}%`
                : '0 umpan'
            }
            subtext="Rasio umpan sukses terhadap total umpan tercatat"
          />

          <ComparisonBar
            label="Volume Tembakan"
            ownVal={summary.own.shot.n}
            oppVal={summary.opponent.shot.n}
            ownDisplay={`${summary.own.shot.n} · ${summary.own.shot.on_target.value} tepat`}
            oppDisplay={`${summary.opponent.shot.on_target.value} tepat · ${summary.opponent.shot.n}`}
            subtext="Termasuk gol dan tembakan mengarah gawang"
          />

          <div className="p-3 border border-line rounded-control bg-app space-y-1">
            <span className="text-sm font-medium text-2 block">Intensitas Pressing · PPDA</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-1 tabular-nums">
                {summary.ppda.value != null ? summary.ppda.value : 'Belum cukup sampel'}
              </span>
              {summary.ppda.value != null && <span className="text-sm text-2">umpan lawan per aksi bertahan</span>}
            </div>
            <p className="text-xs text-2">
              {summary.ppda.reason
                ? `${summary.ppda.reason} · saat ini ${summary.ppda.n} umpan lawan berkoordinat`
                : `Area x >= 40% lapangan · ${summary.ppda.opponent_passes_in_zone} umpan lawan / ${summary.ppda.defensive_actions_in_zone} aksi bertahan`}
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Blok Bertahan & Lokasi Tembakan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <Shield className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-1">Struktur Blok Bertahan &amp; Transisi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-control border border-line bg-app space-y-1">
              <span className="text-xs text-2 block">{effectiveTeamA} · Tinggi Blok</span>
              <span className="font-semibold text-1 block">
                {summary.own.def_line.avg_m != null
                  ? `${summary.own.def_line.avg_m} m · ${summary.own.def_line.pct_of_pitch}%`
                  : 'Belum ada data'}
              </span>
              <Badge variant="neutral" size="sm">{summary.own.def_line.block_label}</Badge>
              <span className="text-xs text-2 block pt-1 tabular-nums">
                Rebut bola tinggi: <strong className="text-1">{summary.own.transitions.high_regains}</strong> · Hilang di area sendiri: <strong className="text-1">{summary.own.transitions.dangerous_losses}</strong>
              </span>
            </div>

            <div className="p-3 rounded-control border border-line bg-app space-y-1">
              <span className="text-xs text-2 block">{effectiveTeamB} · Tinggi Blok</span>
              <span className="font-semibold text-1 block">
                {summary.opponent.def_line.avg_m != null
                  ? `${summary.opponent.def_line.avg_m} m · ${summary.opponent.def_line.pct_of_pitch}%`
                  : 'Belum ada data'}
              </span>
              <Badge variant="neutral" size="sm">{summary.opponent.def_line.block_label}</Badge>
              <span className="text-xs text-2 block pt-1 tabular-nums">
                Rebut bola tinggi: <strong className="text-1">{summary.opponent.transitions.high_regains}</strong> · Hilang di area sendiri: <strong className="text-1">{summary.opponent.transitions.dangerous_losses}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Shot Zones */}
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <Target className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-1">Lokasi &amp; Jarak Tembakan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-control border border-line bg-app space-y-1">
              <span className="text-xs text-2 block">{effectiveTeamA} · {summary.own.shot_zones.n} tembakan</span>
              <span className="font-semibold text-1 block tabular-nums">
                Dalam kotak: {summary.own.shot_zones.inside_box.count}
                {summary.own.shot_zones.inside_box.pct != null ? ` · ${summary.own.shot_zones.inside_box.pct}%` : ''}
              </span>
              <span className="text-xs text-2 block tabular-nums">
                Luar kotak: {summary.own.shot_zones.outside_box.count}
              </span>
              <span className="text-xs text-2 block tabular-nums">
                Jarak rata-rata: {summary.own.shot_zones.avg_distance_m != null ? `${summary.own.shot_zones.avg_distance_m} m` : '-'}
              </span>
            </div>

            <div className="p-3 rounded-control border border-line bg-app space-y-1">
              <span className="text-xs text-2 block">{effectiveTeamB} · {summary.opponent.shot_zones.n} tembakan</span>
              <span className="font-semibold text-1 block tabular-nums">
                Dalam kotak: {summary.opponent.shot_zones.inside_box.count}
                {summary.opponent.shot_zones.inside_box.pct != null ? ` · ${summary.opponent.shot_zones.inside_box.pct}%` : ''}
              </span>
              <span className="text-xs text-2 block tabular-nums">
                Luar kotak: {summary.opponent.shot_zones.outside_box.count}
              </span>
              <span className="text-xs text-2 block tabular-nums">
                Jarak rata-rata: {summary.opponent.shot_zones.avg_distance_m != null ? `${summary.opponent.shot_zones.avg_distance_m} m` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Distribusi 5 Koridor Lebar Lapangan */}
      <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-1">Distribusi 5 Koridor Lebar Lapangan</h3>
          </div>
          <span className="text-xs text-2">Arah serang {effectiveTeamA} dari kiri ke kanan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: effectiveTeamA, data: summary.own.corridors },
            { title: effectiveTeamB, data: summary.opponent.corridors }
          ].map((group) => (
            <div key={group.title} className="space-y-2 p-3 rounded-control border border-line bg-app">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-1">{group.title}</span>
                <span className="text-xs text-2 tabular-nums">{group.data.n} aksi berkoordinat</span>
              </div>
              {group.data.corridors.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-2">{c.label}</span>
                    <span className="tabular-nums font-medium text-1">
                      {c.count}{c.pct != null ? ` · ${c.pct}%` : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-panel border border-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${c.pct ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Momentum per Interval 15 Menit */}
      <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
        <div className="flex items-center gap-2 border-b border-line pb-2">
          <Clock className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-1">Momentum per Interval 15 Menit</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.intervals.buckets.map((b) => (
            <div key={b.id} className="p-2.5 rounded-control border border-line bg-app space-y-2 text-sm">
              <div className="flex items-center justify-between font-semibold text-1 tabular-nums">
                <span>{b.label}</span>
                <span className="text-xs text-2 font-normal">{b.n} aksi</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-2 truncate pr-2">{effectiveTeamA}</span>
                  <span className="font-medium text-1 tabular-nums shrink-0">{b.own_events} · {b.own_shots} tembakan</span>
                </div>
                <div className="h-1.5 bg-panel rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${Math.round((b.own_events / maxIntervalEvents) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-2 truncate pr-2">{effectiveTeamB}</span>
                  <span className="font-medium text-2 tabular-nums shrink-0">{b.opp_events} · {b.opp_shots} tembakan</span>
                </div>
                <div className="h-1.5 bg-panel rounded-full overflow-hidden">
                  <div
                    className="h-full bg-2/50"
                    style={{ width: `${Math.round((b.opp_events / maxIntervalEvents) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 8: Ringkasan Temuan Utama Laga */}
      {summary.observations.length > 0 && (
        <div className="p-4 border border-line rounded-panel bg-panel space-y-3">
          <div className="flex items-start gap-2 border-b border-line pb-2">
            <BookOpen className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-1">Ringkasan Temuan Utama Laga</h3>
              <p className="text-xs text-2">
                Kesimpulan otomatis dari seluruh angka di atas sebagai bahan evaluasi cepat pelatih dan laporan pertandingan.
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {summary.observations.map((obs) => {
              const localizedDetail = String(obs.detail || '')
                .replace(/\bTim kita\b/g, effectiveTeamA)
                .replace(/\btim kita\b/g, effectiveTeamA)
                .replace(/\bLawan\b/g, effectiveTeamB)
                .replace(/\blawan\b/g, effectiveTeamB);
              return (
                <div key={obs.id} className="p-3 rounded-control border border-line bg-app space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-1">{stripParens(obs.title)}</span>
                    <Badge variant="neutral" size="sm">
                      {obs.perspective === 'own' ? effectiveTeamA : obs.perspective === 'opponent' ? effectiveTeamB : 'Perbandingan'}
                    </Badge>
                  </div>
                  <p className="text-sm text-2 leading-relaxed">{localizedDetail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Daftar Referensi Ilmiah Terpusat */}
      <details
        className="p-4 border border-line rounded-panel bg-panel"
        data-testid="scientific-references-footer"
      >
        <summary className="text-sm font-semibold text-1 cursor-pointer select-none flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand" />
            <span>Referensi Ilmiah &amp; Metodologi</span>
          </span>
          <span className="text-xs font-normal text-2">{allReferenceIds.length} rujukan</span>
        </summary>
        <p className="text-xs text-2 mt-2 mb-3">
          Seluruh indikator analisis taktis dan rekomendasi latihan di halaman ini merujuk pada literatur berikut:
        </p>
        <div className="flex flex-wrap gap-2">
          {allReferenceIds.map((rid) => (
            <RefChip key={rid} referenceId={rid} />
          ))}
        </div>
      </details>
    </div>
  );
}
