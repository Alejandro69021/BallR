export default function JerseyTile({ number, size = 'md', className = '', ...props }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm rounded',
    md: 'w-8 h-8 text-sm rounded',
    lg: 'w-12 h-12 text-xl rounded-md',
  };

  const formattedNumber = number != null ? String(number) : '-';

  return (
    <div
      className={`bg-pitch text-bib font-display font-extrabold flex items-center justify-center shrink-0 leading-none select-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label={`Nomor punggung ${formattedNumber}`}
      {...props}
    >
      {formattedNumber}
    </div>
  );
}
