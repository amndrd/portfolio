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
  // ---- ambience ------------------------------------------------------------------------------------
  // a dark drone bed, looped from the steady part of the ambient track, its risers kept down and its top
  // rolled off: like the reference's room tone, it lives under 2 kHz
  room: { loop: true, xfade: 4, bitrate: '112k', build() {
    let s = cut('background-on', 3.0, 118.5, { channels: 2 });
    s = d.envelope(s, [[0, 0], [2.0, 0], [3.5, -6], [6.5, -6], [8.0, 0], [51, 0], [52.5, -6], [55.5, -6], [57, 0]]);
    s = d.lowpass(d.highshelf(d.lowshelf(d.highpass(s, 32), 110, 2), 2000, -6), 6000);
    return [s];
  } },

  // ---- grid ----------------------------------------------------------------------------------------
  // the grid powering up: the first two seconds of a terminal start-up, tightened to the boot (1.6 s), with a
  // grainy 900 / 445 Hz flicker for the reference's pulsing processing tone
  boot: { build() {
    const s = d.slice(src('System_Start_Up', { af: 'atempo=1.25' }), 0.12, 1.95);
    const flicker = d.fade(cut('Flickering_Signal', 0.35, 1.15), 0.08, 0.3);
    return [d.fade(d.highpass(d.mix([[s, 0], [d.highpass(flicker, 300), 0.15, -9]]), 45), 0.01, 0.6)];
  } },
  // one cell appearing: a quiet tick, a digital click with its attack rounded and its top rolled off above 2.5 kHz
  cell: { build() {
    return [['Scroll_Clicks', 0.090, 0.140], ['Scroll_Clicks', 0.200, 0.232], ['Techy_Glide', 0.176, 0.236], ['Techy_Glide', 0.652, 0.700]]
      .map(([k, a, b]) => d.lowpass(d.highpass(d.fade(cut(k, a, b), 0.003, (b - a) * 0.5), 150), 2500));
  } },
  // the thump under big elements appearing, three slightly different drops
  thump: { build: () => [thump(), thump(0.92), thump(1.08)] },

  // ---- pointer ---------------------------------------------------------------------------------------
  // over a button: a short chatter of bright scroll clicks (about 0.28 s), in the spirit of the igloo.inc hover
  hover: { build: () => [d.highpass(d.fade(cut('Scroll_Clicks', 0.085, 0.370), 0.001, 0.04), 300)] },
  // over a cell: a soft tick, one scroll click with its attack rounded and its top rolled off
  'hover-cell': { build: () => [[0.090, 0.140], [0.200, 0.232]].map(([a, b]) => d.lowpass(d.fade(cut('Scroll_Clicks', a, b), 0.004, 0.025), 3500)) },


  // ---- selection ----------------------------------------------------------------------------------------
  // the crosshair coming in: a soft low bloop (586 Hz) with its little hit
  select: { build: () => [d.fade(d.highpass(cut('Incoming_Droplet', 0.60, 1.00), 120), 0.003, 0.18)] },
  // the crosshair travelling to the cell (0.52 s): a targeting buzz, the tonal lines forming
  travel: { build() {
    const buzz = d.slice(src('Game_-_Cybernetic_Scan', { af: 'atempo=1.8' }), 0.06, 0.60);
    const lines = d.slice(src('Device_Scan', { af: 'atempo=1.7' }), 0.30, 0.84);
    return [d.fade(d.mix([[d.highpass(buzz, 70), 0], [d.highpass(lines, 1500), 0, -8]]), 0.06, 0.14)];
  } },
  // the click on the cell: retro bleep attack, a sub hit with a held chord, the lock-on accents of the scan,
  // and the thump with its low end lifted, for the reference's big low burst
  lock: { build() {
    const hit = d.fade(cut('Alien_Technology', 8.15, 9.25), 0.002, 0.45);
    const accents = d.fade(cut('Game_-_Cybernetic_Scan', 1.25, 1.75), 0.002, 0.2);
    const attack = d.fade(cut('Select_Retro_Bleep', 0.035, 0.10), 0.001, 0.03);
    const s = d.mix([[hit, 0], [accents, 0.01, -5], [attack, 0, -6], [thump(0.95), 0, -2]]);
    return [d.lowshelf(d.highpass(s, 30), 100, 4)];
  } },
  // the other cells vanish one per frame: one click per frame, falling in pitch and level, over a glitch bed
  vanish: { build() {
    const clicks = [[0.090, 0.130], [0.120, 0.150], [0.200, 0.232], [0.232, 0.262], [0.262, 0.290]].map(([a, b]) => clean(cut('Scroll_Clicks', a, b), 0.5, 200));
    const parts = Array.from({ length: 14 }, (_, i) => [d.pitch(clicks[i % clicks.length], 3 - i * 0.5), i / 60, -i * 0.9]);
    const bed = d.fade(d.highpass(cut('loading_bleeps', 0.15, 0.45), 400), 0.01, 0.15);
    return [d.mix([...parts, [bed, 0, -12]])];
  } },
  // the cell sliding to the top-left (0.68 s, eased): a tonal whoosh tightened to the move, over a low rumble
  // (the droplet's 140 Hz sub, slowed) that swells and settles with it
  move: { build() {
    const s = d.slice(src('Energy_Portal', { af: 'atempo=2.2' }), 0.04, 0.80);
    const rumble = d.lowpass(d.varispeed(cut('Incoming_Droplet', 0.15, 0.60), 0.8), 300);
    return [d.fade(d.mix([[d.highpass(s, 140), 0], [d.fade(rumble, 0.25, 0.3), 0.02, -5]]), 0.04, 0.18)];
  } },

  // ---- panel --------------------------------------------------------------------------------------------
  // one character typed: a tiny high beep (4-6 kHz), six of them so a line never repeats
  type: { build() {
    const beeps = [[0.232, 0.272, 1], [0.300, 0.345, 1], [1.414, 1.458, 1], [3.840, 3.885, 0.4], [4.978, 5.020, 0.45], [2.666, 2.706, 0.45]];
    return beeps.map(([a, b, rate]) => clean(d.varispeed(cut('single_beeps', a, b), rate), 0.6, 1200));
  } },
  // the rulers drawing (28 frames): 17 regular ticks lasting exactly as long as the rulers
  tick: { build: () => [d.fade(d.lowpass(d.highpass(cut('loading_bleeps', 1.440, 1.930), 250), 9000), 0.002, 0.03)] },
  // an element lighting up: a distorted analog beep brought down to 1.94 kHz, as on the reference
  panel: { build() {
    const beeps = [cut('Distorted Rhythmic', 0.072, 0.320), cut('Distorted Rhythmic', 0.860, 1.100)].map(s => d.varispeed(s, 0.9));
    const flutter = d.varispeed(cut('Alert_High_Beep', 0.095, 0.340), 0.56);
    return [...beeps, flutter].map(s => d.highpass(d.fade(s, 0.002, 0.09), 200));
  } },
  // a row of the lists: a short grainy flicker (445 / 900 Hz)
  row: { build: () => [cut('Flickering_Signal', 0.40, 0.52), cut('Flickering_Signal', 0.72, 0.84)].map(s => d.highpass(d.fade(s, 0.004, 0.05), 150)) },
  // a button appearing (LAUNCH, GITHUB, HOME): the two-step retro select bleep
  button: { build: () => [d.highpass(d.fade(cut('Select_Retro_Bleep', 0.030, 0.480), 0.001, 0.2), 150)] },
  // the ASCII view scanning in (0.2 s): a rising run of blips over rising arcs
  scan: { build() {
    const run = d.slice(src('Techy_Glide', { af: 'atempo=1.6' }), 0.50, 0.71);
    const arcs = d.reverse(cut('loading_bleeps', 0.92, 1.07));
    return [d.fade(d.highpass(d.mix([[run, 0], [arcs, 0.03, -6]]), 300), 0.005, 0.06)];
  } },

  // ---- launch ------------------------------------------------------------------------------------------------
  // LAUNCH pressed: dark and heavy, as on the reference: the sub hit with its chord rolled off, a deep thump
  // and only a hint of the retro attack
  launch: { build() {
    const hit = d.lowpass(d.fade(cut('Alien_Technology', 14.95, 16.40), 0.002, 0.5), 1500);
    const attack = d.fade(cut('Select_Retro_Bleep', 0.035, 0.10), 0.001, 0.03);
    return [d.lowshelf(d.highpass(d.mix([[hit, 0], [thump(0.85), 0, 0], [attack, 0, -14]]), 30), 100, 3)];
  } },
  // the panel cut off: a burst and a few flickers, ending dead; dark, the screen is going out
  cut: { build() {
    const flick = cut('Flickering_Signal', 0.60, 0.86), burst = cut('loading_bleeps', 0.065, 0.115);
    return [d.lowpass(d.fade(d.mix([[burst, 0], [flick, 0.02, -2]]), 0.001, 0.01), 1600)];
  } },
  // the panel texts backspaced: the computing chatter played backwards, quick and muffled
  erase: { build() {
    const s = d.reverse(d.slice(src('Techy_Glide', { af: 'atempo=1.5' }), 0.06, 0.50));
    return [d.lowpass(d.fade(d.highpass(s, 250), 0.01, 0.06), 2000)];
  } },
  // under the launch log: a low machine buzz, a held high chord and a data chatter, looped
  drone: { loop: true, xfade: 0.5, build() {
    const buzz = d.lowpass(cut('System_Start_Up', 0.8, 3.6), 900);
    const chord = d.highpass(cut('Alien_Technology', 15.6, 17.2), 1200);
    const chatter = d.highpass(cut('Techy_Glide', 0.09, 0.75), 2000);
    const bed = d.mix([[buzz, 0], [chord, 0.2, -20], [chord, 1.6, -22], [chatter, 0.3, -24], [chatter, 1.4, -25]]);
    return [d.slice(bed, 0, 2.8)];
  } },
  // the screen switching off: the start-up buzz falling in pitch, gone in half a second
  off: { build: () => [d.lowpass(d.fade(d.slice(d.glide(cut('System_Start_Up', 0.4, 1.6), 1.0, 0.3, 0.55), 0, 0.7), 0.003, 0.3, 'fast'), 2000)] },

  // ---- navigation ------------------------------------------------------------------------------------------
  // BACK / HOME: the select bloop a step lower
  back: { build: () => [d.fade(d.highpass(d.varispeed(cut('Incoming_Droplet', 0.60, 0.95), 0.8), 100), 0.003, 0.15)] },
  // the sound coming back on: two tiny 8-bit beeps going up
  toggle: { build() {
    const b = d.fade(cut('Minimal Beep', 0.040, 0.075), 0.001, 0.01);
    return [d.mix([[b, 0], [d.varispeed(b, 1.5), 0.07]])];
  } },
};
