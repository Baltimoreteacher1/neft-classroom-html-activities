# Family Math Studio design system (v3.0)

Status: optional asset set, **not yet wired** into the homework generators, `validate`, `qa-run` or the CLAUDE.md gate table.
Source of truth for the contrast numbers: [`family-contrast-matrix.md`](family-contrast-matrix.md) (generated).
Live reference: `/design/family-system/` (every token and component, EN/ES, light/dark/high contrast, 320/390/768/1280 frame).

## Files

| File                                            | Role                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/design/family/tokens.css`               | The ONLY file allowed a raw color. Fonts, colors (`light-dark()`), type, space, shape, elevation, motion, z-index, 10 unit palettes + motifs, reader options. |
| `assets/design/family/family.css`               | The ONE component stylesheet. `@layer reset, tokens, base, components, patterns, utilities, unit-theme, print`.                                               |
| `assets/design/family/fonts/`                   | Baloo 2 (display), Nunito (text), Atkinson Hyperlegible (dyslexia option only). All SIL OFL 1.1, latin WOFF2.                                                 |
| `design/family-system/`                         | The specimen (no build, no network).                                                                                                                          |
| `tools/build-family-tokens-report.mjs`          | Computes every contrast pair, writes the matrix, fails under 4.5:1 text / 3:1 UI / 7:1 high-contrast text.                                                    |
| `tools/validate-family-design-tokens.mjs`       | Static + rendered caps gate (`npm run validate:family-design-tokens`). Not chained into `validate`.                                                           |
| `tools/verify-family-design-system-browser.mjs` | axe, focus, reflow, forced colors, behavior (`npm run validate:family-design-system-browser`).                                                                |

Load order on a page: `tokens.css`, then `family.css`, then a tiny per-lesson file of custom properties. Preload `nunito-var.woff2` and `baloo2-var.woff2`.
Browsers: `light-dark()` needs Chrome/Edge 123, Safari 17.5, Firefox 120.

## Rules

1. If two things look different, they mean different things. If they mean the same, they look the same.
2. One raised card and one inset card. An inset may sit inside a raised card; nothing nests deeper.
3. A wrong answer is never red. "Try another look" is soft amber, dashed, with an eye icon, and nudges 3px (no shake). Red (`--fm-error*`) is for system faults and delete confirmation.
4. Meaning is never color alone: every state also has a shape, a word, or an outline style (done = check, current = thick ring, unknown = dashed + "?").
5. Teal and amber brand colors are fills. Text and outlines use `--fm-accent-ink` / `--fm-highlight-ink`.
6. Targets are at least 44px (chips and dots get an invisible pad), the focus ring is 3px with a 2px offset and a halo, body text is 16px or more, the smallest text is 13px.
7. Logical properties only; no ID selectors; no `!important` except the three documented ones (`[hidden]`, reduced motion, print); no inline `style` except a data-driven `--custom-property` (`--pct`).
8. Fonts and sizes only through tokens. At most 8 sizes, 5 radii, 5 shadows, 8 color families per page.

## Tokens (summary)

- Colors: surface / raised / sunken / inverse; text / muted / inverse; border (decor) / border-strong (UI edge); primary (+hover, press, on-primary); accent (teal) / accent-ink / accent-tint; highlight (amber) / highlight-ink / highlight-tint; success, error, info, look; focus, focus-halo, focus-inverse; math mapping `--fm-m-part|whole|unknown|given|answer`.
- Type: `--fm-fs-xs..4xl` (13px to ~44px, fluid `clamp()`), `--fm-lh-body 1.5`, `--fm-lh-heading 1.15`, measure 68ch (52ch with "shorter lines"). Digits are tabular and lining; minus is U+2212, times and divide are real signs.
- Space `--fm-space-1..8` (4/8 scale, rem). Radii `xs 4, sm 8, md 14, lg 24, pill`. Shadows `raised, float, sheet, inset, press`. Motion 120/200/320ms, `--fm-ease`, `--fm-ease-soft`. Z-index `--fm-z-raised..tooltip`.
- Breakpoints (literal in media queries): 320, 390, 768 (48rem), 1024 (64rem), 1280 (80rem), 1920.
- Reader options on `<html>`: `data-theme="light|dark|contrast"`, `data-text-size="100|115|130|150"`, `data-spacing="more"` (WCAG 1.4.12), `data-reading="dyslexia"`, `data-measure="narrow"`, `data-motion="reduce"`, `data-unit="1..10"`.

### Adjusted brand values (documented)

`--fm-accent-ink` `#136E6B` (engine `#177B78` was 4.22:1 on the inset surface), `--fm-highlight-ink` `#7A5F28` (engine `#886C33` was 4.51:1 on paper), `--fm-success-ink` `#0B6B40` (success on its own tint was exactly 4.50). Every other brand value equals `engine/design/tokens.json`; the report script fails if they drift.

## Unit accents

Hue is never the identity alone: each unit also has a number and a motif (`--unit-motif`, a CSS mask). No violet, purple or magenta. Adjacent units differ in grayscale luminance by at least 0.02.

