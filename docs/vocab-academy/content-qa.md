# Vocabulary Academy — Content QA

Status: v1.0, 2026-11-20. This document defines how Vocabulary Academy content is checked before and after publication.

Companion documents: `SPEC.md` (data contract), `word-selection.md` (selection and audit trail), `research-notes.md` (evidence).

## The one rule that governs everything here

**Automated validation is not a substitute for expert editorial judgment.** A validator can prove that a file is
well-formed, that an answer index points at a real choice, and that a placeholder was not left behind. It cannot prove
that a definition is accurate, that an example uses the intended sense, that an etymology is true, that a distractor is
plausible, that a passage fact is correct, that a Spanish gloss is idiomatic, or that a scenario is culturally fair. A unit
that passes every automated gate is **auto-checked**, nothing more. Only a person reading the content can make it
**human-reviewed**, and only for the fields they actually reviewed.

Passing the gates is the minimum for being allowed to publish. It is never evidence that content is correct.

---

## 1. Status vocabulary

Two statuses are used. They are written exactly like this (SPEC §3.2, `editorial.status`).

| Status           | Meaning                                                                                                                                          | Who or what sets it                                                           | What it does not mean                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto-checked`   | The unit passed the automated validators (section 2). No human editorial judgment is implied. This is the default status of every authored unit. | Authors write it; the validator confirms the gates pass.                      | It does not mean any definition, example, key, fact, etymology or gloss is correct.                                                                     |
| `human-reviewed` | At least one qualified person has read the unit against the checks in section 4 and recorded the review in the review log (section 7).           | A person, never a script. The Validation agent must not set it automatically. | It does not mean error-free, externally certified, endorsed by any organization, or reviewed in every field. The log states which fields were reviewed. |

Rules:

1. A unit is `auto-checked` until a review-log entry exists. A validator may reject `human-reviewed` on a unit with no
   log entry.
2. `human-reviewed` records scope. A unit may be human-reviewed for editorial content while its Spanish glosses are still
   unreviewed. The log row says "Spanish glosses: not reviewed", and the product copy must not say otherwise.
3. Any edit to a human-reviewed unit that changes a definition, sense, example, passage, question, key or gloss returns
   those fields to `auto-checked` until re-reviewed. Typo-only edits may stay reviewed if the reviewer agrees.
4. `editorial.needsReview` is the author's list of doubts. It is not cleared by the validator; a human clears an item by
   resolving it and noting how in the log.
5. Product copy never claims a unit is "expert-verified", "teacher-approved" or similar unless a review-log entry supports
   it for the named fields.

---

## 2. Automated gates

The validator (`tools/validate-vocab-academy.mjs`, owned by the Validation agent) runs these gates over every grade file
and unit file. Each gate lists what it proves and what it cannot catch. A failing gate blocks publication; no gate is
weakened to pass (SPEC §9).

| #   | Gate                                 | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                | What it cannot catch                                                                                                                              |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Grade exists                         | `g<G>/grade.json` exists for each grade K–12 and parses; `schema`, `grade`, `band`, `focus`, `selection`, `arc` present.                                                                                                                                                                                                                                                                                                                                      | Whether `focus` and `selection` are true or well written.                                                                                         |
| 2   | Required units                       | The units in `grade.json` match the SPEC counts (K 12, 1 12, 2 15, 3 18, 4–12 20); each has a unit file `u<NN>.json`; ids and numbers are consecutive.                                                                                                                                                                                                                                                                                                        | Whether a unit's theme and position are sensible.                                                                                                 |
| 3   | Words populated                      | Each unit has exactly the scope count of words (K 5, 1 6, 2 8, 3+ 10), same `hw`/`pos` and order as `grade.json`.                                                                                                                                                                                                                                                                                                                                             | Whether the chosen words are good choices.                                                                                                        |
| 4   | Valid word data                      | Required fields present and typed; `id` follows `va.<slug>.<pos>`; `pos`, `tier`, `cats`, `level` use allowed values; `def` length within the grade limit (K–2 at most 9 words, 3–5 at most 14, 6–12 at most 22); `def` does not contain the headword; `syn` at most 4; `ant` omitted when empty; `pron` has a capitalized stressed syllable; `visual` shape valid; `es.gloss` present; `src` present with at least two `basis` values including a heavy one. | Whether a definition is accurate, student-friendly, or fits one sense; whether synonyms are true near-synonyms; whether `pron` is correct.        |
| 5   | Nonempty definitions                 | `def` and, for each extra sense, `senses[].def` and `senses[].example` are non-empty strings after trimming.                                                                                                                                                                                                                                                                                                                                                  | Definitions that are non-empty but wrong, circular in substance, or too abstract.                                                                 |
| 6   | Example uses intended sense          | Structural proxies only: `ex`, `ex2` and the cloze answer contain the headword or a listed inflected form; `ex` and `ex2` differ; `ex` is not identical to `cloze.s` with the blank filled.                                                                                                                                                                                                                                                                   | **Whether the sense is the taught sense.** This gate cannot read meaning; sense match is a human check (section 4).                               |
| 7   | Passages exist                       | Each unit has `passage` with `id`, `genre`, `title`, `paras`, word count within the grade band (K–2 40–80, 3–5 150–260, 6–8 220–400, 9–12 300–520; SPEC §3.2 also shows a bare 90–140 default, which the grade bands supersede — flagged to the lead), `qs` count per grade rule, `listenOnly` true for K–2.                                                                                                                 | Whether the passage is coherent, interesting, free of errors, or at a suitable reading level.                                                     |
| 8   | Targets appear in context            | Each target word has a surface form in the passage text, or is named in `editorial.needsReview` with a reason; at least 70 percent of targets appear; each id in `passage.words` is a unit word.                                                                                                                                                                                                                                                              | Whether the word's use in the passage matches the taught sense or reads naturally.                                                                |
| 9   | Answer keys match                    | For every question and item with choices: `a` is an integer within range; choices are distinct after normalization; the count is 4 (3 allowed K–2); `cloze.f` appears in `cloze.s` with exactly one `___`; analogy `a` and `choices` are consistent.                                                                                                                                                                                                          | **Whether the keyed answer is the only defensible answer**; whether a distractor is also correct; whether a distractor is plausible. Human check. |
| 10  | References resolve                   | `review` and `reviewFrom` word ids exist in earlier units; `relations.groups[].ids`, `check.constructed[].wordIds`, `teacher.notes` keys and `passage.words` resolve to words in the unit or an earlier unit; `family` and `morph` references match `morphology.json` parts where used.                                                                                                                                                                       | Whether the references are pedagogically useful.                                                                                                  |
| 11  | Assessment items valid               | Items built for forms A and B from the unit data have stems, valid choices, one correct choice, and trace to a word; forms A and B differ in at least some items; parallel forms cover the same words.                                                                                                                                                                                                                                                        | Whether forms A and B are truly equivalent in difficulty.                                                                                         |
| 12  | No duplicate ids                     | Word ids, passage ids, question ids, constructed-response ids are unique across the corpus; a `hw`+`pos` is a target exactly once (second teaching of a word uses `.2`).                                                                                                                                                                                                                                                                                      | Near-duplicates (two spellings of one word).                                                                                                      |
| 13  | No placeholders                      | No `TODO`, `TBD`, `lorem`, `...`, `[word]`, `example sentence`, `XXX`, bracketed templates, empty strings or obvious filler in any student-facing or teacher-facing field.                                                                                                                                                                                                                                                                                    | Generic or low-quality text that is not on the placeholder list.                                                                                  |
| 14  | Teacher and student material present | Teacher fields (`overview`, `notes` for each word, `model`, `discuss`, `misconceptions`, `extend`, `reviewAdvice`) and student fields (`objectives`, `passage`, `produce`, `check`, `wida.frames` with at least 3, `wida.bank`, `wida.oral`) are present and non-empty; teacher-only fields are absent from student-facing routes and print kinds (checked by the print and route tests).                                                                     | Whether the guidance is useful, accurate or well pitched.                                                                                         |

Supplementary automated checks (from SPEC rules, run in the same pass, same status):

| Check          | What it checks                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloze form     | `cloze.s` contains `___` once; `cloze.f` is the exact surface form; `cloze` and `cloze2` differ.                                                                                                                                      |
| Morphology     | Each `morph.segs[].s` is a real part of the word as spelled (matches the base or a listed affix, or a documented spelling change); every `family` word and every `morphology.json` derivation is in the dataset's word-validity list. |
| K–2 rules      | `listenOnly` true; passage of 3–6 short sentences; `qs` 2–3; no `analogies`; morphology limited to the K–2 part list.                                                                                                                 |
| Size and shape | Unit file parses as JSON; counts and indexes consistent with `index.json` after `build-vocab-academy-index`.                                                                                                                          |
| Safety strings | No URLs, no email addresses, no third-party requests in content; no teacher-only text in `student`-visible fields.                                                                                                                    |

The validator reports each gate separately, by unit and word, so failures are fixable. A pass is recorded with the
command, date and commit in section 6.

---

## 3. Human editorial sampling protocol

### 3.1 Why sampling

Reading every field of every word in the corpus (about 2,232 target words in 237 units) is the ideal and may not be
possible at launch. Sampling is a way to **find and measure defects honestly**, not a way to declare the rest correct.
Units that were not sampled stay `auto-checked`, and published copy and the review table (section 6) say so.

### 3.2 Sample sizes by grade band

Percentages are of **units in the grade**, rounded up, with the minimum shown. A "full review" reads every field in the
checklist in section 4 for every word in the unit plus the passage and all questions. A "spot check" reads the checks
below on a subset of words.

| Grade band                              | Full-review sample (units per grade)  | Spot check on every other unit                   | Rationale                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K–2 (units: K 12, 1 12, 2 15)           | 30 percent, minimum 4 units per grade | 2 words plus the passage per unit                | Short content but high stakes: young learners, listening-only passages, picture support, and simple but easily wrong definitions. A higher share is sampled because each unit is quick to read. |
| 3–5 (units: 3 18, 4 20, 5 20)           | 25 percent, minimum 5 units per grade | 3 words plus passage questions per unit          | Morphology and multiple-meaning words begin; informational passages begin to carry facts.                                                                                                       |
| 6–8 (units: 6 20, 7 20, 8 20)           | 25 percent, minimum 5 units per grade | 3 words plus passage facts and all keys per unit | Disciplinary and rhetoric strands; more fact claims, abstract words and figurative use.                                                                                                         |
| 9–12 (units: 9 20, 10 20, 11 20, 12 20) | 25 percent, minimum 5 units per grade | 3 words plus passage facts and all keys per unit | Highest density of etymology claims, abstract and figurative words, and argument passages.                                                                                                      |

The percentages and minimums are editorial targets chosen for a realistic reviewing load. They are not statistically
derived. If staffing allows more, review more.

**Always in the full-review sample, regardless of band:**

1. Unit 1 of every grade (it sets the pattern for the grade).
2. Every unit whose `editorial.needsReview` is non-empty for etymology, sense boundary, fact claim or Spanish gloss.
3. Every unit with an informational, science, history or biography passage that states real-world facts.
4. Every morphology-strand unit (word-part claims concentrate there).
5. Every unit containing a word marked `figurative`, `abstract` or `confusable` where the definition has changed since
   the last review.
6. The reference unit used as the content template (`docs/vocab-academy/reference-unit.json`).
7. A random draw for the rest, made with a recorded seed so the draw can be reproduced.

### 3.3 Escalation

| Observation in a sampled unit                                                | Action                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| One or more **critical** defect (section 5)                                  | Fix; full-review every other unit in that grade by the same author or generator pass; record.                               |
| Three or more **major** defects in one unit                                  | Fix; double the full-review sample for that grade.                                                                          |
| Only **minor** defects                                                       | Fix; no escalation. Note patterns.                                                                                          |
| A defect pattern (for example wrong sense in examples, or stereotyped names) | Treat as a generator or style problem; search the corpus for the pattern and fix all instances (not only the sampled ones). |

### 3.4 Reviewer roles

A reviewer must be a person with relevant expertise, working independently of the author of the unit:

- **Editorial reviewer** (literacy educator or curriculum editor): definitions, senses, examples, keys, grade fit.
- **Subject reviewer** (as needed): facts in science, history and biography passages.
- **Linguistics-informed reviewer** (as needed): morphology and etymology claims.
- **Spanish reviewer** (fluent speaker of Spanish with education or translation experience, ideally native): Spanish
  glosses and cognate flags. This is a separate review with its own log line.
- **Sensitivity reader** (as needed): cultural fit and representation.

One person may fill several roles if qualified. The reviewer's role (not name, unless the lead decides) is recorded.
Review by the unit's author, or by an automated tool, does not count.

---

## 4. What a human checks

Every row applies in a full review; the spot check uses the rows marked with a star.

| Check                            | What the reviewer does                                                                                                                                                                                                                                      | Typical defects                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition accuracy (star)       | Compare `def` to the standard meaning of the sense; confirm it is simpler than the headword, grade-appropriate, and stands alone.                                                                                                                           | Too broad or narrow; wrong part of speech in the definition; circular; uses a harder word; includes the headword's family; confuses the word with a near neighbor.                                               |
| Sense boundaries (star)          | For multiple-meaning words, confirm only the taught sense is defined in `def`; check `senses` are genuinely different and every example uses the sense it is attached to.                                                                                   | Example uses a different sense from `def`; two senses that are really one; a missing common sense that students will confuse.                                                                                    |
| Example grammar and sense (star) | Read `ex`, `ex2`, `cloze`, `cloze2`, `misuse`, `nonExample` aloud; confirm natural, grammatical, correct inflection, and different contexts.                                                                                                                | Awkward or unnatural sentences; wrong inflection; both examples nearly the same; the cloze is solvable by grammar alone or fits several words; the misuse is wrong for the wrong reason or is not clearly wrong. |
| Etymology and morphology claims  | Check every `morph.segs` part and meaning, `family` entry, `morph.note` origin claim against a reliable dictionary or etymology source; confirm spelling changes are described. Any claim the reviewer cannot confirm is removed or moved to `needsReview`. | Folk etymology; a pseudo-prefix (a letter string that is not a real morpheme in this word); a family word that is not a real member; an origin stated with more certainty than the source supports.              |
| Passage facts                    | Check every factual claim, date, number and name; confirm invented scenarios are labelled or clearly fictional.                                                                                                                                             | Incorrect dates or attributions; invented facts presented as real; outdated claims.                                                                                                                              |
| Passage use of targets (star)    | Confirm each target appears in a natural, correct, taught-sense use.                                                                                                                                                                                        | Forced or ungrammatical use; a different sense; a word used only in a list-like sentence.                                                                                                                        |
| Answer-key defensibility (star)  | Answer each item without the key; compare; confirm exactly one choice is defensible; confirm `why` is true.                                                                                                                                                 | Two defensible answers; the keyed answer depends on a fact the passage does not support; a `why` that does not match the key.                                                                                    |
| Distractor plausibility          | Confirm each wrong choice reflects a real misreading and is not nonsense, a giveaway, or a longer or more detailed correct-looking choice.                                                                                                                  | Obviously silly choice; one choice always longest; a distractor that is actually right.                                                                                                                          |
| Spanish glosses                  | A Spanish reviewer confirms each `es.gloss` translates the taught sense, is natural and standard for a broad audience, and that `cognate` is true only for a real related word of the right meaning.                                                        | Gloss for the wrong sense; regional word with no note; false cognate flagged as a cognate; a word-for-word translation that no one says.                                                                         |
| Cultural sensitivity             | Read names, settings, foods, family forms, jobs and images; confirm variety and absence of stereotyping or assumptions; check examples about disability, religion, race, poverty and gender.                                                                | A single cultural frame; stereotyped roles; deficit framing; humor that depends on a group.                                                                                                                      |
| Grade fit (star)                 | Compare the word, definition, examples and passage with the grade band; check the position (`level`) and the review words.                                                                                                                                  | Concept too advanced or babyish; example sentences harder than the word; passage at the wrong level.                                                                                                             |
| Accessibility of content         | Confirm alt text describes the picture, abstract words have a diagram rather than only emoji, directions are plain, frames and bank are usable.                                                                                                             | Alt text that repeats the headword only; emoji that mislead; unclear directions.                                                                                                                                 |
| Originality and provenance       | Confirm no publisher list order, passage or exercise wording is reproduced; confirm any outside data is recorded in `src.note`.                                                                                                                             | A suspicious run of words in a known order; a sentence recognized from a commercial source.                                                                                                                      |

For every defect the reviewer records the unit id, word id or item id, field, severity, and the fix.

---

## 5. Defect severity

| Severity | Definition                                                                | Examples                                                                                                                                     | Required response                                                                                  |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Critical | Teaches something false, harms a student, or makes an item unanswerable.  | Wrong definition; false fact; false etymology stated as certain; answer key wrong; offensive or stereotyping content; copied publisher text. | Must be fixed before publication or before the unit is marked human-reviewed. Triggers escalation. |
| Major    | Misleads or confuses a student or teacher, or defeats the item's purpose. | Example in the wrong sense; cloze solvable by grammar; a second defensible answer; passage fact unsupported; wrong Spanish gloss.            | Fix before marking human-reviewed. Counts toward escalation.                                       |
| Minor    | Weakens quality without misleading.                                       | Awkward phrasing; thin example; lopsided distractor lengths; weak alt text.                                                                  | Fix when convenient; record.                                                                       |

---

## 6. Review status (filled by the build)

The lead fills this section after each build and after each review round. Do not hand-edit counts; use the validator
output and the review log. Until it is filled, **every unit is `auto-checked` at best and none is human-reviewed.**

### 6.1 Automated gate result

Command: `________________________` Date: `__________` Commit: `__________`

| Gate                                             | Result (pass/fail) | Failures (count) | Notes |
| ------------------------------------------------ | ------------------ | ---------------- | ----- |
| 1 Grade exists                                   |                    |                  |       |
| 2 Required units                                 |                    |                  |       |
| 3 Words populated                                |                    |                  |       |
| 4 Valid word data                                |                    |                  |       |
| 5 Nonempty definitions                           |                    |                  |       |
| 6 Example uses intended sense (structural proxy) |                    |                  |       |
| 7 Passages exist                                 |                    |                  |       |
| 8 Targets appear in context                      |                    |                  |       |
| 9 Answer keys match                              |                    |                  |       |
| 10 References resolve                            |                    |                  |       |
| 11 Assessment items valid                        |                    |                  |       |
| 12 No duplicate ids                              |                    |                  |       |
| 13 No placeholders                               |                    |                  |       |
| 14 Teacher and student material present          |                    |                  |       |

### 6.2 Review status by grade

| Grade     | Units | `auto-checked` | `human-reviewed` (any fields) | Full-review sample drawn | Full reviews completed | Open critical | Open major | Spanish glosses reviewed (units) | `needsReview` items open |
| --------- | ----- | -------------- | ----------------------------- | ------------------------ | ---------------------- | ------------- | ---------- | -------------------------------- | ------------------------ |
| K         | 12    |                |                               |                          |                        |               |            |                                  |                          |
| 1         | 12    |                |                               |                          |                        |               |            |                                  |                          |
| 2         | 15    |                |                               |                          |                        |               |            |                                  |                          |
| 3         | 18    |                |                               |                          |                        |               |            |                                  |                          |
| 4         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 5         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 6         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 7         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 8         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 9         | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 10        | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 11        | 20    |                |                               |                          |                        |               |            |                                  |                          |
| 12        | 20    |                |                               |                          |                        |               |            |                                  |                          |
| **Total** | 237   |                |                               |                          |                        |               |            |                                  |                          |

### 6.3 Review log

One row per review. Append only; never rewrite a past row.

| Date | Unit id(s) | Reviewer role | Fields reviewed | Fields not reviewed | Defects found (critical/major/minor) | Defects fixed | Outcome (`human-reviewed` / returned) |
| ---- | ---------- | ------------- | --------------- | ------------------- | ------------------------------------ | ------------- | ------------------------------------- |
|      |            |               |                 |                     |                                      |               |                                       |

### 6.4 Sampling draw record

| Date | Grade | Seed | Units drawn at random | Always-in units added | Total full reviews planned |
| ---- | ----- | ---- | --------------------- | --------------------- | -------------------------- |
|      |       |      |                       |                       |                            |

---

## 7. Honest statements for product and docs

When describing content quality to teachers, parents or administrators:

- Say what is true: "All units pass automated structural checks. [N] of 237 units have had a full human editorial review.
  Spanish glosses [have / have not] been reviewed by a Spanish speaker."
- Do not say: "expert-verified", "teacher-approved", "error-free", "research-validated", or "WIDA-certified".
- Give a way to report an error and say what happens to it (reviewed, fixed, noted).
- Keep the numbers in section 6 current. An out-of-date table is itself a defect.

## 8. Open questions for the lead

These are recorded here because the author of this document does not own the files that decide them.

1. Should `editorial` carry optional fields (for example `reviewed: { by, at, scope: [] }`) so the log is machine-checkable? The
   SPEC currently defines only `status` and `needsReview`. Until it does, the review log in section 6.3 is the record.
2. Who will serve as the Spanish reviewer and the subject reviewers, and on what timeline? The status table cannot move
   past `auto-checked` for glosses until someone is named.
3. Should the validator refuse `human-reviewed` for a unit without a log row, and refuse a unit whose `needsReview` contains
   an unresolved etymology or fact item? Recommended: yes.
