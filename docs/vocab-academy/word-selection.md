# Vocabulary Academy — Word Selection Methodology

Status: v1.0, 2026-11-20. This is the documented, auditable method for choosing, placing and recording every target word
in Vocabulary Academy. It is written so that a teacher, curriculum lead or outside reviewer can check any word against it.

Companion documents: `SPEC.md` (data contract), `research-notes.md` (evidence base), `content-qa.md` (quality gates).

Two honest limits up front:

- Word selection is **editorial judgment guided by criteria**, not an algorithm. The criteria below structure and record
  that judgment; they do not replace it. The weights are editorial heuristics, not empirical estimates.
- No list here claims to be "the most important words". The corpus is a curated, original selection for instruction.
  Many valuable words are deliberately left out.

---

## 1. Principles

1. **Teach words students will meet again, can use in several contexts, and can say or write.** (Robust vocabulary
   instruction; see research-notes B.1.)
2. **Frequency is evidence, not the verdict.** See section 4.
3. **A word is a target exactly once in the corpus.** Later units may revisit it through `reviewFrom` but not re-teach it.
   A different sense of the same spelling is a separate target only if it is a genuinely different sense and has its own
   id (`.2` suffix, SPEC §3.3).
4. **Placement is as deliberate as selection.** Why a word sits in this grade, this unit and this position is recorded in
   `selection` and `why`.
5. **Original curation only.** See section 9.
6. **Every choice leaves a trace.** Section 8 defines the audit trail.

---

## 2. The twelve criteria

Each candidate word is considered against the criteria below. A criterion is either a **gate** (a word that fails it is
normally dropped) or a **weight** (evidence for or against). Ratings are 0 = no evidence or against, 1 = some, 2 = strong.

