// Plays for the "ratios" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "ratio-parts": () => import("./ratio-parts.js").then((m) => m.buildRatioPartsPlay),
  "unit-rate": () => import("./unit-rate.js").then((m) => m.buildUnitRatePlay),
  "ratio-compare": () => import("./ratio-compare.js").then((m) => m.buildRatioComparePlay),
  "ratio-graph": () => import("./ratio-graph.js").then((m) => m.buildRatioGraphPlay),
  "ratio-equiv": () => import("./ratio-equiv.js").then((m) => m.buildRatioEquivPlay),
};
