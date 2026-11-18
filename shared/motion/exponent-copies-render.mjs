// Draws an exponent-copies model as one SVG. Pure string output, no DOM, so the same code serves the lab bench,
// the family page, the print fallback and the node tests. Every number comes from the model; nothing is typed here.
//
// Elements carry data attributes the motion runtime animates (exponent-copies-motion.mjs), and every one of them is
// fully visible without it: the static picture IS the fallback for reduced motion, print and a failed script.
import { COLOR, COPY_FILLS, CSS_VARS, FONT } from "./tokens.mjs";
import { copyOf, describe, sup } from "./exponent-copies.mjs";

const DEFAULT_WIDTH = 600;
const PAD = 12;
const GAP_X = 40;
const GAP_Y = 34;
const CHAR = 0.56; // average glyph width per font-size unit, for fitting text; the layout leaves slack for it

/** @param {unknown} s */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
const f1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;

/** Text in the requested language. A page that switches language re-renders with the other one (the studios and labs already do). */
function L(/** @type {string} */ lang, /** @type {string} */ en, /** @type {string} */ es) {
  if (lang === "es") return esc(es);
  return esc(en);
}
const widest = (/** @type {string} */ a, /** @type {string} */ b, /** @type {string} */ lang) => (lang === "es" ? b : a);

