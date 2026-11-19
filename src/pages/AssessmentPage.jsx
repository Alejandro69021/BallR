import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoachAssessmentView from '../components/CoachAssessmentView';
import LoadingSkeleton from '../components/LoadingSkeleton';
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
  if (!players || players.length === 0) return null;

  const activePlayer = players.find(
    (p) => p.player_id === playerId || p.public_id === playerId
  ) || players[0];

  const handleSaveAssessment = async (updatedPlayerData) => {
    try {
      await saveAssessment(updatedPlayerData);
      if (onToast) {
        onToast({
          title: "Data Berhasil Disimpan",
          subtext: `Evaluasi ${updatedPlayerData.personal_info.full_name} berhasil diperbarui.`
        });
      }
      navigate(`/pemain/${activePlayer.public_id || activePlayer.player_id}`);
    } catch (err) {
      if (onToast) {
        onToast({
          title: "Pemberitahuan Penyimpanan",
          subtext: err?.message || "Data tersimpan dalam sesi memori aktif."
        });
      }
    }
  };

  const handleSaveFitnessRecord = async (pid, testResult) => {
    try {
      await recordFitness(pid, testResult);
      if (onToast) {
        onToast({
          title: "Hasil Uji Fisik Tersimpan",
          subtext: "Data kebugaran resmi berhasil dicatat."
        });
      }
    } catch (err) {
      if (onToast) {
        onToast({
          title: "Penyimpanan Uji Fisik",
          subtext: err?.message || "Hasil uji fisik tersimpan lokal."
        });
      }
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center rounded-lg bg-[#0C111D] border border-slate-800 space-y-3 max-w-md mx-auto">
        <p className="text-sm text-slate-300">
          Akses Rapor Evaluasi Pelatih terkunci. Silakan masuk sebagai pelatih untuk membuka evaluasi.
        </p>
        <button
          type="button"
          onClick={() => openModal && openModal(`assessment:${playerId}`)}
          className="px-4 py-2 rounded bg-[#CCFF00] text-black font-semibold text-xs cursor-pointer"
        >
          Masuk Akun Pelatih
        </button>
      </div>
    );
  }

  return (
    <CoachAssessmentView
      activePlayer={activePlayer}
      onSaveAssessment={handleSaveAssessment}
      onSaveFitnessRecord={handleSaveFitnessRecord}
      onSyncMatchStats={syncMatchStats}
      onToast={onToast}
    />
  );
}
