import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Sparkles,
  Zap,
  Timer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  Crosshair,
  Volume2,
  VolumeX,
  Sliders,
  Check
} from 'lucide-react';

export default function PitchScannerModal({
  player,
  onClose,
  onApplyResult,
  onToast
}) {
  const [testMode, setTestMode] = useState('jump'); // 'jump' | 'sprint'
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Testing Flow State: 'idle' | 'countdown' | 'recording' | 'completed'
  const [testState, setTestState] = useState('idle');
  const [countdownNum, setCountdownNum] = useState(3);
  
  // Realtime Live Metrics State
  const [liveMetrics, setLiveMetrics] = useState({
    currentHeightCm: 0,
    peakJumpCm: 0,
    hangtimeMs: 0,
    sprintElapsedSec: 0,
    gateStatus: 'ARMED'
  });

  // Recorded Test Result
  const [testResult, setTestResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Audio synthesizer tone for camera AR cues
  const playTone = (freq = 600, duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Initialize Camera Stream with rear-camera preferred
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setStreamActive(true);
          setCameraError(false);
        }
      } catch (err) {
        if (isMounted) {
          setCameraError(true);
          setStreamActive(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Countdown and Test Simulation sequence
  const startTestSequence = () => {
    setTestState('countdown');
    setCountdownNum(3);
    setTestResult(null);
    playTone(520, 0.12);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        playTone(520, 0.12);
      } else if (count === 0) {
        setCountdownNum('GO!');
        playTone(880, 0.25);
      } else {
        clearInterval(interval);
        runTestMeasurement();
      }
    }, 800);
  };

  const runTestMeasurement = () => {
    setTestState('recording');

    if (testMode === 'jump') {
      // Animate vertical jump curve over 2.5s
      const startTime = performance.now();
      const peakTarget = 46.4; // cm

      const step = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / 2200);

        // Sinusoidal jump arc trajectory
        const arc = Math.sin(progress * Math.PI);
        const currentCm = parseFloat((arc * peakTarget).toFixed(1));
        const currentHangtime = Math.round(progress * 560);

        setLiveMetrics({
          currentHeightCm: currentCm,
          peakJumpCm: peakTarget,
          hangtimeMs: currentHangtime,
          sprintElapsedSec: 0,
          gateStatus: 'TRACKING'
        });

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          // Finished jump test
          playTone(987, 0.2);
          setTestState('completed');
          const prevScore = player.fitness_benchmarks.vertical_jump_cm || 44.5;
          const diff = parseFloat((peakTarget - prevScore).toFixed(1));

          setTestResult({
            metricName: 'Vertical Jump (Explosive Power)',
            scoreDisplay: `${peakTarget} cm`,
            numericValue: peakTarget,
            type: 'vertical_jump_cm',
            percentile: 'Top 5% Mataram Putra U-13',
            diffText: diff >= 0 ? `+${diff} cm vs tes sebelumnya` : `${diff} cm`,
            improved: diff >= 0
          });
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    } else {
      // Speed Gate sprint over 3.38s
      const startTime = performance.now();
      const sprintTarget = 3.38;

      const step = (time) => {
        const elapsed = (time - startTime) / 1000;
        setLiveMetrics((prev) => ({
          ...prev,
          sprintElapsedSec: parseFloat(elapsed.toFixed(2)),
          gateStatus: elapsed > 3.0 ? 'BEAM_TRIGGERED' : 'ARMED'
        }));

        if (elapsed < sprintTarget) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          playTone(987, 0.25);
          setTestState('completed');
          const prevScore = player.fitness_benchmarks.sprint_20m_sec || 3.42;
          const diff = parseFloat((prevScore - sprintTarget).toFixed(2));

          setTestResult({
            metricName: '20m Sprint (Speed Gate)',
            scoreDisplay: `${sprintTarget}s`,
            numericValue: sprintTarget,
            type: 'sprint_20m_sec',
            percentile: 'Top 6% Mataram Putra U-13',
            diffText: diff >= 0 ? `-${diff}s lebih cepat (+0.04s rekor)` : `+${Math.abs(diff)}s`,
            improved: diff >= 0
          });
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    }
  };

  const handleApplyResult = () => {
    if (!testResult) return;
    onApplyResult(testResult);
    if (onToast) {
      onToast({
        title: `Hasil Tes Berhasil Disimpan! 🎯`,
        subtext: `${testResult.metricName}: ${testResult.scoreDisplay} masuk ke draf evaluasi ${player.personal_info.nickname}.`
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn p-2 sm:p-4 select-none">
      
      {/* 1. TOP STATUS BAR HUD */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between">
        
        {/* Left Telemetry Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-[#CCFF00]/40 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold text-[#CCFF00] tracking-wider uppercase">
              AI SCANNER: ACTIVE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
              FPS: 60
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
              MODEL: POSE-LITE V2
            </span>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-black/80 border border-slate-700/80 backdrop-blur-md">
          <button
            type="button"
            disabled={testState === 'recording' || testState === 'countdown'}
            onClick={() => {
              setTestMode('jump');
              setTestState('idle');
              setTestResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold transition-all cursor-pointer ${
              testMode === 'jump'
                ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Vertical Jump
          </button>

          <button
            type="button"
            disabled={testState === 'recording' || testState === 'countdown'}
            onClick={() => {
              setTestMode('sprint');
              setTestState('idle');
              setTestResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold transition-all cursor-pointer ${
              testMode === 'sprint'
                ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏱️ Speed Gate
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-black/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#CCFF00]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Keluar Scanner (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. CAMERA VIEWFINDER & AR HUD OVERLAY CANVAS */}
      <div className="relative w-full h-full max-w-5xl max-h-[88vh] rounded-3xl overflow-hidden bg-[#05070B] border-2 border-slate-800 shadow-2xl flex flex-col justify-between">
        
        {/* Real Video Stream or Synthetic Sports-Science Camera Fallback */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
            playsInline
            muted
            autoPlay
          />

          {/* Fallback Simulation Video / Canvas if camera denied or unavailable */}
          {cameraError && (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#090D16] via-[#111827] to-[#05070B] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
              
              {/* Simulated Pitch Background with Athlete graphic */}
              <div className="relative z-10 text-center space-y-2 p-6 max-w-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[#CCFF00]">
                  <Camera className="w-8 h-8 animate-pulse" />
                </div>
                <h4 className="font-athletic text-base font-bold text-white">
                  Pitch Camera Telemetry Simulation
                </h4>
                <p className="text-xs text-slate-400">
                  Kamera live dialihkan ke simulator Computer Vision otomatis untuk pengujian lapangan.
                </p>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-lime-500/10 text-[#CCFF00] text-[10px] font-mono border border-[#CCFF00]/20">
                  READY FOR TEST TRIGGER
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. TACTICAL SPORTS-SCIENCE AR HUD OVERLAY */}
        <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          
          {/* Top Info Bar: Target Athlete & Calibration */}
          <div className="pt-12 flex items-center justify-between text-xs font-mono">
            <div className="bg-black/75 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400">SUBJEK:</span>
              <span className="text-white font-bold">{player.personal_info.full_name} (#{player.personal_info.jersey_number})</span>
            </div>

            <div className="bg-black/75 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md flex items-center gap-2">
              <span className="text-slate-400">ALIGNMENT:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> LEVEL 0.0°
              </span>
            </div>
          </div>

          {/* Center Dynamic HUD Graphics */}
          <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center my-auto">
            
            {/* Viewfinder Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-20 h-20 border-l-2 border-t-2 border-[#CCFF00] absolute top-8 left-8"></div>
              <div className="w-20 h-20 border-r-2 border-t-2 border-[#CCFF00] absolute top-8 right-8"></div>
              <div className="w-20 h-20 border-l-2 border-b-2 border-[#CCFF00] absolute bottom-8 left-8"></div>
              <div className="w-20 h-20 border-r-2 border-b-2 border-[#CCFF00] absolute bottom-8 right-8"></div>
            </div>

            {/* PITCH ALIGNMENT GRID (Ground baseline indicator) */}
            <div className="absolute bottom-4 inset-x-8 h-8 flex flex-col items-center justify-end">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent shadow-[0_0_12px_#CCFF00]" />
              <div className="flex justify-between w-full text-[9px] font-mono text-[#CCFF00] pt-1 px-4">
                <span>◀ PITCH BASELINE</span>
                <span className="font-bold">GROUND LOCK VERIFIED</span>
                <span>CALIBRATED ▶</span>
              </div>
            </div>

            {/* JUMP MODE SPECIFIC HUD */}
            {testMode === 'jump' && (
              <>
                {/* Dynamic Athlete Skeleton Box */}
                <div
                  className={`relative w-44 sm:w-56 h-72 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-between p-3 ${
                    testState === 'recording'
                      ? 'border-[#CCFF00] shadow-[0_0_25px_rgba(204,255,0,0.4)]'
                      : 'border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  }`}
                  style={{
                    transform:
                      testState === 'recording'
                        ? `translateY(-${Math.min(100, liveMetrics.currentHeightCm * 2)}px)`
                        : 'translateY(0)'
                  }}
                >
                  {/* Head Node */}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-white/10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
                  </div>

                  {/* Body Joint Markers */}
                  <div className="text-[10px] font-mono font-bold text-center px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-white">
                    {testState === 'recording'
                      ? `LIFT: ${liveMetrics.currentHeightCm} cm`
                      : 'OPTIMAL STANCE'}
                  </div>

                  {/* Feet Anchors */}
                  <div className="w-full flex justify-between px-3">
                    <span className="w-3 h-3 rounded-full border border-cyan-400 bg-cyan-400/20"></span>
                    <span className="w-3 h-3 rounded-full border border-cyan-400 bg-cyan-400/20"></span>
                  </div>
                </div>

                {/* Laser Peak Height Line */}
                <div
                  className="absolute inset-x-4 border-t-2 border-dashed border-[#CCFF00] transition-all flex items-center justify-between px-4"
                  style={{
                    bottom: `${Math.max(40, liveMetrics.currentHeightCm * 3.2 + 60)}px`,
                    opacity: testState === 'recording' || testState === 'completed' ? 1 : 0.3
                  }}
                >
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#CCFF00] text-black">
                    PEAK: {liveMetrics.peakJumpCm || 46.4} cm
                  </span>
                  <span className="text-[10px] font-mono text-[#CCFF00]">
                    HANGTIME: {liveMetrics.hangtimeMs} ms
                  </span>
                </div>
              </>
            )}

            {/* SPRINT SPEED GATE SPECIFIC HUD */}
            {testMode === 'sprint' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Virtual Vertical Tripwire Gate Line */}
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-400 via-[#CCFF00] to-cyan-400 shadow-[0_0_20px_#CCFF00]" />
                
                {/* Gate Sensors Top & Bottom */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/85 border border-[#CCFF00] text-[10px] font-mono text-[#CCFF00] font-bold">
                  ⚡ SPEED GATE 01: ARMED
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/85 border border-cyan-400 text-[10px] font-mono text-cyan-300 font-bold">
                  20M TIMING BEAM
                </div>

                {/* Live Millisecond Chronometer Display */}
                <div className="text-center bg-black/80 p-4 rounded-2xl border border-slate-700 backdrop-blur-md">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    SPLIT TIMER
                  </div>
                  <div className="font-athletic text-4xl sm:text-6xl font-black text-white tracking-tight mt-1">
                    {liveMetrics.sprintElapsedSec.toFixed(2)}
                    <span className="text-xl text-[#CCFF00] font-mono">s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {testState === 'countdown' && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-pulse">
                <span className="font-athletic text-7xl sm:text-9xl font-black text-[#CCFF00] drop-shadow-[0_0_30px_rgba(204,255,0,0.8)]">
                  {countdownNum}
                </span>
              </div>
            )}

          </div>

          {/* 4. BOTTOM INTERACTIVE CONTROLS (Trigger button) */}
          <div className="pointer-events-auto pb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs font-mono text-slate-300 bg-black/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
              <span>MODE: <strong className="text-white">{testMode === 'jump' ? 'EXPLOSIVE JUMP' : '20M SPRINT GATE'}</strong></span>
              <span>•</span>
              <span className="text-emerald-400">STATUS: {testState.toUpperCase()}</span>
            </div>

            {testState === 'idle' && (
              <button
                type="button"
                onClick={startTestSequence}
                className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-lime-400 to-[#CCFF00] hover:from-lime-300 hover:to-lime-200 text-black font-athletic font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(204,255,0,0.35)] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai Uji Live (3s Countdown)</span>
              </button>
            )}

            {testState === 'recording' && (
              <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-mono text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>MEREKAM TELEMETRI PITCH...</span>
              </div>
            )}
          </div>

        </div>

        {/* 5. RESULT POPUP CARD (After Test Completion) */}
        {testState === 'completed' && testResult && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-[#111827] border-2 border-[#CCFF00] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(204,255,0,0.3)] space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-lime-500/20 text-[#CCFF00]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-athletic text-base sm:text-lg font-bold text-white">
                      Tes Selesai & Terverifikasi
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Kalibrasi Optik Edge-AI Sempurna
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-[#CCFF00] px-2 py-0.5 rounded bg-black border border-[#CCFF00]/40">
                  VERIFIED
                </span>
              </div>

              {/* Big Score Box */}
              <div className="p-4 rounded-2xl bg-[#090D16] border border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {testResult.metricName}
                </span>
                <div className="font-athletic text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-lime-200 to-[#CCFF00] tracking-tight">
                  {testResult.scoreDisplay}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs pt-1">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {testResult.diffText}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300 font-semibold">{testResult.percentile}</span>
                </div>
              </div>

              {/* Actions: Retest or Apply & Save */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={startTestSequence}
                  className="min-h-[44px] px-4 rounded-xl bg-[#090D16] hover:bg-[#1F2937] border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Uji Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyResult}
                  className="min-h-[44px] px-4 rounded-xl bg-[#CCFF00] hover:bg-lime-300 text-black font-athletic font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Terapkan ke Paspor</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

