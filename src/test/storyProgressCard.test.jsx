import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StoryFlexCardModal from '../components/StoryFlexCardModal';
import StoryCardCanvas from '../components/story/StoryCardCanvas';
import { canShareProgressCard, buildCardDownloadFilename } from '../lib/consent';
import * as supabaseLib from '../lib/supabase';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockimage')
}));

const mockPlayer = {
  id: 'player-test-01',
  player_id: 'WK-2026-0042',
  personal_info: {
    full_name: 'Dimas Arya Pratama',
    nickname: 'Arya',
    position: 'Attacking Midfielder (CAM)',
    age_group: 'U-13',
    height_cm: 158,
    weight_kg: 46,
    academy: {
      name: 'Mataram Putra Football Academy'
    }
  },
  fitness_benchmarks: {
    test_date: '2026-10-24',
    vertical_jump_cm: 44.5,
    sprint_20m_sec: 3.42,
    shuttle_run_sec: 11.20
  },
  ai_coach_evaluation: {
    period: 'Oktober 2026',
    coach_name: 'Coach Hendro',
    narrative: 'Dimas menunjukkan peningkatan signifikan dalam hal scanning ruang.'
  }
};

describe('1. Pure canShareProgressCard (Table-driven)', () => {
  const table = [
    {
      description: '[] -> false',
      consents: [],
      expected: false
    },
    {
      description: 'default row (training_analysis only) -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: { training_analysis: true }
        }
      ],
      expected: false
    },
    {
      description: 'latest row public_profile true and unrevoked -> true',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: { public_profile: true }
        }
      ],
      expected: true
    },
    {
      description: 'latest revoked but older row granting -> false',
      consents: [
        {
          id: 'c-old',
          granted_at: '2026-09-01T10:00:00Z',
          revoked_at: null,
          purposes: { public_profile: true }
        },
        {
          id: 'c-latest',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: '2026-10-15T12:00:00Z',
          purposes: { public_profile: true }
        }
      ],
      expected: false
    },
    {
      description: 'latest granting but older revoked -> true',
      consents: [
        {
          id: 'c-old',
          granted_at: '2026-09-01T10:00:00Z',
          revoked_at: '2026-09-15T12:00:00Z',
          purposes: { public_profile: true }
        },
        {
          id: 'c-latest',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: { public_profile: true }
        }
      ],
      expected: true
    },
    {
      description: 'media-only -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: { media: true }
        }
      ],
      expected: false
    },
    {
      description: 'share_with_scouts-only -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: { share_with_scouts: true }
        }
      ],
      expected: false
    },
    {
      description: 'malformed purposes (null) -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: null
        }
      ],
      expected: false
    },
    {
      description: 'malformed purposes (non-object) -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: 'invalid'
        }
      ],
      expected: false
    },
    {
      description: 'malformed purposes (array) -> false',
      consents: [
        {
          id: 'c1',
          granted_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
          purposes: ['public_profile']
        }
      ],
      expected: false
    }
  ];

  table.forEach(({ description, consents, expected }) => {
    it(`evaluates: ${description}`, () => {
      expect(canShareProgressCard(consents)).toBe(expected);
    });
  });
});

describe('2. Modal Rendering & Consent Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('default row (training_analysis only) keeps both Unduh and Salin disabled and shows both warning lines', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
      {
        id: 'c-default',
        player_id: 'WK-2026-0042',
        granted_at: '2026-10-01T10:00:00Z',
        revoked_at: null,
        purposes: { training_analysis: true }
      }
    ]);

    render(
      <StoryFlexCardModal
        isOpen={true}
        player={mockPlayer}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Butuh persetujuan wali yang tercatat untuk membagikan kartu')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Persetujuan wali yang tercatat belum mencakup berbagi profil')
      ).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Unduh Gambar/i });
    const copyBtn = screen.getByRole('button', { name: /Salin Ringkasan/i });
    expect(downloadBtn).toBeDisabled();
    expect(copyBtn).toBeDisabled();
  });

  it('no consent row keeps buttons disabled and shows only the first warning line', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([]);

    render(
      <StoryFlexCardModal
        isOpen={true}
        player={mockPlayer}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Butuh persetujuan wali yang tercatat untuk membagikan kartu')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Persetujuan wali yang tercatat belum mencakup berbagi profil')
      ).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Unduh Gambar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Salin Ringkasan/i })).toBeDisabled();
  });

  it('fetch error keeps the card disabled (fail closed)', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockRejectedValue(new Error('Network error'));

    render(
      <StoryFlexCardModal
        isOpen={true}
        player={mockPlayer}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Butuh persetujuan wali yang tercatat untuk membagikan kartu')
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Unduh Gambar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Salin Ringkasan/i })).toBeDisabled();
  });

  it('enables export and hides warning when latest consent has public_profile: true and is unrevoked', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
      {
        id: 'c-active',
        player_id: 'WK-2026-0042',
        revoked_at: null,
        granted_at: '2026-10-01T10:00:00Z',
        purposes: { public_profile: true }
      }
    ]);

    render(
      <StoryFlexCardModal
        isOpen={true}
        player={mockPlayer}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Butuh persetujuan wali yang tercatat untuk membagikan kartu')
      ).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Unduh Gambar/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Salin Ringkasan/i })).not.toBeDisabled();
  });
});

