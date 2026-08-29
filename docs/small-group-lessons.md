# Small-Group & Catch-Up Lessons

Differentiated, publisher-grade pull-out lessons that live **under each base
lesson** in the curriculum dropdown. Three variants, one dedicated compact
renderer — deliberately different in **style, design, and function** from the
full 5-phase lessons.

| Variant                     | Dir suffix    | Who                      | Focus                                                            |
| --------------------------- | ------------- | ------------------------ | ---------------------------------------------------------------- |
| **Group 1 — Extra Support** | `N-M-group1`  | Students struggling      | Re-teach + heavily scaffolded practice (word bank, guided steps) |
| **Group 2 — Challenge**     | `N-M-group2`  | Students who get it      | Extension, justification, harder cases                           |
| **Catch-Up**                | `N-M-catchup` | Missed a band of lessons | Big-ideas review across the band                                 |

84 base lessons → **168** small-group + **36** catch-up lessons (204 studio pages).
84 base lessons → **168** small-group (84 Group 1 + 84 Group 2) + **36** catch-up
lessons. Every one of the 204 carries `worksheet.html`, `worksheet-2.html`, a
continuation **Practice Set** (`practice.html` + key — catch-ups since
2026-08-29) and `homework.docx`.

## Experience (Studio 5 — tabbed)

`engine/core/small-group-renderer.js` (`bootSmallGroup(config)`) renders a
color-coded studio — support = blue, challenge = amber, catch-up = teal — as a
hero, a readiness pulse, and **three tabs**, each a chip strip of sub-steps
with one moment on screen at a time (position saved per student):

1. **Focus & Learn** — 🔑 Key Words (cloze, EN/ES/VI/AR lanes) → 🧱 Build the
   Idea (I-do → We-do stage cards, Explore Lab) → 📝 Worked Model.
2. **Practice Studio** — 🤝 Guided (adaptive coach) → ✏️ On My Own (notebook-
   first cards; two misses open the guidance) → 🗣️ Talk It Out (Group 1 and
   catch-up: consensus lab).
3. **Check & Growth** — ✅ Check (exit ticket; Math Check lab on Group 2) →
   💭 Reflect → 📈 Grow (mastery ladder, success-criteria self-check) →
   🚀 Mission (Apply, Go Deeper).

Around the tabs: progress meter + streak, station timer, Math Move of the Day,
tool drawer, Focus Mode, save/resume, print-expands-everything, Student
Passport XP. Teacher mode (`?teacher=1`, served by
`functions/teacher-small-group/`) adds the evidence console, misconception
card, rhythm coach and the printable facilitation plan.

Telemetry (2026-08-29): every tab and sub-step arrival posts a name-free
`sg_step_view` (class section only, same rule as the evidence summary) so
`npm run report:usage` can show where a group stops.

### Built-in classroom layers (shared shell)
`tools/lib/compact-shell.mjs` mounts, on every variant:

- **Math Workbench** launcher (bottom-right button)
- **Learning-Supports** dock (highlighter, directions, organizer, adaptations)
- **Save/Resume** (multi-day, sentineled — passes the save-resume audit)

The compact **renderer** (`small-group-renderer.js`), not the shell, adds:

- **Print / save as PDF** button (print-optimized CSS), in the footer for
  everyone.
- **Download for Canvas (SCORM)** (`/api/scorm?activity=<id>`) and the
  **Worksheet + keys (A/B)** link — both **teacher-mode only** (the worksheet
  bundles answer-key pages).

## Generators (source of truth — GENERATED, don't hand-edit)

- `tools/generate-small-group-lessons.mjs` → 168 configs + shells + `small-group-rows.json`
- `tools/generate-catchup-lessons.mjs` → 20 compact catch-up configs + `catchup-rows.json`
- `tools/splice-small-group-curriculum.mjs` → inserts the two indented dropdown
  entries under each parent lesson (order: Lesson → Group 1 → Group 2 → Catch-Up)

### Regeneration flow (order matters)

```
node tools/generate-small-group-lessons.mjs
node tools/generate-catchup-lessons.mjs
node tools/splice-small-group-curriculum.mjs   # idempotent; hub CSS + entries
npm run inject:uifr                             # stamp the new lessons (required by validate:uifr)
npm run build && npm run validate
```

The shell adds save/resume + supports + workbench itself; only the **UIFR**
stamp comes from an injector (idempotent — touches only unstamped lessons).

## Publisher-grade wave (2026-07-23)

Shared-engine upgrades — land on all 148 lessons with no regeneration:

- **Mastery bands + rubric** (`small-group-rubric.js`): session evidence →
  approaching/meeting/exceeding band on the Evidence Card, console, and
  telemetry; a 4-point analytic rubric folds in under every open-response
  prompt (config may override rows via `config.rubric`).
- **Teacher evidence sync**: the completion telemetry now carries attempts,
  misses, hints, best streak, adaptive path, and band; a mid-rotation
  `checkpoint` ping fires when guided practice lands. The Facilitation Console
  shows live this-device stats and an aggregate, name-free class view from
  `GET /api/progress/small-group-summary?lesson=<base>` (counts/averages only).
- **Standards as text** (`small-group-standards.js`): the hero's "Full
  objectives" fold and the teacher studio guide show the full MCCRS wording
  from `data/ccss-standards.json`, not just the code badge.
- **Worksheets surfaced**: teacher-mode footer links each lesson's
  `worksheet.html` (Level 0 + parallel forms A/B + labeled answer keys).
- **Practice Set (the continuation)**: `practice.html` +
  `practice-answer-key.html`, generated by `npm run generate-sg-practice` and
  linked from the curriculum hub beside each group's worksheet, one per level.
  It is deliberately NOT a second worksheet — `generate-worksheets.mjs` prints
  the lesson's `practice.*` tiers, so this reads only the pools that generator
  leaves alone (`launch.conceptIntro`, `warmup.questions`, `connect.check`,
  `explore.discourse`, `turnAndTalk`, `vocabulary[].cloze`,
  `reflect.exitTicket`): the parts of the small-group session that happened out
  loud at the table and never became written practice. Four parts — the model
  to copy + warm restart, the Connect checks in writing, vocabulary / the known
  misconception / say-more, then the exit check with two carry-forward items
  drawn from the PREVIOUS lesson in the same track and a self-check band. The
  key closes with a reteach routing table. Group 1 gets sentence frames and a
  "change one number" closer; Group 2 gets a second-reason demand and an
  author-your-own closer. The student sheet shows only the *statement* of
  `practice.commonMistake` — its correction stays on the key, because finding
  the fix IS the task.
- **Catch-up parity**: catch-up studios now get per-step build visuals, the
  streak-earned Challenge bridge (maps `-catchup` → `-group2`), and stretch
  eligibility in the adaptive coach (stretch is variant-agnostic when a
  session is clean).

## Verification

- `npm run build` — all 148 compile as Rollup entries.
- `npm run validate` — full QA suite (save-resume, injection, ccss, uifr, …) — green.
- `node tools/smoke-lesson-boot.mjs --lessons <ids>` — headless render, no boot errors
  (`PW_CHROMIUM_PATH=<chromium>` points it at a system browser in sandboxes).
- `node --test tools/small-group-innovation.test.mjs tools/small-group-rubric.test.mjs`
  — adaptive-path + mastery-band unit tests.
