// Plays for the "integers" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "rational-line": () => import("./rational-line.js").then((m) => m.buildRationalLinePlay),
  "absolute-distance": () =>
    import("./absolute-distance.js").then((m) => m.buildAbsoluteDistancePlay),
  "order-line": () => import("./order-line.js").then((m) => m.buildOrderLinePlay),
};
