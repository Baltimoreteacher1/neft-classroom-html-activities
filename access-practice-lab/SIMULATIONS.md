# Simulations — the Living Language Simulation Engine

Routes: `/simulations` (hub), `/simulations/<mission>` (play), `/simulations/<mission>/report` (evidence report),
`/simulations/x/<id>` (a compiled experience; report at `?tab=report`). Binding contracts:
`docs/part2-integration-map.md`.

| Part              | File                                                                                 | What it owns                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema            | `src/sim/schema.js`                                                                  | `SCHEMA = "lp-sim/1"`, `INTERACTIONS` (eleven), `validateMission(def)`, `evalCond(cond, state, def)`                                                          |
| Runtime           | `src/sim/runtime.js`                                                                 | Pure, deterministic: `newState`, `validActions`, `act`, `outcomeOf`, `progressOf`, `restore`, `loadSaves`/`saveState`/`clearSave`, `judgePair`, `helpAllowed` |
| Characters        | `src/sim/characters.js`                                                              | `matchTopic`, `resolveQuestion`, `assistTopic`, `lineFor`, `suggestions`, `transcriptOf`                                                                      |
| Language evidence | `src/sim/evidence.js`, `src/sim/report.js`                                           | Loop store entries (`src: "sim"`), feedback from `src/intel/engine.js`, `missionReport`, `shareReport`                                                        |
| Player            | `src/sim/ui.js` (+ `ui-panels.js`, `ui-language.js`, `ui-actions.js`, `ui-state.js`) | The reusable screen                                                                                                                                           |
| Art               | `src/sim/art.js`, `sim.css`                                                          | Inline SVG scenes, map, portraits, glyphs; `sim-` classes, ds.css tokens only                                                                                 |
| Missions          | `src/sim/missions/index.js`, `city-that-stopped-talking*.js`                         | Registry and the flagship                                                                                                                                     |
| View              | `src/views/simulations.js`                                                           | Hub, mission page, report, compiled experiences                                                                                                               |
| Server            | `functions/_lib/class-platform/ai.js`                                                | `POST /api/class/ai/character` (select-only)                                                                                                                  |

Tests: `node --test tools/sim-engine.test.mjs`, `node tools/sim-e2e.mjs [--shots <dir>]`,
`node --test functions/api/class/ai.test.mjs`.

## Rules the engine keeps

1. Only the runtime changes flags, the evidence notebook, scene access, task results, the act and the outcome. A
   refused action returns `error` and the same state object.
2. A character says only its authored lines. A typed question is matched on the device; an off-topic or still-closed
   question gets the character's `fallback`. The optional model selects one open topic id or `"none"`; its reply is
   validated on the server and again in the browser, and it is called only when the learner presses "Ask the helper
   to match my question" (what is sent: the typed question and the open topics' ids and question labels).
3. Supports are the learner's choice. Opening the word bank, sentence frames, word meanings (while a draft is in
   progress) or a listening transcript (before adding the message) records that work as supported. A revision is
   always supported. The transfer task offers no help and is recorded as independent.
4. An outcome is a story consequence, never a grade. No timers, points, levels or rankings anywhere.
5. Speak, write, revise and transfer tasks are written to the shared loop store (`accessPracticeLab:v1:intel`), so
   each is a ledger entry (`src: "intel:sim"`). Nothing is shared until the learner presses Share.
6. Saves: `accessPracticeLab:v1:sim = { [missionId]: State }`, written after every accepted action. A save from
   another mission version starts fresh.

## Mission definition (`lp-sim/1`)

The documented shape in `docs/part2-integration-map.md` is implemented exactly. Text is always `[English, Spanish]`.
Hotspot `x`, `y` are percentages (0-100) of the scene picture; keep hotspots about 14 apart in x or 24 in y so they
do not overlap on a phone. `art` is one of `square`, `lab`, `newsroom`, `comms`, `ops`, `site`, `records`,
`interview`, `report` (anything else draws `site`). `look` is `{ skin, hair, style, shirt, acc }` (see
`src/views/scenario-art.js`) or a named look: `expert`, `neighbor`, `official`, `reporter`, `worker`, `student`.

### Optional additions (everything below may be left out)

