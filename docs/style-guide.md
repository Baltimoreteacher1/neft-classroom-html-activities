# EduWonderLab Lesson Style Guide

The single source of truth for how a core interactive lesson looks, reads and moves.
Machine-readable values live in [`engine/design/tokens.json`](../engine/design/tokens.json) and compile to
`engine/styles/ds-tokens.generated.css` (`node tools/build-design-tokens.mjs`). Every colour, size and ratio in
this guide is computed from those tokens; the generator fails if a declared contrast pair misses its floor or a
token lands in the forbidden hue range.

**Scope.** The 84 core lessons (`body.editorial.skin-warm-deck`, and the entry card before boot). Small-group,
catch-up, project and family pages keep their own system (`small-group-designsystem.css`) and are mapped to these
tokens only where noted. The approved "warm deck" identity (rounded display face, rounded body face, white slide
cards) is kept; this guide makes it consistent.

## 1. Colour

Locked palette: navy `#17324D`, teal `#1FA6A2`, amber `#F2C15B`, warm off-white `#F7F4EC`, body text `#24323F`,
plus accessible success `#0F7C4A` and error `#B3402A`.

**Forbidden hues:** violet, purple, indigo-violet, magenta (hue 255°–335°, saturation > 15%). This includes
blends and opacity overlays, SVG art, charts, shadows, gradients, focus rings, confetti, and emoji used as colour
markers. Enforced by the palette gate and by the token generator.

**Roles.** `--ds-surface` (page canvas), `--ds-surface-raised` (cards), `--ds-surface-inverse` (navy sidebar and
primary buttons), `--ds-text`, `--ds-text-muted`, `--ds-primary`, `--ds-accent` (teal fill), `--ds-accent-ink`
(teal text and outlines), `--ds-highlight` (amber fill), `--ds-highlight-ink` (amber-toned text), `--ds-success`,
`--ds-error`, `--ds-focus`, `--ds-focus-on-dark`, `--ds-border`. Tints are derived at 8/16/32/64% toward white
(`--ds-tint-navy-16`, …) — never hand-picked.

**Meaning is never colour-only.** Correct/incorrect always pairs the colour with an icon shape and words
("Correct", "Not yet"). Level 1/2/3 are named in text; their old coloured-circle markers are removed.

**Teal and amber are fills.** The brand teal on white is 2.99:1, so it can never be body text or a required
outline; use teal-ink. Amber text on white is unreadable; use amber-ink, or put amber on navy.

<!-- contrast-table:begin -->
| Foreground | Background | Ratio | Needs | Used for |
|---|---|---:|---:|---|
| text `#24323f` | canvas `#f7f4ec` | 11.92 | 4.5 | body copy on the page |
| text `#24323f` | white `#ffffff` | 13.10 | 4.5 | body copy on a card |
| muted `#4a555e` | canvas `#f7f4ec` | 6.95 | 4.5 | secondary text on the page |
| muted `#4a555e` | white `#ffffff` | 7.64 | 4.5 | secondary text on a card |
| navy `#17324d` | canvas `#f7f4ec` | 11.94 | 4.5 | headings on the page |
| navy `#17324d` | white `#ffffff` | 13.13 | 4.5 | headings on a card |
| tealInk `#177d7a` | canvas `#f7f4ec` | 4.52 | 4.5 | teal text and links on the page |
| tealInk `#177d7a` | white `#ffffff` | 4.97 | 4.5 | teal text and links on a card |
| amberInk `#886c33` | white `#ffffff` | 4.96 | 4.5 | amber-toned text on a card |
| white `#ffffff` | navy `#17324d` | 13.13 | 4.5 | text on a navy surface or button |
| white `#ffffff` | tealInk `#177d7a` | 4.97 | 4.5 | text on a teal button |
| amber `#f2c15b` | navy `#17324d` | 7.85 | 4.5 | accent text on navy (stars, XP) |
| navy `#17324d` | amber `#f2c15b` | 7.85 | 4.5 | text on an amber fill |
| success `#0f7c4a` | white `#ffffff` | 5.25 | 4.5 | success text on a card |
| error `#b3402a` | white `#ffffff` | 5.70 | 4.5 | error text on a card |
| navy `#17324d` | white `#ffffff` | 13.13 | 3 | focus ring on a light surface (non-text) |
| amber `#f2c15b` | navy `#17324d` | 7.85 | 3 | focus ring on a navy surface (non-text) |

| Never use | Ratio | Why |
|---|---:|---|
| teal text/graphic on white | 2.99 | brand teal is a FILL; as text or a required outline on white it misses 3:1. Use tealInk. |
| teal text/graphic on canvas | 2.72 | same: use tealInk for text and outlines. |
| white text/graphic on teal | 2.99 | white text on the brand teal fill misses 4.5:1. Use white on tealInk, or navy on teal. |
| amber text/graphic on white | 1.67 | amber is a FILL or a mark on navy; amber text on white is unreadable. Use amberInk. |
| amber text/graphic on canvas | 1.52 | same: use amberInk. |
<!-- contrast-table:end -->

## 2. Typography

Two self-hosted families, already shipped with the warm-deck skin: **Baloo 2** (display: titles, panel headings,
numbers in badges) and **Nunito** (body, controls, math). **Atkinson Hyperlegible** appears only when a student
turns on a reading support. No other family is used on a core lesson; no CDN fonts; no weight is requested that
the page does not use (400, 600, 700).

