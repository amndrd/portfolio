// Grid geometry and cell drawing. Proportions measured on the reference, as fractions of one cell.
// Needs pictos.js (PICTOS, ON, OFF).

const GEOM = {
  cellOfWidth: 0.094, cellOfHeight: 0.17,
  gap: 0.165,          // space between cells
  outline: 0.05,       // cell frame thickness
  pictoBox: 0.74,      // pictogram area inside the cell
  bootArm: 0.20,       // corner brackets shown while a cell boots
  bootInset: 1.2,      // brackets sit inside the frame, inset by this many frame thicknesses
};

function gridLayout(w, h) {
  const C = Math.min(w * GEOM.cellOfWidth, h * GEOM.cellOfHeight);
  const gap = C * GEOM.gap;
  const x0 = (w - (C * 5 + gap * 4)) / 2, y0 = (h - (C * 3 + gap * 2)) / 2;
  return {
    C, gap, t: C * GEOM.outline, x0, y0,
    cellX: i => x0 + i * (C + gap),
    cellY: j => y0 + j * (C + gap),
  };
}

function drawFrame(ctx, x, y, C, t) {
  ctx.fillStyle = ON;
  ctx.fillRect(x, y, C, t); ctx.fillRect(x, y + C - t, C, t);
  ctx.fillRect(x, y + t, t, C - 2 * t); ctx.fillRect(x + C - t, y + t, t, C - 2 * t);
}

// Corner brackets drawn just inside the cell frame.
function drawBootBrackets(ctx, x, y, C, t) {
  const arm = C * GEOM.bootArm, i = t * GEOM.bootInset;
  const bx = x + i, by = y + i, bs = C - 2 * i;
  ctx.fillStyle = ON;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    ctx.fillRect(bx + sx * (bs - arm), by + sy * (bs - t), arm, t);
    ctx.fillRect(bx + sx * (bs - t), by + sy * (bs - arm), t, arm);
  }
}

// Random pixel mask used for the grainy first frames of the pictogram fade.
let dissolveMask = null;
function getDissolveMask(size) {
  size = Math.ceil(size);
  if (dissolveMask && dissolveMask.width === size) return dissolveMask;
  dissolveMask = document.createElement('canvas');
  dissolveMask.width = dissolveMask.height = size;
  const m = dissolveMask.getContext('2d'), b = Math.max(2, Math.round(size / 90));
  for (let y = 0; y < size; y += b) for (let x = 0; x < size; x += b) {
    if (Math.random() < 0.6) { m.fillStyle = '#fff'; m.fillRect(x, y, b, b); }
  }
  return dissolveMask;
}
const pictoBuffer = document.createElement('canvas');
const invertBuffer = document.createElement('canvas');

// Dark pictogram punched into a bright fill (selected cell): drawn with 'difference'
// over the fill, so bright shapes turn dark and the black background stays bright.
function drawPictoInverted(ctx, name, x, y, C, alpha = 1, scale = 1) {
  const box = C * GEOM.pictoBox * scale;
  const size = Math.ceil(box * (ctx.getTransform().a || 1));
  invertBuffer.width = invertBuffer.height = size;
  const b = invertBuffer.getContext('2d');
  b.fillStyle = OFF; b.fillRect(0, 0, size, size);
  b.save(); b.scale(size / 100, size / 100); b.lineJoin = 'miter'; b.lineCap = 'butt';
  PICTOS[name](b); b.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.globalAlpha *= alpha;
  ctx.drawImage(invertBuffer, x + (C - box) / 2, y + (C - box) / 2, box, box);
  ctx.restore();
}

// grain: 0..1, share of the pictogram knocked out by the random mask; scale: around the cell centre
function drawPicto(ctx, name, x, y, C, { alpha = 1, grain = 0, scale = 1 } = {}) {
  const box = C * GEOM.pictoBox * scale, s = box / 100;
  const ox = x + (C - box) / 2, oy = y + (C - box) / 2;
  if (!grain) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.translate(ox, oy); ctx.scale(s, s);
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    PICTOS[name](ctx);
    ctx.restore();
    return;
  }
  const size = Math.ceil(box * (ctx.getTransform().a || 1));
  pictoBuffer.width = pictoBuffer.height = size;
  const b = pictoBuffer.getContext('2d');
  b.save(); b.scale(size / 100, size / 100); b.lineJoin = 'miter'; b.lineCap = 'butt';
  PICTOS[name](b); b.restore();
  b.globalCompositeOperation = 'destination-out';
  b.globalAlpha = grain;
  b.drawImage(getDissolveMask(size), 0, 0);
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(pictoBuffer, ox, oy, box, box);
  ctx.restore();
}
