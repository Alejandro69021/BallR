import React from 'react';
import { Footprints, Ruler, Calendar, Weight, Share2, Sparkles } from 'lucide-react';

export default function PlayerHeader({ personalInfo, onOpenStoryCard }) {
  const {
    full_name,
    nickname,
    jersey_number,
    position,
    age,
    preferred_foot,
    height_cm,
    weight_kg,
    academy,
    photo_url,
    overall_rating
  } = personalInfo;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-[#CCFF00]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        
        {/* Left Side: Glowing Athlete Portrait */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative shrink-0">
            {/* Glowing Border Ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#CCFF00] via-emerald-400 to-[#1F2937] opacity-80 blur-xs" />
            <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden bg-[#090D16] border-2 border-[#CCFF00]/80 shadow-lg shadow-black/80">
              <img
                src={photo_url}
                alt={full_name}
                className="w-full h-full object-cover object-top scale-105 filter contrast-110 brightness-95"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-[#CCFF00]/40 backdrop-blur-xs flex items-center gap-1">
                <span className="text-[10px] font-athletic font-bold text-[#CCFF00]">
                  #{jersey_number}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile view player name + position next to image */}
          <div className="flex-1 sm:hidden">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-500/15 border border-[#CCFF00]/30 text-[#CCFF00] text-[11px] font-bold tracking-wider mb-1">
              <span>{position}</span>
            </div>
            <h1 className="font-athletic text-2xl font-bold text-white tracking-tight leading-tight">
              {full_name}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              "{nickname}" • {academy?.city || 'Yogyakarta'}
            </p>

            {onOpenStoryCard && (
              <button
                onClick={onOpenStoryCard}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#CCFF00] text-black font-athletic font-bold text-[10px] tracking-wider uppercase shadow-md shadow-[#CCFF00]/20 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Story Flex Card</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle: Player Details (Desktop view & specs) */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="hidden sm:flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-lime-500/15 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold tracking-wider uppercase">
                {position}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Jersey #{jersey_number}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Nick: <strong className="text-white">{nickname}</strong>
              </span>
            </div>

            {onOpenStoryCard && (
              <button
                onClick={onOpenStoryCard}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-500/15 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-black border border-[#CCFF00]/40 font-athletic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                title="Buka Story Flex Card 9:16 untuk Instagram / WhatsApp"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>9:16 Story Flex Card</span>
              </button>
            )}
          </div>

          <h1 className="hidden sm:block font-athletic text-3xl md:text-4xl font-bold text-white tracking-tight">
            {full_name}
          </h1>

          <p className="hidden sm:block text-xs text-slate-400 font-medium mt-1">
            {academy?.name || 'Mataram Putra Football Academy'} • {academy?.city || 'Yogyakarta, ID'}
          </p>

          {/* Physical Specs Strip */}
          <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-[#090D16]/70 border border-[#1F2937]/90 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Usia
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {age} <span className="text-[10px] font-normal text-slate-400">thn</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-[#1F2937] pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Ruler className="w-3 h-3 text-slate-500" /> Tinggi
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {height_cm} <span className="text-[10px] font-normal text-slate-400">cm</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-[#1F2937] pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Weight className="w-3 h-3 text-slate-500" /> Berat
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {weight_kg} <span className="text-[10px] font-normal text-slate-400">kg</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-[#1F2937] pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Footprints className="w-3 h-3 text-slate-500" /> Kaki
              </span>
              <span className="font-athletic text-xs sm:text-sm font-bold text-[#CCFF00] truncate" title={preferred_foot}>
                {preferred_foot}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: EA FC / FIFA Style OVR Badge */}
        <div className="shrink-0 self-center sm:self-start">
          <div
            onClick={onOpenStoryCard}
            className="relative group cursor-pointer"
            title="Klik untuk membuka 9:16 Story Flex Card"
          >
            {/* Volt Glow Behind Badge */}
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-b from-[#CCFF00]/50 via-amber-400/30 to-transparent blur-md opacity-75 group-hover:opacity-100 transition duration-300" />

            {/* FIFA Card Crest Container */}
            <div className="relative w-24 sm:w-28 p-2.5 rounded-2xl bg-gradient-to-b from-[#242E16] via-[#161F2E] to-[#0D131F] border-2 border-[#CCFF00]/70 shadow-2xl flex flex-col items-center text-center group-hover:scale-105 transition-transform">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-[9px] font-athletic font-bold uppercase tracking-wider text-[#CCFF00]">
                  EA FC OVR
                </span>
                <span className="text-[10px]" title="Indonesia">
                  🇮🇩
                </span>
              </div>

              {/* Big OVR Rating */}
              <div className="my-0.5">
                <span className="font-athletic text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-lime-200 to-[#CCFF00] tracking-tighter drop-shadow-[0_2px_10px_rgba(204,255,0,0.4)]">
                  {overall_rating}
                </span>
              </div>

              {/* Position Code & Shield Details */}
              <div className="w-full flex items-center justify-center gap-1.5 pt-1 border-t border-[#CCFF00]/20">
                <span className="font-athletic font-bold text-xs text-white uppercase tracking-wider">
                  {position.split(' ')[0]}
                </span>
                <span className="text-slate-600 text-[10px]">•</span>
                <span className="font-bold text-[10px] text-[#CCFF00]">
                  #{jersey_number}
                </span>
              </div>

              {/* MPFA stamp */}
              <div className="mt-1 text-[8px] font-semibold text-slate-400 uppercase tracking-widest truncate max-w-[90px]">
                {academy?.city || 'YOGYAKARTA'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
