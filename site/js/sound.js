// Synthesized interface sounds (Web Audio). Nothing is sampled: every sound is built from
// oscillators and filtered noise, pitched after the reference (hum at 37 Hz and harmonics,
// boot crackle around 1.3 kHz, click partials at 4.4 / 5.9 kHz, panel bips around 1.9 kHz).
// The audio context can only start on a user gesture: init() is called on the first click or key.

const Sound = (() => {
  let ac = null, out = null, noiseBuf = null, whine = null, played = 0;
  let muted = false;
  try { muted = localStorage.getItem('portfolio.muted') === '1'; } catch {}
  const LEVEL = 0.7;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    out = ac.createGain(); out.gain.value = muted ? 0 : LEVEL;
    out.connect(comp).connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startHum();
  }
  const on = () => !!ac && !muted;
  const now = () => ac.currentTime;

  // ---- building blocks -------------------------------------------------------------------
  function envelope(t, peak, attack, decay) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }
  function lowpass(f, dest = out) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f;
    lp.connect(dest); return lp;
  }
  function osc(type, f0, f1, t, dur, peak, dest = out, attack = 0.002) {
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(envelope(t, peak, attack, dur)).connect(dest);
    o.start(t); o.stop(t + attack + dur + 0.03);
    played++;
  }
  function noise(type, f0, f1, q, t, dur, peak, dest = out, attack = 0.001) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    s.connect(f).connect(envelope(t, peak, attack, dur)).connect(dest);
    s.start(t, Math.random() * 1.5); s.stop(t + attack + dur + 0.03);
    played++;
  }

  // ---- room tone: low mains hum + faint hiss, always running ------------------------------
  function startHum() {
    const g = ac.createGain(); g.gain.value = 0.022;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    for (const [f, a] of [[37, 1], [74, 0.5], [111, 0.7], [148, 0.3], [185, 0.2]]) {
      const o = ac.createOscillator(); o.frequency.value = f;
      const og = ac.createGain(); og.gain.value = a;
      o.connect(og).connect(lp); o.start();
    }
    lp.connect(g).connect(out);
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 0.4;
    const hg = ac.createGain(); hg.gain.value = 0.006;
    s.connect(bp).connect(hg).connect(out); s.start();
  }

  return {
    init,
    get muted() { return muted; },
    get played() { return played; },
    setMuted(v) {
      muted = v;
      try { localStorage.setItem('portfolio.muted', v ? '1' : '0'); } catch {}
      if (ac) out.gain.setTargetAtTime(v ? 0 : LEVEL, now(), 0.03);
    },

    // tiny electric tick: boot brackets, hover, cells vanishing, backspace
    tick(f = 1300, vol = 0.5) {
      if (!on()) return; const t = now();
      noise('bandpass', f, f, 9, t, 0.012, 0.3 * vol);
      osc('square', f, f, t, 0.006, 0.03 * vol);
    },
    // short square bip: panel elements lighting up
    blip(f = 1940, vol = 0.5, dur = 0.045) {
      if (!on()) return;
      osc('square', f, f, now(), dur, 0.07 * vol, lowpass(3500));
    },
    // keyboard-like chatter for typed text
    type(vol = 0.5) {
      if (!on()) return; const f = 2200 + Math.random() * 2500;
      noise('bandpass', f, f, 12, now(), 0.008, 0.22 * vol);
    },
    // crosshair entering
    beep() {
      if (!on()) return; const t = now();
      osc('square', 1040, 1040, t, 0.07, 0.05, lowpass(3000));
      osc('sine', 2080, 2080, t, 0.05, 0.02);
    },
    // crosshair travelling to the cell
    sweep(dur) {
      if (!on()) return;
      noise('bandpass', 500, 2200, 6, now(), dur, 0.05, out, 0.06);
    },
    // cell selected: sharp click over a low thump
    click() {
      if (!on()) return; const t = now();
      noise('highpass', 3500, 3500, 0.7, t, 0.018, 0.45);
      osc('square', 4430, 4430, t, 0.008, 0.06);
      osc('square', 5910, 5910, t, 0.006, 0.03);
      osc('square', 1470, 1470, t, 0.02, 0.04);
      osc('sine', 110, 42, t, 0.22, 0.5);
      noise('lowpass', 900, 200, 1, t, 0.25, 0.12);
    },
    // cell + crosshair moving to the top-left
    whoosh(dur) {
      if (!on()) return; const t = now();
      noise('bandpass', 2600, 450, 3, t, dur, 0.12, out, 0.08);
      osc('sine', 520, 260, t, dur * 0.6, 0.03);
    },
    // ASCII view scanning in
    scan(dur) {
      if (!on()) return;
      noise('bandpass', 1200, 3800, 8, now(), dur, 0.06, out, 0.02);
    },
    // LAUNCH pressed
    confirm() {
      if (!on()) return; const t = now(), lp = lowpass(3000);
      osc('square', 660, 660, t, 0.06, 0.05, lp);
      osc('square', 990, 990, t + 0.08, 0.09, 0.05, lp);
    },
    // hard cut of the panel
    cut() {
      if (!on()) return; const t = now();
      noise('highpass', 2000, 2000, 0.7, t, 0.03, 0.4);
      osc('sine', 160, 50, t, 0.12, 0.35);
    },
    // terminal: high whistle and low drone rising while the log types
    whineStart(dur) {
      if (!on()) return; const t = now();
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + dur);
      g.connect(out);
      const hi = ac.createOscillator(); hi.type = 'sine';
      hi.frequency.setValueAtTime(6500, t); hi.frequency.linearRampToValueAtTime(8200, t + dur);
      const hg = ac.createGain(); hg.gain.value = 0.012; hi.connect(hg).connect(g);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const dg = ac.createGain(); dg.gain.value = 0.03; lp.connect(dg).connect(g);
      const drones = [297, 457].map(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); return o; });
      for (const o of [hi, ...drones]) { o.start(t); o.stop(t + dur + 0.5); }
      whine = g; played++;
    },
    // cut to black: everything collapses to a low thud
    powerOff() {
      if (!ac) return; const t = now();
      if (whine) { whine.gain.cancelScheduledValues(t); whine.gain.setValueAtTime(whine.gain.value, t); whine.gain.linearRampToValueAtTime(0, t + 0.02); whine = null; }
      if (!on()) return;
      osc('sine', 240, 28, t, 0.45, 0.4);
      noise('lowpass', 1500, 120, 0.8, t, 0.35, 0.18);
    },
    // BACK / HOME
    back() {
      if (!on()) return;
      osc('square', 1320, 660, now(), 0.08, 0.05, lowpass(3000));
    },
  };
})();
