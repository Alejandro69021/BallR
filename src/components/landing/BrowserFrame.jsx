import React from 'react';

/**
 * Bingkai peramban/gawai sederhana (CSS decoration only)
 * Memuat label wajib "Data contoh fiktif" sesuai LANDING_SPEC bagian 2 & 5.
 */
export default function BrowserFrame({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  className = '',
  hasHardShadow = false,
  stampOverlay = null
}) {
  const frameContent = (
    <div className={`border-2 border-ink rounded-panel overflow-hidden bg-panel relative ${className}`}>
      {/* Browser Bar */}
      <div className="bg-raised border-b border-line px-3 py-2 flex items-center justify-between text-sm select-none">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full bg-line" />
          <div className="w-2.5 h-2.5 rounded-full bg-line" />
          <div className="w-2.5 h-2.5 rounded-full bg-line" />
        </div>
        <span className="font-mono text-sm tracking-wide text-2">Data contoh fiktif</span>
        <div className="w-8" aria-hidden="true" />
      </div>

      {/* Screenshot Container */}
      <div className="relative overflow-hidden bg-app">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          className="w-full h-auto block"
        />
        {stampOverlay && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none drop-shadow-md">
            {stampOverlay}
          </div>
        )}
      </div>
    </div>
  );

  if (hasHardShadow) {
    return (
      <div className="relative">
        {/* Hard offset lime shadow (tanpa blur, BRAND_SPEC bagian 5) */}
        <div
          className="absolute inset-0 bg-bib translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-panel"
          aria-hidden="true"
        />
        <div className="relative">{frameContent}</div>
      </div>
    );
  }

  return frameContent;
}

export function PhoneFrame({ src, alt, width, height, className = '' }) {
  return (
    <div className={`border-2 border-ink rounded-[20px] overflow-hidden bg-panel shadow-md ${className}`}>
      {/* Phone Notch Bar */}
      <div className="bg-raised border-b border-line px-3 py-1.5 flex items-center justify-between text-sm select-none">
        <span className="font-mono text-sm text-2">9:41</span>
        <div className="w-14 h-3 bg-ink/30 rounded-full" aria-hidden="true" />
        <span className="font-mono text-sm tracking-wide text-2">Fiktif</span>
      </div>
      <div className="relative overflow-hidden bg-app">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}
