import React from 'react';
import { Flame, Zap, Timer, Activity, CheckCircle2, Calendar } from 'lucide-react';

export default function FitnessStrip({ benchmarks }) {
  const tests = [
    {
      label: "Vertical Jump",
      value: `${benchmarks.vertical_jump_cm} cm`,
      spec: "Explosive Power",
      badge: "Top 5% U-13",
      icon: <Flame className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      label: "20m Sprint",
      value: `${benchmarks.sprint_20m_sec}s`,
      spec: "Acceleration",
      badge: "Top 7% U-13",
      icon: <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
    },
    {
      label: "Shuttle Run",
      value: `${benchmarks.shuttle_run_sec}s`,
      spec: "Agility & COD",
      badge: "Top 5% U-13",
      icon: <Timer className="w-3.5 h-3.5 text-cyan-400" />
    },
    {
      label: "Yo-Yo Intermittent",
      value: benchmarks.yoyo_level,
      spec: "Aerobic Capacity",
      badge: "Elite Grade",
      icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />
    }
  ];

  return (
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 shadow-xl shadow-black/50">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#CCFF00]" />
          <h3 className="font-athletic text-sm sm:text-base font-bold text-white tracking-wide uppercase">
            Physical Fitness Test Strip
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Test Date: {benchmarks.test_date}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified MPFA Lab</span>
          </div>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tests.map((test, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] hover:border-[#CCFF00]/40 transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {test.spec}
              </span>
              <div className="p-1 rounded bg-[#111827] group-hover:scale-110 transition-transform">
                {test.icon}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-300 font-medium truncate mb-0.5">
                {test.label}
              </div>
              <div className="font-athletic text-lg sm:text-xl font-black text-white group-hover:text-[#CCFF00] transition-colors">
                {test.value}
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#1F2937] flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Rank</span>
              <span className="text-[#CCFF00] font-bold">
                {test.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
