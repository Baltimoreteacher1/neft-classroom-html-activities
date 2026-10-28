# Family Math Studio v3.0, stage 2: what is left to build

Stage 1 (shipped before this): every one of the 166 sidecars carries a lesson-keyed `v3` block; the Learn stop renders from it
(`scripts/lib/homework-v3-learn*.mjs`, `homework-v3-model.mjs`, models from `assets/design/family/art/math-models*.mjs`); the legacy
dev-style bar is gone; desktop is one centered column (`scripts/lib/homework-center-css.mjs`); gates `validate:family-v3` and
`validate:family-no-leakage`. Briefs: `brief-design.md` (visual design), `brief-content.md` (authoring), spec
`docs/specs/family-homework-v3.md`. The design system (tokens, components, specimen) is on branch `feat/family-v3-design`; the art kit
(icons, unit scenes, hook cards, brand) is on `feat/family-v3-art`. Neither is used by the page yet.

## Operating rules for every stage 2 workstream

- Work in your OWN worktree on your OWN branch cut from `feat/family-v3-stage2` (the base), named in your assignment. Never push,
  never deploy, never touch `main`. The coordinator merges and ships.
- `lessons/*/homework.html`, `lessons/*/homework.docx`, `lessons/*/downloads/*-homework.pdf`, `assets/homework/*` hashed files and
  `data/curriculum-download-manifest.json` are GENERATED: change the generator or data, regenerate (`node scripts/generate-homework-html.mjs`,
  `node scripts/generate-word-problems.mjs`, `npm run generate-download-manifest`) so your pre-commit gate passes. The coordinator
  will regenerate again after merging, so never resolve a conflict in a generated file by hand.
- Every existing gate in CLAUDE.md stays green. Never weaken, skip or bypass a gate, never `--no-verify`. If a pinned test asserts the
  OLD structure (for example the legacy HUD ids), replace it with a test of the NEW contract in the same commit and say so.
- English + Spanish only. No external requests (fonts, icons, CDNs), no timers/countdowns, no grades, no leaderboards, no locked
  content, no tracking. Do not change math content, answers or logic while restyling. Keep SCORM/Canvas wrappers, save/resume,
  routes (Quick / Core / Full), bilingual toggle, hints, domino duo, read-aloud and share working.
- The pre-commit gate is slow and other sessions share one QA lock: commit in 2-4 meaningful batches, end each commit message with
  `Claude-Session: https://claude.ai/code/session_01Gyww8J7bVnsWKkwmCw8Lmi`. Run `node node_modules/.bin/biome check --write <files>`
  on files you touch (never pipe biome into head). Use absolute paths; never rely on `cd` persisting.
- Wire each new gate into `package.json` (and the `validate` chain), `scripts/qa-run.mjs` COVERAGE and the CLAUDE.md gate table
  (`tools/documented-gates-wired.test.mjs` checks the table), with self-tests of detectors first and a "swept zero pages FAILS" rule.
- Final report under 25 lines: branch, last SHA, what changed, gate results, what you could not verify.

## Workstreams

### H: hero, top bar, design-system integration (branch `feat/family-v3-hero`)

Load `assets/design/family/tokens.css` + `family.css` (self-hosted fonts under `assets/design/family/fonts`, preloaded for the hero,
`font-display: swap`, size-adjusted fallback) on every homework page as shared hashed files. Rebuild the first screen with the
design-system hero: compact top bar (wordmark/home, language switch, Grown-up tips, text size, read-aloud, save state, rest in a
"More" sheet), unit-colored art band from `feat/family-v3-art` (`assets/design/family/art/scenes/unit-NN.svg`), unit eyebrow, H1,
the lesson's `v3.hook` as a hook card in the `v3.hook.style` variant (price-tag, recipe, scoreboard, map, ticket, receipt), two route
cards (Quick / Keep going) and one big Start button; at 390px the hero and Start fit one phone screen; at 1280px centered at
max 1100px. Keep every id/data attribute the session-flow and experience JS and tests rely on. Text size (100/115/130/150%),
spacing and dyslexia options persist locally. Dark, high-contrast and forced-colors work. Delete the CSS the new hero replaces
(calm/session-flow hero rules, studio-skin hero rules, the experience-badge hacks, `homework-center-css.mjs` hero rules). Gate:
`validate:family-visual` (Playwright 320/390/768/1024/1280/1920 x EN/ES x light/dark on a rotating sample: no horizontal scroll,
no fixed-UI overlap, hero + CTA in one phone screen, no fallback serif heading via `document.fonts`, AA contrast on chip/CTA/badges,
tap targets >= 44px). Store baselines under `docs/family-homework-v3/visual-baseline/`.

### B: page body restyle, one visual system (branch `feat/family-v3-body`)

