import React from 'react';
import Button from '../ui/Button';
import MenuButton from './MenuButton';

/**
 * NextStepPanel component (src/components/ux/NextStepPanel.jsx)
 * Per docs/UX_SPEC.md:
 * - Soft-green panel
 * - Small label "LANGKAH BERIKUTNYA"
 * - Title
 * - One-sentence explanation
 * - ONE primary button (56px high, 18px bold)
 * - Optional secondary button
 * - MenuButton "Lainnya"
 *
 * @param {string} title
 * @param {string} description
 * @param {{ label: string, onClick: () => void, icon?: React.ReactNode }} primaryAction
 * @param {{ label: string, onClick: () => void, icon?: React.ReactNode }} [secondaryAction]
 * @param {Array<object>} [menuItems]
 * @param {React.ReactNode} [badge]
 * @param {string} [className]
 */
export default function NextStepPanel({
  title,
  description,
  primaryAction,
  secondaryAction,
  menuItems = [],
  badge,
  className = ''
}) {
  return (
    <div
      data-testid="next-step-panel"
      className={`p-5 sm:p-6 rounded-panel border border-brand/25 bg-accent-soft/30 shadow-xs space-y-4 ${className}`}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            LANGKAH BERIKUTNYA
          </span>
          {badge && <div>{badge}</div>}
        </div>

        <h2 className="text-xl font-bold text-1">{title}</h2>

        {description && (
          <p className="text-sm text-2 leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {primaryAction && (
          <Button
            variant="primary"
            size="lg"
            icon={primaryAction.icon}
            onClick={primaryAction.onClick}
            className="min-h-[56px] text-lg font-bold"
            data-testid="primary-next-step-action"
            data-tour={primaryAction['data-tour'] || primaryAction.dataTour}
          >
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button
            variant="secondary"
            size="md"
            icon={secondaryAction.icon}
            loading={secondaryAction.loading}
            onClick={secondaryAction.onClick}
            className="min-h-[44px]"
            data-testid="secondary-next-step-action"
            data-tour={secondaryAction['data-tour'] || secondaryAction.dataTour}
          >
            {secondaryAction.label}
          </Button>
        )}

        {menuItems && menuItems.length > 0 && (
          <MenuButton
            label="Lainnya"
            items={menuItems}
          />
        )}
      </div>
    </div>
  );
}
