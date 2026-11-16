// Motion figure for lesson 5-10 (volume with fractional edges): a prism whose edges are whole numbers of halves is packed with
// cubes one half unit on an edge (each is 1/8 of a cubic unit), and the same volume is found as base area x height.
// Every value is an exact Rat; fractions are drawn stacked (numerator, bar, denominator).
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { CU, FADE, FILL, L, P, POP, T, all, card, f1, frameOf, notBox, poly, sceneOf, stackBoxes, sub, textW } from "./geometry-kit.mjs";

/** @param {number} lh @param {number} wh @param {number} hh edges in halves of a unit */
export function fractionalModel(lh, wh, hh) {
  for (const v of [lh, wh, hh]) if (!Number.isInteger(v) || v < 1 || v > 12) throw new RangeError("Use a whole number of halves from 1 to 12.");
  const half = new Rat(1n, 2n);
  const edge = (/** @type {number} */ k) => new Rat(BigInt(k)).mul(half);
  const l = edge(lh);
  const w = edge(wh);
  const h = edge(hh);
  const layer = lh * wh;
  const count = layer * hh;
  const cube = new Rat(1n, 8n);
  const byCubes = new Rat(BigInt(count)).mul(cube);
  const base = l.mul(w);
  const byBase = base.mul(h);
  return { lh, wh, hh, l, w, h, layer, count, cube, byCubes, base, byBase, volume: byBase };
}
/** @typedef {ReturnType<typeof fractionalModel>} FracModel */

/** Plain "1 1/2" / "3/2" / "4" text, for describe(). @param {Rat} r */
export function mixed(r) {
  if (r.d === 1n) return String(r.n);
  const whole = r.n / r.d;
  return whole > 0n ? `${whole} ${r.n % r.d}/${r.d}` : `${r.n}/${r.d}`;
}

// ---- stacked fractions ---------------------------------------------------------------------------------------------------

/** @typedef {string | { whole?: string, n: string, d: string }} Tok */
/** A token for a Rat: an integer string, or a (mixed) stacked fraction. @param {Rat} r @returns {Tok} */
export function tokOf(r) {
  if (r.d === 1n) return String(r.n);
  const whole = r.n / r.d;
  return whole > 0n ? { whole: String(whole), n: String(r.n % r.d), d: String(r.d) } : { n: String(r.n), d: String(r.d) };
}
const SIZE = 14;
const wOf = (/** @type {Tok} */ t) => (typeof t === "string" ? textW(t, SIZE, true) : (t.whole ? textW(t.whole, SIZE, true) + 4 : 0) + Math.max(textW(t.n, SIZE, true), textW(t.d, SIZE, true)) + 8);

