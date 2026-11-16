// Number-line figures: opposites (7-1, 7-2), absolute value (7-3), compare and order (7-4).
// Each figure is a pure model (exact Rat arithmetic), a renderer that writes SVG only, a scene, and a text equivalent.
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { abs, bars, clampW, cmp, f1, Flow, fmt, half, marker, minus, MINUS, nb, neg, num, PAD, pick, sgn, step, stepScene, sym, tw, txt, whole, wrongGap } from "./lines-coordinates-kit.mjs";

/** @param {unknown[]} values @param {number} n */
function need(values, n) {
  if (!Array.isArray(values) || values.length !== n) throw new RangeError(`expected ${n} values`);
}
const locationControls = (/** @type {number} */ stepSize) => [
  { label: "First location", labelEs: "Primera ubicación", min: -10, max: 10, step: stepSize },
  { label: "Second location", labelEs: "Segunda ubicación", min: -10, max: 10, step: stepSize },
];

/** The axis: a line with ticks every unit (halves too when there is room), labels at a spacing that fits, and a taller zero. */
function axis(/** @type {number} */ W, /** @type {number} */ R, /** @type {number} */ y) {
  const x0 = PAD + 26;
  const x1 = W - PAD - 26;
  const mid = (x0 + x1) / 2;
  const unit = (x1 - x0) / (2 * R);
  const X = (/** @type {number} */ v) => mid + v * unit;
  const every = Math.max(1, Math.ceil(30 / unit));
  let svg = `<line x1="${f1(x0 - 8)}" y1="${y}" x2="${f1(x1 + 8)}" y2="${y}" stroke="${COLOR.ink}" stroke-width="2.4"/>`;
  svg += `<path d="M${f1(x0 - 8)} ${y - 5} L${f1(x0 - 14)} ${y} L${f1(x0 - 8)} ${y + 5} M${f1(x1 + 8)} ${y - 5} L${f1(x1 + 14)} ${y} L${f1(x1 + 8)} ${y + 5}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
  for (let i = -R; i <= R; i++) {
    const h = i === 0 ? 8 : 5;
    svg += `<line x1="${f1(X(i))}" y1="${y - h}" x2="${f1(X(i))}" y2="${y + h}" stroke="${COLOR.ink}" stroke-width="${i === 0 ? 2.4 : 1.4}"/>`;
    if (unit >= 22 && i < R) svg += `<line x1="${f1(X(i + 0.5))}" y1="${y - 3}" x2="${f1(X(i + 0.5))}" y2="${y + 3}" stroke="${COLOR.muted}" stroke-width="1"/>`;
    if (i % every === 0) svg += txt(X(i), y + 26, i < 0 ? `${MINUS}${-i}` : String(i), { size: 13, weight: i === 0 ? 700 : 400, fill: i === 0 ? COLOR.ink : COLOR.muted });
  }
  return { svg, X, unit, zero: X(0) };
}

/** A horizontal arrow from x1 to x2 with the head at x2 and a small tick at the start. */
function arrow(/** @type {number} */ x1, /** @type {number} */ x2, /** @type {number} */ y, color = COLOR.ink) {
  const len = Math.abs(x2 - x1);
  if (len < 1) return "";
  const d = x2 > x1 ? 1 : -1;
  const hd = Math.min(9, len * 0.75);
  const hh = Math.min(5, len * 0.45);
  return `<path d="M${f1(x1)} ${y - 5} L${f1(x1)} ${y + 5} M${f1(x1)} ${y} L${f1(x2)} ${y} M${f1(x2 - d * hd)} ${f1(y - hh)} L${f1(x2)} ${y} L${f1(x2 - d * hd)} ${f1(y + hh)}" fill="none" stroke="${color}" stroke-width="2.6"/>`;
}

/** A label centred at cx, kept inside the picture and (optionally) on one side of a limit so two labels never meet. */
function label(/** @type {number} */ W, /** @type {number} */ cx, /** @type {number} */ y, /** @type {string} */ s, /** @type {{side?: "left" | "right", limit?: number, size?: number, weight?: number, fill?: string}} */ o = {}) {
  const { size = 14, weight = 700, fill = COLOR.ink } = o;
  const w = tw(s, size, weight);
  let c = cx;
  if (o.side === "left" && o.limit !== undefined) c = Math.min(c, o.limit - w / 2);
  if (o.side === "right" && o.limit !== undefined) c = Math.max(c, o.limit + w / 2);
  c = Math.max(PAD + w / 2, Math.min(W - PAD - w / 2, c));
  return txt(c, y, s, { size, weight, fill });
}

/** Labels above points that never overlap: the left label grows leftwards, the right one rightwards. */
function pointLabel(/** @type {number} */ W, /** @type {number} */ px, /** @type {number} */ y, /** @type {string} */ s, /** @type {"left" | "right" | "mid"} */ side) {
  const w = tw(s, 14, 700);
  if (side === "left") return txt(Math.max(PAD + w, px + 2), y, s, { weight: 700, anchor: "end" });
  if (side === "right") return txt(Math.min(W - PAD - w, px - 2), y, s, { weight: 700, anchor: "start" });
  return txt(Math.max(PAD + w / 2, Math.min(W - PAD - w / 2, px)), y, s, { weight: 700 });
}

const mirrorLine = (/** @type {number} */ x, /** @type {number} */ y1, /** @type {number} */ y2) => `<line x1="${f1(x)}" y1="${y1}" x2="${f1(x)}" y2="${y2}" stroke="${COLOR.muted}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
const reach = (/** @type {import("../exact.mjs").Rat[]} */ rs) => Math.max(...rs.map((r) => Math.abs(num(r))));
const rangeFor = (/** @type {number} */ r) => Math.max(4, Math.ceil(r) + 1);
const frame = (/** @type {number} */ W, /** @type {number} */ height, /** @type {string} */ body) => ({ body, width: W, height: Math.ceil(height + 4) });

// ======================================================================================================================
// line:opposites  (7-1, 7-2)
// ======================================================================================================================
/** @param {unknown[]} values */
export function oppositesModel(values) {
  need(values, 2);
  const rows = [half(values[0], "First location"), half(values[1], "Second location")].map((x) => ({ x, opposite: neg(x), distance: abs(x) }));
  return { rows, R: rangeFor(reach(rows.map((r) => r.x))), wrong: rows[0].x.n < 0n };
}
/** @typedef {ReturnType<typeof oppositesModel>} OppositesModel */

/** @param {OppositesModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderOpposites(m, { lang, width }) {
  const W = clampW(width);
  const f = new Flow(W);
  let body = "";
  m.rows.forEach((row, idx) => {
    const top = f.y;
    const y = top + 64;
    const yArr = top + 110;
    const ax = axis(W, m.R, y);
    const { x, opposite, distance } = row;
    const own = x.n === 0n;
    const head = pick(lang, idx ? "Second location" : "First location", idx ? "Segunda ubicación" : "Primera ubicación");
    body += txt(PAD, top + 14, `${head}: ${fmt(x)}`, { weight: 700, anchor: "start" }) + ax.svg + mirrorLine(ax.zero, y - 30, yArr + 6);
    const px = ax.X(num(x));
    const qx = ax.X(num(opposite));
    const left = x.n < 0n;
    // step 1: the location and the distance walked to zero
    let s1 = marker("circle", px, y, COPY_FILLS[0]) + pointLabel(W, px, y - 14, fmt(x), own ? "mid" : left ? "left" : "right");
    if (own) s1 += label(W, px, yArr + 4, `${bars(x)} = 0`);
    else s1 += arrow(ax.zero, px, yArr) + label(W, (px + ax.zero) / 2, yArr + 22, nb(`${bars(x)} = ${fmt(distance)}`), { side: left ? "left" : "right", limit: ax.zero + (left ? -3 : 3) });
    body += step(1, s1);
    // step 2: the opposite slides across zero to its mirror place; its distance is drawn beside the first
    if (!own) {
      const slide = marker("diamond", qx, y, COPY_FILLS[1]) + pointLabel(W, qx, y - 14, nb(`${MINUS}(${fmt(x)}) = ${fmt(opposite)}`), left ? "right" : "left");
      body += `<g class="lc-step" data-step="2" data-from="${f1(px - qx)},0">${slide}</g>`;
      body += step(2, arrow(ax.zero, qx, yArr) + label(W, (qx + ax.zero) / 2, yArr + 22, nb(`${bars(opposite)} = ${fmt(distance)}`), { side: left ? "right" : "left", limit: ax.zero + (left ? 3 : -3) }));
    } else body += step(2, txt(W / 2, y - 40, pick(lang, "0 is its own opposite", "el 0 es su propio opuesto"), { weight: 700 }));
    f.y = top + 142;
    // step 3: the equal distances, in words and symbols
    const ok = own ? pick(lang, "|0| = 0: zero is its own opposite, 0 units from 0", "|0| = 0: el cero es su propio opuesto, a 0 unidades del 0") : pick(lang, `${nb(bars(x))} = ${nb(bars(opposite))} = ${fmt(distance)}: the same distance from 0, on opposite sides`, `${nb(bars(x))} = ${nb(bars(opposite))} = ${fmt(distance)}: la misma distancia del 0, en lados opuestos`);
    body += step(3, f.box("ok", ok));
    if (idx === 0 && m.wrong) body += step(3, f.box("wrong", pick(lang, `Not this: the opposite of ${fmt(x)} is ${fmt(x)}. The opposite is on the other side of 0.`, `No: el opuesto de ${fmt(x)} no es ${fmt(x)}. El opuesto está del otro lado del 0.`)));
    f.y += 6;
  });
  return frame(W, f.y, body);
}

/** @param {OppositesModel} m @param {"en" | "es"} lang */
function describeOpposites(m, lang) {
  const parts = m.rows.map((r, i) => {
    const name = pick(lang, i ? "Second location" : "First location", i ? "Segunda ubicación" : "Primera ubicación");
    if (r.x.n === 0n) return pick(lang, `${name} is 0. Zero is its own opposite and is 0 units from 0.`, `${name} es 0. El cero es su propio opuesto y está a 0 unidades del 0.`);
    return pick(lang, `${name} is ${fmt(r.x)}. Its opposite is ${fmt(r.opposite)}, the mirror place on the other side of 0. ${bars(r.x)} = ${fmt(r.distance)} and ${bars(r.opposite)} = ${fmt(r.distance)}: equal distances from 0.`, `${name} es ${fmt(r.x)}. Su opuesto es ${fmt(r.opposite)}, el lugar reflejado del otro lado del 0. ${bars(r.x)} = ${fmt(r.distance)} y ${bars(r.opposite)} = ${fmt(r.distance)}: distancias iguales al 0.`);
  });
  const w = m.wrong ? pick(lang, ` Not this: the opposite of ${fmt(m.rows[0].x)} is not ${fmt(m.rows[0].x)}.`, ` No: el opuesto de ${fmt(m.rows[0].x)} no es ${fmt(m.rows[0].x)}.`) : "";
  return `${pick(lang, "Two number lines, one for each location, with zero marked.", "Dos rectas numéricas, una por cada ubicación, con el 0 marcado.")} ${parts.join(" ")}${w}`;
}

// ======================================================================================================================
// line:absolute  (7-3, 7-4)
// ======================================================================================================================
/** The labels over A and B: one label when they sit on the same number. */
function abLabels(/** @type {number} */ W, /** @type {number} */ y, /** @type {(v: number) => number} */ X, /** @type {import("../exact.mjs").Rat} */ A, /** @type {import("../exact.mjs").Rat} */ B) {
  const c = cmp(A, B);
  if (c === 0) return pointLabel(W, X(num(A)), y, `A, B: ${fmt(A)}`, "mid");
  const aLeft = c < 0;
  return pointLabel(W, X(num(A)), y, `A: ${fmt(A)}`, aLeft ? "left" : "right") + pointLabel(W, X(num(B)), y, `B: ${fmt(B)}`, aLeft ? "right" : "left");
}
/** @param {import("../exact.mjs").Rat} a @param {import("../exact.mjs").Rat} b */
const abMarkers = (a, b, /** @type {(v: number) => number} */ X, /** @type {number} */ y) => marker("circle", X(num(a)), y, COPY_FILLS[0]) + marker("square", X(num(b)), y, COPY_FILLS[2]);

/** @param {unknown[]} values */
export function absoluteModel(values) {
  need(values, 2);
  const A = half(values[0], "First location");
  const B = half(values[1], "Second location");
  const between = abs(A.sub(B));
  const order = cmp(A, B);
  const byAbs = cmp(abs(A), abs(B));
  const gap = wrongGap(A, B);
  /** @type {{ kind: "order" | "gap" | "sign", a: string, b: string } | null} */
  let second = null;
  if (gap) second = { kind: "gap", a: gap.expr, b: fmt(gap.value) };
  else if (order < 0) second = { kind: "sign", a: minus(A, B), b: fmt(A.sub(B)) };
  return {
    A,
    B,
    absA: abs(A),
    absB: abs(B),
    between,
    order,
    byAbs,
    orderWrong: byAbs !== order,
    second,
    R: rangeFor(reach([A, B])),
    sorted: order <= 0 ? [A, B] : [B, A],
  };
}
/** @typedef {ReturnType<typeof absoluteModel>} AbsoluteModel */

/** @param {AbsoluteModel} m @param {"en" | "es"} lang */
function compareText(m, lang) {
  const { A, B, order } = m;
  const list = `${fmt(m.sorted[0])}, ${fmt(m.sorted[1])}`;
  if (order === 0) return pick(lang, `${fmt(A)} = ${fmt(B)}: A and B are at the same place.`, `${fmt(A)} = ${fmt(B)}: A y B están en el mismo lugar.`);
  const bigger = order < 0 ? "B" : "A";
  return pick(lang, `${fmt(A)} ${sym(order)} ${fmt(B)}: ${bigger} is farther right, so ${bigger} is greater. In order: ${list}.`, `${fmt(A)} ${sym(order)} ${fmt(B)}: ${bigger} está más a la derecha, así que ${bigger} es mayor. En orden: ${list}.`);
}

/** @param {AbsoluteModel} m @param {"en" | "es"} lang */
function wrongBoxes(m, lang) {
  /** @type {string[]} */
  const out = [];
  if (m.orderWrong) {
    const w = sym(m.byAbs);
    out.push(pick(lang, `Not this: ${bars(m.A)} ${w} ${bars(m.B)}, so ${fmt(m.A)} ${w} ${fmt(m.B)}. Farther from 0 does not mean greater.`, `No: ${bars(m.A)} ${w} ${bars(m.B)}, así que ${fmt(m.A)} ${w} ${fmt(m.B)}. Más lejos del 0 no significa mayor.`));
  }
  const s = m.second;
  if (s?.kind === "gap") out.push(pick(lang, `Not this: ${s.a} = ${s.b}. The distance is the gap between A and B.`, `No: ${s.a} = ${s.b}. La distancia es el espacio entre A y B.`));
  if (s?.kind === "sign") out.push(pick(lang, `Not this: ${s.a} = ${s.b}. A distance is never negative.`, `No: ${s.a} = ${s.b}. Una distancia nunca es negativa.`));
  return out;
}

/** @param {AbsoluteModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderAbsolute(m, { lang, width }) {
  const W = clampW(width);
  const top = PAD;
  const y = top + 40;
  const ax = axis(W, m.R, y);
  const [yA, yB, yD] = [y + 52, y + 92, y + 134];
  const X = ax.X;
  let body = ax.svg + mirrorLine(ax.zero, y - 30, yD + 8);
  body += step(1, abMarkers(m.A, m.B, X, y) + abLabels(W, y - 14, X, m.A, m.B));
  /** @param {import("../exact.mjs").Rat} r @param {string} name @param {number} yy */
  const walk = (r, name, yy) => {
    const px = X(num(r));
    const left = r.n < 0n;
    const lab = nb(`${name}: ${bars(r)} = ${fmt(abs(r))}`);
    if (r.n === 0n) return label(W, ax.zero, yy + 4, lab);
    return arrow(px, ax.zero, yy) + label(W, (px + ax.zero) / 2, yy + 22, lab, { side: left ? "left" : "right", limit: ax.zero + (left ? -3 : 3) });
  };
  body += step(2, walk(m.A, "A", yA));
  body += step(3, walk(m.B, "B", yB));
  const xa = X(num(m.A));
  const xb = X(num(m.B));
  let s4 = "";
  if (m.between.n !== 0n) s4 += `<path d="M${f1(xa)} ${yD - 6} L${f1(xa)} ${yD + 6} M${f1(xb)} ${yD - 6} L${f1(xb)} ${yD + 6} M${f1(xa)} ${yD} L${f1(xb)} ${yD}" fill="none" stroke="${COLOR.tealInk}" stroke-width="3.2"/>`;
  s4 += label(W, (xa + xb) / 2, yD + 24, nb(`|${minus(m.A, m.B)}| = ${fmt(m.between)}`), { fill: COLOR.tealInk });
  const f = new Flow(W);
  f.y = yD + 40;
  s4 += f.para(compareText(m, lang), { after: 8 });
  s4 += f.box("ok", pick(lang, `Distance from A to B: ${nb(`|${minus(m.A, m.B)}|`)} = ${fmt(m.between)} units`, `Distancia de A a B: ${nb(`|${minus(m.A, m.B)}|`)} = ${fmt(m.between)} unidades`));
  for (const w of wrongBoxes(m, lang)) s4 += f.box("wrong", w);
  body += step(4, s4);
  return frame(W, f.y, body);
}

