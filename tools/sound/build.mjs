// Builds the site's sounds from the source library: runs each recipe, levels the variants and writes
// site/sounds/<cue>[-n].mp3 plus site/sounds/manifest.json. Like the sources, the output stays out of git.
// usage: node build.mjs [cue ...]   (no cue: all of them)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as d from './dsp.mjs';
import { cues } from './recipes.mjs';

const OUT = path.resolve(import.meta.dirname, '../../site/sounds');
const BED = -20, PUNCH = -14, CEILING = -1;   // dBFS: beds on their average level, one-shots on their loudest 50 ms
const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const manifestFile = path.join(OUT, 'manifest.json');
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};

for (const [name, cue] of Object.entries(cues)) {
  if (only.length && !only.includes(name)) continue;
  const variants = cue.build(), entry = { files: [] };
  variants.forEach((v, i) => {
    let s;
    if (cue.loop) {
      const l = d.loop(d.gain(v, BED - d.rmsDb(v)), cue.xfade);
      s = l.sound; entry.loop = [+l.loopStart.toFixed(5), +l.loopEnd.toFixed(5)];
    } else s = d.level(d.trim(v, -60), PUNCH, CEILING);
    const file = `${name}${variants.length > 1 ? `-${i + 1}` : ''}.mp3`;
    d.encode(s, path.join(OUT, file), { bitrate: cue.bitrate ?? '128k' });
    entry.files.push(file);
    console.log(`${file.padEnd(14)} ${d.seconds(s).toFixed(2)} s  peak ${d.peakDb(s).toFixed(1)}  punch ${d.punchDb(s).toFixed(1)}  rms ${d.rmsDb(s).toFixed(1)}`);
  });
  manifest[name] = entry;
}
writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + '\n');
