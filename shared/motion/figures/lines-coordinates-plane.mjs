// Coordinate-plane pieces shared by the plane figures (grid, labelled points, the counted street route) and two of the figures:
// distance on the plane (7-5, 7-6) and the reflect-predict bench (7-9).
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { abs, clampW, f1, Flow, fmt, marker, minus, MINUS, nb, num, PAD, pair, pick, sgn, step, stepScene, tw, txt, whole, wrongGap } from "./lines-coordinates-kit.mjs";

/** @typedef {import("../exact.mjs").Rat} Rat */

export const pointControls = () =>
  ["Point A: x", "Point A: y", "Point B: x", "Point B: y"].map((label) => ({ label, labelEs: label.replace("Point", "Punto"), min: -6, max: 6, step: 1 }));

/** Four coordinates, each a whole number from -6 to 6. @param {unknown[]} values */
export function points(values) {
  if (!Array.isArray(values) || values.length !== 4) throw new RangeError("expected four coordinates");
  const [a, b, c, d] = ["Point A: x", "Point A: y", "Point B: x", "Point B: y"].map((n, i) => whole(values[i], n));
  return { a, b, c, d };
}

/** Square grid for -6..6 on both axes, centred; room at the edges for tick labels and for point labels. @param {number} W */
export function gridGeom(W) {
  const gw = Math.min(360, W - 64);
  const u = gw / 12;
  const x0 = (W - gw) / 2;
  const y0 = 28;
  return { gw, u, x0, y0, bottom: y0 + gw, X: (/** @type {number} */ v) => x0 + (v + 6) * u, Y: (/** @type {number} */ v) => y0 + (6 - v) * u };
}
/** @typedef {ReturnType<typeof gridGeom>} Grid */

/** The grid, both axes (heavy), numbers along the left and bottom edges, and the axis names. @param {Grid} g */
export function gridSvg(g) {
  let s = `<rect x="${f1(g.x0)}" y="${f1(g.y0)}" width="${f1(g.gw)}" height="${f1(g.gw)}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1"/>`;
  for (let i = -6; i <= 6; i++) {
    const axisLine = i === 0;
    const stroke = axisLine ? `stroke="${COLOR.ink}" stroke-width="2.4"` : `stroke="${COLOR.muted}" stroke-opacity="0.3" stroke-width="1"`;
    s += `<line x1="${f1(g.X(i))}" y1="${f1(g.Y(6))}" x2="${f1(g.X(i))}" y2="${f1(g.Y(-6))}" ${stroke}/><line x1="${f1(g.X(-6))}" y1="${f1(g.Y(i))}" x2="${f1(g.X(6))}" y2="${f1(g.Y(i))}" ${stroke}/>`;
    const t = i < 0 ? `${MINUS}${-i}` : String(i);
    s += txt(g.X(i), g.bottom + 17, t, { size: 13, fill: COLOR.muted }) + txt(g.x0 - 6, g.Y(i) + 5, t, { size: 13, fill: COLOR.muted, anchor: "end" });
  }
  return s + txt(g.X(6) + 14, g.Y(0) + 5, "x", { weight: 700 }) + txt(g.X(0), g.y0 - 9, "y", { weight: 700 });
}

/**
 * A short label beside a point, pushed outward (away from the origin) so labels of nearby points do not meet.
 * @param {Grid} g @param {number} W @param {number} x @param {number} y plane coordinates @param {string} s
 */
export function pointLabel(g, W, x, y, s) {
  const right = x >= 0 || x === -6; // the left edge has the tick numbers beside it, so a label there points inward
  const w = tw(s, 14, 700);
  const px = g.X(x) + (right ? 10 : -10);
  const clamped = right ? Math.min(px, W - PAD - w) : Math.max(px, PAD + w);
  return txt(clamped, y > 0 || y === -6 ? g.Y(y) - 9 : y < 0 ? g.Y(y) + 20 : g.Y(y) - 10, s, { weight: 700, anchor: right ? "start" : "end", halo: true });
}

