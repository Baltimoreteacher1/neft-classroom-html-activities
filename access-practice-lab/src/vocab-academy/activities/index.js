// Vocabulary Academy activity engine — public surface (SPEC §6 / §10).
//   ACTIVITY_TYPES  [{ id, label, labelEs, group, dims, dim, bands, domain, mode, scope, minGrade, maxGrade, build, grade }]
//   buildItems(typeId, unitData, ctx)   deterministic items: { id, type, wordId, dim, stem, choices?, answer, explain, hint?, visual? }
//   renderItem(item, ctx[, state])      markup for one item (util.js raw); feedbackHTML / actionsHTML render the rest
//   gradeItem(item, response[, opts])   { ok, partial?, feedback[], review?, empty? }  (pure)
//   mountRunner(root, { items, ctx, onResult, onDone })   runs a set; onResult({ wordId, dim, ok, sup, type, firstTry, … })
// ctx = { grade, band, supports, domain, rng?, lookup(wordId), I, unit, salt, pool, onlyWords, limit }
import { gradeItem } from "./grade.js";

export { ACTIVITY_TYPES, TYPES, TYPE_BY_ID, buildItems, buildMixed, fitsGrade, typesFor } from "./registry.js";
export { actionsHTML, feedbackHTML, renderItem } from "./render.js";
export { creditsFor, mountRunner } from "./runner.js";
export { analyzeWriting } from "./writing.js";
export { preloadMorphology, setMorphology } from "./morph-data.js";
export { gradeItem };
