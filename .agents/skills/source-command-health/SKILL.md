---
name: "source-command-health"
description: "Read-only repo health check — 18 verified checks in about six seconds, writes nothing"
---

# source-command-health

Use this skill when the user asks to run the migrated source command `health`.

## Command Template

Run `npm run health` and report the result.

This is the "is anything already broken before I start?" check. It is NOT the
deploy gate — `npm run qa:loop` (89 checks, ~80s, builds the site) is what
stands between a commit and production.

Every check in it was measured to write nothing: not the git tree, not
`reports/`, not `.qa-logs/`. Safe to run at any time, including on a dirty tree
or while another session is working in the repo.

If something fails:
- name the failing check and what it reported, do not summarise it away
- re-run just that one with `npm run <check-name>` to confirm
- check whether the failure predates the current work (`git stash` or compare
  against `origin/main`) before treating it as yours
- consult the `qa-gate-triage` skill — four gates in this repo have been caught
  reporting failures that were about the hour, the invocation, or the build
  state rather than the code
