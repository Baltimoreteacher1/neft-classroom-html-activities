// Lesson 2-10, choose appropriate measures: the value farthest from the middle is pulled in next to its neighbor, and the mean and the
// median each show how they react. The mean and median markers slide to their new places; the median usually stays put.
import { COLOR } from "../tokens.mjs";
import { cmp, dataControls, dataModel, eqSign, fmt, abs, nb, headlineOf } from "./data-model.mjs";
import { dotPlot, FADE, f1, header, meanTriangle, note, num, PAD, para, POP, RISE, SLIDE, sel, stagger, step, T } from "./data-draw.mjs";

const asNumber = (/** @type {import("../exact.mjs").Rat} */ r) => Number(r.n) / Number(r.d);

/**
 * The value farthest from the median (the larger one on a tie) and the neighbor it moves next to. Everything else is recomputed exactly.
 * @param {import("./data-model.mjs").DataModel} m
 */
export function pullIn(m) {
  let idx = 0;
  let best = abs(m.R[0].sub(m.median.value));
  for (let j = 1; j < m.n; j++) {
    const d = abs(m.R[j].sub(m.median.value));
    if (cmp(d, best) >= 0) {
      idx = j;
      best = d;
    }
  }
  const nb2 = idx === m.n - 1 ? idx - 1 : idx + 1;
  const moved = [...m.sorted];
  moved[idx] = m.sorted[nb2];
  return { idx, from: m.sorted[idx], to: m.sorted[nb2], after: dataModel(m.key, moved) };
}

