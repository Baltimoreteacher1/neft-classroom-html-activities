# Night Shift — Autonomous Overnight Ops System

**Date:** 2026-06-19
**Repo:** `neft-classroom-html-activities`
**Status:** Approved (full autonomy granted)

## Problem

Solo operation of a large classroom platform (970+ lessons, games, hubs, intervention
program). Four recurring operational fires consume disproportionate time:

1. **Regression / clobbering** — generators strip hand-maintained files; `curriculum/index.html`
   keeps getting reset; whole-site overwrite incidents; CF Git auto-deploy fights manual deploys.
2. **Deploy divergence** — local `main` diverges; automation moves refs mid-session; stray
   `.git/refs/**/* 2` files block `git fetch`.
3. **Owed visual QA** — an unguarded-DOM crash class that static validators miss (only a browser
   catches it); "visual QA owed" recurs.
4. **Bottomless content backlog** — TPT builds, worksheets, Forms, regenerations done manually.

## Goal

A scheduled, unattended system that, overnight, **protects** the repo, **QA's** it, **advances**
the backlog in isolation, and leaves a **morning briefing** — without ever auto-deploying
student-facing content.

## Architecture

A self-contained `night-shift/` toolkit. Pure Node ESM (`.mjs`), zero new runtime deps — shells
out to the existing `git` / `npm` / `npx` / `claude` CLIs already on the machine.

```
night-shift/
  config.json              # modules on/off, schedule, critical files, baseline refs, sample size
  run.mjs                  # orchestrator: runs modules, isolates failures, writes briefing
  lib/
    util.mjs               # sh(), logging, json io, git helpers
    report.mjs             # briefing builder (markdown + json)
  modules/
    01-regression-sentinel.mjs
    02-build-qa.mjs
    03-divergence-watch.mjs
    04-backlog-advancer.mjs
  backlog.json             # queue of idempotent regen tasks (+ optional claude tasks)
  briefings/               # dated briefings + latest.md + launchd.log (gitignored content)
  install/
    com.neft.nightshift.plist
    install.sh / uninstall.sh
```

### Module contract

Each module exports `async function run(ctx): Promise<ModuleResult>` where
`ModuleResult = { status: 'ok'|'warn'|'fail'|'skip', summary, details[], actions[] }`.
The orchestrator wraps every module in try/catch so one failure never aborts the run — a thrown
module is reported as `fail`, not a crashed job.

`ctx = { root, config, dryRun, log, git }`.

### Modules

1. **Regression Sentinel** — for each critical file, compares current bytes against the file's
   content at a baseline ref (`git show <ref>:<path>`). Flags deletion, >`shrinkPctThreshold`
   size drop, or loss of a required marker string. Report-only by default; `autoRestore` (off by
   default) restores from the baseline ref via `git checkout`.

2. **Build + Visual QA** — runs `npm run validate` (capturing pass/fail per validator), optionally
   `npm run build`. If Playwright is installed, smoke-loads a rotating sample of built lesson pages
   and fails on console errors (the DOM-crash class). If not installed, runs a static heuristic
   scan and **states the limitation** in the briefing rather than claiming a clean browser pass.

3. **Divergence Watch** — scans for stray macOS `* 2` / conflicted-copy refs under `.git`, runs a
   guarded `git fetch`, reports `main` ahead/behind vs `origin/main`, and flags CF-Git-vs-wrangler
   drift risk. Removes stray refs only when `autoFixStrayRefs` is on (default off — matches the
   existing warn-don't-delete detector philosophy).

4. **Backlog Advancer** — drains `backlog.json`. `regen` tasks (idempotent `npm run generate-*`)
   run in an isolated git worktree; if build+validate stay clean, commits to a branch, pushes, and
   opens a PR via `gh`. `claude` tasks (scoped headless `claude -p` runs) are gated behind
   `enableClaudeTasks` (off by default). **Never deploys.**

5. **Briefing** (in `run.mjs` + `lib/report.mjs`) — aggregates all module results into
   `briefings/YYYY-MM-DD.md` + `latest.md` + a machine-readable `latest.json`, and prints a summary
   to stdout for the launchd log.

## Scheduling

launchd job `com.neft.nightshift` runs `node night-shift/run.mjs` nightly (default 02:00),
logging to `night-shift/briefings/launchd.log`. `install.sh` loads it; `uninstall.sh` removes it.

## Safety rails

- PRs, never deploys. Student-facing site untouched by the system itself.
- Worktree isolation for all generated work.
- Destructive actions (`autoRestore`, `autoFixStrayRefs`) default **off**.
- Honors existing deploy-guard hooks and `ALLOW_DEPLOY`.
- Never operates on the stale Documents/EduWonderLab clone.
- Failures are captured as briefing data, never silent.

## npm scripts

- `night-shift` → `node night-shift/run.mjs`
- `night-shift:dry` → `node night-shift/run.mjs --dry-run`
- `night-shift:install` → `bash night-shift/install/install.sh`

## Verification

- `npm run night-shift:dry` runs end-to-end against the live repo, reports per-module results,
  writes a briefing — without mutating anything.
- Each module degrades gracefully when its tool (Playwright, gh, claude) is absent.
