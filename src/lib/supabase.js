import { createClient } from '@supabase/supabase-js';
import { transformDbPlayer } from './calculations';

const isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true';

const rawUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const supabaseAnonKey = rawAnonKey;

if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    'Konfigurasi Supabase tidak ditemukan. Harap atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di berkas .env Anda, atau aktifkan VITE_DEMO_MODE=true untuk mode demo.'
  );
}

// Initialize Supabase client if credentials exist
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// 1. Authentication & Session Services
// ==============================================================================

/**
 * Signs in using email and password.
 */
export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

/**
 * Signs in using Email Magic Link (OTP).
 */
export async function signInWithMagicLink(email) {
  if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

/**
 * Signs out current user and clears session.
 */
export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Gagal keluar sesi:', error);
}

/**
 * Retrieves the currently logged-in user profile with role & academy.
 */
export async function getCurrentUserProfile() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, academy_id, full_name, phone_number')
    .eq('id', user.id)
    .single();

  if (error) {
    console.warn('Gagal memuat profil pengguna:', error.message);
    return null;
  }
  return { ...data, email: user.email };
}

// ==============================================================================
// 2. Data Queries with Explicit Column Lists (Data Minimization)
// ==============================================================================

/**
 * Fetches public player roster strictly from authorized public views.
 * Stops selecting full_name, birth_date, nisn, and coach_raw_notes for unauthenticated visitors.
 */
export async function fetchPublicPlayersFromViews() {
  if (!supabase) {
    throw new Error(
      'Koneksi Supabase belum dikonfigurasi. Harap tentukan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di berkas .env.'
    );
  }

  const [
    { data: profilesData, error: profilesError },
    { data: assessmentsData, error: assessmentsError },
    { data: fitnessData, error: fitnessError },
    { data: highlightsData, error: highlightsError }
  ] = await Promise.all([
    supabase.from('public_player_profiles').select('public_id, nickname, position, age_group, academy_name, academy_city'),
    supabase.from('public_player_assessments').select('public_id, period_month, coach_name, pace, shooting, passing, dribbling, defending, physical, strengths, growth_areas'),
    supabase.from('public_player_fitness').select('public_id, test_date, vertical_jump_cm, sprint_20m_sec, shuttle_run_sec, yoyo_score'),
    supabase.from('public_player_highlights').select('public_id, title, match_opponent, match_minute, event_type, video_url, thumbnail_url')
  ]);

  if (profilesError) throw profilesError;
  if (assessmentsError) throw assessmentsError;
  if (fitnessError) throw fitnessError;
  if (highlightsError) throw highlightsError;

  if (!profilesData || profilesData.length === 0) return [];

  const assessmentsByPlayer = (assessmentsData || []).reduce((acc, curr) => {
    if (!acc[curr.public_id]) acc[curr.public_id] = [];
    acc[curr.public_id].push(curr);
    return acc;
  }, {});

  const fitnessByPlayer = (fitnessData || []).reduce((acc, curr) => {
    if (!acc[curr.public_id]) acc[curr.public_id] = [];
    acc[curr.public_id].push(curr);
    return acc;
  }, {});

  const highlightsByPlayer = (highlightsData || []).reduce((acc, curr) => {
    if (!acc[curr.public_id]) acc[curr.public_id] = [];
    acc[curr.public_id].push(curr);
    return acc;
  }, {});

  return profilesData.map((p) => {
    const academy = {
      name: p.academy_name || 'Akademi Sepakbola',
      city: p.academy_city || 'Indonesia',
      logo_url: ''
    };
    const dbPlayer = {
      id: p.public_id,
      public_id: p.public_id,
      nickname: p.nickname,
      position: p.position,
      age_group: p.age_group,
      academy_name: p.academy_name,
      academy_city: p.academy_city,
      // Deliberately no full_name, birth_date, nisn, coach_raw_notes
      player_assessments: assessmentsByPlayer[p.public_id] || [],
      fitness_records: fitnessByPlayer[p.public_id] || [],
      video_highlights: highlightsByPlayer[p.public_id] || []
    };
    return transformDbPlayer(dbPlayer, academy, isDemoMode);
  });
}

/**
 * Fetches player via share token from secure RPC function.
 */
export async function fetchPlayerByToken(token) {
  if (!supabase || !token) return null;
  const { data, error } = await supabase.rpc('get_player_by_token', { p_token: token });
  if (error) {
    console.warn('Gagal memverifikasi token pemain:', error.message);
    return null;
  }
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data || null;
}

/**
 * Fetches live roster. If unauthenticated, uses public views exclusively.
 */
