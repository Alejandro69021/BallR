import React from 'react';
import { Play, CheckCircle2, RotateCcw, Check } from 'lucide-react';

export default function TestTelemetryOverlay({
  testMode,
  testState,
  testResult,
  startTestSequence,
  handleApplyResult
}) {
  return (
    <>
      {/* Bottom Interactive Controls */}
      <div className="pointer-events-auto pb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-300 bg-black/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
          <span>MODE: <strong className="text-white">{testMode === 'jump' ? 'EXPLOSIVE JUMP' : '20M SPRINT GATE'}</strong></span>
          <span>•</span>
          <span className="text-emerald-400">STATUS: {testState.toUpperCase()}</span>
        </div>

        {testState === 'idle' && (
          <button
            type="button"
            onClick={startTestSequence}
            className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-lime-400 to-[#CCFF00] hover:from-lime-300 hover:to-lime-200 text-black font-athletic font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(204,255,0,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Uji Live (3s Countdown)</span>
          </button>
        )}

        {testState === 'recording' && (
          <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-mono text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>MEREKAM TELEMETRI PITCH...</span>
          </div>
        )}
      </div>

      {/* Result Modal Card */}
      {testState === 'completed' && testResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border-2 border-[#CCFF00] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(204,255,0,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-lime-500/20 text-[#CCFF00]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-athletic text-base sm:text-lg font-bold text-white">
                    Tes Selesai & Terverifikasi
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Kalibrasi Optik Edge-AI Sempurna
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-black border border-[#CCFF00]/40">
                VERIFIED
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16] border border-slate-800 text-center space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {testResult.metricName}
              </span>
              <div className="font-athletic text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-lime-200 to-[#CCFF00] tracking-tight">
                {testResult.scoreDisplay}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs pt-1">
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {testResult.diffText}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-semibold">{testResult.percentile}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={startTestSequence}
                className="min-h-[44px] px-4 rounded-xl bg-[#090D16] hover:bg-[#1F2937] border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Uji Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleApplyResult}
                className="min-h-[44px] px-4 rounded-xl bg-[#CCFF00] hover:bg-lime-300 text-black font-athletic font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Terapkan ke Paspor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
