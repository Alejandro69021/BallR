import { supabase, getCurrentUserProfile } from './supabase';

export const ALLOWED_EVENT_TYPES = [
  'pass',
  'key_pass',
  'shot',
  'shot_on_target',
  'goal',
  'dribble',
  'tackle',
  'interception',
  'clearance',
  'duel_ground',
  'duel_air',
  'ball_recovery',
  'ball_loss',
  'foul_committed',
  'foul_won',
  'save',
  'corner',
  'free_kick',
  'throw_in',
  'goal_kick',
  'offside',
  'note'
];

export const EVENT_TYPE_LABELS = {
  pass: 'Umpan',
  key_pass: 'Umpan kunci',
  shot: 'Tembakan',
  shot_on_target: 'Tembakan ke gawang',
  goal: 'Gol',
  dribble: 'Giringan bola',
  tackle: 'Tekel',
  interception: 'Intersepsi',
  clearance: 'Sapuan',
  duel_ground: 'Duel bawah',
  duel_air: 'Duel udara',
  ball_recovery: 'Rebut bola',
  ball_loss: 'Kehilangan bola',
  foul_committed: 'Pelanggaran dibuat',
  foul_won: 'Pelanggaran didapat',
  save: 'Penyelamatan',
  corner: 'Sepak pojok',
  free_kick: 'Tendangan bebas',
  throw_in: 'Lemparan ke dalam',
  goal_kick: 'Tendangan gawang',
  offside: 'Offside',
  note: 'Catatan teknis'
};

export const PITCH_DEFAULTS_BY_FORMAT = {
  '5v5': { pitch_length_m: 40, pitch_width_m: 25 },
  '7v7': { pitch_length_m: 60, pitch_width_m: 40 },
  '9v9': { pitch_length_m: 75, pitch_width_m: 50 },
  '11v11': { pitch_length_m: 90, pitch_width_m: 60 }
};

export const MATCH_STAGES = [
  { id: 'create', label: 'Laga dibuat' },
  { id: 'record', label: 'Catat kejadian' },
  { id: 'finish', label: 'Selesaikan laga' },
  { id: 'report', label: 'Laporan' }
];

export const DEMO_STORE_VERSION = 'v11.1';

export function isDemoModeActive() {
  return import.meta.env?.VITE_DEMO_MODE === 'true';
}

