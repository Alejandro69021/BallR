import React from 'react';
import SourceNote from './ui/SourceNote';

const ATTRIBUTE_METADATA = [
  { key: 'pace', label: 'Kecepatan', code: 'PAC', desc: 'Akselerasi lari dan transisi gerak' },
  { key: 'shooting', label: 'Tembakan', code: 'SHO', desc: 'Akurasi tembakan dan penyelesaian peluang' },
  { key: 'passing', label: 'Operan', code: 'PAS', desc: 'Sirkulasi bola pendek dan visi umpan' },
  { key: 'dribbling', label: 'Menggiring', code: 'DRI', desc: 'Kontrol bola saat bergerak dan kelincahan' },
  { key: 'defending', label: 'Bertahan', code: 'DEF', desc: 'Disiplin posisi dan intersep jalur umpan' },
  { key: 'physical', label: 'Fisik', code: 'PHY', desc: 'Daya tahan pertandingan dan kekuatan duel darat' }
];

export default function PerformanceRadar({
  attributes = [],
  athleteName = 'Atlet',
  period = 'Oktober 2026'
}) {
  const size = 320;
  const center = size / 2;
  const radius = 90;
  const totalPoints = 6;

  // Align attributes to the canonical 6 items
  const canonicalAttributes = ATTRIBUTE_METADATA.map((meta) => {
    const found = (attributes || []).find((a) =>
      a.attribute && a.attribute.toLowerCase().includes(meta.key)
    );
    const num = found && found.value !== null && found.value !== undefined && found.value !== ''
      ? Number(found.value)
      : null;
    return {
      ...meta,
      value: num !== null && Number.isFinite(num) ? num : null
    };
  });

  const getCoordinates = (val, index) => {
    const angle = (index * 2 * Math.PI) / totalPoints - Math.PI / 2;
    const r = ((val || 0) / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const hasData = canonicalAttributes.some((a) => a.value !== null);

  // SVG series polygon points
  const polygonPoints = hasData
    ? canonicalAttributes
        .map((attr, i) => {
          const { x, y } = getCoordinates(attr.value ?? 0, i);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <section className="space-y-4 text-1">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-line">
        <div>
          <h2 className="text-base font-semibold text-1">
            Penilaian Atribut Lapangan
          </h2>
          <p className="text-sm text-2">
            Enam pilar teknis kelompok usia binaan (skala 0-100).
          </p>
        </div>
        {period && (
          <span className="text-sm font-mono text-2">
            Periode: {period}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radar SVG */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[280px] h-[280px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full overflow-visible"
              aria-label={`Grafik radar atribut teknis ${athleteName}`}
              role="img"
            >
              {/* Concentric Grid Polygons with Ticks at 25, 50, 75, 100 */}
              {gridLevels.map((level, idx) => {
                const ringPoints = Array.from({ length: totalPoints })
                  .map((_, i) => {
                    const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                    const r = level * radius;
                    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                  })
                  .join(' ');

                const tickValue = Math.round(level * 100);

                return (
                  <g key={idx}>
                    <polygon
                      points={ringPoints}
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="1"
                      strokeDasharray={idx === 3 ? 'none' : '3,3'}
                    />
                    {/* Scale tick label on the top vertical axis */}
                    <text
                      x={center + 3}
                      y={center - level * radius + 10}
                      fill="var(--text-2)"
                      fontSize="9"
                      fontFamily="monospace"
                      opacity="0.8"
                    >
                      {tickValue}
                    </text>
                  </g>
                );
              })}

              {/* Six Axis Lines */}
              {Array.from({ length: totalPoints }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="var(--line)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data Series Polygon - One Series from --series-1, NO glow */}
              {hasData && (
                <polygon
                  points={polygonPoints}
                  fill="var(--series-1)"
                  fillOpacity="0.15"
                  stroke="var(--series-1)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}

              {/* Vertices with Marker Shapes (Circle markers) & Axis Labels */}
              {canonicalAttributes.map((attr, i) => {
                const angle = (i * 2 * Math.PI) / totalPoints - Math.PI / 2;
                const { x, y } = getCoordinates(attr.value ?? 0, i);

                const labelRadius = radius + 26;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);

                return (
                  <g key={attr.code}>
                    {hasData && attr.value !== null && (
                      <circle
                        cx={x}
                        cy={y}
                        r={4}
                        fill="var(--panel)"
                        stroke="var(--series-1)"
                        strokeWidth="2"
                      />
                    )}
                    <text
                      x={lx}
                      y={ly + 4}
                      textAnchor="middle"
                      fill="var(--text-2)"
                      className="radar-label fill-[var(--text-2)] text-xs select-none"
                      style={{ fontSize: '12px' }}
                      fontFamily="sans-serif"
                      fontWeight="500"
                    >
                      {attr.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Accompanying Numeric Table of the Six Values */}
        <div className="md:col-span-7">
          <div className="overflow-x-auto border border-line rounded-panel bg-panel">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-line bg-raised text-2">
                <tr>
                  <th scope="col" className="py-2.5 px-3 font-semibold">Atribut</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold text-right">Nilai (0-100)</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">Keterangan Teknis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-1">
                {canonicalAttributes.map((attr) => (
                  <tr key={attr.key} className="hover:bg-raised/40 transition-colors">
                    <td className="py-2 px-3 font-medium">
                      {attr.label} <span className="text-2 font-mono text-sm">({attr.code})</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                      {attr.value !== null ? attr.value : <span className="text-2 font-normal italic">Belum ada data</span>}
                    </td>
                    <td className="py-2 px-3 text-2">
                      {attr.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SourceNote source="asesmen pelatih" date={period} sampleSize={1} />
    </section>
  );
}
