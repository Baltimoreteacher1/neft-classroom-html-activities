# CLAUDE.md — Repo Instructions for Claude Code

This is `neft-classroom-html-activities`, a mostly static HTML collection for Mr.
Neft's ESOL, Reading, Writing, and Math classroom activity hub. Most activities
are standalone HTML folders; the Reveal Math lesson launchers are built with Vite
so Cloudflare Pages can publish the complete `dist/` output.

For repo conventions (folder layout, naming, static-site rules, deployment
preset), also read [`AGENTS.md`](AGENTS.md). This file adds a mandatory quality
workflow that applies to **every** task.

---

## Closed-Loop QA Protocol

**Non-negotiable: do not hand back unfinished or unverified work.** On every task
in this repo, close your own feedback loop before claiming the work is complete.
Follow these stages in order.

### A. Understand

- Restate the actual goal in 1–3 lines.
- Identify the files, routes, components, scripts, or systems likely affected.
- Identify the likely failure risks **before** editing.

### B. Plan

- Create a short implementation plan before modifying files.
- Prefer minimal, targeted changes over broad rewrites.
- Preserve existing behavior unless the task explicitly requires changing it.

### C. Implement

- Make the required changes.
- Keep edits clean, readable, and maintainable.
- Avoid unrelated formatting changes or refactors.

### D. Verify

- Run the strongest relevant checks available in this repo (see
  **Verification Commands** below).
- Choose from: build, validate, audit, preview/smoke test, manual
  browser/route checks, link checks, Save/Resume integrity checks, or any
  project-specific audit script that touches what you changed.
- If no formal check covers your change, create a reasonable manual
  verification checklist and actually run through it.

### E. Failure Loop

- If any check fails, **do not stop.**
- Summarize the failure clearly.
- Fix the issue.
- Re-run the relevant check.
- Repeat until the check passes — or until genuinely blocked by a real
  external issue (e.g., missing secret, offline service), which you must
  name explicitly.

### F. Proof Before Handoff

- Before saying "done," provide:
  - **files changed**
  - **commands / checks run**
  - **pass / fail results**
  - **any remaining risks or skipped checks**
- Never claim success without verification evidence.

---

## Repo-Specific Verification Rules

For this repo, especially verify:

- **HTML activities still load correctly** — open or smoke-test changed
  `index.html` activity pages; no blank screens or console-fatal errors.
- **Shared assets/scripts are not broken** — the shared stylesheet path
  `/assets/shared.css` and shared scripts (`/assets/app.js`, vendor files,
  injectors) still resolve and load.
- **Save/Resume behavior is not accidentally removed** — see
  [`SAVE_RESUME_SYSTEM.md`](SAVE_RESUME_SYSTEM.md); run the Save/Resume audit
  when touching activities (`node tools/audit-save-resume-integration.js`).
- **Navigation links and lesson hubs still work** — root dashboard
  (`index.html`), unit/collection hubs, and internal links resolve to existing
  folders/files.
- **Cloudflare/Pages deployment assumptions are not changed without
  permission** — do not alter `_headers`, `_redirects`, `wrangler.toml`,
  `vite.config.js` output settings, `404.html`, or the deploy workflow unless
  the task explicitly asks. Preset stays: framework `None` / Vite build,
  output `dist/` (or `/` for pure static), root directory blank.
- **Student-facing activities remain usable without teacher PINs** unless the
  task explicitly requests gating.
- **No hidden teacher keys, answers, or dashboards are exposed to students**
  unless intentionally part of the task.

---

## Verification Commands

Use only commands that actually exist in `package.json` / repo tooling. Prefer
the strongest one(s) relevant to what you changed:

| Command                                       | What it does                                                                                                                                                                                                         | Use when                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run validate`                            | Runs `validate:static` + `validate:reveal-math` + `validate:hub` + `validate:curriculum-top1` + `validate:save-resume`.                                                                                              | Any HTML, link, or structure change. **Primary check.**                                         |
| `npm run validate:static`                     | Validates the static site structure/links only.                                                                                                                                                                      | Static HTML/link-only edits.                                                                    |
| `npm run validate:js-syntax`                  | Parses every shipped `.js`/`.mjs` and every inline `<script>` block (~1,000 files + ~3,100 blocks) and fails on any SyntaxError. Part of `validate`. Added after `assets/game-fx.js` shipped to production truncated mid-function: the file is one IIFE, so nothing in it ran and the FX kit was dead across ~114 games, yet only `validate:lesson-boot`'s 16-page probe happened to notice. Syntax-only by design — Biome covers style. | Any JS edit, and any bulk/injector change that rewrites script files.                            |
| `npm run validate:lesson-boot`                | Boots 16 representative pages in a real browser and asserts each one actually RENDERED. **The only member of the gate that opens a browser — so if it cannot get one, it checks nothing.** Without the pinned Chromium it now SKIPS locally (exit 0, warns) and FAILS in CI (`CI` set), because it used to exit 0 either way and print `PASS validate:lesson-boot 1.0s`, indistinguishable from 16 pages rendering. Set **`PW_CHROMIUM_PATH`** to a system Chromium when Playwright's own download is missing or version-mismatched — a real run takes ~200s, not 1s, and that time difference is the tell. It also asserts `#nt-shell-fallback` is absent: the shell guard's "This lesson is having trouble loading" card is ~1072 chars, which sailed over the old 800-char content floor, so 10 lessons showed students an error card while this probe reported 16/16. | Any engine, renderer or lesson-shell change; always with a browser available. |
| `npm run validate:workflow-yaml`              | Rejects duplicate keys in `.github/workflows/*.yml`, then self-tests the scanner (10 cases) so a gate that stops firing fails loudly. GitHub REFUSES to run a workflow with a duplicate key — the run is created, dies instantly, and is labelled by file path instead of workflow name, which reads like an ordinary red check. `codex-verify.yml` sat dead for 16 days that way after a second `concurrency:` block landed in aa0a0aad0. Ordinary YAML parsers cannot catch it: PyYAML and js-yaml both accept duplicates and keep the last one. Part of `validate`, and runs first (it is instant). | Any `.github/workflows/*.yml` edit.                                                              |
| `npm run validate:reveal-math`                | Validates the Reveal Math tool launchers.                                                                                                                                                                            | Reveal Math / lesson launcher edits.                                                            |
| `npm run validate:save-resume`                | Audits Save/Resume wiring across every active activity (0 missing/duplicate/broken/unsentineled required). Part of `validate`.                                                                                       | Any change near activity state, Save, or Resume — enforced on every `validate` run.             |
| `npm run validate:ai-hub`                     | Regression guard for `curriculum/ai-hub/index.html`: inline script parses, every inline `on*` handler resolves to a defined function, the critical tutor-chat functions (`showTypingIndicator`, `startTutorChat`, `sendChatAnswer`, …) exist and are called, and no duplicate static ids. Part of `validate`. Added because concurrent rewrites twice shipped a dead tutor chat that the presence-only Playwright suite missed. | Any change to `curriculum/ai-hub/index.html`.                                                   |
| `npm run validate:injection`                  | Structural integrity for ALL sentinel injection layers (nsr/mobile-access/mwb/gfx/ghl/support-enhance/etc.): every `<family>-injected:begin/end` must balance per file. Auto-discovers families. Part of `validate`. | Any change to a `tools/inject-*` layer or bulk edit of injected pages.                          |
| `npm run validate:ccss`                       | Asserts every `standard` used by `lessons/*/config.json` exists in `data/ccss-standards.json` (the standards SoT, keyed by the 2025 MCCRS codes). Part of `validate`.                                                | Any change to lesson `standard` fields, `data/ccss-standards.json`, or a standards re-code.     |
| `npm run validate:reveal-assets`              | Asserts every file in `lessons/*/reveal-assets/` is referenced by tracked source, and every reference resolves on disk. These images have no generator owning their lifecycle, so both directions of the desync have shipped: replacing the Notice-and-Wonder stock photos with per-lesson SVGs re-pointed the configs and left 41 superseded rasters (6.58 MB) being copied into `dist/` and served to students for nothing. It builds the reference set from **all** tracked text files, never from the owning lesson's config — the 148 generated group/catch-up lessons cite the CORE lesson's assets (`2-7-group2` → `/lessons/2-7/reveal-assets/notice-wonder.png`), so a per-lesson check reports live classroom images as garbage, and its self-test pins exactly that case. Part of `validate`. | Any change to a lesson's reveal images or to a `config.json` image reference. |
| `npm run eval:small-groups`                   | **Fleet evaluation of the 148 generated small-group/catch-up lessons.** Treats the GENERATOR as the artifact under test: sweeps every config, reports per-stratum coverage to `reports/small-group-fleet-eval.md`, and fails on the defect classes no per-file gate can see — scaffolding that coaches the wrong operation (a `×` stem told to "line up the decimal points"), hints that state the answer outright, `errorStep` out of range, and choice feedback misaligned with choices. Self-tests all six detectors before sweeping, since a gate that stops firing reports a clean fleet. Found 89 real defects on first run. Part of `validate`. | Any change to a small-group generator, `tools/lib/small-group-*`, or bulk lesson-content edits. |
| `npm run validate:math`                       | **Checks that curriculum answers are arithmetically correct**, not merely present — exact rational arithmetic over every lesson `config.json` (1,819 decidable checks). Runs its own 51-case self-test first, so a gate that stops firing fails loudly instead of reporting a clean curriculum. Undecidable shapes are skipped, never failed. Part of `validate`. | Any edit to lesson answers, generators that emit answers, or `scripts/lib/rational.mjs`. |
| `npm run validate:surface-numbers`            | Asserts every number the canonical worked example (`launch.conceptIntro.iDo`) states also appears on the three surfaces that render it — `learn.html`, `slides.html`, `printable.html`. This is the complement to `generated-pages-fresh`, which proves a page matches what its generator would write and therefore cannot see a generator that faithfully writes the WRONG thing. Compares by VALUE, so 1,344 = 1344, 78.50 = 78.5, 50% = 50, 1/2 = 0.5 and "8 in." = 8 all pass; a page printing 1334 fails. 252 comparisons, measured at ZERO false positives — the alignment audit tried three other semantic comparisons (text anchors, cross-surface answers, vocabulary terms) at 100%, ~60% and 100% false-positive rates and none of them are here. Self-tests 9 cases first. Part of `validate`. | Any change to a worked example, or to `generate-notes`/`generate-slides`/`generate-printable-lesson`. |
| `npm run validate:concept-intro`              | Asserts the Build-the-Idea worked example (`launch.conceptIntro.iDo`) stands on its own: it references no artifact the card cannot render ("the picture" — the Build card renders a title and lines, never an image), and it never asserts an area/volume unit (`158 in²`) that no given carries. Both are string facts. It deliberately does NOT check whether an example states its givens: that heuristic (numbers in the conclusion with no antecedent) flagged 18 lessons and was wrong on almost all of them, because it cannot tell an unexplained answer from an estimation check or a verification substitution. Deciding which worked examples are weak is a reading task. Self-tests 10 cases first, including two regex traps that would make the unit check silently unsatisfiable. Part of `validate`. | Any edit to `launch.conceptIntro.iDo`. |
| `npm run validate:learn-figures`             | **Proves every Learn It worked-example diagram is read from its own lesson.** `scripts/lib/learn-figures.mjs` draws the parallelogram, box, number line, grid or bar model for the problem the worked example actually solves, by strict pattern-matching over `launch.conceptIntro.iDo` (25 of 74 lessons; it draws nothing when unsure). A picture that disagrees with the paragraph is worse than no picture — a student trusts the picture — so this gate asserts every measurement the figure claims appears in the lesson text, that no measurement label prints a number the reader never saw (axis ticks are exempt: they are scale, not claims about the problem), that the SVG is balanced and carries an aria-label, and that the figure reached `learn.html`. Self-tests 11 positive and 3 negative fixtures BEFORE sweeping, and fails if the sweep finds ZERO figures, so a reader that quietly stops matching cannot report a clean curriculum. Part of `validate`. | Any change to `scripts/lib/learn-figures.mjs`, or to a lesson's `conceptIntro.iDo` wording. |
| `npm run validate:lesson-visuals`             | Boots every lesson in a real browser, walks all 8 phases via `rma:navigate`, and asserts each interactive visual actually RENDERED. Source gates are blind here: `mountInteractiveVisuals` stamps `data-iv-mounted` *before* running the component factory and swallows a throw with a `console.warn`, so a dead manipulative still parses, still lints, and still serves 200 — and an unknown `kind` (REGISTRY miss) renders nothing with no warning at all. Fails loudly if it finds ZERO hosts, since a probe that navigates nowhere otherwise reports a perfectly clean site. Needs a preview server: `npm run preview -- --port 4499`. Weekly in CI via Site Health, not on every push (~220 lessons × 8 phases). Its FIRST half is pure source analysis and needs no browser — `--static-only` runs just that, and `tools/lesson-visuals-static.test.mjs` runs it on every `npm test`, so the "registered but unrenderable" class (net-folder sat in the REGISTRY with no `buildVisual()` case, rendering a blank gap in every full lesson that authored it) can no longer wait a week to surface. | After engine/renderer changes, new visual `kind`s, or anything touching `interactive-visual.js`. |
| `npm run smoke:live`                          | Post-deploy check against **production**: critical pages return 200 and look like themselves, gated surfaces still 401, shared bundles actually parse (the `game-fx.js` truncation class), and the build stamp reports the expected commit. `-- --expect <sha>` asserts the deployed commit. With `--expect`, a stale stamp is re-polled for up to 120s before failing: CF promotes across edge nodes over seconds, so a stale read right after `poll_stamp` is propagation lag, not a failed build — the two are told apart by whether it converges. A build that truly did not promote still fails, just 120s later. Run automatically at the end of `ship.sh` and weekly by Site Health. | After every deploy; when production "looks wrong" but source gates are green. |
| `npm run backup:d1`                           | Exports `neft-student-progress` (the only unrebuildable data here) and **replays the dump into SQLite to prove it restores** before accepting it. Writes to `~/neft-backups/d1/` — deliberately outside the repo, since backups hold student data and this repo auto-commits. Nightly in CI via `.github/workflows/backup-d1.yml`. | Before any D1 migration or destructive `wrangler d1 execute`; verify the nightly job is green. |
| `npm run report:usage`                        | Joins live D1 telemetry against the on-disk inventory: most-used lessons, games with recorded play, and lessons with no activity at all. Answers "what is actually used?" → `reports/usage-report.md`. | Before planning new content, and before retiring anything. |
| `npm run audit:dead-code`                     | One-pass reference graph over `assets/`, `scripts/`, `tools/`, `engine/components/`; reports unreferenced and single-referrer files with evidence. **Reports only — never deletes.** → `reports/dead-code.md`. | Debt burn-down; before adding another script that may duplicate one. |
| `npm run audit:a11y`                          | axe-core (WCAG 2.1 A/AA) + keyboard-reachability pass over the highest-traffic student pages → `reports/a11y-audit.md`. Not a CI gate — a11y findings need judgement. | Accessibility work; after changing shared chrome, focus styles, or contrast tokens. |
| `npm run fix:save-resume`                     | Idempotent, reversible injector that adds the shared Save/Resume CSS+JS to any activity missing them (`--dry-run` / `--revert` supported).                                                                           | Remediation when `validate:save-resume` reports missing refs (e.g. after regenerating lessons). |
| `npm run validate:canvas`                     | Structurally validates built Canvas Common Cartridges in `canvas-packages/` (hrefs/module refs/tokens/links resolve). `build-library-cartridge` also self-validates before shipping.                                 | Canvas export / cartridge tooling changes (see `docs/canvas-bridge.md`).                        |
| `npm run validate:canvas-coverage`            | Asserts every assignable surface (catalog activities, injectOnly pages, lesson homework) exists on disk, carries the canvas-bridge sentinel, and has a unique SCORM package slug. Part of `validate`.                | Any change to `activity-catalog.json`, `inject-canvas-bridge.js`, or the SCORM builders.        |
| `npm run validate:downloads`                  | Gate for the bulk resource downloader. Asserts the GENERATED `data/curriculum-download-manifest.json` holds together: every resource belongs to a real unit, every `delivery:"file"` path exists and is non-empty on disk, no two entries share a ZIP path (a duplicate silently overwrites), presets select only the types they name, external/teacher-protected resources are represented as LINKS and never packaged, SCORM entries reuse the existing `/api/scorm`, every lesson in the curriculum manifest is covered, and both hub pages carry a current `?v=` content hash. Self-tests its detectors first. Part of `validate`. | Any change to the downloader, its generator, taxonomy, or the units page. |
| `npm run validate:unit-placement`             | **Which unit owns an End-of-Unit resource.** Order of authority (documented beside `CANONICAL_UNIT` in `scripts/lib/download-taxonomy.mjs`): 1. an explicit reviewed assignment; 2. the unit card in `curriculum/units/index.html` that contains the link, plus `data/curriculum-manifest.json` for lesson-scoped items; 3. the resource page's own `<h1>`/`<title>` against the CURRENT unit names — fails only on an unambiguous contradiction; 4. **the number in the path or filename is a diagnostic clue and may never fail a build.** Most unit-level assets kept their names through the 2026-08-10 Reveal-TOC renumber, so `/pre-test/unit9-review.html` is titled "Integers and Coordinate Plane" and belongs to Unit 7. An earlier pass trusted the path number, moved 29 correct placements and emptied Unit 10; `tools/unit-placement.test.mjs` pins the known cases so it cannot recur. `data/curriculum-unit-identities.json` is ALSO legacy-keyed — never use it to decide ownership. Part of `validate`. | Any edit to `curriculum/units/index.html`'s unit-resource rows, or when a resource looks like it is under the wrong unit. |
| `npm run validate:scorm`                      | Builds the SCORM SCO in-memory and asserts its hardening invariants are intact (cross-origin-safe API discovery, `report()` finished/started guards, `session_time`, Canvas identity, `<noscript>`), that the live `functions/_lib/scorm.js` `sco()` and CLI `tools/scorm/template/index.html.tpl` stay in lockstep, and that `functions/api/scorm.js` validates the target exists (fail-open, 404-only). Part of `validate`.                | Any change to the SCORM SCO wrapper, `/api/scorm`, or the CLI template.                          |
| `npm run typecheck`                           | `tsc --noEmit` with `checkJs` over `assets/`, `engine/` and `shared/`. `npm run typecheck` prints the current coverage; the ratchet test below prints the split. Files not yet clean carry a `// @ts-nocheck` marker at the top — that marker IS the debt register, and removing one is the unit of work. The marker lives in the file rather than in a tsconfig list for a reason `exclude` cannot solve: tsc follows imports regardless of `exclude`, so one un-typed file re-contaminates every clean importer, and `engine/` is an entangled import graph. `types/globals.d.ts` declares the site's `window.*` handles, without which every window property is equally unknown and nothing about them is checkable. Part of `validate`. | Any change under `assets/`, `engine/` or `shared/`; before removing a `@ts-nocheck` marker. |
| `npm run audit:duplicates`                    | Groups tracked assets by content hash and annotates each copy with how many source files reference it. Duplication alone is not the signal — a vendored library loaded from two paths is fine — so it reports the bytes held by copies **nothing** points at. On first run it found 25.4 MB held in redundant copies, 12.6 MB of which nothing referenced at all (those were removed 2026-08-01; the rest all have live references and need a routing decision, not a delete). **Reports only — never deletes.** → `reports/duplicate-assets.md`. | Debt burn-down; before adding another copy of an asset that may already exist. |
| `npm run qa:fast`                             | **The inner-loop gate.** Runs only the checks that cover what you actually changed, in parallel — a lesson `config.json` edit costs ~1s instead of the full gate. It is DEFAULT-DENY: a changed path matching no rule in `scripts/qa-run.mjs`'s `COVERAGE` table escalates to the full gate, so it can never be *less* safe than running everything, only faster when coverage is provable. Not a substitute for the push gate — `qa:loop` still runs everything. | Constantly, while building. Cheap enough that there is no reason to skip it. |
| `npm run qa:loop`                             | **The full pre-push gate** (what the `pre-push` hook runs). **48 checks**, scheduled by `scripts/qa-run.mjs`: `validate` is expanded into its members so they run concurrently, `build` is a barrier ahead of them because it rewrites the tree they read, and nothing runs twice. The old serial loop is still on disk as `npm run qa:loop:serial`. `tools/qa-run.test.mjs` (in `npm test`) reads the serial script's candidate list and fails if the parallel set ever stops covering it — a scheduler that gets fast by dropping a gate is worse than a slow one. **Wall time depends entirely on whether a browser is available: ~60s without one, ~240s with**, because `validate:lesson-boot` is the only member that opens one and it costs ~200s. That is not overhead to avoid — without a browser that check probes nothing (see its row below). | Before every push; automatically by the pre-push hook. |
| `npm run new:surface -- <slug> --title "…"`   | Scaffolds a new `/curriculum` surface **already wired**: page + scoped stylesheet + module, a real `tools/validate-<slug>.mjs` gate linked into `npm run validate`, the `data/routes.json` redirect, the hub card, and a `qa:fast` coverage rule. Every edit is anchored and additive — no file is re-serialised (`data/routes.json` is not Biome-formatted, so a `JSON.stringify` round-trip buries a 5-line change in a 97-line diff). `--dry-run` prints the plan. | Adding any new surface under `/curriculum/`. |
| `npm run build`                               | Vite production build to `dist/`.                                                                                                                                                                                    | Anything touching Vite-built lesson launchers, config, or before a deploy-affecting change.     |
| `npm run preview`                             | Serves the built `dist/` for smoke testing.                                                                                                                                                                          | Manual browser/smoke verification after a build.                                                |
| `npm run ship:verify`                         | Read-only: polls the public build stamp (`/access-practice-lab/config.json`) until production serves the expected commit (default `origin/main`).                                                                     | After any deploy, or when checking whether production is fresh vs frozen.                       |
| `npm run audit`                               | `audit-curriculum.mjs` site-wide structural audit (links/redirects/orphans).                                                                                                                                         | Curriculum/lesson data changes.                                                                 |
| `npm run generate-curriculum-manifest`        | Rebuilds `data/curriculum-manifest.json` (curriculum SoT) from lesson configs + disk checks.                                                                                                                         | After adding/removing a lesson or its resources.                                                |
| `npm run audit:curriculum`                    | `audit-curriculum-resources.mjs` per-lesson resource-completeness audit → `reports/curriculum-audit-resources.{json,md}`.                                                                                            | Checking which lessons are missing family/teacher/student/etc. resources.                       |
| `npm run curriculum:scope`                    | Regenerates `docs/standards/scope-and-sequence.md` (Unit→Lesson→Standard→Title view) from lesson configs AND validates the spine (unknown standards, duplicate `unit·lesson` slots, numbering gaps). `--check` validates without writing (CI gate); exits 1 on any error. | Any scope/sequence or standards change; quick consistency check.                                |
| `npm run validate:scope`                      | The spine doctor in `--check` mode (`curriculum-scope-sequence.mjs --check`). **Part of `validate`**, so every `validate`/`ship` fails if a lesson references an unknown standard or two lessons collide on a `unit·lesson` slot.                                       | Runs automatically on every `validate`.                                                         |
| `npm run curriculum:rebuild`                  | **Seamless one-command adapt:** regenerates curriculum manifest + search index + launch manifest + scope-and-sequence view, then runs `validate:ccss` + `audit:curriculum`. Green = curriculum is internally consistent. | After editing any lesson `config.json`, `data/ccss-standards.json`, or applying a standards crosswalk. See [`docs/standards/msde-standards-change-runbook.md`](docs/standards/msde-standards-change-runbook.md). |
| `npm run generate-support-pages`              | Generates missing family/teacher-notes/student-help pages from lesson configs (skips `<!-- hand-edited -->`).                                                                                                        | Repairing missing lesson support pages.                                                         |
| `node tools/audit-save-resume-integration.js` | Audits Save/Resume wiring across activities (same as `npm run validate:save-resume`; on failure it prints the `fix:save-resume` remediation command).                                                                | Any change near activity state, Save, or Resume.                                                |

