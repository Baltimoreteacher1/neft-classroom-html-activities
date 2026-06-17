# Curriculum Hub — Top 1% Upgrade Notes

Role-aware, student-safe, standards-aligned upgrade to `/curriculum/`. The work is
**additive and scoped** (prefix `top1-`): it reads `window.CurriculumHub.unitsData`
and renders its own UI region, so it cannot break the existing render / search /
progress / mode systems.

## What shipped

### Public/private safety (highest priority)

- **Default flipped to Student Mode.** `/curriculum/` is a public page; it now
  defaults to Student Mode instead of Teacher Mode (`loadTeacherMode()` returns
  `false`). Teachers opt in via the toggle or `?teacher=1` (persisted).
- **Closed two Student-Mode leaks** that pre-dated this work:
  - The hub-level **Teacher Dashboard** link is now teacher-only
    (`.hub-teacher-only`, hidden via CSS unless `body.teacher-mode`).
  - **Slide decks** (`slides.html`, `editable-slides.html`, incl. the
    emoji-labeled "🔗 Google Slides") are now matched by **href** in
    `TEACHER_HREF_PATTERNS`, so they hide in Student Mode regardless of label.
- Verified: a fresh visitor (cleared storage) sees **0** teacher links; toggling
  Teacher Mode / `?teacher=1` reveals all 11 + the UIFR card.

### Start Here command center (`#top1-start-here`)

Injected above the search controls. Seven role paths, each reading real lesson
data:

| Role         | What it does                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Student      | Pick class/unit/lesson → goal, "show your thinking" choice, supports, mastery checklist, copy student directions                            |
| Teacher      | UIFR Level 4 Evidence Card (see below)                                                                                                      |
| Family       | What we're learning (English + Spanish), words to know, how to help, family-facing links, copy family message                               |
| Substitute   | 45-minute no-setup plan, private tools hidden, copy sub directions                                                                          |
| Intervention | Pick a skill family → 10-minute reteach (vocab, visual model, sentence frame, check) + matching lessons                                     |
| Assessment   | Unit pre/post tests, study guides, MCAP-style practice + recommended next step                                                              |
| Today Mode   | Class/unit/lesson picker (persisted) → essential links + copy for Student / Google Classroom / Canvas / Family / Absent / Substitute / UIFR |

### UIFR Level 4 Evidence Card (Teacher Mode only)

Per lesson: standard/objective, rigorous task + student choice, **Questioning
Ladder** (6 rungs), **Academic Talk** (partner roles + evidence stems),
**Formative Checkpoints** (begin/mid/end + feedback stems), **Reflect & Next Step
From Evidence**, the **11 UIFR domains** (Prepare 1–2, Teach 1–7, Reflect 1–2), and
a **Copy UIFR Evidence Notes** button producing observation-friendly text.

> The card carries a disclaimer: it makes Level 4 evidence visible and collectable;
> it does **not** guarantee a rating (that depends on live evidence + observer
> judgment).

### Supports + accessibility

- Per-lesson **Supports** (vocabulary, sentence frame, Because/But/So, visual
  model; WIDA 1–2 / 3–4 / SPED + teacher note in Teacher Mode), generated from the
  detected skill family.
- **Display controls** (persisted): text size, spacing, high contrast, reduced
  motion, English/Spanish.
- WCAG 2.2 AA fixes: **progress-check buttons forced to ≥44×44px** (were ~27px),
  visible `:focus-visible` outlines, `aria-pressed`/labels on controls,
  contrast-safe badges, reduced-motion honored.

## Files

**New**

- `assets/curriculum-top1.css`, `assets/curriculum-top1.js`
- `data/curriculum-unit-identities.json`, `data/curriculum-supports.json`,
  `data/curriculum-resource-taxonomy.json`, `data/curriculum-uifr-level4.json`
- `tools/validate-curriculum-top1.mjs` (wired into `npm run validate`)
- `docs/security-hardening-plan.md`, `docs/backups/curriculum-live-backup-*.md`

**Edited**

- `curriculum/index.html` — two additive tags (top1 CSS + JS)
- `assets/curriculum-enhancements.js` — student-mode default + 2 leak fixes
- `package.json` — `validate:curriculum-top1` script

## Verification

- `npm run validate` (static + reveal-math + hub lock 10 units/999 links +
  curriculum-top1 13/13) — PASS
- `npm run build` — EXIT 0, assets + data copied to `dist/`
- Playwright smoke (`/curriculum/`): panel injects, 7 roles, **0** console errors,
  Student default, 0 teacher leaks, Teacher toggle reveals tools + UIFR, all copy
  buttons present, `?teacher=1` works.

## Follow-ups (not in this pass)

- Per-lesson UIFR/Supports injection directly inside each rendered unit card (this
  pass drives them from the Start Here region for safety/robustness).
- Full unit-card visual redesign with the unit-identity accents (data file is
  ready in `curriculum-unit-identities.json`).
- Standards browser as a dedicated filter (Assessment + search cover the need
  today).
- CSP enablement — see `docs/security-hardening-plan.md`.
