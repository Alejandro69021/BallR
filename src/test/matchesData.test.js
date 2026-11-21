import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
});
import {
  ALLOWED_EVENT_TYPES,
  PITCH_DEFAULTS_BY_FORMAT,
  validateEvent,
  formatMatchError,
  listMatches,
  getMatch,
  createMatch,
  finaliseMatch,
  reopenMatch,
  listEvents,
  addEvents,
  deleteEvent
} from '../lib/matches';
import * as supabaseModule from '../lib/supabase';

describe('Matches Data Layer (src/lib/matches.js)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('1. Client Validation (validateEvent)', () => {
    const pitch = { pitch_length_m: 90, pitch_width_m: 60 };

    it('exposes exactly 22 allowed event types from migration 007', () => {
      expect(ALLOWED_EVENT_TYPES.length).toBe(22);
      expect(ALLOWED_EVENT_TYPES).toContain('pass');
      expect(ALLOWED_EVENT_TYPES).toContain('goal');
      expect(ALLOWED_EVENT_TYPES).toContain('tackle');
    });

    it('defines pitch defaults for all standard formats', () => {
      expect(PITCH_DEFAULTS_BY_FORMAT['5v5']).toEqual({ pitch_length_m: 40, pitch_width_m: 25 });
      expect(PITCH_DEFAULTS_BY_FORMAT['7v7']).toEqual({ pitch_length_m: 60, pitch_width_m: 40 });
      expect(PITCH_DEFAULTS_BY_FORMAT['9v9']).toEqual({ pitch_length_m: 75, pitch_width_m: 50 });
      expect(PITCH_DEFAULTS_BY_FORMAT['11v11']).toEqual({ pitch_length_m: 90, pitch_width_m: 60 });
    });

    it('accepts valid own team event with coordinates', () => {
      const validEvent = {
        event_type: 'pass',
        team: 'own',
        player_id: 'p-01',
        period: 1,
        minute: 10.5,
        outcome: 'success',
        x_m: 45.0,
        y_m: 30.0
      };
      expect(() => validateEvent(validEvent, pitch)).not.toThrow();
    });

    it('accepts valid opponent event with opponent_number (1..99) and no player_id', () => {
      const validOpp = {
        event_type: 'tackle',
        team: 'opponent',
        opponent_number: 10,
        period: 2,
        minute: 55,
        outcome: 'fail',
        x_m: 20,
        y_m: 15
      };
      expect(() => validateEvent(validOpp, pitch)).not.toThrow();
    });

    it('rejects disallowed event_type', () => {
      expect(() =>
        validateEvent({
          event_type: 'handball_fake',
          team: 'own',
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/Jenis kejadian tidak valid/i);
    });

    it('rejects opponent event carrying player_id', () => {
      expect(() =>
        validateEvent({
          event_type: 'shot',
          team: 'opponent',
          player_id: 'p-01',
          opponent_number: 9,
          period: 1,
          minute: 12
        }, pitch)
      ).toThrow(/Kejadian lawan tidak boleh memiliki ID pemain/i);
    });

    it('rejects opponent event with invalid opponent_number', () => {
      expect(() =>
        validateEvent({
          event_type: 'shot',
          team: 'opponent',
          opponent_number: 150,
          period: 1,
          minute: 12
        }, pitch)
      ).toThrow(/Nomor punggung lawan/i);

      expect(() =>
        validateEvent({
          event_type: 'shot',
          team: 'opponent',
          period: 1,
          minute: 12
        }, pitch)
      ).toThrow(/nomor punggung lawan/i);
    });

    it('rejects own event carrying opponent_number', () => {
      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          opponent_number: 7,
          period: 1,
          minute: 12
        }, pitch)
      ).toThrow(/Kejadian tim sendiri tidak boleh memiliki nomor punggung lawan/i);
    });

    it('rejects half-filled coordinates ((x == null) !== (y == null))', () => {
      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          x_m: 45,
          y_m: null,
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/Koordinat X dan Y harus keduanya terisi atau keduanya kosong/i);

      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          x_m: null,
          y_m: 30,
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/Koordinat X dan Y harus keduanya terisi atau keduanya kosong/i);
    });

    it('rejects coordinates outside match pitch size', () => {
      // pitch is 90 x 60
      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          x_m: 95.0,
          y_m: 30.0,
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/di luar lapangan \(90 x 60 m\)/i);

      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          x_m: 50.0,
          y_m: 65.0,
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/di luar lapangan \(90 x 60 m\)/i);
    });

    it('rejects end coordinates outside match pitch size', () => {
      expect(() =>
        validateEvent({
          event_type: 'pass',
          team: 'own',
          x_m: 50.0,
          y_m: 30.0,
          end_x_m: 92.0,
          end_y_m: 40.0,
          period: 1,
          minute: 5
        }, pitch)
      ).toThrow(/Koordinat akhir .* di luar lapangan/i);
    });
  });

  describe('2. Demo Mode Store Persistence', () => {
    it('seeds one clearly labelled fictional match and ~25 fictional events', async () => {
      const matches = await listMatches();
      expect(matches.length).toBeGreaterThanOrEqual(1);

      const demoMatch = matches.find((m) => m.opponent_name === 'Lawan Contoh');
      expect(demoMatch).toBeDefined();
      expect(demoMatch.format).toBe('11v11');
      expect(demoMatch.pitch_length_m).toBe(90);
      expect(demoMatch.pitch_width_m).toBe(60);

      const events = await listEvents(demoMatch.id);
      expect(events.length).toBe(25);

      // Verify coordinates of all seeded events are within pitch bounds
      events.forEach((evt) => {
        if (evt.x_m !== null) {
          expect(evt.x_m).toBeGreaterThanOrEqual(0);
          expect(evt.x_m).toBeLessThanOrEqual(demoMatch.pitch_length_m);
          expect(evt.y_m).toBeGreaterThanOrEqual(0);
          expect(evt.y_m).toBeLessThanOrEqual(demoMatch.pitch_width_m);
        }
      });
    });

    it('idempotent retry in addEvents: duplicate client_event_id is ignored (DO NOTHING)', async () => {
      // Create a draft match
      const newMatch = await createMatch({
        opponent_name: 'SSB Bintang Muda',
        match_date: '2026-11-25',
        format: '7v7',
        competition: 'Piala Danone'
      });
      expect(newMatch.pitch_length_m).toBe(60);
      expect(newMatch.pitch_width_m).toBe(40);
      expect(newMatch.status).toBe('draft');

      const clientEvtId = 'test-client-evt-123';
      const eventPayload = {
        client_event_id: clientEvtId,
        team: 'own',
        event_type: 'shot',
        outcome: 'success',
        period: 1,
        minute: 12,
        x_m: 50,
        y_m: 20
      };

      // First insert
      const firstBatch = await addEvents(newMatch.id, [eventPayload]);
      expect(firstBatch.length).toBe(1);

      // Retry same event (same client_event_id)
      const secondBatch = await addEvents(newMatch.id, [eventPayload]);
      expect(secondBatch.length).toBe(0);

      const allEvents = await listEvents(newMatch.id);
      expect(allEvents.length).toBe(1);
    });

    it('finalises match with scores and blocks modifications once final', async () => {
      const match = await createMatch({
        opponent_name: 'Diklat Merpati',
        match_date: '2026-11-26',
        format: '9v9'
      });

      const finalised = await finaliseMatch(match.id, { ownScore: 3, opponentScore: 1 });
      expect(finalised.status).toBe('final');
      expect(finalised.own_score).toBe(3);
      expect(finalised.opponent_score).toBe(1);

      // Attempting to add event to final match throws Indonesian error
      await expect(
        addEvents(match.id, [
          {
            team: 'own',
            event_type: 'pass',
            period: 1,
            minute: 10
          }
        ])
      ).rejects.toThrow(/Pertandingan sudah final/i);

      // Attempting to delete event from final match throws Indonesian error
      await expect(deleteEvent('some-id', match.id)).rejects.toThrow(
        /Pertandingan sudah final/i
      );

      // Reopening sets back to draft
      const reopened = await reopenMatch(match.id);
      expect(reopened.status).toBe('draft');
    });
    it('never mixes demo data into real mode when Supabase is unconfigured', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

      await expect(listMatches()).rejects.toThrow(/Koneksi Supabase belum dikonfigurasi/);
      await expect(getMatch('demo-match-contoh-01')).rejects.toThrow(/Koneksi Supabase belum dikonfigurasi/);
    });
  });

  describe('3. Supabase Mocked Calls & Payload Shapes (Real Mode)', () => {
    it('executes upsert with onConflict match_id,client_event_id and ignoreDuplicates: true', async () => {
      vi.stubEnv('VITE_DEMO_MODE', 'false');

      try {
        const mockUpsert = vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'evt-db-1', client_event_id: 'c-1' }],
            error: null
          })
        });
        const mockMaybeSingle = vi.fn().mockResolvedValue({
          data: {
            id: 'match-db-1',
            pitch_length_m: 90,
            pitch_width_m: 60,
            status: 'draft'
          },
          error: null
        });

        const mockFrom = vi.fn((table) => {
          if (table === 'matches') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: mockMaybeSingle
                })
              })
            };
          }
          if (table === 'match_events') {
            return {
              upsert: mockUpsert
            };
          }
          return {};
        });

        vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({
          from: mockFrom
        });

        const res = await addEvents('match-db-1', [
          {
            client_event_id: 'c-1',
            team: 'own',
            player_id: 'p-1',
            event_type: 'goal',
            outcome: 'success',
            period: 1,
            minute: 20,
            x_m: 85,
            y_m: 30
          }
        ]);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              match_id: 'match-db-1',
              client_event_id: 'c-1',
              team: 'own',
              player_id: 'p-1',
              event_type: 'goal',
              x_m: 85,
              y_m: 30
            })
          ]),
          { onConflict: 'match_id,client_event_id', ignoreDuplicates: true }
        );
        expect(res).toEqual([{ id: 'evt-db-1', client_event_id: 'c-1' }]);
      } finally {
        vi.stubEnv('VITE_DEMO_MODE', 'true');
      }
    });
  });

  describe('4. Error Formatter (formatMatchError)', () => {
    it('formats database error messages honestly in Indonesian', () => {
      expect(
        formatMatchError(new Error('Pertandingan sudah final; buka kembali sebagai draf'))
      ).toMatch(/Pertandingan sudah final; buka kembali sebagai draf/);

      expect(
        formatMatchError(new Error('Koordinat di luar lapangan (90 x 60 m)'))
      ).toBe('Koordinat di luar lapangan (90 x 60 m)');

      expect(
        formatMatchError(new Error('Hanya admin yang dapat membuka kembali pertandingan final'))
      ).toMatch(/Hanya admin/);
    });
  });
});
