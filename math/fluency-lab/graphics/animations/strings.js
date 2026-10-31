// Every learner-facing string the eight animations pass through t(): the player controls plus each model's
// captions and labels. tools/fluency-i18n.test.mjs reads this list to require a Spanish entry for each.
import { KEYS as areaDecomposition } from "./area-decomposition.js";
import { KEYS as coordinateMovement } from "./coordinate-movement.js";
import { KEYS as fractionAddition } from "./fraction-addition.js";
import { KEYS as fractionEquivalence } from "./fraction-equivalence.js";
import { KEYS as multiplicationGrouping } from "./multiplication-grouping.js";
import { PLAYER_KEYS } from "./player.js";
import { KEYS as ratioScaling } from "./ratio-scaling.js";
import { KEYS as regrouping } from "./regrouping.js";
import { KEYS as transformation } from "./transformation.js";

export const ANIMATION_STRINGS = [
  ...new Set([
    ...PLAYER_KEYS,
    ...fractionEquivalence,
    ...fractionAddition,
    ...regrouping,
    ...multiplicationGrouping,
    ...ratioScaling,
    ...coordinateMovement,
    ...areaDecomposition,
    ...transformation,
  ]),
];
