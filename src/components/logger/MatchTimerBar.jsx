import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatSecondsToTime } from '../../lib/calculations';

export default function MatchTimerBar({
  timerSeconds,
  isRunning,
  matchHalf,
  onToggleTimer,
  onResetTimer,
  onToggleHalf,
  players,
  activePlayer,
  onSelectPlayer
}) {
  return (
    <section className="rounded-2xl bg-[#090D16] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Match Label & Clock */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-[10px] font-athletic font-bold uppercase tracking-wider text-rose-400">
                Live Match Logger
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-300 font-medium">
                MPFA Jogja vs Sleman Utd U-13
              </span>
            </div>

            {/* Digital Stopwatch Display */}
            <div className="flex items-baseline gap-2 mt-0.5">
              <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
                {formatSecondsToTime(timerSeconds)}
              </div>
              <button
                type="button"
                onClick={onToggleHalf}
                className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-athletic font-bold text-[#CCFF00] border border-slate-700 hover:border-[#CCFF00]/40 transition-colors cursor-pointer"
              >
                {matchHalf}
              </button>
            </div>
          </div>

          {/* Play/Pause & Reset Controls */}
          <div className="flex items-center gap-1.5 self-center">
            <button
              type="button"
              onClick={onToggleTimer}
              className={`p-3 rounded-xl border font-bold transition-all cursor-pointer shadow-md ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-lime-500/20 text-[#CCFF00] border-[#CCFF00]/40 hover:bg-lime-500/30'
              }`}
              title={isRunning ? 'Jeda Stopwatch' : 'Mulai Stopwatch'}
            >
              {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onResetTimer}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Reset Waktu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Player Switcher Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] font-athletic font-bold uppercase text-slate-400 shrink-0 hidden sm:inline">
            Pemain:
          </span>
          {players.map((p) => {
            const isSelected = p.player_id === activePlayer.player_id;
            return (
              <button
                key={p.player_id}
                type="button"
                onClick={() => onSelectPlayer(p.player_id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-athletic font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.35)] scale-105'
                    : 'bg-[#111827] text-slate-300 border-[#1F2937] hover:border-slate-700'
                }`}
              >
                <span className="font-mono font-black">#{p.personal_info.jersey_number}</span>
                <span>{p.personal_info.nickname || p.personal_info.full_name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
