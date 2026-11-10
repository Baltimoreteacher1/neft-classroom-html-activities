// Pulse Matrix apparatus drawing. Zero allocation per frame: integer coordinates
// through draw.js helpers, Pivot instead of ctx.rotate, constant colour strings,
// labels built in refreshLabels(), static artwork in pre-rendered layers.

import { H, W } from "../core/engine.js";
import { alphaLevel, dot, line, Pivot, rect, ring, text } from "../core/draw.js";

export { H, W };

export const AX0 = 120;
export const UNIT = 60;
export const AX1 = AX0 + 12 * UNIT;
export const PIV_Y = 345;
const DOT_R = 12;
const ROW = 26;
const LANE_Y = 428;
const LANE_GAP = 10;
const SUM_Y = 112;
const SUM_UNIT = 10;
const STRIP_Y = 494;
const STRIP_X0 = 150;
const STRIP_W = 660;
const BOX_Y = 425;
const JAW_TOP = 182;
const GAUGE_X = 905;
const GAUGE_Y = 236;
const GAUGE_R = 34;
const PI = Math.PI;

// Spring layout.
export const S_TILT = 0;
export const S_FULC = 1;
export const S_DIAL = 2;
export const S_Q1 = 3;
export const S_MED = 4;
export const S_Q3 = 5;
export const S_BOX = 6;
export const S_GAUGE = 7;
export const S_SUM = 8;
export const S_DX = 9;
export const S_DK = 20;
export const S_DROP = 31;
export const S_BAND = 42;
export const SPRINGS = 53;

export const PALETTE = ["#ffd166", "#46c2b8", "#7bdc8f", "#ff6b6b", "#b8c7ff"];
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const BAND_COLORS = ["#7bdc8f", "#c6e07a", "#f2d45a", "#f2a65a", "#ff6b6b"];
const LEFT_INK = "#7fb2ff";
const RIGHT_INK = "#f2a65a";
const pv = new Pivot();


