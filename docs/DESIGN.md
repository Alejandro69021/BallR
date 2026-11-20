# BallR (ProspekBola) — Design System & Technical Report Specification

> **Tujuan**: Menghadirkan antarmuka yang tenang, kredibel, dan berbasis data ilmiah (*sports-science technical report*), bukan *gaming HUD* atau kartu futsal neon.

---

## 1. Direction: Two Surfaces, One Token Set

Aplikasi menggunakan satu sistem token terpadu yang membedakan dua permukaan konteks penggunaan (*surfaces*):

1. **Dossier Surface** (Laman Paspor Atlet / Publik / Orang Tua / Pemandu Bakat):
   - Latar kertas terang (*paper light*), siap cetak (*print-ready* format A4 potret).
   - Memiliki nuansa laporan teknis resmi federasi sepak bola atau laboratorium ilmu keolahragaan (*sports science technical dossier*).
   - Menghilangkan elemen gim: tidak ada kartu emas FIFA EA Sports, tidak ada badge rating OVR fiktif, tidak ada klaim akselerasi bombastis.

2. **Workspace Surface** (Laman Skuad, Evaluasi Pelatih, Pencatatan Laga / Logger, Analisis Taktis):
   - Latar netral gelap (*dark neutral*), dirancang khusus untuk sesi kerja panjang staf pelatih di tepi lapangan (*pitch side*) menggunakan tablet atau laptop.
   - Kontras tinggi namun tidak menyilaukan di bawah terik matahari maupun penerangan stadion malam hari.

---

## 2. Tokens & Kontras Warna (WCAG AA >= 4.5:1)

Semua token didefinisikan sebagai variabel CSS pada `src/index.css` melalui Tailwind 4 `@theme`. **Tidak ada nilai warna hex yang ditulis langsung (*hard-coded*) pada berkas komponen.**

### A. Dark Workspace Tokens
| Token CSS | Variabel CSS | Nilai Hex | Peruntukan |
|---|---|---|---|
| `--color-dark-bg` | `var(--color-dark-bg)` | `#0B0F14` | Latar kanvas utama workspace |
| `--color-dark-surface` | `var(--color-dark-surface)` | `#11161D` | Panel, bar navigasi, kartu datar |
| `--color-dark-raised` | `var(--color-dark-raised)` | `#1A212B` | Kontrol interaktif, popover, header tabel |
| `--color-dark-line` | `var(--color-dark-line)` | `#2C3643` | Garis batas 1px dekoratif (*hairline border*) |
| `--color-dark-border-control` | `var(--color-dark-border-control)` | `#64748B` | Garis batas kontrol (input, select, button) kontras >= 3:1 |
| `--color-dark-text-1` | `var(--color-dark-text-1)` | `#E8ECF1` | Teks utama, judul seksi, nilai angka |
| `--color-dark-text-2` | `var(--color-dark-text-2)` | `#9AA6B5` | Teks sekunder, label kolom, unit metrik |
| `--color-brand-dark` | `var(--color-brand-dark)` | `#4FB286` | Aksen tunggal hijau lapangan pada latar gelap |

### B. Paper Dossier Tokens
| Token CSS | Variabel CSS | Nilai Hex | Peruntukan |
|---|---|---|---|
| `--color-paper-bg` | `var(--color-paper-bg)` | `#F6F4EF` | Latar kanvas paspor cetak / dokumen |
| `--color-paper-surface` | `var(--color-paper-surface)` | `#FFFFFF` | Lembar kertas laporan, panel dokumen |
| `--color-paper-line` | `var(--color-paper-line)` | `#DAD6CC` | Garis pemisah 1px dekoratif dokumen cetak |
| `--color-paper-border-control` | `var(--color-paper-border-control)` | `#788594` | Garis batas kontrol (input, select, button) kontras >= 3:1 |
| `--color-paper-text-1` | `var(--color-paper-text-1)` | `#14181F` | Teks utama dokumen teknis |
| `--color-paper-text-2` | `var(--color-paper-text-2)` | `#4A5360` | Metadata dokumen, catatan kaki, label |
| `--color-brand-paper` | `var(--color-brand-paper)` | `#2E7D5B` | Aksen tunggal hijau lapangan pada kertas |

### C. Semantic Status (Hanya untuk Status & Peringatan — Bukan Dekorasi)
Warna amber dan danger adalah **SEMANTIK MURNI** (menandai status validasi, error pengisian, tenggat audit tertunda), bukan elemen grafis pemanis.
- Pada latar gelap (*Dark Workspace*), `#C2453D` bawaan gagal mencapai 4.5:1 (hanya 3.86:1). Disesuaikan menjadi `#E06D66` agar lulus uji WCAG AA (5.99:1).
- Pada latar kertas (*Paper Dossier*), `#C98A1B` bawaan gagal mencapai 4.5:1 (hanya 2.68:1). Disesuaikan menjadi `#8A5B00` agar lulus uji WCAG AA (5.34:1).

| Peran Semantik | Dark Workspace | Paper Dossier | Catatan Kepatuhan |
|---|---|---|---|
| **Warning / Pending** | `#C98A1B` (6.53:1 [PASS]) | `#8A5B00` (5.34:1 [PASS]) | Di paper disesuaikan ke `#8A5B00` |
| **Danger / Error** | `#E06D66` (5.99:1 [PASS]) | `#C2453D` (4.54:1 [PASS]) | Di dark disesuaikan ke `#E06D66` |
| **Success / Valid** | `#4FB286` (7.36:1 [PASS]) | `#2E7D5B` (4.55:1 [PASS]) | Menggunakan brand green resmi |

