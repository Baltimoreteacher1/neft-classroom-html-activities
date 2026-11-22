# Teacher upgrades, 20 November 2026

Four additions to the Language Page lab. Each is a self-contained module with its own tests, so it can be gated, changed or removed without touching the rest. None involves payments or plans.

## 1. Assignment status (class platform)

Where each learner stands on each assignment: **not started, in progress, turned in, please revise, reviewed**, with the attempt number, a late flag and a teacher comment.

- **Rules:** `shared/class-platform/assignment-lifecycle.js` (pure, tested in `tools/assignment-lifecycle.test.mjs`). A learner may start and turn in their own work, and start again while tries remain (default 3, up to 5). A teacher may review, ask for a revision, or reassign. A teacher's revision request and reassignment never use up the learner's tries.
- **Assignment options** (all optional; an old assignment behaves exactly as before): start date, due date, tries, "save as draft", and a support level. A draft or not-yet-started assignment is invisible to learners in `/info`, `/digest` and `/astatus/mine`, and cannot be started.
- **Late:** a due date means end of day anywhere in the US (34 hours after 00:00 UTC), so a learner turning work in at 8 pm in New York is never marked late. Late work is accepted and flagged, never refused.
- **Server:** `functions/_lib/class-platform/assign-status.js`, routes `/api/class/astatus/{act,mine,board,history}`. A learner reads and moves only their own rows. Tables `class_platform_astatus` and `class_platform_aevent` (schema of record `migrations/0016_class_assign_status.sql`, also created lazily like the other class tables). Rows go with the learner and with the class. Transition log is capped at 40 per learner per assignment.
- **Pages:** the learner's "Assigned practice" list shows the state, the teacher's comment and only the buttons the rules allow (`src/class/assign-status-ui.js`). The teacher's class panel gains an "Assignment status" board (review, ask to revise, reassign, history) and the assignment builder gains the options above, plus "Release to learners" for drafts.
- **Tests:** 13 rule tests, 4 button tests, 12 API tests against a real SQLite engine (authorization, isolation between learners and classes, drafts, attempts, late, comments, history cap, purge), 31 browser checks driving the real pages against the real API.
- **Not changed:** the login model (`AUTH_CONTRACT.md`). Status is practice tracking, never a grade.

## 2. Presentation mode

A **Present** button in the breadcrumb row of every lab page, for a device that last used the Teacher Hub (or `?present=1` on such a device). Hides the site header, breadcrumbs and footer, enlarges text (115% to 200%, remembered for the tab), adds a control bar (exit, smaller, larger, full screen) and leaves on Escape or when the page changes. Elements marked `data-present-hide` (teacher notes, answer keys) are hidden while presenting.

`src/present-mode.js`, `present.css`, `tools/present-mode-e2e.mjs` (33 browser checks including phone width, print and axe). "Teacher" is a per-device convenience (`src/audience.js`), not a security boundary: the mode only changes how a page is shown.

## 3. Shared support engine

`src/support-engine/engine.js`: one place that answers which scaffolds suit a support level, domain and activity, why, how they fade, and what each tool should switch on. It builds on the six Book Studio support levels and the A/B/C scaffold catalog already in the lab rather than adding a third system, and maps the same profile onto Book Studio's intensities and the class support tiers. A protected assessment withholds models, feedback loops and (for reading) read-aloud unless an accommodation keeps one. A support level is a teacher's grouping, never an official proficiency level, and can differ by domain. Assignments record a support level (`supports`). `tools/support-engine.test.mjs` (10 tests, mutation-checked).

## 4. Book Studio support editions

From a book's menu on the shelf: **Make a support edition** for one support level. The edition is a copy that keeps the story exactly as written and carries only the supports that level would be given, marked as published so they also reach a student who opens the book from a link. **Compare with the original** says whether the story text still matches and lists the supports each has. An edit that changes the story is flagged. `src/book/editions.js`, `tools/book-editions.test.mjs` (12 tests), `tools/book-editions-e2e.mjs`.

## Not built

A teacher library that follows you across devices, Language Journey additions, an owner dashboard, and applying the support engine inside Journey and Pathways. The engine is in place for them to use.
