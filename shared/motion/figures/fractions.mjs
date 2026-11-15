// Motion figure: fraction division as partition and count. See docs/motion-figure-contract.md.
// The supply is drawn as bars, every bar is cut into c equal parts, the parts are put b at a time into shares, and the shares
// are counted. Fractions are drawn stacked; the question is worded ("how many servings of one fourth of a cup fit in 3 cups?").
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { windows } from "../motion.mjs";
import { describe, howMany, questionText, resultText } from "./fractions-describe.mjs";
import { expr, f1, flow, fr, num, op, w, words } from "./fractions-flow.mjs";
import { build, controlsFor } from "./fractions-model.mjs";
import { fracWords, nounFor, unitFor } from "./fractions-words.mjs";

/** @typedef {import("./fractions-model.mjs").FractionModel} FractionModel */

const PAD = 12;
const BAR_H = 24;
const BAR_GAP = 6;
const INDENT = 32;

/** @param {number} cx @param {number} cy @param {string} color */
const checkIcon = (cx, cy, color) => `<path d="M${f1(cx - 8)} ${f1(cy)} l5 6 l11 -13" fill="none" stroke="${color}" stroke-width="3"/>`;
/** @param {number} cx @param {number} cy @param {string} color */
const crossIcon = (cx, cy, color) => `<path d="M${f1(cx - 7)} ${f1(cy - 7)} l14 14 M${f1(cx + 7)} ${f1(cy - 7)} l-14 14" fill="none" stroke="${color}" stroke-width="3"/>`;

/** The supply bars, their cuts and the numbered shares, as three groups the scene animates separately. @param {FractionModel} m @param {number} x @param {number} y @param {number} bw */
function drawPicture(m, x, y, bw) {
  let bars = "";
  let cuts = "";
  m.bars.forEach((fill, i) => {
    const top = y + i * (BAR_H + BAR_GAP);
    bars += `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(bw * fill)}" height="${BAR_H}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    if (fill < 1) bars += `<rect x="${f1(x + bw * fill)}" y="${f1(top)}" width="${f1(bw * (1 - fill))}" height="${BAR_H}" fill="none" stroke="${COLOR.muted}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    for (let j = 1; j < m.c; j++) {
      if (j / m.c < fill - 1e-9) cuts += `<line x1="${f1(x + (bw * j) / m.c)}" y1="${f1(top)}" x2="${f1(x + (bw * j) / m.c)}" y2="${f1(top + BAR_H)}" stroke="${COLOR.muted}" stroke-width="1"/>`;
    }
  });
  let groups = "";
  for (const g of m.groups) {
    let seg = "";
    g.segs.forEach((s, k) => {
      const top = y + s.row * (BAR_H + BAR_GAP);
      const sx = x + bw * s.from;
      const sw = bw * (s.to - s.from);
      const dash = g.complete ? "" : ' stroke-dasharray="5 3"';
      seg += `<rect x="${f1(sx + 1)}" y="${f1(top + 1)}" width="${f1(sw - 2)}" height="${BAR_H - 2}" rx="2" fill="${COPY_FILLS[(g.n - 1) % COPY_FILLS.length]}" fill-opacity="${g.complete ? 0.6 : 0.3}" stroke="${COLOR.ink}" stroke-width="1.6"${dash}/>`;
      if (k === 0 && g.complete) seg += `<text x="${f1(sx + sw / 2)}" y="${f1(top + BAR_H / 2 + 4.5)}" text-anchor="middle" font-size="13" font-weight="700" fill="${COLOR.ink}" stroke="${COLOR.white}" stroke-width="3" paint-order="stroke">${g.n}</text>`;
    });
    groups += `<g class="fp-group" data-g="${g.n}">${seg}</g>`;
  }
  return { bars: `<g class="fp-bars">${bars}</g>`, cuts: `<g class="fp-cuts">${cuts}</g>`, groups, height: m.rows * (BAR_H + BAR_GAP) - BAR_GAP };
}