describe('3. File Name Generation & Privacy Guard', () => {
  it('buildCardDownloadFilename produces initials-only slug for private displayed name', () => {
    const filename = buildCardDownloadFilename('D. A. P.');
    expect(filename).toBe('kartu-perkembangan-d-a-p.png');
    expect(filename).not.toContain('dimas');
    expect(filename).not.toContain('arya');
    expect(filename).not.toContain('pratama');
  });

  it('produces initials-only file name during private player export without leaking full name', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
      {
        id: 'c-active',
        player_id: 'WK-2026-0042',
        revoked_at: null,
        granted_at: '2026-10-01T10:00:00Z',
        purposes: { public_profile: true }
      }
    ]);

    const privatePlayer = {
      ...mockPlayer,
      visibility_tier: 'private'
    };

    let createdDownloadName = null;
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        Object.defineProperty(el, 'download', {
          set(val) { createdDownloadName = val; },
          get() { return createdDownloadName; }
        });
        el.click = vi.fn();
      }
      return el;
    });

    render(
      <StoryFlexCardModal
        isOpen={true}
        player={privatePlayer}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unduh Gambar/i })).not.toBeDisabled();
    });

    const downloadBtn = screen.getByRole('button', { name: /Unduh Gambar/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(createdDownloadName).toBeTruthy();
    });

    expect(createdDownloadName).toBe('kartu-perkembangan-d-a-p.png');
    expect(createdDownloadName).not.toMatch(/dimas/i);
    expect(createdDownloadName).not.toMatch(/arya/i);
    expect(createdDownloadName).not.toMatch(/pratama/i);
  });
});

describe('4. Card Content Honest Metrics', () => {
  it('card contains none of: OVR, tier, percentile, Top, Rekor', () => {
    render(<StoryCardCanvas player={mockPlayer} isPrivate={false} />);

    const canvas = screen.getByTestId('progress-card-canvas');
    const content = canvas.textContent || '';

    expect(content).not.toMatch(/\bOVR\b/i);
    expect(content).not.toMatch(/\btier\b/i);
    expect(content).not.toMatch(/\bpercentile\b/i);
    expect(content).not.toMatch(/\bTop\b/i);
    expect(content).not.toMatch(/\bRekor\b/i);

    expect(screen.getByText('Dimas Arya Pratama')).toBeInTheDocument();
    expect(screen.getByText(/Attacking Midfielder \(CAM\)/i)).toBeInTheDocument();
    expect(screen.getByText('158 cm')).toBeInTheDocument();
    expect(screen.getByText('44.5 cm')).toBeInTheDocument();
    expect(screen.getByText('3.42 s')).toBeInTheDocument();
  });

  it('masks athlete name with initials when isPrivate is true', () => {
    render(<StoryCardCanvas player={mockPlayer} isPrivate={true} />);

    expect(screen.queryByText('Dimas Arya Pratama')).not.toBeInTheDocument();
    expect(screen.getByText('D. A. P.')).toBeInTheDocument();
  });

  it('displays "Belum ada data" for empty / missing values', () => {
    const emptyPlayer = {
      player_id: 'EMPTY-001',
      personal_info: {}
    };

    render(<StoryCardCanvas player={emptyPlayer} isPrivate={false} />);

    const noDataElements = screen.getAllByText('Belum ada data');
    expect(noDataElements.length).toBeGreaterThan(0);
  });
});

describe('5. Demo Mode Consent Store', () => {
  const origDemoMode = import.meta.env.VITE_DEMO_MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    import.meta.env.VITE_DEMO_MODE = origDemoMode;
  });

  it('seeds and returns 3 distinct states in demo mode (VITE_DEMO_MODE=true)', async () => {
    import.meta.env.VITE_DEMO_MODE = 'true';

    // Player 1: public_profile granted
    const p1Consents = await supabaseLib.fetchPlayerConsents('WK-2026-0042');
    expect(p1Consents.length).toBeGreaterThan(0);
    expect(p1Consents[0].revoked_at).toBeNull();
    expect(p1Consents[0].purposes.public_profile).toBe(true);
    expect(canShareProgressCard(p1Consents)).toBe(true);

    // Player 2: training_analysis only (no public_profile)
    const p2Consents = await supabaseLib.fetchPlayerConsents('WK-2026-0043');
    expect(p2Consents.length).toBeGreaterThan(0);
    expect(p2Consents[0].revoked_at).toBeNull();
    expect(p2Consents[0].purposes.public_profile).toBe(false);
    expect(canShareProgressCard(p2Consents)).toBe(false);

    // Player 3: revoked consent
    const p3Consents = await supabaseLib.fetchPlayerConsents('WK-2026-0044');
    expect(p3Consents.length).toBeGreaterThan(0);
    expect(p3Consents[0].revoked_at).toBeTruthy();
    expect(canShareProgressCard(p3Consents)).toBe(false);
  });

  it('never reads demo_consents from localStorage in real mode (VITE_DEMO_MODE=false)', async () => {
    import.meta.env.VITE_DEMO_MODE = 'false';
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    // In real mode with no supabase credentials, returns [] without reading demo_consents
    const consents = await supabaseLib.fetchPlayerConsents('WK-2026-0042');
    expect(consents).toEqual([]);

    // Assert demo_consents was never requested from localStorage
    const demoConsentReads = getItemSpy.mock.calls.filter(([key]) => key === 'demo_consents');
    expect(demoConsentReads).toHaveLength(0);
  });
});
