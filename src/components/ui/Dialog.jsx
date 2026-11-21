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
  className = '',
  icon,
  size = 'md',
  onSubmit
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const previouslyFocused = document.activeElement;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const timer = setTimeout(() => {
      if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
        const focusables = dialogRef.current.querySelectorAll(focusableSelector);
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(focusableSelector)
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultMaxW = className.includes('max-w-')
    ? ''
    : size === 'sm'
    ? 'max-w-sm'
    : size === 'lg'
    ? 'max-w-2xl'
    : size === 'xl'
    ? 'max-w-4xl'
    : 'max-w-lg';

  const bodyContent = (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 pr-3 sm:pr-4 space-y-3">
      {children}
    </div>
  );

  const footerContent = footer ? (
    <div className="shrink-0 px-4 py-3 sm:px-5 border-t border-line flex items-center justify-end gap-2">
      {footer}
    </div>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-150 ease-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-desc' : undefined}
    >
      <div
        className="fixed inset-0"
        onClick={() => onCloseRef.current?.()}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className={`relative w-full ${defaultMaxW} flex flex-col max-h-[calc(100vh-1rem)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-panel border border-line bg-panel text-1 shadow-popover z-10 ${className}`}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-3 border-b border-line shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
            <div className="min-w-0">
              {title && (
                typeof title === 'string' ? (
                  <h2 id="dialog-title" className="text-base font-semibold text-1 leading-snug break-words">
                    {title}
                  </h2>
                ) : (
                  <div id="dialog-title">{title}</div>
                )
              )}
              {description && (
                <p id="dialog-desc" className="text-xs text-2 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <IconButton
            icon={<X className="w-4 h-4" />}
            label="Tutup dialog"
            onClick={() => onCloseRef.current?.()}
            size="sm"
          />
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
            {bodyContent}
            {footerContent}
          </form>
        ) : (
          <>
            {bodyContent}
            {footerContent}
          </>
        )}
      </div>
    </div>
  );
}
