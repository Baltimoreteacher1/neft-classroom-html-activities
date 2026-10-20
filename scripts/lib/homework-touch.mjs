/**
 * Touch targets for the family homework page on a phone.
 *
 * Measured 2026-10-20 at 390px on lesson 4-3: 47 controls on the Check tab alone
 * were 38-42px tall (stepper dots, the hint and check buttons, the matching
 * drop-downs, the sound toggle), under the 44px a thumb needs. One rule for
 * every control inside the page container, rather than a size per widget.
 *
 * Vocabulary words are buttons that sit inside a sentence; stretching them to
 * 44px would break the line spacing, and WCAG 2.5.8 exempts inline targets, so
 * they are left alone.
 */
export const TOUCH_CSS = `
/* ===== Phone touch targets (scripts/lib/homework-touch.mjs) ===== */
@media (max-width: 700px) {
  .container button:not(.obj-term):not(.obj-term-glue),
  .container summary,
  .container select,
  .container input[type="text"],
  .container input[type="number"],
  .container input:not([type]),
  .container input[type="file"],
  .container .btn,
  .sound-toggle-btn { min-height: 44px; }
  .sound-toggle-btn { min-width: 44px; }
  .container button:not(.obj-term):not(.obj-term-glue) { min-width: 44px; }
}
`;
