// MODEL-to-ACCESS concordance. WIDA's published table ("Using WIDA MODEL scores to predict performance on
// ACCESS for ELLs", WIDA TR-2019-4, released April 2019) relates a MODEL Online Overall Composite SCALE score to
// a predicted ACCESS Overall Composite proficiency-level RANGE, by grade 1-12, at four anchor levels. Values
// below are copied from WIDA's PDF (read 2026-11-17). The table states it was published before ACCESS was
// revised in 2025-26, so the studio applies it only to MODEL Online results from before 2025-26; for later
// results it shows the table for reference and says why no estimate is given. It never extrapolates outside
// the table (WIDA: no reliable predictions below PL 2.0 or above PL 4.5).
import { SCALE_RESET_YEAR, SOURCES } from "./rules.js";

export const CONCORDANCE_VERSION = "2026-11-17.2";
export const NO_PREDICTION =
  "No validated prediction is available for this combination of assessments.";

/** Anchor levels and, per grade, [MODEL Online overall scale score, predicted ACCESS PL range lo, hi]. */
export const ANCHOR_LEVELS = Object.freeze([2.0, 3.0, 4.0, 4.5]);
export const MODEL_ACCESS_TABLE = Object.freeze({
  1: [
    [233, 1.8, 2.3],
    [267, 2.8, 3.1],
    [323, 3.7, 4.3],
    [343, 4.0, 4.9],
  ],
  2: [
    [235, 1.9, 2.2],
    [281, 2.8, 3.1],
    [336, 3.8, 4.1],
    [347, 4.0, 4.5],
  ],
  3: [
    [240, 1.9, 2.3],
    [286, 2.8, 3.1],
    [340, 3.9, 4.0],
    [363, 4.3, 4.7],
  ],
  4: [
    [255, 1.9, 2.3],
    [292, 2.8, 3.1],
    [345, 3.9, 4.0],
    [365, 4.3, 4.6],
  ],
  5: [
    [254, 1.9, 2.2],
    [296, 2.8, 3.1],
    [352, 3.9, 4.0],
    [374, 4.3, 4.6],
  ],
  6: [
    [282, 1.9, 2.2],
    [319, 2.8, 3.0],
    [366, 3.9, 4.1],
    [385, 4.3, 4.6],
  ],
  7: [
    [288, 1.9, 2.1],
    [328, 2.9, 3.0],
    [376, 3.9, 4.0],
    [397, 4.3, 4.6],
  ],
  8: [
    [303, 1.9, 2.1],
    [338, 2.9, 3.0],
    [381, 3.9, 4.0],
    [399, 4.4, 4.6],
  ],
  9: [
    [299, 1.9, 2.0],
    [338, 2.9, 3.0],
    [385, 3.9, 4.0],
    [405, 4.3, 4.6],
  ],
  10: [
    [305, 1.9, 2.1],
    [347, 2.8, 3.0],
    [399, 3.9, 4.1],
    [421, 4.3, 4.6],
  ],
  11: [
    [305, 1.9, 2.2],
    [346, 2.8, 3.1],
    [399, 3.9, 4.1],
    [420, 4.3, 4.6],
  ],
  12: [
    [330, 2.0, 2.7],
    [357, 2.7, 3.1],
    [413, 3.8, 4.1],
    [427, 4.0, 4.5],
  ],
});

export const CONCORDANCES = Object.freeze([
  {
    id: "wida-tr-2019-4-model-online-overall",
    model: ["MODEL_ONLINE"],
    access: `ACCESS for ELLs before the ${SCALE_RESET_YEAR} revision (2016 cut scores)`,
    grades: "1-12",
    scoreType:
      "MODEL Online Overall Composite scale score → ACCESS Overall Composite proficiency level",
    validFor: `MODEL Online results from before ${SCALE_RESET_YEAR}`,
    source: SOURCES.concordance,
    pdf: "https://wida.wisc.edu/sites/default/files/resource/MODEL-ACCESS-Concordance-Table.pdf",
    research: "WIDA TR-2019-4 (Wisconsin Center for Education Research, 2019)",
    tableLoaded: true,
    verifiedOn: "2026-11-17",
    caveats: [
      "Predictions assume MODEL and ACCESS are taken on the same day; the longer the gap between tests, the less reliable the estimate.",
      "WIDA's data give no reliable predictions below proficiency level 2.0 or above 4.5.",
      "A range is shown because every prediction includes error; it is not an exact score.",
    ],
  },
]);

const range = (lo, hi) => ({ lo, hi });

/** Estimate from the table for one grade and scale score (pure; no version checks). */
export function lookupConcordance(grade, scale) {
  const rows = MODEL_ACCESS_TABLE[grade];
  if (!rows || !Number.isFinite(scale)) return null;
  if (scale < rows[0][0]) return { kind: "below", range: null, anchors: [rows[0]] };
  if (scale > rows.at(-1)[0]) return { kind: "above", range: null, anchors: [rows.at(-1)] };
  const exact = rows.find((r) => r[0] === scale);
  if (exact) return { kind: "exact", range: range(exact[1], exact[2]), anchors: [exact] };
  const i = rows.findIndex((r) => r[0] > scale);
  const a = rows[i - 1];
  const b = rows[i];
  // WIDA: between two listed scores, the likely level is somewhere between the two predicted ranges.
  return { kind: "between", range: range(a[1], b[2]), anchors: [a, b] };
}

/**
 * What the studio can say about predicting ACCESS from one MODEL record. Returns
 * { status: "available" | "unavailable", reason, estimate?, entry, source }.
 */
export function concordanceFor(model) {
  const entry = CONCORDANCES[0];
  const no = (reason) => ({
    status: "unavailable",
    reason: `${NO_PREDICTION} ${reason}`.trim(),
    entry,
    source: entry.source,
  });
  if (!model || !String(model.assessmentType || "").startsWith("MODEL"))
    return no("Choose a MODEL Online result.");
  if (model.assessmentType !== "MODEL_ONLINE")
    return no(
      "WIDA's table is for MODEL Online only; it does not cover MODEL Paper or Kindergarten MODEL.",
    );
  if (model.academicYear >= SCALE_RESET_YEAR)
    return no(
      `WIDA's table was published before ACCESS was revised in ${SCALE_RESET_YEAR}, so it is not applied to results from ${model.academicYear}. Use the table below only as background.`,
    );
  const grade = Number(model.grade);
  if (!(Number.isInteger(grade) && grade >= 1 && grade <= 12))
    return no("Add the student's grade (1-12) to this MODEL result.");
  const scale = model.composites?.Overall?.scale;
  if (scale == null)
    return no(
      "Add the MODEL Online Overall Composite scale score; the table is built on scale scores, not levels.",
    );
  const est = lookupConcordance(grade, scale);
  if (est.kind === "below")
    return no(
      `A grade ${grade} score of ${scale} is below the table, where WIDA reports no reliable prediction (below level 2.0).`,
    );
  if (est.kind === "above")
    return no(
      `A grade ${grade} score of ${scale} is above the table, where WIDA reports no reliable prediction (above level 4.5).`,
    );
  return {
    status: "available",
    reason: `WIDA's concordance table predicts an ACCESS Overall proficiency level of about ${est.range.lo.toFixed(1)} to ${est.range.hi.toFixed(1)} for a grade ${grade} MODEL Online Overall scale score of ${scale}.`,
    estimate: { grade, scale, ...est },
    entry,
    source: entry.source,
  };
}
