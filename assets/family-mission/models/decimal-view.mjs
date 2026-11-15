// Pictures and notes for the "decimal" family: the place-value chart for adding and subtracting,
// and the step cards (with the digit row and the place-the-point picker) for multiplying.
import { h, t } from "./core.mjs";
import { fixed, whole } from "./decimal-math.mjs";
import { MINUS, MOVE, STR, colNote, estimateLine, place, placeInfo, placeValue, placesWord } from "./decimal-text.mjs";

const NBSP = " ";
const range = (from, to) => Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

// ── Notes: what the last move did ────────────────────────────────────────────

function mulLines(kind, d, lang) {
  const m = d.m;
  const L = (en, es) => t(lang, { en, es });
  const pa = m.a.places;
  const pb = m.b.places;
  if (kind === "mEstimate") {
    return [
      L(
        `Rounded: ${m.a.text} is about ${m.est.a}, and ${m.b.text} is about ${m.est.b}. ${m.est.a} × ${m.est.b} = ${m.estimate}. The answer should be about ${m.estimate}.`,
        `Redondeo: ${m.a.text} es casi ${m.est.a}, y ${m.b.text} es casi ${m.est.b}. ${m.est.a} × ${m.est.b} = ${m.estimate}. La respuesta debe ser de unos ${m.estimate}.`,
      ),
    ];
  }
  if (kind === "ignore") {
    return [L(`Without the points: ${m.a.text} becomes ${m.A}, and ${m.b.text} becomes ${m.B}.`, `Sin los puntos: ${m.a.text} queda ${m.A}, y ${m.b.text} queda ${m.B}.`)];
  }
  if (kind === "multiply") {
    const lines = [`${m.A} × ${m.B} = ${whole(m.prod)}.`];
    if (m.partials.length > 1) {
      for (const p of m.partials) lines.push(`${m.A} × ${whole(p.factor)} = ${whole(p.value)}`);
      lines.push(`${L("Add", "Suma")}: ${m.partials.map((p) => whole(p.value)).join(" + ")} = ${whole(m.prod)}`);
    }
    return lines;
  }
  if (kind === "count") {
    return [
      L(
        `${m.a.text} has ${pa} ${placesWord(pa, "en")}. ${m.b.text} has ${pb} ${placesWord(pb, "en")}. ${pa} + ${pb} = ${m.total}.`,
        `${m.a.text} tiene ${pa} ${placesWord(pa, "es")}. ${m.b.text} tiene ${pb} ${placesWord(pb, "es")}. ${pa} + ${pb} = ${m.total}.`,
      ),
    ];
  }
  if (kind === "place") {
    const drop = m.answer !== m.placed;
    return [
      L(
        `Count ${m.total} ${placesWord(m.total, "en")} from the right in ${whole(m.prod)}: ${m.placed}.${drop ? ` Zeros at the end can be dropped: ${m.answer}.` : ""}`,
        `Cuenta ${m.total} ${placesWord(m.total, "es")} desde la derecha en ${whole(m.prod)}: ${m.placed}.${drop ? ` Los ceros del final se pueden quitar: ${m.answer}.` : ""}`,
      ),
    ];
  }
  const e = m.estimate;
  const [small, right, big] = m.cands;
  return [
    L(`One place further left: ${small.text}. That is much smaller than ${e}.`, `Un lugar más a la izquierda: ${small.text}. Es mucho menor que ${e}.`),
    L(`Where we put it: ${right.text}. That is close to ${e}, so it is reasonable.`, `Donde lo pusimos: ${right.text}. Está cerca de ${e}, así que es razonable.`),
    L(`One place further right: ${big.text}. That is much bigger than ${e}.`, `Un lugar más a la derecha: ${big.text}. Es mucho mayor que ${e}.`),
  ];
}

/** The note for the move just finished (empty before the first move). */
export function moveNote(d, lang) {
  const m = d.moves[d.step - 1];
  if (!m) return "";
  if (d.mode === "multiply") return mulLines(m.k, d, lang).join(" ");
  const o = d.ops[m.op ?? 0];
  const L = (en, es) => t(lang, { en, es });
  if (m.k === "estimate") return estimateLine(d.est, lang);
  if (m.k === "align") return L("The decimal points are in one column, so equal places sit above each other.", "Los puntos decimales están en una columna, así que los mismos lugares quedan uno sobre otro.");
  if (m.k === "annex") return L(`Every number now has ${o.P} decimal places: ${fixed(o.A, o.P)} and ${fixed(o.B, o.P)}.`, `Ahora todos los números tienen ${o.P} lugares decimales: ${fixed(o.A, o.P)} y ${fixed(o.B, o.P)}.`);
  if (m.k === "point") return L("The decimal point comes straight down into the answer.", "El punto decimal baja en línea recta a la respuesta.");
  return colNote(m, o.sign, lang);
}

