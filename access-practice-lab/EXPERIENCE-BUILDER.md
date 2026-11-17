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
- Inputs: pasted text, `.txt` / `.md` / `.html` up to 200 KB (read as text), Word `.docx` up to 2 MB, a reading
  passage from the activity bank, a Book Studio project. `.docx` is read on the device by `docx.js` (no library):
  the ZIP central directory is parsed with a DataView, only `word/document.xml` is inflated with
  `DecompressionStream("deflate-raw")` (stored entries are copied), and only paragraph text is kept (`w:p`/`w:t`,
  `w:tab` and `w:br` as a space). Guards: ≤ 400 entries, `document.xml` ≤ 4 MB uncompressed (the stream is cut off
  past the cap), no absolute or `..` entry paths, no encrypted entries or password-protected files, no ZIP64; the
  extracted text is held to the same 200 KB cap. PDF and old `.doc` are refused with "paste the text or save as
  .docx" (the lab ships no PDF reader).

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

## Suggest improvements (optional model help, teacher only)

In the People section, "Suggest improvements" offers new questions and answer lines, each with Accept / Dismiss.
Accept is ONE `topic.add` editor operation carrying the text (so undo and live validation work); a question gets the
source sentence that best answers it. With the site teacher key (or a class on this device, whose teacher passcode is
sent), the editor calls `POST /api/experience-compile` (`functions/api/experience-compile.js`) with
`{ source (≤ 6,000 characters), settings, def: { characters: [{ id, name, role }] }, code? }` and nothing else. The
model (Claude Haiku, else Workers AI; never Gemini) returns `{ questions: [{ character, ask, keywords }],
lines: [{ character, text }] }` (≤ 6 each); `suggest-rules.js` (shared by server, editor and tests) drops items over
30 words, for unknown characters, with score / level / grade / points wording the source does not use, or (lines) not
traceable by `traceText`; a malformed reply is dropped whole. Caps: per IP 60 an hour, site 600 a day (shared guard,
own scope). Nothing is stored. Without a credential, a model or a usable reply, the editor shows "Built-in
suggestions only": source sentences no evidence, answer or meaning uses yet. Recorded as the sixth exception in
`PLATFORM.md`, rule 3.

## Tests

- `node --test tools/compiler.test.mjs` (pipeline, traceability, editor operations, scripted play, drafts)
- `node --test tools/compiler-docx.test.mjs` (the Word reader on real .docx files built with jszip: guards, zip bomb,
  upload cap; built-in suggestions, the request, Accept)
- `node --test functions/api/experience-compile.test.mjs` (reply validator, teacher gate, no Gemini, caps)
- `node --test functions/api/class/experiences.test.mjs` (publish, get, unpublish, auth, limits, class delete)
- `node tools/compiler-e2e.mjs` (real browser; its server calls the real class function over `node:sqlite` and the
  real suggestion function with a stub model; uploads a real .docx)

## Not built

- The player always offers its three help kinds. `def.supports` records which supports the instructor turned on,
  and turning frames off removes the task's own frames, but the player does not yet hide a help kind that is off.
