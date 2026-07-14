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

  // Lesson-aware deep links: on /lessons/<id>/ pages the launcher reads the
  // lesson's config.json and opens the Workbench pre-staged for that skill
  // (?preset=<key> picks the background + manipulatives; ?problem= carries a
  // lesson-tied prompt). Standards prefix → Workbench preset key; ordered
  // specific-first so 6.AT.3c matches before 6.AT.3. Covers both the Reveal
  // codes (AT/NOS/DS/GR) and CCSS codes (RP/NS/EE/G/SP) defensively.
  var PRESET_MAP = [
    ["6.AT.3c", "unit-rates"],
    ["6.AT.1", "ratio-tables"],
    ["6.AT.2", "unit-rates"],
    ["6.AT.3", "ratio-tables"],
    ["6.AT.4", "percent"],
    ["6.AT.5", "expressions"],
    ["6.AT.6", "expressions"],
    ["6.AT.7", "expressions"],
    ["6.AT.8", "equations"],
    ["6.AT.9", "inequalities"],
    ["6.DS", "statistics"],
    ["6.GR", "area"],
    ["6.NOS.1", "fraction-division"],
    ["6.NOS.2", "decimals"],
    ["6.NOS.3", "decimals"],
    ["6.NOS.4", "factors"],
    ["6.NOS.6", "coordinate-plane"],
    ["6.NOS.7", "coordinate-plane"],
    ["6.NOS.8", "integers"],
    ["6.NOS.9", "coordinate-plane"],
    ["6.RP.3c", "percent"],
    ["6.RP.2", "unit-rates"],
    ["6.RP.3b", "unit-rates"],
    ["6.RP", "ratio-tables"],
    ["6.NS.1", "fraction-division"],
    ["6.NS.2", "decimals"],
    ["6.NS.3", "decimals"],
    ["6.NS.4", "factors"],
    ["6.NS.8", "coordinate-plane"],
    ["6.NS", "integers"],
    ["6.EE.5", "equations"],
    ["6.EE.6", "equations"],
    ["6.EE.7", "equations"],
    ["6.EE.8", "inequalities"],
    ["6.EE.9", "equations"],
    ["6.EE", "expressions"],
    ["6.G", "area"],
    ["6.SP", "statistics"],
  ];

  function presetFor(standard) {
    var s = String(standard || "").toUpperCase();
    if (!s) return "";
    for (var i = 0; i < PRESET_MAP.length; i++) {
      if (s.indexOf(PRESET_MAP[i][0].toUpperCase()) === 0) return PRESET_MAP[i][1];
    }
    return "";
  }

  // If this is a lesson page, upgrade the launcher href to a preset deep link.
  // Fail-safe: any error leaves the plain Workbench URL in place.
  function lessonAwareHref(a) {
    var m = /^\/lessons\/([a-z0-9-]+)\//i.exec(location.pathname);
    if (!m) return;
    var key = "mwb-preset-link:" + m[1];
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) {
        if (cached !== "none") applyHref(a, cached);
        return;
      }
    } catch (e) {
      /* private mode — just fetch */
    }
    fetch("/lessons/" + m[1] + "/config.json", { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (cfg) {
        var preset = cfg ? presetFor(cfg.standard) : "";
        var url = "";
        if (preset) {
          var prompt = cfg.title
            ? "Model a problem from today’s lesson: “" + String(cfg.title).slice(0, 120) + "”"
            : "";
          url =
            WORKBENCH_URL +
            "?preset=" +
            encodeURIComponent(preset) +
            (prompt ? "&problem=" + encodeURIComponent(prompt) : "");
          applyHref(a, url);
        }
        try {
          sessionStorage.setItem(key, url || "none");
        } catch (e) {
          /* best effort */
        }
      })
      .catch(function () {
        /* plain URL stays */
      });
  }

  function applyHref(a, url) {
    a.href = url;
    a.setAttribute("aria-label", "Open the Math Workbench set up for today's lesson (new tab)");
    a.setAttribute("title", "Math Workbench — set up for today's lesson (opens in a new tab)");
  }

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
      "#mwb-launcher{position:fixed;right:max(6px,env(safe-area-inset-right));" +
      "bottom:max(64px,env(safe-area-inset-bottom));z-index:2147483000;" +
      "display:inline-flex;align-items:center;justify-content:center;gap:0;text-decoration:none;" +
      "width:38px;height:38px;padding:0;overflow:hidden;white-space:nowrap;" +
      "border-radius:999px;font:700 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;" +
      "color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);" +
      "box-shadow:0 4px 16px rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.85);" +
      "cursor:pointer;box-sizing:border-box;" +
      "transition:width .18s ease,gap .18s ease,padding .18s ease,transform .12s ease,box-shadow .12s ease;}" +
      "#mwb-launcher:hover,#mwb-launcher:focus-visible{width:auto;gap:8px;padding:0 16px;" +
      "transform:translateY(-2px);box-shadow:0 7px 22px rgba(0,0,0,.34);}" +
      "#mwb-launcher:focus-visible{outline:3px solid #ffd54a;outline-offset:3px;}" +
      "#mwb-launcher .mwb-star{font-size:13px;line-height:1;}" +
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
    lessonAwareHref(a);

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
