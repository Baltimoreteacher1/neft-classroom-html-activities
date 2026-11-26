// Pure map from Practice Studio misconception trap IDs to the living-scene
// scene ID that directly demonstrates why that misconception fails.
// Shared between scripts/lib/practice-studio-pages.mjs (build-time) and unit tests.

/** @type {Record<string, Record<string, string>>} */
export const LIVING_TRAP_SCENES = {
  distribute: {
    "algebra-distributive-partial": "predict",
    "equivalence-judged-too-fast": "test",
    "u6-factor-from-one-term": "reverse",
    "term-dropped": "regroup",
    "parentheses-misused": "predict",
  },
  "ratio-scale": {
    "ratio-scaled-additively": "nonequal",
    "ratio-as-difference": "nonequal",
    "ratio-scaled-one-term": "predict",
    "ratio-scale-factor-wrong": "predict",
    "ratio-table-columns-out-of-step": "build",
  },
  "percent-whole": {
    "percent-as-whole-number": "predict",
    "percent-wrong-whole": "wholes",
    "percent-subtracted-from-whole": "predict",
    "percent-decimal-shift": "fdp",
  },
  "mean-balance": {
    "stat-mean-vs-median": "predict",
    "stat-mean-total-confused": "level",
    "stat-mean-out-of-range": "level",
    "stat-outlier-moves-wrong-measure": "outlier",
    "stat-summed-instead-of-averaged": "level",
  },
  exponents: {
    "exponent-as-multiplication": "trap",
    "exponent-base-exponent-swapped": "trap",
    "exponent-factor-count-off": "build",
    "op-added-instead-of-multiplied": "trap",
  },
  "order-of-operations": {
    "order-of-operations-left-to-right": "trap",
    "u6-subtracted-before-multiplying": "trap",
    "u6-exponent-covers-product": "structure",
    "parentheses-misused": "structure",
  },
  "one-step-equation": {
    "u8-equation-one-side": "tilt",
    "equation-not-inverse-operation": "solve",
    "equal-sign-misread": "tilt",
    "solution-not-substituted": "symbols",
    "op-subtracted-instead-of-added": "solve",
  },
  "integers-opposites": {
    "opposite-misread": "mirror",
    "sign-dropped": "situate",
    "negative-direction-reversed": "mirror",
    "zero-reference-misused": "zero",
    "integer-zero-misplaced": "zero",
    "absolute-value-misread": "mirror",
  },
  "parallelogram-area": {
    "geom-height-misidentified": "slant",
    "geom-perpendicular-misread": "slant",
    "geom-area-changes-with-view": "morph",
    "geom-area-halved-wrongly": "morph",
    "geom-area-formula-misapplied": "slant",
  },
  "median-iqr": {
    "stat-range-for-iqr": "iqr",
    "stat-median-middle-wrong": "fold",
    "stat-center-vs-spread": "iqr",
    "stat-outlier-moves-wrong-measure": "outlier",
  },
};

/**
 * Subset of LIVING_TRAP_SCENES[play] whose trap IDs actually appear in a studio's sections
 * (or all traps for that play when sections is omitted).
 * @param {string} play
 * @param {any[]} [sections]
 * @returns {Record<string, string>}
 */
export function livingTrapsFor(play, sections) {
  const map = LIVING_TRAP_SCENES[play];
  if (!map) return {};
  if (!Array.isArray(sections)) return { ...map };
  const used = new Set();
  for (const s of sections) {
    for (const it of [...(s.items || []), ...(s.pool || [])]) {
      for (const t of Array.isArray(it.tag) ? it.tag : []) {
        if (t && Object.hasOwn(map, t)) used.add(t);
      }
    }
  }
  return Object.fromEntries([...used].sort().map((t) => [t, map[t]]));
}
