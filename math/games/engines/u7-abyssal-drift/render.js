// Abyssal Drift renderer. Zero allocation per frame: integer coordinates via
// draw.js helpers, rotation done in layout() instead of ctx.rotate, constant colour strings, and
// every label prebuilt on game.labels by refreshLabels().

import { H, W } from "../core/engine.js";
import { alphaLevel, dot, line, rect, ring, roundRect, staticLayer, text } from "../core/draw.js";
import { num, RANGE } from "./math.js";

export const M_NAV = 0;
export const M_HULL = 1;
export const M_TETHER = 2;
export const M_MIRROR = 3;
export const HULL_X = -3; // the sub's station in hull rounds
export const DRONE_X = 3;
// Spring indexes.
export const S_X = 0;
export const S_Y = 1;
export const S_GAUGE = 2;
export const S_CABLE = 3;
export const S_TX = 4;
export const S_TY = 5;
// Float slots (doubles live in typed arrays so updates never box).
export const F_T = 0;
export const F_PING = 1;
export const F_EMIT = 2;
// Int slots.
export const I_PEND = 0; // 0 none, 1 ping on arrival (hit), 2 ping on arrival (miss)
export const I_PINGOK = 1;
export const I_FIRED = 2;
export const I_LINKS = 3;
export const I_SOLVED = 4;
export const I_PINGON = 5; // 1 while a sonar ring is expanding
export const F_COS = 3; // sub pitch cos / sin, set by layout()
export const F_SIN = 4;
// Integer screen slots in game.scr, written by layout() in the fixed step.
export const C_SUBX = 0;
export const C_SUBY = 1;
export const C_BOBY = 2;
export const C_PINGR = 3;
export const C_PINGR2 = 4;
export const C_PINGA = 5;
export const C_WIN = 6; // two windows: x, y, x, y
export const C_PROP = 10; // propeller blade: x0, y0, x1, y1
export const SCR_SIZE = 14;

export const UNIT = 22;
export const OX = 300;
export const OY = 270;
const MAP_X0 = OX - RANGE * UNIT; // 80
const MAP_X1 = OX + RANGE * UNIT; // 520
const MAP_Y0 = OY - RANGE * UNIT; // 50
const MAP_Y1 = OY + RANGE * UNIT; // 490
const PX = 754; // panel centre
const GX = PX;
const GY = 330;
const GR = 120;
const PI = Math.PI;
const SPOKE = (Math.PI * 2) / 6;
const RUNG = ["#46c2b8", "#ffd166"];
const CABLE = ["#f2b45a", "#7bdc8f"]; // slack or short, taut
const PING = ["#f2b45a", "#7bdc8f"]; // miss, hit

/** World x -> integer screen x. */
export function toX(x) {
  return (OX + x * UNIT) | 0;
}
/** World y -> integer screen y (y up). */
export function toY(y) {
  return (OY - y * UNIT) | 0;
}

