import React from 'react';

export default function SourceNote({
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

  if (parts.length === 0) return null;

  return (
    <p className={`text-[11px] md:text-xs font-mono text-[#4A5360] dark:text-[#9AA6B5] flex items-center gap-1.5 flex-wrap ${className}`}>
      {parts.join(' · ')}
    </p>
  );
}
