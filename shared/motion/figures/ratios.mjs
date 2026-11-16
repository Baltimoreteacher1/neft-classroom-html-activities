// Motion figures: ratios. See docs/motion-figure-contract.md.
//   ratio-part-whole     ratio:tape                                 one tape, part to part and part to whole
//   ratio-double-line    ratio:mixer, ratio:unit-rate               double number line + ratio table, ×2 and ÷ to 1
//   ratio-compare        ratio:compare, ratio:patterns              two mixes brought to the same white
//   rate-unit-price      rate:shopping                              ÷ to 1 item, against a fixed offer
//   ratio-graph          growth:ratio-graph, growth:rider           ratio table and its graph
//   conversion-chain     conversion:expedition, conversion:scale    unit ratio, ratio table and a chain of cancelling tiles
// The mathematics is in ratios-calc.mjs, the pictures in ratios-draw/lines/views.mjs, the words in ratios-words.mjs.
import { R, compareModel, convModel, doubleLine, graphModel, num, OFFER, rateModel, REF, show, tapeModel, txt } from "./ratios-calc.mjs";
import { answerBox, atomsOf, caption, notBox, PAD, sceneOf, table, tw, weights } from "./ratios-draw.mjs";
import { compareLine, dnl } from "./ratios-lines.mjs";
import { chain, flipped, graph, ratioRows, swatch, tape } from "./ratios-views.mjs";
import * as F from "./ratios-flow.mjs";
import * as WD from "./ratios-words.mjs";

/** @typedef {import("./mount.mjs").Figure} Figure */
/** @typedef {import("./ratios-draw.mjs").Atom} Atom */

const clampW = (/** @type {number} */ w) => Math.max(300, Math.min(600, Math.round(w || 400)));
/** @param {string} en @param {string} es @param {number} min @param {number} max @param {number} [step] */
const C = (en, es, min, max, step = 1) => ({ label: en, labelEs: es, min, max, step });
const CUPS = [C("Juice (cups)", "Jugo (tazas)", 1, 12), C("Water (cups)", "Agua (tazas)", 1, 12)];

/** Stacks blocks top to bottom; each block is a function of its top y. */
class Col {
  constructor() {
    this.y = 8;
    this.svg = "";
  }
  /** @param {(y: number) => { svg: string, h: number }} fn @param {number} [gap] */
  add(fn, gap = 14) {
    const b = fn(this.y);
    this.svg += b.svg;
    this.y += b.h + gap;
  }
  finish(/** @type {number} */ W) {
    return { body: this.svg, width: W, height: Math.ceil(this.y) };
  }
}
/** The width and left edge of boxes and tables. @param {number} W */
const frame = (W) => {
  const w = Math.min(W - 2 * PAD, 540);
  return { x: (W - w) / 2, w };
};
/** Lines of bold text for an answer box. @param {string} s @param {number} maxPx */
const para = (s, maxPx) => WD.lines(s, maxPx).map((l) => ({ atoms: /** @type {Atom[]} */ ([{ t: l }]) }));
const T = (/** @type {{ lang: string }} */ o) => (/** @type {string} */ en, /** @type {string} */ es) => (o.lang === "es" ? es : en);

