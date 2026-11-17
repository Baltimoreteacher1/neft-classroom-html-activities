// Illustrator A helpers: props and diagram pieces the shared kit does not have.
// Same art direction as kit.mjs: no outlines, lit/shade sides, soft contact shadows.
import { P, g, tr, rect, rrect, circle, ellipse, path, poly, line, stroke, contact, shade, light, haze, mix, vgrad, rgrad, rng, text, tag } from "../../../access-practice-lab/src/art/kit.js";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const rad = (a) => (a * Math.PI) / 180;

/* ------------------------------------------------------------------ fraction model */

/**
 * A fraction circle: n equal slices, the first k (clockwise from 12 o'clock) shaded.
 * Dividers stay crisp and dark on purpose: counting equal parts is the task.
 */
export function fracCircle(n, k, { cx = 320, cy = 200, r = 150 } = {}) {
  let s = rect(0, 0, 640, 400, rgrad([[0, "#fffaf0"], [1, "#efe6d4"]], { cx: 0.5, cy: 0.45, r: 0.75 }));
  s += circle(cx + 6, cy + 12, r + 4, "#1c2f4a", 'opacity=".12"');
  s += circle(cx, cy, r + 10, "#fffdf8") + circle(cx, cy, r + 10, "none", `stroke="${P.stoneDark}" stroke-opacity=".35" stroke-width="1.5"`);
  const on = vgrad([[0, light(P.teal, 0.12)], [1, shade(P.teal, 0.08)]]);
  const off = vgrad([[0, "#ffffff"], [1, "#f3eee4"]]);
  let lines = "";
  for (let i = 0; i < n; i++) {
    const a0 = rad(-90 + (360 / n) * i);
    const a1 = rad(-90 + (360 / n) * (i + 1));
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    s += path(`M${cx} ${cy}L${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}Z`, i < k ? on : off);
    lines += `M${cx} ${cy}L${f(x0)} ${f(y0)}`;
  }
  // soft sheen on the upper-left of the disc
  s += path(`M${f(cx - r * 0.82)} ${f(cy - r * 0.2)}A${r * 0.86} ${r * 0.86} 0 0 1 ${f(cx - r * 0.2)} ${f(cy - r * 0.82)}`, "none", `stroke="#ffffff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"`);
  s += stroke(lines, P.navy, 4.5);
  s += circle(cx, cy, r, "none", `stroke="${P.navy}" stroke-width="5.5"`);
  s += circle(cx, cy, 4, P.navy);
  return s;
}

/* ------------------------------------------------------------------ nature */

export function cactus(x, y, s = 1) {
  const c = "#5f9a5a";
  const d = shade(c, 0.25);
  let b = contact(0, 0, 26, 5, 0.22);
  const arm = (dir, h0, h1) =>
    stroke(`M${dir * 10} ${-h0} H${dir * 26} V${-h1}`, c, 16) + stroke(`M${dir * 30} ${-h0 + 4} V${-h1}`, d, 5, 'opacity=".55"');
  b += arm(-1, 52, 96) + arm(1, 70, 118);
  b += rrect(-13, -150, 26, 150, 13, c) + rrect(3, -150, 10, 150, 6, d, 'opacity=".55"');
  b += stroke("M-5 -140 V-6M4 -140 V-6", light(c, 0.25), 1.6, 'opacity=".7"');
  b += circle(0, -150, 5, P.pink) + circle(-26, -98, 4, P.pink);
  return tr(x, y, b, s);
}

export function rock(x, y, w = 40, h = 18, c = "#c99d6b") {
  return g(contact(x, y, w * 0.6, 4, 0.2) + path(`M${x - w / 2} ${y} Q${x - w / 2} ${y - h} ${x - w * 0.1} ${y - h} Q${x + w / 2} ${y - h * 1.05} ${x + w / 2} ${y}Z`, c) + path(`M${x + w * 0.05} ${y - h} Q${x + w / 2} ${y - h * 1.05} ${x + w / 2} ${y}H${x + w * 0.1}Z`, shade(c, 0.2), 'opacity=".6"'));
}

