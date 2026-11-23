// Visual rendering shim for the vocabulary views: loads core/visuals.js once and exposes sync helpers.
// If the kit cannot load, a described placeholder keeps the page usable; the alt text is always present.
import { esc, h } from "../../core/dom.js";

let impl = null;
let loading = null;

/** Load core/visuals.js (once). Resolves to true when real rendering is available. */
export function ensureVisuals() {
  if (impl) return Promise.resolve(true);
  loading ||= import("../../core/visuals.js")
    .then((m) => {
      impl = typeof m.renderVisual === "function" ? m.renderVisual : null;
      return !!impl;
    })
    .catch(() => false);
  return loading;
}

/** Tests inject a renderer here. */
export function setRenderer(fn) {
  impl = fn;
}

const fallback = (spec) =>
  `<svg viewBox="0 0 480 320" role="img" aria-label="${esc(spec?.alt || "Picture")}" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="464" height="304" rx="12" fill="none" stroke="currentColor" stroke-dasharray="8 6"/><foreignObject x="24" y="24" width="432" height="272"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 18px system-ui;line-height:1.4;padding:8px">${esc(spec?.alt || "")}</div></foreignObject></svg>`;

export function visualSvg(spec) {
  if (!spec) return "";
  if (!impl) return fallback(spec);
  try {
    return impl(spec);
  } catch {
    return fallback(spec);
  }
}

/**
 * Figure element for a visual. `labelled` keeps the SVG's own title/desc; the picture is always exposed with its alt.
 * opts: { cls, showAlt } - showAlt prints the text alternative beneath the picture.
 */
export function visualFigure(spec, { cls = "", showAlt = false } = {}) {
  const fig = h("figure", { class: `st-v-fig ${cls}`.trim() });
  if (!spec) return fig;
  fig.append(h("div", { class: "st-v-fig-art", html: visualSvg(spec) }));
  fig.append(altBlock(spec, showAlt));
  return fig;
}

/** The text alternative block (alt + longDesc); hidden until shown. */
export function altBlock(spec, shown = false) {
  const box = h("figcaption", { class: "st-v-alt", hidden: !shown });
  box.append(h("strong", {}, "Picture description. "), spec.alt || "");
  if (spec.longDesc) box.append(h("span", { class: "st-v-alt-long" }, ` ${spec.longDesc}`));
  return box;
}
