// Screenshots of the sound bar: on, hover, the calm-down after a click (every 0.1 s), off, and back on.
// usage: node soundbar-test.mjs [url] [out dir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const out = process.argv[3] || '../captures/sound-bar';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const crop = { x: 1600, y: 0, width: 320, height: 150 };
const shot = name => page.screenshot({ path: path.join(out, `${name}.png`), clip: crop });

await page.goto(url);
await page.waitForFunction(() => window.__portfolio && window.__portfolio().muteVisible, null, { timeout: 20000 });
await page.mouse.move(400, 900); await page.mouse.down(); await page.mouse.up();   // start the audio
await page.waitForTimeout(600);
await shot('1-on');
await page.mouse.move(1790, 68); await page.waitForTimeout(250);
await shot('2-hover');
await page.mouse.down(); await page.mouse.up();
for (let i = 1; i <= 8; i++) { await page.waitForTimeout(100); await shot(`3-off-${String(i * 100).padStart(4, '0')}ms`); }
await page.mouse.move(400, 900); await page.waitForTimeout(800);
await shot('4-off');
await page.mouse.move(1790, 68); await page.mouse.down(); await page.mouse.up(); await page.mouse.move(400, 900);
for (let i = 1; i <= 4; i++) { await page.waitForTimeout(100); await shot(`5-on-${String(i * 100).padStart(4, '0')}ms`); }
console.log(JSON.stringify({ muted: (await page.evaluate(() => window.__portfolio().muted)), errors }));
await browser.close();
