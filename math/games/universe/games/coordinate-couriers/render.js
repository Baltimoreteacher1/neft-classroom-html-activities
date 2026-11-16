// Coordinate Couriers — drawing. Reads the world, never writes it.
// Meridia from above: the two avenues through the plaza are the axes, with
// their numbers painted on the asphalt; every other street is a grid line.
// The address you are driving to is never marked on the map (reading the grid
// is the skill) unless the student asks for the street sign support.

import { drawOri, glow, label, PAL, rr } from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { N, ROAD, SIZE, toPx, UNIT } from "./levels.js";
import { pointText } from "./math.js";

const ROOF = ["#2f6f6a", "#5f8368", "#a85a3c", "#34507e"];

export function drawBackdrop(ctx) {
  ctx.fillStyle = "#0b1626";
  ctx.fillRect(0, 0, W, H);
}

function streets(ctx, t) {
  // Ground and every street.
  ctx.fillStyle = "#1c2a40";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = "#2b3a52";
  for (let k = -N; k <= N; k++) {
    const { X, Y } = toPx({ x: k, y: k });
    ctx.fillRect(X - ROAD / 2, 0, ROAD, SIZE);
    ctx.fillRect(0, Y - ROAD / 2, SIZE, ROAD);
  }
  // Lane dashes.
  ctx.fillStyle = "rgba(244,236,216,0.18)";
  for (let k = -N; k <= N; k++) {
    if (k === 0) continue;
    const { X, Y } = toPx({ x: k, y: k });
    for (let s = 0; s < SIZE; s += 28) {
      ctx.fillRect(X - 1, s, 2, 12);
      ctx.fillRect(s, Y - 1, 12, 2);
    }
  }
  // The axes: wider, lit, numbered.
  const o = toPx({ x: 0, y: 0 });
  ctx.fillStyle = "#1f6f73";
  ctx.fillRect(o.X - ROAD / 2 - 4, 0, ROAD + 8, SIZE);
  ctx.fillRect(0, o.Y - ROAD / 2 - 4, SIZE, ROAD + 8);
  ctx.fillStyle = PAL.tealGlow;
  ctx.fillRect(o.X - 1.5, 0, 3, SIZE);
  ctx.fillRect(0, o.Y - 1.5, SIZE, 3);
  for (let k = -N; k <= N; k++) {
    if (k === 0) continue;
    const n = k < 0 ? `−${-k}` : String(k);
    const a = toPx({ x: k, y: 0 });
    const b = toPx({ x: 0, y: k });
    label(ctx, n, a.X, a.Y + 30, 15, PAL.cream);
    label(ctx, n, b.X + 30, b.Y, 15, PAL.cream);
  }
  label(ctx, "0", o.X + 26, o.Y + 26, 15, PAL.cream);
  label(ctx, "x", SIZE - 30, o.Y - 26, 20, PAL.gold);
  label(ctx, "y", o.X + 26, 26, 20, PAL.gold);
  // Plaza at the origin.
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(o.X, o.Y, 30 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
  ctx.stroke();
}

function building(ctx, s) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(s.x + 6, s.y + 8, s.w, s.h);
  ctx.fillStyle = ROOF[s.hue];
  rr(ctx, s.x, s.y, s.w, s.h, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(s.x + 8, s.y + 8, s.w - 16, 6);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(s.x + s.w / 2 - 8, s.y + s.h / 2 - 8, 16, 16);
}

function water(ctx, s, t) {
  ctx.fillStyle = "#14506e";
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = "rgba(111,227,216,0.35)";
  ctx.lineWidth = 2;
  const horiz = s.w > s.h;
  for (let i = 0; i < (horiz ? s.w : s.h); i += 46) {
    const k = (i + t * 30) % (horiz ? s.w : s.h);
    ctx.beginPath();
    if (horiz) {
      ctx.moveTo(s.x + k, s.y + s.h / 2 - 6);
      ctx.lineTo(s.x + k + 18, s.y + s.h / 2 - 6);
    } else {
      ctx.moveTo(s.x + s.w / 2 - 6, s.y + k);
      ctx.lineTo(s.x + s.w / 2 - 6, s.y + k + 18);
    }
    ctx.stroke();
  }
}

function car(ctx, x, y, horiz, color) {
  ctx.save();
  ctx.translate(x, y);
  if (!horiz) ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-16, -9, 34, 22);
  ctx.fillStyle = color;
  rr(ctx, -18, -11, 36, 22, 6);
  ctx.fill();
  ctx.fillStyle = "#0d1b2e";
  ctx.fillRect(-6, -8, 14, 16);
  ctx.fillStyle = "#fff4cc";
  ctx.fillRect(14, -9, 4, 5);
  ctx.fillRect(14, 4, 4, 5);
  ctx.restore();
}

