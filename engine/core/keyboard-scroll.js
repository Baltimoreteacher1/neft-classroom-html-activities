// Keyboard scrolling for content that does NOT live in the document scroller.
//
// Several lesson surfaces put their content inside a fixed, `overflow-y: auto`
// container (the Vocab / Learn It / Guided Notes takeover locks `html, body`
// with `overflow: hidden`; the small-group studio panels scroll internally).
// The browser only maps Arrow / Page / Home / End / Space to a scroll when the
// FOCUSED element sits in a scrollable box — and after a click on a button, or
// on a fresh page load, focus is on <body>, which cannot scroll. The result is
// a page that scrolls with a mouse wheel or a finger but ignores the keyboard
// entirely, which is exactly what a keyboard-only student has.
//
// This installs one document-level fallback: when a vertical scroll key is
// pressed and the document itself cannot scroll, find the scroller under the
// middle of the viewport (what the student is looking at) and scroll that.
// It never fires when a form field, slider, tab list or other arrow-driven
// widget has focus, and it never overrides a handler that already acted
// (`defaultPrevented`).

const LINE = 64; // one Arrow press
const PAGE_FRACTION = 0.85; // one PageUp/PageDown press

// Elements that own the arrow keys themselves — typing, sliders, tab strips,
// and the interactive visuals that move a point with the arrows.
const INTERACTIVE = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const ARROW_WIDGET_ROLES = ["slider", "tab", "tablist", "listbox", "option", "menu", "menuitem"];

function ownsArrowKeys(node) {
  if (!node || node === document.body || node === document.documentElement) return false;
  if (node.closest?.(INTERACTIVE)) return true;
  let el = node;
  while (el && el !== document.body) {
    const role = el.getAttribute?.("role");
    if (role && ARROW_WIDGET_ROLES.includes(role)) return true;
    // Manipulatives (number line, coordinate plane, box plot…) bind arrows on
    // their own focusable handles.
    if (el.hasAttribute?.("data-arrow-keys")) return true;
    el = el.parentElement;
  }
  return false;
}

function canScroll(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (el.scrollHeight - el.clientHeight < 4) return false;
  const overflowY = getComputedStyle(el).overflowY;
  return overflowY === "auto" || overflowY === "scroll";
}

// The document scroller works normally whenever the page is actually taller
// than the viewport AND nothing has locked it.
function documentScrolls() {
  const html = document.documentElement;
  const locked =
    getComputedStyle(html).overflowY === "hidden" ||
    getComputedStyle(document.body).overflowY === "hidden";
  return !locked && html.scrollHeight - html.clientHeight > 4;
}

// The scroller the student is looking at: walk up from whatever is painted in
// the middle of the viewport. Falls back to the focused element's chain.
function findScroller() {
  const seeds = [
    document.elementFromPoint(
      Math.round(window.innerWidth / 2),
      Math.round(window.innerHeight / 2),
    ),
    document.activeElement,
  ];
  for (const seed of seeds) {
    let el = seed;
    while (el && el !== document.body) {
      if (canScroll(el)) return el;
      el = el.parentElement;
    }
  }
  return null;
}

function deltaFor(key, scroller) {
  const page = Math.max(120, scroller.clientHeight * PAGE_FRACTION);
  switch (key) {
    case "ArrowDown":
      return LINE;
    case "ArrowUp":
      return -LINE;
    case "PageDown":
    case " ":
    case "Spacebar":
      return page;
    case "PageUp":
      return -page;
    case "Home":
      return -scroller.scrollTop;
    case "End":
      return scroller.scrollHeight;
    default:
      return 0;
  }
}

let installed = false;

export function enableKeyboardScrolling() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key === "Spacebar" ? " " : e.key;
    if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(key)) return;
    // Space is "press this" on a focused control long before it is "scroll".
    if (key === " " && document.activeElement && document.activeElement !== document.body) return;
    if (ownsArrowKeys(document.activeElement) || ownsArrowKeys(e.target)) return;
    if (documentScrolls()) return;

    const scroller = findScroller();
    if (!scroller) return;
    const delta = deltaFor(key, scroller);
    if (!delta) return;
    e.preventDefault();
    scroller.scrollBy({
      top: delta,
      behavior: key === "ArrowUp" || key === "ArrowDown" ? "auto" : "smooth",
    });
  });
}
