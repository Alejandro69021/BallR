# Audit Sistem & Inventaris Hutang Teknis (BallR / ProspekBola)

> [!NOTE]
> Dokumen historis; lihat [README.md](../README.md) untuk kondisi terkini.

Dokumen ini memetakan arsitektur, kepatuhan data, kerentanan keamanan, dan inventaris desain dari repositori ProspekBola per November 2026. Audit ini disusun dalam **Mode Audit Mandiri** tanpa mengubah kode sumber aplikasi.

---

## 1. Peta Arsitektur (Architecture Map)

### 1.1 Navigasi Utama (`currentView` di `src/App.jsx`)
`currentView` merupakan *state* sentral di `App.jsx` yang mengontrol tampilan layar tunggal:
- `'passport'`: Menampilkan paspor bakat atlet (`PlayerHeader`, `PerformanceRadar`, `FitnessStrip`, `AICoachCard`, `OfficialDossierFooter`).
- `'match'`: Menampilkan konsol laga terpadu (`InteractiveMatchHub` yang membungkus pemutar video klip dan `TacticalAnalyticsHub`).
- `'growth'`: Menampilkan modul pertumbuhan biologis atlet (`GrowthBioBandingTab`).
- `'roster'`: Menampilkan direktori pemain akademi (`SquadHubView`).
- `'logger'`: Menampilkan *fast pitch tap pad* khusus pelatih di pinggir lapangan (`FastPitchLogger`).
- `'assessment'`: Menampilkan formulir penilaian teknis pelatih (`CoachAssessmentView`).

**Modals & Overlays Global (`App.jsx`)**:
- `PinAuthModal`: Penjaga akses peran pelatih (dipicu saat publik mengakses `'assessment'` atau `'logger'`).
- `StoryFlexCardModal`: Generator kartu 9:16 menggunakan `html-to-image`.
- `VideoModal`: Pemutar vertikal klip aksi 9:16.
- `Toast`, `OfflineIndicator`, `InstallAppBanner`.

### 1.2 Kepemilikan Data (Data Ownership)
| Komponen | Data yang Dimiliki / Dikelola | Sumber Asal |
|---|---|---|
| `App.jsx` | `players` (array), `selectedPlayerId`, `userRole` | Supabase `fetchLiveRosterFromSupabase()` dengan fallback ke `src/data/mockData.js`. |
| `CoachAssessmentView.jsx` | `formData` (skor 6 atribut, tes fisik, catatan narasi) | Kloning lokal dari `activePlayer` saat pemain berganti; mutasi ke `handleSaveAssessment`. |
| `FastPitchLogger.jsx` | `timerSeconds`, `matchHalf`, `events` (log sentuhan), `stats` | State lokal mandiri; disinkronkan ke `App.jsx` via `onFinishMatch`. |
| `GrowthBioBandingTab.jsx` | `bioSpecs`, `metricsData` (kurva sprint, jump, ovr), `anthropometryLogs` | **100% hard-coded statis** di dalam berkas komponen. |
| `TacticalAnalyticsHub.jsx` | `vaepMetrics`, `filanesiaPhases`, `fifaLanguageKpis`, `prescribedDrill` | **100% hard-coded statis** di dalam berkas komponen. |
| `InteractiveMatchHub.jsx` | `matchInfo`, `allEvents` (daftar timestamp laga & URL video) | **100% hard-coded statis** dengan video stock pihak ketiga. |
| `PitchScannerModal.jsx` | `testState`, `liveMetrics`, `testResult` | Generator angka acak berbasis matematika sinus buatan. |

