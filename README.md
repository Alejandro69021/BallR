# BallR — Pencatatan Pertandingan & Paspor Talenta Sepakbola Usia Muda

[![CI](https://github.com/Alejandro69021/BallR/actions/workflows/ci.yml/badge.svg)](https://github.com/Alejandro69021/BallR/actions/workflows/ci.yml)

Sistem pencatatan kejadian pertandingan dan paspor talenta sepakbola usia muda (kategori U-13 ke atas) berbasis peramban (*web-based*). Aplikasi berfokus pada kesederhanaan pencatatan di pinggir lapangan oleh pelatih, penyajian laporan deskriptif yang jujur tanpa rekaan angka, dan perlindungan privasi data atlet anak.

---

## Masalah yang Dijawab

Banyak akademi sepakbola usia muda di Indonesia masih mencatat kehadiran atlet, statistik laga, dan perkembangan fisik secara terfragmentasi menggunakan kertas, lembar sebar Excel, atau pesan grup WhatsApp yang rentan tercecer. Akibatnya, data riwayat anak sering hilang saat berganti pelatih atau klub, serta tidak ada bukti autentik mengenai menit bermain dan aksi pertandingan mereka. BallR menyediakan satu tempat terpadu untuk mencatat kejadian laga di pinggir lapangan, menghasilkan laporan pertandingan yang dapat dikunci secara kriptografis (*tamper-proof*), serta mengelola paspor perkembangan fisik dan evaluasi atlet yang terlindungi izin wali.

```
[TULIS RUMUSAN MASALAH & PERTANYAAN PENELITIAN DI SINI]
```

---

## Fitur yang Benar-Benar Ada

Fitur-fitur berikut telah diimplementasikan dalam kode sumber dan terhubung pada rute aktif (`src/routes.js` & `src/App.jsx`):

1. **Beranda Pelatih (`/`)**:
   - Kartu lanjutan laga terakhir (status Draf/Final, jumlah kejadian riil, dan alur bertahap).
   - Tindakan cepat untuk membuat laga baru dan lima kartu perintah kerja operasional akademi.
2. **Direktori Skuad (`/skuad`)**:
   - Daftar atlet akademi terdaftar dengan penyaringan berdasarkan posisi dan kelompok umur.
   - Penanda status izin persetujuan wali per atlet.
3. **Paspor Talenta Atlet (`/pemain/:publicId`)**:
   - Identitas atlet, usia kronologis, posisi bermain, dan catatan deskriptif pelatih.
   - Metrik kebugaran fisik objektif (sprint, Yo-Yo test) dan radar atribut kualitatif dari rubrik pelatih.
4. **Pemantauan Kematangan Fisik (`/pemain/:publicId/pertumbuhan`)**:
   - Grafik riwayat antropometri berkala (tinggi dan berat badan riil).
   - Panel kelompok kematangan tubuh berbasis metode estimasi non-invasif Khamis-Roche (1994).
5. **Daftar & Pembuatan Laga (`/laga`)**:
   - Registrasi pertandingan dengan pengisian lawan, tanggal, dan pemilihan format lapangan (dimensi otomatis disesuaikan).
6. **Pencatat Laga di Pinggir Lapangan (`/pencatatan/:matchId`)**:
   - Papan sentuh cepat (*fast tactile keypad*) satu jempol untuk mencatat aksi (umpan, tembakan, tekel, intersep, dll.) per menit.
   - Bekerja secara *offline-first* dengan antrean keluar (*outbox queue*).
   - **Sinkronisasi Video Lokal**: Pemutar video langsung dari berkas di perangkat pengguna dengan pengaturan *offset* waktu sepak-mula (*kickoff*) per babak.
7. **Detail Laga & Peta Interaktif (`/laga/:matchId`)**:
   - Panel panduan langkah berikutnya (*NextStepPanel*) berbasis tahapan status laga.
   - Ringkasan jumlah kejadian menurut jenis aksi dan daftar keterlibatan pemain.
   - Peta lapangan interaktif: mode penanda aksi titik, aliran garis umpan, dan visualisasi kepadatan zona (6×3).
8. **Laporan Pertandingan Terkunci (`/laga/:matchId/laporan`)**:
   - Laporan kaku 9 bagian siap cetak A4.
   - Fitur penguncian laporan (*freeze*) dengan penugasan staf pemeriksa independen dan kalkulasi *hash* kanonikal SHA-256.
9. **Verifikasi Integritas Data (`/verifikasi/:hash`)**:
   - Audit keaslian sertifikat dan laporan pertandingan menggunakan *hash* kriptografis SHA-256 tanpa memperlihatkan rahasia internal.
10. **Papan Skenario Taktik (`/taktik` & `/taktik/:id`)**:
    - Papan formasi interaktif multi-bingkai (*frame animation*) dengan rujukan literatur taktis.
11. **Evaluasi Pelatih (`/penilaian/:playerId`)**:
    - Instrumen pengisian rapor perkembangan atlet berbasis rubrik deskriptif.
12. **Pusat Bantuan & Glosarium (`/bantuan` & `/rujukan`)**:
    - Tur pengenalan pertama kali (*WelcomeTour*), glosarium istilah ramah pelatih, dan daftar rujukan pustaka ilmiah terverifikasi.

---

## Belum Ada / Di Luar Cakupan

Fitur-fitur berikut **tidak ada** dan belum dibangun di repositori ini:
- **Backend Produksi Siap Pakai**: Belum ada *deployment* backend terkelola yang daring untuk publik.
- **Portal Mandiri Persetujuan Wali**: Alur login dan persetujuan digital mandiri dari gawai orang tua belum tersedia (saat ini pengelolaan status izin masih melalui dialog internal pelatih).
- **Unggah Video ke Server / Cloud**: Berkas video rekaman pertandingan tidak pernah diunggah ke server; video diputar secara lokal dari memori perangkat pengguna.
- **Analisis Video Otomatis / Computer Vision (CV)**: Tidak ada pelacakan optik otomatis terhadap pemain atau bola; seluruh kejadian dicatat manual oleh pengguna.
- **Prediksi Tinggi Dewasa Final**: Belum aktif menghitung sentimeter tinggi dewasa karena membutuhkan tinggi kedua orang tua kandung dan tabel koefisien primer Khamis-Roche.

---

## Status Sistem & Validasi

- **Mode Demonstrasi (`VITE_DEMO_MODE=true`)**: Berjalan mandiri langsung di peramban menggunakan data contoh fiktif (`src/data/mockData.js`) dan penyimpanan peramban lokal (`localStorage`).
- **Mode Riil Supabase (`VITE_DEMO_MODE=false`)**: Menghubungkan aplikasi ke API Supabase Postgres.
- **Status Pengujian Keamanan RLS**: Skrip kebijakan *Row Level Security* (RLS) tersedia di direktori `supabase/migrations/`, namun **belum pernah diuji atau diaudit pada proyek Supabase produksi yang berjalan langsung**.
- **Status Kebijakan Privasi Data**: Teks tata kelola persetujuan wali mengacu pada prinsip UU PDP No. 27/2022 Pasal 25, namun dokumen di `docs/CONSENT_DRAFT.md` masih berstatus **draf awal** dan belum melalui tinjauan penasihat hukum (*legal review*).

---

## Prinsip Kejujuran Data (*Data Honesty*)

BallR mematuhi aturan ketat dalam antarmuka dan visualisasi data:
1. **Tanpa Skor Gabungan & Peringkat Anak**: Tidak ada peringkat keseluruhan (*Overall / OVR*), tier bintang, atau pelabelan "pemain terbaik/terburuk" bagi atlet usia muda.
2. **Kuantitas Mentah Diutamakan**: Seluruh statistik diawali dengan jumlah frekuensi kejadian mentah disertai jumlah sampel ($n$).
3. **Batas Sampel Kecil (`SMALL_SAMPLE_N`)**: Rasio atau persentase baru ditampilkan jika data mencapai minimal $n \ge 10$ kejadian. Jika kurang, antarmuka menegaskan bahwa data masih terbatas.
4. **Status Kosong Jujur**: Menampilkan tulisan "Belum ada data" secara gamblang tanpa membuat perkiraan palsu.

---

## Cara Menjalankan

### Prasyarat
- Node.js versi 22 atau lebih baru
- npm

### 1. Pemasangan Ketergantungan
```bash
npm install
```

### 2. Konfigurasi Lingkungan
Buat berkas `.env.local` atau `.env` di akar repositori:
```bash
# Untuk menjalankan langsung tanpa database (Mode Demo Lokal)
VITE_DEMO_MODE=true

# Jika menggunakan database Supabase riil
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Menjalankan Aplikasi
```bash
# Menjalankan server pengembangan
npm run dev

# Menjalankan pemeriksaan linter (Oxlint)
npm run lint

# Menjalankan seluruh pengujian unit & integrasi (Vitest)
npm test -- --run

# Menjalankan build produksi (Vite)
npm run build
```

---

## Struktur Direktori

```
BallR/
├── .github/
│   └── workflows/ci.yml          # Otomasi pengujian & build GitHub Actions
├── docs/                         # Dokumentasi arsitektur, glosarium, dan draf hukum
│   ├── AUDIT.md                  # Catatan audit historis
│   ├── CONSENT_DRAFT.md          # Draf naskah persetujuan wali (UU PDP)
│   ├── DESIGN.md                 # Prinsip desain sistem
│   ├── GLOSSARY.md               # Glosarium istilah ramah pelatih
│   ├── REFERENCES_SEED.md        # Rujukan ilmiah awal
│   ├── SECURITY.md               # Kebijakan pelaporan keamanan
│   ├── UX_SPEC.md                # Spesifikasi antarmuka dan alur kerja
│   └── VIDEO_INTEGRATION.md      # Panduan teknis penautan video lokal
├── public/                       # Berkas statis publik & manifest PWA
├── src/
│   ├── components/               # Komponen antarmuka modular
│   │   ├── assessment/           # Rapor & instrumen evaluasi pelatih
│   │   ├── auth/                 # Modal otentikasi peran pelatih (PIN Guard)
│   │   ├── growth/               # Kartu kematangan fisik & tabel antropometri
│   │   ├── logger/               # Tombol pencatat cepat pinggir lapangan
│   │   ├── match/                # Peta kejadian laga & visualisasi zona
│   │   ├── matches/              # Dialog & daftar laga
│   │   ├── references/           # Kartu anjuran pustaka terverifikasi
│   │   ├── squad/                # Kartu atlet direktori skuad
│   │   ├── story/                # Generator ekspor kartu visual paspor
│   │   ├── tactics/              # Papan skenario formasi taktik
│   │   ├── ui/                   # Komponen primitif antarmuka (Button, Dialog, Table, dll.)
│   │   ├── ux/                   # Komponen pengalaman pelatih (StageStepper, NextStepPanel, Term)
│   │   └── video/                # Pemutar video lokal perangkat
│   ├── context/                  # State manajemen global (PlayersContext)
│   ├── data/                     # Data contoh demonstrasi (mockData.js) & rujukan riset
│   ├── hooks/                    # Kumpulan custom hooks (usePlayers)
│   ├── lib/                      # Utilitas murni kalkulasi, integrasi Supabase, dan hash
│   ├── pages/                    # Komponen halaman rute aktif
│   └── test/                     # Berkas pengujian unit dan integrasi
└── supabase/
    └── migrations/               # Naskah migrasi basis data SQL PostgreSQL
```

---

## Daftar Migrasi Basis Data (`supabase/migrations/`)

1. `001_initial_schema_and_roles.sql`: Skema dasar tabel pemain, akademi, antropometri berkala, penilaian pelatih, dan penetapan peran pengguna.
2. `002_row_level_security.sql`: Kebijakan *Row Level Security* (RLS) pemisahan hak akses publik, wali murid, pelatih, dan admin.
3. `005_credible_references_and_rubric.sql`: Skema tabel repositori rujukan ilmiah terverifikasi dan rubrik evaluasi kualitatif pelatih.
4. `006_security_hardening.sql`: Pengerasan fungsi verifikasi paspor atlet kanonikal dan proteksi terhadap enumerasi data identitas.
5. `007_matches_and_tactics.sql`: Tabel pertandingan, kejadian aksi (*events*), daftar partisipan, dan papan skenario taktik.
6. `008_report_snapshots.sql`: Tabel penyimpanan dokumen laporan laga terkunci dan fungsi RPC verifikasi integritas *hash* SHA-256.
7. `009_ppda_reference.sql`: Metadata rujukan ilmiah metrik *Passes Allowed per Defensive Action* (PPDA, Trainor 2014).
8. `010_event_video_time.sql`: Penambahan kolom `video_time_s` pada kejadian laga untuk penandaan stempel waktu video lokal.

---

## Keterbatasan Sistem

- **Tergantung Ketelitian Pelatih**: Seluruh data aksi pertandingan berasal dari ketukan manual pelatih saat laga berlangsung atau saat memutar ulang rekaman; galat manusia dalam menentukan detik dan lokasi kejadian tidak dapat dihindari sepenuhnya.
- **Kapasitas Penyimpanan Browser**: Dalam mode demo, data tersimpan di `localStorage` peramban yang dapat hilang jika pengguna menghapus cache peramban atau berpindah perangkat.
- **Video Tetap di Perangkat Pengguna**: Tautan berkas video menggunakan URL objek sementara (`blob:`) atau penandaan berkas lokal, sehingga berkas video tidak berpindah secara otomatis bila akun dibuka dari gawai lain.
