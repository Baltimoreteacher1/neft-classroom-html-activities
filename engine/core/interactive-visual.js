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
  // Animated area-transformation explorer (shear / rotate-copy / decompose)
  // that derives the Unit 5 area formulas visually.
  "area-morph": async (host, cfg) => {
    const { renderAreaMorph } = await import("../components/area-morph.js");
    return renderAreaMorph(host, cfg);
  },
  // Interactive prime-factorization lab: type a number and build its factor
  // tree; extra modes derive GCF / LCM from two numbers' shared primes.
  "factor-tree-lab": async (host, cfg) => {
    const { renderFactorTree } = await import("../components/factor-tree.js");
    return renderFactorTree(host, cfg);
  },
  // Fill-in-the-blank factor tree: the SAME config a static `factor-tree`
  // diagram uses, rendered with its branch nodes blanked as checkable inputs.
  // The completed tree in config is the answer key, so every existing static
  // factor tree upgrades to a scaffolded exercise with no config edits.
  "factor-tree": async (host, cfg) => {
    const { renderFactorTreeFill } = await import("../components/factor-tree-fill.js");
    return renderFactorTreeFill(host, cfg);
  },
  // Fill-in vertical decimal addition/subtraction, aligned by the decimal point.
  "decimal-columns": async (host, cfg) => {
    const { renderDecimalColumns } = await import("../components/decimal-columns.js");
    return renderDecimalColumns(host, cfg);
  },
  // Decimal multiplication: multiply as whole numbers, then place the point.
  "decimal-product": async (host, cfg) => {
    const { renderDecimalProduct } = await import("../components/decimal-product.js");
    return renderDecimalProduct(host, cfg);
  },
  // Decimal division: shift both decimals to make the divisor whole, then divide.
  "decimal-quotient": async (host, cfg) => {
    const { renderDecimalQuotient } = await import("../components/decimal-quotient.js");
    return renderDecimalQuotient(host, cfg);
  },
  // Build-a-histogram: bin the data and fill each interval's frequency.
  "histogram-builder": async (host, cfg) => {
    const { renderHistogramBuilder } = await import("../components/histogram-builder.js");
    return renderHistogramBuilder(host, cfg);
  },
  // Interactive powers & exponents lab: type a base and exponent, expand into
  // repeated multiplication, and evaluate — the sibling of the factor-tree lab.
  "power-builder": async (host, cfg) => {
    const { renderPowerBuilder } = await import("../components/power-builder.js");
    return renderPowerBuilder(host, cfg);
  },
  // Distributive-property area (box) model: a(b + c) = a·b + a·c.
  "distributive-builder": async (host, cfg) => {
    const { renderDistributiveBuilder } = await import("../components/distributive-builder.js");
    return renderDistributiveBuilder(host, cfg);
  },
  // "Percent of a number" double-number-line lab.
  "percent-builder": async (host, cfg) => {
    const { renderPercentBuilder } = await import("../components/percent-builder.js");
    return renderPercentBuilder(host, cfg);
  },
  // Unit-rate lab: divide a quantity pair to find each "per 1" rate.
  "unit-rate-builder": async (host, cfg) => {
    const { renderUnitRateBuilder } = await import("../components/unit-rate-builder.js");
    return renderUnitRateBuilder(host, cfg);
  },
  // Partial-quotients / long-division lab.
  "long-division-builder": async (host, cfg) => {
    const { renderLongDivisionBuilder } = await import("../components/long-division-builder.js");
    return renderLongDivisionBuilder(host, cfg);
  },
  // Scalable ratio-table lab of equivalent ratios.
  "ratio-table-builder": async (host, cfg) => {
    const { renderRatioTableBuilder } = await import("../components/ratio-table-builder.js");
    return renderRatioTableBuilder(host, cfg);
  },
  // 3D data towers: mean as "level the towers", MAD as distance from the line.
  "stat-towers": async (host, cfg) => {
    const { renderStatTowers } = await import("../components/stat-towers.js");
    return renderStatTowers(host, {
      values: cfg.values,
      unit: cfg.unit,
      label: cfg.label,
      mode: cfg.mode,
    });
  },
  "dist-explorer": async (host, cfg) => {
    const { renderDistExplorer } = await import("../components/dist-explorer.js");
    return renderDistExplorer(host, { max: cfg.max, unit: cfg.unit, label: cfg.label });
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
  // Fold a 2D net into a 3D solid (surface-area lessons). The component is
  // otherwise wired only as a lesson interaction type; registering it here
  // lets the small-group Model/Explore labs mount it declaratively too.
  "net-folder": async (host, cfg) => {
    const { renderNetFolder } = await import("../components/net-folder.js");
    renderNetFolder(host, {
      instructions: cfg.instructions || cfg.label,
      solid: cfg.solid || cfg.shape || "cube",
      size: cfg.size || (cfg.w || cfg.h || cfg.d ? { w: cfg.w, h: cfg.h, d: cfg.d } : undefined),
      question: cfg.question,
    });
    return null;
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
