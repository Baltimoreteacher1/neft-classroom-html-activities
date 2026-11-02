# License notes: Family Math Studio art

All art in this directory is **original to this repository**. It was drawn by hand as SVG path data for Family Math Studio
(the people, objects, scenes, icons, hook cards, celebration set, math models, mark and wordmark) and, where marked in the README,
assembled by `tools/build-family-art.mjs` from shapes defined in `tools/lib/family-art-*.mjs`.

- No raster images, photographs, stock art, traced artwork or AI-generated imagery. Nothing was copied, traced or adapted from another
  icon set, clip-art library or illustrator. The icon geometry is new (24px grid, 1.75px round stroke); where a metaphor is shared
  with other sets (a house for home, a bulb for a hint) the drawing is not.
- No real people, likenesses, trademarks, logos or brand names. Every character is invented; names on cards (teams, stores, places)
  are generic placeholders supplied as slots.
- No fonts are embedded or fetched. The wordmark is monoline stroke geometry. Text inside models and cards uses the page's own
  font stack (`--ds-font-text`, then the system UI font).
- No external requests: no remote href, no `@import`, no script. `tools/validate-family-art.mjs` fails the build if any appear.
- The colours are the EduWonderLab design tokens (`engine/design/tokens.json`) plus a short illustration palette listed in
  `tools/validate-family-art.mjs` (`ART_EXTRA`). Unit accents are decorative; the unit number is always printed beside them.

Licence of this directory: the same as the rest of the repository (all rights reserved by its owner). Third-party material: none.

Recorded 2026-10-28.