export function lilyPad(x, y, r = 16, { bloom = false } = {}) {
  const c = "#5d9b52";
  const ry = r * 0.45;
  const pt = (deg) => [x + Math.cos(rad(deg)) * r, y + Math.sin(rad(deg)) * ry];
  const [ax, ay] = pt(-28);
  const [bx, by] = pt(-6);
  let b = ellipse(x, y + 2, r, ry, shade(c, 0.35), 'opacity=".45"');
  b += path(`M${x} ${y}L${f(ax)} ${f(ay)}A${r} ${f(ry)} 0 1 0 ${f(bx)} ${f(by)}Z`, c);
  b += ellipse(x - r * 0.25, y - ry * 0.25, r * 0.5, ry * 0.4, light(c, 0.25), 'opacity=".55"');
  if (bloom) {
    const fx = x - r * 0.2;
    for (const a of [-60, -30, 30, 60, 0]) b += ellipse(fx, y - 7, 3.4, 8, a === 0 ? "#ffffff" : P.pink, `transform="rotate(${a} ${f(fx)} ${y - 2})"`);
    b += circle(fx, y - 5, 2.4, P.goldLight);
  }
  return g(b);
}

export function reeds(x, y, s = 1, { seed = 3 } = {}) {
  const R = rng(seed);
  let b = "";
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 6 + R() * 3;
    const h = 60 + R() * 40;
    const lean = (R() - 0.5) * 14;
    b += stroke(`M${f(dx)} 0 Q${f(dx + lean * 0.3)} ${f(-h * 0.5)} ${f(dx + lean)} ${f(-h)}`, i % 2 ? P.leafDark : P.leaf, 2.6);
    if (i % 2 === 0) b += rrect(dx + lean - 3.5, -h - 4, 7, 20, 3.5, "#7a4e2c");
  }
  b += path("M-16 0 Q-22 -30 -30 -44 Q-14 -26 -8 0Z", P.leaf) + path("M14 0 Q22 -34 32 -50 Q16 -26 8 0Z", P.leafDark);
  return tr(x, y, b, s);
}

/** Mountain with optional snow cap; base on y. */
export function mountain(x, y, w, h, { color = "#7a9f8a", snow = true } = {}) {
  const top = [x, y - h];
  let b = poly([[x - w / 2, y], top, [x + w / 2, y]], color);
  b += poly([top, [x + w / 2, y], [x + w * 0.06, y]], shade(color, 0.18), 'opacity=".8"');
  if (snow) {
    const sh = h * 0.26;
    const sw = (w / 2) * (sh / h);
    b += path(`M${f(top[0])} ${f(top[1])}L${f(x + sw)} ${f(top[1] + sh)} l-10 -6 l-9 8 l-10 -9 l-9 7 L${f(x - sw)} ${f(top[1] + sh)}Z`, "#f7fbfd");
    b += path(`M${f(top[0])} ${f(top[1])}L${f(x + sw)} ${f(top[1] + sh)} l-10 -6 l-9 8 L${f(x + 4)} ${f(top[1] + sh * 0.7)}Z`, "#d9e7ef");
  }
  return b;
}

/* ------------------------------------------------------------------ garden & food */

/** Watering can held by its rear handle at the hand (0,0), tipped forward to pour. 100-unit person space. */
export function wateringCan(c = "#3f9a52", tilt = 15, size = 1) {
  const d = shade(c, 0.22);
  const body =
    stroke("M2 -10 Q-6 -4 0 6", d, 4) +
    path("M30 6 L60 -14 L63 -10 L36 14Z", c) +
    path("M58 -20 L68 -13 L62 -4 L54 -10Z", d) +
    path("M0 -12 H32 Q36 -12 36 -8 V22 Q18 27 0 22Z", c) +
    path("M22 -12 H32 Q36 -12 36 -8 V22 Q29 25 22 24Z", d, 'opacity=".55"') +
    rect(0, -12, 36, 4, light(c, 0.3)) +
    stroke("M0 -10 Q-10 -12 -10 4 Q-10 14 0 14", d, 4);
  return `<g transform="rotate(${tilt}) scale(${size})">${body}</g>`;
}

