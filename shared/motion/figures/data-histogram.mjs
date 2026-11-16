// Lessons 2-1 and 2-2, statistical questions and histograms: dots on a number line fly into bins of width 5 and stack into bars.
// Bins follow the lab: width 5 from 0, up to the last occupied interval, at least four of them.
import { COLOR } from "../tokens.mjs";
import { dataControls, dataModel, eqSign, fmt, joined, nb, headlineOf } from "./data-model.mjs";
import { bracket, dotPlot, FADE, f1, header, note, num, PAD, para, POP, RISE, SLIDE, sel, stagger, step, T } from "./data-draw.mjs";

/** @param {import("./data-model.mjs").DataModel} m */
export function histogramOf(m) {
  const count = Math.max(4, Math.floor(m.sorted[m.n - 1] / 5) + 1);
  const bins = Array(count).fill(0);
  const binOf = m.sorted.map((v) => Math.floor(v / 5));
  const slot = binOf.map((b) => bins[b]++);
  return { count, bins, binOf, slot };
}

/**
 * The edge mistake the dashed card shows: the smallest positive multiple of 5 is counted in the interval below the one it starts.
 * The wrong result is the frequency that comes out wrong, the lower interval's (too high) or, if that happens to equal the range,
 * the upper interval's (too low). Null when there is no edge value or neither wrong frequency can be told from the range.
 * @param {import("./data-model.mjs").DataModel} m @param {"en" | "es"} lang
 * @returns {null | { edge: number, value: string, say: string }}
 */
export function edgeMistake(m, lang) {
  const edge = m.sorted.find((v) => v > 0 && v % 5 === 0);
  if (edge === undefined) return null;
  const h = histogramOf(m);
  const k = edge / 5;
  const e = m.sorted.filter((v) => v === edge).length;
  const range = fmt(m.range);
  const lower = { text: `${edge - 5}–${edge - 1}`, value: String(h.bins[k - 1] + e) };
  const upper = { text: `${edge}–${edge + 4}`, value: String(h.bins[k] - e) };
  const pick = [lower, upper].find((c) => c.value !== range);
  if (!pick) return null;
  return {
    edge,
    value: pick.value,
    say: lang === "es" ? `Contó el ${edge} en ${edge - 5}–${edge - 1} en vez de en ${edge}–${edge + 4}, así que la frecuencia de ${pick.text} sale mal.` : `Counted ${edge} in ${edge - 5}–${edge - 1} instead of ${edge}–${edge + 4}, so the frequency of ${pick.text} comes out wrong.`,
  };
}