/** One label per distinct place: points that coincide share a label ("A, C"). @param {Array<{ x: Rat, y: Rat, name: string }>} pts */
export function labelsFor(pts, /** @type {Grid} */ g, /** @type {number} */ W) {
  /** @type {Map<string, { x: number, y: number, names: string[] }>} */
  const at = new Map();
  for (const p of pts) {
    const k = `${p.x},${p.y}`;
    const e = at.get(k) || { x: num(p.x), y: num(p.y), names: [] };
    e.names.push(p.name);
    at.set(k, e);
  }
  return [...at.values()].map((e) => pointLabel(g, W, e.x, e.y, e.names.join(", "))).join("");
}

export const FILL = { A: COPY_FILLS[0], B: COPY_FILLS[2] };

/**
 * The street route from A to B: across along A's row, then up or down along B's column. Both legs, a dot on every grid point
 * passed (they pop in one after another) and each leg's length. hStep and vStep are the scene steps they belong to.
 * @param {Grid} g @param {{ a: Rat, b: Rat, c: Rat, d: Rat }} p @param {{ hStep: number, vStep: number }} o
 */
export function route(g, p, { hStep, vStep }) {
  const { a, b, c, d } = p;
  const w = Number(abs(c.sub(a)).n);
  const h = Number(abs(d.sub(b)).n);
  const dirX = sgn(c.sub(a));
  const dirY = sgn(d.sub(b));
  const joint = hStep === vStep;
  const leg = `stroke="${COLOR.tealInk}" stroke-width="4" stroke-linecap="round"`;
  const dot = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ k, /** @type {number} */ of, /** @type {number} */ st) => `<g class="lc-step" data-step="${st}" data-seq="${k}" data-of="${of}"><circle cx="${f1(g.X(x))}" cy="${f1(g.Y(y))}" r="3.6" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.6"/></g>`;
  let hs = "";
  let vs = "";
  const ax = num(a);
  const by = num(b);
  const cx = num(c);
  if (w) {
    hs += `<line x1="${f1(g.X(ax))}" y1="${f1(g.Y(by))}" x2="${f1(g.X(cx))}" y2="${f1(g.Y(by))}" ${leg}/>`;
    const ly = g.Y(by) - 10 < g.y0 + 12 ? g.Y(by) + 22 : g.Y(by) - 10;
    hs += txt((g.X(ax) + g.X(cx)) / 2, ly, String(w), { weight: 700, halo: true });
  }
  if (h) {
    vs += `<line x1="${f1(g.X(cx))}" y1="${f1(g.Y(by))}" x2="${f1(g.X(cx))}" y2="${f1(g.Y(num(d)))}" ${leg}/>`;
    const right = cx <= 4;
    vs += txt(g.X(cx) + (right ? 10 : -10), (g.Y(by) + g.Y(num(d))) / 2 + 5, String(h), { weight: 700, halo: true, anchor: right ? "start" : "end" });
  }
  let dots = "";
  for (let k = 1; k <= w; k++) dots += dot(ax + dirX * k, by, k - 1, joint ? w + h : w, hStep);
  for (let k = 1; k <= h; k++) dots += dot(cx, by + dirY * k, (joint ? w : 0) + k - 1, joint ? w + h : h, vStep);
  return { w, h, hs, vs, dots };
}

/** @param {Rat} dx @param {"en" | "es"} lang  across */
const across = (dx, lang, /** @type {Rat} */ w) => (dx.n > 0n ? pick(lang, `${fmt(w)} ${w.n === 1n ? "step" : "steps"} right`, `${fmt(w)} ${w.n === 1n ? "paso" : "pasos"} a la derecha`) : dx.n < 0n ? pick(lang, `${fmt(w)} ${w.n === 1n ? "step" : "steps"} left`, `${fmt(w)} ${w.n === 1n ? "paso" : "pasos"} a la izquierda`) : pick(lang, "no steps", "0 pasos"));
/** @param {Rat} dy @param {"en" | "es"} lang */
const vertical = (dy, lang, /** @type {Rat} */ h) => (dy.n > 0n ? pick(lang, `${fmt(h)} ${h.n === 1n ? "step" : "steps"} up`, `${fmt(h)} ${h.n === 1n ? "paso" : "pasos"} hacia arriba`) : dy.n < 0n ? pick(lang, `${fmt(h)} ${h.n === 1n ? "step" : "steps"} down`, `${fmt(h)} ${h.n === 1n ? "paso" : "pasos"} hacia abajo`) : pick(lang, "no steps", "0 pasos"));

