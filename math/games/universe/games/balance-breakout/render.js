// Balance Breakout — drawing. Reads the world, never writes it.
// The Equilibrium Vault: brass, slate and lamplight. The great balance is the
// equation: its pans are the two sides, and the beam's angle is the truth.

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
  sky,
} from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { DOOR_DX, FLOOR, PAN_DX, TOOL_DX } from "./levels.js";
import { equationText } from "./math.js";
import { isLevel, panY } from "./rules.js";

let wall;
let stone;

function assets() {
  if (wall) return;
  wall = layer(240, 420, (g) => {
    g.fillStyle = "#1a2236";
    g.fillRect(0, 0, 240, 420);
    g.strokeStyle = "rgba(242,184,75,0.08)";
    g.lineWidth = 2;
    for (let y = 30; y < 420; y += 60) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(240, y);
      g.stroke();
    }
    g.fillStyle = "#222c44";
    g.fillRect(100, 0, 40, 420);
    g.fillStyle = "rgba(242,184,75,0.18)";
    for (let y = 40; y < 420; y += 60) g.fillRect(112, y, 16, 6);
  });
  stone = layer(80, 40, (g) => {
    g.fillStyle = "#3a3f52";
    g.fillRect(0, 0, 80, 40);
    g.fillStyle = "#33384a";
    g.fillRect(0, 20, 40, 20);
    g.fillRect(40, 0, 40, 20);
    g.fillStyle = "rgba(255,255,255,0.05)";
    g.fillRect(0, 0, 80, 2);
  });
}

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  assets();
  sky(ctx, W, H, "#0d1424", "#1a2236");
  if (lowfx) return;
  const off = cam.parallax(0.4) % 240;
  for (let x = off - 240; x < W; x += 240) ctx.drawImage(wall, Math.round(x), 60);
  // Hanging lamps that sway a little.
  for (let i = 0; i < 6; i++) {
    const x = ((((i * 220 + cam.parallax(0.55)) % (W + 220)) + W + 220) % (W + 220)) - 110;
    const sway = Math.sin(t * 0.8 + i) * 4;
    ctx.strokeStyle = "rgba(169,182,211,0.35)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + sway, 70);
    ctx.stroke();
    glow(ctx, x + sway, 78, 70, "rgba(255,206,120,0.9)", 0.35);
    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(x + sway, 78, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** One item, drawn standing on (cx, baseY). Returns its width. */
function item(ctx, it, cx, baseY, t) {
  if (it.k === "x" || it.k === "half") {
    const s = it.k === "half" ? 30 : 40;
    ctx.fillStyle = "#6c8a72";
    rr(ctx, cx - s / 2, baseY - s, s, s, 6);
    ctx.fill();
    ctx.strokeStyle = PAL.cream;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - s / 2 + 5, baseY - s + 5, s - 10, s - 10);
    label(ctx, "x", cx, baseY - s / 2, 18, PAL.cream);
    if (it.k === "half") {
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 21, baseY - 40, 42, 40);
      label(ctx, "½", cx + 20, baseY - 44, 14, PAL.gold);
    }
    return s + 6;
  }
  if (it.k === "b") {
    const bob = Math.sin(t * 2 + it.v) * 4;
    ctx.strokeStyle = PAL.cream;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY - 70 + bob);
    ctx.stroke();
    ctx.fillStyle = PAL.terra;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 92 + bob, 20, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, `−${it.v}`, cx, baseY - 92 + bob, 15, PAL.cream);
    return 34;
  }
  const h = 18 + Math.min(26, it.v * 3);
  const wdt = 26 + Math.min(20, it.v * 2);
  ctx.fillStyle = "#8a6a2c";
  rr(ctx, cx - wdt / 2, baseY - h, wdt, h, 5);
  ctx.fill();
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(cx - wdt / 2, baseY - h, wdt, 4);
  label(ctx, String(it.v), cx, baseY - h / 2 + 2, 15, PAL.cream);
  return wdt + 6;
}

function pan(ctx, cx, y, items, t) {
  const width = Math.max(
    110,
    items.reduce(
      (s, it) => s + (it.k === "b" ? 34 : it.k === "w" ? 32 + Math.min(20, it.v * 2) : 46),
      0,
    ) + 16,
  );
  ctx.strokeStyle = "rgba(201,206,216,0.7)";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#b08a3c";
  rr(ctx, cx - width / 2, y, width, 10, 4);
  ctx.fill();
  let x = cx - width / 2 + 10;
  for (const it of items) {
    const wdt = it.k === "b" ? 34 : it.k === "w" ? 32 + Math.min(20, it.v * 2) : 46;
    item(ctx, it, x + wdt / 2 - 3, y, t);
    x += wdt;
  }
  return width;
}

