/* ==========================================================================
   Curriculum Hub — Units & Lessons merge bridge (Option 1).
   Docks the teacher Command Center ("Plan it. Teach it. Launch it.") directly
   on top of the Units & Lessons library and links their lesson selection both
   ways, so the two surfaces read as ONE:
     • cockpit  = act on the selected lesson (teach / launch / Canvas / QR)
     • library  = browse every unit → lesson → resource
   Additive + defensive: runs after curriculum-teacher-workflow.js (exposes
   window.CurriculumCockpit) and curriculum-enhancements.js/​-sidebar.js build
   #interactive-hub. Idempotent; re-applies on async re-renders.
   ========================================================================== */
(function () {
  "use strict";

  var docked = false;

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
  // The library section, including the sidebar shell the rail is wrapped in.
  function librarySection() {
    var lib = libraryEl();
    if (!lib) return null;
    return lib.closest(".curr-shell") || lib;
  }

  /* ---- lesson id ⇄ {unitNum, lessonIdx} map, from the hub's own data ------ */
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
          var num =
            u.unitIndex != null ? String(u.unitIndex) : (String(u.num).match(/\d+/) || [])[0];
          return { unitNum: num, idx: j };
        }
      }
    }
    return null;
  }
  function unitNumOfCard(card) {
    var el = card.querySelector(".unit-card-num");
    var m = el && el.textContent.match(/\d+/);
    return m ? m[0] : null;
  }
  function lessonIdShownInCard(card) {
    var h = hub();
    if (!h) return null;
    var sel = card.querySelector(".lesson-select");
    var num = unitNumOfCard(card);
    if (!sel || num == null) return null;
    var unit = null;
    (h.unitsData || []).forEach(function (u) {
      if (String(u.num) === String(num) || String(u.unitIndex) === String(num)) unit = u;
    });
    if (!unit) return null;
    var lesson = (unit.lessons || [])[parseInt(sel.value, 10) || 0];
    return lesson ? lesson.lessonId : null;
  }

  /* ---- cockpit → library: open the cockpit's lesson in the browser -------- */
  function openInLibrary(lessonId) {
    var where = locate(lessonId);
    if (!where) return false;
    var rail =
      document.querySelector('.curr-rail-item[data-num="' + where.unitNum + '"]') ||
      document.querySelector('.curr-rail-item[data-num="' + where.unitNum + '"]');
    if (rail) rail.click(); // activates that unit's card (+ scrolls the shell)
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
    var section = librarySection();
    if (section) {
      try {
        section.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      } catch (_e) {}
    }
    return true;
  }

  /* ---- 1. dock the cockpit directly above the library -------------------- */
  function dock() {
    if (docked) return;
    var panel = cockpit();
    var section = librarySection();
    if (!panel || !section || !section.parentNode) return;
    if (panel.nextElementSibling === section) {
      docked = true;
      return;
    }
    section.parentNode.insertBefore(panel, section);
    panel.classList.add("ctw-docked");
    docked = true;
  }

  /* ---- 2. cockpit action: "Open in Units & Lessons ↓" -------------------- */
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
      if (id) openInLibrary(id);
    });
    actions.appendChild(btn);
  }

  /* ---- 3. library action per unit card: "▲ Teach / Launch this lesson" --- */
  function wireLibraryButtons() {
    if (!window.CurriculumCockpit) return;
    var cards = document.querySelectorAll("#interactive-hub .unit-card");
    cards.forEach(function (card) {
      var header = card.querySelector(".unit-card-header") || card;
      if (header.querySelector(".merge-teach-btn")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "merge-teach-btn";
      btn.innerHTML = "↑ Teach / Launch this lesson";
      btn.setAttribute("aria-label", "Load this lesson in the teaching command center above");
      btn.addEventListener("click", function () {
        var id = lessonIdShownInCard(card);
        if (id) window.CurriculumCockpit.select(id);
      });
      header.appendChild(btn);
    });
  }

  function tick() {
    dock();
    wireCockpitButton();
    wireLibraryButtons();
  }

  function boot() {
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
    // Safety net for late async data loads.
    var tries = 0;
    var timer = setInterval(function () {
      tick();
      if ((docked && document.querySelector(".merge-teach-btn")) || ++tries > 60) {
        clearInterval(timer);
      }
    }, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
