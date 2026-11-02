# Family Math Studio v3.0: design and style overhaul (brief)

Source: Joel's follow-up brief, 2026-10-28. This file is the working copy for implementers. Content, pedagogy and Spanish are
handled in `brief-content.md`; design for their needs (Spanish runs ~30% longer; every screen has a caregiver layer).

Rules that apply to everything: generated files (`lessons/*/homework.html`, `.docx`, `downloads/*-homework.pdf`,
`lessons/*/family/index.html`) are never hand-edited; work in a worktree branch; never push to main or deploy; respect every
CLAUDE.md gate; EN + ES only; no accounts, tracking, external requests, timers, grades, leaderboards or locked content.

## Goal

A family opens `/lessons/4-5/homework` on a phone and thinks "this is a real, beautiful, trustworthy educational product" in two
seconds. Warm, confident, playful-but-grown-up, calm, never childish, never corporate.

## 1. Audit (lesson 4-5; re-measure after)

Fragmented styling: five competing sources (`assets/homework/homework-layer-*.css` two ~9,300-line near-duplicates,
`scripts/homework-studio-skin.mjs` `--st-*` tokens, `scripts/homework-themes.mjs` UNIFIED_PALETTE navy #15487f / teal #0284c7 /
amber #d97706, `scripts/lib/homework-calm-css.mjs`, `scripts/lib/homework-experience-css.mjs`, `CO_LEARNING_CSS` in
`scripts/lib/homework-co-learning.mjs`, `curriculum/family-connections/homework-publisher.css`). One page: 55 distinct hex colors,
22 font sizes, 16 radii. "Unit themes" are cosmetic (all 10 share one palette). The rest of EduWonderLab uses warm paper #F7F4EC,
navy #17324D, teal #1FA6A2, amber #F2C15B; the family pages do not read as the same product.

Visible defects: an unstyled legacy bar under the hero ("Completed: 0/0 · Accuracy: 100% · Streak: 0" plus browser-default gray
buttons); near-invisible "Unlock the Whole" experience chip (white on pale tint); hero elements all at the same weight; headings fall
back to Times when the display font CSS 404s; mixed typefaces; bead/block grid wraps badly at 390px; emoji as the primary icon system;
cards inside cards inside cards; generic same-for-every-lesson math graphics (3-part tape on 30 pages); dense print PDF.

Keep: case-file price-tag hook, route cards, soft cream/navy mood, rounded cards, large friendly primary CTA, dotted-underline vocab
chips, progress dots.

## 2. Principles

1. One thing at a time. 2. Warm and trustworthy. 3. Math is the hero; chrome recedes. 4. Phones first, hands first. 5. Calm by
   default, delight on success. 6. Bilingual by design. 7. Consistent rules over decoration.

## 3. Deliverables

### 3.1 One design system: tokens, components, patterns

ONE token file and ONE component stylesheet (hashed, shared, cached); per-lesson CSS reduced to custom-property overrides. The two
near-duplicate homework-layer files merged and deleted. Targets: <= 12 base colors plus tints, <= 8 type sizes, <= 6 radii,
<= 6 shadows (a validator fails above these on a rendered page). Build on `engine/design/tokens.json` (compiled by
`tools/build-design-tokens.mjs`, gate `validate:design-tokens`) rather than starting a competing source.

Tokens: brand navy/teal/amber/paper aligned to #17324D / #1FA6A2 / #F2C15B / #F7F4EC unless accessibility forces a darker variant
(document it; teal is a FILL, text uses teal-ink per docs/style-guide.md). Semantic layer: surface/raised/sunken, text/muted/inverse,
border, focus, success, "try another look" (soft, non-red), info, warning; math mapping part/whole/unknown/answer. Contrast matrix
published (>= 4.5:1 text, >= 3:1 UI/large). Unit identity: 10 accent hues + a spot-illustration motif via `--unit-accent`,
`--unit-accent-tint`, `--unit-motif`; grayscale-meaningful. Typography: ONE display + ONE text family (self-hosted WOFF2 subset,
`font-display: swap`, preloaded for hero, size-adjusted fallback metrics, designed system fallback), optional tabular math style, fluid
scale clamp() 16px body to ~44px display, line-height 1.5 / 1.15, measure 60-70ch, tabular lining numerals, correct minus/times/divide
signs, no all-caps blocks > 3 words. Spacing 4/8 scale, radii, borders, 2-3 elevations, z-index scale, breakpoints
320/390/768/1024/1280/1920, motion 120/200/320ms with two easings. Dark and high-contrast are first-class; forced-colors respected.

