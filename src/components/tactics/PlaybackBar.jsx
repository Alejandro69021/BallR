import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';

/**
 * PlaybackBar: Animation controls for tactical scenarios.
 * Supports play/pause, scrubber, playback speed (0.5x, 1x, 2x), and loop toggle.
 * When prefers-reduced-motion is active: replaces animation with step buttons ("Bingkai sebelumnya/berikutnya", no motion loop).
 */
export default function PlaybackBar({
  isPlaying = false,
  onTogglePlay,
  playbackSpeed = 1,
  onChangeSpeed,
  isLooping = true,
  onToggleLoop,
  onReset,
  currentProgress = 0, // 0 to 1 across the whole animation
  onSeek,
  // Step controls for reduced-motion or manual navigation
  activeFrameIndex = 0,
  totalFrames = 1,
  onStepPrevious,
  onStepNext,
  className = ''
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handleChange);
      return () => mq.removeEventListener('change', handleChange);
    } else if (mq.addListener) {
      mq.addListener(handleChange);
      return () => mq.removeListener(handleChange);
    }
  }, []);

  const speeds = [0.5, 1, 2];

  // If prefers-reduced-motion is active, render step buttons instead of continuous play
  if (reducedMotion) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-panel bg-panel border border-line select-none ${className}`}
        aria-label="Kontrol navigasi bingkai aksesibilitas gerak berkurang"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-1">
            Navigasi bertahap (gerak berkurang)
          </span>
          <span className="text-sm font-mono text-2 px-2 py-0.5 rounded-control bg-raised border border-line">
            Bingkai {activeFrameIndex + 1} / {totalFrames}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft className="w-4 h-4" strokeWidth={1.5} />}
            disabled={activeFrameIndex <= 0}
            onClick={onStepPrevious}
          >
            Bingkai sebelumnya
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
            disabled={activeFrameIndex >= totalFrames - 1}
            onClick={onStepNext}
          >
            Bingkai berikutnya
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-panel bg-panel border border-line select-none ${className}`}
      aria-label="Kontrol animasi taktik"
    >
      {/* Top: Scrubber bar */}
      <div className="flex items-center gap-3">
        <label htmlFor="playback-scrubber" className="sr-only">
          Posisi putar animasi
        </label>
        <input
          id="playback-scrubber"
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={currentProgress}
          onChange={(e) => onSeek?.(Number(e.target.value))}
          className="w-full accent-brand cursor-pointer h-2 bg-raised rounded-control"
          aria-label="Posisi garis waktu animasi"
        />
        <span className="text-sm font-mono text-2 min-w-[40px] text-right">
          {Math.round(currentProgress * 100)}%
        </span>
      </div>

      {/* Bottom controls: Play/pause, reset, speed, loop */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Play / Reset buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? 'secondary' : 'primary'}
            size="sm"
            icon={
              isPlaying ? (
                <Pause className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Play className="w-4 h-4" strokeWidth={1.5} />
              )
            }
            onClick={onTogglePlay}
            disabled={totalFrames <= 1}
          >
            {isPlaying ? 'Jeda' : 'Putar gerakan'}
          </Button>

          <IconButton
            icon={<RotateCcw className="w-4 h-4" strokeWidth={1.5} />}
            label="Mulai ulang animasi"
            variant="ghost"
            size="sm"
            onClick={onReset}
          />
        </div>

        {/* Speed & Loop settings */}
        <div className="flex items-center gap-3">
          {/* Speed picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-2 mr-1 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" strokeWidth={1.5} />
              Kecepatan:
            </span>
            {speeds.map((s) => (
              <button
                key={`speed-${s}`}
                type="button"
                onClick={() => onChangeSpeed?.(s)}
                className={`px-2 py-1 rounded-control text-sm font-mono min-h-[44px] min-w-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer flex items-center justify-center ${
                  playbackSpeed === s
                    ? 'bg-raised border border-brand text-brand font-bold'
                    : 'bg-app border border-line text-2 hover:text-1'
                }`}
                aria-pressed={playbackSpeed === s}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`px-2.5 py-1 rounded-control text-sm min-h-[44px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer ${
              isLooping
                ? 'bg-raised border-brand text-brand font-medium'
                : 'bg-app border-line text-2 hover:text-1'
            }`}
            aria-pressed={isLooping}
          >
            {isLooping ? 'Ulang terus: Aktif' : 'Ulang terus: Nonaktif'}
          </button>
        </div>
      </div>
    </div>
  );
}
