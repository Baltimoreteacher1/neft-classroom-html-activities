// Illustrator C helpers: props and figure overlays the shared kit does not carry.
// Same art direction as kit.mjs: no outlines, lit/shade sides, soft contact shadows.
import { P, SKIN, g, tr, clipRect, rect, rrect, circle, ellipse, path, poly, line, stroke, contact, shade, light, mix, tag, text, vgrad, rng } from "../../../access-practice-lab/src/art/kit.js";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/* ------------------------------------------------------------ figure geometry */

const POSE_ARMS = {
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

/** World position of a person's hand (side 1 = front arm, -1 = back arm), matching kit person(). */
export function handAt(x, y, h, { pose = "stand", facing = 1, age = "child", side = 1 } = {}) {
  const child = age === "child";
  const headR = child ? 13 : 10.2;
  const shoulderY = -100 + headR * 2 + (child ? 3 : 4);
  const torsoW = child ? 15 : 16.5;
  const armLen = child ? 30 : 34;
  const hipY = child ? -44 : -48;
  const [a1, a2] = (POSE_ARMS[pose] || POSE_ARMS.stand)[side > 0 ? "ra" : "la"];
  let px = side * torsoW * 0.62;
  let py = shoulderY + 3;
  for (const a of [a1, a1 + a2]) {
    const r = (a * Math.PI) / 180;
    px += Math.sin(r) * (armLen / 2);
    py += Math.cos(r) * (armLen / 2);
  }
  const lift = pose === "sit" ? -hipY : 0;
  const s = h / 100;
  return [x + facing * px * s, y + (py + lift) * s];
}

/** Draw body (figure units, origin at the feet) with the same transform a standing person gets. */
export const overlay = (x, y, h, facing, body) =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(h / 100)})${facing < 0 ? " scale(-1 1)" : ""}">${body}</g>`;

/** Shorts over a standing child's hips (person drawn with bottom = skin). */
export const shorts = (color, age = "child") => {
  const hipY = age === "child" ? -44 : -48;
  const tw = age === "child" ? 15 : 16.5;
  return path(`M${f(-tw * 0.66)} ${f(hipY - 6)} H${f(tw * 0.66)} L${f(tw * 0.74)} ${f(hipY + 15)} H${f(tw * 0.08)} L0 ${f(hipY + 4)} L${f(-tw * 0.08)} ${f(hipY + 15)} H${f(-tw * 0.74)}Z`, color) + path(`M${f(tw * 0.2)} ${f(hipY - 6)} H${f(tw * 0.66)} L${f(tw * 0.74)} ${f(hipY + 15)} H${f(tw * 0.3)}Z`, shade(color, 0.2), 'opacity=".6"');
};

/** Rain boots over a standing child's feet. */
export const boots = (color) =>
  [-1, 1]
    .map((sd) => {
      const fx = sd * 6 - sd * 0.4;
      const c = sd < 0 ? shade(color, 0.14) : color;
      return rrect(fx - 5.2, -17, 10.4, 17, 2.5, c) + ellipse(fx + 3, 0.4, 7.2, 3.4, shade(color, 0.3)) + rect(fx - 5.2, -17, 10.4, 3, light(color, 0.25));
    })
    .join("");

/** Recolour a person's two hands (gloves). */
export function gloved(svgStr, skin, glove, age = "child") {
  const r = age === "child" ? "5.3" : "4.8";
  const skinS = shade(skin, 0.18);
  return svgStr.split(`r="${r}" fill="${skin}"`).join(`r="${r}" fill="${glove}"`).split(`r="${r}" fill="${skinS}"`).join(`r="${r}" fill="${shade(glove, 0.15)}"`);
}

/* ------------------------------------------------------------ plants & pots */

/** Terracotta pot standing on y; s=1 is 64 wide x 52 tall. Soil top is at y - 50*s. */
export function pot(x, y, s = 1, { color = "#c8693f" } = {}) {
  const b =
    contact(0, 0, 38, 6, 0.22) +
    path("M-26 -42 L-21 0 H21 L26 -42Z", color) +
    path("M6 -42 L4 0 H21 L26 -42Z", shade(color, 0.18), 'opacity=".75"') +
    rrect(-32, -52, 64, 13, 3, light(color, 0.08)) +
    rect(8, -52, 24, 13, shade(color, 0.14), 'opacity=".6"') +
    ellipse(0, -50, 28, 4.2, P.soilDark);
  return tr(x, y, b, s);
}

