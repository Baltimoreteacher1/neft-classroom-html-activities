// Bio-Resonance Mixer apparatus drawing. Zero allocation, measured:
//  - every argument passed between functions here is an integer (Smi), an
//    object, or a constant; computed doubles stay in locals of the function that
//    made them, and angles travel through the ANG typed-array scratch;
//  - coordinates reach the canvas `| 0`'d; rotation is done in JS (cos/sin);
//  - colours come from tables built once at module load; strings from g.labels.

import { alphaLevel, dot, line, rect, roundRect, TAU, text } from "../core/draw.js";

export const S_A = 0;
export const S_B = 1;
export const S_A2 = 2;
export const S_B2 = 3;
export const S_NEEDLE = 4;
export const S_VALVE = 5;
export const S_OUT = 6;
export const SPRINGS = 7;
export const F_GEAR = 0;
export const F_PUMP = 1;
export const F_RATIO = 2;

const TEAL = "#2fd3c4";
const AMBER = "#f2a93b";
const GOLD = "#ffd166";
const INK = "#e8eefc";
const MUTED = "#a9b6d3";
const GLASS = "#0e1a30";
const EDGE = "#5b6f96";
const EMPTY = "#1a2740";
const HUB = "#0b1220";
const ARC_FROM = Math.PI * 1.15;
const ARC_TO = Math.PI * 1.85;
const ZONE_FROM = Math.PI * 1.47;
const ZONE_TO = Math.PI * 1.53;
export const LAMP = ["#3b5785", "#7bdc8f", "#f2b45a"];

/** Mixture colour table: index = percent of the mixture that is enzyme A (teal). */
export const MIX = [];
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  const r = Math.round(242 + (47 - 242) * t);
  const g = Math.round(169 + (211 - 169) * t);
  const b = Math.round(59 + (196 - 59) * t);
  MIX.push(`rgb(${r},${g},${b})`);
}

/** Angle scratch: ANG[0] is the angle drawGear uses (a double never passed as an argument). */
const ANG = new Float64Array(1);

/** Colour-table index of the mixture held in springs ia/ib, or -1 when empty. */
function mixFrom(pos, ia, ib) {
  const x = pos[ia] < 0 ? 0 : pos[ia];
  const y = pos[ib] < 0 ? 0 : pos[ib];
  const t = x + y;
  if (t < 0.05) return -1;
  const i = ((x / t) * 100 + 0.5) | 0;
  return i < 0 ? 0 : i > 100 ? 100 : i;
}

/** Fill height in pixels (integer) for amount spring i of capacity cap in a tank h tall. */
function fillPx(pos, i, j, cap, h) {
  const a = (pos[i] < 0 ? 0 : pos[i]) + (j < 0 ? 0 : pos[j] < 0 ? 0 : pos[j]);
  const f = a / cap;
  return (h * (f > 1 ? 1 : f)) | 0;
}

/** Gear at integer centre and radius; rotation angle read from ANG[0]. */
function drawGear(ctx, cx, cy, r, teeth, color) {
  const base = ANG[0];
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = base + (i * TAU) / teeth;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x0 = r - 4;
    const x1 = r + 11;
    ctx.moveTo((cx + x0 * c + 6 * s) | 0, (cy + x0 * s - 6 * c) | 0);
    ctx.lineTo((cx + x1 * c + 5 * s) | 0, (cy + x1 * s - 5 * c) | 0);
    ctx.lineTo((cx + x1 * c - 5 * s) | 0, (cy + x1 * s + 5 * c) | 0);
    ctx.lineTo((cx + x0 * c - 6 * s) | 0, (cy + x0 * s + 6 * c) | 0);
    ctx.closePath();
  }
  ctx.fill();
  dot(ctx, cx, cy, r);
  ctx.fillStyle = HUB;
  dot(ctx, cx, cy, (r * 0.32) | 0);
  ctx.strokeStyle = HUB;
  ctx.lineWidth = 4;
  const c = Math.cos(base);
  const s = Math.sin(base);
  ctx.beginPath();
  ctx.moveTo((cx + r * 0.35 * c) | 0, (cy + r * 0.35 * s) | 0);
  ctx.lineTo((cx + r * 0.9 * c) | 0, (cy + r * 0.9 * s) | 0);
  ctx.stroke();
}

