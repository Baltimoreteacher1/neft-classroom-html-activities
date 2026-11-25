// Verifier: Spanish-English cognate classification and false-friend safety.
//
// classifyPair(en, es) is a deterministic classifier (no model, no network): normalized edit distance + shared stem
// rules (ph/th/ck/k/y spelling shifts, doubled letters) + the productive suffix mappings in COGNATE_RULES
// (functions/_lib/bcpss/esol-content.js, the single suffix table; -tion/-cion, -ity/-idad, -ic/-ico, -ous/-oso, ...).
// It returns { kind: identical | lookalike | pattern | partial | translation_only, confidence 0..1 }.
// Confidence below LOW_CONFIDENCE goes to the human review queue (info finding `cognate_low_confidence`).
//
// Checks (verify):
//   cognate_marked_false_friend  error  a term the curated false-friend list names is marked as a cognate
//   false_friend_as_translation  error  the Spanish gloss IS the deceptive word the list says to avoid (library = librería)
//   cognate_mark_mismatch        warn   author mark contradicts the classifier at high confidence
//   false_friend_not_flagged     info   listed false friend whose pair is marked "not a cognate" (teach the trap)
//   false_friend_unlisted        info   author marked a false friend the curated list does not hold (curation queue)
//   cognate_low_confidence       info   classifier unsure; review queue
//
// False-positive classes found by hand-reading the real sweep (see docs/content/verifiers-b.md):
//   - cognate_mark_mismatch "cognate" vs translation_only: math/science terms whose Spanish is a Greek/Latin sibling with
//     different spelling (e.g. "area"/"superficie" pairs) and phrase glosses where only a modifier is shared.
//   - cognate_mark_mismatch "not a cognate" vs pattern: author note says "not a cognate" for a loose root link.
// Hits are REPORTED and ratcheted; the verifier never edits content.

import { COGNATE_RULES } from "../../../functions/_lib/bcpss/esol-content.js";
import { alternatives, finding, fold, normalizedDistance, pairsOf } from "./b-common.mjs";

export const name = "cognate";
export const kinds = ["unit", "term"];
export const LOW_CONFIDENCE = 0.6;
const MIN_WORD = 3;
const STOP = new Set([
  "of",
  "the",
  "a",
  "an",
  "to",
  "and",
  "or",
  "in",
  "on",
  "de",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "por",
  "para",
  "con",
  "del",
  "y",
  "o",
  "en",
]);
const RANK = { identical: 4, pattern: 3, lookalike: 2 };

/** Spelling-shift normalization shared by both sides before comparing stems. */
const stemForm = (w) =>
  w
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/ck/g, "c")
    .replace(/k/g, "c")
    .replace(/c(?=[ei])/g, "s")
    .replace(/z/g, "s")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1")
    .replace(/(?<=.{3})[aeo]$/, "");

const singular = (w) =>
  w.length > 4 && w.endsWith("es")
    ? w.slice(0, -2)
    : w.length > 3 && w.endsWith("s")
      ? w.slice(0, -1)
      : w;

function ruleMatch(en, es) {
  for (const rule of COGNATE_RULES) {
    const ruleEs = fold(rule.es);
    if (rule.verbOnly) {
      if (
        es === `${en}ar` ||
        es === `${en}r` ||
        (en.endsWith("e") && es === `${en.slice(0, -1)}ar`)
      )
        return rule;
      continue;
    }
    if (!en.endsWith(rule.en) || !es.endsWith(ruleEs)) continue;
    const a = stemForm(en.slice(0, en.length - rule.en.length));
    const b = stemForm(es.slice(0, es.length - ruleEs.length));
    if (a.length >= 2 && b.length >= 2 && a.slice(0, 3) === b.slice(0, 3)) {
      return { rule, stemDistance: normalizedDistance(a, b) };
    }
  }
  return null;
}

/** Compare two single folded words. Returns { kind, confidence } or null when they share nothing. */
function wordPair(enRaw, esRaw) {
  const en = singular(enRaw);
  const es = singular(esRaw);
  if (en === es) return { kind: "identical", confidence: enRaw === esRaw ? 1 : 0.95 };
  const hit = ruleMatch(en, es);
  if (hit)
    return { kind: "pattern", confidence: Math.round((0.9 - 0.3 * hit.stemDistance) * 100) / 100 };
  const a = stemForm(en);
  const b = stemForm(es);
  if (a === b) return { kind: "identical", confidence: 0.9 };
  const d = normalizedDistance(a, b);
  const prefix = a.slice(0, 3) === b.slice(0, 3);
  if (d <= 0.25 && (prefix || Math.min(a.length, b.length) >= 5))
    return { kind: "lookalike", confidence: Math.round((1 - d) * 100) / 100 };
  if (d <= 0.4 && a.slice(0, 2) === b.slice(0, 2))
    return { kind: "lookalike", confidence: Math.round((1 - d) * 100) / 100 };
  return null;
}

const contentWords = (s) =>
  fold(s)
    .split(" ")
    .filter((w) => w.length >= MIN_WORD && !STOP.has(w));

