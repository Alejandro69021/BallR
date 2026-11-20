import React from 'react';
import { Ruler, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

export default function BioMaturityCard({ bioSpecs }) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-athletic font-bold uppercase tracking-wider bg-lime-500/15 text-[#CCFF00] border border-[#CCFF00]/30">
              Khamis-Roche Method
            </span>
            <span className="text-xs text-slate-400">Bio-Banding Protocol</span>
          </div>
          <h3 className="font-athletic text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Biological Maturity & Growth Velocity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Menilai kematangan biologis atlet muda guna mencegah cedera dan menentukan beban kompetisi yang proporsional.
          </p>
        </div>

        <div className="self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-xs font-athletic font-bold text-amber-300 flex items-center gap-2 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{bioSpecs.maturityStatus} ({bioSpecs.maturityOffset})</span>
          </div>
        </div>
      </div>

      {/* Biological Specs 3-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {/* Card 1: Current Stature */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="uppercase font-bold tracking-wider text-[10px] truncate">Stature & Mass Saat Ini</span>
            <Ruler className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div>
            <div className="font-athletic text-2xl font-black text-white">
              {bioSpecs.currentHeight ? (
                <>{bioSpecs.currentHeight} <span className="text-xs font-mono text-slate-400">cm</span></>
              ) : (
                <span className="text-sm font-sans font-normal text-slate-400">Belum ada data</span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2 truncate">
              <span>Berat: <strong>{bioSpecs.currentWeight ? `${bioSpecs.currentWeight} kg` : 'Belum ada data'}</strong></span>
              {bioSpecs.currentHeight && bioSpecs.currentWeight && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>BMI: <strong>{(bioSpecs.currentWeight / ((bioSpecs.currentHeight / 100) ** 2)).toFixed(1)}</strong></span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono truncate">
            Usia Biologis: {bioSpecs.biologicalAge} th (Kronologis: {bioSpecs.chronologicalAge ? `${bioSpecs.chronologicalAge} th` : 'Belum ada data'})
          </div>
        </div>

        {/* Card 2: Predicted Adult Height */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="uppercase font-bold tracking-wider text-[10px] truncate">Prediksi Tinggi Dewasa</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div>
            <div className="font-athletic text-2xl font-black text-emerald-400">
              ~{bioSpecs.predictedAdultHeight} <span className="text-xs font-mono text-slate-400">cm</span>
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5 truncate">
              Khamis-Roche Formula (±2.1 cm)
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 truncate">
            Berdasarkan genetika & rasio tulang
          </div>
        </div>

        {/* Card 3: Adult Stature Percentage */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/90 border border-[#1F2937] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="uppercase font-bold tracking-wider text-[10px] truncate">% Tinggi Dewasa Tercapai</span>
            <Activity className="w-4 h-4 text-[#CCFF00] shrink-0" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-athletic text-2xl font-black text-[#CCFF00]">
                {bioSpecs.adultHeightPct}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase truncate">
                Circa-PHV
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-500 to-[#CCFF00] rounded-full shadow-[0_0_8px_#CCFF00]"
                style={{ width: `${bioSpecs.adultHeightPct}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-lime-400 font-medium truncate">
            Fase optimal pembentukan akselerasi
          </div>
        </div>
      </div>

      {/* Sport Science Advisory Box */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-athletic text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
            Growth Spurt & Injury Prevention Advisory
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {bioSpecs.advisoryText}
          </p>
        </div>
      </div>
    </section>
  );
}
