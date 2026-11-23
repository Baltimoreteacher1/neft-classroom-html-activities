// Visual specs -> DOM. core/visuals.js is written by another worker; if it is missing the alt text is shown instead,
// so an activity never breaks because a picture could not be drawn.
import { h } from "../../core/dom.js";

let mod;
export async function loadVisuals() {
  if (mod !== undefined) return mod;
  try {
    mod = await import("../../core/visuals.js");
  } catch {
    mod = null;
  }
  return mod;
}

/** Call after `await loadVisuals()`. Returns a <figure> holding the drawn spec (or its alt text). */
export function visualEl(spec, className = "st-visual") {
  const fig = h("figure", { class: className });
  if (!spec) return fig;
  if (mod?.renderVisual) {
    try {
      fig.innerHTML = mod.renderVisual(spec);
      return fig;
    } catch {
      /* fall through to alt text */
    }
  }
  fig.append(h("p", { class: "st-visual-alt", role: "img", "aria-label": spec.alt }, spec.alt));
  return fig;
}