/** Glass tank with a glowing fluid column fh pixels tall (integer) in colour idx. */
function drawTank(ctx, x, y, w, h, fh, idx) {
  ctx.fillStyle = GLASS;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  if (fh > 0) {
    const color = idx < 0 ? EMPTY : MIX[idx];
    alphaLevel(ctx, 4);
    ctx.fillStyle = color;
    rect(ctx, x - 12, y + h - fh - 12, w + 24, fh + 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    rect(ctx, x + 6, y + h - fh, w - 12, fh - 6);
  }
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  ctx.strokeStyle = "rgba(169,182,211,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 10; i++) {
    const ty = (y + (h * i) / 10) | 0;
    line(ctx, x + w - 22, ty, x + w - 6, ty);
  }
  ctx.stroke();
}

function plate(ctx, x, y, w, h) {
  ctx.fillStyle = "#111a2e";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = "#2c3e63";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
}

function drawRows(ctx, rows, target, x, y) {
  ctx.font = "700 17px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(232,238,252,0.85)";
  for (let i = 0; i < rows.length; i++) text(ctx, rows[i], x, y + i * 26);
  ctx.fillStyle = GOLD;
  text(ctx, target, x, y + rows.length * 26);
}

function drawGauge(ctx, g, cx, cy) {
  ctx.strokeStyle = "#2c3e63";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, ARC_FROM, ARC_TO);
  ctx.stroke();
  ctx.strokeStyle = "#7bdc8f";
  ctx.beginPath();
  ctx.arc(cx, cy, 90, ZONE_FROM, ZONE_TO);
  ctx.stroke();
  const a = g.springs.pos[S_NEEDLE];
  // Needle angle -π/2 + a: endpoint (sin a, -cos a).
  ctx.strokeStyle = g.lamp === 1 ? "#7bdc8f" : GOLD;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo((cx + Math.sin(a) * 82) | 0, (cy - Math.cos(a) * 82) | 0);
  ctx.stroke();
  ctx.fillStyle = INK;
  dot(ctx, cx, cy, 9);
  ctx.font = "700 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  text(ctx, g.labels.gauge, cx, cy + 34);
}

function drawEquiv(ctx, g) {
  const L = g.labels;
  const pos = g.springs.pos;
  const rA = g.rA;
  const rB = g.rB;
  const ax = 40 + rA;
  const bx = ax + rA + rB + 22;
  ANG[0] = g.f[F_GEAR];
  drawGear(ctx, ax, 150, rA, g.teethA, TEAL);
  ANG[0] = -g.f[F_GEAR] * g.f[F_RATIO];
  drawGear(ctx, bx, 150, rB, g.teethB, AMBER);
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = TEAL;
  text(ctx, L.perA, ax, 262);
  ctx.fillStyle = AMBER;
  text(ctx, L.perB, bx, 284);
  // Pipes from each drum into the chamber.
  ctx.lineWidth = 8;
  ctx.strokeStyle = TEAL;
  ctx.beginPath();
  line(ctx, ax, 296, ax, 320);
  line(ctx, ax, 320, 440, 320);
  ctx.stroke();
  ctx.strokeStyle = AMBER;
  ctx.beginPath();
  line(ctx, bx, 296, bx, 360);
  line(ctx, bx, 360, 440, 360);
  ctx.stroke();
  // Valve handle on the B pipe follows the slider.
  const va = pos[S_VALVE] * Math.PI;
  const hx = Math.cos(va) * 22;
  const hy = Math.sin(va) * 22;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo((bx + 60 - hx) | 0, (360 - hy) | 0);
  ctx.lineTo((bx + 60 + hx) | 0, (360 + hy) | 0);
  ctx.stroke();
  drawTank(ctx, 430, 70, 200, 410, fillPx(pos, S_A, S_B, g.cap, 410), mixFrom(pos, S_A, S_B));
  // Target resonance swatch (a colour, never a number).
  plate(ctx, 670, 60, 260, 84);
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  text(ctx, L.target, 800, 86);
  ctx.fillStyle = MIX[g.target1];
  rect(ctx, 690, 100, 220, 28);
  drawGauge(ctx, g, 800, 290);
  plate(ctx, 670, 400, 260, 84);
  ctx.font = "700 20px system-ui";
  ctx.textAlign = "left";
  ctx.fillStyle = TEAL;
  text(ctx, L.plateA, 690, 432);
  ctx.fillStyle = AMBER;
  text(ctx, L.plateB, 690, 466);
  if (g.tier >= 1) drawRows(ctx, L.rows, L.rowTarget, 530, 108);
  if (g.tier >= 2) {
    ctx.font = "700 17px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    text(ctx, L.batch, 530, 512);
  }
}

