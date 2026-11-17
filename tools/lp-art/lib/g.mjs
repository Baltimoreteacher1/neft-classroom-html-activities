// Illustrator G helpers (lib/g.mjs): interface spot illustrations (empty states, completion, cards, heroes).
// Same art direction as the kit: no outlines, lit top-left, soft blurred shadows falling down-right,
// layered dimensional objects. Every scene that uses these calls begin() first in draw().
import { P, mix, shade, light, def, vgrad, rgrad, rect, rrect, circle, ellipse, path, poly, line, stroke, g, tr, text, rng } from "../kit.mjs";

/** Domain colours of the four language studios. */
export const DOM = { listening: "#075568", reading: "#2e4a94", speaking: "#8a3a5c", writing: "#9a4a26" };
export const INK = "#1c2f4a";

const f = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

let BL = {};
/** Reset per-scene filter cache. Call at the start of every scene's draw(). */
export function begin() {
  BL = {};
  return "";
}
function blurId(sd) {
  if (!BL[sd]) BL[sd] = def((i) => `<filter id="${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`, "bl");
  return BL[sd];
}
/** Blur any shape string (soft shadows, glows). */
export const blur = (body, sd = 6, o = 1) => `<g filter="url(#${blurId(sd)})"${o !== 1 ? ` opacity="${f(o)}"` : ""}>${body}</g>`;

/** Rotate a body about (x, y). */
export const rot = (x, y, deg, body) => (deg ? `<g transform="rotate(${f(deg)} ${f(x)} ${f(y)})">${body}</g>` : body);

/** Body fill: lit at the top, shade at the bottom. */
export const grad = (c, up = 0.16, down = 0.1) => vgrad([[0, light(c, up)], [1, shade(c, down)]]);

/** Soft drop shadow for a rounded rectangle; light comes from the top-left. */
export const dropRect = (x, y, w, h, r, { sd = 7, o = 0.2, dx = 3, dy = 8 } = {}) => blur(rrect(x + dx, y + dy, w, h, r, INK), sd, o);
export const dropEllipse = (x, y, rx, ry, { sd = 6, o = 0.2 } = {}) => blur(ellipse(x, y, rx, ry, INK), sd, o);

/** Soft halo/glow disc behind a subject. */
export const halo = (x, y, r, color, o = 0.9) => circle(x, y, r, rgrad([[0, color, o], [0.62, color, o * 0.75], [1, color, 0]]));

/** Organic backdrop blob (a softly squashed circle). */
export function blob(cx, cy, rx, ry, color, { tilt = 0 } = {}) {
  const k = 0.56;
  const d = `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy - ry * k * 1.1)} ${f(cx - rx * k)} ${f(cy - ry)} ${f(cx + rx * 0.05)} ${f(cy - ry)}C${f(cx + rx * 0.7)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * 0.45)} ${f(cx + rx)} ${f(cy + ry * 0.05)}C${f(cx + rx)} ${f(cy + ry * 0.62)} ${f(cx + rx * 0.5)} ${f(cy + ry)} ${f(cx - rx * 0.05)} ${f(cy + ry)}C${f(cx - rx * 0.62)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * 0.6)} ${f(cx - rx)} ${f(cy)}Z`;
  return rot(cx, cy, tilt, path(d, color));
}

/** Full-bleed background wash with a soft light pool. r = corner radius (0 keeps the edge square). */
export function wash(w, h, top, bottom, { r = 0, glow = null, gx = 0.5, gy = 0.45, gr = 0.42 } = {}) {
  let s = rrect(0, 0, w, h, r, vgrad([[0, top], [1, bottom]]));
  if (glow) s += circle(w * gx, h * gy, Math.max(w, h) * gr, rgrad([[0, glow, 0.85], [1, glow, 0]]));
  return s;
}

/** Four-point sparkle. */
export const sparkle = (x, y, s = 8, color = P.gold) =>
  path(`M${f(x)} ${f(y - s)}Q${f(x + s * 0.16)} ${f(y - s * 0.16)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.16)} ${f(y + s * 0.16)} ${f(x)} ${f(y + s)}Q${f(x - s * 0.16)} ${f(y + s * 0.16)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.16)} ${f(y - s * 0.16)} ${f(x)} ${f(y - s)}Z`, color);

