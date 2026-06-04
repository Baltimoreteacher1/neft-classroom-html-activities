<!--
Closed-Loop QA Protocol — see /CLAUDE.md and docs/closed-loop-qa-checklist.md.
Fill this out before requesting review or merging.
-->

## What & why
<!-- 1–3 lines: the actual goal and what this change does. -->

## Files changed
<!-- List the key files added / modified / deleted. -->

## Verification
- [ ] `npm run validate` passed
- [ ] `npm run build` passed (if Vite-built launchers / config touched)
- [ ] `npm run audit` passed (if curriculum/lesson data touched)
- [ ] `node tools/audit-save-resume-integration.js` passed (if activity state / Save / Resume touched)
- [ ] Changed activity pages load with no fatal console errors

## Classroom-safety check
- [ ] Shared assets resolve (`/assets/shared.css`, `/assets/app.js`)
- [ ] Navigation links / lesson hubs / dashboard still resolve
- [ ] Activities remain usable **without** teacher PINs (unless gating was requested)
- [ ] No teacher keys / answers / dashboards exposed to students unintentionally
- [ ] No Cloudflare/Pages config changed without permission (`_headers`, `_redirects`, `wrangler.toml`, `vite.config.js`, `404.html`, deploy workflow)

## Remaining risks / notes
<!-- Anything skipped, known-risky, or follow-up worthy. -->
