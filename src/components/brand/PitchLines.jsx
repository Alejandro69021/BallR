export default function PitchLines({ opacity = 0.12, markings, variant, className = '', ...props }) {
  const mode = variant || markings || 'all';
  const showCenter = mode === 'all' || mode === 'center';
  const showPenalty = mode === 'all' || mode === 'penalty';

  return (
    <svg
      viewBox="0 0 105 68"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
      {...props}
    >
      <rect
        x="0.75"
        y="0.75"
        width="103.5"
        height="66.5"
        fill="none"
        stroke="var(--chalk)"
        strokeWidth="1.5"
      />
      {showCenter && (
        <g stroke="var(--chalk)" strokeWidth="1.5" fill="none">
          <line x1="52.5" y1="0" x2="52.5" y2="68" />
          <circle cx="52.5" cy="34" r="9.15" />
          <circle cx="52.5" cy="34" r="0.75" fill="var(--chalk)" />
        </g>
      )}
      {showPenalty && (
        <g stroke="var(--chalk)" strokeWidth="1.5" fill="none">
          <rect x="0" y="13.85" width="16.5" height="40.3" />
          <rect x="0" y="24.85" width="5.5" height="18.3" />
          <circle cx="11" cy="34" r="0.75" fill="var(--chalk)" />
          <path d="M 16.5 26.7 A 9.15 9.15 0 0 1 16.5 41.3" />

          <rect x="88.5" y="13.85" width="16.5" height="40.3" />
          <rect x="99.5" y="24.85" width="5.5" height="18.3" />
          <circle cx="94" cy="34" r="0.75" fill="var(--chalk)" />
          <path d="M 88.5 26.7 A 9.15 9.15 0 0 0 88.5 41.3" />
        </g>
      )}
    </svg>
  );
}
