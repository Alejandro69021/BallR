import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { PlayersProvider } from './context/PlayersContext';
import { usePlayers } from './hooks/usePlayers';
import { signOutUser, getCurrentUserProfile, supabase } from './lib/supabase';

import TopNav from './components/TopNav';
import VideoModal from './components/VideoModal';
import StoryFlexCardModal from './components/StoryFlexCardModal';
import AuthModal from './components/auth/AuthModal';
import Toast from './components/ui/Toast';
import InstallAppBanner from './components/InstallAppBanner';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingSkeleton from './components/LoadingSkeleton';
import VerificationView from './components/VerificationView';
import Surface from './components/ui/Surface';

import PassportPage from './pages/PassportPage';
import MatchAnalysisPage from './pages/MatchAnalysisPage';
import GrowthPage from './pages/GrowthPage';
import SquadPage from './pages/SquadPage';
import AssessmentPage from './pages/AssessmentPage';
import LoggerPage from './pages/LoggerPage';
import ReferencesPage from './pages/ReferencesPage';

function HomeRedirect({ userRole }) {
  const { players, loading, error, isDemoMode } = usePlayers();

  if (loading) return <LoadingSkeleton />;

  if (error && !isDemoMode) {
    return (
      <div className="p-8 text-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 max-w-lg mx-auto mt-8">
        <p className="text-sm font-semibold text-white">Koneksi Database Supabase Tidak Tersedia</p>
        <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
        <p className="text-xs text-slate-400 pt-2 border-t border-rose-500/20">
          Atur <code className="text-rose-200">VITE_SUPABASE_URL</code> dan <code className="text-rose-200">VITE_SUPABASE_ANON_KEY</code> di berkas <code className="text-rose-200">.env</code>, atau jalankan dengan <code className="text-rose-200">VITE_DEMO_MODE=true</code>.
        </p>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-[#0C111D] border border-slate-800 text-slate-400 max-w-md mx-auto mt-8">
        <p className="text-sm">Tidak ada data pemain yang ditemukan.</p>
      </div>
    );
  }

  if (userRole === 'coach' || userRole === 'admin') {
    return <Navigate to="/skuad" replace />;
  }

  const defaultPlayer = players.find(
    (p) => p.personal_info?.full_name?.includes('Dimas') || p.personal_info?.jersey_number === 10
  ) || players[0];

  const targetId = defaultPlayer?.public_id || defaultPlayer?.player_id || 'PLAYER-01';
  return <Navigate to={`/pemain/${targetId}`} replace />;
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { players, isDemoMode, error } = usePlayers();

  // Role state: 'public' | 'coach' | 'parent' | 'admin'
  // In demo mode: fixed demo role 'coach' is allowed (clearly labelled "Mode demo").
  // In real mode: starts at 'public', and is loaded from authenticated user profile in public.profiles.
  const [userRole, setUserRole] = useState(() => (isDemoMode ? 'coach' : 'public'));

  useEffect(() => {
    if (isDemoMode) {
      setUserRole('coach');
      return;
    }

    let isMounted = true;
    getCurrentUserProfile()
      .then((profile) => {
        if (isMounted) {
          setUserRole(profile?.role || 'public');
        }
      })
      .catch(() => {
        if (isMounted) setUserRole('public');
      });

    const { data: authListener } = supabase?.auth?.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const p = await getCurrentUserProfile();
        if (isMounted) setUserRole(p?.role || 'public');
      } else {
        if (isMounted) setUserRole('public');
      }
    }) || { data: { subscription: null } };

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [isDemoMode]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingTargetView, setPendingTargetView] = useState('assessment');

  // Modal & Toast states
  const [activeClip, setActiveClip] = useState(null);
  const [isStoryCardOpen, setIsStoryCardOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  // Active player derived from URL or roster fallback
  const surface = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/verifikasi/')) return 'paper';
    if (p === '/rujukan') return 'paper';
    if (p.startsWith('/pemain/') && (p.includes('/laga') || p.includes('/pertumbuhan'))) {
      return 'dark';
    }
    if (p.startsWith('/pemain/')) return 'paper';
    return 'dark';
  }, [location.pathname]);

  const activePlayer = useMemo(() => {
    if (!players || players.length === 0) {
      return {
        player_id: 'default',
        public_id: 'PLAYER-DEFAULT',
        personal_info: {
          full_name: 'Atlet Muda',
          nickname: 'Atlet',
          jersey_number: 10,
          position: 'Pemain',
          academy: {
            name: 'Akademi Sepakbola',
            city: 'Indonesia',
            logo_url: ''
          }
        },
        verified_moments: []
      };
    }
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'pemain' && pathParts[2]) {
      const match = players.find((p) => p.public_id === pathParts[2] || p.player_id === pathParts[2]);
      if (match) return match;
    }
    if (pathParts[1] === 'penilaian' && pathParts[2]) {
      const match = players.find((p) => p.player_id === pathParts[2] || p.public_id === pathParts[2]);
      if (match) return match;
    }
    return players[0];
  }, [players, location.pathname]);

  // Derive currentView from location pathname for TopNav active tab highlight
  const currentView = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/pemain/') && p.includes('/laga')) return 'match';
    if (p.startsWith('/pemain/') && p.includes('/pertumbuhan')) return 'growth';
    if (p.startsWith('/pemain/')) return 'passport';
    if (p.startsWith('/skuad')) return 'roster';
    if (p.startsWith('/pencatatan')) return 'logger';
    if (p.startsWith('/penilaian')) return 'assessment';
    return (userRole === 'coach' || userRole === 'admin') ? 'roster' : 'passport';
  }, [location.pathname, userRole]);

  const handleOpenAuthModal = (target = 'assessment') => {
    setPendingTargetView(target);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (role, target) => {
    const assignedRole = role || 'public';
    setUserRole(assignedRole);
    setIsAuthModalOpen(false);

    setToastInfo({
      title: assignedRole === 'coach' ? "Sesi Pelatih Terverifikasi" : assignedRole === 'parent' ? "Sesi Wali Terverifikasi" : "Sesi Terverifikasi",
      subtext: isDemoMode ? `Masuk sebagai peran: ${assignedRole} (Mode demo).` : `Masuk sebagai peran: ${assignedRole}.`
    });

    const targetStr = typeof target === 'string' ? target : pendingTargetView;
    if (targetStr.startsWith('assessment:')) {
      const pid = targetStr.split(':')[1];
      navigate(`/penilaian/${pid}`);
    } else if (targetStr.startsWith('logger:')) {
      const mid = targetStr.split(':')[1] || 'match-01';
      navigate(`/pencatatan/${mid}`);
    } else if (targetStr === 'assessment') {
      const pid = activePlayer.player_id || activePlayer.public_id || 'PLAYER-01';
      navigate(`/penilaian/${pid}`);
    } else if (targetStr === 'logger') {
      navigate('/pencatatan/match-01');
    } else if (targetStr === 'roster') {
      navigate('/skuad');
    }
  };

  const handleLogout = async () => {
    if (!isDemoMode) {
      await signOutUser();
    }
    setUserRole('public');
    const targetId = activePlayer.public_id || activePlayer.player_id || 'PLAYER-01';
    navigate(`/pemain/${targetId}`);
    setToastInfo({
      title: "Sesi Keluar",
      subtext: "Aplikasi kembali ke Mode Publik (Talent Passport)."
    });
  };

  const handleSwitchView = (view) => {
    const currentId = activePlayer.public_id || activePlayer.player_id || 'PLAYER-01';

    if (userRole !== 'coach' && userRole !== 'admin' && (view === 'assessment' || view === 'logger')) {
      handleOpenAuthModal(view);
      return;
    }

    switch (view) {
      case 'passport':
        navigate(`/pemain/${currentId}`);
        break;
      case 'match':
        navigate(`/pemain/${currentId}/laga/match-01`);
        break;
      case 'growth':
        navigate(`/pemain/${currentId}/pertumbuhan`);
        break;
      case 'roster':
        navigate('/skuad');
        break;
      case 'logger':
        navigate('/pencatatan/match-01');
        break;
      case 'assessment':
        navigate(`/penilaian/${activePlayer.player_id || currentId}`);
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Surface surface={surface} className="min-h-screen flex flex-col items-center justify-start pb-12 selection:bg-brand selection:text-app">
      <OfflineIndicator />

      <TopNav
        academy={activePlayer.personal_info?.academy}
        currentView={currentView}
        userRole={userRole}
        isDemoMode={isDemoMode}
        onSwitchView={handleSwitchView}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        onShare={() => setIsStoryCardOpen(true)}
        verifiedText={activePlayer.personal_info?.academy?.name}
      />

      {/* 3d. Visible "Data contoh" badge whenever demo mode is on */}
      {isDemoMode && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 text-center">
          <span className="text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            Data contoh — Mode demo aktif
          </span>
        </div>
      )}

      {/* Global Error Banner when not in demo mode and Supabase fails */}
      {error && !isDemoMode && (
        <div className="w-full max-w-5xl px-3.5 sm:px-6 pt-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <strong className="font-semibold">Koneksi Supabase Gagal:</strong> {error}. Mode demo dimatikan; data mock tidak digunakan.
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl px-3.5 sm:px-6 pt-4 sm:pt-6 pb-20 md:pb-6 space-y-4 sm:space-y-6">
        <Routes>
          <Route path="/" element={<HomeRedirect userRole={userRole} />} />
          <Route
            path="/pemain/:publicId"
            element={
              <PassportPage
                onOpenShare={() => setIsStoryCardOpen(true)}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/pemain/:publicId/laga"
            element={
              <MatchAnalysisPage
                onOpenShare={() => setIsStoryCardOpen(true)}
                onShareClip={(clip) => setActiveClip(clip)}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/pemain/:publicId/laga/:matchId"
            element={
              <MatchAnalysisPage
                onOpenShare={() => setIsStoryCardOpen(true)}
                onShareClip={(clip) => setActiveClip(clip)}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/pemain/:publicId/pertumbuhan"
            element={
              <GrowthPage
                onOpenShare={() => setIsStoryCardOpen(true)}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/skuad"
            element={
              <SquadPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
              />
            }
          />
          <Route
            path="/penilaian/:playerId"
            element={
              <AssessmentPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/pencatatan/:matchId"
            element={
              <LoggerPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/verifikasi/:hash"
            element={<VerificationView players={players} />}
          />
          <Route path="/rujukan" element={<ReferencesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 9:16 Vertical Video Player Modal */}
      {activeClip && (
        <VideoModal
          clip={activeClip}
          moments={activePlayer.verified_moments || []}
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

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onSuccess={handleAuthSuccess}
        onClose={() => setIsAuthModalOpen(false)}
        targetView={pendingTargetView}
        isDemoMode={isDemoMode}
      />

      {/* Toast Notification */}
      {toastInfo && (
        <Toast
          message={toastInfo.title}
          subtext={toastInfo.subtext}
          onClose={() => setToastInfo(null)}
        />
      )}

      <InstallAppBanner />
    </Surface>
  );
}

export default function App() {
  return (
    <PlayersProvider>
      <MainApp />
    </PlayersProvider>
  );
}
