/**
 * Fills static markup from strings.js. Elements opt in with data attributes:
 *   data-t="key"        sets textContent
 *   data-t-label="key"  sets aria-label
 *   data-t-ph="key"     sets placeholder
 *   data-t-title="key"  sets title
 * {v} and other placeholders come from `vars`.
 */
import { t } from "./strings.js";

const ATTRS = [
  ["data-t-label", "aria-label"],
  ["data-t-ph", "placeholder"],
  ["data-t-title", "title"],
];

export function applyStrings(root, lang, vars = {}) {
  for (const el of root.querySelectorAll("[data-t]")) {
    el.textContent = t(lang, el.getAttribute("data-t"), vars);
  }
  for (const [from, to] of ATTRS) {
    for (const el of root.querySelectorAll(`[${from}]`)) {
      el.setAttribute(to, t(lang, el.getAttribute(from), vars));
    }
  }
}