// ============================================================ ratio:mixer, ratio:unit-rate
/** @param {ReturnType<typeof doubleLine>} m @param {{ lang: "en" | "es", width: number }} o */
function renderDouble(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const rows = m.rows;
  const steps = WD.stepsOf(rows.map((r) => r.id), !!m.wrong);
  const { a, b } = m;
  const nm = WD.names(o.lang, "juice");
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Double number line: both lines scale together", "Recta numérica doble: las dos rectas cambian juntas")), 4);
  const ticks = rows
    .filter((r) => r.id !== "simplest")
    .map((r) => ({ m: r.mTop, top: show(r.a), bot: show(r.b), step: steps[r.id], pri: r.id === "given" ? 1 : r.id === "scale" ? 2 : 3, bold: r.id === "given" }));
  const arcs = rows.filter((r) => r.id === "scale" || r.id === "unit").map((r) => ({ from: 1, to: r.mTop, label: r.op, step: steps[r.id] }));
  const wrong = m.wrong ? { mTop: m.wrong.mTop, mBot: m.wrong.mBot, top: show(m.wrong.a), bot: show(m.wrong.b), step: steps.wrong } : null;
  col.add((y) => dnl(W, y, { names: [nm.a, nm.b], ticks, arcs, M: 2, wrong }), 6);
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Ratio table: the same × or ÷ on both columns", "Tabla de razones: el mismo × o ÷ en las dos columnas")), 4);
  /** @type {import("./ratios-draw.mjs").TRow[]} */
  const trows = rows.map((r) => ({
    cells: [[{ t: r.id === "given" ? t("start", "inicio") : r.op }], atomsOf(show(r.a)), atomsOf(show(r.b))],
    kind: r.id === "given" ? "given" : r.id === "unit" ? "unit" : "step",
    step: steps[r.id],
  }));
  if (m.wrong) trows.push({ cells: [[{ t: `+${m.wrong.d}, +${m.wrong.d}` }], atomsOf(show(m.wrong.a)), atomsOf(show(m.wrong.b))], kind: "wrong", step: steps.wrong });
  col.add((y) => table(x, y, w, { heads: [[t("Scale", "Factor"), t("factor", "de escala")], [nm.a, nm.unit], [nm.b, nm.unit]], weights: weights(3), rows: trows }));
  const inner = w - 50;
  col.add((y) =>
    answerBox(
      x,
      y,
      w,
      [...para(t(`${nm.a} for 1 ${nm.cup1} of ${nm.b.toLowerCase()}`, `${nm.a} por 1 ${nm.cup1} de ${nm.b.toLowerCase()}`), inner), { atoms: [{ t: `${a} ÷ ${b} =` }, ...atomsOf(show(m.value), true)] }],
      steps.head,
    ),
  );
  if (m.wrong) col.add((y) => notBox(x, y, w, [WD.doubleWrong(o.lang, m)], steps.wrong));
  return col.finish(W);
}

// ============================================================ ratio:compare, ratio:patterns
/** @param {ReturnType<typeof compareModel>} m @param {{ lang: "en" | "es", width: number }} o */
function renderCompare(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const nm = WD.names(o.lang, "color");
  const hasMineK = m.kMine > 1;
  const hasRefK = m.kRef > 1;
  const steps = { given: 0, scale: 1, wrong: m.wrong ? 2 : -1, head: m.wrong ? 3 : 2 };
  col.add((y) => caption(PAD, y, W - 2 * PAD, t(`Your mix and the reference mix (${REF[0]} : ${REF[1]}), both with ${m.L} cups of white`, `Tu mezcla y la de referencia (${REF[0]} : ${REF[1]}), las dos con ${m.L} tazas de blanco`)), 4);
  col.add((y) =>
    compareLine(W, y, {
      names: [t("Your color", "Tu color"), nm.b, t("Ref. color", "Color ref.")],
      L: m.L,
      whiteEnd: show(R(m.L)),
      mine: { white: m.b, whiteShow: show(R(m.b)), color: show(R(m.a)), end: show(m.mine), k: hasMineK ? show(R(m.kMine)) : null },
      ref: { white: REF[1], whiteShow: show(R(REF[1])), color: show(R(REF[0])), end: show(m.ref), k: hasRefK ? show(R(m.kRef)) : null },
      stepGiven: steps.given,
      stepEnd: steps.scale,
    }),
  );
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Ratio table: the same × or ÷ on both columns", "Tabla de razones: el mismo × o ÷ en las dos columnas")), 4);
  /** @param {string} op @param {import("./ratios-calc.mjs").Show} a @param {import("./ratios-calc.mjs").Show} b @param {import("./ratios-draw.mjs").TRow["kind"]} kind @param {number} step */
  const row = (op, a, b, kind, step) => ({ cells: [[{ t: op }], atomsOf(a), atomsOf(b)], kind, step });
  /** @type {import("./ratios-draw.mjs").TRow[]} */
  const rows = [row(t("yours", "tuya"), show(R(m.a)), show(R(m.b)), "given", steps.given)];
  if (hasMineK) rows.push(row(`×${m.kMine}`, show(m.mine), show(R(m.L)), "step", steps.scale));
  if (m.wrong) rows.push(row(WD.signed(m.wrong.t, true), show(m.wrong.color), show(m.wrong.white), "wrong", steps.wrong));
  rows.push(row(t("ref.", "ref."), show(R(REF[0])), show(R(REF[1])), "given", steps.given));
  if (hasRefK) rows.push(row(`×${m.kRef}`, show(m.ref), show(R(m.L)), "step", steps.scale));
  col.add((y) => table(x, y, w, { heads: [[t("Mix", "Mezcla")], [nm.a, nm.unit], [nm.b, nm.unit]], weights: weights(3, 0.8), rows }));
  const inner = w - 50;
  col.add((y) =>
    answerBox(
      x,
      y,
      w,
      [
        ...para(t("Color for 1 cup of white", "Color por 1 taza de blanco"), inner),
        { atoms: [{ t: `${m.a} ÷ ${m.b} =` }, ...atomsOf(show(m.value), true)] },
        { atoms: [{ t: `${REF[0]} ÷ ${REF[1]} =` }, ...atomsOf(show(m.refValue)), { t: t("(reference)", "(referencia)"), bold: false }] },
        ...para(WD.compareVerdict(o.lang, m), inner),
      ],
      steps.head,
    ),
  );
  if (m.wrong) col.add((y) => notBox(x, y, w, [WD.compareWrong(o.lang, m)], steps.wrong));
  return col.finish(W);
}