/** Static artwork painted once: sea + sky + axes, Tier 1 grid, hull gauge face. */
export function buildLayers() {
  const sea = staticLayer(W, H, (g) => {
    g.fillStyle = "#060c18";
    g.fillRect(0, 0, W, H);
    const sky = g.createLinearGradient(0, MAP_Y0, 0, OY);
    sky.addColorStop(0, "#1a1440");
    sky.addColorStop(1, "#2a3a6a");
    g.fillStyle = sky;
    g.fillRect(MAP_X0, MAP_Y0, MAP_X1 - MAP_X0, OY - MAP_Y0);
    const sea2 = g.createLinearGradient(0, OY, 0, MAP_Y1);
    sea2.addColorStop(0, "#0d4a6b");
    sea2.addColorStop(1, "#03101f");
    g.fillStyle = sea2;
    g.fillRect(MAP_X0, OY, MAP_X1 - MAP_X0, MAP_Y1 - OY);
    g.strokeStyle = "#2c3e63";
    g.lineWidth = 2;
    g.strokeRect(MAP_X0, MAP_Y0, MAP_X1 - MAP_X0, MAP_Y1 - MAP_Y0);
    // Axes: the x-axis is the ocean surface.
    g.strokeStyle = "#bfe9ff";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(MAP_X0, OY);
    g.lineTo(MAP_X1, OY);
    g.stroke();
    g.strokeStyle = "#e8eefc";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(OX, MAP_Y0);
    g.lineTo(OX, MAP_Y1);
    g.stroke();
    g.fillStyle = "#e8eefc";
    g.font = "13px system-ui";
    for (let i = -RANGE; i <= RANGE; i++) {
      const x = OX + i * UNIT;
      const y = OY - i * UNIT;
      g.fillRect(x - 1, OY - (i % 2 === 0 ? 6 : 4), 2, i % 2 === 0 ? 12 : 8);
      g.fillRect(OX - (i % 2 === 0 ? 6 : 4), y - 1, i % 2 === 0 ? 12 : 8, 2);
      if (i !== 0 && i % 2 === 0) {
        g.textAlign = "center";
        g.fillText(num(i), x, OY + 20);
        g.textAlign = "right";
        g.fillText(num(i), OX - 9, y + 4);
      }
    }
    g.textAlign = "left";
    g.font = "700 15px system-ui";
    g.fillText("x", MAP_X1 - 14, OY - 10);
    g.fillText("y", OX + 8, MAP_Y0 + 16);
    // Instrument panel.
    g.fillStyle = "#0d1830";
    g.strokeStyle = "#2c3e63";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(568, 40, 372, 460, 16);
    g.fill();
    g.stroke();
  });
  const grid = staticLayer(W, H, (g) => {
    g.strokeStyle = "rgba(255,255,255,0.14)";
    g.lineWidth = 1;
    g.beginPath();
    for (let i = -RANGE; i <= RANGE; i++) {
      g.moveTo(OX + i * UNIT + 0.5, MAP_Y0);
      g.lineTo(OX + i * UNIT + 0.5, MAP_Y1);
      g.moveTo(MAP_X0, OY - i * UNIT + 0.5);
      g.lineTo(MAP_X1, OY - i * UNIT + 0.5);
    }
    g.stroke();
    g.font = "700 18px system-ui";
    g.textAlign = "center";
    const q = [
      ["(+, +)", 5, 8, "#7bdc8f"],
      ["(−, +)", -5, 8, "#ffd166"],
      ["(−, −)", -5, -8, "#ff9f6b"],
      ["(+, −)", 5, -8, "#8fc7ff"],
    ];
    for (const [label, x, y, c] of q) {
      g.fillStyle = c;
      g.globalAlpha = 0.12;
      g.fillRect(x > 0 ? OX : MAP_X0, y > 0 ? MAP_Y0 : OY, RANGE * UNIT, RANGE * UNIT);
      g.globalAlpha = 1;
      g.fillText(label, OX + x * UNIT, OY - y * UNIT);
    }
  });
  const gauge = staticLayer(W, H, (g) => {
    const zones = [
      [0, 5, "#7bdc8f"],
      [5, 8, "#f2b45a"],
      [8, 10, "#ff6b6b"],
    ];
    g.lineWidth = 14;
    for (const [a, b, c] of zones) {
      g.strokeStyle = c;
      g.beginPath();
      g.arc(GX, GY, GR, PI + (a / 10) * PI, PI + (b / 10) * PI);
      g.stroke();
    }
    g.fillStyle = "#e8eefc";
    g.font = "13px system-ui";
    g.textAlign = "center";
    for (let i = 0; i <= 10; i++) {
      const a = PI + (i / 10) * PI;
      g.fillRect(GX + Math.cos(a) * (GR - 16) - 1, GY + Math.sin(a) * (GR - 16) - 1, 3, 3);
      if (i % 2 === 0)
        g.fillText(String(i), GX + Math.cos(a) * (GR - 30), GY + Math.sin(a) * (GR - 30) + 4);
    }
    g.font = "700 16px system-ui";
    g.fillText("|d|", GX, GY - 40);
  });
  return { sea, grid, gauge };
}

export function renderAll(g, ctx) {
  const L = g.layers;
  ctx.drawImage(L.sea, 0, 0, W, H);
  surfaceWave(g, ctx);
  if (g.tier >= 1) ctx.drawImage(L.grid, 0, 0, W, H);
  const m = g.m;
  if (m === M_NAV) drawNav(g, ctx);
  else if (m === M_HULL) drawHull(g, ctx);
  else if (m === M_TETHER) drawTether(g, ctx);
  else drawMirror(g, ctx);
  drawSub(g, ctx);
  drawPing(g, ctx);
  g.particles.render(ctx);
  drawPanel(g, ctx);
}

