// Flux Foundry renderer. Zero allocation per frame: integer coordinates via
// draw.js helpers, rotation done in layout() instead of ctx.rotate, constant colour strings, and
// every label prebuilt on game.labels by refreshLabels() / loadRule().

import { H, W } from "../core/engine.js";
import { alphaLevel, dot, line, rect, ring, roundRect, staticLayer, text } from "../core/draw.js";
import { X_MAX } from "./math.js";

export const M_DECODE = 0;
export const M_PREDICT = 1;
export const M_WIRE = 2;
export const OP_MUL = 1;
export const OP_ADD = 2;
// Springs.
export const S_PISTON = 0;
export const S_COLLAR = 1;
export const S_GEAR = 2;
// Float slots.
export const F_T = 0;
export const F_RUNX = 1;
export const F_END = 2;
export const F_K = 3;
export const F_YSCALE = 4;
export const F_GA = 5; // gear angle the teeth were last laid out for
// Int slots.
export const I_RUN = 0;
export const I_DONE = 1;
export const I_NPLOT = 2;
export const I_NEXTPLOT = 3;
export const I_STEPX = 4;
export const I_OP = 5;
export const I_TBL = 6;

const GX0 = 390; // graph x = 0
const GXU = 30; // px per x unit
const GX1 = GX0 + GXU * X_MAX; // 690
const GY0 = 470; // graph y = 0
const GY1 = 80; // graph y = top
const PIST_X = 345;
const CRANK_X = 130;
const CRANK_Y = 420;
const GEAR_X = 200;
const GEAR_Y = 250;
const TAU = Math.PI * 2;
const TOOTH = TAU / 12;
const TAPE_X = 832;
const TAPE_ROWS = 6;

// Screen-integer slots in game.scr, written by the fixed step (layout()) so the
// renderer never receives a computed double.
export const P_PY = 0; // piston head y
export const P_CY = 1; // collar y
export const P_PENX = 2; // pen x
export const P_HX = 3; // crank handle x
export const P_HY = 4; // crank handle y
export const P_TEETH = 8; // 12 teeth x (x0, y0, x1, y1)
export const SCR_SIZE = P_TEETH + 48;

/** Integer screen x of input x. */
export function toGX(x) {
  return (GX0 + x * GXU) | 0;
}
/** Integer screen y of output y for a graph scale (event time only). */
export function toGY(y, scale) {
  const v = (GY0 - y * scale) | 0;
  return v < GY1 - 8 ? GY1 - 8 : v;
}

/**
 * Fixed-step layout: every moving screen coordinate as an integer. One
 * function, Math builtins only, so the doubles never leave registers.
 */
const COS_TOOTH = Math.cos(TOOTH);
const SIN_TOOTH = Math.sin(TOOTH);

export function layout(g) {
  const scr = g.scr;
  const sp = g.springs;
  const scale = g.f[F_YSCALE];
  const runX = g.f[F_RUNX];
  let v = (GY0 - sp.pos[S_PISTON] * scale) | 0;
  scr[P_PY] = v < GY1 - 8 ? GY1 - 8 : v;
  v = (GY0 - sp.pos[S_COLLAR] * scale) | 0;
  scr[P_CY] = v < GY1 - 8 ? GY1 - 8 : v;
  scr[P_PENX] = (GX0 + runX * GXU) | 0;
  const ca = runX * TAU;
  scr[P_HX] = (CRANK_X + Math.cos(ca) * 48) | 0;
  scr[P_HY] = (CRANK_Y + Math.sin(ca) * 48) | 0;
  const ga = runX * Math.PI + sp.pos[S_GEAR] * 0.08;
  // The teeth only move while the crank turns; skip the layout when the gear
  // angle is unchanged (this loop, run every step, measured 45 B/frame).
  if (ga === g.f[F_GA]) return;
  g.f[F_GA] = ga;
  // Rotate tooth to tooth with the angle-addition formula (pure multiplies).
  let c = Math.cos(ga);
  let s = Math.sin(ga);
  for (let i = 0; i < 12; i++) {
    if (i > 0) {
      const nc = c * COS_TOOTH - s * SIN_TOOTH;
      s = s * COS_TOOTH + c * SIN_TOOTH;
      c = nc;
    }
    const o = P_TEETH + i * 4;
    scr[o] = (GEAR_X + c * 54) | 0;
    scr[o + 1] = (GEAR_Y + s * 54) | 0;
    scr[o + 2] = (GEAR_X + c * 70) | 0;
    scr[o + 3] = (GEAR_Y + s * 70) | 0;
  }
}

