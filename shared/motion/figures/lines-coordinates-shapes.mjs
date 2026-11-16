// Coordinate-plane figures about shapes and mirrors: a rectangle from two opposite corners (7-7, 7-8) and a point reflected across
// each axis (7-9). Pure exact models, SVG renderers, scenes and text equivalents.
import { int } from "../exact.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { abs, clampW, f1, Flow, fmt, gapSay, marker, minus, nb, neg, num, pair, pick, quadrantOf, quadrantWords, step, stepScene, txt, wrongGap } from "./lines-coordinates-kit.mjs";
import { FILL, gridGeom, gridSvg, labelsFor, pointControls, points } from "./lines-coordinates-plane.mjs";

/** @typedef {import("../exact.mjs").Rat} Rat */

// ======================================================================================================================
// coordinates:rectangle  (7-7, 7-8)
// ======================================================================================================================
/** @param {unknown[]} values */
export function rectangleModel(values) {
  const p = points(values);
  const { a, b, c, d } = p;
  const w = abs(c.sub(a));
  const h = abs(d.sub(b));
  const corners = [
    { name: "A", x: a, y: b },
    { name: "C", x: c, y: b },
    { name: "B", x: c, y: d },
    { name: "D", x: a, y: d },
  ].map((k) => ({ ...k, quadrant: quadrantOf(k.x, k.y) }));
  const area = w.mul(h);
  return { ...p, w, h, area, perimeter: w.add(h).mul(int(2)), corners, flat: w.n === 0n || h.n === 0n, sumWrong: !w.add(h).eq(area), wrongH: wrongGap(a, c), wrongV: wrongGap(b, d) };
}
/** @typedef {ReturnType<typeof rectangleModel>} RectangleModel */

/** @param {RectangleModel} m @param {"en" | "es"} lang */
const sideLines = (m, lang) => [
  pick(lang, `Width: ${nb(`|${minus(m.c, m.a)}|`)} = ${fmt(m.w)}`, `Ancho: ${nb(`|${minus(m.c, m.a)}|`)} = ${fmt(m.w)}`),
  pick(lang, `Height: ${nb(`|${minus(m.d, m.b)}|`)} = ${fmt(m.h)}`, `Alto: ${nb(`|${minus(m.d, m.b)}|`)} = ${fmt(m.h)}`),
  pick(lang, `Perimeter: ${nb(`${fmt(m.w)} + ${fmt(m.h)} + ${fmt(m.w)} + ${fmt(m.h)}`)} = ${fmt(m.perimeter)}`, `Perímetro: ${nb(`${fmt(m.w)} + ${fmt(m.h)} + ${fmt(m.w)} + ${fmt(m.h)}`)} = ${fmt(m.perimeter)}`),
];
/** @param {RectangleModel} m @param {"en" | "es"} lang */
const rowsLine = (m, lang) => (m.flat ? pick(lang, "The width or the height is 0, so the corners make a line, not a rectangle.", "El ancho o el alto es 0, así que las esquinas forman una línea, no un rectángulo.") : pick(lang, `${fmt(m.h)} rows of ${fmt(m.w)} squares`, `${fmt(m.h)} filas de ${fmt(m.w)} cuadrados`));
/** @param {RectangleModel} m @param {"en" | "es"} lang */
const areaLine = (m, lang) => pick(lang, `Area: ${nb(`${fmt(m.w)} × ${fmt(m.h)}`)} = ${fmt(m.area)} square units`, `Área: ${nb(`${fmt(m.w)} × ${fmt(m.h)}`)} = ${fmt(m.area)} unidades cuadradas`);
/** @param {RectangleModel} m @param {"en" | "es"} lang */
function rectWrongs(m, lang) {
  /** @type {string[]} */
  const out = [];
  if (m.wrongH) out.push(pick(lang, `Not this: width = ${nb(m.wrongH.expr)} = ${fmt(m.wrongH.value)}. Find the gap between the x-values.`, `No: ancho = ${nb(m.wrongH.expr)} = ${fmt(m.wrongH.value)}. Halla el espacio entre los valores de x.`));
  if (m.wrongV && !m.wrongH) out.push(pick(lang, `Not this: height = ${nb(m.wrongV.expr)} = ${fmt(m.wrongV.value)}. Find the gap between the y-values.`, `No: alto = ${nb(m.wrongV.expr)} = ${fmt(m.wrongV.value)}. Halla el espacio entre los valores de y.`));
  if (m.sumWrong) out.push(pick(lang, `Not this: area = ${nb(`${fmt(m.w)} + ${fmt(m.h)}`)} = ${fmt(m.w.add(m.h))}. Area counts squares: multiply.`, `No: área = ${nb(`${fmt(m.w)} + ${fmt(m.h)}`)} = ${fmt(m.w.add(m.h))}. El área cuenta cuadrados: se multiplica.`));
  return out;
}

