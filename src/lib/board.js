/**
 * ==============================================================================
 * BallR Pure Tactical Board Logic
 * Rule: Pure logic only, no React, no side effects, fully unit-tested.
 * Rule: "Template awal, bukan rekomendasi" - Never invent a "correct" position.
 * ==============================================================================
 */

export const BOARD_DISCLAIMER = 'Skema ilustrasi dari pelatih, bukan hasil analisis data.';
export const TEMPLATE_DISCLAIMER = 'Template awal, bukan rekomendasi';

export const ARROW_KINDS = ['pass', 'run', 'press', 'cover'];

export const ARROW_KIND_LABELS = {
  pass: 'Umpan (pass)',
  run: 'Pergerakan (run)',
  press: 'Tekanan (press)',
  cover: 'Penjagaan ruang (cover)'
};

/**
 * Normalised tactical formation templates (proportional coordinates on pitch).
 * Coordinates are { nx, ny } in range 0..1:
 * nx: distance from own goal line (0 = goal line, 0.5 = halfway line, 1.0 = opponent goal line)
 * ny: distance from left touchline (0 = left, 0.5 = center, 1.0 = right)
 */
export const RAW_FORMATION_TEMPLATES = {
  '11v11': {
    '4-3-3': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.85 },
        { role: 'CB', label: '4', nx: 0.15, ny: 0.62 },
        { role: 'CB', label: '5', nx: 0.15, ny: 0.38 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.15 },
        { role: 'DM', label: '6', nx: 0.28, ny: 0.5 },
        { role: 'CM', label: '8', nx: 0.38, ny: 0.65 },
        { role: 'CM', label: '10', nx: 0.38, ny: 0.35 },
        { role: 'RW', label: '7', nx: 0.55, ny: 0.85 },
        { role: 'ST', label: '9', nx: 0.58, ny: 0.5 },
        { role: 'LW', label: '11', nx: 0.55, ny: 0.15 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.85 },
        { role: 'CB', label: '5', nx: 0.85, ny: 0.62 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.38 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.15 },
        { role: 'LM', label: '11', nx: 0.7, ny: 0.85 },
        { role: 'CM', label: '8', nx: 0.68, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.38 },
        { role: 'RM', label: '7', nx: 0.7, ny: 0.15 },
        { role: 'ST', label: '10', nx: 0.55, ny: 0.6 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.4 }
      ]
    },
    '4-4-2': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.85 },
        { role: 'CB', label: '4', nx: 0.15, ny: 0.62 },
        { role: 'CB', label: '5', nx: 0.15, ny: 0.38 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.15 },
        { role: 'RM', label: '7', nx: 0.36, ny: 0.85 },
        { role: 'CM', label: '8', nx: 0.34, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.34, ny: 0.38 },
        { role: 'LM', label: '11', nx: 0.36, ny: 0.15 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.4 },
        { role: 'ST', label: '10', nx: 0.55, ny: 0.6 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.85 },
        { role: 'CB', label: '5', nx: 0.85, ny: 0.62 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.38 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.15 },
        { role: 'LM', label: '11', nx: 0.7, ny: 0.85 },
        { role: 'CM', label: '8', nx: 0.68, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.38 },
        { role: 'RM', label: '7', nx: 0.7, ny: 0.15 },
        { role: 'ST', label: '10', nx: 0.55, ny: 0.6 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.4 }
      ]
    },
    '3-5-2': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RCB', label: '4', nx: 0.16, ny: 0.72 },
        { role: 'CB', label: '5', nx: 0.14, ny: 0.5 },
        { role: 'LCB', label: '3', nx: 0.16, ny: 0.28 },
        { role: 'RWB', label: '2', nx: 0.35, ny: 0.9 },
        { role: 'DM', label: '6', nx: 0.28, ny: 0.5 },
        { role: 'CM', label: '8', nx: 0.4, ny: 0.65 },
        { role: 'CM', label: '10', nx: 0.4, ny: 0.35 },
        { role: 'LWB', label: '7', nx: 0.35, ny: 0.1 },
        { role: 'ST', label: '9', nx: 0.56, ny: 0.4 },
        { role: 'ST', label: '11', nx: 0.56, ny: 0.6 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.85 },
        { role: 'CB', label: '5', nx: 0.85, ny: 0.62 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.38 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.15 },
        { role: 'LM', label: '11', nx: 0.7, ny: 0.85 },
        { role: 'CM', label: '8', nx: 0.68, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.38 },
        { role: 'RM', label: '7', nx: 0.7, ny: 0.15 },
        { role: 'ST', label: '10', nx: 0.55, ny: 0.6 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.4 }
      ]
    },
    '3-2-4-1': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RCB', label: '2', nx: 0.16, ny: 0.75 },
        { role: 'CB', label: '3', nx: 0.14, ny: 0.5 },
        { role: 'LCB', label: '4', nx: 0.16, ny: 0.25 },
        { role: 'DM', label: '5', nx: 0.28, ny: 0.62 },
        { role: 'DM', label: '6', nx: 0.28, ny: 0.38 },
        { role: 'RM', label: '7', nx: 0.44, ny: 0.88 },
        { role: 'AM', label: '8', nx: 0.44, ny: 0.62 },
        { role: 'AM', label: '10', nx: 0.44, ny: 0.38 },
        { role: 'LM', label: '11', nx: 0.44, ny: 0.12 },
        { role: 'ST', label: '9', nx: 0.58, ny: 0.5 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.85 },
        { role: 'CB', label: '5', nx: 0.85, ny: 0.62 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.38 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.15 },
        { role: 'LM', label: '11', nx: 0.7, ny: 0.85 },
        { role: 'CM', label: '8', nx: 0.68, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.38 },
        { role: 'RM', label: '7', nx: 0.7, ny: 0.15 },
        { role: 'ST', label: '10', nx: 0.55, ny: 0.6 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.4 }
      ]
    }
  },
  '9v9': {
    '3-3-2': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.15, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.2 },
        { role: 'RM', label: '7', nx: 0.36, ny: 0.8 },
        { role: 'CM', label: '6', nx: 0.34, ny: 0.5 },
        { role: 'LM', label: '11', nx: 0.36, ny: 0.2 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.4 },
        { role: 'ST', label: '10', nx: 0.54, ny: 0.6 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.2 },
        { role: 'LM', label: '11', nx: 0.66, ny: 0.8 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.5 },
        { role: 'RM', label: '7', nx: 0.66, ny: 0.2 },
        { role: 'ST', label: '10', nx: 0.54, ny: 0.6 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.4 }
      ]
    },
    '3-2-3': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.15, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.2 },
        { role: 'CM', label: '6', nx: 0.34, ny: 0.62 },
        { role: 'CM', label: '8', nx: 0.34, ny: 0.38 },
        { role: 'RW', label: '7', nx: 0.52, ny: 0.8 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.5 },
        { role: 'LW', label: '11', nx: 0.52, ny: 0.2 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.2 },
        { role: 'CM', label: '8', nx: 0.68, ny: 0.62 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.38 },
        { role: 'LW', label: '11', nx: 0.52, ny: 0.8 },
        { role: 'ST', label: '9', nx: 0.55, ny: 0.5 },
        { role: 'RW', label: '7', nx: 0.52, ny: 0.2 }
      ]
    }
  },
  '7v7': {
    '2-3-1': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.75 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.25 },
        { role: 'RM', label: '7', nx: 0.36, ny: 0.8 },
        { role: 'CM', label: '6', nx: 0.34, ny: 0.5 },
        { role: 'LM', label: '11', nx: 0.36, ny: 0.2 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.5 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.75 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.25 },
        { role: 'LM', label: '11', nx: 0.66, ny: 0.8 },
        { role: 'CM', label: '6', nx: 0.68, ny: 0.5 },
        { role: 'RM', label: '7', nx: 0.66, ny: 0.2 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.5 }
      ]
    },
    '3-2-1': {
      own: [
        { role: 'GK', label: '1', nx: 0.05, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.18, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.15, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.18, ny: 0.2 },
        { role: 'CM', label: '6', nx: 0.36, ny: 0.65 },
        { role: 'CM', label: '8', nx: 0.36, ny: 0.35 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.5 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.95, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.82, ny: 0.8 },
        { role: 'CB', label: '4', nx: 0.85, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.82, ny: 0.2 },
        { role: 'CM', label: '8', nx: 0.66, ny: 0.65 },
        { role: 'CM', label: '6', nx: 0.66, ny: 0.35 },
        { role: 'ST', label: '9', nx: 0.54, ny: 0.5 }
      ]
    }
  },
  '5v5': {
    '2-2': {
      own: [
        { role: 'GK', label: '1', nx: 0.06, ny: 0.5 },
        { role: 'RB', label: '2', nx: 0.22, ny: 0.75 },
        { role: 'LB', label: '3', nx: 0.22, ny: 0.25 },
        { role: 'RF', label: '7', nx: 0.48, ny: 0.72 },
        { role: 'LF', label: '9', nx: 0.48, ny: 0.28 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.94, ny: 0.5 },
        { role: 'LB', label: '3', nx: 0.78, ny: 0.75 },
        { role: 'RB', label: '2', nx: 0.78, ny: 0.25 },
        { role: 'LF', label: '9', nx: 0.52, ny: 0.72 },
        { role: 'RF', label: '7', nx: 0.52, ny: 0.28 }
      ]
    },
    '1-2-1': {
      own: [
        { role: 'GK', label: '1', nx: 0.06, ny: 0.5 },
        { role: 'CB', label: '3', nx: 0.2, ny: 0.5 },
        { role: 'RM', label: '2', nx: 0.35, ny: 0.8 },
        { role: 'LM', label: '7', nx: 0.35, ny: 0.2 },
        { role: 'ST', label: '9', nx: 0.52, ny: 0.5 }
      ],
      opponent: [
        { role: 'GK', label: '1', nx: 0.94, ny: 0.5 },
        { role: 'CB', label: '3', nx: 0.8, ny: 0.5 },
        { role: 'LM', label: '7', nx: 0.65, ny: 0.8 },
        { role: 'RM', label: '2', nx: 0.65, ny: 0.2 },
        { role: 'ST', label: '9', nx: 0.52, ny: 0.5 }
      ]
    }
  }
};

