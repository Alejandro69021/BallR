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

  // Matrix configuration
  const viewports = [
    { width: 1366, height: 650 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 }
  ];

  const themes = ['paper', 'dark'];

  const routes = [
    { path: '/', slug: 'landing', optOut: true, isLanding: true },
    { path: '/beranda', slug: 'beranda' },
    { path: '/privasi', slug: 'privasi', optOut: true, isLanding: true },
    { path: '/pemain/WK-2026-0042', slug: 'pemain-paspor' },
    { path: '/pemain/WK-2026-0042/laga', slug: 'pemain-laga' },
    { path: '/pemain/WK-2026-0042/laga/demo-match-contoh-01', slug: 'pemain-laga-match' },
    { path: '/pemain/WK-2026-0042/pertumbuhan', slug: 'pemain-pertumbuhan' },
    { path: '/skuad', slug: 'skuad' },
    { path: '/penilaian/WK-2026-0042', slug: 'penilaian-WK-2026-0042' },
    { path: '/pencatatan', slug: 'pencatatan-root' },
    { path: '/pencatatan/demo-match-draft-02', slug: 'pencatatan-demo-match-draft-02' },
    { path: '/laga', slug: 'laga' },
    { path: '/laga/demo-match-contoh-01', slug: 'laga-demo-match-contoh-01' },
    { path: '/laga/demo-match-contoh-01/laporan', slug: 'laga-demo-match-contoh-01-laporan', optOut: true },
    { path: '/taktik', slug: 'taktik' },
    { path: '/taktik/demo-scenario-contoh-01', slug: 'taktik-demo-scenario-contoh-01' },
    { path: '/verifikasi/demo-hash', slug: 'verifikasi-demo-hash', optOut: true },
    { path: '/rujukan', slug: 'rujukan' },
    { path: '/bantuan', slug: 'bantuan' }
  ];

  try {
    // 2. Check (a): getComputedStyle(body).backgroundColor changes after clicking theme button
    console.log('[ui-check] Checking assertion (a): theme toggle changes background-color...');
    const themeContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await themeContext.addInitScript(() => {
      localStorage.setItem('ballr_tour_done_v1', '1');
    });
    const themePage = await themeContext.newPage();
    await themePage.goto(`${baseUrl}/beranda`, { waitUntil: 'domcontentloaded' });
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
        const thirdPartyRequests = [];
        page.on('request', (req) => {
          try {
            const url = new URL(req.url());
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
              thirdPartyRequests.push(req.url());
            }
          } catch {}
        });

        for (const route of routes) {
          const comboLabel = `${route.slug}-${theme}-${vp.width}x${vp.height}`;
          try {
            if (route.path === '/') {
              thirdPartyRequests.length = 0;
            }
            await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
            if (route.isLanding || route.path === '/' || route.path === '/privasi') {
              await page.waitForSelector('[data-testid="landing-container"], footer', { timeout: 10000 }).catch(() => {});
            } else if (!route.optOut) {
              await page.waitForSelector('[data-testid="page-container"]', { timeout: 10000 }).catch(() => {});
            }
            await page.waitForTimeout(200);

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

                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;

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

            // Check (e): demo indicator appears exactly 1 time (exempt on landing & privasi)
            if (!route.isLanding && route.path !== '/' && route.path !== '/privasi') {
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

            // Check (h): Page container validation on non-opt-out routes
            // Every non-opt-out route has exactly one [data-testid="page-container"],
            // its left edge >= 16px and right gap >= 16px (>= 24px at width >= 640),
            // and no page-level section (direct child) has left < container.left.
            if (!route.optOut) {
              const gutterCheck = await page.evaluate((vpWidth) => {
                const containers = document.querySelectorAll('[data-testid="page-container"]');
                if (containers.length !== 1) {
                  return {
                    error: `expected exactly 1 [data-testid="page-container"], found ${containers.length}`
                  };
                }
                const container = containers[0];
                const rect = container.getBoundingClientRect();
                const style = window.getComputedStyle(container);
                const paddingLeft = parseFloat(style.paddingLeft) || 0;
                const paddingRight = parseFloat(style.paddingRight) || 0;

                const expectedMinGutter = vpWidth >= 640 ? 24 : 16;
                // Effective left edge and right gap of container
                const effectiveLeft = rect.left + paddingLeft;
                const effectiveRightGap = (window.innerWidth - rect.right) + paddingRight;

                // 1. Left edge check (allow 1px rounding tolerance)
                if (effectiveLeft < expectedMinGutter - 1) {
                  return {
                    error: `container left edge (${Math.round(effectiveLeft)}px) < expected minimum (${expectedMinGutter}px)`
                  };
                }

                // 2. Right gap check
                if (effectiveRightGap < expectedMinGutter - 1) {
                  return {
                    error: `container right gap (${Math.round(effectiveRightGap)}px) < expected minimum (${expectedMinGutter}px)`
                  };
                }

                // 3. Direct children check: no page-level section has left < container.left
                const children = Array.from(container.children);
                for (const child of children) {
                  if (child.offsetWidth === 0 && child.offsetHeight === 0) continue;
                  const childRect = child.getBoundingClientRect();
                  if (childRect.left < rect.left - 1) {
                    return {
                      error: `direct child <${child.tagName.toLowerCase()}> left (${Math.round(childRect.left)}px) < container.left (${Math.round(rect.left)}px)`
                    };
                  }
                }

                return null;
              }, vp.width);

              if (gutterCheck && gutterCheck.error) {
                failures.push(`Assertion (h) FAILED on ${comboLabel}: ${gutterCheck.error}`);
              }
            }

            // Check (h - landing): landing container validation on "/" and "/privasi"
            if (route.isLanding || route.path === '/' || route.path === '/privasi') {
              const landingGutterCheck = await page.evaluate((vpWidth) => {
                const containers = document.querySelectorAll('[data-testid="landing-container"]');
                if (containers.length === 0) {
                  return {
                    error: `expected at least 1 [data-testid="landing-container"], found 0`
                  };
                }
                const expectedMinGutter = vpWidth >= 640 ? 24 : 16;
                for (const container of containers) {
                  const rect = container.getBoundingClientRect();
                  const style = window.getComputedStyle(container);
                  const paddingLeft = parseFloat(style.paddingLeft) || 0;
                  const paddingRight = parseFloat(style.paddingRight) || 0;

                  const effectiveLeft = rect.left + paddingLeft;
                  const effectiveRightGap = (window.innerWidth - rect.right) + paddingRight;

                  if (effectiveLeft < expectedMinGutter - 1) {
                    return {
                      error: `landing-container left edge (${Math.round(effectiveLeft)}px) < expected minimum (${expectedMinGutter}px)`
                    };
                  }
                  if (effectiveRightGap < expectedMinGutter - 1) {
                    return {
                      error: `landing-container right gap (${Math.round(effectiveRightGap)}px) < expected minimum (${expectedMinGutter}px)`
                    };
                  }
                }
                return null;
              }, vp.width);

              if (landingGutterCheck && landingGutterCheck.error) {
                failures.push(`Assertion (h - landing) FAILED on ${comboLabel}: ${landingGutterCheck.error}`);
              }
            }

            // Check (i): contrast >= 4.5:1 on "/" for hero paragraph, footer text, and dark principles
            if (route.path === '/') {
              const landingContrasts = await page.evaluate(() => {
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

                function calcRatio(fgStr, bgStr) {
                  const l1 = getLuminance(getRgb(fgStr));
                  const l2 = getLuminance(getRgb(bgStr));
                  const lighter = Math.max(l1, l2);
                  const darker = Math.min(l1, l2);
                  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
                }

                function getEffectiveBg(el) {
                  let cur = el;
                  while (cur && cur !== document.documentElement) {
                    const bg = window.getComputedStyle(cur).backgroundColor;
                    if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
                      return bg;
                    }
                    cur = cur.parentElement;
                  }
                  return 'rgb(244, 245, 238)';
                }

                const targets = [
                  { name: 'hero paragraph', el: document.querySelector('#hero p') },
                  { name: 'footer text', el: document.querySelector('#kaki p') },
                  { name: 'footer link', el: document.querySelector('#kaki a') },
                  { name: 'principles heading', el: document.querySelector('#prinsip h3') },
                  { name: 'principles description', el: document.querySelector('#prinsip p') }
                ];

                const results = [];
                for (const t of targets) {
                  if (!t.el) continue;
                  const fg = window.getComputedStyle(t.el).color;
                  const bg = getEffectiveBg(t.el);
                  const ratio = calcRatio(fg, bg);
                  results.push({ name: t.name, ratio, fg, bg });
                }
                return results;
              });

              for (const c of landingContrasts) {
                if (c.ratio < 4.5) {
                  failures.push(
                    `Assertion (i) FAILED on ${comboLabel}: ${c.name} contrast < 4.5:1 (ratio=${c.ratio}:1, fg="${c.fg}", bg="${c.bg}")`
                  );
                }
              }

              // Check (j): Zero requests to third-party hosts on "/"
              if (thirdPartyRequests.length > 0) {
                failures.push(
                  `Assertion (j) FAILED on ${comboLabel}: detected ${thirdPartyRequests.length} third-party requests on landing page: ${thirdPartyRequests.join(', ')}`
                );
              }
            }

            // Check (k): BrandMark present in top nav bar on non-landing routes
            if (!route.isLanding && route.path !== '/' && route.path !== '/privasi') {
              const navBrandMark = await page.evaluate(() => {
                const nav = document.querySelector('[data-testid="top-nav-bar"]');
                if (!nav) return { error: 'top-nav-bar not found' };
                const mark = nav.querySelector('[data-testid="brand-mark"]');
                return { hasBrandMark: Boolean(mark) };
              });
              if (!navBrandMark.hasBrandMark) {
                failures.push(
                  `Assertion (k) FAILED on ${comboLabel}: BrandMark not found in top-nav-bar`
                );
              }
            }

            // Check (l): BRAND_SPEC section 8 font-display rules
            // .font-display allowed only on titles/numerals, never inside table/form/input/textarea, never > 6 words
            const fontDisplayViolations = await page.evaluate(() => {
              const violations = [];
              const allElements = document.querySelectorAll('*');
              for (const el of allElements) {
                const tag = el.tagName.toLowerCase();
                if (tag === 'pre' || tag === 'code' || tag === 'script' || tag === 'style') continue;

                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;

                const hasBarlowFont = style.fontFamily.toLowerCase().includes('barlow');
                const hasFontDisplayClass = el.classList.contains('font-display');

                if (hasBarlowFont || hasFontDisplayClass) {
                  // Barlow only allowed with class .font-display
                  if (hasBarlowFont && !hasFontDisplayClass && !el.closest('.font-display')) {
                    violations.push({
                      type: 'missing-font-display-class',
                      tag: el.tagName,
                      text: el.textContent.trim().slice(0, 40)
                    });
                    continue;
                  }

                  // Never inside table, form, input, textarea
                  const forbiddenParent = el.closest('table, form, input, textarea');
                  if (forbiddenParent) {
                    violations.push({
                      type: `inside-${forbiddenParent.tagName.toLowerCase()}`,
                      tag: el.tagName,
                      text: el.textContent.trim().slice(0, 40)
                    });
                    continue;
                  }

                  // Never > 6 words (or > 10 words for headings h1-h3)
                  let ownText = '';
                  for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                      ownText += node.textContent;
                    }
                  }
                  const checkText = ownText.trim() || el.textContent.trim();
                  const words = checkText.split(/\s+/).filter(Boolean);
                  const isHeading = ['h1', 'h2', 'h3'].includes(tag);
                  const maxWords = isHeading ? 10 : 6;
                  if (words.length > maxWords) {
                    violations.push({
                      type: `words-exceeded-${maxWords}`,
                      count: words.length,
                      tag: el.tagName,
                      text: checkText.slice(0, 50)
                    });
                  }
                }
              }
              return violations;
            });
            if (fontDisplayViolations.length > 0) {
              failures.push(
                `Assertion (l) FAILED on ${comboLabel}: font-display violation: ${JSON.stringify(fontDisplayViolations[0])}`
              );
            }

            // Check (m): no bib-coloured text on light backgrounds with contrast < 4.5:1
            const bibContrastViolations = await page.evaluate(() => {
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

              function getEffectiveBg(el) {
                let cur = el;
                while (cur && cur !== document.documentElement) {
                  const bg = window.getComputedStyle(cur).backgroundColor;
                  if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
                    return bg;
                  }
                  cur = cur.parentElement;
                }
                return window.getComputedStyle(document.body).backgroundColor || 'rgb(244, 245, 238)';
              }

              const violations = [];
              const allElements = document.querySelectorAll('*');
              for (const el of allElements) {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;

                // Check direct text
                let ownText = '';
                for (const node of el.childNodes) {
                  if (node.nodeType === Node.TEXT_NODE) {
                    ownText += node.textContent;
                  }
                }
                const text = ownText.trim();
                if (!text) continue;

                const color = style.color;
                const rgb = getRgb(color);
                // Bib is rgb(210, 242, 63)
                const isBib = Math.abs(rgb[0] - 210) < 10 && Math.abs(rgb[1] - 242) < 10 && Math.abs(rgb[2] - 63) < 10;
                if (isBib) {
                  const bg = getEffectiveBg(el);
                  const bgRgb = getRgb(bg);
                  const l1 = getLuminance(rgb);
                  const l2 = getLuminance(bgRgb);
                  const lighter = Math.max(l1, l2);
                  const darker = Math.min(l1, l2);
                  const ratio = Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
                  if (ratio < 4.5) {
                    violations.push({
                      tag: el.tagName,
                      text: text.slice(0, 30),
                      ratio,
                      fg: color,
                      bg
                    });
                  }
                }
              }
              return violations;
            });
            if (bibContrastViolations.length > 0) {
              failures.push(
                `Assertion (m) FAILED on ${comboLabel}: bib-coloured text has contrast < 4.5:1: ${JSON.stringify(bibContrastViolations[0])}`
              );
            }

            // Check (n): on "/", CTA card PitchLines SVG bounding box must not intersect CTA heading, paragraph, or buttons
            if (route.path === '/') {
              const ctaOverlap = await page.evaluate(() => {
                const card = document.querySelector('[data-testid="cta-card"]');
                if (!card) return { error: 'data-testid="cta-card" not found on landing page' };

                const wrapper = card.querySelector('[data-testid="cta-pitchlines"]');
                if (!wrapper) return { error: 'data-testid="cta-pitchlines" not found inside cta-card' };

                const svg = wrapper.querySelector('svg');
                if (!svg) {
                  return null;
                }

                const wrapperStyle = window.getComputedStyle(wrapper);
                const svgStyle = window.getComputedStyle(svg);
                if (
                  wrapperStyle.display === 'none' ||
                  wrapperStyle.visibility === 'hidden' ||
                  svgStyle.display === 'none' ||
                  svgStyle.visibility === 'hidden'
                ) {
                  return null;
                }

                const svgRect = svg.getBoundingClientRect();
                if (svgRect.width <= 0 || svgRect.height <= 0) {
                  return null;
                }

                const targets = [];
                const heading = card.querySelector('h2');
                if (heading) targets.push({ name: 'heading', el: heading });

                const p = card.querySelector('p');
                if (p) targets.push({ name: 'paragraph', el: p });

                const buttons = card.querySelectorAll('button, a, [role="button"]');
                buttons.forEach((btn, i) => {
                  targets.push({ name: `button-${i + 1}`, el: btn });
                });

                for (const target of targets) {
                  const tStyle = window.getComputedStyle(target.el);
                  if (tStyle.display === 'none' || tStyle.visibility === 'hidden') continue;

                  const tRect = target.el.getBoundingClientRect();
                  if (tRect.width <= 0 || tRect.height <= 0) continue;

                  // Check rectangle intersection (allow 1px tolerance)
                  const intersects = !(
                    svgRect.right <= tRect.left + 1 ||
                    svgRect.left >= tRect.right - 1 ||
                    svgRect.bottom <= tRect.top + 1 ||
                    svgRect.top >= tRect.bottom - 1
                  );

                  if (intersects) {
                    return {
                      error: `PitchLines SVG intersects CTA ${target.name} (SVG rect: [${Math.round(svgRect.left)}, ${Math.round(svgRect.top)}, ${Math.round(svgRect.right)}, ${Math.round(svgRect.bottom)}], ${target.name} rect: [${Math.round(tRect.left)}, ${Math.round(tRect.top)}, ${Math.round(tRect.right)}, ${Math.round(tRect.bottom)}])`
                    };
                  }
                }

                return null;
              });

              if (ctaOverlap && ctaOverlap.error) {
                failures.push(`Assertion (n) FAILED on ${comboLabel}: ${ctaOverlap.error}`);
              }
            }
          } catch (err) {
            failures.push(`Execution error on ${comboLabel}: ${err.message}`);
          }
        }

        await context.close();
      }
    }

    // Capture specific quiet moments screens (Tour final step & Empty state)
    for (const width of [1366, 390]) {
      const height = width === 1366 ? 650 : 844;
      for (const theme of themes) {
        // 1. Tour with bib highlight on final step
        try {
          const tourCtx = await browser.newContext({ viewport: { width, height } });
          await tourCtx.addInitScript((th) => {
            localStorage.removeItem('ballr_tour_done_v1');
            localStorage.setItem('ballr_surface', th);
            localStorage.setItem('ballr_theme', th);
          }, theme);
          const tourPage = await tourCtx.newPage();
          await tourPage.goto(`${baseUrl}/beranda`, { waitUntil: 'domcontentloaded' });
          await tourPage.waitForTimeout(300);
          const startBtn = await tourPage.$('[data-testid="start-tour-banner-btn"]');
          if (startBtn) {
            await startBtn.click();
            await tourPage.waitForTimeout(200);
            for (let i = 0; i < 3; i++) {
              const nextBtn = await tourPage.$('[data-testid="coachmark-next-btn"]');
              if (nextBtn) {
                await nextBtn.click();
                await tourPage.waitForTimeout(200);
              }
            }
          }
          await tourPage.screenshot({
            path: path.join(outDir, `tour-step-final-${theme}-${width}.png`),
            fullPage: false
          });
          await tourCtx.close();
        } catch (e) {
          console.warn(`[ui-check] Tour screenshot warning (${theme}-${width}):`, e.message);
        }

        // 2. Empty state with pitch-line illustration
        try {
          const emptyCtx = await browser.newContext({ viewport: { width, height } });
          await emptyCtx.addInitScript((th) => {
            localStorage.setItem('ballr_tour_done_v1', '1');
            localStorage.setItem('ballr_surface', th);
            localStorage.setItem('ballr_theme', th);
          }, theme);
          const emptyPage = await emptyCtx.newPage();
          await emptyPage.goto(`${baseUrl}/taktik`, { waitUntil: 'domcontentloaded' });
          await emptyPage.waitForTimeout(300);
          const searchInput = await emptyPage.$('input[placeholder*="Cari"]');
          if (searchInput) {
            await searchInput.fill('xyz-tidak-ditemukan');
            await emptyPage.waitForTimeout(300);
          }
          await emptyPage.screenshot({
            path: path.join(outDir, `empty-state-pitch-${theme}-${width}.png`),
            fullPage: false
          });
          await emptyCtx.close();
        } catch (e) {
          console.warn(`[ui-check] Empty state screenshot warning (${theme}-${width}):`, e.message);
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\n================ UI GATE RESULTS ================');
  console.log(`Routes tested: ${routes.length} (${routes.map((r) => r.path).join(', ')})`);
  console.log(`Viewports tested: ${viewports.map((v) => `${v.width}x${v.height}`).join(', ')}`);
  console.log(`Themes tested: ${themes.join(', ')}`);
  console.log(`Total matrix permutations: ${routes.length * viewports.length * themes.length}`);
  if (failures.length === 0) {
    console.log('ALL ASSERTIONS (a)-(n) PASSED (0 failures)! Screenshots saved to ui-check-out/');
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
