import React, { useState } from 'react';
import {
  Check,
  X,
  Target,
  Shield,
  ArrowRight,
  MapPin,
  RotateCcw,
  Users,
  Undo2,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import PitchSvg from '../ui/PitchSvg';
import Button from '../ui/Button';
import { EVENT_TYPE_LABELS } from '../../lib/matches';

export default function TactileKeypad({
  match,
  participants = [],
  selectedPlayerId,
  onSelectPlayer,
  onLogEvent,
  onUndoLast,
  lastLoggedEvent = null,
  totalEventsCount = 0,
  loggedEvents = [],
  playerMap = {},
  isReadOnly = false
}) {
  const [team, setTeam] = useState('own'); // 'own' | 'opponent'
  const [opponentNumber, setOpponentNumber] = useState('7');
  const [recordLocation, setRecordLocation] = useState(false);
  const [coords, setCoords] = useState({ x_m: null, y_m: null, end_x_m: null, end_y_m: null });
  const [flashingKey, setFlashingKey] = useState(null);

  const pitchLength = match?.pitch_length_m || 90;
  const pitchWidth = match?.pitch_width_m || 60;

  const spatialEvents = loggedEvents.filter(
    (evt) => evt && evt.x_m !== null && evt.x_m !== undefined && evt.y_m !== null && evt.y_m !== undefined
  );
  const recentSpatialEvents = spatialEvents.slice(-20);

  // Selected player for own team
  const activeParticipant =
    participants.find((p) => p.player_id === selectedPlayerId) ||
    participants[0] ||
    null;

  const handlePitchClick = (x, y) => {
    if (isReadOnly) return;
    if (coords.x_m === null) {
      // First tap sets start coordinate
      setCoords({ x_m: x, y_m: y, end_x_m: null, end_y_m: null });
    } else if (coords.end_x_m === null) {
      // Second tap sets end coordinate
      setCoords((prev) => ({ ...prev, end_x_m: x, end_y_m: y }));
    } else {
      // Third tap restarts with new start coordinate
      setCoords({ x_m: x, y_m: y, end_x_m: null, end_y_m: null });
    }
  };

  const handleResetCoords = () => {
    setCoords({ x_m: null, y_m: null, end_x_m: null, end_y_m: null });
  };

  const triggerLog = (keyId, eventType, outcome = null, defaultNote = '') => {
    if (isReadOnly) return;

    setFlashingKey(keyId);
    setTimeout(() => setFlashingKey(null), 200);

    const hasLocation = recordLocation && coords.x_m !== null && coords.y_m !== null;

    const eventPayload = {
      team,
      player_id: team === 'own' ? (activeParticipant?.player_id || selectedPlayerId) : null,
      opponent_number: team === 'opponent' ? Number(opponentNumber) : null,
      event_type: eventType,
      outcome,
      x_m: hasLocation ? coords.x_m : null,
      y_m: hasLocation ? coords.y_m : null,
      end_x_m: hasLocation && coords.end_x_m !== null ? coords.end_x_m : null,
      end_y_m: hasLocation && coords.end_y_m !== null ? coords.end_y_m : null,
      note: defaultNote
    };

    onLogEvent?.(eventPayload);

    // Reset location coordinates after logging an event
    if (recordLocation) {
      setCoords({ x_m: null, y_m: null, end_x_m: null, end_y_m: null });
    }
  };

  return (
    <section className="space-y-3 sm:space-y-3.5 text-1 select-none">
      {/* 1. Team Switcher & Opponent/Player Picker Bar */}
      <div className="p-2.5 sm:p-3 rounded-panel bg-panel border border-line space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Team Switcher: Tim kita vs Lawan (min 44px) */}
          <div className="inline-flex rounded-control border border-control p-1 bg-app self-start">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setTeam('own')}
              className={`min-h-[44px] px-4 rounded-control text-sm font-semibold transition-colors duration-150 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${team === 'own'
                ? 'bg-brand text-app shadow-xs'
                : 'text-2 hover:text-1'
                }`}
            >
              <Users className="w-4 h-4" strokeWidth={1.5} />
              <span>Tim kita</span>
            </button>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setTeam('opponent')}
              className={`min-h-[44px] px-4 rounded-control text-sm font-semibold transition-colors duration-150 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${team === 'opponent'
                ? 'bg-raised text-1 border border-line shadow-xs'
                : 'text-2 hover:text-1'
                }`}
            >
              <Shield className="w-4 h-4" strokeWidth={1.5} />
              <span>Lawan</span>
            </button>
          </div>

          {/* Location Toggle (Catat lokasi) */}
          <button
            type="button"
            role="switch"
            aria-checked={recordLocation}
            disabled={isReadOnly}
            onClick={() => setRecordLocation((prev) => !prev)}
            className={`flex items-center gap-2 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control border text-sm font-medium cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${recordLocation
              ? 'bg-raised border-control text-1'
              : 'bg-transparent border-transparent text-2 hover:text-1'
              }`}
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${recordLocation
                ? 'bg-brand border-brand text-app font-bold'
                : 'border-control bg-app'
                }`}
            >
              {recordLocation && (
                <Check className="w-3 h-3 stroke-[2.5]" />
              )}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-series-1" strokeWidth={1.5} />
              Catat lokasi koordinat
            </span>
          </button>
        </div>

        {/* Player or Opponent Selector */}
        {team === 'own' ? (
          <div className="space-y-1.5 pt-1 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-2">Pilih pemain:</span>
              {activeParticipant && (
                <span className="text-sm font-semibold text-brand">
                  <span className="font-mono">#{activeParticipant.number}</span> {activeParticipant.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {participants.length > 0 ? (
                participants.map((p) => {
                  const isSelected = p.player_id === (activeParticipant?.player_id || selectedPlayerId);
                  return (
                    <button
                      key={p.player_id}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => onSelectPlayer?.(p.player_id)}
                      className={`shrink-0 min-h-[44px] px-3 rounded-control border text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${isSelected
                        ? 'bg-brand/10 text-brand border-brand/40 font-semibold'
                        : 'bg-raised hover:bg-panel text-2 hover:text-1 border-line'
                        }`}
                    >
                      <span className="font-mono font-bold">#{p.number}</span>
                      <span className="truncate max-w-[100px]">{p.name}</span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-2 py-1">Belum ada pemain yang didaftarkan pada laga ini.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-line">
            <label htmlFor="opp-num" className="text-sm font-medium text-2 shrink-0">
              Nomor punggung lawan 1-99:
            </label>
            <input
              id="opp-num"
              type="number"
              inputMode="numeric"
              min="1"
              max="99"
              disabled={isReadOnly}
              value={opponentNumber}
              onChange={(e) => setOpponentNumber(e.target.value)}
              className="w-20 px-3 min-h-[44px] sm:min-h-0 sm:h-9 bg-app border border-control rounded-control text-sm font-mono font-bold tabular-nums text-1 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-sm text-2">
              Hanya nomor punggung, tanpa nama pemain
            </span>
          </div>
        )}
      </div>

      {/* 2. Optional Pitch Svg with Attack Direction */}
      {recordLocation && (
        <div className="p-3.5 rounded-panel bg-panel border border-line space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-2">
              <span className="font-medium text-1">Arah serang</span>
              <ArrowRight className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
              <span>Kiri ke Kanan</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {coords.x_m !== null ? (
                <span className="tabular-nums text-brand font-semibold">
                  Mulai: ({coords.x_m}, {coords.y_m}) m
                  {coords.end_x_m !== null && ` -> Akhir: (${coords.end_x_m}, ${coords.end_y_m}) m`}
                </span>
              ) : (
                <span className="text-2">Ketuk lapangan untuk titik mulai</span>
              )}

              {coords.x_m !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCoords}
                  icon={<RotateCcw className="w-3 h-3" />}
                >
                  Reset titik
                </Button>
              )}
            </div>
          </div>

          <PitchSvg
            pitchLengthM={pitchLength}
            pitchWidthM={pitchWidth}
            orientation="horizontal"
            onPitchClick={handlePitchClick}
            className="max-h-48 sm:max-h-60"
          >
            {/* Subtle ghost trail of previously logged spatial events */}
            {recentSpatialEvents.map((evt, idx) => {
              const hasEnd =
                evt.end_x_m !== null &&
                evt.end_x_m !== undefined &&
                evt.end_y_m !== null &&
                evt.end_y_m !== undefined;
              const dotClass =
                evt.outcome === 'fail'
                  ? 'fill-danger'
                  : evt.team === 'own'
                  ? 'fill-brand'
                  : 'fill-warning';
              const lineClass = evt.team === 'own' ? 'stroke-brand' : 'stroke-warning';

              return (
                <g key={evt.client_event_id || evt.id || `ghost-${idx}`} className="pointer-events-none">
                  {hasEnd && (
                    <>
                      <line
                        x1={evt.x_m}
                        y1={evt.y_m}
                        x2={evt.end_x_m}
                        y2={evt.end_y_m}
                        className={lineClass}
                        strokeWidth="0.6"
                        strokeDasharray="1.2,1.2"
                        opacity="0.35"
                      />
                      <circle
                        cx={evt.end_x_m}
                        cy={evt.end_y_m}
                        r="1.1"
                        className="fill-series-1"
                        opacity="0.4"
                      />
                    </>
                  )}
                  <circle
                    cx={evt.x_m}
                    cy={evt.y_m}
                    r="1.35"
                    className={dotClass}
                    opacity="0.45"
                  />
                </g>
              );
            })}

            {/* Start marker */}
            {coords.x_m !== null && coords.y_m !== null && (
              <g>
                <circle
                  cx={coords.x_m}
                  cy={coords.y_m}
                  r="1.8"
                  className="fill-brand stroke-panel"
                  strokeWidth="0.5"
                />
                <circle
                  cx={coords.x_m}
                  cy={coords.y_m}
                  r="3.5"
                  fill="none"
                  className="stroke-brand"
                  strokeWidth="0.4"
                  opacity="0.8"
                />
              </g>
            )}

            {/* End marker & line */}
            {coords.x_m !== null && coords.end_x_m !== null && (
              <g>
                <line
                  x1={coords.x_m}
                  y1={coords.y_m}
                  x2={coords.end_x_m}
                  y2={coords.end_y_m}
                  className="stroke-brand"
                  strokeWidth="0.8"
                  strokeDasharray="1.5,1"
                />
                <circle
                  cx={coords.end_x_m}
                  cy={coords.end_y_m}
                  r="1.6"
                  className="fill-series-1 stroke-panel"
                  strokeWidth="0.5"
                />
              </g>
            )}
          </PitchSvg>

          <div
            data-testid="spatial-events-summary"
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-2 pt-0.5"
          >
            <span className="tabular-nums">
              {spatialEvents.length > 0
                ? `${spatialEvents.length} titik koordinat tercatat di laga ini`
                : 'Belum ada titik koordinat tercatat'}
            </span>
            <span>
              Pola lengkap tampil di Detail Laga · Peta lapangan &amp; Analisis Taktis
            </span>
          </div>
        </div>
      )}

      {/* 3. Instant Feedback Strip */}
      <div
        data-testid="keypad-feedback-strip"
        className="px-3 py-2 rounded-control bg-raised border border-line flex flex-wrap items-center justify-between gap-2 text-sm"
      >
        {lastLoggedEvent ? (
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-brand shrink-0" strokeWidth={1.75} />
            <span className="text-1 truncate">
              <span className="text-2">Tercatat: </span>
              <strong className="font-semibold text-1">
                {lastLoggedEvent.team === 'own'
                  ? (() => {
                      const info = lastLoggedEvent.player_id ? playerMap[lastLoggedEvent.player_id] : null;
                      return info ? `#${info.number} ${info.name}` : 'Tim kita';
                    })()
                  : `Lawan #${lastLoggedEvent.opponent_number || '-'}`}
              </strong>
              {' · '}
              <span className="text-brand font-medium">
                {lastLoggedEvent.note || EVENT_TYPE_LABELS[lastLoggedEvent.event_type] || lastLoggedEvent.event_type}
              </span>
              {' · '}
              <span className="font-mono text-2 tabular-nums">
                B{lastLoggedEvent.period || 1} {lastLoggedEvent.minute ?? 0}&apos;
              </span>
            </span>
          </div>
        ) : (
          <span className="text-2">
            Pilih pemain di atas, lalu tekan salah satu tombol aksi di bawah untuk mencatat kejadian.
          </span>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-sm text-2 tabular-nums px-2 py-0.5 rounded-control bg-panel border border-line">
            Total {totalEventsCount}
          </span>
          {!isReadOnly && totalEventsCount > 0 && onUndoLast && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onUndoLast}
              icon={<Undo2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              className="whitespace-nowrap shrink-0"
            >
              Batalkan
            </Button>
          )}
        </div>
      </div>

      {/* 4. Core Action Buttons Keypad (8 aksi inti paling sering dipakai) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Pass Accurate */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('pass_success', 'pass', 'success', 'Umpan akurat')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'pass_success'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 text-brand font-semibold text-sm">
            <Check className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Umpan akurat</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Berhasil</span>
        </button>

        {/* Pass Misplaced */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('pass_fail', 'pass', 'fail', 'Umpan meleset')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'pass_fail'
            ? 'bg-danger/20 border-danger text-danger'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 text-danger font-semibold text-sm">
            <X className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Umpan meleset</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Meleset</span>
        </button>

        {/* Goal */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('goal', 'goal', 'success', 'Gol')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'goal'
            ? 'bg-brand/30 border-brand text-brand'
            : 'border-brand/40 bg-brand/10 hover:bg-brand/15 text-brand'
            }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Target className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Gol</span>
          </div>
          <span className="text-sm mt-0.5">Masuk</span>
        </button>

        {/* Shot On Target */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('shot_on_target', 'shot_on_target', 'success', 'Tembakan tepat sasaran')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'shot_on_target'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm text-1">
            <Target className="w-4 h-4 text-2 shrink-0" strokeWidth={1.5} />
            <span>Tepat sasaran</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Ke gawang</span>
        </button>

        {/* Tackle Won */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('tackle_won', 'tackle', 'success', 'Tekel berhasil')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'tackle_won'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm text-brand">
            <Shield className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Tekel berhasil</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Berhasil</span>
        </button>

        {/* Interception */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('interception', 'interception', 'success', 'Intersepsi')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'interception'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm text-1">
            <Shield className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
            <span>Intersepsi</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Potong umpan</span>
        </button>

        {/* Save */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('save', 'save', 'success', 'Penyelamatan')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'save'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm text-brand">
            <Shield className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Penyelamatan</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Blok kiper</span>
        </button>

        {/* Foul Won */}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => triggerLog('foul_won', 'foul_won', 'success', 'Pelanggaran didapat')}
          className={`min-h-[56px] p-3 rounded-control border bg-panel transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'foul_won'
            ? 'bg-brand/20 border-brand text-brand'
            : 'border-line hover:bg-raised text-1'
            }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm text-1">
            <Check className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
            <span>Pelanggaran didapat</span>
          </div>
          <span className="text-sm text-2 mt-0.5">Ditekel lawan</span>
        </button>
      </div>

      {/* 5. Secondary / Advanced Actions (collapsible so main keypad stays clean) */}
      <details className="group rounded-panel border border-line bg-panel">
        <summary className="px-3.5 py-2.5 text-sm font-medium text-1 cursor-pointer select-none flex flex-wrap items-center justify-between gap-2 list-none">
          <span className="flex items-center gap-2">
            <ChevronDown className="w-4 h-4 text-2 transition-transform group-open:rotate-180 shrink-0" />
            <span>Aksi lainnya</span>
          </span>
          <span className="text-sm text-2 font-normal">
            Umpan kunci · Tembakan meleset · Sapuan · Sepak pojok
          </span>
        </summary>

        <div className="p-3 pt-1 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Key Pass */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('key_pass', 'key_pass', 'success', 'Umpan kunci')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'key_pass'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 text-brand font-semibold text-sm">
              <Target className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Umpan kunci</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Peluang</span>
          </button>

          {/* Shot Off Target */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('shot_off', 'shot', 'fail', 'Tembakan meleset')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'shot_off'
              ? 'bg-danger/20 border-danger text-danger'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-danger">
              <X className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Tembakan meleset</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Meleset</span>
          </button>

          {/* Tackle Lost */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('tackle_lost', 'tackle', 'fail', 'Tekel gagal')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'tackle_lost'
              ? 'bg-danger/20 border-danger text-danger'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-danger">
              <Shield className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Tekel gagal</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Gagal</span>
          </button>

          {/* Clearance */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('clearance', 'clearance', 'success', 'Sapuan')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'clearance'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-1">
              <Shield className="w-4 h-4 text-2 shrink-0" strokeWidth={1.5} />
              <span>Sapuan</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Buang bola</span>
          </button>

          {/* Ball Recovery */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('ball_recovery', 'ball_recovery', 'success', 'Rebut bola')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'ball_recovery'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-brand">
              <Check className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Rebut bola</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Penguasaan bola</span>
          </button>

          {/* Ball Loss */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('ball_loss', 'ball_loss', 'fail', 'Kehilangan bola')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'ball_loss'
              ? 'bg-danger/20 border-danger text-danger'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-danger">
              <X className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Kehilangan bola</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Terlepas</span>
          </button>

          {/* Foul Committed */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('foul_committed', 'foul_committed', 'fail', 'Pelanggaran dibuat')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'foul_committed'
              ? 'bg-danger/20 border-danger text-danger'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-danger">
              <X className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Pelanggaran dibuat</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Melanggar lawan</span>
          </button>

          {/* Corner */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => triggerLog('corner', 'corner', null, 'Sepak pojok')}
            className={`min-h-[56px] p-3 rounded-control border bg-app transition-colors duration-150 motion-reduce:transition-none flex flex-col items-center justify-center text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${flashingKey === 'corner'
              ? 'bg-brand/20 border-brand text-brand'
              : 'border-line hover:bg-raised text-1'
              }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-sm text-1">
              <Target className="w-4 h-4 text-2 shrink-0" strokeWidth={1.5} />
              <span>Sepak pojok</span>
            </div>
            <span className="text-sm text-2 mt-0.5">Tendangan sudut</span>
          </button>
        </div>
      </details>
    </section>
  );
}
