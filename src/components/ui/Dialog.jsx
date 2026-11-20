import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className = ''
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-150 ease-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-desc' : undefined}
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className={`relative w-full max-w-lg rounded-panel border border-line bg-panel text-1 shadow-popover z-10 p-5 space-y-4 ${className}`}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-line">
          <div>
            {title && (
              <h2 id="dialog-title" className="text-base font-semibold text-1">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-desc" className="text-xs text-2 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={<X className="w-4 h-4" />}
            label="Tutup dialog"
            onClick={onClose}
            size="sm"
          />
        </div>

        <div className="space-y-3">{children}</div>

        {footer && (
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