> **Note:** `npm test` **does exist** — `node tools/run-tests.mjs`, which walks
> the repo for `*.test.{mjs,cjs,js}` (ignoring `node_modules`, `dist`, `.git`,
> `.qa-logs`, `coverage`) and runs 127 test scripts green in a few
> seconds (count as of 2026-08-05 — check `npm test` rather than trusting this
> number, which is the mistake this note exists to warn about; it had drifted
> from 108 to 127 before anyone re-read it). Several of those are RATCHETS rather than ordinary tests — they pin a
> number so a regression cannot be absorbed silently, and each one's failure
> message tells you exactly what to do:
> `tools/lint-coverage.test.mjs` (every shipped script must be visible to Biome),
> `tools/typecheck-ratchet.test.mjs` (the `@ts-nocheck` count may only shrink),
> `tools/curriculum-hub-assets.test.mjs` (the hub's extracted assets are stamped
> with their own content hash, so editing one without bumping `?v=` fails here
> instead of in a classroom), `tools/headers-rules.test.mjs` (no two `_headers`
> rules that can match one URL may set the same header — Pages JOINS them),
> `tools/redirects-shadowing.test.mjs` (no `_redirects` rule may be unreachable),
> `tools/build-injectors-idempotent.test.mjs` (`npm run build` must not modify
> committed source), `tools/a11y-coverage.test.mjs` (the a11y sample must cover
> every page template), `functions/api-contract.test.mjs` (a new `/api`
> endpoint must use the shared handler in `functions/_lib/http.js`), and
> `tools/curriculum-json-cache.test.mjs` (every hub feature script that reads a
> shared `/data` manifest must go through `window.NTJsonCache`, and the hub must
> load it first — seven scripts each fetching the same two manifests is what put
> `/curriculum/` over its 60-request perf budget, and no per-file check can see
> it because each of those files is individually correct). It is wired into `npm run validate`, so every `ship` gates on it.
> `npm run check` (Biome: lint **+ formatting**) is a member of the `qa:loop`
> gate — it replaced `npm run lint` there on 2026-08-05, because `lint` alone
> says nothing about formatting, so the only thing checking it was the PR-only
> Pre-Deploy Gate. Deploys here go straight to `main` via `npm run ship`, which
> opens no PR, so 32 format errors banked up on `main` with every local gate
> green. `check` is a strict superset of `lint` and writes nothing, so the loop
> stays read-only. There is also `npm run e2e` (Playwright) and `npm run qa`
> (check + test + e2e).
>
> This note previously claimed the repo had no `npm test` and told agents not to
> invent one. That was wrong, and the cost was concrete: `assets/game-score.test.mjs`
> describes itself as guarding the counting contract that had already silently
> corrupted every accuracy figure on the site once — and because the doc said the
> runner did not exist, nobody checked `package.json`, so the test was never put
> in front of a deploy. **Verify a claim like this against `package.json` before
> repeating it.** If you add a new check, document it in this table.