// ======================================================================================================================
// coordinates:distance  (7-5, 7-6)
// ======================================================================================================================
/** @param {unknown[]} values */
export function distanceModel(values) {
  const p = points(values);
  const dx = p.c.sub(p.a);
  const dy = p.d.sub(p.b);
  const w = abs(dx);
  const h = abs(dy);
  return { ...p, dx, dy, w, h, total: w.add(h), wrongH: wrongGap(p.a, p.c), wrongV: wrongGap(p.b, p.d) };
}
/** @typedef {ReturnType<typeof distanceModel>} DistanceModel */

/** The "Horizontal: |2 − (−3)| = 5, so 5 steps right" line. @param {DistanceModel} m @param {"en" | "es"} lang */
const acrossLine = (m, lang) => pick(lang, `Across: ${nb(`|${minus(m.c, m.a)}|`)} = ${fmt(m.w)}, so ${across(m.dx, lang, m.w)}`, `Horizontal: ${nb(`|${minus(m.c, m.a)}|`)} = ${fmt(m.w)}, o sea ${across(m.dx, lang, m.w)}`);
/** @param {DistanceModel} m @param {"en" | "es"} lang */
const upLine = (m, lang) => pick(lang, `Up or down: ${nb(`|${minus(m.d, m.b)}|`)} = ${fmt(m.h)}, so ${vertical(m.dy, lang, m.h)}`, `Vertical: ${nb(`|${minus(m.d, m.b)}|`)} = ${fmt(m.h)}, o sea ${vertical(m.dy, lang, m.h)}`);
/** The "not this" lines for the legs where adding gives a wrong gap. @param {DistanceModel} m @param {"en" | "es"} lang */
export function legWrongs(m, lang) {
  /** @type {string[]} */
  const out = [];
  if (m.wrongH) out.push(pick(lang, `Not this: across = ${nb(m.wrongH.expr)} = ${fmt(m.wrongH.value)}. Find the gap between the x-values.`, `No: horizontal = ${nb(m.wrongH.expr)} = ${fmt(m.wrongH.value)}. Halla el espacio entre los valores de x.`));
  if (m.wrongV) out.push(pick(lang, `Not this: up or down = ${nb(m.wrongV.expr)} = ${fmt(m.wrongV.value)}. Find the gap between the y-values.`, `No: vertical = ${nb(m.wrongV.expr)} = ${fmt(m.wrongV.value)}. Halla el espacio entre los valores de y.`));
  return out;
}
/** @param {DistanceModel} m @param {"en" | "es"} lang */
const totalLine = (m, lang) => pick(lang, `Total: ${fmt(m.w)} + ${fmt(m.h)} = ${fmt(m.total)} units`, `Total: ${fmt(m.w)} + ${fmt(m.h)} = ${fmt(m.total)} unidades`);

/** @param {DistanceModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderDistance(m, { lang, width }) {
  const W = clampW(width);
  const g = gridGeom(W);
  const r = route(g, m, { hStep: 2, vStep: 3 });
  const [ax, ay, bx, by, cx, cy] = [g.X(num(m.a)), g.Y(num(m.b)), g.X(num(m.c)), g.Y(num(m.d)), g.X(num(m.c)), g.Y(num(m.b))];
  let body = gridSvg(g);
  body += step(2, r.hs) + step(3, r.vs) + r.dots;
  body += step(1, marker("circle", ax, ay, FILL.A) + marker("square", bx, by, FILL.B) + labelsFor([{ x: m.a, y: m.b, name: "A" }, { x: m.c, y: m.d, name: "B" }], g, W));
  if (r.w + r.h > 0) body += `<g class="lc-step" data-step="2" data-span="2" data-walk="${f1(ax - bx)},${f1(ay - by)},${f1(cx - bx)},${f1(cy - by)}"><circle cx="${f1(bx)}" cy="${f1(by)}" r="11" fill="none" stroke="${COLOR.amber}" stroke-width="3.2"/></g>`;
  const f = new Flow(W);
  f.y = g.bottom + 30;
  body += step(1, f.para(pick(lang, `A ${pair(m.a, m.b)} and B ${pair(m.c, m.d)}`, `A ${pair(m.a, m.b)} y B ${pair(m.c, m.d)}`), { weight: 700 }));
  body += step(2, f.para(acrossLine(m, lang)));
  body += step(3, f.para(upLine(m, lang), { after: 8 }));
  let s4 = f.box("ok", totalLine(m, lang));
  for (const w of legWrongs(m, lang)) s4 += f.box("wrong", w);
  body += step(4, s4);
  return { body, width: W, height: Math.ceil(f.y + 4) };
}

/** @param {DistanceModel} m @param {"en" | "es"} lang */
function describeDistance(m, lang) {
  return [
    pick(lang, `A coordinate grid with A at ${pair(m.a, m.b)} and B at ${pair(m.c, m.d)}. The route goes along grid lines, across first and then up or down.`, `Una cuadrícula con A en ${pair(m.a, m.b)} y B en ${pair(m.c, m.d)}. El recorrido va por las líneas de la cuadrícula, primero horizontal y luego vertical.`),
    `${acrossLine(m, lang)}.`,
    `${upLine(m, lang)}.`,
    `${totalLine(m, lang)}.`,
    ...legWrongs(m, lang),
  ].join(" ");
}

