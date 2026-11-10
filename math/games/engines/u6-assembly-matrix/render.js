// Assembly Matrix renderer. Zero allocation per frame: every coordinate is
// snapped to an integer before it reaches a helper or the canvas, every string
// was built in refreshLabels(), static artwork is painted once into layers.

import { H, W } from "../core/engine.js";
import { alphaLevel, line, rect, roundRect, staticLayer, text } from "../core/draw.js";
import { PODS_MAX } from "./math.js";

export const S_P1 = 0;
export const S_P2 = 1;
export const S_L1 = 2;
export const S_L2 = 3;
export const S_PRESS = 4;
export const S_GLOW = 5;
export const S_SHAKE = 6;
export const S_POD = 7; // pod i: x = S_POD + 2i, y = S_POD + 2i + 1
export const S_GHOST = S_POD + 2 * PODS_MAX;
export const TIME = 0;
export const GX0 = 1;
export const GY0 = 2;
export const GX1 = 3;
export const GY1 = 4;

const KIND_FILL = ["#46c2b8", "#f2b45a", "#9aa6b8"];
const TRACK1 = "#f2b45a";
const TRACK2 = "#46c2b8";
const T1_Y = 110;
const T2_Y = 290;
let unpackLayer = null;
let packLayer = null;
let pressLayer = null;

/** @param {any} g the engine @param {CanvasRenderingContext2D} ctx */
export function renderMachine(g, ctx) {
  const sx = g.springs.pos[S_SHAKE] | 0;
  const m = g.mode;
  if (m === "unpack") drawUnpack(g, ctx, sx);
  else if (m === "pack") drawPack(g, ctx, sx);
  else if (m === "fuse") drawFuse(g, ctx, sx);
  else drawPower(g, ctx, sx);
  ctx.fillStyle = "#111a2e";
  roundRect(ctx, 30, 18, 900, 44, 10);
  ctx.fill();
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 20px system-ui";
  ctx.textAlign = "left";
  text(ctx, g.labels.plate, 48, 47);
}

function crate(ctx, x, y, label, fill) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y - 28, 120, 56, 8);
  ctx.fill();
  ctx.fillStyle = "#04201d";
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  text(ctx, label, x + 60, y + 8);
}

// ---------- UNPACK ----------
function drawUnpack(g, ctx, sx) {
  if (!unpackLayer) unpackLayer = paintUnpack();
  ctx.drawImage(unpackLayer, 0, 0, W, H);
  const L = g.labels;
  const glow = g.springs.pos[S_GLOW];
  // Composite crate: amber outer factor, teal brackets around the inner terms.
  const cx = 40 + sx;
  ctx.fillStyle = "#24365c";
  roundRect(ctx, cx, 150, 232, 72, 10);
  ctx.fill();
  ctx.fillStyle = TRACK1;
  roundRect(ctx, cx + 8, 158, 48, 56, 8);
  ctx.fill();
  ctx.fillStyle = "#04201d";
  ctx.font = "700 24px system-ui";
  ctx.textAlign = "center";
  text(ctx, L.outer, cx + 32, 195);
  ctx.strokeStyle = TRACK2;
  ctx.lineWidth = 4;
  ctx.beginPath();
  line(ctx, cx + 74, 160, cx + 66, 160);
  line(ctx, cx + 66, 160, cx + 66, 212);
  line(ctx, cx + 66, 212, cx + 74, 212);
  line(ctx, cx + 216, 160, cx + 224, 160);
  line(ctx, cx + 224, 160, cx + 224, 212);
  line(ctx, cx + 224, 212, cx + 216, 212);
  ctx.stroke();
  ctx.fillStyle = "#e8eefc";
  text(ctx, L.inner, cx + 145, 195);
  // Output crates ride their tracks to the colour-coded locks.
  lockGlow(ctx, (g.springs.pos[S_L1] * 12 + 0.5) | 0, T1_Y);
  lockGlow(ctx, (g.springs.pos[S_L2] * 12 + 0.5) | 0, T2_Y);
  const x1 = (340 + g.springs.pos[S_P1] * 400) | 0;
  const x2 = (340 + g.springs.pos[S_P2] * 400) | 0;
  crate(ctx, x1, T1_Y, L.k1, glow > 0.5 ? "#7bdc8f" : TRACK1);
  crate(ctx, x2, T2_Y, L.k2, glow > 0.5 ? "#7bdc8f" : TRACK2);
  if (g.tier >= 1) unpackArea(g, ctx);
  if (g.tier >= 2) unpackTiles(g, ctx);
}

