import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'ui-check-out');
const reportPath = path.join(outDir, 'vision-e2e-report.json');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge executable not found');
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const chromePath = findChrome();

  process.env.VITE_DEMO_MODE = 'true';
  const server = await createServer({
    root: rootDir,
    server: { port: 5192, strictPort: false },
    logLevel: 'error',
    define: { 'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true') }
  });
  await server.listen();
  const port = server.httpServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  const result = {
    started_at: new Date().toISOString(),
    base_url: baseUrl,
    checks: {},
    page_errors: [],
    console_errors: []
  };

  let browser;
  try {
    // 1. Live API check: GET /api/vision/latest
    const latestRes = await fetch(`${baseUrl}/api/vision/latest`);
    const latestJson = await latestRes.json();
    result.checks.api_vision_latest = {
      status: latestRes.status,
      ok: Boolean(latestJson?.ok),
      schema: latestJson?.data?.schema || null,
      events_count: Array.isArray(latestJson?.data?.events) ? latestJson.data.events.length : 0,
      model: latestJson?.data?.vision_quality?.model || null
    };

    // 2. Live API check: POST /api/vision/youtube validation (bad URL -> 400)
    const ytBadRes = await fetch(`${baseUrl}/api/vision/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/invalid' })
    });
    const ytBadJson = await ytBadRes.json();
    result.checks.api_vision_youtube_validation = {
      status: ytBadRes.status,
      ok_rejected: ytBadRes.status === 400 && ytBadJson?.ok === false,
      error: ytBadJson?.error || null
    };

    // 3. Browser Live E2E: Muat Vision Terbaru -> Simpan ke Data Laga -> Laporan A4 -> Upload MP4 langsung
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await context.addInitScript(() => {
      localStorage.setItem('ballr_tour_done_v1', '1');
      localStorage.setItem('ballr_role_tutorial_done_v1_coach', 'true');
      localStorage.setItem('ballr_role_tutorial_done_v1_parent', 'true');
      localStorage.setItem('ballr_role_tutorial_done_v1_public', 'true');
      localStorage.setItem('ballr_demo_role', 'coach');
    });

    const page = await context.newPage();
    page.on('pageerror', (err) => result.page_errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') result.console_errors.push(msg.text());
    });

    // Open LoggerPage first and verify shortcut button jumps directly to ?tab=tactical
    await page.goto(`${baseUrl}/pencatatan/demo-match-draft-02`, { waitUntil: 'networkidle' });
    const shortcutBtn = page.getByTestId('shortcut-tactical-analysis-btn');
    await shortcutBtn.waitFor({ state: 'visible', timeout: 15000 });
    await shortcutBtn.click();

    await page.getByTestId('vision-automation-toolbar').waitFor({ state: 'visible', timeout: 15000 });
    const halfPanelVisible = await page.getByTestId('vision-half-window-panel').isVisible();
    const landedUrl = page.url();
    result.checks.ui_logger_shortcut_and_half_panel = {
      ok: landedUrl.includes('tab=tactical') && halfPanelVisible,
      url: landedUrl,
      half_window_panel_visible: halfPanelVisible
    };

    // Click "Muat Vision Terbaru"
    await page.getByRole('button', { name: /Muat Vision Terbaru/i }).click();
    await page.getByTestId('vision-quality-banner').waitFor({ state: 'visible', timeout: 10000 });

    const techniqueVisible = await page.getByTestId('playing-technique-section').isVisible();
    const strategyVisible = await page.getByTestId('opponent-strategy-section').isVisible();
    const counterVisible = await page.getByTestId('counter-tactics-section').isVisible();
    const saveBtnVisible = await page.getByTestId('save-vision-to-match-btn').isVisible();

    result.checks.ui_load_latest_vision = {
      ok: techniqueVisible && strategyVisible && counterVisible && saveBtnVisible,
      technique_visible: techniqueVisible,
      strategy_visible: strategyVisible,
      counter_tactics_visible: counterVisible,
      save_button_visible: saveBtnVisible
    };

    // Click "Simpan ke Data Laga"
    if (saveBtnVisible) {
      await page.getByTestId('save-vision-to-match-btn').click();
      const saveOutcome = await Promise.race([
        page.locator('text=/Tersimpan .* kejadian hasil analisis otomatis/i')
          .waitFor({ state: 'visible', timeout: 8000 })
          .then(() => 'saved'),
        page.locator('[role="alert"]')
          .waitFor({ state: 'visible', timeout: 8000 })
          .then(async () => `alert:${await page.locator('[role="alert"]').first().textContent()}`)
      ]).catch(async () => {
        const toolbarText = await page.getByTestId('vision-automation-toolbar').textContent();
        return `timeout:${toolbarText?.slice(0, 300)}`;
      });
      result.checks.ui_save_to_match = {
        ok: saveOutcome === 'saved',
        outcome: saveOutcome
      };
    }

    // Check A4 Match Report page renders saved events + technique + opponent strategy + counter-tactics
    await page.goto(`${baseUrl}/laga/demo-match-draft-02/laporan`, { waitUntil: 'networkidle' });
    await page.getByTestId('report-tactical-summary').waitFor({ state: 'visible', timeout: 15000 });
    const reportTechVis = await page.getByTestId('report-technique-and-strategy').isVisible();
    const reportCtVis = await page.getByTestId('report-counter-tactics').isVisible();
    await page.screenshot({ path: path.join(outDir, 'qa-vision-report-a4.png'), fullPage: false });

    result.checks.ui_report_a4 = {
      ok: reportTechVis && reportCtVis,
      technique_and_strategy_visible: reportTechVis,
      counter_tactics_visible: reportCtVis
    };

    // 4. Test real MP4 upload in browser analyzer using Half 1 custom window (01:10 - 01:30)
    const sampleMp4 = path.join(rootDir, 'vision', 'ams_seyegan_vs_ps_palma_clip.mp4');
    if (fs.existsSync(sampleMp4) && fs.statSync(sampleMp4).size > 1024) {
      await page.goto(`${baseUrl}/laga/demo-match-draft-02?tab=tactical`, { waitUntil: 'networkidle' });
      await page.getByTestId('vision-automation-toolbar').waitFor({ state: 'visible', timeout: 10000 });

      // Set Half 1 window to 01:10 - 01:30 to skip intro and scan active gameplay fast
      await page.locator('#vision-h1-start').fill('01:10');
      await page.locator('#vision-h1-end').fill('01:30');

      const videoInput = page.locator('input[aria-label="Unggah video MP4 atau WebM untuk analisis di browser"]');
      const tStart = Date.now();
      await videoInput.setInputFiles(sampleMp4);

      const outcome = await Promise.race([
        page.locator('[data-testid="vision-quality-banner"]:has-text("BallR In-Browser Pitch-Aware CV")')
          .waitFor({ state: 'visible', timeout: 90000 })
          .then(() => 'success'),
        page.locator('[role="alert"]')
          .waitFor({ state: 'visible', timeout: 90000 })
          .then(async () => `error:${await page.locator('[role="alert"]').textContent()}`)
      ]);

      const bannerText = outcome === 'success'
        ? await page.getByTestId('vision-quality-banner').textContent()
        : null;
      await page.screenshot({ path: path.join(outDir, 'qa-browser-mp4-vision.png'), fullPage: false });

      result.checks.ui_browser_mp4_upload = {
        ok: outcome === 'success',
        outcome,
        elapsed_ms: Date.now() - tStart,
        banner_excerpt: bannerText ? bannerText.slice(0, 260) : null
      };
    } else {
      result.checks.ui_browser_mp4_upload = {
        ok: false,
        skipped: true,
        reason: 'vision/ams_seyegan_vs_ps_palma_clip.mp4 not found or empty'
      };
    }
  } catch (err) {
    result.fatal_error = err?.stack || err?.message || String(err);
  } finally {
    if (browser) await browser.close();
    await server.close();
    result.finished_at = new Date().toISOString();
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  }

  console.log(JSON.stringify(result, null, 2));

  const allOk =
    !result.fatal_error &&
    result.checks.api_vision_latest?.ok &&
    result.checks.api_vision_youtube_validation?.ok_rejected &&
    result.checks.ui_logger_shortcut_and_half_panel?.ok &&
    result.checks.ui_load_latest_vision?.ok &&
    result.checks.ui_save_to_match?.ok &&
    result.checks.ui_report_a4?.ok &&
    result.checks.ui_browser_mp4_upload?.ok &&
    result.page_errors.length === 0;

  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