/** @param {number} x @param {number} y @param {string} body @param {{size?: number, weight?: number, anchor?: string, fill?: string, cls?: string}} [o] */
function text(x, y, body, o = {}) {
  const { size = 14, weight = 400, anchor = "middle", fill = COLOR.ink, cls = "" } = o;
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${cls ? ` class="${cls}"` : ""}>${body}</text>`;
}

/** Break a long equation into at most two lines that fit `maxCh` characters. @param {import("./exponent-copies.mjs").Step} s @param {number} maxCh */
function equationLines(s, maxCh) {
  if (s.equation.length <= maxCh) return [s.equation];
  const head = s.factors.length <= maxCh ? s.factors : `${s.factors.split(" × ")[0]} × ${s.factors.split(" × ")[0]} × … × ${s.factors.split(" × ")[0]}`;
  return [head, `= ${s.equation.split("= ")[1]}`];
}

/** Split "12 copies of 35,831,808" onto two lines when it will not fit. @param {string} line @param {number} maxCh */
function wrapCopies(line, maxCh) {
  if (line.length <= maxCh) return [line];
  const i = line.search(/ (of|de) /);
  return i < 0 ? [line] : [line.slice(0, i), line.slice(i + 1)];
}

/** One dot grid (or labelled copy blocks) inside the box (gx, gy, gw, gh). */
function drawBlock(/** @type {number} */ base, /** @type {import("./exponent-copies.mjs").Step} */ s, /** @type {number} */ gx, /** @type {number} */ gy, /** @type {number} */ gw, /** @type {number} */ gh, /** @type {string} */ lang) {
  let out = "";
  if (s.display === "dots") {
    // copy numbers live in a gutter (left of a stack, above a side-by-side row) so they never sit on a dot
    const gutL = s.layout === "stack" ? 18 : 0;
    const gutT = s.layout === "side" ? 16 : 0;
    const cell = Math.min((gw - gutL) / s.cols, (gh - gutT) / s.rows, 24);
    const w = cell * s.cols;
    const h = cell * s.rows;
    const ox = gx + gutL + (gw - gutL - w) / 2;
    const oy = gy + gutT + (gh - gutT - h) / 2;
    const r = Math.max(0.9, cell * 0.34);
    /** @type {Record<number, string>} */
    const byCopy = {};
    for (let row = 0; row < s.rows; row++) {
      for (let col = 0; col < s.cols; col++) {
        const k = copyOf(base, s.n, row, col);
        byCopy[k] = (byCopy[k] || "") + `<circle cx="${f1(ox + (col + 0.5) * cell)}" cy="${f1(oy + (row + 0.5) * cell)}" r="${f1(r)}" fill="${COPY_FILLS[k % COPY_FILLS.length]}"${r >= 3 ? ` stroke="${COLOR.ink}" stroke-width="0.6"` : ""}/>`;
      }
    }
    const prevRows = s.n === 1 ? 1 : base ** Math.floor((s.n - 1) / 2);
    const prevCols = s.n === 1 ? 1 : base ** Math.ceil((s.n - 1) / 2);
    for (let k = 0; k < base; k++) {
      let outline = "";
      if (s.n > 1) {
        // the copy's own region: solid for even copies, dashed for odd; numbered in the gutter when there is room
        const rx = s.layout === "side" ? ox + k * prevCols * cell : ox;
        const ry = s.layout === "stack" ? oy + k * prevRows * cell : oy;
        const rw = prevCols * cell;
        const rh = prevRows * cell;
        outline = `<rect x="${f1(rx + 0.5)}" y="${f1(ry + 0.5)}" width="${f1(rw - 1)}" height="${f1(rh - 1)}" rx="2" fill="none" stroke="${COLOR.ink}" stroke-width="1.2"${k % 2 ? ' stroke-dasharray="4 2.5"' : ""}/>`;
        if (s.layout === "stack" && rh >= 15) outline += text(ox - 5, ry + rh / 2 + 5, String(k + 1), { size: 13, weight: 700, anchor: "end" });
        if (s.layout === "side" && rw >= 15) outline += text(rx + rw / 2, oy - 4, String(k + 1), { size: 13, weight: 700 });
      }
      out += `<g class="mc-copy" data-step="${s.n}" data-copy="${k}">${byCopy[k] || ""}${outline}</g>`;
    }
    return out;
  }
  // above the dot cap: `base` labelled copy blocks, each worth the previous block
  const cols = Math.min(base, 6);
  const rows = Math.ceil(base / cols);
  const cw = gw / cols;
  const chh = Math.min(gh / rows, 44);
  const oy = gy + (gh - chh * rows) / 2;
  for (let k = 0; k < base; k++) {
    const x = gx + (k % cols) * cw + 2;
    const y = oy + Math.floor(k / cols) * chh + 2;
    const fill = COPY_FILLS[k % COPY_FILLS.length];
    out += `<g class="mc-copy" data-step="${s.n}" data-copy="${k}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(cw - 4)}" height="${f1(chh - 4)}" rx="3" fill="${fill}" fill-opacity="0.55" stroke="${COLOR.ink}" stroke-width="1.2"${k % 2 ? ' stroke-dasharray="4 2.5"' : ""}/>`;
    if (cw >= 18 && chh >= 18) out += text(x + (cw - 4) / 2, y + (chh - 4) / 2 + 5, String(k + 1), { size: 14, weight: 700 });
    out += "</g>";
  }
  return out;
}

/**
 * @param {import("./exponent-copies.mjs").ExponentModel} m
 * @param {{ lang?: "en" | "es", compact?: boolean, title?: string, width?: number, tokens?: "hex" | "css" }} [opts] tokens: "css" emits var(--mc-*) (defined in motion.css) instead of literal hex, for pages whose rule is design tokens only. width: the viewBox width; 600 for a wide container, about 360 for a phone so text stays at 13px or more
 * @returns {{ body: string, width: number, height: number, svg: string, zones: { cards: number, answer: number } }} zones: y limits of the steps and of the answer boxes, for direct manipulation
 */
export function renderExponent(m, opts = {}) {
  const W = Math.max(300, Math.min(900, Math.round(opts.width || DEFAULT_WIDTH)));
  const lang = opts.lang || "en";
  const compact = !!opts.compact;
  const n = m.steps.length;
  const perRow = W < 480 ? Math.min(n, 2) : n <= 3 ? n : n === 4 ? 2 : 3;
  const gapX = W < 480 ? 34 : GAP_X;
  const cw = Math.min(210, (W - 2 * PAD - (perRow - 1) * gapX) / perRow);
  const GH = compact ? 70 : 108;
  const LABEL = compact ? 54 : 70;
  const CH = 22 + GH + 6 + LABEL;
  const rowW = perRow * cw + (perRow - 1) * gapX;
  const x0 = (W - rowW) / 2;
  const rows = Math.ceil(n / perRow);
  const maxCh = Math.floor((cw - 6) / (14 * CHAR));
  let body = "";
  let y = PAD;
  m.steps.forEach((s, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const x = x0 + c * (cw + gapX);
    const top = y + r * (CH + GAP_Y);
    let card = `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(cw)}" height="${CH}" rx="10" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    card += `<circle cx="${f1(x + 16)}" cy="${f1(top + 15)}" r="11" fill="${COLOR.navy}"/>${text(x + 16, top + 20, String(s.n), { size: 14, weight: 700, fill: COLOR.white })}`;
    card += text(x + 34, top + 20, `${m.base}${sup(s.n)} · ${L(lang, "step", "paso")} ${s.n}`, { size: 13, weight: 700, anchor: "start", fill: COLOR.ink });
    card += drawBlock(m.base, s, x + 6, top + 26, cw - 12, GH - 6, lang);
    const labelTop = top + 22 + GH + 6;
    let ly = labelTop + 13;
    for (const line of equationLines(s, maxCh)) {
      card += text(x + cw / 2, ly, esc(line), { size: 14, weight: 700 });
      ly += 17;
    }
    const copiesEn = s.copies.en;
    const copiesEs = s.copies.es;
    const wide = widest(copiesEn, copiesEs, lang);
    const enLines = wrapCopies(copiesEn, Math.floor((cw - 6) / (13 * CHAR)));
    const esLines = wrapCopies(copiesEs, Math.floor((cw - 6) / (13 * CHAR)));
    const lines = wide === copiesEs ? esLines : enLines;
    for (let li = 0; li < lines.length; li++) {
      card += text(x + cw / 2, ly, L(lang, enLines[li] ?? "", esLines[li] ?? ""), { size: 13, fill: COLOR.muted });
      ly += 16;
    }
    body += `<g class="mc-card" data-step="${s.n}">${card}</g>`;
    if (s.arrow) {
      const prevIdx = i - 1;
      const pr = Math.floor(prevIdx / perRow);
      const pc = prevIdx % perRow;
      let d;
      let lx;
      let ly2;
      if (pr === r) {
        const ax = x0 + pc * (cw + gapX) + cw;
        const ay = top + CH / 2;
        d = `M${f1(ax + 4)} ${f1(ay)} L${f1(x - 4)} ${f1(ay)}`;
        lx = (ax + x) / 2;
        ly2 = ay - 8;
      } else {
        const sx = x0 + (perRow - 1) * (cw + gapX) + cw / 2;
        const sy = y + pr * (CH + GAP_Y) + CH;
        const ex = x + cw / 2;
        const mid = sy + GAP_Y / 2;
        d = `M${f1(sx)} ${f1(sy + 3)} L${f1(sx)} ${f1(mid)} L${f1(ex)} ${f1(mid)} L${f1(ex)} ${f1(top - 4)}`;
        lx = (sx + ex) / 2;
        ly2 = mid - 5;
      }
      const head = pr === r ? `<path d="M${f1(x - 10)} ${f1(top + CH / 2 - 5)} L${f1(x - 3)} ${f1(top + CH / 2)} L${f1(x - 10)} ${f1(top + CH / 2 + 5)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>` : `<path d="M${f1(x + cw / 2 - 5)} ${f1(top - 10)} L${f1(x + cw / 2)} ${f1(top - 3)} L${f1(x + cw / 2 + 5)} ${f1(top - 10)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
      body += `<g class="mc-arrow" data-step="${s.n}"><path d="${d}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>${head}${text(lx, ly2, esc(s.arrow), { size: 15, weight: 700 })}</g>`;
    }
  });
  const cardsBottom = y + rows * CH + (rows - 1) * GAP_Y;
  y += rows * CH + (rows - 1) * GAP_Y + 20;

  // ---- after the cards: expanded form, notation with annotations, the answer, the misconception check
  const cx = W / 2;
  const avail = W - 2 * PAD;
  let sizeBase = compact ? 40 : 54;
  // wrap the expanded form on " × " so each line fits the width at 20px
  const lineCh = Math.floor(avail / (20 * CHAR));
  const parts = m.expanded.split(" × ");
  /** @type {string[]} */
  const exp = [];
  let cur = "";
  for (const p of parts) {
    const next = cur ? `${cur} × ${p}` : p;
    if (next.length > lineCh && cur) {
      exp.push(`${cur} ×`);
      cur = p;
    } else cur = next;
  }
  exp.push(cur);
  let fin = `<g class="mc-expanded">${text(cx, y + 14, L(lang, "Expanded form", "Forma desarrollada"), { size: 13, fill: COLOR.muted })}`;
  exp.forEach((line, i) => {
    fin += text(cx, y + 38 + i * 24, esc(line), { size: 20, weight: 700 });
  });
  fin += "</g>";
  y += 38 + (exp.length - 1) * 24 + (compact ? 52 : 70);
  // notation: base glyph, raised exponent, "= value"; shrink to fit a narrow container
  const valueText = `= ${m.valueText}`;
  const widths = (/** @type {number} */ sb) => {
    const se = sb * 0.6;
    return { se, bw: String(m.base).length * sb * CHAR, ew: String(m.exponent).length * se * CHAR, vw: valueText.length * sb * 0.8 * CHAR };
  };
  while (sizeBase > 26 && widths(sizeBase).bw + widths(sizeBase).ew + 14 + widths(sizeBase).vw > avail) sizeBase -= 2;
  const { se: sizeExp, bw, ew, vw } = widths(sizeBase);
  const bx = cx - (bw + ew + 14 + vw) / 2;
  const base = y + sizeBase * 0.78;
  fin += `<g class="mc-notation">${text(bx + bw / 2, base, String(m.base), { size: sizeBase, weight: 700, fill: COLOR.tealInk })}${text(bx + bw + 2 + ew / 2, base - sizeBase * 0.55, String(m.exponent), { size: Math.round(sizeExp), weight: 700, fill: COLOR.ink })}${text(bx + bw + ew + 14, base, esc(valueText), { size: Math.round(sizeBase * 0.8), weight: 700, anchor: "start" })}</g>`;
  // annotations: a leader line plus words each, so the meaning never rests on colour
  const expX = bx + bw + 2 + ew / 2;
  const expTop = base - sizeBase * 0.55 - sizeExp * 0.8;
  const noteW = (/** @type {string} */ en, /** @type {string} */ es) => widest(en, es, lang).length * 14 * CHAR + 4;
  const expLabelW = noteW("exponent: how many factors", "exponente: cuántos factores");
  const expLabelX = Math.max(PAD, Math.min(expX - 6, W - PAD - expLabelW));
  fin += `<g class="mc-note" data-note="exponent"><path d="M${f1(expX)} ${f1(expTop)} L${f1(expX)} ${f1(expTop - 12)}" stroke="${COLOR.ink}" stroke-width="1.5" fill="none"/>${text(expLabelX, expTop - 16, L(lang, "exponent: how many factors", "exponente: cuántos factores"), { size: 14, weight: 700, anchor: "start" })}</g>`;
  const baseLabelW = noteW("base: the factor", "base: el factor");
  const baseLabelX = Math.max(PAD + baseLabelW / 2, Math.min(bx + bw / 2, W - PAD - baseLabelW / 2));
  fin += `<g class="mc-note" data-note="base"><path d="M${f1(bx + bw / 2)} ${f1(base + 6)} L${f1(bx + bw / 2)} ${f1(base + 18)}" stroke="${COLOR.tealInk}" stroke-width="1.5" fill="none"/>${text(baseLabelX, base + 34, L(lang, "base: the factor", "base: el factor"), { size: 14, weight: 700, fill: COLOR.tealInk })}</g>`;
  y = base + 52;
  // the answer (solid box, check) and the misconception (dashed box, cross)
  const boxW = Math.min(520, avail);
  const bxl = cx - boxW / 2;
  const answerTop = y;
  const fullAnswer = `${m.notation} = ${m.expanded} = ${m.valueText}`;
  const answer = fullAnswer.length * 15 * CHAR + 56 <= boxW ? fullAnswer : `${m.notation} = ${m.valueText}`;
  fin += `<g class="mc-answer"><rect x="${f1(bxl)}" y="${f1(y)}" width="${boxW}" height="38" rx="8" fill="none" stroke="${COLOR.success}" stroke-width="2"/><path d="M${f1(bxl + 14)} ${f1(y + 20)} l5 6 l10 -12" fill="none" stroke="${COLOR.success}" stroke-width="3"/>${text(bxl + 42, y + 25, esc(answer), { size: 15, weight: 700, anchor: "start" })}</g>`;
  y += 48;
  if (m.misconception) {
    fin += `<g class="mc-check"><rect x="${f1(bxl)}" y="${f1(y)}" width="${boxW}" height="38" rx="8" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/><path d="M${f1(bxl + 14)} ${f1(y + 12)} l14 14 M${f1(bxl + 28)} ${f1(y + 12)} l-14 14" stroke="${COLOR.error}" stroke-width="3" fill="none"/>${text(bxl + 42, y + 25, L(lang, m.misconception.text, m.misconception.textEs), { size: 15, weight: 700, anchor: "start" })}</g>`;
    y += 48;
  }
  body += `<g class="mc-final">${fin}</g>`;
  body = `<g class="mc-root" data-zone-cards="${f1(cardsBottom + 10)}" data-zone-answer="${f1(answerTop)}">${body}</g>`;
  if (opts.tokens === "css") body = body.replace(/#[0-9a-fA-F]{6}\b/g, (h) => /** @type {Record<string, string>} */ (CSS_VARS)[h.toLowerCase()] || h);
  const height = Math.ceil(y + 4);
  const title = opts.title || `${m.notation} = ${m.valueText}`;
  const desc = describe(m, lang);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="mc-exponent" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(title)}" font-family='${FONT}'><title>${esc(title)}</title><desc>${esc(desc)}</desc>${body}</svg>`;
  return { body, width: W, height, svg, zones: { cards: cardsBottom + 10, answer: answerTop } };
}

export { sup };
