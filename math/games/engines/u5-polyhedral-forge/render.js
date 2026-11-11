// Polyhedral Forge drawing. Zero allocation per frame: every coordinate is an
// integer (Int32Array tables or |0), doubles live only in locals and typed
// arrays, colours and fonts are module constants, labels are built in
// refreshLabels(). The 3-D view is a hand-rolled orthographic projection
// (yaw about z, then pitch) of the vertex table foldSolid() writes.

import { alpha, alphaLevel, dot, line, rect, roundRect, staticLayer, text } from "../core/draw.js";
import { foldSolid } from "./math.js";

const S_FOLD = 0;
const S_MORPH = 1;
const S_GLOW = 2;
const S_NEEDLE = 3;
const S_FAN = 4;
const ST_FILL = 0;
const ST_C0 = 2; // cx0, cy0, cz0, cx1, cy1, cz1
const ST_K = 8;

const W = 960;
const H = 540;
const PI = Math.PI;
const ARC_FROM = Math.PI * 0.8;
const ARC_TO = Math.PI * 2.2;
const ARC_SPAN = ARC_TO - ARC_FROM;
const GX0 = 790; // gauge centre
const GY0 = 200;
// Needle tip for v = -0.04..1.04 in 256 steps, integer pixels, built once:
// no Math.cos/sin (whose boxed results allocate in unoptimized code) per frame.
const NEEDLE_N = 256;
const NEEDLE_X = new Int32Array(NEEDLE_N + 1);
const NEEDLE_Y = new Int32Array(NEEDLE_N + 1);
for (let i = 0; i <= NEEDLE_N; i++) {
  const a = ARC_FROM + ARC_SPAN * (-0.04 + (1.08 * i) / NEEDLE_N);
  NEEDLE_X[i] = Math.round(GX0 + Math.cos(a) * 72);
  NEEDLE_Y[i] = Math.round(GY0 + Math.sin(a) * 72);
}

// solid view
const SOX = 330;
const SOY = 265;
const YAW0 = -0.62;
const PITCH0 = 0.5;
const PITCH1 = 1.25;

// chamber grid (all integers: no doubles reach the canvas)
const G = 28;
const GXo = 14;
const GYo = 10;
const COX = 90;
const COY = 468;

// regular polygon
const RCX = 330;
const RCY = 255;
const R_PX = 150;
const FAN_PX = 44;
const SPIN = 0.5; // peak spin (radians) halfway through the fan
const TRI_FILL = ["#3b5785", "#4a6aa0"];
// Spin angle 4u(1-u)·SPIN as cos/sin tables over u = 0..1 (256 steps), built once.
const SPIN_N = 256;
const SPIN_C = new Float64Array(SPIN_N + 1);
const SPIN_S = new Float64Array(SPIN_N + 1);
for (let i = 0; i <= SPIN_N; i++) {
  const u = i / SPIN_N;
  SPIN_C[i] = Math.cos(4 * u * (1 - u) * SPIN);
  SPIN_S[i] = Math.sin(4 * u * (1 - u) * SPIN);
}

const FONT_L = "700 20px system-ui";
const FONT_M = "700 16px system-ui";
const FONT_S = "700 14px system-ui";
const FONT_XL = "700 34px system-ui";
const FACE_T0 = ["#4d6089", "#6d84b3", "#566a94", "#7890c0", "#5f75a3", "#8199c9"];
const GROUP = ["#2f9e96", "#c98a2e", "#c7613f"];
const CUBE = ["#8fe3d9", "#2f8f88", "#46c2b8", "#ffb3a7", "#b8483b", "#ff6b5b"];

// ---------- layout (event time; may allocate) ----------