/** A leafy stem growing from (x, y) up h units; pairs of leaves; droop bends leaves down. */
export function plant(x, y, h, { pairs = 3, color = P.leaf, stem = P.leafDark, droop = false, leaf = 14, flowerColor = null, seed = 2 } = {}) {
  const R = rng(seed);
  const lean = droop ? 10 : 0;
  let b = stroke(`M0 0 Q${f(-3 + lean * 0.3)} ${f(-h * 0.5)} ${f(lean)} ${f(-h)}`, stem, Math.max(2.6, h / 34));
  for (let i = 0; i < pairs; i++) {
    const t = (i + 1) / (pairs + (flowerColor ? 0.6 : 0.4));
    const ly = -h * t;
    const lx = lean * t * t;
    const L = leaf * (1 - i * 0.08) * (0.9 + R() * 0.2);
    for (const sd of [-1, 1]) {
      const ang = droop ? sd * 115 : sd * (55 + R() * 10);
      const c = sd < 0 ? color : shade(color, 0.12);
      b += `<g transform="translate(${f(lx)} ${f(ly)}) rotate(${f(ang)})">${path(`M0 0 Q${f(L * 0.7)} ${f(-L * 0.38)} 0 ${f(-L)} Q${f(-L * 0.7)} ${f(-L * 0.38)} 0 0Z`, c)}${line(0, -1, 0, -L * 0.8, light(color, 0.3), 1, 'opacity=".6"')}</g>`;
    }
  }
  if (flowerColor) {
    const fy = -h - 4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      b += ellipse(lean + Math.cos(a) * 10, fy + Math.sin(a) * 10, 8, 4.6, i % 2 ? flowerColor : light(flowerColor, 0.2), `transform="rotate(${f((a * 180) / Math.PI)} ${f(lean + Math.cos(a) * 10)} ${f(fy + Math.sin(a) * 10)})"`);
    }
    b += circle(lean, fy, 6.5, "#b0682a") + circle(lean - 1.6, fy - 1.6, 2.4, "#d08a44");
  }
  return tr(x, y, b);
}

