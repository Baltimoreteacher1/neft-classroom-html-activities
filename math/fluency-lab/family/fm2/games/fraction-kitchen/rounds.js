// Round factory: one generator per skill, then a bilingual prompt built from the round's own numbers.
// A round is a pure, JSON-serializable function of (skillId, level, rng, grade). @fm2 FM-061 FM-065
import { chance } from "../../rng.js";
import { promptFor } from "./prompts.js";
import { comparePieces, fairShares, fixCuts, partOfPart, pizzaEquiv, serveParts, shareLeftover } from "./rounds-shape.js";
import { lineMarker, percentAmount, pourCup, pourSpill, rationalApprox } from "./rounds-measure.js";
import {
  batchRecipe,
  divideFractions,
  mixedScoops,
  repeatingDecimals,
  sciMeasures,
  tenthsCup,
  unlikeBars,
  wholeByUnit,
} from "./rounds-scoop.js";

const GENERATORS = {
  "fair-shares": fairShares,
  "fix-the-cuts": fixCuts,
  "serve-parts": serveParts,
  "pizza-equiv": pizzaEquiv,
  "compare-pieces": comparePieces,
  "line-marker": lineMarker,
  "pour-cup": pourCup,
  "tenths-cup": tenthsCup,
  "mixed-scoops": mixedScoops,
  "batch-recipe": batchRecipe,
  "unlike-bars": unlikeBars,
  "part-of-part": partOfPart,
  "divide-unit": (level, rng) => (chance(rng, 0.5) ? shareLeftover(level, rng) : wholeByUnit(level, rng)),
  "divide-fractions": divideFractions,
  "percent-amount": percentAmount,
  "pour-spill": pourSpill,
  "repeating-decimals": repeatingDecimals,
  "rational-approx": rationalApprox,
  "sci-measures": sciMeasures,
};

export function buildRound(skillId, level, rng, grade) {
  const make = GENERATORS[skillId];
  if (!make) throw new RangeError(`Unknown Fraction Kitchen skill: ${skillId}`);
  const data = make(level, rng, grade);
  const round = { v: 1, skillId, level, grade, ...data };
  return { ...round, prompt: promptFor(round) };
}