// ============================================================ rate:shopping
/** @param {ReturnType<typeof rateModel>} m @param {{ lang: "en" | "es", width: number }} o */
function renderRate(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const { p, n } = m;
  const hasUnit = n > 1;
  const steps = { given: 0, unit: 1, wrong: m.wrong ? 2 : -1, offer: m.wrong ? 3 : 2, head: m.wrong ? 4 : 3 };
  const money = (/** @type {import("../exact.mjs").Rat} */ r) => show(r, { money: true });
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Your pack: divide both lines by the number of items", "Tu paquete: divide las dos rectas entre la cantidad de artículos")), 4);
  /** @type {import("./ratios-lines.mjs").Tick[]} */
  const ticks = [{ m: 1, top: money(R(p)), bot: show(R(n)), step: steps.given, pri: 1, bold: true }];
  if (hasUnit) ticks.push({ m: 1 / n, top: money(m.unit), bot: show(R(1)), step: steps.unit, pri: 2 });
  const arcs = hasUnit ? [{ from: 1, to: 1 / n, label: `÷${n}`, step: steps.unit }] : [];
  const wd = m.wrong && num(m.wrong.dollars) > 0 ? { mTop: num(m.wrong.dollars) / p, mBot: 1 / n, top: money(m.wrong.dollars), bot: show(R(1)), step: steps.wrong } : null;
  col.add((y) => dnl(W, y, { names: [t("Dollars", "Dólares"), t("Items", "Artículos")], ticks, arcs, M: 1, wrong: wd }), 6);
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Ratio table: ÷ both columns to get 1 item", "Tabla de razones: ÷ las dos columnas para llegar a 1 artículo")), 4);
  /** @type {import("./ratios-draw.mjs").TRow[]} */
  const rows = [{ cells: [[{ t: t("pack", "paquete") }], atomsOf(money(R(p))), atomsOf(show(R(n)))], kind: "given", step: steps.given }];
  if (hasUnit) rows.push({ cells: [[{ t: `÷${n}` }], atomsOf(money(m.unit)), atomsOf(show(R(1)))], kind: "unit", step: steps.unit });
  if (m.wrong) rows.push({ cells: [[{ t: `−${m.wrong.off}, −${m.wrong.off}` }], atomsOf(money(m.wrong.dollars)), atomsOf(show(R(1)))], kind: "wrong", step: steps.wrong });
  rows.push({ cells: [[{ t: t("offer", "oferta") }], atomsOf(money(R(OFFER[0]))), atomsOf(show(R(OFFER[1])))], kind: "given", step: steps.offer });
  rows.push({ cells: [[{ t: `÷${OFFER[1]}` }], atomsOf(money(m.offerUnit)), atomsOf(show(R(1)))], kind: "unit", step: steps.offer });
  col.add((y) => table(x, y, w, { heads: [[t("Scale", "Factor"), t("factor", "de escala")], [t("Dollars", "Dólares")], [t("Items", "Artículos")]], weights: weights(3), rows }));
  const inner = w - 50;
  col.add((y) =>
    answerBox(
      x,
      y,
      w,
      [
        ...para(t("Unit price: dollars for 1 item", "Precio unitario: dólares por 1 artículo"), inner),
        { atoms: [{ t: `$${p} ÷ ${n} =` }, ...atomsOf(money(m.unit), true)] },
        { atoms: [{ t: `${t("Offer", "Oferta")}: $${OFFER[0]} ÷ ${OFFER[1]} =` }, ...atomsOf(money(m.offerUnit), true)] },
        ...para(WD.rateVerdict(o.lang, m), inner),
      ],
      steps.head,
    ),
  );
  if (m.wrong) col.add((y) => notBox(x, y, w, [WD.rateWrong(o.lang, m)], steps.wrong));
  return col.finish(W);
}