/** Machine housing, piston cylinder and tape panel: painted once. */
export function buildMachineLayer() {
  return staticLayer(W, H, (g) => {
    g.fillStyle = "#1a2236";
    g.beginPath();
    g.roundRect(24, 60, 300, 460, 18);
    g.fill();
    g.strokeStyle = "#3b4a6b";
    g.lineWidth = 2;
    g.stroke();
    // Piston cylinder on the graph's y-scale.
    g.fillStyle = "#121a2b";
    g.fillRect(PIST_X - 12, GY1 - 10, 24, GY0 - GY1 + 20);
    g.strokeStyle = "#5b6f96";
    g.strokeRect(PIST_X - 12, GY1 - 10, 24, GY0 - GY1 + 20);
    // Crank axle plate and gear bearing.
    g.fillStyle = "#24365c";
    g.beginPath();
    g.arc(CRANK_X, CRANK_Y, 64, 0, TAU);
    g.fill();
    g.beginPath();
    g.arc(GEAR_X, GEAR_Y, 76, 0, TAU);
    g.fill();
    // Drive shaft from the rule gear to the piston.
    g.fillStyle = "#3b5785";
    g.fillRect(GEAR_X + 70, GEAR_Y - 5, PIST_X - 12 - GEAR_X - 70, 10);
    // Tape / table panel.
    g.fillStyle = "#f3ecd8";
    g.beginPath();
    g.roundRect(720, 60, 224, 460, 12);
    g.fill();
  });
}

/** Graph frame for a y-axis that tops out at `top` (rebuilt each round). */
export function buildGraphLayer(top) {
  return staticLayer(W, H, (g) => {
    g.fillStyle = "#0b1426";
    g.fillRect(GX0 - 4, GY1 - 12, GX1 - GX0 + 16, GY0 - GY1 + 16);
    g.strokeStyle = "rgba(255,255,255,0.10)";
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= X_MAX; i++) {
      g.moveTo(GX0 + i * GXU + 0.5, GY1);
      g.lineTo(GX0 + i * GXU + 0.5, GY0);
    }
    for (let j = 0; j <= 10; j++) {
      const y = GY0 - ((GY0 - GY1) * j) / 10;
      g.moveTo(GX0, y + 0.5);
      g.lineTo(GX1, y + 0.5);
    }
    g.stroke();
    g.strokeStyle = "#e8eefc";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(GX0, GY1 - 10);
    g.lineTo(GX0, GY0);
    g.lineTo(GX1 + 10, GY0);
    g.stroke();
    g.fillStyle = "#e8eefc";
    g.font = "13px system-ui";
    g.textAlign = "center";
    for (let i = 0; i <= X_MAX; i++) g.fillText(String(i), GX0 + i * GXU, GY0 + 18);
    g.textAlign = "right";
    for (let j = 1; j <= 10; j++) {
      // every horizontal gridline is numbered (rows are 39px apart, no skipping)
      const y = GY0 - ((GY0 - GY1) * j) / 10;
      g.fillText(String((top * j) / 10), GX0 - 6, y + 4);
    }
  });
}

