// The Final Reality — drawing. Reads the world, never writes it.
// The Unraveling Engine hangs over the arena: five turning shield rings around
// a core, one per system from the year. Each falls when its console is set
// right; the arena calms as the Engine unravels.

import { drawOri, drawWren, glow, label, PAL, plate, rr, shadow, sky } from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { FLOOR } from "./levels.js";
import { current } from "./rules.js";

const RING = [PAL.gold, PAL.tealGlow, PAL.terra, PAL.sage, "#9fb4ff"];
const GLYPH = { structure: "▣", power: "ƒ", transport: "⇄", barrier: "≤", shutdown: "=" };

export function drawBackdrop(ctx, cam, w, t) {
  const calm = w.stage / w.stages.length;
  sky(
    ctx,
    W,
    H,
    "#070b16",
    calm > 0.99 ? "#1f4a46" : "#2a1630",
    `rgba(${calm > 0.99 ? "111,227,216" : "217,115,78"},${0.25 - calm * 0.1})`,
  );
  // Distant fractured reality: slow drifting shards.
  for (let i = 0; i < 14; i++) {
    const x = ((i * 137 + t * (8 + (i % 3) * 4)) % (W + 80)) - 40;
    const y = 40 + ((i * 53) % 260);
    ctx.fillStyle = `rgba(169,182,211,${0.06 + (i % 4) * 0.03})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y + 6);
    ctx.lineTo(x + 6, y + 22);
    ctx.fill();
  }
}

function engine(ctx, w, t) {
  const cx = 720;
  const cy = 215;
  const calm = w.done;
  glow(ctx, cx, cy, 220, calm ? "rgba(111,227,216,0.9)" : "rgba(217,115,78,0.9)", calm ? 0.2 : 0.3);
  w.stages.forEach((s, i) => {
    const r = 54 + i * 22;
    const spin = t * (0.5 + i * 0.15) * (i % 2 ? -1 : 1);
    ctx.globalAlpha = s.done ? 0.12 : 1;
    ctx.strokeStyle = RING[i];
    ctx.lineWidth = s.done ? 2 : 8;
    ctx.setLineDash(s.done ? [4, 10] : [30, 10]);
    ctx.lineDashOffset = spin * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!s.done) {
      const a = spin;
      label(ctx, GLYPH[s.kind], cx + Math.cos(a) * r, cy + Math.sin(a) * r, 14, "#0d1b2e");
    }
    ctx.globalAlpha = 1;
  });
  // Core.
  ctx.fillStyle = calm ? PAL.tealGlow : PAL.terra;
  ctx.beginPath();
  ctx.arc(cx, cy, 28 + Math.sin(t * 4) * (calm ? 0 : 3), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d1b2e";
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 4, 4, 0, Math.PI * 2);
  ctx.arc(cx + 8, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  // Column down to the arena floor.
  ctx.fillStyle = "#24304a";
  ctx.fillRect(cx - 14, cy + 30, 28, FLOOR - cy - 30);
}

function consolePad(ctx, s, active, t, words) {
  const [x, y] = s.at;
  ctx.fillStyle = "#24304a";
  rr(ctx, x - 26, y - 60, 52, 60, 8);
  ctx.fill();
  ctx.fillStyle = s.done ? PAL.ok : active ? RING[s.i] : "#3a4565";
  ctx.fillRect(x - 20, y - 54, 40, 26);
  label(ctx, GLYPH[s.kind], x, y - 41, 16, "#0d1b2e");
  if (active) {
    glow(ctx, x, y - 70, 50, RING[s.i], 0.35 + 0.15 * Math.sin(t * 4));
    label(ctx, words[s.kind], x, y - 82, 12, PAL.cream);
  }
}

export function draw(ctx, w, t, view) {
  ctx.fillStyle = "#151c2e";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = w.done ? PAL.tealGlow : PAL.terra;
  ctx.fillRect(0, FLOOR, w.w, 3);
  engine(ctx, w, t);
  for (const s of w.solids)
    if (s.kind === "ledge") {
      ctx.fillStyle = "#2c3550";
      rr(ctx, s.x, s.y, s.w, s.h, 4);
      ctx.fill();
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(s.x + 6, s.y, s.w - 12, 3);
    }
  const cur = current(w);
  for (const s of w.stages) consolePad(ctx, s, cur && cur.i === s.i, t, view.words);
  // Pulses: a warning glow at the column base, then a wave racing out both ways.
  const P = w.pulse;
  if (P.period && P.t > P.period - 70)
    glow(ctx, 720, FLOOR - 10, 80, PAL.terra, 0.3 + 0.3 * Math.sin(t * 20));
  if (P.x >= 0)
    for (const dir of [-1, 1]) {
      const x = 720 + dir * P.x;
      glow(ctx, x, FLOOR - 12, 36, PAL.terra, 0.7);
      ctx.fillStyle = PAL.terra;
      rr(ctx, x - 8, FLOOR - 26, 16, 26, 6);
      ctx.fill();
    }
  const p = w.p;
  shadow(ctx, p.x + p.w / 2, p.y + p.h, 16, p.ground ? 0.35 : 0.15);
  if (w.stun > 0 && Math.floor(t * 20) % 2 === 0) ctx.globalAlpha = 0.5;
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
  ctx.globalAlpha = 1;
  drawOri(ctx, {
    x: p.x - 30 * p.face + 10,
    y: p.y - 30,
    face: p.face,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
}
