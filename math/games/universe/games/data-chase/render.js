// The Data Chase — drawing. Reads the world, never writes it.
// Meridian at dusk: people to interview along the street (a "?" until you ask,
// their value after), the newsroom desks, and boards that draw the student's
// own histogram and box plots, so a wrong choice is a picture that disagrees
// with the dots underneath it.

import {
  drawOri,
  drawWren,
  glow,
  label,
  PAL,
  plate,
  rr,
  shadow,
  silhouette,
  sky,
  tile,
} from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { dataFor, FLOOR } from "./levels.js";
import { histogram, num } from "./math.js";
import { deskOpen, sourceX } from "./rules.js";

let skyline;
let near;

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  if (!skyline) {
    skyline = silhouette(
      640,
      260,
      "#1d2c4c",
      16,
      (i) => 0.3 + ((i * 41) % 13) / 20,
      "rgba(242,184,75,0.35)",
    );
    near = silhouette(
      520,
      200,
      "#24375e",
      12,
      (i) => 0.25 + ((i * 29) % 9) / 14,
      "rgba(111,227,216,0.25)",
    );
  }
  sky(ctx, W, H, "#16213e", "#a3586a", "rgba(242,184,75,0.3)");
  if (lowfx) return;
  tile(ctx, skyline, cam.parallax(0.2), 180, W);
  tile(ctx, near, cam.parallax(0.45), 260, W);
}

const HUE = {
  student: "#5f8368",
  worker: "#34507e",
  driver: "#a85a3c",
  okafor: "#6b5a8a",
  north: "#2f6f6a",
  south: "#a85a3c",
};

function person(ctx, s, x, y, t) {
  const bob = Math.sin(t * 2.4 + s.phase) * 1.5;
  shadow(ctx, x, y, 14, 0.3);
  ctx.fillStyle = HUE[s.who] || "#5f8368";
  rr(ctx, x - 12, y - 40 + bob, 24, 30, 8);
  ctx.fill();
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.arc(x, y - 50 + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2f45";
  ctx.fillRect(x - 6, y - 10 + bob, 4, 10);
  ctx.fillRect(x + 2, y - 10 + bob, 4, 10);
  // Speech bubble: "?" until asked, then the value.
  const text = s.got ? String(s.v) : "?";
  ctx.fillStyle = s.got ? PAL.gold : PAL.cream;
  rr(ctx, x - 18, y - 92 + bob, 36, 26, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 66 + bob);
  ctx.lineTo(x + 4, y - 66 + bob);
  ctx.lineTo(x, y - 60 + bob);
  ctx.fill();
  label(ctx, text, x, y - 79 + bob, 14, "#0d1b2e");
}

function desk(ctx, d, x, open) {
  ctx.fillStyle = "#3a2c22";
  rr(ctx, x - 50, FLOOR - 50, 100, 50, 6);
  ctx.fill();
  ctx.fillStyle = "#0d1b2e";
  rr(ctx, x - 26, FLOOR - 92, 52, 38, 4);
  ctx.fill();
  ctx.fillStyle = d.done ? PAL.ok : open ? PAL.tealGlow : "#3a4565";
  ctx.fillRect(x - 22, FLOOR - 88, 44, 30);
}

/** A board above a desk: x-axis with ticks over [lo, hi], then the student's chart. */
function board(ctx, x, y, w, h, lo, hi) {
  plate(ctx, x, y, w, h, PAL.navy3);
  const ax = (v) => x + 20 + ((v - lo) / (hi - lo)) * (w - 40);
  ctx.fillStyle = PAL.muted;
  ctx.fillRect(x + 20, y + h - 26, w - 40, 2);
  const step = hi - lo > 40 ? 10 : 5;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    ctx.fillRect(ax(v) - 1, y + h - 30, 2, 8);
    label(ctx, String(v), ax(v), y + h - 12, 10, PAL.muted, 400);
  }
  return ax;
}

