import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Video,
  AlertTriangle,
  Clock,
  Film,
  CheckCircle2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatSecondsToTime } from '../../lib/calculations';
import { getMatchVideoOffsets, updateMatchVideoOffsets } from '../../lib/matches';

/**
 * Checks if a match has remembered video metadata in localStorage.
 */
export function hasStoredVideoMeta(matchId) {
  if (typeof window === 'undefined' || !window.localStorage || !matchId) return false;
  try {
    const raw = localStorage.getItem(`ballr_video_meta_${matchId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.name);
  } catch {
    return false;
  }
}

/**
 * Converts a time string "mm:ss" or numeric seconds to integer seconds.
 * Returns null if invalid or empty.
 */
export function parseTimeToSeconds(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;

  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const m = Number(parts[0]);
      const s = Number(parts[1]);
      if (!isNaN(m) && !isNaN(s) && m >= 0 && s >= 0 && s < 60) {
        return Math.floor(m * 60 + s);
      }
    }
  }

  const num = Number(str);
  if (!isNaN(num) && num >= 0) {
    return Math.floor(num);
  }
  return null;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

const LocalVideoPanel = forwardRef(function LocalVideoPanel(
  {
    matchId,
    period = 1,
    onTimeUpdate,
    onVideoLoadedChange,
    onOffsetChange,
    onToast,
    className = ''
  },
  ref
) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [codecError, setCodecError] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(null);

  // Metadata remembered per match in localStorage
  const metaStorageKey = `ballr_video_meta_${matchId}`;
  const [savedMeta, setSavedMeta] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage || !matchId) return null;
    try {
      const raw = localStorage.getItem(metaStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Sync offsets state (stored in localStorage / demo store)
  const [offsetP1Input, setOffsetP1Input] = useState('');
  const [offsetP2Input, setOffsetP2Input] = useState('');
  const [p2StartMinInput, setP2StartMinInput] = useState('');
  const [offsetP1Secs, setOffsetP1Secs] = useState(null);
  const [offsetP2Secs, setOffsetP2Secs] = useState(null);
  const [p2StartMinVal, setP2StartMinVal] = useState(null);

  // Ergonomics: offset collapse state & mobile mini player
  const [userExpanded, setUserExpanded] = useState(false);
  const [isMini, setIsMini] = useState(false);

  // Load existing offsets
  useEffect(() => {
    if (!matchId) return;
    const offsets = getMatchVideoOffsets(matchId);
    if (offsets.p1 != null) {
      setOffsetP1Secs(offsets.p1);
      setOffsetP1Input(formatSecondsToTime(offsets.p1));
    }
    if (offsets.p2 != null) {
      setOffsetP2Secs(offsets.p2);
      setOffsetP2Input(formatSecondsToTime(offsets.p2));
    }
    if (offsets.p2StartMin != null) {
      setP2StartMinVal(offsets.p2StartMin);
      setP2StartMinInput(String(offsets.p2StartMin));
    }
  }, [matchId]);

  // Clean up object URL on unmount or replace
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Notify parent of video presence
  useEffect(() => {
    onVideoLoadedChange?.(Boolean(videoSrc && !codecError));
  }, [videoSrc, codecError, onVideoLoadedChange]);

  // Seek and playback controls exposed via ref
  useImperativeHandle(
    ref,
    () => ({
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      hasVideo: Boolean(videoSrc && !codecError),
      getOffsets: () => ({ p1: offsetP1Secs, p2: offsetP2Secs, p2StartMin: p2StartMinVal }),
      seekTo: (seconds, shouldPlay = true) => {
        if (!videoRef.current) return;
        const target = Math.max(0, Number(seconds) || 0);
        videoRef.current.currentTime = target;
        setCurrentTime(target);
        if (shouldPlay) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      },
      openFilePicker: () => {
        fileInputRef.current?.click();
      }
    }),
    [videoSrc, codecError, offsetP1Secs, offsetP2Secs, p2StartMinVal]
  );

  // File selection handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCodecError(false);
    setSizeWarning(null);

    // Check against remembered metadata
    if (savedMeta) {
      if (savedMeta.name === file.name && savedMeta.size !== file.size) {
        setSizeWarning(
          `Peringatan: Berkas "${file.name}" memiliki ukuran berbeda (${file.size} bytes) dari yang sebelumnya dicatat (${savedMeta.size} bytes).`
        );
      }
    }

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    // Attach via local object URL - NEVER sent to server or storage
    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setCurrentTime(0);
    setIsPlaying(false);

    // Remember metadata in localStorage
    const meta = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified
    };
    try {
      localStorage.setItem(metaStorageKey, JSON.stringify(meta));
      setSavedMeta(meta);
    } catch (err) {
      console.warn('Gagal menyimpan metadata video di localStorage:', err);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!isNaN(dur) && dur > 0) {
      setDuration(dur);
      if (savedMeta) {
        try {
          const updated = { ...savedMeta, duration: dur };
          localStorage.setItem(metaStorageKey, JSON.stringify(updated));
          setSavedMeta(updated);
        } catch {}
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
  };

  const handleVideoError = () => {
    setCodecError(true);
    setIsPlaying(false);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Time jump
  const jumpTime = (deltaSeconds) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration || 14400, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Scrubber seek
  const handleScrub = (e) => {
    const val = Number(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  // Playback speed
  const changeSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpTime(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpTime(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, jumpTime]);

  // Handle offset changes
  const handleOffsetP1Blur = () => {
    const secs = parseTimeToSeconds(offsetP1Input);
    setOffsetP1Secs(secs);
    if (secs !== null) {
      setOffsetP1Input(formatSecondsToTime(secs));
    }
    updateMatchVideoOffsets(matchId, {
      offsetP1: secs,
      offsetP2: offsetP2Secs,
      p2StartMin: p2StartMinVal
    });
    onOffsetChange?.({ p1: secs, p2: offsetP2Secs, p2StartMin: p2StartMinVal });
  };

  const handleOffsetP2Blur = () => {
    const secs = parseTimeToSeconds(offsetP2Input);
    setOffsetP2Secs(secs);
    if (secs !== null) {
      setOffsetP2Input(formatSecondsToTime(secs));
    }
    updateMatchVideoOffsets(matchId, {
      offsetP1: offsetP1Secs,
      offsetP2: secs,
      p2StartMin: p2StartMinVal
    });
    onOffsetChange?.({ p1: offsetP1Secs, p2: secs, p2StartMin: p2StartMinVal });
  };

  const handleP2StartMinBlur = () => {
    const num = Number(p2StartMinInput);
    const valid = !isNaN(num) && num > 0 && num <= 130 ? Number(num.toFixed(2)) : null;
    setP2StartMinVal(valid);
    if (valid !== null) {
      setP2StartMinInput(String(valid));
    } else {
      setP2StartMinInput('');
    }
    updateMatchVideoOffsets(matchId, {
      offsetP1: offsetP1Secs,
      offsetP2: offsetP2Secs,
      p2StartMin: valid
    });
    onOffsetChange?.({ p1: offsetP1Secs, p2: offsetP2Secs, p2StartMin: valid });
  };

  const handleUseCurrentTimeForP1 = () => {
    const rounded = Math.floor(currentTime);
    setOffsetP1Secs(rounded);
    setOffsetP1Input(formatSecondsToTime(rounded));
    updateMatchVideoOffsets(matchId, {
      offsetP1: rounded,
      offsetP2: offsetP2Secs,
      p2StartMin: p2StartMinVal
    });
    onOffsetChange?.({ p1: rounded, p2: offsetP2Secs, p2StartMin: p2StartMinVal });
    onToast?.({
      title: 'Offset Babak 1 Disimpan',
      subtext: `Menit mulai Babak 1 disinkronkan ke ${formatSecondsToTime(rounded)}`,
      variant: 'brand'
    });
  };

  const handleUseCurrentTimeForP2 = () => {
    const rounded = Math.floor(currentTime);
    setOffsetP2Secs(rounded);
    setOffsetP2Input(formatSecondsToTime(rounded));
    updateMatchVideoOffsets(matchId, {
      offsetP1: offsetP1Secs,
      offsetP2: rounded,
      p2StartMin: p2StartMinVal
    });
    onOffsetChange?.({ p1: offsetP1Secs, p2: rounded, p2StartMin: p2StartMinVal });
    onToast?.({
      title: 'Offset Babak 2 Disimpan',
      subtext: `Menit mulai Babak 2 disinkronkan ke ${formatSecondsToTime(rounded)}`,
      variant: 'brand'
    });
  };

  const activeOffsetSecs = period === 1 ? offsetP1Secs : (period === 2 ? offsetP2Secs : null);

  // Ergonomics: offset completeness for active period
  const isPeriod1Complete = offsetP1Secs != null;
  const isPeriod2Complete = offsetP2Secs != null && p2StartMinVal != null;
  const isCompleteForPeriod = offsetP1Secs != null && (period === 1 || isPeriod2Complete);
  const isOffsetCollapsed = isCompleteForPeriod && !userExpanded;

  const getOffsetSummaryText = () => {
    const parts = [];
    if (offsetP1Secs != null) {
      parts.push(`Babak 1 mulai ${formatSecondsToTime(offsetP1Secs)}`);
    } else {
      parts.push('Babak 1 belum diatur');
    }

    if (offsetP2Secs != null && p2StartMinVal != null) {
      parts.push(`Babak 2 mulai ${formatSecondsToTime(offsetP2Secs)} (menit ${p2StartMinVal})`);
    } else if (offsetP2Secs != null) {
      parts.push(`Babak 2 mulai ${formatSecondsToTime(offsetP2Secs)}`);
    }

    return `Sinkron: ${parts.join(' · ')}`;
  };

  return (
    <div className={`p-2.5 sm:p-3 rounded-panel bg-panel border border-line space-y-2 text-1 ${className}`}>
      {/* Header & Source Notice */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-line">
        <div className="flex items-center gap-1.5 shrink-0">
          <Film className="w-4 h-4 text-brand shrink-0" />
          <h3 className="text-sm font-semibold text-1">Video Laga Lokal</h3>
          <Badge variant="neutral" size="sm">
            Fase A
          </Badge>
        </div>
        <p className="text-sm text-2 font-mono truncate max-w-[220px] sm:max-w-none text-right">
          Video diputar dari perangkat ini dan tidak diunggah.
        </p>
      </div>

      {/* Warning for size/duration mismatch */}
      {sizeWarning && (
        <div className="p-3 rounded-control bg-warning/10 border border-warning/30 text-warning text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{sizeWarning}</span>
        </div>
      )}

      {/* Codec Error Notice */}
      {codecError && (
        <div className="p-3 rounded-control bg-danger/10 border border-danger/30 text-danger text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Format video tidak didukung browser. Coba MP4 (H.264)</span>
        </div>
      )}

      {/* Video Element or File Selector */}
      {videoSrc && !codecError ? (
        <div
          data-testid="mini-player"
          className="sticky top-14 z-20 lg:static bg-panel space-y-1.5"
        >
          <div className="flex items-center justify-between pb-0.5 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-2 font-mono truncate max-w-[140px] sm:max-w-[200px]">
                {savedMeta?.name || 'Video terpasang'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] sm:min-h-0 text-sm text-brand hover:underline font-medium inline-flex items-center shrink-0 cursor-pointer"
              >
                Ganti berkas
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsMini((prev) => !prev)}
              aria-label={isMini ? 'Perbesar video' : 'Kecilkan video'}
              className="min-h-[44px] sm:min-h-0 text-sm px-2.5 py-1 rounded-control bg-raised border border-line hover:border-brand text-2 hover:text-1 inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              {isMini ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perbesar video</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Kecilkan video</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`relative aspect-video bg-black rounded-control overflow-hidden flex items-center justify-center mx-auto transition-all ${
              isMini ? 'max-h-[28vh]' : 'max-h-[40vh]'
            }`}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className={`w-full h-full object-contain ${
                isMini ? 'max-h-[28vh]' : 'max-h-[40vh]'
              }`}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
              playsInline
            />
          </div>

          {/* Scrubber & Time */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleScrub}
                aria-label="Garis waktu video"
                className="w-full h-1.5 cursor-pointer accent-brand bg-raised rounded-lg min-h-[44px] sm:min-h-0"
              />
            </div>
            <div className="flex items-center justify-between text-sm font-mono tabular-nums text-2">
              <span>{formatSecondsToTime(currentTime)}</span>
              <span>{formatSecondsToTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar: All buttons >= 44px touch targets on coarse screens */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-x-auto">
            {/* Play/Pause & Jumps */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-fit px-2 sm:px-2.5 py-1 rounded-control bg-brand text-slate-950 hover:bg-brand/90 font-medium inline-flex items-center justify-center gap-1 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
              </button>

              <button
                type="button"
                onClick={() => jumpTime(-5)}
                aria-label="Mundur 5 detik"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 px-1.5 py-1 rounded-control bg-raised border border-line text-1 hover:border-brand text-sm inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Rewind className="w-3 h-3" />
                <span>-5s</span>
              </button>

              <button
                type="button"
                onClick={() => jumpTime(-1)}
                aria-label="Mundur 1 detik"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-7 px-1 py-1 rounded-control bg-raised border border-line text-1 hover:border-brand text-sm inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                -1s
              </button>

              <button
                type="button"
                onClick={() => jumpTime(1)}
                aria-label="Maju 1 detik"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-7 px-1 py-1 rounded-control bg-raised border border-line text-1 hover:border-brand text-sm inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                +1s
              </button>

              <button
                type="button"
                onClick={() => jumpTime(5)}
                aria-label="Maju 5 detik"
                className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 px-1.5 py-1 rounded-control bg-raised border border-line text-1 hover:border-brand text-sm inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span>+5s</span>
                <FastForward className="w-3 h-3" />
              </button>
            </div>

            {/* Playback Speeds */}
            <div className="flex items-center gap-1 shrink-0">
              {PLAYBACK_SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => changeSpeed(sp)}
                  className={`min-h-[44px] min-w-[44px] sm:min-h-7 sm:min-w-7 px-1.5 py-0.5 rounded-control text-sm font-mono font-medium transition-colors cursor-pointer ${
                    playbackSpeed === sp
                      ? 'bg-raised border border-brand text-brand'
                      : 'bg-app border border-line text-2 hover:text-1'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-control bg-app border border-dashed border-line text-center space-y-2.5">
          <Video className="w-6 h-6 text-2 mx-auto" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-1">
              {savedMeta
                ? `Pilih ulang file: ${savedMeta.name}`
                : 'Belum ada video pertandingan yang dimuat'}
            </p>
            <p className="text-sm text-2 max-w-sm mx-auto">
              Pilih berkas video dari komputer Anda untuk memutar dan menyinkronkan penandaan kejadian.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-1.5 rounded-control bg-raised border border-line hover:border-brand text-sm font-semibold text-1 inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Video className="w-4 h-4 text-brand" />
            <span>Pilih video laga dari perangkat</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Pilih berkas video dari perangkat"
      />

      {/* Sync Offset Controls */}
      <div className="pt-2 border-t border-line space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-2" />
            <h4 className="text-sm font-semibold text-1">
              Sinkronisasi Offset
            </h4>
          </div>
          <span className="text-sm text-2 font-mono tabular-nums">
            {activeOffsetSecs != null
              ? `Offset B${period}: ${formatSecondsToTime(activeOffsetSecs)}`
              : 'Belum diatur'}
          </span>
        </div>

        {isOffsetCollapsed ? (
          <div
            data-testid="offset-summary"
            className="flex items-center justify-between gap-2 p-2 rounded-control bg-app border border-line text-sm"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="font-mono text-1 text-sm truncate">
                {getOffsetSummaryText()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUserExpanded(true)}
              className="min-h-[44px] sm:min-h-7 px-2.5 py-0.5 rounded-control bg-raised border border-line hover:border-brand text-sm font-medium text-brand shrink-0 cursor-pointer transition-colors"
            >
              Ubah
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {isCompleteForPeriod && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUserExpanded(false)}
                  className="min-h-[44px] sm:min-h-0 text-sm text-brand hover:underline font-medium cursor-pointer"
                >
                  Selesai mengubah
                </button>
              </div>
            )}

            {/* Period 1 Offset Card */}
            <div
              className={`p-2.5 rounded-control border transition-colors ${
                period === 1
                  ? 'bg-panel border-brand/40 ring-1 ring-brand/10'
                  : 'bg-app border-line'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-1">Babak 1</span>
                  {period === 1 && (
                    <Badge variant="brand" size="sm">
                      Aktif
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-2 font-mono tabular-nums">
                  {offsetP1Secs != null
                    ? `Peluit: ${formatSecondsToTime(offsetP1Secs)}`
                    : 'Belum diatur'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={`video-offset-p1-${matchId}`} className="sr-only">
                  Menit video saat peluit mulai (Babak 1)
                </label>
                <input
                  id={`video-offset-p1-${matchId}`}
                  type="text"
                  placeholder="Peluit mulai video (mm:ss, misal 01:00)"
                  value={offsetP1Input}
                  onChange={(e) => setOffsetP1Input(e.target.value)}
                  onBlur={handleOffsetP1Blur}
                  className="flex-1 px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-control bg-panel border border-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {videoSrc && (
                  <button
                    type="button"
                    onClick={handleUseCurrentTimeForP1}
                    title="Gunakan waktu video saat ini sebagai offset Babak 1"
                    className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-control bg-raised border border-line hover:border-brand text-sm text-1 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Set saat ini
                  </button>
                )}
              </div>
            </div>

            {/* Period 2 Offset Card */}
            <div
              className={`p-2.5 rounded-control border transition-colors ${
                period === 2
                  ? 'bg-panel border-brand/40 ring-1 ring-brand/10'
                  : 'bg-app border-line'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-1">Babak 2</span>
                  {period === 2 && (
                    <Badge variant="brand" size="sm">
                      Aktif
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-2 font-mono tabular-nums truncate">
                  {offsetP2Secs != null
                    ? `Peluit: ${formatSecondsToTime(offsetP2Secs)}`
                    : 'Belum diatur'}
                  {p2StartMinVal != null && ` · Mulai menit ${p2StartMinVal}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7 flex items-center gap-1.5">
                  <label htmlFor={`video-offset-p2-${matchId}`} className="sr-only">
                    Babak 2 mulai di menit video…
                  </label>
                  <input
                    id={`video-offset-p2-${matchId}`}
                    type="text"
                    placeholder="Peluit video (mm:ss)"
                    value={offsetP2Input}
                    onChange={(e) => setOffsetP2Input(e.target.value)}
                    onBlur={handleOffsetP2Blur}
                    className="flex-1 px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-control bg-panel border border-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {videoSrc && (
                    <button
                      type="button"
                      onClick={handleUseCurrentTimeForP2}
                      title="Gunakan waktu video saat ini sebagai offset Babak 2"
                      className="min-h-[44px] sm:min-h-0 px-2 py-1.5 rounded-control bg-raised border border-line hover:border-brand text-sm text-1 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Set saat ini
                    </button>
                  )}
                </div>

                <div className="sm:col-span-5">
                  <label htmlFor={`video-p2-start-min-${matchId}`} className="sr-only">
                    Menit pertandingan saat Babak 2 mulai
                  </label>
                  <input
                    id={`video-p2-start-min-${matchId}`}
                    type="number"
                    min="1"
                    max="130"
                    step="any"
                    placeholder="Menit laga (misal: 45)"
                    value={p2StartMinInput}
                    onChange={(e) => setP2StartMinInput(e.target.value)}
                    onBlur={handleP2StartMinBlur}
                    className="w-full px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-control bg-panel border border-control text-sm font-mono tabular-nums text-1 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {offsetP2Secs != null && p2StartMinVal == null && (
                <div className="mt-2 p-1.5 rounded-control bg-warning/10 border border-warning/30 text-warning text-sm">
                  Belum lengkap: pencatatan Babak 2 memakai stopwatch
                </div>
              )}
            </div>

            <p className="text-sm text-2 leading-relaxed">
              {period === 1 && offsetP1Secs != null
                ? `Formula Babak 1: menit laga = max(0, (waktu video - ${formatSecondsToTime(offsetP1Secs)}) / 60).`
                : period === 2 && offsetP2Secs != null && p2StartMinVal != null
                ? `Formula Babak 2: menit laga = ${p2StartMinVal} + max(0, (waktu video - ${formatSecondsToTime(offsetP2Secs)}) / 60).`
                : 'Belum ada offset lengkap untuk babak ini: penandaan kejadian memakai stopwatch pencatat.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LocalVideoPanel;
