import React from 'react';
import { Target, Shield, Flame, Activity, Undo2 } from 'lucide-react';

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
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Pass Stats */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Umpan (Akurasi)</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-white">
              {stats.passesCompleted} <span className="text-xs font-normal text-slate-400">/ {stats.passesTotal}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-cyan-400 mt-0.5">
              {passAccuracy}% Akurat
            </div>
          </div>
        </div>

        {/* Key Passes / Chances */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Peluang Tercipta</span>
            <Target className="w-3.5 h-3.5 text-[#CCFF00]" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-[#CCFF00]">
              {stats.keyPasses}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Umpan Kunci / Terobosan
            </div>
          </div>
        </div>

        {/* Tackles & Intercepts */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Tekel & Rebut Bola</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-white">
              {stats.tacklesWon} <span className="text-xs font-normal text-slate-400">/ {stats.tacklesTotal}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
              {tackleAccuracy}% Sukses
            </div>
          </div>
        </div>

        {/* Shots & Goals */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Tembakan / Gol</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-amber-400">
              {stats.shotsOnTarget} <span className="text-xs font-bold text-white">({stats.goals} Gol)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Rating Live: <strong className="text-[#CCFF00] font-mono">{calculatedMatchRating}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHRONOLOGICAL EVENT FEED & UNDO CONTROL */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#CCFF00]" />
            <h4 className="font-athletic text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Live Stream Log (Aksi Terakhir)
            </h4>
          </div>

          {/* Prominent Undo Button */}
          <button
            type="button"
            onClick={onUndo}
            disabled={eventHistory.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-athletic font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            <span>Batalkan Tap</span>
          </button>
        </div>

        {/* List of last 4-5 events */}
        <div className="space-y-1.5">
          {eventHistory.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">[{item.time}]</span>
                <span className="font-sans font-semibold text-white">
                  {item.playerName}:
                </span>
                <span className={`font-athletic font-bold ${item.color}`}>
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Live Recorded</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