/** @param {RectangleModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderRectangle(m, { lang, width }) {
  const W = clampW(width);
  const g = gridGeom(W);
  const X = g.X;
  const Y = g.Y;
  const [x1, x2] = [Math.min(num(m.a), num(m.c)), Math.max(num(m.a), num(m.c))];
  const [y1, y2] = [Math.min(num(m.b), num(m.d)), Math.max(num(m.b), num(m.d))];
  let body = gridSvg(g);
  // area: one row of squares at a time (drawn first, so the outline sits on top of it)
  const rows = Number(m.h.n);
  if (!m.flat) {
    for (let r = 0; r < rows; r++) body += `<g class="lc-step" data-step="3" data-seq="${r}" data-of="${rows}"><rect x="${f1(X(x1))}" y="${f1(Y(y1 + r + 1))}" width="${f1(X(x2) - X(x1))}" height="${f1(g.u)}" fill="${COPY_FILLS[0]}" fill-opacity="0.4" stroke="${COLOR.ink}" stroke-opacity="0.5" stroke-width="1"/></g>`;
  }
  // the sides, traced in order A to C to B to D to A
  const order = [m.corners[0], m.corners[1], m.corners[2], m.corners[3], m.corners[0]];
  for (let i = 0; i < 4; i++) body += `<g class="lc-step" data-step="2" data-seq="${i}" data-of="4"><line x1="${f1(X(num(order[i].x)))}" y1="${f1(Y(num(order[i].y)))}" x2="${f1(X(num(order[i + 1].x)))}" y2="${f1(Y(num(order[i + 1].y)))}" stroke="${COLOR.navy}" stroke-width="3.6" stroke-linecap="round"/></g>`;
  let lens = "";
  if (m.w.n !== 0n) lens += txt((X(x1) + X(x2)) / 2, Y(y1) - 7, fmt(m.w), { weight: 700, halo: true });
  if (m.h.n !== 0n) lens += txt(m.w.n === 0n ? X(x2) + 8 : X(x2) - 7, (Y(y1) + Y(y2)) / 2 + 5, fmt(m.h), { weight: 700, halo: true, anchor: m.w.n === 0n ? "start" : "end" });
  body += step(2, lens);
  const shape = { A: "circle", B: "square", C: "diamond", D: "diamond" };
  const fill = { A: FILL.A, B: FILL.B, C: COPY_FILLS[1], D: COPY_FILLS[1] };
  let s1 = "";
  for (const k of m.corners) s1 += marker(/** @type {"circle"} */ (shape[/** @type {"A"} */ (k.name)]), X(num(k.x)), Y(num(k.y)), fill[/** @type {"A"} */ (k.name)]);
  body += step(1, s1 + labelsFor(m.corners, g, W));
  const f = new Flow(W);
  f.y = g.bottom + 30;
  let p1 = "";
  for (const k of m.corners) p1 += f.para(`${k.name} ${pair(k.x, k.y)}: ${quadrantWords(k.quadrant, lang)}`, { after: 2 });
  body += step(1, p1);
  f.y += 6;
  let p2 = "";
  for (const line of sideLines(m, lang)) p2 += f.para(line, { after: 2 });
  body += step(2, p2);
  f.y += 6;
  body += step(3, f.para(rowsLine(m, lang), { after: 8, fill: m.flat ? COLOR.error : COLOR.ink }));
  let s4 = f.box("ok", areaLine(m, lang));
  for (const w of rectWrongs(m, lang)) s4 += f.box("wrong", w);
  body += step(4, s4);
  return { body, width: W, height: Math.ceil(f.y + 4) };
}

