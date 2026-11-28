import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../brand';
import Button from '../ui/Button';
import { landingCopy } from './landingCopy';

export default function LandingHeader({
  userRole = 'public',
  isDemoMode = false,
  onOpenAuthModal
}) {
  const navigate = useNavigate();
  const copy = landingCopy.header;

  const demoModeActive = Boolean(isDemoMode || import.meta.env.VITE_DEMO_MODE === 'true');
  const demoUrl = import.meta.env.VITE_DEMO_URL || '';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

  const isSignedIn = userRole === 'coach' || userRole === 'admin' || userRole === 'parent';

  const handleDemoClick = () => {
    if (demoModeActive) {
      navigate('/beranda');
    }
  };

  return (
    <header id="bilah-atas" className="sticky top-0 z-40 w-full backdrop-blur-lg bg-chalk/75 border-b border-line/80 shadow-xs">
      <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Wordmark with Clean Wrapper to Avoid Tailwind display Clash */}
        <Link
          to="/"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch shrink-0 transition-transform active:scale-95"
          aria-label="ProspekBola Halaman Depan"
        >
          <span className="sm:hidden flex items-center">
            <Wordmark size="sm" />
          </span>
          <span className="hidden sm:inline-flex items-center">
            <Wordmark size="md" />
          </span>
        </Link>

        {/* Desktop Navigation Links (Hidden on mobile <768px per LANDING_SPEC bagian 5) */}
        <nav
          aria-label="Navigasi halaman depan"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-2"
        >
          {copy.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-ink transition-colors min-h-[44px] flex items-center"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons (Always visible, nowrap, min-h 44px) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isSignedIn ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/beranda')}
              className="min-h-[44px] min-w-[44px] font-medium px-2 sm:px-3.5"
            >
              {copy.cta.openApp}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenAuthModal?.('home')}
              className="min-h-[44px] min-w-[44px] font-medium px-2 sm:px-3.5"
            >
              {copy.cta.signIn}
            </Button>
          )}

          {demoModeActive ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDemoClick}
              className="min-h-[44px] min-w-[44px] font-semibold bg-pitch text-chalk hover:bg-pitch-2 border-transparent px-2.5 sm:px-3.5"
            >
              {copy.cta.tryDemo}
            </Button>
          ) : demoUrl ? (
            <a
              href={demoUrl}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 sm:px-4 py-2 rounded-control bg-pitch text-chalk font-semibold text-sm hover:bg-pitch-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch"
            >
              {copy.cta.tryDemo}
            </a>
          ) : contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2 sm:px-4 py-2 rounded-control border border-line bg-panel text-ink font-medium text-sm hover:border-pitch transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch"
            >
              {copy.cta.requestTrial}
            </a>
          ) : (
            <span className="text-sm text-2 font-medium py-2 px-1 min-h-[44px] flex items-center">
              {copy.cta.contactDev}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
