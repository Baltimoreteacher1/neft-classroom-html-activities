---
description: Scaffold a new classroom activity folder following repo conventions
argument-hint: <folder-path> "Activity Title"
---

Create a new classroom HTML activity. Arguments: `$ARGUMENTS`
(first token = folder path like `unit-5/my-activity`, rest = human title).

Follow the repo conventions in `AGENTS.md` and the Closed-Loop QA Protocol in
`CLAUDE.md`. Specifically:

1. **Understand & Plan first** (per CLAUDE.md): restate the activity goal, confirm
   the folder path doesn't collide with an existing activity, and identify which
   hub/dashboard links should point to it.
2. **Scaffold** the folder with an `index.html` that:
   - Links the shared stylesheet `/assets/shared.css`.
   - Links shared scripts (`/assets/app.js`) the way sibling activities do —
     look at a nearby activity's `index.html` for the exact pattern, don't guess.
   - Includes a `<meta name="viewport" content="width=device-width, initial-scale=1">`.
   - Is student-facing and usable **without** a teacher PIN.
   - Exposes **no** teacher answer keys, PINs, or dashboards to students.
3. **Wire Save/Resume** if the activity has student input/state — see
   `SAVE_RESUME_SYSTEM.md` and match how existing activities integrate it.
4. **Link it** from the relevant unit/collection hub and, if appropriate, the
   root `index.html` dashboard. Keep URL paths stable.
5. **Verify** before handoff: run `npm run validate` (and
   `node tools/audit-save-resume-integration.js` if you wired Save/Resume),
   loop on any failures, then give the Proof-Before-Handoff summary
   (files changed, commands run, pass/fail, remaining risks).

Do not deploy. Do not alter Cloudflare/Pages config. Do not push unless asked.
