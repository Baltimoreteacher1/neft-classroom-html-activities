# ACCESS Learning Journey — contract

The Journey is a guided path (4 units, 12 missions, 6 steps each) over the existing lab. It is additive:
no existing route, storage key or activity changes meaning. Everything runs on the device; no student text or
audio leaves it. Nothing here is a WIDA/ACCESS score, level or prediction (see `PLATFORM.md`, "Rules that must keep holding").

## Routes

| Route                   | View                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `/journey`              | Continue My Journey (resume the next meaningful step; new student sees "Start My Learning Journey") |
| `/journey/map`          | Journey map: 4 units, 12 missions, 6 steps each, states, review, evidence                           |
| `/journey/<mNN>`        | Mission overview (goal, steps, language features, family link)                                      |
| `/journey/<mNN>/<step>` | Step runner. `step` is one of `discover understand build communicate improve show`                  |
| `/journey/guide`        | Teacher mission guide (unit/mission overview, WIDA references, evidence, direct links)              |

Student-facing links to a mission step are `${BASE}/journey/m08/communicate?grades=6-8`.
Teacher-directed links add `&assigned=1` (does not change other progress).

## Files and ownership

```
src/journey/curriculum.js     UNITS, STEPS, FEATURES, mission registry (lazy loadMission), validateMission
src/journey/wida.js           WIDA mapping per Key Language Use x grade cluster (references only)
src/journey/state.js          pure state: load/save/merge/migrate, step status, completeStep, mission status
src/journey/recommend.js      deterministic next-step + review recommendation with reasons
src/journey/engines/*.js      pure engine logic, no DOM (scene, listen, xray, construct, converse, compose, mirror)
src/journey/ui/*.js           DOM renderers + mounts for each engine (render(task, state, ctx) -> html; mount(root, api))
src/views/journey.js          the route view (map, overview, step host, teacher guide)
src/content/journey/mNN.js    mission packs (default export), lazy loaded with import()
journey.css                   all journey styles (tokens from ds.css; no new palette)
```

## Shared conventions

- `T = [en, es]` is a bilingual text pair rendered with `I.T(...T)` / `I.S(...T)` (`i18nFor(ctx)`).
- Authored task content (scripts, passages, prompts, options, model sentences) is English and rendered `lang="en"`.
  Instructions, titles, goals, feedback chrome and all family guidance are bilingual `T`.
- Vocabulary entries are `[term, "plain English meaning", "Spanish term: meaning in Spanish"]`.
- Views: `export async function render(ctx) -> {title, html}`, `export function mount(root, ctx)`. `html` is the
  tagged template from `src/util.js`. Re-render with `ctx.rerender()`.
- Support mode (existing "Starting / Growing / Expanding"): `A | B | C`. Opening any help marks the step `supported`.
  "On my own" (`C` with help closed, and every `show` step) renders no frames, bank, model, Spanish bridge, X-ray or hints.
- Ledger: every submitted response also calls `appendEntry(ledger, { src: "mission", task: "<mNN>.<step>", band, domain,
use: klu, stage, kind: first|revision|transfer, supports, m: analyzeResponse(...).ledger })` from `src/lang/ledger.js`.
- Use `analyzeResponse` / `compareDrafts` / `purposeMoves` (`src/lang/`) for feedback. Feedback quotes the learner's own
  words (spans) and names ONE next move. Never rewrite the student's response. Never show a score.
- Hints and help text must never state an answer (same rule `tools/access-living-studio.test.mjs` enforces).
- Every interaction has a keyboard path; drag is never the only way (tap-to-select then tap-to-place).
- Motion respects `prefers-reduced-motion`.

## State (`accessPracticeLab:v1:journey`)

```
{ v: 1,
  bands: { "3-5": B, "6-8": B } }
B = { support: "A"|"B"|"C",
      cursor: { mission: "m01", step: "discover" },
      missions: { m01: { startedAt, steps: { discover: S, ... }, reviewed: { <mNN>: iso } } },
      assigned: { mission, step } | null }
S = { status: "started" | "done",
      stage: "supported" | "independent",   // set when status becomes done; independent only if no help opened
      help: [ids], attempts: n, doneAt, revisits: n,
      data: { ...engine-private resumable state... } }
```

