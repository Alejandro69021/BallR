import { describe, it, expect } from 'vitest';

/**
 * Calculates WCAG 2.1 Relative Luminance for an sRGB hex code.
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const [rl, gl, bl] = [r, g, b].map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Calculates WCAG Contrast Ratio between two hex colors.
 */
function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design System WCAG Contrast Verification (docs/DESIGN.md)', () => {
  const tokens = {
    darkBg: '#0B0F14',
    darkSurface: '#11161D',
    darkRaised: '#1A212B',
    darkLine: '#2C3643',
    darkBorderControl: '#64748B',
    darkText1: '#E8ECF1',
    darkText2: '#9AA6B5',
    brandDark: '#4FB286',

    paperBg: '#F6F4EF',
    paperSurface: '#FFFFFF',
    paperLine: '#DAD6CC',
    paperBorderControl: '#788594',
    paperText1: '#14181F',
    paperText2: '#4A5360',
    brandPaper: '#2E7D5B',

    semanticWarningDark: '#C98A1B',
    semanticWarningPaper: '#8A5B00',
    semanticDangerDark: '#E06D66',
    semanticDangerPaper: '#C2453D',

    seriesDark: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7'],
    seriesPaper: ['#0072B2', '#9E5B00', '#007A59', '#B34700', '#9C4472']
  };

  describe('1. Text Pairs Contrast (WCAG AA >= 4.5:1)', () => {
    const textPairs = [
      { name: 'Dark bg & text-1', c1: tokens.darkBg, c2: tokens.darkText1 },
      { name: 'Dark bg & text-2', c1: tokens.darkBg, c2: tokens.darkText2 },
      { name: 'Dark surface & text-1', c1: tokens.darkSurface, c2: tokens.darkText1 },
      { name: 'Dark surface & text-2', c1: tokens.darkSurface, c2: tokens.darkText2 },
      { name: 'Dark raised & text-1', c1: tokens.darkRaised, c2: tokens.darkText1 },
      { name: 'Dark raised & text-2', c1: tokens.darkRaised, c2: tokens.darkText2 },
      { name: 'Dark bg & brand-dark', c1: tokens.darkBg, c2: tokens.brandDark },
      { name: 'Dark surface & brand-dark', c1: tokens.darkSurface, c2: tokens.brandDark },
      { name: 'Dark bg & warning-dark', c1: tokens.darkBg, c2: tokens.semanticWarningDark },
      { name: 'Dark bg & danger-dark', c1: tokens.darkBg, c2: tokens.semanticDangerDark },
      { name: 'Dark surface & danger-dark', c1: tokens.darkSurface, c2: tokens.semanticDangerDark },

      { name: 'Paper bg & text-1', c1: tokens.paperBg, c2: tokens.paperText1 },
      { name: 'Paper bg & text-2', c1: tokens.paperBg, c2: tokens.paperText2 },
      { name: 'Paper surface & text-1', c1: tokens.paperSurface, c2: tokens.paperText1 },
      { name: 'Paper surface & text-2', c1: tokens.paperSurface, c2: tokens.paperText2 },
      { name: 'Paper bg & brand-paper', c1: tokens.paperBg, c2: tokens.brandPaper },
      { name: 'Paper surface & brand-paper', c1: tokens.paperSurface, c2: tokens.brandPaper },
      { name: 'Paper bg & warning-paper', c1: tokens.paperBg, c2: tokens.semanticWarningPaper },
      { name: 'Paper surface & warning-paper', c1: tokens.paperSurface, c2: tokens.semanticWarningPaper },
      { name: 'Paper bg & danger-paper', c1: tokens.paperBg, c2: tokens.semanticDangerPaper },
      { name: 'Paper surface & danger-paper', c1: tokens.paperSurface, c2: tokens.semanticDangerPaper }
    ];

    textPairs.forEach(({ name, c1, c2 }) => {
      it(`verifies ${name} reaches >= 4.5:1`, () => {
        const ratio = getContrastRatio(c1, c2);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('2. Control Borders Contrast (WCAG non-text >= 3.0:1)', () => {
    const borderPairs = [
      { name: 'Dark border-control vs dark surface', c1: tokens.darkBorderControl, c2: tokens.darkSurface },
      { name: 'Dark border-control vs dark bg', c1: tokens.darkBorderControl, c2: tokens.darkBg },
      { name: 'Dark border-control vs dark raised', c1: tokens.darkBorderControl, c2: tokens.darkRaised },
      { name: 'Paper border-control vs paper surface', c1: tokens.paperBorderControl, c2: tokens.paperSurface },
      { name: 'Paper border-control vs paper bg', c1: tokens.paperBorderControl, c2: tokens.paperBg }
    ];

    borderPairs.forEach(({ name, c1, c2 }) => {
      it(`verifies ${name} reaches >= 3.0:1`, () => {
        const ratio = getContrastRatio(c1, c2);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe('3. Chart Data Series Contrast (WCAG graphical >= 3.0:1)', () => {
    tokens.seriesDark.forEach((hex, idx) => {
      it(`verifies Dark series #${idx + 1} (${hex}) reaches >= 3.0:1 on dark surface`, () => {
        const ratio = getContrastRatio(hex, tokens.darkSurface);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });

    tokens.seriesPaper.forEach((hex, idx) => {
      it(`verifies Paper series #${idx + 1} (${hex}) reaches >= 3.0:1 on white and paper`, () => {
        const ratioWhite = getContrastRatio(hex, tokens.paperSurface);
        const ratioPaper = getContrastRatio(hex, tokens.paperBg);
        expect(ratioWhite).toBeGreaterThanOrEqual(3.0);
        expect(ratioPaper).toBeGreaterThanOrEqual(3.0);
      });
    });
  });
});
