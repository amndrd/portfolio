// Records the site over the scripted run of ../record-audio.mjs (timed like the reference clip), aligns it
// with the reference and compares them: stacked spectrograms and the level of each moment of the flow.
// usage: node check.mjs <reference video or audio> [out dir] [url]
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [ref, out = '../../captures/sound-check', url = 'http://127.0.0.1:8080/'] = process.argv.slice(2);
if (!ref) { console.error('usage: node check.mjs <reference video or audio> [out dir] [url]'); process.exit(1); }
mkdirSync(out, { recursive: true });
const run = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 30 }); if (r.status) throw new Error(r.stderr); return r.stdout; };

// record the site; the recording starts at the first gesture, startFrame frames after the page load
const rec = JSON.parse(run('node', [path.resolve(import.meta.dirname, '../record-audio.mjs'), url, path.join(out, 'site')]).trim().split('\n').pop());
const delay = Math.round(rec.startFrame / 60 * 1000);
const SPAN = 11.6;
run('ffmpeg', ['-v', 'error', '-y', '-i', ref, '-vn', '-ac', '2', '-ar', '48000', '-t', String(SPAN), path.join(out, 'ref.wav')]);
run('ffmpeg', ['-v', 'error', '-y', '-i', `${path.join(out, 'site')}.webm`, '-af', `adelay=${delay}:all=1,atrim=0:${SPAN}`, '-ac', '2', '-ar', '48000', path.join(out, 'site.wav')]);
for (const n of ['ref', 'site']) {
  run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, `${n}.wav`), '-lavfi',
    'showspectrumpic=s=1800x380:mode=combined:scale=log:fscale=log:legend=1:color=intensity:drange=90', path.join(out, `${n}.png`)]);
}
run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(out, 'ref.png'), '-i', path.join(out, 'site.png'), '-filter_complex', 'vstack', path.join(out, 'compare.png')]);

// level (RMS, dBFS) of each moment, in seconds from the page load
const mono = file => { const b = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 }).stdout; return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const rms = (x, a, b) => { let e = 0; const i0 = Math.round(a * 48000), i1 = Math.round(b * 48000); for (let i = i0; i < i1; i++) e += x[i] ** 2; return 10 * Math.log10(e / (i1 - i0) + 1e-12); };
// one-pole splits: lows under 200 Hz, highs over 1 kHz
const lows = x => { const y = new Float32Array(x.length), k = Math.exp(-2 * Math.PI * 200 / 48000); let v = 0; for (let i = 0; i < x.length; i++) y[i] = v = (1 - k) * x[i] + k * v; return y; };
const highs = x => { const y = new Float32Array(x.length), k = Math.exp(-2 * Math.PI * 1000 / 48000); let v = 0; for (let i = 0; i < x.length; i++) { v = (1 - k) * x[i] + k * v; y[i] = x[i] - v; } return y; };
const r = mono(path.join(out, 'ref.wav')), s = mono(path.join(out, 'site.wav'));
const bands = [['all', r, s], ['<200', lows(r), lows(s)], ['>1k', highs(r), highs(s)]];
const MOMENTS = [['grid boot', 0.45, 2.0], ['crosshair travel', 2.65, 3.15], ['lock', 3.45, 3.75], ['vanish + move', 3.75, 4.6],
  ['panel build', 4.6, 6.6], ['panel idle', 6.8, 8.2], ['launch', 8.33, 8.75], ['launch log', 8.9, 10.8], ['black', 10.9, 11.5]];
console.log(`moment            ${bands.map(([n]) => `${n.padStart(5)}: ref  site  diff`).join('   ')}`);
for (const [name, a, b] of MOMENTS) {
  console.log(`${name.padEnd(17)} ${bands.map(([, x, y]) => { const lr = rms(x, a, b), ls = rms(y, a, b); return `${lr.toFixed(0).padStart(11)} ${ls.toFixed(0).padStart(5)} ${(ls - lr).toFixed(1).padStart(5)}`; }).join('   ')}`);
}
console.log(`spectrograms: ${path.join(out, 'compare.png')}`);
