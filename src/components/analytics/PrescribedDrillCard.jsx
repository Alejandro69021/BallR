import React from 'react';
import { Dumbbell, Flame, BookOpen } from 'lucide-react';

export default function PrescribedDrillCard({
  prescribedDrill,
  academicCitations,
  showCitations,
  setShowCitations
}) {
  return (
    <>
      {/* SECTION 4: SCIENCE-BASED DRILL PRESCRIPTION (BARÇA INNOVATION HUB) */}
      <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1F2937]">
          <div className="p-2 rounded-xl bg-[#090D16] border border-[#84CC16] text-[#84CC16]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-lime-500/15 text-[#84CC16] border border-[#84CC16]/30">
                Metodologi Latihan Terakreditasi
              </span>
              <span className="text-xs text-slate-400">{prescribedDrill.author}</span>
            </div>
            <h4 className="font-athletic text-base sm:text-lg font-bold text-white tracking-wide mt-0.5">
              {prescribedDrill.title}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#090D16]/80 border border-[#1E2638] space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Setup Lapangan & Durasi
              </div>
              <div className="text-xs text-slate-200 font-semibold">
                {prescribedDrill.setup}
              </div>
              <div className="text-xs text-cyan-400 font-mono">
                {prescribedDrill.duration}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-300 space-y-1">
              <div className="font-athletic font-bold text-amber-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Catatan Beban Bio-Banding (PHV)</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {prescribedDrill.bioBandingNote}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090D16]/80 border border-[#1E2638] space-y-2">
            <div className="text-xs font-athletic font-bold text-[#84CC16] uppercase tracking-wider">
              Instruksi Kunci Pelatih (Coaching Points)
            </div>
            <ul className="space-y-2">
              {prescribedDrill.coachingPoints.map((pt, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#111827] border border-slate-700 text-[#84CC16] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 5: ACADEMIC & METHODOLOGY CITATIONS */}
      <section className="rounded-2xl bg-[#0E131F] border border-[#1E2638] p-4 sm:p-5 shadow-lg space-y-3">
        <button
          type="button"
          onClick={() => setShowCitations(!showCitations)}
          className="w-full flex items-center justify-between text-xs font-athletic font-bold uppercase tracking-wider text-slate-300 hover:text-white cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#84CC16]" />
            <span>Daftar Pustaka & Metodologi Resmi (5 Referensi Jurnal)</span>
          </div>
          <span className="text-xs font-mono text-[#84CC16]">
            {showCitations ? 'Tutup ▲' : 'Lihat Sitasi ▼'}
          </span>
        </button>

        {showCitations && (
          <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
            {academicCitations.map((cite, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#090D16]/90 border border-slate-800 text-xs text-slate-400 space-y-0.5"
              >
                <div className="text-slate-300 font-medium">
                  {i + 1}. <strong>{cite.author}</strong> ({cite.year}). <em>"{cite.title}"</em>.
                </div>
                <div className="text-slate-400 text-xs">
                  {cite.venue}. <span className="font-mono text-cyan-400/80">Ref: {cite.doi}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
