// Calibration Cylinder apparatus drawing. Zero allocation, measured: every
// argument passed between functions is an integer, object or constant; computed
// doubles stay in the locals that made them; coordinates reach the canvas `| 0`'d;
// the 100-mark scale and the 10x10 glass grid are pre-rendered layers; every
// string is read from g.labels or a numeral table built once.

import { W, H } from "../core/engine.js";
import { alphaLevel, dot, line, rect, roundRect, staticLayer, TAU, text } from "../core/draw.js";

export const S_LEVEL = 0;
export const S_CAP = 1;
export const S_VALVE = 2;
export const SPRINGS = 3;

export const CX = 340;
export const CY = 50;
export const CW = 200;
export const CH = 420;
export const BOTTOM = CY + CH;

const FLUID = "#46c2b8";
const FLUID_TOP = "#8be8de";
const GOLD = "#ffd166";
const INK = "#e8eefc";
const MUTED = "#a9b6d3";
const EDGE = "#5b6f96";
const LAMP = ["#3b5785", "#7bdc8f", "#f2b45a"];

/** Numerals 0..200 built once, so ruler labels never build a string. */
const NUM = [];
for (let i = 0; i <= 200; i++) NUM.push(String(i));

let scaleLayer = null;
let gridLayer = null;

function paintScale(g) {
  g.strokeStyle = "#a9b6d3";
  g.fillStyle = "#e8eefc";
  g.font = "600 13px system-ui";
  g.textAlign = "right";
  for (let i = 0; i <= 100; i++) {
    const y = BOTTOM - (CH * i) / 100;
    const len = i % 10 === 0 ? 18 : i % 5 === 0 ? 11 : 6;
    g.lineWidth = i % 10 === 0 ? 2 : 1;
    g.beginPath();
    g.moveTo(CX - 4 - len, y);
    g.lineTo(CX - 4, y);
    g.stroke();
    if (i % 10 === 0) g.fillText(`${i}%`, CX - 26, y + 5);
  }
}

function paintGrid(g) {
  g.strokeStyle = "rgba(232,238,252,0.35)";
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 1; i < 10; i++) {
    g.moveTo(CX + (CW * i) / 10 + 0.5, CY);
    g.lineTo(CX + (CW * i) / 10 + 0.5, BOTTOM);
    g.moveTo(CX, CY + (CH * i) / 10 + 0.5);
    g.lineTo(CX + CW, CY + (CH * i) / 10 + 0.5);
  }
  g.stroke();
  // Benchmark ticks: 10%, 25%, 50%.
  g.strokeStyle = "#ffd166";
  g.lineWidth = 3;
  for (const p of [10, 25, 50]) {
    const y = BOTTOM - (CH * p) / 100;
    g.beginPath();
    g.moveTo(CX - 8, y);
    g.lineTo(CX + 14, y);
    g.stroke();
  }
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

/** Tier 1 calibrate: the fill shown as whole hundred-grid cells (rows of 10%, cells of 1%). */
function drawCells(ctx, g) {
  let lv = g.springs.pos[S_LEVEL];
  if (lv < 0) lv = 0;
  if (lv > 1) lv = 1;
  const t = (lv * 1000 + 0.5) | 0;
  const rows = (t / 100) | 0;
  const cells = ((t % 100) / 10) | 0;
  const sliver = t % 10;
  ctx.fillStyle = FLUID;
  if (rows > 0) rect(ctx, CX, BOTTOM - rows * 42, CW, rows * 42);
  if (cells > 0) rect(ctx, CX, BOTTOM - rows * 42 - 42, cells * 20, 42);
  if (sliver > 0) rect(ctx, CX + cells * 20, BOTTOM - rows * 42 - 42, sliver * 2, 42);
}

/** Smooth fluid column at the level spring. */
function drawFluid(ctx, g) {
  let lv = g.springs.pos[S_LEVEL];
  if (lv < 0) lv = 0;
  if (lv > 1) lv = 1;
  const fh = (CH * lv) | 0;
  if (fh <= 0) return;
  ctx.fillStyle = FLUID;
  rect(ctx, CX, BOTTOM - fh, CW, fh);
  ctx.fillStyle = FLUID_TOP;
  rect(ctx, CX, BOTTOM - fh, CW, 4);
}

function drawMark(ctx, g) {
  const L = g.labels;
  const y = (BOTTOM - (CH * g.q.p) / 100) | 0;
  if (g.q.variant === "estimate") {
    const band = ((CH * 100) / (g.q.N * 100)) | 0;
    alphaLevel(ctx, 5);
    ctx.fillStyle = GOLD;
    rect(ctx, CX, y - band, CW, band * 2);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, CX - 10, y, CX + CW + 10, y);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = "700 16px system-ui";
  ctx.textAlign = "right";
  text(ctx, L.pMark, CX - 64, y + 6);
}