/**
 * Returns starting layouts for a given match format scaled to pitch size in metres.
 * Labelled: "Template awal, bukan rekomendasi"
 */
export function formationTemplates(format = '11v11', pitch = { pitch_length_m: 90, pitch_width_m: 60 }) {
  const len = Number(pitch?.pitch_length_m || 90);
  const wid = Number(pitch?.pitch_width_m || 60);
  const formatKey = RAW_FORMATION_TEMPLATES[format] ? format : '11v11';
  const templates = RAW_FORMATION_TEMPLATES[formatKey];

  const result = {};

  for (const [name, rawFormation] of Object.entries(templates)) {
    const ownPlayers = (rawFormation.own || []).map((p, idx) => ({
      id: `own-${p.label || idx + 1}`,
      team: 'own',
      x: Number((p.nx * len).toFixed(1)),
      y: Number((p.ny * wid).toFixed(1)),
      label: String(p.label || idx + 1)
    }));

    const opponentPlayers = (rawFormation.opponent || []).map((p, idx) => ({
      id: `opp-${p.label || idx + 1}`,
      team: 'opponent',
      x: Number((p.nx * len).toFixed(1)),
      y: Number((p.ny * wid).toFixed(1)),
      label: String(p.label || idx + 1)
    }));

    result[name] = {
      name,
      format: formatKey,
      label: TEMPLATE_DISCLAIMER,
      pitch_length_m: len,
      pitch_width_m: wid,
      players: [...ownPlayers, ...opponentPlayers],
      ball: {
        x: Number((0.08 * len).toFixed(1)),
        y: Number((0.5 * wid).toFixed(1))
      },
      arrows: []
    };
  }

  return result;
}

