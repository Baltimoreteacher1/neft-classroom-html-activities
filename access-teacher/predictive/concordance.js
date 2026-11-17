// MODEL-to-ACCESS concordance registry. WIDA publishes a table that relates a MODEL Overall composite to a
// likely ACCESS score; the studio records WHICH mapping applies to WHICH versions, and refuses to produce a
// number unless the exact table for that combination has been entered and checked here. No table values are
// loaded today, so every lookup returns "unavailable" with the reason and the official source to consult.
import { SCALE_RESET_YEAR, SOURCES } from "./rules.js";

export const CONCORDANCE_VERSION = "2026-11-17.1";
export const NO_PREDICTION = "No validated prediction is available for this combination of assessments.";

export const CONCORDANCES = Object.freeze([
  {
    id: "wida-model-access-overall-2025-26",
    model: ["MODEL_ONLINE", "MODEL_PAPER"],
    access: "ACCESS (2025-26 administration, reset scale)",
    grades: "1-12",
    scoreType: "Overall composite",
    validFor: ["2025-26"],
    source: SOURCES.concordance,
    guidance: SOURCES.concordanceUse,
    tableLoaded: false,
    verifiedOn: "2026-11-17",
    note: "WIDA describes this table as valid for predicting scores in the 2025-2026 testing window and planned a follow-up study that may update it. Its values have not been entered into the studio.",
  },
]);

/**
 * What the studio can say about predicting ACCESS from one MODEL record.
 * Returns { status: "unavailable", reason, entry|null, source } — "available" is reserved for a loaded,
 * checked table whose versions match exactly.
 */
export function concordanceFor(model, { targetYear } = {}) {
  if (!model || !String(model.assessmentType || "").startsWith("MODEL"))
    return { status: "unavailable", reason: "Choose a MODEL Online or MODEL Paper result.", entry: null, source: SOURCES.concordance };
  const entry = CONCORDANCES.find(
    (c) => c.model.includes(model.assessmentType) && (!targetYear || c.validFor.includes(targetYear)),
  );
  if (!entry)
    return {
      status: "unavailable",
      reason: `${NO_PREDICTION} WIDA's published table covers the 2025-26 window; nothing is recorded for ${targetYear || "this year"}, and older (pre-${SCALE_RESET_YEAR}) mappings do not apply to the reset ACCESS scale.`,
      entry: null,
      source: SOURCES.concordance,
    };
  if (!entry.tableLoaded)
    return {
      status: "unavailable",
      reason: `${NO_PREDICTION} The official table (${entry.scoreType}, grades ${entry.grades}) has not been entered into this studio, so no number is generated. Consult WIDA's table directly.`,
      entry,
      source: entry.source,
    };
  return { status: "unavailable", reason: NO_PREDICTION, entry, source: entry.source };
}
