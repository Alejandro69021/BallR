import React from 'react';

export default function FifaLanguageMetrics({ fifaLanguageKpis }) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              FIFA Football Language Matrix
            </span>
            <span className="text-xs text-slate-400">FIFA Training Centre (2026)</span>
          </div>
          <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
            Metrik Taktis Standar Pelatih FIFA
          </h4>
        </div>

        <div className="text-xs text-slate-400">
          Tolok ukur pergerakan spasial tanpa bola & pemecah kebuntuan
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {fifaLanguageKpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1E2638] flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-400">
                {kpi.metric}
              </span>
              {kpi.icon}
            </div>

            <div>
              <div className="font-athletic text-2xl font-black text-white">
                {kpi.value}
              </div>
              <div className="text-xs font-mono font-bold text-lime-400 mt-0.5">
                {kpi.benchmark}
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-snug pt-2 border-t border-slate-800">
              {kpi.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
