# shared/ui: component library

Small, additive component set for the BCPSS Studio and later teacher surfaces. It restyles nothing that exists
today. Pages opt in by loading the stylesheets and importing a factory.

## Source of truth

Colour, type, spacing, radius, elevation, motion and the 44px target come from `engine/design/tokens.json`,
compiled to `engine/styles/ds-tokens.generated.css` by `tools/build-design-tokens.mjs` (`validate:design-tokens`).
`shared/ui` adds no colour and no size of its own. Palette: navy, teal, amber, coral (error), neutrals; no
purple, violet or indigo (`validate:no-purple`, plus hue checks in `tools/ui-tokens.test.mjs`).

## Files

| File | Role |
| --- | --- |
| `theme.css` | Roles (`--ui-*`) for light and for `[data-ui-theme="dark"]`, each one a `var(--ds-*)`. The reduced-motion switch. |
| `ui.css` | Component styles. |
| `print.css` | Print sheet and the print reset. `@page` margin 0.5in; no page-break rules. |
| `fonts.css` | `@font-face` for the existing woff2 files in `engine/styles/fonts`. No CDN. |
| `contrast-pairs.js` | Declared foreground/background pairs per theme, with floors. Read by the test. |
| `h.js`, `index.js`, one `.js` per component | Plain browser-safe ESM. Each component exports a factory returning an element. |

Load order on a page: `ds-tokens.generated.css`, `fonts.css`, `theme.css`, `ui.css`, `print.css`. Put
`class="ui-page"` on a container to get the page background, text colour and body font; put
`data-ui-theme="dark"` on any container to switch it.

## Components

| Factory | Keyboard | Notes |
| --- | --- | --- |
| `createButton` | Enter, Space (link: Enter) | variants primary, secondary, quiet, danger; `pressed` makes a toggle with a check mark |
| `createCard` | one tab stop (title link covers the card) | caller sets heading level |
| `createTabs` | Arrow keys (direction follows `dir`), Home, End; roving tabindex | automatic activation; `select(id)`; `ui-tabs-change` event |
| `createDialog` | Tab and Shift+Tab trapped, Esc closes, focus returns to the opener | page made `inert` while open; copies opener's theme, `dir`, `lang` |
| `createBadge` | none (not interactive) | tone = fill + distinct mark shape + optional hidden text |
| `createBandSelector` | native radio keys | bands are passed in (the Studio uses `TIERS`); teacher-side only |
| `createVocabularyCard` | optional "Hear it" button | each translation has its own `lang` and `dir` |
| `createActivityCard` | one link, name "Open activity: <title>" | materials default to "Paper and pencil" |
| `createPrintSheet` | n/a | white paper whatever the theme; write-in Name and Date lines; ruled lines |

## Rules every component keeps

- Visible focus ring: `outline: 3px solid var(--ui-focus)` (navy on light, amber on dark).
- Targets at least 44px (`--ds-target`) for buttons, tabs and band choices.
- Contrast: every pair in `contrast-pairs.js` is computed from the real tokens (`tools/lib/color-math.mjs`) in
  both themes: text 4.5, focus ring, control borders and tone marks 3. A role in `theme.css` that is not in a pair
  fails the test.
- Reduced motion: every transition and animation runs on `--ui-motion`, which is `0ms` under
  `prefers-reduced-motion: reduce`.
- RTL: logical properties only (`margin-inline`, `inline-size`, `inset`, `border-block-end`). The test rejects
  `margin-left`, `width`, `left`, `float`, `text-align: left` and similar.
- Print: borders carry the shapes in grayscale, buttons and badges lose fills, `.ui-no-print` hides chrome. No
  `page-break-*`, `break-*`.
- No `!important`, no raw colour literal, no external URL.
- Tone is never colour alone (badge mark shapes; band and toggle check marks).
- Text is appended as text nodes. There is no HTML-string path.

## Specimen

`#/design` in the Studio (`bcpss-teachers/studio/design/specimen.js`) renders every component in light and dark
with a right-to-left toggle. It is under the Studio, so the teacher gate in `functions/_middleware.js` applies.
Local preview: `npm run dev:local`, then `/bcpss-teachers/studio/#/design`.

## Tests

```sh
npm run test:ui     # tools/ui-components.test.mjs (jsdom behavior) + tools/ui-tokens.test.mjs (contrast, CSS rules)
```

Both files carry negative controls: a failing pair, a purple token, an unlisted role, a broken tablist, dialog
and radio group, and a CSS snippet with every banned construct must all be flagged.

## Adding a component

1. `shared/ui/<name>.js` with a factory that validates required input and throws a clear error.
2. Styles in `ui.css` (or `print.css`) using only `--ui-*` and `--ds-*`. New colour role: add it to both theme
   blocks as `var(--ds-*)` and add its pairs to `contrast-pairs.js`.
3. Export it from `index.js`, add a block to the specimen, and a behavior test with a negative control.
4. A component that shows a band, program or level label is teacher-side only. Students never see those labels.
