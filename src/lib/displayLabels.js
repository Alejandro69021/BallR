/**
 * Pure Indonesian display mapping utilities for football technical data.
 * Keeps underlying data values unchanged while rendering localized labels.
 */

export const POSITION_LABELS = {
  'Attacking Midfielder (CAM)': 'Gelandang serang (CAM)',
  'Attacking Midfielder': 'Gelandang serang (CAM)',
  'CAM': 'Gelandang serang (CAM)',
  'Right Winger (RW)': 'Sayap kanan (RW)',
  'Right Winger': 'Sayap kanan (RW)',
  'RW': 'Sayap kanan (RW)',
  'Left Winger (LW)': 'Sayap kiri (LW)',
  'Left Winger': 'Sayap kiri (LW)',
  'LW': 'Sayap kiri (LW)',
  'Center Forward (ST)': 'Penyerang tengah (ST)',
  'Center Forward (CF)': 'Penyerang tengah (CF)',
  'Center Forward': 'Penyerang tengah (CF)',
  'CF': 'Penyerang tengah (CF)',
  'Striker (ST)': 'Penyerang tengah (ST)',
  'ST': 'Penyerang tengah (ST)',
  'Center Back (CB)': 'Bek tengah (CB)',
  'Center Back': 'Bek tengah (CB)',
  'CB': 'Bek tengah (CB)',
  'Goalkeeper (GK)': 'Kiper (GK)',
  'Goalkeeper': 'Kiper (GK)',
  'GK': 'Kiper (GK)',
  'Defensive Midfielder (CDM)': 'Gelandang bertahan (CDM)',
  'Defensive Midfielder': 'Gelandang bertahan (CDM)',
  'CDM': 'Gelandang bertahan (CDM)',
  'Central Midfielder (CM)': 'Gelandang tengah (CM)',
  'Central Midfielder': 'Gelandang tengah (CM)',
  'CM': 'Gelandang tengah (CM)',
  'Right Back (RB)': 'Bek kanan (RB)',
  'Right Back': 'Bek kanan (RB)',
  'RB': 'Bek kanan (RB)',
  'Left Back (LB)': 'Bek kiri (LB)',
  'Left Back': 'Bek kiri (LB)',
  'LB': 'Bek kiri (LB)',
  'MID': 'Gelandang (MID)',
  'DEF': 'Bek (DEF)',
  'FWD': 'Penyerang (FWD)'
};

export const PREFERRED_FOOT_LABELS = {
  'Right': 'Kaki kanan',
  'Left': 'Kaki kiri',
  'Both (Ambidextrous)': 'Kedua kaki',
  'Both': 'Kedua kaki',
  'Ambidextrous': 'Kedua kaki',
  'right': 'Kaki kanan',
  'left': 'Kaki kiri',
  'both': 'Kedua kaki'
};

export const ATTRIBUTE_NAME_LABELS = {
  'Pace': 'Kecepatan',
  'Shooting': 'Tembakan',
  'Passing': 'Operan',
  'Dribbling': 'Menggiring',
  'Defending': 'Bertahan',
  'Physical': 'Fisik'
};

/**
 * Format position to Indonesian label while keeping abbreviation in parentheses.
 * Unknown values pass through unchanged.
 * @param {string} pos
 * @returns {string}
 */
export function formatPositionLabel(pos) {
  if (!pos) return 'Belum ada data';
  const trimmed = String(pos).trim();
  return POSITION_LABELS[trimmed] || trimmed;
}

/**
 * Format preferred foot to Indonesian label.
 * Unknown values pass through unchanged.
 * @param {string} foot
 * @returns {string}
 */
export function formatPreferredFoot(foot) {
  if (!foot) return 'Belum ada data';
  const trimmed = String(foot).trim();
  return PREFERRED_FOOT_LABELS[trimmed] || trimmed;
}

/**
 * Format radar attribute key or title to Indonesian.
 * @param {string} attr
 * @returns {string}
 */
export function formatAttributeName(attr) {
  if (!attr) return '';
  const firstWord = String(attr).trim().split(' ')[0];
  return ATTRIBUTE_NAME_LABELS[firstWord] || firstWord;
}