function balance(ctx, r, t, words, lowfx) {
  const bx = r.bx;
  const pivotY = FLOOR - 250;
  const level = isLevel(r);
  // Pillar.
  ctx.fillStyle = "#2c3550";
  rr(ctx, bx - 18, pivotY, 36, FLOOR - pivotY, 6);
  ctx.fill();
  ctx.fillStyle = "#3a4565";
  rr(ctx, bx - 60, FLOOR - 24, 120, 24, 6);
  ctx.fill();
  // Beam.
  ctx.save();
  ctx.translate(bx, pivotY);
  ctx.rotate(-r.angle);
  ctx.fillStyle = PAL.goldDeep;
  rr(ctx, -PAN_DX - 14, -8, PAN_DX * 2 + 28, 16, 8);
  ctx.fill();
  ctx.restore();
  // Pointer and level mark.
  ctx.strokeStyle = level ? PAL.ok : PAL.terra;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bx, pivotY);
  ctx.lineTo(bx + Math.sin(-r.angle) * 70, pivotY - Math.cos(r.angle) * 70);
  ctx.stroke();
  ctx.fillStyle = PAL.cream;
  ctx.fillRect(bx - 2, pivotY - 84, 4, 10);
  if (level && !lowfx) glow(ctx, bx, pivotY, 50, PAL.ok, 0.3);
  ctx.fillStyle = PAL.gold;
  ctx.beginPath();
  ctx.arc(bx, pivotY, 9, 0, Math.PI * 2);
  ctx.fill();
  // Chains and pans.
  for (const [name, sign, items] of [
    ["left", -1, r.left],
    ["right", 1, r.right],
  ]) {
    const ex = bx + sign * Math.cos(r.angle) * PAN_DX;
    const ey = pivotY - sign * Math.sin(r.angle) * PAN_DX;
    const py = panY(r, name);
    ctx.strokeStyle = "rgba(201,206,216,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 50, py);
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + 50, py);
    ctx.stroke();
    pan(ctx, ex, py, items, t);
  }
  // The equation, written by the balance itself.
  const text = equationText(r.left, r.right);
  const wdt = Math.max(180, text.length * 13 + 40);
  plate(ctx, bx - wdt / 2, pivotY - 150, wdt, 44, level ? PAL.ok : PAL.terra);
  label(ctx, text, bx, pivotY - 128, 22, PAL.cream);
  label(ctx, level ? words.level : words.tipped, bx, pivotY - 92, 12, level ? PAL.ok : PAL.terra);
}

function tool(ctx, kind, x, t, words, r) {
  shadow(ctx, x, FLOOR, 40);
  ctx.fillStyle = "#24406b";
  rr(ctx, x - 36, FLOOR - 64, 72, 64, 8);
  ctx.fill();
  ctx.fillStyle = PAL.sage;
  ctx.fillRect(x - 36, FLOOR - 64, 72, 6);
  const glyph = { crane: "⇅", changer: "8→5+3", divider: "÷", doubler: "×2" }[kind];
  label(ctx, glyph, x, FLOOR - 34, kind === "changer" ? 13 : 24, PAL.gold);
  label(ctx, words[kind], x, FLOOR - 80, 12, PAL.cream);
  if (kind === "crane") {
    // Gantry over both pans.
    ctx.strokeStyle = "rgba(169,182,211,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r.bx - PAN_DX - 60, 120);
    ctx.lineTo(r.bx + PAN_DX + 60, 120);
    ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r.bx + s * PAN_DX, 120);
      ctx.lineTo(r.bx + s * PAN_DX, 150 + Math.sin(t * 2) * 4);
      ctx.stroke();
    }
    if (r.pairs.length)
      label(ctx, `${words.pairs}: ${r.pairs.join(", ")}`, x, FLOOR - 100, 12, PAL.gold);
  }
}

export function draw(ctx, w, t, view) {
  const { words, lowfx } = view;
  for (const s of w.solids) {
    if (s.kind === "floor") {
      ctx.fillStyle = ctx.createPattern(stone, "repeat");
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillRect(0, 0, s.w, s.h);
      ctx.restore();
      ctx.fillStyle = PAL.goldDeep;
      ctx.fillRect(s.x, s.y, s.w, 3);
    } else if (s.kind === "ledge") {
      ctx.fillStyle = "#3a4565";
      rr(ctx, s.x, s.y, s.w, s.h, 4);
      ctx.fill();
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(s.x + 6, s.y, s.w - 12, 3);
    }
  }
  for (const r of w.rooms) {
    balance(ctx, r, t, words, lowfx);
    for (const k of r.tools) tool(ctx, k, r.bx + TOOL_DX[k], t, words, r);
    for (const rack of r.racks) {
      ctx.fillStyle = "#2c3550";
      rr(ctx, rack.x - 60, rack.y - 8, 120, 8, 3);
      ctx.fill();
      let x = rack.x - 50;
      for (const it of rack.items) x += item(ctx, it, x + 16, rack.y - 8, t);
      label(ctx, words.rack, rack.x, rack.y + 14, 11, PAL.muted);
    }
    // The vault door and its reader.
    const g = w.solids[r.gate];
    const dx = r.bx + DOOR_DX;
    ctx.fillStyle = "#2c3550";
    rr(ctx, dx - 56, FLOOR - 200, 40, 70, 6);
    ctx.fill();
    label(
      ctx,
      r.mode === "keypad" ? "#" : "x?",
      dx - 36,
      FLOOR - 165,
      18,
      r.solved ? PAL.ok : PAL.gold,
    );
    if (g.open) {
      if (!lowfx) glow(ctx, g.x + 13, FLOOR - 120, 70, PAL.ok, 0.35);
    } else {
      ctx.fillStyle = "#4a5574";
      ctx.fillRect(g.x, g.y, g.w, g.h);
      for (let y = g.y + 20; y < g.y + g.h; y += 40) {
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(g.x + 13, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const e = w.exit;
  if (!lowfx) glow(ctx, e.x + e.w / 2, e.y + e.h / 2, 90, PAL.gold, 0.3);
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
    acting: view.acting || !!w.carry,
  });
  if (w.carry) item(ctx, w.carry, p.x + p.w / 2, p.y - 6, t);
  drawOri(ctx, {
    x: p.x - 30 * p.face + 10,
    y: p.y - 30,
    face: p.face,
    mood: view.oriMood,
    t,
    talk: view.talk ? 1 : 0,
  });
}
