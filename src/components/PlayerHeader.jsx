import React from 'react';
import { Footprints, Ruler, Calendar, Scale, Share2 } from 'lucide-react';

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
    <section className="relative overflow-hidden rounded-3xl bg-[#0B0E14] border border-[#1E2638] p-4 sm:p-6 shadow-xl">
      <div className="relative flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        
        {/* Left Side: Athlete Portrait */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative shrink-0">
            <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden bg-[#111827] border-2 border-slate-700 shadow-md">
              <img
                src={photo_url}
                alt={full_name}
                className="w-full h-full object-cover object-top scale-105 filter contrast-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50" />
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 border border-slate-700 flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-[#84CC16]">
                  #{jersey_number}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile view player name + position next to image */}
          <div className="flex-1 sm:hidden">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-lime-500/10 border border-[#84CC16]/30 text-[#84CC16] text-[11px] font-athletic font-bold tracking-wider mb-1">
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
                type="button"
                onClick={onOpenStoryCard}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#84CC16] text-black font-athletic font-bold text-[10px] tracking-wider uppercase shadow-sm active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Story Card 9:16</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle: Player Details (Desktop view & specs) */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="hidden sm:flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-lime-500/10 border border-[#84CC16]/30 text-[#84CC16] text-xs font-athletic font-bold tracking-wider uppercase">
                {position}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                No. #{jersey_number}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Nama Panggilan: <strong className="text-white">{nickname}</strong>
              </span>
            </div>

            {onOpenStoryCard && (
              <button
                type="button"
                onClick={onOpenStoryCard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1E2638] text-slate-200 hover:text-white border border-slate-700 font-athletic font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95 shadow-sm"
                title="Ekspor Story Card 9:16 untuk Instagram / WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Ekspor Story Card 9:16</span>
              </button>
            )}
          </div>

          <h1 className="hidden sm:block font-athletic text-3xl font-black text-white tracking-tight">
            {full_name}
          </h1>

          <p className="hidden sm:block text-xs text-slate-400 font-medium mt-1">
            {academy?.name || 'Mataram Putra Football Academy'} • {academy?.city || 'Yogyakarta, ID'}
          </p>

          {/* Physical Specs Strip */}
          <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2 py-2.5 px-3.5 rounded-xl bg-[#0E131F] border border-[#1E2638] text-left">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Usia
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {age} <span className="text-[10px] font-normal text-slate-400">thn</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-slate-800 pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Ruler className="w-3 h-3 text-slate-500" /> Tinggi
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {height_cm} <span className="text-[10px] font-normal text-slate-400">cm</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-slate-800 pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3 h-3 text-slate-500" /> Berat
              </span>
              <span className="font-athletic text-sm sm:text-base font-bold text-white">
                {weight_kg} <span className="text-[10px] font-normal text-slate-400">kg</span>
              </span>
            </div>

            <div className="flex flex-col border-l border-slate-800 pl-2 sm:pl-3">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <Footprints className="w-3 h-3 text-slate-500" /> Kaki
              </span>
              <span className="font-athletic text-xs sm:text-sm font-bold text-[#84CC16] truncate" title={preferred_foot}>
                {preferred_foot}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Scout OVR Badge (Restrained Athletic Styling) */}
        <div className="shrink-0 self-center sm:self-start">
          <div
            onClick={onOpenStoryCard}
            className="w-24 sm:w-28 p-3 rounded-2xl bg-[#0E131F] border-2 border-[#84CC16]/60 shadow-lg flex flex-col items-center text-center cursor-pointer hover:border-[#84CC16] transition-colors"
            title="Klik untuk membuka Story Card 9:16"
          >
            <div className="w-full flex items-center justify-between px-0.5">
              <span className="text-[9px] font-athletic font-bold uppercase tracking-wider text-[#84CC16]">
                OVR
              </span>
              <span className="text-[10px]" title="Indonesia">
                🇮🇩
              </span>
            </div>

            {/* Big OVR Rating */}
            <div className="my-0.5">
              <span className="font-athletic text-4xl sm:text-5xl font-black text-white tracking-tighter">
                {overall_rating}
              </span>
            </div>

            {/* Position Code & Shield Details */}
            <div className="w-full flex items-center justify-center gap-1.5 pt-1.5 border-t border-slate-800">
              <span className="font-athletic font-bold text-xs text-white uppercase tracking-wider">
                {position.split(' ')[0]}
              </span>
              <span className="text-slate-600 text-[10px]">•</span>
              <span className="font-bold text-[10px] text-[#84CC16]">
                #{jersey_number}
              </span>
            </div>

            {/* MPFA stamp */}
            <div className="mt-1 text-[8px] font-mono text-slate-400 uppercase tracking-wider truncate max-w-[90px]">
              {academy?.city || 'YOGYAKARTA'}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