/**
 * @param {FractionModel} m
 * @param {{ lang: "en" | "es", width: number }} o
 */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(600, Math.round(width || 400)));
  const es = lang === "es";
  const t = (/** @type {string} */ en, /** @type {string} */ esText) => (es ? esText : en);
  const cw = Math.min(W - 2 * PAD, 520);
  const ox = (W - cw) / 2;
  const { ctx } = m;
  const unit = unitFor(ctx, lang, false);
  const noun = nounFor(ctx, lang, false);
  const nounPl = nounFor(ctx, lang, true);
  let y = PAD;
  let body = "";

  // the question, worded, then the same thing in stacked notation
  const q = flow(words(questionText(m, lang)), { x: ox, y, w: cw, size: 16, weight: 700, align: "middle" });
  y += q.h + 2;
  const notation = flow(expr(num(m.a), op("÷"), fr(m.b, m.c), op("="), w("?")), { x: ox, y, w: cw, size: 22, weight: 700, align: "middle", wrap: false });
  body += `<g class="fp-q">${q.svg}${notation.svg}</g>`;
  y += notation.h + 12;

  // the picture: bars, cuts, numbered shares
  const pic = drawPicture(m, ox, y, cw);
  body += pic.bars + pic.cuts + pic.groups;
  y += pic.height + 8;
  const solidNote = t(`Each numbered block is one ${noun}.`, `Cada bloque numerado es ${es ? (ctx.noun.g === "m" ? "un" : "una") : "a"} ${noun}.`);
  const partialNote = m.leftover.n === 0n ? "" : t(" The dashed block is only part of one.", " El bloque de línea discontinua es solo una parte.");
  const cap = flow(words(solidNote + partialNote), { x: ox, y, w: cw, size: 13, fill: COLOR.muted, align: "middle" });
  body += `<g class="fp-cap">${cap.svg}</g>`;
  y += cap.h + 14;

  // steps 1-3
  const parts = m.parts.d === 1n && m.parts.n === 1n ? t("part", "parte") : t("parts", "partes");
  const partsB = m.b === 1 ? t("part", "parte") : t("parts", "partes");
  const tx = ox + INDENT;
  const tw = cw - INDENT;
  /** @type {Array<{ title: import("./fractions-flow.mjs").Atom[], math: import("./fractions-flow.mjs").Atom[] }>} */
  const steps = [
    {
      title: words(t(`Draw the supply as bars of 1 ${unit}.`, `Dibuja el total como barras de 1 ${unit}.`)),
      math: expr(num(m.a), w(unitFor(ctx, lang, m.a.n > m.a.d))),
    },
    {
      title: [...words(t(`Cut each bar into ${m.c} equal parts. Each part is`, `Corta cada barra en ${m.c} partes iguales. Cada parte es`)), fr(1, m.c), ...words(t("of a bar.", "de una barra."))],
      math: expr(num(m.a), op("×"), w(String(m.c)), op("="), num(m.parts), w(parts)),
    },
    {
      title: words(t(`Put ${m.b} ${partsB} in each ${noun}. Count the ${nounPl}.`, `Pon ${m.b} ${partsB} en cada ${noun}. Cuenta ${es ? (ctx.noun.g === "m" ? "los" : "las") : "the"} ${nounPl}.`)),
      math: expr(num(m.parts), op("÷"), w(String(m.b)), op("="), num(m.q), w(nounFor(ctx, lang, m.q.n > m.q.d))),
    },
  ];
  steps.forEach((s, i) => {
    const title = flow(s.title, { x: tx, y, w: tw, size: 14, weight: 700 });
    const math = flow(s.math, { x: tx, y: y + title.h + 2, w: tw, size: 17, weight: 700, wrap: false });
    const badge = `<circle cx="${f1(ox + 11)}" cy="${f1(y + 11)}" r="11" fill="${COLOR.navy}"/><text x="${f1(ox + 11)}" y="${f1(y + 16)}" text-anchor="middle" font-size="14" font-weight="700" fill="${COLOR.white}">${i + 1}</text>`;
    body += `<g class="fp-step" data-step="${i + 1}">${badge}${title.svg}${math.svg}</g>`;
    y += title.h + math.h + 14;
  });

  // answer (solid box, check mark)
  const boxPad = 10;
  const ax = ox + 40;
  const aw = cw - 40 - boxPad;
  const eqItems = expr(num(m.a), op("÷"), fr(m.b, m.c), op("="), num(m.q));
  const eq = flow(eqItems, { x: ax, y: 0, w: aw, size: 20, weight: 700, wrap: false });
  const resItems = resultItems(m, lang);
  const resFlow = flow(resItems, { x: ax, y: 0, w: aw, size: 14, weight: 700 });
  const boxH = boxPad * 2 + eq.h + 2 + resFlow.h;
  const eq2 = flow(eqItems, { x: ax, y: y + boxPad, w: aw, size: 20, weight: 700, wrap: false });
  const res2 = flow(resItems, { x: ax, y: y + boxPad + eq.h + 2, w: aw, size: 14, weight: 700 });
  body += `<g class="fp-answer"><rect x="${f1(ox)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(boxH)}" rx="8" fill="none" stroke="${COLOR.success}" stroke-width="2"/>${checkIcon(ox + 20, y + boxH / 2, COLOR.success)}${eq2.svg}${res2.svg}</g>`;
  y += boxH + 14;

  // check by multiplying
  const chTitle = flow(words(t("Check by multiplying:", "Comprueba multiplicando:")), { x: tx, y, w: tw, size: 14, weight: 700 });
  const chMath = flow(expr(num(m.q), op("×"), fr(m.b, m.c), op("="), num(m.check)), { x: tx, y: y + chTitle.h + 2, w: tw, size: 17, weight: 700, wrap: false });
  const chIconX = Math.min(chMath.endX + 22, ox + cw - 12);
  body += `<g class="fp-step" data-step="4"><circle cx="${f1(ox + 11)}" cy="${f1(y + 11)}" r="11" fill="${COLOR.navy}"/><text x="${f1(ox + 11)}" y="${f1(y + 16)}" text-anchor="middle" font-size="14" font-weight="700" fill="${COLOR.white}">4</text>${chTitle.svg}${chMath.svg}${checkIcon(chIconX, chMath.endY - 5, COLOR.success)}</g>`;
  y += chTitle.h + chMath.h + 14;

  // the wrong move, only when it differs from the right answer: dashed box, cross, words
  if (m.wrong) {
    const lines = wrongItems(m, lang);
    const mx = ox + 40;
    const mw = cw - 40 - boxPad;
    let h = boxPad * 2;
    lines.forEach((l, i) => {
      h += flow(l.items, { x: mx, y: 0, w: mw, size: l.size, weight: l.weight, wrap: l.wrap }).h + (i ? 2 : 0);
    });
    let ly = y + boxPad;
    let inner = "";
    for (const l of lines) {
      const f = flow(l.items, { x: mx, y: ly, w: mw, size: l.size, weight: l.weight, wrap: l.wrap });
      inner += f.svg;
      ly += f.h + 2;
    }
    body += `<g class="fp-miss"><rect x="${f1(ox)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(h)}" rx="8" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/>${crossIcon(ox + 20, y + h / 2, COLOR.error)}${inner}</g>`;
    y += h;
  }
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** The result sentence as atoms, with the leftover drawn as a stacked fraction. @param {FractionModel} m @param {"en" | "es"} lang */
function resultItems(m, lang) {
  const text = resultText(m, lang);
  if (m.leftover.n === 0n) return words(text);
  const fw = fracWords(Number(m.leftover.n), Number(m.leftover.d), lang);
  const i = text.indexOf(fw);
  return [...words(text.slice(0, i)), num(m.leftover), ...words(text.slice(i + fw.length))];
}