export function tomatoPlant(x, y, s = 1, { seed = 2, n = 5 } = {}) {
  const R = rng(seed);
  let b = contact(0, 0, 26, 5, 0.2);
  b += line(14, 0, 14, -96, P.woodDark, 3);
  b += stroke("M0 0 Q-2 -40 4 -86M0 -30 Q-14 -40 -22 -52M2 -52 Q16 -60 22 -74", P.leafDark, 3);
  const leaves = [[-20, -54], [20, -74], [-8, -80], [10, -40], [-16, -30], [6, -92], [24, -50]];
  for (const [lx, ly] of leaves) b += ellipse(lx, ly, 12, 7, shade(P.leaf, 0.08), `transform="rotate(${f((R() - 0.5) * 60)} ${lx} ${ly})"`);
  for (const [lx, ly] of leaves) b += ellipse(lx - 2, ly - 2, 8, 4, P.leafLight, `opacity=".7" transform="rotate(${f((R() - 0.5) * 60)} ${lx} ${ly})"`);
  const fruit = [[-12, -42], [8, -58], [-4, -66], [16, -30], [-18, -64], [12, -86]].slice(0, n);
  for (const [fx, fy] of fruit) b += circle(fx, fy, 8.5, P.red) + circle(fx + 2, fy + 2, 6, shade(P.red, 0.18), 'opacity=".5"') + circle(fx - 2.4, fy - 2.4, 2, "#ffffff", 'opacity=".6"') + path(`M${fx - 3} ${fy - 6} l3 2 l3 -2`, "none", `stroke="${P.leafDark}" stroke-width="1.6"`);
  return tr(x, y, b, s);
}

export function apple(x, y, r = 8, c = P.red) {
  return g(circle(x, y, r, c) + circle(x + r * 0.3, y + r * 0.25, r * 0.7, shade(c, 0.18), 'opacity=".5"') + circle(x - r * 0.35, y - r * 0.35, r * 0.25, "#ffffff", 'opacity=".55"') + line(x, y - r * 0.8, x + 1.5, y - r * 1.35, P.barkDark, 1.6) + ellipse(x + r * 0.45, y - r * 1.05, r * 0.3, r * 0.14, P.leaf));
}

export function corn(x, y, s = 1, rot = 0) {
  let b = path("M0 -34 Q9 -30 8 0 Q0 6 -8 0 Q-9 -30 0 -34Z", P.yellow);
  for (let r = -28; r < 0; r += 6) b += stroke(`M-6 ${r} Q0 ${r + 2} 6 ${r}`, shade(P.yellow, 0.2), 1.2, 'opacity=".6"');
  b += path("M-8 0 Q-16 -18 -12 -36 Q-6 -16 0 4Z", P.leaf) + path("M8 0 Q16 -18 12 -34 Q6 -16 0 4Z", P.leafDark);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})">${b}</g>`;
}

/** Wooden crate front at (x, y=bottom). */
export function crate(x, y, w, h, c = P.wood) {
  return g(rect(x, y - h, w, h, c) + rect(x, y - h, w, 5, light(c, 0.25)) + rect(x, y - h * 0.5, w, 3, shade(c, 0.22)) + rect(x + w - 8, y - h, 8, h, shade(c, 0.15)));
}

/** Woven basket at hand (handle at 0,0), 100-unit person space. */
export function basket(c = "#c8934f") {
  const d = shade(c, 0.25);
  return stroke("M-14 6 Q-14 -12 0 -12 Q14 -12 14 6", d, 3) + path("M-17 4 H17 L13 24 Q0 27 -13 24Z", c) + stroke("M-15 11 H15M-14 17 H14", d, 1.4, 'opacity=".7"') + stroke("M-8 5 V24M0 5 V25M8 5 V24", d, 1.2, 'opacity=".45"') + rect(-17, 3, 34, 3.5, light(c, 0.25));
}

/* ------------------------------------------------------------------ lemonade */

