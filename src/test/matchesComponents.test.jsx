import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TopNav from '../components/TopNav';
import MatchesPage from '../pages/MatchesPage';
import MatchDetailPage from '../pages/MatchDetailPage';
import * as matchesLib from '../lib/matches';

// Mock usePlayers hook
vi.mock('../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [
      {
        player_id: 'p-01',
        public_id: 'dimas-10',
        personal_info: {
          full_name: 'Dimas Prasetyo',
          nickname: 'Dimas',
          jersey_number: 10,
          position: 'FWD',
          academy: { name: 'Mataram Putra FA', city: 'Yogyakarta' }
        }
      },
      {
        player_id: 'p-02',
        public_id: 'rizky-07',
        personal_info: {
          full_name: 'Rizky Pratama',
          nickname: 'Rizky',
          jersey_number: 7,
          position: 'MID',
          academy: { name: 'Mataram Putra FA', city: 'Yogyakarta' }
        }
      }
    ],
    loading: false,
    error: null,
    isDemoMode: true
  })
}));

describe('Matches Components & Integration (MatchesPage, MatchDetailPage, TopNav)', () => {
  const mockAcademy = {
    name: 'Mataram Putra FA',
    city: 'Yogyakarta',
    logo_url: ''
  };

  beforeEach(() => {
    localStorage.clear();
    import.meta.env.VITE_DEMO_MODE = 'true';
    vi.restoreAllMocks();
  });

  describe('1. Navigation Role Gating', () => {
    it('shows "Laga" in TopNav for coach and admin roles', () => {
      const handleSwitch = vi.fn();
      render(
        <TopNav
          academy={mockAcademy}
          currentView="matches"
          userRole="coach"
          isDemoMode={true}
          onSwitchView={handleSwitch}
          onOpenAuthModal={() => {}}
          onLogout={() => {}}
          onShare={() => {}}
        />
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      const lagaButton = within(desktopNav).getByRole('button', { name: /^Laga$/i });
      expect(lagaButton).toBeInTheDocument();

      fireEvent.click(lagaButton);
      expect(handleSwitch).toHaveBeenCalledWith('matches');

      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi bawah seluler' });
      const mobileLagaButtons = within(mobileNav).getAllByRole('button', { name: /Laga/i });
      expect(mobileLagaButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT show coach "Laga" nav item for public role', () => {
      render(
        <TopNav
          academy={mockAcademy}
          currentView="passport"
          userRole="public"
          isDemoMode={false}
          onSwitchView={() => {}}
          onOpenAuthModal={() => {}}
          onLogout={() => {}}
          onShare={() => {}}
        />
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      // Only "Analisis laga" exists for public; standalone "Laga" is coach-only
      const buttons = within(desktopNav).getAllByRole('button');
      const coachLagaButton = buttons.find(b => b.textContent.trim() === 'Laga');
      expect(coachLagaButton).toBeUndefined();
    });

    it('renders restricted access notice on MatchesPage when accessed by public role', () => {
      const openAuthMock = vi.fn();
      render(
        <MemoryRouter>
          <MatchesPage
            userRole="public"
            onOpenAuthModal={openAuthMock}
            onToast={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(/Halaman manajemen laga hanya dapat diakses/i)).toBeInTheDocument();
      const loginBtn = screen.getByRole('button', { name: /Masuk sebagai pelatih/i });
      expect(loginBtn).toBeInTheDocument();
      fireEvent.click(loginBtn);
      expect(openAuthMock).toHaveBeenCalledWith('matches');
    });
  });

  describe('2. Match List Page (MatchesPage)', () => {
    it('renders match list table with columns, score, and Draf/Final status', async () => {
      render(
        <MemoryRouter initialEntries={['/laga']}>
          <Routes>
            <Route
              path="/laga"
              element={
                <MatchesPage
                  userRole="coach"
                  onToast={() => {}}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Rekaman Pertandingan/i)).toBeInTheDocument();
      });

      // Headers
      expect(screen.getByRole('columnheader', { name: /Tanggal/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Lawan/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Kompetisi/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Format/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Skor/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();

      // Seeded fictional match
      expect(screen.getByText(/Contoh: vs Lawan Contoh/i)).toBeInTheDocument();
      expect(screen.getByText('2 - 1')).toBeInTheDocument();
      expect(screen.getByText('Final')).toBeInTheDocument();
    });

    it('opens create dialog, auto-updates pitch size on format change, and creates match', async () => {
      const toastMock = vi.fn();
      render(
        <MemoryRouter initialEntries={['/laga']}>
          <Routes>
            <Route
              path="/laga"
              element={
                <MatchesPage
                  userRole="coach"
                  onToast={toastMock}
                />
              }
            />
            <Route
              path="/laga/:matchId"
              element={<div data-testid="detail-page">Halaman Detail</div>}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Laga baru/i })).toBeInTheDocument();
      });

      // Open create dialog
      fireEvent.click(screen.getByRole('button', { name: /Laga baru/i }));
      expect(screen.getByRole('heading', { name: /^Laga baru$/i })).toBeInTheDocument();

      // Check format default 11v11 (90x60)
      const lengthInput = screen.getByLabelText(/Panjang lapangan/i);
      const widthInput = screen.getByLabelText(/Lebar lapangan/i);
      expect(lengthInput.value).toBe('90');
      expect(widthInput.value).toBe('60');

      // Change format to 7v7 (should auto update pitch to 60x40)
      const formatSelect = screen.getByLabelText(/Format pertandingan/i);
      fireEvent.change(formatSelect, { target: { value: '7v7' } });
      expect(lengthInput.value).toBe('60');
      expect(widthInput.value).toBe('40');

      // Fill in opponent name and submit
      const opponentInput = screen.getByLabelText(/Nama tim lawan/i);
      fireEvent.change(opponentInput, { target: { value: 'Persiba Muda' } });

      const submitBtn = screen.getByRole('button', { name: /Buat laga/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/Laga Baru Berhasil Dibuat/i)
          })
        );
      });
    });
  });

  describe('3. Match Detail Page (MatchDetailPage) & Finalise Flow', () => {
    it('renders match header, event counts breakdown, player counts, and events table', async () => {
      render(
        <MemoryRouter initialEntries={['/laga/demo-match-contoh-01']}>
          <Routes>
            <Route
              path="/laga/:matchId"
              element={
                <MatchDetailPage
                  userRole="coach"
                  onToast={() => {}}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Contoh: vs Lawan Contoh/i)).toBeInTheDocument();
      });

      // Header score
      expect(screen.getByText('2 - 1')).toBeInTheDocument();
      expect(screen.getByText(/90 x 60 m/i)).toBeInTheDocument();

      // Counts per event type (n shown)
      expect(screen.getByText(/Total n = 25/i)).toBeInTheDocument();
      expect(screen.getByText(/Distribusi Kejadian/i)).toBeInTheDocument();

      // Keterlibatan Pemain
      expect(screen.getByText(/Keterlibatan Pemain/i)).toBeInTheDocument();

      // Events table headers
      expect(screen.getByRole('columnheader', { name: /Babak/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Menit/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Tim/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Pemain \/ Lawan/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Jenis/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Hasil/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Koordinat/i })).toBeInTheDocument();
    });

    it('finalise flow: opens dialog, submits scores, and updates match to final', async () => {
      // First create a draft match
      const draftMatch = await matchesLib.createMatch({
        opponent_name: 'Diklat Mataram',
        match_date: '2026-11-20',
        format: '11v11'
      });

      const toastMock = vi.fn();
      render(
        <MemoryRouter initialEntries={[`/laga/${draftMatch.id}`]}>
          <Routes>
            <Route
              path="/laga/:matchId"
              element={
                <MatchDetailPage
                  userRole="coach"
                  onToast={toastMock}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Diklat Mataram/i)).toBeInTheDocument();
      });

      // Draft status displayed
      const finaliseBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      expect(finaliseBtn).toBeInTheDocument();

      // Open finalise modal
      fireEvent.click(finaliseBtn);
      expect(screen.getByRole('heading', { name: /Selesaikan laga/i })).toBeInTheDocument();

      // Fill scores
      const ownScoreInput = screen.getByLabelText(/Skor tim sendiri/i);
      const oppScoreInput = screen.getByLabelText(/Skor tim lawan/i);
      fireEvent.change(ownScoreInput, { target: { value: '4' } });
      fireEvent.change(oppScoreInput, { target: { value: '2' } });

      const saveFinalBtn = screen.getByRole('button', { name: /Simpan & finalkan/i });
      fireEvent.click(saveFinalBtn);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/Laga Berhasil Difinalkan/i)
          })
        );
      });

      // Final score is now displayed
      expect(screen.getByText('4 - 2')).toBeInTheDocument();
    });

    it('admin reopen flow: admin sees "Buka kembali", coach does not', async () => {
      // Re-render as coach for a final match
      const { rerender } = render(
        <MemoryRouter initialEntries={['/laga/demo-match-contoh-01']}>
          <Routes>
            <Route
              path="/laga/:matchId"
              element={
                <MatchDetailPage
                  userRole="coach"
                  onToast={() => {}}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Contoh: vs Lawan Contoh/i)).toBeInTheDocument();
      });

      // Coach should NOT see "Buka kembali"
      expect(screen.queryByRole('button', { name: /Buka kembali/i })).not.toBeInTheDocument();

      // Rerender as admin
      const toastMock = vi.fn();
      rerender(
        <MemoryRouter initialEntries={['/laga/demo-match-contoh-01']}>
          <Routes>
            <Route
              path="/laga/:matchId"
              element={
                <MatchDetailPage
                  userRole="admin"
                  onToast={toastMock}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Admin SHOULD see "Buka kembali"
      const reopenBtn = await screen.findByRole('button', { name: /Buka kembali/i });
      expect(reopenBtn).toBeInTheDocument();

      fireEvent.click(reopenBtn);

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching(/Laga Dibuka Kembali/i)
          })
        );
      });
    });
  });
});
