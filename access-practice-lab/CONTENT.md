# ACCESS Practice Lab — content contract

Studio content (missions, speaking, writing, detective) has its own contract: `STUDIO-CONTENT.md`; architecture and rules: `PLATFORM.md`.

All lab content lives in `access-practice-lab/content/` as JSON. The app, the
printable packets, the inventory, and the validator all read these files and
nothing else. `node tools/validate-access-lab.mjs` enforces every rule below;
`node tools/access-lab-index.mjs` regenerates `content/index.json`.

```
content/
  index.json                 GENERATED — counts + test list (never hand-edit)
  road.json                  Road to ACCESS: 12 weekly playlists per band
  family.json                Family Corner copy (English + Spanish)
  g6-8/<Domain>.json         Listening | Speaking | Reading | Writing | Model-Test
  g3-5/<Domain>.json         Listening | Speaking | Reading | Writing
                             hand-authored, plus the grades 4-5 depth pass: activities whose ids are in
                             tools/access-early-content/g45-<domain>.mjs are BUILT by
                             `node tools/build-access-g45-content.mjs` (never edit those by hand; their Spanish goal
                             and directions come from g45-es.mjs and land in es-guide.json). Strands ending in
                             `-g45` list them.
  tests/<test-id>.json       one practice test per file
pictures/<name>.svg          scene illustrations referenced by `picture.src`
```

## Domain file

```json
{
  "band": "3-5",
  "domain": "Listening",
  "color": "#1f766f",
  "icon": "Listen",
  "description": "One sentence a student can read.",
  "levels": {
    "A": {
      "tier": { "name": "Starting support", "range": "Classroom support choice; not a WIDA proficiency level" },
      "studentGoal": "I can …",
      "info": { "headline": "…", "summary": "…", "canDo": ["I can …"] },
      "categories": [{ "id": "kebab", "title": "…", "desc": "…", "activityIds": ["…"] }],
      "activities": [/* activity objects */]
    },
    "B": { "tier": { "name": "Growing", "range": "Classroom support choice; not a WIDA proficiency level" } },
    "C": { "tier": { "name": "Expanding", "range": "Classroom support choice; not a WIDA proficiency level" } }
  }
}
```

Level keys are fixed: `A` Starting, `B` Growing, `C` Expanding. They are part of
every shared URL (`/access-practice-lab/<Domain>/<Level>/<activity-id>`).

## Activity object

Every activity needs: `id` (kebab-case, unique across ALL bands and tests;
grades 3–5 ids start with `g35-`), `title`, `skill`, `time` (`"6 min"`), `type`,
`directions`, `prompt` (not for `worksheet`), `vocabulary` (≥ 2 entries of
`[term, kid-friendly definition, "término: definición en español"]`), `frames`
(≥ 1), `correct` (feedback when right), `hint`, `support`, `extension`,
`wida` (≥ 1 language-function label), and a `teacher` block
`{ use, function, lower, onLevel, challenge, noTech, prompt }`.

| `type`           | Fields                                                                                |
| ---------------- | ------------------------------------------------------------------------------------- |
| `multipleChoice` | `options: [{id, text, visual?}]` (3–4), `answer: "<option id>"`                       |
| `multiSelect`    | `options`, `answers: ["<id>", …]` (≥ 2 correct)                                       |
| `sort`           | `categories: ["…"]`, `items: [{id, text, answer: "<category>"}]`                      |
| `order`          | `items: [{id, text}]`, `answer: ["<id>", …]` (the correct order)                      |
| `cloze`          | `segments: [{text} \| {blank: {id, options: [], answer}}]`                            |
| `hotText`        | `sentences: [{id, text}]`, `answers: ["<id>"]`                                        |
| `constructed`    | `responseLabel`, `responsePlaceholder`, optional `models: {A, B, C}` (sample answers) |
| `worksheet`      | `sheet: [{heading, items: []}]`, optional `answerKey` (printable; teacher view only)  |

### Domain rules

