// The registry of problem families. A family owns a set of skills (keyed "grade:id") and one function per type.
//   family = { id, skills: { "5:decimal-add": spec }, types: { compute(ctx) -> draft, ... },
//              range?: { type: [minLevel, maxLevel] }  (default [1, 5]),
//              supports?: { type: (spec) => boolean } }
// ctx = { rng, level, spec, skill, type }. A type function returns a draft for kit.finish() or throws to be redrawn.
import { family as algebra } from "./fam-algebra.js";
import { family as compareParts } from "./fam-compare-parts.js";
import { family as counting } from "./fam-counting.js";
import { family as data } from "./fam-data.js";
import { family as decimals } from "./fam-decimals.js";
import { family as fractions } from "./fam-fractions.js";
import { family as geometry } from "./fam-geometry.js";
import { family as integers } from "./fam-integers.js";
import { family as measure } from "./fam-measure.js";
import { family as muldiv } from "./fam-muldiv.js";
import { family as numtheory } from "./fam-numtheory.js";
import { family as placeRound } from "./fam-place-round.js";
import { family as powersSlope } from "./fam-powers-slope.js";
import { family as ratioPercent } from "./fam-ratio-percent.js";
import { family as wholeAddSub } from "./fam-whole-addsub.js";

export const FAMILIES = [
  wholeAddSub,
  counting,
  compareParts,
  placeRound,
  muldiv,
  numtheory,
  fractions,
  decimals,
  measure,
  geometry,
  data,
  ratioPercent,
  integers,
  algebra,
  powersSlope,
];
