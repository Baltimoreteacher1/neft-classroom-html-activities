# Arcade game contract

The three flagship games (Lexicon Tower Defense, Syntax Odyssey, Arena Blitz) are canvas/DOM worlds mounted by
`src/arcade/host.js`. A game builds a world. The shared layers own everything else, so a Shard, a streak, a question
and a result mean the same thing in every game.

## Who owns what

| Layer    | File(s)                                 | Owns                                                                                        |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Host     | `arcade/host.js`                        | launcher, session + UI construction, save/resume, results, evidence, teardown, `?qa=1` hook |
| Session  | `game-core/Session.js`                  | state machine, clock, questions, scoring, shop, recovery, snapshot                          |
| Economy  | `game-core/Economy.js`                  | Lexicon Shards, streak table, upgrades, caps, stakes                                        |
| Prompts  | `game-core/Prompts.js`                  | canonical prompt, bank adapter, validation, evaluation, scaffolds                           |
| Adaptive | `game-core/Adaptive.js`                 | grade + WIDA level + ability selection, transfer, scaffold fade                             |
| Evidence | `game-core/Evidence.js`                 | learning evidence, summaries, CSV, printable report                                         |
| UI kit   | `arcade/ui/*`                           | HUD, question panel, shop, pause, settings, results, launcher                               |
| Loop     | `game-core/Loop.js`                     | `GameLoop`, `PerformanceController`, `fitCanvas`, `ParticlePool`, `SpriteCache`             |
| Input    | `game-core/Input.js`                    | `InputManager` (keyboard + on-screen buttons, buffering)                                    |
| Audio    | `game-core/SoundEngine.js`, `Speech.js` | procedural cues, volumes, speech with transcript fallback                                   |
| Store    | `game-core/ArcadeStore.js`              | versioned local record, bests, unlocks, history, evidence                                   |

A game never builds its own HUD, shop, pause menu, settings, results or question UI, and never reads or writes
`localStorage` directly. If a shared module needs a change, make the smallest additive edit and say so in your report.

## A game module

```js
// src/arcade/<game>/index.js
export default {
  async create(env) {
    // build DOM/canvas inside env.stage; return an instance
    return { destroy() {}, resize() {}, onSettings(settings) {}, onAnswered(result) {} };
  },
};
```

`env`:

| Field                                                            | Meaning                                                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stage`                                                          | empty element under the HUD. Build the world here. Cleaned up for you after `destroy()`.                                                                           |
| `session`                                                        | the `ArcadeSession` (state, economy, streak, hearts, clock, records). Read it; call its commands.                                                                  |
| `ui`                                                             | the `ArcadeUI`. `await ui.ask({ domains?, formats? })` opens the next question and resolves `{ records, pay, last }` after feedback, or `null` if none could open. |
| `I`, `ctx`                                                       | i18n (`I.T(en, es)` markup, `I.S(en, es)` plain string, `I.mode` = `en`/`es`/`bi`) and the lab ctx.                                                                |
| `config`                                                         | `{ band, gradeFocus, level (1-6), mode, calm, focus, reducedMotion, reducedEffects }`.                                                                             |
| `pool`                                                           | the validated prompt pool for this band. The session picks from it; you rarely need it.                                                                            |
| `input`                                                          | an `InputManager`. Bind on-screen buttons with `input.bindButtons(el)`.                                                                                            |
| `perf`                                                           | `PerformanceController`. Call `perf.quality` for particle/shadow/resolution limits.                                                                                |
| `saved`                                                          | the game state you stored last time (`null` on a new run).                                                                                                         |
| `setState(obj)`                                                  | store a small JSON-serializable world state; the host saves it with the run. Call it at safe points (between waves, at checkpoints, after each round).             |
| `finish({ won, place, completedLevel, unlock, summary, title })` | end the run: results screen, evidence record, personal best. `summary` is an HTML string for game-specific results.                                                |
| `status(fn)`                                                     | register a function returning the HUD's level/wave text.                                                                                                           |
| `playing()`                                                      | `session.state === "PLAYING"`. Your simulation advances only while this is true.                                                                                   |
| `announce(msg)`                                                  | polite live-region message.                                                                                                                                        |

## Rules every game keeps

1. **Academic prompts come only from `ui.ask()`.** Never write question text, answers or scores in game code.
2. **Questions pause the world.** While a question, shop, pause or settings dialog is open, `session.state` is not
   `PLAYING`; do not advance enemies, physics or timers. Drive `session.tick(dt)` from your loop (Blitz-style
   timers) and nothing else.
3. **Delta time everywhere.** Use `GameLoop` (capped delta, visibility pause, quality tiers). No `setInterval`
   simulation. Allocate nothing per frame in steady play; use `ParticlePool` and `SpriteCache`.
4. **Every spatial or timing action has an accessible alternative** reachable by keyboard and by a screen reader
   (a real `<button>`/`<select>` control set outside the canvas, labeled, with live announcements). The canvas has
   `role="img"` with a text alternative that updates, and is not the only way to learn game state.
5. **No reaction-time scoring.** Time may be a mode, never evidence. Calm mode (`config.calm`) has no timer, no
   hearts lost, and a fair earning path.
6. **Reduced motion / effects:** respect `config.reducedMotion` and `config.reducedEffects` and the
   `onSettings` callback: replace motion with immediate state changes and cut particles/shake/parallax.
7. **Touch:** every control is at least 44 CSS px (56 with `.ax-big`); no hover-only function; no drag-only function.
8. **Bilingual chrome:** every label, button, instruction, announcement and error goes through `I.T`/`I.S` with
   Spanish written in the same edit (correct accents and punctuation). English language targets stay English.
9. **Persistence:** only through `setState`, `finish` and the host. Versioned, tolerant of missing fields.
10. **Cleanup:** `destroy()` removes every listener, stops the loop, releases audio and cancels timers.
    Mounting and destroying 20 times must not grow listeners or memory.
11. **No copying** artwork, names or mechanics from Kahoot, Gimkit, Blooket or BrainPOP. Art is original:
    procedural Canvas drawing and inline SVG only. No external assets, fonts, CDNs or paid dependencies.
12. **No purple, violet or magenta** anywhere. Alabaster `#FAF9F6` and near-black type on reading surfaces; vivid
    blues, greens, golds and coral inside game worlds.
13. **Honest labels:** never present practice results as WIDA scores or proficiency levels. The practice level is a
    learner choice that sets support.

## Cover art

`src/arcade/<game>/cover.js` exports `coverSVG(band)` returning one original inline-SVG string (16:9, viewBox
`0 0 640 360`, `role="img"` with an `aria-label`, no external references). The hub shows it on the game card.

## Files per game

```
src/arcade/<game>/index.js        default export above
src/arcade/<game>/cover.js        coverSVG(band)
src/arcade/<game>/*.js            world, art, rules (each file <= 500 lines)
access-practice-lab/arcade-<xx>.css   scoped under .ax-<xx>   (td | od | ab) — already linked in index.html
tools/arcade-<game>.test.mjs      pure-logic tests (node --test): rules, balance, determinism, edge cases
tools/arcade-<game>-e2e.mjs       Playwright run through tools/lib/arcade-e2e.mjs: launch to results at 3 viewports
```

## Running things

- Unit tests: `node --test tools/arcade-core.test.mjs tools/arcade-<game>.test.mjs`
- Browser: `node tools/arcade-<game>-e2e.mjs` (set `PW_CHROMIUM_PATH` if Playwright's own Chromium is missing).
  URL shape: `/access-practice-lab/games/<game-id>?grades=<band>&qa=1`. With `qa=1`, `window.__ARCADE__` exposes
  `session()`, `ui()`, `game()`, `ticket()` (the open prompt, answer included) and `state()`.
- Do not run `tools/sync-access-shell.mjs`, `npm run build`, `git commit`, `git add`, `git stash`, `git checkout`
  or `git reset` (the lead does, once, at the end; other agents are editing other files in this worktree).
- Machine load is high. Keep test runs narrow and use generous timeouts.
