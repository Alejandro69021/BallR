import { vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InstallAppBanner from '../components/InstallAppBanner';
import LocalVideoPanel, { hasStoredVideoMeta } from '../components/video/LocalVideoPanel';
import MatchDetailPage from '../pages/MatchDetailPage';

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
          position: 'Gelandang Serang'
        }
      }
    ],
    loading: false,
    error: null,
    isDemoMode: true
  })
}));

describe('Video Logger Ergonomics & Collision Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn((file) => `blob:mock-${file.name}`);
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Fixed-element collisions: InstallAppBanner route exclusion', () => {
    it('renders nothing on /pencatatan/:id route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/pencatatan/demo-match-1']}>
          <InstallAppBanner />
        </MemoryRouter>
      );
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText(/Aplikasi lapangan/i)).toBeNull();
    });

    it('renders on /skuad route', () => {
      render(
        <MemoryRouter initialEntries={['/skuad']}>
          <InstallAppBanner />
        </MemoryRouter>
      );
      expect(screen.getByText(/Aplikasi lapangan/i)).toBeInTheDocument();
      expect(screen.getByText(/PWA/i)).toBeInTheDocument();
    });
  });

  describe('2. Compact Video Panel & Offset Collapsible Section', () => {
    it('auto-collapses offset section when Babak 1 offset is saved and period is 1', () => {
      // Set offset for Babak 1 (60s)
      localStorage.setItem('ballr_video_offset_match-ergo-1', JSON.stringify({ p1: 60, p2: null, p2StartMin: null }));

      render(
        <LocalVideoPanel matchId="match-ergo-1" period={1} />
      );

      // Offset summary should be visible
      const summary = screen.getByTestId('offset-summary');
      expect(summary).toBeInTheDocument();
      expect(summary.textContent).toContain('Sinkron: Babak 1 mulai 01:00');
      expect(screen.getByRole('button', { name: 'Ubah' })).toBeInTheDocument();

      // Full period inputs should NOT be rendered while collapsed
      expect(screen.queryByPlaceholderText(/Peluit mulai video/i)).toBeNull();
    });

    it('clicking "Ubah" re-expands the offset cards so user can edit', () => {
      localStorage.setItem('ballr_video_offset_match-ergo-2', JSON.stringify({ p1: 10, p2: null, p2StartMin: null }));

      render(
        <LocalVideoPanel matchId="match-ergo-2" period={1} />
      );

      const ubahBtn = screen.getByRole('button', { name: 'Ubah' });
      fireEvent.click(ubahBtn);

      // Now inputs should be visible
      expect(screen.getByPlaceholderText(/Peluit mulai video/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Selesai mengubah/i })).toBeInTheDocument();

      // User can collapse back
      fireEvent.click(screen.getByRole('button', { name: /Selesai mengubah/i }));
      expect(screen.getByTestId('offset-summary')).toBeInTheDocument();
    });

    it('stays expanded with warning when period 2 is active but offset or p2StartMin is incomplete', () => {
      // Incomplete period 2: p1 is set, but p2 is null
      localStorage.setItem('ballr_video_offset_match-ergo-3', JSON.stringify({ p1: 60, p2: null, p2StartMin: null }));

      render(
        <LocalVideoPanel matchId="match-ergo-3" period={2} />
      );

      // Summary must NOT be present
      expect(screen.queryByTestId('offset-summary')).toBeNull();

      // Warning text must be visible
      expect(screen.getByText(/Belum ada offset lengkap untuk babak ini: penandaan kejadian memakai stopwatch/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Peluit video \(mm:ss\)/i)).toBeInTheDocument();
    });

    it('auto-collapses when both Babak 1 and Babak 2 offsets are complete in period 2', () => {
      // Complete period 2: p1=10s, p2=3150s (52:30), p2StartMin=45
      localStorage.setItem(
        'ballr_video_offset_match-ergo-4',
        JSON.stringify({ p1: 10, p2: 3150, p2StartMin: 45 })
      );

      render(
        <LocalVideoPanel matchId="match-ergo-4" period={2} />
      );

      const summary = screen.getByTestId('offset-summary');
      expect(summary).toBeInTheDocument();
      expect(summary.textContent).toContain('Sinkron: Babak 1 mulai 00:10 · Babak 2 mulai 52:30 (menit 45)');
    });
  });

  describe('3. Video Element Contract & Mobile Mini Player', () => {
    it('video element has max-h-[40vh] and mini-player wrapper has sticky classes on < lg', () => {
      const { container } = render(
        <LocalVideoPanel matchId="match-ergo-5" />
      );

      // Load a video
      const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
      const dummyFile = new File(['dummy bytes'], 'match_tape.mp4', { type: 'video/mp4' });
      fireEvent.change(fileInput, { target: { files: [dummyFile] } });

      // Check mini-player wrapper has sticky classes on mobile (< lg) and static on desktop (>= lg)
      const miniPlayer = screen.getByTestId('mini-player');
      expect(miniPlayer).toBeInTheDocument();
      expect(miniPlayer.className).toContain('sticky');
      expect(miniPlayer.className).toContain('top-14');
      expect(miniPlayer.className).toContain('z-20');
      expect(miniPlayer.className).toContain('lg:static');

      // Check video element has max-h-[40vh]
      const videoEl = container.querySelector('video');
      expect(videoEl).not.toBeNull();
      expect(videoEl.className).toContain('max-h-[40vh]');
      expect(videoEl.className).toContain('object-contain');

      // Check letterbox container has bg-black
      const videoBox = videoEl.parentElement;
      expect(videoBox.className).toContain('bg-black');
      expect(videoBox.className).toContain('max-h-[40vh]');
    });

    it('toggle "Kecilkan video" / "Perbesar video" toggles between max-h-[40vh] and max-h-[28vh]', () => {
      const { container } = render(
        <LocalVideoPanel matchId="match-ergo-6" />
      );

      const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
      const dummyFile = new File(['test bytes'], 'game.mp4', { type: 'video/mp4' });
      fireEvent.change(fileInput, { target: { files: [dummyFile] } });

      const toggleBtn = screen.getByRole('button', { name: /Kecilkan video/i });
      expect(toggleBtn).toBeInTheDocument();

      // Click to minimize
      fireEvent.click(toggleBtn);
      const videoEl = container.querySelector('video');
      expect(videoEl.className).toContain('max-h-[28vh]');
      expect(screen.getByRole('button', { name: /Perbesar video/i })).toBeInTheDocument();

      // Click to expand back
      fireEvent.click(screen.getByRole('button', { name: /Perbesar video/i }));
      expect(videoEl.className).toContain('max-h-[40vh]');
    });
  });

  describe('4. MatchDetailPage Auto-Open Video Panel Helper', () => {
    it('hasStoredVideoMeta returns true when meta exists and false when not', () => {
      expect(hasStoredVideoMeta('no-match')).toBe(false);

      localStorage.setItem('ballr_video_meta_match-meta-1', JSON.stringify({ name: 'footage.mp4', size: 1024 }));
      expect(hasStoredVideoMeta('match-meta-1')).toBe(true);
    });

    it('auto-opens video panel on first render when match has stored video metadata', async () => {
      // Store metadata for demo-match-contoh-01
      localStorage.setItem(
        'ballr_video_meta_demo-match-contoh-01',
        JSON.stringify({ name: 'laga.mp4', size: 2048 })
      );

      render(
        <MemoryRouter initialEntries={['/laga/demo-match-contoh-01']}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for match data to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sembunyikan Panel Video' })).toBeInTheDocument();
      });

      expect(screen.getByText('Video Laga Lokal')).toBeInTheDocument();
      expect(screen.getByText(/Pilih ulang file: laga.mp4/i)).toBeInTheDocument();
    });

    it('video panel stays closed on first render when match has NO stored video metadata', async () => {
      render(
        <MemoryRouter initialEntries={['/laga/demo-match-contoh-01']}>
          <Routes>
            <Route path="/laga/:matchId" element={<MatchDetailPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Lawan Contoh/i)).toBeInTheDocument();
      });

      // Video panel toggle should indicate panel is closed
      expect(screen.getByRole('button', { name: 'Buka Panel Video' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sembunyikan Panel Video' })).toBeNull();
    });
  });
});
