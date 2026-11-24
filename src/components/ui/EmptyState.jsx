import React from 'react';
import { PitchIllustration } from '../brand';

export default function EmptyState({
  icon,
  title = 'Belum ada data',
  description,
  action,
  className = ''
}) {
  return (
    <div className={`p-6 text-center flex flex-col items-center justify-center space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-center" aria-hidden="true">
        {icon || <PitchIllustration size={40} />}
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
