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
| `npm run validate:reveal-math`                | Validates the Reveal Math tool launchers.                                                                                                                                                                            | Reveal Math / lesson launcher edits.                                                            |
| `npm run validate:save-resume`                | Audits Save/Resume wiring across every active activity (0 missing/duplicate/broken/unsentineled required). Part of `validate`.                                                                                       | Any change near activity state, Save, or Resume — enforced on every `validate` run.             |
| `npm run validate:ai-hub`                     | Regression guard for `curriculum/ai-hub/index.html`: inline script parses, every inline `on*` handler resolves to a defined function, the critical tutor-chat functions (`showTypingIndicator`, `startTutorChat`, `sendChatAnswer`, …) exist and are called, and no duplicate static ids. Part of `validate`. Added because concurrent rewrites twice shipped a dead tutor chat that the presence-only Playwright suite missed. | Any change to `curriculum/ai-hub/index.html`.                                                   |
| `npm run validate:injection`                  | Structural integrity for ALL sentinel injection layers (nsr/mobile-access/mwb/gfx/ghl/support-enhance/etc.): every `<family>-injected:begin/end` must balance per file. Auto-discovers families. Part of `validate`. | Any change to a `tools/inject-*` layer or bulk edit of injected pages.                          |
| `npm run validate:ccss`                       | Asserts every `standard` used by `lessons/*/config.json` exists in `data/ccss-standards.json` (the standards SoT, keyed by the 2025 MCCRS codes). Part of `validate`.                                                | Any change to lesson `standard` fields, `data/ccss-standards.json`, or a standards re-code.     |
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
| `npm run generate-support-pages`              | Generates missing family/teacher-notes/student-help pages from lesson configs (skips `<!-- hand-edited -->`).                                                                                                        | Repairing missing lesson support pages.                                                         |
| `node tools/audit-save-resume-integration.js` | Audits Save/Resume wiring across activities (same as `npm run validate:save-resume`; on failure it prints the `fix:save-resume` remediation command).                                                                | Any change near activity state, Save, or Resume.                                                |

> **Note:** This repo has **no `npm run lint` and no `npm test`** scripts. Do not
> invent them. The equivalents here are `npm run validate`, `npm run audit`, the
> Save/Resume audit, `npm run build`, and manual browser smoke tests via
> `npm run preview`. If you add a new check, document it in this table.

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
