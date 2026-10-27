// The shape (pizza / bar) widget: cut into equal parts with a stepper, slide or join cuts, tap pieces to serve them,
// and read an equation that always matches the drawing. @fm2 FM-040 FM-059
import { barSvg, evenCuts, pizzaSvg, sizesOf } from "../../art/fractions.js";
import { cmp, frac, toMixedString, toString } from "../../rational.js";
import { cap, foodText, partName } from "./copy.js";
import {
  MAX_PARTS,
  isEqualSplit,
  join,
  onGrid,
  recut,
  servedCount,
  servedValue,
  slide,
} from "./model.js";
import { button, esc, mountWidget, stepper, u } from "./ui-core.js";

const figure = (round, shape, lang, { base = null, label, labels = true } = {}) => {
  const draw = round.shape === "circle" ? pizzaSvg : barSvg;
  return draw({
    cuts: shape.cuts,
    served: shape.served,
    wholes: round.wholes,
    base,
    labels,
    label,
    tag: { base: u("leftover", lang) },
  });
};

function figureLabel(round, shape, lang) {
  const food = foodText(round.food, lang);
  const n = shape.cuts.length + 1;
  const k = servedCount(shape.served);
  const equal = isEqualSplit(shape.cuts);
  return u(equal ? "figureEqual" : "figureUnequal", lang, { food: food.the, n, k });
}

function equation(round, shape, lang) {
  const n = shape.cuts.length + 1;
  const k = servedCount(shape.served);
  const value = servedValue(shape.cuts, shape.served);
  const food = foodText(round.food, lang);
  if (!isEqualSplit(shape.cuts)) return round.kind === "fix" ? u("eqFixUnequal", lang, { n }) : u("eqUnequal", lang, { value: toMixedString(value) });
  if (round.kind === "fix") return u("eqFix", lang, { n, share: toString(frac(1, n)) });
  if (n === 1 && k === 0) return u("eqWhole", lang, { food: cap(food.the) });
  if (k === 0) return u("eqNone", lang, { n });
  const reduced = toString(value) !== `${k}/${n}` ? ` = ${toString(value)}` : "";
  const mixed = value.n > value.d && value.d > 1 ? ` = ${toMixedString(value)}` : "";
  const words = round.grade <= 3 && n >= 2 ? ` (${partName(n, lang, k)})` : "";
  const head = round.wholes > 1 ? u("eqPieces", lang, { k, n }) : u("eqServed", lang, { k, n });
  return `${head} = ${k}/${n}${reduced}${mixed}${words}`;
}

function comparison(round, shape, lang) {
  if (round.kind !== "compare" || !isEqualSplit(shape.cuts) || servedCount(shape.served) === 0)
    return "";
  const value = servedValue(shape.cuts, shape.served);
  const order = cmp(value, round.ref);
  const key = order > 0 ? "cmpMore" : order < 0 ? "cmpLess" : "cmpEqual";
  return u(key, lang, { value: toString(value), ref: toString(round.ref) });
}

// The reference drawing for equiv and compare rounds, cut the way the order states it (2/6 stays sixths).
const refShape = (round) => {
  const [served, parts] = round.refAsk ?? [round.ref.n, round.ref.d];
  return { cuts: evenCuts(parts), served: Array.from({ length: parts * round.wholes }, (_, i) => i < served) };
};
const refText = (round) => (round.refAsk ? round.refAsk.join("/") : toMixedString(round.ref));

