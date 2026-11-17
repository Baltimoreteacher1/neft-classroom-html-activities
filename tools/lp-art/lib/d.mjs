// Illustrator D helpers: props and figure geometry the shared kit does not cover (water cans, buses,
// barns, bees, beds, bins ...). Same art direction as kit.mjs: no outlines, lit/shade sides, soft contact
// shadows. Every function returns an SVG string in scene coordinates unless it says otherwise.
import { P, shade, light, mix, g, tr, rect, rrect, circle, ellipse, path, poly, line, stroke, contact, text, vgrad, rng } from "../../../access-practice-lab/src/art/kit.js";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const rad = (a) => (a * Math.PI) / 180;

/* ------------------------------------------------------------------ figure geometry */

// Limb angles copied from kit person() so props can meet a figure's hands exactly.
const POSE = {
  stand: { la: [-8, 4], ra: [8, -4] },
  walk: { la: [-24, 10], ra: [24, -10] },
  run: { la: [-50, 80], ra: [55, 70] },
  wave: { la: [-10, 4], ra: [150, 20] },
  point: { la: [-8, 4], ra: [92, 0] },
  reach: { la: [-8, 4], ra: [140, 10] },
  hold: { la: [40, 70], ra: [44, 72] },
  cheer: { la: [-150, -10], ra: [150, 10] },
  kick: { la: [-40, 20], ra: [40, -10] },
  read: { la: [36, 80], ra: [40, 84] },
  think: { la: [-8, 4], ra: [30, 140] },
  sit: { la: [30, 40], ra: [36, 44] },
  carry: { la: [20, 90], ra: [24, 92] },
};

/** Where a kit person(x, y, h, o) puts its hands, head and neck, in scene coordinates. */
export function joints(x, y, h, o = {}) {
  const child = (o.age || "child") === "child";
  const headR = child ? 13 : 10.2;
  const headY = -100 + headR;
  const neckY = headY + headR;
  const shoulderY = neckY + (child ? 3 : 4);
  const hipY = child ? -44 : -48;
  const torsoW = child ? 15 : 16.5;
  const armLen = child ? 30 : 34;
  const A = POSE[o.pose] || POSE.stand;
  const s = h / 100;
  const fc = o.facing || 1;
  const lift = o.pose === "sit" ? -hipY : 0;
  const W = ([px, py]) => [x + fc * s * px, y + s * (py + lift)];
  const end = (x0, y0, [a1, a2]) => {
    const mx = x0 + Math.sin(rad(a1)) * (armLen / 2);
    const my = y0 + Math.cos(rad(a1)) * (armLen / 2);
    return [mx + Math.sin(rad(a1 + a2)) * (armLen / 2), my + Math.cos(rad(a1 + a2)) * (armLen / 2)];
  };
  return {
    hand: W(end(torsoW * 0.62, shoulderY + 3, A.ra)),
    backHand: W(end(-torsoW * 0.62, shoulderY + 3, A.la)),
    head: W([0, headY]),
    headR: headR * s,
    neck: W([0, neckY]),
    chest: W([0, shoulderY + 10]),
    hip: W([0, hipY]),
    torsoW: torsoW * s,
    s,
    fc,
  };
}

/* ------------------------------------------------------------------ wearables (drawn over a person) */

/** Tall rain boots over both feet of a standing figure. */
export function boots(x, y, h, color = P.teal) {
  const s = h / 100;
  let b = "";
  for (const [dx, c] of [[-6, shade(color, 0.15)], [6, color]]) {
    b += path(`M${f(dx - 5)} -20 h10 v16 q8 0 9 4 v2 h-19Z`, c) + rect(dx - 5, -20, 10, 3.5, light(color, 0.3));
  }
  return tr(x, y, b, s);
}

/** Chef's hat sitting on a head (joints().head / headR). */
export function chefHat([hx, hy], r) {
  return g(
    rrect(hx - r * 0.95, hy - r * 1.35, r * 1.9, r * 0.6, r * 0.15, "#eef0f2") +
      circle(hx - r * 0.55, hy - r * 1.75, r * 0.6, "#ffffff") +
      circle(hx + r * 0.5, hy - r * 1.8, r * 0.62, "#f4f5f6") +
      circle(hx, hy - r * 2.05, r * 0.7, "#ffffff"),
  );
}

/** Firefighter helmet with a wide back brim and a front shield. */
export function helmet([hx, hy], r, fc = 1) {
  const c = P.red;
  return g(
    path(`M${f(hx - r * 1.45)} ${f(hy - r * 0.12)} Q${f(hx)} ${f(hy + r * 0.25)} ${f(hx + r * 1.45)} ${f(hy - r * 0.12)} L${f(hx + r * 1.2)} ${f(hy - r * 0.38)} H${f(hx - r * 1.2)}Z`, shade(c, 0.18)) +
      path(`M${f(hx - r * 1.08)} ${f(hy - r * 0.3)} A${f(r * 1.08)} ${f(r * 1.12)} 0 0 1 ${f(hx + r * 1.08)} ${f(hy - r * 0.3)}Z`, c) +
      path(`M${f(hx - r * 0.2)} ${f(hy - r * 1.38)} Q${f(hx)} ${f(hy - r * 1.5)} ${f(hx + r * 0.2)} ${f(hy - r * 1.38)} V${f(hy - r * 0.35)} H${f(hx - r * 0.2)}Z`, shade(c, 0.25)) +
      rrect(hx + fc * r * 0.25 - r * 0.32, hy - r * 1.02, r * 0.64, r * 0.6, r * 0.12, P.gold) +
      ellipse(hx - r * 0.45, hy - r * 0.95, r * 0.35, r * 0.18, light(c, 0.4), 'opacity=".6"'),
  );
}

/** Wide-brim sun hat. */
export function sunHat([hx, hy], r, color = "#e9cf8f") {
  return g(
    ellipse(hx, hy - r * 0.45, r * 1.75, r * 0.38, shade(color, 0.12)) +
      path(`M${f(hx - r * 0.95)} ${f(hy - r * 0.5)} Q${f(hx - r * 0.9)} ${f(hy - r * 1.55)} ${f(hx)} ${f(hy - r * 1.55)} Q${f(hx + r * 0.9)} ${f(hy - r * 1.55)} ${f(hx + r * 0.95)} ${f(hy - r * 0.5)}Z`, color) +
      rect(hx - r * 0.95, hy - r * 0.78, r * 1.9, r * 0.24, P.coral),
  );
}

