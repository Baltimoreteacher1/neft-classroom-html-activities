// Inequality Invasion — drawing. Reads the world, never writes it.
// Lantern Valley at night: glimmers (gentle light creatures, each carrying a
// number) drift toward the garden. Every gate shows its rule twice: as an
// inequality and as a number-line graph drawn from that same rule.

import {
  drawOri,
  drawWren,
  glow,
  label,
  layer,
  PAL,
  plate,
  rr,
  shadow,
  silhouette,
  sky,
  tile,
} from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { FLOOR, PATH_Y } from "./levels.js";
import { ruleText } from "./math.js";
import { GARDEN } from "./rules.js";

let hills;
let stars;

function assets() {
  if (hills) return;
  hills = silhouette(800, 200, "#16294a", 10, (i) => 0.4 + 0.3 * Math.sin(i * 1.3) ** 2);
  stars = layer(W, 260, (g) => {
    let s = 7;
    for (let i = 0; i < 90; i++) {
      s = (s * 16807) % 2147483647;
      const x = s % W;
      s = (s * 16807) % 2147483647;
      const y = s % 260;
      g.fillStyle = `rgba(244,236,216,${0.25 + (i % 5) * 0.12})`;
      g.fillRect(x, y, 2, 2);
    }
  });
}

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  assets();
  sky(ctx, W, H, "#060b18", "#14223e", "rgba(111,227,216,0.12)");
  if (lowfx) return;
  ctx.drawImage(stars, 0, 0);
  tile(ctx, hills, cam.parallax(0.25), 250, W);
}

