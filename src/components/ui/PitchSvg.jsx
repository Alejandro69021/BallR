import React from 'react';

export default function PitchSvg({
  pitchLengthM = 105,
  pitchWidthM = 68,
  orientation = 'horizontal',
  onPitchClick,
  children,
  className = ''
}) {
  const isHorizontal = orientation === 'horizontal';
  const len = Number(pitchLengthM) || 105;
  const wid = Number(pitchWidthM) || 68;
  const viewBox = isHorizontal ? `0 0 ${len} ${wid}` : `0 0 ${wid} ${len}`;

  const handleClick = (e) => {
    if (!onPitchClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = Number(Math.max(0, Math.min(len, (cx / rect.width) * len)).toFixed(1));
    const y = Number(Math.max(0, Math.min(wid, (cy / rect.height) * wid)).toFixed(1));
    onPitchClick(x, y);
  };

  const midX = len / 2;
  const midY = wid / 2;
  const circleR = Math.min(9.15, wid / 4);
  const penBoxW = Math.min(16.5, len / 5);
  const penBoxH = Math.min(40.32, wid * 0.7);
  const goalBoxW = Math.min(5.5, len / 12);
  const goalBoxH = Math.min(18.32, wid * 0.35);

  return (
    <div className={`relative w-full overflow-hidden rounded-panel border border-line bg-panel text-2 ${className}`}>
      <svg
        viewBox={viewBox}
        onClick={handleClick}
        className={`w-full h-auto select-none ${onPitchClick ? 'cursor-crosshair' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Representasi taktis lapangan sepak bola"
        role="img"
      >
        {isHorizontal ? (
          <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
            {/* Outer boundary */}
            <rect x="0" y="0" width={len} height={wid} />
            {/* Halfway line */}
            <line x1={midX} y1="0" x2={midX} y2={wid} />
            {/* Center circle & spot */}
            <circle cx={midX} cy={midY} r={circleR} />
            <circle cx={midX} cy={midY} r="0.6" fill="currentColor" />
            {/* Left Penalty Area */}
            <rect x="0" y={(wid - penBoxH) / 2} width={penBoxW} height={penBoxH} />
            <rect x="0" y={(wid - goalBoxH) / 2} width={goalBoxW} height={goalBoxH} />
            <circle cx={penBoxW * 0.65} cy={midY} r="0.6" fill="currentColor" />
            {/* Right Penalty Area */}
            <rect x={len - penBoxW} y={(wid - penBoxH) / 2} width={penBoxW} height={penBoxH} />
            <rect x={len - goalBoxW} y={(wid - goalBoxH) / 2} width={goalBoxW} height={goalBoxH} />
            <circle cx={len - penBoxW * 0.65} cy={midY} r="0.6" fill="currentColor" />
          </g>
        ) : (
          <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
            {/* Outer boundary */}
            <rect x="0" y="0" width={wid} height={len} />
            {/* Halfway line */}
            <line x1="0" y1={midX} x2={wid} y2={midX} />
            {/* Center circle & spot */}
            <circle cx={midY} cy={midX} r={circleR} />
            <circle cx={midY} cy={midX} r="0.6" fill="currentColor" />
            {/* Top Penalty Area */}
            <rect x={(wid - penBoxH) / 2} y="0" width={penBoxH} height={penBoxW} />
            <rect x={(wid - goalBoxH) / 2} y="0" width={goalBoxH} height={goalBoxW} />
            <circle cx={midY} cy={penBoxW * 0.65} r="0.6" fill="currentColor" />
            {/* Bottom Penalty Area */}
            <rect x={(wid - penBoxH) / 2} y={len - penBoxW} width={penBoxH} height={penBoxW} />
            <rect x={(wid - goalBoxH) / 2} y={len - goalBoxW} width={goalBoxH} height={goalBoxW} />
            <circle cx={midY} cy={len - penBoxW * 0.65} r="0.6" fill="currentColor" />
          </g>
        )}
        {children}
      </svg>
    </div>
  );
}
