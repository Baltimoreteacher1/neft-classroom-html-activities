# Repository audit — award portfolio integration

Internal maintainer document. Written from direct inspection of the repository
on 2026-07-28, before any code in this initiative was changed. It records what
was found, not what was planned.

This is a working document for maintainers. It is **not** written for public
consumption; nothing here should be lifted onto a public page without being
rewritten for that purpose.

---

## Scope exclusion

**Monster Math Academy** (`/curriculum/monster-math-academy/`) is out of scope by
explicit instruction. It was not modified, not registered, not added to any
product surface, and is not a dependency of anything built here. It remains
listed in Classroom Experiences and the Full Unit Directory exactly as before.
`tools/validate-registries.mjs` and `tools/validate-public-security.mjs` both
assert that it stays out of the portfolio and that its route stays live.

---

## 1. What is authoritative

| System | Location | Status |
| --- | --- | --- |
| Lesson data | `lessons/<id>/config.json` | **Authoritative.** 74 canonical lessons across units 1–10. Every lesson carries `standard`, `contentObjective`, `languageObjective`, `vocabulary`, `printables`, `projects`. |
| Curriculum manifest | `data/curriculum-manifest.json` | **Authoritative, generated** by `scripts/generate-curriculum-manifest.mjs` from the lesson configs. Includes an on-disk existence check per resource. |
| Standards | `data/ccss-standards.json` | **Authoritative.** 30 standards on the 2025 Maryland MCCRS codes, each with `domain`, `cluster`, `unit`, `fullText`, and an `oldId` CCSS crosswalk. |
| Unit identity | `data/curriculum-unit-identities.json` | **Authoritative** for unit titles, missions, skills, accents. |
| Routes | `data/routes.json` → generated `_redirects` / `_headers` | **Authoritative.** 18 top-level routes, 302 redirects. |
| Vocabulary + language objectives | `assets/learning-supports/manifest.json` | **Authoritative** for the 64 canonical lesson launchers; bilingual (en/es). |
| Save / Resume | `shared/save-resume/save-resume-engine.js` | **Authoritative.** Mature, audited on every `validate` run (2,306 pages). Resume codes, full state capture, optional D1 / Apps Script backends. |
| Thinking Trails evidence | `shared/evidence/evidence-layer.js` | **Authoritative** for per-session attempt/misconception capture. IndexedDB with a localStorage fallback. |
| Number Realm progress | `math-rpg/engine/profile.js` (`mrpg:hero`, v2) | **Authoritative** for hero level, gold, per-standard mastery, achievements, stats. Per-realm progress in `mrpg:unit<N>`. |
| Learning supports | `assets/learning-supports/` (`ewl-supports:v1:preferences`) | **Authoritative** for in-lesson support selection. v2 schema with 58 keys, lockstep-validated against the API allow-list. |
| Mastery + recommendations | `assets/brain/mastery-engine.js`, `recommend-engine.js` | **Authoritative** and already rules-based with human-readable reasons. |
| Portfolio | `math/projects/portfolio/` | **Authoritative** for project artifacts, stars, rubric scores, certificates. |
| Curriculum hub | `curriculum/index.html` | **Authoritative** platform surface. ~599 KB, 10 units, 1,161 lesson links, guarded by `tools/validate-curriculum-hub.mjs`. |

## 2. What is duplicated

- **Two curriculum hubs.** `/curriculum/` (canonical, decision-first) and
  `/math/` (older, unit-directory shaped) both present the ten units. `/math/`
  reads its own hard-coded markup rather than the manifest.