// ============================================================ growth:ratio-graph, growth:rider
/** @param {ReturnType<typeof graphModel>} m @param {{ lang: "en" | "es", width: number }} o */
function renderGraph(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const n = m.rows.length;
  const steps = { wrong: m.wrong ? n : -1, head: m.wrong ? n + 1 : n };
  const wrong = m.wrong ? ("through" in m.wrong ? { kind: /** @type {const} */ ("origin"), x: m.wrong.x, y: m.wrong.y, step: steps.wrong, r: m.r, c: m.c } : { kind: /** @type {const} */ ("add"), x: m.wrong.x, y: m.wrong.y, step: steps.wrong, r: m.r, c: m.c }) : null;
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Graph: each table row is one point", "Gráfica: cada fila de la tabla es un punto")), 4);
  col.add(
    (y) =>
      graph(W, y, {
        X: m.X,
        Y: m.Y,
        s: m.s,
        r: m.r,
        names: [t("Carriages (x)", "Vagones (x)"), t("Passengers (y)", "Pasajeros (y)")],
        rows: m.rows.map((r, i) => ({ x: r.x, y: r.y, step: i })),
        labelAt: n > 1 ? [0, n - 1] : [0],
        wrong,
      }),
    0,
  );
  col.add((y) => caption(PAD, y, W - 2 * PAD, m.proportional ? t("Ratio table: the same × on both columns", "Tabla de razones: el mismo × en las dos columnas") : t("Table: does y ÷ x stay the same?", "Tabla: ¿se mantiene igual y ÷ x?")), 4);
  /** @type {import("./ratios-draw.mjs").TRow[]} */
  const rows = m.rows.map((r, i) => {
    const cells = [atomsOf(show(R(r.x))), atomsOf(show(R(r.y))), atomsOf(show(r.rate))];
    return { cells: m.proportional ? [[{ t: i === 0 ? t("start", "inicio") : r.op }], ...cells] : cells, kind: i === 0 ? "given" : "step", step: i };
  });
  if (m.wrong && "add" in m.wrong) {
    const cells = [atomsOf(show(R(m.wrong.x))), atomsOf(show(R(m.wrong.y))), atomsOf(show(R(m.wrong.y, m.wrong.x)))];
    rows.push({ cells: [[{ t: `+${m.wrong.add}, +${m.wrong.add}` }], ...cells], kind: "wrong", step: steps.wrong });
  }
  const heads = [[t("Carriages", "Vagones"), "x"], [t("Passengers", "Pasajeros"), "y"], [t("Passengers", "Pasajeros"), t("÷ carriages", "÷ vagones")]];
  col.add((y) => table(x, y, w, { heads: m.proportional ? [[t("Scale", "Factor"), t("factor", "de escala")], ...heads] : heads, weights: m.proportional ? weights(4, 0.8) : [1, 1, 1], rows }));
  const inner = w - 50;
  col.add((y) =>
    answerBox(
      x,
      y,
      w,
      [...para(t("Passengers on the train", "Pasajeros en el tren"), inner), { atoms: [{ t: m.proportional ? `${m.r} × ${m.c} =` : `${m.r} × ${m.c} + ${m.s} =` }, ...atomsOf(show(m.value))] }, ...para(WD.graphVerdict(o.lang, m), inner)],
      steps.head,
    ),
  );
  if (m.wrong) col.add((y) => notBox(x, y, w, [WD.graphWrong(o.lang, m)], steps.wrong));
  return col.finish(W);
}

