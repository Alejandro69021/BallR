import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  id,
  value,
  onChange,
  options = [],
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'w-full appearance-none h-[38px] pl-3 pr-8 py-1.5 rounded-[6px] text-xs transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-45 disabled:cursor-not-allowed bg-white dark:bg-[#11161D] text-[#14181F] dark:text-[#E8ECF1]';

  const borderClasses = error
    ? 'border border-[#C2453D] dark:border-[#E06D66] focus:ring-[#E06D66]'
    : 'border border-[#788594] dark:border-[#64748B] focus:ring-[#2E7D5B] dark:focus:ring-[#4FB286]';

  return (
    <div className="relative w-full">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`${baseClasses} ${borderClasses} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#11161D] text-[#14181F] dark:text-[#E8ECF1]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="w-4 h-4 text-[#788594] dark:text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
