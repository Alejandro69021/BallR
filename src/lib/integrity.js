/**
-- ==============================================================================
-- Integrity & Canonicalization Engine
-- Cryptographic SHA-256 Athlete Passport Verification for BallR (ProspekBola)
-- ==============================================================================
*/

/**
 * Deterministically sorts object keys and normalizes primitive values
 * so that two identical structural objects always serialize to the exact same byte string.
 *
 * Rules:
 * 1. Object keys are sorted alphabetically (locale-independent code-point order).
 * 2. Arrays preserve sequence; elements are recursively canonicalized.
 * 3. Numbers are formatted predictably: finite numbers avoid trailing floating point artifacts.
 * 4. Null / undefined / dates are consistently represented.
 *
 * @param {*} value Any JavaScript primitive or object
 * @returns {string} Canonical JSON string
 */
export function canonicalizeJson(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'null';
    // Normalize integers and floating point to max 4 decimal digits without trailing zeros
    if (Number.isInteger(value)) return value.toString();
    return Number(value.toFixed(4)).toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((elem) => canonicalizeJson(elem));
    return `[${items.join(',')}]`;
  }

  if (typeof value === 'object') {
    const sortedKeys = Object.keys(value).sort();
    const pairs = sortedKeys
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalizeJson(value[k])}`);
    return `{${pairs.join(',')}}`;
  }

  return JSON.stringify(String(value));
}

/**
 * Computes SHA-256 hash in lowercase hex string format.
 * Works seamlessly in Browser (window.crypto.subtle) and Node / Vitest environments.
 *
 * @param {string} text Plaintext input to hash
 * @returns {Promise<string>} 64-character lowercase hex string
 */
export async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const subtleCrypto = globalThis.crypto?.subtle;
  if (subtleCrypto && typeof subtleCrypto.digest === 'function') {
    const hashBuffer = await subtleCrypto.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Web Crypto API (crypto.subtle) tidak didukung di peramban ini.');
}

/**
 * Extracts and structures the official verifiable passport snapshot payload.
 * Volatile UI timestamps or transient state are excluded to ensure deterministic verification.
 *
 * Payload versions:
 * - v2 (current): omits ovr_rating; missing values are set to null (never invented numbers).
 * - v1 (legacy): preserves legacy snapshot format with ovr_rating and fallback defaults for verification compatibility.
 *
 * @param {Object} player Player profile object
 * @param {Object} assessment Assessment object or evaluation
 * @param {Object} fitness Latest fitness metrics
 * @param {Object} academy Academy metadata
 * @param {string} [version='v2'] Payload version ('v2' or 'v1' / 'v1.0')
 * @returns {Object} Structured passport record ready for canonicalization
 */
export function buildPassportSnapshotPayload(player = {}, assessment = {}, fitness = {}, academy = {}, version = 'v2') {
  const pId = player.public_id || player.player_id || player.id || null;

  if (version === 'v1' || version === 'v1.0') {
    // Legacy v1 snapshot compatibility path
    // v1 payloads included ovr_rating and fallback default numbers
    const attrs = assessment.radar_attributes || [];
    const getAttr = (key, fallback = 75) => {
      const found = attrs.find((a) => a.attribute && a.attribute.toLowerCase().includes(key));
      if (found) return Number(found.value) || fallback;
      return Number(assessment[key]) || fallback;
    };

    return {
      payload_version: 'v1.0',
      public_id: String(pId || 'PLAYER-UNKNOWN'),
      academy: {
        name: String(academy?.name || player.personal_info?.academy?.name || 'Akademi Sepakbola'),
        city: String(academy?.city || player.personal_info?.academy?.city || 'Indonesia')
      },
      period_month: String(assessment.period_month || assessment.ai_coach_evaluation?.period || 'Oktober 2026'),
      coach_name: String(assessment.coach_name || assessment.ai_coach_evaluation?.coach_name || 'Tim Pelatih'),
      ovr_rating: Number(player.ovr_rating || player.personal_info?.overall_rating || 75),
      attributes: {
        pace: getAttr('pace', 75),
        shooting: getAttr('shooting', 70),
        passing: getAttr('passing', 72),
        dribbling: getAttr('dribbling', 74),
        defending: getAttr('defending', 65),
        physical: getAttr('physical', 71)
      },
      fitness: {
        vertical_jump_cm: Number(fitness?.vertical_jump_cm ?? 0),
        sprint_20m_sec: Number(fitness?.sprint_20m_sec ?? 0),
        shuttle_run_sec: Number(fitness?.shuttle_run_sec ?? 0),
        yoyo_score: String(fitness?.yoyo_level || fitness?.yoyo_score || '-')
      }
    };
  }

  // Version 2 (Current standard): NO ovr_rating, NO invented fallback values
  const attrs = assessment.radar_attributes || [];
  const getAttrV2 = (key) => {
    const found = attrs.find((a) => a.attribute && a.attribute.toLowerCase().includes(key));
    if (found && found.value !== undefined && found.value !== null && found.value !== '') {
      const numVal = Number(found.value);
      return Number.isFinite(numVal) ? numVal : null;
    }
    if (assessment[key] !== undefined && assessment[key] !== null && assessment[key] !== '') {
      const numVal = Number(assessment[key]);
      return Number.isFinite(numVal) ? numVal : null;
    }
    return null;
  };

  const academyName = academy?.name || player.personal_info?.academy?.name || null;
  const academyCity = academy?.city || player.personal_info?.academy?.city || null;
  const academyObj = (academyName || academyCity) ? {
    name: academyName ? String(academyName) : null,
    city: academyCity ? String(academyCity) : null
  } : null;

  const periodMonth = assessment.period_month || assessment.ai_coach_evaluation?.period || null;
  const coachName = assessment.coach_name || assessment.ai_coach_evaluation?.coach_name || null;

  const getFitnessNum = (val) => {
    if (val !== undefined && val !== null && val !== '') {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const yoyo = fitness?.yoyo_level || fitness?.yoyo_score || null;

  return {
    payload_version: 'v2',
    public_id: pId ? String(pId) : null,
    academy: academyObj,
    period_month: periodMonth ? String(periodMonth) : null,
    coach_name: coachName ? String(coachName) : null,
    attributes: {
      pace: getAttrV2('pace'),
      shooting: getAttrV2('shooting'),
      passing: getAttrV2('passing'),
      dribbling: getAttrV2('dribbling'),
      defending: getAttrV2('defending'),
      physical: getAttrV2('physical')
    },
    fitness: {
      vertical_jump_cm: getFitnessNum(fitness?.vertical_jump_cm),
      sprint_20m_sec: getFitnessNum(fitness?.sprint_20m_sec),
      shuttle_run_sec: getFitnessNum(fitness?.shuttle_run_sec),
      yoyo_score: yoyo ? String(yoyo) : null
    }
  };
}

/**
 * Computes deterministic cryptographic hash for a passport snapshot.
 *
 * @param {Object} payload Structured passport record
 * @returns {Promise<{ hash: string, canonicalString: string }>}
 */
export async function generatePassportHash(payload) {
  const canonicalString = canonicalizeJson(payload);
  const hash = await computeSha256(canonicalString);
  return { hash, canonicalString };
}

/**
 * Re-computes and verifies if a given canonical payload matches the expected SHA-256 hash.
 * Supports legacy v1 and v1.0 payloads for backward-compatibility.
 * Rejects unknown payload versions with a clear error.
 *
 * @param {Object|string} payload Stored canonical JSON or parsed payload object
 * @param {string} expectedHash Stored snapshot hash
 * @returns {Promise<boolean>} True if valid and untampered
 */
export async function verifyPassportHash(payload, expectedHash) {
  if (!expectedHash || typeof expectedHash !== 'string') return false;

  let parsed;
  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload);
    } catch {
      return false;
    }
  } else {
    parsed = payload;
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Payload snapshot tidak valid: payload bukan objek');
  }

  const version = parsed.payload_version;
  if (!version || (version !== 'v2' && version !== 'v1' && version !== 'v1.0')) {
    throw new Error(`Versi payload snapshot tidak dikenali: ${version || 'tidak ada versi'}`);
  }

  // Legacy compatibility note:
  // - v1/v1.0: contains ovr_rating and fallback defaults
  // - v2: omits ovr_rating and sets missing values to null
  const canonicalString = canonicalizeJson(parsed);
  const recomputedHash = await computeSha256(canonicalString);
  return recomputedHash.toLowerCase() === expectedHash.toLowerCase();
}