- **Standard code spellings.** Three in circulation: canonical `6.AT.1`,
  pre-2025 CCSS `6.RP.1`, and cluster-qualified `6.AT.A.1` (used by Number
  Realm's problem bank). Before this work each consumer did its own string
  surgery.
- **Identity keys.** At least six on-device identity keys exist:
  `nsr:identity`, `nt_student`, `nt_student_ref`, `edupulse_student_name`,
  `ewl_student_name`, `nt_class_code`. `assets/curriculum-progress-bridge.js`
  already contains a resolution ladder across them.
- **Progress surfaces.** `/math/my-progress/`, `/math/my-path/`,
  `/teacher-tools/curriculum-dashboard/`, `/teacher-tools/standards-heatmap/`,
  and `/teacher-tools/mastery/` all present overlapping mastery views.
- **Language support entry points.** `/esol/`, `/esol-reading-writing/`,
  `/esol-study-guide/`, `/esol-vocab-scrambler/`, `/wida-access/`,
  `/vocab-hub/`, `/families/`, `/curriculum/family-connections/` — all real and
  all separately discoverable, with no single door.

## 3. What conflicts

- **Number Realm's standards do not match the registry's.** The game records
  `6.AT.A.1`; the curriculum registry knows `6.AT.1`. Nothing reconciled them,
  so Number Realm mastery could not appear in any curriculum-aligned view.
- **Legacy `/math/unit-N/` pages carry their own unit copy.** Titles and skill
  lists are hard-coded there and are not read from
  `data/curriculum-unit-identities.json`, so the two can drift silently.
- **`/math/` and `/curriculum/` disagree on unit framing.** `/math/` presents
  units as a flat directory; `/curriculum/` presents the decision-first
  structure. Neither is wrong, but only one can be canonical.

## 4. What is unfinished

- `evidence/index.html` is a single page with no supporting structure.
- `shared/evidence/evidence-layer.js` is complete and well-built but is wired
  into only one demo activity (`activities/thinking-trails-evidence-demo/`).
- Family-facing language support exists in Spanish only; other home languages
  fall back to English plus read-aloud.
- `reveal-evidence-studio/` exists as a single page without integration into
  the project flow.

## 5. What can be reused (and was)

Everything listed as authoritative in §1 was reused rather than replaced. In
particular:

- The Save/Resume engine is the resume-code source for the pseudonymous learner
  id in the new evidence layer.
- `assets/design-tokens.css` supplies every colour, radius, and spacing value in
  the new shared portfolio stylesheet.
- `assets/brain/recommend-engine.js` keeps answering "what next?"; the new
  classifier answers the prior question "what kind of problem is this?" and does
  not replace it.
- The existing portfolio, projects, Math Workbench, Evidence Studio, and
  Start-Up City are linked by Design Studio, not reimplemented.
- The existing teacher tools are ordered by Teacher Studio, not rebuilt.

## 6. What requires migration

| Store | Migration |
| --- | --- |
| `ewl:evidence:v1` | New. Versioned envelope `{ v, events }`. Accepts a bare legacy array and normalizes it; refuses to downgrade a record written by a future version. |
| `ewl:support-profile:v1` | New. Seeds itself from `ewl-supports:v1:preferences`, `mw_lang`, `mw_a11y`, `pa-lang`, `ra-lang`, and the OS reduced-motion preference. The source stores are read, never written or deleted. |
| `mrpg:hero` / `mrpg:unit<N>` | **No migration.** Read-only adapter. Verified by test: the stored value is byte-identical after a sync. |
| `nsr:*` | **No migration.** Read-only. |
| Standards spellings | Handled by alias resolution in `data/curriculum-canonical.json`, not by rewriting any stored data. |

## 7. Security risks found

**The material finding** — `math/command-center/index.html`, a page published to
the production site:

1. Probed `http://localhost:3030` on every load and every 5 seconds thereafter,
   and revealed its entire admin surface to whatever answered.
2. That surface included a UI to run any npm script in `package.json`
   (`/api/run?script=…`, including `deploy`), a live stdout stream, a QA
   log-file browser (`/api/view-log?file=…`), and a bundle-size analyzer.
3. It rendered a table of **student names, class sections, and save/resume
   codes** fetched from `/api/student-progress`, with no authentication.
4. Every one of those values — including `data.branch` from the local server and
   every student field — was interpolated straight into `innerHTML`, and a log
   filename was interpolated into an inline `onclick` attribute.
5. When offline it displayed "Connecting to the local Command Center server…"
   and then instructions to run `node tools/command-center-server.mjs`, which is
   a development message with no meaning for a public visitor.

Mixed-content policy blocks an `http://` fetch from an `https://` page in a
current browser, which limits real-world exploitability on the live site. That
is a browser mitigation, not a design decision — the page still shipped a
roster-display UI and a script-execution UI on a public route, and any local
process on port 3030 could have driven the innerHTML sinks.

Lower-severity observations:

- `tools/command-center-server.mjs` validates the requested script name against
  `package.json`, so it is not arbitrary shell — but it can run `deploy`. It is
  a workstation tool and correctly never ships (`vite.config.js` skips
  `tools/`).
- `teacher-tools/neftos-command-center/` is a local-first personal planner. It
  contains no execution surface and no student data, but it is personal content
  on a public route.

## 8. What must remain backward-compatible

1. **Every public URL.** Bookmarks, printed handouts, Canvas packages, and
   student links depend on them. `data/routes.json` is load-bearing.
2. **Save/resume codes.** The code format and the `nsr:*` keys are how a student
   returns to work.
3. **The portfolio.** Existing entries must survive.
4. **`mrpg:hero`.** A student's hero is a term's worth of progress.
5. **`ewl-supports:v1:preferences`.** Assigned supports must not reset.
6. **Lesson ids (`3-1`).** Used in routes, save keys, Canvas packages, and
   printed material. Canonical ids namespace them (`lesson-3-1`) without
   changing anything that ships.
7. **The Cloudflare deployment preset.** `_headers`, `_redirects`,
   `wrangler.toml`, `vite.config.js` output settings, and `404.html` were not
   touched.

---

## Appendix — where the evidence for this audit came from

- `npm run validate` (full suite, green) run before any change, to establish the
  baseline.
- Direct reads of the files named above.
- `grep` inventory of every `localStorage` key across `math/`, `curriculum/`,
  `shared/`, `assets/`, `math-rpg/`, and `teacher-tools/`.
- Route existence checks against the filesystem for every route named in the new
  product registry.
