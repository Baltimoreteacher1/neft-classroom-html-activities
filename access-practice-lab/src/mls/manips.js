// Math Literacy Studio: the thirty accessible manipulatives (inventory.json). manips-a.js (grades 1-5) and manips-b.js (grades 6-8) define
// them with defineManip (manip-kit.js); this file merges them and maps every problem family to the manipulative that suits it.
import { MANIPS as A } from "./manips-a.js";
import { MANIPS as B } from "./manips-b.js";
export const MANIPS = { ...A, ...B };
export const MANIP_FOR_FAMILY = {
  count: "counters", numrel: "numberline", addsub: "tenframe", tensones: "placevalue", compare: "numberline", equality: "balance", length: "measure", clock: "clock",
  shapes: "shapebuilder", maketen: "bonds", expanded: "placevalue", groups: "array", money: "counters", bargraph: "picturegraph", partition: "fracstrips", muldiv: "array",
  properties: "areamodel", fracid: "fracstrips", fracline: "fracline", areaperim: "areamodel", elapsed: "clock", multidigit: "areamodel", multcompare: "tape", factors: "array",
  fracequiv: "fracstrips", fracops: "fracstrips", decimals: "decimalgrid", convert: "measure", angles: "angle", lineplot: "dataviz", multistep: "tape", exprs: "equationbuilder",
  patterns: "coordinate", volume: "volume", coordinate: "coordinate", ratio: "ratiotable", unitrate: "doublenl", percent: "doublenl", integers: "numberline", algexpr: "algebratiles",
  equation: "balance", inequality: "numberline", indepdep: "machine", surfarea: "volume", stats: "statviz", proportional: "ratiotable", scale: "doublenl", circle: "construction",
  probability: "probsim", sampling: "statviz", linear: "graphing", systems: "graphing", functions: "machine", slope: "graphing", exponents: "equationbuilder", irrational: "numberline",
  transform: "transformtool", similarity: "transformtool", pythag: "construction", scatter: "statviz",
};
/** The manipulative id for a merged skill. */
export const manipFor = (skill) => MANIP_FOR_FAMILY[skill.familyId] || "numberline";
