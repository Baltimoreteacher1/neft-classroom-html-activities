// Science Investigation Lab scenes: the drawing kit every scene family shares. Render-only string helpers, no DOM.
// A scene part is drawn once and told where it starts and where it ends; the same markup then renders as a still
// frame ("start" or "end") or as a CSS time-lapse ("anim") that runs from one to the other (science-lab-scenes.css).
// Nothing here reads a clock or a random source: every frame comes from the case data passed in.
// Art style: the site illustration kit (flat, layered, lit and shade sides, soft shadows, no dark outlines).
import { esc } from "../util.js";

/** The lab palette as plain values (SVG attributes cannot read CSS custom properties in every engine). Deep Harbor
 *  navy and ink; every other value is a material colour the scenes and their text rely on. */
export const C = {
  navy: "#123a5c",
  ink: "#1d2b3a",
  wall: "#f6f1e8",
  wallLine: "#e4ddd2",
  sky: "#d6ebf3",
  sun: "#f2c14e",
  table: "#d9b48a",
  tableEdge: "#b98d5f",
  tray: "#d3dde2",
  ice: "#e3f5fb",
  water: "#a9d8ea",
  foil: "#cfd5de",
  foilLine: "#8e98a8",
  paper: "#fbf7ec",
  paperLine: "#c9bfa8",
  wool: "#c0583a",
  woolLine: "#7e2f1d",
  cloth: "#91b9b2",
  clothLine: "#3f7268",
  foam: "#fdfcf8",
  kraft: "#d8b98c",
  lid: "#2d5a7b",
  cocoa: "#6b3b22",
  steam: "#aebcc6",
  red: "#c4453a",
  glass: "#eef6f8",
  sand: "#e6c784",
  garden: "#4f3325",
  clay: "#b8643e",
  soil: "#8a5a3c",
  seed: "#e9d9a6",
  leaf: "#5aa05f",
  leafDark: "#2f6b3a",
  pot: "#c46a3e",
  potDark: "#8f4526",
  shade: "#9fb0bc",
  copper: "#d28b58",
  sage: "#5a9481",
};
export const SW = 3;