/** The last lines of a finished problem: the equation first, then the reasonableness check. */
export function finalLines(d, lang) {
  const L = (en, es) => t(lang, { en, es });
  if (d.mode === "multiply") {
    const m = d.m;
    return [`${d.expression} = ${m.answer}`, L(`The estimate was about ${m.estimate}. ${m.answer} is close to it, so the point is in a sensible place.`, `La estimación era de unos ${m.estimate}. ${m.answer} está cerca, así que el punto está en un lugar razonable.`)];
  }
  return [
    `${d.expression} = ${d.result}`,
    L(`The estimate was about ${d.est.total}. ${d.result} is close to it, so the answer is reasonable.`, `La estimación era de unos ${d.est.total}. ${d.result} está cerca, así que la respuesta es razonable.`),
  ];
}

// ── Add and subtract: the place-value chart ──────────────────────────────────

function chartCell(tag, cls, text, attrs) {
  return h(tag, { class: cls, ...attrs }, text || NBSP);
}

function numberRow(d, which, lang) {
  const o = d.op;
  const g = d.grid;
  const X = which === "left" ? o.A : o.B;
  const places = which === "left" ? o.leftPlaces : o.rightPlaces;
  const now = d.next?.k === "col" && d.next.op === d.active ? d.next.pos : -1;
  const cells = [];
  for (let pos = o.P + o.W - 1; pos >= 0; pos -= 1) {
    const e = pos - o.P;
    const cls = `fm-dec-cell${pos === now ? " is-now" : ""}${e === d.look ? " is-look" : ""}`;
    if (pos === o.P - 1) cells.push(pointCell(places > 0 || g.annexed, !(places > 0)));
    const own = pos < o.P ? pos >= o.P - places : pos === o.P || X >= 10 ** pos;
    if (own) cells.push(chartCell("td", cls, String(Math.floor(X / 10 ** pos) % 10)));
    else if (pos < o.P && g.annexed) cells.push(chartCell("td", `${cls} is-annexed`, "0", { "aria-label": `0, ${t(lang, STR.annexed)}` }));
    else cells.push(chartCell("td", cls, ""));
  }
  const sign = which === "left" ? "" : o.sign > 0 ? "+" : MINUS;
  const word = which === "left" ? "" : o.sign > 0 ? t(lang, { en: "plus", es: "más" }) : t(lang, { en: "minus", es: "menos" });
  return h("tr", null, h("th", { scope: "row", class: "fm-dec-sign" }, h("span", { "aria-hidden": "true" }, sign || NBSP), h("span", { class: "fm-sr" }, word || fixed(X, o.P))), cells);
}

function pointCell(show, annexed) {
  return chartCell("td", `fm-dec-point${annexed && show ? " is-annexed" : ""}`, show ? "." : "");
}

function renderChart(d, { lang, readonly }) {
  const o = d.op;
  const g = d.grid;
  const now = d.next?.k === "col" && d.next.op === d.active ? d.next.pos : -1;
  const marks = new Map();
  const mark = (pos, text) => marks.set(pos, [...(marks.get(pos) || []), text]);
  for (const c of o.cols.slice(0, g.colsDone)) {
    if (!c.out) continue;
    if (o.sign > 0) mark(c.pos + 1, "1");
    else {
      mark(c.pos, "+10");
      mark(c.pos + 1, `${MINUS}1`);
    }
  }
  const head = [];
  const regroup = [];
  const result = [];
  for (let pos = o.P + o.W - 1; pos >= 0; pos -= 1) {
    const e = pos - o.P;
    if (pos === o.P - 1) {
      head.push(h("th", { "aria-hidden": "true", class: "fm-dec-point" }, NBSP));
      regroup.push(chartCell("td", "fm-dec-point", ""));
      result.push(chartCell("td", `fm-dec-point${g.pointDone ? "" : " is-slot"}`, g.pointDone ? "." : ""));
    }
    const label = placeValue(e);
    const attrs = { "aria-label": place(e, lang, { cap: true }), "aria-pressed": String(d.look === e), "data-look": String(e), "data-focus": `look:${e}` };
    head.push(h("th", { scope: "col", class: "fm-dec-colhead" }, readonly ? h("span", { class: "fm-dec-place" }, label) : h("button", { type: "button", class: "fm-btn fm-dec-place", ...attrs }, label)));
    regroup.push(h("td", { class: "fm-dec-cell fm-dec-mark" }, ...(marks.get(pos) || []).map((x) => h("span", null, x)), marks.has(pos) ? null : NBSP));
    const done = pos < g.colsDone;
    const lead = pos > o.P && o.R < 10 ** pos;
    const cls = `fm-dec-cell fm-dec-res${pos === now ? " is-now" : ""}${e === d.look ? " is-look" : ""}`;
    result.push(chartCell("td", cls, done ? (lead ? "" : String(o.cols[pos].digit)) : pos === now ? "?" : ""));
  }
  const rowHead = (text, vis) => h("th", { scope: "row", class: "fm-dec-sign" }, h("span", { "aria-hidden": "true" }, vis || NBSP), h("span", { class: "fm-sr" }, text));
  return h(
    "table",
    { class: "fm-dec-chart" },
    h("caption", { class: "fm-sr" }, t(lang, STR.grid)),
    h("thead", null, h("tr", null, h("td", { class: "fm-dec-sign" }, NBSP), head)),
    h(
      "tbody",
      null,
      h("tr", { class: "fm-dec-regroup" }, rowHead(t(lang, STR.carry)), regroup),
      numberRow(d, "left", lang),
      numberRow(d, "right", lang),
      h("tr", { class: "fm-dec-answer" }, rowHead(t(lang, STR.answerRow), "="), result),
    ),
  );
}

