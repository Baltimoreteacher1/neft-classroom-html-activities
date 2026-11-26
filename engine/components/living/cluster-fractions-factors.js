// Plays for the "fractions-factors" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "factor-pairs": () => import("./factor-pairs.js").then((m) => m.buildFactorPairsPlay),
  "fraction-groups": () => import("./fraction-groups.js").then((m) => m.buildFractionGroupsPlay),
  "lcm-lanes": () => import("./lcm-lanes.js").then((m) => m.buildLcmLanesPlay),
  "factor-tree": () => import("./factor-tree.js").then((m) => m.buildFactorTreePlay),
};
