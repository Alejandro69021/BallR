import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchLiveRosterFromSupabase,
  saveAssessmentToSupabase,
  insertFitnessRecordToSupabase
} from '../lib/supabase';

const PlayersContext = createContext(null);

const isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true';

const DEMO_CUSTOM_PLAYERS_KEY = 'ballr_custom_players_v1';
const DEMO_PLAYER_OVERRIDES_KEY = 'ballr_player_overrides_v1';
const DEMO_DELETED_PLAYERS_KEY = 'ballr_deleted_players_v1';

function loadJsonStorage(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJsonStorage(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

function loadCustomDemoPlayers() {
  const parsed = loadJsonStorage(DEMO_CUSTOM_PLAYERS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function derivePositionGroup(position) {
  const pos = String(position || 'CM').trim();
  const lower = pos.toLowerCase();
  if (pos.includes('GK') || lower.includes('kiper') || lower.includes('goalkeeper')) return 'GK';
  if (pos.includes('CB') || pos.includes('RB') || pos.includes('LB') || lower.includes('bek') || lower.includes('back')) return 'DEF';
  if (pos.includes('ST') || pos.includes('RW') || pos.includes('LW') || lower.includes('penyerang') || lower.includes('sayap') || lower.includes('forward') || lower.includes('winger')) return 'FWD';
  return 'MID';
}

export function PlayersProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDemoMode) {
        // Dynamic import to avoid bundling mockData in production / non-demo mode
        const { playersRoster } = await import('../data/mockData.js');
        const customPlayers = loadCustomDemoPlayers();
        const overrides = loadJsonStorage(DEMO_PLAYER_OVERRIDES_KEY, {});
        const deletedRaw = loadJsonStorage(DEMO_DELETED_PLAYERS_KEY, []);
        const deletedSet = new Set(Array.isArray(deletedRaw) ? deletedRaw : []);

        const combined = [...playersRoster, ...customPlayers]
          .filter((p) => !deletedSet.has(p.player_id))
          .map((p) => {
            const ov = overrides && typeof overrides === 'object' ? overrides[p.player_id] : null;
            if (!ov) return p;
            return {
              ...p,
              ...ov,
              personal_info: {
                ...p.personal_info,
                ...(ov.personal_info || {})
              }
            };
          });
        setPlayers(combined);
        if (combined.length > 0 && !selectedPlayerId) {
          const dimas = combined.find(
            (p) => p.personal_info?.full_name?.includes('Dimas') || p.personal_info?.jersey_number === 10
          );
          setSelectedPlayerId(dimas?.player_id || combined[0].player_id);
        }
      } else {
        const livePlayers = await fetchLiveRosterFromSupabase();
        setPlayers(livePlayers);
        if (livePlayers.length > 0 && !selectedPlayerId) {
          const dimas = livePlayers.find(
            (p) => p.personal_info?.full_name?.includes('Dimas') || p.personal_info?.jersey_number === 10
          );
          setSelectedPlayerId(dimas?.player_id || livePlayers[0].player_id);
        }
      }
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err?.message || 'Gagal terhubung ke Supabase database.');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayerId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Mutation: save assessment
  const saveAssessment = useCallback(async (updatedPlayerData) => {
    if (!isDemoMode) {
      const savedRecord = await saveAssessmentToSupabase(
        updatedPlayerData.player_id,
        updatedPlayerData,
        updatedPlayerData.db_assessment_id
      );

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.player_id === updatedPlayerData.player_id) {
            return {
              ...updatedPlayerData,
              db_assessment_id: savedRecord?.id || p.db_assessment_id
            };
          }
          return p;
        })
      );
      return savedRecord;
    } else {
      // Local state update in demo mode
      setPlayers((prev) =>
        prev.map((p) => (p.player_id === updatedPlayerData.player_id ? updatedPlayerData : p))
      );
      return null;
    }
  }, []);

  // Mutation: record fitness
  const recordFitness = useCallback(async (playerId, testResult) => {
    const fitnessPayload = {
      [testResult.type]: testResult.numericValue,
      test_date: new Date().toISOString().split('T')[0]
    };

    if (!isDemoMode) {
      return await insertFitnessRecordToSupabase(playerId, fitnessPayload);
    }
    return null;
  }, []);

  // Mutation: add player manually to squad
  const addPlayer = useCallback(async (draft) => {
    const num = Number(draft.jersey_number) || 99;
    const id = `WK-2026-${String(Date.now()).slice(-4)}`;
    const pos = String(draft.position || 'CM').trim();
    const posGroup = derivePositionGroup(pos);

    const newPlayer = {
      player_id: id,
      public_id: id,
      personal_info: {
        full_name: String(draft.full_name || '').trim(),
        nickname: String(draft.nickname || '').trim() || String(draft.full_name || '').trim().split(' ')[0],
        jersey_number: num,
        position: pos,
        position_group: posGroup,
        age: Number(draft.age) || 13,
        age_group: draft.age_group || 'U-13',
        preferred_foot: draft.preferred_foot || 'Kanan',
        height_cm: draft.height_cm ? Number(draft.height_cm) : null,
        weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
        evaluation_status: 'pending',
        academy: {
          id: 'demo-academy-01',
          name: draft.team_name?.trim() || 'Mataram Putra Football Academy',
          city: 'Yogyakarta'
        }
      },
      radar_attributes: [
        { attribute: 'Kecepatan (Pace)', value: 70 },
        { attribute: 'Shooting (Finishing)', value: 68 },
        { attribute: 'Passing (Distribusi)', value: 70 },
        { attribute: 'Dribbling (Kontrol)', value: 69 },
        { attribute: 'Defending (Pressing)', value: 66 },
        { attribute: 'Physical (Daya Tahan)', value: 70 }
      ],
      fitness_benchmarks: {
        vertical_jump_cm: null,
        sprint_20m_sec: null,
        shuttle_run_sec: null,
        test_date: new Date().toISOString().split('T')[0]
      },
      ai_coach_evaluation: {
        period: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        coach_name: 'Pelatih Akademi',
        narrative: 'Pemain baru terdaftar. Lengkapi evaluasi berkala dan pengukuran fisik.'
      },
      anthropometry_history: []
    };

    setPlayers((prev) => [...prev, newPlayer]);
    const existing = loadCustomDemoPlayers();
    saveJsonStorage(DEMO_CUSTOM_PLAYERS_KEY, [...existing, newPlayer]);
    return newPlayer;
  }, []);

  // Mutation: update / rotate player position or profile in squad
  const updatePlayer = useCallback(async (playerId, draft) => {
    if (!playerId) throw new Error('ID pemain tidak ditemukan.');
    const pos = String(draft.position || 'CM').trim();
    const posGroup = derivePositionGroup(pos);
    const fullName = String(draft.full_name || '').trim();
    const nickname = String(draft.nickname || '').trim() || fullName.split(' ')[0];
    const jerseyNum = draft.jersey_number !== '' && draft.jersey_number != null ? Number(draft.jersey_number) : null;

    let updatedPlayer = null;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.player_id !== playerId && p.public_id !== playerId) return p;
        const nextInfo = {
          ...p.personal_info,
          ...(fullName ? { full_name: fullName } : {}),
          ...(nickname ? { nickname } : {}),
          ...(jerseyNum != null && !Number.isNaN(jerseyNum) ? { jersey_number: jerseyNum } : {}),
          position: pos,
          position_group: posGroup,
          ...(draft.age ? { age: Number(draft.age) } : {}),
          ...(draft.preferred_foot ? { preferred_foot: draft.preferred_foot } : {}),
          height_cm: draft.height_cm !== '' && draft.height_cm != null ? Number(draft.height_cm) : null,
          weight_kg: draft.weight_kg !== '' && draft.weight_kg != null ? Number(draft.weight_kg) : null,
          academy: {
            ...(p.personal_info?.academy || {}),
            name: draft.team_name?.trim() || p.personal_info?.academy?.name || 'Mataram Putra Football Academy'
          }
        };
        updatedPlayer = { ...p, personal_info: nextInfo };
        return updatedPlayer;
      })
    );

    const existingCustom = loadCustomDemoPlayers();
    const customIdx = existingCustom.findIndex((p) => p.player_id === playerId || p.public_id === playerId);
    if (customIdx >= 0 && updatedPlayer) {
      const nextCustom = [...existingCustom];
      nextCustom[customIdx] = updatedPlayer;
      saveJsonStorage(DEMO_CUSTOM_PLAYERS_KEY, nextCustom);
    } else if (updatedPlayer) {
      const overrides = loadJsonStorage(DEMO_PLAYER_OVERRIDES_KEY, {});
      const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};
      safeOverrides[updatedPlayer.player_id] = {
        personal_info: updatedPlayer.personal_info
      };
      saveJsonStorage(DEMO_PLAYER_OVERRIDES_KEY, safeOverrides);
    }

    return updatedPlayer;
  }, []);

  // Mutation: delete player from squad
  const deletePlayer = useCallback(async (playerId) => {
    if (!playerId) throw new Error('ID pemain tidak ditemukan.');

    setPlayers((prev) => {
      const next = prev.filter((p) => p.player_id !== playerId && p.public_id !== playerId);
      if (selectedPlayerId === playerId) {
        setSelectedPlayerId(next[0]?.player_id || null);
      }
      return next;
    });

    const existingCustom = loadCustomDemoPlayers();
    const isCustom = existingCustom.some((p) => p.player_id === playerId || p.public_id === playerId);
    if (isCustom) {
      saveJsonStorage(
        DEMO_CUSTOM_PLAYERS_KEY,
        existingCustom.filter((p) => p.player_id !== playerId && p.public_id !== playerId)
      );
    } else {
      const deletedRaw = loadJsonStorage(DEMO_DELETED_PLAYERS_KEY, []);
      const deletedList = Array.isArray(deletedRaw) ? deletedRaw : [];
      if (!deletedList.includes(playerId)) {
        saveJsonStorage(DEMO_DELETED_PLAYERS_KEY, [...deletedList, playerId]);
      }
    }
  }, [selectedPlayerId]);

  const value = {
    players,
    loading,
    error,
    isDemoMode,
    selectedPlayerId,
    setSelectedPlayerId,
    refreshPlayers: loadPlayers,
    saveAssessment,
    recordFitness,
    addPlayer,
    updatePlayer,
    deletePlayer
  };

  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
}

export function usePlayersContext() {
  const ctx = useContext(PlayersContext);
  if (!ctx) {
    throw new Error('usePlayersContext must be used within a PlayersProvider');
  }
  return ctx;
}
