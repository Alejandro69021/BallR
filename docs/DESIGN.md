# BallR (ProspekBola) — Design System & Technical Report Specification

> **Tujuan**: Menghadirkan antarmuka yang tenang, kredibel, dan berbasis data ilmiah (*sports-science technical report*), bukan *gaming HUD* atau kartu futsal neon.

---

## 1. Arsitektur Dua Permukaan (*Two Surfaces, One Token Set*)

Aplikasi menggunakan satu sistem token yang membedakan dua permukaan konteks penggunaan:
1. **Dossier Surface** (Laman Paspor Atlet / Publik / Pemandu Bakat):
   - Latar kertas terang (*paper light*), siap cetak (*print-ready* A4), menyajikan laporan teknis resmi federasi.
2. **Workspace Surface** (Laman Skuad, Evaluasi Pelatih, Pencatatan Laga, Analisis Taktis):
   - Latar netral gelap (*dark neutral*), dirancang untuk sesi kerja panjang pelatih di tepi lapangan (*pitch side*) dengan tablet di bawah sinar maupun redup.

---

## 2. Token Warna & Uji Kontras (WCAG AA >= 4.5:1)

Semua token didefinisikan sebagai variabel CSS pada `src/index.css` via Tailwind 4 `@theme`. **Tidak ada nilai hex hard-coded pada komponen.**

### A. Dark Workspace Tokens
| Token CSS | Nilai Hex | Peruntukan |
|---|---|---|
| `--color-dark-bg` | `#0B0F14` | Latar kanvas utama workspace |
| `--color-dark-surface` | `#11161D` | Panel, bar navigasi, kartu datar |
| `--color-dark-raised` | `#1A212B` | Kontrol interaktif, popover, header tabel |
| `--color-dark-line` | `#2C3643` | Garis batas 1px (hairline border) |
| `--color-dark-text-1` | `#E8ECF1` | Teks utama, judul, angka |
| `--color-dark-text-2` | `#9AA6B5` | Teks sekunder, label kolom, unit metrik |
| `--color-brand-dark` | `#4FB286` | Aksen tunggal hijau lapangan (dark surface) |

### B. Paper Dossier Tokens
| Token CSS | Nilai Hex | Peruntukan |
|---|---|---|
| `--color-paper-bg` | `#F6F4EF` | Latar kanvas paspor cetak |
| `--color-paper-surface` | `#FFFFFF` | Panel laporan, lembar dossier |
| `--color-paper-line` | `#DAD6CC` | Garis pemisah 1px dokumen |
| `--color-paper-text-1` | `#14181F` | Teks utama dokumen teknis |
| `--color-paper-text-2` | `#4A5360` | Metadata dokumen, catatan kaki, label |
| `--color-brand-paper` | `#2E7D5B` | Aksen tunggal hijau lapangan (paper surface) |

### C. Semantic Status (Hanya untuk Status & Peringatan — Bukan Dekorasi)
| Peran Semantik | Dark Surface | Paper Surface | Catatan Kontras |
|---|---|---|---|
| **Warning / Status Tertunda** | `#C98A1B` (6.53:1) | `#8A5B00` (5.26:1) | Di paper memakai `#8A5B00` agar lulus 4.5:1 |
| **Danger / Error / Batas** | `#E06D66` (5.24:1) | `#C2453D` (4.99:1) | Di dark memakai `#E06D66` agar lulus 4.5:1 |
| **Success / Valid** | `#4FB286` (7.36:1) | `#2E7D5B` (4.55:1) | Menggunakan brand green resmi |

### D. Data Series Okabe-Ito (Colour-Blind Safe)
Semua diagram taktis dan perkembangan fisik menggunakan palet universal Okabe-Ito. Setiap seri **wajib** dipadukan dengan label tekstual atau bentuk penanda (*marker shape*):
1. `#0072B2` (Biru Tua) — Bentuk penanda: Lingkaran (`●`)
2. `#E69F00` (Oranye) — Bentuk penanda: Kotak (`■`)
3. `#009E73` (Hijau Kebiruan) — Bentuk penanda: Segitiga (`▲`)
4. `#D55E00` (Merah Vermilion) — Bentuk penanda: Belah Ketupat (`◆`)
5. `#CC79A7` (Merah Muda Ungu) — Bentuk penanda: Garis Putus-putus (`---`)