/** The courier scooter, seen from above, turned to its heading. */
function scooter(ctx, p, t, warp) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (warp) {
    const k = Math.sin((warp.t / 42) * Math.PI);
    ctx.globalAlpha = 1 - k * 0.85;
    ctx.scale(1 - k * 0.6, 1 - k * 0.6);
  }
  ctx.rotate(p.heading || 0);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-14, -8, 32, 20);
  ctx.fillStyle = PAL.teal;
  rr(ctx, -16, -10, 32, 20, 8);
  ctx.fill();
  ctx.fillStyle = PAL.gold;
  rr(ctx, -14, -8, 13, 16, 3);
  ctx.fill();
  ctx.fillStyle = PAL.navy3;
  ctx.beginPath();
  ctx.arc(6, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.tealGlow;
  ctx.fillRect(9, -3, 4, 6);
  ctx.fillStyle = "#fff4cc";
  ctx.fillRect(15, -2, 3, 4);
  ctx.restore();
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > 2) {
    ctx.strokeStyle = "rgba(242,184,75,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - p.vx * 5, cy - p.vy * 5);
    ctx.stroke();
  }
}

export function draw(ctx, w, t, view) {
  streets(ctx, t);
  for (const s of w.solids) {
    if (s.kind === "building") building(ctx, s);
    else if (s.kind === "water") water(ctx, s, t);
  }
  // Parks are the blocks with no building: a few trees.
  // Cable lines and stations.
  for (const c of w.cables) {
    const a = toPx(c.a);
    const b = toPx(c.b);
    ctx.strokeStyle = c.done ? PAL.ok : "rgba(244,236,216,0.55)";
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.X, a.Y);
    ctx.lineTo(b.X, b.Y);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [p, end] of [
      [a, "A"],
      [b, "B"],
    ]) {
      ctx.fillStyle = "#24406b";
      rr(ctx, p.X - 20, p.Y - 20, 40, 40, 8);
      ctx.fill();
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
      label(ctx, end, p.X, p.Y, 16, PAL.gold);
    }
  }
  if (w.ride) {
    const p = { x: w.p.x + w.p.w / 2, y: w.p.y + w.p.h / 2 };
    ctx.fillStyle = PAL.gold;
    rr(ctx, p.x - 22, p.y - 22, 44, 44, 10);
    ctx.fill();
  }
  // Mirror pads.
  for (const p of w.pads) {
    const c = toPx(p);
    glow(ctx, c.X, c.Y, 34, "rgba(111,227,216,0.9)", 0.35 + 0.15 * Math.sin(t * 3 + p.x));
    ctx.strokeStyle = PAL.tealGlow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.X, c.Y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.X - 10, c.Y);
    ctx.lineTo(c.X + 10, c.Y);
    ctx.moveTo(c.X, c.Y - 10);
    ctx.lineTo(c.X, c.Y + 10);
    ctx.stroke();
  }
  for (const s of w.solids) {
    if (s.kind !== "fence") continue;
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = "#2a1a02";
    const long = Math.max(s.w, s.h);
    for (let i = 0; i < long; i += 16)
      if (s.w > s.h) ctx.fillRect(s.x + i, s.y, 8, s.h);
      else ctx.fillRect(s.x, s.y + i, s.w, 8);
  }
  // Done deliveries get a lit doorstep; the next one shows only when the support is on.
  for (const d of w.deliveries) {
    const c = toPx(d);
    if (d.done) {
      ctx.fillStyle = PAL.ok;
      ctx.beginPath();
      ctx.arc(c.X, c.Y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (view.showTarget) {
    const d = w.deliveries.find((x) => !x.done);
    if (d) {
      const c = toPx(d);
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.X, c.Y, 24 + Math.sin(t * 5) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const c of w.cars) {
    const at = { x: c.from.x + (c.to.x - c.from.x) * c.t, y: c.from.y + (c.to.y - c.from.y) * c.t };
    const px = toPx(at);
    car(ctx, px.X, px.Y, c.from.y === c.to.y, c.dir > 0 ? PAL.terra : PAL.sage);
  }
  scooter(ctx, w.p, t, w.warp);
  drawOri(ctx, {
    x: w.p.x + w.p.w / 2 - 30,
    y: w.p.y - 22,
    face: 1,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
}

/** Screen space: the parcel tag with the address, top right under the tools. */
export function drawOverlay(ctx, w, words) {
  const d = w.deliveries.find((x) => !x.done);
  if (!d) return;
  const x = W - 210;
  const y = 70;
  ctx.fillStyle = "rgba(9,18,34,0.92)";
  rr(ctx, x, y, 196, 66, 10);
  ctx.fill();
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  label(ctx, words.parcel, x + 98, y + 18, 12, PAL.muted);
  label(ctx, pointText(d), x + 98, y + 44, 24, PAL.gold);
}

export { UNIT };