/** Lit sphere dot (confetti, map stops). */
export const bead = (x, y, r, c) => circle(x, y, r, grad(c, 0.25, 0.12)) + circle(x - r * 0.32, y - r * 0.34, r * 0.32, "#ffffff", 'opacity=".45"');

/** Paper card: shadow, body, lit top edge. */
export function card(x, y, w, h, r = 12, fill = "#ffffff", { sd = 7, o = 0.18, dy = 8, edge = true, flat = false } = {}) {
  let s = dropRect(x, y, w, h, r, { sd, o, dy });
  s += rrect(x, y, w, h, r, flat ? fill : vgrad([[0, light(fill, 0.25)], [1, mix(fill, "#e8e1d4", 0.18)]]));
  if (edge) s += rrect(x, y + h - 3, w, 3, Math.min(r, 3), shade(fill, 0.12), 'opacity=".5"');
  return s;
}

/** Placeholder text lines (rounded bars). widths are fractions of w. */
export function bars(x, y, w, widths, { gap = 12, h = 6, color = "#c9d1da" } = {}) {
  return widths.map((k, i) => rrect(x, y + i * gap, w * k, h, h / 2, color)).join("");
}

/** Check badge: lit disc with a white tick. */
export function check(x, y, r, color = P.teal, { shadow = true, ring = true } = {}) {
  let s = shadow ? dropEllipse(x + r * 0.08, y + r * 0.22, r * 0.98, r * 0.92, { sd: r * 0.18, o: 0.22 }) : "";
  if (ring) s += circle(x, y, r, "#ffffff");
  const rr = ring ? r * 0.84 : r;
  s += circle(x, y, rr, grad(color, 0.22, 0.12));
  s += path(`M${f(x - rr * 0.62)} ${f(y - rr * 0.5)}A${f(rr * 0.8)} ${f(rr * 0.8)} 0 0 1 ${f(x + rr * 0.5)} ${f(y - rr * 0.62)}A${f(rr * 0.9)} ${f(rr * 0.9)} 0 0 0 ${f(x - rr * 0.62)} ${f(y - rr * 0.5)}Z`, "#ffffff", 'opacity=".22"');
  s += stroke(`M${f(x - rr * 0.42)} ${f(y + rr * 0.02)}L${f(x - rr * 0.1)} ${f(y + rr * 0.34)}L${f(x + rr * 0.46)} ${f(y - rr * 0.3)}`, "#ffffff", rr * 0.2);
  return s;
}

/** Speech bubble with a tail. tail: "bl" | "br" | "bc"; fill is a colour. */
export function bubble(x, y, w, h, fill, { r = 16, tail = "bl", shadow = true } = {}) {
  const tx = tail === "br" ? x + w * 0.74 : tail === "bc" ? x + w * 0.46 : x + w * 0.2;
  const dir = tail === "br" ? 1 : -1;
  const d = `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(tx + 14)}L${f(tx + dir * 6 + (dir > 0 ? 14 : 0))} ${f(y + h + 18)}L${f(tx - 2)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
  let s = shadow ? blur(`<path d="${d}" fill="${INK}" transform="translate(3 8)"/>`, 7, 0.2) : "";
  s += path(d, vgrad([[0, light(fill, 0.14)], [1, shade(fill, 0.08)]]));
  s += rrect(x + r * 0.6, y + 3, w - r * 1.2, 3, 1.5, "#ffffff", 'opacity=".22"');
  return s;
}

/** Sound wave: n rounded bars centred on (x, y) across width w. */
export function wave(x, y, w, h, color, n = 13, seed = [0.35, 0.6, 1, 0.7, 0.45, 0.85, 0.55, 0.95, 0.6, 0.4, 0.75, 0.5, 0.3]) {
  let s = "";
  const step = w / (n - 1);
  const bw = Math.max(2.4, step * 0.46);
  for (let i = 0; i < n; i++) {
    const k = seed[i % seed.length];
    const bh = Math.max(bw, h * k);
    s += rrect(x - w / 2 + i * step - bw / 2, y - bh / 2, bw, bh, bw / 2, color);
  }
  return s;
}

/** Pencil from (x, y) (the tip) pointing at angle deg (0 = tip to the left, rotating clockwise). */
export function pencil(x, y, len = 150, deg = 0, { body = P.gold, w = 16 } = {}) {
  const h = w / 2;
  let b = blur(rrect(18, -h + 10, len - 14, w, h, INK), 5, 0.2);
  b += poly([[0, 0], [24, -h], [24, h]], "#efd2a6") + poly([[0, 0], [24, 0], [24, h]], "#d9b382");
  b += poly([[0, 0], [8, -h / 3], [8, h / 3]], "#33414f");
  b += rect(24, -h, len - 58, w, body) + rect(24, -h, len - 58, w / 3, light(body, 0.3)) + rect(24, h - w / 3, len - 58, w / 3, shade(body, 0.18));
  b += rect(len - 34, -h, 14, w, "#c9ccd2") + rect(len - 34, -h, 14, w / 3, "#eef0f3") + line(len - 30, -h, len - 30, h, "#a7abb3", 1.2) + line(len - 24, -h, len - 24, h, "#a7abb3", 1.2);
  b += path(`M${len - 20} ${-h}H${len - h}A${h} ${h} 0 0 1 ${len - h} ${h}H${len - 20}Z`, P.coralLight) + rect(len - 20, -h, 10, w / 3, light(P.coralLight, 0.3));
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">${b}</g>`;
}

