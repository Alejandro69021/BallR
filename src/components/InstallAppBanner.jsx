import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

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
      alert("Untuk memasang: Buka menu browser (titik 3 di kanan atas) dan pilih 'Instal Aplikasi' atau 'Tambahkan ke Layar Utama'.");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('prospek_pwa_dismissed', 'true');
  };

  // Don't render if already installed or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 max-w-md animate-fadeIn select-none">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111827]/95 backdrop-blur-xl border-2 border-[#84CC16]/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(132,204,22,0.25)] flex flex-col gap-2.5">
        
        {/* Top Content Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05070B] border border-[#84CC16] p-1.5 shrink-0 flex items-center justify-center shadow-inner">
              <img src="/icon.svg" alt="ProspekBola" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-athletic font-bold uppercase tracking-wider text-[#CCFF00] bg-lime-500/15 px-2 py-0.5 rounded border border-[#CCFF00]/30">
                  Aplikasi Lapangan
                </span>
                <span className="text-[11px] text-slate-400 font-mono">PWA Native</span>
              </div>
              <h5 className="font-athletic text-sm font-bold text-white tracking-tight mt-0.5">
                ProspekBola Mobile Web App
              </h5>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          📲 Pasang ProspekBola di Layar Utama HP untuk Akses Cepat di Lapangan (tanpa URL bar).
        </p>

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-lime-500 to-[#CCFF00] hover:from-lime-400 hover:to-lime-200 text-black font-athletic font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Pasang Sekarang</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Nanti Saja
          </button>
        </div>

        {/* iOS Step-by-Step Tooltip */}
        {showIOSTip && (
          <div className="mt-2 p-3 rounded-xl bg-[#05070B] border border-cyan-500/50 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-athletic font-bold text-cyan-300">
              <Share className="w-4 h-4" />
              <span>Cara Pasang di Safari iPhone:</span>
            </div>
            <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah Safari browser.</li>
              <li>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong>"Tambah"</strong> di pojok kanan atas.</li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}

