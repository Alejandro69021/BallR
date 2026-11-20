/**
 * ==============================================================================
 * Match Report & Snapshot Integrity Engine
 * Menghasilkan payload kanonikal deterministik, SHA-256 digest kejadian,
 * dan hash snapshot laporan pertandingan BallR.
 * ==============================================================================
 */

import { canonicalizeJson, computeSha256 } from './integrity';
import { supabase, getCurrentUserProfile } from './supabase';

const DEMO_SNAPSHOTS_STORAGE_KEY = 'demo_report_snapshots';

export function isDemoModeActive() {
  return import.meta.env?.VITE_DEMO_MODE === 'true';
}

function getDemoSnapshotsStore() {
  try {
    const raw = localStorage.getItem(DEMO_SNAPSHOTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Gagal membaca demo report snapshots store:', err);
  }
  return { snapshots: {} };
}

function saveDemoSnapshotsStore(store) {
  try {
    localStorage.setItem(DEMO_SNAPSHOTS_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Gagal menyimpan demo report snapshots store:', err);
  }
}

/**
 * Membangun payload laporan kanonikal deterministik.
 * Aturan:
 * - payload_version: "report-v1"
 * - match_id disertakan
 * - array diurutkan secara konsisten
 * - tanpa kolom waktu real-time (wall-clock timestamps)
 * - events_digest = SHA-256 dari daftar kejadian terurut berdasarkan client_event_id
 * @returns {Promise<Object>} Payload kanonikal deterministik
 */
export async function buildReportPayload(match = {}, participants = [], events = [], publishedScenarios = []) {
  if (!match || !match.id) {
    throw new Error('Data pertandingan tidak valid untuk membangun laporan.');
  }

  // 1. Sort & canonicalize participants (by jersey_number ASC, then player_id)
  const sortedParticipants = [...(Array.isArray(participants) ? participants : [])]
    .map((p) => ({
      player_id: String(p.player_id),
      jersey_number: p.jersey_number != null ? Number(p.jersey_number) : null,
      player_name: String(p.player_name || p.player_id),
      position: String(p.position || '-'),
      minutes_played: Number(p.minutes_played || 0),
      is_starter: Boolean(p.is_starter)
    }))
    .sort((a, b) => {
      if (a.jersey_number == null && b.jersey_number == null) return a.player_id.localeCompare(b.player_id);
      if (a.jersey_number == null) return 1;
      if (b.jersey_number == null) return -1;
      return a.jersey_number - b.jersey_number || a.player_id.localeCompare(b.player_id);
    });

  // 2. Sort & canonicalize events (strictly by client_event_id ASC)
  const sortedEvents = [...(Array.isArray(events) ? events : [])]
    .map((e) => ({
      client_event_id: String(e.client_event_id || e.id),
      event_type: String(e.event_type),
      team: String(e.team),
      period: Number(e.period || 1),
      minute: e.minute != null ? Number(Number(e.minute).toFixed(2)) : null,
      player_id: e.player_id ? String(e.player_id) : null,
      opponent_number: e.opponent_number != null ? Number(e.opponent_number) : null,
      outcome: e.outcome ? String(e.outcome) : null,
      x_m: e.x_m != null ? Number(Number(e.x_m).toFixed(2)) : null,
      y_m: e.y_m != null ? Number(Number(e.y_m).toFixed(2)) : null,
      end_x_m: e.end_x_m != null ? Number(Number(e.end_x_m).toFixed(2)) : null,
      end_y_m: e.end_y_m != null ? Number(Number(e.end_y_m).toFixed(2)) : null,
      note: e.note ? String(e.note) : ''
    }))
    .sort((a, b) => a.client_event_id.localeCompare(b.client_event_id));

  // Compute events_digest
  const canonicalEventsJson = canonicalizeJson(sortedEvents);
  const events_digest = await computeSha256(canonicalEventsJson);

  // 3. Sort & canonicalize published scenarios linked to this match
  const sortedScenarios = [...(Array.isArray(publishedScenarios) ? publishedScenarios : [])]
    .filter((s) => s.status === 'published')
    .map((s) => ({
      id: String(s.id),
      title: String(s.title || ''),
      phase: String(s.phase || ''),
      format: String(s.format || ''),
      pitch_length_m: Number(s.pitch_length_m || 90),
      pitch_width_m: Number(s.pitch_width_m || 60),
      reviewed_by: s.reviewed_by ? String(s.reviewed_by) : null,
      reviewed_at: s.reviewed_at ? String(s.reviewed_at) : null,
      references: (s.references || [])
        .map((r) => ({
          reference_id: String(r.reference_id),
          note: String(r.note || '')
        }))
        .sort((a, b) => a.reference_id.localeCompare(b.reference_id))
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // 4. Normalized match metadata
  const normalizedMatch = {
    id: String(match.id),
    opponent_name: String(match.opponent_name || 'Lawan'),
    match_date: String(match.match_date || ''),
    status: String(match.status || 'draft'),
    own_score: match.own_score != null ? Number(match.own_score) : null,
    opponent_score: match.opponent_score != null ? Number(match.opponent_score) : null,
    pitch_length_m: Number(match.pitch_length_m || 90),
    pitch_width_m: Number(match.pitch_width_m || 60),
    format: String(match.format || '11v11'),
    notes: String(match.notes || '')
  };

  // Final deterministic payload
  const canonicalPayload = {
    payload_version: 'report-v1',
    match_id: String(match.id),
    match: normalizedMatch,
    participants: sortedParticipants,
    events_digest,
    published_scenarios: sortedScenarios
  };

  return canonicalPayload;
}

/**
 * Menghitung hash snapshot SHA-256 dari canonical payload.
 */
export async function computeSnapshotHash(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload laporan tidak valid.');
  }
  const canonicalString = canonicalizeJson(payload);
  return computeSha256(canonicalString);
}

/**
 * Mempersiapkan payload, events_digest, dan snapshot_hash secara bersamaan.
 */
export async function prepareReportSnapshot(match, participants, events, publishedScenarios = []) {
  const canonicalPayload = await buildReportPayload(match, participants, events, publishedScenarios);
  const snapshot_hash = await computeSnapshotHash(canonicalPayload);
  return {
    canonical_payload: canonicalPayload,
    events_digest: canonicalPayload.events_digest,
    snapshot_hash
  };
}

/**
 * Mengambil daftar snapshot laporan untuk pertandingan.
 */
export async function listSnapshots(matchId) {
  if (!matchId) return [];

  if (isDemoModeActive()) {
    const store = getDemoSnapshotsStore();
    return store.snapshots[matchId] || [];
  }

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('report_snapshots')
    .select('*, reviewed_by_profile:reviewed_by(full_name, role)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Gagal memuat snapshot laporan:', error);
    return [];
  }
  return data || [];
}

/**
 * Mengambil snapshot laporan terbaru untuk pertandingan.
 */
export async function getLatestSnapshot(matchId) {
  const list = await listSnapshots(matchId);
  return list.length > 0 ? list[0] : null;
}

/**
 * Membekukan laporan pertandingan (hanya untuk pertandingan berstatus FINAL).
 */
export async function freezeReport({
  match,
  participants,
  events,
  publishedScenarios = [],
  reviewedBy,
  academyId
}) {
  if (!match || !match.id) throw new Error('Data pertandingan tidak valid');
  if (match.status !== 'final') {
    throw new Error('Laporan hanya dapat dibekukan untuk pertandingan yang sudah final');
  }
  if (!reviewedBy) {
    throw new Error('Pilih peninjau dari daftar staf akademi');
  }

  const { canonical_payload, events_digest, snapshot_hash } = await prepareReportSnapshot(
    match,
    participants,
    events,
    publishedScenarios
  );

  const acadId = academyId || match.academy_id || '11111111-0000-4000-8000-000000000001';

  if (isDemoModeActive()) {
    const store = getDemoSnapshotsStore();
    if (!store.snapshots[match.id]) {
      store.snapshots[match.id] = [];
    }

    // Check duplicate hash for same match
    const existing = store.snapshots[match.id].find((s) => s.snapshot_hash === snapshot_hash);
    if (existing) {
      throw new Error('duplicate hash: Laporan dengan isi persis sama sudah pernah dibekukan.');
    }

    const newSnapshot = {
      id: `snap-${Date.now()}`,
      match_id: match.id,
      academy_id: acadId,
      payload_version: canonical_payload.payload_version,
      snapshot_hash,
      events_digest,
      canonical_payload,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      created_by: 'demo-coach-creator',
      created_at: new Date().toISOString()
    };

    store.snapshots[match.id].unshift(newSnapshot);
    saveDemoSnapshotsStore(store);
    return newSnapshot;
  }

  if (!supabase) throw new Error('Koneksi Supabase belum dikonfigurasi.');

  const profile = await getCurrentUserProfile();

  const { data, error } = await supabase
    .from('report_snapshots')
    .insert({
      match_id: match.id,
      academy_id: acadId,
      payload_version: canonical_payload.payload_version,
      snapshot_hash,
      events_digest,
      canonical_payload,
      reviewed_by: reviewedBy,
      created_by: profile?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Memverifikasi ulang integritas laporan saat ini terhadap snapshot terakhir yang dibekukan.
 */
export async function verifyReport(match, participants, events, publishedScenarios = []) {
  if (!match || !match.id) {
    return { ok: false, status: 'Error', message: 'Data pertandingan tidak ditemukan' };
  }

  const latest = await getLatestSnapshot(match.id);
  if (!latest) {
    return {
      ok: false,
      status: 'Belum Ada Snapshot',
      message: 'Belum ada snapshot laporan yang dibekukan untuk pertandingan ini.'
    };
  }

  const { snapshot_hash, events_digest } = await prepareReportSnapshot(
    match,
    participants,
    events,
    publishedScenarios
  );

  const hashMatch = snapshot_hash.toLowerCase() === latest.snapshot_hash.toLowerCase();
  const digestMatch = events_digest.toLowerCase() === latest.events_digest.toLowerCase();

  if (hashMatch && digestMatch) {
    return {
      ok: true,
      status: 'Cocok',
      message: 'Cocok',
      snapshot: latest,
      currentHash: snapshot_hash,
      currentDigest: events_digest
    };
  }

  return {
    ok: false,
    status: 'Berbeda',
    message: 'Berbeda: data berubah setelah dibekukan',
    snapshot: latest,
    currentHash: snapshot_hash,
    currentDigest: events_digest
  };
}

/**
 * Terjemahan pesan error basis data snapshot laporan ke bahasa Indonesia yang lugas.
 */
export function formatReportError(err) {
  if (!err) return 'Terjadi kesalahan pada laporan';
  const msg = typeof err === 'string' ? err : err.message || '';

  if (
    msg.includes('Peninjau harus berbeda dari pembuat laporan') ||
    msg.includes('staf lebih dari satu')
  ) {
    return 'Peninjau harus pelatih lain atau admin, bukan pembuat laporan.';
  }
  if (msg.includes('Laporan hanya dapat dibekukan untuk pertandingan yang sudah final')) {
    return 'Laporan hanya dapat dibekukan untuk pertandingan yang sudah final';
  }
  if (
    msg.includes('duplicate key') ||
    msg.includes('duplicate hash') ||
    msg.includes('unique') ||
    msg.includes('UNIQUE')
  ) {
    return 'Laporan dengan isi persis sama sudah pernah dibekukan.';
  }
  if (msg.includes('Peninjau harus pelatih') || msg.includes('admin')) {
    return 'Peninjau harus staf pelatih atau admin dari akademi yang sama.';
  }
  if (
    msg.includes('Snapshot laporan bersifat tetap') ||
    msg.includes('tidak dapat diubah atau dihapus')
  ) {
    return 'Laporan yang telah dibekukan bersifat tetap dan tidak dapat diubah atau dihapus.';
  }
  return msg || 'Terjadi kesalahan pada sistem laporan.';
}
