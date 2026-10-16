/* =============================================================================
 * Neft Game Hint Ladder — Socratic, escalating hints for math games.
 * -----------------------------------------------------------------------------
 * Reuses the deployed AI tutor endpoint (POST /api/tutor, mode:"hint") which
 * runs a Socratic system prompt that NEVER reveals the final answer. This
 * module turns that single-hint endpoint into an escalating LADDER:
 *
 *   Rung 1  — Notice: a question that points at what matters.
 *   Rung 2  — Strategy: name the method / relationship to use.
 *   Rung 3  — Set up the step: walk the setup, stop before the final answer.
 *   (then)  — "Explain the idea" (mode:"explain") for the concept.
 *
 * KEY-GATED + FAIL-SAFE. Live AI is used only when the endpoint has a backend
 * (ANTHROPIC_API_KEY or a Workers AI binding). For EVERY failure — not
 * configured (503), rate-limited (429), timeout, network/CORS error, empty
 * reply — the ladder silently falls back to authored static hints for that
 * rung, so the feature is never broken and never blocks gameplay.
 *
 * A game opts in by loading this script + game-hint-ladder.css and calling:
 *   NeftHintLadder.setProblem({
 *     itemText: "A recipe uses 2 cups flour to 3 cups sugar. ...",
 *     standard: "6.AT.3",
 *     staticHints: ["...rung1...", "...rung2...", "...rung3..."], // 1-3 strings
 *   });
 * Call setProblem() again whenever a new problem appears; the ladder resets.
 *
 * No PII is sent. No answer is ever displayed. Honors calm mode / reduced
 * motion via CSS only. Pairs with game-access.js but is independent of it.
 * ========================================================================== */