// ======================================================================================================================
// coordinates:reflect-predict  (7-9)
// ======================================================================================================================
/** Which axis B mirrors A across ("x" flips y, "y" flips x), or null. A point on an axis is not told apart from its own image. @param {ReturnType<typeof points>} p */
export function mirrorAxis(p) {
  const { a, b, c, d } = p;
  if (a.eq(c) && b.n !== 0n && b.add(d).n === 0n) return "x";
  if (b.eq(d) && a.n !== 0n && a.add(c).n === 0n) return "y";
  return null;
}

/** @param {unknown[]} values */
export function predictModel(values) {
  const m = distanceModel(values);
  const axis = mirrorAxis(m);
  const flipped = m.a.n !== 0n && m.b.n !== 0n && m.a.add(m.c).n === 0n && m.b.add(m.d).n === 0n;
  return { ...m, axis, flipped };
}
/** @typedef {ReturnType<typeof predictModel>} PredictModel */

/** @param {PredictModel} m @param {"en" | "es"} lang */
function axisLines(m, lang) {
  const da = (/** @type {Rat} */ x, /** @type {Rat} */ y, /** @type {string} */ n) => pick(lang, `${n} ${pair(x, y)}: ${fmt(abs(x))} from the y-axis, ${fmt(abs(y))} from the x-axis.`, `${n} ${pair(x, y)}: a ${fmt(abs(x))} del eje y, a ${fmt(abs(y))} del eje x.`);
  return { a: da(m.a, m.b, "A"), b: da(m.c, m.d, "B") };
}
/** The sign table, shown only once B really is the mirror image. @param {PredictModel} m @param {"en" | "es"} lang */
function mirrorLines(m, lang) {
  if (!m.axis) return [];
  const row = (/** @type {string} */ n, /** @type {Rat} */ from, /** @type {Rat} */ to) => (from.eq(to) ? pick(lang, `${n}: ${fmt(from)} to ${fmt(to)}, stays the same`, `${n}: de ${fmt(from)} a ${fmt(to)}, igual`) : pick(lang, `${n}: ${fmt(from)} to ${fmt(to)}, the sign changed`, `${n}: de ${fmt(from)} a ${fmt(to)}, cambió el signo`));
  return [pick(lang, `B is the mirror image of A across the ${m.axis}-axis.`, `B es la imagen de A en el eje ${m.axis}.`), `${row("x", m.a, m.c)}; ${row("y", m.b, m.d)}.`];
}
/** @param {PredictModel} m @param {"en" | "es"} lang */
const flippedBox = (m, lang) => (m.flipped ? pick(lang, `Not this: ${pair(m.c, m.d)} changes both signs. That is two reflections, one over each axis.`, `No: ${pair(m.c, m.d)} cambia los dos signos. Eso son dos reflexiones, una sobre cada eje.`) : "");
/** @param {PredictModel} m @param {"en" | "es"} lang */
const predictTotal = (m, lang) => pick(lang, `Street route A to B: ${fmt(m.w)} + ${fmt(m.h)} = ${fmt(m.total)} units`, `Recorrido de A a B: ${fmt(m.w)} + ${fmt(m.h)} = ${fmt(m.total)} unidades`);