/** Watering can, spout pointing +x; water drops when pouring. */
export function wateringCan(x, y, s = 1, { color = P.blue, pour = true, facing = 1 } = {}) {
  let b = rrect(-16, -14, 32, 26, 5, color) + rect(4, -14, 12, 26, shade(color, 0.18), 'opacity=".7"') + stroke("M-14 -12 Q0 -30 14 -12", shade(color, 0.2), 3.6) + path("M14 0 L34 -16 L37 -12 L17 6Z", color) + ellipse(36, -15, 4, 2.6, shade(color, 0.25));
  if (pour) for (const [dx, dy] of [[40, -4], [44, 6], [38, 12], [46, 18]]) b += path(`M${dx} ${dy} q-2 4 0 6 q2 -2 0 -6Z`, P.waterLight);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/* ------------------------------------------------------------ objects */

/** Recycling bin: ground at y, label printed on the front. */
export function bin(x, y, w, h, color, label, { size = 14 } = {}) {
  let b = contact(x + w / 2, y, w * 0.56, 6, 0.2);
  b += path(`M${x + 4} ${y - h} L${x + 8} ${y} H${x + w - 8} L${x + w - 4} ${y - h}Z`, color);
  b += path(`M${x + w * 0.68} ${y - h} L${x + w * 0.68} ${y} H${x + w - 8} L${x + w - 4} ${y - h}Z`, shade(color, 0.16), 'opacity=".75"');
  for (const t of [0.3, 0.5]) b += rect(x + w * t, y - h + 14, 3, h - 30, shade(color, 0.12), 'opacity=".5"');
  b += rrect(x - 2, y - h - 12, w + 4, 14, 4, shade(color, 0.08)) + rect(x - 2, y - h - 12, w + 4, 4, light(color, 0.25), 'rx="2"');
  b += tag(x + w / 2, y - h * 0.55, label, { size, fill: P.white });
  return b;
}

export const bottle = (x, y, s = 1, { color = "#8ccbe0", cap = P.blue, lying = false } = {}) => {
  const b = rrect(-7, -30, 14, 30, 5, color, 'opacity=".92"') + path("M-7 -26 Q-7 -36 -3 -38 H3 Q7 -36 7 -26Z", color) + rect(-3.6, -44, 7.2, 7, cap) + rect(-7, -20, 14, 8, mix(color, "#ffffff", 0.5)) + rect(-4.5, -28, 2.5, 24, "#ffffff", 'opacity=".5" rx="1"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})${lying ? " rotate(-80)" : ""}">${b}</g>`;
};
export const sodaCan = (x, y, s = 1, { color = "#c9ced4", band = P.red, lying = false } = {}) => {
  const b = rrect(-8, -24, 16, 24, 3, color) + rect(-8, -17, 16, 9, band) + rect(3, -24, 5, 24, shade(color, 0.2), 'opacity=".55"') + ellipse(0, -24, 8, 2.4, light(color, 0.3)) + rect(-5, -22, 2, 18, "#ffffff", 'opacity=".55"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})${lying ? " rotate(80)" : ""}">${b}</g>`;
};
/** Cardboard box with open flaps, ground at y. */
export const cardboardBox = (x, y, w = 46, h = 34) => {
  const c = "#c99b62";
  return g(rect(x, y - h, w, h, c) + rect(x + w * 0.66, y - h, w * 0.34, h, shade(c, 0.15)) + poly([[x, y - h], [x - 8, y - h - 10], [x + w * 0.45, y - h - 10], [x + w * 0.5, y - h]], light(c, 0.15)) + poly([[x + w * 0.5, y - h], [x + w * 0.55, y - h - 9], [x + w + 8, y - h - 9], [x + w, y - h]], shade(c, 0.06)) + rect(x + w * 0.4, y - h, w * 0.2, h * 0.5, "#e6cfa0", 'opacity=".7"'));
};
/** Folded newspaper held in a hand (draw at 0,0 in figure units). */
export const newspaper = () => g(rect(-13, -16, 26, 32, "#f2efe6", 'rx="1.5"') + rect(-13, -16, 26, 6, "#d9d3c4") + stroke("M-9 -6h18M-9 -1h18M-9 4h11M-9 9h18M-9 13h14", "#8e98a3", 1.6));

/** Wall calendar with a grid of days; the first `crossed` days have an X. */
export function calendar(x, y, w, h, crossed, days = 21, { head = P.coral } = {}) {
  const cols = 7;
  const rows = Math.ceil(days / cols);
  let b = rrect(x + 2, y + 3, w, h, 4, "#1c2f4a", 'opacity=".14"') + rrect(x, y, w, h, 4, P.white) + rrect(x, y, w, 22, 4, head) + rect(x, y + 14, w, 8, head);
  b += circle(x + w * 0.3, y + 4, 3, P.ink) + circle(x + w * 0.7, y + 4, 3, P.ink);
  const cw = (w - 12) / cols;
  const ch = (h - 32) / rows;
  for (let i = 0; i < days; i++) {
    const cx = x + 6 + (i % cols) * cw;
    const cy = y + 27 + Math.floor(i / cols) * ch;
    b += rect(cx + 1, cy + 1, cw - 2, ch - 2, "#eef1f3", 'rx="1.5"');
    if (i < crossed) b += stroke(`M${f(cx + 3.5)} ${f(cy + 3.5)}L${f(cx + cw - 3.5)} ${f(cy + ch - 3.5)}M${f(cx + cw - 3.5)} ${f(cy + 3.5)}L${f(cx + 3.5)} ${f(cy + ch - 3.5)}`, P.red, 2);
  }
  return b;
}

/** Diamond kite with a bow tail; (x, y) is the bridle point where the string ties on. */
export function kite(x, y, s = 1, { color = P.coral, alt = P.gold } = {}) {
  const b =
    poly([[0, -34], [22, -6], [0, 30], [-22, -6]], color) +
    poly([[0, -34], [22, -6], [0, -6]], light(color, 0.2)) +
    poly([[0, -6], [-22, -6], [0, 30]], shade(color, 0.15)) +
    line(0, -34, 0, 30, shade(color, 0.35), 1.4) +
    line(-22, -6, 22, -6, shade(color, 0.35), 1.4) +
    stroke("M0 30 Q-10 44 0 56 Q10 68 -2 82", P.ink, 1.4) +
    [[-3, 44], [3, 62], [-4, 78]].map(([bx, by]) => poly([[bx - 6, by - 4], [bx + 6, by + 4], [bx + 6, by - 4], [bx - 6, by + 4]], alt)).join("");
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(14)">${b}</g>`;
}

/** Basketball hoop on a pole; pole foot at (x, y), hoop faces -x. */
export function hoop(x, y, h = 150) {
  return g(
    contact(x, y, 18, 4, 0.2) +
      rect(x - 4, y - h, 8, h, "#6b7480") +
      rect(x - 1, y - h, 3, h, "#8a939e") +
      rect(x - 8, y - 8, 16, 8, "#5a626c") +
      rrect(x - 50, y - h - 34, 60, 40, 3, P.white) +
      rect(x - 50, y - h - 34, 60, 40, "none", `stroke="${P.coral}" stroke-width="2.5" rx="3"`) +
      rect(x - 31, y - h - 20, 22, 16, "none", `stroke="${P.coral}" stroke-width="2"`) +
      line(x - 20, y - h - 4, x - 20, y - h + 2, "#6b7480", 2) +
      ellipse(x - 20, y - h + 4, 13, 3.4, "none", `stroke="${P.orange}" stroke-width="3"`) +
      stroke(`M${x - 32} ${y - h + 5} L${x - 28} ${y - h + 22} M${x - 24} ${y - h + 7} L${x - 22} ${y - h + 24} M${x - 16} ${y - h + 7} L${x - 18} ${y - h + 24} M${x - 8} ${y - h + 5} L${x - 12} ${y - h + 22} M${x - 30} ${y - h + 14} H${x - 10}`, "#f2f2f2", 1.2),
  );
}

/** Orange basketball. */
export const basketball = (x, y, r = 9) =>
  g(contact(x, y + r, r, r * 0.25, 0.2) + circle(x, y, r, P.orange) + path(`M${f(x - r * 0.1)} ${f(y - r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y + r * 0.1)} A${f(r * 1.1)} ${f(r * 1.1)} 0 0 0 ${f(x - r * 0.1)} ${f(y - r)}Z`, "#1c2f4a", 'opacity=".14"') + stroke(`M${f(x - r)} ${y}H${f(x + r)}M${x} ${f(y - r)}V${f(y + r)}M${f(x - r * 0.7)} ${f(y - r * 0.7)}Q${f(x - r * 0.2)} ${y} ${f(x - r * 0.7)} ${f(y + r * 0.7)}M${f(x + r * 0.7)} ${f(y - r * 0.7)}Q${f(x + r * 0.2)} ${y} ${f(x + r * 0.7)} ${f(y + r * 0.7)}`, "#7a3b12", 1.1));

/** Woven picnic basket (draw at 0,0 = handle grip, figure units or world). */
export const picnicBasket = (s = 1) =>
  tr(0, 0, stroke("M-12 10 Q0 -6 12 10", "#8f6140", 3.4) + rrect(-17, 9, 34, 22, 4, "#c68a4e") + rect(4, 9, 13, 22, shade("#c68a4e", 0.15), 'opacity=".7"') + stroke("M-15 16H15M-15 23H15M-8 10V30M0 10V30M8 10V30", "#9c6a3a", 1.2, 'opacity=".7"') + rrect(-19, 7, 38, 6, 2, "#a8743f") + path("M-10 9 l6 -5 l6 5Z", P.red), s);

/** Checked blanket laid on the ground, a parallelogram centred at (cx, cy). */
export function blanket(cx, cy, w, h, { color = P.red, skew = 30 } = {}) {
  const n = 6;
  let b = poly([[cx - w / 2 + skew, cy - h / 2], [cx + w / 2 + skew, cy - h / 2], [cx + w / 2 - skew, cy + h / 2], [cx - w / 2 - skew, cy + h / 2]], light(color, 0.55));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < 3; j++) {
      if ((i + j) % 2) continue;
      const t0 = j / 3;
      const t1 = (j + 1) / 3;
      const pt = (u, v) => [cx - w / 2 + skew + u * w - v * 2 * skew, cy - h / 2 + v * h];
      b += poly([pt(i / n, t0), pt((i + 1) / n, t0), pt((i + 1) / n, t1), pt(i / n, t1)], color);
    }
  return b;
}

/** Side-view school bus, ground at y, nose pointing +x; s=1 is 230 long. win = svg drawn in the 2nd window. */
export function bus(x, y, s = 1, { win2 = "", winIndex = 1 } = {}) {
  const Y = P.yellow;
  let b = contact(115, 0, 120, 8, 0.22);
  b += path("M0 -20 V-104 Q0 -112 8 -112 H178 Q190 -112 192 -100 L196 -66 H222 Q230 -66 230 -58 V-20Z", Y);
  b += rect(0, -60, 230, 8, "#2b2f36") + rect(0, -34, 230, 5, "#2b2f36", 'opacity=".8"');
  b += path("M0 -24 H230 V-14 H0Z", shade(Y, 0.2));
  b += rect(0, -112, 230, 8, light(Y, 0.3), 'opacity=".5"');
  for (let i = 0; i < 4; i++) {
    const wx = 12 + i * 42;
    b += rrect(wx, -100, 34, 30, 3, vgrad([[0, "#d7eef6"], [1, "#9cc9dc"]]));
    if (i === winIndex && win2) b += tr(wx + 17, -72, win2);
    b += path(`M${wx + 4} -72 L${wx + 18} -100 H${wx + 26} L${wx + 12} -72Z`, "#ffffff", 'opacity=".3"');
  }
  b += rrect(180, -100, 12, 30, 2, vgrad([[0, "#d7eef6"], [1, "#9cc9dc"]]));
  b += rect(196, -62, 30, 4, P.ink, 'opacity=".2"') + rrect(222, -54, 8, 8, 2, "#fff4c4");
  b += rrect(174, -100, 4, 80, 1, shade(Y, 0.3));
  for (const wx of [44, 186]) b += circle(wx, -18, 19, "#2b2f36") + circle(wx, -18, 8, "#9aa3ad") + circle(wx, -18, 3, "#5d6772");
  return tr(x, y, b, s);
}

/** Backpack (centre at 0,0; ~24 wide x 30 tall at s=1). */
export const backpackShape = (color = P.green, s = 1) =>
  tr(0, 0, stroke("M-6 -15 Q0 -24 6 -15", shade(color, 0.3), 3) + rrect(-12, -15, 24, 30, 7, color) + rect(3, -15, 9, 30, shade(color, 0.18), 'opacity=".7" rx="4"') + rrect(-8, 1, 16, 11, 3, shade(color, 0.12)) + line(-6, 3, 6, 3, light(color, 0.35), 1.4) + rrect(-9, -12, 18, 4, 2, light(color, 0.2), 'opacity=".7"'), s);

/* ------------------------------------------------------------ pets */

export function fishTank(x, y, w, h) {
  let b = contact(x + w / 2, y + 2, w * 0.5, 5, 0.2);
  b += rect(x, y - h, w, h, vgrad([[0, "#cfeef7"], [1, "#7fc3dc"]]));
  b += rect(x, y - h, w, 10, "#eaf7fb", 'opacity=".8"');
  b += path(`M${x} ${y - 14} Q${x + w * 0.3} ${y - 22} ${x + w * 0.6} ${y - 16} T${x + w} ${y - 18} V${y} H${x}Z`, "#e8cf96");
  for (const [px, ph] of [[0.16, 0.55], [0.24, 0.4], [0.84, 0.48]]) b += stroke(`M${f(x + w * px)} ${y - 14} q-8 ${f(-h * ph * 0.5)} 0 ${f(-h * ph)}`, P.leaf, 4);
  b += circle(x + w * 0.7, y - 20, 6, "#a9a29a") + circle(x + w * 0.62, y - 18, 4.5, "#8c867f");
  b += rect(x, y - h, 4, h, "#ffffff", 'opacity=".55"') + rect(x + w - 4, y - h, 4, h, "#ffffff", 'opacity=".35"');
  b += rect(x - 4, y - h - 6, w + 8, 7, "#4e5d6c", 'rx="2"') + rect(x - 4, y - 2, w + 8, 8, "#4e5d6c", 'rx="2"');
  return b;
}
export const goldfish = (x, y, s = 1) =>
  tr(x, y, path("M-22 0 L-36 -12 Q-32 0 -36 12Z", "#f0a040") + ellipse(0, 0, 22, 13, P.orange) + path("M-4 -12 Q4 -22 12 -10Z", "#f0a040") + ellipse(4, 4, 14, 6, light(P.orange, 0.3), 'opacity=".6"') + circle(12, -3, 3.2, P.white) + circle(13, -3, 1.8, P.ink) + stroke("M-4 -10 Q-8 0 -4 10", shade(P.orange, 0.25), 1.6) + circle(30, -18, 3, "none", `stroke="#ffffff" stroke-width="1.6"`) + circle(36, -30, 2.2, "none", `stroke="#ffffff" stroke-width="1.4"`), s);

export function cage(x, y, w, h) {
  let b = contact(x + w / 2, y + 2, w * 0.5, 5, 0.2);
  b += rect(x, y - h, w, h, "#f6efe2", 'opacity=".55"');
  b += rect(x, y - 14, w, 14, "#e8cf96");
  b += path(`M${x} ${y - h + 16} Q${x + w / 2} ${y - h - 22} ${x + w} ${y - h + 16}Z`, "#f6efe2", 'opacity=".55"');
  let bars = "";
  for (let bx = x + 10; bx < x + w; bx += 12) bars += `M${f(bx)} ${y - 6} V${f(y - h + 16 - Math.sin(((bx - x) / w) * Math.PI) * 30)}`;
  b += stroke(bars, "#9aa3ad", 2);
  b += stroke(`M${x} ${y - h + 16} Q${x + w / 2} ${y - h - 22} ${x + w} ${y - h + 16}`, "#7f8994", 3.4);
  b += rect(x - 4, y - 8, w + 8, 10, P.teal, 'rx="3"') + rect(x - 4, y - 8, w + 8, 3, light(P.teal, 0.3), 'rx="1.5"');
  b += rect(x, y - h + 14, w, 4, "#7f8994");
  b += circle(x + w / 2, y - h - 6, 6, "none", `stroke="#7f8994" stroke-width="2.6"`);
  return b;
}
/** Hamster wheel standing on y. */
export function wheel(x, y, r = 34) {
  let spokes = "";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    spokes += `M${x} ${y - r - 6} l${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;
  }
  return g(poly([[x - 4, y - r - 6], [x - 16, y], [x - 10, y], [x, y - r - 6]], "#5d6772") + circle(x, y - r - 6, r, "none", `stroke="${P.teal}" stroke-width="6"`) + circle(x, y - r - 6, r - 5, "none", `stroke="${light(P.teal, 0.4)}" stroke-width="1.6" stroke-dasharray="3 5"`) + stroke(spokes, P.teal, 1.8) + circle(x, y - r - 6, 4, shade(P.teal, 0.2)));
}
export const hamster = (x, y, s = 1) => {
  const c = "#e6a96a";
  return tr(x, y, contact(0, 0, 26, 5, 0.22) + ellipse(0, -16, 27, 18, c) + ellipse(6, -10, 19, 11, "#fbe7cf") + circle(-15, -32, 6.5, c) + circle(13, -32, 6.5, c) + circle(-15, -32, 3.5, "#f2b8a8") + circle(13, -32, 3.5, "#f2b8a8") + circle(-8, -21, 2.4, P.ink) + circle(8, -21, 2.4, P.ink) + ellipse(0, -16, 3, 2, "#d07a6a") + ellipse(-15, -13, 4, 2.6, P.coralLight, 'opacity=".5"') + ellipse(15, -13, 4, 2.6, P.coralLight, 'opacity=".5"') + ellipse(-10, -1, 4.5, 2.2, "#f2c3a6") + ellipse(10, -1, 4.5, 2.2, "#f2c3a6"), s);
};

/* ------------------------------------------------------------ museum & farm */

/** Dinosaur skeleton on a plinth facing +x; feet at y. s=1 ≈ 220 wide. */
export function dinoSkeleton(x, y, s = 1) {
  const bone = "#f4ecd8";
  const dark = "#d6c8a6";
  let b = rrect(-100, -2, 210, 14, 3, "#8f9aa5") + rect(-100, -2, 210, 4, "#b3bcc5");
  // spine: tail -> neck
  b += stroke("M-96 -66 Q-60 -88 -20 -92 Q20 -96 46 -112 Q62 -126 66 -150", bone, 7);
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const xx = -86 + t * 136;
    const yy = -72 - Math.sin(t * Math.PI * 0.9) * 24 - t * 18;
    b += line(xx, yy, xx + 2, yy - 9, dark, 3);
  }
  // ribs
  for (let i = 0; i < 6; i++) {
    const rx = -24 + i * 11;
    b += stroke(`M${rx} ${-92 - i * 2} q-6 26 2 44`, bone, 4);
  }
  // legs
  b += stroke("M-30 -84 L-38 -46 L-30 -6 M-30 -6 h-12", bone, 7) + stroke("M-14 -86 L-6 -48 L-12 -6 M-12 -6 h12", dark, 6);
  b += stroke("M36 -106 L46 -66 L40 -6 M40 -6 h12", bone, 6) + stroke("M28 -104 L22 -64 L26 -6 M26 -6 h-10", dark, 5);
  // skull
  b += path("M60 -160 Q72 -172 92 -166 Q106 -162 108 -152 Q96 -146 74 -146 Q62 -148 60 -160Z", bone) + circle(78, -158, 3.6, "#8a7d62") + stroke("M80 -150 H104", dark, 1.6);
  // supports
  b += line(-20, -92, -20, -2, "#8f9aa5", 2.2) + line(52, -118, 52, -2, "#8f9aa5", 2.2);
  return tr(x, y, b, s);
}

export function barn(x, y, w = 150, h = 110, { color = P.red } = {}) {
  let b = contact(x + w / 2, y, w * 0.6, 7, 0.2);
  b += rect(x, y - h, w, h, color) + rect(x + w * 0.62, y - h, w * 0.38, h, shade(color, 0.14), 'opacity=".7"');
  b += poly([[x - 8, y - h + 4], [x + w / 2, y - h - w * 0.42], [x + w + 8, y - h + 4]], shade(color, 0.32)) + poly([[x + w / 2, y - h - w * 0.42], [x + w + 8, y - h + 4], [x + w / 2, y - h + 4]], shade(color, 0.42), 'opacity=".6"');
  b += poly([[x + 2, y - h + 4], [x + w / 2, y - h - w * 0.38], [x + w - 2, y - h + 4]], "none", `stroke="${P.white}" stroke-width="4"`);
  const dw = w * 0.42;
  const dx = x + (w - dw) / 2;
  b += rect(dx, y - h * 0.58, dw, h * 0.58, shade(color, 0.08)) + stroke(`M${dx} ${y - h * 0.58} h${dw} v${h * 0.58} h${-dw}Z M${dx} ${y - h * 0.58} L${dx + dw} ${y} M${dx + dw} ${y - h * 0.58} L${dx} ${y} M${dx + dw / 2} ${y - h * 0.58} V${y}`, P.white, 3.4);
  b += rect(x + w / 2 - 12, y - h + 2, 24, 18, P.white) + rect(x + w / 2 - 9, y - h + 5, 18, 12, "#5a3b26");
  return b;
}

export function cow(x, y, s = 1, { facing = 1 } = {}) {
  const W = "#fbf8f2";
  const K = "#2f3238";
  let b = contact(0, 0, 50, 7, 0.22);
  b += stroke("M-30 -30 V0 M-18 -30 V0 M22 -30 V0 M34 -30 V0", "#e6e0d6", 7.5) + stroke("M-30 -4 V0 M-18 -4 V0 M22 -4 V0 M34 -4 V0", K, 7.5);
  b += rrect(-44, -62, 88, 38, 18, W) + rect(-44, -38, 88, 14, shade(W, 0.08), 'rx="7"');
  b += path("M-24 -60 Q-6 -58 -10 -44 Q-20 -32 -32 -42 Q-36 -54 -24 -60Z", K) + path("M14 -62 Q30 -60 26 -48 Q18 -40 8 -50Z", K) + ellipse(-36, -30, 7, 5, K);
  b += ellipse(4, -24, 9, 6, "#f2b8c6");
  b += stroke("M-44 -58 Q-54 -46 -50 -30", W, 3.6) + circle(-50, -28, 3.4, K);
  // head
  b += rrect(40, -78, 26, 34, 11, W) + rrect(46, -56, 26, 18, 8, "#f2b8c6") + circle(55, -48, 1.8, "#a0606e") + circle(64, -48, 1.8, "#a0606e") + circle(56, -68, 2.4, P.ink) + ellipse(40, -76, 8, 4, W) + ellipse(68, -74, 8, 4, W) + path("M46 -80 q-2 -8 -6 -9 M60 -80 q2 -8 6 -9", "none", `stroke="#d9cdb0" stroke-width="3" stroke-linecap="round"`) + path("M44 -76 Q52 -86 58 -74Z", K);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/* ------------------------------------------------------------ bird feeder */

/** Pinecone, top at (0,-h/2); coat: null | "butter" | "seed". */
export function pinecone(x, y, s = 1, { coat = null, rot = 0 } = {}) {
  const base = "#8a5a34";
  let b = ellipse(0, 0, 17, 25, shade(base, 0.2));
  for (let r = 0; r < 6; r++) {
    const yy = -18 + r * 7.4;
    const wid = 15 - Math.abs(r - 2.2) * 2.4;
    for (let c = -2; c <= 2; c++) {
      const xx = c * wid * 0.42 + (r % 2 ? 3 : 0);
      if (Math.abs(xx) > wid) continue;
      b += path(`M${f(xx - 5)} ${f(yy)} Q${f(xx)} ${f(yy + 8)} ${f(xx + 5)} ${f(yy)} Q${f(xx)} ${f(yy + 3)} ${f(xx - 5)} ${f(yy)}Z`, r % 2 ? base : light(base, 0.12));
    }
  }
  b += rect(-2, -30, 4, 6, "#5a3b26");
  if (coat === "butter") b += path("M-15 -12 Q-4 -20 14 -10 Q17 6 10 16 Q0 22 -10 16 Q-16 4 -15 -12Z", "#d9a35e", 'opacity=".75"') + ellipse(-5, -6, 5, 3, "#f0c88a", 'opacity=".8"');
  if (coat === "seed") {
    const R = rng(11);
    b += ellipse(0, 0, 17, 25, "#c99a5c", 'opacity=".55"');
    for (let i = 0; i < 46; i++) {
      const a = R() * Math.PI * 2;
      const rr = Math.sqrt(R());
      b += ellipse(Math.cos(a) * 15 * rr, Math.sin(a) * 22 * rr, 2, 1.3, ["#f3e2b8", "#c79a5a", "#6b4a2c"][i % 3], `transform="rotate(${f(R() * 180)} ${f(Math.cos(a) * 15 * rr)} ${f(Math.sin(a) * 22 * rr)})"`);
    }
  }
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(${rot})">${b}</g>`;
}

export const butterJar = (x, y, s = 1) =>
  tr(x, y, contact(0, 0, 22, 4, 0.22) + rrect(-18, -36, 36, 36, 6, "#e9c38a") + rect(6, -36, 12, 36, shade("#e9c38a", 0.15), 'opacity=".7" rx="4"') + rrect(-20, -44, 40, 10, 3, P.teal) + rect(-14, -26, 28, 14, P.ivory, 'rx="2"') + circle(-4, -19, 4, P.gold) + rect(-12, -32, 3, 24, "#ffffff", 'opacity=".45"'), s);

/** Plate (seen from the front-top) with birdseed. */
export function seedPlate(x, y, w = 130) {
  const R = rng(5);
  let b = ellipse(x, y + 4, w * 0.52, w * 0.12, "#1c2f4a", 'opacity=".16"') + ellipse(x, y, w / 2, w * 0.14, "#f4f2ee") + ellipse(x, y - 1, w * 0.4, w * 0.1, "#e2e0da");
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2;
    const rr = Math.sqrt(R());
    b += ellipse(x + Math.cos(a) * w * 0.36 * rr, y - 1 + Math.sin(a) * w * 0.085 * rr, 2.2, 1.3, ["#f3e2b8", "#c79a5a", "#6b4a2c", "#e0c48a"][i % 4]);
  }
  return b;
}

/* ------------------------------------------------------------ litter & cleanup */

export const wrapper = (x, y, s = 1, color = P.gold) => tr(x, y, path("M-10 -4 L10 -6 L12 2 L-9 5Z", color) + path("M-10 -4 l-4 -3 l1 6 l3 2Z M10 -6 l4 -3 l-1 7 l-1 4Z", shade(color, 0.2)) + rect(-4, -4, 7, 7, P.white, 'opacity=".6"'), s);
export const crumpledPaper = (x, y, s = 1) => tr(x, y, path("M-8 -2 L-4 -9 L5 -8 L9 -1 L5 6 L-5 6Z", "#f2efe6") + path("M-4 -9 L1 -2 L5 6 M1 -2 L9 -1", "none", `stroke="#c9c3b8" stroke-width="1.2"`), s);
/** Full trash bag, ground at y. */
export const trashBag = (x, y, s = 1, color = "#2f3a48") =>
  tr(x, y, contact(0, 0, 22, 4, 0.22) + path("M-20 0 Q-26 -28 -10 -38 L-4 -44 L4 -44 L10 -38 Q26 -28 20 0Z", color) + path("M4 -40 Q20 -30 18 0 H6 Q12 -20 4 -40Z", shade(color, 0.2), 'opacity=".7"') + path("M-10 -30 Q-16 -18 -12 -6", "none", `stroke="${light(color, 0.35)}" stroke-width="2.6" opacity=".7"`) + path("M-6 -44 l-6 -8 M6 -44 l6 -8", "none", `stroke="${color}" stroke-width="3.4"`), s);

/* ------------------------------------------------------------ market goods */

/** A heaped pile of produce sitting on a counter top at y. kind: apple|orange|banana|carrot|lettuce|tomato */
export function produce(x, y, w, kind, { seed = 3 } = {}) {
  const R = rng(seed);
  let b = "";
  const rows = 2;
  if (kind === "banana") {
    for (let i = 0; i < 3; i++) {
      const bx = x + w * 0.5 + (i - 1) * 7;
      const by = y - 4 - i * 7;
      b += path(`M${bx - 24} ${by - 14} Q${bx - 6} ${by + 8} ${bx + 24} ${by - 12} Q${bx + 2} ${by - 4} ${bx - 24} ${by - 14}Z`, i === 1 ? light(P.yellow, 0.12) : P.yellow) + path(`M${bx - 20} ${by - 10} Q${bx - 4} ${by + 4} ${bx + 20} ${by - 9} Q${bx - 2} ${by + 1} ${bx - 20} ${by - 10}Z`, shade(P.yellow, 0.15), 'opacity=".6"') + circle(bx + 24, by - 12, 2.4, "#6b4a2c") + circle(bx - 24, by - 14, 2, "#6b4a2c");
    }
    return b;
  }
  if (kind === "carrot") {
    for (let i = 0; i < 6; i++) {
      const bx = x + 8 + i * ((w - 16) / 5);
      b += path(`M${bx - 5} ${y - 22} L${bx + 5} ${y - 22} L${bx} ${y + 2}Z`, P.orange) + path(`M${bx + 1} ${y - 22} L${bx + 5} ${y - 22} L${bx} ${y + 2}Z`, shade(P.orange, 0.18)) + stroke(`M${bx} ${y - 22} l-4 -10 M${bx} ${y - 22} l1 -12 M${bx} ${y - 22} l5 -9`, P.green, 2.4);
    }
    return b;
  }
  const r = { apple: 9, orange: 9, tomato: 8, lettuce: 13 }[kind];
  const col = { apple: P.red, orange: P.orange, tomato: "#d9452e", lettuce: "#7cc06a" }[kind];
  const n = Math.max(2, Math.floor(w / (r * 2)));
  for (let row = 0; row < rows; row++) {
    const m = n - row;
    for (let i = 0; i < m; i++) {
      const cx = x + r + row * r + i * ((w - 2 * r - row * 2 * r) / Math.max(1, m - 1)) + (R() - 0.5) * 2;
      const cy = y - r - row * r * 1.5;
      if (kind === "lettuce") {
        b += circle(cx, cy, r, shade(col, 0.15)) + circle(cx - 2, cy - 2, r * 0.75, col) + stroke(`M${f(cx - 6)} ${f(cy)} q6 -6 12 0`, light(col, 0.35), 1.6);
        continue;
      }
      b += circle(cx, cy, r, col) + circle(cx + r * 0.25, cy + r * 0.25, r * 0.75, shade(col, 0.15), 'opacity=".5"') + circle(cx - r * 0.35, cy - r * 0.35, r * 0.28, "#ffffff", 'opacity=".45"');
      if (kind === "apple") b += stroke(`M${f(cx)} ${f(cy - r + 1)} l1 -4`, "#5a3b26", 1.6) + ellipse(cx + 3, cy - r - 2, 3, 1.5, P.leaf);
      if (kind === "tomato") b += path(`M${f(cx - 4)} ${f(cy - r + 1)} l4 -3 l4 3 l-4 -1Z`, P.green);
    }
  }
  return b;
}

/** Small free-standing tree crown for top-down maps. */
export const mapTree = (x, y, r = 14) => g(circle(x + 3, y + 4, r, "#1c2f4a", 'opacity=".16"') + circle(x, y, r, P.leaf) + circle(x - r * 0.25, y - r * 0.25, r * 0.65, P.leafLight) + circle(x - r * 0.35, y - r * 0.4, r * 0.25, light(P.leafLight, 0.3), 'opacity=".7"'));

/** Small text helper re-export for scenes. */
export { text, tag, SKIN };

/** A rounded picture card with a soft drop shadow; body is clipped to it. */
export const frameCard = (x, y, w, h, body, r = 16) =>
  rrect(x + 2, y + 4, w, h, r, "#1c2f4a", 'opacity=".12"') + clipRect(x, y, w, h, r, body) + rrect(x, y, w, h, r, "none", 'stroke="#1c2f4a" stroke-opacity=".18" stroke-width="1.5"');

/** Market stand with a high striped roof so a seller can stand behind it. Returns {back, front}: draw the seller between them. */
export function tallStand(x, y, w, color) {
  const n = 6;
  const sw = (w + 12) / n;
  let back = contact(x + w / 2, y, w * 0.55, 6, 0.2) + rect(x + 6, y - 170, 6, 170, P.woodDark) + rect(x + w - 12, y - 170, 6, 170, P.woodDark);
  let roof = "";
  for (let i = 0; i < n; i++) roof += path(`M${f(x - 6 + sw * i)} ${y - 186} h${f(sw)} v22 a${f(sw / 2)} 8 0 0 1 ${f(-sw)} 0Z`, i % 2 ? "#fbf6ec" : color);
  roof += rect(x - 6, y - 192, w + 12, 7, shade(color, 0.2)) + path(`M${x - 6} ${y - 164} h${w + 12}`, "none", `stroke="${shade(color, 0.25)}" stroke-width="0"`);
  const front = rect(x, y - 52, w, 52, P.wood) + rect(x, y - 52, w, 6, light(P.wood, 0.2)) + rect(x + w * 0.7, y - 46, w * 0.3, 46, shade(P.wood, 0.12), 'opacity=".6"') + rect(x, y - 8, w, 8, shade(P.wood, 0.25));
  return { back, roof, front };
}