function drawRate(ctx, g) {
  const L = g.labels;
  const pos = g.springs.pos;
  ANG[0] = g.f[F_GEAR];
  drawGear(ctx, 130, 150, 70, 12, TEAL);
  ctx.font = "700 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  text(ctx, L.rate, 130, 262);
  plate(ctx, 250, 50, 330, 84);
  ctx.fillStyle = GOLD;
  ctx.font = "700 15px system-ui";
  text(ctx, L.log, 415, 78);
  ctx.fillStyle = INK;
  ctx.font = "700 21px system-ui";
  text(ctx, L.logLine, 415, 112);
  ctx.lineWidth = 8;
  ctx.strokeStyle = TEAL;
  ctx.beginPath();
  line(ctx, 210, 150, 640, 150);
  ctx.stroke();
  drawTank(ctx, 650, 70, 200, 410, fillPx(pos, S_OUT, -1, g.cap, 410), 72);
  // The log line: where the tank must reach after c cycles.
  const ly = g.logY;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, 634, ly, 866, ly);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "right";
  text(ctx, L.log, 630, ly + 5);
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  text(ctx, L.made, 750, 510);
  if (g.tier >= 1) drawRateLine(ctx, g);
  if (g.tier >= 2) drawCups(ctx, g);
}

function drawRateLine(ctx, g) {
  const L = g.labels;
  const c = g.q.c;
  const x0 = 80;
  const x1 = 560;
  const y = 300;
  const dx = (x1 - x0) / c;
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  line(ctx, x0, y, x1, y);
  line(ctx, x0, y + 40, x1, y + 40);
  for (let i = 0; i <= c; i++) {
    const x = (x0 + dx * i) | 0;
    line(ctx, x, y - 6, x, y + 6);
    line(ctx, x, y + 34, x, y + 46);
  }
  ctx.stroke();
  ctx.font = "700 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  for (let i = 0; i <= c; i++) text(ctx, L.cyc[i], (x0 + dx * i) | 0, y - 12);
  ctx.fillStyle = GOLD;
  text(ctx, L.zero, x0, y + 66);
  text(ctx, L.unknown, (x0 + dx) | 0, y + 66);
  text(ctx, L.unitsQ, x1, y + 66);
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  text(ctx, L.cycWord, x1 + 12, y + 5);
  text(ctx, L.unitWord, x1 + 12, y + 45);
}

function drawCups(ctx, g) {
  const c = g.q.c;
  const cw = (440 / c) | 0;
  for (let i = 0; i < c; i++) {
    const x = 80 + i * cw;
    const h = g.cups[i] * 4;
    ctx.fillStyle = TEAL;
    rect(ctx, x + 4, 520 - h, cw - 8, h);
    ctx.strokeStyle = HUB;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let u = 16; u < h; u += 16) line(ctx, x + 4, 520 - u, x + cw - 4, 520 - u);
    ctx.stroke();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, 410, cw - 4, 110);
  }
}

