// Plays for the "stats-a" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "data-bins": () => import("./data-bins.js").then((m) => m.buildDataBinsPlay),
  "median-fold": () => import("./median-fold.js").then((m) => m.buildMedianFoldPlay),
  "box-build": () => import("./box-build.js").then((m) => m.buildBoxBuildPlay),
  "spread-iqr": () => import("./spread-iqr.js").then((m) => m.buildSpreadIqrPlay),
};
