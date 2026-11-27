# Content schema for The Language Page front layer

Every file under `tools/lp/data/` is validated by `tools/lp/check.mjs` (gate G-07 content integrity, G-08 math
recomputation). A file that does not match this document fails the build. Content is **original**: never copy,
closely paraphrase or reconstruct WIDA test items, WIDA sample items, Can Do descriptors or copyrighted passages.

## Shared vocabularies (exact strings)

- `cluster`: `"grades-2-3"` (written for grade 3), `"grades-4-5"`, `"grades-6-8"`. These are the WIDA ACCESS Online clusters.
- `domain`: `"listening"`, `"reading"`, `"speaking"`, `"writing"`.
- `eld`: `"ELD-SI"` (Social and Instructional), `"ELD-LA"` (Language Arts), `"ELD-MA"` (Mathematics), `"ELD-SC"` (Science), `"ELD-SS"` (Social Studies).
- `klu`: `"Narrate"`, `"Inform"`, `"Explain"`, `"Argue"`.
- `pl` (target proficiency band of one item or task): `"1-2"`, `"3-4"`, `"5"`. Difficulty rises in that order inside a set.
- `icon` names (visual supports; drawn in `lp/assets/icons.svg`): sun, cloud, rain, snow, wind, plant, seed, tree,
  water, rock, mountain, fish, bird, bug, magnet, bulb, thermometer, beaker, scale, ruler, clock, calendar, map,
  compass, house, school, bus, bike, book, pencil, computer, ball, apple, money, flag, people, ear, mouth, chart,
  globe, store, park, recycle, trash, music, paint, heart, star, question.

## Practice sets: `tools/lp/data/practice/<cluster>/<domain>.json`

```json
{ "cluster": "grades-6-8", "domain": "reading", "sets": [ SET, SET, SET ] }
```

Exactly 3 sets per file. Across the 3 sets of one file, use at least 2 different `eld` values, and across the 9 sets of a
domain (3 clusters) cover all 5 ELD Standards with ELD-MA, ELD-SC and ELD-SS each used at least twice.

### SET (all domains)

| field | type | rule |
| --- | --- | --- |
| `id` | string | `<cluster>-<domain>-<n>`, n = 1..3, e.g. `grades-6-8-reading-2` |
| `slug` | string | kebab-case, unique within the file, 2-5 words, e.g. `city-garden-data` |
| `title` | string | student-facing, 2-7 words, sentence case |
| `summary` | string | one sentence for teachers: what students do and the language focus |
| `eld` | ELD | the set's main ELD Standard |
| `klu` | KLU | the set's main Key Language Use |
| `contentArea` | string | `"Math"`, `"Science"`, `"Social Studies"`, `"Language Arts"` or `"School life"` |
| `minutes` | integer | realistic time to finish, 8-25 |

### Listening and Reading SETs add

Reading: `passage`. Listening: `script`. Both: `items` (exactly 6: two `"1-2"`, two `"3-4"`, two `"5"`, in that order).

```json
"passage": {
  "title": "Who Uses the Park?",
  "paragraphs": ["...", "..."],
  "glossary": [ { "term": "survey", "definition": "a set of questions you ask many people", "es": "encuesta", "esDefinition": "un grupo de preguntas que haces a muchas personas" } ]
}
```
- Passage length: grades 2-3: 120-200 words; 4-5: 200-320; 6-8: 300-450. 3-6 paragraphs. Every glossary `term` appears
  in the passage text (case-insensitive). 3-6 glossary entries. Spanish is a scaffold for families and newcomers; keep it simple.

```json
"script": {
  "title": "Planning the Science Fair",
  "setting": "A teacher talks to the class before a science fair.",
  "lines": [ { "speaker": "Ms. Ortiz", "text": "..." }, { "speaker": "Student", "text": "..." } ]
}
```
- Script length: grades 2-3: 90-160 words; 4-5: 150-260; 6-8: 220-380. 1-3 speakers, 3-10 lines. It is read aloud by
  the device voice, so write it to be heard: short sentences, clear signal words, numbers written as digits.