/** Stethoscope hanging around a neck. */
export function stethoscope([nx, ny], s) {
  const d = `M${f(nx - 7 * s)} ${f(ny)} Q${f(nx - 9 * s)} ${f(ny + 22 * s)} ${f(nx)} ${f(ny + 24 * s)} Q${f(nx + 9 * s)} ${f(ny + 22 * s)} ${f(nx + 7 * s)} ${f(ny)}`;
  return g(stroke(d, "#3c4652", 2.2 * s) + stroke(`M${f(nx)} ${f(ny + 24 * s)} v${f(8 * s)}`, "#3c4652", 2 * s) + circle(nx, ny + 34 * s, 3.6 * s, "#aeb7c1") + circle(nx - 0.8 * s, ny + 33 * s, 1.4 * s, "#ffffff", 'opacity=".7"'));
}

/** Two reflective stripes across a safety vest (person drawn with apron = vest colour). */
export function vestStripes([cx, cy], s) {
  return g(rect(cx - 9 * s, cy + 6 * s, 18 * s, 3 * s, "#f3f0c2", 'opacity=".9"') + rect(cx - 9 * s, cy + 16 * s, 18 * s, 3 * s, "#f3f0c2", 'opacity=".9"'));
}

/* ------------------------------------------------------------------ hand props (origin = grip) */

/** Watering can held by its top handle; the spout points +x. pour adds a stream of drops. */
export function wateringCan(s = 1, { color = P.blue, pour = false } = {}) {
  let b =
    path("M-4 0 Q2 -10 10 0", "none", `stroke="${shade(color, 0.25)}" stroke-width="3"`) +
    path("M10 6 L27 -8 L30 -5 L14 12Z", shade(color, 0.1)) +
    ellipse(29, -7.5, 3.5, 2.2, shade(color, 0.3), 'transform="rotate(-40 29 -7.5)"') +
    rrect(-10, 2, 24, 20, 4, color) +
    rect(4, 2, 10, 20, shade(color, 0.16), 'opacity=".7"') +
    rect(-8, 4, 3, 16, light(color, 0.35), 'opacity=".6"');
  if (pour) b += stroke("M31 -4 q6 6 8 18M29 -2 q4 7 4 18M33 -6 q9 5 12 15", P.waterLight, 1.6, 'opacity=".9" stroke-dasharray="3 4"');
  return tr(0, 0, b, s);
}

export const milkCarton = (s = 1) => tr(0, 0, rect(-5, -14, 10, 14, "#ffffff") + poly([[-5, -14], [0, -19], [5, -14]], "#e9edf1") + rect(1, -14, 4, 14, "#dfe5ea") + rect(-5, -9, 10, 4, P.blue), s);
export const apple = (s = 1) => tr(0, 0, circle(0, -6, 6, P.red) + circle(-2, -8, 2, "#ffffff", 'opacity=".45"') + line(0, -12, 1, -15, P.barkDark, 1.4) + path("M1 -13 q5 -4 7 0 q-4 2 -7 0Z", P.leaf), s);
export const sodaCan = (s = 1) => tr(0, 0, rrect(-4, -11, 8, 12, 1.5, "#9fb0bd") + rect(-4, -8, 8, 5, P.green) + rect(1.5, -11, 2.5, 12, "#ffffff", 'opacity=".3"'), s);
export const loaf = (s = 1) => tr(0, 0, ellipse(0, -2, 15, 7, "#c98a45") + ellipse(0, -4, 13, 4.5, "#dca25e") + stroke("M-7 -6 l3 4M-1 -7 l3 4M5 -6 l3 4", "#f0c98a", 1.4), s);
export const letter = (s = 1) => tr(0, 0, rect(-8, -6, 16, 11, "#ffffff") + path("M-8 -6 L0 0 L8 -6", "none", `stroke="#c9d1da" stroke-width="1.2"`), s);
export const clipboard = (s = 1) => tr(0, 0, rrect(-9, -14, 18, 24, 2, P.woodDark) + rect(-7, -11, 14, 19, "#ffffff") + rrect(-4, -16, 8, 4, 1.5, "#9aa3ad") + stroke("M-5 -6h10M-5 -2h10M-5 2h7", "#9aa7b4", 1.2), s);
export const toothbrush = (s = 1) => tr(0, 0, line(0, 0, -11, -9, P.teal, 2.6) + rrect(-15, -13, 5, 4, 1, "#ffffff", 'transform="rotate(40 -12.5 -11)"'), s);
export const spoon = (s = 1) => tr(0, 0, line(0, 0, -6, -10, "#b7c0c9", 1.8) + ellipse(-7, -12, 2.4, 3.2, "#c7d0d8"), s);

/** A garden spade from the grip (x1,y1) to the blade tip (x2,y2). */
export function shovel(x1, y1, x2, y2, { color = P.coral } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = Math.hypot(x2 - x1, y2 - y1);
  const body = rect(-4, -3, 8, 6, shade(color, 0.2), 'rx="2"') + line(0, 0, L - 12, 0, P.woodDark, 3) + path(`M${f(L - 14)} -6 L${f(L - 2)} -5 Q${f(L + 3)} 0 ${f(L - 2)} 5 L${f(L - 14)} 6Z`, "#9aa5b0") + path(`M${f(L - 14)} 0 L${f(L - 2)} 0 Q${f(L + 3)} 0 ${f(L - 2)} 5 L${f(L - 14)} 6Z`, "#7d8893");
  return `<g transform="translate(${f(x1)} ${f(y1)}) rotate(${f((a * 180) / Math.PI)})">${body}</g>`;
}

/** A long rake: handle from (x1,y1) through the hands to its head at (x2,y2). */
export function rake(x1, y1, x2, y2) {
  const a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const L = Math.hypot(x2 - x1, y2 - y1);
  let teeth = "";
  for (let i = -3; i <= 3; i++) teeth += `M${f(L)} ${i * 4}h7`;
  return `<g transform="translate(${f(x1)} ${f(y1)}) rotate(${f(a)})">${line(0, 0, L, 0, P.wood, 3.4) + line(L, -14, L, 14, "#7d8893", 3.4) + stroke(teeth, "#7d8893", 2)}</g>`;
}

/** Diamond kite with tail bows; (x, y) is where the string attaches. */
export function kite(x, y, s = 1, { color = P.red, rot = -12, tail = true } = {}) {
  let b = poly([[0, -34], [18, -8], [0, 22], [-18, -8]], color) + poly([[0, -34], [18, -8], [0, 22]], shade(color, 0.18)) + stroke("M0 -34 V22M-18 -8 H18", light(color, 0.45), 1.4, 'opacity=".8"');
  if (tail) b += stroke("M0 22 q-10 14 2 26 q12 12 -2 26", "#5b6168", 1.4) + [[-3, 34], [1, 50], [-2, 66]].map(([bx, by]) => poly([[bx - 5, by - 3], [bx + 5, by + 3], [bx + 5, by - 3], [bx - 5, by + 3]], P.gold)).join("");
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">${b}</g>`;
}

/* ------------------------------------------------------------------ garden */

