// Plays for the "expressions" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "power-stack": () => import("./power-stack.js").then((m) => m.buildPowerStackPlay),
  "order-of-ops": () => import("./order-of-ops.js").then((m) => m.buildOrderOfOpsPlay),
  "expression-evaluate": () =>
    import("./expression-evaluate.js").then((m) => m.buildExpressionEvaluatePlay),
  "property-shift": () => import("./property-shift.js").then((m) => m.buildPropertyShiftPlay),
  "combine-terms": () => import("./combine-terms.js").then((m) => m.buildCombineTermsPlay),
};
