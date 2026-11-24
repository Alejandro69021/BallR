import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'ui-check-out');

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe') : null,
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Google\\Chrome\\Application\\chrome.exe') : null,
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error('Chrome executable not found on this machine');
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chromePath = findChrome();
  console.log(`[ui-check] Using Chrome at: ${chromePath}`);

  // 1. Start Vite dev server in demo mode
  process.env.VITE_DEMO_MODE = 'true';
  const server = await createServer({
    root: rootDir,
    server: { port: 5188, strictPort: false },
    logLevel: 'error',
    define: {
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true')
    }
  });
  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === 'object' ? address.port : 5188;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[ui-check] Vite server running at: ${baseUrl}`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const failures = [];

  try {
    // 2. Check (a): getComputedStyle(body).backgroundColor changes after clicking theme button
    console.log('[ui-check] Checking assertion (a): theme toggle changes background-color...');
    const themeContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await themeContext.addInitScript(() => {
      localStorage.setItem('ballr_tour_done_v1', '1');
    });
    const themePage = await themeContext.newPage();
    await themePage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await themePage.waitForTimeout(300);

    const bgBefore = await themePage.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    const themeToggleBtn = themePage.locator('[data-testid="theme-toggle"]');
    await themeToggleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await themeToggleBtn.click();
    await themePage.waitForTimeout(300);
    const bgAfter = await themePage.evaluate(() => window.getComputedStyle(document.body).backgroundColor);

    if (!bgBefore || !bgAfter || bgBefore === bgAfter) {
      failures.push(
        `Assertion (a) FAILED: getComputedStyle(body).backgroundColor did not change on theme toggle (before: "${bgBefore}", after: "${bgAfter}")`
      );
    } else {
      console.log(`[ui-check] Assertion (a) PASSED: bg changed from "${bgBefore}" to "${bgAfter}"`);
    }
    await themeContext.close();

    // Matrix configuration
    const viewports = [
      { width: 1366, height: 650 },
      { width: 1280, height: 720 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 }
    ];

    const themes = ['paper', 'dark'];

    const routes = [
      { path: '/', slug: 'home' },
      { path: '/skuad', slug: 'skuad' },
      { path: '/laga', slug: 'laga' },
      { path: '/penilaian/WK-2026-0042', slug: 'penilaian-WK-2026-0042' },
      { path: '/pencatatan/demo-match-draft-02', slug: 'pencatatan-demo-match-draft-02' },
      { path: '/taktik', slug: 'taktik' },
      { path: '/bantuan', slug: 'bantuan' }
    ];

    for (const vp of viewports) {
      for (const theme of themes) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height }
        });

        await context.addInitScript((th) => {
          localStorage.setItem('ballr_tour_done_v1', '1');
          localStorage.setItem('ballr_surface', th);
          localStorage.setItem('ballr_theme', th);
        }, theme);

        const page = await context.newPage();

        for (const route of routes) {
          const comboLabel = `${route.slug}-${theme}-${vp.width}x${vp.height}`;
          try {
            await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
            // Wait for main content and surface attribute
            await page.waitForTimeout(400);

            // Screenshot
            const shotPath = path.join(outDir, `${route.slug}-${theme}-${vp.width}.png`);
            await page.screenshot({ path: shotPath, fullPage: false });

            // Check (b): horizontal overflow
            const overflow = await page.evaluate(() => {
              const el = document.documentElement;
              return {
                overflows: el.scrollWidth > el.clientWidth + 1, // allow 1px rounding tolerance
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth
              };
            });
            if (overflow.overflows) {
              failures.push(
                `Assertion (b) FAILED on ${comboLabel}: horizontal overflow detected (scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth})`
              );
            }

            // Check (c): direct children of top nav bar do not overlap
            const navOverlap = await page.evaluate(() => {
              const bar = document.querySelector('[data-testid="top-nav-bar"]');
              if (!bar) return null;
              const children = Array.from(bar.children).filter((c) => {
                const rect = c.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && window.getComputedStyle(c).display !== 'none';
              });

              for (let i = 0; i < children.length; i++) {
                const r1 = children[i].getBoundingClientRect();
                for (let j = i + 1; j < children.length; j++) {
                  const r2 = children[j].getBoundingClientRect();
                  const overlapX = r1.right > r2.left + 1 && r1.left < r2.right - 1;
                  const overlapY = r1.bottom > r2.top + 1 && r1.top < r2.bottom - 1;
                  if (overlapX && overlapY) {
                    return {
                      child1: children[i].tagName + '.' + (children[i].className || ''),
                      child2: children[j].tagName + '.' + (children[j].className || ''),
                      r1,
                      r2
                    };
                  }
                }
              }
              return null;
            });
            if (navOverlap) {
              failures.push(
                `Assertion (c) FAILED on ${comboLabel}: nav bar children overlap between [${navOverlap.child1}] and [${navOverlap.child2}]`
              );
            }

            // Check (d): no element whose own text has >= 4 words has computed font-family containing "mono"
            const monoViolations = await page.evaluate((isReport) => {
              if (isReport) return [];
              const violations = [];
              const allElements = document.querySelectorAll('*');
              for (const el of allElements) {
                const tag = el.tagName.toLowerCase();
                if (tag === 'pre' || tag === 'code' || tag === 'script' || tag === 'style') continue;

                let ownText = '';
                for (const node of el.childNodes) {
                  if (node.nodeType === Node.TEXT_NODE) {
                    ownText += node.textContent;
                  }
                }
                const words = ownText.trim().split(/\s+/).filter(Boolean);
                if (words.length >= 4) {
                  const style = window.getComputedStyle(el);
                  if (style.fontFamily.toLowerCase().includes('mono')) {
                    violations.push({
                      tag: el.tagName,
                      text: ownText.trim().slice(0, 50),
                      words: words.length,
                      fontFamily: style.fontFamily
                    });
                  }
                }
              }
              return violations;
            }, route.path.includes('/laporan'));
            if (monoViolations.length > 0) {
              failures.push(
                `Assertion (d) FAILED on ${comboLabel}: found ${monoViolations.length} elements with >= 4 words in font-mono: ${JSON.stringify(monoViolations[0])}`
              );
            }

            // Check (e): demo indicator appears exactly 1 time
            const demoCount = await page.evaluate(() => {
              const demoBanners = document.querySelectorAll('[data-testid="demo-banner"]').length;
              // Check for rogue demo indicators outside the unified banner
              const all = Array.from(document.querySelectorAll('*'));
              const rogue = all.filter((el) => {
                if (el.closest('[data-testid="demo-banner"]')) return false;
                let text = '';
                for (const n of el.childNodes) {
                  if (n.nodeType === Node.TEXT_NODE) text += n.textContent + ' ';
                }
                return /mode contoh|data contoh/i.test(text);
              });
              return { banners: demoBanners, rogue: rogue.length };
            });
            if (demoCount.banners !== 1 || demoCount.rogue !== 0) {
              failures.push(
                `Assertion (e) FAILED on ${comboLabel}: demo indicator count != 1 (banner: ${demoCount.banners}, rogue: ${demoCount.rogue})`
              );
            }

            // Check (f): demo banner text has contrast >= 4.5:1 in both themes (canvas pixel read)
            const demoContrast = await page.evaluate(() => {
              const banner = document.querySelector('[data-testid="demo-banner"]');
              if (!banner) return null;
              const span = banner.querySelector('span');
              if (!span) return null;

              const bgStr = window.getComputedStyle(banner).backgroundColor;
              const fgStr = window.getComputedStyle(span).color;

              function getRgb(colorStr) {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = colorStr;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                return [r, g, b];
              }

              function getLuminance([r, g, b]) {
                const sRGB = [r, g, b].map((v) => {
                  v /= 255;
                  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
              }

              const fgRgb = getRgb(fgStr);
              const bgRgb = getRgb(bgStr);
              const l1 = getLuminance(fgRgb);
              const l2 = getLuminance(bgRgb);
              const lighter = Math.max(l1, l2);
              const darker = Math.min(l1, l2);
              const ratio = (lighter + 0.05) / (darker + 0.05);

              return {
                ratio: Math.round(ratio * 100) / 100,
                fg: fgStr,
                bg: bgStr
              };
            });
            if (demoContrast && demoContrast.ratio < 4.5) {
              failures.push(
                `Assertion (f) FAILED on ${comboLabel}: demo banner contrast < 4.5:1 (ratio=${demoContrast.ratio}:1, fg="${demoContrast.fg}", bg="${demoContrast.bg}")`
              );
            }

            // Check (g): no table card has scrollWidth > clientWidth at 1366 and 1280 on /skuad
            if (route.path === '/skuad' && (vp.width === 1366 || vp.width === 1280)) {
              const tableCardOverflow = await page.evaluate(() => {
                const tables = Array.from(document.querySelectorAll('table'));
                for (const table of tables) {
                  const card = table.closest('.overflow-x-auto') || table.parentElement;
                  if (card && card.scrollWidth > card.clientWidth) {
                    return {
                      scrollWidth: card.scrollWidth,
                      clientWidth: card.clientWidth,
                      diff: card.scrollWidth - card.clientWidth
                    };
                  }
                }
                return null;
              });

              if (tableCardOverflow) {
                failures.push(
                  `Assertion (g) FAILED on ${comboLabel}: table card has scrollWidth > clientWidth (scrollWidth=${tableCardOverflow.scrollWidth} > clientWidth=${tableCardOverflow.clientWidth}, diff=${tableCardOverflow.diff}px)`
                );
              }
            }
          } catch (err) {
            failures.push(`Execution error on ${comboLabel}: ${err.message}`);
          }
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\n================ UI GATE RESULTS ================');
  if (failures.length === 0) {
    console.log('ALL ASSERTIONS PASSED (0 failures)! Screenshots saved to ui-check-out/');
    process.exit(0);
  } else {
    console.error(`FAILED: ${failures.length} issues detected:`);
    failures.forEach((f, idx) => console.error(`  ${idx + 1}) ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[ui-check] Fatal error:', err);
  process.exit(1);
});
