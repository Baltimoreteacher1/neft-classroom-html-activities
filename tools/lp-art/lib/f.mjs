// Illustrator F helpers: lab, classroom and science-diagram props for the Grades 6-8 pictures.
// Built only on kit primitives; same art direction (no outlines, lit/shade sides, contact shadows).
import { P, def, g, tr, rect, rrect, circle, ellipse, path, poly, line, stroke, contact, vgrad, rgrad, shade, light, mix, rng, text } from "../kit.mjs";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/* ------------------------------------------------------------ person geometry (mirrors kit person()) */

const POSE_ARMS = {
  stand: { la: [-8, 4], ra: [8, -4] },
  point: { la: [-8, 4], ra: [92, 0] },
  reach: { la: [-8, 4], ra: [140, 10] },
  hold: { la: [40, 70], ra: [44, 72] },
  read: { la: [36, 80], ra: [40, 84] },
  sit: { la: [30, 40], ra: [36, 44] },
  carry: { la: [20, 90], ra: [24, 92] },
};

/** World position of a hand for a kit person() at (x, y) of height h. side: 1 front arm, -1 back arm. */
export function handAt(x, y, h, { pose = "stand", facing = 1, age = "adult", side = 1 } = {}) {
  const child = age === "child";
  const headR = child ? 13 : 10.2;
  const shoulderY = -100 + headR * 2 + (child ? 3 : 4);
  const torsoW = child ? 15 : 16.5;
  const armLen = child ? 30 : 34;
  const [a1, a2] = (POSE_ARMS[pose] || POSE_ARMS.stand)[side > 0 ? "ra" : "la"];
  const r1 = (a1 * Math.PI) / 180;
  const r2 = ((a1 + a2) * Math.PI) / 180;
  const lx = side * torsoW * 0.62 + Math.sin(r1) * (armLen / 2) + Math.sin(r2) * (armLen / 2);
  let ly = shoulderY + 3 + Math.cos(r1) * (armLen / 2) + Math.cos(r2) * (armLen / 2);
  if (pose === "sit") ly += child ? 44 : 48;
  const s = h / 100;
  return [x + facing * lx * s, y + ly * s];
}

/** World centre and radius of the head of a kit person(). */
export function headAt(x, y, h, { age = "adult", pose = "stand" } = {}) {
  const child = age === "child";
  const hr = child ? 13 : 10.2;
  const s = h / 100;
  const lift = pose === "sit" ? (child ? 44 : 48) : 0;
  return { x, y: y + (-100 + hr + lift) * s, r: hr * s };
}

/** Safety goggles drawn over a kit person's eyes. */
export function goggles(x, y, h, o = {}) {
  const { facing = 1 } = o;
  const H = headAt(x, y, h, o);
  const r = H.r;
  const fx = H.x + facing * r * 0.28;
  const ey = H.y + r * 0.08;
  const lens = (cx) => rrect(cx - r * 0.27, ey - r * 0.24, r * 0.54, r * 0.46, r * 0.18, "#d8f1f6", 'opacity=".85"');
  return g(
    stroke(`M${f(H.x - facing * r * 0.98)} ${f(ey - r * 0.05)}Q${f(H.x)} ${f(ey - r * 0.2)} ${f(fx - facing * r * 0.5)} ${f(ey)}`, "#2f6b7a", r * 0.2) +
      rrect(fx - r * 0.62, ey - r * 0.32, r * 1.26, r * 0.62, r * 0.26, "#2f8f97") +
      lens(fx - r * 0.3) +
      lens(fx + r * 0.32) +
      rect(fx - r * 0.42, ey - r * 0.2, r * 0.14, r * 0.3, "#ffffff", 'opacity=".7"') +
      rect(fx + r * 0.2, ey - r * 0.2, r * 0.14, r * 0.3, "#ffffff", 'opacity=".7"'),
  );
}

/* ------------------------------------------------------------ rooms */

/** Warm interior wall with a skirting board and a wood floor from floorY down. */
export function room(W, H, floorY, { wall = P.wall, floor = "floor" } = {}) {
  const fl = { floor: ["#e2c39a", P.floor, "#c49e70"], tile: ["#e9e4da", "#dcd6ca", "#c8c1b3"] }[floor];
  let s = rect(0, 0, W, floorY, vgrad([[0, light(wall, 0.12)], [1, wall]]));
  s += rect(0, floorY - 10, W, 10, shade(wall, 0.12));
  s += rect(0, floorY, W, H - floorY, vgrad([[0, fl[0]], [1, fl[2]]]));
  let d = "";
  if (floor === "tile") {
    for (let x = -40; x <= W + 40; x += 64) d += `M${f(W / 2 + (x - W / 2) * 0.55)} ${floorY}L${f(x)} ${H}`;
    for (let k = 1; k < 4; k++) d += `M0 ${f(floorY + (H - floorY) * (k * k) / 12)}H${W}`;
  } else {
    for (let k = 1; k < 5; k++) d += `M0 ${f(floorY + (H - floorY) * (k * k) / 22)}H${W}`;
  }
  s += stroke(d, shade(fl[1], 0.25), 1.2, 'opacity=".35"');
  return s;
}

