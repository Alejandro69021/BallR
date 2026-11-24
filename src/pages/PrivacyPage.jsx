import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/brand';
import { ArrowLeft } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-app text-1 selection:bg-brand selection:text-app flex flex-col justify-between">
      <header className="border-b border-line bg-app sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" aria-label="Kembali ke halaman depan">
            <Wordmark size="sm" />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-2 hover:text-1 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control px-2 py-1 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 space-y-6">
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-1 text-sm font-semibold rounded-control bg-warn-bg text-warn-ink border border-warn-ink/20">
              Draf, belum ditinjau penasihat hukum
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-1">Kebijakan Privasi (draf)</h1>
          </div>

          <div className="max-w-3xl text-2 text-base leading-relaxed space-y-4">
            <p>
              ProspekBola saat ini masih dalam tahap uji coba dan belum membuka pendaftaran akun publik untuk data anak nyata.
            </p>
            <p>
              Dalam mode demo, seluruh data bersifat fiktif dan hanya tersimpan secara lokal di peramban pengguna. Dokumen kebijakan privasi resmi sedang disiapkan dan akan ditinjau bersama penasihat hukum sebelum data atlet muda sungguhan dicatat.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6 text-sm text-2">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 text-center">
          <p>© {CURRENT_YEAR} ProspekBola. Draf kebijakan privasi.</p>
        </div>
      </footer>
    </div>
  );
}
