// Checks the sounds in the browser: they load and play on the cues, the hover voice never stacks, mute
// silences everything, and without the sound files the site stays silent without errors.
// usage: node sound-test.mjs [url]   (needs the sounds built by sound/build.mjs)
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = {};

async function open(blockSounds) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (blockSounds) await page.route('**/sounds/**', r => r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(() => localStorage.clear());
  await page.goto(url);
  await page.evaluate(() => Sound.ready);
  await page.waitForFunction(() => window.__portfolio && window.__portfolio().bootDone, null, { timeout: 30000 });
  await page.mouse.click(10, 530);   // first gesture: the audio starts
  return { page, errors, played: () => page.evaluate(() => window.__portfolio().soundsPlayed) };
}

// hover: a fast sweep across a row of cells, then the hover voice count
{
  const { page, errors, played } = await open(false);
  const before = await played();
  for (const x of [270, 380, 480, 580, 690]) { await page.mouse.move(x, 165); await page.waitForTimeout(40); }
  const hovers = await played() - before;
  // mute: nothing more is started while muted
  await page.keyboard.press('m');
  const mutedAt = await played();
  for (const x of [270, 480, 690]) { await page.mouse.move(x, 270); await page.waitForTimeout(60); }
  const whileMuted = await played() - mutedAt;
  await page.keyboard.press('m');
  results.withSounds = { hovers, whileMuted, errors };
  await page.close();
}
// no sound files: silent, no errors
{
  const { page, errors, played } = await open(true);
  for (const x of [270, 480, 690]) { await page.mouse.move(x, 165); await page.waitForTimeout(60); }
  await page.mouse.click(270, 165); await page.waitForTimeout(3000);
  results.withoutSounds = { played: await played(), errors };
  await page.close();
}
console.log(JSON.stringify(results));
const ok = results.withSounds.hovers >= 4 && results.withSounds.whileMuted === 0 && !results.withSounds.errors.length
  && results.withoutSounds.played === 0 && !results.withoutSounds.errors.length;
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
