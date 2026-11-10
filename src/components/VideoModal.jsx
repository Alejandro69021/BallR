import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize
} from 'lucide-react';

export default function VideoModal({
  clip,
  moments = [],
  playerInfo,
  onClose,
  onSelectClip
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = moments.findIndex((m) => m.id === clip.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < moments.length - 1;

  const goToPrev = () => {
    if (hasPrev && onSelectClip) {
      onSelectClip(moments[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext && onSelectClip) {
      onSelectClip(moments[currentIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (hasNext) goToNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (hasPrev) goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, currentIndex]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatSecs = (sec) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const matchContext = `${clip.match} • Min ${clip.minute}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Backdrop Close Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Navigation Arrows for desktop */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:text-[#CCFF00] hover:border-[#CCFF00] items-center justify-center transition-all cursor-pointer shadow-xl"
          title="Klip Sebelumnya (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={goToNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:text-[#CCFF00] hover:border-[#CCFF00] items-center justify-center transition-all cursor-pointer shadow-xl"
          title="Klip Selanjutnya (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* 9:16 Vertical Video Frame Container */}
      <div className="relative z-20 w-full max-w-[360px] sm:max-w-[380px] aspect-[9/16] max-h-[92vh] rounded-2xl overflow-hidden bg-black border-2 border-[#1F2937] shadow-2xl shadow-[#CCFF00]/10 flex flex-col justify-between">
        
        {/* Top Overlay: Verified Badge & Close Button */}
        <div className="absolute top-0 inset-x-0 z-20 p-3.5 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
              <span className="text-[10px] font-bold text-[#CCFF00] tracking-wider uppercase">
                MPFA Scouting Reel ({currentIndex + 1}/{moments.length})
              </span>
            </div>
            <div className="text-xs font-semibold text-white drop-shadow">
              {matchContext}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Element with click toggle */}
        <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            key={clip.id}
            src={clip.video_url}
            poster={clip.thumbnail}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            loop
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
          />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-16 h-16 rounded-full bg-black/70 border-2 border-[#CCFF00] flex items-center justify-center text-[#CCFF00] shadow-2xl">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Overlay: Player Metadata & Custom Controls */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2.5">
          {/* Player Watermark & Action Tag */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-athletic font-bold px-1.5 py-0.5 rounded bg-[#CCFF00] text-black">
                  #{playerInfo.jersey_number}
                </span>
                <span className="font-athletic text-sm font-bold text-white tracking-wide">
                  {playerInfo.full_name}
                </span>
              </div>
              <p className="text-[11px] text-[#CCFF00] font-semibold mt-0.5">
                {clip.title}
              </p>
            </div>

            <span className="text-[10px] font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded border border-slate-700">
              {clip.category}
            </span>
          </div>

          {/* Custom Timeline Scrubber */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#CCFF00]"
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>{formatSecs(currentTime)}</span>
              <span>{formatSecs(duration)}</span>
            </div>
          </div>

          {/* Playback Control Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile Prev / Next Buttons */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={goToPrev}
                disabled={!hasPrev}
                className="px-2 py-1 text-[10px] rounded bg-white/10 disabled:opacity-30 text-white"
              >
                Prev
              </button>
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className="px-2 py-1 text-[10px] rounded bg-[#CCFF00]/20 disabled:opacity-30 text-[#CCFF00]"
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>MPFA Verified Clip</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
