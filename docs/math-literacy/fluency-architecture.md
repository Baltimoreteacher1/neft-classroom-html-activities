# Math Literacy Studio: Fluency architecture

The Math Fluency Lab (`math/fluency-lab/`, eduwonderlab.com) runs natively inside the Studio at
`/access-practice-lab/math-literacy/fluency/<grade>/<sourceId>`. The Studio imports the source's
generators, checkers, language data and model engines directly. It does not copy them and does not
read or write the source's storage. Counts below come from `docs/math-literacy/fluency-inventory.json`
(schema 1) and were recomputed from `src/mls/fluency-map.js` on 2026-11-28; the two agree.

## 1. Architecture

| Piece                 | File                                                                                                       | Job                                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inventory (generated) | `tools/mls-fluency-inventory.mjs` -> `docs/math-literacy/fluency-inventory.json`, `src/mls/fluency-map.js` | Samples the live registries (36 seeds per skill), writes the full report and the compact launch index. `--check` runs in `npm run validate:mls`.                                           |
| Map                   | `src/mls/fluency-map.js`                                                                                   | `SOURCE` rows (grade, id, prerequisites, capabilities) plus `FOR_STUDIO` desk-to-skill links. Exports `getFluencyMapping`, `fluencyForSkill`, `fluencyForGrade`, `studioSkillsForFluency`. |
| Problems              | `src/mls/fluency-problems.js`                                                                              | Wraps the source `ALL_SKILLS`, `generateProblem`, `validateAnswer`. Level 1 uses `adaptiveProblem` or a warm-up range; level 3 uses a named `STRETCH` range for 10 skills only.            |
| Player                | `src/mls/fluency-player.js` (lazy-loaded)                                                                  | Checked practice, hints (filtered by `stepLeaks`), wrong-answer feedback, Spanish/bilingual via `question-es.js`, read aloud, local learner slot, race mode.                               |
| Worked example        | `src/mls/fluency-model.js`                                                                                 | Source model frames, representation switcher, and the source engine's "Try moves on this model" build actions (guided stage).                                                              |
| Launch contract       | `src/mls/fluency-launch.js`                                                                                | Validates every URL parameter; builds return links from route data only.                                                                                                                   |
| View                  | `src/views/math-literacy-fluency.js`                                                                       | Route render/mount, skill-page panel, Kindergarten and "More skills" lists, copy/save link, family link. Wired from `src/views/math-literacy.js`.                                          |
| Resource              | `src/mls/fluency-resource.js`, `src/views/math-literacy-builder.js`                                        | `buildFluencyResource` projects the same seeded items onto Studio print blocks (type `fluency-practice`, 1-20 items, separate teacher key, strategy-explanation page).                     |
| Progress              | `src/mls/fluency-progress.js`                                                                              | Local-only state, see section 4.                                                                                                                                                           |
| Offline               | `access-practice-lab/sw.js`                                                                                | Precaches the 7 `fluency-*.js` modules and the view. `OUTSIDE` regex `^/math/fluency-lab/(?:[\w-]+/)*[\w-]+\.js$` caches source modules on demand.                                         |

**Launch/URL contract.** `fluencyLaunch(grade, sourceId, opts)` returns `null` unless grade is `0-8` and the
`(grade, id)` pair exists in the map. Unknown values fall back to defaults:

- `stage`: `model | practice | game` (default `practice`); `game` is allowed only when the skill's
  `capabilities.race` is true, otherwise it becomes `practice`.
- `support`: `more | standard | extension`. `level`: 1, 2, 3 (default 2). `lang`: `en | es | bi`.
- `seed`: 1 to 4,294,967,295, digits only, otherwise 1.
- `studio`: kept only if that desk is linked to the skill in `FOR_STUDIO`.
- `from=family` additionally requires a valid `studio`; it sets `resume:false` and `count:3`.
- Return links are `skill/<studio>?focus=<id>`, `family/<studio>`, or `teach`. A link cannot carry a URL.
- The URL never selects a learner (`learnerId` is an in-app value only).

**Race (`stage=game`).** `mountFluency` sets `racing = stage === "game"`: fixed length `CALM_PACES[0]`, no
clock, rival position from `rivalAt`, result from `winner` (all from the source `race-core.js`), and
`resume = false`, so a race writes no progress. The skill page shows "Play a math race" only when
`source.capabilities.race`; otherwise it offers the existing Studio game for that desk.

