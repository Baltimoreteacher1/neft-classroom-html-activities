# Runbook: preview environments

Two ways to see a change before it reaches `main`: a local copy on your machine (`npm run dev:local`), and a
Cloudflare branch preview. Neither touches production data.

## 1. Local: `npm run dev:local`

```sh
npm run dev:local                   # site + API on http://127.0.0.1:8788, Ctrl-C to stop
npm run dev:local -- --probe        # start, smoke-probe, stop. Exit 0 pass / 1 fail / 3 could not run
npm run dev:local -- --build        # serve a full `npm run build` instead of the light assets (slow)
npm run dev:local -- --clean        # remove the preview worktree and its state
```

What it builds, and why:

| Piece | Detail |
| --- | --- |
| Worktree outside `~` | A detached `git worktree` in the OS temp folder (`<tmp>/eduwonderlab-dev-local`). Run from under your home folder, `wrangler` picks up `~/wrangler.jsonc` instead of this repo's config (the same trap `e2e:auth` has to avoid). The tool refuses a `--dir` under `~`. |
| Your changes | Uncommitted and untracked files are copied over the worktree, so you preview what is on disk. `--committed-only` or `--ref <ref>` previews a commit instead. |
| Local-only config | The worktree gets its own `wrangler.toml`: one D1 binding with a made-up id, nothing else. No KV, R2, AI, browser or service binding, so no production id is in reach. The tool also strips `CLOUDFLARE_*` variables from the child environment. |
| Local D1 | Every `migrations/*.sql`, in order, applied to a sqlite file under `<tmp>/eduwonderlab-dev-local-state/d1`. A `_dev_local_migrations` table records what ran, so a re-run applies only new files. Never `--remote`. |
| Demo data | One class created through the real API, with aliases `Star 1`..`Star 28` from `shared/fixtures` and a generated class code. No names, no student data. The code and teacher passcode are in `<state>/demo.json`. |
| Teacher pages | `SITE_PASSWORD` is a random value printed at start (any user name). `TEACHER_KEY` is random per run. |
| Light assets | Default static root: the Studio, `shared/`, the design tokens and the shared stylesheet. The API is complete. Use `--build` when you need the full site. |

Open `http://127.0.0.1:8788/bcpss-teachers/studio/#/design` for the design-system specimen.

### The probe

`--probe` first runs a negative control (the same probe against a fake server that answers wrongly must fail,
and against one that answers correctly must pass; otherwise exit 3), then checks: `/api/health`, units list and
unit detail (`tools/synthetic-check.mjs`), telemetry accepted (202) and refused (400, for a bad tier and for an
extra field), `/api/review/summary`, the seeded demo class (28 aliases), and the Studio, specimen, `ui.css` and
token files behind the teacher login.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `wrangler exited before /api/health answered` | Read `<tmp>/eduwonderlab-dev-local-state/server.log`. A port clash picks the next free port; a stale `workerd` from a killed run can hold state, so `--clean` and retry. |
| `ERR_MODULE_NOT_FOUND` in the worktree | `node_modules` is symlinked from this checkout. Run `npm ci` in this checkout first. |
| Migration error | Fix the SQL, then `--clean`. The bookkeeping row is written in the same batch as its migration. |
| First request is slow | Wrangler compiles the Functions on first hit. The probe allows 20 seconds per request. |

## 2. Cloudflare branch preview

The `neft-classroom-html-activities` Pages project has Git integration (see `docs/deploy.md`): a push to `main`
promotes to production. By Cloudflare's Pages rules a push to any other branch builds a PREVIEW deployment, at a
per-build address and a branch alias, `https://<branch>.neft-classroom-html-activities.pages.dev` (branch name
lower-cased, other characters replaced by `-`). Production stays on `main`.

Rules for this repo:

- Agents do not push. The lead or Joel pushes the branch; pushing is always a separate, asked-for step.
- Never use `wrangler pages deploy` for a preview. `scripts/guard-deploy.js` exists because a manual direct upload
  froze production for 16 days. The Git integration is the only path.
- Preview is a real deployment of unmerged code. Do not point a class at it, and do not test writes on it until the
  binding question below is answered.
- To open an old preview, use the Cloudflare dashboard (Workers & Pages, the project, Deployments, filter to
  Preview). Previews are not removed by `--clean`.

Open items to confirm in the Cloudflare dashboard before relying on previews (this repo cannot see them):

1. Settings, Bindings: whether the Preview column has its own D1 database, or inherits the production
   `neft-student-progress` binding. `wrangler.toml` has no `[env.preview]` block. If it inherits, a write made on a
   preview URL lands in production data. Treat previews as read-only until this is settled; use `dev:local` for
   anything that writes.
2. Settings, Variables and Secrets: whether Preview has `SITE_PASSWORD` and `TEACHER_KEY`. Without
   `SITE_PASSWORD` the teacher-gated routes fail closed (by design in `functions/_middleware.js`).
3. Whether preview URLs sit behind Cloudflare Access. If not, they are public to anyone with the link.

After a push, check a preview with the synthetic check (read-only GETs; production hosts are refused):

```sh
node tools/synthetic-check.mjs https://<branch>.neft-classroom-html-activities.pages.dev
```