/** One token with its left edge at x and text baseline at y. @param {Tok} t @param {number} x @param {number} y */
function drawTok(t, x, y) {
  if (typeof t === "string") return T(x, y, t, { weight: 700, anchor: "start" });
  let out = "";
  let fx = x;
  if (t.whole) {
    out += T(x, y, t.whole, { weight: 700, anchor: "start" });
    fx += textW(t.whole, SIZE, true) + 4;
  }
  const fw = Math.max(textW(t.n, SIZE, true), textW(t.d, SIZE, true)) + 8;
  out += T(fx + fw / 2, y - 9, t.n, { weight: 700 }) + T(fx + fw / 2, y + 13, t.d, { weight: 700 });
  out += `<line x1="${f1(fx)}" y1="${f1(y - 5)}" x2="${f1(fx + fw)}" y2="${f1(y - 5)}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
  return out;
}
/** A row of tokens centred on cx. @param {Tok[]} toks @param {number} cx @param {number} y */
function drawRowAt(toks, cx, y) {
  const gap = 7;
  const total = toks.reduce((s, t) => s + wOf(t), 0) + gap * (toks.length - 1);
  let x = cx - total / 2;
  let out = "";
  for (const t of toks) {
    out += drawTok(t, x, y);
    x += wOf(t) + gap;
  }
  return out;
}
const ROW_H = 40;
/** A part holding one centred row; k marks it for the scene. @param {Tok[]} toks @param {number} k */
const rowPart = (toks, k) => (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => ({ svg: `<g class="gm-row3" data-step="3" data-k="${k}">${drawRowAt(toks, x + w / 2, y + 22)}</g>`, h: ROW_H });
const noteOf = (/** @type {string} */ s) => (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => P(x + w / 2, y, s, w, { size: 13, fill: COLOR.muted });
const lineOf = (/** @type {string} */ s) => (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => P(x + w / 2, y, s, w, { weight: 700 });

// ---- drawings ------------------------------------------------------------------------------------------------------------

function drawBox(/** @type {FracModel} */ m) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const Lf = m.lh / 2;
    const Wf = m.wh / 2;
    const Hf = m.hh / 2;
    const c = Math.min((w - 112) / (Lf + 0.45 * Wf), 150 / (Hf + 0.3 * Wf), 40);
    const dx = 0.45 * c;
    const dy = 0.3 * c;
    const x0 = x + 56 + (w - 112 - (Lf + 0.45 * Wf) * c) / 2;
    const yb = y + 6 + (Hf + 0.3 * Wf) * c;
    const fw = Lf * c;
    const fh = Hf * c;
    const dw = Wf * dx;
    const dh = Wf * dy;
    let svg = `<g class="gm-box" data-step="1">`;
    svg += poly([[x0, yb - fh], [x0 + fw, yb - fh], [x0 + fw + dw, yb - fh - dh], [x0 + dw, yb - fh - dh]], { fill: FILL.teal, fo: 0.2 });
    svg += poly([[x0 + fw, yb], [x0 + fw + dw, yb - dh], [x0 + fw + dw, yb - fh - dh], [x0 + fw, yb - fh]], { fill: FILL.teal, fo: 0.5 });
    svg += poly([[x0, yb], [x0 + fw, yb], [x0 + fw, yb - fh], [x0, yb - fh]], { fill: FILL.teal, fo: 0.35 });
    svg += "</g>";
    const el = tokOf(m.l);
    const ew = tokOf(m.w);
    const eh = tokOf(m.h);
    svg += drawRowAt([el], x0 + fw / 2, yb + 24);
    svg += drawTok(eh, x0 - 8 - wOf(eh), yb - fh / 2 + 5);
    svg += drawTok(ew, x0 + fw + dw / 2 + 10, yb - dh / 2 + 14);
    return { svg, h: 6 + (Hf + 0.3 * Wf) * c + 44 };
  };
}

function drawPack(/** @type {FracModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const colW = 50;
    const avail = w - colW - 8;
    const c = Math.min(avail / (m.lh + 0.45 * m.wh), 170 / (m.hh + 0.3 * m.wh), 28);
    const dx = 0.45 * c;
    const dy = 0.3 * c;
    const x0 = x + colW + (avail - (m.lh + 0.45 * m.wh) * c) / 2;
    const top = 24;
    const yb = y + top + (m.hh + 0.3 * m.wh) * c;
    const step = Math.max(1, Math.ceil(20 / c));
    let svg = T(x + colW, y + 14, L(lang, "Cubes", "Cubos"), { size: 13, anchor: "end", fill: COLOR.muted });
    const thin = `stroke="${COLOR.ink}" stroke-opacity="0.5" stroke-width="1" fill="none"`;
    for (let i = 0; i < m.hh; i++) {
      const fb = yb - i * c;
      const ft = fb - c;
      const f = { fill: i % 2 ? FILL.amber : FILL.teal, fo: 0.45, sw: 1.4 };
      const backed = (/** @type {number[][]} */ pts) => poly(pts, { fill: COLOR.white, stroke: "none", sw: 0 }) + poly(pts, f);
      let g = backed([[x0, ft], [x0 + m.lh * c, ft], [x0 + m.lh * c + m.wh * dx, ft - m.wh * dy], [x0 + m.wh * dx, ft - m.wh * dy]]);
      let tg = "";
      for (let j = 1; j < m.lh; j++) tg += `M${f1(x0 + j * c)} ${f1(ft)}L${f1(x0 + j * c + m.wh * dx)} ${f1(ft - m.wh * dy)}`;
      for (let j = 1; j < m.wh; j++) tg += `M${f1(x0 + j * dx)} ${f1(ft - j * dy)}H${f1(x0 + m.lh * c + j * dx)}`;
      g += `<path d="${tg}" ${thin}/>`;
      g += backed([[x0, fb], [x0 + m.lh * c, fb], [x0 + m.lh * c, ft], [x0, ft]]);
      let fg = "";
      for (let j = 1; j < m.lh; j++) fg += `M${f1(x0 + j * c)} ${f1(fb)}V${f1(ft)}`;
      g += `<path d="${fg}" ${thin}/>`;
      g += backed([[x0 + m.lh * c, fb], [x0 + m.lh * c + m.wh * dx, fb - m.wh * dy], [x0 + m.lh * c + m.wh * dx, ft - m.wh * dy], [x0 + m.lh * c, ft]]);
      let rg = "";
      for (let j = 1; j < m.wh; j++) rg += `M${f1(x0 + m.lh * c + j * dx)} ${f1(fb - j * dy)}V${f1(ft - j * dy)}`;
      g += `<path d="${rg}" ${thin}/>`;
      if (i === m.hh - 1 || ((i + 1) % step === 0 && m.hh - 1 - i >= step)) g += T(x + colW, fb - c / 2 + 5, String(m.layer * (i + 1)), { weight: 700, anchor: "end" });
      svg += `<g class="gm-layer" data-step="2" data-i="${i}">${g}</g>`;
    }
    return { svg, h: top + (m.hh + 0.3 * m.wh) * c + 6 };
  };
}

// ---- the closing boxes -----------------------------------------------------------------------------------------------------

function answerRows(/** @type {FracModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const t = P(x + 42, y + 10, L(lang, "Both ways give the same volume:", "Las dos maneras dan el mismo volumen:"), w - 54, { size: 15, weight: 700, anchor: "start" });
    const rowY = y + 10 + t.h + 22;
    const h = 10 + t.h + ROW_H + 14;
    const row = drawRowAt(["V =", tokOf(m.volume), L(lang, CU.en, CU.es)], x + 42 + (w - 54) / 2, rowY);
    const check = `<path d="M${f1(x + 14)} ${f1(y + h / 2)} l5 6 l10 -12" fill="none" stroke="${COLOR.success}" stroke-width="3"/>`;
    return { svg: `<g class="gm-final" data-step="4"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="8" fill="${COLOR.white}" stroke="${COLOR.success}" stroke-width="2"/>${check}${t.svg}${row}</g>`, h };
  };
}

export const fractionalFigure = {
  id: "solid-volume-fractional",
  keys: ["solid:fractional"],
  standalone: { values: [3, 2, 2] },
  title: { en: "Volume with fractional edges: small cubes, then base area × height", es: "Volumen con aristas fraccionarias: cubos pequeños y luego área de la base × altura" },
  controls: () => [
    { label: "Length (halves of a unit)", labelEs: "Largo (mitades de unidad)", min: 1, max: 12, step: 1 },
    { label: "Width (halves of a unit)", labelEs: "Ancho (mitades de unidad)", min: 1, max: 12, step: 1 },
    { label: "Height (halves of a unit)", labelEs: "Altura (mitades de unidad)", min: 1, max: 12, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    if (!Array.isArray(v) || v.length !== 3) throw new RangeError("Wrong number of settings.");
    return fractionalModel(v[0], v[1], v[2]);
  },
  render(/** @type {FracModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, "A prism with edges measured in halves of a unit", "Un prisma con aristas medidas en mitades de unidad"), [
      drawBox(m),
      noteOf(L(lang, `Each edge is a whole number of halves: ${m.lh}, ${m.wh} and ${m.hh}.`, `Cada arista es un número entero de mitades: ${m.lh}, ${m.wh} y ${m.hh}.`)),
    ]);
    y += c1.h + 12;
    const half = new Rat(1n, 2n);
    const c2 = card(x, y, w, 2, L(lang, "Pack it with small cubes, each one half unit on an edge", "Llénalo con cubos pequeños de media unidad por arista"), [
      drawPack(m, lang),
      lineOf(L(lang, `${m.lh} × ${m.wh} = ${m.layer} in a layer; ${m.hh} layers make ${m.count} small cubes`, `${m.lh} × ${m.wh} = ${m.layer} en una capa; ${m.hh} capas son ${m.count} cubos pequeños`)),
      noteOf(L(lang, "One small cube:", "Un cubo pequeño:")),
      (px, py, pw) => ({ svg: `<g class="gm-row3" data-step="2" data-k="9">${drawRowAt([tokOf(half), "×", tokOf(half), "×", tokOf(half), "=", tokOf(m.cube)], px + pw / 2, py + 22)}</g>`, h: ROW_H }),
      noteOf(L(lang, "All the small cubes:", "Todos los cubos pequeños:")),
      rowPart([String(m.count), "×", tokOf(m.cube), "=", tokOf(m.byCubes)], 0),
    ]);
    y += c2.h + 12;
    const c3 = card(x, y, w, 3, L(lang, "Check: base area × height gives the same volume", "Comprueba: el área de la base × la altura da el mismo volumen"), [
      noteOf(L(lang, "Base area:", "Área de la base:")),
      rowPart([tokOf(m.l), "×", tokOf(m.w), "=", tokOf(m.base)], 1),
      noteOf(L(lang, "Base area × height:", "Área de la base × altura:")),
      rowPart([tokOf(m.base), "×", tokOf(m.h), "=", tokOf(m.byBase)], 2),
    ]);
    y += c3.h + 12;
    const fin = stackBoxes(x, y, w, [
      answerRows(m, lang),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${m.count} is the number of small cubes, not the volume. Each small cube is only one eighth of a cubic unit.`, `No así: ${m.count} es el número de cubos pequeños, no el volumen. Cada cubo pequeño es solo un octavo de unidad cúbica.`), 4),
    ]);
    return { body: c1.svg + c2.svg + c3.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {FracModel} */ m) {
    return sceneOf(root, 3, (win) => [
      { els: all(root, ".gm-box"), ...sub(win(1), 0.3, 0.8), keyframes: POP },
      ...all(root, ".gm-layer").map((el, i) => {
        const w = sub(win(2), 0.15 + (0.55 * i) / m.hh, 0.15 + (0.55 * (i + 1)) / m.hh);
        return { els: [el], from: w.from, to: w.to, keyframes: [{ opacity: 0, transform: "translateY(-14px)" }, { opacity: 1, transform: "none" }] };
      }),
      ...all(root, ".gm-row3").map((el) => {
        const k = Number(el.getAttribute("data-k"));
        const win2 = k === 0 || k === 9 ? win(2) : win(3);
        const [a, b] = k === 9 ? [0.72, 0.82] : k === 0 ? [0.85, 0.98] : [0.15 + 0.4 * (k - 1), 0.45 + 0.4 * (k - 1)];
        return { els: [el], ...sub(win2, a, b), keyframes: FADE };
      }),
    ]);
  },
  headline: (/** @type {FracModel} */ m, /** @type {string} */ lang) => ({ label: L(lang, "Volume (cubic units)", "Volumen (unidades cúbicas)"), value: m.volume.toString() }),
  wrong: (/** @type {FracModel} */ m, /** @type {string} */ lang) => ({
    value: String(m.count),
    say: L(lang, "Counted the half-unit cubes as the volume, but each one is only one eighth of a cubic unit.", "Contaste los cubos de media unidad como el volumen, pero cada uno es solo un octavo de unidad cúbica."),
  }),
  describe(/** @type {FracModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    const [l, w, h, b, v] = [mixed(m.l), mixed(m.w), mixed(m.h), mixed(m.base), mixed(m.volume)];
    return es
      ? `Un prisma rectangular con aristas de ${l}, ${w} y ${h} unidades, es decir ${m.lh}, ${m.wh} y ${m.hh} mitades. Se llena con cubos pequeños de media unidad por arista: una capa tiene ${m.lh} × ${m.wh} = ${m.layer} cubos y ${m.hh} capas suman ${m.count} cubos. Cada cubo pequeño es 1/2 × 1/2 × 1/2 = 1/8 de unidad cúbica, así que el volumen es ${m.count} × 1/8 = ${v} unidades cúbicas. Con el área de la base: ${l} × ${w} = ${b}, y ${b} × ${h} = ${v}. Las dos maneras dan el mismo volumen. No así: ${m.count} es el número de cubos pequeños, no el volumen.`
      : `A rectangular prism with edges ${l}, ${w} and ${h} units, which is ${m.lh}, ${m.wh} and ${m.hh} halves. It is packed with small cubes one half unit on an edge: a layer has ${m.lh} × ${m.wh} = ${m.layer} cubes and ${m.hh} layers make ${m.count} cubes. Each small cube is 1/2 × 1/2 × 1/2 = 1/8 of a cubic unit, so the volume is ${m.count} × 1/8 = ${v} cubic units. With base area: ${l} × ${w} = ${b}, and ${b} × ${h} = ${v}. Both ways give the same volume. Not this: ${m.count} is the number of small cubes, not the volume.`;
  },
};

export default [fractionalFigure];
