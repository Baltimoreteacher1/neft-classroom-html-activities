// Circuit Breaker apparatus drawing. Zero allocation per frame: every computed
// coordinate is snapped to an integer before it reaches a helper, colours and
// glyphs are constant strings, labels are built in refreshLabels().

import { H, W } from "../core/engine.js";
import { alphaLevel, dot, line, rect, roundRect, text } from "../core/draw.js";
import { drawMultiply } from "./render-multiply.js";

export { H, W };

const COL0 = 210;
const COLW = 108;
export const DEC = 3.5;
export const BAR_X = COL0 + DEC * COLW; // 588, an integer
export const ROW_A = 118;
export const ROW_B = 192;
const LINE_Y = 232;
export const ROW_W = 278;
const READ_Y = 334;
const TRAY_Y = 360;
export const CAP_X = 60;
const CAP_TOP = 90;
const CAP_H = 370;
export const BANK_X = 870;
const CHIP_BASE = 470;
const TILE_W = 56;
const TILE_H = 48;

export const S_SHIFT = 0;
export const S_CHARGE = 1;
export const S_LOCK = 2;
export const S_BANK = 3;
export const S_WHEEL = 4;
export const SPRINGS = 20; // 10..19: multiply (render-multiply.js)

export const PALETTE = ["#ffd166", "#46c2b8", "#7bdc8f", "#ff6b6b", "#b8c7ff"];
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const HEADS = ["1000", "100", "10", "1", "0.1", "0.01"];
const PLACE_COLORS = ["#9fd8ff", "#7fb2ff", "#7bdc8f", "#ffd166", "#f2a65a", "#ff8fa3"];

/** Column centre for a (possibly fractional) column index. */
export function colX(c) {
  return (COL0 + c * COLW) | 0;
}

/** Static: buses, place headers and the grounding bar. */
export function paintGrid(g) {
  g.strokeStyle = "rgba(127,178,255,0.25)";
  g.lineWidth = 2;
  g.beginPath();
  for (let p = 0; p < 6; p++) {
    const x = COL0 + p * COLW;
    g.moveTo(x, 84);
    g.lineTo(x, 312);
  }
  g.stroke();
  g.fillStyle = "#a9b6d3";
  g.font = "700 16px system-ui";
  g.textAlign = "center";
  for (let p = 0; p < 6; p++) g.fillText(HEADS[p], COL0 + p * COLW, 66);
  // Grounding bar = the decimal point.
  g.fillStyle = "#3b5785";
  g.fillRect(BAR_X - 5, 40, 10, 300);
  g.fillStyle = "#ffd166";
  g.fillRect(BAR_X - 18, 340, 36, 4);
  g.fillRect(BAR_X - 12, 348, 24, 4);
  g.fillRect(BAR_X - 6, 356, 12, 4);
}

/** @param {any} e the engine @param {CanvasRenderingContext2D} ctx */
export function renderScene(e, ctx) {
  e.backdrop(ctx);
  if (!e.round) return;
  if (e.mode === "multiply") {
    drawMultiply(e, ctx);
    e.particles.render(ctx);
    return;
  }
  ctx.drawImage(e.layers.grid, 0, 0, W, H);
  if (e.mode === "align") drawAlign(e, ctx);
  else drawDivide(e, ctx);
  if (e.tier >= 2) drawTrays(e, ctx);
  e.particles.render(ctx);
}

function tile(ctx, x, y, glyph, fill, ink) {
  ctx.fillStyle = fill;
  roundRect(ctx, (x - TILE_W / 2) | 0, (y - TILE_H / 2) | 0, TILE_W, TILE_H, 8);
  ctx.fill();
  ctx.fillStyle = ink;
  text(ctx, glyph, x, y + 10);
}

function drawAlign(e, ctx) {
  const sp = e.springs;
  const L = e.labels;
  if (e.tier >= 1) {
    // Colour-coded buses with what currently lands on each.
    for (let p = 0; p < 6; p++) {
      alphaLevel(ctx, 3);
      ctx.fillStyle = PLACE_COLORS[p];
      rect(ctx, colX(p) - 46, 84, 92, 228);
      ctx.globalAlpha = 1;
      ctx.fillStyle = PLACE_COLORS[p];
      ctx.font = "700 15px system-ui";
      ctx.textAlign = "center";
      text(ctx, L.col[p], colX(p), READ_Y);
    }
  }
  ctx.font = "700 28px system-ui";
  ctx.textAlign = "center";
  // Upper conduit: fixed on its buses.
  for (let p = e.span[0]; p <= e.span[1]; p++)
    tile(ctx, colX(p), ROW_A, DIGITS[e.aDig[p]], "#24365c", "#e8eefc");
  ctx.fillStyle = "#ffd166";
  dot(ctx, BAR_X, ROW_A + 18, 6);
  // Lower conduit: slides as one piece.
  const sx = (sp.pos[S_SHIFT] * COLW) | 0;
  const aligned = e.shiftVal === 0;
  const bFill = aligned ? "#1f4d4a" : "#4a2433";
  for (let p = e.span[2]; p <= e.span[3]; p++)
    tile(ctx, colX(p) + sx, ROW_B, DIGITS[e.bDig[p]], bFill, "#e8eefc");
  const bx = BAR_X + sx;
  ctx.fillStyle = aligned ? "#ffd166" : "#ff6b6b";
  dot(ctx, bx, ROW_B + 18, 6);
  ctx.fillStyle = "#e8eefc";
  text(ctx, L.op, colX(e.span[2]) + sx - 52, ROW_B + 10);
  if (!aligned) {
    // Arc between the stray decimal point and the grounding bar.
    const jit = (e.frameCount & 4) === 0 ? 7 : -7;
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 8;
    let px = bx;
    let py = ROW_B + 18;
    for (let k = 1; k <= steps; k++) {
      const nx = (bx + ((BAR_X - bx) * k) / steps) | 0;
      const ny = ROW_B + 18 + (k === steps ? 0 : k % 2 ? jit : -jit);
      line(ctx, px, py, nx, ny);
      px = nx;
      py = ny;
    }
    ctx.stroke();
  } else {
    alphaLevel(ctx, 12);
    ctx.fillStyle = "#ffd166";
    rect(ctx, BAR_X - 7, 40, 14, 300);
    ctx.globalAlpha = 1;
  }
  // Sum line and the output wheels.
  ctx.fillStyle = "#a9b6d3";
  rect(ctx, (COL0 - COLW / 2) | 0, LINE_Y, COLW * 6, 3);
  for (let p = 0; p < 6; p++) {
    const y = (ROW_W + sp.pos[S_WHEEL + p] * 0.2) | 0;
    tile(ctx, colX(p), y, DIGITS[e.wheelVal[p]], e.solved ? "#1f4d4a" : "#111a2e", "#46c2b8");
  }
  ctx.fillStyle = "#ffd166";
  dot(ctx, BAR_X, ROW_W + 18, 6);
}

