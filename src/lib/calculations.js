/**
 * Pure calculation and data transformation helpers for BallR (ProspekBola).
 * Free of side-effects, fully unit-testable.
 */

export const DEFAULT_GROUP_AVGS = {
  pace: 75,
  shooting: 70,
  passing: 72,
  dribbling: 74,
  defending: 65,
  physical: 71
};

/**
 * Calculates match rating based on action telemetry counters.
 * Clamped between 6.0 and 9.8.
 * @param {Object} stats
 * @returns {string} Formatted to 1 decimal place (e.g. "8.2")
 */
export function calculateMatchRating(stats = {}) {
  const passesCompleted = Number(stats.passesCompleted) || 0;
  const keyPasses = Number(stats.keyPasses) || 0;
  const tacklesWon = Number(stats.tacklesWon) || 0;
  const goals = Number(stats.goals) || 0;
  const turnovers = Number(stats.turnovers) || 0;

  const rawScore =
    6.5 +
    passesCompleted * 0.05 +
    keyPasses * 0.4 +
    tacklesWon * 0.2 +
    goals * 0.9 -
    turnovers * 0.25;

  return Math.min(9.8, Math.max(6.0, rawScore)).toFixed(1);
}

/**
 * Calculates percentage accuracy (e.g. pass or tackle completion).
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number} Integer percentage (0 - 100)
 */
export function calculateAccuracy(numerator, denominator) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

/**
 * Formats seconds into MM:SS format.
 * @param {number} secs
 * @returns {string} e.g. "14:24"
 */
