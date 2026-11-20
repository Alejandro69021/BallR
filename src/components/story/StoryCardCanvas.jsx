import React from 'react';
import { ShieldCheck, QrCode } from 'lucide-react';

export default function StoryCardCanvas({
  cardRef,
  currentTheme,
  personal_info,
  topPillars,
  endorsementQuote,
  player_id
}) {
  return (
    <div className="relative flex justify-center items-center">
      <div
        ref={cardRef}
        className={`w-[290px] h-[515px] sm:w-[320px] sm:h-[568px] rounded-[32px] p-4 bg-gradient-to-b ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} flex flex-col justify-between relative overflow-hidden select-none`}
      >
        {/* Subtle Pitch Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* 1. TOP BRAND & ACADEMY BAR */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black/60 border border-white/20 p-1 flex items-center justify-center">
              <img
                src={personal_info.academy.logo_url}
                alt={personal_info.academy.name}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div>
              <div className="font-athletic text-[11px] font-bold text-white uppercase tracking-wider leading-none">
                {personal_info.academy.name}
              </div>
              <div className="text-[8px] text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-[#CCFF00]" />
                <span>Jogja Verified</span>
              </div>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[8px] tracking-wider uppercase shadow-sm ${currentTheme.headerPill}`}>
            PROSPECT 2026
          </span>
        </div>

        {/* 2. PLAYER CUTOUT & HERO AURA */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
          <div
            className={`absolute w-40 h-40 rounded-full bg-gradient-to-tr ${currentTheme.aura} blur-2xl pointer-events-none`}
          />

          <div className="relative w-28 h-32 rounded-2xl overflow-hidden bg-[#090D16] border-2 border-white/20 shadow-2xl mb-2">
            <img
              src={personal_info.photo_url}
              alt={personal_info.full_name}
              className="w-full h-full object-cover object-top filter contrast-110 brightness-95"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-athletic font-bold text-[#CCFF00]">
              #{personal_info.jersey_number}
            </span>
          </div>

          <h2 className="font-athletic text-lg font-black text-white tracking-wide uppercase text-center leading-tight drop-shadow-md">
            {personal_info.full_name}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-300">
            <span className="font-bold text-[#CCFF00]">{personal_info.position}</span>
            <span>•</span>
            <span>U-13 Elite</span>
            <span>•</span>
            <span>{personal_info.preferred_foot}</span>
          </div>
        </div>

        {/* 3. STAT PILLARS */}
        <div className="relative z-10 space-y-2">
          <div className="p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
            <div className="grid grid-cols-3 gap-1.5">
              {topPillars.map((p) => (
                <div
                  key={p.code}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col justify-center"
                >
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">
                    {p.code}
                  </span>
                  <span className="font-athletic text-sm font-black text-white mt-0.5">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/5 text-[9px] text-slate-300 italic leading-snug text-center">
            "{endorsementQuote}"
          </div>

          {/* 4. BOTTOM VERIFICATION FOOTER */}
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
            <div className="flex items-center gap-1">
              <div className="p-1 rounded bg-white text-black">
                <QrCode className="w-3 h-3" />
              </div>
              <div>
                <div className="font-bold text-white uppercase leading-none">
                  SCAN FOR STATS
                </div>
                <div className="text-[7px] text-slate-400">
                  ID: {player_id}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-athletic font-bold text-[#CCFF00] tracking-wider uppercase">
                MPFA PASSPORT
              </div>
              <div className="text-[7px] text-slate-500">
                Official Scouting Dossier
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
