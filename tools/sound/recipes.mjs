// How each cue of the site is built from the source library in ../../sounds-src (not in the repository).
// Sources are found by a unique part of their file name. Each recipe returns the variants of its cue;
// times are in seconds and come from measuring the sources and the reference.

import { readdirSync } from 'node:fs';
import path from 'node:path';
import * as d from './dsp.mjs';

export const SRC_DIR = path.resolve(import.meta.dirname, '../../sounds-src');
const cache = new Map();
export function src(key, opts = {}) {
  const files = readdirSync(SRC_DIR).filter(f => !f.startsWith('.') && f.includes(key));
  if (files.length !== 1) throw new Error(`source "${key}": ${files.length ? `ambiguous (${files.join(', ')})` : 'not found'} in ${SRC_DIR}`);
  const id = JSON.stringify([files[0], opts]);
  if (!cache.has(id)) cache.set(id, d.decode(path.join(SRC_DIR, files[0]), opts));
  return cache.get(id);
}
const cut = (key, from, to, opts) => d.slice(src(key, opts), from, to);
const clean = (s, out = 0.3, hp = 80) => d.highpass(d.fade(s, 0.002, d.seconds(s) * out), hp);

// a low thump that drops in pitch, cut from a decaying 128 Hz bass note: about 200 Hz down to 54 Hz in 70 ms, then
// held, the way the reference's thumps fall; its harmonics keep it audible on small speakers
function thump(drop = 1) {
  const s = d.lowpass(cut('Notification_Beep', 0.10, 0.42), 1000);
  return d.fade(d.slice(d.glide(s, 1.6 * drop, 0.42 * drop, 0.07), 0, 0.36), 0.002, 0.2);
}

export const cues = {
};
