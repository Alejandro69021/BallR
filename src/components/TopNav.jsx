import React from 'react';
import {
  ShieldCheck,
  Share2,
  Lock,
  LogOut,
  Users,
  User,
  Timer,
  ClipboardEdit,
  Film,
  TrendingUp
} from 'lucide-react';

export default function TopNav({
  academy,
  currentView,
  userRole = 'public',
  isDemoMode = false,
  onSwitchView,
  onOpenAuthModal,
  onLogout,
  onShare,
  verifiedText
}) {
  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isParent = userRole === 'parent';
  const isAuthenticated = isCoach || isParent;

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
              <div className="w-9 h-9 rounded-lg bg-[#111827] border border-slate-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[#84CC16] transition-colors">
                {academy?.logo_url ? (
                  <img
                    src={academy.logo_url}
                    alt={academy.name || "Akademi"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-mono font-bold text-slate-400">FA</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white tracking-wide">
                  {academy?.name || 'Akademi Sepakbola'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-[#84CC16] border border-[#84CC16]/30">
                  U-13
                </span>
                {isDemoMode && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Data contoh
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#84CC16] shrink-0" />
                <span className="truncate">
                  {verifiedText || academy?.city || 'Basis Data Resmi'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Quick Action (Auth & Share) */}
          <div className="flex items-center gap-2 md:hidden">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => onOpenAuthModal('assessment')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#111827] border border-slate-700 text-xs font-medium text-slate-300 active:scale-95 transition-transform"
              >
                <Lock className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Masuk</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 md:hidden">
                {isDemoMode && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Mode demo
                  </span>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs"
                  title="Keluar Sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onShare}
              className="p-1.5 rounded bg-[#111827] border border-slate-800 text-slate-300 active:scale-95"
              title="Bagikan Paspor"
            >
              <Share2 className="w-4 h-4 text-[#84CC16]" />
            </button>
          </div>
        </div>

        {/* Center / Right: Primary Navigation Bar */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5">
          
          <nav className="flex items-center gap-1 p-1 rounded-lg bg-[#0E131F] border border-[#1E2638] w-full md:w-auto overflow-x-auto scrollbar-none">
            {/* 1. Paspor Atlet */}
            <button
              type="button"
              onClick={() => onSwitchView('passport')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                currentView === 'passport'
                  ? 'bg-[#84CC16] text-black shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Paspor</span>
            </button>

            {/* 2. Analisis Laga */}
            <button
              type="button"
              onClick={() => onSwitchView('match')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                currentView === 'match'
                  ? 'bg-[#84CC16] text-black shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Analisis Laga</span>
            </button>

            {/* 3. Pertumbuhan */}
            <button
              type="button"
              onClick={() => onSwitchView('growth')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                currentView === 'growth'
                  ? 'bg-[#84CC16] text-black shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pertumbuhan</span>
            </button>

            {/* 4. Skuad */}
            <button
              type="button"
              onClick={() => onSwitchView('roster')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                currentView === 'roster'
                  ? 'bg-[#84CC16] text-black shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Skuad</span>
            </button>

            {/* Coach Only: 5. Pitch Logger */}
            {isCoach && (
              <button
                type="button"
                onClick={() => onSwitchView('logger')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                  currentView === 'logger'
                    ? 'bg-rose-500 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Pitch Logger</span>
              </button>
            )}

            {/* Coach Only: 6. Evaluasi Pelatih */}
            {isCoach && (
              <button
                type="button"
                onClick={() => onSwitchView('assessment')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] cursor-pointer whitespace-nowrap ${
                  currentView === 'assessment'
                    ? 'bg-[#84CC16] text-black shadow-sm font-semibold'
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
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => onOpenAuthModal('logger')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0E131F] hover:bg-[#151C2C] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors min-h-[32px] cursor-pointer active:scale-95"
                title="Masuk sebagai pelatih atau orang tua"
              >
                <Lock className="w-3.5 h-3.5 text-[#84CC16]" />
                <span>Masuk Akun</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#0E131F] border border-emerald-500/30 px-3 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-medium text-emerald-300">
                  {isCoach ? 'Pelatih' : isParent ? 'Wali Atlet' : 'Admin'}
                  {isDemoMode && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Mode demo
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Keluar sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0E131F] hover:bg-[#151C2C] border border-[#1E2638] text-slate-300 hover:text-white text-xs font-medium transition-colors min-h-[32px] cursor-pointer active:scale-95"
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
