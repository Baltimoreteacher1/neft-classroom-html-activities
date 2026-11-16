# Math Universe — developer guide

Real-time games under `/math/games/universe/` in which the mathematics drives the
world. One shared runtime, one folder per game.

```
math/games/universe/
  runtime/          shared, game-agnostic
  games/<slug>/     index.html, game.js, rules.js, levels.js, math.js, render.js, strings.js
tools/universe/     node tests: runtime.test.mjs + one <slug>.test.mjs per game
tools/validate-universe-games-browser.mjs   every game driven in Chromium
```

## The one rule

A game's whole world is **one plain JSON object** (`runtime/sim.js`). No closures,
no `Math.random`, no wall-clock time, nothing simulated outside it. A snapshot is
`JSON.stringify(world)`, a rewind is a restore, and a replay from a snapshot with
the recorded inputs lands on the same hash. The Time Machine and the
Counterfactual Universe are only honest because of this.

Rendering, audio, particles, camera and DOM read the world and never write it.

## Runtime modules

| Module          | What it owns                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sim.js`        | `Simulation`, fixed `STEP` (1/60 s), input bitmask `IN`, in-world PRNG `rand(world)`, `q()` snapping, state hash                                                                                                      |
| `timeline.js`   | **Time Machine**: tree of mathematical turning points; `mark`, `resolve`, `rewindTo`, `compare`, `firstFailure`, verified `replay`                                                                                    |
| `multiverse.js` | **Counterfactual Universe**: `shift({variable, from, to})` forks the world and changes one condition; both realities step with the same inputs; `investigate()` splits measured quantities into changed and invariant |
| `apprentice.js` | **Ori**: concepts with distinctions; `observe(demo)`, `attempt(task)`, `transfer(task)`; telling the answer never counts                                                                                              |
| `evidence.js`   | six strands (completion, accuracy, reasoning, independence, supports, transfer); refuses any speed or duration field                                                                                                  |
| `save.js`       | versioned local saves with `MIGRATIONS`: per-game progress and checkpoint, Ori's state (shared by all games), settings                                                                                                |
| `report.js`     | hands a finished level to EduPulse (`/api/scores`), the Canvas/SCORM bridge and `GameStudio` when those scripts are on the page                                                                                       |
| `physics.js`    | platformer body (coyote time, jump buffer, variable jump, dash, moving platforms, one-way ledges) and top-down momentum                                                                                               |
| `input.js`      | keyboard (remappable), touch, gamepad -> one bitmask per tick                                                                                                                                                         |
| `camera.js`     | follow with look-ahead, dead zone, zoom, shake (off under reduced motion), parallax                                                                                                                                   |
| `audio.js`      | Web Audio only: effects, music and narration buses; procedural sounds and ambient beds; optional speech                                                                                                               |
| `art.js`        | palette, backdrops, the two recurring characters (Wren, Ori), plates and labels                                                                                                                                       |
| `shell.js`      | `UniverseGame` base element: lifecycle, loop, HUD, instrument panel, decisions, evidence, saves                                                                                                                       |
| `panels.js`     | title, pause, settings, key bindings, level complete, Time Machine, Reality Shift, prediction, explanation                                                                                                            |
| `chrome.js`     | shared strings (EN/ES), stylesheet, template, `el()`                                                                                                                                                                  |

## Writing a game

`games/<slug>/game.js` extends `UniverseGame` (see `games/power-plant/`):

```js
class MyGame extends UniverseGame {
  static def = { id, title: {en, es}, tagline: {en, es}, bed, lessons, uses: { multiverse, shift },
                 concepts, levels: [{ id, lesson, standard, title, discovery }], mechanics: [...] };
  static strings = { en: {...}, es: {...} };
  rules = { step(world, mask, prevMask, events), apply(world, action, events),
            applyChange(world, change), measure(world), carry(from, to) };   // last three: multiverse only
  createWorld(levelIndex, seed) {}      // plain JSON with numeric `rng`
  focus(world) {}                       // { x, y, face }
  bounds(world) {}                      // { x, y, w, h }
  drawBackdrop(ctx, cam, world, t) {}   // screen space
  draw(ctx, world, t) {}                // world space
  drawOverlay(ctx, world, t) {}         // optional, screen space
  onEvent(event) {}                     // sound, particles, follow-up lines
  interactable(world) {}                // { id, what, ... } | null
  interact(target) {}                   // this.openPanel(title, build)
  objective(world) {}                   // one HUD line
  describe(world) {}                    // canvas aria-label
  nextStop(world) {}                    // "Guide me there": { id, x, y, what } | null
}
define("ewl-my-game", MyGame);
```

### Decisions and outcomes

A mathematical decision goes through `this.decide(kind, label, action, meta)`.
That marks a turning point on the timeline and applies the action. The world
answers later with an event:

```js
events.push({ type: "outcome", ok, key, vars, mechanic, lesson, misconception, detail });
```

The shell resolves the turning point, records accuracy evidence (and
independence when no support was open), plays the cue and speaks `key`.
Other events the shell understands: `checkpoint {id}`, `complete`,
`say {who, key, vars, mood}`, `jump`, `land`, `dash`, `shift`, `switch`.

Misconception tags must come from the site taxonomy
(`data/misconception-labels.json`). Do not invent tags.

### Every mechanic states its chain

`def.mechanics` documents, for each mechanic:
**player action -> mathematical relationship -> state change -> visible result -> evidence.**
A mechanic whose chain is "answer a question -> get points" does not belong here.

## Standing rules (gated)

- **No clock.** No countdowns, no beat-the-clock language, nothing scored on
  speed. The simulation waits while a panel is open. `evidence.js` throws on a
  duration field.
- **Self-contained.** A game page links to no hub, catalog or other part of the
  site.
- **No giveaways.** A console never prints what a setting will produce; the
  world shows it. Help opens after a miss and is recorded as a support.
- **Access.** Every decision is a native control in the DOM. "Guide me there"
  travels to the next machine with no motor demand and the same mathematics.
  Reduced motion, low graphics, high contrast, three volumes, remappable keys,
  touch controls, English and Spanish.
- **Original art and sound.** Procedural canvas drawing and Web Audio. No image
  or audio files, no third-party characters. The palette is navy, teal, sage,
  gold and terracotta; no violet.
- **No new dependencies.** Canvas 2D and the platform only.

## Tests

- `node tools/universe/runtime.test.mjs` — rewind exactness, branch independence,
  verified replay, one-condition shifts, apprentice learning rule, evidence strands.
- `node tools/universe/<slug>.test.mjs` — the game's mathematics recomputed
  independently, every authored level proven solvable, and every level **played**
  by a scripted bot through the real rules (correct settings succeed, wrong ones
  fail recoverably, rewind restores the exact world).
- `npm run validate:universe-games-browser` — every game in Chromium: starts,
  keyboard moves the player, pause and resume, Time Machine, English/Spanish,
  settings, a reload resumes, axe, 390 px reflow, console clean, frame time.