/** A soft sunlight patch thrown by a window onto a wall or floor. */
export const lightPatch = (pts, o = 0.16) => poly(pts, "#fff3d6", `opacity="${o}"`);

/** Lab bench: worktop at top y, cabinet front down to bottom; returns svg. */
export function labBench(x, y, w, bottom, { top = "#4d5f72", body = "#c7d0d6", drawers = 2 } = {}) {
  let s = rect(x + 6, y + 10, w - 12, bottom - y - 10, body);
  s += rect(x + 6, y + 10, w - 12, 8, shade(body, 0.22));
  const dw = (w - 12 - 18 * (drawers + 1)) / drawers;
  for (let i = 0; i < drawers; i++) {
    const dx = x + 6 + 18 + i * (dw + 18);
    s += rrect(dx, y + 30, dw, Math.min(56, bottom - y - 44), 4, light(body, 0.18));
    s += rrect(dx + dw / 2 - 18, y + 42, 36, 6, 3, shade(body, 0.35));
  }
  s += rrect(x, y, w, 12, 3, top) + rect(x, y, w, 3, light(top, 0.3)) + rect(x, y + 10, w, 2, shade(top, 0.3));
  return s;
}

/** Wall shelf with jars / bottles. */
export function shelfJars(x, y, w, { seed = 2, colors = [P.teal, P.gold, P.coral, "#9fc9d6", P.purple] } = {}) {
  const R = rng(seed);
  let s = rect(x, y, w, 7, P.woodDark) + rect(x, y, w, 2, light(P.wood, 0.1)) + rect(x + 10, y + 7, 5, 12, P.woodDark) + rect(x + w - 15, y + 7, 5, 12, P.woodDark);
  let bx = x + 10;
  let i = 0;
  while (bx < x + w - 26) {
    const c = colors[i % colors.length];
    const bw = 16 + R() * 10;
    const bh = 22 + R() * 18;
    s += rrect(bx, y - bh, bw, bh, 4, "#e9f3f5", 'opacity=".9"') + rrect(bx + 2, y - bh * 0.62, bw - 4, bh * 0.62 - 2, 3, c, 'opacity=".85"');
    s += rect(bx + bw * 0.25, y - bh - 5, bw * 0.5, 6, shade(c, 0.3)) + rect(bx + 3, y - bh + 4, 3, bh - 8, "#ffffff", 'opacity=".5"');
    bx += bw + 8 + R() * 8;
    i++;
  }
  return s;
}

/* ------------------------------------------------------------ lab equipment */

/** Microscope standing on (x, y); eyepiece points left (dir -1) or right (dir 1). ~100 units tall at s = 1. */
export function microscope(x, y, s = 1, { dir = -1 } = {}) {
  const body = "#34506b";
  const lit = light(body, 0.3);
  let b = contact(0, 0, 38, 5, 0.22);
  b += rrect(-34, -11, 66, 11, 4, body) + rect(-34, -11, 66, 3, lit);
  b += circle(-6, -17, 6, "#f3e3a2") + ellipse(-6, -15, 10, 3, shade(body, 0.2));
  // C-arm
  b += path("M10 -11 C26 -30 26 -64 8 -80 L-2 -72 C12 -60 12 -34 0 -11Z", body) + path("M10 -11 C26 -30 26 -64 8 -80 L5 -77 C20 -62 20 -32 6 -11Z", lit, 'opacity=".55"');
  // stage + clips
  b += rrect(-30, -42, 42, 6, 2, shade(body, 0.15)) + rect(-24, -45, 14, 3, "#e8eef2") + rect(-21, -46, 8, 1.5, P.coralLight);
  // nosepiece + objective
  b += rrect(-12, -60, 14, 7, 2, "#c9d1d9") + rrect(-9, -55, 7, 9, 2, "#9aa7b4");
  // tube to eyepiece
  b += line(-4, -62, -18, -94, body, 13) + line(-6, -64, -18, -92, lit, 3, 'opacity=".6"');
  b += rrect(-27, -104, 16, 10, 3, "#c9d1d9", 'transform="rotate(-24 -19 -99)"');
  // focus knobs
  b += circle(14, -48, 8, shade(body, 0.1)) + circle(14, -48, 4, "#c9d1d9") + circle(12, -50, 1.6, "#ffffff", 'opacity=".7"');
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(-dir * s)} ${f(s)})">${b}</g>`;
}
/** Eyepiece tip of microscope(x, y, s, dir) in world units. */
export const eyepieceAt = (x, y, s = 1, dir = -1) => [x + dir * 21 * s, y - 103 * s];

