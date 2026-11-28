/**
 * ==============================================================================
 * Event Data Analysis Engine
 * Analisis murni kejadian pertandingan untuk BallR.
 * ATURAN DATA HONESTY:
 * - Setiap metrik mengembalikan {value, n, unit} atau tabel dengan n.
 * - Tanpa angka tanpa label.
 * - Tanpa xT, VAEP, skor gabungan, peringkat, tolok ukur liga, atau prediksi.
 * ==============================================================================
 */

import { EVENT_TYPE_LABELS, ALLOWED_EVENT_TYPES } from '../matches';

/**
 * Minimum sample size threshold for statistical stability.
 * When n < SMALL_SAMPLE_N, figures must be flagged as "sampel kecil".
 */
export const SMALL_SAMPLE_N = 10;

/**
 * Registry definisi metrik resmi.
 */
export const METRIC_DEFINITIONS = [
  {
    id: 'counts_by_type',
    name: 'Distribusi Jenis Kejadian',
    definition: 'Frekuensi kemunculan setiap kategori aksi teknis yang dicatat selama pertandingan.',
    formula: 'Jumlah kejadian per event_type',
    unit: 'kejadian',
    limitations: 'Tergantung pada kelengkapan pencatatan manual oleh staf pelatih di pinggir lapangan.',
    reference_ids: []
  },
  {
    id: 'counts_by_team',
    name: 'Distribusi Penguasaan Kejadian',
    definition: 'Perbandingan total volume kejadian tercatat antara tim kita dan tim lawan.',
    formula: 'Total kejadian tim kita vs tim lawan',
    unit: 'kejadian',
    limitations: 'Bukan penguasaan bola berbasis waktu (possession time); hanya rasio volume kejadian tercatat.',
    reference_ids: []
  },
  {
    id: 'pass_stats',
    name: 'Tingkat Keberhasilan Umpan',
    definition: 'Persentase umpan yang berhasil mencapai rekan setim dibandingkan total umpan yang dicatat.',
    formula: '(Umpan sukses / Total umpan dicatat) * 100',
    unit: '%',
    limitations: 'Tidak mengukur tingkat kesulitan umpan atau tekanan lawan.',
    reference_ids: []
  },
  {
    id: 'shot_stats',
    name: 'Akurasi Tembakan',
    definition: 'Persentase tembakan yang mengarah ke gawang (termasuk gol) dibandingkan total tembakan.',
    formula: '(Tembakan tepat sasaran + Gol) / Total tembakan * 100',
    unit: '%',
    limitations: 'Tidak memperhitungkan jarak tembakan atau nilai ekspektasi gol (xG).',
    reference_ids: []
  },
  {
    id: 'thirds',
    name: 'Distribusi Sepertiga Lapangan',
    definition: 'Proporsi kejadian di sepertiga pertahanan, sepertiga tengah, dan sepertiga akhir berdasarkan koordinat x (arah serang kiri ke kanan).',
    formula: 'Defensif: x/L < 1/3; Tengah: 1/3 <= x/L < 2/3; Final: x/L >= 2/3',
    unit: '%',
    limitations: 'Hanya menghitung kejadian yang memiliki koordinat lokasi tercatat.',
    reference_ids: []
  },
  {
    id: 'zone_grid',
    name: 'Distribusi Kisi 6x3 Zona',
    definition: 'Peta kepadatan frekuensi kejadian yang dibagi menjadi 18 zona reguler (6 panjang x 3 lebar).',
    formula: 'Agregasi jumlah kejadian pada kolom 0..5 (panjang) dan baris 0..2 (lebar)',
    unit: 'kejadian',
    limitations: 'Hanya mencakup kejadian dengan koordinat; tidak merefleksikan pergerakan tanpa bola.',
    reference_ids: []
  },
  {
    id: 'ppda',
    name: 'Passes Allowed per Defensive Action (PPDA)',
    definition: 'Rasio jumlah umpan lawan di area x >= 0.4*L dibagi total aksi bertahan tim kita di area yang sama (Trainor, 2014).',
    formula: 'Umpan lawan (x >= 0.4*L) / (Tekel + Intersepsi + Pelanggaran dibuat + Duel bawah + Duel udara tim kita pada x >= 0.4*L)',
    unit: 'rasio',
    limitations: 'Hanya dihitung jika terdapat minimal 30 umpan lawan berkoordinat. Menggunakan data kejadian on-ball manual tanpa pelacakan posisi 22 pemain.',
    reference_ids: ['trainor-ppda-2014']
  },
  {
    id: 'data_quality',
    name: 'Kualitas & Integritas Pencatatan',
    definition: 'Parameter kelengkapan teknis data pertandingan mencakup persentase koordinat, sebaran menit, dan jumlah pemain aktif.',
    formula: 'Persentase kelengkapan koordinat dan ringkasan cakupan pencatatan manual',
    unit: '%',
    limitations: 'Pencatatan manual oleh pelatih; belum diverifikasi silang dengan rekaman video multi-sudut.',
    reference_ids: ['sarmento-2014-match-analysis']
  },
  {
    id: 'field_tilt',
    name: 'Dominasi Sepertiga Akhir (Field Tilt)',
    definition: 'Proporsi umpan di sepertiga akhir lawan yang dilakukan tim kita dibandingkan total umpan sepertiga akhir kedua tim.',
    formula: 'Umpan tim kita (x >= 2/3*L) / (Umpan tim kita x >= 2/3*L + Umpan lawan x <= 1/3*L) * 100',
    unit: '%',
    limitations: 'Hanya menghitung umpan berkoordinat di sepertiga akhir; sampel kecil (< 10 umpan) harus dibaca hati-hati.',
    reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
  },
  {
    id: 'corridor_distribution',
    name: 'Distribusi 5 Koridor Lebar Lapangan',
    definition: 'Sebaran aksi di 5 lajur vertikal (Sayap Kiri, Half-Space Kiri, Tengah, Half-Space Kanan, Sayap Kanan) untuk melihat sisi serangan dominan tim sendiri maupun lawan.',
    formula: 'Pembagian koordinat y_m / W menjadi 5 koridor selebar masing-masing 20% lebar lapangan',
    unit: '%',
    limitations: 'Hanya menghitung kejadian berkoordinat; mengacu pada arah serang tim kita dari kiri ke kanan.',
    reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
  },
  {
    id: 'defensive_line_height',
    name: 'Tinggi Blok Bertahan (Defensive Line Height)',
    definition: 'Rata-rata jarak aksi bertahan dari garis gawang sendiri untuk mengklasifikasikan blok rendah (<35%), menengah (35-55%), atau tinggi (>55%).',
    formula: 'Rata-rata jarak (x_m untuk tim kita; L - x_m untuk lawan) dari tekel, intersepsi, sapuan, duel, dan pelanggaran dibuat',
    unit: 'm',
    limitations: 'Berbasis kejadian on-ball tercatat, bukan posisi garis empat bek secara terus-menerus.',
    reference_ids: ['fifa-football-language-2022', 'trainor-ppda-2014']
  },
  {
    id: 'shot_zones',
    name: 'Distribusi Zona & Jarak Tembakan',
    definition: 'Pemisahan tembakan dari dalam kotak penalti versus luar kotak penalti serta jarak rata-rata ke pusat gawang tanpa mengarang angka xG profesional.',
    formula: 'Klasifikasi koordinat tembakan terhadap dimensi kotak penalti proporsional dan jarak Euclidean ke pusat gawang',
    unit: 'tembakan',
    limitations: 'Tidak memperhitungkan jumlah bek penghalang, bagian tubuh, atau model probabilitas xG liga dewasa.',
    reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
  },
  {
    id: 'transition_metrics',
    name: 'Transisi & Rebut Bola Tinggi (High Regains)',
    definition: 'Frekuensi perebutan bola (rebut bola, intersepsi, tekel sukses) per sepertiga lapangan serta kehilangan bola di sepertiga pertahanan sendiri.',
    formula: 'Hitung perebutan bola di sepertiga akhir lawan (high regains) vs kehilangan bola di sepertiga pertahanan sendiri',
    unit: 'kejadian',
    limitations: 'Tidak mengukur waktu reaksi detik-per-detik secara optik seperti pelacakan otomatis Bundesliga (Vogelbein et al., 2014).',
    reference_ids: ['vogelbein-2014-defensive-transition', 'fifa-football-language-2022']
  },
  {
    id: 'time_intervals',
    name: 'Momentum per Interval 15 Menit',
    definition: 'Distribusi volume aksi, umpan, dan tembakan tim kita vs lawan pada tiap potongan 15 menit (Babak 1 dan Babak 2) untuk memantau perubahan ritme dan kelelahan.',
    formula: 'Agregasi kejadian berdasarkan babak dan menit ke dalam 6 interval (0-15, 16-30, 31-45+, 46-60, 61-75, 76-90+)',
    unit: 'kejadian',
    limitations: 'Bergantung pada konsistensi pencatatan menit selama pertandingan berlangsung.',
    reference_ids: ['sarmento-2014-match-analysis']
  }
];