| #   | Criterion                         | Question asked                                                                                                   | Role                    | Evidence used                                                                                                                                                               |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Frequency in suitable texts       | Will students meet this word in grade-appropriate reading across subjects?                                       | weight                  | Teacher and author judgment about school texts; optional frequency checks against a source whose licence is recorded (section 9). Frequency is capped; see section 4.       |
| 2   | Academic utility                  | Does it appear in explanations, directions, arguments, and assessments across school?                            | weight (heavy)          | Academic word research (for example Coxhead's Academic Word List, used as a cross-check only); curricular scan of standards language.                                       |
| 3   | Cross-disciplinary relevance      | Does it carry meaning in more than one subject area, or transfer from one subject to others?                     | weight                  | Author review of ELA, math, science and social studies language.                                                                                                            |
| 4   | Grade appropriateness             | Is the concept within reach for this grade and is the word plausibly unfamiliar but learnable?                   | gate                    | Age-of-acquisition evidence (criterion 5), author judgment about concept difficulty, adjacent-grade comparison.                                                             |
| 5   | Age-of-acquisition evidence       | When do children typically learn this word?                                                                      | weight, where available | Published age-of-acquisition ratings (for example Kuperman et al. 2012) used only as a cross-check; ratings are adult estimates, not child data. If no data, record "none". |
| 6   | Semantic richness                 | Does the word have shades, relations, and examples that support rich discussion?                                 | weight                  | Synonym ladders, opposites, group membership, figurative uses.                                                                                                              |
| 7   | Morphological usefulness          | Does it teach or reinforce a productive prefix, suffix, root or family that transfers?                           | weight                  | Validated word-part data in `morphology.json`; word-family size.                                                                                                            |
| 8   | Text comprehension value          | Would not knowing it block understanding of typical grade-level text?                                            | weight (heavy)          | Author review of grade texts and the unit passage.                                                                                                                          |
| 9   | Productive speaking/writing value | Can a student reasonably use it in a sentence, discussion, or argument now?                                      | weight (heavy)          | Test: can we write two different natural sentences and a production prompt?                                                                                                 |
| 10  | Multilingual-learner relevance    | Will explicit teaching help multilingual learners (cognates, false cognates, multiple meanings, function words)? | weight                  | Spanish cognate status, sense differences, how much meaning depends on context.                                                                                             |
| 11  | Difficulty progression            | Does it fit the intended step up from earlier units and toward later ones?                                       | gate (at unit level)    | Position check inside the grade; `level` 1–3; review-linked words.                                                                                                          |
| 12  | Instructional transfer            | After instruction, will students be able to understand and use related words they were not taught?               | weight (heavy)          | Family members, morphological parts, concept links that carry over.                                                                                                         |

### 2.1 How the criteria are weighed

Weights are editorial, written down so they can be argued with.

- **Gates first.** A candidate must pass grade appropriateness (4). A unit must pass difficulty progression (11) as a
  set. Words failing a gate are moved, not forced in.
- **Heavy criteria (2, 8, 9, 12).** These four carry the most weight because they reflect whether the word will do work
  for the student: it recurs across subjects, it unlocks text, it can be produced, and it transfers.
- **Standard criteria (3, 6, 7, 10).** Each contributes; a word with only these and none of the heavy criteria is usually
  a poor choice.
- **Light criteria (1, 5).** Frequency and age-of-acquisition are corroborating evidence. They can raise confidence in a
  decision but never be the only reason to include a word (section 4).

A simple working rule that authors record, not compute mechanically:

```
heavy score  = sum of ratings (0–2) on criteria 2, 8, 9, 12     (max 8)
support score = sum of ratings on criteria 3, 6, 7, 10          (max 8)
light score  = sum of ratings on criteria 1, 5                  (max 4)

Include with confidence when: heavy >= 5 and support >= 3
Include with a recorded reason when: heavy 3–4 and a clear special purpose (for example a function word, a
  confusable pair, a figurative term, a concept the unit needs)
Do not include when: heavy <= 2, or the only strong evidence is light
```

The totals are a conversation aid. An author may override them and must say why in `src.note`.

---

## 3. Vocabulary categories

Two fields classify each word (SPEC §3.1): `tier` (exactly one) and `cats` (zero or more).

### 3.1 Tier (`tier`)

| Value     | Meaning                                                                                                                                                                     | Use                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `general` | Common everyday words that are still worth explicit teaching, mostly in K–2 and for multilingual learners, or core concept words (for example, spatial and sequence words). | Younger grades; function-heavy words.                    |
| `tier2`   | Words used across contexts by mature language users, with rich meaning and use in text and discussion.                                                                      | The core of most units.                                  |
| `tier3`   | Domain-specific words tied to a subject (for example, a science or history term).                                                                                           | Disciplinary units; teach with a concept, not as a list. |

Honesty note: Tier 1/2/3 is a **heuristic from the practitioner literature**, not a validated classification. Reasonable
reviewers disagree on a word's tier. We record a tier because it is useful for planning, not because it is a fact.

### 3.2 Categories (`cats`)

| Category (`cats` value) | What it marks                                                                                                                                          | Selection concern                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `multiple-meaning`      | The spelling has several common senses (for example, one noun sense and one verb sense, or an everyday and a specialized sense).                       | Teach the sense most likely to confuse; teach a second sense only when genuinely different; give each its own example. |
| `morph-productive`      | The word contains or builds with a productive affix or root that transfers.                                                                            | Morphological validation (section 5, stage 7).                                                                         |
| `function`              | Language-function words: words that do work in explaining, comparing, arguing, sequencing, hedging (for example, words for showing contrast or cause). | Important for writing and for multilingual learners; teach with sentence frames.                                       |
| `abstract`              | Words naming ideas rather than things.                                                                                                                 | Needs diagrams, spectrum visuals, contrast; pay attention to defensible definitions.                                   |
| `figurative`            | Words used mainly in figurative or idiomatic ways.                                                                                                     | Teach literal and figurative together; check cultural reach.                                                           |
| `confusable`            | Words easily confused with another word (look-alike, sound-alike, or close in meaning).                                                                | Teach the contrast deliberately and record the confusable partner in the teacher note.                                 |
| `word-family`           | The word is the base or a notable member of a family of related forms.                                                                                 | Teach the family in one place; check the family list is real.                                                          |

General (non-specialized) words that need no category simply have an empty `cats` array.

---

## 4. Why frequency is not importance

Frequency is a useful and a dangerous number. We use it only as corroboration.

1. **Frequency measures text, not need.** The most frequent words are function words and everyday words that most
   students already know. The words students most need to be taught are often moderately or rarely frequent.
2. **Frequency depends on the corpus.** A word frequent in news text may be rare in textbooks, or the reverse. A single
   list gives a single, unrepresentative answer. Frequency also ignores which sense is frequent.
3. **Frequency ignores meaning boundaries.** A frequent spelling may be mostly one sense, hiding the sense students need.
4. **Frequency ignores learnability and transfer.** A rare word with a productive root can unlock many other words; a
   frequent but unproductive word unlocks nothing.
5. **Frequency ignores purpose.** A word that is rare but names a concept a unit needs may be exactly right; a
   frequent word that students already know is a waste of a slot.
6. **Frequency lists are often licensed or derived from commercial text.** Using one is only possible with provenance
   and licence recorded (section 9).

Therefore: criterion 1 is capped at the light weight; frequency never alone justifies inclusion; and authors record "none"
when they did not consult one. The program makes no claim to cover "the top N words".

---

## 5. The pipeline

Fourteen stages. Each stage has an owner role, an output and a check. Stages 1–4 happen at scope level (`grade.json`);
5–14 happen at unit level (`u<NN>.json`) and in release.

| #   | Stage                    | What happens                                                                                                                                                                                                                                               | Output                                                          | Check                                                              |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Candidate identification | Generate a wide candidate pool for a grade from the strands (thematic, morphology, disciplinary, literary, rhetoric) using the criteria. Candidates may come from author knowledge, standards language, grade-level text scans, and optional cross-checks. | Candidate pool (not committed) with a note of sources consulted | Source and licence recorded (section 9)                            |
| 2   | Independent curation     | A second pass by a reader who did not build the pool: remove too-easy, too-hard, narrow, offensive, or culturally narrow items; question the heavy criteria.                                                                                               | Reduced list with reasons                                       | Reasons for removals kept in working notes                         |
| 3   | Grade assignment         | Place each word in the grade where its concept is reachable and where it is a real teaching target; apply adjacent-grade comparison.                                                                                                                       | Draft `grade.json` words and `focus`                            | Each target appears once across the corpus                         |
| 4   | Unit organization        | Group words in units by theme and strand, assign `morphFocus`, set `level` 1–3 progression, write `reviewFrom`.                                                                                                                                            | `units` array with `why` for each unit                          | Counts match the SPEC table; `reviewFrom` references earlier words |
| 5   | Definition writing       | Student-friendly definition with simpler words than the headword; no headword or family inside; length limit by grade; second sense only when different.                                                                                                   | `def`, `senses`                                                 | Length and headword checks (automated); sense boundaries (human)   |
| 6   | Example writing          | Two natural original sentences in different contexts, plus a cloze that needs a context clue, a near miss, and a plainly wrong misuse.                                                                                                                     | `ex`, `ex2`, `cloze`, `cloze2`, `misuse`, `nonExample`          | Sense matches `def`; cloze not answerable by grammar alone         |
| 7   | Morphological validation | Check every word part against `morphology.json`; verify each `segs.s` is a real part of the word as spelled; record spelling changes; no folk etymology; put doubt in `editorial.needsReview`.                                                             | `morph`, `family`, `study`                                      | Automated part check; human check of claims                        |
| 8   | Passage writing          | Original passage at the grade's length band; at least 70 percent of target words appear naturally; facts true or clearly invented.                                                                                                                         | `passage`                                                       | Targets in context (automated); fact check (human)                 |
| 9   | Activity generation      | Items are built deterministically from validated unit data (cloze, misuse, definitions, synonyms, relations, passage questions).                                                                                                                           | Items at run time, not authored                                 | Items trace to unit data                                           |
| 10  | Assessment writing       | Form A and B constructed responses and items; distractors are real misreadings; one defensible answer.                                                                                                                                                     | `check`, assessment items                                       | Answer-key validation                                              |
| 11  | Answer-key validation    | Automated: `a` index in range, choices distinct, one correct choice; human: each key is defensible and each distractor plausible.                                                                                                                          | Validated keys                                                  | Automated plus human sampling                                      |
| 12  | Accessibility review     | Text and non-text: alt text real, no colour-only meaning, reading level of directions, glosses and frames available, K–2 listen-only passages.                                                                                                             | Checked unit                                                    | Checklist in `content-qa.md`                                       |
| 13  | Content QA               | Automated validators plus human editorial sampling.                                                                                                                                                                                                        | Review status per unit                                          | `content-qa.md` gates                                              |
| 14  | Publication              | Index build; status recorded; version incremented on change.                                                                                                                                                                                               | `index.json`; unit `version`                                    | Index builds; no placeholders                                      |

Changes after publication follow the same stages from the earliest affected stage: a corrected definition re-runs stages
5, 6 and 11–13 for that word.

---

## 6. Grade and unit design

- **Words per unit and units per grade** follow SPEC §3.1 (K: 12 units of 5; 1: 12 of 6; 2: 15 of 8; 3: 18 of 10;
  4–12: 20 of 10). The counts are a build decision about workload, not a research finding.
- **Thematic coherence.** Words in a unit share a theme, strand or morphology focus so students meet them in related
  contexts. `why` states why these words belong together and in this position.
- **Progression inside a grade.** `level` 1–3 marks early, middle and late placement; units move from more concrete to
  more abstract and from single words toward families and relations.
- **Progression across grades.** Concepts recur at greater depth (for example, a family introduced in grade 3 may reappear
  in grade 6 with a more advanced member); recurrence is through new words in the family, not the same target twice.
- **Deliberately left to other grades.** `selection` names what was left out and why (too concrete, too specialized,
  better taught earlier or later).
- **Review links.** From unit 2 on, `reviewFrom` names 2–4 earlier headwords to revisit. They are chosen because they
  are likely to recur in the new unit's texts or morphologically related to the new words, not at random.
- **Strands.** `thematic`, `morphology`, `disciplinary`, `literary`, `rhetoric`. A grade should show a deliberate mix;
  upper grades add more `rhetoric` and `disciplinary` units. A grade with only one strand needs a recorded reason.

---

## 7. Special considerations by learner group

- **Multilingual learners.** Prefer words where explicit teaching pays off: multiple-meaning words, function words, words
  with useful cognates, and words whose false cognates cause errors. Every word has a Spanish gloss for the taught sense and
  a `cognate` flag; glosses are unreviewed by a native speaker until recorded as reviewed (`content-qa.md`).
  Cognate flag means "a real Spanish word of related form and meaning for this sense", not "looks similar".
- **Younger students (K–2).** Short words, concrete and everyday meaning, classroom phrases, limited morphology
  (plurals, -ed, -ing, -er, -est, un-, re-, compound words); `general` tier is common.
- **Students with reading difficulties.** The same words, with supports (pictures, audio, frames) delivered through
  supports flags, not a different list.
- **Sensitive content.** Avoid words whose only natural contexts are violent, sexual, or stereotyping; avoid examples
  that depend on one culture's holidays, foods or family forms; check names and scenarios for variety.

---

## 8. Audit trail

Three places record why a word is where it is.

### 8.1 `grade.json` — grade level and unit level

| Field                | What it must say                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `focus`              | What vocabulary growth this grade owns; how it differs from the grades on each side.                                                                   |
| `selection`          | How words were chosen: which criteria were heavy, what sources were consulted (with provenance), what was left for other grades, any known weak spots. |
| `arc`                | The year's story in unit order.                                                                                                                        |
| `units[].why`        | One sentence: why these words belong together and in this position.                                                                                    |
| `units[].morphFocus` | The word part focus, or "none".                                                                                                                        |
| `units[].reviewFrom` | Earlier headwords revisited, with reason where not obvious.                                                                                            |
| `units[].words[]`    | `hw`, `pos`, `tier`, `cats` for each target.                                                                                                           |

### 8.2 Word record — `src`

Each word record carries `src` (SPEC §3.3):

```json
"src": {
  "method": "original-curation",
  "basis": ["academic-utility", "morphology", "comprehension"],
  "note": ""
}
```

Recommended controlled values (the Validation agent decides how strictly to enforce them):

| `method`            | Meaning                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `original-curation` | Chosen by the authors through the pipeline above. The default.                                                                      |
| `custom-teacher`    | Added by a teacher through the custom unit builder (SPEC §10).                                                                      |
| `imported`          | Any lexical data brought in from outside. Requires `note` with source, licence and date (section 9). Should be rare to nonexistent. |

| `basis` value        | Criterion it records            |
| -------------------- | ------------------------------- |
| `frequency`          | 1 (light; never the only basis) |
| `academic-utility`   | 2                               |
| `cross-discipline`   | 3                               |
| `grade-fit`          | 4                               |
| `age-of-acquisition` | 5                               |
| `semantic-richness`  | 6                               |
| `morphology`         | 7                               |
| `comprehension`      | 8                               |
| `production`         | 9                               |
| `multilingual`       | 10                              |
| `progression`        | 11                              |
| `transfer`           | 12                              |

Rules for `src`:

- `basis` lists at least two values, and at least one must come from the heavy group
  (`academic-utility`, `comprehension`, `production`, `transfer`). `frequency` alone is never enough.
- `note` is required whenever the author overrides the working rule in 2.1, when the word is a special-purpose inclusion,
  or when `method` is not `original-curation`.
- `src` is about selection. It is not a place for etymology or definition claims (those go in `morph.note` and
  `editorial.needsReview`).

### 8.3 Unit `rationale` and `editorial`

`rationale` (teacher-facing) explains why these words, why this order, and what transfers. `editorial.needsReview` lists
every place the author was unsure (etymology, sense boundary, Spanish gloss, fact claim). These two fields are the
reviewer's starting point (section 11).

---

## 9. Provenance and no-copy rules

**Legal and ethical position.**

- Individual words are not owned by anyone. A common word may appear in any program.
- A publisher's **curated selection and arrangement** of words (a list, its order, its grouping into units, its
  passages, its exercises, its layout) is original authorship and is protected. Copying a publisher's list wholesale or in
  substance, or reproducing its sequence, is not allowed. This is not legal advice; it is the rule the program follows.
