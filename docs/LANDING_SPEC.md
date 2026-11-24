# Spesifikasi Halaman Depan ProspekBola (Landing Page)

Dokumen ini adalah sumber kebenaran untuk halaman depan publik. Letakkan di `docs/LANDING_SPEC.md`.
Desain visualnya ada di artefak desain "ProspekBola — Halaman Depan" (desktop dan HP). Bila teks di desain dan di dokumen ini berbeda, **dokumen ini yang menang**.

## 1. Tujuan dan pembaca

- **Tujuan:** pengunjung memahami dalam 10 detik apa itu ProspekBola, untuk siapa, apa yang bisa dilakukan hari ini, dan apa yang belum ada. Lalu bisa mencoba demo atau menghubungi untuk uji coba.
- **Pembaca utama:** pengelola akademi dan pelatih sepak bola usia muda (U-13 ke atas).
- **Pembaca kedua:** orang tua, dosen penguji, calon mitra.
- **Bukan tujuan:** menjual langganan, memamerkan angka pengguna, atau menjanjikan fitur yang belum jadi.

## 2. Aturan kejujuran (WAJIB, sama kerasnya dengan di dalam aplikasi)

Halaman ini membawa nama produk keluar ke publik, jadi aturan datanya tidak boleh lebih longgar daripada aplikasinya.

1. Hanya tulis fitur yang ada di README bagian "Fitur yang Benar-Benar Ada". Yang belum ada hanya boleh muncul di kolom "Sedang disiapkan" atau "Belum ada".
2. **Dilarang:** testimoni, logo klub/mitra, jumlah pengguna/akademi/laga, persentase, "ribuan", rating bintang, harga, "terbukti", "terbaik", "nomor 1", "terakreditasi", "resmi" (sebagai klaim produk), "bersertifikat", "AI", "kecerdasan buatan", "scouting", "prediksi bakat", peringkat/OVR untuk anak, "aman 100%", "sesuai UU PDP" (hanya boleh "dirancang dengan memperhatikan prinsip UU PDP").
3. Setiap tangkapan layar harus berlabel "data contoh fiktif" dan berasal dari aplikasi sungguhan (dibuat ulang oleh skrip, bukan dibuat tangan).
4. Tidak ada formulir yang mengumpulkan data pribadi (nama, email, nomor HP) selama belum ada backend dan kebijakan privasi yang ditinjau. Kontak lewat `mailto:` saja.
5. Data anak nyata belum diterima. Halaman harus mengatakannya terang-terangan (lihat FAQ).

## 3. Rute dan perilaku

| Rute | Isi | Catatan |
|---|---|---|
| `/` | **Halaman depan publik** | Selalu tampil, untuk siapa pun (belum masuk maupun sudah masuk). Tanpa `TopNav` aplikasi; punya bilah atasnya sendiri. Selalu tema terang. |
| `/beranda` | Beranda pelatih (isi `HomePage` yang sekarang ada di `/`) | Tujuan setelah masuk dan setelah "Coba demo". Item menu "Beranda" menunjuk ke sini. |
| `/privasi` | Kebijakan privasi (draf) | Halaman sederhana, wajib berlabel "Draf, belum ditinjau penasihat hukum". |
| rute lain | tidak berubah | `/skuad`, `/laga`, `/taktik`, `/penilaian/:id`, dll. |

Tombol di halaman depan:

- **"Coba demo"**: pada build mode demo (`VITE_DEMO_MODE=true`) mengarah ke `/beranda`. Pada build mode riil, bila `VITE_DEMO_URL` terisi, mengarah ke URL itu (demo dipasang terpisah). Bila tidak ada keduanya, tombol **disembunyikan** dan diganti "Minta akses uji coba" (`mailto:`). Jangan pernah menampilkan tombol demo yang mengarah ke jalan buntu.
- **"Masuk"**: membuka `AuthModal` yang sudah ada. Setelah berhasil, navigasi ke `/beranda`.
- Pengguna yang sudah masuk melihat tombol "Buka aplikasi" (ke `/beranda`) sebagai ganti "Masuk".
- Kontak: `mailto:` memakai `VITE_CONTACT_EMAIL`. Bila kosong, tampilkan teks "Hubungi pengembang" tanpa tautan, jangan tampilkan placeholder `[EMAIL KONTAK]` di produksi.

## 4. Struktur halaman (urutan, id jangkar, isi)

Satu `<h1>` saja. Gunakan landmark `header`, `main`, `footer`, `nav` berlabel, dan tautan "Lompat ke konten".

