import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = process.env.E2E_PORT || '4173';
const URL = process.env.E2E_URL || `http://localhost:${PORT}/`;
const STARTUP_TIMEOUT_MS = 30000;
const RESULTS = [];

const log = (status, name, detail = '') => {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '·';
  console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
  RESULTS.push({ status, name, detail });
};

const TODAY = new Date();
const TODAY_YEAR = TODAY.getFullYear();
const TODAY_MONTH = TODAY.getMonth();
const TODAY_DAY = TODAY.getDate();

function expectedWeekFromDay(year, month, day) {
  const date = new Date(year, month, day);
  const dow = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dow);
  const startOfYear = new Date(year, 0, 1);
  const startDow = startOfYear.getDay();
  const firstSunday = new Date(startOfYear);
  firstSunday.setDate(1 - startDow);
  const sundayUTC = Date.UTC(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
  const firstUTC = Date.UTC(firstSunday.getFullYear(), firstSunday.getMonth(), firstSunday.getDate());
  const diffDays = Math.round((sundayUTC - firstUTC) / 86400000);
  return Math.max(0, Math.min(51, Math.floor(diffDays / 7)));
}

function startPreview() {
  if (process.env.E2E_URL) return null;
  const child = spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CF_PAGES: 'true' },
    detached: true,
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('vite preview did not start in time'));
    }, STARTUP_TIMEOUT_MS);
    let buf = '';
    const onData = (data) => {
      buf += data.toString();
      if (buf.includes('Local:')) {
        clearTimeout(timer);
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(new Error(`vite preview exited with code ${code}\n${buf}`));
      }
    });
  });
}