Restyle the Learn, Try (practice ladder), Play and Celebrate stops with the `fm-` components (cards: one raised + one inset, max two
surface levels; buttons; choices; soft "try another look" feedback panels, never red or shake; hint ladder; progress dots + ring;
vocabulary flip cards with the lesson's `v3.vocab` examples/frames; callouts; grown-up drawer; resume banner; footer). Replace
the duplicated `homework-layer-*.css` pair, `homework-studio-skin.mjs`, `homework-calm-css.mjs`, `homework-experience-css.mjs`,
`homework-bridge`/`case-file`/`confused-grownup` private palettes and `curriculum/family-connections/homework-publisher.css` styling with
the single token + component stylesheet and a tiny per-lesson override of custom properties; delete what is superseded. Targets
(rendered page): <= 12 base colors plus tints, <= 8 font sizes, <= 6 radii, <= 6 shadows, no raw hex outside token files, >= 60% less
first-view CSS than today's ~18,600 lines, no `!important` except documented a11y/print overrides. Math models draw with the
shared part/whole/unknown colors. Gate: `validate:family-design-tokens` (the design branch already has a version; integrate it).

### A: accessibility and performance (branch `feat/family-v3-a11y`)

WCAG 2.2 AA on all 166 pages in EN and ES at 390 and 1280: axe 0 serious/critical; zero unnamed controls; zero duplicate ids; one h1,
logical h2-h3; landmarks and a skip link; visible 3px focus ring; polite live regions for feedback; the inactive language removed
from the accessibility tree (not just hidden) with correct `lang` attributes and headings that do not concatenate both languages;
keyboard and tap alternatives for drag/drop and canvases; min 16px body and 13px smallest text; targets >= 44px;
200% zoom and 400% reflow; reduced motion. Replace inline handlers with delegated listeners (>= 60% fewer, target <= 200 per page).
Page weight: first view <= 150 KB gzip; shared bundles cached; no CLS above 0.05. Gates: `validate:family-a11y` (axe + focus +
unnamed-control + duplicate-id + heading-outline + forced-colors + zoom/reflow; all pages in the full run, a sample in `qa:fast`) and
`validate:family-performance` (weight and handler budgets). Record manual checks you could not automate.

### P: print, PDF, DOCX, one standard (branch `feat/family-v3-print`)

Rebuild the take-home as a Family Take-Home Sheet: max 2 pages, Letter, EN and ES (mirrored), grayscale-safe, >= 0.5in margins, 11-12pt,
title + hook, the lesson's model drawn large (from `v3.model`), 4-6 practice items with real answer lines (one per answer; no six
sub-parts on one line), a "talk about it" question, a home mission, a "we're stuck" hint box, a QR/short link to the interactive page,
no grading language ("earn 1 point", Period, "check your mathematics"), an optional self-check face scale, plus a separate caregiver
answers-and-talk page. Tagged PDF with title and language, embedded fonts, no orphan page, nothing split across pages. DOCX with real
heading styles, alt text, table headers, numbered lists (extend `homework-docx-a11y`). Web "Print this plan" uses an `@media print`
sheet yielding the same content. ONE standard code per lesson from `lessons/<id>/config.json` `standard`, identical on web, PDF, DOCX,
the family guide (`lessons/*/family/index.html` via `scripts/generate-lesson-support-pages.mjs`) and the curriculum hub; today the PDF
prints "6.RP.A.3c" (district crosswalk) where the web page prints "6.AT.4": resolve it to the lesson config and document the mapping.
Normalize lesson naming ("Lesson 4.5" for print, `4-5` for ids). Gates: `validate:family-print` (page count, orphan pages, text size,
tags, QR resolves, no grading language, EN/ES parity) and `validate:family-standards` (one code everywhere).

### S: Spanish quality (branch `feat/family-v3-spanish`)

Follow `docs/family-homework-v3/es-style-guide.md`. Clean the OLDER sidecar prose and the `data/homework-*-spanish.json` /
`data/family-*.json` files (not the `v3` blocks, which are already clean): one glossary term per concept from `termEs` (the whole =
"el total", never "el entero" or "del todo"), tú for the student and ustedes for adults, never usted or voseo, "60%" with no space,
no doubled labels ("Parte / Parte"), no literal idiom translations or Spanglish. Build `data/family-glossary.json` as the single source
for term, EN, ES, definition and example and make page, flashcards, print and read-aloud read it. Gate `validate:family-spanish`
(register linter, one ES term per concept, no doubled labels, percent formatting, no identical EN/ES strings except numerals/symbols/
proper nouns) over all sidecars and generated pages. `npm run export:family-spanish-review` stays the reviewer sheet; never claim the
Spanish is native-reviewed.
