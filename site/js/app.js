// Portfolio: the whole flow on one canvas. Grid boot, crosshair selection, project panel,
// launch sequence, detail page (placeholder). Timings measured on the reference at 60 fps;
// the prototypes in ../prototypes hold the measurements and the alternatives.
// Keys: arrows + Enter pick a cell, Esc goes back, I inverts the colours, M mutes.
// Needs pictos.js, grid.js, crt.js, projects.js, sound.js.

const FPS = 60;

// ---- grid boot (frames after a cell is triggered) --------------------------------------
const BOOT_START = 27, BOOT_STEP = 4;
const CELL_BOOT = [[0, 'brackets'], [2, 'off'], [5, 'brackets'], [28, 'off'], [32, 'framed'], [36, 'frame'], [37, 'fade'], [41, 'done']];
const FADE = [[0.36, 0.55], [0.67, 0.3], [0.9, 0], [0.95, 0]];   // pictogram opacity / grain

// ---- crosshair (frames after the selection starts) ------------------------------------
const XH = {
  fadeFrames: 14, moveStart: 9, moveFrames: 31,
  click: 60,
  vanishDelay: 2,        // other cells vanish one per frame, reading order, from click + 2
  labelStart: 9, labelRate: 0.8,
  start: [0.845, 0.313], // entry point (fraction of the screen)
  line: 0.068, knock: 0.05, bracket: 0.07, bracketArm: 0.35, bracketOffset: 0.15, label: 0.15,
};

// ---- click (frames after the click) ---------------------------------------------------
const ROT = [9.9, 9.8, 9.3, 9.2, 8.7, 8.2, 7.4, 6.7, 5.9, 5.1, 4.2, 3.3, 2.3, 1.6, 0.8, 0, 0,
             -0.9, -1.5, -2.1, -2.6, -3.1, -3.4, -3.6, -3.7, -3.7, -3.7, -3.6, -3.4,
             -3.2, -3.0, -2.8, -2.3, -2.1, -1.9, -1.5, -1.2, -0.9, -0.8, 0];   // straightens during the move
const RETICLE_ZOOM = [1.094, 1.085, 1.064, 1.047, 1.021, 1.009];
const CLICK_FILL = [0.15, 0.48, 0.88];
const CLICK_CELL = [1.02, 1.015, 1.0];
const CLICK_ICON = [1.045, 1.045, 1.025];
const CLICK_SQUARE = [0.975, 0.95, 0.875, 0.865];
const CLICK_DARK = [0, 0.25, 0.64, 0.98];

// ---- move to the top-left + title (frames after the click) -------------------------------
const MOVE = { start: 28, frames: 41, to: [270 / 1920, 206 / 1080] };
const LABEL_LIFT = [[37, 0.22], [39, 0.44], [45, 0.57], [51, 0.64]];
const TITLE = { start: 39, rate: 2.7, cap: 0.3, baseline: 0.2,
                look: [[39, 0.35, 0.72], [43, 0.4, 0.8], [45, 0.8, 0.86], [47, 1, 0.92], [51, 1, 1]] };

// ---- panel build (frames after the click), same rhythm as the reference panel -------------
const BUILD = {
  ruler: [68, 96], tab: [[73, 0.15], [75, 0.5], [77, 1]],
  frameTop: [72, 96], frameSides: [75, 98], frameBottom: [88, 100],
  ascii: [100, 112],                                  // rows scan in, top to bottom
  back: [[74, 0.15], [94, 0.5], [98, 1]], backText: [[103, 0.15], [104, 0.5], [106, 1]],
  rules: [[72, 96], [80, 100], [88, 104]],            // separators of the right column
  block1: 128, block2: 136,                           // on 3 frames, off 3, then on
  bar: [140, 156], legend: 156,
  rows: [151, 159, 167],
  launch: { dim: [146, 149], on: 152 },
  github: 175, description: { start: 175, rate: 3 },
  ready: 180,
};

// ---- launch (frames after the LAUNCH click) ---------------------------------------------------
const SEQ = { cut: 8, erase: 14, type: 23, typeFrames: 118, afterglow: 22, black: 30 };
const LIFT = [0.06, 0, 0, 0, 0.06, 0.06, 0.06, 0.06];   // background flicker right after the cut
const DETAIL = { title: 0, sub: 8, button: { dim: [14, 17], on: 20 } };

// 1920×1080 design space; the area under the reticle (x < 420, y < 340) stays free
const L = {
  band: [420, 1150], screen: [300, 345, 850, 585],
  back: [300, 960, 220, 65], github: [1200, 920, 310, 110], launch: [1540, 920, 320, 110],
  home: [810, 640, 300, 90],
  mute: [1690, 38, 190, 60],   // sound button
};

// ---- easing + keyframe helpers ------------------------------------------------------------------
function bezier(x1, y1, x2, y2) {
  return t => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) {
      const s = (lo + hi) / 2;
      const x = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3;
      if (x < t) lo = s; else hi = s;
    }
    const s = (lo + hi) / 2;
    return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3;
  };
}
const travel = bezier(0.40, 0.15, 0.40, 0.95);     // crosshair to the cell
const moveEase = bezier(0.60, 0.00, 0.40, 0.95);   // cell + crosshair to the top-left
const clamp01 = v => Math.min(1, Math.max(0, v));
const grow = (rel, [a, b]) => clamp01((rel - a) / (b - a));
function steps(rel, keys) { let v = 0; for (const [f, a] of keys) if (rel >= f) v = a; return v; }
function interp(rel, keys) {
  if (rel <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (rel <= keys[i][0]) {
      const [f0, ...a] = keys[i - 1], [f1, ...b] = keys[i], t = (rel - f0) / (f1 - f0);
      return a.map((v, k) => v + (b[k] - v) * t);
    }
  }
  return keys[keys.length - 1].slice(1);
}
const blinkOn = (rel, at) => rel >= at && (rel < at + 3 || rel >= at + 6);
function cellState(rel) {
  let state = 'hidden', from = 0;
  for (const [f, s] of CELL_BOOT) if (rel >= f) { state = s; from = f; }
  return { state, step: rel - from };
}

// ---- canvases + state -----------------------------------------------------------------------------
const canvas = document.getElementById('screen');
const crt = createCRT(canvas);
const uiCanvas = document.createElement('canvas');
const ui = uiCanvas.getContext('2d');
const recCanvas = document.createElement('canvas');   // off-screen pass that collects the texts to erase
const rec = recCanvas.getContext('2d');
let ctx = ui, dpr = 1, w = 0, h = 0, u = 1, layout, capRatio = 0.6, ascii;

let inverted = false;
try { inverted = localStorage.getItem('portfolio.inverted') === '1'; } catch {}
function setInverted(v) {
  inverted = v;
  try { localStorage.setItem('portfolio.inverted', v ? '1' : '0'); } catch {}
}

