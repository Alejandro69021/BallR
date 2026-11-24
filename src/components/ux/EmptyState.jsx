import React from 'react';
import { Database } from 'lucide-react';
import Button from '../ui/Button';
import { BrandMark } from '../brand';

/**
 * EmptyState component (src/components/ux/EmptyState.jsx)
 * Per docs/UX_SPEC.md:
 * - Icon, title, one-sentence purpose, ONE primary button.
 *
 * @param {React.ReactNode} [icon]
 * @param {string} title
 * @param {string} description
 * @param {string} [actionLabel]
 * @param {() => void} [onAction]
 * @param {React.ReactNode} [action] Optional custom action element
 * @param {string} [className]
 */
export default function EmptyState({
  icon,
  title = 'Belum ada data',
  description,
  actionLabel,
  onAction,
  action,
  className = ''
}) {
  return (
    <div
      className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 bg-panel border border-line rounded-panel select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-accent-soft/40 text-brand flex items-center justify-center shrink-0">
        {icon || <BrandMark size={28} aria-hidden="true" />}
      </div>

      <h3 className="text-lg font-semibold text-1">{title}</h3>

      {description && (
        <p className="text-sm text-2 max-w-md leading-relaxed">{description}</p>
      )}

      {action ? (
        <div className="pt-2">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onAction}
            className="w-full sm:w-auto min-h-[56px] text-lg font-bold"
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
