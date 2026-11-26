// The living-scene plays, by name. A lesson's `livingScene.play` must be a key
// here; the interactive-visual registry and tools/living-scene-configs.test.mjs
// both read this map, so a play cannot exist in one place and be missing in the
// other. Each loader resolves to the play's builder: (cfg) => play | null.
// The cluster files own their own plays so parallel work never edits one file.
import { PLAYS as area } from "./cluster-area.js";
import { PLAYS as convertPercent } from "./cluster-convert-percent.js";
import { PLAYS as coordinate } from "./cluster-coordinate.js";
import { PLAYS as decimals } from "./cluster-decimals.js";
import { PLAYS as equations } from "./cluster-equations.js";
import { PLAYS as expressions } from "./cluster-expressions.js";
import { PLAYS as fractionsFactors } from "./cluster-fractions-factors.js";
import { PLAYS as integers } from "./cluster-integers.js";
import { PLAYS as ratios } from "./cluster-ratios.js";
import { PLAYS as statsA } from "./cluster-stats-a.js";
import { PLAYS as statsB } from "./cluster-stats-b.js";
import { PLAYS as twoVariable } from "./cluster-two-variable.js";
import { PLAYS as volumeNets } from "./cluster-volume-nets.js";

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
  ...area,
  ...convertPercent,
  ...coordinate,
  ...decimals,
  ...equations,
  ...expressions,
  ...fractionsFactors,
  ...integers,
  ...ratios,
  ...statsA,
  ...statsB,
  ...twoVariable,
  ...volumeNets,
};