/** Lay the shield plate out in integer pixels. */
export function layoutShield(g) {
  const s = g.shield;
  const { b, h, off } = s;
  const kind = s.kind === "para" ? 0 : s.kind === "tri" ? 1 : 2;
  const p = b - off;
  const width = kind === 0 ? b + off : kind === 1 ? b + p : 2 * b;
  const k = Math.min(520 / width, 330 / h);
  const ox = 60 + (((540 - width * k) / 2) | 0);
  const oy = 440;
  const X = (x) => Math.round(ox + x * k);
  const Y = (y) => Math.round(oy - y * k);
  const body =
    kind === 0
      ? [off, 0, b, 0, b + off, h, off, h]
      : kind === 1
        ? [0, 0, b, 0, p, h]
        : [0, 0, b, 0, b, h, off, h];
  const ghost =
    kind === 0
      ? [off, 0, b + off, 0, b + off, h, off, h]
      : kind === 1
        ? [0, 0, b, 0, b + p, h, p, h]
        : [0, 0, 2 * b - off, 0, 2 * b, h, off, h];
  const info = g.shInfo;
  info.fill(0);
  info[0] = kind;
  info[1] = body.length / 2;
  for (let i = 0; i < body.length; i += 2) {
    g.shBody[i] = X(body[i]);
    g.shBody[i + 1] = Y(body[i + 1]);
  }
  if (!g.shGhost) g.shGhost = new Int32Array(8);
  for (let i = 0; i < 8; i += 2) {
    g.shGhost[i] = X(ghost[i]);
    g.shGhost[i + 1] = Y(ghost[i + 1]);
  }
  if (kind === 0) {
    const piece = [0, 0, off, 0, off, h];
    for (let i = 0; i < 6; i += 2) {
      g.shPiece[i] = X(piece[i]);
      g.shPiece[i + 1] = Y(piece[i + 1]);
    }
    info[2] = 3;
    info[3] = X(b) - X(0);
  } else {
    const mx = kind === 1 ? (b + p) / 2 : b;
    const pmx = X(mx);
    const pmy = Y(h / 2);
    info[2] = info[1];
    info[4] = pmx;
    info[5] = pmy;
    for (let i = 0; i < body.length; i += 2) {
      g.shPiece[i] = g.shBody[i] - pmx;
      g.shPiece[i + 1] = g.shBody[i + 1] - pmy;
    }
  }
  const hx = kind === 1 ? p : off;
  info[6] = X(hx);
  info[7] = Y(0);
  info[8] = Y(h);
  info[9] = X(b / 2); // base label
  info[10] = Y(0) + 30;
  info[11] = X(hx) + 10; // height label
  info[12] = Y(h / 2) + 6;
  const sx = kind === 1 ? (b + p) / 2 : off / 2;
  info[13] = X(sx) + (kind === 1 ? 26 : -26); // slant label
  info[14] = Y(h / 2) + 6;
  info[15] = X((off + b) / 2); // top base label (trapezoid)
  info[16] = Y(h) - 12;
  info[17] = Math.round(k); // unit size for the tier-2 grid
  info[18] = X(0);
}

/**
 * Regular n-gon with its bottom side horizontal: vertex k at angle
 * 90° - 180°/n + k·360°/n (canvas y down), so triangle 0 (centre, V0, V1)
 * sits at the bottom with a horizontal base and a vertical apothem.
 */
export function layoutRegular(g) {
  const n = g.regular.n;
  const d = g.rgDir;
  d.fill(0);
  for (let k = 0; k < n; k++) {
    const t = Math.PI / 2 - Math.PI / n + (k * 2 * Math.PI) / n;
    d[k] = Math.cos(t);
    d[8 + k] = Math.sin(t);
    d[16 + k] = Math.cos(t + Math.PI / n);
    d[24 + k] = Math.sin(t + Math.PI / n);
  }
  const info = g.rgInfo;
  info[0] = n;
  info[1] = R_PX;
  info[2] = Math.round(R_PX * Math.cos(Math.PI / n));
  info[3] = FAN_PX;
  info[4] = 0;
}

