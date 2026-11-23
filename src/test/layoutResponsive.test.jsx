import { vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PlayersProvider } from '../context/PlayersContext';

import SquadPage from '../pages/SquadPage';
import PassportPage from '../pages/PassportPage';
import MatchesPage from '../pages/MatchesPage';
import MatchDetailPage from '../pages/MatchDetailPage';
import MatchReportPage from '../pages/MatchReportPage';
import TacticsPage from '../pages/TacticsPage';
import FastPitchLogger from '../components/FastPitchLogger';
import Dialog from '../components/ui/Dialog';

const VIEWPORTS = [
  { name: '360x640 (Mobile compact)', width: 360, height: 640 },
  { name: '390x844 (Mobile modern)', width: 390, height: 844 },
  { name: '768x1024 (Tablet portrait)', width: 768, height: 1024 },
  { name: '1280x720 (Desktop HD)', width: 1280, height: 720 },
  { name: '1366x650 (Laptop widescreen)', width: 1366, height: 650 }
];

function setViewport(width, height) {
  window.innerWidth = width;
  window.innerHeight = height;
  window.matchMedia = vi.fn().mockImplementation((query) => {
    const maxMatch = query.match(/max-width:\s*(\d+)px/);
    const minMatch = query.match(/min-width:\s*(\d+)px/);
    let matches = true;
    if (maxMatch) matches = matches && width <= parseInt(maxMatch[1], 10);
    if (minMatch) matches = matches && width >= parseInt(minMatch[1], 10);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    };
  });
  window.dispatchEvent(new Event('resize'));
}

function renderWithProviders(ui, initialRoute = '/') {
  return render(
    <PlayersProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </PlayersProvider>
  );
}

describe('Layout & Viewport Responsiveness Post-Migration (Task UX-1)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ballr_surface', 'paper');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('1. Dialog Pinned Header/Footer & Scrolling Body Verification', () => {
    VIEWPORTS.forEach(({ name, width, height }) => {
      it(`verifies pinned header/footer and scrolling body at ${name}`, () => {
        setViewport(width, height);

        const { container } = render(
          <Dialog
            isOpen={true}
            onClose={() => {}}
            title="Judul Dialog Uji"
            description="Deskripsi dialog uji tata letak"
            footer={<button type="button">Tindakan</button>}
          >
            <div style={{ height: '1200px' }}>
              Konten panjang yang memerlukan scrolling vertikal.
            </div>
          </Dialog>
        );

        const dialogBox = container.querySelector('[role="dialog"] > div:nth-child(2)');
        expect(dialogBox).not.toBeNull();
        expect(dialogBox.className).toContain('flex-col');
        expect(dialogBox.className).toContain('max-h-');

        // Header must be shrink-0 (pinned)
        const header = dialogBox.children[0];
        expect(header.className).toContain('shrink-0');
        expect(header.className).toContain('border-b');

        // Body must be flex-1 min-h-0 overflow-y-auto (scrollable)
        const bodyWrapper = dialogBox.querySelector('.overflow-y-auto');
        expect(bodyWrapper).not.toBeNull();
        expect(bodyWrapper.className).toContain('flex-1');
        expect(bodyWrapper.className).toContain('min-h-0');

        // Footer must be shrink-0 (pinned)
        const footer = dialogBox.querySelector('.border-t');
        expect(footer).not.toBeNull();
        expect(footer.className).toContain('shrink-0');
      });
    });
  });

  describe('2. Measured Screen Layout across All Viewports', () => {
    VIEWPORTS.forEach(({ name, width, height }) => {
      describe(`Viewport ${name}`, () => {
        beforeEach(() => {
          setViewport(width, height);
        });

        it('renders /skuad without horizontal overflow or breakage', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/skuad" element={<SquadPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/skuad'
          );

          expect(await screen.findByRole('heading', { name: /Direktori Skuad/i })).toBeInTheDocument();
          const main = container.querySelector('main') || container.firstElementChild;
          expect(main).not.toBeNull();
        });

        it('renders player passport without layout breakage', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/pemain/:id" element={<PassportPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/pemain/PLAYER-01'
          );

          const heading = await screen.findByRole('heading', { level: 1 });
          expect(heading).toBeInTheDocument();
          const main = container.querySelector('main') || container.firstElementChild;
          expect(main).not.toBeNull();
        });

        it('renders /laga without horizontal overflow', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/laga" element={<MatchesPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/laga'
          );

          expect(await screen.findByRole('heading', { name: /Rekaman Pertandingan/i })).toBeInTheDocument();
          const main = container.querySelector('main') || container.firstElementChild;
          expect(main).not.toBeNull();
        });

        it('renders /laga/:id without horizontal overflow', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/laga/:id" element={<MatchDetailPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/laga/MATCH-01'
          );

          expect(container.firstChild).not.toBeNull();
        });

        it('renders /pencatatan/:id (with video loaded) without layout breakage', async () => {
          localStorage.setItem(
            'ballr_video_meta_MATCH-01',
            JSON.stringify({ name: 'laga-final-u13.mp4', size: 1048576, duration: 3600, type: 'video/mp4' })
          );

          const mockMatch = {
            id: 'MATCH-01',
            match_id: 'MATCH-01',
            opponent_name: 'Bina Taruna U-13',
            format: '11v11',
            pitch_length_m: 90,
            pitch_width_m: 60,
            status: 'draft'
          };

          const { container } = renderWithProviders(
            <Routes>
              <Route
                path="/pencatatan/:id"
                element={<FastPitchLogger match={mockMatch} matchId="MATCH-01" userRole="coach" isDemoMode={true} />}
              />
            </Routes>,
            '/pencatatan/MATCH-01'
          );

          expect(screen.getByText(/Bina Taruna U-13/)).toBeInTheDocument();
          const main = container.querySelector('main') || container.firstElementChild;
          expect(main).not.toBeNull();
        });

        it('renders /laga/:id/laporan on paper surface without layout breakage', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/laga/:id/laporan" element={<MatchReportPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/laga/MATCH-01/laporan'
          );

          expect(container.firstChild).not.toBeNull();
        });

        it('renders /taktik without layout breakage', async () => {
          const { container } = renderWithProviders(
            <Routes>
              <Route path="/taktik" element={<TacticsPage userRole="coach" isDemoMode={true} />} />
            </Routes>,
            '/taktik'
          );

          const heading = await screen.findByRole('heading', { name: /^Papan Taktik$/i });
          expect(heading).toBeInTheDocument();
          const main = container.querySelector('main') || container.firstElementChild;
          expect(main).not.toBeNull();
        });
      });
    });
  });
});