/**
 * Clamps coordinates within pitch boundaries (0..length, 0..width).
 */
export function clampToPitch(point, pitch = { pitch_length_m: 90, pitch_width_m: 60 }) {
  if (!point || typeof point !== 'object') {
    return { x: 0, y: 0 };
  }
  const maxLen = Number(pitch?.pitch_length_m ?? 90);
  const maxWid = Number(pitch?.pitch_width_m ?? 60);

  const rawX = Number(point.x ?? 0);
  const rawY = Number(point.y ?? 0);

  const safeX = isNaN(rawX) ? 0 : rawX;
  const safeY = isNaN(rawY) ? 0 : rawY;

  const clampedX = Math.max(0, Math.min(maxLen, safeX));
  const clampedY = Math.max(0, Math.min(maxWid, safeY));

  return {
    x: Number(clampedX.toFixed(2)),
    y: Number(clampedY.toFixed(2))
  };
}

/**
 * Moves a point by dx and dy, clamped to pitch.
 */
export function moveBy(point, dx, dy, pitch = { pitch_length_m: 90, pitch_width_m: 60 }) {
  const current = clampToPitch(point, pitch);
  return clampToPitch({ x: current.x + Number(dx || 0), y: current.y + Number(dy || 0) }, pitch);
}

/**
 * Easing function for smooth tactical board playback.
 */
