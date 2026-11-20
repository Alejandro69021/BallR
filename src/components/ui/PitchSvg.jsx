import React from 'react';

export default function PitchSvg({
  orientation = 'horizontal',
  children,
  className = ''
}) {
  const isHorizontal = orientation === 'horizontal';
  const viewBox = isHorizontal ? '0 0 105 68' : '0 0 68 105';

  return (
    <div className={`relative w-full overflow-hidden rounded-panel border border-line bg-panel text-2 ${className}`}>
      <svg
        viewBox={viewBox}
        className="w-full h-auto select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Representasi taktis lapangan sepak bola"
        role="img"
      >
        {isHorizontal ? (
          <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
            {/* Outer boundary */}
            <rect x="0" y="0" width="105" height="68" />
            {/* Halfway line */}
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            {/* Center circle & spot */}
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.6" fill="currentColor" />
            {/* Left Penalty Area */}
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            <circle cx="11" cy="34" r="0.6" fill="currentColor" />
            <path d="M 16.5 26.7 A 9.15 9.15 0 0 1 16.5 41.3" />
            {/* Right Penalty Area */}
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            <circle cx="94" cy="34" r="0.6" fill="currentColor" />
            <path d="M 88.5 26.7 A 9.15 9.15 0 0 0 88.5 41.3" />
          </g>
        ) : (
          <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
            {/* Outer boundary */}
            <rect x="0" y="0" width="68" height="105" />
            {/* Halfway line */}
            <line x1="0" y1="52.5" x2="68" y2="52.5" />
            {/* Center circle & spot */}
            <circle cx="34" cy="52.5" r="9.15" />
            <circle cx="34" cy="52.5" r="0.6" fill="currentColor" />
            {/* Top Penalty Area */}
            <rect x="13.84" y="0" width="40.32" height="16.5" />
            <rect x="24.84" y="0" width="18.32" height="5.5" />
            <circle cx="34" cy="11" r="0.6" fill="currentColor" />
            <path d="M 26.7 16.5 A 9.15 9.15 0 0 0 41.3 16.5" />
            {/* Bottom Penalty Area */}
            <rect x="13.84" y="88.5" width="40.32" height="16.5" />
            <rect x="24.84" y="99.5" width="18.32" height="5.5" />
            <circle cx="34" cy="94" r="0.6" fill="currentColor" />
            <path d="M 26.7 88.5 A 9.15 9.15 0 0 1 41.3 88.5" />
          </g>
        )}
        {children}
      </svg>
    </div>
  );
}
