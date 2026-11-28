import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { APP_ROUTES, LAYOUT_OPT_OUT_ROUTES } from '../routes';

describe('Shared Layout Route Verification', () => {
  it('every route in APP_ROUTES is in SharedCoachLayout unless listed in LAYOUT_OPT_OUT_ROUTES', () => {
    const appFile = path.resolve(__dirname, '../App.jsx');
    const appSource = fs.readFileSync(appFile, 'utf-8');

    // Extract SharedCoachLayout route block
    const layoutMatch = appSource.match(
      /<Route\s+element=\{<SharedCoachLayout[^>]*\/>\}>([\s\S]*?)<\/Route>/
    );
    expect(layoutMatch).toBeTruthy();
    const layoutBlock = layoutMatch[1];

    // Find all paths defined inside SharedCoachLayout
    const insidePaths = Array.from(layoutBlock.matchAll(/path=["']([^"']+)["']/g)).map(
      (m) => m[1]
    );

    // Find all paths defined in the entire Routes block
    const allRoutePaths = Array.from(appSource.matchAll(/<Route[^>]+path=["']([^"']+)["']/g)).map(
      (m) => m[1]
    );

    // Filter out wildcard route
    const outsidePaths = allRoutePaths.filter(
      (p) => p !== '*' && !insidePaths.includes(p)
    );

    // 1. Verify every APP_ROUTE
    for (const route of APP_ROUTES) {
      const isOptOut = LAYOUT_OPT_OUT_ROUTES.includes(route.path);

      if (isOptOut) {
        expect(
          insidePaths,
          `Route ${route.path} is marked as layout opt-out and should NOT be inside SharedCoachLayout`
        ).not.toContain(route.path);

        expect(
          outsidePaths,
          `Route ${route.path} is marked as layout opt-out and must be defined outside SharedCoachLayout`
        ).toContain(route.path);
      } else {
        expect(
          insidePaths,
          `Route ${route.path} is missing the shared layout (must be inside SharedCoachLayout in App.jsx)`
        ).toContain(route.path);

        expect(
          outsidePaths,
          `Route ${route.path} must not be outside SharedCoachLayout`
        ).not.toContain(route.path);
      }
    }

    // 2. Verify that NO unexpected route is outside SharedCoachLayout
    for (const path of outsidePaths) {
      expect(
        LAYOUT_OPT_OUT_ROUTES,
        `Unexpected route outside SharedCoachLayout: ${path} (only LAYOUT_OPT_OUT_ROUTES are permitted)`
      ).toContain(path);
    }
  });

  it('renders exactly one [data-testid="page-container"] on standard routes inside MemoryRouter', async () => {
    // Test sample previously problematic routes: /taktik/:id, /pemain/:id/pertumbuhan, /rujukan
    const standardRoutes = [
      '/beranda',
      '/taktik/demo-scenario-contoh-01',
      '/pemain/WK-2026-0042/pertumbuhan',
      '/rujukan',
      '/bantuan',
      '/skuad'
    ];

    for (const route of standardRoutes) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );

      const containers = document.querySelectorAll('[data-testid="page-container"]');
      expect(
        containers.length,
        `Route ${route} should have exactly one [data-testid="page-container"]`
      ).toBe(1);

      unmount();
    }
  });

  it('does NOT render [data-testid="page-container"] on opt-out routes', async () => {
    const optOutPaths = [
      '/',
      '/privasi',
      '/laga/demo-match-contoh-01/laporan',
      '/verifikasi/demo-hash-123'
    ];

    for (const route of optOutPaths) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );

      const containers = document.querySelectorAll('[data-testid="page-container"]');
      expect(
        containers.length,
        `Opt-out route ${route} should not have [data-testid="page-container"]`
      ).toBe(0);

      unmount();
    }
  });

  it('renders [data-testid="landing-container"] on landing routes ("/" and "/privasi") with proper gutters', async () => {
    const landingPaths = ['/', '/privasi'];

    for (const route of landingPaths) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );

      const containers = document.querySelectorAll('[data-testid="landing-container"]');
      expect(
        containers.length,
        `Route ${route} should have at least one [data-testid="landing-container"]`
      ).toBeGreaterThanOrEqual(1);

      unmount();
    }
  });
});
