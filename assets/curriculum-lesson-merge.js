// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Curriculum Hub — Units & Lessons merge bridge (Option 1 + shared selection).
   Docks the teacher Command Center ("Plan it. Teach it. Launch it.") directly
   on top of the Units & Lessons library AND makes the two parts share ONE
   unit/lesson selection: change the lesson in either the cockpit or the library
   and both update live (no jarring scroll). Explicit buttons still jump between
   the two parts:
     • cockpit  "See all resources ↓"        → scroll down to the library
     • library  "↑ Teach / Launch this lesson" → scroll up to the cockpit
   Additive + defensive: runs after curriculum-teacher-workflow.js (exposes
   window.CurriculumCockpit) and curriculum-enhancements.js/​-sidebar.js build
   #interactive-hub. Idempotent; re-applies on async re-renders. A `syncing`
   flag guards against cockpit⇄library echo loops.
   ========================================================================== */
(function () {
  "use strict";

  var docked = false;
  var subscribed = false;
  var listening = false;
  var syncing = false; // true while a cockpit⇄library sync is in flight

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function hub() {
    return window.CurriculumHub && window.CurriculumHub.unitsData ? window.CurriculumHub : null;
  }
  function cockpit() {
    return document.getElementById("curriculum-teacher-workflow");
  }
  function libraryEl() {
    return document.getElementById("interactive-hub");
  }
  function librarySection() {
    var lib = libraryEl();
    if (!lib) return null;
    return lib.closest(".curr-shell") || lib;
  }
  function digits(text) {
    var m = (text || "").match(/\d+/);
    return m ? m[0] : null;
  }
  function cardUnitNum(card) {
    var el = card.querySelector(".unit-card-num");
    return el ? digits(el.textContent) : null;
  }

  /* ---- lesson id ⇄ {unitNum, lessonIdx}, from the hub's own data ---------- */
  function locate(lessonId) {
    var h = hub();
    if (!h) return null;
    var units = h.unitsData || [];
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      var ls = u.lessons || [];
      for (var j = 0; j < ls.length; j++) {
        if (ls[j].lessonId === lessonId) {
          // Rail buttons are keyed by the plain unit number (data-num="5"),
          // which is u.unitIndex — NOT u.num, which is the label "Unit 5".
          var num = u.unitIndex != null ? String(u.unitIndex) : digits(String(u.num));
          return { unitNum: num, idx: j };
        }
      }
    }
    return null;
  }
  function lessonIdShownInCard(card) {
    var h = hub();
    if (!h || !card) return null;
    var sel = card.querySelector(".lesson-select");
    var num = cardUnitNum(card);
    if (!sel || num == null) return null;
    var unit = null;
    (h.unitsData || []).forEach(function (u) {
      if (String(u.num) === String(num) || String(u.unitIndex) === String(num)) unit = u;
    });
    if (!unit) return null;
    var lesson = (unit.lessons || [])[parseInt(sel.value, 10) || 0];
    return lesson ? lesson.lessonId : null;
  }

  /* ---- activate a unit card WITHOUT forcing the sidebar's built-in scroll -- */
  function activateUnit(num) {
    var cards = document.querySelectorAll("#interactive-hub .unit-card");
    cards.forEach(function (c) {
      c.classList.toggle("curr-active", cardUnitNum(c) === num);
    });
    document.querySelectorAll(".curr-rail-item").forEach(function (b) {
      b.setAttribute("aria-current", b.dataset.num === num ? "true" : "false");
    });
  }

  /* ---- open a lesson in the library (used by sync + the explicit button) --- */
  function openInLibrary(lessonId, scroll) {
    var where = locate(lessonId);
    if (!where) return false;
    var prev = syncing;
    syncing = true; // suppress the lesson-select 'change' echo back to the cockpit
    activateUnit(where.unitNum);
    var card =
      document.querySelector("#interactive-hub .unit-card.curr-active") ||
      document.querySelector("#interactive-hub .unit-card");
    if (card) {
      var sel = card.querySelector(".lesson-select");
      if (sel && String(sel.value) !== String(where.idx)) {
        sel.value = String(where.idx);
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    syncing = prev;
    if (scroll) {
      var section = librarySection();
      if (section) {
        try {
          section.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        } catch (_e) {}
      }
    }
    return true;
  }

  /* ---- library selection → cockpit --------------------------------------- */
  function syncCockpitFromLibrary(card) {
    if (syncing || !card || !window.CurriculumCockpit) return;
    var id = lessonIdShownInCard(card);
    if (!id || id === window.CurriculumCockpit.getSelected()) return;
    syncing = true;
    window.CurriculumCockpit.select(id, { scroll: false, silent: true });
    syncing = false;
  }

  /* ---- 1. dock the cockpit directly above the library -------------------- */
  function dock() {
    if (docked) return;
    var panel = cockpit();
    var section = librarySection();
    if (!panel || !section || !section.parentNode) return;
    if (panel.nextElementSibling !== section) {
      section.parentNode.insertBefore(panel, section);
      panel.classList.add("ctw-docked");
    }
    docked = true;
  }

  /* ---- 2. cockpit selection → library (shared selection) ----------------- */
  function subscribeCockpit() {
    if (subscribed || !window.CurriculumCockpit || !window.CurriculumCockpit.onSelect) return;
    subscribed = true;
    window.CurriculumCockpit.onSelect(function (id) {
      if (syncing) return;
      openInLibrary(id, false); // sync the library view, never yank the viewport
    });
  }

  /* ---- 3. library selection → cockpit (delegated, once) ------------------ */
  function listenLibrary() {
    if (listening) return;
    listening = true;
    document.addEventListener("change", function (e) {
      var sel = e.target && e.target.closest && e.target.closest("#interactive-hub .lesson-select");
      if (sel) syncCockpitFromLibrary(sel.closest(".unit-card"));
    });
    document.addEventListener("click", function (e) {
      var rail = e.target && e.target.closest && e.target.closest(".curr-rail-item");
      if (!rail) return;
      // Read after the sidebar's own click handler has switched the active unit.
      requestAnimationFrame(function () {
        syncCockpitFromLibrary(document.querySelector("#interactive-hub .unit-card.curr-active"));
      });
    });
  }

  /* ---- explicit quick-jump buttons --------------------------------------- */
  function wireCockpitButton() {
    var panel = cockpit();
    if (!panel || !window.CurriculumCockpit) return;
    var actions = panel.querySelector(".ctw-actions");
    if (!actions || actions.querySelector(".merge-open-library-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctw-secondary merge-open-library-btn";
    btn.innerHTML = "See all resources ↓";
    btn.addEventListener("click", function () {
      var id = window.CurriculumCockpit.getSelected && window.CurriculumCockpit.getSelected();
      if (id) openInLibrary(id, true);
    });
    actions.appendChild(btn);
  }
  function wireLibraryButtons() {
    if (!window.CurriculumCockpit) return;
    document.querySelectorAll("#interactive-hub .unit-card").forEach(function (card) {
      var header = card.querySelector(".unit-card-header") || card;
      if (header.querySelector(".merge-teach-btn")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "merge-teach-btn";
      btn.innerHTML = "↑ Teach / Launch this lesson";
      btn.setAttribute("aria-label", "Load this lesson in the teaching command center above");
      btn.addEventListener("click", function () {
        var id = lessonIdShownInCard(card);
        if (id) window.CurriculumCockpit.select(id, { scroll: true });
      });
      header.appendChild(btn);
    });
  }

  function tick() {
    dock();
    subscribeCockpit();
    wireCockpitButton();
    wireLibraryButtons();
  }

  function boot() {
    listenLibrary();
    tick();
    var scheduled = false;
    var obs = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        tick();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    var tries = 0;
    var timer = setInterval(function () {
      tick();
      if ((docked && subscribed && document.querySelector(".merge-teach-btn")) || ++tries > 60) {
        clearInterval(timer);
      }
    }, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
