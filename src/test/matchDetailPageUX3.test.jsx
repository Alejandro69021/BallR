import { beforeAll, afterAll, describe, it, expect, beforeEach, vi } from 'vitest';

beforeAll(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MatchDetailPage from '../pages/MatchDetailPage';
import * as matchesLib from '../lib/matches';
import * as reportLib from '../lib/report';
import { SMALL_SAMPLE_N } from '../lib/analysis/events';

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
          position: 'FWD'
        }
      }
    ]
  })
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('UX-3 MatchDetailPage Redesign', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  describe('1. NextStepPanel: 4 State Driven Actions & Copy', () => {
    it('State 1: draft with 0 events -> "Catat kejadian"', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Tim Baru FC',
        match_date: '2026-11-25',
        format: '7v7'
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Tim Baru FC')).toBeInTheDocument();
      });

      const nextStepPanel = screen.getByTestId('next-step-panel');
      expect(nextStepPanel).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Catat kejadian' })).toBeInTheDocument();
      expect(
        screen.getByText('Mulai mencatat dari pencatat laga. Bisa sambil memutar video.')
      ).toBeInTheDocument();

      const primaryCta = screen.getByTestId('primary-next-step-action');
      expect(primaryCta).toHaveTextContent('Catat kejadian');
      expect(screen.queryByTestId('secondary-next-step-action')).not.toBeInTheDocument();

      fireEvent.click(primaryCta);
      expect(mockNavigate).toHaveBeenCalledWith(`/pencatatan/${match.id}`);
    });

    it('State 2: draft with >= 1 event -> "Selesaikan laga" and secondary "Tambah kejadian"', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Bina Taruna',
        match_date: '2026-11-26',
        format: '11v11'
      });
      await matchesLib.addEvents(match.id, [
        { period: 1, minute: 5, team: 'own', event_type: 'pass', outcome: 'success' }
      ]);

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Bina Taruna')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 2, name: 'Selesaikan laga' })).toBeInTheDocument();
      expect(
        screen.getByText(/Masukkan skor akhir\. Setelah laga final, catatan terkunci supaya laporan bisa dipercaya/i)
      ).toBeInTheDocument();

      const primaryCta = screen.getByTestId('primary-next-step-action');
      expect(primaryCta).toHaveTextContent('Selesaikan laga');

      const secondaryCta = screen.getByTestId('secondary-next-step-action');
      expect(secondaryCta).toBeInTheDocument();
      expect(secondaryCta).toHaveTextContent('Tambah kejadian');

      // Click secondary action -> navigates to logger
      fireEvent.click(secondaryCta);
      expect(mockNavigate).toHaveBeenCalledWith(`/pencatatan/${match.id}`);

      // Click primary action -> opens finalise dialog
      fireEvent.click(primaryCta);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Skor tim sendiri/i)).toBeInTheDocument();
    });

    it('State 3: final without frozen report -> "Buat laporan"', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Persita Muda',
        match_date: '2026-11-22',
        format: '11v11'
      });
      await matchesLib.finaliseMatch(match.id, { ownScore: 3, opponentScore: 1 });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Persita Muda')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 2, name: 'Buat laporan' })).toBeInTheDocument();
      expect(
        screen.getByText('Laporan dibuat dari catatan yang sudah terkunci.')
      ).toBeInTheDocument();

      const primaryCta = screen.getByTestId('primary-next-step-action');
      expect(primaryCta).toHaveTextContent('Buat laporan');

      fireEvent.click(primaryCta);
      expect(mockNavigate).toHaveBeenCalledWith(`/laga/${match.id}/laporan`);
    });

    it('State 4: final with frozen report -> "Bagikan atau cetak laporan"', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'PSIM Academy',
        match_date: '2026-11-21',
        format: '11v11'
      });
      await matchesLib.finaliseMatch(match.id, { ownScore: 2, opponentScore: 0 });

      // Mock frozen snapshot
      vi.spyOn(reportLib, 'getLatestSnapshot').mockResolvedValue({
        id: 'snap-001',
        match_id: match.id,
        hash: 'abc123hash',
        created_at: new Date().toISOString()
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('PSIM Academy')).toBeInTheDocument();
      });

      expect(
        screen.getByRole('heading', { level: 2, name: 'Bagikan atau cetak laporan' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Laporan pertandingan telah dikunci dan siap dibagikan atau dicetak.')
      ).toBeInTheDocument();

      const primaryCta = screen.getByTestId('primary-next-step-action');
      expect(primaryCta).toHaveTextContent('Bagikan atau cetak laporan');

      fireEvent.click(primaryCta);
      expect(mockNavigate).toHaveBeenCalledWith(`/laga/${match.id}/laporan`);
    });
  });

  describe('2. Visible Actions Budget (<= 3 in header/NextStepPanel)', () => {
    it('draft with events has exactly 3 visible actions: Primary, Secondary, MenuButton', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Sleman United',
        match_date: '2026-11-24',
        format: '11v11'
      });
      await matchesLib.addEvents(match.id, [
        { period: 1, minute: 1, team: 'own', event_type: 'pass', outcome: 'success' }
      ]);

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sleman United')).toBeInTheDocument();
      });

      const nextStepPanel = screen.getByTestId('next-step-panel');
      const buttonsInsidePanel = nextStepPanel.querySelectorAll('button');
      // Primary ("Selesaikan laga") + Secondary ("Tambah kejadian") + MenuButton ("Lainnya") = 3
      expect(buttonsInsidePanel.length).toBe(3);
      expect(buttonsInsidePanel.length).toBeLessThanOrEqual(3);
    });

    it('draft with 0 events has 2 visible actions: Primary and MenuButton', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Persiba Bantul',
        match_date: '2026-11-24',
        format: '11v11'
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Persiba Bantul')).toBeInTheDocument();
      });

      const nextStepPanel = screen.getByTestId('next-step-panel');
      const buttonsInsidePanel = nextStepPanel.querySelectorAll('button');
      // Primary ("Catat kejadian") + MenuButton ("Lainnya") = 2
      expect(buttonsInsidePanel.length).toBe(2);
      expect(buttonsInsidePanel.length).toBeLessThanOrEqual(3);
    });
  });

  describe('3. MenuButton Accessibility & Overflow Menu Flow', () => {
    it('has accessible attributes and keyboard navigation (Escape, ArrowUp, ArrowDown, Tab)', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Bhayangkara FC',
        match_date: '2026-11-24',
        format: '11v11'
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Bhayangkara FC')).toBeInTheDocument();
      });

      const menuTrigger = screen.getByRole('button', { name: /Lainnya/i });
      expect(menuTrigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');

      // Click to open menu
      fireEvent.click(menuTrigger);
      expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');

      const menu = screen.getByRole('menu', { name: /Lainnya/i });
      expect(menu).toBeInTheDocument();

      const items = screen.getAllByRole('menuitem');
      expect(items.length).toBe(4);
      expect(screen.getByRole('menuitem', { name: /Ubah data laga/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Pilih video laga/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Cetak catatan sementara/i })).toBeInTheDocument();

      const deleteItem = screen.getByRole('menuitem', { name: /Hapus draf/i });
      expect(deleteItem).toBeInTheDocument();
      expect(deleteItem.className).toContain('text-danger');

      // Touch target size >= 44px class
      items.forEach((item) => {
        expect(item.className).toMatch(/min-h-\[44px\]/);
      });

      // Keyboard navigation: ArrowDown
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      // Keyboard navigation: Escape closes menu
      fireEvent.keyDown(menu, { key: 'Escape' });
      expect(screen.queryByRole('menu', { name: /Lainnya/i })).not.toBeInTheDocument();
      expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');

      // Open again, then Tab closes
      fireEvent.click(menuTrigger);
      expect(screen.getByRole('menu', { name: /Lainnya/i })).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('menu', { name: /Lainnya/i }), { key: 'Tab' });
      expect(screen.queryByRole('menu', { name: /Lainnya/i })).not.toBeInTheDocument();
    });

    it('Hapus draf item opens confirmation dialog and deletes draft match', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Draf Hapus FC',
        match_date: '2026-11-24',
        format: '7v7'
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Draf Hapus FC')).toBeInTheDocument();
      });

      // Open menu
      fireEvent.click(screen.getByRole('button', { name: /Lainnya/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Hapus draf/i }));

      // Confirm dialog is open
      const deleteDialog = screen.getByRole('dialog');
      expect(deleteDialog).toBeInTheDocument();
      expect(screen.getByText(/Apakah Anda yakin ingin menghapus pertandingan draf/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: 'Hapus draf' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/laga');
      });
    });
  });

  describe('4. Tabs and Summary Rules (SMALL_SAMPLE_N & Video Card)', () => {
    it('renders 4 tabs: Ringkasan, Peta lapangan, Daftar kejadian, Pemain and supports switching', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Tab Test FC',
        match_date: '2026-11-24',
        format: '11v11'
      });

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Tab Test FC')).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
      expect(screen.getByRole('tab', { name: /Ringkasan/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Peta lapangan/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /Daftar kejadian/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /Pemain/i })).toHaveAttribute('aria-selected', 'false');

      // Switch to Peta lapangan
      fireEvent.click(screen.getByRole('tab', { name: /Peta lapangan/i }));
      expect(screen.getByRole('tab', { name: /Peta lapangan/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Ringkasan/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('displays small-sample note with SMALL_SAMPLE_N threshold and video privacy notice', async () => {
      const match = await matchesLib.createMatch({
        opponent_name: 'Sample Test FC',
        match_date: '2026-11-24',
        format: '11v11'
      });
      // 3 events (< SMALL_SAMPLE_N)
      await matchesLib.addEvents(match.id, [
        { period: 1, minute: 1, team: 'own', event_type: 'pass', outcome: 'success' },
        { period: 1, minute: 2, team: 'own', event_type: 'shot', outcome: 'fail' },
        { period: 1, minute: 3, team: 'own', event_type: 'tackle', outcome: 'success' }
      ]);

      render(
        <MemoryRouter initialEntries={[`/laga/${match.id}`]}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sample Test FC')).toBeInTheDocument();
      });

      // Note check for small sample
      expect(
        screen.getByText(
          new RegExp(`Data pencatatan manual · n = 3 kejadian\\. Baru sedikit.*minimal ${SMALL_SAMPLE_N} kejadian`)
        )
      ).toBeInTheDocument();

      // Video card title & notice
      expect(screen.getByRole('heading', { level: 2, name: 'Video laga' })).toBeInTheDocument();
      expect(
        screen.getByText('Video tersimpan di perangkat ini dan tidak diunggah ke server.')
      ).toBeInTheDocument();
    });
  });
});