/** A number-line graph of one rule: open or closed circle at k, ray in the rule's direction. */
function numberLine(ctx, cx, y, rule, hot) {
  const span = 6;
  const unit = 18;
  const x0 = cx - span * unit;
  plate(ctx, x0 - 14, y - 26, span * unit * 2 + 28, 52, hot ? PAL.gold : PAL.navy3);
  ctx.strokeStyle = PAL.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + span * unit * 2, y);
  ctx.stroke();
  for (let i = -span; i <= span; i++) {
    const x = cx + i * unit;
    ctx.fillStyle = "rgba(244,236,216,0.7)";
    ctx.fillRect(x - 1, y - 4, 2, 8);
    if (i % 2 === 0) label(ctx, String(rule.k + i), x, y + 14, 9, PAL.muted, 400);
  }
  const up = rule.sym === ">" || rule.sym === "≥";
  ctx.strokeStyle = PAL.tealGlow;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(up ? x0 + span * unit * 2 : x0, y);
  ctx.stroke();
  ctx.fillStyle = PAL.tealGlow;
  ctx.beginPath();
  const tip = up ? x0 + span * unit * 2 : x0;
  ctx.moveTo(tip + (up ? 8 : -8), y);
  ctx.lineTo(tip, y - 7);
  ctx.lineTo(tip, y + 7);
  ctx.fill();
  const closed = rule.sym === "≤" || rule.sym === "≥";
  ctx.beginPath();
  ctx.arc(cx, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = closed ? PAL.tealGlow : "#0d1b2e";
  ctx.fill();
  ctx.strokeStyle = PAL.tealGlow;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function glimmer(ctx, g, y, t, ghost) {
  const bob = Math.sin(t * 3 + g.seed) * 5;
  const x = g.x;
  const yy = y - 30 + bob + (g.drop || 0);
  ctx.globalAlpha = ghost ? 0.5 : 1;
  glow(
    ctx,
    x,
    yy,
    34,
    g.state === "side" || g.state === "falling" ? "rgba(217,115,78,0.9)" : "rgba(111,227,216,0.9)",
    0.55,
  );
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.ellipse(x, yy, 15, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d1b2e";
  ctx.beginPath();
  ctx.arc(x - 5, yy - 4, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, yy - 4, 2, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, String(g.v), x, yy + 6, 13, "#0d1b2e");
  ctx.globalAlpha = 1;
}

function room(ctx, w, r, t, view) {
  const ox = r.x0;
  // Path and the side stream.
  ctx.fillStyle = "#24304a";
  rr(ctx, ox + 120, PATH_Y, 820, 16, 8);
  ctx.fill();
  ctx.fillStyle = "#1a4f6e";
  rr(ctx, ox + 420, PATH_Y + 64, 520, 22, 10);
  ctx.fill();
  label(ctx, view.words.stream, ox + 680, PATH_Y + 104, 11, PAL.muted);
  // Mission stone.
  plate(ctx, ox + 160, 64, 600, 62, PAL.gold);
  label(ctx, view.words.mission, ox + 460, 80, 12, PAL.muted);
  label(ctx, view.mission(r), ox + 460, 104, 18, PAL.cream);
  // Gates: arch, rule plaque, and its number line.
  r.gatesX.forEach((gx, i) => {
    const rule = r.rules[i];
    ctx.strokeStyle = "#7d8ca8";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(gx - 34, FLOOR);
    ctx.lineTo(gx - 34, PATH_Y - 80);
    ctx.arc(gx, PATH_Y - 80, 34, Math.PI, 0);
    ctx.lineTo(gx + 34, FLOOR);
    ctx.stroke();
    ctx.fillStyle = `rgba(111,227,216,${0.25 + 0.1 * Math.sin(t * 4 + i)})`;
    ctx.fillRect(gx - 28, PATH_Y - 80, 56, 90);
    plate(ctx, gx - 50, PATH_Y - 158, 100, 32, PAL.tealGlow);
    label(ctx, ruleText(rule), gx, PATH_Y - 142, 16, PAL.cream);
    numberLine(ctx, gx, PATH_Y - 210 - i * 62, rule, view.hot === `${r.i}:${i}`);
  });
  // Lever.
  const lx = ox + 100;
  ctx.fillStyle = "#24304a";
  rr(ctx, lx - 18, FLOOR - 50, 36, 50, 6);
  ctx.fill();
  ctx.strokeStyle = r.run ? PAL.ok : PAL.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(lx, FLOOR - 44);
  ctx.lineTo(lx + (r.run ? 22 : -22), FLOOR - 90);
  ctx.stroke();
  label(ctx, view.words.release, lx, FLOOR - 110, 12, PAL.cream);
  // Garden.
  const gx = ox + GARDEN + 40;
  const lit = (r.run?.glimmers || r.last || []).filter((g) => g.state === "garden").length;
  for (let i = 0; i < 6; i++) {
    const x = gx + (i % 3) * 30 - 30;
    const y = FLOOR - 30 - Math.floor(i / 3) * 40;
    ctx.fillStyle = "#3b6a52";
    ctx.fillRect(x - 2, y, 4, 30);
    glow(ctx, x, y - 8, 22, i < lit ? PAL.gold : "rgba(169,182,211,0.5)", i < lit ? 0.8 : 0.2);
    ctx.fillStyle = i < lit ? PAL.gold : "#3a4565";
    ctx.beginPath();
    ctx.arc(x, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, view.words.garden, gx, FLOOR - 120, 12, PAL.cream);
  const list = r.run ? r.run.glimmers : r.last || [];
  for (const g of list) if (g.state !== "wait") glimmer(ctx, g, PATH_Y, t, !r.run);
  // Gate between rooms.
  const gate = w.solids[r.gate];
  if (!gate.open) {
    ctx.fillStyle = "#2c3550";
    ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
    ctx.fillStyle = PAL.terra;
    for (let y = gate.y + 20; y < gate.y + gate.h; y += 40)
      ctx.fillRect(gate.x + 4, y, gate.w - 8, 5);
  } else glow(ctx, gate.x + 13, FLOOR - 120, 70, PAL.ok, 0.3);
}

export function draw(ctx, w, t, view) {
  ctx.fillStyle = "#101a2e";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = "#3b6a52";
  ctx.fillRect(0, FLOOR, w.w, 4);
  for (const r of w.rooms) room(ctx, w, r, t, view);
  const e = w.exit;
  glow(ctx, e.x + e.w / 2, e.y + e.h / 2, 90, PAL.gold, 0.3);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 4;
  rr(ctx, e.x + 20, e.y + 10, e.w - 40, e.h - 10, 14);
  ctx.stroke();
  label(ctx, "➜", e.x + e.w / 2, e.y + e.h / 2 + 6, 28, PAL.gold);
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
}
