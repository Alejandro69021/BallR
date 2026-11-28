# BallR Vision (Lite) — Pipeline Analisis Video Otomatis

Folder ini berisi skrip Python & Notebook Google Colab ringan untuk menganalisis rekaman pertandingan sepak bola (YouTube / YouTube Live atau MP4 lokal) secara otomatis, lalu menghasilkan berkas `ballr_analysis.json` yang langsung bisa diimpor ke web **BallR**.

## Teknologi & Lisensi (Bebas AGPL)
- **RF-DETR** (Apache 2.0): deteksi pemain dan bola *real-time*.
- **Supervision + ByteTrack** (MIT): pelacakan ID pemain antar-frame.
- **KMeans Jersey Clustering** (BSD): pemisahan otomatis warna kostum **Tim Kita (`own`)** vs **Lawan (`opponent`)**.
- **yt-dlp**: mengunduh potongan menit tertentu dari tautan YouTube Live tanpa perlu mengunduh seluruh video 4 jam.

## Cara Pakai Paling Ringan (Google Colab GPU Gratis)
1. Buka [Google Colab](https://colab.research.google.com/) dan pilih **Upload notebook** → pilih `vision/ballr_vision_colab.ipynb`.
2. Ubah runtime ke **T4 GPU** (*Runtime → Change runtime type → T4 GPU*).
3. Atur `YOUTUBE_URL`, `START_SEC`, dan `END_SEC` (bawaan sudah terisi tautan *Seri A Liga Sleman 2026 — AMS Seyegan vs PS Palma*).
4. Jalankan semua sel (*Run all*). Setelah selesai, berkas `ballr_analysis.json` otomatis terunduh.
5. Buka web **BallR** → menu **Laga** → buka laga → tab **Analisis Taktis** → klik **Impor Tracking JSON** dan pilih `ballr_analysis.json`. Seluruh metrik ilmiah dan **Replay 3D Perspektif** langsung terisi otomatis.

## Catatan Kejujuran Data
Deteksi otomatis dari satu kamera pinggir lapangan adalah **estimasi awal** (tergantung sudut kamera dan resolusi). Setiap keluaran menyertakan `vision_quality` (jumlah frame, persentase deteksi bola, rata-rata pemain terdeteksi) agar pelatih dan dosen dapat menilai keandalannya secara transparan.
