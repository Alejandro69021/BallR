# BallR UX Spec (docs/UX_SPEC.md)

Source of truth for the UX redesign. Mockup (owner-only link, for reference): https://claude.ai/artifact/Fqdrr7RP4EK5VLLxoFSWQF
Four artboards: (1) Coach Home, (2) Match detail with a single "next step", (3) Coach Home on phone, (4) Empty state + first-run tour.

## Why
A reviewer found the app hard to understand: no visible order of use, dense layout, unclear first screen. Evidence in code: ~88% of text uses 12px (`text-xs` 577 uses vs `text-sm` 51, `text-base` 26); the coach lands on a data table with no "start here"; Match detail has 10+ competing buttons; no onboarding or guided empty states.

## Principles
1. Task before data: the first screen answers "what do I do now?" with ONE primary action.
2. One primary button per screen. Rare actions go into a "Lainnya" menu.
3. Show the order of work everywhere it matters: Laga dibuat -> Catat kejadian -> Selesaikan laga -> Laporan.
4. Plain Indonesian for coaches. Technical terms stay in report methodology sections, with a short explanation on hover/focus.
5. Honesty rules stay: no invented numbers, "Belum ada data", raw counts first with n and source, no OVR/tier/ranking, demo data labelled "Mode contoh: data fiktif".
6. Readable outdoors: light surface by default for coach/admin; dark remains a user option.

## Tokens (map to the existing Tailwind 4 tokens; do NOT hard-code hex in components)
Light ("paper") surface: ground #F5F6F2, panel #FFFFFF, ink #15211B, muted #4A5750 (>= 7:1), line #D8DDD6, accent #17744A (white text 5.7:1), accent-soft #DDF1E5, accent-ink #0F5A38, warn-bg #FFF1CC / warn-ink #7A4B00, neutral-chip #E6E9E4. Keep all text >= 4.5:1.
Type scale (px): caption 14, body 16, card/button title 18, section 20, page title 28. NOTHING below 14px for readable text. 12px is allowed only for: SVG chart axis labels, print footer, and the `Terverifikasi/Belum diverifikasi` micro-badges in references (and only if contrast >= 4.5:1).
Font: keep IBM Plex Sans.
Targets: all tappable controls >= 44px; primary buttons 56px high, 18px bold; mobile bottom bar items 56px.
Spacing: sections 24-32px apart, cards 20-28px padding, radius 12-16px.

## Components to build (src/components/ux/)
- `StageStepper`: ordered list `ol` with `aria-current="step"`. States done (check, accent-soft), current (accent filled number, bold), todo (outline). Compact variant on phone: text "Langkah 2 dari 4: Catat kejadian" + 4 segment bar.
- `NextStepPanel`: soft-green panel, small label "LANGKAH BERIKUTNYA", title, one-sentence explanation, ONE primary button, optional secondary, and `MenuButton` "Lainnya".
- `MenuButton`: accessible menu (aria-haspopup/expanded, Escape closes and returns focus, Arrow keys move, Tab closes).
- `EmptyState`: icon, title, one-sentence purpose, one primary button.
- `CoachMark` + `WelcomeTour`: 4 steps, popover anchored to `[data-tour="..."]`, "Berikutnya", "Lewati tur", Escape closes. Stored in localStorage key `ballr_tour_done_v1`; "Ulangi tur" in Bantuan.
- `Term`: inline term with short plain explanation on hover/focus/tap (not hover-only).

## Copy (Indonesian, final strings)
- Home: title "Beranda"; subtitle "Apa yang mau kamu kerjakan hari ini?"; card label "Lanjutkan laga terakhir"; primary "Lanjut mencatat"; secondary "Lihat detail laga"; side card "Mulai laga baru" / "Isi nama lawan, tanggal, dan ukuran lapangan. Cukup satu menit, lalu kamu bisa langsung mencatat." / button "Buat laga baru".
- Work-order cards (title / one line):
  1 Siapkan skuad / Daftar pemain dan profil mereka.
  2 Buat laga / Catat lawan, tanggal, dan ukuran lapangan.
  3 Catat kejadian / Ketuk aksi saat laga berjalan, atau sambil memutar video laga dari perangkatmu.
  4 Selesaikan laga / Isi skor akhir. Setelah itu catatan laga terkunci dan tidak bisa diubah.
  5 Laporan dan bagikan / Laporan laga yang bisa dicetak, dan kartu perkembangan pemain bila wali sudah setuju.
- Match next-step texts by state:
  draft with 0 events -> "Catat kejadian": "Mulai mencatat dari pencatat laga. Bisa sambil memutar video."
  draft with >= 1 event -> "Selesaikan laga": "Masukkan skor akhir. Setelah laga final, catatan terkunci supaya laporan bisa dipercaya. Sebelum itu kamu masih boleh menambah kejadian."
  final, report not frozen -> "Buat laporan": "Laporan dibuat dari catatan yang sudah terkunci."
  final, report frozen -> "Bagikan atau cetak laporan".
- "Lainnya" menu (draft): Ubah data laga, Pilih video laga, Cetak catatan sementara, Hapus draf (danger color).
- Summary tab note: "Data pencatatan manual · n = {n} kejadian. Baru sedikit, jadi yang tampil hanya jumlah mentah. Persentase muncul setelah minimal 10 kejadian." (threshold = SMALL_SAMPLE_N.)
- Empty Laga: "Belum ada laga" / "Mulailah dengan membuat laga pertama. Kamu hanya perlu nama lawan dan tanggal. Ukuran lapangan sudah terisi otomatis, bisa kamu ubah." / "Buat laga pertama".
- Tour: "Pertama kali di sini?" / "Ikuti tur singkat 4 langkah, sekitar 2 menit. Kamu bisa menutupnya kapan saja dan membukanya lagi dari menu Bantuan." Buttons "Mulai tur", "Lewati". Step 1 "Mulai dari sini": "Buat laga pertama. Setelah itu kamu bisa langsung mencatat kejadian."

## Navigation
Coach/admin: Beranda, Skuad, Laga, Taktik, Evaluasi (+ Bantuan). Phone: bottom bar with the same 5 items (56px). "/" for coach/admin renders Beranda (not /skuad). Update src/routes.js and every test that asserted "/" -> "/skuad".

## Out of scope for the redesign
No change to data logic, consent logic, report hashing/freezing, event minute/video offset logic, Supabase schema.