/** @param {AbsoluteModel} m @param {"en" | "es"} lang */
function describeAbsolute(m, lang) {
  const { A, B } = m;
  const walk = (/** @type {import("../exact.mjs").Rat} */ r, /** @type {string} */ n) => pick(lang, `${n} is at ${fmt(r)}. Walking to 0 takes ${fmt(abs(r))} units, so ${bars(r)} = ${fmt(abs(r))}.`, `${n} está en ${fmt(r)}. Caminar hasta el 0 son ${fmt(abs(r))} unidades, así que ${bars(r)} = ${fmt(abs(r))}.`);
  const dist = pick(lang, `The distance from A to B is |${minus(A, B)}| = ${fmt(m.between)} units.`, `La distancia de A a B es |${minus(A, B)}| = ${fmt(m.between)} unidades.`);
  return [pick(lang, "A number line with zero marked and the two locations A and B.", "Una recta numérica con el 0 marcado y las dos ubicaciones A y B."), walk(A, "A"), walk(B, "B"), compareText(m, lang), dist, ...wrongBoxes(m, lang)].join(" ");
}

// ======================================================================================================================
// line:order  (7-4)  whole numbers; the signed step from the first location to the second
// ======================================================================================================================
/** @param {unknown[]} values */
export function orderModel(values) {
  need(values, 2);
  const A = whole(values[0], "First location", 10);
  const B = whole(values[1], "Second location", 10);
  const gap = B.sub(A);
  const order = cmp(A, B);
  const byDigits = cmp(abs(A), abs(B));
  return { A, B, gap, steps: abs(gap), order, byDigits, digitsWrong: byDigits !== order, R: rangeFor(reach([A, B])), sorted: order <= 0 ? [A, B] : [B, A] };
}
/** @typedef {ReturnType<typeof orderModel>} OrderModel */

