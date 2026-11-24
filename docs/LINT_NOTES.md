# Catatan Peringatan Linter (LINT_NOTES.md)

Dokumen ini mencatat 27 peringatan OxLint yang sengaja dipertahankan (*intentional*) demi menjaga integritas perilaku aplikasi (*zero behavior regression*).

## Ringkasan per Aturan

| Aturan | Jumlah | Alasan Dipertahankan |
|---|---|---|
| `react-hooks(exhaustive-deps)` | 5 | Mengubah dependensi dapat merusak sinkronisasi video, memicu re-render tak berujung, atau menghapus draf pengisian form. |
| `react(only-export-components)` | 6 | Utilitas murni, konstanta, atau hook konteks yang ditempatkan bersama komponennya untuk modularitas dan pengujian unit. |
| `react(set-state-in-effect)` | 14 | Sinkronisasi state lokal pada saat *mount* dari sistem eksternal (localStorage, matchMedia, URL/rute, atau pemanggilan async awal). |
| `react(immutability)` | 1 | Penugasan callback terkini ke `useRef` agar efek timer tidak perlu di-reset terus-menerus. |
| `react(purity)` | 1 | `Date.now()` sebagai nilai cadangan (*fallback*) tanggal cetak ketika data skenario tidak memuat `updated_at`. |

---

## Rincian Berkas & Aturan

### 1. `react-hooks(exhaustive-deps)` (5 peringatan)

1. **`src/components/video/LocalVideoPanel.jsx` (2)**:
   - Dependensi `jumpTime` dan `togglePlay` pada listener *keyboard shortcut* `keydown`.
   - *Alasan:* Sesuai instruksi spesifikasi, berkas ini tidak diubah karena perubahan dependensi efek dapat merusak sinkronisasi pemutaran video lokal dan penandaan menit.
2. **`src/components/tactics/TacticalBoard.jsx` (1)**:
   - Dependensi `pitchDimensions` pada `useCallback` `getClampedPosition`.
   - *Alasan:* `pitchDimensions` diturunkan dari `pitchLength` dan `pitchWidth` yang sudah ada di dependensi. Menambahkan objek baru akan memicu instansiasi ulang callback berulang kali dan menyebabkan papan taktik bergetar saat *drag*.
3. **`src/components/CoachAssessmentView.jsx` (1)**:
   - Dependensi properti `activePlayer.*` pada `useEffect` inisialisasi form.
   - *Alasan:* Efek sengaja hanya dipicu saat `activePlayer?.player_id` berganti. Memasukkan seluruh atribut pemain akan menimpa draf evaluasi yang sedang diketik pelatih setiap kali ada pembaruan parsial.
4. **`src/components/FastPitchLogger.jsx` (1)**:
   - Dependensi `flushOutbox` dan `outbox.length` pada `useEffect` saat *mount*.
   - *Alasan:* Efek sengaja hanya dijalankan satu kali saat inisialisasi aplikasi untuk memproses antrean aksi yang tertunda dari sesi sebelumnya.

### 2. `react(only-export-components)` (6 peringatan)

1. **`src/components/video/LocalVideoPanel.jsx` (2)**:
   - Ekspor fungsi pembantu `hasStoredVideoMeta` dan `parseTimeToSeconds`.
   - *Alasan:* Menjaga fungsi utilitas video tetap terlokalisasi dan dapat diuji unit tanpa memecah arsitektur berkas video.
2. **`src/components/story/StoryCardCanvas.jsx` (2)**:
   - Ekspor fungsi pembantu `formatPlayerName` dan `formatCoachNote`.
   - *Alasan:* Fungsi murni pemformatan teks yang diuji secara independen oleh suite tes privasi cerita kartu.
3. **`src/components/logger/MatchTimerBar.jsx` (1)**:
   - Ekspor konstanta `PERIOD_LABELS`.
   - *Alasan:* Pemetaan label babak pertandingan yang digunakan bersama bilah waktu.
4. **`src/context/PlayersContext.jsx` (1)**:
   - Ekspor hook `usePlayersContext`.
   - *Alasan:* Pola baku React Context di mana hook konsumen diekspor bersama penyedianya (*Provider*).

### 3. `react(set-state-in-effect)` (14 peringatan)

1. **`src/components/InstallAppBanner.jsx` (1)**:
   - `setIsStandalone(true)` pada pemeriksaan *display-mode* standalone PWA.
   - *Alasan:* Memeriksa status instalasi PWA klien pada saat komponen dimuat.
2. **`src/components/growth/ConsentManagerModal.jsx` (1)**:
   - `setConfirmRevoke(false)` saat modal dibuka.
   - *Alasan:* Menjamin dialog konfirmasi selalu kembali ke status awal yang aman saat modal dibuka kembali.
3. **`src/components/ui/ResponsiveList.jsx` (1)**:
   - `setIsMobile(mql.matches)` pada listener `matchMedia`.
   - *Alasan:* Menyelaraskan status tampilan responsif berdasarkan ukuran layar peramban.
4. **`src/components/tactics/PlaybackBar.jsx` (1)**:
   - `setReducedMotion(mq.matches)` pada listener aksesibilitas gerak berkurang.
   - *Alasan:* Menghormati preferensi aksesibilitas sistem pengguna.
5. **`src/components/CoachAssessmentView.jsx` (1)**:
   - `setFormData(...)` saat atlet aktif berganti.
   - *Alasan:* Mengisi data form sesuai profil atlet yang dipilih.
6. **`src/context/PlayersContext.jsx` (1)**:
   - `loadPlayers()` pada inisialisasi Context.
   - *Alasan:* Mengambil data pemain awal saat aplikasi pertama kali dimuat.
7. **`src/App.jsx` (1)**:
   - `setUserRole('coach')` jika `isDemoMode` aktif.
   - *Alasan:* Memastikan peran pelatih langsung aktif pada mode demo.
8. **`src/components/FastPitchLogger.jsx` (3)**:
   - `setVideoOffsets`, `setTimerSeconds`, dan `flushOutbox()`.
   - *Alasan:* Memulihkan waktu stopwatch laga yang tersimpan di localStorage, menyamakan offset video, dan memicu pengiriman aksi tertunda saat laga dibuka.
9. **`src/pages/LoggerPage.jsx` (1)**:
   - `setMatchLoading(false)` jika `matchId` kosong.
   - *Alasan:* Menghentikan status pemuatan saat tidak ada laga yang dipilih.
10. **`src/pages/MatchReportPage.jsx` (1)**:
    - `loadData()` untuk pelatih/admin pada saat halaman dibuka.
    - *Alasan:* Mengambil data agregasi dan verifikasi laporan laga.
11. **`src/pages/TacticsDetailPage.jsx` (2)**:
    - `loadScenarioData()` dan `setInterpolatedFrame(null)`.
    - *Alasan:* Mengambil data skenario taktik saat dibuka, dan mengosongkan interpolasi frame saat animasi berhenti.

### 4. `react(immutability)` (1 peringatan)

1. **`src/components/FastPitchLogger.jsx` (1)**:
   - `flushOutboxRef.current = flushOutbox`.
   - *Alasan:* Memperbarui referensi callback terbaru tanpa memicu pendaftaran ulang listener interval atau efek samping.

### 5. `react(purity)` (1 peringatan)

1. **`src/components/tactics/StoryboardPrintView.jsx` (1)**:
   - `Date.now()` pada fallback pembaruan terakhir.
   - *Alasan:* Nilai cadangan aman tanggal hari ini jika metadata tanggal skenario tidak tersedia saat dicetak.
