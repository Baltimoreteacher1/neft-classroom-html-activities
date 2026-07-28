/* ==========================================================================
   Projects PARTNER GUIDE — step-by-step partner-work coaching for the unit
   culminating projects. Companion to projects-partner.css. SAME contract as
   the VISUALS / CHECK / META layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive & defensive: every DOM lookup guarded, every feature
       try/caught; a missing element is a silent no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Never touches the page's own globals, inputs, or buildReport().

   WHY THIS EXISTS: Level 2 students generally self-start on these projects.
   Level 0 and Level 1 students stall at the "what do we actually do first"
   moment, and pairing them up only helps if both partners know what their job
   is. This layer gives each step an explicit partner script.

   LEVEL GATING (L0 < L1 < L2, see the pages' own .lvl0-only / .lvl1-only):
     • body.level-0 → full script: named roles, one concrete move each, a
       worked "watch first" line, and sentence starters.
     • body.level-1 → lighter script: roles + compare-and-explain prompts.
     • body.level-2 → nothing renders. The dock is not built at all.

   Roles ALTERNATE by step so the same student is not always the one holding
   the pencil — Driver enters the numbers, Checker re-reads and questions.
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

  function movesFor(lvl) {
    return lvl === 0 ? L0_MOVES : L1_MOVES;
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

  function mount() {
    try {
      if (!document.body || !document.body.classList.contains("pro-projects")) return;
      if (document.body.dataset[MOUNT_FLAG]) return;

      var lvl = level();
      if (lvl === null || lvl > 1) return; // Level 2 gets nothing.

      var panels = document.querySelectorAll(".step-panel");
      if (!panels.length) return;

      var built = 0;
      for (var i = 0; i < panels.length; i++) {
        /* Skip the final submit/finish panel — there is no math to pair on. */
        if (panels[i].querySelector("[data-finish], .finish-panel")) continue;
        if (buildPanel(panels[i], i, lvl)) built++;
      }
      if (built) document.body.dataset[MOUNT_FLAG] = "1";
    } catch (e) {
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
    } catch (e) {}
  }

  function boot() {
    mount();
    watchLevel();
    /* Safety net: some pages build their step panels from script after
       DOMContentLoaded. One late retry, then stop. */
    setTimeout(mount, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