### D. Data Series Okabe-Ito (Colour-Blind Safe)
Diagram taktis dan metrik perkembangan menggunakan palet Okabe-Ito yang ramah buta warna. Setiap seri **wajib dipadukan dengan label teks atau bentuk penanda (*marker shape*)**:
- **Dark Surface Originals** (diuji >= 3:1 terhadap `#11161D` dan `#0B0F14`):
  1. Seri 1 (Sky Blue): `#0072B2` (3.50:1 [PASS]) — Bentuk penanda: Lingkaran (`●`)
  2. Seri 2 (Orange): `#E69F00` (8.06:1 [PASS]) — Bentuk penanda: Kotak (`■`)
  3. Seri 3 (Bluish Green): `#009E73` (5.31:1 [PASS]) — Bentuk penanda: Segitiga (`▲`)
  4. Seri 4 (Vermilion): `#D55E00` (4.69:1 [PASS]) — Bentuk penanda: Belah Ketupat (`◆`)
  5. Seri 5 (Reddish Purple): `#CC79A7` (5.93:1 [PASS]) — Bentuk penanda: Garis Putus-putus (`---`)
- **Paper Surface Darker Variants** (varian lebih gelap mempertahankan keluarga hue, mencapai >= 3:1 dan > 4.5:1 terhadap `#FFFFFF` dan `#F6F4EF`):
  1. Seri 1 (Blue Paper): `#0072B2` (5.19:1 di putih, 4.72:1 di paper [PASS]) — Bentuk penanda: Lingkaran (`●`)
  2. Seri 2 (Orange Paper): `#9E5B00` (5.32:1 di putih, 4.84:1 di paper [PASS]) — Bentuk penanda: Kotak (`■`)
  3. Seri 3 (Green Paper): `#007A59` (5.35:1 di putih, 4.86:1 di paper [PASS]) — Bentuk penanda: Segitiga (`▲`)
  4. Seri 4 (Vermilion Paper): `#B34700` (5.50:1 di putih, 5.00:1 di paper [PASS]) — Bentuk penanda: Belah Ketupat (`◆`)
  5. Seri 5 (Pink/Purple Paper): `#9C4472` (6.03:1 di putih, 5.48:1 di paper [PASS]) — Bentuk penanda: Garis Putus-putus (`---`)

### E. Tabel Uji Kontras Lengkap (WCAG AA >= 4.5:1 untuk Teks, >= 3.0:1 untuk Kontrol/Grafik)
Semua pasangan teks, batas kontrol, dan seri data dihitung berdasarkan rumus *Relative Luminance* WCAG 2.1:

```
--- DARK WORKSPACE (Latar Gelap) ---
Latar #0B0F14 (bg)      & Teks #E8ECF1 (text-1)   : 16.20:1 [PASS]
Latar #0B0F14 (bg)      & Teks #9AA6B5 (text-2)   :  7.78:1 [PASS]
Latar #11161D (surface) & Teks #E8ECF1 (text-1)   : 15.31:1 [PASS]
Latar #11161D (surface) & Teks #9AA6B5 (text-2)   :  7.35:1 [PASS]
Latar #1A212B (raised)  & Teks #E8ECF1 (text-1)   : 13.65:1 [PASS]
Latar #1A212B (raised)  & Teks #9AA6B5 (text-2)   :  6.55:1 [PASS]
Latar #0B0F14 (bg)      & Brand #4FB286           :  7.36:1 [PASS]
Latar #11161D (surface) & Brand #4FB286           :  6.96:1 [PASS]
Latar #0B0F14 (bg)      & Warning #C98A1B         :  6.53:1 [PASS]
Latar #0B0F14 (bg)      & Danger Asli #C2453D     :  3.86:1 [FAIL - Disesuaikan]
Latar #0B0F14 (bg)      & Danger Disesuaikan #E06D66 : 5.99:1 [PASS]
Latar #11161D (surface) & Danger Disesuaikan #E06D66 : 5.66:1 [PASS]
Batas Kontrol #64748B   & Latar #11161D (surface) :  3.82:1 [PASS >= 3.0:1]
Batas Kontrol #64748B   & Latar #0B0F14 (bg)      :  4.04:1 [PASS >= 3.0:1]
Batas Kontrol #64748B   & Latar #1A212B (raised)  :  3.40:1 [PASS >= 3.0:1]
Chart Seri Asli         & Latar #11161D (surface) :
  - #0072B2 : 3.50:1 [PASS]
  - #E69F00 : 8.06:1 [PASS]
  - #009E73 : 5.31:1 [PASS]
  - #D55E00 : 4.69:1 [PASS]
  - #CC79A7 : 5.93:1 [PASS]

--- PAPER DOSSIER (Latar Terang) ---
Latar #F6F4EF (bg)      & Teks #14181F (text-1)   : 16.19:1 [PASS]
Latar #F6F4EF (bg)      & Teks #4A5360 (text-2)   :  7.08:1 [PASS]
Latar #FFFFFF (surface) & Teks #14181F (text-1)   : 17.79:1 [PASS]
Latar #FFFFFF (surface) & Teks #4A5360 (text-2)   :  7.79:1 [PASS]
Latar #F6F4EF (bg)      & Brand #2E7D5B           :  4.55:1 [PASS]
Latar #FFFFFF (surface) & Brand #2E7D5B           :  5.00:1 [PASS]
Latar #F6F4EF (bg)      & Warning Asli #C98A1B    :  2.68:1 [FAIL - Disesuaikan]
Latar #F6F4EF (bg)      & Warning Disesuaikan #8A5B00 : 5.34:1 [PASS]
Latar #FFFFFF (surface) & Warning Disesuaikan #8A5B00 : 5.87:1 [PASS]
Latar #F6F4EF (bg)      & Danger #C2453D          :  4.54:1 [PASS]
Latar #FFFFFF (surface) & Danger #C2453D          :  4.99:1 [PASS]
Batas Kontrol #788594   & Latar #FFFFFF (surface) :  3.76:1 [PASS >= 3.0:1]
Batas Kontrol #788594   & Latar #F6F4EF (bg)      :  3.42:1 [PASS >= 3.0:1]
Chart Seri Varian Paper & Latar #FFFFFF (surface) :
  - #0072B2 : 5.19:1 [PASS >= 3.0:1]
  - #9E5B00 : 5.32:1 [PASS >= 3.0:1]
  - #007A59 : 5.35:1 [PASS >= 3.0:1]
  - #B34700 : 5.50:1 [PASS >= 3.0:1]
  - #9C4472 : 6.03:1 [PASS >= 3.0:1]
Chart Seri Varian Paper & Latar #F6F4EF (bg)      :
  - #0072B2 : 4.72:1 [PASS >= 3.0:1]
  - #9E5B00 : 4.84:1 [PASS >= 3.0:1]
  - #007A59 : 4.86:1 [PASS >= 3.0:1]
  - #B34700 : 5.00:1 [PASS >= 3.0:1]
  - #9C4472 : 5.48:1 [PASS >= 3.0:1]
```

