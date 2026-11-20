import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import MatchTimerBar from '../components/logger/MatchTimerBar';
import FastPitchLogger from '../components/FastPitchLogger';
import MatchRecapModal from '../components/logger/MatchRecapModal';
import LoggerPage from '../pages/LoggerPage';
import { validateEvent, generateUUID } from '../lib/matches';
import * as matchesLib from '../lib/matches';
import * as usePlayersHook from '../hooks/usePlayers';

describe('Phase 5b: Real Match Logger & Data Integrity', () => {
  const dummyMatch = {
    id: 'test-match-101',
    opponent_name: 'Bina Putra FC',
    match_format: '11v11',
    pitch_length_m: 90,
    pitch_width_m: 60,
    status: 'draft',
    our_score: 0,
    opponent_score: 0
  };

  const dummyParticipants = [
    { player_id: 'p-01', name: 'Dimas Prasetyo', number: 10, position: 'MF', started: true },
    { player_id: 'p-02', name: 'Bagus Kahfi', number: 9, position: 'FW', started: true }
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. Clock Tests
  describe('1. Match Timer Bar & Clock Behavior', () => {
    it('starts at 00:00 and stopped by default, does not tick until started', () => {
      const onToggleTimer = vi.fn();
      render(
        <MatchTimerBar
          match={dummyMatch}
          timerSeconds={0}
          isRunning={false}
          period={1}
          onToggleTimer={onToggleTimer}
          onResetTimer={() => {}}
          onPeriodChange={() => {}}
          onAdjustMinutes={() => {}}
        />
      );

      expect(screen.getByText('00:00')).toBeDefined();
      const playButton = screen.getByRole('button', { name: /Mulai waktu/i });
      expect(playButton).toBeDefined();

      fireEvent.click(playButton);
      expect(onToggleTimer).toHaveBeenCalledTimes(1);
    });

    it('displays "Jeda" when clock is running and allows pause', () => {
      const onToggleTimer = vi.fn();
      render(
        <MatchTimerBar
          match={dummyMatch}
          timerSeconds={125}
          isRunning={true}
          period={1}
          onToggleTimer={onToggleTimer}
          onResetTimer={() => {}}
          onPeriodChange={() => {}}
          onAdjustMinutes={() => {}}
        />
      );

      // 125s = 02:05
      expect(screen.getByText('02:05')).toBeDefined();
      const pauseButton = screen.getByRole('button', { name: /Jeda waktu/i });
      expect(pauseButton).toBeDefined();

      fireEvent.click(pauseButton);
      expect(onToggleTimer).toHaveBeenCalledTimes(1);
    });

    it('allows adjusting clock by +/- 1 minute', () => {
      const onAdjustMinutes = vi.fn();
      render(
        <MatchTimerBar
          match={dummyMatch}
          timerSeconds={120}
          isRunning={false}
          period={1}
          onToggleTimer={() => {}}
          onResetTimer={() => {}}
          onPeriodChange={() => {}}
          onAdjustMinutes={onAdjustMinutes}
        />
      );

      const minusBtn = screen.getByRole('button', { name: /Kurang 1 menit/i });
      const plusBtn = screen.getByRole('button', { name: /Tambah 1 menit/i });

      fireEvent.click(minusBtn);
      expect(onAdjustMinutes).toHaveBeenCalledWith(-1);

      fireEvent.click(plusBtn);
      expect(onAdjustMinutes).toHaveBeenCalledWith(1);
    });

    it('allows switching period 1..4', () => {
      const onPeriodChange = vi.fn();
      render(
        <MatchTimerBar
          match={dummyMatch}
          timerSeconds={0}
          isRunning={false}
          period={1}
          onToggleTimer={() => {}}
          onResetTimer={() => {}}
          onPeriodChange={onPeriodChange}
          onAdjustMinutes={() => {}}
        />
      );

      const periodBtn = screen.getByRole('button', { name: /Babak 1/i });
      fireEvent.click(periodBtn);
      expect(onPeriodChange).toHaveBeenCalledWith(2);
    });
  });

  // 2. Minute & Period Event Computation
  describe('2. Event Minute Calculation', () => {
    it('computes exact minute with two decimals and associates correct period', () => {
      // 90 seconds = 1.50 minutes
      const timerSeconds = 90;
      const period = 2;
      const computedMinute = Number((timerSeconds / 60).toFixed(2));

      expect(computedMinute).toBe(1.5);

      const eventPayload = {
        client_event_id: generateUUID(),
        match_id: dummyMatch.id,
        team: 'own',
        player_id: 'p-01',
        period,
        minute: computedMinute,
        event_type: 'pass',
        outcome: 'success'
      };

      const isValid = validateEvent(eventPayload, dummyMatch);
      expect(isValid).toBe(true);
      expect(eventPayload.minute).toBe(1.5);
      expect(eventPayload.period).toBe(2);
    });
  });

  // 3. Cold Start & Zero Fabricated Data
  describe('3. Cold Start Integrity', () => {
    it('initializes with zero events and honest counts (no fabricated 21/25 stats or 14:24 clock)', async () => {
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue([]);

      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          isReadOnly={false}
        />
      );

      // Verify clock starts at 00:00
      expect(screen.getByText('00:00')).toBeDefined();

      // Verify honest status: 0 events on server, 0 outbox
      await waitFor(() => {
        expect(screen.getByText(/Tersimpan di server: 0 · Menunggu sinkron: 0/i)).toBeDefined();
      });

      // Verify empty stream log
      expect(screen.getByText(/Belum ada kejadian tercatat/i)).toBeDefined();
    });
  });

  // 4. Outbox & Retry without Duplicates
  describe('4. Outbox Persistence and Idempotent Retry', () => {
    it('keeps unsynced events in outbox when network fails, retrying with identical client_event_id', async () => {
      // First attempt fails
      let callCount = 0;
      const addEventsSpy = vi.spyOn(matchesLib, 'addEvents').mockImplementation(async (_id, events) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error simulate offline');
        }
        return events.map((e, idx) => ({ ...e, id: `server-id-${idx}` }));
      });
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue([]);

      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          isReadOnly={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Tersimpan di server: 0 · Menunggu sinkron: 0/i)).toBeDefined();
      });

      // Log a pass success event via keypad
      const passBtn = screen.getByRole('button', { name: /Umpan akurat/i });
      fireEvent.click(passBtn);

      // Outbox should now hold 1 event in localStorage
      await waitFor(() => {
        const outboxData = JSON.parse(localStorage.getItem(`match_outbox_${dummyMatch.id}`) || '[]');
        expect(outboxData.length).toBe(1);
        expect(outboxData[0].event_type).toBe('pass');
        expect(outboxData[0].client_event_id).toBeDefined();
      });

      const initialOutbox = JSON.parse(localStorage.getItem(`match_outbox_${dummyMatch.id}`));
      const originalClientId = initialOutbox[0].client_event_id;

      // Click manual sync button
      const syncBtn = screen.getByRole('button', { name: /Sinkronkan/i });
      fireEvent.click(syncBtn);

      // Second attempt succeeds
      await waitFor(() => {
        expect(addEventsSpy).toHaveBeenCalledTimes(2);
        // Verify same client_event_id passed both times
        expect(addEventsSpy.mock.calls[0][1][0].client_event_id).toBe(originalClientId);
        expect(addEventsSpy.mock.calls[1][1][0].client_event_id).toBe(originalClientId);

        // Outbox cleared in localStorage
        const clearedOutbox = JSON.parse(localStorage.getItem(`match_outbox_${dummyMatch.id}`) || '[]');
        expect(clearedOutbox.length).toBe(0);
      });
    });
  });

  // 5. Undo Flow
  describe('5. Undo Event Behavior', () => {
    it('removes event from outbox if unsynced, without calling server deleteEvent', async () => {
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue([]);
      const deleteEventSpy = vi.spyOn(matchesLib, 'deleteEvent').mockResolvedValue(true);
      // Fail addEvents so event stays in outbox
      vi.spyOn(matchesLib, 'addEvents').mockRejectedValue(new Error('Offline'));

      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          isReadOnly={false}
        />
      );

      const passBtn = screen.getByRole('button', { name: /Umpan akurat/i });
      fireEvent.click(passBtn);

      await waitFor(() => {
        expect(screen.getByText(/Menunggu sinkron: 1/i)).toBeDefined();
      });

      const undoBtn = screen.getByRole('button', { name: /Batalkan aksi terakhir/i });
      fireEvent.click(undoBtn);

      // Outbox should be empty now
      await waitFor(() => {
        const outbox = JSON.parse(localStorage.getItem(`match_outbox_${dummyMatch.id}`) || '[]');
        expect(outbox.length).toBe(0);
        expect(deleteEventSpy).not.toHaveBeenCalled();
      });
    });

    it('calls deleteEvent on server when undoing an already synced event', async () => {
      const serverEvent = {
        id: 'evt-server-99',
        client_event_id: 'client-uuid-99',
        match_id: dummyMatch.id,
        team: 'own',
        player_id: 'p-01',
        period: 1,
        minute: 12.0,
        event_type: 'shot',
        outcome: 'goal'
      };
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue([serverEvent]);
      const deleteEventSpy = vi.spyOn(matchesLib, 'deleteEvent').mockResolvedValue(true);

      render(
        <FastPitchLogger
          match={dummyMatch}
          participants={dummyParticipants}
          isReadOnly={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Tersimpan di server: 1/i)).toBeDefined();
      });

      const undoBtn = screen.getByRole('button', { name: /Batalkan aksi terakhir/i });
      fireEvent.click(undoBtn);

      await waitFor(() => {
        expect(deleteEventSpy).toHaveBeenCalledWith('evt-server-99', dummyMatch.id);
      });
    });
  });

  // 6. Coordinate & Opponent Validation
  describe('6. Pitch Coordinate & Opponent Event Validation', () => {
    it('rejects out-of-pitch coordinates exceeding pitch length or width', () => {
      const eventTooLong = {
        event_type: 'pass',
        team: 'own',
        player_id: 'p-01',
        period: 1,
        minute: 5.0,
        x_m: 95.0, // length is 90
        y_m: 30.0
      };
      expect(() => validateEvent(eventTooLong, dummyMatch)).toThrow(/di luar lapangan/i);

      const eventTooWide = {
        event_type: 'pass',
        team: 'own',
        player_id: 'p-01',
        period: 1,
        minute: 5.0,
        x_m: 45.0,
        y_m: 65.0 // width is 60
      };
      expect(() => validateEvent(eventTooWide, dummyMatch)).toThrow(/di luar lapangan/i);
    });

    it('rejects negative coordinates', () => {
      const negativeX = {
        event_type: 'pass',
        team: 'own',
        player_id: 'p-01',
        period: 1,
        minute: 5.0,
        x_m: -1.0,
        y_m: 30.0
      };
      expect(() => validateEvent(negativeX, dummyMatch)).toThrow(/angka positif/i);
    });

    it('rejects opponent event that carries a player_id', () => {
      const illegalOpponentEvent = {
        event_type: 'pass',
        team: 'opponent',
        player_id: 'p-01', // illegal
        opponent_number: 7,
        period: 1,
        minute: 5.0
      };
      expect(() => validateEvent(illegalOpponentEvent, dummyMatch)).toThrow(
        /Kejadian lawan tidak boleh memiliki ID pemain/i
      );
    });

    it('requires opponent event to specify opponent_number between 1 and 99', () => {
      const missingJersey = {
        event_type: 'pass',
        team: 'opponent',
        period: 1,
        minute: 5.0
      };
      expect(() => validateEvent(missingJersey, dummyMatch)).toThrow(
        /nomor punggung lawan/i
      );

      const outOfRangeJersey = {
        event_type: 'pass',
        team: 'opponent',
        opponent_number: 105,
        period: 1,
        minute: 5.0
      };
      expect(() => validateEvent(outOfRangeJersey, dummyMatch)).toThrow(
        /antara 1 dan 99/i
      );

      const validOpponent = {
        event_type: 'pass',
        team: 'opponent',
        opponent_number: 10,
        period: 1,
        minute: 5.0
      };
      expect(() => validateEvent(validOpponent, dummyMatch)).not.toThrow();
    });
  });

  // 7. LoggerPage Access & Final Match Read-Only
  describe('7. LoggerPage Read-Only State for Final Matches', () => {
    it('displays "Pertandingan tidak ditemukan" for unknown match ID', async () => {
      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(null);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue([]);
      vi.spyOn(usePlayersHook, 'usePlayers').mockReturnValue({ players: [], loading: false });

      render(
        <MemoryRouter initialEntries={['/pencatatan/unknown-id']}>
          <Routes>
            <Route path="/pencatatan/:matchId" element={<LoggerPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pertandingan tidak ditemukan')).toBeDefined();
      });
    });

    it('renders "Laga sudah final" banner and disables actions when match is final', async () => {
      const finalMatch = {
        ...dummyMatch,
        id: 'final-match-01',
        status: 'final',
        our_score: 2,
        opponent_score: 1
      };
      vi.spyOn(matchesLib, 'getMatch').mockResolvedValue(finalMatch);
      vi.spyOn(matchesLib, 'listParticipants').mockResolvedValue(dummyParticipants);
      vi.spyOn(matchesLib, 'listEvents').mockResolvedValue([]);
      vi.spyOn(usePlayersHook, 'usePlayers').mockReturnValue({ players: [], loading: false });

      render(
        <MemoryRouter initialEntries={['/pencatatan/final-match-01']}>
          <Routes>
            <Route path="/pencatatan/:matchId" element={<LoggerPage userRole="coach" />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Laga sudah final/i).length).toBeGreaterThan(0);
      });

      // Keypad action buttons should be disabled
      const passBtn = screen.getByRole('button', { name: /Umpan akurat/i });
      expect(passBtn.hasAttribute('disabled')).toBe(true);
    });
  });

  // 8. Finalise Blocking with Pending Outbox
  describe('8. Finalising Match Blocked by Unsynced Outbox', () => {
    it('disables finalise button and displays warning when outbox is not empty', () => {
      const onFinalise = vi.fn();
      const pendingOutbox = [
        { client_event_id: 'c-1', event_type: 'pass' },
        { client_event_id: 'c-2', event_type: 'shot' },
        { client_event_id: 'c-3', event_type: 'tackle' }
      ];

      render(
        <MatchRecapModal
          match={dummyMatch}
          events={[]}
          outbox={pendingOutbox}
          participants={dummyParticipants}
          isOpen={true}
          onClose={() => {}}
          onFinalise={onFinalise}
        />
      );

      expect(screen.getByText(/Menunggu sinkronisasi: 3 kejadian/i)).toBeDefined();
      const finaliseBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      expect(finaliseBtn.hasAttribute('disabled')).toBe(true);
    });

    it('enables finalise action when outbox is empty', () => {
      render(
        <MatchRecapModal
          match={dummyMatch}
          events={[]}
          outbox={[]}
          participants={dummyParticipants}
          isOpen={true}
          onClose={() => {}}
          onFinalise={() => {}}
        />
      );

      const finaliseBtn = screen.getByRole('button', { name: /Selesaikan laga/i });
      expect(finaliseBtn.hasAttribute('disabled')).toBe(false);
    });
  });

  // 9. Zero Legacy Tokens Grep Scan
  describe('9. Complete Purge of Legacy Match Tokens', () => {
    const srcDir = path.resolve(__dirname, '..');
    const forbiddenTokens = [
      'calculateMatchRating',
      'syncMatchStats',
      'latest_match_summary',
      'tersimpan ke paspor'
    ];

    function getAllSourceFiles(dir, fileList = []) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          getAllSourceFiles(fullPath, fileList);
        } else if (/\.(jsx?|tsx?)$/.test(file)) {
          // Exclude this test file itself
          if (file !== 'loggerRealData.test.jsx') {
            fileList.push(fullPath);
          }
        }
      }
      return fileList;
    }

    const allSourceFiles = getAllSourceFiles(srcDir);

    forbiddenTokens.forEach((token) => {
      it(`verifies 0 occurrences of "${token}" across all src/ files`, () => {
        const offendingFiles = [];
        for (const file of allSourceFiles) {
          const content = fs.readFileSync(file, 'utf-8');
          if (content.includes(token)) {
            offendingFiles.push(path.relative(srcDir, file));
          }
        }
        expect(
          offendingFiles,
          `Found "${token}" in: ${offendingFiles.join(', ')}`
        ).toEqual([]);
      });
    });
  });
});
