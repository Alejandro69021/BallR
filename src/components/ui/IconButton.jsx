import React from 'react';

export default function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-control border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeClasses = {
    sm: 'w-[44px] h-[44px] min-h-[44px] min-w-[44px] sm:w-7 sm:h-7 sm:min-h-0 sm:min-w-0 text-sm',
    md: 'w-[44px] h-[44px] min-h-[44px] min-w-[44px] sm:w-[34px] sm:h-[34px] sm:min-h-0 sm:min-w-0 text-sm'
  };

  const variantClasses = {
    ghost:
      'bg-transparent text-2 hover:text-1 border-transparent hover:bg-raised focus-visible:ring-brand',
    secondary:
      'bg-panel text-1 border-control hover:bg-raised focus-visible:ring-brand'
  };

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.ghost} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
