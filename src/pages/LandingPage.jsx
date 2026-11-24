import React from 'react';
import {
  LandingHeader,
  Hero,
  ProblemStrip,
  FeatureDive,
  FeatureGrid,
  Steps,
  Principles,
  StatusColumns,
  Faq,
  TrialCta,
  LandingFooter
} from '../components/landing';

export default function LandingPage({
  userRole = 'public',
  isDemoMode = false,
  onOpenAuthModal
}) {
  return (
    <div
      data-surface="paper"
      className="min-h-screen bg-chalk text-ink selection:bg-bib selection:text-ink flex flex-col justify-between"
    >
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-bib focus:text-ink focus:font-semibold focus:rounded-control focus:shadow-md focus:outline-none"
      >
        Lompat ke konten
      </a>

      {/* 1. Bilah Atas */}
      <LandingHeader
        userRole={userRole}
        isDemoMode={isDemoMode}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Main Landmark: Sections 2 to 10 */}
      <main id="main-content" className="flex-1">
        {/* 2. Hero (includes 4-principles lime strip) */}
        <Hero isDemoMode={isDemoMode} onOpenAuthModal={onOpenAuthModal} />

        {/* 3. Masalah */}
        <ProblemStrip />

        {/* 4. Fitur Utama (#fitur) */}
        <FeatureDive />

        {/* 5. Fitur Pendukung (#fitur-pendukung) */}
        <FeatureGrid />

        {/* 6. Cara Kerja (#cara-kerja) */}
        <Steps />

        {/* 7. Prinsip Data (#prinsip) */}
        <Principles />

        {/* 8. Status (#status) */}
        <StatusColumns />

        {/* 9. Tanya Jawab (#tanya) */}
        <Faq />

        {/* 10. Ajakan Uji Coba (#cta) */}
        <TrialCta isDemoMode={isDemoMode} onOpenAuthModal={onOpenAuthModal} />
      </main>

      {/* 11. Kaki (#kaki) */}
      <LandingFooter />
    </div>
  );
}