If `node_modules` is missing, run `npm ci` first (or `npm install` if no
lockfile match), then run the checks.

---

## Hard Constraints

- **Deployment (as of 2026-06-08): push to `main` is the SINGLE deploy path.**
  The `neft-classroom-html-activities` Pages project (serving `eduwonderlab.com`)
  has Cloudflare Git integration **enabled** — production branch `main`, preview
  branches disabled. A push to `main` auto-runs `npm run build` (Vite) and
  promotes to production in ~1-2 min.
  - **Canonical deploy command: `ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]`**
    (`scripts/ship.sh`). It automates the entire known-good flow: stale-clone
    guard → fetch → clean detached worktree at `origin/main` → cherry-pick the
    named commits → rewrite private author emails (GH007) → push `main` (the
    pre-push QA loop gates it) → poll the public build stamp
    (`/access-practice-lab/config.json`) until production serves the new commit.
    `npm run ship:verify` is the read-only freshness check;
    `ALLOW_DEPLOY=1 npm run ship:rebuild` pushes an empty commit to unfreeze a
    stuck Pages build. Never assemble `main` by hand-pushing the working branch —
    the repo auto-commits during sessions, so `main` takes cherry-picked SHAs only.
    Full runbook + troubleshooting: [`docs/deploy.md`](docs/deploy.md).
  - **Do NOT run `wrangler pages deploy` manually.** Mixing manual wrangler with
    Git auto-deploy is what historically caused the site to "revert to an old
    version" (competing builds racing to production). One path only: `git push`.
  - Because CF rebuilds from committed source, **any change must be committed and
    pushed to `main` to go live** — an uncommitted or feature-branch change will
    not deploy, and will be reverted on the next `main` rebuild.
  - To add content: drop a self-contained top-level folder (`my-thing/index.html`
    - assets), commit, push. `vite.config.js` `copyStandaloneHtml()` copies every
      top-level dir into `dist/` except reserved names (engine, lessons, scripts,
      docs, node_modules, dist, dot-dirs); `.md` files are stripped.
