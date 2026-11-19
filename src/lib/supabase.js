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
 * Fetches live roster with explicit columns according to role & RLS.
 */
export async function fetchLiveRosterFromSupabase() {
  if (!supabase) {
    throw new Error(
      'Koneksi Supabase belum dikonfigurasi. Harap tentukan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di berkas .env.'
    );
  }

  // 1. Fetch academy info with explicit columns
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

  // 2. Fetch players with explicit columns for data minimization
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
      ovr_rating,
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
 * Fetches a snapshot by its exact SHA-256 hash.
 */
export async function fetchPassportSnapshot(snapshotHash) {
  if (!supabase || !snapshotHash) return null;

  const { data, error } = await supabase
    .from('passport_snapshots')
    .select('id, player_id, period_month, snapshot_hash, canonical_payload, payload_version, created_at')
    .eq('snapshot_hash', snapshotHash)
    .maybeSingle();

  if (error) {
    console.warn('Snapshot lookup error:', error.message);
    return null;
  }
  return data;
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

/**
 * Fetches active parental consents for a player.
 */
export async function fetchPlayerConsents(playerId) {
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
  if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');

  const nowIso = new Date().toISOString();

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
 * Live Write Mutation: Upsert assessment & update player's ovr_rating
 */
export async function saveAssessmentToSupabase(playerId, assessmentData, ovrRating, existingAssessmentId) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  // 1. Update player's ovr_rating in players table
  const { error: playerUpdateError } = await supabase
    .from('players')
    .update({ ovr_rating: ovrRating })
    .eq('id', playerId);

  if (playerUpdateError) {
    console.error('Failed to update player ovr_rating:', playerUpdateError);
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
