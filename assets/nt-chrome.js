/*
 * nt-chrome.js — Neft Teacher shared page chrome.
 *
 * Non-intrusive: injects a slim footer (Neft Teacher · Home · Find Anything)
 * and a small fixed corner pill. The pill carries Home only when the page has
 * no back-to-home affordance of its own, but ALWAYS carries Find — a page can
 * link home and still be a dead end, because home is a portal of ~25 links and
 * the site has ~1,300 pages. Self-contained, no external dependencies.
 */
(function () {
  "use strict";

  // Idempotency guard — never run twice on the same document.
  if (window.__ntChromeLoaded) return;
  window.__ntChromeLoaded = true;

  function init() {
    if (document.getElementById("nt-chrome-style")) return;

    var prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Inject minimal scoped CSS -------------------------------------
    var css =
      ".nt-chrome-footer{box-sizing:border-box;width:100%;margin-top:2.5rem;" +
      "padding:1rem 1.25rem;display:flex;flex-wrap:wrap;align-items:center;" +
      "justify-content:center;gap:.4rem .9rem;font-size:.8rem;line-height:1.4;" +
      "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "color:#64748b;background:rgba(15,23,42,.04);border-top:1px solid rgba(15,23,42,.08);" +
      "text-align:center}" +
      ".nt-chrome-footer a{color:#475569;text-decoration:none;font-weight:600}" +
      ".nt-chrome-footer a:hover,.nt-chrome-footer a:focus-visible{color:#1e3a8a;text-decoration:underline}" +
      ".nt-chrome-footer .nt-chrome-sep{color:#cbd5e1;user-select:none}" +
      ".nt-chrome-brand{font-weight:700;color:#1e293b}" +
      ".nt-chrome-dock{position:fixed;z-index:2147483000;" +
      "display:inline-flex;align-items:center;gap:.35rem;opacity:.72}" +
      ".nt-chrome-dock:hover,.nt-chrome-dock:focus-within{opacity:1}" +
      '.nt-chrome-dock[data-corner="bl"]{bottom:.75rem;left:.75rem}' +
      '.nt-chrome-dock[data-corner="br"]{bottom:.75rem;right:.75rem}' +
      '.nt-chrome-dock[data-corner="tr"]{top:.75rem;right:.75rem}' +
      '.nt-chrome-dock[data-corner="tl"]{top:.75rem;left:.75rem}' +
      ".nt-chrome-home{" +
      "display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .7rem;" +
      "font-size:.8rem;font-weight:600;line-height:1;border-radius:999px;" +
      "font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "color:#1e293b;background:rgba(255,255,255,.92);text-decoration:none;" +
      "border:1px solid rgba(15,23,42,.12);box-shadow:0 1px 3px rgba(15,23,42,.12);" +
      "backdrop-filter:saturate(140%) blur(4px)" +
      (prefersReduced ? "" : ";transition:transform .15s ease,box-shadow .15s ease") +
      "}" +
      ".nt-chrome-home:hover,.nt-chrome-home:focus-visible{box-shadow:0 2px 8px rgba(15,23,42,.2)" +
      (prefersReduced ? "" : ";transform:translateY(-1px)") +
      "}" +
      "@media print{.nt-chrome-footer,.nt-chrome-dock{display:none}}";

    var style = document.createElement("style");
    style.id = "nt-chrome-style";
    style.textContent = css;
    document.head.appendChild(style);

    // --- Footer --------------------------------------------------------
    var footer = document.createElement("footer");
    footer.className = "nt-chrome-footer";
    footer.setAttribute("role", "contentinfo");
    footer.innerHTML =
      '<span class="nt-chrome-brand">Neft Teacher</span>' +
      '<span class="nt-chrome-sep" aria-hidden="true">·</span>' +
      '<a href="/">Home</a>' +
      '<span class="nt-chrome-sep" aria-hidden="true">·</span>' +
      '<a href="/directory/">Find Anything</a>';
    document.body.appendChild(footer);

    // --- Corner dock: Find always, Home only if the page lacks one -----
    var dock = document.createElement("nav");
    dock.className = "nt-chrome-dock";
    dock.setAttribute("aria-label", "Site");

    if (!hasHomeAffordance()) {
      var home = document.createElement("a");
      home.className = "nt-chrome-home";
      home.href = "/";
      home.setAttribute("aria-label", "Go to Home");
      home.innerHTML = '<span aria-hidden="true">⌂</span><span>Home</span>';
      dock.appendChild(home);
    }

    var find = document.createElement("a");
    find.className = "nt-chrome-home";
    find.href = "/directory/";
    find.setAttribute("aria-label", "Find anything on the site");
    find.innerHTML = '<span aria-hidden="true">⌕</span><span>Find</span>';
    dock.appendChild(find);

    dock.setAttribute("data-corner", "bl");
    document.body.appendChild(dock);
    placeDock(dock);
  }

  /**
   * Pick a screen corner that is not already occupied. Many of these pages are
   * games with their own fixed toolbar pinned to a corner — the first version
   * of this dock landed on top of Cartesian Odyssey's Scratchpad/Pause bar.
   * Try bottom-left, then bottom-right, top-right, top-left; keep the first
   * corner where the topmost element under the corner is the dock itself.
   */
  function placeDock(dock) {
    var corners = ["bl", "br", "tr", "tl"];
    for (var i = 0; i < corners.length; i++) {
      dock.setAttribute("data-corner", corners[i]);
      var r = dock.getBoundingClientRect();
      var x = Math.round(r.left + r.width / 2);
      var y = Math.round(r.top + r.height / 2);
      var hit = document.elementFromPoint(x, y);
      if (!hit || dock.contains(hit) || hit === dock) return;
    }
    // Every corner is busy — bottom-left, translucent, is the least-bad spot.
    dock.setAttribute("data-corner", "bl");
  }

  // Detect an existing link back to the site root (ignores our own footer).
  function hasHomeAffordance() {
    var anchors = document.querySelectorAll("a[href]");
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (a.closest(".nt-chrome-footer")) continue;
      var raw = a.getAttribute("href");
      if (!raw) continue;
      if (a.closest(".nt-chrome-dock")) continue;
      if (raw === "/" || raw === "/index.html" || raw === "./" || raw === "../") {
        return true;
      }
    }
    return false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
