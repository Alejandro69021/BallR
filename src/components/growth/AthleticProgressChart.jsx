import React from 'react';
import { Clock, Activity, TrendingUp } from 'lucide-react';
import SourceNote from '../ui/SourceNote';
import Badge from '../ui/Badge';

/**
 * Helper to render different SVG marker shapes per series.
 */
function renderMarker(shape, x, y, isSelected, seriesColor) {
  const size = isSelected ? 8 : 6;

  if (shape === 'square') {
    return (
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        fill={isSelected ? 'var(--text-1)' : seriesColor}
        stroke={seriesColor}
        strokeWidth="1.5"
      />
    );
  }

  if (shape === 'triangle') {
    const half = size / 2;
    const points = `${x},${y - half} ${x + half},${y + half} ${x - half},${y + half}`;
    return (
      <polygon
        points={points}
        fill={isSelected ? 'var(--text-1)' : seriesColor}
        stroke={seriesColor}
        strokeWidth="1.5"
      />
    );
  }

  // Default: circle
  return (
    <circle
      cx={x}
      cy={y}
      r={size / 2}
      fill={isSelected ? 'var(--text-1)' : seriesColor}
      stroke={seriesColor}
      strokeWidth="1.5"
    />
  );
}

export default function AthleticProgressChart({
  activeMetric = 'height',
  setActiveMetric,
  selectedPointIndex = 0,
  setSelectedPointIndex,
  metricsData = {}
}) {
  const currentDataset = metricsData[activeMetric] || metricsData.height || Object.values(metricsData)[0];
  if (!currentDataset || !currentDataset.points || currentDataset.points.length === 0) {
    return null;
  }

  const points = currentDataset.points;
  const n = points.length;

  // Parse real dates for true time-scale X coordinates
  const parsedPoints = points.map((pt, i) => {
    const rawDate = pt.date || pt.test_date || pt.month;
    const timestamp = new Date(rawDate).getTime();
    return {
      ...pt,
      idx: i,
      timestamp: isNaN(timestamp) ? i : timestamp,
      displayDate: pt.displayDate || pt.month || pt.date || `Tes ${i + 1}`
    };
  });

  const minTime = parsedPoints[0].timestamp;
  const maxTime = parsedPoints[n - 1].timestamp;
  const timeRange = maxTime - minTime;

  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 45;
  const padTop = 30;
  const padBottom = 35;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minVal = currentDataset.minVal ?? Math.min(...points.map((p) => p.value));
  const maxVal = currentDataset.maxVal ?? Math.max(...points.map((p) => p.value));
  const valRange = maxVal - minVal || 1;

  // Compute node coordinates with true time scale
  const coords = parsedPoints.map((pt, i) => {
    let timeRatio;
    if (timeRange > 0) {
      timeRatio = (pt.timestamp - minTime) / timeRange;
    } else {
      timeRatio = n > 1 ? i / (n - 1) : 0.5;
    }

    const x = padLeft + timeRatio * chartW;
    let norm = (pt.value - minVal) / valRange;
    norm = Math.max(0, Math.min(1, isNaN(norm) ? 0.5 : norm));

    const y = currentDataset.invertY
      ? padTop + norm * chartH
      : padTop + (1 - norm) * chartH;

    return { x, y, pt, idx: i };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const selectedPt = coords.find((c) => c.idx === selectedPointIndex) || coords[coords.length - 1];

  // Gridlines at one step
  const step = currentDataset.step || (valRange > 10 ? 5 : 1);
  const gridSteps = [];
  for (let v = minVal; v <= maxVal + 0.0001; v += step) {
    gridSteps.push(parseFloat(v.toFixed(2)));
  }

  const seriesColor = currentDataset.seriesColor || 'var(--series-1)';
  const markerShape = currentDataset.markerShape || 'circle';

  return (
    <section className="rounded-panel bg-panel border border-line p-5 space-y-4">
      {/* Metric Selector Tabs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-line">
        <div>
          <h3 className="text-base font-semibold text-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <span>Grafik perkembangan fisik longitudinal</span>
          </h3>
          <p className="text-xs text-2 mt-0.5">
            Pencatatan runut waktu metrik fisik terstandar berdasarkan tanggal pengukuran berkala.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-control bg-raised border border-line overflow-x-auto self-start sm:self-auto">
          {metricsData.height && (
            <button
              type="button"
              onClick={() => {
                setActiveMetric('height');
                setSelectedPointIndex(metricsData.height.points.length - 1);
              }}
              className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'height'
                  ? 'bg-panel text-1 border border-line shadow-xs'
                  : 'text-2 hover:text-1'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Tinggi badan</span>
            </button>
          )}

          {metricsData.sprint && (
            <button
              type="button"
              onClick={() => {
                setActiveMetric('sprint');
                setSelectedPointIndex(metricsData.sprint.points.length - 1);
              }}
              className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'sprint'
                  ? 'bg-panel text-1 border border-line shadow-xs'
                  : 'text-2 hover:text-1'
              }`}
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Sprint 20m</span>
            </button>
          )}

          {metricsData.jump && (
            <button
              type="button"
              onClick={() => {
                setActiveMetric('jump');
                setSelectedPointIndex(metricsData.jump.points.length - 1);
              }}
              className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMetric === 'jump'
                  ? 'bg-panel text-1 border border-line shadow-xs'
                  : 'text-2 hover:text-1'
              }`}
            >
              <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Vertical Jump</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtitle note for inverted sprint axis or standard metric */}
      {currentDataset.invertY && (
        <p className="text-xs text-2">
          Sumbu Y dibalik: waktu lebih rendah = lebih cepat
        </p>
      )}

      {/* SVG Line Chart */}
      <div className="w-full rounded-panel bg-raised border border-line p-3 sm:p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label={`Grafik ${currentDataset.name}`}
        >
          {/* Unit label on top left of Y axis */}
          <text
            x={padLeft}
            y={padTop - 12}
            textAnchor="start"
            className="text-xs font-mono"
            fill="var(--text-2)"
            fontSize="10"
          >
            {currentDataset.unit}
          </text>

          {/* Gridlines at one step */}
          {gridSteps.map((val) => {
            let norm = (val - minVal) / valRange;
            norm = Math.max(0, Math.min(1, isNaN(norm) ? 0.5 : norm));
            const yVal = currentDataset.invertY
              ? padTop + norm * chartH
              : padTop + (1 - norm) * chartH;

            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={yVal}
                  x2={svgWidth - padRight}
                  y2={yVal}
                  stroke="var(--line)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={yVal + 3}
                  textAnchor="end"
                  fill="var(--text-2)"
                  fontSize="10"
                  fontFamily="monospace"
                  className="tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bottom baseline (X axis) */}
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={svgWidth - padRight}
            y2={padTop + chartH}
            stroke="var(--line)"
            strokeWidth="1"
          />

          {/* Main Polyline */}
          <polyline
            fill="none"
            stroke={seriesColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data Points / Markers */}
          {coords.map((c, i) => {
            const isSelected = selectedPointIndex === c.idx;
            const isFirst = i === 0;
            const isLast = i === coords.length - 1;
            const shouldShowLabel = isFirst || isLast || isSelected;

            return (
              <g
                key={c.idx}
                className="cursor-pointer"
                onClick={() => setSelectedPointIndex(c.idx)}
                tabIndex={0}
                role="button"
                aria-label={`Titik ${c.pt.displayDate}: ${c.pt.value} ${currentDataset.unit}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPointIndex(c.idx);
                  }
                }}
              >
                {/* Marker Shape */}
                {renderMarker(markerShape, c.x, c.y, isSelected, seriesColor)}

                {/* Labels only on first/last/selected point */}
                {shouldShowLabel && (
                  <>
                    <text
                      x={c.x}
                      y={c.y - 10}
                      textAnchor="middle"
                      fill={isSelected ? 'var(--text-1)' : 'var(--text-2)'}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="tabular-nums"
                    >
                      {c.pt.value}
                    </text>
                    <text
                      x={c.x}
                      y={padTop + chartH + 18}
                      textAnchor="middle"
                      fill={isSelected ? 'var(--text-1)' : 'var(--text-2)'}
                      fontSize="10"
                      fontFamily="sans-serif"
                    >
                      {c.pt.displayDate}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Data Point Detail Strip */}
      {selectedPt && (
        <div className="p-3.5 rounded-control bg-raised border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-1">
                {selectedPt.pt.month || selectedPt.pt.date}
              </span>
              <Badge variant="neutral">
                Hasil: <strong className="text-1 font-mono">{selectedPt.pt.value} {currentDataset.unit}</strong>
              </Badge>
            </div>
            {selectedPt.pt.note && (
              <p className="text-xs text-2">
                {selectedPt.pt.note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* SourceNote */}
      <SourceNote
        source="pengukuran akademi"
        sampleSize={coords.length}
      />
    </section>
  );
}
