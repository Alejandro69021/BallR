# Identitas Merek ProspekBola

Letakkan di `docs/BRAND_SPEC.md`. Berkas logo (`logo-mark.svg`, `logo-mark-light.svg`, `favicon.svg`) ditaruh di `public/brand/`. **Jangan menggambar ulang logo**; pakai berkas yang disediakan.

## 1. Gagasan inti

> **Paspor + garis lapangan.**

Setiap anak punya paspor yang berisi riwayatnya, dan semuanya dicatat di atas "lapangan" yang sama. Dari situ semua unsur visual diambil: sampul paspor, garis tengah dan lingkaran tengah, rompi latihan berwarna lime, nomor punggung.

Kalimat penanda: **"Catat laganya. Bangun paspor pemainnya."**
Sifat: **tegas, hangat, jujur.** Bukan "teknologi canggih" dan bukan "AI".

## 2. Logo

- **Lambang (`logo-mark.svg`)**: sampul paspor hijau lapangan; garis tengah dan lingkaran tengah warna kapur; satu titik lime di kanan atas dengan garis kecil dari lingkaran, yaitu "prospek" yang sedang naik.
- **Wordmark**: teks "PROSPEK" + "BOLA" dalam blok lime, Barlow Condensed 800, kapital. Dibuat dengan komponen `Wordmark` (bukan SVG) supaya memakai font aplikasi.
- **Versi**: gelap (lambang hijau, untuk latar terang dan gelap), terang (`logo-mark-light.svg`, lambang lime untuk latar hijau tua), `favicon.svg`.
- **Ukuran minimum**: lambang 24 px; wordmark penuh 120 px lebar.
- **Ruang aman**: setengah tinggi lambang di semua sisi.
- **Dilarang**: mengubah warna, memutar, memberi bayangan/gradien, menambah bola 3D, meregangkan.

## 3. Warna

| Nama | Hex | Peran |
|---|---|---|
| Pitch | `#0B3A2A` | Latar identitas (hero, kaki, bagian prinsip), lambang |
| Pitch-2 | `#0F4A35` | Kartu di atas Pitch |
| Bib (lime) | `#D2F23F` | Sorotan identitas: tombol utama di latar gelap, penanda, strip, stempel |
| Chalk | `#F4F5EE` | Latar halaman terang, teks di atas Pitch |
| Ink | `#10201A` | Teks utama, garis tebal |
| Mint | `#D5E6DC` / `#BFD8CB` | Teks sekunder di atas Pitch |

Warna fungsional aplikasi **tidak berubah**: aksi utama di dalam aplikasi tetap `--brand` (`#17744A`), plus `warning`, `danger`, `success`, dan seri grafik. Identitas ditambahkan sebagai token baru (`--pitch`, `--pitch-2`, `--bib`, `--chalk`, `--ink`), bukan menggantikan token lama, supaya kontras dan tes yang ada tidak pecah.

Kontras terukur (WCAG, semua ≥ 4,5:1): Ink di Bib 13,5 · Pitch di Bib 10,0 · Chalk di Pitch 11,6 · Bib di Pitch 10,0 · Bib di Pitch-2 8,1 · Mint di Pitch 9,8 / 8,4 · Teks sekunder `#3C4A42` di Chalk 8,5 · Turf di Chalk 5,3.
**Aturan keras:** Bib di atas terang hanya 1,16:1. Jadi lime **tidak pernah** dipakai sebagai warna teks atau garis tipis di latar terang; hanya sebagai isi blok yang teksnya Ink atau Pitch.

## 4. Huruf

| Peran | Huruf | Aturan |
|---|---|---|
| Judul identitas | **Barlow Condensed 800**, kapital | Judul halaman/seksi, angka besar, nama merek. Maks. 6 kata per judul. Ukuran ≥ 24 px. |
| Isi | IBM Plex Sans | Semua kalimat, label, tombol, tabel, formulir. |
| Angka/kode | IBM Plex Mono | Hanya stopwatch, hash, ID, nilai numerik sejajar. |

Barlow Condensed di-host sendiri lewat `@fontsource/barlow-condensed` (bobot 700 dan 800, subset latin), sama seperti font lain, tanpa panggilan ke luar. Tidak dipakai di tabel padat, formulir, atau paragraf.

## 5. Motif (kosakata visual)

1. **Garis lapangan**: lingkaran tengah, garis tengah, kotak penalti, digambar tipis (kapur, opasitas 11–13%) sebagai latar bagian gelap. Komponen `PitchLines`.
2. **Stempel "Data contoh fiktif"**: lingkaran bergaris lime, teks kapital, miring −12°. Dipakai di tangkapan layar pada halaman depan. **Tidak menggantikan** spanduk demo di dalam aplikasi.
3. **Ubin nomor punggung**: kotak Pitch dengan angka lime (`#10`). Dipakai untuk pemain di paspor, pemilih pemain, dan kartu.
4. **Angka besar berkontur** (01, 02, 03): penomoran bagian, memakai Barlow Condensed, kontur Pitch tanpa isi (di latar terang).
5. **Strip lime**: pita lime penuh lebar berisi pernyataan prinsip dalam kapital.
6. **Bayangan keras**: blok lime digeser 16 px di belakang bingkai berborder Ink, tanpa blur. Untuk tangkapan layar di halaman depan.

## 6. Di mana identitas dipakai, dan di mana tidak

| Tempat | Perlakuan |
|---|---|
| Halaman depan `/` | Penuh: hero Pitch bergaris lapangan, strip lime, angka besar, stempel, blok CTA lime. |
| Cangkang aplikasi (nav, header halaman, tur, keadaan kosong, 404, pemuatan) | Lambang + wordmark, judul halaman Barlow, ubin nomor punggung, ilustrasi garis lapangan. |
| Tabel, formulir, pencatat laga, papan taktik, grafik | **Tidak berubah.** Keterbacaan di bawah matahari lebih penting daripada gaya. |
| Laporan resmi A4 dan halaman verifikasi | Tetap kertas netral. Hanya lambang kecil di kepala/kaki. |
| Peringatan, galat, spanduk demo | Tetap warna fungsional. Spanduk demo tidak boleh diganti dengan motif. |

## 7. Nada suara

Kalimat pendek, kata kerja di depan, tanpa hiperbola, tanpa klaim yang belum ada. Aturan kejujuran data di `LANDING_SPEC.md` bagian 2 berlaku untuk semua teks bermerek.

| Hindari | Pakai |
|---|---|
| "Platform analitik sepak bola terdepan" | "Catat laganya. Bangun paspor pemainnya." |
| "Solusi cerdas berbasis AI" | "Semua kejadian dicatat pelatih, bukan ditebak mesin." |
| "Belum ada data untuk ditampilkan" | "Belum ada data." |
| "Selamat datang di dashboard Anda" | "Apa yang mau kamu kerjakan hari ini?" |

## 8. Gerbang otomatis

1. `brandTokens.test.js`: token identitas ada, dan setiap pasangan teks/latar di tabel kontras bagian 3 ≥ 4,5:1.
2. `ui-check` aturan baru: elemen dengan `font-family` Barlow hanya boleh ada pada kelas `.font-display` dan tidak boleh berada di dalam `table`, `form`, `input`, `textarea`, atau berisi teks > 6 kata.
3. `ui-check`: tidak ada teks berwarna `--bib` di atas latar terang (hitung kontras elemen teks, gagal bila < 4,5).
4. Lambang tampil di nav, favicon, dan ikon PWA (diperiksa keberadaan berkas dan tag `<link rel="icon">`).
