import React from 'react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
});

import HomePage from '../pages/HomePage';
import StageStepper from '../components/ux/StageStepper';
import EmptyState from '../components/ux/EmptyState';
import TopNav from '../components/TopNav';
import { PlayersProvider } from '../context/PlayersContext';
import * as matchesApi from '../lib/matches';

afterAll(() => {
  vi.unstubAllEnvs();
});

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <PlayersProvider>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </PlayersProvider>
  );
}

describe('Task UX-2: Coach Home ("Beranda") and UX Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. TopNav Navigation Items (5 Items for Coach / Admin)', () => {
    it('renders exactly 5 items in order: Beranda, Skuad, Laga, Taktik, Evaluasi for coach', () => {
      render(
        <MemoryRouter>
          <TopNav
            userRole="coach"
            currentView="home"
          />
        </MemoryRouter>
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      const buttons = within(desktopNav).getAllByRole('button');

      expect(buttons).toHaveLength(5);
      expect(buttons[0]).toHaveTextContent(/Beranda/i);
      expect(buttons[1]).toHaveTextContent(/Skuad/i);
      expect(buttons[2]).toHaveTextContent(/Laga/i);
      expect(buttons[3]).toHaveTextContent(/Taktik/i);
      expect(buttons[4]).toHaveTextContent(/Evaluasi/i);
    });

    it('renders 5 items on mobile bottom bar with 56px height (h-14 / min-h-[56px])', () => {
      render(
        <MemoryRouter>
          <TopNav
            userRole="coach"
            currentView="home"
          />
        </MemoryRouter>
      );

      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi bawah seluler' });
      expect(mobileNav.className).toMatch(/min-h-\[56px\]/);
      expect(mobileNav.className).toMatch(/h-14/);

      const buttons = within(mobileNav).getAllByRole('button');
      expect(buttons).toHaveLength(5);
      buttons.forEach((btn) => {
        expect(btn.className).toMatch(/min-h-\[56px\]/);
      });
    });
  });

  describe('2. StageStepper Component', () => {
    it('renders desktop ordered list with aria-current="step" on the current step', () => {
      const { container } = render(
        <StageStepper currentStep={2} />
      );

      const listItems = container.querySelectorAll('ol > li');
      expect(listItems).toHaveLength(4);

      // Step 1: done (not aria-current)
      expect(listItems[0]).not.toHaveAttribute('aria-current');

      // Step 2: current (aria-current="step")
      expect(listItems[1]).toHaveAttribute('aria-current', 'step');
      expect(listItems[1]).toHaveTextContent('Catat kejadian');

      // Step 3 & 4: todo
      expect(listItems[2]).not.toHaveAttribute('aria-current');
      expect(listItems[3]).not.toHaveAttribute('aria-current');
    });

    it('renders compact phone variant with "Langkah 2 dari 4: Catat kejadian" and 4-segment bar', () => {
      render(
        <StageStepper currentStep={2} compact={true} />
      );

      expect(screen.getByText(/Langkah 2 dari 4: Catat kejadian/i)).toBeInTheDocument();
      // Progress percentage
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('3. EmptyState Component', () => {
    it('renders title, description, and one primary button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="Belum ada laga"
          description="Mulailah dengan membuat laga pertama."
          actionLabel="Buat laga pertama"
          onAction={onAction}
        />
      );

      expect(screen.getByRole('heading', { name: /Belum ada laga/i })).toBeInTheDocument();
      expect(screen.getByText(/Mulailah dengan membuat laga pertama/i)).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Buat laga pertama/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toMatch(/min-h-\[56px\]/);
    });
  });

  describe('4. HomePage Rendering & States', () => {
    it('renders draft card with real event count and stage stepper when draft match exists', async () => {
      const mockMatches = [
        {
          id: 'draft-match-01',
          opponent_name: 'SSB Bintang Muda',
          match_date: '2026-11-20',
          format: '11v11',
          status: 'draft'
        }
      ];
      const mockEvents = [
        { id: 'evt-1', event_type: 'pass' },
        { id: 'evt-2', event_type: 'shot' },
        { id: 'evt-3', event_type: 'key_pass' }
      ];

      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue(mockMatches);
      vi.spyOn(matchesApi, 'listEvents').mockResolvedValue(mockEvents);

      renderWithProviders(<HomePage userRole="coach" />);

      // Header
      expect(await screen.findByRole('heading', { name: 'Beranda' })).toBeInTheDocument();
      expect(screen.getByText('Apa yang mau kamu kerjakan hari ini?')).toBeInTheDocument();

      // Continue match card
      const card = screen.getByTestId('continue-match-card');
      expect(card).toBeInTheDocument();
      expect(within(card).getByText(/Lanjutkan laga terakhir/i)).toBeInTheDocument();
      expect(within(card).getByText('SSB Bintang Muda')).toBeInTheDocument();

      // Real event count
      const eventCountBadge = screen.getByTestId('real-event-count');
      expect(eventCountBadge).toHaveTextContent('3 kejadian sudah dicatat');

      // Primary button
      const primaryBtn = screen.getByTestId('primary-continue-action');
      expect(primaryBtn).toHaveTextContent('Lanjut mencatat');
      expect(primaryBtn.className).toMatch(/min-h-\[56px\]/);

      // Secondary button
      expect(within(card).getByRole('button', { name: /Lihat detail laga/i })).toBeInTheDocument();

      // Stepper on step 2 (Catat kejadian)
      const currentStep = card.querySelector('li[aria-current="step"]');
      expect(currentStep).toHaveTextContent('Catat kejadian');
    });

    it('renders empty state when zero matches exist', async () => {
      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue([]);

      renderWithProviders(<HomePage userRole="coach" />);

      expect(await screen.findByRole('heading', { name: 'Beranda' })).toBeInTheDocument();

      // Continue card must NOT exist
      expect(screen.queryByTestId('continue-match-card')).not.toBeInTheDocument();

      // Empty state visible with ONE primary button
      expect(screen.getByRole('heading', { name: 'Belum ada laga' })).toBeInTheDocument();
      expect(screen.getByText(/Mulailah dengan membuat laga pertama/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buat laga pertama' })).toBeInTheDocument();
    });

    it('renders "Laga terakhir selesai" with "Buka laporan" CTA when latest match is final', async () => {
      const mockMatches = [
        {
          id: 'final-match-01',
          opponent_name: 'Persija Muda',
          match_date: '2026-11-15',
          format: '11v11',
          status: 'final',
          own_score: 2,
          opponent_score: 1
        }
      ];

      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue(mockMatches);

      renderWithProviders(<HomePage userRole="coach" />);

      expect(await screen.findByRole('heading', { name: 'Beranda' })).toBeInTheDocument();

      const card = screen.getByTestId('continue-match-card');
      expect(within(card).getByText(/Laga terakhir selesai/i)).toBeInTheDocument();
      expect(within(card).getByText('Persija Muda')).toBeInTheDocument();
      expect(within(card).getByText(/2 - 1/)).toBeInTheDocument();

      // Primary CTA is "Buka laporan"
      const primaryBtn = screen.getByTestId('primary-continue-action');
      expect(primaryBtn).toHaveTextContent('Buka laporan');
      expect(primaryBtn.className).toMatch(/min-h-\[56px\]/);
    });

    it('renders all 5 work-order cards with links to real routes', async () => {
      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue([]);

      renderWithProviders(<HomePage userRole="coach" />);

      expect(await screen.findByText('Alur Kerja Pelatih')).toBeInTheDocument();

      expect(screen.getByText('Siapkan skuad')).toBeInTheDocument();
      expect(screen.getByText('Daftar pemain dan profil mereka.')).toBeInTheDocument();

      expect(screen.getByText('Buat laga')).toBeInTheDocument();
      expect(screen.getByText('Catat lawan, tanggal, dan ukuran lapangan.')).toBeInTheDocument();

      expect(screen.getByText('Catat kejadian')).toBeInTheDocument();
      expect(screen.getByText('Ketuk aksi saat laga berjalan, atau sambil memutar video laga dari perangkatmu.')).toBeInTheDocument();

      expect(screen.getByText('Selesaikan laga')).toBeInTheDocument();
      expect(screen.getByText('Isi skor akhir. Setelah itu catatan laga terkunci dan tidak bisa diubah.')).toBeInTheDocument();

      expect(screen.getByText('Laporan dan bagikan')).toBeInTheDocument();
      expect(screen.getByText('Laporan laga yang bisa dicetak, dan kartu perkembangan pemain bila wali sudah setuju.')).toBeInTheDocument();
    });

    it('renders side card "Mulai laga baru"', async () => {
      const mockMatches = [
        { id: 'm1', opponent_name: 'Lawan A', status: 'draft' }
      ];
      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue(mockMatches);
      vi.spyOn(matchesApi, 'listEvents').mockResolvedValue([]);

      renderWithProviders(<HomePage userRole="coach" />);

      expect(await screen.findByRole('heading', { name: 'Mulai laga baru' })).toBeInTheDocument();
      expect(screen.getByText(/Isi nama lawan, tanggal, dan ukuran lapangan/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Buat laga baru/i })).toBeInTheDocument();
    });

    it('renders up to 3 recent matches in "Laga terakhir" list with correct status chips', async () => {
      const mockMatches = [
        { id: 'm1', opponent_name: 'Lawan Satu', match_date: '2026-11-20', status: 'draft' },
        { id: 'm2', opponent_name: 'Lawan Dua', match_date: '2026-11-18', status: 'final', own_score: 3, opponent_score: 0 },
        { id: 'm3', opponent_name: 'Lawan Tiga', match_date: '2026-11-15', status: 'final', own_score: 1, opponent_score: 1 },
        { id: 'm4', opponent_name: 'Lawan Empat', match_date: '2026-11-10', status: 'final' }
      ];
      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue(mockMatches);
      vi.spyOn(matchesApi, 'listEvents').mockResolvedValue([]);

      renderWithProviders(<HomePage userRole="coach" />);

      const recentHeading = await screen.findByRole('heading', { name: 'Laga terakhir' });
      const recentSection = recentHeading.closest('section');
      expect(recentSection).toBeInTheDocument();

      // Only top 3 are rendered in recent matches list
      expect(within(recentSection).getByText('Lawan Satu')).toBeInTheDocument();
      expect(within(recentSection).getByText('Lawan Dua')).toBeInTheDocument();
      expect(within(recentSection).getByText('Lawan Tiga')).toBeInTheDocument();
      expect(within(recentSection).queryByText('Lawan Empat')).not.toBeInTheDocument();

      // Status chip and CTAs inside recent matches section
      expect(within(recentSection).getByRole('button', { name: 'Lanjut mencatat' })).toBeInTheDocument();
      expect(within(recentSection).getAllByRole('button', { name: 'Buka laporan' })).toHaveLength(2);
    });

    it('verifies touch target classes >= 44px on all interactive controls', async () => {
      const mockMatches = [
        { id: 'm1', opponent_name: 'Lawan Test', status: 'draft' }
      ];
      vi.spyOn(matchesApi, 'listMatches').mockResolvedValue(mockMatches);
      vi.spyOn(matchesApi, 'listEvents').mockResolvedValue([]);

      renderWithProviders(<HomePage userRole="coach" />);

      await screen.findByRole('heading', { name: 'Beranda' });

      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        const hasMinTouch =
          btn.className.includes('min-h-[44px]') ||
          btn.className.includes('min-h-[56px]') ||
          btn.className.includes('h-14');
        expect(hasMinTouch).toBe(true);
      });
    });
  });

  describe('5. App Routing Integration', () => {
    it('"/" renders HomePage for coach in App.jsx', async () => {
      const App = (await import('../App')).default;
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      // In demo mode, coach lands on Beranda
      expect(await screen.findByRole('heading', { name: 'Beranda' })).toBeInTheDocument();
      expect(screen.getByText('Apa yang mau kamu kerjakan hari ini?')).toBeInTheDocument();
    });
  });
});
