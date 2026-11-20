import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-control border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-[38px] px-3.5 text-sm gap-2'
  };

  const variantClasses = {
    primary:
      'bg-brand text-app border-transparent hover:opacity-90 active:opacity-95 focus-visible:ring-brand',
    secondary:
      'bg-panel text-1 border-control hover:bg-raised focus-visible:ring-brand',
    danger:
      'bg-danger text-app border-transparent hover:opacity-90 active:opacity-95 focus-visible:ring-danger',
    ghost:
      'bg-transparent text-1 border-transparent hover:bg-raised focus-visible:ring-brand'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