export function getMetricDefinition(id) {
  return METRIC_DEFINITIONS.find((m) => m.id === id) || null;
}

/**
 * Menghitung jumlah kejadian per tipe.
 * @param {Array} events
 * @param {Function} [filterFn]
 * @returns {{ rows: Array, n: number, unit: string }}
 */
export function countsByType(events = [], filterFn = null) {
  const filtered = Array.isArray(events)
    ? filterFn ? events.filter(filterFn) : events
    : [];

  const counts = {};
  ALLOWED_EVENT_TYPES.forEach((t) => {
    counts[t] = 0;
  });

  filtered.forEach((e) => {
    if (counts[e.event_type] !== undefined) {
      counts[e.event_type]++;
    } else {
      counts[e.event_type] = 1;
    }
  });

  const rows = ALLOWED_EVENT_TYPES.map((type) => ({
    event_type: type,
    label: EVENT_TYPE_LABELS[type] || type,
    count: counts[type] || 0,
    n: filtered.length,
    unit: 'kejadian'
  })).filter((r) => r.count > 0 || !filterFn);

  return {
    rows,
    n: filtered.length,
    unit: 'kejadian'
  };
}

/**
 * Menghitung jumlah kejadian per tim (own vs opponent).
 * @param {Array} events
 * @returns {{ own: { count: number, n: number, unit: string }, opponent: { count: number, n: number, unit: string }, n: number, unit: string }}
 */
export function countsByTeam(events = []) {
  const list = Array.isArray(events) ? events : [];
  let ownCount = 0;
  let oppCount = 0;

  list.forEach((e) => {
    if (e.team === 'own') ownCount++;
    else if (e.team === 'opponent') oppCount++;
  });

  const total = list.length;
  return {
    own: { count: ownCount, n: total, unit: 'kejadian' },
    opponent: { count: oppCount, n: total, unit: 'kejadian' },
    n: total,
    unit: 'kejadian'
  };
}

/**
 * Menghitung kejadian per pemain tim kita yang terdaftar dalam partisipan.
 * @param {Array} events
 * @param {Array} participants
 * @returns {{ rows: Array, n: number, unit: string }}
 */
export function countsByPlayer(events = [], participants = []) {
  const evts = Array.isArray(events) ? events.filter((e) => e.team === 'own') : [];
  const parts = Array.isArray(participants) ? participants : [];

  // Group events by player_id
  const eventsByPlayer = {};
  evts.forEach((e) => {
    if (!e.player_id) return;
    if (!eventsByPlayer[e.player_id]) {
      eventsByPlayer[e.player_id] = [];
    }
    eventsByPlayer[e.player_id].push(e);
  });

  const rows = parts.map((part) => {
    const pEvents = eventsByPlayer[part.player_id] || [];
    const counts = {};
    pEvents.forEach((e) => {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    });

    const totalForPlayer = pEvents.length;
    return {
      player_id: part.player_id,
      jersey_number: part.jersey_number ?? null,
      player_name: part.player_name || part.player_id,
      position: part.position || '-',
      minutes_played: Number(part.minutes_played ?? 0),
      is_starter: Boolean(part.is_starter),
      counts_by_type: counts,
      n: totalForPlayer,
      small_sample: totalForPlayer < SMALL_SAMPLE_N,
      unit: 'kejadian'
    };
  });

  // Sort by jersey number ascending (nulls last)
  rows.sort((a, b) => {
    if (a.jersey_number == null && b.jersey_number == null) return a.player_name.localeCompare(b.player_name);
    if (a.jersey_number == null) return 1;
    if (b.jersey_number == null) return -1;
    return a.jersey_number - b.jersey_number;
  });

  return {
    rows,
    n: evts.length,
    unit: 'kejadian'
  };
}

/**
 * Statistik umpan (sukses, gagal, tingkat keberhasilan %).
 * @param {Array} events
 * @param {'own'|'opponent'|'all'} [team='own']
 * @returns {{ value: number|null, successful: { value: number, n: number, unit: string }, failed: { value: number, n: number, unit: string }, total: { value: number, n: number, unit: string }, n: number, unit: string }}
 */
export function passStats(events = [], team = 'own') {
  const passes = (Array.isArray(events) ? events : []).filter((e) => {
    const isTeam = team === 'all' || e.team === team;
    return isTeam && (e.event_type === 'pass' || e.event_type === 'key_pass');
  });

  let successful = 0;
  let failed = 0;

  passes.forEach((p) => {
    if (p.outcome === 'success') successful++;
    else if (p.outcome === 'fail') failed++;
  });

  const total = passes.length;
  const rate = total > 0 ? Number(((successful / total) * 100).toFixed(1)) : null;

  return {
    value: rate,
    successful: { value: successful, n: total, unit: 'umpan' },
    failed: { value: failed, n: total, unit: 'umpan' },
    total: { value: total, n: total, unit: 'umpan' },
    n: total,
    unit: '%'
  };
}

/**
 * Statistik tembakan.
 * @param {Array} events
 * @param {'own'|'opponent'|'all'} [team='own']
 * @returns {{ total: { value: number, n: number, unit: string }, on_target: { value: number, n: number, unit: string }, off_target: { value: number, n: number, unit: string }, goals: { value: number, n: number, unit: string }, accuracy_pct: { value: number|null, n: number, unit: string }, n: number, unit: string }}
 */
export function shotStats(events = [], team = 'own') {
  const shots = (Array.isArray(events) ? events : []).filter((e) => {
    const isTeam = team === 'all' || e.team === team;
    return isTeam && (e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal');
  });

  let goals = 0;
  let onTarget = 0;
  let offTarget = 0;

  shots.forEach((s) => {
    if (s.event_type === 'goal') {
      goals++;
      onTarget++;
    } else if (s.event_type === 'shot_on_target') {
      onTarget++;
    } else if (s.event_type === 'shot') {
      offTarget++;
    }
  });

  const total = shots.length;
  const accuracy = total > 0 ? Number(((onTarget / total) * 100).toFixed(1)) : null;

  return {
    total: { value: total, n: total, unit: 'tembakan' },
    on_target: { value: onTarget, n: total, unit: 'tembakan' },
    off_target: { value: offTarget, n: total, unit: 'tembakan' },
    goals: { value: goals, n: total, unit: 'gol' },
    accuracy_pct: { value: accuracy, n: total, unit: '%' },
    n: total,
    unit: 'tembakan'
  };
}

/**
 * Sepertiga lapangan (defensif, tengah, final) berdasarkan x_m / pitchLengthM.
 * Arah serang tim kita: kiri ke kanan (0 ke L).
 * Aturan batas:
 * x/L < 1/3 -> defensif
 * x/L < 2/3 -> tengah
 * else -> final
 * @param {Array} events
 * @param {number} [pitchLengthM=90]
 * @param {'own'|'opponent'|'all'} [team='own']
 * @returns {{ defensive: Object, middle: Object, final: Object, without_coords: Object, n: number, unit: string }}
 */
export function thirds(events = [], pitchLengthM = 90, team = 'own') {
  const L = Number(pitchLengthM) || 90;
  const list = (Array.isArray(events) ? events : []).filter((e) => team === 'all' || e.team === team);

  let defCount = 0;
  let midCount = 0;
  let finCount = 0;
  let withCoords = 0;
  let withoutCoords = 0;

  list.forEach((e) => {
    if (e.x_m == null || isNaN(e.x_m)) {
      withoutCoords++;
      return;
    }
    withCoords++;
    const ratio = Number(e.x_m) / L;
    if (ratio < 1 / 3) {
      defCount++;
    } else if (ratio < 2 / 3) {
      midCount++;
    } else {
      finCount++;
    }
  });

  return {
    defensive: {
      count: defCount,
      value: withCoords > 0 ? Number(((defCount / withCoords) * 100).toFixed(1)) : null,
      n: withCoords,
      unit: '%'
    },
    middle: {
      count: midCount,
      value: withCoords > 0 ? Number(((midCount / withCoords) * 100).toFixed(1)) : null,
      n: withCoords,
      unit: '%'
    },
    final: {
      count: finCount,
      value: withCoords > 0 ? Number(((finCount / withCoords) * 100).toFixed(1)) : null,
      n: withCoords,
      unit: '%'
    },
    without_coords: {
      count: withoutCoords,
      n: list.length,
      unit: 'kejadian'
    },
    n: withCoords,
    unit: '%'
  };
}

/**
 * Distribusi kisi 6x3 zona lapangan (6 zona panjang x 3 zona lebar).
 * @param {Array} events
 * @param {number} [pitchLengthM=90]
 * @param {number} [pitchWidthM=60]
 * @param {Function} [filterFn=null]
 * @returns {{ grid: Array, total_with_coords: number, without_coords: number, n: number, unit: string }}
 */
export function zoneGrid(events = [], pitchLengthM = 90, pitchWidthM = 60, filterFn = null) {
  const len = Number(pitchLengthM) || 90;
  const wid = Number(pitchWidthM) || 60;
  const list = Array.isArray(events) ? filterFn ? events.filter(filterFn) : events : [];

  // Matrix: 3 rows (y) x 6 cols (x)
  // row 0: atas (y 0..W/3), row 1: tengah (y W/3..2W/3), row 2: bawah (y 2W/3..W)
  const matrix = Array.from({ length: 3 }, () => Array(6).fill(0));

  let withCoords = 0;
  let withoutCoords = 0;

  list.forEach((e) => {
    if (e.x_m == null || isNaN(e.x_m) || e.y_m == null || isNaN(e.y_m)) {
      withoutCoords++;
      return;
    }
    withCoords++;

    // Clamp coordinates to pitch dimensions
    const x = Math.max(0, Math.min(len, Number(e.x_m)));
    const y = Math.max(0, Math.min(wid, Number(e.y_m)));

    let col = Math.floor((x / len) * 6);
    if (col >= 6) col = 5;

    let row = Math.floor((y / wid) * 3);
    if (row >= 3) row = 2;

    matrix[row][col]++;
  });

  // Flatten into cells
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      cells.push({
        col: c,
        row: r,
        count: matrix[r][c],
        pct: withCoords > 0 ? Number(((matrix[r][c] / withCoords) * 100).toFixed(1)) : 0,
        n: withCoords,
        unit: 'kejadian'
      });
    }
  }

  return {
    matrix,
    cells,
    total_with_coords: withCoords,
    without_coords: withoutCoords,
    n: withCoords,
    unit: 'kejadian'
  };
}

