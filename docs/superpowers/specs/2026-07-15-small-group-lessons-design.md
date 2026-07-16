# Small-Group Differentiated Lessons — Design Spec

**Date:** 2026-07-15
**Repo:** neft-classroom-html-activities
**Author:** Claude (for Joel)

## Goal

For every base lesson (`lessons/N-M/`), generate **two** built-out small-group
lessons that appear **indented under their parent** in the curriculum hub
dropdown:

- **`N-M-group1`** — _Small Group: Group 1_ — students **struggling** with the
  material. A 15–20 min teacher-led **re-teach + scaffolded practice**.
- **`N-M-group2`** — _Small Group: Group 2_ — students **understanding** the
  material. A 15–20 min **extension / challenge** small group.

Same publisher / gold-standard quality as the full lessons, but **compacted**
and **specifically tailored** to each group's needs.

Scope: 64 base lessons → **128** small-group lesson directories.

## Architecture — reuse everything

These are **real lessons** in the existing engine, not a new surface. Each is a
sibling directory `lessons/N-M-groupK/` with the same three files every lesson
has — exactly mirroring the proven `-catchup` precedent:

- `config.json` — drives `engine/core/lesson-renderer.js` (5 required phases:
  `launch`, `explore`, `practice`, `connect`, `reflect`).
- `index.html` — cloned from the parent lesson, identity strings patched. This
  automatically inherits all injected layers (save/resume, learning-supports,
  offline SW, math-workbench, edupulse).
- `lesson.js` — copied verbatim from parent.

**Why this approach (vs. a bespoke small-group renderer):** the base configs
already contain publisher-grade content — `conceptIntro` with I-do/we-do/you-do,
tiered practice with per-item hints, error-analysis tasks, exit tickets with
per-choice feedback, vocab with ESOL defs+images. Reusing the renderer gives the
small groups save/resume, learning-supports, teacher mode, and offline for free.
The generator's job is to **select and re-frame** that content per group with
strong pedagogical wrappers — the same pattern the catch-up generator uses and
that memory records as gold-standard.

## Generator: `tools/generate-small-group-lessons.mjs`

Mirrors `tools/generate-catchup-lessons.mjs`. For each base lesson `N-M`:

1. Deep-clone the base config (guarantees all 5 phases + structural validity).
2. Apply a **group-specific transform** (below).
3. Write `lessons/N-M-groupK/{config.json,index.html,lesson.js}`, patching
   identity strings in the HTML (`data-ewl-supports-lesson`, `<title>`,
   `<meta description>`, UIFR comment).
4. Emit `tools/small-group-rows.json` (per-row: `id`, `afterLesson`, `group`,
   `title`, `search`, `counts`) for the hub splice + search index.

Idempotent, `--dry` supported. Strips heavy per-lesson artifacts not relevant to
a 20-min pull-out: `googleForms`, `printables`, `graphicNovel`, `familyNotes`,
`flagship`, `readiness=false`.

### Group 1 transform — Extra Support (re-teach)

- `themeEmoji` 🤝, `title` = `"N.M Small Group · Group 1"`, `timeEstimate`
  "~15–20 min", badge **"Small Group · Extra Support"**.