- We therefore do **not** use any publisher's word list, sequence, unit grouping, passage, exercise wording or layout as a
  source, a checklist, or a target to "cover" (SPEC §9).

**Operating rules.**

1. **No imported lexical data without provenance and licence.** If any frequency list, age-of-acquisition table, concreteness
   rating, definition, example, etymology or word list is brought in, the source name, version, licence, date and the
   specific use must be recorded in `selection` (grade level) and in the word's `src.note`. Without a recorded licence it
   is not used. Definitions and examples from any dictionary or learner dictionary are never copied.
2. **Cross-checks, not sources.** Published research lists (for example the Academic Word List) and age-of-acquisition
   ratings may be consulted as a cross-check on an independently made list. A word appearing in such a list does not select
   it, and a word not appearing does not exclude it.
3. **No comparison to publisher lists.** Authors do not open a commercial program's lists while selecting. If a reviewer
   notices a long run of words in the same order as a known publisher's unit, it is investigated and, if confirmed, the
   unit is re-curated from the criteria.
4. **No machine-generated selection without human curation.** Any tool that proposes words is a candidate generator at
   stage 1 only; its use and output are recorded. All text is original and reviewed. No runtime AI call exists in the
   program.
5. **Originality of text.** Definitions, sentences, passages and prompts are written for this program. Quotations from
   published works are not used.
