// The "order the values, then count in from both ends" panels, shared by the median figure (2-3) and the box plot figure (2-4).
// Two rows of value cards: the first slides the values into order, the second crosses them off in pairs until the middle is left.
import { int } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { cmp, eqSign, fmt, list, nb } from "./data-model.mjs";
import { f1, header, note, num, PAD, para, SLIDE, sel, stagger, step, T, FADE, RISE, POP } from "./data-draw.mjs";

/** @typedef {import("./data-model.mjs").DataModel} DataModel */

/** @param {number} W @param {number} n */
export const cardGeometry = (W, n) => {
  const pitch = Math.min(54, (W - 2 * PAD) / n);
  return { pitch, x0: (W - n * pitch) / 2, w: pitch - 4, h: 30 };
};

/** Where the as-given middle of the list sits: a value, or the mean of the two middle entries. @param {DataModel} m */
export function enteredMiddle(m) {
  const v = m.values;
  const n = m.n;
  if (n % 2) return { text: String(v[(n - 1) / 2]), value: int(v[(n - 1) / 2]), two: false };
  const a = v[n / 2 - 1];
  const b = v[n / 2];
  return { text: `${a} / ${b}`, a, b, value: int(a).add(int(b)).div(int(2)), two: true };
}

/**
 * Steps `s` (order) and `s + 1` (count in). Returns the SVG and the y below the last thing drawn.
 * @param {{ W: number, y: number, m: DataModel, lang: "en" | "es", s: number, cue?: boolean }} o
 */
export function cardPanels({ W, y, m, lang, s, cue = true }) {
  const L = (/** @type {string} */ en, /** @type {string} */ es) => (lang === "es" ? es : en);
  const { pitch, x0, w, h } = cardGeometry(W, m.n);
  const cx = (/** @type {number} */ j) => x0 + j * pitch + pitch / 2;
  let out = "";

  // step s: slide into order
  const h1 = header(W, y, s, L("Put the values in order, least to greatest", "Ordena los valores, de menor a mayor"));
  let p = `${h1.svg}`;
  y += h1.h;
  p += T(x0 + 2, y + 12, L("least", "menor"), { size: 13, fill: COLOR.muted, anchor: "start" }) + T(x0 + m.n * pitch - 2, y + 12, L("greatest", "mayor"), { size: 13, fill: COLOR.muted, anchor: "end" });
  y += 18;
  m.sorted.forEach((v, j) => {
    const dx = (m.order[j] - j) * pitch;
    p += `<g class="dm-card" data-i="${j}" data-dx="${f1(dx)}"><rect x="${f1(x0 + j * pitch + 2)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="4" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>${T(cx(j), y + 21, String(v), { size: 14, weight: 700 })}</g>`;
  });
  y += h + 14;
  out += step(s, p);

  // step s + 1: cross off in pairs
  const h2 = header(W, y, s + 1, L("Cross off one value from each end until the middle is left", "Tacha un valor de cada extremo hasta llegar al medio"));
  p = h2.svg;
  y += h2.h + 4;
  const mid = m.median.mid;
  const pairs = mid[0];
  m.sorted.forEach((v, j) => {
    const isMid = mid.includes(j);
    const gone = j < pairs || j >= m.n - pairs;
    const k = j < pairs ? j : m.n - 1 - j;
    const fill = isMid ? `fill="${COLOR.teal}" fill-opacity="0.35"` : gone ? `fill="${COLOR.muted}" fill-opacity="0.2"` : `fill="${COLOR.white}"`;
    p += `<g class="${isMid ? "dm-mid" : "dm-keep"}"><rect x="${f1(x0 + j * pitch + 2)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="4" ${fill} stroke="${COLOR.ink}" stroke-width="${isMid ? 3 : 1.5}"/>${T(cx(j), y + 21, String(v), { size: 14, weight: isMid ? 700 : 400, fill: gone ? COLOR.muted : COLOR.ink })}</g>`;
    if (gone) p += `<g class="dm-cross" data-k="${k}"><line x1="${f1(x0 + j * pitch + 6)}" y1="${f1(y + h - 4)}" x2="${f1(x0 + j * pitch + w - 2)}" y2="${f1(y + 4)}" stroke="${COLOR.ink}" stroke-width="2"/>${T(cx(j), y + h + 16, String(k + 1), { size: 13, fill: COLOR.muted })}</g>`;
  });
  y += h + (pairs ? 22 : 10);
  if (pairs) {
    const c = para(PAD, y + 8, L("Numbers show which pair is crossed off first, second, third.", "Los números dicen qué pareja se tacha primero, segundo, tercero."), { maxW: W - 2 * PAD });
    p += c.svg;
    y += c.h + 10;
  }
  out += step(s + 1, p);
  const md = m.median;
  const exprTxt = md.mid.length === 1 ? `${fmt(md.value)} ${L("is the middle value", "es el valor del medio")}` : nb(md.expr);
  const sentence = md.mid.length === 1 ? L(`Median = ${fmt(md.value)}, the middle value`, `Mediana = ${fmt(md.value)}, el valor del medio`) : L(`Median = ${exprTxt}`, `Mediana = ${exprTxt}`);
  const r = note(W, y, sentence, "yes", "dm-result");
  out += r.svg;
  y += r.h;
  const em = enteredMiddle(m);
  if (cue && cmp(em.value, md.value) !== 0) {
    const c = note(
      W,
      y,
      em.two
        ? L(`Not this: the middle of the list as given is ${em.a} and ${em.b}. It is not in order yet, so that is not the median.`, `No así: el medio de la lista tal como está es ${em.a} y ${em.b}. Aún no está en orden, así que no es la mediana.`)
        : L(`Not this: the middle of the list as given is ${em.text}. It is not in order yet, so that is not the median.`, `No así: el medio de la lista tal como está es ${em.text}. Aún no está en orden, así que no es la mediana.`),
      "not",
    );
    out += c.svg;
    y += c.h;
  }
  return { svg: out, bottom: y };
}

