// Screenshots of a prototype page.
// usage: node capture.mjs <html file> <out dir> <name>=<query> [<name>=<query> ...] [--size=1920x1080] [--wait=1500]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [file, outDir, ...shots] = args.filter(a => !a.startsWith('--'));
const [width, height] = (flags.size || '1920x1080').split('x').map(Number);
const wait = Number(flags.wait || 1500);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: Number(flags.dpr || 1) });
page.on('pageerror', e => console.error('page error:', e.message));
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));

for (const shot of shots) {
  const cut = shot.indexOf('=');
  const name = cut < 0 ? shot : shot.slice(0, cut);
  const query = cut < 0 ? '' : shot.slice(cut + 1);
  await page.goto(`${pathToFileURL(path.resolve(file))}?${query}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  await page.waitForTimeout(wait);
  const out = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: out });
  console.log(out);
}
await browser.close();
