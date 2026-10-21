// Interface sounds: recorded sounds edited by tools/sound/build.mjs into sounds/ (kept out of the repository,
// so a fresh clone is simply silent), mixed and triggered here.
//   loops:     room (the ambience, always on), drone (under the launch log)
//   one-shots: boot, cell, thump, hover, select, travel, type, lock, vanish, move, tick, panel, row, button,
//              scan, launch, cut, erase, off, back, toggle
// The files are decoded as soon as the page loads; audio itself can only start on a user gesture.

const Sound = (() => {
  // level in dB, random detune in cents, voices that may overlap (the oldest is cut), fades in s
  const MIX = {
    room: { gain: -11, fadeIn: 2.5 },
    boot: { gain: -4 },
    cell: { gain: -15, detune: 250, voices: 6 },
    thump: { gain: -10, detune: 60, voices: 3 },
    hover: { gain: -16, detune: 120, voices: 1 },
    select: { gain: -10 },
    travel: { gain: -12 },
    lock: { gain: -4 },
    vanish: { gain: -13 },
    move: { gain: -13 },
  };
  let ac = null, master = null, sfx = null, bed = null, bedTone = null, manifest = null, room = null;
  const buffers = {}, playing = {}, last = {};
  let muted = false;
  try { muted = localStorage.getItem('portfolio.muted') === '1'; } catch {}
  const db = v => 10 ** (v / 20);

  // decode everything up front with an offline context (buffers work in any context): short sounds first
  const ready = (async () => {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC || !window.fetch) return;
    try { manifest = await (await fetch('sounds/manifest.json')).json(); } catch { return; }
    const decoder = new OAC(1, 1, 48000);
    const names = Object.keys(manifest).sort((a, b) => !!manifest[a].loop - !!manifest[b].loop);
    for (const name of names) {
      const files = await Promise.all(manifest[name].files.map(f =>
        fetch(`sounds/${f}`).then(r => r.arrayBuffer()).then(b => decoder.decodeAudioData(b)).catch(() => null)));
      buffers[name] = files.filter(Boolean);
      if (name === 'room') startRoom();
    }
  })();

  function init() {
    if (ac) { if (ac.state === 'suspended' && !document.hidden) ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    // a limiter on the way out, so stacked sounds never clip
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -8; limiter.knee.value = 6; limiter.ratio.value = 12; limiter.attack.value = 0.002; limiter.release.value = 0.15;
    master = ac.createGain(); master.gain.value = muted ? 0 : 1;
    master.connect(limiter).connect(ac.destination);
    sfx = ac.createGain(); sfx.connect(master);
    // the ambience has its own level and a low-pass, to muffle it under the launch sequence
    bedTone = ac.createBiquadFilter(); bedTone.type = 'lowpass'; bedTone.frequency.value = 18000; bedTone.Q.value = 0.5;
    bed = ac.createGain(); bed.connect(bedTone).connect(master);
    startRoom();
  }
  const now = () => ac.currentTime;

  function source(buffer, rate, gain, out) {
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = buffer; s.playbackRate.value = rate; g.gain.value = gain;
    s.connect(g).connect(out);
    return { s, g };
  }
  function fadeOut(v, sec) {
    const t = now();
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + sec);
    try { v.s.stop(t + sec + 0.01); } catch {}
  }
  function startRoom() {
    if (!ac || room || !buffers.room?.length) return;
    const [start, end] = manifest.room.loop;
    room = source(buffers.room[0], 1, 0, bed);
    room.s.loop = true; room.s.loopStart = start; room.s.loopEnd = end;
    room.s.start(now(), start);
    room.g.gain.linearRampToValueAtTime(db(MIX.room.gain), now() + MIX.room.fadeIn);
  }

  // nothing should keep playing in a tab nobody is looking at
  document.addEventListener('visibilitychange', () => {
    if (ac) document.hidden ? ac.suspend() : ac.resume();
  });

  return {
    init,
    ready,
    get muted() { return muted; },
    setMuted(v) {
      muted = v;
      try { localStorage.setItem('portfolio.muted', v ? '1' : '0'); } catch {}
      if (ac) master.gain.setTargetAtTime(v ? 0 : 1, now(), v ? 0.15 : 0.05);   // a short fade out
    },
    // one-shot; opts.rate shifts the pitch, opts.gain (dB) adjusts the level
    play(name, opts = {}) {
      const list = buffers[name], m = MIX[name] || {};
      if (!ac || muted || !list?.length) return;
      // a different variant each time when there are several
      let k = Math.floor(Math.random() * list.length);
      if (list.length > 1 && k === last[name]) k = (k + 1) % list.length;
      last[name] = k;
      const rate = (opts.rate || 1) * 2 ** ((Math.random() * 2 - 1) * (m.detune || 0) / 1200);
      const v = source(list[k], rate, db((m.gain || 0) + (opts.gain || 0)), sfx);
      v.s.start();
      const active = (playing[name] ||= []);
      active.push(v);
      v.s.onended = () => { const i = active.indexOf(v); if (i >= 0) active.splice(i, 1); };
      while (active.length > (m.voices || 8)) fadeOut(active.shift(), 0.015);
    },
    // held loops (drone): fade in, and fade out on stop
    start(name) {
      const list = buffers[name], m = MIX[name] || {}, info = manifest?.[name];
      if (!ac || !list?.length || playing[name]?.length) return;
      const v = source(list[0], 1, 0, sfx);
      if (info.loop) { v.s.loop = true; [v.s.loopStart, v.s.loopEnd] = info.loop; }
      v.s.start(now(), info.loop ? info.loop[0] : 0);
      v.g.gain.linearRampToValueAtTime(db(m.gain || 0), now() + (m.fadeIn || 0.01));
      playing[name] = [v];
    },
    stop(name) {
      for (const v of playing[name] || []) fadeOut(v, MIX[name]?.fadeOut || 0.05);
      playing[name] = [];
    },
    // the ambience: a level (dB, relative to its mix level) and a low-pass cutoff, reached in `sec`
    ambience(level = 0, cutoff = 18000, sec = 0.5) {
      if (!ac) return;
      const t = now();
      bed.gain.cancelScheduledValues(t); bed.gain.setValueAtTime(bed.gain.value, t); bed.gain.linearRampToValueAtTime(db(level), t + sec);
      bedTone.frequency.cancelScheduledValues(t); bedTone.frequency.setValueAtTime(bedTone.frequency.value, t);
      bedTone.frequency.exponentialRampToValueAtTime(cutoff, t + sec);
    },
  };
})();
