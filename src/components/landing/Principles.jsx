import React from 'react';
import { PitchLines } from '../brand';
import { landingCopy } from './landingCopy';

export default function Principles() {
  const copy = landingCopy.principles;

  return (
    <section id="prinsip" className="py-16 sm:py-20 md:py-24 bg-pitch text-chalk relative overflow-hidden border-b-2 border-ink">
      {/* Background motif: PitchLines */}
      <PitchLines variant="penalty" opacity={0.12} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      <div className="relative z-10 max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-bib/50 bg-pitch-2/70 text-bib text-sm font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-bib" aria-hidden="true" />
            <span>Prinsip Kejujuran Data</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-chalk leading-tight">
            {copy.heading}
          </h2>
        </div>

        {/* 4 Cards Grid on Dark Pitch-2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {copy.cards.map((card, index) => (
            <div
              key={card.title}
              className="bg-pitch-2 border border-mint/20 rounded-panel p-6 sm:p-8 flex flex-col justify-between shadow-md hover:border-bib/40 transition-colors"
            >
              <div>
                <span
                  className="font-display font-extrabold text-xl sm:text-2xl text-bib/40 select-none block mb-2"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-bib uppercase tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-mint font-normal leading-relaxed">
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