let triggerAt = [], bootOffset = 0;
let selection = null;      // { cell, start, from, to }
let launch = null;         // { start, cell, texts, log }
let hover = null;          // hovered grid cell
let hoverId = null;        // hovered button
let forceLaunch = null;    // LAUNCH lit state while it blinks
let record = null;         // texts collected during the off-screen pass
let muteShown = null;      // frame the sound button first appeared (end of the first boot)
let frameNow = 0, nowT = 0;

function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function resetBoot(f) {
  triggerAt = new Array(GRID.length);
  shuffled(GRID.length).forEach((cell, k) => { triggerAt[cell] = BOOT_START + k * BOOT_STEP; });
  bootOffset = f;
}
const bootDone = f => f - bootOffset >= BOOT_START + (GRID.length - 1) * BOOT_STEP + 41;
const cellBox = k => [layout.cellX(k % 5), layout.cellY(Math.floor(k / 5))];
const entryId = k => String(k + 1).padStart(2, '0');

function launchState(rel) {
  if (rel < SEQ.cut) return { phase: 'press', lit: rel < 3 || rel >= 6 };
  if (rel < SEQ.cut + SEQ.erase) return { phase: 'erase', e: rel - SEQ.cut, lift: LIFT[rel - SEQ.cut] ?? 0 };
  if (rel < SEQ.type) return { phase: 'empty' };
  const k = rel - SEQ.type;
  if (k <= SEQ.typeFrames) return { phase: 'terminal', k };
  const a = k - SEQ.typeFrames - 1;
  if (a < SEQ.afterglow) return { phase: 'afterglow', blank: 0.9 + 0.1 * a / SEQ.afterglow };
  if (a < SEQ.afterglow + SEQ.black) return { phase: 'black', blank: 1 };
  return { phase: 'detail', d: a - SEQ.afterglow - SEQ.black };
}
const panelReady = f => !launch && selection && f - selection.start - XH.click >= BUILD.ready;
function homeReady(f) {
  if (!launch) return false;
  const s = launchState(f - launch.start);
  return s.phase === 'detail' && s.d >= DETAIL.button.on;
}

function startSelection(cell, f) {
  const { C } = layout;
  const [x, y] = cellBox(cell), to = [x + C / 2, y + C / 2];
  let from = [XH.start[0] * w, XH.start[1] * h];
  // too close to the entry point: come in from the mirrored side instead
  if (Math.hypot(from[0] - to[0], from[1] - to[1]) < w * 0.16) from = [(1 - XH.start[0]) * w, XH.start[1] * h];
  selection = { cell, start: f, from, to };
  hover = null; hoverId = null;
  resetCam();
  Sound.play('select');
  Sound.ambience(-1, 2500, 1.5);   // the room darkens while a project is open
}
function startLaunch(f) {
  // draw the current (complete) panel off-screen to collect every text, bottom line first
  ctx = rec; rec.setTransform(dpr, 0, 0, dpr, 0, 0);
  record = []; drawSelection(f);
  const texts = record.sort((a, b) => b.py - a.py || b.px - a.px);
  record = null; ctx = ui;
  launch = { start: f, cell: selection.cell, texts, log: bootLog(ENTRIES[selection.cell], entryId(selection.cell)) };
  hoverId = null;
  Sound.play('launch');
}
function goHome(f) {
  selection = null; launch = null; hover = null; hoverId = null;
  resetBoot(f);
  Sound.ambience(0, 18000, 1);
  Sound.play('back');
}

// ---- drawing helpers, in design coordinates --------------------------------------------------------
const X = v => v / 1920 * w, Y = v => v / 1080 * h;
function R(x, y, rw, rh, col = ON) { ctx.fillStyle = col; ctx.fillRect(X(x), Y(y), X(rw), Y(rh)); }
function box(x, y, bw, bh, t, col = ON) {
  ctx.fillStyle = col;
  const px = X(x), py = Y(y), pw = X(bw), ph = Y(bh);
  ctx.fillRect(px, py, pw, t); ctx.fillRect(px, py + ph - t, pw, t);
  ctx.fillRect(px, py, t, ph); ctx.fillRect(px + pw - t, py, t, ph);
}
function setFont(cap, weight = 700) { ctx.font = `${weight} ${Math.round(cap * u / capRatio)}px "Handjet", monospace`; }
function rawText(str, px, py, align = 'left', color = ON) {
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(str, px, py);
  if (record) record.push({ str, px, py, align, font: ctx.font });
}
function text(str, x, y, cap, { align = 'left', color = ON, weight = 700 } = {}) { setFont(cap, weight); rawText(str, X(x), Y(y), align, color); }
const textW = (str, cap, weight = 700) => { setFont(cap, weight); return ctx.measureText(str).width / w * 1920; };
function arrow(cx, cy, s, dir, col = ON) {
  const x = X(cx), y = Y(cy), k = s * u;
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x + dir * k * 0.5, y); ctx.lineTo(x, y - k * 0.45); ctx.lineTo(x, y - k * 0.18);
  ctx.lineTo(x - dir * k * 0.5, y - k * 0.18); ctx.lineTo(x - dir * k * 0.5, y + k * 0.18);
  ctx.lineTo(x, y + k * 0.18); ctx.lineTo(x, y + k * 0.45); ctx.closePath(); ctx.fill();
}
// generic branch icon (two commits + a merge), drawn, not a logo
function branchIcon(cx, cy, s, col) {
  const k = s * u, x = X(cx), y = Y(cy);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = k * 0.14;
  ctx.beginPath(); ctx.moveTo(x - k * 0.25, y - k * 0.38); ctx.lineTo(x - k * 0.25, y + k * 0.38);
  ctx.moveTo(x + k * 0.25, y - k * 0.2); ctx.quadraticCurveTo(x + k * 0.25, y + k * 0.12, x - k * 0.25, y + k * 0.18); ctx.stroke();
  for (const [ox, oy] of [[-0.25, -0.42], [-0.25, 0.42], [0.25, -0.28]]) { ctx.beginPath(); ctx.arc(x + ox * k, y + oy * k, k * 0.13, 0, Math.PI * 2); ctx.fill(); }
}
const inRect = (px, py, [x, y, bw, bh]) => px >= x && px < x + bw && py >= y && py < y + bh;

