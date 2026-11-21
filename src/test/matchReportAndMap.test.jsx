import { vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});

import React from 'react';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

import {
  buildReportPayload,
  computeSnapshotHash,
  freezeReport,
  verifyReport,
  listReviewerCandidates,
  reconstructReportFromSnapshot
} from '../lib/report';
import EventMap from '../components/match/EventMap';
import MatchReportPage from '../pages/MatchReportPage';
import * as matchesLib from '../lib/matches';
import * as scenariosLib from '../lib/scenarios';
import * as reportLib from '../lib/report';
import { supabase, getCurrentUserProfile } from '../lib/supabase';

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    supabase: {
      from: vi.fn()
    },
    getCurrentUserProfile: vi.fn()
  };
});

describe('Match Report & Event Map System (Phase 5d)', () => {
  const dummyMatch = {
    id: 'm-100',
    academy_id: '11111111-0000-4000-8000-000000000001',
    opponent_name: 'Bintang Muda FC',
    match_date: '2026-11-15',
    status: 'final',
    own_score: 2,
    opponent_score: 1,
    pitch_length_m: 90,
    pitch_width_m: 60,
    format: '11v11',
    notes: 'Kemenangan penting fase grup.'
  };

  const dummyParticipants = [
    { player_id: 'p1', jersey_number: 10, player_name: 'Budi Handoko', position: 'AM', minutes_played: 90, is_starter: true },
    { player_id: 'p2', jersey_number: 4, player_name: 'Agus Pratama', position: 'CB', minutes_played: 90, is_starter: true }
  ];

  const dummyEvents = [
    { id: 'e1', client_event_id: 'c-01', team: 'own', player_id: 'p1', event_type: 'pass', outcome: 'success', x_m: 20, y_m: 30, end_x_m: 40, end_y_m: 30, period: 1, minute: 5 },
    { id: 'e2', client_event_id: 'c-02', team: 'own', player_id: 'p1', event_type: 'goal', outcome: 'success', x_m: 85, y_m: 30, end_x_m: null, end_y_m: null, period: 1, minute: 25 },
    { id: 'e3', client_event_id: 'c-03', team: 'opponent', player_id: null, opponent_number: 9, event_type: 'shot', outcome: 'fail', x_m: null, y_m: null, period: 2, minute: 70 }
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('1. Deterministic Cryptographic Hashes', () => {
    it('produces identical events_digest and snapshot_hash regardless of input event or participant order', async () => {
      // Input in original order
      const payload1 = await buildReportPayload(dummyMatch, dummyParticipants, dummyEvents, []);
      const hash1 = await computeSnapshotHash(payload1);

      // Input in reversed order
      const reversedEvents = [...dummyEvents].reverse();
      const reversedParticipants = [...dummyParticipants].reverse();

      const payload2 = await buildReportPayload(dummyMatch, reversedParticipants, reversedEvents, []);
      const hash2 = await computeSnapshotHash(payload2);

      // Digests and snapshot hashes must be 100% identical
      expect(payload1.events_digest).toBe(payload2.events_digest);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
      expect(payload1.events_digest).toMatch(/^[0-9a-f]{64}$/);
    });

    it('mutating a single event changes both events_digest and snapshot_hash', async () => {
      const payloadOriginal = await buildReportPayload(dummyMatch, dummyParticipants, dummyEvents, []);
      const hashOriginal = await computeSnapshotHash(payloadOriginal);

      // Mutate one coordinate slightly
      const mutatedEvents = [
        dummyEvents[0],
        { ...dummyEvents[1], minute: 26 }, // changed minute 25 -> 26
        dummyEvents[2]
      ];

      const payloadMutated = await buildReportPayload(dummyMatch, dummyParticipants, mutatedEvents, []);
      const hashMutated = await computeSnapshotHash(payloadMutated);

      expect(payloadMutated.events_digest).not.toBe(payloadOriginal.events_digest);
      expect(hashMutated).not.toBe(hashOriginal);
    });
  });

  describe('2. Report Snapshot Freezing & Verification Flow', () => {
    it('blocks freezing for draft (non-final) matches with clear error', async () => {
      const draftMatch = { ...dummyMatch, status: 'draft' };
      await expect(
        freezeReport({
          match: draftMatch,
          participants: dummyParticipants,
          events: dummyEvents,
          publishedScenarios: [],
          reviewedBy: 'coach-peer-01'
        })
      ).rejects.toThrow('Laporan hanya dapat dibekukan untuk pertandingan yang sudah final');
    });

    it('freezes a final match report and verifies successfully as "Cocok"', async () => {
      const snapshot = await freezeReport({
        match: dummyMatch,
        participants: dummyParticipants,
        events: dummyEvents,
        publishedScenarios: [],
        reviewedBy: 'coach-peer-01'
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.snapshot_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(snapshot.reviewed_by).toBe('coach-peer-01');

      // Verify immediately without mutations -> must be Cocok
      const verification = await verifyReport(
        dummyMatch,
        dummyParticipants,
        dummyEvents,
        []
      );

      expect(verification.ok).toBe(true);
      expect(verification.status).toBe('Cocok');
      expect(verification.message).toBe('Cocok');
    });

    it('detects tampering or changes after freezing as "Berbeda: data berubah setelah dibekukan"', async () => {
      await freezeReport({
        match: dummyMatch,
        participants: dummyParticipants,
        events: dummyEvents,
        publishedScenarios: [],
        reviewedBy: 'coach-peer-01'
      });

      // Alter events list after freezing
      const tamperedEvents = [
        ...dummyEvents,
        { id: 'e4', client_event_id: 'c-04', team: 'own', event_type: 'tackle', outcome: 'success', minute: 80 }
      ];

      const verification = await verifyReport(
        dummyMatch,
        dummyParticipants,
        tamperedEvents,
        []
      );

      expect(verification.ok).toBe(false);
      expect(verification.status).toBe('Berbeda');
      expect(verification.message).toBe('Berbeda: data berubah setelah dibekukan');
    });

    it('rejects duplicate freeze with identical hash', async () => {
      await freezeReport({
        match: dummyMatch,
        participants: dummyParticipants,
        events: dummyEvents,
        publishedScenarios: [],
        reviewedBy: 'coach-peer-01'
      });

      await expect(
        freezeReport({
          match: dummyMatch,
          participants: dummyParticipants,
          events: dummyEvents,
          publishedScenarios: [],
          reviewedBy: 'coach-peer-02'
        })
      ).rejects.toThrow('Laporan dengan isi persis sama sudah pernah dibekukan');
    });

    it('freezeReport without academyId throws "Akademi pertandingan tidak diketahui"', async () => {
      const matchNoAcademy = { ...dummyMatch, academy_id: null };
      await expect(
        freezeReport({
          match: matchNoAcademy,
          participants: dummyParticipants,
          events: dummyEvents,
          publishedScenarios: [],
          reviewedBy: 'coach-peer-01'
        })
      ).rejects.toThrow('Akademi pertandingan tidak diketahui');
    });

    it('listReviewerCandidates in demo mode returns candidates and excludes demo creator', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true');
      const candidates = await listReviewerCandidates('11111111-0000-4000-8000-000000000001');
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.some((c) => c.id === 'demo-coach-creator')).toBe(false);
      expect(candidates.some((c) => c.id === 'demo-coach-peer-01')).toBe(true);
    });

    it('listReviewerCandidates in real mode filters by coach+academy or admin and excludes current user', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');

      const mockProfiles = [
        { id: 'coach-01', full_name: 'Coach Budi', role: 'coach' },
        { id: 'admin-01', full_name: 'Admin Hendra', role: 'admin' },
        { id: 'coach-creator-id', full_name: 'Coach Creator', role: 'coach' }
      ];

      const mockOr = vi.fn().mockResolvedValue({ data: mockProfiles, error: null });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });
      supabase.from.mockReturnValue({ select: mockSelect });
      getCurrentUserProfile.mockResolvedValue({ id: 'coach-creator-id' });

      const candidates = await listReviewerCandidates('acad-999');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('id, full_name, role');
      expect(mockOr).toHaveBeenCalledWith('and(role.eq.coach,academy_id.eq.acad-999),role.eq.admin');

      // coach-creator-id must be excluded because there are other candidates
      expect(candidates.map((c) => c.id)).toEqual(['coach-01', 'admin-01']);

      // Solo staff exception: if only current user exists, do not exclude
      mockOr.mockResolvedValueOnce({
        data: [{ id: 'coach-creator-id', full_name: 'Coach Creator', role: 'coach' }],
        error: null
      });
      const solo = await listReviewerCandidates('acad-999');
      expect(solo.map((c) => c.id)).toEqual(['coach-creator-id']);

      vi.stubEnv('VITE_DEMO_MODE', 'true');
    });
  });

  describe('3. EventMap Component Visualization & Filters', () => {
    it('renders data honesty label and shows plotted vs excluded without location count', () => {
      render(
        <EventMap
          events={dummyEvents}
          pitchLengthM={90}
          pitchWidthM={60}
          participants={dummyParticipants}
        />
      );

      // Mandatory disclaimer label
      expect(screen.getByText('Data pencatatan manual; bukan pelacakan otomatis.')).toBeInTheDocument();

      // 2 events have coordinates, 1 has no coordinates
      expect(screen.getByText('Ditampilkan: 2 kejadian (n=3)')).toBeInTheDocument();
      expect(screen.getByText('Tanpa lokasi: 1')).toBeInTheDocument();

      // Mode switch buttons exist
      expect(screen.getByRole('button', { name: /Penanda Aksi/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aliran Umpan/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Kisi 6x3 Zona/i })).toBeInTheDocument();
    });

    it('filters events by team and updates displayed counts', () => {
      render(
        <EventMap
          events={dummyEvents}
          pitchLengthM={90}
          pitchWidthM={60}
          participants={dummyParticipants}
        />
      );

      const teamSelect = screen.getByLabelText(/Tim:/i);
      fireEvent.change(teamSelect, { target: { value: 'opponent' } });

      // Opponent has 1 event (e3), which has no coords -> plotted: 0, excluded: 1
      expect(screen.getByText('Ditampilkan: 0 kejadian (n=1)')).toBeInTheDocument();
      expect(screen.getByText('Tanpa lokasi: 1')).toBeInTheDocument();
    });

    it('renders accessible text alternative table below map', () => {
      render(
        <EventMap
          events={dummyEvents}
          pitchLengthM={90}
          pitchWidthM={60}
          participants={dummyParticipants}
        />
      );

      expect(screen.getByText(/Alternatif Teks Aksesibilitas/i)).toBeInTheDocument();
      expect(screen.getAllByText('Gol').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('(20m, 30m)')).toBeInTheDocument();
      expect(screen.getByText('Tanpa koordinat')).toBeInTheDocument();
    });
  });

  describe('4. Rigid Match Report (MatchReportPage) Fixed Section Order', () => {
    it('renders all 9 fixed sections, small-sample flag, RefChip for PPDA, and mandatory footer text', async () => {
      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(dummyMatch);
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue(dummyEvents);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue(dummyParticipants);
      vi.spyOn(scenariosLib, 'listScenarios').mockResolvedValue([]);
      vi.spyOn(reportLib, 'getLatestSnapshot').mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/laga/m-100/laporan']}>
          <Routes>
            <Route path="/laga/:matchId/laporan" element={<MatchReportPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      // Section 1: Ringkasan laga
      await waitFor(() => {
        expect(screen.getByText(/Bagian 1 • Dokumen Resmi Pertandingan/i)).toBeInTheDocument();
        expect(screen.getByText(/Laporan Pertandingan: (vs )?Bintang Muda FC/i)).toBeInTheDocument();
      });

      // Section 2: Kualitas data (mandatory) & fixed statement
      expect(screen.getByText(/Bagian 2 • Integritas & Cakupan Pencatatan \(Wajib\)/i)).toBeInTheDocument();
      expect(screen.getByText('Pencatatan manual oleh pelatih; belum diverifikasi silang.')).toBeInTheDocument();

      // Section 3: Tim kita & PPDA RefChip
      expect(screen.getByText(/Bagian 3 • Kinerja Kolektif/i)).toBeInTheDocument();
      expect(screen.getByText(/PPDA \(Intensitas Pressing\)/i)).toBeInTheDocument();
      expect(screen.getAllByTitle(/Lihat rujukan: Defensive Metrics/i).length).toBeGreaterThanOrEqual(1);

      // Section 4: Lawan (label "pengamatan satu laga")
      expect(screen.getByText(/Bagian 4 • Analisis Lawan/i)).toBeInTheDocument();
      expect(screen.getAllByText(/pengamatan satu laga/i).length).toBeGreaterThanOrEqual(1);

      // Section 5: Individu (player list, small sample badge)
      expect(screen.getByText(/Bagian 5 • Kontribusi Individu/i)).toBeInTheDocument();
      expect(screen.getByText('Budi Handoko')).toBeInTheDocument();
      expect(screen.getAllByText('sampel kecil').length).toBeGreaterThanOrEqual(1);

      // Section 6: Peta kejadian
      expect(screen.getByText(/Bagian 6 • Distribusi Spasial/i)).toBeInTheDocument();
      expect(screen.getByText(/Gambar A: Sebaran Titik Aksi Tim Kita/i)).toBeInTheDocument();

      // Section 7: Skema taktik terkait (empty fallback)
      expect(screen.getByText(/Bagian 7 • Konteks Kurikulum/i)).toBeInTheDocument();
      expect(screen.getByText('Tidak ada skema terbit terkait')).toBeInTheDocument();

      // Section 8: Lampiran metode
      expect(screen.getByText(/Bagian 8 • Transparansi Metodologi/i)).toBeInTheDocument();
      expect(screen.getByText('Distribusi Jenis Kejadian')).toBeInTheDocument();

      // Section 9: Integritas
      expect(screen.getByText(/Bagian 9 • Kriptografi & Keaslian/i)).toBeInTheDocument();
      expect(screen.getByText('report-v1')).toBeInTheDocument();

      // Mandatory footer text
      expect(
        screen.getByText('Dokumen internal akademi; berisi data anak, jangan dibagikan tanpa persetujuan wali.')
      ).toBeInTheDocument();
    });

    it('displays sections 1 through 9 in exact sequence with honest headings including "Individu"', async () => {
      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(dummyMatch);
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue(dummyEvents);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue(dummyParticipants);
      vi.spyOn(scenariosLib, 'listScenarios').mockResolvedValue([]);
      vi.spyOn(reportLib, 'getLatestSnapshot').mockResolvedValue(null);

      const { container } = render(
        <MemoryRouter initialEntries={['/laga/m-100/laporan']}>
          <Routes>
            <Route path="/laga/:matchId/laporan" element={<MatchReportPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Laporan Pertandingan: (vs )?Bintang Muda FC/i)).toBeInTheDocument();
      });

      const sectionTexts = Array.from(container.querySelectorAll('section span.font-mono.uppercase'))
        .map((el) => el.textContent.trim());

      expect(sectionTexts.length).toBe(9);
      expect(sectionTexts[0]).toContain('Bagian 1 • Dokumen Resmi Pertandingan');
      expect(sectionTexts[1]).toContain('Bagian 2 • Integritas & Cakupan Pencatatan (Wajib)');
      expect(sectionTexts[2]).toContain('Bagian 3 • Kinerja Kolektif');
      expect(sectionTexts[3]).toContain('Bagian 4 • Analisis Lawan');
      expect(sectionTexts[4]).toContain('Bagian 5 • Kontribusi Individu');
      expect(sectionTexts[5]).toContain('Bagian 6 • Distribusi Spasial');
      expect(sectionTexts[6]).toContain('Bagian 7 • Konteks Kurikulum');
      expect(sectionTexts[7]).toContain('Bagian 8 • Transparansi Metodologi');
      expect(sectionTexts[8]).toContain('Bagian 9 • Kriptografi & Keaslian');

      // Verify section 5 heading is "Individu"
      expect(screen.getByRole('heading', { level: 2, name: 'Individu' })).toBeInTheDocument();
    });

    it('disables freeze button and displays helper text if reviewer candidate list is empty', async () => {
      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(dummyMatch);
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue(dummyEvents);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue(dummyParticipants);
      vi.spyOn(scenariosLib, 'listScenarios').mockResolvedValue([]);
      vi.spyOn(reportLib, 'getLatestSnapshot').mockResolvedValue(null);
      vi.spyOn(reportLib, 'listReviewerCandidates').mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/laga/m-100/laporan']}>
          <Routes>
            <Route path="/laga/:matchId/laporan" element={<MatchReportPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Belum ada pelatih lain atau admin yang bisa meninjau/i)).toBeInTheDocument();
      });

      const freezeBtn = screen.getByRole('button', { name: /Bekukan laporan/i });
      expect(freezeBtn).toBeDisabled();
    });

    it('toggles between live and frozen views when snapshot exists', async () => {
      const frozenSnapshot = {
        id: 'snap-test-01',
        match_id: 'm-100',
        academy_id: '11111111-0000-4000-8000-000000000001',
        payload_version: 'report-v1',
        snapshot_hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        events_digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        canonical_payload: {
          payload_version: 'report-v1',
          match_id: 'm-100',
          match: dummyMatch,
          participants: dummyParticipants,
          events: dummyEvents,
          events_digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          published_scenarios: []
        },
        reviewed_by: 'Pelatih Budi Santoso',
        created_at: '2026-11-16T10:00:00.000Z'
      };

      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(dummyMatch);
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue(dummyEvents);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue(dummyParticipants);
      vi.spyOn(scenariosLib, 'listScenarios').mockResolvedValue([]);
      vi.spyOn(reportLib, 'getLatestSnapshot').mockResolvedValue(frozenSnapshot);

      render(
        <MemoryRouter initialEntries={['/laga/m-100/laporan']}>
          <Routes>
            <Route path="/laga/:matchId/laporan" element={<MatchReportPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tampilkan versi beku/i })).toBeInTheDocument();
      });

      // Click to toggle frozen view
      fireEvent.click(screen.getByRole('button', { name: /Tampilkan versi beku/i }));

      expect(screen.getByText(/Versi beku.*peninjau/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tampilkan data saat ini/i })).toBeInTheDocument();

      // Click again to toggle back to live view
      fireEvent.click(screen.getByRole('button', { name: /Tampilkan data saat ini/i }));
      expect(screen.queryByText(/Versi beku.*peninjau/i)).not.toBeInTheDocument();
    });

    it('self-contained snapshot: canonical_payload contains events array and reconstructs exact metrics', async () => {
      const payload = await buildReportPayload(dummyMatch, dummyParticipants, dummyEvents, []);
      expect(payload.events).toBeDefined();
      expect(Array.isArray(payload.events)).toBe(true);
      expect(payload.events.length).toBe(dummyEvents.length);

      const snapshot = await freezeReport({
        match: dummyMatch,
        participants: dummyParticipants,
        events: dummyEvents,
        publishedScenarios: [],
        reviewedBy: 'coach-peer-01'
      });

      expect(snapshot.canonical_payload.events).toBeDefined();
      expect(snapshot.canonical_payload.events.length).toBe(3);

      const reconstructed = reconstructReportFromSnapshot(snapshot);
      expect(reconstructed.match.id).toBe(dummyMatch.id);
      expect(reconstructed.events.length).toBe(3);
      expect(reconstructed.passStats_own.value).toBe(100);
      expect(reconstructed.shotStats_own.goals.value).toBe(1);
      expect(reconstructed.playerStats.rows.length).toBe(2);
      expect(reconstructed.dataQuality.total_events.value).toBe(3);
    });
  });

  describe('5. Zero Forbidden Words & Design Rules Scanner', () => {
    const targetFiles = [
      'src/lib/analysis/events.js',
      'src/lib/report.js',
      'src/components/match/EventMap.jsx',
      'src/pages/MatchReportPage.jsx'
    ];

    it('contains ZERO forbidden words ("optimal", "ideal", "seharusnya", "terbaik", "rating", "skor total")', () => {
      const forbiddenPatterns = [
        /\boptimal\b/i,
        /\bideal\b/i,
        /\bseharusnya\b/i,
        /\bterbaik\b/i,
        /\brating\b/i,
        /\bskor total\b/i
      ];

      for (const relPath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          const match = content.match(pattern);
          expect(match, `Forbidden word ${pattern} found in ${relPath}`).toBeNull();
        }
      }
    });

    it('contains ZERO arbitrary text sizes (text-[Npx] / text-[Nrem]) in match analysis and report UI', () => {
      const uiFiles = [
        'src/components/match/EventMap.jsx',
        'src/pages/MatchReportPage.jsx'
      ];

      const arbitraryTextRegex = /text-\[\d+(\.\d+)?(px|rem)\]/g;

      for (const relPath of uiFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(arbitraryTextRegex);
        expect(matches, `Arbitrary text size found in ${relPath}: ${matches}`).toBeNull();
      }
    });

    it('contains ZERO forbidden text sizes (text-lg, text-3xl, text-4xl) in match analysis and report UI', () => {
      const uiFiles = [
        'src/components/match/EventMap.jsx',
        'src/pages/MatchReportPage.jsx'
      ];

      const forbiddenTextTokenRegex = /\btext-(lg|3xl|4xl)\b/g;

      for (const relPath of uiFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const matches = content.match(forbiddenTextTokenRegex);
        expect(matches, `Forbidden text size class found in ${relPath}: ${matches}`).toBeNull();
      }
    });

    it('contains ZERO occurrences of "Halaman 1/1" across production source files', () => {
      const forbiddenPhrase = ['Halaman', '1/1'].join(' ');
      function scanDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'test') continue; // Skip test directory so test file doesn't self-match
            scanDir(fullPath);
          } else if (/\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content, `Hardcoded "${forbiddenPhrase}" found in ${fullPath}`).not.toContain(forbiddenPhrase);
          }
        }
      }
      scanDir(path.resolve(process.cwd(), 'src'));
    });

    it('contains ZERO dark: prefixes or hardcoded hex colors in match analysis and report UI', () => {
      const uiFiles = [
        'src/components/match/EventMap.jsx',
        'src/pages/MatchReportPage.jsx'
      ];

      const darkPrefixRegex = /dark:[a-zA-Z0-9_-]+/g;
      const hexColorRegex = /#([0-9a-fA-F]{3}){1,2}\b/g;

      for (const relPath of uiFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const darkMatches = content.match(darkPrefixRegex);
        expect(darkMatches, `dark: class found in ${relPath}: ${darkMatches}`).toBeNull();

        const hexMatches = content.match(hexColorRegex);
        expect(hexMatches, `hex color found in ${relPath}: ${hexMatches}`).toBeNull();
      }
    });
  });
});
