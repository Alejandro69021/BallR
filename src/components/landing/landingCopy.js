/**
 * Sumber tunggal salinan teks (single source of truth for landing copy).
 * Diekspor sebagai objek polos agar dapat dipindai oleh tes klaim data otomatis (LP-3).
 * Sesuai teks docs/LANDING_SPEC.md bagian 4.
 */

export const landingCopy = {
  header: {
    navLinks: [
      { href: '#fitur', label: 'Fitur' },
      { href: '#cara-kerja', label: 'Cara kerja' },
      { href: '#prinsip', label: 'Prinsip' },
      { href: '#status', label: 'Status' },
      { href: '#tanya', label: 'Tanya jawab' }
    ],
    cta: {
      signIn: 'Masuk',
      openApp: 'Buka aplikasi',
      tryDemo: 'Coba demo',
      requestTrial: 'Minta akses uji coba',
      contactDev: 'Hubungi pengembang'
    }
  },

  hero: {
    pill: 'Akademi sepak bola usia muda · U-13 ke atas',
    titlePrefix: 'Catat laganya. Bangun ',
    titleHighlight: 'paspor',
    titleSuffix: ' pemainnya.',
    paragraph:
      'Catat kejadian laga dari pinggir lapangan, simpan riwayat perkembangan tiap anak, lalu hasilkan laporan yang bisa dikunci dan diperiksa keasliannya. Tanpa peringkat untuk anak, tanpa angka karangan.',
    ctaDemo: 'Coba demo',
    ctaFeatures: 'Lihat fitur',
    notes: [
      'Demo memakai data fiktif',
      'Jalan di peramban HP dan laptop',
      'Belum ada biaya: tahap uji coba'
    ],
    stampText: 'Data contoh fiktif',
    imageAlt: 'Tangkapan layar Beranda ProspekBola dalam mode demo',
    imageWidth: 1200,
    imageHeight: 750,
    imageSrc: '/landing/hero-beranda.jpg',
    principlesStrip: [
      'Tanpa peringkat untuk anak',
      'Angka mentah dulu',
      '"Belum ada data" bila kosong',
      'Laporan bisa diperiksa'
    ]
  },

  problem: {
    heading: 'Catatan akademi sering tercecer.',
    intro:
      'Kehadiran, statistik laga, dan perkembangan fisik anak biasanya tersebar. Saat pelatih atau klub berganti, riwayatnya ikut hilang.',
    cards: [
      {
        title: 'Kertas dan Excel',
        desc: 'Lembar yang berbeda di tiap pelatih, sulit digabung, mudah hilang.'
      },
      {
        title: 'Grup WhatsApp',
        desc: 'Catatan laga terkubur di antara pesan lain dan tidak bisa dicari ulang.'
      },
      {
        title: 'Riwayat ikut pergi',
        desc: 'Ganti pelatih atau klub, data perkembangan anak ikut terputus.'
      }
    ]
  },

  featureDive: {
    heading: 'Tiga hal yang dikerjakan ProspekBola dengan baik.',
    intro:
      'Semua yang tampil di bawah sudah berjalan di aplikasi hari ini. Gambar adalah tangkapan layar nyata dengan data contoh fiktif.',
    items: [
      {
        num: '01',
        tag: 'Saat laga',
        title: 'Catat langsung dari pinggir lapangan',
        body: 'Papan sentuh yang cukup dipakai satu jempol: umpan, tembakan, tekel, intersep, dan aksi lain dicatat per menit. Video laga bisa diputar dari perangkatmu untuk menyamakan menit kejadian. Videonya tidak diunggah ke mana pun.',
        bullets: [
          'Stopwatch laga dan penanda babak',
          'Sumber waktu ditandai jelas: video atau stopwatch',
          'Dirancang tetap bisa mencatat tanpa sinyal (belum diuji di lapangan)'
        ],
        desktopImage: {
          src: '/landing/pencatat-desktop.jpg',
          alt: 'Tangkapan layar Pencatat Laga ProspekBola pada layar laptop',
          width: 1200,
          height: 750
        },
        mobileImage: {
          src: '/landing/pencatat-mobile.jpg',
          alt: 'Tangkapan layar Pencatat Laga pada layar HP 390px',
          width: 390,
          height: 780
        }
      },
      {
        num: '02',
        tag: 'Setelah laga',
        title: 'Pahami laga setelah peluit akhir',
        body: 'Ringkasan jumlah kejadian menurut jenis, daftar kejadian per menit, dan peta lapangan dengan penanda aksi, alur umpan, serta kepadatan per zona (6×3).',
        bullets: [
          'Setiap angka disertai jumlah kejadian (n)',
          'Langkah berikutnya selalu ditunjukkan di layar',
          'Laporan 9 bagian siap cetak A4'
        ],
        desktopImage: {
          src: '/landing/detail-laga.jpg',
          alt: 'Tangkapan layar ringkasan detail laga dan peta sebaran aksi',
          width: 1200,
          height: 750
        }
      },
      {
        num: '03',
        tag: 'Antar musim',
        title: 'Paspor perkembangan untuk setiap pemain',
        body: 'Identitas, posisi, tes kebugaran, riwayat tinggi dan berat badan, serta rapor evaluasi pelatih dikumpulkan dalam satu paspor. Tidak lagi tercecer di kertas dan grup WhatsApp.',
        bullets: [
          'Kelompok kematangan tubuh: estimasi non-invasif, bukan diagnosis',
          'Atribut dinilai dengan rubrik deskriptif, tanpa peringkat',
          'Paspor bisa dicetak dan keasliannya diperiksa'
        ],
        desktopImage: {
          src: '/landing/paspor-pertumbuhan.jpg',
          alt: 'Tangkapan layar paspor perkembangan dan antropometri pemain',
          width: 1200,
          height: 750
        }
      }
    ]
  },

  featureGrid: {
    heading: 'Dan fitur pendukung lainnya',
    cards: [
      {
        title: 'Papan taktik',
        desc: 'Susun formasi dan gerakan pemain dalam beberapa bingkai, lengkap dengan rujukan literatur, lalu cetak.'
      },
      {
        title: 'Laporan terkunci',
        desc: 'Kunci laporan dengan sidik digital SHA-256, lalu periksa ulang kapan saja bahwa isinya tidak berubah.'
      },
      {
        title: 'Direktori skuad',
        desc: 'Daftar atlet dengan pencarian nama, filter posisi, pengurutan data, dan status rapor draf atau diterbitkan.'
      },
      {
        title: 'Evaluasi pelatih',
        desc: 'Rapor berbasis rubrik deskriptif untuk atribut teknis, disimpan sebagai draf atau diterbitkan.'
      },
      {
        title: 'Tes kebugaran',
        desc: 'Lompat vertikal, sprint 20 m dengan stopwatch, shuttle run, dan Yo-Yo, lengkap dengan perubahan dari bulan lalu.'
      },
      {
        title: 'Panduan dan rujukan',
        desc: 'Tur pengenalan, glosarium istilah ramah pelatih, dan daftar pustaka ilmiah.'
      }
    ]
  },

  steps: {
    heading: 'Dari kick-off sampai laporan, empat langkah.',
    steps: [
      {
        step: '1',
        title: 'Buat laga',
        desc: 'Catat lawan, tanggal, dan ukuran lapangan.'
      },
      {
        step: '2',
        title: 'Catat kejadian',
        desc: 'Ketuk aksi saat laga berjalan, atau sambil memutar video laga dari perangkatmu.'
      },
      {
        step: '3',
        title: 'Selesaikan laga',
        desc: 'Isi skor akhir. Setelah itu catatan laga terkunci dan tidak bisa diubah.'
      },
      {
        step: '4',
        title: 'Buat laporan',
        desc: 'Laporan dibuat dari catatan yang sudah terkunci.'
      }
    ]
  },

  principles: {
    heading: 'Jujur dengan data, terutama data anak.',
    cards: [
      {
        title: 'Tanpa peringkat untuk anak',
        desc: 'Tidak ada skor total atau peringkat menyeluruh seperti gim konsol. Atlet usia muda berkembang dengan kecepatan berbeda.'
      },
      {
        title: 'Angka mentah dulu',
        desc: 'Persentase hanya dihitung bila sampel minimal (n ≥ 10) terpenuhi. Bila data sedikit, kami hanya tampilkan hitungan kejadian apa adanya.'
      },
      {
        title: '"Belum ada data" bila kosong',
        desc: 'Bila data belum pernah dicatat, sistem menulis "Belum ada data", bukan angka nol yang menyesatkan.'
      },
      {
        title: 'Laporan yang bisa diperiksa',
        desc: 'Setiap laporan terkunci memuat hash integritas dan harus diperiksa oleh staf pelatih lain bila akademi memiliki lebih dari satu staf.'
      }
    ]
  },

  status: {
    heading: 'Di mana posisi ProspekBola hari ini.',
    columns: [
      {
        title: 'Ada hari ini',
        badge: 'Ada hari ini',
        items: [
          'Pencatat laga langsung dengan stopwatch',
          'Penandaan video lokal (tanpa unggah)',
          'Peta sebaran aksi dan peta zona 6×3',
          'Paspor perkembangan dan kurva tinggi/berat',
          'Kelompok kematangan tubuh (Khamis-Roche)',
          'Papan taktik dengan bingkai gerak dan cetak',
          'Laporan pertandingan terkunci dan cetak A4',
          'Verifikasi hash integritas paspor'
        ]
      },
      {
        title: 'Sedang disiapkan',
        badge: 'Sedang disiapkan',
        items: [
          'Server produksi dan pengujian keamanan akses data',
          'Portal persetujuan wali oleh orang tua',
          'Tinjauan hukum atas naskah persetujuan (UU PDP)',
          'Pengujian langsung di pinggir lapangan'
        ]
      },
      {
        title: 'Belum ada',
        badge: 'Belum ada',
        items: [
          'Unggah video ke server',
          'Analisis video otomatis (semua kejadian dicatat manual oleh pelatih)',
          'Perkiraan tinggi dewasa',
          'Peringkat atlet'
        ]
      }
    ]
  },

  faq: {
    heading: 'Tanya jawab',
    items: [
      {
        q: 'Berapa biaya menggunakan ProspekBola?',
        a: 'Belum ada harga. ProspekBola masih tahap uji coba dan belum menjual langganan. Kami mencari akademi yang mau mencoba bersama pelatihnya, sambil tetap memakai data contoh sampai keamanan datanya siap.'
      },
      {
        q: 'Bagaimana keamanan dan privasi data anak?',
        a: 'Data anak nyata belum diterima. Seluruh data di demo adalah fiktif dan hanya tersimpan di peramban lokal perangkatmu. Pengujian keamanan akses data, portal persetujuan wali, dan peninjauan hukum atas naskah persetujuan masih disiapkan sebelum data nyata dapat dicatat.'
      },
      {
        q: 'Apakah butuh koneksi internet di lapangan?',
        a: 'Aplikasi dirancang offline-first dengan antrean lokal, sehingga pencatatan laga tetap dapat berlangsung tanpa internet. Namun, fitur ini belum diuji langsung di lapangan sesungguhnya.'
      },
      {
        q: 'Apakah aplikasi ini menebak data atau menganalisis video secara otomatis?',
        a: 'Belum. Semua kejadian dicatat manual oleh pelatih dari apa yang terjadi di lapangan. Video hanya diputar dari perangkat untuk menyamakan menit kejadian.'
      },
      {
        q: 'Berapa rentang usia atlet yang didukung?',
        a: 'Dirancang untuk akademi U-13 ke atas.'
      }
    ]
  },

  cta: {
    heading: 'Ingin mencoba di akademimu?',
    desc: 'ProspekBola masih tahap uji coba dan belum menjual langganan. Kami mencari akademi yang mau mencoba bersama pelatihnya, sambil tetap memakai data contoh sampai keamanan datanya siap.',
    ctaDemo: 'Coba demo',
    contactPrefix: 'Hubungi: ',
    contactFallback: 'Hubungi pengembang'
  },

  footer: {
    note: 'Di demo, semua data fiktif dan hanya tersimpan di peramban kamu.',
    links: [
      { href: '/bantuan', label: 'Panduan' },
      { href: '/rujukan', label: 'Rujukan' },
      { href: '/privasi', label: 'Kebijakan privasi (draf)' }
    ],
    contactLabel: 'Kontak',
    copyrightSuffix: '.'
  }
};
