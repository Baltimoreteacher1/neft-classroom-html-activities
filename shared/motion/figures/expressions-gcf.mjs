// factors:gcf (6-7, 6-8). Factor lists with the shared ones joined and marked, the greatest shared factor, then what it is for: it splits both
// numbers into the same size of group, so a + b = g(a/g + b/g). The dashed card is the factor/multiple mix-up (GCF is not the LCM).
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { factorsControls, factorsModel, show } from "./expressions-factors-math.mjs";
import { INNER, PAD, badge, clampW, f1, frame, group, part, pick, pill, plural, stepScene, text, textLines, wrapChain, wrapWords } from "./expressions-kit.mjs";

/** @typedef {import("./expressions-factors-math.mjs").FactorsModel} M */

const CH = 26;

/** @param {number[]} list */
const listText = (list) => list.map(show).join(", ");

/**
 * @param {M} m @param {{ lang: "en" | "es", width: number }} o
 */
export function renderGcf(m, o) {
  const { lang } = o;
  const W = clampW(o.width);
  const cw = W - 2 * PAD;
  const inX = PAD + INNER;
  const inW = cw - 2 * INNER;
  const term = pick(lang, "GCF", "MCD");
  const n = Math.max(m.fa.length, m.fb.length);
  const chipW = Math.min(40, (inW - (n - 1) * 4) / n);
  const chipX = (/** @type {number} */ i) => inX + i * (chipW + 4);
  /** @param {number} f @param {number} i @param {number} y @param {boolean} sharedOne @param {boolean} big */
  const chip = (f, i, y, sharedOne, big = false) => `<rect x="${f1(chipX(i))}" y="${f1(y)}" width="${f1(chipW)}" height="${CH}" rx="6" fill="${sharedOne ? COPY_FILLS[big ? 1 : 0] : COLOR.white}" fill-opacity="${sharedOne ? 0.75 : 1}" stroke="${COLOR.ink}" stroke-width="${big ? 3 : sharedOne ? 2 : 1.2}"${sharedOne ? "" : ' stroke-dasharray="3 2.5"'}/>${text(chipX(i) + chipW / 2, y + 18, show(f), { size: 14, weight: sharedOne ? 700 : 400 })}`;
  let y = PAD;
  let body = "";

  // 1: the two lists
  {
    const top = y;
    const ay = top + 62;
    const by = ay + CH + 26;
    const head = `${badge(PAD + 20, top + 22, 1)}${text(PAD + 40, top + 28, pick(lang, "List the factors", "Anota los factores"), { size: 16, weight: 700, anchor: "start" })}`;
    const labA = text(inX, ay - 7, pick(lang, `Factors of ${m.a}`, `Factores de ${m.a}`), { size: 14, weight: 700, anchor: "start" });
    const labB = text(inX, by + CH + 18, pick(lang, `Factors of ${m.b}`, `Factores de ${m.b}`), { size: 14, weight: 700, anchor: "start" });
    const rowA = m.fa.map((f, i) => chip(f, i, ay, m.shared.includes(f))).join("");
    const rowB = m.fb.map((f, i) => chip(f, i, by, m.shared.includes(f))).join("");
    const links = m.shared.map((f) => `<line x1="${f1(chipX(m.fa.indexOf(f)) + chipW / 2)}" y1="${ay + CH}" x2="${f1(chipX(m.fb.indexOf(f)) + chipW / 2)}" y2="${by}" stroke="${COLOR.ink}" stroke-width="2"/>`).join("");
    const cap = textLines(inX, by + CH + 40, wrapWords(pick(lang, "A factor divides the number with no remainder. Joined chips are shared.", "Un factor divide al número sin residuo. Las fichas unidas se comparten."), inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = cap.y - top - 4;
    body += group(1, `${frame(PAD, top, cw, h)}${head}${labA}${labB}${part(1, rowA)}${part(1, rowB)}${part(1, links)}${cap.svg}`);
    y = top + h + 10;
  }

  // 2: keep the shared ones, the greatest is the GCF
  {
    const top = y;
    const sy = top + 46;
    const k = m.shared.length;
    const head = `${badge(PAD + 20, top + 22, 2)}${text(PAD + 40, top + 28, pick(lang, "Keep the shared factors", "Factores compartidos"), { size: 16, weight: 700, anchor: "start" })}`;
    const chips = m.shared.map((f, i) => part(2, chip(f, i, sy, true, i === k - 1))).join("");
    const gx = chipX(k - 1) + chipW / 2;
    const flag = text(Math.max(PAD + 16, Math.min(W - PAD - 16, gx)), sy + CH + 18, term, { size: 14, weight: 700 });
    const l1 = textLines(inX, sy + CH + 42, wrapWords(pick(lang, `Shared: ${listText(m.shared)}`, `Compartidos: ${listText(m.shared)}`), inW, 14, 700), 18, { size: 14, weight: 700, anchor: "start" });
    const l2 = textLines(inX, l1.y, wrapWords(pick(lang, `The greatest is the ${term}: ${term}(${m.a}, ${m.b}) = ${m.gcf}`, `El mayor es el ${term}: ${term}(${m.a}, ${m.b}) = ${m.gcf}`), inW, 14, 700), 18, { size: 14, weight: 700, anchor: "start", fill: COLOR.tealInk });
    const h = l2.y - top + 2;
    body += group(2, `${frame(PAD, top, cw, h)}${head}${chips}${flag}${l1.svg}${l2.svg}`);
    y = top + h + 10;
  }

  // 3: use it to rewrite a sum
  {
    const top = y;
    const ix = inX;
    const unit = inW / Math.max(m.a, m.b);
    const head = `${badge(PAD + 20, top + 22, 3)}${text(PAD + 40, top + 28, pick(lang, "Rewrite the sum", "Reescribe la suma"), { size: 16, weight: 700, anchor: "start" })}`;
    let cy = top + 54;
    let rows = "";
    for (const [num, q, fill] of /** @type {const} */ ([[m.a, m.qa, 0], [m.b, m.qb, 2]])) {
      const label = pick(lang, `${num} = ${q} ${plural(q, "group", "groups")} of ${m.gcf}`, `${num} = ${q} ${plural(q, "grupo", "grupos")} de ${m.gcf}`);
      rows += text(ix, cy, label, { size: 14, weight: 700, anchor: "start" });
      let blocks = "";
      for (let i = 0; i < q; i++) blocks += `<rect x="${f1(ix + i * m.gcf * unit)}" y="${f1(cy + 8)}" width="${f1(m.gcf * unit)}" height="20" fill="${COPY_FILLS[fill]}" fill-opacity="0.75" stroke="${COLOR.ink}" stroke-width="1.2"/>`;
      rows += part(3, blocks);
      cy += 52;
    }
    const chain = textLines(ix, cy - 2, wrapChain(`${m.a} + ${m.b} = ${m.gcf} × ${m.qa} + ${m.gcf} × ${m.qb} = ${m.gcf}(${m.qa} + ${m.qb}) = ${show(m.sum)}`, inW, 15), 19, { size: 15, weight: 700, anchor: "start" });
    const h = chain.y - top + 2;
    body += group(3, `${frame(PAD, top, cw, h)}${head}${rows}${chain.svg}`);
    y = top + h + 10;
  }

  // 4: the factor / multiple mix-up (only when the LCM really is a different number)
  if (m.a !== m.b) {
    const lines = wrapWords(pick(lang, `Not ${show(m.lcm)}: that is the LCM, a multiple of both numbers. The ${term} is a factor, so it divides both.`, `No ${show(m.lcm)}: ese es el mcm, un múltiplo de los dos números. El ${term} es un factor, así que divide a los dos.`), cw - 50, 14, 700);
    const p = pill(PAD, y, cw, false, lines);
    body += group(4, p.svg);
    y += p.h;
  } else y -= 10;
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** @param {M} m @param {"en" | "es"} lang */
export function describeGcf(m, lang) {
  const es = lang === "es";
  const term = es ? "MCD" : "GCF";
  const out = [];
  out.push(es ? `Factores de ${m.a}: ${listText(m.fa)}. Factores de ${m.b}: ${listText(m.fb)}. Un factor divide al número sin residuo.` : `Factors of ${m.a}: ${listText(m.fa)}. Factors of ${m.b}: ${listText(m.fb)}. A factor divides the number with no remainder.`);
  out.push(es ? `Los factores compartidos son ${listText(m.shared)}. El mayor es el ${term}: ${term}(${m.a}, ${m.b}) = ${m.gcf}.` : `The shared factors are ${listText(m.shared)}. The greatest is the ${term}: ${term}(${m.a}, ${m.b}) = ${m.gcf}.`);
  out.push(es ? `Con ${m.gcf} se forman grupos iguales: ${m.a} = ${m.qa} grupos de ${m.gcf} y ${m.b} = ${m.qb} grupos de ${m.gcf}. Entonces ${m.a} + ${m.b} = ${m.gcf} × ${m.qa} + ${m.gcf} × ${m.qb} = ${m.gcf}(${m.qa} + ${m.qb}) = ${show(m.sum)}.` : `With ${m.gcf} both numbers split into equal groups: ${m.a} = ${m.qa} groups of ${m.gcf} and ${m.b} = ${m.qb} groups of ${m.gcf}. So ${m.a} + ${m.b} = ${m.gcf} × ${m.qa} + ${m.gcf} × ${m.qb} = ${m.gcf}(${m.qa} + ${m.qb}) = ${show(m.sum)}.`);
  if (m.a !== m.b) out.push(es ? `No es ${show(m.lcm)}: ese es el mcm, un múltiplo de los dos números. El ${term} es un factor, así que divide a los dos.` : `Not ${show(m.lcm)}: that is the LCM, a multiple of both numbers. The ${term} is a factor, so it divides both.`);
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export const gcfFigure = {
  id: "factors-shared-greatest",
  keys: ["factors:gcf"],
  title: { en: "Shared factors and the greatest one", es: "Factores compartidos y el mayor" },
  controls: () => factorsControls(),
  build: (_key, values) => {
    const m = factorsModel(values);
    return { ...m, steps: m.a !== m.b ? 4 : 3 };
  },
  render: (model, o) => renderGcf(model, o),
  scene: (root, model) => stepScene(root, model.steps),
  describe: (model, lang) => describeGcf(model, lang),
  headline: (model, lang) => ({ label: pick(lang, "Greatest common factor", "Máximo común divisor (MCD)"), value: String(model.gcf) }),
  wrong: (model, lang) => (model.a !== model.b ? { value: String(model.lcm), say: pick(lang, "Gave the least common multiple, a multiple of both, instead of a factor of both.", "Dio el mínimo común múltiplo, un múltiplo de los dos, en lugar de un factor de los dos.") } : null),
};
