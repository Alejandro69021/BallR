import React from 'react';
import { Database, Loader2, Sparkles } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#111827] border border-[#1F2937]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#CCFF00] animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-32 bg-slate-700 rounded-md"></div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-lime-500/10 text-[#CCFF00] border border-[#CCFF00]/20 flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>SYNCING SUPABASE LIVE</span>
              </span>
            </div>
            <div className="h-2.5 w-48 bg-slate-800 rounded-md"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
      </div>

      {/* Header Card Skeleton */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1F2937] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-44 bg-slate-800 rounded-lg"></div>
            <div className="h-8 w-72 bg-slate-700 rounded-xl"></div>
            <div className="h-3 w-56 bg-slate-800/80 rounded-md"></div>
          </div>
          <div className="w-20 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700/60"></div>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#090D16] border border-slate-800/80"></div>
          ))}
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#111827] border border-[#1F2937] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-20 rounded-xl bg-slate-800"></div>
              <div className="w-12 h-14 rounded-xl bg-slate-800"></div>
            </div>
            <div className="h-4 w-32 bg-slate-700 rounded"></div>
            <div className="h-3 w-20 bg-slate-800 rounded"></div>
            <div className="h-12 rounded-xl bg-[#090D16]"></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-8 rounded-lg bg-slate-800"></div>
              <div className="h-8 rounded-lg bg-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

