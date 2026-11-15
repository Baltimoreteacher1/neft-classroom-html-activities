// expression:distribute (6-14, and 6-15 once terms are combined). An area model: a(x + b) is one rectangle a tall; splitting the width into
// x and b gives two partial products, a x + a b. Both forms are then evaluated at the same x. The look-alike lets the a reach only x.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { expressionControls, expressionModel } from "./expressions-math.mjs";
import { INNER, PAD, badge, clampW, downArrow, f1, frame, group, part, pick, pill, placeLabels, stepScene, text, textLines, wrapChain, wrapWords } from "./expressions-kit.mjs";

/** @typedef {import("./expressions-math.mjs").ExpressionModel} M */

const GAP = 14;

/** A filled block of unit cells (white lines between cells). @param {number} x @param {number} y @param {number} cols @param {number} rows @param {number} cell @param {"x" | "b"} kind */
function cells(x, y, cols, rows, cell, kind) {
  let d = "";
  for (let i = 1; i < cols; i++) d += `M${f1(x + i * cell)} ${f1(y)}V${f1(y + rows * cell)}`;
  for (let j = 1; j < rows; j++) d += `M${f1(x)} ${f1(y + j * cell)}H${f1(x + cols * cell)}`;
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(cols * cell)}" height="${f1(rows * cell)}" fill="${COPY_FILLS[kind === "x" ? 0 : 1]}" fill-opacity="0.75" stroke="${COLOR.ink}" stroke-width="1.4"${kind === "b" ? ' stroke-dasharray="5 3"' : ""}/>${d ? `<path d="${d}" stroke="${COLOR.white}" stroke-width="1" fill="none"/>` : ""}`;
}

/**
 * @param {M} m @param {{ lang: "en" | "es", width: number }} o
 */
