// Circuit Breaker MULTIPLY apparatus. Same zero-allocation rules as render.js:
// every computed coordinate is snapped with `| 0` at the call site, springs are
// read as springs.pos[i], and every string comes from engine.labels.

import { H, W } from "../core/engine.js";
import { alphaLevel, dot, line, rect, ring, roundRect, text } from "../core/draw.js";
import { REG } from "./math.js";

export const SLOT = 64;
export const REG_RIGHT = 800;
const REG_LEFT = REG_RIGHT - REG * SLOT; // 288
export const ROW_FA = 96;
export const ROW_FB = 168;
const LINE_Y = 208;
export const ROW_REG = 258;
const READ_Y = 316;
const TALLY_Y = 346;
export const GX0 = 180;
export const GSTEP = 66;
const GAUGE_Y = 392;
export const TRAY_A = 462;
export const TRAY_B = 506;
export const TRAY_X0 = 300;
export const TRAY_STEP = 36;
const PLATE_X = 150;
const TILE = 52;
const HALF_SLOT = 32; // SLOT / 2, written as an integer literal (a division would be a double)

export const S_REG = 10; // REG springs: digits dropping into the register
export const S_BAR = 18;
export const S_ARC = 19;

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const TICKS = ["0.001", "0.01", "0.1", "1", "10", "100", "1000", "10000", "100000", "1000000"];

/** Slot centre x for register slot k (0 = leftmost). */
export function slotX(k) {
  return (REG_LEFT + k * SLOT + HALF_SLOT) | 0;
}

/** Static: register housing, product line and the multiply sign. */
export function paintMultiply(g) {
  g.strokeStyle = "rgba(127,178,255,0.25)";
  g.lineWidth = 2;
  for (let k = 0; k < REG; k++) g.strokeRect(REG_LEFT + k * SLOT + 4, ROW_REG - 30, SLOT - 8, 60);
  g.fillStyle = "#a9b6d3";
  g.fillRect(REG_LEFT, LINE_Y, REG * SLOT, 3);
  g.fillStyle = "#3b5785";
  g.fillRect(REG_LEFT - 12, ROW_REG - 40, 4, 80);
  g.fillRect(REG_RIGHT + 8, ROW_REG - 40, 4, 80);
}

/** Static: the estimate gauge's decade axis (Tier 1 only). */
export function paintGauge(g) {
  g.fillStyle = "#2c3e63";
  g.fillRect(GX0, GAUGE_Y, GSTEP * 9, 3);
  g.fillStyle = "#a9b6d3";
  g.font = "600 12px system-ui";
  g.textAlign = "center";
  for (let i = 0; i < 10; i++) {
    g.fillRect(GX0 + i * GSTEP - 1, GAUGE_Y - 8, 2, 18);
    g.fillText(TICKS[i], GX0 + i * GSTEP, GAUGE_Y + 26);
  }
}

function tile(ctx, x, y, glyph, fill, ink) {
  ctx.fillStyle = fill;
  roundRect(ctx, (x - 26) | 0, (y - 22) | 0, TILE, 44, 8);
  ctx.fill();
  ctx.fillStyle = ink;
  text(ctx, glyph, x | 0, (y + 10) | 0);
}

