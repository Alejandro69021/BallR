import React from 'react';
import { ChevronDown } from 'lucide-react';
import { landingCopy } from './landingCopy';

export default function Faq() {
  const copy = landingCopy.faq;

  return (
    <section id="tanya" className="py-12 sm:py-16 md:py-20 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl uppercase tracking-tight text-ink leading-tight">
            {copy.heading}
          </h2>
        </div>

        {/* 5 Native <details>/<summary> Accordions */}
        <div className="max-w-3xl space-y-4">
          {copy.items.map((item) => (
            <details
              key={item.q}
              className="group border-2 border-line rounded-panel bg-panel overflow-hidden shadow-xs hover:border-pitch/40 transition-colors"
            >
              <summary className="cursor-pointer p-4 sm:p-5 flex items-center justify-between font-display font-bold text-lg sm:text-xl text-ink uppercase tracking-tight min-h-[44px] select-none hover:bg-raised/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch list-none">
                <span className="pr-4">{item.q}</span>
                <ChevronDown
                  className="w-5 h-5 text-2 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm sm:text-base text-2 font-normal leading-relaxed border-t border-line/60 pt-3">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
