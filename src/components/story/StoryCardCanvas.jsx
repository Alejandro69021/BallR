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
        className="w-full max-w-[340px] bg-panel border border-line rounded-panel p-5 text-1 font-sans space-y-4 select-none"
      >
        {/* Header - No internal player id in shareable card */}
        <div className="pb-3 border-b border-line flex items-center justify-between gap-2">
          <div>
            <div className="text-sm uppercase tracking-wider text-2 font-medium">
              Kartu Perkembangan
            </div>
            <div className="text-sm font-semibold text-1 truncate">
              {academyDisplay}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded text-sm border border-line bg-raised text-2 font-mono">
              {personalInfo.jersey_number != null ? `#${personalInfo.jersey_number}` : ageGroupDisplay}
            </span>
          </div>
        </div>

        {/* Identitas Atlet */}
        <div className="space-y-1">
          <div className="text-lg font-bold text-1 tracking-tight">
            {nameDisplay}
          </div>
          <div className="text-sm text-2 flex flex-wrap items-center gap-1.5">
            <span className="text-brand font-medium">{positionDisplay}</span>
            <span>•</span>
            <span>{ageGroupDisplay}</span>
            {preferredFootDisplay && preferredFootDisplay !== 'Belum ada data' && (
              <>
                <span>•</span>
                <span>{preferredFootDisplay}</span>
              </>
            )}
          </div>
        </div>

        {/* Antropometri */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-sm font-semibold text-2 uppercase tracking-wider">
            Antropometri
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-2 block">Tinggi Badan</span>
              <span className="font-semibold text-1">{heightDisplay}</span>
            </div>
            <div>
              <span className="text-2 block">Berat Badan</span>
              <span className="font-semibold text-1">{weightDisplay}</span>
            </div>
          </div>
          <div className="text-sm text-2 pt-1 border-t border-line">
            Sumber: Pengukuran Staf Akademi
          </div>
        </div>

        {/* Parameter Kebugaran Fisik */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-sm font-semibold text-2 uppercase tracking-wider">
            Kebugaran Fisik
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-2 block">Lompatan</span>
              <span className="font-semibold text-1">{jumpDisplay}</span>
            </div>
            <div>
              <span className="text-2 block">Sprint 20m</span>
              <span className="font-semibold text-1">{sprintDisplay}</span>
            </div>
            <div>
              <span className="text-2 block">Kelincahan</span>
              <span className="font-semibold text-1">{shuttleDisplay}</span>
            </div>
          </div>
          <div className="text-sm text-2 pt-1 border-t border-line">
            Tanggal: {fitnessDate} • Sumber: Tes Fisik Berkala
          </div>
        </div>

        {/* Catatan Evaluasi Pelatih */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-sm font-semibold text-2 uppercase tracking-wider">
            Evaluasi Pelatih
          </div>
          <p className="text-sm text-1 italic leading-relaxed">
            "{coachNote}"
          </p>
          <div className="text-sm text-2 pt-1 border-t border-line">
            Periode: {coachDisplay} • Sumber: Catatan Resmi Pelatih
          </div>
        </div>

        {/* Footer - derived factual line, no "Data Terverifikasi" */}
        <div className="pt-2 border-t border-line space-y-1 text-sm text-2">
          <div className="flex items-center justify-between">
            <span>Paspor Atlet BallR</span>
            <span>
              {isPublished
                ? `Asesmen diterbitkan${evaluation.period ? ` ${evaluation.period}` : ''}`
                : 'Asesmen belum diterbitkan'}
            </span>
          </div>
          <div className="text-sm opacity-80 text-right">
            Sumber: catatan akademi
          </div>
        </div>
      </div>
    </div>
  );
}