/** Test-tube rack with tubes of coloured liquid; ground (bench) at y; returns svg. */
export function tubeRack(x, y, colors, { gap = 18 } = {}) {
  const n = colors.length;
  const w = n * gap + 16;
  let s = contact(x + w / 2, y, w * 0.55, 4, 0.2);
  s += rect(x + 4, y - 30, 5, 30, P.woodDark) + rect(x + w - 9, y - 30, 5, 30, P.woodDark);
  s += rrect(x, y - 8, w, 8, 2, P.wood);
  colors.forEach((c, i) => {
    const tx = x + 10 + i * gap;
    const lv = 0.42 + ((i * 37) % 5) * 0.07;
    s += rrect(tx, y - 66, 11, 64, 5.5, "#eef6f8", 'opacity=".9"');
    s += path(`M${tx} ${f(y - 2 - 64 * lv)}h11v${f(64 * lv - 5.5)}a5.5 5.5 0 0 1 -11 0Z`, c);
    s += rect(tx + 2, y - 62, 2.5, 52, "#ffffff", 'opacity=".75"');
    s += rrect(tx - 1.5, y - 68, 14, 5, 2, "#d5e0e5");
  });
  s += rrect(x, y - 32, w, 8, 2, P.wood) + rect(x, y - 32, w, 2.5, light(P.wood, 0.25));
  return s;
}

/** Beaker on (x, y) of width w; fill = 0..1 liquid level. */
export function beaker(x, y, w, h, { liquid = P.green, fill = 0.4, marks = true } = {}) {
  let s = contact(x, y, w * 0.6, 3.5, 0.2);
  const x0 = x - w / 2;
  s += path(`M${f(x0)} ${f(y - h)}h${f(w)}v${f(h - 6)}q0 6 -6 6h${f(-w + 12)}q-6 0 -6 -6Z`, "#e9f4f7", 'opacity=".92"');
  s += path(`M${f(x0)} ${f(y - h * fill)}h${f(w)}v${f(h * fill - 6)}q0 6 -6 6h${f(-w + 12)}q-6 0 -6 -6Z`, liquid, 'opacity=".9"');
  s += ellipse(x, y - h * fill, w / 2, 2.5, light(liquid, 0.35));
  s += rect(x0 - 3, y - h - 3, w + 6, 4, "#dbe8ec") + path(`M${f(x0 - 3)} ${f(y - h - 3)}l-5 -4h6Z`, "#dbe8ec");
  if (marks) for (let k = 1; k < 4; k++) s += line(x + w / 2 - 12, y - (h * k) / 4, x + w / 2 - 4, y - (h * k) / 4, "#7f98a6", 1.6);
  s += rect(x0 + 4, y - h + 4, 3.5, h - 12, "#ffffff", 'opacity=".7"');
  return s;
}

/** Wooden ruler lying on a bench, front edge at y. */
export function ruler(x, y, w, { color = P.goldLight } = {}) {
  let s = rect(x, y - 9, w, 9, color) + rect(x, y - 9, w, 2, light(color, 0.35)) + rect(x, y - 2, w, 2, shade(color, 0.25));
  let d = "";
  for (let i = 0; i * 7 <= w - 8; i++) d += `M${f(x + 4 + i * 7)} ${f(y - 9)}v${i % 5 === 0 ? 6 : 3.5}`;
  return s + stroke(d, shade(color, 0.55), 1.1);
}

/** Erlenmeyer flask drawn at the hand (0,0), tilted to pour. Used as a person() item. */
export function pouringFlask(liquid = P.green, tilt = -62) {
  const b =
    path("M-5 -26h10v14l12 20q2 6 -4 6h-26q-6 0 -4 -6l12 -20Z", "#e9f4f7", 'opacity=".95"') +
    path("M-11.5 -2h23l4 6q2 4 -4 4h-23q-6 0 -4 -4Z", liquid) +
    rect(-6, -28, 12, 4, "#dbe8ec") +
    rect(-3, -22, 2.4, 22, "#ffffff", 'opacity=".7"');
  return `<g transform="rotate(${tilt}) translate(0 6)">${b}</g>`;
}

