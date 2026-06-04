# Repo Audit & Safe Cleanup

**Repository:** `neft-classroom-html-activities`
**Audited:** 2026-06-03
**Branch:** `audit/safe-cleanup-20260603-1108`
**Remote:** `origin → github.com/Baltimoreteacher1/neft-classroom-html-activities`
**Scope:** Read-only audit + safe, reversible cleanup only. **No commit, no push.**

---

## Executive summary

The repository is in **good health**. Git hygiene is strong, there are **no tracked
secrets, no large binaries, no `.DS_Store`/log/temp clutter, no broken npm scripts,
and the lockfile is consistent**. `npm run build` and `npm run validate` both pass.

The only safe cleanup applied was closing a **`.gitignore` gap**: the local
`.wrangler/` cache directory (and other tool caches) were not ignored and could be
committed accidentally. Everything else was left untouched.

> **Note on diff size:** this branch was created on top of an in-progress feature
> branch (`feat/save-resume-system`), so `git status` also shows the Save/Resume
> rollout (≈979 HTML files + `shared/`, `functions/api/progress/`, `migrations/`,
> `tools/*save-resume*`, `SAVE_RESUME_SYSTEM.md`). **Those belong to the Save/Resume
> task, not this cleanup.** The _only_ file this audit changed is `.gitignore`.

---

## What was checked

| Area                                                 | Result                                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git status / untracked files                         | 990 working-tree entries — 979 are the Save/Resume feature (other task); 8 pre-existing `config.json` edits; this audit added 1 (`.gitignore`).                       |
| Branch / remotes                                     | On feature branch; `origin` HTTPS remote present; `git fetch --all --prune` OK (8 new refs).                                                                          |
| Large files (>2 MB tracked)                          | **None.**                                                                                                                                                             |
| Duplicate / conflict files                           | None. 678 `index.html` files are per-activity, not duplicates. No `*.orig`/merge-conflict files.                                                                      |
| `.DS_Store` / caches / temp / logs / build artifacts | **None tracked or present** (no `.DS_Store`, `*.log`, `*.tmp`, `*.swp`, `Thumbs.db`).                                                                                 |
| `.gitignore` gaps                                    | `.wrangler/` (present, untracked) was **not** ignored → **fixed**. Added `.vite/`, `.playwright-mcp/`, `*.local`, `Thumbs.db`, `*.swp`, `*~`.                         |
| `dist/` & `node_modules/` tracked?                   | **No** — correctly ignored (Pages builds `dist` at deploy).                                                                                                           |
| package manager / lockfile                           | `package.json` and `package-lock.json` names match; `lockfileVersion: 3`. Consistent.                                                                                 |
| Dependencies                                         | Minimal: `docx`, `vite` (dev), `@resvg/resvg-js`. No obvious warnings.                                                                                                |
| npm scripts                                          | All 13 script targets resolve to existing files. **No broken scripts.** No `test`/`lint` scripts defined.                                                             |
| Broken internal references                           | Save/Resume refs verified resolvable (`/shared/...` 200 in build). No broken-script scan flags in audited tool.                                                       |
| GitHub Actions                                       | `deploy-pages.yml` (manual `workflow_dispatch`, uses `CLOUDFLARE_API_TOKEN`/`ACCOUNT_ID` repo secrets — **no hardcoded creds**) and `patch-fix-it-gemini-prompt.yml`. |
| Deployment config                                    | `wrangler.toml` (Pages, `dist` output, KV namespace id — a non-secret resource id). `results-worker/wrangler.toml`, `*.example` templates.                            |
| Exposed secrets                                      | **None found.** OAuth reads `env.GOOGLE_CLIENT_ID` / `env.GOOGLE_CLIENT_SECRET` (binding-based). No hardcoded keys/tokens in JS/TOML/JSON. No tracked `.env`.         |
| README accuracy                                      | Mentions `npm run build` / `npm run preview` and Cloudflare Pages output. Accurate.                                                                                   |

---

## What was changed

- **`.gitignore`** — appended a “Local tool caches / build state” section:
  `.wrangler/`, `.vite/`, `.playwright-mcp/`, `*.local`, `Thumbs.db`, `*.swp`, `*~`.
  Verified `git check-ignore .wrangler` now matches. Fully reversible.

No files were deleted. No source/content/lesson files were modified by this audit.

---

## What was intentionally NOT changed

- **`.wrangler/` directory** — left on disk (it’s local wrangler state/cache; now
  ignored, so it won’t be committed). Not deleted to avoid disturbing local dev state.
- **8 pre-existing `lessons/*/config.json` edits** — already in the working tree
  before this session; not mine, not committed, left as-is.
- **Save/Resume feature files** — belong to the other task/branch.
- **No lockfile changes, no dependency installs/upgrades, no code refactors.**

---

## Risks found

- **Low:** none blocking.
- `.wrangler/` was previously committable (now mitigated).
- Pre-existing `validate:static` **warnings** (non-fatal, exit 0): a handful of files
  “missing viewport meta tag” (e.g. `vocab-hub/index.html`, some `number-system/*game`,
  `noam-school-v10/index.html`). Pre-existing, unrelated to cleanup — worth fixing for
  mobile UX but not a deployment blocker.
- No automated `test`/`lint` scripts exist; quality relies on the `validate:*` tools
  and `build`.

---

## Recommended next actions

1. Commit this `.gitignore` change (command below).
2. (Optional) Add the `viewport` meta tag to the ~8 flagged files to clear validator warnings.
3. (Optional) Consider a lightweight `lint` script (e.g. Prettier `--check`) for CI.
4. Keep deploying via the maintainer’s local `wrangler pages deploy dist` (matches the workflow comment).

---

## Validation commands run

| Command                      | Result                                                                   |
| ---------------------------- | ------------------------------------------------------------------------ |
| `git fetch --all --prune`    | OK (8 new refs)                                                          |
| `npm run build`              | **exit 0** (`✓ built in ~286ms`; `dist/shared/...` present)              |
| `npm run validate`           | **exit 0** (`Reveal Math tools validation passed`; static warnings only) |
| `git check-ignore .wrangler` | matches (now ignored)                                                    |
| `npm install` / `npm ci`     | **not run** — `node_modules` already present and lockfile consistent     |
| `npm test` / `npm run lint`  | **not defined** in `package.json`                                        |

---

## Current git status (cleanup-relevant)

This audit’s sole change:

```
 M .gitignore
```

(The remaining ~990 entries are the Save/Resume feature on the underlying branch.)

---

## Suggested commit message

For the cleanup change only (stage just `.gitignore`):

```
chore(repo): ignore local tool caches (.wrangler, .vite, .playwright-mcp, *.local)

Close a .gitignore gap so wrangler/vite/playwright local state and editor
swap files can never be committed. No source or content files changed.
```

> To keep the cleanup isolated from the Save/Resume work:
> `git add .gitignore && git commit -m "…"` (do **not** `git add -A`).
