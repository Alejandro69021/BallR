import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PitchLines, DataStamp } from '../brand';
import BrowserFrame from './BrowserFrame';
import { landingCopy } from './landingCopy';

export default function Hero({ isDemoMode = false, onOpenAuthModal }) {
  const navigate = useNavigate();
  const copy = landingCopy.hero;

  const demoModeActive = Boolean(isDemoMode || import.meta.env.VITE_DEMO_MODE === 'true');
  const demoUrl = import.meta.env.VITE_DEMO_URL || '';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

  const handleDemoClick = () => {
    if (demoModeActive) {
      navigate('/beranda');
    }
  };

  return (
    <section id="hero" className="relative bg-pitch text-chalk overflow-hidden">
      {/* Background motif: PitchLines */}
      <PitchLines variant="center" opacity={0.12} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      {/* Main Hero Content */}
      <div data-testid="landing-container" className="relative z-10 max-w-[1160px] mx-auto w-full px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 flex flex-col items-center text-center">
        {/* Small Pill with Lime Border */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-bib/60 bg-pitch-2/70 text-bib text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-bib" aria-hidden="true" />
          <span>{copy.pill}</span>
        </div>

        {/* Single H1 with Barlow Condensed 800 & Tilted Lime "PASPOR" */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight leading-[0.95] max-w-4xl text-chalk">
          {copy.titlePrefix}
          <span className="inline-block -rotate-[1.5deg] bg-bib text-ink px-2.5 py-0.5 rounded-xs mx-1 sm:mx-1.5 align-middle">
            {copy.titleHighlight}
          </span>
          {copy.titleSuffix}
        </h1>

        {/* Narrative Paragraph */}
        <p className="mt-6 text-base sm:text-xl text-mint max-w-2xl font-normal leading-relaxed">
          {copy.paragraph}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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

          <a
            href="#fitur"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-control bg-pitch-2 text-chalk border border-mint/25 hover:border-mint/60 transition-colors font-medium text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint select-none"
          >
            {copy.ctaFeatures}
          </a>
        </div>

        {/* Three Small Notes */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-mint-2/90">
          {copy.notes.map((note, index) => (
            <React.Fragment key={note}>
              {index > 0 && <span aria-hidden="true" className="text-bib/60">·</span>}
              <span>{note}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Hero Screenshot Frame with Hard Lime Shadow and DataStamp */}
        <div className="mt-10 sm:mt-12 w-full max-w-4xl">
          <BrowserFrame
            src={copy.imageSrc}
            alt={copy.imageAlt}
            width={copy.imageWidth}
            height={copy.imageHeight}
            loading="eager"
            fetchPriority="high"
            hasHardShadow
            stampOverlay={<DataStamp text={copy.stampText} angle={-12} size="md" />}
          />
        </div>
      </div>

      {/* Full-width Lime Principles Strip (BRAND_SPEC bagian 5 & LANDING_SPEC bagian 4) */}
      <div className="w-full bg-bib text-ink py-3.5 px-4 overflow-hidden border-t-2 border-b-2 border-ink">
        <div className="max-w-[1160px] mx-auto flex flex-wrap items-center justify-around gap-x-6 gap-y-2 text-center font-display font-extrabold text-sm sm:text-base tracking-wide uppercase">
          {copy.principlesStrip.map((item, index) => (
            <React.Fragment key={item}>
              {index > 0 && <span className="hidden sm:inline opacity-40 select-none" aria-hidden="true">·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
