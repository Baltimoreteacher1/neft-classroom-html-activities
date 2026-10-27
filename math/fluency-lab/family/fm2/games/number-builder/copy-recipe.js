// Plain-text recipes of a build: the readable one (per language) and the language-neutral key the tests look for.
// @fm2 FM-007 FM-020
import { cmp, fromDecimal } from "../../rational.js";
import { pieceFace, pieceName, sup } from "./copy-text.js";
import { sciCoefText } from "./logic-modes.js";
import { fmtNum } from "./words.js";

export const byValueDesc = (round) =>
  [...round.pieces].sort((a, b) => cmp(fromDecimal(b.value), fromDecimal(a.value)));

export function recipe(round, build, lang) {
  if (round.mode === "chart") return fmtNum(build.slots.join(""));
  if (round.mode === "sci") return `${fmtNum(sciCoefText(build.digits))} × 10${sup(build.exp)}`;
  const parts = byValueDesc(round)
    .filter((p) => build.counts[p.id] > 0)
    .map((p) => `${build.counts[p.id]} ${pieceName(p, lang, build.counts[p.id])}`);
  return parts.join(" + ") || "0";
}

// Language-neutral form of the answer (counts times faces): what the tests look for in a hint.
export function answerKey(round, builds) {
  const one = (build) => {
    if (round.mode === "chart") return fmtNum(build.slots.join(""));
    if (round.mode === "sci") return `${fmtNum(sciCoefText(build.digits))} × 10${sup(build.exp)}`;
    return byValueDesc(round)
      .filter((p) => build.counts[p.id] > 0)
      .map((p) => `${build.counts[p.id]}×${p.kind === "counter" ? p.color : pieceFace(p)}`)
      .join(" + ");
  };
  return builds.map(one).join(" ; ");
}

