// Plays for the "expressions" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "expression-evaluate": () =>
    import("./expression-evaluate.js").then((m) => m.buildExpressionEvaluatePlay),
  "property-shift": () => import("./property-shift.js").then((m) => m.buildPropertyShiftPlay),
  "combine-terms": () => import("./combine-terms.js").then((m) => m.buildCombineTermsPlay),
};
