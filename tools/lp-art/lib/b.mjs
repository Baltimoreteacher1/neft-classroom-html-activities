// Illustrator B helpers: props and set pieces the shared kit does not draw. Same art direction as kit.mjs
// (no outlines, lit/shade sides, soft contact shadows). Every function returns an SVG string.
import { P, shade, light, mix, rect, rrect, circle, ellipse, path, poly, line, stroke, g, tr, vgrad, rgrad, contact, text, tag, arrow, rng } from "../../../access-practice-lab/src/art/kit.js";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/* ------------------------------------------------------------ figure geometry */

/** Pose limb angles copied from kit person() (arms only). */
const ARMS = {
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

/** World position of a figure's hands (front = the arm that holds `item`), matching kit person(). */
export function hands(x, y, h, { pose = "stand", facing = 1, age = "child" } = {}) {
  const child = age === "child";
  const hr = child ? 13 : 10.2;
  const shoulderY = -100 + hr * 2 + (child ? 3 : 4);
  const tw = child ? 15 : 16.5;
  const armLen = child ? 30 : 34;
  const hipY = child ? -44 : -48;
  const lift = pose === "sit" ? -hipY : 0;
  const A = ARMS[pose] || ARMS.stand;
  const s = h / 100;
  const end = (side, [a1, a2]) => {
    const r1 = (a1 * Math.PI) / 180;
    const r2 = ((a1 + a2) * Math.PI) / 180;
    const lx = side * tw * 0.62 + Math.sin(r1) * (armLen / 2) + Math.sin(r2) * (armLen / 2);
    const ly = shoulderY + 3 + Math.cos(r1) * (armLen / 2) + Math.cos(r2) * (armLen / 2);
    return [x + facing * s * lx, y + s * (ly + lift)];
  };
  return { front: end(1, A.ra), back: end(-1, A.la), head: [x + facing * s * 0, y + s * (-100 + hr + lift)] };
}

/* ------------------------------------------------------------ small props (drawn at a hand, local units) */

export const BP = {
  /** Watering can, spout toward +x; `pour` adds falling drops. */
  wateringCan: (c = P.teal, pour = true) =>
    g(
      rrect(-2, -6, 20, 15, 4, c) +
        rect(12, -6, 6, 15, shade(c, 0.18), 'opacity=".7"') +
        stroke("M2 -6 Q8 -16 14 -6", shade(c, 0.25), 2.4) +
        path("M17 2 L33 -9 L35 -7 L19 6Z", c) +
        ellipse(35, -8.5, 3, 2.2, shade(c, 0.2)) +
        (pour ? stroke("M37 -4 l2 7M40 -5 l3 8M36 2 l2 7M41 4 l2 6", P.waterLight, 1.6, 'opacity=".95"') : ""),
    ),
  shovel: () =>
    g(line(0, -14, 4, 20, P.woodDark, 3) + path("M-2 18 L10 18 L9 30 Q4 36 -1 30Z", "#8f9aa5") + path("M4 18 L10 18 L9 30 Q6 34 4 33Z", "#6f7a85")),
  pitcher: (fill = P.yellow) =>
    g(
      path("M-9 -16 L9 -16 L11 10 Q0 14 -11 10Z", "#e8f3f6", 'opacity=".9"') +
        path("M-8.5 -8 L8.5 -8 L10.4 9 Q0 12.6 -10.4 9Z", fill) +
        path("M9 -12 Q19 -10 17 0 Q15 6 10 5", "none", `stroke="#d2e2e8" stroke-width="3"`) +
        poly([[-9, -16], [-14, -19], [-8, -13]], "#d2e2e8") +
        rect(-7, -14, 3, 22, "#ffffff", 'opacity=".55"'),
    ),
  glass: (fill = P.waterLight) => g(path("M-5 -9 L5 -9 L4 6 L-4 6Z", "#e8f3f6", 'opacity=".85"') + path("M-4.6 -3 L4.6 -3 L4 6 L-4 6Z", fill, 'opacity=".9"')),
  coins: () =>
    g(ellipse(2, 2, 6, 3.4, "#b98a2b") + ellipse(2, 0.5, 6, 3.4, P.goldLight) + ellipse(-3, -2, 5.2, 3, "#c9cdd2") + ellipse(-3, -3.2, 5.2, 3, "#e6e9ec") + ellipse(-4, -3.6, 2, 1, "#ffffff", 'opacity=".8"')),
  bowlRice: () =>
    g(ellipse(0, -5, 13, 6, "#ffffff") + circle(-5, -7, 3, "#fbfaf4") + circle(1, -9, 3.6, "#fbfaf4") + circle(6, -7, 3, "#f3f0e6") + path("M-13 -4 Q-12 8 0 9 Q12 8 13 -4Z", P.teal) + path("M2 -4 Q12 -2 13 -4 Q12 8 2 9Z", shade(P.teal, 0.2), 'opacity=".6"')),
  clipboard: () =>
    g(rrect(-11, -15, 22, 28, 2.5, P.wood) + rect(-8, -11, 16, 22, "#ffffff") + rrect(-5, -17, 10, 5, 1.5, "#8f9aa5") + stroke("M-5 -6h10M-5 -2h10M-5 2h7M-5 6h9", "#9aa7b4", 1.2)),
  papers: () => g(rect(-12, -6, 24, 9, "#ffffff", 'rx="1"') + rect(-11, -9, 22, 4, "#f1f3f5") + rect(-12, -2, 24, 2, "#dfe4ea")),
  fishFood: () => g(rrect(-5, -9, 10, 14, 2, P.coral) + rect(-5, -11, 10, 3, P.gold) + rect(-3, -5, 6, 5, "#ffffff", 'opacity=".7"')),
  bookOpen: (c = P.coral) =>
    g(path("M0 -2 L-14 -8 L-14 6 L0 10Z", c) + path("M0 -2 L14 -8 L14 6 L0 10Z", shade(c, 0.12)) + path("M0 -1 L-12 -6 L-12 5 L0 8.5Z", "#fbf8f1") + path("M0 -1 L12 -6 L12 5 L0 8.5Z", "#f1ece1")),
  book: (c = P.blue) => g(rrect(-8, -11, 16, 20, 1.5, c) + rect(-8, -11, 3, 20, shade(c, 0.3)) + rect(-3, -6, 9, 2.4, light(c, 0.5))),
  bag: (c = P.gold) =>
    g(path("M-11 0 L11 0 L13 26 L-13 26Z", c) + path("M3 0 L11 0 L13 26 L5 26Z", shade(c, 0.15), 'opacity=".7"') + stroke("M-6 1 Q0 -12 6 1", shade(c, 0.35), 2.2) + circle(-6, -2, 4, P.green) + rect(2, -8, 5, 9, "#f0c060", 'rx="2"')),
  apple: () => g(circle(0, 0, 4.6, P.red) + circle(-1.4, -1.5, 1.4, "#ffffff", 'opacity=".5"') + line(0, -4, 1, -7, P.barkDark, 1.2)),
  leash: (len = 30) => stroke(`M0 0 q${f(len * 0.4)} ${f(len * 0.5)} ${f(len)} ${f(len * 0.25)}`, P.coral, 2),
  poster: () =>
    g(rect(-20, -26, 40, 46, "#ffffff") + rect(-20, -26, 40, 3, "#e7e2d8") + text(0, -12, "LOST DOG", { size: 7, fill: P.red }) + tr(0, 12, dogMini(), 0.9)),
};

/** A tiny brown dog for posters. */
function dogMini() {
  return g(ellipse(0, -6, 9, 4, "#a8703f") + circle(9, -10, 4, "#a8703f") + stroke("M-6 -3 v5M-3 -3v5M4 -3v5M7 -3v5", "#7f532f", 1.6) + stroke("M-9 -7 q-4 -4 -3 -7", "#a8703f", 1.6) + circle(10, -11, 0.8, P.ink));
}

/* ------------------------------------------------------------ indoor set pieces */

/** Back wall with a baseboard and a floor. */
export function room(W, H, floorY, { wall = P.wall, floor = "floor" } = {}) {
  const fl = { floor: ["#e6c9a0", P.floor, "#c7a274"], tile: ["#e9e4da", "#dcd6ca", "#c8c1b3"] }[floor];
  let s = rect(0, 0, W, floorY, vgrad([[0, light(wall, 0.25)], [1, wall]]));
  s += rect(0, floorY - 10, W, 10, shade(wall, 0.18));
  s += rect(0, floorY, W, H - floorY, vgrad([[0, fl[0]], [0.4, fl[1]], [1, fl[2]]]));
  if (floor === "floor") {
    let d = "";
    for (let i = 1; i < 6; i++) d += `M0 ${f(floorY + ((H - floorY) / 6) * i * (0.5 + i * 0.1))}H${W}`;
    s += stroke(d, "#b88f63", 1.2, 'opacity=".35"');
  }
  return s;
}

/** Soft warm light pool from a window onto a floor. */
export const lightPool = (x, y, rx, ry, o = 0.25) => ellipse(x, y, rx, ry, "#fff4d6", `opacity="${o}"`);

/** Pendant lamp hanging from the ceiling, glowing. */
export function pendantLamp(x, y, { cord = 0 } = {}) {
  return g(
    line(x, cord, x, y - 22, P.ink, 2) +
      circle(x, y + 8, 150, rgrad([[0, "#fff4c9", 0.7], [1, "#fff4c9", 0]])) +
      path(`M${x - 34} ${y + 6} Q${x - 30} ${y - 22} ${x} ${y - 24} Q${x + 30} ${y - 22} ${x + 34} ${y + 6}Z`, P.teal) +
      path(`M${x} ${y - 24} Q${x + 30} ${y - 22} ${x + 34} ${y + 6} L${x + 12} ${y + 6}Z`, shade(P.teal, 0.2), 'opacity=".6"') +
      ellipse(x, y + 6, 34, 5, "#fff1b8") +
      ellipse(x, y + 9, 12, 5, "#fffbe6"),
  );
}

/** Desk seen from the front; ground at y. */
export function frontDesk(x, y, w, h = 60, { color = P.wood, top = null } = {}) {
  const tp = top || light(color, 0.15);
  return g(
    contact(x + w / 2, y, w * 0.55, 6, 0.2) +
      rect(x, y - h, w, h, color) +
      rect(x + w * 0.72, y - h, w * 0.28, h, shade(color, 0.12), 'opacity=".6"') +
      rect(x + 10, y - h + 14, w - 20, h - 26, shade(color, 0.08)) +
      rrect(x - 6, y - h - 8, w + 12, 10, 3, tp) +
      rect(x - 6, y - h + 1, w + 12, 3, shade(color, 0.3), 'opacity=".5"'),
  );
}

/** Student desk (side-on 3/4): legs + top; ground at y. Top surface y returned via deskTop(). */
export function schoolDesk(x, y, w = 86, { color = P.woodLight } = {}) {
  return g(
    contact(x + w / 2, y, w * 0.55, 5, 0.2) +
      rect(x + 6, y - 44, 5, 44, "#5d6772") +
      rect(x + w - 11, y - 44, 5, 44, "#5d6772") +
      rect(x + 16, y - 40, 4, 36, "#4b545e") +
      rect(x + w - 20, y - 40, 4, 36, "#4b545e") +
      rrect(x - 2, y - 52, w + 4, 10, 2, color) +
      rect(x - 2, y - 44, w + 4, 3, shade(color, 0.3)),
  );
}

/** Potted plant; ground at y. */
export function pottedPlant(x, y, s = 1, { pot = P.coral, leaf = P.leaf } = {}) {
  const leaves = [[-20, -46, -40], [18, -48, 35], [-6, -60, -10], [10, -58, 15], [-24, -34, -60], [22, -34, 60]]
    .map(([lx, ly, a]) => `<ellipse cx="${lx}" cy="${ly}" rx="7" ry="17" fill="${a < 0 ? shade(leaf, 0.1) : leaf}" transform="rotate(${a} ${lx} ${ly})"/>`)
    .join("");
  return tr(x, y, contact(0, 0, 18, 4, 0.2) + leaves + ellipse(-4, -58, 3, 9, light(leaf, 0.3), 'opacity=".6"') + path("M-15 -24 L15 -24 L12 0 L-12 0Z", pot) + path("M3 -24 L15 -24 L12 0 L3 0Z", shade(pot, 0.18), 'opacity=".7"') + rrect(-17, -28, 34, 7, 2, light(pot, 0.15)), s);
}

/** Small round side table; ground at y. */
export function sideTable(x, y, w = 60, h = 52, color = P.wood) {
  return g(contact(x, y, w * 0.5, 5, 0.2) + rect(x - 3, y - h, 6, h, shade(color, 0.25)) + ellipse(x, y, 16, 3.5, shade(color, 0.25)) + ellipse(x, y - h, w / 2, 7, color) + ellipse(x, y - h - 2, w / 2, 6, light(color, 0.18)));
}

/** Fish tank on a low cabinet; ground at y. Returns art; tank top at y - cabH - th. */
export function fishTank(x, y, w = 130, th = 80, { cabH = 56, fish = 3, seed = 4 } = {}) {
  const R = rng(seed);
  let b = contact(x + w / 2, y, w * 0.55, 6, 0.2);
  b += rect(x - 4, y - cabH, w + 8, cabH, P.woodDark) + rect(x + 4, y - cabH + 8, w / 2 - 8, cabH - 16, shade(P.woodDark, 0.12)) + rect(x + w / 2 + 4, y - cabH + 8, w / 2 - 8, cabH - 16, shade(P.woodDark, 0.12));
  const ty = y - cabH - th;
  b += rect(x, ty, w, th, vgrad([[0, "#9fdcea"], [1, "#4ba8c6"]]));
  b += rect(x, ty + th - 12, w, 12, "#e2c98f") + ellipse(x + w * 0.3, ty + th - 12, 12, 4, "#d2b77b");
  b += stroke(`M${x + w * 0.78} ${ty + th - 10} q-6 -16 2 -30 q6 -12 0 -24M${x + w * 0.84} ${ty + th - 10} q6 -14 -2 -26`, P.green, 3.2);
  const cols = [P.orange, P.gold, P.coral];
  for (let i = 0; i < fish; i++) b += fishShape(x + w * (0.2 + 0.25 * i) + R() * 8, ty + th * (0.3 + R() * 0.35), 0.75, cols[i % 3], i % 2 ? -1 : 1);
  b += circle(x + w * 0.62, ty + 20, 2, "#ffffff", 'opacity=".7"') + circle(x + w * 0.64, ty + 12, 1.4, "#ffffff", 'opacity=".7"');
  b += rect(x, ty, w, 5, "#d2eef5", 'opacity=".8"') + path(`M${x + 8} ${ty + th - 14} L${x + 30} ${ty + 6} L${x + 40} ${ty + 6} L${x + 18} ${ty + th - 14}Z`, "#ffffff", 'opacity=".2"');
  b += rect(x - 3, ty - 6, w + 6, 6, P.navy) + rect(x - 3, ty + th, w + 6, 4, P.navy);
  return b;
}

export function fishShape(x, y, s = 1, color = P.orange, facing = 1) {
  const b = ellipse(0, 0, 12, 7, color) + poly([[-10, 0], [-19, -7], [-19, 7]], shade(color, 0.12)) + path("M-2 -6 Q2 -11 6 -6Z", shade(color, 0.15)) + circle(6, -1.5, 1.6, P.ink) + ellipse(2, 2, 5, 2, light(color, 0.35), 'opacity=".6"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

export function turtle(x, y, s = 1, facing = 1) {
  const sh = "#5d8a4a";
  const b =
    ellipse(-22, 10, 9, 4, "#8cb56a", 'transform="rotate(30 -22 10)"') +
    ellipse(-20, -12, 10, 4.5, "#8cb56a", 'transform="rotate(-30 -20 -12)"') +
    ellipse(14, 14, 13, 5, "#8cb56a", 'transform="rotate(35 14 14)"') +
    ellipse(16, -15, 16, 6, "#8cb56a", 'transform="rotate(-35 16 -15)"') +
    ellipse(30, 0, 9, 7, "#9cc47a") +
    circle(34, -2, 1.6, P.ink) +
    ellipse(0, 0, 26, 18, sh) +
    path("M-12 -8 L0 -14 L12 -8 L12 6 L0 12 L-12 6Z", light(sh, 0.18)) +
    stroke("M-12 -8 L0 -2 L12 -8M0 -2 V12M-26 0 H-12M12 6 L24 4", shade(sh, 0.25), 1.4, 'opacity=".6"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/** Bean bag chair; ground at y. Seat height returned as y - 30*s. */
export function beanbag(x, y, s = 1, color = P.green) {
  return tr(x, y, contact(0, 0, 52, 8, 0.22) + path("M-50 0 Q-58 -40 -26 -56 Q-6 -66 18 -52 Q52 -40 50 0Z", color) + path("M10 -54 Q52 -40 50 0 L14 0Z", shade(color, 0.18), 'opacity=".7"') + path("M-40 -4 Q-30 -30 0 -30 Q30 -30 40 -4Z", shade(color, 0.12)) + ellipse(-24, -46, 14, 6, light(color, 0.3), 'opacity=".6"'), s);
}

/* ------------------------------------------------------------ outdoor set pieces */

/** School bus seen from the side; (x, y) = front bumper bottom; facing -1 drives left. */
export function bus(x, y, s = 1, { facing = -1 } = {}) {
  const Y = P.yellow;
  const L = 300;
  let b = contact(-L / 2, 0, L * 0.55, 8, 0.25);
  // body: hood at the front (x 0..-50), cabin to -L
  b += path(`M0 -8 L0 -48 Q0 -54 -6 -56 L-50 -60 L-56 -112 Q-58 -122 -68 -122 L-${L - 8} -122 Q-${L} -122 -${L} -112 L-${L} -8Z`, Y);
  b += path(`M-56 -112 Q-58 -122 -68 -122 L-${L - 8} -122 Q-${L} -122 -${L} -112 L-${L} -100 L-56 -100Z`, light(Y, 0.25), 'opacity=".7"');
  b += rect(-L, -44, L - 2, 6, P.ink, 'opacity=".85"') + rect(-L, -30, L - 2, 4, P.ink, 'opacity=".55"');
  b += path(`M0 -8 L0 -48 Q0 -54 -6 -56 L-50 -60 L-50 -8Z`, shade(Y, 0.08));
  // windows
  for (let i = 0; i < 6; i++) {
    const wx = -86 - i * 36;
    b += rrect(wx - 12, -106, 28, 30, 3, "#2f4a63") + path(`M${wx - 12} -76 L${wx + 2} -106 L${wx + 9} -106 L${wx - 5} -76Z`, "#ffffff", 'opacity=".18"');
  }
  b += rrect(-80, -106, 20, 70, 3, "#2f4a63") + line(-70, -104, -70, -40, Y, 2.4);
  b += path("M-54 -108 L-50 -64 L-44 -64 L-48 -108Z", "#2f4a63");
  // bumper, lights
  b += rrect(-6, -16, 12, 10, 3, "#3a3f46") + circle(-3, -50, 5, "#fff3b0") + circle(-3, -50, 14, "#fff3b0", 'opacity=".35"') + rrect(-L - 2, -60, 6, 12, 2, P.red);
  b += circle(-60, -118, 3.5, P.orange) + circle(-L + 14, -118, 3.5, P.orange);
  // wheels
  for (const wx of [-40, -L + 50]) b += circle(wx, -6, 22, "#2b2f36") + circle(wx, -6, 10, "#9aa3ad") + circle(wx, -6, 4, "#5b6168");
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/** Bus stop sign on a pole; ground at y. */
export function busStop(x, y, h = 150) {
  return g(contact(x, y, 12, 3, 0.2) + rect(x - 3, y - h, 6, h, "#7f8994") + rect(x - 3, y - h, 2.5, h, "#a3acb6") + rrect(x - 22, y - h - 6, 44, 34, 5, P.teal) + rrect(x - 16, y - h, 32, 20, 3, "#ffffff") + rect(x - 11, y - h + 4, 22, 9, P.teal, 'rx="2"') + circle(x - 6, y - h + 15, 2.2, P.teal) + circle(x + 6, y - h + 15, 2.2, P.teal));
}

/** Mountain with a snow cap; base centre x on y. */
export function mountain(x, y, w, h, { color = "#8d9a86", snow = true } = {}) {
  let b = poly([[x - w / 2, y], [x, y - h], [x + w / 2, y]], color);
  b += poly([[x, y - h], [x + w / 2, y], [x + w * 0.08, y]], shade(color, 0.16), 'opacity=".8"');
  if (snow) b += path(`M${x} ${y - h} L${x - w * 0.12} ${y - h * 0.76} L${x - w * 0.05} ${y - h * 0.8} L${x} ${y - h * 0.72} L${x + w * 0.05} ${y - h * 0.79} L${x + w * 0.12} ${y - h * 0.76}Z`, "#ffffff");
  return b;
}

/** Red barn; ground at y. */
export function barn(x, y, w = 120, h = 90) {
  const c = "#b8423a";
  let b = contact(x + w / 2, y, w * 0.6, 6, 0.2);
  b += poly([[x, y], [x, y - h], [x + w * 0.18, y - h - w * 0.32], [x + w * 0.82, y - h - w * 0.32], [x + w, y - h], [x + w, y]], c);
  b += poly([[x + w * 0.62, y], [x + w * 0.62, y - h - w * 0.32], [x + w * 0.82, y - h - w * 0.32], [x + w, y - h], [x + w, y]], shade(c, 0.15), 'opacity=".7"');
  b += path(`M${x - 6} ${y - h + 4} L${x + w * 0.18} ${y - h - w * 0.32 - 4} L${x + w * 0.82} ${y - h - w * 0.32 - 4} L${x + w + 6} ${y - h + 4}`, "none", `stroke="#5b4a46" stroke-width="7" stroke-linejoin="round"`);
  const dx = x + w / 2 - 24;
  b += rect(dx, y - 58, 48, 58, "#f6efe2") + rect(dx + 5, y - 53, 38, 53, shade(c, 0.12)) + stroke(`M${dx + 5} ${y - 53} L${dx + 43} ${y}M${dx + 43} ${y - 53} L${dx + 5} ${y}`, "#f6efe2", 4);
  b += rect(x + w / 2 - 12, y - h - 8, 24, 20, "#f6efe2") + rect(x + w / 2 - 9, y - h - 5, 18, 14, "#3d2b26");
  return b;
}

export function cow(x, y, s = 1, facing = 1) {
  const W = "#fbfaf6";
  const D = "#2e2a2a";
  let b = contact(0, 0, 40, 6, 0.2);
  b += stroke("M-26 -26 L-28 0M-16 -26 L-15 0M18 -26 L19 0M28 -26 L28 0", "#d9d4cc", 7);
  b += rrect(-36, -54, 72, 34, 16, W) + ellipse(0, -24, 30, 5, "#dcd6cc", 'opacity=".7"');
  b += path("M-20 -54 Q-8 -50 -10 -38 Q-18 -30 -28 -40 Q-30 -50 -20 -54Z", D) + path("M8 -36 Q20 -40 22 -28 L6 -24Z", D) + ellipse(-30, -32, 6, 7, D);
  b += stroke("M-36 -46 Q-46 -40 -44 -24", W, 3) + circle(-44, -22, 3, D);
  b += ellipse(16, -22, 8, 5, "#f2b2b6");
  b += rrect(30, -66, 22, 28, 9, W) + rrect(34, -46, 22, 14, 7, "#f2b2b6") + circle(40, -40, 1.5, "#b06a70") + circle(49, -40, 1.5, "#b06a70");
  b += circle(38, -56, 2, P.ink) + ellipse(28, -62, 7, 3.5, D, 'transform="rotate(-20 28 -62)"') + stroke("M34 -66 q-2 -6 2 -9M46 -66 q2 -6 -2 -9", "#e9dcc0", 2.6);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

export function chicken(x, y, s = 1, facing = 1) {
  const W = "#fbf7ee";
  let b = contact(0, 0, 13, 3, 0.2);
  b += stroke("M-3 -9 L-4 0 M-4 0 l-3 1M3 -9 L4 0 M4 0 l3 1", P.orange, 2);
  b += path("M-10 -18 L-20 -34 L-12 -30 L-16 -40 L-6 -28Z", shade(W, 0.1));
  b += ellipse(-1, -17, 14, 10, W) + path("M-14 -17 Q-1 -4 13 -17 Q12 -8 -1 -7 Q-12 -8 -14 -17Z", shade(W, 0.12));
  b += path("M4 -22 Q8 -30 10 -36 L16 -34 Q14 -24 12 -18Z", W);
  b += circle(12, -36, 6, W);
  b += ellipse(-3, -17, 8, 5, "#e9e2d4", 'transform="rotate(-12 -3 -17)"');
  b += poly([[17, -37], [23, -35], [17, -33]], P.gold) + circle(13.5, -37.5, 1.3, P.ink) + path("M8 -41 q1 -5 4 -3 q2 -4 4 -1 q2 -2 3 1 q-4 3 -11 3Z", P.red) + path("M16 -33 q2 4 -1 6 q-2 -3 1 -6Z", P.red);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * facing)} ${f(s)})">${b}</g>`;
}

/** Garden bed with tomato plants (red tomatoes); top of soil at y. */
export function tomatoBed(x, y, w, { n = 4, h = 24 } = {}) {
  let b = "";
  for (let i = 0; i < n; i++) {
    const px = x + (w / n) * (i + 0.5);
    b += stroke(`M${px} ${y} V${y - 62}`, "#8a6a3c", 2) + stroke(`M${px - 2} ${y} Q${px - 4} ${y - 30} ${px + 2} ${y - 58}`, P.leafDark, 3);
    const lv = [[-12, -22, -40], [12, -30, 40], [-10, -42, -30], [11, -50, 30], [-4, -58, -10]];
    for (const [lx, ly, a] of lv) b += `<ellipse cx="${px + lx}" cy="${y + ly}" rx="12" ry="7" fill="${a < 0 ? P.leaf : shade(P.leaf, 0.12)}" transform="rotate(${a} ${px + lx} ${y + ly})"/>`;
    for (const [tx, ty] of [[-9, -28], [8, -38], [-6, -48], [6, -20]]) b += circle(px + tx, y + ty, 5.6, P.red) + circle(px + tx - 1.8, y + ty - 1.8, 1.7, "#ffffff", 'opacity=".55"') + path(`M${px + tx - 3} ${y + ty - 5} l3 1.6 l3 -1.6 l-3 -1Z`, P.leafDark);
  }
  return b + bedBox(x, y, w, h);
}

/** Wooden bed box drawn in front of the plants. */
export function bedBox(x, y, w, h = 24) {
  return g(contact(x + w / 2, y + h, w * 0.55, 6, 0.22) + rect(x - 4, y - 4, w + 8, 8, P.soilDark) + rect(x - 6, y, w + 12, h, P.wood) + rect(x - 6, y, w + 12, 6, light(P.wood, 0.25)) + rect(x - 6, y + h - 6, w + 12, 6, shade(P.wood, 0.2)) + line(x + w / 2, y + 7, x + w / 2, y + h - 7, shade(P.wood, 0.2), 1.4));
}

/** Tall sunflowers in a bed; soil at y. */
export function sunflowerBed(x, y, w, { n = 4, tall = 120 } = {}) {
  let b = "";
  for (let i = 0; i < n; i++) {
    const px = x + (w / n) * (i + 0.5);
    const H = tall + (i % 2 ? -10 : 8);
    b += stroke(`M${px} ${y} Q${px + 4} ${y - H / 2} ${px} ${y - H}`, P.leafDark, 4);
    b += `<ellipse cx="${px - 12}" cy="${y - H * 0.4}" rx="13" ry="6" fill="${P.leaf}" transform="rotate(-25 ${px - 12} ${y - H * 0.4})"/><ellipse cx="${px + 13}" cy="${y - H * 0.6}" rx="13" ry="6" fill="${shade(P.leaf, 0.1)}" transform="rotate(25 ${px + 13} ${y - H * 0.6})"/>`;
    const cy = y - H;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const ex = px + Math.cos(a) * 14;
      const ey = cy + Math.sin(a) * 14;
      b += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="9" ry="4.4" fill="${k % 2 ? P.yellow : P.goldLight}" transform="rotate(${f((a * 180) / Math.PI)} ${f(ex)} ${f(ey)})"/>`;
    }
    b += circle(px, cy, 9.5, "#6e4320") + circle(px - 2.5, cy - 2.5, 4, "#8a5a2e");
  }
  return b + bedBox(x, y, w);
}

/** Recycling bin, front view; ground at y; `fill` art sits on the rim. */
export function recycleBin(x, y, w, h, color, fill = "") {
  let b = contact(x + w / 2, y, w * 0.6, 7, 0.22);
  b += fill;
  b += path(`M${x} ${y - h} L${x + w} ${y - h} L${x + w - 12} ${y} L${x + 12} ${y}Z`, color);
  b += path(`M${x + w * 0.68} ${y - h} L${x + w} ${y - h} L${x + w - 12} ${y} L${x + w * 0.66} ${y}Z`, shade(color, 0.16), 'opacity=".8"');
  b += path(`M${x + 8} ${y - h} L${x + 22} ${y - h} L${x + 30} ${y} L${x + 18} ${y}Z`, light(color, 0.25), 'opacity=".5"');
  b += rrect(x - 8, y - h - 10, w + 16, 16, 5, shade(color, 0.12)) + rect(x - 8, y - h - 10, w + 16, 5, light(color, 0.2), 'rx="3"');
  b += recycleSymbol(x + w / 2, y - h * 0.48, w * 0.2, "#ffffff");
  return b;
}

/** Three chasing arrows around a triangle. */
export function recycleSymbol(cx, cy, r, color) {
  const pts = [0, 120, 240].map((a) => {
    const t = ((a - 90) * Math.PI) / 180;
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
  });
  let s = "";
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 3];
    const sx = ax + (bx - ax) * 0.16;
    const sy = ay + (by - ay) * 0.16;
    const ex = ax + (bx - ax) * 0.74;
    const ey = ay + (by - ay) * 0.74;
    s += arrow(`M${f(sx)} ${f(sy)} L${f(ex)} ${f(ey)}`, color, r * 0.16);
  }
  return g(s, 'opacity=".95"');
}

/** Plate in perspective, centre (x, y). */
export function plate(x, y, rx = 46, ry = 13) {
  return g(contact(x, y + ry * 0.6, rx * 1.02, ry * 0.7, 0.18) + ellipse(x, y, rx, ry, "#e9eef1") + ellipse(x, y - 1, rx * 0.72, ry * 0.62, "#ffffff") + ellipse(x, y - 1, rx * 0.72, ry * 0.62, "none", `stroke="#d7dfe4" stroke-width="1.4"`));
}

/** Ice cube in 3/4 view sitting on (x, y). */
export function iceCube(x, y, s = 1) {
  return tr(x, y, path("M-9 0 L-9 -12 L0 -16 L9 -12 L9 0 L0 4Z", "#d6f0fa") + path("M-9 -12 L0 -16 L9 -12 L0 -8Z", "#f4fcff") + path("M0 -8 L9 -12 L9 0 L0 4Z", "#aedbea") + path("M-6 -3 L-6 -9", "none", `stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"`), s);
}

/** Wooden fence gate swung open (hinged at x, ground y). */
export function openGate(x, y, h = 70, color = "#f4efe6") {
  // Picket gate swung open toward the viewer, hinged on a post at x.
  const n = 3;
  const dx = 11;
  const dy = 9;
  let b = contact(x + 18, y + 14, 24, 4, 0.16);
  b += path(`M${x + 2} ${y - h * 0.72} l${n * dx + 4} ${n * dy + 3} v5 l${-(n * dx + 4)} ${-(n * dy + 3)}Z M${x + 2} ${y - h * 0.32} l${n * dx + 4} ${n * dy + 3} v5 l${-(n * dx + 4)} ${-(n * dy + 3)}Z`, shade(color, 0.16));
  for (let i = 0; i < n; i++) {
    const px = x + 4 + i * dx;
    const py = y + i * dy;
    b += path(`M${px} ${py} V${py - h + 6} l4 -6 l4 6 V${py}Z`, color) + rect(px + 5.5, py - h + 4, 2.5, h - 4, shade(color, 0.12), 'opacity=".6"');
  }
  return g(b + rect(x - 4, y - h - 6, 8, h + 6, shade(color, 0.2)));
}

export const heart = (x, y, s = 1, c = P.coral) => tr(x, y, path("M0 6 C-10 -2 -10 -10 -5 -11 C-2 -12 0 -9 0 -7 C0 -9 2 -12 5 -11 C10 -10 10 -2 0 6Z", c), s);

/** Market stall back (posts + awning), counter is stallFront. */
export function stallBack(x, y, w, awning, { post = 150 } = {}) {
  let b = contact(x + w / 2, y, w * 0.55, 7, 0.22);
  b += rect(x + 4, y - post, 7, post, P.woodDark) + rect(x + w - 11, y - post, 7, post, P.woodDark);
  b += rect(x + 10, y - post + 10, w - 20, post - 62, mix(P.wall, awning, 0.06), 'opacity=".5"');
  const n = 6;
  const top = y - post - 14;
  for (let i = 0; i < n; i++) {
    const sx = x - 8 + ((w + 16) / n) * i;
    b += path(`M${f(sx)} ${top} h${f((w + 16) / n)} v24 a${f((w + 16) / n / 2)} 9 0 0 1 ${f(-(w + 16) / n)} 0Z`, i % 2 ? "#fbf6ec" : awning);
  }
  b += rect(x - 8, top - 4, w + 16, 7, shade(awning, 0.2));
  return b;
}
export function stallFront(x, y, w, goods = "") {
  return g(rect(x, y - 56, w, 56, P.wood) + rect(x, y - 56, w, 6, light(P.wood, 0.25)) + rect(x + w * 0.7, y - 50, w * 0.3, 50, shade(P.wood, 0.12), 'opacity=".6"') + stroke(`M${x} ${y - 30} H${x + w}`, shade(P.wood, 0.18), 1.6) + goods);
}

export const loaf = (x, y, s = 1) => tr(x, y, ellipse(0, 0, 16, 9, "#c8873f") + ellipse(-2, -3, 13, 5.5, "#dda25a") + stroke("M-8 -4 l3 5M-2 -6 l3 5M4 -6 l3 5", "#a96b2c", 1.6), s);
export const corn = (x, y, s = 1, a = 0) => tr(x, y, `<g transform="rotate(${a})">${ellipse(0, 0, 5.5, 15, P.yellow)}${path("M0 -6 Q-4 -2 -2 6", "none", `stroke="${P.gold}" stroke-width="1.2"`)}${path("M-6 6 Q-9 -6 -3 -16 L-2 4Z", P.leaf)}${path("M6 6 Q9 -6 3 -16 L2 4Z", P.leafDark)}</g>`, s);
export const carrot = (x, y, s = 1, a = 0) => tr(x, y, `<g transform="rotate(${a})">${path("M-4 -10 L4 -10 L0 14Z", P.orange)}${stroke("M-2 -4 h3M-1 2 h2", shade(P.orange, 0.3), 1)}${path("M0 -10 q-6 -8 -4 -12 M0 -10 q0 -9 2 -12 M0 -10 q6 -7 5 -11", "none", `stroke="${P.leaf}" stroke-width="2"`)}</g>`, s);
export const banana = (x, y, s = 1) => tr(x, y, path("M-14 -2 Q0 12 16 -4 Q14 2 0 6 Q-10 6 -14 -2Z", P.yellow) + path("M-14 -2 Q-2 4 14 -6 Q12 -2 0 2 Q-10 2 -14 -2Z", P.goldLight) + circle(16, -4, 1.6, "#6b4b2a"), s);

/** Wavy rising vapour line. */
export const vapor = (x, y, h, c = "#ffffff") => stroke(`M${x} ${y} q-6 ${-h / 6} 0 ${-h / 3} q6 ${-h / 6} 0 ${-h / 3} q-6 ${-h / 6} 0 ${-h / 3}`, c, 2.6, 'opacity=".9"');

export { tag, text };
