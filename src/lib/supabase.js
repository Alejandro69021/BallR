import { createClient } from '@supabase/supabase-js';

// Clean Supabase URL (strip /rest/v1/ if present to match @supabase/supabase-js root format)
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  "https://llawmrpsbwpfbpzjjbtz.supabase.co/rest/v1/";

export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  "sb_publishable_xTE4UbUTmIwPwwq72uAyQg_j9BOSnB8";

// 1. Initialize official Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Group averages for U-13 benchmark comparison
const DEFAULT_GROUP_AVGS = {
  pace: 75,
  shooting: 70,
  passing: 72,
  dribbling: 74,
  defending: 65,
  physical: 71
};

// Transform DB player row with linked assessments, fitness, and video highlights
export function transformDbPlayer(dbPlayer, defaultAcademy) {
  // Sort assessments by updated_at or id descending
  const assessments = dbPlayer.player_assessments || [];
  const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  // Sort fitness records by test_date descending
  const fitnessList = dbPlayer.fitness_records || [];
  const sortedFitness = [...fitnessList].sort((a, b) => new Date(b.test_date || b.created_at) - new Date(a.test_date || a.created_at));
  const latestFitness = sortedFitness[0] || null;
  const previousFitness = sortedFitness[1] || null;

  // Map video highlights
  const rawHighlights = dbPlayer.video_highlights || [];
  const matchHighlights = rawHighlights.map((v) => ({
    id: v.id,
    title: v.title,
    match: v.match_opponent ? (v.match_opponent.startsWith('vs') ? v.match_opponent : `vs ${v.match_opponent}`) : 'vs Sleman United U-13',
    minute: v.match_minute || "24'",
    category: v.event_type || 'Key Highlight',
    video_aspect: '9:16',
    video_url: v.video_url,
    thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop'
  }));

  // Position group helper
  let position_group = 'MID';
  const pos = dbPlayer.position || '';
  if (pos.includes('Goalkeeper') || pos.includes('GK')) position_group = 'GK';
  else if (pos.includes('Back') || pos.includes('CB') || pos.includes('RB') || pos.includes('LB')) position_group = 'DEF';
  else if (pos.includes('Midfielder') || pos.includes('CAM') || pos.includes('CDM') || pos.includes('CM')) position_group = 'MID';
  else if (pos.includes('Winger') || pos.includes('Forward') || pos.includes('ST') || pos.includes('RW') || pos.includes('LW')) position_group = 'FWD';

  // Map attributes from assessment or sensible baseline from ovr
  const ovr = dbPlayer.ovr_rating || 75;
  const paceVal = latestAssessment?.pace ?? (position_group === 'FWD' ? 84 : 76);
  const shootVal = latestAssessment?.shooting ?? (position_group === 'FWD' ? 80 : 70);
  const passVal = latestAssessment?.passing ?? (position_group === 'MID' ? 82 : 72);
  const dribVal = latestAssessment?.dribbling ?? (position_group === 'MID' || position_group === 'FWD' ? 80 : 70);
  const defVal = latestAssessment?.defending ?? (position_group === 'DEF' ? 80 : 65);
  const physVal = latestAssessment?.physical ?? 74;

  const radar_attributes = [
    { attribute: "Pace (Kecepatan)", value: paceVal, group_avg: DEFAULT_GROUP_AVGS.pace },
    { attribute: "Shooting (Finishing)", value: shootVal, group_avg: DEFAULT_GROUP_AVGS.shooting },
    { attribute: "Passing (Distribusi)", value: passVal, group_avg: DEFAULT_GROUP_AVGS.passing },
    { attribute: "Dribbling (Kontrol)", value: dribVal, group_avg: DEFAULT_GROUP_AVGS.dribbling },
    { attribute: "Defending (Pressing)", value: defVal, group_avg: DEFAULT_GROUP_AVGS.defending },
    { attribute: "Physical (Daya Tahan)", value: physVal, group_avg: DEFAULT_GROUP_AVGS.physical }
  ];

  return {
    player_id: dbPlayer.id,
    db_assessment_id: latestAssessment?.id || null,
    personal_info: {
      full_name: dbPlayer.full_name,
      nickname: dbPlayer.nickname || dbPlayer.full_name.split(' ')[0],
      jersey_number: dbPlayer.jersey_number,
      position: dbPlayer.position,
      position_group: position_group,
      birth_date: dbPlayer.birth_date || '2013-05-14',
      age: 13,
      preferred_foot: dbPlayer.preferred_foot || 'Right',
      height_cm: dbPlayer.height_cm || 158,
      weight_kg: dbPlayer.weight_kg || 46,
      academy: defaultAcademy || {
        name: "Mataram Putra Football Academy",
        city: "Yogyakarta",
        logo_url: "https://placehold.co/80x80/1e293b/ffffff?text=MPFA"
      },
      photo_url: dbPlayer.photo_url || "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600&auto=format&fit=crop",
      overall_rating: dbPlayer.ovr_rating || ovr,
      evaluation_status: latestAssessment?.is_published ? 'ready' : (assessments.length > 0 ? 'ready' : 'pending')
    },
    radar_attributes,
    fitness_benchmarks: {
      test_date: latestFitness?.test_date || '2026-10-24',
      vertical_jump_cm: latestFitness?.vertical_jump_cm || 44.5,
      sprint_20m_sec: latestFitness?.sprint_20m_sec || 3.42,
      shuttle_run_sec: latestFitness?.shuttle_run_sec || 11.20,
      yoyo_level: latestFitness?.yoyo_score || 'Level 15.4',
      prev_jump_cm: previousFitness?.vertical_jump_cm || 42.0,
      prev_sprint_sec: previousFitness?.sprint_20m_sec || 3.50,
      prev_shuttle_sec: previousFitness?.shuttle_run_sec || 11.45
    },
    ai_coach_evaluation: {
      period: latestAssessment?.period_month || "Oktober 2026",
      coach_name: latestAssessment?.coach_name || "Coach Hendro (Lisensi B AFC)",
      narrative: latestAssessment?.ai_narrative || latestAssessment?.coach_raw_notes || "Pemain menunjukkan potensi akselerasi dan penguasaan teknik dasar yang sangat menjanjikan untuk level U-13.",
      strengths: Array.isArray(latestAssessment?.strengths) && latestAssessment.strengths.length > 0
        ? latestAssessment.strengths
        : ["Disiplin posisi lapangan", "Sentuhan pertama aktif", "Etos kerja tinggi"],
      growth_areas: Array.isArray(latestAssessment?.growth_areas) && latestAssessment.growth_areas.length > 0
        ? latestAssessment.growth_areas
        : ["Kekuatan fisik duel perebutan bola", "Komunikasi transisi bertahan"],
      recommended_drill: latestAssessment?.recommended_drill && typeof latestAssessment.recommended_drill === 'object'
        ? latestAssessment.recommended_drill
        : {
            title: "Wall-Pass & Quick Scanning Drill",
            duration: "15 Menit / Hari",
            category: "Ball Mastery"
          }
    },
    verified_moments: matchHighlights.length > 0 ? matchHighlights : [
      {
        id: "clip-01",
        title: "Assist Terobosan Melengkung",
        match: "vs Sleman United U-13",
        minute: "24'",
        category: "Vision / Key Pass",
        video_aspect: "9:16",
        video_url: "https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-41586-large.mp4",
        thumbnail: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop"
      },
      {
        id: "clip-02",
        title: "Penyelesaian Akhir Kaki Kiri",
        match: "vs HW Jogja U-13",
        minute: "52'",
        category: "Goal / Finishing",
        video_aspect: "9:16",
        video_url: "https://assets.mixkit.co/videos/preview/mixkit-player-scoring-a-goal-in-soccer-41584-large.mp4",
        thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&auto=format&fit=crop"
      }
    ]
  };
}

// 2. Fetch live data on initial load
export async function fetchLiveRosterFromSupabase() {
  // Fetch academy info
  let academy = null;
  const { data: academyData } = await supabase.from('academies').select('*').limit(1);
  if (academyData && academyData.length > 0) {
    academy = {
      name: academyData[0].name,
      city: academyData[0].city,
      logo_url: academyData[0].logo_url
    };
  }

  // Fetch players with linked assessments, fitness, highlights
  const { data: playersData, error: playersError } = await supabase
    .from('players')
    .select('*, player_assessments(*), fitness_records(*), video_highlights(*)')
    .order('jersey_number', { ascending: true });

  if (playersError) {
    throw playersError;
  }

  return playersData.map((p) => transformDbPlayer(p, academy));
}

// 3. Live Write Mutation: Upsert assessment & update player's ovr_rating
export async function saveAssessmentToSupabase(playerId, assessmentData, ovrRating, existingAssessmentId) {
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
    const item = assessmentData.radar_attributes?.find((a) => a.attribute.toLowerCase().includes(key.toLowerCase()));
    return item ? item.value : 75;
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

// 4. Live Write Mutation: Insert Edge-AI camera recorded fitness test
export async function insertFitnessRecordToSupabase(playerId, fitnessData) {
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

