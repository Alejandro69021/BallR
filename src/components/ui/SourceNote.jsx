import React from 'react';

export default function SourceNote({
  children,
  source,
  date,
  sampleSize,
  citationKey,
  className = ''
}) {
  const parts = [];
  if (source) parts.push(`Sumber: ${source}`);
  if (date) parts.push(date);
  if (typeof sampleSize === 'number') parts.push(`n=${sampleSize}`);
  if (citationKey) parts.push(`[${citationKey}]`);
  if (children) parts.push(children);

  if (parts.length === 0) return null;

  return (
    <p className={`text-xs md:text-xs font-mono text-2 flex items-center gap-1.5 flex-wrap ${className}`}>
      {parts.join(' · ')}
    </p>
  );
}
