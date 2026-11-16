// percent:grid - a hundred grid and a tape shaded together, piece by piece, as the percent is built from benchmarks.
// Lessons 4-1 (understand percent) and 4-2 (fractions, decimals and percents). Headline: p% of b = p/100 x b, the lab's value.
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { block, benchmarkWord, callout, clampWidth, dec, dashOf, equivalents, f1, fillOf, gcd, legendRow, PAD, pieceExpr, pieces, rat, stepScene, T, tape, text } from "./percent-kit.mjs";

/** @typedef {import("./percent-kit.mjs").PercentFigure} PercentFigure */

const DENOMS = [100, 50, 25, 10, 5, 1];

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const [p, b] = values;
  if (key !== "percent:grid" || !Number.isInteger(p) || !Number.isInteger(b) || p < 0 || p > 200 || b < 1 || b > 120) throw new RangeError("Percent is 0 to 200 and the whole amount 1 to 120, whole numbers.");
  const part = new Rat(BigInt(p * b), 100n);
  const g = gcd(p, 100);
  const groups = pieces(p, DENOMS);
  return {
    p,
    b,
    part: dec(part),
    partRat: part,
    groups,
    unit: dec(rat(b, 100)).text,
    decimal: dec(rat(p, 100)).text,
    simple: g > 1 && 100 / g > 1 ? /** @type {[number, number]} */ ([p / g, 100 / g]) : null,
    wrong: dec(rat(p, 10)).text,
    wrongPct: p * 10,
  };
}

/** @typedef {ReturnType<typeof build>} Model */

