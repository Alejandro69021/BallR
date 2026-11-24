import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../brand';
import { landingCopy } from './landingCopy';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingFooter() {
  const copy = landingCopy.footer;
  const publisherName = import.meta.env.VITE_PUBLISHER_NAME || 'ProspekBola';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';

  return (
    <footer id="kaki" className="w-full bg-pitch text-chalk border-t-2 border-ink py-10 sm:py-14">
      <div className="max-w-[1160px] mx-auto w-full px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bib"
            aria-label="ProspekBola Halaman Depan"
          >
            <Wordmark size="sm" variant="light" />
          </Link>
          <p className="max-w-md text-sm text-mint">
            {copy.note}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-mint/20 text-sm">
          {copy.links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-mint hover:text-chalk transition-colors min-h-[44px] flex items-center"
            >
              {link.label}
            </Link>
          ))}

          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="text-mint hover:text-chalk transition-colors min-h-[44px] flex items-center"
            >
              {copy.contactLabel}
            </a>
          ) : (
            <span className="text-mint-2 min-h-[44px] flex items-center">
              {copy.contactLabel}
            </span>
          )}
        </div>

        <div className="text-sm text-mint-2 pt-2">
          © {CURRENT_YEAR} {publisherName}{copy.copyrightSuffix}
        </div>
      </div>
    </footer>
  );
}
