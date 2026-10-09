/**
 * Family-facing lesson fields — the one definition of their shape.
 *
 * Three optional top-level fields in lessons/<id>/config.json feed the public
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
 *   familyLanguages    { ar, fr, prs }: machine-translated key idea + vocabulary,
 *                      shown in the family page's language picker and labelled
 *                      "Automatic translation" in that language and in English.
 *
 * The generator and `validate:family-exit-ticket` both read this module, so the
 * schema the sibling content authors write against is checked in one place.
 */

/** Order is the picker order. `rtl` drives dir="rtl" on the panel. */
export const FAMILY_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  {
    code: "ar",
    name: "العربية",
    rtl: true,
    machine: true,
    autoLabel: "ترجمة آلية",
  },
  { code: "fr", name: "Français", machine: true, autoLabel: "Traduction automatique" },
  {
    code: "prs",
    name: "دری",
    rtl: true,
    machine: true,
    autoLabel: "ترجمه ماشینی",
  },
];

/** The codes `familyLanguages` must carry — exactly these, no more. */
export const MACHINE_LANGUAGE_CODES = FAMILY_LANGUAGES.filter((l) => l.machine).map((l) => l.code);

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

function familyLanguagesProblems(cfg) {
  const fl = cfg.familyLanguages;
  if (fl === undefined) return [];
  if (!fl || typeof fl !== "object" || Array.isArray(fl))
    return ["familyLanguages must be an object"];
  const out = [];
  const codes = Object.keys(fl).sort();
  const want = [...MACHINE_LANGUAGE_CODES].sort();
  if (JSON.stringify(codes) !== JSON.stringify(want))
    out.push(
      `familyLanguages must have exactly ${want.join(", ")} (has ${codes.join(", ") || "none"})`,
    );
  const terms = (Array.isArray(cfg.vocabulary) ? cfg.vocabulary : [])
    .map((v) => v?.term)
    .filter(isNonEmptyString);
  for (const code of codes) {
    const entry = fl[code];
    if (!entry || typeof entry !== "object") {
      out.push(`familyLanguages.${code} must be an object`);
      continue;
    }
    if (!isNonEmptyString(entry.keyIdea)) out.push(`familyLanguages.${code}.keyIdea is missing`);
    if (!Array.isArray(entry.vocabulary)) {
      out.push(`familyLanguages.${code}.vocabulary must be an array`);
      continue;
    }
    const seen = new Set();
    entry.vocabulary.forEach((w, i) => {
      if (!terms.includes(w?.term))
        out.push(
          `familyLanguages.${code}.vocabulary[${i}].term "${w?.term}" is not a vocabulary[] term`,
        );
      if (seen.has(w?.term)) out.push(`familyLanguages.${code} repeats term "${w?.term}"`);
      seen.add(w?.term);
      if (!isNonEmptyString(w?.translation) || !isNonEmptyString(w?.definition))
        out.push(`familyLanguages.${code}.vocabulary[${i}] needs translation and definition`);
    });
    const missing = terms.filter((t) => !seen.has(t));
    if (missing.length)
      out.push(`familyLanguages.${code} is missing term(s): ${missing.join(", ")}`);
  }
  return out;
}

/** Every schema problem in a config's family fields; [] when it is clean. */
export function familyFieldProblems(cfg) {
  return [
    ...familyCheckProblems(cfg),
    ...familyKeyIdeaProblems(cfg),
    ...familyLanguagesProblems(cfg),
  ];
}
