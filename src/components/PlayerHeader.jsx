import React from 'react';
import { Share2 } from 'lucide-react';
import Button from './ui/Button';

export default function PlayerHeader({ player, personalInfo: propPersonalInfo, onOpenStoryCard }) {
  const personalInfo = propPersonalInfo || player?.personal_info || {};
  const {
    full_name,
    nickname,
    jersey_number,
    position,
    age_group,
    preferred_foot,
    academy,
    photo_url
  } = personalInfo;

  const publicId = player?.public_id || personalInfo?.public_id || player?.player_id || '-';
  const ageGroupDisplay = age_group || personalInfo?.age_group || 'U-13';

  // 1. Position
  const positionDisplay = position || 'Belum ada data';

  // 2. Age group
  // ageGroupDisplay

  // 3. Latest assessment period
  const latestAssessmentPeriod =
    player?.ai_coach_evaluation?.period ||
    personalInfo?.assessment_period ||
    null;

  // 4. The 3 highest of the six real attribute values
  const radarAttributes = player?.radar_attributes || personalInfo?.radar_attributes || [];
  const validAttributes = radarAttributes
    .filter((a) => a && a.value !== null && a.value !== undefined && a.value !== '')
    .map((a) => ({
      name: a.attribute ? a.attribute.split(' ')[0] : 'Atribut',
      value: Number(a.value)
    }))
    .filter((a) => Number.isFinite(a.value))
    .sort((a, b) => b.value - a.value);

  const top3Attributes = validAttributes.slice(0, 3);
  const top3Display =
    top3Attributes.length > 0
      ? top3Attributes
          .map((a) => `${a.name}: ${a.value} (skala 0-100)`)
          .join(' · ')
      : 'Belum ada data';

  // 5. Date of last fitness test
  const lastFitnessDate = player?.fitness_benchmarks?.test_date || null;

  return (
    <section className="space-y-4 text-1">
      {/* Identity Block */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Athlete photo ONLY if photo_url exists; no placeholder */}
          {photo_url ? (
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-control overflow-hidden border border-line bg-raised shrink-0">
              <img
                src={photo_url}
                alt={full_name || nickname || 'Atlet'}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-2">
                ID: {publicId}
              </span>
              {jersey_number != null && (
                <span className="font-mono text-xs font-semibold text-1 bg-raised px-1.5 py-0.5 rounded border border-line">
                  #{jersey_number}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-1">
              {full_name || 'Atlet'}
              {nickname && (
                <span className="text-sm font-normal text-2 ml-2">
                  "{nickname}"
                </span>
              )}
            </h1>

            <div className="text-xs text-2 space-y-0.5 pt-0.5">
              <p>
                {academy?.name || 'Akademi Sepakbola'} {academy?.city ? `· ${academy.city}` : ''}
              </p>
              <p>
                Kelompok usia: <span className="text-1 font-medium">{ageGroupDisplay}</span> · Posisi: <span className="text-1 font-medium">{positionDisplay}</span> · Kaki utama: <span className="text-1 font-medium">{preferred_foot || 'Belum ada data'}</span>
              </p>
            </div>
          </div>
        </div>

        {onOpenStoryCard && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenStoryCard}
            icon={<Share2 className="w-4 h-4" strokeWidth={1.5} />}
            className="no-print shrink-0"
          >
            Bagikan Kartu
          </Button>
        )}
      </div>

      {/* 5-Line Technical Summary */}
      <div className="rounded-panel border border-line bg-panel p-4 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-2 font-mono pb-1 border-b border-line">
          Ringkasan Paspor Atlet
        </h2>

        <dl className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <dt className="text-2 w-48 shrink-0">1. Posisi:</dt>
            <dd className="text-1 font-medium">{positionDisplay}</dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <dt className="text-2 w-48 shrink-0">2. Kelompok usia:</dt>
            <dd className="text-1 font-medium">{ageGroupDisplay}</dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <dt className="text-2 w-48 shrink-0">3. Periode asesmen terakhir:</dt>
            <dd className="text-1 font-mono">{latestAssessmentPeriod || 'Belum ada data'}</dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <dt className="text-2 w-48 shrink-0">4. Indikator atribut tertinggi:</dt>
            <dd className="text-1 font-mono tabular-nums">{top3Display}</dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <dt className="text-2 w-48 shrink-0">5. Tanggal tes kebugaran terakhir:</dt>
            <dd className="text-1 font-mono">{lastFitnessDate || 'Belum ada data'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
