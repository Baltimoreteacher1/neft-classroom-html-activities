/* projects-future.js — additive "future layer" for unit culminating projects.
 *
 * Safe, client-side, no secrets, no backend. Loaded with `defer` AFTER the
 * page's inline scripts, so the page globals (goStep, setLevel, STEPS) already
 * exist. Everything is wrapped defensively: a failure here must NEVER break the
 * project's existing navigation, levels, language toggle, or read-aloud.
 *
 * Adds three research-backed features:
 *   1. Per-step "Explain it back" metacognition prompt (retrieval + self-explain).
 *   2. Portfolio summary export (student-as-author, printable artifact).
 *   3. Teacher-only "learning-visible" telemetry (time-on-task, steps, reflections).
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
    } catch (e) {
      return {};
    }
  }
  function save(state) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
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
    } catch (e) {
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
      } catch (e) {
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
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- Feature 2: portfolio summary export ----------------------------------
  function collectWork() {
    var out = [];
    var fields = document.querySelectorAll(
      "input[type=text], input[type=number], textarea",
    );
    Array.prototype.forEach.call(fields, function (el) {
      if (el.closest(".ntf-reflect")) return; // reflections handled separately
      var val = (el.value || "").trim();
      if (!val) return;
      var label =
        labelFor(el) || el.getAttribute("placeholder") || el.id || "Response";
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

  function exportSummary() {
    var title = (document.title || "Unit Project").replace(/\s*—.*$/, "");
    var work = collectWork();
    var refl = reflectionsList();
    var mins = Math.round(
      Object.keys(state.stepMs).reduce(function (a, k) {
        return a + state.stepMs[k];
      }, 0) / 60000,
    );
    var html =
      "<!doctype html><html><head><meta charset='utf-8'><title>" +
      esc(title) +
      " — My Summary</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#222}h1{color:#4a3fb0}h2{margin-top:26px;border-bottom:2px solid #eee;padding-bottom:4px}li{margin:6px 0}.meta{color:#666;font-size:13px}</style></head><body>";
    html += "<h1>" + esc(title) + "</h1>";
    html +=
      "<p class='meta'>My project summary • time on task ≈ " +
      mins +
      " min • steps reached " +
      state.maxStep +
      "</p>";
    if (work.length) {
      html += "<h2>My Work</h2><ul>";
      work.forEach(function (w) {
        html +=
          "<li><strong>" +
          esc(w.label) +
          ":</strong> " +
          esc(w.value) +
          "</li>";
      });
      html += "</ul>";
    }
    if (refl.length) {
      html += "<h2>My Reasoning (Explain it back)</h2><ul>";
      refl.forEach(function (r) {
        html +=
          "<li><strong>Step " + r.step + ":</strong> " + esc(r.text) + "</li>";
      });
      html += "</ul>";
    }
    if (!work.length && !refl.length) {
      html +=
        "<p>Fill in your project steps and reflections, then export again.</p>";
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

  function injectFab() {
    if (document.querySelector(".ntf-fab")) return;
    var btn = document.createElement("button");
    btn.className = "ntf-fab no-print";
    btn.type = "button";
    btn.innerHTML =
      "📤 <span class='ntf-en-only'>My Summary</span><span class='ntf-es-only'>Mi Resumen</span>";
    btn.addEventListener("click", exportSummary);
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
    teacherEl
      .querySelector(".ntf-teacher__close")
      .addEventListener("click", function () {
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
      injectFab();
      injectTeacher();
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
    } catch (e) {}
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.NTFuture = { state: state, export: exportSummary };
})();
