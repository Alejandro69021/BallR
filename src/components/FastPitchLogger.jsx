import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Award } from 'lucide-react';
import MatchTimerBar from './logger/MatchTimerBar';
import TactileKeypad from './logger/TactileKeypad';
import EventStreamLog from './logger/EventStreamLog';
import MatchRecapModal from './logger/MatchRecapModal';
import Button from './ui/Button';
import {
  listEvents,
  addEvents,
  deleteEvent,
  finaliseMatch,
  validateEvent,
  generateUUID,
  formatMatchError
} from '../lib/matches';

export default function FastPitchLogger({
  match,
  participants = [],
  isReadOnly = false,
  onFinishMatch,
  onToast
}) {
  const matchId = match?.id;

  // 1. Clock State (Starts at 00:00, stopped; no fake initial time)
  const clockKey = `match_clock_${matchId}`;

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [period, setPeriod] = useState(1);
  const timerRef = useRef(null);

  // Load clock state from localStorage on mount
  useEffect(() => {
    if (!matchId) return;
    try {
      const savedClockRaw = localStorage.getItem(clockKey);
      if (savedClockRaw) {
        const saved = JSON.parse(savedClockRaw);
        const elapsedSinceSave = saved.isRunning && saved.lastSavedTimestamp
          ? Math.max(0, Math.floor((Date.now() - saved.lastSavedTimestamp) / 1000))
          : 0;
        setTimerSeconds(Number(saved.timerSeconds || 0) + elapsedSinceSave);
        setIsRunning(Boolean(saved.isRunning) && !isReadOnly);
        setPeriod(Number(saved.period || 1));
      }
    } catch (e) {
      console.warn('Gagal memuat waktu laga:', e);
    }
  }, [matchId, clockKey, isReadOnly]);

  // Save clock state to localStorage whenever it changes
  useEffect(() => {
    if (!matchId) return;
    try {
      localStorage.setItem(
        clockKey,
        JSON.stringify({
          timerSeconds,
          isRunning,
          period,
          lastSavedTimestamp: Date.now()
        })
      );
    } catch (e) {
      console.warn('Gagal menyimpan waktu laga:', e);
    }
  }, [matchId, clockKey, timerSeconds, isRunning, period]);

  // Clock tick interval
  useEffect(() => {
    if (isRunning && !isReadOnly) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isReadOnly]);

  const handleToggleTimer = () => {
    if (isReadOnly) return;
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    if (isReadOnly) return;
    setIsRunning(false);
    setTimerSeconds(0);
  };

  const handleAdjustMinutes = (deltaMinutes) => {
    if (isReadOnly) return;
    setTimerSeconds((prev) => Math.max(0, prev + deltaMinutes * 60));
  };

  // 2. Outbox & Server Events
  const outboxKey = `match_outbox_${matchId}`;

  const [serverEvents, setServerEvents] = useState([]);
  const [outbox, setOutbox] = useState(() => {
    if (!matchId) return [];
    try {
      const raw = localStorage.getItem(outboxKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isFlushing, setIsFlushing] = useState(false);
  const flushingRef = useRef(false);
  const followUpScheduledRef = useRef(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(
    participants[0]?.player_id || null
  );

  const [showRecapModal, setShowRecapModal] = useState(false);
  const backoffRef = useRef(1000);
  const retryTimeoutRef = useRef(null);

  // Sync outbox to localStorage
  const saveOutbox = useCallback(
    (newOutbox) => {
      setOutbox(newOutbox);
      if (matchId) {
        try {
          localStorage.setItem(outboxKey, JSON.stringify(newOutbox));
        } catch (e) {
          console.warn('Gagal menyimpan outbox:', e);
        }
      }
    },
    [matchId, outboxKey]
  );

  // Load server events on mount
  useEffect(() => {
    if (!matchId) return;
    let isMounted = true;
    listEvents(matchId)
      .then((data) => {
        if (isMounted) setServerEvents(data || []);
      })
      .catch((err) => {
        console.warn('Gagal memuat kejadian server:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [matchId]);

  // Flush Outbox to Server (Idempotent batch insert)
  const flushOutbox = useCallback(async () => {
    if (isReadOnly || !matchId) return;

    if (flushingRef.current) {
      followUpScheduledRef.current = true;
      return;
    }

    // Read current pending outbox from localStorage for freshest state
    let pending = [];
    try {
      const raw = localStorage.getItem(outboxKey);
      pending = raw ? JSON.parse(raw) : [];
    } catch {
      pending = outbox;
    }

    if (!pending || pending.length === 0) {
      backoffRef.current = 1000;
      return;
    }

    flushingRef.current = true;
    setIsFlushing(true);

    const sentIdSet = new Set(pending.map((e) => e.client_event_id));

    try {
      await addEvents(matchId, pending);

      // Successfully saved: remove ONLY the events whose client_event_id was in the batch that was sent
      let currentOutbox = [];
      try {
        const raw = localStorage.getItem(outboxKey);
        currentOutbox = raw ? JSON.parse(raw) : [];
      } catch {
        currentOutbox = [];
      }
      const remainingOutbox = currentOutbox.filter(
        (e) => !sentIdSet.has(e.client_event_id)
      );
      saveOutbox(remainingOutbox);

      // Refresh serverEvents with listEvents(matchId) so displayed count is true
      try {
        const refreshed = await listEvents(matchId);
        setServerEvents(refreshed || []);
      } catch (listErr) {
        console.warn('Gagal memuat ulang kejadian server:', listErr);
      }

      backoffRef.current = 1000;
    } catch (err) {
      console.warn('Gagal menyinkronkan outbox, menjadwalkan coba ulang:', err);
      // Exponential backoff up to 30 seconds
      const nextDelay = Math.min(30000, backoffRef.current * 2);
      backoffRef.current = nextDelay;

      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        flushOutboxRef.current?.();
      }, nextDelay);
    } finally {
      flushingRef.current = false;
      setIsFlushing(false);

      if (followUpScheduledRef.current) {
        followUpScheduledRef.current = false;
        setTimeout(() => {
          flushOutboxRef.current?.();
        }, 0);
      }
    }
  }, [isReadOnly, matchId, outboxKey, outbox, saveOutbox]);

  const flushOutboxRef = useRef(null);
  useEffect(() => {
    flushOutboxRef.current = flushOutbox;
  });

  // Automatically attempt flush on mount if outbox is not empty
  useEffect(() => {
    if (outbox.length > 0) {
      flushOutbox();
    }
    return () => clearTimeout(retryTimeoutRef.current);
  }, []); // Run once on mount

  // 3. Log Event Handler
  const handleLogEvent = (eventData) => {
    if (isReadOnly) {
      onToast?.({
        title: 'Laga Sudah Final',
        subtext: 'Pertandingan ini telah final; kejadian tidak dapat ditambah.',
        variant: 'warning'
      });
      return;
    }

    const calculatedMinute = Number((timerSeconds / 60).toFixed(2));
    const clientEventId = generateUUID();

    const fullEvent = {
      ...eventData,
      client_event_id: clientEventId,
      match_id: matchId,
      period,
      minute: calculatedMinute
    };

    // Client-side validation before appending
    try {
      validateEvent(fullEvent, {
        pitch_length_m: match?.pitch_length_m || 90,
        pitch_width_m: match?.pitch_width_m || 60
      });
    } catch (valErr) {
      onToast?.({
        title: 'Kejadian Tidak Valid',
        subtext: valErr.message,
        variant: 'error'
      });
      return;
    }

    // Append to outbox first (offline-first local persistence)
    let currentOutbox = [];
    try {
      const raw = localStorage.getItem(outboxKey);
      currentOutbox = raw ? JSON.parse(raw) : outbox;
    } catch {
      currentOutbox = outbox;
    }
    const nextOutbox = [...currentOutbox, fullEvent];
    saveOutbox(nextOutbox);

    // If flush is running, schedule follow-up; otherwise trigger flush
    if (flushingRef.current) {
      followUpScheduledRef.current = true;
    } else {
      setTimeout(() => {
        flushOutboxRef.current?.();
      }, 0);
    }
  };

  // 4. Undo Handler (From outbox first; if empty, delete from server)
  const handleUndo = async () => {
    if (isReadOnly) return;

    let currentOutbox = [];
    try {
      const raw = localStorage.getItem(outboxKey);
      currentOutbox = raw ? JSON.parse(raw) : outbox;
    } catch {
      currentOutbox = outbox;
    }

    // If outbox has items, pop last from outbox
    if (currentOutbox.length > 0) {
      const nextOutbox = [...currentOutbox];
      const removed = nextOutbox.pop();
      saveOutbox(nextOutbox);
      onToast?.({
        title: 'Aksi Terakhir Dibatalkan',
        subtext: `Menghapus kejadian ${removed.event_type} (${removed.minute}') dari outbox.`,
        variant: 'info'
      });
      return;
    }

    // If outbox is empty, delete last event from server
    if (serverEvents.length > 0) {
      const lastServerEvent = serverEvents[serverEvents.length - 1];
      try {
        await deleteEvent(lastServerEvent.id, matchId);
        setServerEvents((prev) => prev.slice(0, -1));
        onToast?.({
          title: 'Aksi Terakhir Dihapus',
          subtext: `Menghapus kejadian ${lastServerEvent.event_type} (${lastServerEvent.minute}') dari server.`,
          variant: 'info'
        });
      } catch (err) {
        onToast?.({
          title: 'Gagal Membatalkan Aksi',
          subtext: formatMatchError(err),
          variant: 'error'
        });
      }
    }
  };

  // 5. Finalise Flow from Recap Modal
  const handleFinaliseMatch = async (ownScore, opponentScore) => {
    if (outbox.length > 0) {
      throw new Error(
        'Tidak dapat menyelesaikan laga: masih ada kejadian di outbox yang belum tersinkron ke server.'
      );
    }

    const updated = await finaliseMatch(matchId, { ownScore, opponentScore });
    onToast?.({
      title: 'Laga Berhasil Difinalkan',
      subtext: `Skor akhir ${updated.own_score} - ${updated.opponent_score} disimpan.`,
      variant: 'success'
    });
    onFinishMatch?.(updated);
  };

  // Player map lookup for display
  const playerMap = useMemo(() => {
    const map = {};
    participants.forEach((p) => {
      map[p.player_id] = {
        name: p.name || p.player_id,
        number: p.number ?? '-'
      };
    });
    return map;
  }, [participants]);

  return (
    <div className="space-y-4 pb-28 text-1 select-none">
      {/* Timer Bar */}
      <MatchTimerBar
        match={match}
        timerSeconds={timerSeconds}
        isRunning={isRunning}
        period={period}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onPeriodChange={(nextP) => setPeriod(nextP)}
        onAdjustMinutes={handleAdjustMinutes}
        isReadOnly={isReadOnly}
      />

      {/* Tactile Keypad */}
      <TactileKeypad
        match={match}
        participants={participants}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
        onLogEvent={handleLogEvent}
        isReadOnly={isReadOnly}
      />

      {/* Event Stream Log & Honest Counts */}
      <EventStreamLog
        events={serverEvents}
        outbox={outbox}
        playerMap={playerMap}
        onUndo={handleUndo}
        onFlush={flushOutbox}
        isFlushing={isFlushing}
        isReadOnly={isReadOnly}
      />

      {/* Sticky Bottom Recap / Finalise Bar */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:left-auto z-40 max-w-md">
        <Button
          type="button"
          variant="brand"
          size="md"
          onClick={() => setShowRecapModal(true)}
          className="w-full h-12 text-xs font-semibold shadow-popover"
          icon={<Award className="w-4 h-4" strokeWidth={1.5} />}
        >
          Lihat ringkasan & selesaikan laga
        </Button>
      </div>

      {/* Recap Modal */}
      {showRecapModal && (
        <MatchRecapModal
          match={match}
          events={serverEvents}
          outbox={outbox}
          playerMap={playerMap}
          onClose={() => setShowRecapModal(false)}
          onFinaliseMatch={handleFinaliseMatch}
          onFlushOutbox={flushOutbox}
          isFlushing={isFlushing}
        />
      )}
    </div>
  );
}
