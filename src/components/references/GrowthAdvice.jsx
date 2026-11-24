import React from 'react';
import { assertValidReference } from '../../data/references';
import RefChip from '../ui/RefChip';

export default function GrowthAdvice({ advisoryText, stage, referenceIds = [] }) {
  assertValidReference(referenceIds);

  const primaryRef = Array.isArray(referenceIds) ? referenceIds[0] : referenceIds;

  return (
    <div className="p-3 rounded-lg bg-panel border border-line space-y-1.5 text-sm text-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-1">Anjuran Pertumbuhan Biologis</span>
          {stage && (
            <span className="text-sm font-mono px-1.5 py-0.2 rounded bg-raised text-brand">
              {stage}
            </span>
          )}
        </div>
        <RefChip referenceId={primaryRef} />
      </div>
      <p className="text-2 text-sm leading-relaxed">{advisoryText}</p>
    </div>
  );
}
