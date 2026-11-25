// Verifier: machine-assisted Spanish in units, lesson companions and the shared term bank.
//
// Every Spanish string in this repo's Language Studio content is a DRAFT translation until a fluent reviewer signs off.
// This verifier never asserts that a translation is correct; it flags patterns that are wrong in any dialect. The reviewer
// export (tools/content/spanish-review-export.mjs) lists EN | ES | flags per unit for that human pass and never rewrites.
//
// Spanish strings in this content are short glosses (studio vocab `es`, lesson newcomer items `es`, term bank
// `glosses.es.text`), not sentences, so the checks are tuned for glosses and degrade to no findings on prose-free data.
//
// Findings:
//   spanish_english_leakage     error  an unambiguous English function word inside the Spanish string
//   spanish_placeholder         error  empty/TODO/undefined/bracket placeholder left in the Spanish string
//   spanish_length_ratio        warn   Spanish is under a third or over four times (first alternative) the English length (long strings only)
//   spanish_copies_english      warn   Spanish equals the English and the English carries an English-only ending
//   spanish_decimal_inconsistent warn  one unit mixes decimal comma and decimal point inside Spanish strings (no policy picked)
//   spanish_register_mixed      warn   one unit mixes tu and usted markers
//   spanish_draft_translation   info   count of glosses still awaiting fluent review (per subject)
//
// False-positive classes found by hand-reading the real sweep (docs/content/verifiers-b.md):
//   - leakage stoplist excludes words that are also Spanish or are common proper/units ("a", "me", "no", "sin", "con").
//   - length ratio: legitimate when English is a single short word and Spanish is a two-word phrase ("rate" = "razon de cambio"),
//     which is why short strings are exempt.
//   - register: "tu"/"ti" also appear in quoted example sentences; only whole-word pronoun/verb markers count.

import { alternatives, finding, fold, pairsOf } from "./b-common.mjs";

export const name = "spanish";
export const kinds = ["unit", "term"];

/** Conservative: English function words that are not Spanish words. */
export const ENGLISH_STOPLIST = new Set([
  "the",
  "and",
  "of",
  "is",
  "are",
  "was",
  "were",
  "with",
  "from",
  "that",
  "this",
  "which",
  "have",
  "has",
  "your",
  "you",
  "they",
  "their",
  "for",
  "to",
  "by",
  "not",
  "an",
  "it",
  "its",
  "what",
  "when",
  "where",
  "how",
]);
const ENGLISH_ENDING = /(ing|ed|ly|ness|ful|less|tion)$/;
const PLACEHOLDER = /^(TODO|TBD|N\/A|undefined|null|\?+|-+)$|[[\]{}<>]|\b(TODO|TBD)\b/;
const MIN_RATIO_LEN = 12;
const TU =
  /(?<!\p{L})(t[uú]|tus|ti|contigo|tienes|puedes|eres|quieres|sabes|haces|dices)(?!\p{L})/iu;
const USTED = /(?<!\p{L})usted(?!\p{L})/iu;
const DECIMAL_COMMA = /(?<![\d,.])\d{1,3},\d{1,2}(?![\d,])/;
const DECIMAL_POINT = /(?<![\d,.])\d+\.\d+(?![\d.])/;

const tokens = (s) => fold(s).split(" ").filter(Boolean);

function checkPair(p) {
  const out = [];
  const where = `${p.en} = ${p.es}`;
  if (PLACEHOLDER.test(p.es.trim()) || p.es.trim().length < 2) {
    out.push(
      finding(
        "spanish_placeholder",
        "error",
        p.path,
        "Spanish string is empty or a placeholder",
        where,
      ),
    );
    return out;
  }
  const leaked = tokens(p.es).filter((t) => ENGLISH_STOPLIST.has(t));
  if (leaked.length)
    out.push(
      finding(
        "spanish_english_leakage",
        "error",
        p.path,
        `English word(s) in Spanish: ${[...new Set(leaked)].join(", ")}`,
        where,
      ),
    );
  const first = alternatives(p.es)[0] ?? p.es;
  const ratio = first.length / p.en.length;
  if (Math.max(first.length, p.en.length) >= MIN_RATIO_LEN && (ratio > 4 || ratio < 1 / 3)) {
    out.push(
      finding(
        "spanish_length_ratio",
        "warn",
        p.path,
        `Spanish/English length ratio ${ratio.toFixed(2)}`,
        where,
      ),
    );
  }
  const folded = fold(p.en);
  if (
    folded === fold(p.es) &&
    folded.length >= 6 &&
    ENGLISH_ENDING.test(folded) &&
    p.mark !== "cognate"
  ) {
    out.push(
      finding(
        "spanish_copies_english",
        "warn",
        p.path,
        "Spanish equals the English and is not marked a cognate",
        where,
      ),
    );
  }
  return out;
}

export function verify(subject) {
  const pairs = pairsOf(subject);
  const out = pairs.flatMap(checkPair);
  const spanish = pairs.map((p) => p.es);
  if (spanish.some((s) => DECIMAL_COMMA.test(s)) && spanish.some((s) => DECIMAL_POINT.test(s))) {
    out.push(
      finding(
        "spanish_decimal_inconsistent",
        "warn",
        subject.kind === "unit" ? "studio" : "term",
        "decimal comma and decimal point both appear in Spanish strings",
        spanish
          .filter((s) => /\d/.test(s))
          .slice(0, 4)
          .join(" | "),
      ),
    );
  }
  if (spanish.some((s) => TU.test(s)) && spanish.some((s) => USTED.test(s))) {
    out.push(
      finding(
        "spanish_register_mixed",
        "warn",
        subject.kind === "unit" ? "studio" : "term",
        "tu and usted markers both appear",
        spanish
          .filter((s) => TU.test(s) || USTED.test(s))
          .slice(0, 4)
          .join(" | "),
      ),
    );
  }
  const draft = pairs.filter((p) => !["human", "reviewed"].includes(p.reviewStatus)).length;
  if (draft > 0) {
    out.push(
      finding(
        "spanish_draft_translation",
        "info",
        "es",
        `${draft} Spanish gloss(es) are draft translations awaiting fluent review`,
        `${draft}/${pairs.length}`,
      ),
    );
  }
  return out;
}

/** Flags for one pair, used by the reviewer export so its CSV and the verifier never disagree. */
export const flagsFor = (p) => checkPair(p).map((f) => f.code);

const unit = (id, vocab) => ({ kind: "unit", id, studio: { vocab }, lessons: [] });
export const fixtures = {
  bad: {
    subject: unit("fixture-bad", [
      { term: "ratio", es: "the ratio of two amounts", es_note: "" },
      { term: "decimal", es: "0,5 y tú puedes ver 0.5, o usted", es_note: "" },
      { term: "sum", es: "TODO", es_note: "" },
    ]),
    mustFlag: [
      "spanish_english_leakage",
      "spanish_placeholder",
      "spanish_decimal_inconsistent",
      "spanish_register_mixed",
    ],
  },
  good: {
    subject: unit("fixture-good", [
      { term: "ratio", es: "razón", es_note: "Cognate: sounds the same." },
      { term: "equivalent ratio", es: "razón equivalente", es_note: "Cognate." },
    ]),
  },
};
