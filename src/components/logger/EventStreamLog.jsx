import React from 'react';
import { Target, Shield, Flame, Activity, Undo2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function EventStreamLog({
  stats,
  passAccuracy,
  tackleAccuracy,
  calculatedMatchRating,
  eventHistory,
  onUndo
}) {
  return (
    <>
      {/* 2. REAL-TIME TELEMETRY COUNTERS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-1">
        {/* Pass Stats */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-xs font-medium">
            <span>Umpan (akurasi)</span>
            <Target className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="font-mono text-xl tabular-nums font-semibold text-1">
              {stats.passesCompleted} <span className="text-xs text-2 font-normal">/ {stats.passesTotal}</span>
            </div>
            <div className="text-xs font-mono text-brand mt-0.5">
              {passAccuracy}% akurat
            </div>
          </div>
        </div>

        {/* Key Passes / Chances */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-xs font-medium">
            <span>Peluang tercipta</span>
            <Target className="w-4 h-4 text-brand" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="font-mono text-xl tabular-nums font-semibold text-1">
              {stats.keyPasses}
            </div>
            <div className="text-xs text-2 mt-0.5">
              Umpan kunci
            </div>
          </div>
        </div>

        {/* Tackles & Intercepts */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-xs font-medium">
            <span>Tekel & intersep</span>
            <Shield className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="font-mono text-xl tabular-nums font-semibold text-1">
              {stats.tacklesWon} <span className="text-xs text-2 font-normal">/ {stats.tacklesTotal}</span>
            </div>
            <div className="text-xs font-mono text-brand mt-0.5">
              {tackleAccuracy}% sukses
            </div>
          </div>
        </div>

        {/* Shots & Goals */}
        <div className="p-3 rounded-control bg-panel border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-2 text-xs font-medium">
            <span>Tembakan & gol</span>
            <Flame className="w-4 h-4 text-2" strokeWidth={1.5} />
          </div>
          <div className="mt-2">
            <div className="font-mono text-xl tabular-nums font-semibold text-1">
              {stats.shotsOnTarget} <span className="text-xs font-normal text-2">({stats.goals} gol)</span>
            </div>
            <div className="text-xs text-2 mt-0.5 font-mono">
              Rating: <strong className="text-brand font-semibold">{calculatedMatchRating}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHRONOLOGICAL EVENT STREAM & UNDO */}
      <section className="rounded-panel bg-panel border border-line p-4 space-y-3 text-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <h4 className="text-xs font-semibold text-1">
              Log aksi langsung (rekaman terkini)
            </h4>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onUndo}
            disabled={eventHistory.length === 0}
            icon={<Undo2 className="w-4 h-4" strokeWidth={1.5} />}
          >
            Batalkan aksi
          </Button>
        </div>

        {/* List of last events */}
        <div className="space-y-1.5">
          {eventHistory.length === 0 ? (
            <div className="p-3 text-center text-xs text-2 font-mono">
              Belum ada data aksi laga tercatat.
            </div>
          ) : (
            eventHistory.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-control bg-app border border-line text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-2 font-semibold">[{item.time}]</span>
                  <span className="font-sans font-medium text-1">
                    {item.playerName}:
                  </span>
                  <span className="font-sans text-1 font-semibold">
                    {item.label}
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  {item.type}
                </Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
