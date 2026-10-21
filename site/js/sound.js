// Synthesized interface sounds (Web Audio). Nothing is sampled: every sound is built from
// oscillators and filtered noise, tuned on coarse measurements of the reference (pitch regions,
// balance between bands, loudness over the room tone, duration).
// The audio context can only start on a user gesture: init() is called on the first click or key.

const Sound = (() => {
  let ac = null, out = null, noiseBuf = null, hissGain = null, humGain = null, drone = null, played = 0;
  let analyser = null, scope = null;
  let muted = false;
  try { muted = localStorage.getItem('portfolio.muted') === '1'; } catch {}
  const LEVEL = 0.8, HISS = 0.0045, HUM = 0.0076;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    out = ac.createGain(); out.gain.value = muted ? 0 : LEVEL;
    const shelf = ac.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 6500; shelf.gain.value = -9;   // tames the top end, like a small speaker
    out.connect(shelf).connect(comp).connect(ac.destination);
    analyser = ac.createAnalyser(); analyser.fftSize = 512; scope = new Float32Array(analyser.fftSize);
    out.connect(analyser);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startRoomTone();
  }
  const on = () => !!ac && !muted;
  const now = () => ac.currentTime;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- building blocks -------------------------------------------------------------------
  function envelope(t, peak, attack, decay) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }
  function osc(type, f0, f1, t, dur, peak, attack = 0.002) {
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(envelope(t, peak, attack, dur)).connect(out);
    o.start(t); o.stop(t + attack + dur + 0.03);
    played++;
  }
  function noise(type, f0, f1, q, t, dur, peak, attack = 0.001) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(f).connect(envelope(t, peak, attack, dur)).connect(out);
    s.start(t, Math.random() * 1.5); s.stop(t + attack + dur + 0.03);
    played++;
  }

  // ---- room tone: low hum (37 / 112 / 155 / 210 Hz) + hiss; both follow the activity on screen
  function startRoomTone() {
    const g = ac.createGain(); g.gain.value = HUM; humGain = g;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    for (const [f, a] of [[37, 1], [112, 0.3], [155, 0.2], [210, 0.13]]) {
      const o = ac.createOscillator(); o.frequency.value = f;
      const og = ac.createGain(); og.gain.value = a;
      o.connect(og).connect(lp); o.start();
    }
    lp.connect(g).connect(out);
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.35;
    const top = ac.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 5000;
    hissGain = ac.createGain(); hissGain.gain.value = HISS;
    s.connect(bp).connect(top).connect(hissGain).connect(out); s.start();
  }

  return {
    init,
    get muted() { return muted; },
    get played() { return played; },
    // output level, 0..1, for the sound bar
    level() {
      if (!analyser) return 0;
      analyser.getFloatTimeDomainData(scope);
      let sum = 0; for (const v of scope) sum += v * v;
      return Math.min(1, Math.sqrt(sum / scope.length) * 12);
    },
    setMuted(v) {
      muted = v;
      try { localStorage.setItem('portfolio.muted', v ? '1' : '0'); } catch {}
      if (ac) out.gain.setTargetAtTime(v ? 0 : LEVEL, now(), v ? 0.15 : 0.05);   // fades out with the sound bar
    },
    // room tone levels, as fractions of their normal level (tc: time constant in seconds)
    hiss(level = 1, tc = 0.08) { if (ac) hissGain.gain.setTargetAtTime(Math.max(0.0001, HISS * level), now(), tc); },
    hum(level = 1, tc = 0.08) { if (ac) humGain.gain.setTargetAtTime(Math.max(0.0001, HUM * level), now(), tc); },

    // digital crackle: a short burst around 550 Hz and 1.3 kHz with a little top end
    crackle(vol = 0.5) {
      if (!on()) return; const t = now(), d = rnd(0.012, 0.03);
      noise('bandpass', rnd(480, 620), rnd(480, 620), 3, t, d, 0.5 * vol);
      noise('bandpass', rnd(1150, 1450), rnd(1150, 1450), 4, t, d * 0.8, 0.7 * vol);
      noise('bandpass', 3200, 3200, 2, t, 0.008, 0.15 * vol);
      noise('highpass', 4000, 4000, 0.7, t, 0.008, 0.025 * vol);
    },
    // a cell vanishing: bright broadband shatter over a low body
    shatter(vol = 0.5) {
      if (!on()) return; const t = now();
      noise('bandpass', rnd(3000, 4200), rnd(3000, 4200), 1, t, 0.03, 0.3 * vol);
      noise('highpass', 6500, 6500, 0.7, t, 0.02, 0.03 * vol);
      noise('bandpass', rnd(500, 1400), rnd(500, 1400), 2, t, 0.02, 0.3 * vol);
      noise('lowpass', 300, 300, 0.7, t, 0.04, 0.4 * vol);
    },
    // tiny high tick: ruler marks, hover
    tick(f = 3000, vol = 0.5) {
      if (!on()) return;
      noise('bandpass', f, f, 6, now(), 0.01, 0.3 * vol);
    },
    // panel element lighting up: soft bip around 1.9 kHz over a 540 Hz body
    panelBip(vol = 0.5, f = 1940) {
      if (!on()) return; const t = now();
      osc('square', f, f, t, 0.04, 0.034 * vol);
      osc('triangle', 540, 540, t, 0.06, 0.025 * vol);
      noise('bandpass', 3200, 3200, 2, t, 0.012, 0.12 * vol);
    },
    // keyboard-like chatter for typed text
    type(vol = 0.5) {
      if (!on()) return; const f = rnd(2400, 4200);
      noise('bandpass', f, f, 10, now(), 0.008, 0.2 * vol);
    },
    // crosshair entering: low soft bip around 540 Hz
    beep() {
      if (!on()) return; const t = now();
      osc('triangle', 540, 540, t, 0.08, 0.016);
      osc('sine', 585, 585, t, 0.06, 0.006);
      noise('highpass', 3500, 3500, 0.7, t, 0.02, 0.03);
    },
    // crosshair travelling: airy hiss centred on ~2.7 kHz
    sweep(dur) {
      if (!on()) return;
      noise('bandpass', 2900, 3300, 7, now(), dur, 0.18, 0.08);
    },
    // cell selected: broadband burst, bright partials at 4.4 / 5.9 kHz, light low body
    click() {
      if (!on()) return; const t = now();
      noise('bandpass', 3800, 3800, 0.8, t, 0.14, 0.2);
      noise('highpass', 7000, 7000, 0.7, t, 0.06, 0.006);
      noise('bandpass', 750, 750, 0.9, t, 0.12, 0.07);
      noise('lowpass', 380, 380, 0.7, t, 0.1, 0.15);
      osc('square', 4430, 4430, t, 0.07, 0.03);
      osc('square', 5910, 5910, t, 0.05, 0.01);
      osc('sine', 120, 70, t, 0.1, 0.08);
    },
    // cell + crosshair moving to the top-left: bright air over a low rumble (175-250 Hz)
    whoosh(dur) {
      if (!on()) return; const t = now();
      noise('bandpass', 3600, 2800, 1.4, t, dur, 0.05, 0.05);
      noise('highpass', 6000, 6000, 0.7, t, dur * 0.7, 0.01, 0.04);
      noise('lowpass', 220, 160, 0.8, t, dur * 0.8, 0.025, 0.04);
      noise('bandpass', 700, 500, 1, t, dur * 0.7, 0.05, 0.04);
      osc('sine', 250, 175, t, dur * 0.6, 0.05, 0.03);
    },
    // ASCII view scanning in
    scan(dur) {
      if (!on()) return;
      noise('bandpass', 1500, 3600, 5, now(), dur, 0.08, 0.02);
    },
    // LAUNCH pressed: discreet
    confirm() {
      if (!on()) return;
      osc('sine', 175, 150, now(), 0.08, 0.012);
    },
    // hard cut of the panel; a faint low drone takes over while the log types
    cut() { this.hum(0.03, 0.005); this.hiss(0.06, 0.005); },
    droneStart(dur) {
      if (!ac) return; const t = now();
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.25);
      g.connect(out);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const dg = ac.createGain(); dg.gain.value = 0.0014; lp.connect(dg).connect(g);
      const oscs = [292, 457, 632].map(f => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(lp); return o; });
      for (const o of oscs) { o.start(t); o.stop(t + dur + 1); }
      const tex = ac.createBufferSource(); tex.buffer = noiseBuf; tex.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.7;
      const tg = ac.createGain(); tg.gain.value = 0.0008; tex.connect(bp).connect(tg).connect(g);
      tex.start(t); tex.stop(t + dur + 1);
      drone = { g, sources: [...oscs, tex] }; played++;
    },
    // cut to black: the drone stops dead, only the hum remains
    droneStop() {
      this.hiss(0.01, 0.005);
      if (!ac || !drone) return; const t = now();
      drone.g.gain.cancelScheduledValues(t); drone.g.gain.setValueAtTime(drone.g.gain.value, t); drone.g.gain.linearRampToValueAtTime(0, t + 0.015);
      for (const src of drone.sources) src.stop(t + 0.02);
      drone = null;
    },
    // BACK / HOME
    back() {
      if (!on()) return; const t = now();
      osc('triangle', 810, 540, t, 0.08, 0.05);
    },
  };
})();
