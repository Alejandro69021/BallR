import React from 'react';

export default function Surface({
  surface = 'dark',
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      data-surface={surface}
      className={`bg-app text-1 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
