import React from 'react';
import {
  Share2,
  Lock,
  LogOut,
  Users,
  User,
  Timer,
  ClipboardEdit,
  TrendingUp,
  Trophy,
  Compass
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
    { id: 'growth', label: 'Pertumbuhan', shortLabel: 'Tumbuh', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
    { id: 'roster', label: 'Skuad', shortLabel: 'Skuad', icon: <Users className="w-4 h-4 shrink-0" /> },
    ...(isCoach
      ? [
        { id: 'matches', label: 'Laga', shortLabel: 'Laga', icon: <Trophy className="w-4 h-4 shrink-0" /> },
        { id: 'tactics', label: 'Taktik', shortLabel: 'Taktik', icon: <Compass className="w-4 h-4 shrink-0" /> },
        { id: 'logger', label: 'Logger', shortLabel: 'Logger', icon: <Timer className="w-4 h-4 shrink-0" /> },
        { id: 'assessment', label: 'Evaluasi', shortLabel: 'Evaluasi', icon: <ClipboardEdit className="w-4 h-4 shrink-0" /> }
      ]
      : [])
  ];

  return (
    <>
      {/* Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/95 border-b border-line">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-12 flex items-center justify-between gap-3">

          {/* Left: Academy Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Navigasi beranda akademi"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1 sm:ml-0 sm:min-h-0 sm:min-w-0 cursor-pointer bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control"
              onClick={() => onSwitchView?.(isCoach ? 'roster' : 'passport')}
            >
              <div className="w-7 h-7 rounded-control bg-raised border border-line flex items-center justify-center overflow-hidden shrink-0">
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
                  <span className="text-xs font-mono font-bold text-2">FA</span>
                )}
              </div>
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-1 truncate max-w-[140px] sm:max-w-none">
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
                  className={`relative flex items-center gap-1.5 px-3 h-full text-xs transition-colors duration-150 ease-out select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${isActive
                    ? 'text-1 font-semibold'
                    : 'text-2 hover:text-1'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand rounded-full"
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
              <div className="flex items-center gap-2">
                {isDemoMode && (
                  <Badge variant="warning" size="sm" className="hidden sm:inline-flex">Mode demo</Badge>
                )}
                <span className="hidden sm:inline-block text-xs font-medium text-brand">
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
              icon={<Share2 className="w-3.5 h-3.5 text-brand" />}
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-panel border-t border-line flex items-center justify-around px-1 select-none"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitchView?.(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer ${isActive
                ? 'text-brand font-semibold'
                : 'text-2 hover:text-1'
                }`}
            >
              {item.icon}
              <span className="text-xs leading-none tracking-tight">
                {item.shortLabel}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-3 right-3 h-0.5 bg-brand rounded-full"
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
