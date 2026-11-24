import React from 'react';
import { landingCopy } from './landingCopy';

export default function StatusColumns() {
  const copy = landingCopy.status;

  return (
    <section id="status" className="py-12 sm:py-16 md:py-20 bg-chalk text-ink border-b border-line">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl uppercase tracking-tight text-ink leading-tight">
            {copy.heading}
          </h2>
        </div>

        {/* 3 Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.columns.map((col, index) => {
            const isToday = index === 0;
            const isPreparing = index === 1;

            const badgeClasses = isToday
              ? 'bg-pitch text-chalk'
              : isPreparing
              ? 'bg-warn-bg text-warn-ink border border-warn-ink/30'
              : 'bg-raised text-2 border border-line';

            return (
              <div
                key={col.title}
                className="bg-panel border-2 border-line rounded-panel p-6 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-control text-sm font-semibold ${badgeClasses}`}>
                      {col.badge}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm sm:text-base text-1 leading-snug">
                        {isToday ? (
                          <span className="w-2 h-2 rounded-full bg-pitch mt-1.5 shrink-0" aria-hidden="true" />
                        ) : isPreparing ? (
                          <span className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-line mt-1.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