function lockGlow(ctx, level, y) {
  if (level < 1) return;
  alphaLevel(ctx, level);
  ctx.fillStyle = "#7bdc8f";
  rect(ctx, 732, y - 36, 136, 72);
  ctx.globalAlpha = 1;
}

/** Tier 1: area model a by (b + c) projected under the separator. */
function unpackArea(g, ctx) {
  const r = g.round;
  const L = g.labels;
  const x0 = 560;
  const y0 = 392;
  const wB = 150;
  const wC = Math.min(200, Math.max(50, 14 * r.c));
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.strokeRect(x0, y0, wB, 110);
  ctx.strokeRect(x0 + wB, y0, wC, 110);
  ctx.font = "700 20px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = TRACK1;
  text(ctx, L.outer, x0 - 20, y0 + 62);
  ctx.fillStyle = TRACK2;
  text(ctx, L.areaB, x0 + 75, y0 - 10);
  text(ctx, L.areaC, x0 + wB + (wC >> 1), y0 - 10);
}

/** Tier 2: a rows of (b x-bars + c units); grouped tiles take their track's colour. */
function unpackTiles(g, ctx) {
  const r = g.round;
  const row = g.tileRow;
  const rowH = Math.min(18, (150 / r.a) | 0);
  for (let i = 0; i < r.a; i++) {
    for (let k = 0; k < row; k++) {
      const idx = i * row + k;
      const first = k < r.p;
      ctx.fillStyle = idx < g.grouped ? (first ? TRACK1 : TRACK2) : "#3b5785";
      const x = 40 + k * 13 + (first ? 0 : 10);
      const y = 372 + i * rowH;
      if (first && !r.numeric) rect(ctx, x, y, 9, rowH - 3);
      else rect(ctx, x, y + rowH - 12, 9, 9);
    }
  }
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 16px system-ui";
  ctx.textAlign = "left";
  text(ctx, g.labels.tiles, 40, 360);
}

function paintUnpack() {
  return staticLayer(W, H, (c) => {
    c.strokeStyle = "#2c3e63";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(272, 186);
    c.lineTo(330, T1_Y + 32);
    c.lineTo(920, T1_Y + 32);
    c.moveTo(272, 186);
    c.lineTo(330, T2_Y + 32);
    c.lineTo(920, T2_Y + 32);
    c.stroke();
    c.fillStyle = "#3b5785";
    c.beginPath();
    c.moveTo(300, 160);
    c.lineTo(326, 186);
    c.lineTo(300, 212);
    c.lineTo(274, 186);
    c.closePath();
    c.fill();
    // Colour-coded bracket locks at the end of each track.
    c.lineWidth = 5;
    for (const [y, col] of [
      [T1_Y, TRACK1],
      [T2_Y, TRACK2],
    ]) {
      c.strokeStyle = col;
      c.beginPath();
      c.moveTo(744, y - 34);
      c.lineTo(732, y - 34);
      c.lineTo(732, y + 34);
      c.lineTo(744, y + 34);
      c.moveTo(856, y - 34);
      c.lineTo(868, y - 34);
      c.lineTo(868, y + 34);
      c.lineTo(856, y + 34);
      c.stroke();
    }
  });
}

// ---------- PACK ----------
function drawPack(g, ctx, sx) {
  if (!packLayer) packLayer = paintPack();
  ctx.drawImage(packLayer, 0, 0, W, H);
  const L = g.labels;
  const glow = g.springs.pos[S_GLOW];
  lockGlowPack(ctx, (g.springs.pos[S_L1] * 10 + 0.5) | 0, T1_Y);
  lockGlowPack(ctx, (g.springs.pos[S_L2] * 10 + 0.5) | 0, T2_Y);
  crate(ctx, (40 + g.springs.pos[S_P1] * 400) | 0, T1_Y, L.t1, TRACK1);
  crate(ctx, (40 + g.springs.pos[S_P2] * 400) | 0, T2_Y, L.t2, TRACK2);
  // Packer front panel shows the crate the student is building.
  ctx.fillStyle = glow > 0.5 ? "#7bdc8f" : "#24365c";
  roundRect(ctx, 560 + sx, 150, 340, 90, 12);
  ctx.fill();
  ctx.fillStyle = glow > 0.5 ? "#04201d" : "#e8eefc";
  ctx.font = "700 26px system-ui";
  ctx.textAlign = "center";
  text(ctx, L.packed, 730 + sx, 205);
  if (g.tier >= 1) packArea(g, ctx);
  if (g.tier >= 2) packTiles(g, ctx);
}