Components (each with default/hover/focus/active/disabled/loading/error/success, EN/ES length, touch + keyboard): buttons (primary,
secondary, quiet, icon-only, destructive-confirm), segmented control, chips/pills, cards (one raised, one inset), callouts (tip,
watch-out, grown-up note, celebrate), progress dots + ring, stepper, disclosure, tabs, tooltip/popover, modal/bottom sheet, toast,
inputs (numeric, multiple choice, drag/sort with tap alternative), feedback panels, hint ladder, vocabulary flip card + match tiles,
game shell, certificate, empty/error/loading. Patterns: Welcome/hero, Stop header, Learn card, Model stage, Try item, Play shell,
Celebrate, Grown-up drawer, Resume banner, Footer.

Specimen page at `/design/family-system/` rendering every token and component in EN, ES, light, dark, high-contrast.

### 3.2 Hero and first screen (2-second test)

Remove the legacy bar and default-styled buttons; compact top bar: wordmark/home, language switch, "Grown-up tips" toggle, text size,
read-aloud, save state; everything else in a "More" sheet. Hero at 390px: unit-colored illustration band, small eyebrow, H1 (<= 2
lines), one-sentence hook, two route cards (Quick / Keep going) with time + what you do, one big primary button; <= 1 screen height.
At 1280px two columns, centered max 1100px. Experience style = designed badge with icon + tooltip. The case-file hook becomes a
"hook card" template with 4-6 variants (price tag, recipe card, score board, map pin, ticket, receipt) in SVG/HTML, not emoji.

### 3.3 Layout and rhythm

Mobile-first single column; cards max 640px on tablet; two columns only for model + question at >= 900px. No horizontal scroll 320-1920.
No fixed element overlapping content or another fixed element (stuck/save/accessibility launchers consolidated into one bottom action
bar or one launcher). 8px rhythm. No card inside a card inside a card: max two surface levels per screen. Stops are full-height scenes
with a persistent 5-step progress header and a sticky primary action; long grown-up content in a bottom sheet. Fix the bead grid:
responsive CSS grid, equal tiles, groups of 5/10 kept together, labeled axis, clear selected/filled/unknown states. Stress-test Spanish
and long words at 320px (manual `&shy;` only for long math terms, `overflow-wrap:anywhere` as safety net).

### 3.4 Iconography and illustration

One coherent SVG icon set (24px grid, 1.75-2px rounded stroke, filled active variants) as ONE inline sprite; aria-hidden unless
meaningful. Emoji only inside celebration copy and student avatars. Original SVG illustration system: small cast of friendly, diverse,
non-stereotyped characters and objects in one flat/soft style; 10 unit hero scenes and ~30 spot illustrations (groceries, bus, court,
kitchen, garden, phone, ...), each <= 8 KB, theme-aware via CSS variables; celebration set (badge, confetti shapes, stars) that respects
reduced motion. Wordmark/logo, favicon/app icon (192/512/maskable), apple-touch icon, OG card per unit, manifest theme colors.

### 3.5 Math visuals

One visual grammar across tape diagrams, number lines, double number lines, ratio tables, area models, grids, coordinate planes, bar/dot
plots, balance hangers, fraction bars, tables: same stroke, radius, label size (>= 14px at 390px), gutter, arrow style. Color mapping:
part, whole, unknown ("?" always the same attention color with dashed outline), given, answer, error; never color alone (shape/pattern/
label). Models generated from the lesson's own numbers (data to SVG) with units and a step-through "animate the idea" with static
fallback. Drag handles 44px with keyboard alternatives. Delete the generic 3-part tape from non-ratio lessons. Model library page in
the specimen at 320/768/1280.

