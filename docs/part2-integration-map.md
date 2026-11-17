# The Language Page — Part 2 integration map

Part 2 adds five shared systems to the existing lab (`access-practice-lab/`, served at thelanguagepage.com and
eduwonderlab.com/access-practice-lab/). Nothing here is a new site, account system or progress store.

## Audit (2026-11-17, origin/main)

| Layer             | What exists                                                                                                                                                                                                                                  | Where                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend          | Dependency-free ES modules, one router, lazy views (`render(ctx)`, `onClick(e, ctx)`, `onInput`, `onChange`), tagged `html` templates, EN/ES via `i18nFor(ctx)`                                                                              | `src/main.js`, `src/views/*`, `src/util.js`, `src/i18n.js`                                                               |
| Navigation        | One registry for nav, section bar, Explore, footer                                                                                                                                                                                           | `src/sitemap.js`, `src/home-registry.js`                                                                                 |
| Design            | Deep Harbor tokens; audience registers                                                                                                                                                                                                       | `ds.css`, `registers.css`, `src/register.js`                                                                             |
| Progress          | `localStorage` keys `accessPracticeLab:v1:*`; Passport export/import carries every such key                                                                                                                                                  | `src/store.js`, `src/transfer.js`, `src/views/passport*.js`                                                              |
| Evidence          | The ledger (numbers and ids, first vs revision, independent vs supported)                                                                                                                                                                    | `src/lang/ledger.js`                                                                                                     |
| Language analysis | Tokens, 25 error detectors, Key Language Use moves, response analysis, draft comparison                                                                                                                                                      | `src/lang/{text,errors,purpose,analyze}.js`                                                                              |
| Speech            | Recorder, kept takes (IndexedDB), browser speech-to-text with typing fallback, TTS                                                                                                                                                           | `src/recorder.js`, `src/audio-store.js`, `src/stt.js`, `src/speech.js`                                                   |
| Story engines     | Adventure Worlds (linear scenes), Language Games (chapter steps), Language City, Worlds                                                                                                                                                      | `src/adventures/*`, `src/flagship/*`, `src/views/city*.js`                                                               |
| Authoring         | Lesson Builder, Launch Studio, Book Studio                                                                                                                                                                                                   | `src/lesson-builder/*`, `src/views/launch-studio.js`, `src/book/*`                                                       |
| Class backend     | Cloudflare Pages Functions + D1 (tables created lazily with `CREATE TABLE IF NOT EXISTS`): join code + alias, assignments `{id,title,path,due}`, progress doc sync, review queue (shared writing/recordings, teacher chips + comment), books | `functions/api/class/[[path]].js`, `functions/_lib/class-platform/*`, `shared/class-platform/contract.js`, `src/class/*` |
| AI                | `callModel` (Claude Haiku, else Workers AI; Gemini opt-in). Class helpers only SELECT authored ids; replies are validated and dropped when they do not fit                                                                                   | `functions/_lib/model-call.js`, `functions/_lib/class-platform/ai.js`, `src/class/ai-feedback.js`                        |
| WIDA model        | One expectation catalog and framework chain                                                                                                                                                                                                  | `src/acc/wida/{catalog,framework}.js`, `src/lang/klu.js`                                                                 |
| Tests             | `node --test tools/*.test.mjs`; Playwright scripts `tools/*-e2e.mjs`; gates in `scripts/qa-run.mjs`                                                                                                                                          | `tools/`                                                                                                                 |

Rules every Part 2 module keeps (PLATFORM.md): no invented proficiency or score; scaffolds never contaminate
independent results; a revision after feedback is supported; nothing is an official WIDA/ACCESS result; no timers.

## The five systems and where they attach

