import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import SquadHubView from '../components/SquadHubView';
import PlayerHeader from '../components/PlayerHeader';
import PassportPage from '../pages/PassportPage';
import FitnessStrip from '../components/FitnessStrip';

// Mock usePlayers hook for PassportPage tests
vi.mock('../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: [
      {
        player_id: 'p-01',
        public_id: 'WK-2026-0042',
        personal_info: {
          full_name: 'Dimas Arya Pratama',
          nickname: 'Arya',
          jersey_number: 10,
          position: 'Attacking Midfielder (CAM)',
          age_group: 'U-13',
          preferred_foot: 'Both',
          academy: { name: 'Mataram Putra FA', city: 'Yogyakarta' }
        },
        radar_attributes: [
          { attribute: 'Pace (Kecepatan)', value: 84 },
          { attribute: 'Shooting (Finishing)', value: 78 },
          { attribute: 'Passing (Distribusi)', value: 89 },
          { attribute: 'Dribbling (Kontrol)', value: 82 },
          { attribute: 'Defending (Pressing)', value: 65 },
          { attribute: 'Physical (Daya Tahan)', value: 71 }
        ],
        fitness_benchmarks: {
          test_date: '2026-10-24',
          vertical_jump_cm: 44.5,
          sprint_20m_sec: 3.42,
          shuttle_run_sec: 11.2,
          yoyo_level: 'Level 15.4'
        },
        ai_coach_evaluation: {
          period: 'Oktober 2026',
          coach_name: 'Coach Hendro',
          narrative: 'Visi bermain dan operan terobosan akurat saat transisi positif.',
          strengths: ['Visi umpan', 'Kontrol'],
          growth_areas: ['Duel perebutan bola'],
          recommended_drill: { title: 'Wall Pass' }
        },
        verified_moments: [
          {
            id: 'clip-1',
            title: 'Assist Terobosan',
            match: 'vs Sleman United',
            minute: '24',
            category: 'Key Pass',
            video_url: 'https://example.com/clip1.mp4'
          }
        ]
      }
    ],
    loading: false
  })
}));

