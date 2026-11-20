import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

import TopNav from '../components/TopNav';
import TacticalBoard from '../components/tactics/TacticalBoard';
import TimelineStrip from '../components/tactics/TimelineStrip';
import PlaybackBar from '../components/tactics/PlaybackBar';
import ReferencesPanel from '../components/tactics/ReferencesPanel';
import StoryboardPrintView from '../components/tactics/StoryboardPrintView';
import TacticsPage from '../pages/TacticsPage';
import { BOARD_DISCLAIMER } from '../lib/board';

import.meta.env.VITE_DEMO_MODE = 'true';

describe('Tactical Board & Scenarios Components (Phase 5c)', () => {
  beforeEach(() => {
    localStorage.clear();
    import.meta.env.VITE_DEMO_MODE = 'true';
    vi.restoreAllMocks();
  });

  describe('1. Role Gating & Navigation', () => {
    it('shows "Taktik" link in TopNav for coach and admin, hidden for public/parent', () => {
      // Coach
      const { rerender } = render(
        <MemoryRouter>
          <TopNav userRole="coach" />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Taktik').length).toBeGreaterThanOrEqual(1);

      // Admin
      rerender(
        <MemoryRouter>
          <TopNav userRole="admin" />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Taktik').length).toBeGreaterThanOrEqual(1);

      // Public
      rerender(
        <MemoryRouter>
          <TopNav userRole="public" />
        </MemoryRouter>
      );
      expect(screen.queryByText('Taktik')).toBeNull();

      // Parent
      rerender(
        <MemoryRouter>
          <TopNav userRole="parent" />
        </MemoryRouter>
      );
      expect(screen.queryByText('Taktik')).toBeNull();
    });

    it('blocks unauthenticated public users on TacticsPage and TacticsDetailPage with login action', async () => {
      const handleOpenAuth = vi.fn();

      // TacticsPage public
      render(
        <MemoryRouter>
          <TacticsPage userRole="public" onOpenAuthModal={handleOpenAuth} />
        </MemoryRouter>
      );

      expect(screen.getByText(/Akses Terbatas: Pelatih & Admin/i)).toBeInTheDocument();
      const loginBtn = screen.getByRole('button', { name: /Masuk sebagai staf akademi/i });
      fireEvent.click(loginBtn);
      expect(handleOpenAuth).toHaveBeenCalledWith('tactics');
    });

    it('renders tactical scenarios list on TacticsPage for coach', async () => {
      render(
        <MemoryRouter>
          <TacticsPage userRole="coach" />
        </MemoryRouter>
      );

      // Heading and action button
      expect(screen.getByRole('heading', { name: /Papan Taktik/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skema baru/i })).toBeInTheDocument();

      // Table displays the seeded demo scenario
      await waitFor(() => {
        expect(screen.getByText('Contoh: build-up 3-2-4-1 (ilustrasi)')).toBeInTheDocument();
      });
    });
  });

  describe('2. TacticalBoard Visuals & Interactions', () => {
    const dummyScenario = {
      pitch_length_m: 90,
      pitch_width_m: 60
    };

    const dummyFrame = {
      players: [
        { id: 'own-1', team: 'own', label: '1', role: 'GK', x: 5, y: 30 },
        { id: 'opp-9', team: 'opponent', label: '9', role: 'ST', x: 60, y: 30 }
      ],
      ball: { x: 5, y: 30 },
      arrows: [{ from: { x: 5, y: 30 }, to: { x: 20, y: 15 }, kind: 'pass' }],
      note: 'Instruksi awal'
    };

    it('renders pitch SVG, own/opponent player shapes, ball, and arrows', () => {
      render(<TacticalBoard scenario={dummyScenario} frame={dummyFrame} />);

      // Mandatory coaching disclaimer
      expect(screen.getByText(BOARD_DISCLAIMER)).toBeInTheDocument();

      // Players by aria-label
      expect(screen.getByRole('button', { name: /Pemain Tim Kita nomor 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pemain Lawan nomor 9/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bola pertandingan/i })).toBeInTheDocument();

      // Legend items
      expect(screen.getByText(/Tim Kita \(Lingkaran\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Lawan \(Kotak\)/i)).toBeInTheDocument();
      expect(screen.getByText('Umpan')).toBeInTheDocument();
    });

    it('supports keyboard arrows movement on players (0.5m / Shift+arrow 2m)', () => {
      const handleUpdatePlayer = vi.fn();
      render(
        <TacticalBoard
          scenario={dummyScenario}
          frame={dummyFrame}
          isEditing={true}
          onUpdatePlayerPosition={handleUpdatePlayer}
        />
      );

      const playerBtn = screen.getByRole('button', { name: /Pemain Tim Kita nomor 1/i });

      // ArrowRight (dx = +0.5)
      fireEvent.keyDown(playerBtn, { key: 'ArrowRight' });
      expect(handleUpdatePlayer).toHaveBeenCalledWith('own-1', 5.5, 30);

      // Shift + ArrowRight (dx = +2.0)
      fireEvent.keyDown(playerBtn, { key: 'ArrowRight', shiftKey: true });
      expect(handleUpdatePlayer).toHaveBeenCalledWith('own-1', 7.0, 30);

      // ArrowUp (dy = -0.5)
      fireEvent.keyDown(playerBtn, { key: 'ArrowUp' });
      expect(handleUpdatePlayer).toHaveBeenCalledWith('own-1', 5, 29.5);
    });
  });

  describe('3. PlaybackBar & Accessibility', () => {
    it('renders play/pause, speed options, and loop in standard mode', () => {
      const handleTogglePlay = vi.fn();
      const handleChangeSpeed = vi.fn();
      const handleToggleLoop = vi.fn();

      render(
        <PlaybackBar
          isPlaying={false}
          onTogglePlay={handleTogglePlay}
          playbackSpeed={1}
          onChangeSpeed={handleChangeSpeed}
          isLooping={true}
          onToggleLoop={handleToggleLoop}
          totalFrames={3}
        />
      );

      const playBtn = screen.getByRole('button', { name: /Putar gerakan/i });
      fireEvent.click(playBtn);
      expect(handleTogglePlay).toHaveBeenCalled();

      // Speeds
      const speed2x = screen.getByRole('button', { name: '2x' });
      fireEvent.click(speed2x);
      expect(handleChangeSpeed).toHaveBeenCalledWith(2);

      // Loop toggle
      const loopBtn = screen.getByRole('button', { name: /Ulang terus: Aktif/i });
      fireEvent.click(loopBtn);
      expect(handleToggleLoop).toHaveBeenCalled();
    });

    it('replaces animation controls with step buttons when prefers-reduced-motion is active', () => {
      // Mock window.matchMedia for prefers-reduced-motion: reduce
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));

      const handleStepPrev = vi.fn();
      const handleStepNext = vi.fn();

      render(
        <PlaybackBar
          activeFrameIndex={1}
          totalFrames={3}
          onStepPrevious={handleStepPrev}
          onStepNext={handleStepNext}
        />
      );

      // Animation play button should NOT exist
      expect(screen.queryByRole('button', { name: /Putar gerakan/i })).toBeNull();

      // Step buttons should exist
      const prevBtn = screen.getByRole('button', { name: /Bingkai sebelumnya/i });
      const nextBtn = screen.getByRole('button', { name: /Bingkai berikutnya/i });

      expect(prevBtn).toBeInTheDocument();
      expect(nextBtn).toBeInTheDocument();

      fireEvent.click(prevBtn);
      expect(handleStepPrev).toHaveBeenCalled();

      fireEvent.click(nextBtn);
      expect(handleStepNext).toHaveBeenCalled();
    });
  });

  describe('4. TimelineStrip & ReferencesPanel', () => {
    it('allows selecting, adding, and updating frames in TimelineStrip', () => {
      const handleSelect = vi.fn();
      const handleAdd = vi.fn();
      const handleUpdate = vi.fn();

      const frames = [
        { frame_idx: 0, t_ms: 2000, note: 'Nota 1' },
        { frame_idx: 1, t_ms: 2500, note: 'Nota 2' }
      ];

      render(
        <TimelineStrip
          frames={frames}
          activeFrameIndex={0}
          onSelectFrame={handleSelect}
          onAddFrame={handleAdd}
          onUpdateFrameMeta={handleUpdate}
          isEditing={true}
        />
      );

      // Select frame 2
      const frame2Pill = screen.getByLabelText(/Bingkai 2: Nota 2/i);
      fireEvent.click(frame2Pill);
      expect(handleSelect).toHaveBeenCalledWith(1);

      // Add frame
      const addBtn = screen.getByRole('button', { name: /Tambah bingkai/i });
      fireEvent.click(addBtn);
      expect(handleAdd).toHaveBeenCalled();

      // Note input
      const noteInput = screen.getByLabelText(/Catatan pelatih untuk bingkai 1:/i);
      fireEvent.change(noteInput, { target: { value: 'Catatan diperbarui' } });
      expect(handleUpdate).toHaveBeenCalledWith(0, { note: 'Catatan diperbarui' });
    });

    it('displays warning in ReferencesPanel if all attached references are unverified', () => {
      const references = [
        { reference_id: 'fifa-tcp-spiralling-up', note: 'Catatan 1' }
      ];

      render(
        <ReferencesPanel
          references={references}
          isEditing={false}
        />
      );

      // fifa-tcp-spiralling-up has status 'unverified' in registry
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Peringatan rujukan belum terverifikasi/i)).toBeInTheDocument();
    });
  });

  describe('5. StoryboardPrintView Printable Dossier', () => {
    it('renders A4 landscape print dossier with paper surface and mandatory disclaimer', () => {
      const scenario = {
        title: 'Skema Build-up Cetak',
        phase: 'build_up',
        format: '11v11',
        pitch_length_m: 90,
        pitch_width_m: 60,
        status: 'published',
        reviewed_by: 'Pelatih Penguji',
        reviewed_at: '2026-03-01T10:00:00Z'
      };

      const frames = [
        {
          frame_idx: 0,
          t_ms: 2000,
          players: [{ id: 'own-1', team: 'own', label: '1', x: 10, y: 30 }],
          ball: { x: 10, y: 30 },
          arrows: [],
          note: 'Konstruksi dari penjaga gawang'
        }
      ];

      const references = [
        {
          reference_id: 'fifa-tcp-spiralling-up',
          title: 'FIFA Training Centre Framework',
          status: 'verified'
        }
      ];

      const { container } = render(
        <StoryboardPrintView
          scenario={scenario}
          frames={frames}
          references={references}
        />
      );

      // Surface attribute is paper
      const surfaceRoot = container.querySelector('[data-surface="paper"]');
      expect(surfaceRoot).not.toBeNull();

      expect(screen.getByRole('heading', { name: /Skema Build-up Cetak/i })).toBeInTheDocument();
      expect(screen.getByText(/Ditinjau oleh:/i)).toBeInTheDocument();
      expect(screen.getByText('Pelatih Penguji')).toBeInTheDocument();
      expect(screen.getByText(BOARD_DISCLAIMER)).toBeInTheDocument();
      expect(screen.getByText('Konstruksi dari penjaga gawang')).toBeInTheDocument();
    });
  });

  describe('6. Zero Forbidden Words & Design Rules Scanner', () => {
    const targetFiles = [
      'src/lib/board.js',
      'src/lib/scenarios.js',
      'src/components/tactics/TacticalBoard.jsx',
      'src/components/tactics/TimelineStrip.jsx',
      'src/components/tactics/PlaybackBar.jsx',
      'src/components/tactics/ReferencesPanel.jsx',
      'src/components/tactics/StoryboardPrintView.jsx',
      'src/pages/TacticsPage.jsx',
      'src/pages/TacticsDetailPage.jsx'
    ];

    it('contains ZERO forbidden words ("optimal", "ideal", "seharusnya")', () => {
      const forbiddenPatterns = [
        /\boptimal\b/i,
        /\bideal\b/i,
        /\bseharusnya\b/i
      ];

      for (const relPath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          const match = content.match(pattern);
          expect(match, `Forbidden word ${pattern} found in ${relPath}`).toBeNull();
        }
      }
    });

    it('contains ZERO arbitrary text sizes (text-[Npx] / text-[Nrem]) in tactics UI files', () => {
      const uiFiles = [
        'src/components/tactics/TacticalBoard.jsx',
        'src/components/tactics/TimelineStrip.jsx',
        'src/components/tactics/PlaybackBar.jsx',
        'src/components/tactics/ReferencesPanel.jsx',
        'src/components/tactics/StoryboardPrintView.jsx',
        'src/pages/TacticsPage.jsx',
        'src/pages/TacticsDetailPage.jsx'
      ];

      const arbitraryTextRegex = /text-\[\d+(\.\d+)?(px|rem)\]/g;

      for (const relPath of uiFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(arbitraryTextRegex);
        expect(matches, `Arbitrary text size found in ${relPath}: ${matches}`).toBeNull();
      }
    });

    it('contains ZERO dark: prefixes or hardcoded hex colors in tactics UI files', () => {
      const uiFiles = [
        'src/components/tactics/TacticalBoard.jsx',
        'src/components/tactics/TimelineStrip.jsx',
        'src/components/tactics/PlaybackBar.jsx',
        'src/components/tactics/ReferencesPanel.jsx',
        'src/components/tactics/StoryboardPrintView.jsx',
        'src/pages/TacticsPage.jsx',
        'src/pages/TacticsDetailPage.jsx'
      ];

      const darkPrefixRegex = /dark:[a-zA-Z0-9_-]+/g;
      const hexColorRegex = /#([0-9a-fA-F]{3}){1,2}\b/g;

      for (const relPath of uiFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const darkMatches = content.match(darkPrefixRegex);
        expect(darkMatches, `dark: class found in ${relPath}: ${darkMatches}`).toBeNull();

        const hexMatches = content.match(hexColorRegex);
        expect(hexMatches, `hex color found in ${relPath}: ${hexMatches}`).toBeNull();
      }
    });
  });
});