(function () {
  "use strict";

  if (window.NeftHintLadder) return; // idempotent
  var doc = document;

  var ENDPOINT = "/api/tutor";
  var FETCH_TIMEOUT_MS = 12000;
  var MAX_RUNGS = 3;

  // Escalation framing appended to the tutor request per rung. The endpoint's
  // system prompt already forbids the final answer; this only shapes altitude.
  var RUNG_FRAMING = [
    "Give the FIRST, gentlest hint: ask one short question that helps me notice what matters. Do not name the method yet.",
    "Give the NEXT hint, a little more concrete: name the strategy or relationship I should use, in 1-2 short sentences. Still do not give the answer.",
    "Give the most concrete hint: walk me through SETTING UP the next step, but STOP before the final calculation and never state the final answer.",
  ];

  // Spanish follows the site-wide language key; read at call time so a switch applies live.
  function isEs() {
    try {
      return localStorage.getItem("nt-lang") === "es";
    } catch (_e) {
      return false;
    }
  }
  function T(en, es) {
    return isEs() ? es : en;
  }
  // The tutor endpoint replies in this language when replyLang is set (empty = English).
  function replyLang() {
    return isEs() ? "Spanish" : "";
  }

  // Spanish for the authored static hints, keyed by the exact English text the games pass in.
  // Unlisted (generated) hints fall back to a general Spanish nudge in staticHint().
  var HINT_ES = {
    "Read the problem again slowly. What is it giving you, and what is it asking you to find?":
      "Lee el problema otra vez, despacio. ¿Qué datos te da y qué te pide encontrar?",
    "What one idea or rule from this lesson connects what you have to what you need?":
      "¿Qué idea o regla de esta lección conecta lo que tienes con lo que necesitas?",
    "Set it up: write the first step using that rule, then work it through — you finish the last part.":
      "Plantéalo: escribe el primer paso con esa regla y sigue resolviendo; la última parte la terminas tú.",
    "Look at the place values. Which two whole numbers does this decimal sit between?":
      "Mira los valores posicionales. ¿Entre qué dos números enteros está este decimal?",
    "Line up the decimal points, then compare digit by digit from the left (tenths, then hundredths).":
      "Alinea los puntos decimales y compara dígito por dígito desde la izquierda (primero décimas, luego centésimas).",
    "Set it up: count how many tenths/hundredths past the smaller whole number, then place your marker there.":
      "Plantéalo: cuenta cuántas décimas o centésimas hay después del entero menor y coloca ahí tu marcador.",
    "Is this number prime, or can it be split? Try dividing by 2, 3, or 5.":
      "¿Este número es primo o se puede dividir? Prueba dividiendo entre 2, 3 o 5.",
    "Pick a factor pair whose product equals the number. Keep splitting until every branch is prime.":
      "Elige un par de factores cuyo producto sea el número. Sigue dividiendo hasta que cada rama sea prima.",
    "Count how many times each prime appears — that count is its exponent.":
      "Cuenta cuántas veces aparece cada primo: esa cantidad es su exponente.",
    "What three measurements build a volume? Picture filling the solid with unit cubes.":
      "¿Qué tres medidas forman un volumen? Imagina llenar el sólido con cubos unitarios.",
    "Volume = length × width × height (for fractional edges, multiply the fractions).":
      "Volumen = largo × ancho × alto (con aristas fraccionarias, multiplica las fracciones).",
    "Set it up: write length × width × height with the numbers, then do the multiplying.":
      "Plantéalo: escribe largo × ancho × alto con los números y luego multiplica.",
    "Dividing by a fraction asks: how many of that fraction fit inside the other number?":
      "Dividir entre una fracción pregunta: ¿cuántas veces cabe esa fracción dentro del otro número?",
    "On the bar: cut every whole into the denominator's parts, shade the starting amount, then count equal groups the size of the divisor.":
      "En la barra: divide cada entero en las partes del denominador, sombrea la cantidad inicial y cuenta grupos iguales del tamaño del divisor.",
    "Use keep–change–flip: keep the first fraction, change ÷ to ×, flip the second.":
      "Usa conservar–cambiar–invertir: conserva la primera fracción, cambia ÷ por × e invierte la segunda.",
    "Set it up: rewrite it as a multiplication problem, then you do the multiplying.":
      "Plantéalo: reescríbelo como una multiplicación y luego multiplica tú.",
    "Percent means 'per 100'. What is the whole (the 100%) in this problem?":
      "Porcentaje significa «por cada 100». ¿Cuál es el total (el 100%) en este problema?",
    "Set up part/whole = percent/100, and see which piece is missing.":
      "Plantea parte/total = porcentaje/100 y mira cuál de los datos falta.",
    "Set it up: write the proportion (or find 1% first), then solve for the missing part.":
      "Plantéalo: escribe la proporción (o halla primero el 1%) y luego despeja el dato que falta.",
    "Can you break this shape into rectangles or triangles you already know how to measure?":
      "¿Puedes dividir esta figura en rectángulos o triángulos que ya sabes medir?",
    "Recall the area rules: rectangle = base × height; triangle = ½ × base × height.":
      "Recuerda las reglas del área: rectángulo = base × altura; triángulo = ½ × base × altura.",
    "Set it up: find each piece's area with the formula, then add (or subtract) — you finish the arithmetic.":
      "Plantéalo: halla el área de cada parte con la fórmula y luego suma (o resta); la aritmética la terminas tú.",
    "Compare the live readout to the target: do you need a bigger or a smaller value?":
      "Compara la lectura actual con la meta: ¿necesitas un valor mayor o menor?",
    "Order of operations: × happens before + and −, so multiply first when you check a build.":
      "Orden de las operaciones: × va antes que + y −, así que multiplica primero cuando revises tu armado.",
    "Fill every slot, read the value your build makes, then adjust one tile at a time.":
      "Llena todos los espacios, lee el valor que forma tu armado y ajusta una ficha a la vez.",
    "What is being done to the variable — is it added to, or multiplied?":
      "¿Qué se le está haciendo a la variable: se le suma algo o se multiplica?",
    "Do the inverse operation to BOTH sides to get the variable alone.":
      "Haz la operación inversa en AMBOS lados para dejar sola la variable.",
    "Set it up: apply the inverse step to both sides, then you finish the last calculation.":
      "Plantéalo: aplica el paso inverso en ambos lados y luego terminas tú el último cálculo.",
    "Is the target about the center of the data (mean/median), the spread (range), or the typical distance from the mean (MAD)?":
      "¿La meta trata del centro de los datos (media/mediana), de la dispersión (rango) o de la distancia típica a la media (DAM)?",
    "Recall the measure: mean = add then divide; median = middle of the ordered list; range = max − min; MAD = the mean of each dot's distance from the mean.":
      "Recuerda cada medida: media = sumar y dividir; mediana = el valor del medio de la lista ordenada; rango = máximo − mínimo; DAM = el promedio de la distancia de cada punto a la media.",
    "Start from the locked gold given dots: decide whether your added dots must pull the statistic up or down, then check the live readout.":
      "Empieza con los puntos dorados fijos: decide si tus puntos nuevos deben subir o bajar la estadística y luego revisa la lectura actual.",
    "Which number is the x (across) and which is the y (up/down)? Check the signs too.":
      "¿Cuál número es la x (horizontal) y cuál es la y (vertical)? Revisa también los signos.",
    "Move along the x-axis first, then up or down for y; negatives go left/down.":
      "Muévete primero por el eje x y luego sube o baja para la y; los negativos van a la izquierda o hacia abajo.",
    "Distance on a straight line: count the unit steps, or subtract and take the absolute value. Across zero, add the two distances to the axis.":
      "Distancia en una línea recta: cuenta los pasos unitarios, o resta y toma el valor absoluto. Si cruzas el cero, suma las dos distancias hasta el eje.",
    "A rectangle's missing corner shares its x with one shown corner and its y with another.":
      "La esquina que falta de un rectángulo comparte su x con una esquina que ves y su y con otra.",
    "Set it up: find the tick mark for each coordinate, then place the point yourself.":
      "Plantéalo: busca la marca de cada coordenada y luego coloca tú el punto.",
    "Look at one piece after you slice: what fraction of a whole is it? The divisor names the piece size you need.":
      "Mira una pieza después de dividir: ¿qué fracción de un entero es? El divisor indica el tamaño de pieza que necesitas.",
    "Division asks 'how many of this size fit?' Slice each whole so the divisor lines up with whole pieces, then count pieces or bundle equal groups.":
      "Dividir pregunta «¿cuántas de este tamaño caben?». Divide cada entero para que el divisor coincida con piezas enteras y luego cuenta piezas o forma grupos iguales.",
    "Set it up: slice using the divisor's denominator, shade or spot the dividend on the bar, then count how many divisor-size pieces or full groups fill it.":
      "Plantéalo: divide usando el denominador del divisor, sombrea o ubica el dividendo en la barra y cuenta cuántas piezas del tamaño del divisor o grupos completos lo llenan.",
    "Look at the jug: how many equal parts do the lines split it into? Each line marks one unit fraction of the whole jug.":
      "Mira la jarra: ¿en cuántas partes iguales la dividen las líneas? Cada línea marca una fracción unitaria de toda la jarra.",
    "If the order's fraction uses a different denominator than the jug's lines, find an equivalent fraction that matches the jug's parts.":
      "Si la fracción del pedido tiene un denominador distinto al de las líneas de la jarra, busca una fracción equivalente que coincida con las partes de la jarra.",
    "Set it up: decide how many jug lines up from the bottom the order needs, then pour one mark per line and serve.":
      "Plantéalo: decide cuántas líneas desde el fondo necesita el pedido, vierte una marca por línea y sirve.",
    "What two quantities does this ratio compare? Say the relationship in words before touching the numbers.":
      "¿Qué dos cantidades compara esta razón? Di la relación con palabras antes de tocar los números.",
    "Equivalent ratios scale BOTH parts by the same number — try building a ratio table and stepping to the value you need.":
      "Las razones equivalentes escalan AMBAS partes por el mismo número: prueba armar una tabla de razones y avanzar hasta el valor que necesitas.",
    "For a price per item or other rate, set it up as an amount for ONE: divide first, then scale up to what the question asks.":
      "Para un precio por artículo u otra tasa, plantéalo como la cantidad para 1: primero divide y luego escala hasta lo que pide la pregunta.",
  };

  var state = {
    problem: null, // { itemText, standard, staticHints }
    rung: 0, // rungs revealed so far (0..MAX_RUNGS)
    history: [], // [{role,text}] shared with the endpoint for continuity
    busy: false,
    backend: null, // null=unknown, true/false after health probe
  };

  var els = {}; // cached DOM nodes

  function BIG_IDEA() {
    return T(
      "Think about the big idea: this kind of problem is about a relationship you can scale up or down. Re-read the numbers and ask what stays the same.",
      "Piensa en la idea principal: este tipo de problema trata de una relación que puedes aumentar o reducir. Vuelve a leer los números y pregunta qué se mantiene igual.",
    );
  }

  /* ---------------------------------------------------------------- helpers */
  function clamp(s, n) {
    return (typeof s === "string" ? s : "").slice(0, n);
  }

  function withTimeout(_promise, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () {
      ctrl.abort();
    }, ms);
    return {
      signal: ctrl.signal,
      done: function () {
        clearTimeout(t);
      },
    };
  }

  // One-time, best-effort backend probe so we can label hints honestly. The
  // ladder still works regardless; this only decides the "AI vs coach" badge.
  function probeBackend() {
    try {
      fetch(ENDPOINT + "/health", { method: "GET" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (d) {
          state.backend = !!(d && d.live);
        })
        .catch(function () {
          state.backend = false;
        });
    } catch (_e) {
      state.backend = false;
    }
  }

  // Ask the endpoint for a hint at the current rung. Resolves to a string, or
  // null if the AI path is unavailable (caller uses the static fallback).
  function fetchAiHint() {
    var p = state.problem;
    if (!p || !p.itemText) return Promise.resolve(null);
    // state.rung is already incremented to the 1-based rung being requested;
    // RUNG_FRAMING is 0-indexed, so subtract 1 to escalate 0 -> 1 -> 2.
    var framing = RUNG_FRAMING[Math.min(state.rung - 1, RUNG_FRAMING.length - 1)];
    var body = {
      mode: "hint",
      standard: clamp(p.standard, 40),
      itemText: clamp(p.itemText, 1800),
      // We pass the escalation instruction as "studentWork" context; the
      // endpoint folds it into the user turn. Keeps the shared contract intact.
      studentWork: framing,
      history: state.history.slice(-6),
    };
    if (replyLang()) body.replyLang = replyLang();
    var to = withTimeout(null, FETCH_TIMEOUT_MS);
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: to.signal,
    })
      .then(function (r) {
        to.done();
        if (!r.ok) return null; // 429/503/500 -> fallback
        return r.json();
      })
      .then(function (d) {
        if (d && d.ok && typeof d.reply === "string" && d.reply.trim()) {
          state.backend = true;
          return d.reply.trim();
        }
        return null;
      })
      .catch(function () {
        to.done();
        return null;
      });
  }

  function staticHint(rungIndex) {
    var hints = (state.problem && state.problem.staticHints) || [];
    var general = T(
      "Look at what the problem gives you and what it asks for. What is the one relationship that connects them?",
      "Mira qué te da el problema y qué te pide. ¿Cuál es la única relación que los conecta?",
    );
    if (!hints.length) return general;
    // Clamp to the last authored hint if fewer than MAX_RUNGS were supplied.
    var en = hints[Math.min(rungIndex, hints.length - 1)];
    if (!isEs()) return en;
    return HINT_ES[en] || general;
  }

  /* ------------------------------------------------------------------- view */
  // Static labels in the current language; called on build and whenever the language changes.
  function relabel() {
    if (!els.root) return;
    els.fab.querySelector("span").textContent = T("Need a hint?", "¿Necesitas una pista?");
    els.panel.setAttribute("aria-label", T("Hints", "Pistas"));
    els.root.querySelector(".nt-hl-title").textContent = T("Hints", "Pistas");
    els.close.setAttribute("aria-label", T("Close hints", "Cerrar las pistas"));
    els.root.querySelector(".nt-hl-foot").textContent = T(
      "Hints guide your thinking — they never give the final answer.",
      "Las pistas guían tu pensamiento: nunca dan la respuesta final.",
    );
    if (!state.busy && els.more) {
      els.more.textContent =
        state.rung === 0
          ? T("Show me a hint", "Muéstrame una pista")
          : state.rung >= MAX_RUNGS
            ? T("Explain the idea", "Explica la idea")
            : T("Show me another hint", "Muéstrame otra pista");
    }
    if (!state.problem && !els.panel.hidden) showEmptyState();
  }
  function ensureUi() {
    if (els.root) return;
    var root = doc.createElement("div");
    root.className = "nt-hl-root";
    root.innerHTML =
      '<button type="button" class="nt-hl-fab" aria-haspopup="dialog" aria-expanded="false">' +
      "💡 <span>Need a hint?</span></button>" +
      '<div class="nt-hl-panel" role="dialog" aria-label="Hints" hidden>' +
      '  <div class="nt-hl-head">' +
      '    <span class="nt-hl-title">Hints</span>' +
      '    <span class="nt-hl-badge" hidden></span>' +
      '    <button type="button" class="nt-hl-close" aria-label="Close hints">×</button>' +
      "  </div>" +
      '  <div class="nt-hl-steps" aria-live="polite"></div>' +
      '  <button type="button" class="nt-hl-more">Show me a hint</button>' +
      '  <div class="nt-hl-foot">Hints guide your thinking — they never give the final answer.</div>' +
      "</div>";
    doc.body.appendChild(root);

    els.root = root;
    els.fab = root.querySelector(".nt-hl-fab");
    els.panel = root.querySelector(".nt-hl-panel");
    els.steps = root.querySelector(".nt-hl-steps");
    els.more = root.querySelector(".nt-hl-more");
    els.badge = root.querySelector(".nt-hl-badge");
    els.close = root.querySelector(".nt-hl-close");

    relabel();
    els.fab.addEventListener("click", togglePanel);
    els.close.addEventListener("click", function () {
      openPanel(false);
    });
    els.more.addEventListener("click", nextRung);
    root.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !els.panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        openPanel(false);
      }
    });
  }

  function showEmptyState() {
    if (!els.steps) return;
    els.steps.innerHTML = '<p class="nt-hl-step-text nt-hl-empty"></p>';
    els.steps.firstChild.textContent = T(
      "Start a problem, then tap here and I'll help you think it through — one hint at a time.",
      "Empieza un problema, toca aquí y te ayudaré a pensarlo, una pista a la vez.",
    );
    if (els.more) {
      els.more.disabled = true;
      els.more.textContent = T("Show me a hint", "Muéstrame una pista");
    }
    if (els.badge) els.badge.hidden = true;
  }

  function openPanel(open) {
    ensureUi();
    els.panel.hidden = !open;
    els.fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      if (els.panel.contains(doc.activeElement)) els.fab.focus();
      return;
    }
    els.close.focus();
    // No active problem yet (title/menu/results screen): guide, don't fetch.
    if (!state.problem) {
      showEmptyState();
      return;
    }
    if (state.rung === 0) nextRung(); // reveal rung 1 on first open
  }
  function togglePanel() {
    openPanel(els.panel.hidden);
  }

  function setBadge(isAi) {
    if (!els.badge) return;
    els.badge.hidden = false;
    els.badge.textContent = isAi ? T("AI coach", "Entrenador IA") : T("coach", "entrenador");
    els.badge.classList.toggle("nt-hl-badge-ai", !!isAi);
  }

  function addStep(text, isAi) {
    var step = doc.createElement("div");
    step.className = "nt-hl-step";
    var n = doc.createElement("span");
    n.className = "nt-hl-step-n";
    n.textContent = String(state.rung); // 1-based; incremented before addStep
    var body = doc.createElement("p");
    body.className = "nt-hl-step-text";
    body.textContent = text;
    step.appendChild(n);
    step.appendChild(body);
    els.steps.appendChild(step);
    setBadge(isAi);
    // Keep continuity for the AI so later rungs build on earlier ones.
    state.history.push({ role: "assistant", text: clamp(text, 1000) });
  }

  function setBusy(on) {
    state.busy = on;
    if (!els.more) return;
    els.more.disabled = on;
    els.more.textContent = on
      ? T("Thinking…", "Pensando…")
      : state.rung >= MAX_RUNGS
        ? T("Explain the idea", "Explica la idea")
        : T("Show me another hint", "Muéstrame otra pista");
  }

  function nextRung() {
    if (state.busy || !state.problem) return;

    // After the ladder is exhausted, the "more" button switches to concept
    // explanation (still answer-free via the endpoint's explain mode).
    if (state.rung >= MAX_RUNGS) {
      explainConcept();
      return;
    }

    state.rung += 1;
    setBusy(true);
    fetchAiHint().then(function (aiText) {
      var text = aiText || staticHint(state.rung - 1);
      addStep(text, !!aiText);
      setBusy(false);
    });
  }

  function explainConcept() {
    if (state.busy || !state.problem) return;
    setBusy(true);
    var p = state.problem;
    var to = withTimeout(null, FETCH_TIMEOUT_MS);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "explain",
        standard: clamp(p.standard, 40),
        itemText: clamp(p.itemText, 1800),
        history: state.history.slice(-6),
        replyLang: replyLang() || undefined,
      }),
      signal: to.signal,
    })
      .then(function (r) {
        to.done();
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        var text = d && d.ok && d.reply && d.reply.trim() ? d.reply.trim() : BIG_IDEA();
        var step = doc.createElement("div");
        step.className = "nt-hl-step nt-hl-step-explain";
        var body = doc.createElement("p");
        body.className = "nt-hl-step-text";
        body.textContent = text;
        step.appendChild(body);
        els.steps.appendChild(step);
        setBadge(!!(d && d.ok));
        setBusy(false);
        els.more.disabled = true; // ladder + explanation complete
      })
      .catch(function () {
        // Network/timeout must never leave the student with nothing —
        // mirror the non-ok path with the static big-idea fallback.
        to.done();
        var step = doc.createElement("div");
        step.className = "nt-hl-step nt-hl-step-explain";
        var body = doc.createElement("p");
        body.className = "nt-hl-step-text";
        body.textContent = BIG_IDEA();
        step.appendChild(body);
        els.steps.appendChild(step);
        setBadge(false);
        setBusy(false);
        els.more.disabled = true; // ladder + explanation complete
      });
  }

  /* --------------------------------------------------------------- public API */
  function setProblem(problem) {
    if (!problem || typeof problem !== "object") return;
    state.problem = {
      itemText: clamp(problem.itemText, 1800),
      standard: clamp(problem.standard, 40),
      staticHints: Array.isArray(problem.staticHints)
        ? problem.staticHints
            .map(function (h) {
              return clamp(h, 400);
            })
            .filter(Boolean)
        : [],
    };
    state.rung = 0;
    state.history = [];
    ensureUi();
    if (els.steps) els.steps.innerHTML = "";
    if (els.badge) els.badge.hidden = true;
    setBusy(false);
    // Reset the "more" label; collapse the panel so a new problem starts fresh.
    if (els.more) els.more.textContent = T("Show me a hint", "Muéstrame una pista");
    openPanel(false);
  }

  // Generic driver: watch a DOM element that mirrors the current problem (these
  // Phaser games write the live problem into a screen-reader status region via
  // srSay). On each genuine new problem, publish it to the ladder. This lets a
  // game opt in with zero changes to its closure/game logic — just a selector.
  //
  // opts: { sourceSelector, standard, staticHints }
  function watch(opts) {
    if (!opts || !opts.sourceSelector) return;
    ensureUi();
    var standard = clamp(opts.standard, 40);
    var staticHints = Array.isArray(opts.staticHints) ? opts.staticHints : [];
    // Optional allow-list: when a game's status region also carries non-problem
    // chatter (interaction feedback, intros), pass an `accept` regex source so
    // ONLY genuine problem announcements are ingested. When absent, any
    // non-result text qualifies (fine for single-format games).
    var acceptRe = null;
    if (opts.accept) {
      try {
        acceptRe = new RegExp(opts.accept, "i");
      } catch (_e) {
        acceptRe = null;
      }
    }

    // Result/answer announcements must never become itemText — they may contain
    // the solution (games announce "Correct. <why>"). Accept only problem-like
    // statements, and require a real change before resetting the ladder.
    function looksLikeProblem(t) {
      if (!t || t.length < 14) return false;
      if (
        /\b(correct|nice|great job|well done|try again|not quite|oops|incorrect|marker at|placed|equivalent|you got|you win|game over|score|level up)\b/i.test(
          t,
        )
      )
        return false;
      if (
        /\b(correcto|correcta|bien hecho|muy bien|excelente|inténtalo|intenta de nuevo|no del todo|incorrecto|incorrecta|todavía no|aún no|puntos|puntaje|ganaste|fin del juego|marcador en|colocado)\b/i.test(
          t,
        )
      )
        return false;
      if (/[✓✗]/.test(t)) return false;
      if (acceptRe && !acceptRe.test(t)) return false;
      return true;
    }

    function ingest(raw) {
      var t = (raw || "").replace(/\s+/g, " ").trim();
      if (!looksLikeProblem(t)) return;
      var next = clamp(t, 1800);
      if (state.problem && state.problem.itemText === next) return; // unchanged
      setProblem({
        itemText: next,
        standard: standard,
        staticHints: staticHints,
      });
    }

    var el = doc.querySelector(opts.sourceSelector);
    if (el) {
      ingest(el.textContent);
      try {
        var mo = new MutationObserver(function () {
          ingest(el.textContent);
        });
        mo.observe(el, { childList: true, characterData: true, subtree: true });
      } catch (_e) {
        /* MutationObserver unsupported — first-read still works */
      }
    }
    // Fallback: (re-)read the source the moment the student opens the panel, in
    // case no mutation fired (e.g. problem set before the observer attached).
    if (els.fab) {
      els.fab.addEventListener("click", function () {
        if (!state.problem && el) ingest(el.textContent);
      });
    }
  }

  window.addEventListener("storage", function (event) {
    if (event.key === "nt-lang") relabel();
  });
  doc.addEventListener("ewl:lang", relabel);

  window.NeftHintLadder = {
    setProblem: setProblem,
    watch: watch,
    // Manual controls (optional).
    open: function () {
      openPanel(true);
    },
    reset: function () {
      if (state.problem) setProblem(state.problem);
    },
  };

  // On ready: show the hint button immediately (so students can always find it,
  // even before the first problem renders) and probe the backend (non-blocking).
  function onReady() {
    ensureUi();
    probeBackend();
  }
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
