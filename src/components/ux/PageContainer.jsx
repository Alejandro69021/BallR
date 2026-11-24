import React from 'react';

export default function PageContainer({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      data-testid="page-container"
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
