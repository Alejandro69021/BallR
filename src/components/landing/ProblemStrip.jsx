import React from 'react';
import { landingCopy } from './landingCopy';

export default function ProblemStrip() {
  const copy = landingCopy.problem;

  return (
    <section id="masalah" className="py-12 sm:py-16 md:py-20 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl uppercase tracking-tight text-ink leading-tight">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-2 font-normal leading-relaxed">
            {copy.intro}
          </p>
        </div>

        {/* Three Cards Grid */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.cards.map((card, index) => (
            <div
              key={card.title}
              className="bg-panel border-2 border-line rounded-panel p-6 flex flex-col justify-between hover:border-pitch/50 transition-colors shadow-xs"
            >
              <div>
                <span className="font-display font-extrabold text-2xl sm:text-3xl text-pitch/30 select-none block mb-2" aria-hidden="true">
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