/** Magnifying glass: lens centre (x, y), radius r, handle toward angle deg (45 = down-right). inner = svg clipped to lens. */
export function magnifier(x, y, r, { deg = 45, rim = P.navy, handle = P.coral, inner = "" } = {}) {
  const a = (deg * Math.PI) / 180;
  const hx = x + Math.cos(a) * r * 1.08;
  const hy = y + Math.sin(a) * r * 1.08;
  const ex = x + Math.cos(a) * r * 2.05;
  const ey = y + Math.sin(a) * r * 2.05;
  let s = blur(line(hx + 4, hy + 9, ex + 4, ey + 9, INK, r * 0.3) + circle(x + 4, y + 9, r * 1.08, INK), r * 0.12, 0.2);
  s += line(hx, hy, ex, ey, shade(handle, 0.15), r * 0.3) + line(hx - 1, hy - 1.5, ex - 1, ey - 1.5, light(handle, 0.15), r * 0.14);
  const cid = def((i) => `<clipPath id="${i}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.92)}"/></clipPath>`, "cp");
  s += circle(x, y, r * 0.92, "#eaf5f8") + `<g clip-path="url(#${cid})">${inner}</g>`;
  s += circle(x, y, r * 0.92, rgrad([[0, "#ffffff", 0], [0.7, "#ffffff", 0], [1, "#bfe0ee", 0.55]]));
  s += circle(x, y, r, "none", `stroke="${rim}" stroke-width="${f(r * 0.16)}"`);
  s += path(`M${f(x - r * 0.62)} ${f(y - r * 0.2)}A${f(r * 0.66)} ${f(r * 0.66)} 0 0 1 ${f(x - r * 0.18)} ${f(y - r * 0.64)}`, "none", `stroke="#ffffff" stroke-width="${f(r * 0.1)}" stroke-linecap="round" opacity=".8"`);
  return s;
}

/** Ground shadow ellipse (soft). */
export const floorShadow = (x, y, rx, ry = rx * 0.14, o = 0.22) => blur(ellipse(x, y, rx, ry, INK), Math.max(3, ry * 0.6), o);

/** Five-point star path centred at (x, y). */
export function star(x, y, r, color, inner = 0.45) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return poly(pts, color);
}

/** Small decorative confetti scattered around a frame (deterministic list of [x, y, kind, colour, angle]). */
export function confetti(list) {
  return list
    .map(([x, y, k, c, a = 0]) => (k === "s" ? sparkle(x, y, 7, c) : k === "d" ? circle(x, y, 4, c) : rot(x, y, a, rrect(x - 5, y - 2.5, 10, 5, 2, c))))
    .join("");
}

/* ------------------------------------------------------------------ language world cards */
// Shared stage for the four Language World cards: tinted wall, soft halo, domain-coloured tabletop.