1. **Bilah atas** — Merek "ProspekBola"; tautan `#fitur`, `#cara-kerja`, `#prinsip`, `#status`, `#tanya`; tombol "Masuk" dan "Coba demo".
2. **Hero**
   - Label kecil (pil bergaris lime): "Akademi sepak bola usia muda · U-13+"
   - H1 (Barlow Condensed, kapital; kata "paspor" di blok lime miring −1,5°): "Catat laganya. Bangun paspor pemainnya."
   - Paragraf: "Catat kejadian laga dari pinggir lapangan, simpan riwayat perkembangan tiap anak, lalu hasilkan laporan yang bisa dikunci dan diperiksa keasliannya. Tanpa peringkat untuk anak, tanpa angka karangan."
   - Tombol: "Coba demo", "Lihat fitur"
   - Tiga butir kecil: "Demo memakai data fiktif" · "Jalan di peramban HP dan laptop" · "Belum ada biaya: tahap uji coba"
   - Gambar: tangkapan layar Beranda dalam bingkai peramban dengan blok lime bergeser di belakangnya, plus komponen `DataStamp` ("Data contoh fiktif") di pojok kanan atas.
   - Tepat di bawah hero: strip lime penuh lebar berisi empat prinsip singkat (kapital): Tanpa peringkat untuk anak · Angka mentah dulu · "Belum ada data" bila kosong · Laporan bisa diperiksa.
3. **Masalah** — H2 "Catatan akademi sering tercecer." Pengantar: "Kehadiran, statistik laga, dan perkembangan fisik anak biasanya tersebar. Saat pelatih atau klub berganti, riwayatnya ikut hilang." Tiga kartu: "Kertas dan Excel" (Lembar yang berbeda di tiap pelatih, sulit digabung, mudah hilang.) · "Grup WhatsApp" (Catatan laga terkubur di antara pesan lain dan tidak bisa dicari ulang.) · "Riwayat ikut pergi" (Ganti pelatih atau klub, data perkembangan anak ikut terputus.)
4. **Fitur utama `#fitur`** — H2 "Tiga hal yang dikerjakan ProspekBola dengan baik." Pengantar: "Semua yang tampil di bawah sudah berjalan di aplikasi hari ini. Gambar adalah tangkapan layar nyata dengan data contoh fiktif." Tiga baris gambar+teks (gambar bergantian kiri/kanan):
   - **Saat laga** — "Catat langsung dari pinggir lapangan". Isi: "Papan sentuh yang cukup dipakai satu jempol: umpan, tembakan, tekel, intersep, dan aksi lain dicatat per menit. Video laga bisa diputar dari perangkatmu untuk menyamakan menit kejadian. Videonya tidak diunggah ke mana pun." Butir: Stopwatch laga dan penanda babak · Sumber waktu ditandai jelas: video atau stopwatch · Dirancang tetap bisa mencatat tanpa sinyal (belum diuji di lapangan). Gambar: Pencatat laga (desktop) + bingkai HP kecil (Pencatat 390 px).
   - **Setelah laga** — "Pahami laga setelah peluit akhir". Isi: "Ringkasan jumlah kejadian menurut jenis, daftar kejadian per menit, dan peta lapangan dengan penanda aksi, alur umpan, serta kepadatan per zona (6×3)." Butir: Setiap angka disertai jumlah kejadian (n) · Langkah berikutnya selalu ditunjukkan di layar · Laporan 9 bagian siap cetak A4. Gambar: Detail laga.
   - **Antar musim** — "Paspor perkembangan untuk setiap pemain". Isi: "Identitas, posisi, tes kebugaran, riwayat tinggi dan berat badan, serta rapor evaluasi pelatih dikumpulkan dalam satu paspor. Tidak lagi tercecer di kertas dan grup WhatsApp." Butir: Kelompok kematangan tubuh: estimasi non-invasif, bukan diagnosis · Atribut dinilai dengan rubrik deskriptif, tanpa peringkat · Paspor bisa dicetak dan keasliannya diperiksa. Gambar: halaman Pertumbuhan/Paspor.
5. **Fitur pendukung** — H2 "Dan fitur pendukung lainnya". Enam kartu: Papan taktik animasi · Laporan terkunci · Direktori skuad · Evaluasi pelatih · Tes kebugaran · Panduan dan rujukan (teks persis seperti di desain).
6. **Cara kerja `#cara-kerja`** — H2 "Dari kick-off sampai laporan, empat langkah." 1 Buat laga · 2 Catat kejadian · 3 Selesaikan laga · 4 Buat laporan (teks seperti di desain).
7. **Prinsip data `#prinsip`** (bagian hijau tua) — H2 "Jujur dengan data, terutama data anak." Empat kartu: Tanpa peringkat untuk anak · Angka mentah dulu (n ≥ 10 untuk persentase, sesuai `SMALL_SAMPLE_N`) · "Belum ada data" bila kosong · Laporan yang bisa diperiksa (pemeriksa harus pelatih lain bila staf lebih dari satu).
8. **Status `#status`** — H2 "Di mana posisi ProspekBola hari ini." Tiga kolom: **Ada hari ini** / **Sedang disiapkan** / **Belum ada** (daftar persis seperti di desain; "Belum ada" memuat: unggah video ke server, analisis video otomatis, perkiraan tinggi dewasa). Tanpa tanggal peluncuran.
9. **Tanya jawab `#tanya`** — lima pertanyaan (`<details>`/`<summary>` asli): biaya, keamanan data anak, perlu internet, analisis video/AI, rentang usia. Jawaban persis seperti di desain.
10. **Ajakan uji coba `#cta`** — H2 "Ingin mencoba di akademimu?" Teks: "ProspekBola masih tahap uji coba dan belum menjual langganan. Kami mencari akademi yang mau mencoba bersama pelatihnya, sambil tetap memakai data contoh sampai keamanan datanya siap." Tombol "Coba demo" dan "Hubungi: <email>".
11. **Kaki** — Merek, satu kalimat deskripsi, "Di demo, semua data fiktif dan hanya tersimpan di peramban kamu."; tautan `Panduan` (`/bantuan`), `Rujukan` (`/rujukan`), `Kebijakan privasi (draf)` (`/privasi`), `Kontak`; baris hak cipta dari `VITE_PUBLISHER_NAME` dan tahun berjalan.

