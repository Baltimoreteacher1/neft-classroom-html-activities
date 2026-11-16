// Lessons 2-8 and 2-9, mean and mean absolute deviation: the total shared equally is the mean (the balance point), each value's
// distance to the mean is drawn, and the distances are added and shared equally to give the MAD. Everything is exact rational arithmetic.
import { COLOR } from "../tokens.mjs";
import { int } from "../exact.mjs";
import { dataControls, dataModel, eqSign, fmt, joined, nb, headlineOf } from "./data-model.mjs";
import { dotPlot, FADE, f1, GROW, header, meanTriangle, note, num, PAD, para, POP, RISE, SLIDE, sel, stagger, step, T } from "./data-draw.mjs";

const asNumber = (/** @type {import("../exact.mjs").Rat} */ r) => Number(r.n) / Number(r.d);
const GUTTER = 52;

/** Keeping the minus signs: the differences cancel to 0. Null when every value equals the mean (the MAD is 0 anyway). @param {import("./data-model.mjs").DataModel} m @param {"en" | "es"} lang @returns {null | { value: string, say: string }} */
export function signMistake(m, lang) {
  if (m.mad.n === 0n) return null;
  return { value: fmt(m.devs.reduce((t, d) => t.add(d.dev), int(0)).div(int(m.n))), say: lang === "es" ? "Conservó los signos menos, así que las diferencias se cancelan y dan 0." : "Kept the minus signs, so the differences cancel to 0." };
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "data-mean-mad",
  keys: ["data:mean-mad"],
  title: { en: "Mean and MAD: fair share and distances", es: "Media y DAM: reparto justo y distancias" },
  controls: () => dataControls(),
  build: (key, values) => dataModel(key, values),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const maxW = W - 2 * PAD;
    const mean = fmt(m.mean);
    let y = 8;

    // step 1: fair share and balance point
    const h1 = header(W, y, 1, L("The mean is the fair share and the balance point", "La media es el reparto justo y el punto de equilibrio"));
    y += h1.h;
    const tot = para(PAD, y + 8, L(`Total: ${joined(m.sorted)} = ${fmt(m.sum)}`, `Total: ${joined(m.sorted)} = ${fmt(m.sum)}`), { maxW, size: 14, fill: COLOR.ink });
    y += tot.h + 4;
    const share = para(PAD, y + 8, L(`Fair share: ${nb(`${fmt(m.sum)} ÷ ${m.n} ${eqSign(m.mean)} ${mean}`)} each`, `Reparto justo: ${nb(`${fmt(m.sum)} ÷ ${m.n} ${eqSign(m.mean)} ${mean}`)} para cada uno`), { maxW, size: 14, weight: 700, fill: COLOR.ink });
    y += share.h + 8;
    const plot = dotPlot({ W, y, xs: m.sorted, hi: m.axisMax, x0: PAD + GUTTER });
    const xm = plot.sx(asNumber(m.mean));
    const label = L(`mean = ${mean}`, `media = ${mean}`);
    const lw = label.length * 14 * 0.58;
    const lx = Math.max(PAD + lw / 2, Math.min(W - PAD - lw / 2, xm));
    const fulcrum = `<g class="dm-fulcrum" data-dx="${f1(plot.x0 - xm)}">${meanTriangle(xm, plot.axisY + 28)}${T(lx, plot.axisY + 59, label, { size: 14, weight: 700 })}</g>`;
    y = plot.axisY + 76;
    const below = m.devs.filter((d) => d.dev.n < 0n).reduce((s, d) => s.add(d.abs), int(0));
    const above = m.devs.filter((d) => d.dev.n > 0n).reduce((s, d) => s.add(d.abs), int(0));
    const bal = m.absSum.n === 0n ? L(`Every value is ${mean}, so nothing is above or below the mean.`, `Todos los valores son ${mean}, así que nada queda arriba ni abajo de la media.`) : L(`Distances below the mean add to ${fmt(below)}. Distances above add to ${fmt(above)}. It balances.`, `Las distancias por debajo de la media suman ${fmt(below)}. Las de arriba suman ${fmt(above)}. Se equilibra.`);
    const bp = para(PAD, y + 4, bal, { maxW, size: 14, fill: COLOR.ink });
    y += bp.h + 14;
    const s1 = step(1, h1.svg + tot.svg + share.svg + plot.svg + fulcrum + `<g class="dm-read">${bp.svg}</g>`);

    // step 2: distances
    const h2 = header(W, y, 2, L("Distance from the mean: how far each value is", "Distancia a la media: qué tan lejos está cada valor"));
    y += h2.h + 4;
    let rows = T(PAD + GUTTER - 16, y + 12, L("value", "valor"), { size: 13, fill: COLOR.muted, anchor: "end" });
    const top = y + 56;
    const pitch = 30;
    const bottom = top + m.n * pitch - 8;
    rows += `<line x1="${f1(xm)}" y1="${f1(top - 26)}" x2="${f1(xm)}" y2="${f1(bottom + 4)}" stroke="${COLOR.ink}" stroke-width="2" stroke-dasharray="5 3"/>`;
    const lx2 = Math.max(PAD + lw / 2, Math.min(W - PAD - lw / 2, xm));
    rows += T(lx2, top - 32, label, { size: 14, weight: 700 });
    m.devs.forEach((d, i) => {
      const cy = top + i * pitch;
      const vx = plot.sx(asNumber(d.v));
      const toMean = xm > vx;
      const dir = toMean ? 1 : -1;
      rows += `<g class="dm-row" data-i="${i}">${T(PAD + GUTTER - 16, cy + 5, fmt(d.v), { size: 14, weight: 700, anchor: "end" })}<circle cx="${f1(vx)}" cy="${f1(cy)}" r="7" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="2"/></g>`;
      const len = Math.abs(xm - vx);
      let arrow = "";
      if (len > 10) arrow = `<line x1="${f1(vx + dir * 8)}" y1="${f1(cy)}" x2="${f1(xm)}" y2="${f1(cy)}" stroke="${COLOR.ink}" stroke-width="2"/><path d="M${f1(xm - dir * 7)} ${f1(cy - 5)} L${f1(xm)} ${f1(cy)} L${f1(xm - dir * 7)} ${f1(cy + 5)}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
      const dlabel = fmt(d.abs);
      const tw2 = dlabel.length * 13 * 0.58;
      const outer = vx - dir * (11 + tw2 / 2);
      const near = len < 44 && outer - tw2 / 2 > plot.x0 - 4 && outer + tw2 / 2 < W - PAD;
      const lxd = near ? outer : Math.max(PAD + 8, Math.min(W - PAD - 8, (vx + xm) / 2));
      const lyd = near ? cy + 5 : cy - 11;
      rows += `<g class="dm-dist" data-i="${i}" data-origin="${toMean ? "right" : "left"}">${arrow}${T(lxd, lyd, dlabel, { size: 13, weight: 700, halo: true })}</g>`;
    });
    y = bottom + 20;
    const s2 = step(2, h2.svg + rows);

    // step 3: MAD
    const h3 = header(W, y, 3, L("MAD: the mean of the distances", "DAM: la media de las distancias"));
    y += h3.h + 6;
    const add = para(PAD, y + 8, L(`Add the distances: ${joined(m.devs.map((d) => d.abs))} = ${fmt(m.absSum)}`, `Suma las distancias: ${joined(m.devs.map((d) => d.abs))} = ${fmt(m.absSum)}`), { maxW, size: 14, fill: COLOR.ink });
    y += add.h + 10;
    const res = note(W, y, L(`MAD = ${nb(`${fmt(m.absSum)} ÷ ${m.n} ${eqSign(m.mad)} ${fmt(m.mad)}`)}`, `DAM = ${nb(`${fmt(m.absSum)} ÷ ${m.n} ${eqSign(m.mad)} ${fmt(m.mad)}`)}`), "yes", "dm-result");
    y += res.h;
    let cue = "";
    if (signMistake(m, lang)) {
      const c = note(W, y, L(`Not this: keeping the minus signs. −${fmt(below)} + ${fmt(above)} = 0, which says nothing about spread. Use distances.`, `No así: conservar los signos menos. −${fmt(below)} + ${fmt(above)} = 0, y eso no dice nada de la dispersión. Usa distancias.`), "not");
      cue = c.svg;
      y += c.h;
    }
    const s3 = step(3, h3.svg + `<g class="dm-read">${add.svg}</g>${res.svg}${cue}`);
    return { body: s1 + s2 + s3, width: W, height: Math.ceil(y + 6) };
  },
  headline: (m, lang) => headlineOf(m, lang),
  wrong: (m, lang) => signMistake(m, lang),
  scene(root, m) {
    /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
    const tracks = [];
    tracks.push({ els: sel(root, '.dm-step[data-step="1"]'), from: 0, to: 0.05, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='1'] .dm-dot"), 0.03, 0.2, POP);
    for (const el of sel(root, ".dm-fulcrum")) tracks.push({ els: [el], from: 0.2, to: 0.34, keyframes: SLIDE(num(el, "data-dx"), 0, 0.2) });
    tracks.push({ els: sel(root, ".dm-step[data-step='1'] .dm-read"), from: 0.34, to: 0.4, keyframes: RISE });
    tracks.push({ els: sel(root, '.dm-step[data-step="2"]'), from: 0.4, to: 0.44, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-row"), 0.42, 0.62, FADE);
    stagger(tracks, sel(root, ".dm-dist"), 0.46, 0.78, (el) => GROW(el.getAttribute("data-origin") === "right" ? "right center" : "left center"));
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.78, to: 0.82, keyframes: FADE });
    tracks.push({ els: sel(root, ".dm-step[data-step='3'] .dm-read, .dm-result, .dm-note"), from: 0.82, to: 1, keyframes: RISE });
    return { durationMs: 6000 + 150 * m.n, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const mean = fmt(m.mean);
    const ds = joined(m.devs.map((d) => d.abs));
    return es
      ? `Los ${m.n} valores son ${m.sorted.join(", ")}. Total: ${fmt(m.sum)}. Reparto justo: ${fmt(m.sum)} ÷ ${m.n} ${eqSign(m.mean)} ${mean}; la media es también el punto de equilibrio, donde las distancias de abajo y de arriba suman lo mismo. Distancia de cada valor a la media: ${ds}. Suma de las distancias: ${fmt(m.absSum)}. DAM, la media de las distancias: ${fmt(m.absSum)} ÷ ${m.n} ${eqSign(m.mad)} ${fmt(m.mad)}. Las distancias nunca son negativas; si se conservaran los signos, la suma daría 0.`
      : `The ${m.n} values are ${m.sorted.join(", ")}. Total: ${fmt(m.sum)}. Fair share: ${fmt(m.sum)} ÷ ${m.n} ${eqSign(m.mean)} ${mean}; the mean is also the balance point, where the distances below and above add to the same amount. Distance of each value from the mean: ${ds}. Sum of the distances: ${fmt(m.absSum)}. MAD, the mean of the distances: ${fmt(m.absSum)} ÷ ${m.n} ${eqSign(m.mad)} ${fmt(m.mad)}. Distances are never negative; keeping the signs would add to 0.`;
  },
};