export function pitcher(x, y, s = 1) {
  const glass = "#e9f4f6";
  let b = contact(0, 0, 16, 3, 0.2);
  b += stroke("M12 -34 Q26 -30 22 -14 Q20 -8 12 -8", "#cfe1e6", 4);
  b += path("M-13 0 L-12 -40 L-16 -46 H12 L13 0Z", glass, 'opacity=".9"');
  b += path("M-12 -2 L-11.5 -30 H12.4 L12.6 -2Z", P.goldLight);
  b += path("M4 -2 V-30 H12.4 L12.6 -2Z", P.gold, 'opacity=".45"');
  b += circle(-3, -18, 5, "#f7e27a") + circle(-3, -18, 3.4, "#fbf0a8");
  b += rect(-10, -38, 3, 34, "#ffffff", 'opacity=".55"');
  return tr(x, y, b, s);
}

export function paperCup(x, y, s = 1, { full = false } = {}) {
  let b = contact(0, 0, 7, 1.6, 0.18) + path("M-7 -18 H7 L5 0 H-5Z", "#ffffff") + path("M2 -18 H7 L5 0 H1Z", "#dfe6ea") + rect(-7, -18, 14, 2.4, "#e8eef1");
  b += path("M-6 -12 H6 L5.4 -7 H-5.4Z", P.coralLight, 'opacity=".55"');
  if (full) b += ellipse(0, -17, 6, 1.6, P.goldLight);
  return tr(x, y, b, s);
}

export function coinJar(x, y, s = 1) {
  let b = contact(0, 0, 14, 3, 0.2);
  b += path("M-12 0 Q-14 -10 -12 -28 H12 Q14 -10 12 0Z", "#d3e7ee", 'opacity=".9"');
  b += path("M4 0 Q7 -10 5 -28 H12 Q14 -10 12 0Z", "#b4cfd9", 'opacity=".7"');
  const coins = [[-6, -4], [4, -4], [0, -9], [-7, -12], [6, -12], [-1, -16]];
  for (const [cx, cy] of coins) b += ellipse(cx, cy, 5.5, 2.4, P.gold) + ellipse(cx, cy - 0.6, 4, 1.4, P.goldLight);
  b += rect(-12, -34, 24, 7, "#8a96a3", 'rx="2"') + rect(-9, -26, 3, 22, "#ffffff", 'opacity=".6"');
  b += path("M-12 0 Q-14 -10 -12 -28 H12 Q14 -10 12 0Z", "none", 'stroke="#8fb0bd" stroke-width="1.4"');
  return tr(x, y, b, s);
}

/* ------------------------------------------------------------------ indoors */

export function rug(x, y, rx, ry) {
  return g(
    ellipse(x, y + 3, rx + 2, ry + 2, "#1c2f4a", 'opacity=".12"') +
      ellipse(x, y, rx, ry, P.coral) +
      ellipse(x, y, rx * 0.8, ry * 0.76, P.orange) +
      ellipse(x, y, rx * 0.56, ry * 0.52, P.goldLight) +
      ellipse(x, y, rx * 0.3, ry * 0.26, P.tealLight),
  );
}

export function door(x, y, w = 70, h = 150, c = "#6fa08f") {
  return g(rect(x - 6, y - h - 6, w + 12, h + 6, P.ivory) + rect(x, y - h, w, h, c) + rect(x + w * 0.66, y - h, w * 0.34, h, shade(c, 0.12), 'opacity=".6"') + rect(x + 14, y - h + 16, w - 28, 34, vgrad([[0, "#cfe9f2"], [1, "#9cc7d9"]])) + circle(x + w - 12, y - h * 0.45, 3.5, P.goldLight) + rect(x + 10, y - h * 0.62, w - 20, 3, shade(c, 0.15)));
}