/** @param {RectangleModel} m @param {"en" | "es"} lang */
function describeRectangle(m, lang) {
  const corners = m.corners.map((k) => `${k.name} ${pair(k.x, k.y)}, ${quadrantWords(k.quadrant, lang)}`).join("; ");
  return [pick(lang, "A coordinate grid with a rectangle whose opposite corners are A and B.", "Una cuadrícula con un rectángulo cuyas esquinas opuestas son A y B."), `${pick(lang, "Corners", "Esquinas")}: ${corners}.`, ...sideLines(m, lang).map((s) => `${s}.`), `${rowsLine(m, lang)}.`, `${areaLine(m, lang)}.`, ...rectWrongs(m, lang)].join(" ");
}

/** The area when the most common slip is made: adding width and height; else a side found by adding. Null when no card is drawn. @param {RectangleModel} m @param {"en" | "es"} lang */
function rectangleWrong(m, lang) {
  if (m.sumWrong) return { value: fmt(m.w.add(m.h)), say: pick(lang, "Added the width and the height instead of multiplying them.", "Sumó el ancho y el alto en vez de multiplicarlos.") };
  if (m.wrongH && !m.wrongH.value.mul(m.h).eq(m.area)) return { value: fmt(m.wrongH.value.mul(m.h)), say: gapSay(m.a, m.c, "x", lang) };
  if (m.wrongV && !m.w.mul(m.wrongV.value).eq(m.area)) return { value: fmt(m.w.mul(m.wrongV.value)), say: gapSay(m.b, m.d, "y", lang) };
  return null;
}

// ======================================================================================================================
// coordinates:reflect  (7-9)
// ======================================================================================================================
/** @param {unknown[]} values */
export function reflectModel(values) {
  const p = points(values);
  const { a, b, c, d } = p;
  const overX = { x: a, y: neg(b) };
  const overY = { x: neg(a), y: b };
  const flipped = { x: neg(a), y: neg(b) };
  const bothSigns = a.n !== 0n && b.n !== 0n;
  const isB = (/** @type {{x: Rat, y: Rat}} */ q) => q.x.eq(c) && q.y.eq(d);
  return { ...p, overX, overY, flipped, bothSigns, bAt: isB(overX) ? "x" : isB(overY) ? "y" : a.eq(c) && b.eq(d) ? "A" : null, movesX: b.n !== 0n, movesY: a.n !== 0n };
}
/** @typedef {ReturnType<typeof reflectModel>} ReflectModel */

/** The lesson's one number: the x-coordinate of A's reflection across the x-axis (it stays). The card is the both-signs slip. @param {ReflectModel} m @param {"en" | "es"} lang */
const reflectHeadline = (m, lang) => ({ label: pick(lang, "x-coordinate of the reflection of A across the x-axis", "Coordenada x del reflejo de A sobre el eje x"), value: fmt(m.overX.x) });
/** @param {ReflectModel} m @param {"en" | "es"} lang */
const reflectWrong = (m, lang) => (m.bothSigns ? { value: fmt(m.flipped.x), say: pick(lang, "Changed both signs, which is two reflections, not one.", "Cambió los dos signos, que son dos reflexiones, no una.") } : null);

