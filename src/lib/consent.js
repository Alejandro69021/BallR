/**
 * Pure consent governance helpers (UU PDP No. 27/2022 Pasal 25).
 */

/**
 * Evaluates whether a player's progress card can be shared/exported.
 *
 * Rules:
 * - Only the LATEST row (by granted_at) is evaluated. Older rows never grant anything.
 * - If the latest row has revoked_at (is not null/undefined/falsy), sharing is denied.
 * - purposes.public_profile === true is strictly required on the latest row.
 * - share_with_scouts, media, and training_analysis alone do NOT enable sharing.
 * - Malformed, non-object, empty rows or fetch errors fail closed (return false).
 *
 * @param {Array<Object>|null|undefined} consents
 * @returns {boolean}
 */
export function canShareProgressCard(consents) {
  if (!Array.isArray(consents) || consents.length === 0) {
    return false;
  }

  // Sort descending by granted_at to guarantee latest row is first
  const sorted = [...consents].sort((a, b) => {
    const timeA = a?.granted_at ? new Date(a.granted_at).getTime() : 0;
    const timeB = b?.granted_at ? new Date(b.granted_at).getTime() : 0;
    return timeB - timeA;
  });

  const latest = sorted[0];
  if (!latest || typeof latest !== 'object') {
    return false;
  }

  // If latest consent has been revoked, sharing is denied
  if (latest.revoked_at) {
    return false;
  }

  // Purposes must be a valid non-array object
  if (!latest.purposes || typeof latest.purposes !== 'object' || Array.isArray(latest.purposes)) {
    return false;
  }

  // Must explicitly have public_profile === true
  return latest.purposes.public_profile === true;
}

/**
 * Evaluates the specific reason why a player's progress card cannot be shared.
 *
 * Returns:
 * - 'none': no consents recorded or empty list
 * - 'revoked': latest consent was revoked
 * - 'no_public_profile': latest consent does not include public_profile: true
 * - null: sharing is allowed (canShareProgressCard is true)
 *
 * @param {Array<Object>|null|undefined} consents
 * @returns {'none' | 'revoked' | 'no_public_profile' | null}
 */
export function getShareBlockReason(consents) {
  if (!Array.isArray(consents) || consents.length === 0) {
    return 'none';
  }

  const sorted = [...consents].sort((a, b) => {
    const timeA = a?.granted_at ? new Date(a.granted_at).getTime() : 0;
    const timeB = b?.granted_at ? new Date(b.granted_at).getTime() : 0;
    return timeB - timeA;
  });

  const latest = sorted[0];
  if (!latest || typeof latest !== 'object') {
    return 'none';
  }

  if (latest.revoked_at) {
    return 'revoked';
  }

  if (!latest.purposes || typeof latest.purposes !== 'object' || Array.isArray(latest.purposes) || latest.purposes.public_profile !== true) {
    return 'no_public_profile';
  }

  return null;
}

/**
 * Builds the export filename from the exact displayed name (e.g. initials when private),
 * ensuring full names are never leaked in filenames for private players.
 *
 * @param {string} displayedName
 * @returns {string}
 */
export function buildCardDownloadFilename(displayedName) {
  const clean = (displayedName || 'atlet')
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();

  return `kartu-perkembangan-${clean || 'atlet'}.png`;
}
