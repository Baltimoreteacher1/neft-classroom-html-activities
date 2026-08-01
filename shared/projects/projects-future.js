// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* projects-future.js — additive "future layer" for unit culminating projects.
 *
 * Safe, client-side, no secrets, no backend. Loaded with `defer` AFTER the
 * page's inline scripts, so the page globals (goStep, setLevel, STEPS) already
 * exist. Everything is wrapped defensively: a failure here must NEVER break the
 * project's existing navigation, levels, language toggle, or read-aloud.
 *
 * Adds four research-backed features:
 *   1. Per-step "Explain it back" metacognition prompt (retrieval + self-explain).
 *   2. Submission-ready evidence check (math, reasoning, and rubric evidence).
 *   3. Portfolio summary export (student-as-author, printable artifact).
 *   4. Teacher-only "learning-visible" telemetry (time-on-task, steps, reflections).
 *
 * Storage is local-only, namespaced per page path. Nothing leaves the browser.
 */
(function () {
  "use strict";

  var STORE_KEY = "nt-fut:" + location.pathname;

  // ---- Safe storage helpers -------------------------------------------------
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (_e) {
      return {};
    }
  }
  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_e) {
      /* quota / private mode — ignore, feature degrades silently */
    }
  }
  var state = load();
  state.reflections = state.reflections || {};
  state.hints = state.hints || 0;
  state.maxStep = state.maxStep || 1;
  state.levelUses = state.levelUses || {};
  state.stepMs = state.stepMs || {};
  state.firstSeen = state.firstSeen || Date.now();
  state.lastSeen = Date.now();

  function isTeacher() {
    try {
      var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (_e) {
      return false;
    }
  }

  // ---- Telemetry: time-on-step, hints, levels -------------------------------
  var stepEnter = Date.now();
  var currentTrackedStep = 1;

  function commitStepTime() {
    var dt = Date.now() - stepEnter;
    if (dt > 0 && dt < 1000 * 60 * 60) {
      var key = "s" + currentTrackedStep;
      state.stepMs[key] = (state.stepMs[key] || 0) + dt;
    }
    stepEnter = Date.now();
  }

  // Defensively wrap a global function: preserve behavior + return value,
  // run our hook in try/catch so telemetry can never break the page.
  function wrapGlobal(name, hook) {
    var orig = window[name];
    if (typeof orig !== "function") return false;
    window[name] = function () {
      var ret = orig.apply(this, arguments);
      try {
        hook.apply(null, arguments);
      } catch (_e) {
        /* never let a hook break the underlying action */
      }
      return ret;
    };
    return true;
  }

  function hookNavigation() {
    wrapGlobal("goStep", function (n) {
      n = Number(n);
      if (!n) return;
      commitStepTime();
      currentTrackedStep = n;
      if (n > state.maxStep) state.maxStep = n;
      state.lastSeen = Date.now();
      save(state);
      refreshTeacher();
    });
    wrapGlobal("setLevel", function (n) {
      var k = "L" + n;
      state.levelUses[k] = (state.levelUses[k] || 0) + 1;
      save(state);
      refreshTeacher();
    });
  }

  // Count "help" interactions across the common help/hint controls.
  function hookHints() {
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest(".hint, .prefill-btn, .sr-hint, .ntf-hint")) {
          state.hints++;
          save(state);
          refreshTeacher();
        }
      },
      true,
    );
  }

  // ---- Feature 1: per-step "Explain it back" reflection ---------------------
  var PROMPTS = [
    {
      en: "In one sentence: what math did you use in this step, and why?",
      es: "En una oración: ¿qué matemáticas usaste en este paso y por qué?",
    },
    {
      en: "What was the trickiest part here, and how did you get past it?",
      es: "¿Cuál fue la parte más difícil y cómo la resolviste?",
    },
    {
      en: "Explain your reasoning as if teaching a friend who missed class.",
      es: "Explica tu razonamiento como si le enseñaras a un amigo que faltó.",
    },
    {
      en: "How could you check that your answer makes sense?",
      es: "¿Cómo podrías comprobar que tu respuesta tiene sentido?",
    },
  ];

  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments,
        self = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(self, args);
      }, ms);
    };
  }

  function injectReflections() {
    var panels = document.querySelectorAll(".step-panel");
    if (!panels.length) return;
    Array.prototype.forEach.call(panels, function (panel, i) {
      if (panel.querySelector(".ntf-reflect")) return; // idempotent
      var id = panel.id || "step-" + (i + 1);
      var p = PROMPTS[i % PROMPTS.length];
      var wrap = document.createElement("div");
      wrap.className = "ntf-reflect no-print";
      wrap.innerHTML =
        '<div class="ntf-reflect__head">🧠 ' +
        '<span class="ntf-en-only">Explain it back</span>' +
        '<span class="ntf-es-only">Explícalo con tus palabras</span>' +
        "</div>" +
        '<div class="ntf-reflect__prompt">' +
        '<span class="ntf-en-only">' +
        esc(p.en) +
        "</span>" +
        '<span class="ntf-es-only">' +
        esc(p.es) +
        "</span></div>" +
        '<textarea aria-label="Explain it back"></textarea>' +
        '<div class="ntf-reflect__status" aria-live="polite"></div>';
      var ta = wrap.querySelector("textarea");
      var status = wrap.querySelector(".ntf-reflect__status");
      ta.value = state.reflections[id] || "";
      var onInput = debounce(function () {
        state.reflections[id] = ta.value;
        state.lastSeen = Date.now();
        save(state);
        status.textContent = ta.value.trim().length > 0 ? "✓ Saved" : "";
        status.classList.toggle("saved", ta.value.trim().length > 0);
        refreshTeacher();
      }, 500);
      ta.addEventListener("input", onInput);
      panel.appendChild(wrap);
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function isSpanish() {
    return !!document.querySelector("#body.es");
  }

  function languageHtml(en, es) {
    return (
      '<span class="ntf-en-only">' +
      esc(en) +
      '</span><span class="ntf-es-only">' +
      esc(es) +
      "</span>"
    );
  }

  function languageText(en, es) {
    return isSpanish() ? es : en;
  }

  function counted(count, enSingle, enPlural, esSingle, esPlural) {
    return (
      count +
      " " +
      languageHtml(count === 1 ? enSingle : enPlural, count === 1 ? esSingle : esPlural)
    );
  }

  // ---- Feature 2: portfolio summary export ----------------------------------
  function collectWork() {
    var out = [];
    var fields = document.querySelectorAll("input[type=text], input[type=number], textarea");
    Array.prototype.forEach.call(fields, function (el) {
      if (el.closest(".ntf-reflect")) return; // reflections handled separately
      var val = (el.value || "").trim();
      if (!val) return;
      var label = labelFor(el) || el.getAttribute("placeholder") || el.id || "Response";
      out.push({ label: label.trim(), value: val });
    });
    return out;
  }

  function labelFor(el) {
    if (el.id) {
      var lab = document.querySelector('label[for="' + el.id + '"]');
      if (lab) return lab.textContent;
    }
    var wrapLab = el.closest("label");
    if (wrapLab) return wrapLab.textContent.replace(el.value || "", "");
    return "";
  }

  function reflectionsList() {
    var panels = document.querySelectorAll(".step-panel");
    var list = [];
    Array.prototype.forEach.call(panels, function (panel, i) {
      var id = panel.id || "step-" + (i + 1);
      var txt = (state.reflections[id] || "").trim();
      if (txt) list.push({ step: i + 1, text: txt });
    });
    return list;
  }

  function totalMinutes() {
    return Math.round(
      Object.keys(state.stepMs).reduce(function (total, key) {
        return total + state.stepMs[key];
      }, 0) / 60000,
    );
  }

  function evidenceSnapshot() {
    var work = collectWork();
    var reflections = reflectionsList();
    var panels = document.querySelectorAll(".step-panel").length;
    var ratings = document.querySelectorAll(".pub-sa-btn[aria-pressed='true']").length;
    var checks = document.querySelectorAll(".checklist input[type='checkbox']:checked").length;
    var substantive = work.filter(function (item) {
      return item.value.length >= 3;
    }).length;
    var ready = substantive >= 3 && reflections.length >= 1 && ratings >= 1;
    return {
      work: work,
      reflections: reflections,
      panels: panels,
      ratings: ratings,
      checks: checks,
      substantive: substantive,
      ready: ready,
    };
  }

  function buildReadinessPanel() {
    if (document.querySelector(".ntf-readiness")) return;
    var panels = document.querySelectorAll(".step-panel");
    var host = panels[panels.length - 1];
    if (!host) return;

    var panel = document.createElement("aside");
    panel.className = "ntf-readiness no-print";
    panel.setAttribute("aria-label", "Submission readiness check");
    panel.innerHTML =
      '<div class="ntf-readiness__head"><span aria-hidden="true">✓</span><div>' +
      "<h3>" +
      languageHtml("Build Your Submission Portfolio", "Prepara tu portafolio de entrega") +
      "</h3>" +
      "<p>" +
      languageHtml(
        "Before you turn it in, make your math, reasoning, and self-check visible.",
        "Antes de entregarlo, muestra tus matemáticas, razonamiento y autoevaluación.",
      ) +
      "</p>" +
      "</div></div>" +
      '<ul class="ntf-readiness__list" aria-live="polite"></ul>' +
      '<button type="button" class="ntf-readiness__open">' +
      languageHtml("Preview my portfolio", "Vista previa de mi portafolio") +
      "</button>";
    host.appendChild(panel);
    panel.querySelector(".ntf-readiness__open").addEventListener("click", openPortfolio);
    refreshReadiness();
  }

  function refreshReadiness() {
    var list = document.querySelector(".ntf-readiness__list");
    if (!list) return;
    var evidence = evidenceSnapshot();
    var items = [
      [
        evidence.substantive >= 3,
        "work",
        languageHtml("Math evidence", "Evidencia matemática"),
        counted(
          evidence.substantive,
          "completed response",
          "completed responses",
          "respuesta completada",
          "respuestas completadas",
        ),
      ],
      [
        evidence.reflections.length >= 1,
        "reflection",
        languageHtml("Reasoning", "Razonamiento"),
        counted(
          evidence.reflections.length,
          "explain-it-back reflection",
          "explain-it-back reflections",
          "reflexión de explicación",
          "reflexiones de explicación",
        ),
      ],
      [
        evidence.ratings >= 1,
        "rubric",
        languageHtml("Quality check", "Control de calidad"),
        counted(
          evidence.ratings,
          "rubric rating",
          "rubric ratings",
          "calificación de la rúbrica",
          "calificaciones de la rúbrica",
        ),
      ],
    ];
    list.innerHTML = items
      .map(function (item) {
        var action = item[0]
          ? ""
          : '<button type="button" class="ntf-readiness__jump" data-ntf-focus="' +
            item[1] +
            '">' +
            languageHtml("Take me there", "Llévame allí") +
            "</button>";
        return (
          '<li class="' +
          (item[0] ? "is-ready" : "needs-work") +
          '"><span aria-hidden="true">' +
          (item[0] ? "✓" : "→") +
          "</span><strong>" +
          item[2] +
          ":</strong> " +
          item[3] +
          action +
          "</li>"
        );
      })
      .join("");
  }

  function fieldNeedsWork(field) {
    return (field.value || "").trim().length < 3;
  }

  function takeToField(kind) {
    var target = null;
    if (kind === "work") {
      var fields = document.querySelectorAll("input[type=text], input[type=number], textarea");
      target = Array.prototype.find.call(fields, function (field) {
        return !field.closest(".ntf-reflect, .pub-selfassess") && fieldNeedsWork(field);
      });
    } else if (kind === "reflection") {
      var reflections = document.querySelectorAll(".ntf-reflect textarea");
      target = Array.prototype.find.call(reflections, function (field) {
        return !(field.value || "").trim();
      });
    } else if (kind === "rubric") {
      target = document.querySelector(".pub-selfassess");
    }
    if (!target) return;
    var step = target.closest(".step-panel");
    if (step && typeof window.goStep === "function") {
      var steps = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
      window.goStep(steps.indexOf(step) + 1);
    }
    window.setTimeout(function () {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function") target.focus({ preventScroll: true });
    }, 80);
  }

  function exportSummary() {
    var title = (document.title || "Unit Project").replace(/\s*—.*$/, "");
    var evidence = evidenceSnapshot();
    var work = evidence.work;
    var refl = evidence.reflections;
    var mins = totalMinutes();
    var html =
      "<!doctype html><html><head><meta charset='utf-8'><title>" +
      esc(title) +
      " — " +
      esc(languageText("My Portfolio", "Mi portafolio")) +
      "</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#222}h1{color:#4a3fb0}h2{margin-top:26px;border-bottom:2px solid #eee;padding-bottom:4px}li{margin:6px 0}.meta{color:#666;font-size:13px}</style></head><body>";
    html += "<h1>" + esc(title) + "</h1>";
    html +=
      "<p class='meta'>" +
      esc(languageText("Student submission portfolio", "Portafolio de entrega del estudiante")) +
      " • " +
      esc(languageText("time on task ≈", "tiempo de trabajo ≈")) +
      " " +
      mins +
      " " +
      esc(languageText("min", "min")) +
      " • " +
      esc(languageText("steps reached", "pasos alcanzados")) +
      " " +
      state.maxStep +
      "</p>";
    html +=
      "<section><h2>" + esc(languageText("Evidence Check", "Revisión de evidencia")) + "</h2><ul>";
    html +=
      "<li><strong>" +
      esc(languageText("Math evidence", "Evidencia matemática")) +
      ":</strong> " +
      evidence.substantive +
      " " +
      esc(languageText("completed response", "respuesta completada")) +
      "</li>";
    html +=
      "<li><strong>" +
      esc(languageText("Reasoning", "Razonamiento")) +
      ":</strong> " +
      refl.length +
      " " +
      esc(languageText("reflection", "reflexión")) +
      "</li>";
    html +=
      "<li><strong>" +
      esc(languageText("Rubric self-check", "Autoevaluación de la rúbrica")) +
      ":</strong> " +
      evidence.ratings +
      " " +
      esc(languageText("rating", "calificación")) +
      "</li>";
    html += "</ul></section>";
    if (work.length) {
      html += "<h2>" + esc(languageText("My Work", "Mi trabajo")) + "</h2><ul>";
      work.forEach(function (w) {
        html += "<li><strong>" + esc(w.label) + ":</strong> " + esc(w.value) + "</li>";
      });
      html += "</ul>";
    }
    if (refl.length) {
      html +=
        "<h2>" +
        esc(
          languageText(
            "My Reasoning (Explain it back)",
            "Mi razonamiento (Explícalo con tus palabras)",
          ),
        ) +
        "</h2><ul>";
      refl.forEach(function (r) {
        html +=
          "<li><strong>" +
          esc(languageText("Step", "Paso")) +
          " " +
          r.step +
          ":</strong> " +
          esc(r.text) +
          "</li>";
      });
      html += "</ul>";
    }
    if (!work.length && !refl.length) {
      html +=
        "<p>" +
        esc(
          languageText(
            "Fill in your project steps and reflections, then export again.",
            "Completa los pasos y las reflexiones del proyecto, y vuelve a exportar.",
          ),
        ) +
        "</p>";
    }
    html += "</body></html>";

    var w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      // Popup blocked — fall back to a download.
      var blob = new Blob([html], { type: "text/html" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-project-summary.html";
      a.click();
    }
  }

  function openPortfolio() {
    var dialog = document.querySelector(".ntf-portfolio");
    if (!dialog) return;
    var evidence = evidenceSnapshot();
    var status = evidence.ready
      ? languageHtml(
          "Your core evidence is ready to review.",
          "Tu evidencia principal está lista para revisar.",
        )
      : languageHtml(
          "Keep building: add at least three responses, one reflection, and one rubric rating.",
          "Sigue trabajando: agrega al menos tres respuestas, una reflexión y una calificación de la rúbrica.",
        );
    dialog.querySelector(".ntf-portfolio__status").innerHTML = status;
    dialog.querySelector(".ntf-portfolio__evidence").innerHTML =
      "<li><strong>" +
      languageHtml("Math evidence", "Evidencia matemática") +
      "</strong><span>" +
      counted(evidence.substantive, "response", "responses", "respuesta", "respuestas") +
      "</span></li>" +
      "<li><strong>" +
      languageHtml("Reasoning", "Razonamiento") +
      "</strong><span>" +
      counted(
        evidence.reflections.length,
        "reflection",
        "reflections",
        "reflexión",
        "reflexiones",
      ) +
      "</span></li>" +
      "<li><strong>" +
      languageHtml("Quality check", "Control de calidad") +
      "</strong><span>" +
      counted(
        evidence.ratings,
        "rubric rating",
        "rubric ratings",
        "calificación de la rúbrica",
        "calificaciones de la rúbrica",
      ) +
      "</span></li>" +
      "<li><strong>" +
      languageHtml("Project checklist", "Lista de verificación del proyecto") +
      "</strong><span>" +
      counted(
        evidence.checks,
        "item checked",
        "items checked",
        "elemento marcado",
        "elementos marcados",
      ) +
      "</span></li>";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }

  function injectPortfolioDialog() {
    if (document.querySelector(".ntf-portfolio")) return;
    var dialog = document.createElement("dialog");
    dialog.className = "ntf-portfolio";
    dialog.setAttribute("aria-labelledby", "ntf-portfolio-title");
    dialog.innerHTML =
      '<form method="dialog" class="ntf-portfolio__card">' +
      '<button class="ntf-portfolio__close" aria-label="Close portfolio preview">×</button>' +
      '<p class="ntf-portfolio__eyebrow">' +
      languageHtml("Submission review", "Revisión de entrega") +
      "</p>" +
      '<h2 id="ntf-portfolio-title">' +
      languageHtml("My Project Portfolio", "Mi portafolio del proyecto") +
      "</h2>" +
      '<p class="ntf-portfolio__status" role="status"></p>' +
      '<ul class="ntf-portfolio__evidence"></ul>' +
      '<div class="ntf-portfolio__actions"><button type="button" class="ntf-portfolio__export">' +
      languageHtml("Open printable portfolio", "Abrir portafolio imprimible") +
      '</button><button type="submit" class="ntf-portfolio__cancel">' +
      languageHtml("Keep working", "Seguir trabajando") +
      "</button></div>" +
      "</form>";
    dialog.querySelector(".ntf-portfolio__export").addEventListener("click", exportSummary);
    document.body.appendChild(dialog);
  }

  function injectFab() {
    if (document.querySelector(".ntf-fab")) return;
    var btn = document.createElement("button");
    btn.className = "ntf-fab no-print";
    btn.type = "button";
    btn.innerHTML =
      "📁 <span class='ntf-en-only'>My Portfolio</span><span class='ntf-es-only'>Mi Portafolio</span>";
    btn.addEventListener("click", openPortfolio);
    document.body.appendChild(btn);
  }

  // ---- Feature 3: teacher-only learning-visible panel -----------------------
  var teacherEl = null;
  function refreshTeacher() {
    if (!teacherEl) return;
    var totalMs = Object.keys(state.stepMs).reduce(function (a, k) {
      return a + state.stepMs[k];
    }, 0);
    var reflCount = Object.keys(state.reflections).filter(function (k) {
      return (state.reflections[k] || "").trim().length > 0;
    }).length;
    var lvl = Object.keys(state.levelUses)
      .map(function (k) {
        return k + "×" + state.levelUses[k];
      })
      .join(" ");
    teacherEl.querySelector(".ntf-teacher__body").innerHTML =
      "<dl>" +
      row("Time on task", Math.round(totalMs / 60000) + " min") +
      row("Steps reached", state.maxStep) +
      row("Reflections", reflCount) +
      row("Hints used", state.hints) +
      row("Levels", lvl || "L1") +
      "</dl>";
  }
  function row(k, v) {
    return "<dt>" + esc(k) + "</dt><dd>" + esc(String(v)) + "</dd>";
  }
  function injectTeacher() {
    if (!isTeacher() || document.querySelector(".ntf-teacher")) return;
    teacherEl = document.createElement("div");
    teacherEl.className = "ntf-teacher no-print";
    teacherEl.innerHTML =
      '<div class="ntf-teacher__head">📊 Learning snapshot' +
      '<button class="ntf-teacher__close" aria-label="Close">×</button></div>' +
      '<div class="ntf-teacher__body"></div>';
    teacherEl.querySelector(".ntf-teacher__close").addEventListener("click", function () {
      teacherEl.remove();
      teacherEl = null;
    });
    document.body.appendChild(teacherEl);
    refreshTeacher();
  }

  // ---- Boot -----------------------------------------------------------------
  function boot() {
    try {
      hookNavigation();
      hookHints();
      injectReflections();
      injectPortfolioDialog();
      buildReadinessPanel();
      injectFab();
      injectTeacher();
      document.addEventListener("input", refreshReadiness, true);
      document.addEventListener("change", refreshReadiness, true);
      document.addEventListener("click", function (event) {
        var button = event.target.closest("[data-ntf-focus]");
        if (button) takeToField(button.getAttribute("data-ntf-focus"));
      });
      save(state);
    } catch (e) {
      if (window.console) console.warn("[projects-future] disabled:", e);
    }
  }

  // Persist final step time when leaving.
  window.addEventListener("pagehide", function () {
    try {
      commitStepTime();
      save(state);
    } catch (_e) {}
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.NTFuture = { state: state, export: exportSummary, portfolio: openPortfolio };
})();