Mission status (derived, never stored): `not-started | in-progress | completed-with-support | independently-demonstrated`
(+ `revisited` flag when any step has revisits > 0). `independently-demonstrated` requires `show.stage === "independent"`.
Merge on import: union by step; a `done` beats `started`; `independent` beats `supported`; larger `attempts` wins; local data wins on ties.

## Steps and completion criteria (observable)

| Step        | Language Reality Engine                                                           | Done when                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| discover    | Living Language World (`scene`)                                                   | learner examined `collect` objects, ran at least one manipulation, and sent an explanation that the partner has answered once |
| understand  | Active Listening (`listen`) then Reading X-Ray (`read`)                           | listening placements all correct (any number of tries) AND the reading challenge relationship is built and explained          |
| build       | Language Construction (`build`)                                                   | each module in `build` accepted by the engine, then its transfer item accepted                                                |
| communicate | Conversation Reality (`converse`) or Living Writing (`compose`)                   | learner finished the exchange / draft and submitted at least `minWords` words                                                 |
| improve     | Growth Mirror (`mirror`)                                                          | learner revised the response on ONE target, saw the comparison, and chose why the change helps                                |
| show        | independent transfer (`mirror` independent mode over a `converse`/`compose` task) | learner submitted the new task with no help open                                                                              |

A step is never blocked by a low result. After difficulty the runner offers a supportive next step (see `recommend.js`).

## Mission pack

Three places, one source of truth each:

* `MISSIONS` in `src/journey/curriculum.js` (static): title, tagline, Key Language Use, environment, spiral `features` and `reviews`,
  per-band `goal`, per-band `wida` ({ standard, dimensions }). Loaded with the page, so the map/home/teacher guide never load packs.
* `src/content/journey/mNN.js` (lazy, `export default { id, bands: { "3-5": Band, "6-8": Band } }`): the playable tasks.
  A pack must NOT repeat anything held in `MISSIONS` (validator rejects it). `Band.environment` must equal `MISSIONS[id].environment`.
* `src/content/journey/family.js` (one default export, `{ m01: Family, ... m12: Family }`): the bilingual Family Mission Companions.

`Family` (all bilingual; every field required; no WIDA terms; a grown-up reads it aloud):
```js
{ goal: T, practicing: T, why: T,
  fiveMinute: { "3-5": T, "6-8": T },
  talk: { "3-5": T, "6-8": T },                 // one conversation prompt
  listenOrRead: T,
  challenge: T,                                 // optional speaking/writing challenge
  revise: T,                                    // how to encourage revision without giving answers
  frames: [T, T, T],                            // useful language (English frame, Spanish meaning)
  homeLanguage: T }                             // reassures: talk in any language you share; English-only is not required
```

`Band`:

```js
{
  environment: "garden",   // classroom | lab | garden | community | museum | library | map | debate
  context: { title: T, premise: "1-2 English sentences", cast: [{ id, name, role: T, glyph: "emoji" }] },
  vocab: [[term, meaning, "es: ..."], ... 6-8],
  frames: { A: ["frame", ...], B: ["frame", ...], C: [] },       // sentence frames by support mode; C is hints only
  discover: SceneTask,
  understand: { listen: ListenTask, read: ReadTask },
  build: BuildTask[],                                           // 1-2 modules; each carries its own `transfer` item for the independent check
  communicate: CommTask,
  improve: { models: { [moveId]: "one model sentence" }, whys: [ { id, text, moves: [moveId] } ] },
  show: CommTask                                                // NEW context, same Key Language Use; independent
}
```

### SceneTask (Living Language World)

