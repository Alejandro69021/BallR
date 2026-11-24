import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, Share } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function InstallAppBanner() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const inStandalone =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator?.standalone === true;

    if (inStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed within this session
    const dismissed = sessionStorage.getItem('prospek_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isAppleMobile);

    // Listen to Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(!showIOSTip);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for browsers without prompt API
      alert("Untuk memasang: buka menu browser dan pilih 'Instal aplikasi' atau 'Tambahkan ke layar utama'.");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('prospek_pwa_dismissed', 'true');
  };

  // Do not render on /pencatatan/* routes (pitch logger ergonomics)
  if (location?.pathname?.startsWith('/pencatatan')) {
    return null;
  }

  // Don't render if already installed or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-md select-none">
      <div className="p-4 rounded-panel bg-panel border border-line shadow-popover flex flex-col gap-3 text-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm">
              Aplikasi lapangan
            </Badge>
            <span className="text-sm text-2">PWA</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-control text-2 hover:text-1 hover:bg-raised transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Tutup banner"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-1">
            Pasang aplikasi ProspekBola
          </h3>
          <p className="text-sm text-2 leading-relaxed mt-0.5">
            Pasang di layar utama perangkat untuk akses rekam jejak cepat di sisi lapangan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleInstallClick}
            className="flex-1"
            icon={<Download className="w-4 h-4" strokeWidth={1.5} />}
          >
            Pasang sekarang
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDismiss}
          >
            Nanti saja
          </Button>
        </div>

        {/* iOS Step-by-Step Tooltip */}
        {showIOSTip && (
          <div className="p-3 rounded-control bg-raised border border-line text-sm space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-1">
              <Share className="w-4 h-4 text-2" strokeWidth={1.5} />
              <span>Petunjuk pemasangan di Safari iOS</span>
            </div>
            <ol className="text-sm text-2 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Ketuk tombol Bagikan di bilah bawah browser Safari.</li>
              <li>Pilih menu Tambahkan ke Layar Utama.</li>
              <li>Ketuk Tambah di pojok kanan atas.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
