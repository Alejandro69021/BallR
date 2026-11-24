import React from 'react';
import { useNavigate } from 'react-router-dom';
import SquadHubView from '../components/SquadHubView';
import PageContainer from '../components/ux/PageContainer';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { usePlayers } from '../hooks/usePlayers';

export default function SquadPage({ userRole, onOpenAuthModal, onOpenPinModal }) {
  const navigate = useNavigate();
  const { players, loading } = usePlayers();
  const openModal = onOpenAuthModal || onOpenPinModal;

  if (loading) return <LoadingSkeleton />;

  const handleViewPassport = (playerId) => {
    const player = players.find((p) => p.player_id === playerId);
    const targetId = player?.public_id || playerId;
    navigate(`/pemain/${targetId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEvaluatePlayer = (playerId) => {
    if (userRole !== 'coach' && userRole !== 'admin') {
      if (openModal) openModal(`assessment:${playerId}`);
    } else {
      navigate(`/penilaian/${playerId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <PageContainer>
      <SquadHubView
        players={players}
        userRole={userRole}
        onViewPassport={handleViewPassport}
        onEvaluatePlayer={handleEvaluatePlayer}
      />
    </PageContainer>
  );
}
