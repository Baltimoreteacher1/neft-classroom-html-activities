/* ==========================================================================
   Neft Teacher — Level Switcher (vanilla, zero-dependency)

   Renders a "Choose your level" bar near the top of a unit review / project
   page so the Standard page (the only one linked from the curriculum hub) and
   its three differentiated siblings are all reachable from one another.

   File naming contract (already true across pre-test/ and post-test/):
     <stem>.html          → Standard
     <stem>-level-0.html  → Extra Support  (IEP tier; L0 < L1 < L2)
     <stem>-level-1.html  → Support
     <stem>-level-2.html  → Challenge / Enrichment

   Only activates under /pre-test/ or /post-test/, where every stem ships all
   four files — so the four links are always valid. Inserts itself right after
   the page's first <header> (falling back to top of <body>).
   ========================================================================== */
(function () {
  "use strict";
  try {
    var path = location.pathname;
    if (!/\/(pre-test|post-test)\//.test(path)) return;

    var file = path.split("/").pop() || "";
    if (!/\.html$/.test(file)) return;
    var name = file.replace(/\.html$/, "");
    var m = name.match(/^(.*?)(?:-level-([0-2]))?$/);
    if (!m) return;
    var stem = m[1];
    var current = m[2] === undefined ? "core" : m[2];

    var LEVELS = [
      {
        key: "0",
        emoji: "🟢",
        label: "Extra Support",
        file: stem + "-level-0.html",
      },
      { key: "1", emoji: "🔵", label: "Support", file: stem + "-level-1.html" },
      { key: "core", emoji: "⭐", label: "Standard", file: stem + ".html" },
      {
        key: "2",
        emoji: "🟣",
        label: "Challenge",
        file: stem + "-level-2.html",
      },
    ];

    var bar = document.createElement("nav");
    bar.className = "nlsw-bar";
    bar.setAttribute("aria-label", "Choose your level");

    var lbl = document.createElement("span");
    lbl.className = "nlsw-label";
    lbl.textContent = "Choose your level:";
    bar.appendChild(lbl);

    var wrap = document.createElement("div");
    wrap.className = "nlsw-links";

    LEVELS.forEach(function (lv) {
      var a = document.createElement("a");
      a.className = "nlsw-pill";
      a.href = lv.file;
      if (lv.key !== "core") a.setAttribute("data-lvl", lv.key);
      a.innerHTML =
        '<span class="nlsw-emoji" aria-hidden="true">' +
        lv.emoji +
        "</span><span>" +
        lv.label +
        "</span>";
      if (lv.key === current) {
        a.setAttribute("aria-current", "page");
        a.setAttribute("aria-label", lv.label + " (this page)");
      }
      wrap.appendChild(a);
    });

    bar.appendChild(wrap);

    function mount() {
      var header = document.querySelector("body > header, header");
      if (header && header.parentNode) {
        header.parentNode.insertBefore(bar, header.nextSibling);
      } else if (document.body) {
        document.body.insertBefore(bar, document.body.firstChild);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount);
    } else {
      mount();
    }
  } catch (_e) {
    /* never break the page over a nav bar */
  }
})();