/** Classify one English term against one Spanish gloss (alternatives split on / , ;). */
export function classifyPair(en, es) {
  const enWords = contentWords(en);
  const esWords = alternatives(es).flatMap(contentWords);
  if (enWords.length === 0 || esWords.length === 0) {
    return { kind: "translation_only", confidence: 0.5, why: "no content words to compare" };
  }
  const matches = [];
  let closest = 1;
  for (const e of enWords) {
    let best = null;
    for (const s of esWords) {
      const m = wordPair(e, s);
      if (
        m &&
        (!best ||
          (RANK[m.kind] ?? 0) > (RANK[best.kind] ?? 0) ||
          (m.kind === best.kind && m.confidence > best.confidence))
      )
        best = m;
      closest = Math.min(closest, normalizedDistance(stemForm(e), stemForm(s)));
    }
    if (best) matches.push(best);
  }
  if (matches.length === 0) {
    return {
      kind: "translation_only",
      confidence: Math.round(Math.min(0.95, closest) * 100) / 100,
    };
  }
  const weakest = matches.reduce((w, m) => ((RANK[m.kind] ?? 0) < (RANK[w.kind] ?? 0) ? m : w));
  const mean = matches.reduce((n, m) => n + m.confidence, 0) / matches.length;
  if (matches.length < enWords.length) {
    return {
      kind: "partial",
      confidence: Math.round(mean * (matches.length / enWords.length) * 100) / 100,
    };
  }
  const allIdentical = matches.every((m) => m.kind === "identical");
  return {
    kind: allIdentical ? "identical" : weakest.kind,
    confidence: Math.round(Math.min(mean, weakest.confidence + 0.1) * 100) / 100,
  };
}

/** Lookup structure for the curated list: Map(folded English word -> entry). */
export function falseFriendIndex(list) {
  return new Map((list?.entries ?? []).map((e) => [fold(e.en), e]));
}

const lookup = (index, term) => {
  const key = fold(term);
  return index.get(key) ?? index.get(singular(key)) ?? null;
};

export function verify(subject, ctx) {
  const index = ctx.falseFriends;
  const out = [];
  for (const p of pairsOf(subject)) {
    const listed = lookup(index, p.en);
    const cls = classifyPair(p.en, p.es);
    const where = `${p.path} ${p.en} = ${p.es}`;
    if (listed && p.mark === "cognate") {
      out.push(
        finding(
          "cognate_marked_false_friend",
          "error",
          p.path,
          `"${p.en}" is a listed false friend but is marked as a cognate`,
          `${where}; list: ${listed.es_false} means ${listed.es_means}`,
        ),
      );
    }
    if (listed && alternatives(p.es).some((alt) => fold(alt) === fold(listed.es_false))) {
      out.push(
        finding(
          "false_friend_as_translation",
          "error",
          p.path,
          `Spanish gloss "${p.es}" is the deceptive word for "${p.en}"`,
          `${where}; correct: ${listed.es_correct}`,
        ),
      );
    }
    if (listed && p.mark === "not_cognate") {
      out.push(
        finding(
          "false_friend_not_flagged",
          "info",
          p.path,
          `"${p.en}" is a listed false friend but the pair is marked "not a cognate"`,
          where,
        ),
      );
    }
    if (!listed && p.mark === "false_friend") {
      out.push(
        finding(
          "false_friend_unlisted",
          "info",
          p.path,
          `"${p.en}" is marked a false friend; not in the curated list (curation queue)`,
          where,
        ),
      );
    }
    if (p.mark === "cognate" && cls.kind === "translation_only" && cls.confidence >= 0.75) {
      out.push(
        finding(
          "cognate_mark_mismatch",
          "warn",
          p.path,
          `marked cognate, classifier says translation_only (${cls.confidence})`,
          where,
        ),
      );
    } else if (
      p.mark === "not_cognate" &&
      (cls.kind === "identical" || cls.kind === "pattern") &&
      cls.confidence >= 0.85
    ) {
      out.push(
        finding(
          "cognate_mark_mismatch",
          "warn",
          p.path,
          `marked not a cognate, classifier says ${cls.kind} (${cls.confidence})`,
          where,
        ),
      );
    }
    if (cls.confidence < LOW_CONFIDENCE) {
      out.push(
        finding(
          "cognate_low_confidence",
          "info",
          p.path,
          `classifier ${cls.kind} at ${cls.confidence}: human review queue`,
          where,
        ),
      );
    }
  }
  return out;
}

const bad = {
  kind: "unit",
  id: "fixture-bad",
  studio: {
    vocab: [
      { term: "library", es: "librería", es_note: "Cognate: sounds and means almost the same." },
      { term: "exit", es: "éxito", es_note: "Cognate: sounds the same." },
    ],
  },
  lessons: [],
};
const good = {
  kind: "unit",
  id: "fixture-good",
  studio: {
    vocab: [
      { term: "library", es: "biblioteca", es_note: "False friend: 'librería' is a bookstore." },
      { term: "fraction", es: "fracción", es_note: "Cognate: sounds and means almost the same." },
    ],
  },
  lessons: [],
};

/** Negative control: bad must raise these codes, good must raise no error. */
export const fixtures = {
  bad: { subject: bad, mustFlag: ["cognate_marked_false_friend", "false_friend_as_translation"] },
  good: { subject: good },
};
