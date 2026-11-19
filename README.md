# BallR (ProspekBola) — Youth Football Talent Passport & Performance Analytics

**BallR (ProspekBola)** adalah sistem paspor talenta digital dan perangkat analisis pertandingan/latihan usia muda (kategori U-13 ke atas) untuk akademi sepakbola resmi. Aplikasi dirancang untuk pencatatan rekam jejak atlet secara transparan, perlindungan data pribadi anak di bawah umur (kepatuhan UU PDP No. 27/2022 Pasal 25), serta evaluasi taktis berbasis kurikulum Filanesia PSSI dan metodologi sains olahraga terakreditasi.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (Mobile-First, Dark Athletic Palette)
- **Routing**: React Router (`react-router-dom` v7)
- **Database & Backend**: Supabase (`@supabase/supabase-js`)
- **Testing**: Vitest + `@testing-library/react` + `jsdom`
- **Icons**: Lucide React
- **Export & Social Flex**: `html-to-image`
- **Linter**: Oxlint

---

## 📁 Struktur Direktori

```
BallR/
├── .env.example                  # Template variabel lingkungan (tanpa rahasia)
├── docs/
│   └── AUDIT.md                  # Audit arsitektur, inventaris data tiruan & utang desain
├── public/                       # Aset publik statis (favicon, manifest, sw.js)
├── src/
│   ├── components/               # Komponen presentasional modular (setiap berkas <= 400 baris)
│   │   ├── analytics/            # Sub-komponen analitik (VAEP, Filanesia, FIFA Language, Drill)
│   │   ├── assessment/           # Sub-komponen evaluasi pelatih (Attribute, Fitness, Narrative)
│   │   ├── growth/               # Sub-komponen pertumbuhan & bio-banding (Khamis-Roche, Chart)
│   │   ├── logger/               # Sub-komponen pitch logger (TimerBar, Keypad, Stream, Recap)
│   │   ├── match/                # Sub-komponen timeline laga (MatchEventTimeline)
│   │   ├── scanner/              # Sub-komponen kamera AR pitch scanner (CameraFeed, Telemetry)
│   │   ├── squad/                # Sub-komponen direktori skuad (SquadPlayerCard)
│   │   └── story/                # Sub-komponen kartu ekspor vertikal 9:16 (StoryCardCanvas)
│   ├── context/
│   │   └── PlayersContext.jsx    # Provider data layer & sinkronisasi mutasi Supabase
│   ├── data/
│   │   └── mockData.js           # Data demonstrasi lokal (hanya dimuat saat VITE_DEMO_MODE=true)
│   ├── hooks/
│   │   └── usePlayers.js         # Hook usePlayers() dan usePlayer(publicIdOrId)
│   ├── lib/
│   │   ├── calculations.js       # Fungsi murni: OVR, match rating, format waktu, akurasi
│   │   └── supabase.js           # Titik tunggal antarmuka database Supabase
│   ├── pages/                    # Komponen halaman rute
│   │   ├── PassportPage.jsx      # /pemain/:publicId
│   │   ├── MatchAnalysisPage.jsx # /pemain/:publicId/laga/:matchId
│   │   ├── GrowthPage.jsx        # /pemain/:publicId/pertumbuhan
│   │   ├── SquadPage.jsx         # /skuad
│   │   ├── AssessmentPage.jsx    # /penilaian/:playerId (Coach protected)
│   │   └── LoggerPage.jsx        # /pencatatan/:matchId (Coach protected)
│   ├── test/
│   │   ├── setup.js              # Konfigurasi jest-dom Vitest
│   │   ├── calculations.test.js  # Pengujian fungsi murni
│   │   ├── usePlayers.test.jsx   # Pengujian hook dan data layer
│   │   └── router.test.jsx       # Pengujian routing & verifikasi
│   ├── App.jsx                   # Koordinator rute & modal global
│   ├── main.jsx                  # Root bootstrap dengan BrowserRouter & Service Worker
│   └── index.css                 # Konfigurasi Tailwind & athletic typography
└── vite.config.js                # Konfigurasi Vite & Vitest
```

---

## 🚦 Rute Aplikasi (Bahasa Indonesia Slugs)

| Rute | Akses | Keterangan |
| :--- | :--- | :--- |
| `/` | Publik / Coach | Redirect otomatis berdasarkan peran sesi aktif |
| `/pemain/:publicId` | Publik | Paspor talenta digital resmi atlet |
| `/pemain/:publicId/laga/:matchId` | Publik | Analisis laga interaktif & intelijen taktis (VAEP & Filanesia) |
| `/pemain/:publicId/pertumbuhan` | Publik | Kematangan biologis & lintasan bio-banding (Khamis-Roche) |
| `/skuad` | Publik / Coach | Direktori skuad binaan akademi |
| `/penilaian/:playerId` | **Pelatih (PIN Guard)** | Rapor evaluasi pelatih, scoring atribut, & AI narrative |
| `/pencatatan/:matchId` | **Pelatih (PIN Guard)** | Sideline matchday event logger (1-thumb touch interface) |
| `/verifikasi/:hash` | Publik | Halaman audit verifikasi integritas data kriptografis |

---

## ⚙️ Variabel Lingkungan (.env)

Buat berkas `.env` di direktori utama berdasarkan `.env.example`:

```bash
# Supabase API Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Mode Demonstrasi (Default: false)
# Bila false: mockData.js tidak dimuat; kegagalan Supabase akan memunculkan status error eksplisit.
# Bila true: aplikasi menggunakan mock data lokal untuk pratinjau tanpa database.
VITE_DEMO_MODE=false
```

---

## 💻 Skrip Pengembangan & Pengujian

```bash
# Menjalankan server pengembangan lokal (Vite HMR)
npm run dev

# Menjalankan linter (Oxlint)
npm run lint

# Menjalankan suite pengujian unit secara berkala (Watch mode)
npm run test

# Menjalankan suite pengujian unit sekali jalan (CI / Gate run)
npm run test:run

# Membangun bundel produksi
npm run build

# Pratinjau hasil build produksi
npm run preview
```

---

## 🛡️ Kepatuhan & Kejujuran Data

1. **Kejujuran Data**: Tidak menampilkan data rekaan atau generator acak seolah-olah data riil. Data ilustrasi hanya dimuat jika `VITE_DEMO_MODE=true` dan diberi label jelas.
2. **Perlindungan Data Anak**: Menghormati privasi data anak di bawah umur sesuai UU PDP No. 27/2022 Pasal 25.
3. **Integritas Batas Komponen**: Tidak ada berkas presentasional di `src/components/` yang melebihi 400 baris. Seluruh logika komputasi diekstraksi ke modul murni di `src/lib/calculations.js`.