function drawMixer(ctx, g, m) {
  const L = g.labels;
  const q = g.q;
  const pos = g.springs.pos;
  const x = m === 1 ? 150 : 630;
  const ta = (m === 1 ? q.a1 : q.a2) * 4;
  const tb = (m === 1 ? q.b1 : q.b2) * 4;
  const rA = (14 + ta * 1.3) | 0;
  const rB = (14 + tb * 1.3) | 0;
  const cx = x + 90;
  ANG[0] = g.f[F_GEAR];
  drawGear(ctx, cx - rB - 10, 96, rA, ta, TEAL);
  ANG[0] = (-g.f[F_GEAR] * ta) / tb;
  drawGear(ctx, cx + rA + 10, 96, rB, tb, AMBER);
  const sA = m === 1 ? S_A : S_A2;
  const sB = m === 1 ? S_B : S_B2;
  drawTank(ctx, x, 180, 180, 290, fillPx(pos, sA, sB, g.cap, 290), mixFrom(pos, sA, sB));
  if (g.pick === m) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    roundRect(ctx, x - 8, 172, 196, 306, 18);
    ctx.stroke();
  }
  ctx.font = "700 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  text(ctx, m === 1 ? L.m1 : L.m2, cx, 166);
  ctx.font = "700 16px system-ui";
  ctx.fillStyle = GOLD;
  text(ctx, m === 1 ? L.proof1 : L.proof2, cx, 500);
  if (g.tier >= 1) drawRows(ctx, m === 1 ? L.rows1 : L.rows2, L.target1, cx, 214);
  if (g.tier >= 2) {
    ctx.font = "700 15px system-ui";
    ctx.fillStyle = MUTED;
    text(ctx, m === 1 ? L.b1 : L.b2, cx, 526);
  }
}

function drawCompare(ctx, g) {
  const L = g.labels;
  drawMixer(ctx, g, 1);
  drawMixer(ctx, g, 2);
  plate(ctx, 390, 280, 180, 90);
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  text(ctx, L.commonTitle, 480, 308);
  ctx.font = "700 24px system-ui";
  ctx.fillStyle = TEAL;
  text(ctx, L.common, 480, 346);
  ctx.fillStyle = LAMP[g.lamp];
  dot(ctx, 480, 410, 14);
}

function drawConvert(ctx, g) {
  const L = g.labels;
  plate(ctx, 250, 24, 460, 56);
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  text(ctx, L.fact, 480, 60);
  ANG[0] = g.f[F_GEAR];
  drawGear(ctx, 230, 270, 110, 24, TEAL);
  ANG[0] = (-g.f[F_GEAR] * 110) / 52;
  drawGear(ctx, 410, 270, 52, 11, AMBER);
  ctx.font = "700 20px system-ui";
  ctx.fillStyle = INK;
  text(ctx, L.inTitle, 230, 420);
  text(ctx, L.inPlate, 230, 448);
  plate(ctx, 560, 170, 340, 150);
  ctx.font = "700 16px system-ui";
  ctx.fillStyle = MUTED;
  text(ctx, L.outTitle, 730, 200);
  ctx.font = "700 32px system-ui";
  ctx.fillStyle = INK;
  text(ctx, L.outPlate, 730, 262);
  // Counter wheel spokes spin with the output spring.
  const base = g.springs.pos[S_OUT];
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = base + (i * TAU) / 8;
    ctx.moveTo(620, 290);
    ctx.lineTo((620 + Math.cos(a) * 16) | 0, (290 + Math.sin(a) * 16) | 0);
  }
  ctx.stroke();
  ctx.fillStyle = LAMP[g.lamp];
  dot(ctx, 878, 196, 12);
  if (g.arrow !== 0) {
    ctx.fillStyle = LAMP[2];
    const d = g.arrow * 14;
    ctx.beginPath();
    ctx.moveTo(864, 246 - d);
    ctx.lineTo(892, 246 - d);
    ctx.lineTo(878, 246 + d);
    ctx.closePath();
    ctx.fill();
  }
  if (g.tier >= 1) drawRows(ctx, L.rows, L.rowTarget, 730, 370);
  if (g.tier >= 2) {
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    text(ctx, L.feedIn, 230, 490);
    text(ctx, L.feedOut, 230, 518);
  }
}

/** Draw the whole apparatus for the current round mode. */
export function drawScene(ctx, g) {
  if (g.mode === "equiv") drawEquiv(ctx, g);
  else if (g.mode === "rate") drawRate(ctx, g);
  else if (g.mode === "compare") drawCompare(ctx, g);
  else drawConvert(ctx, g);
  g.particles.render(ctx);
}
