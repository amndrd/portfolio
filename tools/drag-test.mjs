// Drags down on the ASCII screen of prototype 10 and screenshots before / after, to check the vertical direction.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const [file, outDir] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${pathToFileURL(path.resolve(file))}?hud=0`);
await page.waitForFunction(() => window.__ready === true);
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outDir, 'drag-avant.png') });
await page.mouse.move(725, 520); await page.mouse.down();
for (let k = 1; k <= 20; k++) await page.mouse.move(725, 520 + k * 6);
await page.mouse.up(); await page.waitForTimeout(150);
await page.screenshot({ path: path.join(outDir, 'drag-apres-vers-le-bas.png') });
await browser.close();
