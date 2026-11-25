# Content verifiers A: arithmetic, readability, vocab-tier

Three read-only verifiers over the 162 BCPSS units (studio content plus lessons). They report findings and
ratchet them against committed baselines. They never edit content and never change a tier.

```
node tools/content/verify.mjs [--verifier=<name|all>] [--unit=<id|all>] [--json] [--update-baseline]
npm run test:verifiers-a
npm run validate:content-verifiers-a
```

Exit codes: `0` no new findings and coverage holds, `1` new findings (per unit and code) or a coverage floor
fell below 90% of the measured count, `3` the gate itself is broken (negative control stopped firing, bad
arguments, missing baseline, a verifier threw). CI treats 3 as failure.

## How the gate works

- A verifier is a pure `verify(target)` over `{ id, grade, subject, studio, lessons[] }` returning
  `[{ code, severity: error|warn|info, path, message, evidence }]`. Registered in `tools/content/registry.mjs`
  (one entry per line, alphabetical; verifiers B append there).
- Before the sweep, the driver runs each verifier's fixtures: every known-bad fixture must raise its code
  and every known-good fixture must raise no error or warn. A detector that stops firing makes the CLI exit 3
  before it looks at real content.
- Baselines (`tools/content/baselines/<name>.json`) hold per-unit counts of error/warn findings. Counts may
  only go down. `--update-baseline` writes a missing baseline or ratchets down, and refuses to raise one.
  Run it on a full run only.
- Coverage floors: each verifier names `coverageCodes` (claims checked, units measured, terms scored). The
  baseline floors those counts at 90%, so a parser that silently looks at nothing fails with exit 1.
- Test hooks: `CONTENT_VERIFY_FAULT_DROP=CODE` drops a code from verifier output (proves the negative
  control trips); `CONTENT_VERIFY_BASELINE_DIR` points the ratchet at a scratch copy.

## 1. arithmetic (math and science units only)

Exact rational arithmetic on BigInt (`lib/rational.mjs`); no floats. Units are compared as shapes, so
`60 in^2` is not `60 in^3`, and different base units (`cm` vs `m`) are skipped, not guessed.

Claims decided: `a op b = c` chains and comparisons, "of" with fractions and percents, percent / out-of /
fraction value pairs, equivalent ratios, simplest form, unit rates, "sum/difference/product/quotient of",
reciprocal, expanded form, common denominator, remainder statements, cloze items (blanks filled with their
answers), multiple-choice stems that are a pure expression / "Compare a and b" / "equivalent to a to b"
(the key must be right and no distractor may also be right), word-sort "Equivalent to ..." groups, match
pairs (rate to unit rate, value to value), and `area|volume|perimeter ... is <n> <unit>` where the unit's
dimension cannot be the quantity's.

Codes: `ARITH_VALUE_MISMATCH`, `ARITH_COMPARISON_FALSE`, `ARITH_UNIT_MISMATCH`, `ARITH_PERCENT_WRONG`,
`ARITH_RATIO_EQUIV_FALSE`, `ARITH_SIMPLIFY_WRONG`, `ARITH_RATE_WRONG`, `ARITH_KEY_MISMATCH`,
`ARITH_DUPLICATE_CORRECT`, `ARITH_SORT_WRONG`, `ARITH_MATCH_WRONG` (all error). Info: `ARITH_CHECKED`
(decided, with `byKind`), `ARITH_SKIPPED` (with reasons), `ARITH_NOT_APPLICABLE`.

Measured over all 162 units: 1,968 claims decided, 0 wrong, 2,164 skipped (blanks "5 + ___ = 8",
questions, quoted work, negations, estimates, algebra). Zero findings is a statement about decidable claims
only; it is not a review of the lessons' mathematics. Recall evidence: the test plants a `+1` error in an
equation of five real units and requires the verifier to flag each one.