/** Terracotta pot standing on y, width w. */
export function pot(x, y, w = 60, color = "#c96f4a") {
  const h = w * 0.85;
  return g(
    contact(x, y, w * 0.55, 5, 0.2) +
      path(`M${f(x - w * 0.42)} ${f(y - h + 10)} L${f(x - w * 0.33)} ${f(y)} H${f(x + w * 0.33)} L${f(x + w * 0.42)} ${f(y - h + 10)}Z`, color) +
      path(`M${f(x + w * 0.1)} ${f(y - h + 10)} L${f(x + w * 0.42)} ${f(y - h + 10)} L${f(x + w * 0.33)} ${f(y)} H${f(x + w * 0.05)}Z`, shade(color, 0.18), 'opacity=".7"') +
      rrect(x - w / 2, y - h, w, 13, 3, light(color, 0.1)) +
      rect(x + w * 0.12, y - h, w * 0.38, 13, shade(color, 0.14), 'opacity=".6"') +
      ellipse(x, y - h + 1, w * 0.44, 4, P.soilDark),
  );
}
export const potTop = (y, w = 60) => y - w * 0.85;

/** Seedling with two leaves. */
export function sprout(x, y, s = 1) {
  return tr(x, y, stroke("M0 0 Q1 -10 0 -18", P.leafDark, 2.4) + path("M0 -16 Q-12 -24 -15 -15 Q-7 -11 0 -16Z", P.leafLight) + path("M0 -16 Q12 -26 16 -17 Q8 -12 0 -16Z", P.leaf), s);
}

/** Watering can standing on the ground (not held). */
export const canOnGround = (x, y, s = 1, color = P.blue) => contact(x + 4 * s, y, 18 * s, 3.5 * s, 0.2) + tr(x, y - 22 * s, wateringCan(1, { color }), s);

/** Tomato plant on a stake with ripe tomatoes. */
export function tomatoPlant(x, y, h = 110, { seed = 3, fruit = 6 } = {}) {
  const R = rng(seed);
  let b = line(6, 0, 6, -h - 6, P.woodLight, 3) + stroke(`M0 0 Q-4 ${-h * 0.5} 2 ${-h}`, P.leafDark, 3);
  for (let i = 0; i < 7; i++) {
    const yy = -h * (0.15 + i * 0.12);
    const side = i % 2 ? 1 : -1;
    b += path(`M0 ${f(yy)} q${side * 14} -10 ${side * 24} -2 q${-side * 10} 8 ${-side * 24} 2Z`, i % 3 ? P.leaf : P.leafDark);
  }
  for (let i = 0; i < fruit; i++) {
    const yy = -h * (0.25 + R() * 0.6);
    const xx = (i % 2 ? 1 : -1) * (6 + R() * 10);
    b += circle(xx, yy, 6, P.red) + circle(xx - 2, yy - 2, 1.8, "#ffffff", 'opacity=".5"') + path(`M${f(xx - 3)} ${f(yy - 5.5)} l3 2 l3 -2`, "none", `stroke="${P.leafDark}" stroke-width="1.4"`);
  }
  return tr(x, y, contact(0, 0, 16, 3, 0.18) + b);
}

/** Leafy vegetable (lettuce/cabbage) heads. */
export const lettuce = (x, y, s = 1) =>
  tr(x, y, ellipse(0, -6, 11, 7, P.leafDark) + ellipse(-4, -9, 7, 6, P.leafLight) + ellipse(5, -9, 7, 6, P.leaf) + ellipse(0, -12, 6, 4, "#b7d98f"), s);

/** Raised garden bed (front view) with a row of vegetables. */
export function raisedBed(x, y, w, { h = 30, crops = "mix", seed = 2 } = {}) {
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.2) + rect(x, y - h, w, h, P.wood) + rect(x, y - h, w, 6, light(P.wood, 0.2)) + rect(x, y - h / 2, w, 2, shade(P.wood, 0.2), 'opacity=".6"') + rect(x + w - 10, y - h, 10, h, shade(P.wood, 0.15)) + rect(x + 3, y - h - 5, w - 6, 7, P.soilDark);
  let plants = "";
  const n = Math.max(3, Math.round(w / 26));
  for (let i = 0; i < n; i++) {
    const px = x + (w / n) * (i + 0.5);
    plants += crops === "lettuce" || (crops === "mix" && i % 2) ? lettuce(px, y - h - 1) : tomatoPlant(px, y - h - 1, 46, { seed: seed + i, fruit: 3 });
  }
  return g(b + plants);
}

/** Furrowed vegetable rows on a field; (x,y) is the front-left corner. */
export function cropRows(x, y, w, rows = 4, gap = 15) {
  let b = "";
  for (let r = rows - 1; r >= 0; r--) {
    const yy = y - r * gap;
    const k = 1 - r * 0.08;
    b += ellipse(x + w / 2, yy, w / 2, 5 * k, P.soil) + ellipse(x + w / 2, yy - 1.5, w / 2 - 3, 3 * k, P.soilDark);
    for (let px = x + 10; px < x + w - 6; px += 16) b += ellipse(px - 3, yy - 5, 4.5 * k, 3 * k, P.leaf) + ellipse(px + 3, yy - 5, 4.5 * k, 3 * k, P.leafLight) + ellipse(px, yy - 8, 3.5 * k, 2.6 * k, P.leaf);
  }
  return b;
}

/** Little tree being planted: thin trunk, round crown, with a root ball (no contact shadow). */
export function sapling(x, y, s = 1) {
  return tr(x, y, ellipse(0, -2, 12, 5, P.soilDark) + rect(-2, -48, 4, 46, P.bark) + circle(-9, -54, 12, P.leaf) + circle(8, -58, 13, P.leaf) + circle(0, -68, 13, P.leafLight) + circle(-3, -72, 5, light(P.leafLight, 0.3), 'opacity=".7"'), s);
}

/* ------------------------------------------------------------------ animals */