| Role | Token | Size | Notes |
|---|---|---:|---|
| Label (smallest allowed) | `--ds-text-label` | 13px | never below 13px; sentence case, no letter-spaced capitals for sentences |
| Caption | `--ds-text-caption` | 15px | helper text, counters |
| Body | `--ds-text-body` | 18px | line-height 1.55; 55–75 characters per line (`--ds-measure`: 75ch) |
| Lead | `--ds-text-lead` | 21.6px | one-sentence intros |
| Title 3 / 2 / 1 | `--ds-text-title-*` | 26 / 31 / 37.6px | modular ratio 1.2; titles are title case, never all-caps |

No all-caps paragraphs. Small all-caps eyebrow labels (one to three words) are allowed at 13px.

## 3. Math typography

One system, applied by a shared formatter (`engine/core/math-typography.js`) so lesson data stays plain text:

- Minus is U+2212 (−), not a hyphen; multiplication is × (U+00D7) and division ÷; never `x` or `*`/`/` between
  numbers in prose.
- Fractions and exponents use real structure (HTML/CSS stacked fraction, `<sup>`), not slashes or carets, except
  inside plain-text answer boxes, where `a/b` is accepted and normalised.
- Ratios use a thin-spaced colon `3 : 2` in running text.
- Numbers in tables use tabular numerals (`font-variant-numeric: tabular-nums`) and right-align on the decimal.
- Variables are italic, in the body face; units are upright and joined to their number with a no-break space
  (`12 ft`, `$4.50`, `35%`).
- Thousands use a comma (1,344); decimals a point; no trailing zeros unless money.
- An equation never breaks across lines: it sits in a `white-space: nowrap` run, or on its own scrolling line.

## 4. Spacing and layout

Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (`--ds-space-1…8`). One content column (max 1240px, text
measure 75ch). One focal point per screen: the question or the model, with chrome kept to the sidebar, one phase
indicator, and one primary action. Breakpoints are checked at 360, 768, 1366 and 1440px with no horizontal scroll.
Chromebook-first: the first 1366×768 viewport must show the task, not only controls.

## 5. Components and states

Every interactive element has these states, all visible without colour alone: default, hover, **focus-visible**
(3px ring `--ds-focus`, 2px offset; `--ds-focus-on-dark` on navy), active, selected, disabled, correct, incorrect.
Targets are at least 44×44px (`--ds-target`).

| Component | Rule |
|---|---|
| Masthead and phase indicator | one of each; the sidebar rail is the map, the tab strip is the current act |
| Buttons | primary (navy or teal-ink fill, white text), secondary (white, navy outline), quiet (text only), destructive (error ink). Labels are verbs. |
| Answer choices | radio-style rows, whole row is the target; selected = outline + check mark, not colour alone |
| Feedback banner | icon + heading ("Correct" / "Not yet" / "Hint") + one sentence naming what to reconsider |
| Hint drawer | three levels (idea, steps, worked example); never shows the answer on the first miss |
| Callouts | notice, remember, careful: one icon + one colour tint each, same padding |
| Vocabulary chip | term with dotted underline; opens the definition; never colour-only |
| Progress | bar with text ("3 of 5"); stars are decorative |

## 6. Illustration and diagrams

One visual language: flat shapes, 2px strokes, 8px corner radii, palette colours only (navy, teal, amber, tints,
white, text). No stock photos, no clip-art mixing, no violet. Math visuals (graphs, number lines, tape diagrams)
share one spec: gridlines 1px `--ds-tint-navy-16`, axes 2px navy, ticks 12px labels at 13px type, scale taken from
lesson data and never altered. Every diagram has alt text or an `aria-label`. Contexts (food, sports, travel,
school) are inclusive and appropriate for grade 6 English learners.

## 7. Iconography

One line-icon set (2px stroke, rounded caps), inline SVG, paired with a text label wherever meaning matters.
Emoji are not used as functional icons (controls, tabs, status). Decorative emoji in lesson stories are allowed
but never carry meaning alone.

## 8. Motion

150ms for UI, 200ms for panels, 250ms for page-level changes, 600ms for celebration; one easing curve
(`--ds-easing`). No decorative motion. Everything has a `prefers-reduced-motion` alternative (no movement,
state changes only). Celebration is a short, earned, non-flashing confirmation.

## 9. Voice and microcopy

Warm, direct, encouraging; never babyish, sarcastic or blaming. Second person, present tense, short sentences,
grade 5 reading level except defined math terms. Sentence case for headings and buttons. Buttons are verbs
("Check answer", "Next question"). Feedback says what to try ("Check which amount comes first"), never just
"wrong" or "Incorrect, try again". At most one exclamation mark per screen. Serial comma. Numerals for all
quantities in math problems; words for one through nine in plain prose. Money as `$4.50`; times as `3:30 p.m.`.
The preferred-term list lives in `engine/core/copy-dictionary.js`; one concept has one name across lessons.

## 10. Accessibility inside the style

Focus ring on every interactive element in one consistent colour; targets ≥ 44px; no colour-only meaning; text
resizes to 200% without loss; high-contrast and reduced-motion modes; live regions announce feedback; headings
are in order; every image has alt text or is marked decorative.

## Implementation status

*Updated as work lands; the status column is the honest answer to "is this true yet?".*

| Rule | Status |
|---|---|
| Page-level stylesheet no longer leaks into lessons | Done (commit 1) |
| Level markers free of colour-only and purple emoji | Done (commit 1) |
| Tokens + generator + computed contrast gate | Done |
| Everything else in this guide | See the final report |
