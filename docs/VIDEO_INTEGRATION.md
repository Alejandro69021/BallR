# Integrasi Video Pertandingan Lokal (Fase A)

## Prinsip Privasi & Arsitektur
1. **100% Pemutaran Lokal**: Berkas rekaman video pertandingan diputar langsung dari peranti pengguna menggunakan API standar peramban (`URL.createObjectURL`).
2. **Nir-Unggah (Zero Network/Storage)**: Berkas video tidak pernah diunggah ke peladen, basis data, Supabase Storage, atau pihak ketiga mana pun.
3. **Penyimpanan Metadata Ringan**: Hanya nama berkas, ukuran, dan durasi yang disimpan di `localStorage` per perlawanan (`ballr_video_meta_<matchId>`) untuk memfasilitasi peringatan pemilihan ulang berkas setelah memuat ulang halaman.
4. **Skema Basis Data**:
   - Kolom `video_time_s NUMERIC(8,1) NULL` ditambahkan pada tabel `match_events` melalui migrasi `010_event_video_time.sql`.
   - Nilai valid berada di rentang 0 hingga 14.400 detik (maksimal 4 jam).
5. **Integritas Laporan Beku**:
   - Kolom `video_time_s` secara sengaja **tidak dimasukkan** ke dalam payload kanonikal laporan pertandingan (`canonical_payload`) atau `snapshot_hash`.
   - Hal ini menjamin reproduksibilitas hash kriptografis laporan beku tetap identik baik dengan maupun tanpa penandaan waktu video.
6. **Offset Sinkronisasi**:
   - Pelatih dapat menentukan titik waktu video saat peluit mulai dibunyikan untuk Babak 1 dan Babak 2 (format `mm:ss`), serta menit laga awal Babak 2 (`p2StartMin`).
   - Jam pertandingan (stopwatch) bersifat kontinu (tidak di-reset saat pindah babak), sehingga penandaan waktu video Babak 2 memerlukan menit awal pertandingan (contoh: 45 untuk babak 45 menit, 35 untuk 2x35).
   - Formula kalkulasi:
     - Babak 1: `menit = max(0, (waktu_video - p1) / 60)`.
     - Babak 2: `menit = p2StartMin + max(0, (waktu_video - p2) / 60)`.
   - Hasil kalkulasi dibatasi maksimal 130 menit sesuai batasan basis data.
   - Apabila offset atau p2StartMin tidak lengkap untuk babak aktif, sistem tidak menebak secara sepihak dan tetap menggunakan stopwatch pencatat laga.
