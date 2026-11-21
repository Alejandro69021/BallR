import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function Field({
  label,
  id,
  error,
  helper,
  required = false,
  icon,
  children,
  className = '',
  ...inputProps
}) {
  const responsiveClass = 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';

  const renderContent = () => {
    if (children) {
      return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const childClass = child.props.className || '';
        return React.cloneElement(child, {
          className: `${responsiveClass} ${childClass}`.trim()
        });
      });
    }

    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-2">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`w-full ${icon ? 'pl-9' : 'px-3'} pr-3 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-[38px] bg-panel border ${
            error ? 'border-danger focus:ring-danger' : 'border-control focus:ring-brand'
          } rounded-control text-xs text-1 placeholder:text-2 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${responsiveClass}`}
          {...inputProps}
        />
      </div>
    );
  };

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

      {renderContent()}

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