---

## 3. Tipografi & Paket Font Mandiri (Self-Hosted)

### A. Paket Font Mandiri & Lisensi
Semua permintaan font pihak ketiga dihapus:
- Hapus tag `<link rel="preconnect" href="https://fonts.googleapis.com">` dan stylesheet Google Fonts dari `index.html`.
- Aplikasi wajib berfungsi penuh tanpa jaringan internet (*offline-first*), tanpa kebocoran IP pelatih/atlet ke pihak ketiga.
- Menggunakan paket npm `@fontsource`:
  1. **`@fontsource/ibm-plex-sans`**: Digunakan untuk seluruh teks UI, judul seksi, dan isi laporan teknis.
     - **Lisensi Font**: SIL Open Font License, Version 1.1 (OFL-1.1).
     - **Lisensi Paket**: MIT.
  2. **`@fontsource/ibm-plex-mono`**: Digunakan untuk semua angka numerik, catatan waktu, ID paspor, tanggal ISO, dan hash kriptografis SHA-256.
     - **Lisensi Font**: SIL Open Font License, Version 1.1 (OFL-1.1).
     - **Lisensi Paket**: MIT.

### B. Skala Tipografi Baku
| Ukuran | Line Height | Berat (*Weight*) | Peruntukan |
|---|---|---|---|
| `12px` (`text-xs`) | `16px` | Regular (400) / Semibold (600) | Label kolom tabel, metadata pengujian, unit metrik |
| `14px` (`text-sm`) | `20px` | Regular (400) / Medium (500) | Isi teks baku, sel tabel, input form, catatan pelatih |
| `16px` (`text-base`) | `24px` | Semibold (600) | Subjudul seksi, label kartu ringkasan, teks penekanan |
| `20px` (`text-xl`) | `28px` | Semibold (600) | Judul panel utama, judul laman workspace |
| `28px` (`text-2xl`+) | `36px` | Semibold (600) | Nama atlet pada Dossier, kop dokumen resmi |

### C. Aturan Format Huruf & Angka
1. **Sentence Case**: Semua heading, subjudul, menu navigasi, dan tombol wajib menggunakan *sentence case* bersahaja (misal: "Evaluasi fisik terakhir", bukan "EVALUASI FISIK TERAKHIR").
2. **Tabular Numerals**: Seluruh komponen metrik, tabel angka, dan skor wajib menggunakan utilitas `tabular-nums` (`font-variant-numeric: tabular-nums`) agar karakter angka memiliki lebar monospaced seragam dan sejajar vertikal.

---

## 4. Bentuk, Kisi & Gerakan (Shape, Grid & Motion)

1. **Radius & Sudut**:
   - Kontrol interaktif (tombol, input, dropdown select, pill status): `rounded-[6px]` (radius 6px).
   - Panel dokumen, dialog modal, wadah tabel: `rounded-[8px]` (radius 8px).
   - Batas tepi: 1px garis tegas datar (*1px hairline border*). Tidak ada kartu bersarang di dalam kartu (*no nested cards*).