## 5. Visual

Seluruh identitas visual didefinisikan di `docs/BRAND_SPEC.md`; bagian ini hanya menerapkannya. Bila bertentangan, BRAND_SPEC menang.

- Huruf: judul (H1, H2, H3, angka besar, merek) memakai Barlow Condensed 800 kapital (`.font-display`); isi memakai IBM Plex Sans; mono hanya untuk angka/kode, bukan kalimat. Badan 18 px, keterangan ≥ 14 px, H1 `clamp(42px, 5.3vw, 76px)`.
- Warna: Pitch `#0B3A2A` (hero, prinsip data, kaki), Bib lime `#D2F23F` (tombol utama di atas Pitch, strip, blok CTA, penanda; **hanya sebagai isi, teks di atasnya Ink/Pitch**), Chalk `#F4F5EE` (latar), Ink `#10201A`. Semua teks ≥ 4,5:1.
- Motif: garis lapangan (`PitchLines`) sebagai latar hero, prinsip, dan CTA; angka besar berkontur 01–03 di baris fitur; ubin nomor punggung `#10` pada gambar paspor; `DataStamp` di hero; bayangan keras lime di belakang bingkai tangkapan layar (tanpa blur).
- Bilah atas di HP: hanya merek + tombol (tautan navigasi disembunyikan di bawah 768 px, jangan dibiarkan membungkus dua baris).
- Bingkai peramban dan bingkai HP hanya dekorasi CSS. Tidak ada emoji, gradien dekoratif, atau ilustrasi karangan.
- Lebar isi maks 1160 px, bantalan samping ≥ 16 px di HP, ≥ 24 px di layar lebih lebar. Flex-wrap, tanpa `100vh`.
- Gerak: tidak ada animasi wajib; hormati `prefers-reduced-motion`.

## 6. Gambar (tangkapan layar nyata)

Dibuat oleh skrip `scripts/landing-shots.mjs` dari mode demo, disimpan di `public/landing/*.jpg` (lebar maks 1200 px, kualitas 80, ≤ 100 KB per berkas) lalu di-commit. Rute: Beranda `/beranda`, Pencatat `/pencatatan/demo-match-draft-02` (1366 dan 390), Detail laga `/laga/demo-match-contoh-01`, Pertumbuhan `/pemain/WK-2026-0042/pertumbuhan`. Tema terang, `ballr_tour_done_v1=1`. Setiap `<img>` punya `alt`, `width`, `height`, dan `loading="lazy"` (kecuali gambar hero).

## 7. SEO dan berbagi

- `index.html`: `lang="id"`, `<title>` "ProspekBola — rapor perkembangan pemain dan catatan laga sepak bola usia muda", `meta description` (≤ 160 karakter, tanpa klaim terlarang), Open Graph (`og:title`, `og:description`, `og:type`, `og:image` memakai tangkapan layar hero), `meta name="theme-color"`.
- Rute aplikasi di balik login diberi `noindex`. `/` dan `/privasi` boleh diindeks.
- Catatan keputusan (bukan tugas sekarang): aplikasi ini SPA yang dirender di klien, jadi mesin pencari dan pratinjau tautan bisa kurang andal. Bila SEO penting saat komersial, pertimbangkan pra-render halaman `/` saat build.

## 8. Yang harus diisi pemilik (bukan Antigravity)

- `VITE_CONTACT_EMAIL`, `VITE_PUBLISHER_NAME`, `VITE_DEMO_URL` (bila demo dipasang terpisah) di `.env.local` / pengaturan hosting.
- Peninjauan hukum untuk `/privasi` dan naskah persetujuan wali (`docs/CONSENT_DRAFT.md`) sebelum data anak sungguhan masuk.
- Keputusan nama badan/pengelola yang tampil di kaki halaman.

## 9. Kriteria selesai

1. `/` menampilkan halaman depan, `/beranda` menampilkan Beranda pelatih, semua tes dan `ui-check` hijau.
2. Tidak ada kata terlarang (bagian 2) di berkas halaman depan; dijaga tes otomatis.
3. `npm run ui-check` mencakup `/` dan `/privasi` di 4 lebar × 2 tema tanpa gagal (landing dikecualikan dari aturan satu-penanda-demo dan dari kontainer aplikasi, tetapi wajib lolos aturan overflow, kontras, dan jarak tepi).
4. Dibaca di HP 390 px: tidak ada gulir ke samping, semua tombol ≥ 44 px.