6. **Third-party names and facts.** Real people, places and events in passages must be accurate and unflattering claims
   about real people are avoided; when unsure, invent a plausible scenario.
7. **Records are kept in the repository.** Provenance statements live in the `grade.json` `selection` field and the word's
   `src.note`, so they travel with the content.

---

## 10. How to audit a unit

Use this checklist for any unit. Record the date, auditor and result in the review log (`content-qa.md`). Items marked
(A) can be checked by a validator; items marked (H) need a person.

**Placement and selection**

- [ ] (A) Unit file `id`, `grade`, `n`, `title`, `theme`, `strand` match the `grade.json` entry.
- [ ] (A) The word count equals the scope entry; each `hw` and `pos` matches, in the same order.
- [ ] (A) Each headword and pos is a target only once across the corpus.
- [ ] (H) Read the unit `why` and `rationale`: do these words belong together, in this position, for this grade?
- [ ] (H) For each word, is the stated `src.basis` plausible? Is at least one heavy criterion present?
- [ ] (H) Are there words that are too easy or too hard for the grade, or that no teacher would choose to teach?
- [ ] (H) Does the grade `selection` field describe what was left out and what sources were consulted?
- [ ] (H) Provenance: is any outside data used? If so, are source, licence and date recorded?
- [ ] (H) Does any run of words look like a publisher's unit? (If unsure, escalate; do not compare with a list.)