False-positive classes found by reading hits (all handled as exemptions, not baselined):
quoted or hypothetical work ("A friend says ..."), negations and "true or false", estimates and rounding
(`1 / 3 = 0.33` is an info skip), intentionally wrong text (`error_analysis` "wrong", vocab "nonexample",
multiple-choice distractors, watch-out notes), algebra with a variable next to a number (`2x + 3 = 11`),
whole-number division with a remainder (`85 / 9 is 9`), scale or conversion statements (`1 cm = 4 meters`),
truncated quotes ending in an ellipsis, prompts whose subject is blank (`The ___ of 85 / 9 is 9`), a
vocabulary definition mentioning "volume ... 1 inch on each side", absolute-value statements (`-7 is 7`).

## 2. readability

Flesch-Kincaid grade level, `0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59`, over prose
strings of 4+ words (blanks count as a short word, repeated strings count once). Syllables come from a
documented heuristic. **It estimates surface difficulty only. It does not measure comprehension,
vocabulary difficulty, background knowledge, or whether a Language Learner will understand the text.**

Checks: `READ_UNIT_OVER_CEILING` (student-facing unit text above the grade ceiling),
`READ_BAND_OVER_CEILING` (band scaffolds above ceiling plus a band offset), `READ_BAND_DECREASING`
(difficulty must be non-decreasing l1_2 <= l3_4 <= l5_6, 0.1 tolerance). Band text is the frames,
per-activity supports and per-lesson "I can" objectives for that band; unit text is questions, passages,
missions, definitions and models, extracted with `studentText()` from `db/seeds/bcpss/v2/schema.mjs`
after teacher-only keys are dropped.

Ceilings are in `tools/content/ceilings.json` and are **proposed, pending Joel approval**. Proposal:
unit ceiling `max(3.5, grade + 2)`, band offsets 0 / +1 / +2. Measured at those numbers: 36 units over the
unit ceiling (mostly social studies and science, where required vocabulary lifts the score), 7 band
over-ceilings, 0 decreasing bands. Changing the ceilings changes the baseline: re-run `--update-baseline`
only after Joel decides.

False-positive classes: required Tier 3 vocabulary ("photosynthesis", "equivalent") raises short texts;
quoted Spanish words in newcomer prompts inflate syllables; one long word in a short frame moves a band by
a grade. Read a finding as "look at this unit".

## 3. vocab-tier

Rubric over `data/content/word-frequency.json`, built by `npm run build:word-frequency` from this repo's own
unit text (distinct words per unit, with the number of subjects using each; no network, no external list)
plus a short hand-authored everyday-word list (`lib/common-words.mjs`):

- domain-specificity: how many of the four subjects use the term's most domain-specific content word
- cross-domain frequency: only everyday words means Tier 1 material; 3+ subjects means general academic
- instructional need: distinct student-text strings in the unit that use the term

Candidate tier: one everyday word 1; 3+ subjects 2; one subject 3; two subjects 3 when need is high (12+
strings), else 2. A phrase of only everyday words ("number line") is not scored.

Output is a review queue: `VOCAB_TIER_CANDIDATE` (info, one per term) with authored vs candidate.
`VOCAB_TIER_DISAGREE` (warn) fires only on strong disagreement: candidate Tier 1, or an authored Tier 3
single word used in 3+ subjects and in fewer than 12 strings of its own unit. `VOCAB_TIER_INCONSISTENT`
(warn): the studio and the unit's lessons give one term different tiers. `VOCAB_LOW_USE` (info): fewer than
3 uses.

Measured: 1,607 terms scored, 82 strong disagreements (baselined), 4 low-use terms.

Limits and false-positive classes: the corpus is small and curriculum-shaped. A general academic word used
by one subject here ("admirable", "summarize") looks domain-specific. Everyday words with a technical
meaning ("ones", "tens", "round", "side", "ten", "hundred") look like Tier 1, and some of the 82 are
exactly these. A word used by every subject here may still be technical for the grade. Tiers are authored
judgments about the learner's grade, which the rubric does not see. A human decides every tier.
