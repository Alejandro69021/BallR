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
    reference_ids: []
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
      small_sample: totalForPlayer < 5,
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

  // Count our defensive actions in zone x >= 0.4 * L
  const ourDefActionsInZone = list.filter((e) =>
    e.team === 'own' &&
    defActionTypes.includes(e.event_type) &&
    e.x_m != null &&
    !isNaN(e.x_m) &&
    Number(e.x_m) >= xThreshold
  ).length;

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
