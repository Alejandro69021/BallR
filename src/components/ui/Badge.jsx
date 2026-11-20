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
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5'
  };

  const variantClasses = {
    neutral: 'bg-raised text-2 border-line',
    brand: 'bg-brand/10 text-brand border-brand/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    danger: 'bg-danger/10 text-danger border-danger/30'
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