### E. Bukti Uji Kontras Otomatis
Hasil uji rasio kontras terhadap standar WCAG AA (>= 4.5:1):
```
Dark bg (#0B0F14) & text-1 (#E8ECF1)       : 16.20:1 [PASS]
Dark bg (#0B0F14) & text-2 (#9AA6B5)       :  7.78:1 [PASS]
Dark surface (#11161D) & text-1 (#E8ECF1)  : 15.31:1 [PASS]
Dark surface (#11161D) & text-2 (#9AA6B5)  :  7.35:1 [PASS]
Dark raised (#1A212B) & text-1 (#E8ECF1)   : 13.65:1 [PASS]
Dark bg (#0B0F14) & brand (#4FB286)        :  7.36:1 [PASS]
Paper bg (#F6F4EF) & text-1 (#14181F)      : 16.19:1 [PASS]
Paper bg (#F6F4EF) & text-2 (#4A5360)      :  7.08:1 [PASS]
Paper surface (#FFFFFF) & text-1 (#14181F) : 17.79:1 [PASS]
Paper surface (#FFFFFF) & text-2 (#4A5360) :  7.79:1 [PASS]
Paper bg (#F6F4EF) & brand (#2E7D5B)       :  4.55:1 [PASS]
Paper surface (#FFFFFF) & brand (#2E7D5B)  :  5.00:1 [PASS]
```

---

## 3. Tipografi & Self-Hosting

### A. Penghapusan Google Fonts Eksternal
- Tag `<link>` Google Fonts di `index.html` dihapus sepenuhnya.
- Dipasang paket font offline mandiri:
  - `@fontsource/ibm-plex-sans` (UI & isi laporan)
  - `@fontsource/ibm-plex-mono` (Angka tabular, ID paspor, hash, metrik)
- **Privasi & Offline**: Tidak ada kebocoran metadata IP atau permintaan HTTP ke peladen Google pihak ketiga saat digunakan offline.

### B. Skala Tipografi
- **Ukuran**: `12px` (keterangan, label tabel), `14px` (isi teks baku), `16px` (subjudul, penekanan), `20px` (judul bagian), `28px` (judul dokumen paspor).
- **Format Angka**: Seluruh angka menggunakan properti CSS `font-variant-numeric: tabular-nums` agar sejajar vertikal pada tabel dan ringkasan metrik.
- **Kapitalisasi**: *Sentence case* untuk semua heading dan tombol. *Letter-spaced uppercase* hanya diizinkan untuk label kolom tabel dengan ukuran `<= 11px`.

---

## 4. Bentuk, Kisi & Gerakan (*Shape, Grid & Motion*)

1. **Bentuk & Radius**:
   - Kontrol (tombol, input, pill): `rounded-[6px]` (radius 6px).
   - Panel & lembar dokumen: `rounded-[8px]` (radius 8px).
   - Batas: Garis tegas 1px (*hairline*), tanpa *card-in-card-in-card*.
2. **Bayangan (*Shadows*)**:
   - Dilarang menggunakan `shadow-2xl`, *neon glow*, atau bayangan berlapis.
   - Hanya 1 bayangan halus yang diizinkan: popover/dialog dropdown (`box-shadow: 0 4px 12px rgba(0,0,0,0.15)`).
3. **Kisi & Tata Letak**:
   - Basis kisi 8pt (`gap-2`, `gap-4`, `p-4`, `p-6`).
   - Lebar konten maksimum: `1120px` terpusat.
   - Desktop: 12-kolom responsif.
   - Ponsel: Kolom tunggal ergonomis.
4. **Gerakan (*Motion*)**:
   - Maksimal durasi `150ms ease-out` hanya untuk *hover*, *focus*, dan buka-tutup ekspansi.
   - Menghapus keyframe `pulseGlow`, `glow-volt`, `animate-bounce`, dan dekorasi animasi berdenyut.
   - Mendukung penuh kueri media `@media (prefers-reduced-motion: reduce)`.

---

## 5. Komponen UI Mandiri (`src/components/ui/`)

Semua komponen dasar dibangun sekali di `src/components/ui/` dan dipakai ulang di seluruh aplikasi:

