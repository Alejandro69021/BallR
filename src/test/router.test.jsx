import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerificationView from '../components/VerificationView';
import { buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';

describe('Route Navigation', () => {
  it('renders integrity verification page on /verifikasi/:hash for unknown hash', async () => {
    const testHash = 'abc123hash999';

    render(
      <MemoryRouter initialEntries={[`/verifikasi/${testHash}`]}>
        <Routes>
          <Route path="/verifikasi/:hash" element={<VerificationView players={[]} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifikasi Integritas Rekam Jejak Atlet/i)).toBeInTheDocument();
    expect(await screen.findByText(new RegExp(testHash, 'i'))).toBeInTheDocument();
    expect(await screen.findByText(/Data Integritas Tidak Ditemukan/i)).toBeInTheDocument();
  });

  it('verifies and renders valid athlete passport snapshot on matching hash', async () => {
    const mockPlayer = {
      player_id: 'player-test-01',
      public_id: 'WK-2026-TEST',
      personal_info: {
        nickname: 'Dimas',
        academy: { name: 'Mataram Putra FA', city: 'Yogyakarta' }
      },
      ai_coach_evaluation: { period: 'Oktober 2026', coach_name: 'Coach Hendro' },
      fitness_benchmarks: { vertical_jump_cm: 45 }
    };

    const payload = buildPassportSnapshotPayload(
      mockPlayer,
      mockPlayer.ai_coach_evaluation,
      mockPlayer.fitness_benchmarks,
      mockPlayer.personal_info.academy
    );
    const { hash } = await generatePassportHash(payload);

    render(
      <MemoryRouter initialEntries={[`/verifikasi/${hash}`]}>
        <Routes>
          <Route path="/verifikasi/:hash" element={<VerificationView players={[mockPlayer]} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifikasi Integritas Rekam Jejak Atlet/i)).toBeInTheDocument();
    expect(await screen.findByText(/SHA-256 Valid/i)).toBeInTheDocument();
    expect(await screen.findByText(hash)).toBeInTheDocument();
    expect(await screen.findByText(/Mataram Putra FA/i)).toBeInTheDocument();
  });
});
