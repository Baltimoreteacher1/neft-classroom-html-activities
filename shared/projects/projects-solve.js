/* ==========================================================================
   Projects SOLVE-ALONG — publisher-grade guided worked examples for the unit
   culminating-project wizard pages. Fifth additive layer, after PRO/GOLD,
   PUBLISHER pedagogy, and VISUALS. Same contract as its siblings:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive and defensive: every feature is try/caught, every DOM
       lookup guarded; a missing element or config is a no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Never touches the page's own globals, inputs, or answer state.

   Pedagogy: each project's core computational step gets a "Solve-Along" —
   an animated, tap-to-reveal worked example of the SAME math the student is
   about to do, using PARALLEL numbers (never the student's project answer),
   followed by a self-checking "Your Turn" with tiered formative feedback.
   Mirrors the Guided Example → Check Your Understanding pattern in Reveal /
   enVision. Content is data-driven from the page's ./solve-along.json:

     { "version": 1,
       "solves": [ {
         "step": "step-2",
         "title":  { "en": "…", "es": "…" },
         "prompt": { "en": "…", "es": "…" },
         "steps":  [ { "do": {en,es}, "math": "9.00 ÷ 3 = 3.00", "why": {en,es} } ],
         "answer": { "en": "…", "es": "…" },
         "yourTurn": {
           "ask": {en,es}, "unit": {en,es},
           "answer": 2.5, "tolerance": 0.01,
           "hint": {en,es},
           "solution": [ { "do": {en,es}, "math": "…", "why": {en,es} } ]
         }
       } ] }

   Injected by tools/inject-projects-solve.mjs (sentinel: projects-solve).
   ========================================================================== */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var COPY = {
    badge: { en: "Worked example", es: "Ejemplo resuelto" },
    kicker: { en: "Solve-Along", es: "Resuélvelo conmigo" },
    reveal: { en: "Reveal next step ▸", es: "Mostrar siguiente paso ▸" },
    showAll: { en: "Show all steps", es: "Mostrar todos los pasos" },
    predict: {
      en: "Predict the next move in your head, then reveal it.",
      es: "Predice el siguiente paso en tu mente y luego muéstralo.",
    },
    ytKicker: {
      en: "Your Turn — check your understanding",
      es: "Tu turno — comprueba tu comprensión",
    },
    ytPlaceholder: { en: "your answer", es: "tu respuesta" },
    check: { en: "Check", es: "Comprobar" },
    showHow: { en: "Show me how", es: "Muéstrame cómo" },
    tryAgain: { en: "Try again", es: "Intenta otra vez" },
    enterNumber: {
      en: "Type a number, then press Check.",
      es: "Escribe un número y presiona Comprobar.",
    },
    correct: {
      en: "✓ Correct! Now use the same steps on your project.",
      es: "✓ ¡Correcto! Ahora usa los mismos pasos en tu proyecto.",
    },
    close: {
      en: "So close — you are almost there. Recheck your last step.",
      es: "Muy cerca — casi lo logras. Revisa tu último paso.",
    },
    notYet: {
      en: "Not yet — walk through the worked steps again, then retry.",
      es: "Todavía no — repasa los pasos resueltos y vuelve a intentar.",
    },
    answerWas: { en: "Answer:", es: "Respuesta:" },
    note: {
      en: "This is a practice example, not your project answer.",
      es: "Este es un ejemplo de práctica, no la respuesta de tu proyecto.",
    },
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  /* Bilingual node: two spans the page's own lang toggle shows/hides. */
  function bi(tag, className, en, es) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    var s1 = document.createElement("span");
    s1.className = "en-text";
    s1.textContent = en == null ? "" : String(en);
    var s2 = document.createElement("span");
    s2.className = "es-text";
    s2.textContent = es == null ? "" : String(es);
    el.appendChild(s1);
    el.appendChild(s2);
    return el;
  }

  function pick(obj, key) {
    return obj && typeof obj[key] === "string" ? obj[key] : "";
  }

  function stateKey(step) {
    return "nt-solve-along:" + location.pathname + ":" + step;
  }
  function readState(step) {
    try {
      return JSON.parse(localStorage.getItem(stateKey(step)) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveState(step, data) {
    try {
      localStorage.setItem(stateKey(step), JSON.stringify(data));
    } catch (e) {
      /* private mode / full storage — feature still works, just no memory */
    }
  }

  /* A single worked step: instruction · equation · reasoning. */
  function stepItem(spec, ordinal) {
    var li = document.createElement("li");
    li.className = "sa-step";
    var num = document.createElement("span");
    num.className = "sa-step-num";
    num.textContent = ordinal;
    num.setAttribute("aria-hidden", "true");
    li.appendChild(num);
    var body = document.createElement("div");
    body.className = "sa-step-body";
    if (spec.do) body.appendChild(bi("p", "sa-do", pick(spec.do, "en"), pick(spec.do, "es")));
    if (spec.math) {
      var math = document.createElement("p");
      math.className = "sa-math";
      math.textContent = String(spec.math);
      body.appendChild(math);
    }
    if (spec.why) body.appendChild(bi("p", "sa-why", pick(spec.why, "en"), pick(spec.why, "es")));
    li.appendChild(body);
    return li;
  }

  function parseNumber(raw) {
    if (raw == null) return NaN;
    var cleaned = String(raw)
      .replace(/[$,\s]/g, "")
      .replace(/[^0-9.\-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
    return Number(cleaned);
  }

  function buildYourTurn(yt, step, saved) {
    var wrap = document.createElement("div");
    wrap.className = "sa-yt";

    wrap.appendChild(bi("p", "sa-yt-kicker", COPY.ytKicker.en, COPY.ytKicker.es));
    if (yt.ask) wrap.appendChild(bi("p", "sa-yt-ask", pick(yt.ask, "en"), pick(yt.ask, "es")));

    var row = document.createElement("div");
    row.className = "sa-yt-row";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "sa-yt-input";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer");
    var enPh = COPY.ytPlaceholder.en;
    if (yt.unit && pick(yt.unit, "en")) enPh += " (" + pick(yt.unit, "en") + ")";
    input.placeholder = enPh;
    row.appendChild(input);

    var checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "sa-btn sa-btn-check";
    checkBtn.appendChild(bi("span", null, COPY.check.en, COPY.check.es));
    row.appendChild(checkBtn);

    var howBtn = document.createElement("button");
    howBtn.type = "button";
    howBtn.className = "sa-btn sa-btn-ghost sa-btn-how";
    howBtn.appendChild(bi("span", null, COPY.showHow.en, COPY.showHow.es));
    row.appendChild(howBtn);
    wrap.appendChild(row);

    var feedback = document.createElement("p");
    feedback.className = "sa-yt-feedback";
    feedback.setAttribute("aria-live", "polite");
    wrap.appendChild(feedback);

    var solution = document.createElement("ol");
    solution.className = "sa-solution";
    solution.hidden = true;
    (Array.isArray(yt.solution) ? yt.solution : []).forEach(function (s, i) {
      solution.appendChild(stepItem(s, i + 1));
    });
    wrap.appendChild(solution);

    var target = Number(yt.answer);
    var tol = Number(yt.tolerance);
    if (!Number.isFinite(tol) || tol < 0) tol = Math.max(0.01, Math.abs(target) * 0.001);
    var attempts = saved.ytAttempts || 0;

    function revealSolution() {
      if (!solution.children.length) return;
      solution.hidden = false;
    }

    function persist(extra) {
      var data = readState(step);
      data.ytAttempts = attempts;
      if (extra)
        Object.keys(extra).forEach(function (k) {
          data[k] = extra[k];
        });
      saveState(step, data);
    }

    function evaluate() {
      var val = parseNumber(input.value);
      if (!Number.isFinite(val)) {
        feedback.className = "sa-yt-feedback";
        feedback.textContent = "";
        feedback.appendChild(bi("span", null, COPY.enterNumber.en, COPY.enterNumber.es));
        return;
      }
      attempts += 1;
      var diff = Math.abs(val - target);
      feedback.textContent = "";
      if (diff <= tol || (target !== 0 && diff / Math.abs(target) <= 0.001)) {
        feedback.className = "sa-yt-feedback is-correct";
        feedback.appendChild(bi("span", null, COPY.correct.en, COPY.correct.es));
        checkBtn.disabled = true;
        input.readOnly = true;
        input.classList.add("is-correct");
        persist({ ytSolved: true });
      } else if (diff / (Math.abs(target) || 1) <= 0.12 || diff <= tol * 5) {
        feedback.className = "sa-yt-feedback is-close";
        feedback.appendChild(bi("span", null, COPY.close.en, COPY.close.es));
        if (attempts >= 2) revealSolution();
        persist();
      } else {
        feedback.className = "sa-yt-feedback is-wrong";
        feedback.appendChild(bi("span", null, COPY.notYet.en, COPY.notYet.es));
        if (attempts >= 2) revealSolution();
        persist();
      }
    }

    checkBtn.addEventListener("click", evaluate);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        evaluate();
      }
    });
    howBtn.addEventListener("click", function () {
      revealSolution();
      feedback.className = "sa-yt-feedback";
      feedback.textContent = "";
      var line = COPY.answerWas.en + " " + (Number.isFinite(target) ? target : "");
      var lineEs = COPY.answerWas.es + " " + (Number.isFinite(target) ? target : "");
      feedback.appendChild(bi("span", null, line, lineEs));
      persist();
    });

    if (saved.ytSolved) {
      feedback.className = "sa-yt-feedback is-correct";
      feedback.appendChild(bi("span", null, COPY.correct.en, COPY.correct.es));
    }
    return wrap;
  }

  function mountSolve(spec) {
    if (!spec || typeof spec.step !== "string") return false;
    var panel = document.getElementById(spec.step);
    if (!panel || !panel.classList.contains("step-panel")) return false;
    if (panel.querySelector(".sa-card")) return false;
    if (!Array.isArray(spec.steps) || !spec.steps.length) return false;

    var saved = readState(spec.step);

    var card = document.createElement("section");
    card.className = "sa-card no-print";
    card.setAttribute("aria-label", "Guided worked example");

    var head = document.createElement("div");
    head.className = "sa-head";
    var icon = document.createElement("span");
    icon.className = "sa-icon";
    icon.textContent = "🎓";
    icon.setAttribute("aria-hidden", "true");
    head.appendChild(icon);
    var titles = document.createElement("div");
    titles.className = "sa-titles";
    titles.appendChild(bi("span", "sa-kicker", COPY.kicker.en, COPY.kicker.es));
    titles.appendChild(bi("h3", "sa-title", pick(spec.title, "en"), pick(spec.title, "es")));
    head.appendChild(titles);
    head.appendChild(bi("span", "sa-badge", COPY.badge.en, COPY.badge.es));
    card.appendChild(head);

    if (spec.prompt)
      card.appendChild(bi("p", "sa-prompt", pick(spec.prompt, "en"), pick(spec.prompt, "es")));

    var list = document.createElement("ol");
    list.className = "sa-steps";
    card.appendChild(list);

    var items = spec.steps.map(function (s, i) {
      return stepItem(s, i + 1);
    });
    items.forEach(function (li) {
      li.hidden = true;
      list.appendChild(li);
    });

    var live = document.createElement("div");
    live.className = "sa-sr";
    live.setAttribute("aria-live", "polite");
    card.appendChild(live);

    var answerEl = spec.answer
      ? bi("p", "sa-answer", pick(spec.answer, "en"), pick(spec.answer, "es"))
      : null;
    if (answerEl) {
      answerEl.hidden = true;
      card.appendChild(answerEl);
    }

    var yt =
      spec.yourTurn && typeof spec.yourTurn === "object"
        ? buildYourTurn(spec.yourTurn, spec.step, saved)
        : null;
    if (yt) {
      yt.hidden = true;
      card.appendChild(yt);
    }

    var controls = document.createElement("div");
    controls.className = "sa-controls";
    var revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.className = "sa-btn sa-btn-reveal";
    revealBtn.appendChild(bi("span", null, COPY.reveal.en, COPY.reveal.es));
    controls.appendChild(revealBtn);
    var allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "sa-btn sa-btn-ghost";
    allBtn.appendChild(bi("span", null, COPY.showAll.en, COPY.showAll.es));
    controls.appendChild(allBtn);
    card.appendChild(controls);

    card.appendChild(bi("p", "sa-note", COPY.note.en, COPY.note.es));

    var shown = 0;
    function finish() {
      revealBtn.style.display = "none";
      allBtn.style.display = "none";
      if (answerEl) answerEl.hidden = false;
      if (yt) yt.hidden = false;
    }
    function revealNext() {
      if (shown >= items.length) return;
      items[shown].hidden = false;
      items[shown].classList.add("is-revealing");
      live.textContent = "Step " + (shown + 1) + " of " + items.length;
      shown += 1;
      var data = readState(spec.step);
      data.shown = shown;
      saveState(spec.step, data);
      if (shown >= items.length) finish();
    }
    function revealAll() {
      while (shown < items.length) revealNext();
    }
    revealBtn.addEventListener("click", revealNext);
    allBtn.addEventListener("click", revealAll);

    /* Insert above the step's nav-button row so "Next Step" stays last. */
    var navRow = null;
    var kids = panel.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (kids[i].querySelector && kids[i].querySelector(".nav-btn")) {
        navRow = kids[i];
        break;
      }
    }
    if (navRow) panel.insertBefore(card, navRow);
    else panel.appendChild(card);

    /* Restore prior reveal progress. */
    var restore = Math.max(0, Math.min(items.length, saved.shown || 0));
    for (var r = 0; r < restore; r++) revealNext();
    return true;
  }

  ready(function () {
    try {
      var body = document.body;
      if (!body || !body.classList.contains("pro-projects")) return;
      if (body.dataset.solveInit === "1") return;
      body.dataset.solveInit = "1";
      if (typeof fetch !== "function") return;

      fetch("./solve-along.json", { cache: "no-cache" })
        .then(function (res) {
          return res && res.ok ? res.json() : null;
        })
        .then(function (cfg) {
          if (!cfg || !Array.isArray(cfg.solves)) return;
          cfg.solves.forEach(function (spec) {
            try {
              mountSolve(spec);
            } catch (e) {
              /* one bad solve never blocks the rest */
            }
          });
        })
        .catch(function () {
          /* no solve-along.json for this page — fine */
        });
    } catch (e) {
      /* never break the page */
    }
  });
})();
