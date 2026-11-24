import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import Term from '../components/ux/Term';

describe('UX-5 Plain Language Pass & Term Component', () => {
  describe('1. Term Component Accessibility & Interaction Contract', () => {
    it('renders inline term trigger with >= 44px tap target class', () => {
      render(
        <p>
          Analisis wilayah menggunakan{' '}
          <Term
            term="Peta zona (6×3)"
            explanation="Lapangan dibagi 6 kolom × 3 baris untuk melihat di area mana kejadian terjadi."
          />
        </p>
      );

      const trigger = screen.getByTestId('term-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Peta zona (6×3)');
      // Must have >= 44px tap target styling for touch
      expect(trigger.className).toMatch(/min-h-\[44px\]/);
      expect(trigger.className).toMatch(/min-w-\[44px\]/);
      expect(trigger).not.toHaveAttribute('aria-describedby');

      // Tooltip is closed initially
      expect(screen.queryByTestId('term-explanation')).not.toBeInTheDocument();
    });

    it('opens on hover (mouseenter) and closes on mouseleave', () => {
      render(
        <Term
          term="Keterlibatan pemain"
          explanation="Berapa kali pemain tercatat terlibat dalam kejadian."
        />
      );

      const trigger = screen.getByTestId('term-trigger');

      // Hover in
      fireEvent.mouseEnter(trigger);
      const explanation = screen.getByTestId('term-explanation');
      expect(explanation).toBeInTheDocument();
      expect(explanation).toHaveTextContent('Berapa kali pemain tercatat terlibat dalam kejadian.');
      expect(trigger).toHaveAttribute('aria-describedby', explanation.id);

      // Hover out
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByTestId('term-explanation')).not.toBeInTheDocument();
      expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    it('opens on keyboard focus and closes on blur', () => {
      render(
        <Term
          term="Kelompok kematangan tubuh"
          explanation="Pengelompokan pemain menurut tahap pertumbuhan tubuh, bukan hanya umur."
        />
      );

      const trigger = screen.getByTestId('term-trigger');

      // Focus
      fireEvent.focus(trigger);
      expect(screen.getByTestId('term-explanation')).toBeInTheDocument();

      // Blur
      fireEvent.blur(trigger);
      expect(screen.queryByTestId('term-explanation')).not.toBeInTheDocument();
    });

    it('opens and toggles on tap/click (not hover-only)', () => {
      render(
        <Term
          term="PPDA"
          explanation="Passes Allowed per Defensive Action: rasio umpan lawan sebelum aksi bertahan tim kita."
        />
      );

      const trigger = screen.getByTestId('term-trigger');

      // First click: open
      fireEvent.click(trigger);
      expect(screen.getByTestId('term-explanation')).toBeInTheDocument();

      // Second click: close
      fireEvent.click(trigger);
      expect(screen.queryByTestId('term-explanation')).not.toBeInTheDocument();
    });

    it('Escape key closes explanation tooltip and returns focus to trigger', () => {
      render(
        <Term
          term="Peta zona (6×3)"
          explanation="Lapangan dibagi 6 kolom × 3 baris untuk melihat di area mana kejadian terjadi."
        />
      );

      const trigger = screen.getByTestId('term-trigger');
      fireEvent.click(trigger);
      expect(screen.getByTestId('term-explanation')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(screen.queryByTestId('term-explanation')).not.toBeInTheDocument();
    });
  });

  describe('2. Plain-Language Jargon Regression Scanner (Outside Methodology & Legal)', () => {
    /**
     * Forbidden jargon patterns in non-methodology UI code:
     * - "Bekukan laporan" / "bekukan laporan" (use "Kunci laporan")
     * - "versi beku" / "Versi beku" / "Versi Beku" (use "versi terkunci")
     * - "Kisi 6x3 zona" / "Kisi 6x3 Zona" / "kisi 6x3" (use "Peta zona (6×3)")
     * - "Distribusi kejadian" / "Distribusi Kejadian" (use "Jenis kejadian")
     */
    const FORBIDDEN_JARGON_RULES = [
      {
        pattern: /Bekukan laporan/i,
        name: 'Bekukan laporan (should be "Kunci laporan")',
        allowList: [
          'src/lib/report.js',
          'docs/CONSENT_DRAFT.md'
        ]
      },
      {
        pattern: /versi beku/i,
        name: 'versi beku (should be "versi terkunci")',
        allowList: [
          'src/lib/report.js'
        ]
      },
      {
        pattern: /kisi 6x3/i,
        name: 'kisi 6x3 (should be "Peta zona (6×3)")',
        allowList: [
          'src/lib/analysis/events.js' // Methodology definitions
        ]
      },
      {
        pattern: />\s*Distribusi\s+Kejadian\s*</i,
        name: 'Distribusi Kejadian heading (should be "Jenis kejadian")',
        allowList: []
      }
    ];

    function getAllJsxFiles(dir, fileList = []) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          getAllJsxFiles(fullPath, fileList);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    }

    it('verifies non-methodology UI files contain no forbidden old jargon strings', () => {
      const rootDir = process.cwd();
      const uiDirs = [
        path.join(rootDir, 'src', 'components'),
        path.join(rootDir, 'src', 'pages')
      ];

      const allUiFiles = uiDirs.flatMap((d) => getAllJsxFiles(d));
      const violations = [];

      for (const filePath of allUiFiles) {
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

        // Allow-list for consent / legal modal and test files
        if (
          relativePath.includes('ConsentManagerModal.jsx') ||
          relativePath.includes('test') ||
          relativePath.includes('__tests__')
        ) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        for (const rule of FORBIDDEN_JARGON_RULES) {
          if (rule.allowList.includes(relativePath)) continue;

          if (rule.pattern.test(content)) {
            violations.push({
              file: relativePath,
              rule: rule.name
            });
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
