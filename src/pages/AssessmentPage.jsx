import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoachAssessmentView from '../components/CoachAssessmentView';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { usePlayers } from '../hooks/usePlayers';

export default function AssessmentPage({ userRole, onOpenAuthModal, onOpenPinModal, onToast }) {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { players, loading, saveAssessment, recordFitness, syncMatchStats } = usePlayers();
  const openModal = onOpenAuthModal || onOpenPinModal;

  const isAuthorized = userRole === 'coach' || userRole === 'admin';

  useEffect(() => {
    if (!isAuthorized && openModal) {
      openModal(`assessment:${playerId}`);
    }
  }, [isAuthorized, playerId, openModal]);

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

  const activePlayer = players.find(
    (p) => p.player_id === playerId || p.public_id === playerId
  ) || players[0];

  const handleSaveAssessment = async (updatedPlayerData) => {
    try {
      await saveAssessment(updatedPlayerData);
      if (onToast) {
        onToast({
          title: 'Data berhasil disimpan',
          subtext: `Evaluasi ${updatedPlayerData.personal_info.full_name} berhasil diperbarui.`
        });
      }
      navigate(`/pemain/${activePlayer.public_id || activePlayer.player_id}`);
    } catch (err) {
      if (onToast) {
        onToast({
          title: 'Pemberitahuan penyimpanan',
          subtext: err?.message || 'Data tersimpan dalam sesi memori aktif.'
        });
      }
    }
  };

  const handleSaveFitnessRecord = async (pid, testResult) => {
    try {
      await recordFitness(pid, testResult);
      if (onToast) {
        onToast({
          title: 'Hasil uji fisik tersimpan',
          subtext: 'Data kebugaran resmi berhasil dicatat.'
        });
      }
    } catch (err) {
      if (onToast) {
        onToast({
          title: 'Penyimpanan uji fisik',
          subtext: err?.message || 'Hasil uji fisik tersimpan lokal.'
        });
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center rounded-panel bg-panel border border-line space-y-3 max-w-md mx-auto text-1">
        <p className="text-sm text-2">
          Akses rapor evaluasi pelatih terkunci. Silakan masuk sebagai pelatih untuk membuka evaluasi.
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => openModal && openModal(`assessment:${playerId}`)}
        >
          Masuk akun pelatih
        </Button>
      </div>
    );
  }

  return (
    <CoachAssessmentView
      players={players}
      selectedPlayerId={activePlayer.player_id}
      activePlayer={activePlayer}
      onSaveAssessment={handleSaveAssessment}
      onSaveFitnessRecord={handleSaveFitnessRecord}
      onSyncMatchStats={syncMatchStats}
      onToast={onToast}
    />
  );
}
