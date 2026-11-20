import { supabase, getCurrentUserProfile } from './supabase';
import { isDemoModeActive } from './matches';
import { formationTemplates } from './board';
import { REFERENCES_REGISTRY } from '../data/references';

export const SCENARIO_PHASE_LABELS = {
  build_up: 'Build-up (Konstruksi)',
  progression: 'Progresi (Pengembangan)',
  final_third: 'Sepertiga Akhir (Penyelesaian)',
  mid_block: 'Blok Menengah (Mid-block)',
  high_press: 'Pressing Tinggi (High-press)',
  transition_attack: 'Transisi Menyerang',
  transition_defence: 'Transisi Bertahan',
  set_piece: 'Bola Mati (Set-piece)'
};

export const SCENARIO_PHASE_OPTIONS = Object.entries(SCENARIO_PHASE_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const SCENARIO_STATUS_LABELS = {
  draft: 'Draf',
  reviewed: 'Ditinjau',
  published: 'Diterbitkan'
};

export const FORMAT_OPTIONS = [
  { value: '11v11', label: '11 vs 11' },
  { value: '9v9', label: '9 vs 9' },
  { value: '7v7', label: '7 vs 7' },
  { value: '5v5', label: '5 vs 5' }
];

/**
 * UUID generator helper.
 */
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
 * Formats scenario database errors into plain Indonesian messages.
 */
export function formatScenarioError(err) {
  if (!err) return 'Terjadi kesalahan tidak terduga';
  const msg = err.message || String(err);

  if (msg.includes('Skema harus ditinjau pelatih')) {
    return 'Skema harus ditinjau pelatih (peninjau dan waktu peninjauan wajib dicatat).';
  }
  if (msg.includes('Peninjau harus pelatih atau admin')) {
    return 'Peninjau harus pelatih atau admin dari akademi yang sama.';
  }
  if (msg.includes('Peninjau harus berbeda dari pembuat skema')) {
    return 'Peninjau harus berbeda dari pembuat skema (akademi memiliki lebih dari satu staf).';
  }
  if (msg.includes('tanpa minimal satu rujukan')) {
    return 'Skema tidak dapat diterbitkan tanpa minimal satu rujukan terlampir.';
  }
  if (msg.includes('tanpa bingkai')) {
    return 'Skema tidak dapat diterbitkan tanpa bingkai (frame) gerakan.';
  }
  if (msg.includes('sudah diterbitkan tidak dapat diubah')) {
    return 'Skema yang sudah diterbitkan tidak dapat diubah; kembalikan ke draf terlebih dahulu.';
  }
  if (msg.includes('sudah diterbitkan; kembalikan ke draf')) {
    return 'Skema sudah diterbitkan; kembalikan ke draf untuk mengubah bingkai atau rujukan.';
  }
  if (msg.includes('status = \'draft\'') || msg.includes('draf')) {
    return 'Hanya skema berstatus draf yang dapat dihapus atau diubah.';
  }
  return msg;
}

// ==============================================================================
// Demo Store Persistence (localStorage under "demo_" prefix)
// ==============================================================================

const DEMO_SCENARIOS_KEY = 'demo_tactical_scenarios';

function createInitialDemoScenarios() {
  const scenarioId = 'demo-scenario-contoh-01';
  const template3241 = formationTemplates('11v11', { pitch_length_m: 90, pitch_width_m: 60 })['3-2-4-1'];

  const initialScenario = {
    id: scenarioId,
    academy_id: 'demo-academy-01',
    match_id: null,
    title: 'Contoh: build-up 3-2-4-1 (ilustrasi)',
    phase: 'build_up',
    format: '11v11',
    formation_own: '3-2-4-1',
    formation_opponent: '4-4-2',
    pitch_length_m: 90,
    pitch_width_m: 60,
    description: 'Ilustrasi pergerakan konstruksi awal dari lini belakang menghadapi blok dua penyerang.',
    coaching_points: '1. Melebarkan jarak bek luar. 2. Pivot turun menjemput bola saat ditekan.',
    status: 'draft',
    reviewed_by: null,
    reviewed_at: null,
    created_by: 'demo-coach-01',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  };

  const frame0Players = template3241 ? template3241.players.map((p) => ({ ...p })) : [];
  const frame1Players = frame0Players.map((p) => {
    if (p.id === 'own-5' || p.id === 'own-6') {
      return { ...p, x: p.x - 3.0 }; // pivots drop slightly
    }
    if (p.id === 'own-7' || p.id === 'own-11') {
      return { ...p, x: p.x + 5.0 }; // wingers push higher
    }
    return { ...p };
  });
  const frame2Players = frame1Players.map((p) => {
    if (p.id === 'own-8' || p.id === 'own-10') {
      return { ...p, x: p.x + 6.0 }; // attacking mids receive in pockets
    }
    return { ...p };
  });

  const initialFrames = [
    {
      scenario_id: scenarioId,
      frame_idx: 0,
      t_ms: 2000,
      players: frame0Players,
      ball: { x: 5.0, y: 30.0 },
      arrows: [
        { from: { x: 5.0, y: 30.0 }, to: { x: 14.0, y: 15.0 }, kind: 'pass' }
      ],
      note: 'Posisikan bek tengah melebar dan pivot menjemput bola.'
    },
    {
      scenario_id: scenarioId,
      frame_idx: 1,
      t_ms: 2000,
      players: frame1Players,
      ball: { x: 25.0, y: 37.0 },
      arrows: [
        { from: { x: 14.0, y: 15.0 }, to: { x: 25.0, y: 37.0 }, kind: 'pass' },
        { from: { x: 40.0, y: 53.0 }, to: { x: 50.0, y: 53.0 }, kind: 'run' }
      ],
      note: 'Umpan ke pivot tengah, gelandang sayap bergerak membuka ruang.'
    },
    {
      scenario_id: scenarioId,
      frame_idx: 2,
      t_ms: 2500,
      players: frame2Players,
      ball: { x: 45.0, y: 37.0 },
      arrows: [
        { from: { x: 25.0, y: 37.0 }, to: { x: 45.0, y: 37.0 }, kind: 'pass' },
        { from: { x: 50.0, y: 36.0 }, to: { x: 45.0, y: 37.0 }, kind: 'press' }
      ],
      note: 'Progresi ke sepertiga akhir melalui gelandang serang.'
    }
  ];

  const initialReferences = [
    {
      scenario_id: scenarioId,
      reference_id: 'fifa-tcp-spiralling-up',
      note: 'Prinsip progresi spiral bertahap (FIFA TCP Framework)'
    }
  ];

  return {
    scenarios: [initialScenario],
    frames: { [scenarioId]: initialFrames },
    references: { [scenarioId]: initialReferences }
  };
}

function getDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_SCENARIOS_KEY);
    if (!raw) {
      const initial = createInitialDemoScenarios();
      localStorage.setItem(DEMO_SCENARIOS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return createInitialDemoScenarios();
  }
}