| Where         | Field                                                          | Meaning                                                                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mission       | `map: [{ scene, x, y }]`                                       | Places on the mission map. Mapped places can be walked to from anywhere (subject to `requires`). Without it, scenes connect only through `opens.scene` hotspots and the map lays itself out.                                                                                                                  |
| mission       | `outcomeAfter: actId`                                          | The outcome is decided when this act is done (default: the last act).                                                                                                                                                                                                                                         |
| mission       | `standards: [id]`                                              | WIDA expectation ids from `src/acc/wida/catalog.js` (shown in the "For teachers" fold).                                                                                                                                                                                                                       |
| mission       | `objective: slug`                                              | Pathway objective for the loop store (default `explain-with-evidence`).                                                                                                                                                                                                                                       |
| mission       | `supports: { frames, wordBank, glossary, spanish, readAloud }` | Booleans. `false` turns that help off for everyone: `frames` and `wordBank` hide the button and the runtime refuses the help action (`help-off`); `glossary` hides the word meanings; `spanish` shows the player in English only. `readAloud` is accepted and not used by the player. Absent = everything on. |
| character     | `wants: [en, es]`                                              | What the character is trying to do (journal).                                                                                                                                                                                                                                                                 |
| topic         | `again: [en, es]`                                              | The short line for a repeated question (default: "As I said: " + the first sentence).                                                                                                                                                                                                                         |
| decide option | `reply: [en, es]`                                              | What is said back after this choice.                                                                                                                                                                                                                                                                          |
| task          | `frames: [[en, es]]`, `bank: [string]`                         | Sentence frames and word bank (defaults: frames by Key Language Use; signal words from `src/lang/klu.js`).                                                                                                                                                                                                    |
| compare task  | `answers: [{ relation, stronger }]`                            | Overrides the derived truth for each pair.                                                                                                                                                                                                                                                                    |
| Cond          | `{ support: [taskId, n] }`                                     | At least `n` cited pieces support the chosen option's `explanation`.                                                                                                                                                                                                                                          |
| Cond          | `{ strong: [taskId, n] }`                                      | At least `n` of those are `strength: "strong"`.                                                                                                                                                                                                                                                               |
| Cond          | `{ resolved: taskId }`                                         | The comparison was judged correctly.                                                                                                                                                                                                                                                                          |
| Cond          | `{ act: actId }`                                               | Every act before `actId` is done.                                                                                                                                                                                                                                                                             |

How a comparison is judged (when `answers` is absent): two pieces conflict when one `supports` an explanation the
other `contradicts`; they agree when they share a `supports` or a `contradicts`; otherwise unrelated. The stronger
one is the `strong` one, or `"same"`.

### What `validateMission` rejects

Unknown ids in any reference; a missing start scene; a scene that cannot be reached; an act whose `done` can never
be true; no outcomes, a last outcome with `when`, or an earlier outcome without it; no speak or write task; missing
English or Spanish; duplicate ids; bad condition shapes; a decision with one option; a comparison with no pair; a
revision without `of`; testimony opened from a scene. Warnings: evidence, characters or tasks nothing opens.

### Runtime actions

`move { scene }` · `examine | read | listen { evidence, transcript? }` · `ask { character, topic | null }` (null =
fallback) · `clarify { character, topic }` · `help { task, kind: "bank" | "frames" | "words" }` ·
`compare { task, pair, relation, stronger, reason }` · `decide { task, option, cited[], reason? }` ·
`submit { task, text, source: "typed" | "transcript", loopId? }`.

## Authoring a mission

1. Copy the shape of `src/sim/missions/city-that-stopped-talking.js` (meta, acts, scenes, map) and split people,
   evidence and tasks into their own files when they grow.
2. Give every explanation supporting and contradicting evidence of different strength, and make outcomes depend on
   the evidence cited (`support`, `strong`) and a settled conflict (`resolved`), not on the option alone.
3. Gate later topics with `requires` (`{ has: evidenceId }`, `{ talked: characterId }`, `{ act: actId }`).
4. Register it in `src/sim/missions/index.js` (`BUILDERS`). A builder takes the band and returns the definition
   (one id for both bands).
5. Add scripted paths for it to `tools/sim-engine.test.mjs` and run the tests.

## Embedding the player (compiler preview)

```js
import {
  createSession,
  playerHTML,
  onPlayerClick,
  onPlayerInput,
  onPlayerChange,
  stopPlayer,
} from "../sim/ui.js";

const session = createSession(def, { state, save: (s) => {}, preview: true, band: "6-8" });
// in render(ctx):   playerHTML(ctx, def, session.state, { session })
// in onClick:       if (onPlayerClick(e, ctx, session)) return true;
// in onInput:       onPlayerInput(e, ctx, session);
// in onChange:      onPlayerChange(e, ctx, session);
// in unmount:       stopPlayer(session);
```

`def` must have passed `validateMission`. `session.state` is replaced after each accepted action and handed to
`save`. `preview: true` writes nothing to the loop store or the ledger, offers no sharing and no model helper;
feedback is still shown. Other options: `reportHref` (link on the completion panel), `objective` (pathway objective
slug for the loop). The player calls `ctx.rerender()` itself. One player per page (element ids are fixed).

Compiled experiences on this device: `accessPracticeLab:v1:experiences = { [id]: { def, updatedAt } }` (read by
`localExperiences()`); otherwise `/simulations/x/<id>` asks `GET /api/class/experience/get?id=<id>` and accepts
`{ def }` or `{ experience: { def } }`.