| System                          | New shared code                                                  | Existing feature it extends                                                                         | Route                                                 |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| A. Living Simulation Engine     | `src/sim/` (schema, runtime, characters, art, missions)          | Explore → Games & Worlds; Adventure Worlds hub; assignments; ledger; Passport                       | `/simulations`, `/simulations/<mission>`              |
| B. Language Intelligence Engine | `src/intel/` (engine, loop, ui)                                  | Speaking Studio, Writing Studio, Book Studio, ACCESS learning mode, simulations, class review queue | embedded panel (no route)                             |
| C. Teacher Experience Compiler  | `src/compiler/` + `functions/_lib/class-platform/experiences.js` | Teacher Hub, Lesson Builder, assignments                                                            | `/experience-builder`, plays at `/simulations/x/<id>` |
| D. Language Time Machine        | `src/timemachine/`                                               | Passport, Portfolio                                                                                 | `/time-machine`                                       |
| E. Connected Learning Engine    | `src/pathways/` (skill graph, pathways, recommendations)         | ACCESS activities, Speaking Studio, simulations, Book Studio, Family Hub, assignments               | `/pathways`, `/pathways/<id>`, `/pathways/build`      |

## Shared contracts

### Routes (already registered in `src/main.js`)

`ctx.route = { view, id, sub, tab, q }` for `simulations`, `experience-builder`, `time-machine`, `pathways`
(`/simulations/<id>/<sub>?tab=`; `q` is every query parameter).

### Assignments

Unchanged server shape `{ id, title, path, due }`; `id` matches `/^[a-z0-9][a-z0-9:_-]{0,39}$/`, `path` matches
`/^\/[\w\-./?=&%]{0,200}$/`. A mission, a compiled experience and a pathway are each assigned as their own route.

### Evidence to the teacher

The class review queue: `POST /api/class/review/share { code, label, text }` (student) and the teacher's queue with
practice-rubric chips and a comment. Part 2 work is shared with `loopDigest(loop)` (below) as `text`.

### The feedback loop (`src/intel/loop.js`, written)

Key `accessPracticeLab:v1:intel`. `startLoop(state, { src, band, objective, task:{id,title,prompt,keyUse,domain} })`,
`recordStage(state, loopId, stage, data, { metrics })`, `getLoop`, `listLoops(state, {src, objective, taskId})`,
`nextStage(loop)`, `loopDigest(loop)`, `loadIntel()`, `saveIntel(state)`.
Stages: `response`, `feedback`, `practice`, `revision`, `transfer`, `review`. A response and a transfer are written
once (a new try is a new loop, `attempt` counts up), so earlier work is never changed.
`src` values: `speak`, `write`, `book`, `access`, `sim`, `pathway`, `time-machine`, `experience`.

### Feedback (`src/intel/engine.js`)

```js
buildFeedback({ text, keyUse, domain, source: "typed" | "transcript", task: { id, prompt, sourceText?, sourceTerms? },
                supports, band })
// → { version: 1, grounded: true,
//     strength:  { id, text: [en, es], quote },          // quote is a verbatim substring of `text`
//     nextStep:  { id, dimension: "discourse"|"sentence"|"word", text: [en, es], quote: string | "" },
//     explanation: [en, es],                               // student-friendly why
//     scaffold:  { kind: "frame"|"connector"|"word"|"model-move", text: [en, es] } | null,
//     revisionPrompt: [en, es],
//     transfer:  { prompt: [en, es], keyUse, route: string | "" },
//     dimensions: { discourse: Obs[], sentence: Obs[], word: Obs[] },   // Obs = { id, text: [en, es], quote }
//     uncertainty: { level: "none"|"transcript"|"short", note: [en, es] } }
isGrounded(feedback, text)   // every non-empty quote occurs in text
```

`src/intel/ui.js`: `loopPanelHTML(ctx, loopId, opts)` and `onLoopClick(e, ctx)` / `onLoopInput(e, ctx)` render and
drive the whole loop (feedback card → guided practice → revision → new task → share with teacher) inside any view.

### Simulation mission definition (`src/sim/schema.js`: `SCHEMA = "lp-sim/1"`, `validateMission(def)`)