| Unit | Name                            | Hue         | Accent (light) | Ink (light) | Motif         |
| ---: | ------------------------------- | ----------- | -------------- | ----------- | ------------- |
|    1 | Math Is Discovery               | green       | `#2B7A48`      | `#205A35`   | spark         |
|    2 | Statistics                      | navy        | `#17324D`      | `#17324D`   | bars          |
|    3 | Ratios & Rates                  | clay        | `#BE5D33`      | `#7F3E22`   | two bars      |
|    4 | Percents                        | cyan        | `#1E6980`      | `#185568`   | percent sign  |
|    5 | Area, Surface Area & Volume     | gold        | `#AC7F1E`      | `#694D12`   | cube          |
|    6 | Expressions                     | rose        | `#93374F`      | `#833146`   | parentheses   |
|    7 | Integers & the Coordinate Plane | blue        | `#3674BB`      | `#265183`   | axes          |
|    8 | Equations & Inequalities        | olive       | `#5A7025`      | `#45561C`   | equals        |
|    9 | Two-Variable Relationships      | jade        | `#2D8D77`      | `#1D5A4C`   | line graph    |
|   10 | Math Is Synthesis               | slate       | `#515C6B`      | `#464F5C`   | three circles |

Dark and high-contrast values are in `tokens.css`; the matrix checks all 10 units in all 3 themes.

## Components and patterns

Class prefix `fm-`. Components: `fm-btn` (`--primary --quiet --danger --icon --lg --block`), `fm-seg`, `fm-switch`, `fm-chip` (`--accent --amber --success --info --unit`), `fm-vocab`, `fm-card` / `fm-card--inset`, `fm-callout` (`--watch --grownup --celebrate`), `fm-dots`, `fm-ring`, `fm-bar`, `fm-stepper`, `fm-disclosure`, `fm-tabs`/`fm-tab`, `fm-tooltip`, `fm-sheet` (native `<dialog>`), `fm-toast`, `fm-field`/`fm-input`/`fm-choice`/`fm-sort`, `fm-feedback` (`--right --look --fault`), `fm-hints`/`fm-rung`, `fm-flip`, `fm-match`/`fm-tile`, `fm-game`, `fm-cert`, `fm-state`, `fm-skeleton`.
Patterns: `fm-topbar`, `fm-stopbar` + `fm-actionbar` (the one bottom bar), `fm-hero` + `fm-routes`/`fm-route` + `fm-xp-badge`, `fm-hook` (`data-variant` price-tag, recipe, scoreboard, map-pin, ticket, receipt), `fm-learn`, `fm-split` + `fm-stage`, `fm-try`, `fm-celebrate` + `fm-confetti` (the only confetti), `fm-resume`, `fm-drawer__sec`, `fm-footer`, `fm-beads` (groups of 5/10 never split; labels are running totals; states filled, empty, selected, unknown). Math visuals: `fm-mv-part|whole|unknown|given|answer|axis|grid|label`.
Icons: components never require an icon; the specimen carries a small inline sprite. Production pages should load the shared sprite (`/assets/design/family/art/icons.svg`, ids `i-*`) and use `<svg class="fm-icon"><use href="...#i-check"/></svg>`.

## How a lesson overrides

Per-lesson CSS may only set custom properties: `data-unit` selects the palette; `--fm-hero-art: url(...)` sets the hero illustration; `--motif-color` recolors a motif; `--pct` drives rings and bars. Never restyle a component.

## Migration map (what replaces what)

| Old source                                                                                                       | Replaced by                                                      | Delete when                                      |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `assets/homework/homework-layer-*.css` (two ~9,300-line near-duplicates)                                         | `family.css` components and patterns (merged, one file)          | generators emit the `fm-` classes                |
| `scripts/homework-studio-skin.mjs` (`--st-*` tokens, `!important` skin)                                          | `tokens.css` semantic colors + `data-unit`                       | the studio skin string is no longer interpolated |
| `scripts/homework-themes.mjs` `UNIFIED_PALETTE` (navy `#15487f`, teal `#0284c7`, amber `#d97706`)                | brand navy/teal/amber in `tokens.css` + 10 real unit palettes    | per-lesson themes read `data-unit`               |
| `scripts/lib/homework-calm-css.mjs`, `scripts/lib/homework-experience-css.mjs`, `CO_LEARNING_CSS`                | base layer, `fm-callout`, `fm-feedback`, `fm-hints`, `fm-topbar` | their markup moves to `fm-` classes              |
| `curriculum/family-connections/homework-publisher.css`, `assets/family-paper.css` (`--fp-*`, `[data-unit]` hues) | `tokens.css` (`--unit-N-*`), `fm-hero`, `fm-footer`              | family pages load `family.css`                   |
| Legacy "Completed 0/0 · Accuracy · Streak" bar and unstyled buttons                                              | `fm-topbar`, `fm-stopbar`, `fm-btn`                              | removed with the generators                      |

Integration checklist: add `tokens.css` + `family.css` (hashed) to the generator; set `data-unit` and `lang` on `<html>`; replace markup per the specimen; append pilot pages to `PAGES` in `tools/validate-family-design-tokens.mjs`; then wire the two gates into `validate`, `qa-run.mjs` COVERAGE and the CLAUDE.md table, and delete their `qa-exempt.json` entries.

## Fonts and licenses

Baloo 2 (Ek Type), Nunito (Vernon Adams et al.) and Atkinson Hyperlegible (Braille Institute) are SIL Open Font License 1.1. Baloo 2 and Nunito are the same files already used by the warm-deck lesson skin (`engine/styles/fonts/`); Atkinson comes from `public/assets/fonts/`. They are copied here because `engine/` is not served and the specimen must work without a build. Fallback faces are size-adjusted to Arial from measured metrics. The fonts do not include `≈ ≠ ≤ ≥ π`; those fall back to the system font.
