import React from 'react';

/**
 * PageHeader (ProspekBola Brand Spec Section 4 & 6)
 * Consistent page title shell across main application views.
 *
 * @param {string} [kicker] Small category or context label
 * @param {string} title Page title (Barlow Condensed 800 uppercase, max 6 words)
 * @param {React.ReactNode} [actions] Optional action button slot on the right
 * @param {string} [className]
 */
export default function PageHeader({ kicker, title, actions, className = '' }) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line select-none ${className}`}>
      <div className="space-y-1">
        {kicker && (
          <p className="text-sm uppercase tracking-wider font-semibold text-2">
            {kicker}
          </p>
        )}
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-1 uppercase tracking-tight leading-none">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
}
