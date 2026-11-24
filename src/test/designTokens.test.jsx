import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import Surface from '../components/ui/Surface';

/**
 * Calculates WCAG 2.1 Relative Luminance for an sRGB hex code.
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '').trim();
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

/**
 * Parses CSS custom properties from a specific CSS selector block.
 */
function parseCssSelectorBlock(cssContent, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, 'm');
  const match = cssContent.match(regex);
  if (!match) return null;

  const declarations = match[1];
  const varMap = {};
  const varRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let varMatch;

  while ((varMatch = varRegex.exec(declarations)) !== null) {
    varMap[varMatch[1].trim()] = varMatch[2].trim();
  }

  return varMap;
}

describe('Design Tokens & Surface System (docs/DESIGN.md & src/index.css)', () => {
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const requiredVars = [
    '--app-bg',
    '--panel',
    '--raised',
    '--line',
    '--control-border',
    '--text-1',
    '--text-2',
    '--brand',
    '--warning',
    '--danger',
    '--success',
    '--series-1',
    '--series-2',
    '--series-3',
    '--series-4',
    '--series-5',
    '--pitch-bg',
    '--pitch-line'
  ];

  const darkTokens = parseCssSelectorBlock(cssContent, '[data-surface="dark"]');
  const paperTokens = parseCssSelectorBlock(cssContent, '[data-surface="paper"]');

  it('parses both [data-surface="dark"] and [data-surface="paper"] blocks from src/index.css', () => {
    expect(darkTokens).not.toBeNull();
    expect(paperTokens).not.toBeNull();
  });

  describe('1. Completeness: All required variables must exist in both surfaces', () => {
    requiredVars.forEach((varName) => {
      it(`verifies ${varName} is defined in [data-surface="dark"]`, () => {
        expect(darkTokens[varName]).toBeDefined();
        expect(darkTokens[varName]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      it(`verifies ${varName} is defined in [data-surface="paper"]`, () => {
        expect(paperTokens[varName]).toBeDefined();
        expect(paperTokens[varName]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('2. WCAG Contrast Verification from Parsed CSS Tokens', () => {
    const surfaces = [
      { name: 'dark', tokens: darkTokens },
      { name: 'paper', tokens: paperTokens }
    ];

    surfaces.forEach(({ name, tokens }) => {
      describe(`Surface [data-surface="${name}"]`, () => {
        const bgTargets = [
          { label: 'app-bg', color: tokens['--app-bg'] },
          { label: 'panel', color: tokens['--panel'] },
          { label: 'raised', color: tokens['--raised'] }
        ];

        // Text-1 & Text-2 on app-bg, panel, raised >= 4.5:1
        bgTargets.forEach(({ label, color }) => {
          it(`text-1 reaches >= 4.5:1 against ${label}`, () => {
            const ratio = getContrastRatio(tokens['--text-1'], color);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          });

          it(`text-2 reaches >= 4.5:1 against ${label}`, () => {
            const ratio = getContrastRatio(tokens['--text-2'], color);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          });
        });

        // Brand, warning, danger on app-bg and panel >= 4.5:1
        ['--brand', '--warning', '--danger'].forEach((role) => {
          it(`${role} reaches >= 4.5:1 against app-bg`, () => {
            const ratio = getContrastRatio(tokens[role], tokens['--app-bg']);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          });

          it(`${role} reaches >= 4.5:1 against panel`, () => {
            const ratio = getContrastRatio(tokens[role], tokens['--panel']);
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          });
        });

        // Control border against panel >= 3.0:1
        it('control-border reaches >= 3.0:1 against panel', () => {
          const ratio = getContrastRatio(tokens['--control-border'], tokens['--panel']);
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        });

        // Series 1..5 against panel >= 3.0:1
        for (let i = 1; i <= 5; i++) {
          const seriesKey = `--series-${i}`;
          it(`${seriesKey} reaches >= 3.0:1 against panel`, () => {
            const ratio = getContrastRatio(tokens[seriesKey], tokens['--panel']);
            expect(ratio).toBeGreaterThanOrEqual(3.0);
          });
        }

        // Pitch contrast: players/arrows (brand, series-1, series-2, danger, warning) against pitch-bg >= 3.0:1
        ['--brand', '--series-1', '--series-2', '--danger', '--warning'].forEach((role) => {
          it(`pitch element ${role} reaches >= 3.0:1 against pitch-bg`, () => {
            const ratio = getContrastRatio(tokens[role], tokens['--pitch-bg']);
            expect(ratio).toBeGreaterThanOrEqual(3.0);
          });
        });
      });
    });
  });

  describe('3. Zero Hex, Zero dark:, Zero Arbitrary Colors in Migrated Components (B1, B2 & B3)', () => {
    const uiDir = path.resolve(__dirname, '../components/ui');
    const uiFiles = fs
      .readdirSync(uiDir)
      .filter((file) => file.endsWith('.jsx') || file.endsWith('.js'))
      .map((file) => path.join(uiDir, file));

    const extraFiles = [
      path.resolve(__dirname, '../components/TopNav.jsx'),
      path.resolve(__dirname, '../components/auth/AuthModal.jsx'),
      path.resolve(__dirname, '../components/VerificationView.jsx'),
      path.resolve(__dirname, '../components/InstallAppBanner.jsx'),
      path.resolve(__dirname, '../components/LoadingSkeleton.jsx'),
      path.resolve(__dirname, '../components/growth/ConsentManagerModal.jsx'),
      path.resolve(__dirname, '../components/CoachAssessmentView.jsx'),
      path.resolve(__dirname, '../pages/AssessmentPage.jsx'),
      path.resolve(__dirname, '../components/assessment/AttributeEditor.jsx'),
      path.resolve(__dirname, '../components/assessment/FitnessForm.jsx'),
      path.resolve(__dirname, '../components/assessment/NarrativeNotesForm.jsx'),
      path.resolve(__dirname, '../components/FastPitchLogger.jsx'),
      path.resolve(__dirname, '../pages/LoggerPage.jsx'),
      path.resolve(__dirname, '../components/logger/MatchTimerBar.jsx'),
      path.resolve(__dirname, '../components/logger/TactileKeypad.jsx'),
      path.resolve(__dirname, '../components/logger/EventStreamLog.jsx'),
      path.resolve(__dirname, '../components/logger/QuickShotModal.jsx'),
      path.resolve(__dirname, '../components/logger/MatchRecapModal.jsx'),
      path.resolve(__dirname, '../pages/SquadPage.jsx'),
      path.resolve(__dirname, '../components/SquadHubView.jsx'),
      path.resolve(__dirname, '../components/squad/SquadPlayerCard.jsx'),
      path.resolve(__dirname, '../pages/PassportPage.jsx'),
      path.resolve(__dirname, '../components/PlayerHeader.jsx'),
      path.resolve(__dirname, '../components/FitnessStrip.jsx'),
      path.resolve(__dirname, '../components/PerformanceRadar.jsx'),
      path.resolve(__dirname, '../components/AICoachCard.jsx'),
      path.resolve(__dirname, '../components/OfficialDossierFooter.jsx'),
      path.resolve(__dirname, '../pages/GrowthPage.jsx'),
      path.resolve(__dirname, '../components/GrowthBioBandingTab.jsx'),
      path.resolve(__dirname, '../components/growth/BioMaturityCard.jsx'),
      path.resolve(__dirname, '../components/growth/AnthropometryLogTable.jsx'),
      path.resolve(__dirname, '../components/growth/AthleticProgressChart.jsx'),
      path.resolve(__dirname, '../pages/MatchesPage.jsx'),
      path.resolve(__dirname, '../pages/MatchDetailPage.jsx')
    ];
    const targetFiles = [...uiFiles, ...extraFiles];

    targetFiles.forEach((filePath) => {
      const fileName = path.basename(filePath);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      it(`verifies ${fileName} has no hard-coded hex colors`, () => {
        const hexMatches = fileContent.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        expect(hexMatches, `Found hex colors in ${fileName}: ${hexMatches.join(', ')}`).toEqual([]);
      });

      it(`verifies ${fileName} has no "dark:" Tailwind prefixes`, () => {
        const darkPrefixMatches = fileContent.match(/\bdark:[a-zA-Z0-9_\-[\]/]+/g) || [];
        expect(
          darkPrefixMatches,
          `Found "dark:" classes in ${fileName}: ${darkPrefixMatches.join(', ')}`
        ).toEqual([]);
      });

      it(`verifies ${fileName} has no arbitrary [#...] color classes`, () => {
        const arbitraryMatches = fileContent.match(/\[#[a-zA-Z0-9]+\]/g) || [];
        expect(
          arbitraryMatches,
          `Found arbitrary colors in ${fileName}: ${arbitraryMatches.join(', ')}`
        ).toEqual([]);
      });

      it(`verifies ${fileName} has no forbidden patterns`, () => {
        const forbiddenPatterns = ['#' + 'CCFF00', 'font-' + 'athletic', 'grad' + 'ient', 'shadow-' + '2xl'];
        forbiddenPatterns.forEach((pattern) => {
          expect(fileContent.includes(pattern), `Found forbidden pattern '${pattern}' in ${fileName}`).toBe(false);
        });
      });

      it(`verifies ${fileName} has no emojis`, () => {
        const emojiMatches = fileContent.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u) || [];
        expect(emojiMatches, `Found emoji in ${fileName}: ${emojiMatches.join(', ')}`).toEqual([]);
      });
    });
  });

  describe('4. Render Test: <Surface> sets data-surface and computes different variable values', () => {
    it('picks different computed variable values inside dark vs paper surface', () => {
      // Inject CSS into test document head
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        [data-surface="dark"] {
          --app-bg: #0B0F14;
          --panel: #11161D;
        }
        [data-surface="paper"] {
          --app-bg: #F6F4EF;
          --panel: #FFFFFF;
        }
      `;
      document.head.appendChild(styleEl);

      const { container } = render(
        <div>
          <Surface surface="dark" data-testid="surface-dark">
            <span id="child-dark">Gelap</span>
          </Surface>
          <Surface surface="paper" data-testid="surface-paper">
            <span id="child-paper">Kertas</span>
          </Surface>
        </div>
      );

      const darkEl = container.querySelector('[data-testid="surface-dark"]');
      const paperEl = container.querySelector('[data-testid="surface-paper"]');

      expect(darkEl).toHaveAttribute('data-surface', 'dark');
      expect(paperEl).toHaveAttribute('data-surface', 'paper');

      const darkAppBg = window.getComputedStyle(darkEl).getPropertyValue('--app-bg').trim();
      const paperAppBg = window.getComputedStyle(paperEl).getPropertyValue('--app-bg').trim();

      expect(darkAppBg.toLowerCase()).toBe('#0b0f14');
      expect(paperAppBg.toLowerCase()).toBe('#f6f4ef');
      expect(darkAppBg).not.toBe(paperAppBg);

      document.head.removeChild(styleEl);
    });
  });

  describe('5. Scan Test: Zero text-[...] arbitrary font sizes in src/components and src/pages', () => {
    function walkDir(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const scanDirs = [
      path.resolve(__dirname, '../components'),
      path.resolve(__dirname, '../pages')
    ];

    const allFiles = scanDirs.flatMap((d) => walkDir(d));

    it('verifies no component or page uses text-[...] arbitrary font sizes', () => {
      const violations = [];
      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/text-\[\d+(?:\.\d+)?(?:px|rem|em|%)\]/g);
        if (matches) {
          violations.push(`${path.relative(path.resolve(__dirname, '..'), file)}: ${matches.join(', ')}`);
        }
      });
      expect(violations, `Found arbitrary text-[...] sizes in:\n${violations.join('\n')}`).toEqual([]);
    });
  });

  describe('6. Scan Test: Interactive Touch Targets >= 44px on Narrow/Coarse Screens (Phase B9)', () => {
    function walkDir(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const scanDirs = [
      path.resolve(__dirname, '../components'),
      path.resolve(__dirname, '../pages')
    ];

    const allFiles = scanDirs.flatMap((d) => walkDir(d));

    it('verifies Button and IconButton definitions enforce 44px touch targets on size="sm"', () => {
      const buttonPath = path.resolve(__dirname, '../components/ui/Button.jsx');
      const iconButtonPath = path.resolve(__dirname, '../components/ui/IconButton.jsx');

      const buttonContent = fs.readFileSync(buttonPath, 'utf-8');
      const iconButtonContent = fs.readFileSync(iconButtonPath, 'utf-8');

      expect(buttonContent).toMatch(/sm:\s*['"][^'"]*min-h-\[44px\][^'"]*min-w-\[44px\]/);
      expect(iconButtonContent).toMatch(/sm:\s*['"][^'"]*min-h-\[44px\][^'"]*min-w-\[44px\]/);
    });

    it('verifies no interactive component uses fixed h-7, h-8, or h-9 without responsive min-height override', () => {
      const violations = [];
      const interactiveTagRegex = /<(?:button|input|select|textarea|a|Link|Button|IconButton)\b[^>]*>/gs;

      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = interactiveTagRegex.exec(content)) !== null) {
          const tag = match[0];
          const fixedHeightMatch = /(?<!(?:sm|md|lg|xl|2xl):)\bh-[789]\b/.test(tag);
          const hasMinHeightOverride = /\bmin-h-\[44px\]|\bmin-h-11\b/.test(tag);

          if (fixedHeightMatch && !hasMinHeightOverride) {
            violations.push(
              `${path.relative(path.resolve(__dirname, '..'), file)}: ${tag.slice(0, 100).replace(/\s+/g, ' ')}`
            );
          }
        }
      });

      expect(violations, `Found interactive components with h-7/h-8/h-9 without responsive min-height override:\n${violations.join('\n')}`).toEqual([]);
    });

    it('verifies size="sm" in interactive components is supported by responsive min-height override', () => {
      const violations = [];
      const interactiveSmRegex = /<(?:button|input|select|textarea|a|Link|Button|IconButton)\b[^>]*size=["']sm["'][^>]*>/gs;

      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = interactiveSmRegex.exec(content)) !== null) {
          const tag = match[0];
          if (/(?<!(?:sm|md|lg|xl|2xl):)\bh-[789]\b/.test(tag) && !/\bmin-h-\[44px\]/.test(tag)) {
            violations.push(
              `${path.relative(path.resolve(__dirname, '..'), file)}: ${tag.slice(0, 100).replace(/\s+/g, ' ')}`
            );
          }
          if (/\bmin-h-\[(?:[0-3]\d|[0-9])px\]/.test(tag) && !/(?:sm|md|lg|xl|2xl):min-h-/.test(tag)) {
            violations.push(
              `${path.relative(path.resolve(__dirname, '..'), file)}: ${tag.slice(0, 100).replace(/\s+/g, ' ')}`
            );
          }
        }
      });

      expect(violations, `Found size="sm" interactive elements with substandard min-height override:\n${violations.join('\n')}`).toEqual([]);
    });
  });

  describe('7. Typography Scale Verification (docs/UX_SPEC.md & src/index.css)', () => {
    const themeMatch = cssContent.match(/@theme\s*\{([^}]+)\}/m);
    const themeBlock = themeMatch ? themeMatch[1] : '';

    const expectedTokens = {
      '--text-caption': '14px',
      '--text-body': '16px',
      '--text-title': '18px',
      '--text-section': '20px',
      '--text-page': '28px',
      '--text-sm': '14px',
      '--text-base': '16px',
      '--text-lg': '18px',
      '--text-xl': '20px',
      '--text-2xl': '28px'
    };

    Object.entries(expectedTokens).forEach(([token, value]) => {
      it(`verifies token ${token} is configured to ${value} in @theme`, () => {
        const regex = new RegExp(`${token}\\s*:\\s*([^;]+);`);
        const match = themeBlock.match(regex);
        expect(match, `Token ${token} not found in @theme`).not.toBeNull();
        expect(match[1].trim()).toBe(value);
      });
    });
  });

  describe('8. Scan Test: Zero text-xs in Readable Text Outside Allowed Exceptions', () => {
    function walkDir(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const scanDirs = [
      path.resolve(__dirname, '../components'),
      path.resolve(__dirname, '../pages')
    ];

    const allFiles = scanDirs.flatMap((d) => walkDir(d));

    const isAllowedException = (filePath, line) => {
      const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');

      // 1. SVG chart/pitch axis labels
      if (relPath === 'components/growth/AthleticProgressChart.jsx') {
        if (line.includes('<text') || line.includes('className="text-xs font-mono"')) return true;
      }
      if (relPath === 'components/PerformanceRadar.jsx') {
        if (line.includes('radar-label') && line.includes('text-xs')) return true;
      }
      if (relPath === 'components/match/EventMap.jsx') {
        if (line.includes('<text') && line.includes('fill-1 font-mono text-xs select-none')) return true;
      }

      // 2. Print-only footer
      if (relPath === 'components/OfficialDossierFooter.jsx') {
        if (line.includes('print:flex') && line.includes('text-xs')) return true;
      }
      if (relPath === 'pages/MatchReportPage.jsx') {
        if (line.includes('print-footer') && line.includes('text-xs')) return true;
      }
      if (relPath === 'components/tactics/StoryboardPrintView.jsx') {
        if (line.includes('border-t') && line.includes('flex items-center justify-between text-xs text-2 font-mono')) return true;
      }

      // 3. Reference micro-badges (contrast >= 4.5:1)
      if (relPath === 'components/ui/Badge.jsx') {
        if (line.includes("micro: 'text-xs")) return true;
      }
      if (relPath === 'components/ui/RefChip.jsx') {
        if (line.includes('{ref.status') && line.includes('text-xs')) return true;
      }

      return false;
    };

    it('verifies readable text classes never use text-xs outside documented exceptions', () => {
      const violations = [];

      allFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (/\btext-xs\b/.test(line)) {
            if (!isAllowedException(file, line)) {
              violations.push(
                `${path.relative(path.resolve(__dirname, '..'), file)}:${idx + 1}: ${line.trim()}`
              );
            }
          }
        });
      });

      expect(
        violations,
        `Found text-xs outside allowed exceptions in:\n${violations.join('\n')}`
      ).toEqual([]);
    });
  });

  describe('9. CSS Source Order & Specificity Protection', () => {
    it('asserts :root precedes [data-surface=...] in src/index.css', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      const rootIndex = cssContent.indexOf(':root');
      const dataSurfaceIndex = cssContent.search(/\[data-surface=/);

      expect(rootIndex).toBeGreaterThan(-1);
      expect(dataSurfaceIndex).toBeGreaterThan(-1);
      expect(rootIndex).toBeLessThan(dataSurfaceIndex);
    });
  });
});
