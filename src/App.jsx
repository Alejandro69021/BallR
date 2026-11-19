import React, { useState, useEffect } from 'react';
import { playersRoster } from './data/mockData';
import {
  fetchLiveRosterFromSupabase,
  saveAssessmentToSupabase,
  insertFitnessRecordToSupabase
} from './lib/supabase';
import TopNav from './components/TopNav';
import SquadHubView from './components/SquadHubView';
import PlayerHeader from './components/PlayerHeader';
import PerformanceRadar from './components/PerformanceRadar';
import FitnessStrip from './components/FitnessStrip';
import AICoachCard from './components/AICoachCard';
import InteractiveMatchHub from './components/InteractiveMatchHub';
import GrowthBioBandingTab from './components/GrowthBioBandingTab';
import FastPitchLogger from './components/FastPitchLogger';
import VideoModal from './components/VideoModal';
import CoachAssessmentView from './components/CoachAssessmentView';
import StoryFlexCardModal from './components/StoryFlexCardModal';
import PinAuthModal from './components/PinAuthModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import Toast from './components/Toast';
import InstallAppBanner from './components/InstallAppBanner';
import OfflineIndicator from './components/OfflineIndicator';
import OfficialDossierFooter from './components/OfficialDossierFooter';

export default function App() {
  // 1. Role Guard state (default to 'public', persist in localStorage)
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('ballr_user_role') || 'public';
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingTargetView, setPendingTargetView] = useState('assessment');

  // Live Supabase Players State
  const [players, setPlayers] = useState(playersRoster);
  const [selectedPlayerId, setSelectedPlayerId] = useState(playersRoster[0].player_id);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  
  // 4 primary view modes: 'passport' | 'match' | 'growth' | 'roster' (plus 'logger' | 'assessment' for coach)
  const [currentView, setCurrentView] = useState(() => {
    const role = localStorage.getItem('ballr_user_role') || 'public';
    return role === 'coach' ? 'roster' : 'passport';
  });
  
  // Modal & Toast states
  const [activeClip, setActiveClip] = useState(null);
  const [isStoryCardOpen, setIsStoryCardOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  // Fetch live data from Supabase on mount
  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setIsLoadingLive(true);
      try {
        const livePlayers = await fetchLiveRosterFromSupabase();
        if (isSubscribed && livePlayers && livePlayers.length > 0) {
          setPlayers(livePlayers);

          const dimas = livePlayers.find(
            (p) => p.personal_info.full_name.includes('Dimas') || p.personal_info.jersey_number === 10
          );
          if (dimas) {
            setSelectedPlayerId(dimas.player_id);
          } else {
            setSelectedPlayerId(livePlayers[0].player_id);
          }

          setToastInfo({
            title: "Database Supabase Terhubung",
            subtext: `Berhasil memuat ${livePlayers.length} pemain live dari tabel players, assessments, fitness, dan video_highlights.`
          });
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
        if (isSubscribed) {
          setToastInfo({
            title: "Menggunakan Cadangan Data Offline",
            subtext: "Gagal terhubung ke Supabase, sistem menggunakan fallback mock data lokal."
          });
        }
      } finally {
        if (isSubscribed) {
          setIsLoadingLive(false);
        }
      }
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const activePlayer = players.find((p) => p.player_id === selectedPlayerId) || players[0];
  const teammates = players.filter((p) => p.player_id !== activePlayer.player_id);

  // PIN Unlock & Lock Handlers
  const handleOpenPinModal = (target = 'assessment') => {
    setPendingTargetView(target);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = (targetView) => {
    setUserRole('coach');
    localStorage.setItem('ballr_user_role', 'coach');
    setIsPinModalOpen(false);
    if (targetView) setCurrentView(targetView);
    setToastInfo({
      title: "Sesi Pelatih Terverifikasi",
      subtext: "Mode Coach Logger & Squad Hub aktif untuk sesi latihan."
    });
  };

  const handleLockCoachSession = () => {
    setUserRole('public');
    localStorage.setItem('ballr_user_role', 'public');
    setCurrentView('passport');
    setToastInfo({
      title: "Sesi Pelatih Dikunci",
      subtext: "Aplikasi kembali ke Mode Publik (Talent Passport)."
    });
  };

  // Safe view switcher with role protection
  const handleSwitchView = (view) => {
    if (userRole === 'public' && (view === 'assessment' || view === 'logger')) {
      handleOpenPinModal(view);
      return;
    }
    setCurrentView(view);
  };

  // Share / Export handler (opens 9:16 Story Flex Card Modal)
  const handleOpenShare = () => {
    setIsStoryCardOpen(true);
  };

  const handleViewPassport = (playerId) => {
    setSelectedPlayerId(playerId);
    setCurrentView('passport');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEvaluatePlayer = (playerId) => {
    setSelectedPlayerId(playerId);
    if (userRole === 'public') {
      handleOpenPinModal('assessment');
    } else {
      setCurrentView('assessment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Live Write Mutation: Upsert assessment & update player's ovr_rating in Supabase
  const handleSaveAssessment = async (updatedPlayerData) => {
    try {
      const savedRecord = await saveAssessmentToSupabase(
        updatedPlayerData.player_id,
        updatedPlayerData,
        updatedPlayerData.personal_info.overall_rating,
        updatedPlayerData.db_assessment_id
      );

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.player_id === updatedPlayerData.player_id) {
            return {
              ...updatedPlayerData,
              db_assessment_id: savedRecord?.id || p.db_assessment_id
            };
          }
          return p;
        })
      );

      setToastInfo({
        title: "Data Berhasil Disimpan ke Supabase",
        subtext: `Tabel player_assessments dan ovr_rating (${updatedPlayerData.personal_info.overall_rating}) ${updatedPlayerData.personal_info.full_name} berhasil diperbarui.`
      });

      setCurrentView('passport');
    } catch (err) {
      console.error('Supabase save error:', err);
      setPlayers((prev) =>
        prev.map((p) => (p.player_id === updatedPlayerData.player_id ? updatedPlayerData : p))
      );
      setToastInfo({
        title: "Perubahan Disimpan Lokal",
        subtext: "Gagal menyimpan ke server Supabase, disimpan di memori sesi aktif."
      });
      setCurrentView('passport');
    }
  };

  // Live Write Mutation: Edge-AI camera recorded fitness test insert
  const handleSaveFitnessRecord = async (playerId, testResult) => {
    try {
      const fitnessPayload = {
        [testResult.type]: testResult.numericValue,
        test_date: new Date().toISOString().split('T')[0]
      };

      await insertFitnessRecordToSupabase(playerId, fitnessPayload);

      setToastInfo({
        title: "Hasil Uji Fisik Tersimpan ke Supabase",
        subtext: `Rekor ${testResult.metricName}: ${testResult.scoreDisplay} berhasil di-insert ke tabel fitness_records.`
      });
    } catch (err) {
      console.error('Fitness insert error:', err);
    }
  };

  // Live Match Sync Handler from Fast Pitch Logger
  const handleFinishMatch = (matchSummary) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.player_id === matchSummary.playerId) {
          return {
            ...p,
            latest_match_summary: matchSummary
          };
        }
        return p;
      })
    );
    setSelectedPlayerId(matchSummary.playerId);
    setCurrentView('match');
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-white flex flex-col items-center justify-start pb-12 selection:bg-[#CCFF00] selection:text-black">
      
      {/* Offline Connectivity Status Indicator */}
      <OfflineIndicator />

      {/* 1. Top Navigation & Role Guard Switcher */}
      <TopNav
        academy={activePlayer.personal_info.academy}
        currentView={currentView}
        userRole={userRole}
        onSwitchView={handleSwitchView}
        onOpenPinModal={handleOpenPinModal}
        onLockCoachSession={handleLockCoachSession}
        onShare={handleOpenShare}
        verifiedText={`Verified by ${activePlayer.personal_info.academy.name}`}
      />

      {/* Main Centered Container */}
      <main className="w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* Sleek Loading Skeleton while initial fetching */}
        {isLoadingLive ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* VIEW 1: SQUAD HUB & ROSTER EXPLORER (Only accessible to coach or preview) */}
            {currentView === 'roster' && (
              <SquadHubView
                players={players}
                userRole={userRole}
                onViewPassport={handleViewPassport}
                onEvaluatePlayer={handleEvaluatePlayer}
              />
            )}

            {/* VIEW 2: COACH ASSESSMENT MODE (Protected view) */}
            {currentView === 'assessment' && (
              <CoachAssessmentView
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
                onSaveAssessment={handleSaveAssessment}
                onSaveFitnessRecord={handleSaveFitnessRecord}
                onSwitchToPassport={() => setCurrentView('passport')}
                onFinishMatch={handleFinishMatch}
                onToast={(t) => setToastInfo(t)}
              />
            )}

            {/* VIEW 3: FAST PITCH EVENT LOGGER (Sideline Touchpad) */}
            {currentView === 'logger' && (
              <FastPitchLogger
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
                onFinishMatch={handleFinishMatch}
                onToast={(t) => setToastInfo(t)}
              />
            )}

            {/* VIEW 4: DIGITAL YOUTH TALENT PASSPORT */}
            {currentView === 'passport' && (
              <div className="space-y-5 sm:space-y-6 animate-fadeIn">
                <PlayerHeader
                  personalInfo={activePlayer.personal_info}
                  onOpenStoryCard={handleOpenShare}
                />
                <PerformanceRadar
                  attributes={activePlayer.radar_attributes}
                  athleteName={activePlayer.personal_info.full_name}
                  teammates={teammates}
                />
                <FitnessStrip benchmarks={activePlayer.fitness_benchmarks} />
                <AICoachCard evaluation={activePlayer.ai_coach_evaluation} />
                <OfficialDossierFooter
                  player={activePlayer}
                  onOpenStoryCard={handleOpenShare}
                  onToast={(t) => setToastInfo(t)}
                />
              </div>
            )}

            {/* VIEW 5: MATCH ANALYTICS & SCIENTIFIC INTELLIGENCE */}
            {currentView === 'match' && (
              <div className="space-y-5 sm:space-y-6 animate-fadeIn">
                <PlayerHeader
                  personalInfo={activePlayer.personal_info}
                  onOpenStoryCard={handleOpenShare}
                />
                <InteractiveMatchHub
                  player={activePlayer}
                  onShareClip={(clip) => setActiveClip(clip)}
                  onToast={(t) => setToastInfo(t)}
                />
                <OfficialDossierFooter
                  player={activePlayer}
                  onOpenStoryCard={handleOpenShare}
                  onToast={(t) => setToastInfo(t)}
                />
              </div>
            )}

            {/* VIEW 6: PLAYER GROWTH & BIO-BANDING TRAJECTORY */}
            {currentView === 'growth' && (
              <div className="space-y-5 sm:space-y-6 animate-fadeIn">
                <PlayerHeader
                  personalInfo={activePlayer.personal_info}
                  onOpenStoryCard={handleOpenShare}
                />
                <GrowthBioBandingTab player={activePlayer} />
                <OfficialDossierFooter
                  player={activePlayer}
                  onOpenStoryCard={handleOpenShare}
                  onToast={(t) => setToastInfo(t)}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* 9:16 Vertical Video Player Modal */}
      {activeClip && (
        <VideoModal
          clip={activeClip}
          moments={activePlayer.verified_moments}
          playerInfo={activePlayer.personal_info}
          onClose={() => setActiveClip(null)}
          onSelectClip={(c) => setActiveClip(c)}
        />
      )}

      {/* 9:16 Story Flex Card Generator Modal */}
      {isStoryCardOpen && (
        <StoryFlexCardModal
          player={activePlayer}
          onClose={() => setIsStoryCardOpen(false)}
          onToast={(t) => setToastInfo(t)}
        />
      )}

      {/* Coach Quick-PIN Security Modal */}
      {isPinModalOpen && (
        <PinAuthModal
          targetView={pendingTargetView}
          onSuccess={handlePinSuccess}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastInfo && (
        <Toast
          message={toastInfo.title}
          subtext={toastInfo.subtext}
          onClose={() => setToastInfo(null)}
        />
      )}

      {/* PWA Mobile Install Banner */}
      <InstallAppBanner />
    </div>
  );
}
