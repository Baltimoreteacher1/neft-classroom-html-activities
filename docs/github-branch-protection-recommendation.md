# GitHub Branch Protection Recommendation

Recommended target branch: `main`.

## Required Checks

- `Validate` from `.github/workflows/validate.yml`
- `master-copy-guard` from `.github/workflows/master-copy-guard.yml`
- `Codex Verify / Validate, build, and run Codex checks` from `.github/workflows/codex-verify.yml`

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
