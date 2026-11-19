// Calm scrolling for the whole lab. A click should change what is on the screen, not where the screen is.
//
//   keepInView(el)      scrolls ONLY when `el` is out of sight, and only as far as the nearest edge (never to the top
//                       of the page, never centred), so a control or answer the learner is using stays where it is.
//   installCalmFocus()  makes element.focus() with no explicit `preventScroll` behave the same way. The browser default
//                       scrolls the focused element to the middle of the window, which is the page "jumping" after a
//                       button redraws a panel. Keyboard Tab is untouched (it does not go through focus()); an explicit
//                       `focus({ preventScroll })` keeps whatever the caller asked for.
const headerHeight = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--lab-top-h");
  return Number.parseFloat(v) || 0;
};
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True when the element sits fully inside the window below the sticky header (or fills it, if it is taller). */
export function inView(el, pad = 8) {
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return true; // not laid out (hidden): nothing to scroll to
  const top = headerHeight() + pad;
  const bottom = innerHeight - pad;
  return (r.top >= top && r.bottom <= bottom) || (r.top < top && r.bottom > bottom);
}

/** Bring `el` into view with the least movement; does nothing when it is already visible. Returns true if it scrolled. */
export function keepInView(el, { smooth = true } = {}) {
  if (!el || inView(el)) return false;
  el.scrollIntoView({ block: "nearest", behavior: smooth && !calm() ? "smooth" : "auto" });
  return true;
}

let installed = false;
export function installCalmFocus() {
  if (installed || typeof HTMLElement === "undefined") return;
  installed = true;
  const original = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function calmFocus(options) {
    if (options && typeof options === "object" && "preventScroll" in options) return original.call(this, options);
    original.call(this, { ...options, preventScroll: true });
    keepInView(this);
  };
}
