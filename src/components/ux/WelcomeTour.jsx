import React, { useState, useEffect, useCallback } from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import CoachMark from './CoachMark';
import { isTourDone, setTourDone } from '../../lib/tourStorage';
import { TOUR_STEPS } from '../../lib/tourSteps';

export { TOUR_STEPS };

export default function WelcomeTour({ forceStart = false, onTourComplete }) {
  const [hasCompletedTour, setHasCompletedTour] = useState(() => isTourDone());
  const [isTourActive, setIsTourActive] = useState(() => Boolean(forceStart));
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Sync state if forceStart prop changes (e.g. from Bantuan "Ulangi tur")
  useEffect(() => {
    if (forceStart) {
      const raf = requestAnimationFrame(() => {
        setIsTourActive(true);
        setCurrentStepIdx(0);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [forceStart]);

  // Helper to find the next valid step index with a present anchor
  const findNextValidStepIndex = useCallback((fromIndex) => {
    if (typeof document === 'undefined') return -1;
    for (let i = fromIndex; i < TOUR_STEPS.length; i++) {
      const step = TOUR_STEPS[i];
      if (document.querySelector(step.anchor)) {
        return i;
      }
    }
    return -1;
  }, []);

  const handleStartTour = () => {
    const firstValid = findNextValidStepIndex(0);
    if (firstValid !== -1) {
      setCurrentStepIdx(firstValid);
      setIsTourActive(true);
    } else {
      // No anchors found at all on this view, mark completed
      setTourDone();
      setHasCompletedTour(true);
      onTourComplete?.();
    }
  };

  const handleSkipTour = () => {
    setTourDone();
    setHasCompletedTour(true);
    setIsTourActive(false);
    onTourComplete?.();
  };

  const handleNextStep = () => {
    const nextIdx = findNextValidStepIndex(currentStepIdx + 1);
    if (nextIdx !== -1) {
      setCurrentStepIdx(nextIdx);
    } else {
      // Reached the end of available steps
      handleSkipTour();
    }
  };

  const handleAnchorMissing = (_missingStep) => {
    // If the active step anchor is missing, immediately try to skip forward
    const nextIdx = findNextValidStepIndex(currentStepIdx + 1);
    if (nextIdx !== -1) {
      setCurrentStepIdx(nextIdx);
    } else {
      handleSkipTour();
    }
  };

  const currentStep = TOUR_STEPS[currentStepIdx];
  const isLastStep =
    currentStepIdx === TOUR_STEPS.length - 1 ||
    findNextValidStepIndex(currentStepIdx + 1) === -1;

  return (
    <>
      {/* 1. First-run Banner (shown only when tour is not completed and not currently running) */}
      {!hasCompletedTour && !isTourActive && (
        <aside
          role="region"
          aria-label="Pengenalan fitur aplikasi"
          data-testid="welcome-tour-banner"
          className="print:hidden border border-brand/25 bg-accent-soft/30 rounded-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs mb-6"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand text-app flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-1">
                Pertama kali di sini?
              </h2>
              <p className="text-sm text-2 leading-relaxed max-w-2xl">
                Ikuti tur singkat 4 langkah, sekitar 2 menit. Kamu bisa menutupnya kapan saja dan membukanya lagi dari menu Bantuan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSkipTour}
              className="min-h-[44px] text-sm"
              data-testid="skip-tour-banner-btn"
            >
              Lewati
            </Button>
            <Button
              variant="brand"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleStartTour}
              className="min-h-[44px] text-sm font-semibold"
              data-testid="start-tour-banner-btn"
            >
              Mulai tur
            </Button>
          </div>
        </aside>
      )}

      {/* 2. Active CoachMark Popover */}
      {isTourActive && currentStep && (
        <CoachMark
          key={currentStep.id}
          step={currentStep}
          onNext={handleNextStep}
          onSkip={handleSkipTour}
          onClose={handleSkipTour}
          onAnchorMissing={handleAnchorMissing}
          isLastStep={isLastStep}
        />
      )}
    </>
  );
}
