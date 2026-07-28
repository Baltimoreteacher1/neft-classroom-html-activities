# Night Shift — Autonomous Overnight Ops

A scheduled, unattended system that protects this repo, QA's it, advances the backlog, and
leaves a morning briefing — **without ever auto-deploying student content**.

Spec: `docs/superpowers/specs/2026-06-19-night-shift-ops-design.md`

## What it does each night

| Module                  | Job                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Regression Sentinel** | Diffs hand-maintained critical files vs a baseline tag; flags clobbered files. *Audits `origin/main`.*       |
| **Build + Visual QA**   | Runs validators, builds, browser-smokes a rotating lesson sample for the runtime DOM-crash class. *Audits `origin/main`.* |
| **Route Monitor**       | Probes live routes on eduwonderlab.com, including deploy freshness vs `main`.                                |
| **Lesson Render**       | Loads live lesson pages and confirms they actually render.                                                   |
| **Divergence Watch**    | Finds stray `* 2` git refs, checks `main` vs `origin`, flags CF-Git vs wrangler drift.                       |
| **Backup Sentinel**     | Fails if the newest restore-verified D1 backup is stale, unverified, or the only generation.                 |
| **Backlog Advancer**    | Runs idempotent regenerators in a worktree; if clean, opens a PR. Never deploys.                             |
| **Briefing**            | Aggregates everything into `briefings/latest.md`.                                                            |

### What gets audited, and where

The source-truth modules (Regression Sentinel, Build + Visual QA) run inside a
**clean detached worktree at `origin/main`**, never the live working tree.

This is not a detail — it is the module's correctness condition. Running them in
place meant the nightly job judged whatever branch happened to be checked out,
with whatever uncommitted edits were in flight, and reported in-progress work as
`❌ Build is broken — deploy would fail` while `origin/main` was green. Eight of
nine briefings ended in ❌ that way, which is how a monitor teaches you to stop
reading it. The briefing header now states the exact ref and SHA it judged.

If the worktree cannot be created, those modules report **inconclusive (⚠️)** —
never ❌. Unknown must not masquerade as broken.

## Use

```bash
npm run night-shift:dry      # full run, mutates nothing — read briefings/latest.md
npm run night-shift          # live run
npm run night-shift:install  # install nightly launchd job (default 02:00)
bash night-shift/install/uninstall.sh
launchctl start com.neft.nightshift   # trigger a run now
```

## Configure — `config.json`

- `modules` — toggle any module on/off.
- `regressionSentinel.baselineRef` / `criticalFiles` — what "intact" means.
- `regressionSentinel.autoRestore` — **off** by default (report-only).
- `buildQa.runBuild` / `playwrightSampleSize` — browser smoke needs `npx playwright install chromium`.
- `divergenceWatch.autoFixStrayRefs` — **off** by default (report-only).
- `backlogAdvancer.enableClaudeTasks` — **off** by default; only idempotent `regen` tasks run otherwise.
- `backupSentinel.warnAfterHours` / `failAfterHours` — backup-age thresholds (default 36h / 72h).

## Backlog — `backlog.json`

Add `regen` tasks (an existing `npm run generate-*` script) or `claude` tasks (a scoped headless
prompt). The advancer works each in an isolated worktree, verifies validators stay green, then
opens a PR for your review. Nothing is deployed.

## Safety

PRs not deploys · worktree isolation · destructive actions default off · honors deploy-guard hooks
and `ALLOW_DEPLOY` · never touches the stale Documents/EduWonderLab clone · failures become briefing
data, never silent.
