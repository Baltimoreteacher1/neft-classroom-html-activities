# Coherent learning journeys implementation

## Repository and baseline

- Repository: `/Users/joelneft/wt-learning-journeys`
- Branch: `feat/coherent-learning-journeys`, created from `origin/main` at `22f38ff3bf`
- Package manager: npm; root Vite application with static Fluency Lab and ACCESS Practice Lab surfaces
- Primary checks: `npm run validate:fluency`, `npm run validate:access-lab`, `npm run qa:fast`, `npm run build`
- Browser checks: Fluency Lab Playwright suites in `math/fluency-lab/*.browser.test.mjs`; ACCESS end-to-end and focused browser suites in `tools/access-*.mjs`
- Deployment is explicitly out of scope. No push, deploy command, or production mutation is permitted for this work.

## Existing product capabilities retained

The current source is substantially ahead of the initial public audit. This implementation integrates and clarifies existing systems instead of duplicating them:

- Fluency Lab already has Today’s 10, deterministic adaptive practice, misconception repair, Spot the Mistake, staged Studio hints, 96 skills, 45 games, an explicit prerequisite graph, multidimensional local evidence, teacher groups, family reporting, local backups, and a representation-based Discovery Studio.
- The Language Page already has a 12-mission Key Language Use journey, four-domain exhibition, evidence activities, sentence construction, speaking listen-back/re-record, deterministic revision feedback, Language DNA, teacher/family views, cross-origin transfer, local export/import, and offline service-worker support.
- `engine/core/instructional-intelligence.js` already provides a shared bounded evidence and instructional-decision contract. The subject-specific math tutor and language ledger remain the truth sources for their domains.
- No safe child-facing server AI path exists in this repository. Existing deterministic feedback remains the production default. Cloud AI is not introduced.

## Implementation scope

1. Make each learner shell communicate four clear destinations and one obvious continuation action while preserving every existing deep link.
2. Make The Language Page load route views on demand instead of statically importing roughly forty view modules into the entry chain.
3. Split ACCESS shell assets into a small critical cache/preload set and a background offline set. The first route becomes lighter without sacrificing eventual full offline availability.
4. Normalize Fluency Lab K–8 install metadata and strengthen its service-worker cache namespace regression contract.
5. Add explicit performance/route-loading regression tests and update navigation browser/unit tests.
6. Verify existing deterministic learning loops, local storage migrations, offline behavior, accessibility, browser rendering, and build output.

## Planned file map

- `access-practice-lab/src/main.js`: lazy route-view registry and guarded loader
- `access-practice-lab/src/nav.js`: four-destination learner navigation and active-route mapping
- `access-practice-lab/index.html`: matching no-JavaScript/boot navigation and critical stylesheet markers
- `access-practice-lab/app-shell`: generated mirror of `index.html`
- `tools/sync-access-shell.mjs`: static-chain preload calculation plus critical/background offline asset groups
- `access-practice-lab/sw.js`: generated cache lists only
- `tools/access-module-cache.test.mjs`, `tools/access-journey-pages.test.mjs`: route-splitting/cache/navigation contracts
- `math/fluency-lab/index.html`, `math/fluency-lab/hub-nav.js`: Today / Practice / Explore / My Growth navigation
- `math/fluency-lab/hub-nav.browser.test.mjs`: browser contract for the new shell
- `math/fluency-lab/manifest.json`, `math/fluency-lab/sw.js`: K–8 metadata and cache namespace contract
- focused new tests under `tools/` where static contracts are sufficient

## Acceptance criteria

- ACCESS `main.js` statically imports only the home view; all other route views use literal dynamic imports covered by the import map.
- The generated shell preloads only the static entry chain. Noncritical modules and styles are cached in the background, not placed on the critical install path.
- Deep links render the same views and keep focus restoration, error fallback, language mode, grade context, recorder shutdown, and view unmount behavior.
- Primary navigation is four learner destinations on both products; family and teacher links remain separate.
- Fluency metadata says Kindergarten–Grade 8 everywhere touched.
- Existing progress and storage keys are unchanged.
- Core features work with no cloud AI and no account.
- Relevant static, unit, Playwright, offline, accessibility, build, and change-scoped gates pass, or a concrete blocker is recorded.