function lockGlowPack(ctx, level, y) {
  if (level < 1) return;
  alphaLevel(ctx, level);
  ctx.fillStyle = "#7bdc8f";
  rect(ctx, 360, y - 34, 180, 68);
  ctx.globalAlpha = 1;
}

/** Tier 1: an area model whose two regions are the given terms. */
function packArea(g, ctx) {
  const L = g.labels;
  const x0 = 600;
  const y0 = 392;
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.strokeRect(x0, y0, 160, 100);
  ctx.strokeRect(x0 + 160, y0, 120, 100);
  ctx.font = "700 20px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  text(ctx, L.g, x0 - 22, y0 + 56);
  text(ctx, L.in1, x0 + 80, y0 - 10);
  text(ctx, L.in2, x0 + 220, y0 - 10);
  ctx.fillStyle = TRACK1;
  text(ctx, L.t1, x0 + 80, y0 + 58);
  ctx.fillStyle = TRACK2;
  text(ctx, L.t2, x0 + 220, y0 + 58);
}

/** Tier 2: tiles dealt one at a time into the student's number of groups. */
function packTiles(g, ctx) {
  const groups = g.gVal;
  const colW = (440 / groups) | 0;
  const A = g.round.A;
  ctx.strokeStyle = "#2c3e63";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k < groups; k++) line(ctx, 40 + k * colW, 372, 40 + k * colW, 530);
  ctx.stroke();
  for (let t = 0; t < g.grouped; t++) {
    const grp = t % groups;
    const pos = (t / groups) | 0;
    const isX = t < A;
    ctx.fillStyle = isX ? TRACK1 : TRACK2;
    rect(ctx, 44 + grp * colW + (pos % 4) * 10, 518 - ((pos / 4) | 0) * 12, 8, isX ? 10 : 8);
  }
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 16px system-ui";
  ctx.textAlign = "left";
  text(ctx, g.labels.tiles, 40, 360);
}

function paintPack() {
  return staticLayer(W, H, (c) => {
    c.strokeStyle = "#2c3e63";
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(30, T1_Y + 32);
    c.lineTo(560, T1_Y + 32);
    c.moveTo(30, T2_Y + 32);
    c.lineTo(560, T2_Y + 32);
    c.stroke();
    c.fillStyle = "#1c2a45";
    c.fillRect(548, 96, 364, 250);
    c.lineWidth = 5;
    c.strokeStyle = TRACK1;
    c.strokeRect(548, 96, 364, 250);
  });
}

// ---------- FUSE ----------
function drawFuse(g, ctx, sx) {
  const t = g.tick;
  const tier = g.tier;
  for (let i = 0; i < g.podCount; i++) {
    if (!g.alive[i]) continue;
    const x = (g.springs.pos[S_POD + 2 * i] + sx) | 0;
    const y = (g.springs.pos[S_POD + 2 * i + 1] + Math.sin(t * 0.033 + i) * 4) | 0;
    pod(ctx, x, y, g.podLabels[i], g.podKind[i], g.podCoef[i], tier, g.sel[i] === 1);
  }
  if (g.ghostOn && g.springs.pos[S_GHOST] < 0.96) {
    const p = g.springs.pos[S_GHOST];
    const st = g.st;
    alphaLevel(ctx, ((1 - p) * 20 + 0.5) | 0);
    pod(
      ctx,
      (st[GX0] + (st[GX1] - st[GX0]) * p) | 0,
      (st[GY0] + (st[GY1] - st[GY0]) * p) | 0,
      g.labels.ghost,
      0,
      0,
      0,
      false,
    );
    ctx.globalAlpha = 1;
  }
}