// Editorial picture-book finish (the site's illustration kit, src/art/kit.js): no dark outlines. A shape's edge is a
// soft tonal line drawn UNDER its fill (paint-order), so a filled shape keeps only a faint shadow edge while a bare line
// (a mouth, a tick, a rim) stays readable. Coloured strokes (rope, steam, stems, highlights) are line details and keep
// their colour. stroke-width is kept exactly as asked (the chart's selected bar is read back as stroke-width 5).
const EDGE = "#1c2f4a";
const mix = (a, b, t) => {
  const h = (c) => [1, 3, 5].map((i) => Number.parseInt(c.slice(i, i + 2), 16));
  const A = h(a);
  const B = h(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
/** Shade side of a fill (darker, cooler) and lit side (lighter, warmer): the kit's two-tone form. */
export const shadeOf = (c, t = 0.2) => mix(c, EDGE, t);
export const lightOf = (c, t = 0.3) => mix(c, "#fff6e0", t);

/** Stroke attributes. The house navy becomes a soft tonal edge under the fill; any other colour is a line detail. */
export const ln = (w = SW, color = C.navy) =>
  color === C.navy
    ? `stroke="${EDGE}" stroke-width="${w}" stroke-opacity=".3" paint-order="stroke" stroke-linejoin="round" stroke-linecap="round"`
    : `stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** A soft contact shadow under anything that stands on a surface. */
export const contact = (cx, cy, rx, ry = rx * 0.16, o = 0.18) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${EDGE}" opacity="${o}"/>`;

/**
 * One moving layer of a drawing. `mode` is "start", "end" or "anim"; t0/o0 is where it starts, t/o where it ends,
 * `d` (0..1) delays it within the run. Transforms are CSS transforms on the layer's own box.
 */
export function part(
  mode,
  inner,
  { t0 = "none", t = "none", o0 = 1, o = 1, d = 0, origin = "50% 100%" } = {},
) {
  const base = `transform-origin:${origin}`;
  if (mode === "end")
    return `<g class="slx-p" style="${base};transform:${t};opacity:${o}">${inner}</g>`;
  if (mode === "start")
    return `<g class="slx-p" style="${base};transform:${t0};opacity:${o0}">${inner}</g>`;
  return `<g class="slx-p slx-a" style="${base};transform:${t0};opacity:${o0};--t0:${t0};--t:${t};--o0:${o0};--o:${o};--d:${d}">${inner}</g>`;
}

/** An accessible inline SVG: role="img", a <title> and a <desc> (both plain text, escaped here). */
export function svgImg({ uid, vb, title, desc, inner, cls = "" }) {
  return `<svg class="slx-svg ${cls}" viewBox="${vb}" role="img" aria-labelledby="${uid}-t ${uid}-d" focusable="false" xmlns="http://www.w3.org/2000/svg"><title id="${uid}-t">${esc(title)}</title><desc id="${uid}-d">${esc(desc)}</desc>${inner}</svg>`;
}

/** A decorative SVG (the meaning is in text next to it). */
export const svgDeco = (vb, inner, cls = "") =>
  `<svg class="slx-svg ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

/** The label of one variable value in the reader's language, or the raw id when a case lacks it. */
export function valueLabel(I, caseDef, varId, valueId) {
  const v = caseDef.variables.find((x) => x.id === varId);
  const val = v?.values.find((x) => x.id === valueId);
  return val ? I.S(val.label.en, val.label.es) : String(valueId ?? "");
}

/** "Aluminum foil, 1 layer": every condition of a row (or a conditions object), in case order. */
export const condText = (I, caseDef, conds) =>
  caseDef.variables.map((v) => valueLabel(I, caseDef, v.id, conds[v.id])).join(", ");

/** The measured value of a row and the largest value in the case (for relative sizes and durations). */
export const valueOf = (caseDef, row) => Number(row.measures[caseDef.measure.id]) || 0;
export const maxOf = (caseDef) =>
  Math.max(1, ...caseDef.dataset.rows.map((r) => valueOf(caseDef, r)));

/** A round-numbered axis top just above the largest value (10, 20, 50, 100, 150 …). */
export function niceMax(v) {
  const steps = [5, 10, 20, 25, 50, 100, 150, 200, 250, 500, 1000];
  return steps.find((s) => s >= v) || Math.ceil(v / 100) * 100;
}

/** Simple shape helpers, in the flat layered style: lit and shade sides, soft shadows, no outlines. */
export const sun = (cx, cy, r) =>
  `<g><circle cx="${cx}" cy="${cy}" r="${r + 17}" fill="#fff4c9" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="#fff0b8" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.sun}"/><path d="M${cx + r * 0.2} ${cy - r} A${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy + r} A${r * 0.8} ${r} 0 0 0 ${cx + r * 0.2} ${cy - r}Z" fill="#e2a72e" opacity=".55"/><circle cx="${cx - r * 0.32}" cy="${cy - r * 0.32}" r="${r * 0.42}" fill="#fff6cf" opacity=".6"/></g>`;

export const windowFrame = (x, y, w, h) => {
  const m = 7;
  return `<rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="9" fill="${EDGE}" opacity=".08"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.paper}"/><rect x="${x + w - m}" y="${y + 4}" width="${m - 2}" height="${h - 8}" rx="2" fill="${shadeOf(C.paper, 0.07)}"/><rect x="${x + m}" y="${y + m}" width="${w - m * 2}" height="${(h - m * 2) * 0.55}" fill="#a9d4e8"/><rect x="${x + m}" y="${y + m + (h - m * 2) * 0.55}" width="${w - m * 2}" height="${(h - m * 2) * 0.45}" fill="${C.sky}"/><path d="M${x + m} ${y + h * 0.82} q${w * 0.2} -${h * 0.12} ${w * 0.4} -${h * 0.04} t${w * 0.6 - m * 2} -${h * 0.06} V${y + h - m} H${x + m}Z" fill="#b9dccb" opacity=".8"/><path d="M${x + m + w * 0.1} ${y + h - m} L${x + m + w * 0.42} ${y + m} H${x + m + w * 0.54} L${x + m + w * 0.22} ${y + h - m}Z" fill="#ffffff" opacity=".28"/><rect x="${x + w / 2 - 3.5}" y="${y + m}" width="7" height="${h - m * 2}" fill="${C.paper}"/><rect x="${x + m}" y="${y + h / 2 - 3.5}" width="${w - m * 2}" height="7" fill="${C.paper}"/><rect x="${x + w / 2 + 1}" y="${y + m}" width="2.5" height="${h - m * 2}" fill="${shadeOf(C.paper, 0.1)}"/><rect x="${x - 8}" y="${y + h - 3}" width="${w + 16}" height="9" rx="3" fill="${lightOf(C.tableEdge, 0.5)}"/><rect x="${x - 8}" y="${y + h + 3}" width="${w + 16}" height="3" rx="1.5" fill="${shadeOf(C.tableEdge, 0.1)}" opacity=".7"/>`;
};

/** Small decorative motes and glints in the house illustration style. */
export const sparkles = (pts) =>
  pts
    .map(([x, y, k]) =>
      k === "+"
        ? `<path d="M${x} ${y - 6} Q${x + 1} ${y - 1} ${x + 6} ${y} Q${x + 1} ${y + 1} ${x} ${y + 6} Q${x - 1} ${y + 1} ${x - 6} ${y} Q${x - 1} ${y - 1} ${x} ${y - 6}Z" fill="${C.sun}" opacity=".75"/>`
        : `<circle cx="${x}" cy="${y}" r="2.6" fill="${C.copper}" opacity=".45"/>`,
    )
    .join("");

/** A room: wall, a table top at `ty` (lit front edge, soft grain), and a low wainscot band on the wall. */
export const room = (w, h, ty) =>
  `<rect width="${w}" height="${h}" fill="${C.wall}"/><rect y="${ty - 46}" width="${w}" height="46" fill="#efe5d4"/><rect y="${ty - 48}" width="${w}" height="4" fill="#f9f5ec"/><rect x="0" y="${ty}" width="${w}" height="${h - ty}" fill="${C.table}"/><rect x="0" y="${ty}" width="${w}" height="7" fill="${lightOf(C.table, 0.35)}"/><rect x="0" y="${ty + 7}" width="${w}" height="3" fill="${shadeOf(C.table, 0.08)}" opacity=".6"/><path d="M0 ${ty + 26} Q${w * 0.3} ${ty + 22} ${w * 0.55} ${ty + 28} T${w} ${ty + 25}M${w * 0.08} ${ty + 50} Q${w * 0.4} ${ty + 46} ${w * 0.7} ${ty + 52}" fill="none" stroke="${C.tableEdge}" stroke-width="2" stroke-opacity=".35" stroke-linecap="round"/><rect x="0" y="${h - 14}" width="${w}" height="14" fill="${shadeOf(C.table, 0.12)}" opacity=".5"/>`;

// ── bench props (the hero scenes share these; none of them is a clock) ──────
/** An open notebook with an empty results grid and a pencil, its top-left corner at (x, y). */
export const notebook = (x, y) =>
  `<g transform="translate(${x} ${y})">${contact(56, 72, 62, 6, 0.16)}<path d="M0 8 L56 0 L56 62 L0 70Z" fill="${C.paper}"/><path d="M56 0 L112 8 L112 70 L56 62Z" fill="${lightOf(C.paper, 0.4)}"/><path d="M44 2 L56 0 L56 62 L44 64Z" fill="${shadeOf(C.paper, 0.1)}"/><path d="M56 0 L64 1 L64 63 L56 62Z" fill="${shadeOf(C.paper, 0.06)}"/>${[18, 30, 42, 54].map((yy) => `<path d="M64 ${yy} L104 ${yy + 4}" stroke="${C.paperLine}" stroke-width="1.4" stroke-linecap="round"/>`).join("")}<path d="M78 6 V66 M92 8 V68" stroke="${C.paperLine}" stroke-width="1.4"/>${[20, 32, 44].map((yy) => `<path d="M8 ${yy + 2} L40 ${yy - 2}" stroke="${C.paperLine}" stroke-width="1.4" stroke-linecap="round"/>`).join("")}<path d="M20 78 L96 58" stroke="${C.sun}" stroke-width="6" stroke-linecap="round"/><path d="M20 79.5 L96 59.5" stroke="#d99a2b" stroke-width="2.4" stroke-linecap="round"/><path d="M20 78 L12 80.5" stroke="#e98a6c" stroke-width="6" stroke-linecap="round"/><path d="M96 58 L104 56 L98 62Z" fill="${C.ink}"/></g>`;

/** A wall thermometer, `h` tall, bulb at the bottom; `fill` (0..1) is how high the red line sits. */
export const thermometer = (x, y, h, fill = 0.55) =>
  `<rect x="${x + 2}" y="${y + 4}" width="16" height="${h + 8}" rx="8" fill="${EDGE}" opacity=".1"/><rect x="${x}" y="${y}" width="16" height="${h}" rx="8" fill="#ffffff"/><rect x="${x + 10}" y="${y + 4}" width="5" height="${h - 6}" rx="2.5" fill="#e4ecf0"/><rect x="${x + 5}" y="${y + h * (1 - fill)}" width="6" height="${h * fill}" rx="3" fill="${C.red}"/><circle cx="${x + 8}" cy="${y + h + 8}" r="12" fill="${C.red}"/><circle cx="${x + 11}" cy="${y + h + 11}" r="8" fill="${shadeOf(C.red, 0.2)}" opacity=".5"/><circle cx="${x + 4}" cy="${y + h + 4}" r="3.5" fill="#ffffff" opacity=".5"/>${[0.2, 0.4, 0.6, 0.8].map((k) => `<path d="M${x + 19} ${y + h * k} h6" stroke="${C.navy}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`).join("")}`;

/** A watering can whose base sits on y, left end at x. */
export const wateringCan = (x, y) =>
  `<g transform="translate(${x} ${y - 62})">${contact(42, 62, 34, 5)}<path d="M24 18 C24 2 56 2 56 18" fill="none" stroke="${shadeOf(C.sage, 0.25)}" stroke-width="5" stroke-linecap="round"/><path d="M14 26 C-4 26 -4 52 16 50" fill="none" stroke="${shadeOf(C.sage, 0.15)}" stroke-width="5" stroke-linecap="round"/><path d="M64 34 L94 8 L99 13 L68 42Z" fill="${shadeOf(C.sage, 0.1)}"/><rect x="90" y="0" width="14" height="12" rx="3" fill="${C.sage}" transform="rotate(-40 97 6)"/><path d="M14 18 H66 L62 62 H18Z" fill="${C.sage}"/><path d="M48 18 H66 L62 62 H46Z" fill="${shadeOf(C.sage, 0.18)}"/><path d="M20 22 H28 L26 58 H22Z" fill="${lightOf(C.sage, 0.4)}" opacity=".6"/><rect x="12" y="15" width="56" height="6" rx="3" fill="${lightOf(C.sage, 0.2)}"/></g>`;

/** A standing ruler, `h` tall, base on y. */
export const ruler = (x, y, h) =>
  `${contact(x + 9, y, 14, 3)}<rect x="${x}" y="${y - h}" width="18" height="${h}" rx="3" fill="${C.sun}"/><rect x="${x + 12}" y="${y - h}" width="6" height="${h}" rx="3" fill="${shadeOf(C.sun, 0.15)}"/>${Array.from({ length: Math.floor(h / 12) }, (_, i) => `<path d="M${x + 1} ${y - 8 - i * 12} h${i % 2 ? 5 : 9}" stroke="${C.ink}" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>`).join("")}`;

/** A wall shelf plank with two brackets. */
export const shelf = (x, y, w) =>
  `<rect x="${x + 4}" y="${y + 10}" width="${w - 8}" height="8" fill="${EDGE}" opacity=".08"/><path d="M${x + 14} ${y + 10} h7 l9 16 h-5Z M${x + w - 14} ${y + 10} h-7 l-9 16 h5Z" fill="${shadeOf(C.tableEdge, 0.2)}"/><rect x="${x}" y="${y}" width="${w}" height="10" rx="3" fill="${C.tableEdge}"/><rect x="${x}" y="${y}" width="${w}" height="3.5" rx="1.75" fill="${lightOf(C.tableEdge, 0.4)}"/>`;
