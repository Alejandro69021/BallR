import React, { useState, useRef, useEffect } from 'react';
import { BrandMark, Wordmark } from './brand';
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
  onOpenTutorial,
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

  const brandVariant = surface === 'dark' ? 'light' : 'dark';

  return (
    <>
      {/* Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/95 border-b border-line print:hidden">
        <div data-testid="top-nav-bar" className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">

          {/* Left: Brand Identity + Academy Name */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <button
              type="button"
              aria-label="Kembali ke halaman depan"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center cursor-pointer bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control transition-transform active:scale-95"
              onClick={() => onSwitchView?.('landing')}
            >
              <span className="hidden sm:inline-flex items-center">
                <Wordmark size="sm" variant={brandVariant} />
              </span>
              <span className="sm:hidden inline-flex items-center">
                <BrandMark size={24} variant={brandVariant} />
              </span>
            </button>

            {!isDemoMode && isAuthenticated && academy?.name && (
              <span className="text-sm font-semibold text-1 truncate max-w-[120px] sm:max-w-[70px] xl:max-w-xs">
                {academy.name}
              </span>
            )}
          </div>

          {/* Center: Desktop Navigation Bar for public role only (Coach & Parent use Left Sidebar on md+) */}
          {!isAuthenticated && (
            <nav
              aria-label="Navigasi utama desktop"
              className="hidden md:flex items-center gap-1 lg:gap-1.5 h-full shrink-0"
            >
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSwitchView?.(item.id)}
                    className={`relative flex items-center gap-1.5 px-2 lg:px-2.5 h-full text-sm transition-colors duration-150 ease-out select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
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
          )}

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
                <div className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm">
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
                      onSwitchView?.('landing');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-1 hover:bg-raised flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Home className="w-4 h-4 text-2" />
                    <span>Halaman Depan</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenTutorial?.();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-2 hover:text-1 hover:bg-raised flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-brand" />
                    <span>Ulangi Tutorial</span>
                  </button>

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

      {/* Desktop Left Sidebar for Coach, Admin & Parent Mode (>= 768px) */}
      {isAuthenticated && (
        <aside
          aria-label={isCoach ? 'Sidebar menu pelatih' : 'Sidebar portal orang tua'}
          data-testid="coach-left-sidebar"
          className="hidden md:flex fixed top-12 left-0 bottom-0 w-56 z-30 flex-col justify-between bg-panel border-r border-line p-3 select-none overflow-y-auto print:hidden"
        >
          <div className="space-y-3">
            <div className="px-2.5 pt-1 text-sm font-medium text-2 tracking-wide">
              {isCoach ? 'Menu Pelatih' : 'Portal Orang Tua'}
            </div>
            <nav
              aria-label="Navigasi utama desktop"
              className="flex flex-col gap-1"
            >
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSwitchView?.(item.id)}
                    className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control text-sm transition-colors duration-150 ease-out cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                      isActive
                        ? 'bg-raised text-1 font-semibold border border-line'
                        : 'text-2 hover:text-1 hover:bg-app border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 bg-brand rounded-r-full"
                        aria-hidden="true"
                      />
                    )}
                    <span className={isActive ? 'text-brand' : 'text-2'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-line space-y-1">
            <button
              type="button"
              onClick={() => onSwitchView?.('landing')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-2 hover:text-1 hover:bg-app transition-colors cursor-pointer text-left"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Kembali ke Halaman Depan</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenTutorial?.()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-2 hover:text-1 hover:bg-app transition-colors cursor-pointer text-left"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-brand" />
              <span>Ulangi Tutorial</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchView?.('help')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-2 hover:text-1 hover:bg-app transition-colors cursor-pointer text-left"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Panduan Singkat</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Navigasi bawah seluler"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 min-h-[56px] bg-panel border-t border-line flex items-center justify-around px-1 select-none print:hidden"
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