/** @param {ReflectModel} m @param {"x" | "y"} axis @param {"en" | "es"} lang */
function axisText(m, axis, lang) {
  const x = axis === "x";
  const keep = x ? m.a : m.b;
  const from = x ? m.b : m.a;
  const to = x ? m.overX.y : m.overY.x;
  const image = x ? pair(m.overX.x, m.overX.y) : pair(m.overY.x, m.overY.y);
  const moves = x ? m.movesX : m.movesY;
  const rule = x ? "(x, y) → (x, −y)" : "(x, y) → (−x, y)";
  const name = x ? "y" : "x";
  const other = x ? "x" : "y";
  const head = pick(lang, `Across the ${axis}-axis: ${rule}, so ${pair(m.a, m.b)} → ${image}`, `Sobre el eje ${axis}: ${rule}, así que ${pair(m.a, m.b)} → ${image}`);
  const detail = moves ? pick(lang, `${name} changes sign (${fmt(from)} → ${fmt(to)}); ${other} stays ${fmt(keep)}.`, `${name} cambia de signo (${fmt(from)} → ${fmt(to)}); ${other} se queda en ${fmt(keep)}.`) : pick(lang, `${name} is 0, so A is on the ${axis}-axis and stays put.`, `${name} es 0, así que A está sobre el eje ${axis} y no se mueve.`);
  return { head, detail };
}
/** @param {ReflectModel} m @param {"en" | "es"} lang */
const distText = (m, lang) => {
  const dx = pick(lang, `A and A′ are each ${fmt(abs(m.b))} units from the x-axis, on opposite sides.`, `A y A′ están cada una a ${fmt(abs(m.b))} unidades del eje x, en lados opuestos.`);
  const dy = pick(lang, `A and A″ are each ${fmt(abs(m.a))} units from the y-axis, on opposite sides.`, `A y A″ están cada una a ${fmt(abs(m.a))} unidades del eje y, en lados opuestos.`);
  return [m.movesX ? dx : "", m.movesY ? dy : ""].filter(Boolean).join(" ");
};
/** @param {ReflectModel} m @param {"en" | "es"} lang */
const imagesLine = (m, lang) => pick(lang, `A′ = ${pair(m.overX.x, m.overX.y)} and A″ = ${pair(m.overY.x, m.overY.y)}`, `A′ = ${pair(m.overX.x, m.overX.y)} y A″ = ${pair(m.overY.x, m.overY.y)}`);
/** @param {ReflectModel} m @param {"en" | "es"} lang */
const bLine = (m, lang) => (m.bAt === "x" ? pick(lang, "B sits on A′, the image across the x-axis.", "B está sobre A′, la imagen sobre el eje x.") : m.bAt === "y" ? pick(lang, "B sits on A″, the image across the y-axis.", "B está sobre A″, la imagen sobre el eje y.") : "");
/** @param {ReflectModel} m @param {"en" | "es"} lang */
const flipBox = (m, lang) => (m.bothSigns ? pick(lang, `Not this: ${pair(m.flipped.x, m.flipped.y)} changes both signs. That is two reflections, one over each axis.`, `No: ${pair(m.flipped.x, m.flipped.y)} cambia los dos signos. Eso son dos reflexiones, una sobre cada eje.`) : "");

/** A thin line from a point to its image with a tick at the middle of each half: equal halves, equal distances. */
function connector(/** @type {import("./lines-coordinates-plane.mjs").Grid} */ g, /** @type {"x" | "y"} */ axis, /** @type {Rat} */ a, /** @type {Rat} */ b) {
  const x = num(a);
  const y = num(b);
  const st = `stroke="${COLOR.ink}" stroke-width="1.6"`;
  if (axis === "x") return `<line x1="${f1(g.X(x))}" y1="${f1(g.Y(y))}" x2="${f1(g.X(x))}" y2="${f1(g.Y(-y))}" ${st}/><line x1="${f1(g.X(x) - 5)}" y1="${f1(g.Y(y / 2))}" x2="${f1(g.X(x) + 5)}" y2="${f1(g.Y(y / 2))}" ${st}/><line x1="${f1(g.X(x) - 5)}" y1="${f1(g.Y(-y / 2))}" x2="${f1(g.X(x) + 5)}" y2="${f1(g.Y(-y / 2))}" ${st}/>`;
  return `<line x1="${f1(g.X(x))}" y1="${f1(g.Y(y))}" x2="${f1(g.X(-x))}" y2="${f1(g.Y(y))}" ${st}/><line x1="${f1(g.X(x / 2))}" y1="${f1(g.Y(y) - 5)}" x2="${f1(g.X(x / 2))}" y2="${f1(g.Y(y) + 5)}" ${st}/><line x1="${f1(g.X(-x / 2))}" y1="${f1(g.Y(y) - 5)}" x2="${f1(g.X(-x / 2))}" y2="${f1(g.Y(y) + 5)}" ${st}/>`;
}

