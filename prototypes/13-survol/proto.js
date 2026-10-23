// Prototype 13: the hovered cell. Alternatives to the corner brackets, and the project's name before the click.
// Loaded after the site's own scripts (index.html points <base> at ../../site/): it wraps drawIndex (the grid,
// drawn every frame on the home screen) and reuses the site's drawing helpers.
//   ?h=  0 corners: the brackets inside the frame (the site now)
//        1 lock: the crosshair's brackets snap onto the cell, from larger and slightly turned
//        2 negative: the cell fills from the bottom, its pictogram turns dark
//        3 sight lines: thin crosshair lines run from the cell to the screen edges, with its row and column
//        4 lift: the cell rises off a hard shadow
//   ?n=  0 no name
//        a label: entry, type and title typed beside the cell, like the crosshair's label; the other cells dim
//        b tab: a filled tab on top of the frame, like an archive folder
//        c status line: under the grid, decoding like the sound label
//   H and N cycle through them; the caption at the top left says which is on (?cap=0 hides it).

(() => {
  const params = new URLSearchParams(location.search);
  const HOVERS = ['coins', 'verrouillage', 'négatif', 'lignes de visée', 'soulèvement'];
  const NAMES = ['aucun', 'étiquette', 'onglet', "barre d'état"], NKEYS = ['0', 'a', 'b', 'c'];
  const P = { h: Math.max(0, Math.min(4, +(params.get('h') ?? 1) || 0)), n: Math.max(0, NKEYS.indexOf(params.get('n') ?? 'a')),
    cell: null, at: -1e9, last: null, leftAt: -1e9, offs: new Array(64).fill(0), focus: 0, frame: -1 };
  const at = (rel, keys) => keys[Math.max(0, Math.min(rel, keys.length - 1))];

  // ---- hover effects -----------------------------------------------------------------------------------
  const LOCK = { zoom: [1.45, 1.25, 1.12, 1.04, 0.985, 1], rot: [8, 5, 3, 1.2, 0, 0], alpha: [0.4, 0.8, 1] };
  function lock(k, rel) {
    const { C } = layout, [x, y] = cellBox(k), cx = x + C / 2, cy = y + C / 2;
    ctx.save(); ctx.globalAlpha = at(rel, LOCK.alpha); ctx.fillStyle = ON;
    ctx.translate(cx, cy); ctx.rotate(at(rel, LOCK.rot) * Math.PI / 180); ctx.scale(at(rel, LOCK.zoom), at(rel, LOCK.zoom)); ctx.translate(-cx, -cy);
    for (const r of reticleRects(cx, cy)) ctx.fillRect(...r);
    ctx.restore();
  }

  // the fill rises inside the frame, a dark ring between them; the pictogram is inverted where the fill is
  const FILL = [0.3, 0.62, 0.86, 1], DRAIN = [0.6, 0.25];
  function negative(k, level) {
    const { C, t } = layout, [x, y] = cellBox(k), i = t * 2, ih = (C - 2 * i) * level;
    drawFrame(ctx, x, y, C, t);
    ctx.fillStyle = ON; ctx.fillRect(x + i, y + C - i - ih, C - 2 * i, ih);
    drawPictoInverted(ctx, GRID[k], x, y, C);
  }

  const GROW = [0.12, 0.3, 0.5, 0.68, 0.82, 0.93, 1];
  function sight(k, rel) {
    const { C } = layout, [x, y] = cellBox(k), cx = x + C / 2, cy = y + C / 2, g = at(rel, GROW);
    const Lw = Math.max(1, C * 0.022), K = C * 0.035, off = C / 2 + C * XH.bracketOffset, tick = C * 0.16;
    const L0 = w * 0.027, R0 = w * 0.973, T0 = h * 0.015, B0 = h * 0.985;
    const rects = [
      [cx - off - (cx - off - L0) * g, cy - Lw / 2, (cx - off - L0) * g, Lw], [cx + off, cy - Lw / 2, (R0 - cx - off) * g, Lw],
      [cx - Lw / 2, cy - off - (cy - off - T0) * g, Lw, (cy - off - T0) * g], [cx - Lw / 2, cy + off, Lw, (B0 - cy - off) * g],
      // short ticks across the inner ends, like a gunsight
      [cx - off - Lw, cy - tick / 2, Lw * 2, tick], [cx + off - Lw, cy - tick / 2, Lw * 2, tick],
      [cx - tick / 2, cy - off - Lw, tick, Lw * 2], [cx - tick / 2, cy + off - Lw, tick, Lw * 2],
    ];
    ctx.fillStyle = OFF; for (const r of rects) ctx.fillRect(r[0] - K, r[1] - K, r[2] + 2 * K, r[3] + 2 * K);
    ctx.fillStyle = ON; for (const r of rects) ctx.fillRect(...r);
    if (g < 1) return;
    setFont(15, 600);
    rawText(`ROW ${String(Math.floor(k / 5) + 1).padStart(2, '0')}`, L0, cy - Lw - C * 0.06);
    rawText(`COL ${String(k % 5 + 1).padStart(2, '0')}`, cx + Lw + C * 0.06, T0 + C * 0.12);
  }

  const UP = [0.35, 0.7, 0.9, 1], DOWN = [0.55, 0.2];
  function lift(k, p) {
    const { C, t } = layout, [x, y] = cellBox(k), d = C * 0.1 * p, cx = x - d / 2, cy = y - d / 2;
    ctx.fillStyle = ON; ctx.fillRect(x + d / 2, y + d / 2, C, C);   // the hard shadow
    ctx.fillStyle = OFF; ctx.fillRect(cx, cy, C, C);
    drawFrame(ctx, cx, cy, C, t); drawPicto(ctx, GRID[k], cx, cy, C);
  }

  // ---- names --------------------------------------------------------------------------------------------
  // A: two lines beside the cell (right, or left when there is no room), outlined in black over the cells
  function nameLabel(k, rel) {
    const { C } = layout, [x, y] = cellBox(k), e = ENTRIES[k], K = C * XH.knock, cy = y + C / 2;
    const top = `ENTRY ${entryId(k)}   ${e.type}`, title = e.title, big = Math.round(C * 0.24), small = Math.round(C * 0.13);
    ctx.save();
    ctx.font = `700 ${big}px "Handjet", monospace`;
    const right = x + C + C * (XH.bracketOffset + 0.12) + ctx.measureText(title).width < w * 0.98;
    const lx = right ? x + C + C * (XH.bracketOffset + 0.12) : x - C * (XH.bracketOffset + 0.12);
    ctx.textAlign = right ? 'left' : 'right'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = K * 1.6;
    ctx.strokeStyle = OFF; ctx.fillStyle = ON;
    const line = (str, n, size, ly) => {
      if (n <= 0) return;
      ctx.font = `700 ${size}px "Handjet", monospace`;
      ctx.strokeText(str.slice(0, n), lx, ly); ctx.fillText(str.slice(0, n), lx, ly);
    };
    line(top, Math.floor(rel * 3) + 1, small, cy - C * 0.14);
    line(title, Math.floor((rel - 3) * 2.5) + 1, big, cy + C * 0.15);
    ctx.restore();
  }

  // B: a tab on top of the frame, in the gap above the cell; it widens, then the name types in, dark on light
  const TAB = [0.2, 0.5, 0.8, 1];
  function nameTab(k, rel) {
    const { C, t, gap } = layout, [x, y] = cellBox(k), e = ENTRIES[k], th = gap * 0.85, str = `${entryId(k)}  ${e.title}`;
    ctx.save();
    ctx.font = `700 ${Math.round(th * 0.86)}px "Handjet", monospace`;
    const tw = ctx.measureText(str).width + th * 0.9;
    ctx.fillStyle = ON; ctx.fillRect(x, y - th, Math.max(C * 0.3, tw * at(rel, TAB)), th + t);
    const n = Math.floor((rel - 3) * 3) + 1;
    if (n > 0) { ctx.fillStyle = OFF; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(str.slice(0, n), x + th * 0.45, y - th * 0.2); }
    ctx.restore();
  }

  // C: one line under the grid, decoding like the sound label; it erases from the right when the cursor leaves
  function restart() { P.offs = P.offs.map(() => (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 4))); }
  function decoded(str, rel) {
    const n = str.length; let out = '';
    for (let i = 0; i < n; i++) {
      const a = DECODE.reveal * (1 - Math.sqrt(1 - i / n));
      if (rel < a) break;
      const off = P.offs[i], left = Math.max(0, Math.abs(off) - Math.floor((rel - a) / DECODE.step));
      out += str[i] === ' ' || str[i] === '/' ? str[i] : String.fromCharCode(str.charCodeAt(i) + Math.sign(off) * left);
    }
    return out;
  }
  function nameStatus(f) {
    const k = P.cell ?? P.last;
    if (k === null) return;
    const e = ENTRIES[k], str = `ENTRY ${entryId(k)}  /  ${e.title}  /  ${e.type}  /  ${e.year}`;
    const s = P.cell !== null ? decoded(str, f - P.at) : str.slice(0, Math.max(0, str.length - (f - P.leftAt) * 6));
    if (!s) return;
    const { C, y0, gap } = layout;
    ctx.save();
    ctx.font = `600 ${SOUND_SIZE * u}px "JetBrains Mono", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = ON;
    // centred on the full line, so the text does not drift while it decodes
    const full = ctx.measureText(str).width;
    ctx.fillText(s, w / 2 - full / 2, y0 + 3 * C + 2 * gap + C * 0.42);
    ctx.restore();
  }

  // ---- every frame: wrap the grid -----------------------------------------------------------------------
  drawIndex = function (f) {
    const { C, t } = layout, cur = bootDone(f) ? hover : null;
    if (cur !== P.cell) {
      if (P.cell !== null) { P.last = P.cell; P.leftAt = f; }
      P.cell = cur; P.at = f; restart();
    }
    const rel = f - P.at, out = f - P.leftAt, leaving = k => k === P.last && k !== P.cell;
    // with the label, the other cells dim while the cursor is on the grid
    if (f !== P.frame) { P.frame = f; P.focus += ((P.cell !== null && P.n === 1 ? 1 : 0) - P.focus) * 0.3; }
    GRID.forEach((name, k) => {
      ctx.save();
      if (k !== P.cell) ctx.globalAlpha = 1 - 0.65 * P.focus;
      if (P.h === 2 && k === P.cell) negative(k, at(rel, FILL));
      else if (P.h === 2 && leaving(k) && out < DRAIN.length) negative(k, DRAIN[out]);
      else if (P.h === 4 && k === P.cell) lift(k, at(rel, UP));
      else if (P.h === 4 && leaving(k) && out < DOWN.length) lift(k, DOWN[out]);
      else drawCellAt(k, f);
      ctx.restore();
    });
    if (P.cell !== null) {
      if (P.h === 0) { const [x, y] = cellBox(P.cell); drawBootBrackets(ctx, x, y, C, t); }
      if (P.h === 1) lock(P.cell, rel);
      if (P.h === 3) sight(P.cell, rel);
      if (P.n === 1) nameLabel(P.cell, rel);
      if (P.n === 2) nameTab(P.cell, rel);
    }
    if (P.n === 3) nameStatus(f);
    if (params.get('cap') !== '0') {
      ctx.save(); ctx.globalAlpha = 0.55;
      ctx.font = `600 ${15 * u}px "JetBrains Mono", monospace`; ctx.textAlign = 'left'; ctx.fillStyle = ON;
      ctx.fillText(`PROTO 13   [H] SURVOL ${P.h} · ${HOVERS[P.h]}   [N] NOM ${NKEYS[P.n].toUpperCase()} · ${NAMES[P.n]}`, X(40), Y(64));
      ctx.restore();
    }
  };

  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k !== 'h' && k !== 'n') return;
    if (k === 'h') P.h = (P.h + 1) % HOVERS.length; else P.n = (P.n + 1) % NAMES.length;
    P.at = frameNow; restart();
    params.set('h', P.h); params.set('n', NKEYS[P.n]);
    history.replaceState(null, '', `?${params}`);
  });
})();