// ============================================================ conversion:expedition, conversion:scale
/** @param {ReturnType<typeof convModel>} m @param {{ lang: "en" | "es", width: number }} o */
function renderConv(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const u = WD.units(o.lang, m.scale);
  const L = m.L;
  const hasK = L > 1;
  const steps = WD.convSteps(hasK, !!m.wrong);
  col.add((y) => caption(PAD, y, W - 2 * PAD, t(`Double number line: 1 ${u.from.abbr} is ${txt(m.f)} ${u.to.abbr}`, `Recta numérica doble: 1 ${u.from.abbr1} son ${txt(m.f)} ${u.to.abbr}`)), 4);
  /** @type {import("./ratios-lines.mjs").Tick[]} */
  const ticks = [{ m: 1, top: show(R(1)), bot: show(m.f), step: steps.given, pri: 1, bold: true }];
  if (hasK) ticks.push({ m: L, top: show(R(L)), bot: show(m.result), step: steps.scale, pri: 2 });
  const arcs = hasK ? [{ from: 1, to: L, label: `×${L}`, step: steps.scale }] : [];
  const wrong = m.wrong ? { mTop: L, mBot: num(m.wrong.bottom) / num(m.f), top: show(R(L)), bot: show(m.wrong.bottom), step: steps.wrong } : null;
  col.add((y) => dnl(W, y, { names: [u.from.abbr, u.to.abbr], ticks, arcs, M: Math.max(1, L), wrong }), 6);
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Ratio table: the same × on both columns", "Tabla de razones: el mismo × en las dos columnas")), 4);
  /** @type {import("./ratios-draw.mjs").TRow[]} */
  const rows = [{ cells: [[{ t: t("start", "inicio") }], atomsOf(show(R(1))), atomsOf(show(m.f))], kind: "given", step: steps.given }];
  if (hasK) rows.push({ cells: [[{ t: `×${L}` }], atomsOf(show(R(L))), atomsOf(show(m.result))], kind: "step", step: steps.scale });
  if (m.wrong) rows.push({ cells: [[{ t: `+${m.wrong.add}, +${m.wrong.add}` }], atomsOf(show(R(L))), atomsOf(show(m.wrong.bottom))], kind: "wrong", step: steps.wrong });
  col.add((y) => table(x, y, w, { heads: [[t("Scale", "Factor"), t("factor", "de escala")], [u.from.name], [u.to.name]], weights: weights(3), rows }));
  col.add((y) => caption(PAD, y, W - 2 * PAD, t(`Chain of tiles: multiply by the unit ratio so ${WD.the(u.from)} cancel`, `Cadena de fichas: multiplica por la razón unitaria para que se cancelen ${WD.the(u.from)}`)), 2);
  col.add((y) => {
    const c = chain(W, y, {
      tiles: [
        { top: show(R(L)).t ?? "", topUnit: u.from.abbrN(L), bot: "1", botUnit: "", cancelTop: true },
        { top: txt(m.f), topUnit: u.to.abbr, bot: "1", botUnit: u.from.abbr1, cancelBot: true },
        { top: txt(m.result), topUnit: u.to.abbr, bot: "1", botUnit: "" },
      ],
      steps: [steps.chain, steps.cancel],
      ops: ["×", "="],
    });
    return { svg: c.first + c.second, h: c.h };
  }, 2);
  col.add((y) => {
    const lines = WD.cancelNote(o.lang, u);
    return caption(PAD, y, W - 2 * PAD, lines, { anchor: "start" });
  }, 8);
  col.add((y) =>
    answerBox(
      x,
      y,
      w,
      [...para(t(`Length in ${u.to.plural}`, `Longitud en ${u.to.plural}`), w - 50), { atoms: [{ t: `${L} × ${txt(m.f)} = ${txt(m.result)} ${u.to.abbr}` }] }],
      steps.head,
    ),
  );
  if (m.wrong) col.add((y) => notBox(x, y, w, [WD.convAdd(o.lang, m, u)], steps.wrong));
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("Upside down, the units do not cancel:", "Al revés, las unidades no se cancelan:")), 2);
  col.add((y) =>
    flipped(
      W,
      y,
      [
        { top: show(R(L)).t ?? "", topUnit: u.from.abbrN(L), bot: "1", botUnit: "" },
        { top: "1", topUnit: u.from.abbr1, bot: txt(m.f), botUnit: u.to.abbr, dashed: true },
      ],
      steps.flip,
    ),
  );
  col.add((y) => notBox(x, y, w, [WD.convFlip(o.lang, m, u)], steps.flip));
  return col.finish(W);
}