- `contentObjective` restated in plainest terms ("I can [core skill] with help,
  step by step").
- `launch.narrative`: warm, low-anxiety framing ("Let's slow this down and build
  it together").
- `launch.conceptIntro`: rebuilt from the base concept intro, **fully
  scaffolded** — keep `iDo` (fully worked), keep `weDo` and append **sentence
  frames**, rewrite `youDo` as a gentle bridge into scaffolded practice. Prepend
  a one-line prerequisite reminder.
- `practice`: **`approaching` tier is the spine** (its built-in hints are exactly
  the support this group needs) — up to 5 items; `onLevel` trimmed to 1–2;
  `extending` dropped to keep it compact. Surface `commonMistake` prominently.
- `explore` / `connect`: kept (renderer requires them) but simplified to the
  essential guided step.
- `reflect.exitTicket`: base exit ticket **with its `hints` retained**, framed as
  "quick check — you've got this."
- `smallGroup` facilitation block (new key, teacher-facing): who to pull, how to
  open, the misconception to watch for (from `commonMistake`), sentence frames.

### Group 2 transform — Challenge (extension)

- `themeEmoji` 🚀, `title` = `"N.M Small Group · Group 2"`, `timeEstimate`
  "~15–20 min", badge **"Small Group · Challenge"**.
- `contentObjective` raised to transfer/justify ("I can extend [skill] to new
  situations and explain why it works").
- `launch.narrative`: quick mastery confirmation, then a provocative extension
  prompt.
- `launch.conceptIntro`: reframed to **push further** — generalize, connect
  multiple representations, "why does it work / when would it fail." `iDo`
  becomes a richer worked case; `weDo` a generalization; `youDo` launches the
  challenge.
- `practice`: **`extending` + `optional` tiers are the spine** (error-analysis and
  richer tasks); `onLevel` trimmed to 1–2; `approaching` dropped.
- A challenge close: reuse the base `optionalActivity` / error-analysis and add a
  "prove it / convince a skeptic / find a counterexample" prompt.
- `reflect.exitTicket`: base exit ticket reframed toward justify/generalize
  rather than compute (keep the item; deepen the stem framing).
- `smallGroup` facilitation block: give the challenge and step back; ask "how do
  you know?"; push for a second strategy or a generalization.

### Structural safety

- Renderer merges tiers with `p.approaching || []` etc. — empty tiers are safe.
- Assert per generated config: all 5 phases present; at least one practice tier
  non-empty; exit ticket present; ≥2 vocab terms.

## Curriculum hub — indented dropdown entries

`tools/splice-small-group-curriculum.mjs`, modeled on
`splice-catchup-curriculum.mjs` (byte-preserving insertion — no
re-serialization).

- For each base lesson, insert **two** `<details class="lesson lesson-smallgroup
lesson-sgK">` blocks **immediately after the parent lesson's `</details>`**
  (before any catch-up block, so dropdown order is: Lesson → Group 1 → Group 2 →
  Catch-Up).
- Add a small CSS rule once: `.lesson-smallgroup { margin-left: 1.5rem;
border-left: 3px solid <accent>; }` plus per-group accent (support = calm blue,
  challenge = amber) so they read as **children** of the lesson above.
- Each block: summary shows the group label + a support/challenge badge; body
  has a one-line objective and a **"Start small group"** link to
  `/lessons/N-M-groupK/`.
- Idempotent (skips if `/lessons/N-M-groupK/` already present); integrity check
  that every base-lesson anchor survives.

## Search index

Regenerate the curriculum search index
(`npm run generate-curriculum-search-index`) so the 128 new lessons are
findable, tagged `small group group1/group2 support challenge <lesson title>`.

## Verification

1. Generator `--dry` — row count = 128, per-row counts sane.
2. Generate for **one** lesson first (`1-3`) as a proof of concept; render both
   via `node tools/smoke-lesson-boot.mjs --lessons 1-3-group1,1-3-group2` (real
   headless Chromium; asserts `#app` renders content, no uncaught error).
3. Visually confirm both configs read as tailored, publisher-quality small
   groups (not a mechanical clone).
4. Scale to all 64 lessons; re-run smoke on a sample per unit.
5. Splice hub; grep-confirm 128 new `lesson-smallgroup` details, all base
   anchors intact; render curriculum hub in smoke test.
6. `npm run build` (verify dist) — do **not** deploy (per repo rules; deploy is a
   separate explicit step).

## Non-goals

- No new renderer / engine surface.
- No printables/slides/PPTX/homework/graphic-novel per small group (pull-outs are
  screen activities; heavy artifacts are stripped).
- No deploy in this change.

## Risks

- **Content feel:** a purely mechanical transform could read generic. Mitigation:
  the PoC gate (step 3) — inspect real output before scaling; tune transforms.
- **Hub byte-safety:** splice must be byte-preserving; verified by base-anchor
  integrity check + hub render smoke.
- **Branch hygiene:** repo is mid-work on `feat/discussion-popups` with unrelated
  dirty files — branch off `origin/main` cleanly; never touch those files.