ITEM:
```json
{
  "id": "grades-6-8-reading-2-q3",
  "pl": "3-4",
  "eld": "ELD-SC",
  "klu": "Explain",
  "stem": "Why did the students count the birds two times?",
  "visual": { "type": "icons", "icons": ["bird", "clock"], "alt": "A bird and a clock" },
  "choices": [
    { "text": "To check that their count was correct", "correct": true, "why": "The passage says they counted again to check their first count." },
    { "text": "Because the birds flew away", "correct": false, "why": "The birds did fly, but that is not why they counted again.", "misconception": "Picks a true detail that does not answer the question" },
    { "text": "To make the chart bigger", "correct": false, "why": "The chart is not why they counted again.", "misconception": "Connects two ideas the text does not connect" },
    { "text": "Because the teacher was late", "correct": false, "why": "The passage does not say the teacher was late.", "misconception": "Adds information that is not in the text" }
  ]
}
```
- `id`: `<set id>-q<n>`, n = 1..6.
- `choices`: 3 choices for `"1-2"` items, 4 for `"3-4"` and `"5"`. Exactly one `correct: true`. The correct choice is not
  always first: across a set, the correct position varies (no position used more than 3 times in 6 items).
- `why` (every choice): student-facing, one sentence, grade-appropriate, says why the choice is right or not right
  **without** giving away a different item's answer.
- `misconception` (every wrong choice): teacher-facing label of the reasoning error the distractor represents.
- `visual` (optional; required on at least one `"1-2"` item per set): `{ "type": "icons", "icons": [icon...], "alt": "..." }`
  or `{ "type": "table", "caption": "...", "headers": ["..."], "rows": [["..."]] }`.
- For `"1-2"` items, choices may be short words or phrases and may carry `"icon": "<icon>"` (picture choices).
- Math: if the correct answer is a computed number, add `"compute": { "expr": "18 / 3", "answer": "6" }`. `expr` uses only
  digits, `+ - * / ( ) .` and spaces. `answer` must equal the number that appears in the correct choice's `text`.
  The gate recomputes every `expr` with exact fractions.

### Speaking SETs add `tasks` (exactly 3: pl `"1-2"`, `"3-4"`, `"5"` in that order)

```json
{
  "id": "grades-4-5-speaking-1-t2",
  "pl": "3-4",
  "eld": "ELD-SC",
  "klu": "Explain",
  "prompt": "Look at the two plants. Tell how they are different and explain why one plant grew taller.",
  "support": "Use the words: sunlight, water, because.",
  "visual": { "type": "icons", "icons": ["plant", "sun"], "alt": "A plant in the sun" },
  "thinkSeconds": 20,
  "responseSeconds": 45,
  "models": [
    { "level": 2, "text": "This plant big. Sun. Water.", "note": "Single words and short phrases name the ideas." },
    { "level": 4, "text": "...", "note": "..." },
    { "level": 6, "text": "...", "note": "..." }
  ],
  "checklist": ["I answered the question.", "I said why, using because.", "I used science words."]
}
```
- `prompt`: what a virtual teacher says (read aloud). `support`: optional word bank or frame line.
- `thinkSeconds` 10-45; `responseSeconds` 20-90 (longer for `"5"`).
- `models`: exactly 3, levels 2, 4 and 6 (or 1, 3, 5 for the `"1-2"` task), each with a teacher `note` naming what makes it
  that level in plain words (discourse, sentence and word level). Models are original sample answers, not WIDA anchors.
- `checklist`: 3-4 "I ..." statements a student can check themselves.

### Writing SETs add `tasks` (exactly 2: one `"1-2"` or `"3-4"`, then one `"5"`; prefer `"3-4"` then `"5"`)

