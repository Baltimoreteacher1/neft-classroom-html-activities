// Expression Factory — drawing the Word Crates arena. Reads the world, never writes it.
// Answer blocks hang over the floor with a card on each; value ledges carry
// numbers; a spring, gears, the truck, and in the last room the Glitch Bot.

import { glow, label, PAL, plate, rr } from "../../runtime/art.js";
import { BLOCK, BOARD_X, FLOOR, LEDGE, SPRING, stepOf, TRUCK_X } from "./arena.js";

import { quizPrompt } from "./quiz.js";

const fill = (ctx, color, x, y, w, h, r) => {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
};

function block(ctx, s, text, t, flash) {
  const bob = Math.sin(t * 2.2 + s.slot) * 3;
  const y = s.y + bob;
  const tint = flash ? (flash.ok ? PAL.ok : PAL.terra) : "#c98a1f";
  glow(ctx, s.x + s.w / 2, y + s.h / 2, 70, tint, flash ? 0.5 : 0.18);
  fill(ctx, "#3a2a14", s.x, y + 4, s.w, s.h, 10);
  fill(ctx, tint, s.x, y, s.w, s.h, 10);
  ctx.strokeStyle = "rgba(42,26,2,0.55)";
  ctx.lineWidth = 3;
  rr(ctx, s.x + 4, y + 4, s.w - 8, s.h - 8, 7);
  ctx.stroke();
  label(ctx, text, s.x + s.w / 2, y + s.h / 2, text.length > 9 ? 14 : 18, "#1a1004");
  label(ctx, "▲", s.x + s.w / 2, s.y + s.h + 16 + Math.abs(Math.sin(t * 4)) * 4, 12, PAL.gold);
}

function ledge(ctx, s, text, t, flash) {
  const tint = flash ? (flash.ok ? PAL.ok : PAL.terra) : PAL.tealGlow;
  fill(ctx, "#24406b", s.x, s.y, s.w, s.h + 8, 6);
  fill(ctx, tint, s.x, s.y, s.w, 5, 3);
  ctx.fillStyle = "#3a2c22";
  ctx.fillRect(s.x + 14, s.y + s.h + 8, 8, FLOOR - s.y - s.h - 8);
  ctx.fillRect(s.x + s.w - 22, s.y + s.h + 8, 8, FLOOR - s.y - s.h - 8);
  label(ctx, text, s.x + s.w / 2, s.y - 22 + Math.sin(t * 3 + s.slot) * 2, 26, PAL.cream);
}

function gear(ctx, g, t) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(t * 2);
  ctx.fillStyle = PAL.gold;
  for (let k = 0; k < 8; k++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -14, 6, 6);
  }
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1d14";
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, g.x, g.y, 26, PAL.gold, 0.25);
}

function bot(ctx, x, y, t, hp, hurt) {
  const sway = Math.sin(t * 1.3) * 80;
  const cx = x + sway;
  const cy = y + Math.sin(t * 2.6) * 10;
  glow(ctx, cx, cy, 120, hurt ? PAL.terra : "#7fd3ff", hurt ? 0.5 : 0.22);
  fill(ctx, hurt ? PAL.terra : "#4b5a78", cx - 70, cy - 46, 140, 92, 22);
  fill(ctx, "#1a2233", cx - 50, cy - 26, 100, 40, 12);
  const blink = Math.sin(t * 5) > 0.92 ? 2 : 10;
  ctx.fillStyle = hurt ? "#ffd166" : "#ff5c5c";
  ctx.fillRect(cx - 32, cy - 10, 18, blink);
  ctx.fillRect(cx + 14, cy - 10, 18, blink);
  ctx.strokeStyle = "#7fd3ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 46);
  ctx.lineTo(cx, cy - 66);
  ctx.stroke();
  glow(ctx, cx, cy - 70, 12, "#7fd3ff", 0.8);
  // Health bar.
  fill(ctx, "#1a1410", x - 120, y + 56, 240, 14, 7);
  fill(ctx, PAL.terra, x - 120, y + 56, 240 * hp, 14, 7);
  return cx;
}

