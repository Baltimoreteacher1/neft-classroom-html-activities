---
description: Run this repo's Closed-Loop QA verification suite and report results
---

Run the Closed-Loop QA verification for the current changes, per `CLAUDE.md` and
`docs/closed-loop-qa-checklist.md`. Do not skip steps; loop on failures.

1. **Risk scan:** summarize what changed (`git status --short` and `git diff --stat`)
   and which activities/hubs/assets are affected.
2. **Run the strongest relevant checks** for what changed (only run what applies):
   - `npm run validate` — always, for any HTML/link/structure change. **Primary.**
   - `npm run build` — if Vite-built lesson launchers, `vite.config.js`, or
     deploy-affecting files were touched.
   - `npm run audit` — if curriculum/lesson data changed.
   - `node tools/audit-save-resume-integration.js` — if activity state, Save, or
     Resume was touched.
   If `node_modules` is missing, run `npm install` first.
3. **Failure loop:** if any check fails, summarize the failure, fix it, and
   re-run until green — or name the real external blocker.
4. **Repo-specific safety pass:** confirm HTML activities still load, shared
   `/assets/shared.css` + scripts resolve, navigation/hubs work, Save/Resume is
   intact, no Cloudflare/Pages config changed without permission, activities stay
   usable without teacher PINs, and no teacher keys/answers are exposed.
5. **Proof before handoff:** report files changed, exact commands run, pass/fail
   results, and any remaining risks or skipped checks.

Do not deploy. Do not push unless explicitly asked.
