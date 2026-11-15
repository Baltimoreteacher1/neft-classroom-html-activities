// expression:equivalence (6-5, 6-6, and the bench of 6-15). Two forms of one expression, evaluated at the same x, drawn as tape bars on one
// scale so equal values are equal lengths; then the look-alike a x + b whose b is NOT multiplied (the "fee" that is added once) comes up short.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { expressionControls, expressionModel } from "./expressions-math.mjs";
import { INNER, PAD, badge, clampW, downArrow, f1, frame, group, part, pick, pill, plural, stepScene, swatch, text, textLines, tw, wrapChain, wrapWords } from "./expressions-kit.mjs";

/** @typedef {import("./expressions-math.mjs").ExpressionModel} M */

/** Equal-width groups divided by thin white lines, so "3 groups of 2" can be counted. @param {number} x @param {number} y @param {number} h @param {number} unitPx @param {number} count */
function dividers(x, y, h, unitPx, count) {
  let d = "";
  for (let i = 1; i < count; i++) d += `M${f1(x + i * unitPx)} ${f1(y)}V${f1(y + h)}`;
  return d ? `<path d="${d}" stroke="${COLOR.white}" stroke-width="1.5" fill="none"/>` : "";
}

/** One solid (x) or dashed (b) block of a tape. @param {number} x @param {number} y @param {number} w @param {number} h @param {"x" | "b"} kind */
const block = (x, y, w, h, kind) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(w, 1))}" height="${h}" fill="${COPY_FILLS[kind === "x" ? 0 : 1]}" fill-opacity="0.75" stroke="${COLOR.ink}" stroke-width="1.2"${kind === "b" ? ' stroke-dasharray="4 2.5"' : ""}/>`;

/**
 * @param {M} m @param {{ lang: "en" | "es", width: number }} o
 */