describe('B5: Squad & Passport Migration Tests', () => {
  const samplePlayers = [
    {
      player_id: 'p-01',
      public_id: 'WK-01',
      personal_info: {
        full_name: 'Dimas Arya Pratama',
        nickname: 'Dimas',
        jersey_number: 10,
        position: 'Gelandang Serang (CAM)',
        evaluation_status: 'ready'
      },
      fitness_benchmarks: { test_date: '2026-10-20' },
      ai_coach_evaluation: { period: 'Oktober 2026' },
      radar_attributes: [
        { attribute: 'Pace', value: 84 },
        { attribute: 'Shooting', value: 78 },
        { attribute: 'Passing', value: 86 },
        { attribute: 'Dribbling', value: 83 },
        { attribute: 'Defending', value: 68 },
        { attribute: 'Physical', value: 76 }
      ]
    },
    {
      player_id: 'p-02',
      public_id: 'WK-02',
      personal_info: {
        full_name: 'Budi Santoso',
        nickname: 'Budi',
        jersey_number: 7,
        position: 'Penyerang Sayap (RW)',
        evaluation_status: 'pending'
      },
      fitness_benchmarks: { test_date: '2026-09-15' },
      ai_coach_evaluation: { period: 'September 2026' },
      radar_attributes: [
        { attribute: 'Pace', value: 88 },
        { attribute: 'Shooting', value: 72 },
        { attribute: 'Passing', value: 74 },
        { attribute: 'Dribbling', value: 80 },
        { attribute: 'Defending', value: 60 },
        { attribute: 'Physical', value: 70 }
      ]
    },
    {
      player_id: 'p-03',
      public_id: 'WK-03',
      personal_info: {
        full_name: 'Agus Setiawan',
        nickname: 'Agus',
        jersey_number: 2,
        position: 'Bek Kanan (RB)',
        evaluation_status: 'none'
      },
      fitness_benchmarks: { test_date: '2026-11-01' },
      ai_coach_evaluation: { period: 'November 2026' },
      radar_attributes: []
    }
  ];

  describe('1. Squad Table Sorting Tests', () => {
    it('squad table sorts by each option (name, jersey, position, assessment date)', () => {
      const onViewPassport = vi.fn();
      const onEvaluatePlayer = vi.fn();

      render(
        <SquadHubView
          players={samplePlayers}
          userRole="coach"
          onViewPassport={onViewPassport}
          onEvaluatePlayer={onEvaluatePlayer}
        />
      );

      // Verify default sort by name ascending (Agus, Budi, Dimas)
      let rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('Agus Setiawan');
      expect(rows[1]).toHaveTextContent('Budi Santoso');
      expect(rows[2]).toHaveTextContent('Dimas Arya Pratama');

      // Sort by Jersey Number via header click
      const jerseyHeader = screen.getByRole('button', { name: /No\./i });
      fireEvent.click(jerseyHeader);

      rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('#2');
      expect(rows[0]).toHaveTextContent('Agus Setiawan');
      expect(rows[1]).toHaveTextContent('#7');
      expect(rows[1]).toHaveTextContent('Budi Santoso');
      expect(rows[2]).toHaveTextContent('#10');
      expect(rows[2]).toHaveTextContent('Dimas Arya Pratama');

      // Sort by Position via header click
      const posHeader = screen.getByRole('button', { name: /^Posisi$/i });
      fireEvent.click(posHeader);

      rows = screen.getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('Bek Kanan (RB)');
      expect(rows[1]).toHaveTextContent('Gelandang Serang (CAM)');
      expect(rows[2]).toHaveTextContent('Penyerang Sayap (RW)');

      // Sort by Assessment Date via header click
      const dateHeader = screen.getByRole('button', { name: /Asesmen terakhir/i });
      fireEvent.click(dateHeader);

      rows = screen.getAllByRole('row').slice(1);
      // Ascending dates: September (p-02), Oktober (p-01), November (p-03)
      expect(rows[0]).toHaveTextContent('September 2026');
      expect(rows[1]).toHaveTextContent('Oktober 2026');
      expect(rows[2]).toHaveTextContent('November 2026');
    });

    it('row action "Evaluasi" appears only for coach/admin role', () => {
      const onViewPassport = vi.fn();
      const onEvaluatePlayer = vi.fn();

      // Render as public
      const { rerender } = render(
        <SquadHubView
          players={samplePlayers}
          userRole="public"
          onViewPassport={onViewPassport}
          onEvaluatePlayer={onEvaluatePlayer}
        />
      );

      expect(screen.queryByRole('button', { name: /Evaluasi/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Paspor/i }).length).toBeGreaterThan(0);

      // Re-render as coach
      rerender(
        <SquadHubView
          players={samplePlayers}
          userRole="coach"
          onViewPassport={onViewPassport}
          onEvaluatePlayer={onEvaluatePlayer}
        />
      );

      expect(screen.getAllByRole('button', { name: /Evaluasi/i }).length).toBe(samplePlayers.length);
    });
  });

  describe('2. Missing Data Honesty ("Belum ada data")', () => {
    it('no-assessment player shows "Belum ada data" across components', () => {
      const emptyPlayer = {
        player_id: 'p-empty',
        public_id: 'WK-EMPTY',
        personal_info: {
          full_name: 'Pemain Tanpa Asesmen',
          jersey_number: 99,
          position: 'Striker'
        },
        radar_attributes: [],
        fitness_benchmarks: {},
        ai_coach_evaluation: {}
      };

      // In SquadHubView table
      render(
        <SquadHubView
          players={[emptyPlayer]}
          userRole="public"
          onViewPassport={() => {}}
          onEvaluatePlayer={() => {}}
        />
      );

      // Indicators column should show "Belum ada data"
      expect(screen.getAllByText('Belum ada data').length).toBeGreaterThan(0);

      // In PlayerHeader 5-line summary
      render(<PlayerHeader player={emptyPlayer} personalInfo={emptyPlayer.personal_info} />);
      expect(screen.getAllByText('Belum ada data').length).toBeGreaterThanOrEqual(3);

      // In FitnessStrip
      render(<FitnessStrip benchmarks={{}} />);
      expect(screen.getAllByText('Belum ada data').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('3. Passport Attribute Top 3 Ordering', () => {
    it('passport shows the three highest attributes in correct order', () => {
      const playerWithAttrs = {
        player_id: 'p-01',
        public_id: 'WK-TEST-01',
        personal_info: {
          full_name: 'Test Athlete',
          jersey_number: 10,
          position: 'Midfielder'
        },
        radar_attributes: [
          { attribute: 'Pace (Kecepatan)', value: 84 },
          { attribute: 'Shooting (Finishing)', value: 78 },
          { attribute: 'Passing (Distribusi)', value: 89 },
          { attribute: 'Dribbling (Kontrol)', value: 82 },
          { attribute: 'Defending (Pressing)', value: 65 },
          { attribute: 'Physical (Daya Tahan)', value: 71 }
        ]
      };

      render(<PlayerHeader player={playerWithAttrs} personalInfo={playerWithAttrs.personal_info} />);

      // Highest 3: Passing (89), Pace (84), Dribbling (82)
      const summaryText = screen.getByText(/4\. Indikator atribut tertinggi:/i).closest('div').textContent;

      expect(summaryText).toMatch(/(Passing|Operan): 89 \(skala 0-100\)/);
      expect(summaryText).toMatch(/(Pace|Kecepatan): 84 \(skala 0-100\)/);
      expect(summaryText).toMatch(/(Dribbling|Menggiring): 82 \(skala 0-100\)/);

      // Verify order: 89 before 84, 84 before 82
      const idx89 = summaryText.indexOf('89');
      const idx84 = summaryText.indexOf('84');
      const idx82 = summaryText.indexOf('82');

      expect(idx89).toBeLessThan(idx84);
      expect(idx84).toBeLessThan(idx82);
    });
  });

  describe('4. Superlative & HUD Language Prohibition', () => {
    it('passport contains none of the words "OVR", "Elite", "Top tier"', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/pemain/WK-2026-0042']}>
          <Routes>
            <Route path="/pemain/:publicId" element={<PassportPage />} />
          </Routes>
        </MemoryRouter>
      );

      const content = container.textContent || '';

      expect(content).not.toMatch(/\bOVR\b/i);
      expect(content).not.toMatch(/\bElite\b/i);
      expect(content).not.toMatch(/\bTop tier\b/i);
    });
  });

  describe('5. Print Stylesheet Rules Assertion', () => {
    it('print stylesheet hides nav and buttons (assert the rule exists)', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // Verify @media print block exists
      expect(cssContent).toContain('@media print');

      // Verify rules hide header, nav, button, input, select
      const printMatch = cssContent.match(/@media\s+print\s*\{([\s\S]+?)\n\}/);
      expect(printMatch).not.toBeNull();

      const printBody = printMatch[1];
      expect(printBody).toMatch(/nav/);
      expect(printBody).toMatch(/button/);
      expect(printBody).toMatch(/display:\s*none\s*!important/);
    });
  });
});
