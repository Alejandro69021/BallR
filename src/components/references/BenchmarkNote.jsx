import React from 'react';
import { assertValidReference } from '../../data/references';
import RefChip from '../ui/RefChip';

export default function BenchmarkNote({ metricName, benchmarkValue, sampleSize, dateRange, referenceIds = [] }) {
  assertValidReference(referenceIds);

  const primaryRef = Array.isArray(referenceIds) ? referenceIds[0] : referenceIds;

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-sm text-slate-400">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-300 font-medium">{metricName}:</span>
        <span className="font-mono text-white font-semibold">{benchmarkValue}</span>
        {sampleSize && (
          <span className="font-mono text-sm text-slate-500">
            (n={sampleSize}{dateRange ? ` · ${dateRange}` : ''})
          </span>
        )}
      </div>
      <RefChip referenceId={primaryRef} />
    </div>
  );
}
