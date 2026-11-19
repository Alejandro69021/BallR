# Kebijakan Keamanan & Tata Kelola Data Anak (Security Architecture)

Dokumen ini memetakan arsitektur keamanan, mitigasi ancaman data pribadi anak (UU PDP No. 27/2022 Pasal 25), serta panduan konfigurasi peladen Supabase untuk **BallR (ProspekBola)**.

---

## 1. Ancaman yang Telah Ditangani (*Threats Handled*)

| Vektor Ancaman | Risiko | Solusi & Mekanisme Mitigasi | Bukti Implementasi |
|---|---|---|---|
| **Injeksi / Modifikasi Tanpa Izin (Anonymous Write)** | Pengunjung anonim memodifikasi data pemain, nilai rating, atau hasil tes fisik. | Row Level Security (RLS) diaktifkan pada seluruh tabel. Peran anonim (`anon`) dibatasi secara ketat hanya dapat membaca (*SELECT*) data pemain dengan status `visibility_tier = 'public'`. | `supabase/migrations/002_row_level_security.sql`, `supabase/tests/rls_test.sql` |
| **Kebocoran Data Antar-Akademi (*Cross-Tenant Leak*)** | Pelatih Akademi A dapat mengintip taktik, catatan medis, atau data pemain Akademi B. | Filter RLS di tingkat database berbasis `auth_profile_academy()`. Pelatih hanya memiliki hak baca/tulis terhadap pemain yang terdaftar dalam `academy_id` mereka. | `supabase/migrations/002_row_level_security.sql` |
| **Akses Tak Berwenang terhadap Data Anak (*Minor PII Exposure*)** | Pihak luar mengakses data pribadi anak (nama lengkap, tanggal lahir, NISN, foto). | *Privacy by Default*: Seluruh pemain baru berstatus `visibility_tier = 'private'`. Hak akses hanya diberikan kepada wali sah (`guardians`) dan pelatih terdaftar. | Kebijakan RLS `players_select_policy` |
| **Pelanggaran Minimisasi Data (*Over-fetching PII*)** | Tampilan publik memuat data lengkap anak melalui `select('*')`. | Proyeksi kolom eksplisit (*explicit column selection*). Laman publik hanya memuat `nickname`, `position`, `age_group`, `ovr_rating`. Data sensitif disembunyikan kecuali ada persetujuan wali aktif. | `src/lib/supabase.js` (`fetchPublicPlayerRecord`) |
| **Penyimpanan Cache Data Sensitif (*Offline SW Leaks*)** | Peramban atau service worker menyimpan cache respon API data anak di penyimpanan lokal (*CacheStorage*). | Service worker v2 (`public/sw.js`) menggunakan strategi *network-first* untuk navigasi dan mengecualikan secara permanen rute `/auth/`, `/rest/v1/`, dan pola data pribadi anak dari penyimpanan cache. | `public/sw.js` |
| **Pemalsuan Paspor & Sertifikat (*Integrity Tampering*)** | Data usia, kebugaran, atau statistik diubah saat ekspor/verifikasi. | Penerbitan paspor menghitung *SHA-256 cryptographic hash* dari payload kanonikal terurut (`src/lib/integrity.js`) dan menyimpannya di `passport_snapshots`. Halaman `/verifikasi/:hash` menghitung ulang keaslian data secara deterministik. | `src/lib/integrity.js`, `src/test/integrity.test.js` |
| **Klaim Akreditasi Palsu** | Menampilkan badge "Terverifikasi PSSI" tanpa dasar hukum. | Badge akreditasi hanya dirender jika terdapat catatan aktif pada tabel `academy_accreditations` dengan nomor registrasi federasi yang sah. | `src/components/OfficialDossierFooter.jsx` |
| **Pencabutan Persetujuan Wali (*Right to Revoke*)** | Wali tidak dapat membatalkan persetujuan pembagian data anak. | Fitur "Tarik Persetujuan" instan yang seketika mengubah visibilitas pemain menjadi `private`, menonaktifkan izin pemandu bakat, dan mencatat aksi ke tabel audit `access_log`. | `src/lib/supabase.js`, `src/components/growth/ConsentManagerModal.jsx` |

