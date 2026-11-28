# Math Literacy Studio: how to maintain it

Read `architecture.md` first (the contracts). This page is the short list of "how do I...".

## The one rule
Mathematics, language support, activity behaviour, presentation, answer validation and export formatting are separate layers. Never put a number in a template, a format file or a view. Numbers come from a problem family (`src/mls/families/*.js`) and are re-solved independently by `tools/mls-verify/*.mjs`.

## Add or change a skill
1. Skills are defined once in `access-practice-lab/content/mls/inventory.json` (id, grade, title, domain, standards, family, params, prerequisites). The validator locks the counts (it fails if any shrinks); growing is allowed. Run the lock check: `node tools/validate-mls.mjs`.
2. Author its content in `content/mls/skills/gN.json` (schema in `architecture.md`; `docs/math-literacy/skill-exemplar.json` is the quality bar). Write one skill per file under `/tmp/mls-draft/gN/<id>.json`, then `node tools/mls-merge.mjs N`.
3. `node tools/validate-mls.mjs --grade N`, then `node tools/build-mls-index.mjs` (search and the browse pages read `index.json`; never edit it by hand).
4. `node tools/mls-coverage.mjs` writes `content/mls/coverage.json`; commit it. CI (`validate:mls`) fails when it is stale.

## Add a problem family
Write `FAMILIES.<id>` in the grade-band module (`families/g12|g34|g56|g78.js`): `{ title, grades, defaults, gen(rng, params, opts), check? }`, ending in `finalize(...)` from `kit.js`. Write its solver in `tools/mls-verify/<band>.mjs` that reads only `spec`. Run `node tools/mls-verify.mjs --family <id> --seeds 200`. Document each param in the family's header comment. If the skill uses a new manipulative, add it to `MANIP_FOR_FAMILY` in `manips.js`.

## Add a resource type
Add a builder to `B` in `model.js` returning `{ title, subtitle, minutes, roles, sections, key, notes }`. Add its label and metadata to `roles.js` (`TYPE_LABEL`, `TYPE_META`) and, if it serves a role, to `ROLE_MAP`. All four exporters render blocks, so a new type needs no export work unless it needs a new block kind (then extend `export/print.js`, `docx.js`, `pptx.js`, `html.js` together and `tools/mls-export-check.mjs`).

## Add a support preset or a language band
`lang.js` (`PRESETS`, `BANDS`). Presets only set dials; every dial must keep working on its own. `tools/mls-coverage.mjs` fails if changing only the language band changes any answer.

## Visuals
`src/mls/visuals.js`: add the kind to `inventory.json` (`visualKinds`), render it, and extend `tools/mls-visuals-check.mjs`. Every visual returns `svg`, `alt` and `summary` (the summary states the real values, never a hidden one).

## Spanish
Family text carries a "not yet reviewed by a native speaker" note everywhere it appears (`SPANISH_NOTE` in `lang.js`). When a reviewer signs off, record who and when in `docs/language-page/human-required.md`, then change the note.

## Gates
`npm run validate:mls` (content schema, inventory lock, index freshness, independent answer verification, coverage report, model tests). Browser: `npm run e2e:mls`. Exports: `node tools/mls-export-check.mjs`. Interactive: `tools/mls-engines-a-check.mjs`, `mls-engines-b-check.mjs`, `mls-games-check.mjs`, `mls-manips-a-check.mjs`, `mls-manips-b-check.mjs`, `mls-visuals-check.mjs`.
