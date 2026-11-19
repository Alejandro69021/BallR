import React from 'react';
import { Clock, Activity, Award } from 'lucide-react';

export default function AthleticProgressChart({
  activeMetric,
  setActiveMetric,
  selectedPointIndex,
  setSelectedPointIndex,
  metricsData
}) {
  const currentDataset = metricsData[activeMetric];

  // SVG Chart Geometry Specs
  const svgWidth = 600;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 30;
  const padBottom = 40;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Compute node coordinates
  const coords = currentDataset.points.map((pt, i) => {
    const x = padLeft + (i / (currentDataset.points.length - 1)) * chartW;
    let norm = (pt.value - currentDataset.minVal) / (currentDataset.maxVal - currentDataset.minVal);
    norm = Math.max(0, Math.min(1, norm));
    const y = currentDataset.invertY
      ? padTop + norm * chartH
      : padTop + (1 - norm) * chartH;
    return { x, y, pt, idx: i };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath = `M ${coords[0].x},${padTop + chartH} L ${polylinePoints.replace(/ /g, ' L ')} L ${coords[coords.length - 1].x},${padTop + chartH} Z`;

  const selectedPt = coords.find((c) => c.idx === selectedPointIndex) || coords[coords.length - 1];

  return (
    <section className="rounded-2xl bg-[#111827] border border-[#1F2937] p-4 sm:p-6 shadow-xl space-y-4">
      {/* Metric Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2937]">
        <div>
          <h4 className="font-athletic text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Longitudinal Athletic Progression (Mei - Okt 2026)</span>
          </h4>
          <p className="text-xs text-slate-400">
            Tap titik data untuk melihat rincian catatan pelatih & perbandingan rata-rata akademi
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1E2638] overflow-x-auto self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveMetric('sprint');
              setSelectedPointIndex(3);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeMetric === 'sprint'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sprint 20m (Kecepatan)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMetric('jump');
              setSelectedPointIndex(3);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeMetric === 'jump'
                ? 'bg-[#84CC16] text-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Vertical Jump (Daya Ledak)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMetric('ovr');
              setSelectedPointIndex(3);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-athletic font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeMetric === 'ovr'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rating OVR (Performa)</span>
          </button>
        </div>
      </div>

      {/* Delta Stat Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#090D16]/80 border border-[#1F2937]">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-athletic font-bold border ${currentDataset.badgeBg}`}>
            Delta 6 Bulan: {currentDataset.delta} ({currentDataset.deltaPercent})
          </span>
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
            • {currentDataset.verdict}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {currentDataset.invertY ? '▲ Nilai lebih rendah = Waktu lebih cepat' : '▲ Nilai lebih tinggi = Peningkatan positif'}
        </div>
      </div>

      {/* Custom SVG Line Graph */}
      <div className="relative w-full rounded-2xl bg-black/60 border border-slate-800/80 p-2 sm:p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-${activeMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentDataset.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={currentDataset.color} stopOpacity="0.0" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid horizontal guidelines */}
          {[0.2, 0.5, 0.8].map((ratio, i) => {
            const yVal = padTop + ratio * chartH;
            return (
              <line
                key={i}
                x1={padLeft - 10}
                y1={yVal}
                x2={svgWidth - padRight + 10}
                y2={yVal}
                stroke="#1F2937"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fill under curve */}
          <path
            d={areaPath}
            fill={`url(#grad-${activeMetric})`}
          />

          {/* Main Polyline Curve */}
          <polyline
            fill="none"
            stroke={currentDataset.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            filter="url(#glow)"
          />

          {/* Data Points / Nodes */}
          {coords.map((c) => {
            const isSelected = selectedPointIndex === c.idx;

            return (
              <g
                key={c.idx}
                className="cursor-pointer transition-transform"
                onClick={() => setSelectedPointIndex(c.idx)}
              >
                {isSelected && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="12"
                    fill={currentDataset.color}
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? '7' : '5'}
                  fill={isSelected ? '#FFFFFF' : currentDataset.color}
                  stroke={currentDataset.color}
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                <text
                  x={c.x}
                  y={c.y - 12}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#94A3B8'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {c.pt.value} {currentDataset.unit === 'OVR' ? '' : currentDataset.unit}
                </text>

                <text
                  x={c.x}
                  y={padTop + chartH + 20}
                  textAnchor="middle"
                  fill={isSelected ? currentDataset.color : '#64748B'}
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {c.pt.month.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Data Point Details */}
      {selectedPt && (
        <div className="p-4 rounded-xl bg-[#090D16] border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-athletic text-sm font-extrabold text-white">
                {selectedPt.pt.month}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Hasil: <strong className="text-white">{selectedPt.pt.value} {currentDataset.unit}</strong>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                (Rata-rata U-13: {selectedPt.pt.groupAvg} {currentDataset.unit})
              </span>
            </div>
            <p className="text-xs text-slate-300">
              💬 <em>"{selectedPt.pt.note}"</em>
            </p>
          </div>

          <div className="self-end sm:self-center shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-athletic font-bold ${currentDataset.badgeBg}`}>
              {selectedPt.pt.value > selectedPt.pt.groupAvg && currentDataset.invertY === false
                ? `+${(selectedPt.pt.value - selectedPt.pt.groupAvg).toFixed(1)} di atas rata-rata`
                : selectedPt.pt.value < selectedPt.pt.groupAvg && currentDataset.invertY === true
                ? `${(selectedPt.pt.groupAvg - selectedPt.pt.value).toFixed(2)}s lebih gesit dari rata-rata`
                : 'Sesuai tolok ukur usia'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