// Outline button, inverted on hover; alpha for the frame, labelAlpha for the label
function button(id, [x, y, bw, bh], label, cap, t, icon, alpha = 1, labelAlpha = alpha) {
  if (alpha <= 0 && labelAlpha <= 0) return;
  const lit = id === 'launch' && forceLaunch !== null ? forceLaunch : hoverId === id;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (lit) R(x, y, bw, bh); else box(x, y, bw, bh, t);
  ctx.restore();
  const col = lit ? OFF : ON, tw = textW(label, cap), iw = icon ? cap * 1.5 : 0, lx = x + (bw - tw - iw) / 2;
  ctx.save(); ctx.globalAlpha *= labelAlpha;
  if (icon === 'back') arrow(lx + cap * 0.55, y + bh / 2, cap * 1.1, -1, col);
  if (icon === 'git') branchIcon(lx + cap * 0.5, y + bh / 2, cap * 1.3, col);
  text(label, lx + iw, y + bh / 2 + cap / 2, cap, { color: col });
  ctx.restore();
}

// ---- grid -----------------------------------------------------------------------------------------
function drawCellAt(k, f) {
  const { C, t } = layout, [x, y] = cellBox(k), name = GRID[k];
  const { state, step } = cellState(f - bootOffset - triggerAt[k]);
  switch (state) {
    case 'brackets': drawBootBrackets(ctx, x, y, C, t); break;
    case 'framed': drawFrame(ctx, x, y, C, t); drawBootBrackets(ctx, x, y, C, t); break;
    case 'frame': drawFrame(ctx, x, y, C, t); break;
    case 'fade': drawFrame(ctx, x, y, C, t); drawPicto(ctx, name, x, y, C, { alpha: FADE[step][0], grain: FADE[step][1] }); break;
    case 'done': drawFrame(ctx, x, y, C, t); drawPicto(ctx, name, x, y, C); break;
  }
}
function drawIndex(f) {
  const { C, t } = layout;
  GRID.forEach((name, k) => {
    drawCellAt(k, f);
    if (hover === k && bootDone(f)) { const [x, y] = cellBox(k); drawBootBrackets(ctx, x, y, C, t); }
  });
}

// Targeted cell, centred on (cx, cy), opaque. rel = frames after the click:
// < 0 normal; +0..+2 slight zoom while a fill rises over everything; then a solid square
// shrinks inside the cell and the pictogram comes back dark.
function drawSelectedCell(k, rel, cx, cy) {
  const { C, t } = layout, x = cx - C / 2, y = cy - C / 2, name = GRID[k];
  ctx.fillStyle = OFF; ctx.fillRect(x, y, C, C);
  if (rel < 0) { drawFrame(ctx, x, y, C, t); drawPicto(ctx, name, x, y, C); return; }
  if (rel < CLICK_FILL.length) {
    const s = CLICK_CELL[rel], Cs = C * s, ts = t * s, o = (C - Cs) / 2;
    drawFrame(ctx, x + o, y + o, Cs, ts);
    drawPicto(ctx, name, x, y, C, { scale: CLICK_ICON[rel] });
    ctx.save(); ctx.globalAlpha = CLICK_FILL[rel]; ctx.fillStyle = ON;
    ctx.fillRect(x + o + ts, y + o + ts, Cs - 2 * ts, Cs - 2 * ts);
    ctx.restore();
    return;
  }
  const i = rel - CLICK_FILL.length;
  const sq = CLICK_SQUARE[Math.min(i, CLICK_SQUARE.length - 1)], S = C * sq, o = (C - S) / 2;
  ctx.fillStyle = ON; ctx.fillRect(x + o, y + o, S, S);
  const dark = i < CLICK_DARK.length ? CLICK_DARK[i] : 1;
  if (dark > 0) drawPictoInverted(ctx, name, x, y, C, dark, sq);
}
function reticleRects(cx, cy) {
  const { C } = layout;
  const bt = C * XH.bracket, arm = C * XH.bracketArm, off = C * XH.bracketOffset;
  const bs = C + off * 2, bx = cx - bs / 2, by = cy - bs / 2;
  return [[0, 0], [1, 0], [0, 1], [1, 1]].flatMap(([sx, sy]) => {
    const px = bx + sx * bs, py = by + sy * bs;
    return [[sx ? px - arm : px, sy ? py - bt : py, arm, bt], [sx ? px - bt : px, sy ? py - arm : py, bt, arm]];
  });
}

// Crosshair travel, click, move to the top-left, title, then the panel.
function drawSelection(f) {
  const sel = selection, { C } = layout;
  const rel = f - sel.start, crel = rel - XH.click;

  let order = 0;
  GRID.forEach((name, k) => {
    if (k === sel.cell) return;
    const gone = crel >= XH.vanishDelay + order;
    order++;
    if (!gone) drawCellAt(k, f);
  });

  // the crosshair travels to the cell; the cell stays in its slot until the move, then both travel
  const dest = [MOVE.to[0] * w, MOVE.to[1] * h];
  const p = rel < XH.moveStart ? 0 : travel(Math.min(1, (rel - XH.moveStart) / XH.moveFrames));
  const m = crel < MOVE.start ? 0 : moveEase(Math.min(1, (crel - MOVE.start) / MOVE.frames));
  const cx = sel.from[0] + (sel.to[0] - sel.from[0]) * p + (dest[0] - sel.to[0]) * m;
  const cy = sel.from[1] + (sel.to[1] - sel.from[1]) * p + (dest[1] - sel.to[1]) * m;
  const scx = sel.to[0] + (dest[0] - sel.to[0]) * m, scy = sel.to[1] + (dest[1] - sel.to[1]) * m;

  const alpha = Math.min(1, 0.1 + 0.9 * rel / XH.fadeFrames);
  const Lw = C * XH.line, K = C * XH.knock;
  const lines = [[w * 0.027, cy - Lw / 2, w * 0.946, Lw], [cx - Lw / 2, h * 0.015, Lw, h * 0.97]];
  const angle = crel >= 0 ? ROT[Math.min(ROT.length - 1, crel)] * Math.PI / 180 : 0;
  const zoom = crel >= 0 && crel < RETICLE_ZOOM.length ? RETICLE_ZOOM[crel] : 1;

  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = OFF; for (const r of lines) ctx.fillRect(r[0] - K, r[1] - K, r[2] + 2 * K, r[3] + 2 * K);
  ctx.fillStyle = ON; for (const r of lines) ctx.fillRect(...r);
  ctx.restore();

  ctx.save();
  ctx.translate(scx, scy); ctx.rotate(angle); ctx.translate(-scx, -scy);
  drawSelectedCell(sel.cell, crel, scx, scy);
  ctx.restore();

  // reticle brackets: no dark margin, they merge with the cells they overlap
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = ON;
  ctx.translate(cx, cy); ctx.rotate(angle); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
  for (const r of reticleRects(cx, cy)) ctx.fillRect(...r);
  ctx.restore();

  const entry = ENTRIES[sel.cell], id = entryId(sel.cell);
  const lx = cx + C / 2 + C * XH.bracketOffset + C * 0.1;
  if (rel >= XH.labelStart) {
    const label = `Archive entry ${id} located. Opening file ...`;
    const n = Math.min(label.length, Math.floor((rel - XH.labelStart) * XH.labelRate) + 1);
    const lift = crel < LABEL_LIFT[0][0] ? (Lw / 2 + K) / C + 0.08 : interp(crel, LABEL_LIFT)[0];
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(C * XH.label)}px "Handjet", monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.lineWidth = K * 1.6; ctx.strokeStyle = OFF; ctx.strokeText(label.slice(0, n), lx, cy - lift * C);
    rawText(label.slice(0, n), lx, cy - lift * C);
    ctx.restore();
  }
  if (crel >= TITLE.start) {
    const title = `ENTRY ${id}: ${entry.title}`;
    const n = Math.min(title.length, Math.floor((crel - TITLE.start) * TITLE.rate) + 1);
    const [ta, ts] = interp(crel, TITLE.look), ty = cy - TITLE.baseline * C;
    ctx.save(); ctx.globalAlpha = ta; setFont(TITLE.cap * 180.48);
    if (ts < 1) {
      ctx.translate(lx, ty); ctx.scale(ts, ts);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ON; ctx.fillText(title.slice(0, n), 0, 0);
    } else rawText(title.slice(0, n), lx, ty);
    ctx.restore();
  }
  if (crel >= 0) drawPanel(crel, entry);
}

