# Experience Builder (Teacher Experience Compiler)

`/experience-builder` turns an instructor's own text into an editable, playable simulation in the `lp-sim/1`
schema (`src/sim/schema.js`). Learners play it in the simulation player at `/simulations/x/<id>`.
Contracts: `docs/part2-integration-map.md`.

## Pipeline (`src/compiler/`, pure, deterministic, no model, works offline)

| Step     | Module        | What it does                                                                                                                                                    |
| -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extract  | `extract.js`  | Cleans the source (markup stripped, never run), then finds sentences, concepts, defined vocabulary, facts with sentence indexes, cause/rival/evidence relations |
| Design   | `design.js`   | Picks the format, scene count from class time, evidence artifacts, what each character knows, and the conflict (source explanation vs a misreading)             |
| Generate | `generate.js` | Builds the mission. Source words stay verbatim with `from: [sentence index]`; authored text comes from `templates.js` in English and Spanish                    |
| Validate | `validate.js` | `validateMission` plus compiler checks; `errors` block publishing, `warnings` are the instructor's call                                                         |
| Play     | `play.js`     | Scripted learners run the real runtime to prove the experience can be finished and to report which endings are reached                                          |

`compileExperience({ source, settings }) → { ok, key, def, report, extract, plan }` (`compile.js`).
The same input always gives the same experience; only the id is random.

## Rules

- Every evidence body, character answer, clarification and vocabulary meaning must be traceable to the source:
  each sentence needs 60% content-word overlap with a source sentence, and every number in it must be in that
  sentence. Anything else is flagged "not from your text".
- The misreading is built from the source's own sentences (a belief the text reports and answers, else a reversed
  cause, else two concepts declared unrelated) and is marked in the editor for the instructor to check. Publishing
  is blocked when no evidence contradicts it.
- Endings are story consequences that depend on the explanation chosen and the evidence cited. No scores, levels,
  points or timers; the validator rejects that language in prompts and endings.
- Character names the source does not give are listed in `def.compiled.invented` and labelled in the editor.
- Inputs: pasted text, `.txt` / `.md` / `.html` up to 200 KB (read as text), a reading passage from the activity
  bank, a Book Studio project. `.docx` and PDF are not supported (the lab ships no browser reader for them).

## Storage and publishing

- Drafts: `accessPracticeLab:v1:experiences = { [key]: { def, updatedAt, input?, published? } }` on the
  instructor's device, saved after every change. The player reads the same key, so a draft plays locally.
- Class server (`functions/_lib/class-platform/experiences.js`, table `class_platform_experience`, created lazily):
  `POST /api/class/experience/publish` and `/unpublish` are teacher routes (`requireTeacher`);
  `GET /api/class/experience/get?id=` needs no key; `GET /api/class/experience/list?code=` is a teacher route.
  The server re-validates with `validateMission`, caps the definition at 120 KB, removes control characters, and
  stores the student copy: no `compiled` block, and no `source` unless "show source" is ticked.
- Assignment: the existing settings route, `{ id, title, path: "/access-practice-lab/simulations/x/<id>" }`.
- Without a class: play locally, or export and import a `.json` file.

## Tests

- `node --test tools/compiler.test.mjs` (pipeline, traceability, editor operations, scripted play, drafts)
- `node --test functions/api/class/experiences.test.mjs` (publish, get, unpublish, auth, limits, class delete)
- `node tools/compiler-e2e.mjs` (real browser; its server calls the real class function over `node:sqlite`)

## Not built

- The optional "Suggest improvements" model help (`/api/experience-compile`) was not built. If it is added later it
  is a new teacher-only AI exception that `PLATFORM.md` must record.
- The player always offers its three help kinds. `def.supports` records which supports the instructor turned on,
  and turning frames off removes the task's own frames, but the player does not yet hide a help kind that is off.