export function chicken(x, y, s = 1, { facing = 1, color = "#fbf6ec", peck = false } = {}) {
  const d = shade(color, 0.14);
  let b = contact(0, 0, 13, 3, 0.2) + stroke("M-3 -8 v8M3 -8 v8", P.orange, 1.6) + path("M-15 -20 Q-20 -30 -12 -28 Q-6 -14 6 -16 Q14 -8 6 -6 Q-8 -2 -15 -20Z", d);
  b += ellipse(-2, -15, 12, 9, color) + path("M-12 -18 Q-18 -26 -13 -30 Q-10 -22 -8 -20Z", d) + path("M-6 -13 q6 -5 11 0 q-5 4 -11 0Z", d);
  const hy = peck ? -12 : -24;
  const hx = peck ? 12 : 8;
  b += circle(hx, hy, 5.5, color) + path(`M${hx - 2} ${hy - 5} q2 -5 4 -1 q2 -4 3 1Z`, P.red) + poly([[hx + 5, hy - 1], [hx + 10, hy + 1], [hx + 5, hy + 2]], P.gold) + ellipse(hx + 3, hy + 4, 1.6, 2.4, P.red) + circle(hx + 2, hy - 1, 1.2, P.ink);
  if (!peck) b += path(`M4 -18 Q${hx - 4} ${hy + 2} ${hx - 3} ${hy + 3}`, "none", `stroke="${color}" stroke-width="6"`);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/** Bee seen from the side, facing +x, standing at (x, y); pollen = clumps on the hind legs and dust on the body. */
export function bee(x, y, s = 1, { pollen = true, flying = false } = {}) {
  const blk = "#2b2622";
  const leg = (d) => stroke(d, blk, 2.6);
  const P1 = "#f0a91c";
  let b = "";
  b += ellipse(-6, -44, 15, 26, "#dcebf2", 'opacity=".7" transform="rotate(-28 -6 -44)"');
  if (!flying) b += leg("M10 -10 l6 10M-2 -10 l-2 10M-14 -12 l-10 6 l-2 6");
  b += `<g transform="rotate(-8)">` + ellipse(-22, -20, 24, 17, "#f2b730") + path("M-30 -36 Q-25 -20 -30 -4 L-23 -3 Q-19 -20 -23 -37Z", blk) + path("M-15 -37 Q-10 -20 -15 -3 L-8 -4 Q-4 -20 -8 -36Z", blk) + path("M-41 -30 Q-37 -20 -41 -10 L-45 -14 Q-47 -20 -45 -26Z", blk) + ellipse(-24, -30, 11, 4.5, "#ffe08a", 'opacity=".55"') + `</g>`;
  b += circle(6, -22, 14, "#c98f2a") + circle(4, -24, 12.5, "#e0a43a");
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    b += line(6 + Math.cos(a) * 12, -22 + Math.sin(a) * 12, 6 + Math.cos(a) * 16, -22 + Math.sin(a) * 16, "#d79b33", 1.5);
  }
  b += circle(24, -20, 10, blk) + ellipse(27, -23, 4, 5.6, "#4a423b") + circle(28, -24, 1.6, "#ffffff", 'opacity=".75"');
  b += stroke("M27 -29 Q31 -44 40 -48M22 -29 Q22 -44 29 -52", blk, 1.8) + circle(40, -48, 2.2, blk) + circle(29, -52, 2.2, blk);
  if (!flying) b += leg("M14 -12 l8 8 l4 4M4 -10 l2 8 l2 2M-8 -10 l-8 6 l-6 4");
  if (pollen && !flying) {
    b += ellipse(-16, -3, 8, 6, shade(P1, 0.12)) + ellipse(-16.5, -4, 6.4, 4.6, "#f6c63a") + circle(-19, -6, 1.8, "#ffe9a0") + circle(-13, -2, 1.2, "#ffe9a0");
    const dust = [[-2, -30], [4, -34], [11, -31], [-6, -22], [2, -14], [9, -16], [-18, -12], [-26, -8], [-32, -14], [-12, -8], [14, -26], [-20, -28]];
    for (const [px, py] of dust) b += circle(px, py, 1.8, "#f6c63a");
  }
  b += ellipse(4, -46, 13, 24, "#f4fbfe", 'opacity=".55" transform="rotate(14 4 -46)"') + stroke("M0 -66 Q4 -48 2 -26", "#b9d4e1", 0.9, 'opacity=".9"');
  return tr(x, y, b, s);
}

/* ------------------------------------------------------------------ buildings & street */

/** Red barn with gambrel roof; ground at y. */
export function barn(x, y, w = 170, h = 120, { color = "#b8402f" } = {}) {
  const d = shade(color, 0.18);
  const roofY = y - h;
  let b = contact(x + w / 2, y, w * 0.62, 8, 0.2);
  b += rect(x, roofY, w, h, color) + rect(x + w * 0.7, roofY, w * 0.3, h, d, 'opacity=".55"');
  for (let px = x + 10; px < x + w; px += 12) b += line(px, roofY + 4, px, y - 2, shade(color, 0.12), 1.2, 'opacity=".55"');
  b += path(`M${f(x - 10)} ${f(roofY + 4)} L${f(x + w * 0.16)} ${f(roofY - h * 0.38)} L${f(x + w / 2)} ${f(roofY - h * 0.62)} L${f(x + w * 0.84)} ${f(roofY - h * 0.38)} L${f(x + w + 10)} ${f(roofY + 4)}Z`, "#5d4a46");
  b += path(`M${f(x + w / 2)} ${f(roofY - h * 0.62)} L${f(x + w * 0.84)} ${f(roofY - h * 0.38)} L${f(x + w + 10)} ${f(roofY + 4)} L${f(x + w / 2)} ${f(roofY + 4)}Z`, "#4a3a37", 'opacity=".6"');
  b += path(`M${f(x)} ${f(roofY + 4)} L${f(x + w * 0.18)} ${f(roofY - h * 0.33)} L${f(x + w / 2)} ${f(roofY - h * 0.56)} L${f(x + w * 0.82)} ${f(roofY - h * 0.33)} L${f(x + w)} ${f(roofY + 4)}Z`, color);
  b += path(`M${f(x + w / 2)} ${f(roofY - h * 0.56)} L${f(x + w * 0.82)} ${f(roofY - h * 0.33)} L${f(x + w)} ${f(roofY + 4)} L${f(x + w / 2)} ${f(roofY + 4)}Z`, d, 'opacity=".45"');
  const trim = "#f7f1e6";
  b += stroke(`M${f(x)} ${f(roofY + 4)} L${f(x + w * 0.18)} ${f(roofY - h * 0.33)} L${f(x + w / 2)} ${f(roofY - h * 0.56)} L${f(x + w * 0.82)} ${f(roofY - h * 0.33)} L${f(x + w)} ${f(roofY + 4)}`, trim, 4);
  // loft window
  const lw = w * 0.2;
  b += rect(x + w / 2 - lw / 2 - 3, roofY - h * 0.3 - 3, lw + 6, lw * 0.9 + 6, trim) + rect(x + w / 2 - lw / 2, roofY - h * 0.3, lw, lw * 0.9, "#3a2a26") + line(x + w / 2, roofY - h * 0.3, x + w / 2, roofY - h * 0.3 + lw * 0.9, trim, 2.4);
  // big doors with X braces
  const dw = w * 0.5;
  const dh = h * 0.68;
  const dx = x + w / 2 - dw / 2;
  b += rect(dx - 4, y - dh - 4, dw + 8, dh + 4, trim) + rect(dx, y - dh, dw, dh, shade(color, 0.08));
  b += stroke(`M${f(dx)} ${f(y - dh)} L${f(dx + dw / 2)} ${f(y)} M${f(dx + dw / 2)} ${f(y - dh)} L${f(dx)} ${f(y)} M${f(dx + dw / 2)} ${f(y - dh)} L${f(dx + dw)} ${f(y)} M${f(dx + dw)} ${f(y - dh)} L${f(dx + dw / 2)} ${f(y)} M${f(dx + dw / 2)} ${f(y - dh)} V${f(y)}`, trim, 3.4);
  b += stroke(`M${f(x)} ${f(roofY + 4)} V${f(y)} M${f(x + w)} ${f(roofY + 4)} V${f(y)}`, trim, 4);
  return b;
}

