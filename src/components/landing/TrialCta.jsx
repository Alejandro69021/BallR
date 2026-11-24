import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PitchLines } from '../brand';
import { landingCopy } from './landingCopy';

export default function TrialCta({ isDemoMode = false, onOpenAuthModal }) {
  const navigate = useNavigate();
  const copy = landingCopy.cta;

  const demoModeActive = Boolean(isDemoMode || import.meta.env.VITE_DEMO_MODE === 'true');
  const demoUrl = import.meta.env.VITE_DEMO_URL || '';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

  const handleDemoClick = () => {
    if (demoModeActive) {
      navigate('/beranda');
    }
  };

  return (
    <section id="cta" className="py-12 sm:py-16 md:py-24 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* CTA Card in Dark Pitch with PitchLines and Bib Lime Accents */}
        <div className="relative bg-pitch text-chalk rounded-panel border-2 border-ink p-8 sm:p-12 md:p-16 overflow-hidden shadow-lg">
          <PitchLines variant="penalty" opacity={0.14} className="pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-chalk leading-tight">
              {copy.heading}
            </h2>

            <p className="mt-4 text-base sm:text-lg text-mint font-normal leading-relaxed">
              {copy.desc}
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {demoModeActive ? (
                <button
                  type="button"
                  onClick={handleDemoClick}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bib select-none"
                >
                  {copy.ctaDemo}
                </button>
              ) : demoUrl ? (
                <a
                  href={demoUrl}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bib select-none"
                >
                  {copy.ctaDemo}
                </a>
              ) : contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bib select-none"
                >
                  {copy.ctaDemo}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.('home')}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-bib text-ink font-semibold text-base hover:opacity-90 active:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bib select-none"
                >
                  {copy.ctaDemo}
                </button>
              )}

              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-pitch-2 text-chalk border border-mint/25 hover:border-mint/60 transition-colors font-medium text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint select-none"
                >
                  {copy.contactPrefix}
                  <span className="font-mono text-sm ml-1">{contactEmail}</span>
                </a>
              ) : (
                <span className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-pitch-2 text-mint-2 font-medium text-sm border border-mint/15">
                  {copy.contactFallback}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
