// Offline audio editing for the sound build: decode with ffmpeg, edit in JS, encode with ffmpeg.
// A sound is { ch: [Float32Array, ...] } at SR (one array per channel); every function returns a new sound.

import { spawnSync } from 'node:child_process';

export const SR = 48000;
export const length = s => s.ch[0].length;
export const seconds = s => length(s) / SR;
const map = (s, f) => ({ ch: s.ch.map((c, i) => f(c, i)) });
const dbToGain = db => 10 ** (db / 20);

// ---- input / output -----------------------------------------------------------------------------
// from / to in seconds; af: an optional ffmpeg filter chain (atempo, ...) applied after the cut
export function decode(path, { from = 0, to = null, channels = 1, af = null } = {}) {
  const args = ['-v', 'error', '-i', path, '-ss', String(from)];
  if (to !== null) args.push('-to', String(to));
  if (af) args.push('-af', af);
  args.push('-ac', String(channels), '-ar', String(SR), '-f', 'f32le', '-');
  const r = spawnSync('ffmpeg', args, { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${path}: ${r.stderr}`);
  const raw = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
  const n = raw.length / channels;
  return { ch: Array.from({ length: channels }, (_, c) => Float32Array.from({ length: n }, (_, i) => raw[i * channels + c])) };
}
export function encode(s, path, { bitrate = '128k' } = {}) {
  const n = length(s), C = s.ch.length, inter = new Float32Array(n * C);
  for (let i = 0; i < n; i++) for (let c = 0; c < C; c++) inter[i * C + c] = s.ch[c][i];
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', String(C), '-i', '-',
    '-c:a', 'libmp3lame', '-b:a', bitrate, path], { input: Buffer.from(inter.buffer) });
  if (r.status !== 0) throw new Error(`ffmpeg could not encode ${path}: ${r.stderr}`);
}

// ---- cutting and level ---------------------------------------------------------------------------
export const silence = (sec, channels = 1) => ({ ch: Array.from({ length: channels }, () => new Float32Array(Math.round(sec * SR))) });
export const slice = (s, from, to = seconds(s)) => map(s, c => c.slice(Math.round(from * SR), Math.round(to * SR)));
export const gain = (s, db) => { const g = dbToGain(db); return map(s, c => c.map(v => v * g)); };
export const reverse = s => map(s, c => c.slice().reverse());
export const mono = s => s.ch.length === 1 ? s : { ch: [s.ch[0].map((v, i) => s.ch.reduce((a, c) => a + c[i], 0) / s.ch.length)] };
export const stereo = s => s.ch.length === 2 ? s : { ch: [s.ch[0].slice(), s.ch[0].slice()] };
export function peakDb(s) { let p = 0; for (const c of s.ch) for (const v of c) p = Math.max(p, Math.abs(v)); return 20 * Math.log10(p + 1e-12); }
// loudest 50 ms window, RMS over the channels: a stand-in for how loud a short sound feels
export function punchDb(s) {
  const W = Math.round(0.05 * SR), n = length(s); let best = 0;
  for (let i = 0; i + W <= Math.max(W, n); i += W / 5) {
    let e = 0; for (const c of s.ch) for (let j = i; j < Math.min(n, i + W); j++) e += c[j] ** 2;
    best = Math.max(best, e / (W * s.ch.length));
  }
  return 10 * Math.log10(best + 1e-12);
}
export function rmsDb(s) { let e = 0; for (const c of s.ch) for (const v of c) e += v * v; return 10 * Math.log10(e / (length(s) * s.ch.length) + 1e-12); }
export const normalize = (s, peak = -1) => gain(s, peak - peakDb(s));
// level a sound to a punch target, then keep its peaks under the ceiling with a soft knee
export function level(s, punch = -14, ceiling = -1) {
  const out = gain(s, punch - punchDb(s)), c = dbToGain(ceiling);
  return map(out, ch => ch.map(v => Math.abs(v) <= c * 0.7 ? v : Math.sign(v) * (c * 0.7 + c * 0.3 * Math.tanh((Math.abs(v) - c * 0.7) / (c * 0.3)))));
}
// remove leading / trailing audio under thresholdDb (relative to the peak)
export function trim(s, thresholdDb = -50) {
  const t = dbToGain(peakDb(s) + thresholdDb), n = length(s); let a = 0, z = n - 1;
  const loud = i => s.ch.some(c => Math.abs(c[i]) > t);
  while (a < n && !loud(a)) a++;
  while (z > a && !loud(z)) z--;
  return map(s, c => c.slice(a, z + 1));
}

// ---- envelopes -------------------------------------------------------------------------------------
// fade in / out in seconds; 'smooth' is a raised cosine, 'lin' is linear, 'fast' is a quick exponential tail
export function fade(s, fadeIn = 0, fadeOut = 0, shape = 'smooth') {
  const n = length(s), a = Math.round(fadeIn * SR), b = Math.round(fadeOut * SR);
  const curve = x => shape === 'lin' ? x : shape === 'fast' ? x ** 3 : 0.5 - 0.5 * Math.cos(Math.PI * x);
  return map(s, c => c.map((v, i) => v * (i < a ? curve(i / a) : 1) * (i >= n - b ? curve((n - 1 - i) / b) : 1)));
}
// gain curve through [time s, dB] points, linear in dB between them
export function envelope(s, points) {
  const n = length(s);
  return map(s, c => c.map((v, i) => {
    const t = i / SR; let k = 0; while (k < points.length - 1 && points[k + 1][0] <= t) k++;
    const [t0, d0] = points[k], [t1, d1] = points[Math.min(k + 1, points.length - 1)];
    const d = t1 > t0 ? d0 + (d1 - d0) * Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : d0;
    return v * dbToGain(d);
  }));
}

// ---- filters (RBJ biquads) ----------------------------------------------------------------------------
export function biquad(s, type, freq, q = Math.SQRT1_2, db = 0) {
  const w = 2 * Math.PI * Math.min(freq, SR * 0.49) / SR, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q), A = 10 ** (db / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (type === 'peak') { b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A; }
  else if (type === 'lowshelf' || type === 'highshelf') {
    const sq = 2 * Math.sqrt(A) * alpha, sgn = type === 'lowshelf' ? 1 : -1;
    b0 = A * ((A + 1) - sgn * (A - 1) * cos + sq); b1 = 2 * sgn * A * ((A - 1) - sgn * (A + 1) * cos); b2 = A * ((A + 1) - sgn * (A - 1) * cos - sq);
    a0 = (A + 1) + sgn * (A - 1) * cos + sq; a1 = -2 * sgn * ((A - 1) + sgn * (A + 1) * cos); a2 = (A + 1) + sgn * (A - 1) * cos - sq;
  } else throw new Error(`unknown filter ${type}`);
  return map(s, c => {
    const out = new Float32Array(c.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < c.length; i++) {
      const y = (b0 * c[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = c[i]; y2 = y1; y1 = y; out[i] = y;
    }
    return out;
  });
}
export const highpass = (s, f, q) => biquad(s, 'highpass', f, q);
export const lowpass = (s, f, q) => biquad(s, 'lowpass', f, q);
export const bandpass = (s, f, q) => biquad(s, 'bandpass', f, q);
export const peak = (s, f, q, db) => biquad(s, 'peak', f, q, db);
export const lowshelf = (s, f, db) => biquad(s, 'lowshelf', f, Math.SQRT1_2, db);
export const highshelf = (s, f, db) => biquad(s, 'highshelf', f, Math.SQRT1_2, db);

// ---- pitch and time -------------------------------------------------------------------------------------
// read the sound at a playback rate that may change over time (rate(t) with t the output time in s):
// > 1 is higher and shorter, < 1 lower and longer. Hermite interpolation; low-passed first when sped up.
export function varispeed(s, rate) {
  const r = typeof rate === 'number' ? () => rate : rate;
  let src = s, maxRate = 1;
  for (let t = 0; t < seconds(s) * 4; t += 0.005) maxRate = Math.max(maxRate, r(t));
  if (maxRate > 1) src = lowpass(lowpass(s, SR * 0.45 / maxRate), SR * 0.45 / maxRate);
  return map(src, c => {
    const out = []; let pos = 0, i = 0;
    while (pos < c.length - 2) {
      const k = Math.floor(pos), f = pos - k, y0 = c[k - 1] ?? 0, y1 = c[k], y2 = c[k + 1], y3 = c[k + 2] ?? 0;
      out.push(y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0))));
      pos += r(i / SR); i++;
    }
    return Float32Array.from(out);
  });
}
export const pitch = (s, semitones) => varispeed(s, 2 ** (semitones / 12));
// a rate gliding exponentially from r0 to r1 over sec, then holding r1
export const glide = (s, r0, r1, sec) => varispeed(s, t => r0 * (r1 / r0) ** Math.min(1, t / sec));

// ---- combining ---------------------------------------------------------------------------------------------
// parts: [sound, at (s), dB = 0]; the result has as many channels as the widest part
export function mix(parts) {
  const C = Math.max(...parts.map(([s]) => s.ch.length));
  const n = Math.max(...parts.map(([s, at]) => Math.round(at * SR) + length(s)));
  const out = Array.from({ length: C }, () => new Float32Array(n));
  for (const [s, at, db = 0] of parts) {
    const o = Math.round(at * SR), g = dbToGain(db);
    for (let c = 0; c < C; c++) { const src = s.ch[Math.min(c, s.ch.length - 1)]; for (let i = 0; i < src.length; i++) out[c][o + i] += src[i] * g; }
  }
  return { ch: out };
}
export const concat = (...sounds) => { let at = 0; return mix(sounds.map(s => { const p = [s, at]; at += seconds(s); return p; })); };

// A seamless loop: the last xfade seconds are cross-faded (equal power) into the start, so the material
// repeats every (length - xfade). The file gets `margin` seconds of the loop on each side, so the loop
// points stay seamless even if a decoder shifts the audio by a few milliseconds.
export function loop(s, xfade, margin = 0.25) {
  const n = length(s), X = Math.round(xfade * SR), L = n - X, M = Math.round(margin * SR);
  const body = map(s, c => {
    const b = c.slice(0, L);
    for (let i = 0; i < X; i++) { const x = i / X; b[i] = c[i] * Math.sin(0.5 * Math.PI * x) + c[L + i] * Math.cos(0.5 * Math.PI * x); }
    return b;
  });
  const file = map(body, c => { const f = new Float32Array(L + 2 * M); for (let i = 0; i < f.length; i++) f[i] = c[((i - M) % L + L) % L]; return f; });
  return { sound: file, loopStart: M / SR, loopEnd: (M + L) / SR };
}
