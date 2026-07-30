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
| `npm run validate:workflow-yaml`              | Rejects duplicate keys in `.github/workflows/*.yml`, then self-tests the scanner (10 cases) so a gate that stops firing fails loudly. GitHub REFUSES to run a workflow with a duplicate key — the run is created, dies instantly, and is labelled by file path instead of workflow name, which reads like an ordinary red check. `codex-verify.yml` sat dead for 16 days that way after a second `concurrency:` block landed in aa0a0aad0. Ordinary YAML parsers cannot catch it: PyYAML and js-yaml both accept duplicates and keep the last one. Part of `validate`, and runs first (it is instant). | Any `.github/workflows/*.yml` edit.                                                              |
| `npm run validate:reveal-math`                | Validates the Reveal Math tool launchers.                                                                                                                                                                            | Reveal Math / lesson launcher edits.                                                            |
| `npm run validate:save-resume`                | Audits Save/Resume wiring across every active activity (0 missing/duplicate/broken/unsentineled required). Part of `validate`.                                                                                       | Any change near activity state, Save, or Resume — enforced on every `validate` run.             |
| `npm run validate:ai-hub`                     | Regression guard for `curriculum/ai-hub/index.html`: inline script parses, every inline `on*` handler resolves to a defined function, the critical tutor-chat functions (`showTypingIndicator`, `startTutorChat`, `sendChatAnswer`, …) exist and are called, and no duplicate static ids. Part of `validate`. Added because concurrent rewrites twice shipped a dead tutor chat that the presence-only Playwright suite missed. | Any change to `curriculum/ai-hub/index.html`.                                                   |
| `npm run validate:injection`                  | Structural integrity for ALL sentinel injection layers (nsr/mobile-access/mwb/gfx/ghl/support-enhance/etc.): every `<family>-injected:begin/end` must balance per file. Auto-discovers families. Part of `validate`. | Any change to a `tools/inject-*` layer or bulk edit of injected pages.                          |
| `npm run validate:ccss`                       | Asserts every `standard` used by `lessons/*/config.json` exists in `data/ccss-standards.json` (the standards SoT, keyed by the 2025 MCCRS codes). Part of `validate`.                                                | Any change to lesson `standard` fields, `data/ccss-standards.json`, or a standards re-code.     |
| `npm run eval:small-groups`                   | **Fleet evaluation of the 148 generated small-group/catch-up lessons.** Treats the GENERATOR as the artifact under test: sweeps every config, reports per-stratum coverage to `reports/small-group-fleet-eval.md`, and fails on the defect classes no per-file gate can see — scaffolding that coaches the wrong operation (a `×` stem told to "line up the decimal points"), hints that state the answer outright, `errorStep` out of range, and choice feedback misaligned with choices. Self-tests all six detectors before sweeping, since a gate that stops firing reports a clean fleet. Found 89 real defects on first run. Part of `validate`. | Any change to a small-group generator, `tools/lib/small-group-*`, or bulk lesson-content edits. |
| `npm run validate:math`                       | **Checks that curriculum answers are arithmetically correct**, not merely present — exact rational arithmetic over every lesson `config.json` (1,819 decidable checks). Runs its own 51-case self-test first, so a gate that stops firing fails loudly instead of reporting a clean curriculum. Undecidable shapes are skipped, never failed. Part of `validate`. | Any edit to lesson answers, generators that emit answers, or `scripts/lib/rational.mjs`. |
| `npm run validate:lesson-visuals`             | Boots every lesson in a real browser, walks all 8 phases via `rma:navigate`, and asserts each interactive visual actually RENDERED. Source gates are blind here: `mountInteractiveVisuals` stamps `data-iv-mounted` *before* running the component factory and swallows a throw with a `console.warn`, so a dead manipulative still parses, still lints, and still serves 200 — and an unknown `kind` (REGISTRY miss) renders nothing with no warning at all. Fails loudly if it finds ZERO hosts, since a probe that navigates nowhere otherwise reports a perfectly clean site. Needs a preview server: `npm run preview -- --port 4499`. Weekly in CI via Site Health, not on every push (~220 lessons × 8 phases). | After engine/renderer changes, new visual `kind`s, or anything touching `interactive-visual.js`. |
| `npm run smoke:live`                          | Post-deploy check against **production**: critical pages return 200 and look like themselves, gated surfaces still 401, shared bundles actually parse (the `game-fx.js` truncation class), and the build stamp reports the expected commit. `-- --expect <sha>` asserts the deployed commit. With `--expect`, a stale stamp is re-polled for up to 120s before failing: CF promotes across edge nodes over seconds, so a stale read right after `poll_stamp` is propagation lag, not a failed build — the two are told apart by whether it converges. A build that truly did not promote still fails, just 120s later. Run automatically at the end of `ship.sh` and weekly by Site Health. | After every deploy; when production "looks wrong" but source gates are green. |
| `npm run backup:d1`                           | Exports `neft-student-progress` (the only unrebuildable data here) and **replays the dump into SQLite to prove it restores** before accepting it. Writes to `~/neft-backups/d1/` — deliberately outside the repo, since backups hold student data and this repo auto-commits. Nightly in CI via `.github/workflows/backup-d1.yml`. | Before any D1 migration or destructive `wrangler d1 execute`; verify the nightly job is green. |
| `npm run report:usage`                        | Joins live D1 telemetry against the on-disk inventory: most-used lessons, games with recorded play, and lessons with no activity at all. Answers "what is actually used?" → `reports/usage-report.md`. | Before planning new content, and before retiring anything. |
| `npm run audit:dead-code`                     | One-pass reference graph over `assets/`, `scripts/`, `tools/`, `engine/components/`; reports unreferenced and single-referrer files with evidence. **Reports only — never deletes.** → `reports/dead-code.md`. | Debt burn-down; before adding another script that may duplicate one. |
| `npm run audit:a11y`                          | axe-core (WCAG 2.1 A/AA) + keyboard-reachability pass over the highest-traffic student pages → `reports/a11y-audit.md`. Not a CI gate — a11y findings need judgement. | Accessibility work; after changing shared chrome, focus styles, or contrast tokens. |
| `npm run fix:save-resume`                     | Idempotent, reversible injector that adds the shared Save/Resume CSS+JS to any activity missing them (`--dry-run` / `--revert` supported).                                                                           | Remediation when `validate:save-resume` reports missing refs (e.g. after regenerating lessons). |
| `npm run validate:canvas`                     | Structurally validates built Canvas Common Cartridges in `canvas-packages/` (hrefs/module refs/tokens/links resolve). `build-library-cartridge` also self-validates before shipping.                                 | Canvas export / cartridge tooling changes (see `docs/canvas-bridge.md`).                        |
| `npm run validate:canvas-coverage`            | Asserts every assignable surface (catalog activities, injectOnly pages, lesson homework) exists on disk, carries the canvas-bridge sentinel, and has a unique SCORM package slug. Part of `validate`.                | Any change to `activity-catalog.json`, `inject-canvas-bridge.js`, or the SCORM builders.        |
| `npm run validate:scorm`                      | Builds the SCORM SCO in-memory and asserts its hardening invariants are intact (cross-origin-safe API discovery, `report()` finished/started guards, `session_time`, Canvas identity, `<noscript>`), that the live `functions/_lib/scorm.js` `sco()` and CLI `tools/scorm/template/index.html.tpl` stay in lockstep, and that `functions/api/scorm.js` validates the target exists (fail-open, 404-only). Part of `validate`.                | Any change to the SCORM SCO wrapper, `/api/scorm`, or the CLI template.                          |
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
> `.qa-logs`, `coverage`) and currently runs 65 test scripts green in a few
> seconds. It is wired into `npm run validate`, so every `ship` gates on it.
> There is also `npm run check` (Biome), `npm run e2e` (Playwright), and
> `npm run qa` (check + test + e2e).
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