/**
 * Passes Allowed per Defensive Action (PPDA) per Trainor (2014).
 * Rasio: Umpan lawan di zona x >= 0.4*L / Aksi bertahan tim kita di zona x >= 0.4*L.
 * Aksi bertahan: tackle, interception, foul_committed, duel_ground, duel_air.
 * Syarat: minimal 30 umpan lawan BERKOORDINAT.
 * @param {Array} events
 * @param {number} [pitchLengthM=90]
 * @returns {{ value: number|null, reason: string|null, definition: string, formula: string, opponent_passes_in_zone: number, defensive_actions_in_zone: number, n: number, unit: string, reference_ids: string[] }}
 */
export function ppda(events = [], pitchLengthM = 90) {
  const L = Number(pitchLengthM) || 90;
  const xThreshold = 0.4 * L;
  const defActionTypes = ['tackle', 'interception', 'foul_committed', 'duel_ground', 'duel_air'];

  const list = Array.isArray(events) ? events : [];

  // Filter opponent passes with coordinates
  const oppPassesWithCoords = list.filter((e) =>
    e.team === 'opponent' &&
    (e.event_type === 'pass' || e.event_type === 'key_pass') &&
    e.x_m != null &&
    !isNaN(e.x_m)
  );

  const totalOppPassesWithCoords = oppPassesWithCoords.length;

  // Check sample size constraint
  if (totalOppPassesWithCoords < 30) {
    return {
      value: null,
      reason: 'Butuh minimal 30 umpan lawan berkoordinat',
      definition: 'Rasio umpan lawan di area x >= 0.4*L per aksi bertahan tim kita (Trainor, 2014)',
      formula: 'Umpan lawan (x >= 0.4*L) / Aksi bertahan tim kita (x >= 0.4*L)',
      opponent_passes_in_zone: oppPassesWithCoords.filter((e) => Number(e.x_m) >= xThreshold).length,
      defensive_actions_in_zone: list.filter((e) =>
        e.team === 'own' &&
        defActionTypes.includes(e.event_type) &&
        e.x_m != null &&
        !isNaN(e.x_m) &&
        Number(e.x_m) >= xThreshold
      ).length,
      n: totalOppPassesWithCoords,
      unit: 'rasio',
      reference_ids: ['trainor-ppda-2014']
    };
  }

  // Count opponent passes in zone x >= 0.4 * L
  const oppPassesInZone = oppPassesWithCoords.filter((e) => Number(e.x_m) >= xThreshold).length;

  // Count our defensive actions in zone x >= 0.4 * L (fallback to ball_recovery for vision datasets)
  let ourDefActionsInZone = list.filter((e) =>
    e.team === 'own' &&
    defActionTypes.includes(e.event_type) &&
    e.x_m != null &&
    !isNaN(e.x_m) &&
    Number(e.x_m) >= xThreshold
  ).length;

  if (ourDefActionsInZone === 0) {
    ourDefActionsInZone = list.filter((e) =>
      e.team === 'own' &&
      e.event_type === 'ball_recovery' &&
      e.x_m != null &&
      !isNaN(e.x_m) &&
      Number(e.x_m) >= xThreshold
    ).length;
  }

  if (ourDefActionsInZone === 0) {
    return {
      value: null,
      reason: 'Nol aksi bertahan di area x >= 0.4*L',
      definition: 'Rasio umpan lawan di area x >= 0.4*L per aksi bertahan tim kita (Trainor, 2014)',
      formula: 'Umpan lawan (x >= 0.4*L) / Aksi bertahan tim kita (x >= 0.4*L)',
      opponent_passes_in_zone: oppPassesInZone,
      defensive_actions_in_zone: 0,
      n: totalOppPassesWithCoords,
      unit: 'rasio',
      reference_ids: ['trainor-ppda-2014']
    };
  }

  const ppdaValue = Number((oppPassesInZone / ourDefActionsInZone).toFixed(2));

  return {
    value: ppdaValue,
    reason: null,
    definition: 'Rasio umpan lawan di area x >= 0.4*L per aksi bertahan tim kita (Trainor, 2014)',
    formula: 'Umpan lawan (x >= 0.4*L) / Aksi bertahan tim kita (x >= 0.4*L)',
    opponent_passes_in_zone: oppPassesInZone,
    defensive_actions_in_zone: ourDefActionsInZone,
    n: totalOppPassesWithCoords,
    unit: 'rasio',
    reference_ids: ['trainor-ppda-2014']
  };
}

/**
 * Kualitas data dan kelengkapan pencatatan.
 * @param {Array} events
 * @param {Object} match
 * @param {Array} participants
 * @returns {Object}
 */
export function dataQuality(events = [], match = {}, participants = []) {
  const evts = Array.isArray(events) ? events : [];
  const parts = Array.isArray(participants) ? participants : [];

  const total = evts.length;
  let withCoords = 0;
  const eventsPerPeriod = {};
  let firstMin = null;
  let lastMin = null;
  const playersWithEventsSet = new Set();
  let oppCount = 0;

  evts.forEach((e) => {
    if (e.x_m != null && !isNaN(e.x_m) && e.y_m != null && !isNaN(e.y_m)) {
      withCoords++;
    }
    const per = e.period != null ? String(e.period) : '1';
    eventsPerPeriod[per] = (eventsPerPeriod[per] || 0) + 1;

    if (e.minute != null && !isNaN(e.minute)) {
      const m = Number(e.minute);
      if (firstMin === null || m < firstMin) firstMin = m;
      if (lastMin === null || m > lastMin) lastMin = m;
    }

    if (e.team === 'own' && e.player_id) {
      playersWithEventsSet.add(e.player_id);
    } else if (e.team === 'opponent') {
      oppCount++;
    }
  });

  const coordsPct = total > 0 ? Number(((withCoords / total) * 100).toFixed(1)) : 0;

  return {
    total_events: { value: total, n: total, unit: 'kejadian' },
    coords_pct: { value: coordsPct, n: total, unit: '%' },
    with_coords_count: { value: withCoords, n: total, unit: 'kejadian' },
    without_coords_count: { value: total - withCoords, n: total, unit: 'kejadian' },
    events_per_period: eventsPerPeriod,
    first_minute: firstMin !== null ? { value: Number(firstMin.toFixed(1)), unit: 'menit' } : null,
    last_minute: lastMin !== null ? { value: Number(lastMin.toFixed(1)), unit: 'menit' } : null,
    players_with_events_count: {
      value: playersWithEventsSet.size,
      n: parts.length,
      unit: 'pemain'
    },
    opponent_events_count: { value: oppCount, n: total, unit: 'kejadian' },
    statement: 'Pencatatan manual oleh pelatih; belum diverifikasi silang.',
    n: total,
    unit: 'kejadian'
  };
}

/**
 * Dominasi sepertiga akhir (Field Tilt): proporsi umpan di sepertiga akhir lawan.
 * Arah serang tim kita: kiri -> kanan (sepertiga akhir = x >= 2/3 * L).
 * Arah serang lawan: kanan -> kiri (sepertiga akhir lawan = x <= 1/3 * L).
 */
