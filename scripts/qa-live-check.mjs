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
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome not found');
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const chromePath = findChrome();

  process.env.VITE_DEMO_MODE = 'true';
  const server = await createServer({
    root: rootDir,
    server: { port: 5191, strictPort: false },
    logLevel: 'error',
    define: { 'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true') }
  });
  await server.listen();
  const port = server.httpServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const errors = [];
  const report = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => {
      localStorage.setItem('ballr_tour_done_v1', '1');
      localStorage.setItem('ballr_role_tutorial_done_v1_coach', 'true');
      localStorage.setItem('ballr_role_tutorial_done_v1_parent', 'true');
      localStorage.setItem('ballr_role_tutorial_done_v1_public', 'true');
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore third-party YouTube iframe network blocks in offline/headless if any
        if (!text.includes('youtube') && !text.includes('ytimg') && !text.includes('doubleclick')) {
          errors.push(`CONSOLE.ERROR: ${text}`);
        }
      }
    });

    const checkOverflow = async (label) => {
      const { sw, iw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth
      }));
      report.push(`${label}: scrollWidth=${sw}, innerWidth=${iw}, overflow=${sw > iw + 2}`);
      if (sw > iw + 2) errors.push(`OVERFLOW on ${label}: ${sw} > ${iw}`);
    };

    // 1. Check /laga
    await page.goto(`${baseUrl}/laga`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const hasLigaSleman = await page.getByText('PS Palma (vs AMS Seyegan)').isVisible();
    report.push(`/laga: PS Palma visible=${hasLigaSleman}`);
    if (!hasLigaSleman) errors.push('Missing PS Palma (vs AMS Seyegan) on /laga');
    await checkOverflow('/laga (1280)');

    // 2. Check /pencatatan/demo-match-liga-sleman-01 (YouTube + Live Tactical Panel)
    await page.goto(`${baseUrl}/pencatatan/demo-match-liga-sleman-01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const hasYtIframe = (await page.locator('iframe[title="Pemutar YouTube Pertandingan"]').count()) > 0;
    report.push(`/pencatatan/liga-sleman: YouTube iframe=${hasYtIframe}`);
    if (!hasYtIframe) errors.push('YouTube iframe not auto-loaded on /pencatatan/demo-match-liga-sleman-01');

    // Open Live Tactical Panel
    await page.getByRole('button', { name: /Analisis Live/i }).click();
    await page.waitForTimeout(300);
    await checkOverflow('/pencatatan/liga-sleman (1280)');
    await page.screenshot({ path: path.join(outDir, 'qa-logger-youtube-live.png'), fullPage: true });

    // 3. Check /laga/demo-match-contoh-01 -> Tab Analisis Taktis (3D Replay + Tactical Analysis)
    await page.goto(`${baseUrl}/laga/demo-match-contoh-01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: /Analisis Taktis/i }).click();
    await page.waitForTimeout(500);
    // Step replay forward twice to show trail & active event
    await page.getByLabel('Kejadian berikutnya').click();
    await page.getByLabel('Kejadian berikutnya').click();
    await page.waitForTimeout(400);
    await checkOverflow('/laga/contoh-01 Analisis Taktis (1280)');
    await page.screenshot({ path: path.join(outDir, 'qa-tactical-analysis-3d.png'), fullPage: true });

    // 4. Check /laga/demo-match-contoh-01/laporan (A4 Report)
    await page.goto(`${baseUrl}/laga/demo-match-contoh-01/laporan`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const hasTacticalInReport = await page.getByText(/Analisis Taktis Terukur/i).isVisible();
    report.push(`/laporan: Analisis Taktis Terukur visible=${hasTacticalInReport}`);
    if (!hasTacticalInReport) errors.push('Missing Analisis Taktis Terukur in MatchReportPage');
    await checkOverflow('/laga/contoh-01/laporan (1280)');
    await page.screenshot({ path: path.join(outDir, 'qa-match-report-a4.png'), fullPage: false });

    // 5. Check /taktik/demo-scenario-contoh-01 (3D Perspektif + Ghost Layer)
    await page.goto(`${baseUrl}/taktik/demo-scenario-contoh-01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /3D Perspektif/i }).click();
    const ghostBtn = page.getByRole('button', { name: /Bayangan Posisi Awal/i });
    if (!(await ghostBtn.isDisabled())) {
      await ghostBtn.click();
    }
    await page.waitForTimeout(500);
    await checkOverflow('/taktik/contoh-01 3D+Ghost (1280)');
    await page.screenshot({ path: path.join(outDir, 'qa-tactics-3d-ghost.png'), fullPage: true });

    // 5B. Check Mode Orang Tua (Logout -> Masuk -> Masuk Orang Tua) + Strava-style FlexCard + Logo back to Homepage
    await page.getByLabel('Menu akun').click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /Keluar/i }).click();
    await page.waitForTimeout(400);

    await page.getByLabel('Menu akun').click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /Masuk/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /Masuk Orang Tua/i }).click();
    await page.waitForTimeout(500);
    const hasParentBanner = await page.getByTestId('parent-portal-banner').isVisible();
    report.push(`Parent mode banner visible=${hasParentBanner}`);
    if (!hasParentBanner) errors.push('Parent portal banner not visible after Masuk Orang Tua');
    await checkOverflow('/pemain (Parent mode 1280)');
    await page.screenshot({ path: path.join(outDir, 'qa-parent-mode.png'), fullPage: false });

    // Open Strava-style FlexCard
    await page.getByRole('button', { name: /Kartu Perkembangan/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'qa-flexcard-strava.png'), fullPage: false });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Click ProspekBola logo -> must return to '/'
    await page.getByLabel('Kembali ke halaman depan').click();
    await page.waitForTimeout(400);
    const returnedHome = new URL(page.url()).pathname === '/';
    report.push(`Logo click returns to '/': ${returnedHome}`);
    if (!returnedHome) errors.push(`Logo click did not return to '/': got ${page.url()}`);

    // 6. Mobile viewport check (390x844) on Analisis Taktis
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/laga/demo-match-contoh-01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    await page.getByRole('tab', { name: /Analisis Taktis/i }).click();
    await page.waitForTimeout(400);
    await checkOverflow('/laga/contoh-01 Analisis Taktis (390 mobile)');
    await page.screenshot({ path: path.join(outDir, 'qa-tactical-mobile.png'), fullPage: false });
  } finally {
    await browser.close();
    await server.close();
  }

  fs.writeFileSync(
    path.join(outDir, 'qa-live-report.json'),
    JSON.stringify({ report, errors }, null, 2)
  );
  console.log('QA_REPORT:', JSON.stringify({ report, errorCount: errors.length, errors }));
  if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
