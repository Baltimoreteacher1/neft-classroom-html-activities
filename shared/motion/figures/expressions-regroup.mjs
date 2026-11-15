// factors:regroup (6-8). Three factors written, reordered so the chosen pair sits together (commutative), then grouped in parentheses
// (associative): the tokens slide into place and every line keeps the same value. The dashed card adds the pair instead of multiplying it.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { commas, int } from "../exact.mjs";
import { INNER, PAD, badge, clampW, f1, frame, group, part, pick, pill, stepScene, text, textLines, wrapChain, wrapWords } from "./expressions-kit.mjs";

/** @typedef {ReturnType<typeof regroupModel>} M */

const MAX = 25;
const WORDS = [
  ["first", "primer"],
  ["second", "segundo"],
  ["third", "tercer"],
];

/** @param {number[]} values [first, second, third, pair] */
export function regroupModel(values) {
  const f = values.slice(0, 3);
  for (const v of f) if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > MAX) throw new RangeError(`Choose whole-number factors from 1 to ${MAX}.`);
  const p = values[3];
  if (![1, 2, 3].includes(p)) throw new RangeError("Choose pair 1, 2 or 3 to group.");
  // pair 1 = first two, 2 = first and third, 3 = last two
  const pairIdx = p === 1 ? [0, 1] : p === 2 ? [0, 2] : [1, 2];
  const restIdx = [0, 1, 2].find((i) => !pairIdx.includes(i)) ?? 0;
  const pairFirst = p !== 3;
  const order = pairFirst ? [...pairIdx, restIdx] : [restIdx, ...pairIdx];
  const [x, y] = pairIdx.map((i) => f[i]);
  const rest = f[restIdx];
  const pp = int(x).mul(int(y));
  const total = pp.mul(int(rest));
  const sum = int(x).add(int(y));
  const wrongTotal = sum.mul(int(rest));
  /** @param {import("../exact.mjs").Rat} r */
  const s = (r) => commas(r.n);
  return {
    f,
    p,
    x,
    y,
    rest,
    pairIdx,
    order,
    pairFirst,
    moved: order.some((v, i) => v !== i),
    pairProduct: pp.n,
    pairText: s(pp),
    totalText: s(total),
    total: total.n,
    sumText: s(sum),
    wrongText: s(wrongTotal),
    /** adding the pair instead of multiplying it changes the value unless x + y = x × y (2 and 2) */
    differs: !sum.eq(pp),
    /** the position (0-2) where the parentheses open in the regrouped line */
    open: pairFirst ? 0 : 1,
  };
}

export const regroupControls = () => [
  { label: "First factor", labelEs: "Primer factor", min: 1, max: MAX, step: 1 },
  { label: "Second factor", labelEs: "Segundo factor", min: 1, max: MAX, step: 1 },
  { label: "Third factor", labelEs: "Tercer factor", min: 1, max: MAX, step: 1 },
  { label: "Pair to group (1 = first two, 2 = first and third, 3 = last two)", labelEs: "Par que se agrupa (1 = los dos primeros, 2 = el primero y el tercero, 3 = los dos últimos)", min: 1, max: 3, step: 1 },
];

/**
 * @param {M} m @param {{ lang: "en" | "es", width: number }} o
 */
