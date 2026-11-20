import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StoryFlexCardModal from '../components/StoryFlexCardModal';
import StoryCardCanvas from '../components/story/StoryCardCanvas';
import * as supabaseLib from '../lib/supabase';

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

describe('Kartu Perkembangan (Progress Card) & Consent Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('disables download & copy when no consent record exists and shows consent warning', async () => {
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
        screen.getByText(/Butuh persetujuan wali yang tercatat untuk membagikan kartu/i)
      ).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Unduh Gambar/i });
    const copyBtn = screen.getByRole('button', { name: /Salin Ringkasan/i });
    expect(downloadBtn).toBeDisabled();
    expect(copyBtn).toBeDisabled();
  });

  it('disables export when consent has been revoked', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
      {
        id: 'c-revoked',
        player_id: 'WK-2026-0042',
        revoked_at: '2026-10-20T10:00:00Z',
        granted_at: '2026-10-01T10:00:00Z'
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
        screen.getByText(/Butuh persetujuan wali yang tercatat untuk membagikan kartu/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Unduh Gambar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Salin Ringkasan/i })).toBeDisabled();
  });

  it('enables export when active consent is present and removes warning', async () => {
    vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
      {
        id: 'c-active',
        player_id: 'WK-2026-0042',
        revoked_at: null,
        granted_at: '2026-10-01T10:00:00Z'
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
        screen.queryByText(/Butuh persetujuan wali yang tercatat untuk membagikan kartu/i)
      ).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Unduh Gambar/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Salin Ringkasan/i })).not.toBeDisabled();
  });

  it('card contains none of: OVR, tier, percentile, Top, Rekor', () => {
    render(<StoryCardCanvas player={mockPlayer} isPrivate={false} />);

    const canvas = screen.getByTestId('progress-card-canvas');
    const content = canvas.textContent || '';

    // Must not contain any fabricated or rank metrics
    expect(content).not.toMatch(/\bOVR\b/i);
    expect(content).not.toMatch(/\btier\b/i);
    expect(content).not.toMatch(/\bpercentile\b/i);
    expect(content).not.toMatch(/\bTop\b/i);
    expect(content).not.toMatch(/\bRekor\b/i);

    // Verifies honest values are present
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