**Resource and saved recipes.** `saveLink` stores a `fluency-activity` recipe (grade, sourceId, level, support,
lang, stage, seed) in the Studio store. `savedHref` turns it back into a `/fluency/` link, and such items are
left out of the printable packet download.

## 2. Coverage (computed from the inventory)

| Measure                                | Count                                                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source skills (K-8)                    | 128 (K 9, G1 13, G2 15, G3 13, G4 15, G5 13, G6 20, G7 15, G8 15)                                                                                                          |
| Mapped to a Studio desk                | 96 skills, linked to 60 of the 85 Studio skills (98 source-to-desk links; some skills sit on several desks)                                                                |
| Supplemental, no matching Studio skill | 32 (9 Kindergarten + 23 in Grades 1-8)                                                                                                                                     |
| Kindergarten                           | 9 source skills, all supplemental. Studio's teacher grade menu covers Grades 1-8, so K is reached from `teach?grade=0`. 1 has race (`add-sub-5`), 4 have Spanish questions |
| Guided example (worked steps)          | 128 of 128 (96 mapped)                                                                                                                                                     |
| Race stop (`capabilities.race`)        | 43 skills (34 mapped, 9 unmatched, 1 of them K). On the Studio side 17 desks have a race                                                                                   |
| Spanish question translations          | 80 skills (61 mapped, 4 in K). The other 48 are English-only for items; source vocabulary is still shown                                                                   |
| Math stretch range (level 3)           | 10 skills                                                                                                                                                                  |
| Source "Build" interactive model       | 104 skills                                                                                                                                                                 |
| Generated sample                       | 4,608 cases (128 x 36 seeds), all keyed and checked                                                                                                                        |

Each of the 32 unmatched skills carries a stated `catalogOnlyReason` (for example, no Studio objective for
whole-number long division in Grade 5). They are not hidden: `extraPractice` lists them under
"More skills to practice".

## 3. What remains source-only

Compared with the module imports of `src/mls/fluency-*.js` (only `problem-bank`, `tutor-engine`
`adaptiveProblem`/`feedbackFor`, `studio/{core,engines,adaptive,eq-language}`, `race-core`, `question-es`,
`language-frames`, `language-terms`, `step-leak`) and `capabilityDecisions` in the inventory. Not ported:

- Adaptive engine state: recommendations, daily plan, mission plan, spaced-review schedule (`dueAt`, `interval`),
  mastery model and receipts, placement and diagnostic checkups, rescue, per-fact model, mistake notebook.
- Game Room, rewards, buddy, wonder city, fact trail, stickers, achievements, certificate, paper games, saved game state.
  Only the race rules for the 43 registered stops are used.
- Teacher and class tooling: assignments (`assignment-codec.js`, `ewl1|` tokens), class link/live/teacher pages, reports
  and CSV, growth log, family expedition, family reports. The Studio has its own teacher hub and family pages.
- Source language journal, writing studio, scratchpad, audio-first mode, comfort font, sound and speech queue
  (the Studio uses device speech and its own settings).
- 35 skills with authored shell investigations (`authoredShellInvestigation`).
- Source offline bundle (`math/fluency-lab/sw.js`, its own scope) and the source learner profiles (6 named profiles).
- Source-side `Build` panels other than the model "moves" in the guided example, and the other `studio/panel-*.js` flows.

## 4. Cross-domain progress limits

`eduwonderlab.com` and `thelanguagepage.com` are separate origins. The Studio is served on both, but each host has
its own `localStorage` and IndexedDB (`ACCESS_Lab_DB`), and the Studio never shares storage with
`math/fluency-lab` state (`ewl-fluency-*` localStorage keys) even on the same host.

- Studio fluency progress lives in IndexedDB `settings`, key
  `mls:fluency:v1:<learnerId>:<slot>:<grade>:<sourceId>:<seed>:<level>:<count>` (journal: `mls:fluency-journal:v1:...`),
  with the active slot (1-4) in `accessPracticeLab:v1:mls:fluency:slot`. `learnerId` is a random per-browser id.
- A learner who practiced on eduwonderlab.com sees a clean start on thelanguagepage.com and the reverse. Clearing
  site data, a private window, or a second device also starts fresh. `persistent:false` means IndexedDB is blocked
  and nothing is saved.
