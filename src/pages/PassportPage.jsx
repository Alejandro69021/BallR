import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Share2 } from 'lucide-react';
import PlayerTabs from '../components/PlayerTabs';
import PlayerHeader from '../components/PlayerHeader';
import PerformanceRadar from '../components/PerformanceRadar';
import FitnessStrip from '../components/FitnessStrip';
import AICoachCard from '../components/AICoachCard';
import OfficialDossierFooter from '../components/OfficialDossierFooter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { usePlayers } from '../hooks/usePlayers';

export default function PassportPage({ userRole = 'public', onOpenShare, onToast }) {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { players, loading } = usePlayers();

  if (loading) return <LoadingSkeleton />;
  if (!players || players.length === 0) {
    return (
      <div className="p-8 border border-line rounded-panel bg-panel">
        <EmptyState title="Belum ada data pemain." description="Daftar pemain belum ditambahkan." />
      </div>
    );
  }

  const player = players.find(
    (p) => p.public_id === publicId || p.player_id === publicId
  ) || players[0];

  return (
    <div className="space-y-8 divide-y divide-line text-1">
      {/* Portal Orang Tua / Wali Banner (Football-themed editorial card) */}
      {userRole === 'parent' && (
        <div
          data-testid="parent-portal-banner"
          className="relative overflow-hidden rounded-panel border border-brand/40 bg-panel text-1 p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-brand">
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Orang Tua &amp; Wali</span>
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-1">
                Pantau Perkembangan &amp; Privasi {player.personal_info?.full_name || 'Atlet'}
              </h2>
              <p className="text-sm text-2 max-w-2xl">
                Anda masuk sebagai wali. Anda dapat memantau evaluasi pelatih, riwayat pertumbuhan fisik, mengunduh kartu perkembangan, dan mengatur izin privasi data anak.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/pemain/${player.public_id || player.player_id}/pertumbuhan`)}
                className="min-h-[44px] px-3.5 py-2 rounded-control bg-brand text-app hover:bg-brand/90 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Pertumbuhan &amp; Privasi</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenShare?.()}
                className="min-h-[44px] px-3.5 py-2 rounded-control bg-raised border border-line hover:border-brand text-1 text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Kartu Perkembangan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Player Header & Navigation Tabs */}
      <PlayerTabs
        player={player}
        activeTab="passport"
        userRole={userRole}
      />

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

      {/* 5. Verifikasi Integritas Dokumen & Footer */}
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
