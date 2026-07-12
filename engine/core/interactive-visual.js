// interactive-visual.js — bridge from a lesson config `diagram` block to a live,
// interactive manipulative mounted into the lesson flow.
//
// The static `buildVisual()` switch in lesson-renderer.js returns SVG strings for
// data figures (histogram, dot-plot, …). Interactive kinds instead emit a *mount
// host* — a `<div class="interactive-visual" data-visual="…" data-config="…">` —
// and this module hydrates those hosts after they are in the DOM.
//
// Design notes:
//   • Lazy `import()` per kind → zero JS cost on lessons that use no interactive
//     visual, and the (heavier) component code only loads when actually needed.
//   • Kind-keyed registry so new manipulatives (grapher, …) drop in with one line
//     and no renderer changes.
//   • Each host is mounted exactly once (guarded by `data-iv-mounted`).
//   • Components are responsible for their own teardown when detached from the
//     DOM (shape-3d self-cancels its rAF on `!isConnected`); we also expose the
//     returned handle on the host as `__ivHandle` so a caller can `destroy()`
//     eagerly if it wants to.

const REGISTRY = {
  "solid-3d": async (host, cfg) => {
    const { renderShape3D } = await import("../components/shape-3d.js");
    return renderShape3D(host, { shape: cfg.shape || "cube", label: cfg.label });
  },
};

/**
 * Build the mount-host HTML string for an interactive visual kind. Returns "" if
 * the kind is not interactive, so `buildVisual()` can fall through to its static
 * cases. `ariaLabel` is a plain, screen-reader-friendly description; `fallback`
 * is shown when JavaScript is unavailable so the figure never renders blank.
 */
export function interactiveVisualHost(v, { ariaLabel, fallback } = {}) {
  if (!v || !REGISTRY[v.kind]) return "";
  const cfgJson = JSON.stringify(v)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const label = (ariaLabel || v.label || "Interactive model")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const noscript = fallback
    ? `<noscript><div class="interactive-visual-fallback">${fallback}</div></noscript>`
    : "";
  return `<div class="interactive-visual" data-visual="${v.kind}" data-config="${cfgJson}" role="img" aria-label="${label}" style="margin:var(--sp-3) 0;">${noscript}</div>`;
}

/**
 * Hydrate every not-yet-mounted interactive-visual host found within `root`.
 * Safe to call multiple times and on subtrees. Returns immediately; components
 * mount asynchronously.
 */
export function mountInteractiveVisuals(root) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  const hosts = root.matches?.(".interactive-visual[data-visual]")
    ? [root, ...root.querySelectorAll(".interactive-visual[data-visual]")]
    : [...root.querySelectorAll(".interactive-visual[data-visual]")];
  hosts.forEach((host) => {
    if (host.dataset.ivMounted) return;
    const factory = REGISTRY[host.dataset.visual];
    if (!factory) return;
    host.dataset.ivMounted = "1";
    let cfg = {};
    try {
      cfg = JSON.parse(host.dataset.config || "{}");
    } catch (e) {
      cfg = {};
    }
    Promise.resolve()
      .then(() => factory(host, cfg))
      .then((handle) => {
        if (handle) host.__ivHandle = handle;
      })
      .catch((err) => {
        // Never let a manipulative failure break the lesson: log and leave the
        // (empty) host / noscript fallback in place.
        console.warn(`interactive-visual: failed to mount "${host.dataset.visual}"`, err);
      });
  });
}

export default mountInteractiveVisuals;
