// Original placeholder pictograms, drawn white on black in a 100×100 box.
// Shared by the prototypes; each project will get its own pictogram later.

const ON = '#fff', OFF = '#000', SW = 8.5;

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function disc(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function poly(c, pts, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fill();
}
function strokePath(c, pts, w, col = ON) {
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.stroke();
}

const PICTOS = {
  camera(c) {
    c.fillStyle = ON; rr(c, 8, 30, 84, 54, 6); c.fill(); c.fillRect(32, 19, 28, 13);
    disc(c, 50, 57, 21, OFF); disc(c, 50, 57, 12.5, ON); disc(c, 46, 53, 3.5, OFF);
    c.fillStyle = OFF; c.fillRect(74, 38, 11, 7);
  },
  pencil(c) {
    c.save(); c.translate(52, 46); c.rotate(-Math.PI / 4);
    c.fillStyle = ON;
    c.fillRect(-47, -11, 9, 22);           // eraser
    c.fillRect(-35, -11, 6, 22);           // ferrule
    c.fillRect(-26, -11, 42, 22);          // body
    poly(c, [19, -11, 45, 0, 19, 11], ON); // cone
    c.fillStyle = OFF;
    c.fillRect(-26, -1.5, 42, 3);          // body groove
    c.fillRect(33, -8, 3, 16);             // lead / wood split
    c.restore();
    c.fillStyle = ON; c.fillRect(10, 88, 34, 6);
  },
  globe(c) {
    c.save(); c.beginPath(); c.arc(50, 50, 40, 0, Math.PI * 2); c.clip();
    c.strokeStyle = ON; c.lineWidth = SW * 0.8;
    c.beginPath(); c.ellipse(50, 50, 16, 40, 0, 0, Math.PI * 2); c.stroke();
    strokePath(c, [10, 50, 90, 50], SW * 0.8); strokePath(c, [50, 8, 50, 92], SW * 0.8);
    strokePath(c, [10, 30, 90, 30], SW * 0.7); strokePath(c, [10, 70, 90, 70], SW * 0.7);
    c.restore();
    c.strokeStyle = ON; c.lineWidth = SW; c.beginPath(); c.arc(50, 50, 40 - SW / 2, 0, Math.PI * 2); c.stroke();
  },
  truck(c) {
    c.fillStyle = ON; c.fillRect(4, 24, 58, 46);
    poly(c, [66, 36, 82, 36, 96, 54, 96, 70, 66, 70], ON);
    poly(c, [71, 42, 80, 42, 89, 54, 71, 54], OFF);
    for (const x of [24, 80]) { disc(c, x, 74, 15, OFF); disc(c, x, 74, 10, ON); disc(c, x, 74, 3.5, OFF); }
  },
  headphones(c) {
    c.strokeStyle = ON; c.lineWidth = SW; c.beginPath(); c.arc(50, 58, 35, Math.PI, 0); c.stroke();
    c.fillStyle = ON; rr(c, 8, 52, 22, 36, 5); c.fill(); rr(c, 70, 52, 22, 36, 5); c.fill();
    c.fillStyle = OFF; c.fillRect(21, 58, 4, 24); c.fillRect(75, 58, 4, 24);
  },
  film(c) {
    c.fillStyle = ON; c.fillRect(12, 44, 76, 44);
    c.fillStyle = OFF; c.fillRect(12, 54, 76, 4);
    c.save(); c.translate(12, 38); c.rotate(-0.24);
    c.fillStyle = ON; c.fillRect(0, -14, 77, 14);
    for (let i = 0; i < 4; i++) poly(c, [8 + i * 19, 0, 17 + i * 19, -14, 25 + i * 19, -14, 16 + i * 19, 0], OFF);
    c.restore();
    for (let i = 0; i < 4; i++) poly(c, [16 + i * 19, 44, 24 + i * 19, 44, 30 + i * 19, 54, 22 + i * 19, 54], OFF);
  },
  mountain(c) {
    poly(c, [2, 88, 38, 28, 56, 56, 68, 40, 98, 88], ON);
    strokePath(c, [25, 50, 31, 56, 38, 48, 45, 56, 51, 50], SW * 0.6, OFF);
    disc(c, 78, 20, 9, ON);
  },
  code(c) {
    c.lineJoin = 'miter'; c.lineCap = 'butt';
    strokePath(c, [34, 26, 10, 50, 34, 74], SW * 1.15);
    strokePath(c, [66, 26, 90, 50, 66, 74], SW * 1.15);
    strokePath(c, [58, 16, 42, 84], SW * 1.1);
  },
  eye(c) {
    c.fillStyle = ON; c.beginPath(); c.moveTo(4, 50); c.quadraticCurveTo(50, 4, 96, 50); c.quadraticCurveTo(50, 96, 4, 50); c.fill();
    disc(c, 50, 50, 21, OFF); disc(c, 50, 50, 12, ON); disc(c, 55, 45, 4, OFF);
  },
  bolt(c) { poly(c, [60, 2, 20, 58, 46, 58, 36, 98, 80, 38, 54, 38, 66, 2], ON); },
  phone(c) {
    c.fillStyle = ON; rr(c, 27, 4, 46, 92, 8); c.fill();
    c.fillStyle = OFF; c.fillRect(33, 16, 34, 60); c.fillRect(43, 9, 14, 3);
    disc(c, 50, 86, 4.5, OFF);
  },
  lock(c) {
    c.strokeStyle = ON; c.lineWidth = SW; c.beginPath(); c.arc(50, 40, 19, Math.PI, 0);
    c.lineTo(69, 50); c.moveTo(31, 40); c.lineTo(31, 50); c.stroke();
    c.fillStyle = ON; rr(c, 18, 48, 64, 44, 4); c.fill();
    disc(c, 50, 64, 7, OFF); c.fillStyle = OFF; c.fillRect(46.5, 64, 7, 16);
  },
  chat(c) {
    c.fillStyle = ON; rr(c, 6, 12, 88, 58, 10); c.fill();
    poly(c, [22, 66, 18, 92, 46, 66], ON);
    for (const x of [30, 50, 70]) disc(c, x, 41, 6.5, OFF);
  },
  search(c) {
    c.strokeStyle = ON; c.lineWidth = SW * 1.15; c.beginPath(); c.arc(42, 42, 27, 0, Math.PI * 2); c.stroke();
    c.lineCap = 'butt'; strokePath(c, [62, 62, 90, 90], SW * 1.8);
  },
  cursor(c) { poly(c, [26, 6, 26, 80, 43, 64, 56, 92, 70, 86, 57, 58, 80, 58], ON); },
};

const GRID = [
  'camera', 'pencil', 'globe', 'truck', 'headphones',
  'film', 'mountain', 'code', 'eye', 'bolt',
  'phone', 'lock', 'chat', 'search', 'cursor',
];
const DIM = new Set();   // cells shown dimmed (none for now)
