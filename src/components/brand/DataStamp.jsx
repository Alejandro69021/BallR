export default function DataStamp({ size = 'md', className = '', ...props }) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-[9px] p-1 border',
    md: 'w-24 h-24 text-xs p-2 border-2',
    lg: 'w-32 h-32 text-sm p-3 border-2',
  };

  return (
    <div
      role="img"
      aria-label="Data contoh fiktif"
      className={`inline-flex flex-col items-center justify-center rounded-full border-dashed border-bib text-bib font-display font-extrabold uppercase tracking-wider text-center select-none -rotate-12 leading-tight ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      <span>Data Contoh</span>
      <span>Fiktif</span>
    </div>
  );
}
