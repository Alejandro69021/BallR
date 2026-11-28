import React from 'react';
import { Target, Shield, Flame, Activity, Undo2, RefreshCw } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { EVENT_TYPE_LABELS } from '../../lib/matches';
import { formatSecondsToTime } from '../../lib/calculations';

export default function EventStreamLog({
  events = [],
  outbox = [],
  playerMap = {},
  onUndo,
  onFlush,
  onPlayClip,
  isFlushing = false,
  isReadOnly = false,
  isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true'
}) {
  // Combine all active events (server events + outbox pending)
  const allEvents = [...events, ...outbox];

  // Compute honest counts
  const passesTotal = allEvents.filter((e) => e.event_type === 'pass').length;
  const passesSuccess = allEvents.filter(
    (e) => e.event_type === 'pass' && e.outcome === 'success'
  ).length;

  const tacklesTotal = allEvents.filter((e) => e.event_type === 'tackle').length;
  const tacklesSuccess = allEvents.filter(
    (e) => e.event_type === 'tackle' && e.outcome === 'success'
  ).length;

  const shotsTotal = allEvents.filter((e) =>
    ['shot', 'shot_on_target', 'goal'].includes(e.event_type)
  ).length;
  const shotsOnTarget = allEvents.filter((e) =>
    ['shot_on_target', 'goal'].includes(e.event_type)
  ).length;
  const goalsTotal = allEvents.filter((e) => e.event_type === 'goal').length;

  const interceptionsTotal = allEvents.filter((e) => e.event_type === 'interception').length;
  const clearancesTotal = allEvents.filter((e) => e.event_type === 'clearance').length;

  // Chronological stream (latest first; break ties by latest insertion index)
  const sortedStream = allEvents
    .map((evt, idx) => ({ evt, idx }))
    .sort((a, b) => {
      if (a.evt.period !== b.evt.period) return b.evt.period - a.evt.period;
      const minDiff = Number(b.evt.minute) - Number(a.evt.minute);
      if (minDiff !== 0) return minDiff;
      return b.idx - a.idx;
    })
    .map((item) => item.evt);

  const serverCount = events.length;
  const outboxCount = outbox.length;

  return (
    <div className="space-y-4 text-1">
      {/* 1. Real-Time Telemetry Counters (Pure Counts with n shown) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Pass Stats */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-sm font-medium">
            <span>Umpan</span>
            <Target className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="text-xl tabular-nums font-semibold text-1">
              {passesSuccess} <span className="text-sm text-2 font-normal">/ {passesTotal}</span>
            </div>
            <div className="text-sm text-2 mt-0.5">
              Umpan berhasil (n = {passesTotal})
            </div>
          </div>
        </div>

        {/* Tackles */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-sm font-medium">
            <span>Tekel</span>
            <Shield className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="text-xl tabular-nums font-semibold text-1">
              {tacklesSuccess} <span className="text-sm text-2 font-normal">/ {tacklesTotal}</span>
            </div>
            <div className="text-sm text-2 mt-0.5">
              Tekel berhasil (n = {tacklesTotal})
            </div>
          </div>
        </div>

        {/* Shots & Goals */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-sm font-medium">
            <span>Tembakan & gol</span>
            <Flame className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="text-xl tabular-nums font-semibold text-1">
              {shotsOnTarget} <span className="text-sm text-2 font-normal">/ {shotsTotal}</span>
            </div>
            <div className="text-sm text-2 mt-0.5">
              Tepat sasaran ({goalsTotal} gol)
            </div>
          </div>
        </div>

        {/* Interceptions & Clearances */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-sm font-medium">
            <span>Intersepsi & sapuan</span>
            <Shield className="w-4 h-4 text-brand" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="text-xl tabular-nums font-semibold text-1">
              {interceptionsTotal} <span className="text-sm text-2 font-normal">/ {clearancesTotal}</span>
            </div>
            <div className="text-sm text-2 mt-0.5">
              {interceptionsTotal} int · {clearancesTotal} sapuan
            </div>
          </div>
        </div>
      </section>

      {/* 2. Outbox & Sync Status Line */}
      <section className="p-3.5 rounded-panel bg-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-1">Status Sinkronisasi:</span>
          <span className="tabular-nums text-2">
            {isDemoMode ? 'Tersimpan di perangkat (mode demo)' : 'Tersimpan di server'}: {serverCount} · Menunggu sinkron: {outboxCount}
          </span>
          {outboxCount > 0 && (
            <Badge variant="warning" size="sm">
              {outboxCount} di outbox lokal
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {outboxCount > 0 && !isReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isFlushing}
              onClick={onFlush}
              icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Sinkronkan sekarang
            </Button>
          )}

          {!isReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={allEvents.length === 0}
              onClick={onUndo}
              icon={<Undo2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Batalkan aksi terakhir
            </Button>
          )}
        </div>
      </section>

      {/* 3. Chronological Event Stream History */}
      <section className="rounded-panel bg-panel border border-line p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-1">
              Log kejadian terkini
            </h3>
          </div>
          <span className="text-sm tabular-nums text-2">
            Total {allEvents.length} kejadian
          </span>
        </div>

        {sortedStream.length === 0 ? (
          <p className="text-sm text-2 py-3 text-center">
            Belum ada kejadian tercatat. Gunakan tombol aksi cepat di atas untuk mencatat.
          </p>
        ) : (
          <div className="divide-y divide-line max-h-72 overflow-y-auto">
            {sortedStream.slice(0, 15).map((evt) => {
              const isPending = outbox.some(
                (o) => o.client_event_id === evt.client_event_id
              );
              const playerInfo = evt.player_id ? playerMap[evt.player_id] : null;

              return (
                <div
                  key={evt.client_event_id || evt.id}
                  className="py-2 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2 tabular-nums shrink-0">
                      B{evt.period} {evt.minute}'
                    </span>

                    <Badge
                      variant={evt.team === 'own' ? 'brand' : 'neutral'}
                      size="sm"
                    >
                      {evt.team === 'own' ? 'Tim kita' : `Lawan #${evt.opponent_number || '-'}`}
                    </Badge>

                    {evt.team === 'own' && playerInfo && (
                      <span className="font-medium text-1 truncate">
                        #{playerInfo.number} {playerInfo.name}
                      </span>
                    )}

                    <span className="text-1 font-medium truncate">
                      {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                    </span>

                    {evt.outcome && (
                      <Badge
                        variant={evt.outcome === 'success' ? 'brand' : 'danger'}
                        size="sm"
                      >
                        {evt.outcome === 'success' ? 'Sukses' : 'Gagal'}
                      </Badge>
                    )}

                    {evt.x_m !== null && evt.y_m !== null && (
                      <span className="text-2 text-sm tabular-nums hidden sm:inline">
                        ({evt.x_m}, {evt.y_m} m)
                      </span>
                    )}

                    {evt.video_time_s != null && onPlayClip && (
                      <button
                        type="button"
                        onClick={() => onPlayClip(evt.video_time_s)}
                        className="font-mono text-brand hover:underline cursor-pointer text-sm"
                        title="Putar video kejadian"
                      >
                        [▶ {formatSecondsToTime(evt.video_time_s)}]
                      </button>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Badge variant={isPending ? 'warning' : 'neutral'} size="sm">
                      {isPending ? 'Menunggu sinkron' : 'Tersimpan'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
