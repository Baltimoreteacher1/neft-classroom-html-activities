/* ==========================================================================
   Neft Teacher — Projects ANSWER-KEY LINK layer (shared)

   Audit item 3: every unit ships a teacher answer key at
   math/<unit>/projects/answer-key/, but nothing linked to them — 0 references
   across the 23 project wizard pages and all 3 hubs — so teachers had no path
   to the key while looking at the project their students are working on.

   This layer adds ONE teacher-only link from each project page to its OWN
   unit's answer key, derived from location.pathname:

       /math/<unit>/projects/version-<v>/  ->  /math/<unit>/projects/answer-key/

   TEACHER GATE — deliberately identical to shared/projects/projects-gold.js:
     • localStorage "nt-teacher-mode" in {1, true, on, yes}, OR
     • sessionStorage "nt-answer-console-ok" === "1" (set by projects-gold.js
       after a correct TEACHER_PIN entry on the grading console).
   When neither holds, this module returns BEFORE creating any element: the
   link is absent from the DOM, not merely hidden by CSS. There is deliberately
   no PIN prompt here — an "unlock the answer key" affordance visible to
   students is exactly the leak this layer must not create. Teachers unlock via
   the existing grading-console PIN flow (projects-gold.js) or teacher mode.

   401 HANDLING — answer-key URLs are behind Basic Auth
   (functions/_middleware.js gates any path containing "answer-key" with the
   SITE_PASSWORD secret). That auth is NOT this layer's business to change, so
   the link degrades gracefully instead: on mount it probes the answer-key URL
   with fetch() — which returns 401 silently rather than popping the browser
   credential dialog — and relabels itself with a calm explanation when the
   teacher area needs a sign-in. The anchor stays live either way, so clicking
   it still triggers the normal browser sign-in prompt: explained, never a dead
   end. A 404 (key not published for this unit) degrades to an inert note.

   Gated on <body class="pro-projects">. Idempotent. Purely additive: no id is
   renamed, no existing node is moved, so Save/Resume and the report are
   untouched. Injected by tools/inject-projects-answerkey-link.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  // ⚠️ KEEP IN SYNC with shared/projects/projects-gold.js (same gate, same keys).
  var SESSION_KEY = "nt-answer-console-ok";
  var TEACHER_MODE_KEY = "nt-teacher-mode";

  function isTeacherMode() {
    try {
      var v = (localStorage.getItem(TEACHER_MODE_KEY) || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_e) {
      return false;
    }
  }

  function isConsoleUnlocked() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function isTeacher() {
    return isTeacherMode() || isConsoleUnlocked();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function bi(en, es) {
    var span = document.createDocumentFragment();
    var a = document.createElement("span");
    a.className = "en-text";
    a.textContent = en;
    var b = document.createElement("span");
    b.className = "es-text";
    b.textContent = es;
    span.appendChild(a);
    span.appendChild(b);
    return span;
  }

  /* Derive this page's OWN unit answer key. Any leading prefix is preserved so
     the link is correct under a local preview server as well as production. */
  function answerKeyHref() {
    var p = "";
    try {
      p = location.pathname || "";
    } catch (_e) {
      return null;
    }
    var m = p.match(/^(.*\/math\/[^/]+\/projects\/)version-[a-z]\/?(?:index\.html?)?$/i);
    return m ? m[1] + "answer-key/" : null;
  }

  /* -> { en: "Unit 7", es: "Unidad 7" } (or "" when the path is unexpected). */
  function unitLabel() {
    var p = "";
    try {
      p = location.pathname || "";
    } catch (_e) {
      return { en: "", es: "" };
    }
    var m = p.match(/\/math\/([^/]+)\/projects\//i);
    if (!m) return { en: "", es: "" };
    var slug = m[1];
    var u = slug.match(/^unit-(\d+)$/i);
    if (u) return { en: "Unit " + u[1], es: "Unidad " + u[1] };
    if (/^statistics$/i.test(slug)) return { en: "Statistics", es: "Estadística" };
    var pretty = slug.charAt(0).toUpperCase() + slug.slice(1);
    return { en: pretty, es: pretty };
  }

  /* Insert next to the hero so a teacher sees it without scrolling, but always
     AFTER the hero's own content so nothing student-facing is displaced. */
  function mountPoint() {
    var hero = document.querySelector("header.hero, .hero");
    if (hero && hero.parentNode) return { parent: hero.parentNode, before: hero.nextSibling };
    var firstStep = document.querySelector(".step-panel");
    if (firstStep && firstStep.parentNode)
      return { parent: firstStep.parentNode, before: firstStep };
    return { parent: document.body, before: null };
  }

  function build(href) {
    var wrap = document.createElement("aside");
    wrap.className = "ntak-bar no-print";
    wrap.setAttribute("role", "note");
    wrap.setAttribute("data-ntak-state", "ready");
    wrap.setAttribute("aria-label", "Teacher answer key");

    var badge = document.createElement("span");
    badge.className = "ntak-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = "🔑";

    var text = document.createElement("span");
    text.className = "ntak-text";
    var label = unitLabel();
    text.appendChild(
      bi(
        "Teacher only — you are in teacher mode.",
        "Solo para el maestro — estás en modo maestro.",
      ),
    );

    var link = document.createElement("a");
    link.className = "ntak-link";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(
      bi(
        "Open the " + (label.en ? label.en + " " : "") + "answer key →",
        "Abrir la clave de respuestas" + (label.es ? " de " + label.es : "") + " →",
      ),
    );

    var note = document.createElement("p");
    note.className = "ntak-note";
    note.hidden = true;

    wrap.appendChild(badge);
    wrap.appendChild(text);
    wrap.appendChild(link);
    wrap.appendChild(note);
    return { wrap: wrap, link: link, note: note };
  }

  function setNote(note, en, es) {
    note.textContent = "";
    note.appendChild(bi(en, es));
    note.hidden = false;
  }

  /* Probe the key BEFORE the teacher clicks. fetch() returns 401 silently —
     it never raises the browser's Basic Auth dialog — so we can explain the
     sign-in requirement calmly and still leave the anchor clickable (a real
     navigation DOES raise the dialog, which is the actual way in). */
  function probe(ui, href) {
    if (typeof fetch !== "function") return;
    fetch(href, { method: "GET", credentials: "same-origin", redirect: "follow" })
      .then(function (res) {
        if (!res) return;
        if (res.status === 401 || res.status === 403) {
          ui.wrap.setAttribute("data-ntak-state", "locked");
          ui.link.textContent = "";
          ui.link.appendChild(
            bi("Sign in to open the answer key →", "Inicia sesión para abrir la clave →"),
          );
          setNote(
            ui.note,
            "The answer key lives in the teacher area, so it asks for the teacher site password first. Click the link, enter the teacher password when your browser asks, and the key opens in a new tab.",
            "La clave está en el área del maestro, por eso pide primero la contraseña del sitio para maestros. Haz clic en el enlace, escribe la contraseña cuando el navegador la pida y la clave se abrirá en una pestaña nueva.",
          );
          return;
        }
        if (res.status === 404 || res.status === 410) {
          ui.wrap.setAttribute("data-ntak-state", "missing");
          ui.link.removeAttribute("href");
          ui.link.setAttribute("aria-disabled", "true");
          setNote(
            ui.note,
            "No answer key has been published for this unit's projects yet.",
            "Todavía no se ha publicado una clave de respuestas para los proyectos de esta unidad.",
          );
          return;
        }
        if (!res.ok) {
          ui.wrap.setAttribute("data-ntak-state", "unknown");
          setNote(
            ui.note,
            "The answer key did not respond just now. Try the link — if it still does not open, you may need to sign in to the teacher area.",
            "La clave no respondió en este momento. Prueba el enlace; si aún no se abre, quizá debas iniciar sesión en el área del maestro.",
          );
        }
      })
      .catch(function () {
        // Offline / blocked probe: fail OPEN. The plain link still works and
        // the browser will handle sign-in itself.
        ui.wrap.setAttribute("data-ntak-state", "unknown");
        setNote(
          ui.note,
          "Could not check the answer key from here. The link still works — you may be asked to sign in to the teacher area.",
          "No se pudo verificar la clave desde aquí. El enlace sigue funcionando — quizá te pidan iniciar sesión en el área del maestro.",
        );
      });
  }

  function run() {
    var body = document.body;
    if (!body || !body.classList.contains("pro-projects")) return;
    if (body.dataset.ntAkLinkInit === "1") return; // idempotent
    // TEACHER GATE — students exit here, before any node is created, so the
    // link is ABSENT from the DOM rather than hidden by CSS.
    if (!isTeacher()) return;

    var href = answerKeyHref();
    if (!href) return;

    body.dataset.ntAkLinkInit = "1";

    var ui = build(href);
    var slot = mountPoint();
    try {
      slot.parent.insertBefore(ui.wrap, slot.before);
    } catch (_e) {
      document.body.appendChild(ui.wrap);
      return;
    }
    try {
      probe(ui, href);
    } catch (_e) {
      /* probe is best-effort; the link is already usable */
    }
  }

  ready(run);
  // Teacher mode is often flipped after load (unified toggle / PIN console), so
  // give the gate a second look — still a no-op for students.
  setTimeout(run, 900);

  if (typeof window !== "undefined") window.NTAnswerKeyLink = run;
})();
