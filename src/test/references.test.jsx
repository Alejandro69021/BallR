import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { REFERENCES_REGISTRY, assertValidReference, getReferenceById } from '../data/references';
import TacticalGuidance from '../components/references/TacticalGuidance';
import GrowthAdvice from '../components/references/GrowthAdvice';
import BenchmarkNote from '../components/references/BenchmarkNote';
import RefChip from '../components/ui/RefChip';

describe('Credible Reference Enforcement & Registry Verification', () => {
  describe('Registry matches docs/REFERENCES_SEED.md exactly', () => {
    it('contains exactly 18 seeded entries with expected IDs', () => {
      expect(REFERENCES_REGISTRY).toHaveLength(18);

      const expectedIds = [
        'pssi-kurikulum-filanesia',
        'fifa-tcp-spiralling-up',
        'fifa-tcp-scales-of-the-game',
        'fifa-grassroots-general-principles',
        'fifa-grassroots-play-practice-play',
        'fifa-grassroots-progressive-12-15',
        'biobanding-review',
        'sweeney-2023-maturation-position',
        'hill-2020-relative-age-maturation',
        'somatic-maturity-method-comparison',
        'khamis-roche-1994',
        'vaep-decroos-2019',
        'socceraction-docs',
        'fifa-epts-data-format',
        'cdf-2025',
        'uu-pdp-27-2022-pasal-25',
        'pp-33-2026',
        'trainor-ppda-2014'
      ];

      expectedIds.forEach((id) => {
        const found = getReferenceById(id);
        expect(found, `Expected reference ${id} to exist in registry`).toBeDefined();
        expect(found.id).toBe(id);
      });
    });

    it('has empty verified_on and unverified/located status per field notes', () => {
      REFERENCES_REGISTRY.forEach((entry) => {
        expect(entry.verified_on).toBe('');
        expect(['located', 'unverified']).toContain(entry.status);
      });
    });
  });

  describe('assertValidReference pure rule', () => {
    it('throws error when referenceIds is undefined, empty, or whitespace', () => {
      expect(() => assertValidReference()).toThrow(/Pelanggaran Prinsip Data Honesty/i);
      expect(() => assertValidReference([])).toThrow(/Pelanggaran Prinsip Data Honesty/i);
      expect(() => assertValidReference('')).toThrow(/Pelanggaran Prinsip Data Honesty/i);
      expect(() => assertValidReference(['', '  '])).toThrow(/Pelanggaran Prinsip Data Honesty/i);
    });

    it('throws error when reference ID is not in registry', () => {
      expect(() => assertValidReference('unknown-bogus-reference')).toThrow(/tidak ditemukan dalam registry/i);
    });

    it('passes when valid referenceIds from registry are supplied', () => {
      expect(assertValidReference('pssi-kurikulum-filanesia')).toBe(true);
      expect(assertValidReference(['pssi-kurikulum-filanesia', 'fifa-tcp-spiralling-up'])).toBe(true);
    });
  });

  describe('Guidance Components Mandatory Reference Prop Enforcement', () => {
    it('TacticalGuidance throws error and fails render if referenceIds prop is omitted or empty', () => {
      expect(() => {
        render(<TacticalGuidance title="Taktik Menyerang" guidanceText="Harus oper ke depan" />);
      }).toThrow(/Pelanggaran Prinsip Data Honesty/i);

      expect(() => {
        render(<TacticalGuidance title="Taktik Menyerang" guidanceText="Oper ke depan" referenceIds={[]} />);
      }).toThrow(/Pelanggaran Prinsip Data Honesty/i);
    });

    it('TacticalGuidance renders successfully when referenceIds is provided', () => {
      render(
        <TacticalGuidance
          title="Sirkulasi Bola Tengah"
          guidanceText="Manfaatkan keunggulan jumlah di lini tengah untuk memprogresi bola."
          referenceIds={['pssi-kurikulum-filanesia']}
        />
      );

      expect(screen.getByText(/Sirkulasi Bola Tengah/i)).toBeInTheDocument();
      expect(screen.getByText(/Manfaatkan keunggulan jumlah/i)).toBeInTheDocument();
    });

    it('GrowthAdvice throws error if referenceIds prop is missing', () => {
      expect(() => {
        render(<GrowthAdvice advisoryText="Kurangi beban plyometrik selama lonjakan tinggi." />);
      }).toThrow(/Pelanggaran Prinsip Data Honesty/i);
    });

    it('GrowthAdvice renders successfully when referenceIds is provided', () => {
      render(
        <GrowthAdvice
          advisoryText="Kurangi beban plyometrik selama lonjakan tinggi."
          stage="Circa-PHV"
          referenceIds={['khamis-roche-1994']}
        />
      );

      expect(screen.getByText(/Anjuran Pertumbuhan Biologis/i)).toBeInTheDocument();
      expect(screen.getByText(/Kurangi beban plyometrik/i)).toBeInTheDocument();
    });

    it('BenchmarkNote throws error if referenceIds is missing', () => {
      expect(() => {
        render(<BenchmarkNote metricName="Sprint 20m" benchmarkValue="3.65s" />);
      }).toThrow(/Pelanggaran Prinsip Data Honesty/i);
    });

    it('BenchmarkNote renders successfully when referenceIds is provided', () => {
      render(
        <BenchmarkNote
          metricName="Sprint 20m"
          benchmarkValue="3.65s"
          sampleSize={18}
          referenceIds={['sweeney-2023-maturation-position']}
        />
      );

      expect(screen.getByText(/Sprint 20m:/i)).toBeInTheDocument();
      expect(screen.getByText(/3.65s/i)).toBeInTheDocument();
      expect(screen.getByText(/\(n=18\)/i)).toBeInTheDocument();
    });
  });

  describe('RefChip interactive modal', () => {
    it('renders citation chip and opens modal with full reference citation on click', () => {
      render(<RefChip referenceId="pssi-kurikulum-filanesia" customLabel="Filanesia" />);

      const chipButton = screen.getByRole('button', { name: /Filanesia/i });
      expect(chipButton).toBeInTheDocument();

      fireEvent.click(chipButton);

      expect(screen.getByText(/Rujukan Dokumen/i)).toBeInTheDocument();
      expect(screen.getByText(/Kurikulum Pembinaan Sepak Bola Indonesia/i)).toBeInTheDocument();
      expect(screen.getByText(/Tutup/i)).toBeInTheDocument();
    });
  });
});
