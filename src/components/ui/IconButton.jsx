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
    'inline-flex items-center justify-center rounded-[6px] border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-[34px] h-[34px] text-sm'
  };

  const variantClasses = {
    ghost:
      'bg-transparent text-[#4A5360] dark:text-[#9AA6B5] hover:text-[#14181F] dark:hover:text-[#E8ECF1] border-transparent hover:bg-black/5 dark:hover:bg-white/5 focus-visible:ring-[#4FB286]',
    secondary:
      'bg-white dark:bg-[#1A212B] text-[#14181F] dark:text-[#E8ECF1] border-[#788594] dark:border-[#64748B] hover:bg-slate-50 dark:hover:bg-[#222B38] focus-visible:ring-[#4FB286]'
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