/** @param {OrderModel} m @param {"en" | "es"} lang */
function stepWords(m, lang) {
  const n = fmt(m.steps);
  if (m.gap.n === 0n) return pick(lang, "no steps", "0 pasos");
  const one = m.steps.n === 1n;
  if (m.gap.n > 0n) return pick(lang, `${n} ${one ? "step" : "steps"} right`, `${n} ${one ? "paso" : "pasos"} a la derecha`);
  return pick(lang, `${n} ${one ? "step" : "steps"} left`, `${n} ${one ? "paso" : "pasos"} a la izquierda`);
}
/** @param {OrderModel} m @param {"en" | "es"} lang */
function orderSentence(m, lang) {
  const { A, B, order } = m;
  if (order === 0) return pick(lang, `${fmt(A)} = ${fmt(B)}: same place, so the numbers are equal.`, `${fmt(A)} = ${fmt(B)}: el mismo lugar, así que los números son iguales.`);
  const list = `${fmt(m.sorted[0])}, ${fmt(m.sorted[1])}`;
  const farther = pick(lang, order < 0 ? "B is to the right of A" : "A is to the right of B", order < 0 ? "B está a la derecha de A" : "A está a la derecha de B");
  return pick(lang, `${fmt(A)} ${sym(order)} ${fmt(B)}: ${farther}, and farther right is greater. From least to greatest: ${list}.`, `${fmt(A)} ${sym(order)} ${fmt(B)}: ${farther}, y más a la derecha es mayor. De menor a mayor: ${list}.`);
}
/** @param {OrderModel} m @param {"en" | "es"} lang */
function digitsBox(m, lang) {
  if (!m.digitsWrong) return "";
  const w = sym(m.byDigits);
  return pick(lang, `Not this: ${fmt(abs(m.A))} ${w} ${fmt(abs(m.B))}, so ${fmt(m.A)} ${w} ${fmt(m.B)}. Only the place on the line decides.`, `No: ${fmt(abs(m.A))} ${w} ${fmt(abs(m.B))}, así que ${fmt(m.A)} ${w} ${fmt(m.B)}. Solo importa el lugar en la recta.`);
}

