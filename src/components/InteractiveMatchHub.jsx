import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Clock,
  Sparkles,
  Shield,
  Target,
  Flame,
  Award,
  ChevronRight,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function InteractiveMatchHub({
  player,
  onShareClip,
  onToast
}) {
  const videoRef = useRef(null);

  // Match Summary & KPIs
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

  // Chronological Match Events
  const allEvents = [
    {
      id: "evt-1",
      minute: "14'",
      type: "Tackle",
      categoryIcon: "🛡️",
      title: "Interception & Counter-attack start",
      desc: "Memutus jalur umpan lawan di sepertiga tengah dan langsung melepas bola transisi cepat.",
      startTimeSeconds: 8,
      durationSeconds: 12,
      metric: "Ball Recovery (Middle 3rd)",
      videoUrl: player.verified_moments?.[0]?.video_url || "https://assets.mixkit.co/videos/preview/mixkit-young-soccer-player-controlling-the-ball-41584-large.mp4",
      poster: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "evt-2",
      minute: "24'",
      type: "Key Pass",
      categoryIcon: "🎯",
      title: "Curving Through-Ball Assist",
      desc: "Umpan terobosan lengkung melintasi 2 bek tengah, langsung membuka ruang tembak striker.",
      startTimeSeconds: 24,
      durationSeconds: 14,
      metric: "Expected Assist (xA): 0.88",
      videoUrl: player.verified_moments?.[0]?.video_url || "https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-41586-large.mp4",
      poster: player.verified_moments?.[0]?.thumbnail || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "evt-3",
      minute: "38'",
      type: "Tackle",
      categoryIcon: "🛡️",
      title: "Sliding Tackle in Defensive Third",
      desc: "Tekel luncur bersih di sisi flank kanan mematikan serangan balik cepat tim lawan.",
      startTimeSeconds: 38,
      durationSeconds: 11,
      metric: "Tackle Success Rate: 100%",
      videoUrl: player.verified_moments?.[1]?.video_url || "https://assets.mixkit.co/videos/preview/mixkit-player-scoring-a-goal-in-soccer-41584-large.mp4",
      poster: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "evt-4",
      minute: "52'",
      type: "Goal",
      categoryIcon: "⚽",
      title: "Left-Footed Top Corner Goal",
      desc: "Penyelesaian keras kaki kiri melengkung tajam ke sudut atas gawang tanpa mampu dijangkau kiper.",
      startTimeSeconds: 52,
      durationSeconds: 15,
      metric: "Exit Speed: 79.2 km/h",
      videoUrl: player.verified_moments?.[1]?.video_url || "https://assets.mixkit.co/videos/preview/mixkit-player-scoring-a-goal-in-soccer-41584-large.mp4",
      poster: player.verified_moments?.[1]?.thumbnail || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
    }
  ];

  // Active state
  const [activeEvent, setActiveEvent] = useState(allEvents[1]); // Default to 24' Assist
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'Goal' | 'Key Pass' | 'Tackle'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [clipProgress, setClipProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Filter events
  const filteredEvents = allEvents.filter((evt) => {
    if (selectedFilter === 'ALL') return true;
    return evt.type === selectedFilter;
  });

  // Core Click Interaction: Seek video to exact event timestamp
  const handleSelectEvent = (evt) => {
    setActiveEvent(evt);
    if (videoRef.current) {
      // If event has unique video URL or same reel, update source or currentTime
      if (videoRef.current.src !== evt.videoUrl) {
        videoRef.current.src = evt.videoUrl;
      }
      videoRef.current.currentTime = 0; // Each clip starts at 0 or seeks to offset
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
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

  // Sync progress & clip loop
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    const dur = activeEvent.durationSeconds || 12;
    const progress = Math.min(100, (curr / dur) * 100);
    setClipProgress(progress);

    // Auto loop clip or play next
    if (curr >= dur) {
      if (autoPlayNext) {
        const nextIndex = (allEvents.findIndex((e) => e.id === activeEvent.id) + 1) % allEvents.length;
        handleSelectEvent(allEvents[nextIndex]);
      } else {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleShareTimestamp = (e, evt) => {
    e.stopPropagation();
    const clipUrl = `${window.location.origin}${window.location.pathname}?clip=${evt.id}#video-reel`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clipUrl).catch(() => {});
    }
    if (onToast) {
      onToast({
        title: `Tautan Klip Disalin! 🔗`,
        subtext: `Timestamp ${evt.minute} (${evt.title}) siap dibagikan ke scout.`
      });
    }
  };

  return (
    <section id="video-reel" className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl shadow-black/50 space-y-5">
      
      {/* 1. REAL MATCH SUMMARY STRIP */}
      <div className="space-y-3 pb-2 border-b border-[#1F2937]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-athletic font-bold uppercase tracking-wider bg-lime-500/15 text-[#CCFF00] border border-[#CCFF00]/30">
                Official Match Analytics
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {matchInfo.tournament}
              </span>
            </div>
            <h3 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight">
              {matchInfo.title}
            </h3>
            <p className="text-xs text-[#CCFF00] font-semibold mt-0.5">
              {matchInfo.score} • {matchInfo.date}
            </p>
          </div>

          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-slate-700 text-xs font-mono text-slate-300">
              <Film className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Video-to-Stat Synced</span>
            </span>
          </div>
        </div>

        {/* 4 Real Performance KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {matchInfo.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {kpi.label}
                </span>
                <div className="p-1 rounded bg-[#111827]">
                  {kpi.icon}
                </div>
              </div>
              <div>
                <div className="font-athletic text-xl font-black text-white">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. INTERACTIVE VIDEO ANALYTICS CONSOLE (16:9 Cinema Container) */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex flex-col justify-between group">
        
        {/* Dynamic On-Screen HUD Overlay Badge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-[#CCFF00]/50 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping"></span>
            <span className="font-athletic font-bold text-xs text-[#CCFF00] tracking-wide">
              [ {activeEvent.minute} {activeEvent.type.toUpperCase()} ]
            </span>
            <span className="text-white text-xs font-semibold">
              • {player.personal_info.nickname || player.personal_info.full_name} #{player.personal_info.jersey_number}
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-800 w-max">
            {activeEvent.metric}
          </div>
        </div>

        {/* Video Element */}
        <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={activeEvent.videoUrl}
            poster={activeEvent.poster}
            className="w-full h-full object-cover"
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
          />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <div className="w-16 h-16 rounded-full bg-black/80 border-2 border-[#CCFF00] flex items-center justify-center text-[#CCFF00] shadow-[0_0_25px_rgba(204,255,0,0.3)] group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Clip Loop Progress Bar (Volt Lime) */}
        <div className="absolute bottom-11 inset-x-0 z-20 h-1 bg-slate-800">
          <div
            className="h-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] transition-all duration-150"
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
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-[11px] font-mono text-slate-300 ml-1">
              0:{(Math.floor(currentTime)).toString().padStart(2, '0')} / 0:{activeEvent.durationSeconds}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Play Next Toggle */}
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={(e) => setAutoPlayNext(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#CCFF00] rounded cursor-pointer"
              />
              <span>Auto-Play Next Event</span>
            </label>

            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              SYNCED AT {activeEvent.minute}
            </span>
          </div>
        </div>

      </div>

      {/* 3. FILTERABLE MATCH EVENT TIMELINE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-athletic text-sm sm:text-base font-bold text-white tracking-wide">
              Match Event Timeline (Click to Seek)
            </h4>
            <p className="text-xs text-slate-400">
              Klik aksi pertandingan di bawah untuk langsung melompat ke momen rekaman
            </p>
          </div>

          {/* Event Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1F2937] self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-800 text-[#CCFF00] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events ({allEvents.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('Goal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'Goal'
                  ? 'bg-slate-800 text-[#CCFF00] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚽ Goals
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('Key Pass')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'Key Pass'
                  ? 'bg-slate-800 text-[#CCFF00] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Key Passes
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('Tackle')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'Tackle'
                  ? 'bg-slate-800 text-[#CCFF00] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Tackles
            </button>
          </div>
        </div>

        {/* Horizontal Chronological Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredEvents.map((evt) => {
            const isActive = activeEvent.id === evt.id;

            return (
              <div
                key={evt.id}
                onClick={() => handleSelectEvent(evt)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#1F2937] border-2 border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.2)] ring-1 ring-[#CCFF00]'
                    : 'bg-[#090D16]/80 border-[#1F2937] hover:border-slate-700 hover:bg-[#111827]'
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isActive && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
                )}

                <div>
                  {/* Event Header: Minute & Category */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-athletic text-sm font-extrabold text-[#CCFF00]">
                        {evt.minute}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/60 border border-slate-700 text-slate-300">
                        {evt.categoryIcon} {evt.type}
                      </span>
                    </div>

                    {/* Quick Share Clip Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShareTimestamp(e, evt)}
                      className="p-1 rounded-md bg-[#090D16] hover:bg-slate-800 text-slate-400 hover:text-[#CCFF00] transition-colors"
                      title="Salin tautan langsung ke momen ini"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h5 className="font-athletic text-xs font-bold text-white group-hover:text-lime-200 transition-colors line-clamp-1 mb-1">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {evt.desc}
                  </p>
                </div>

                {/* Footer Metric & Duration */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate max-w-[130px]">
                    {evt.metric}
                  </span>
                  <span className={`font-mono font-bold ${isActive ? 'text-[#CCFF00]' : 'text-slate-400'}`}>
                    0:{evt.durationSeconds}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