/** Choose the scale and view centres so the solid and its net both fit. */
export function fitSolid(g) {
  const info = g.solidInfo;
  const prism = info[0] === 0;
  const a = info[1];
  const b = info[2];
  const c = info[3];
  const st = g.st;
  if (prism) {
    st[ST_C0] = a / 2;
    st[ST_C0 + 1] = b / 2;
    st[ST_C0 + 2] = c / 2;
    st[ST_C0 + 3] = a / 2;
    st[ST_C0 + 4] = b;
    st[ST_C0 + 5] = 0;
  } else {
    const hp = Math.sqrt(b * b - (a * a) / 4);
    st[ST_C0] = a / 2;
    st[ST_C0 + 1] = a / 2;
    st[ST_C0 + 2] = hp / 2;
    st[ST_C0 + 3] = a / 2;
    st[ST_C0 + 4] = a / 2;
    st[ST_C0 + 5] = 0;
  }
  st[ST_K] = 100;
  let mx = 1;
  let my = 1;
  for (let uq = 0; uq <= 10000; uq += 1250) {
    projectSolid(g, uq);
    for (let i = 0; i < info[5]; i++) {
      mx = Math.max(mx, Math.abs(g.sx[i] - SOX));
      my = Math.max(my, Math.abs(g.sy[i] - SOY));
    }
  }
  st[ST_K] = 100 * Math.min(265 / mx, 205 / my);
}

// ---------- per-frame (no allocation) ----------

/** Fold to uq/10000 and project every vertex to integer screen coordinates. */
function projectSolid(g, uq) {
  const info = g.solidInfo;
  const v = g.verts;
  foldSolid(v, info[0], info[1], info[2], info[3], uq);
  const u = uq / 10000;
  const st = g.st;
  const yaw = YAW0 * (1 - u);
  const pitch = PITCH0 + (PITCH1 - PITCH0) * u;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cx0 = st[ST_C0] + (st[ST_C0 + 3] - st[ST_C0]) * u;
  const cy0 = st[ST_C0 + 1] + (st[ST_C0 + 4] - st[ST_C0 + 1]) * u;
  const cz0 = st[ST_C0 + 2] + (st[ST_C0 + 5] - st[ST_C0 + 2]) * u;
  const k = st[ST_K];
  const n = info[5];
  for (let i = 0; i < n; i++) {
    const x = v[3 * i] - cx0;
    const y = v[3 * i + 1] - cy0;
    const z = v[3 * i + 2] - cz0;
    const x1 = x * cy - y * sy;
    const y1 = x * sy + y * cy;
    g.sx[i] = (SOX + x1 * k) | 0;
    g.sy[i] = (SOY - (z * cp + y1 * sp) * k) | 0;
    g.vDepth[i] = z * sp - y1 * cp;
  }
}

function drawSolid(ctx, g) {
  let u = g.springs.pos[S_FOLD];
  if (u < 0) u = 0;
  if (u > 1) u = 1;
  projectSolid(g, (u * 10000) | 0);
  const info = g.solidInfo;
  const nf = info[4];
  const order = g.order;
  // painter's order: farthest face first (insertion sort, typed arrays only)
  for (let f = 0; f < nf; f++) {
    const s0 = g.faceStart[f];
    const n = g.faceN[f];
    let d = 0;
    for (let j = 0; j < n; j++) d += g.vDepth[s0 + j];
    g.faceDepth[f] = d / n;
    order[f] = f;
  }
  for (let i = 1; i < nf; i++) {
    const f = order[i];
    let j = i - 1;
    while (j >= 0 && g.faceDepth[order[j]] > g.faceDepth[f]) {
      order[j + 1] = order[j];
      j--;
    }
    order[j + 1] = f;
  }
  const tier = g.tier;
  const L = g.labels;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.font = FONT_S;
  for (let i = 0; i < nf; i++) {
    const f = order[i];
    const s0 = g.faceStart[f];
    const n = g.faceN[f];
    ctx.beginPath();
    ctx.moveTo(g.sx[s0], g.sy[s0]);
    let cx = g.sx[s0];
    let cy = g.sy[s0];
    for (let j = 1; j < n; j++) {
      ctx.lineTo(g.sx[s0 + j], g.sy[s0 + j]);
      cx += g.sx[s0 + j];
      cy += g.sy[s0 + j];
    }
    ctx.closePath();
    ctx.fillStyle = tier >= 1 ? GROUP[g.faceGroup[f]] : FACE_T0[f];
    ctx.fill();
    const traced = tier >= 2 && f < g.traced;
    ctx.strokeStyle = traced ? "#ffd166" : "#e8eefc";
    ctx.lineWidth = traced ? 4 : 2;
    ctx.stroke();
    if (tier >= 1) {
      const lx = (cx / n) | 0;
      const ly = (cy / n) | 0;
      ctx.fillStyle = "#04121a";
      text(ctx, L.face[f], lx, ly + 2);
      if (traced) {
        ctx.fillStyle = "#ffd166";
        text(ctx, L.area[f], lx, ly + 20);
      }
    }
  }
  ctx.lineJoin = "miter";
}

