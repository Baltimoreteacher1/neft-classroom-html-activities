// Re-render a region without losing the reader's place.
//
// Interactive pieces here (vocabulary flashcards, cloze options, Language Dive chunks, WIDA toggles) redraw a
// whole region with innerHTML. That destroys the control the person just used, so keyboard focus falls back to
// the top of the page and the browser has nothing to anchor the scroll to: the view lands somewhere unrelated.
// keepView() remembers the scroll offset and the focused control, runs the render, then puts both back.

const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]";

/** A selector that finds "the same control" again after a redraw (id, then data-* attributes, then position). */
function signature(root, el) {
  if (el.id) return { selector: `#${CSS.escape(el.id)}` };
  const data = Object.entries(el.dataset);
  if (data.length) {
    const attrs = data.map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${CSS.escape(v)}"]`);
    return { selector: `${el.tagName.toLowerCase()}${attrs.join("")}` };
  }
  return { index: [...root.querySelectorAll(FOCUSABLE)].indexOf(el) };
}

function locate(root, sig) {
  if (sig.selector) return root.querySelector(sig.selector);
  return sig.index >= 0 ? root.querySelectorAll(FOCUSABLE)[sig.index] || null : null;
}

export function keepView(root, render) {
  const x = window.scrollX;
  const y = window.scrollY;
  const active = document.activeElement;
  const sig = root && active && active !== document.body && root.contains(active) ? signature(root, active) : null;
  render();
  // Layout is forced here, so the restored offset is valid before the browser paints.
  window.scrollTo(x, y);
  if (sig && root) locate(root, sig)?.focus({ preventScroll: true });
}
