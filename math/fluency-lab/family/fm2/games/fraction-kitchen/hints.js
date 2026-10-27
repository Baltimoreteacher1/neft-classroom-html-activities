// Hint tiers 0-3 for any round: 0 nudge, 1 strategy, 2 worked parallel example, 3 the full solution. Tiers 0-2 are
// checked so they never print the round's answer in any form. @fm2 FM-062
import { toString } from "../../rational.js";
import * as measure from "./hints-measure.js";
import * as shape from "./hints-shape.js";
import { answerText } from "./solution.js";
import { decimalOf, ms } from "./words.js";

const LADDERS = {
  "fair-shares": shape.fairShares,
  "fix-the-cuts": shape.fixCuts,
  "serve-parts": shape.serveParts,
  "pizza-equiv": shape.pizzaEquiv,
  "compare-pieces": shape.comparePieces,
  "part-of-part": shape.area,
  "divide-unit": (r, bad) => (r.kind === "serving" ? measure.serving(r, bad) : shape.area(r, bad)),
  "line-marker": measure.lineMarker,
  "pour-cup": measure.pourCup,
  "percent-amount": measure.percentAmount,
  "pour-spill": measure.pourSpill,
  "rational-approx": measure.rationalApprox,
  "mixed-scoops": measure.fillScoops,
  "batch-recipe": measure.fillScoops,
  "unlike-bars": measure.fillScoops,
  "divide-fractions": measure.serving,
  "tenths-cup": measure.placeScoops,
  "repeating-decimals": measure.placeScoops,
  "sci-measures": measure.placeScoops,
};

// Every written form of the answer that a hint must keep out of tiers 0-2.
export function answerForms(round) {
  const forms = [answerText(round)];
  if (round.target) forms.push(toString(round.target), ms(round.target), decimalOf(round.target));
  return [...new Set(forms)];
}

export function hintFor(round, tier) {
  const ladder = LADDERS[round.skillId](round, answerForms(round));
  return ladder[Math.max(0, Math.min(3, tier))];
}
