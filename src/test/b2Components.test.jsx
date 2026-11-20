import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthModal from '../components/auth/AuthModal';
import VerificationView from '../components/VerificationView';
import ConsentManagerModal from '../components/growth/ConsentManagerModal';
import * as supabaseLib from '../lib/supabase';
import { buildPassportSnapshotPayload, generatePassportHash } from '../lib/integrity';

describe('B2 Migrated Components Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthModal', () => {
    it('shows error message and does not call onSuccess when profile row does not exist', async () => {
      vi.spyOn(supabaseLib, 'signInWithEmail').mockResolvedValue({ user: { id: 'u123' } });
      vi.spyOn(supabaseLib, 'getCurrentUserProfile').mockResolvedValue(null);

      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <AuthModal
          isOpen={true}
          onSuccess={onSuccess}
          onClose={onClose}
          targetView="assessment"
        />
      );

      fireEvent.change(screen.getByLabelText(/Alamat email/i), {
        target: { value: 'unknown@academy.id' }
      });
      fireEvent.change(screen.getByLabelText(/Kata sandi/i), {
        target: { value: 'secretpass' }
      });
      fireEvent.click(screen.getByRole('button', { name: /^Masuk$/i }));

      await waitFor(() => {
        expect(screen.getByText('Akun belum terdaftar di akademi. Hubungi admin.')).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('renders mode demo indicators and triggers demo login in demo mode', () => {
      const onSuccess = vi.fn();
      render(
        <AuthModal
          isOpen={true}
          onSuccess={onSuccess}
          onClose={() => {}}
          isDemoMode={true}
        />
      );

      expect(screen.getAllByText(/Mode demo/i).length).toBeGreaterThan(0);
      const coachDemoBtn = screen.getByRole('button', { name: /Masuk pelatih \(Mode demo\)/i });
      fireEvent.click(coachDemoBtn);
      expect(onSuccess).toHaveBeenCalledWith('coach', 'assessment');
    });

    it('closes on Escape key press', () => {
      const onClose = vi.fn();
      render(
        <AuthModal
          isOpen={true}
          onSuccess={() => {}}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('VerificationView', () => {
    it('renders invalid state with "Tidak ditemukan" badge and warning notice for unknown hash', async () => {
      vi.spyOn(supabaseLib, 'fetchPassportSnapshot').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/verifikasi/unknown-hash-123']}>
          <Routes>
            <Route path="/verifikasi/:hash" element={<VerificationView players={[]} />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Tidak ditemukan')).toBeInTheDocument();
        expect(screen.getByText(/Data Integritas Tidak Ditemukan/i)).toBeInTheDocument();
      });
    });

    it('renders valid state with technical certificate and "SHA-256 Valid" badge on matching hash', async () => {
      const mockPlayer = {
        player_id: 'p-001',
        public_id: 'WK-2026-001',
        personal_info: {
          nickname: 'Bagus',
          academy: { name: 'Mataram FA', city: 'Yogyakarta' }
        },
        ai_coach_evaluation: { period: 'Oktober 2026' },
        fitness_benchmarks: { sprint_30m_sec: 4.1 }
      };

      const payload = buildPassportSnapshotPayload(
        mockPlayer,
        mockPlayer.ai_coach_evaluation,
        mockPlayer.fitness_benchmarks,
        mockPlayer.personal_info.academy
      );
      const { hash } = await generatePassportHash(payload);

      vi.spyOn(supabaseLib, 'fetchPassportSnapshot').mockResolvedValue({
        snapshot_hash: hash,
        period_month: 'Oktober 2026',
        created_at: '2026-10-15T10:00:00.000Z',
        canonical_payload: payload
      });

      render(
        <MemoryRouter initialEntries={[`/verifikasi/${hash}`]}>
          <Routes>
            <Route path="/verifikasi/:hash" element={<VerificationView players={[mockPlayer]} />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/SHA-256 Valid/i)).toBeInTheDocument();
        expect(screen.getByText('Mataram FA')).toBeInTheDocument();
        expect(screen.getByText('WK-2026-001')).toBeInTheDocument();
        expect(screen.getByText(/Snapshot paspor kanonikal/i)).toBeInTheDocument();
      });
    });
  });

  describe('ConsentManagerModal', () => {
    const mockPlayer = {
      id: 'player-10',
      player_id: 'player-10',
      visibility_tier: 'parent_only',
      personal_info: {
        nickname: 'Rizky',
        full_name: 'Rizky Pratama'
      }
    };

    it('(a) renders all rows with "Belum ada persetujuan tercatat" when no consent record exists', async () => {
      vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([]);

      render(
        <ConsentManagerModal
          isOpen={true}
          onClose={() => {}}
          player={mockPlayer}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Belum ada persetujuan tercatat')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: /Tarik persetujuan/i })).not.toBeInTheDocument();
      });
    });

    it('(b) renders only internal_analytics as "Diizinkan" when only that purpose is stored true', async () => {
      vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
        {
          id: 'consent-1',
          player_id: 'player-10',
          version: 'v1.0-2026-10',
          granted_at: '2026-10-01T00:00:00.000Z',
          purposes: {
            internal_analytics: true,
            share_with_scouts: false,
            public_profile: false
          }
        }
      ]);

      render(
        <ConsentManagerModal
          isOpen={true}
          onClose={() => {}}
          player={mockPlayer}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Diizinkan')).toBeInTheDocument();
        expect(screen.getAllByText('Tidak diizinkan')).toHaveLength(2);
        expect(screen.getByRole('button', { name: /Tarik persetujuan/i })).toBeInTheDocument();
      });
    });

    it('(c) renders all rows as "Dicabut" and hides revoke button when consent is revoked', async () => {
      vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
        {
          id: 'consent-1',
          player_id: 'player-10',
          version: 'v1.0-2026-10',
          granted_at: '2026-10-01T00:00:00.000Z',
          revoked_at: '2026-11-20T00:00:00.000Z',
          purposes: {
            internal_analytics: true,
            share_with_scouts: true,
            public_profile: true
          }
        }
      ]);

      render(
        <ConsentManagerModal
          isOpen={true}
          onClose={() => {}}
          player={mockPlayer}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Dicabut')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: /Tarik persetujuan/i })).not.toBeInTheDocument();
      });
    });

    it('(d) clicking a row does not change any badge', async () => {
      vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
        {
          id: 'consent-1',
          player_id: 'player-10',
          version: 'v1.0-2026-10',
          granted_at: '2026-10-01T00:00:00.000Z',
          purposes: {
            internal_analytics: true,
            share_with_scouts: false,
            public_profile: false
          }
        }
      ]);

      render(
        <ConsentManagerModal
          isOpen={true}
          onClose={() => {}}
          player={mockPlayer}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Diizinkan')).toBeInTheDocument();
        expect(screen.getAllByText('Tidak diizinkan')).toHaveLength(2);
      });

      const row2 = screen.getByTestId('purpose-row-share_with_scouts');
      fireEvent.click(row2);

      expect(screen.getAllByText('Tidak diizinkan')).toHaveLength(2);
      expect(screen.getByText('Diizinkan')).toBeInTheDocument();
    });

    it('executes revocation flow when confirming revocation', async () => {
      vi.spyOn(supabaseLib, 'fetchPlayerConsents').mockResolvedValue([
        {
          id: 'consent-1',
          player_id: 'player-10',
          version: 'v1.0-2026-10',
          granted_at: '2026-10-01T00:00:00.000Z',
          purposes: {
            internal_analytics: true,
            share_with_scouts: true,
            public_profile: true
          }
        }
      ]);

      const revokeSpy = vi
        .spyOn(supabaseLib, 'revokeConsentAndSetPrivate')
        .mockResolvedValue({ success: true, timestamp: '2026-11-20T00:00:00.000Z' });

      const onRevoked = vi.fn();
      const onClose = vi.fn();
      const onToast = vi.fn();

      render(
        <ConsentManagerModal
          isOpen={true}
          onClose={onClose}
          player={mockPlayer}
          onRevoked={onRevoked}
          onToast={onToast}
        />
      );

      const triggerBtn = await screen.findByRole('button', {
        name: /Tarik persetujuan pemrosesan data/i
      });
      fireEvent.click(triggerBtn);

      const confirmBtn = screen.getByRole('button', { name: /Ya, tarik sekarang/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(revokeSpy).toHaveBeenCalledWith('player-10', 'consent-1');
        expect(onToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Persetujuan dicabut' })
        );
        expect(onRevoked).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
