import React from 'react';
import SourceNote from './ui/SourceNote';

export default function AICoachCard({ evaluation }) {
  const {
    period,
    coach_name,
    narrative,
    strengths = [],
    growth_areas = [],
    recommended_drill
  } = evaluation || {};

  const coachTitle = coach_name || 'Tim Pelatih Akademi';
  const periodText = period || 'Oktober 2026';

  return (
    <section className="space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
        <div>
          <h2 className="text-base font-semibold text-1">
            Catatan Evaluasi Pelatih
          </h2>
          <p className="text-xs text-2">
            Rangkuman observasi sesi latihan dan pertandingan dari staf kepelatihan.
          </p>
        </div>
        <div className="text-xs font-mono text-2">
          <span>{coachTitle}</span> {period && <span>· {periodText}</span>}
        </div>
      </div>

      <div className="rounded-panel border border-line bg-panel p-4 space-y-4">
        {/* Narrative Block */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-2 font-mono mb-1.5">
            Narasi Perkembangan
          </h3>
          <p className="text-xs sm:text-sm text-1 leading-relaxed">
            {narrative || 'Belum ada catatan narasi evaluasi untuk periode ini.'}
          </p>
        </div>

        {/* Strengths & Growth Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-line">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-2 font-mono mb-2">
              Kekuatan Menonjol
            </h4>
            {strengths && strengths.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-1">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand font-semibold select-none">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-2 italic">Belum ada data kekuatan tercatat</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-2 font-mono mb-2">
              Area Fokus Latihan
            </h4>
            {growth_areas && growth_areas.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-1">
                {growth_areas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-warning font-semibold select-none">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-2 italic">Belum ada data fokus tercatat</p>
            )}
          </div>
        </div>

        {/* Recommended Drill */}
        {recommended_drill && (recommended_drill.title || typeof recommended_drill === 'string') && (
          <div className="pt-3 border-t border-line">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-2 font-mono mb-1.5">
              Menu Latihan yang Direkomendasikan
            </h4>
            <div className="p-3 rounded-control border border-line bg-raised flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-1">
                  {recommended_drill.title || recommended_drill}
                </p>
                {recommended_drill.category && (
                  <p className="text-2 text-xs mt-0.5">
                    Kategori: {recommended_drill.category}
                  </p>
                )}
              </div>
              {recommended_drill.duration && (
                <span className="font-mono text-2 shrink-0">
                  Durasi: {recommended_drill.duration}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <SourceNote
        source={`evaluasi ${coachTitle}`}
        date={periodText}
        sampleSize={1}
      />
    </section>
  );
}
