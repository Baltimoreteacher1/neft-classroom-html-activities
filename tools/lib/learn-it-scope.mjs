/**
 * learn-it-scope.mjs — does a lesson's Learn It teach THIS lesson?
 *
 * WHY THIS EXISTS, and why it is not the interactive-alignment gate. That gate
 * asks whether the right TOOL is mounted. Lesson 5-10 ("Volume of Rectangular
 * Prisms", 6.GR.2 — volume with fractional edges, via base area × height)
 * showed the second half of the same failure: the lesson also carried a full
 * vocabulary entry for **Net** — term, translation, definition, cloze, worked
 * example, non-example, and a slot in the printed word search — for a concept
 * lesson 5-6 (6.GR.4) teaches and lesson 5-10 never once asks a student to use.
 * Meanwhile the method its own objective names, base area × height, appeared in
 * the objective, in the vocabulary, in the Turn-and-Talk extension and in the
 * extending practice — everywhere except the worked example that is supposed to
 * teach it.
 *
 * Those are the two directions of the same defect, and both are decidable:
 *
 *   ORPHAN     a concept taught in Learn It that the lesson never uses again.
 *   UNTAUGHT   a concept the lesson's own objective names that Learn It never
 *              models.
 *   FOREIGN    Learn It prose asserting a formula from a different topic than
 *              the lesson's standard.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. Judge pedagogy. "Is this explanation good?"
 * and "is this the right amount of scaffolding?" are reading tasks. Every
 * detector here is a string fact about the lesson compared against another
 * string fact about the same lesson, and each flag is EVIDENCE for a human, not
 * a verdict — recorded in data/learn-it-scope-review.json the same way the
 * interactive audit records its own.
 *
 * THE EVIDENCE MUST EXCLUDE THE THING BEING JUDGED. A vocabulary term is
 * trivially "used by the lesson" if you search the vocabulary block, and a
 * worked example trivially "teaches" whatever it names if you search itself.
 * withoutVocabulary() and the section split below are that guard; the self-test
 * pins both, because getting this wrong makes the sweep report a clean fleet.
 */

/** Where Learn It lives. One place, named once. */
export const LEARN_IT_PATH = ["launch", "conceptIntro"];

export function learnIt(config) {
  return config?.launch?.conceptIntro || null;
}

/** Every string in a node, flattened. */
export function textOf(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) textOf(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) textOf(v, out);
  return out;
}

const lower = (s) => String(s).toLowerCase();

/**
 * A copy of the lesson with the vocabulary block removed.
 *
 * Without this, "does the lesson use this term?" is answered by the term's own
 * definition, cloze sentence and examples — and every term passes.
 */
export function withoutVocabulary(config) {
  const { vocabulary: _drop, notebook: _nb, ...rest } = config || {};
  return rest;
}

/**
 * Words that carry no topic on their own, so their presence is not evidence a
 * concept is in use. Kept short on purpose: a long list here is how a detector
 * is quietly switched off.
 */
const STOPWORDS = new Set(["of", "the", "a", "an", "and", "or", "in", "to", "with"]);

/**
 * The searchable stems of a multi-word term: "Base area" -> ["base","area"].
 *
 * Truncated to six characters so ordinary English inflection is not read as
 * absence. Without it the first sweep reported lesson 1-2 as never using
 * "quantity" — its objective says "compare quantities" — and 1-3 as never using
 * "representation" while its Learn It is about representing problems. A
 * detector that cannot tell a plural from a missing concept manufactures
 * findings, and findings a reader has to dismiss are how an audit gets ignored.
 * Six is short enough for quantit/quantities and repres/representing, long
 * enough that perpendicular and variability still mean themselves.
 */
export function termStems(term) {
  return lower(term)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => w.slice(0, 6));
}

