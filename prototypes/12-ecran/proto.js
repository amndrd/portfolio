// Prototype 12: a Menu label beside the sound label, dropping down a command line.
// Loaded after the site's own scripts (index.html points <base> at ../../site/): it reuses their helpers,
// wraps drawSoundButton (drawn every frame) and targetAt (hit testing) and adds its own input.
// The console types in, runs an entry like a command (the prompt echoes it, its output types in below)
// and backspaces away when closed.
//   ?open=1 opens it once the grid has booted (screenshots); ?inv=1 / ?inv=0 forces the colours.
//   Switching the colours flickers the screen into the new mode (3 frames in, 3 back, then in).

(() => {
  const params = new URLSearchParams(location.search);
  if (params.has('inv')) setInverted(params.get('inv') === '1');

  const S = { menu: false, openAt: -1e9, closeAt: -1e9, sel: 0, cmd: null, flip: null, boxes: {}, menuBox: null,
    prevHover: null, shown: false, auto: false, sfxFrame: -1 };
  const dec = { start: -1e9, offs: new Array(8).fill(0) };
  const T = () => layout.C * 0.036 * 1920 / w;   // the site's frame thickness, in design units
  const light = () => S.flip ? S.flip.to : inverted;

  // ---- the Menu label, in the sound label's style -------------------------------------------------------
  function restart(f) { dec.start = f; dec.offs = dec.offs.map(() => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 4))); }
  function decoded(str, f) {
    const n = str.length, rel = f - dec.start; let out = '';
    for (let i = 0; i < n; i++) {
      const at = DECODE.reveal * (1 - Math.sqrt(1 - i / n));
      if (rel < at) break;
      const off = dec.offs[i], left = Math.max(0, Math.abs(off) - Math.floor((rel - at) / DECODE.step));
      out += str[i] === ' ' ? ' ' : String.fromCharCode(str.charCodeAt(i) + Math.sign(off) * left);
    }
    return out;
  }
  // icon + decoding text, the block ending at design x `right`; returns its hit box in design units
  function label(right, str, longest, f) {
    const [, y, , bh] = L.mute;
    ctx.save();
    const size = SOUND_SIZE * u, cap = size * 0.73, k = cap * 1.75, gap = size * 0.75;
    ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
    const cw = ctx.measureText('M').width, left = X(right) - (k * 1.12 + gap + cw * longest), cy = Y(y + bh / 2), rel = f - dec.start;
    ctx.fillStyle = OFF; ctx.fillRect(left - 10, Y(y), X(right) - left + 20, Y(bh));
    ctx.strokeStyle = ON; ctx.fillStyle = ON; ctx.lineWidth = size * 0.1; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.globalAlpha = rel >= 0 && rel < DECODE.dim ? 0.35 : 1;
    ctx.beginPath();   // a prompt: >_
    ctx.moveTo(left, cy - k * 0.32); ctx.lineTo(left + k * 0.36, cy); ctx.lineTo(left, cy + k * 0.32);
    ctx.moveTo(left + k * 0.5, cy + k * 0.36); ctx.lineTo(left + k, cy + k * 0.36);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(decoded(str, f), left + k * 1.12 + gap, cy + cap / 2);
    ctx.restore();
    const lx = left / w * 1920 - 6;
    return [lx, y, right - lx + 6, bh];
  }

  // ---- switching the colours ---------------------------------------------------------------------------
  function toggleScreen(f) {
    if (S.flip) return false;
    S.flip = { at: f, to: !inverted };
    Sound.play('cut', { gain: -10 }); Sound.play('thump', { gain: -8 });
    return true;
  }
  function flicker(f) {
    if (!S.flip) return;
    const rel = f - S.flip.at;
    if (rel >= 6) { setInverted(S.flip.to); S.flip = null; return; }
    inverted = blinkOn(rel, 0) ? S.flip.to : !S.flip.to;
  }

  // ---- entries: the value shown after the dots, and what running one does -------------------------------
  // run(f) returns the command the prompt echoes and the lines it prints, or null when nothing is printed
  const LINKS = { github: 'https://github.com/amndrd', linkedin: '', email: '' };   // empty: still to come
  const link = (id, cmd) => () => {
    if (!LINKS[id]) return { cmd, out: ['  (link to come)'] };
    window.open(LINKS[id], '_blank', 'noopener'); Sound.play('button', { gain: -4 });
    return { cmd, out: [] };
  };
  const ENTRY = {
    contact: { value: () => 'email', run: () => {
      if (!LINKS.email) return { cmd: 'contact', out: ['  (address to come)'] };
      navigator.clipboard?.writeText(LINKS.email).catch(() => {});
      return { cmd: 'contact', out: [`  ${LINKS.email}`, '  copied to the clipboard'] };
    } },
    github: { value: () => '@amndrd', ext: true, run: link('github', 'open github.com/amndrd') },
    linkedin: { value: () => 'profile', ext: true, run: link('linkedin', 'open linkedin') },
    screen: { value: () => light() ? 'light' : 'dark', run: f => toggleScreen(f) ? { cmd: `screen ${S.flip.to ? 'light' : 'dark'}`, out: [] } : null },
    // the grid powers up again (going home from a project already does)
    reboot: { value: () => 'grid', run: f => { closeMenu(f, true); if (selection || launch) goHome(f); else { resetBoot(f); hover = null; } return null; } },
  };
  const GROUPS = [['contact', 'github', 'linkedin'], ['screen', 'reboot']];
  const ITEMS = GROUPS.flat();

  function openMenu(f) { if (S.menu) return; S.menu = true; S.openAt = f; S.sel = 0; S.cmd = null; restart(f); Sound.play('select'); }
  function closeMenu(f, quiet) { if (!S.menu) return; S.menu = false; S.closeAt = f; restart(f); if (!quiet) Sound.play('back'); Sound.play('erase', { gain: -4 }); }
  function run(i, f) {
    S.sel = i;
    const r = ENTRY[ITEMS[i]].run(f);
    if (r) S.cmd = { ...r, at: f };
  }

  // ---- the console --------------------------------------------------------------------------------------
  const TERM = { x: 1360, y: 132, w: 520 }, LH = 44, COL = 20;   // value column, in characters
  const row = id => `  ${id} ${'.'.repeat(COL - id.length - 2)} ${ENTRY[id].value()}`;
  // static lines type in on open; the echoed command, its output and the next prompt type in when run
  function termLines() {
    const lines = [{ s: '> menu' }];
    GROUPS.forEach((g, gi) => { if (gi) lines.push({ s: '' }); g.forEach(id => lines.push({ s: row(id), id })); });
    if (S.cmd) lines.push({ s: `> ${S.cmd.cmd}`, cmd: true }, ...S.cmd.out.map(s => ({ s, cmd: true })));
    lines.push({ s: '> ', prompt: true, cmd: !!S.cmd });
    return lines;
  }
  // an arrow up and to the right after external links
  function extIcon(px, base, size) {
    const k = size * 0.5, x0 = px + size * 0.4, y0 = base - size * 0.06;
    ctx.lineWidth = size * 0.1; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + k, y0 - k);
    ctx.moveTo(x0 + k * 0.3, y0 - k); ctx.lineTo(x0 + k, y0 - k); ctx.lineTo(x0 + k, y0 - k * 0.3);
    ctx.stroke();
  }
  function drawTerm(f) {
    const o = f - S.openAt, c = f - S.closeAt, lines = termLines(), len = l => l.s.length;
    const total = lines.reduce((a, l) => a + len(l), 0), base = lines.filter(l => !l.cmd).reduce((a, l) => a + len(l), 0);
    const ran = lines.filter(l => l.cmd).reduce((a, l) => a + len(l), 0);
    let a = S.menu ? Math.floor((o - 6) * 5) : Infinity, b = S.cmd ? Math.floor((f - S.cmd.at) * 3) : 0, e = S.menu ? Infinity : total - c * 9;
    if (!S.menu && e <= -20) return;
    // a key click every other frame while characters come in
    if (S.menu && f !== S.sfxFrame && f % 2 === 0 && ((a > 0 && a < base) || (S.cmd && b > 0 && b < ran))) Sound.play('type', { gain: 3 });
    S.sfxFrame = f;
    const { x, y, w: W } = TERM, H = lines.length * LH + 44, t = T(), mx = S.menuBox;
    ctx.save(); ctx.globalAlpha = 0.6 * (S.menu ? clamp01(o / 6) : clamp01(e / total)); ctx.fillStyle = OFF; ctx.fillRect(0, 0, w, h); ctx.restore();
    // a line down from the label, like the crosshair's
    if (mx) R(mx[0] + mx[2] / 2, mx[1] + mx[3], t, y - mx[1] - mx[3]);
    if (S.menu ? o >= 2 : e > -10) { ctx.fillStyle = OFF; ctx.fillRect(X(x), Y(y), X(W), Y(H)); box(x, y, W, H, layout.C * 0.036); }
    const size = 22 * u;
    ctx.font = `600 ${size}px "JetBrains Mono", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    lines.forEach((line, i) => {
      let n = Math.min(len(line), Math.max(0, line.cmd ? b : a), Math.max(0, e));
      if (line.cmd) b -= len(line); else a -= len(line);
      e -= len(line);
      const ly = y + 52 + i * LH, k = line.id ? ITEMS.indexOf(line.id) : -1, full = n === len(line);
      if (k >= 0) S.boxes[`proto:item${k}`] = [x + 14, ly - 32, W - 28, LH];
      const sel = k >= 0 && S.sel === k && S.menu && full;
      if (sel) R(x + 14, ly - 32, W - 28, LH - 4);
      ctx.fillStyle = ctx.strokeStyle = sel ? OFF : ON;
      const part = line.s.slice(0, n);
      if (part) ctx.fillText(part, X(x + 30), Y(ly));
      if (full && line.id && ENTRY[line.id].ext) extIcon(X(x + 30) + ctx.measureText(part).width, Y(ly), size);
      if (line.prompt && full && S.menu && Math.floor(f / 20) % 2 === 0) {
        ctx.fillRect(X(x + 30) + ctx.measureText(part).width, Y(ly - 22), size * 0.6, size * 0.95);   // the cursor
      }
    });
  }

  // ---- every frame: wrap the sound label ---------------------------------------------------------------
  const siteSoundButton = drawSoundButton;
  drawSoundButton = function (f) {
    flicker(f);
    S.boxes = {};
    if (!muteVisible(f)) { siteSoundButton(f); return; }
    if (!S.shown) { S.shown = true; restart(f); }
    if (params.get('open') === '1' && !S.auto && f > muteShown + 12) { S.auto = true; openMenu(f); }
    if (hoverId !== S.prevHover) {
      if (hoverId === 'proto:menu') restart(f);
      if (hoverId && hoverId.startsWith('proto:item')) S.sel = +hoverId.slice(10);
      S.prevHover = hoverId;
    }
    drawTerm(f);
    siteSoundButton(f);   // over the console's dimming, so the labels stay sharp
    S.boxes['proto:menu'] = S.menuBox = label(1660, S.menu ? 'Close' : 'Menu', 5, f);
  };

  // ---- input --------------------------------------------------------------------------------------------
  const inBox = (px, py, [x, y, bw, bh]) => px >= x && px < x + bw && py >= y && py < y + bh;
  const siteTarget = targetAt;
  targetAt = function (e) {
    const px = e.clientX / w * 1920, py = e.clientY / h * 1080;
    for (const [id, b] of Object.entries(S.boxes)) if (inBox(px, py, b)) return id;
    if (S.menu) return inBox(px, py, L.mute) ? siteTarget(e) : 'proto:outside';   // the site underneath stays out of reach
    return siteTarget(e);
  };
  canvas.addEventListener('pointerdown', e => {
    const t = targetAt(e);
    if (!t || !t.startsWith('proto:')) return;
    if (t === 'proto:menu') S.menu ? closeMenu(frameNow) : openMenu(frameNow);
    if (t === 'proto:outside') closeMenu(frameNow);
    if (t.startsWith('proto:item')) run(+t.slice(10), frameNow);
  });
  // capture phase, so the site's own keys (arrows, Enter, I) do not act while the menu is open
  addEventListener('keydown', e => {
    const k = e.key, screen = ITEMS.indexOf('screen');
    if (!S.menu) {
      if (k.toLowerCase() === 'i') { toggleScreen(frameNow); e.stopImmediatePropagation(); }
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') { S.sel = (S.sel + (k === 'ArrowUp' ? ITEMS.length - 1 : 1)) % ITEMS.length; Sound.play('hover-cell'); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') { if (S.sel === screen) run(screen, frameNow); }
    else if (k === 'Enter') run(S.sel, frameNow);
    else if (k === 'Escape') closeMenu(frameNow);
    else if (k.toLowerCase() === 'i') run(screen, frameNow);
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
})();
