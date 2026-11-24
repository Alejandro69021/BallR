import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { PlayersProvider } from './context/PlayersContext';
import { usePlayers } from './hooks/usePlayers';
import { signOutUser, getCurrentUserProfile, supabase } from './lib/supabase';
import { LAYOUT_OPT_OUT_ROUTES } from './routes';
import PageContainer from './components/ux/PageContainer';

import TopNav from './components/TopNav';
import StoryFlexCardModal from './components/StoryFlexCardModal';
import AuthModal from './components/auth/AuthModal';
import Toast from './components/ui/Toast';
import InstallAppBanner from './components/InstallAppBanner';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingSkeleton from './components/LoadingSkeleton';
import VerificationView from './components/VerificationView';
import Surface from './components/ui/Surface';

import PassportPage from './pages/PassportPage';
import GrowthPage from './pages/GrowthPage';
import SquadPage from './pages/SquadPage';
import AssessmentPage from './pages/AssessmentPage';
import LoggerPage from './pages/LoggerPage';
import ReferencesPage from './pages/ReferencesPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import TacticsPage from './pages/TacticsPage';
import TacticsDetailPage from './pages/TacticsDetailPage';
import MatchReportPage from './pages/MatchReportPage';
import GuidePage from './pages/GuidePage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';

function HomeRedirect({ userRole, onOpenAuthModal, onToast }) {
  const { players, loading, error, isDemoMode } = usePlayers();

  if (userRole === 'coach' || userRole === 'admin') {
    return (
      <HomePage
        userRole={userRole}
        onOpenAuthModal={onOpenAuthModal}
        onToast={onToast}
      />
    );
  }

  if (loading) return <LoadingSkeleton />;

  if (error && !isDemoMode) {
    return (
      <div className="p-8 text-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 max-w-lg mx-auto mt-8">
        <p className="text-sm font-semibold text-1">Koneksi Database Supabase Tidak Tersedia</p>
        <p className="text-sm text-2 leading-relaxed">{error}</p>
        <p className="text-sm text-2 pt-2 border-t border-rose-500/20">
          Atur <code className="text-rose-200">VITE_SUPABASE_URL</code> dan <code className="text-rose-200">VITE_SUPABASE_ANON_KEY</code> di berkas <code className="text-rose-200">.env</code>, atau jalankan dengan <code className="text-rose-200">VITE_DEMO_MODE=true</code>.
        </p>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-panel border border-line text-2 max-w-md mx-auto mt-8">
        <p className="text-sm">Tidak ada data pemain yang ditemukan.</p>
      </div>
    );
  }

  const defaultPlayer = players.find(
    (p) => p.personal_info?.full_name?.includes('Dimas') || p.personal_info?.jersey_number === 10
  ) || players[0];

  const targetId = defaultPlayer?.public_id || defaultPlayer?.player_id || 'PLAYER-01';
  return <Navigate to={`/pemain/${targetId}`} replace />;
}

