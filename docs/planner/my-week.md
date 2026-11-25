# My Week planner (G-30)

Studio view `#/week`, API `GET /api/bcpss/week-plan`, pure logic in `shared/planner/`. Stateless: the query string is the plan
(`unit, b12, b34, b56, block, days, seed, start, cal`), so a copied link regenerates the identical plan. Nothing is stored; only
group counts are used, never a student.

## Algorithm

1. Candidate pool (`candidates.js`): the unit's lessons (`loadLessons`), the ESOL pack week sections (`esol_pack.week_plan`, each
   day's minutes split across its sections by `PACK_SECTION_WEIGHT`, summing exactly) and the Studio activities (`loadStudio`).
   Each has minutes, arc position, standards, a domain and at most one dependency (a forest): lesson n needs lesson n-1,
   pack and activity dependencies are the tables in `constants.js`.
2. Value (`solve.js`): `(100 - 60 x arc + 15 x newStandards[cap 45]) x 0.85^domainRank x bandEmphasis`, scaled x10. Lessons are the
   spine and are not domain-decayed. Minutes are scaled by the band mix (`BAND_TIME_FACTOR`, a planning assumption).
3. Knapsack: best dependency-closed set within `block x days` minutes (preorder DP: take an item or skip its whole subtree).
4. Placement: days filled in teaching order; a dependency is always earlier. If fragmentation strands an item, the budget shrinks
   by its minutes and the knapsack reruns. No day can exceed `block`; the solver throws rather than return one.
5. Everything not planned is in `dropped` with a code (`too_long`, `needs_dropped`, `low_priority`) and a reason.
6. `seed` 0 is the standard plan; another seed only changes tie-breaks. Same params give byte-identical output.

## Exports (one document model, `render.js planDoc`)

HTML (also the PDF source; the route uses Browser Rendering when bound and otherwise returns the print sheet), DOCX
(`week-plan-docx.js`), `.ics` (one all-day event per day, deterministic UIDs). Letter, 0.6in margins, no page-break elements or CSS,
navy and teal accents, paper and pencil only. `cal=1` reads the district pacing calendar (`/data/pacing-baseline-2026-27.json`)
and uses its teaching days (school days that are not testing days); without it, Monday to Friday.

## Gate

`npm run test:planner` = `tools/planner-core.test.mjs` (162 units x 3 band mixes x 3 blocks x days 1/3/5, independent checker
`shared/planner/check.js`, negative controls: overfill, silent drop, backwards, lying reasons) + `planner-export.test.mjs` +
`planner-view.test.mjs`. Exit 0 pass, 1 findings, 3 broken gate.

## Measured (4,374 plans, this repo, Node)

Median planned minutes per day 58 (p10 41, p90 89); 96-98% of the block used at every block length. Planner compute: median
0.14 ms per plan, p95 0.4 ms, max about 8 ms (unit data load not included).

## Known content note

Two existing unit titles name a physical object (`gk-math-u3` "Cube Train Spies", `g7-math-u6` "Fill the Gaps: Coin and Spinner").
The planner prints titles verbatim and never edits content; the export test ratchets this list so it can only shrink.
