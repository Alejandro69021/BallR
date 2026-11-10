import React from 'react';
import { ShieldCheck, Share2, Users, User, Edit3 } from 'lucide-react';

export default function TopNav({
  academy,
  currentView,
  onSwitchView,
  onShare,
  verifiedText
}) {
  const getViewTitle = () => {
    if (currentView === 'roster') return 'Squad Hub & Roster Explorer';
    if (currentView === 'assessment') return 'Coach Assessment & Logger';
    return 'Digital Talent Passport';
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#090D16]/95 border-b border-[#1F2937]/80">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Brand Identity & Active Academy */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => onSwitchView('roster')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F2937] to-[#111827] border border-[#374151] flex items-center justify-center shadow-lg group-hover:border-[#CCFF00]/50 transition-colors overflow-hidden">
                {academy?.logo_url ? (
                  <img
                    src={academy.logo_url}
                    alt={academy.name || "MPFA"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#CCFF00] rounded-full border-2 border-[#090D16] flex items-center justify-center">
                <span className="w-1 h-1 bg-black rounded-full animate-ping"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-athletic font-bold text-white tracking-wider uppercase">
                  {getViewTitle()}
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded bg-lime-500/10 text-[#CCFF00] border border-[#CCFF00]/20">
                  U-13 ELITE
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-slate-300 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                <span className="truncate">
                  {verifiedText || `Verified by ${academy?.name || 'MPFA Jogja'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Share Button */}
          <button
            onClick={onShare}
            className="md:hidden p-2 rounded-lg bg-[#111827] border border-[#1F2937] text-slate-200"
            title="Bagikan"
          >
            <Share2 className="w-4 h-4 text-[#CCFF00]" />
          </button>
        </div>

        {/* Center / Right: 3 Distinct View Toggles */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2">
          
          {/* 3 View Tabs: [ 📋 Squad Roster ] | [ 👤 Talent Passport ] | [ ✍️ Coach Logger ] */}
          <div className="flex items-center p-1 rounded-xl bg-[#111827] border border-[#1F2937] w-full md:w-auto">
            {/* Squad Roster */}
            <button
              onClick={() => onSwitchView('roster')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                currentView === 'roster'
                  ? 'bg-gradient-to-r from-lime-400 to-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs">📋</span>
              <span className="font-athletic tracking-wide">Squad Roster</span>
            </button>

            {/* Talent Passport */}
            <button
              onClick={() => onSwitchView('passport')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                currentView === 'passport'
                  ? 'bg-gradient-to-r from-lime-400 to-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs">👤</span>
              <span className="font-athletic tracking-wide">Passport</span>
            </button>

            {/* Coach Logger */}
            <button
              onClick={() => onSwitchView('assessment')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
                currentView === 'assessment'
                  ? 'bg-gradient-to-r from-lime-400 to-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs">✍️</span>
              <span className="font-athletic tracking-wide">Coach Logger</span>
            </button>
          </div>

          {/* Desktop Share Button */}
          <button
            onClick={onShare}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] hover:border-[#CCFF00]/40 text-slate-200 hover:text-white text-xs font-semibold tracking-wide transition-all min-h-[36px] cursor-pointer shadow-sm group shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-[#CCFF00] group-hover:rotate-12 transition-transform" />
            <span>Bagikan</span>
          </button>
        </div>

      </div>
    </header>
  );
}
