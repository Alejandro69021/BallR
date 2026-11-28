const SLOT_MAP_PREFIX = 'ballr_player_slot_map_';
const SLOT_NAME_PREFIX = 'ballr_player_slot_names_';
const DETECTED_PLAYERS_PREFIX = 'ballr_detected_players_';
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

/**
 * Pemetaan nama pemain asli per nomor slot video, misal { "10": "Marselino Ferdinan" }.
 * Terisi otomatis dari komentar/subtitle video atau diedit langsung oleh pelatih.
 */
export function loadSlotNameMap(matchId) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(`${SLOT_NAME_PREFIX}${matchId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSlotNameMap(matchId, nameMap) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const clean = {};
    if (nameMap && typeof nameMap === 'object') {
      Object.entries(nameMap).forEach(([k, v]) => {
        const trimmed = String(v || '').trim();
        if (trimmed) clean[String(k)] = trimmed;
      });
    }
    if (Object.keys(clean).length === 0) {
      window.localStorage.removeItem(`${SLOT_NAME_PREFIX}${matchId}`);
    } else {
      window.localStorage.setItem(`${SLOT_NAME_PREFIX}${matchId}`, JSON.stringify(clean));
    }
  } catch {
    // Abaikan jika localStorage penuh atau diblokir
  }
}

export function loadDetectedPlayers(matchId) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(`${DETECTED_PLAYERS_PREFIX}${matchId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDetectedPlayers(matchId, players) {
  if (!matchId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const clean = Array.isArray(players) ? players.filter((p) => p && p.name) : [];
    if (clean.length === 0) {
      window.localStorage.removeItem(`${DETECTED_PLAYERS_PREFIX}${matchId}`);
    } else {
      window.localStorage.setItem(`${DETECTED_PLAYERS_PREFIX}${matchId}`, JSON.stringify(clean));
    }
  } catch {
    // Abaikan jika localStorage penuh atau diblokir
  }
}

export function applyPlayerSlotMap(events, slotMap, playerMap = {}, slotNameMap = {}) {
  if (!Array.isArray(events) || events.length === 0) return events || [];
  const hasSlotMap = slotMap && typeof slotMap === 'object' && Object.keys(slotMap).length > 0;
  const hasNameMap = slotNameMap && typeof slotNameMap === 'object' && Object.keys(slotNameMap).length > 0;
  if (!hasSlotMap && !hasNameMap) {
    return events;
  }
  return events.map((evt) => {
    if (evt && evt.team === 'own' && evt.player_number != null) {
      const slotKey = String(evt.player_number);
      if (!evt.player_id && hasSlotMap && slotMap[slotKey]) {
        const mappedPid = slotMap[slotKey];
        const info = playerMap[mappedPid];
        return {
          ...evt,
          player_id: mappedPid,
          player_number:
            info?.number != null && info.number !== '' ? Number(info.number) : evt.player_number,
          player_name: info?.name || evt.player_name || null
        };
      }
      if (hasNameMap && slotNameMap[slotKey]) {
        return {
          ...evt,
          player_name: slotNameMap[slotKey]
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
