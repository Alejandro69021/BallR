import React from 'react';
import { useParams } from 'react-router-dom';
import PlayerHeader from '../components/PlayerHeader';
import PerformanceRadar from '../components/PerformanceRadar';
import FitnessStrip from '../components/FitnessStrip';
import AICoachCard from '../components/AICoachCard';
import OfficialDossierFooter from '../components/OfficialDossierFooter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { usePlayers } from '../hooks/usePlayers';

export default function PassportPage({ onOpenShare, onToast }) {
  const { publicId } = useParams();
  const { players, loading } = usePlayers();

  if (loading) return <LoadingSkeleton />;
  if (!players || players.length === 0) return null;

  const player = players.find(
    (p) => p.public_id === publicId || p.player_id === publicId
  ) || players[0];

  const teammates = players.filter((p) => p.player_id !== player.player_id);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <PlayerHeader personalInfo={player.personal_info} onOpenStoryCard={onOpenShare} />
      <PerformanceRadar
        attributes={player.radar_attributes}
        athleteName={player.personal_info.full_name}
        teammates={teammates}
      />
      <FitnessStrip benchmarks={player.fitness_benchmarks} />
      <AICoachCard evaluation={player.ai_coach_evaluation} />
      <OfficialDossierFooter player={player} onOpenStoryCard={onOpenShare} onToast={onToast} />
    </div>
  );
}
