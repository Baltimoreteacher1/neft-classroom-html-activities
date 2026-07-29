# GitHub Branch Protection Recommendation

Recommended target branch: `main`.

> **Prepared but not enforceable on the current plan.** Verified again on
> 2026-07-29: both the branch-protection and rulesets APIs return 403 because
> this is a private repository on GitHub Free. The workflow still runs on every
> pull request; upgrade to GitHub Pro or make the repository public before
> enabling the required-check settings below. Do not change visibility merely
> to obtain branch protection without reviewing the classroom-content risk.

## Required Checks

- `Pre-Deploy Gate / Required quality gate` from `.github/workflows/predeploy-verify.yml`
- `Pre-Deploy Gate / Claude pre-deploy verification` from the same workflow
- `master-copy-guard` from `.github/workflows/master-copy-guard.yml` — note this
  workflow is scoped to changes touching `curriculum/index.html`, so it will not
  report on PRs that do not modify that file; do not mark it "required" without
  accounting for that.

`validate.yml` and `codex-verify.yml` were removed on 2026-07-28 (Actions-minutes
reduction — see the header comment in `predeploy-verify.yml`). Their coverage now
lives in the Pre-Deploy Gate on PRs and in the local `.git/hooks/pre-push` QA loop
on every push. Local Codex verification remains available as
`scripts/codex/codex-verify.sh`.

The required quality gate now includes the high-severity dependency audit,
Biome, all standalone unit/contract tests, repository validation, the production
build, and focused real-browser journeys. `.github/workflows/nightly-browser-qa.yml`
runs the complete Playwright suite daily; it is a monitoring check, not a
merge-blocking check.

## Activation after a plan or visibility change

1. Open **Settings → Branches → Add branch protection rule** for `main`.
2. Require a pull request before merging.
3. Require the two `Pre-Deploy Gate` checks listed above.
4. Require branches to be up to date before merging.
5. Block force pushes and branch deletion.
6. Leave deployment checks optional; Cloudflare deployment remains downstream
   of the guarded merge/ship workflow.

## Recommended Settings

- Require a pull request before merging into `main`.
- Require status checks to pass before merging.
- Require branches to be up to date before merging when practical.
- Block force pushes to `main`.
- Block branch deletion for `main`.
- Do not require deployment checks for normal PRs; deployment should remain manual.

## Why This Helps

This repo contains live classroom activity routes, generated curriculum assets, shared activity-engine components, and Cloudflare Pages deployment config. Branch protection keeps accidental regressions from reaching `main` by requiring validation, build, route/link checks, and master-copy guards before merge.

The goal is not bureaucracy. It is a quiet safety rail: student-facing pages stay reachable, teacher-facing curriculum hubs do not get overwritten, and deployable output is checked before anyone publishes.