export function stage(dom, { wall = "#f6f1e7" } = {}) {
  const top = mix(wall, light(dom, 0.85), 0.5);
  return (
    wash(640, 360, top, mix(wall, light(dom, 0.7), 0.55), { glow: "#ffffff", gy: 0.4, gr: 0.36 }) +
    halo(320, 190, 170, light(dom, 0.72), 0.75) +
    rect(0, 300, 640, 60, vgrad([[0, light(dom, 0.12)], [1, shade(dom, 0.12)]])) +
    rect(0, 300, 640, 5, light(dom, 0.35))
  );
}
export const dots = (dom, { right = true } = {}) =>
  sparkle(54, 70, 9, P.gold) + circle(84, 236, 4.5, light(dom, 0.2)) + circle(40, 150, 3.5, P.coral) +
  (right ? sparkle(594, 62, 8, P.coral) + circle(576, 214, 4.5, P.gold) + sparkle(560, 128, 5, P.navy) : sparkle(352, 56, 7, P.coral) + circle(606, 250, 4, P.gold));

/* ------------------------------------------------------------------ rain-garden diagrams */
// Rain-garden diagram parts shared by publisher/rain-garden.svg and publisher/rain-garden-steps.svg.

export const WATER = "#2b6fa5";
export const SOIL = "#7f6446";

/** Soil block with darker depth and scattered pebbles. */
export function soil(x, y, w, h, { base = SOIL, seed = 3, pebbles = 10 } = {}) {
  const R = rng(seed);
  let s = rect(x, y, w, h, vgrad([[0, light(base, 0.06)], [1, shade(base, 0.14)]]));
  for (let i = 0; i < pebbles; i++) {
    const px = x + 10 + R() * (w - 20);
    const py = y + 14 + R() * (h - 24);
    const r = 2 + R() * 3;
    s += ellipse(px, py, r * 1.3, r, light(base, 0.25), 'opacity=".55"');
  }
  return s;
}
/** Pavement slab with a lit top edge and faint aggregate. */
export function pavement(x, y, w, h, { base = "#7d8791", seed = 5 } = {}) {
  const R = rng(seed);
  let s = rect(x, y, w, h, vgrad([[0, light(base, 0.12)], [1, shade(base, 0.08)]])) + rect(x, y, w, 3, light(base, 0.35));
  for (let i = 0; i < Math.round(w / 9); i++) s += circle(x + R() * w, y + 6 + R() * (h - 9), 0.9 + R() * 0.8, light(base, 0.3), 'opacity=".6"');
  return s;
}
/** Grass fringe along a surface line. */
export function grassEdge(x0, x1, y, seed = 4) {
  const R = rng(seed);
  let d = "";
  for (let x = x0 + 3; x < x1 - 2; x += 5 + R() * 4) {
    const k = 5 + R() * 5;
    d += `M${x.toFixed(1)} ${y}l${(-k * 0.3).toFixed(1)} ${(-k).toFixed(1)}M${x.toFixed(1)} ${y}l${(k * 0.35).toFixed(1)} ${(-k * 0.9).toFixed(1)}`;
  }
  return rect(x0, y - 2, x1 - x0, 5, P.grass) + `<path d="${d}" stroke="${P.grassDark}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
}
/** A leafy bog plant: stem from (x, y) up to height h, with leaves and a round seed-head colour c. */
export function plant(x, y, h, { leaf = "#2f7d46", head = "#3f9a5b", r = 9 } = {}) {
  let s = line(x, y, x, y - h, leaf, 4);
  s += path(`M${x} ${y - h * 0.35} q-16 -6 -20 -20 q14 2 20 14Z`, light(leaf, 0.1)) + path(`M${x} ${y - h * 0.55} q16 -6 20 -20 q-14 2 -20 14Z`, leaf);
  s += circle(x, y - h, r, head) + circle(x - r * 0.3, y - h - r * 0.3, r * 0.35, "#ffffff", 'opacity=".35"');
  return s;
}
/** Rain cloud (soft, layered). */
export function rainCloud(cx, cy) {
  return blur(ellipse(cx + 30, cy + 14, 120, 20, INK), 8, 0.08) +
    ellipse(cx + 30, cy + 8, 116, 20, "#b9cbdb") + ellipse(cx - 20, cy - 2, 64, 26, "#c7d6e2") + ellipse(cx + 50, cy - 8, 60, 28, "#d3e0ea") + ellipse(cx + 10, cy - 18, 40, 18, "#e2ebf2");
}

export { P, mix, shade, light, def, vgrad, rgrad, rect, rrect, circle, ellipse, path, poly, line, stroke, g, tr, text };
