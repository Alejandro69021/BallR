import { beforeAll, afterAll, describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

beforeAll(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// Mock players hook
vi.mock('../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [],
    loading: false,
    isDemoMode: true
  })
}));

import WelcomeTour from '../components/ux/WelcomeTour';
import MatchesPage from '../pages/MatchesPage';
import SquadHubView from '../components/SquadHubView';
import TacticsPage from '../pages/TacticsPage';
import GuidePage from '../pages/GuidePage';
import { TOUR_STORAGE_KEY } from '../lib/tourStorage';
import * as matchesLib from '../lib/matches';
import * as scenariosLib from '../lib/scenarios';

describe('UX-4 First-Run Tour and Guided Empty States', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Tour Banner & Persistence', () => {
    it('shows banner when tour key is unset, clicking Lewati sets the key and hides banner', async () => {
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();

      render(
        <MemoryRouter>
          <WelcomeTour />
        </MemoryRouter>
      );

      const banner = screen.getByTestId('welcome-tour-banner');
      expect(banner).toBeInTheDocument();
      expect(screen.getByText('Pertama kali di sini?')).toBeInTheDocument();
      expect(
        screen.getByText(/Ikuti tur singkat 4 langkah, sekitar 2 menit/i)
      ).toBeInTheDocument();

      const skipBtn = screen.getByTestId('skip-tour-banner-btn');
      fireEvent.click(skipBtn);

      // Key is persisted
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');
      expect(screen.queryByTestId('welcome-tour-banner')).not.toBeInTheDocument();
    });

    it('does NOT show banner when tour key is already set', async () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');

      render(
        <MemoryRouter>
          <WelcomeTour />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('welcome-tour-banner')).not.toBeInTheDocument();
    });

    it('Ulangi tur button in GuidePage resets tour key in localStorage', async () => {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');

      render(
        <MemoryRouter initialEntries={['/bantuan']}>
          <Routes>
            <Route path="/bantuan" element={<GuidePage />} />
            <Route path="/" element={<div data-testid="home-page" />} />
          </Routes>
        </MemoryRouter>
      );

      const resetBtn = screen.getByTestId('reset-tour-btn');
      expect(resetBtn).toBeInTheDocument();

      fireEvent.click(resetBtn);

      // Key must be removed / reset
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBeNull();
    });
  });

  describe('2. CoachMark Popover Flow & Missing Anchor Handling', () => {
    it('starts tour, renders popover with step 1 copy, and advances on Berikutnya', async () => {
      // Render simulated DOM with anchors for all 4 steps
      const { unmount } = render(
        <div data-testid="tour-test-container">
          <button data-tour="new-match">Laga Baru</button>
          <button data-tour="record-events">Lanjut mencatat</button>
          <button data-tour="finish-match">Selesaikan laga</button>
          <button data-tour="match-report">Buka laporan</button>
          <WelcomeTour />
        </div>
      );

      // Click Mulai tur
      const startBtn = screen.getByTestId('start-tour-banner-btn');
      fireEvent.click(startBtn);

      // Step 1 CoachMark is visible
      const popover = screen.getByTestId('coachmark-popover');
      expect(popover).toBeInTheDocument();
      expect(screen.getByText('Langkah 1 dari 4')).toBeInTheDocument();
      expect(screen.getByText('Mulai dari sini')).toBeInTheDocument();
      expect(
        screen.getByText('Buat laga pertama. Setelah itu kamu bisa langsung mencatat kejadian.')
      ).toBeInTheDocument();

      // Click Berikutnya -> Step 2
      const nextBtn = screen.getByTestId('coachmark-next-btn');
      fireEvent.click(nextBtn);

      expect(screen.getByText('Langkah 2 dari 4')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Catat kejadian' })).toBeInTheDocument();

      // Click Berikutnya -> Step 3
      fireEvent.click(screen.getByTestId('coachmark-next-btn'));
      expect(screen.getByText('Langkah 3 dari 4')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Selesaikan laga' })).toBeInTheDocument();

      // Click Berikutnya -> Step 4 (Last step)
      fireEvent.click(screen.getByTestId('coachmark-next-btn'));
      expect(screen.getByText('Langkah 4 dari 4')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Laporan dan bagikan' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Selesai' })).toBeInTheDocument();

      // Click Selesai -> completes tour and sets key
      fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');
      expect(screen.queryByTestId('coachmark-popover')).not.toBeInTheDocument();

      unmount();
    });

    it('skips step gracefully if its anchor element is missing on the current route', async () => {
      // DOM only has anchor for step 1 and step 4 (steps 2 and 3 are missing)
      render(
        <div>
          <button data-tour="new-match">Laga Baru</button>
          <button data-tour="match-report">Buka laporan</button>
          <WelcomeTour />
        </div>
      );

      fireEvent.click(screen.getByTestId('start-tour-banner-btn'));
      expect(screen.getByText('Mulai dari sini')).toBeInTheDocument();

      // Click Berikutnya: since step 2 and step 3 anchors are missing, it jumps directly to step 4!
      fireEvent.click(screen.getByTestId('coachmark-next-btn'));
      expect(screen.getByText('Laporan dan bagikan')).toBeInTheDocument();
    });

    it('Escape key closes the popover without trapping focus', async () => {
      render(
        <div>
          <button data-tour="new-match">Laga Baru</button>
          <WelcomeTour />
        </div>
      );

      fireEvent.click(screen.getByTestId('start-tour-banner-btn'));
      const popover = screen.getByTestId('coachmark-popover');
      expect(popover).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(popover, { key: 'Escape' });

      // Popover is dismissed
      expect(screen.queryByTestId('coachmark-popover')).not.toBeInTheDocument();
      expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true');
    });
  });

  describe('3. Guided Empty States (Laga, Skuad, Taktik)', () => {
    it('Laga empty state: renders spec copy and "Buat laga pertama" primary action', async () => {
      vi.spyOn(matchesLib, 'listMatches').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <MatchesPage userRole="coach" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Belum ada laga')).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Mulailah dengan membuat laga pertama. Kamu hanya perlu nama lawan dan tanggal. Ukuran lapangan sudah terisi otomatis, bisa kamu ubah.'
        )
      ).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'Buat laga pertama' });
      expect(actionBtn).toBeInTheDocument();

      // Opens create dialog
      fireEvent.click(actionBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nama tim lawan/i)).toBeInTheDocument();
    });

    it('Skuad empty state: renders "Belum ada pemain" and "Tambah pemain pertama" primary action', async () => {
      const handleAddPlayer = vi.fn();

      render(
        <MemoryRouter>
          <SquadHubView
            players={[]}
            userRole="coach"
            onAddPlayer={handleAddPlayer}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Belum ada pemain')).toBeInTheDocument();
      expect(
        screen.getByText('Tambahkan pemain ke skuad untuk mencatat kehadiran, menit bermain, dan perkembangan mereka.')
      ).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'Tambah pemain pertama' });
      expect(actionBtn).toBeInTheDocument();

      fireEvent.click(actionBtn);
      expect(handleAddPlayer).toHaveBeenCalledTimes(1);
    });

    it('Taktik empty state: renders "Belum ada taktik" and "Buat taktik pertama" primary action', async () => {
      vi.spyOn(scenariosLib, 'listScenarios').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <TacticsPage userRole="coach" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Belum ada taktik')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Buat formasi atau skenario taktik untuk panduan bermain dan analisis posisi tim.')
      ).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'Buat taktik pertama' });
      expect(actionBtn).toBeInTheDocument();

      fireEvent.click(actionBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Judul skema/i)).toBeInTheDocument();
    });
  });

  describe('4. Source Code Audit: No localStorage access without try/catch', () => {
    it('all localStorage accesses in onboarding, tour, and guide files are wrapped in try/catch', () => {
      const filesToAudit = [
        path.resolve(process.cwd(), 'src/lib/tourStorage.js'),
        path.resolve(process.cwd(), 'src/components/ux/WelcomeTour.jsx'),
        path.resolve(process.cwd(), 'src/components/ux/CoachMark.jsx'),
        path.resolve(process.cwd(), 'src/pages/GuidePage.jsx')
      ];

      for (const filePath of filesToAudit) {
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if file uses localStorage
        if (content.includes('localStorage')) {
          // Verify that every 'localStorage' usage is within a try block
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('localStorage.')) {
              // Look backwards up to 15 lines to confirm an enclosing 'try {'
              const windowBefore = lines.slice(Math.max(0, idx - 15), idx + 1).join('\n');
              expect(windowBefore).toContain('try');
            }
          });
        }
      }
    });
  });
});
