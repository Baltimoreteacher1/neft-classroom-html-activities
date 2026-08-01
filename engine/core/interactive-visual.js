// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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

import { attachManipulativePersistence } from "./manipulative-state.js";

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
  // Interactive vertical decimal addition/subtraction with hands-on carrying and
  // borrowing: numbers stack aligned by the decimal point (short numbers zero-
  // padded), and the student works each column, filling the amber carry/regroup
  // boxes and the answer.
  "decimal-columns": async (host, cfg) => {
    const { renderDecimalColumns } = await import("../components/decimal-columns.js");
    return renderDecimalColumns(host, cfg);
  },
  // Interactive least-common-multiple lab: two lanes of multiples; click the
  // first value that appears in both lanes (the LCM). No giveaway.
  "lcm-lab": async (host, cfg) => {
    const { renderLcmLab } = await import("../components/lcm-lab.js");
    return renderLcmLab(host, cfg);
  },
  // Guided "multiply decimals" lab: multiply as whole numbers, then place the
  // point by counting decimal places (three staged fill-ins).
  "decimal-product": async (host, cfg) => {
    const { renderDecimalProduct } = await import("../components/decimal-product.js");
    return renderDecimalProduct(host, cfg);
  },
  // Guided "divide decimals" lab: shift both decimals to make the divisor whole,
  // then divide (three staged fill-ins).
  "decimal-quotient": async (host, cfg) => {
    const { renderDecimalQuotient } = await import("../components/decimal-quotient.js");
    return renderDecimalQuotient(host, cfg);
  },
  // Guided "divide fractions" lab: rewrite to improper fractions, keep–change–
  // flip, then multiply and simplify (staged fill-ins).
  "fraction-divide": async (host, cfg) => {
    const { renderFractionDivide } = await import("../components/fraction-divide.js");
    return renderFractionDivide(host, cfg);
  },
  // Distribute lab: expand a(x + c) on a tap-to-fill area model.
  "algebra-expand": async (host, cfg) => {
    const { renderAlgebraExpandLab } = await import("../components/algebra-expand-lab.js");
    return renderAlgebraExpandLab(host, cfg);
  },
  // Combine-like-terms lab: add the x-terms, add the constants, simplify.
  "combine-like-terms": async (host, cfg) => {
    const { renderCombineLikeTerms } = await import("../components/combine-like-terms.js");
    return renderCombineLikeTerms(host, cfg);
  },
  // Interactive tape diagram: the SAME config the static `tape-diagram` figure
  // uses, rendered as a tap-to-count model (count the equal parts in all).
  "tape-diagram": async (host, cfg) => {
    const { renderTapeDiagram } = await import("../components/tape-diagram-lab.js");
    return renderTapeDiagram(host, cfg);
  },
  // Interactive coordinate plane: the SAME config the static `coordinate-plane`
  // figure uses, rendered as a tap-the-grid "plot the listed points" model.
  "coordinate-plane": async (host, cfg) => {
    const { renderCoordinatePlot } = await import("../components/coordinate-plot-lab.js");
    return renderCoordinatePlot(host, cfg);
  },
  // Scenario simulator: drag a slider to change one quantity and watch the
  // model + result recompute live (proportional / percent / linear). Authored
  // into a lesson's `connect.simulator`, rendered via this bridge.
  "scenario-sim": (host, cfg) =>
    import("../components/scenario-sim.js").then((m) => m.renderScenarioSim(host, cfg)),
  // Number line: authored WITH `points` → an interactive "place the points"
  // lab (drag each labeled dot onto its value, checked on the tick). Authored
  // with `problems:[{inequality,boundary,circleType,direction}]` → the
  // graph-and-read inequality lab that number-line.js already ships (it was
  // only reachable from `explore.type:"number-line"`, so a lesson could not
  // mount it as a practice tool). Authored with NEITHER → the static reference
  // line, unchanged — so pure displays never turn into tasks and the figure
  // never blanks.
  "number-line": async (host, cfg) => {
    const problems = Array.isArray(cfg.problems)
      ? cfg.problems.filter((p) => p && p.inequality && Number.isFinite(Number(p.boundary)))
      : [];
    if (problems.length) {
      const { renderNumberLine } = await import("../components/number-line.js");
      renderNumberLine(host, { ...cfg, problems });
      return null;
    }
    const pts = Array.isArray(cfg.points)
      ? cfg.points.filter((p) => p && Number.isFinite(Number(p.value)))
      : [];
    const min = Number(cfg.min);
    const max = Number(cfg.max);
    if (pts.length && Number.isFinite(min) && Number.isFinite(max) && max > min) {
      const { renderNumberLine } = await import("../components/number-line.js");
      renderNumberLine(host, {
        min,
        max,
        step: Number(cfg.step) > 0 ? Number(cfg.step) : 1,
        snapToTick: true,
        label: cfg.title || cfg.label || "Place each labeled point on the number line.",
        targets: pts.map((p) => ({
          value: Number(p.value),
          label: p.label != null ? String(p.label) : String(p.value),
        })),
      });
      return null;
    }
    const { numberLineSVG } = await import("./visual-figures.js");
    host.innerHTML = numberLineSVG(cfg);
    return null;
  },
  // "Data Live": the four authored static data figures (histogram, dot plot,
  // box plot, bar chart) upgraded to explore-first interactive figures IN PLACE
  // from the SAME config. Default view equals the old static figure, plus a
  // reveal-the-measures overlay (mean vs. median) and an opt-in, reversible
  // "What if?" sandbox — so lesson questions about the authored data still hold.
  histogram: (host, cfg) =>
    import("../components/data-live.js").then((m) => m.renderDataLive(host, cfg)),
  "dot-plot": (host, cfg) =>
    import("../components/data-live.js").then((m) => m.renderDataLive(host, cfg)),
  "box-plot": (host, cfg) =>
    import("../components/data-live.js").then((m) => m.renderDataLive(host, cfg)),
  "bar-chart": (host, cfg) =>
    import("../components/data-live.js").then((m) => m.renderDataLive(host, cfg)),
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
  // Hundred-square percent grid: shade squares and reveal the SAME amount as a
  // percent, a decimal, and a fraction. Already used by the small-group visual
  // practice layer; registering it lets a lesson mount it declaratively as the
  // fraction ↔ decimal ↔ percent tool. `percent` is the authored starting
  // shade (0–100).
  "percent-grid": async (host, cfg) => {
    const { renderPercentGridLab } = await import("../components/percent-grid-lab.js");
    return renderPercentGridLab(host, cfg);
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
  // "Work It Out" step lab: line-by-line solving with per-step equivalence
  // checking (equation mode = same solution set, expression mode = same value).
  "step-solver": async (host, cfg) => {
    const { renderStepSolver } = await import("../components/step-solver.js");
    return renderStepSolver(host, cfg);
  },
  // Box-plot construction lab: drag the five-number summary onto a number
  // line over a live dot plot of the data; per-stat coaching on Check.
  "box-plot-builder": async (host, cfg) => {
    const { renderBoxPlotBuilder } = await import("../components/box-plot-builder.js");
    return renderBoxPlotBuilder(host, cfg);
  },
  // Histogram construction lab: bin the data and raise each bar to its count
  // (drag the bar top or use arrow keys); per-interval coaching on Check.
  "histogram-builder": async (host, cfg) => {
    const { renderHistogramBuilder } = await import("../components/histogram-builder.js");
    return renderHistogramBuilder(host, cfg);
  },
  // Equation balance lab: apply the same operation to BOTH sides and watch the
  // equation transform while the scale stays balanced — solving one-step
  // equations as "keep the scale balanced."
  "equation-balance-lab": async (host, cfg) => {
    const { renderEquationBalanceLab } = await import("../components/equation-balance-lab.js");
    return renderEquationBalanceLab(host, cfg);
  },
  // Data lab: build/edit a data set and watch mean (as a balance point),
  // median, mode, range, and MAD update live over a dot plot.
  "stats-data-lab": async (host, cfg) => {
    const { renderStatsDataLab } = await import("../components/stats-data-lab.js");
    return renderStatsDataLab(host, cfg);
  },
  // Number line explorer: drag a point to SEE absolute value as distance from
  // zero (+ its opposite), or compare two integers/rationals.
  "number-line-explorer": async (host, cfg) => {
    const { renderNumberLineExplorer } = await import("../components/number-line-explorer.js");
    return renderNumberLineExplorer(host, cfg);
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
 * cases. `ariaLabel` names the interactive group for assistive technology;
 * `fallback` is shown when JavaScript is unavailable so the figure never renders
 * blank. The host must not use `role="img"` because hydrated models contain
 * focusable controls, and interactive descendants are invalid inside an image.
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
  return `<div class="interactive-visual" data-visual="${v.kind}" data-config="${cfgJson}" role="group" aria-label="${label}" style="margin:var(--sp-3) 0;">${noscript}</div>`;
}

/**
 * Hydrate every not-yet-mounted interactive-visual host found within `root`.
 * Safe to call multiple times and on subtrees. Returns immediately; components
 * mount asynchronously.
 */
export function mountInteractiveVisuals(root, opts) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  const hosts = root.matches?.(".interactive-visual[data-visual]")
    ? [root, ...root.querySelectorAll(".interactive-visual[data-visual]")]
    : [...root.querySelectorAll(".interactive-visual[data-visual]")];
  hosts.forEach((host) => {
    if (host.dataset.ivMounted) return;
    const factory = REGISTRY[host.dataset.visual];
    if (!factory) return;
    // Clear the note left by a previous failed attempt so a retry that works
    // does not render the model underneath a stale "could not load" line.
    host.querySelector(":scope > .interactive-visual-error")?.remove();
    host.dataset.ivMounted = "1";
    let cfg = {};
    try {
      cfg = JSON.parse(host.dataset.config || "{}");
    } catch (_e) {
      cfg = {};
    }
    Promise.resolve()
      .then(() => factory(host, cfg))
      .then((handle) => {
        if (handle) host.__ivHandle = handle;
      })
      .catch((err) => {
        // Never let a manipulative failure break the lesson — but never fail
        // SILENTLY either. The <noscript> fallback does not display when JS is
        // on, so a thrown factory used to leave a blank gap where the model
        // should be, and the student had no way to tell a broken tool from a
        // page that simply had nothing there. Say what happened, and clear the
        // mounted flag so the next render of this phase can retry (a chunk 404
        // right after a deploy is transient).
        console.warn(`interactive-visual: failed to mount "${host.dataset.visual}"`, err);
        delete host.dataset.ivMounted;
        if (!host.querySelector(":scope > *:not(noscript)")) {
          const note = document.createElement("p");
          note.className = "interactive-visual-error";
          note.setAttribute("role", "status");
          note.style.cssText =
            "margin:0; padding:12px 14px; border:1px dashed rgba(0,0,0,.25); border-radius:12px; font-size:0.9rem; font-weight:600; line-height:1.5;";
          note.textContent =
            "This model could not load right now. Reload the page to try again — the rest of the lesson still works.";
          host.appendChild(note);
        }
      });
  });

  // Opt-in persistence: callers that have a lesson state store pass it, and what
  // the student builds survives leaving the phase. Callers without one (the
  // tools-mode browser, small-group labs, the homework page) pass nothing and
  // behave exactly as before.
  if (opts?.state) {
    attachManipulativePersistence(root, opts);
  }
}

export default mountInteractiveVisuals;