/** Screen-reader sentences for the two card panels. @param {DataModel} m @param {"en" | "es"} lang */
export function cardWords(m, lang) {
  const es = lang === "es";
  const md = m.median;
  const pairs = md.mid[0];
  const middle = md.mid.length === 1 ? (es ? `Queda un valor en el medio, ${fmt(md.value)}.` : `One value is left in the middle, ${fmt(md.value)}.`) : es ? `Quedan dos valores en el medio, ${m.sorted[md.mid[0]]} y ${m.sorted[md.mid[1]]}; la mediana es ${md.expr}.` : `Two values are left in the middle, ${m.sorted[md.mid[0]]} and ${m.sorted[md.mid[1]]}; the median is ${md.expr}.`;
  return es
    ? `Los valores en orden, de menor a mayor: ${list(m.sorted)}. Se tacha un valor de cada extremo, ${pairs} ${pairs === 1 ? "pareja" : "parejas"}. ${middle} Mediana ${eqSign(md.value)} ${fmt(md.value)}.`
    : `The values in order, least to greatest: ${list(m.sorted)}. One value is crossed off from each end, ${pairs} ${pairs === 1 ? "pair" : "pairs"}. ${middle} Median ${eqSign(md.value)} ${fmt(md.value)}.`;
}

/**
 * Scene for the card panels inside the window [from, to] of the whole scene.
 * @param {ParentNode} root @param {number} s @param {number} from @param {number} to
 * @returns {Array<import("../motion.mjs").Track & { els: Element[] }>}
 */
export function cardTracks(root, s, from, to) {
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  const len = to - from;
  tracks.push({ els: sel(root, `.dm-step[data-step="${s}"]`), from, to: from + len * 0.1, keyframes: FADE });
  stagger(tracks, sel(root, ".dm-card"), from + len * 0.08, from + len * 0.4, (el) => SLIDE(num(el, "data-dx"), 0, 0.5));
  tracks.push({ els: sel(root, `.dm-step[data-step="${s + 1}"]`), from: from + len * 0.4, to: from + len * 0.5, keyframes: FADE });
  const ks = [...new Set(sel(root, ".dm-cross").map((e) => e.getAttribute("data-k")))];
  ks.forEach((k, i) => {
    const a = from + len * (0.5 + (0.3 * i) / Math.max(1, ks.length));
    tracks.push({ els: sel(root, `.dm-cross[data-k="${k}"]`), from: a, to: a + len * 0.1, keyframes: POP });
  });
  tracks.push({ els: sel(root, ".dm-mid"), from: from + len * 0.8, to: from + len * 0.88, keyframes: POP });
  tracks.push({ els: sel(root, ".dm-result"), from: from + len * 0.88, to: to, keyframes: RISE });
  tracks.push({ els: sel(root, ".dm-note"), from: from + len * 0.9, to, keyframes: FADE });
  return tracks;
}
