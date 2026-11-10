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
import VideoModal from './components/VideoModal';
import CoachAssessmentView from './components/CoachAssessmentView';
import StoryFlexCardModal from './components/StoryFlexCardModal';
import PinAuthModal from './components/PinAuthModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import Toast from './components/Toast';
import InstallAppBanner from './components/InstallAppBanner';
import OfflineIndicator from './components/OfflineIndicator';
import { ShieldCheck, Download, Edit3, ArrowLeft, Sparkles, Lock, Unlock, Zap, Film, TrendingUp } from 'lucide-react';

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
  
  // 3 view modes: 'roster' | 'passport' | 'assessment'
  const [currentView, setCurrentView] = useState(() => {
    const role = localStorage.getItem('ballr_user_role') || 'public';
    return role === 'coach' ? 'roster' : 'passport';
  });

  // Talent Passport Sub-Tabs: 'overview' | 'video' | 'growth'
  const [passportTab, setPassportTab] = useState('overview');
  
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
            title: "Database Terhubung ke Supabase! 🟢",
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
      title: "Sesi Pelatih Terverifikasi! 🔓",
      subtext: "Mode Coach Logger & Squad Hub aktif untuk sesi latihan."
    });
  };

  const handleLockCoachSession = () => {
    setUserRole('public');
    localStorage.setItem('ballr_user_role', 'public');
    setCurrentView('passport');
    setToastInfo({
      title: "Sesi Pelatih Dikunci 🔒",
      subtext: "Aplikasi kembali ke Mode Publik (Talent Passport)."
    });
  };

  // Safe view switcher with role protection
  const handleSwitchView = (view) => {
    if (userRole === 'public' && (view === 'assessment' || view === 'roster')) {
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
        title: "Tersimpan ke Supabase Live! 🚀",
        subtext: `Tabel player_assessments dan ovr_rating (${updatedPlayerData.personal_info.overall_rating}) ${updatedPlayerData.personal_info.full_name} berhasil diperbarui.`
      });

      setCurrentView('passport');
    } catch (err) {
      console.error('Supabase save error:', err);
      setPlayers((prev) =>
        prev.map((p) => (p.player_id === updatedPlayerData.player_id ? updatedPlayerData : p))
      );
      setToastInfo({
        title: "Perubahan Disimpan Lokal ⚠️",
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
        title: "Hasil Kamera Edge-AI Masuk Supabase! 🎯",
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
    setCurrentView('passport');
    setPassportTab('video');
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

            {/* VIEW 3: DIGITAL YOUTH TALENT PASSPORT (100% interactive for Public & Coach) */}
            {currentView === 'passport' && (
              <>
                {/* Header Action Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-[#1F2937] text-xs">
                  {userRole === 'coach' ? (
                    <button
                      onClick={() => setCurrentView('roster')}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-[#CCFF00] font-semibold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#CCFF00]" />
                      <span>Kembali ke Squad Roster</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Public Viewer Mode (Scouts & Parents)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenShare}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-500/15 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-black border border-[#CCFF00]/40 font-athletic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Story Flex Card</span>
                    </button>

                    {/* Only show evaluate action if coach */}
                    {userRole === 'coach' ? (
                      <button
                        onClick={() => setCurrentView('assessment')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#090D16] hover:bg-[#1F2937] border border-slate-700 text-slate-300 hover:text-white font-athletic font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Evaluasi</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenPinModal('assessment')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#090D16] hover:bg-[#1F2937] border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                        title="Buka akses pelatih"
                      >
                        <Lock className="w-3 h-3 text-[#CCFF00]" />
                        <span>Coach Login</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Player Identity Header Card */}
                <PlayerHeader
                  personalInfo={activePlayer.personal_info}
                  onOpenStoryCard={handleOpenShare}
                />

                {/* Passport Sub-Tab Navigation Bar */}
                <div className="flex items-center gap-1.5 p-1.5 bg-[#111827] border border-[#1F2937] rounded-2xl overflow-x-auto shadow-md">
                  <button
                    type="button"
                    onClick={() => setPassportTab('overview')}
                    className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      passportTab === 'overview'
                        ? 'bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>⚡ Overview & Radar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassportTab('video')}
                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      passportTab === 'video'
                        ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>🎥 Match Video Reel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassportTab('growth')}
                    className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      passportTab === 'growth'
                        ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>📈 Growth & Bio-Banding</span>
                  </button>
                </div>

                {/* Sub-Tab 1: OVERVIEW & RADAR */}
                {passportTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                    {/* 3. Performance Attributes (Radar Chart with Teammate Comparison & Stats) */}
                    <PerformanceRadar
                      attributes={activePlayer.radar_attributes}
                      athleteName={activePlayer.personal_info.full_name}
                      teammates={teammates}
                    />

                    {/* 4. Physical Fitness Test Strip */}
                    <FitnessStrip benchmarks={activePlayer.fitness_benchmarks} />

                    {/* 5. AI Coach Evaluation Card */}
                    <AICoachCard evaluation={activePlayer.ai_coach_evaluation} />
                  </div>
                )}

                {/* Sub-Tab 2: MATCH VIDEO REEL */}
                {passportTab === 'video' && (
                  <div className="animate-fadeIn">
                    {/* 6. Interactive Video Match Reel & Performance Hub (Video-to-Stat Synced) */}
                    <InteractiveMatchHub
                      player={activePlayer}
                      onShareClip={(clip) => setActiveClip(clip)}
                      onToast={(t) => setToastInfo(t)}
                    />
                  </div>
                )}

                {/* Sub-Tab 3: GROWTH & BIO-BANDING TRAJECTORY */}
                {passportTab === 'growth' && (
                  <div className="animate-fadeIn">
                    {/* 7. Player Growth & Bio-Banding Trajectory */}
                    <GrowthBioBandingTab player={activePlayer} />
                  </div>
                )}

                {/* Passport Footer Meta */}
                <footer className="mt-8 p-4 rounded-2xl bg-[#111827]/70 border border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                    <span>
                      ID Paspor: <strong className="text-slate-200 font-mono">{activePlayer.player_id}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>{activePlayer.personal_info.academy.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenShare}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#CCFF00] hover:text-black border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
                      <span>9:16 Story Card</span>
                    </button>

                    <button
                      onClick={handlePrintDossier}
                      className="px-3.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-[#1F2937] border border-[#1F2937] hover:border-[#CCFF00]/40 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#CCFF00]" />
                      <span>Cetak Dossier</span>
                    </button>
                  </div>
                </footer>
              </>
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