- **Do NOT change the site structure or routes.** Routes are defined by
  `data/routes.json` → generated `_redirects`/`_headers`. Folder layout and URL
  paths are load-bearing (bookmarks, student links, save/resume keys). Edit
  content in place; do not move/rename/delete folders or restructure routes
  unless the task explicitly requires it.
- Do **not** push to GitHub or open a PR unless explicitly asked.
- Do **not** make broad, unrelated changes.
- Do **not** bypass permissions.
- Keep the repo a static-first, Cloudflare Pages-compatible, classroom-safe site.

See [`docs/closed-loop-qa-checklist.md`](docs/closed-loop-qa-checklist.md) for the
fill-in checklist to run before every handoff.

---

## Automated QA Loop

A repeatable, conservative build → audit → fix → retest loop, defined by
[`scripts/qa-run.mjs`](scripts/qa-run.mjs) (parallel scheduler, the default) and
[`scripts/qa-loop.sh`](scripts/qa-loop.sh) (the serial original, kept as
`npm run qa:loop:serial` and read by `tools/qa-run.test.mjs` as the coverage
ratchet).

- **How to run:** `npm run qa:loop`. The serial script detects which check
  scripts actually exist, runs the safe ones (`build`, `check`, `test`,
  `validate*`, `audit*`), prints PASS / SKIP / FAIL per check, and writes a
  timestamped log to `.qa-logs/`. It exits non-zero if any available check
  fails. `npm run qa:danger -- "<cmd>"` checks whether a command is one of the
  blocked dangerous ones (`scripts/check-dangerous-commands.sh`; exit 2 =
  blocked). The slash commands that exist are `/qa-check`, `/new-activity` and
  `/ship` — see `.claude/commands/`.
