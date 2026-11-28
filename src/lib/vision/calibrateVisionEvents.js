/**
 * Universal post-processing & calibration for vision-detected match events
 * (YouTube Live/VOD, local MP4/WebM browser analyzer, or JSON import).
 *
 * Ensures every match automatically gets:
 * 1. Left-to-right attack orientation normalization (own attacks toward x = L).
 * 2. Honest sequence-based pass failure detection when raw vision only emits success passes.
 * 3. Automatic mapping of own events to registered match participants by tactical zone
 *    (never assigning shots/goals to goalkeepers).
 */

const POSITION_ZONES = {
  GK: { zx: 0.08, zy: 0.50 },
  CB: { zx: 0.24, zy: 0.50 },
  DF: { zx: 0.25, zy: 0.65 },
  LB: { zx: 0.28, zy: 0.16 },
  LWB: { zx: 0.32, zy: 0.16 },
  RB: { zx: 0.28, zy: 0.84 },
  RWB: { zx: 0.32, zy: 0.84 },
  DM: { zx: 0.40, zy: 0.50 },
  CDM: { zx: 0.40, zy: 0.50 },
  CM: { zx: 0.50, zy: 0.50 },
  MF: { zx: 0.50, zy: 0.50 },
  LM: { zx: 0.54, zy: 0.18 },
  RM: { zx: 0.54, zy: 0.82 },
  AM: { zx: 0.70, zy: 0.50 },
  CAM: { zx: 0.70, zy: 0.50 },
  LW: { zx: 0.78, zy: 0.18 },
  LWF: { zx: 0.80, zy: 0.22 },
  RW: { zx: 0.78, zy: 0.82 },
  RWF: { zx: 0.80, zy: 0.78 },
  CF: { zx: 0.84, zy: 0.50 },
  ST: { zx: 0.84, zy: 0.50 },
  FW: { zx: 0.82, zy: 0.50 }
};

