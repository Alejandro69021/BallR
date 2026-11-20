import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatSecondsToTime } from '../../lib/calculations';
import Badge from '../ui/Badge';

export default function MatchTimerBar({
  timerSeconds,
  isRunning,
  matchHalf,
  onToggleTimer,
  onResetTimer,
  onToggleHalf,
  players = [],
  activePlayer,
  onSelectPlayer
}) {
  return (
    <section className="rounded-panel bg-panel border border-line p-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Match Label & Clock */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-2">
                Pencatat laga langsung
              </span>
              <span className="text-2">·</span>
              <span className="text-xs text-2 font-medium">
                Sesi pertandingan akademi
              </span>
            </div>

            {/* Digital Stopwatch Display */}
            <div className="flex items-baseline gap-2 mt-1">
              <div className="font-mono text-2xl tabular-nums font-semibold text-1">
                {formatSecondsToTime(timerSeconds)}
              </div>
              <button
                type="button"
                onClick={onToggleHalf}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control"
              >
                <Badge variant="brand" size="sm">
                  {matchHalf}
                </Badge>
              </button>
            </div>
          </div>

          {/* Play/Pause & Reset Controls */}
          <div className="flex items-center gap-2 self-center">
            <button
              type="button"
              onClick={onToggleTimer}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-control border font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isRunning
                  ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                  : 'bg-brand text-app border-transparent hover:opacity-90'
              }`}
              title={isRunning ? 'Jeda waktu' : 'Mulai waktu'}
              aria-label={isRunning ? 'Jeda waktu' : 'Mulai waktu'}
            >
              {isRunning ? (
                <Pause className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Play className="w-5 h-5 ml-0.5" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-control bg-raised hover:bg-panel text-2 hover:text-1 border border-control transition-colors duration-150 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              title="Reset waktu"
              aria-label="Reset waktu"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Quick Player Switcher Strip */}
        {players.length > 0 && activePlayer && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-mono uppercase text-2 shrink-0 hidden sm:inline">
              Pemain:
            </span>
            {players.map((p) => {
              const isSelected = p.player_id === activePlayer.player_id;
              return (
                <button
                  key={p.player_id}
                  type="button"
                  onClick={() => onSelectPlayer && onSelectPlayer(p.player_id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 min-h-[44px] rounded-control border text-xs font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isSelected
                      ? 'bg-raised text-1 border-control font-semibold'
                      : 'bg-panel text-2 border-line hover:text-1 hover:bg-raised'
                  }`}
                >
                  <span className="font-mono font-semibold">#{p.personal_info.jersey_number}</span>
                  <span>{p.personal_info.nickname || p.personal_info.full_name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