/** Shop front with a picture sign (no words) and a display window; ground at y. */
export function shopFront(x, y, w, h, { color = "#e8b9a0", awning = P.coral, signArt = "", windowArt = "" } = {}) {
  let b = contact(x + w / 2, y, w * 0.56, 6, 0.18) + rect(x, y - h, w, h, color) + rect(x + w * 0.74, y - h, w * 0.26, h, shade(color, 0.1), 'opacity=".6"') + rect(x - 4, y - h - 8, w + 8, 10, shade(color, 0.3));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const sx = x - 6 + ((w + 12) / n) * i;
    b += path(`M${f(sx)} ${f(y - h * 0.62)} h${f((w + 12) / n)} v14 a${f((w + 12) / n / 2)} 6 0 0 1 ${f(-(w + 12) / n)} 0Z`, i % 2 ? "#fbf6ec" : awning);
  }
  b += rrect(x + w / 2 - 34, y - h + 10, 68, 30, 8, P.ivory) + signArt;
  b += rect(x + 8, y - h * 0.62 + 24, w * 0.52, h * 0.62 - 44, "#f7f1e6") + rect(x + 12, y - h * 0.62 + 28, w * 0.52 - 8, h * 0.62 - 52, vgrad([[0, "#d6ebf2"], [1, "#a8cfe0"]])) + windowArt;
  b += rect(x + w * 0.66, y - 52, 30, 52, "#f7f1e6") + rect(x + w * 0.66 + 3, y - 49, 24, 49, P.navy) + circle(x + w * 0.66 + 21, y - 24, 1.8, P.goldLight);
  return b;
}

/** Octagonal STOP sign centred at (x, y). */
export function stopSign(x, y, r = 16) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = rad(22.5 + i * 45);
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
  const inner = pts.map(([px, py]) => [x + (px - x) * 0.86, y + (py - y) * 0.86]);
  return g(poly(pts, "#ffffff") + poly(inner, "#c8352b") + text(x, y + r * 0.3, "STOP", { size: r * 0.62, fill: "#ffffff" }));
}

/** Blue street mailbox; ground at y. */
export function mailbox(x, y, s = 1) {
  const c = "#2d5fa8";
  return tr(x, y, contact(0, 0, 24, 4, 0.2) + rect(-18, -10, 6, 10, shade(c, 0.3)) + rect(12, -10, 6, 10, shade(c, 0.3)) + path("M-20 -10 V-48 A20 16 0 0 1 20 -48 V-10Z", c) + path("M6 -10 V-62 A20 16 0 0 1 20 -48 V-10Z", shade(c, 0.18), 'opacity=".7"') + rrect(-12, -50, 24, 6, 2, shade(c, 0.35)) + rect(-14, -30, 28, 3, light(c, 0.3), 'opacity=".5"'), s);
}

/** City bus (side view) driving toward +x (facing -1 to drive left); ground at y; driver drawn in the front window. */
export function cityBus(x, y, w = 210, { color = P.teal, facing = 1, driver = { skin: "#a86b45", hair: "#2a1d17" }, kind = "city" } = {}) {
  const h = kind === "school" ? 92 : 98;
  const d = shade(color, 0.2);
  let b = contact(w / 2, 0, w * 0.55, 7, 0.24);
  b += rrect(0, -h - 14, w, h, 14, color) + rect(0, -34, w, 20, d, 'opacity=".6"') + rect(6, -h - 12, w - 20, 6, light(color, 0.3), 'opacity=".5"');
  // side windows
  const winTop = -h - 2;
  const nw = Math.floor((w - 70) / 34);
  for (let i = 0; i < nw; i++) b += rrect(12 + i * 34, winTop, 28, 30, 4, vgrad([[0, "#d6ebf2"], [1, "#9cc4d8"]])) + path(`M${12 + i * 34} ${winTop + 30} L${26 + i * 34} ${winTop} h8 L${20 + i * 34} ${winTop + 30}Z`, "#ffffff", 'opacity=".3"');
  // front window with driver
  const fx = w - 46;
  let drv = "";
  if (driver) {
    drv += rrect(fx + 4, winTop + 22, 24, 30, 8, driver.top || P.navy) + circle(fx + 16, winTop + 16, 8, driver.skin) + path(`M${fx + 8} ${winTop + 14} a8 8 0 0 1 16 0 q-8 -4 -16 0Z`, driver.hair) + circle(fx + 19, winTop + 15, 1.1, P.ink);
    drv += stroke(`M${fx + 22} ${winTop + 30} a8 4 0 0 1 14 2`, "#3c4652", 2.6);
  }
  b += rrect(fx, winTop, 40, 34, 5, vgrad([[0, "#d6ebf2"], [1, "#9cc4d8"]])) + drv + path(`M${fx} ${winTop + 34} L${fx + 18} ${winTop} h10 L${fx + 8} ${winTop + 34}Z`, "#ffffff", 'opacity=".22"');
  b += rrect(w - 4, -48, 6, 12, 2, P.goldLight) + rect(w - 10, -30, 10, 6, "#f3f0c2");
  // door
  b += rect(w - 82, winTop, 26, h - 18, mix(color, "#ffffff", 0.15)) + rect(w - 79, winTop + 3, 9, h - 26, "#a8cfe0") + rect(w - 67, winTop + 3, 9, h - 26, "#a8cfe0");
  if (kind === "school") b += rect(0, -h + 34, w, 4, P.ink, 'opacity=".7"') + rect(0, -h + 42, w, 3, P.ink, 'opacity=".7"');
  for (const wx of [40, w - 44]) b += circle(wx, -12, 16, "#2b2f36") + circle(wx, -12, 7, "#9aa3ad") + circle(wx - 2, -14, 2.5, "#ffffff", 'opacity=".5"');
  return `<g transform="translate(${f(x)} ${f(y)})${facing < 0 ? ` translate(${w} 0) scale(-1 1)` : ""}">${b}</g>`;
}

/** Fire hydrant; ground at y. */
export function hydrant(x, y, s = 1) {
  const c = P.red;
  return tr(x, y, contact(0, 0, 16, 3.5, 0.22) + rrect(-13, -6, 26, 6, 2, shade(c, 0.2)) + rrect(-9, -38, 18, 34, 3, c) + rect(2, -38, 7, 34, shade(c, 0.18), 'opacity=".7"') + path("M-11 -38 A11 9 0 0 1 11 -38Z", shade(c, 0.1)) + rect(-2, -51, 4, 5, shade(c, 0.2)) + circle(-12, -24, 5, shade(c, 0.15)) + circle(12, -24, 5, shade(c, 0.25)) + rect(-6, -30, 3, 18, light(c, 0.35), 'opacity=".5"'), s);
}

