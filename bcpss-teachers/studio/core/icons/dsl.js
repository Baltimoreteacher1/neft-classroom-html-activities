// Drawing helpers for the Studio icon set. Pure strings, no DOM. Every icon is drawn in a 64x64 box in one
// flat style: solid fills, a 2-unit navy-ink outline (set once on the wrapper group), a few detail strokes.
// Palette and shade/light come from the Language Page art kit so icons match the existing pictures.
import {
  CLOTH,
  HAIR,
  mix,
  P,
  SKIN,
  shade,
  light,
} from "../../../../access-practice-lab/src/art/kit.js";

export { CLOTH, HAIR, mix, P, SKIN, shade, light };

export const INK = P.ink;
export const f = (n) => String(Math.round(n * 10) / 10);
const x = (s) => (s ? ` ${s}` : "");

/** Rectangle. The 5th/6th arguments may be (fill, radius) or (radius, fill). */
export const R = (px, py, w, h, a, b = 0, ex = "") => {
  const [fill, r] = typeof a === "number" ? [b, a] : [a, b];
  return `<rect x="${f(px)}" y="${f(py)}" width="${f(w)}" height="${f(h)}"${r ? ` rx="${f(r)}"` : ""} fill="${fill}"${x(ex)}/>`;
};
export const C = (cx, cy, r, fill, ex = "") =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${x(ex)}/>`;
export const E = (cx, cy, rx, ry, fill, ex = "") =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${x(ex)}/>`;
export const Pa = (d, fill, ex = "") => `<path d="${d}" fill="${fill}"${x(ex)}/>`;
export const Pg = (pts, fill, ex = "") =>
  `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${fill}"${x(ex)}/>`;
/** Stroke-only path (detail line). */
export const Ln = (d, color = INK, w = 2, ex = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"${x(ex)}/>`;
/** Remove the outline from any element string (highlights, spots, pupils). */
export const N = (s) => (/ stroke="/.test(s) ? s : s.replace(/^<(\w+)/, '<$1 stroke="none"'));
/** Small solid dot without outline (eyes, spots). */
export const dot = (cx, cy, r = 2, fill = INK) => N(C(cx, cy, r, fill));
export const T = (tx, ty, body, s = 1, rot = 0) =>
  `<g transform="translate(${f(tx)} ${f(ty)})${rot ? ` rotate(${f(rot)})` : ""}${s !== 1 ? ` scale(${f(s)})` : ""}">${body}</g>`;
/** Mirror a drawing about the vertical centre line of the 64 box. */
export const M = (body) => `<g transform="translate(64 0) scale(-1 1)">${body}</g>`;
export const star5 = (cx, cy, r, ri = r * 0.45, rot = -90) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((rot + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? ri : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
};
export const ngon = (cx, cy, r, n, rot = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/**
 * Register helper. draw(c) receives c = {m, d, l, skin, hair}: m is the icon's main colour (the caller can
 * override it with the `color` option), d a darker shade of it and l a lighter tint.
 */
export const ic = (name, category, keywords, main, draw) => ({
  name,
  category,
  keywords,
  main,
  draw,
});

/** Triangular sun rays: n rays between radii r1 and r2 around (cx, cy). */
export const rays = (cx, cy, r1, r2, n, fill, half = 180 / n / 1.65) =>
  Array.from({ length: n }, (_, i) => {
    const a = -90 + (360 / n) * i;
    const at = (deg, r) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
    return Pg([at(a - half, r1), at(a, r2), at(a + half, r1)], fill);
  }).join("");

/** Thick outlined line (pencil bodies, scissor blades, straws). */
export const bar = (x1, y1, x2, y2, w, fill) =>
  `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" fill="none" stroke="${INK}" stroke-width="${w + 4}"/><path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
/** Outlined ring (handles, wheels, hoops). */
export const ring = (cx, cy, r, w, fill) =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${INK}" stroke-width="${w + 4}"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${fill}" stroke-width="${w}"/>`;
