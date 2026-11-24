import React from 'react';

/**
 * PitchIllustration (src/components/brand/PitchIllustration.jsx)
 * Per docs/BRAND_SPEC.md sections 5 & 6:
 * Small pitch-line illustration built from PitchLines primitives:
 * centre circle, halfway line, one bib dot in turf/ink tones, aria-hidden.
 */
export default function PitchIllustration({ size = 48, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`select-none shrink-0 ${className}`}
      {...props}
    >
      {/* Pitch outer rectangle in turf/ink tone */}
      <rect
        x="6"
        y="8"
        width="36"
        height="32"
        rx="4"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeOpacity="0.35"
      />
      {/* Halfway line in turf/ink tone */}
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="40"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* Centre circle */}
      <circle
        cx="24"
        cy="24"
        r="7.5"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeOpacity="0.8"
      />
      {/* One bib dot */}
      <circle
        cx="24"
        cy="24"
        r="2.5"
        fill="var(--bib)"
        stroke="var(--pitch)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