/** @param {Model} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, o) {
  const W = clampWidth(o.width);
  const lang = o.lang;
  const t = (/** @type {string} */ en, /** @type {string} */ es) => T(lang, en, es);
  const avail = W - 2 * PAD;
  let y = PAD;
  let svg = "";
  // ---- the grid(s)
  const grids = m.p > 100 ? 2 : 1;
  const cell = grids === 1 ? Math.min(20, Math.floor(avail / 10)) : Math.min(18, Math.floor((avail - 16) / 20));
  const gw = cell * 10;
  const gap = 16;
  const left = (W - (grids * gw + (grids - 1) * gap)) / 2;
  for (let gi = 0; gi < grids; gi++) {
    const ox = left + gi * (gw + gap);
    const oy = y;
    let base = "";
    for (let i = 0; i < 100; i++) base += `<rect x="${f1(ox + (i % 10) * cell + 0.75)}" y="${f1(oy + Math.floor(i / 10) * cell + 0.75)}" width="${f1(cell - 1.5)}" height="${f1(cell - 1.5)}"/>`;
    svg += `<g fill="${COLOR.white}" stroke="${COLOR.muted}" stroke-width="0.8">${base}</g>`;
    for (const g of m.groups) {
      const s = Math.max(g.from, gi * 100) - gi * 100;
      const e = Math.min(g.to, (gi + 1) * 100) - gi * 100;
      if (e <= s) continue;
      let cells = "";
      for (let i = s; i < e; i++) cells += `<rect x="${f1(ox + (i % 10) * cell + 0.75)}" y="${f1(oy + Math.floor(i / 10) * cell + 0.75)}" width="${f1(cell - 1.5)}" height="${f1(cell - 1.5)}"/>`;
      const r0 = Math.floor(s / 10);
      const c0 = s % 10;
      const r1 = Math.floor((e - 1) / 10);
      const c1 = ((e - 1) % 10) + 1;
      const X = (/** @type {number} */ c) => f1(ox + c * cell);
      const Y = (/** @type {number} */ r) => f1(oy + r * cell);
      const path = r0 === r1 ? `M${X(c0)} ${Y(r0)} H${X(c1)} V${Y(r0 + 1)} H${X(c0)} Z` : `M${X(c0)} ${Y(r0)} H${X(10)} V${Y(r1)} H${X(c1)} V${Y(r1 + 1)} H${X(0)} V${Y(r0 + 1)} H${X(c0)} Z`;
      const digit = g.from >= gi * 100 ? text(ox + (c0 + 0.5) * cell, oy + (r0 + 0.5) * cell + 4.5, g.i + 1, { size: 13, weight: 700 }) : "";
      svg += `<g class="pm-pop" data-step="${g.i + 1}"><g fill="${fillOf(g.i)}">${cells}</g><path d="${path}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6" stroke-linejoin="round"${dashOf(g.i)}/>${digit}</g>`;
    }
    const n = Math.min(100, Math.max(0, m.p - gi * 100));
    const cap = grids === 1 ? [t(`${n} of 100 squares are shaded`, `${n} de 100 cuadros están sombreados`)] : [t(`Grid ${gi + 1}`, `Cuadrícula ${gi + 1}`), t(`${n} of 100`, `${n} de 100`)];
    cap.forEach((c, i) => {
      svg += text(ox + gw / 2, oy + gw + 18 + i * 17, c, { size: 13, weight: i ? 400 : 700, fill: COLOR.muted });
    });
    if (gi === grids - 1) y = oy + gw + 18 + cap.length * 17 + 10;
  }
  // ---- the benchmark steps
  const head = m.p === 0 ? t("0% shades no squares", "0% no sombrea ningún cuadro") : t(`Build ${m.p}% from benchmarks`, `Armamos ${m.p}% con porcentajes de referencia`);
  const hb = block(PAD, y + 12, head, { width: avail, weight: 700 });
  svg += hb.svg;
  y += hb.h + 6;
  const whole = { en: "the whole grid", es: "la cuadrícula completa" };
  for (const g of m.groups) {
    const n = g.size * g.count;
    const sq = t(`${n} ${n === 1 ? "square" : "squares"}`, `${n} ${n === 1 ? "cuadro" : "cuadros"}`);
    const r = legendRow({ x: PAD, y, w: avail, step: g.i + 1, n: g.i + 1, expr: pieceExpr(g), total: `= ${g.to}%`, detail: `${benchmarkWord(lang, g.size, g.count, whole)}: ${sq}` });
    svg += r.svg;
    y += r.h;
  }
  y += 8;
  // ---- the tape: the same pieces on a bar whose whole is the amount
  const tp = tape({
    W,
    y,
    extent: Math.max(100, m.p),
    pieces: m.groups,
    wholeLabel: t(`Whole: ${m.b} = 100%`, `Total: ${m.b} = 100%`),
    brackets: m.p ? [{ from: 0, to: m.p, label: `${m.p}% ${t("of", "de")} ${m.b} = ${m.part.text}` }] : [],
  });
  svg += tp.svg;
  y = tp.bottom + 8;
  // ---- the same value under four names
  const eqHead = [t("fraction", "fracción"), ...(m.simple ? [t("simplest form", "forma más simple")] : []), t("decimal", "decimal"), t("percent", "porcentaje")].join(" = ");
  const eh = block(PAD, y + 12, eqHead, { width: avail, size: 13, weight: 700, fill: COLOR.muted });
  svg += `<g class="pm-final">${eh.svg}`;
  y += eh.h + 4;
  /** @type {Array<{ frac?: [number, number], txt?: string }>} */
  const items = [{ frac: [m.p, 100] }];
  if (m.simple) items.push({ frac: m.simple });
  items.push({ txt: m.decimal }, { txt: `${m.p}%` });
  const eq = equivalents(W, y, items);
  svg += `${eq.svg}</g>`;
  y += eq.h + 6;
  // ---- the answer and the wrong moves
  const answer = [`${m.p}% ${t("of", "de")} ${m.b} = ${m.part.text}`];
  if (m.b !== 100) answer.push(t(`${m.p} squares × ${m.unit} each = ${m.part.text}`, `${m.p} cuadros × ${m.unit} cada uno = ${m.part.text}`));
  const a = callout({ x: PAD, y, w: avail, kind: "ok", lines: answer });
  svg += a.svg;
  y += a.h;
  if (m.p > 0) {
    const c = callout({ x: PAD, y, w: avail, kind: "no", lines: [t(`Not this: ${m.p}% = ${m.wrong}`, `Esto no: ${m.p}% = ${m.wrong}`), t(`${m.wrong} is ${m.wrongPct}%. The decimal is ${m.decimal}.`, `${m.wrong} es ${m.wrongPct}%. El decimal es ${m.decimal}.`)] });
    svg += c.svg;
    y += c.h;
  }
  if (m.p > 0 && m.b !== 100) {
    const c = callout({ x: PAD, y, w: avail, kind: "no", lines: [t(`Not this: ${m.p}% of ${m.b} = ${m.p}`, `Esto no: ${m.p}% de ${m.b} = ${m.p}`), t(`The percent is out of 100, not out of ${m.b}.`, `El porcentaje es de 100, no de ${m.b}.`)] });
    svg += c.svg;
    y += c.h;
  }
  return { body: svg, width: W, height: Math.ceil(y + 4) };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const t = (/** @type {string} */ en, /** @type {string} */ es) => T(lang, en, es);
  const whole = { en: "the whole grid", es: "la cuadrícula completa" };
  const s = [];
  s.push(m.p > 100 ? t(`A percent over 100 needs a second hundred grid. Each square is 1% of the whole, ${m.b}.`, `Un porcentaje mayor que 100 necesita una segunda cuadrícula de cien. Cada cuadro es 1% del total, ${m.b}.`) : t(`The hundred grid has 100 squares. Each square is 1% of the whole, ${m.b}.`, `La cuadrícula de cien tiene 100 cuadros. Cada cuadro es 1% del total, ${m.b}.`));
  if (m.p === 0) s.push(t("0% shades no squares.", "0% no sombrea ningún cuadro."));
  m.groups.forEach((g) => s.push(t(`Step ${g.i + 1}: ${pieceExpr(g)}, ${benchmarkWord("en", g.size, g.count, whole)}, ${g.size * g.count} squares, ${g.to}% so far.`, `Paso ${g.i + 1}: ${pieceExpr(g)}, ${benchmarkWord("es", g.size, g.count, whole)}, ${g.size * g.count} cuadros, ${g.to}% hasta ahora.`)));
  s.push(t(`On the tape, the whole ${m.b} is 100% and the shaded part reaches ${m.p}%.`, `En la cinta, el total ${m.b} es 100% y la parte sombreada llega a ${m.p}%.`));
  s.push(t(`As a fraction ${m.p} over 100${m.simple ? `, in simplest form ${m.simple[0]} over ${m.simple[1]}` : ""}. As a decimal ${m.decimal}. As a percent ${m.p}%.`, `Como fracción ${m.p} sobre 100${m.simple ? `, en su forma más simple ${m.simple[0]} sobre ${m.simple[1]}` : ""}. Como decimal ${m.decimal}. Como porcentaje ${m.p}%.`));
  s.push(t(`${m.p}% of ${m.b} = ${m.part.text}.`, `${m.p}% de ${m.b} = ${m.part.text}.`));
  if (m.p > 0) s.push(t(`Not this: ${m.p}% = ${m.wrong}; ${m.wrong} is ${m.wrongPct}%.`, `Esto no: ${m.p}% = ${m.wrong}; ${m.wrong} es ${m.wrongPct}%.`));
  if (m.p > 0 && m.b !== 100) s.push(t(`Not this: ${m.p}% of ${m.b} is ${m.p}. The percent is out of 100, not out of ${m.b}.`, `Esto no: ${m.p}% de ${m.b} es ${m.p}. El porcentaje es de 100, no de ${m.b}.`));
  return s.join(" ");
}

