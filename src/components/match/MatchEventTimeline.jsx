import React from 'react';
import { Play } from 'lucide-react';

export default function MatchEventTimeline({
  allEvents,
  filteredEvents,
  activeEvent,
  selectedFilter,
  setSelectedFilter,
  handleSelectEvent,
  onShareClip
}) {
  return (
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
                    <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-black/60 border border-slate-700 text-slate-300">
                      {evt.categoryIcon} {evt.type}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {evt.durationSeconds}s
                  </span>
                </div>

                {/* Event Title & Description */}
                <h5 className="font-athletic text-xs sm:text-sm font-bold text-white group-hover:text-[#CCFF00] transition-colors leading-snug line-clamp-2">
                  {evt.title}
                </h5>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {evt.desc}
                </p>
              </div>

              {/* Event Metric Pill & Share Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-300 truncate max-w-[140px]">
                  {evt.metric}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onShareClip) onShareClip(evt);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-[#CCFF00] hover:bg-slate-800 transition-colors"
                    title="Buka Klip 9:16"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