### 1.3 Pembacaan & Penulisan Supabase (`src/lib/supabase.js`)
- **Inisialisasi**: `createClient(supabaseUrl, supabaseAnonKey)` dengan fallback URL dan token anonim publik yang di-hardcode di kode.
- **Operasi Baca (`fetchLiveRosterFromSupabase`)**:
  - `supabase.from('academies').select('*').limit(1)`: Mengambil data identitas akademi.
  - `supabase.from('players').select('*, player_assessments(*), fitness_records(*), video_highlights(*)')`: Mengambil seluruh baris pemain beserta relasinya.
  - Mengonversi data mentah melalui fungsi `transformDbPlayer(dbPlayer, academy)`.
- **Operasi Tulis (`saveAssessmentToSupabase` & `insertFitnessRecordToSupabase`)**:
  - `supabase.from('players').update({ ovr_rating }).eq('id', playerId)`: Mutasi tabel pemain langsung dari klien publik.
  - `supabase.from('player_assessments').upsert(...)`: Memperbarui penilaian pelatih.
  - `supabase.from('fitness_records').insert(...)`: Menambahkan hasil tes kebugaran baru.
- **Fallback ke `mockData.js`**:
  - Jika Supabase gagal tersambung (koneksi terputus, query error, atau URL dummy), `App.jsx` menangkap error dan langsung menyajikan `playersRoster` dari `src/data/mockData.js`.
  - Pada `transformDbPlayer`: Jika data relasi database bernilai kosong/null, fungsi secara otomatis menambal atribut radar, tes fisik, dan video klip dengan nilai bawaan statis (`DEFAULT_GROUP_AVGS`, foto Unsplash, video Mixkit).

---

## 2. Inventaris Data Palsu / Simulasi Tanpa Rujukan (Data Honesty Table)

Tabel berikut mencatat seluruh titik dalam kode yang menyajikan data buatan/simulasi seolah-olah merupakan pengukuran riil atau kalkulasi nyata:

| Berkas | Baris (Kisaran) | Yang Ditampilkan ke Pengguna | Mengapa Bukan Data Riil | Rencana Perbaikan (Proposed Fix) |
|---|---|---|---|---|
| `OfficialDossierFooter.jsx` | L24 | Hash integritas SHA-256 (`e3b0c44298fc1c...`) | String string statis acak, bukan hasil hashing kriptografis rekaman atlet sesungguhnya. | Hapus string hash palsu. Ganti dengan nomor registrasi lisensi resmi akademi atau sertifikasi verifikasi sistem. |
| `OfficialDossierFooter.jsx` | L25-L27 | Nomor Registrasi Asprov PSSI & NISN (`PSSI-DIY/2026-0042-U13`, `0134982103`) | Nomor fiktif yang di-hardcode tanpa validasi dari database federasi. | Ambil dari database jika terdaftar resmi; jika belum ada, tampilkan status *"Menunggu verifikasi federasi"*. |
| `OfficialDossierFooter.jsx` | L124-L150 | Tanda tangan staf teknis: "Coach Hendro (Lisensi B)" & "Budi Santoso (Lisensi A Pro)" | Tanda tangan dan stempel digital buatan (`SIGNED 28/10`, `ACCREDITED`) tanpa proses otentikasi pejabat terkait. | Tampilkan nama penilai aktual dari metadata sesi login pelatih yang terverifikasi. |
| `TacticalAnalyticsHub.jsx` | L35-L59 | Nilai Aksi VAEP (`Net VAEP: +0.84`, `Offense: +0.72`, Top 3% Nasional) | Angka probabilitas buatan tangan, bukan hasil inferensi model SoccerAction terhadap koordinat SPADL pertandingan. | Beri label eksplisit `[Skema Ilustrasi VAEP]` saat `VITE_DEMO_MODE=true`. Jangan klaim *"Top 3% Nasional"* tanpa data populasi riil. |
| `TacticalAnalyticsHub.jsx` | L63-L129 | Distribusi 4 Momen Filanesia (Menyerang 42%, Transisi Negatif 18%, dll.) | Persentase statis fiktif tanpa agregasi perhitungan sentuhan bola riil. | Hitung dinamis dari log event laga aktual di `FastPitchLogger`, atau beri label `[Contoh Data]`. |
| `TacticalAnalyticsHub.jsx` | L133-L162 | Metrik FIFA Football Language (Line breaks 8/10, Receptions 11 kali) | Angka statis hard-coded. | Tautkan langsung ke entri referensi `fifa-ftc-2026` di `src/data/references.js` dan beri tanda data simulasi. |
| `GrowthBioBandingTab.jsx` | L28-L39 | Spesifikasi Bio-Banding (Prediksi tinggi 174.5 cm, Khamis-Roche +0.4 thn) | Menampilkan hasil rumus Khamis-Roche tanpa pernah mengumpulkan tinggi badan kedua orang tua kandung atlet. | Wajibkan formulir input tinggi orang tua kandung (sesuai paper Khamis-Roche 1994) atau beri label *"Contoh Estimasi Ilustratif"*. |
| `GrowthBioBandingTab.jsx` | L42-L100 | Kurva Progresi Atletik 6 Bulan (Sprint 3.65s -> 3.42s, Jump 38cm -> 44.5cm) | Data historis statis yang di-hardcode seolah atlet telah dites berkala sejak Mei 2026. | Muat dari riwayat tabel `fitness_records` di Supabase. Jika belum ada riwayat, tampilkan *"Riwayat belum tersedia"*. |
| `GrowthBioBandingTab.jsx` | L103-L145 | Log Antropometri Dwi-Bulanan (Mei-Okt 2026) | Log tabular statis fiktif. | Hubungkan dengan tabel log antropometri riil atau sembunyikan jika tidak ada catatan riil. |
| `CoachAssessmentView.jsx` | L112-L149 | Fungsi `handleGenerateAI` | Menggunakan `setTimeout` 1000ms dan merangkai template string hardcoded, seolah-olah diproses oleh mesin AI. | Beri label jujur *"Template Narasi Otomatis"* atau hubungkan ke pipeline analitik terstandarisasi yang terdokumentasi. |
| `PitchScannerModal.jsx` | L145-L215 | `runTestMeasurement` (Edge-AI Camera Scanner) | Menggunakan kamera HP tetapi hasilnya dihitung via rumus sinus `Math.sin()` buatan, menghasilkan lompatan fake 46.4 cm / sprint 3.38s. | Hapus klaim deteksi kamera otomatis, atau beri label transparan *"Mode Simulasi Pengujian Lapangan"*. |
| `InteractiveMatchHub.jsx` | L34-L45 | Skor Laga: MPFA Jogja vs Sleman United (3 - 1) | Data laga fiktif. | Ambil dari log pertandingan tersinkronisasi di Supabase. |
| `InteractiveMatchHub.jsx` | L48-L95 | Video Klip Momen Terverifikasi | Menggunakan video stok Mixkit (`mixkit-young-soccer-player...`) dan foto Unsplash acak sebagai bukti aksi pemain. | Beri tanda jelas *"Video Demonstrasi"* dan sediakan fitur unggah video pertandingan lokal yang sebenarnya. |
| `src/lib/supabase.js` | L48, L60-L75 | Fallback nilai radar atribut dan gambar di `transformDbPlayer` | Jika database kosong, sistem mengisi nilai acak (Pace 84, Dribbling 80, foto Unsplash). | Kembalikan data kosong atau nilai riil apa adanya tanpa memalsukan rating atribut. |
| `src/data/mockData.js` | Seluruh berkas | Seluruh 6 pemain (Dimas Arya, Kevin Sanjaya, dll.) beserta rekam medis dan fisiknya | Data profil atlet usia muda fiktif. | Beri penandaan `is_demo_mode: true` dan bungkus dengan guard `VITE_DEMO_MODE`. |

---

## 3. Tinjauan Keamanan (Security & Privacy Review)

Aplikasi ini menampung **data pribadi anak di bawah umur (U-13 s/d U-17)** yang tunduk pada **UU PDP No. 27/2022 Pasal 25** (kewajiban persetujuan orang tua/wali).