export function generateUUID() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      return [...bytes]
        .map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'))
        .join('');
    }
  }
  const now = Date.now().toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${now.slice(-12)}`;
}

/**
 * Validates an event against the match pitch and constraints.
 */
export function validateEvent(event, pitchDimensions = { pitch_length_m: 90, pitch_width_m: 60 }) {
  if (!event || typeof event !== 'object') {
    throw new Error('Data kejadian tidak valid');
  }

  // 1. Allowed event types
  if (!ALLOWED_EVENT_TYPES.includes(event.event_type)) {
    throw new Error(`Jenis kejadian tidak valid: ${event.event_type}`);
  }

  // 2. Team check
  if (event.team !== 'own' && event.team !== 'opponent') {
    throw new Error('Tim harus "own" atau "opponent"');
  }

  // 3. Opponent events carry opponent_number only (1..99, never player_id)
  if (event.team === 'opponent') {
    if (event.player_id) {
      throw new Error('Kejadian lawan tidak boleh memiliki ID pemain');
    }
    if (event.opponent_number == null) {
      throw new Error('Kejadian lawan wajib memiliki nomor punggung lawan (1-99)');
    }
    const oppNum = Number(event.opponent_number);
    if (!Number.isInteger(oppNum) || oppNum < 1 || oppNum > 99) {
      throw new Error('Nomor punggung lawan harus berupa angka bulat antara 1 dan 99');
    }
  }

  // 4. Own events must not carry opponent_number
  if (event.team === 'own') {
    if (event.opponent_number != null) {
      throw new Error('Kejadian tim sendiri tidak boleh memiliki nomor punggung lawan');
    }
  }

  // 5. Coordinates: (x == null) === (y == null)
  const hasX = event.x_m !== null && event.x_m !== undefined && event.x_m !== '';
  const hasY = event.y_m !== null && event.y_m !== undefined && event.y_m !== '';
  if (hasX !== hasY) {
    throw new Error('Koordinat X dan Y harus keduanya terisi atau keduanya kosong');
  }

  const maxLen = Number(pitchDimensions?.pitch_length_m ?? 90);
  const maxWid = Number(pitchDimensions?.pitch_width_m ?? 60);

  if (hasX && hasY) {
    const x = Number(event.x_m);
    const y = Number(event.y_m);
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      throw new Error('Koordinat harus berupa angka positif');
    }
    if (x > maxLen || y > maxWid) {
      throw new Error(`Koordinat (${x}, ${y}) di luar lapangan (${maxLen} x ${maxWid} m)`);
    }
  }

  // End coordinates: (end_x == null) === (end_y == null)
  const hasEndX = event.end_x_m !== null && event.end_x_m !== undefined && event.end_x_m !== '';
  const hasEndY = event.end_y_m !== null && event.end_y_m !== undefined && event.end_y_m !== '';
  if (hasEndX !== hasEndY) {
    throw new Error('Koordinat akhir X dan Y harus keduanya terisi atau keduanya kosong');
  }

  if (hasEndX && hasEndY) {
    const endX = Number(event.end_x_m);
    const endY = Number(event.end_y_m);
    if (isNaN(endX) || isNaN(endY) || endX < 0 || endY < 0) {
      throw new Error('Koordinat akhir harus berupa angka positif');
    }
    if (endX > maxLen || endY > maxWid) {
      throw new Error(`Koordinat akhir (${endX}, ${endY}) di luar lapangan (${maxLen} x ${maxWid} m)`);
    }
  }

  // 6. Period (1..4)
  const period = Number(event.period ?? 1);
  if (!Number.isInteger(period) || period < 1 || period > 4) {
    throw new Error('Babak harus antara 1 dan 4');
  }

  // 7. Minute (0..130)
  const minute = Number(event.minute ?? 0);
  if (isNaN(minute) || minute < 0 || minute > 130) {
    throw new Error('Menit pertandingan harus antara 0 dan 130');
  }

  // 8. Outcome
  if (event.outcome != null && event.outcome !== '' && event.outcome !== 'success' && event.outcome !== 'fail') {
    throw new Error('Hasil kejadian harus "success" atau "fail"');
  }

  // 9. Video time in seconds (0..14400, optional)
  if (event.video_time_s !== null && event.video_time_s !== undefined && event.video_time_s !== '') {
    const vts = Number(event.video_time_s);
    if (isNaN(vts) || vts < 0 || vts > 14400) {
      throw new Error('Waktu video harus antara 0 dan 14400 detik');
    }
  }

  return true;
}

/**
 * Plain Indonesian error formatter.
 */
export function formatMatchError(err) {
  if (!err) return 'Terjadi kesalahan tidak terduga';
  const msg = err.message || String(err);
  if (msg.includes('Pertandingan sudah final')) {
    return 'Pertandingan sudah final; buka kembali sebagai draf untuk mengubah kejadian';
  }
  if (msg.includes('di luar lapangan')) {
    return msg;
  }
  if (msg.includes('Hanya admin yang dapat')) {
    return 'Hanya admin yang dapat membuka kembali pertandingan final';
  }
  if (msg.includes('Ukuran lapangan tidak dapat diubah')) {
    return 'Ukuran lapangan tidak dapat diubah pada pertandingan final';
  }
  if (msg.includes('Pemain bukan bagian dari akademi')) {
    return 'Pemain bukan bagian dari akademi pertandingan ini';
  }
  return msg;
}

// ==============================================================================
// Demo Store Persistence (localStorage under "demo_" prefix)
// ==============================================================================

const DEMO_STORE_KEY = 'demo_matches_store';

function createInitialDemoState() {
  const matchId = 'demo-match-contoh-01';
  const initialMatch = {
    id: matchId,
    academy_id: 'demo-academy-01',
    opponent_name: 'Lawan Contoh',
    match_date: '2026-10-18',
    competition: 'Liga Remaja U-13 (Contoh)',
    age_group: 'U-13',
    format: '11v11',
    pitch_length_m: 90,
    pitch_width_m: 60,
    own_score: 2,
    opponent_score: 1,
    status: 'final',
    video_offset_s: null,
    video_offset_p2_s: null,
    video_p2_start_min: null,
    created_by: 'demo-coach-01',
    created_at: '2026-10-18T08:00:00Z',
    updated_at: '2026-10-18T10:00:00Z'
  };

  const initialParticipants = [
    { match_id: matchId, player_id: 'WK-2026-0046', player_name: 'Muhammad Rafli', jersey_number: 1, started: true, position: 'Goalkeeper (GK)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0045', player_name: 'Bagas Ramadhan', jersey_number: 4, started: true, position: 'Center Back (CB)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0048', player_name: 'Ilham Satria', jersey_number: 2, started: true, position: 'Right Back (RB)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0047', player_name: 'Fajar Pratama', jersey_number: 6, started: true, position: 'Defensive Midfielder (CDM)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0042', player_name: 'Dimas Arya Pratama', jersey_number: 10, started: true, position: 'Attacking Midfielder (CAM)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0043', player_name: 'Kevin Maulana', jersey_number: 7, started: true, position: 'Right Winger (RW)', minute_in: 0, minute_out: 90 },
    { match_id: matchId, player_id: 'WK-2026-0044', player_name: 'Rizky Alamsyah', jersey_number: 11, started: true, position: 'Center Forward (ST)', minute_in: 0, minute_out: 90 }
  ];

  // Exactly 25 realistic fictional events referencing demo player ids
  const initialEvents = [
    { id: 'demo-evt-01', match_id: matchId, client_event_id: 'c-evt-01', period: 1, minute: 2.5, team: 'own', player_id: 'WK-2026-0046', opponent_number: null, event_type: 'pass', outcome: 'success', x_m: 45.0, y_m: 30.0, end_x_m: 55.0, end_y_m: 22.0, note: '' },
    { id: 'demo-evt-02', match_id: matchId, client_event_id: 'c-evt-02', period: 1, minute: 5.0, team: 'opponent', player_id: null, opponent_number: 7, event_type: 'interception', outcome: 'success', x_m: 52.0, y_m: 20.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-03', match_id: matchId, client_event_id: 'c-evt-03', period: 1, minute: 8.2, team: 'own', player_id: 'WK-2026-0045', opponent_number: null, event_type: 'tackle', outcome: 'success', x_m: 38.0, y_m: 45.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-04', match_id: matchId, client_event_id: 'c-evt-04', period: 1, minute: 11.4, team: 'own', player_id: 'WK-2026-0047', opponent_number: null, event_type: 'pass', outcome: 'success', x_m: 40.0, y_m: 42.0, end_x_m: 62.0, end_y_m: 48.0, note: '' },
    { id: 'demo-evt-05', match_id: matchId, client_event_id: 'c-evt-05', period: 1, minute: 12.1, team: 'own', player_id: 'WK-2026-0042', opponent_number: null, event_type: 'dribble', outcome: 'success', x_m: 62.0, y_m: 48.0, end_x_m: 72.0, end_y_m: 40.0, note: '' },
    { id: 'demo-evt-06', match_id: matchId, client_event_id: 'c-evt-06', period: 1, minute: 14.8, team: 'opponent', player_id: null, opponent_number: 4, event_type: 'foul_committed', outcome: 'fail', x_m: 72.0, y_m: 40.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-07', match_id: matchId, client_event_id: 'c-evt-07', period: 1, minute: 15.0, team: 'own', player_id: 'WK-2026-0042', opponent_number: null, event_type: 'foul_won', outcome: 'success', x_m: 72.0, y_m: 40.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-08', match_id: matchId, client_event_id: 'c-evt-08', period: 1, minute: 16.2, team: 'own', player_id: 'WK-2026-0043', opponent_number: null, event_type: 'free_kick', outcome: 'success', x_m: 72.0, y_m: 40.0, end_x_m: 82.0, end_y_m: 30.0, note: '' },
    { id: 'demo-evt-09', match_id: matchId, client_event_id: 'c-evt-09', period: 1, minute: 16.5, team: 'own', player_id: 'WK-2026-0044', opponent_number: null, event_type: 'shot_on_target', outcome: 'success', x_m: 82.0, y_m: 30.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-10', match_id: matchId, client_event_id: 'c-evt-10', period: 1, minute: 16.6, team: 'own', player_id: 'WK-2026-0044', opponent_number: null, event_type: 'goal', outcome: 'success', x_m: 88.0, y_m: 30.0, end_x_m: null, end_y_m: null, note: 'Gol pembuka tendangan bebas' },
    { id: 'demo-evt-11', match_id: matchId, client_event_id: 'c-evt-11', period: 1, minute: 22.0, team: 'opponent', player_id: null, opponent_number: 10, event_type: 'pass', outcome: 'success', x_m: 35.0, y_m: 25.0, end_x_m: 25.0, end_y_m: 32.0, note: '' },
    { id: 'demo-evt-12', match_id: matchId, client_event_id: 'c-evt-12', period: 1, minute: 23.4, team: 'opponent', player_id: null, opponent_number: 9, event_type: 'shot', outcome: 'fail', x_m: 20.0, y_m: 32.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-13', match_id: matchId, client_event_id: 'c-evt-13', period: 1, minute: 23.6, team: 'own', player_id: 'WK-2026-0046', opponent_number: null, event_type: 'goal_kick', outcome: 'success', x_m: 5.5, y_m: 30.0, end_x_m: 42.0, end_y_m: 28.0, note: '' },
    { id: 'demo-evt-14', match_id: matchId, client_event_id: 'c-evt-14', period: 1, minute: 31.0, team: 'own', player_id: 'WK-2026-0047', opponent_number: null, event_type: 'ball_recovery', outcome: 'success', x_m: 50.0, y_m: 15.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-15', match_id: matchId, client_event_id: 'c-evt-15', period: 1, minute: 38.5, team: 'opponent', player_id: null, opponent_number: 8, event_type: 'duel_ground', outcome: 'success', x_m: 48.0, y_m: 35.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-16', match_id: matchId, client_event_id: 'c-evt-16', period: 2, minute: 48.2, team: 'opponent', player_id: null, opponent_number: 11, event_type: 'corner', outcome: 'success', x_m: 0.0, y_m: 0.0, end_x_m: 10.0, end_y_m: 30.0, note: '' },
    { id: 'demo-evt-17', match_id: matchId, client_event_id: 'c-evt-17', period: 2, minute: 48.5, team: 'opponent', player_id: null, opponent_number: 5, event_type: 'goal', outcome: 'success', x_m: 8.0, y_m: 30.0, end_x_m: null, end_y_m: null, note: 'Gol sundulan sepak pojok' },
    { id: 'demo-evt-18', match_id: matchId, client_event_id: 'c-evt-18', period: 2, minute: 54.0, team: 'own', player_id: 'WK-2026-0048', opponent_number: null, event_type: 'clearance', outcome: 'success', x_m: 18.0, y_m: 42.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-19', match_id: matchId, client_event_id: 'c-evt-19', period: 2, minute: 61.2, team: 'own', player_id: 'WK-2026-0045', opponent_number: null, event_type: 'key_pass', outcome: 'success', x_m: 60.0, y_m: 28.0, end_x_m: 78.0, end_y_m: 34.0, note: '' },
    { id: 'demo-evt-20', match_id: matchId, client_event_id: 'c-evt-20', period: 2, minute: 61.5, team: 'own', player_id: 'WK-2026-0042', opponent_number: null, event_type: 'shot_on_target', outcome: 'success', x_m: 78.0, y_m: 34.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-21', match_id: matchId, client_event_id: 'c-evt-21', period: 2, minute: 61.6, team: 'own', player_id: 'WK-2026-0042', opponent_number: null, event_type: 'goal', outcome: 'success', x_m: 86.0, y_m: 32.0, end_x_m: null, end_y_m: null, note: 'Gol penyelesaian cepat' },
    { id: 'demo-evt-22', match_id: matchId, client_event_id: 'c-evt-22', period: 2, minute: 70.0, team: 'opponent', player_id: null, opponent_number: 9, event_type: 'offside', outcome: 'fail', x_m: 22.0, y_m: 38.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-23', match_id: matchId, client_event_id: 'c-evt-23', period: 2, minute: 75.4, team: 'own', player_id: 'WK-2026-0046', opponent_number: null, event_type: 'save', outcome: 'success', x_m: 4.0, y_m: 30.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-evt-24', match_id: matchId, client_event_id: 'c-evt-24', period: 2, minute: 82.1, team: 'own', player_id: 'WK-2026-0043', opponent_number: null, event_type: 'throw_in', outcome: 'success', x_m: 65.0, y_m: 60.0, end_x_m: 62.0, end_y_m: 50.0, note: '' },
    { id: 'demo-evt-25', match_id: matchId, client_event_id: 'c-evt-25', period: 2, minute: 89.0, team: 'own', player_id: 'WK-2026-0045', opponent_number: null, event_type: 'ball_loss', outcome: 'fail', x_m: 55.0, y_m: 32.0, end_x_m: null, end_y_m: null, note: '' }
  ];

  // Second match: Draft match to make logger route accessible in demo mode
  const draftMatchId = 'demo-match-draft-02';
  const draftMatch = {
    id: draftMatchId,
    academy_id: 'demo-academy-01',
    opponent_name: 'Lawan Contoh 2',
    match_date: '2026-11-25',
    competition: 'Liga Remaja U-13 (Contoh)',
    age_group: 'U-13',
    format: '11v11',
    pitch_length_m: 90,
    pitch_width_m: 60,
    own_score: null,
    opponent_score: null,
    status: 'draft',
    video_offset_s: null,
    video_offset_p2_s: null,
    video_p2_start_min: null,
    created_by: 'demo-coach-01',
    created_at: '2026-10-20T08:00:00Z',
    updated_at: '2026-10-20T08:00:00Z'
  };

  const draftParticipants = initialParticipants.map((p) => ({
    ...p,
    match_id: draftMatchId
  }));

  // Starter events for draft match
  const draftEvents = [
    { id: 'demo-draft-evt-01', match_id: draftMatchId, client_event_id: 'd-evt-01', period: 1, minute: 3.0, team: 'own', player_id: 'WK-2026-0046', opponent_number: null, event_type: 'pass', outcome: 'success', x_m: 10.0, y_m: 30.0, end_x_m: 25.0, end_y_m: 32.0, note: '' },
    { id: 'demo-draft-evt-02', match_id: draftMatchId, client_event_id: 'd-evt-02', period: 1, minute: 6.5, team: 'own', player_id: 'WK-2026-0047', opponent_number: null, event_type: 'interception', outcome: 'success', x_m: 45.0, y_m: 28.0, end_x_m: null, end_y_m: null, note: '' },
    { id: 'demo-draft-evt-03', match_id: draftMatchId, client_event_id: 'd-evt-03', period: 1, minute: 8.0, team: 'own', player_id: 'WK-2026-0042', opponent_number: null, event_type: 'key_pass', outcome: 'success', x_m: 60.0, y_m: 35.0, end_x_m: 78.0, end_y_m: 30.0, note: '' }
  ];

  // Third match: Liga Sleman 2026 YouTube Live match (ready to tag, zero fabricated events)
  const ligaSlemanId = 'demo-match-liga-sleman-01';
  const ligaSlemanMatch = {
    id: ligaSlemanId,
    academy_id: 'demo-academy-01',
    home_team_name: 'AMS Seyegan',
    opponent_name: 'PS Palma',
    match_date: '2026-11-22',
    competition: 'Seri A | Liga Sleman 2026',
    age_group: 'Seri A',
    format: '11v11',
    pitch_length_m: 90,
    pitch_width_m: 60,
    own_score: null,
    opponent_score: null,
    status: 'draft',
    youtube_video_id: 'utJElEonijc',
    video_offset_s: null,
    video_offset_p2_s: null,
    video_p2_start_min: null,
    created_by: 'demo-coach-01',
    created_at: '2026-11-22T15:35:45Z',
    updated_at: '2026-11-22T15:35:45Z'
  };

  return {
    version: DEMO_STORE_VERSION,
    matches: [ligaSlemanMatch, initialMatch, draftMatch],
    participants: {
      [ligaSlemanId]: initialParticipants.map((p) => ({ ...p, match_id: ligaSlemanId })),
      [matchId]: initialParticipants,
      [draftMatchId]: draftParticipants
    },
    events: {
      [ligaSlemanId]: [],
      [matchId]: initialEvents,
      [draftMatchId]: draftEvents
    }
  };
}

export function getDemoStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialDemoState();
  }
  try {
    const raw = window.localStorage.getItem(DEMO_STORE_KEY);
    if (!raw) {
      const initial = createInitialDemoState();
      window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== DEMO_STORE_VERSION) {
      const fresh = createInitialDemoState();
      window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch (e) {
    console.warn('Gagal membaca demo store dari localStorage:', e);
    return createInitialDemoState();
  }
}

function saveDemoStore(store) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Gagal menyimpan demo store ke localStorage:', e);
  }
}

// ==============================================================================
// Data Layer Functions
// ==============================================================================

/**
 * List all matches for the academy.
 */
export async function listMatches() {
  if (isDemoModeActive()) {
    const store = getDemoStore();
    return [...store.matches].sort(
      (a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    );
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single match by ID.
 */
export async function getMatch(id) {
  if (!id) return null;

  if (isDemoModeActive()) {
    const store = getDemoStore();
    return store.matches.find((m) => m.id === id) || null;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new match.
 */
export async function createMatch(matchData) {
  if (!matchData?.opponent_name?.trim()) {
    throw new Error('Nama lawan wajib diisi');
  }
  if (!matchData?.match_date) {
    throw new Error('Tanggal pertandingan wajib diisi');
  }

  const format = matchData.format || '11v11';
  if (!['5v5', '7v7', '9v9', '11v11'].includes(format)) {
    throw new Error('Format pertandingan harus 5v5, 7v7, 9v9, atau 11v11');
  }

  const defaults = PITCH_DEFAULTS_BY_FORMAT[format] || { pitch_length_m: 90, pitch_width_m: 60 };
  const pitch_length_m = Number(matchData.pitch_length_m || defaults.pitch_length_m);
  const pitch_width_m = Number(matchData.pitch_width_m || defaults.pitch_width_m);

  if (pitch_length_m < 20 || pitch_length_m > 120) {
    throw new Error('Panjang lapangan harus antara 20 dan 120 meter');
  }
  if (pitch_width_m < 15 || pitch_width_m > 90) {
    throw new Error('Lebar lapangan harus antara 15 dan 90 meter');
  }

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const newMatch = {
      id: 'demo-match-' + generateUUID().slice(0, 8),
      academy_id: 'demo-academy-01',
      opponent_name: matchData.opponent_name.trim(),
      match_date: matchData.match_date,
      competition: matchData.competition?.trim() || '',
      age_group: matchData.age_group || 'U-13',
      format,
      pitch_length_m,
      pitch_width_m,
      own_score: null,
      opponent_score: null,
      status: 'draft',
      created_by: 'demo-coach-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.matches.unshift(newMatch);
    if (matchData.participants && Array.isArray(matchData.participants)) {
      store.participants[newMatch.id] = matchData.participants.map((p) => ({
        ...p,
        match_id: newMatch.id
      }));
    } else {
      store.participants[newMatch.id] = [];
    }
    store.events[newMatch.id] = [];
    saveDemoStore(store);
    return newMatch;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  let academyId = matchData.academy_id;
  if (!academyId) {
    const profile = await getCurrentUserProfile();
    academyId = profile?.academy_id;
  }
  if (!academyId) {
    throw new Error('Profil pengguna belum terhubung dengan akademi');
  }

  const payload = {
    academy_id: academyId,
    opponent_name: matchData.opponent_name.trim(),
    match_date: matchData.match_date,
    competition: matchData.competition?.trim() || '',
    age_group: matchData.age_group || 'U-13',
    format,
    pitch_length_m,
    pitch_width_m,
    status: 'draft'
  };

  const { data, error } = await supabase
    .from('matches')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  if (matchData.participants && matchData.participants.length > 0) {
    await setParticipants(data.id, matchData.participants);
  }

  return data;
}

/**
 * Update an existing match patch.
 */
export async function updateMatch(id, patch) {
  if (!id) throw new Error('ID pertandingan wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const idx = store.matches.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Pertandingan tidak ditemukan');

    const updated = {
      ...store.matches[idx],
      ...patch,
      updated_at: new Date().toISOString()
    };
    store.matches[idx] = updated;
    saveDemoStore(store);
    return updated;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('matches')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Finalise a match with final scores.
 */
export async function finaliseMatch(id, { ownScore, opponentScore }) {
  if (!id) throw new Error('ID pertandingan wajib diisi');
  if (ownScore == null || opponentScore == null || ownScore === '' || opponentScore === '') {
    throw new Error('Skor tim sendiri dan lawan wajib diisi');
  }

  const own = Number(ownScore);
  const opp = Number(opponentScore);

  if (isNaN(own) || isNaN(opp) || own < 0 || opp < 0) {
    throw new Error('Skor harus berupa angka positif atau nol');
  }

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const idx = store.matches.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Pertandingan tidak ditemukan');

    const updated = {
      ...store.matches[idx],
      own_score: own,
      opponent_score: opp,
      status: 'final',
      updated_at: new Date().toISOString()
    };
    store.matches[idx] = updated;
    saveDemoStore(store);
    return updated;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('matches')
    .update({
      own_score: own,
      opponent_score: opp,
      status: 'final'
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reopen a final match back to draft (admin only in real mode).
 */
export async function reopenMatch(id) {
  if (!id) throw new Error('ID pertandingan wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const idx = store.matches.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Pertandingan tidak ditemukan');

    const updated = {
      ...store.matches[idx],
      status: 'draft',
      updated_at: new Date().toISOString()
    };
    store.matches[idx] = updated;
    saveDemoStore(store);
    return updated;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('matches')
    .update({ status: 'draft' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

const SLOT_META_RE = /\s*\[slot:#(\d{1,2})\]/i;
const NAME_META_RE = /\s*\[nama:([^\]]+)\]/i;

function encodeVisionPlayerMeta(note, playerNumber, playerName) {
  let clean = String(note || '')
    .replace(SLOT_META_RE, '')
    .replace(NAME_META_RE, '')
    .trim();
  const tags = [];
  if (playerNumber != null && Number.isInteger(Number(playerNumber)) && Number(playerNumber) >= 1 && Number(playerNumber) <= 99) {
    tags.push(`[slot:#${Number(playerNumber)}]`);
  }
  const safeName = String(playerName || '').replace(/[\[\]]/g, '').trim();
  if (safeName) {
    tags.push(`[nama:${safeName}]`);
  }
  return tags.length > 0 ? `${clean}${clean ? ' ' : ''}${tags.join(' ')}` : clean;
}