/* ------------------------------------------------------------------ indoors */

/** Bin: kind 'trash' (gray, lid) or 'recycle' (blue, white recycling arrows). Ground at y. */
export function bin(x, y, w = 46, h = 62, { kind = "trash", color, shadow = true } = {}) {
  const c = color || (kind === "recycle" ? "#2f6fb5" : "#8a929b");
  let b = (shadow ? contact(x + w / 2, y, w * 0.6, 4, 0.22) : "") + path(`M${f(x + 3)} ${f(y - h)} L${f(x + 6)} ${f(y)} H${f(x + w - 6)} L${f(x + w - 3)} ${f(y - h)}Z`, c) + path(`M${f(x + w * 0.62)} ${f(y - h)} L${f(x + w * 0.64)} ${f(y)} H${f(x + w - 6)} L${f(x + w - 3)} ${f(y - h)}Z`, shade(c, 0.18), 'opacity=".7"') + rrect(x, y - h - 7, w, 9, 3, shade(c, 0.12));
  for (let i = 1; i < 4; i++) b += line(x + (w / 4) * i, y - h + 8, x + (w / 4) * i, y - 6, shade(c, 0.12), 1.4, 'opacity=".5"');
  if (kind === "recycle") {
    const cx = x + w / 2;
    const cy = y - h / 2;
    const r = Math.min(w, h) * 0.24;
    let sym = "";
    for (const a of [0, 120, 240]) {
      const a0 = rad(a - 50);
      const a1 = rad(a + 40);
      const [x0, y0] = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
      const [x1, y1] = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
      const t = [-Math.sin(a1), Math.cos(a1)];
      const n = [Math.cos(a1), Math.sin(a1)];
      const k = r * 0.42;
      sym += stroke(`M${f(x0)} ${f(y0)} A${f(r)} ${f(r)} 0 0 1 ${f(x1)} ${f(y1)}`, "#ffffff", r * 0.26) + poly([[x1 + n[0] * k, y1 + n[1] * k], [x1 - n[0] * k, y1 - n[1] * k], [x1 + t[0] * k * 1.3, y1 + t[1] * k * 1.3]], "#ffffff");
    }
    b += circle(cx, cy, r + 9, light(c, 0.15), 'opacity=".5"') + sym;
  }
  return b;
}

/** Lunch tray (top seen at a slant) with food; centred at x, resting on y. */
export function tray(x, y, w = 50, { seed = 1 } = {}) {
  const R = rng(seed);
  const foods = [["#e6c07a", "#d6a85a"], [P.green, P.leafDark], [P.orange, shade(P.orange, 0.2)], ["#f2e6c8", "#dccfae"]];
  const a = foods[Math.floor(R() * 4)];
  const c = foods[(Math.floor(R() * 4) + 1) % 4];
  return g(
    ellipse(x, y + 1, w * 0.55, 4, "#1c2f4a", 'opacity=".15"') +
      path(`M${f(x - w / 2)} ${f(y)} L${f(x - w / 2 + 5)} ${f(y - 10)} H${f(x + w / 2 - 5)} L${f(x + w / 2)} ${f(y)}Z`, "#9bc4b8") +
      rect(x - w / 2, y - 1, w, 3, shade("#9bc4b8", 0.25)) +
      ellipse(x - w * 0.2, y - 6, w * 0.16, 3.5, a[1]) + ellipse(x - w * 0.2, y - 7, w * 0.13, 2.6, a[0]) +
      ellipse(x + w * 0.18, y - 6, w * 0.16, 3.5, c[1]) + ellipse(x + w * 0.18, y - 7, w * 0.12, 2.4, c[0]),
  );
}

/** Bed seen from the side; mattress top at y - 52 (ground at y). Headboard on the left. */
export function bed(x, y, w = 150, { blanket = P.teal } = {}) {
  return g(
    contact(x + w / 2, y, w * 0.55, 5, 0.18) +
      rrect(x, y - 96, 14, 96, 4, P.woodDark) +
      rect(x + w - 10, y - 50, 10, 50, P.woodDark) +
      rect(x + 10, y - 40, w - 16, 18, P.wood) +
      rrect(x + 10, y - 54, w - 18, 16, 6, "#f4f1ea") +
      rrect(x + 16, y - 66, 34, 14, 7, "#ffffff"),
  );
}
/** Blanket over a bed, drawn after the sleeper; covers from xa to the bed foot. */
export const blanket = (x, y, w, color = P.teal) =>
  g(path(`M${f(x)} ${f(y - 52)} Q${f(x + 10)} ${f(y - 66)} ${f(x + 34)} ${f(y - 64)} L${f(x + w)} ${f(y - 60)} Q${f(x + w + 6)} ${f(y - 46)} ${f(x + w + 2)} ${f(y - 30)} L${f(x - 4)} ${f(y - 30)}Z`, color) + path(`M${f(x + w * 0.5)} ${f(y - 62)} L${f(x + w)} ${f(y - 60)} Q${f(x + w + 6)} ${f(y - 46)} ${f(x + w + 2)} ${f(y - 30)} L${f(x + w * 0.5)} ${f(y - 30)}Z`, shade(color, 0.15), 'opacity=".6"') + rect(x - 2, y - 58, 18, 26, light(color, 0.25), 'opacity=".5"'));

/** Alarm clock with bells; ringing adds shake lines. Ground (table top) at y. */
export function alarmClock(x, y, s = 1, { ringing = true } = {}) {
  let b = circle(-8, -27, 5, P.gold) + circle(8, -27, 5, P.gold) + line(-7, 0, -9, -4, P.ink, 2.4) + line(7, 0, 9, -4, P.ink, 2.4) + circle(0, -15, 12, P.coral) + circle(0, -15, 9, "#ffffff") + line(0, -15, 0, -21, P.ink, 1.8) + line(0, -15, 4, -13, P.ink, 1.8);
  if (ringing) b += stroke("M-17 -30 q-4 6 0 12M-22 -33 q-6 9 0 18M17 -30 q4 6 0 12M22 -33 q6 9 0 18", P.coral, 1.8);
  return tr(x, y, b, s);
}

/** Nightstand; top at y - 46. */
export const nightstand = (x, y, w = 40) => g(contact(x + w / 2, y, w * 0.55, 4, 0.18) + rect(x, y - 44, w, 44, P.wood) + rect(x - 2, y - 48, w + 4, 6, light(P.wood, 0.15)) + rect(x + 5, y - 34, w - 10, 12, shade(P.wood, 0.1)) + circle(x + w / 2, y - 28, 1.8, P.goldLight));

