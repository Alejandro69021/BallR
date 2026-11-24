import React from 'react';
import BrowserFrame, { PhoneFrame } from './BrowserFrame';
import { JerseyTile } from '../brand';
import { landingCopy } from './landingCopy';

export default function FeatureDive() {
  const copy = landingCopy.featureDive;

  return (
    <section id="fitur" className="py-12 sm:py-16 md:py-24 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-ink leading-tight">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-2 font-normal leading-relaxed">
            {copy.intro}
          </p>
        </div>

        {/* Three Deep-Dive Rows */}
        <div className="space-y-16 sm:space-y-24">
          {copy.items.map((item, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={item.num}
                className={`flex flex-col gap-8 lg:gap-12 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
                }`}
              >
                {/* Text Content */}
                <div className="w-full lg:w-1/2 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display font-extrabold text-4xl sm:text-5xl text-pitch/25 select-none"
                      aria-hidden="true"
                    >
                      {item.num}
                    </span>
                    <span className="font-display font-bold text-sm tracking-wider uppercase text-pitch bg-mint px-2.5 py-1 rounded-xs">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight text-ink leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-base sm:text-lg text-2 font-normal leading-relaxed">
                    {item.body}
                  </p>

                  <ul className="space-y-2 pt-2">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm sm:text-base text-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pitch mt-2 shrink-0" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot & Visuals */}
                <div className="w-full lg:w-1/2 relative">
                  {/* Row 1: Desktop + Overlay Mobile Frame */}
                  {item.mobileImage ? (
                    <div className="relative">
                      <BrowserFrame
                        src={item.desktopImage.src}
                        alt={item.desktopImage.alt}
                        width={item.desktopImage.width}
                        height={item.desktopImage.height}
                        loading="lazy"
                      />
                      <div className="hidden sm:block absolute -bottom-6 -right-4 w-44 z-20 shadow-xl">
                        <PhoneFrame
                          src={item.mobileImage.src}
                          alt={item.mobileImage.alt}
                          width={item.mobileImage.width}
                          height={item.mobileImage.height}
                        />
                      </div>
                    </div>
                  ) : item.num === '03' ? (
                    /* Row 3: Paspor with JerseyTile #10 Overlay */
                    <div className="relative">
                      <BrowserFrame
                        src={item.desktopImage.src}
                        alt={item.desktopImage.alt}
                        width={item.desktopImage.width}
                        height={item.desktopImage.height}
                        loading="lazy"
                        stampOverlay={<JerseyTile number={10} name="DIMAS" size="sm" />}
                      />
                    </div>
                  ) : (
                    /* Row 2: Standard Desktop Frame */
                    <BrowserFrame
                      src={item.desktopImage.src}
                      alt={item.desktopImage.alt}
                      width={item.desktopImage.width}
                      height={item.desktopImage.height}
                      loading="lazy"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
