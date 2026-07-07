/* Math Workbench launcher — a small, always-available floating button that
 * opens the Math Workbench (/curriculum/math-workbench/) in a new tab from ANY
 * lesson, activity, or game, so a student can reach scratch space at any point
 * without losing their place.
 *
 * Self-contained: injects its own styles + element, guards against double-inject,
 * and hides itself on the Workbench page. Loaded site-wide via
 * tools/inject-math-workbench.js. No dependencies. Gameplay/content-neutral.
 */
(function () {
  "use strict";

  var WORKBENCH_URL = "/curriculum/math-workbench/";

  function init() {
    // Never show the launcher on the Workbench page itself or on school planner pages/domains.
    var path = location.pathname.toLowerCase();
    if (
      path.indexOf("/curriculum/math-workbench") === 0 ||
      path.indexOf("/noam-school") >= 0 ||
      path.indexOf("/focus-school") >= 0
    )
      return;

    var host = location.hostname.toLowerCase();
    if (host === "noam.eduwonderlab.com" || host === "focus.eduwonderlab.com") return;

    // Idempotent: never inject twice (some pages load shared scripts more than once).
    if (document.getElementById("mwb-launcher")) return;

    var style = document.createElement("style");
    style.id = "mwb-launcher-style";
    style.textContent =
      // Compact by default: a 48px icon circle that stays clear of the lesson
      // content, expanding to reveal its label on hover/focus so it no longer
      // blocks navigation as a wide pill.
      "#mwb-launcher{position:fixed;right:max(16px,env(safe-area-inset-right));" +
      "bottom:max(72px,env(safe-area-inset-bottom));z-index:2147483000;" +
      "display:inline-flex;align-items:center;justify-content:center;gap:0;text-decoration:none;" +
      "width:48px;height:48px;padding:0;overflow:hidden;white-space:nowrap;" +
      "border-radius:999px;font:700 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;" +
      "color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);" +
      "box-shadow:0 4px 16px rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.85);" +
      "cursor:pointer;box-sizing:border-box;" +
      "transition:width .18s ease,gap .18s ease,padding .18s ease,transform .12s ease,box-shadow .12s ease;}" +
      "#mwb-launcher:hover,#mwb-launcher:focus-visible{width:auto;gap:8px;padding:0 16px;" +
      "transform:translateY(-2px);box-shadow:0 7px 22px rgba(0,0,0,.34);}" +
      "#mwb-launcher:focus-visible{outline:3px solid #ffd54a;outline-offset:3px;}" +
      "#mwb-launcher .mwb-star{font-size:16px;line-height:1;}" +
      "#mwb-launcher .mwb-label{max-width:0;opacity:0;overflow:hidden;white-space:nowrap;" +
      "transition:max-width .18s ease,opacity .18s ease;}" +
      "#mwb-launcher:hover .mwb-label,#mwb-launcher:focus-visible .mwb-label{max-width:180px;opacity:1;}" +
      "@media (prefers-reduced-motion:reduce){#mwb-launcher{transition:none;}" +
      "#mwb-launcher:hover{transform:none;}}" +
      "@media print{#mwb-launcher,#mwb-launcher-style{display:none!important;}}";
    document.head.appendChild(style);

    var a = document.createElement("a");
    a.id = "mwb-launcher";
    a.href = WORKBENCH_URL;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Open the Math Workbench in a new tab");
    a.setAttribute("title", "Math Workbench — scratch space (opens in a new tab)");
    a.innerHTML =
      '<span class="mwb-star" aria-hidden="true">✱</span>' +
      '<span class="mwb-label">Math Workbench</span>';
    document.body.appendChild(a);

    // Some pages mount a fixed, full-width bottom action bar (e.g. the
    // nt-page-enhance "Save as PDF/DOC" bar, .nt-pe-bar) at a higher z-index.
    // That bar would cover and click-block the lower-right launcher. Detect any
    // such fixed bottom-anchored full-width bar and lift the launcher clear of
    // it so it stays visible and clickable. Re-check after load since bars may
    // mount asynchronously. Launcher CSS only — no page/content changes.
    avoidBottomBar(a);
    if (document.readyState !== "complete") {
      window.addEventListener("load", function () {
        avoidBottomBar(a);
      });
    }
    window.addEventListener("resize", function () {
      avoidBottomBar(a);
    });
  }

  // Measure the tallest fixed element pinned to the bottom edge that spans
  // most of the viewport width and would overlap the launcher, then offset the
  // launcher above it (plus a small gap). Falls back to the default position.
  function avoidBottomBar(a) {
    var base = 72; // matches the default bottom offset (stacked above the Save/Resume pill, bottom-right)
    var clearance = base;
    try {
      var nodes = document.body.querySelectorAll("*");
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el === a || el.id === "mwb-launcher") continue;
        var cs = getComputedStyle(el);
        if (cs.position !== "fixed") continue;
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        if (cs.pointerEvents === "none") continue;
        var b = el.getBoundingClientRect();
        if (b.height === 0 || b.width === 0) continue;
        // Anchored to the bottom edge and spanning most of the width.
        var atBottom = window.innerHeight - b.bottom <= 2;
        var fullWidth = b.width >= window.innerWidth * 0.6;
        if (!atBottom || !fullWidth) continue;
        // Only react to bars that stack above the launcher.
        var z = parseInt(cs.zIndex, 10);
        if (isNaN(z) || z < 2147483000) continue;
        var need = Math.round(b.height) + 10;
        if (need > clearance) clearance = need;
      }
    } catch (e) {
      /* defensive: keep default position on any failure */
    }
    a.style.bottom =
      clearance > base ? "calc(" + clearance + "px + env(safe-area-inset-bottom))" : "";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