/** @param {OrderModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderOrder(m, { lang, width }) {
  const W = clampW(width);
  const y = PAD + 40;
  const ax = axis(W, m.R, y);
  const yW = y + 52;
  const X = ax.X;
  const xa = X(num(m.A));
  const xb = X(num(m.B));
  let body = ax.svg + step(1, abMarkers(m.A, m.B, X, y) + abLabels(W, y - 14, X, m.A, m.B));
  let s2 = arrow(xa, xb, yW, COLOR.tealInk);
  s2 += label(W, (xa + xb) / 2, yW + 24, stepWords(m, lang), { fill: COLOR.tealInk });
  body += step(2, s2);
  // the counted steps: one dot at each whole number passed, popping in one after another
  const dir = m.gap.n > 0n ? 1 : -1;
  const n = Number(m.steps.n);
  for (let k = 1; k < n; k++) {
    const x = X(num(m.A) + dir * k);
    body += `<g class="lc-step" data-step="2" data-seq="${k - 1}" data-of="${n - 1}"><circle cx="${f1(x)}" cy="${yW}" r="4" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.6"/></g>`;
  }
  const f = new Flow(W);
  f.y = yW + 40;
  let s3 = f.para(orderSentence(m, lang), { after: 8 });
  s3 += f.box("ok", pick(lang, `From A to B: ${nb(minus(m.B, m.A))} = ${fmt(m.gap)}, so ${stepWords(m, lang)}`, `De A a B: ${nb(minus(m.B, m.A))} = ${fmt(m.gap)}, o sea ${stepWords(m, lang)}`));
  const wrongText = digitsBox(m, lang);
  if (wrongText) s3 += f.box("wrong", wrongText);
  body += step(3, s3);
  return frame(W, f.y, body);
}

/** @param {OrderModel} m @param {"en" | "es"} lang */
function describeOrder(m, lang) {
  return [
    pick(lang, `A number line with the first location A at ${fmt(m.A)} and the second location B at ${fmt(m.B)}.`, `Una recta numérica con la primera ubicación A en ${fmt(m.A)} y la segunda ubicación B en ${fmt(m.B)}.`),
    pick(lang, `Going from A to B is ${nb(minus(m.B, m.A))} = ${fmt(m.gap)}: ${stepWords(m, lang)}. Right is positive and left is negative.`, `Ir de A a B es ${nb(minus(m.B, m.A))} = ${fmt(m.gap)}: ${stepWords(m, lang)}. La derecha es positiva y la izquierda es negativa.`),
    orderSentence(m, lang),
    digitsBox(m, lang),
  ]
    .filter(Boolean)
    .join(" ");
}

