export default function BrandMark({ size = 24, variant = 'dark', className = '', ...props }) {
  const isLight = variant === 'light';
  const isHidden = props['aria-hidden'] === true || props['aria-hidden'] === 'true';

  return (
    <svg
      data-testid="brand-mark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={isHidden ? undefined : 'img'}
      aria-label={isHidden ? undefined : 'ProspekBola'}
      className={`shrink-0 ${className}`}
      {...props}
    >
      {isLight ? (
        <>
          <rect width="64" height="64" rx="14" fill="var(--bib)" />
          <g fill="none" stroke="var(--pitch)" strokeWidth="3" strokeLinecap="round">
            <circle cx="30" cy="36" r="13" />
            <path d="M10 36h40" />
            <path d="M38 24 L49 13" />
          </g>
          <circle cx="50" cy="12" r="6" fill="var(--pitch)" />
        </>
      ) : (
        <>
          <rect width="64" height="64" rx="14" fill="var(--pitch)" />
          <g fill="none" stroke="var(--chalk)" strokeWidth="3" strokeLinecap="round">
            <circle cx="30" cy="36" r="13" />
            <path d="M10 36h40" />
          </g>
          <path d="M38 24 L49 13" fill="none" stroke="var(--bib)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="12" r="6" fill="var(--bib)" />
        </>
      )}
    </svg>
  );
}
