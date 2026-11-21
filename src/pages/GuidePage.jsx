import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Timer,
  FileText,
  Compass,
  ClipboardEdit,
  ShieldCheck,
  Users
} from 'lucide-react';
import Surface from '../components/ui/Surface';

export default function GuidePage() {
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
      title: 'Setelah laga: Peta kejadian, Laporan, Bekukan laporan dan peninjau',
      description:
        'Tinjau distribusi aksi pemain pada peta kejadian dan visualisasi umpan per zona. Laporan akhir merangkum metrik penguasaan dan keterlibatan pemain. Laporan dapat dibekukan (final) bersama catatan peninjau resmi.',
      linkTo: '/laga',
      linkLabel: 'Lihat Laporan Laga'
    },
    {
      id: 'latihan',
      icon: <Compass className="w-5 h-5 text-brand shrink-0" strokeWidth={1.5} />,
      title: 'Latihan: Papan taktik (skema ilustrasi buatan pelatih, perlu peninjau lain sebelum terbit)',
      description:
        'Rancang pergerakan formasi, lintasan bola, dan arah lari pemain di papan taktik interaktif. Setiap skema taktik merupakan ilustrasi buatan pelatih dan membutuhkan peninjau pelatih lain sebelum dapat diterbitkan.',
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12 text-1">
      {/* Header */}
      <section className="p-6 rounded-panel border border-line bg-panel space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand" strokeWidth={1.5} />
          <h1 className="text-xl sm:text-2xl font-bold text-1">Panduan Singkat</h1>
        </div>
        <p className="text-xs sm:text-sm text-2 leading-relaxed">
          Panduan praktis penggunaan aplikasi pembinaan sepak bola usia muda BallR. Hanya memuat alur kerja dan fungsi yang tersedia secara nyata.
        </p>
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
                  <span className="text-xs font-mono font-semibold text-brand">
                    Bagian {String.fromCharCode(97 + idx)}
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-1 leading-snug">
                    {section.title}
                  </h2>
                </div>
                <p className="text-xs text-2 leading-relaxed">
                  {section.description}
                </p>
                {section.note && (
                  <p className="text-xs text-brand font-medium pt-1">
                    {section.note}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                to={section.linkTo}
                className="min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium rounded-control border border-line bg-panel text-1 hover:border-brand/40 hover:text-brand inline-flex items-center justify-center transition-colors select-none"
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
