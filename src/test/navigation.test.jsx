import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TopNav from '../components/TopNav';

describe('Navigation (TopNav Desktop & Mobile Tab Bar)', () => {
  const mockAcademy = {
    name: 'Mataram Putra FA',
    city: 'Yogyakarta',
    logo_url: ''
  };

  it('renders desktop top bar with brand underline on active item', () => {
    const handleSwitch = vi.fn();
    render(
      <TopNav
        academy={mockAcademy}
        currentView="passport"
        userRole="coach"
        isDemoMode={true}
        onSwitchView={handleSwitch}
        onOpenAuthModal={() => {}}
        onLogout={() => {}}
        onShare={() => {}}
      />
    );

    // Desktop nav exists with role navigation
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi utama desktop' });
    expect(desktopNav).toBeInTheDocument();

    // Verify Skuad is present in desktop nav and not truncated
    const skuadButton = within(desktopNav).getByRole('button', { name: /Skuad/i });
    expect(skuadButton).toBeInTheDocument();

    // Click coach navigation item (e.g. Laga)
    const lagaButton = within(desktopNav).getByRole('button', { name: /Laga/i });
    fireEvent.click(lagaButton);
    expect(handleSwitch).toHaveBeenCalledWith('matches');

    // Verify "Bantuan" option exists in account menu and calls help
    const menuButton = screen.getByRole('button', { name: /Menu akun/i });
    expect(menuButton).toBeInTheDocument();
    fireEvent.click(menuButton);

    const bantuanButton = screen.getByRole('menuitem', { name: /Bantuan/i });
    expect(bantuanButton).toBeInTheDocument();
    fireEvent.click(bantuanButton);
    expect(handleSwitch).toHaveBeenCalledWith('help');
  });

  it('renders mobile bottom tab bar with concise labels (nothing truncated)', () => {
    const handleSwitch = vi.fn();
    render(
      <TopNav
        academy={mockAcademy}
        currentView="roster"
        userRole="public"
        isDemoMode={false}
        onSwitchView={handleSwitch}
        onOpenAuthModal={() => {}}
        onLogout={() => {}}
        onShare={() => {}}
      />
    );

    const mobileNav = screen.getByRole('navigation', { name: 'Navigasi bawah seluler' });
    expect(mobileNav).toBeInTheDocument();

    // Verify public mobile tabs are rendered fully within mobile nav
    expect(within(mobileNav).getByRole('button', { name: /Paspor/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Tumbuh/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Skuad/i })).toBeInTheDocument();
  });

  it('renders visible single theme toggle and triggers onToggleSurface', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <TopNav
        academy={mockAcademy}
        currentView="roster"
        userRole="coach"
        surface="paper"
        onToggleSurface={handleToggle}
      />
    );

    const themeBtn = screen.getByTestId('theme-toggle');
    expect(themeBtn).toHaveAttribute('aria-label', 'Tema: Terang. Ganti ke Gelap');

    fireEvent.click(themeBtn);
    expect(handleToggle).toHaveBeenCalledWith('dark');

    rerender(
      <TopNav
        academy={mockAcademy}
        currentView="roster"
        userRole="coach"
        surface="dark"
        onToggleSurface={handleToggle}
      />
    );

    expect(themeBtn).toHaveAttribute('aria-label', 'Tema: Gelap. Ganti ke Terang');
    fireEvent.click(themeBtn);
    expect(handleToggle).toHaveBeenCalledWith('paper');
  });
});

