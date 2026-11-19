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
 * @param {Object} player Player profile object
 * @param {Object} assessment Assessment object or evaluation
 * @param {Object} fitness Latest fitness metrics
 * @param {Object} academy Academy metadata
 * @returns {Object} Structured passport record ready for canonicalization
 */
export function buildPassportSnapshotPayload(player = {}, assessment = {}, fitness = {}, academy = {}) {
  const pId = player.public_id || player.player_id || player.id || 'PLAYER-UNKNOWN';

  // Extract radar attributes (normalize keys)
  const attrs = assessment.radar_attributes || [];
  const getAttr = (key, fallback = 75) => {
    const found = attrs.find((a) => a.attribute && a.attribute.toLowerCase().includes(key));
    if (found) return Number(found.value) || fallback;
    return Number(assessment[key]) || fallback;
  };

  return {
    payload_version: 'v1.0',
    public_id: String(pId),
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
 *
 * @param {Object|string} payload Stored canonical JSON or parsed payload object
 * @param {string} expectedHash Stored snapshot hash
 * @returns {Promise<boolean>} True if valid and untampered
 */
export async function verifyPassportHash(payload, expectedHash) {
  if (!expectedHash || typeof expectedHash !== 'string') return false;
  const canonicalString = typeof payload === 'string' ? canonicalizeJson(JSON.parse(payload)) : canonicalizeJson(payload);
  const recomputedHash = await computeSha256(canonicalString);
  return recomputedHash.toLowerCase() === expectedHash.toLowerCase();
}