/**
 * ORPHAN. A vocabulary term the lesson teaches in full and then never uses.
 *
 * A term counts as USED when every one of its stems appears somewhere in the
 * lesson outside the vocabulary block. All stems, not any: "base" alone is in
 * every geometry lesson, and "area" alone is in most; "base area" is the claim.
 *
 * The `role:"concept"` term is exempt — it is the lesson's title restated, and
 * naming the lesson is not scope drift.
 */
export function orphanTerms(config) {
  const body = lower(textOf(withoutVocabulary(config)).join(" "));
  const out = [];
  for (const entry of config?.vocabulary || []) {
    const term = entry?.term;
    if (!term || entry.role === "concept") continue;
    const stems = termStems(term);
    if (!stems.length) continue;
    if (!stems.every((s) => body.includes(s))) out.push(term);
  }
  return out;
}

/**
 * UNTAUGHT. A concept the lesson's own contentObjective names, which the
 * lesson also treats as vocabulary, and which the Learn It worked example never
 * mentions.
 *
 * Anchored to the intersection of objective AND vocabulary on purpose. The
 * objective alone is prose and would flag ordinary English; the vocabulary
 * alone would demand every term be worked through Learn It, which is not what
 * a vocabulary list is for. A term the lesson considers important enough to
 * define AND important enough to state in its objective is the lesson's own
 * declaration of what Learn It has to cover.
 */
export function untaughtObjectiveTerms(config) {
  const li = learnIt(config);
  if (!li) return [];
  const objective = lower(config?.contentObjective || "");
  if (!objective) return [];
  const taught = lower(textOf(li).join(" "));
  const out = [];
  for (const entry of config?.vocabulary || []) {
    const term = entry?.term;
    if (!term || entry.role === "concept") continue;
    const stems = termStems(term);
    if (!stems.length) continue;
    if (!stems.every((s) => objective.includes(s))) continue; // not named in the objective
    if (!stems.every((s) => taught.includes(s))) out.push(term);
  }
  return out;
}

/**
 * FOREIGN. Learn It prose asserting a formula that belongs to another topic.
 *
 * Keyed to data/ccss-standards.json's own `topic` field, exactly as
 * TOOL_TOPICS is — the curriculum's own answer to "what is this standard
 * about?", never inferred from the standard code. Only unambiguous formula
 * phrases are listed: "surface area" is a named quantity with its own units and
 * its own standard, "area" alone is not, because a volume lesson legitimately
 * says "base area".
 */
export const FORMULA_TOPICS = [
  { phrase: "surface area", topics: ["surface-area", "measurement"] },
  { phrase: "net", topics: ["surface-area"], wordBoundary: true },
  { phrase: "cross-section", topics: ["surface-area", "volume"] },
  { phrase: "interquartile", topics: ["statistics"] },
  { phrase: "mean absolute deviation", topics: ["statistics"] },
  { phrase: "unit rate", topics: ["ratios"] },
  { phrase: "greatest common factor", topics: ["factors"] },
  { phrase: "least common multiple", topics: ["factors"] },
  { phrase: "absolute value", topics: ["number-line", "coordinate-plane"] },
];

export function foreignFormulas(config, standardTopic) {
  const li = learnIt(config);
  if (!li || !standardTopic) return [];
  const text = lower(textOf(li).join(" "));
  const out = [];
  for (const { phrase, topics, wordBoundary } of FORMULA_TOPICS) {
    const hit = wordBoundary ? new RegExp(`\\b${phrase}s?\\b`).test(text) : text.includes(phrase);
    if (hit && !topics.includes(standardTopic)) out.push(phrase);
  }
  return out;
}

/** All three detectors for one lesson. */
export function scopeFindings(config, standardTopic) {
  const findings = [];
  for (const term of orphanTerms(config)) {
    findings.push({ detector: "ORPHAN", subject: term });
  }
  for (const term of untaughtObjectiveTerms(config)) {
    findings.push({ detector: "UNTAUGHT", subject: term });
  }
  for (const phrase of foreignFormulas(config, standardTopic)) {
    findings.push({ detector: "FOREIGN", subject: phrase });
  }
  return findings;
}