function hydrateEventPlayerMeta(evt) {
  if (!evt) return evt;
  const rawNote = String(evt.note || '');
  let playerNumber = evt.player_number != null && evt.player_number !== '' ? Number(evt.player_number) : null;
  let playerName = evt.player_name ? String(evt.player_name).trim() : null;

  const slotMatch = rawNote.match(SLOT_META_RE);
  if (playerNumber == null && slotMatch) {
    playerNumber = Number(slotMatch[1]);
  }
  const nameMatch = rawNote.match(NAME_META_RE);
  if (!playerName && nameMatch) {
    playerName = nameMatch[1].trim();
  }

  const cleanNote = rawNote.replace(SLOT_META_RE, '').replace(NAME_META_RE, '').trim();
  return {
    ...evt,
    note: cleanNote,
    ...(playerNumber != null ? { player_number: playerNumber } : {}),
    ...(playerName ? { player_name: playerName } : {})
  };
}

/**
 * List events for a match, ordered by period and minute ascending.
 */
export async function listEvents(matchId) {
  if (!matchId) return [];

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const events = store.events[matchId] || [];
    return [...events]
      .map(hydrateEventPlayerMeta)
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return a.minute - b.minute;
      });
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('period', { ascending: true })
    .order('minute', { ascending: true });

  if (error) throw error;
  return (data || []).map(hydrateEventPlayerMeta);
}

