# Family Math 2.0: performance budgets

Suite: `node tools/fm2/browser-perf.mjs` (tag `FM-042`). It serves the source tree with Vite (uncompressed, unbundled), drives
Chromium with a 4x CPU slowdown (CDP `Emulation.setCPUThrottlingRate`, a stand-in for a mid-range Chromebook or phone) at
390x844, and exits non-zero when a budget is missed. A missed budget prints the measured number and a proposed budget
(measured + 20%); the assertion is never relaxed in code. Last run: 78 checks, 3 missed (all payload size, see below).

## How the numbers are taken

| Measure                   | Method                                                                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JS + CSS bytes            | Sum of script and stylesheet response bodies under `/math/fluency-lab/`, with Vite's inline source map removed (it adds about 5x in dev). Save/Resume engine and fonts are not counted (not ours). gzip size is reported for information.                                                          |
| Requests                  | Distinct URLs fetched, excluding Vite's own client.                                                                                                                                                                                                                                                |
| DCL / LCP / ready         | Median of 3 cold loads (new context each). `ready` = the ten games validated and Start live (home), first round mounted (play).                                                                                                                                                                    |
| Click latency             | In page: `click()` until after the next paint (`requestAnimationFrame` then `setTimeout 0`), p95 over hint, answer and Next clicks across 30 rounds per game, at 4x CPU.                                                                                                                           |
| Memory / DOM growth       | 30 rounds per game (12-round activities replayed). CDP `HeapProfiler.collectGarbage` twice, then `Runtime.getHeapUsage` and `Memory.getDOMCounters`; baseline after one finish and replay (round 14) so the one-off finish card is already counted. A second leak test resets one puzzle 30 times. |
| Generation cost           | In node, 1,000 `makeRound` calls per game cycling through every skill x level x grade, after 300 warm-up calls; p99 of per-call time.                                                                                                                                                              |
| Slow link (informational) | gzipped bytes at 1.6 Mbps plus the 4x CPU ready time. Not asserted: the Vite dev server cannot gzip, so a throttled dev load would measure source maps.                                                                                                                                            |

## Budgets and results

| Budget                                          | Value            | Why this number                                                                                  | Measured                                    | Status | Proposed (if missed) |
| ----------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------ | -------------------- |
| Home JS+CSS, uncompressed                       | 400 KB           | About 100 KB gzipped: under 1 s on a 1.6 Mbps link, near the HTTP Archive median for mobile JS   | 1,977 KB (655 KB gzipped)                   | MISSED | 2,372 KB interim     |
| Home requests (source tree)                     | 60               | Pages, shared modules and styles only; games load on demand (the registry's own comment says so) | 222                                         | MISSED | 270 interim          |
| Home DOMContentLoaded, 4x CPU                   | 1,500 ms         | Half of the "good" LCP allowance                                                                 | 242 ms                                      | met    |                      |
| Home LCP, 4x CPU                                | 2,500 ms         | web.dev "good" LCP                                                                               | 68 ms                                       | met    |                      |
| Home ready (ten games validated), 4x CPU        | 4,000 ms         | Start must not stay a spinner for a family on a school Chromebook                                | 693 ms                                      | met    |                      |
| Play page JS+CSS, heaviest game                 | 250 KB           | One game plus the shell: the games are 60-190 KB of source each                                  | 695 KB (math-puzzle-studio; 240 KB gzipped) | MISSED | 834 KB interim       |
| Play LCP / first round ready, 4x CPU            | 2,500 / 3,000 ms | LCP "good"; the first puzzle must be touchable within about 3 s                                  | 360 ms / 347 ms                             | met    |                      |
| Click to next paint p95, 4x CPU                 | 200 ms           | web.dev "good" INP                                                                               | 14-21 ms (all ten games)                    | met    |                      |
| Next to new round painted p95, 4x CPU           | 300 ms           | Mounts a whole stage; "needs improvement" starts at 500 ms                                       | 12-18 ms                                    | met    |                      |
| Heap retained after GC, round 14 to 30          | 3 MB             | A leak of even 100 KB a round would show within 30 rounds; measured growth is noise              | 20-61 KB                                    | met    |                      |
| DOM nodes at round 30 vs busiest of rounds 1-14 | +10%             | Rounds differ in size; unbounded growth keeps climbing                                           | 0.0% for all ten games                      | met    |                      |
| Nodes and listeners left by 30 puzzle resets    | +1%              | `mount` and `destroy` must pair                                                                  | 0.0% for all ten games                      | met    |                      |
| `makeRound` p99 (node)                          | 50 ms            | Round generation runs on the main thread between a tap and the next puzzle                       | 0.01-2.5 ms (worst: math-puzzle-studio)     | met    |                      |

## Why the three size budgets are missed (root causes, not tuning)

Measured on the home page, source bytes without source maps:

- Ten games loaded eagerly: **1,349 KB**. `home.js` calls `loadAvailable()`, which imports all ten game modules (logic, copy, ui, rounds, hints) only to run `validateGame` and decide whether a card says "Coming soon". Nothing on the home page needs a game's content.
- Fluency Lab engine pulled in by `school-tools.js`: **367 KB** on every family page, including `play.html` (problem-bank 118 KB, i18n-es 63 KB, language-terms 35 KB, tutor-engine 27 KB and about 120 KB more). The family pages import `school-tools.js` only for profile and storage helpers (`profiles`, `selectProfile`, `readLocal`, `writeLocal`), a 28 KB module that statically imports the engine.
- Family core and page code: 260 KB (home), 139 KB (play).

Fixes that would meet the budgets without touching game content (suggested, not applied; product code is out of this role):

1. Give the home page a manifest of the ten games (id, title, tagline, grade span, skill list) so it never imports game modules; load a game only on Play, and validate on the play page.
2. Move the profile and storage helpers that the family pages use into a small module that does not import `problem-bank.js` / `tutor-engine.js`. That removes 367 KB from both pages (home would be about 1.6 MB, play about 330 KB before any manifest change; with the manifest, home would be about 300 KB).
3. After 1 and 2 the heaviest play page is about 330 KB (the shell plus one game), so the 250 KB play budget would still need either lazy-loading of rarely used copy (for example `hints-b.js`, `rounds-b.js` per skill) or an honest revision to about 350 KB.

Until then the interim budgets in the table are what the product can hold today. Request count on the source tree tracks module count; a production build bundles it, so this number is a proxy for "how many files the home page touches", not a network estimate.

## Informational

- Estimated slow-link ready time (1.6 Mbps, gzipped, plus 4x CPU): home about 4.0 s, heaviest play page about 1.5 s. The home figure is dominated by the eager game loading above.
- Timings here are on localhost, so they exclude network round trips; they measure main-thread cost (parse, evaluate, render) under the CPU slowdown, which is what the 4x factor is for.
- Interaction latency is bounded by one frame (about 16 ms) in every game; the answer path (`submit`, feedback, announce, record to `localStorage`) is not a hot spot.

## Running

```sh
node tools/fm2/browser-perf.mjs                 # all ten games, 3 cold loads per page
node tools/fm2/browser-perf.mjs --games=math-market --runs=5
```

The JSON report is written to `/tmp/claude-501/fm2-shots/qa/perf-report.json`.
