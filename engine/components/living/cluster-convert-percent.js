// Plays for the "convert-percent" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "unit-convert": () => import("./unit-convert.js").then((m) => m.buildUnitConvertPlay),
  "percent-per-hundred": () =>
    import("./percent-per-hundred.js").then((m) => m.buildPercentPerHundredPlay),
  "percent-fdp": () => import("./percent-fdp.js").then((m) => m.buildPercentFdpPlay),
  "percent-estimate": () => import("./percent-estimate.js").then((m) => m.buildPercentEstimatePlay),
  "percent-missing-whole": () =>
    import("./percent-missing-whole.js").then((m) => m.buildPercentMissingWholePlay),
};
