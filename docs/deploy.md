# Deploying eduwonderlab.com — Runbook

Single source of truth for how this repo goes live. The site is the
`neft-classroom-html-activities` Cloudflare Pages project with **Git
integration enabled**: a push to `main` auto-runs `npm run build` and promotes
to production in ~1–3 minutes. There is no other deploy path.

## The one command

```bash
ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]   # specific commits
ALLOW_DEPLOY=1 npm run ship -- <a>..<b>         # a commit range
ALLOW_DEPLOY=1 npm run ship -- HEAD             # current commit
```

`scripts/ship.sh` automates the entire known-good flow:

| Step                                       | What it does                                                            | Incident it prevents                                    |
| ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Stale-clone guard                          | Refuses unless `origin` is this repo                                    | Pushing from the stale EduWonderLab clone               |
| Fetch + detached worktree at `origin/main` | Never pushes your working branch or tree                                | Auto-commit automation polluting `main`; divergence     |
| Cherry-pick the named SHAs                 | `main` takes reviewed commits only                                      | Shipping half-finished concurrent work                  |
| GH007 author rewrite                       | Non-noreply author emails get `--reset-author`                          | GitHub rejecting the push (GH007)                       |
| Orphan-port cleanup (41847)                | Kills stale smoke servers first                                         | `validate:lesson-boot` 0/16 "-1 content" false failures |
| Push `HEAD:main`                           | Pre-push hook runs the full QA loop (build + validate + audit)          | Broken builds going live                                |
| Live-stamp verification                    | Polls `/access-practice-lab/config.json` until it serves the pushed SHA | Silent CF build failures; frozen production             |

Useful variants:

```bash
npm run ship -- --verify [sha]        # read-only: is production fresh? (no gate)
npm run ship -- --dry-run <sha>       # everything except the push
ALLOW_DEPLOY=1 npm run ship:rebuild   # empty commit: unfreeze a stuck CF build
```

## Rules

- **`ALLOW_DEPLOY=1` is the explicit-approval token.** Never set it unless Joel
  asked for a production deploy in the current task.
- **`npm run deploy` is a permanent hard refusal** (`scripts/guard-deploy.js`).
  A manual `wrangler pages deploy --branch=main` direct-upload PINS production
  and stops Git builds from promoting — it froze the site for 16 days
  (2026-06-18 → 07-04) and silently dropped ~625 commits. Never re-enable it.
  (`deploy:noam` is a different project and intentionally direct-uploads.)
- **Never hand-push the working branch to `main`.** The repo auto-commits
  during sessions; `main` is assembled only from cherry-picked SHAs, which
  `ship` does for you.
- **Anything imported by a build step must be in `dependencies`** (not
  `devDependencies`) — CF's production install omits dev deps, and a crashed
  build silently leaves production serving the last successful one.
- Build-time generators must be non-fatal (`try/catch` → `process.exit(0)`).

## Troubleshooting

| Symptom                                                   | Likely cause                                                   | Fix                                                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship` says "NOT confirmed live" after 12 min             | CF build failed or production frozen                           | Check the Pages build log; if code is fine, `ALLOW_DEPLOY=1 npm run ship:rebuild`                                                                 |
| Stamp commit ≠ `origin/main` HEAD long after a push       | Silent CF build failure (Pages serves last _successful_ build) | Read the build log; check for dev-dep imports in build scripts                                                                                    |
| QA loop fails on `validate:lesson-boot` with `-1 content` | Historically: concurrent runs fighting over fixed port 41847   | Fixed 2026-07-10 — the smoke test now uses an ephemeral port per run (pin with `SMOKE_PORT=<n>` if needed); a repeat failure is a real render bug |
| Cherry-pick conflict during `ship`                        | Your commit predates newer `main` work                         | Rebase your branch on `origin/main`, re-commit, ship the new SHA                                                                                  |
| Shipped an `assets/` change but the site serves old bytes | CF zone rule caches `/assets/*` for 4 h despite `_headers`     | Wait, or reference the asset with `?v=...`; verify with `?cb=`                                                                                    |
| Push rejected with GH007                                  | Private author email on a commit                               | `ship` rewrites these automatically; hand-pushes must use the noreply identity                                                                    |

## Verifying what production is actually serving

The public build stamp is ungated even with the site password:

```bash
curl "https://eduwonderlab.com/access-practice-lab/config.json?cb=$(date +%s)"
# → { "commit": "<sha>", "builtAt": "...", ... }   (written by tools/stamp-build.mjs)
```

`npm run ship:verify` polls this until it matches `origin/main` (or a SHA you
pass). The nightly route monitor (`night-shift/modules/05-route-monitor.mjs`)
also checks deploy freshness and live routes.

`workers/deploy-watch/` asks the same question every 5 minutes from a
Cloudflare Cron Trigger, and answers it at the Worker's own URL as JSON
(`{status: "ok" | "settling" | "drift" | "unknown", detail}`; HTTP 503 for the
last two, so a shell script can act on the status code alone). It exists
because it does **not** need a GitHub runner — see the next section. Deploy it
with `cd workers/deploy-watch && npx wrangler deploy`; it is read-only and
holds no state, so there is nothing to provision first.

---

## Runnerless cancels — a red X that means nothing failed

GitHub intermittently cannot hand this repo a runner. When that happens the run
is **created, queued, and cancelled at almost exactly 15:00 having executed
zero steps**. In the checks UI it is a plain red X, identical to a genuine
failure, and it will absolutely fool you. On 2026-08-06 it hit eight runs
across two workflows in one afternoon and produced two confident wrong
diagnoses — first "a GitHub incident", then "something specific to that
workflow file". It was neither: the same workflow succeeded, unchanged, on a
later dispatch.

**The tell** (check before debugging anything):

```bash
gh api repos/<owner>/<repo>/actions/runs/<run_id>/jobs \
  --jq '.jobs[] | {name, conclusion, runner_id, steps: (.steps|length)}'
```

`runner_id: 0` **and** `steps: 0` **and** ~15 minutes elapsed = the job never
started. Nothing in your code or your workflow is wrong. Re-dispatch it; do not
change the workflow. Capacity has come back within an hour every time.

`.github/workflows/retry-runnerless.yml` now does that re-dispatch
automatically for Verify Deploy and Refresh Visual Baseline. It fires only on
that exact signature — a cancelled run that *did* get a runner is a real cancel
and is deliberately left alone, because retrying it would hide the cause.

**What cannot move off Actions:** anything needing a real browser at the pinned
Chromium build (`nightly-browser-qa`, `refresh-visual-baseline`). Those must
wait for a runner. Everything that is only an HTTP request — verifying the
deploy stamp, route liveness — does not, which is what `deploy-watch` is for.
