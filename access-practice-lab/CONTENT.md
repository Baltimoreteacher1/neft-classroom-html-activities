# ACCESS Practice Lab — content contract

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
      "tier": { "name": "Starting", "range": "WIDA 1.0–2.4" },
      "studentGoal": "I can …",
      "info": { "headline": "…", "summary": "…", "canDo": ["I can …"] },
      "categories": [{ "id": "kebab", "title": "…", "desc": "…", "activityIds": ["…"] }],
      "activities": [/* activity objects */]
    },
    "B": { "tier": { "name": "Growing", "range": "WIDA 2.5–3.5" } },
    "C": { "tier": { "name": "Expanding", "range": "WIDA 3.6–4.5+" } }
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
