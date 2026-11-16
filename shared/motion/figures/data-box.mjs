// Lesson 2-4, box plot: order the values, find the median, split into halves for Q1 and Q3, then draw the five-number summary.
// Quartiles follow the lab: the median of each half, the middle value left out of both halves when the count is odd.
import { COLOR } from "../tokens.mjs";
import { cardPanels, cardTracks, cardWords, middleMistake } from "./data-cards.mjs";
import { dataControls, dataModel, fmt, list, nb, headlineOf } from "./data-model.mjs";
import { boxStrip, bracket, dotPlot, FADE, fiveTable, f1, header, PAD, para, POP, sel, stagger, step, T } from "./data-draw.mjs";
import { cardGeometry } from "./data-cards.mjs";

/** @param {import("./data-model.mjs").DataModel} m */
export const fiveNumbers = (m) => [m.min, m.q1.value, m.median.value, m.q3.value, m.max];

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "data-box-plot",
  keys: ["data:box"],
  title: { en: "Build a box plot from the data", es: "Construye un diagrama de caja con los datos" },
  controls: () => dataControls(),
  build: (key, values) => dataModel(key, values),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const cards = cardPanels({ W, y: 8, m, lang, s: 1 });
    let y = cards.bottom + 8;

    // step 3: the halves
    const h3 = header(W, y, 3, L("Split into halves: Q1 and Q3 are the medians of the halves", "Divide en mitades: Q1 y Q3 son las medianas de cada mitad"));
    y += h3.h + 4;
    const { pitch, x0, w, h } = cardGeometry(W, m.n);
    const half = Math.floor(m.n / 2);
    let row = "";
    m.sorted.forEach((v, j) => {
      const low = j < half;
      const up = j >= m.n - half;
      const fill = low ? `fill="${COLOR.teal}" fill-opacity="0.3"` : up ? `fill="${COLOR.amber}" fill-opacity="0.5"` : `fill="${COLOR.white}"`;
      row += `<rect x="${f1(x0 + j * pitch + 2)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="4" ${fill} stroke="${COLOR.ink}" stroke-width="1.5"${up ? ' stroke-dasharray="4 2.5"' : ""}/>${T(x0 + j * pitch + pitch / 2, y + 21, String(v), { size: 14, weight: low || up ? 700 : 400, fill: low || up ? COLOR.ink : COLOR.muted })}`;
    });
    row += bracket(W, x0 + 3, x0 + half * pitch - 3, y + h + 8, "Q1") + bracket(W, x0 + (m.n - half) * pitch + 3, x0 + m.n * pitch - 3, y + h + 8, "Q3");
    y += h + 40;
    const q1 = para(PAD, y + 4, L(`Lower half: ${list(m.lower)}. ${nb(`Q1 = ${m.q1.expr}`)}`, `Mitad inferior: ${list(m.lower)}. ${nb(`Q1 = ${m.q1.expr}`)}`), { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink });
    y += q1.h + 4;
    const q3 = para(PAD, y + 4, L(`Upper half: ${list(m.upper)}. ${nb(`Q3 = ${m.q3.expr}`)}`, `Mitad superior: ${list(m.upper)}. ${nb(`Q3 = ${m.q3.expr}`)}`), { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink });
    y += q3.h + 4;
    let odd = "";
    if (m.n % 2) {
      const o = para(PAD, y + 4, L("The middle value is left out of both halves.", "El valor del medio no entra en ninguna mitad."), { maxW: W - 2 * PAD });
      odd = o.svg;
      y += o.h + 4;
    }
    const s3 = step(3, h3.svg + `<g class="dm-half">${row}</g><g class="dm-half">${q1.svg}${q3.svg}${odd}</g>`);
    y += 10;

    // step 4: the box plot
    const h4 = header(W, y, 4, L("Draw the box plot from the five numbers", "Dibuja el diagrama de caja con los cinco números"));
    y += h4.h;
    const plot = dotPlot({ W, y, xs: m.sorted, hi: m.axisMax });
    const strip = boxStrip({ y: plot.bottom + 4, sx: plot.sx, nums: fiveNumbers(m) });
    const table = fiveTable({ W, y: strip.bottom + 26, plotBottom: strip.bottom, sx: plot.sx, nums: fiveNumbers(m), lang });
    y = table.bottom + 8;
    const cap = para(PAD, y + 4, L("Dots: every value. Box: Q1 to Q3, the middle half. Thick line: the median.", "Puntos: cada valor. Caja: de Q1 a Q3, la mitad central. Línea gruesa: la mediana."), { maxW: W - 2 * PAD });
    y += cap.h + 12;
    const s4 = step(4, h4.svg + plot.svg + strip.svg + table.svg + `<g class="dm-cap">${cap.svg}</g>`);
    return { body: cards.svg + s3 + s4, width: W, height: Math.ceil(y) };
  },
  headline: (m, lang) => headlineOf(m, lang),
  wrong: (m, lang) => middleMistake(m, lang),
  scene(root) {
    const tracks = cardTracks(root, 1, 0, 0.4);
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.4, to: 0.45, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-half"), 0.43, 0.56, FADE, 1);
    tracks.push({ els: sel(root, '.dm-step[data-step="4"]'), from: 0.56, to: 0.6, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='4'] .dm-dot"), 0.58, 0.68, POP);
    for (let k = 0; k < 5; k++) tracks.push({ els: sel(root, `.dm-five[data-k="${k}"]`), from: 0.68 + k * 0.06, to: 0.68 + k * 0.06 + 0.07, keyframes: FADE });
    tracks.push({ els: sel(root, ".dm-cap"), from: 0.95, to: 1, keyframes: FADE });
    return { durationMs: 9000, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const [mn, q1, md, q3, mx] = fiveNumbers(m).map(fmt);
    return es
      ? `${cardWords(m, lang)} Se dividen los valores en dos mitades. Mitad inferior: ${list(m.lower)}; Q1 = ${m.q1.expr}. Mitad superior: ${list(m.upper)}; Q3 = ${m.q3.expr}. Resumen de cinco números: mínimo ${mn}, Q1 ${q1}, mediana ${md}, Q3 ${q3}, máximo ${mx}. El diagrama de caja tiene la caja de Q1 a Q3, una línea en la mediana y bigotes hasta el mínimo y el máximo.`
      : `${cardWords(m, lang)} The ordered values are split into two halves. Lower half: ${list(m.lower)}; Q1 = ${m.q1.expr}. Upper half: ${list(m.upper)}; Q3 = ${m.q3.expr}. Five-number summary: minimum ${mn}, Q1 ${q1}, median ${md}, Q3 ${q3}, maximum ${mx}. The box plot has its box from Q1 to Q3, a line at the median, and whiskers out to the minimum and the maximum.`;
  },
};
