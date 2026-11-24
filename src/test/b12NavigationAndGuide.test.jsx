import React from 'react';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
});

import TopNav from '../components/TopNav';
import PlayerTabs from '../components/PlayerTabs';
import GuidePage from '../pages/GuidePage';
import MatchesPage from '../pages/MatchesPage';
import PassportPage from '../pages/PassportPage';
import GrowthPage from '../pages/GrowthPage';
import { PlayersProvider } from '../context/PlayersContext';
import { APP_ROUTES, resolveRoute } from '../routes';

afterAll(() => {
  vi.unstubAllEnvs();
});

const mockPlayer = {
  player_id: 'PLAYER-01',
  public_id: 'PLAYER-01',
  personal_info: {
    full_name: 'Dimas Anggara',
    nickname: 'Dimas',
    jersey_number: 10,
    position: 'Attacking Midfielder',
    age_group: 'U-13'
  }
};

describe('Phase B12: Simplified Navigation & In-App Guide', () => {
  describe('1. TopNav Navigation Items per Role', () => {
    it('coach has exactly 5 items in exact order: Beranda, Skuad, Laga, Taktik, Evaluasi', () => {
      render(
        <TopNav
          userRole="coach"
          currentView="roster"
        />
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      const buttons = within(desktopNav).getAllByRole('button');

      expect(buttons).toHaveLength(5);
      expect(buttons[0]).toHaveTextContent(/Beranda/i);
      expect(buttons[1]).toHaveTextContent(/Skuad/i);
      expect(buttons[2]).toHaveTextContent(/Laga/i);
      expect(buttons[3]).toHaveTextContent(/Taktik/i);
      expect(buttons[4]).toHaveTextContent(/Evaluasi/i);

      // Verify removed items are NOT present in coach nav
      expect(within(desktopNav).queryByRole('button', { name: /^Paspor$/i })).not.toBeInTheDocument();
      expect(within(desktopNav).queryByRole('button', { name: /^Pertumbuhan$/i })).not.toBeInTheDocument();
      expect(within(desktopNav).queryByRole('button', { name: /^Logger$/i })).not.toBeInTheDocument();
    });

    it('admin has exactly 5 items in exact order: Beranda, Skuad, Laga, Taktik, Evaluasi', () => {
      render(
        <TopNav
          userRole="admin"
          currentView="roster"
        />
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

    it('public role has exactly 3 items unchanged: Paspor, Pertumbuhan, Skuad', () => {
      render(
        <TopNav
          userRole="public"
          currentView="passport"
        />
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      const buttons = within(desktopNav).getAllByRole('button');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent(/Paspor/i);
      expect(buttons[1]).toHaveTextContent(/Pertumbuhan/i);
      expect(buttons[2]).toHaveTextContent(/Skuad/i);

      // Coach items NOT present for public
      expect(within(desktopNav).queryByRole('button', { name: /^Laga$/i })).not.toBeInTheDocument();
      expect(within(desktopNav).queryByRole('button', { name: /^Taktik$/i })).not.toBeInTheDocument();
      expect(within(desktopNav).queryByRole('button', { name: /^Evaluasi$/i })).not.toBeInTheDocument();
    });

    it('parent role has exactly 3 items unchanged: Paspor, Pertumbuhan, Skuad', () => {
      render(
        <TopNav
          userRole="parent"
          currentView="passport"
        />
      );

      const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
      const buttons = within(desktopNav).getAllByRole('button');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent(/Paspor/i);
      expect(buttons[1]).toHaveTextContent(/Pertumbuhan/i);
      expect(buttons[2]).toHaveTextContent(/Skuad/i);
    });

    it('mobile bottom bar has exactly 5 items for coach', () => {
      render(
        <TopNav
          userRole="coach"
          currentView="roster"
        />
      );

      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi bawah seluler' });
      const buttons = within(mobileNav).getAllByRole('button');

      expect(buttons).toHaveLength(5);
      expect(buttons[0]).toHaveTextContent(/Beranda/i);
      expect(buttons[1]).toHaveTextContent(/Skuad/i);
      expect(buttons[2]).toHaveTextContent(/Laga/i);
      expect(buttons[3]).toHaveTextContent(/Taktik/i);
      expect(buttons[4]).toHaveTextContent(/Evaluasi/i);
    });

    it('mobile bottom bar has exactly 3 items for public', () => {
      render(
        <TopNav
          userRole="public"
          currentView="passport"
        />
      );

      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi bawah seluler' });
      const buttons = within(mobileNav).getAllByRole('button');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent(/Paspor/i);
      expect(buttons[1]).toHaveTextContent(/Tumbuh/i);
      expect(buttons[2]).toHaveTextContent(/Skuad/i);
    });

    it('renders "Bantuan" option in TopNav account menu', () => {
      render(
        <TopNav
          userRole="coach"
          currentView="roster"
        />
      );

      const menuButton = screen.getByRole('button', { name: /Menu akun/i });
      expect(menuButton).toBeInTheDocument();
      fireEvent.click(menuButton);

      const bantuanButton = screen.getByRole('menuitem', { name: /bantuan/i });
      expect(bantuanButton).toBeInTheDocument();
    });
  });

  describe('2. PlayerTabs Component & Integration', () => {
    it('renders player name, tabs "Paspor | Pertumbuhan | Evaluasi" and "Kembali ke skuad" for coach', () => {
      render(
        <MemoryRouter>
          <PlayerTabs
            player={mockPlayer}
            activeTab="passport"
            userRole="coach"
          />
        </MemoryRouter>
      );

      // Shows player name
      expect(screen.getByText('Dimas Anggara')).toBeInTheDocument();
      expect(screen.getByText('#10')).toBeInTheDocument();

      // "Kembali ke skuad" back link present and has 44px hit area
      const backButton = screen.getByRole('button', { name: /kembali ke skuad/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton.className).toMatch(/min-h-\[44px\]/);
      expect(backButton.className).toMatch(/min-w-\[44px\]/);

      // Tabs present
      const passportTab = screen.getByRole('tab', { name: /paspor/i });
      const growthTab = screen.getByRole('tab', { name: /pertumbuhan/i });
      const evalTab = screen.getByRole('tab', { name: /evaluasi/i });

      expect(passportTab).toBeInTheDocument();
      expect(growthTab).toBeInTheDocument();
      expect(evalTab).toBeInTheDocument();

      // Active tab
      expect(passportTab).toHaveAttribute('aria-selected', 'true');
      expect(growthTab).toHaveAttribute('aria-selected', 'false');

      // Evaluasi link points to /penilaian/:id
      expect(evalTab).toHaveAttribute('href', '/penilaian/PLAYER-01');

      // 44px touch targets on tabs
      expect(passportTab.className).toMatch(/min-h-\[44px\]/);
      expect(growthTab.className).toMatch(/min-h-\[44px\]/);
      expect(evalTab.className).toMatch(/min-h-\[44px\]/);
    });

    it('hides "Evaluasi" tab and "Kembali ke skuad" for public/parent role', () => {
      render(
        <MemoryRouter>
          <PlayerTabs
            player={mockPlayer}
            activeTab="growth"
            userRole="public"
          />
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /kembali ke skuad/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /evaluasi/i })).not.toBeInTheDocument();

      const growthTab = screen.getByRole('tab', { name: /pertumbuhan/i });
      expect(growthTab).toHaveAttribute('aria-selected', 'true');
    });

    it('PlayerTabs is present on PassportPage and GrowthPage with correct active tab', async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/pemain/PLAYER-01']}>
          <PlayersProvider>
            <PassportPage userRole="coach" />
          </PlayersProvider>
        </MemoryRouter>
      );

      const passportPlayerTabs = await screen.findByTestId('player-tabs');
      expect(passportPlayerTabs).toBeInTheDocument();
      const passportTab = within(passportPlayerTabs).getByRole('tab', { name: /paspor/i });
      expect(passportTab).toHaveAttribute('aria-selected', 'true');

      unmount();

      render(
        <MemoryRouter initialEntries={['/pemain/PLAYER-01/pertumbuhan']}>
          <PlayersProvider>
            <GrowthPage userRole="coach" />
          </PlayersProvider>
        </MemoryRouter>
      );

      const growthPlayerTabs = await screen.findByTestId('player-tabs');
      expect(growthPlayerTabs).toBeInTheDocument();
      const growthTab = within(growthPlayerTabs).getByRole('tab', { name: /pertumbuhan/i });
      expect(growthTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('3. Guide Page /bantuan & Route Table Extraction', () => {
    it('renders all seven sections ((a) through (g)) and the mandatory child privacy line', () => {
      render(
        <MemoryRouter>
          <GuidePage />
        </MemoryRouter>
      );

      // Section a
      expect(screen.getByText(/Sebelum laga: buat laga dan pilih pemain/i)).toBeInTheDocument();
      // Section b
      expect(screen.getByText(/Saat laga: Catat kejadian/i)).toBeInTheDocument();
      // Section c
      expect(screen.getByText(/Setelah laga: Peta kejadian, Laporan, Kunci laporan dan pemeriksa/i)).toBeInTheDocument();
      // Section d
      expect(screen.getByText(/Latihan: Papan taktik/i)).toBeInTheDocument();
      // Section e
      expect(screen.getByText(/Penilaian pemain: Evaluasi, simpan draf, publikasikan/i)).toBeInTheDocument();
      // Section f
      expect(screen.getByText(/Privasi anak: status persetujuan wali/i)).toBeInTheDocument();
      // Section g
      expect(screen.getByText(/Peran dan akses: pelatih, admin, orang tua, publik/i)).toBeInTheDocument();

      // Mandatory line in Section f
      const mandatoryLine = screen.getByText('Pencatatan persetujuan oleh wali belum tersedia di versi ini.');
      expect(mandatoryLine).toBeInTheDocument();
    });

    it('every link target on the guide page resolves to a route defined in APP_ROUTES', () => {
      const { container } = render(
        <MemoryRouter>
          <GuidePage />
        </MemoryRouter>
      );

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThanOrEqual(7);

      links.forEach((link) => {
        const href = link.getAttribute('href');
        expect(href).toBeTruthy();
        const isValid = resolveRoute(href);
        expect(isValid, `Route ${href} must resolve in APP_ROUTES`).toBe(true);

        // Also check 44px touch target on all link buttons
        expect(link.className).toMatch(/min-h-\[44px\]/);
        expect(link.className).toMatch(/min-w-\[44px\]/);
      });
    });

    it('APP_ROUTES contains all required application route paths', () => {
      const paths = APP_ROUTES.map((r) => r.path);
      expect(paths).toContain('/');
      expect(paths).toContain('/beranda');
      expect(paths).toContain('/privasi');
      expect(paths).toContain('/pemain/:publicId');
      expect(paths).toContain('/pemain/:publicId/pertumbuhan');
      expect(paths).toContain('/skuad');
      expect(paths).toContain('/penilaian/:playerId');
      expect(paths).toContain('/pencatatan');
      expect(paths).toContain('/pencatatan/:matchId');
      expect(paths).toContain('/laga');
      expect(paths).toContain('/taktik');
      expect(paths).toContain('/bantuan');
    });
  });

  describe('4. Draft Match Banner & Redirections', () => {
    it('shows "Laga draft: <lawan> — Lanjut mencatat" banner on Laga page when draft exists', async () => {
      render(
        <MemoryRouter>
          <PlayersProvider>
            <MatchesPage userRole="coach" />
          </PlayersProvider>
        </MemoryRouter>
      );

      // Wait for matches to load in demo mode (demo data has draft match vs "Lawan Contoh")
      const banner = await screen.findByTestId('draft-match-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Laga draft:/i);
      expect(banner).toHaveTextContent(/Lanjut mencatat/i);

      const actionBtn = within(banner).getByRole('button', { name: /Lanjut mencatat/i });
      expect(actionBtn).toBeInTheDocument();
      expect(actionBtn.className).toMatch(/min-h-\[44px\]/);
    });

    it('renders Home at "/beranda" for coach role', async () => {
      const App = (await import('../App')).default;
      render(
        <MemoryRouter initialEntries={['/beranda']}>
          <App />
        </MemoryRouter>
      );

      // In demo mode, coach lands on Home (Beranda)
      expect(await screen.findByRole('heading', { name: /Beranda/i })).toBeInTheDocument();
      expect(screen.getByText(/Apa yang mau kamu kerjakan hari ini\?/i)).toBeInTheDocument();
    });

    it('redirects "/pencatatan" to "/laga"', async () => {
      const App = (await import('../App')).default;
      render(
        <MemoryRouter initialEntries={['/pencatatan']}>
          <App />
        </MemoryRouter>
      );

      // /pencatatan without id redirects to /laga
      expect(await screen.findByText('Rekaman Pertandingan')).toBeInTheDocument();
    });
  });
});
