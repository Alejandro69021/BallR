import React from 'react';

/**
 * Clean section wrapper without laggy opacity-fade blur on fast scroll.
 */
export default function RevealSection({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
