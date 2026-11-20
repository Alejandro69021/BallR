import React from 'react';

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = ''
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium select-none border rounded-[4px] leading-tight';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5'
  };

  const variantClasses = {
    neutral:
      'bg-slate-100 dark:bg-[#1A212B] text-[#4A5360] dark:text-[#9AA6B5] border-[#DAD6CC] dark:border-[#2C3643]',
    brand:
      'bg-[#2E7D5B]/10 dark:bg-[#4FB286]/15 text-[#2E7D5B] dark:text-[#4FB286] border-[#2E7D5B]/30 dark:border-[#4FB286]/40',
    warning:
      'bg-[#8A5B00]/10 dark:bg-[#C98A1B]/15 text-[#8A5B00] dark:text-[#C98A1B] border-[#8A5B00]/30 dark:border-[#C98A1B]/40',
    danger:
      'bg-[#C2453D]/10 dark:bg-[#E06D66]/15 text-[#C2453D] dark:text-[#E06D66] border-[#C2453D]/30 dark:border-[#E06D66]/40'
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