/** @param {PredictModel} m @param {{ lang: "en" | "es", width: number }} o */
function renderPredict(m, { lang, width }) {
  const W = clampW(width);
  const g = gridGeom(W);
  const r = route(g, m, { hStep: 3, vStep: 3 });
  const [ax, ay, bx, by] = [g.X(num(m.a)), g.Y(num(m.b)), g.X(num(m.c)), g.Y(num(m.d))];
  /** thin bars from a point to each axis @param {number} x @param {number} y @param {boolean} dashed */
  const bar = (x, y, dashed) => {
    const st = `stroke="${COLOR.muted}" stroke-width="1.8"${dashed ? ' stroke-dasharray="5 3"' : ""}`;
    return `<line x1="${f1(g.X(x))}" y1="${f1(g.Y(y))}" x2="${f1(g.X(0))}" y2="${f1(g.Y(y))}" ${st}/><line x1="${f1(g.X(x))}" y1="${f1(g.Y(y))}" x2="${f1(g.X(x))}" y2="${f1(g.Y(0))}" ${st}/>`;
  };
  let body = gridSvg(g);
  body += step(1, bar(num(m.a), num(m.b), false));
  body += step(3, r.hs + r.vs) + r.dots;
  body += step(1, marker("circle", ax, ay, FILL.A));
  const slide = m.axis ? ` data-from="${f1(ax - bx)},${f1(ay - by)}"` : "";
  const same = m.a.eq(m.c) && m.b.eq(m.d);
  body += step(1, labelsFor([{ x: m.a, y: m.b, name: same ? "A, B" : "A" }], g, W));
  body += `<g class="lc-step" data-step="2"${slide}>${bar(num(m.c), num(m.d), true)}${marker("square", bx, by, FILL.B)}${same ? "" : labelsFor([{ x: m.c, y: m.d, name: "B" }], g, W)}</g>`;
  const f = new Flow(W);
  f.y = g.bottom + 30;
  const t = axisLines(m, lang);
  body += step(1, f.para(t.a, { after: 4 }));
  body += step(2, f.para(t.b, { after: 4 }));
  if (m.axis) for (const line of mirrorLines(m, lang)) body += step(2, f.para(line, { weight: 700, after: 4 }));
  else body += step(2, f.para(pick(lang, "Move B to where you predict the mirror image of A lands, then check the distances.", "Mueve B adonde crees que cae la imagen de A, y luego revisa las distancias."), { fill: COLOR.muted, after: 4 }));
  f.y += 4;
  body += step(3, f.para(acrossLine(m, lang), { after: 2 }) + f.para(upLine(m, lang), { after: 8 }));
  let s4 = f.box("ok", predictTotal(m, lang));
  for (const w of legWrongs(m, lang)) s4 += f.box("wrong", w);
  const fb = flippedBox(m, lang);
  if (fb) s4 += f.box("wrong", fb);
  body += step(4, s4);
  return { body, width: W, height: Math.ceil(f.y + 4) };
}

/** @param {PredictModel} m @param {"en" | "es"} lang */
function describePredict(m, lang) {
  const t = axisLines(m, lang);
  return [pick(lang, "A coordinate grid with point A and point B. Thin bars show how far each point is from each axis.", "Una cuadrícula con el punto A y el punto B. Barras delgadas muestran qué tan lejos está cada punto de cada eje."), t.a, t.b, ...mirrorLines(m, lang), `${acrossLine(m, lang)}.`, `${upLine(m, lang)}.`, `${predictTotal(m, lang)}.`, ...legWrongs(m, lang), flippedBox(m, lang)].filter(Boolean).join(" ");
}

export default [
  {
    id: "plane-street-distance",
    keys: ["coordinates:distance"],
    title: { en: "Distance on the grid: count across, then up or down", es: "Distancia en la cuadrícula: cuenta en horizontal y luego en vertical" },
    controls: pointControls,
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => distanceModel(values),
    render: renderDistance,
    scene: (/** @type {ParentNode} */ root) => stepScene(root, 4, 6000),
    describe: describeDistance,
  },
  {
    id: "plane-reflect-predict",
    keys: ["coordinates:reflect-predict"],
    title: { en: "Reflect a point: the axis is the mirror", es: "Reflejar un punto: el eje es el espejo" },
    controls: pointControls,
    build: (/** @type {string} */ _key, /** @type {number[]} */ values) => predictModel(values),
    render: renderPredict,
    scene: (/** @type {ParentNode} */ root) => stepScene(root, 4, 6000),
    describe: describePredict,
  },
];
