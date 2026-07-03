/* ==========================================================================
   Answer-Key Gate — client-side teacher gate for the unit-project answer-key
   pages. Companion to answer-key-gate.css (which hides the solution content
   fail-closed until this script unlocks it).

   Unlock paths, in order:
     1. Teacher mode already on (localStorage nt-teacher-mode, same semantics
        as the site-wide unified toggle).
     2. PIN already entered this browser session (sessionStorage).
     3. The shared teacher PIN typed into the gate card.

   This is a casual-access gate, not cryptographic security — same posture as
   the rest of the site's client-side teacher gating.

   Injected by tools/inject-projects-gold.mjs (sentinel: answer-key-gate).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  // ⚠️ KEEP IN SYNC with TEACHER_PIN in assets/curriculum-enhancements.js
  // and engine/core/teacher-mode.js.
  var TEACHER_PIN = "TeacherNeft";
  var SESSION_KEY = "nt-answer-key-ok";

  function isTeacherMode() {
    try {
      var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (e) {
      return false;
    }
  }

  function hasSessionPass() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function unlock() {
    document.documentElement.classList.add("akg-unlocked");
    var card = document.querySelector(".akg-card");
    if (card) card.remove();
  }

  function buildCard() {
    if (document.querySelector(".akg-card")) return;
    var card = document.createElement("div");
    card.className = "akg-card";
    card.innerHTML =
      '<div class="akg-panel" role="dialog" aria-labelledby="akg-title">' +
      '<h1 id="akg-title">🔐 Teacher Answer Key</h1>' +
      "<p>This page contains worked solutions and grading guidance for the unit project. " +
      "Enter the teacher PIN to view it. Students: please return to your project page.</p>" +
      '<div class="akg-row">' +
      '<label class="akg-visually-hidden" for="akg-pin" style="position:absolute;left:-9999px;">Teacher PIN</label>' +
      '<input type="password" id="akg-pin" autocomplete="off" placeholder="Teacher PIN" />' +
      '<button type="button" id="akg-go">Unlock</button>' +
      "</div>" +
      '<div class="akg-error" id="akg-err" role="alert" aria-live="assertive"></div>' +
      '<a class="akg-back" href="../">&larr; Back to the project hub</a>' +
      "</div>";
    document.body.appendChild(card);

    var pinEl = document.getElementById("akg-pin");
    var errEl = document.getElementById("akg-err");
    function attempt() {
      var val = (pinEl && pinEl.value ? pinEl.value : "").trim();
      if (val === TEACHER_PIN) {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch (e) {}
        unlock();
      } else if (errEl) {
        errEl.textContent = val
          ? "That PIN is not correct. Please check with Mr. Neft."
          : "Please enter the teacher PIN.";
      }
    }
    var goBtn = document.getElementById("akg-go");
    if (goBtn) goBtn.addEventListener("click", attempt);
    if (pinEl)
      pinEl.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") attempt();
      });
    if (pinEl) pinEl.focus();
  }

  function init() {
    if (isTeacherMode() || hasSessionPass()) {
      unlock();
      return;
    }
    buildCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
