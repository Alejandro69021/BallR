import React from 'react';
import { formatPositionLabel, formatPreferredFoot } from '../../lib/displayLabels';

export function formatPlayerName(fullName, isPrivate) {
  if (!fullName) return 'Belum ada data';
  if (!isPrivate) return fullName;
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(' ');
}

/**
 * Truncates coach narrative up to 280 characters without cutting mid-sentence.
 * Appends summary notice if shortened.
 * @param {string} note
 * @param {number} [maxLength=280]
 * @returns {string}
 */
export function formatCoachNote(note, maxLength = 280) {
  if (!note) return 'Belum ada data';
  const trimmed = note.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.slice(0, maxLength);
  const lastPunctuation = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  if (lastPunctuation !== -1 && lastPunctuation >= 20) {
    const fullSentence = slice.slice(0, lastPunctuation + 1).trim();
    return `${fullSentence} (ringkasan; lihat paspor untuk catatan lengkap)`;
  }

  const lastSpace = slice.lastIndexOf(' ');
  const cleanCut = lastSpace !== -1 ? slice.slice(0, lastSpace).trim() : slice.trim();
  return `${cleanCut}... (ringkasan; lihat paspor untuk catatan lengkap)`;
}

export default function StoryCardCanvas({
  cardRef,
  player,
  isPrivate = false
}) {
  const personalInfo = player?.personal_info || {};
  const fitness = player?.fitness_benchmarks || {};
  const evaluation = player?.ai_coach_evaluation || {};
  const academy = personalInfo.academy || {};

  const nameDisplay = formatPlayerName(personalInfo.full_name, isPrivate);
  const positionDisplay = formatPositionLabel(personalInfo.position);
  const preferredFootDisplay = formatPreferredFoot(personalInfo.preferred_foot);
  const ageGroupDisplay =
    personalInfo.age_group ||
    (personalInfo.age ? `U-${personalInfo.age}` : null) ||
    'Belum ada data';
  const academyDisplay = academy.name || 'Belum ada data';

  const heightDisplay = personalInfo.height_cm ? `${personalInfo.height_cm} cm` : 'Belum ada data';
  const weightDisplay = personalInfo.weight_kg ? `${personalInfo.weight_kg} kg` : 'Belum ada data';

  const jumpDisplay =
    fitness.vertical_jump_cm != null ? `${fitness.vertical_jump_cm} cm` : 'Belum ada data';
  const sprintDisplay =
    fitness.sprint_20m_sec != null ? `${fitness.sprint_20m_sec} s` : 'Belum ada data';
  const shuttleDisplay =
    fitness.shuttle_run_sec != null ? `${fitness.shuttle_run_sec} s` : 'Belum ada data';
  const fitnessDate = fitness.test_date || 'Belum ada data';

  const coachNote = formatCoachNote(evaluation.narrative || 'Belum ada data');
  const coachDisplay = evaluation.period
    ? `${evaluation.period} • ${evaluation.coach_name || 'Pelatih'}`
    : 'Belum ada data';

  const isPublished =
    personalInfo.evaluation_status === 'ready' ||
    player?.latest_assessment_status === 'published';

  return (
    <div className="flex justify-center items-center w-full">
      <div
        ref={cardRef}
        data-testid="progress-card-canvas"
        className="relative w-full max-w-[360px] rounded-panel overflow-hidden bg-pitch text-chalk font-sans select-none shadow-lg border border-mint/25"
      >
        {/* Subtle Football Pitch Line Watermark (Editorial, Zero Neon) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 360 540"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10 text-chalk"
        >
          <rect x="18" y="18" width="324" height="504" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="18" y1="270" x2="342" y2="270" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="180" cy="270" r="54" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="86" y="18" width="188" height="72" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="86" y="450" width="188" height="72" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 p-5 space-y-4">
          {/* Top Bar: Strava-style Matchday Header */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/15">
            <div className="min-w-0">
              <div className="text-sm uppercase tracking-[0.16em] text-emerald-300 font-semibold">
                Kartu Perkembangan
              </div>
              <div className="text-sm font-semibold text-white/95 truncate mt-0.5">
                {academyDisplay}
              </div>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-control bg-white/10 border border-white/20 font-display text-lg font-bold leading-none tracking-tight text-emerald-300 tabular-nums">
              {personalInfo.jersey_number != null ? `#${personalInfo.jersey_number}` : ageGroupDisplay}
            </div>
          </div>

          {/* Athlete Hero Identity */}
          <div className="space-y-1.5">
            <div className="font-display text-2xl font-bold tracking-tight text-white leading-tight uppercase">
              {nameDisplay}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold">
                {positionDisplay}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/85 font-medium">
                {ageGroupDisplay}
              </span>
              {preferredFootDisplay && preferredFootDisplay !== 'Belum ada data' && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/85 font-medium">
                  {preferredFootDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Strava-Style Big Stat Grid: Antropometri */}
          <div className="p-3.5 rounded-control bg-white/[0.06] border border-white/10 space-y-2">
            <div className="text-sm font-semibold text-emerald-300 uppercase tracking-[0.14em]">
              Antropometri
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-white/65 block">Tinggi Badan</span>
                <span className="font-display text-xl font-bold text-white tabular-nums">{heightDisplay}</span>
              </div>
              <div>
                <span className="text-sm text-white/65 block">Berat Badan</span>
                <span className="font-display text-xl font-bold text-white tabular-nums">{weightDisplay}</span>
              </div>
            </div>
            <div className="text-sm text-white/55 pt-1.5 border-t border-white/10">
              Sumber: Pengukuran Staf Akademi
            </div>
          </div>

          {/* Strava-Style Big Stat Grid: Kebugaran Fisik */}
          <div className="p-3.5 rounded-control bg-white/[0.06] border border-white/10 space-y-2">
            <div className="text-sm font-semibold text-emerald-300 uppercase tracking-[0.14em]">
              Kebugaran Fisik
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-sm text-white/65 block">Lompatan</span>
                <span className="font-display text-lg font-bold text-white tabular-nums">{jumpDisplay}</span>
              </div>
              <div>
                <span className="text-sm text-white/65 block">Sprint 20m</span>
                <span className="font-display text-lg font-bold text-white tabular-nums">{sprintDisplay}</span>
              </div>
              <div>
                <span className="text-sm text-white/65 block">Kelincahan</span>
                <span className="font-display text-lg font-bold text-white tabular-nums">{shuttleDisplay}</span>
              </div>
            </div>
            <div className="text-sm text-white/55 pt-1.5 border-t border-white/10">
              Tanggal: {fitnessDate} • Sumber: Tes Fisik Berkala
            </div>
          </div>

          {/* Catatan Evaluasi Pelatih */}
          <div className="p-3.5 rounded-control bg-black/25 border-l-2 border-emerald-400 space-y-2">
            <div className="text-sm font-semibold text-emerald-300 uppercase tracking-[0.14em]">
              Evaluasi Pelatih
            </div>
            <p className="text-sm text-white/90 italic leading-relaxed">
              "{coachNote}"
            </p>
            <div className="text-sm text-white/55 pt-1.5 border-t border-white/10">
              Periode: {coachDisplay} • Sumber: Catatan Resmi Pelatih
            </div>
          </div>

          {/* Footer - derived factual line */}
          <div className="pt-2.5 border-t border-white/15 space-y-1 text-sm text-white/70">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white">Paspor Atlet BallR</span>
              <span>
                {isPublished
                  ? `Asesmen diterbitkan${evaluation.period ? ` ${evaluation.period}` : ''}`
                  : 'Asesmen belum diterbitkan'}
              </span>
            </div>
            <div className="text-sm text-white/50 text-right">
              Sumber: catatan akademi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
