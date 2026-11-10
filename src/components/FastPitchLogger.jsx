import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Check,
  X,
  Target,
  Shield,
  AlertTriangle,
  Flame,
  Award,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  UserCheck,
  Send,
  Timer,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function FastPitchLogger({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onFinishMatch,
  onToast
}) {
  const activePlayer = players.find((p) => p.player_id === selectedPlayerId) || players[0];

  // 1. Digital Match Clock State
  const [timerSeconds, setTimerSeconds] = useState(14 * 60 + 24); // Start at 14:24 for realistic match feel
  const [isRunning, setIsRunning] = useState(true);
  const [matchHalf, setMatchHalf] = useState('1st Half'); // '1st Half' | '2nd Half'
  const timerRef = useRef(null);

  // Stopwatch effect
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 2. Real-Time Telemetry Counters (Per-player state tracking)
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

  // 3. Chronological Event Stream History (with Undo stack)
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
      label: "🛡️ Tackle / Intercept Won",
      color: "text-emerald-400",
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta: { tacklesWon: 1, tacklesTotal: 1 }
    },
    {
      id: "ev-3",
      time: "14:24",
      type: "key_pass",
      label: "🎯 Key / Through Pass",
      color: "text-cyan-400",
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta: { keyPasses: 1, passesCompleted: 1, passesTotal: 1 }
    }
  ]);

  // Flash feedback state for clicked button ID
  const [flashingBtn, setFlashingBtn] = useState(null);

  // Quick Goal / Shot modal prompt
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
    } catch (e) {
      // Audio autoplay policy handled
    }
  };

  // Handle Action Pad Taps
  const logEvent = (btnId, label, color, statDelta, soundType = 'positive') => {
    triggerTactile(soundType);
    setFlashingBtn(btnId);
    setTimeout(() => setFlashingBtn(null), 250);

    // Apply stat delta
    setStats((prev) => {
      const next = { ...prev };
      Object.keys(statDelta).forEach((k) => {
        next[k] = (next[k] || 0) + statDelta[k];
      });
      return next;
    });

    // Add to history
    const newEntry = {
      id: `ev-${Date.now()}`,
      time: formatTime(timerSeconds),
      type: btnId,
      label,
      color,
      playerName: activePlayer.personal_info.nickname || activePlayer.personal_info.full_name,
      statDelta
    };

    setEventHistory((prev) => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
  };

  // Undo Last Action
  const handleUndo = () => {
    if (eventHistory.length === 0) return;
    triggerTactile('error');
    const [lastEvent, ...restHistory] = eventHistory;

    // Reverse delta
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

  // Calculated Accuracy & Ratings
  const passAccuracy = stats.passesTotal > 0
    ? Math.round((stats.passesCompleted / stats.passesTotal) * 100)
    : 0;

  const tackleAccuracy = stats.tacklesTotal > 0
    ? Math.round((stats.tacklesWon / stats.tacklesTotal) * 100)
    : 0;

  const calculatedMatchRating = Math.min(
    9.8,
    Math.max(
      6.0,
      6.5 +
        (stats.passesCompleted * 0.05) +
        (stats.keyPasses * 0.4) +
        (stats.tacklesWon * 0.2) +
        (stats.goals * 0.9) -
        (stats.turnovers * 0.25)
    )
  ).toFixed(1);

  // Sync to Player Passport
  const handleConfirmSync = () => {
    setShowRecapModal(false);
    if (onFinishMatch) {
      onFinishMatch({
        playerId: activePlayer.player_id,
        playerName: activePlayer.personal_info.full_name,
        matchDuration: formatTime(timerSeconds),
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
        title: "Statistik Laga Berhasil Disinkronkan! 🏁",
        subtext: `Performa ${activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} (${calculatedMatchRating} Rating) tersimpan ke paspor bakat.`
      });
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-28 text-white select-none">
      
      {/* 1. MATCH CONTROLLER BAR (Side-line Command Hub) */}
      <section className="rounded-2xl bg-[#090D16] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Match Label & Clock */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-[10px] font-athletic font-bold uppercase tracking-wider text-rose-400">
                  Live Match Logger
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-300 font-medium">
                  MPFA Jogja vs Sleman Utd U-13
                </span>
              </div>

              {/* Digital Stopwatch Display */}
              <div className="flex items-baseline gap-2 mt-0.5">
                <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
                  {formatTime(timerSeconds)}
                </div>
                <button
                  type="button"
                  onClick={() => setMatchHalf(matchHalf === '1st Half' ? '2nd Half' : '1st Half')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-athletic font-bold text-[#CCFF00] border border-slate-700 hover:border-[#CCFF00]/40 transition-colors cursor-pointer"
                >
                  {matchHalf}
                </button>
              </div>
            </div>

            {/* Play/Pause & Reset Controls */}
            <div className="flex items-center gap-1.5 self-center">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`p-3 rounded-xl border font-bold transition-all cursor-pointer shadow-md ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-lime-500/20 text-[#CCFF00] border-[#CCFF00]/40 hover:bg-lime-500/30'
                }`}
                title={isRunning ? 'Jeda Stopwatch' : 'Mulai Stopwatch'}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerSeconds(0);
                  setIsRunning(false);
                }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Reset Waktu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Player Switcher Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-athletic font-bold uppercase text-slate-400 shrink-0 hidden sm:inline">
              Pemain:
            </span>
            {players.map((p) => {
              const isSelected = p.player_id === activePlayer.player_id;
              return (
                <button
                  key={p.player_id}
                  type="button"
                  onClick={() => onSelectPlayer(p.player_id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-athletic font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.35)] scale-105'
                      : 'bg-[#111827] text-slate-300 border-[#1F2937] hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-black">#{p.personal_info.jersey_number}</span>
                  <span>{p.personal_info.nickname || p.personal_info.full_name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME TELEMETRY COUNTERS (Dynamic calculation above keypad) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* Pass Stats */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Umpan (Akurasi)</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-white">
              {stats.passesCompleted} <span className="text-xs font-normal text-slate-400">/ {stats.passesTotal}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-cyan-400 mt-0.5">
              {passAccuracy}% Akurat
            </div>
          </div>
        </div>

        {/* Key Passes / Chances */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Peluang Tercipta</span>
            <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-[#CCFF00]">
              {stats.keyPasses}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Umpan Kunci / Terobosan
            </div>
          </div>
        </div>

        {/* Tackles & Intercepts */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Tekel & Rebut Bola</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-white">
              {stats.tacklesWon} <span className="text-xs font-normal text-slate-400">/ {stats.tacklesTotal}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
              {tackleAccuracy}% Sukses
            </div>
          </div>
        </div>

        {/* Shots & Goals */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Tembakan / Gol</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="font-athletic text-2xl font-black text-amber-400">
              {stats.shotsOnTarget} <span className="text-xs font-bold text-white">({stats.goals} Gol)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Rating Live: <strong className="text-[#CCFF00] font-mono">{calculatedMatchRating}</strong>
            </div>
          </div>
        </div>

      </section>

      {/* 3. THE TACTILE 8-PAD ACTION GRID (Mobile-First 1-Thumb Touch Target >= 64px) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-athletic font-bold uppercase tracking-wider text-slate-400">
            Sideline 1-Thumb Action Grid (Tap Cepat)
          </span>
          <span className="text-[11px] font-mono text-[#CCFF00]">
            Track: {activePlayer.personal_info.nickname || activePlayer.personal_info.full_name} #{activePlayer.personal_info.jersey_number}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Button 1: Successful Pass */}
          <button
            type="button"
            onClick={() =>
              logEvent(
                'pass_success',
                'Pass Akurat',
                'text-[#84CC16]',
                { passesCompleted: 1, passesTotal: 1 },
                'positive'
              )
            }
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'pass_success'
                ? 'bg-lime-500/25 border-[#84CC16]'
                : 'border-lime-500/30 hover:border-[#84CC16] hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[#84CC16] font-athletic font-bold text-sm sm:text-base">
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>PASS AKURAT</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              +1 Sukses ({passAccuracy}%)
            </span>
          </button>

          {/* Button 2: Misplaced Pass */}
          <button
            type="button"
            onClick={() =>
              logEvent(
                'pass_misplaced',
                'Pass Meleset',
                'text-rose-400',
                { passesTotal: 1 },
                'error'
              )
            }
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'pass_misplaced'
                ? 'bg-rose-500/25 border-rose-500'
                : 'border-rose-500/30 hover:border-rose-500 hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-400 font-athletic font-bold text-sm sm:text-base">
              <X className="w-5 h-5 stroke-[2.5]" />
              <span>PASS MELESET</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Salah Umpan / Out
            </span>
          </button>

          {/* Button 3: Key / Through Pass */}
          <button
            type="button"
            onClick={() =>
              logEvent(
                'key_pass',
                'Umpan Kunci (xA)',
                'text-cyan-400',
                { keyPasses: 1, passesCompleted: 1, passesTotal: 1 },
                'creative'
              )
            }
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'key_pass'
                ? 'bg-cyan-500/25 border-cyan-400'
                : 'border-cyan-500/30 hover:border-cyan-400 hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-cyan-400 font-athletic font-bold text-sm sm:text-base">
              <Target className="w-5 h-5" />
              <span>UMPAN KUNCI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Through Ball / Peluang
            </span>
          </button>

          {/* Button 4: Tackle / Intercept Won */}
          <button
            type="button"
            onClick={() =>
              logEvent(
                'tackle_won',
                'Tekel & Intersep',
                'text-emerald-400',
                { tacklesWon: 1, tacklesTotal: 1 },
                'positive'
              )
            }
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'tackle_won'
                ? 'bg-emerald-500/25 border-emerald-400'
                : 'border-emerald-500/30 hover:border-emerald-400 hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-400 font-athletic font-bold text-sm sm:text-base">
              <Shield className="w-5 h-5" />
              <span>REBUT / TEKEL</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Duel Darat Sukses
            </span>
          </button>

          {/* Button 5: Ball Turnover / Lost */}
          <button
            type="button"
            onClick={() =>
              logEvent(
                'turnover',
                'Kehilangan Bola',
                'text-amber-400',
                { turnovers: 1 },
                'error'
              )
            }
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'turnover'
                ? 'bg-amber-500/25 border-amber-400'
                : 'border-amber-500/30 hover:border-amber-400 hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-athletic font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>TURNOVER BOLA</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Kehilangan Penguasaan
            </span>
          </button>

          {/* Button 6: Shot On Target / Goal */}
          <button
            type="button"
            onClick={() => setShowShotModal(true)}
            className={`min-h-[68px] sm:min-h-[76px] p-3 rounded-2xl bg-[#0E131F] border-2 transition-all duration-100 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 shadow-md select-none ${
              flashingBtn === 'shot'
                ? 'bg-yellow-500/25 border-yellow-400'
                : 'border-yellow-500/30 hover:border-yellow-400 hover:bg-[#151C2C]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-yellow-300 font-athletic font-bold text-sm sm:text-base">
              <Flame className="w-5 h-5" />
              <span>TEMBAKAN / GOL</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Pilih On Target / Gol
            </span>
          </button>

        </div>
      </section>

      {/* 4. CHRONOLOGICAL EVENT FEED & UNDO CONTROL */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-3.5 sm:p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#CCFF00]" />
            <h4 className="font-athletic text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Live Stream Log (Aksi Terakhir)
            </h4>
          </div>

          {/* Prominent Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={eventHistory.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-athletic font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            <span>Batalkan Tap</span>
          </button>
        </div>

        {/* List of last 4-5 events */}
        <div className="space-y-1.5">
          {eventHistory.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">[{item.time}]</span>
                <span className="font-sans font-semibold text-white">
                  {item.playerName}:
                </span>
                <span className={`font-athletic font-bold ${item.color}`}>
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Live Recorded</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. STICKY BOTTOM BAR: FINISH MATCH & SYNC ACTION */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:left-auto z-40 max-w-md">
        <button
          type="button"
          onClick={() => setShowRecapModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-lime-500 to-[#CCFF00] hover:from-lime-400 hover:to-lime-200 text-black font-athletic font-extrabold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(204,255,0,0.4)] border border-[#CCFF00] transition-all cursor-pointer active:scale-95"
        >
          <Award className="w-5 h-5 fill-current" />
          <span>🏁 Selesai Laga & Sinkronkan ke Paspor</span>
        </button>
      </div>

      {/* POPUP 1: QUICK SHOT / GOAL MODAL */}
      {showShotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#111827] border-2 border-yellow-500/60 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h5 className="font-athletic font-bold text-base text-yellow-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>Pencatatan Tembakan / Gol</span>
              </h5>
              <button
                type="button"
                onClick={() => setShowShotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pilih hasil tembakan untuk <strong>{activePlayer.personal_info.full_name}</strong> pada menit {formatTime(timerSeconds)}:
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  logEvent(
                    'goal',
                    '⚽ GOOOL! Penyelesaian Sempurna',
                    'text-[#CCFF00]',
                    { shotsOnTarget: 1, goals: 1 },
                    'goal'
                  );
                  setShowShotModal(false);
                }}
                className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/30 to-lime-500/30 border border-[#CCFF00] text-left hover:brightness-125 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-athletic font-extrabold text-[#CCFF00] text-sm">
                    ⚽ GOL TERCIPTA!
                  </div>
                  <div className="text-[10px] text-slate-300">
                    +1 Gol & +1 Shot On Target
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#CCFF00]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  logEvent(
                    'shot_on_target',
                    '🎯 Shot On Target (Saved / Woodwork)',
                    'text-yellow-400',
                    { shotsOnTarget: 1 },
                    'positive'
                  );
                  setShowShotModal(false);
                }}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-left hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-athletic font-bold text-white text-sm">
                    🧤 Shot On Target (Ditepis Kiper)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    +1 Shot On Target
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  logEvent(
                    'shot_off_target',
                    '💨 Shot Off Target (Melenceng)',
                    'text-slate-400',
                    {},
                    'error'
                  );
                  setShowShotModal(false);
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
              >
                💨 Shot Off Target (Melebar / Terblok Bek)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: MATCH RECAP & SYNC MODAL */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border-2 border-[#CCFF00] p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-lime-500/20 text-[#CCFF00]">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-athletic text-base font-extrabold text-white">
                    Ringkasan Matchday Sideline
                  </h4>
                  <p className="text-xs text-[#CCFF00] font-semibold">
                    {activePlayer.personal_info.full_name} (#{activePlayer.personal_info.jersey_number})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecapModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Rating Highlight */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Calculated Match Rating
                </span>
                <div className="font-athletic text-3xl font-black text-[#CCFF00]">
                  {calculatedMatchRating} <span className="text-sm font-normal text-slate-400">/ 10</span>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-lg bg-lime-500/20 text-[#CCFF00] border border-[#CCFF00]/40 text-xs font-bold uppercase font-athletic">
                  Man of the Match
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Durasi: {formatTime(timerSeconds)}
                </p>
              </div>
            </div>

            {/* Stat Summary Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                <span className="text-slate-400">Total Umpan:</span>
                <div className="font-mono font-bold text-white mt-0.5">
                  {stats.passesCompleted} / {stats.passesTotal} ({passAccuracy}%)
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                <span className="text-slate-400">Umpan Kunci:</span>
                <div className="font-mono font-bold text-cyan-300 mt-0.5">
                  {stats.keyPasses} Peluang
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                <span className="text-slate-400">Tekel & Rebut Bola:</span>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">
                  {stats.tacklesWon} / {stats.tacklesTotal} ({tackleAccuracy}%)
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                <span className="text-slate-400">Tembakan / Gol:</span>
                <div className="font-mono font-bold text-amber-400 mt-0.5">
                  {stats.shotsOnTarget} On Target ({stats.goals} Gol)
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRecapModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Kembali ke Laga
              </button>

              <button
                type="button"
                onClick={handleConfirmSync}
                className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-lime-400 text-black text-xs font-athletic font-extrabold uppercase tracking-wide cursor-pointer shadow-lg"
              >
                Konfirmasi & Sinkron
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