/* ------------------------------------------------------------ classroom */

/** Flat-screen computer on a desk top at y. */
export function computer(x, y, s = 1, { screen = "#cfe6f2" } = {}) {
  const b =
    rect(-4, -14, 8, 14, "#5d6772") +
    rrect(-16, -3, 32, 4, 2, "#4b5560") +
    rrect(-30, -54, 60, 42, 4, "#2c3a4a") +
    rect(-26, -50, 52, 34, vgrad([[0, light(screen, 0.2)], [1, screen]])) +
    rect(-21, -44, 22, 4, P.blue) +
    rect(-21, -36, 34, 3, "#8fb3cc") +
    rect(-21, -30, 28, 3, "#8fb3cc") +
    path("M-26 -50h20l-14 34h-6Z", "#ffffff", 'opacity=".18"') +
    rrect(-24, 4, 40, 6, 2, "#d5dce2") +
    rect(-24, 4, 40, 2, "#eef2f5");
  return tr(x, y, b, s);
}

/** Artist's easel standing on y, with a small painting. */
export function easel(x, y, s = 1, { art = "sun" } = {}) {
  let b = contact(0, 0, 30, 5, 0.18);
  b += line(-22, 0, -6, -112, P.woodDark, 5) + line(22, 0, 6, -112, P.woodDark, 5) + line(0, 0, 0, -60, shade(P.woodDark, 0.2), 4);
  b += rect(-30, -50, 60, 5, P.wood);
  b += rect(-28, -100, 56, 50, "#fbf8f1") + rect(-25, -97, 50, 44, art === "sun" ? "#cfe6ee" : "#f6ead6");
  if (art === "sun") b += circle(-10, -85, 7, P.gold) + path("M-25 -53 Q-6 -74 10 -62 T25 -66 V-53Z", P.grass);
  else b += path("M-25 -53 L-8 -80 L6 -62 L14 -72 L25 -53Z", P.tealLight) + circle(12, -86, 6, P.coral);
  return tr(x, y, b, s);
}

/** Paint palette lying flat-ish on a table top at y. */
export function palette(x, y, s = 1) {
  const b =
    path("M-30 -2 C-34 -14 -16 -20 2 -18 C22 -16 34 -10 30 -2 C26 4 14 0 8 4 C2 8 -26 8 -30 -2Z", "#e2c08f") +
    ellipse(14, -6, 4, 2.4, shade("#e2c08f", 0.25)) +
    [[-20, -7, P.red], [-10, -12, P.gold], [2, -12, P.blue], [-14, 0, P.green], [22, -12, P.purple]].map(([a, b2, c]) => ellipse(a, b2, 4.5, 2.6, c)).join("");
  return tr(x, y, b, s);
}

/** Cup of brushes on a table top at y. */
export function brushCup(x, y, s = 1) {
  const b =
    line(-4, -16, -10, -42, P.woodDark, 2.4) + line(0, -16, 2, -46, P.wood, 2.4) + line(4, -16, 12, -40, P.woodDark, 2.4) +
    ellipse(-10, -44, 2.6, 4, P.coral) + ellipse(2, -48, 2.6, 4, P.blue) + ellipse(12, -42, 2.6, 4, P.gold) +
    path("M-9 -18h18l-2 18h-14Z", "#6aa2c2") + rect(-9, -18, 18, 3, light("#6aa2c2", 0.3));
  return tr(x, y, b, s);
}

/** Paint jar with a coloured lid, on y. */
export const paintJar = (x, y, c, s = 1) => tr(x, y, rrect(-8, -16, 16, 16, 3, "#eef3f5") + rrect(-7, -10, 14, 9, 2, c) + rrect(-9, -20, 18, 5, 2, shade(c, 0.15)), s);

/* ------------------------------------------------------------ diagrams */

