// Expression Factory — drawing. Reads the world, never writes it.
// The Algebra Works: a warm industrial hall. The line under the belt IS the
// expression; each crate's label changes at every stamp, so a student watches
// x become 3x + 2 one operation at a time.

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
import { BELT_X0, BELT_X1, BELT_Y, FLOOR, REF_Y, STATION_X, slotX, TRUCK_X } from "./levels.js";
import { fracText, machineText, write } from "./math.js";

let girders;

function assets() {
  if (girders) return;
  girders = layer(300, 360, (g) => {
    g.strokeStyle = "rgba(201,138,31,0.18)";
    g.lineWidth = 6;
    g.beginPath();
    for (let x = 0; x <= 300; x += 150) {
      g.moveTo(x, 0);
      g.lineTo(x, 360);
    }
    g.moveTo(0, 0);
    g.lineTo(150, 180);
    g.lineTo(300, 0);
    g.moveTo(0, 360);
    g.lineTo(150, 180);
    g.lineTo(300, 360);
    g.stroke();
  });
}

export function drawBackdrop(ctx, cam, w, t, lowfx) {
  assets();
  sky(ctx, W, H, "#1a1410", "#2a1d14", "rgba(242,184,75,0.18)");
  if (lowfx) return;
  const off = cam.parallax(0.3) % 300;
  for (let x = off - 300; x < W; x += 300) ctx.drawImage(girders, Math.round(x), 30);
  for (let i = 0; i < 5; i++) {
    const x = ((((i * 260 + cam.parallax(0.5)) % (W + 260)) + W + 260) % (W + 260)) - 130;
    glow(ctx, x, 60, 120, "rgba(255,190,110,0.8)", 0.18);
  }
}