function polyPath(ctx, xs, n) {
  ctx.beginPath();
  ctx.moveTo(xs[0], xs[1]);
  for (let i = 1; i < n; i++) ctx.lineTo(xs[2 * i], xs[2 * i + 1]);
  ctx.closePath();
}

function drawShield(ctx, g) {
  const info = g.shInfo;
  const kind = info[0];
  const nb = info[1];
  const m = g.springs.pos[S_MORPH];
  const L = g.labels;
  const tier = g.tier;
  // Tier 1+: ghost of the shape the morph is building toward.
  if (tier >= 1) {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    alpha(ctx, 0.55);
    polyPath(ctx, g.shGhost, 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#3b5785";
  ctx.strokeStyle = "#a9b6d3";
  ctx.lineWidth = 3;
  polyPath(ctx, g.shBody, nb);
  ctx.fill();
  ctx.stroke();
  // The moving piece.
  const pc = g.shPiece;
  if (kind === 0) {
    const shift = (m * info[3]) | 0;
    ctx.fillStyle = "#4a6aa0";
    ctx.beginPath();
    ctx.moveTo(pc[0] + shift, pc[1]);
    ctx.lineTo(pc[2] + shift, pc[3]);
    ctx.lineTo(pc[4] + shift, pc[5]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (m > 0.01) {
    const pv = g.pivot;
    pv.set(info[4], info[5], m * PI);
    ctx.fillStyle = "#2f9e96";
    alpha(ctx, 0.8);
    ctx.beginPath();
    ctx.moveTo(pv.px(pc[0], pc[1]), pv.py(pc[0], pc[1]));
    for (let i = 1; i < info[2]; i++) {
      ctx.lineTo(pv.px(pc[2 * i], pc[2 * i + 1]), pv.py(pc[2 * i], pc[2 * i + 1]));
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  }
  // Tier 2: unit squares inside the rearranged shape, to count one by one.
  if (tier >= 2) {
    const unit = info[17];
    const x0 = info[18];
    const y0 = info[7];
    const top = info[8];
    ctx.save();
    polyPath(ctx, g.shGhost, 4);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,209,102,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0; x < W; x += unit) line(ctx, x, top, x, y0);
    for (let y = y0; y > top; y -= unit) line(ctx, x0, y, 640, y);
    ctx.stroke();
    ctx.restore();
  }
  // Height line with its right-angle mark.
  const hx = info[6];
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, hx, info[7], hx, info[8]);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeRect(hx, info[7] - 12, 12, 12);
  ctx.font = FONT_L;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "center";
  text(ctx, L.b, info[9], info[10]);
  if (kind === 2) text(ctx, L.b2, info[15], info[16]);
  ctx.fillStyle = "#a9b6d3";
  // The parallelogram's slanted side rides on the sliding piece.
  text(ctx, L.s, kind === 0 ? info[13] + ((m * info[3]) | 0) : info[13], info[14]);
  ctx.fillStyle = "#ffd166";
  ctx.textAlign = "left";
  text(ctx, L.h, info[11], info[12]);
}

// The regular shield is drawn by three small functions rather than one large
// one: a single large render function was optimized late, and installing its
// code landed inside a live frame (a one-off ~20 KB charge in the GC audit).
// They share only integers (the spin-table index) and read doubles from typed
// arrays, so no boxed double crosses a call.

function regularGhost(ctx, g) {
  const info = g.rgInfo;
  const d = g.rgDir;
  const n = info[0];
  const R = info[1];
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  alphaLevel(ctx, 10);
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const j = k + 1 === n ? 0 : k + 1;
    const x0 = (RCX + R * d[k]) | 0;
    const y0 = (RCY + R * d[8 + k]) | 0;
    line(ctx, RCX, RCY, x0, y0);
    line(ctx, x0, y0, (RCX + R * d[j]) | 0, (RCY + R * d[8 + j]) | 0);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function regularTriangles(ctx, g, si) {
  const info = g.rgInfo;
  const d = g.rgDir;
  const n = info[0];
  const R = info[1];
  const counted = info[4];
  const tier = g.tier;
  let u = g.springs.pos[S_FAN];
  if (u < 0) u = 0;
  const open = tier >= 1 || u > 0.02;
  const c = SPIN_C[si];
  const s = SPIN_S[si];
  const reach = u * info[3];
  if (!open) {
    // Tier 0, fan closed: one solid plate, no seams that would hint at the triangles.
    ctx.fillStyle = TRI_FILL[0];
    ctx.strokeStyle = "#a9b6d3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo((RCX + R * d[0]) | 0, (RCY + R * d[8]) | 0);
    for (let k = 1; k < n; k++) ctx.lineTo((RCX + R * d[k]) | 0, (RCY + R * d[8 + k]) | 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  ctx.font = FONT_M;
  ctx.textAlign = "center";
  for (let k = 0; k < n; k++) {
    const j = k + 1 === n ? 0 : k + 1;
    const ox = RCX + reach * (d[16 + k] * c - d[24 + k] * s);
    const oy = RCY + reach * (d[16 + k] * s + d[24 + k] * c);
    const ax = ox + R * (d[k] * c - d[8 + k] * s);
    const ay = oy + R * (d[k] * s + d[8 + k] * c);
    const bx = ox + R * (d[j] * c - d[8 + j] * s);
    const by = oy + R * (d[j] * s + d[8 + j] * c);
    const lit = tier >= 2 && k < counted;
    ctx.fillStyle = lit ? "#2f9e96" : TRI_FILL[k & 1];
    ctx.beginPath();
    ctx.moveTo(ox | 0, oy | 0);
    ctx.lineTo(ax | 0, ay | 0);
    ctx.lineTo(bx | 0, by | 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lit ? "#ffd166" : "#a9b6d3";
    ctx.lineWidth = lit ? 4 : 3;
    ctx.stroke();
    if (lit) {
      ctx.fillStyle = "#ffd166";
      // beside the apothem, toward vertex a, so the height line never covers it
      text(ctx, g.labels.num[k], ((ox + 2 * ax + bx) / 4) | 0, (((oy + 2 * ay + by) / 4) | 0) + 6);
    }
  }
}

/** Triangle 0's apothem (its height) with a right-angle mark, and the labels. */
function regularApothem(ctx, g, si) {
  const info = g.rgInfo;
  const d = g.rgDir;
  const ap = info[2];
  const tier = g.tier;
  const L = g.labels;
  const c = SPIN_C[si];
  const s = SPIN_S[si];
  let u = g.springs.pos[S_FAN];
  if (u < 0) u = 0;
  const reach = u * info[3];
  const mx = d[16] * c - d[24] * s;
  const my = d[16] * s + d[24] * c;
  const ox = RCX + reach * mx;
  const oy = RCY + reach * my;
  const fx = ox + ap * mx;
  const fy = oy + ap * my;
  const ex = -my; // along the base
  const ey = mx;
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, ox | 0, oy | 0, fx | 0, fy | 0);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((fx - 12 * mx) | 0, (fy - 12 * my) | 0);
  ctx.lineTo((fx - 12 * mx + 12 * ex) | 0, (fy - 12 * my + 12 * ey) | 0);
  ctx.lineTo((fx + 12 * ex) | 0, (fy + 12 * ey) | 0);
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  dot(ctx, ox | 0, oy | 0, 5);
  ctx.font = FONT_L;
  ctx.fillStyle = tier >= 1 ? "#ffd166" : "#e8eefc";
  text(ctx, tier >= 1 ? L.base : L.side, (fx + 30 * mx) | 0, (fy + 30 * my + 6) | 0);
  ctx.fillStyle = "#ffd166";
  ctx.textAlign = "left";
  text(ctx, tier >= 1 ? L.hgt : L.apo, (ox + 0.55 * ap * mx + 18 * ex) | 0, (oy + 0.55 * ap * my) | 0);
}

function drawRegular(ctx, g) {
  // spin out and back: cos/sin from the table, vectors rotated by arithmetic
  let si = (g.springs.pos[S_FAN] * SPIN_N + 0.5) | 0;
  if (si < 0) si = 0;
  if (si > SPIN_N) si = SPIN_N;
  ctx.lineJoin = "round";
  // Tier 1+: ghost outline of every triangle where the polygon rests.
  if (g.tier >= 1) regularGhost(ctx, g);
  regularTriangles(ctx, g, si);
  regularApothem(ctx, g, si);
  ctx.lineJoin = "miter";
}

function filled(i, j, k, nl, nw, nh, c) {
  return i >= 0 && j >= 0 && k >= 0 && i < nl && j < nw && k < nh && k * nl * nw + j * nl + i < c;
}

function quad(ctx, x0, y0, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawChamber(ctx, g) {
  const ch = g.ch;
  const hl = ch[0];
  const hw = ch[1];
  const hh = ch[2];
  const nl = ch[3];
  const nw = ch[4];
  const nh = ch[5];
  const c = g.st[ST_FILL] | 0;
  // Walls behind the cubes: floor, back wall, left wall.
  ctx.fillStyle = "rgba(70,194,184,0.10)";
  ctx.strokeStyle = "rgba(159,231,255,0.5)";
  ctx.lineWidth = 2;
  const bx = COX + hw * GXo;
  const by = COY - hw * GYo;
  quad(ctx, COX, COY, COX + hl * G, COY, bx + hl * G, by, bx, by);
  quad(ctx, bx, by, bx + hl * G, by, bx + hl * G, by - hh * G, bx, by - hh * G);
  quad(ctx, COX, COY, bx, by, bx, by - hh * G, COX, COY - hh * G);
  // Tier 1: half-inch grid etched on the floor.
  if (g.tier >= 1) {
    ctx.strokeStyle = "rgba(255,209,102,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= hl; i++) line(ctx, COX + i * G, COY, bx + i * G, by);
    for (let j = 0; j <= hw; j++)
      line(ctx, COX + j * GXo, COY - j * GYo, COX + j * GXo + hl * G, COY - j * GYo);
    ctx.stroke();
  }
  // Cubes, back to front, bottom to top; only exposed faces are drawn.
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#0b1220";
  for (let k = 0; k < nh; k++) {
    for (let j = nw - 1; j >= 0; j--) {
      for (let i = 0; i < nl; i++) {
        if (!filled(i, j, k, nl, nw, nh, c)) continue;
        const over = i >= hl || j >= hw || k >= hh ? 3 : 0;
        const x = COX + i * G + j * GXo;
        const y = COY - k * G - j * GYo;
        if (!filled(i, j, k + 1, nl, nw, nh, c)) {
          ctx.fillStyle = CUBE[over];
          quad(ctx, x, y - G, x + G, y - G, x + G + GXo, y - G - GYo, x + GXo, y - G - GYo);
        }
        if (!filled(i + 1, j, k, nl, nw, nh, c)) {
          ctx.fillStyle = CUBE[over + 1];
          quad(ctx, x + G, y, x + G + GXo, y - GYo, x + G + GXo, y - G - GYo, x + G, y - G);
        }
        if (!filled(i, j - 1, k, nl, nw, nh, c)) {
          ctx.fillStyle = CUBE[over + 2];
          rect(ctx, x, y - G, G, G);
          ctx.strokeRect(x, y - G, G, G);
        }
      }
    }
  }
  // Glass edges in front.
  ctx.strokeStyle = "#9fe7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const fx = COX + hl * G;
  const ty = COY - hh * G;
  line(ctx, COX, COY, fx, COY);
  line(ctx, fx, COY, fx, ty);
  line(ctx, fx, ty, COX, ty);
  line(ctx, COX, ty, COX, COY);
  line(ctx, fx, COY, bx + hl * G, by);
  line(ctx, fx, ty, bx + hl * G, by - hh * G);
  line(ctx, COX, ty, bx, by - hh * G);
  line(ctx, bx, by - hh * G, bx + hl * G, by - hh * G);
  line(ctx, bx + hl * G, by, bx + hl * G, by - hh * G);
  ctx.stroke();
  const L = g.labels;
  ctx.font = FONT_M;
  ctx.fillStyle = "#e8eefc";
  ctx.textAlign = "center";
  text(ctx, L.cl, COX + ((hl * G) >> 1), COY + 26);
  ctx.textAlign = "right";
  text(ctx, L.chh, COX - 8, COY - ((hh * G) >> 1));
  ctx.textAlign = "left";
  text(ctx, L.cw, fx + ((hw * GXo) >> 1) + 10, COY - ((hw * GYo) >> 1) + 16);
}

function gaugeLayer(g) {
  if (!g.gaugeLayer) {
    g.gaugeLayer = staticLayer(W, H, (c) => {
      c.fillStyle = "#0f1830";
      roundRect(c, 650, 40, 280, 400, 18);
      c.fill();
      c.strokeStyle = "#2c3e63";
      c.lineWidth = 2;
      c.stroke();
      c.lineWidth = 10;
      c.beginPath();
      c.arc(GX0, GY0, 80, ARC_FROM, ARC_TO);
      c.stroke();
    });
  }
  return g.gaugeLayer;
}

function drawGauge(ctx, g) {
  const L = g.labels;
  // Panel and arc track are static artwork: painted once (the arc's double
  // angles would otherwise reach the canvas every frame).
  ctx.drawImage(gaugeLayer(g), 0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#a9b6d3";
  ctx.font = FONT_M;
  text(ctx, L.plate, GX0, 76);
  let ni = ((g.springs.pos[S_NEEDLE] + 0.04) * (NEEDLE_N / 1.08) + 0.5) | 0;
  if (ni < 0) ni = 0;
  if (ni > NEEDLE_N) ni = NEEDLE_N;
  ctx.strokeStyle = g.solved ? "#7bdc8f" : "#ffd166";
  ctx.lineWidth = 4;
  ctx.beginPath();
  line(ctx, GX0, GY0, NEEDLE_X[ni], NEEDLE_Y[ni]);
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  dot(ctx, GX0, GY0, 8);
  ctx.fillStyle = "#e8eefc";
  ctx.font = FONT_XL;
  text(ctx, L.dial, GX0, GY0 + 70);
  ctx.font = FONT_M;
  ctx.fillStyle = "#a9b6d3";
  if (g.mode === "unfold") text(ctx, L.dims, GX0, 330);
  text(ctx, L.aux, GX0, 362);
  ctx.fillStyle = "#ffd166";
  text(ctx, L.aux2, GX0, 396);
}

function fortress(g) {
  if (!g.fortressLayer) {
    g.fortressLayer = staticLayer(W, H, (c) => {
      c.fillStyle = "#16203a";
      c.fillRect(0, 492, W, 48);
      for (let x = 0; x < W; x += 48) c.fillRect(x, 478, 26, 16);
      c.strokeStyle = "#24365c";
      c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x < W; x += 48) {
        c.moveTo(x + 0.5, 494);
        c.lineTo(x + 0.5, 540);
      }
      c.moveTo(0, 516.5);
      c.lineTo(W, 516.5);
      c.stroke();
    });
  }
  return g.fortressLayer;
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawScene(ctx, g) {
  g.backdrop(ctx);
  ctx.drawImage(fortress(g), 0, 0, W, H);
  const glow = g.springs.pos[S_GLOW];
  if (glow > 0.02) {
    alphaLevel(ctx, (glow * 5 + 0.5) | 0);
    ctx.fillStyle = "#7bdc8f";
    roundRect(ctx, 24, 36, 612, 446, 24);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (g.mode === "shield") drawShield(ctx, g);
  else if (g.mode === "unfold") drawSolid(ctx, g);
  else if (g.mode === "regular") drawRegular(ctx, g);
  else drawChamber(ctx, g);
  drawGauge(ctx, g);
  g.particles.render(ctx);
}
