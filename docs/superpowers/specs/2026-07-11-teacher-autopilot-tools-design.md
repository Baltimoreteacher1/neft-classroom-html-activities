# Teacher Autopilot Tools — Design (2026-07-11)

Three gold-standard tools that orchestrate existing repo infrastructure to
remove recurring school-year toil. Built on branch `feat/teacher-autopilot-tools`
off `origin/main`. Deploy via canonical `ALLOW_DEPLOY=1 npm run ship -- <sha>`.

## Tool 1 — Weekly Prep Autopilot (`npm run prep`)

**Problem:** Rebuilding a week of lessons means invoking a dozen generators by
hand, most of them all-or-nothing over all 74 lessons.

**Design:** `scripts/weekly-prep.mjs` — a single scoped orchestrator.

- Input: `--unit N --lessons A-B [--flagship] [--only step,step] [--skip step]
[--canvas] [--build] [--deploy] [--dry-run]`.
- Resolves target dirs via the canonical grammar `^(\d+)-(\d+)(-flagship)?$`.
- Runs per-lesson generators scoped to just those lessons, in dependency order:
  shells → notes → slides → worksheets → homework → docx/pdf → printables.
- Three all-or-nothing generators (slides, homework, notes) gain a **backward-
  compatible** scope filter via env `NEFT_LESSON_SCOPE` (comma ids). Unset =
  today's behavior exactly. Shared helper `scripts/lib/lesson-scope.mjs`.
- Then global aggregates once (registry, launch, curriculum manifest/search),
  optional `unit-pack N` (Canvas), optional `npm run build`, optional handoff to
  `ship.sh` (only with `--deploy` + `ALLOW_DEPLOY`).
- Per-step timing, fail-fast with clear errors, dry-run prints the plan.

## Tool 2 — Daily Do-Now → Class Board (`npm run do-now` + `/math/do-now/`)

**Problem:** No automated spaced-review warm-up; board's "now/next" is manual.

**Design:** reuse the existing `spiral-review/bank.json` (676 tagged questions)
and its spiral weighting `1 + (maxUnit-unit)*0.6`.

- `scripts/lib/spiral-node.mjs` — node-usable pick (mirrors `spiral-review/app.js`
  logic; deterministic seed option for reproducible mornings).
- `scripts/daily-do-now.mjs` — CLI: pick N questions scoped `upto:U|range:a-b|all`,
  GET current board state, set `focus.now`/`nowSub` (+ optional agenda note),
  PUT `/api/board/save?board=<section>` with `x-teacher-key`. Dry-run default;
  `--publish` to write. Reads key from env `TEACHER_KEY`/`NEFT_TEACHER_KEY`.
- `math/do-now/index.html` — self-contained live page (projector-ready): pick
  section + scope, generate, big preview, one-click **Post to Class Board**
  (reuses the existing `/api/board/save` endpoint — no new function, no board
  edits). Never stores a key in page source (localStorage prompt, like the board).

## Tool 3 — Batch Parent Updates (`npm run parent-updates` + `/teacher-tools/parent-updates/`)

**Problem:** Personalized bilingual parent notes are hand-written per student.

**Design:** join progress roster + per-standard mastery, render one bilingual
EN/ES note per student reusing the `.cols/.lang` family-letter markup and shared
`assets/family-letter.{js,css}` (lang toggle, read-aloud, glossary).

- `teacher-tools/parent-updates/index.html` — **primary live surface**, gated by
  TEACHER_KEY exactly like `teacher-tools/gradebook/`. Fetches
  `/api/progress/roster` + `/api/progress/telemetry` in-browser, computes weak
  standards (mastery bands from `engine/core/grade.js`), renders printable
  bilingual notes. **PII never leaves the browser / never written to git.**
- `scripts/parent-updates.mjs` — offline/batch CLI for the same, from a live key
  or a local JSON export/fixture; output to **gitignored** `parent-updates/output/`.
- Shared translation source: `tools/vocab-translations.json` glossary.

**Privacy invariant:** no student PII is ever committed or copied into `dist/`.
The output dir is gitignored; the live page generates client-side behind the gate.

## Discovery / organization (post-deploy)

Add a **"Teacher Toolkit"** grouping on `eduwonderlab.com/curriculum` linking the
two on-site tools (Do-Now, Parent Updates) plus a documented entry/how-to for the
CLI Weekly Prep Autopilot. Keep student-facing surfaces unchanged; toolkit entries
are teacher-oriented and consistent with existing hub styling.

## Verification

`node --check` all scripts; scoped dry-runs; `npm run build`; `npm run validate`

- relevant `audit`; live GET of board + progress health to confirm shapes. Ship
  only after QA loop (build+validate+audit via pre-push hook) is green.