```js
{ kind: "scene", prompt: "English question that frames the inquiry",
  objects:  [{ id, label, glyph, x: 0-100, y: 0-100, note: "observation text revealed on examine", relevant: true|false }],
  controls: [{ id, label, options: [{ id, label }], initial: "optionId" }],
  outcomes: [{ when: { controlId: "optionId" }, state: "what the scene now shows", mood: "good|warn|bad", key: "id" }],
  collect: 3,                      // observations required
  variables: [{ id, label, terms: ["sun", "sunlight", "light"], evidenceTerms: ["6 hours", "wilted"], probe: "partner question when this cause is chosen", good: "what a strong evidence answer would add (never the answer itself)" }],
  partner: { name, glyph, opening, noCause: "asks for a cause", noEvidence: "asks for evidence (generic)", thanks: "closing line" },
  respond: { prompt, minWords: 12 } }
```

`outcomes` are matched most-specific-first against the current control values; the first with every `when` entry equal wins.
`variables` let the partner recognise ANY valid cause the learner names and ask the evidence question for THAT cause.

### ListenTask (Active Listening)

```js
{ kind: "listen", mode: "arrange" | "place" | "sort" | "follow",
  title: "...",
  script: [{ id: "u1", text: "one spoken sentence", signal: "first" }],   // spoken with speechSynthesis, one utterance each
  items: [{ id, label, glyph }],
  targets: [{ id: "t1", label }],                                         // slots (arrange/follow), cells (place), bins (sort)
  expect: [{ item: "itemId", target: "targetId", utterance: "u2" }],      // the correct action and the sentence that says it
  visuals: { "u2": "short visual support phrase" },
  xray: { keywords: ["word"], sequence: ["first"], cause: ["because"], referents: [{ phrase: "it", means: "the plant" }] },
  grid: { cols, rows },                                                    // place mode only
  final: ListenTask-lite }                                                  // optional new sequence used for the independent check
```

Wrong action -> replay `expect.utterance`, highlight its `signal`, offer `visuals[utterance]`, allow another try.
Independent attempts show no xray, no transcript, no visuals.

### ReadTask (Reading X-Ray)

```js
{ kind: "read", title: "...",
  passage: [{ id: "s1", text: "sentence", role: "claim|evidence|reason|detail|background|conclusion", supports: ["s1"] }],
  claimOptions: ["s1", "s4"],                                  // sentences the learner may pick as the claim to investigate
  challenge: { type: "evidence",                               // evidence | cause-effect | sequence | perspective
    claim: "s1", valid: ["s2","s3"], minValid: 2, weak: ["s5"],  // weak = on topic but does not support the claim
    explainFrame: "This evidence shows ... because ...",
    explainTerms: ["because", "shows"],
    transfer: { passage: [...], claim: "t1", valid: [...], minValid: 1, weak: [...] } },
  refs: [{ sentence: "s3", phrase: "it", means: "the seed" }],  // pronoun trace
  layers: { meaning: [{ s: "s2", phrase: "...", label: "evidence" }], discourse: [...], sentence: [...], word: [{ s, phrase, label, def }] } }
```

Feedback depends on the learner's real selections: valid, weak (on topic only) and irrelevant sets give different messages.

### BuildTask (Language Construction)

`{ kind: "build", module: "expand"|"combine"|"connector"|"morphology"|"pronoun"|"discourse", title, ...}`

- expand: `{ base: "The plant grew.", needs: [{ id, label, test: { connectorJob: "cause" } | { terms: [...] } | { minNew: 3 } }], altConnectors: [{ word, note }], transfer: { base, needs } }`
- combine: `{ pair: ["s1", "s2"], relation: "cause"|"contrast"|"sequence"|"addition", keep: ["term"], transfer: { pair, relation, keep } }`
- connector:`{ gaps: [{ before, after, relation, options: ["because","but"], ok: ["because"] }], notes: { because: "meaning change" }, transfer: { gaps } }`
- morphology: `{ words: [{ word, parts: [{ t, type: "prefix|root|suffix", meaning }], ask }], transfer: { words } }`
- pronoun: `{ text: [{ id, text }], pronouns: [{ sentence, phrase, options: [..], ok }], transfer: {...} }`
- discourse:`{ units: [{ id, text, role }], order: ["id", ...], alt: [["id",...]], connectors: [{ before, word }], transfer: {...} }`
  The engine accepts any construction that satisfies the relation tests (connector job from `lexicon.js` CONNECTORS, kept terms,
  new content words), not one stored sentence.

