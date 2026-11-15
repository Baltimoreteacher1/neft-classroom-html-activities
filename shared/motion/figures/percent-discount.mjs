// percent:discount / percent:benchmark / percent:tape - the percent of a number built from benchmark pieces of the original price.
// Lessons 4-3 (estimate the percent of a number) and 4-4 (find and compare with percentages). Headline: p% of b = p/100 x b.
// The benchmark variant also estimates first (nearest benchmark percent, friendly whole); the tape variant is the same picture without the estimate.
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { benchmarkWord, block, callout, clampWidth, dec, legendRow, nb, PAD, pieceExpr, pieces, rat, stepScene, T, tape } from "./percent-kit.mjs";

const DENOMS = [100, 50, 25, 10, 5, 1];
const MARKS = [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];

/** Nearest benchmark percents to p (two when p sits exactly halfway). @param {number} p */
function nearest(p) {
  const gap = Math.min(...MARKS.map((m) => Math.abs(m - p)));
  return MARKS.filter((m) => Math.abs(m - p) === gap);
}

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const [p, b] = values;
  if (!["percent:discount", "percent:benchmark", "percent:tape"].includes(key) || !Number.isInteger(p) || !Number.isInteger(b) || p < 0 || p > 100 || b < 1 || b > 120) throw new RangeError("Percent is 0 to 100 and the whole amount 1 to 120, whole numbers.");
  const discount = new Rat(BigInt(p * b), 100n);
  const groups = pieces(p, DENOMS).map((g) => ({ ...g, each: dec(rat(g.size * b, 100)).text, value: dec(rat(g.size * g.count * b, 100)).text, running: dec(rat(g.to * b, 100)).text }));
  const near = p > 0 && p < 100 ? nearest(p) : [];
  const friendly = b < 10 || b % 10 === 0 ? b : Math.floor((b + 5) / 10) * 10;
  const estimates = near.map((m) => dec(rat(m * friendly, 100)).text);
  const estimateWorks = near.length > 0 && !(near.length === 1 && near[0] === p && friendly === b);
  return {
    key,
    p,
    b,
    discount: dec(discount),
    final: dec(rat(b * 100 - p * b, 100)),
    decimal: dec(rat(p, 100)).text,
    groups,
    near,
    friendly,
    estimates,
    estimate: key !== "percent:tape" && estimateWorks,
    wrong: p > 0 && b !== 100 ? dec(rat(b - p)).text : null,
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
  const tp = tape({
    W,
    y,
    extent: 100,
    pieces: m.groups,
    remainderFrom: m.p < 100 ? m.p : undefined,
    wholeLabel: t(`Original price: ${m.b} = 100%`, `Precio original: ${m.b} = 100%`),
    brackets: [...(m.p > 0 ? [{ from: 0, to: m.p, label: t(`Discount: ${m.discount.text}`, `Descuento: ${m.discount.text}`) }] : []), ...(m.p < 100 ? [{ from: m.p, to: 100, label: t(`Final price: ${m.final.text}`, `Precio final: ${m.final.text}`), dashed: true }] : [])],
  });
  svg += tp.svg;
  y = tp.bottom + 6;
  const head = m.p === 0 ? t("0% takes off nothing", "0% no descuenta nada") : t(`Build ${m.p}% from benchmarks`, `Armamos ${m.p}% con porcentajes de referencia`);
  const hb = block(PAD, y + 12, head, { width: avail, weight: 700 });
  svg += hb.svg;
  y += hb.h + 6;
  const whole = { en: "the whole price", es: "el precio completo" };
  for (const g of m.groups) {
    const word = benchmarkWord(lang, g.size, 1, whole);
    const how = g.size === 100 ? `${m.b}` : `${m.b} ÷ ${100 / g.size} = ${g.each}`;
    const detail = g.size === 100 ? `${word}: ${m.b}` : `${word} ${t("of", "de")} ${m.b}: ${how}${g.count > 1 ? `; ${nb(`${g.count} × ${g.each} = ${g.value}`)}` : ""}`;
    const r = legendRow({ x: PAD, y, w: avail, step: g.i + 1, n: g.i + 1, expr: pieceExpr(g), total: `= ${g.to}% = ${g.running}`, detail });
    svg += r.svg;
    y += r.h;
  }
  if (m.groups.length > 1) {
    const sum = block(PAD, y + 14, `${m.groups.map((g) => g.value).join(" + ")} = ${m.discount.text}`, { width: avail, weight: 700 });
    svg += `<g class="pm-final">${sum.svg}</g>`;
    y += sum.h + 8;
  }
  y += 6;
  if (m.estimate) {
    const lines = [t("Estimate first", "Primero estima")];
    const [a, c] = m.near;
    lines.push(c === undefined ? t(`${m.p}% is close to ${a}%.`, `${m.p}% está cerca de ${a}%.`) : t(`${m.p}% is halfway between ${a}% and ${c}%.`, `${m.p}% está a la mitad entre ${a}% y ${c}%.`));
    if (m.friendly !== m.b) lines.push(t(`${m.b} is close to ${m.friendly}, a friendly number.`, `${m.b} está cerca de ${m.friendly}, un número fácil.`));
    lines.push(c === undefined ? t(`${a}% of ${m.friendly} = ${m.estimates[0]}, so about ${m.estimates[0]}.`, `${a}% de ${m.friendly} = ${m.estimates[0]}, así que unos ${m.estimates[0]}.`) : t(`${a}% of ${m.friendly} = ${m.estimates[0]} and ${c}% of ${m.friendly} = ${m.estimates[1]}, so between ${m.estimates[0]} and ${m.estimates[1]}.`, `${a}% de ${m.friendly} = ${m.estimates[0]} y ${c}% de ${m.friendly} = ${m.estimates[1]}, así que entre ${m.estimates[0]} y ${m.estimates[1]}.`));
    let s = "";
    let h = 0;
    lines.forEach((l, i) => {
      const b = block(PAD, y + 14 + h, l, { width: avail, weight: i ? 400 : 700, fill: i ? COLOR.ink : COLOR.muted, size: i ? 14 : 13 });
      s += b.svg;
      h += b.h + 2;
    });
    svg += `<g class="pm-final">${s}</g>`;
    y += h + 12;
  }
  const answer = callout({
    x: PAD,
    y,
    w: avail,
    kind: "ok",
    lines: [t(`Discount: ${m.p}% of ${m.b} = ${m.discount.text}`, `Descuento: ${m.p}% de ${m.b} = ${m.discount.text}`), `${m.p}% = ${m.decimal}, ${m.decimal} × ${m.b} = ${m.discount.text}`, t(`Final price: ${m.b} − ${m.discount.text} = ${m.final.text}`, `Precio final: ${m.b} − ${m.discount.text} = ${m.final.text}`)],
  });
  svg += answer.svg;
  y += answer.h;
  if (m.wrong !== null) {
    const c = callout({ x: PAD, y, w: avail, kind: "no", lines: [t(`Not this: ${m.b} − ${m.p} = ${m.wrong}`, `Esto no: ${m.b} − ${m.p} = ${m.wrong}`), t(`${m.p}% off is not ${m.p} off. ${m.p}% of ${m.b} is ${m.discount.text}.`, `${m.p}% de descuento no es ${m.p} menos. ${m.p}% de ${m.b} es ${m.discount.text}.`)] });
    svg += c.svg;
    y += c.h;
  }
  return { body: svg, width: W, height: Math.ceil(y + 4) };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const t = (/** @type {string} */ en, /** @type {string} */ es) => T(lang, en, es);
  const whole = { en: "the whole price", es: "el precio completo" };
  const s = [t(`The tape is the original price, ${m.b}, which is 100%. We build ${m.p}% from benchmark pieces.`, `La cinta es el precio original, ${m.b}, que es 100%. Armamos ${m.p}% con piezas de referencia.`)];
  for (const g of m.groups) s.push(t(`Piece ${g.i + 1}: ${pieceExpr(g)}, ${benchmarkWord("en", g.size, g.count, whole)} of ${m.b}, worth ${g.value}; ${g.to}% is ${g.running} so far.`, `Pieza ${g.i + 1}: ${pieceExpr(g)}, ${benchmarkWord("es", g.size, g.count, whole)} de ${m.b}, vale ${g.value}; ${g.to}% es ${g.running} hasta ahora.`));
  s.push(t(`${m.p}% = ${m.decimal}, and ${m.decimal} × ${m.b} = ${m.discount.text}. The discount is ${m.discount.text}.`, `${m.p}% = ${m.decimal}, y ${m.decimal} × ${m.b} = ${m.discount.text}. El descuento es ${m.discount.text}.`));
  s.push(t(`Final price: ${m.b} − ${m.discount.text} = ${m.final.text}.`, `Precio final: ${m.b} − ${m.discount.text} = ${m.final.text}.`));
  if (m.estimate) {
    const [a, c] = m.near;
    s.push(c === undefined ? t(`Estimate: ${m.p}% is close to ${a}%, and ${m.b} is close to ${m.friendly}, so about ${m.estimates[0]}.`, `Estimación: ${m.p}% está cerca de ${a}%, y ${m.b} está cerca de ${m.friendly}, así que unos ${m.estimates[0]}.`) : t(`Estimate: ${m.p}% is halfway between ${a}% and ${c}%, so the discount is between ${m.estimates[0]} and ${m.estimates[1]}.`, `Estimación: ${m.p}% está a la mitad entre ${a}% y ${c}%, así que el descuento está entre ${m.estimates[0]} y ${m.estimates[1]}.`));
  }
  if (m.wrong !== null) s.push(t(`Not this: ${m.b} − ${m.p} = ${m.wrong}. ${m.p}% off is not ${m.p} off.`, `Esto no: ${m.b} − ${m.p} = ${m.wrong}. ${m.p}% de descuento no es ${m.p} menos.`));
  return s.join(" ");
}

const controls = () => [
  { label: "Percent", labelEs: "Porcentaje", min: 0, max: 100, step: 1 },
  { label: "Whole amount", labelEs: "Cantidad total", min: 1, max: 120, step: 1 },
];

/** @type {import("./mount.mjs").Figure[]} */
export default [
  {
    id: "percent-discount",
    keys: ["percent:discount", "percent:benchmark"],
    title: { en: "Benchmark pieces of the original price", es: "Piezas de referencia del precio original" },
    controls,
    build,
    render,
    scene: (root) => stepScene(root),
    describe,
  },
  {
    id: "percent-tape",
    keys: ["percent:tape"],
    title: { en: "The percent of a number on a tape", es: "El porcentaje de un número en una cinta" },
    controls,
    build,
    render,
    scene: (root) => stepScene(root),
    describe,
  },
];
