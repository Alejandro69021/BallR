import React, { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import CameraFeed from './scanner/CameraFeed';
import TestTelemetryOverlay from './scanner/TestTelemetryOverlay';

export default function PitchScannerModal({
  player,
  onClose,
  onApplyResult,
  onToast
}) {
  const [testMode, setTestMode] = useState('jump');
  const [, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [testState, setTestState] = useState('idle');
  const [countdownNum, setCountdownNum] = useState(3);

  const [liveMetrics, setLiveMetrics] = useState({
    currentHeightCm: 0,
    peakJumpCm: 0,
    hangtimeMs: 0,
    sprintElapsedSec: 0,
    gateStatus: 'ARMED'
  });

  const [testResult, setTestResult] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

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
    } catch {
      // Audio autoplay handled
    }
  };

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
      } catch {
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

  const runTestMeasurement = () => {
    setTestState('recording');

    if (testMode === 'jump') {
      const startTime = performance.now();
      const duration = 1800;
      const peakTarget = 46.4;

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        const currentJump = Math.sin(progress * Math.PI) * peakTarget;
        setLiveMetrics((prev) => ({
          ...prev,
          currentHeightCm: parseFloat(currentJump.toFixed(1)),
          peakJumpCm: parseFloat(Math.max(prev.peakJumpCm, currentJump).toFixed(1)),
          hangtimeMs: Math.round(progress * 560)
        }));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          playTone(987, 0.25);
          setTestState('completed');
          const prevScore = player.fitness_benchmarks.vertical_jump_cm || 44.5;
          const diff = parseFloat((peakTarget - prevScore).toFixed(1));

          setTestResult({
            metricName: 'Vertical Jump (Explosive Power)',
            scoreDisplay: `${peakTarget} cm`,
            numericValue: peakTarget,
            type: 'vertical_jump_cm',
            percentile: 'Top 4% Nasional U-13',
            diffText: diff >= 0 ? `+${diff} cm Rekor Baru` : `${diff} cm`,
            improved: diff >= 0
          });
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    } else {
      const startTime = performance.now();
      const sprintTarget = 3.38;

      const step = (now) => {
        const elapsed = (now - startTime) / 1000;
        setLiveMetrics((prev) => ({
          ...prev,
          sprintElapsedSec: parseFloat(elapsed.toFixed(2))
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
      {/* Top Status Bar HUD */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-[#CCFF00]/40 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#CCFF00] tracking-wider uppercase">
              AI SCANNER: ACTIVE
            </span>
          </div>
        </div>

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

      <div className="relative w-full h-full max-w-5xl max-h-[88vh] rounded-3xl overflow-hidden bg-[#05070B] border-2 border-slate-800 shadow-2xl flex flex-col justify-between">
        <CameraFeed
          videoRef={videoRef}
          cameraError={cameraError}
          player={player}
          testMode={testMode}
          testState={testState}
          liveMetrics={liveMetrics}
          countdownNum={countdownNum}
        />

        <TestTelemetryOverlay
          testMode={testMode}
          testState={testState}
          testResult={testResult}
          startTestSequence={startTestSequence}
          handleApplyResult={handleApplyResult}
        />
      </div>
    </div>
  );
}