// ---- panel ----------------------------------------------------------------------------------------------
function block(x, y0, label, value) { text(label, x, y0 + 26, 15, { weight: 600 }); text(value, x, y0 + 72, 26); }
function swatch(kind, x, y, sw, sh, thin) {
  if (kind === 0) { R(x, y, sw, sh); return; }
  ctx.save(); ctx.beginPath(); ctx.rect(X(x), Y(y), X(sw), Y(sh)); ctx.clip();
  if (kind === 1) {
    ctx.strokeStyle = ON; ctx.lineWidth = 4 * u; ctx.beginPath();
    for (let k = -sh; k < sw; k += 12) { ctx.moveTo(X(x + k), Y(y + sh)); ctx.lineTo(X(x + k + sh), Y(y)); }
    ctx.stroke();
  } else for (let yy = y + 5; yy < y + sh - 2; yy += 10) for (let xx = x + 5; xx < x + sw - 2; xx += 10) R(xx - 2, yy - 2, 4, 4);
  ctx.restore();
  box(x, y, sw, sh, thin * 0.7);
}

function drawPanel(rel, p) {
  const st = layout.C * 0.05, thin = layout.C * 0.036;
  const [b0, b1] = L.band, [sx, sy, sw, sh] = L.screen;

  // band above the screen: live tab, caption, character count, ruler
  const ta = steps(rel, BUILD.tab);
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta;
    R(b0, 250, 150, 44); text('LIVE', b0 + 75, 284, 22, { align: 'center', color: OFF });
    text(`${p.viewLabel[0]}  -  ${p.viewLabel[1]}`, b0 + 174, 284, 20);
    text(`${ascii.cols}x${ascii.rows}`, b1, 284, 20, { align: 'right' });
    ctx.restore();
  }
  const gr = grow(rel, BUILD.ruler);
  if (gr > 0) for (let x = b0; x <= b0 + (b1 - b0) * gr; x += 16) R(x, 308, 6, 22);

  // screen frame draws itself, then the ASCII view scans in
  ctx.fillStyle = ON;
  const ft = grow(rel, BUILD.frameTop), fv = grow(rel, BUILD.frameSides), fb = grow(rel, BUILD.frameBottom);
  if (ft > 0) ctx.fillRect(X(sx), Y(sy), X(sw) * ft, st);
  if (fv > 0) { ctx.fillRect(X(sx), Y(sy), st, Y(sh) * fv); ctx.fillRect(X(sx + sw) - st, Y(sy), st, Y(sh) * fv); }
  if (fb > 0) ctx.fillRect(X(sx), Y(sy + sh) - st, X(sw) * fb, st);
  const ar = grow(rel, BUILD.ascii);
  if (ar > 0) {
    const { cols, rows, aw, lh, size } = ascii, inset = 22;
    const x0 = X(sx + inset) + (X(sw - 2 * inset) - cols * aw) / 2, y0 = Y(sy + inset) + (Y(sh - 2 * inset) - rows * lh) / 2;
    drawAscii(VIEWS[p.view](cols, rows, aw, lh, nowT), x0, y0, aw, lh, size, Math.ceil(rows * ar));
  }

  button('back', L.back, 'BACK', 22, thin, 'back', steps(rel, BUILD.back), steps(rel, BUILD.backText));
  const bt = steps(rel, BUILD.backText);
  if (bt > 0) { ctx.save(); ctx.globalAlpha = bt; text('OR PRESS ESC', 545, 1002, 15, { weight: 600 }); ctx.restore(); }

  // right column: separators first, then the data blocks blink in, then the lists
  const x0 = 1200, x1 = 1540, xr = 1860;
  [340, 445, 602].forEach((y, i) => { const g = grow(rel, BUILD.rules[i]); if (g > 0) R(x0, y, (xr - x0) * g, thin / u); });
  if (blinkOn(rel, BUILD.block1)) { block(x0, 250, 'LANGUAGE', p.language); block(x1, 250, 'YEAR', p.year); }
  if (blinkOn(rel, BUILD.block2)) { block(x0, 355, 'TYPE', p.type); block(x1, 355, 'DURATION', p.duration); }
  if (blinkOn(rel, BUILD.bar[0])) text('COMPOSITION', x0, 490, 15, { weight: 600 });
  const bg = grow(rel, BUILD.bar);
  if (bg > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(X(x0) - 2, Y(500), X(xr - x0) * bg + 2, Y(46)); ctx.clip();
    let cx = x0;
    p.composition.forEach(([, pct], i) => { const pw = (xr - x0) * pct / 100; swatch(i, cx, 506, pw, 34, thin); cx += pw; });
    ctx.restore();
  }
  if (rel >= BUILD.legend) {
    let cx = x0;
    p.composition.forEach(([name, pct], i) => {
      swatch(i, cx, 562, 18, 18, layout.C * 0.03);
      const label = `${name} ${pct}%`;
      text(label, cx + 28, 578, 16, { weight: 600 });
      cx += 28 + textW(label, 16, 600) + 34;
    });
  }
  BUILD.rows.forEach((at, i) => {
    if (rel < at) return;
    if (i === 0) { text('STACK', x0, 645, 15, { weight: 600 }); text(p.listTitle, x1, 645, 15, { weight: 600 }); }
    for (const [x, items] of [[x0, p.stack], [x1, p.list]]) {
      if (!items[i]) continue;
      R(x, 668 + i * 38, 14, 14); text(items[i], x + 30, 683 + i * 38, 19);
    }
  });
  if (rel >= BUILD.description.start) {
    let left = Math.floor((rel - BUILD.description.start) * BUILD.description.rate) + 1;
    p.description.forEach((line, i) => {
      if (left > 0) text(line.slice(0, left), x0, 818 + i * 36, 17, { weight: 600 });
      left -= line.length;
    });
  }
  const lb = BUILD.launch, big = rel >= lb.on ? 1 : rel >= lb.dim[0] && rel < lb.dim[1] ? 0.35 : 0;
  button('launch', L.launch, 'LAUNCH', 36, st, null, big);
  if (rel >= BUILD.github) button('github', L.github, 'GITHUB', 24, thin, 'git');
}