export async function fetchLiveRosterFromSupabase() {
  if (!supabase) {
    throw new Error(
      'Koneksi Supabase belum dikonfigurasi. Harap tentukan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di berkas .env.'
    );
  }

  // Check if visitor is signed in
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  // Unauthenticated visitors must only read from public views
  if (!user) {
    return fetchPublicPlayersFromViews();
  }

  // Authenticated users (coach / admin / parent)
  let academy = null;
  const { data: academyData, error: academyError } = await supabase
    .from('academies')
    .select('id, name, city, logo_url')
    .limit(1);

  if (!academyError && academyData && academyData.length > 0) {
    academy = {
      id: academyData[0].id,
      name: academyData[0].name,
      city: academyData[0].city,
      logo_url: academyData[0].logo_url
    };
  }

  const { data: playersData, error: playersError } = await supabase
    .from('players')
    .select(`
      id,
      public_id,
      academy_id,
      full_name,
      nickname,
      jersey_number,
      position,
      age_group,
      birth_date,
      nisn,
      height_cm,
      weight_kg,
      preferred_foot,
      photo_url,
      visibility_tier,
      player_assessments (
        id,
        player_id,
        period_month,
        coach_name,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        coach_raw_notes,
        ai_narrative,
        strengths,
        growth_areas,
        recommended_drill,
        is_published,
        updated_at
      ),
      fitness_records (
        id,
        player_id,
        test_date,
        vertical_jump_cm,
        sprint_20m_sec,
        shuttle_run_sec,
        yoyo_score
      ),
      video_highlights (
        id,
        player_id,
        title,
        match_opponent,
        match_minute,
        event_type,
        video_url,
        thumbnail_url
      )
    `)
    .order('jersey_number', { ascending: true });

  if (playersError) {
    throw playersError;
  }

  if (!playersData) {
    return [];
  }

  return playersData.map((p) => transformDbPlayer(p, academy, isDemoMode));
}

/**
 * Fetches verified academy accreditation from official federation records.
 */
export async function fetchAcademyAccreditation(academyId) {
  if (!supabase || !academyId) return null;

  const { data, error } = await supabase
    .from('academy_accreditations')
    .select('id, accreditation_body, registration_number, issued_date, expiry_date, source_url, is_active')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.warn('Accreditation lookup error:', error.message);
    return null;
  }
  return data;
}

// ==============================================================================
// 3. Cryptographic Snapshot & Verification Queries
// ==============================================================================

/**
 * Verifies a snapshot by its exact SHA-256 hash using verify_passport_snapshot RPC function.
 */
export async function fetchPassportSnapshot(snapshotHash) {
  if (!supabase || !snapshotHash) return null;

  const { data, error } = await supabase
    .rpc('verify_passport_snapshot', { p_hash: snapshotHash });

  if (error) {
    console.warn('Snapshot verification error:', error.message);
    return null;
  }
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data || null;
}

/**
 * Stores a verified canonical passport snapshot in passport_snapshots.
 */
export async function publishPassportSnapshot(playerId, periodMonth, snapshotHash, canonicalPayload) {
  if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');

  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    player_id: playerId,
    period_month: periodMonth,
    snapshot_hash: snapshotHash,
    canonical_payload: canonicalPayload,
    payload_version: 'v1.0',
    created_by: user?.id || null
  };

  const { data, error } = await supabase
    .from('passport_snapshots')
    .upsert(payload, { onConflict: 'player_id,period_month' })
    .select();

  if (error) throw error;
  return data?.[0];
}

// ==============================================================================
// 4. Consent Governance & Access Logging (UU PDP No. 27/2022 Pasal 25)
// ==============================================================================

export const DEMO_CONSENTS_KEY = 'demo_consents';

export function getInitialDemoConsents() {
  return [
    {
      id: 'demo-consent-0042',
      player_id: 'WK-2026-0042',
      guardian_id: 'demo-guardian-0042',
      version: 'v1.0-2026-10',
      granted_at: '2026-10-01T08:00:00.000Z',
      revoked_at: null,
      purposes: {
        public_profile: true,
        training_analysis: true,
        share_with_scouts: true
      }
    },
    {
      id: 'demo-consent-0043',
      player_id: 'WK-2026-0043',
      guardian_id: 'demo-guardian-0043',
      version: 'v1.0-2026-10',
      granted_at: '2026-10-05T09:00:00.000Z',
      revoked_at: null,
      purposes: {
        training_analysis: true,
        public_profile: false,
        share_with_scouts: false
      }
    },
    {
      id: 'demo-consent-0044',
      player_id: 'WK-2026-0044',
      guardian_id: 'demo-guardian-0044',
      version: 'v1.0-2026-10',
      granted_at: '2026-10-10T10:00:00.000Z',
      revoked_at: '2026-10-15T12:00:00.000Z',
      purposes: {
        public_profile: true,
        training_analysis: true,
        share_with_scouts: true
      }
    }
  ];
}

function getDemoConsentStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getInitialDemoConsents();
  }
  try {
    const raw = window.localStorage.getItem(DEMO_CONSENTS_KEY);
    if (!raw) {
      const initial = getInitialDemoConsents();
      window.localStorage.setItem(DEMO_CONSENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialDemoConsents();
  } catch {
    return getInitialDemoConsents();
  }
}

/**
 * Fetches active parental consents for a player.
 * Reads demo_consents from localStorage in demo mode, Supabase in real mode.
 */
export async function fetchPlayerConsents(playerId) {
  if (import.meta.env?.VITE_DEMO_MODE === 'true') {
    if (!playerId) return [];
    const store = getDemoConsentStore();
    return store
      .filter((c) => c.player_id === playerId)
      .sort((a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime());
  }

  if (!supabase || !playerId) return [];

  const { data, error } = await supabase
    .from('consents')
    .select('id, player_id, guardian_id, purposes, version, granted_at, revoked_at')
    .eq('player_id', playerId)
    .order('granted_at', { ascending: false });

  if (error) {
    console.warn('Gagal memuat status persetujuan wali:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Revokes parental consent immediately:
 * 1. Updates consents (sets revoked_at = now())
 * 2. Restricts player visibility_tier to 'private'
 * 3. Logs action in access_log
 */
export async function revokeConsentAndSetPrivate(playerId, consentId) {
  const nowIso = new Date().toISOString();

  if (import.meta.env?.VITE_DEMO_MODE === 'true') {
    const store = getDemoConsentStore();
    const updated = store.map((c) =>
      (consentId ? c.id === consentId : c.player_id === playerId)
        ? { ...c, revoked_at: nowIso }
        : c
    );
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEMO_CONSENTS_KEY, JSON.stringify(updated));
    }
    return { success: true, timestamp: nowIso };
  }

  if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');

  // 1. Mark consent revoked
  if (consentId) {
    const { error: consentErr } = await supabase
      .from('consents')
      .update({ revoked_at: nowIso })
      .eq('id', consentId);

    if (consentErr) throw consentErr;
  }

  // 2. Lock player visibility to private immediately
  const { error: playerErr } = await supabase
    .from('players')
    .update({ visibility_tier: 'private' })
    .eq('id', playerId);

  if (playerErr) throw playerErr;

  // 3. Log into access_log
  await logAccessEvent(playerId, 'revoke_consent', {
    revoked_at: nowIso,
    action_type: 'UU_PDP_ARTICLE_25_REVOCATION'
  });

  return { success: true, timestamp: nowIso };
}

/**
 * Records an entry into the immutable access_log audit trail.
 */
export async function logAccessEvent(playerId, action, metadata = {}) {
  if (!supabase || !playerId) return;

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  const entry = {
    player_id: playerId,
    actor_profile_id: user?.id || null,
    action: String(action),
    columns_viewed: metadata,
    timestamp: new Date().toISOString()
  };

  const { error } = await supabase.from('access_log').insert(entry);
  if (error) {
    console.warn('Gagal mencatat log akses:', error.message);
  }
}

// ==============================================================================
// 5. Live Mutations: Assessments & Fitness
// ==============================================================================

/**
 * Live Write Mutation: Upsert assessment
 */
export async function saveAssessmentToSupabase(playerId, assessmentData, existingAssessmentId) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  // Extract radar attribute values
  const getAttrVal = (key) => {
    const item = assessmentData.radar_attributes?.find((a) =>
      a.attribute && a.attribute.toLowerCase().includes(key.toLowerCase())
    );
    return item ? Number(item.value) || 75 : 75;
  };

  const payload = {
    player_id: playerId,
    period_month: assessmentData.ai_coach_evaluation?.period || "Oktober 2026",
    coach_name: assessmentData.ai_coach_evaluation?.coach_name || "Coach Hendro (Lisensi B AFC)",
    pace: getAttrVal('pace'),
    shooting: getAttrVal('shooting'),
    passing: getAttrVal('passing'),
    dribbling: getAttrVal('dribbling'),
    defending: getAttrVal('defending'),
    physical: getAttrVal('physical'),
    coach_raw_notes: assessmentData.rawNotes || assessmentData.ai_coach_evaluation?.narrative || "",
    ai_narrative: assessmentData.ai_coach_evaluation?.narrative || "",
    strengths: assessmentData.ai_coach_evaluation?.strengths || [],
    growth_areas: assessmentData.ai_coach_evaluation?.growth_areas || [],
    recommended_drill: assessmentData.ai_coach_evaluation?.recommended_drill || {
      title: "Wall-Pass & Quick Scanning Drill",
      category: "Ball Mastery",
      duration: "15 Menit / Hari"
    },
    is_published: true,
    updated_at: new Date().toISOString()
  };

  if (existingAssessmentId) {
    payload.id = existingAssessmentId;
  }

  // Upsert to player_assessments
  const { data: upsertData, error: upsertError } = await supabase
    .from('player_assessments')
    .upsert(payload)
    .select();

  if (upsertError) {
    throw upsertError;
  }

  return upsertData?.[0];
}

/**
 * Live Write Mutation: Insert Edge-AI camera recorded fitness test
 */
export async function insertFitnessRecordToSupabase(playerId, fitnessData) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const payload = {
    player_id: playerId,
    test_date: new Date().toISOString().split('T')[0],
    vertical_jump_cm: fitnessData.vertical_jump_cm || null,
    sprint_20m_sec: fitnessData.sprint_20m_sec || null,
    shuttle_run_sec: fitnessData.shuttle_run_sec || null,
    yoyo_score: fitnessData.yoyo_score || "Level 15.4"
  };

  const { data, error } = await supabase
    .from('fitness_records')
    .insert(payload)
    .select();

  if (error) {
    throw error;
  }

  return data?.[0];
}
