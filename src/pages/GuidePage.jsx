import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Timer,
  FileText,
  Compass,
  ClipboardEdit,
  ShieldCheck,
  Users,
  RotateCcw
} from 'lucide-react';
import Surface from '../components/ui/Surface';
import Button from '../components/ui/Button';
import { resetTourDone } from '../lib/tourStorage';

export default function GuidePage() {
  const navigate = useNavigate();

  const handleResetTour = () => {
    resetTourDone();
    navigate('/beranda', { state: { startTour: true } });
  };
  const sections = [
    {
      id: 'sebelum-laga',
      icon: <Calendar className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Sebelum laga: buat laga dan pilih pemain',
      description:
        'Buat rekaman pertandingan baru dengan mengisi lawan, tanggal, kompetisi, dan format lapangan. Pilih daftar pemain dari skuad yang ikut bertanding dan tentukan susunan pemain mula (starter).',
      linkTo: '/laga',
      linkLabel: 'Buka Laga'
    },
    {
      id: 'saat-laga',
      icon: <Timer className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Saat laga: Catat kejadian',
      description:
        'Catat kejadian pertandingan langsung per menit seperti umpan sukses, tembakan, tekel, intersep, dan pelanggaran. Kejadian tersimpan di antrean perangkat (offline-first) dan disinkronkan saat terhubung.',
      linkTo: '/laga',
      linkLabel: 'Catat Kejadian Laga'
    },
    {
      id: 'setelah-laga',
      icon: <FileText className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Setelah laga: Peta kejadian, Laporan, Kunci laporan dan pemeriksa',
      description:
        'Tinjau sebaran aksi pemain pada peta kejadian dan visualisasi umpan per zona. Laporan akhir merangkum metrik penguasaan dan keterlibatan pemain. Laporan dapat dikunci (final) bersama catatan pemeriksa resmi.',
      linkTo: '/laga',
      linkLabel: 'Lihat Laporan Laga'
    },
    {
      id: 'latihan',
      icon: <Compass className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Latihan: Papan taktik (skema ilustrasi buatan pelatih, perlu pemeriksa lain sebelum terbit)',
      description:
        'Rancang pergerakan formasi, lintasan bola, dan arah lari pemain di papan taktik interaktif. Setiap skema taktik merupakan ilustrasi buatan pelatih dan membutuhkan pemeriksa pelatih lain sebelum dapat diterbitkan.',
      linkTo: '/taktik',
      linkLabel: 'Buka Papan Taktik'
    },
    {
      id: 'penilaian-pemain',
      icon: <ClipboardEdit className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Penilaian pemain: Evaluasi, simpan draf, publikasikan',
      description:
        'Nilai enam atribut radar pembinaan (kecepatan, dribel, umpan, fisik, bertahan, menembak) serta hasil uji kebugaran fisik manual. Simpan kemajuan sebagai draf hingga siap dipublikasikan ke paspor pemain.',
      linkTo: '/skuad',
      linkLabel: 'Buka Direktori Evaluasi'
    },
    {
      id: 'privasi-anak',
      icon: <ShieldCheck className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title:
        'Privasi anak: status persetujuan wali, kartu perkembangan hanya bisa dibagikan bila persetujuan terbaru mencakup profil publik',
      description:
        'Status persetujuan wali mengatur visibilitas data atlet muda. Kartu perkembangan (Story Card) hanya dapat diunduh atau dibagikan apabila persetujuan terbaru mencakup izin profil publik. Pencatatan persetujuan oleh wali belum tersedia di versi ini.',
      note: 'Pencatatan persetujuan oleh wali belum tersedia di versi ini.',
      linkTo: '/skuad',
      linkLabel: 'Lihat Status di Skuad'
    },
    {
      id: 'peran-akses',
      icon: <Users className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Peran dan akses: pelatih, admin, orang tua, publik; mode demo tidak memerlukan akun',
      description:
        'Aplikasi menerapkan pemisahan peran: pelatih dan admin mengelola skuad, laga, taktik, dan evaluasi. Orang tua dan publik mengakses paspor talenta terverifikasi. Dalam mode demo, seluruh fitur pelatih dapat dicoba langsung tanpa akun.',
      linkTo: '/skuad',
      linkLabel: 'Jelajahi Skuad'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-1">
      {/* Header */}
      <section className="p-6 rounded-panel border border-line bg-panel space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand" strokeWidth={1.5} />
          <h1 className="text-xl sm:text-2xl font-bold text-1">Panduan Singkat</h1>
        </div>
        <p className="text-sm text-2 leading-relaxed">
          Panduan praktis penggunaan aplikasi pembinaan sepak bola usia muda BallR. Hanya memuat alur kerja dan fungsi yang tersedia secara nyata.
        </p>
      </section>

      {/* First-Run Tour Reset Card */}
      <section
        data-testid="guide-tour-section"
        className="p-5 rounded-panel border border-line bg-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-1">Tur Pengenalan Aplikasi</h2>
          <p className="text-sm text-2 leading-relaxed max-w-xl">
            Ikuti kembali tur pengenalan 4 langkah di beranda untuk memahami alur kerja pelatih dari awal.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={handleResetTour}
          className="min-h-[44px] shrink-0 font-medium"
          data-testid="reset-tour-btn"
        >
          Ulangi tur
        </Button>
      </section>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <Surface
            key={section.id}
            surface="raised"
            data-testid={`guide-section-${section.id}`}
            className="p-4 sm:p-5 rounded-panel border border-line space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-control bg-panel border border-line shrink-0 mt-0.5">
                {section.icon}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-brand">
                    Bagian {String.fromCharCode(97 + idx)}
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-1 leading-snug">
                    {section.title}
                  </h2>
                </div>
                <p className="text-sm text-2 leading-relaxed">
                  {section.description}
                </p>
                {section.note && (
                  <p className="text-sm text-brand font-medium pt-1">
                    {section.note}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                to={section.linkTo}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-control border border-line bg-panel text-1 hover:border-brand/40 hover:text-brand inline-flex items-center justify-center transition-colors select-none"
              >
                {section.linkLabel}
              </Link>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
