// Science Investigation Lab scenes: the drawing kit every scene family shares. Render-only string helpers, no DOM.
// A scene part is drawn once and told where it starts and where it ends; the same markup then renders as a still
// frame ("start" or "end") or as a CSS time-lapse ("anim") that runs from one to the other (science-lab-scenes.css).
// Nothing here reads a clock or a random source: every frame comes from the case data passed in.
import { esc } from "../util.js";

/** The lab palette as plain values (SVG attributes cannot read CSS custom properties in every engine). */
export const C = {
  navy: "#1d2b58",
  ink: "#111a3b",
  wall: "#f6f1e8",
  wallLine: "#e4ddd2",
  sky: "#d6ebf3",
  sun: "#f2c14e",
  table: "#d9b48a",
  tableEdge: "#b98d5f",
  tray: "#d5dceb",
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
  lid: "#33447c",
  cocoa: "#6b3b22",
  steam: "#9aa6d2",
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
  shade: "#c9c3d6",
  copper: "#d28b58",
  sage: "#5a9481",
};
export const SW = 3;

/** Stroke attributes in the house style: 3px navy, round joins. */
export const ln = (w = SW, color = C.navy) =>
  `stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

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

/** Simple shape helpers. */
export const sun = (cx, cy, r) =>
  `<g>${[0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * (r + 6);
      const y1 = cy + Math.sin(rad) * (r + 6);
      const x2 = cx + Math.cos(rad) * (r + 15);
      const y2 = cy + Math.sin(rad) * (r + 15);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${ln(3, C.copper)}/>`;
    })
    .join("")}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.sun}" ${ln()}/></g>`;

export const windowFrame = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.sky}" ${ln()}/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" ${ln()}/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${ln()}/>`;

/** Small decorative dots and plus signs in the house illustration style. */
export const sparkles = (pts) =>
  pts
    .map(([x, y, k]) =>
      k === "+"
        ? `<path d="M${x - 5} ${y}h10M${x} ${y - 5}v10" ${ln(2.5, C.copper)}/>`
        : `<circle cx="${x}" cy="${y}" r="3" fill="${C.navy}"/>`,
    )
    .join("");

/** A room: wall, a table top at `ty`, and optional skirting line. */
export const room = (w, h, ty) =>
  `<rect width="${w}" height="${h}" fill="${C.wall}"/><rect x="0" y="${ty}" width="${w}" height="${h - ty}" fill="${C.table}"/><line x1="0" y1="${ty}" x2="${w}" y2="${ty}" ${ln(3, C.tableEdge)}/>`;

// ── bench props (the hero scenes share these; none of them is a clock) ──────
/** An open notebook with an empty results grid and a pencil, its top-left corner at (x, y). */
export const notebook = (x, y) =>
  `<g transform="translate(${x} ${y})"><path d="M0 8 L56 0 L56 62 L0 70Z" fill="${C.paper}" ${ln()}/><path d="M56 0 L112 8 L112 70 L56 62Z" fill="${C.paper}" ${ln()}/>${[18, 30, 42, 54].map((yy) => `<path d="M64 ${yy} L104 ${yy + 4}" ${ln(1.6, C.paperLine)}/>`).join("")}<path d="M78 6 V66 M92 8 V68" ${ln(1.6, C.paperLine)}/>${[20, 32, 44].map((yy) => `<path d="M8 ${yy + 2} L46 ${yy - 3}" ${ln(1.6, C.paperLine)}/>`).join("")}<path d="M20 78 L96 58" ${ln(6, C.sun)}/><path d="M96 58 L104 56 L98 62Z" fill="${C.ink}"/></g>`;

/** A wall thermometer, `h` tall, bulb at the bottom; `fill` (0..1) is how high the red line sits. */
export const thermometer = (x, y, h, fill = 0.55) =>
  `<rect x="${x}" y="${y}" width="16" height="${h}" rx="8" fill="#ffffff" ${ln()}/><rect x="${x + 5}" y="${y + h * (1 - fill)}" width="6" height="${h * fill}" rx="3" fill="${C.red}"/><circle cx="${x + 8}" cy="${y + h + 8}" r="12" fill="${C.red}" ${ln()}/>${[0.2, 0.4, 0.6, 0.8].map((k) => `<path d="M${x + 16} ${y + h * k} h7" ${ln(2)}/>`).join("")}`;

/** A watering can whose base sits on y, left end at x. */
export const wateringCan = (x, y) =>
  `<g transform="translate(${x} ${y - 62})"><path d="M14 18 H66 L62 62 H18Z" fill="${C.sage}" ${ln()}/><path d="M66 30 L96 8" ${ln(6, C.navy)}/><path d="M66 30 L96 8" ${ln(3, C.sage)}/><rect x="90" y="0" width="14" height="12" rx="3" fill="${C.sage}" ${ln(2.4)}/><path d="M14 26 C-4 26 -4 52 16 50" fill="none" ${ln(4)}/><path d="M24 18 C24 2 56 2 56 18" fill="none" ${ln(4)}/></g>`;

/** A standing ruler, `h` tall, base on y. */
export const ruler = (x, y, h) =>
  `<rect x="${x}" y="${y - h}" width="18" height="${h}" rx="3" fill="${C.sun}" ${ln()}/>${Array.from({ length: Math.floor(h / 12) }, (_, i) => `<path d="M${x} ${y - 8 - i * 12} h${i % 2 ? 6 : 10}" ${ln(2)}/>`).join("")}`;

/** A wall shelf plank with two brackets. */
export const shelf = (x, y, w) =>
  `<rect x="${x}" y="${y}" width="${w}" height="10" rx="3" fill="${C.tableEdge}" ${ln()}/><path d="M${x + 16} ${y + 10} l10 14 M${x + w - 16} ${y + 10} l-10 14" ${ln(3)}/>`;
