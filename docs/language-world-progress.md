# Language World progress (continuation checkpoint, 2026-11-16)

Branch: `claude/eduwonderlab-instructional-motion-f3gdco`. Audit: `docs/language-world-audit.md`. Ledger: `docs/language-world-coverage.json`.

## Completed and verified (automated browser or unit test)

- Mission engine, 14 item kinds, deterministic dialogue machine, support ladder with fading, recommender with reasons, teacher catalog filter, family summary, teacher evidence, portfolio rows. `node --test tools/quest-engine.test.mjs`: 15 pass.
- 10 missions across all 9 worlds: Missing Prototype, City That Needs a Plan, Build the Perfect Story, Great Debate, Word Forge (3-5 and 6-8), Newsroom Investigation, Lost Compass, Bell of Port Alder, Signal from the Tower. `node tools/validate-quest.mjs` passes (schema, unique ids, original-adventure links exist on disk, no level names, no SPED labels).
- `node tools/quest-e2e.mjs`: each mission is played start to finish in Chromium (author solution, real clicks and typing); wrong sort/choice gets a hint not the answer; Finish stays disabled until the checklist is met; revision must change words; reload resumes; portfolio, family summary and teacher evidence read the run; no overflow at 1280 and 375; axe serious/critical zero on the pages it visits; reduced motion leaves no running animation. Run per mission in parallel (about 50 s each); a full serial run takes about nine minutes.
- Hub, worlds, quick practice, teacher hub, creative studio, portfolio render and pass axe.
- Wiring: route, sitemap and home registry entries, stylesheet, offline cache lists (`tools/sync-access-shell.mjs`). Biome clean on all new files.

## Repo gates run (2026-11-16)

- `npm run build`: passes; `validate:dist-file-budget`: 13,446 files, 6,554 under the Pages limit.
- `validate:quest`, `validate:no-purple`, `validate:js-syntax`, `validate:css-integrity`, `validate:gate-coverage`, `access-sitemap`, `access-home-start`, `access-move`, `validate-access-lab`, `access-lab-integrity`: pass. Biome clean on every new file.
- `npm run qa:fast` (it escalated to the broad gate): 151 of 174 passed, 12 skipped for lack of a matching browser, and 23 failed or timed out. The failures I opened are not caused by this work: `validate:save-resume` fails identically with my changes stashed (two `math/fluency-lab` pages); `access-design-system` flags `icon("book")` in `src/journey.js`; `access-acc-foundation` flags `src/class/social-teacher.js`; `telemetry-honesty` needs `sqlite3`; the fluency-lab, mentor and mystery-studio browser suites need a Playwright browser this container does not have. I did not baseline every one of the 23, so treat "unrelated" as established for the ones named here only. The quest-specific emoji findings that `access-design-system` raised were fixed.
- `data/test-reads.json` was not regenerated (`npm run test:reads` finished without updating it here). A scoped, gated `npm test` may report it stale for the two new test files; run `npm run test:reads` on a machine where it completes and commit the result.

## Implemented, not verified

- Recording inside a mission uses the lab's recorder unchanged; only the typed-rehearsal path was driven (headless has no microphone).
- Portfolio draft/revision diff view, best-work toggle, creative studio print layout, teacher guide print layout: rendered code paths exist, not browser-driven.
- Spanish mode: the hub, a mission intro and the teacher hub were rendered with `lang=es` and read correctly; mission task text stays English by design (as elsewhere in the lab). No `access-es-leak-scan` run and no native-speaker review.

## Partially implemented

- Speaking Studio 2.0: the observe, prepare, speak, review, improve flow exists as the `speak` item inside missions. The existing `/speak` studio was not rewritten.
- Grade-band coverage (see ledger `gaps`): not every world has both bands.
- Character engine: six original characters with consistent coach lines and deterministic mission dialogue. Only the Investigator has a branching interview (Mission 1); the others coach through hints, checklists and listeners.

## Blocked / not started

- Marble Builder evaluation: withmarble.com unreachable. Allow the host to continue.
- Upgrading the Language Adventures exports in place: source is not on disk.
- Cross-device portfolio storage, class-roster evidence, assignment integration: need infrastructure and a decision; left off.
- Native-speaker Spanish, WIDA-trained content review, screen-reader pass, student testing: see `human-required.md` H-12 to H-14 and H-05, H-10.

## How to continue

1. Add a mission: copy a file in `content/quest/missions/`, run `node tools/validate-quest.mjs --write`, then `node tools/quest-e2e.mjs --only <id>`. The e2e plays any valid mission without new test code.
2. Add an item kind: a renderer in `kinds-a.js` or `kinds-b.js`, a case in `itemDone` and `validateMission` (engine.js), and a branch in the e2e `playItem`.
3. After editing any shipped module or the stylesheet: `node tools/sync-access-shell.mjs`.
