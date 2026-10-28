// Shared grammar for the Family Math Studio model library (math-models.mjs).
//
// One stroke, one radius, one gutter, one label size and ONE role-to-style mapping for every
// model, so a tape diagram and a balance read as the same family. Everything here is pure:
// data in, string out, no clock, no randomness, no DOM.
//
// Role mapping (never colour alone: each role also differs in shape, outline or glyph):
//   part     solid teal-tint block, teal-ink outline        "the piece we are looking at"
//   whole    open bracket, navy line                         "everything"
//   unknown  DASHED amber outline + the glyph "?"            "what we are finding"
//   given    white card, navy outline                        "a number the problem states"
//   answer   green double ring / green outline + check mark  "a solved value"
//   error    diagonal-hatch fill, rust outline + cross       "a value to look at again"

export const W = 360; // viewBox width; models are drawn to read at 360 CSS px
export const PAD = 16; // outer gutter
export const GUTTER = 12; // gap between stacked parts of one model
export const STROKE = 2;
export const RADIUS = 6;
export const MIN_FONT = 14;

/** Every colour is a CSS variable with a token fallback, so the page theme (and dark mode) wins. */
export const MODEL_STYLE = `.m-t{font:600 14px var(--ds-font-text,system-ui,-apple-system,"Segoe UI",sans-serif);fill:var(--ink,#17324D)}.m-n{font-weight:700;font-size:16px}.m-q{font-weight:700;font-size:18px;fill:var(--m-unknown-ink,#886C33)}.m-ln{fill:none;stroke:var(--ink,#17324D);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.m-gr{fill:none;stroke:var(--ink,#17324D);stroke-opacity:.2;stroke-width:1}.m-dash{fill:none;stroke:var(--ink,#17324D);stroke-opacity:.45;stroke-width:1.5;stroke-dasharray:4 4}.m-p{fill:var(--m-part,#70C6C3);stroke:var(--m-part-ink,#177B78);stroke-width:2;stroke-linejoin:round}.m-g{fill:var(--art-card,#FFFFFF);stroke:var(--ink,#17324D);stroke-width:2;stroke-linejoin:round}.m-u{fill:var(--m-unknown,#FDF5E5);stroke:var(--m-unknown-ink,#886C33);stroke-width:2;stroke-dasharray:5 4;stroke-linejoin:round}.m-a{fill:var(--m-answer,#ECF5F1);stroke:var(--m-answer-ink,#0F7C4A);stroke-width:2.5}.m-e{stroke:var(--m-error-ink,#B3402A);stroke-width:2}.m-ok{fill:none;stroke:var(--m-answer-ink,#0F7C4A);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.m-x{fill:none;stroke:var(--m-error-ink,#B3402A);stroke-width:3;stroke-linecap:round}.m-h{fill:var(--m-head,#DADEE3);stroke:var(--ink,#17324D);stroke-width:2}.m-r1,.m-r2,.m-f1,.m-f2{fill:none;stroke-linecap:round}.m-r1{stroke:var(--m-part-ink,#177B78)}.m-r2{stroke:var(--ink,#17324D)}.m-f1{stroke:var(--m-part,#70C6C3)}.m-f2{stroke:var(--art-card,#FFFFFF)}.m-dot{fill:var(--ink,#17324D)}.m-arr{fill:var(--ink,#17324D)}`;

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ESC[c]);

/** Round to one decimal for compact, stable output. */
export const n1 = (v) => {
  const r = Math.round(v * 10) / 10;
  return String(Object.is(r, -0) ? 0 : r);
};