/** @param {FractionModel} m @param {"en" | "es"} lang @returns {Array<{ items: import("./fractions-flow.mjs").Atom[], size: number, weight: number, wrap: boolean }>} */
function wrongItems(m, lang) {
  const es = lang === "es";
  const wr = m.wrong;
  if (!wr) return [];
  const head = (/** @type {import("./fractions-flow.mjs").Atom[]} */ rest) => ({ items: [w(es ? "No es esto:" : "Not this:"), ...rest], size: 15, weight: 700, wrap: true });
  const note = (/** @type {string} */ s) => ({ items: words(s), size: 14, weight: 400, wrap: true });
  if (wr.kind === "multiply") return [head(expr(num(m.a), op("×"), fr(m.b, m.c), op("="), num(wr.value))), note(es ? `Multiplicar no cuenta ${howMany(m, lang)} caben.` : `Multiplying does not count ${howMany(m, lang)} fit.`)];
  if (wr.kind === "flip") return [head(expr(fr(m.b, m.c), op("÷"), num(m.a), op("="), num(wr.value))), note(es ? "Al invertir el orden se compara el tamaño de un grupo con el total." : "Flipping the order compares the size of one group with the supply.")];
  const n = m.complete;
  const noun = nounFor(m.ctx, lang, n !== 1);
  return [
    head(words(es ? `quedarse en ${n} ${noun}.` : `stopping at ${n} ${noun}.`)),
    { items: [...words(es ? "La parte sobrante," : "The leftover"), num(wr.value), ...words(es ? `de ${m.ctx.noun.g === "m" ? "un" : "una"} ${nounFor(m.ctx, lang, false)} también cuenta.` : `of a ${nounFor(m.ctx, lang, false)} counts too.`)], size: 14, weight: 400, wrap: true },
  ];
}

