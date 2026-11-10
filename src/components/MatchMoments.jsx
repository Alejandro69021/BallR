import React from 'react';
import { Film, Play, Clock, Sparkles } from 'lucide-react';

export default function MatchMoments({ moments, onSelectClip }) {
  const getBadgeStyle = (category) => {
    if (category.includes('Pass') || category.includes('Vision')) {
      return 'bg-lime-500/20 text-[#CCFF00] border-lime-500/30';
    }
    if (category.includes('Goal') || category.includes('Finishing')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  };

  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-lime-500/10 border border-[#CCFF00]/30 text-[#CCFF00]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight">
              Verified Match Moments (Vertical 9:16)
            </h3>
            <p className="text-xs text-slate-400">
              Klip cuplikan pertandingan terverifikasi staf kepelatihan
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 bg-[#090D16] px-2.5 py-1 rounded-md border border-[#1F2937]">
          {moments.length} Klip Terverifikasi
        </span>
      </div>

      {/* 9:16 Vertical Cards Grid / Snap Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {moments.map((clip) => {
          const matchContext = `${clip.match} • Min ${clip.minute}`;

          return (
            <div
              key={clip.id}
              onClick={() => onSelectClip(clip)}
              className="group cursor-pointer relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#090D16] border border-[#1F2937] hover:border-[#CCFF00]/80 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] flex flex-col justify-between p-3"
            >
              {/* Thumbnail Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={clip.thumbnail}
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-75 contrast-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/40 to-black/60" />
              </div>

              {/* Top Bar: Action Tag & Aspect Badge */}
              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md truncate ${getBadgeStyle(clip.category)}`}>
                  {clip.category}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-slate-700/60">
                  {clip.video_aspect || '9:16'}
                </span>
              </div>

              {/* Middle: Floating Play Icon */}
              <div className="relative z-10 self-center my-auto">
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-[#CCFF00]/50 flex items-center justify-center text-[#CCFF00] group-hover:scale-110 group-hover:bg-[#CCFF00] group-hover:text-black transition-all duration-300 shadow-xl shadow-black/80">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Card Content: Match Context & Title */}
              <div className="relative z-10 space-y-1">
                <div className="text-[10px] font-semibold text-[#CCFF00] tracking-wide truncate">
                  {matchContext}
                </div>

                <h4 className="font-athletic text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-lime-200 transition-colors">
                  {clip.title}
                </h4>

                <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between text-[9px] text-slate-400">
                  <span>MPFA Video ID</span>
                  <span className="font-mono text-slate-300">{clip.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
