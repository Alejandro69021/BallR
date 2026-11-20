import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Field({
  label,
  id,
  error,
  helper,
  required = false,
  children,
  className = ''
}) {
  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-2"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-danger flex items-center gap-1 mt-1 leading-snug"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p
          id={`${id}-helper`}
          className="text-xs text-2 mt-1"
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}