/**
 * Batch insert events with idempotent retry via client_event_id.
 */
export async function addEvents(matchId, events = []) {
  if (!matchId) throw new Error('ID pertandingan wajib diisi');
  if (!events || events.length === 0) return [];

  const match = await getMatch(matchId);
  if (!match) {
    throw new Error('Pertandingan tidak ditemukan');
  }

  if (match.status === 'final') {
    throw new Error('Pertandingan sudah final; buka kembali sebagai draf untuk mengubah kejadian');
  }

  const pitchDimensions = {
    pitch_length_m: match.pitch_length_m,
    pitch_width_m: match.pitch_width_m
  };

  // Client validation on every event before sending
  for (const evt of events) {
    validateEvent(evt, pitchDimensions);
  }

  const sanitized = events.map((evt) => {
    const rawNum = evt.player_number != null && evt.player_number !== '' ? Number(evt.player_number) : null;
    const validNum = Number.isInteger(rawNum) && rawNum >= 1 && rawNum <= 99 ? rawNum : null;
    const validName = evt.player_name ? String(evt.player_name).trim() : null;
    return {
      match_id: matchId,
      client_event_id: evt.client_event_id || generateUUID(),
      team: evt.team,
      player_id: evt.team === 'own' ? (evt.player_id || null) : null,
      opponent_number: evt.team === 'opponent' ? Number(evt.opponent_number) : null,
      period: Number(evt.period || 1),
      minute: Number(evt.minute || 0),
      event_type: evt.event_type,
      outcome: evt.outcome || null,
      x_m: evt.x_m !== null && evt.x_m !== undefined && evt.x_m !== '' ? Number(evt.x_m) : null,
      y_m: evt.y_m !== null && evt.y_m !== undefined && evt.y_m !== '' ? Number(evt.y_m) : null,
      end_x_m: evt.end_x_m !== null && evt.end_x_m !== undefined && evt.end_x_m !== '' ? Number(evt.end_x_m) : null,
      end_y_m: evt.end_y_m !== null && evt.end_y_m !== undefined && evt.end_y_m !== '' ? Number(evt.end_y_m) : null,
      note: encodeVisionPlayerMeta(evt.note || '', evt.team === 'own' ? validNum : null, evt.team === 'own' ? validName : null),
      video_time_s: evt.video_time_s !== null && evt.video_time_s !== undefined && evt.video_time_s !== '' ? Number(Number(evt.video_time_s).toFixed(1)) : null,
      _player_number: evt.team === 'own' ? validNum : null,
      _player_name: evt.team === 'own' ? validName : null
    };
  });

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const existing = store.events[matchId] || [];
    const addedList = [];

    for (const item of sanitized) {
      const already = existing.some(
        (e) => e.client_event_id === item.client_event_id && e.match_id === matchId
      );
      if (!already) {
        const { _player_number, _player_name, ...dbFields } = item;
        const fullItem = hydrateEventPlayerMeta({
          ...dbFields,
          ...(_player_number != null ? { player_number: _player_number } : {}),
          ...(_player_name ? { player_name: _player_name } : {}),
          id: 'demo-evt-' + generateUUID().slice(0, 8),
          created_at: new Date().toISOString()
        });
        existing.push(fullItem);
        addedList.push(fullItem);
      }
    }

    store.events[matchId] = existing;
    saveDemoStore(store);
    return addedList;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const dbPayload = sanitized.map(({ _player_number, _player_name, ...rest }) => rest);
  const { data, error } = await supabase
    .from('match_events')
    .upsert(dbPayload, { onConflict: 'match_id,client_event_id', ignoreDuplicates: true })
    .select();

  if (error) throw error;
  return (data || []).map(hydrateEventPlayerMeta);
}

