import React from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { formatSecondsToTime } from '../../lib/calculations';
import Badge from '../ui/Badge';

export const PERIOD_LABELS = {
  1: 'Babak 1',
  2: 'Babak 2',
  3: 'Perpanjangan 1',
  4: 'Perpanjangan 2'
};

export default function MatchTimerBar({
  match,
  timerSeconds = 0,
  isRunning = false,
  period = 1,
  onToggleTimer,
  onResetTimer,
  onPeriodChange,
  onAdjustMinutes,
  isReadOnly = false
}) {
  const currentPeriodLabel = PERIOD_LABELS[period] || `Babak ${period}`;

  const handleNextPeriod = () => {
    if (isReadOnly) return;
    const next = period >= 4 ? 1 : period + 1;
    onPeriodChange?.(next);
  };

  return (
    <section className="rounded-panel bg-panel border border-line p-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Match Label & Clock Display */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-brand animate-pulse' : 'bg-series-1'
              }`}
            />
            <span className="text-xs font-mono uppercase tracking-wider text-2">
              Pencatat laga
            </span>
            <span className="text-2">·</span>
            <span className="text-xs font-semibold text-1">
              vs {match?.opponent_name || 'Lawan'}
            </span>
            <Badge variant="neutral" size="sm">
              {match?.format || '11v11'}
            </Badge>
            {isReadOnly && (
              <Badge variant="warning" size="sm">
                Laga sudah final (hanya baca)
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <div className="font-mono text-2xl tabular-nums font-semibold text-1">
              {formatSecondsToTime(timerSeconds)}
            </div>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={handleNextPeriod}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control disabled:opacity-60 disabled:cursor-not-allowed"
              title="Ganti babak pertandingan"
            >
              <Badge variant={isRunning ? 'brand' : 'neutral'} size="md">
                {currentPeriodLabel}
              </Badge>
            </button>
          </div>
        </div>

        {/* Stopwatch & Manual Adjust Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Manual Adjust: -1m & +1m */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onAdjustMinutes?.(-1)}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control bg-raised hover:bg-panel text-2 hover:text-1 border border-control text-xs font-mono tabular-nums transition-colors cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed"
              title="Kurang 1 menit"
              aria-label="Kurang 1 menit"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>1m</span>
            </button>

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onAdjustMinutes?.(1)}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-control bg-raised hover:bg-panel text-2 hover:text-1 border border-control text-xs font-mono tabular-nums transition-colors cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed"
              title="Tambah 1 menit"
              aria-label="Tambah 1 menit"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>1m</span>
            </button>
          </div>

          {/* Play/Pause */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={onToggleTimer}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-control border font-semibold text-xs transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed ${
              isRunning
                ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                : 'bg-brand text-app border-transparent hover:opacity-90'
            }`}
            title={isRunning ? 'Jeda waktu' : 'Mulai waktu'}
            aria-label={isRunning ? 'Jeda waktu' : 'Mulai waktu'}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" strokeWidth={1.5} />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" strokeWidth={1.5} />
                <span>Mulai</span>
              </>
            )}
          </button>

          {/* Reset */}
          <button
            type="button"
            disabled={isReadOnly || timerSeconds === 0}
            onClick={onResetTimer}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-control bg-raised hover:bg-panel text-2 hover:text-1 border border-control transition-colors duration-150 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reset waktu"
            aria-label="Reset waktu"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
