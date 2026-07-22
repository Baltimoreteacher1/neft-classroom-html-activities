/* ==========================================================================
   Projects PUBLISHER — publisher-grade pedagogy layer for the unit
   culminating-project wizard pages. Companion to projects-publisher.css;
   same contract as the PRO / GOLD layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive and defensive: every feature is try/caught, every DOM
       lookup guarded; a missing element is a no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Wraps — never replaces — the page's own globals, preserving behavior.

   Features:
     1. Sentence starters: every written-response <textarea> inside a
        .step-panel gets a "Need a starter?" chip row. Frames come from the
        page's ./publisher.json (keyed by textarea id) with generic academic-
        language fallbacks, so Level 1 students always have language support.
     2. Exemplar panel ("What strong work looks like"): rendered from
        ./publisher.json into the final step. Samples model the STRUCTURE of
        a great answer in a parallel scenario — never this project's numbers —
        so it scaffolds without giving anything away.
     3. Rubric self-assessment: the static rubric grows a "Rate My Work"
        panel — one rating row per criterion, keyboard/SR accessible,
        persisted per page in localStorage, with a live summary and a
        "my next improvement" goal box. buildReport() is wrapped so the
        student's self-assessment is appended to the printed/copied report.
     4. Peer exemplar gallery: approved classmate work fetched from the
        public GET /api/progress/exemplars route (teacher approves rows in
        the gradebook ⭐). Server-side redacted (first-name initial +
        excerpts); silently renders nothing when the API or data is absent.
     5. Milestone reporting: watches .step-panel navigation and sends a
        fire-and-forget "milestone" telemetry event per step reached, plus
        NeftCanvasBridge.reportScore(stepPct) on forward transitions so
        SCORM-wrapped projects grade progressively.

   Injected by tools/inject-projects-publisher.mjs
   (sentinel: projects-publisher).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var STORE_PREFIX = "nt-pub:";

  var GENERIC_STARTERS = [
    "I noticed that ___ because ___.",
    "My strategy was to ___ so that ___.",
    "This shows ___ , which means ___.",
  ];
  var GENERIC_STARTERS_ES = [
    "Noté que ___ porque ___.",
    "Mi estrategia fue ___ para que ___.",
    "La evidencia ___ muestra ___, lo cual significa ___.",
  ];

  function storeKey(suffix) {
    var path = "";
    try {
      path = location.pathname || "";
    } catch (e) {}
    return STORE_PREFIX + path + ":" + suffix;
  }

  function readStore(suffix) {
    try {
      return localStorage.getItem(storeKey(suffix));
    } catch (e) {
      return null;
    }
  }

  function writeStore(suffix, value) {
    try {
      localStorage.setItem(storeKey(suffix), value);
    } catch (e) {}
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function biEl(tag, className, en, es) {
    var node = el(tag, className);
    node.appendChild(el("span", "en-text", en));
    node.appendChild(el("span", "es-text", es));
    return node;
  }

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains("pro-projects")) return;
    if (body.dataset.pubInit === "1") return; // idempotent
    body.dataset.pubInit = "1";

    var content = null;
    var apply = function () {
      try {
        buildStarters(content);
      } catch (e) {}
      try {
        buildExemplar(content);
      } catch (e) {}
      try {
        buildSelfAssessment();
      } catch (e) {}
      try {
        foldIntoReport();
      } catch (e) {}
      try {
        stepCoherence();
      } catch (e) {}
      try {
        buildPeerGallery();
      } catch (e) {}
      try {
        watchMilestones();
      } catch (e) {}
    };

    document.addEventListener("neft:award-studio-mounted", function () {
      try {
        buildStarters(content);
      } catch (e) {}
    });

    // publisher.json lives next to each page; a 404 / file:// failure just
    // means generic starters and no exemplar — never an error.
    if (typeof fetch === "function") {
      fetch("./publisher.json", { cache: "no-cache" })
        .then(function (res) {
          return res && res.ok ? res.json() : null;
        })
        .then(function (json) {
          content = json && typeof json === "object" ? json : null;
        })
        .catch(function () {
          content = null;
        })
        .then(apply, apply);
    } else {
      apply();
    }
  }

  /* --- 4. Step-number coherence -------------------------------------------
     Panel headings, in-page prose, and the generated report all number the
     WORK steps 1..N, treating Key Words as an unnumbered prep panel — but the
     page-built trail chips and progress label count panels positionally
     (1..N+1). Students then see "Step 4 of 6" directly above a heading that
     says "Step 3". Relabel the chips + progress label to the headings' own
     scheme so every number on screen agrees. The page rebuilds both on every
     navigation, so a MutationObserver re-applies; writes only happen when a
     value is wrong, so the observer can never loop. */
  function stepCoherence() {
    var trail = document.getElementById("stepTrail");
    var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
    if (!trail || !panels.length) return;
    if (trail.dataset.pubCoherence === "1") return;

    // Each panel's own step number, read from its heading (null = prep panel).
    var nums = panels.map(function (p) {
      var h = p.querySelector("h2.card-title");
      var m = h && /Step\s+(\d+)/i.exec(h.textContent || "");
      return m ? m[1] : null;
    });
    var workTotal = nums.reduce(function (mx, n) {
      return n ? Math.max(mx, Number(n)) : mx;
    }, 0);
    // Nothing to fix when headings already count positionally (or unnumbered).
    if (!workTotal || workTotal >= panels.length) return;
    trail.dataset.pubCoherence = "1";

    var progLabel = document.getElementById("progLabel");
    var applyLabels = function () {
      var items = trail.querySelectorAll(".step-trail-item");
      if (items.length === panels.length) {
        for (var i = 0; i < items.length; i++) {
          var s = items[i].querySelector(".s-num");
          if (!s) continue;
          var want = nums[i] === null ? "★" : String(nums[i]);
          // Only positional digits are wrong; never touch the done "✓".
          if (/^\d+$/.test(s.textContent.trim()) && s.textContent.trim() !== want)
            s.textContent = want;
        }
      }
      if (progLabel) {
        var active = document.querySelector(".step-panel.active");
        var idx = panels.indexOf(active);
        if (idx !== -1) {
          var k = nums[idx];
          var en = k ? "Step " + k + " of " + workTotal : "Get Ready — Key Words";
          var es = k ? "Paso " + k + " de " + workTotal : "Preparación — Palabras clave";
          var enSpan = progLabel.querySelector(".en-text");
          var esSpan = progLabel.querySelector(".es-text");
          if (enSpan || esSpan) {
            if (enSpan && enSpan.textContent !== en) enSpan.textContent = en;
            if (esSpan && esSpan.textContent !== es) esSpan.textContent = es;
          } else {
            var text = document.body.classList.contains("es") ? es : en;
            if (progLabel.textContent !== text) progLabel.textContent = text;
          }
        }
      }
    };

    applyLabels();
    var mo = new MutationObserver(function () {
      try {
        applyLabels();
      } catch (e) {}
    });
    mo.observe(trail, { childList: true, subtree: true, characterData: true });
    if (progLabel) mo.observe(progLabel, { childList: true, subtree: true, characterData: true });
    var wizard = trail.closest(".wizard") || document.body;
    mo.observe(wizard, { attributes: true, attributeFilter: ["class"], subtree: true });
  }

  /* --- 1. Sentence starters on written-response boxes ---------------------- */
  function buildStarters(content) {
    var frames = (content && content.starters) || {};
    var areas = document.querySelectorAll(".step-panel textarea");
    areas.forEach(function (area) {
      if (area.dataset.pubStarters === "1") return;
      area.dataset.pubStarters = "1";

      var list = (area.id && frames[area.id]) || frames._default || GENERIC_STARTERS;
      var listEs = GENERIC_STARTERS_ES;
      if (!list || !list.length) return;

      var wrap = el("div", "pub-starters no-print");
      var label = biEl("span", "pub-starters-label", "Need a starter?", "¿Necesitas un comienzo?");
      wrap.appendChild(label);

      list.slice(0, 3).forEach(function (frame, index) {
        var spanishFrame = listEs[index] || listEs[0];
        var chip = biEl(
          "button",
          "pub-chip",
          frame.replace(/___/g, "…"),
          spanishFrame.replace(/___/g, "…"),
        );
        chip.type = "button";
        chip.setAttribute(
          "aria-label",
          "Insert sentence starter / Insertar comienzo de oración: " + frame + " / " + spanishFrame,
        );
        chip.addEventListener("click", function () {
          var starter = document.body.classList.contains("es") ? spanishFrame : frame;
          var current = area.value;
          area.value = current ? current.replace(/\s*$/, "\n") + starter : starter;
          area.focus();
          try {
            area.setSelectionRange(area.value.length, area.value.length);
          } catch (e) {}
          try {
            area.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e) {}
        });
        wrap.appendChild(chip);
      });

      if (area.parentNode) area.parentNode.insertBefore(wrap, area.nextSibling);
    });
  }

  /* --- 2. Exemplar: what strong work looks like ---------------------------- */
  function buildExemplar(content) {
    var ex = content && content.exemplar;
    if (!ex || !ex.traits || !ex.traits.length) return;
    if (document.querySelector(".pub-exemplar")) return;

    var rubric = document.querySelector("table.rubric");
    var host = rubric
      ? rubric.closest(".gold-scroll") || rubric
      : document.querySelector(".step-panel:last-of-type .card, .step-panel:last-of-type");
    if (!host || !host.parentNode) return;

    var details = el("details", "pub-exemplar");
    var summary = el("summary", "pub-exemplar-summary");
    summary.appendChild(el("span", "pub-exemplar-badge", "★"));
    summary.appendChild(
      biEl("span", null, ex.title || "What strong work looks like", "Cómo se ve un trabajo sólido"),
    );
    details.appendChild(summary);

    var inner = el("div", "pub-exemplar-body");
    if (ex.intro)
      inner.appendChild(
        biEl(
          "p",
          "pub-exemplar-intro",
          ex.intro,
          "Un trabajo sólido muestra las cantidades, conecta representaciones, justifica una decisión y reconoce límites.",
        ),
      );

    var spanishTraits = [
      [
        "Muestra cantidades y unidades",
        "Escribe la operación, sustituye los valores y etiqueta las unidades.",
        "El lector puede verificar el razonamiento.",
      ],
      [
        "Conecta dos representaciones",
        "Usa una ecuación y también una tabla, gráfica, diagrama o modelo.",
        "Las representaciones muestran la misma relación de dos maneras.",
      ],
      [
        "Justifica con evidencia",
        "Mi recomendación es ___ porque las cantidades ___ muestran ___.",
        "La decisión depende de evidencia matemática, no solo de una preferencia.",
      ],
      [
        "Reconoce límites y revisa",
        "Una limitación es ___. Después de recibir comentarios, revisé ___.",
        "La revisión muestra aprendizaje y mejora el modelo.",
      ],
    ];
    ex.traits.forEach(function (t, index) {
      if (!t || !t.trait) return;
      var spanish = spanishTraits[index] || spanishTraits[0];
      var card = el("div", "pub-trait");
      card.appendChild(biEl("div", "pub-trait-name", t.trait, spanish[0]));
      if (t.sample) {
        var q = biEl(
          "blockquote",
          "pub-trait-sample",
          "“" + t.sample + "”",
          "“" + spanish[1] + "”",
        );
        card.appendChild(q);
      }
      if (t.why)
        card.appendChild(
          biEl("div", "pub-trait-why", "Why it works: " + t.why, "Por qué funciona: " + spanish[2]),
        );
      inner.appendChild(card);
    });

    inner.appendChild(
      biEl(
        "p",
        "pub-exemplar-note",
        "These samples come from a different project — borrow the moves, not the numbers.",
        "Estos ejemplos vienen de otro proyecto: usa las estrategias, no los números.",
      ),
    );
    details.appendChild(inner);
    host.parentNode.insertBefore(details, host);
  }

  /* --- 3. Rubric self-assessment ------------------------------------------- */
  var RATING_LABELS = ["Getting started", "On my way", "Got it", "Teaching level"];

  function rubricCriteria() {
    var rubric = document.querySelector("table.rubric");
    if (!rubric) return [];
    var rows = rubric.querySelectorAll("tr");
    var out = [];
    rows.forEach(function (row) {
      var first = row.querySelector("td");
      if (!first) return; // header row
      var name = (first.textContent || "").trim();
      if (name) out.push(name);
    });
    return out;
  }

  function buildSelfAssessment() {
    var rubric = document.querySelector("table.rubric");
    if (!rubric || document.querySelector(".pub-selfassess")) return;
    var criteria = rubricCriteria();
    if (!criteria.length) return;

    var host = rubric.closest(".gold-scroll") || rubric;
    if (!host.parentNode) return;

    var saved = {};
    try {
      saved = JSON.parse(readStore("selfassess") || "{}") || {};
    } catch (e) {
      saved = {};
    }

    var panel = el("section", "pub-selfassess");
    panel.setAttribute("aria-label", "Rate my work self-assessment");
    panel.appendChild(el("h3", "pub-selfassess-title", "Rate My Work"));
    panel.appendChild(
      el(
        "p",
        "pub-selfassess-hint",
        "You get to grade your work first. Rate each row of the rubric honestly — then pick one thing to level up. Finished work you save can appear in the class gallery once your teacher approves it.",
      ),
    );

    var live = el("p", "pub-selfassess-summary");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");

    criteria.forEach(function (name, idx) {
      var row = el("div", "pub-sa-row");
      var label = el("span", "pub-sa-name", name);
      var group = el("div", "pub-sa-group");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Rating for " + name);

      RATING_LABELS.forEach(function (rating, r) {
        var btn = el("button", "pub-sa-btn", rating);
        btn.type = "button";
        btn.dataset.crit = String(idx);
        btn.dataset.val = String(r + 1);
        btn.setAttribute("aria-pressed", saved[idx] === r + 1 ? "true" : "false");
        if (saved[idx] === r + 1) btn.classList.add("active");
        btn.addEventListener("click", function () {
          saved[idx] = r + 1;
          group.querySelectorAll(".pub-sa-btn").forEach(function (b) {
            var on = b === btn;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
          writeStore("selfassess", JSON.stringify(saved));
          updateSummary();
        });
        group.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(group);
      panel.appendChild(row);
    });

    var goalLabel = el(
      "label",
      "pub-sa-goal-label",
      "One thing I will improve before I turn this in:",
    );
    var goal = document.createElement("textarea");
    goal.className = "pub-sa-goal";
    goal.id = "pub-sa-goal";
    goal.rows = 2;
    goal.value = readStore("goal") || "";
    goalLabel.setAttribute("for", goal.id);
    goal.addEventListener("input", function () {
      writeStore("goal", goal.value);
    });

    panel.appendChild(live);
    panel.appendChild(goalLabel);
    panel.appendChild(goal);

    function updateSummary() {
      var rated = Object.keys(saved).length;
      if (!rated) {
        live.textContent = "";
        return;
      }
      var lowest = null;
      Object.keys(saved).forEach(function (k) {
        if (lowest === null || saved[k] < saved[lowest]) lowest = k;
      });
      var msg = "You rated " + rated + " of " + criteria.length + " rows.";
      if (lowest !== null && saved[lowest] < RATING_LABELS.length) {
        msg += " Growth spot: " + criteria[lowest] + ".";
      } else if (rated === criteria.length) {
        msg += " All at teaching level — make sure your evidence backs it up!";
      }
      live.textContent = msg;
    }
    updateSummary();

    host.parentNode.insertBefore(panel, host.nextSibling);
  }

  /* --- 5. Peer exemplar gallery ---------------------------------------------
     Approved classmate work from the public exemplars route. The server
     redacts to first-name initial + short excerpts and only ever returns
     teacher-approved rows, so this is classroom-safe by construction. Any
     failure (offline, 429/503, empty) renders nothing. */
  function activitySlug() {
    // Mirrors NeftSaveResume._resolveConfig autoId so we query the same
    // activity_id that save/resume writes into student_progress.
    var path = "/";
    try {
      path = location.pathname || "/";
    } catch (e) {}
    return (
      String(path.replace(/index\.html?$/i, "").replace(/\/+$/, "") || "home")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "home"
    );
  }

  function buildPeerGallery() {
    if (typeof fetch !== "function") return;
    if (document.querySelector(".pub-peer-gallery")) return;

    fetch("/api/progress/exemplars?activity=" + encodeURIComponent(activitySlug()))
      .then(function (res) {
        return res && res.ok ? res.json() : null;
      })
      .then(function (d) {
        if (!d || !d.ok || !Array.isArray(d.exemplars) || !d.exemplars.length) return;
        if (document.querySelector(".pub-peer-gallery")) return;

        // Sit right after the static exemplar when present, else before rubric.
        var anchor = document.querySelector(".pub-exemplar");
        var host = anchor;
        if (!host) {
          var rubric = document.querySelector("table.rubric");
          host = rubric ? rubric.closest(".gold-scroll") || rubric : null;
        }
        if (!host || !host.parentNode) return;

        var details = el("details", "pub-exemplar pub-peer-gallery");
        var summary = el("summary", "pub-exemplar-summary");
        summary.appendChild(el("span", "pub-exemplar-badge", "🌟"));
        summary.appendChild(el("span", null, "From students like you · De estudiantes como tú"));
        details.appendChild(summary);

        var inner = el("div", "pub-exemplar-body");
        inner.appendChild(
          el(
            "p",
            "pub-exemplar-intro",
            "Real work from classmates, approved by your teacher. Borrow the moves, not the words.",
          ),
        );
        d.exemplars.slice(0, 6).forEach(function (x) {
          if (!x) return;
          var card = el("div", "pub-trait");
          card.appendChild(
            el(
              "div",
              "pub-trait-name",
              (x.firstNameInitial || "A classmate") + (x.section ? " · " + x.section : ""),
            ),
          );
          (Array.isArray(x.excerpts) ? x.excerpts : []).slice(0, 3).forEach(function (t) {
            if (!t) return;
            var q = el("blockquote", "pub-trait-sample");
            q.textContent = "“" + String(t) + "”";
            card.appendChild(q);
          });
          if (x.note) card.appendChild(el("div", "pub-trait-why", "Teacher's note: " + x.note));
          inner.appendChild(card);
        });
        details.appendChild(inner);
        host.parentNode.insertBefore(details, anchor ? anchor.nextSibling : host);
      })
      .catch(function () {});
  }

  /* --- 6. Milestone reporting ------------------------------------------------
     One fire-and-forget "milestone" telemetry event per step reached (teachers
     see mid-project stalls in the mastery/radar tools), plus a progressive
     SCORM score on new-furthest steps. Navigation alone is capped at 65 — below
     the SCO's 70 mastery line — so status can never become "passed" without
     real work; the canvas-bridge auto-watch still reports the true final
     score from save/resume percentComplete. */
  function watchMilestones() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
    if (panels.length < 2) return;
    var body = document.body;
    if (body.dataset.pubMilestones === "1") return;
    body.dataset.pubMilestones = "1";

    var total = panels.length;
    var seen = {};
    var maxStep = 0;

    function sendMilestone(step) {
      if (typeof fetch !== "function") return;
      try {
        var now = new Date().toISOString();
        var payload = {
          activityId: activitySlug(),
          activityTitle: (document.title || "").slice(0, 200),
          standard: "",
          kind: "telemetry",
          events: [
            {
              id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
              event: "milestone",
              lessonSlug: activitySlug(),
              standard: "",
              ts: now,
              props: { step: step, of: total },
            },
          ],
          createdAt: now,
        };
        try {
          var stu = JSON.parse(localStorage.getItem("nt_student") || "{}");
          if (stu && typeof stu === "object") {
            if (stu.name) payload.studentName = String(stu.name).slice(0, 60);
            if (stu.section) payload.section = String(stu.section).slice(0, 40);
          }
        } catch (e) {}
        fetch("/api/progress/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
          credentials: "omit",
        }).catch(function () {});
      } catch (e) {}
    }

    function check() {
      var active = document.querySelector(".step-panel.active");
      var idx = panels.indexOf(active);
      if (idx < 0 || seen[idx]) return;
      seen[idx] = true;
      var step = idx + 1;
      sendMilestone(step);
      if (step > maxStep) {
        maxStep = step;
        try {
          if (
            window.NeftCanvasBridge &&
            typeof window.NeftCanvasBridge.reportScore === "function"
          ) {
            window.NeftCanvasBridge.reportScore(Math.min(65, Math.round((100 * maxStep) / total)));
          }
        } catch (e) {}
      }
    }

    check();
    var mo = new MutationObserver(function () {
      try {
        check();
      } catch (e) {}
    });
    panels.forEach(function (p) {
      mo.observe(p, { attributes: true, attributeFilter: ["class"] });
    });
  }

  /* --- 4. Fold self-assessment into the student report --------------------- */
  function foldIntoReport() {
    if (typeof window.buildReport !== "function") return;
    var orig = window.buildReport;
    window.buildReport = function () {
      var out = orig.apply(this, arguments);
      try {
        var box = document.getElementById("reportBox");
        if (box && box.textContent && box.textContent.indexOf("SELF-ASSESSMENT") === -1) {
          var saved = {};
          try {
            saved = JSON.parse(readStore("selfassess") || "{}") || {};
          } catch (e) {}
          var criteria = rubricCriteria();
          var lines = [];
          criteria.forEach(function (name, idx) {
            if (saved[idx]) lines.push("  " + name + ": " + RATING_LABELS[saved[idx] - 1]);
          });
          var goal = readStore("goal") || "";
          if (lines.length || goal.trim()) {
            var block = "\n\nSELF-ASSESSMENT (Rate My Work)\n" + lines.join("\n");
            if (goal.trim()) block += "\n  My improvement goal: " + goal.trim();
            box.textContent += block;
          }
          // Fold in the real prices/data the student captured during the
          // research price-hunt (the [data-research-find] inputs) so their
          // authentic findings appear in the printed/submitted report.
          if (box.textContent.indexOf("RESEARCH I GATHERED") === -1) {
            var rlines = [];
            var rnodes = document.querySelectorAll("input[data-research-find]");
            [].forEach.call(rnodes, function (node) {
              var v = (node.value || "").trim();
              if (v) rlines.push("  • " + v);
            });
            if (rlines.length) {
              box.textContent +=
                "\n\nRESEARCH I GATHERED (real prices & data)\n" + rlines.join("\n");
            }
          }
          if (
            window.NeftAwardStudio &&
            typeof window.NeftAwardStudio.getSummary === "function" &&
            box.textContent.indexOf("COMMUNITY MATH STUDIO EVIDENCE") === -1
          ) {
            box.textContent += "\n\n" + window.NeftAwardStudio.getSummary();
          }
        }
      } catch (e) {}
      return out;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