- "Move my progress" (`src/views/move.js`, `src/transfer.js`) does not carry fluency progress: `collectTransfer`
  reads only `localStorage` keys, and the fluency progress is in IndexedDB. The Studio file export (`exportAll`) writes
  `settings`, but `importAll` restores only `sessions`, `progress` and `recordings`. Result: a moved learner keeps
  Passport-style work but loses fluency position and explanations. This is a gap, not a choice; fix it before telling
  families that progress moves.
- Why progress stays local-only: no account or server exists for Studio learners, so any shared store would add a
  student-data pipeline. Key privacy rules: no identifiable student information in server storage, and a URL must never
  select or carry a learner. The record holds position, try count and the last 12 right/wrong outcomes, not answers.
  Cloud class sync (`/api/class`) is a separate, opt-in flow in the source and is not connected here.

## 5. Safe import of EduWonderLab progress

**Answer: No, not with the existing schemas.** Reuse of the existing backup/export formats would cover only the
validation half; the data models do not map, and the transfer path cannot reach where Studio fluency state lives.

Evidence:

- EduWonderLab backup (`math/fluency-lab/school-tools.js:66-73`, `app.js:9758-9790`, `play-backup.js`):
  `{ app: "EduWonderLab Fluency Lab", version: 2, exportedAt, grade, progress, tutor, settings, play, integrity }`.
  `parseBackup` requires `app` and `version === 2` and `tutor.version === 2`, then passes `progress` through
  `cleanProgress` (per skill key `"<grade>:<id>"`: attempts, correct, completedSets, bestStreak, guided counters,
  `lastPracticed`) and `tutor` through `sanitizeTutor` (`tutor-engine.js:594`: `records[skillKey]` with `recent[]`,
  `independentTotal`, `supportedTotal`, `dueAt`, `interval`, `masteryEvents`, ...; plus `mistakes`, `diagnostics`,
  `sessions`, `rescues`). The app caps files at 2,000,000 bytes. `integrity` is `fnv-1a-64x2`
  (`e8/data-integrity.js`): it catches accidental edits only, and anyone can re-stamp it.
- Studio transfer (`src/transfer.js`): `{ kind: "access-lab-progress", v: 1, from, at, data }` where `data` maps
  `accessPracticeLab:*` localStorage keys to strings. `importProgressData` (`src/store.js:249`) accepts only a fixed
  list of key families. `mls:fluency:*` is not one and is not in localStorage.
- Studio record (`fluency-progress.js`): a cursor into a seeded set (`index`, `tries`, `correct`, `helped`,
  `finished`, `recent`). EduWonderLab records skill-level evidence. No honest conversion exists: a skill total cannot
  say "learner is on item 4 of seed 7 at level 2", and fabricating it would misstate the learner's work.

If Joel wants this, it needs new code and a new record family, for example a read-only "prior practice" summary
per skill (attempts, correct, last practiced) shown beside the Studio's own progress. It would not create or alter
cursor state.

Validation rules a safe importer must enforce:

1. Local file or the learner's own `postMessage` from the exact `https://eduwonderlab.com` origin with
   `e.source === opener`; never a URL fetch. Reject over 2,000,000 bytes before `JSON.parse`.
2. Exact `app`, `version === 2`, `tutor.version === 2`; ignore `play`, `settings`, `integrity`, `mistakes`,
   `diagnostics`, `sessions`, `rescues`, anything unknown.
3. Keep only keys that exist in `fluency-map.js` (`getFluencyMapping(grade, id)`); drop the rest. Clamp every counter
   to the `cleanProgress` bounds, require `correct <= attempts`, truncate `lastPracticed` to a valid date.
4. Run the source cleaners (`cleanProgress`, `sanitizeTutor`) or an equivalent allow-list; never copy raw JSON into storage.
5. Preview in words and counts, write nothing until the learner confirms, and add-if-absent (Studio data wins),
   the rule `transfer.js` and `access-db.js` already use. Make the import idempotent.
6. Write to a new, versioned key family under the learner slot chosen in the UI. Do not export or write
   the source's names (`PROFILE_NAMES`) or free text such as `mistakes[].studentInput`: it can hold identifiable text.

What would be lost: the spaced-review schedule and mastery events, mistake notebook and diagnostics, rewards and
trail stars, language journal and writing folder, per-fact model, profile names and grade setting, and any ability
to resume an item or set. Only skill-level attempt totals and last-practiced dates would carry over.