export function renderDistribute(m, o) {
  const { lang } = o;
  const W = clampW(o.width);
  const cw = W - 2 * PAD;
  const inX = PAD + INNER;
  const inW = cw - 2 * INNER;
  const { a, b, c } = m;
  const gutL = 30;
  const cell = Math.min(24, (inW - gutL - GAP) / (c + b));
  let y = PAD;
  let body = "";
  const strong = { size: 15, weight: 700, anchor: /** @type {"start"} */ ("start") };

  /** Left edge of a picture that is `extra` wider than the plain rectangle. @param {number} extra */
  const left = (extra) => inX + gutL + Math.max(0, (inW - gutL - (m.n.s * cell + extra)) / 2);
  /** @param {number} px @param {number} top @param {number} h */
  const sideLabel = (px, top, h) => `<path d="M${f1(px - 7)} ${f1(top)}V${f1(top + h)}" stroke="${COLOR.ink}" stroke-width="1.5" fill="none"/>${text(px - 11, top + h / 2 + 5, String(a), { size: 15, weight: 700, anchor: "end" })}`;

  /** @param {{ step: number, n: number, form: string, name: string, caption: string, dashed?: boolean, kind: "joined" | "split" | "lone" }} k */
  const pictureCard = (k) => {
    const top = y;
    const gap = k.kind === "joined" ? 0 : GAP;
    const px = left(gap);
    const xw = c * cell;
    const bx = px + xw + gap;
    const topLabels = placeLabels(
      [
        { cx: px + xw / 2, str: `x = ${c}` },
        { cx: bx + (b * cell) / 2, str: String(b) },
      ],
      W,
      top + 52,
      17,
    );
    const ry = top + 52 + (topLabels.rows - 1) * 17 + 12;
    const rh = a * cell;
    let pic = "";
    /** @type {Array<{ cx: number, str: string }>} */
    let below = [];
    if (k.kind === "joined") {
      pic = part(k.step, cells(px, ry, c, a, cell, "x")) + part(k.step, cells(bx, ry, b, a, cell, "b"));
    } else if (k.kind === "split") {
      pic = part(k.step, cells(px, ry, c, a, cell, "x")) + part(k.step, cells(bx, ry, b, a, cell, "b"), `${-GAP},0`);
      below = [
        { cx: px + xw / 2, str: `${a} × ${c} = ${m.ax}` },
        { cx: bx + (b * cell) / 2, str: `${a} × ${b} = ${m.ab}` },
      ];
    } else {
      // the look-alike: only x is multiplied, b is one lonely strip, the rest of the rectangle is missing
      const missing = a > 1 ? `<rect x="${f1(bx)}" y="${f1(ry)}" width="${f1(b * cell)}" height="${f1((a - 1) * cell)}" fill="none" stroke="${COLOR.error}" stroke-width="1.6" stroke-dasharray="5 3"/>` : "";
      pic = part(k.step, cells(px, ry, c, a, cell, "x")) + part(k.step, cells(bx, ry + (a - 1) * cell, b, 1, cell, "b")) + part(k.step, missing);
      below = [
        { cx: px + xw / 2, str: `${a} × ${c} = ${m.ax}` },
        { cx: bx + (b * cell) / 2, str: pick(lang, `only ${b}`, `solo ${b}`) },
      ];
    }
    const bl = below.length ? placeLabels(below, W, ry + rh + 20, 17) : { svg: "", rows: 0 };
    const picBottom = ry + rh + (below.length ? 20 + (bl.rows - 1) * 17 + 6 : 4);
    const cap = textLines(inX, picBottom + 18, wrapWords(k.caption, inW, 13), 17, { size: 13, anchor: "start", fill: COLOR.muted });
    const h = cap.y - top - 4;
    const head = `${badge(PAD + 20, top + 22, k.n)}${text(PAD + 40, top + 29, k.form, { size: 18, weight: 700, anchor: "start" })}${text(PAD + cw - 12, top + 28, k.name, { size: 13, anchor: "end", fill: COLOR.muted })}`;
    body += group(k.step, `${frame(PAD, top, cw, h, k.dashed)}${head}${topLabels.svg}${pic}${bl.svg}${sideLabel(px, ry, rh)}${cap.svg}`);
    y = top + h;
  };

  // 1: one rectangle
  pictureCard({
    step: 1,
    n: 1,
    kind: "joined",
    form: m.groupedForm,
    name: pick(lang, "one rectangle", "un rectángulo"),
    caption: pick(lang, `A rectangle ${a} tall and (x + ${b}) wide. Here x is ${c}, so it is ${m.s} wide.`, `Un rectángulo de ${a} de alto y (x + ${b}) de ancho. Aquí x es ${c}, así que mide ${m.s} de ancho.`),
  });
  // 2: split into two partial products
  const mid = 42;
  body += group(2, downArrow(PAD + 24, y + 4, mid - 8, pick(lang, `multiply each part by ${a}`, `multiplica cada parte por ${a}`), cw - 60).svg, "ex-link");
  y += mid;
  pictureCard({
    step: 2,
    n: 2,
    kind: "split",
    form: `${a}x + ${a} × ${b}`,
    name: `= ${m.expandedForm}`,
    caption: pick(lang, `The ${a} reaches both parts: ${a} × x and ${a} × ${b}.`, `El ${a} llega a las dos partes: ${a} × x y ${a} × ${b}.`),
  });
  y += 10;

  // 3: both forms at the same x
  {
    const top = y;
    const l1 = wrapChain(`${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}`, inW, 15);
    const l2 = wrapChain(`${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}`, inW, 15);
    let cy = top + 72;
    const head = `${badge(PAD + 20, top + 22, 3)}${text(PAD + 40, top + 28, pick(lang, `Both forms at x = ${c}`, `Formas con x = ${c}`), { size: 16, weight: 700, anchor: "start" })}`;
    const n1 = text(inX, cy - 18, `${m.groupedForm}  (${pick(lang, "grouped", "agrupada")})`, { size: 13, anchor: "start", fill: COLOR.muted });
    const t1 = textLines(inX, cy, l1, 19, strong);
    cy = t1.y + 4;
    const n2 = text(inX, cy, `${m.expandedForm}  (${pick(lang, "expanded", "desarrollada")})`, { size: 13, anchor: "start", fill: COLOR.muted });
    const t2 = textLines(inX, cy + 18, l2, 19, strong);
    const h = t2.y - top + 2;
    body += group(3, `${frame(PAD, top, cw, h)}${head}${n1}${t1.svg}${n2}${t2.svg}`);
    y = top + h + 8;
    const ok = pill(PAD, y, cw, true, wrapWords(pick(lang, `Same value: both are ${m.totalText}.`, `Mismo valor: las dos son ${m.totalText}.`), cw - 50, 14, 700));
    body += group(3, ok.svg, "ex-link");
    y += ok.h + 14;
  }

  // 4: the a reaches only x (only when that really changes the value)
  if (m.differs) {
    pictureCard({
      step: 4,
      n: 4,
      kind: "lone",
      dashed: true,
      form: m.feeForm,
      name: pick(lang, "not this", "esto no"),
      caption: pick(lang, `The ${a} reaches only x. The ${b} stays alone, so (${a} − 1) × ${b} = ${m.short} is missing.`, `El ${a} llega solo a x. El ${b} queda solo, así que faltan (${a} − 1) × ${b} = ${m.short}.`),
    });
    y += 8;
    const no = pill(PAD, y, cw, false, wrapWords(pick(lang, `${a} × ${c} + ${b} = ${m.fee}, not ${m.totalText}.`, `${a} × ${c} + ${b} = ${m.fee}, no ${m.totalText}.`), cw - 50, 14, 700));
    body += group(4, no.svg, "ex-link");
    y += no.h;
  }
  return { body, width: W, height: Math.ceil(y + PAD) };
}