function cutRows(state, round, lang, canSlide) {
  const rows = state.cuts.map((cut, i) => {
    const left = slide(state, i, -1);
    const right = slide(state, i, 1);
    const circle = round.shape === "circle";
    return `<li class="fk-cut-row"><span class="fk-cut-name">${u("cutName", lang, { k: i + 1 })}</span>
      ${button({ act: "slide", v: -1, i, fk: `slide-${i}-back`, label: "◀", disabled: !left, aria: u(circle ? "slideBackCircle" : "slideLeft", lang, { k: i + 1 }) })}
      ${button({ act: "slide", v: 1, i, fk: `slide-${i}-on`, label: "▶", disabled: !right, aria: u(circle ? "slideOnCircle" : "slideRight", lang, { k: i + 1 }) })}
      ${button({ act: "join", i, fk: `join-${i}`, label: u("join", lang), aria: u("joinAria", lang, { k: i + 1 }) })}</li>`;
  });
  return canSlide
    ? `<ul class="fk-cuts">${rows.join("")}</ul>`
    : `<p class="fk-note">${u("slideNote", lang)}</p>`;
}

function pieces(state, round, lang, locked) {
  const parts = state.cuts.length + 1;
  const food = foodText(round.food, lang);
  const groups = [];
  for (let w = 0; w < round.wholes; w += 1) {
    const buttons = Array.from({ length: parts }, (_, i) => {
      const index = w * parts + i;
      const on = state.served[index];
      const name = u(on ? "pieceServed" : "pieceNotServed", lang, { n: i + 1, total: parts });
      const label = round.wholes > 1 ? `${food.one} ${w + 1}, ${name}` : name;
      return `<button type="button" class="fm2-btn fk-piece-btn ${on ? "is-served" : ""}" data-act="toggle" data-piece="${index}" data-fk="piece-${index}" aria-pressed="${on}" aria-label="${esc(label)}" ${locked ? "disabled" : ""}><span aria-hidden="true">${i + 1}</span></button>`;
    });
    groups.push(
      `${round.wholes > 1 ? `<span class="fk-group-name" aria-hidden="true">${cap(food.one)} ${w + 1}</span>` : ""}<div class="fk-piece-group" role="group" aria-label="${esc(round.wholes > 1 ? `${food.one} ${w + 1}` : u("piecesLabel", lang))}">${buttons.join("")}</div>`,
    );
  }
  return `<div class="fk-pieces"><p class="fk-tool-label">${u("piecesHint", lang)}</p>${groups.join("")}</div>`;
}

const SUBMIT = {
  fix: "submitFix",
  fair: "submitServe",
  serve: "submitServe",
  equiv: "submitServe",
  compare: "submitServe",
  area: "submitServe",
};

