# UX and accessibility

## Checked in source

- `assets/shared.css` adds a teal focus ring (`outline: 3px solid #115e59`), a 44px minimum on buttons, links-as-buttons, summaries, and tabs, and correct / incorrect feedback colors in dark ink on light fills.
- Reduced motion on the shared activity shell turns off animation and transition for `.page-shell`, cards, heroes, and button links. It does not use a site-wide `!important` rule.
- Curriculum home summaries and links in the new Teach today / Plan / Respond / Resource library block use 44px targets and a 3px focus outline.
- The exponent repair form and the practice-arc chips set 44px controls.
- The ratio quantity and statement buttons use the existing lens row button plus a 44px minimum.
- Hint bodies stay in the existing ladder, which already exposes one rung at a time and has an accessible name.
- Family and lesson language switches were inspected in source. They change language attributes and labels. They do not assign input `.value`.

## Not run

- No keyboard walk in a browser.
- No contrast measurement (axe or a computed-style probe).
- No reduced-motion check in a browser.
- No mobile layout check at 375px or 390px.
- No screen-reader pass.

Those checks need a browser. This environment did not complete one. Do not treat the token additions as an accessibility audit of the 84 lessons.
