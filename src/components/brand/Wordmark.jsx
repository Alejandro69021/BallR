import BrandMark from './BrandMark';

export default function Wordmark({ variant = 'dark', size = 'md', className = '', ...props }) {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const prospekColor = variant === 'light' ? 'text-chalk' : 'text-ink';

  return (
    <div
      role="img"
      aria-label="ProspekBola"
      className={`inline-flex items-center gap-2 select-none ${className}`}
      {...props}
    >
      <BrandMark size={markSize} variant={variant} aria-hidden="true" />
      <span className={`font-display font-extrabold tracking-tight flex items-center leading-none ${textSize}`}>
        <span className={prospekColor}>PROSPEK</span>
        <span className="ml-1 bg-bib text-ink px-1.5 py-0.5 rounded-xs leading-none">BOLA</span>
      </span>
    </div>
  );
}
