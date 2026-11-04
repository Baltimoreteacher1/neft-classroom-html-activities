# EduWonderLab 7.0 — Math Fluency Lab: what shipped, what did not

Scope decision: the Fluency Lab already had 35 synchronized models, a prerequisite graph, a deterministic misconception engine,
a tutor engine, studio/teacher/family flows and ~100 test files. A rewrite would have broken the save/resume, SCORM, routing and
learner-data contracts. 7.0 therefore adds the missing integration layer and leaves every existing URL, storage key and page intact.

## Shipped (all under `math/fluency-lab/v7/`, plus one `<link>` and one `<script>` in `index.html`)
| Brief system | Delivered | Evidence |
|---|---|---|
| Intent-first navigation | Start panel on the bare lab URL: grade, Learn / Practice / Explore, Start (3 selections). Teacher, Families, Progress are secondary links. | `verify-fluency-v7-browser.mjs` journey 1 |
| Grade-adaptive design | Four bands (1–2, 3–4, 5–6, 7–8) change type size, radius, spacing via tokens; brand palette only. | v7.css; screenshots reviewed |
| Unified workspace | `/math/fluency-lab/v7/?grade=&skill=`: living model stage, response stage, "Help me understand" coach, feedback region. | browser journeys, 5 flagships × 390/1280 |
| Living math | Reuses the e8 MathVisualEngine. The picture starts as a *parallel example* (cannot state the answer); after an attempt "Show my problem in the picture" loads the exact givens for array, fraction bar, tape ratio, balance scale. | `fluency-v7.test.mjs`: stage may add no number the question did not state |
| Socratic coach | Pure state machine: noticing → representation → answer-free next step (capped by existing `peekCap`) → reveal. A misconception is named only for conceptual + high confidence. Reveal needs one attempt. | tutor tests across all 96 skills × 12 seeds + adversarial input |
| AI provider boundary | `provider.js`: timeout, retry, per-session budget, strict schema, length/markup/link/answer-leak filters, deterministic fallback, minimal payload (question, kind, ≤80-char response, lang). | provider tests with fake fetches |
| Concept registry / learner model | `concepts.js` joins skills, graph, models, misconceptions; `learner.js` makes conservative recommendations (no claim below 4 attempts). | unit tests |
| Persistence | v7 writes only its own key `ewl-v7-progress-v1` (and `ewl-v7-last-v1`); old progress is read, never rewritten; blocked storage still works. | browser journeys 2 and 4 |

Checks run: `node tools/fluency-v7.test.mjs` (19,805 checks), `npm run validate:fluency-v7-browser` (69 checks incl. axe
WCAG 2.2 AA, 390/1280px, Spanish, reduced motion/forced colours), `validate:fluency` baseline green before changes,
`validate:save-resume`, `validate:no-purple`, `validate:route-contract`, `validate:game-rules`, `validate:design-tokens`,
`validate:gate-coverage`, `validate:js-syntax`, Biome. The pre-push gate runs the rest.

## NOT shipped — stated plainly
- **No live AI.** No endpoint, key or server function exists. The coach is the deterministic one; the provider boundary is
  tested only against fakes. Wiring a real model needs a Cloudflare Function plus a secret, and touches the frozen auth/route contract, which needs Joel's decision.
- **Six "mathematical worlds", the simulation framework, voice/camera, a rebuilt Teacher Studio and Family experience:** not built. Existing teacher/family/game surfaces are unchanged.
- **Content audit of Grades 1–8:** only a coverage count exists (`concepts.js coverage()`): every grade has 7–11 of 11 skills with a model; Grade 1 has misconception data for 6 of 11 skills, Grade 8 for 6 and models for 7. Authoring those gaps is open work.
- **Grade 2 multiplication arrays** borrows the Grade 3 facts generator (the bank has no Grade 2 multiplication skill); the page says Grade 3.
- Grade 8 slope shows only a parallel line (an exact-problem picture would print the slope).
- Coach step text from the problem bank is English-only; Spanish shows English steps.
- Lighthouse 90+ and tutoring-quality-with-real-students were **not measured**. No learning-gain claim is made.
- The coach panel is not yet embedded inside the legacy practice screen; the legacy "Practice" route is unchanged.
- Harness note: the browser test serves the source tree, so Vite-only specifiers (`web-vitals`) are excused; nothing else is.
