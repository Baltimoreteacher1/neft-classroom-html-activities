// Verifier 3: vocabulary tier CANDIDATES against a repo-local word-frequency table. It NEVER changes a tier and its output is
// a review queue for a human, not a ruling.
//
// Rubric (three criteria, all computed from data in this repo):
//   domain-specificity   how many of the four subjects (ela, math, science, social studies) use the term's content words
//                        in student-facing text (data/content/word-frequency.json, built from this repo's own units)
//   cross-domain freq    a term made only of everyday words (tools/content/verifiers/lib/common-words.mjs) is Tier 1
//                        material; a term used in 3+ subjects is general academic language
//   instructional need   how many distinct student-text strings in THIS unit use the term (taught words get used)
// Candidate tier: one everyday word -> 1 (a phrase of only everyday words is not scored); used in 3+ subjects -> 2; used in
// one subject -> 3; used in two subjects -> 3 when need is high, else 2. A phrase takes the profile of its most
// domain-specific content word.
//
// Findings:
//   VOCAB_TIER_CANDIDATE     info, one per term: { term, authored, candidate, subjects, uses, agree }
//   VOCAB_TIER_DISAGREE      warn, strong disagreement only: candidate is Tier 1, or an authored Tier 3 SINGLE word used in
//                            3+ subjects and in fewer than 12 strings of its own unit (heavy use there is instructional need). Multi-word terms ("place value", "ten frame") are technical collocations and never
//                            warn on that second rule. Weak disagreements stay info (they are not claimed as defects).
//   VOCAB_TIER_INCONSISTENT  warn, the studio and the unit's lessons give the same term different authored tiers
//   VOCAB_LOW_USE            info, a taught term is used in fewer than 3 strings of its own unit
//
// Limits and false-positive classes (hand-read): the corpus is small and curriculum-shaped, so (1) a general academic word
// that only one subject here happens to use ("admirable", "summarize") looks domain-specific; (2) everyday words with a
// technical meaning ("ones", "tens", "round", "side", "ten") look like Tier 1; (3) a word used by every subject here may still
// be technical for the grade. A reviewer decides; tiers are authored judgments about the learner's grade, which this rubric
// does not see.
import fs from "node:fs";
import { COMMON_WORDS } from "./lib/common-words.mjs";
import { FIXTURES } from "./lib/fixtures-a.mjs";
import { unitStudentText } from "./lib/texts.mjs";
import { stemWord, wordsOf } from "./lib/words.mjs";

export const name = "vocab-tier";
export const fixtures = FIXTURES["vocab-tier"];
export const coverageCodes = ["VOCAB_TIER_CANDIDATE"];
export const FREQUENCY = JSON.parse(
  fs.readFileSync(new URL("../../../data/content/word-frequency.json", import.meta.url), "utf8"),
);
const COMMON = new Set([...COMMON_WORDS].map(stemWord));
const HIGH_NEED = 12; // strings in the unit that use the term
const LOW_USE = 3;

const at = (code, severity, path, message, evidence) => ({
  code,
  severity,
  path,
  message,
  evidence,
});

export function profile(term, freq = FREQUENCY) {
  const stems = wordsOf(term).map(stemWord);
  const content = stems.filter((w) => !COMMON.has(w));
  // The most domain-specific content word decides ("primary source" is social studies even though "source" is everywhere).
  const subjects = content.length
    ? Math.min(...content.map((w) => (freq.words[w] || [1, 1])[1]))
    : 0;
  return { stems, content, subjects, allCommon: content.length === 0, phrase: stems.length > 1 };
}

/** null = not scored: a phrase of only everyday words ("number line", "make a ten") is usually a technical collocation. */
export function candidateTier(p, uses) {
  if (p.allCommon) return p.phrase ? null : 1;
  if (p.subjects >= 3) return 2;
  if (p.subjects <= 1) return 3;
  return uses >= HIGH_NEED ? 3 : 2;
}

function collectTerms(target) {
  const terms = new Map();
  const add = (term, tier, path) => {
    const key = String(term).toLowerCase();
    if (!terms.has(key)) terms.set(key, { term, tiers: new Set(), path });
    terms.get(key).tiers.add(tier);
  };
  (target.studio?.vocab || []).forEach((v, i) => add(v.term, v.tier, `studio.vocab[${i}]`));
  (target.lessons || []).forEach((l, i) =>
    (l.vocab || []).forEach((v, j) => add(v.term, v.tier, `lessons[${i}].vocab[${j}]`)),
  );
  return terms;
}

export function verify(target, freq = FREQUENCY) {
  const stringTokens = unitStudentText(target).map((t) => new Set(wordsOf(t).map(stemWord)));
  const findings = [];
  for (const { term, tiers, path } of collectTerms(target).values()) {
    const p = profile(term, freq);
    const uses = stringTokens.filter((tok) => p.stems.every((w) => tok.has(w))).length;
    const authored = Math.min(...tiers);
    const candidate = candidateTier(p, uses);
    if (candidate === null) {
      findings.push(
        at(
          "VOCAB_TIER_CANDIDATE",
          "info",
          path,
          `${term}: authored tier ${authored}, phrase of everyday words, not scored`,
          { n: 1, term, authored, candidate: null, subjects: 0, uses, agree: null },
        ),
      );
      continue;
    }
    const strong =
      candidate === 1 || (authored === 3 && p.subjects >= 3 && !p.phrase && uses < HIGH_NEED);
    const agree = authored === candidate;
    findings.push(
      at(
        "VOCAB_TIER_CANDIDATE",
        "info",
        path,
        `${term}: authored tier ${authored}, rubric candidate ${candidate}`,
        { n: 1, term, authored, candidate, subjects: p.subjects, uses, agree },
      ),
    );
    if (!agree && strong && authored > 1)
      findings.push(
        at(
          "VOCAB_TIER_DISAGREE",
          "warn",
          path,
          `"${term}" is authored Tier ${authored}; the rubric points to Tier ${candidate} (${p.allCommon ? "only everyday words" : `used in ${p.subjects} subjects`})`,
          { term, authored, candidate, subjects: p.subjects, uses },
        ),
      );
    if (tiers.size > 1)
      findings.push(
        at(
          "VOCAB_TIER_INCONSISTENT",
          "warn",
          path,
          `"${term}" has different authored tiers in this unit: ${[...tiers].sort().join(", ")}`,
          { term, tiers: [...tiers].sort() },
        ),
      );
    if (uses < LOW_USE)
      findings.push(
        at(
          "VOCAB_LOW_USE",
          "info",
          path,
          `"${term}" appears in only ${uses} strings of its own unit`,
          { term, uses },
        ),
      );
  }
  return findings;
}