/** One Word Crates room. `view` carries words, language, flashes and display time effects. */
export function drawArena(ctx, w, r, t, words, view) {
  const ox = r.x0;
  const st = stepOf(r);
  const item = r.items[r.at];
  // Board: the crate's prompt, progress and the room's gears.
  const bx = ox + BOARD_X;
  const by = r.boss ? 176 : 120;
  plate(ctx, bx - 270, by, 540, 96, PAL.gold);
  const head = r.boss
    ? words.bossName
    : words.quizBoard
        .replace("{n}", Math.min(r.at + 1, r.items.length))
        .replace("{total}", r.items.length);
  label(ctx, head, bx, by + 16, 13, PAL.muted);
  label(ctx, item ? quizPrompt(item, view.lang, words.quizWhen) : "✓", bx, by + 46, 24, PAL.cream);
  const got = r.gears.filter((g) => g.got).length;
  label(
    ctx,
    `⚙ ${got}/${r.gears.length}${r.streak > 1 ? `   🔥 ${r.streak}` : ""}`,
    bx,
    by + 78,
    15,
    PAL.tealGlow,
  );
  if (r.boss && !r.done) bot(ctx, bx, 92, t, 1 - r.at / r.items.length, view.hurt(r));
  // Spring.
  const sx = ox + SPRING.x;
  fill(ctx, "#3a2c22", sx, FLOOR - 10, SPRING.w, 10, 3);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let k = 0; k <= 4; k++) ctx.lineTo(sx + (k % 2 ? 8 : SPRING.w - 8), FLOOR - 10 - k * 3);
  ctx.stroke();
  fill(ctx, PAL.terra, sx - 2, FLOOR - SPRING.h - 6, SPRING.w + 4, 6, 3);
  for (const g of r.gears) if (!g.got) gear(ctx, g, t);
  // Answer blocks or value ledges for the current step.
  if (st) {
    for (const k of r.blocks) {
      const s = w.solids[k];
      if (!s.open) block(ctx, s, st.choices[s.slot], t, view.flash(r, s.slot));
    }
    for (const k of r.ledges) {
      const s = w.solids[k];
      if (!s.open) ledge(ctx, s, st.choices[s.slot], t, view.flash(r, s.slot));
    }
    const ask = words[st.ask === "askSolve" ? "landHint" : "jumpHint"];
    label(ctx, ask, bx, st.ask === "askSolve" ? LEDGE.y + 52 : BLOCK.y + BLOCK.h + 40, 14, PAL.muted);
  }
  // Truck with the packed crates stacked in it.
  const tx = ox + TRUCK_X;
  fill(ctx, "#24406b", tx, FLOOR - 70, 90, 62, 8);
  fill(ctx, PAL.ok, tx, FLOOR - 70, 90, 6, 3);
  ctx.fillStyle = "#1a1410";
  for (const wx of [tx + 18, tx + 72]) {
    ctx.beginPath();
    ctx.arc(wx, FLOOR - 6, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < Math.min(r.at, 9); k++)
    fill(ctx, "#8a6a2c", tx + 6 + (k % 3) * 27, FLOOR - 92 - Math.floor(k / 3) * 22, 24, 20, 3);
  label(ctx, `${r.at}/${r.items.length}`, tx + 45, FLOOR - 40, 16, PAL.gold);
  // Packed crates fly from the block they came out of into the truck.
  for (const f of view.flying(r)) {
    const u = Math.min(1, f.age / 0.8);
    const x = f.x + (tx + 45 - f.x) * u;
    const y = f.y + (FLOOR - 100 - f.y) * u - Math.sin(u * Math.PI) * 120;
    fill(ctx, "#a77a2c", x - 18, y - 18, 36, 36, 5);
    label(ctx, "✓", x, y, 16, PAL.cream);
  }
  // Gate.
  const g = w.solids[r.gate];
  if (!g.open) {
    ctx.fillStyle = "#4a3a2c";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    for (let y = g.y + 20; y < g.y + g.h; y += 40) {
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(g.x + 4, y, g.w - 8, 6);
    }
  } else glow(ctx, g.x + 13, FLOOR - 120, 70, PAL.ok, 0.3);
}