// ---- headline and wrong: the one number each lesson asks for, and the wrong result of the dashed card -------------------
/** @param {OppositesModel} m @param {"en" | "es"} lang */
const oppositesHeadline = (m, lang) => ({ label: pick(lang, "Distance of the first location from 0", "Distancia de la primera ubicación al 0"), value: fmt(m.rows[0].distance) });
/** The card says the opposite of a negative number is that same number. @param {OppositesModel} m @param {"en" | "es"} lang */
const oppositesWrong = (m, lang) => (m.wrong ? { value: fmt(m.rows[0].x), say: pick(lang, "Kept the same sign, so the opposite stayed on the same side of 0.", "Dejó el mismo signo, así que el opuesto quedó del mismo lado del 0.") } : null);

/** @param {AbsoluteModel} m @param {"en" | "es"} lang */
const absoluteHeadline = (m, lang) => ({ label: pick(lang, "Distance between the two locations", "Distancia entre las dos ubicaciones"), value: fmt(m.between) });
/** The distance cards (adding, or a negative distance); the "greater absolute value" card is about order, not about this number. @param {AbsoluteModel} m @param {"en" | "es"} lang */
function absoluteWrong(m, lang) {
  const s = m.second;
  if (!s) return null;
  if (s.kind === "sign") return { value: s.b, say: pick(lang, "Subtracted without taking the absolute value, so the distance came out negative.", "Restó sin usar el valor absoluto, y la distancia salió negativa.") };
  const same = sgn(m.A) * sgn(m.B) > 0;
  return { value: s.b, say: same ? pick(lang, "Added the distances from 0 instead of finding the gap between the locations.", "Sumó las distancias al 0 en vez de hallar el espacio entre las ubicaciones.") : pick(lang, "Added the two numbers instead of finding the gap between the locations.", "Sumó los dos números en vez de hallar el espacio entre las ubicaciones.") };
}