2. **Bayangan (*Shadows*)**:
   - Dilarang menggunakan `shadow-2xl`, efek glow neon, atau drop-shadow berlapis.
   - Hanya **satu** bayangan halus yang diperbolehkan dalam sistem: bayangan melayang untuk menu popover/dialog dropdown (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)`).
3. **Kisi & Tata Letak (*Grid & Spacing*)**:
   - Berbasis kisi 8pt (`gap-2` = 8px, `gap-4` = 16px, `p-4` = 16px, `p-6` = 24px).
   - Lebar konten maksimum: `1120px` (*centered*).
   - Desktop: 12 kolom responsif.
   - Seluler: Kolom tunggal ergonomis untuk pengoperasian satu tangan.
4. **Gerakan & Animasi (*Motion*)**:
   - Durasi maksimal `150ms ease-out` hanya untuk transisi interaksi langsung (*hover*, *focus-visible*, buka/tutup akordeon).
   - Tidak ada animasi dekoratif (hapus `pulseGlow`, `glow-volt`, `animate-bounce`).
   - Wajib menghormati kueri media `@media (prefers-reduced-motion: reduce)` dengan mematikan semua transisi (`transition: none !important; animation: none !important;`).

---

## 5. Komponen UI Mandiri (`src/components/ui/`)

Dibangun sekali di direktori `src/components/ui/` dan diimpor di seluruh aplikasi.

### 1. `Button` (`src/components/ui/Button.jsx`)
- **Props**:
  - `variant`: `'primary'` (brand accent), `'secondary'` (surface/border), `'danger'` (semantic red), `'ghost'` (transparan). Default: `'primary'`.
  - `size`: `'sm'` (tinggi 32px, text-xs), `'md'` (tinggi 38px, text-sm). Default: `'md'`.
  - `disabled`: boolean.
  - `loading`: boolean (menampilkan spinner teknis sederhana).
  - `icon`: ReactNode (opsional, ikon Lucide 16px).
  - `children`: ReactNode.
- **States**:
  - `default`: Kontras warna sesuai varian, radius 6px, border 1px.
  - `hover`: Pergeseran latar halus (150ms ease-out).
  - `focus-visible`: Ring fokus 2px warna brand dengan offset 2px.
  - `active`: Elevasi datar, skala 1.0 (tanpa efek pantulan elastis).
  - `disabled`: Opacity 45%, kursor `not-allowed`.
  - `loading`: Teks tersembunyi/redup, spinner monokrom tampil.

### 2. `IconButton` (`src/components/ui/IconButton.jsx`)
- **Props**:
  - `icon`: ReactNode (ikon Lucide 16px atau 20px, stroke 1.5).
  - `label`: string (**wajib**, untuk `aria-label` aksesibilitas pembaca layar).
  - `variant`: `'ghost'` | `'secondary'`. Default: `'ghost'`.
  - `size`: `'sm'` (28x28px) | `'md'` (34x34px). Default: `'md'`.
  - `disabled`: boolean.
- **States**: `default`, `hover`, `focus-visible`, `active`, `disabled`.

### 3. `Field` (`src/components/ui/Field.jsx`)
- **Props**:
  - `label`: string.
  - `id`: string (**wajib**, dipasangkan dengan `htmlFor`).
  - `error`: string (pesan error semantik).
  - `helper`: string (keterangan bantuan teknis).
  - `required`: boolean.
  - `children`: ReactNode (elemen `<input>` atau `<textarea>`).
- **States**: `default`, `focus-within`, `error` (border merah semantik + pesan bantuan merah), `disabled`.

### 4. `Select` (`src/components/ui/Select.jsx`)
- **Props**:
  - `id`: string.
  - `value`: string | number.
  - `onChange`: function.
  - `options`: Array<{ value, label }>.
  - `error`: string.
  - `disabled`: boolean.
- **States**: `default`, `hover`, `focus-visible`, `disabled`.

### 5. `Tabs` (`src/components/ui/Tabs.jsx`)
- **Props**:
  - `tabs`: Array<{ id: string, label: string, count?: number }>.
  - `activeTab`: string.
  - `onChange`: (tabId: string) => void.
- **States**:
  - `active`: Garis bawah solid 2px warna brand, teks berbobot semibold.
  - `inactive`: Teks sekunder, tanpa garis bawah.
  - `hover`: Teks lebih terang (150ms).
  - `keyboard-focus`: Navigasi tombol panah kiri/kanan (`aria-selected`).

### 6. `Table` (`src/components/ui/Table.jsx`)
- **Props**:
  - `columns`: Array<{ key: string, header: string, sortable?: boolean, align?: 'left'|'center'|'right', tabular?: boolean }>.
  - `data`: Array<Object>.
  - `sortKey`: string.
  - `sortDirection`: `'asc'` | `'desc'`.
  - `onSort`: (key: string) => void.
  - `stickyHeader`: boolean. Default: `true`.
  - `emptyMessage`: string. Default: `'Belum ada data'`.
- **States**:
  - `header-hover`: Ikon urut (Lucide `ArrowUpDown`, 14px) muncul saat hover.
  - `row-hover`: Latar baris berganti halus ke warna raised.
  - `sorted`: Indikator panah tegas (`ArrowUp` / `ArrowDown`).
  - `empty`: Memanggil komponen `<EmptyState />`.

### 7. `Stat` (`src/components/ui/Stat.jsx`)
- **Props**:
  - `label`: string (nama metrik, misal: "Lari 20m").
  - `value`: string | number | null (misal: "3.24" atau null).
  - `unit`: string (misal: "detik", "cm", "kg").
  - `date`: string (tanggal pengujian ISO, misal: "2026-10-14").
  - `n`: number (jumlah sampel benchmark, misal: 42).
  - `trend`: string (keterangan perbandingan objektif, misal: "-0.08s dari tes lalu").
- **States**:
  - `populated`: Nilai besar `font-mono tabular-nums`, unit dan tanggal tersusun rapi.
  - `empty`: Menampilkan tanda hubung `-` dan teks jujur "Belum ada data".

### 8. `Badge` (`src/components/ui/Badge.jsx`)
- **Props**:
  - `variant`: `'neutral'` (abu-abu netral), `'brand'` (hijau lapangan), `'warning'` (amber status), `'danger'` (merah error).
  - `size`: `'sm'` (18px) | `'md'` (22px).
  - `children`: ReactNode.
- **States**: Statis non-dekoratif (hanya teks ringkas + border halus, tanpa kilatan neon).

### 9. `Dialog` (`src/components/ui/Dialog.jsx`)
- **Props**:
  - `isOpen`: boolean.
  - `onClose`: () => void.
  - `title`: string.
  - `description`: string.
  - `children`: ReactNode.
  - `footer`: ReactNode.
- **States**:
  - `open`: Backdrop gelap blur halus, kartu terpusat, fokus terkunci (*focus trap*), tombol Esc aktif.
  - `closing`: Transisi keluar 150ms.

### 10. `Toast` (`src/components/ui/Toast.jsx`)
- **Props**:
  - `message`: string.
  - `subtext`: string.
  - `variant`: `'info'` | `'success'` | `'warning'` | `'error'`.
  - `onClose`: () => void.
  - `duration`: number. Default: 4000ms.
- **States**: Muncul di pojok kanan bawah, transisi 150ms, border 1px kontras tinggi.

### 11. `EmptyState` (`src/components/ui/EmptyState.jsx`)
- **Props**:
  - `icon`: ReactNode (ikon teknis Lucide, 24px, stroke 1.5).
  - `title`: string. Default: `'Belum ada data'`.
  - `description`: string.
  - `action`: ReactNode (tombol aksi opsional).
- **States**: Terpusat, teks netral redup, tanpa ilustrasi kartun.

### 12. `Skeleton` (`src/components/ui/Skeleton.jsx`)
- **Props**:
  - `variant`: `'text'` | `'rect'` | `'circle'`.
  - `width`: string | number.
  - `height`: string | number.
  - `className`: string.
- **States**: Blok abu-abu datar netral dengan transisi opasitas sangat halus (menghormati `prefers-reduced-motion`).

### 13. `SourceNote` (`src/components/ui/SourceNote.jsx`)
- **Props**:
  - `source`: string (nama metodologi/protokol/pustaka rujukan).
  - `date`: string (tanggal pengujian atau publikasi referensi).
  - `sampleSize`: number (jumlah n sampel rujukan, opsional).
  - `citationKey`: string (kunci rujukan ke pustaka sains rujukan).
- **Format Output**: `"Sumber: [source] · [date] · n=[sampleSize]"` dalam teks ukuran 12px monospaced abu-abu netral.

### 14. `PitchSvg` (`src/components/ui/PitchSvg.jsx`)
- **Props**:
  - `orientation`: `'horizontal'` | `'vertical'`. Default: `'horizontal'`.
  - `aspectRatio`: string. Default: `'68/105'` (rasio standar lapangan IFAB).
  - `children`: ReactNode (lapisan SVG untuk titik event, heatmap, atau kuadran taktis).
- **Spesifikasi**: Gambar vektor garis putih/abu-abu tipis 1px di atas permukaan hijau rumput netral gelap (`#14231C`), bebas dari tekstur sintetis fiktif.

