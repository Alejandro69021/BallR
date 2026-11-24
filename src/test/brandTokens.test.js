import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrandMark, Wordmark, PitchLines, JerseyTile, DataStamp } from '../components/brand';

/**
 * WCAG 2.1 relative luminance calculation
 */
function sRGBtoLinear(val) {
  const c = val / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Brand Tokens, CSS Specificity, and WCAG Contrast', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  it('(a) asserts 7 brand tokens exist and :root precedes data-surface blocks in src/index.css', () => {
    const brandTokens = [
      '--pitch',
      '--pitch-2',
      '--bib',
      '--chalk',
      '--ink',
      '--mint',
      '--mint-2',
    ];

    // Assert all 7 tokens exist in the css
    for (const token of brandTokens) {
      expect(cssContent).toContain(token);
    }

    // Specificity order check: :root must precede [data-surface="paper"] and [data-surface="dark"]
    const rootIndex = cssContent.indexOf(':root {');
    const paperIndex = cssContent.indexOf('[data-surface="paper"]');
    const darkIndex = cssContent.indexOf('[data-surface="dark"]');

    expect(rootIndex).toBeGreaterThan(-1);
    expect(paperIndex).toBeGreaterThan(-1);
    expect(darkIndex).toBeGreaterThan(-1);

    expect(rootIndex).toBeLessThan(paperIndex);
    expect(rootIndex).toBeLessThan(darkIndex);
  });

  it('(b) computes WCAG contrast for every pair in BRAND_SPEC section 3 and asserts >= 4.5', () => {
    const brandSpecPairs = [
      { label: 'Ink on Bib', text: '#10201A', bg: '#D2F23F' },
      { label: 'Pitch on Bib', text: '#0B3A2A', bg: '#D2F23F' },
      { label: 'Chalk on Pitch', text: '#F4F5EE', bg: '#0B3A2A' },
      { label: 'Bib on Pitch', text: '#D2F23F', bg: '#0B3A2A' },
      { label: 'Bib on Pitch-2', text: '#D2F23F', bg: '#0F4A35' },
      { label: 'Mint on Pitch', text: '#D5E6DC', bg: '#0B3A2A' },
      { label: 'Mint-2 on Pitch', text: '#BFD8CB', bg: '#0B3A2A' },
      { label: 'Secondary text on Chalk', text: '#3C4A42', bg: '#F4F5EE' },
      { label: 'Turf on Chalk', text: '#17744A', bg: '#F4F5EE' },
    ];

    for (const pair of brandSpecPairs) {
      const ratio = getContrastRatio(pair.text, pair.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }

    // Also assert that bib on chalk fails WCAG (< 4.5:1), confirming the hard rule
    const bibOnChalkRatio = getContrastRatio('#D2F23F', '#F4F5EE');
    expect(bibOnChalkRatio).toBeLessThan(4.5);

    // Verify that bib-on-chalk is NOT used anywhere as text colour in src/components/brand/
    const brandComponentsDir = path.resolve(__dirname, '../components/brand');
    const componentFiles = fs.readdirSync(brandComponentsDir);

    for (const file of componentFiles) {
      const filePath = path.join(brandComponentsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // bib text should not be used on chalk background
      expect(content).not.toMatch(/text-bib[\s\S]*?bg-chalk/);
      expect(content).not.toMatch(/bg-chalk[\s\S]*?text-bib/);
      expect(content).not.toMatch(/text-\[#D2F23F\]/i);
    }
  });

  it('(c) renders each brand component once and checks Wordmark has accessible name "ProspekBola"', () => {
    const { container: markContainer, unmount: unmountMark } = render(React.createElement(BrandMark, { 'data-testid': 'brand-mark' }));
    expect(markContainer.querySelector('svg')).toBeInTheDocument();
    unmountMark();

    const { unmount: unmountWordmark } = render(React.createElement(Wordmark, { 'data-testid': 'wordmark' }));
    const wordmarkEl = screen.getByRole('img', { name: 'ProspekBola' });
    expect(wordmarkEl).toBeInTheDocument();
    expect(wordmarkEl).toHaveAccessibleName('ProspekBola');
    unmountWordmark();

    const { container: linesContainer, unmount: unmountLines } = render(React.createElement(PitchLines, { 'data-testid': 'pitch-lines' }));
    expect(linesContainer.querySelector('svg')).toBeInTheDocument();
    unmountLines();

    const { unmount: unmountJersey } = render(React.createElement(JerseyTile, { number: 10, 'data-testid': 'jersey-tile' }));
    expect(screen.getByText('10')).toBeInTheDocument();
    unmountJersey();

    const { unmount: unmountStamp } = render(React.createElement(DataStamp, { 'data-testid': 'data-stamp' }));
    expect(screen.getByRole('img', { name: 'Data contoh fiktif' })).toBeInTheDocument();
    unmountStamp();
  });
});