// ---- ASCII views ------------------------------------------------------------------------------------------
const ALPHA = [0.55, 0.75, 0.9, 1];
const cam = { yaw: 0.7, pitch: -0.42, dist: 4.2, vyaw: 0, vpitch: 0 };   // negative pitch = seen from above
function resetCam() { Object.assign(cam, { yaw: 0.7, pitch: -0.42, dist: 4.2, vyaw: 0, vpitch: 0 }); }
function rotInv([x, y, z], yaw, pitch) {
  const c = Math.cos(-yaw), s = Math.sin(-yaw);
  [x, z] = [x * c + z * s, -x * s + z * c];
  const cp = Math.cos(-pitch), sp = Math.sin(-pitch);
  return [x, y * cp - z * sp, y * sp + z * cp];
}
function makeGrid(cols, rows) {
  return { cols, rows, chars: new Uint16Array(cols * rows), levels: new Int8Array(cols * rows).fill(-1), depth: new Float32Array(cols * rows).fill(1e9) };
}
function plot(g, i, j, ch, z, lvl) {
  i = Math.round(i); j = Math.round(j);
  if (i < 0 || j < 0 || i >= g.cols || j >= g.rows) return;
  const k = j * g.cols + i;
  if (lvl > g.levels[k] || (lvl === g.levels[k] && z < g.depth[k])) { g.depth[k] = z; g.levels[k] = lvl; g.chars[k] = ch.charCodeAt(0); }
}
function puts(g, i, j, str, lvl) {
  for (let k = 0; k < str.length; k++) {
    if (str[k] === ' ' || i + k < 0 || i + k >= g.cols || j < 0 || j >= g.rows) continue;
    const idx = j * g.cols + i + k; g.chars[idx] = str.charCodeAt(k); g.levels[idx] = lvl;
  }
}
// segment on the character grid; glyph picked from the slope, or '.' for hidden edges
function line(g, p, q, aw, lh, glyph, lvl) {
  const di = q.i - p.i, dj = q.j - p.j, n = Math.ceil(Math.max(Math.abs(di), Math.abs(dj)) * 1.3) + 1;
  const dx = di * aw, dy = dj * lh, ang = Math.abs(Math.atan2(dy, dx));
  const ch = !glyph ? '.' : ang < 0.39 || ang > 2.75 ? '-' : ang > 1.18 && ang < 1.96 ? '|' : (dx * dy > 0 ? '\\' : '/');
  for (let s = 0; s <= n; s++) { const t = s / n; plot(g, p.i + di * t, p.j + dj * t, ch, p.z + (q.z - p.z) * t, lvl); }
}
function projector(cols, rows, aw, lh) {
  const half = rows * lh / 2, f = 0.42;
  return v => {
    const c = rotInv(v, cam.yaw, cam.pitch), z = cam.dist - c[2];
    return { i: cols / 2 + c[0] / z / f * half / aw, j: rows / 2 - c[1] / z / f * half / lh, z, depth: c[2] };
  };
}

// transformer: 12 rings (layers) of 12 nodes (heads), a pulse climbs through the layers
function tower(cols, rows, aw, lh, t) {
  const g = makeGrid(cols, rows), P = projector(cols, rows, aw, lh), N = 12, RING = 12;
  const pulse = Math.floor(t * 4) % (N + 3), pts = [];
  for (let l = 0; l < N; l++) for (let k = 0; k < RING; k++) {
    const a = k / RING * Math.PI * 2;
    const p = P([0.8 * Math.cos(a), (l - (N - 1) / 2) * 0.19, 0.8 * Math.sin(a)]);
    p.front = rotInv([Math.cos(a), 0, Math.sin(a)], cam.yaw, cam.pitch)[2] > -0.15; p.l = l;
    pts.push(p);
  }
  for (let l = 0; l < N; l++) for (let k = 0; k < RING; k++) {
    const p = pts[l * RING + k], q = pts[l * RING + (k + 1) % RING], front = p.front && q.front;
    line(g, p, q, aw, lh, front, l === pulse && p.front ? 3 : front ? 2 : 0);
    if (l < N - 1 && k % 2 === 0) {
      const r = pts[(l + 1) * RING + k], fr = p.front && r.front;
      line(g, p, r, aw, lh, fr, fr ? 2 : 0);
    }
  }
  for (const p of pts) if (p.front) plot(g, p.i, p.j, p.l === pulse ? '@' : 'o', p.z - 0.01, p.l === pulse ? 3 : 2);
  puts(g, 1, 0, pulse < N ? `LAYER ${String(pulse + 1).padStart(2, '0')} / ${N}` : 'SAMPLING ...', 2);
  puts(g, 1, rows - 1, 'TOKENS IN', 1); puts(g, cols - 12, 0, 'LOGITS OUT', 1);
  return g;
}

// feed-forward network: layers of nodes on rings, the active layer's connections light up
const NET = [6, 10, 10, 4];
function network(cols, rows, aw, lh, t) {
  const g = makeGrid(cols, rows), P = projector(cols, rows, aw, lh);
  const pulse = Math.floor(t * 3) % (NET.length + 2);
  const layers = NET.map((n, l) => Array.from({ length: n }, (_, k) => {
    const a = k / n * Math.PI * 2 + l * 0.3, r = 0.25 + 0.06 * n;
    const p = P([(l - (NET.length - 1) / 2) * 0.62, r * Math.cos(a), r * Math.sin(a)]);
    p.front = p.depth > -0.2;
    return p;
  }));
  layers.slice(0, -1).forEach((layer, l) => layer.forEach((p, k) => {
    const next = layers[l + 1];
    for (let d = 0; d < 3; d++) {
      const q = next[(Math.floor(k * next.length / layer.length) + d) % next.length];
      line(g, p, q, aw, lh, l === pulse, l === pulse ? 2 : 0);
    }
  }));
  layers.forEach((layer, l) => layer.forEach(p => plot(g, p.i, p.j, l === pulse ? '@' : p.front ? 'O' : 'o', p.z - 0.01, l === pulse ? 3 : p.front ? 2 : 1)));
  puts(g, 1, 0, pulse < NET.length ? `LAYER ${pulse + 1} / ${NET.length}` : 'OUTPUT', 2);
  puts(g, 1, rows - 1, 'INPUT', 1); puts(g, cols - 7, 0, 'OUTPUT', 1);
  return g;
}

