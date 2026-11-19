# Draf Formulir Persetujuan Pemrosesan Data Pribadi Anak (UU PDP No. 27/2022)

> [!CAUTION] PERLU DITINJAU AHLI HUKUM
> Draf dokumen ini dirancang semata-mata sebagai referensi teknis implementasi fitur privasi dan tata kelola data aplikasi BallR (ProspekBola). Dokumen ini **BUKAN** merupakan nasihat hukum resmi (*legal advice*). Manajemen akademi dan pengembang aplikasi wajib mengonsultasikan draf ini kepada advokat atau konsultan hukum berlisensi sebelum diberlakukan kepada orang tua atau wali atlet.

---

### Versi Dokumen: `v1.0-2026-10`
### Tanggal Draf: 28 Oktober 2026

---

## 1. Identitas Pengendali Data
Aplikasi **BallR (ProspekBola)** dioperasikan bersama oleh manajemen akademi sepak bola (pengendali data) dan penyedia platform digital guna mencatat rekam jejak perkembangan, antropometri, performa fisik, dan analisis taktis atlet sepak bola usia muda.

---

## 2. Landasan Hukum Pemrosesan Data Anak
Berdasarkan **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**:
- **Pasal 25 ayat (1)**: *Pemrosesan Data Pribadi anak diselenggarakan secara khusus.*
- **Pasal 25 ayat (2)**: *Pemrosesan Data Pribadi anak sebagaimana dimaksud pada ayat (1) wajib mendapat persetujuan dari orang tua anak dan/atau wali anak sesuai dengan ketentuan peraturan perundang-undangan.*

---

## 3. Rincian Kategori Data yang Dikumpulkan
Aplikasi membatasi pengumpulan data sesuai prinsip **Minimisasi Data** (*data minimization*):
1. **Identitas Dasar**: Nama panggilan (inisial), nomor punggung, posisi bermain, kelompok usia (misal: U-13).
2. **Data Pribadi Spesifik/Sensitif Anak**: Nama lengkap, tanggal lahir, Nomor Induk Siswa Nasional (NISN), foto profil atlet (hanya diproses dengan persetujuan eksplisit).
3. **Data Antropometri & Pertumbuhan**: Tinggi badan, berat badan, lingkar anggota tubuh, estimasi kematangan biologis (metode Khamis-Roche non-invasif).
4. **Data Kebugaran Fisik**: Hasil tes lari 20 meter, loncat tegak (vertical jump), kelincahan (shuttle run), dan uji daya tahan aerobik (Yo-Yo Intermittent Recovery Test).
5. **Data Taktis & Video Cuplikan**: Catatan statistik laga (umpan, tekel, intersep) dan klip video teknis aksi lapangan.

---

## 4. Pilihan Persetujuan Granular (*Granular Purposes*)
Orang tua atau wali berhak memilih secara mandiri tujuan pemrosesan berikut:

| Kode Tujuan | Nama Tujuan | Deskripsi Pemrosesan | Status Baku (*Default*) |
|---|---|---|---|
| `training_analysis` | **Analisis Latihan & Taktis Internal** | Data digunakan oleh pelatih akademi untuk memantau beban latihan, pertumbuhan biologis, dan rekomendasi menu drill atlet. | **Aktif** (Dasar keanggotaan akademi) |
| `share_with_scouts` | **Berbagi ke Pemandu Bakat (Scouts/Klub Mitra)** | Membuka akses paspor digital kepada pemandu bakat berlisensi atau klub sepak bola profesional resmi. | **Nonaktif** (Wajib persetujuan aktif) |
| `public_profile` | **Profil Publik Terbatas** | Menampilkan profil ringkas (nama panggilan, posisi, rating OVR) pada direktori pencarian publik tanpa data pribadi sensitif. | **Nonaktif** (Wajib persetujuan aktif) |
| `media` | **Publikasi Cuplikan Media / Turnamen** | Mengizinkan penayangan klip video aksi pertandingan atlet di laman showcase resmi akademi. | **Nonaktif** (Wajib persetujuan aktif) |

---

## 5. Hak Orang Tua / Wali Atlet
Sesuai UU PDP Bab IV mengenai Hak Subjek Data, orang tua atau wali berhak:
1. **Melihat dan Mengunduh**: Mengakses rekam jejak lengkap dan riwayat log akses (*access log*) data anak kapan saja melalui akun wali.
2. **Memperbarui Data**: Meminta koreksi atas data fisik atau biodata atlet yang keliru atau tidak mutakhir.
3. **Menarik Kembali Persetujuan (*Right to Revoke*)**:
   - Orang tua atau wali dapat sewaktu-waktu menekan tombol **"Tarik Persetujuan"** pada aplikasi.
   - Penarikan persetujuan berlaku seketika: profil atlet langsung diubah menjadi tingkat visibilitas **Privat**, data tidak dapat lagi diakses publik maupun pemandu bakat, dan aksi penarikan dicatat secara permanen di log audit (*access_log*).
4. **Hak Penghapusan (*Right to Erasure*)**: Meminta penghapusan permanen akun dan arsip data atlet setelah atlet lulus atau keluar dari akademi.

---

## 6. Tindakan Pengamanan Data
- Seluruh data yang disimpan dienkripsi saat transit (TLS 1.3) dan saat diam (*encryption at rest*).
- Setiap ringkasan paspor atlet dilindungi *cryptographic SHA-256 integrity hash* guna mencegah pemalsuan data kebugaran dan usia.
- Hak akses basis data dilindungi kebijakan *Row Level Security* (RLS) berlapis di tingkat peladen.
