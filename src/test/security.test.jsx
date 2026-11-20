import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import AuthModal from '../components/auth/AuthModal';
import * as supabaseLib from '../lib/supabase';
import { fetchPublicPlayersFromViews, fetchLiveRosterFromSupabase, fetchPassportSnapshot, fetchPlayerByToken } from '../lib/supabase';
import VaepScorecard from '../components/analytics/VaepScorecard';
import CameraFeed from '../components/scanner/CameraFeed';
import FitnessStrip from '../components/FitnessStrip';
import PlayerHeader from '../components/PlayerHeader';
import BioMaturityCard from '../components/growth/BioMaturityCard';
import MatchMoments from '../components/MatchMoments';
import TacticalAnalyticsHub from '../components/TacticalAnalyticsHub';
import TopNav from '../components/TopNav';

describe('Security Hardening & Privacy Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('(i) No localStorage role is read', () => {
    it('never reads ballr_user_role from localStorage on app render', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      const roleCalls = getItemSpy.mock.calls.filter(([key]) => key === 'ballr_user_role');
      expect(roleCalls.length).toBe(0);
    });

    it('displays demo mode badge and demo role indicator when in demo mode', () => {
      const mockAcademy = { name: 'Mataram Putra FA', city: 'Yogyakarta' };

      render(
        <TopNav
          academy={mockAcademy}
          currentView="roster"
          userRole="coach"
          isDemoMode={true}
          onSwitchView={() => {}}
          onOpenAuthModal={() => {}}
          onLogout={() => {}}
          onShare={() => {}}
        />
      );

      // TopNav shows "Data contoh" badge
      const demoBadges = screen.getAllByText(/Data contoh/i);
      expect(demoBadges.length).toBeGreaterThan(0);

      // Role is labelled Mode demo
      const modeDemoLabels = screen.getAllByText(/Mode demo/i);
      expect(modeDemoLabels.length).toBeGreaterThan(0);
    });
  });

  describe('(ii) Public pages never request private columns', () => {
    it('queries only authorized public views and never requests full_name, birth_date, nisn, coach_raw_notes', async () => {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      const queriedTables = [];
      const selectedColumns = [];

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        queriedTables.push(table);
        return {
          select: vi.fn().mockImplementation((cols) => {
            selectedColumns.push({ table, cols });
            return Promise.resolve({ data: [], error: null });
          })
        };
      });

      await fetchPublicPlayersFromViews();

      // Check queried views
      const allowedViews = [
        'public_player_profiles',
        'public_player_assessments',
        'public_player_fitness',
        'public_player_highlights'
      ];

      expect(queriedTables.length).toBeGreaterThan(0);
      queriedTables.forEach((table) => {
        expect(allowedViews).toContain(table);
        expect(table).not.toBe('players');
        expect(table).not.toBe('passport_snapshots');
      });

      // Check selected columns do not contain private columns
      const forbiddenColumns = ['full_name', 'birth_date', 'nisn', 'coach_raw_notes'];
      selectedColumns.forEach(({ cols }) => {
        forbiddenColumns.forEach((forbidden) => {
          expect(cols).not.toContain(forbidden);
        });
      });
    });

    it('routes unauthenticated fetchLiveRosterFromSupabase strictly to public views', async () => {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      // Ensure auth returns null user
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: null }, error: null });

      const queriedTables = [];
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        queriedTables.push(table);
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      await fetchLiveRosterFromSupabase();

      expect(queriedTables).not.toContain('players');
      expect(queriedTables).toContain('public_player_profiles');
    });

    it('verifies passport snapshots via RPC function rather than enumerating table', async () => {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null });
      await fetchPassportSnapshot('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');

      expect(rpcSpy).toHaveBeenCalledWith('verify_passport_snapshot', expect.any(Object));
    });

    it('fetches share token players via RPC get_player_by_token', async () => {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) return;

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null });
      await fetchPlayerByToken('token-123');

      expect(rpcSpy).toHaveBeenCalledWith('get_player_by_token', { p_token: 'token-123' });
    });
  });

  describe('(iii) Empty states render with honest "Belum ada data"', () => {
    it('renders honest empty state in VaepScorecard when vaepMetrics is missing', () => {
      render(<VaepScorecard vaepMetrics={null} />);

      expect(screen.getByText('Belum ada data')).toBeInTheDocument();
      expect(screen.getByText(/Metrik aksi VAEP belum dihitung/i)).toBeInTheDocument();
      expect(screen.queryByText('+0.84')).not.toBeInTheDocument();
    });

    it('renders honest empty state in TacticalAnalyticsHub telemetry cards when stats are null', () => {
      const emptyPlayer = {
        personal_info: { full_name: 'Atlet Tes', position: 'Midfielder' },
        latest_match_summary: null
      };

      render(<TacticalAnalyticsHub player={emptyPlayer} onToast={() => {}} />);

      const emptyBadges = screen.getAllByText('Belum ada data');
      expect(emptyBadges.length).toBeGreaterThan(0);
      expect(screen.queryByText('+0.84')).not.toBeInTheDocument();
    });

    it('renders honest empty state in CameraFeed without simulator text', () => {
      const mockPlayer = { personal_info: { full_name: 'Atlet Tes', jersey_number: 10 } };
      render(
        <CameraFeed
          videoRef={{ current: null }}
          cameraError={true}
          player={mockPlayer}
          testMode="jump"
          testState="idle"
          liveMetrics={{ currentHeightCm: 0, peakJumpCm: 0, hangtimeMs: 0 }}
          countdownNum={3}
        />
      );

      expect(screen.getByText('Kamera Tidak Aktif')).toBeInTheDocument();
      expect(screen.getByText('Belum ada data')).toBeInTheDocument();
      expect(screen.queryByText(/simulation|simulator/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/READY FOR TEST TRIGGER/i)).not.toBeInTheDocument();
    });

    it('renders honest empty state in FitnessStrip when benchmarks are null', () => {
      render(<FitnessStrip benchmarks={{}} />);

      const emptyLabels = screen.getAllByText('Belum ada data');
      expect(emptyLabels.length).toBeGreaterThanOrEqual(4);
      expect(screen.queryByText(/44\.5 cm/)).not.toBeInTheDocument();
      expect(screen.queryByText(/3\.42s/)).not.toBeInTheDocument();
    });

    it('renders honest empty state in PlayerHeader when physical specs are missing', () => {
      const minimalInfo = {
        full_name: 'Atlet Muda',
        nickname: 'Atlet',
        jersey_number: 7,
        position: 'Winger',
        age: null,
        height_cm: null,
        weight_kg: null,
        preferred_foot: null
      };

      render(<PlayerHeader personalInfo={minimalInfo} onOpenStoryCard={() => {}} />);

      const emptyLabels = screen.getAllByText('Belum ada data');
      expect(emptyLabels.length).toBeGreaterThanOrEqual(3);
      expect(screen.queryByText(/160 cm/)).not.toBeInTheDocument();
      expect(screen.queryByText(/13 thn/)).not.toBeInTheDocument();
    });

    it('renders honest empty state in BioMaturityCard when stature is missing', () => {
      const emptyBioSpecs = {
        maturityStatus: 'On-Time Maturing',
        maturityOffset: '+0.2 yrs',
        currentHeight: null,
        currentWeight: null,
        predictedAdultHeight: 172.0,
        adultHeightPct: 70.0,
        biologicalAge: 13.0,
        chronologicalAge: null
      };

      render(<BioMaturityCard bioSpecs={emptyBioSpecs} />);

      const emptyLabels = screen.getAllByText('Belum ada data');
      expect(emptyLabels.length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText(/158 cm/)).not.toBeInTheDocument();
    });

    it('renders honest empty state in MatchMoments when no clips exist', () => {
      render(<MatchMoments moments={[]} onSelectClip={() => {}} />);

      expect(screen.getByText(/Belum ada data cuplikan pertandingan/i)).toBeInTheDocument();
    });
  });

  describe('(iv) Role authorization & profile verification in AuthModal', () => {
    it('sets role to public and shows error message when profile row does not exist', async () => {
      vi.spyOn(supabaseLib, 'signInWithEmail').mockResolvedValue({ user: { id: 'u1' } });
      vi.spyOn(supabaseLib, 'getCurrentUserProfile').mockResolvedValue(null);

      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <AuthModal
          isOpen={true}
          onSuccess={onSuccess}
          onClose={onClose}
          targetView="assessment"
        />
      );

      fireEvent.change(screen.getByLabelText(/Alamat email/i), {
        target: { value: 'unregistered@test.id' }
      });
      fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
        target: { value: 'secret123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        expect(screen.getByText('Akun belum terdaftar di akademi. Hubungi admin.')).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('grants coach role and view when valid profile row with coach role exists', async () => {
      vi.spyOn(supabaseLib, 'signInWithEmail').mockResolvedValue({ user: { id: 'u1' } });
      vi.spyOn(supabaseLib, 'getCurrentUserProfile').mockResolvedValue({ role: 'coach', full_name: 'Coach Budi' });

      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <AuthModal
          isOpen={true}
          onSuccess={onSuccess}
          onClose={onClose}
          targetView="assessment"
        />
      );

      fireEvent.change(screen.getByLabelText(/Alamat email/i), {
        target: { value: 'coach@test.id' }
      });
      fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
        target: { value: 'secret123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('coach', 'assessment');
      });

      expect(screen.queryByText('Akun belum terdaftar di akademi. Hubungi admin.')).not.toBeInTheDocument();
    });
  });
});
