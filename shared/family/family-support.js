/* ==========================================================================
   Family Support — progressive enhancement for lessons/<id>/family/ pages.

   Purely additive and defensive:
     • No-op if the expected structure is missing (never throws).
     • Idempotent: re-running (or double-injection) is a no-op.
     • Adds a Print / Save-as-PDF action after the page title.
     • Turns the "Answer check" section into an attempt-before-reveal toggle so
       the "Practice at home" problems can actually be practiced first. Print
       shows the answers regardless (see family-support.css @media print).

   Injected by tools/inject-family-support.js.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function buildPrintAction(wrap) {
    var h1 = wrap.querySelector("h1");
    if (!h1 || wrap.querySelector(".fam-actions")) return;

    var bar = document.createElement("div");
    bar.className = "fam-actions no-print";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fam-print";
    btn.innerHTML = '<span aria-hidden="true">🖨️</span> Print / Save as PDF';
    btn.addEventListener("click", function () {
      window.print();
    });
    bar.appendChild(btn);

    // Place it right below the title/subtitle so it reads as a page action.
    var anchor = wrap.querySelector(".sub") || h1;
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);
  }

  function collapseAnswerKey(wrap) {
    var sections = wrap.querySelectorAll("section");
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var h2 = sec.querySelector("h2");
      if (!h2) continue;
      var label = (h2.textContent || "").trim().toLowerCase();
      if (label !== "answer check") continue;
      if (sec.dataset.famReveal === "1") return; // idempotent
      sec.dataset.famReveal = "1";

      // Move everything after the heading into a hidden body.
      var body = document.createElement("div");
      body.className = "fam-answers fam-hidden";
      var node = h2.nextSibling;
      while (node) {
        var next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      if (!body.childNodes.length) return; // nothing to hide — leave as-is

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "fam-reveal-toggle no-print";
      toggle.setAttribute("aria-expanded", "false");
      var showLabel = '<span aria-hidden="true">👀</span> Show the answers';
      var hideLabel = '<span aria-hidden="true">✅</span> Hide the answers';
      toggle.innerHTML = showLabel;
      toggle.addEventListener("click", function () {
        var shown = body.classList.toggle("fam-hidden") === false;
        toggle.setAttribute("aria-expanded", shown ? "true" : "false");
        toggle.innerHTML = shown ? hideLabel : showLabel;
      });

      sec.appendChild(toggle);
      sec.appendChild(body);
      return;
    }
  }

  function init() {
    var wrap = document.querySelector(".wrap");
    if (!wrap || wrap.dataset.famInit === "1") return;
    wrap.dataset.famInit = "1";
    try {
      buildPrintAction(wrap);
    } catch (e) {}
    try {
      collapseAnswerKey(wrap);
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
