// Lesson 2-5, range and interquartile range: the five numbers, then the range as the whole span and the IQR as the box,
// and the identity range = left whisker + box + right whisker. Quartiles follow the lab's median-of-halves rule.
import { COLOR } from "../tokens.mjs";
import { fiveNumbers } from "./data-box.mjs";
import { dataControls, dataModel, eqSign, fmt, joined } from "./data-model.mjs";
import { boxStrip, bracket, dotPlot, FADE, fiveTable, f1, GROW, header, note, PAD, para, POP, RISE, sel, stagger, step } from "./data-draw.mjs";

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "data-spread",
  keys: ["data:spread"],
  title: { en: "Range and IQR: two ways to measure spread", es: "Rango y RIC: dos formas de medir la dispersión" },
  controls: () => dataControls(),
  build: (key, values) => dataModel(key, values),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const nums = fiveNumbers(m);
    const num = (/** @type {import("../exact.mjs").Rat} */ r) => Number(r.n) / Number(r.d);
    let y = 8;

    const h1 = header(W, y, 1, L("Find the five numbers", "Halla los cinco números"));
    y += h1.h;
    const plot = dotPlot({ W, y, xs: m.sorted, hi: m.axisMax });
    const strip = boxStrip({ y: plot.bottom + 4, sx: plot.sx, nums });
    const table = fiveTable({ W, y: strip.bottom + 26, plotBottom: strip.bottom, sx: plot.sx, nums, lang });
    y = table.bottom + 14;
    const s1 = step(1, h1.svg + plot.svg + strip.svg + table.svg);

    /** One measure: a ghost strip, guide lines and a bracket over [a, b]. */
    const measure = (/** @type {number} */ n, /** @type {string} */ title, /** @type {import("../exact.mjs").Rat} */ a, /** @type {import("../exact.mjs").Rat} */ b, /** @type {string} */ label) => {
      const h = header(W, y, n, title);
      y += h.h;
      const st = boxStrip({ y, sx: plot.sx, nums, cls: "dm-ghost" });
      const by = st.bottom + 22;
      let g = "";
      for (const r of [a, b]) g += `<line x1="${f1(plot.sx(num(r)))}" y1="${f1(st.bottom - 4)}" x2="${f1(plot.sx(num(r)))}" y2="${f1(by - 6)}" stroke="${COLOR.muted}" stroke-width="1" stroke-dasharray="3 3"/>`;
      const br = bracket(W, plot.sx(num(a)), plot.sx(num(b)), by, label, "dm-span");
      y = by + 30;
      return h.svg + st.svg + g + br;
    };
    const rangeLabel = L(`range = greatest − least = ${fmt(m.max)} − ${fmt(m.min)} = ${fmt(m.range)}`, `rango = mayor − menor = ${fmt(m.max)} − ${fmt(m.min)} = ${fmt(m.range)}`);
    const iqrLabel = L(`IQR = Q3 − Q1 = ${fmt(m.q3.value)} − ${fmt(m.q1.value)} = ${fmt(m.iqr)}`, `RIC = Q3 − Q1 = ${fmt(m.q3.value)} − ${fmt(m.q1.value)} = ${fmt(m.iqr)}`);
    const s2 = step(2, measure(2, L("Range: the whole span, least to greatest", "Rango: toda la extensión, del menor al mayor"), m.min, m.max, rangeLabel));
    y += 4;
    let s3svg = measure(3, L("IQR: the middle half, Q1 to Q3", "RIC: la mitad central, de Q1 a Q3"), m.q1.value, m.q3.value, iqrLabel);
    const left = m.q1.value.sub(m.min);
    const right = m.max.sub(m.q3.value);
    const parts = [left, m.iqr, right];
    const p = para(PAD, y + 12, L(`Range = left whisker + box + right whisker: ${joined(parts)} = ${fmt(m.range)}.`, `Rango = bigote izquierdo + caja + bigote derecho: ${joined(parts)} = ${fmt(m.range)}.`), { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink });
    y += p.h + 10;
    s3svg += `<g class="dm-read">${p.svg}</g>`;
    let cue = "";
    if (m.range.n !== m.iqr.n || m.range.d !== m.iqr.d) {
      const c = note(W, y, L(`Not this: ${fmt(m.max)} − ${fmt(m.min)} = ${fmt(m.range)} uses the two ends. That is the range. The IQR uses Q1 and Q3.`, `No así: ${fmt(m.max)} − ${fmt(m.min)} = ${fmt(m.range)} usa los dos extremos. Eso es el rango. El RIC usa Q1 y Q3.`), "not");
      cue = c.svg;
      y += c.h;
    }
    return { body: s1 + s2 + step(3, s3svg) + cue, width: W, height: Math.ceil(y + 6) };
  },
  scene(root) {
    /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
    const tracks = [];
    tracks.push({ els: sel(root, '.dm-step[data-step="1"]'), from: 0, to: 0.06, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='1'] .dm-dot"), 0.04, 0.2, POP);
    for (let k = 0; k < 5; k++) tracks.push({ els: sel(root, `.dm-five[data-k="${k}"]`), from: 0.2 + k * 0.07, to: 0.2 + k * 0.07 + 0.08, keyframes: FADE });
    tracks.push({ els: sel(root, '.dm-step[data-step="2"]'), from: 0.56, to: 0.62, keyframes: FADE });
    tracks.push({ els: sel(root, '.dm-step[data-step="2"] .dm-span'), from: 0.6, to: 0.74, keyframes: GROW("center") });
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.74, to: 0.8, keyframes: FADE });
    tracks.push({ els: sel(root, '.dm-step[data-step="3"] .dm-span'), from: 0.78, to: 0.9, keyframes: GROW("center") });
    tracks.push({ els: sel(root, ".dm-read, .dm-note"), from: 0.9, to: 1, keyframes: RISE });
    return { durationMs: 7200, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const [mn, q1, md, q3, mx] = fiveNumbers(m).map(fmt);
    const parts = joined([m.q1.value.sub(m.min), m.iqr, m.max.sub(m.q3.value)]);
    return es
      ? `Los cinco números: mínimo ${mn}, Q1 ${q1}, mediana ${md}, Q3 ${q3}, máximo ${mx}. El rango usa los dos extremos: ${mx} − ${mn} ${eqSign(m.range)} ${fmt(m.range)}. El RIC usa la caja, la mitad central: ${q3} − ${q1} ${eqSign(m.iqr)} ${fmt(m.iqr)}. El rango es el bigote izquierdo más la caja más el bigote derecho: ${parts} = ${fmt(m.range)}.`
      : `The five numbers: minimum ${mn}, Q1 ${q1}, median ${md}, Q3 ${q3}, maximum ${mx}. The range uses the two ends: ${mx} − ${mn} ${eqSign(m.range)} ${fmt(m.range)}. The IQR uses the box, the middle half: ${q3} − ${q1} ${eqSign(m.iqr)} ${fmt(m.iqr)}. The range is the left whisker plus the box plus the right whisker: ${parts} = ${fmt(m.range)}.`;
  },
};