function pod(ctx, x, y, label, kind, coef, tier, selected) {
  ctx.fillStyle = tier >= 1 ? KIND_FILL[kind] : "#3b5785";
  roundRect(ctx, x - 50, y - 24, 100, 48, 22);
  ctx.fill();
  if (selected) {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = tier >= 1 ? "#04201d" : "#e8eefc";
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  text(ctx, label, x, tier >= 2 && coef <= 12 ? y + 2 : y + 8);
  if (tier >= 2 && coef <= 12) {
    // Algebra tiles inside the pod: x-bars, y-bars, unit squares.
    ctx.fillStyle = "#04201d";
    for (let k = 0; k < coef; k++)
      rect(ctx, x - 42 + k * 7, kind === 2 ? y + 12 : y + 8, 5, kind === 2 ? 5 : 10);
  }
}

// ---------- POWER ----------
function drawPower(g, ctx, sx) {
  if (!pressLayer) pressLayer = paintPress();
  ctx.drawImage(pressLayer, 0, 0, W, H);
  const r = g.round;
  const L = g.labels;
  const glow = g.springs.pos[S_GLOW];
  // Repeated-multiplication stack: one plate per factor.
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "center";
  for (let k = 0; k < r.e; k++) {
    const y = 84 + k * 56;
    ctx.fillStyle = "#3b5785";
    rect(ctx, 60, y, 100, 38);
    ctx.fillStyle = "#e8eefc";
    text(ctx, L.base, 110, y + 27);
    if (k < r.e - 1) {
      ctx.fillStyle = "#ffd166";
      text(ctx, "×", 110, y + 51);
    }
  }
  // Ram.
  const ramY = (120 + g.springs.pos[S_PRESS] * 170) | 0;
  ctx.fillStyle = "#5b6f96";
  rect(ctx, 472 + sx, 110, 16, ramY - 110);
  ctx.fillStyle = glow > 0.5 ? "#7bdc8f" : "#8d99ad";
  rect(ctx, 400 + sx, ramY, 160, 44);
  // Output crate on the anvil.
  ctx.fillStyle = glow > 0.5 ? "#7bdc8f" : "#f2b45a";
  rect(ctx, 400, 340, 160, 76);
  ctx.fillStyle = "#04201d";
  ctx.font = "700 22px system-ui";
  text(ctx, L.out, 480, 386);
  if (g.tier >= 1) powerScaffold(g, ctx);
  if (g.tier >= 2) powerDots(g, ctx);
}

/** Tier 1: partial products, stopping one factor short of the answer. */
function powerScaffold(g, ctx) {
  const r = g.round;
  ctx.fillStyle = "#ffd166";
  ctx.font = "700 20px system-ui";
  ctx.textAlign = "left";
  for (let k = 0; k < g.partialN; k++) text(ctx, g.partials[k], 640, 110 + k * 32);
  if (r.e === 2) {
    // A square array outline, b by b, to be counted or multiplied.
    const cell = Math.min(20, (200 / r.b) | 0);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= r.b; k++) {
      line(ctx, 640 + k * cell, 90, 640 + k * cell, 90 + r.b * cell);
      line(ctx, 640, 90 + k * cell, 640 + r.b * cell, 90 + k * cell);
    }
    ctx.stroke();
  }
}

/** Tier 2: each stacked factor multiplies the dot array by the base. */
function powerDots(g, ctx) {
  const b = g.round.b;
  const cell = g.dotCell;
  if (!cell) return;
  ctx.fillStyle = "#46c2b8";
  for (let rr = 0; rr < g.dotRows; rr++) {
    for (let c = 0; c < g.dotCols; c++) {
      rect(
        ctx,
        630 + c * cell + ((c / b) | 0) * 3,
        300 + rr * cell + ((rr / b) | 0) * 3,
        cell - 3,
        cell - 3,
      );
    }
  }
}

function paintPress() {
  return staticLayer(W, H, (c) => {
    c.fillStyle = "#24365c";
    c.fillRect(370, 80, 18, 360);
    c.fillRect(572, 80, 18, 360);
    c.fillRect(360, 72, 240, 30);
    c.fillStyle = "#1c2a45";
    c.fillRect(360, 416, 240, 24);
  });
}