/** Using the mean as the middle; shown only when the mean is not the median and not a true middle (half the values below it). @param {import("./data-model.mjs").DataModel} m @param {"en" | "es"} lang @returns {null | { value: string, say: string, below: number }} */
export function meanMistake(m, lang) {
  const below = m.R.filter((x) => cmp(x, m.mean) < 0).length;
  if (cmp(m.mean, m.median.value) === 0 || below * 2 === m.n) return null;
  return { value: fmt(m.mean), below, say: lang === "es" ? "Usó la media como el valor del medio, aunque un valor atípico la jala." : "Used the mean as the middle value, even though an unusual value pulls it." };
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "data-outlier",
  keys: ["data:outlier"],
  title: { en: "How the mean and median react to an unusual value", es: "Cómo reaccionan la media y la mediana a un valor atípico" },
  controls: () => dataControls(),
  build: (key, values) => dataModel(key, values),
  render(m, { lang, width }) {
    const W = Math.max(300, Math.min(900, Math.round(width)));
    const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
    const maxW = W - 2 * PAD;
    const pull = pullIn(m);
    const m2 = pull.after;
    const changedValue = pull.from !== pull.to;
    const meanMoved = cmp(m.mean, m2.mean) !== 0;
    const medMoved = cmp(m.median.value, m2.median.value) !== 0;
    let y = 8;
    const clamp = (/** @type {number} */ x, /** @type {string} */ s) => {
      const hw = (s.length * 14 * 0.58) / 2;
      return Math.max(PAD + hw, Math.min(W - PAD - hw, x));
    };

    /** One dot plot with the median line above and the mean triangle below. */
    const panel = (/** @type {import("./data-model.mjs").DataModel} */ d, /** @type {number} */ top, /** @type {boolean} */ ghosts) => {
      const plot = dotPlot({ W, y: top, xs: d.sorted, hi: m.axisMax, top: 26 });
      const xmed = plot.sx(asNumber(d.median.value));
      const xmean = plot.sx(asNumber(d.mean));
      const ml = L(`median = ${fmt(d.median.value)}`, `mediana = ${fmt(d.median.value)}`);
      const al = L(`mean = ${fmt(d.mean)}`, `media = ${fmt(d.mean)}`);
      let svg = plot.svg;
      let ghostSvg = "";
      if (ghosts && medMoved) ghostSvg += `<line x1="${f1(plot.sx(asNumber(m.median.value)))}" y1="${f1(top + 22)}" x2="${f1(plot.sx(asNumber(m.median.value)))}" y2="${f1(plot.axisY)}" stroke="${COLOR.ink}" stroke-width="2" stroke-dasharray="2 3"/>`;
      if (ghosts && meanMoved) ghostSvg += meanTriangle(plot.sx(asNumber(m.mean)), plot.axisY + 28, true);
      svg += `<line x1="${f1(xmed)}" y1="${f1(top + 22)}" x2="${f1(xmed)}" y2="${f1(plot.axisY)}" stroke="${COLOR.ink}" stroke-width="3" stroke-dasharray="6 3"/>${T(clamp(xmed, ml), top + 16, ml, { size: 14, weight: 700 })}`;
      svg += `<g class="dm-meanmark" data-dx="${f1(plot.sx(asNumber(m.mean)) - xmean)}">${meanTriangle(xmean, plot.axisY + 28)}${T(clamp(xmean, al), plot.axisY + 59, al, { size: 14, weight: 700 })}</g>`;
      return { plot, svg, ghostSvg, bottom: plot.axisY + 68 };
    };

    const h1 = header(W, y, 1, L("The data as given: mean and median", "Los datos tal como están: media y mediana"));
    y += h1.h;
    const p1 = panel(m, y, false);
    y = p1.bottom + 4;
    const s1 = step(1, h1.svg + p1.svg.replace('class="dm-meanmark"', 'class="dm-mean1"'));

    const h2 = header(W, y, 2, L("Pull the farthest value in next to its neighbor", "Acerca el valor más lejano a su vecino"));
    y += h2.h;
    const cap = para(PAD, y + 8, L("Dashed shapes show where they were.", "Las formas punteadas muestran dónde estaban."), { maxW });
    y += cap.h + 4;
    const p2 = panel(m2, y, true);
    let svg2 = p2.svg;
    let moveSvg = "";
    if (changedValue) {
      const old = p1.plot.pts[pull.idx];
      const nw = p2.plot.pts[pull.idx];
      const oy = old.y - p1.plot.axisY + p2.plot.axisY;
      const dx = old.x - nw.x;
      const dy = oy - nw.y;
      const ang = Math.atan2(nw.y - oy, nw.x - old.x);
      const r = p2.plot.r;
      const sx0 = old.x + Math.cos(ang) * (r + 2);
      const sy0 = oy + Math.sin(ang) * (r + 2);
      const ex = nw.x - Math.cos(ang) * (r + 3);
      const ey = nw.y - Math.sin(ang) * (r + 3);
      const hd = (/** @type {number} */ a) => `${f1(ex - Math.cos(ang + a) * 8)} ${f1(ey - Math.sin(ang + a) * 8)}`;
      moveSvg = `<g class="dm-ghostmark"><circle cx="${f1(old.x)}" cy="${f1(oy)}" r="${r}" fill="none" stroke="${COLOR.ink}" stroke-width="1.8" stroke-dasharray="3 2.5"/><line x1="${f1(sx0)}" y1="${f1(sy0)}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${COLOR.ink}" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M${hd(0.5)} L${f1(ex)} ${f1(ey)} L${hd(-0.5)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.8"/></g>`;
      svg2 = svg2.replace(`<g class="dm-dot" data-i="${pull.idx}">`, `<g class="dm-dot dm-moved" data-i="${pull.idx}" data-dx="${f1(dx)}" data-dy="${f1(dy)}">`);
    }
    y = p2.bottom + 4;
    const s2 = step(2, h2.svg + cap.svg + svg2.replace('class="dm-meanmark"', 'class="dm-mean2"') + `<g class="dm-ghostmark">${p2.ghostSvg}</g>${moveSvg}`);

    const h3 = header(W, y, 3, L("What moved?", "¿Qué se movió?"));
    y += h3.h + 6;
    const shift = abs(m.mean.sub(m2.mean));
    const lines = [
      L(`Mean: ${fmt(m.mean)} → ${fmt(m2.mean)}. ${meanMoved ? `It moved ${fmt(shift)}.` : "It did not move."}`, `Media: ${fmt(m.mean)} → ${fmt(m2.mean)}. ${meanMoved ? `Se movió ${fmt(shift)}.` : "No se movió."}`),
      L(`Median: ${fmt(m.median.value)} → ${fmt(m2.median.value)}. ${medMoved ? `It moved ${fmt(abs(m.median.value.sub(m2.median.value)))}.` : "It did not move."}`, `Mediana: ${fmt(m.median.value)} → ${fmt(m2.median.value)}. ${medMoved ? `Se movió ${fmt(abs(m.median.value.sub(m2.median.value)))}.` : "No se movió."}`),
    ];
    let txt = "";
    for (const ln of lines) {
      const p = para(PAD, y + 8, ln, { maxW, size: 14, weight: 700, fill: COLOR.ink });
      txt += p.svg;
      y += p.h + 4;
    }
    /** @type {string[]} */
    const why = [];
    if (!changedValue) why.push(L(`The farthest value, ${pull.from}, already sits next to its neighbor, so nothing moves.`, `El valor más lejano, ${pull.from}, ya está junto a su vecino, así que nada se mueve.`));
    else {
      const a = Math.max(pull.from, pull.to);
      const b = Math.min(pull.from, pull.to);
      if (meanMoved) why.push(L(`The mean adds every value, so one far value pulls it: ${nb(`(${a} − ${b}) ÷ ${m.n} ${eqSign(shift)} ${fmt(shift)}`)}.`, `La media suma todos los valores, así que un valor lejano la jala: ${nb(`(${a} − ${b}) ÷ ${m.n} ${eqSign(shift)} ${fmt(shift)}`)}.`));
      if (!medMoved) why.push(L("The median only needs the middle of the ordered list, so a far value does not pull it.", "La mediana solo necesita el medio de la lista ordenada, así que un valor lejano no la jala."));
    }
    for (const w of why) {
      const p = para(PAD, y + 8, w, { maxW, size: 14, fill: COLOR.ink });
      txt += p.svg;
      y += p.h + 4;
    }
    y += 6;
    let cue = "";
    const mm = meanMistake(m, lang);
    if (mm) {
      const below = mm.below;
      const c = note(W, y, L(`Not this: the mean is not the middle. ${below} of ${m.n} values are less than the mean, ${fmt(m.mean)}.`, `No así: la media no es el medio. ${below} de ${m.n} valores son menores que la media, ${fmt(m.mean)}.`), "not");
      cue = c.svg;
      y += c.h;
    }
    const s3 = step(3, h3.svg + `<g class="dm-read">${txt}</g>${cue}`);
    return { body: s1 + s2 + s3, width: W, height: Math.ceil(y + 6) };
  },
  headline: (m, lang) => headlineOf(m, lang),
  wrong: (m, lang) => meanMistake(m, lang),
  scene(root, m) {
    /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
    const tracks = [];
    tracks.push({ els: sel(root, '.dm-step[data-step="1"]'), from: 0, to: 0.06, keyframes: FADE });
    stagger(tracks, sel(root, ".dm-step[data-step='1'] .dm-dot"), 0.04, 0.22, POP);
    tracks.push({ els: sel(root, '.dm-step[data-step="2"]'), from: 0.3, to: 0.36, keyframes: FADE });
    for (const el of sel(root, ".dm-moved")) tracks.push({ els: [el], from: 0.44, to: 0.7, keyframes: SLIDE(num(el, "data-dx"), num(el, "data-dy"), 0.6) });
    for (const el of sel(root, ".dm-mean2")) tracks.push({ els: [el], from: 0.44, to: 0.74, keyframes: SLIDE(num(el, "data-dx"), 0, 0.6) });
    tracks.push({ els: sel(root, ".dm-ghostmark"), from: 0.7, to: 0.8, keyframes: FADE });
    tracks.push({ els: sel(root, '.dm-step[data-step="3"]'), from: 0.8, to: 0.85, keyframes: FADE });
    tracks.push({ els: sel(root, ".dm-read, .dm-note"), from: 0.85, to: 1, keyframes: RISE });
    return { durationMs: 6500 + 100 * m.n, tracks };
  },
  describe(m, lang) {
    const es = lang === "es";
    const p = pullIn(m);
    const m2 = p.after;
    const sh = fmt(abs(m.mean.sub(m2.mean)));
    return es
      ? `Los ${m.n} valores son ${m.sorted.join(", ")}. Media ${eqSign(m.mean)} ${fmt(m.mean)} y mediana ${fmt(m.median.value)}. Se acerca el valor más lejano de la mediana, ${p.from}, junto a su vecino, ${p.to}. Ahora la media ${eqSign(m2.mean)} ${fmt(m2.mean)} y la mediana ${fmt(m2.median.value)}. La media se movió ${sh}; la mediana se movió ${fmt(abs(m.median.value.sub(m2.median.value)))}. La media usa todos los valores, por eso un valor lejano la jala; la mediana depende del medio de la lista ordenada.`
      : `The ${m.n} values are ${m.sorted.join(", ")}. The mean ${eqSign(m.mean)} ${fmt(m.mean)} and the median is ${fmt(m.median.value)}. The value farthest from the middle, ${p.from}, is pulled in next to its neighbor, ${p.to}. Now the mean ${eqSign(m2.mean)} ${fmt(m2.mean)} and the median is ${fmt(m2.median.value)}. The mean moved ${sh}; the median moved ${fmt(abs(m.median.value.sub(m2.median.value)))}. The mean uses every value, so one far value pulls it; the median depends on the middle of the ordered list.`;
  },
};