function getZoneForPosition(posRaw, indexInSamePos = 0) {
  const code = String(posRaw || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  let base = POSITION_ZONES[code];
  if (!base) {
    const upper = String(posRaw || '').toUpperCase();
    if (upper.includes('KIPER') || upper.includes('GOAL')) base = POSITION_ZONES.GK;
    else if (upper.includes('BEK') || upper.includes('BACK')) base = POSITION_ZONES.CB;
    else if (upper.includes('SAYAP') || upper.includes('WING')) base = POSITION_ZONES.RW;
    else if (upper.includes('SERANG') || upper.includes('PENYERANG') || upper.includes('FORWARD')) base = POSITION_ZONES.ST;
    else base = POSITION_ZONES.CM;
  }
  // Spread multiple players sharing the same position slightly along Y/X
  const yShift = indexInSamePos === 0 ? 0 : indexInSamePos % 2 === 1 ? -0.14 : 0.14;
  return {
    zx: base.zx,
    zy: Math.max(0.08, Math.min(0.92, base.zy + yShift))
  };
}

function isGoalkeeperPosition(posRaw) {
  const upper = String(posRaw || '').toUpperCase();
  return upper === 'GK' || upper.includes('KIPER') || upper.includes('GOALKEEPER');
}

export function calibrateVisionEvents(rawEvents = [], options = {}) {
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return {
      events: [],
      stats: { flipped: false, failedPassesInferred: 0, mappedToRoster: 0 }
    };
  }

  const L = Number(options.pitchLengthM) || 90;
  const W = Number(options.pitchWidthM) || 60;
  const participants = Array.isArray(options.participants) ? options.participants : [];
  const alreadyNormalized = Boolean(options.orientationNormalized);

  let events = rawEvents.map((e) => ({ ...e }));

  // 1. Auto-normalize attack direction (own attacks left -> right toward x = L)
  let flipped = false;
  if (!alreadyNormalized) {
    const ownShots = events.filter(
      (e) =>
        e.team === 'own' &&
        (e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal') &&
        e.x_m != null &&
        Number.isFinite(Number(e.x_m))
    );
    if (ownShots.length >= 2) {
      const avgShotX = ownShots.reduce((sum, e) => sum + Number(e.x_m), 0) / ownShots.length;
      if (avgShotX < L * 0.48) {
        flipped = true;
        events = events.map((e) => ({
          ...e,
          x_m: e.x_m != null && Number.isFinite(Number(e.x_m)) ? Number((L - Number(e.x_m)).toFixed(1)) : e.x_m,
          end_x_m:
            e.end_x_m != null && Number.isFinite(Number(e.end_x_m))
              ? Number((L - Number(e.end_x_m)).toFixed(1))
              : e.end_x_m
        }));
      }
    }
  }

  // 2. Sequence-based pass failure inference when raw vision emits 0 failed passes
  let failedPassesInferred = 0;
  const passes = events.filter((e) => e.event_type === 'pass' || e.event_type === 'key_pass');
  const hasAnyFailedPass = passes.some((e) => e.outcome === 'fail');
  if (passes.length >= 5 && !hasAnyFailedPass) {
    for (let i = 0; i < events.length - 1; i += 1) {
      const cur = events[i];
      const nxt = events[i + 1];
      if (
        (cur.event_type === 'pass' || cur.event_type === 'key_pass') &&
        nxt.event_type === 'ball_loss' &&
        cur.team === nxt.team
      ) {
        const hasVideoTime = cur.video_time_s != null && nxt.video_time_s != null;
        const closeInTime = hasVideoTime
          ? Math.abs(Number(nxt.video_time_s) - Number(cur.video_time_s)) <= 4.5
          : Math.abs(Number(nxt.minute || 0) - Number(cur.minute || 0)) <= 0.2;
        if (closeInTime) {
          cur.outcome = 'fail';
          failedPassesInferred += 1;
        }
      }
    }
  }

  // 3. Map unassigned own events to registered match participants by tactical zone
  let mappedToRoster = 0;
  if (participants.length > 0) {
    const validIds = new Set(participants.map((p) => p.player_id).filter(Boolean));
    const posCounts = {};
    const roster = participants.map((p) => {
      const posKey = String(p.position || 'CM').toUpperCase();
      const idx = posCounts[posKey] || 0;
      posCounts[posKey] = idx + 1;
      const zone = getZoneForPosition(p.position, idx);
      const mins = Number(p.minutes_played ?? 90);
      const isStarter = p.is_starter !== false;
      return {
        id: p.player_id,
        num: p.jersey_number ?? null,
        name: p.player_name || p.player_id,
        isGk: isGoalkeeperPosition(p.position),
        start: isStarter ? 0 : Math.max(0, 90 - mins),
        end: isStarter ? Math.max(mins, 45) : 120,
        zx: zone.zx,
        zy: zone.zy
      };
    });

    events.forEach((e) => {
      if (e.team !== 'own') return;
      if (e.player_id && validIds.has(e.player_id)) return;
      if (e.x_m == null || e.y_m == null) return;

      const min = Number(e.minute || 0);
      const active = roster.filter((p) => min >= p.start && min <= p.end);
      const pool = active.length > 0 ? active : roster;
      const isShot =
        e.event_type === 'shot' || e.event_type === 'shot_on_target' || e.event_type === 'goal';
      const nonGk = pool.filter((p) => !p.isGk);
      const candidates = isShot && nonGk.length > 0 ? nonGk : pool;

      const xPct = Number(e.x_m) / Math.max(1, L);
      const yPct = Number(e.y_m) / Math.max(1, W);
      let best = candidates[0];
      let bestDist = Infinity;
      for (const p of candidates) {
        const dist = Math.hypot((p.zx - xPct) * 1.2, p.zy - yPct);
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      if (best) {
        e.player_id = best.id;
        if (best.num != null) e.player_number = best.num;
        if (!e.player_name) e.player_name = best.name;
        mappedToRoster += 1;
      }
    });
  }

  return {
    events,
    stats: { flipped, failedPassesInferred, mappedToRoster }
  };
}