/** @param {any} e the engine @param {CanvasRenderingContext2D} ctx */
export function drawMultiply(e, ctx) {
  const sp = e.springs;
  const L = e.labels;
  ctx.drawImage(e.layers.mult, 0, 0, W, H);
  ctx.textAlign = "center";
  // Factor plates (as written) with their place counters.
  ctx.font = "700 28px system-ui";
  ctx.fillStyle = "#e8eefc";
  text(ctx, L.fa, PLATE_X, ROW_FA + 10);
  text(ctx, L.fb, PLATE_X, ROW_FB + 10);
  ctx.font = "700 14px system-ui";
  ctx.fillStyle = "#ffd166";
  text(ctx, L.ca, PLATE_X, ROW_FA + 34);
  text(ctx, L.cb, PLATE_X, ROW_FB + 34);
  // Whole currents: the factors' digits with the grounding bars removed.
  ctx.font = "700 26px system-ui";
  for (let k = 0; k < REG; k++) {
    if (e.fa[k] >= 0) tile(ctx, slotX(k), ROW_FA, DIGITS[e.fa[k]], "#24365c", "#e8eefc");
    if (e.fb[k] >= 0) tile(ctx, slotX(k), ROW_FB, DIGITS[e.fb[k]], "#24365c", "#e8eefc");
  }
  ctx.fillStyle = "#a9b6d3";
  text(ctx, "×", e.ghost[2], ROW_FB + 10);
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 2;
  if (e.ghost[0] > 0) {
    ring(ctx, e.ghost[0], ROW_FA + 26, 5);
    ctx.stroke();
  }
  if (e.ghost[1] > 0) {
    ring(ctx, e.ghost[1], ROW_FB + 26, 5);
    ctx.stroke();
  }
  // Output register: the whole-number product, digit by digit.
  ctx.font = "700 14px system-ui";
  ctx.fillStyle = "#a9b6d3";
  text(ctx, L.regCaption, PLATE_X, ROW_REG + 6);
  ctx.font = "700 26px system-ui";
  const pos = e.pointVal;
  const fill = e.solved ? "#1f4d4a" : e.arc > 0 ? "#4a2433" : "#111a2e";
  const shake = (sp.pos[S_ARC] * 6) | 0;
  if (e.arc < 0 && !e.solved) alphaLevel(ctx, 9);
  for (let k = 0; k < REG; k++) {
    const y = (ROW_REG + sp.pos[S_REG + k]) | 0;
    const ink = k >= e.regLead ? "#46c2b8" : k >= REG - pos - 1 ? "#ffd166" : "#34425f";
    tile(ctx, (slotX(k) + shake) | 0, y, DIGITS[e.reg[k]], fill, ink);
  }
  ctx.globalAlpha = 1;
  // The product's grounding bar (decimal point), slid by the student.
  const bx = (REG_RIGHT - sp.pos[S_BAR] * SLOT) | 0;
  ctx.fillStyle = e.solved ? "#7bdc8f" : "#ffd166";
  rect(ctx, bx - 4, ROW_REG - 34, 8, 68);
  dot(ctx, bx, ROW_REG + 40, 6);
  if (e.arc > 0 && !e.solved) {
    // Overload arc along the register's top edge.
    const jit = (e.frameCount & 4) === 0 ? 8 : -8;
    ctx.strokeStyle = "#ff6b6b";
    ctx.beginPath();
    for (let k = 0; k < REG; k++)
      line(
        ctx,
        REG_LEFT + k * SLOT,
        ROW_REG - 36 + jit,
        REG_LEFT + k * SLOT + 32,
        ROW_REG - 36 - jit,
      );
    ctx.stroke();
  }
  ctx.font = "700 20px system-ui";
  ctx.fillStyle = "#e8eefc";
  text(ctx, L.reading, 544, READ_Y);
  ctx.font = "700 16px system-ui";
  ctx.fillStyle = "#ffd166";
  text(ctx, L.tally, 544, TALLY_Y);
  if (e.tier >= 1) drawGauge(e, ctx);
  if (e.tier >= 2) drawTray(e, ctx);
}

function drawGauge(e, ctx) {
  ctx.drawImage(e.layers.gauge, 0, 0, W, H);
  const g = e.gaugeX;
  alphaLevel(ctx, 8);
  ctx.fillStyle = "#46c2b8";
  rect(ctx, g[0], GAUGE_Y - 10, g[1] - g[0] + 2, 22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = e.arc > 0 ? "#ff6b6b" : "#ffd166";
  rect(ctx, g[2] - 3, GAUGE_Y - 16, 6, 34);
  ctx.font = "700 15px system-ui";
  ctx.fillStyle = "#b8c7ff";
  text(ctx, e.labels.gauge, 544, GAUGE_Y - 22);
}

function drawTray(e, ctx) {
  const L = e.labels;
  ctx.font = "700 20px system-ui";
  drawTrayRow(ctx, e.trayA, e.trayPoint[0] | 0, e.lit | 0, TRAY_A);
  drawTrayRow(ctx, e.trayB, e.trayPoint[1] | 0, (e.lit - e.dpA) | 0, TRAY_B);
  ctx.font = "700 18px system-ui";
  ctx.fillStyle = "#7bdc8f";
  text(ctx, L.trayCount, 800, TRAY_A + 26);
}

function drawTrayRow(ctx, glyphs, point, lit, y) {
  for (let i = 0; i < glyphs.length; i++) {
    const x = TRAY_X0 + i * TRAY_STEP;
    const ord = point >= 0 && i > point ? i - point - 1 : -1;
    const on = ord >= 0 && ord < lit;
    ctx.fillStyle = on ? "#ffd166" : ord >= 0 ? "#3a3150" : "#1b2742";
    roundRect(ctx, x - 15, y - 18, 30, 34, 6);
    ctx.fill();
    ctx.fillStyle = on ? "#111a2e" : "#e8eefc";
    text(ctx, glyphs[i], x, y + 7);
  }
}