export function renderCompare(m, o) {
  const { lang } = o;
  const W = clampW(o.width);
  const cw = W - 2 * PAD;
  const inX = PAD + INNER;
  const inW = cw - 2 * INNER;
  const { a, b, c } = m;
  const es = lang === "es";
  const grp = plural(a, es ? "grupo" : "group", es ? "grupos" : "groups");
  const grps = es ? "grupos" : "groups";
  const scale = inW / m.n.total;
  const TH = 26;
  let y = PAD;
  let body = "";

  // step 1: plug in
  {
    const t = wrapWords(pick(lang, `Plug in x = ${c}: write ${c} wherever you see x.`, `Sustituye x = ${c}: escribe ${c} donde ves x.`), cw - 54, 14, 700);
    const head = textLines(PAD + 34, y + 25, t, 18, { size: 14, weight: 700, anchor: "start" });
    const ly = head.y + 2;
    const l1 = pick(lang, `${c} from x`, `${c} de x`);
    const l2 = pick(lang, `${b} added`, `${b} que se suma`);
    const x2 = inX + 18 + 6 + tw(l1, 13) + 18;
    const legend = `${swatch(inX, ly, "solid", 0)}${text(inX + 24, ly + 12, l1, { size: 13, anchor: "start" })}${swatch(x2, ly, "dashed", 1)}${text(x2 + 24, ly + 12, l2, { size: 13, anchor: "start" })}`;
    const h = ly + 24 - y;
    body += group(1, `${frame(PAD, y, cw, h)}${badge(PAD + 20, y + 21, 1)}${head.svg}${legend}`);
    y += h + 10;
  }

  /**
   * One form card. @param {{ step: number, n: number, form: string, name: string, chain: string, caption: string, dashed?: boolean, tape: (ty: number) => string }} c
   */
  const card = (c0) => {
    const top = y;
    const chain = wrapChain(c0.chain, inW, 15);
    let inner = `${badge(PAD + 20, top + 22, c0.n)}${text(PAD + 40, top + 29, c0.form, { size: 18, weight: 700, anchor: "start" })}${text(PAD + cw - 12, top + 28, c0.name, { size: 13, anchor: "end", fill: COLOR.muted })}`;
    const ch = textLines(inX, top + 56, chain, 19, { size: 15, weight: 700, anchor: "start" });
    const ty = ch.y - 12;
    inner += ch.svg + c0.tape(ty);
    const cap = textLines(inX, ty + TH + 18, wrapWords(c0.caption, inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = cap.y - top - 4;
    body += group(c0.step, `${frame(PAD, top, cw, h, c0.dashed)}${inner}${cap.svg}`);
    y = top + h;
  };

  // step 2: grouped form, a groups of (x + b)
  card({
    step: 2,
    n: 2,
    form: m.groupedForm,
    name: pick(lang, "grouped", "agrupada"),
    chain: `${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}`,
    caption: pick(lang, `${a} ${grp} of (${c} + ${b}); each group is ${m.s}.`, `${a} ${grp} de (${c} + ${b}); cada grupo vale ${m.s}.`),
    tape: (ty) => {
      let s = "";
      for (let i = 0; i < a; i++) {
        const gx = inX + i * m.n.s * scale;
        s += part(2, block(gx, ty, c * scale, TH, "x") + block(gx + c * scale, ty, b * scale, TH, "b"));
      }
      return s;
    },
  });

  // step 3: expanded form, then the agreement
  const mid = 38;
  body += group(3, downArrow(PAD + 24, y + 4, mid - 8, pick(lang, `multiply each part by ${a}`, `multiplica cada parte por ${a}`), cw - 60).svg, "ex-link");
  y += mid;
  card({
    step: 3,
    n: 3,
    form: m.expandedForm,
    name: pick(lang, "expanded", "desarrollada"),
    chain: `${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}`,
    caption: pick(lang, `${a} ${grp} of ${c} make ${m.ax}; ${a} ${grp} of ${b} make ${m.ab}.`, `${a} ${grp} de ${c} hacen ${m.ax}; ${a} ${grp} de ${b} hacen ${m.ab}.`),
    tape: (ty) => {
      const wx = m.n.ax * scale;
      return part(3, block(inX, ty, wx, TH, "x") + dividers(inX, ty, TH, c * scale, a)) + part(3, block(inX + wx, ty, m.n.ab * scale, TH, "b") + dividers(inX + wx, ty, TH, b * scale, a));
    },
  });
  y += 8;
  const ok = pill(PAD, y, cw, true, wrapWords(pick(lang, `Same value: both are ${m.totalText}.`, `Mismo valor: las dos son ${m.totalText}.`), cw - 50, 14, 700));
  body += group(3, ok.svg, "ex-link");
  y += ok.h + 14;

  // step 4: the look-alike whose b is not multiplied (only when it really differs)
  if (m.differs) {
    card({
      step: 4,
      n: 4,
      dashed: true,
      form: m.feeForm,
      name: pick(lang, "not equivalent", "no equivalente"),
      chain: `${a} × ${c} + ${b} = ${m.ax} + ${b} = ${m.fee}`,
      caption: pick(lang, `${a} ${grps} of ${c}, plus ONE ${b}. The ${b} is not multiplied, so it is short by (${a} − 1) × ${b} = ${m.short}.`, `${a} ${grps} de ${c}, más UN ${b}. El ${b} no se multiplica, así que faltan (${a} − 1) × ${b} = ${m.short}.`),
      tape: (ty) => {
        const wx = m.n.ax * scale;
        const wb = b * scale;
        const wm = (m.n.total - m.n.fee) * scale;
        return (
          part(4, block(inX, ty, wx, TH, "x") + dividers(inX, ty, TH, c * scale, a)) +
          part(4, block(inX + wx, ty, wb, TH, "b")) +
          part(4, `<rect x="${f1(inX + wx + wb)}" y="${f1(ty)}" width="${f1(Math.max(wm, 1))}" height="${TH}" fill="none" stroke="${COLOR.error}" stroke-width="1.6" stroke-dasharray="5 3"/>`)
        );
      },
    });
    y += 8;
    const no = pill(PAD, y, cw, false, wrapWords(pick(lang, `${m.fee} is not ${m.totalText}: not equivalent.`, `${m.fee} no es ${m.totalText}: no son equivalentes.`), cw - 50, 14, 700));
    body += group(4, no.svg, "ex-link");
    y += no.h;
  }
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** @param {M} m @param {"en" | "es"} lang */
export function describeCompare(m, lang) {
  const { a, b, c } = m;
  const es = lang === "es";
  const grp = plural(a, es ? "grupo" : "group", es ? "grupos" : "groups");
  const out = [];
  out.push(es ? `Sustituimos x = ${c} en la forma agrupada ${m.groupedForm}: ${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}. Son ${a} ${grp} de (${c} + ${b}), y cada grupo vale ${m.s}.` : `We plug in x = ${c} in the grouped form ${m.groupedForm}: ${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}. That is ${a} ${grp} of (${c} + ${b}), and each group is ${m.s}.`);
  out.push(es ? `Multiplicamos cada parte por ${a} y obtenemos la forma desarrollada ${m.expandedForm}: ${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}. Las dos formas valen ${m.totalText}, así que tienen el mismo valor. En la cinta las dos barras miden lo mismo.` : `Multiplying each part by ${a} gives the expanded form ${m.expandedForm}: ${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}. Both forms are ${m.totalText}, so they have the same value. On the tape both bars are the same length.`);
  if (m.differs) {
    out.push(es ? `La parecida ${m.feeForm} multiplica solo la parte de x y suma el ${b} una sola vez: ${a} × ${c} + ${b} = ${m.ax} + ${b} = ${m.fee}. Le faltan (${a} − 1) × ${b} = ${m.short}. ${m.fee} no es ${m.totalText}, así que no es equivalente.` : `The look-alike ${m.feeForm} multiplies only the x part and adds the ${b} just once: ${a} × ${c} + ${b} = ${m.ax} + ${b} = ${m.fee}. It is short by (${a} − 1) × ${b} = ${m.short}. ${m.fee} is not ${m.totalText}, so it is not equivalent.`);
  } else {
    out.push(es ? `Como a es 1, no hay una parecida distinta: ${a}x + ${b} da el mismo valor.` : `Because a is 1, there is no different look-alike: ${a}x + ${b} gives the same value.`);
  }
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export const compareFigure = {
  id: "expression-two-forms-one-value",
  keys: ["expression:equivalence"],
  title: { en: "Two forms, one value, and a look-alike", es: "Dos formas, un valor y una parecida" },
  controls: () => expressionControls(),
  build: (_key, values) => ({ ...expressionModel(values), steps: expressionModel(values).differs ? 4 : 3 }),
  render: (model, o) => renderCompare(model, o),
  scene: (root, model) => stepScene(root, model.steps),
  describe: (model, lang) => describeCompare(model, lang),
};
