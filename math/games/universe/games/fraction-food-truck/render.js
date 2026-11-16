// Fraction Food Truck — drawing. Reads the world, never writes it.
// Inside the Half & Whole food truck: the ticket rail, the pot with its
// measuring gauge, the serving counter where portions land one ladle at a
// time, and the customers at the window.

import { drawOri, drawWren, glow, label, PAL, plate, rr, shadow } from "../../runtime/art.js";
import { H, W } from "../../runtime/chrome.js";
import { FLOOR, STATIONS } from "./levels.js";
import { div, F, portions, sub, text } from "./math.js";
import { LADLE_TICKS, order } from "./rules.js";

const FOOD = {
  soup: { fill: "#d9734e", rim: "#f4ecd8" },
  pizza: { fill: "#f2b84b", rim: "#a85a3c" },
  cake: { fill: "#c98a6a", rim: "#f4ecd8" },
};

export function drawBackdrop(ctx) {
  ctx.fillStyle = "#123044";
  ctx.fillRect(0, 0, W, H);
}

/** A serving container with `frac` of a full portion in it (0..1). */
function container(ctx, food, x, y, frac, label1) {
  const c = FOOD[food];
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.rim;
  ctx.beginPath();
  ctx.moveTo(x - 32, y - 30);
  ctx.lineTo(x + 32, y - 30);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x - 24, y);
  ctx.closePath();
  ctx.fill();
  if (frac > 0) {
    const h = 26 * Math.min(1, frac);
    ctx.fillStyle = c.fill;
    ctx.fillRect(
      x - 26 + (1 - Math.min(1, frac)) * 4,
      y - 2 - h,
      52 - (1 - Math.min(1, frac)) * 8,
      h,
    );
  }
  if (frac < 0.999) {
    ctx.strokeStyle = PAL.terra;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 27, y - 29, 54, 27);
    ctx.setLineDash([]);
  }
  if (label1) label(ctx, label1, x, y + 18, 12, PAL.cream);
}

function pot(ctx, x, y, amount, maxAmount, unit, food) {
  // Body.
  ctx.fillStyle = "#3a4565";
  rr(ctx, x - 70, y - 120, 140, 120, 14);
  ctx.fill();
  ctx.fillStyle = "#2c3550";
  ctx.fillRect(x - 84, y - 120, 168, 12);
  // Contents.
  const h = 100 * (amount.n / amount.d / Math.max(1, maxAmount.n / maxAmount.d));
  ctx.fillStyle = FOOD[food].fill;
  ctx.fillRect(x - 60, y - 6 - h, 120, h);
  // Gauge: marks every `unit` of the batch, whole numbers labelled.
  const gx = x + 92;
  ctx.fillStyle = "#24406b";
  rr(ctx, gx - 10, y - 116, 20, 112, 6);
  ctx.fill();
  const total = maxAmount.n / maxAmount.d;
  const step = unit.n / unit.d;
  for (let m = 0; m <= total + 1e-9; m += step) {
    const yy = y - 6 - (100 * m) / Math.max(1, total);
    const whole = Math.abs(m - Math.round(m)) < 1e-9;
    ctx.fillStyle = whole ? PAL.gold : "rgba(244,236,216,0.6)";
    ctx.fillRect(gx - (whole ? 14 : 8), yy - 1, whole ? 28 : 16, 2);
    if (whole) label(ctx, String(Math.round(m)), gx + 26, yy, 11, PAL.gold);
  }
  const lvl = y - 6 - h;
  ctx.fillStyle = PAL.tealGlow;
  ctx.beginPath();
  ctx.moveTo(gx - 16, lvl);
  ctx.lineTo(gx - 24, lvl - 6);
  ctx.lineTo(gx - 24, lvl + 6);
  ctx.fill();
  label(ctx, text(amount), x, y - 140, 16, PAL.cream);
}