// generic placeholder: wireframe torus
function torus(cols, rows, aw, lh) {
  const g = makeGrid(cols, rows), P = projector(cols, rows, aw, lh), U = 22, V = 11, pts = [];
  for (let a = 0; a < U; a++) for (let b = 0; b < V; b++) {
    const th = a / U * Math.PI * 2, ph = b / V * Math.PI * 2;
    const p = P([(1 + 0.45 * Math.cos(ph)) * Math.cos(th), 0.45 * Math.sin(ph), (1 + 0.45 * Math.cos(ph)) * Math.sin(th)]);
    p.front = rotInv([Math.cos(ph) * Math.cos(th), Math.sin(ph), Math.cos(ph) * Math.sin(th)], cam.yaw, cam.pitch)[2] > -0.05;
    pts.push(p);
  }
  for (let a = 0; a < U; a++) for (let b = 0; b < V; b++) {
    const p = pts[a * V + b];
    for (const q of [pts[((a + 1) % U) * V + b], pts[a * V + (b + 1) % V]]) {
      const front = p.front && q.front;
      line(g, p, q, aw, lh, front, front ? 2 : 0);
    }
  }
  for (const p of pts) if (p.front) plot(g, p.i, p.j, 'o', p.z - 0.01, 3);
  return g;
}
const VIEWS = { tower, network, torus };

// one fillText per row and brightness level (monospace keeps the columns aligned)
function drawAscii(g, x0, y0, aw, lh, size, maxRow = g.rows) {
  ctx.save();
  ctx.font = `800 ${size}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillStyle = ON;
  for (let lvl = 0; lvl < 4; lvl++) {
    ctx.globalAlpha = ALPHA[lvl];
    for (let j = 0; j < Math.min(maxRow, g.rows); j++) {
      let row = '', any = false;
      for (let i = 0; i < g.cols; i++) {
        const k = j * g.cols + i;
        if (g.levels[k] === lvl) { row += String.fromCharCode(g.chars[k]); any = true; } else row += ' ';
      }
      if (any) ctx.fillText(row, x0, y0 + j * lh);
    }
  }
  ctx.restore();
}
function measureAscii() {
  const [, , sw, sh] = L.screen, inset = 22, size = 11 * u;
  ui.font = `800 ${size}px "JetBrains Mono", monospace`;
  const aw = ui.measureText('M').width, lh = size * 1.08;
  ascii = { size, aw, lh, cols: Math.floor((X(sw) - X(2 * inset)) / aw), rows: Math.floor((Y(sh) - Y(2 * inset)) / lh) };
}

// ---- launch sequence ------------------------------------------------------------------------------------
function bootLog(p, id) {
  return [
    `Entry ${id} located. Mounting archive ...`,
    `Project: ${p.title}`,
    `Language: ${p.language}   Type: ${p.type}   Year: ${p.year}`,
    `Stack: ${p.stack.join(', ')}`,
    '',
    ...p.log,
    '',
    'Decompressing media ...',
    `Images: ${p.media.images}/${p.media.images}`,
    `Videos: ${p.media.videos}/${p.media.videos}`,
    `Source files: ${p.media.files}/${p.media.files}`,
    '',
    'Rendering project file ...',
    'Display mode: FULL COLOR',
    'Launch sequence complete.',
  ];
}
// every text of the panel is backspaced; items start one after another from the bottom, faster and faster
function drawErase(e) {
  const texts = launch.texts, K = texts.length, fade = clamp01((e - 10) / 4);
  ctx.save(); ctx.globalAlpha = 1 - fade;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ON;
  texts.forEach((t, k) => {
    const p = clamp01((e - k / K * 6) / 7) ** 1.6;
    const n = Math.ceil(t.str.length * (1 - p));
    if (n <= 0) return;
    // keep the remaining characters where they were: draw from the text's original left edge
    ctx.font = t.font;
    const full = ctx.measureText(t.str).width;
    const left = t.align === 'right' ? t.px - full : t.align === 'center' ? t.px - full / 2 : t.px;
    ctx.fillText(t.str.slice(0, n), left, t.py);
  });
  ctx.restore();
}
function drawTerminal(k) {
  const log = launch.log, total = log.reduce((n, l) => n + l.length, 0);
  let left = Math.floor(total * Math.min(1, k / SEQ.typeFrames) ** 1.15);
  ctx.font = `800 ${22 * u}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ON;
  log.forEach((row, i) => {
    const part = row.slice(0, Math.max(0, left));
    left -= row.length;
    if (part) ctx.fillText(part, X(64), Y(78 + i * 36));
  });
}
// placeholder until the detail page is designed
function drawDetail(d) {
  const p = ENTRIES[launch.cell];
  if (blinkOn(d, DETAIL.title)) text(`ENTRY ${entryId(launch.cell)}: ${p.title}`, 960, 470, 44, { align: 'center' });
  if (blinkOn(d, DETAIL.sub)) text('PROJECT DETAIL PAGE  -  COMING SOON', 960, 540, 20, { align: 'center', weight: 600 });
  const b = DETAIL.button, a = d >= b.on ? 1 : d >= b.dim[0] && d < b.dim[1] ? 0.35 : 0;
  button('home', L.home, 'HOME', 26, layout.C * 0.036, 'back', a);
  if (d >= b.on) text('OR PRESS ESC', 960, 772, 15, { align: 'center', weight: 600 });
}