/** Pedestal bathroom sink with mirror above; basin rim at y - 74. */
export function sink(x, y) {
  return g(
    contact(x, y, 22, 4, 0.2) +
      rrect(x - 9, y - 70, 18, 70, 6, "#eef1f3") + rect(x + 2, y - 70, 7, 70, "#d7dde2") +
      path(`M${f(x - 30)} ${f(y - 78)} H${f(x + 30)} Q${f(x + 28)} ${f(y - 58)} ${f(x)} ${f(y - 58)} Q${f(x - 28)} ${f(y - 58)} ${f(x - 30)} ${f(y - 78)}Z`, "#ffffff") +
      rect(x - 30, y - 80, 60, 5, "#e6eaed") +
      rect(x - 2, y - 92, 4, 12, "#aeb7c1") + rect(x - 2, y - 92, 12, 4, "#aeb7c1"),
  );
}
export const mirror = (x, y, w = 56, h = 70) => g(rrect(x - w / 2 - 4, y - 4, w + 8, h + 8, 10, "#d7dde2") + rrect(x - w / 2, y, w, h, 8, vgrad([[0, "#e6f3f7"], [1, "#bcd9e4"]])) + path(`M${f(x - w / 2 + 8)} ${f(y + h - 10)} L${f(x + w / 2 - 14)} ${f(y + 10)}`, "none", `stroke="#ffffff" stroke-width="5" opacity=".55"`));

/** Cereal bowl on a table top at y. */
export const cerealBowl = (x, y, s = 1) => tr(x, y, ellipse(0, -9, 14, 3.5, "#e7b25a") + circle(-5, -10, 2, "#c98a35") + circle(3, -11, 2, "#d99b45") + circle(7, -9.5, 1.8, "#c98a35") + path("M-15 -9 Q-14 1 0 1 Q14 1 15 -9Z", "#ffffff") + path("M3 -9 Q12 -9 15 -9 Q14 1 0 1Z", "#dfe5ea", 'opacity=".8"'), s);

/** Bus-stop sign on a pole with a bus pictogram; ground at y. */
export function busStopSign(x, y, h = 150) {
  return g(contact(x, y, 10, 2.5, 0.2) + rect(x - 2.5, y - h, 5, h, "#7d8893") + rrect(x - 18, y - h - 30, 36, 34, 6, "#ffffff") + rrect(x - 16, y - h - 28, 32, 30, 5, P.navy) + rrect(x - 10, y - h - 22, 20, 14, 3, P.yellow) + rect(x - 7, y - h - 20, 14, 5, "#cfe9f2") + circle(x - 5, y - h - 7, 2.4, P.ink) + circle(x + 5, y - h - 7, 2.4, P.ink));
}

/** Food-service counter with steam trays; top at y - h. */
export function servingCounter(x, y, w, h = 70) {
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.18) + rect(x, y - h, w, h, "#a9b4bf") + rect(x, y - h, w, 8, "#cdd5dc") + rect(x + w * 0.75, y - h + 8, w * 0.25, h - 8, "#93a0ac", 'opacity=".6"');
  const pans = [["#e6c07a"], [P.green], [P.orange]];
  pans.forEach(([c], i) => {
    const px = x + 12 + i * ((w - 24) / 3);
    const pw = (w - 24) / 3 - 8;
    b += rect(px, y - h - 4, pw, 6, "#dfe5ea") + ellipse(px + pw / 2, y - h - 4, pw / 2 - 2, 3, c);
  });
  b += rect(x - 4, y - h - 52, w + 8, 4, "#c7d0d8", 'opacity=".8"') + rect(x + 6, y - h - 50, 3, 46, "#c7d0d8", 'opacity=".8"') + rect(x + w - 9, y - h - 50, 3, 46, "#c7d0d8", 'opacity=".8"') + rect(x, y - h - 48, w, 44, "#e9f5f8", 'opacity=".25"');
  return b;
}

/** Open umbrella: shaft from the hand (hx, hy) to the canopy tip; canopy tilts with the shaft. */
export function umbrellaHeld(hx, hy, tipX, tipY, r = 70, color = P.blue) {
  const a = (Math.atan2(tipX - hx, hy - tipY) * 180) / Math.PI;
  const L = Math.hypot(tipX - hx, tipY - hy);
  // drawn upright with the hand at 0,0 and the tip at 0,-L, then rotated
  const top = -L;
  const rim = top + r * 0.62;
  const n = 4;
  let scal = "";
  for (let i = 0; i < n; i++) scal += ` Q${f(r - (2 * r * (i + 0.5)) / n)} ${f(rim - r * 0.16)} ${f(r - (2 * r * (i + 1)) / n)} ${f(rim)}`;
  const dome = `M${f(-r)} ${f(rim)} C${f(-r)} ${f(top - r * 0.05)} ${f(r)} ${f(top - r * 0.05)} ${f(r)} ${f(rim)}${scal}Z`;
  let b = stroke(`M0 0 V${f(top + 4)}`, "#3c4652", 2.6) + stroke("M0 0 v6 q0 6 -6 6 q-5 0 -5 -5", "#3c4652", 3);
  b += path(dome, color);
  b += `<clipPath id="uc${Math.round(hx)}${Math.round(hy)}"><path d="${dome}"/></clipPath>`;
  b += `<g clip-path="url(#uc${Math.round(hx)}${Math.round(hy)})">${rect(r * 0.05, top - r, r, r * 2, shade(color, 0.2), 'opacity=".6"')}${ellipse(-r * 0.45, top + r * 0.18, r * 0.35, r * 0.14, light(color, 0.45), 'opacity=".55" transform="rotate(-18 ' + f(-r * 0.45) + " " + f(top + r * 0.18) + ')"')}</g>`;
  b += stroke(`M0 ${f(top)} Q${f(-r * 0.45)} ${f(top + r * 0.2)} ${f(-r * 0.5)} ${f(rim - r * 0.08)}M0 ${f(top)} Q${f(r * 0.45)} ${f(top + r * 0.2)} ${f(r * 0.5)} ${f(rim - r * 0.08)}`, shade(color, 0.3), 1.4, 'opacity=".6"');
  b += circle(0, top - 3, 3, "#3c4652");
  return `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${f(a)})">${b}</g>`;
}

