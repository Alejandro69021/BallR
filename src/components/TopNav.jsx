import React from 'react';
import {
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
import Badge from './ui/Badge';
import Button from './ui/Button';
import IconButton from './ui/IconButton';

export default function TopNav({
  academy,
  currentView,
  userRole = 'public',
  isDemoMode = false,
  onSwitchView,
  onOpenAuthModal,
  onLogout,
  onShare
}) {
  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isParent = userRole === 'parent';
  const isAuthenticated = isCoach || isParent;

  const navItems = [
    { id: 'passport', label: 'Paspor', shortLabel: 'Paspor', icon: <User className="w-4 h-4 shrink-0" /> },
    { id: 'match', label: 'Analisis laga', shortLabel: 'Laga', icon: <Film className="w-4 h-4 shrink-0" /> },
    { id: 'growth', label: 'Pertumbuhan', shortLabel: 'Tumbuh', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
    { id: 'roster', label: 'Skuad', shortLabel: 'Skuad', icon: <Users className="w-4 h-4 shrink-0" /> },
    ...(isCoach
      ? [
          { id: 'logger', label: 'Pitch logger', shortLabel: 'Logger', icon: <Timer className="w-4 h-4 shrink-0" /> },
          { id: 'assessment', label: 'Evaluasi', shortLabel: 'Evaluasi', icon: <ClipboardEdit className="w-4 h-4 shrink-0" /> }
        ]
      : [])
  ];

  return (
    <>
      {/* Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0F14]/95 border-b border-[#2C3643]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-12 flex items-center justify-between gap-3">
          
          {/* Left: Academy Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-[6px] bg-[#1A212B] border border-[#2C3643] flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
              onClick={() => onSwitchView?.(isCoach ? 'roster' : 'passport')}
            >
              {academy?.logo_url ? (
                <img
                  src={academy.logo_url}
                  alt={academy.name || 'Akademi'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-[10px] font-mono font-bold text-[#9AA6B5]">FA</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-[#E8ECF1] truncate max-w-[140px] sm:max-w-none">
                {academy?.name || 'Akademi Sepakbola'}
              </span>
              <Badge variant="neutral" size="sm">U-13</Badge>
              {isDemoMode && (
                <Badge variant="warning" size="sm">Data contoh</Badge>
              )}
            </div>
          </div>

          {/* Center: Desktop Navigation Bar (>= 768px) */}
          <nav
            aria-label="Navigasi utama desktop"
            className="hidden md:flex items-center gap-1 h-full"
          >
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSwitchView?.(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 h-full text-xs transition-colors duration-150 ease-out select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FB286] ${
                    isActive
                      ? 'text-[#E8ECF1] font-semibold'
                      : 'text-[#9AA6B5] hover:text-[#E8ECF1]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#4FB286] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Auth & Share Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isAuthenticated ? (
              <Button
                variant="secondary"
                size="sm"
                icon={<Lock className="w-3.5 h-3.5" />}
                onClick={() => onOpenAuthModal?.('assessment')}
              >
                Masuk
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                {isDemoMode && (
                  <Badge variant="warning" size="sm">Mode demo</Badge>
                )}
                <span className="hidden sm:inline-block text-xs font-medium text-[#4FB286]">
                  {isCoach ? 'Pelatih' : isParent ? 'Wali' : 'Admin'}
                </span>
                <IconButton
                  icon={<LogOut className="w-3.5 h-3.5" />}
                  label="Keluar sesi"
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                />
              </div>
            )}

            <IconButton
              icon={<Share2 className="w-3.5 h-3.5 text-[#4FB286]" />}
              label="Bagikan paspor"
              variant="secondary"
              size="sm"
              onClick={onShare}
            />
          </div>

        </div>
      </header>

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Navigasi bawah seluler"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#11161D] border-t border-[#2C3643] flex items-center justify-around px-1 select-none"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitchView?.(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4FB286] cursor-pointer ${
                isActive
                  ? 'text-[#4FB286] font-semibold'
                  : 'text-[#9AA6B5] hover:text-[#E8ECF1]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] leading-none tracking-tight">
                {item.shortLabel}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-3 right-3 h-0.5 bg-[#4FB286] rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