// ---- sound button (top-right) -------------------------------------------------------------------------------
// After igloo.inc: an outline speaker and a "Sound: On / Off" label in a monospace. On hover, on each toggle and
// whenever the button comes back, the label decodes: characters come in from the left, each one a few code
// points off its letter, and count down to it while the icon dims. Hidden from the cut of the launch sequence
// until the detail page.
const DECODE = { reveal: 16, step: 2, dim: 6 };   // frames: every character in, per code point, icon dimmed
const SOUND_SIZE = 21;                             // font size
let decode = { start: -1e9, offs: new Array(10).fill(0) }, muteWasOn = false;
function muteOn(f) {
  if (muteShown === null) return false;
  return !launch || ['press', 'detail'].includes(launchState(f - launch.start).phase);
}
function muteVisible(f) { return muteOn(f) && blinkOn(f - muteShown, 0); }
function startDecode(f) {
  decode = { start: f, offs: decode.offs.map(() => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 4))) };
}
function decodedLabel(f) {
  const str = Sound.muted ? 'Sound: Off' : 'Sound: On', n = str.length, rel = f - decode.start;
  let out = '';
  for (let i = 0; i < n; i++) {
    const at = DECODE.reveal * (1 - Math.sqrt(1 - i / n));   // eases out: the first characters come in fastest
    if (rel < at) break;
    const off = decode.offs[i], left = Math.max(0, Math.abs(off) - Math.floor((rel - at) / DECODE.step));
    out += str[i] === ' ' ? ' ' : String.fromCharCode(str.charCodeAt(i) + Math.sign(off) * left);
  }
  return out;
}
// outline speaker, k tall, from its left edge; a cross when muted, a single short wave when on
function speakerIcon(x, cy, k, off) {
  ctx.beginPath();
  ctx.moveTo(x, cy - k * 0.2); ctx.lineTo(x + k * 0.28, cy - k * 0.2); ctx.lineTo(x + k * 0.62, cy - k * 0.5);
  ctx.lineTo(x + k * 0.62, cy + k * 0.5); ctx.lineTo(x + k * 0.28, cy + k * 0.2); ctx.lineTo(x, cy + k * 0.2); ctx.closePath();
  ctx.moveTo(x + k * 0.28, cy - k * 0.2); ctx.lineTo(x + k * 0.28, cy + k * 0.2);
  if (off) {
    ctx.moveTo(x + k * 0.8, cy - k * 0.16); ctx.lineTo(x + k * 1.12, cy + k * 0.16);
    ctx.moveTo(x + k * 1.12, cy - k * 0.16); ctx.lineTo(x + k * 0.8, cy + k * 0.16);
  } else {
    ctx.moveTo(x + k * 0.86, cy - k * 0.24); ctx.lineTo(x + k * 0.86, cy + k * 0.24);
  }
  ctx.stroke();
}
function drawSoundButton(f) {
  const on = muteOn(f);
  if (on && !muteWasOn) startDecode(f);
  muteWasOn = on;
  if (!muteVisible(f)) return;
  const [x, y, bw, bh] = L.mute, K = layout.C * 0.05;
  ctx.fillStyle = OFF; ctx.fillRect(X(x) - K, Y(y) - K, X(bw) + 2 * K, Y(bh) + 2 * K);   // reads over the crosshair lines
  ctx.save();
  const size = SOUND_SIZE * u, cap = size * 0.73, k = cap * 1.75, gap = size * 0.75;
  ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
  const cw = ctx.measureText('M').width;
  // the block ends on the right of the box with the longer label, so the text never moves while it decodes
  const left = X(x + bw) - (k * 1.12 + gap + cw * 10), cy = Y(y + bh / 2), rel = f - decode.start;
  ctx.strokeStyle = ON; ctx.lineWidth = size * 0.1; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  ctx.globalAlpha = rel >= 0 && rel < DECODE.dim ? 0.35 : 1;
  speakerIcon(left, cy, k, Sound.muted);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ON;
  ctx.fillText(decodedLabel(f), left + k * 1.12 + gap, cy + cap / 2);
  ctx.restore();
}

// ---- sound cues, fired once per frame of the timeline ----------------------------------------------------
const LABEL_LEN = 'Archive entry 00 located. Opening file ...'.length;
const typed = (rel, start, rate, len) => rel >= start && rel < start + len / rate;
// a loop while the grid boots, plus a cue as each cell appears
const BOOT_END = BOOT_START + (GRID.length - 1) * BOOT_STEP + 41;
function bootSfx(n) {
  const r = n - bootOffset;
  if (r === BOOT_START) Sound.start('boot');
  if (r === BOOT_END) Sound.stop('boot');
  for (let k = 0; k < GRID.length; k++) if (r - triggerAt[k] === 0) Sound.play('cell');
}
function selectionSfx(rel) {
  const crel = rel - XH.click, p = ENTRIES[selection.cell];
  if (rel === XH.moveStart) Sound.play('travel');
  if (typed(rel, XH.labelStart, XH.labelRate, LABEL_LEN) && rel % 2 === 0) Sound.play('type');
  if (crel === 0) Sound.play('lock');
  if (crel === XH.vanishDelay) Sound.play('vanish');   // the other cells vanish, one per frame
  if (crel === MOVE.start) Sound.play('move');
  if (typed(crel, TITLE.start, TITLE.rate, p.title.length + 10)) Sound.play('type');
  // panel build
  if (crel >= BUILD.ruler[0] && crel < BUILD.ruler[1] && crel % 2 === 0) Sound.play('tick');
  if (crel === BUILD.tab[0][0]) Sound.play('panel');
  if (crel === BUILD.ascii[0]) Sound.play('scan');
  for (const at of [BUILD.block1, BUILD.block2, BUILD.bar[0]]) if (crel === at || crel === at + 6) Sound.play('panel');
  if (BUILD.rows.includes(crel)) Sound.play('panel');
  if (crel === BUILD.launch.dim[0] || crel === BUILD.launch.on) Sound.play('panel');
  if (crel === BUILD.github) Sound.play('panel');
  const desc = p.description.join('').length;
  if (typed(crel, BUILD.description.start, BUILD.description.rate, desc) && crel % 2 === 0) Sound.play('type');
}
// launch: the room tone drops out at the cut, a drone carries the log, then the screen switches off
function launchSfx(rel) {
  if (rel === SEQ.cut) { Sound.play('cut'); Sound.ambience(-12, 350, 0.04); }
  const k = rel - SEQ.type;
  if (k === 0) Sound.start('drone');
  if (k === SEQ.typeFrames + 1) { Sound.stop('drone'); Sound.play('off'); }
  const d = k - SEQ.typeFrames - 1 - SEQ.afterglow - SEQ.black;
  if (d === 0) Sound.ambience(-1, 2500, 1.5);
  if (d === DETAIL.title || d === DETAIL.title + 6 || d === DETAIL.sub) Sound.play('panel');
  if (d === DETAIL.button.dim[0] || d === DETAIL.button.on) Sound.play('panel');
}
function sfxAt(n) {
  if (n === muteShown) Sound.play('panel');
  if (launch) launchSfx(n - launch.start);
  else if (selection) selectionSfx(n - selection.start);
  else bootSfx(n);
}