/** @param {ParentNode} root @param {FractionModel} m */
function scene(root, m) {
  const all = (/** @type {string} */ sel) => [...root.querySelectorAll(sel)];
  const rise = [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }];
  const fade = [{ opacity: 0 }, { opacity: 1 }];
  const pop = [{ opacity: 0, transform: "scale(0.8)", transformBox: "fill-box", transformOrigin: "center" }, { opacity: 1, transform: "none", transformBox: "fill-box", transformOrigin: "center" }];
  const [w0, w1, w2, w3, w4, w5] = windows(6);
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [
    { els: all(".fp-q"), from: w0.from, to: w0.from + 0.07, keyframes: rise },
    { els: [...all(".fp-bars"), ...all(".fp-cap")], from: w0.from + 0.05, to: w0.to, keyframes: fade },
    { els: all('.fp-step[data-step="1"]'), from: w0.from + 0.05, to: w0.to + 0.02, keyframes: rise },
    { els: all('.fp-step[data-step="2"]'), from: w1.from, to: w1.from + 0.08, keyframes: rise },
    { els: all(".fp-cuts"), from: w1.from + 0.04, to: w1.to, keyframes: fade },
    { els: all('.fp-step[data-step="3"]'), from: w2.from, to: w2.from + 0.08, keyframes: rise },
  ];
  const groups = all(".fp-group");
  const span = w3.to - w2.from - 0.05;
  const n = Math.max(1, groups.length);
  const len = Math.min(0.09, (span / n) * 3);
  groups.forEach((el, g) => {
    const from = w2.from + 0.03 + (span * g) / n;
    tracks.push({ els: [el], from, to: Math.min(w3.to, from + len), keyframes: pop });
  });
  tracks.push(
    { els: all(".fp-answer"), from: w4.from, to: w4.from + 0.1, keyframes: rise },
    { els: all('.fp-step[data-step="4"]'), from: w4.from + 0.1, to: w5.from + 0.06, keyframes: rise },
    { els: all(".fp-miss"), from: w5.from + 0.06, to: 1, keyframes: rise },
  );
  return { durationMs: Math.min(9000, 5200 + 55 * groups.length), tracks };
}

export default [
  {
    id: "fraction-partition-count",
    keys: ["fraction:servings", "fraction:ribbon", "fraction:field"],
    title: { en: "Cut it up and count the groups", es: "Corta y cuenta los grupos" },
    controls: controlsFor,
    build,
    render,
    scene,
    describe,
  },
];
