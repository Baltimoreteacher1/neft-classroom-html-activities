# /ship — deploy commits to production (eduwonderlab.com)

Deploy the requested commits using the guarded pipeline. Read
`docs/deploy.md` first if anything below is unclear.

Arguments: `$ARGUMENTS` (commit SHAs, a range `a..b`, or `HEAD`).

## Steps

1. **Confirm authorization.** A production deploy requires Joel's explicit
   request in the current conversation. If this `/ship` invocation itself is
   that request, proceed; otherwise stop and ask.
2. Identify the exact SHAs to ship (`git log --oneline` the candidates and show
   them). Never ship a branch wholesale — name the commits.
3. Dry-run first: `npm run ship -- --dry-run <shas>` and check the assembled
   commits look right (cherry-picks apply cleanly, nothing unexpected).
4. Deploy: `ALLOW_DEPLOY=1 npm run ship -- <shas>`. The script pushes `main`
   via a clean worktree, the pre-push QA loop gates it, and it polls the live
   build stamp until production serves the new commit.
5. Report the result: shipped SHAs, the new `main` SHA, and the LIVE
   confirmation line (or the failure + remediation the script printed).

Never run `wrangler pages deploy` or `npm run deploy` — both are blocked by
design (see `docs/deploy.md` for the 16-day production-freeze incident).