/** Rain hat (sou'wester) over a head. */
export function rainHat([hx, y0], r, color = P.yellow, fc = 1) {
  const hy = y0 - r * 0.32;
  return g(
    path(`M${f(hx - r * 1.5)} ${f(hy - r * 0.05)} Q${f(hx)} ${f(hy - r * 0.55)} ${f(hx + r * 1.5)} ${f(hy - r * 0.05)} Q${f(hx + r * 1.3)} ${f(hy + r * 0.35)} ${f(hx + r * 1.1)} ${f(hy + r * 0.2)} Q${f(hx)} ${f(hy - r * 0.2)} ${f(hx - r * 1.1)} ${f(hy + r * 0.2)} Q${f(hx - r * 1.3)} ${f(hy + r * 0.35)} ${f(hx - r * 1.5)} ${f(hy - r * 0.05)}Z`, shade(color, 0.14)) +
      path(`M${f(hx - r * 1.02)} ${f(hy - r * 0.25)} Q${f(hx - r * 1.05)} ${f(hy - r * 1.35)} ${f(hx)} ${f(hy - r * 1.32)} Q${f(hx + r * 1.05)} ${f(hy - r * 1.35)} ${f(hx + r * 1.02)} ${f(hy - r * 0.25)} Q${f(hx)} ${f(hy - r * 0.45)} ${f(hx - r * 1.02)} ${f(hy - r * 0.25)}Z`, color) +
      path(`M${f(hx + r * 0.2)} ${f(hy - r * 1.3)} Q${f(hx + r * 1.05)} ${f(hy - r * 1.3)} ${f(hx + r * 1.02)} ${f(hy - r * 0.25)} Q${f(hx + r * 0.6)} ${f(hy - r * 0.38)} ${f(hx + r * 0.3)} ${f(hy - r * 0.4)}Z`, shade(color, 0.12), 'opacity=".7"') +
      ellipse(hx - fc * r * 0.4, hy - r * 1.0, r * 0.3, r * 0.12, light(color, 0.5), 'opacity=".7"'),
  );
}

/* ------------------------------------------------------------------ kitchen */

/** A plate seen at a slant; (x, y) is its centre on the counter. */
export const plate = (x, y, rx = 70) => g(ellipse(x, y + 5, rx + 4, rx * 0.3, "#1c2f4a", 'opacity=".14"') + ellipse(x, y, rx, rx * 0.3, "#ffffff") + ellipse(x, y - 1, rx * 0.72, rx * 0.2, "#eef2f5") + ellipse(x, y + 1, rx * 0.72, rx * 0.2, "none", `stroke="#d9e1e7" stroke-width="1.2"`));

// Bread-slice outline (crown top) in a unit box -1..1, squashed for the table view.
const SLICE = (w, k = 0.45) => {
  const h = w * k;
  return `M${f(-w * 0.46)} ${f(h * 0.5)} L${f(-w * 0.46)} ${f(-h * 0.2)} C${f(-w * 0.62)} ${f(-h * 0.55)} ${f(-w * 0.4)} ${f(-h * 0.85)} ${f(-w * 0.2)} ${f(-h * 0.72)} C${f(-w * 0.1)} ${f(-h * 0.95)} ${f(w * 0.1)} ${f(-h * 0.95)} ${f(w * 0.2)} ${f(-h * 0.72)} C${f(w * 0.4)} ${f(-h * 0.85)} ${f(w * 0.62)} ${f(-h * 0.55)} ${f(w * 0.46)} ${f(-h * 0.2)} L${f(w * 0.46)} ${f(h * 0.5)}Z`;
};
/** A slice of bread lying flat, centred at (x, y). */
export function breadSlice(x, y, w = 56) {
  const d = SLICE(w);
  return tr(x, y, path(d, "#b8793c", 'transform="translate(0 4)"') + path(d, "#c98a45") + path(d, "#f1d39a", `transform="scale(.84)"`) + ellipse(-w * 0.12, -w * 0.06, w * 0.16, w * 0.05, "#fbe8bd", 'opacity=".7"'));
}
/** Cheese slice and lettuce leaf lying on a bread slice centred at (x, y). */
export function cheeseLettuce(x, y, w = 56) {
  let lettuce = "";
  for (let i = 0; i < 9; i++) {
    const a = rad(i * 40);
    lettuce += ellipse(Math.cos(a) * w * 0.4, Math.sin(a) * w * 0.17 - 2, w * 0.15, w * 0.08, i % 2 ? P.leaf : P.leafLight);
  }
  const ch = w * 0.36;
  const cheese = poly([[-ch, -ch * 0.35 - 4], [ch * 0.9, -ch * 0.45 - 4], [ch, ch * 0.32 - 4], [-ch * 0.9, ch * 0.42 - 4]], P.goldLight) + poly([[-ch, ch * 0.42 - 4], [ch, ch * 0.32 - 4], [ch, ch * 0.32], [-ch * 0.9, ch * 0.42]], P.gold) + ellipse(-ch * 0.3, -6, 3, 1.5, P.gold) + ellipse(ch * 0.4, -2, 2.4, 1.2, P.gold) + ellipse(0, -9, 2, 1, P.gold);
  return tr(x, y, ellipse(0, -1, w * 0.48, w * 0.2, P.leafDark) + lettuce + cheese);
}
/** One half of a sandwich cut corner to corner: a stacked triangle. side = -1 (left half) or 1. */
export function sandwichHalf(x, y, w = 56, side = -1) {
  const hw = w * 0.46;
  const hh = w * 0.22;
  const tri = side < 0 ? [[-hw, -hh], [hw, -hh], [-hw, hh]] : [[hw, -hh], [hw, hh], [-hw, hh]];
  const lay = (dy, c, grow = 0) => poly(tri.map(([px, py]) => [px * (1 + grow), py * (1 + grow) + dy]), c);
  return tr(x, y, lay(5, "#b8793c") + lay(0, "#d9a45e") + lay(-4, P.leafDark, 0.12) + lay(-6, P.leaf, 0.1) + lay(-9, P.gold, 0.04) + lay(-11, P.goldLight, 0.02) + lay(-14, "#b8793c") + lay(-18, "#c98a45") + lay(-18, "#e9c07f", -0.25));
}
export const butterKnife = (x, y, s = 1, rot = -8) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})">${rrect(-30, -3, 24, 6, 3, P.woodDark)}${path("M-6 -2.5 H26 Q32 -2 30 2 L-6 2.5Z", "#c7d0d8")}${line(-4, -1, 24, -1, "#ffffff", 1, 'opacity=".6"')}</g>`;

/** Kitchen backdrop inside a panel: tiled wall, window light, counter from cy down. */
export function kitchenBack(x, y, w, h, cy) {
  let tiles = "";
  for (let yy = y + 18; yy < cy; yy += 22) tiles += `M${x} ${yy}H${x + w}`;
  for (let xx = x + 11; xx < x + w; xx += 22) tiles += `M${xx} ${y}V${cy}`;
  return g(
    rect(x, y, w, cy - y, vgrad([[0, "#f5ecdc"], [1, "#efe2cc"]])) +
      stroke(tiles, "#e2d3ba", 1) +
      rect(x, cy - 6, w, 8, P.woodLight) +
      rect(x, cy + 2, w, y + h - cy, vgrad([[0, "#c99a6b"], [1, "#a8784f"]])) +
      stroke(`M${x} ${cy + 40}H${x + w}M${x} ${cy + 90}H${x + w}`, "#9c6e47", 1, 'opacity=".4"'),
  );
}
