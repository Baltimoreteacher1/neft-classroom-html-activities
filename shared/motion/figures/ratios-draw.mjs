// Drawing primitives shared by the ratio figures: text, stacked fractions, inline number rows, a ratio table, the answer and
// "not this" boxes, and the scene (step-by-step motion). Pure string output; every colour is a token from shared/motion/tokens.mjs.
import { COLOR, COPY_FILLS } from "../tokens.mjs";

export const PAD = 14;
export const INK = COLOR.ink;
export const GREY = COPY_FILLS[2];
const CHAR = 0.57;
const BOLD = 0.6;

/** @param {unknown} s */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
export const f1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
/** Estimated width of a string; layouts leave slack for it. @param {string} s @param {number} [size] @param {boolean} [bold] */
export const tw = (s, size = 14, bold = false) => String(s).length * size * (bold ? BOLD : CHAR);

/** @typedef {{ size?: number, weight?: number, anchor?: string, fill?: string, halo?: boolean }} TxOpts */
/** One <text>; fill and weight go through attributes. @param {number} x @param {number} y @param {string} s @param {TxOpts} [o] */
export function tx(x, y, s, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = INK, halo = false } = o;
  const h = halo ? ` stroke="${COLOR.white}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"` : "";
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${h}>${esc(s)}</text>`;
}

/** Greedy word wrap to a pixel width. @param {string} s @param {number} size @param {number} maxPx @param {boolean} [bold] */
export function wrap(s, size, maxPx, bold = false) {
  /** @type {string[]} */
  const lines = [];
  let cur = "";
  // keep a ratio, a point or a calculation on one line: a non-breaking space around : × ÷ = + − and inside "(x, y)"
  const glued = s.replaceAll(/ ([:×÷=+−]) /g, "\u00a0$1\u00a0").replaceAll(/\((-?[\d.]+), (-?[\d.]+)\)/g, "($1,\u00a0$2)");
  for (const word of glued.split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && tw(next, size, bold) > maxPx) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A stacked fraction centred on (cx, cy): numerator over a bar over denominator. @param {number} cx @param {number} cy @param {string} n @param {string} d @param {TxOpts} [o] */
export function stack(cx, cy, n, d, o = {}) {
  const { size = 14, weight = 700, fill = INK } = o;
  const w = Math.max(n.length, d.length) * size * 0.6 + 8;
  return `${tx(cx, cy - size * 0.3, n, { size, weight, fill })}<line x1="${f1(cx - w / 2)}" y1="${f1(cy)}" x2="${f1(cx + w / 2)}" y2="${f1(cy)}" stroke="${fill}" stroke-width="1.5"/>${tx(cx, cy + size * 0.98, d, { size, weight, fill })}`;
}
/** @param {import("./ratios-calc.mjs").Show} s @param {number} [size] */
export const showW = (s, size = 14) => (s.t !== undefined ? tw(`${s.pre}${s.t}`, size, true) : tw(s.pre, size, true) + Math.max(String(s.n).length, String(s.d).length) * size * 0.6 + 8);

/** @typedef {{ t: string, bold?: boolean, fill?: string } | { show: import("./ratios-calc.mjs").Show, fill?: string }} Atom */
/** The atoms for a value: the number itself, and "≈ 0.42" after a fraction when `approx`. @param {import("./ratios-calc.mjs").Show} s @param {boolean} [approx] @returns {Atom[]} */
export const atomsOf = (s, approx = false) => (approx && s.t === undefined ? [{ show: s }, { t: `≈ ${s.approx}` }] : [{ show: s }]);
/** @param {Atom} a @param {number} size */
const atomW = (a, size) => ("show" in a ? showW(a.show, size) : tw(a.t, size, a.bold !== false));

/** Atoms laid out in a row centred on cx, vertically centred on cy. @param {number} cx @param {number} cy @param {Atom[]} atoms @param {number} [size] @param {number} [gap] */
export function inline(cx, cy, atoms, size = 14, gap = 5) {
  const widths = atoms.map((a) => atomW(a, size));
  const total = widths.reduce((s, w) => s + w, 0) + gap * (atoms.length - 1);
  let x = cx - total / 2;
  let svg = "";
  atoms.forEach((a, i) => {
    const w = widths[i];
    const fill = a.fill || INK;
    if ("show" in a) {
      const s = a.show;
      if (s.t !== undefined) svg += tx(x, cy + size * 0.36, `${s.pre}${s.t}`, { size, weight: 700, anchor: "start", fill });
      else {
        const pw = tw(s.pre, size, true);
        if (s.pre) svg += tx(x, cy + size * 0.36, s.pre, { size, weight: 700, anchor: "start", fill });
        svg += stack(x + pw + (w - pw) / 2, cy, String(s.n), String(s.d), { size, fill });
      }
    } else svg += tx(x, cy + size * 0.36, a.t, { size, weight: a.bold === false ? 400 : 700, anchor: "start", fill });
    x += w + gap;
  });
  return { svg, w: total };
}
/** True when an atom row contains a stacked fraction (it needs a taller line). @param {Atom[]} atoms */
export const tall = (atoms) => atoms.some((a) => "show" in a && a.show.t === undefined);

/** A group the scene reveals as step k. @param {number} k @param {string} inner */
export const step = (k, inner) => `<g class="rt-s" data-step="${k}">${inner}</g>`;

/** Muted caption lines. @param {number} x @param {number} y @param {number} maxPx @param {string} s @param {{ anchor?: string, fill?: string }} [o] */
export function caption(x, y, maxPx, s, o = {}) {
  const lines = wrap(s, 13, maxPx, true);
  const svg = lines.map((l, i) => tx(x, y + 13 + i * 17, l, { size: 13, weight: 700, anchor: o.anchor || "start", fill: o.fill || COLOR.muted })).join("");
  return { svg, h: lines.length * 17 + 4 };
}

/**
 * The answer box (solid, with a check) holding rows of atoms. @param {number} x @param {number} y @param {number} w
 * @param {Array<{ atoms: Atom[], size?: number }>} lines @param {number} [stepNo]
 */
export function answerBox(x, y, w, lines, stepNo = -1) {
  const heights = lines.map((l) => (tall(l.atoms) ? 38 : 24));
  const h = heights.reduce((s, v) => s + v, 0) + 14;
  let svg = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="none" stroke="${COLOR.success}" stroke-width="2"/>`;
  svg += `<path d="M${f1(x + 12)} ${f1(y + 17)} l5 6 l10 -12" fill="none" stroke="${COLOR.success}" stroke-width="3"/>`;
  let cy = y + 7;
  lines.forEach((l, i) => {
    cy += heights[i] / 2;
    svg += inline(x + 36 + (w - 36) / 2, cy, l.atoms, l.size || 15).svg;
    cy += heights[i] / 2;
  });
  return { svg: stepNo >= 0 ? step(stepNo, svg) : svg, h };
}

