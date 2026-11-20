import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchLiveRosterFromSupabase,
  saveAssessmentToSupabase,
  insertFitnessRecordToSupabase
} from '../lib/supabase';

const PlayersContext = createContext(null);

const isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true';

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
        setPlayers(playersRoster);
        if (playersRoster.length > 0 && !selectedPlayerId) {
          const dimas = playersRoster.find(
            (p) => p.personal_info?.full_name?.includes('Dimas') || p.personal_info?.jersey_number === 10
          );
          setSelectedPlayerId(dimas?.player_id || playersRoster[0].player_id);
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

  const value = {
    players,
    loading,
    error,
    isDemoMode,
    selectedPlayerId,
    setSelectedPlayerId,
    refreshPlayers: loadPlayers,
    saveAssessment,
    recordFitness
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
