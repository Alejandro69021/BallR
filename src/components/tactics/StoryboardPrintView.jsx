import React from 'react';
import { BrandMark } from '../brand';
import { BOARD_DISCLAIMER } from '../../lib/board';
import { SCENARIO_PHASE_LABELS, SCENARIO_STATUS_LABELS } from '../../lib/scenarios';
import Badge from '../ui/Badge';

/**
 * StoryboardPrintView: Printable A4 landscape tactical dossier / storyboard.
 * Renders on paper surface with SVG-only frame grid, attached references,
 * reviewer provenance, and the mandatory coaching disclaimer.
 */
export default function StoryboardPrintView({
  scenario,
  frames = [],
  references = [],
  className = ''
}) {
  const pitchLength = Number(scenario?.pitch_length_m || 90);
  const pitchWidth = Number(scenario?.pitch_width_m || 60);

  const phaseLabel = SCENARIO_PHASE_LABELS[scenario?.phase] || scenario?.phase || '-';
  const statusLabel = SCENARIO_STATUS_LABELS[scenario?.status] || scenario?.status || 'Draf';

  return (
    <div
      data-surface="paper"
      className={`p-6 bg-app text-1 space-y-6 print:p-0 print:m-0 ${className}`}
    >
      {/* Dossier Header */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm uppercase tracking-wider text-2">
              Papan Taktik Pelatih
            </span>
            <Badge variant={scenario?.status === 'published' ? 'success' : 'neutral'} size="sm">
              {statusLabel}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-1">
            {scenario?.title || 'Skema Taktik'}
          </h1>
          <p className="text-sm text-2 mt-1">
            Fase: {phaseLabel} • Format: {scenario?.format || '11v11'} • Ukuran Lapangan: {pitchLength} &times; {pitchWidth} m
          </p>
        </div>

        {/* Provenance & Reviewer Metadata */}
        <div className="text-left sm:text-right text-sm text-2 space-y-0.5">
          {scenario?.reviewed_by && (
            <div>
              Ditinjau oleh: <span className="text-1 font-semibold">{scenario.reviewed_by}</span>
            </div>
          )}
          {scenario?.reviewed_at && (
            <div>
              Waktu tinjauan: {new Date(scenario.reviewed_at).toLocaleDateString('id-ID')}
            </div>
          )}
          <div>
            Pembaruan terakhir: {new Date(scenario?.updated_at || Date.now()).toLocaleDateString('id-ID')}
          </div>
        </div>
      </div>

      {/* Mandatory Coaching Disclaimer */}
      <div className="p-3 rounded-control bg-raised border border-line text-sm text-2 flex items-center justify-between">
        <span>{BOARD_DISCLAIMER}</span>
        <span className="hidden sm:inline">BallR Academy System</span>
      </div>

      {/* Description & Coaching Points if present */}
      {(scenario?.description || scenario?.coaching_points) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-panel bg-panel border border-line text-sm">
          {scenario?.description && (
            <div>
              <span className="font-semibold text-1 block mb-1">Deskripsi Skema:</span>
              <p className="text-2 leading-relaxed whitespace-pre-wrap">{scenario.description}</p>
            </div>
          )}
          {scenario?.coaching_points && (
            <div>
              <span className="font-semibold text-1 block mb-1">Poin Pembinaan (Coaching Points):</span>
              <p className="text-2 leading-relaxed whitespace-pre-wrap">{scenario.coaching_points}</p>
            </div>
          )}
        </div>
      )}

      {/* Grid of Keyframes (A4 landscape grid) */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-1 border-b border-line pb-2">
          Urutan Bingkai Gerakan ({frames.length} Bingkai)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.map((frame, idx) => {
            const players = frame.players || [];
            const ball = frame.ball;
            const arrows = frame.arrows || [];

            return (
              <div
                key={`print-frame-${idx}`}
                className="p-3 rounded-panel bg-panel border border-line space-y-2 break-inside-avoid"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-1">
                    Bingkai {idx + 1}
                  </span>
                  <span className="tabular-nums text-2">
                    {frame.t_ms || 2000} ms
                  </span>
                </div>

                {/* SVG Pitch Diagram */}
                <div
                  className="relative w-full rounded-control overflow-hidden border border-pitch-line bg-pitch text-pitch-line"
                  style={{ aspectRatio: `${pitchLength} / ${pitchWidth}` }}
                >
                  <svg
                    viewBox={`0 0 ${pitchLength} ${pitchWidth}`}
                    className="w-full h-full select-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <marker
                        id={`p-pass-${idx}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-brand" />
                      </marker>
                      <marker
                        id={`p-run-${idx}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-series-2" />
                      </marker>
                      <marker
                        id={`p-press-${idx}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-danger" />
                      </marker>
                      <marker
                        id={`p-cover-${idx}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-warning" />
                      </marker>
                    </defs>

                    {/* Pitch Markings */}
                    <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.8">
                      <rect x="0" y="0" width={pitchLength} height={pitchWidth} />
                      <line x1={pitchLength / 2} y1="0" x2={pitchLength / 2} y2={pitchWidth} />
                      <circle cx={pitchLength / 2} cy={pitchWidth / 2} r={Math.min(9.15, pitchWidth / 4)} />
                      <rect
                        x="0"
                        y={(pitchWidth - Math.min(40.32, pitchWidth * 0.7)) / 2}
                        width={Math.min(16.5, pitchLength / 5)}
                        height={Math.min(40.32, pitchWidth * 0.7)}
                      />
                      <rect
                        x={pitchLength - Math.min(16.5, pitchLength / 5)}
                        y={(pitchWidth - Math.min(40.32, pitchWidth * 0.7)) / 2}
                        width={Math.min(16.5, pitchLength / 5)}
                        height={Math.min(40.32, pitchWidth * 0.7)}
                      />
                    </g>

                    {/* Arrows */}
                    {arrows.map((arr, aIdx) => {
                      const kind = arr.kind || 'pass';
                      let strokeClass = 'stroke-brand';
                      let dash = '2,1';
                      if (kind === 'run') {
                        strokeClass = 'stroke-series-2';
                        dash = 'none';
                      } else if (kind === 'press') {
                        strokeClass = 'stroke-danger';
                        dash = 'none';
                      } else if (kind === 'cover') {
                        strokeClass = 'stroke-warning';
                        dash = '1,1';
                      }

                      return (
                        <line
                          key={`a-${aIdx}`}
                          x1={arr.from.x}
                          y1={arr.from.y}
                          x2={arr.to.x}
                          y2={arr.to.y}
                          className={strokeClass}
                          strokeWidth="0.8"
                          strokeDasharray={dash}
                          markerEnd={`url(#p-${kind}-${idx})`}
                        />
                      );
                    })}

                    {/* Players */}
                    {players.map((p) => {
                      const isOwn = p.team === 'own';
                      const radius = 2.0;
                      return (
                        <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                          {isOwn ? (
                            <circle
                              r={radius}
                              className="fill-brand stroke-panel"
                              strokeWidth="0.5"
                            />
                          ) : (
                            <rect
                              x={-radius}
                              y={-radius}
                              width={radius * 2}
                              height={radius * 2}
                              rx="0.5"
                              className="fill-series-1 stroke-panel"
                              strokeWidth="0.5"
                            />
                          )}
                          <text
                            textAnchor="middle"
                            dy="0.8"
                            className="fill-app font-mono font-bold"
                            fontSize="2.2"
                          >
                            {p.label || ''}
                          </text>
                        </g>
                      );
                    })}

                    {/* Ball */}
                    {ball && (
                      <g transform={`translate(${ball.x}, ${ball.y})`}>
                        <circle
                          r="1.4"
                          className="fill-panel stroke-control"
                          strokeWidth="0.5"
                        />
                        <circle r="0.7" className="fill-app" />
                      </g>
                    )}
                  </svg>
                </div>

                {/* Coach Note for this frame */}
                <p className="text-sm text-2 italic leading-relaxed min-h-[32px]">
                  {frame.note || 'Posisi pergerakan pemain.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attached References Section */}
      <div className="space-y-2 pt-4 border-t border-line break-inside-avoid">
        <h3 className="text-sm font-semibold text-1 uppercase tracking-wider">
          Rujukan Metodologi Terlampir ({references.length})
        </h3>
        {references.length === 0 ? (
          <p className="text-sm text-2 italic">Tidak ada rujukan terlampir.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {references.map((r, rIdx) => (
              <div
                key={`ref-print-${rIdx}`}
                className="p-3 rounded-control bg-panel border border-line space-y-1"
              >
                <div className="font-semibold text-1">{r.title || r.reference_id}</div>
                <div className="text-2">
                  {r.publisher ? `${r.publisher} ` : ''}
                  {r.year ? `(${r.year})` : ''} • Status: {r.status === 'verified' ? 'Terverifikasi' : 'Belum diverifikasi'}
                </div>
                {r.note && (
                  <p className="text-2 italic pt-1 border-t border-line">
                    Catatan: &ldquo;{r.note}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dossier Footer */}
      <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-2 font-mono">
        <div className="flex items-center gap-1.5">
          <BrandMark size={14} aria-hidden="true" />
          <span>ProspekBola Papan Taktik — Lembar Instruksi Pelatih</span>
        </div>
        <div>Halaman Cetak Terstruktur A4</div>
      </div>
    </div>
  );
}