/** @param {Model} m @param {"en" | "es"} lang */
const headline = (m, lang) => ({ label: T(lang, "Shaded amount", "Cantidad sombreada"), value: m.part.text });

/**
 * The amount slip when the whole is not 100 (the percent used as the amount); otherwise the decimal slip. Null exactly when no "not this" card is drawn.
 * @param {Model} m @param {"en" | "es"} lang
 */
function wrong(m, lang) {
  if (m.p === 0) return null;
  if (m.b !== 100) return { value: String(m.p), say: T(lang, "Used the percent as the amount instead of finding that share of the whole.", "Usó el porcentaje como la cantidad en vez de hallar esa parte del total.") };
  return { value: m.wrong, say: T(lang, "Moved the decimal point one place instead of two.", "Movió el punto decimal un lugar en vez de dos.") };
}

/** @type {PercentFigure} */
const grid = {
  id: "percent-grid",
  keys: ["percent:grid"],
  title: { en: "Percent on the hundred grid and the tape", es: "El porcentaje en la cuadrícula de cien y la cinta" },
  controls: () => [
    { label: "Percent", labelEs: "Porcentaje", min: 0, max: 200, step: 1 },
    { label: "Whole amount", labelEs: "Cantidad total", min: 1, max: 120, step: 1 },
  ],
  build,
  render,
  scene: (root) => stepScene(root),
  describe,
  headline,
  wrong,
};
export default grid;
