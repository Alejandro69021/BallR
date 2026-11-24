import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Lock,
  LogOut,
  Home,
  Users,
  User,
  ClipboardEdit,
  TrendingUp,
  Trophy,
  Compass,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';

export default function TopNav({
  academy,
  currentView,
  userRole = 'public',
  isDemoMode = false,
  surface = 'paper',
  onToggleSurface,
  onSwitchView,
  onOpenAuthModal,
  onLogout,
  onShare
}) {
  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isParent = userRole === 'parent';
  const isAuthenticated = isCoach || isParent;

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const navItems = isCoach
    ? [
        { id: 'home', label: 'Beranda', shortLabel: 'Beranda', icon: <Home className="w-4 h-4 shrink-0" /> },
        { id: 'roster', label: 'Skuad', shortLabel: 'Skuad', icon: <Users className="w-4 h-4 shrink-0" /> },
        { id: 'matches', label: 'Laga', shortLabel: 'Laga', icon: <Trophy className="w-4 h-4 shrink-0" /> },
        { id: 'tactics', label: 'Taktik', shortLabel: 'Taktik', icon: <Compass className="w-4 h-4 shrink-0" /> },
        { id: 'assessment', label: 'Evaluasi', shortLabel: 'Evaluasi', icon: <ClipboardEdit className="w-4 h-4 shrink-0" /> }
      ]
    : [
        { id: 'passport', label: 'Paspor', shortLabel: 'Paspor', icon: <User className="w-4 h-4 shrink-0" /> },
        { id: 'growth', label: 'Pertumbuhan', shortLabel: 'Tumbuh', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
        { id: 'roster', label: 'Skuad', shortLabel: 'Skuad', icon: <Users className="w-4 h-4 shrink-0" /> }
      ];

  const roleLabel = isCoach ? 'Pelatih' : isParent ? 'Wali' : isDemoMode ? 'Mode demo' : 'Publik';

  const themeAriaLabel =
    surface === 'paper'
      ? 'Tema: Terang. Ganti ke Gelap'
      : 'Tema: Gelap. Ganti ke Terang';

  const handleThemeClick = () => {
    const nextSurface = surface === 'paper' ? 'dark' : 'paper';
    onToggleSurface?.(nextSurface);
  };

  return (
    <>
      {/* Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/95 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">

          {/* Left: Academy Logo + Name ONLY */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <button
              type="button"
              aria-label="Navigasi beranda akademi"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center cursor-pointer bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control"
              onClick={() => onSwitchView?.(isCoach ? 'home' : 'passport')}
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
                  <span className="text-sm font-mono font-bold text-2">FA</span>
                )}
              </div>
            </button>

            <span className="text-sm font-semibold text-1 truncate max-w-[140px] sm:max-w-xs">
              {academy?.name || 'Akademi Sepakbola'}
            </span>
          </div>

          {/* Center: Desktop Navigation Bar (>= 768px, icon+label at >= 1024px) */}
          <nav
            aria-label="Navigasi utama desktop"
            className="hidden md:flex items-center gap-1 lg:gap-2 h-full shrink-0"
          >
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSwitchView?.(item.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 h-full text-sm transition-colors duration-150 ease-out select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive
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

          {/* Right: ONE Theme Toggle + ONE Account Menu Button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* ONE Theme Button */}
            <button
              type="button"
              onClick={handleThemeClick}
              aria-label={themeAriaLabel}
              data-testid="theme-toggle"
              className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-1.5 rounded-control text-2 hover:text-1 hover:bg-raised transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {surface === 'paper' ? (
                <Moon className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-warning shrink-0" />
              )}
            </button>

            {/* ONE Account Menu Button with Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-label="Menu akun"
                aria-haspopup="true"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-fit px-2 py-1 rounded-control bg-raised border border-line text-1 hover:border-brand transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-xs">
                  {roleLabel.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{roleLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-2 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Opsi akun"
                  className="absolute right-0 mt-1.5 w-48 rounded-panel bg-panel border border-line shadow-popover py-1 z-50 text-1"
                >
                  <div className="px-3 py-2 border-b border-line text-sm text-2">
                    Peran: <strong className="text-1 font-semibold">{roleLabel}</strong>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onSwitchView?.('help');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-2 hover:text-1 hover:bg-raised flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-brand" />
                    <span>Bantuan</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onShare?.();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-2 hover:text-1 hover:bg-raised flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-brand" />
                    <span>Bagikan</span>
                  </button>

                  <div className="border-t border-line my-1" />

                  {isAuthenticated ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuthModal?.('assessment');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-brand font-medium hover:bg-raised flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Masuk</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Navigasi bawah seluler"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 min-h-[56px] bg-panel border-t border-line flex items-center justify-around px-1 select-none"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitchView?.(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center h-full min-h-[56px] py-1 gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer ${
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-2 hover:text-1'
              }`}
            >
              {item.icon}
              <span className="text-sm leading-none tracking-tight">
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