| Masalah Keamanan | Lokasi Berkas | Tingkat Bahaya | Analisis Risiko | Rekomendasi Solusi |
|---|---|---|---|---|
| **PIN Keras Klien (Hard-coded PIN)** | `PinAuthModal.jsx` (L20-L21) | **CRITICAL** | PIN pelatih (`'2026'` & `'1234'`) tertulis telanjang di kode sumber JavaScript. Siapa pun dapat melihatnya via DevTools dan membuka akses penuh pelatih. | Ganti dengan autentikasi sesi resmi Supabase Auth berbasis email/kata sandi pelatih dengan token JWT terverifikasi. |
| **Izin Tulis Kunci Anonim Publik** | `src/lib/supabase.js` (L180-L260) | **CRITICAL** | Operasi `update` dan `insert` ke tabel `players`, `player_assessments`, dan `fitness_records` menggunakan `VITE_SUPABASE_ANON_KEY`. Tanpa RLS ketat, siapa pun dapat mengubah nilai atlet. | Kunci hak tulis di Supabase RLS hanya untuk peran terautentikasi (`authenticated`), tolak seluruh mutasi dari peran publik anonim. |
| **Ekspos Seluruh Data Anak (`select('*')`)** | `src/lib/supabase.js` (L168-L175) | **CRITICAL** | Endpoint publik mengambil seluruh kolom anak (tanggal lahir, kontak, rekam fisik, foto) tanpa penyaringan atau izin orang tua. Melanggar UU PDP No. 27/2022 Pasal 25. | Terapkan *data minimization*: publik hanya boleh melihat inisial/nama panggilan, posisi, dan nomor punggung. Data sensitif (tinggi, berat, rekam medis) wajib ditutup kecuali bagi pelatih/wali terverifikasi. |
| **Penyimpanan Peran di `localStorage`** | `src/App.jsx` (L31, L114) | **HIGH** | Otorisasi peran (`ballr_user_role: 'coach'`) disimpan di `localStorage` peramban. Pengguna dapat mengubahnya lewat konsol peramban (`localStorage.setItem('ballr_user_role', 'coach')`) untuk membobol proteksi. | Hilangkan kepercayaan pada `localStorage` untuk otorisasi. Otorisasi harus berasal dari claims JWT Supabase Auth di sisi server. |
| **Cache PII Anak di Service Worker** | `public/sw.js` (L37-L72) | **HIGH** | Service worker menyimpan seluruh permintaan GET origin yang sama ke `CacheStorage` tanpa enkripsi. Data atlet tersimpan permanen di perangkat pengguna lain yang berbagi gawai. | Batasi cache hanya untuk aset statis (`/index.html`, ikon, CSS, font). Larang penyimpanan respons data API atau PII ke dalam CacheStorage. |

---

## 4. Inventaris Hutang Desain (Design-Debt Inventory)

### 4.1 Frekuensi Elemen Desain Bertentangan (AI-Look Artifacts)
Pencarian pola di seluruh berkas `.jsx`, `.js`, `.css`, dan `.html`:
- **Penggunaan `#CCFF00` (Volt Lime)**: **253 kemunculan** (Terlalu dominan, menyilaukan, dan memberi kesan gimmick AI video game alih-alih dokumen resmi federasi).
- **Penggunaan `font-athletic` (Chakra Petch)**: **198 kemunculan** (Font bergaya sci-fi/robotic yang berlebihan untuk teks non-angka).
- **Penggunaan `uppercase`**: **121 kemunculan** (Banyak digunakan pada judul dan deskripsi panjang yang seharusnya sentence case).
- **Penggunaan Gradien (`gradient` / `bg-gradient-to-...`)**: **49 kemunculan** (Gradien multi-warna dekoratif yang melanggar prinsip permukaan datar/flat).
- **Bayangan Neon Kustom (`shadow-[...rgba(...)]`)**: **47 kemunculan** (Glow neon di sekeliling kartu dan tombol).
- **Animasi Bergerak (`animate-*`)**: **43 kemunculan** (Termasuk `animate-pulse` yang mengganggu konsentrasi dan tidak menghormati `prefers-reduced-motion`).
- **Bayangan Berat (`shadow-2xl`)**: **14 kemunculan**.
- **Penggunaan Emoji dalam Antarmuka**: **51 kemunculan** (Emoji di tombol, modal, label, dan data mock seperti ⚡, 🏆, ⚽, 🎯, 🛡️, 🇮🇩, 📸, 🔥).