---

## 2. Risiko Terbuka & Rekomendasi Lanjutan (*Residual Risks*)

1. **Eksposur `VITE_SUPABASE_ANON_KEY` pada Klien**:
   - *Status*: Kunci anon publik adalah desain standar Supabase untuk aplikasi peramban.
   - *Mitigasi*: Menjaga agar kunci `service_role` **TIDAK PERNAH** dimasukkan ke dalam kode frontend atau berkas `.env` peramban. Seluruh izin dibatasi oleh kebijakan RLS.
2. **Penyalahgunaan Perangkat Bersama di Lapangan (*Shared Field Tablets*)**:
   - *Status*: Pelatih sering menggunakan satu tablet di tepi lapangan untuk mencatat laga.
   - *Mitigasi*: Tambahkan *auto-lock idle timer* (misal: 15 menit tanpa aktivitas otomatis mengunci sesi pelatih ke mode paspor publik).
3. **Pembatasan Frekuensi Permintaan (*Rate Limiting*)**:
   - *Status*: Endpoint verifikasi publik `/verifikasi/:hash` dapat menjadi sasaran *brute force*.
   - *Mitigasi*: Aktifkan fitur *Rate Limiting* di Supabase API Gateway / Cloudflare.
4. **Penyimpanan Berkas Media (Supabase Storage Buckets)**:
   - *Status*: Foto pemain dan klip video laga disimpan di Cloud Storage.
   - *Mitigasi*: Terapkan Storage RLS Policies pada bucket `player-media` agar berkas video hanya dapat diunduh jika pengguna memiliki izin sesuai visibilitas pemain.

---

## 3. Langkah Konfigurasi Dasbor Supabase (*Dashboard Setup Guide*)

Berikut adalah langkah-langkah yang wajib dijalankan oleh Administrator pada konsol web Supabase ([https://app.supabase.com](https://app.supabase.com)):

### Langkah 1: Jalankan Berkas Migrasi SQL
1. Masuk ke proyek Supabase Anda.
2. Buka menu **SQL Editor**.
3. Buat kueri baru dan jalankan secara berurutan:
   - `supabase/migrations/001_initial_schema_and_roles.sql`
   - `supabase/migrations/002_row_level_security.sql`
4. Buka menu **Database > Tables** dan pastikan seluruh 11 tabel berstatus **RLS Enabled**.

### Langkah 2: Konfigurasi Supabase Auth
1. Buka menu **Authentication > Providers > Email**.
2. Pastikan **Enable Email provider** aktif.
3. Rekomendasi: Aktifkan **Confirm email** untuk pelatih dan wali baru.
4. Pada **Authentication > URL Configuration**:
   - Atur **Site URL** ke domain produksi aplikasi (contoh: `https://ballr.app`).
   - Tambahkan URL redirect lokal untuk pengujian: `http://localhost:5173/**` dan `http://127.0.0.1:5173/**`.

### Langkah 3: Verifikasi Kunci Akses API
1. Buka menu **Project Settings > API**.
2. Salin **Project URL** ke `VITE_SUPABASE_URL` di berkas `.env`.
3. Salin kunci **`anon` `public`** ke `VITE_SUPABASE_ANON_KEY` di berkas `.env`.
4. **PERINGATAN**: Jangan pernah menyalin kunci `service_role` ke repositori atau berkas lingkungan klien!

### Langkah 4: Uji Coba Kebijakan RLS
1. Buka **SQL Editor**.
2. Jalankan isi berkas `supabase/tests/rls_test.sql`.
3. Pastikan seluruh pesan menampilkan status `PASSED` dan transaksi berhasil di-*rollback* tanpa galat.
