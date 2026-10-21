// End-to-end check of the site: boot, select a cell, panel, LAUNCH, terminal, detail page, HOME.
// usage: node site-test.mjs [url] [out dir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const out = process.argv[3] || '../captures/site';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const state = () => page.evaluate(() => window.__portfolio());
const until = (test, timeout = 30000) => page.waitForFunction(test, null, { timeout, polling: 50 });
const shot = name => page.screenshot({ path: path.join(out, `${name}.png`) });
const click = async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up(); };

await page.goto(url);
await until(() => window.__portfolio && window.__portfolio().bootDone);
await until(() => window.__portfolio().muteVisible);
await click(1810, 65);                                        // sound button: first click also starts the audio
const mutedOnce = (await state()).muted;
await page.mouse.move(1810, 65); await page.waitForTimeout(150);
await shot('0-son-coupe');
await click(1810, 65);
const unmuted = !(await state()).muted;
await page.mouse.move(1400, 900); await page.waitForTimeout(150);
await shot('0-son-actif');
await page.mouse.move(540, 330); await page.waitForTimeout(200);
await shot('1-grille');
await click(540, 330);                                        // cell 01
await until(() => window.__portfolio().panelReady);
await page.waitForTimeout(400);
await shot('2-panneau');
await click(1700, 975);                                       // LAUNCH
await until(() => window.__portfolio().launch === 'terminal');
await page.waitForTimeout(1200);
await shot('3-terminal');
await until(() => window.__portfolio().homeReady);
await page.mouse.move(960, 685); await page.waitForTimeout(200);
await shot('4-page-detail');
await click(960, 685);                                        // HOME
const back = await state();
await until(() => window.__portfolio().bootDone);
await shot('5-retour-grille');
await click(540, 330);
await until(() => window.__portfolio().panelReady);
await page.keyboard.press('Escape');                          // Esc from the panel
const esc = await state();
console.log(JSON.stringify({ mutedOnce, unmuted, afterHome: back, afterEsc: esc, errors }));
await browser.close();