async function clearAndReload(page) {
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

async function setSettings(page, settings) {
  await page.evaluate((s) => {
    localStorage.setItem('yearwheel_settings', JSON.stringify(s));
  }, settings);
}

async function runTests(page, consoleErrors) {
  await page.goto(URL);
  await page.waitForLoadState('networkidle');

  await clearAndReload(page);
  if (consoleErrors.length === 0) log('PASS', 'Initial load: no console errors');
  else log('FAIL', 'Initial load: console errors', consoleErrors.join(' | '));

  for (const m of ['old', 'rings', 'zoom']) {
    const exists = await page.locator(`input[type="radio"][value="${m}"]`).count();
    if (exists > 0) log('PASS', `Mode radio exists: ${m}`);
    else log('FAIL', `Mode radio missing: ${m}`);
  }

  await page.locator('input[type="radio"][value="zoom"]').first().click();
  await page.waitForTimeout(500);

  const monthSectors = await page.locator('.month-sector').count();
  if (monthSectors === 12) log('PASS', `Zoom year-level: 12 month sectors`);
  else log('FAIL', `Zoom year-level: expected 12, got ${monthSectors}`);

  let yearText = await page.locator('#currentYearText').first().textContent();
  if (yearText && parseInt(yearText) === TODAY_YEAR) log('PASS', `Year title shows ${TODAY_YEAR}`);
  else log('FAIL', `Year title mismatch`, `got '${yearText}', expected '${TODAY_YEAR}'`);

  const currMonthSector = page.locator(`.month-sector[data-value="${TODAY_MONTH}"]`).first();
  const currMonthCount = await currMonthSector.count();
  if (currMonthCount > 0) log('PASS', `Current month sector exists (month=${TODAY_MONTH})`);
  else log('FAIL', `Current month sector missing for month=${TODAY_MONTH}`);
  const stroke = await currMonthSector.evaluate((el) => el.getAttribute('stroke'));
  if (stroke && stroke.includes('255')) log('PASS', `Current month sector has highlight stroke`);
  else log('FAIL', `Current month sector lacks highlight stroke`, `stroke=${stroke}`);

  await currMonthSector.click({ force: true });
  await page.waitForTimeout(900);

  const expectedDays = new Date(TODAY_YEAR, TODAY_MONTH + 1, 0).getDate();
  const daySectors = await page.locator('.day-sector').count();
  if (daySectors === expectedDays) log('PASS', `Month-level: ${expectedDays} day sectors`);
  else log('FAIL', `Month-level: expected ${expectedDays}, got ${daySectors}`);

  const blueCircleCount = await page.locator('circle[fill="rgba(100, 200, 255, 0.9)"]').count();
  if (blueCircleCount === 1) log('PASS', `Today indicator: exactly 1 blue circle`);
  else log('FAIL', `Today indicator: expected 1, got ${blueCircleCount}`);

  const indicatorElements = await page.locator('[fill="#64c8ff"]').count();
  if (indicatorElements > 0) log('PASS', `Today arrow exists`);
  else log('FAIL', `Today arrow missing`);

  const todayDaySector = page.locator(`.day-sector[data-value="${TODAY_DAY}"]`).first();
  const todayDayCount = await todayDaySector.count();
  if (todayDayCount > 0) {
    await todayDaySector.click({ force: true });
    await page.waitForTimeout(900);

    const weekDaySectors = await page.locator('.day-sector').count();
    if (weekDaySectors === 7) log('PASS', `Click day → week level (7 days)`);
    else log('FAIL', `Click day: expected 7, got ${weekDaySectors}`);

    const hash = await page.evaluate(() => window.location.hash);
    const expectedWeek = expectedWeekFromDay(TODAY_YEAR, TODAY_MONTH, TODAY_DAY);
    if (hash.includes(`/week/${TODAY_YEAR}/${expectedWeek}`)) log('PASS', `Week URL correct (week ${expectedWeek})`);
    else log('FAIL', `Week URL`, `got '${hash}', expected /week/${TODAY_YEAR}/${expectedWeek}`);

    const currentSectorWithStroke = await page.locator('.day-sector[stroke="rgba(255, 255, 255, 0.6)"]').count();
    if (currentSectorWithStroke >= 1) log('PASS', `Week-level: today sector has highlight stroke`);
    else log('FAIL', `Week-level: today sector lacks stroke`);
  } else {
    log('FAIL', `Could not find today day sector for click test`);
  }

  await page.locator('button[aria-label="Go back"]').first().click();
  await page.waitForTimeout(900);
  const dayCount = await page.locator('.day-sector').count();
  if (dayCount === expectedDays) log('PASS', `Back from week → month`);
  else log('FAIL', `Back from week: expected ${expectedDays}, got ${dayCount}`);

  await page.locator('button[aria-label="Go back"]').first().click();
  await page.waitForTimeout(900);

  const prevYearBtn = page.locator('#prevYear').first();
  if (await prevYearBtn.count() > 0) {
    await prevYearBtn.click();
    await page.waitForTimeout(500);
    yearText = await page.locator('#currentYearText').first().textContent();
    if (yearText && parseInt(yearText) === TODAY_YEAR - 1) log('PASS', `Prev year: title=${TODAY_YEAR - 1}`);
    else log('FAIL', `Prev year title`, `got '${yearText}'`);
    const currMonthAfter = page.locator(`.month-sector[data-value="${TODAY_MONTH}"]`).first();
    const strokeAfter = await currMonthAfter.evaluate((el) => el.getAttribute('stroke'));
    if (!strokeAfter || !strokeAfter.includes('255, 255, 255, 0.6')) log('PASS', `Year change clears stale current marker`);
    else log('FAIL', `Stale current marker after year change`);
  } else {
    log('FAIL', `Prev year button not found`);
  }

  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  yearText = await page.locator('#currentYearText').first().textContent();
  if (yearText && parseInt(yearText) === TODAY_YEAR - 1) log('PASS', `Year persists across reload`);
  else log('FAIL', `Year not persisted`, `got '${yearText}'`);

  await setSettings(page, {
    showMoonPhase: true, showZodiac: false, showHebrewMonth: false,
    cornerRadius: 50, direction: -1,
    seasons: ['winter', 'spring', 'summer', 'autumn'],
    rotationOffset: 0, mode: 'zoom',
    currentYear: TODAY_YEAR,
    zoomState: { level: 'month', year: TODAY_YEAR + 5, month: 0 },
    theme: 'auto', locale: 'en'
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  yearText = await page.locator('#currentYearText').first().textContent();
  if (yearText && parseInt(yearText) === TODAY_YEAR) log('PASS', `Drift heal: title=${TODAY_YEAR} despite stale zoomState.year`);
  else log('FAIL', `Drift heal failed`, `title=${yearText}`);

  await clearAndReload(page);
  await page.locator('input[type="radio"][value="zoom"]').first().click();
  await page.waitForTimeout(400);
  const sectorBefore = await page.locator('.month-sector').first();
  const transformBefore = await sectorBefore.evaluate((el) => {
    const grp = el.closest('.sector-group');
    return grp ? grp.style.transform : null;
  });
  const box = await sectorBefore.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(700);
    const transformAfter = await sectorBefore.evaluate((el) => {
      const grp = el.closest('.sector-group');
      return grp ? grp.style.transform : null;
    });
    if (transformAfter && transformBefore !== transformAfter && transformAfter.includes('scale(1.')) {
      log('PASS', `Hover scale active: ${transformBefore} → ${transformAfter}`);
    } else {
      log('FAIL', `Hover does not scale`, `before='${transformBefore}', after='${transformAfter}'`);
    }
  }

  await clearAndReload(page);
  const oldRadio = page.locator('input[type="radio"][value="old"]').first();
  await oldRadio.click();
  await page.waitForTimeout(800);
  const shapeWrap = await page.locator('.shape-wrap').count();
  if (shapeWrap > 0) log('PASS', `Classic mode: shape-wrap rendered`);
  else log('FAIL', `Classic mode: shape-wrap missing`);

  const ringsRadio = page.locator('input[type="radio"][value="rings"]').first();
  await ringsRadio.click();
  await page.waitForTimeout(1500);
  if (page.url().includes('rings.html')) log('PASS', `Rings mode: navigated to rings.html`);
  else log('FAIL', `Rings mode: did not navigate`, `url=${page.url()}`);

  const w1 = expectedWeekFromDay(2026, 4, 5);
  if (w1 === 18) log('PASS', `Week formula post-DST: May 5 2026 = 18`);
  else log('FAIL', `Week formula DST: got ${w1}`);

  const w2 = expectedWeekFromDay(2024, 1, 29);
  if (typeof w2 === 'number' && w2 >= 0 && w2 <= 51) log('PASS', `Week formula leap year: Feb 29 2024 = ${w2}`);
  else log('FAIL', `Week formula leap year: got ${w2}`);

  const w3 = expectedWeekFromDay(2025, 11, 31);
  if (typeof w3 === 'number' && w3 <= 51) log('PASS', `Week formula year end: Dec 31 2025 = ${w3}`);
  else log('FAIL', `Week formula year end: got ${w3}`);
}

async function main() {
  let server = null;
  try {
    server = await startPreview();
  } catch (e) {
    if (process.env.E2E_URL) {
      // Skip server startup; assume external server
    } else {
      console.error('Failed to start preview server:', e.message);
      process.exit(2);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  let exitCode = 0;
  try {
    await runTests(page, consoleErrors);
  } catch (e) {
    console.error('Test run threw:', e);
    exitCode = 2;
  }

  await browser.close();
  if (server) {
    try {
      // Kill the whole process group so vite + descendants exit cleanly.
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      try { server.kill('SIGKILL'); } catch {}
    }
  }

  console.log('\n=== SUMMARY ===');
  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  if (fail > 0) {
    console.log('\nFailures:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ✗ ${r.name}${r.detail ? ': ' + r.detail : ''}`));
  }

  process.exit(exitCode || (fail > 0 ? 1 : 0));
}

main().catch((e) => { console.error('Fatal:', e); process.exit(2); });