A repeatable, conservative build → audit → fix → retest loop, defined in
[`.claude/loop.md`](.claude/loop.md) and runnable as a slash command (`/qa-loop`).

- **How to run:** `npm run qa:loop` (or the `/qa-loop` command). It detects which
  check scripts actually exist, runs the safe ones (`build`, `validate*`,
  `audit*`, plus `lint`/`test`/`format` _if_ they ever exist), prints PASS / SKIP
  / FAIL per check, and writes a timestamped log to `.qa-logs/`. It exits non-zero
  if any available check fails. `npm run qa:danger -- "<cmd>"` checks whether a
  command is one of the blocked dangerous ones.
- **What it checks:** Vite build + the repo's `validate`/`audit` suites. It never
  runs generators or `deploy`.
- **What it refuses to do:** deploy, commit, push, force-push, delete/move lesson
  folders or routes, restructure curriculum/pages, or replace working content
  with placeholders. These are enforced by `permissions.deny` and the
  `pre-bash-guard.sh` PreToolUse hook in `.claude/settings.json`.
- **Deploy rule:** push to `main` is the only deploy path (Cloudflare Git
  integration), and `ALLOW_DEPLOY=1 npm run ship -- <sha>` is the only supported
  way to push it. **Never** run `wrangler` / `npm run deploy` manually — it is
  blocked.
- **Structure rule:** do not change curriculum / page / route / lesson-card
  structure unless Joel explicitly asks.
- **Stop rule:** stop after available checks pass (twice in a row), or when the
  same failure repeats and needs human judgment, or when the only fix left would
  be a risky structural change — then produce the final report from
  `.claude/loop.md`.
