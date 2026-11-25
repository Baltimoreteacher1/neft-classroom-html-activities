// Shared traversal of a verifier target: { id, grade, subject, studio, lessons[] }.
// Studio and lesson payloads are walked as plain data so every verifier sees the same strings with the same paths.

// Keys whose strings are never student-facing prose (ids, enums, icons) or are intentionally not-true (nonexample, wrong).
const SKIP_KEYS = new Set([
  "id",
  "unit_id",
  "kind",
  "domain",
  "grouping",
  "step",
  "source",
  "role",
  "tone",
  "icon",
  "type",
  "status",
  "framework",
  "pld_targets",
  "standards",
  "klu",
  "function",
  "new_or_review",
  "nonexample",
  "wrong",
]);
// Spanish and cognate glosses: other verifiers own these.
const SPANISH_KEYS = new Set(["es", "es_note"]);

// Teacher notes that describe a student's wrong thinking on purpose: not claims the content asserts.
const ERROR_DESCRIPTION =
  /(?:^|\.)(?:watchouts|l1_watchouts|common_language_misconception)(?:\[|\.|$)|(?:^|\.)misconception\.pattern$|\.watchouts\[/;

export const optionLabel = (o) => (o && typeof o === "object" ? o.label : o);

/**
 * Every prose string with its path. Multiple-choice distractors (options other than the keyed answer) are reported
 * with distractor=true because they are wrong on purpose.
 */
export function* walkStrings(value, path = "", flags = {}) {
  if (typeof value === "string") {
    if (ERROR_DESCRIPTION.test(path)) return;
    yield { path, text: value, ...flags };
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* walkStrings(value[i], `${path}[${i}]`, flags);
    return;
  }
  if (!value || typeof value !== "object") return;
  const key = Number.isInteger(value.answer) && Array.isArray(value.options) ? value.answer : -1;
  for (const [k, v] of Object.entries(value)) {
    if (SKIP_KEYS.has(k) || SPANISH_KEYS.has(k)) continue;
    const here = path ? `${path}.${k}` : k;
    if (k === "options" && key >= 0 && Array.isArray(v)) {
      for (let i = 0; i < v.length; i += 1)
        yield* walkStrings(
          v[i],
          `${here}[${i}]`,
          i === key ? flags : { ...flags, distractor: true },
        );
    } else yield* walkStrings(v, here, flags);
  }
}

/** Every object (any depth) with its path, for shape-based structured checks. */
export function* walkObjects(value, path = "") {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* walkObjects(value[i], `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    yield { path, obj: value };
    for (const [k, v] of Object.entries(value)) yield* walkObjects(v, path ? `${path}.${k}` : k);
  }
}

/** Studio plus lessons as one rooted object so paths read "studio.activities[3]..." / "lessons[1].arc[2]...". */
/**
 * Path prefixes of DERIVED activities (the Listening Lab). Their items are verbatim copies of authored strings
 * (gate G-53 proves each equals its source) and their other text is fixed template wording, so verifiers that count
 * repeats of authored text skip them: the authored source is still scanned, and counting the copy would count every
 * existing finding twice. Verifiers that judge text on its own merits (sensitivity, arithmetic) still read them.
 */
export const derivedPrefixes = (target) =>
  (target.studio?.activities || []).flatMap((a, i) =>
    a?.derived ? [`studio.activities[${i}].`] : [],
  );

export const rootOf = (target) => ({ studio: target.studio, lessons: target.lessons || [] });

export const subjectOf = (target) =>
  String(target.subject || target.id?.split("-")[1] || "").toLowerCase();
export const isMathOrScience = (target) => /^(math|sci)/.test(subjectOf(target));
