# Paid plans: removed from the live site, kept restorable

On 2026-11-23 the paid plans part of The Language Page (ACCESS Practice Lab) was removed at Joel's request. Joel
asked to keep it ready to deploy later. This page says what was removed and how to bring it back.

## What was removed

- `/access-practice-lab/pricing` (the Plans & School Quote page). It now opens the lab home. (`/plans` was never a
  route of its own; the app serves its shell for any path.)
- The teacher-only **Plans** button in the lab control bar.
- The free / pro / district entitlement tiers (`src/platform/entitlements/entitlementService.js`), including the
  tier switch in the diagnostics dock (Ctrl+Shift+D) and `GET /api/entitlements/status`.
- The inline "Teacher Pro" upgrade card and the printable School Quote / Purchase Order modal
  (`src/platform/components/ui.js`) and their CSS.
- The tier gating in Radar (export, roster limit, sprints), the Speaking Simulator (saved clips) and the Bridge
  (custom text). **All of these features are now open to everyone.** Before the removal the default tier was
  "pro preview", so nothing was actually locked in production.

## How to restore

Nothing was lost: the removal is one isolated commit.

- Tag `paid-plans-last-live` = the last production commit that still had plans.
- Tag `paid-plans-removed` = the removal commit.
- Branch `ready/restore-paid-plans` = a pre-built revert of the removal, verified to apply cleanly.

To bring plans back:

```sh
git fetch origin
git checkout -b restore-paid-plans origin/main
git revert paid-plans-removed          # or: git cherry-pick ready/restore-paid-plans
node tools/sync-access-shell.mjs       # regenerates index.html, app-shell and sw.js hashes
node tools/access-platform-upgrade.test.mjs
ALLOW_DEPLOY=1 npm run ship -- HEAD    # production deploy: needs Joel's go-ahead
```

If other changes have touched the same files since, the revert may need a manual merge. Re-run
`node tools/sync-access-shell.mjs` afterwards either way; it owns the hashed module lists.

Restoring also brings the feature gating back, so decide at that point which features should be free and which
paid (see `checkFeatureAccess` call sites in `radar.js`, `simulator.js` and `bridge.js`).
