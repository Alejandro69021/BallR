import React from 'react';
import { Flame, Zap, Timer, Camera, TrendingUp, TrendingDown } from 'lucide-react';

export default function FitnessForm({
  formData,
  onFitnessChange,
  onOpenScanner
}) {
  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-athletic text-base sm:text-lg font-bold text-white tracking-tight">
            Physical Benchmark Quick-Log
          </h3>
          <p className="text-xs text-slate-400">
            Log data tes fisik langsung di lapangan atau gunakan Edge-AI Live Camera
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-lime-500/20 via-cyan-500/15 to-[#CCFF00]/20 hover:from-lime-500/30 hover:to-[#CCFF00]/30 border-2 border-[#CCFF00]/60 hover:border-[#CCFF00] text-[#CCFF00] font-athletic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 shrink-0"
        >
          <Camera className="w-4 h-4 text-[#CCFF00] stroke-[2.5]" />
          <span>📹 Open AI Live Camera Test</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Vertical Jump */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Vertical Jump
            </span>
            <span className="text-[10px] text-slate-400">cm</span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={formData.fitness.vertical_jump_cm || ''}
              onChange={(e) => onFitnessChange('vertical_jump_cm', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
              placeholder="44.5"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Bulan lalu: {formData.fitness.prev_jump_cm || 42.0} cm</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +{(formData.fitness.vertical_jump_cm - (formData.fitness.prev_jump_cm || 42.0)).toFixed(1)} cm
            </span>
          </div>
        </div>

        {/* 20m Sprint */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 20m Sprint
            </span>
            <span className="text-[10px] text-slate-400">detik</span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.fitness.sprint_20m_sec || ''}
              onChange={(e) => onFitnessChange('sprint_20m_sec', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
              placeholder="3.42"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Bulan lalu: {formData.fitness.prev_sprint_sec || 3.50}s</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -{((formData.fitness.prev_sprint_sec || 3.50) - formData.fitness.sprint_20m_sec).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Shuttle Run */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1F2937] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-cyan-400" /> Shuttle Run
            </span>
            <span className="text-[10px] text-slate-400">detik</span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={formData.fitness.shuttle_run_sec || ''}
              onChange={(e) => onFitnessChange('shuttle_run_sec', e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 focus:border-[#CCFF00] text-white font-athletic text-lg font-bold outline-none transition-colors"
              placeholder="11.20"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Bulan lalu: {formData.fitness.prev_shuttle_sec || 11.45}s</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -{((formData.fitness.prev_shuttle_sec || 11.45) - formData.fitness.shuttle_run_sec).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
