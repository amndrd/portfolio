// Frame-by-frame export of a prototype driven by window.__setFrame(f).
// usage: node sequence.mjs <html file> <out dir> <query> <from> <to> [--size=1920x1080]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [file, outDir, query, from, to] = args.filter(a => !a.startsWith('--'));
const [width, height] = (flags.size || '1920x1080').split('x').map(Number);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height } });
page.on('pageerror', e => console.error('page error:', e.message));
await page.goto(`${pathToFileURL(path.resolve(file))}?freeze=1&hud=0&${query}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });

for (let f = Number(from); f <= Number(to); f++) {
  await page.evaluate(n => window.__setFrame(n), f);
  await page.screenshot({ path: path.join(outDir, `f_${String(f).padStart(4, '0')}.png`) });
}
console.log(`${Number(to) - Number(from) + 1} frames -> ${outDir}`);
await browser.close();