---

## 6. Rencana Desain per Layar (*Screen Plan: Before & After*)

### A. Laman Paspor Atlet (`PassportPage.jsx`, `PlayerHeader.jsx`, `FitnessStrip.jsx`)
- **Sebelum**:
  - Kartu emas/perak bergaya gim FIFA Ultimate Team, badge OVR raksasa, teks bombastis *"Top Tier Growth Acceleration"*, efek kilau neon `#CCFF00`.
  - Informasi fisik atlet terpecah di dalam kartu-kartu bersarang bertingkat tiga (*nested card hell*).
- **Sesudah**:
  - Menggunakan **Dossier Surface** (Latar Kertas Terang `#F6F4EF` / `#FFFFFF`).
  - **Aturan Blok Identitas & Foto**:
    - Foto atlet ditampilkan **hanya jika** data foto riil tersedia DAN pemain memiliki persetujuan foto (*photo consent* aktif). Jangan pernah menggunakan foto stok (*no stock photos*). Jika tidak ada foto atau tidak ada izin, tampilkan placeholder avatar monokrom netral berbasis inisial.
    - Nomor lisensi / NISN ditampilkan **hanya jika** data tersedia di basis data; jika kosong, baris nomor lisensi dihilangkan sepenuhnya (*omit row*).
    - Dilarang keras menampilkan teks contoh/dummy (*never show example text*).
  - **Ringkasan 5-baris terstruktur langsung di posisi teratas**:
    1. Posisi Utama & Posisi Sekunder.
    2. Kelompok Usia (misal: U-13 Akademi).
    3. Periode Evaluasi Terakhir (Bulan/Tahun).
    4. Tiga Indikator Kunci: diambil langsung dari nilai evaluasi riil terbaru (misal: Umpan, Kecepatan, Kontrol). Jika belum ada data evaluasi, tampilkan teks jujur `"Belum ada data"`.
    5. Tanggal Uji Kebugaran Terakhir.
  - Detail fisik dan catatan taktis disusun sebagai seksi laporan teknis bergaris batas 1px datar (*plain titled sections*), tanpa kartu bersarang.
  - Menghapus badge OVR, ranking fiktif, dan klaim bombastis.

### B. Laman Skuad (`SquadPage.jsx`, `SquadHubView.jsx`)
- **Sebelum**:
  - Grid kartu pemain bertingkat besar dengan label tier ("Elite", "Academy Tier 1") yang memicu diskriminasi atlet muda.
  - Teks nama dan status sering terpotong (*text overflow*) pada layar tablet.
- **Sesudah**:
  - Tampilan baku berupa **Tabel Data Padat (*Dense Sortable Table*)**:
    - Kolom: Nomor Punggung, Nama Atlet, Posisi, Tanggal Evaluasi Terakhir, Status Rapor, Indikator Kunci.
    - Kolom angka menggunakan font monospaced tabular.
    - Header lengket (*sticky header*) saat daftar skuad digulir.
  - Opsi tampilan kisi kartu sederhana (*compact card grid*) tetap disediakan sebagai tombol toggle tampilan sekunder.
  - Menghapus ranking publik dan pelabelan tier atlet.

