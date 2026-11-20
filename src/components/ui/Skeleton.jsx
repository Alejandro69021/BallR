import React from 'react';

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = ''
}) {
  const variantClasses = {
    text: 'h-3.5 w-full rounded-[4px]',
    rect: 'rounded-control',
    circle: 'rounded-full'
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`bg-raised animate-pulse ${variantClasses[variant] || variantClasses.text} ${className}`}
    />
  );
}