// ============================================================ ratio:tape
/** @param {ReturnType<typeof tapeModel>} m @param {{ lang: "en" | "es", width: number }} o */
function renderTape(m, o) {
  const W = clampW(o.width);
  const t = T(o);
  const { x, w } = frame(W);
  const col = new Col();
  const { a, b, total } = m;
  const nm = WD.names(o.lang, "juice");
  col.add((y) => caption(PAD, y, W - 2 * PAD, t("One tape: every box is 1 cup", "Una cinta: cada casilla es 1 taza")), 4);
  col.add((y) => tape(W, y, a, b, `${t("Whole drink", "Bebida completa")}: ${a} + ${b} = ${total} ${WD.cups(o.lang, total)}`, 0, 1), 4);
  const la = `${nm.a}: ${a} ${WD.cups(o.lang, a)}`;
  const lb = `${nm.b}: ${b} ${WD.cups(o.lang, b)}`;
  const wa = 30 + tw(la, 14, true);
  const wb = 30 + tw(lb, 14, true);
  const side = wa + wb + 16 <= W - 2 * PAD;
  col.add((y) => {
    const x0 = (W - (side ? wa + wb + 16 : Math.max(wa, wb))) / 2;
    return { svg: swatch(x0, y, false, la) + (side ? swatch(x0 + wa + 16, y, true, lb) : swatch(x0, y + 24, true, lb)), h: side ? 22 : 46 };
  }, 10);
  const lowA = nm.a.toLowerCase();
  const lowB = nm.b.toLowerCase();
  col.add((y) =>
    ratioRows(x, y, w, [
      { desc: t(`${nm.a} to ${lowB}: part to part`, `${nm.a} a ${lowB}: parte a parte`), atoms: [{ t: `${a} : ${b}` }], step: 2 },
      { desc: t(`${nm.a} to the whole drink: part to whole`, `${nm.a} a la bebida completa: parte a todo`), atoms: [{ t: `${a} : ${total}` }], step: 3 },
      { desc: t(`${nm.b} to the whole drink: part to whole`, `${nm.b} a la bebida completa: parte a todo`), atoms: [{ t: `${b} : ${total}` }], step: 4 },
    ]),
  );
  col.add((y) => answerBox(x, y, w, [...para(t("Cups in the whole drink", "Tazas en la bebida completa"), w - 50), { atoms: [{ t: `${a} + ${b} = ${total}` }] }], 5));
  col.add((y) => notBox(x, y, w, [t(`Not this: ${a} : ${b} compares ${lowA} to ${lowB}, part to part. For part to whole, put the whole second: ${a} : ${total}.`, `No así: ${a} : ${b} compara ${lowA} con ${lowB}, parte a parte. Para parte a todo, el total va en segundo lugar: ${a} : ${total}.`)], 5));
  return col.finish(W);
}

// ============================================================ the figures
/** @param {(m: any, o: { lang: "en" | "es", width: number }) => { body: string, width: number, height: number }} render @param {(model: any) => number} steps */
const withScene = (render, steps) => ({
  render,
  scene: (/** @type {ParentNode} */ root, /** @type {any} */ model) => sceneOf(root, steps(model)),
});

