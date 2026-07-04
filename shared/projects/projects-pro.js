/* ==========================================================================
   Projects PRO — premium feature layer for the unit culminating-project
   wizard pages. Purely additive and defensive:

     • Never redefines the page's own globals (setLevel, goStep, buildReport…).
     • Only activates on pages tagged <body class="pro-projects">.
     • Guards every DOM lookup; a missing element is a no-op, never a throw.
     • Honors prefers-reduced-motion.
     • Idempotent: re-running (or double-injection) is a no-op.

   Features added:
     1. Reading-progress bar (top hairline tracking scroll through the wizard).
     2. Keyboard step navigation (← / →) that drives the page's existing
        goStep()/nav buttons, ignoring keystrokes while typing.
     3. Motion-safe card entrance reveal (IntersectionObserver).
     4. Back-to-top affordance.
     5. Premium product footer ribbon + a subtle keyboard-nav hint.

   Injected by tools/inject-projects-pro.mjs.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains("pro-projects")) return;
    if (body.dataset.proInit === "1") return; // idempotent
    body.dataset.proInit = "1";

    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      buildReadBar();
    } catch (e) {}
    try {
      buildBackToTop();
    } catch (e) {}
    try {
      buildRibbon();
    } catch (e) {}
    try {
      wireKeyboardNav();
    } catch (e) {}
    if (!reduceMotion) {
      try {
        wireReveal();
      } catch (e) {}
    }
    try {
      guardBodyClass();
    } catch (e) {}
  }

  /* --- 0. Keep the pro layer alive across level switches ------------------ */
  // Each project page's own setLevel() rewrites body.className to "level-N",
  // which drops the "pro-projects" class the whole premium layer is scoped to
  // (progress bar, reveal, ribbon, back-to-top all disappear until reload).
  // Re-assert the class whenever it is stripped, and re-reveal the active
  // panel so switching Level 1 ⇄ Level 2 stays seamless.
  function guardBodyClass() {
    var body = document.body;
    if (!("MutationObserver" in window)) return;
    var mo = new MutationObserver(function () {
      if (!body.classList.contains("pro-projects")) {
        body.classList.add("pro-projects"); // triggers one more (no-op) fire
        var active = document.querySelector(".step-panel.active");
        if (active) {
          var cards = active.querySelectorAll(".card");
          for (var i = 0; i < cards.length; i++) cards[i].classList.add("pro-in");
        }
      }
    });
    mo.observe(body, { attributes: true, attributeFilter: ["class"] });
  }

  /* --- 1. Reading-progress bar -------------------------------------------- */
  function buildReadBar() {
    if (document.querySelector(".pro-readbar")) return;
    var bar = document.createElement("div");
    bar.className = "pro-readbar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight || 1;
      var pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.width = pct + "%";
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  /* --- 2. Keyboard step navigation ---------------------------------------- */
  function wireKeyboardNav() {
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      var t = ev.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;

      var panels = document.querySelectorAll(".step-panel");
      if (!panels.length) return;
      var activeIdx = -1;
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].classList.contains("active")) {
          activeIdx = i;
          break;
        }
      }
      if (activeIdx === -1) return;
      var nextIdx = ev.key === "ArrowRight" ? activeIdx + 1 : activeIdx - 1;
      if (nextIdx < 0 || nextIdx >= panels.length) return;

      // Drive the page's own navigation so all its side effects fire.
      if (typeof window.goStep === "function") {
        ev.preventDefault();
        window.goStep(nextIdx + 1); // page steps are 1-indexed
        scrollToWizardTop();
      }
    });
  }

  function scrollToWizardTop() {
    var anchor = document.querySelector(".wizard") || document.querySelector(".step-trail");
    if (!anchor) return;
    var top = anchor.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  /* --- 3. Card entrance reveal -------------------------------------------- */
  // These wizard pages show one .step-panel at a time via display swaps. An
  // IntersectionObserver alone is unsafe here: display:none panels never report
  // an intersection, so a card revealed by goStep() while it sits below the fold
  // (short viewport, tall hero, long panel) stays stuck at opacity:0 — the panel
  // renders blank. The reveal is therefore driven deterministically: the active
  // panel is always revealed on load and whenever a panel becomes active, with
  // the IntersectionObserver kept only as progressive enhancement for long,
  // free-scrolling (non-wizard) project pages.
  function wireReveal() {
    var cards = document.querySelectorAll(".step-panel .card, .project-body .card");
    if (!cards.length) return;

    function reveal(card) {
      if (card) card.classList.add("pro-in");
    }
    function revealPanel(panel) {
      if (!panel) return;
      var pc = panel.querySelectorAll(".card");
      for (var i = 0; i < pc.length; i++) reveal(pc[i]);
    }

    for (var i = 0; i < cards.length; i++) cards[i].classList.add("pro-reveal");

    var panels = document.querySelectorAll(".step-panel");

    // Reveal the panel that is active on load (or every card on non-wizard pages).
    if (panels.length) {
      revealPanel(document.querySelector(".step-panel.active"));
    }

    // Deterministically reveal a panel's cards the moment it becomes active —
    // this is what makes wizard steps 2..N reliable regardless of viewport.
    if (panels.length && "MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var t = muts[m].target;
          if (t.classList && t.classList.contains("active")) revealPanel(t);
        }
      });
      for (var p = 0; p < panels.length; p++) {
        mo.observe(panels[p], { attributes: true, attributeFilter: ["class"] });
      }
    }

    // Progressive enhancement: fade cards in as they scroll into view. Only
    // meaningful for long single-view pages; harmless on wizard pages.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("pro-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );
      for (var o = 0; o < cards.length; o++) io.observe(cards[o]);
    }

    // Absolute safety net: nothing in a visible panel stays invisible.
    window.setTimeout(function () {
      for (var s = 0; s < cards.length; s++) {
        var c = cards[s];
        var panel = c.closest ? c.closest(".step-panel") : null;
        if (!panel || panel.classList.contains("active")) reveal(c);
      }
    }, 1000);
  }

  /* --- 4. Back-to-top ----------------------------------------------------- */
  function buildBackToTop() {
    if (document.querySelector(".pro-totop")) return;
    var btn = document.createElement("button");
    btn.className = "pro-totop no-print";
    btn.type = "button";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = "↑";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);

    var ticking = false;
    function update() {
      ticking = false;
      btn.classList.toggle("show", window.scrollY > 600);
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
  }

  /* --- 5. Premium ribbon + keyboard hint ---------------------------------- */
  function buildRibbon() {
    if (document.querySelector(".pro-ribbon")) return;
    var wizard = document.querySelector(".wizard");
    var ribbon = document.createElement("div");
    ribbon.className = "pro-ribbon no-print";

    var hint = "";
    if (document.querySelectorAll(".step-panel").length > 1) {
      hint =
        '<div class="pro-kbd-hint">Tip: use <kbd>←</kbd> <kbd>→</kbd> to move between steps</div>';
    }
    ribbon.innerHTML =
      '<span class="pro-mark"><span class="pro-dot"></span>' +
      "Neft Teacher · Premium Project Series</span>" +
      hint;

    if (wizard && wizard.parentNode) {
      wizard.appendChild(ribbon);
    } else {
      document.body.appendChild(ribbon);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