/** Typeset a minus sign (U+2212) for negative numbers in labels. */
export const minus = (s) => String(s).replace(/(^|[\s(,[])-(?=\d)/g, "$1−");

/** Trim float noise: 0.30000000000000004 -> "0.3". */
export const clean = (v) => {
  if (typeof v !== "number") return String(v);
  return String(Number(v.toFixed(6)));
};

/** Pick a language from {en, es} or pass a plain string/number through. */
export function lab(v, lang) {
  if (v === undefined || v === null) return "";
  if (typeof v === "number") return minus(clean(v));
  if (typeof v === "string") return minus(v);
  if (typeof v === "object" && ("en" in v || "es" in v)) {
    const s = (lang === "es" ? v.es || v.en : v.en || v.es) ?? "";
    return minus(String(s));
  }
  throw new Error(`label must be a string, number or {en, es}; got ${JSON.stringify(v)}`);
}

export function need(data, kind, ...fields) {
  if (data === null || typeof data !== "object") {
    throw new Error(`model "${kind}" needs a data object`);
  }
  for (const f of fields) {
    if (data[f] === undefined || data[f] === null) {
      throw new Error(`model "${kind}": data.${f} is required`);
    }
  }
}

export function int(data, kind, field, min, max) {
  const v = data[field];
  if (!Number.isInteger(v) || v < min || v > max) {
    throw new Error(`model "${kind}": data.${field} must be an integer from ${min} to ${max}; got ${JSON.stringify(v)}`);
  }
  return v;
}

export function pos(data, kind, field) {
  const v = data[field];
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
    throw new Error(`model "${kind}": data.${field} must be a positive number; got ${JSON.stringify(v)}`);
  }
  return v;
}

/** Rough text width at the model font (bold-ish), used only to keep labels inside the frame. */
export const textW = (s, size = 16) => Math.ceil(String(s).length * size * 0.56) + 4;

export function text(x, y, s, { anchor = "middle", cls = "m-t", extra = "" } = {}) {
  if (s === "" || s === undefined) return "";
  return `<text class="${cls}" x="${n1(x)}" y="${n1(y)}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;
}

/** Centre x for a label so it stays inside the frame. */
export function clampX(cx, width) {
  return Math.max(PAD + width / 2, Math.min(W - PAD - width / 2, cx));
}

/** Square bracket under (dir=1) or over (dir=-1) the span [x1, x2] at y. */
export function bracket(x1, x2, y, dir, cls = "m-ln") {
  const t = 6 * dir;
  return `<path class="${cls}" d="M${n1(x1)} ${n1(y)}v${t}H${n1(x2)}v${-t}"/>`;
}

/** Small filled arrow head pointing right/left/down/up at (x, y). */
export function head(x, y, dir) {
  const pts = {
    r: `${n1(x)},${n1(y)} ${n1(x - 8)},${n1(y - 5)} ${n1(x - 8)},${n1(y + 5)}`,
    l: `${n1(x)},${n1(y)} ${n1(x + 8)},${n1(y - 5)} ${n1(x + 8)},${n1(y + 5)}`,
    d: `${n1(x)},${n1(y)} ${n1(x - 5)},${n1(y - 8)} ${n1(x + 5)},${n1(y - 8)}`,
    u: `${n1(x)},${n1(y)} ${n1(x - 5)},${n1(y + 8)} ${n1(x + 5)},${n1(y + 8)}`,
  };
  return `<polygon class="m-arr" points="${pts[dir]}"/>`;
}

/** Dashed amber "unknown" pill behind a "?" (or a label). */
export function unknownPill(cx, cy, w, h = 26) {
  return `<rect class="m-u" x="${n1(cx - w / 2)}" y="${n1(cy - h / 2)}" width="${n1(w)}" height="${h}" rx="${RADIUS}"/>`;
}

/** FNV-1a: a small deterministic id so two models on one page never share ids. */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Hatch pattern used for "shaded" fractions and the error role. */
export const hatch = (id, cls) =>
  `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="${cls}" fill-opacity="0"/><path d="M0 0v7" stroke="var(--m-part-ink,#177B78)" stroke-width="2.4" stroke-opacity=".55"/></pattern>`;

export const errHatch = (id) =>
  `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--m-error-bg,#F6E6E2)"/><path d="M0 0v7" stroke="var(--m-error-ink,#B3402A)" stroke-width="2.4" stroke-opacity=".5"/></pattern>`;

export const TYPE_NAME = {
  tape: { en: "Tape diagram", es: "Diagrama de cinta" },
  doubleline: { en: "Double number line", es: "Recta numérica doble" },
  ratiotable: { en: "Ratio table", es: "Tabla de razones" },
  area: { en: "Area model", es: "Modelo de área" },
  grid: { en: "Grid", es: "Cuadrícula" },
  numberline: { en: "Number line", es: "Recta numérica" },
  coord: { en: "Coordinate plane", es: "Plano de coordenadas" },
  barplot: { en: "Bar graph", es: "Gráfica de barras" },
  fraction: { en: "Fraction bar", es: "Barra de fracciones" },
  balance: { en: "Balance", es: "Balanza" },
};

/**
 * The one wrapper every model uses: role=img, <title> from the lesson's alt, <desc> computed from the data.
 * Models write ids as "@ID@x"; they become "fm-<hash>-<lang>-x", so the EN and ES copies of one model (both live in
 * the DOM, CSS shows one) and two different models on a page never share an id.
 */
export function shell({ kind, lang, alt, h, body, desc, defs = "", key }) {
  const base = `fm-${hash(`${kind}|${key}`)}-${lang}`;
  const title = alt ? lab(alt, lang) : TYPE_NAME[kind][lang === "es" ? "es" : "en"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="fm-model fm-${kind}" lang="${lang}" viewBox="0 0 ${W} ${n1(h)}" width="${W}" height="${n1(h)}" role="img" aria-labelledby="@ID@t @ID@d"><title id="@ID@t">${esc(title)}</title><desc id="@ID@d">${esc(desc)}</desc><style>${MODEL_STYLE}</style>${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;
  return svg.replaceAll("@ID@", `${base}-`);
}