function dots(ctx, values, ax, base, color) {
  const seen = new Map();
  for (const v of values) {
    const k = seen.get(v) || 0;
    seen.set(v, k + 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ax(v), base - 6 - k * 9, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function boxPlot(ctx, five, ax, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax(five.min), y);
  ctx.lineTo(ax(five.q1), y);
  ctx.moveTo(ax(five.q3), y);
  ctx.lineTo(ax(five.max), y);
  ctx.stroke();
  ctx.strokeRect(ax(five.q1), y - 12, ax(five.q3) - ax(five.q1), 24);
  ctx.beginPath();
  ctx.moveTo(ax(five.median), y - 12);
  ctx.lineTo(ax(five.median), y + 12);
  for (const v of [five.min, five.max]) {
    ctx.moveTo(ax(v), y - 7);
    ctx.lineTo(ax(v), y + 7);
  }
  ctx.stroke();
}

export function draw(ctx, w, t, view) {
  ctx.fillStyle = "#2a3048";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(0, FLOOR, w.w, 3);
  for (const s of w.solids)
    if (s.kind === "ledge") {
      ctx.fillStyle = "#3a4565";
      rr(ctx, s.x, s.y, s.w, s.h, 4);
      ctx.fill();
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(s.x + 6, s.y, s.w - 12, 3);
    }
  for (const s of w.sources) person(ctx, s, sourceX(s, w.tick), s.y, t);
  for (const d of w.desks) {
    if (d.kind === "start") continue;
    desk(ctx, d, d.x, deskOpen(w, d));
    label(ctx, view.deskName(d), d.x, FLOOR - 106, 12, PAL.cream);
    // The student's own chart, drawn above the desk once they have made one.
    if (d.kind === "histogram" && d.answer) {
      const data = dataFor(w, d);
      const bins = histogram(data, d.answer.width);
      const lo = bins[0].from;
      const hi = bins.at(-1).to;
      const ax = board(ctx, d.x - 170, 170, 340, 170, lo, hi);
      const max = Math.max(...bins.map((b) => b.n));
      for (const b of bins) {
        const h = (b.n / max) * 100;
        ctx.fillStyle = b.from === d.answer.from ? PAL.gold : PAL.teal;
        ctx.fillRect(ax(b.from) + 1, 170 + 144 - h, ax(b.to) - ax(b.from) - 2, h);
        label(ctx, String(b.n), (ax(b.from) + ax(b.to)) / 2, 170 + 134 - h, 11, PAL.cream);
      }
    }
    if (d.kind === "boxplot" && d.answer) {
      const data = dataFor(w, d);
      const lo = Math.min(...data, d.answer.min) - 2;
      const hi = Math.max(...data, d.answer.max) + 2;
      const ax = board(ctx, d.x - 150, 150, 300, 180, lo, hi);
      dots(ctx, data, ax, 150 + 150, PAL.cream);
      boxPlot(ctx, d.answer, ax, 210, d.done ? PAL.ok : PAL.terra);
    }
    if (d.kind === "headline" && d.answer) {
      plate(ctx, d.x - 170, 180, 340, 120, d.done ? PAL.ok : PAL.terra);
      label(ctx, view.factcheck(d.answer), d.x, 220, 14, PAL.cream);
      const data = dataFor(w, d);
      const ax = (v) => d.x - 150 + ((v - 10) / 90) * 300;
      dots(ctx, data, ax, 280, PAL.cream);
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax(d.answer.value), 240);
      ctx.lineTo(ax(d.answer.value), 290);
      ctx.stroke();
    }
  }
  const p = w.p;
  shadow(ctx, p.x + p.w / 2, p.y + p.h, 16, p.ground ? 0.35 : 0.15);
  drawWren(ctx, {
    x: p.x + p.w / 2,
    y: p.y + p.h,
    face: p.face,
    vx: p.vx,
    vy: p.vy,
    ground: p.ground,
    dash: p.dashT,
    landed: p.landed,
    t,
    acting: view.acting,
  });
  drawOri(ctx, {
    x: p.x - 30 * p.face + 10,
    y: p.y - 30,
    face: p.face,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
  if (w.done) glow(ctx, p.x, p.y, 120, PAL.gold, 0.2);
}

/** Screen space: the reporter's notebook, a live dot plot of everything collected. */
export function drawOverlay(ctx, w, words) {
  if (!w.notebook.length && !w.sources.length) return;
  const x = W - 300;
  const y = 70;
  plate(ctx, x, y, 286, 96, PAL.gold);
  label(
    ctx,
    `${words.notebook}: ${w.notebook.length} / ${w.sources.length}`,
    x + 143,
    y + 14,
    12,
    PAL.muted,
  );
  if (!w.notebook.length) return;
  const vals = w.notebook.map((n) => n.v);
  const lo = Math.min(...vals) - 1;
  const hi = Math.max(...vals) + 1;
  const ax = (v) => x + 16 + ((v - lo) / Math.max(1, hi - lo)) * 254;
  ctx.fillStyle = PAL.muted;
  ctx.fillRect(x + 16, y + 78, 254, 2);
  label(ctx, num(lo + 1), x + 22, y + 88, 9, PAL.muted, 400);
  label(ctx, num(hi - 1), x + 264, y + 88, 9, PAL.muted, 400);
  const seen = new Map();
  for (const n of w.notebook) {
    const k = seen.get(n.v) || 0;
    seen.set(n.v, k + 1);
    ctx.fillStyle = HUE[n.who] ? (n.who === "south" ? PAL.terra : PAL.tealGlow) : PAL.tealGlow;
    ctx.beginPath();
    ctx.arc(ax(n.v), y + 72 - k * 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