export function renderAll(g, ctx) {
  g.backdrop(ctx);
  ctx.drawImage(g.machineLayer, 0, 0, W, H);
  ctx.drawImage(g.graphLayer, 0, 0, W, H);
  drawAxisTitles(g, ctx);
  drawTrace(g, ctx);
  drawObserved(g, ctx);
  drawMachine(g, ctx);
  drawPaper(g, ctx);
  g.particles.render(ctx);
}

function drawAxisTitles(g, ctx) {
  const L = g.labels;
  ctx.fillStyle = "#a9b6d3";
  ctx.font = "700 14px system-ui";
  ctx.textAlign = "center";
  text(ctx, L.xAxis, ((GX0 + GX1) / 2) | 0, GY0 + 40);
  ctx.textAlign = "left";
  text(ctx, L.yAxis, GX0 + 8, GY1 - 18);
}

const COLLAR = ["#ffd166", "#ff6b6b", "#7bdc8f"]; // set, missed, met
const OBS_STROKE = ["#ffffff", "#7bdc8f", "#ff6b6b"]; // idle, matched, missed

function drawObserved(g, ctx) {
  ctx.lineWidth = 3;
  const mask = g.obsMask;
  const state = g.obsState;
  const sy = g.obsSY;
  for (let i = 0; i <= X_MAX; i++) {
    if (mask[i] === 0) continue;
    const st = state[i];
    const x = GX0 + i * GXU;
    ctx.strokeStyle = OBS_STROKE[st];
    ring(ctx, x, sy[i], 8);
    ctx.stroke();
    if (st === 1) {
      ctx.fillStyle = "#7bdc8f";
      dot(ctx, x, sy[i], 4);
    }
  }
}

/** Pen trace: plotted points, the line through them, and (Tier 2) rise-over-run steps. */
function drawTrace(g, ctx) {
  ctx.strokeStyle = "#46c2b8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let px = -1;
  let py = -1;
  for (let i = 0; i <= X_MAX; i++) {
    if (g.plotted[i] === 0) continue;
    const x = toGX(i);
    const y = g.plotSY[i];
    if (px >= 0) line(ctx, px, py, x, y);
    px = x;
    py = y;
  }
  ctx.stroke();
  if (g.tier >= 2) {
    // The constant change: one step right, then the rise.
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.beginPath();
    px = -1;
    for (let i = 0; i <= X_MAX; i++) {
      if (g.plotted[i] === 0) continue;
      const x = toGX(i);
      const y = g.plotSY[i];
      if (px >= 0) {
        line(ctx, px, py, x, py);
        line(ctx, x, py, x, y);
      }
      px = x;
      py = y;
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#46c2b8";
  for (let i = 0; i <= X_MAX; i++) {
    if (g.plotted[i] === 1) dot(ctx, toGX(i), g.plotSY[i], 5);
  }
}

function drawMachine(g, ctx) {
  const L = g.labels;
  const scr = g.scr;
  // Crank: one full turn per unit of x.
  ctx.strokeStyle = "#a9b6d3";
  ctx.lineWidth = 6;
  ring(ctx, CRANK_X, CRANK_Y, 50);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  line(ctx, CRANK_X, CRANK_Y, scr[P_HX], scr[P_HY]);
  ctx.stroke();
  ctx.fillStyle = "#f2b45a";
  dot(ctx, scr[P_HX], scr[P_HY], 10);
  dot(ctx, CRANK_X, CRANK_Y, 8);
  // Belt from crank to gear.
  ctx.strokeStyle = "#5b6f96";
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, CRANK_X - 52, CRANK_Y, GEAR_X - 64, GEAR_Y);
  line(ctx, CRANK_X + 52, CRANK_Y, GEAR_X + 64, GEAR_Y);
  ctx.stroke();
  // Rule gear: turns with the crank; a gear change kicks it.
  ctx.strokeStyle = "#46c2b8";
  ctx.lineWidth = 9;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const o = P_TEETH + i * 4;
    line(ctx, scr[o], scr[o + 1], scr[o + 2], scr[o + 3]);
  }
  ctx.stroke();
  ctx.fillStyle = "#1f6f6b";
  dot(ctx, GEAR_X, GEAR_Y, 56);
  ctx.fillStyle = "#0b1220";
  roundRect(ctx, GEAR_X - 44, GEAR_Y - 22, 88, 44, 10);
  ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.font = "700 26px system-ui";
  ctx.textAlign = "center";
  text(ctx, L.gear, GEAR_X, GEAR_Y + 9);
  // Tags: what turns the crank and what the piston outputs.
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 14px system-ui";
  text(ctx, L.inTag, CRANK_X + 40, 506);
  text(ctx, L.outTag, GEAR_X, 152);
  // Piston on the graph's y-scale, with its arm carrying the pen.
  const py = scr[P_PY];
  const penX = scr[P_PENX];
  ctx.fillStyle = "#8d99ad";
  rect(ctx, PIST_X - 5, py, 10, GY0 - py);
  ctx.fillStyle = "#e8eefc";
  rect(ctx, PIST_X - 16, py - 6, 32, 12);
  if (g.m === M_PREDICT) drawCollar(g, ctx);
  alphaLevel(ctx, 10);
  ctx.strokeStyle = "#a9b6d3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  line(ctx, PIST_X + 16, py, penX, py);
  line(ctx, penX, GY0, penX, py);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffd166";
  dot(ctx, penX, py, 6);
  if (g.tier >= 2 && g.s[I_STEPX] > 0) {
    ctx.font = "700 15px system-ui";
    ctx.textAlign = "left";
    text(ctx, L.delta, penX + 10, py - 12);
  }
}

