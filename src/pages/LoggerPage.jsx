import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FastPitchLogger from '../components/FastPitchLogger';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
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
  if (!players || players.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <EmptyState
          title="Belum ada data pemain"
          description="Daftar pemain akademi belum tersedia dalam basis data."
        />
      </div>
    );
  }

  const handleFinishMatch = (matchSummary) => {
    syncMatchStats(matchSummary);
    navigate(`/pemain/${matchSummary.playerId}/laga/${matchId || 'match-01'}`);
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-3 max-w-md mx-auto text-1">
        <p className="text-sm text-2">
          Akses matchday pitch logger terkunci. Silakan masuk sebagai staf pelatih untuk melanjutkan.
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => openModal && openModal(`logger:${matchId || 'match-01'}`)}
        >
          Masuk akun pelatih
        </Button>
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
