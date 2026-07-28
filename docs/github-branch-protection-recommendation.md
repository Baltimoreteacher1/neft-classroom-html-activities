# GitHub Branch Protection Recommendation

Recommended target branch: `main`.

> **Not currently actionable.** Branch protection and rulesets require GitHub Pro
> for private repositories; this repo is private on the Free plan, so the API
> returns 403 and none of the settings below can be applied today. Keep this as
> the target to adopt if the account ever moves to Pro or the repo goes public.

## Required Checks

- `Pre-Deploy Gate / Validate and build` from `.github/workflows/predeploy-verify.yml`
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