/** @param {M} m @param {"en" | "es"} lang */
export function describeDistribute(m, lang) {
  const { a, b, c } = m;
  const es = lang === "es";
  const out = [];
  out.push(es ? `Un rectángulo de ${a} de alto y (x + ${b}) de ancho representa ${m.groupedForm}. Aquí x es ${c}, así que el ancho es ${m.s}.` : `A rectangle ${a} tall and (x + ${b}) wide shows ${m.groupedForm}. Here x is ${c}, so the width is ${m.s}.`);
  out.push(es ? `Separamos el ancho en x y ${b} y multiplicamos cada parte por ${a}: ${a} × ${c} = ${m.ax} y ${a} × ${b} = ${m.ab}. La forma desarrollada es ${m.expandedForm}.` : `We split the width into x and ${b} and multiply each part by ${a}: ${a} × ${c} = ${m.ax} and ${a} × ${b} = ${m.ab}. The expanded form is ${m.expandedForm}.`);
  out.push(es ? `Con x = ${c}: ${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}, y ${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}. Las dos formas dan ${m.totalText}.` : `With x = ${c}: ${a}(${c} + ${b}) = ${a} × ${m.s} = ${m.totalText}, and ${a} × ${c} + ${a} × ${b} = ${m.ax} + ${m.ab} = ${m.expandedText}. Both forms give ${m.totalText}.`);
  if (m.differs) {
    out.push(es ? `Esto no: si el ${a} llega solo a x, queda ${m.feeForm}. ${a} × ${c} + ${b} = ${m.ax} + ${b} = ${m.fee}, no ${m.totalText}. Faltan (${a} − 1) × ${b} = ${m.short}, porque el ${b} no se multiplicó.` : `Not this: if the ${a} reaches only x, you get ${m.feeForm}. ${a} × ${c} + ${b} = ${m.ax} + ${b} = ${m.fee}, not ${m.totalText}. It is missing (${a} − 1) × ${b} = ${m.short}, because the ${b} was not multiplied.`);
  } else {
    out.push(es ? "Como a es 1, multiplicar por 1 no cambia nada, así que no hay una parecida distinta." : "Because a is 1, multiplying by one group changes nothing, so there is no different look-alike.");
  }
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export const distributeFigure = {
  id: "expression-area-distribute",
  keys: ["expression:distribute"],
  title: { en: "Splitting a rectangle: a(x + b) = ax + ab", es: "Partir un rectángulo: a(x + b) = ax + ab" },
  controls: () => expressionControls(),
  build: (_key, values) => ({ ...expressionModel(values), steps: expressionModel(values).differs ? 4 : 3 }),
  render: (model, o) => renderDistribute(model, o),
  scene: (root, model) => stepScene(root, model.steps),
  describe: (model, lang) => describeDistribute(model, lang),
};
