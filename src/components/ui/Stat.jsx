import React from 'react';

export default function Stat({
  label,
  value,
  unit,
  date,
  n,
  trend,
  className = ''
}) {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className={`p-3 rounded-panel border border-line bg-panel text-left space-y-1.5 ${className}`}>
      {label && (
        <p className="text-xs font-medium text-2 truncate">
          {label}
        </p>
      )}

      <div className="flex items-baseline gap-1.5 flex-wrap">
        {hasValue ? (
          <>
            <span className="text-xl md:text-2xl font-semibold font-mono tabular-nums text-1">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-normal text-2">
                {unit}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-2 italic">
            Belum ada data
          </span>
        )}
      </div>

      {(date || typeof n === 'number' || trend) && (
        <div className="pt-1 border-t border-line flex items-center justify-between text-xs font-mono text-2">
          <div className="flex items-center gap-2 truncate">
            {date && <span>{date}</span>}
            {typeof n === 'number' && <span>n={n}</span>}
          </div>
          {trend && <span className="font-sans text-xs">{trend}</span>}
        </div>
      )}
    </div>
  );
}