export function fieldTilt(events = [], pitchLengthM = 90) {
  const L = Number(pitchLengthM) || 90;
  const list = Array.isArray(events) ? events : [];
  const isPass = (e) => e.event_type === 'pass' || e.event_type === 'key_pass';

  let ownFinalPasses = 0;
  let oppFinalPasses = 0;

  list.forEach((e) => {
    if (!isPass(e) || e.x_m == null || isNaN(e.x_m)) return;
    const x = Number(e.x_m);
    if (e.team === 'own' && x >= (2 / 3) * L) {
      ownFinalPasses++;
    } else if (e.team === 'opponent' && x <= (1 / 3) * L) {
      oppFinalPasses++;
    }
  });

  const total = ownFinalPasses + oppFinalPasses;
  const ownPct = total > 0 ? Number(((ownFinalPasses / total) * 100).toFixed(1)) : null;
  const oppPct = total > 0 ? Number(((oppFinalPasses / total) * 100).toFixed(1)) : null;

  return {
    own_pct: ownPct,
    opponent_pct: oppPct,
    own_passes: ownFinalPasses,
    opponent_passes: oppFinalPasses,
    n: total,
    small_sample: total < SMALL_SAMPLE_N,
    unit: '%',
    reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
  };
}

const CORRIDOR_META = [
  { id: 'left_wing', label: 'Sayap Kiri' },
  { id: 'left_half_space', label: 'Half-Space Kiri' },
  { id: 'central', label: 'Tengah' },
  { id: 'right_half_space', label: 'Half-Space Kanan' },
  { id: 'right_wing', label: 'Sayap Kanan' }
];

/**
 * Distribusi 5 koridor lebar lapangan (masing-masing 20% dari pitchWidthM).
 */
export function corridorDistribution(events = [], pitchWidthM = 60, team = 'own') {
  const W = Number(pitchWidthM) || 60;
  const list = (Array.isArray(events) ? events : []).filter((e) => team === 'all' || e.team === team);
  const counts = [0, 0, 0, 0, 0];
  let withCoords = 0;

  list.forEach((e) => {
    if (e.y_m == null || isNaN(e.y_m)) return;
    withCoords++;
    const y = Math.max(0, Math.min(W, Number(e.y_m)));
    let idx = Math.floor((y / W) * 5);
    if (idx >= 5) idx = 4;
    counts[idx]++;
  });

  const corridors = CORRIDOR_META.map((meta, idx) => ({
    ...meta,
    count: counts[idx],
    pct: withCoords > 0 ? Number(((counts[idx] / withCoords) * 100).toFixed(1)) : null,
    n: withCoords,
    unit: '%'
  }));

  let dominant = null;
  if (withCoords > 0) {
    dominant = corridors.reduce((best, curr) => (curr.count > best.count ? curr : best), corridors[0]);
  }

  return {
    corridors,
    dominant,
    n: withCoords,
    small_sample: withCoords < SMALL_SAMPLE_N,
    unit: '%',
    reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
  };
}

/**
 * Tinggi blok bertahan rata-rata (jarak aksi bertahan dari gawang sendiri).
 * Klasifikasi FIFA Football Language: <35% Blok Rendah, 35-55% Blok Menengah, >55% Blok Tinggi.
 */
export function defensiveLineHeight(events = [], pitchLengthM = 90, team = 'own') {
  const L = Number(pitchLengthM) || 90;
  const defTypes = ['tackle', 'interception', 'clearance', 'duel_ground', 'duel_air', 'foul_committed'];
  let list = (Array.isArray(events) ? events : []).filter(
    (e) => e.team === team && defTypes.includes(e.event_type) && e.x_m != null && !isNaN(e.x_m)
  );
  if (list.length === 0) {
    list = (Array.isArray(events) ? events : []).filter(
      (e) => e.team === team && e.event_type === 'ball_recovery' && e.x_m != null && !isNaN(e.x_m)
    );
  }

  const n = list.length;
  if (n === 0) {
    return {
      avg_m: null,
      pct_of_pitch: null,
      block_label: 'Belum ada data',
      n: 0,
      small_sample: true,
      unit: 'm',
      reference_ids: ['fifa-football-language-2022', 'trainor-ppda-2014']
    };
  }

  const sumDist = list.reduce((acc, e) => {
    const x = Math.max(0, Math.min(L, Number(e.x_m)));
    const distFromOwnGoal = team === 'own' ? x : L - x;
    return acc + distFromOwnGoal;
  }, 0);

  const avgM = Number((sumDist / n).toFixed(1));
  const pct = Number(((avgM / L) * 100).toFixed(1));

  let blockLabel = 'Blok Menengah';
  if (n < SMALL_SAMPLE_N) {
    blockLabel = pct < 35 ? 'Blok Rendah (sampel kecil)' : pct > 55 ? 'Blok Tinggi (sampel kecil)' : 'Blok Menengah (sampel kecil)';
  } else if (pct < 35) {
    blockLabel = 'Blok Rendah';
  } else if (pct > 55) {
    blockLabel = 'Blok Tinggi';
  }

  return {
    avg_m: avgM,
    pct_of_pitch: pct,
    block_label: blockLabel,
    n,
    small_sample: n < SMALL_SAMPLE_N,
    unit: 'm',
    reference_ids: ['fifa-football-language-2022', 'trainor-ppda-2014']
  };
}

/**
 * Distribusi zona & jarak tembakan tanpa model xG liga dewasa (Pollard & Reep 1997; Rathke 2017).
 */
