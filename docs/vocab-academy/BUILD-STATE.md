# Vocabulary Academy — build state (handoff)

Written 2026-11-20 12:10 ET, after the account hit its 5-hour usage limit (resets 4:40 pm ET). Nothing is committed or deployed.

Worktree: `/Users/joelneft/wt-vocab-academy-20261120`, branch `feat/vocab-academy-20261120`, cut from `origin/main` 92326323a0.
Target app: `access-practice-lab/` (thelanguagepage.com). Contract: `docs/vocab-academy/SPEC.md`. Fixture and quality exemplar: `docs/vocab-academy/reference-unit.json`.

## Done (verified on disk)

- SPEC.md (schemas, routes, frozen APIs, file ownership), reference-unit.json, `src/vocab-academy/contract.js`, `rng.js`, `vocab-academy-tokens.css`.
- Scope for grades K, 1, 2 (`content/vocab-academy/g{K,1,2}/grade.json`): 252 headwords, 39 units. Its agent reported its own checks passed; not independently re-run.

## Agents launched and what happened

| Agent                | Owns                                                  | Status at handoff              |
| -------------------- | ----------------------------------------------------- | ------------------------------ |
| Scope K–2            | gK/g1/g2 grade.json                                   | finished                       |
| Scope 3–5            | g3–g5 grade.json                                      | launched, result not seen      |
| Scope 6–8            | g6–g8 grade.json (g6-u01 = reference unit)            | launched, result not seen      |
| Scope 9–12           | g9–g12 grade.json                                     | launched, result not seen      |
| Research             | docs research-notes / word-selection / content-qa     | launched, result not seen      |
| Core                 | routes, data, model, store, srs, student views        | launched, result not seen      |
| Activities engines   | activities/, art.js, session.js                       | launched, result not seen      |
| Lessons + assessment | lessons/, assessment.js, lesson/practice/review views | launched, result not seen      |
| Games                | games/ (10 games)                                     | launched, result not seen      |
| Word Study           | morphology.json, wordstudy/                           | launched, result not seen      |
| Teacher              | supports.js, teacher/, assign, custom units, present  | launched, result not seen      |
| Print                | print/, PDF generator                                 | launched, result not seen      |
| Validation           | validators, index builder, qa-run wiring              | FAILED (usage limit) — restart |
| Integration          | family hub, studios, progress, home, offline, docs    | FAILED (usage limit) — restart |

Agents that were still running when the limit hit may also have failed. Check each with `git status` and the files above before trusting any report.

## Not started

- Unit content for all grades (target 237 units / about 2,230 words). Plan: 23 content agents, K, 1, 2 one each; grade 3 two; grades 4–12 two each (units 1–10 and 11–20). Each writes `g<G>/u<NN>.json` to match its grade.json scope entry exactly, using the reference unit as the bar. Launch only after the scope files for all grades exist and the validator runs.
- Browser tests, print inspection, regression run, `npm run qa:fast`, final report.
- Deploy: `ALLOW_DEPLOY=1 npm run ship -- <sha>...` per CLAUDE.md. Authorized by Joel in chat. Not run.

## Resume order

1. Wait for the limit reset. Check which agents finished (`ListAgents` / their output) and which files exist.
2. Restart Validation, then Integration. Re-run any failed or empty agent with a brief that points at what already exists.
3. Confirm all 13 `grade.json` files exist and have no cross-grade duplicates.
4. Launch the content agents in waves. Run `node tools/validate-vocab-academy.mjs` after each wave.
5. Wire and test the app, run the print and browser checks, then ship.
