// The balance scale as the learner sees it: a tilting beam, two pans holding weights and open spots, and a plain-words
// reading of which pan is heavier and by exactly how much. The tilt and the words come from the same exact difference.
// @fm2 FM-059 FM-036 FM-040
import { panDrop, scaleSvg, squareSvg, weightSvg } from "../../art/puzzles.js";
import { frac, toMixedString } from "../../rational.js";
import { tx } from "../../lang.js";
import { UI } from "./copy.js";
import { readScales } from "./logic.js";
import { show, tileById } from "./rules.js";
import { tileLabel } from "./ui-names.js";

export function readingText(reading, lang, unit) {
  const { diff } = reading;
  if (reading.pending) return tx(UI.placeWeights, lang);
  if (diff.n === 0) return tx(UI.balanced, lang);
  const n = toMixedString(frac(Math.abs(diff.n), diff.d));
  const suffix = unit === "area" ? tx(UI.areaUnit, lang) : "";
  return tx(diff.n > 0 ? UI.leftHeavier : UI.rightHeavier, lang, { n, unit: suffix });
}

const boxLetter = { x: "x", cube: "x", ball: "y" };

function termHtml(view, term) {
  const { round, state, lang, esc } = view;
  if (term.lin) {
    const at = term.lin[0] * state.xs + term.lin[1];
    return `<li class="pz-wt pz-wt-expr"><span class="pz-expr-text">${esc(term.text)}</span><small class="pz-expr-val">= ${at}</small></li>`;
  }
  if ("v" in term && term.side) {
    return `<li class="pz-wt pz-wt-sq">${squareSvg(term.side)}<span class="pz-sq-label">${esc(tx(UI.side, lang, { n: term.side }))}</span></li>`;
  }
  if ("v" in term) {
    const text = term.f ?? show(term.v);
    const dots = term.dots
      ? `<span class="pz-dots" aria-hidden="true">${"<i></i>".repeat(Math.min(10, Number(term.v)))}</span>`
      : "";
    return `<li class="pz-wt pz-wt-num"><span class="pz-num">${esc(text)}</span>${dots}</li>`;
  }
  if (term.box) {
    const tile = state.put[term.c] ? tileById(round, state.put[term.c]) : null;
    const name = tx(UI.boxName[term.box], lang);
    const aria = tile
      ? tx(UI.boxValue, lang, { name, value: tileLabel(tile) })
      : tx(UI.boxUnset, lang, { name });
    const one = `<li class="pz-wt pz-wt-box"><span class="pz-inner" role="img" aria-label="${esc(aria)}">${weightSvg(term.box)}</span></li>`;
    return one.repeat(term.m || 1);
  }
  const tile = state.put[term.c] ? tileById(round, state.put[term.c]) : null;
  const square = term.p === 2 && tile ? squareSvg(Number(tile.v)) : "";
  return `<li class="pz-wt pz-wt-slot">${view.slot(term.c)}${square}</li>`;
}

function stepperHtml(view) {
  const { round, state, lang, locked } = view;
  const [lo, hi] = round.xRange;
  const off = locked();
  return `<div class="pz-xstep" role="group" aria-label="${view.esc(tx(UI.sampleX, lang))}"><span class="pz-xstep-label">${view.esc(tx(UI.sampleX, lang))}</span>
    <button type="button" class="fm2-btn pz-xbtn" data-pz-xdown data-pz-key="xdown" aria-label="${view.esc(tx(UI.lowerX, lang))}" ${off || state.xs <= lo ? "disabled" : ""}>−</button>
    <output class="pz-xval" data-pz-xval>${state.xs}</output>
    <button type="button" class="fm2-btn pz-xbtn" data-pz-xup data-pz-key="xup" aria-label="${view.esc(tx(UI.raiseX, lang))}" ${off || state.xs >= hi ? "disabled" : ""}>+</button>
  </div><p class="pz-note">${view.esc(tx(UI.sampleHelp, lang))}</p>`;
}

// The inequality written out, so a variable scale also reads as symbols.
function inequalityText(scale) {
  const side = (terms) =>
    terms.map((t) => (t.box ? `${t.m > 1 ? t.m : ""}x` : "v" in t ? String(t.v) : "?")).join(" + ");
  return `${side(scale.l)} ${scale.rel} ${side(scale.r)}`;
}

export function scalesHtml(view) {
  const { round, state, lang, esc } = view;
  const readings = readScales(round, state.put, state.xs);
  const boxCells = [
    ...new Set(
      round.scales
        .flatMap((s) => [...s.l, ...s.r])
        .filter((t) => t.box)
        .map((t) => t.c),
    ),
  ];
  const rows = boxCells
    .map((c) => {
      const kind = round.scales.flatMap((s) => [...s.l, ...s.r]).find((t) => t.c === c).box;
      const label = kind === "cube" ? UI.cubeWeighs : kind === "ball" ? UI.ballWeighs : UI.xWeighs;
      return `<div class="pz-weight-row"><span class="pz-weight-label">${esc(tx(label, lang))}</span>${view.slot(c)}</div>`;
    })
    .join("");
  const panel = rows
    ? `<div class="pz-weights" role="group" aria-label="${esc(tx(UI.weights, lang))}">${rows}</div>`
    : "";
  const scales = round.scales
    .map((scale, k) => {
      const reading = readings[k];
      const tilt = reading.tilt;
      const drop = (panDrop(tilt) / 6).toFixed(3);
      const goal =
        scale.rel === "="
          ? ""
          : `<p class="pz-goal">${esc(tx(scale.rel === ">" ? UI.goalHeavier : UI.goalLighter, lang))}${boxCells.length ? ` <b>${esc(inequalityText(scale))}</b>` : ""}</p>`;
      const name = tx(UI.scaleN, lang, { n: k + 1 });
      const pan = (side, terms, sign) =>
        `<div class="pz-pan pz-pan-${side}" style="--drop:${(sign * drop).toFixed(3)}"><p class="pz-pan-title">${esc(tx(side === "l" ? UI.leftPan : UI.rightPan, lang))}</p><ul class="pz-items" aria-label="${esc(tx(side === "l" ? UI.leftPan : UI.rightPan, lang))}">${terms.map((term) => termHtml(view, term)).join("")}</ul></div>`;
      return `<section class="pz-scale-wrap" aria-label="${esc(round.scales.length > 1 ? name : tx(UI.board, lang))}">${goal}
        <div class="pz-scale" data-pz-scale="${k}" data-tilt="${tilt.toFixed(2)}" style="--tilt:${tilt.toFixed(2)}deg">${scaleSvg(tilt)}<div class="pz-pans">${pan("l", scale.l, 1)}${pan("r", scale.r, -1)}</div></div>
        <p class="pz-reading" data-pz-reading="${k}">${esc(readingText(reading, lang, round.unit))}</p></section>`;
    })
    .join("");
  return `${round.equiv ? stepperHtml(view) : ""}${panel}${scales}`;
}
