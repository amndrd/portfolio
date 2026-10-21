// Records the site's audio over a scripted run timed like the reference clip:
// page load = frame 0, cell selected at frame 149, LAUNCH at frame 500, stop at frame 700.
// The audio output is teed into a MediaRecorder; writes <out>.webm and prints the frame the recording started.
// usage: node record-audio.mjs [url] [out]
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const out = process.argv[3] || 'site-audio';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });   // small viewport keeps the frame rate up
page.on('pageerror', e => console.error('page error:', e.message));

// tee everything that reaches the speakers into a recorder
await page.addInitScript(() => {
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const result = connect.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode) {
      const ctx = dest.context;
      if (!ctx.__tap) {
        ctx.__tap = ctx.createMediaStreamDestination();
        const rec = new MediaRecorder(ctx.__tap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 });
        const chunks = [];
        rec.ondataavailable = e => chunks.push(e.data);
        rec.start();
        window.__recording = { rec, chunks, frame: window.__portfolio ? window.__portfolio().frame : 0 };
      }
      connect.call(this, ctx.__tap);
    }
    return result;
  };
});

const frame = () => page.evaluate(() => window.__portfolio ? window.__portfolio().frame : -1);
const waitFrame = async f => { while ((await frame()) < f) await page.waitForTimeout(4); };
const click = async (x, y) => { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.up(); };

await page.goto(url);
await page.waitForFunction(() => window.__portfolio && window.__portfolio().frame >= 0);
await click(10, 530);                       // first gesture starts the audio (empty area)
await waitFrame(149); await click(270, 165); // cell 01
const selectionStart = (await page.evaluate(() => window.__portfolio().selectionStart));
await waitFrame(500); await click(850, 487); // LAUNCH
const launchStart = (await page.evaluate(() => window.__portfolio().launchStart));
await waitFrame(700);
const data = await page.evaluate(() => new Promise(resolve => {
  const { rec, chunks, frame } = window.__recording;
  rec.onstop = async () => {
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    resolve({ b64: btoa(s), frame });
  };
  rec.stop();
}));
writeFileSync(`${out}.webm`, Buffer.from(data.b64, 'base64'));
console.log(JSON.stringify({ file: `${out}.webm`, startFrame: data.frame, selectionStart, launchStart }));
await browser.close();