### CommTask (Communicate / Show)

```js
{ kind: "converse", mode: "discuss" | "speak",
  prompt: "what the learner must communicate",
  partner: { name, glyph, role: T, opening: "first line" },
  topicTerms: ["terms for analyzeResponse"], sourceTerms: ["..."],
  evidenceBank: ["facts available in A/B support; ignored when independent"],
  lines: [{ id, terms: ["valid line of reasoning"], evidenceTerms: [], ack: "partner restates it", probe: "evidence question for this line", close: "what a strong answer would add" }],
  followUps: { claim: "", reason: "", evidence: "", support: "", cause: "", chain: "", phenomenon: "", counter: "", restate: "", topic: "", details: "", organize: "", close: "", orient: "", sequence: "", events: "", response: "" },
  maxTurns: 3, minWords: 15 }
{ kind: "compose", mode: "write",
  prompt, audience: T, genre: "argument|explanation|description|narrative|report",
  topicTerms, sourceTerms, evidenceBank: [{ id, text, kind: "fact|quote|number" }],
  readerQuestions: { <moveId>: "a simulated reader's question for that missing move" },
  organizer: ["claim","reasons","evidence"] | ["setting","events","ending"] | ...,
  minWords: 25 }
```

The partner's next line is chosen from the learner's actual reply: it names the matched `line` (any valid line is accepted),
asks that line's `probe` if evidence is thin, otherwise asks `followUps[firstMissingMove]`. Typed replies always work;
speaking records on-device audio with the existing recorder and asks the learner to type what they said.

## Mirror (Improve / Show)

