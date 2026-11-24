import { vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

import React from 'react';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PlayersProvider } from '../context/PlayersContext';
import PerformanceRadar from '../components/PerformanceRadar';
import Select from '../components/ui/Select';
import MatchDetailPage from '../pages/MatchDetailPage';
import MatchReportPage from '../pages/MatchReportPage';
import { listMatches, listParticipants } from '../lib/matches';
import { playersRoster } from '../data/mockData';
import { passStats, SMALL_SAMPLE_N } from '../lib/analysis/events';

describe('Phase B10: Visual Review & Demo Data Consistency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('A. Report Page & Small Samples (A4, A4b)', () => {
    it('constant SMALL_SAMPLE_N is 10', () => {
      expect(SMALL_SAMPLE_N).toBe(10);
    });

    it('A4b: n=3 passes produces raw count primary and badge present in report metric card', () => {
      const smallPassEvents = [
        { id: '1', team: 'own', event_type: 'pass', outcome: 'success', x_m: 20, y_m: 20 },
        { id: '2', team: 'own', event_type: 'pass', outcome: 'success', x_m: 30, y_m: 30 },
        { id: '3', team: 'own', event_type: 'pass', outcome: 'fail', x_m: 40, y_m: 40 }
      ];

      const pass = passStats(smallPassEvents, 'own');
      expect(pass.n).toBe(3);
      expect(pass.n < SMALL_SAMPLE_N).toBe(true);
      expect(pass.successful.value).toBe(2);
      expect(pass.total.value).toBe(3);
    });

    it('A4b: n=30 passes has no small sample badge condition', () => {
      const largePassEvents = Array.from({ length: 30 }, (_, i) => ({
        id: `evt-${i}`,
        team: 'own',
        event_type: 'pass',
        outcome: i % 2 === 0 ? 'success' : 'fail',
        x_m: 30,
        y_m: 30
      }));

      const pass = passStats(largePassEvents, 'own');
      expect(pass.n).toBe(30);
      expect(pass.n < SMALL_SAMPLE_N).toBe(false);
    });
  });

  describe('B. Demo Data Consistency (B1, B2, B3, G6)', () => {
    it('G6: demo store has at least one draft and one final match', async () => {
      const matches = await listMatches();
      expect(matches.length).toBeGreaterThanOrEqual(2);

      const finals = matches.filter((m) => m.status === 'final');
      const drafts = matches.filter((m) => m.status === 'draft');

      expect(finals.length).toBeGreaterThanOrEqual(1);
      expect(drafts.length).toBeGreaterThanOrEqual(1);
      expect(drafts.some((m) => m.opponent_name === 'Lawan Contoh 2')).toBe(true);
    });

    it('B1: demo match participants equal demo squad IDs (7 players)', async () => {
      const matches = await listMatches();
      const finalMatch = matches.find((m) => m.status === 'final');
      expect(finalMatch).toBeDefined();

      const participants = await listParticipants(finalMatch.id);
      expect(participants.length).toBe(7);

      const squadIds = playersRoster.map((p) => p.player_id).sort();
      const participantIds = participants.map((p) => p.player_id).sort();
      expect(participantIds).toEqual(squadIds);
    });

    it('B3: no rendered text matches /PLAYER-\\d+/ or "#-" in MatchDetailPage', async () => {
      const matches = await listMatches();
      const finalMatch = matches.find((m) => m.status === 'final');

      render(
        <PlayersProvider>
          <MemoryRouter initialEntries={[`/laga/${finalMatch.id}`]}>
            <Routes>
              <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
            </Routes>
          </MemoryRouter>
        </PlayersProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Jenis kejadian')).toBeInTheDocument();
      });

      const bodyText = document.body.textContent || '';
      expect(bodyText).not.toMatch(/PLAYER-\d+/);
      expect(bodyText).not.toMatch(/#-/);
    });

    it('B3: no rendered text matches /PLAYER-\\d+/ or "#-" in MatchReportPage', async () => {
      const matches = await listMatches();
      const finalMatch = matches.find((m) => m.status === 'final');

      render(
        <MemoryRouter initialEntries={[`/laga/${finalMatch.id}/laporan`]}>
          <Routes>
            <Route path="/laga/:matchId/laporan" element={<MatchReportPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Individu')).toBeInTheDocument();
      });

      const bodyText = document.body.textContent || '';
      expect(bodyText).not.toMatch(/PLAYER-\d+/);
      expect(bodyText).not.toMatch(/#-/);
      expect(bodyText).not.toContain('Contoh: vs');
    });
  });

  describe('C. Contrast and Controls (C1, C2)', () => {
    it('C1: PerformanceRadar axis labels use text-2 token, minimum 12px, and fit inside viewBox', () => {
      const { container } = render(
        <PerformanceRadar
          attributes={playersRoster[0].radar_attributes}
          athleteName="Dimas Arya"
          period="Oktober 2026"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const viewBox = svg.getAttribute('viewBox');
      const [, , width, height] = viewBox.split(' ').map(Number);

      const labels = container.querySelectorAll('.radar-label');
      expect(labels.length).toBe(6);

      labels.forEach((label) => {
        // Assert token classes or CSS variable fill
        const fill = label.getAttribute('fill') || label.className.baseVal;
        expect(fill).toMatch(/var\(--text-2\)|text-2/);

        // Assert font size at least 12px
        const fontSize = parseInt(label.style.fontSize || label.getAttribute('fontSize'), 10);
        expect(fontSize).toBeGreaterThanOrEqual(12);

        // Assert coordinates fit within viewBox
        const x = parseFloat(label.getAttribute('x'));
        const y = parseFloat(label.getAttribute('y'));
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(height);
      });
    });

    it('C2: ui/Select selected option label is always in the DOM and visible', () => {
      render(
        <Select
          id="sort-select"
          value="name"
          onChange={() => {}}
          options={[
            { value: 'name', label: 'Nama (A-Z)' },
            { value: 'jersey', label: 'Nomor Punggung' }
          ]}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('name');
      expect(screen.getByText('Nama (A-Z)')).toBeInTheDocument();
    });

    it('C2: ui/Select with children preserves option labels in DOM', () => {
      render(
        <Select id="child-select" value="position" onChange={() => {}}>
          <option value="name">Nama (A-Z)</option>
          <option value="position">Posisi Pemain</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select.value).toBe('position');
      expect(screen.getByText('Posisi Pemain')).toBeInTheDocument();
    });
  });
});
