/**
 * Desktop centering. Until 2026-10-28 the family page laid itself out in two columns from 900px up:
 * the Learn stop put the big idea, the worked example and every later card in a right-hand column
 * beside an empty left half, and the hero pushed its experience badge, route options and Start button
 * to the right edge. Joel: anything that just goes to the right side should be centered.
 *
 * One column, centered, from 900px up. Phones were already one column and are untouched. This sheet
 * loads after every other homework layer; the older layers use !important, so these rules carry
 * `body` for specificity and reset the grid placements the older rules set.
 */
export const CENTER_CSS = `
@media screen and (min-width: 900px) {
body .hw-topbar { justify-content: center; }
/* Two equal columns so a pair of items sits side by side around the centre line; anything wider spans both. */
body .hw-hero-body { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; justify-items: center; text-align: center; column-gap: 16px; }
body .hw-hero-body > * { grid-column: 1 / -1 !important; grid-row: auto !important; justify-self: center !important; max-width: 100%; }
body .hw-hero-body > .hw-hero-kicker { grid-column: 1 !important; grid-row: 1 !important; justify-self: end !important; margin: 0; }
body .hw-hero-body > .hw-hero-controls { grid-column: 2 !important; grid-row: 1 !important; justify-self: start !important; align-self: center; margin: 0; display: flex; }
body .hw-hero-body > .hw-hero-head { grid-row: 2 !important; }
body .hw-hero-body > .hw-tonight { grid-column: 1 !important; justify-self: end !important; justify-content: flex-end; }
body .hw-hero-body > .hw-experience-banner { grid-column: 2 !important; justify-self: start !important; }
body .hw-hero-controls .lang-selector-card { margin-inline: 0; }
body .hw-hero-body:not(:has(> .hw-experience-banner)) > .hw-tonight { grid-column: 1 / -1 !important; justify-self: center !important; justify-content: center; }
body .hw-hero-body > .hw-hero-lesson { width: 100%; margin-top: 0; padding-top: 0; }
body .hw-hero-body, body .hw-hero-body * { text-align: center !important; }
body .hw-route-option, body .hw-route-option * { text-align: left !important; }
body .hw-hero-body > .hw-hero-head { margin-top: 10px; margin-bottom: 6px; }
body .hw-hero-body > .hw-hero-lesson { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px; margin-top: 4px; }
body .hw-hero-body > .hw-hero-lead, body .hw-hero-body > .hw-hero-bigidea { max-width: 68ch; }
body .hw-hero-body > .hw-hero-bigidea { border-left: 0; border-top: 4px solid var(--amber, #f2c15b); margin-top: 6px; padding: 6px 14px; }
body .hw-hero-lesson-meta, body .hw-hero-titles { text-align: center; }
body .hw-hero-titles h1, body .hw-hero-lesson-title { font-size: clamp(1.6rem, 2.4vw, 2.1rem) !important; }
/* The experience badge was white text on a pale tint (unreadable); it keeps its place, now legible. */
body .hw-experience-banner { background: #fff; border: 1px solid var(--fp-rule, #d9d2c3); border-radius: 999px; }
body .hw-experience-banner, body .hw-experience-banner * { color: var(--fp-ink, #17324d) !important; }
/* Route choice: the heading above, then the two options and Start side by side. */
body .hw-hero-body > .hw-route-chooser { grid-template-columns: minmax(0, 1fr) auto !important; justify-items: center; width: min(100%, 1000px); margin-top: 8px; padding: 8px 14px; column-gap: 14px; }
body .hw-route-chooser > * { grid-column: 1 / -1 !important; margin-inline: auto; }
body .hw-route-chooser > .hw-route-options { grid-column: 1 !important; justify-content: center; }
body .hw-route-chooser > #hw_start_button { grid-column: 2 !important; margin: 0; align-self: center; }
body #hw_panel_learn { grid-template-columns: minmax(0, 820px) !important; justify-content: center; }
body #hw_panel_learn > *, body #hw_panel_learn > .learn-card:has(> #hw_learn_try), body #hw_panel_learn > #hw_learn_try { grid-column: 1 !important; grid-row: auto !important; }
}
`;
