# Family Math Studio art kit

Original SVG, drawn for this repo (see `LICENSE-NOTES.md`). No raster, no external request, no script. Generated files come from
`npm run build:family-art`; `npm run validate:family-art` proves every file is well formed, small, accessible and in the palette.

## What is here

| Path | What | Count |
| --- | --- | --- |
| `icons.svg` | ONE inline-able sprite, 24px grid, 1.75px round stroke, `currentColor` | 45 icons + 9 filled variants |
| `scenes/unit-NN.svg` | Unit hero band, 1200x320, crops to 390x180 (`preserveAspectRatio="slice"`), decorative | 10 |
| `spots/*.svg` | Spot illustrations, 240x180, `role="img"` with a `<title>` | 32 |
| `hook-cards.mjs` | Price tag, recipe card, score board, map pin, ticket, receipt as pure SVG functions | 6 |
| `hooks/*.svg` | Static English samples of the hook cards | 6 |
| `math-models.mjs` | `renderModel({kind,data,alt},{lang})`, ten model kinds (lesson data to SVG) | 10 |
| `celebration.svg`, `art.css` | badge, stars, check-draw, confetti shapes; motion only under `prefers-reduced-motion: no-preference` | 12 symbols |
| `brand/` | mark, wordmark, favicon, app icons, manifest, one Open Graph card per unit and language | see `brand/` |
| `units.json` | Unit accent, tint, dark tint and names (EN from the Reveal TOC, ES from the landing data) | 10 |

## Using the art

Inline the sprite once per page, then `<svg class="fi" aria-hidden="true"><use href="#fi-check"/></svg>` (`.fi{width:1.5rem;height:1.5rem}`).
Icons are decorative unless they are the only label of a control; give that control an accessible name instead of titling the icon.

Scenes and spots read these CSS custom properties, each with a token fallback inside the file:
`--ink`, `--paper`, `--unit-accent`, `--unit-accent-tint` (set by `[data-unit="N"]` in `art.css`), plus `--art-card`, `--art-ground`,
`--art-amber`, `--art-coral`, `--art-blue`, `--art-green`. Skin and hair tones are fixed on purpose and do not change in dark mode.
Shapes carry meaning; hue is decoration. Everything reads in grayscale.

Inline an SVG to get theming. Loaded through `<img>` or CSS `url()` it shows the fallback colours (the light theme).

Decorative art is `aria-hidden="true"`. Informative art ships `role="img"` and a `<title>`; if the page already says the same thing in
words, put `aria-hidden="true"` on the host instead of removing the title.

## Math models

`import { renderModel } from "./math-models.mjs"`; `renderModel({ kind, data, alt }, { lang: "en" | "es" })` returns an SVG string (`""` for
`kind: "none"`). `alt` becomes the `<title>`; the `<desc>` is computed from the numbers passed in, and an unknown value is described as
unknown, never revealed. Data shapes follow `docs/specs/family-homework-v3.md`. Beyond that table: `area.dims` also takes `offset` (parallelogram
top-edge shift) or `slant` (side length; the offset is derived), `split: [a, b]` on a rectangle (the two parts must add up to `base`), and
`apex` on a triangle; a `unit` of `$`, `dollars` or `dólares` prints as `$20`. An unknown kind, a missing field or an unrecognized key throws.
Ids carry the language (`fm-<hash>-en-...`), so the EN and ES copies of a model can share a page. Gallery: `design/family-system/art.html`.

## Rendering the PNGs

`npm run build:family-brand-icons` renders `brand/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`,
`favicon-32.png` and `brand/og/unit-NN[-es].png` from the SVG sources with the repo's Playwright Chromium (fixed viewport, device scale 1,
no animation). Open Graph text uses the system UI font at render time, so those PNGs are reproducible per machine, not across machines.

## Icon list (ids)

- `fi-home`
- `fi-globe`
- `fi-grownup`
- `fi-text-size`
- `fi-speaker`
- `fi-save`
- `fi-more`
- `fi-check`
- `fi-hint`
- `fi-try-again`
- `fi-star`
- `fi-badge`
- `fi-unlock`
- `fi-lab`
- `fi-game`
- `fi-print`
- `fi-share`
- `fi-camera`
- `fi-chat`
- `fi-map`
- `fi-kitchen`
- `fi-ticket`
- `fi-price-tag`
- `fi-receipt`
- `fi-scoreboard`
- `fi-bus`
- `fi-store`
- `fi-garden`
- `fi-phone`
- `fi-ruler`
- `fi-balance`
- `fi-grid`
- `fi-coordinate`
- `fi-chart`
- `fi-calculator`
- `fi-book`
- `fi-pencil`
- `fi-eye`
- `fi-question`
- `fi-arrow-next`
- `fi-arrow-back`
- `fi-close`
- `fi-menu`
- `fi-play`
- `fi-pause`

Filled (active) variants:

- `fi-home-fill`
- `fi-speaker-fill`
- `fi-save-fill`
- `fi-hint-fill`
- `fi-star-fill`
- `fi-badge-fill`
- `fi-chat-fill`
- `fi-play-fill`
- `fi-pause-fill`

## Scenes

- `scenes/unit-01.svg`: Unit 1, Math Is...
- `scenes/unit-02.svg`: Unit 2, Understanding the World Around Us Through Statistics
- `scenes/unit-03.svg`: Unit 3, Ratios and Rates
- `scenes/unit-04.svg`: Unit 4, Understand and Use Percentages
- `scenes/unit-05.svg`: Unit 5, Solve Area, Surface Area, and Volume Problems
- `scenes/unit-06.svg`: Unit 6, Numerical and Algebraic Expressions
- `scenes/unit-07.svg`: Unit 7, Integers, Rational Numbers, and the Coordinate Plane
- `scenes/unit-08.svg`: Unit 8, Equations and Inequalities
- `scenes/unit-09.svg`: Unit 9, Relationships Between Two Variables
- `scenes/unit-10.svg`: Unit 10, Math Is... (mindset scene)

## Spot illustrations

- `spots/groceries.svg`
- `spots/bus.svg`
- `spots/court.svg`
- `spots/kitchen.svg`
- `spots/garden.svg`
- `spots/phone.svg`
- `spots/corner-store.svg`
- `spots/rec-center.svg`
- `spots/recipe.svg`
- `spots/sneakers.svg`
- `spots/lemonade.svg`
- `spots/supplies.svg`
- `spots/pizza.svg`
- `spots/pool.svg`
- `spots/bike.svg`
- `spots/thermometer.svg`
- `spots/elevator.svg`
- `spots/books.svg`
- `spots/cookies.svg`
- `spots/balance.svg`
- `spots/savings-jar.svg`
- `spots/rain-gauge.svg`
- `spots/ticket.svg`
- `spots/park-map.svg`
- `spots/fruit-scale.svg`
- `spots/tile-floor.svg`
- `spots/moving-box.svg`
- `spots/fish-tank.svg`
- `spots/survey.svg`
- `spots/soccer.svg`
- `spots/paint.svg`
- `spots/stairs.svg`
