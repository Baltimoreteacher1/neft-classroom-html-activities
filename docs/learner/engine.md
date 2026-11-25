# Learner engine (Prompt 3, section 4)

Pure, on-device logic in `shared/learner/` (plain browser-safe ESM). No D1, no network, no clock: every function
takes `now` or a day number. Student state never leaves the device by design. This wave ships the tested engine
only; no UI is wired to it yet.

Inspired by WIDA ACCESS. Not official, not a score, not a placement tool. Students see only
"practice estimate, not an official score" with a coarse status.

## Skill graph (`graph.js`, `tagging.js`)

- 48 language nodes `lang.<domain>.<klu>.<band>` (listening, speaking, reading, writing x Narrate, Inform, Explain,
  Argue x 1_2, 3_4, 5_6), one `vocab.<unit>.<term>` node per authored term, one `std.<code>` node per core standard.
- Today: 1,994 nodes, 5,358 edges, acyclic. Edges: band ladder, KLU order, listening->speaking and reading->writing
  (lesson arc), vocabulary -> unit standards, earlier unit standards -> later unit standards (first-seen rank, so no cycles).
- `exercisesFor(activity, unit)` is deterministic. Unknown kind, domain or key language use throws.
  Unit key language use comes from `wida_klu` when present, else the blueprint id prefix (the seed rows carry only
  the blueprint id today, so the prefix is what is used).
- Pitch band = kind ladder tier (recognise 0, guided 1, extended 2) + grade band (K-2 0, 3-5 1, 6-8 2): <=1 -> 1_2, 2 -> 3_4, >=3 -> 5_6.
- G-29 (`tools/learner-tagging.test.mjs`): 162 units, 2,011 activities, every activity >= 1 node, no orphan nodes.
  Negative controls: unknown kind, unknown domain, an orphan node, an untagged activity.

## Estimation (`estimate.js`)

Per node `Beta(a0 + s, b0 + f)`. `s` and `f` are exponentially decayed (half-life 21 days, tunable), so an idle node
returns to its prior. Prior comes from the teacher-entered diagnostic level, else the grade (strength 4).
A hinted success counts 0.6 of a success. Status: building (mean < 0.5), strong (mean >= 0.8), else getting there;
with under 3 effective observations the status is always getting there (the prior alone never claims building or strong).
The 80% interval (normal approximation) is teacher-side only. Student view: status + label, no digits.

Acceptance (documented N): a consistently correct student reaches strong in N = 2 sessions of 4 attempts (one session per day).
An idle strong student is back to getting there well before 120 days, mean within 0.05 of the prior.

Item difficulty prior: `difficultyPrior({languageDemand, band})` spreads the 0.43-0.80 demand score over 0.2-0.95.
`updateDifficulty` takes an anonymous aggregate `{attempts, correct}` and ignores cells under 10 attempts.

## Scheduling (`leitner.js`, `recommend.js`, `plan.js`)

- Leitner boxes 1, 2, 4, 8, 16 days; miss -> box 1; easy skips a box; daily budget default 10 (1-40, whole number).
- Score = need x fit x freshness x variety. Need: lowest mastery of the exercised nodes, weighted up to 1.5x when the
  unit is within 28 days (pacing). Fit: band match x closeness of predicted success to 65-85%. Freshness: 0.05 if repeated
  within 3 days. Variety: 0.4 for a third consecutive activity in one domain. Top 3 returned.
- Every recommendation has `why.text` (plain language, no digits or level words) and `why.terms` (numbers, teacher-side).
- Ties break through an injected rng (seeded in tests) else by id: reproducible for a seed.
- `planDay(10|15|20, ...)`: 2-minute retrieval warm-up from earlier units always reserved, then an exact 0/1 knapsack over
  8-20 minute activities with at most one activity per domain. Warm-up cards respect the daily budget.

## Anonymous item analytics (`analytics.js`, `suppression.js`)

Events carry no learner identity (allow-list enforced; alias, name, session or student fields are rejected).
Published cells (total, per option, failures, per slice, per tier) need >= 10 attempts. Complementary suppression closes
differencing: a total minus the published cells nested in it must never isolate a group under 10 (single cells and the
largest disjoint family). Flags (from published cells only): too easy (>95%), too hard (<20%), non-discriminating
(high tier minus low tier < 0.1), distractor outperforming the key, position bias (chi-square over distractor choices).

Limits: the attacker model is the fixed published family, not arbitrary queries. The feeder must send at most one first
attempt per learner per item so attempts approximate learners. Position bias needs >= 2 distractors.

## Tests and negative controls

`npm run test:learner` runs `tools/learner-*.test.mjs` (40 tests). Controls: a decay that never forgets and a budget cap
that does nothing are injected through `hooks` and must make the acceptance checks throw an AssertionError; an independent
attacker enumerates every table consistent with the published numbers and must pin a small cell in a primary-suppression-only
publication (it does) and in none of the complementary-suppression ones (24 random tables plus the crafted case).