/** PREDICT: the output dial sets a collar on the piston; the piston meets it or not. */
function drawCollar(g, ctx) {
  const cy = g.scr[P_CY];
  ctx.fillStyle = COLLAR[g.s[I_DONE] === 1 ? (g.solved ? 2 : 1) : 0];
  rect(ctx, PIST_X - 24, cy - 4, 48, 8);
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "right";
  text(ctx, g.labels.collar, PIST_X - 28, cy + 5);
}

/** The tape (Tier 0 readings) and the Tier 1 table, printed on the paper panel. */
function drawPaper(g, ctx) {
  const L = g.labels;
  ctx.textAlign = "center";
  ctx.font = "700 15px system-ui";
  ctx.fillStyle = "#3b2f12";
  if (g.tier >= 1) {
    text(ctx, L.table, TAPE_X, 86);
    ctx.font = "700 16px system-ui";
    text(ctx, L.hx, TAPE_X - 44, 112);
    text(ctx, L.hy, TAPE_X + 44, 112);
    ctx.fillStyle = "#3b2f12";
    rect(ctx, 734, 120, 196, 2);
    rect(ctx, TAPE_X - 1, 98, 2, 30 * g.s[I_TBL] + 26);
    ctx.font = "16px system-ui";
    for (let r = 0; r < g.s[I_TBL]; r++) {
      text(ctx, L.tblX[r], TAPE_X - 44, 144 + r * 28);
      text(ctx, L.tblY[r], TAPE_X + 44, 144 + r * 28);
    }
  }
  ctx.font = "700 15px system-ui";
  text(ctx, L.tape, TAPE_X, 314);
  rect(ctx, 734, 324, 196, 2);
  // Last few printed readings, oldest first.
  let skip = g.s[I_NPLOT] - TAPE_ROWS;
  let row = 0;
  ctx.font = "16px system-ui";
  for (let i = 0; i <= X_MAX; i++) {
    if (g.plotted[i] === 0) continue;
    if (skip > 0) {
      skip--;
      continue;
    }
    text(ctx, L.tapeX[i], TAPE_X - 44, 350 + row * 26);
    text(ctx, L.tapeY[i], TAPE_X + 44, 350 + row * 26);
    row++;
  }
}
