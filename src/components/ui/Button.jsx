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
    'inline-flex items-center justify-center font-medium rounded-[6px] border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-[38px] px-3.5 text-sm gap-2'
  };

  const variantClasses = {
    primary:
      'bg-[#2E7D5B] dark:bg-[#4FB286] text-white dark:text-[#0B0F14] border-transparent hover:brightness-105 active:brightness-95 focus-visible:ring-[#2E7D5B] dark:focus-visible:ring-[#4FB286]',
    secondary:
      'bg-white dark:bg-[#1A212B] text-[#14181F] dark:text-[#E8ECF1] border-[#788594] dark:border-[#64748B] hover:bg-slate-50 dark:hover:bg-[#222B38] focus-visible:ring-[#4FB286]',
    danger:
      'bg-[#C2453D] dark:bg-[#E06D66] text-white dark:text-[#0B0F14] border-transparent hover:brightness-105 active:brightness-95 focus-visible:ring-[#E06D66]',
    ghost:
      'bg-transparent text-[#14181F] dark:text-[#E8ECF1] border-transparent hover:bg-black/5 dark:hover:bg-white/5 focus-visible:ring-[#4FB286]'
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