### 3.6 Motion and feedback

Entrances fade+rise 200ms, step transitions slide 320ms, correct = soft pulse + check draw, "try another look" = gentle nudge (no
shake, no red flash), progress fill, confetti only on final celebrate. All behind prefers-reduced-motion with static equivalents. No
autoplay loops; nothing flashes > 3x/second. Sound off by default with a visual cue for every audio cue. Skeleton/loading states, CLS
<= 0.05.

### 3.7 Print and PDF styling

Take-home sheet: unit-accent header band, wordmark, big title, hook box, model drawn large, answer lines >= 0.4in, icon-led "Talk about
it" and "Home mission" boxes, QR with caption, footer (lesson id, standard, version). 11-12pt, >= 0.5in margins, grayscale-safe,
low-ink option. Same tokens via a build-time print token set; fonts embedded; vector only. Spanish page mirrors English. Web Print uses
an @media print stylesheet yielding the same sheet. DOCX uses real styles mapped to the same type scale and colors.

### 3.8 Accessibility-as-design

Contrast matrix in light/dark/high-contrast; focus ring 3px offset, 3:1, never removed. Text size control (100/115/130/150%), spacing
control (WCAG text-spacing safe), dyslexia-friendly option, line-length control; persisted locally. Targets >= 44px (24px absolute min),
no hover-only affordances, state not by color alone. Test at 200% zoom, 400% reflow, forced-colors, and a 1366x768 viewport.

### 3.9 CSS architecture and performance

`@layer reset, tokens, base, components, patterns, utilities, unit-theme, print`; logical properties; no `!important` except documented
a11y/print overrides; no inline `style` for visual styling (only data-driven custom properties like `--pct`); no ID selectors for
styling. Shared hashed stylesheets cached across all 166 pages plus a tiny per-lesson override; critical CSS inlined for hero only;

> = 60% reduction in first-view CSS vs the current ~18,600 lines. Fonts: <= 2 families, <= 4 files on the critical path (WOFF2, Latin +
> Latin-1 + math symbols + Spanish diacritics). Inline critical SVG, sprite for icons, lazy below the fold, no external requests.
> Stylelint (or equivalent) enforcing token usage; CI fails on new raw hex, new font sizes, specificity over a limit.

## 4. Validators (new gates)

- `validate:family-design-tokens`: renders pilot pages; fails if distinct base colors > 12 (+tints), font sizes > 8, radii > 6, shadows
  > 6, any raw hex outside token files, font-family outside the approved two + fallbacks, any visible text < 13px.
- `validate:family-visual`: Playwright screenshots 320/390/768/1024/1280/1920 x EN/ES x light/dark for the pilot set; no horizontal
  scroll, no fixed-UI overlap, hero + CTA in one phone screen, no fallback-serif headings (document.fonts), AA contrast on hero chip/CTA/
  badges, taps >= 44px, CLS <= 0.05. Baselines in `docs/family-homework-v3/visual-baseline/`.
- `validate:family-print-design`: render take-home PDF to images; fail on orphan pages, text < 11pt, split items, content outside
  margins, missing title/lang, color-only distinctions (grayscale render).
- Extend `validate:family-a11y` with focus-visibility, forced-colors, zoom/reflow.

## 5. Guardrails

No third-party requests, no raster stock or AI imagery of unclear provenance; all art original SVG in repo with license notes; fonts
open-licensed (SIL OFL) and recorded. Do not change math content, answers or logic while restyling. No red/shake/buzz error styling,
no time pressure, no confetti spam. Keep SCORM/Canvas wrappers, offline cache and stable URLs working. Prefer removing visual noise
over adding decoration: bigger type, more whitespace, fewer colors, one action.
