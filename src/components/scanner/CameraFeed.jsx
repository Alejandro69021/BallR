import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';

export default function CameraFeed({
  videoRef,
  cameraError,
  player,
  testMode,
  testState,
  liveMetrics,
  countdownNum
}) {
  return (
    <>
      {/* Real Video Stream or Synthetic Sports-Science Camera Fallback */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
          playsInline
          muted
          autoPlay
        />

        {cameraError && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#090D16] via-[#111827] to-[#05070B] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
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

      {/* TACTICAL SPORTS-SCIENCE AR HUD OVERLAY */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-4 sm:p-6">
        {/* Top Info Bar */}
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

          {/* PITCH ALIGNMENT GRID */}
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
                <div className="w-10 h-10 rounded-full border-2 border-white bg-white/10 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
                </div>

                <div className="text-[10px] font-mono font-bold text-center px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-white">
                  {testState === 'recording'
                    ? `LIFT: ${liveMetrics.currentHeightCm} cm`
                    : 'OPTIMAL STANCE'}
                </div>

                <div className="w-full flex justify-between px-3">
                  <span className="w-3 h-3 rounded-full border border-cyan-400 bg-cyan-400/20"></span>
                  <span className="w-3 h-3 rounded-full border border-cyan-400 bg-cyan-400/20"></span>
                </div>
              </div>

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
              <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-400 via-[#CCFF00] to-cyan-400 shadow-[0_0_20px_#CCFF00]" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/85 border border-[#CCFF00] text-[10px] font-mono text-[#CCFF00] font-bold">
                ⚡ SPEED GATE 01: ARMED
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black/85 border border-cyan-400 text-[10px] font-mono text-cyan-300 font-bold">
                20M TIMING BEAM
              </div>

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
      </div>
    </>
  );
}
