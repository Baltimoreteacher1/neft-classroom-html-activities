// The board for each puzzle layout. Every spot is a real button (`view.slot`) or a plain given number (`view.given`),
// laid out in HTML/CSS over the pictures from art/puzzles.js. @fm2 FM-040 FM-059
import { BOND_NODES, TRI_NODES, bondSvg, gridFrameSvg, triangleSvg } from "../../art/puzzles.js";
import { toMixedString } from "../../rational.js";
import { UI } from "./copy.js";
import { boardValues, evalTokens, openCells } from "./rules.js";
import { scalesHtml } from "./ui-scale-view.js";

const at = (x, y, inner) => `<div class="pz-node" style="left:${x}%;top:${y}%">${inner}</div>`;

function bondHtml(view) {
  const nodes = BOND_NODES.map(([x, y], i) => at(x, y, view.cell(i))).join("");
  return `<div class="pz-bond">${bondSvg()}${nodes}</div>`;
}

function triangleHtml(view) {
  const nodes = TRI_NODES.map(([x, y], i) => at(x, y, view.cell(i))).join("");
  return `<div class="pz-tri">${triangleSvg("", view.round.target)}${nodes}</div><p class="pz-note">${view.esc(view.t(UI.triangleSum, { n: view.round.target }))}</p>`;
}

function gridHtml(view) {
  const { round, t, esc } = view;
  const n = round.n;
  let out = "";
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) out += view.cell(r * n + c);
    out += `<span class="pz-sum"><span class="fm2-sr">${esc(t(UI.rowTotal, { r: r + 1 }))}: </span><b>${round.rowSums[r]}</b></span>`;
  }
  for (let c = 0; c < n; c += 1)
    out += `<span class="pz-sum"><span class="fm2-sr">${esc(t(UI.colTotal, { c: c + 1 }))}: </span><b>${round.colSums[c]}</b></span>`;
  return `<div class="pz-grid" style="--cols:${n + 1}">${out}<span class="pz-corner" aria-hidden="true"></span></div>`;
}

function magicHtml(view) {
  const cells = Array.from({ length: 9 }, (_, i) => view.cell(i)).join("");
  return `<div class="pz-magic">${cells}</div><p class="pz-note">${view.esc(view.t(UI.magicSum, { n: view.round.target }))}</p>`;
}

function factorHtml(view) {
  const { round } = view;
  const { rows, cols } = round;
  let out = '<span class="pz-corner pz-times" aria-hidden="true">×</span>';
  for (let c = 0; c < cols; c += 1) out += view.cell(c, "pz-head");
  for (let r = 0; r < rows; r += 1) {
    out += view.cell(cols + r, "pz-head");
    for (let c = 0; c < cols; c += 1) out += view.cell(cols + rows + r * cols + c);
  }
  return `<div class="pz-factor" style="--cols:${cols + 1}">${out}</div>`;
}

function cageHtml(view) {
  const { round } = view;
  const n = round.n;
  const cages = round.cages.map((c) => ({ cells: c.cells, label: `${c.to}${c.op}` }));
  const cells = Array.from({ length: n * n }, (_, i) => view.cell(i)).join("");
  return `<div class="pz-cage" style="--n:${n}">${gridFrameSvg(n, cages)}${cells}</div><p class="pz-note">${view.esc(view.t(UI.kenkenRules, { n }))}</p>`;
}

function pairsHtml(view) {
  const { round, t, esc } = view;
  const clues = [
    t(UI.productClue, { n: round.product }),
    round.gap ? t(UI.gapClue, { n: round.gap }) : t(UI.sumClue, { n: round.sum }),
  ];
  return `<div class="pz-pairs">${view.cell(0)}${view.cell(1)}</div><ul class="pz-clues" aria-label="${esc(t(UI.cluesLabel))}">${clues.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`;
}

function eqHtml(view) {
  const parts = view.round.eq.map((token) => {
    if (typeof token === "object") return view.slot(openCells(view.round)[token.slot]);
    return /^\d/.test(String(token))
      ? `<span class="pz-term">${token}</span>`
      : `<span class="pz-op">${token}</span>`;
  });
  return `<div class="pz-eq" role="group" aria-label="${view.esc(view.t(UI.blank))}">${parts.join("")}</div>`;
}

function exprResult(view) {
  const { round, state, t } = view;
  if (openCells(round).some((i) => !state.put[i])) return t(UI.exprWaiting);
  const got = evalTokens(round.toks, boardValues(round, state.put));
  if (!got) return t(UI.exprCannot);
  if (got.n < 0) return t(UI.exprBelowZero);
  return t(UI.exprMakes, { n: toMixedString(got) });
}

function exprHtml(view) {
  const parts = view.round.toks.map((tok) =>
    typeof tok === "object" ? view.cell(tok.c) : `<span class="pz-paren">${tok}</span>`,
  );
  return `<div class="pz-expr" role="group" aria-label="${view.esc(view.t(UI.exprLabel))}">${parts.join("")}<span class="pz-op">=</span><span class="pz-target" aria-label="${view.esc(view.t(UI.target))} ${view.round.target}">${view.round.target}</span></div>
    <p class="pz-note" data-pz-result>${view.esc(exprResult(view))}</p>`;
}

const LAYOUTS = {
  balance: scalesHtml,
  bond: bondHtml,
  triangle: triangleHtml,
  grid: gridHtml,
  magic: magicHtml,
  factor: factorHtml,
  cage: cageHtml,
  pairs: pairsHtml,
  eq: eqHtml,
  expr: exprHtml,
};

export const boardHtml = (view) => LAYOUTS[view.round.layout](view);
