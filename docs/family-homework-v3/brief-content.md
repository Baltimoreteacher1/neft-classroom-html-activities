# Family Math Studio v3.0: content authoring brief (for lesson authors)

You author the `v3` block of `data/family-homework-notes/<id>.json` for the lesson ids you are assigned. Read, in this order:
`docs/specs/family-homework-v3.md` (the exact shape), `docs/family-homework-v3/es-style-guide.md`, the exemplar
`data/family-homework-notes/4-5.json` (its `v3` key; copy its voice, length and care), then for each lesson its own sidecar
(`bigIdea`, `learningTonight`, `conceptSteps`, `bridge`, `tryTogether`, `corner`, `basicPractice`, `vocabulary` on Part 2),
`lessons/<id>/config.json` (`title`, `standard`, `contentObjective`, `vocabulary`, `launch.conceptIntro.iDo`, `practice`, `familyCheck`)
and, for a `-part2` page, the Apply-Day config. Edit ONLY the `v3` key of your assigned sidecars (Python `json.load` / `json.dump(d, f,
indent=2, ensure_ascii=False)` plus a trailing newline). Do not run generators, `qa:fast`, `npm test`, or commit.

## Spirit

These pages exist to ENGAGE, TEACH and EXCITE families. The reader is a tired caregiver on a phone at 7:45pm who may not read English
fluently, may not remember this math, and may feel anxious. The student should leave feeling like the expert in the house. Warm,
specific, brief, second person, never patronizing; the student is the expert, the grown-up is a curious coach.

## Rules

1. **Source fidelity.** Every number, scenario, term and standard traces to THIS lesson's sidecar/config. Nothing invented. If a needed
   source is missing, say so in your report; do not fill the gap with unit-level boilerplate.
2. **One story.** `hook`, `model`, `kitchenTable` and the `vocab` examples reuse the page's story and numbers (the sidecar's
   `bigIdea`/worked example). `transfer` is a deliberate NEW situation. Every other situation is labeled "A different situation:".
3. **Never imply the parent's method is wrong.** "Then vs now" (already in `bridge`) is honest; you do not rewrite it.
4. **Hook = the Spark**: a 20-second real-world mystery in a Baltimore family's world (bus fare, corner-store prices, rec-center
   schedule, recipes, sports stats, phone plans), answered by the end, with an estimate-first prompt. No brands, no real people.
5. **Models** come from this lesson's own numbers; the `alt` describes the math with the actual numbers. No generic diagram.
6. **Hints and coaching never state the answer.** `confused[].coach` is an open question with no answer inside. `confused[].wrong` is
   something a family member could really say; the `misconception` is a short kebab-case id.
7. **Distractors** in `transfer` each tie to a named misconception; exactly one correct choice; put the correct one at varied positions
   across lessons (do not default to position B).
8. **Math must be exactly right.** Give every `calc` a structured `expr` and `value`, then check each with Python/Node before finishing.
   Units and signs unambiguous; one correct choice.
9. **Spiral** items are 2 genuinely EARLIER lessons (check `data/curriculum-manifest.json` order: unit, then lesson number; a
   `-part2` page may draw from its own base lesson and earlier ones). Prefer the lesson this one builds on.
10. **Part 2 pages** (`-part2`, `-part3`) are the lesson's SECOND session: genuinely different story, numbers and `topicKey` (suffix
    `-apply`), `glitch` REQUIRED (spot-the-error: scenario, three steps with exactly one glitch, a fix, a sentence frame, a `calc` that
    checks the correct step). Base lessons: `glitch: null`.
11. **Unit 10** ("Math is ..."): `kind: "mindset"` per the spec: no model (`kind: "none"`), no transfer/spiral, mindset `confused`
    rounds (e.g. "If I get stuck, I am bad at math"), mindset vocab.
12. **Reading level** grade 5 or lower, sentences <= 15 words, one idea each, no idioms. Math vocabulary is fine when defined.
13. **Banned**: timers/countdown words, "co-pilot/engine/enterprise", SPED labels/initials, other languages, Reveal brand text copied
    verbatim, anything graded or "earn points".
14. **No copy-paste between lessons.** No string of 60+ characters repeats on more than 3 lessons. A base lesson and its `-part2` differ.
15. **Spanish**: follow `es-style-guide.md` exactly (tú for the student, ustedes for adults, `el total`, `60%`).
16. **Vocabulary**: 3-6 `vocab` entries whose `term` matches a `vocabulary[].term` on the page (EN). Never use the lesson title as a term.
    Frames are real sentence starters about THIS idea.

## Check yourself before reporting

Run `node tools/validate-family-v3.mjs <id> <id> ...` (when present in your worktree; otherwise `python3` JSON checks) and fix
every message. Recompute every `calc` independently. Re-read each Spanish line aloud for register (tú vs ustedes) and the glossary term.

## Report (under 25 lines)

Ids done; judgment calls (hook style choices, story choices, spiral sources); any source gap or sidecar/config content that looked wrong
(report, do not fix); the validator output.

## Fleet addendum (2026-10-28)

* Read lesson input with `node tools/family-v3-packet.mjs <id> <id> ...` (a compact digest of each lesson plus spiral candidates);
  open a full sidecar only when the digest is not enough. Study three finished examples first: `4-5` (base math), `4-5-part2`
  (Part 2 with glitch), `10-4` (mindset).
* Write ALL your lessons from ONE Python script (a dict per lesson, merged into each sidecar's `v3` key with json.load/json.dump,
  indent=2, ensure_ascii=False, trailing newline). Then run `node tools/validate-family-v3.mjs <your ids>` and fix every message.
* `kind: "mindset"` is for lessons whose standard starts with `MPP` (the validator decides); every other lesson is `math` and needs a
  real `model`. Pick the model kind that fits the lesson's own method (see the table in the spec). When the sidecar and the
  Apply-Day config tell different stories on a `-part2` page, follow the SIDECAR.
* Practice-test/review ids (`1-practice`, `1-review`, `6-1-6-2-practice`): write the v3 block for the skill the sidecar's
  `bigIdea` names.
* Do not edit anything outside the `v3` key. Do not run git, generators, qa:fast or npm test.
* Report in under 15 lines: ids done, validator output, and sidecar/config content that looked wrong (id and one sentence each).