// ---- frame -------------------------------------------------------------------------------------------------
function drawScene(f) {
  ctx = ui;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = OFF; ctx.fillRect(0, 0, w, h);
  let fx = {};
  if (launch) {
    fx = launchState(f - launch.start);
    if (fx.phase === 'press') { forceLaunch = fx.lit; drawSelection(f); forceLaunch = null; }
    if (fx.phase === 'erase') drawErase(fx.e);
    if (fx.phase === 'terminal') drawTerminal(fx.k);
    if (fx.phase === 'detail') drawDetail(fx.d);
  } else if (selection) drawSelection(f);
  else drawIndex(f);
  drawSoundButton(f);
  crt.upload(uiCanvas);
  crt.render(f / FPS, { inverted, lift: fx.lift || 0, blank: fx.blank || 0 });
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  w = innerWidth; h = innerHeight;
  const W = Math.round(w * dpr), H = Math.round(h * dpr);
  crt.resize(W, H);
  uiCanvas.width = recCanvas.width = W; uiCanvas.height = recCanvas.height = H;
  layout = gridLayout(w, h);
  u = layout.C / 180.48;
  measureAscii();
  if (selection) {
    const [x, y] = cellBox(selection.cell);
    selection.to = [x + layout.C / 2, y + layout.C / 2];
  }
}

// ---- input --------------------------------------------------------------------------------------------------
let drag = null, lastInput = -1e9;
function cellAt(mx, my) {
  const { C } = layout;
  for (let k = 0; k < GRID.length; k++) {
    const [x, y] = cellBox(k);
    if (mx >= x && mx < x + C && my >= y && my < y + C) return k;
  }
  return null;
}
function targetAt(e) {
  const px = e.clientX / w * 1920, py = e.clientY / h * 1080;
  if (muteVisible(frameNow) && inRect(px, py, L.mute)) return 'mute';
  if (launch) return homeReady(frameNow) && inRect(px, py, L.home) ? 'home' : null;
  if (selection) {
    if (!panelReady(frameNow)) return null;
    for (const id of ['back', 'github', 'launch']) if (inRect(px, py, L[id])) return id;
    return inRect(px, py, L.screen) ? 'screen' : null;
  }
  if (!bootDone(frameNow)) return null;
  const k = cellAt(e.clientX, e.clientY);
  return k === null ? null : `cell${k}`;
}
function toggleMute() {
  Sound.setMuted(!Sound.muted);
  startDecode(frameNow);
  Sound.play('toggle');   // only heard when the sound comes back on
}
canvas.addEventListener('pointerdown', e => {
  Sound.init();
  lastInput = performance.now();
  const target = targetAt(e);
  if (!target) return;
  if (target === 'mute') { toggleMute(); return; }
  if (target.startsWith('cell')) { startSelection(Number(target.slice(4)), frameNow); canvas.style.cursor = 'default'; return; }
  if (target === 'screen') { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; return; }
  if (target === 'back' || target === 'home') { goHome(frameNow); canvas.style.cursor = 'default'; return; }
  if (target === 'launch') { startLaunch(frameNow); canvas.style.cursor = 'default'; return; }
  if (target === 'github') { const url = ENTRIES[selection.cell].github; if (url) window.open(url, '_blank', 'noopener'); }
});
canvas.addEventListener('pointermove', e => {
  if (drag) {
    // drag down = look from higher up, like a standard orbit control
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    cam.yaw -= dx * 0.008; cam.pitch -= dy * 0.006; cam.vyaw = -dx * 0.008; cam.vpitch = -dy * 0.006;
    drag = { x: e.clientX, y: e.clientY }; lastInput = performance.now();
    return;
  }
  const target = targetAt(e);
  const nextHover = target && target.startsWith('cell') ? Number(target.slice(4)) : null;
  const nextId = target && !target.startsWith('cell') && target !== 'screen' ? target : null;
  if ((nextHover !== null && nextHover !== hover) || (nextId !== null && nextId !== hoverId)) Sound.play('hover');
  if (nextId === 'mute' && hoverId !== 'mute') startDecode(frameNow);
  hover = nextHover; hoverId = nextId;
  canvas.style.cursor = target === 'screen' ? 'grab' : target ? 'pointer' : 'default';
});
addEventListener('pointerup', () => { if (drag) { drag = null; canvas.style.cursor = 'grab'; } });
canvas.addEventListener('pointerleave', () => { hover = null; hoverId = null; });
canvas.addEventListener('wheel', e => {
  if (targetAt(e) !== 'screen') return;
  cam.dist = Math.max(2.6, Math.min(7, cam.dist * (1 + e.deltaY * 0.001)));
  lastInput = performance.now(); e.preventDefault();
}, { passive: false });
addEventListener('keydown', e => {
  Sound.init();
  const k = e.key.toLowerCase();
  if (k === 'i') setInverted(!inverted);
  if (k === 'm') toggleMute();
  if (k === 'escape' && (launch ? homeReady(frameNow) : selection)) goHome(frameNow);
  if (!selection && !launch && bootDone(frameNow)) {
    if (e.key.startsWith('Arrow')) {
      const cur = hover ?? 7, col = cur % 5, row = Math.floor(cur / 5);
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      hover = Math.min(2, Math.max(0, row + d[1])) * 5 + Math.min(4, Math.max(0, col + d[0]));
      Sound.play('hover');
      e.preventDefault();
    }
    if (k === 'enter' && hover !== null) startSelection(hover, frameNow);
  } else if (k === 'enter' && panelReady(frameNow)) startLaunch(frameNow);
});
addEventListener('resize', resize);

// ---- clock ----------------------------------------------------------------------------------------------------
let vt = 0, last = performance.now();
function loop(now) {
  vt += Math.min(0.1, (now - last) / 1000); last = now;
  const prev = frameNow;
  frameNow = Math.floor(vt * FPS); nowT = vt;
  if (muteShown === null && bootDone(frameNow)) muteShown = frameNow;
  for (let n = prev + 1; n <= frameNow; n++) sfxAt(n);
  if (panelReady(frameNow) && !drag) {
    cam.yaw += cam.vyaw; cam.pitch += cam.vpitch; cam.vyaw *= 0.94; cam.vpitch *= 0.9;
    if (now - lastInput > 2500) cam.yaw += 0.004;   // idle: slow turntable
  }
  cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch));
  drawScene(frameNow);
  requestAnimationFrame(loop);
}

// state readout used by the automated checks in tools/site-test.mjs
window.__portfolio = () => ({
  frame: frameNow, bootDone: bootDone(frameNow), panelReady: !!panelReady(frameNow),
  launch: launch ? launchState(frameNow - launch.start).phase : null, homeReady: homeReady(frameNow),
  muted: Sound.muted, muteVisible: muteVisible(frameNow),
  selectionStart: selection ? selection.start : null, launchStart: launch ? launch.start : null,
});

Promise.all([
  document.fonts.load('700 40px "Handjet"'), document.fonts.load('600 40px "Handjet"'),
  document.fonts.load('800 20px "JetBrains Mono"'), document.fonts.load('600 20px "JetBrains Mono"'),
]).finally(() => {
  ui.font = '700 100px "Handjet"';
  capRatio = ui.measureText('E').actualBoundingBoxAscent / 100 || 0.6;
  resize();
  resetBoot(0);
  requestAnimationFrame(loop);
});
