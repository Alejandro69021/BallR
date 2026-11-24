import React from 'react';
import { Check } from 'lucide-react';
import { MATCH_STAGES } from '../../lib/matches';

/**
 * StageStepper component
 * Shows progress across match workflow stages.
 * Per docs/UX_SPEC.md:
 * - Desktop: ordered list <ol> with aria-current="step" on active item.
 *   States: done (check, accent-soft), current (accent filled number, bold), todo (outline).
 * - Phone compact variant: "Langkah X dari Y: Label" + 4-segment visual bar.
 *
 * @param {Array<{id: string, label: string}>} [steps=MATCH_STAGES]
 * @param {number} currentStep 1-indexed (e.g. 1, 2, 3, 4)
 * @param {boolean} [compact] Force compact variant if true, otherwise auto-compact on < sm breakpoint
 * @param {string} [className]
 */
export default function StageStepper({
  steps = MATCH_STAGES,
  currentStep = 2,
  compact = false,
  className = ''
}) {
  const total = steps.length;
  const clampedStep = Math.max(1, Math.min(total, currentStep));
  const currentStepData = steps[clampedStep - 1] || steps[0];

  return (
    <div className={`w-full ${className}`}>
      {/* Phone Compact Variant (always shown if compact=true, or < sm if compact=false) */}
      <div className={compact ? 'block' : 'block sm:hidden'}>
        <div className="flex items-center justify-between text-sm text-2 mb-1.5">
          <span className="font-semibold text-1">
            Langkah {clampedStep} dari {total}: {currentStepData.label}
          </span>
          <span className="text-2 tabular-nums">
            {Math.round((clampedStep / total) * 100)}%
          </span>
        </div>
        {/* 4-segment progress bar */}
        <div className="grid grid-cols-4 gap-1.5 w-full" aria-hidden="true">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isFilled = stepNum <= clampedStep;
            return (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-colors duration-150 ${
                  isFilled ? 'bg-brand' : 'bg-line'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop / Tablet Ordered Stepper (hidden on phone unless compact is disabled) */}
      <nav aria-label="Alur tahapan laga" className={compact ? 'hidden' : 'hidden sm:block'}>
        <ol className="flex items-center w-full list-none p-0 m-0">
          {steps.map((step, idx) => {
            const stepNumber = idx + 1;
            const isDone = stepNumber < clampedStep;
            const isCurrent = stepNumber === clampedStep;
            const isLast = idx === total - 1;

            return (
              <li
                key={step.id}
                className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex items-center gap-2 select-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors shrink-0 ${
                      isDone
                        ? 'bg-accent-soft text-brand font-semibold'
                        : isCurrent
                        ? 'bg-brand text-app font-bold shadow-xs'
                        : 'border border-line bg-panel text-2'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'font-bold text-1'
                        : isDone
                        ? 'font-medium text-1'
                        : 'text-2'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-colors ${
                      stepNumber < clampedStep ? 'bg-brand' : 'bg-line'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
