import React from 'react';
import { assertValidReference } from '../../data/references';
import RefChip from '../ui/RefChip';

export default function GrowthAdvice({ advisoryText, stage, referenceIds = [] }) {
  assertValidReference(referenceIds);

  const primaryRef = Array.isArray(referenceIds) ? referenceIds[0] : referenceIds;

  return (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Anjuran Pertumbuhan Biologis</span>
          {stage && (
            <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-800 text-brand">
              {stage}
            </span>
          )}
        </div>
        <RefChip referenceId={primaryRef} />
      </div>
      <p className="text-slate-300 text-xs leading-relaxed">{advisoryText}</p>
    </div>
  );
}
