import React from 'react';
import { Play } from 'lucide-react';
import SourceNote from './ui/SourceNote';

export default function MatchMoments({ moments = [], onSelectClip }) {
  // Only render if real clips exist
  const realClips = (moments || []).filter(
    (clip) => clip && (clip.video_url || clip.title)
  );

  if (realClips.length === 0) {
    return (
      <section className="space-y-4 text-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-1">
              Momen Pertandingan Terverifikasi
            </h2>
            <p className="text-xs text-2">
              Cuplikan aksi taktis pertandingan yang telah diverifikasi tim pelatih.
            </p>
          </div>
        </div>
        <div className="p-6 text-center border border-line rounded-panel bg-panel text-xs text-2">
          Belum ada data cuplikan pertandingan
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
        <div>
          <h2 className="text-base font-semibold text-1">
            Momen Pertandingan Terverifikasi
          </h2>
          <p className="text-xs text-2">
            Cuplikan aksi taktis pertandingan yang telah diverifikasi tim pelatih.
          </p>
        </div>
        <span className="text-xs font-mono text-2">
          {realClips.length} klip
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {realClips.map((clip) => {
          const matchContext = [clip.match, clip.minute ? `Menit ${clip.minute}` : null]
            .filter(Boolean)
            .join(' · ');

          return (
            <div
              key={clip.id || clip.title}
              onClick={() => onSelectClip && onSelectClip(clip)}
              className="rounded-panel border border-line bg-panel p-3 flex flex-col justify-between hover:border-control transition-colors cursor-pointer group"
            >
              <div className="aspect-video w-full rounded-control bg-raised border border-line flex items-center justify-center relative overflow-hidden mb-2">
                {clip.thumbnail ? (
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-panel border border-line flex items-center justify-center text-1 group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-raised border border-line text-2">
                  {clip.category || 'Aksi Taktis'}
                </span>
                <h3 className="text-xs font-semibold text-1 mt-1 truncate" title={clip.title}>
                  {clip.title}
                </h3>
                {matchContext && (
                  <p className="text-[11px] text-2 font-mono mt-0.5 truncate">
                    {matchContext}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SourceNote
        source="staf kepelatihan akademi"
        sampleSize={realClips.length}
      />
    </section>
  );
}