function drawDivide(e, ctx) {
  const sp = e.springs;
  const L = e.labels;
  ctx.font = "700 28px system-ui";
  ctx.textAlign = "center";
  // Remaining charge on the buses.
  for (let p = e.chargeSpan[0]; p <= e.chargeSpan[1]; p++)
    tile(ctx, colX(p), ROW_A, DIGITS[e.charge[p]], "#24365c", "#e8eefc");
  if (e.round.decimal) {
    ctx.fillStyle = "#ffd166";
    dot(ctx, BAR_X, ROW_A + 18, 6);
  }
  // Selected chunk: its digit on its bus, zeros out to the ones bus.
  const cp = e.cPlace;
  const from = cp < 3 ? cp : 3;
  const to = cp > 3 ? cp : 3;
  for (let p = from; p <= to; p++)
    tile(ctx, colX(p), ROW_B, p === cp ? DIGITS[e.cDigit] : DIGITS[0], "#3a3150", "#ffd166");
  if (cp > 3) {
    ctx.fillStyle = "#ffd166";
    dot(ctx, BAR_X, ROW_B + 18, 6);
  }
  // Capacitor: the charge left, as a column of light.
  ctx.strokeStyle = "#2c3e63";
  ctx.lineWidth = 3;
  ctx.strokeRect(CAP_X - 20, CAP_TOP, 40, CAP_H);
  let f = sp.pos[S_CHARGE];
  f = f < 0 ? 0 : f > 1 ? 1 : f;
  const fill = (CAP_H * f) | 0;
  ctx.fillStyle = "#46c2b8";
  rect(ctx, CAP_X - 17, CAP_TOP + CAP_H - fill, 34, fill);
  // Divisor plate and chunk readout.
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 24px system-ui";
  text(ctx, L.divisor, 128, ROW_A + 8);
  ctx.font = "700 18px system-ui";
  ctx.fillStyle = "#ffd166";
  text(ctx, L.chunk, BANK_X, 100);
  // Quotient bank chips.
  const bounce = sp.pos[S_BANK] | 0;
  ctx.font = "700 15px system-ui";
  for (let i = 0; i < e.chips; i++) {
    const y = CHIP_BASE - i * 24 + (i === e.chips - 1 ? bounce : 0);
    ctx.fillStyle = "#1f4d4a";
    roundRect(ctx, BANK_X - 60, y - 10, 120, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#7bdc8f";
    text(ctx, L.chips[i], BANK_X, y + 5);
  }
  ctx.strokeStyle = "#2c3e63";
  ctx.lineWidth = 2;
  ctx.strokeRect(BANK_X - 66, 196, 132, 290);
  if (e.tier >= 1) {
    // Multiples of the divisor (a fact strip, not the quotient).
    ctx.font = "700 15px system-ui";
    ctx.fillStyle = "#b8c7ff";
    for (let k = 0; k < 9; k++) text(ctx, L.mult[k], 280 + ((k / 3) | 0) * 200, 262 + (k % 3) * 24);
  }
}

function drawTrays(e, ctx) {
  for (let p = 0; p < 6; p++) {
    const x0 = colX(p) - 46;
    const count = e.tray[p];
    const need = e.need[p];
    ctx.strokeStyle = count < need ? "#ff6b6b" : "#2c3e63";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, TRAY_Y, 92, 140);
    const shown = count > 35 ? 35 : count;
    for (let k = 0; k < shown; k++) {
      const x = x0 + 7 + (k % 5) * 16;
      const y = TRAY_Y + 8 + ((k / 5) | 0) * 18;
      if (k < need) {
        ctx.strokeStyle = "#ff6b6b";
        ctx.strokeRect(x, y, 13, 13);
      } else {
        ctx.fillStyle = PLACE_COLORS[p];
        rect(ctx, x, y, 13, 13);
      }
    }
  }
}