- **What it checks:** Vite build + the repo's `validate`/`audit` suites. It never
  runs generators or `deploy`.
- **What it refuses to do:** deploy, commit, push, force-push, delete/move lesson
  folders or routes, restructure curriculum/pages, or replace working content
  with placeholders. These are enforced by `permissions.deny` in
  `.claude/settings.json` — 11 rules covering `wrangler deploy`, `npm run
  deploy`, force-push, `git reset --hard`, `git clean -fd` and `rm -rf` — and,
  since 2026-08-06, by the `pre-bash-guard.sh` PreToolUse/Bash hook, which is
  now written, wired and verified running (see the note under **Stop rule**).
  `npm run qa:danger` runs the same checks on a command by hand.
- **Deploy rule:** push to `main` is the only deploy path (Cloudflare Git
  integration), and `ALLOW_DEPLOY=1 npm run ship -- <sha>` is the only supported
  way to push it. **Never** run `wrangler` / `npm run deploy` manually — it is
  blocked.
- **Structure rule:** do not change curriculum / page / route / lesson-card
  structure unless Joel explicitly asks.
- **Stop rule:** stop after available checks pass (twice in a row), or when the
  same failure repeats and needs human judgment, or when the only fix left would
  be a risky structural change — then produce the final report described in
  [`docs/closed-loop-qa-checklist.md`](docs/closed-loop-qa-checklist.md).

