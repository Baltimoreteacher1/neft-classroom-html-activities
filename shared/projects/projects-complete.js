// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Neft Teacher — Projects COMPLETE layer (shared)

   One additive layer that closes four gaps on the 23 culminating-project
   wizard pages. Nothing existing is moved, renamed, or restructured, so
   Save/Resume, grading, the report, and the level system are untouched.

     B1  Completion record — writes localStorage["nt-project-complete:v1"],
         the exact contract the /math/projects/portfolio/ page reads. Keyed by
         canonical page path; merges (never clobbers) other pages' records.
     B2  Interactive rubric self-scoring — turns the display-only
         <table class="rubric"> into a keyboard-accessible radio grid with a
         live total. Persists under "nt-project-rubric:<path>".
     B3  Exit reflection — three bilingual prompts with sentence frames,
         appended to the LAST step panel. Persists under
         "nt-project-reflect:<path>"; folded into the generated report + print.
     B4  Optional submission — "Send to my teacher" posts the completion
         record to /api/progress/telemetry using the SAME payload shape as
         shared/projects/projects-publisher.js. Strictly non-blocking: a
         failed/unavailable request never stops a student finishing.

   Completion hook: `function buildReport` is global on all 23 pages and is the
   only universal one (`finishProject` exists on 8). We wrap window.buildReport
   idempotently (a `__ntWrapped` marker), re-checking on a short bounded retry
   because the page may define it after this deferred script runs. A text-match
   click fallback covers any page that ever loses the global.

   Gated on <body class="pro-projects">. Idempotent (body.dataset.ntCompleteInit).
   Injected by tools/inject-projects-complete.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var COMPLETE_KEY = "nt-project-complete:v1";
  var RUBRIC_PREFIX = "nt-project-rubric:";
  var REFLECT_PREFIX = "nt-project-reflect:";
  /* ---------------------------------------------------------------- utils */

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function lsGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_e) {
      return false;
    }
  }
  function jsonGet(key, fallback) {
    var raw = lsGet(key);
    if (!raw) return fallback;
    try {
      var v = JSON.parse(raw);
      return v && typeof v === "object" ? v : fallback;
    } catch (_e) {
      return fallback;
    }
  }
  function jsonSet(key, value) {
    try {
      return lsSet(key, JSON.stringify(value));
    } catch (_e) {
      return false;
    }
  }

  /* Canonical page path: "/math/unit-4/projects/version-a/".
     Normalised so "…/version-a" and "…/version-a/index.html" agree with the
     path the portfolio and the hub link to. */
  function canonicalPath() {
    var p = "/";
    try {
      p = location.pathname || "/";
    } catch (_e) {}
    p = String(p).replace(/index\.html?$/i, "");
    if (p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  var PATH = canonicalPath();
  var RUBRIC_KEY = RUBRIC_PREFIX + PATH;
  var REFLECT_KEY = REFLECT_PREFIX + PATH;

  /* /math/<unit>/projects/version-<v>/ -> { unit, version } */
  function pathInfo() {
    var m = PATH.match(/\/math\/([a-z0-9-]+)\/projects\/version-([a-z])\//i);
    return {
      unit: m ? m[1].toLowerCase() : "",
      version: m ? m[2].toLowerCase() : "",
    };
  }

  /* "Pop-Up Shop Owner — Unit 4 Culminating Project" -> "Pop-Up Shop Owner" */
  function projectTitle() {
    var t = String(document.title || "").trim();
    var cut = t.split(/\s+[—|]\s+/)[0];
    return (cut || t).trim();
  }

  function projectLevel() {
    var cn = (document.body && document.body.className) || "";
    var m = cn.match(/\blevel-([0-9]+)\b/);
    var n = m ? parseInt(m[1], 10) : 1;
    return n === 0 || n === 1 || n === 2 ? n : 1;
  }

  function isEs() {
    var b = document.body;
    return !!(b && b.classList.contains("es"));
  }

  /* Bilingual sibling spans, mirroring the pages' own convention. */
  function bi(en, es) {
    return (
      '<span class="en-text">' + esc(en) + '</span><span class="es-text">' + esc(es) + "</span>"
    );
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function t(en, es) {
    return isEs() ? es : en;
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ------------------------------------------------------- B2: rubric state */

  var rubric = {
    groups: [], // [{ key, name, criterion, max }]
    max: 0,
    totalEl: null,
  };

  function readRubricScores() {
    return jsonGet(RUBRIC_KEY, {}) || {};
  }

  function rubricSummary() {
    var scores = readRubricScores();
    var total = 0;
    var picked = 0;
    for (var i = 0; i < rubric.groups.length; i++) {
      var v = scores[rubric.groups[i].key];
      if (typeof v === "number" && isFinite(v)) {
        total += v;
        picked++;
      }
    }
    if (!rubric.groups.length || !picked) return { total: null, max: null, stars: 0, picked: 0 };
    return {
      total: total,
      max: rubric.max,
      stars: starsFor(total, rubric.max),
      picked: picked,
    };
  }

  function starsFor(total, max) {
    if (!max || typeof total !== "number") return 0;
    var pct = total / max;
    if (pct >= 0.9) return 3;
    if (pct >= 0.75) return 2;
    if (pct >= 0.5) return 1;
    return 0;
  }

  function cellText(cell) {
    if (!cell) return "";
    var pref = cell.querySelector(".en-text");
    return String((pref || cell).textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildRubric() {
    var tables = document.querySelectorAll("table.rubric");
    if (!tables.length) return;

    Array.prototype.forEach.call(tables, function (table, tIdx) {
      if (table.dataset.ntcRubric === "1") return;

      var headRow = table.querySelector("thead tr");
      if (!headRow) return;
      var headCells = headRow.children;
      var scoreByCol = {};
      var maxScore = 0;
      for (var c = 0; c < headCells.length; c++) {
        var m = String(headCells[c].className || "").match(/\bscore-(\d+)\b/);
        if (!m) continue;
        var val = parseInt(m[1], 10);
        if (!isFinite(val)) continue;
        scoreByCol[c] = val;
        if (val > maxScore) maxScore = val;
      }
      if (!maxScore) return; // unexpected shape — leave the table alone

      var rows = table.querySelectorAll("tbody tr");
      if (!rows.length) return;

      var added = 0;
      Array.prototype.forEach.call(rows, function (row, rIdx) {
        var cells = row.children;
        var criterion = cellText(cells[0]) || "Criterion " + (rIdx + 1);
        var key = tIdx + "-" + rIdx;
        var name = "ntc-rubric-" + tIdx + "-" + rIdx;
        var rowAdded = 0;

        for (var i = 0; i < cells.length; i++) {
          if (!(i in scoreByCol)) continue;
          var score = scoreByCol[i];
          var label = el("label", "ntc-pick");
          var input = document.createElement("input");
          input.type = "radio";
          input.name = name;
          input.value = String(score);
          input.className = "ntc-pick-input";
          input.setAttribute("aria-label", criterion + " — " + t("score", "puntaje") + " " + score);
          var face = el("span", "ntc-pick-face");
          face.setAttribute("aria-hidden", "true");
          face.textContent = String(score);
          label.appendChild(input);
          label.appendChild(face);
          cells[i].insertBefore(label, cells[i].firstChild);
          rowAdded++;
        }

        if (rowAdded) {
          rubric.groups.push({ key: key, name: name, criterion: criterion, max: maxScore });
          added += rowAdded;
        }
      });

      if (!added) return;
      table.dataset.ntcRubric = "1";
      table.classList.add("ntc-rubric-live");
    });

    if (!rubric.groups.length) return;
    rubric.max = rubric.groups.reduce(function (a, g) {
      return a + g.max;
    }, 0);

    // Restore saved picks.
    var saved = readRubricScores();
    rubric.groups.forEach(function (g) {
      var v = saved[g.key];
      if (typeof v !== "number") return;
      var input = document.querySelector(
        'input.ntc-pick-input[name="' + g.name + '"][value="' + v + '"]',
      );
      if (input) {
        input.checked = true;
        markPicked(input);
      }
    });

    document.addEventListener("change", function (ev) {
      var target = ev.target;
      if (!target || !target.classList || !target.classList.contains("ntc-pick-input")) return;
      onRubricChange(target);
    });

    mountRubricTotal();
    refreshRubricTotal();
  }

  function markPicked(input) {
    var name = input.name;
    Array.prototype.forEach.call(
      document.querySelectorAll('input.ntc-pick-input[name="' + name + '"]'),
      function (other) {
        var lbl = other.parentNode;
        if (lbl && lbl.classList) lbl.classList.toggle("is-picked", other.checked);
        var cell = lbl && lbl.parentNode;
        if (cell && cell.classList) cell.classList.toggle("ntc-cell-picked", other.checked);
      },
    );
  }

  function onRubricChange(input) {
    markPicked(input);
    var g = null;
    for (var i = 0; i < rubric.groups.length; i++) {
      if (rubric.groups[i].name === input.name) {
        g = rubric.groups[i];
        break;
      }
    }
    if (!g) return;
    var scores = readRubricScores();
    scores[g.key] = parseInt(input.value, 10);
    jsonSet(RUBRIC_KEY, scores);
    refreshRubricTotal();
  }

  function mountRubricTotal() {
    var anchor = document.querySelector("table.rubric.ntc-rubric-live");
    if (!anchor || !anchor.parentNode) return;
    var box = el("div", "ntc-total");
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.innerHTML =
      '<span class="ntc-total-label">' +
      bi("You scored", "Obtuviste") +
      '</span> <strong class="ntc-total-num">—</strong>' +
      '<span class="ntc-total-hint">' +
      bi(
        "Score yourself honestly — this is how you know what to fix.",
        "Califícate con honestidad: así sabes qué mejorar.",
      ) +
      "</span>";
    anchor.parentNode.insertBefore(box, anchor.nextSibling);
    rubric.totalEl = box.querySelector(".ntc-total-num");
  }

  function refreshRubricTotal() {
    if (!rubric.totalEl) return;
    var s = rubricSummary();
    rubric.totalEl.textContent = s.total == null ? "— / " + rubric.max : s.total + " / " + s.max;
    var host = rubric.totalEl.parentNode;
    if (host && host.classList) host.classList.toggle("is-scored", s.total != null);
  }

  /* --------------------------------------------------- B3: exit reflection */

  var PROMPTS = [
    {
      id: "r1",
      en: "What did the math show you in this project?",
      es: "¿Qué te mostraron las matemáticas en este proyecto?",
      frameEn: "The math showed me that…",
      frameEs: "Las matemáticas me mostraron que…",
    },
    {
      id: "r2",
      en: "Where did you get stuck, and what did you do about it?",
      es: "¿Dónde te atascaste y qué hiciste al respecto?",
      frameEn: "I got stuck on… so I…",
      frameEs: "Me atasqué en… así que…",
    },
    {
      id: "r3",
      en: "Name one place outside school where you would use this.",
      es: "Nombra un lugar fuera de la escuela donde usarías esto.",
      frameEn: "I could use this when…",
      frameEs: "Podría usar esto cuando…",
    },
  ];

  var reflectSaveTimer = null;

  function readReflection() {
    return jsonGet(REFLECT_KEY, {}) || {};
  }

  function lastStepPanel() {
    var panels = document.querySelectorAll(".step-panel");
    if (!panels.length) return null;
    var best = null;
    var bestN = -1;
    Array.prototype.forEach.call(panels, function (p, i) {
      var m = String(p.id || "").match(/(\d+)\s*$/);
      var n = m ? parseInt(m[1], 10) : i;
      if (n >= bestN) {
        bestN = n;
        best = p;
      }
    });
    return best || panels[panels.length - 1];
  }

  function buildReflection() {
    var panel = lastStepPanel();
    if (!panel || panel.querySelector(".ntc-reflect")) return;

    var saved = readReflection();
    var sec = el("section", "ntc-reflect");
    sec.setAttribute("aria-labelledby", "ntc-reflect-h");

    var h = el("h3", "ntc-reflect-h");
    h.id = "ntc-reflect-h";
    h.innerHTML = "🪞 " + bi("Before you finish — think back", "Antes de terminar — reflexiona");
    sec.appendChild(h);

    var note = el(
      "p",
      "ntc-reflect-note",
      bi(
        "Three quick sentences. Start with the sentence starter if that helps.",
        "Tres oraciones rápidas. Usa el inicio de oración si te ayuda.",
      ),
    );
    sec.appendChild(note);

    PROMPTS.forEach(function (p, i) {
      var wrap = el("div", "ntc-reflect-item");
      var id = "ntc-reflect-" + p.id;

      var label = el("label", "ntc-reflect-label", "" + (i + 1) + ". " + bi(p.en, p.es));
      label.setAttribute("for", id);

      var ta = document.createElement("textarea");
      ta.id = id;
      ta.className = "ntc-reflect-input";
      ta.rows = 2;
      ta.setAttribute("data-ntc-reflect", p.id);
      ta.placeholder = isEs() ? p.frameEs : p.frameEn;
      ta.value = typeof saved[p.id] === "string" ? saved[p.id] : "";

      // Print echo: textarea values are unreliable on paper across browsers.
      var echo = el("div", "ntc-reflect-echo");
      echo.setAttribute("aria-hidden", "true");
      echo.textContent = ta.value;

      ta.addEventListener("input", function () {
        echo.textContent = ta.value;
        scheduleReflectSave();
      });

      wrap.appendChild(label);
      wrap.appendChild(ta);
      wrap.appendChild(echo);
      sec.appendChild(wrap);
    });

    sec.appendChild(buildSubmitRow());

    // Keep the placeholders in the active language.
    document.addEventListener("click", function (ev) {
      var tgt = ev.target;
      if (!tgt || !tgt.closest) return;
      if (!tgt.closest(".lang-btn, [onclick*='setLang'], [onclick*='toggleLang']")) return;
      setTimeout(refreshReflectPlaceholders, 60);
    });

    // Insert before the panel's own trailing nav row so Back/Finish stay last.
    var navRows = [];
    Array.prototype.forEach.call(panel.children, function (child) {
      if (child.classList && child.classList.contains("nav-row")) navRows.push(child);
    });
    var anchor = navRows.length ? navRows[navRows.length - 1] : null;
    if (anchor) panel.insertBefore(sec, anchor);
    else panel.appendChild(sec);
  }

  function refreshReflectPlaceholders() {
    var es = isEs();
    PROMPTS.forEach(function (p) {
      var ta = document.getElementById("ntc-reflect-" + p.id);
      if (ta) ta.placeholder = es ? p.frameEs : p.frameEn;
    });
  }

  function scheduleReflectSave() {
    if (reflectSaveTimer) clearTimeout(reflectSaveTimer);
    reflectSaveTimer = setTimeout(saveReflection, 400);
  }

  function saveReflection() {
    reflectSaveTimer = null;
    var out = {};
    PROMPTS.forEach(function (p) {
      var ta = document.getElementById("ntc-reflect-" + p.id);
      if (ta && ta.value) out[p.id] = String(ta.value).slice(0, 2000);
    });
    jsonSet(REFLECT_KEY, out);
  }

  function reflectionAnswers() {
    var out = {};
    var live = false;
    PROMPTS.forEach(function (p) {
      var ta = document.getElementById("ntc-reflect-" + p.id);
      if (ta) {
        live = true;
        if (ta.value) out[p.id] = String(ta.value);
      }
    });
    return live ? out : readReflection();
  }

  /* ---------------------------------------------------- B4: submit to teacher */

  function buildSubmitRow() {
    var row = el("div", "ntc-submit-row no-print");

    var btn = el("button", "ntc-submit-btn");
    btn.type = "button";
    btn.innerHTML =
      "✓ " + bi("Mark complete on this device", "Marcar completo en este dispositivo");

    var status = el("span", "ntc-submit-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    var hint = el(
      "p",
      "ntc-submit-hint",
      bi(
        "This keeps your reflection private. Use the project report or export when your teacher asks for it.",
        "Esto mantiene privada tu reflexión. Usa el informe o la exportación cuando tu maestro lo pida.",
      ),
    );

    btn.addEventListener("click", function () {
      // ALWAYS record locally first — the network can never gate completion.
      var record = recordCompletion("submit");
      btn.disabled = true;
      status.className = "ntc-submit-status is-busy";
      status.textContent = t("Saving…", "Guardando…");
      submitTelemetry(record)
        .then(function (ok) {
          status.className = "ntc-submit-status " + (ok ? "is-ok" : "is-local");
          status.textContent = t(
            "Saved on this device — show your teacher your report.",
            "Guardado en este dispositivo: muéstrale tu resumen a tu maestro.",
          );
          btn.disabled = false;
        })
        .catch(function () {
          status.className = "ntc-submit-status is-local";
          status.textContent = t(
            "Saved on this device — show your teacher your report.",
            "Guardado en este dispositivo: muéstrale tu resumen a tu maestro.",
          );
          btn.disabled = false;
        });
    });

    row.appendChild(btn);
    row.appendChild(status);
    row.appendChild(hint);
    return row;
  }

  /* Completion is deliberately local-only. A project report/export is the
     student-controlled handoff; reflections and identity are never silently
     posted from the public student bundle. */
  function submitTelemetry(record) {
    void record;
    return Promise.resolve(false);
  }

  /* ------------------------------------------------- B1: completion record */

  function readAllRecords() {
    return jsonGet(COMPLETE_KEY, {}) || {};
  }

  function recordCompletion(source) {
    var info = pathInfo();
    var s = rubricSummary();
    var rec = {
      unit: info.unit,
      version: info.version,
      title: projectTitle(),
      completedAt: new Date().toISOString(),
      stars: s.stars,
      rubricTotal: s.total,
      rubricMax: s.max,
      level: projectLevel(),
    };
    if (source) rec.source = source;

    var all = readAllRecords();
    var prev = all[PATH];
    // Idempotent UPDATE: keep the first completion timestamp for context.
    if (prev && prev.completedAt) rec.firstCompletedAt = prev.firstCompletedAt || prev.completedAt;
    all[PATH] = rec;
    jsonSet(COMPLETE_KEY, all);

    try {
      document.dispatchEvent(
        new CustomEvent("nt:project-complete", { detail: { path: PATH, record: rec } }),
      );
    } catch (_e) {}
    return rec;
  }

  /* --------------------------------------- report enrichment + hook wiring */

  var REPORT_MARK = "─── REFLECTION / REFLEXIÓN ───";

  function appendToReport() {
    var box = document.getElementById("reportBox");
    if (!box) return;
    var base = String(box.textContent || "");
    if (!base.trim()) return;
    var cut = base.indexOf(REPORT_MARK);
    if (cut > -1) base = base.slice(0, cut).replace(/\s+$/, "");

    var lines = ["", REPORT_MARK];
    var s = rubricSummary();
    if (s.total != null) {
      lines.push("Self-scored rubric / Autoevaluación: " + s.total + " / " + s.max);
      lines.push("Stars / Estrellas: " + "★".repeat(s.stars) + "☆".repeat(3 - s.stars));
    }
    var refl = reflectionAnswers();
    var any = false;
    PROMPTS.forEach(function (p, i) {
      var v = refl[p.id];
      if (!v) return;
      any = true;
      lines.push("");
      lines.push(i + 1 + ". " + p.en);
      lines.push("   " + String(v).replace(/\n+/g, " "));
    });
    if (!any && s.total == null) return;
    box.textContent = base + "\n" + lines.join("\n") + "\n";
  }

  function afterReport() {
    var box = document.getElementById("reportBox");
    if (!box || !String(box.textContent || "").trim()) return;
    appendToReport();
    recordCompletion("report");
  }

  var wrapAttempts = 0;

  function ensureWrapped() {
    var orig = window.buildReport;
    if (typeof orig !== "function") return false;
    if (orig.__ntWrapped) return true;
    function wrapped() {
      var out;
      try {
        out = orig.apply(this, arguments);
      } finally {
        try {
          afterReport();
        } catch (_e) {}
        // Re-assert the wrapper in case anything reassigned the global.
        setTimeout(ensureWrapped, 0);
      }
      return out;
    }
    wrapped.__ntWrapped = true;
    wrapped.__ntOrig = orig;
    try {
      window.buildReport = wrapped;
    } catch (_e) {
      return false;
    }
    return true;
  }

  // Bounded retry: the page's inline script normally defines buildReport before
  // this deferred file runs, but never assume it.
  function pollForHook() {
    if (ensureWrapped()) return;
    if (++wrapAttempts > 8) return;
    setTimeout(pollForHook, 150 * wrapAttempts);
  }

  /* DETERMINISTIC ARMING. Measured on live unit-1-version-a: __ntWrapped was
     still false at click time, so completion was being recorded by the text
     fallback, not the wrapper — the bounded retry above loses the race on a
     page whose inline script defines buildReport late. Rather than lengthen the
     retry (which only moves the race), define the property so ANY later
     assignment routes through the wrapper.

     Best-effort by design: a page that declared `function buildReport(){}` at
     top level owns a non-configurable binding on some engines, so this can
     throw. It returns false there and pollForHook + the click fallback still
     cover it — this narrows the window, it does not replace the backstops. */
  function armHookDeterministically() {
    if (ensureWrapped()) return true;
    var current = window.buildReport;
    try {
      Object.defineProperty(window, "buildReport", {
        configurable: true,
        enumerable: true,
        get: function () {
          return current;
        },
        set: function (fn) {
          current = fn;
          // Wrap on assignment, so the page defining buildReport later is armed
          // the instant it does so rather than whenever a poll next fires.
          if (typeof fn === "function" && !fn.__ntWrapped) {
            setTimeout(ensureWrapped, 0);
          }
        },
      });
      return true;
    } catch (_e) {
      return false;
    }
  }

  // "I'm done" affordances — always a real completion.
  /* Articles and determiners are optional on BOTH sides. The literal forms
     missed math/pre-unit/projects/version-a, whose button reads
     "🏁 Finish the project 🏁 Terminar el proyecto": "finish the project" and
     "terminar el proyecto" both failed, the Spanish one on a single article.
     A completion path that depends on exact button text is a completion path
     that fails silently on a bilingual site, for the students least able to
     report it. Widened, and the deterministic hook below means this is now a
     backstop rather than the primary mechanism. */
  var FINISH_RE =
    /(project\s+finished|finish(?:\s+(?:the|my|this))?\s+project|i'?m\s+finished|proyecto\s+terminado|terminar\s+(?:el\s+|mi\s+|este\s+)?proyecto)/i;
  // "Make my summary" affordances — a completion ONLY if the report actually
  // filled in. Some pages (e.g. statistics-b) guard buildReport behind
  // "do Step 1 first" and return false; that must NOT count as finished.
  var REPORT_RE = /(generate summary|generar resumen)/i;

  function wireClickFallback() {
    document.addEventListener(
      "click",
      function (ev) {
        var node = ev.target;
        if (!node || !node.closest) return;
        var btn = node.closest("button, a, [role='button']");
        if (!btn) return;
        var txt = String(btn.textContent || "")
          .replace(/\s+/g, " ")
          .trim();
        if (!txt || txt.length > 80) return;
        var isFinish = FINISH_RE.test(txt);
        var isReport = REPORT_RE.test(txt);
        if (!isFinish && !isReport) return;
        // Let the page's own handler run first, then record.
        setTimeout(function () {
          try {
            ensureWrapped();
            if (isFinish) {
              appendToReport();
              recordCompletion("click");
            } else {
              afterReport(); // no-ops when the report never rendered
            }
          } catch (_e) {}
        }, 80);
      },
      true,
    );
  }

  /* ---------------------------------------------- cross-device completion */
  /* The completion record is a plain localStorage key, and the save/resume
     payload only carries fields/navigation/dragDrop/custom/progressPercent —
     so a student who finished a project on a classroom Chromebook and restored
     their save code at home got their WORK back but not their COMPLETION. The
     portfolio showed 0 finished and the certificate was unavailable. Canvas
     already reports these as incomplete by design, so on the second device the
     completion existed in neither system.

     Registered as a state PROVIDER/RESTORER rather than special-casing the
     export. A special case is the shape that drifts; the provider contract is
     what the engine already maintains for every other custom payload. */
  function registerCompletionTravel() {
    var sr = window.NeftSaveResume;
    if (!sr || typeof sr.registerStateProvider !== "function") return;

    sr.registerStateProvider(function () {
      // Carry ONLY this page's record. COMPLETE_KEY is a merged map across
      // every project; shipping the whole map in every project's save code
      // would grow without bound and put one project's state in another's
      // export.
      var mine = jsonGet(COMPLETE_KEY, {})[PATH];
      return mine ? { projectComplete: mine } : null;
    });

    sr.registerStateRestorer(function (payload) {
      if (!payload || !payload.projectComplete) return;
      // MERGE, never clobber: this device may already hold completions for
      // other projects and a restore must not erase them. An existing local
      // record also wins over an imported one — a completion recorded on this
      // device is first-hand, while the import may be an older snapshot of the
      // same work.
      var all = jsonGet(COMPLETE_KEY, {});
      if (all[PATH]) return;
      all[PATH] = payload.projectComplete;
      jsonSet(COMPLETE_KEY, all);
    });
  }

  /* -------------------------------------------------------------- bootstrap */

  function run() {
    if (!document.body || !document.body.classList.contains("pro-projects")) return;
    if (document.body.dataset.ntCompleteInit === "1") return;
    document.body.dataset.ntCompleteInit = "1";

    try {
      buildRubric();
    } catch (e) {
      if (window.console) console.warn("[projects-complete] rubric skipped:", e);
    }
    try {
      buildReflection();
    } catch (e) {
      if (window.console) console.warn("[projects-complete] reflection skipped:", e);
    }
    try {
      registerCompletionTravel();
    } catch (e) {
      if (window.console) console.warn("[projects-complete] travel skipped:", e);
    }
    try {
      armHookDeterministically();
      pollForHook();
      wireClickFallback();
    } catch (e) {
      if (window.console) console.warn("[projects-complete] hook skipped:", e);
    }
    try {
      window.addEventListener("beforeunload", function () {
        if (reflectSaveTimer) saveReflection();
      });
    } catch (_e) {}
  }

  ready(run);

  window.NTComplete = {
    run: run,
    path: PATH,
    record: recordCompletion,
    records: readAllRecords,
    rubric: rubricSummary,
    reflection: reflectionAnswers,
    stars: starsFor,
    submit: function () {
      return submitTelemetry(recordCompletion("api"));
    },
  };
})();
