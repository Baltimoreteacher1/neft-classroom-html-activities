// The game's mathematics: the skill table, round dispatch, scoring (`check`), the model solution (`solve`), the
// answer text, and the scale readings the interface shows. Pure and DOM-free. Every comparison is exact.
// @fm2 FM-017 FM-019 FM-058 FM-059 FM-060
import { frac, sub, toMixedString } from "../../rational.js";
import { feedbackText } from "./copy-mistakes.js";
import { diagnose } from "./diagnose.js";
import { balanceSame, bondParts, equalSign, missingAddend } from "./gen-early.js";
import { factorGrid, gridSums, magicSquare, magicTriangle } from "./gen-grids.js";
import { factorPairs, kenken } from "./gen-kenken.js";
import { pythagSquares, scaleSystem } from "./gen-late.js";
import { equalForms, equivExpr, inequalityScale, targetOps } from "./gen-ops.js";
import { bothSides, oneStep, twoStep } from "./gen-scale.js";
import {
  boardValues,
  failingRules,
  openCells,
  show,
  sideWeight,
  solveAll,
  tileById,
} from "./rules.js";
import { judge, solutionMoves, tiltFor } from "./scale.js";

// id -> [min grade, max grade, standard, generator]
export const SKILL_TABLE = {
  "bond-parts": [0, 1, "K.OA.A.4", bondParts],
  "balance-same": [0, 1, "K.CC.C.6", balanceSame],
  "equal-sign": [1, 2, "1.OA.D.7", equalSign],
  "missing-addend": [1, 2, "1.OA.D.8", missingAddend],
  "grid-sums": [2, 3, "2.NBT.B.5", gridSums],
  "magic-triangle": [2, 3, "2.OA.B.2", magicTriangle],
  "magic-square": [3, 4, "3.OA.D.9", magicSquare],
  "factor-grid": [3, 4, "3.OA.A.4", factorGrid],
  kenken: [4, 5, "4.OA.A.3", kenken],
  "factor-pairs": [4, 5, "4.OA.B.4", factorPairs],
  "target-ops": [5, 5, "5.OA.A.1", targetOps],
  "equal-forms": [5, 6, "5.NF.A.1", equalForms],
  "scale-onestep": [6, 6, "6.EE.B.7", oneStep],
  "inequality-scale": [6, 7, "6.EE.B.5", inequalityScale],
  "scale-twostep": [7, 7, "7.EE.B.4", twoStep],
  "equiv-expr": [7, 7, "7.EE.A.1", equivExpr],
  "scale-system": [8, 8, "8.EE.C.8", scaleSystem],
  "scale-both-sides": [8, 8, "8.EE.C.7", bothSides],
  "pythag-squares": [8, 8, "8.G.B.7", pythagSquares],
};

export function makeRound(skillId, level, rng, grade) {
  const entry = SKILL_TABLE[skillId];
  if (!entry) throw new RangeError(`Unknown skill ${skillId}`);
  const [low, high, , generate] = entry;
  const lvl = Math.min(3, Math.max(1, level));
  const g = Math.min(high, Math.max(low, grade));
  return { skillId, grade: g, ...generate(lvl, rng, g) };
}

const GOOD = {
  place: { en: "Every clue fits. Well solved!", es: "Todas las pistas encajan. ¡Bien resuelto!" },
  balance: {
    en: "The scale balances. Well solved!",
    es: "La balanza se equilibra. ¡Bien resuelto!",
  },
  scale: {
    en: "The scale is balanced with one x-box alone. Well solved!",
    es: "La balanza está equilibrada con una caja x sola. ¡Bien resuelto!",
  },
};
const miss = (round, key, vars, extra = {}) => ({
  correct: false,
  mistake: key,
  feedback: feedbackText(round.skillId, key, vars),
  ...extra,
});
const good = (kind) => ({ correct: true, feedback: GOOD[kind] });

function checkScale(round, response) {
  const result = judge(round, response?.moves);
  return result.correct ? good("scale") : miss(round, result.mistake);
}

export function checkPlace(round, response) {
  const put = Array.isArray(response?.put) ? response.put : [];
  const open = openCells(round);
  if (open.some((i) => !put[i])) return miss(round, "incomplete", {}, { neutral: true });
  const tiles = open.map((i) => tileById(round, put[i]));
  if (tiles.some((t) => !t)) return miss(round, "incomplete", {}, { neutral: true });
  if (!round.reuse && new Set(open.map((i) => put[i])).size !== open.length)
    return miss(round, "reused-tile");
  if (open.some((i) => round.cells[i].type && round.cells[i].type !== tileById(round, put[i]).kind))
    return miss(round, "wrong-kind");
  const vals = boardValues(round, put);
  const failing = failingRules(round, vals);
  if (!failing.length) return good(round.layout === "balance" ? "balance" : "place");
  const { key, vars } = diagnose(round, put, vals, failing);
  return miss(round, key, vars);
}

export const check = (round, response) =>
  round.kind === "scale" ? checkScale(round, response) : checkPlace(round, response);

// ---- the model solution ----------------------------------------------------------------------------------------
export function solutionPut(round) {
  const ids = round.solution || solveAll(round, 1).solutions[0];
  const put = round.cells.map(() => null);
  openCells(round).forEach((cell, i) => {
    put[cell] = ids[i];
  });
  return put;
}

export const solve = (round) =>
  round.kind === "scale" ? { moves: solutionMoves(round) } : { put: solutionPut(round) };

export const tileText = (tile) => show(tile.v, tile.label);

function exprText(round, put) {
  const rule = round.rules[0];
  let out = "";
  for (const t of rule.toks) {
    if (t === "(") out += "(";
    else if (t === ")") out = `${out.trimEnd()}) `;
    else out += `${tileText(tileById(round, put[t.c]))} `;
  }
  return out.trim().replace(/\( /g, "(");
}

export function answerText(round) {
  if (round.kind === "scale") return `x = ${toMixedString(round.xv)}`;
  const put = solutionPut(round);
  if (round.layout === "expr") return exprText(round, put);
  const labels = openCells(round).map((i) => tileText(tileById(round, put[i])));
  if (round.system) return `x = ${labels[0]}, y = ${labels[1]}`;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return labels.join(", ");
}

// ---- scale readings -------------------------------------------------------------------------------------------
// Each scale's exact pan weights, difference and beam tilt for the tiles placed so far (empty spots weigh nothing).
// `xs` is the weight of x in an equivalent-expressions round.
export function readScales(round, put, xs = round.xs ?? 1) {
  const vals = boardValues(round, put);
  const x = frac(xs);
  return round.scales.map((scale) => {
    // Weights of an unplaced x, cube or ball are not known yet, so that scale makes no claim.
    const pending = [...scale.l, ...scale.r].some((t) => t.box && vals[t.c] === null);
    const left = sideWeight(scale.l, vals, x);
    const right = sideWeight(scale.r, vals, x);
    const diff = pending ? frac(0) : sub(left, right);
    return { left, right, diff, pending, tilt: pending ? 0 : tiltFor(diff, round.ref), rel: scale.rel };
  });
}
