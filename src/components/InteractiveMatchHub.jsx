import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Clock,
  Shield,
  Target,
  Flame,
  BrainCircuit
} from 'lucide-react';
import TacticalAnalyticsHub from './TacticalAnalyticsHub';
import MatchEventTimeline from './match/MatchEventTimeline';

export default function InteractiveMatchHub({
  player,
  onShareClip,
  onToast
}) {
  const videoRef = useRef(null);

  const [matchViewMode, setMatchViewMode] = useState('video');

  const matchInfo = {
    title: "Last Match: MPFA Jogja vs Sleman United U-13",
    score: "Final Score: 3 - 1",
    tournament: "Liga Super Muda PSSI DIY • Matchday 4",
    date: "28 Oktober 2026",
    kpis: [
      { label: "Minutes Played", value: "50'", subtext: "Starter • Full Match", icon: <Clock className="w-3.5 h-3.5 text-[#CCFF00]" /> },
      { label: "Passing Accuracy", value: "84%", subtext: "21/25 completed", icon: <Target className="w-3.5 h-3.5 text-cyan-400" /> },
      { label: "Defensive Duels Won", value: "80%", subtext: "4/5 tackles won", icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
      { label: "Shots on Target", value: "2/3", subtext: "66% accuracy (1 Goal)", icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> }
    ]
  };

  const allEvents = (player.verified_moments && player.verified_moments.length > 0)
    ? player.verified_moments.map((m, idx) => ({
        id: m.id || `evt-${idx + 1}`,
        minute: m.minute || "00'",
        type: m.category || "Highlight",
        categoryIcon: "⚽",
        title: m.title || "Momen Laga",
        desc: m.match || "Aksi pertandingan resmi",
        startTimeSeconds: 0,
        durationSeconds: 15,
        metric: m.category || "Key Moment",
        videoUrl: m.video_url || "",
        poster: m.thumbnail || ""
      }))
    : [];

  const [activeEvent, setActiveEvent] = useState(allEvents[0] || null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [clipProgress, setClipProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const filteredEvents = allEvents.filter((evt) => {
    if (selectedFilter === 'ALL') return true;
    return evt.type === selectedFilter;
  });

  const handleSelectEvent = (evt) => {
    setActiveEvent(evt);
    if (videoRef.current && evt.videoUrl) {
      if (videoRef.current.src !== evt.videoUrl) {
        videoRef.current.src = evt.videoUrl;
      }
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || !activeEvent?.videoUrl) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeEvent) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    const duration = activeEvent.durationSeconds || videoRef.current.duration || 10;
    const progress = Math.min(100, (curr / duration) * 100);
    setClipProgress(progress);

    if (curr >= duration) {
      handleClipEnded();
    }
  };

  const handleClipEnded = () => {
    if (autoPlayNext && allEvents.length > 0) {
      const currentIndex = allEvents.findIndex((e) => e.id === activeEvent?.id);
      const nextIndex = (currentIndex + 1) % allEvents.length;
      handleSelectEvent(allEvents[nextIndex]);
    } else {
      setIsPlaying(false);
      setClipProgress(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (videoRef.current && activeEvent?.videoUrl) {
      videoRef.current.src = activeEvent.videoUrl;
      videoRef.current.load();
    }
  }, [activeEvent?.id, activeEvent?.videoUrl]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-white">
      {/* 1. MATCH HEADER & KPI STRIP */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-athletic font-bold uppercase tracking-wider bg-lime-500/15 text-[#CCFF00] border border-[#CCFF00]/30">
                Laga Terverifikasi
              </span>
              <span className="text-xs text-slate-400">{matchInfo.tournament}</span>
            </div>
            <h3 className="font-athletic text-lg sm:text-2xl font-black text-white tracking-tight">
              {matchInfo.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
              <span>{matchInfo.score}</span>
              <span>•</span>
              <span>{matchInfo.date}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setMatchViewMode('video')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-athletic font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                matchViewMode === 'video'
                  ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.3)]'
                  : 'bg-[#090D16] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Reels</span>
            </button>

            <button
              type="button"
              onClick={() => setMatchViewMode('tactical')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-athletic font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                matchViewMode === 'tactical'
                  ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-[#090D16] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Tactical Hub</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {matchInfo.kpis.map((kpi, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{kpi.label}</span>
                {kpi.icon}
              </div>
              <div className="font-athletic text-2xl font-black text-white mt-1">
                {kpi.value}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {kpi.subtext}
              </div>
            </div>
          ))}
        </div>
      </section>

      {matchViewMode === 'tactical' ? (
        <TacticalAnalyticsHub
          player={player}
          onToast={onToast}
          onSwitchToVideo={() => setMatchViewMode('video')}
        />
      ) : (
        <>
          {/* 2. MAIN 16:9 VIDEO PLAYER */}
          <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border-2 border-[#1F2937] shadow-2xl group flex items-center justify-center">
            {activeEvent?.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover cursor-pointer"
                  playsInline
                  muted={isMuted}
                  onClick={togglePlay}
                  onTimeUpdate={handleTimeUpdate}
                />

                {/* Top Overlay Pill */}
                <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#CCFF00]/40 text-[#CCFF00] font-athletic font-extrabold text-xs">
                      {activeEvent.minute} {activeEvent.type}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white font-medium text-xs hidden sm:inline">
                      {activeEvent.title}
                    </span>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onShareClip && onShareClip(activeEvent)}
                      className="p-2 rounded-xl bg-black/75 hover:bg-black text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
                      title="Bagikan Klip Momen"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                    </button>
                  </div>
                </div>

                {/* Play/Pause Center Indicator */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#CCFF00] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </div>
                )}

                {/* Timeline Progress Bar */}
                <div className="absolute bottom-11 inset-x-0 z-20 h-1.5 bg-slate-800/80 cursor-pointer">
                  <div
                    className="h-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] transition-all duration-100"
                    style={{ width: `${clipProgress}%` }}
                  />
                </div>

                {/* Bottom Playback Control Bar */}
                <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 px-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="text-[11px] font-mono text-slate-300 ml-1">
                      0:{(Math.floor(currentTime)).toString().padStart(2, '0')} / 0:{activeEvent.durationSeconds}s
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoPlayNext}
                        onChange={(e) => setAutoPlayNext(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#CCFF00] rounded cursor-pointer"
                      />
                      <span>Auto-Play Next Event</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-base font-bold text-white">Belum ada data rekaman video</p>
                <p className="text-xs text-slate-400">
                  Belum ada rekaman klip video pertandingan resmi untuk momen ini.
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                  Belum ada data
                </span>
              </div>
            )}
          </div>

          <MatchEventTimeline
            allEvents={allEvents}
            filteredEvents={filteredEvents}
            activeEvent={activeEvent}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            handleSelectEvent={handleSelectEvent}
            onShareClip={onShareClip}
          />
        </>
      )}
    </div>
  );
}