### 4.2 Komponen Melebihi 500 Baris & Rencana Dekomposisi
Terdapat 5 komponen raksasa yang melanggar batas modularitas (> 500 baris):

1. **`FastPitchLogger.jsx` (770 baris)**:
   - *Masalah*: Menyatukan stopwatch pertandingan, grid 8 tombol aksi, riwayat event, modal recap, dan modal tembakan gol dalam 1 berkas.
   - *Rencana Pemecahan*:
     - `components/logger/MatchTimerBar.jsx`: Kontrol waktu dan babak laga.
     - `components/logger/TactileKeypad.jsx`: Grid 8 tombol tap berdaya rekat tinggi (flat, kontras).
     - `components/logger/EventStreamLog.jsx`: Daftar 4 event terakhir dan tombol undo.
     - `components/logger/MatchRecapDialog.jsx`: Modal sinkronisasi hasil laga.

2. **`TacticalAnalyticsHub.jsx` (661 baris)**:
   - *Masalah*: Menggabungkan visualisasi VAEP, 4 fase Filanesia, metrik FIFA, preskripsi drill, dan daftar sitasi dalam 1 berkas panjang.
   - *Rencana Pemecahan*:
     - `components/analytics/VaepScorecard.jsx`: Metrik aksi SoccerAction.
     - `components/analytics/FilanesiaGrid.jsx`: 4 fase momen permainan kurikulum PSSI.
     - `components/analytics/FifaLanguageMetrics.jsx`: Metrik standar FIFA Football Language.
     - `components/analytics/PrescribedDrillCard.jsx`: Rekomendasi latihan teknis.
     - `components/analytics/ReferenceList.jsx`: Komponen pemanggil referensi resmi.

3. **`CoachAssessmentView.jsx` (598 baris)**:
   - *Masalah*: Mencampur pemilih pemain skuad, input slider 6 atribut, tes fisik, simulasi AI narrative generator, dan mutasi Supabase.
   - *Rencana Pemecahan*:
     - `components/assessment/AttributeEditor.jsx`: Penilaian atribut teknis.
     - `components/assessment/FitnessForm.jsx`: Formulir tolok ukur kebugaran.
     - `components/assessment/TechnicalNarrative.jsx`: Catatan resmi pelatih.

4. **`GrowthBioBandingTab.jsx` (576 baris)**:
   - *Masalah*: Menyatukan perhitungan biometrik, grafik SVG manual, kotak saran cedera, dan tabel log antropometri.
   - *Rencana Pemecahan*:
     - `components/growth/MaturityStatusCard.jsx`: Indikator PHV dan prediksi tinggi dewasa.
     - `components/growth/ProgressLineChart.jsx`: Grafik garis progres atletik (SVG datar, berlabel unit & tanggal).
     - `components/growth/AnthropometryTable.jsx`: Tabel log pengukuran berkala.

5. **`PitchScannerModal.jsx` (534 baris)**:
   - *Masalah*: Berisi kode simulasi kamera pengukur kecepatan & lompatan palsu yang menipu pengguna.
   - *Rencana Pemecahan*: Hapus logika scanner simulasi palsu. Ganti dengan modul input manual hasil uji fisik lapangan terverifikasi stopwatch/papan ukur manual oleh pelatih berlisensi.