function saveDemoStore(store) {
  try {
    localStorage.setItem(DEMO_SCENARIOS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Gagal menyimpan demo store:', err);
  }
}

// ==============================================================================
// Scenarios Data Access API
// ==============================================================================

/**
 * List tactical scenarios for current user's academy.
 */
export async function listScenarios() {
  if (isDemoModeActive()) {
    const store = getDemoStore();
    return (store.scenarios || []).map((s) => ({
      ...s,
      frames_count: (store.frames[s.id] || []).length,
      references_count: (store.references[s.id] || []).length
    }));
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const profile = await getCurrentUserProfile();
  if (!profile?.academy_id) {
    throw new Error('Pengguna tidak terdaftar pada akademi');
  }

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .select(`
      *,
      scenario_frames (frame_idx),
      scenario_references (reference_id)
    `)
    .eq('academy_id', profile.academy_id)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((s) => ({
    ...s,
    frames_count: s.scenario_frames?.length || 0,
    references_count: s.scenario_references?.length || 0
  }));
}

/**
 * Get single tactical scenario by ID with its sorted frames and attached references.
 */
export async function getScenario(id) {
  if (!id) throw new Error('ID skema wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === id);
    if (!scenario) return null;

    const frames = (store.frames[id] || []).sort((a, b) => a.frame_idx - b.frame_idx);
    const rawRefs = store.references[id] || [];

    const enrichedRefs = rawRefs.map((r) => {
      const registryEntry = REFERENCES_REGISTRY.find((entry) => entry.id === r.reference_id);
      return {
        ...r,
        title: registryEntry?.title || r.reference_id,
        publisher: registryEntry?.publisher || '',
        year: registryEntry?.year || '',
        status: registryEntry?.status || 'unverified',
        url: registryEntry?.url || ''
      };
    });

    return {
      ...scenario,
      frames,
      references: enrichedRefs
    };
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .select(`
      *,
      scenario_frames (*),
      scenario_references (
        reference_id,
        note,
        references:reference_id (
          id,
          title,
          publisher,
          year,
          status,
          url
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const frames = (data.scenario_frames || []).sort((a, b) => a.frame_idx - b.frame_idx);
  const references = (data.scenario_references || []).map((r) => ({
    reference_id: r.reference_id,
    note: r.note || '',
    title: r.references?.title || r.reference_id,
    publisher: r.references?.publisher || '',
    year: r.references?.year || '',
    status: r.references?.status || 'unverified',
    url: r.references?.url || ''
  }));

  return {
    ...data,
    frames,
    references
  };
}

/**
 * Create a new tactical scenario (draft).
 */
export async function createScenario({
  title,
  phase = 'build_up',
  format = '11v11',
  pitch_length_m,
  pitch_width_m,
  formation_own = '',
  formation_opponent = '',
  description = '',
  coaching_points = '',
  match_id = null
}) {
  if (!title || !title.trim()) {
    throw new Error('Judul skema wajib diisi');
  }

  const len = Number(pitch_length_m || (format === '5v5' ? 40 : format === '7v7' ? 60 : format === '9v9' ? 75 : 90));
  const wid = Number(pitch_width_m || (format === '5v5' ? 25 : format === '7v7' ? 40 : format === '9v9' ? 50 : 60));

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenarioId = 'demo-scen-' + generateUUID().slice(0, 8);
    const newScenario = {
      id: scenarioId,
      academy_id: 'demo-academy-01',
      match_id: match_id || null,
      title: title.trim(),
      phase,
      format,
      formation_own,
      formation_opponent,
      pitch_length_m: len,
      pitch_width_m: wid,
      description: description.trim(),
      coaching_points: coaching_points.trim(),
      status: 'draft',
      reviewed_by: null,
      reviewed_at: null,
      created_by: 'demo-coach-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Initialize frame 0 from template if formation selected
    const templates = formationTemplates(format, { pitch_length_m: len, pitch_width_m: wid });
    const selectedTemplate = templates[formation_own] || Object.values(templates)[0];

    const initialFrame = {
      scenario_id: scenarioId,
      frame_idx: 0,
      t_ms: 2000,
      players: selectedTemplate ? selectedTemplate.players.map((p) => ({ ...p })) : [],
      ball: selectedTemplate ? { ...selectedTemplate.ball } : { x: 5, y: wid / 2 },
      arrows: [],
      note: 'Posisi awal formasi'
    };

    store.scenarios.unshift(newScenario);
    store.frames[scenarioId] = [initialFrame];
    store.references[scenarioId] = [];
    saveDemoStore(store);

    return newScenario;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const profile = await getCurrentUserProfile();
  if (!profile?.academy_id) throw new Error('Pengguna tidak terdaftar pada akademi');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .insert({
      academy_id: profile.academy_id,
      match_id: match_id || null,
      title: title.trim(),
      phase,
      format,
      formation_own,
      formation_opponent,
      pitch_length_m: len,
      pitch_width_m: wid,
      description: description.trim(),
      coaching_points: coaching_points.trim(),
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  // Initialize frame 0 with template
  const templates = formationTemplates(format, { pitch_length_m: len, pitch_width_m: wid });
  const selectedTemplate = templates[formation_own] || Object.values(templates)[0];

  if (selectedTemplate) {
    const initialFrame = {
      scenario_id: data.id,
      frame_idx: 0,
      t_ms: 2000,
      players: selectedTemplate.players,
      ball: selectedTemplate.ball,
      arrows: [],
      note: 'Posisi awal formasi'
    };
    await supabase.from('scenario_frames').insert(initialFrame);
  }

  return data;
}

/**
 * Update scenario metadata (draft only; published scenarios are frozen).
 */
export async function updateScenario(id, patch) {
  if (!id) throw new Error('ID skema wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const idx = store.scenarios.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Skema tidak ditemukan');

    if (store.scenarios[idx].status === 'published') {
      throw new Error('Skema yang sudah diterbitkan tidak dapat diubah; kembalikan ke draf terlebih dahulu');
    }

    store.scenarios[idx] = {
      ...store.scenarios[idx],
      ...patch,
      updated_at: new Date().toISOString()
    };
    saveDemoStore(store);
    return store.scenarios[idx];
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save frames for a scenario (replaces the existing set of frames).
 */
export async function saveFrames(scenarioId, frames = []) {
  if (!scenarioId) throw new Error('ID skema wajib diisi');

  const formattedFrames = frames.map((f, idx) => ({
    scenario_id: scenarioId,
    frame_idx: idx,
    t_ms: Math.max(0, Number(f.t_ms ?? 2000)),
    players: Array.isArray(f.players) ? f.players : [],
    ball: f.ball && typeof f.ball === 'object' ? f.ball : null,
    arrows: Array.isArray(f.arrows) ? f.arrows : [],
    note: typeof f.note === 'string' ? f.note : ''
  }));

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error('Skema tidak ditemukan');
    if (scenario.status === 'published') {
      throw new Error('Skema sudah diterbitkan; kembalikan ke draf untuk mengubah bingkai atau rujukan');
    }

    store.frames[scenarioId] = formattedFrames;
    scenario.updated_at = new Date().toISOString();
    saveDemoStore(store);
    return formattedFrames;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  // Delete old frames first, then insert new batch
  const { error: delError } = await supabase
    .from('scenario_frames')
    .delete()
    .eq('scenario_id', scenarioId);

  if (delError) throw delError;

  if (formattedFrames.length > 0) {
    const { data, error: insError } = await supabase
      .from('scenario_frames')
      .insert(formattedFrames)
      .select();

    if (insError) throw insError;
    return data || [];
  }

  return [];
}

/**
 * Set references for a scenario (replaces existing attached references).
 */
export async function setReferences(scenarioId, referencesList = []) {
  if (!scenarioId) throw new Error('ID skema wajib diisi');

  // Validate reference_ids against registry
  const validRegistryIds = new Set(REFERENCES_REGISTRY.map((r) => r.id));
  for (const ref of referencesList) {
    if (!ref.reference_id || !validRegistryIds.has(ref.reference_id)) {
      throw new Error(`Rujukan tidak dikenal di registry: ${ref.reference_id}`);
    }
  }

  const rows = referencesList.map((r) => ({
    scenario_id: scenarioId,
    reference_id: r.reference_id,
    note: r.note || ''
  }));

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error('Skema tidak ditemukan');
    if (scenario.status === 'published') {
      throw new Error('Skema sudah diterbitkan; kembalikan ke draf untuk mengubah bingkai atau rujukan');
    }

    store.references[scenarioId] = rows;
    scenario.updated_at = new Date().toISOString();
    saveDemoStore(store);
    return rows;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { error: delError } = await supabase
    .from('scenario_references')
    .delete()
    .eq('scenario_id', scenarioId);

  if (delError) throw delError;

  if (rows.length > 0) {
    const { data, error: insError } = await supabase
      .from('scenario_references')
      .insert(rows)
      .select();

    if (insError) throw insError;
    return data || [];
  }

  return [];
}

/**
 * Request peer review (sets status 'reviewed', reviewed_by = current user, reviewed_at = now).
 * DB enforces peer review rule: when academy has 2+ staff, reviewer must not be author.
 */
export async function requestReview(id) {
  if (!id) throw new Error('ID skema wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error('Skema tidak ditemukan');

    scenario.status = 'reviewed';
    scenario.reviewed_by = 'demo-coach-peer';
    scenario.reviewed_at = new Date().toISOString();
    scenario.updated_at = new Date().toISOString();
    saveDemoStore(store);
    return scenario;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const profile = await getCurrentUserProfile();
  if (!profile?.id) throw new Error('Profil pengguna tidak ditemukan');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .update({
      status: 'reviewed',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Publish scenario (needs >=1 reference and >=1 frame).
 */
export async function publish(id) {
  if (!id) throw new Error('ID skema wajib diisi');

  // Pre-flight check requirement
  const scen = await getScenario(id);
  if (!scen) throw new Error('Skema tidak ditemukan');

  if (!scen.frames || scen.frames.length === 0) {
    throw new Error('Skema tidak dapat diterbitkan tanpa bingkai (frame)');
  }
  if (!scen.references || scen.references.length === 0) {
    throw new Error('Skema tidak dapat diterbitkan tanpa minimal satu rujukan');
  }

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error('Skema tidak ditemukan');

    scenario.status = 'published';
    if (!scenario.reviewed_by) {
      scenario.reviewed_by = 'demo-coach-reviewer';
      scenario.reviewed_at = new Date().toISOString();
    }
    scenario.updated_at = new Date().toISOString();
    saveDemoStore(store);
    return scenario;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .update({ status: 'published' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Return scenario back to draft (clears review).
 */
export async function backToDraft(id) {
  if (!id) throw new Error('ID skema wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error('Skema tidak ditemukan');

    scenario.status = 'draft';
    scenario.reviewed_by = null;
    scenario.reviewed_at = null;
    scenario.updated_at = new Date().toISOString();
    saveDemoStore(store);
    return scenario;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('tactical_scenarios')
    .update({
      status: 'draft',
      reviewed_by: null,
      reviewed_at: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a scenario (draft only).
 */
export async function deleteScenario(id) {
  if (!id) throw new Error('ID skema wajib diisi');

  if (isDemoModeActive()) {
    const store = getDemoStore();
    const scenario = store.scenarios.find((s) => s.id === id);
    if (!scenario) return true;

    if (scenario.status !== 'draft') {
      throw new Error('Hanya skema berstatus draf yang dapat dihapus');
    }

    store.scenarios = store.scenarios.filter((s) => s.id !== id);
    delete store.frames[id];
    delete store.references[id];
    saveDemoStore(store);
    return true;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const { error } = await supabase
    .from('tactical_scenarios')
    .delete()
    .eq('id', id)
    .eq('status', 'draft');

  if (error) throw error;
  return true;
}
