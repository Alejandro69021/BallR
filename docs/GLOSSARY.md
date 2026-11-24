# Glosarium Istilah Ramah Pelatih (docs/GLOSSARY.md)

Dokumen ini mendokumentasikan pemetaan istilah teknis (*jargon*) ke dalam bahasa Indonesia sederhana yang ramah pelatih rumput akar (*grassroots*), sesuai **Prinsip UX 4: Plain Indonesian for coaches**.

---

## 1. Prinsip Bahasa & Kejujuran Data

1. **Jelas dan Wajar**: Gunakan kosakata bahasa Indonesia yang langsung dipahami pelatih di lapangan tanpa perlu latar belakang statistik atau ilmu data.
2. **Tidak Mengklaim Kepastian Semu**: Jangan gunakan istilah yang memberi ilusi kesimpulan mutlak. Kejadian dicatat manual (bukan optik otomatis), jumlah sampel selalu disertakan ($n$), dan metrik lanjutan dibatasi hanya sebagai indikasi awal.
3. **Pemisahan Antarmuka vs. Metodologi**:
   - Di antarmuka kerja harian (Beranda, Detail Laga, Papan Catat, Evaluasi): gunakan istilah sederhana dan sertakan komponen tooltip `<Term>`.
   - Di bagian metodologi laporan resmi (*Lampiran Metode*, *Kriptografi Integritas*, sitasi riset): nama teknis rujukan ilmiah tetap dicantumkan persis demi akuntabilitas akademik.

---

## 2. Tabel Pemetaan Istilah Utama

| Istilah Teknis Asli (Jargon) | Istilah Sederhana di Antarmuka | Penjelasan Tooltip (`<Term>`) | Lokasi Kemunculan di UI |
| :--- | :--- | :--- | :--- |
| **Snapshot** | **Laporan terkunci** | Dokumen hasil pertandingan yang telah dikunci dan diverifikasi keasliannya dengan kode hash kriptografis. | `/laga/:id`, `/laga/:id/laporan`, `/verifikasi/:hash` |
| **Bekukan laporan** | **Kunci laporan** | Mengunci catatan pertandingan agar resmi, permanen, dan tidak dapat diubah lagi untuk menjamin kejujuran data. | `/laga/:id/laporan` (tombol utama & dialog verifikasi) |
| **versi beku** | **versi terkunci** | Salinan data yang telah dikunci resmi pada tanggal tertentu oleh pemeriksa. | `/laga/:id/laporan` (tombol peralihan data & badge) |
| **Peninjau / Reviewer** | **Pemeriksa** | Pelatih lain dari akademi yang sama atau admin yang memeriksa dan menyetujui keabsahan catatan laga. | `/laga/:id/laporan`, `/taktik/:id`, `/bantuan` |
| **Kisi 6x3 zona** | **Peta zona (6×3)** | "Lapangan dibagi 6 kolom × 3 baris untuk melihat di area mana kejadian terjadi." | `/laga/:id` (Tab Peta lapangan), `/laga/:id/laporan` |
| **Keterlibatan** | **Keterlibatan pemain** | "Berapa kali pemain tercatat terlibat dalam kejadian." | `/laga/:id` (Tab Pemain), modal rekap akhir laga |
| **Distribusi kejadian** | **Jenis kejadian** | Ringkasan jumlah kejadian per tipe aksi (umpan, tembakan, tekel, intersep, dll.). | `/laga/:id` (Tab Ringkasan), modal rekap akhir laga |
| **Bio-banding** | **Kelompok kematangan tubuh** | "Pengelompokan pemain menurut tahap pertumbuhan tubuh, bukan hanya umur." | `/pemain/:id/pertumbuhan` (kartu kematangan fisik) |
| **PPDA** | **PPDA (Intensitas Pressing)** | "Passes Allowed per Defensive Action: rasio umpan lawan sebelum aksi bertahan tim kita. Mengindikasikan intensitas tekanan, bukan ukuran mutlak kualitas tim." | Hanya di `/laga/:id/laporan` (Bagian Metodologi & Intensitas Pressing) |

---

## 3. Komponen `<Term>` (`src/components/ux/Term.jsx`)

Komponen pembantu inline yang memberikan penjelasan singkat ketika disentuh atau disorot oleh pelatih:

### Perilaku & Aksesibilitas
- **Pemicu multi-input**: Terbuka lewat *hover* kursor, fokus keyboard (*Tab*), dan ketukan (*tap* pada layar sentuh/ponsel). Tidak eksklusif *hover-only*.
- **Aria connection**: Terhubung semantik lewat `aria-describedby` ke `id` tooltip penjelasan.
- **Escape to close**: Menekan tombol `Escape` menutup tooltip dan mengembalikan fokus ke tombol istilah.
- **Target sentuh**: Memiliki kelas ukuran `min-h-[44px] min-w-[44px]` untuk kepatuhan target ketuk jari di perangkat seluler.
- **Desain visual**: Menggunakan garis bawah bertitik halus (`underline decoration-dotted`) dengan ikon bantuan (`HelpCircle`) lembut agar tidak mengganggu keterbacaan teks utama.

### Contoh Pemakaian
```jsx
import Term from '../components/ux/Term';

// Standalone trigger dengan teks istilah
<Term
  term="Peta zona (6×3)"
  explanation="Lapangan dibagi 6 kolom × 3 baris untuk melihat di area mana kejadian terjadi."
/>

// Label di samping heading
<div className="flex items-center gap-1.5">
  <h2 className="text-sm font-semibold text-1">Keterlibatan pemain</h2>
  <Term
    explanation="Berapa kali pemain tercatat terlibat dalam kejadian."
  />
</div>
```

---

## 4. Batasan & Pengecualian Resmi (Allow-list)

Istilah berikut **tetap dipertahankan** pada ranah teknis dan hukum:
1. **Pustaka Rujukan Ilmiah** (`src/data/references.js`):
   - Judul riset seperti *"Review of maturity-matching and bio-banding in youth sport"* dan *"Defensive Metrics: Measuring the Intensity of a High Press (PPDA)"* tidak diterjemahkan agar peneliti dan akademisi dapat melacak sumber primer.
2. **Klausul Persetujuan & Hukum** (`docs/CONSENT_DRAFT.md`, `ConsentManagerModal.jsx`):
   - Istilah legal perlindungan data pribadi anak (UU PDP No. 27/2022) tetap mengikuti formulasi hukum resmi.
3. **Nama Variabel & API Kriptografis** (`src/lib/integrity.js`, `src/lib/report.js`):
   - Parameter kode internal seperti `snapshot_hash`, `computeSnapshotHash`, `events_digest`, dan skema tabel database Supabase tetap stabil tanpa perubahan logika.
