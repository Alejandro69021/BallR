import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Award } from 'lucide-react';
import MatchTimerBar from './logger/MatchTimerBar';
import TactileKeypad from './logger/TactileKeypad';
import EventStreamLog from './logger/EventStreamLog';
import MatchRecapModal from './logger/MatchRecapModal';
import LiveTacticalPanel from './logger/LiveTacticalPanel';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LocalVideoPanel from './video/LocalVideoPanel';
import {
  listEvents,
  addEvents,
  deleteEvent,
  finaliseMatch,
  validateEvent,
  generateUUID,
  formatMatchError,
  getMatchVideoOffsets
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

  // Local Video Panel State
  const videoPanelRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(true);
  const [videoOffsets, setVideoOffsets] = useState(() => getMatchVideoOffsets(matchId));

  useEffect(() => {
    if (matchId) {
      setVideoOffsets(getMatchVideoOffsets(matchId));
    }
  }, [matchId]);

  const isVideoSourceActive = useMemo(() => {
    if (!hasVideo) return false;
    if (period === 1) return videoOffsets.p1 != null;
    if (period === 2) return videoOffsets.p2 != null && videoOffsets.p2StartMin != null;
    return false;
  }, [hasVideo, period, videoOffsets]);

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

    let calculatedMinute = Number((timerSeconds / 60).toFixed(2));
    let videoTimeS = null;

    if (hasVideo && videoPanelRef.current) {
      const vTime = videoPanelRef.current.getCurrentTime?.();
      if (vTime != null && !isNaN(vTime)) {
        videoTimeS = Number(Number(vTime).toFixed(1));
        const { p1, p2, p2StartMin } = videoPanelRef.current.getOffsets?.() || videoOffsets;

        if (period === 1 && p1 != null && !isNaN(p1)) {
          calculatedMinute = Number(Math.min(130, Math.max(0, (vTime - p1) / 60)).toFixed(2));
        } else if (period === 2 && p2 != null && !isNaN(p2) && p2StartMin != null && !isNaN(p2StartMin)) {
          calculatedMinute = Number(Math.min(130, Math.max(0, p2StartMin + Math.max(0, (vTime - p2) / 60))).toFixed(2));
        } else {
          calculatedMinute = Number((timerSeconds / 60).toFixed(2));
        }
      }
    }

    const clientEventId = generateUUID();

    const fullEvent = {
      ...eventData,
      client_event_id: clientEventId,
      match_id: matchId,
      period,
      minute: calculatedMinute,
      ...(videoTimeS != null ? { video_time_s: videoTimeS } : {})
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
    <div className="space-y-3 lg:space-y-2.5 pb-36 sm:pb-32 text-1 select-none">
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

      {/* Time Source Indicator & Video Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant={isVideoSourceActive ? 'brand' : 'neutral'} size="sm">
            Sumber waktu: {isVideoSourceActive ? 'Video' : 'Stopwatch'}
          </Badge>
          {isVideoSourceActive && (
            <span className="text-sm text-2">
              (Waktu video aktif)
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsVideoPanelOpen((prev) => !prev)}
          className="min-h-[44px] sm:min-h-0 text-sm"
        >
          {isVideoPanelOpen ? 'Sembunyikan Video' : 'Tampilkan Video'}
        </Button>
      </div>

      {/* Main Logging Area: Video panel beside (>= lg) or sticky above (< lg) the keypad */}
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4 items-start">
        <div className={isVideoPanelOpen ? 'sticky top-14 z-20 lg:static lg:col-span-6 xl:col-span-5' : 'hidden'}>
          <LocalVideoPanel
            ref={videoPanelRef}
            matchId={matchId}
            defaultYoutubeId={match?.youtube_video_id || null}
            period={period}
            onVideoLoadedChange={setHasVideo}
            onOffsetChange={setVideoOffsets}
            onToast={onToast}
          />
        </div>

        <div
          data-tour="record-events"
          className={isVideoPanelOpen ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}
        >
          <TactileKeypad
            match={match}
            participants={participants}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
            onLogEvent={handleLogEvent}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      {/* Live Tactical Readout (Collapsible) */}
      <LiveTacticalPanel
        match={match}
        events={serverEvents}
        outbox={outbox}
      />

      {/* Event Stream Log & Honest Counts */}
      <EventStreamLog
        events={serverEvents}
        outbox={outbox}
        playerMap={playerMap}
        onUndo={handleUndo}
        onFlush={flushOutbox}
        onPlayClip={(vTime) => videoPanelRef.current?.seekTo(Math.max(0, vTime - 5))}
        isFlushing={isFlushing}
        isReadOnly={isReadOnly}
      />

      {/* Sticky Bottom Recap / Finalise Bar: offset above mobile bottom nav on < md */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:left-auto z-40 max-w-md">
        <Button
          type="button"
          variant="brand"
          size="md"
          onClick={() => setShowRecapModal(true)}
          className="w-full h-12 text-sm font-semibold shadow-popover"
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
