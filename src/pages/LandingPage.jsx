import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/brand';
import Button from '../components/ui/Button';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage({
  userRole = 'public',
  isDemoMode = false,
  onOpenAuthModal
}) {
  const navigate = useNavigate();

  const demoModeActive = Boolean(isDemoMode || import.meta.env.VITE_DEMO_MODE === 'true');
  const demoUrl = import.meta.env.VITE_DEMO_URL || '';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';
  const publisherName = import.meta.env.VITE_PUBLISHER_NAME || 'ProspekBola';

  const isSignedIn = userRole === 'coach' || userRole === 'admin' || userRole === 'parent';

  // Handler for demo button
  const handleDemoClick = () => {
    if (demoModeActive) {
      navigate('/beranda');
    }
  };

  return (
    <div className="min-h-screen bg-app text-1 selection:bg-brand selection:text-app flex flex-col justify-between">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-bib focus:text-ink focus:font-semibold focus:rounded-control focus:shadow-md focus:outline-none"
      >
        Lompat ke konten
      </a>

      {/* 1. Bilah Atas (Header Landmark) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-app/95 border-b border-line">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Logo & Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="ProspekBola Halaman Depan"
          >
            <Wordmark size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi halaman depan"
            className="hidden md:flex items-center gap-4 text-sm font-medium text-2"
          >
            <a href="#fitur" className="hover:text-1 transition-colors min-h-[44px] flex items-center">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-1 transition-colors min-h-[44px] flex items-center">
              Cara kerja
            </a>
            <a href="#prinsip" className="hover:text-1 transition-colors min-h-[44px] flex items-center">
              Prinsip
            </a>
            <a href="#status" className="hover:text-1 transition-colors min-h-[44px] flex items-center">
              Status
            </a>
            <a href="#tanya" className="hover:text-1 transition-colors min-h-[44px] flex items-center">
              Tanya jawab
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Masuk / Buka aplikasi */}
            {isSignedIn ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/beranda')}
                className="min-h-[44px] font-medium"
              >
                Buka aplikasi
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={() => onOpenAuthModal?.('home')}
                className="min-h-[44px] font-medium"
              >
                Masuk
              </Button>
            )}

            {/* Coba demo / Minta akses uji coba / Hubungi pengembang */}
            {demoModeActive ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleDemoClick}
                className="min-h-[44px] font-semibold"
              >
                Coba demo
              </Button>
            ) : demoUrl ? (
              <a
                href={demoUrl}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-control bg-brand text-chalk font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Coba demo
              </a>
            ) : contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-control border border-line bg-raised text-1 font-medium text-sm hover:border-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Minta akses uji coba
              </a>
            ) : (
              <span className="text-sm text-2 font-medium py-2 px-1">
                Hubungi pengembang
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Landmark with 11 Sections Shell */}
      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Section 1: Bilah atas */}
          <section id="bilah-atas" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Bilah Atas</h2>
          </section>

          {/* Section 2: Hero */}
          <section id="hero" className="space-y-3">
            <h1 className="font-display text-3xl sm:text-5xl text-1">
              Catat laganya. Bangun paspor pemainnya.
            </h1>
            <h2 className="font-display text-2xl sm:text-3xl text-2">
              Catat laganya. Bangun paspor pemainnya.
            </h2>
          </section>

          {/* Section 3: Masalah */}
          <section id="masalah" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Catatan akademi sering tercecer.</h2>
          </section>

          {/* Section 4: Fitur utama */}
          <section id="fitur" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Tiga hal yang dikerjakan ProspekBola dengan baik.</h2>
          </section>

          {/* Section 5: Fitur pendukung */}
          <section id="fitur-pendukung" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Dan fitur pendukung lainnya</h2>
          </section>

          {/* Section 6: Cara kerja */}
          <section id="cara-kerja" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Dari kick-off sampai laporan, empat langkah.</h2>
          </section>

          {/* Section 7: Prinsip data */}
          <section id="prinsip" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Jujur dengan data, terutama data anak.</h2>
          </section>

          {/* Section 8: Status */}
          <section id="status" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Di mana posisi ProspekBola hari ini.</h2>
          </section>

          {/* Section 9: Tanya jawab */}
          <section id="tanya" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Tanya jawab</h2>
          </section>

          {/* Section 10: Ajakan uji coba */}
          <section id="cta" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Ingin mencoba di akademimu?</h2>
          </section>

          {/* Section 11: Kaki */}
          <section id="kaki" className="space-y-2">
            <h2 className="font-display text-2xl text-1">Kaki</h2>
          </section>
        </div>
      </main>

      {/* Footer Landmark */}
      <footer className="border-t border-line py-8 sm:py-12 bg-app text-sm text-2">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Wordmark size="sm" />
            <p className="max-w-md text-sm text-2">
              Di demo, semua data fiktif dan hanya tersimpan di peramban kamu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-line text-sm">
            <Link to="/bantuan" className="hover:text-1 min-h-[44px] flex items-center">
              Panduan
            </Link>
            <Link to="/rujukan" className="hover:text-1 min-h-[44px] flex items-center">
              Rujukan
            </Link>
            <Link to="/privasi" className="hover:text-1 min-h-[44px] flex items-center">
              Kebijakan privasi (draf)
            </Link>
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="hover:text-1 min-h-[44px] flex items-center">
                Kontak
              </a>
            ) : (
              <span className="text-2 min-h-[44px] flex items-center">Kontak</span>
            )}
          </div>

          <div className="text-sm text-2 pt-2">
            © {CURRENT_YEAR} {publisherName}.
          </div>
        </div>
      </footer>
    </div>
  );
}
