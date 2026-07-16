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
    next: { en: "Next practice ▸", es: "Siguiente práctica ▸" },
    mastered: { en: "Mastered", es: "Dominadas" },
    of: { en: "of", es: "de" },
    allDone: {
      en: "🏆 You mastered every practice problem — take these steps to your project!",
      es: "🏆 ¡Dominaste todos los problemas de práctica — lleva estos pasos a tu proyecto!",
    },
    /* Error-analysis (Spot the Mistake) */
    eaKicker: { en: "Spot the Mistake", es: "Encuentra el error" },
    eaBadge: { en: "Error analysis", es: "Análisis de errores" },
    eaInstruct: {
      en: "Someone solved this — but one step has a mistake. Tap the step where it goes wrong.",
      es: "Alguien resolvió esto, pero un paso tiene un error. Toca el paso donde algo sale mal.",
    },
    eaRight: { en: "✓ Yes — that step has the error.", es: "✓ Sí — ese paso tiene el error." },
    eaWrong: {
      en: "That step is actually correct. Look at the others.",
      es: "Ese paso es correcto. Mira los demás.",
    },
    eaShow: { en: "Show the mistake", es: "Mostrar el error" },
    eaFix: { en: "The fix", es: "La corrección" },
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

  /* ----------------------------------------------------------------------
     Signal Board — a lightweight, DEVICE-LOCAL misconception log for teachers.

     As a student works, each formative event (a practice miss, a hint used, a
     wrong error-analysis pick, a mastered set) increments a counter grouped by
     math strand in one localStorage key. No names, no network, nothing leaves
     the device — the same privacy model as the Award/Save-Resume interactive
     layers. A teacher (with teacher mode ON) can open a summary to see which
     strands are tripping students up on this device/station, attributed to the
     save code + name when the page's Save/Resume has one.
     ---------------------------------------------------------------------- */
  var SIGNAL_KEY = "nt-solve-signals";

  function readSignals() {
    try {
      return JSON.parse(localStorage.getItem(SIGNAL_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function recordSignal(strand, type) {
    try {
      var label = typeof strand === "string" && strand.trim() ? strand.trim() : "Math";
      if (["miss", "hint", "errorMiss", "mastered"].indexOf(type) === -1) return;
      var s = readSignals();
      if (!s.strands) s.strands = {};
      var row = s.strands[label] || { miss: 0, hint: 0, errorMiss: 0, mastered: 0 };
      row[type] += 1;
      s.strands[label] = row;
      s.updated = Date.now();
      localStorage.setItem(SIGNAL_KEY, JSON.stringify(s));
    } catch (e) {
      /* signals are best-effort; never let one break a student's work */
    }
  }

  function isTeacherMode() {
    try {
      var v = (localStorage.getItem("nt-teacher-mode") || "").toLowerCase();
      return v === "1" || v === "true" || v === "on" || v === "yes";
    } catch (e) {
      return false;
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

  /* One self-checking practice problem. onSolved() fires the first time the
     student answers it correctly. Returns { node, focus }. */
  function buildOneCheck(item, onSolved, strand) {
    var box = document.createElement("div");
    box.className = "sa-item";
    if (item.ask) box.appendChild(bi("p", "sa-yt-ask", pick(item.ask, "en"), pick(item.ask, "es")));

    var row = document.createElement("div");
    row.className = "sa-yt-row";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "sa-yt-input";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer");
    var enPh = COPY.ytPlaceholder.en;
    if (item.unit && pick(item.unit, "en")) enPh += " (" + pick(item.unit, "en") + ")";
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
    box.appendChild(row);

    var feedback = document.createElement("p");
    feedback.className = "sa-yt-feedback";
    feedback.setAttribute("aria-live", "polite");
    box.appendChild(feedback);

    var solution = document.createElement("ol");
    solution.className = "sa-solution";
    solution.hidden = true;
    (Array.isArray(item.solution) ? item.solution : []).forEach(function (s, i) {
      solution.appendChild(stepItem(s, i + 1));
    });
    box.appendChild(solution);

    var target = Number(item.answer);
    var tol = Number(item.tolerance);
    if (!Number.isFinite(tol) || tol < 0) tol = Math.max(0.01, Math.abs(target) * 0.001);
    var attempts = 0;
    var done = false;

    function revealSolution() {
      if (solution.children.length) solution.hidden = false;
    }

    function evaluate() {
      if (done) return;
      var val = parseNumber(input.value);
      feedback.textContent = "";
      if (!Number.isFinite(val)) {
        feedback.className = "sa-yt-feedback";
        feedback.appendChild(bi("span", null, COPY.enterNumber.en, COPY.enterNumber.es));
        return;
      }
      attempts += 1;
      var diff = Math.abs(val - target);
      if (diff <= tol || (target !== 0 && diff / Math.abs(target) <= 0.001)) {
        done = true;
        feedback.className = "sa-yt-feedback is-correct";
        feedback.appendChild(bi("span", null, COPY.correct.en, COPY.correct.es));
        checkBtn.disabled = true;
        input.readOnly = true;
        input.classList.add("is-correct");
        if (typeof onSolved === "function") onSolved();
      } else if (diff / (Math.abs(target) || 1) <= 0.12 || diff <= tol * 5) {
        feedback.className = "sa-yt-feedback is-close";
        feedback.appendChild(bi("span", null, COPY.close.en, COPY.close.es));
        if (attempts >= 2) revealSolution();
      } else {
        feedback.className = "sa-yt-feedback is-wrong";
        feedback.appendChild(bi("span", null, COPY.notYet.en, COPY.notYet.es));
        if (attempts >= 2) revealSolution();
        recordSignal(strand, "miss");
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
      feedback.appendChild(
        bi(
          "span",
          null,
          COPY.answerWas.en + " " + (Number.isFinite(target) ? target : ""),
          COPY.answerWas.es + " " + (Number.isFinite(target) ? target : ""),
        ),
      );
      recordSignal(strand, "hint");
    });

    return {
      node: box,
      focus: function () {
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          /* focus is a nicety */
        }
      },
    };
  }

  /* Your Turn: one or more practice problems with a mastery meter. A single
     yourTurn object is treated as a one-item set (backward compatible). */
  function buildYourTurn(yt, step, saved, strand) {
    var items = Array.isArray(yt.items) && yt.items.length ? yt.items : [yt];
    var wrap = document.createElement("div");
    wrap.className = "sa-yt";
    wrap.appendChild(bi("p", "sa-yt-kicker", COPY.ytKicker.en, COPY.ytKicker.es));

    var meter = null;
    var dots = [];
    if (items.length > 1) {
      meter = document.createElement("div");
      meter.className = "sa-meter";
      var track = document.createElement("div");
      track.className = "sa-meter-track";
      for (var d = 0; d < items.length; d++) {
        var dot = document.createElement("span");
        dot.className = "sa-meter-dot";
        track.appendChild(dot);
        dots.push(dot);
      }
      meter.appendChild(track);
      var label = bi("span", "sa-meter-label", "", "");
      meter.appendChild(label);
      meter._label = label;
      wrap.appendChild(meter);
    }

    var stage = document.createElement("div");
    stage.className = "sa-stage";
    wrap.appendChild(stage);
    var footer = document.createElement("div");
    footer.className = "sa-item-nav";
    wrap.appendChild(footer);

    var solvedCount = Math.min(items.length, saved.ytSolvedCount || 0);

    function updateMeter() {
      if (!meter) return;
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-done", i < solvedCount);
      });
      meter._label.querySelector(".en-text").textContent =
        COPY.mastered.en + " " + solvedCount + " " + COPY.of.en + " " + items.length;
      meter._label.querySelector(".es-text").textContent =
        COPY.mastered.es + " " + solvedCount + " " + COPY.of.es + " " + items.length;
    }

    function persist(idx) {
      var data = readState(step);
      data.ytSolvedCount = solvedCount;
      data.ytIdx = idx;
      if (solvedCount >= items.length) data.ytSolved = true;
      saveState(step, data);
    }

    function showItem(i) {
      stage.textContent = "";
      footer.textContent = "";
      var advanced = false;
      var check = buildOneCheck(
        items[i],
        function () {
          if (advanced) return;
          advanced = true;
          solvedCount = Math.max(solvedCount, i + 1);
          updateMeter();
          if (i < items.length - 1) {
            var nextBtn = document.createElement("button");
            nextBtn.type = "button";
            nextBtn.className = "sa-btn sa-btn-next";
            nextBtn.appendChild(bi("span", null, COPY.next.en, COPY.next.es));
            nextBtn.addEventListener("click", function () {
              persist(i + 1);
              showItem(i + 1);
            });
            footer.appendChild(nextBtn);
          } else {
            footer.appendChild(bi("p", "sa-alldone", COPY.allDone.en, COPY.allDone.es));
            if (!saved._masteredLogged) {
              saved._masteredLogged = true;
              recordSignal(strand, "mastered");
            }
          }
          persist(i);
        },
        strand,
      );
      stage.appendChild(check.node);
    }

    updateMeter();
    showItem(Math.min(items.length - 1, Math.max(0, saved.ytIdx || 0)));
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
        ? buildYourTurn(spec.yourTurn, spec.step, saved, spec.strand)
        : null;
    if (yt) {
      yt.hidden = true;
      card.appendChild(yt);
    }

    var predict = bi("p", "sa-predict", COPY.predict.en, COPY.predict.es);
    card.appendChild(predict);

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
      predict.hidden = true;
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

  /* Insert a card above the step's nav-button row so "Next Step" stays last. */
  function insertAboveNav(panel, card) {
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
  }

  /* Error-analysis "Spot the Mistake": a fully-worked solution with exactly one
     flawed step. The student taps the step they think is wrong; a correct tap
     reveals why it is wrong and the fix. Builds evaluation/critique skill —
     the reasoning behind the math, not just the computation. */
  function mountErrorCheck(spec) {
    if (!spec || typeof spec.step !== "string") return false;
    var panel = document.getElementById(spec.step);
    if (!panel || !panel.classList.contains("step-panel")) return false;
    if (panel.querySelector(".ea-card")) return false;
    var work = Array.isArray(spec.work) ? spec.work : [];
    if (work.length < 2) return false;
    var flaw = Number(spec.flawIndex);
    if (!Number.isInteger(flaw) || flaw < 0 || flaw >= work.length) return false;

    var card = document.createElement("section");
    card.className = "ea-card no-print";
    card.setAttribute("aria-label", "Spot the mistake");

    var head = document.createElement("div");
    head.className = "ea-head";
    var icon = document.createElement("span");
    icon.className = "ea-icon";
    icon.textContent = "🔍";
    icon.setAttribute("aria-hidden", "true");
    head.appendChild(icon);
    var titles = document.createElement("div");
    titles.className = "ea-titles";
    titles.appendChild(bi("span", "ea-kicker", COPY.eaKicker.en, COPY.eaKicker.es));
    if (spec.title)
      titles.appendChild(bi("h3", "ea-title", pick(spec.title, "en"), pick(spec.title, "es")));
    head.appendChild(titles);
    head.appendChild(bi("span", "ea-badge", COPY.eaBadge.en, COPY.eaBadge.es));
    card.appendChild(head);

    if (spec.prompt)
      card.appendChild(bi("p", "ea-prompt", pick(spec.prompt, "en"), pick(spec.prompt, "es")));
    card.appendChild(bi("p", "ea-instruct", COPY.eaInstruct.en, COPY.eaInstruct.es));

    var list = document.createElement("ol");
    list.className = "ea-steps";
    var buttons = [];
    work.forEach(function (w, i) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ea-step";
      var num = document.createElement("span");
      num.className = "ea-step-num";
      num.textContent = i + 1;
      num.setAttribute("aria-hidden", "true");
      btn.appendChild(num);
      var body = document.createElement("div");
      body.className = "ea-step-body";
      if (w.math) {
        var math = document.createElement("span");
        math.className = "ea-math";
        math.textContent = String(w.math);
        body.appendChild(math);
      }
      if (w.note) body.appendChild(bi("span", "ea-note", pick(w.note, "en"), pick(w.note, "es")));
      btn.appendChild(body);
      li.appendChild(btn);
      list.appendChild(li);
      buttons.push(btn);
    });
    card.appendChild(list);

    var feedback = document.createElement("p");
    feedback.className = "ea-feedback";
    feedback.setAttribute("aria-live", "polite");
    card.appendChild(feedback);

    var result = document.createElement("div");
    result.className = "ea-result";
    result.hidden = true;
    if (spec.explanation)
      result.appendChild(
        bi("p", "ea-explain", pick(spec.explanation, "en"), pick(spec.explanation, "es")),
      );
    if (spec.fix && (spec.fix.math || spec.fix.why)) {
      var fixWrap = document.createElement("div");
      fixWrap.className = "ea-fix";
      fixWrap.appendChild(bi("span", "ea-fix-label", COPY.eaFix.en, COPY.eaFix.es));
      if (spec.fix.math) {
        var fm = document.createElement("p");
        fm.className = "ea-fix-math";
        fm.textContent = String(spec.fix.math);
        fixWrap.appendChild(fm);
      }
      if (spec.fix.why)
        fixWrap.appendChild(
          bi("p", "ea-fix-why", pick(spec.fix.why, "en"), pick(spec.fix.why, "es")),
        );
      result.appendChild(fixWrap);
    }
    card.appendChild(result);

    var showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.className = "sa-btn sa-btn-ghost ea-show";
    showBtn.appendChild(bi("span", null, COPY.eaShow.en, COPY.eaShow.es));
    card.appendChild(showBtn);

    var solved = false;
    function solve() {
      if (solved) return;
      solved = true;
      buttons.forEach(function (b, i) {
        b.disabled = true;
        if (i === flaw) b.classList.add("is-flaw");
      });
      feedback.className = "ea-feedback is-correct";
      feedback.textContent = "";
      feedback.appendChild(bi("span", null, COPY.eaRight.en, COPY.eaRight.es));
      result.hidden = false;
      showBtn.style.display = "none";
      var data = readState(spec.step);
      data.eaSolved = true;
      saveState(spec.step, data);
    }

    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        if (solved) return;
        if (i === flaw) {
          solve();
        } else {
          b.classList.add("is-ruledout");
          feedback.className = "ea-feedback is-wrong";
          feedback.textContent = "";
          feedback.appendChild(bi("span", null, COPY.eaWrong.en, COPY.eaWrong.es));
          recordSignal(spec.strand, "errorMiss");
        }
      });
    });
    showBtn.addEventListener("click", solve);

    insertAboveNav(panel, card);
    return true;
  }

  /* ----------------------------------------------------------------------
     Teacher Signal Board — a floating readout shown ONLY when teacher mode is
     on (localStorage nt-teacher-mode). Students never see it. It summarizes the
     device-local misconception counts recorded above, grouped by strand and
     sorted by struggle, attributed to the Save/Resume save code + name when one
     exists. Everything is device-local — nothing is sent anywhere.
     ---------------------------------------------------------------------- */
  function attribution() {
    try {
      if (window.NeftSaveResume && typeof window.NeftSaveResume.getTeacherSummary === "function") {
        var t = window.NeftSaveResume.getTeacherSummary();
        if (t) {
          var who = [];
          if (t.studentName && t.studentName !== "(unnamed)") who.push(t.studentName);
          if (t.saveCode) who.push("code " + t.saveCode);
          if (t.section) who.push(t.section);
          return who.join(" · ");
        }
      }
    } catch (e) {
      /* attribution is optional */
    }
    return "";
  }

  function signalRows() {
    var s = readSignals();
    var strands = s.strands || {};
    return Object.keys(strands)
      .map(function (name) {
        var r = strands[name];
        return {
          name: name,
          miss: r.miss || 0,
          hint: r.hint || 0,
          errorMiss: r.errorMiss || 0,
          mastered: r.mastered || 0,
          struggle: (r.miss || 0) + (r.errorMiss || 0),
        };
      })
      .sort(function (a, b) {
        return b.struggle - a.struggle;
      });
  }

  function signalReportText(rows, who) {
    var lines = ["Neft Teacher — Project Signals (this device)"];
    if (who) lines.push(who);
    lines.push("");
    if (!rows.length) {
      lines.push("No signals recorded yet.");
    } else {
      rows.forEach(function (r) {
        lines.push(
          r.name +
            " — misses " +
            r.miss +
            ", error-analysis misses " +
            r.errorMiss +
            ", hints " +
            r.hint +
            ", mastered " +
            r.mastered,
        );
      });
    }
    return lines.join("\n");
  }

  function openSignalPanel() {
    var existing = document.querySelector(".sig-overlay");
    if (existing) {
      existing.parentNode.removeChild(existing);
      return;
    }
    var rows = signalRows();
    var who = attribution();

    var overlay = document.createElement("div");
    overlay.className = "sig-overlay";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.parentNode.removeChild(overlay);
    });

    var modal = document.createElement("div");
    modal.className = "sig-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Project signals for teachers");

    var head = document.createElement("div");
    head.className = "sig-head";
    var h = document.createElement("strong");
    h.className = "sig-title";
    h.textContent = "📊 Project Signals";
    head.appendChild(h);
    var scope = document.createElement("span");
    scope.className = "sig-scope";
    scope.textContent = "this device only";
    head.appendChild(scope);
    modal.appendChild(head);

    if (who) {
      var attr = document.createElement("p");
      attr.className = "sig-attr";
      attr.textContent = who;
      modal.appendChild(attr);
    }

    if (!rows.length) {
      var empty = document.createElement("p");
      empty.className = "sig-empty";
      empty.textContent =
        "No signals recorded yet. As students work the practice sets and Spot-the-Mistake cards, misconceptions by strand will appear here.";
      modal.appendChild(empty);
    } else {
      var table = document.createElement("table");
      table.className = "sig-table";
      var thead = document.createElement("thead");
      thead.innerHTML =
        "<tr><th>Strand</th><th title='Practice misses'>Miss</th><th title='Error-analysis wrong picks'>Err</th><th title='Hints used'>Hint</th><th title='Practice sets mastered'>✓</th></tr>";
      table.appendChild(thead);
      var tbody = document.createElement("tbody");
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        if (r.struggle >= 3) tr.className = "sig-hot";
        tr.innerHTML =
          "<td>" +
          r.name.replace(/[<>&]/g, "") +
          "</td><td>" +
          r.miss +
          "</td><td>" +
          r.errorMiss +
          "</td><td>" +
          r.hint +
          "</td><td>" +
          r.mastered +
          "</td>";
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      modal.appendChild(table);
    }

    var actions = document.createElement("div");
    actions.className = "sig-actions";
    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "sa-btn sa-btn-ghost";
    copyBtn.textContent = "Copy report";
    copyBtn.addEventListener("click", function () {
      var text = signalReportText(rows, who);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
          copyBtn.textContent = "Copied ✓";
          setTimeout(function () {
            copyBtn.textContent = "Copy report";
          }, 1500);
        } else {
          window.prompt("Copy the report:", text);
        }
      } catch (e) {
        window.prompt("Copy the report:", text);
      }
    });
    actions.appendChild(copyBtn);

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "sa-btn sa-btn-ghost";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", function () {
      if (window.confirm("Clear all recorded signals on this device?")) {
        try {
          localStorage.removeItem(SIGNAL_KEY);
        } catch (e) {
          /* ignore */
        }
        overlay.parentNode.removeChild(overlay);
      }
    });
    actions.appendChild(clearBtn);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "sa-btn";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", function () {
      overlay.parentNode.removeChild(overlay);
    });
    actions.appendChild(closeBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function mountSignalBoard() {
    if (!isTeacherMode()) return;
    if (document.querySelector(".sig-fab")) return;
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "sig-fab no-print";
    fab.textContent = "📊 Signals";
    fab.title = "Project misconception signals (teacher only, this device)";
    fab.addEventListener("click", openSignalPanel);
    document.body.appendChild(fab);
  }

  ready(function () {
    try {
      var body = document.body;
      if (!body || !body.classList.contains("pro-projects")) return;
      if (body.dataset.solveInit === "1") return;
      body.dataset.solveInit = "1";
      try {
        mountSignalBoard();
      } catch (e) {
        /* the teacher board never blocks the student experience */
      }
      if (typeof fetch !== "function") return;

      fetch("./solve-along.json", { cache: "no-cache" })
        .then(function (res) {
          return res && res.ok ? res.json() : null;
        })
        .then(function (cfg) {
          if (!cfg) return;
          if (Array.isArray(cfg.solves)) {
            cfg.solves.forEach(function (spec) {
              try {
                mountSolve(spec);
              } catch (e) {
                /* one bad solve never blocks the rest */
              }
            });
          }
          if (Array.isArray(cfg.errorChecks)) {
            cfg.errorChecks.forEach(function (spec) {
              try {
                mountErrorCheck(spec);
              } catch (e) {
                /* one bad error-check never blocks the rest */
              }
            });
          }
        })
        .catch(function () {
          /* no solve-along.json for this page — fine */
        });
    } catch (e) {
      /* never break the page */
    }
  });
})();
