import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Layers,
  Box,
  Square
} from 'lucide-react';
import { EVENT_TYPE_LABELS } from '../../lib/matches';
import { defensiveLineHeight } from '../../lib/analysis/events';
import Badge from '../ui/Badge';

const SPEEDS = [0.5, 1, 2];

function cleanTeamName(name, fallback) {
  const cleaned = String(name || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

function describeZone(x, y, L, W, team) {
  const relX = team === 'opponent' ? L - Number(x) : Number(x);
  const third = relX < L / 3 ? 'Sepertiga Pertahanan' : relX < (2 * L) / 3 ? 'Sepertiga Tengah' : 'Sepertiga Akhir';
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
  return { third, corridor };
}

function buildActionNarrative(evt, playerLabel, teamLabel, L, W) {
  const fromZone = describeZone(evt.x_m, evt.y_m, L, W, evt.team);
  const hasEnd = evt.end_x_m != null && !isNaN(evt.end_x_m) && evt.end_y_m != null && !isNaN(evt.end_y_m);
  const distM = hasEnd
    ? Math.hypot(Number(evt.end_x_m) - Number(evt.x_m), Number(evt.end_y_m) - Number(evt.y_m)).toFixed(1)
    : null;

  if (evt.event_type === 'pass' || evt.event_type === 'key_pass') {
    if (hasEnd) {
      const toZone = describeZone(evt.end_x_m, evt.end_y_m, L, W, evt.team);
      const dx = evt.team === 'opponent' ? Number(evt.x_m) - Number(evt.end_x_m) : Number(evt.end_x_m) - Number(evt.x_m);
      const intent =
        dx >= 8
          ? 'umpan progresif ke depan'
          : dx <= -5
            ? 'umpan balik untuk menjaga penguasaan'
            : 'umpan sirkulasi melebar';
      return `${playerLabel} dari ${teamLabel} mengumpan sejauh ${distM} m dari ${fromZone.corridor} ke ${toZone.corridor} di ${toZone.third} — ${intent}.`;
    }
    return `${playerLabel} dari ${teamLabel} melepaskan umpan dari ${fromZone.corridor} di ${fromZone.third}.`;
  }

  if (evt.event_type === 'shot' || evt.event_type === 'shot_on_target' || evt.event_type === 'goal') {
    const goalX = evt.team === 'opponent' ? 0 : L;
    const goalDist = Math.hypot(goalX - Number(evt.x_m), W / 2 - Number(evt.y_m)).toFixed(1);
    return `${playerLabel} dari ${teamLabel} melepaskan tembakan ke arah gawang dari ${fromZone.corridor}, jarak sekitar ${goalDist} m.`;
  }

  if (evt.event_type === 'ball_loss') {
    const risk = fromZone.third === 'Sepertiga Pertahanan' ? 'area berbahaya sendiri — rawan serangan balik' : `${fromZone.third} — perlu reaksi pressing cepat`;
    return `${playerLabel} dari ${teamLabel} kehilangan penguasaan bola di ${fromZone.corridor}, ${risk}.`;
  }

  if (evt.event_type === 'ball_recovery' || evt.event_type === 'interception' || evt.event_type === 'tackle') {
    const oppArea = fromZone.third === 'Sepertiga Akhir' ? 'peluang transisi serang cepat dekat gawang lawan' : 'memutus alur serangan lawan';
    return `${playerLabel} dari ${teamLabel} merebut bola di ${fromZone.corridor}, ${fromZone.third} — ${oppArea}.`;
  }

  return `${playerLabel} dari ${teamLabel} melakukan aksi di ${fromZone.corridor}, ${fromZone.third}.`;
}

function resolvePlayerMeta(evt, idx, participantMap) {
  if (evt?.player_id && participantMap.has(evt.player_id)) {
    const p = participantMap.get(evt.player_id);
    const num = p.jersey_number != null && p.jersey_number !== '' ? String(p.jersey_number) : '';
    const firstName = String(p.full_name || p.name || '').trim().split(/\s+/)[0] || '';
    return {
      jersey: num || (firstName ? firstName.slice(0, 2).toUpperCase() : String((idx % 11) + 1)),
      label: firstName && num ? `${firstName} #${num}` : firstName || (num ? `Pemain #${num}` : `Pemain #${(idx % 11) + 1}`)
    };
  }
  const rawNum =
    evt?.player_number != null && evt.player_number !== ''
      ? Number(evt.player_number)
      : evt?.opponent_number != null && evt.opponent_number !== ''
        ? Number(evt.opponent_number)
        : null;
  if (Number.isFinite(rawNum) && rawNum >= 1 && rawNum <= 99) {
    return {
      jersey: String(Math.round(rawNum)),
      label: `Pemain #${Math.round(rawNum)}`
    };
  }
  const fallbackNum = (idx % 11) + 1;
  return {
    jersey: String(fallbackNum),
    label: `Pemain #${fallbackNum}`
  };
}

export default function MatchVisualReplay({
  match,
  events = [],
  participants = [],
  teamAName = '',
  teamBName = '',
  focusEventKey = null
}) {
  const L = Number(match?.pitch_length_m) || 90;
  const W = Number(match?.pitch_width_m) || 60;
  const homeLabel = cleanTeamName(teamAName || match?.home_team_name, 'Tim Kita');
  const awayLabel = cleanTeamName(teamBName || match?.opponent_name, 'Lawan');

  const participantMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(participants) ? participants : []).forEach((p) => {
      if (p?.id) map.set(p.id, p);
      if (p?.player_id) map.set(p.player_id, p);
    });
    return map;
  }, [participants]);

  const replayEvents = useMemo(() => {
    return (Array.isArray(events) ? events : [])
      .filter((e) => e.x_m != null && !isNaN(e.x_m) && e.y_m != null && !isNaN(e.y_m))
      .sort((a, b) => {
        const pDiff = Number(a.period || 1) - Number(b.period || 1);
        if (pDiff !== 0) return pDiff;
        return Number(a.minute || 0) - Number(b.minute || 0);
      });
  }, [events]);

  const ownDefLine = useMemo(() => defensiveLineHeight(replayEvents, L, 'own'), [replayEvents, L]);
  const oppDefLine = useMemo(() => defensiveLineHeight(replayEvents, L, 'opponent'), [replayEvents, L]);

  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showDefLines, setShowDefLines] = useState(true);
  const [showTrail, setShowTrail] = useState(true);

  const timerRef = useRef(null);
  const safeIndex = Math.min(currentIndex, Math.max(0, replayEvents.length - 1));

  useEffect(() => {
    if (!focusEventKey?.id) return;
    const targetIdx = replayEvents.findIndex(
      (e) => (e.id || e.client_event_id) === focusEventKey.id
    );
    if (targetIdx >= 0) {
      setIsPlaying(false);
      setCurrentIndex(targetIdx);
    }
  }, [focusEventKey, replayEvents]);

  useEffect(() => {
    if (!isPlaying || replayEvents.length <= 1) {
      clearInterval(timerRef.current);
      return;
    }
    const intervalMs = Math.max(350, Math.round(1200 / speed));
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= replayEvents.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, replayEvents.length]);

  if (replayEvents.length === 0) {
    return (
      <div className="p-4 border border-line rounded-panel bg-panel space-y-2" data-testid="match-visual-replay">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-1">Replay Visual Pertandingan</h3>
          </div>
        </div>
        <p className="text-sm text-2">
          Belum ada kejadian berkoordinat untuk diputar ulang. Catat kejadian di lapangan atau jalankan analisis video terlebih dahulu.
        </p>
      </div>
    );
  }

  const activeEvt = replayEvents[safeIndex];
  const activePlayer = resolvePlayerMeta(activeEvt, safeIndex, participantMap);
  const activeTeamLabel = activeEvt.team === 'own' ? homeLabel : awayLabel;
  const actionNarrative = buildActionNarrative(activeEvt, activePlayer.label, activeTeamLabel, L, W);
  const trailStart = Math.max(0, safeIndex - 4);
  const trailEvents = showTrail ? replayEvents.slice(trailStart, safeIndex + 1) : [activeEvt];

  const boxDepth = Math.min(16.5, L * 0.18);
  const boxWidth = Math.min(40.32, W * 0.64);
  const boxY = (W - boxWidth) / 2;

  const ownLineX = ownDefLine.avg_m != null ? Math.max(0, Math.min(L, ownDefLine.avg_m)) : null;
  const oppLineX = oppDefLine.avg_m != null ? Math.max(0, Math.min(L, L - oppDefLine.avg_m)) : null;

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <div className="p-4 border border-line rounded-panel bg-panel space-y-3.5" data-testid="match-visual-replay">
      {/* Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Box className="w-4 h-4 text-brand shrink-0" />
          <h3 className="text-sm font-semibold text-1">Replay Visual Pertandingan</h3>
          <Badge variant="neutral" size="sm">
            {safeIndex + 1} / {replayEvents.length} kejadian
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex rounded-control border border-line bg-app p-0.5" role="group" aria-label="Mode kamera lapangan">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              aria-pressed={viewMode === '3d'}
              className={`px-2.5 py-1 rounded-control text-sm font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === '3d' ? 'bg-brand text-app' : 'text-2 hover:text-1'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Perspektif</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              aria-pressed={viewMode === '2d'}
              className={`px-2.5 py-1 rounded-control text-sm font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === '2d' ? 'bg-brand text-app' : 'text-2 hover:text-1'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>2D Atas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Layer Toggles */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-2 inline-flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Lapisan:
          </span>
          <button
            type="button"
            onClick={() => setShowCorridors((v) => !v)}
            aria-pressed={showCorridors}
            className={`px-2 py-1 rounded-control border cursor-pointer transition-colors ${
              showCorridors ? 'bg-raised border-brand text-1 font-medium' : 'bg-app border-line text-2'
            }`}
          >
            5 Koridor
          </button>
          <button
            type="button"
            onClick={() => setShowDefLines((v) => !v)}
            aria-pressed={showDefLines}
            className={`px-2 py-1 rounded-control border cursor-pointer transition-colors ${
              showDefLines ? 'bg-raised border-brand text-1 font-medium' : 'bg-app border-line text-2'
            }`}
          >
            Garis Blok Bertahan
          </button>
          <button
            type="button"
            onClick={() => setShowTrail((v) => !v)}
            aria-pressed={showTrail}
            className={`px-2 py-1 rounded-control border cursor-pointer transition-colors ${
              showTrail ? 'bg-raised border-brand text-1 font-medium' : 'bg-app border-line text-2'
            }`}
          >
            Jejak 5 Aksi
          </button>
        </div>

        <div className="flex items-center gap-3 text-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {homeLabel} &rarr;
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            {awayLabel} &larr;
          </span>
        </div>
      </div>

      {/* 3D / 2D Pitch Stage */}
      <div
        className="relative w-full rounded-control border border-line bg-[#0f1714] overflow-hidden px-3 py-2.5 sm:px-5 sm:py-3.5"
        style={{ perspective: '920px' }}
      >
        <div
          className="mx-auto max-w-3xl transition-transform duration-500 ease-out"
          style={{
            transform: viewMode === '3d' ? 'rotateX(44deg) scale(0.95)' : 'rotateX(0deg) scale(1)',
            transformOrigin: 'center center'
          }}
        >
          <svg
            viewBox={`-4 -4 ${L + 8} ${W + 8}`}
            className="w-full h-auto block rounded-sm shadow-lg"
            role="img"
            aria-label={`Visualisasi lapangan ${viewMode.toUpperCase()} untuk kejadian ke-${safeIndex + 1}`}
          >
            <defs>
              <marker
                id="replay-arrow-success"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4.5"
                markerHeight="4.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
              </marker>
              <marker
                id="replay-arrow-fail"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4.5"
                markerHeight="4.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Turf Base + Mowed Stripes */}
            <rect x="-4" y="-4" width={L + 8} height={W + 8} fill="#143326" />
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={`stripe-${i}`}
                x={(L / 10) * i}
                y={0}
                width={L / 10}
                height={W}
                fill={i % 2 === 0 ? '#184231' : '#1b4a37'}
              />
            ))}

            {/* Tactical Thirds Subtle Dividers & Zone Labels */}
            <line x1={L / 3} y1={0} x2={L / 3} y2={W} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.35" strokeDasharray="1.5 2" />
            <line x1={(2 * L) / 3} y1={0} x2={(2 * L) / 3} y2={W} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="0.35" strokeDasharray="1.5 2" />
            <text x={L / 6} y={W + 2.6} textAnchor="middle" fill="#a7f3d0" fillOpacity="0.55" fontSize="2.1" fontFamily="sans-serif">
              Pertahanan {homeLabel}
            </text>
            <text x={L / 2} y={W + 2.6} textAnchor="middle" fill="#a7f3d0" fillOpacity="0.55" fontSize="2.1" fontFamily="sans-serif">
              Area Tengah
            </text>
            <text x={(5 * L) / 6} y={W + 2.6} textAnchor="middle" fill="#a7f3d0" fillOpacity="0.55" fontSize="2.1" fontFamily="sans-serif">
              Sepertiga Akhir
            </text>

            {/* 5 Tactical Corridors */}
            {showCorridors &&
              [1, 2, 3, 4].map((idx) => (
                <line
                  key={`corr-${idx}`}
                  x1={0}
                  y1={(W / 5) * idx}
                  x2={L}
                  y2={(W / 5) * idx}
                  stroke="#ffffff"
                  strokeOpacity="0.16"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 1.5"
                />
              ))}

            {/* Pitch Markings */}
            <rect x={0} y={0} width={L} height={W} fill="none" stroke="#d1fae5" strokeOpacity="0.7" strokeWidth="0.5" />
            <line x1={L / 2} y1={0} x2={L / 2} y2={W} stroke="#d1fae5" strokeOpacity="0.7" strokeWidth="0.45" />
            <circle cx={L / 2} cy={W / 2} r={Math.min(9.15, W * 0.15)} fill="none" stroke="#d1fae5" strokeOpacity="0.7" strokeWidth="0.45" />
            <circle cx={L / 2} cy={W / 2} r={0.6} fill="#d1fae5" fillOpacity="0.8" />

            {/* Left & Right Penalty Boxes */}
            <rect x={0} y={boxY} width={boxDepth} height={boxWidth} fill="none" stroke="#d1fae5" strokeOpacity="0.7" strokeWidth="0.45" />
            <rect x={L - boxDepth} y={boxY} width={boxDepth} height={boxWidth} fill="none" stroke="#d1fae5" strokeOpacity="0.7" strokeWidth="0.45" />

            {/* Defensive Block Lines */}
            {showDefLines && ownLineX != null && (
              <g>
                <line
                  x1={ownLineX}
                  y1={0}
                  x2={ownLineX}
                  y2={W}
                  stroke="#10b981"
                  strokeWidth="0.75"
                  strokeDasharray="2 1.2"
                />
                <text x={ownLineX + 1} y={3.5} fill="#6ee7b7" fontSize="2.4" fontFamily="monospace">
                  Blok {homeLabel} {ownDefLine.avg_m}m
                </text>
              </g>
            )}

            {showDefLines && oppLineX != null && (
              <g>
                <line
                  x1={oppLineX}
                  y1={0}
                  x2={oppLineX}
                  y2={W}
                  stroke="#f59e0b"
                  strokeWidth="0.75"
                  strokeDasharray="2 1.2"
                />
                <text x={Math.max(2, oppLineX - 24)} y={W - 1.5} fill="#fcd34d" fontSize="2.4" fontFamily="monospace">
                  Blok {awayLabel} {oppDefLine.avg_m}m
                </text>
              </g>
            )}

            {/* Trail Connectors */}
            {showTrail &&
              trailEvents.map((ev, idx) => {
                if (idx === 0) return null;
                const prev = trailEvents[idx - 1];
                return (
                  <line
                    key={`trail-${ev.id || idx}`}
                    x1={Number(prev.x_m)}
                    y1={Number(prev.y_m)}
                    x2={Number(ev.x_m)}
                    y2={Number(ev.y_m)}
                    stroke="#e2e8f0"
                    strokeOpacity={0.25 + (idx / trailEvents.length) * 0.45}
                    strokeWidth="0.55"
                    strokeDasharray="1.2 1.2"
                  />
                );
              })}

            {/* Trail Nodes with Jersey Number */}
            {trailEvents.slice(0, -1).map((ev, idx) => {
              const pMeta = resolvePlayerMeta(ev, trailStart + idx, participantMap);
              return (
                <g key={`node-${ev.id || idx}`} opacity={0.55 + (idx / trailEvents.length) * 0.35}>
                  <circle
                    cx={Number(ev.x_m)}
                    cy={Number(ev.y_m)}
                    r={1.7}
                    fill={ev.team === 'own' ? '#10b981' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="0.35"
                  />
                  <text
                    x={Number(ev.x_m)}
                    y={Number(ev.y_m) + 0.65}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="1.8"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {pMeta.jersey}
                  </text>
                </g>
              );
            })}

            {/* Active Event Pass/Shot Directional Arrow + Animated Ball + Distance Tag */}
            {activeEvt.end_x_m != null && activeEvt.end_y_m != null && (() => {
              const x1 = Number(activeEvt.x_m);
              const y1 = Number(activeEvt.y_m);
              const x2 = Number(activeEvt.end_x_m);
              const y2 = Number(activeEvt.end_y_m);
              const isFail = activeEvt.outcome === 'fail';
              const strokeColor = isFail ? '#f87171' : '#34d399';
              const distM = Math.hypot(x2 - x1, y2 - y1).toFixed(1);
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              return (
                <g key={`traj-${safeIndex}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth="1.05"
                    strokeDasharray={isFail ? '1.8 1.4' : 'none'}
                    markerEnd={isFail ? 'url(#replay-arrow-fail)' : 'url(#replay-arrow-success)'}
                  />
                  {/* Receiver / Target Ring */}
                  <circle
                    cx={x2}
                    cy={y2}
                    r={2.1}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="0.55"
                    strokeOpacity="0.85"
                  />
                  {/* Animated Ball traveling along pass/shot path */}
                  <circle r={1.15} fill="#ffffff" stroke="#0f172a" strokeWidth="0.35">
                    <animateMotion
                      dur="0.65s"
                      fill="freeze"
                      path={`M ${x1} ${y1} L ${x2} ${y2}`}
                    />
                  </circle>
                  {/* Distance Pill */}
                  <rect
                    x={midX - 4.8}
                    y={midY - 3.6}
                    width={9.6}
                    height={3.2}
                    rx={1.0}
                    fill="#0f172a"
                    fillOpacity="0.85"
                    stroke={strokeColor}
                    strokeWidth="0.3"
                  />
                  <text
                    x={midX}
                    y={midY - 1.3}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="1.9"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {distM}m
                  </text>
                </g>
              );
            })()}

            {/* Active Event Marker + Smooth Glide Transition + Jersey Number + Player Label */}
            {(() => {
              const mx = Number(activeEvt.x_m);
              const groundY = Number(activeEvt.y_m);
              const lift = viewMode === '3d' ? Math.min(4.2, groundY - 4) : 0;
              const tagText = activePlayer.label;
              const tagW = Math.max(10, tagText.length * 1.45 + 3);
              const clampedTagOffset = Math.max(1 - mx, Math.min(L - tagW - 1 - mx, -tagW / 2));
              return (
                <g
                  data-testid="replay-active-player-marker"
                  style={{
                    transform: `translate(${mx}px, ${groundY}px)`,
                    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                >
                  <ellipse
                    cx={0}
                    cy={0.8}
                    rx={2.5}
                    ry={1.2}
                    fill="#000000"
                    fillOpacity="0.45"
                  />
                  {viewMode === '3d' && lift > 0 && (
                    <line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={-lift}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                  )}
                  <circle
                    cx={0}
                    cy={-lift}
                    r={2.9}
                    fill={activeEvt.team === 'own' ? '#10b981' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="0.7"
                  />
                  <text
                    x={0}
                    y={-lift + 1.0}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="2.7"
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {activePlayer.jersey}
                  </text>
                  <rect
                    x={clampedTagOffset}
                    y={-lift - 7.6}
                    width={tagW}
                    height={3.8}
                    rx={1.2}
                    fill="#0f172a"
                    fillOpacity="0.92"
                    stroke={activeEvt.team === 'own' ? '#10b981' : '#f59e0b'}
                    strokeWidth="0.35"
                  />
                  <text
                    x={clampedTagOffset + tagW / 2}
                    y={-lift - 4.95}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="2.1"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {tagText}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Active Event Callout Bar + Coaching Narrative */}
        <div className="mt-3 p-3 rounded-control bg-panel/95 border border-line space-y-1.5 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={activeEvt.team === 'own' ? 'brand' : 'neutral'} size="sm">
                {activeTeamLabel}
              </Badge>
              <span className="font-semibold text-1" data-testid="replay-active-player-label">
                {activePlayer.label}
              </span>
              <span className="font-mono text-2 tabular-nums">
                Babak {activeEvt.period || 1} · {activeEvt.minute ?? 0}&apos;
              </span>
              <span className="font-semibold text-1">
                {EVENT_TYPE_LABELS[activeEvt.event_type] || activeEvt.event_type}
              </span>
              {activeEvt.outcome && (
                <Badge variant={activeEvt.outcome === 'success' ? 'brand' : 'danger'} size="sm">
                  {activeEvt.outcome === 'success' ? 'Sukses' : 'Gagal'}
                </Badge>
              )}
            </div>
            <span className="font-mono text-2 tabular-nums">
              Posisi {activeEvt.x_m}m, {activeEvt.y_m}m
            </span>
          </div>
          <p className="text-sm text-2 leading-relaxed" data-testid="replay-action-narrative">
            {actionNarrative}
          </p>
        </div>
      </div>

      {/* Playback Controls & Timeline */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={Math.max(0, replayEvents.length - 1)}
          value={safeIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          aria-label="Linimasa replay kejadian"
          className="w-full h-1.5 cursor-pointer accent-brand bg-raised rounded-lg"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (safeIndex >= replayEvents.length - 1) setCurrentIndex(0);
                setIsPlaying((p) => !p);
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-control bg-brand text-app hover:bg-brand/90 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Jeda' : 'Putar Replay'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={safeIndex === 0}
              aria-label="Kejadian sebelumnya"
              className="min-h-[38px] px-2.5 py-1.5 rounded-control bg-raised border border-line text-1 disabled:opacity-40 cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.min(replayEvents.length - 1, prev + 1));
              }}
              disabled={safeIndex >= replayEvents.length - 1}
              aria-label="Kejadian berikutnya"
              className="min-h-[38px] px-2.5 py-1.5 rounded-control bg-raised border border-line text-1 disabled:opacity-40 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Ulang dari awal"
              className="min-h-[38px] px-2.5 py-1.5 rounded-control bg-app border border-line text-2 hover:text-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`min-h-[36px] px-2 py-1 rounded-control text-sm font-mono cursor-pointer border ${
                  speed === s
                    ? 'bg-raised border-brand text-brand font-semibold'
                    : 'bg-app border-line text-2 hover:text-1'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