function drawRuler(ctx, g) {
  let c = g.springs.pos[S_CAP];
  if (c < 1) c = 1;
  const x = CX + CW + 4;
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let u = 0; u <= c && u <= 200; u += 10) {
    const y = (BOTTOM - (CH * u) / c) | 0;
    line(ctx, x, y, x + 14, y);
  }
  ctx.stroke();
  if (g.tier >= 1) {
    ctx.font = "600 12px system-ui";
    ctx.textAlign = "left";
    ctx.fillStyle = MUTED;
    for (let u = 0; u <= c && u <= 200; u += 10) {
      const y = (BOTTOM - (CH * u) / c) | 0;
      if (u % 20 === 0 || c < 60) text(ctx, NUM[u], x + 18, y + 4);
    }
  }
}

function drawBlocks(ctx, g) {
  const L = g.labels;
  const x = 600;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, CY, 46, CH);
  let y = BOTTOM;
  ctx.fillStyle = GOLD;
  for (let i = 0; i < g.b10; i++) {
    rect(ctx, x + 3, y - 41, 40, 39);
    y -= 42;
  }
  ctx.fillStyle = "#f2b45a";
  for (let i = 0; i < g.b1; i++) {
    rect(ctx, x + 3, y - 4, 40, 3);
    y -= 4;
  }
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  text(ctx, L.blocks, x + 23, CY - 12);
  ctx.textAlign = "left";
  text(ctx, L.block10, 666, 500);
  text(ctx, L.block1, 666, 526);
}

function drawLens(ctx, g) {
  const L = g.labels;
  ctx.fillStyle = "#0e1a30";
  dot(ctx, 790, 150, 108);
  ctx.strokeStyle = LAMP[g.lamp];
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(790, 150, 108, 0, TAU);
  ctx.stroke();
  ctx.font = "700 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  text(ctx, L.lensTitle, 790, 84);
  ctx.font = "700 20px system-ui";
  ctx.fillStyle = INK;
  text(ctx, L.lens0, 790, 124);
  text(ctx, L.lens1, 790, 160);
  text(ctx, L.lens2, 790, 196);
}

function drawFlask(ctx, g) {
  const L = g.labels;
  const full = g.poured ? 0 : 1;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 3;
  roundRect(ctx, 90, 300, 130, 170, 16);
  ctx.stroke();
  if (full) {
    ctx.fillStyle = FLUID;
    rect(ctx, 96, 330, 118, 134);
  }
  ctx.font = "700 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  text(ctx, L.flask, 155, 500);
}

/** Build the pre-rendered scale and glass grid once (called from initWorld). */
export function initLayers() {
  if (!scaleLayer) {
    scaleLayer = staticLayer(W, H, paintScale);
    gridLayer = staticLayer(W, H, paintGrid);
  }
}

function drawGlass(ctx, g) {
  ctx.fillStyle = "#0e1a30";
  rect(ctx, CX, CY, CW, CH);
}

function drawFrame(ctx, g) {
  if (g.tier >= 1) ctx.drawImage(gridLayer, 0, 0, W, H);
  ctx.drawImage(scaleLayer, 0, 0, W, H);
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 4;
  roundRect(ctx, CX - 2, CY - 10, CW + 4, CH + 12, 12);
  ctx.stroke();
  // Valve wheel at the cylinder foot spins with its spring.
  const va = g.springs.pos[S_VALVE];
  const vx = Math.cos(va) * 22;
  const vy = Math.sin(va) * 22;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo((440 - vx) | 0, (500 - vy) | 0);
  ctx.lineTo((440 + vx) | 0, (500 + vy) | 0);
  ctx.moveTo((440 + vy) | 0, (500 - vx) | 0);
  ctx.lineTo((440 - vy) | 0, (500 + vx) | 0);
  ctx.stroke();
}

function drawPlates(ctx, g) {
  const L = g.labels;
  plate(ctx, 660, 300, 280, 170);
  ctx.font = "700 18px system-ui";
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  text(ctx, L.plate0, 680, 340);
  text(ctx, L.plate1, 680, 380);
  ctx.fillStyle = MUTED;
  text(ctx, L.plate2, 680, 420);
  ctx.fillStyle = LAMP[g.lamp];
  dot(ctx, 915, 445, 10);
}

function drawCalibrate(ctx, g) {
  drawGlass(ctx, g);
  if (g.tier >= 1) drawCells(ctx, g);
  else drawFluid(ctx, g);
  drawFrame(ctx, g);
}

function drawPart(ctx, g) {
  drawGlass(ctx, g);
  drawFluid(ctx, g);
  drawFrame(ctx, g);
  drawMark(ctx, g);
}

function drawWhole(ctx, g) {
  drawGlass(ctx, g);
  drawFluid(ctx, g);
  drawFrame(ctx, g);
  drawMark(ctx, g);
  drawRuler(ctx, g);
  drawFlask(ctx, g);
}

/** Draw the apparatus for the current round mode, then the particles. */
export function drawScene(ctx, g) {
  if (g.mode === "calibrate") drawCalibrate(ctx, g);
  else if (g.mode === "part") drawPart(ctx, g);
  else drawWhole(ctx, g);
  drawLens(ctx, g);
  drawPlates(ctx, g);
  if (g.tier >= 2) drawBlocks(ctx, g);
  g.particles.render(ctx);
}