/**
 * Delete a match event by ID.
 */
export async function deleteEvent(id, matchId) {
  if (!id) throw new Error('ID kejadian wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    if (matchId) {
      const match = store.matches.find((m) => m.id === matchId);
      if (match && match.status === 'final') {
        throw new Error('Pertandingan sudah final; buka kembali sebagai draf untuk menghapus kejadian');
      }
    }

    let deleted = false;
    for (const mId in store.events) {
      const initialLen = store.events[mId].length;
      store.events[mId] = store.events[mId].filter(
        (e) => e.id !== id && e.client_event_id !== id
      );
      if (store.events[mId].length < initialLen) {
        deleted = true;
      }
    }
    saveDemoStore(store);
    return deleted;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { error } = await supabase
    .from('match_events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Delete a draft match and its associated events and participants.
 */
export async function deleteDraftMatch(matchId) {
  if (!matchId) throw new Error('ID pertandingan wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const idx = store.matches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      if (store.matches[idx].status === 'final') {
        throw new Error('Pertandingan sudah final; hanya laga draf yang dapat dihapus');
      }
      store.matches.splice(idx, 1);
      delete store.events[matchId];
      delete store.participants[matchId];
      saveDemoStore(store);
      return true;
    }
    return false;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)
    .eq('status', 'draft');

  if (error) throw error;
  return true;
}