function renderRaw(d, lang) {
  const o = d.op;
  return h(
    "div",
    { class: "fm-dec-raw", role: "group", "aria-label": t(lang, STR.raw) },
    h("p", null, o.left),
    h("p", null, `${o.sign > 0 ? "+" : MINUS} ${o.right}`),
  );
}

/** Everything under the expression for add/subtract: the trail, the estimate and the chart. */
export function renderAddSub(d, opts) {
  const { lang } = opts;
  const nodes = [];
  if (d.trail.length) nodes.push(h("div", { class: "fm-dec-trail" }, h("p", { class: "fm-cap" }, t(lang, STR.trail)), ...d.trail.map((x) => h("p", { class: "fm-dec-line" }, x))));
  if (d.step) nodes.push(h("p", { class: "fm-dec-est" }, h("strong", null, `${t(lang, STR.estimate)}: `), estimateLine(d.est, lang)));
  nodes.push(d.grid.aligned ? renderChart(d, opts) : renderRaw(d, lang));
  const info = d.look === null ? null : placeInfo(d.look, lang);
  if (info) nodes.push(h("p", { class: "fm-explain fm-dec-look" }, info));
  return nodes;
}

// ── Multiply: step cards, digit row, place picker ────────────────────────────

function digitRow(m, placed) {
  const kids = [];
  [...m.digits].forEach((dg, i) => {
    if (placed && i === m.digits.length - m.total) kids.push(h("span", { class: "fm-dec-dot", "aria-hidden": "true" }, "."));
    kids.push(h("span", { class: "fm-dec-digit" }, dg));
  });
  return h("p", { class: "fm-dec-digits", role: "img", "aria-label": placed ? m.placed : m.digits }, ...kids);
}

export function renderMultiply(d, { lang }) {
  const m = d.m;
  const cards = d.moves.slice(0, Math.min(d.step + (d.next?.k === "place" ? 1 : 0), d.moves.length)).map((mv, i) => {
    const doneCard = i < d.step;
    const title = t(lang, MOVE[mv.k]);
    const body = mv.k === "place" ? [digitRow(m, doneCard), ...(doneCard ? mulLines("place", d, lang).map((x) => h("p", null, x)) : [])] : mulLines(mv.k, d, lang).map((x) => h("p", null, x));
    return h("li", { class: "fm-dec-card" }, h("h4", { class: "fm-dec-card-title" }, title), ...body);
  });
  return h("ol", { class: "fm-dec-steps" }, ...cards);
}

export const placePicker = {
  buttons(d, lang) {
    const len = d.m.digits.length;
    return [
      h("p", { class: "fm-cap" }, t(lang, STR.pickPlaces)),
      h(
        "div",
        { class: "fm-dec-choices", role: "group", "aria-label": t(lang, STR.pickPlaces) },
        ...range(1, len - 1).map((g) => h("button", { type: "button", class: "fm-btn fm-dec-choice", "data-place": String(g), "data-focus": `place:${g}`, "aria-label": `${g} ${placesWord(g, lang)}` }, String(g))),
      ),
    ];
  },
  miss(d, g, lang) {
    const text = fixed(d.m.prod, g);
    return t(lang, {
      en: `Try another look. With ${g} ${placesWord(g, "en")} the answer would read ${text}. Count the decimal places in both factors and add them.`,
      es: `Mira otra vez. Con ${g} ${placesWord(g, "es")} la respuesta diría ${text}. Cuenta los lugares decimales de los dos factores y súmalos.`,
    });
  },
};
