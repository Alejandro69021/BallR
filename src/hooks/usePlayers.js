import { usePlayersContext } from '../context/PlayersContext';

/**
 * Hook to access the full squad roster, loading state, error state, and player mutations.
 */
export function usePlayers() {
  const context = usePlayersContext();
  return {
    players: context.players,
    loading: context.loading,
    error: context.error,
    isDemoMode: context.isDemoMode,
    selectedPlayerId: context.selectedPlayerId,
    setSelectedPlayerId: context.setSelectedPlayerId,
    refreshPlayers: context.refreshPlayers,
    saveAssessment: context.saveAssessment,
    recordFitness: context.recordFitness,
    syncMatchStats: context.syncMatchStats
  };
}

/**
 * Hook to find and track a specific player by publicId or playerId.
 * @param {string} publicIdOrId
 */
export function usePlayer(publicIdOrId) {
  const context = usePlayersContext();
  const { players, loading, error } = context;

  const player = players.find(
    (p) => p.public_id === publicIdOrId || p.player_id === publicIdOrId
  ) || null;

  const teammates = player
    ? players.filter((p) => p.player_id !== player.player_id)
    : [];

  return {
    player,
    teammates,
    loading,
    error,
    isDemoMode: context.isDemoMode,
    saveAssessment: context.saveAssessment,
    recordFitness: context.recordFitness,
    syncMatchStats: context.syncMatchStats
  };
}