**Categories and morphology**

- [ ] (A) `tier` and `cats` use allowed values.
- [ ] (H) Is the tier reasonable? Are the categories accurate (a `multiple-meaning` word really has several senses)?
- [ ] (A) Every morphological segment is a real part of the word as spelled.
- [ ] (H) Are meanings of parts, spelling-change notes, and origin claims correct? Is doubt in `needsReview`?
- [ ] (A) `morphFocus` appears among the unit's words or study parts.

**Progression and review**

- [ ] (A) `reviewFrom` and `review` ids resolve to earlier words; empty only for unit 1.
- [ ] (H) Are the review words useful for this unit (recurring or morphologically related)?
- [ ] (H) Do the `level` values rise sensibly within the unit?

**Meaning and use**

- [ ] (H) Each definition is accurate, student-friendly, uses simpler words, and fits one sense.
- [ ] (H) Example sentences use the intended sense and are natural and different from each other.
- [ ] (H) Each cloze needs a context clue; each misuse is plainly wrong for a knowing student.
- [ ] (H) Passage: natural use of at least 70 percent of targets; facts true; reading level near the grade band.

**Fairness and access**

- [ ] (H) Spanish glosses are right for the taught sense; cognate flags are right; false cognates noted.
- [ ] (H) Names, scenarios and images are varied and not stereotyping; no culturally narrow assumptions.
- [ ] (H) Alt text describes the picture; abstract words have diagrams not only emoji.

