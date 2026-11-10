import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestoredPill, setShowRestoredPill] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowRestoredPill(true);
      const timer = setTimeout(() => {
        setShowRestoredPill(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestoredPill(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showRestoredPill) {
    return null;
  }

  return (
    <div className="fixed top-2 sm:top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center justify-center pointer-events-none animate-fadeIn select-none">
      {isOffline ? (
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/20 border-2 border-amber-500/70 text-amber-200 text-xs font-semibold shadow-[0_4px_20px_rgba(245,158,11,0.35)] backdrop-blur-md">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>
            ⚠️ Offline Mode — Data tersimpan lokal, akan sinkron otomatis saat online.
          </span>
        </div>
      ) : (
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/70 text-emerald-200 text-xs font-semibold shadow-[0_4px_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>🟢 Online Kembali — Tersambung ke cloud.</span>
        </div>
      )}
    </div>
  );
}
