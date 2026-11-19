import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FastPitchLogger from '../components/FastPitchLogger';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { usePlayers } from '../hooks/usePlayers';

export default function LoggerPage({ userRole, onOpenAuthModal, onOpenPinModal, onToast }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { players, loading, syncMatchStats } = usePlayers();
  const openModal = onOpenAuthModal || onOpenPinModal;

  const isAuthorized = userRole === 'coach' || userRole === 'admin';

  useEffect(() => {
    if (!isAuthorized && openModal) {
      openModal(`logger:${matchId || 'match-01'}`);
    }
  }, [isAuthorized, matchId, openModal]);

  if (loading) return <LoadingSkeleton />;
  if (!players || players.length === 0) return null;

  const handleFinishMatch = (matchSummary) => {
    syncMatchStats(matchSummary);
    navigate(`/pemain/${matchSummary.playerId}/laga/${matchId || 'match-01'}`);
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center rounded-lg bg-[#0C111D] border border-slate-800 space-y-3 max-w-md mx-auto">
        <p className="text-sm text-slate-300">
          Akses Matchday Pitch Logger terkunci. Silakan masuk sebagai staf pelatih untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => openModal && openModal(`logger:${matchId || 'match-01'}`)}
          className="px-4 py-2 rounded bg-[#CCFF00] text-black font-semibold text-xs cursor-pointer"
        >
          Masuk Akun Pelatih
        </button>
      </div>
    );
  }

  return (
    <FastPitchLogger
      players={players}
      selectedPlayerId={players[0]?.player_id}
      onSelectPlayer={() => {}}
      onFinishMatch={handleFinishMatch}
      onToast={onToast}
    />
  );
}