export function shotZones(events = [], pitchLengthM = 90, pitchWidthM = 60, team = 'own') {
  const L = Number(pitchLengthM) || 90;
  const W = Number(pitchWidthM) || 60;
  const boxDepth = Math.min(16.5, L * 0.18);
  const boxHalfWidth = Math.min(20.16, W * 0.32);
  const goalY = W / 2;

  const shots = (Array.isArray(events) ? events : []).filter(
    (e) => (team === 'all' || e.team === team) && (e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal')
  );

  let insideBox = 0;
  let outsideBox = 0;
  let withoutCoords = 0;
  let distSum = 0;

  shots.forEach((s) => {
    if (s.x_m == null || isNaN(s.x_m) || s.y_m == null || isNaN(s.y_m)) {
      withoutCoords++;
      return;
    }
    const x = Math.max(0, Math.min(L, Number(s.x_m)));
    const y = Math.max(0, Math.min(W, Number(s.y_m)));
    const targetGoalX = s.team === 'opponent' ? 0 : L;
    const dx = Math.abs(targetGoalX - x);
    const dy = Math.abs(y - goalY);
    const dist = Math.hypot(dx, dy);
    distSum += dist;

    if (dx <= boxDepth && dy <= boxHalfWidth) {
      insideBox++;
    } else {
      outsideBox++;
    }
  });

  const withCoords = insideBox + outsideBox;
  const avgDist = withCoords > 0 ? Number((distSum / withCoords).toFixed(1)) : null;

  return {
    inside_box: {
      count: insideBox,
      pct: withCoords > 0 ? Number(((insideBox / withCoords) * 100).toFixed(1)) : null,
      n: withCoords,
      unit: 'tembakan'
    },
    outside_box: {
      count: outsideBox,
      pct: withCoords > 0 ? Number(((outsideBox / withCoords) * 100).toFixed(1)) : null,
      n: withCoords,
      unit: 'tembakan'
    },
    without_coords: withoutCoords,
    avg_distance_m: avgDist,
    n: withCoords,
    small_sample: withCoords < SMALL_SAMPLE_N,
    unit: 'tembakan',
    reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
  };
}

/**
 * Metrik transisi & perebutan bola tinggi (Vogelbein et al., 2014).
 */
export function transitionMetrics(events = [], pitchLengthM = 90, team = 'own') {
  const L = Number(pitchLengthM) || 90;
  const list = (Array.isArray(events) ? events : []).filter((e) => e.team === team);

  let highRegains = 0;
  let midRegains = 0;
  let lowRegains = 0;
  let dangerousLosses = 0;

  list.forEach((e) => {
    if (e.x_m == null || isNaN(e.x_m)) return;
    const x = Math.max(0, Math.min(L, Number(e.x_m)));
    const progressRatio = team === 'own' ? x / L : (L - x) / L;

    const isRegain =
      e.event_type === 'ball_recovery' ||
      e.event_type === 'interception' ||
      (e.event_type === 'tackle' && e.outcome !== 'fail');

    if (isRegain) {
      if (progressRatio >= 2 / 3) highRegains++;
      else if (progressRatio >= 1 / 3) midRegains++;
      else lowRegains++;
    }

    const isLoss =
      e.event_type === 'ball_loss' ||
      ((e.event_type === 'pass' || e.event_type === 'dribble') && e.outcome === 'fail');

    if (isLoss && progressRatio < 1 / 3) {
      dangerousLosses++;
    }
  });

  const totalRegains = highRegains + midRegains + lowRegains;

  return {
    total_regains: totalRegains,
    high_regains: highRegains,
    mid_regains: midRegains,
    low_regains: lowRegains,
    dangerous_losses: dangerousLosses,
    n: totalRegains,
    small_sample: totalRegains < SMALL_SAMPLE_N,
    unit: 'kejadian',
    reference_ids: ['vogelbein-2014-defensive-transition', 'fifa-football-language-2022']
  };
}

/**
 * Distribusi momentum per interval 15 menit (Babak 1 & Babak 2).
 */
export function timeIntervals(events = []) {
  const buckets = [
    { id: '0-15', label: "0-15'", period: 1, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 },
    { id: '16-30', label: "16-30'", period: 1, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 },
    { id: '31-45+', label: "31-45+'", period: 1, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 },
    { id: '46-60', label: "46-60'", period: 2, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 },
    { id: '61-75', label: "61-75'", period: 2, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 },
    { id: '76-90+', label: "76-90+'", period: 2, own_events: 0, opp_events: 0, own_shots: 0, opp_shots: 0, own_passes: 0, opp_passes: 0 }
  ];

  const list = Array.isArray(events) ? events : [];
  let total = 0;

  list.forEach((e) => {
    if (e.minute == null || isNaN(e.minute)) return;
    const min = Number(e.minute);
    const per = Number(e.period || 1);
    let idx = 0;
    if (per <= 1) {
      if (min <= 15) idx = 0;
      else if (min <= 30) idx = 1;
      else idx = 2;
    } else {
      if (min <= 60) idx = 3;
      else if (min <= 75) idx = 4;
      else idx = 5;
    }

    total++;
    const b = buckets[idx];
    const isShot = e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal';
    const isPass = e.event_type === 'pass' || e.event_type === 'key_pass';

    if (e.team === 'own') {
      b.own_events++;
      if (isShot) b.own_shots++;
      if (isPass) b.own_passes++;
    } else if (e.team === 'opponent') {
      b.opp_events++;
      if (isShot) b.opp_shots++;
      if (isPass) b.opp_passes++;
    }
  });

  return {
    buckets: buckets.map((b) => ({ ...b, n: b.own_events + b.opp_events })),
    n: total,
    unit: 'kejadian',
    reference_ids: ['sarmento-2014-match-analysis']
  };
}

/**
 * Analisis teknik permainan (progresi umpan, keamanan penguasaan, penyelesaian peluang, & duel bertahan).
 * Mengembalikan indikator deskriptif berbasis sampel nyata (n) dan rujukan ilmiah tanpa skor buatan.
 * @param {Array} events
 * @param {number} [pitchLengthM=90]
 * @param {number} [pitchWidthM=60]
 * @param {'own'|'opponent'} [team='own']
 */
export function analyzePlayingTechnique(events = [], pitchLengthM = 90, pitchWidthM = 60, team = 'own') {
  const L = Number(pitchLengthM) || 90;
  const W = Number(pitchWidthM) || 60;
  const list = (Array.isArray(events) ? events : []).filter((e) => e.team === team);
  const sign = team === 'own' ? 1 : -1;

  const passes = list.filter((e) => e.event_type === 'pass' || e.event_type === 'key_pass');
  const keyPasses = list.filter((e) => e.event_type === 'key_pass').length;
  const passSummary = passStats(events, team);
  const shotSummary = shotStats(events, team);
  const shotZoneSummary = shotZones(events, L, W, team);
  const transitionSummary = transitionMetrics(events, L, team);

  let vectorPasses = 0;
  let progressivePasses = 0;
  let switchPasses = 0;
  let backwardPasses = 0;
  let passDistSum = 0;

  passes.forEach((p) => {
    if (
      p.x_m == null || isNaN(p.x_m) ||
      p.y_m == null || isNaN(p.y_m) ||
      p.end_x_m == null || isNaN(p.end_x_m) ||
      p.end_y_m == null || isNaN(p.end_y_m)
    ) {
      return;
    }
    vectorPasses++;
    const dx = (Number(p.end_x_m) - Number(p.x_m)) * sign;
    const dy = Math.abs(Number(p.end_y_m) - Number(p.y_m));
    const dist = Math.hypot(dx, dy);
    passDistSum += dist;

    if (dx >= Math.max(8, L * 0.1)) progressivePasses++;
    if (dy >= Math.max(15, W * 0.28)) switchPasses++;
    if (dx <= -4) backwardPasses++;
  });

  const dribbles = list.filter((e) => e.event_type === 'dribble');
  const dribbleSuccess = dribbles.filter((e) => e.outcome === 'success').length;
  const ballLosses = list.filter(
    (e) =>
      e.event_type === 'ball_loss' ||
      ((e.event_type === 'pass' || e.event_type === 'dribble') && e.outcome === 'fail')
  ).length;

  const tackles = list.filter((e) => e.event_type === 'tackle').length;
  const interceptions = list.filter((e) => e.event_type === 'interception').length;
  const clearances = list.filter((e) => e.event_type === 'clearance').length;
  const duels = list.filter((e) => e.event_type === 'duel_ground' || e.event_type === 'duel_air');
  const duelWins = duels.filter((e) => e.outcome === 'success').length;

  const progressivePct = vectorPasses > 0 ? Number(((progressivePasses / vectorPasses) * 100).toFixed(1)) : null;
  const avgPassDistM = vectorPasses > 0 ? Number((passDistSum / vectorPasses).toFixed(1)) : null;
  const retentionRiskPct = list.length > 0 ? Number(((ballLosses / list.length) * 100).toFixed(1)) : null;
  const dribbleSuccessPct = dribbles.length > 0 ? Number(((dribbleSuccess / dribbles.length) * 100).toFixed(1)) : null;
  const duelWinPct = duels.length > 0 ? Number(((duelWins / duels.length) * 100).toFixed(1)) : null;

  let buildUpStyle = 'Belum cukup data umpan';
  if (vectorPasses >= 3) {
    if (avgPassDistM >= 18 || (progressivePct != null && progressivePct >= 45)) {
      buildUpStyle = 'Progresi vertikal / langsung';
    } else if (switchPasses >= 2 && switchPasses / vectorPasses >= 0.2) {
      buildUpStyle = 'Sirkulasi lebar & perpindahan sisi';
    } else {
      buildUpStyle = 'Kombinasi pendek & menjaga penguasaan';
    }
  } else if (passes.length > 0) {
    buildUpStyle = 'Umpan tercatat tanpa koordinat tujuan lengkap';
  }

  return {
    team,
    n: list.length,
    small_sample: list.length < SMALL_SAMPLE_N,
    passing: {
      total: passSummary.n,
      accuracy_pct: passSummary.value,
      key_passes: keyPasses,
      vector_passes_n: vectorPasses,
      progressive_count: progressivePasses,
      progressive_pct: progressivePct,
      switch_count: switchPasses,
      backward_count: backwardPasses,
      avg_distance_m: avgPassDistM,
      style_label: buildUpStyle,
      reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
    },
    ball_security: {
      total_losses: ballLosses,
      dangerous_losses: transitionSummary.dangerous_losses,
      loss_share_pct: retentionRiskPct,
      dribble_attempts: dribbles.length,
      dribble_success_pct: dribbleSuccessPct,
      reference_ids: ['vogelbein-2014-defensive-transition', 'fifa-tcp-scales-of-the-game']
    },
    finishing: {
      shots_total: shotSummary.n,
      shots_on_target: shotSummary.on_target.value,
      accuracy_pct: shotSummary.accuracy_pct.value,
      inside_box_count: shotZoneSummary.inside_box.count,
      inside_box_pct: shotZoneSummary.inside_box.pct,
      avg_distance_m: shotZoneSummary.avg_distance_m,
      reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
    },
    defensive_technique: {
      tackles,
      interceptions,
      clearances,
      duels_total: duels.length,
      duel_win_pct: duelWinPct,
      high_regains: transitionSummary.high_regains,
      total_regains: transitionSummary.total_regains,
      reference_ids: ['vogelbein-2014-defensive-transition', 'trainor-ppda-2014']
    },
    reference_ids: [
      'fifa-football-language-2022',
      'sarmento-2014-match-analysis',
      'vogelbein-2014-defensive-transition'
    ]
  };
}

/**
 * Pembacaan strategi lawan berbasis struktur blok, koridor dominan, transisi, dan pola peluang.
 */
export function analyzeOpponentStrategy(events = [], pitchLengthM = 90, pitchWidthM = 60) {
  const L = Number(pitchLengthM) || 90;
  const W = Number(pitchWidthM) || 60;

  const oppEvents = (Array.isArray(events) ? events : []).filter((e) => e.team === 'opponent');
  const oppDefLine = defensiveLineHeight(events, L, 'opponent');
  const oppCorridors = corridorDistribution(events, W, 'opponent');
  const oppThirds = thirds(events, L, 'opponent');
  const oppShotZones = shotZones(events, L, W, 'opponent');
  const oppTransitions = transitionMetrics(events, L, 'opponent');
  const ownTransitions = transitionMetrics(events, L, 'own');
  const oppTechnique = analyzePlayingTechnique(events, L, W, 'opponent');
  const tilt = fieldTilt(events, L);

  let defensiveProfile = 'unknown';
  let defensiveTitle = 'Struktur blok lawan belum terbaca';
  if (oppDefLine.n > 0) {
    if (oppDefLine.pct_of_pitch < 35) {
      defensiveProfile = 'low_block';
      defensiveTitle = 'Blok Bertahan Rendah (Padat di Area Kotak Penalti)';
    } else if (oppDefLine.pct_of_pitch > 55) {
      defensiveProfile = 'high_block';
      defensiveTitle = 'Blok Bertahan Tinggi / Pressing Garis Depan';
    } else {
      defensiveProfile = 'mid_block';
      defensiveTitle = 'Blok Bertahan Menengah (Kontrol Lini Tengah)';
    }
  }

  // Deteksi pola koridor lawan (sayap kiri/kanan vs tengah)
  const wingIds = ['left_wing', 'right_wing'];
  const dominantCorridor = oppCorridors.dominant;
  let channelPattern = 'Sebaran koridor belum cukup sampel';
  let weakSideLabel = null;
  if (dominantCorridor && oppCorridors.n > 0) {
    if (dominantCorridor.id === 'left_wing' || dominantCorridor.id === 'left_half_space') {
      channelPattern = `Condong menyerang/beraksi melalui sisi kiri lapangan (${dominantCorridor.label}: ${dominantCorridor.pct}%)`;
      weakSideLabel = 'Sayap Kanan / Half-Space Kanan';
    } else if (dominantCorridor.id === 'right_wing' || dominantCorridor.id === 'right_half_space') {
      channelPattern = `Condong menyerang/beraksi melalui sisi kanan lapangan (${dominantCorridor.label}: ${dominantCorridor.pct}%)`;
      weakSideLabel = 'Sayap Kiri / Half-Space Kiri';
    } else {
      channelPattern = `Fokus progresi melalui jalur tengah (${dominantCorridor.pct}%)`;
      weakSideLabel = 'Sayap Kiri & Sayap Kanan';
    }
  }

  // Identifikasi pola dan celah strategis lawan berbasis data nyata
  const patterns = [];
  const vulnerabilities = [];

  if (oppDefLine.n > 0) {
    patterns.push({
      id: 'opp-strat-block',
      title: defensiveTitle,
      evidence: `Rata-rata jarak aksi bertahan lawan ${oppDefLine.avg_m} m dari gawang mereka (${oppDefLine.pct_of_pitch}% lapangan, n = ${oppDefLine.n}${oppDefLine.small_sample ? ', sampel kecil' : ''}).`,
      n: oppDefLine.n,
      small_sample: oppDefLine.small_sample,
      reference_ids: ['fifa-football-language-2022', 'trainor-ppda-2014']
    });

    if (defensiveProfile === 'high_block') {
      vulnerabilities.push({
        id: 'vuln-space-behind',
        title: 'Ruang Terbuka di Belakang Garis Pertahanan Tinggi',
        evidence: `Garis bertahan lawan rata-rata berada di ${oppDefLine.pct_of_pitch}% lapangan (${oppDefLine.avg_m} m), membuka ruang lari vertikal di belakang bek.`,
        n: oppDefLine.n,
        reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
      });
    } else if (defensiveProfile === 'low_block') {
      vulnerabilities.push({
        id: 'vuln-low-block-width',
        title: 'Kepadatan Sentral Rentan Perpindahan Sisi Cepat',
        evidence: `Blok rendah lawan (${oppDefLine.pct_of_pitch}% lapangan) cenderung memadati tengah dan memberi ruang umpan diagonal ke sisi lemah (weak side).`,
        n: oppDefLine.n,
        reference_ids: ['fifa-football-language-2022', 'pollard-reep-1997-playing-strategies']
      });
    }
  }

  if (dominantCorridor && oppCorridors.n > 0) {
    const isFlankHeavy = wingIds.includes(dominantCorridor.id);
    patterns.push({
      id: 'opp-strat-channel',
      title: isFlankHeavy ? `Serangan Dominan Lebar (${dominantCorridor.label})` : `Konsentrasi Aksi di ${dominantCorridor.label}`,
      evidence: `${dominantCorridor.count} dari ${oppCorridors.n} aksi berkoordinat lawan (${dominantCorridor.pct}%) terkonsentrasi di ${dominantCorridor.label}.`,
      n: oppCorridors.n,
      small_sample: oppCorridors.small_sample,
      reference_ids: ['fifa-football-language-2022', 'sarmento-2014-match-analysis']
    });

    if (dominantCorridor.pct >= 32 && weakSideLabel) {
      vulnerabilities.push({
        id: 'vuln-weak-side',
        title: `Celah Transisi di Sisi Lemah (${weakSideLabel})`,
        evidence: `Karena ${dominantCorridor.pct}% aktivitas lawan menumpuk di ${dominantCorridor.label}, sisi berlawanan (${weakSideLabel}) berpeluang terbuka saat bola direbut.`,
        n: oppCorridors.n,
        reference_ids: ['fifa-football-language-2022', 'vogelbein-2014-defensive-transition']
      });
    }
  }

  if (oppTransitions.dangerous_losses > 0) {
    vulnerabilities.push({
      id: 'vuln-buildup-turnover',
      title: 'Kerentanan Kehilangan Bola saat Build-Up Lawan',
      evidence: `Lawan tercatat kehilangan bola ${oppTransitions.dangerous_losses} kali di sepertiga pertahanan mereka sendiri.`,
      n: oppTransitions.dangerous_losses,
      reference_ids: ['vogelbein-2014-defensive-transition', 'trainor-ppda-2014']
    });
  }

  if (oppTransitions.high_regains > 0 || ownTransitions.dangerous_losses > 0) {
    patterns.push({
      id: 'opp-strat-press',
      title: 'Tekanan Transisi & Rebut Bola Tinggi Lawan',
      evidence: `Lawan mencatat ${oppTransitions.high_regains} rebut bola di sepertiga pertahanan kita, sementara tim kita mengalami ${ownTransitions.dangerous_losses} kehilangan bola di area sendiri.`,
      n: oppTransitions.high_regains + ownTransitions.dangerous_losses,
      small_sample: oppTransitions.high_regains + ownTransitions.dangerous_losses < SMALL_SAMPLE_N,
      reference_ids: ['vogelbein-2014-defensive-transition', 'fifa-football-language-2022']
    });
  }

  if (oppShotZones.n > 0) {
    const insidePct = oppShotZones.inside_box.pct ?? 0;
    patterns.push({
      id: 'opp-strat-shots',
      title: insidePct >= 50 ? 'Penetrasi Tembakan Masuk Kotak Penalti' : 'Ketergantungan Tembakan Jarak Jauh',
      evidence: `${oppShotZones.inside_box.count}/${oppShotZones.n} tembakan lawan dilepaskan dari dalam kotak penalti (jarak rata-rata ${oppShotZones.avg_distance_m} m).`,
      n: oppShotZones.n,
      small_sample: oppShotZones.small_sample,
      reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
    });
  }

  return {
    n: oppEvents.length,
    small_sample: oppEvents.length < SMALL_SAMPLE_N,
    defensive_profile: defensiveProfile,
    defensive_title: defensiveTitle,
    channel_pattern: channelPattern,
    dominant_corridor: dominantCorridor,
    weak_side_label: weakSideLabel,
    buildup_style: oppTechnique.passing.style_label,
    opp_field_tilt_pct: tilt.opponent_pct,
    opp_final_third_pct: oppThirds.defensive.value,
    patterns,
    vulnerabilities,
    reference_ids: [
      'fifa-football-language-2022',
      'sarmento-2014-match-analysis',
      'vogelbein-2014-defensive-transition'
    ]
  };
}

/**
 * Mesin rekomendasi kontra-taktik & fokus latihan berbasis bukti pertandingan dan rujukan ilmiah.
 */
export function generateCounterTactics(summary, ownTechnique, opponentStrategy, opponentName = 'Lawan') {
  const cleanOpponentName = String(opponentName || 'Lawan').replace(/\s*\([^)]*\)\s*/g, ' ').trim() || 'Lawan';
  opponentName = cleanOpponentName;
  const recommendations = [];

  // 1. Kontra terhadap blok bertahan lawan
  if (opponentStrategy.defensive_profile === 'high_block') {
    recommendations.push({
      id: 'ct-vs-high-block',
      priority: 'tinggi',
      category: 'serangan',
      title: `Eksploitasi Ruang di Belakang Garis Tinggi ${opponentName}`,
      trigger_evidence: `Lawan bertahan tinggi rata-rata ${summary.opponent.def_line.avg_m} m (${summary.opponent.def_line.pct_of_pitch}% lapangan, n = ${summary.opponent.def_line.n}).`,
      tactical_action: 'Gunakan umpan pemecah lini (line-breaking pass) atau umpan terobosan diagonal ke ruang belakang bek lawan begitu gelandang mendapat ruang hadap ke depan.',
      training_focus: 'Latihan progresi 3v2 / 4v3 dari zona tengah menuju lari diagonal penyerang di belakang garis bek.',
      n: summary.opponent.def_line.n,
      small_sample: summary.opponent.def_line.small_sample,
      reference_ids: ['fifa-football-language-2022', 'fifa-grassroots-progressive-12-15']
    });
  } else if (opponentStrategy.defensive_profile === 'low_block') {
    recommendations.push({
      id: 'ct-vs-low-block',
      priority: 'tinggi',
      category: 'serangan',
      title: `Bongkar Blok Rendah ${opponentName} dengan Lebar & Half-Space`,
      trigger_evidence: `Blok bertahan lawan rendah (${summary.opponent.def_line.avg_m} m / ${summary.opponent.def_line.pct_of_pitch}% lapangan, n = ${summary.opponent.def_line.n}).`,
      tactical_action: 'Pancing geseran blok ke satu sisi lalu lakukan perpindahan sisi cepat (switch of play) ke koridor sisi lemah untuk menciptakan umpan tarik (cut-back) ke dalam kotak penalti.',
      training_focus: 'Latihan kombinasi orang ketiga di half-space dan umpan tarik ke zona tembakan jarak dekat.',
      n: summary.opponent.def_line.n,
      small_sample: summary.opponent.def_line.small_sample,
      reference_ids: ['fifa-football-language-2022', 'pollard-reep-1997-playing-strategies']
    });
  } else if (opponentStrategy.defensive_profile === 'mid_block') {
    recommendations.push({
      id: 'ct-vs-mid-block',
      priority: 'sedang',
      category: 'serangan',
      title: `Tembus Blok Menengah ${opponentName} Lewat Koridor Half-Space`,
      trigger_evidence: `Lawan memakai blok menengah (${summary.opponent.def_line.avg_m} m / ${summary.opponent.def_line.pct_of_pitch}% lapangan, n = ${summary.opponent.def_line.n}).`,
      tactical_action: 'Tempatkan pemain di antara lini (between the lines) pada half-space kiri/kanan agar bek sayap lawan terpaksa keluar dari posisi.',
      training_focus: 'Rondo terarah 5v3 + 2 target untuk melatih penerimaan bola setengah badan (half-turn) di antar-lini.',
      n: summary.opponent.def_line.n,
      small_sample: summary.opponent.def_line.small_sample,
      reference_ids: ['fifa-football-language-2022', 'fifa-tcp-scales-of-the-game']
    });
  }

  // 2. Kontra terhadap koridor dominan lawan
  if (opponentStrategy.dominant_corridor && summary.opponent.corridors.n > 0) {
    const dom = opponentStrategy.dominant_corridor;
    const weakSide = opponentStrategy.weak_side_label || 'sisi berlawanan';
    recommendations.push({
      id: 'ct-corridor-trap',
      priority: dom.pct >= 35 ? 'tinggi' : 'sedang',
      category: 'bertahan',
      title: `Tutup Jalur ${dom.label} & Serang Balik ke ${weakSide}`,
      trigger_evidence: `${dom.count}/${summary.opponent.corridors.n} aksi lawan (${dom.pct}%) terkonsentrasi di ${dom.label}.`,
      tactical_action: `Rapatkan jarak bek sayap dan gelandang sisi dekat saat bola masuk ke ${dom.label} untuk menjebak pressing, lalu segera alirkan bola transisi ke ${weakSide}.`,
      training_focus: 'Latihan pergeseran kompak unit bertahan (shifting) dan umpan transisi pertama keluar dari tekanan.',
      n: summary.opponent.corridors.n,
      small_sample: summary.opponent.corridors.small_sample,
      reference_ids: ['sarmento-2014-match-analysis', 'vogelbein-2014-defensive-transition']
    });
  }

  // 3. Keamanan build-up saat kehilangan bola di area sendiri
  if (summary.own.transitions.dangerous_losses > 0) {
    recommendations.push({
      id: 'ct-buildup-security',
      priority: summary.own.transitions.dangerous_losses >= 3 ? 'tinggi' : 'sedang',
      category: 'transisi',
      title: 'Amankan Fase Build-Up Pertama & Perlindungan Rest-Defense',
      trigger_evidence: `Tim kita mengalami ${summary.own.transitions.dangerous_losses} kehilangan bola di sepertiga pertahanan sendiri.`,
      tactical_action: 'Pastikan selalu tersedia minimal 2 sudut umpan aman (segitiga dukungan) saat keluar dari sepertiga pertahanan, dan kurangi giringan berisiko di zona bahaya.',
      training_focus: 'Latihan fase pertama build-up di bawah tekanan terbatas dengan fokus pemindaian (scanning) sebelum menerima bola.',
      n: summary.own.transitions.dangerous_losses,
      small_sample: summary.own.transitions.dangerous_losses < SMALL_SAMPLE_N,
      reference_ids: ['vogelbein-2014-defensive-transition', 'fifa-tcp-scales-of-the-game']
    });
  }

  // 4. Eksploitasi kehilangan bola lawan di area pertahanan mereka
  if (summary.opponent.transitions.dangerous_losses > 0) {
    recommendations.push({
      id: 'ct-pressing-trigger',
      priority: summary.opponent.transitions.dangerous_losses >= 3 ? 'tinggi' : 'sedang',
      category: 'transisi',
      title: `Aktifkan Pemicu Pressing Tinggi ke Area Build-Up ${opponentName}`,
      trigger_evidence: `${opponentName} kehilangan bola ${summary.opponent.transitions.dangerous_losses} kali di sepertiga pertahanan mereka.`,
      tactical_action: 'Jadikan umpan balik ke bek tengah atau umpan ke tepi lapangan lawan sebagai pemicu pressing serempak 3 pemain depan untuk merebut bola dekat gawang lawan.',
      training_focus: 'Latihan reaksi 5 detik pertama setelah kehilangan atau saat memicu pressing tinggi secara kolektif.',
      n: summary.opponent.transitions.dangerous_losses,
      small_sample: summary.opponent.transitions.dangerous_losses < SMALL_SAMPLE_N,
      reference_ids: ['vogelbein-2014-defensive-transition', 'trainor-ppda-2014']
    });
  }

  // 5. Efisiensi zona tembakan (dalam vs luar kotak)
  if (summary.own.shot_zones.n > 0 && (summary.own.shot_zones.inside_box.pct ?? 0) < 50) {
    recommendations.push({
      id: 'ct-shot-quality',
      priority: 'sedang',
      category: 'teknik',
      title: 'Tingkatkan Seleksi Tembakan ke Dalam Kotak Penalti',
      trigger_evidence: `Baru ${summary.own.shot_zones.inside_box.count}/${summary.own.shot_zones.n} tembakan tim kita (${summary.own.shot_zones.inside_box.pct}%) dari dalam kotak (jarak rata-rata ${summary.own.shot_zones.avg_distance_m} m).`,
      tactical_action: 'Prioritaskan satu umpan ekstra ke ruang kosong atau cut-back ke kotak penalti sebelum melepas tembakan jarak jauh yang terhalang bek.',
      training_focus: 'Latihan penyelesaian 1-2 sentuhan dari umpan silang rendah dan sudut kotak penalti.',
      n: summary.own.shot_zones.n,
      small_sample: summary.own.shot_zones.small_sample,
      reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
    });
  } else if (summary.opponent.shot_zones.inside_box.count >= 2) {
    recommendations.push({
      id: 'ct-protect-box',
      priority: 'tinggi',
      category: 'bertahan',
      title: `Perketat Proteksi Zona Tengah Kotak Penalti dari ${opponentName}`,
      trigger_evidence: `${opponentName} melepas ${summary.opponent.shot_zones.inside_box.count} tembakan dari dalam kotak penalti (jarak rata-rata ${summary.opponent.shot_zones.avg_distance_m} m).`,
      tactical_action: 'Jaga kerapatan jarak antar bek tengah dan gelandang bertahan (zona 14) agar lawan dipaksa melepas tembakan dari sudut sempit atau luar kotak.',
      training_focus: 'Latihan koordinasi penandaan kotak penalti dan blokir jalur umpan tarik.',
      n: summary.opponent.shot_zones.n,
      small_sample: summary.opponent.shot_zones.small_sample,
      reference_ids: ['pollard-reep-1997-playing-strategies', 'rathke-2017-shot-efficiency']
    });
  }

  // 6. Teknik umpan tim kita bila akurasi rendah atau belum progresif
  if (ownTechnique.passing.total >= 5 && ownTechnique.passing.accuracy_pct != null && ownTechnique.passing.accuracy_pct < 70) {
    recommendations.push({
      id: 'ct-pass-technique',
      priority: 'sedang',
      category: 'teknik',
      title: 'Perbaiki Kualitas Umpan & Orientasi Tubuh Sebelum Menerima',
      trigger_evidence: `Tingkat keberhasilan umpan tim kita ${ownTechnique.passing.accuracy_pct}% (${summary.own.pass.successful.value}/${ownTechnique.passing.total} umpan).`,
      tactical_action: 'Instruksikan pemain tanpa bola bergerak membuka sudut umpan lebih cepat serta menjaga bobot umpan mendatar ke kaki terjauh rekan.',
      training_focus: 'Latihan kontrol arah sentuhan pertama (first-touch orientation) dan rondo posisi berjenjang.',
      n: ownTechnique.passing.total,
      small_sample: ownTechnique.passing.total < SMALL_SAMPLE_N,
      reference_ids: ['fifa-grassroots-progressive-12-15', 'fifa-tcp-spiralling-up']
    });
  }

  // Fallback jujur bila sampel sangat minim dan belum memicu aturan spesifik
  if (recommendations.length === 0 && summary.n > 0) {
    recommendations.push({
      id: 'ct-collect-more-context',
      priority: 'pemantauan',
      category: 'teknik',
      title: 'Lengkapi Pencatatan Koordinat & Aksi Kedua Tim',
      trigger_evidence: `Saat ini baru tercatat n = ${summary.n} kejadian sehingga pola strategi lawan masih bersifat awal.`,
      tactical_action: 'Catat minimal 10-15 kejadian per tim (umpan, rebut bola, tembakan, dan aksi bertahan berkoordinat) atau jalankan analisis video untuk membuka rekomendasi kontra-taktik lebih tajam.',
      training_focus: 'Gunakan pengamatan bertahap per skala individu, unit, dan tim selama evaluasi pasca-laga.',
      n: summary.n,
      small_sample: true,
      reference_ids: ['sarmento-2014-match-analysis', 'fifa-tcp-scales-of-the-game']
    });
  }

  return recommendations;
}