function belt(ctx, x0, x1, y, t, ghost) {
  ctx.globalAlpha = ghost ? 0.55 : 1;
  ctx.fillStyle = "#3a2c22";
  rr(ctx, x0, y, x1 - x0, 18, 8);
  ctx.fill();
  ctx.fillStyle = "#5a4636";
  const shift = (t * 90) % 24;
  for (let x = x0 + shift; x < x1; x += 24) ctx.fillRect(x, y + 3, 10, 4);
  for (let x = x0 + 10; x < x1; x += 44) {
    ctx.fillStyle = "#2a2018";
    ctx.beginPath();
    ctx.arc(x, y + 20, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function machine(ctx, x, beltY, m, t, press, ghost, empty) {
  const top = beltY - 120;
  ctx.globalAlpha = ghost ? 0.55 : 1;
  // Frame and press head.
  ctx.fillStyle = empty ? "#2c2620" : "#4a3a2c";
  rr(ctx, x - 44, top, 88, 70, 10);
  ctx.fill();
  ctx.strokeStyle = empty ? "rgba(244,236,216,0.25)" : PAL.gold;
  ctx.lineWidth = 3;
  ctx.setLineDash(empty ? [6, 6] : []);
  ctx.stroke();
  ctx.setLineDash([]);
  const drop = press * 26;
  ctx.fillStyle = "#6b5a48";
  ctx.fillRect(x - 6, top + 70, 12, 10 + drop);
  ctx.fillStyle = PAL.goldDeep;
  rr(ctx, x - 26, top + 78 + drop, 52, 12, 4);
  ctx.fill();
  label(
    ctx,
    empty ? "?" : machineText(m),
    x,
    top + 35,
    empty ? 26 : 24,
    empty ? PAL.muted : PAL.cream,
  );
  if (!ghost && !empty) {
    // Legs to the floor.
    ctx.fillStyle = "#3a2c22";
    ctx.fillRect(x - 40, beltY + 26, 10, FLOOR - beltY - 26);
    ctx.fillRect(x + 30, beltY + 26, 10, FLOOR - beltY - 26);
  }
  if (press > 0.6) glow(ctx, x, beltY, 40, PAL.gold, 0.4);
  ctx.globalAlpha = 1;
}

function crate(ctx, x, y, c, ghost) {
  const v = c.v;
  const s = 44;
  ctx.globalAlpha = ghost ? 0.6 : 1;
  ctx.fillStyle = c.state === "reject" ? PAL.terraDeep : c.state === "ok" ? "#3d6e4c" : "#8a6a2c";
  rr(ctx, x - s / 2, y - s, s, s, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(42,26,2,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - s / 2 + 5, y - s + 5, s - 10, s - 10);
  label(ctx, fracText(v), x, y - s / 2, 16, PAL.cream);
  label(ctx, `x=${c.x}`, x, y - s - 9, 11, PAL.muted);
  ctx.globalAlpha = 1;
}

/** The prompt a Word Crates crate carries, in the student's language. */
export function quizPrompt(item, lang, when) {
  return item.phrase ? item.phrase[lang] || item.phrase.en : `${item.show}, ${when} ${item.when}`;
}

function quizCrate(ctx, x, y, text, glowing) {
  const s = 64;
  ctx.fillStyle = glowing ? "#a77a2c" : "#8a6a2c";
  rr(ctx, x - s / 2, y - s, s, s, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(42,26,2,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - s / 2 + 6, y - s + 6, s - 12, s - 12);
  label(ctx, text, x, y - s / 2, text.length > 5 ? 13 : 17, PAL.cream);
}

/** Word Crates: one stamping station, a queue of crates, and the truck. */
function quizRoom(ctx, w, r, t, words, view) {
  const ox = r.x0;
  belt(ctx, ox + BELT_X0, ox + BELT_X1, BELT_Y, t, false);
  machine(ctx, ox + STATION_X, BELT_Y, { op: "+", k: 0 }, t, view.press(r.i, 0, false), false, true);
  const item = r.items[r.at];
  const bx = ox + STATION_X;
  plate(ctx, bx - 250, 150, 500, 104, PAL.gold);
  label(ctx, words.quizBoard.replace("{n}", Math.min(r.at + 1, r.items.length)).replace("{total}", r.items.length), bx, 168, 13, PAL.muted);
  label(ctx, item ? quizPrompt(item, view.lang, words.quizWhen) : "✓", bx, 198, 24, PAL.cream);
  if (r.streak > 1) label(ctx, `🔥 ${words.quizStreak.replace("{n}", r.streak)}`, bx, 124, 16, PAL.tealGlow);
  // Truck with its load count.
  const tx = ox + BELT_X1 + 20;
  ctx.fillStyle = "#24406b";
  rr(ctx, tx, BELT_Y - 10, 90, 70, 8);
  ctx.fill();
  ctx.fillStyle = PAL.ok;
  ctx.fillRect(tx, BELT_Y - 10, 90, 6);
  label(ctx, words.truck, tx + 45, BELT_Y + 14, 12, PAL.cream);
  label(ctx, `${r.at} / ${r.items.length}`, tx + 45, BELT_Y + 38, 18, PAL.gold);
  // Packed crates stack in the truck; the rest hop along the belt toward their places.
  for (let k = 0; k < Math.min(r.at, 6); k++) {
    ctx.fillStyle = "#8a6a2c";
    rr(ctx, tx + 8 + (k % 3) * 26, BELT_Y - 34 - Math.floor(k / 3) * 22, 22, 20, 3);
    ctx.fill();
  }
  r.items.forEach((it, k) => {
    const px = view.crateX(r, k);
    if (k < r.at && px >= TRUCK_X - 4) return;
    const x = ox + px;
    if (x < ox + BELT_X0 - 40) return;
    quizCrate(ctx, x + view.shakeX(r, k), BELT_Y - view.hop(r, k), it.show || "Aa", k === r.at);
  });
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

function room(ctx, w, r, t, words, view) {
  if (r.kind === "quiz") return quizRoom(ctx, w, r, t, words, view);
  const ox = r.x0;
  const run = r.run;
  // Reference line (twin, streamline): a ghost belt above, running the order.
  if (r.kind === "twin" || r.kind === "streamline") {
    belt(ctx, ox + BELT_X0, ox + BELT_X1, REF_Y, t, true);
    r.target.forEach((m, i) =>
      machine(
        ctx,
        slotX(r, i, r.target.length),
        REF_Y,
        m,
        t,
        view.press(r.i, i, true),
        true,
        false,
      ),
    );
    plate(ctx, ox + BELT_X0 - 150, REF_Y - 60, 140, 46, PAL.sage);
    label(ctx, words.reference, ox + BELT_X0 - 80, REF_Y - 46, 11, PAL.muted);
    label(ctx, write(r.target), ox + BELT_X0 - 80, REF_Y - 28, 15, PAL.cream);
    if (run?.ref)
      for (const c of run.ref)
        if (c.state === "belt") crate(ctx, ox + BELT_X0 + c.pos, REF_Y, c, true);
  }
  belt(ctx, ox + BELT_X0, ox + BELT_X1, BELT_Y, t, false);
  const n = r.line.length;
  r.line.forEach((m, i) =>
    machine(ctx, slotX(r, i, n), BELT_Y, m, t, view.press(r.i, i, false), false, !m),
  );
  // Order board, with the student's own line written under the order.
  const order = {
    build: write(r.target),
    match: write(r.target),
    identify: words.identifyOrder,
    twin: words.twinOrder,
    streamline: words.streamOrder,
  }[r.kind];
  const yours = r.line.filter(Boolean);
  plate(ctx, ox + 330, 56, 440, 84, PAL.gold);
  label(ctx, words.order, ox + 550, 72, 12, PAL.muted);
  label(ctx, order, ox + 550, 94, 20, PAL.cream);
  // An identify room's line is the puzzle: its written form stays off the board.
  if (r.kind !== "identify")
    label(ctx, `${words.yourLine}: ${yours.length ? write(yours) : "x"}`, ox + 550, 122, 15, PAL.tealGlow);
  // Lever.
  const lx = ox + 100;
  ctx.fillStyle = "#3a2c22";
  rr(ctx, lx - 18, FLOOR - 50, 36, 50, 6);
  ctx.fill();
  ctx.strokeStyle = run ? PAL.ok : PAL.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(lx, FLOOR - 44);
  ctx.lineTo(lx + (run ? 22 : -22), FLOOR - 90);
  ctx.stroke();
  ctx.fillStyle = PAL.terra;
  ctx.beginPath();
  ctx.arc(lx + (run ? 22 : -22), FLOOR - 92, 8, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, words.lever, lx, FLOOR - 110, 12, PAL.cream);
  // Truck and reject chute.
  const tx = ox + BELT_X1 + 20;
  ctx.fillStyle = "#24406b";
  rr(ctx, tx, BELT_Y - 10, 90, 70, 8);
  ctx.fill();
  ctx.fillStyle = PAL.ok;
  ctx.fillRect(tx, BELT_Y - 10, 90, 6);
  label(ctx, words.truck, tx + 45, BELT_Y + 22, 12, PAL.cream);
  ctx.fillStyle = PAL.terraDeep;
  rr(ctx, tx + 10, BELT_Y + 70, 70, 50, 6);
  ctx.fill();
  label(ctx, words.reject, tx + 45, BELT_Y + 96, 11, PAL.cream);
  if (run)
    for (const c of run.crates) {
      if (c.state === "belt") crate(ctx, ox + BELT_X0 + c.pos, BELT_Y, c, false);
    }
  // Finished crates stack in the truck or the chute.
  if (run || r.lastCrates)
    (run ? run.crates : r.lastCrates)
      .filter((c) => c.state === "ok" || c.state === "reject")
      .forEach((c, i) => {
        const inTruck = c.state === "ok";
        crate(ctx, tx + 22 + (i % 2) * 46, inTruck ? BELT_Y - 10 : BELT_Y + 70, c, false);
      });
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

export function draw(ctx, w, t, view) {
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = PAL.goldDeep;
  ctx.fillRect(0, FLOOR, w.w, 3);
  for (const r of w.rooms) room(ctx, w, r, t, view.words, view);
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