export function renderRegroup(m, o) {
  const { lang } = o;
  const W = clampW(o.width);
  const cw = W - 2 * PAD;
  const inX = PAD + INNER;
  const inW = cw - 2 * INNER;
  const opW = 46;
  const tokW = Math.min(64, (inW - 2 * opW - 30) / 3);
  const rowW = 3 * tokW + 2 * opW;
  const tx0 = PAD + (cw - rowW) / 2;
  const slotX = (/** @type {number} */ s) => tx0 + s * (tokW + opW);
  const TH = 40;
  let y = PAD;
  let body = "";
  /** @type {number[]} */
  const rowTop = [];

  /** Tokens in slot order, `from` = the slot each came from (for the slide). @param {number} step @param {number[]} ord @param {number} top @param {number} fromTop @param {boolean} slide */
  const tokens = (step, ord, top, fromTop, slide) => {
    let s = "";
    ord.forEach((idx, slot) => {
      const inPair = m.pairIdx.includes(idx);
      const box = `<rect x="${f1(slotX(slot))}" y="${f1(top)}" width="${f1(tokW)}" height="${TH}" rx="7" fill="${inPair ? COPY_FILLS[0] : COLOR.white}" fill-opacity="${inPair ? 0.75 : 1}" stroke="${COLOR.ink}" stroke-width="${inPair ? 2.4 : 1.4}"${inPair ? "" : ' stroke-dasharray="5 3"'}/>${text(slotX(slot) + tokW / 2, top + 27, String(m.f[idx]), { size: 20, weight: 700 })}`;
      const from = slide ? `${f1(slotX(idx) - slotX(slot))},${f1(fromTop - top)}` : "";
      s += part(step, box, from);
    });
    for (let i = 0; i < 2; i++) s += text(slotX(i) + tokW + opW / 2, top + 28, "×", { size: 20, weight: 700 });
    return s;
  };

  /** @param {{ step: number, n: number, title: string, note: string, ord: number[], chain: string, parens?: boolean, slide?: boolean }} c */
  const card = (c) => {
    const top = y;
    const ty = top + 60;
    rowTop[c.step] = ty;
    const head = `${badge(PAD + 20, top + 22, c.n)}${text(PAD + 40, top + 28, c.title, { size: 16, weight: 700, anchor: "start" })}`;
    const note = textLines(PAD + 40, top + 46, wrapWords(c.note, cw - 52, 13), 16, { size: 13, anchor: "start", fill: COLOR.muted });
    const noteGap = (note.y - (top + 46)) - 16;
    const tyy = ty + noteGap;
    rowTop[c.step] = tyy;
    let parens = "";
    if (c.parens) {
      const a = slotX(m.open) - 7;
      const b = slotX(m.open + 1) + tokW + 7;
      parens = `<g class="ex-link" data-step="${c.step}">${text(a, tyy + 31, "(", { size: 32, weight: 400 })}${text(b, tyy + 31, ")", { size: 32, weight: 400 })}</g>`;
    }
    const prev = rowTop[c.step - 1];
    const toks = tokens(c.step, c.ord, tyy, prev === undefined ? tyy : prev, !!c.slide);
    const chain = textLines(inX, tyy + TH + 26, wrapChain(c.chain, inW, 15), 19, { size: 15, weight: 700, anchor: "start" });
    const h = chain.y - top - 2;
    body += group(c.step, `${frame(PAD, top, cw, h, false)}${head}${note.svg}${toks}${parens}${chain.svg}`);
    y = top + h;
  };

  const f = m.f;
  card({ step: 1, n: 1, title: pick(lang, "As written", "Como está escrito"), note: pick(lang, `Chosen pair: the ${WORDS[m.pairIdx[0]][0]} and ${WORDS[m.pairIdx[1]][0]} factors (solid). Dashed: the factor left out.`, `Par elegido: los factores ${WORDS[m.pairIdx[0]][1]} y ${WORDS[m.pairIdx[1]][1]} (línea continua). Con línea punteada: el factor que queda fuera.`), ord: [0, 1, 2], chain: `${f[0]} × ${f[1]} × ${f[2]} = ${m.totalText}` });
  y += 10;
  const ord = m.order;
  card({
    step: 2,
    n: 2,
    title: pick(lang, "Reorder the factors", "Cambia el orden"),
    note: m.moved ? pick(lang, "Commutative property: the order can change.", "Propiedad conmutativa: el orden puede cambiar.") : pick(lang, "The pair is already side by side, so the order stays.", "El par ya está junto, así que el orden se queda igual."),
    ord,
    slide: true,
    chain: `${f[ord[0]]} × ${f[ord[1]]} × ${f[ord[2]]} = ${m.totalText}`,
  });
  y += 10;
  const grouped = m.pairFirst ? `(${m.x} × ${m.y}) × ${m.rest} = ${m.pairText} × ${m.rest}` : `${m.rest} × (${m.x} × ${m.y}) = ${m.rest} × ${m.pairText}`;
  card({ step: 3, n: 3, title: pick(lang, "Group the pair", "Agrupa el par"), note: pick(lang, "Associative property: the grouping can change.", "Propiedad asociativa: la agrupación puede cambiar."), ord, slide: true, parens: true, chain: `${grouped} = ${m.totalText}` });
  y += 8;
  const ok = pill(PAD, y, cw, true, [...wrapWords(pick(lang, `Grouped pair: ${m.x} × ${m.y} = ${m.pairText}`, `Par agrupado: ${m.x} × ${m.y} = ${m.pairText}`), cw - 50, 14, 700), ...wrapWords(pick(lang, `All three lines equal ${m.totalText}.`, `Las tres líneas valen ${m.totalText}.`), cw - 50, 14, 700)]);
  body += group(3, ok.svg, "ex-link");
  y += ok.h + 14;

  if (m.differs) {
    const top = y;
    const wrong = m.pairFirst ? `(${m.x} + ${m.y}) × ${m.rest} = ${m.sumText} × ${m.rest} = ${m.wrongText}` : `${m.rest} × (${m.x} + ${m.y}) = ${m.rest} × ${m.sumText} = ${m.wrongText}`;
    const head = `${badge(PAD + 20, top + 22, 4)}${text(PAD + 40, top + 28, pick(lang, "Not this: add the pair", "Esto no: sumar el par"), { size: 16, weight: 700, anchor: "start" })}`;
    const chain = textLines(inX, top + 56, wrapChain(wrong, inW, 15), 19, { size: 15, weight: 700, anchor: "start" });
    const h = chain.y - top + 2;
    body += group(4, `${frame(PAD, top, cw, h, true)}${head}${chain.svg}`);
    y = top + h + 8;
    const no = pill(PAD, y, cw, false, wrapWords(pick(lang, `A grouped pair is multiplied, not added. ${m.wrongText} is not ${m.totalText}.`, `Un par agrupado se multiplica, no se suma. ${m.wrongText} no es ${m.totalText}.`), cw - 50, 14, 700));
    body += group(4, no.svg, "ex-link");
    y += no.h;
  }
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** @param {M} m @param {"en" | "es"} lang */
export function describeRegroup(m, lang) {
  const es = lang === "es";
  const f = m.f;
  const o = m.order;
  const grouped = m.pairFirst ? `(${m.x} × ${m.y}) × ${m.rest} = ${m.pairText} × ${m.rest}` : `${m.rest} × (${m.x} × ${m.y}) = ${m.rest} × ${m.pairText}`;
  const out = [];
  out.push(es ? `Escrito así: ${f[0]} × ${f[1]} × ${f[2]} = ${m.totalText}. Se agrupa el par ${m.x} y ${m.y}; el factor ${m.rest} queda fuera.` : `As written: ${f[0]} × ${f[1]} × ${f[2]} = ${m.totalText}. The pair is ${m.x} and ${m.y}; the factor ${m.rest} is left out.`);
  out.push(es ? (m.moved ? `Propiedad conmutativa: cambiamos el orden para juntar el par: ${f[o[0]]} × ${f[o[1]]} × ${f[o[2]]} = ${m.totalText}.` : `El par ya está junto, así que el orden se queda: ${f[o[0]]} × ${f[o[1]]} × ${f[o[2]]} = ${m.totalText}.`) : m.moved ? `Commutative property: we change the order to put the pair together: ${f[o[0]]} × ${f[o[1]]} × ${f[o[2]]} = ${m.totalText}.` : `The pair is already together, so the order stays: ${f[o[0]]} × ${f[o[1]]} × ${f[o[2]]} = ${m.totalText}.`);
  out.push(es ? `Propiedad asociativa: agrupamos el par entre paréntesis: ${grouped} = ${m.totalText}. El par agrupado vale ${m.x} × ${m.y} = ${m.pairText}. Las tres líneas valen ${m.totalText}.` : `Associative property: we group the pair in parentheses: ${grouped} = ${m.totalText}. The grouped pair is ${m.x} × ${m.y} = ${m.pairText}. All three lines equal ${m.totalText}.`);
  if (m.differs) out.push(es ? `Esto no: si sumamos el par, ${m.x} + ${m.y} = ${m.sumText} y el total sería ${m.wrongText}, que no es ${m.totalText}. Un par agrupado se multiplica, no se suma.` : `Not this: adding the pair gives ${m.x} + ${m.y} = ${m.sumText} and a total of ${m.wrongText}, which is not ${m.totalText}. A grouped pair is multiplied, not added.`);
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export const regroupFigure = {
  id: "factors-reorder-regroup",
  keys: ["factors:regroup"],
  title: { en: "Reorder, then regroup: the value stays", es: "Cambia el orden y agrupa: el valor no cambia" },
  controls: () => regroupControls(),
  build: (_key, values) => {
    const m = regroupModel(values);
    return { ...m, steps: m.differs ? 4 : 3 };
  },
  render: (model, o) => renderRegroup(model, o),
  scene: (root, model) => stepScene(root, model.steps),
  describe: (model, lang) => describeRegroup(model, lang),
};
