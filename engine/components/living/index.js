// The living-scene plays, by name. A lesson's `livingScene.play` must be a key
// here; the interactive-visual registry and the config guard test both read
// this map, so a play cannot exist in one place and be missing in the other.
// Each loader resolves to the play's builder: (cfg) => play | null.
export const LIVING_PLAYS = {
  distribute: () => import("./distribute.js").then((m) => m.buildDistributePlay),
  "ratio-scale": () => import("./ratio-scale.js").then((m) => m.buildRatioScalePlay),
  "percent-whole": () => import("./percent-whole.js").then((m) => m.buildPercentWholePlay),
  "mean-balance": () => import("./mean-balance.js").then((m) => m.buildMeanBalancePlay),
  exponents: () => import("./exponents.js").then((m) => m.buildExponentsPlay),
  "order-of-operations": () => import("./order-of-operations.js").then((m) => m.buildOrderOpsPlay),
  "one-step-equation": () => import("./one-step-equation.js").then((m) => m.buildOneStepEqPlay),
  "integers-opposites": () => import("./integers-opposites.js").then((m) => m.buildIntegersPlay),
  "parallelogram-area": () =>
    import("./parallelogram-area.js").then((m) => m.buildParallelogramPlay),
  "median-iqr": () => import("./median-iqr.js").then((m) => m.buildMedianIqrPlay),
};
