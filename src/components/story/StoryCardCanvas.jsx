import React from 'react';

export function formatPlayerName(fullName, isPrivate) {
  if (!fullName) return 'Belum ada data';
  if (!isPrivate) return fullName;
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(' ');
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
  const positionDisplay = personalInfo.position || 'Belum ada data';
  const ageGroupDisplay =
    personalInfo.age_group ||
    (personalInfo.age ? `U-${personalInfo.age}` : null) ||
    'Belum ada data';
  const academyDisplay = academy.name || 'Belum ada data';
  const playerId = player?.player_id || player?.public_id || player?.id || 'Belum ada data';

  const heightDisplay = personalInfo.height_cm ? `${personalInfo.height_cm} cm` : 'Belum ada data';
  const weightDisplay = personalInfo.weight_kg ? `${personalInfo.weight_kg} kg` : 'Belum ada data';

  const jumpDisplay =
    fitness.vertical_jump_cm != null ? `${fitness.vertical_jump_cm} cm` : 'Belum ada data';
  const sprintDisplay =
    fitness.sprint_20m_sec != null ? `${fitness.sprint_20m_sec} s` : 'Belum ada data';
  const shuttleDisplay =
    fitness.shuttle_run_sec != null ? `${fitness.shuttle_run_sec} s` : 'Belum ada data';
  const fitnessDate = fitness.test_date || 'Belum ada data';

  const narrativeDisplay = evaluation.narrative || 'Belum ada data';
  const coachDisplay = evaluation.period
    ? `${evaluation.period} • ${evaluation.coach_name || 'Pelatih'}`
    : 'Belum ada data';

  return (
    <div className="flex justify-center items-center w-full">
      <div
        ref={cardRef}
        data-testid="progress-card-canvas"
        className="w-full max-w-[340px] bg-panel border border-line rounded-panel p-5 text-1 font-sans space-y-4 select-none"
      >
        {/* Header */}
        <div className="pb-3 border-b border-line flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-2 font-medium">
              Kartu Perkembangan
            </div>
            <div className="text-sm font-semibold text-1 truncate">
              {academyDisplay}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded text-xs border border-line bg-raised text-2">
              ID: {playerId}
            </span>
          </div>
        </div>

        {/* Identitas Atlet */}
        <div className="space-y-1">
          <div className="text-lg font-bold text-1 tracking-tight">
            {nameDisplay}
          </div>
          <div className="text-xs text-2 flex flex-wrap items-center gap-1.5">
            <span className="text-brand font-medium">{positionDisplay}</span>
            <span>•</span>
            <span>{ageGroupDisplay}</span>
            {personalInfo.preferred_foot && (
              <>
                <span>•</span>
                <span>{personalInfo.preferred_foot}</span>
              </>
            )}
          </div>
        </div>

        {/* Antropometri */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-xs font-semibold text-2 uppercase tracking-wider">
            Antropometri
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-2 block">Tinggi Badan</span>
              <span className="font-semibold text-1">{heightDisplay}</span>
            </div>
            <div>
              <span className="text-2 block">Berat Badan</span>
              <span className="font-semibold text-1">{weightDisplay}</span>
            </div>
          </div>
          <div className="text-xs text-2 pt-1 border-t border-line">
            Sumber: Pengukuran Staf Akademi
          </div>
        </div>

        {/* Parameter Kebugaran Fisik */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-xs font-semibold text-2 uppercase tracking-wider">
            Kebugaran Fisik
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
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
          <div className="text-xs text-2 pt-1 border-t border-line">
            Tanggal: {fitnessDate} • Sumber: Tes Fisik Berkala
          </div>
        </div>

        {/* Catatan Evaluasi Pelatih */}
        <div className="p-3 rounded-control bg-raised border border-line space-y-2">
          <div className="text-xs font-semibold text-2 uppercase tracking-wider">
            Evaluasi Pelatih
          </div>
          <p className="text-xs text-1 italic line-clamp-3 leading-relaxed">
            "{narrativeDisplay}"
          </p>
          <div className="text-xs text-2 pt-1 border-t border-line">
            Periode: {coachDisplay} • Sumber: Catatan Resmi Pelatih
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-2">
          <span>Paspor Atlet BallR</span>
          <span>Data Terverifikasi</span>
        </div>
      </div>
    </div>
  );
}