---

## 5. Struktur Berkas yang Diusulkan & Rencana Bertahap (Phases 1-7)

### 5.1 Struktur Direktori Sasaran
```
src/
├── assets/
│   └── crest.svg                   # Logo resmi akademi (vektor)
├── components/
│   ├── common/                     # Komponen atomik datar
│   │   ├── Button.jsx              # Radius <= 8px, flat, tanpa gradien
│   │   ├── DemoBadge.jsx           # Label "Contoh data" / "Skema ilustrasi"
│   │   ├── Modal.jsx               # Wadah dialog aksesibel (Esc, focus trap)
│   │   ├── ReferenceCite.jsx       # Tautan rujukan ilmiah ke references.js
│   │   └── Toast.jsx               # Pemberitahuan sistem bebas emoji
│   ├── layout/
│   │   ├── TopNav.jsx              # Navigasi utama sentence case datar
│   │   └── DossierFooter.jsx       # Legalitas UU PDP & akreditasi PSSI
│   ├── passport/
│   │   ├── PlayerHeader.jsx        # Profil atlet, unit, tanggal, rating internal
│   │   ├── AttributeRadar.jsx      # Poligon radar 1-warna hairline datar
│   │   ├── FitnessBenchmarks.jsx   # Hasil tes fisik bertanggal
│   │   └── CoachNotes.jsx          # Catatan resmi staf pelatih
│   ├── match/
│   │   ├── MatchHub.jsx            # Tampilan pemersatu video & analitik
│   │   ├── VideoPlayer.jsx         # Pemutar video rekaman laga
│   │   └── EventTimeline.jsx       # Garis waktu sentuhan laga
│   ├── analytics/
│   │   ├── TacticalHub.jsx         # Modul analitik taktis bersumber
│   │   ├── VaepPanel.jsx           # Panel SoccerAction VAEP
│   │   └── FilanesiaPanel.jsx      # Panel 4 Momen Filanesia
│   ├── growth/
│   │   ├── BioBandingPanel.jsx     # Modul kematangan biologis
│   │   ├── GrowthChart.jsx         # Grafik progresi SVG tabular
│   │   └── AnthropometryLog.jsx    # Log tabel antropometri
│   ├── squad/
│   │   └── SquadDirectory.jsx      # Direktori skuad terproteksi data anak
│   └── logger/
│   │   ├── PitchLogger.jsx         # Fast pitch tap pad pinggir lapangan
│   │   └── KeypadGrid.jsx          # Papan sentuh taktis datar
├── data/
│   ├── references.js               # Kamus wajib rujukan ilmiah terverifikasi
│   ├── mockData.js                 # Data uji coba transparan (VITE_DEMO_MODE)
│   └── schemas.js                  # Skema validasi objek data atlet
└── lib/
    ├── supabase.js                 # Klien Supabase sanitasi + RLS
    ├── calculations.js             # Formula sains (BMI, Khamis-Roche murni)
    └── auditLogger.js              # Pencatat log akses data anak lokal/server
```

### 5.2 Rencana 7 Fase Implementasi

- **Fase 1: Basis Rujukan & Label Kejujuran Data**:
  - Buat `src/data/references.js` lengkap dengan ID, judul, penerbit, tahun, URL, dan nomor halaman/bagian.
  - Tambahkan variabel lingkungan `VITE_DEMO_MODE=true` dan buat komponen `<DemoBadge />`.
  - Beri label transparan pada seluruh data mock / placeholder saat demo mode aktif.

- **Fase 2: Kepatuhan Privasi Data Anak (UU PDP No. 27/2022 Pasal 25)**:
  - Terapkan field status persetujuan wali (`guardian_consent`).
  - Lakukan *data minimization* pada tampilan publik: tutup data biometrik/medis atlet anak kecuali pelatih/wali terautentikasi login.
  - Implementasikan audit logging sederhana untuk tiap akses data profil anak.

