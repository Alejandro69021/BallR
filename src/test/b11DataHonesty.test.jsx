import { vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

import React from 'react';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import { PlayersProvider } from '../context/PlayersContext';
import GrowthBioBandingTab from '../components/GrowthBioBandingTab';
import BioMaturityCard from '../components/growth/BioMaturityCard';
import ConsentManagerModal from '../components/growth/ConsentManagerModal';
import TactileKeypad from '../components/logger/TactileKeypad';
import EventStreamLog from '../components/logger/EventStreamLog';
import MatchRecapModal from '../components/logger/MatchRecapModal';
import SquadHubView from '../components/SquadHubView';
import MatchDetailPage from '../pages/MatchDetailPage';
import PassportPage from '../pages/PassportPage';
import GrowthPage from '../pages/GrowthPage';

import { playersRoster } from '../data/mockData';
import {
  getDemoStore,
  DEMO_STORE_VERSION,
  listMatches,
  finaliseMatch,
  listEvents
} from '../lib/matches';
import { getInitialDemoConsents } from '../lib/supabase';

describe('Phase B11: Data Honesty, Demo Store Reset, & Consent Seeds', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('1. Fabricated Growth Data (Blocker)', () => {
    it('scan test: literals 174.5 and 68.2 do not appear in any source file in src/ (excluding test/)', () => {
      const srcDir = path.resolve(__dirname, '..');
      const files = [];

      function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'test' && entry.name !== '__tests__') {
              walk(fullPath);
            }
          } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }

      walk(srcDir);
      expect(files.length).toBeGreaterThan(15);

      const violations = [];
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('174.5') || content.includes('68.2')) {
          violations.push(path.relative(srcDir, file));
        }
      }

      expect(violations).toEqual([]);
    });

    it('two different demo players show different growth series in GrowthBioBandingTab', () => {
      const p1 = playersRoster.find((p) => p.player_id === 'WK-2026-0042');
      const p2 = playersRoster.find((p) => p.player_id === 'WK-2026-0043');
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();

      const { container: c1 } = render(<GrowthBioBandingTab player={p1} />);
      const { container: c2 } = render(<GrowthBioBandingTab player={p2} />);

      expect(c1.textContent).toContain('158');
      expect(c2.textContent).toContain('155');
      expect(c1.textContent).not.toEqual(c2.textContent);
    });

    it('player with 1 measurement shows "Belum ada data" with clear reason', () => {
      const pSingle = playersRoster.find((p) => p.player_id === 'WK-2026-0048');
      expect(pSingle).toBeDefined();
      expect(pSingle.anthropometry_records.length).toBe(1);

      render(<GrowthBioBandingTab player={pSingle} />);
      expect(screen.getByText(/Belum ada data/i)).toBeInTheDocument();
      expect(screen.getByText(/Butuh minimal 2 sesi pengukuran berkala/i)).toBeInTheDocument();
    });

    it('adult height prediction shows exact honest notice and zero fabricated numbers', () => {
      render(
        <BioMaturityCard
          bioSpecs={{
            currentHeight: 158.0,
            currentWeight: 46.0,
            chronologicalAge: 13,
            date: '15 Okt 2026'
          }}
        />
      );

      expect(
        screen.getByText(
          'Prediksi tinggi dewasa belum tersedia: butuh tabel koefisien Khamis-Roche dari sumber primer dan tinggi kedua orang tua.'
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/174\.5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/68\.2/)).not.toBeInTheDocument();
    });
  });

  describe('2. Demo Store Reset & Persistence', () => {
    it('finalising the only draft persists and events are kept across reads', async () => {
      const matches = await listMatches();
      const draftMatch = matches.find((m) => m.status === 'draft');
      expect(draftMatch).toBeDefined();

      const eventsBefore = await listEvents(draftMatch.id);

      await finaliseMatch(draftMatch.id, { ownScore: 3, opponentScore: 2 });

      // Re-read store
      const storeAfter = getDemoStore();
      const persistedMatch = storeAfter.matches.find((m) => m.id === draftMatch.id);
      expect(persistedMatch).toBeDefined();
      expect(persistedMatch.status).toBe('final');
      expect(persistedMatch.own_score).toBe(3);
      expect(persistedMatch.opponent_score).toBe(2);

      const eventsAfter = await listEvents(draftMatch.id);
      expect(eventsAfter.length).toBe(eventsBefore.length);
    });

    it('store with an older version is reset exactly once', () => {
      const oldStore = {
        version: 'v1.0-legacy',
        matches: [{ id: 'old-match', status: 'draft' }],
        events: []
      };
      localStorage.setItem('demo_matches_store', JSON.stringify(oldStore));

      const freshStore = getDemoStore();
      expect(freshStore.version).toBe(DEMO_STORE_VERSION);
      expect(freshStore.matches.length).toBeGreaterThanOrEqual(2);
      expect(freshStore.matches.some((m) => m.id === 'old-match')).toBe(false);
    });
  });

  describe('3. Finalise Dialog Defaults & Validation', () => {
    it('MatchRecapModal: scores are empty by default, submit blocked until filled, hint counts goals', () => {
      const dummyMatch = {
        id: 'test-m-1',
        opponent_name: 'Lawan Uji',
        status: 'draft',
        match_format: '11v11'
      };
      const dummyEvents = [
        { id: 'e1', team: 'own', event_type: 'goal', minute: 10 },
        { id: 'e2', team: 'own', event_type: 'goal', minute: 25 },
        { id: 'e3', team: 'opponent', event_type: 'goal', minute: 40 }
      ];

      const onFinalise = vi.fn();
      render(
        <MatchRecapModal
          isOpen={true}
          onClose={() => {}}
          match={dummyMatch}
          events={dummyEvents}
          outbox={[]}
          onFinaliseMatch={onFinalise}
        />
      );

      // Click "Selesaikan laga" to open score finalise dialog
      const openScoreDialogBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      fireEvent.click(openScoreDialogBtn);

      const ownInput = screen.getByLabelText(/Skor tim sendiri/i);
      const oppInput = screen.getByLabelText(/Skor tim lawan/i);

      expect(ownInput.value).toBe('');
      expect(oppInput.value).toBe('');

      // Submit button is disabled when inputs are empty
      const submitBtn = screen.getByRole('button', { name: /Simpan & finalkan/i });
      expect(submitBtn).toBeDisabled();

      // Hint displays logged goal count
      expect(screen.getByText(/Gol tercatat:/i)).toBeInTheDocument();
      expect(screen.getByText(/2 - 1/)).toBeInTheDocument();

      // Click "Pakai angka ini" button
      const pakaiBtn = screen.getByRole('button', { name: /Pakai angka ini/i });
      fireEvent.click(pakaiBtn);

      expect(ownInput.value).toBe('2');
      expect(oppInput.value).toBe('1');
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);
      expect(onFinalise).toHaveBeenCalledWith(2, 1);
    });

    it('MatchDetailPage finalise dialog: scores empty by default and submit blocked until both filled', async () => {
      const matches = await listMatches();
      const draftMatch = matches.find((m) => m.status === 'draft');

      render(
        <PlayersProvider>
          <MemoryRouter initialEntries={[`/laga/${draftMatch.id}`]}>
            <Routes>
              <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
            </Routes>
          </MemoryRouter>
        </PlayersProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Selesaikan laga/i })).toBeInTheDocument();
      });

      const openDialogBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      fireEvent.click(openDialogBtn);

      await waitFor(() => {
        expect(screen.getByLabelText(/Skor tim sendiri/i)).toBeInTheDocument();
      });

      const ownInput = screen.getByLabelText(/Skor tim sendiri/i);
      const oppInput = screen.getByLabelText(/Skor tim lawan/i);

      expect(ownInput.value).toBe('');
      expect(oppInput.value).toBe('');

      const confirmBtn = screen.getByRole('button', { name: /Simpan & finalkan/i });
      expect(confirmBtn).toBeDisabled();

      expect(screen.getByText(/Gol tercatat:/i)).toBeInTheDocument();
    });
  });

  describe('4. Pertumbuhan Page Summary Consistency', () => {
    it('both /pemain/:publicId and /pemain/:publicId/pertumbuhan render the same assessment period, top indicators, fitness test date and player id', async () => {
      const p = playersRoster[0];
      const targetId = p.public_id || p.player_id;

      const { container: passportContainer } = render(
        <PlayersProvider>
          <MemoryRouter initialEntries={[`/pemain/${targetId}`]}>
            <Routes>
              <Route path="/pemain/:publicId" element={<PassportPage userRole="coach" />} />
            </Routes>
          </MemoryRouter>
        </PlayersProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`ID: ${targetId}`))).toBeInTheDocument();
      });

      const passportText = passportContainer.textContent;
      expect(passportText).toContain(targetId);
      expect(passportText).toContain(p.ai_coach_evaluation.period);
      expect(passportText).toContain(p.fitness_benchmarks.test_date);

      const { container: growthContainer } = render(
        <PlayersProvider>
          <MemoryRouter initialEntries={[`/pemain/${targetId}/pertumbuhan`]}>
            <Routes>
              <Route path="/pemain/:publicId/pertumbuhan" element={<GrowthPage userRole="coach" />} />
            </Routes>
          </MemoryRouter>
        </PlayersProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByText(new RegExp(`ID: ${targetId}`)).length).toBeGreaterThan(0);
      });

      const growthText = growthContainer.textContent;
      expect(growthText).toContain(targetId);
      expect(growthText).toContain(p.ai_coach_evaluation.period);
      expect(growthText).toContain(p.fitness_benchmarks.test_date);
    });
  });

  describe('5. Demo Consent Data & Modal Invariants', () => {
    it('all demo consent seeds satisfy PDP invariants: public_profile implies training_analysis; private tier implies public_profile false', () => {
      const consents = getInitialDemoConsents();
      for (const c of consents) {
        const player = playersRoster.find((p) => p.player_id === c.player_id);
        expect(player).toBeDefined();

        // Invariant 1: public_profile true => training_analysis true
        if (c.purposes.public_profile) {
          expect(c.purposes.training_analysis).toBe(true);
        }

        // Invariant 2: visibility_tier === 'private' => public_profile false
        if (player.visibility_tier === 'private') {
          expect(c.purposes.public_profile).toBe(false);
        }
      }
    });

    it('ConsentManagerModal replaces checkboxes with read-only status rows and shows unavailable notice', () => {
      const p = playersRoster[0];
      const { container } = render(
        <ConsentManagerModal
          isOpen={true}
          onClose={() => {}}
          player={p}
        />
      );

      // No checkbox inputs
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);

      // Status rows present
      expect(screen.getByTestId('purpose-row-training_analysis')).toBeInTheDocument();
      expect(screen.getByTestId('purpose-row-share_with_scouts')).toBeInTheDocument();
      expect(screen.getByTestId('purpose-row-public_profile')).toBeInTheDocument();

      // Notice line present
      expect(
        screen.getByText('Pencatatan persetujuan oleh wali belum tersedia di versi ini')
      ).toBeInTheDocument();
    });
  });

  describe('6. Squad Table Layout & Tight Padding', () => {
    it('Table renders with tightened padding and wraps long player names', () => {
      const { container } = render(
        <MemoryRouter>
          <SquadHubView
            players={playersRoster}
            userRole="coach"
            onViewPassport={() => {}}
            onEvaluatePlayer={() => {}}
          />
        </MemoryRouter>
      );

      const tableEl = container.querySelector('table');
      expect(tableEl).toBeInTheDocument();

      // Aksi column headers and buttons are rendered
      expect(screen.getByText('Aksi')).toBeInTheDocument();
      const pasporBtns = screen.getAllByRole('button', { name: /Paspor/i });
      expect(pasporBtns.length).toBeGreaterThan(0);

      // Player name button has break-words / whitespace-normal
      const nameBtns = screen.getAllByRole('button', { name: /Dimas Arya/i });
      expect(nameBtns[0].className).toContain('whitespace-normal');
      expect(nameBtns[0].className).toContain('break-words');
    });
  });

  describe('7. Small Fixes (Indonesian Labels, Sync Status, Removed Placeholders)', () => {
    it('TactileKeypad quick-action tiles show Indonesian labels only (no raw codes like foul_won)', () => {
      const { container } = render(
        <TactileKeypad
          match={{ pitch_length_m: 90, pitch_width_m: 60 }}
          participants={[]}
          selectedPlayerId={null}
        />
      );

      const text = container.textContent;
      expect(text).not.toContain('foul_won');
      expect(text).not.toContain('foul_committed');
      expect(text).not.toContain('ball_recovery');
      expect(text).not.toContain('ball_loss');
      expect(text).not.toContain('key_pass');
      expect(text).not.toContain('shot_on_target');

      expect(screen.getByText('Pelanggaran didapat')).toBeInTheDocument();
      expect(screen.getByText('Pelanggaran dibuat')).toBeInTheDocument();
      expect(screen.getByText('Rebut bola')).toBeInTheDocument();
      expect(screen.getByText('Kehilangan bola')).toBeInTheDocument();
    });

    it('EventStreamLog shows "Tersimpan di perangkat (mode demo)" in demo mode', () => {
      render(
        <EventStreamLog
          events={[{ id: '1', event_type: 'pass', outcome: 'success' }]}
          outbox={[]}
          playerMap={{}}
          isDemoMode={true}
        />
      );

      expect(
        screen.getByText(/Tersimpan di perangkat \(mode demo\): 1 · Menunggu sinkron: 0/i)
      ).toBeInTheDocument();
    });

    it('all demo players have a single consistent fitness test date source', () => {
      for (const p of playersRoster) {
        expect(p.fitness_benchmarks).toBeDefined();
        expect(p.fitness_benchmarks.test_date).toBe('2026-10-24');
      }
    });
  });
});
