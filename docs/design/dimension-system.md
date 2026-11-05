# EduWonderLab dimensional design system

Math as lit, tactile objects on a drafting desk. This is the one visual language for
the curriculum hub, units, lessons, practice, family pages, games, labs, projects and
teacher tools. A page gets its own composition; it does not get its own look.

## Files and owners

| File                              | Owns                                                                                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `assets/dimension.css`            | tokens, elevation, ceramic surfaces, keycap controls, the iso tone model, the page stage, motion/contrast/print rules. Imported by `assets/curriculum-system.css`, so every shell page has it. A generated `stage-art` block sits at the end: do not hand-edit it. |
| `assets/curriculum-publisher.css` | the homepage composition only (stage hero, dock, journey, portals).                                                                                                                                                                                                |
| `tools/lib/iso.mjs`               | isometric solids (box, cyl, sphere, grid, label, shadow) in class mode and baked mode.                                                                                                                                                                             |
| `tools/lib/iso-art.mjs`           | the artwork: ten unit emblems, the hero, the destination glyphs, the page-stage objects.                                                                                                                                                                           |
| `tools/sync-curriculum-shell.mjs` | writes the artwork into `curriculum/index.html` and the `stage-art` block. `--check` is the freshness gate (`tools/curriculum-shell.test.mjs`).                                                                                                                    |
| `assets/dimension-depth.js`       | the hero's pointer depth cue.                                                                                                                                                                                                                                      |

Add a new illustration by drawing it in `iso-art.mjs`; never paste hand-made SVG into a page.

## Tokens (all `--dm-*`, defined on `:root`)

- Ink and paper: `--dm-night #0d273d`, `--dm-navy #17324d`, `--dm-paper #f7f4ec`, `--dm-paper-2 #efe9db`, `--dm-card #fff`.
- Accents: `--dm-teal #1fa6a2` (a fill; text uses `--dm-teal-ink #0c6f6b`), `--dm-brass #f2c15b` (text uses `--dm-brass-ink #8a5a00`).
- Text: `--dm-text #24323f`, `--dm-muted #4a555e` (both clear 4.5:1 on white and on paper).
- Elevation: `--dm-e1` resting, `--dm-e2` raised, `--dm-e3` lifted. Shadows are navy-tinted, a contact shadow plus an ambient one, with a lit white top edge and a thickness lip.
- Shape: `--dm-radius 16px`, `--dm-radius-sm 10px`. Motion: `--dm-ease`. Type: `--dm-font-display` (Fraunces) for headings and numbers, `--dm-font-body` (Hanken Grotesk).
- Units: `--unit-1` … `--unit-10`. Use the unit colour as the `a` tone of that unit's art and as a rule or glow, never as body text.

The palette is the locked brand palette in `engine/design/tokens.json`. No violet, purple
or magenta anywhere (`npm run validate:palette`; hue 255-335 is forbidden).

## Lighting and materials

- Light comes from the upper left. A solid has a lit top, a body face and a shaded face.
- Ceramic surface (cards, panels): white to warm-white gradient, a 1px navy-tinted border, `--dm-e1`/`--dm-e2`.
  Interactive surfaces rise on hover (`translateY(-4px)`, `--dm-e3`) and settle on press.
- Keycap control (buttons, chips): a lit top, a 3px darker lower edge, and it presses down 2px on `:active`.
- Stage (dark hero): navy gradient with a teal glow behind the object, a receding graph floor, brass as the single accent.
- Illustrations are isometric solids with class-mode faces (`a` unit colour, `b` brass, `c` ink, `d` ceramic, `e` teal).
  Pages set `--tone-a-base`; the faces derive themselves. Baked mode is for CSS background images only.
- One bold element per page. Everything around it stays quiet.

## Rules that keep it learning-first

- Never put decoration over mathematical notation, a manipulative, a workspace or an answer area. The page chrome
  gets depth; the maths surface stays flat, high-contrast and unmoved.
- Motion answers a person's action (hover, press, select, correct). The only unprompted motion is the homepage
  hero assembling once. Nothing loops. `prefers-reduced-motion` removes transforms and animation.
- WCAG 2.2 AA: 4.5:1 text, 3:1 non-text, 44px targets, a visible focus ring on every control (brass ring on the dark
  bar, blue ring on paper), `prefers-contrast: more` and `forced-colors` flatten shadows to 2px borders.
- Chromebook budget: no blur filters, no `backdrop-filter`, no animated gradients, no canvas/WebGL on content pages.
  `filter: drop-shadow` is allowed on one illustration per view.
- `!important` appears only for the desk background in `dimension.css` (documented there).
- The family homework design system (`assets/design/family/*`) and the lesson engine tokens
  (`engine/styles/ds-tokens.generated.css`) keep their own token files; map to them, do not fork them.

## Gates to run for any visual change

`npm run validate:palette`, `npm run validate:design-tokens`, `npm run validate:css-integrity`,
`npm run validate:family-design-tokens`, `npm run qa:fast`, and the page's own browser gate
(`validate:learning-labs-browser`, `validate:projects-gallery-browser`, `validate:all-resources-browser`, …).