export function formatSecondsToTime(secs) {
  const totalSecs = Math.max(0, Math.floor(Number(secs) || 0));
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Derives a simplified position group (GK, DEF, MID, FWD) from a position string.
 * @param {string} pos
 * @returns {'GK' | 'DEF' | 'MID' | 'FWD'}
 */
export function derivePositionGroup(pos = '') {
  const p = String(pos);
  if (p.includes('Goalkeeper') || p.includes('GK')) return 'GK';
  if (p.includes('Back') || p.includes('CB') || p.includes('RB') || p.includes('LB') || p.includes('Defender')) return 'DEF';
  if (p.includes('Midfielder') || p.includes('CAM') || p.includes('CDM') || p.includes('CM')) return 'MID';
  if (p.includes('Winger') || p.includes('Forward') || p.includes('ST') || p.includes('RW') || p.includes('LW') || p.includes('Striker')) return 'FWD';
  return 'MID';
}

/**
 * Transforms a raw Supabase player row (with nested assessments, fitness, highlights)
 * into the standardized BallR athlete passport data model.
 *
 * @param {Object} dbPlayer Raw player record from database
 * @param {Object|null} defaultAcademy Academy metadata
 * @param {boolean} isDemoMode When true, permits illustrative mock fallbacks
 * @returns {Object} Standardized athlete passport object
 */
export function transformDbPlayer(dbPlayer = {}, defaultAcademy = null, isDemoMode = false) {
  const assessments = Array.isArray(dbPlayer.player_assessments) ? dbPlayer.player_assessments : [];
  const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  const fitnessList = Array.isArray(dbPlayer.fitness_records) ? dbPlayer.fitness_records : [];
  const sortedFitness = [...fitnessList].sort((a, b) => {
    const dateA = new Date(a.test_date || a.created_at || 0);
    const dateB = new Date(b.test_date || b.created_at || 0);
    return dateB - dateA;
  });
  const latestFitness = sortedFitness[0] || null;
  const previousFitness = sortedFitness[1] || null;

  const rawHighlights = Array.isArray(dbPlayer.video_highlights) ? dbPlayer.video_highlights : [];
  const matchHighlights = rawHighlights.map((v) => ({
    id: v.id,
    title: v.title || 'Highlight',
    match: v.match_opponent ? (v.match_opponent.startsWith('vs') ? v.match_opponent : `vs ${v.match_opponent}`) : 'Pertandingan Resmi',
    minute: v.match_minute ? `${v.match_minute}'` : "00'",
    category: v.event_type || 'Key Highlight',
    video_aspect: '9:16',
    video_url: v.video_url || null,
    thumbnail: v.thumbnail_url || null
  }));

  const position_group = derivePositionGroup(dbPlayer.position || '');

  // Attributes mapping
  const paceVal = latestAssessment?.pace ?? (isDemoMode ? (position_group === 'FWD' ? 84 : 76) : 70);
  const shootVal = latestAssessment?.shooting ?? (isDemoMode ? (position_group === 'FWD' ? 80 : 70) : 70);
  const passVal = latestAssessment?.passing ?? (isDemoMode ? (position_group === 'MID' ? 82 : 72) : 70);
  const dribVal = latestAssessment?.dribbling ?? (isDemoMode ? (position_group === 'MID' || position_group === 'FWD' ? 80 : 70) : 70);
  const defVal = latestAssessment?.defending ?? (isDemoMode ? (position_group === 'DEF' ? 80 : 65) : 65);
  const physVal = latestAssessment?.physical ?? 70;

  const radar_attributes = [
    { attribute: "Pace (Kecepatan)", value: paceVal, group_avg: DEFAULT_GROUP_AVGS.pace },
    { attribute: "Shooting (Finishing)", value: shootVal, group_avg: DEFAULT_GROUP_AVGS.shooting },
    { attribute: "Passing (Distribusi)", value: passVal, group_avg: DEFAULT_GROUP_AVGS.passing },
    { attribute: "Dribbling (Kontrol)", value: dribVal, group_avg: DEFAULT_GROUP_AVGS.dribbling },
    { attribute: "Defending (Pressing)", value: defVal, group_avg: DEFAULT_GROUP_AVGS.defending },
    { attribute: "Physical (Daya Tahan)", value: physVal, group_avg: DEFAULT_GROUP_AVGS.physical }
  ];

  // Personal Info
  const fullName = dbPlayer.full_name || 'Atlet Muda';
  const nickname = dbPlayer.nickname || fullName.split(' ')[0] || 'Atlet';
  const publicId = dbPlayer.public_id || dbPlayer.id || 'PLAYER-UNKNOWN';

  const defaultAcademyObj = defaultAcademy || (isDemoMode ? {
    name: "Mataram Putra Football Academy",
    city: "Yogyakarta",
    logo_url: ""
  } : {
    name: dbPlayer.academy_name || "Akademi Sepakbola",
    city: dbPlayer.academy_city || "Indonesia",
    logo_url: ""
  });

  const photoUrl = dbPlayer.photo_url || "";

  // Fitness
  const fitnessBenchmarks = {
    test_date: latestFitness?.test_date || null,
    vertical_jump_cm: latestFitness?.vertical_jump_cm ?? null,
    sprint_20m_sec: latestFitness?.sprint_20m_sec ?? null,
    shuttle_run_sec: latestFitness?.shuttle_run_sec ?? null,
    yoyo_level: latestFitness?.yoyo_score ?? null,
    prev_jump_cm: previousFitness?.vertical_jump_cm ?? null,
    prev_sprint_sec: previousFitness?.sprint_20m_sec ?? null,
    prev_shuttle_sec: previousFitness?.shuttle_run_sec ?? null
  };

  // Evaluation
  const aiCoachEvaluation = {
    period: latestAssessment?.period_month || null,
    coach_name: latestAssessment?.coach_name || null,
    narrative: latestAssessment?.ai_narrative || latestAssessment?.coach_raw_notes || null,
    strengths: Array.isArray(latestAssessment?.strengths) && latestAssessment.strengths.length > 0
      ? latestAssessment.strengths
      : [],
    growth_areas: Array.isArray(latestAssessment?.growth_areas) && latestAssessment.growth_areas.length > 0
      ? latestAssessment.growth_areas
      : [],
    recommended_drill: latestAssessment?.recommended_drill && typeof latestAssessment.recommended_drill === 'object'
      ? latestAssessment.recommended_drill
      : null
  };

  // Verified moments (only real highlights, no stock media)
  const verifiedMoments = matchHighlights;

  return {
    player_id: dbPlayer.id || publicId,
    public_id: publicId,
    db_assessment_id: latestAssessment?.id || null,
    personal_info: {
      full_name: fullName,
      nickname,
      jersey_number: dbPlayer.jersey_number ?? 0,
      position: dbPlayer.position || 'Pemain',
      position_group,
      birth_date: dbPlayer.birth_date || null,
      age: dbPlayer.age || null,
      preferred_foot: dbPlayer.preferred_foot || null,
      height_cm: dbPlayer.height_cm || null,
      weight_kg: dbPlayer.weight_kg || null,
      academy: defaultAcademyObj,
      photo_url: photoUrl,
      evaluation_status: latestAssessment?.is_published ? 'ready' : (assessments.length > 0 ? 'ready' : 'pending')
    },
    radar_attributes,
    fitness_benchmarks: fitnessBenchmarks,
    ai_coach_evaluation: aiCoachEvaluation,
    verified_moments: verifiedMoments
  };
}
