import React from 'react';

export default function FilanesiaGrid({
  filanesiaPhases,
  activePhase,
  setActivePhase
}) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30">
              Kurikulum Filanesia PSSI
            </span>
            <span className="text-xs text-slate-400">4 Momen Permainan Sepakbola</span>
          </div>
          <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-1">
            Distribusi Aksi Taktis dalam 4 Fase Permainan
          </h4>
        </div>

        {/* Phase Filter Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#090D16] border border-[#1E2638] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActivePhase('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold uppercase transition-all cursor-pointer ${
              activePhase === 'all'
                ? 'bg-slate-800 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Fase
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('attacking')}
            className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold uppercase transition-all cursor-pointer ${
              activePhase === 'attacking'
                ? 'bg-cyan-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Menyerang
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('trans_neg')}
            className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold uppercase transition-all cursor-pointer ${
              activePhase === 'trans_neg'
                ? 'bg-rose-500 text-white font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transisi (-)
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('defending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold uppercase transition-all cursor-pointer ${
              activePhase === 'defending'
                ? 'bg-emerald-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bertahan
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('trans_pos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold uppercase transition-all cursor-pointer ${
              activePhase === 'trans_pos'
                ? 'bg-lime-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transisi (+)
          </button>
        </div>
      </div>

      {/* 4-Phase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {Object.entries(filanesiaPhases)
          .filter(([key]) => activePhase === 'all' || activePhase === key)
          .map(([key, phase]) => (
            <div
              key={key}
              className={`p-4 rounded-xl border ${phase.borderColor} ${phase.bgColor} space-y-2.5 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-athletic text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-white">
                    {phase.code}
                  </span>
                  <h5 className="font-athletic text-sm font-bold text-white">
                    {phase.title}
                  </h5>
                </div>
                <span className={`font-mono text-xs font-black ${phase.textColor}`}>
                  {phase.percentage}% Volume
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${phase.color} rounded-full`}
                  style={{ width: `${phase.percentage * 2}%` }}
                />
              </div>

              <div className="text-xs text-slate-300 font-medium">
                {phase.actions}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {phase.eval}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Parameter FIFA:</span>
                <span className={`font-mono font-bold ${phase.textColor}`}>
                  {phase.fifaMetric}
                </span>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