`improve` picks ONE target = the first required missing KLU move of the communicate response (`purposeMoves`), shows graduated
help (1 the move's `ask`, 2 a frame, 3 `improve.models[move]`), the learner revises, `compareDrafts` shows observable changes,
the learner picks a reason from `improve.whys`, then a new independent attempt is the `show` step. Supported practice and
independent performance are recorded separately in `state.js` and the ledger.

## Spiral

`FEATURES` in `curriculum.js` lists the recurring language features (sequence, description, cohesion, evidence, cause-effect,
clarification, perspective, classification, comparison, claim). Every mission lists the features it teaches (`features`)
and the earlier missions it revisits (`reviews`). `recommend.js` uses these edges to pick review and transfer tasks.

## Validation

`validateMission(pack)` (curriculum.js) is the contract: all 6 steps in both bands, every id resolves, every `expect.utterance`
exists, every `valid` sentence exists, help text never contains an answer string, no score/level wording (`SCORE_CLAIM`
from `tools/lib/access-studio-rules.mjs`), every `T` is a 2-string pair with non-empty Spanish.
`node tools/access-journey.test.mjs` runs it over all 12 packs.

## Interfaces between modules (the seams)

### state.js (pure; agent "core" owns it)
```js
KEY, emptyState(), parseState(raw), loadJourney(), saveJourney(state)            // storage touched only by load/save
bandState(state, band)                                    // defaults filled: { support, cursor, missions, assigned }
getStep(state, band, mission, step)                       // S with defaults
updateStepData(state, band, mission, step, engineKey, patch)   // merge patch into S.data[engineKey]
noteHelp(state, band, mission, step, helpId)              // supported from now on; never relabelled independent
completeStep(state, band, mission, step, { independent, summary })   // done + stage; independent only if no help opened
revisitStep(state, band, mission, step)                   // revisits++ ; status stays done
setSupport(state, band, level), setCursor(state, band, mission, step), assign(state, band, { mission, step } | null)
stepStatus(...) -> "new"|"started"|"done-supported"|"done-independent"
missionStatus(state, band, mission) -> "not-started"|"in-progress"|"completed-with-support"|"independently-demonstrated"
missionProgress(state, band, mission) -> { done: 0-6, total: 6, revisited: bool }
mergeJourney(local, incoming)                             // used by store.importProgressData
```
### recommend.js (pure)
```js
recommendNext(state, band, { ledger, assigned, now }) ->
  { kind: "start"|"continue"|"support"|"review"|"next-mission"|"assigned"|"unit-complete"|"journey-complete",
    mission, step, reason: T, alternatives: [{ mission, step, label: T, reason: T }] }
reviewCandidates(state, band, { ledger, now }) -> [{ mission, step, feature, reason: T }]
```
Rules (deterministic, in this order): teacher-assigned > unfinished started step > supportive step after a struggling
supported attempt (same mission, earlier step or a review via MISSIONS spiral edges) > due review of a feature the learner
used with support > next incomplete step > first step of next mission > unit/journey complete. Every result carries a
student-friendly `reason` T. Never blocks: there is always at least one forward action.

### Engine UI modules (`src/journey/ui/<engine>.js`)
Each exports `render(task, env) -> html` and `mount(root, env)`, and keeps ALL resumable state in `env.data` (a plain object
the shell persists under `S.data[<engineKey>]`). The shell supplies `env`:
```js
env = { I,                       // i18nFor(ctx): I.T(en, es), I.S(en, es), I.L(...)
        band, support,           // "3-5"|"6-8"; "A"|"B"|"C"
        independent,             // true on every `show` step and when the learner chose "On my own": render NO supports
        missionId, step, mission,// mission = MISSIONS[missionId]; pack = full pack band: env.pack
        pack,                    // the band's pack (vocab, frames, discover, ...)
        data,                    // this engine's saved state (read-only snapshot)
        update(patch),           // merge into data, persist, rerender
        help(id),                // record that a help item was opened (marks the step supported)
        done(result),            // engine part finished; result is small JSON the shell stores in data.result
        ledger(partialEntry),    // append to the evidence ledger (src: "mission")
        announce(msg),           // live-region message
        navigate(path) }
```
Engine logic (`engines/*.js`) is pure: `init(task) -> state`, reducers return new state, `evaluate*` returns feedback objects
that quote the learner's own words. UI modules only translate between DOM and those functions. Tests drive the pure layer.

Engine keys and files: `scene` (engines/scene.js, ui/scene.js), `listen` (listen), `read` (xray), `build` (construct),
`converse` (converse), `compose` (compose), `mirror` (mirror: improve + independent attempt + growth comparison).

### More seams

* `env.prior`: results of earlier finished steps of the same mission, `{ discover: R, understand: R, build: R, communicate: R, improve: R }`
  where `R` is whatever each engine passed to `env.done(result)`. `communicate` MUST pass `{ text, mode, supportsUsed: [ids], words }`;
  `improve` passes `{ target, before, after, why, supportsUsed }`; `show` passes `{ text, mode, independent: true, words }`.
* Engines that persist drafts keep them in `env.data` so a reload resumes mid-sentence.
* Route dispatcher `src/views/journey.js` renders `{title, html}` and `mount`; page components live in `src/journey/ui/pages.js`
  (`homeHTML`, `mapHTML`, `overviewHTML`) and the teacher guide in `src/journey/ui/guide.js` (`render(ctx)`; the route is `guide` because the site gate treats any path containing "teacher" as teacher-only).
* CSS files (all linked from index.html by the runner/pages workstream): `journey.css` (pages, map, overview, home hero),
  `journey-runner.css` (step runner chrome), `journey-scene.css`, `journey-listen.css`, `journey-xray.css`, `journey-construct.css`,
  `journey-talk.css` (converse + compose), `journey-mirror.css`, `journey-guide.css` (named "guide", not "teacher": the site gate treats any path containing "teacher" as teacher-only). Tokens come from `ds.css` (read `DESIGN-SYSTEM.md`);
  no purple/violet/magenta hues (palette rule: Speaking is Rose & Garnet `#8a3a5c`, Reading `#2e4a94`, Listening teal `#075568`, Writing `#9a4a26`).
* Hard bans (existing rules): no proficiency/level/score claims, no data leaves the device, no timers or countdowns in games,
  English and Spanish only, Spanish interface text must be natural (not word-for-word), authored task content stays English with `lang="en"`.