> **Hooks — what is actually wired.** `.claude/settings.json` declares two:
> `SessionStart → .claude/hooks/session-start.sh` and `PreToolUse(Bash) →
> .claude/hooks/pre-bash-guard.sh`. Both scripts exist and both were verified by
> execution, not by reading the config.
>
> History worth keeping: the config once declared three hooks whose scripts did
> not exist. A hook pointing at a missing script does not announce itself — it
> simply never runs — so the repo documented three safety behaviours that were
> not happening, and the dead declarations were removed on 2026-08-05. The Bash
> guard was then written for real and wired on 2026-08-06, after
> `git update-ref -d refs/heads/<x>` was found to delete a branch straight past
> the `git branch -D` entry in `permissions.deny`. **Verify a hook by running
> it** (`echo '{"tool_input":{"command":"…"}}' | bash .claude/hooks/pre-bash-guard.sh`;
> exit 2 means blocked), never by trusting this file.
>
> The guard delegates to `scripts/check-dangerous-commands.sh`, which is tracked
> and covered by `scripts/check-dangerous-commands.test.mjs` — that test pins
> both halves, what must block AND what must stay allowed, because the first
> attempt at the ref-deletion rules also blocked the safe `git branch -d`.
>
> **Resolved 2026-08-09.** This used to read: "`.claude/` is excluded via
> `.git/info/exclude`, so the hook scripts and `settings.json` hook block are
> machine-local — a fresh clone gets the blocklist script and its test but not
> the wiring. Re-add the `PreToolUse` block after cloning."
>
> Half of that had stopped being true, in the worse direction. `.gitignore`
> un-ignores `.claude/settings.json` and `.claude/hooks/`, so the **wiring** was
> tracked while `pre-bash-guard.sh` was **not** — a fresh clone got a
> `PreToolUse` hook pointing at a missing script. That is exactly the failure
> described two paragraphs up, and this file asserted "both scripts exist" while
> it was happening. Reading could never have caught it: a hook that never runs
> looks identical to a hook that allows everything.
>
> `pre-bash-guard.sh` is now committed, so the wiring resolves on a fresh clone.
> `npm run validate:graph` checks every hook command in `settings.json` against
> the filesystem, so the next time config and repo disagree it fails a build
> instead of silently disarming the guard. Still verify by running it, never by
> trusting this file.