- **Fase 3: Pengerasan Keamanan (Security Hardening)**:
  - Hapus PIN hard-coded `'2026'` di klien.
  - Singkirkan otorisasi peran via `localStorage`.
  - Kunci Supabase RLS agar anon-key tidak dapat menulis tanpa sesi auth resmi.
  - Sanitasi `public/sw.js` agar tidak menyimpan PII atlet anak di cache peramban.

- **Fase 4: Eliminasi Simulasi Palsu (Data Honesty Cleanup)**:
  - Hapus string hash palsu di `OfficialDossierFooter.jsx`.
  - Hapus AI generator bohongan (`handleGenerateAI`) di `CoachAssessmentView.jsx`.
  - Hapus simulasi kamera palsu di `PitchScannerModal.jsx` dan ganti dengan formulir input manual terverifikasi.
  - Ganti stock video/foto Mixkit/Unsplash dengan indikator rekaman lokal berlabel jujur.

- **Fase 5: Overhaul Desain Anti-"AI-Look"**:
  - Hapus seluruh 51 emoji di seluruh antarmuka.
  - Hapus warna `#CCFF00`, 49 gradien, dan 47 glow shadows.
  - Tetapkan 1 warna aksen fungsional tunggal (Athletic Green `#16A34A` / `#15803D`).
  - Terapkan `border-radius <= 8px` (`rounded-md` / `rounded-lg`) dan border hairline 1px.
  - Ubah seluruh judul menjadi sentence case. Terapkan angka tabular (`font-mono` / `tabular-nums`) disertai unit dan tanggal pengukuran.

- **Fase 6: Dekomposisi Komponen Raksasa (> 500 Baris)**:
  - Pecah `FastPitchLogger.jsx`, `TacticalAnalyticsHub.jsx`, `CoachAssessmentView.jsx`, `GrowthBioBandingTab.jsx`, dan `PitchScannerModal.jsx` sesuai sub-komponen pada struktur direktori sasaran.

- **Fase 7: Verifikasi Aksesibilitas & Quality Gate**:
  - Jalankan `npm run lint` (`oxlint`) hingga 0 warning dan 0 error.
  - Jalankan `npm run build` hingga exit code 0.
  - Verifikasi kontras warna teks terhadap latar belakang (WCAG AA >= 4.5:1).
  - Verifikasi responsivitas pada lebar 360px (mobile sempit) dan 1280px (desktop).
  - Uji navigasi keyboard (Focus visible, Tab order, Esc pada modal).

---

## 6. Pertanyaan yang Membutuhkan Jawaban Pengguna Sebelum Eksekusi

Sebelum memulai pengerjaan kode pada fase mana pun, mohon konfirmasi untuk 3 pertanyaan kunci berikut:

1. **Status Database Supabase**:
   Apakah kita akan menghubungkan aplikasi ini ke instans Supabase aktif dengan tabel dan skema Auth resmi (email/password pelatih), atau pada tahap ini aplikasi difokuskan berjalan dalam lingkungan pengujian lokal terkontrol dengan flag `VITE_DEMO_MODE=true`?
2. **Koleksi Formulir Persetujuan Wali (UU PDP Pasal 25)**:
   Apakah data wali yang ingin dicatat untuk bukti persetujuan cukup mencakup: *Nama Lengkap Wali, Hubungan Keluarga (Ayah/Ibu/Wali Sah), Nomor Kontak Darurat, dan Tanggal Penandatanganan Formulir*?
3. **Pilihan Warna Aksen Tunggal**:
   Apakah warna aksen tunggal disepakati menggunakan **Athletic Forest Green (`#16A34A` / `#15803D`)** sebagai representasi standar sepak bola dan lapangan resmi, menggantikan warna volt `#CCFF00`?

---
*Menunggu persetujuan pengguna untuk melanjutkan ke tahap implementasi.*