function SharedCoachLayout() {
  return (
    <PageContainer as="main" className="pt-4 sm:pt-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6 space-y-4 sm:space-y-6">
      <Outlet />
    </PageContainer>
  );
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
  const [isStoryCardOpen, setIsStoryCardOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  // Theme preference persisted in localStorage ('paper' | 'dark').
  // Default is light "paper" surface for coach/admin and entire app per UX_SPEC.
  const [themePreference, setThemePreference] = useState(() => {
    try {
      const saved = localStorage.getItem('ballr_surface') || localStorage.getItem('ballr_theme');
      if (saved === 'dark' || saved === 'paper') return saved;
    } catch {
      // ignore
    }
    return 'paper';
  });

  const handleToggleSurface = (nextSurface) => {
    const target = nextSurface || (themePreference === 'paper' ? 'dark' : 'paper');
    setThemePreference(target);
    try {
      localStorage.setItem('ballr_surface', target);
      localStorage.setItem('ballr_theme', target);
    } catch {
      // ignore
    }
  };

  // Surface derived from user preference, keeping mandatory paper for reports, verification, and landing
  const surface = useMemo(() => {
    const p = location.pathname;
    if (p === '/' || p === '/privasi') return 'paper';
    // Report/print behaviour must not change: always paper
    if (p.startsWith('/verifikasi/')) return 'paper';
    if (p === '/rujukan') return 'paper';
    if (p.includes('/laporan')) return 'paper';

    return themePreference;
  }, [location.pathname, themePreference]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-surface', surface);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', surface === 'dark' ? 'rgb(11, 15, 20)' : 'rgb(245, 246, 242)');
      }
      const metaBg = document.querySelector('meta[name="background-color"]');
      if (metaBg) {
        metaBg.setAttribute('content', surface === 'dark' ? 'rgb(11, 15, 20)' : 'rgb(245, 246, 242)');
      }
    }
  }, [surface]);

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
    if (p === '/beranda') return (userRole === 'coach' || userRole === 'admin') ? 'home' : 'passport';
    if (p === '/') return 'landing';
    if (p.startsWith('/pemain/') && p.includes('/laga')) return 'match';
    if (p.startsWith('/pemain/') && p.includes('/pertumbuhan')) return 'growth';
    if (p.startsWith('/pemain/')) return 'passport';
    if (p.startsWith('/skuad')) return 'roster';
    if (p.startsWith('/laga')) return 'matches';
    if (p.startsWith('/taktik')) return 'tactics';
    if (p.startsWith('/pencatatan')) return 'matches';
    if (p.startsWith('/penilaian')) return 'assessment';
    if (p === '/bantuan') return 'help';
    return (userRole === 'coach' || userRole === 'admin') ? 'home' : 'passport';
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
      const mid = targetStr.split(':')[1];
      if (mid) {
        navigate(`/pencatatan/${mid}`);
      } else {
        navigate('/laga');
      }
    } else if (targetStr === 'assessment') {
      const pid = activePlayer.player_id || activePlayer.public_id || 'PLAYER-01';
      navigate(`/penilaian/${pid}`);
    } else if (targetStr === 'logger') {
      navigate('/laga');
    } else if (targetStr === 'tactics') {
      navigate('/taktik');
    } else if (targetStr === 'roster') {
      navigate('/skuad');
    } else if (targetStr === 'home') {
      navigate('/beranda');
    } else {
      navigate('/beranda');
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

    if (userRole !== 'coach' && userRole !== 'admin' && (view === 'assessment' || view === 'logger' || view === 'tactics')) {
      handleOpenAuthModal(view);
      return;
    }

    switch (view) {
      case 'home':
        navigate('/beranda');
        break;
      case 'passport':
        navigate(`/pemain/${currentId}`);
        break;
      case 'match':
        navigate('/laga');
        break;
      case 'growth':
        navigate(`/pemain/${currentId}/pertumbuhan`);
        break;
      case 'roster':
        navigate('/skuad');
        break;
      case 'matches':
        navigate('/laga');
        break;
      case 'tactics':
        navigate('/taktik');
        break;
      case 'logger':
        navigate('/laga');
        break;
      case 'help':
        navigate('/bantuan');
        break;
      case 'assessment':
        navigate(`/penilaian/${activePlayer.player_id || currentId}`);
        break;
      default:
        navigate('/beranda');
    }
  };

  const isLanding = location.pathname === '/' || location.pathname === '/privasi';

  return (
    <Surface surface={surface} className="min-h-screen flex flex-col items-center justify-start pb-12 selection:bg-brand selection:text-app">
      <OfflineIndicator />

      {!isLanding && (
        <TopNav
          academy={activePlayer.personal_info?.academy}
          currentView={currentView}
          userRole={userRole}
          isDemoMode={isDemoMode}
          surface={surface}
          onToggleSurface={handleToggleSurface}
          onSwitchView={handleSwitchView}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onShare={() => setIsStoryCardOpen(true)}
          verifiedText={activePlayer.personal_info?.academy?.name}
        />
      )}

      {/* Visible demo indicator banner whenever demo mode is on (hidden on landing) */}
      {!isLanding && isDemoMode && (
        <div data-testid="demo-banner" className="w-full bg-warn-bg border-b border-warn-ink/20 py-1.5 px-4 text-center">
          <span className="text-sm font-semibold text-warn-ink inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-warn-ink"></span>
            Mode contoh: semua data di sini fiktif
          </span>
        </div>
      )}

      {/* Global Error Banner when not in demo mode and Supabase fails */}
      {!isLanding && error && !isDemoMode && (
        <div className="w-full max-w-5xl px-3.5 sm:px-6 pt-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <strong className="font-semibold">Koneksi Supabase Gagal:</strong> {error}. Mode demo dimatikan; data mock tidak digunakan.
            </div>
          </div>
        </div>
      )}

      <Routes>
        {/* Shared Coach & Admin PageContainer Layout */}
        <Route element={<SharedCoachLayout />}>
          <Route
            path="/beranda"
            element={
              <HomeRedirect
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/pemain/:publicId"
            element={
              <PassportPage
                userRole={userRole}
                onOpenShare={() => setIsStoryCardOpen(true)}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route path="/pemain/:publicId/laga" element={<Navigate to="/laga" replace />} />
          <Route path="/pemain/:publicId/laga/:matchId" element={<Navigate to="/laga" replace />} />
          <Route
            path="/pemain/:publicId/pertumbuhan"
            element={
              <GrowthPage
                userRole={userRole}
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
          <Route path="/pencatatan" element={<Navigate to="/laga" replace />} />
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
            path="/laga"
            element={
              <MatchesPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/laga/:matchId"
            element={
              <MatchDetailPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/taktik"
            element={
              <TacticsPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route
            path="/taktik/:id"
            element={
              <TacticsDetailPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            }
          />
          <Route path="/rujukan" element={<ReferencesPage />} />
          <Route path="/bantuan" element={<GuidePage />} />
        </Route>

        {/* Explicit Layout Opt-Out Routes (Public Landing, Privacy, A4 report & verification) */}
        <Route
          path="/"
          element={
            <LandingPage
              userRole={userRole}
              isDemoMode={isDemoMode}
              onOpenAuthModal={handleOpenAuthModal}
            />
          }
        />
        <Route path="/privasi" element={<PrivacyPage />} />
        <Route
          path="/laga/:matchId/laporan"
          element={
            <main className="w-full pt-4 sm:pt-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
              <MatchReportPage
                userRole={userRole}
                onOpenAuthModal={handleOpenAuthModal}
                onToast={(t) => setToastInfo(t)}
              />
            </main>
          }
        />
        <Route
          path="/verifikasi/:hash"
          element={
            <main className="w-full pt-4 sm:pt-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
              <VerificationView players={players} />
            </main>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
