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

// Load a classic (non-module) script once and resolve when it has executed.
// Memoized by src so repeated grapher mounts share one network fetch/parse.
const _scriptPromises = new Map();
function loadClassicScript(src) {
  if (_scriptPromises.has(src)) return _scriptPromises.get(src);
  const p = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-iv-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.dataset.ivSrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
  _scriptPromises.set(src, p);
  return p;
}

const REGISTRY = {
  "solid-3d": async (host, cfg) => {
    const { renderShape3D } = await import("../components/shape-3d.js");
    const handle = renderShape3D(host, { shape: cfg.shape || "cube", label: cfg.label });
    // Progressive AR enhancement: adds a "View in your space" button only on
    // devices that support immersive-ar (Android Chrome / headsets); a no-op
    // everywhere else. Never let its absence/failure affect the 3D explorer.
    let arHandle = null;
    const arLabel = `the ${String(cfg.shape || "cube").replace(/-/g, " ")}`;
    import("../components/ar-solid.js")
      .then((m) => m.mountARButton(host, { shape: cfg.shape || "cube", label: arLabel }))
      .then((h) => {
        arHandle = h;
      })
      .catch((err) => console.warn("ar-solid: mount skipped", err));
    return {
      destroy() {
        try {
          handle?.destroy?.();
        } catch {}
        try {
          arHandle?.destroy?.();
        } catch {}
      },
    };
  },
  // Draggable y = kx grapher (shared/projects/manip-line-grapher.js). Config maps
  // straight onto the widget's data-* attributes so lessons author it declaratively.
  "line-grapher": async (host, cfg) => {
    await loadClassicScript("/shared/projects/manip-line-grapher.js");
    const el = document.createElement("div");
    el.className = "pki-manip";
    el.dataset.manip = "line-grapher";
    const attr = {
      "x-name": cfg.xName,
      "y-name": cfg.yName,
      "k-name": cfg.kName,
      "y-prefix": cfg.yPrefix,
      "k-min": cfg.kMin,
      "k-max": cfg.kMax,
      "k-step": cfg.kStep,
      "k-default": cfg.kDefault,
    };
    for (const [k, v] of Object.entries(attr)) {
      if (v != null && v !== "") el.setAttribute(`data-${k}`, String(v));
    }
    host.appendChild(el);
    window.NeftLineGrapher?.init?.(el);
    return null; // stateless widget; listeners are node-local and GC on detach
  },
  "cross-section": async (host, cfg) => {
    const { renderCrossSection } = await import("../components/cross-section.js");
    return renderCrossSection(host, {
      shape: cfg.shape || "rectangular-prism",
      w: cfg.w,
      d: cfg.d,
      h: cfg.h,
    });
  },
  // Generic bridge for any shared/projects "manip-<name>.js" widget that
  // registers window.NeftManips["<name>"] = init. Config:
  //   { kind: "manip", manip: "number-line", attrs: { range: 120, unit: "m" } }
  // attrs map to the widget's data-* attributes. New manipulatives need NO
  // change here — they just register themselves.
  manip: async (host, cfg) => {
    const name = cfg.manip;
    if (!name || !/^[a-z0-9-]+$/.test(name)) return null;
    await loadClassicScript(`/shared/projects/manip-${name}.js`);
    const el = document.createElement("div");
    el.className = "pki-manip";
    el.dataset.manip = name;
    const attrs = cfg.attrs || {};
    for (const [k, v] of Object.entries(attrs)) {
      if (v != null && v !== "") el.setAttribute(`data-${k}`, String(v));
    }
    host.appendChild(el);
    window.NeftManips?.[name]?.(el);
    return null; // stateless widget; node-local listeners GC on detach
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
