# Family Practice product roadmap

Scope: Grade 6 Reveal Math Family Practice pages, with the first release covering
all Part 1 and Part 2 pages in Units 2–6 (52 lesson pairs, 104 pages).

## Version 1 — Family Math Studio foundation

Shipped in this release:

- Three clearly described, optional routes: Quick Practice, Learn & Practice,
  and Family Math Studio. Estimates are guidance only; there is no countdown.
- Family Math Studio is the default. Old automatically initialized shorter
  defaults migrate to Studio; explicit choices and shared links take precedence.
- Each route controls the visible stops and practice count. The learner can
  switch routes without losing answers; the route choice is saved on that
  device.
- Shared links keep the selected route and language, but never include local
  responses or reflection data. Existing save/resume behavior remains separate.
- Paired Part 1 and Part 2 family pages link to each other without changing the
  separate classroom lesson flow.
- Unit 2–6 Part 2 family titles have Spanish equivalents instead of falling
  back to English.
- Existing topic visuals, graduated hints, print options, read-alouds, and
  family missions remain part of the experience.
- The follow-up model correction adds a statistical-question classifier for
  2.1, focused statistics models, and session-specific replacements for
  percentages above 100%, finding an unknown whole, and expanding/factoring.

## Version 2 — Topic-matched studio activities

Proposed next release:

- Build family missions around the mathematical model for each topic family:
  data displays, ratio tables and double number lines, percent bars, geometric
  construction, fraction models, and expression testing.
- Offer a no-material option and at least two ways to show thinking, such as
  speaking, sketching, writing, or manipulating a visual.
- Improve wrong-answer feedback so it offers a question, a visual cue, and a
  worked step in that order.
- Add short, captioned English and Spanish concept explainers, with transcripts
  and reduced-motion support.
- Review sensitive real-world scenarios, especially dosage and health contexts,
  so activities cannot be mistaken for real-world instructions.

### Version 2 shipped: the weekly hub (`/curriculum/family-connections/`)

- One name: the page is "Family Math Studio" / "Estudio familiar de matemáticas"
  with an English | Spanish switch at the top that also writes `hw_lang_mode`,
  so every lesson page opens in the family's language.
- Each posted night has a time chooser: "Start Family Math Studio · 20–30 min"
  (the recommended route, per Joel's decision), then "Quick · 5–10 min" and
  "Learn & practice · 15–20 min". The third route is called "Full Studio".
  Nights use the lesson pages' words: "Session 1: Concept Launch" and
  "Session 2: Compare & Apply".
- When nothing is posted the hub shows "Tonight anyway": Daily Boost, practice
  any lesson, and catch up on last week. No dead end, no new network calls.
- "A note from Mr. Neft": an optional per-week text and captioned-video card
  from `data/family-welcome.json`, guarded by `validate:family-welcome`; script
  template in `docs/family-welcome-script.md`.
- Phone layout at 390px: first-time class picker, 44px targets, 14px minimum
  text, room reserved under the fixed Learning supports button.

## Version 3 — Family Learning Companion (Delivered)

Shipped across all 166 Grade 6 lesson homework pages (`lessons/*/homework.html`) and the weekly hub (`/curriculum/family-connections/`):

- **The 60-Second Family Dinner Conversation Card ("La Pregunta de la Noche"):**
  A low-intimidation card at the top of the Learn stop (`#hw_dinner_talk`) featuring one accessible dinner/bedtime question from the lesson's authored guidance, read-aloud audio, and an expandable 30-second inline SVG visual explainer in plain everyday English and Spanish.
- **Student-Controlled Routing & Adaptive Pathways (`#hw_pathway_bar`):**
  Students can switch anytime with zero loss of entered work between three pathways:
  1. **"I've Got This" / "¡Ya lo domino!"** (Express & Challenge: 2 quick checks leading directly to the family mystery puzzle).
  2. **"Just Right" / "A mi medida"** (Standard Companion: Launch & Model → Practice with Tiered Hints → Family Talk).
  3. **"Boost My Foundation" / "Reforzar mi base"** (Visual Bridge: opens the interactive prerequisite visual model and Then-vs-Now bridge before practice).
- **Private Local Reflection ("My Math Voice" / "Mi Voz Matemática"):**
  Self-assessment prompts (*"One idea that makes sense to me now is…"* and *"A question I want to ask Mr. Neft tomorrow in class is…"*) equipped with **Quick-Tap Sentence Starters / Chips**, local voice memo recording, and browser speech-to-text entry, stored strictly in client-side `localStorage` with zero surveillance or accounts.
- **Interactive Co-Op "Confused Grownup" 3.0 & "Domino Duo":**
  Enhanced with tap-to-reveal coaching prompts (`<details class="cga-praise-reveal">` and `<details class="dom-duo-praise">`) giving families exact phrases that praise mathematical reasoning rather than speed.
- **Refrigerator Sheet 3.0 (One-Page High-Yield Printable):**
  Upgraded `@media print` layout featuring the inline SVG visual math summary diagram, the single 60-second dinner question, and a tear-off check-in ticket (*"I talked math with someone at home tonight!"*) with a student pride / partner sketch space and `"Practice partner (optional)"` / `"Acompañante de práctica (opcional)"` (never requiring a signature).
- **Seamless Weekly Hub & Local Completion Sync:**
  Daily lesson cards on `/curriculum/family-connections/` highlight V3.0 Companion features and synchronize with `localStorage` (`isCompanionLessonDone`) to show a calm `✓ Completed on this device` badge when a night's goal or reflection is finished.

## Quality bar

Before expanding beyond the first release, test with families across devices,
language preferences, and comfort levels with math. Check whether they can find
the first step, understand the route choices, get useful help, and finish or
pause without losing work. Use voluntary usability feedback; do not collect
student answers or add tracking for these checks.

The goal is a family math experience that feels clear, welcoming, mathematically
meaningful, and easy to use together or independently. Awards are not a success
measure; demonstrated learning and family usability are.
