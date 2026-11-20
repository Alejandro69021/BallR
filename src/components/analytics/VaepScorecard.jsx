import React from 'react';
import { Award } from 'lucide-react';

export default function VaepScorecard({ vaepMetrics }) {
  if (!vaepMetrics || !vaepMetrics.topValuedActions || vaepMetrics.topValuedActions.length === 0) {
    return (
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                KU Leuven SoccerAction Framework
              </span>
              <span className="text-xs text-slate-400">Decroos et al. (2019)</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
              Valuing Actions by Estimating Probabilities (VAEP)
            </h4>
          </div>

          <div className="text-xs text-slate-400">
            Mengukur kontribusi riil tiap aksi terhadap peluang terjadinya gol
          </div>
        </div>

        <div className="p-6 text-center rounded-xl bg-[#090D16]/80 border border-[#1E2638] text-slate-400 text-xs space-y-1">
          <p className="font-semibold text-slate-300">Belum ada data</p>
          <p className="text-slate-500">Metrik aksi VAEP belum dihitung untuk laga ini.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              KU Leuven SoccerAction Framework
            </span>
            <span className="text-xs text-slate-400">Decroos et al. (2019)</span>
          </div>
          <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
            Valuing Actions by Estimating Probabilities (VAEP)
          </h4>
        </div>

        <div className="text-xs text-slate-400">
          Mengukur kontribusi riil tiap aksi terhadap peluang terjadinya gol
        </div>
      </div>

      {/* VAEP Breakdown Table */}
      <div className="space-y-2.5">
        <div className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Aksi Bernilai Dampak Tertinggi (Top Action Impact)</span>
          <span className="text-xs text-slate-400 font-mono">Nilai VAEP (+Goal / -Concede)</span>
        </div>

        <div className="space-y-2">
          {vaepMetrics.topValuedActions.map((act, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-athletic text-sm font-black text-[#84CC16] min-w-[28px] shrink-0">
                  {act.minute}
                </span>
                <div className="min-w-0">
                  <div className="font-athletic text-xs font-bold text-white truncate">
                    {act.action}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {act.phase}
                    </span>
                    <span>Offense: {act.deltaPscores}</span>
                    <span>Defense: {act.deltaPconcedes}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-lime-500/15 border border-[#84CC16]/40 text-[#84CC16] font-mono text-xs font-bold">
                  {act.vaepValue} VAEP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {vaepMetrics.interpretation && (
        <div className="p-3 rounded-xl bg-[#0E131F] border border-[#1E2638] text-xs text-slate-300 flex items-start gap-2.5">
          <Award className="w-4 h-4 text-[#84CC16] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-xs">
            <strong>Interpretasi Ilmiah:</strong> {vaepMetrics.interpretation}
          </p>
        </div>
      )}
    </section>
  );
}
