// Mounts the right Fraction Kitchen widget for a round and returns { destroy, setLang }. @fm2 FM-040 FM-021
import { mountMeasure } from "./ui-measure.js";
import { mountPlace } from "./ui-place.js";
import { mountFill, mountServing } from "./ui-scoop.js";
import { mountShape } from "./ui-shape.js";

const MOUNTS = {
  fair: mountShape,
  fix: mountShape,
  serve: mountShape,
  equiv: mountShape,
  compare: mountShape,
  area: mountShape,
  cup: mountMeasure,
  line: mountMeasure,
  fill: mountFill,
  serving: mountServing,
  place: mountPlace,
};

export function mountKitchen(root, ctx) {
  return MOUNTS[ctx.round.kind](root, ctx);
}
