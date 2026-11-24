import React from 'react';
import { BrandMark } from '../brand';

export default function EmptyState({
  icon,
  title = 'Belum ada data',
  description,
  action,
  className = ''
}) {
  return (
    <div className={`p-6 text-center flex flex-col items-center justify-center space-y-2 select-none ${className}`}>
      <div className="p-2.5 rounded-full bg-raised text-2 flex items-center justify-center">
        {icon || <BrandMark size={20} aria-hidden="true" />}
      </div>

      <p className="text-sm font-medium text-1">
        {title}
      </p>

      {description && (
        <p className="text-sm text-2 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
