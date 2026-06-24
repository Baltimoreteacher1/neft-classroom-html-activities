# Family Homework Enrichment — Design

Date: 2026-06-24
Branch: `feat/family-homework-esol-overhaul`

## Goal

The parent-facing Family Homework page (`/lessons/X-Y/homework.html`, 64 lessons) is
generator-driven but still feels thin. Joel wants: more visuals, guided problems with
fill-in spaces + helps/supports, click-to-popup visual aids, and more practice problems.

Single source of truth = the generators. No hand-editing of `homework.html`. Regenerate
all lessons via `npm run generate-homework`, then `npm run validate` + `npm run build`.
Do NOT deploy (push to main) without explicit approval.

## Affected files

- `scripts/homework-alignment.mjs` — practice selection (`selectAlignedQuickCheckProblems`)
- `scripts/homework-guided-notes.mjs` — section/tab renderers, help modal, modal JS
- `scripts/generate-homework-html.mjs` — assembly, per-problem render, topic visuals

## Scope (A–D, all approved)

### A. More practice problems — Core + expandable accordion

- Raise core quick-check `TARGET` from 4 → 6.
- New `selectMorePracticeProblems(practice, config, exclude)` returns the remaining
  pool (deduped vs core, capped at 8).
- `renderCheckTab` renders the 6 core problems, then a `<details class="more-practice">`
  accordion "➕ More practice / Más práctica" containing the extra problems.
- If the pool has no extras, the accordion is omitted.

### B. Guided problems with fill-in spaces + helps/supports (Try Together)

- Each Try Together step becomes an interactive card with:
  - the step prompt (EN/ES),
  - a writable fill-in input ("✏️ Your turn / Tu turno", `saveState()` persisted),
  - a "💡 Hint / Pista" popup button (step.hint / step.hintEs),
  - a "🤝 More help / Más ayuda" popup button when step.helpEn exists,
  - a per-step "👀 Reveal the idea / Ver la idea" toggle showing step.en guidance.
- Data already present (`tryTogetherActivity`); no new sidecar content required.

### C. Click-to-popup visual aids

- Extend `helpButton(label, payload)` to accept optional `visual` (inline SVG HTML)
  and `frameEn`/`frameEs` (sentence frame).
- Extend `renderHelpModal()` + `openHelpModal()` JS to render the visual (innerHTML
  into a dedicated container) and the sentence frame below the bilingual text.
- Per-problem hint button (`renderProblemHintButton`) gains the topic visual + a
  generic sentence frame so every Quick Check problem has a visual aid popup.

### D. More visuals

- Reuse existing `TOPIC_VISUAL` SVGs (by `detectVisualTopic`) inside the new popups
  (C) and pass the topic visual down to `renderProblemHintButton`.

## Non-goals / YAGNI

- No auto-grading of the Try Together fill-in (it is a scaffold; Quick Check already
  auto-checks with answer keys).
- No new sidecar JSON authoring across 64 lessons.
- No route/structure/`_headers`/`_redirects` changes.

## Verification

- `npm run generate-homework` (regenerate 64 pages)
- `npm run validate` (primary), `npm run build`
- Manual smoke: open a regenerated `homework.html`, confirm accordion, guided inputs,
  and popup visuals work; no console errors.