### C. Visualisasi Data & Diagram Pertumbuhan (`AthleticProgressChart.jsx`, `PerformanceRadar.jsx`)
- **Sebelum**:
  - Sumbu diagram tanpa satuan yang jelas, span waktu misleading, label teks bertumpuk di setiap titik data, warna garis bertabrakan dan tidak ramah buta warna.
- **Sesudah**:
  - Sumbu diagram wajib menyertakan unit metrik baku (`detik`, `cm`, `kg`).
  - Garis kisi (*gridlines*) 1 langkah teratur dengan garis 1px redup.
  - Label angka data hanya dicantumkan pada titik pertama, titik terakhir, dan titik yang sedang dipilih (*selected point*).
  - **Uji Lari Sprint 20m (nilai lebih rendah = lebih baik)**:
    - Sumbu Y dibalik (*inverted Y axis*) atau menampilkan perbaikan delta waktu, disertai catatan jelas pada subjudul: *"Sumbu Y dibalik: nilai waktu lebih rendah menunjukkan performa lari lebih cepat"*.
  - Di bawah setiap diagram dicantumkan komponen `<SourceNote>` berisi rujukan pengujian dan tanggal.

### D. Navigasi Responsif (`TopNav.jsx`, Navigasi Bawah)
- **Sebelum**:
  - Bilah navigasi atas desktop terpotong pada layar seluler; tombol "Skuad" terpotong menjadi "Skua...".
- **Sesudah**:
  - **Desktop (>= 768px)**: Bilah navigasi atas datar (*top bar*), tinggi 48px, garis bawah penanda aktif warna brand.
  - **Seluler (< 768px)**: Bilah tab bawah (*bottom tab bar*) tersemat tetap (*sticky bottom*), ukuran sentuh ergonomis (tinggi 56px), label teks terbaca penuh tanpa pemotongan.

### E. Standardisasi Ikonografi
- **Sebelum**:
  - Bercampur antara emoji sistem grafis (🏃, 🦘, 🏆, 🔥, ⚽) dan ikon SVG aneka ketebalan garis.
- **Sesudah**:
  - Seluruh emoji visual dihapus dari UI teknis.
  - Standar tunggal menggunakan paket ikon **Lucide React** dengan ukuran konsisten:
    - Ukuran kontrol/tabel: `16px`, stroke `1.5`.
    - Ukuran header/navigasi: `20px`, stroke `1.5`.

### F. Lembar Cetak Laporan Paspor A4 (*Print Dossier Stylesheet*)
- **Sebelum**:
  - Halaman dicetak dengan latar belakang hitam pekat dan tombol navigasi yang boros tinta serta tidak terbaca di kertas.
- **Sesudah**:
  - Format cetak A4 potret bersih dalam mode kertas terang (*light paper*).
  - Menyembunyikan seluruh kontrol interaktif (tombol, input pencarian, dropdown filter, navigasi aplikasi).
  - **Header Cetak**: Logo & Nama Akademi, Tanggal Dokumen Dicetak, Identitas Lengkap Atlet.
  - **Footer Cetak**: Hash Kriptografis Integritas Dokumen (SHA-256), Nomor Registrasi Paspor, dan Penomoran Halaman (*"Halaman n dari N"* via CSS paged media).

---

## 7. Inventaris Utang Desain (*Design Debt Grep Inventory*)

Hasil pencarian exact `git grep -i -c` di seluruh basis kode proyek:

### A. Rekapitulasi Total Kemunculan
| Pola Utang Desain | Total Garis / Kemunculan Saat Ini | Target Pasca-Migrasi Fase 3 |
|---|---|---|
| Warna Neon `#CCFF00` | **201 kemunculan** di 42 berkas | **0** (Diganti token brand `--color-brand-*`) |
| Tipografi `font-athletic` | **172 kemunculan** di 37 berkas | **0** (Diganti `font-sans` IBM Plex Sans) |
| Gradien Dekoratif `gradient` / `bg-gradient` | **51 kemunculan** di 24 berkas | **0** (Diganti permukaan warna datar) |
| Bayangan Berat `shadow-2xl` | **13 kemunculan** di 11 berkas | **0** (Batas hairline 1px datar) |

### B. Rincian Berkas per Kategori Utang Desain

#### 1. Berkas dengan Warna Neon `#CCFF00` (201 kemunculan):
- `src/components/scanner/CameraFeed.jsx`: 15
- `src/components/StoryFlexCardModal.jsx`: 12
- `src/components/PerformanceRadar.jsx`: 11
- `src/components/VideoModal.jsx`: 11
- `src/components/AICoachCard.jsx`: 10
- `src/components/squad/SquadPlayerCard.jsx`: 10
- `src/components/SquadHubView.jsx`: 9
- `src/components/match/MatchEventTimeline.jsx`: 9
- `src/components/InteractiveMatchHub.jsx`: 8
- `src/components/OfficialDossierFooter.jsx`: 7
- `src/components/assessment/AttributeEditor.jsx`: 6
- `src/components/assessment/FitnessForm.jsx`: 6
- `src/components/logger/MatchRecapModal.jsx`: 6
- `src/components/MatchMoments.jsx`: 6
- `src/components/scanner/TestTelemetryOverlay.jsx`: 6
- `src/components/CoachAssessmentView.jsx`: 5
- `src/components/FitnessStrip.jsx`: 5
- `src/components/PitchScannerModal.jsx`: 5
- `src/components/assessment/NarrativeNotesForm.jsx`: 4
- `src/components/auth/AuthModal.jsx`: 4
- `src/components/growth/BioMaturityCard.jsx`: 4
- `src/components/logger/EventStreamLog.jsx`: 4
- `src/components/story/StoryCardCanvas.jsx`: 4
- `src/components/logger/MatchTimerBar.jsx`: 3
- `src/components/logger/QuickShotModal.jsx`: 3
- `src/components/VerificationView.jsx`: 3
- `docs/AUDIT.md`: 3
- `src/components/FastPitchLogger.jsx`: 2
- `src/components/growth/AnthropometryLogTable.jsx`: 2
- `src/components/InstallAppBanner.jsx`: 2
- `src/components/LoadingSkeleton.jsx`: 2
- `src/components/Toast.jsx`: 2
- `public/icon.svg`: 2
- `docs/DESIGN.md`: 2
- `src/App.jsx`: 1
- `src/components/GrowthBioBandingTab.jsx`: 1
- `src/components/logger/TactileKeypad.jsx`: 1
- `src/components/TacticalAnalyticsHub.jsx`: 1
- `src/pages/AssessmentPage.jsx`: 1
- `src/pages/LoggerPage.jsx`: 1
- `index.html`: 1
- `scripts/generate-png-icons.js`: 1