/** Static: the 13 particle chutes along the top of the stage. */
export function paintChutes(g) {
  g.fillStyle = "#16233d";
  g.strokeStyle = "#2c3e63";
  g.lineWidth = 2;
  for (let v = 0; v <= 12; v++) {
    const x = AX0 + v * UNIT;
    g.beginPath();
    g.moveTo(x - 22, 6);
    g.lineTo(x + 22, 6);
    g.lineTo(x + 9, 46);
    g.lineTo(x - 9, 46);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

/** Static: the tension gauge face (tension rounds). */
export function paintGauge(g) {
  g.fillStyle = "#111a2e";
  g.beginPath();
  g.arc(GAUGE_X, GAUGE_Y, GAUGE_R + 10, PI, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = "#2c3e63";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(GAUGE_X, GAUGE_Y, GAUGE_R, PI, 0);
  g.stroke();
  g.strokeStyle = "#a9b6d3";
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = PI + (PI * i) / 6;
    g.moveTo(GAUGE_X + Math.cos(a) * (GAUGE_R - 8), GAUGE_Y + Math.sin(a) * (GAUGE_R - 8));
    g.lineTo(GAUGE_X + Math.cos(a) * GAUGE_R, GAUGE_Y + Math.sin(a) * GAUGE_R);
  }
  g.stroke();
}

/** Static: the ruler under the tier-2 sum bar (0..70 band units). */
export function paintSumRuler(g) {
  g.strokeStyle = "#a9b6d3";
  g.fillStyle = "#e8eefc";
  g.lineWidth = 1;
  g.font = "12px system-ui";
  g.textAlign = "center";
  g.beginPath();
  for (let u = 0; u <= 70; u++) {
    const x = AX0 + u * SUM_UNIT + 0.5;
    g.moveTo(x, SUM_Y + 18);
    g.lineTo(x, SUM_Y + (u % 5 === 0 ? 28 : 23));
  }
  g.stroke();
  for (let u = 0; u <= 70; u += 5) g.fillText(String(u), AX0 + u * SUM_UNIT, SUM_Y + 42);
}

/** @param {any} e the engine @param {CanvasRenderingContext2D} ctx */
export function renderScene(e, ctx) {
  e.backdrop(ctx);
  ctx.drawImage(e.layers.chutes, 0, 0, W, H);
  if (!e.round) return;
  const mode = e.mode;
  if (mode === "tension") drawTensionBack(e, ctx);
  drawShelf(e, ctx);
  if (mode === "balance") drawBalanceAids(e, ctx);
  else if (mode === "tension") drawTensionFront(e, ctx);
  else drawClamps(e, ctx);
  e.particles.render(ctx);
}

function drawShelf(e, ctx) {
  const sp = e.springs;
  const f = sp.pos[S_FULC];
  const a = sp.pos[S_TILT];
  const fx = (AX0 + f * UNIT) | 0;
  // Rotation set field by field: no computed double crosses a call boundary.
  pv.cx = fx;
  pv.cy = PIV_Y;
  pv.c = Math.cos(a);
  pv.s = Math.sin(a);
  const mode = e.mode;
  if (mode === "clamp") {
    ctx.fillStyle = "#24365c";
    rect(ctx, AX0 - 40, PIV_Y, 24, 70);
    rect(ctx, AX1 + 16, PIV_Y, 24, 70);
  } else {
    ctx.fillStyle = "#2c3e63";
    rect(ctx, AX0 - 60, PIV_Y + 70, AX1 - AX0 + 120, 4);
    ctx.fillStyle = mode === "tension" ? "#46c2b8" : "#ffd166";
    ctx.beginPath();
    ctx.moveTo(fx | 0, PIV_Y);
    ctx.lineTo((fx + 34) | 0, PIV_Y + 70);
    ctx.lineTo((fx - 34) | 0, PIV_Y + 70);
    ctx.closePath();
    ctx.fill();
  }
  // Beam.
  ctx.fillStyle = "#3b5785";
  pv.rectPath(ctx, ((6 - f) * UNIT) | 0, -6, 12 * UNIT + 40, 12);
  ctx.fill();
  // Engraved scale (positions rotate with the beam, glyphs stay upright).
  ctx.strokeStyle = "#a9b6d3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let v = 0; v <= 12; v++) {
    const lx = ((v - f) * UNIT) | 0;
    line(ctx, pv.px(lx, -12), pv.py(lx, -12), pv.px(lx, -4), pv.py(lx, -4));
  }
  ctx.stroke();
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 14px system-ui";
  ctx.textAlign = "center";
  for (let v = 0; v <= 12; v++) {
    const lx = ((v - f) * UNIT) | 0;
    text(ctx, DIGITS[v], pv.px(lx, 22), pv.py(lx, 22));
  }
  // Particles.
  const n = e.n;
  for (let i = 0; i < n; i++) {
    const lx = ((sp.pos[S_DX + i] - f) * UNIT) | 0;
    const ly = (-12 - DOT_R - sp.pos[S_DK + i] * ROW) | 0;
    const x = pv.px(lx, ly);
    const y = (pv.py(lx, ly) + sp.pos[S_DROP + i]) | 0;
    ctx.fillStyle = e.solved ? "#7bdc8f" : "#b8c7ff";
    dot(ctx, x, y, DOT_R);
    ctx.fillStyle = "#ffffff";
    dot(ctx, x - 4, y - 4, 3);
  }
}

function drawBalanceAids(e, ctx) {
  if (e.tier < 1) return;
  const sp = e.springs;
  const f = sp.pos[S_FULC];
  // Torque vectors: each particle pulls down with a lever arm |x − f|.
  ctx.lineWidth = 4;
  for (let i = 0; i < e.n; i++) {
    const d = sp.pos[S_DX + i] - f;
    const lx = (d * UNIT) | 0;
    const len = ((d < 0 ? -d : d) * 7) | 0;
    ctx.strokeStyle = d < 0 ? LEFT_INK : RIGHT_INK;
    ctx.beginPath();
    line(ctx, pv.px(lx, 8), pv.py(lx, 8), pv.px(lx, 8 + len), pv.py(lx, 8 + len));
    ctx.stroke();
  }
  ctx.font = "700 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillStyle = LEFT_INK;
  text(ctx, e.labels.pullL, AX0 - 40, 150);
  ctx.textAlign = "right";
  ctx.fillStyle = RIGHT_INK;
  text(ctx, e.labels.pullR, AX1 + 40, 150);
}

function drawTensionBack(e, ctx) {
  // The student's MAD reach: a shaded zone mean ± dial behind the stack.
  const d = e.springs.pos[S_DIAL];
  if (d <= 0.01) return;
  const x0 = (AX0 + (e.mean - d) * UNIT) | 0;
  const x1 = (AX0 + (e.mean + d) * UNIT) | 0;
  alphaLevel(ctx, 4);
  ctx.fillStyle = "#46c2b8";
  rect(ctx, x0, 190, x1 - x0, PIV_Y - 202);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#46c2b8";
  rect(ctx, x0 - 1, 190, 3, PIV_Y - 202);
  rect(ctx, x1 - 1, 190, 3, PIV_Y - 202);
}

function drawTensionFront(e, ctx) {
  const sp = e.springs;
  const xm = (AX0 + e.mean * UNIT) | 0;
  const L = e.labels;
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#46c2b8";
  rect(ctx, xm - 1, 196, 2, PIV_Y - 208);
  text(ctx, L.mean, xm, 190);
  // Elastic bands: one lane per particle, from the particle to the mean.
  ctx.lineWidth = 4;
  ctx.font = "700 11px system-ui";
  ctx.textAlign = "left";
  for (let i = 0; i < e.n; i++) {
    const v = sp.pos[S_DX + i];
    const xv = (AX0 + v * UNIT) | 0;
    const y = (LANE_Y + i * LANE_GAP + sp.pos[S_BAND + i]) | 0;
    const dev = e.work[i] - e.mean;
    const mag = (dev < 0 ? -dev : dev) | 0;
    const ci = mag >> 1;
    if (e.tier >= 2 && i < e.stacked) alphaLevel(ctx, 5);
    ctx.strokeStyle = "#3b5785";
    ctx.lineWidth = 1;
    ctx.beginPath();
    line(ctx, xv, PIV_Y + 30, xv, y);
    ctx.stroke();
    ctx.strokeStyle = BAND_COLORS[ci > 4 ? 4 : ci];
    ctx.lineWidth = 4;
    ctx.beginPath();
    line(ctx, xv, y, xm, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (e.tier >= 1) {
      ctx.fillStyle = "#ffd166";
      text(ctx, L.dev[i], (xv > xm ? xv : xm) + 8, y + 4);
    }
  }
  // Tension gauge: total stretch, no numbers.
  ctx.drawImage(e.layers.gauge, 0, 0, W, H);
  const g = sp.pos[S_GAUGE];
  const ang = PI + (g < 0 ? 0 : g > 1 ? 1 : g) * PI;
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const nx = (GAUGE_X + Math.cos(ang) * (GAUGE_R - 4)) | 0;
  const ny = (GAUGE_Y + Math.sin(ang) * (GAUGE_R - 4)) | 0;
  line(ctx, GAUGE_X, GAUGE_Y, nx, ny);
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  dot(ctx, GAUGE_X, GAUGE_Y, 5);
  if (e.tier >= 2) drawSumBar(e, ctx);
}

function drawSumBar(e, ctx) {
  ctx.drawImage(e.layers.sumRuler, 0, 0, W, H);
  const s = e.springs.pos[S_SUM];
  const len = (s * SUM_UNIT) | 0;
  ctx.fillStyle = "#f2a65a";
  rect(ctx, AX0, SUM_Y, len, 16);
  if (e.stacked >= e.n && e.n > 0) {
    // All bands stacked: split the total into n equal shares.
    ctx.fillStyle = "#070d1a";
    for (let j = 1; j < e.n; j++) rect(ctx, (AX0 + (len * j) / e.n - 1) | 0, SUM_Y - 3, 2, 22);
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 14px system-ui";
    ctx.textAlign = "left";
    text(ctx, e.labels.share, AX0, SUM_Y - 10);
  }
}

function drawClamps(e, ctx) {
  const sp = e.springs;
  drawJaw(ctx, (AX0 + sp.pos[S_Q1] * UNIT) | 0, "#7fb2ff", "Q1");
  drawJaw(ctx, (AX0 + sp.pos[S_Q3] * UNIT) | 0, "#7fb2ff", "Q3");
  drawJaw(ctx, (AX0 + sp.pos[S_MED] * UNIT) | 0, "#ffd166", "M");
  const box = sp.pos[S_BOX];
  if (box > 0.02) {
    const r = e.round;
    const xMin = (AX0 + r.min * UNIT) | 0;
    const xQ1 = (AX0 + r.q1 * UNIT) | 0;
    const xMed = (AX0 + r.med * UNIT) | 0;
    const xQ3 = (AX0 + r.q3 * UNIT) | 0;
    const xMax = (AX0 + r.max * UNIT) | 0;
    alphaLevel(ctx, ((box > 1 ? 1 : box) * 20 + 0.5) | 0);
    ctx.strokeStyle = "#7bdc8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    line(ctx, xMin, BOX_Y, xQ1, BOX_Y);
    line(ctx, xQ3, BOX_Y, xMax, BOX_Y);
    line(ctx, xMin, BOX_Y - 12, xMin, BOX_Y + 12);
    line(ctx, xMax, BOX_Y - 12, xMax, BOX_Y + 12);
    line(ctx, xMed, BOX_Y - 20, xMed, BOX_Y + 20);
    ctx.stroke();
    ctx.strokeRect(xQ1, BOX_Y - 20, xQ3 - xQ1, 40);
    ctx.globalAlpha = 1;
  }
  if (e.tier >= 1) drawStrip(e, ctx);
}

function drawJaw(ctx, x, color, label) {
  ctx.fillStyle = color;
  rect(ctx, x - 4, JAW_TOP, 8, PIV_Y - 12 - JAW_TOP);
  rect(ctx, x - 12, JAW_TOP, 24, 6);
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  text(ctx, label, x, JAW_TOP - 8);
}

/** Tier 1: the data as a sorted strip with ghost split lines (halves, then quarters). */
function drawStrip(e, ctx) {
  const n = e.n;
  const step = (STRIP_W / (n - 1)) | 0;
  const h = n >> 1;
  ctx.font = "700 13px system-ui";
  ctx.textAlign = "center";
  for (let i = 0; i < n; i++) {
    const x = STRIP_X0 + i * step;
    const s = e.tier >= 2 ? e.bead[i] : 0;
    if (s === 1) alphaLevel(ctx, 5);
    ctx.fillStyle = "#b8c7ff";
    dot(ctx, x, STRIP_Y, 13);
    ctx.fillStyle = "#070d1a";
    text(ctx, DIGITS[e.work[i]], x, STRIP_Y + 5);
    ctx.globalAlpha = 1;
    if (s >= 2) {
      ctx.strokeStyle = s === 2 ? "#ffd166" : "#7fb2ff";
      ctx.lineWidth = 3;
      ring(ctx, x, STRIP_Y, 17);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ghostSplit(ctx, 0, n, step, 30);
  ctx.strokeStyle = "#7fb2ff";
  ghostSplit(ctx, 0, h, step, 22);
  ghostSplit(ctx, n - h, h, step, 22);
}

/** A dashed split through the middle of `count` beads starting at `start`. */
function ghostSplit(ctx, start, count, step, reach) {
  const x = (STRIP_X0 + ((2 * start + count - 1) * step) / 2) | 0;
  ctx.beginPath();
  for (let y = STRIP_Y - reach; y < STRIP_Y + reach; y += 8) line(ctx, x, y, x, y + 4);
  ctx.stroke();
}
