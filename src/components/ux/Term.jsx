import React, { useState, useEffect, useRef, useId } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Term component (src/components/ux/Term.jsx)
 * Per docs/UX_SPEC.md (Principles 4):
 * - Inline term with a short plain explanation
 * - Opens on hover, keyboard focus AND tap (not hover-only)
 * - aria-describedby links trigger to tooltip ID
 * - Escape closes and returns focus
 * - >= 44px tap area on touch (min-h-[44px] touch target)
 * - Indonesian, plain, no claims of false certainty
 *
 * @param {{
 *   term?: React.ReactNode,
 *   explanation: string,
 *   children?: React.ReactNode,
 *   className?: string
 * }} props
 */
export default function Term({
  term,
  explanation,
  children,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const rawId = useId();
  const tooltipId = `term-tooltip-${rawId.replace(/:/g, '')}`;

  const label = children || term;

  // Global escape and click-outside listeners when tooltip is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-baseline ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={handleToggle}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          // If focus moves outside the container, close
          if (!containerRef.current?.contains(e.relatedTarget)) {
            setIsOpen(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
        data-testid="term-trigger"
        className="group inline-flex items-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-1 sm:p-0 rounded-control cursor-help text-left font-inherit text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {label ? (
          <span className="underline decoration-dotted decoration-brand/70 underline-offset-4 group-hover:decoration-brand">
            {label}
          </span>
        ) : null}
        <HelpCircle
          className="w-3.5 h-3.5 text-2 group-hover:text-brand shrink-0 inline-block transition-colors"
          aria-hidden="true"
        />
        <span className="sr-only">
          {label ? `Penjelasan istilah ${typeof label === 'string' ? label : ''}` : 'Penjelasan istilah'}
        </span>
      </button>

      {/* Tooltip / Popover explanation */}
      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          data-testid="term-explanation"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 p-3 bg-panel border border-line rounded-control shadow-popover text-1 text-sm font-normal leading-relaxed z-50 animate-fadeIn pointer-events-auto"
        >
          {explanation}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-line"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