#### 2. Berkas dengan `font-athletic` (172 kemunculan):
- `src/components/PlayerHeader.jsx`: 14
- `src/components/squad/SquadPlayerCard.jsx`: 9
- `src/components/analytics/FilanesiaGrid.jsx`: 8
- `src/components/AICoachCard.jsx`: 7
- `src/components/growth/AthleticProgressChart.jsx`: 7
- `src/components/growth/BioMaturityCard.jsx`: 7
- `src/components/logger/EventStreamLog.jsx`: 7
- `src/components/logger/TactileKeypad.jsx`: 7
- `src/components/SquadHubView.jsx`: 7
- `src/components/story/StoryCardCanvas.jsx`: 7
- `src/components/TacticalAnalyticsHub.jsx`: 7
- `src/components/assessment/AttributeEditor.jsx`: 6
- `src/components/InteractiveMatchHub.jsx`: 6
- `src/components/assessment/FitnessForm.jsx`: 5
- `src/components/StoryFlexCardModal.jsx`: 5
- `src/components/analytics/VaepScorecard.jsx`: 5
- `src/components/CoachAssessmentView.jsx`: 4
- `src/components/InstallAppBanner.jsx`: 4
- `src/components/logger/MatchRecapModal.jsx`: 4
- `src/components/logger/MatchTimerBar.jsx`: 4
- `src/components/PerformanceRadar.jsx`: 4
- `src/components/scanner/TestTelemetryOverlay.jsx`: 4
- `src/components/analytics/PrescribedDrillCard.jsx`: 4
- `src/components/analytics/FifaLanguageMetrics.jsx`: 3
- `src/components/assessment/NarrativeNotesForm.jsx`: 3
- `src/components/logger/QuickShotModal.jsx`: 3
- `src/components/match/MatchEventTimeline.jsx`: 3
- `src/components/MatchMoments.jsx`: 3
- `src/components/scanner/CameraFeed.jsx`: 3
- `src/components/FitnessStrip.jsx`: 2
- `src/components/growth/AnthropometryLogTable.jsx`: 2
- `src/components/PitchScannerModal.jsx`: 2
- `src/components/VideoModal.jsx`: 2
- `src/components/FastPitchLogger.jsx`: 1
- `src/index.css`: 1
- `docs/AUDIT.md`: 1
- `docs/DESIGN.md`: 1

#### 3. Berkas dengan `gradient` / `bg-gradient` (51 kemunculan):
- `src/components/squad/SquadPlayerCard.jsx`: 9
- `public/icon.svg`: 6
- `src/components/story/StoryCardCanvas.jsx`: 6
- `src/components/scanner/CameraFeed.jsx`: 4
- `src/components/StoryFlexCardModal.jsx`: 3
- `src/components/growth/AthleticProgressChart.jsx`: 2
- `src/components/PerformanceRadar.jsx`: 2
- `src/components/scanner/TestTelemetryOverlay.jsx`: 2
- `src/components/VideoModal.jsx`: 2
- `src/components/AICoachCard.jsx`: 1
- `src/components/analytics/FilanesiaGrid.jsx`: 1
- `src/components/assessment/AttributeEditor.jsx`: 1
- `src/components/assessment/FitnessForm.jsx`: 1
- `src/components/assessment/NarrativeNotesForm.jsx`: 1
- `src/components/FastPitchLogger.jsx`: 1
- `src/components/growth/BioMaturityCard.jsx`: 1
- `src/components/InstallAppBanner.jsx`: 1
- `src/components/InteractiveMatchHub.jsx`: 1
- `src/components/logger/QuickShotModal.jsx`: 1
- `src/components/MatchMoments.jsx`: 1
- `src/components/PitchScannerModal.jsx`: 1
- `src/components/PlayerHeader.jsx`: 1
- `docs/AUDIT.md`: 1
- `docs/DESIGN.md`: 1

#### 4. Berkas dengan `shadow-2xl` (13 kemunculan):
- `src/components/VideoModal.jsx`: 2
- `docs/DESIGN.md`: 2
- `src/components/CoachAssessmentView.jsx`: 1
- `src/components/InteractiveMatchHub.jsx`: 1
- `src/components/logger/MatchRecapModal.jsx`: 1
- `src/components/logger/QuickShotModal.jsx`: 1
- `src/components/PitchScannerModal.jsx`: 1
- `src/components/StoryFlexCardModal.jsx`: 1
- `src/components/story/StoryCardCanvas.jsx`: 1
- `src/components/Toast.jsx`: 1
- `docs/AUDIT.md`: 1

---