/** Cubby shelf (cols × rows) with coats hanging in some cubbies; ground at y. */
export function cubbies(x, y, w, h, { cols = 3, rows = 3, fill = [] } = {}) {
  const c = P.woodLight;
  let b = contact(x + w / 2, y, w * 0.55, 5, 0.18) + rect(x, y - h, w, h, c) + rect(x + w - 8, y - h, 8, h, shade(c, 0.15));
  const cw = (w - 8) / cols;
  const ch = (h - 8) / rows;
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const cx = x + 4 + k * cw;
      const cy = y - h + 4 + r * ch;
      b += rect(cx + 2, cy + 2, cw - 4, ch - 4, shade(c, 0.32));
      const item = fill[r * cols + k];
      if (item === "coat") {
        const col = [P.coral, P.blue, P.gold, P.teal, P.purple][(r * cols + k) % 5];
        b += circle(cx + cw / 2, cy + 6, 2, "#9aa3ad") + path(`M${f(cx + cw / 2 - 8)} ${f(cy + 8)} H${f(cx + cw / 2 + 8)} L${f(cx + cw / 2 + 11)} ${f(cy + ch - 4)} H${f(cx + cw / 2 - 11)}Z`, col) + line(cx + cw / 2, cy + 9, cx + cw / 2, cy + ch - 5, shade(col, 0.3), 1.4);
      } else if (item === "bag") {
        const col = [P.green, P.orange, P.navy][(r + k) % 3];
        b += rrect(cx + cw / 2 - 10, cy + ch - 26, 20, 22, 5, col) + rrect(cx + cw / 2 - 6, cy + ch - 16, 12, 8, 3, shade(col, 0.2));
      }
    }
  return b;
}

/* ------------------------------------------------------------------ map */

const ICON = {
  star: (x, y, r, c = P.gold) =>
    poly(Array.from({ length: 10 }, (_, i) => {
      const a = rad(-90 + i * 36);
      const rr = i % 2 ? r * 0.45 : r;
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
    }), c),
  heart: (x, y, r, c = P.red) => path(`M${x} ${f(y + r * 0.85)} C${f(x - r * 1.5)} ${f(y - r * 0.1)} ${f(x - r * 0.7)} ${f(y - r * 1.1)} ${x} ${f(y - r * 0.4)} C${f(x + r * 0.7)} ${f(y - r * 1.1)} ${f(x + r * 1.5)} ${f(y - r * 0.1)} ${x} ${f(y + r * 0.85)}Z`, c),
  moon: (x, y, r, c = P.gold, bg = "#ffffff") => circle(x, y, r, c) + circle(x + r * 0.5, y - r * 0.28, r * 0.82, bg),
  sun: (x, y, r, c = P.orange) => {
    let s = "";
    for (let i = 0; i < 8; i++) {
      const a = rad(i * 45);
      s += line(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, x + Math.cos(a) * r, y + Math.sin(a) * r, c, r * 0.18);
    }
    return s + circle(x, y, r * 0.48, P.yellow);
  },
};
export const icon = (kind, x, y, r, c) => ICON[kind](x, y, r, c);

/** A round sign disc with an icon. */
export function emblem(kind, x, y, r = 18, { ring = P.ivory, fill = "#ffffff", color } = {}) {
  return g(circle(x, y + 2, r + 3, "#1c2f4a", 'opacity=".18"') + circle(x, y, r + 3, ring) + circle(x, y, r, fill) + icon(kind, x, y, r * 0.66, color));
}

/** A map building seen from the front with a little roof depth; ground at y. */
export function mapBuilding(x, y, w, h, { color = P.teal, roof, windows = 3, door: hasDoor = true, label = "", sign = null, signColor } = {}) {
  const rc = roof || shade(color, 0.3);
  let b = contact(x + w / 2, y + 1, w * 0.56, 5, 0.22);
  b += poly([[x - 4, y - h], [x + 6, y - h - 12], [x + w - 6, y - h - 12], [x + w + 4, y - h]], rc);
  b += rect(x, y - h, w, h, color) + rect(x + w * 0.74, y - h, w * 0.26, h, shade(color, 0.14), 'opacity=".7"');
  const ww = 15;
  const gap = (w - windows * ww) / (windows + 1);
  const wy = y - 34;
  for (let i = 0; i < windows; i++) {
    const wx = x + gap + i * (ww + gap);
    if (hasDoor && Math.abs(wx + ww / 2 - (x + w / 2)) < 14) continue;
    b += rect(wx - 1.5, wy - 1.5, ww + 3, 19, light(color, 0.55)) + rect(wx, wy, ww, 16, vgrad([[0, "#d8eef5"], [1, "#9ccadc"]]));
  }
  if (hasDoor) b += rect(x + w / 2 - 9, y - 30, 18, 30, shade(color, 0.45)) + circle(x + w / 2 + 4, y - 15, 1.6, P.goldLight);
  if (sign) b += emblem(sign, x + w / 2, y - h + 26, 17, { color: signColor });
  if (label) b += tag(x + w / 2, y - h + 20, label, { size: 14 });
  return b;
}

