const SLOT_MAP_PREFIX = 'ballr_player_slot_map_';
const GOAL_OVERRIDE_PREFIX = 'ballr_goal_overrides_';

export function loadPlayerSlotMap(matchId) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(`${SLOT_MAP_PREFIX}${matchId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function savePlayerSlotMap(matchId, slotMap) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const clean = slotMap && typeof slotMap === 'object' ? slotMap : {};
    if (Object.keys(clean).length === 0) {
      window.localStorage.removeItem(`${SLOT_MAP_PREFIX}${matchId}`);
    } else {
      window.localStorage.setItem(`${SLOT_MAP_PREFIX}${matchId}`, JSON.stringify(clean));
    }
  } catch {
    // Abaikan jika localStorage penuh atau diblokir
  }
}

export function applyPlayerSlotMap(events, slotMap, playerMap = {}) {
  if (!Array.isArray(events) || events.length === 0) return events || [];
  if (!slotMap || typeof slotMap !== 'object' || Object.keys(slotMap).length === 0) {
    return events;
  }
  return events.map((evt) => {
    if (evt && evt.team === 'own' && !evt.player_id && evt.player_number != null) {
      const mappedPid = slotMap[String(evt.player_number)];
      if (mappedPid) {
        const info = playerMap[mappedPid];
        return {
          ...evt,
          player_id: mappedPid,
          player_number:
            info?.number != null && info.number !== '' ? Number(info.number) : evt.player_number
        };
      }
    }
    return evt;
  });
}

export function loadGoalOverrides(matchId) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(`${GOAL_OVERRIDE_PREFIX}${matchId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGoalOverrides(matchId, overrides) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const clean = overrides && typeof overrides === 'object' ? overrides : {};
    if (Object.keys(clean).length === 0) {
      window.localStorage.removeItem(`${GOAL_OVERRIDE_PREFIX}${matchId}`);
    } else {
      window.localStorage.setItem(`${GOAL_OVERRIDE_PREFIX}${matchId}`, JSON.stringify(clean));
    }
  } catch {
    // Abaikan jika localStorage penuh atau diblokir
  }
}
