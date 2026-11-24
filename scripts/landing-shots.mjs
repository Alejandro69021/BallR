import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'public', 'landing');

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
  console.log(`[landing-shots] Using Chrome at: ${chromePath}`);

  // Start Vite dev server in demo mode
  process.env.VITE_DEMO_MODE = 'true';
  const server = await createServer({
    root: rootDir,
    server: { port: 5189, strictPort: false },
    logLevel: 'error',
    define: {
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true')
    }
  });
  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === 'object' ? address.port : 5189;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[landing-shots] Vite server running at: ${baseUrl}`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const targets = [
    {
      route: '/beranda',
      width: 1200,
      height: 750,
      filename: 'hero-beranda.jpg',
      label: 'Hero Beranda'
    },
    {
      route: '/pencatatan/demo-match-draft-02',
      width: 1200,
      height: 750,
      filename: 'pencatat-desktop.jpg',
      label: 'Pencatat Laga Desktop'
    },
    {
      route: '/pencatatan/demo-match-draft-02',
      width: 390,
      height: 780,
      filename: 'pencatat-mobile.jpg',
      label: 'Pencatat Laga Mobile (390px)'
    },
    {
      route: '/laga/demo-match-contoh-01',
      width: 1200,
      height: 750,
      filename: 'detail-laga.jpg',
      label: 'Detail Laga'
    },
    {
      route: '/pemain/WK-2026-0042/pertumbuhan',
      width: 1200,
      height: 750,
      filename: 'paspor-pertumbuhan.jpg',
      label: 'Paspor Pertumbuhan'
    }
  ];

  console.log('[landing-shots] Capturing screenshots...');
  const results = [];

  for (const t of targets) {
    const context = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: 1
    });

    await context.addInitScript(() => {
      localStorage.setItem('ballr_tour_done_v1', '1');
      localStorage.setItem('ballr_surface', 'paper');
      localStorage.setItem('ballr_theme', 'paper');
    });

    const page = await context.newPage();
    const targetUrl = `${baseUrl}${t.route}`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const outPath = path.join(outDir, t.filename);
    await page.screenshot({
      path: outPath,
      type: 'jpeg',
      quality: 80,
      clip: { x: 0, y: 0, width: t.width, height: t.height }
    });

    const stats = fs.statSync(outPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    const sizeOk = stats.size <= 100 * 1024;

    results.push({
      file: t.filename,
      width: t.width,
      height: t.height,
      sizeBytes: stats.size,
      sizeKb: `${sizeKb} KB`,
      sizeOk
    });

    console.log(`[landing-shots] Captured ${t.filename} (${t.width}x${t.height}): ${sizeKb} KB ${sizeOk ? '✓' : '⚠️ EXCEEDS 100KB'}`);
    await context.close();
  }

  await browser.close();
  await server.close();

  console.log('\n[landing-shots] Summary:');
  for (const r of results) {
    console.log(`- public/landing/${r.file} (${r.width}x${r.height}): ${r.sizeKb}`);
    if (!r.sizeOk) {
      console.error(`ERROR: ${r.file} exceeds 100 KB limit!`);
      process.exit(1);
    }
  }
  console.log('\nAll landing screenshots captured and within 100 KB limit.');
}

main().catch((err) => {
  console.error('[landing-shots] Failed:', err);
  process.exit(1);
});