/* ------------------------------------------------------------------ frog life cycle */

export function frogEggs(x, y, s = 1) {
  const pts = [[0, 0], [-14, -6], [14, -5], [-7, -16], [8, -15], [-20, 6], [20, 7], [-6, 10], [8, 11], [0, -26], [-18, -18], [18, -18], [26, -6], [-27, -6]];
  let b = "";
  for (const [ex, ey] of pts) b += circle(ex, ey, 8.5, "#e8f4ef", 'opacity=".85"') + circle(ex, ey, 8.5, "none", 'stroke="#b9d8cf" stroke-width="1.2"');
  for (const [ex, ey] of pts) b += circle(ex + 1, ey + 1, 3.6, "#2e3b33") + circle(ex - 2.6, ey - 2.8, 1.8, "#ffffff", 'opacity=".9"');
  return tr(x, y, b, s);
}

export function tadpole(x, y, s = 1, { legs = false } = {}) {
  const c = "#5b6a4a";
  let b = "";
  b += path("M8 -2 Q30 -14 52 -4 Q38 -2 52 6 Q30 10 8 4Z", light(c, 0.15), 'opacity=".9"');
  if (legs) {
    // two back legs (bent) and two front legs, all clearly visible
    const lg = "#6f8a4c";
    const back = (dx, c) => stroke(`M${4 + dx} 4 L${14 + dx} 14 L${4 + dx} 19`, c, 4.2) + ellipse(2 + dx, 20, 5, 2.2, c);
    b += back(-6, shade(lg, 0.25)) + back(2, lg);
    const front = (dx, c) => stroke(`M${-14 + dx} 8 L${-17 + dx} 17`, c, 3.4) + ellipse(-19 + dx, 18, 3.6, 1.8, c);
    b += front(-2, shade(lg, 0.25)) + front(4, lg);
  }
  b += ellipse(-6, 0, 18, 13, legs ? "#6f8a4c" : c);
  b += ellipse(-4, 5, 14, 6, shade(legs ? "#6f8a4c" : c, 0.25), 'opacity=".45"');
  b += circle(-15, -4, 3.4, "#ffffff") + circle(-15.6, -4, 2, P.ink);
  b += ellipse(-10, -8, 6, 2.5, "#ffffff", 'opacity=".3"');
  return tr(x, y, b, s);
}

export function frog(x, y, s = 1) {
  const c = "#5aa14f";
  const d = shade(c, 0.22);
  let b = contact(0, 0, 30, 6, 0.2);
  b += path("M-26 0 Q-36 -14 -18 -16 Q-10 -6 -6 0Z", d) + path("M26 0 Q36 -14 18 -16 Q10 -6 6 0Z", d);
  b += ellipse(0, -16, 24, 16, c);
  b += ellipse(0, -10, 15, 9, "#cfe6a6");
  b += path("M-14 -2 L-18 2 H-8Z M14 -2 L18 2 H8Z", d);
  b += ellipse(0, -30, 20, 12, c);
  b += circle(-11, -40, 7.5, c) + circle(11, -40, 7.5, c);
  b += circle(-11, -40, 4.6, "#ffffff") + circle(11, -40, 4.6, "#ffffff") + circle(-10, -40, 2.6, P.ink) + circle(12, -40, 2.6, P.ink);
  b += stroke("M-7 -26 Q0 -21 7 -26", d, 2);
  b += ellipse(-6, -34, 6, 2.4, "#ffffff", 'opacity=".3"');
  return tr(x, y, b, s);
}

/* ------------------------------------------------------------------ book */

/** An upright closed book with cover art; (x, y) is the bottom-left of the cover. */
export function bookCover(x, y, w, h, art, { color = P.navy } = {}) {
  let b = rect(x - 3, y - h + 3, w + 6, h, "#1c2f4a", 'opacity=".18"');
  b += rect(x, y - h, w, h, color) + rect(x, y - h, 6, h, shade(color, 0.3));
  b += rect(x + w - 2, y - h + 2, 4, h - 2, "#f3ede0");
  b += art;
  return g(b);
}