/**
 * Ringkasan taktis terpadu (Tim Kita vs Lawan) + pembacaan teknik, strategi lawan, dan kontra-taktik berbasis rujukan ilmiah.
 */
export function buildTacticalSummary(events = [], pitchLengthM = 90, pitchWidthM = 60, opponentName = 'Lawan') {
  const L = Number(pitchLengthM) || 90;
  const W = Number(pitchWidthM) || 60;

  const ownPass = passStats(events, 'own');
  const oppPass = passStats(events, 'opponent');
  const ownShot = shotStats(events, 'own');
  const oppShot = shotStats(events, 'opponent');
  const ownThirds = thirds(events, L, 'own');
  const oppThirds = thirds(events, L, 'opponent');
  const tilt = fieldTilt(events, L);
  const ownCorridors = corridorDistribution(events, W, 'own');
  const oppCorridors = corridorDistribution(events, W, 'opponent');
  const ownDefLine = defensiveLineHeight(events, L, 'own');
  const oppDefLine = defensiveLineHeight(events, L, 'opponent');
  const ownShotZones = shotZones(events, L, W, 'own');
  const oppShotZones = shotZones(events, L, W, 'opponent');
  const ownTransition = transitionMetrics(events, L, 'own');
  const oppTransition = transitionMetrics(events, L, 'opponent');
  const ppdaMetric = ppda(events, L);
  const intervals = timeIntervals(events);

  const observations = [];

  if (tilt.n > 0) {
    const sampleNote = tilt.small_sample ? ` (sampel kecil, n = ${tilt.n} umpan sepertiga akhir)` : ` (n = ${tilt.n} umpan sepertiga akhir)`;
    observations.push({
      id: 'obs-field-tilt',
      perspective: 'comparison',
      title: 'Penguasaan Wilayah Sepertiga Akhir (Field Tilt)',
      detail: `Tim kita mencatat ${tilt.own_passes} umpan (${tilt.own_pct}%) di sepertiga akhir lawan, berbanding ${tilt.opponent_passes} umpan (${tilt.opponent_pct}%) milik lawan di sepertiga pertahanan kita${sampleNote}.`,
      n: tilt.n,
      reference_ids: tilt.reference_ids
    });
  }

  if (ownCorridors.dominant && ownCorridors.n > 0) {
    observations.push({
      id: 'obs-own-corridor',
      perspective: 'own',
      title: 'Jalur Aksi Dominan Tim Kita',
      detail: `Konsentrasi aksi tim kita tertinggi berada di koridor ${ownCorridors.dominant.label} sebanyak ${ownCorridors.dominant.count} dari ${ownCorridors.n} aksi berkoordinat (${ownCorridors.dominant.pct}%).`,
      n: ownCorridors.n,
      reference_ids: ownCorridors.reference_ids
    });
  }

  if (oppCorridors.dominant && oppCorridors.n > 0) {
    observations.push({
      id: 'obs-opp-corridor',
      perspective: 'opponent',
      title: 'Pola Sisi Permainan Lawan',
      detail: `Aktivitas lawan paling padat tercatat di koridor ${oppCorridors.dominant.label} (${oppCorridors.dominant.count}/${oppCorridors.n} aksi berkoordinat, ${oppCorridors.dominant.pct}%). Pelatih dapat mengevaluasi kepadatan proteksi di sisi tersebut.`,
      n: oppCorridors.n,
      reference_ids: oppCorridors.reference_ids
    });
  }

  if (ownDefLine.n > 0 || oppDefLine.n > 0) {
    const ownText = ownDefLine.n > 0
      ? `Tim kita bertahan rata-rata ${ownDefLine.avg_m} m dari gawang sendiri (${ownDefLine.pct_of_pitch}% lapangan — ${ownDefLine.block_label}, n = ${ownDefLine.n}).`
      : 'Belum ada aksi bertahan berkoordinat untuk tim kita.';
    const oppText = oppDefLine.n > 0
      ? `Lawan bertahan rata-rata ${oppDefLine.avg_m} m dari gawang mereka (${oppDefLine.pct_of_pitch}% lapangan — ${oppDefLine.block_label}, n = ${oppDefLine.n}).`
      : 'Belum ada aksi bertahan berkoordinat untuk lawan.';
    observations.push({
      id: 'obs-def-block',
      perspective: 'comparison',
      title: 'Struktur Blok Bertahan (Kita vs Lawan)',
      detail: `${ownText} ${oppText}`,
      n: ownDefLine.n + oppDefLine.n,
      reference_ids: ownDefLine.reference_ids
    });
  }

  if (ownTransition.n > 0 || ownTransition.dangerous_losses > 0 || oppTransition.dangerous_losses > 0) {
    observations.push({
      id: 'obs-transitions',
      perspective: 'own',
      title: 'Transisi & Rebut Bola Tinggi',
      detail: `Tim kita mencatat ${ownTransition.high_regains} rebut bola tinggi di sepertiga akhir lawan (dari ${ownTransition.total_regains} total perebutan bola) dan ${ownTransition.dangerous_losses} kehilangan bola di sepertiga pertahanan sendiri. Lawan mengalami ${oppTransition.dangerous_losses} kehilangan bola di area pertahanan mereka.`,
      n: ownTransition.total_regains + ownTransition.dangerous_losses,
      reference_ids: ownTransition.reference_ids
    });
  }

  if (ownShotZones.n > 0 || oppShotZones.n > 0) {
    const ownShotDesc = ownShotZones.n > 0
      ? `Tim kita: ${ownShotZones.inside_box.count}/${ownShotZones.n} tembakan dari dalam kotak penalti (jarak rata-rata ${ownShotZones.avg_distance_m} m).`
      : 'Tim kita belum mencatat tembakan berkoordinat.';
    const oppShotDesc = oppShotZones.n > 0
      ? `Lawan: ${oppShotZones.inside_box.count}/${oppShotZones.n} tembakan dari dalam kotak penalti (jarak rata-rata ${oppShotZones.avg_distance_m} m).`
      : 'Lawan belum mencatat tembakan berkoordinat.';
    observations.push({
      id: 'obs-shot-zones',
      perspective: 'comparison',
      title: 'Kualitas Lokasi Tembakan (Dalam vs Luar Kotak)',
      detail: `${ownShotDesc} ${oppShotDesc}`,
      n: ownShotZones.n + oppShotZones.n,
      reference_ids: ownShotZones.reference_ids
    });
  }

  const baseSummary = {
    own: {
      pass: ownPass,
      shot: ownShot,
      thirds: ownThirds,
      corridors: ownCorridors,
      def_line: ownDefLine,
      shot_zones: ownShotZones,
      transitions: ownTransition
    },
    opponent: {
      pass: oppPass,
      shot: oppShot,
      thirds: oppThirds,
      corridors: oppCorridors,
      def_line: oppDefLine,
      shot_zones: oppShotZones,
      transitions: oppTransition
    },
    field_tilt: tilt,
    ppda: ppdaMetric,
    intervals,
    observations,
    n: Array.isArray(events) ? events.length : 0
  };

  const ownTechnique = analyzePlayingTechnique(events, L, W, 'own');
  const oppTechnique = analyzePlayingTechnique(events, L, W, 'opponent');
  const opponentStrategy = analyzeOpponentStrategy(events, L, W);
  const counterTactics = generateCounterTactics(baseSummary, ownTechnique, opponentStrategy, opponentName);

  return {
    ...baseSummary,
    technique: {
      own: ownTechnique,
      opponent: oppTechnique
    },
    opponent_strategy: opponentStrategy,
    counter_tactics: counterTactics
  };
}

