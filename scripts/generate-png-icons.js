import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe') : null,
    process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Google\\Chrome\\Application\\chrome.exe') : null,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

async function generate() {
  const svgPath = path.join(rootDir, 'public', 'brand', 'logo-mark.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error(`Source SVG not found at ${svgPath}`);
  }
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // Maskable SVG with full bleed pitch background and 80% safe-zone scaled contents
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512">
  <rect width="64" height="64" fill="#0B3A2A"/>
  <g transform="translate(6.4, 6.4) scale(0.8)">
    <g fill="none" stroke="#F4F5EE" stroke-width="3" stroke-linecap="round">
      <circle cx="30" cy="36" r="13"/>
      <path d="M10 36h40"/>
    </g>
    <path d="M38 24 L49 13" fill="none" stroke="#D2F23F" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="12" r="6" fill="#D2F23F"/>
  </g>
</svg>`;

  const chromePath = findChrome();
  if (!chromePath) {
    console.warn('[generate-png-icons] Chrome not found, fallback generation');
    return;
  }

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    // 1. icon-192.png
    await page.setViewportSize({ width: 192, height: 192 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center;width:192px;height:192px;">
      <div style="width:192px;height:192px;">${svgContent.replace(/width="64"/, 'width="192"').replace(/height="64"/, 'height="192"')}</div>
    </body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'public', 'icon-192.png'), omitBackground: true });

    // 2. icon-512.png
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center;width:512px;height:512px;">
      <div style="width:512px;height:512px;">${svgContent.replace(/width="64"/, 'width="512"').replace(/height="64"/, 'height="512"')}</div>
    </body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'public', 'icon-512.png'), omitBackground: true });

    // 3. icon-maskable.png
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#0B3A2A;display:flex;align-items:center;justify-content:center;width:512px;height:512px;">
      <div style="width:512px;height:512px;">${maskableSvg}</div>
    </body></html>`);
    await page.screenshot({ path: path.join(rootDir, 'public', 'icon-maskable.png') });

    console.log('[generate-png-icons] Successfully regenerated: icon-192.png, icon-512.png, icon-maskable.png');
  } finally {
    await browser.close();
  }
}

generate().catch((err) => {
  console.error('[generate-png-icons] Error:', err);
  process.exit(1);
});
