/* ==========================================================================
   Neft Teacher — Projects TEACHER/STUDENT MODE chip (shared)

   THE PROBLEM THIS FIXES
   ----------------------
   Project pages read `nt-teacher-mode` in four places (projects-solve.js,
   projects-future.js, projects-answerkey-link.js, answer-key-gate.css) but
   NOTHING on a project page could change it. There was no way in and, more
   importantly, no way OUT: a teacher who unlocked teacher mode in a lesson and
   then opened a project was stuck showing teacher-only material until they
   navigated back to a lesson or the curriculum hub, flipped it there, and
   navigated back.

   projects-answerkey-link.js documents an alternative unlock —
   sessionStorage "nt-answer-console-ok", "set by projects-gold.js after a
   correct TEACHER_PIN entry" — but nothing in the repo ever writes that key.
   projects-gold.js contains no PIN. So that path did not exist either.

   WHAT THIS ADDS
   --------------
   One chip, top-right (see projects-mode-pill.css for why not bottom):

     • Teacher mode OFF -> a quiet "Teacher" chip. Clicking opens a real
       credential form; the PIN is required.
     • Teacher mode ON  -> a loud amber "Teacher Mode" badge plus a one-click
       "Exit to Student" button. Leaving costs NO password.

   That asymmetry is deliberate and matches engine/core/teacher-mode.js: the
   way IN is gated, the way OUT is always free. Nobody should ever be trapped
   in a mode that reveals answer keys.

   The PIN is a classroom deterrent, not a security boundary — the real
   protection on answer-key URLs is Basic Auth in functions/_middleware.js,
   which this layer does not touch.

   Gated on <body class="pro-projects"> (version wizards) or
   <body class="pk-hub"> (unit project hubs). Idempotent, additive, and it
   mounts nothing if the page already has a chip.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var TEACHER_KEY = "nt-teacher-mode";
  /* ⚠️ KEEP IN SYNC with engine/core/teacher-mode.js and
     assets/curriculum-enhancements.js — all three hold this same literal. */
  var TEACHER_PIN = "BlueHeron2026";

  function isTeacher() {
    try {
      var v = (localStorage.getItem(TEACHER_KEY) || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_e) {
      return false;
    }
  }

  function setTeacher(on) {
    try {
      localStorage.setItem(TEACHER_KEY, on ? "1" : "0");
      return true;
    } catch (_e) {
      // Private browsing with storage blocked: the mode cannot persist, so say
      // so rather than reloading into an unchanged page and looking broken.
      return false;
    }
  }

  /** Bilingual span pair, mirroring the pages' own en-text/es-text markup. */
  function bi(en, es) {
    return '<span class="en-text">' + en + '</span><span class="es-text">' + es + "</span>";
  }

  function mount() {
    var body = document.body;
    if (!body) return;
    if (!body.classList.contains("pro-projects") && !body.classList.contains("pk-hub")) return;
    if (document.querySelector(".ntmp")) return; // already mounted

    var wrap = document.createElement("div");
    wrap.className = "ntmp no-print";

    render(wrap);
    body.appendChild(wrap);

    // Another tab flipped the mode — repaint instead of showing a stale chip.
    window.addEventListener("storage", function (event) {
      if (!event.key || event.key === TEACHER_KEY) render(wrap);
    });
  }

  function render(wrap) {
    wrap.textContent = "";
    if (isTeacher()) renderTeacher(wrap);
    else renderStudent(wrap);
  }

  /* ---------------------------------------------------------- teacher mode */
  function renderTeacher(wrap) {
    var badge = document.createElement("span");
    badge.className = "ntmp-chip is-teacher";
    badge.innerHTML = "👩‍🏫 " + bi("Teacher Mode", "Modo maestro");

    var exit = document.createElement("button");
    exit.type = "button";
    exit.className = "ntmp-exit";
    exit.innerHTML = bi("Exit to Student", "Salir a modo estudiante");
    exit.setAttribute(
      "aria-label",
      "Exit teacher mode and return to the student view of this project",
    );
    exit.addEventListener("click", function () {
      if (!setTeacher(false)) {
        exit.innerHTML = bi("Storage blocked", "Almacenamiento bloqueado");
        return;
      }
      // Reload so the teacher-only layers that decide at mount time
      // (answer-key link, solve notes, future panel) re-evaluate the mode.
      window.location.reload();
    });

    wrap.appendChild(badge);
    wrap.appendChild(exit);
  }

  /* ---------------------------------------------------------- student mode */
  function renderStudent(wrap) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ntmp-chip";
    chip.innerHTML = "👩‍🏫 " + bi("Teacher", "Maestro");
    chip.setAttribute("aria-label", "Switch to teacher mode (password required)");
    chip.addEventListener("click", function () {
      wrap.textContent = "";
      renderForm(wrap);
    });
    wrap.appendChild(chip);
  }

  function renderForm(wrap) {
    var form = document.createElement("form");
    form.className = "ntmp-form";

    // Present only so browser password managers treat this as a credential
    // form and can autofill the PIN on later visits. See the CSS note.
    var user = document.createElement("input");
    user.type = "text";
    user.className = "ntmp-cred-user";
    user.name = "username";
    user.value = "teacher";
    user.readOnly = true;
    user.autocomplete = "username";
    user.tabIndex = -1;
    user.setAttribute("aria-hidden", "true");

    var pin = document.createElement("input");
    pin.type = "password";
    pin.name = "password";
    pin.autocomplete = "current-password";
    pin.placeholder = "Teacher password";
    pin.setAttribute("aria-label", "Teacher password");

    var go = document.createElement("button");
    go.type = "submit";
    go.innerHTML = bi("Enter", "Entrar");

    var err = document.createElement("span");
    err.className = "ntmp-err";
    err.setAttribute("role", "alert");

    form.appendChild(user);
    form.appendChild(pin);
    form.appendChild(go);
    form.appendChild(err);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (pin.value !== TEACHER_PIN) {
        err.textContent = "Nope";
        pin.select();
        return;
      }
      if (!setTeacher(true)) {
        err.textContent = "Storage blocked";
        return;
      }
      window.location.reload();
    });

    // Escape backs out without leaving a password box sitting on a student's
    // screen for the rest of the period.
    form.addEventListener("keydown", function (event) {
      if (event.key === "Escape") render(wrap);
    });

    wrap.appendChild(form);
    pin.focus();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