**Result.** Record pass, or list defects with the field, the word, and the fix. A unit with unresolved defects stays at
`auto-checked`. A unit that passes this audit and the human sampling in `content-qa.md` may be recorded as
`human-reviewed` for the fields actually reviewed, with the reviewer's role and date.

---

## Corpus statistics (filled by the build)

The lead fills this section from validator output. Do not hand-edit numbers; paste the validator's report and note the
command, date and commit.

Source command: `________________________` Date: `__________` Commit: `__________`

Targets from SPEC §3.1 are shown for comparison. Everything else is blank until the build runs.

| Grade     | Units (target) | Units (built) | Words/unit (target) | Words (target) | Words (built) | general | tier2 | tier3 | Words with `morph` | Words with `es.gloss` | Words with `src.note` |
| --------- | -------------- | ------------- | ------------------- | -------------- | ------------- | ------- | ----- | ----- | ------------------ | --------------------- | --------------------- |
| K         | 12             |               | 5                   | 60             |               |         |       |       |                    |                       |                       |
| 1         | 12             |               | 6                   | 72             |               |         |       |       |                    |                       |                       |
| 2         | 15             |               | 8                   | 120            |               |         |       |       |                    |                       |                       |
| 3         | 18             |               | 10                  | 180            |               |         |       |       |                    |                       |                       |
| 4         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 5         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 6         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 7         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 8         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 9         | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 10        | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 11        | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| 12        | 20             |               | 10                  | 200            |               |         |       |       |                    |                       |                       |
| **Total** | 237            |               |                     | 2232           |               |         |       |       |                    |                       |                       |

Additional statistics to record when available:

| Statistic                                                                                                             | Value         |
| --------------------------------------------------------------------------------------------------------------------- | ------------- |
| Distinct headwords                                                                                                    |               |
| Headwords with more than one target sense (`.2` ids)                                                                  |               |
| Words per category: multiple-meaning / morph-productive / function / abstract / figurative / confusable / word-family |               |
| Words per strand (units): thematic / morphology / disciplinary / literary / rhetoric                                  |               |
| Words with `cognate: true`                                                                                            |               |
| Passage coverage: share of targets appearing in the passage (overall, minimum per unit)                               |               |
| Units with non-empty `editorial.needsReview` (count of items)                                                         |               |
| Duplicate target check (hw+pos)                                                                                       |               |
| Imported data in use (source, licence)                                                                                | none expected |