/** The "not this" box: dashed outline, a cross and words. @param {number} x @param {number} y @param {number} w @param {string[]} paras @param {number} [stepNo] */
export function notBox(x, y, w, paras, stepNo = -1) {
  const lines = paras.flatMap((p) => wrap(p, 14, w - 52, true));
  const h = lines.length * 18 + 16;
  let svg = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/>`;
  svg += `<path d="M${f1(x + 12)} ${f1(y + 11)} l12 12 M${f1(x + 24)} ${f1(y + 11)} l-12 12" stroke="${COLOR.error}" stroke-width="3" fill="none"/>`;
  lines.forEach((l, i) => {
    svg += tx(x + 38, y + 20 + i * 18, l, { size: 14, weight: 700, anchor: "start" });
  });
  return { svg: stepNo >= 0 ? step(stepNo, svg) : svg, h };
}

/**
 * A ratio table: a navy header and one row per step. Each cell is a row of atoms. The kind of a row is carried by its outline:
 * heavy for the given pair, solid for a right step, dashed with a cross for the wrong one.
 * @typedef {{ cells: Atom[][], kind: "given" | "step" | "unit" | "wrong", step: number }} TRow
 * @param {number} x @param {number} y @param {number} w
 * @param {{ heads: string[][], weights: number[], rows: TRow[] }} spec
 */
export function table(x, y, w, spec) {
  const sum = spec.weights.reduce((s, v) => s + v, 0);
  const cw = spec.weights.map((v) => (v / sum) * w);
  const HEAD = 40;
  let svg = `<g>`;
  let cx = x;
  spec.heads.forEach((lines, i) => {
    svg += `<rect x="${f1(cx)}" y="${f1(y)}" width="${f1(cw[i])}" height="${HEAD}" fill="${COLOR.navy}" stroke="${COLOR.white}" stroke-width="1"/>`;
    lines.forEach((l, k) => {
      svg += tx(cx + cw[i] / 2, y + (lines.length === 1 ? 25 : 17 + k * 16), l, { size: 13, weight: k === 0 ? 700 : 400, fill: COLOR.white });
    });
    cx += cw[i];
  });
  svg += "</g>";
  let ry = y + HEAD;
  for (const r of spec.rows) {
    const h = r.cells.some(tall) ? 44 : 34;
    const dash = r.kind === "wrong" ? ` stroke-dasharray="6 4"` : "";
    const stroke = r.kind === "wrong" ? COLOR.error : r.kind === "unit" ? COLOR.success : COLOR.ink;
    const sw = r.kind === "given" ? 2.5 : r.kind === "step" ? 1.2 : 2;
    let g = `<rect x="${f1(x)}" y="${f1(ry)}" width="${f1(w)}" height="${h}" fill="${COLOR.white}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;
    let cx2 = x;
    r.cells.forEach((atoms, i) => {
      if (i > 0) g += `<line x1="${f1(cx2)}" y1="${f1(ry)}" x2="${f1(cx2)}" y2="${f1(ry + h)}" stroke="${GREY}" stroke-width="1"/>`;
      g += inline(cx2 + cw[i] / 2, ry + h / 2, atoms, 14).svg;
      cx2 += cw[i];
    });
    if (r.kind === "wrong") g += `<path d="M${f1(x + w - 22)} ${f1(ry + h / 2 - 6)} l12 12 M${f1(x + w - 10)} ${f1(ry + h / 2 - 6)} l-12 12" stroke="${COLOR.error}" stroke-width="2.5" fill="none"/>`;
    if (r.kind === "unit") g += `<path d="M${f1(x + w - 24)} ${f1(ry + h / 2)} l4 5 l8 -10" stroke="${COLOR.success}" stroke-width="2.5" fill="none"/>`;
    svg += step(r.step, g);
    ry += h;
  }
  return { svg, h: ry - y };
}

/** Column weights that give the first (operation) column a fixed share. @param {number} cols @param {number} first */
export const weights = (cols, first = 0.9) => [first, ...Array.from({ length: cols - 1 }, () => 1)];

/** @param {number} steps */
export const durationFor = (steps) => Math.max(1800, Math.min(8000, 900 * (steps + 1)));

/** The motion: step 0, 1, 2 ... each appear in turn. Everything is visible without it (the static picture is complete). @param {ParentNode} root @param {number} steps */
export function sceneOf(root, steps) {
  const rise = [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "none" },
  ];
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  const slot = 1 / (steps + 1);
  for (let k = 0; k <= steps; k++) {
    const els = [...root.querySelectorAll(`[data-step="${k}"]`)];
    if (els.length) tracks.push({ els, from: k * slot, to: k * slot + slot * 0.85, keyframes: rise });
  }
  return { durationMs: durationFor(steps), tracks };
}
