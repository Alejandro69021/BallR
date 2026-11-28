import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchLiveRosterFromSupabase,
  saveAssessmentToSupabase,
  insertFitnessRecordToSupabase
} from '../lib/supabase';

const PlayersContext = createContext(null);

const isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true';

const DEMO_CUSTOM_PLAYERS_KEY = 'ballr_custom_players_v1';

function loadCustomDemoPlayers() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CUSTOM_PLAYERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
        const combined = [...playersRoster, ...customPlayers];
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
    const posGroup = pos.includes('GK') || pos.toLowerCase().includes('kiper')
      ? 'GK'
      : pos.includes('CB') || pos.includes('RB') || pos.includes('LB') || pos.toLowerCase().includes('bek')
        ? 'DEF'
        : pos.includes('ST') || pos.includes('RW') || pos.includes('LW') || pos.toLowerCase().includes('penyerang') || pos.toLowerCase().includes('sayap')
          ? 'FWD'
          : 'MID';

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
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const existing = loadCustomDemoPlayers();
        window.localStorage.setItem(DEMO_CUSTOM_PLAYERS_KEY, JSON.stringify([...existing, newPlayer]));
      } catch {
        // ignore storage quota errors
      }
    }
    return newPlayer;
  }, []);

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
    addPlayer
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