```json
{
  "id": "grades-6-8-writing-1-t1",
  "pl": "3-4",
  "eld": "ELD-SS",
  "klu": "Argue",
  "prompt": "Should our town build a skate park or a library branch? Write a paragraph that states your claim and gives two reasons.",
  "organizer": { "type": "claim-reasons", "fields": ["My claim", "Reason 1", "Evidence for reason 1", "Reason 2", "Evidence for reason 2", "Closing"] },
  "frames": ["I believe that ___ because ___.", "One reason is ___.", "For example, ___.", "This shows that ___."],
  "wordTarget": [60, 120],
  "models": [
    { "level": 2, "text": "...", "annotations": ["Names a choice.", "Short sentences repeat one pattern."] },
    { "level": 4, "text": "...", "annotations": ["..."] },
    { "level": 6, "text": "...", "annotations": ["..."] }
  ],
  "checklist": [
    { "dimension": "Discourse", "text": "My ideas are in an order that makes sense, and they connect." },
    { "dimension": "Sentence", "text": "I used different kinds of sentences, including some with because or although." },
    { "dimension": "Word/Phrase", "text": "I used exact words for this topic." }
  ]
}
```
- `organizer.type`: `"sequence"`, `"claim-reasons"`, `"compare"`, `"cause-effect"`, `"describe"`, or `"problem-solution"`;
  `fields` 3-6 short labels.
- `frames`: 4-6, matched to the task's KLU, with `___` blanks.
- `wordTarget`: [min, max]. Grades 2-3: about 25-80; 4-5: 40-150; 6-8: 60-250.
- `models`: exactly 3 levels (2, 4, 6), original, each with 2-4 `annotations` a teacher or student can read.
- `checklist`: 3-5 entries; every one of the three dimensions (`Discourse`, `Sentence`, `Word/Phrase`) appears at least once.

## Content + Language units: `tools/lp/data/content/<area>/<slug>.json`

`area`: `"math"`, `"science"`, `"ela"`, `"social-studies"`.

```json
{
  "id": "math-6-ratios",
  "area": "math",
  "grade": 6,
  "slug": "ratios",
  "title": "Ratios and ratio language",
  "summary": "One sentence for a teacher.",
  "standard": { "framework": "CCSS", "code": "6.RP.A.1", "text": "Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities." },
  "eld": "ELD-MA",
  "klu": "Explain",
  "demands": {
    "discourse": ["..."],
    "sentence": ["..."],
    "word": ["..."]
  },
  "contentObjective": "Students will ...",
  "languageObjective": "Students will explain ... using ...",
  "frames": {
    "L1-2": ["...", "..."],
    "L3-4": ["...", "..."],
    "L5-6": ["...", "..."]
  },
  "vocabulary": [
    { "term": "ratio", "tier": 3, "definition": "a comparison of two quantities", "es": "razón", "cognate": false, "morphology": "from Latin ratio, 'reckoning'" }
  ],
  "activity": {
    "title": "...",
    "minutes": 15,
    "grouping": "partners",
    "steps": ["...", "..."],
    "problems": [ { "prompt": "...", "answer": "...", "compute": { "expr": "...", "answer": "..." } } ]
  },
  "warmup": "A 5-minute language warm-up for the start of class.",
  "crossLinks": [ { "label": "...", "href": "/access-practice-lab/..." } ]
}
```
- `standard.framework`: `"CCSS"`, `"NGSS"`, `"C3"`, or `"CCSS-ELA"`. Use only codes you are sure of; if unsure set
  `"verify": true` on the standard object (the page then shows [VERIFY]).
- `demands`: 2-4 entries per level, specific to the lesson (not generic).
- `frames`: 2-4 per band; `L1-2` are short, with word banks or picture-friendly stems; `L5-6` ask for elaboration or precision.
- `vocabulary`: 5-9 entries, both tiers present; `cognate: true` only for true Spanish cognates.
- `activity.problems` is optional; any numeric answer carries `compute` (same rule as practice items). `crossLinks` optional (may be `[]`).