function customer(ctx, x, y, mood, t, hue) {
  const bob = Math.sin(t * 2 + x) * 2;
  ctx.fillStyle = hue;
  rr(ctx, x - 20, y - 60 + bob, 40, 46, 14);
  ctx.fill();
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.arc(x, y - 74 + bob, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0d1b2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (mood === "happy") ctx.arc(x, y - 72 + bob, 7, 0.2, Math.PI - 0.2);
  else if (mood === "sad") ctx.arc(x, y - 64 + bob, 7, Math.PI + 0.3, -0.3);
  else {
    ctx.moveTo(x - 5, y - 68 + bob);
    ctx.lineTo(x + 5, y - 68 + bob);
  }
  ctx.stroke();
  ctx.fillStyle = "#0d1b2e";
  ctx.beginPath();
  ctx.arc(x - 5, y - 78 + bob, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 78 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function draw(ctx, w, t, view) {
  const words = view.words;
  // Truck interior.
  ctx.fillStyle = "#f4ecd8";
  ctx.fillRect(0, 0, w.w, FLOOR);
  ctx.fillStyle = "#1fa6a2";
  ctx.fillRect(0, 0, w.w, 40);
  for (let x = 0; x < w.w; x += 60) {
    ctx.fillStyle = x % 120 ? "#e8dcc0" : "#efe4cc";
    ctx.fillRect(x, 330, 60, 30);
  }
  // Window and the queue outside.
  ctx.fillStyle = "#123044";
  rr(ctx, STATIONS.counter - 90, 90, 260, 210, 14);
  ctx.fill();
  const done = !order(w);
  const last = w.served.at(-1);
  const mood = done ? "happy" : last && !last.ok && last.order === w.current ? "sad" : "wait";
  ["#5f8368", "#a85a3c", "#34507e"].forEach((hue, i) =>
    customer(ctx, STATIONS.counter - 30 + i * 70, 280, i === 0 ? mood : "wait", t, hue),
  );
  label(ctx, words.window, STATIONS.counter + 40, 74, 13, "#0d1b2e");
  // Floor.
  ctx.fillStyle = "#2b3a52";
  ctx.fillRect(0, FLOOR, w.w, 200);
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(0, FLOOR, w.w, 3);
  // Counter.
  ctx.fillStyle = "#3a4565";
  ctx.fillRect(STATIONS.serve - 120, 410, 520, 110);
  ctx.fillStyle = "#c9ced8";
  ctx.fillRect(STATIONS.serve - 120, 404, 520, 10);
  // Ticket rail.
  const o = order(w);
  ctx.fillStyle = "#c9ced8";
  ctx.fillRect(40, 70, 300, 6);
  if (o) {
    ctx.fillStyle = "#fffaf0";
    rr(ctx, 60, 80, 260, 130, 6);
    ctx.fill();
    ctx.strokeStyle = PAL.terra;
    ctx.lineWidth = 3;
    ctx.stroke();
    label(ctx, words.ticket, 190, 100, 12, PAL.terraDeep);
    const lines = view.ticket(o);
    lines.forEach((l, i) =>
      label(ctx, l, 190, 128 + i * 24, i === lines.length - 1 ? 15 : 14, "#0d1b2e"),
    );
  }
  // The pot (and stove).
  ctx.fillStyle = "#2c3550";
  ctx.fillRect(STATIONS.pantry - 100, 440, 200, 80);
  const s = w.serving;
  if (o) {
    // During a serving the pot drains ladle by ladle; after a try it shows what that try left.
    let inPot = !s && last && last.order === w.current ? last.rest : o.total;
    if (s) {
      const ladled = Math.min(s.got.length, Math.floor(s.t / LADLE_TICKS));
      for (let i = 0; i < ladled; i++) inPot = sub(inPot, s.got[i]);
    }
    const unit = o.kind === "share" ? F(1, Math.max(2, div(o.total, F(o.plates)).d)) : o.portion;
    pot(ctx, STATIONS.pantry, 440, inPot, o.total, unit, w.food);
    if (view.groups && o.kind !== "share") {
      // The group model support: the batch as a bar cut into portions.
      const total = o.total.n / o.total.d;
      const x0 = STATIONS.pantry - 150;
      const width = 300;
      const p = o.portion.n / o.portion.d;
      plate(ctx, x0 - 8, 230, width + 16, 46, PAL.sage);
      const { whole } = portions(o.total, o.portion);
      for (let i = 0; i <= whole; i++) {
        const a = (i * p) / total;
        const b = Math.min(1, ((i + 1) * p) / total);
        if (a >= 1) break;
        ctx.fillStyle = i % 2 ? "#d9734e" : "#f2b84b";
        ctx.fillRect(x0 + a * width, 240, (b - a) * width - 2, 26);
      }
      label(ctx, words.groups, STATIONS.pantry, 222, 12, PAL.cream);
    }
  }
  // Serving: containers fill one ladle at a time.
  if (s || last) {
    const shown = s || last;
    const n = shown.got.length;
    const ladled = s ? Math.min(n, Math.floor(s.t / LADLE_TICKS)) : n;
    const per = Math.min(70, 480 / Math.max(1, n));
    for (let i = 0; i < n; i++) {
      const x = STATIONS.serve - 80 + i * per;
      const frac = i < ladled ? shown.got[i].n / shown.got[i].d / (shown.full.n / shown.full.d) : 0;
      container(ctx, w.food, x, 404, frac, i < ladled ? text(shown.got[i]) : "");
    }
    if (!s && !shown.ok && shown.rest.n > 0)
      label(ctx, `${words.left}: ${text(shown.rest)}`, STATIONS.pantry, 300, 15, PAL.terraDeep);
  }
  glow(ctx, STATIONS.serve, 380, 60, "rgba(255,240,190,0.9)", 0.15);
  const p = w.p;
  shadow(ctx, p.x + p.w / 2, p.y + p.h, 16, 0.35);
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
    acting: view.acting || !!s,
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

