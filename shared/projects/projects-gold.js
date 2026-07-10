/* ==========================================================================
   Projects GOLD — accessibility + safety hardening for the unit culminating-
   project wizard pages. Companion to projects-gold.css; same contract as the
   PRO layer:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive and defensive: every feature is try/caught, every DOM
       lookup guarded; a missing element is a no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Wraps — never replaces — the page's own globals, preserving behavior.

   Features (audit 2026-07-02):
     1. Screen-reader feedback: every .readout becomes role="status"
        aria-live="polite" so calculator results are announced.
     2. aria-pressed on the Level 1/2 and EN/ES toggle buttons, kept in sync
        with their .active class.
     3. Reduced motion: playConfetti() becomes a no-op when the user prefers
        reduced motion (CSS handles the page's keyframe animations).
     4. Focus management: after goStep(), keyboard/SR focus moves into the
        newly-activated panel instead of staying on a hidden button.
     5. Mobile tables: .rubric / .data-table get an overflow-x scroll wrapper.
     6. Input safety: number inputs without a max get max=1000000 so absurd
        values cannot stall factor/loop math.
     7. Teacher console gate: toggleGradingConsole() (sample answers) now
        requires teacher mode (nt-teacher-mode) or the shared teacher PIN —
        students can no longer surface the answer console by triple-click.

   Injected by tools/inject-projects-gold.mjs (sentinel: projects-gold).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  // ⚠️ KEEP IN SYNC with TEACHER_PIN in assets/curriculum-enhancements.js
  // and engine/core/teacher-mode.js (client-side gate against casual access).
  var TEACHER_PIN = "TeacherNeft";
  var SESSION_KEY = "nt-answer-console-ok";

  function isTeacherMode() {
    try {
      var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (e) {
      return false;
    }
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains("pro-projects")) return;
    if (body.dataset.goldInit === "1") return; // idempotent
    body.dataset.goldInit = "1";

    try {
      tagReadouts();
    } catch (e) {}
    try {
      syncPressedStates();
    } catch (e) {}
    try {
      gateConfetti();
    } catch (e) {}
    try {
      focusOnStepChange();
    } catch (e) {}
    try {
      wrapWideTables();
    } catch (e) {}
    try {
      clampNumberInputs();
    } catch (e) {}
    try {
      gateTeacherConsole();
    } catch (e) {}
  }

  /* --- 1. Announce calculator feedback to screen readers ------------------ */
  function tagReadouts() {
    function tag(el) {
      if (!el || el.dataset.goldLive === "1") return;
      el.dataset.goldLive = "1";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
    }
    document.querySelectorAll(".readout").forEach(tag);

    // Late-added readouts (defensive; pages build them statically today).
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var nodes = muts[m].addedNodes;
          for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (node.nodeType !== 1) continue;
            if (node.classList && node.classList.contains("readout")) tag(node);
            if (node.querySelectorAll) node.querySelectorAll(".readout").forEach(tag);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* --- 2. aria-pressed on Level / Language toggles ------------------------- */
  function syncPressedStates() {
    var buttons = [];
    document.querySelectorAll("button.level-btn").forEach(function (btn) {
      var handler = btn.getAttribute("onclick") || "";
      // Read-aloud is momentary, not a pressed-state toggle.
      if (/readAloud/i.test(handler) || btn.id === "btn-read") return;
      buttons.push(btn);
    });
    if (!buttons.length) return;

    function sync(btn) {
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
    }
    buttons.forEach(sync);

    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) sync(muts[m].target);
      });
      buttons.forEach(function (btn) {
        mo.observe(btn, { attributes: true, attributeFilter: ["class"] });
      });
    }
  }

  /* --- 3. Confetti honors prefers-reduced-motion and never prints ---------- */
  function gateConfetti() {
    if (typeof window.playConfetti !== "function") return;
    var orig = window.playConfetti;
    window.playConfetti = function () {
      if (reducedMotion()) return;
      // The page builds the confetti container inside its own closure, so tag
      // whatever playConfetti appended to <body> — the "Generate report →
      // Print" flow otherwise sends mid-animation confetti to the printer.
      var before = [];
      try {
        before = Array.prototype.slice.call(document.body.children);
      } catch (e) {}
      var out = orig.apply(this, arguments);
      try {
        Array.prototype.forEach.call(document.body.children, function (node) {
          if (before.indexOf(node) === -1) node.classList.add("gold-confetti");
        });
      } catch (e) {}
      return out;
    };
    window.addEventListener("beforeprint", function () {
      try {
        document.querySelectorAll(".gold-confetti").forEach(function (node) {
          node.remove();
        });
      } catch (e) {}
    });
  }

  /* --- 4. Move focus into the newly-activated wizard panel ----------------- */
  function focusOnStepChange() {
    if (typeof window.goStep !== "function") return;
    var orig = window.goStep;
    window.goStep = function () {
      var out = orig.apply(this, arguments);
      try {
        var panel = document.querySelector(".step-panel.active");
        if (panel) {
          if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
          panel.focus({ preventScroll: true });
        }
      } catch (e) {}
      return out;
    };
  }

  /* --- 5. Horizontal scroll wrapper for wide tables ------------------------ */
  function wrapWideTables() {
    document.querySelectorAll("table.rubric, table.data-table").forEach(function (table) {
      if (!table.parentNode) return;
      if (table.parentNode.classList && table.parentNode.classList.contains("gold-scroll")) return;
      var wrap = document.createElement("div");
      wrap.className = "gold-scroll";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* --- 6. Clamp unbounded number inputs ------------------------------------ */
  function clampNumberInputs() {
    document.querySelectorAll('input[type="number"]:not([max])').forEach(function (el) {
      el.max = "1000000";
    });
  }

  /* --- 7. Gate the teacher answer console ---------------------------------- */
  function gateTeacherConsole() {
    if (typeof window.toggleGradingConsole !== "function") return;
    var orig = window.toggleGradingConsole;
    window.toggleGradingConsole = function () {
      var ok = false;
      try {
        ok = isTeacherMode() || sessionStorage.getItem(SESSION_KEY) === "1";
      } catch (e) {}
      if (!ok) {
        var pin = window.prompt("Teacher PIN required to open the answer console:");
        if (pin === null) return; // cancelled
        if (pin.trim() !== TEACHER_PIN) {
          window.alert("Incorrect PIN. The answer console stays locked.");
          return;
        }
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch (e) {}
      }
      return orig.apply(this, arguments);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
