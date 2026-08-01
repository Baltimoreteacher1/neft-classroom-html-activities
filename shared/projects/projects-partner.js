// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Projects PARTNER GUIDE — step-by-step partner-work coaching for the unit
   culminating projects. Companion to projects-partner.css. SAME contract as
   the VISUALS / CHECK / META layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive & defensive: every DOM lookup guarded, every feature
       try/caught; a missing element is a silent no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Never touches the page's own globals, inputs, or buildReport().

   WHY THIS EXISTS: pairing students only helps if both partners know what
   their job is. This layer gives every work step an explicit partner script,
   pitched differently per level.

   LEVEL GATING (L0 < L1 < L2, see the pages' own .lvl0-only / .lvl1-only):
     • body.level-0 → full 5-move script, a worked "watch first" line, and the
       card AUTO-OPENS the first time the student lands on each step.
     • body.level-1 → 4-move answer-alone-then-compare script.
     • body.level-2 → 4-move argument script (trade papers, argue the other
       answer). Level 2 does not need procedure, it needs to be pushed past
       "we agreed, we're done".

   Roles ALTERNATE by step so the same student is not always the one holding
   the pencil — Driver enters the numbers, Checker re-reads and questions.

   Per-project coaching comes from projects-partner-config.json (keyed by
   pathname): a "watch out" line naming the mistake THIS project produces and
   a partner question only that project's math makes sense of. A page with no
   entry keeps the generic script; a failed fetch never blocks rendering.

   WARM-UP RELOCATION: the .pki-hero "Try it first" challenge is injected at
   the top of step 1. At Level 2 that is a good hook; at Level 0/1 it is a
   cold-start barrier in front of the students least able to self-start. At
   those levels it is moved to the last WORK step and re-badged "Extra
   practice". Reversible — switching to Level 2 puts it back.
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var MOUNT_FLAG = "ntPartnerMounted";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Matches the other project layers: emit both languages and let the page's
     own body.es CSS decide which one is visible. Never translate at runtime. */
  function bi(en, es) {
    return (
      '<span class="en-text">' + esc(en) + '</span><span class="es-text">' + esc(es) + "</span>"
    );
  }

  function level() {
    var b = document.body;
    if (!b) return null;
    if (b.classList.contains("level-0")) return 0;
    if (b.classList.contains("level-1")) return 1;
    return 2;
  }

  /* ---------- the partner script -----------------------------------------
     Generic on purpose: these moves work on any of the 23 projects because
     every step of every project is "read the ask → put numbers in → check
     the result". Step-specific math coaching already lives in the CHECK
     layer's hint ladder; duplicating it here would just be noise. */

  var ROLES = [
    {
      driver: { en: "Driver", es: "Conductor" },
      checker: { en: "Checker", es: "Revisor" },
    },
  ];

  var L0_MOVES = [
    {
      en: "Driver: read the step out loud. Stop at the question mark.",
      es: "Conductor: lee el paso en voz alta. Detente en el signo de interrogación.",
    },
    {
      en: "Checker: say what the step is asking for, in your own words.",
      es: "Revisor: di qué te pide el paso, con tus propias palabras.",
    },
    {
      en: "Together: point to the numbers you need. Write only those down.",
      es: "Juntos: señalen los números que necesitan. Escriban solo esos.",
    },
    {
      en: "Driver: type your answer. Checker: does it look too big or too small?",
      es: "Conductor: escribe tu respuesta. Revisor: ¿se ve muy grande o muy pequeña?",
    },
    {
      en: "Both: tap Check my work. If it flags a box, re-read that box together.",
      es: "Los dos: toquen Revisa mi trabajo. Si marca una casilla, reléanla juntos.",
    },
  ];

  var L1_MOVES = [
    {
      en: "Each of you answers the step on your own first — no talking yet.",
      es: "Cada uno responde el paso por su cuenta primero, sin hablar todavía.",
    },
    {
      en: "Compare answers. If they match, explain WHY it works. If not, find where you split.",
      es: "Comparen respuestas. Si coinciden, expliquen POR QUÉ funciona. Si no, busquen dónde se separaron.",
    },
    {
      en: "Checker: ask one 'how do you know?' question before you agree.",
      es: "Revisor: haz una pregunta de '¿cómo lo sabes?' antes de estar de acuerdo.",
    },
    {
      en: "Agree on one answer, then tap Check my work together.",
      es: "Pónganse de acuerdo en una respuesta y después toquen Revisa mi trabajo juntos.",
    },
  ];

  var STARTERS = [
    { en: "I think the step is asking us to…", es: "Creo que el paso nos pide…" },
    { en: "I got ___ because…", es: "Yo obtuve ___ porque…" },
    { en: "How did you know to ___?", es: "¿Cómo supiste que había que ___?" },
    { en: "I disagree because…", es: "No estoy de acuerdo porque…" },
    { en: "Let's check that one again — ", es: "Revisemos esa otra vez… " },
  ];

  var L0_WATCH = {
    en: "Not sure how to start? Open the worked example above this step first, and copy its first line together before you try your own numbers.",
    es: "¿No saben cómo empezar? Abran primero el ejemplo resuelto que está arriba de este paso y copien juntos su primera línea antes de probar con sus propios números.",
  };

  /* Level 2 does not need to be told how to start — it needs to be pushed past
     "we agreed, we're done". These moves are argument work, not procedure. */
  var L2_MOVES = [
    {
      en: "Solve it separately, then trade papers before you talk.",
      es: "Resuélvanlo por separado y después intercambien hojas antes de hablar.",
    },
    {
      en: "Find one thing your partner did that you did not. Was it better?",
      es: "Encuentra algo que tu compañero hizo y tú no. ¿Fue mejor?",
    },
    {
      en: "Argue the OTHER answer on purpose, even if you think yours is right.",
      es: "Defiende a propósito la OTRA respuesta, aunque creas que la tuya es correcta.",
    },
    {
      en: "Agree on the answer you can defend with numbers, not the one you like.",
      es: "Pónganse de acuerdo en la respuesta que puedan defender con números, no en la que les gusta.",
    },
  ];

  function movesFor(lvl) {
    if (lvl === 0) return L0_MOVES;
    if (lvl === 1) return L1_MOVES;
    return L2_MOVES;
  }

  /* Per-project coaching, fetched once. A page with no entry keeps the generic
     script — never blocks rendering on the network. */
  var projectCfg = null;

  function loadConfig() {
    try {
      return fetch("/shared/projects/projects-partner-config.json", { credentials: "same-origin" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          projectCfg = (j && j.pages && j.pages[location.pathname]) || null;
          return projectCfg;
        })
        .catch(function () {
          return null;
        });
    } catch (_e) {
      return Promise.resolve(null);
    }
  }

  /* ---------- build ------------------------------------------------------ */

  function buildPanel(panel, stepIndex, lvl) {
    if (panel.querySelector(".ntp-card")) return false;

    var role = ROLES[0];
    /* Alternate who drives so one partner does not own the keyboard all
       period. Odd steps swap the two names. */
    var swap = stepIndex % 2 === 1;
    var driver = swap ? role.checker : role.driver;
    var checker = swap ? role.driver : role.checker;

    var wrap = document.createElement("details");
    wrap.className = "ntp-card no-print";
    /* Open on the first step so the pair sees the routine once, collapsed
       after that so it never buries the actual work. */
    if (stepIndex === 0) wrap.open = true;

    var summary = document.createElement("summary");
    summary.className = "ntp-summary";
    summary.innerHTML =
      '<span class="ntp-ico" aria-hidden="true">👥</span>' +
      bi("Work this step with a partner", "Trabajen este paso en pareja");
    wrap.appendChild(summary);

    var body = document.createElement("div");
    body.className = "ntp-body";

    var roles = document.createElement("div");
    roles.className = "ntp-roles";
    roles.innerHTML =
      '<span class="ntp-role ntp-role-driver"><strong>' +
      bi(driver.en, driver.es) +
      "</strong> " +
      bi("types the answers", "escribe las respuestas") +
      '</span><span class="ntp-role ntp-role-checker"><strong>' +
      bi(checker.en, checker.es) +
      "</strong> " +
      bi("re-reads and asks questions", "relee y hace preguntas") +
      "</span>";
    body.appendChild(roles);

    var list = document.createElement("ol");
    list.className = "ntp-moves";
    movesFor(lvl).forEach(function (m) {
      var li = document.createElement("li");
      li.innerHTML = bi(m.en, m.es);
      list.appendChild(li);
    });
    body.appendChild(list);

    if (lvl === 0) {
      var watch = document.createElement("p");
      watch.className = "ntp-watch";
      watch.innerHTML = bi(L0_WATCH.en, L0_WATCH.es);
      body.appendChild(watch);
    }

    /* Project-specific coaching. The generic moves above work on any step of
       any project; these two lines are the only place the widget names the
       actual mathematics, which is what makes the card worth reading twice. */
    if (projectCfg && projectCfg.watch) {
      var pw = document.createElement("p");
      pw.className = "ntp-watch ntp-watch-project";
      pw.innerHTML =
        "<strong>" +
        bi("Watch out in this project:", "Ojo en este proyecto:") +
        "</strong> " +
        bi(projectCfg.watch.en, projectCfg.watch.es);
      body.appendChild(pw);
    }
    if (projectCfg && projectCfg.ask) {
      var pa = document.createElement("p");
      pa.className = "ntp-ask";
      pa.innerHTML = bi(projectCfg.ask.en, projectCfg.ask.es);
      body.appendChild(pa);
    }

    var starters = document.createElement("details");
    starters.className = "ntp-starters";
    var sSum = document.createElement("summary");
    sSum.innerHTML = bi("Sentence starters", "Frases para empezar");
    starters.appendChild(sSum);
    var sList = document.createElement("ul");
    STARTERS.forEach(function (s) {
      var li = document.createElement("li");
      li.innerHTML = bi(s.en, s.es);
      sList.appendChild(li);
    });
    starters.appendChild(sList);
    body.appendChild(starters);

    wrap.appendChild(body);

    /* Insert at the TOP of the step panel — the partner routine is what they
       do before touching the inputs, so it must not sit below them. */
    if (panel.firstChild) panel.insertBefore(wrap, panel.firstChild);
    else panel.appendChild(wrap);
    return true;
  }

  /* ---------- warm-up relocation (Level 0 / Level 1) ----------------------
     The interactive hero (`.pki-hero`, "Try it first") is injected at the TOP
     of step 1, so it is the first thing on the page. At Level 2 that is a good
     hook. At Level 0/1 it is a cold-start barrier: a multi-stage challenge
     before any instruction, aimed at exactly the students least able to
     self-start — so they stall before the project even begins.

     Move it to the LAST work step and re-badge it as practice AFTER the
     project. The content is kept, only its position and framing change; at
     Level 2 it is left exactly where it is. Reversible: we stash the original
     parent so a level switch can put it back. */
  var heroHome = null;

  /* The submit step. The pages carry no data-finish hook and no .finish-panel
     class — the only reliable signals are a submit/finish control and the
     heading text (bilingual, so match both languages). Getting this wrong puts
     coaching and the warm-up on the "Finish & Submit" screen where there is no
     math to work on. */
  function isSubmitPanel(panel) {
    try {
      if (panel.querySelector("[data-finish], .finish-panel")) return true;
      var head = (panel.querySelector("h2, h3, .step-title") || {}).textContent || "";
      if (/finish|submit|terminar|enviar/i.test(head)) return true;
      var btns = panel.querySelectorAll("button, input[type=submit]");
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].textContent || btns[i].value || "").trim();
        if (/^(submit|finish|turn in|enviar|terminar)/i.test(t)) return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  }

  /* Last panel a pair actually does math on. */
  function lastWorkPanel() {
    var panels = document.querySelectorAll(".step-panel");
    for (var i = panels.length - 1; i >= 0; i--) {
      if (!isSubmitPanel(panels[i])) return panels[i];
    }
    return null;
  }

  function moveWarmUp(lvl) {
    try {
      var hero = document.querySelector(".pki-hero");
      if (!hero) return;

      if (lvl > 1) {
        // Level 2 — restore to the top of step 1 if we previously moved it.
        if (heroHome && heroHome.parent && hero.dataset.ntpMoved) {
          heroHome.parent.insertBefore(hero, heroHome.parent.firstChild);
          delete hero.dataset.ntpMoved;
          restoreBadge(hero);
        }
        return;
      }

      if (hero.dataset.ntpMoved) return;

      if (document.querySelectorAll(".step-panel").length < 2) return;
      var target = lastWorkPanel();
      if (!target || target.contains(hero)) return;

      heroHome = { parent: hero.parentNode };
      target.appendChild(hero);
      hero.dataset.ntpMoved = "1";
      rebadge(hero);
    } catch (_e) {}
  }

  function rebadge(hero) {
    try {
      var badge = hero.querySelector(".pki-hero-badge");
      if (badge) {
        if (!badge.dataset.ntpOrig) badge.dataset.ntpOrig = badge.textContent;
        badge.textContent = "Extra practice";
      }
      var sub = hero.querySelector(".pki-hero-intro");
      if (sub && !sub.dataset.ntpOrig) {
        sub.dataset.ntpOrig = sub.innerHTML;
        sub.innerHTML =
          bi(
            "Finished the project? Try this challenge with your partner.",
            "¿Terminaron el proyecto? Prueben este reto con su compañero.",
          ) +
          "<br>" +
          sub.dataset.ntpOrig;
      }
    } catch (_e) {}
  }

  function restoreBadge(hero) {
    try {
      var badge = hero.querySelector(".pki-hero-badge");
      if (badge && badge.dataset.ntpOrig) badge.textContent = badge.dataset.ntpOrig;
      var sub = hero.querySelector(".pki-hero-intro");
      if (sub && sub.dataset.ntpOrig) {
        sub.innerHTML = sub.dataset.ntpOrig;
        delete sub.dataset.ntpOrig;
      }
    } catch (_e) {}
  }

  /* ---------- pop-up behaviour --------------------------------------------
     At Level 0 the card auto-opens the first time a student lands on a step,
     so the routine surfaces without them having to know to tap it. After that
     it stays collapsed (per step, per session) so it never nags. Level 1 and
     Level 2 open it themselves. */
  var entrySeen = {};
  var entryWatching = false;

  function watchStepEntry(lvl) {
    if (lvl !== 0 || entryWatching) return;
    entryWatching = true;
    try {
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (!t.classList || !t.classList.contains("step-panel")) continue;
          if (!t.classList.contains("active")) continue;
          var id = t.id || "step";
          if (entrySeen[id]) continue;
          entrySeen[id] = 1;
          var card = t.querySelector(".ntp-card");
          if (card) card.open = true;
        }
      });
      document.querySelectorAll(".step-panel").forEach(function (p) {
        obs.observe(p, { attributes: true, attributeFilter: ["class"] });
      });
    } catch (_e) {}
  }

  function mount() {
    try {
      if (!document.body || !document.body.classList.contains("pro-projects")) return;
      if (document.body.dataset[MOUNT_FLAG]) return;

      var lvl = level();
      if (lvl === null) return;

      var panels = document.querySelectorAll(".step-panel");
      if (!panels.length) return;

      var built = 0;
      for (var i = 0; i < panels.length; i++) {
        /* Skip the final submit/finish panel — there is no math to pair on. */
        if (isSubmitPanel(panels[i])) continue;
        if (buildPanel(panels[i], i, lvl)) built++;
      }
      if (built) document.body.dataset[MOUNT_FLAG] = "1";
      moveWarmUp(lvl);
      watchStepEntry(lvl);
    } catch (_e) {
      /* Never let coaching break the project. */
    }
  }

  /* The level class can change after load (the pages' own level switcher), so
     rebuild when it does. Guarded by the mount flag for the same level. */
  function watchLevel() {
    try {
      var last = level();
      var obs = new MutationObserver(function () {
        var now = level();
        if (now === last) return;
        last = now;
        document.querySelectorAll(".ntp-card").forEach(function (n) {
          n.remove();
        });
        delete document.body.dataset[MOUNT_FLAG];
        mount();
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    } catch (_e) {}
  }

  function boot() {
    /* Render immediately with the generic script so a slow or failed config
       fetch can never leave a student with no guidance, then re-render once
       the project-specific lines arrive. */
    mount();
    watchLevel();
    loadConfig().then(function (cfg) {
      if (!cfg) return;
      rebuild();
    });
    /* Safety net: some pages build their step panels from script after
       DOMContentLoaded. One late retry, then stop. */
    setTimeout(mount, 900);
  }

  function rebuild() {
    try {
      document.querySelectorAll(".ntp-card").forEach(function (n) {
        n.remove();
      });
      delete document.body.dataset[MOUNT_FLAG];
      mount();
    } catch (_e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