/** @param {OrderModel} m @param {"en" | "es"} lang */
const orderHeadline = (m, lang) => ({ label: pick(lang, "Steps from the first to the second location (right is positive)", "Pasos de la primera a la segunda ubicación (a la derecha es positivo)"), value: fmt(m.gap) });
/** Judging by digits puts the locations the wrong way round, so the steps come out with the wrong sign. @param {OrderModel} m @param {"en" | "es"} lang */
const orderWrong = (m, lang) => (m.digitsWrong && m.gap.n !== 0n ? { value: fmt(neg(m.gap)), say: pick(lang, "Compared the digits instead of the places on the line, so counted the steps the wrong way.", "Comparó los dígitos en vez de los lugares en la recta, y contó los pasos en el sentido equivocado.") } : null);

// ======================================================================================================================
/** @param {string} id @param {string[]} keys @param {{en: string, es: string}} title @param {number} stepSize @param {number} count @param {number} ms */
const make = (id, keys, title, stepSize, count, ms) => ({ id, keys, title, controls: () => locationControls(stepSize), scene: (/** @type {ParentNode} */ root) => stepScene(root, count, ms) });

export default [
  {
    ...make("number-line-opposites", ["line:opposites"], { en: "Opposites: the same distance from 0, on opposite sides", es: "Opuestos: la misma distancia del 0, en lados opuestos" }, 0.5, 3, 4200),
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => oppositesModel(values),
    render: renderOpposites,
    thinkWrong: false, // the dashed card is about which side the opposite is on, the question asks for a distance
    describe: describeOpposites,
    headline: oppositesHeadline,
    wrong: oppositesWrong,
  },
  {
    ...make("number-line-absolute", ["line:absolute"], { en: "Absolute value: the distance walked to 0", es: "Valor absoluto: la distancia que se camina hasta el 0" }, 0.5, 4, 5600),
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => absoluteModel(values),
    render: renderAbsolute,
    describe: describeAbsolute,
    headline: absoluteHeadline,
    wrong: absoluteWrong,
  },
  {
    ...make("number-line-order", ["line:order"], { en: "Compare and order: farther right is greater", es: "Comparar y ordenar: más a la derecha es mayor" }, 1, 3, 4600),
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => orderModel(values),
    render: renderOrder,
    describe: describeOrder,
    headline: orderHeadline,
    wrong: orderWrong,
  },
];
