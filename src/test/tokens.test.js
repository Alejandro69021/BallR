import { describe, it, expect } from 'vitest';

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

describe('Design Token Accessibility Verification (WCAG AA >= 4.5:1)', () => {
  const darkPairs = [
    { label: 'Dark bg & text-1', bg: '#0B0F14', text: '#E8ECF1' },
    { label: 'Dark bg & text-2', bg: '#0B0F14', text: '#9AA6B5' },
    { label: 'Dark surface & text-1', bg: '#11161D', text: '#E8ECF1' },
    { label: 'Dark surface & text-2', bg: '#11161D', text: '#9AA6B5' },
    { label: 'Dark raised & text-1', bg: '#1A212B', text: '#E8ECF1' },
    { label: 'Dark raised & text-2', bg: '#1A212B', text: '#9AA6B5' },
    { label: 'Dark bg & brand #4FB286', bg: '#0B0F14', text: '#4FB286' },
    { label: 'Dark surface & brand #4FB286', bg: '#11161D', text: '#4FB286' }
  ];

  const paperPairs = [
    { label: 'Paper bg & text-1', bg: '#F6F4EF', text: '#14181F' },
    { label: 'Paper bg & text-2', bg: '#F6F4EF', text: '#4A5360' },
    { label: 'Paper surface & text-1', bg: '#FFFFFF', text: '#14181F' },
    { label: 'Paper surface & text-2', bg: '#FFFFFF', text: '#4A5360' },
    { label: 'Paper bg & brand #2E7D5B', bg: '#F6F4EF', text: '#2E7D5B' },
    { label: 'Paper surface & brand #2E7D5B', bg: '#FFFFFF', text: '#2E7D5B' }
  ];

  darkPairs.forEach(({ label, bg, text }) => {
    it(`guarantees ${label} meets WCAG AA (>= 4.5:1)`, () => {
      const ratio = getContrastRatio(bg, text);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  paperPairs.forEach(({ label, bg, text }) => {
    it(`guarantees ${label} meets WCAG AA (>= 4.5:1)`, () => {
      const ratio = getContrastRatio(bg, text);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
