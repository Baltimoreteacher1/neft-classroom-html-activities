/* ==========================================================================
   Support-page enhancement — progressive JS for the generated
   lessons/<id>/{family,student-help,teacher-notes}/ pages.

   Purely additive and defensive:
     • No-op if the expected structure is missing (never throws).
     • Idempotent: re-running (or double-injection) is a no-op.
     • Adds a Print / Save-as-PDF action after the page title.
     • Collapses an answer section ("Answer check" / "Check your answer") behind
       an attempt-before-reveal toggle. Print shows the answers regardless
       (see support-enhance.css @media print). Teacher Notes have no such
       section, so they simply get the print action.

   Injected by tools/inject-support-enhance.js.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var ANSWER_HEADINGS = ["answer check", "check your answer"];

  function buildPrintAction(wrap) {
    var h1 = wrap.querySelector("h1");
    if (!h1 || wrap.querySelector(".se-actions")) return;

    var bar = document.createElement("div");
    bar.className = "se-actions no-print";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "se-print";
    btn.innerHTML = '<span aria-hidden="true">🖨️</span> Print / Save as PDF';
    btn.addEventListener("click", function () {
      window.print();
    });
    bar.appendChild(btn);

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
      if (ANSWER_HEADINGS.indexOf(label) === -1) continue;
      if (sec.dataset.seReveal === "1") continue; // idempotent

      // Move everything after the heading into a hidden body.
      var body = document.createElement("div");
      body.className = "se-answers se-hidden";
      var node = h2.nextSibling;
      while (node) {
        var next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      if (!body.childNodes.length) continue; // nothing to hide

      sec.dataset.seReveal = "1";

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "se-reveal-toggle no-print";
      toggle.setAttribute("aria-expanded", "false");
      var showLabel = '<span aria-hidden="true">👀</span> Show the answers';
      var hideLabel = '<span aria-hidden="true">✅</span> Hide the answers';
      toggle.innerHTML = showLabel;
      (function (bodyEl, toggleEl) {
        toggleEl.addEventListener("click", function () {
          var shown = bodyEl.classList.toggle("se-hidden") === false;
          toggleEl.setAttribute("aria-expanded", shown ? "true" : "false");
          toggleEl.innerHTML = shown ? hideLabel : showLabel;
        });
      })(body, toggle);

      sec.appendChild(toggle);
      sec.appendChild(body);
    }
  }

  function init() {
    var wrap = document.querySelector(".wrap");
    if (!wrap || wrap.dataset.seInit === "1") return;
    wrap.dataset.seInit = "1";
    try {
      buildPrintAction(wrap);
    } catch (_e) {}
    try {
      collapseAnswerKey(wrap);
    } catch (_e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