export const shapeWidget = {
  init(round) {
    if (round.kind === "fix")
      return {
        cuts: round.startCuts,
        served: Array(round.startCuts.length + 1).fill(false),
        open: true,
      };
    return { ...recut(1, round.wholes), open: false };
  },
  view({ state, round, lang, locked, canUndo }) {
    const n = state.cuts.length + 1;
    const equal = isEqualSplit(state.cuts);
    const sizes = sizesOf(state.cuts).map(toString).join(", ");
    const canSlide = state.cuts.length >= 1 && state.cuts.length <= 5 && onGrid(state.cuts);
    const showPieces = round.kind !== "fix";
    const base = round.kind === "area" ? round.base : null;
    const ref = round.kind === "equiv" || round.kind === "compare" ? refShape(round) : null;
    const refCaption = !ref
      ? ""
      : round.kind === "equiv"
        ? u("refMatch", lang, { ref: refText(round) })
        : u("refCompare", lang, { ref: refText(round) });
    const cmpText = comparison(round, state, lang);
    return `
      ${ref ? `<figure class="fk-ref">${figure(round, ref, lang, { label: u("refFigure", lang, { ref: refText(round) }), labels: false })}<figcaption>${refCaption}</figcaption></figure>` : ""}
      <figure class="fk-model fk-model-${round.shape}">${figure(round, state, lang, { base, label: figureLabel(round, state, lang) })}</figure>
      <p class="fk-eq" data-fk="eq">${equation(round, state, lang)}</p>
      ${cmpText ? `<p class="fk-eq fk-cmp">${cmpText}</p>` : ""}
      <p class="fk-check ${n === 1 ? "is-neutral" : equal ? "is-ok" : "is-bad"}" data-fk="check"><span class="fk-check-icon" aria-hidden="true">${n === 1 ? "i" : equal ? "✓" : "!"}</span><span>${equal ? (n === 1 ? u("checkWhole", lang) : u("checkEqual", lang, { n })) : u("checkUnequal", lang, { sizes })}</span></p>
      <div class="fk-tools">
        <div class="fk-tool"><span class="fk-tool-label">${u("cutInto", lang)}</span>
          ${stepper({ fk: "parts", label: u("partsLabel", lang), value: n, text: u(n === 1 ? "partsWhole" : "partsText", lang, { n }), min: 1, max: MAX_PARTS, step: "parts", lang })}
          ${button({ act: "even", fk: "even", label: u("evenOut", lang), cls: "fm2-btn-quiet" })}</div>
        ${showPieces ? pieces(state, round, lang, locked) : ""}
        ${round.kind === "fix" ? "" : button({ act: "finetune", fk: "finetune", cls: "fm2-btn-quiet", label: u(state.open ? "hideCuts" : "showCuts", lang), pressed: state.open })}
        ${round.kind === "fix" || state.open ? cutRows(state, round, lang, canSlide) : ""}
        <div class="fk-actions">${button({ act: "undo", fk: "undo", label: u("undo", lang), disabled: !canUndo })}${button({ act: "submit", fk: "submit", cls: "fm2-btn-primary", label: u(SUBMIT[round.kind], lang) })}</div>
      </div>`;
  },
  act(state, name, data, round) {
    const wholes = round.wholes;
    const n = state.cuts.length + 1;
    if (name === "parts") {
      const next = Math.min(MAX_PARTS, Math.max(1, n + Number(data.v)));
      if (next === n) return null;
      return {
        state: { ...recut(next, wholes), open: state.open },
        say: { en: `Cut into ${next} equal parts.`, es: `Cortado en ${next} partes iguales.` },
      };
    }
    if (name === "even")
      return {
        state: { ...recut(n, wholes), open: state.open },
        say: { en: `${n} equal parts.`, es: `${n} partes iguales.` },
      };
    if (name === "finetune") return { state: { ...state, open: !state.open }, quiet: true };
    if (name === "toggle") {
      const index = Number(data.piece);
      const served = state.served.map((on, i) => (i === index ? !on : on));
      const k = servedCount(served);
      const value = servedValue(state.cuts, served);
      const say = {
        en: `Piece ${(index % n) + 1} ${served[index] ? "served" : "put back"}. ${k} served, ${toString(value)}.`,
        es: `Pieza ${(index % n) + 1} ${served[index] ? "servida" : "devuelta"}. ${k} servidas, ${toString(value)}.`,
      };
      return { state: { ...state, served }, say };
    }
    if (name === "slide") {
      const moved = slide(state, Number(data.i), Number(data.v));
      if (!moved) return null;
      const equal = isEqualSplit(moved.cuts);
      return {
        state: { ...moved, open: state.open },
        say: {
          en: `Cut ${Number(data.i) + 1} moved. ${equal ? "The parts are equal." : "The parts are not equal."}`,
          es: `Corte ${Number(data.i) + 1} movido. ${equal ? "Las partes son iguales." : "Las partes no son iguales."}`,
        },
      };
    }
    if (name === "join") {
      const joined = join(state, Number(data.i), wholes);
      return {
        state: { ...joined, open: state.open },
        say: {
          en: `Joined two pieces. ${joined.cuts.length + 1} parts now.`,
          es: `Se unieron dos piezas. Ahora hay ${joined.cuts.length + 1} partes.`,
        },
      };
    }
    return null;
  },
  response: (state) => ({ cuts: state.cuts, served: state.served }),
};

export function mountShape(root, ctx) {
  return mountWidget(root, ctx, shapeWidget);
}
