import React from 'react';
import { landingCopy } from './landingCopy';

export default function FeatureGrid() {
  const copy = landingCopy.featureGrid;

  return (
    <section id="fitur-pendukung" className="py-12 sm:py-16 md:py-20 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl uppercase tracking-tight text-ink leading-tight">
            {copy.heading}
          </h2>
        </div>

        {/* 6 Supporting Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {copy.cards.map((card, index) => (
            <div
              key={card.title}
              className="bg-panel border-2 border-line rounded-panel p-6 flex flex-col justify-between hover:border-pitch/50 transition-colors shadow-xs"
            >
              <div>
                <span
                  className="font-display font-extrabold text-xl sm:text-2xl text-pitch/25 select-none block mb-2"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-ink uppercase tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-2 font-normal leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
