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
    // Never show the launcher on the Workbench page itself.
    if (location.pathname.indexOf("/curriculum/math-workbench") === 0) return;
    // Idempotent: never inject twice (some pages load shared scripts more than once).
    if (document.getElementById("mwb-launcher")) return;

    var style = document.createElement("style");
    style.id = "mwb-launcher-style";
    style.textContent =
      "#mwb-launcher{position:fixed;left:max(12px,env(safe-area-inset-left));" +
      "bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;" +
      "display:inline-flex;align-items:center;gap:8px;text-decoration:none;" +
      "padding:10px 14px;border-radius:999px;font:700 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;" +
      "color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);" +
      "box-shadow:0 4px 16px rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.85);" +
      "cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;}" +
      "#mwb-launcher:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(0,0,0,.34);}" +
      "#mwb-launcher:focus-visible{outline:3px solid #ffd54a;outline-offset:3px;}" +
      "#mwb-launcher .mwb-star{font-size:16px;line-height:1;}" +
      "#mwb-launcher .mwb-label{white-space:nowrap;}" +
      "@media (max-width:520px){#mwb-launcher .mwb-label{display:none;}" +
      "#mwb-launcher{padding:12px;}}" +
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
    a.setAttribute(
      "title",
      "Math Workbench — scratch space (opens in a new tab)",
    );
    a.innerHTML =
      '<span class="mwb-star" aria-hidden="true">✱</span>' +
      '<span class="mwb-label">Math Workbench</span>';
    document.body.appendChild(a);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
