import React, { useState, useEffect, useRef } from 'react';
import { Award } from 'lucide-react';
import MatchTimerBar from './logger/MatchTimerBar';
import TactileKeypad from './logger/TactileKeypad';
import EventStreamLog from './logger/EventStreamLog';
import QuickShotModal from './logger/QuickShotModal';
import MatchRecapModal from './logger/MatchRecapModal';
import {
  calculateAccuracy,
  calculateMatchRating,
  formatSecondsToTime
} from '../lib/calculations';

export default function FastPitchLogger({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onFinishMatch,
  onToast
}) {
  const activePlayer = players.find((p) => p.player_id === selectedPlayerId) || players[0];

  // 1. Digital Match Clock State
  const [timerSeconds, setTimerSeconds] = useState(14 * 60 + 24);
  const [isRunning, setIsRunning] = useState(true);
  const [matchHalf, setMatchHalf] = useState('1st Half');
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // 2. Real-Time Telemetry Counters
  const [stats, setStats] = useState({
    passesCompleted: 21,
    passesTotal: 25,
    keyPasses: 3,
    tacklesWon: 4,
    tacklesTotal: 5,
    shotsOnTarget: 2,
    goals: 1,
    turnovers: 2,
    aerialDuelsWon: 3
  });

  // 3. Chronological Event Stream History
  const [eventHistory, setEventHistory] = useState([
    {
      id: "ev-1",
      time: "12:15",
      type: "pass_success",
      label: "✓ Successful Pass",
      color: "text-[#84CC16]",
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta: { passesCompleted: 1, passesTotal: 1 }
    },
    {
      id: "ev-2",
      time: "13:40",
      type: "tackle_won",
      label: "Tackle / Intercept Won",
      color: "text-emerald-400",
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta: { tacklesWon: 1, tacklesTotal: 1 }
    },
    {
      id: "ev-3",
      time: "14:24",
      type: "key_pass",
      label: "Key / Through Pass",
      color: "text-cyan-400",
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta: { keyPasses: 1, passesCompleted: 1, passesTotal: 1 }
    }
  ]);

  const [flashingBtn, setFlashingBtn] = useState(null);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);

  // Audio / Haptic feedback generator
  const triggerTactile = (soundType = 'positive') => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(soundType === 'error' ? [30, 20, 30] : 25);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (soundType === 'positive') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      } else if (soundType === 'creative') {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
      } else if (soundType === 'goal') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      }

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio autoplay handled
    }
  };

  const logEvent = (btnId, label, color, statDelta, soundType = 'positive') => {
    triggerTactile(soundType);
    setFlashingBtn(btnId);
    setTimeout(() => setFlashingBtn(null), 250);

    setStats((prev) => {
      const next = { ...prev };
      Object.keys(statDelta).forEach((k) => {
        next[k] = (next[k] || 0) + statDelta[k];
      });
      return next;
    });

    const newEntry = {
      id: `ev-${Date.now()}`,
      time: formatSecondsToTime(timerSeconds),
      type: btnId,
      label,
      color,
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta
    };

    setEventHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  const handleUndo = () => {
    if (eventHistory.length === 0) return;
    triggerTactile('error');
    const [lastEvent, ...restHistory] = eventHistory;

    setStats((prev) => {
      const next = { ...prev };
      Object.keys(lastEvent.statDelta).forEach((k) => {
        next[k] = Math.max(0, (next[k] || 0) - lastEvent.statDelta[k]);
      });
      return next;
    });

    setEventHistory(restHistory);

    if (onToast) {
      onToast({
        title: "Aksi Terakhir Dibatalkan ↩",
        subtext: `Menghapus "${lastEvent.label}" pada menit ${lastEvent.time}.`
      });
    }
  };

  const passAccuracy = calculateAccuracy(stats.passesCompleted, stats.passesTotal);
  const tackleAccuracy = calculateAccuracy(stats.tacklesWon, stats.tacklesTotal);
  const calculatedMatchRating = calculateMatchRating(stats);

  const handleSelectShot = (shotType) => {
    if (shotType === 'goal') {
      logEvent('goal', '⚽ GOL! Penyelesaian Sempurna', 'text-[#CCFF00]', { shotsOnTarget: 1, goals: 1 }, 'goal');
    } else if (shotType === 'shot_on_target') {
      logEvent('shot_on_target', 'Shot On Target (Saved / Woodwork)', 'text-yellow-400', { shotsOnTarget: 1 }, 'positive');
    } else {
      logEvent('shot_off_target', 'Shot Off Target (Melenceng)', 'text-slate-400', {}, 'error');
    }
    setShowShotModal(false);
  };

  const handleConfirmSync = () => {
    setShowRecapModal(false);
    if (onFinishMatch) {
      onFinishMatch({
        playerId: activePlayer.player_id,
        playerName: activePlayer.personal_info.full_name,
        matchDuration: formatSecondsToTime(timerSeconds),
        stats: {
          ...stats,
          passAccuracy,
          tackleAccuracy,
          matchRating: calculatedMatchRating
        }
      });
    }

    if (onToast) {
      onToast({
        title: "Statistik Laga Berhasil Disinkronkan",
        subtext: `Performa ${activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} (${calculatedMatchRating} Rating) tersimpan ke paspor bakat.`
      });
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-28 text-white select-none">
      <MatchTimerBar
        timerSeconds={timerSeconds}
        isRunning={isRunning}
        matchHalf={matchHalf}
        onToggleTimer={() => setIsRunning(!isRunning)}
        onResetTimer={() => {
          setTimerSeconds(0);
          setIsRunning(false);
        }}
        onToggleHalf={() => setMatchHalf(matchHalf === '1st Half' ? '2nd Half' : '1st Half')}
        players={players}
        activePlayer={activePlayer}
        onSelectPlayer={onSelectPlayer}
      />

      <TactileKeypad
        activePlayer={activePlayer}
        flashingBtn={flashingBtn}
        passAccuracy={passAccuracy}
        logEvent={logEvent}
        onOpenShotModal={() => setShowShotModal(true)}
      />

      <EventStreamLog
        stats={stats}
        passAccuracy={passAccuracy}
        tackleAccuracy={tackleAccuracy}
        calculatedMatchRating={calculatedMatchRating}
        eventHistory={eventHistory}
        onUndo={handleUndo}
      />

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:left-auto z-40 max-w-md">
        <button
          type="button"
          onClick={() => setShowRecapModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-lime-500 to-[#CCFF00] hover:from-lime-400 hover:to-lime-200 text-black font-athletic font-extrabold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(204,255,0,0.4)] border border-[#CCFF00] transition-all cursor-pointer active:scale-95"
        >
          <Award className="w-5 h-5 fill-current" />
          <span>Selesai Laga & Sinkronkan ke Paspor</span>
        </button>
      </div>

      {showShotModal && (
        <QuickShotModal
          activePlayer={activePlayer}
          timerSeconds={timerSeconds}
          onClose={() => setShowShotModal(false)}
          onSelectShot={handleSelectShot}
        />
      )}

      {showRecapModal && (
        <MatchRecapModal
          activePlayer={activePlayer}
          timerSeconds={timerSeconds}
          stats={stats}
          passAccuracy={passAccuracy}
          tackleAccuracy={tackleAccuracy}
          calculatedMatchRating={calculatedMatchRating}
          onClose={() => setShowRecapModal(false)}
          onConfirmSync={handleConfirmSync}
        />
      )}
    </div>
  );
}
