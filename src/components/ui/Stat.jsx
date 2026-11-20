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
    <div className={`p-3 rounded-[8px] border border-[#DAD6CC] dark:border-[#2C3643] bg-white dark:bg-[#11161D] text-left space-y-1.5 ${className}`}>
      {label && (
        <p className="text-xs font-medium text-[#4A5360] dark:text-[#9AA6B5] truncate">
          {label}
        </p>
      )}

      <div className="flex items-baseline gap-1.5 flex-wrap">
        {hasValue ? (
          <>
            <span className="text-xl md:text-2xl font-semibold font-mono tabular-nums text-[#14181F] dark:text-[#E8ECF1]">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-normal text-[#4A5360] dark:text-[#9AA6B5]">
                {unit}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-[#4A5360] dark:text-[#9AA6B5] italic">
            Belum ada data
          </span>
        )}
      </div>

      {(date || typeof n === 'number' || trend) && (
        <div className="pt-1 border-t border-[#DAD6CC] dark:border-[#2C3643] flex items-center justify-between text-[11px] font-mono text-[#4A5360] dark:text-[#9AA6B5]">
          <div className="flex items-center gap-2 truncate">
            {date && <span>{date}</span>}
            {typeof n === 'number' && <span>n={n}</span>}
          </div>
          {trend && <span className="font-sans text-[11px]">{trend}</span>}
        </div>
      )}
    </div>
  );
}
