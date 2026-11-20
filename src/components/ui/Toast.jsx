import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({
  message,
  subtext,
  variant = 'info',
  onClose,
  duration = 4000,
  className = ''
}) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    info: <Info className="w-4 h-4 text-series-1 shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-full p-3.5 rounded-panel border border-line bg-raised text-1 shadow-popover flex items-start gap-3 transition-transform duration-150 ease-out ${className}`}
    >
      {icons[variant] || icons.info}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight text-1">
          {message}
        </p>
        {subtext && (
          <p className="text-[11px] text-2 mt-0.5 leading-snug">
            {subtext}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="p-1 rounded text-2 hover:text-1 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
