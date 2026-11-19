import React from 'react';
import { assertValidReference } from '../../data/references';
import RefChip from '../ui/RefChip';

export default function TacticalGuidance({ title, guidanceText, referenceIds = [], phase }) {
  assertValidReference(referenceIds);

  const primaryRef = Array.isArray(referenceIds) ? referenceIds[0] : referenceIds;

  return (
    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-slate-300">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {phase && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
              {phase}
            </span>
          )}
          <span className="font-semibold text-white">{title || 'Panduan Taktis'}</span>
        </div>
        <RefChip referenceId={primaryRef} />
      </div>
      <p className="text-slate-300 text-[11px] leading-relaxed">{guidanceText}</p>
    </div>
  );
}