/** @param {ReflectModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderReflect(m, { lang, width }) {
  const W = clampW(width);
  const g = gridGeom(W);
  const [ax, ay] = [g.X(num(m.a)), g.Y(num(m.b))];
  let body = gridSvg(g);
  const bName = m.bAt === "A" ? "A, B" : "A";
  body += step(1, marker("circle", ax, ay, FILL.A) + labelsFor([{ x: m.a, y: m.b, name: bName }], g, W));
  const bOnImage = m.bAt === "x" || m.bAt === "y";
  if (m.bAt !== "A") body += step(1, marker("ring", g.X(num(m.c)), g.Y(num(m.d)), COLOR.white) + (bOnImage ? "" : labelsFor([{ x: m.c, y: m.d, name: "B" }], g, W)));
  if (m.movesX) {
    const [qx, qy] = [g.X(num(m.overX.x)), g.Y(num(m.overX.y))];
    body += step(2, connector(g, "x", m.a, m.b));
    body += `<g class="lc-step" data-step="2" data-from="${f1(ax - qx)},${f1(ay - qy)}">${marker("diamond", qx, qy, COPY_FILLS[1])}${labelsFor([{ x: m.overX.x, y: m.overX.y, name: m.bAt === "x" ? "A′, B" : "A′" }], g, W)}</g>`;
  }
  if (m.movesY) {
    const [qx, qy] = [g.X(num(m.overY.x)), g.Y(num(m.overY.y))];
    body += step(3, connector(g, "y", m.a, m.b));
    body += `<g class="lc-step" data-step="3" data-from="${f1(ax - qx)},${f1(ay - qy)}">${marker("square", qx, qy, COPY_FILLS[3])}${labelsFor([{ x: m.overY.x, y: m.overY.y, name: m.bAt === "y" ? "A″, B" : "A″" }], g, W)}</g>`;
  }
  if (m.bothSigns) body += step(4, `<circle cx="${f1(g.X(num(m.flipped.x)))}" cy="${f1(g.Y(num(m.flipped.y)))}" r="12" fill="none" stroke="${COLOR.error}" stroke-width="2.4" stroke-dasharray="4 3"/>`);
  const f = new Flow(W);
  f.y = g.bottom + 30;
  body += step(1, f.para(pick(lang, `A ${pair(m.a, m.b)}. B ${pair(m.c, m.d)} is only for comparing.`, `A ${pair(m.a, m.b)}. B ${pair(m.c, m.d)} es solo para comparar.`), { weight: 700, after: 8 }));
  const tx = axisText(m, "x", lang);
  body += step(2, f.para(tx.head, { weight: 700, after: 2 }) + f.para(tx.detail, { after: 8 }));
  const ty = axisText(m, "y", lang);
  body += step(3, f.para(ty.head, { weight: 700, after: 2 }) + f.para(ty.detail, { after: 8 }));
  let s4 = f.para(`${distText(m, lang)} ${bLine(m, lang)}`.trim(), { after: 8, fill: COLOR.muted });
  s4 += f.box("ok", imagesLine(m, lang));
  const fb = flipBox(m, lang);
  if (fb) s4 += f.box("wrong", fb);
  body += step(4, s4);
  return { body, width: W, height: Math.ceil(f.y + 4) };
}

/** @param {ReflectModel} m @param {"en" | "es"} lang */
function describeReflect(m, lang) {
  const tx = axisText(m, "x", lang);
  const ty = axisText(m, "y", lang);
  return [pick(lang, `A coordinate grid with point A at ${pair(m.a, m.b)}. The axes are the mirrors. B at ${pair(m.c, m.d)} is only for comparing.`, `Una cuadrícula con el punto A en ${pair(m.a, m.b)}. Los ejes son los espejos. B en ${pair(m.c, m.d)} es solo para comparar.`), `${tx.head}.`, tx.detail, `${ty.head}.`, ty.detail, distText(m, lang), bLine(m, lang), `${imagesLine(m, lang)}.`, flipBox(m, lang)].filter(Boolean).join(" ");
}

export default [
  {
    id: "plane-rectangle",
    keys: ["coordinates:rectangle"],
    title: { en: "Rectangle on the grid: sides, perimeter and area from coordinates", es: "Rectángulo en la cuadrícula: lados, perímetro y área con coordenadas" },
    controls: pointControls,
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => rectangleModel(values),
    render: renderRectangle,
    scene: (/** @type {ParentNode} */ root) => stepScene(root, 4, 6400),
    describe: describeRectangle,
    headline: (/** @type {RectangleModel} */ m, /** @type {"en" | "es"} */ lang) => ({ label: pick(lang, "Area of the rectangle", "Área del rectángulo"), value: fmt(m.area) }),
    wrong: rectangleWrong,
  },
  {
    id: "plane-reflection",
    keys: ["coordinates:reflect"],
    title: { en: "Reflections: the axis is the mirror", es: "Reflexiones: el eje es el espejo" },
    controls: pointControls,
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => reflectModel(values),
    render: renderReflect,
    scene: (/** @type {ParentNode} */ root) => stepScene(root, 4, 6400),
    describe: describeReflect,
    headline: reflectHeadline,
    wrong: reflectWrong,
  },
];
