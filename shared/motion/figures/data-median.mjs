// Lesson 2-3, describe the data using the median: the values slide into order, are crossed off in pairs from both ends until the
// middle is left, and the median is marked on the number line. Key: data:median (the Practice bench's ordered dot plot).
import { COLOR } from "../tokens.mjs";
import { cardTracks, cardPanels, cardWords } from "./data-cards.mjs";
import { cmp, dataControls, dataModel, fmt } from "./data-model.mjs";
import { f1, FADE, header, num, PAD, para, POP, SLIDE, sel, stagger, step, T } from "./data-draw.mjs";
import { dotPlot } from "./data-draw.mjs";

/** @param {import("./data-model.mjs").DataModel} m @param {"en" | "es"} lang */
function counts(m, lang) {
  const lt = m.R.filter((x) => cmp(x, m.median.value) < 0).length;
  const gt = m.R.filter((x) => cmp(x, m.median.value) > 0).length;
  const eq = m.n - lt - gt;
  const v = fmt(m.median.value);
  return lang === "es" ? `Menores que ${v}: ${lt}. Mayores que ${v}: ${gt}.${eq ? ` Iguales a ${v}: ${eq}.` : ""}` : `Less than ${v}: ${lt}. Greater than ${v}: ${gt}.${eq ? ` Equal to ${v}: ${eq}.` : ""}`;
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "data-median",
  keys: ["data:median"],
  title: { en: "Find the median by counting in", es: "Halla la mediana contando hacia adentro" },
  controls: () => dataControls(),
  build: (key, values) => dataModel(key, values),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const cards = cardPanels({ W, y: 8, m, lang, s: 1 });
    let y = cards.bottom + 8;
    const h3 = header(W, y, 3, L("See the median on the number line", "Mira la mediana en la recta numérica"));
    y += h3.h;
    const plot = dotPlot({ W, y, xs: m.sorted, hi: m.axisMax, top: 26 });
    const xm = plot.sx(Number(m.median.value.n) / Number(m.median.value.d));
    const label = L(`median = ${fmt(m.median.value)}`, `mediana = ${fmt(m.median.value)}`);
    const lw = label.length * 14 * 0.58;
    const lx = Math.max(PAD + lw / 2, Math.min(W - PAD - lw / 2, xm));
    const mark = `<g class="dm-median" data-dx="${f1(plot.x0 - xm)}"><line x1="${f1(xm)}" y1="${f1(y + 22)}" x2="${f1(xm)}" y2="${f1(plot.axisY)}" stroke="${COLOR.ink}" stroke-width="3" stroke-dasharray="6 3"/>${T(lx, y + 16, label, { size: 14, weight: 700 })}</g>`;
    y = plot.bottom + 8;
    const p = para(PAD, y + 8, counts(m, lang), { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink });
    y += p.h + 12;
    const body = cards.svg + step(3, h3.svg + plot.svg + mark + `<g class="dm-count">${p.svg}</g>`);
    return { body, width: W, height: Math.ceil(y) };
  },
  scene(root, m) {
    /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
    const tracks = cardTracks(root, 1, 0, 0.62);
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.62, to: 0.7, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='3'] .dm-dot"), 0.64, 0.84, POP);
    for (const el of sel(root, ".dm-median")) tracks.push({ els: [el], from: 0.82, to: 0.96, keyframes: SLIDE(num(el, "data-dx"), 0, 0.3) });
    tracks.push({ els: sel(root, ".dm-count"), from: 0.94, to: 1, keyframes: FADE });
    return { durationMs: 6400 + 200 * m.n, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const v = fmt(m.median.value);
    const lt = counts(m, lang);
    return es ? `${cardWords(m, lang)} En la recta numérica, la mediana ${v} marca el centro de los datos. ${lt}` : `${cardWords(m, lang)} On the number line the median, ${v}, marks the middle of the data. ${lt}`;
  },
};
