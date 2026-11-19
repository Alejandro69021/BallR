import React from 'react';
import { useParams } from 'react-router-dom';
import PlayerHeader from '../components/PlayerHeader';
import InteractiveMatchHub from '../components/InteractiveMatchHub';
import OfficialDossierFooter from '../components/OfficialDossierFooter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { usePlayers } from '../hooks/usePlayers';

export default function MatchAnalysisPage({ onOpenShare, onShareClip, onToast }) {
  const { publicId } = useParams();
  const { players, loading } = usePlayers();

  if (loading) return <LoadingSkeleton />;
  if (!players || players.length === 0) return null;

  const player = players.find(
    (p) => p.public_id === publicId || p.player_id === publicId
  ) || players[0];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <PlayerHeader personalInfo={player.personal_info} onOpenStoryCard={onOpenShare} />
      <InteractiveMatchHub player={player} onShareClip={onShareClip} onToast={onToast} />
      <OfficialDossierFooter player={player} onOpenStoryCard={onOpenShare} onToast={onToast} />
    </div>
  );
}