| Nama Komponen | Berkas | Fungsi & Spesifikasi Teknis |
|---|---|---|
| `Button` | `ui/Button.jsx` | Varian: `primary` (brand), `secondary` (surface), `danger` (semantic), `ghost`. Ukuran `sm` (32px), `md` (38px). Radius 6px. |
| `IconButton` | `ui/IconButton.jsx` | Tombol khusus ikon dengan `aria-label` wajib, ukuran 32x32px, stroke 1.5. |
| `Field` | `ui/Field.jsx` | Label teks, input field, pesan bantuan (*helper*), dan pesan error validasi. |
| `Select` | `ui/Select.jsx` | Kontrol dropdown dapat diakses keyboard, radius 6px, border 1px. |
| `Tabs` | `ui/Tabs.jsx` | Daftar tab dengan penanda garis bawah (*active underline*) 2px warna brand, navigasi tombol panah keyboard. |
| `Table` | `ui/Table.jsx` | Tabel data padat, header lengket (*sticky header*), kolom dapat diurutkan (*sortable*), angka tabular otomatis. |
| `Stat` | `ui/Stat.jsx` | Format nilai metrik terstruktur: `Nilai` + `Satuan` + `Tanggal Pengujian` + `Jumlah Sampel (n)`. |
| `Badge` | `ui/Badge.jsx` | Tag status non-dekoratif: `neutral`, `brand`, `warning`, `danger`. |
| `Dialog` | `ui/Dialog.jsx` | Modal dialog dengan *focus trap*, tombol Esc, `aria-modal="true"`. |
| `Toast` | `ui/Toast.jsx` | Notifikasi umpan balik aksi pelatih, posisi bawah kanan, kontras tinggi. |
| `EmptyState` | `ui/EmptyState.jsx` | Tampilan saat data kosong: ikon teknis, deskripsi satu kalimat, tombol tindakan. |
| `Skeleton` | `ui/Skeleton.jsx` | Indikator muat data statis/halus tanpa kilatan neon. |
| `SourceNote` | `ui/SourceNote.jsx` | Catatan atribusi wajib: `"Sumber: [Metode/Pustaka] · [Tanggal] · [Sampel n=...]"`. |
| `PitchSvg` | `ui/PitchSvg.jsx` | Representasi vektor 2D lapangan bola bersih (rasio standar IFAB) untuk penempatan visualisasi fase 5. |

---

## 6. Rencana Perubahan Laman per Laman (*Screen Changes*)

### A. Paspor Atlet (Dossier Mode — Kertas Terang `#F6F4EF` / `#FFFFFF`)
- **Sebelum**: Kartu emas FIFA EA Sports, teks "Top Tier Growth Acceleration", badge OVR rating besar bergaya gim, latar hitam pekat bercahaya volt.
- **Sesudah**:
  - Header identitas resmi akademi dan foto atlet formal.
  - Ringkasan 5-baris terstruktur: Posisi, Kelompok Usia, Periode Evaluasi Terakhir, 3 Indikator Utama (Umpan, Kecepatan, Kontrol), Tanggal Tes Kebugaran Terakhir.
  - Bagian detail disusun sebagai seksi teks dan tabel laporan teknis bergaris batas 1px datar, bukan kartu bertumpuk (*no nested cards*).
  - Hapus badge OVR dan jargon gim. Angka disajikan bersama unit dan tanggal tes.

### B. Hub Skuad (Workspace Mode — Gelap Netral `#0B0F14` / `#11161D`)
- **Sebelum**: Kartu besar bertumpuk dengan label tier "Elite", nama pemain terpotong.
- **Sesudah**:
  - Tampilan baku berupa tabel data padat (*dense sortable table*): Nama Atlet, Nomor Punggung, Posisi, Tanggal Evaluasi Terakhir, Status Rapor, Indikator Kunci.
  - Opsi tampilan kisi kartu sederhana (*compact grid*) tetap tersedia via toggle.
  - Tombol **"Evaluasi"** hanya muncul pada atlet yang memerlukan pembaruan evaluasi (misal: > 30 hari).
  - Hapus ranking publik atau badge status bernada diskriminatif.

### C. Diagram & Grafik Pertumbuhan
- **Sebelum**: Sumbu tanpa satuan, label span waktu "6 bulan" padahal 5 bulan, titik data bertumpuk teks, gradien neon.
- **Sesudah**:
  - Sumbu grafik dilengkapi satuan metrik yang jelas (`detik`, `cm`, `kg`).
  - Garis kisi (*gridlines*) dengan 1 langkah teratur.
  - Label angka hanya diletakkan pada titik pertama, titik terakhir, dan titik terpilih.
  - Pada uji lari sprint 20m (semakin kecil detik = semakin cepat), sumbu Y dibalik (*inverted Y axis*) disertai keterangan jelas pada subjudul: *"Sumbu Y dibalik: nilai lebih rendah menunjukkan kecepatan lebih tinggi"*.
  - Menampilkan komponen `<SourceNote>` di bawah setiap diagram.

### D. Navigasi Responsif
- **Sebelum**: Teks "Skuad" terpotong di peramban seluler, menu navigasi bertumpuk.
- **Sesudah**:
  - Desktop: Bilah atas (*top bar*) datar, tinggi 48px, aksen garis bawah aktif.
  - Seluler / Tablet: Bilah tab bawah (*bottom tab bar*) ergonomis untuk satu tangan di tepi lapangan.

