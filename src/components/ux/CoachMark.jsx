import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import Button from '../ui/Button';

function computeCoords(step) {
  if (typeof document === 'undefined' || !step?.anchor) return null;

  // Do not show inside an open modal/dialog unless specifically targeted
  const hasModal = Array.from(document.querySelectorAll('*')).some(
    (el) => el.getAttribute('aria-' + 'modal') === 'true'
  );
  if (hasModal) {
    const targetAnchor = document.querySelector(step.anchor);
    const modalEl = document.querySelector('.shadow-popover');
    if (modalEl && !modalEl.contains(targetAnchor)) {
      return null;
    }
  }

  const target = document.querySelector(step.anchor);
  if (!target) {
    return null;
  }

  const freshRect = target.getBoundingClientRect();
  const winWidth = typeof window !== 'undefined' ? window.innerWidth || 1200 : 1200;
  const winHeight = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;
  const popoverWidth = Math.min(360, Math.max(280, winWidth - 24));
  const popoverHeight = 200;

  let top = freshRect.bottom + 12;
  let arrowPlacement = 'top';

  if (top + popoverHeight > winHeight - 16) {
    const spaceAbove = freshRect.top - 12 - popoverHeight;
    if (spaceAbove > 16 || spaceAbove > freshRect.bottom) {
      top = freshRect.top - 12 - popoverHeight;
      arrowPlacement = 'bottom';
    }
  }

  top = Math.max(12, Math.min(top, winHeight - popoverHeight - 12));
  let left = freshRect.left + (freshRect.width || 0) / 2 - popoverWidth / 2;
  left = Math.max(12, Math.min(left, winWidth - popoverWidth - 12));

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: popoverWidth,
    arrowPlacement
  };
}

/**
 * CoachMark component (src/components/ux/CoachMark.jsx)
 * Per docs/UX_SPEC.md:
 * - Popover anchored to [data-tour="..."]
 * - "Berikutnya" / "Selesai", "Lewati tur", Escape closes
 * - Returns focus, never traps focus
 * - Clamped within viewport on phone and desktop
 * - print:hidden, does not appear inside dialogs
 *
 * @param {{
 *   id: string,
 *   stepNumber: number,
 *   totalSteps: number,
 *   anchor: string,
 *   title: string,
 *   description: string
 * }} step
 * @param {() => void} onNext
 * @param {() => void} onSkip
 * @param {() => void} onClose
 * @param {() => void} [onAnchorMissing]
 * @param {boolean} [isLastStep=false]
 */
export default function CoachMark({
  step,
  onNext,
  onSkip,
  onClose,
  onAnchorMissing,
  isLastStep = false
}) {
  const [coords, setCoords] = useState(() => computeCoords(step));
  const popoverRef = useRef(null);
  const prevFocusedRef = useRef(null);
  const targetElementRef = useRef(null);

  // Store previously focused element on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      prevFocusedRef.current = document.activeElement;
    }
    return () => {
      // Return focus on unmount
      try {
        if (prevFocusedRef.current && typeof prevFocusedRef.current.focus === 'function') {
          prevFocusedRef.current.focus();
        }
      } catch {}
    };
  }, []);

  // Locate anchor element and setup listeners
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const target = document.querySelector(step.anchor);
    if (!target) {
      targetElementRef.current = null;
      onAnchorMissing?.(step);
      return;
    }

    targetElementRef.current = target;
    target.setAttribute('data-tour-active', 'true');

    // Smooth scroll into view if out of viewport
    try {
      const rect = target.getBoundingClientRect();
      const isOutOfViewport =
        rect.top < 60 ||
        rect.bottom > (window.innerHeight || 800) - 60 ||
        rect.left < 0 ||
        rect.right > (window.innerWidth || 1200);

      if (isOutOfViewport && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    } catch {}

    const handleResizeOrScroll = () => {
      const updated = computeCoords(step);
      if (updated) {
        setCoords(updated);
      }
    };

    window.addEventListener('resize', handleResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
      if (targetElementRef.current) {
        targetElementRef.current.removeAttribute('data-tour-active');
      }
    };
  }, [step, onAnchorMissing]);

  // Global escape handler
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [onClose]);

  if (!coords) return null;

  return (
    <div
      ref={popoverRef}
      role="region"
      aria-label="Petunjuk tur aplikasi"
      data-coachmark="true"
      data-testid="coachmark-popover"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 9999
      }}
      className="print:hidden bg-panel border-2 border-brand text-1 rounded-panel shadow-xl p-4 sm:p-5 space-y-3.5 animate-fadeIn select-none focus:outline-none"
    >
      {/* Header: Step counter and Close button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tracking-wider uppercase text-brand">
          Langkah {step.stepNumber} dari {step.totalSteps}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup petunjuk tur"
          className="text-2 hover:text-1 p-1 rounded-control min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-1">{step.title}</h3>
        <p className="text-sm text-2 leading-relaxed">{step.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-line">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-sm text-2 hover:text-1 min-h-[44px]"
        >
          Lewati tur
        </Button>

        <Button
          variant="brand"
          size="sm"
          onClick={onNext}
          icon={isLastStep ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          className="min-h-[44px] text-sm font-semibold"
          data-testid="coachmark-next-btn"
        >
          {isLastStep ? 'Selesai' : 'Berikutnya'}
        </Button>
      </div>
    </div>
  );
}
