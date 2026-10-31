// Shared drawing kit for the Fluency Lab illustration library: palette, number-safe SVG primitives, and the one
// <svg> wrapper every illustration goes through (a11y attributes, viewBox-only scaling, id prefixing).
// Style rules: 2.5 navy strokes with round caps and joins, 4-8 unit corner radii, flat fills from ds4.css, no text.

/** Palette: hex values copied from ds4.css (fallbacks are literal so forced-colors and print stay legible). */
export const PAL = Object.freeze({
  navy: "#17324d",
  navy2: "#244a6d",
  teal: "#1fa6a2",
  tealInk: "#0e6b68",
  tealSoft: "#dff3f1",
  blue: "#2c6fb0",
  blueSoft: "#e3eef8",
  paper: "#f7f4ec",
  paper2: "#efeadc",
  white: "#fff",
  ink: "#24323f",
  soft: "#52606d",
  line: "#d5d9de",
  amber: "#f2c15b",
  amberSoft: "#fff4e0",
  coral: "#d9533a",
  ok: "#1b7a4b",
  warn: "#b45309",
});

/** Colourless variant used for "not yet earned": same drawing, accents collapse to paper and grey ink. */
export const MONO = Object.freeze({
  ...PAL,
  navy: PAL.soft,
  navy2: PAL.soft,
  teal: PAL.white,
  tealInk: PAL.soft,
  tealSoft: PAL.paper2,
  blue: PAL.paper2,
  blueSoft: PAL.white,
  amber: PAL.white,
  amberSoft: PAL.paper2,
  coral: PAL.white,
  ok: PAL.soft,
  warn: PAL.soft,
});

export const num = (v) => Math.round(v * 10) / 10;
const attrs = (extra) => (extra ? ` ${extra}` : "");
export const THIN = 'stroke-width="1.5"';
export const NOSTROKE = 'stroke="none"';
export const DASH = 'stroke-dasharray="4 4"';

export const rect = (x, y, w, h, fill = "none", rx = 4, extra = "") =>
  `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${rx}" fill="${fill}"${attrs(extra)}/>`;
/** Small circles get a lighter outline automatically so counters never look blobby. */
export const circ = (cx, cy, r, fill = "none", extra = "") =>
  `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"${attrs(r <= 5.5 && !/stroke/.test(extra) ? `${extra} stroke-width="1.8"`.trim() : extra)}/>`;
export const path = (d, fill = "none", extra = "") => `<path d="${d}" fill="${fill}"${attrs(extra)}/>`;
export const line = (x1, y1, x2, y2, extra = "") =>
  `<path d="M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}"${attrs(extra)}/>`;
export const poly = (points, fill = "none", extra = "") =>
  `<path d="M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z" fill="${fill}"${attrs(extra)}/>`;
export const group = (transform, ...kids) => `<g transform="${transform}">${kids.join("")}</g>`;
export const at = (x, y, scale, ...kids) =>
  group(`translate(${num(x)} ${num(y)})${scale && scale !== 1 ? ` scale(${scale})` : ""}`, ...kids);

/** Regular polygon points (flat fill helper for hexagons, stars). */
export const ngon = (cx, cy, r, sides, rotate = -90) =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((rotate + (360 / sides) * i) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
export const star = (cx, cy, outer, inner, points = 5) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180;
    const r = i % 2 ? inner : outer;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
/** Check mark and cross glyph paths, centred on (cx, cy), half-size s. */
export const check = (cx, cy, s, extra = "") =>
  path(`M${num(cx - s)} ${num(cy)}L${num(cx - s * 0.3)} ${num(cy + s * 0.7)}L${num(cx + s)} ${num(cy - s * 0.6)}`, "none", extra);
export const cross = (cx, cy, s, extra = "") =>
  path(`M${num(cx - s)} ${num(cy - s)}L${num(cx + s)} ${num(cy + s)}M${num(cx + s)} ${num(cy - s)}L${num(cx - s)} ${num(cy + s)}`, "none", extra);
/** Arrowhead pointing along (dx, dy) with its tip at (x, y). */
export const arrowHead = (x, y, dx, dy, s = 5, extra = "") => {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  return path(
    `M${num(x - ux * s + px * s * 0.7)} ${num(y - uy * s + py * s * 0.7)}L${num(x)} ${num(y)}L${num(x - ux * s - px * s * 0.7)} ${num(y - uy * s - py * s * 0.7)}`,
    "none",
    extra,
  );
};
/** Isometric cube with edge e whose lowest corner is (x, y). Faces: top, left, right. */
export const cube = (x, y, e, top, left, right) => {
  const w = 0.866 * e;
  return [
    poly([[x, y - 2 * e], [x - w, y - 1.5 * e], [x, y - e], [x + w, y - 1.5 * e]], top),
    poly([[x - w, y - 1.5 * e], [x - w, y - 0.5 * e], [x, y], [x, y - e]], left),
    poly([[x, y - e], [x, y], [x + w, y - 0.5 * e], [x + w, y - 1.5 * e]], right),
  ].join("");
};

const esc = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
let serial = 0;

/**
 * The one <svg> wrapper. `vb` is [w, h]; `size` is the rendered width in px (height follows the aspect ratio).
 * `body` may be a function receiving an id maker, so defs ids carry the caller's idPrefix.
 */
export function svg({ vb, label, decorative = false, size, idPrefix, body, defs = "", natural, c = PAL, panel }) {
  const [w, h] = vb;
  const prefix = idPrefix || `fla${++serial}`;
  const id = (name) => `${prefix}-${name}`;
  const inner = typeof body === "function" ? body(id, c) : body;
  const defsText = typeof defs === "function" ? defs(id, c) : defs;
  const width = Math.round(Number(size) > 0 ? Number(size) : natural || w);
  const height = Math.round((width * h) / w);
  const aria = decorative ? 'aria-hidden="true" focusable="false"' : 'role="img"';
  const title = decorative ? "" : `<title>${esc(label)}</title>`;
  const backing = panel ? panel(w, h, c) : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${height}" ${aria} ` +
    `style="forced-color-adjust:none;max-width:100%;height:auto">${title}` +
    `${defsText ? `<defs>${defsText}</defs>` : ""}${backing}` +
    `<g fill="none" stroke="${c.navy}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`
  );
}

/** Full-bleed rounded backing panel (opaque, so the art reads on any page or forced-colors canvas). */
export const panelOf = (fill, rx = 14) => (w, h) => `<rect width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
