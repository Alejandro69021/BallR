import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/brand';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function PrivacyPage() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

  return (
    <div
      data-surface="paper"
      className="min-h-screen bg-chalk text-ink selection:bg-bib selection:text-ink flex flex-col justify-between"
    >
      {/* Top Header */}
      <header className="border-b border-line bg-chalk/95 sticky top-0 z-40 backdrop-blur-md">
        <div
          data-testid="landing-container"
          className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between"
        >
          <Link
            to="/"
            className="flex items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch"
            aria-label="Kembali ke halaman depan"
          >
            <Wordmark size="sm" />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-2 hover:text-ink flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch rounded-control px-3 py-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 sm:py-16">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 space-y-8">
          {/* Prominent Warning Banner */}
          <div className="p-4 sm:p-5 rounded-panel bg-warn-bg text-warn-ink border border-warn-ink/40 font-semibold text-sm sm:text-base flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <span>Draf, belum ditinjau penasihat hukum. Halaman ini adalah penjelasan jujur mengenai cara kerja data saat ini dan batasan pengembangannya.</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tight text-ink leading-tight">
              Kebijakan Privasi (draf)
            </h1>
            <p className="text-sm text-2">
              Draf internal tahun {CURRENT_YEAR} · Belum berlaku sebagai dokumen hukum perikatan.
            </p>
          </div>

          {/* Structured Policy Sections */}
          <div className="max-w-3xl space-y-8 text-base text-2 font-normal leading-relaxed">
            {/* 1. Mode Demo */}
            <section className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink uppercase tracking-tight">
                1. Mode Demo (Saat Ini)
              </h2>
              <p>
                Seluruh data yang tampil dalam mode demo adalah data fiktif (nama atlet, klub, kejadian pertandingan, dan pengukuran tubuh).
              </p>
              <p>
                Semua perubahan data yang Anda lakukan selama mencoba demo tersimpan murni di penyimpanan lokal peramban Anda (<code className="font-mono text-sm bg-panel px-1.5 py-0.5 rounded border border-line">localStorage</code>). Tidak ada data yang dikirim atau diunggah ke peladen luar mana pun.
              </p>
              <p>
                Jika Anda membersihkan data situs atau menghapus cache peramban, seluruh data demo akan terhapus dan kembali ke data bawaan.
              </p>
            </section>

            {/* 2. Mode Riil */}
            <section className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink uppercase tracking-tight">
                2. Mode Riil (Sedang Disiapkan)
              </h2>
              <p>
                Aplikasi ini sedang dalam tahap uji coba terbatas dan belum dibuka untuk pendaftaran umum atau penerimaan data atlet anak nyata.
              </p>
              <p>
                Ketika mode riil diaktifkan nanti:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-ink">
                <li>
                  <strong>Persetujuan Orang Tua/Wali Wajib:</strong> Data anak dan atlet di bawah umur tidak boleh dimasukkan ke dalam sistem sebelum persetujuan resmi dari orang tua atau wali terdaftar secara sah.
                </li>
                <li>
                  <strong>Tanpa Penjualan Data:</strong> Data perkembangan, kebugaran, dan performa anak tidak akan pernah diperjualbelikan kepada pihak ketiga, broker data, atau jaringan periklanan.
                </li>
                <li>
                  <strong>Akses Terbatas:</strong> Hanya pelatih dan staf akademi yang berwenang serta orang tua anak bersangkutan yang memiliki hak akses terhadap riwayat paspor perkembangan.
                </li>
              </ul>
            </section>

            {/* 3. Tanpa Pengumpulan Data Pribadi di Halaman Ini */}
            <section className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink uppercase tracking-tight">
                3. Tanpa Pengumpulan Data Saat Ini
              </h2>
              <p>
                Halaman depan dan aplikasi uji coba ini tidak menggunakan formulir pengumpulan identitas pribadi pengunjung, tidak menyediakan pendaftaran berbayar, dan tidak menggunakan skrip pelacak analitik pihak ketiga.
              </p>
            </section>

            {/* 4. Kontak Pengembang */}
            <section className="space-y-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink uppercase tracking-tight">
                4. Pertanyaan dan Kontak
              </h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai rancangan privasi atau tertarik berpartisipasi dalam uji coba akademi, silakan hubungi pengembang:
              </p>
              {contactEmail ? (
                <p>
                  Email:{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-mono text-sm text-pitch font-semibold underline hover:text-pitch-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch rounded-xs"
                  >
                    {contactEmail}
                  </a>
                </p>
              ) : (
                <p className="text-2 font-medium">
                  Hubungi pengembang melalui repositori proyek.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-8 bg-chalk text-sm text-2">
        <div data-testid="landing-container" className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 text-center">
          <p>© {CURRENT_YEAR} ProspekBola. Draf kebijakan privasi.</p>
        </div>
      </footer>
    </div>
  );
}
