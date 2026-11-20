import React from 'react';
import { useParams } from 'react-router-dom';
import PlayerHeader from '../components/PlayerHeader';
import PerformanceRadar from '../components/PerformanceRadar';
import FitnessStrip from '../components/FitnessStrip';
import AICoachCard from '../components/AICoachCard';
import MatchMoments from '../components/MatchMoments';
import OfficialDossierFooter from '../components/OfficialDossierFooter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { usePlayers } from '../hooks/usePlayers';

export default function PassportPage({ onOpenShare, onToast }) {
  const { publicId } = useParams();
  const { players, loading } = usePlayers();

  if (loading) return <LoadingSkeleton />;
  if (!players || players.length === 0) {
    return (
      <div className="p-8 border border-line rounded-panel bg-panel">
        <EmptyState title="Tidak ada data pemain" description="Daftar pemain tidak ditemukan." />
      </div>
    );
  }

  const player = players.find(
    (p) => p.public_id === publicId || p.player_id === publicId
  ) || players[0];

  const hasRealClips =
    Array.isArray(player.verified_moments) &&
    player.verified_moments.some((c) => c && (c.video_url || c.title));

  return (
    <div className="space-y-8 divide-y divide-line text-1">
      {/* 1. Identity Block and 5-Line Technical Summary */}
      <PlayerHeader
        player={player}
        personalInfo={player.personal_info}
        onOpenStoryCard={onOpenShare}
      />

      {/* 2. Penilaian Pelatih: Radar Chart & Values Table */}
      <div className="pt-8">
        <PerformanceRadar
          attributes={player.radar_attributes}
          athleteName={player.personal_info?.full_name}
          period={player.ai_coach_evaluation?.period}
        />
      </div>

      {/* 3. Penilaian Pelatih: Narasi Pelatih */}
      <div className="pt-8">
        <AICoachCard evaluation={player.ai_coach_evaluation} />
      </div>

      {/* 4. Uji Kebugaran Fisik */}
      <div className="pt-8">
        <FitnessStrip benchmarks={player.fitness_benchmarks} />
      </div>

      {/* 5. Momen Pertandingan (only if real clips exist) */}
      {hasRealClips && (
        <div className="pt-8">
          <MatchMoments moments={player.verified_moments} />
        </div>
      )}

      {/* 6. Verifikasi Integritas Dokumen & Footer */}
      <div className="pt-8">
        <OfficialDossierFooter
          player={player}
          onOpenStoryCard={onOpenShare}
          onToast={onToast}
        />
      </div>
    </div>
  );
}