```js
{ schema: "lp-sim/1", id, version, title: [en, es], summary: [en, es], band: "3-5" | "6-8" | "all",
  subject, keyUses: ["Explain", ...], objectives: { language: [en, es], content: [en, es] },
  vocabulary: [{ term, meaning: [en, es] }],
  acts: [{ id, title: [en, es], goal: [en, es], done: Cond }],
  start: sceneId,
  scenes: [{ id, title: [en, es], art, description: [en, es], requires?: Cond,
             hotspots: [{ id, label: [en, es], x, y, opens: { evidence?: id, character?: id, task?: id, scene?: id }, requires?: Cond }] }],
  characters: [{ id, name, role: [en, es], scene, look, style: [en, es], greeting: [en, es], fallback: [en, es],
                 topics: [{ id, ask: [en, es], keywords: [..], answer: [en, es], requires?: Cond, gives?: [evidenceId],
                            sets?: { flag: value }, clarify?: { ask: [en, es], answer: [en, es], gives?: [evidenceId] } }] }],
  evidence: [{ id, kind: "document" | "audio" | "object" | "testimony" | "data", title: [en, es], body: [en, es],
               supports?: [explanationId], contradicts?: [explanationId], strength?: "strong" | "weak" }],
  explanations: [{ id, label: [en, es] }],
  tasks: [{ id, type: "compare" | "decide" | "speak" | "write" | "revise" | "transfer", scene, prompt: [en, es],
            keyUse, domain, requires?: Cond, minWords?, options?: [{ id, label: [en, es], explanation?, sets? }],
            pairs?: [[evidenceId, evidenceId]], of?: taskId }],
  outcomes: [{ id, title: [en, es], text: [en, es], when: Cond }],   // first match wins; the last one has no `when`
  source?: { title, text } }                                           // compiled experiences keep the teacher's text
// Cond = { all: [Cond] } | { any: [Cond] } | { not: Cond } | { flag: [name, value] } | { has: evidenceId }
//      | { evidence: n } | { done: taskId } | { chose: [taskId, optionId] } | { talked: characterId } | { cited: [taskId, n] }
```

Interactions (the eleven): examine an object, read a document, listen to a message (evidence kinds), interview a
character, ask a clarification question (topics), compare evidence, make a decision, spoken explanation, written
recommendation, revise, independent transfer (task types).

The runtime (`src/sim/runtime.js`) is pure: `newState(def)`, `validActions(def, state)`, `act(def, state, action)`
→ `{ state, events, error }`, `outcomeOf(def, state)`, `progressOf(def, state)`. Only the runtime changes flags,
inventory, scenes and outcomes. A model may only choose which authored topic answers a typed question.
Saves: `accessPracticeLab:v1:sim = { [missionId]: State }`.

### Compiled experiences

`src/compiler/compile.js`: `compileExperience({ source, settings }) → { def, report }` where `def` is a mission
definition above (id `x-<random>`), validated by `validateMission` plus compiler checks. Published through the class
server (`/api/class/experience/*`, table created lazily); students open `/simulations/x/<id>`.

### Objectives and pathways (`src/pathways/graph.js`)

Objective ids are stable slugs (`explain-with-evidence`, …) mapped to Key Language Uses and to the existing WIDA
catalog (`src/acc/wida/catalog.js`); never a second standards list. Pathway progress:
`accessPracticeLab:v1:pathways`. A stage is complete when its own feature recorded the work (ledger entry, loop or
feature key), never because a link was opened.

## Acceptance tests

| #   | Demonstration                                                           | Test                                                        |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Two investigation paths, different outcomes, save/resume, evidence      | `tools/sim-engine.test.mjs`, `tools/sim-e2e.mjs`            |
| 2   | Record/type → grounded feedback → revise → transfer                     | `tools/intel-engine.test.mjs`, `tools/intel-e2e.mjs`        |
| 3   | Source text → editable playable experience → assign                     | `tools/compiler.test.mjs`, `tools/compiler-e2e.mjs`         |
| 4   | An existing book supports a language interaction and portfolio evidence | `tools/intel-e2e.mjs` (Book Studio step)                    |
| 5   | Earlier and later work compared with context                            | `tools/time-machine.test.mjs`, `tools/time-machine-e2e.mjs` |
| 6   | One objective across ACCESS, Speaking, simulation, Book Studio          | `tools/pathways.test.mjs`, `tools/pathways-e2e.mjs`         |
| 7   | Existing routes, projects and saved progress still work                 | existing suites + `tools/part2-regression.test.mjs`         |
