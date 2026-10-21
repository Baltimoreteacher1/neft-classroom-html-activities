/**
 * Family-facing lesson fields — the one definition of their shape.
 *
 * Optional top-level fields in lessons/<id>/config.json feed the public
 * family page (lessons/<id>/family/), rendered by
 * scripts/generate-lesson-support-pages.mjs, and the family homework ladder
 * (scripts/homework-guided-notes.mjs):
 *
 *   familyCheck        a PARALLEL item to `reflect.exitTicket`: same keys (Spanish
 *                      siblings included), same skill and difficulty, different
 *                      numbers and context. It replaces the exit ticket on every
 *                      family surface; a lesson without one shows no check item.
 *   familyKeyIdea(+Es) the key idea in plain words; overrides the teacher key idea
 *                      on the family page only.
 *
 * Family surfaces are English and Spanish only (Joel, 2026-10-21: "I only need
 * spanish and english"). `familyLanguages` — a machine-translated Arabic / French
 * / Dari key idea + glossary that once fed a language picker — was deleted, and
 * `FORBIDDEN_FAMILY_FIELDS` makes the schema fail if a config ever carries it
 * again.
 *
 * The generator and `validate:family-exit-ticket` both read this module, so the
 * schema the sibling content authors write against is checked in one place.
 */

/**
 * Config keys that must never come back. The only languages on a family surface
 * are English and Spanish, so a key that carries any other language is a schema
 * error, not an optional extra.
 */
export const FORBIDDEN_FAMILY_FIELDS = ["familyLanguages"];

/** Arrays that run parallel to `choices` and must keep its length. */
const PARALLEL_TO_CHOICES = [
  "choicesEs",
  "choiceFeedback",
  "choiceFeedbackEs",
  "misconceptionTags",
];

/**
 * Normalize a question stem for identity comparison: NFKC (so 3⁴ → 34 and
 * full-width forms fold), lower-case, every run of non-alphanumerics collapsed
 * to one space. Two stems that differ only in punctuation or spacing are the
 * same question to a reader.
 */
export function normalizeStem(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function familyCheckProblems(cfg) {
  const fc = cfg.familyCheck;
  if (fc === undefined) return [];
  const out = [];
  if (!fc || typeof fc !== "object" || Array.isArray(fc)) return ["familyCheck must be an object"];
  if (!isNonEmptyString(fc.stem)) out.push("familyCheck.stem is missing");
  if (!Array.isArray(fc.choices) || fc.choices.length < 2) {
    out.push("familyCheck.choices needs at least 2 choices");
    return out;
  }
  if (
    !Number.isInteger(fc.correctIndex) ||
    fc.correctIndex < 0 ||
    fc.correctIndex >= fc.choices.length
  )
    out.push(`familyCheck.correctIndex ${fc.correctIndex} is not a valid choice index`);
  for (const key of PARALLEL_TO_CHOICES) {
    if (fc[key] !== undefined && (!Array.isArray(fc[key]) || fc[key].length !== fc.choices.length))
      out.push(`familyCheck.${key} must have ${fc.choices.length} entries like choices`);
  }
  const et = cfg.reflect?.exitTicket;
  if (et && typeof et === "object") {
    // `misconceptionTags` is diagnostic metadata, authored per distractor and
    // optional on either item, so it does not count toward the shape.
    const shapeKeys = (o) =>
      Object.keys(o)
        .filter((k) => k !== "misconceptionTags")
        .sort();
    const want = shapeKeys(et);
    const have = shapeKeys(fc);
    const missing = want.filter((k) => !have.includes(k));
    const extra = have.filter((k) => !want.includes(k));
    if (missing.length) out.push(`familyCheck lacks exit-ticket key(s): ${missing.join(", ")}`);
    if (extra.length) out.push(`familyCheck has key(s) the exit ticket lacks: ${extra.join(", ")}`);
    if (normalizeStem(fc.stem) === normalizeStem(et.stem))
      out.push("familyCheck.stem is the exit-ticket stem — it must be a parallel problem");
    // Categorical choices (quadrant names, true/false) legitimately repeat; only
    // numeric choices can be "different numbers".
    if (
      Array.isArray(et.choices) &&
      et.choices.some((c) => /\d/.test(String(c))) &&
      JSON.stringify(fc.choices.map(normalizeStem)) ===
        JSON.stringify(et.choices.map(normalizeStem))
    )
      out.push("familyCheck.choices repeat the exit ticket's choices — use different numbers");
  }
  return out;
}

function familyKeyIdeaProblems(cfg) {
  const out = [];
  if (cfg.familyKeyIdea !== undefined && !isNonEmptyString(cfg.familyKeyIdea))
    out.push("familyKeyIdea must be a non-empty string");
  if (cfg.familyKeyIdea !== undefined && !isNonEmptyString(cfg.familyKeyIdeaEs))
    out.push("familyKeyIdeaEs is required when familyKeyIdea is set");
  if (cfg.familyKeyIdeaEs !== undefined && cfg.familyKeyIdea === undefined)
    out.push("familyKeyIdeaEs is set without familyKeyIdea");
  return out;
}

function forbiddenFieldProblems(cfg) {
  return FORBIDDEN_FAMILY_FIELDS.filter((key) => cfg[key] !== undefined).map(
    (key) => `${key} is not allowed: family surfaces are English and Spanish only (delete the key)`,
  );
}

/** Every schema problem in a config's family fields; [] when it is clean. */
export function familyFieldProblems(cfg) {
  return [
    ...familyCheckProblems(cfg),
    ...familyKeyIdeaProblems(cfg),
    ...forbiddenFieldProblems(cfg),
  ];
}