- **Listening** — `script` (string) is what the student HEARS. It is played by
  the read-aloud voice and only shown as a transcript AFTER the student checks
  an answer. Never put the heard text in `prompt`, `directions`, or options.
  `prompt` is the question.
- **Reading** — reading tasks carry the text in `passageTitle` + `passage`
  (array of paragraphs), or in `sentences`/`segments` for sentence-level items.
- **Speaking** — every Speaking item gets the recorder automatically. Give
  `sayFor` (what a good answer includes) and, for `constructed` items, `models`
  with one sample answer per level so students can hear how answers grow.
- **Writing** — give `writeFor` and a `wordBank`.

### WIDA alignment and support labels

`wida` is a set of task-specific language-function or language-focus tags. It is
not a WIDA proficiency level, score, placement, or claim that an activity is an
official Language Expectation. Do not prefix task goals with proficiency-level
labels such as Entering, Emerging, Developing, or Expanding. Write observable
task demands instead. A/B/C describe local support choices and do not map to
WIDA levels. The local grades 3–5 band spans WIDA grade clusters 2–3 and 4–5;
do not imply that one band label is an official WIDA grade cluster.

When a task is explicitly crosswalked to the WIDA ELD Standards Framework,
record the verified grade cluster, ELD Standard(s), Key Language Use,
communication mode, and Language Expectation in teacher-facing metadata. A
Key Language Use or domain tag alone is not a full Language Expectation
alignment. Do not invent expectation codes or proficiency-descriptor mappings.

### Grade tags for 6-8 (enforced)

Grades 6-8 are one band (`g6-8/`, ids with no prefix, progress keys unchanged). An activity may carry
`"grades": ["7", "8"]` and `"gradesWhy": "<code>"`. No tag means the activity works for every grade in the band.
`gradesWhy` is one of the codes in `src/grade-focus.js` (`GRADE_REASONS`), and the code decides the grades, so the
two cannot disagree (`validate-access-lab.mjs` fails otherwise). A tag only changes what the Grade focus filter
lists (skill rooms, activity library, home "Next activity"); it never locks an activity, and a direct link always
opens. `content/index.json` carries the tag as a sixth entry on an activity's row and `gradeBands[6-8].gradeFocus`
(choices with counts); both are generated.

**How the tags were decided (2026-11-06).** Every one of the 357 grades 6-8 activities was read in a condensed listing (type, skill, title, vocabulary, the
opening of its heard or read text, prompt and task). Length and density were measured (words, Flesch-Kincaid estimate, share of words with three
or more syllables) as aids, never as the decision. The rule:

| Reason code | Grades | Used when |
| --- | --- | --- |
| `g6-topic` | 6 | The content is anchored in a grade 6 topic (ratios and unit rates, mean and median, ancient Egypt, Mesopotamia, Athens and Sparta, the Silk Road, rock types) and the text and task are not above grade 6 load. |
| `g67-load` / `g67-task` | 6, 7 | Reading or listening with more text (about 150+ words) or a dense text than a plain recognition task, or a grade 6 topic with an analytic task. `-task` is the speaking and writing form: explain a process or data, compare, summarize, write a claim with evidence or a short narrative, revise for precision. |
| `g78-topic` | 7, 8 | Anchored in grade 7-8 content: percent discounts, branches of government, the American Revolution, the Industrial era, civil rights history, the Erie Canal. |
| `g78-load` / `g78-task` | 7, 8 | An analytic task (evaluate how strong evidence is, find a counterclaim, compare two speakers or sources, judge purpose or point of view, valid inferences) on 100+ words of dense text, or a text at about grade 9 reading level. `-task` is the production form: argue with data, counterclaim and rebuttal, synthesize two sources, a multi-paragraph plan. |
| `g8-stretch` | 8 | The same analytic demands on 200+ words at about grade 9 or above with the densest vocabulary (author's craft, two perspectives, supported inferences in a history text). Never used for speaking or writing. |

Left untagged: every Level A activity (everyday school language, the support choice is the difficulty), model-test
items and test-taking strategy work, printable worksheets that are pure practice, short or plain-language items at
any level, and the other speaking, writing and sequencing tasks that a grade 6 and a grade 8 learner at the same
support choice would do the same way. Social studies placement follows the common sequence (grade 6 ancient world;
grades 7-8 civics and U.S. history); if your district differs, change the tag and its code together.

Guard rails: each room keeps at least 8 activities for every focus; Level A, model-test and other bands carry no
tags; `tools/access-grade-focus.test.mjs` checks all of it.

### Pictures, charts, tables (enforced)

If `directions`, `prompt`, `script`, or `passage` tells the student to look at a
picture, photo, image, or illustration, the activity MUST carry
`picture: { "src": "pictures/<name>.svg", "alt": "…" }` and the file must exist.
Wording about a **chart/graph** requires `chart`; wording about a **table**
requires `table`. Charts and tables are drawn by the app from data, so they are
always readable and never blurry:

```json
"chart": { "kind": "bar", "title": "…", "unit": "students",
           "data": [{ "label": "Mon", "value": 12 }] }
"table": { "caption": "…", "headers": ["Day", "Rain (in)"], "rows": [["Mon", "2"]] }
```

`kind` is `bar` or `pictograph` (pictograph adds `"icon": "🍎"`).

### Answer integrity (enforced)

- Option `visual` is emoji only and must never reveal correctness: no letters,
  digits, ✓/✗, ❌, 🚫, ⚠️, ✅.
- Answer keys must point at ids that exist.
- Vary the position of the correct answer.

## Picture files

`pictures/*.svg`: `viewBox="0 0 640 400"`, a `<title>` matching the alt text,
flat illustration style, no `<script>`, no external `href`, no words that give
away an answer, under 24 KB.

## Practice tests

```json
{
  "id": "g35-form-a",
  "band": "3-5",
  "kind": "full | domain | mini",
  "domain": null,
  "title": "…",
  "gradeCluster": "3-5",
  "tier": "…",
  "overview": "…",
  "sections": [
    {
      "domain": "Listening",
      "title": "…",
      "directions": "…",
      "estMinutes": 10,
      "items": [/* item objects */]
    }
  ]
}
```

Test items use the activity `type` fields. Listening test items use
`script: ["paragraph", …]` (+ optional `scriptTitle`, `questionAudio`) — never
`passage`. Tests are untimed by default; a student may opt into a practice
timer, and it never auto-submits.

## Road to ACCESS (`road.json`)

`{ "<band>": { "weeks": [{ "n": 1, "start": "2026-10-05", "taskType": "Narrate",
"theme": "…", "focus": "…", "activities": ["<id>", …], "family": { "en": "…",
"es": "…" } }] } }` — 12 weeks, every id must exist in that band.


## Instructional audit additions (October 2026)

- `successCriteria` is a list of observable, task-specific response checks for constructed tasks. These are self-review prompts, not automated proficiency judgments.
- `modelNotes` maps model keys A/B/C to teaching annotations. A model may be brief and strong; length is not a proficiency scale. Park models deliberately stay within the one- or two-sentence task.
- Each weekly playlist has `activityRationale`, keyed by every selected activity ID. The rationale explains its contribution to the weekly language function. A few early argument weeks use an explicitly labeled supported stretch because the elementary beginning listening/reading bank has limited argument tasks. The 24 playlists retain one task per domain, except the two-task family week.
- A/B/C are local classroom support choices, not calibrated WIDA proficiency ranges. Classroom test sets use fixed items and differ from official ACCESS routing, difficulty, timing, and scoring.
- Verify content invariants with `node --test tools/access-audit-content.test.mjs`, then rebuild the index and run the main lab validator.

Official sources checked October 4, 2026: [WIDA online/paper administration](https://wida.wisc.edu/news/focus-wida-access-grades-1-12-0) confirms adaptive Listening/Reading, subsequent tier placement, and paper Writing for grades 1–3. [Maryland WIDA dates](https://wida.wisc.edu/about/consortium/md) supports the 2027 state window; each school schedules individual dates. Keep dates and format explanations current with these primary sources.