function surfaceWave(g, ctx) {
  const t = g.f[F_T];
  ctx.strokeStyle = "rgba(191,233,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let y0 = OY + Math.sin(t * 1.6) * 2;
  for (let i = 0; i < 44; i++) {
    const y1 = OY + Math.sin(t * 1.6 + (i + 1) * 0.7) * 2;
    line(ctx, MAP_X0 + i * 10, y0 | 0, MAP_X0 + i * 10 + 10, y1 | 0);
    y0 = y1;
  }
  ctx.stroke();
}

/** Tier 1: dashed-free projection lines from the sub to both axes. */
function projections(g, ctx) {
  const sp = g.springs;
  const x = (OX + sp.pos[S_X] * UNIT) | 0;
  const y = (OY - sp.pos[S_Y] * UNIT) | 0;
  alphaLevel(ctx, 14);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ctx.beginPath();
  line(ctx, x, y, x, OY);
  ctx.stroke();
  ctx.strokeStyle = "#8fc7ff";
  ctx.beginPath();
  line(ctx, x, y, OX, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawNav(g, ctx) {
  if (g.tier >= 1) projections(g, ctx);
  if (g.s[I_SOLVED]) {
    // The vent appears only once it is found.
    const x = g.geo[0];
    const y = g.geo[1];
    ctx.fillStyle = "#ff9f6b";
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.lineTo(x + 4, y - 6);
    ctx.lineTo(x - 4, y - 6);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHull(g, ctx) {
  const q = g.q;
  const geo = g.geo;
  const Lb = g.labels;
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "left";
  if (q.variant === "match") {
    const x = geo[0];
    const y = geo[1];
    if (q.drone) {
      ctx.fillStyle = "#c9d4ea";
      roundRect(ctx, x - 16, y - 6, 32, 12, 4);
      ctx.fill();
      ctx.strokeStyle = "#c9d4ea";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spin = (Math.sin(g.f[F_T] * 30) * 10) | 0;
      line(ctx, x - 20 - spin, y - 10, x - 20 + spin, y - 10);
      line(ctx, x + 20 - spin, y - 10, x + 20 + spin, y - 10);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#a9b6d3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      line(ctx, x, OY, x, y);
      ctx.stroke();
      ctx.fillStyle = "#ff6b6b";
      roundRect(ctx, x - 10, OY - 14, 20, 16, 6);
      ctx.fill();
      ctx.fillStyle = "#8d99ad";
      rect(ctx, x - 9, y - 4, 18, 8);
    }
    ctx.fillStyle = "#ffd166";
    text(ctx, Lb.given, x + 24, y + 5);
    if (g.tier >= 2) rungs(ctx, x + 14, (q.given < 0 ? -q.given : q.given) | 0, q.given < 0 ? -1 : 1);
  } else if (g.tier >= 1) {
    // Tier 1: the three readings as flags on the depth line.
    ctx.fillStyle = "#ffd166";
    for (let i = 0; i < 3; i++) {
      const x = toX(5 + i * 2);
      const y = geo[2 + i];
      rect(ctx, x - 1, y - 1, 16, 3);
      dot(ctx, x, y, 4);
      text(ctx, i === 0 ? Lb.r0 : i === 1 ? Lb.r1 : Lb.r2, x + 6, y - 6);
    }
  }
  const sp = g.springs;
  const d = sp.target[S_Y];
  const sx = toX(HULL_X);
  const yy = (OY - sp.pos[S_Y] * UNIT) | 0;
  if (g.tier >= 1) {
    // Opposites: a ghost hull at −d strains exactly as much as the real one.
    const gy = OY + OY - yy;
    alphaLevel(ctx, 7);
    ctx.fillStyle = "#f2b45a";
    roundRect(ctx, sx - 24, gy - 9, 48, 18, 9);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#46c2b8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    line(ctx, sx - 34, OY, sx - 34, yy);
    line(ctx, sx - 40, OY, sx - 40, gy);
    ctx.stroke();
    ctx.fillStyle = "#46c2b8";
    ctx.textAlign = "right";
    text(ctx, Lb.abs, sx - 46, ((OY + yy) / 2 + 5) | 0);
    ctx.textAlign = "left";
  }
  if (g.tier >= 2) rungs(ctx, sx + 30, (d < 0 ? -d : d) | 0, d < 0 ? -1 : 1);
}

/** Tier 2: one rung per metre between the surface and v, alternating colours. */
function rungs(ctx, x, n, s) {
  for (let i = 1; i <= n; i++) {
    ctx.fillStyle = RUNG[i & 1];
    rect(ctx, x, toY(s * i) - 2, 12, 4);
  }
}

function drawTether(g, ctx) {
  const q = g.q;
  const geo = g.geo;
  const ax = geo[0];
  const ay = geo[1];
  const bx = geo[2];
  const by = geo[3];
  const dx = geo[6];
  const dy = geo[7];
  const Lb = g.labels;
  if (g.tier >= 1) {
    // Distances from the axis to each beacon, offset so overlap stays visible.
    const cx = geo[4];
    const cy = geo[5];
    const ox = dy !== 0 ? 10 : 0;
    const oy = dx !== 0 ? 10 : 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#7bdc8f";
    ctx.beginPath();
    line(ctx, cx - ox, cy - oy, ax - ox, ay - oy);
    ctx.stroke();
    ctx.strokeStyle = "#ff9f6b";
    ctx.beginPath();
    line(ctx, cx + ox, cy + oy, bx + ox, by + oy);
    ctx.stroke();
    ctx.font = "700 15px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#7bdc8f";
    text(ctx, Lb.segA, ((cx + ax) / 2 - ox * 2.4) | 0, ((cy + ay) / 2 - oy * 1.6) | 0);
    ctx.fillStyle = "#ff9f6b";
    text(ctx, Lb.segB, ((cx + bx) / 2 + ox * 2.4) | 0, ((cy + by) / 2 + oy * 2.4) | 0);
  }
  if (g.tier >= 2) {
    // Unit links laid one at a time from A toward B (no count printed: the student counts).
    const n = g.s[I_LINKS];
    ctx.lineWidth = 6;
    for (let k = 0; k < n; k++) {
      const end = k + 1 > q.distance ? q.distance : k + 1;
      ctx.strokeStyle = RUNG[k & 1];
      ctx.beginPath();
      line(ctx, ax + dx * k * UNIT, ay + dy * k * UNIT, (ax + dx * end * UNIT) | 0, (ay + dy * end * UNIT) | 0);
      ctx.stroke();
    }
  }
  const len = g.len;
  const f = g.springs.pos[S_CABLE];
  ctx.lineWidth = 3;
  if (g.s[I_FIRED]) {
    const D = q.distance;
    if (len < D) {
      const r = len * UNIT * f;
      ctx.strokeStyle = "#f2b45a";
      ctx.beginPath();
      const tx = (ax + dx * r) | 0;
      const ty = (ay + dy * r) | 0;
      line(ctx, ax, ay, tx, ty);
      ctx.stroke();
      ctx.fillStyle = "#ff6b6b";
      dot(ctx, tx, ty, 5);
    } else {
      const ex = ax + dx * D * UNIT * f;
      const ey = ay + dy * D * UNIT * f;
      const sag = (len - D) * UNIT * 0.6 * f;
      ctx.strokeStyle = CABLE[len === D ? 1 : 0];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(
        ((ax + ex) / 2 + (dy !== 0 ? sag : 0)) | 0,
        ((ay + ey) / 2 + (dx !== 0 ? sag : 0)) | 0,
        ex | 0,
        ey | 0,
      );
      ctx.stroke();
    }
  } else {
    // Coiled on the reel at A until fired.
    ctx.strokeStyle = "#f2b45a";
    ring(ctx, ax, ay, (9 + (len > 20 ? 20 : len) * 0.7) | 0);
    ctx.stroke();
  }
  beacon(ctx, ax, ay, "A");
  beacon(ctx, bx, by, "B");
}

function beacon(ctx, x, y, label) {
  ctx.fillStyle = "#ff6b6b";
  dot(ctx, x, y, 7);
  ctx.strokeStyle = "#ffd1d1";
  ctx.lineWidth = 2;
  ring(ctx, x, y, 11);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  text(ctx, label, x, y - 16);
}

function drawMirror(g, ctx) {
  const geo = g.geo;
  alphaLevel(ctx, 9);
  ctx.fillStyle = "#46c2b8";
  if (g.q.axis === "x") rect(ctx, MAP_X0, OY - 4, MAP_X1 - MAP_X0, 8);
  else rect(ctx, OX - 4, MAP_Y0, 8, MAP_Y1 - MAP_Y0);
  ctx.globalAlpha = 1;
  const x = geo[0];
  const y = geo[1];
  if (g.tier >= 1) {
    projections(g, ctx);
    ctx.strokeStyle = "#ff9f6b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    line(ctx, x, y, geo[4], geo[5]);
    ctx.stroke();
    ctx.fillStyle = "#ff9f6b";
    ctx.font = "700 15px system-ui";
    ctx.textAlign = "left";
    text(ctx, g.labels.mDist, ((x + geo[4]) / 2 + 8) | 0, ((y + geo[5]) / 2 - 6) | 0);
  }
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 10);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 15px system-ui";
  ctx.textAlign = "center";
  text(ctx, "P", x, y - 14);
}

// Sub outline in local coordinates (x right, y down): hull, tower, windows.
const HULL = [-24, -9, 24, -9, 24, 9, -24, 9];
const TOWER = [-3, -17, 11, -17, 11, -7, -3, -7];

/** Closed polygon of 4 local points rotated by the sub's pitch about (x, y). */
function quad(ctx, g, pts, x, y) {
  const cs = g.f[F_COS];
  const sn = g.f[F_SIN];
  ctx.beginPath();
  for (let i = 0; i < 8; i += 2) {
    const lx = pts[i];
    const ly = pts[i + 1];
    const px = (x + lx * cs - ly * sn) | 0;
    const py = (y + lx * sn + ly * cs) | 0;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSub(g, ctx) {
  const sc = g.scr;
  const x = sc[C_SUBX];
  const y = sc[C_SUBY];
  const by = sc[C_BOBY];
  ctx.fillStyle = "#f2b45a";
  quad(ctx, g, HULL, x, by);
  ctx.fill();
  quad(ctx, g, TOWER, x, by);
  ctx.fill();
  ctx.fillStyle = "#04201d";
  dot(ctx, sc[C_WIN], sc[C_WIN + 1], 3);
  dot(ctx, sc[C_WIN + 2], sc[C_WIN + 3], 3);
  ctx.strokeStyle = "#c9d4ea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  line(ctx, sc[C_PROP], sc[C_PROP + 1], sc[C_PROP + 2], sc[C_PROP + 3]);
  ctx.stroke();
  // The exact coordinate the sub occupies.
  ctx.fillStyle = "#ffffff";
  dot(ctx, x, y, 3);
}

function drawPing(g, ctx) {
  if (g.s[I_PINGON] === 0) return;
  const sc = g.scr;
  alphaLevel(ctx, sc[C_PINGA]);
  ctx.strokeStyle = PING[g.s[I_PINGOK]];
  ctx.lineWidth = 3;
  ring(ctx, sc[C_SUBX], sc[C_SUBY], sc[C_PINGR]);
  ctx.stroke();
  ring(ctx, sc[C_SUBX], sc[C_SUBY], sc[C_PINGR2]);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Diegetic instrument panel: the student's own settings, never the answer. */
function drawPanel(g, ctx) {
  const Lb = g.labels;
  const sp = g.springs;
  ctx.textAlign = "center";
  ctx.fillStyle = "#46c2b8";
  ctx.font = "700 22px system-ui";
  text(ctx, Lb.mode, PX, 82);
  ctx.fillStyle = "#e8eefc";
  ctx.font = "700 18px system-ui";
  text(ctx, Lb.p1, PX, 130);
  const m = g.m;
  if (m === M_NAV || m === M_MIRROR) {
    // x thrust bar (east +) and y ballast column (up +).
    ctx.fillStyle = "#1c2a45";
    rect(ctx, PX - 150, 150, 300, 14);
    rect(ctx, PX - 7, 230, 14, 240);
    ctx.fillStyle = "#ffd166";
    const tx = (sp.pos[S_TX] * 15) | 0;
    rect(ctx, tx < 0 ? PX + tx : PX, 150, tx < 0 ? -tx : tx, 14);
    const ty = (sp.pos[S_TY] * 12) | 0;
    ctx.fillStyle = "#8fc7ff";
    rect(ctx, PX - 7, ty > 0 ? 350 - ty : 350, 14, ty < 0 ? -ty : ty);
    ctx.fillStyle = "#e8eefc";
    rect(ctx, PX - 1, 146, 2, 22);
    rect(ctx, PX - 12, 349, 24, 2);
    text(ctx, Lb.p2, PX, 210);
  } else if (m === M_HULL) {
    ctx.drawImage(g.layers.gauge, 0, 0, W, H);
    const q = g.q;
    if (q.variant === "match") {
      // The drone's (or buoy's) strain, marked on the gauge as the reference.
      const k = q.given < 0 ? -q.given : q.given;
      const a = PI + (k / 10) * PI;
      ctx.fillStyle = "#ffd166";
      dot(ctx, (GX + Math.cos(a) * (GR + 14)) | 0, (GY + Math.sin(a) * (GR + 14)) | 0, 6);
    }
    let v = sp.pos[S_GAUGE];
    if (v > 10.5) v = 10.5;
    if (v < 0) v = 0;
    const a = PI + (v / 10) * PI;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    line(ctx, GX, GY, (GX + Math.cos(a) * (GR - 22)) | 0, (GY + Math.sin(a) * (GR - 22)) | 0);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    dot(ctx, GX, GY, 8);
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 18px system-ui";
    text(ctx, Lb.strain, PX, 400);
  } else {
    // Tether reel turns with the dial.
    const a = sp.pos[S_TX] * 0.5;
    ctx.strokeStyle = "#a9b6d3";
    ctx.lineWidth = 6;
    ring(ctx, PX, 300, 80);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const r = a + i * SPOKE;
      line(ctx, PX, 300, (PX + Math.cos(r) * 78) | 0, (300 + Math.sin(r) * 78) | 0);
    }
    ctx.stroke();
    ctx.fillStyle = "#f2b45a";
    dot(ctx, PX, 300, 14);
  }
}

/**
 * Fixed-step layout: the sub's moving screen points as integers. One function,
 * Math builtins only, so no computed double ever crosses a call.
 */
export function layout(g) {
  const sp = g.springs;
  const sc = g.scr;
  const f = g.f;
  const t = f[F_T];
  const x = OX + sp.pos[S_X] * UNIT;
  const y = OY - sp.pos[S_Y] * UNIT;
  sc[C_SUBX] = x | 0;
  sc[C_SUBY] = y | 0;
  const by = y + Math.sin(t * 2) * 1.5;
  sc[C_BOBY] = by | 0;
  let tilt = -sp.vel[S_Y] * 0.03;
  if (tilt > 0.35) tilt = 0.35;
  if (tilt < -0.35) tilt = -0.35;
  const cs = Math.cos(tilt);
  const sn = Math.sin(tilt);
  f[F_COS] = cs;
  f[F_SIN] = sn;
  sc[C_WIN] = (x + 14 * cs) | 0;
  sc[C_WIN + 1] = (by + 14 * sn) | 0;
  sc[C_WIN + 2] = (x + 4 * cs) | 0;
  sc[C_WIN + 3] = (by + 4 * sn) | 0;
  const b = Math.cos(t * 14) * 9;
  sc[C_PROP] = (x - 28 * cs - b * sn) | 0;
  sc[C_PROP + 1] = (by - 28 * sn + b * cs) | 0;
  sc[C_PROP + 2] = (x - 28 * cs + b * sn) | 0;
  sc[C_PROP + 3] = (by - 28 * sn - b * cs) | 0;
  const age = f[F_PING];
  sc[C_PINGR] = (8 + age * 120) | 0;
  sc[C_PINGR2] = (8 + age * 60) | 0;
  sc[C_PINGA] = ((1 - age / 1.4) * 20 + 0.5) | 0;
}
