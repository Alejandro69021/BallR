import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({
  icon,
  title = 'Belum ada data',
  description,
  action,
  className = ''
}) {
  return (
    <div className={`p-6 text-center flex flex-col items-center justify-center space-y-2 select-none ${className}`}>
      <div className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 text-[#4A5360] dark:text-[#9AA6B5] flex items-center justify-center">
        {icon || <Database className="w-5 h-5" aria-hidden="true" />}
      </div>

      <p className="text-sm font-medium text-[#14181F] dark:text-[#E8ECF1]">
        {title}
      </p>

      {description && (
        <p className="text-xs text-[#4A5360] dark:text-[#9AA6B5] max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
