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

| Command                                       | What it does                                                                                                              | Use when                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run validate`                            | Runs `validate:static` + `validate:reveal-math` (link/structure checks).                                                  | Any HTML, link, or structure change. **Primary check.**                                     |
| `npm run validate:static`                     | Validates the static site structure/links only.                                                                           | Static HTML/link-only edits.                                                                |
| `npm run validate:reveal-math`                | Validates the Reveal Math tool launchers.                                                                                 | Reveal Math / lesson launcher edits.                                                        |
| `npm run build`                               | Vite production build to `dist/`.                                                                                         | Anything touching Vite-built lesson launchers, config, or before a deploy-affecting change. |
| `npm run preview`                             | Serves the built `dist/` for smoke testing.                                                                               | Manual browser/smoke verification after a build.                                            |
| `npm run audit`                               | `audit-curriculum.mjs` site-wide structural audit (links/redirects/orphans).                                              | Curriculum/lesson data changes.                                                             |
| `npm run generate-curriculum-manifest`        | Rebuilds `data/curriculum-manifest.json` (curriculum SoT) from lesson configs + disk checks.                              | After adding/removing a lesson or its resources.                                            |
| `npm run audit:curriculum`                    | `audit-curriculum-resources.mjs` per-lesson resource-completeness audit → `reports/curriculum-audit-resources.{json,md}`. | Checking which lessons are missing family/teacher/student/etc. resources.                   |
| `npm run generate-support-pages`              | Generates missing family/teacher-notes/student-help pages from lesson configs (skips `<!-- hand-edited -->`).             | Repairing missing lesson support pages.                                                     |
| `node tools/audit-save-resume-integration.js` | Audits Save/Resume wiring across activities.                                                                              | Any change near activity state, Save, or Resume.                                            |

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