/** @type {Figure[]} */
export default [
  {
    id: "ratio-part-whole",
    keys: ["ratio:tape"],
    title: { en: "One tape: part to part and part to whole", es: "Una cinta: parte a parte y parte a todo" },
    controls: () => CUPS,
    build: (key, values) => tapeModel(key, values),
    ...withScene(renderTape, () => 5),
    describe: (m, lang) => WD.describeTape(m, lang),
    headline: (m, lang) => F.tapeHeadline(m, lang),
    wrong: (m, lang) => F.tapeWrong(m, lang),
  },
  {
    id: "ratio-double-line",
    keys: ["ratio:mixer", "ratio:unit-rate"],
    title: { en: "Double number line and ratio table", es: "Recta numérica doble y tabla de razones" },
    controls: () => CUPS,
    build: (key, values) => doubleLine(key, values),
    ...withScene(renderDouble, (m) => WD.stepsOf(m.rows.map((/** @type {{ id: string }} */ r) => r.id), !!m.wrong).head),
    describe: (m, lang) => WD.describeDouble(m, lang),
    headline: (m, lang) => F.doubleHeadline(m, lang),
    wrong: (m, lang) => F.doubleWrong(m, lang),
  },
  {
    id: "ratio-compare",
    keys: ["ratio:compare", "ratio:patterns"],
    title: { en: "Compare two mixes with the same white", es: "Compara dos mezclas con el mismo blanco" },
    controls: () => [C("Color paint (cups)", "Pintura de color (tazas)", 1, 12), C("White paint (cups)", "Pintura blanca (tazas)", 1, 12)],
    build: (key, values) => compareModel(key, values),
    ...withScene(renderCompare, (m) => (m.wrong ? 3 : 2)),
    describe: (m, lang) => WD.describeCompare(m, lang),
    headline: (m, lang) => F.compareHeadline(m, lang),
    wrong: (m, lang) => F.compareWrong(m, lang),
  },
  {
    id: "rate-unit-price",
    keys: ["rate:shopping"],
    title: { en: "Unit price: divide to 1 item", es: "Precio unitario: dividir para llegar a 1 artículo" },
    controls: () => [C("Pack price ($)", "Precio del paquete ($)", 1, 30), C("Items in pack", "Artículos en el paquete", 1, 15)],
    build: (key, values) => rateModel(key, values),
    ...withScene(renderRate, (m) => (m.wrong ? 4 : 3)),
    describe: (m, lang) => WD.describeRate(m, lang),
    headline: (m, lang) => F.rateHeadline(m, lang),
    wrong: (m, lang) => F.rateWrong(m, lang),
  },
  {
    id: "ratio-graph",
    keys: ["growth:ratio-graph", "growth:rider"],
    title: { en: "A ratio table and its graph", es: "Una tabla de razones y su gráfica" },
    controls: (key) => [
      C("Passengers per carriage", "Pasajeros por vagón", 1, 8),
      key === "growth:rider" ? C("Starting passengers", "Pasajeros al inicio", 0, 6) : C("Starting amount", "Cantidad inicial", 0, 0),
      C("Carriages", "Vagones", 1, 12),
    ],
    build: (key, values) => graphModel(key, values),
    ...withScene(renderGraph, (m) => m.rows.length + (m.wrong ? 1 : 0)),
    describe: (m, lang) => WD.describeGraph(m, lang),
    headline: (m, lang) => F.graphHeadline(m, lang),
    wrong: (m, lang) => F.graphWrong(m, lang),
  },
  {
    id: "conversion-chain",
    keys: ["conversion:expedition", "conversion:scale"],
    title: { en: "Convert with a chain of unit ratios", es: "Convierte con una cadena de razones unitarias" },
    controls: (key) =>
      key === "conversion:scale"
        ? [C("Length (feet)", "Longitud (pies)", 1, 12), C("Inches per foot (fixed)", "Pulgadas por pie (fijo)", 12, 12)]
        : [C("Length (inches)", "Longitud (pulgadas)", 1, 12), C("Centimeters per inch (fixed)", "Centímetros por pulgada (fijo)", 2.54, 2.54)],
    build: (key, values) => convModel(key, values),
    ...withScene(renderConv, (m) => WD.convSteps(m.L > 1, !!m.wrong).last),
    describe: (m, lang) => WD.describeConv(m, lang),
    headline: (m, lang) => F.convHeadline(m, lang),
    wrong: (m, lang) => F.convWrong(m, lang),
  },
];