/** Earth as a globe of radius r with a tilted axis (deg, + leans the north pole right) and a dark night side. */
export function earth(x, y, r, { tilt = 23.5, nightSide = 1 } = {}) {
  const ocean = vgrad([[0, "#62b3d8"], [1, "#2c7aa3"]]);
  const land = "#6fae6a";
  // simple continents in the globe's own (tilted) frame, unit radius
  const shapes = [
    "M-0.62 -0.55 C-0.4 -0.75 -0.05 -0.7 0.02 -0.5 C0.08 -0.32 -0.12 -0.18 -0.3 -0.12 C-0.44 -0.06 -0.4 0.12 -0.52 0.1 C-0.7 0.02 -0.78 -0.36 -0.62 -0.55Z",
    "M-0.3 0.12 C-0.12 0.08 -0.02 0.24 -0.08 0.42 C-0.14 0.6 -0.22 0.78 -0.32 0.72 C-0.36 0.52 -0.44 0.3 -0.3 0.12Z",
    "M0.22 -0.6 C0.42 -0.72 0.72 -0.6 0.74 -0.38 C0.76 -0.2 0.56 -0.14 0.48 0.02 C0.4 0.2 0.5 0.42 0.32 0.46 C0.18 0.36 0.24 0.14 0.14 0 C0.04 -0.16 0.06 -0.48 0.22 -0.6Z",
  ];
  const clipId = `ec${Math.round(x)}${Math.round(y)}`;
  let b = `<clipPath id="${clipId}"><circle cx="0" cy="0" r="${f(r)}"/></clipPath>`;
  b += circle(0, 0, r, ocean);
  b += `<g clip-path="url(#${clipId})"><g transform="rotate(${f(tilt)})">`;
  b += `<g transform="scale(${f(r)})">${shapes.map((d) => `<path d="${d}" fill="${land}"/>`).join("")}</g>`;
  b += ellipse(0, -r * 0.98, r * 0.4, r * 0.13, "#f2f7fa") + ellipse(0, r * 0.99, r * 0.42, r * 0.12, "#f2f7fa");
  b += stroke(`M${f(-r)} 0H${f(r)}`, "#ffffff", 1.8, 'opacity=".85" stroke-dasharray="5 4"');
  b += `</g>`;
  b += rect(nightSide > 0 ? 0 : -r, -r, r, r * 2, "#0a1830", 'opacity=".6"') + `</g>`;
  b += circle(0, 0, r, "none", `stroke="#ffffff" stroke-opacity=".3" stroke-width="1.5"`);
  const t = (tilt * Math.PI) / 180;
  const ax = Math.sin(t);
  const ay = -Math.cos(t);
  b += line(-ax * r * 1.35, -ay * r * 1.35, ax * r * 1.35, ay * r * 1.35, "#ffffff", 2.6);
  b += circle(ax * r * 1.35, ay * r * 1.35, 3.4, P.goldLight);
  return tr(x, y, b);
}

/** Cut tree stump on ground at y. */
export function stump(x, y, s = 1) {
  const b = contact(0, 0, 14, 3, 0.2) + path("M-11 0 L-9 -14 h18 L11 0Z", P.bark) + path("M3 -14 h6 L11 0 h-7Z", P.barkDark, 'opacity=".6"') + ellipse(0, -14, 9, 3.6, "#d9b48a") + ellipse(0, -14, 4.5, 1.8, "#c49a6c") + path("M-11 0 l-5 2 l6 0Z", P.barkDark);
  return tr(x, y, b, s);
}

export { mix, rgrad, text };

/**
 * Mirror a drawing left-right about the vertical line x. The kit person() always draws the face looking
 * right (its facing:-1 flips the body but double-flips the face), so a figure that must LOOK left is drawn
 * facing 1 and mirrored with this.
 */
export const mirrorX = (x, body) => `<g transform="translate(${f(2 * x)} 0) scale(-1 1)">${body}</g>`;

/* ------------------------------------------------------------ geometry stimuli */

/** Plain card background for a geometry stimulus: soft paper with a faint centre glow, no grid. */
export const shapeCard = (W, H) =>
  rect(0, 0, W, H, vgrad([[0, "#fafbfc"], [1, "#eef2f5"]])) + ellipse(W / 2, H / 2, W * 0.42, H * 0.4, rgrad([[0, "#ffffff", 0.9], [1, "#ffffff", 0]]));

/**
 * One flat geometric shape with a soft drop shadow, a gentle top-lit gradient and a crisp edge in a deep tone
 * of its own colour. `shape(attrs)` returns the SVG element for the exact geometry (so proportions never move).
 */
export function solidShape(shape, base) {
  const blur = def((i) => `<filter id="${i}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>`, "bl");
  const fill = vgrad([[0, light(base, 0.35)], [1, base]]);
  return g(
    `<g transform="translate(0 8)" opacity=".18">${shape(`fill="#1c2f4a" filter="url(#${blur})"`)}</g>` +
      shape(`fill="${fill}"`) +
      shape(`fill="none" stroke="${shade(base, 0.62)}" stroke-width="6" stroke-linejoin="miter"`),
  );
}

/** Camera push-in: scale a whole composed scene by k about the point (ax, ay) so figures read larger. */
export const cam = (ax, ay, k, body) => `<g transform="translate(${f(ax)} ${f(ay)}) scale(${f(k)}) translate(${f(-ax)} ${f(-ay)})">${body}</g>`;