/** @type {import("./mount.mjs").Figure} */
export default {
  // the dashed card is about an interval edge, not about the range this figure asks for, so it is no error to analyse in Challenge
  thinkWrong: false,
  id: "data-histogram",
  keys: ["data:histogram"],
  title: { en: "From data to a histogram", es: "De los datos al histograma" },
  controls: () => dataControls(),
  build: (key, values) => ({ ...dataModel(key, values) }),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const hist = histogramOf(m);
    let y = 8;

    // step 1: dots and the range
    const h1 = header(W, y, 1, L("Each dot is one value, placed on a number line", "Cada punto es un valor, puesto en una recta numérica"));
    y += h1.h;
    const cap1 = para(PAD, y + 8, L("Dashed lines show where each interval of width 5 starts.", "Las líneas punteadas muestran dónde empieza cada intervalo de ancho 5."), { maxW: W - 2 * PAD });
    y += cap1.h + 6;
    const plot = dotPlot({ W, y, xs: m.sorted, hi: hist.count * 5, offset: 0.5, boundaries: true, tickStep: 5, tickMax: hist.count * 5 - 5, r: 5 });
    const lo = m.sorted[0];
    const hiV = m.sorted[m.n - 1];
    const rangeLabel = L(`range = greatest − least = ${hiV} − ${lo} = ${fmt(m.range)}`, `rango = mayor − menor = ${hiV} − ${lo} = ${fmt(m.range)}`);
    const br = bracket(W, plot.sx(lo + 0.5), plot.sx(hiV + 0.5), plot.bottom + 8, rangeLabel, "dm-range");
    y = plot.bottom + 36;
    const s1 = step(1, h1.svg + cap1.svg + plot.svg + br);

    // step 2: bars
    y += 8;
    const h2 = header(W, y, 2, L("Count the values in each interval: each bar is a count", "Cuenta los valores de cada intervalo: cada barra es un conteo"));
    y += h2.h + 4;
    const maxF = Math.max(...hist.bins);
    const u = Math.min(26, 150 / maxF);
    const binW = (W - 2 * PAD) / hist.count;
    const base = y + 22 + maxF * u;
    let bars = `<line x1="${PAD}" y1="${f1(base)}" x2="${W - PAD}" y2="${f1(base)}" stroke="${COLOR.ink}" stroke-width="2"/>`;
    m.sorted.forEach((v, i) => {
      const b = hist.binOf[i];
      const bx = PAD + b * binW;
      const by = base - (hist.slot[i] + 1) * u;
      const dot = plot.pts[i];
      const dx = dot.x - (bx + binW / 2);
      const dy = dot.y - (by + u / 2);
      bars += `<g class="dm-block" data-i="${i}" data-dx="${f1(dx)}" data-dy="${f1(dy)}"><rect x="${f1(bx)}" y="${f1(by)}" width="${f1(binW)}" height="${f1(u)}" fill="${COLOR.teal}" stroke="${COLOR.ink}" stroke-width="1.2"/>${u >= 17 && binW >= 22 ? T(bx + binW / 2, by + u / 2 + 5, String(v), { size: 13, weight: 700 }) : ""}</g>`;
    });
    hist.bins.forEach((c, b) => {
      const cx = PAD + b * binW + binW / 2;
      if (c) bars += `<g class="dm-freq">${T(cx, base - c * u - 5, String(c), { size: 14, weight: 700 })}</g>`;
      const stagger2 = binW < 40 && b % 2 ? 17 : 0;
      bars += T(cx, base + 18 + stagger2, `${b * 5}–${b * 5 + 4}`, { size: 13, fill: COLOR.muted });
    });
    y = base + (binW < 40 ? 62 : 44);
    const cap2 = para(PAD, y, L("Bar height = frequency: how many values are in the interval.", "Altura de la barra = frecuencia: cuántos valores hay en el intervalo."), { maxW: W - 2 * PAD });
    y += cap2.h + 10;
    const s2 = step(2, h2.svg + bars + cap2.svg);

    // step 3: check and read
    const h3 = header(W, y, 3, L("Check the bars, then read the data", "Revisa las barras y lee los datos"));
    y += h3.h + 6;
    const nz = hist.bins.filter((c) => c > 0);
    const sum = para(PAD, y + 8, L(`The bar heights add up to the number of values: ${nb(joined(nz))} = ${m.n}.`, `Las alturas de las barras suman la cantidad de valores: ${nb(joined(nz))} = ${m.n}.`), { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink });
    y += sum.h + 8;
    const same = m.range.n === 0n;
    const vary = para(
      PAD,
      y + 8,
      same
        ? L(`Every value is ${lo}, so the range is 0 and the data do not vary. A question with one fixed answer gives data like this.`, `Todos los valores son ${lo}, así que el rango es 0 y los datos no varían. Una pregunta con una sola respuesta fija da datos así.`)
        : L(`The values differ: the range is ${fmt(m.range)}. A statistical question expects answers that vary like this.`, `Los valores son distintos: el rango es ${fmt(m.range)}. Una pregunta estadística espera respuestas que varían así.`),
      { maxW: W - 2 * PAD, size: 14, fill: COLOR.ink },
    );
    y += vary.h + 8;
    let cue = "";
    const mistake = edgeMistake(m, lang);
    if (mistake) {
      const edge = mistake.edge;
      const c = note(W, y, L(`Not this: ${edge} is not in ${edge - 5}–${edge - 1}. A value on an edge starts the next interval, ${edge}–${edge + 4}.`, `No así: el ${edge} no está en ${edge - 5}–${edge - 1}. Un valor en el borde empieza el intervalo siguiente, ${edge}–${edge + 4}.`), "not");
      cue = c.svg;
      y += c.h;
    }
    const s3 = step(3, h3.svg + `<g class="dm-read">${sum.svg}${vary.svg}</g>${cue}`);
    return { body: s1 + s2 + s3, width: W, height: Math.ceil(y + 6) };
  },
  headline: (m, lang) => headlineOf(m, lang),
  wrong: (m, lang) => edgeMistake(m, lang),
  scene(root, m) {
    /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
    const tracks = [];
    tracks.push({ els: sel(root, '.dm-step[data-step="1"]'), from: 0, to: 0.08, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='1'] .dm-dot"), 0.04, 0.26, POP);
    tracks.push({ els: sel(root, ".dm-range"), from: 0.26, to: 0.34, keyframes: FADE });
    tracks.push({ els: sel(root, '.dm-step[data-step="2"]'), from: 0.34, to: 0.4, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-block"), 0.4, 0.8, (el) => SLIDE(num(el, "data-dx"), num(el, "data-dy"), 0.4));
    stagger(tracks, sel(root, ".dm-freq"), 0.78, 0.88, RISE);
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.88, to: 0.94, keyframes: FADE });
    tracks.push({ els: sel(root, ".dm-read, .dm-note"), from: 0.9, to: 1, keyframes: RISE });
    return { durationMs: 6000 + 150 * m.n, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const h = histogramOf(m);
    const rows = h.bins.map((c, b) => (c ? `${b * 5}–${b * 5 + 4}: ${c}` : "")).filter(Boolean).join("; ");
    const sorted = m.sorted.join(", ");
    return es
      ? `Los ${m.n} valores, en orden: ${sorted}. Cada punto es un valor. Mayor − menor: rango ${eqSign(m.range)} ${fmt(m.range)}. Se agrupan en intervalos de ancho 5 y cada barra es un conteo, la frecuencia. Intervalos con valores y su frecuencia: ${rows}. Las alturas de las barras suman ${m.n}. Un valor en el borde de un intervalo empieza el intervalo siguiente.`
      : `The ${m.n} values, in order: ${sorted}. Each dot is one value. Greatest − least: range ${eqSign(m.range)} ${fmt(m.range)}. They are grouped into intervals of width 5 and each bar is a count, the frequency. Intervals with values and their frequency: ${rows}. The bar heights add up to ${m.n}. A value on the edge of an interval starts the next interval.`;
  },
};
