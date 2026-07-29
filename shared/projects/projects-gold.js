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
  var LEVEL_KEY_PREFIX = "nt-project-level:";
  var lockedLevel = null;
  var pageSetLevel = null;

  function isTeacherMode() {
    try {
      var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_e) {
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
    } catch (_e) {}
    try {
      syncPressedStates();
    } catch (_e) {}
    try {
      gateConfetti();
    } catch (_e) {}
    try {
      focusOnStepChange();
    } catch (_e) {}
    try {
      wrapWideTables();
    } catch (_e) {}
    try {
      clampNumberInputs();
    } catch (_e) {}
    try {
      gateTeacherConsole();
    } catch (_e) {}
    try {
      initLevelLock();
    } catch (_e) {}
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
      } catch (_e) {}
      var out = orig.apply(this, arguments);
      try {
        Array.prototype.forEach.call(document.body.children, function (node) {
          if (before.indexOf(node) === -1) node.classList.add("gold-confetti");
        });
      } catch (_e) {}
      return out;
    };
    window.addEventListener("beforeprint", function () {
      try {
        document.querySelectorAll(".gold-confetti").forEach(function (node) {
          node.remove();
        });
      } catch (_e) {}
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
      } catch (_e) {}
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
    function clamp(el) {
      el.max = "1000000";
    }

    document.querySelectorAll('input[type="number"]:not([max])').forEach(clamp);

    // Several project layers mount math workspaces after GOLD initializes.
    // Keep the same safety invariant for those late-added controls instead of
    // relying on script order.
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var nodes = muts[m].addedNodes;
          for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (node.nodeType !== 1) continue;
            if (node.matches && node.matches('input[type="number"]:not([max])')) clamp(node);
            if (node.querySelectorAll) {
              node.querySelectorAll('input[type="number"]:not([max])').forEach(clamp);
            }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* --- 7. Gate the teacher answer console ---------------------------------- */
  function gateTeacherConsole() {
    if (typeof window.toggleGradingConsole !== "function") return;
    var orig = window.toggleGradingConsole;
    window.toggleGradingConsole = function () {
      var ok = false;
      try {
        ok = isTeacherMode() || sessionStorage.getItem(SESSION_KEY) === "1";
      } catch (_e) {}
      if (!ok) {
        var pin = window.prompt("Teacher PIN required to open the answer console:");
        if (pin === null) return; // cancelled
        if (pin.trim() !== TEACHER_PIN) {
          window.alert("Incorrect PIN. The answer console stays locked.");
          return;
        }
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch (_e) {}
      }
      return orig.apply(this, arguments);
    };
  }

  /* --- 8. Make the welcome-screen level choice permanent per project ------- */
  function levelStorageKey() {
    return LEVEL_KEY_PREFIX + window.location.pathname.replace(/\/+$/, "/");
  }

  function savedLevel() {
    try {
      var value = parseInt(localStorage.getItem(levelStorageKey()), 10);
      return value === 0 || value === 1 || value === 2 ? value : null;
    } catch (_e) {
      return null;
    }
  }

  function hideLevelControls() {
    var firstButton = document.getElementById("btn-lv0");
    var levelBar = firstButton && firstButton.closest ? firstButton.closest(".level-bar") : null;
    if (levelBar) {
      levelBar.hidden = true;
      levelBar.style.display = "none";
      levelBar.setAttribute("aria-hidden", "true");
    }
    ["btn-lv0", "btn-lv1", "btn-lv2"].forEach(function (id) {
      var button = document.getElementById(id);
      if (!button) return;
      button.disabled = true;
      button.tabIndex = -1;
    });
  }

  function markLevelLocked(level) {
    lockedLevel = level;
    document.body.dataset.levelLocked = String(level);
    hideLevelControls();
  }

  function persistLevel(level) {
    try {
      localStorage.setItem(levelStorageKey(), String(level));
    } catch (_e) {}
  }

  function applyLevel(level) {
    if (pageSetLevel) return pageSetLevel.call(window, level);
    document.body.classList.remove("level-0", "level-1", "level-2");
    document.body.classList.add("level-" + level);
  }

  function lockLevel(level) {
    if (lockedLevel !== null) return;
    applyLevel(level);
    persistLevel(level);
    markLevelLocked(level);
  }

  function initLevelLock() {
    pageSetLevel = typeof window.setLevel === "function" ? window.setLevel : null;
    window.setLevel = function (level) {
      var requested = parseInt(level, 10);
      if (requested !== 0 && requested !== 1 && requested !== 2) return;
      if (lockedLevel !== null && requested !== lockedLevel) return;
      return applyLevel(requested);
    };

    var restored = savedLevel();
    if (restored !== null) {
      markLevelLocked(restored);
      applyLevel(restored);
      return;
    }
    showLevelSelectorOverlay();
  }

  /* --- 9. Show Level Selector welcome overlay until the first choice ------- */
  function showLevelSelectorOverlay() {
    if (lockedLevel !== null) return;
    if (document.getElementById("gold-level-overlay")) return;

    var h1 = document.querySelector(".hero h1");
    var sub = document.querySelector(".hero-sub");
    var titleHtml = h1 ? h1.innerHTML : "Culminating Project";
    var subHtml = sub ? sub.innerHTML : "Complete the activities step by step.";

    var overlay = document.createElement("div");
    overlay.id = "gold-level-overlay";
    overlay.innerHTML =
      '<div class="gold-level-card">' +
      '  <div class="gold-level-emoji">🎉</div>' +
      '  <h1 class="gold-level-title">' +
      titleHtml +
      "</h1>" +
      '  <p class="gold-level-sub">' +
      subHtml +
      "</p>" +
      '  <h3 class="gold-level-heading">' +
      '    <span class="en-text">Choose your support level to begin:</span>' +
      '    <span class="es-text">Elige tu nivel de apoyo para comenzar:</span>' +
      "  </h3>" +
      '  <button class="gold-level-option opt-lv0" type="button" data-level="0">' +
      '    <span class="en-text">🟠 Level 0 · Extra Support</span>' +
      '    <span class="es-text">🟠 Nivel 0 · Apoyo Extra</span>' +
      "  </button>" +
      '  <button class="gold-level-option opt-lv1" type="button" data-level="1">' +
      '    <span class="en-text">🟢 Level 1 — With Support</span>' +
      '    <span class="es-text">🟢 Nivel 1 — Con apoyo</span>' +
      "  </button>" +
      '  <button class="gold-level-option opt-lv2" type="button" data-level="2">' +
      '    <span class="en-text">🔵 Level 2 — Challenge</span>' +
      '    <span class="es-text">🔵 Nivel 2 — Desafío</span>' +
      "  </button>" +
      "</div>";

    document.body.appendChild(overlay);

    overlay.querySelectorAll(".gold-level-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lvl = parseInt(btn.dataset.level, 10);
        lockLevel(lvl);

        overlay.classList.add("fade-out");
        setTimeout(function () {
          overlay.remove();
        }, 250);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
