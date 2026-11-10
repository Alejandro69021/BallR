import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Target,
  Flame,
  Award,
  Volume2,
  Dumbbell
} from 'lucide-react';

export default function AICoachCard({ evaluation }) {
  const {
    period,
    coach_name,
    narrative,
    strengths,
    growth_areas,
    recommended_drill
  } = evaluation;

  // Drill Timer State
  const fullDuration = 900; // 15 mins
  const [drillSeconds, setDrillSeconds] = useState(fullDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Web Audio synth tone for pitch tactile feedback
  const playBeep = (freq = 520, duration = 0.12) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && drillSeconds > 0) {
      interval = setInterval(() => {
        setDrillSeconds((prev) => prev - 1);
      }, 1000);
    } else if (drillSeconds === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      playBeep(880, 0.3); // High completion chime
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, drillSeconds]);

  const toggleTimer = () => {
    if (isCompleted) {
      setDrillSeconds(isDemoMode ? 10 : fullDuration);
      setIsCompleted(false);
    }
    playBeep(isRunning ? 400 : 660, 0.1);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    playBeep(330, 0.1);
    setIsRunning(false);
    setDrillSeconds(isDemoMode ? 10 : fullDuration);
    setIsCompleted(false);
  };

  const toggleDemoMode = () => {
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    setIsRunning(false);
    setIsCompleted(false);
    setDrillSeconds(nextMode ? 10 : fullDuration);
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-5">
      {/* Header: Official Technical Report Badge & Coach Credentials */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2937]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#090D16] border border-[#84CC16]/60 text-[#CCFF00] shadow-md">
            <ClipboardCheck className="w-5 h-5 text-[#CCFF00]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lime-500/15 border border-[#CCFF00]/40 text-[#CCFF00] text-[10px] font-athletic font-bold tracking-wider uppercase">
                Official Technical Scouting Assessment
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Periode: {period}
              </span>
            </div>

            <h3 className="font-athletic text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
              Evaluasi Taktik & Rekomendasi Pelatih
            </h3>

            <p className="text-xs text-slate-400 font-medium">
              Penilai Resmi: <strong className="text-slate-200">{coach_name}</strong>
            </p>
          </div>
        </div>

        <div className="self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-athletic font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            TERVALIDASI DEWAN TEKNIS MPFA
          </span>
        </div>
      </div>

      {/* Readable Narrative Paragraph */}
      <div className="p-4 rounded-xl bg-[#090D16]/70 border border-[#1F2937] text-slate-300 text-xs sm:text-sm leading-relaxed">
        <p className="font-normal text-slate-200">
          "{narrative}"
        </p>
      </div>

      {/* Two Distinct Tag Clouds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Strengths (Emerald Green Chips) */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/50 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"></span>
            <h4 className="font-athletic text-xs font-bold uppercase tracking-wider text-emerald-400">
              Top Strengths
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((strength, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
              >
                + {strength}
              </span>
            ))}
          </div>
        </div>

        {/* Focus Growth Areas (Amber Chips) */}
        <div className="p-3.5 rounded-xl bg-[#090D16]/50 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]"></span>
            <h4 className="font-athletic text-xs font-bold uppercase tracking-wider text-amber-400">
              Focus Growth Areas
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {growth_areas.map((area, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
              >
                ▲ {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Homework Drill Interactive Widget */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#172033] to-[#111827] border border-[#374151] hover:border-[#CCFF00]/40 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                Recommended Homework Drill
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {recommended_drill.category}
              </span>
            </div>

            <h4 className="font-athletic text-base sm:text-lg font-bold text-white">
              {recommended_drill.title}
            </h4>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Target Latihan Harian: <strong className="text-[#CCFF00]">{recommended_drill.duration}</strong></span>
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`text-[9px] px-1.5 py-0.2 rounded border transition-colors cursor-pointer ${
                  isDemoMode
                    ? 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {isDemoMode ? '⚡ Demo Mode (10s)' : '15m Mode'}
              </button>
            </div>
          </div>

          {/* Interactive Duration Timer & Controls */}
          <div className="shrink-0 flex items-center gap-3 bg-[#090D16]/90 p-2.5 rounded-xl border border-[#1F2937]">
            <div className="flex flex-col items-center min-w-[70px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-[#CCFF00]" /> Timer
              </span>
              <span className={`font-athletic text-xl font-black ${isRunning ? 'text-[#CCFF00]' : isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                {formatTime(drillSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : isCompleted
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-[#CCFF00] text-black hover:bg-lime-300 shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                }`}
                title={isRunning ? 'Jeda Latihan' : 'Mulai Timer Latihan'}
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={resetTimer}
                className="p-2 rounded-lg bg-[#1F2937] hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Latihan selesai! Log aktivitas tersimpan ke Paspor Bakat MPFA.</span>
          </div>
        )}
      </div>
    </section>
  );
}
