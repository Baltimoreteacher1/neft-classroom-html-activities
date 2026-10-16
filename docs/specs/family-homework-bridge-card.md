# Family homework: the "Then vs. now" bridge card

A grown-up who learned a skill one way sees the class method in their child's work and may decide one of them is wrong. The grown-up
panel on every required family homework page carries a short card that answers that first: **How you may have learned it / How we do it
in class / Why both work.**

## Where it lives

- Authored per lesson in `data/family-homework-notes/<id>.json`, key `bridge`:
  `{ "before": {en, es}, "class": {en, es}, "why": {en, es} }`.
- Rendered by `renderParentQuickCard` (scripts/homework-guided-notes.mjs) through `scripts/lib/homework-bridge.mjs`, inside a `<details>`
  in "For the grown-up helping tonight", with a Listen button. A sidecar without a complete bilingual bridge renders nothing.
- Required units: `BRIDGE_UNITS` in `scripts/lib/homework-bridge.mjs` (currently 4 and 6, Part 1, Part 2 and the 6-1/6-2 practice pages).

## Rules (enforced by `node tools/validate-family-bridge.mjs` and `tools/homework-bridge-card.test.mjs`)

1. `class` is exactly the lesson's own method. Read `lessons/<id>/config.json` (`launch.conceptIntro`), the sidecar's `conceptSteps`/`bigIdea`,
   and for a Part 2 its own `sessionTitle`; a Part 2 is a different session and gets its own card.
2. `before` names a real, common earlier-grade or home method (proportion, Keep-Change-Flip, a picture, a calculator). It never disparages it.
3. `why` gives the true reason the two agree. Do not invent math: every numeral other than 0-10 and 100 must already appear in the lesson's
   sidecar or config (the validator checks).
4. 6-45 English words and at most 55 Spanish words per row; natural Spanish, not the English copied over; no row opens with Start / Show it / Solve;
   no timer language; no line repeated between lessons.

## Extending to another unit

1. Add the unit number to `BRIDGE_UNITS`.
2. Author `bridge` in every sidecar of that unit (including `-part2`), following the rules above.
3. Run `node tools/validate-family-bridge.mjs` and `node --test tools/homework-bridge-card.test.mjs`, then
   `node scripts/generate-homework-html.mjs`. The test fails until every sidecar of the unit has a sound card and every generated page shows it.
