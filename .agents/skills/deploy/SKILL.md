---
name: deploy
description: Read before shipping this repo to production — before `npm run ship`, before `git push` to main, or when asked to deploy, ship, or release eduwonderlab.com. Covers the one allowed deploy path, the SHA rule that prevents a silent 56-file divergence, and how to confirm what is actually live.
---

# Deploying eduwonderlab.com

## The only path

```
ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]
```

`scripts/ship.sh` assembles a detached worktree at `origin/main`, cherry-picks the
SHAs you name, runs the full pre-push QA loop, pushes `HEAD:main`, and polls the
live build stamp until it reports the pushed commit. Cloudflare's Git integration
builds and promotes from that push.

**Manual `wrangler pages deploy` is forbidden and `guard-deploy.js` hard-refuses
it, even with ALLOW_DEPLOY=1.** This is not style. A direct upload PINS
production: it froze the live site for 16 days on a 2026-06-18 dist while 625
pushes to main never went live. `npm run deploy` now just prints "push to main
instead" and exits 1.

## Name EVERY sha, every time

```
git log --oneline origin/main..HEAD     # run this immediately before shipping
```

Pass every SHA it lists, in order. Confirming the branch was level with main
earlier in the session is **not** enough: subagents commit, and repo automation
pushes `main` mid-session, so the base moves under you. Shipping a child commit
without its parent produced a 56-file divergence that reverted Notice & Wonder
starters and deleted a 671-line test. The QA loop caught it; it would otherwise
have shipped silently.

If ship reports a cherry-pick conflict, check whether main already has the work
under a rewritten SHA before rebasing anything:

```
git rev-parse <local>^{tree}     # identical trees mean it is already upstream
git rev-parse <upstream>^{tree}
```

## Confirm by tree, not by smoke count

31/31 smoke checks passed against a mis-merged tree. The deployed commit's
`^{tree}` must equal your `HEAD^{tree}`.

The ungated build stamp is the truth about what is live — `_middleware.js`
leaves `*/config.json` open even with SITE_PASSWORD on:

```
npm run ship -- --verify                                  # polls it for you
curl https://eduwonderlab.com/access-practice-lab/config.json   # {commit, builtAt}
```

If `commit` ≠ `git rev-parse origin/main`, the latest Cloudflare build FAILED.
Pages keeps serving the last successful build and the deployment list does not
clearly show pass/fail. `ALLOW_DEPLOY=1 npm run ship -- --rebuild` pushes an
empty commit to unfreeze it.

## Two things that break the build only on Cloudflare

1. **Anything imported by a `npm run build` step must be in `dependencies`, not
   `devDependencies`.** CF's production install omits dev deps; a `docx` import
   in devDependencies crashed the build and froze production silently.
2. **Build-time generators must be non-fatal** (try/catch → `process.exit(0)`),
   so one failing generator cannot block the whole deploy.

## If the ship worktree fails to build

It symlinks the main checkout's `node_modules`. If that checkout is sitting on
an old branch, the shared tree can be missing a dependency current `main` needs.
Check out `origin/main` alone in the ship worktree and build: if it fails
identically with none of your commits applied, the problem is the node_modules
you lent it, not your work.