/**
 * Set roster participants for a match.
 */
export async function setParticipants(matchId, rows = []) {
  if (!matchId) throw new Error('ID pertandingan wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const formatted = rows.map((r) => ({
      match_id: matchId,
      player_id: r.player_id,
      started: Boolean(r.started),
      position: r.position || '',
      minute_in: r.minute_in != null ? Number(r.minute_in) : null,
      minute_out: r.minute_out != null ? Number(r.minute_out) : null
    }));
    store.participants[matchId] = formatted;
    saveDemoStore(store);
    return formatted;
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  // Replace participants
  await supabase
    .from('match_participants')
    .delete()
    .eq('match_id', matchId);

  if (!rows || rows.length === 0) return [];

  const formatted = rows.map((r) => ({
    match_id: matchId,
    player_id: r.player_id,
    started: Boolean(r.started),
    position: r.position || '',
    minute_in: r.minute_in != null ? Number(r.minute_in) : null,
    minute_out: r.minute_out != null ? Number(r.minute_out) : null
  }));

  const { data, error } = await supabase
    .from('match_participants')
    .insert(formatted)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * List participants for a match.
 */
export async function listParticipants(matchId) {
  if (!matchId) return [];

  if (isDemoModeActive()) {
    const store = getDemoStore();
    return store.participants[matchId] || [];
  }

  if (!supabase) {
    throw new Error('Koneksi Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('match_participants')
    .select('*')
    .eq('match_id', matchId);

  if (error) throw error;
  return data || [];
}

/**
 * Get video sync offsets for a match (period 1 and period 2 with p2StartMin).
 */
export function getMatchVideoOffsets(matchId) {
  if (!matchId) return { p1: null, p2: null, p2StartMin: null };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`ballr_video_offset_${matchId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          p1: parsed.p1 != null ? Number(parsed.p1) : null,
          p2: parsed.p2 != null ? Number(parsed.p2) : null,
          p2StartMin:
            parsed.p2StartMin != null &&
            !isNaN(parsed.p2StartMin) &&
            Number(parsed.p2StartMin) > 0 &&
            Number(parsed.p2StartMin) <= 130
              ? Number(parsed.p2StartMin)
              : null
        };
      }
    } catch {}
  }

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const match = store.matches?.find((m) => m.id === matchId);
    if (match) {
      return {
        p1: match.video_offset_s != null ? Number(match.video_offset_s) : null,
        p2: match.video_offset_p2_s != null ? Number(match.video_offset_p2_s) : null,
        p2StartMin:
          match.video_p2_start_min != null &&
          !isNaN(match.video_p2_start_min) &&
          Number(match.video_p2_start_min) > 0 &&
          Number(match.video_p2_start_min) <= 130
            ? Number(match.video_p2_start_min)
            : null
      };
    }
  }

  return { p1: null, p2: null, p2StartMin: null };
}

/**
 * Update video sync offsets for a match.
 */
export async function updateMatchVideoOffsets(matchId, { offsetP1, offsetP2, p2StartMin }) {
  if (!matchId) return;

  const p1Val = offsetP1 !== null && offsetP1 !== undefined && offsetP1 !== '' ? Number(offsetP1) : null;
  const p2Val = offsetP2 !== null && offsetP2 !== undefined && offsetP2 !== '' ? Number(offsetP2) : null;
  const p2StartVal =
    p2StartMin !== null &&
    p2StartMin !== undefined &&
    p2StartMin !== '' &&
    !isNaN(Number(p2StartMin)) &&
    Number(p2StartMin) > 0 &&
    Number(p2StartMin) <= 130
      ? Number(p2StartMin)
      : null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        `ballr_video_offset_${matchId}`,
        JSON.stringify({ p1: p1Val, p2: p2Val, p2StartMin: p2StartVal })
      );
    } catch (e) {
      console.warn('Gagal menyimpan offset video di localStorage:', e);
    }
  }

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const match = store.matches?.find((m) => m.id === matchId);
    if (match) {
      match.video_offset_s = p1Val;
      match.video_offset_p2_s = p2Val;
      match.video_p2_start_min = p2StartVal;
      saveDemoStore(store);
    }
  }
}