### E. Lembar Gaya Cetak (*Print Stylesheet A4*)
- Format A4 potret bersih dalam mode kertas terang (*light paper*).
- Header cetak: Logo & Nama Akademi, Tanggal Cetak, Identitas Atlet.
- Footer cetak: Hash Kriptografis SHA-256, Nomor Registrasi, dan Nomor Halaman (*Halaman n dari N*).
- Menghilangkan tombol, navigasi, dan elemen interaktif saat dicetak (`window.print()`).

---

## 7. Inventaris Utang Desain (*Design Debt Count Before & Target After*)

| Pola Utang Desain | Jumlah Saat Ini di `src/` | Target Pasca-Migrasi Fase 3 |
|---|---|---|
| Warna Neon `#CCFF00` | 99 kemunculan | **0** (Diganti token brand `--color-brand`) |
| Font Tipografi `font-athletic` | 67 kemunculan | **0** (Diganti `font-sans` IBM Plex Sans) |
| Bayangan Berat `shadow-2xl` | 7 kemunculan | **0** (Batas hairline 1px datar) |
| Animasi Denyut `animate-*` / `pulseGlow` | 23 kemunculan | **0** (Transisi halus 150ms hover/focus) |
| Gradien Dekoratif `bg-gradient-*` | 11 kemunculan | **0** (Permukaan warna datar) |
| Penggunaan Emoji Grafis di UI | 10 kemunculan | **0** (Set ikon Lucide seragam 16/20px) |

---

## 8. Panduan Praktis "Do & Don't"

| Aspek | Dilarang (*Don't*) | Diwajibkan (*Do*) |
|---|---|---|
| **Warna** | Memakai `#CCFF00`, latar belakang gradien warna-warni, atau neon glow. | Memakai palet token CSS (`--color-dark-*` dan `--color-paper-*`), satu warna aksen hijau lapangan. |
| **Status** | Memakai warna merah/oranye sebagai pemanis visual atau background kartu. | Warna merah/oranye **hanya** untuk status validasi, error, atau tenggat audit. |
| **Tipografi** | Memakai huruf kapital semua (*ALL CAPS*) untuk heading besar. | Huruf *sentence case* bersahaja, font tabular untuk seluruh nilai angka. |
| **Ikon** | Menyisipkan emoji seperti 🏃, 🦘, 🏆, 🔥 ke dalam antarmuka laporan. | Menggunakan ikon Lucide teknis berukuran seragam 16px atau 20px, stroke 1.5. |
| **Kartu** | Membuat kartu di dalam kartu di dalam kartu (*nested card hell*). | Membagi informasi dengan judul seksi yang jelas dan pemisah garis 1px. |
| **Data Metrik** | Menampilkan angka tanpa satuan atau klaim bombastis tanpa sumber. | Setiap angka wajib memiliki satuan, tanggal tes, dan sumber metodologi (`SourceNote`). |
| **Cetak** | Mencetak halaman dengan latar belakang hitam pekat boros tinta. | Mencetak lembar A4 bersih berlatar putih dengan kop surat dan hash integritas. |

---

## 9. Rencana Urutan Eksekusi (Setelah Persetujuan)

1. **Langkah 1**: Pasang dependensi self-hosted font: `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`. Hapus `<link>` Google Fonts di `index.html`.
2. **Langkah 2**: Perbarui `src/index.css` dengan token Tailwind 4 `@theme` (Dark Workspace, Paper Dossier, Print Stylesheet A4, font tabular, 150ms motion).
3. **Langkah 3**: Buat 14 komponen dasar di `src/components/ui/` (`Button`, `Field`, `Select`, `Tabs`, `Table`, `Stat`, `Badge`, `Dialog`, `Toast`, `EmptyState`, `Skeleton`, `SourceNote`, `PitchSvg`, `IconButton`).
4. **Langkah 4**: Migrasikan navigasi (`TopNav.jsx` desktop top bar + mobile bottom bar).
5. **Langkah 5**: Migrasikan laman Paspor (`PassportPage.jsx`, `PlayerHeader.jsx`, `FitnessStrip.jsx`, `PerformanceRadar.jsx`, `OfficialDossierFooter.jsx`).
6. **Langkah 6**: Migrasikan laman Skuad (`SquadPage.jsx`, `SquadHubView.jsx` tabel padat sortable).
7. **Langkah 7**: Migrasikan laman Pertumbuhan & Analisis Laga (`GrowthBioBandingTab.jsx`, `AthleticProgressChart.jsx`, `InteractiveMatchHub.jsx`).
8. **Langkah 8**: Migrasikan Evaluasi Pelatih & Logger (`CoachAssessmentView.jsx`, `FastPitchLogger.jsx`).
9. **Langkah 9**: Verifikasi kualitas: `npm run lint`, `npm run build`, `npm run test:run`, grep hitungan debt (target 0), dan uji print CSS.
