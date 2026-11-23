import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  id,
  value,
  onChange,
  options = [],
  children,
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'w-full appearance-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-[38px] pl-3 pr-8 py-1.5 rounded-control text-sm transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-45 disabled:cursor-not-allowed bg-panel text-1';

  const borderClasses = error
    ? 'border border-danger focus:ring-danger'
    : 'border border-control focus:ring-brand';

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
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-panel text-1">
              {opt.label}
            </option>
          ))}
      </select>
      <ChevronDown
        className="w-4 h-4 text-2 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