export function calculateEasing(t, easing = 'easeInOut') {
  const clamped = Math.max(0, Math.min(1, Number(t) || 0));
  if (easing === 'linear') {
    return clamped;
  }
  // Standard cubic ease-in-out
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Interpolates positions and items between two tactical frames.
 * - Players with same id interpolate positions smoothly.
 * - Players present in only one frame fade in / fade out with opacity.
 * - Ball interpolates coordinates if present in both; fades if only in one.
 * - Arrows fade by frame (frame A fades out, frame B fades in).
 */
export function interpolateFrame(frameA, frameB, t = 0, easing = 'easeInOut') {
  const safeA = frameA || { players: [], ball: null, arrows: [] };
  const safeB = frameB || { players: [], ball: null, arrows: [] };

  const easedT = calculateEasing(t, easing);

  // 1. Players interpolation
  const playersA = safeA.players || [];
  const playersB = safeB.players || [];

  const mapA = new Map(playersA.map((p) => [p.id, p]));
  const mapB = new Map(playersB.map((p) => [p.id, p]));

  const allPlayerIds = new Set([...mapA.keys(), ...mapB.keys()]);
  const interpolatedPlayers = [];

  for (const pid of allPlayerIds) {
    const pA = mapA.get(pid);
    const pB = mapB.get(pid);

    if (pA && pB) {
      // Present in both: smooth position interpolation
      interpolatedPlayers.push({
        id: pid,
        team: pB.team || pA.team,
        label: pB.label || pA.label,
        x: Number((pA.x + (pB.x - pA.x) * easedT).toFixed(2)),
        y: Number((pA.y + (pB.y - pA.y) * easedT).toFixed(2)),
        opacity: 1
      });
    } else if (pA && !pB) {
      // Only in A: fades out
      interpolatedPlayers.push({
        ...pA,
        opacity: Number((1 - easedT).toFixed(3))
      });
    } else if (!pA && pB) {
      // Only in B: fades in
      interpolatedPlayers.push({
        ...pB,
        opacity: Number(easedT.toFixed(3))
      });
    }
  }

  // 2. Ball interpolation
  const bA = safeA.ball;
  const bB = safeB.ball;
  let interpolatedBall = null;

  if (bA && bB) {
    interpolatedBall = {
      x: Number((bA.x + (bB.x - bA.x) * easedT).toFixed(2)),
      y: Number((bA.y + (bB.y - bA.y) * easedT).toFixed(2)),
      opacity: 1
    };
  } else if (bA && !bB) {
    interpolatedBall = {
      ...bA,
      opacity: Number((1 - easedT).toFixed(3))
    };
  } else if (!bA && bB) {
    interpolatedBall = {
      ...bB,
      opacity: Number(easedT.toFixed(3))
    };
  }

  // 3. Arrows: Frame A arrows fade out, Frame B arrows fade in
  const arrowsA = (safeA.arrows || []).map((arrow) => ({
    ...arrow,
    opacity: Number((1 - easedT).toFixed(3))
  }));

  const arrowsB = (safeB.arrows || []).map((arrow) => ({
    ...arrow,
    opacity: Number(easedT.toFixed(3))
  }));

  return {
    players: interpolatedPlayers,
    ball: interpolatedBall,
    arrows: [...arrowsA, ...arrowsB],
    t: easedT
  };
}

/**
 * Validates frame constraints per migration 007:
 * - max 24 players
 * - max 40 arrows
 * - player ids unique within frame
 * - finite coordinates within pitch
 */
export function validateFrame(frame, pitch = { pitch_length_m: 90, pitch_width_m: 60 }) {
  if (!frame || typeof frame !== 'object') {
    throw new Error('Data bingkai tidak valid');
  }

  const maxLen = Number(pitch?.pitch_length_m ?? 90);
  const maxWid = Number(pitch?.pitch_width_m ?? 60);

  // 1. Players validation
  const players = Array.isArray(frame.players) ? frame.players : [];
  if (players.length > 24) {
    throw new Error(`Jumlah pemain melebihi batas maksimal 24 (terdapat ${players.length})`);
  }

  const seenIds = new Set();
  for (const player of players) {
    if (!player.id) {
      throw new Error('Setiap pemain wajib memiliki ID unik');
    }
    if (seenIds.has(player.id)) {
      throw new Error(`ID pemain duplikat ditemukan dalam satu bingkai: ${player.id}`);
    }
    seenIds.add(player.id);

    const x = Number(player.x);
    const y = Number(player.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Koordinat pemain ${player.id} harus berupa angka terhingga`);
    }
    if (x < 0 || x > maxLen || y < 0 || y > maxWid) {
      throw new Error(`Posisi pemain ${player.id} (${x}, ${y}) di luar batas lapangan (${maxLen} x ${maxWid} m)`);
    }
  }

  // 2. Ball validation
  if (frame.ball) {
    const bx = Number(frame.ball.x);
    const by = Number(frame.ball.y);
    if (!Number.isFinite(bx) || !Number.isFinite(by)) {
      throw new Error('Koordinat bola harus berupa angka terhingga');
    }
    if (bx < 0 || bx > maxLen || by < 0 || by > maxWid) {
      throw new Error(`Posisi bola (${bx}, ${by}) di luar batas lapangan (${maxLen} x ${maxWid} m)`);
    }
  }

  // 3. Arrows validation
  const arrows = Array.isArray(frame.arrows) ? frame.arrows : [];
  if (arrows.length > 40) {
    throw new Error(`Jumlah panah melebihi batas maksimal 40 (terdapat ${arrows.length})`);
  }

  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i];
    if (!arrow.from || !arrow.to) {
      throw new Error(`Panah indeks ${i} tidak memiliki koordinat asal dan tujuan`);
    }
    const fx = Number(arrow.from.x);
    const fy = Number(arrow.from.y);
    const tx = Number(arrow.to.x);
    const ty = Number(arrow.to.y);
    if (!Number.isFinite(fx) || !Number.isFinite(fy) || !Number.isFinite(tx) || !Number.isFinite(ty)) {
      throw new Error(`Koordinat panah indeks ${i} harus berupa angka terhingga`);
    }
    if (fx < 0 || fx > maxLen || fy < 0 || fy > maxWid || tx < 0 || tx > maxLen || ty < 0 || ty > maxWid) {
      throw new Error(`Koordinat panah indeks ${i} di luar batas lapangan (${maxLen} x ${maxWid} m)`);
    }
    if (arrow.kind && !ARROW_KINDS.includes(arrow.kind)) {
      throw new Error(`Jenis panah "${arrow.kind}" tidak valid. Pilihan: ${ARROW_KINDS.join(', ')}`);
    }
  }

  return true;
}