## 8. Urutan Migrasi (*Migration Order: Smallest First*)

Migrasi dieksekusi secara bertahap mulai dari fondasi dan layar terkecil tanpa merusak fungsionalitas:

1. **Fondasi Sistem Desain & Tipografi**:
   - Pasang paket `@fontsource/ibm-plex-sans` dan `@fontsource/ibm-plex-mono`. Hapus `<link>` Google Fonts di `index.html`.
   - Konfigurasi token CSS di `src/index.css` via Tailwind 4 `@theme` (Dossier & Workspace tokens, aturan print A4, tabular numbers).
2. **Paket Komponen UI Baku (`src/components/ui/`)**:
   - Bangun 14 komponen dasar: `Button`, `IconButton`, `Field`, `Select`, `Tabs`, `Table`, `Stat`, `Badge`, `Dialog`, `Toast`, `EmptyState`, `Skeleton`, `SourceNote`, `PitchSvg`.
3. **Navigasi Global (`TopNav.jsx` & Navigasi Bawah)**:
   - Implementasikan top bar desktop 48px dan bottom tab bar mobile 56px (perbaiki teks "Skuad" yang terpotong).
4. **Modals Mandiri & Dialog Autentikasi**:
   - `AuthModal.jsx`, `VerificationView.jsx`, `Toast.jsx`, `InstallAppBanner.jsx`.
5. **Evaluasi Pelatih & Pencatatan Laga (Workspace Standalone)**:
   - `FastPitchLogger.jsx`, `AttributeEditor.jsx`, `FitnessForm.jsx`, `NarrativeNotesForm.jsx`, `CoachAssessmentView.jsx`.
6. **Analisis Taktis & Laga (Workspace Analytics)**:
   - `InteractiveMatchHub.jsx`, `TacticalAnalyticsHub.jsx`, `FilanesiaGrid.jsx`, `VaepScorecard.jsx`, `MatchMoments.jsx`.
7. **Pertumbuhan Fisik & Bio-Banding**:
   - `GrowthBioBandingTab.jsx`, `BioMaturityCard.jsx`, `AnthropometryLogTable.jsx`, `AthleticProgressChart.jsx`.
8. **Hub Skuad (Workspace Dense Table)**:
   - `SquadPage.jsx`, `SquadHubView.jsx`, `SquadPlayerCard.jsx`.
9. **Paspor Atlet & Cetak Dossier A4 (Layar Utama)**:
   - `PassportPage.jsx`, `PlayerHeader.jsx`, `FitnessStrip.jsx`, `PerformanceRadar.jsx`, `OfficialDossierFooter.jsx`.
10. **Pembersihan Komprehensif Berkas Tersisa (Target Utang Desain = 0)**:
   - Membersihkan dan menetralkan seluruh berkas tersisa yang memuat `'#CCFF00'`, `'font-athletic'`, `'gradient'`, atau `'shadow-2xl'`:
     - `src/components/story/*` (`StoryCardCanvas.jsx`) & `StoryFlexCardModal.jsx`: fitur share-card diubah menjadi format netral ilmiah (tanpa badge OVR/tier, tanpa gradien warna-warni).
     - `src/components/VideoModal.jsx`: hilangkan glow, neon, dan bayangan berat.
     - `src/components/scanner/*` (`CameraFeed.jsx`, `PitchScannerModal.jsx`, `TestTelemetryOverlay.jsx`).
     - `src/components/logger/*` (`EventStreamLog.jsx`, `MatchRecapModal.jsx`, `MatchTimerBar.jsx`, `QuickShotModal.jsx`, `TactileKeypad.jsx`).
     - `src/components/match/MatchEventTimeline.jsx`.
     - `src/components/LoadingSkeleton.jsx`.
     - `src/components/growth/ConsentManagerModal.jsx`.
     - `public/icon.svg` & `scripts/generate-png-icons.js`: ganti neon volt dengan warna aksen brand `#2E7D5B` / `#4FB286`.

---

## 9. Kriteria Keberterimaan (*Acceptance Checklist*)

Sebelum fase migrasi dinyatakan selesai, seluruh syarat berikut wajib terpenuhi:

- [ ] **0 Hard-Coded Hex**: Tidak ada kode warna hex `#...` pada properti style maupun class arbitrary di dalam seluruh berkas komponen `src/components/`. Semua warna merujuk pada token tema.
- [ ] **Kontras WCAG AA >= 4.5:1**: Semua kombinasi teks/latar lolos uji kontras minimum 4.5:1 untuk teks normal dan 3.0:1 untuk elemen grafis.
- [ ] **Aksesibilitas Lighthouse >= 95**: Skor audit Accessibility pada Google Lighthouse peramban mencapai minimal 95 di mode desktop dan mobile.
- [ ] **Verifikasi Tampilan Responsif**:
  - Tangkapan layar (*screenshot*) pada lebar viewport **360px** (seluler): Navigasi bawah tampil pas, tidak ada teks terpotong atau scrollbar horizontal tak terduga.
  - Tangkapan layar (*screenshot*) pada lebar viewport **1280px** (desktop): Tata letak 12-kolom terpusat dengan batas maksimal 1120px.
- [ ] **Pratinjau Cetak A4 Bersih**: Dialog cetak (`window.print()`) pada laman paspor menghasilkan dokumen A4 potret berlatar putih bersih dengan kop surat akademi, hash SHA-256 integritas, dan penomoran halaman tanpa elemen interaktif.
- [ ] **Uji Otomatis & Build**: Seluruh test suite (`npm run test:run`), lint (`npm run lint`), dan kompilasi produksi (`npm run build`) keluar dengan kode 0 (lulus 100%).
