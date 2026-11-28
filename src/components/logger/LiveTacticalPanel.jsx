import React, { useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { buildTacticalSummary, SMALL_SAMPLE_N } from '../../lib/analysis/events';
import Badge from '../ui/Badge';
import RefChip from '../ui/RefChip';

export default function LiveTacticalPanel({ match, events = [], outbox = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const combinedEvents = useMemo(() => {
    const map = new Map();
    (events || []).forEach((e) => {
      const key = e.client_event_id || e.id;
      if (key) map.set(key, e);
    });
    (outbox || []).forEach((e) => {
      const key = e.client_event_id || e.id;
      if (key && !map.has(key)) map.set(key, e);
    });
    return Array.from(map.values());
  }, [events, outbox]);

  const summary = useMemo(
    () => buildTacticalSummary(combinedEvents, match?.pitch_length_m || 90, match?.pitch_width_m || 60),
    [combinedEvents, match?.pitch_length_m, match?.pitch_width_m]
  );

  const opponentName = match?.opponent_name || 'Lawan';

  return (
    <div className="border border-line rounded-panel bg-panel overflow-hidden" data-testid="live-tactical-panel">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-app/60 transition-colors cursor-pointer min-h-[44px]"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-4 h-4 text-brand shrink-0" />
          <span className="text-sm font-semibold text-1">Analisis Live</span>
          <Badge variant="neutral" size="sm">n = {summary.n}</Badge>
          {summary.field_tilt.own_pct != null && (
            <span className="text-sm text-2 tabular-nums">
              Dominasi 1/3 Akhir: {summary.field_tilt.own_pct}% vs {summary.field_tilt.opponent_pct}%
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-2 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-2 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-3 border-t border-line">
          {summary.n === 0 ? (
            <p className="text-sm text-2 pt-3">
              Belum ada kejadian tercatat. Indikator live otomatis terisi saat Anda mengetuk aksi di papan pencatat.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 text-sm">
                <div className="p-2.5 rounded-control border border-line bg-app space-y-1">
                  <span className="text-2 block">Dominasi Sepertiga Akhir</span>
                  <span className="text-sm font-semibold text-1 tabular-nums block">
                    {summary.field_tilt.own_pct != null
                      ? `${summary.field_tilt.own_pct}% : ${summary.field_tilt.opponent_pct}%`
                      : 'Belum ada'}
                  </span>
                  <span className="text-2 block">
                    n = {summary.field_tilt.n} umpan{summary.field_tilt.small_sample ? ' (kecil)' : ''}
                  </span>
                </div>

                <div className="p-2.5 rounded-control border border-line bg-app space-y-1">
                  <span className="text-2 block">Umpan Sukses (Kita vs Lawan)</span>
                  <span className="text-sm font-semibold text-1 tabular-nums block">
                    {summary.own.pass.value != null ? `${summary.own.pass.value}%` : '-'} vs{' '}
                    {summary.opponent.pass.value != null ? `${summary.opponent.pass.value}%` : '-'}
                  </span>
                  <span className="text-2 block tabular-nums">
                    {summary.own.pass.successful.value}/{summary.own.pass.n} vs {summary.opponent.pass.successful.value}/{summary.opponent.pass.n}
                  </span>
                </div>

                <div className="p-2.5 rounded-control border border-line bg-app space-y-1">
                  <span className="text-2 block">Tembakan (Dalam Kotak)</span>
                  <span className="text-sm font-semibold text-1 tabular-nums block">
                    {summary.own.shot.n} ({summary.own.shot_zones.inside_box.count}) vs {summary.opponent.shot.n} ({summary.opponent.shot_zones.inside_box.count})
                  </span>
                  <span className="text-2 block tabular-nums">
                    Tepat sasaran: {summary.own.shot.on_target.value} vs {summary.opponent.shot.on_target.value}
                  </span>
                </div>

                <div className="p-2.5 rounded-control border border-line bg-app space-y-1">
                  <span className="text-2 block">Blok Bertahan & Rebut Tinggi</span>
                  <span className="text-sm font-semibold text-1 block">
                    Kita: {summary.own.def_line.block_label}
                  </span>
                  <span className="text-2 block tabular-nums">
                    Rebut tinggi: {summary.own.transitions.high_regains} · Lawan: {summary.opponent.def_line.block_label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-sm text-2 pt-1">
                <span>
                  Koridor dominan: <strong className="text-1">Kita</strong> = {summary.own.corridors.dominant?.label || '-'} ·{' '}
                  <strong className="text-1">{opponentName}</strong> = {summary.opponent.corridors.dominant?.label || '-'}
                  {summary.n < SMALL_SAMPLE_N ? ` · Sampel masih kecil (n < ${SMALL_SAMPLE_N})` : ''}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <RefChip referenceId="fifa-football-language-2022" />
                  <RefChip referenceId="vogelbein-2014-defensive-transition" />
                  <RefChip referenceId="pollard-reep-1997-playing-strategies" />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
