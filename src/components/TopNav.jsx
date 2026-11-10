import React from 'react';
import {
  ShieldCheck,
  Share2,
  Lock,
  LogOut,
  Users,
  User,
  Timer,
  ClipboardEdit
} from 'lucide-react';

export default function TopNav({
  academy,
  currentView,
  userRole = 'public',
  onSwitchView,
  onOpenPinModal,
  onLockCoachSession,
  onShare,
  verifiedText
}) {
  const isCoach = userRole === 'coach';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#05070B]/95 border-b border-[#1E2638]">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Brand Identity & Active Academy */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => onSwitchView(isCoach ? 'roster' : 'passport')}
            >
              <div className="w-9 h-9 rounded-xl bg-[#111827] border border-slate-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[#84CC16] transition-colors">
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
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-athletic text-sm font-bold text-white tracking-wide">
                  {academy?.name || 'Mataram Putra FA'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-athletic font-bold rounded bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30">
                  U-13 ELITE
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
                <span className="truncate">
                  {verifiedText || 'Terakreditasi Asprov PSSI DIY'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Quick Action (Coach Switch & Share) */}
          <div className="flex items-center gap-2 md:hidden">
            {!isCoach ? (
              <button
                type="button"
                onClick={() => onOpenPinModal('assessment')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-slate-700 text-xs font-semibold text-slate-300 active:scale-95 transition-transform"
              >
                <Lock className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Coach</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLockCoachSession}
                className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs"
                title="Kunci Sesi Pelatih"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onShare}
              className="p-1.5 rounded-lg bg-[#111827] border border-slate-800 text-slate-300 active:scale-95"
              title="Bagikan Paspor"
            >
              <Share2 className="w-4 h-4 text-[#84CC16]" />
            </button>
          </div>
        </div>

        {/* Center / Right: Primary Navigation Bar */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5">
          
          <nav className="flex items-center p-1 rounded-xl bg-[#0E131F] border border-[#1E2638] w-full md:w-auto overflow-x-auto">
            {/* 1. Squad Hub */}
            <button
              type="button"
              onClick={() => onSwitchView('roster')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer whitespace-nowrap ${
                currentView === 'roster'
                  ? 'bg-[#84CC16] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Skuad</span>
            </button>

            {/* 2. Talent Passport */}
            <button
              type="button"
              onClick={() => onSwitchView('passport')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer whitespace-nowrap ${
                currentView === 'passport'
                  ? 'bg-[#84CC16] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Paspor</span>
            </button>

            {/* Coach Only: 3. Fast Pitch Logger */}
            {isCoach && (
              <button
                type="button"
                onClick={() => onSwitchView('logger')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer whitespace-nowrap ${
                  currentView === 'logger'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Match Logger</span>
              </button>
            )}

            {/* Coach Only: 4. Rapor Pelatih */}
            {isCoach && (
              <button
                type="button"
                onClick={() => onSwitchView('assessment')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer whitespace-nowrap ${
                  currentView === 'assessment'
                    ? 'bg-[#84CC16] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardEdit className="w-3.5 h-3.5" />
                <span>Evaluasi</span>
              </button>
            )}
          </nav>

          {/* Desktop Right Role Control */}
          <div className="hidden md:flex items-center gap-2">
            {!isCoach ? (
              <button
                type="button"
                onClick={() => onOpenPinModal('logger')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E131F] hover:bg-[#151C2C] border border-slate-700 text-slate-300 hover:text-white text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer active:scale-95"
                title="Buka akses pelatih dengan PIN"
              >
                <Lock className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Akses Pelatih</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#0E131F] border border-emerald-500/30 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-athletic font-bold text-emerald-300 uppercase tracking-wide">
                  Pelatih Aktif
                </span>
                <button
                  type="button"
                  onClick={onLockCoachSession}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Kunci sesi pelatih"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E131F] hover:bg-[#151C2C] border border-[#1E2638] text-slate-300 hover:text-white text-xs font-athletic font-bold uppercase tracking-wider transition-all min-h-[34px] cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-[#84CC16]" />
              <span>Bagikan</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
