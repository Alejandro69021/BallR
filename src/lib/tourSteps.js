/**
 * 4 tour steps per docs/UX_SPEC.md:
 * 1. Mulai dari sini (new-match)
 * 2. Catat kejadian (record-events)
 * 3. Selesaikan laga (finish-match)
 * 4. Laporan dan bagikan (match-report)
 */
export const TOUR_STEPS = [
  {
    id: 'new-match',
    stepNumber: 1,
    totalSteps: 4,
    anchor: '[data-tour="new-match"]',
    title: 'Mulai dari sini',
    description: 'Buat laga pertama. Setelah itu kamu bisa langsung mencatat kejadian.'
  },
  {
    id: 'record-events',
    stepNumber: 2,
    totalSteps: 4,
    anchor: '[data-tour="record-events"]',
    title: 'Catat kejadian',
    description: 'Ketuk aksi saat laga berjalan, atau sambil memutar video laga dari perangkatmu.'
  },
  {
    id: 'finish-match',
    stepNumber: 3,
    totalSteps: 4,
    anchor: '[data-tour="finish-match"]',
    title: 'Selesaikan laga',
    description: 'Isi skor akhir. Setelah itu catatan laga terkunci dan tidak bisa diubah.'
  },
  {
    id: 'match-report',
    stepNumber: 4,
    totalSteps: 4,
    anchor: '[data-tour="match-report"]',
    title: 'Laporan dan bagikan',
    description: 'Laporan laga yang bisa dicetak, dan kartu perkembangan pemain bila wali sudah setuju.'
  }
];
