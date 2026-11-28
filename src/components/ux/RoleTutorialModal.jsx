import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const TUTORIAL_STORAGE_PREFIX = 'ballr_role_tutorial_done_v1_';

export function getRoleTutorialKey(role) {
  const normalized = role === 'admin' ? 'coach' : role || 'public';
  return `${TUTORIAL_STORAGE_PREFIX}${normalized}`;
}

export function isRoleTutorialDone(role) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    return window.localStorage.getItem(getRoleTutorialKey(role)) === 'true';
  } catch {
    return true;
  }
}

export function markRoleTutorialDone(role) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(getRoleTutorialKey(role), 'true');
  } catch {
    // ignore
  }
}

const STEPS_BY_ROLE = {
  coach: {
    badge: 'Panduan Mode Pelatih',
    title: 'Cara Menggunakan ProspekBola untuk Pelatih',
    steps: [
      {
        heading: '1. Navigasi Cepat di Sidebar Kiri',
        body: 'Seluruh menu utama pelatih (Beranda, Skuad, Laga, Taktik, Evaluasi) berada di sisi kiri layar agar mudah dijangkau. Klik logo ProspekBola di pojok kiri atas kapan saja untuk kembali ke Halaman Depan.'
      },
      {
        heading: '2. Mencatat Laga & Memutar Video YouTube',
        body: 'Buka menu Laga, pilih pertandingan, lalu klik Catat kejadian. Putar video YouTube Live atau video lokal, pilih Tim Kita atau Lawan, ketuk posisi pada gambar lapangan, lalu tekan tombol aksi (Umpan, Tembakan, Tekel, dan lainnya). Panel Analisis Live di bawah langsung menghitung statistik otomatis.'
      },
      {
        heading: '3. Membaca Analisis Taktis & Replay 3D',
        body: 'Buka Detail Laga lalu pilih tab Analisis Taktis. Semua metrik berbasis literatur (Dominasi Sepertiga Akhir, Tinggi Blok Bertahan, 5 Koridor, Zona Tembakan, Momentum 15 Menit) serta Replay Visual 3D Perspektif otomatis tersusun dari catatan Anda. Anda juga dapat mengimpor berkas JSON hasil tracking eksternal.'
      },
      {
        heading: '4. Papan Taktik 3D & Laporan Cetak A4',
        body: 'Di menu Taktik, susun pergerakan pemain dengan sudut pandang 3D Perspektif dan Bayangan Posisi Awal. Setelah laga difinalkan, buka halaman Laporan untuk mencetak PDF A4 lengkap dengan rumus, rujukan ilmiah, dan sidik jari integritas SHA-256.'
      }
    ]
  },
  parent: {
    badge: 'Panduan Mode Orang Tua',
    title: 'Cara Memantau Perkembangan Anak',
    steps: [
      {
        heading: '1. Paspor Perkembangan Anak',
        body: 'Di halaman Paspor, Anda dapat memantau identitas atlet, radar atribut lapangan dari rubrik pelatih, catatan evaluasi resmi, dan hasil tes kebugaran fisik berkala.'
      },
      {
        heading: '2. Grafik Pertumbuhan & Kontrol Privasi',
        body: 'Buka menu Pertumbuhan di sidebar kiri untuk memantau kurva tinggi dan berat badan anak. Anda memegang kendali penuh untuk memberi atau mencabut izin visibilitas data anak kapan saja.'
      },
      {
        heading: '3. Kartu Perkembangan Siap Bagikan',
        body: 'Klik tombol Kartu Perkembangan untuk melihat dan mengunduh kartu ringkasan progres atlet bergaya matchday yang aman secara privasi. Untuk mengulang panduan ini nanti, buka menu Akun lalu pilih Ulangi Tutorial.'
      }
    ]
  },
  public: {
    badge: 'Panduan Mode Publik & Siswa',
    title: 'Selamat Datang di Paspor Talenta',
    steps: [
      {
        heading: '1. Profil & Evaluasi Lapangan',
        body: 'Halaman Paspor menampilkan ringkasan objektif atlet, atribut teknis dari penilaian pelatih, dan hasil uji kebugaran fisik tanpa skor peringkat buatan.'
      },
      {
        heading: '2. Pertumbuhan & Direktori Skuad',
        body: 'Gunakan menu Pertumbuhan untuk melihat perkembangan fisik berkala dan menu Skuad untuk menelusuri daftar atlet akademi yang berstatus publik.'
      },
      {
        heading: '3. Berpindah ke Mode Pelatih atau Orang Tua',
        body: 'Klik menu Akun di pojok kanan atas lalu pilih Masuk untuk mengakses fitur pencatatan laga, analisis taktis, atau kontrol privasi orang tua. Anda dapat memutar ulang panduan ini kapan saja lewat tombol Ulangi Tutorial di menu Akun.'
      }
    ]
  }
};

export default function RoleTutorialModal({ isOpen, userRole = 'public', onClose }) {
  const normalizedRole = userRole === 'admin' ? 'coach' : userRole === 'parent' ? 'parent' : userRole === 'coach' ? 'coach' : 'public';
  const config = STEPS_BY_ROLE[normalizedRole] || STEPS_BY_ROLE.public;
  const [stepIdx, setStepIdx] = useState(0);

  if (!isOpen) return null;

  const safeIdx = Math.min(stepIdx, config.steps.length - 1);
  const currentStep = config.steps[safeIdx];
  const isFirst = safeIdx === 0;
  const isLast = safeIdx === config.steps.length - 1;

  const handleComplete = () => {
    markRoleTutorialDone(normalizedRole);
    setStepIdx(0);
    onClose?.();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleComplete}
      title={config.title}
      description={`Langkah ${safeIdx + 1} dari ${config.steps.length}`}
      className="max-w-md"
    >
      <div className="space-y-4" data-testid="role-tutorial-modal">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand" size="sm">{config.badge}</Badge>
          <span className="text-sm font-mono text-2 tabular-nums">
            {safeIdx + 1} / {config.steps.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-app rounded-full overflow-hidden border border-line">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${Math.round(((safeIdx + 1) / config.steps.length) * 100)}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-4 rounded-control bg-app border border-line space-y-2">
          <div className="flex items-center gap-2 text-brand">
            <BookOpen className="w-4 h-4 shrink-0" />
            <h3 className="text-sm font-semibold text-1">{currentStep.heading}</h3>
          </div>
          <p className="text-sm text-2 leading-relaxed">{currentStep.body}</p>
        </div>

        <p className="text-sm text-2">
          Panduan ini hanya muncul otomatis saat pertama kali membuka mode ini. Anda dapat membukanya kembali kapan saja lewat tombol <strong>Ulangi Tutorial</strong> di menu Akun atau sidebar.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleComplete}
          >
            Lewati
          </Button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
              >
                Sebelumnya
              </Button>
            )}

            {isLast ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleComplete}
              >
                Selesai &amp; Mulai
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStepIdx((prev) => Math.min(config.steps.length - 1, prev + 1))}
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
