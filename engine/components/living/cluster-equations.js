// Plays for the "equations" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "balance-solve": () => import("./balance-solve.js").then((m) => m.buildBalanceSolvePlay),
  "balance-test": () => import("./balance-test.js").then((m) => m.buildBalanceTestPlay),
  "inequality-line": () => import("./inequality-line.js").then((m) => m.buildInequalityLinePlay),
  "inequality-graph": () => import("./inequality-graph.js").then((m) => m.buildInequalityGraphPlay),
  "inequality-solve": () => import("./inequality-solve.js").then((m) => m.buildInequalitySolvePlay),
};
