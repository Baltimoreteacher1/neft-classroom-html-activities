# Maintainer checklist — adding lessons, activities, and products

Short, mechanical checklists for the three things most likely to introduce
conflicting metadata. Full context in [`architecture.md`](architecture.md).

**The one rule behind all of it:** a unit title, standard, learning target,
language objective, or product description is authored in **one** place and read
everywhere else. If you find yourself typing one into a page, stop — read it
from the registry instead.

---

## Adding a lesson

1. Create `lessons/<unit>-<lesson>/config.json` with at minimum: `lessonId`,
   `unit`, `lesson`, `title`, `standard`, `contentObjective`,
   `languageObjective`, `vocabulary`.
   - `standard` must already exist in `data/ccss-standards.json`. If it does
     not, add it there first, with its `domain`, `cluster`, `unit`, `fullText`,
     and `oldId` crosswalk.
   - `languageObjective` is **required**. `validate:registries` fails without it.
2. `npm run curriculum:rebuild` — regenerates the manifest, search index, launch
   manifest, scope-and-sequence, canonical registry, and re-validates.
3. `npm run generate-support-pages` if the lesson needs family / teacher-notes /
   student-help pages.
4. `npm run validate` — the whole suite, including
   `validate:registries`, must be green.
5. Read `reports/registry-validation.md` and confirm the new lesson appears
   under its unit with the standards you expect.

Do **not** hand-edit `data/curriculum-manifest.json` or
`data/curriculum-canonical.json`. Both are generated; your edit will be lost.

## Adding an activity that reports evidence

1. Load the shared layer on the page:
   ```html
   <script src="/shared/evidence/learning-evidence.js"></script>
   ```
2. Record what you actually know, and nothing more:
   ```js
   EWLEvidence.record({
     eventType: "assessment_scored",   // required; must be a known type
     productId: "number-realm",        // if it belongs to a portfolio product
     lessonId: "lesson-3-2",
     unitId: "unit-3",
     standardIds: ["6.AT.3"],
     score: 4,
     maxScore: 5,
   });
   ```
   Leave a field out rather than inventing a value. `null` means "not known",
   and the recommendation rules treat it that way.
3. If the activity has its own existing store and you do not want to change it,
   write a **read-only adapter** instead — see
   `shared/evidence/adapters/` for four worked examples. Encode the described
   value in the `eventId` (`nr:mastery:6.AT.1:5/7`) so re-running `sync()` is
   idempotent. `collect()` may return an array or a Promise of one; the
   Thinking Trails adapter is the async example (it reads IndexedDB).

   Three rules an adapter must follow, each of which has a test:

   - **Never write to the store you wrap.** Assert the source is byte-identical
     after a sync, the way the Number Realm adapter's test does.
   - **Never report a field the source does not actually contain.** If a record
     names a unit but not a standard, emit `unitId` and leave `standardIds`
     empty. Filling the gap with a plausible value manufactures evidence the
     student never generated, and the recommendation rules will then reason
     from it. A missing score is `null`, never `0`.
   - **Leave personal data behind.** The evidence layer derives its own
     pseudonymous learner id. Student names, ESOL levels, IEP/504 markers,
     teacher names, and raw item content must not cross into an event. Write
     the assertion — `assessment-adapter.js` enumerates its banned columns
     explicitly so a new sensitive column upstream is a visible decision.
4. If the activity has a substantial written response, use the scaffold ladder
   rather than rolling your own frames:
   ```html
   <link rel="stylesheet" href="/shared/support/scaffold-ladder.css">
   <div data-ewl-scaffold data-prompt="…" data-target="…"
        data-lesson="lesson-3-2" data-standard="6.AT.3"></div>
   <script src="/shared/support/scaffold-ladder.js" defer></script>
   ```
   The prompt and target must be the **same mathematics** at every rung. That is
   the whole contract; a test enforces it.
5. Link `/shared/support/support-profile.css` so the page honours a learner's
   saved supports.
6. `npm run validate` and, if the activity holds student work,
   `npm run validate:save-resume`.

### Resolving a standard or a legacy id

Never do the string surgery yourself:

```js
await EWLRegistry.load();
EWLRegistry.resolve("6.RP.1");    // → "6.AT.1"   (pre-2025 CCSS)
EWLRegistry.resolve("6.AT.A.1");  // → "6.AT.1"   (cluster-qualified)
EWLRegistry.resolve("/math/unit-3/"); // → "unit-3" (legacy route)
```

If an alias is missing, add it to `scripts/generate-canonical-registry.mjs` and
regenerate. Do not special-case it in a page.

## Adding a product to the portfolio

Rare — the portfolio is six products by design.

1. Add the entry to `data/product-registry.json` with **every** required field
   (see `architecture.md`).
2. `limitations` must be non-empty and honest. `manualEvidenceNeeded` is where
   you record what would need consent, translation review, or external
   validation before it could be claimed.
3. Add the id to the approved list in **three** places — this is deliberate
   friction, so a product cannot appear on a public surface by accident:
   - `EXPECTED_PRODUCT_IDS` in `tools/validate-registries.mjs`
   - `APPROVED` in `shared/portfolio/product-cards.js`
   - the `products` array in `tests/award-portfolio.spec.ts`
4. Add a walkthrough to `WALKTHROUGHS` in `shared/portfolio/judge-mode.js` and
   generate the `/judge-mode/<slug>/` page.
5. Every route you name must resolve to a real file — `validate:registries`
   checks all of them.
6. `npm run validate && npm run test && npm run e2e`.

**Do not add Monster Math Academy.** It is out of scope for this portfolio by
explicit instruction, and two validators will fail the build if it appears.

---

## Before every handoff

```bash
npm run validate    # full suite, including registries + public security
npm run test        # node assertions, including the award-portfolio suite
npm run build       # Vite production build to dist/
npm run e2e         # browser tests (needs `npx playwright install chromium`)
```

Then read `reports/registry-validation.md` — it is written on every validate run,
pass or fail, and is the fastest way to see what the registries currently
contain.

## Things that will bite you

- **Editing a generated file.** `curriculum-manifest.json`,
  `curriculum-canonical.json`, `curriculum-search-index.json`, `_redirects`,
  `_headers` are all generated. Edit the source and regenerate.
- **Restating product copy on a page.** If you write a product's tagline into
  HTML, it will drift from the registry. Use `data-ewl-products` instead.
- **Adding a support that stores a reason.** The support profile stores *what*
  a student turned on, never *why*. `BANNED_FIELDS` and two validators enforce
  it.
- **Putting real student data in a demo.** Judge mode and any public
  demonstration use `shared/portfolio/synthetic-data.js` only.
- **Adding an admin control to a public page.** `validate:public-security`
  scans every published page for ungated roster access and guards the Command
  Center remediation specifically.
- **Touching the deploy preset.** `_headers`, `_redirects`, `wrangler.toml`,
  `vite.config.js` output settings, and `404.html` are off-limits unless the
  task explicitly says otherwise.
