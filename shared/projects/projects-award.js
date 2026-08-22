/* Community Math Studio — shared award-readiness learning contract.
 * Adds a real-client brief, mathematical modeling cycle, WIDA-aligned
 * language support, critique/revision/defense, and a transfer check to every
 * standard culminating project. All evidence stays local and exports through
 * the existing project report/publication tools.
 */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  var STORE_PREFIX = "nt-community-math-studio:v1:";
  var config = null;
  var state = load();
  var statusNode = null;

  function key() {
    return STORE_PREFIX + location.pathname;
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_PREFIX + location.pathname)) || {};
    } catch (_error) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(key(), JSON.stringify(state));
    } catch (_error) {}
    updateStatus();
    document.dispatchEvent(new CustomEvent("neft:award-evidence-updated", { detail: evidence() }));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bi(en, es) {
    return '<span class="cms-en">' + esc(en) + '</span><span class="cms-es">' + esc(es) + "</span>";
  }

  function isSpanish() {
    return document.body.classList.contains("es") || document.body.classList.contains("lang-es");
  }

  function t(pair) {
    return pair ? pair[isSpanish() ? "es" : "en"] : "";
  }

  function field(id, labelEn, labelEs, helpEn, helpEs, rows) {
    var value = state[id] || "";
    return (
      '<label class="cms-field" for="cms-' +
      id +
      '"><span class="cms-field__label">' +
      bi(labelEn, labelEs) +
      "</span>" +
      (helpEn ? '<span class="cms-field__help">' + bi(helpEn, helpEs) + "</span>" : "") +
      '<textarea id="cms-' +
      id +
      '" data-award-field="' +
      id +
      '" rows="' +
      (rows || 2) +
      '">' +
      esc(value) +
      "</textarea></label>"
    );
  }

  function goalCard() {
    var constraintLabelsEs = [
      "Necesidad o límite del cliente",
      "Precisión matemática",
      "Viabilidad y equidad",
    ];
    var constraints = (config.constraints || [])
      .map(function (item, index) {
        return "<li>" + bi(item, constraintLabelsEs[index] || "Condición del proyecto") + "</li>";
      })
      .join("");
    var card = document.createElement("section");
    // The brief is part of the student product and belongs in print/PDF output.
    card.className = "cms-goals";
    card.setAttribute("aria-labelledby", "cms-goals-title");
    card.innerHTML =
      '<p class="cms-kicker">' +
      bi("Community Math Studio", "Estudio de matemáticas comunitarias") +
      "</p>" +
      '<h2 id="cms-goals-title">' +
      bi(config.title.en, config.title.es) +
      "</h2>" +
      '<p class="cms-mission"><strong>' +
      bi("Your mission:", "Tu misión:") +
      "</strong> " +
      bi(config.question.en, config.question.es) +
      "</p>" +
      '<div class="cms-goals__grid">' +
      "<article><h3>" +
      bi("Mathematics target", "Meta de matemáticas") +
      "</h3><p>" +
      bi(config.mathTarget.en, config.mathTarget.es) +
      "</p></article>" +
      "<article><h3>" +
      bi("Language target · Explain + Argue", "Meta de lenguaje · Explicar + Argumentar") +
      "</h3><p>" +
      bi(config.languageTarget.en, config.languageTarget.es) +
      "</p></article>" +
      '<article class="cms-goals__product"><h3>' +
      bi("Final product", "Producto final") +
      "</h3><p>" +
      bi(
        config.product?.en ||
          "An audience-ready project proposal with labeled math, a model, evidence, and a revision.",
        config.product?.es ||
          "Una propuesta lista para una audiencia con matemáticas rotuladas, un modelo, evidencia y una revisión.",
      ) +
      "</p></article>" +
      "<article><h3>" +
      bi("Audience or client", "Audiencia o cliente") +
      "</h3><p>" +
      bi(config.client.en, config.client.es) +
      "</p></article>" +
      "</div>" +
      '<ol class="cms-roadmap" aria-label="Project roadmap">' +
      "<li><strong>" +
      bi("Plan", "Planifica") +
      "</strong> " +
      bi("Read the mission and choose a path.", "Lee la misión y elige un camino.") +
      "</li>" +
      "<li><strong>" +
      bi("Build", "Construye") +
      "</strong> " +
      bi("Show the math in more than one way.", "Muestra las matemáticas de más de una manera.") +
      "</li>" +
      "<li><strong>" +
      bi("Revise", "Revisa") +
      "</strong> " +
      bi("Use feedback and check your evidence.", "Usa comentarios y revisa tu evidencia.") +
      "</li>" +
      "<li><strong>" +
      bi("Publish", "Publica") +
      "</strong> " +
      bi(
        "Prepare the final product for your audience.",
        "Prepara el producto final para tu audiencia.",
      ) +
      "</li>" +
      "</ol>" +
      '<details class="cms-constraints"><summary>' +
      bi("Core constraints", "Condiciones principales") +
      "</summary><ul>" +
      constraints +
      "</ul></details>";
    return card;
  }

  function supportLab() {
    return (
      '<section class="cms-support" aria-labelledby="cms-support-title">' +
      '<h3 id="cms-support-title">' +
      bi("Math language rehearsal", "Ensayo del lenguaje matemático") +
      "</h3>" +
      '<p class="cms-support__intro">' +
      bi(
        "Choose only the support you need. Think, annotate, or rehearse in any language; then communicate for your audience.",
        "Elige solo el apoyo que necesitas. Piensa, anota o ensaya en cualquier idioma; luego comunica para tu audiencia.",
      ) +
      "</p>" +
      '<div class="cms-support__buttons" role="group" aria-label="Language support level">' +
      '<button type="button" data-support="words">' +
      bi("Words", "Palabras") +
      "</button>" +
      '<button type="button" data-support="sentence">' +
      bi("Sentence", "Oración") +
      "</button>" +
      '<button type="button" data-support="argument">' +
      bi("Argument", "Argumento") +
      "</button>" +
      '<button type="button" data-support="none">' +
      bi("Hide supports", "Ocultar apoyos") +
      "</button></div>" +
      '<div class="cms-support__output" id="cms-support-output" role="status" aria-live="polite"></div>' +
      "</section>"
    );
  }

  function studioMarkup() {
    return (
      '<p class="cms-kicker">' +
      bi("Project evidence", "Evidencia del proyecto") +
      "</p>" +
      '<h2 id="cms-studio-title">' +
      bi("Model, critique, revise, and defend", "Modela, critica, revisa y defiende") +
      "</h2>" +
      '<p class="cms-lead">' +
      bi(
        "Use this studio to show the decisions behind your final answer. Correct calculations matter; so do assumptions, evidence, revision, and communication.",
        "Usa este estudio para mostrar las decisiones detrás de tu respuesta final. Los cálculos correctos importan; también las suposiciones, evidencia, revisión y comunicación.",
      ) +
      "</p>" +
      '<details class="cms-stage" open><summary><span>1</span>' +
      bi("Discover + define", "Descubre + define") +
      '</summary><div class="cms-stage__body">' +
      field(
        "stakeholder",
        "Who could use this work?",
        "¿Quién podría usar este trabajo?",
        "Name a role or group, not a private individual.",
        "Nombra un rol o grupo, no una persona privada.",
      ) +
      field(
        "need",
        "What does the client need decided or improved?",
        "¿Qué necesita decidir o mejorar el cliente?",
      ) +
      field(
        "success",
        "What would make a solution successful?",
        "¿Qué haría exitosa una solución?",
      ) +
      "</div></details>" +
      '<details class="cms-stage"><summary><span>2</span>' +
      bi("Estimate + make assumptions", "Estima + haz suposiciones") +
      '</summary><div class="cms-stage__body">' +
      field("estimate", "Estimate before calculating", "Estimación antes de calcular") +
      field(
        "assumptions",
        "List assumptions and why they are reasonable",
        "Enumera las suposiciones y por qué son razonables",
        "Include units, limits, or information you do not know yet.",
        "Incluye unidades, límites o información que todavía no conoces.",
        3,
      ) +
      "</div></details>" +
      '<details class="cms-stage"><summary><span>3</span>' +
      bi("Build two models", "Construye dos modelos") +
      '</summary><div class="cms-stage__body cms-stage__body--two">' +
      field(
        "modelA",
        "Model or strategy A",
        "Modelo o estrategia A",
        "Use an equation plus a table, diagram, graph, or physical/digital model.",
        "Usa una ecuación y también una tabla, diagrama, gráfica o modelo físico/digital.",
        4,
      ) +
      field(
        "modelB",
        "Model or strategy B",
        "Modelo o estrategia B",
        "Change one assumption, representation, or design choice.",
        "Cambia una suposición, representación o decisión de diseño.",
        4,
      ) +
      field(
        "tradeoff",
        "Which model is stronger, and what tradeoff did you accept?",
        "¿Qué modelo es más sólido y qué compromiso aceptaste?",
        "Use quantities and evidence, not preference alone.",
        "Usa cantidades y evidencia, no solo preferencia.",
        3,
      ) +
      "</div></details>" +
      '<details class="cms-stage"><summary><span>4</span>' +
      bi("Test + validate", "Prueba + valida") +
      '</summary><div class="cms-stage__body">' +
      field(
        "validation",
        "How did you test whether the model makes sense?",
        "¿Cómo comprobaste que el modelo tiene sentido?",
        "Try evidence, an extreme case, a measurement, a prototype, or another representation.",
        "Usa evidencia, un caso extremo, una medición, un prototipo u otra representación.",
        3,
      ) +
      field(
        "limitations",
        "Where could this model fail or mislead someone?",
        "¿Dónde podría fallar este modelo o confundir a alguien?",
      ) +
      "</div></details>" +
      supportLab() +
      '<details class="cms-stage"><summary><span>5</span>' +
      bi("Critique + revise", "Critica + revisa") +
      '</summary><div class="cms-stage__body cms-stage__body--two">' +
      field("peerNotice", "A peer noticed…", "Un compañero notó…") +
      field("peerQuestion", "A peer questioned…", "Un compañero preguntó…") +
      field("peerChallenge", "A peer challenged…", "Un compañero cuestionó…") +
      field(
        "revision",
        "I revised ___ because…",
        "Revisé ___ porque…",
        "Name a mathematical change, not only an editing change.",
        "Nombra un cambio matemático, no solo un cambio de redacción.",
        3,
      ) +
      "</div></details>" +
      '<details class="cms-stage"><summary><span>6</span>' +
      bi("Defend + respond", "Defiende + responde") +
      '</summary><div class="cms-stage__body">' +
      field(
        "defense",
        "Final claim, evidence, and reasoning",
        "Afirmación final, evidencia y razonamiento",
        "State the recommendation, cite the strongest quantities, and acknowledge a limitation.",
        "Presenta la recomendación, cita las cantidades más sólidas y reconoce una limitación.",
        5,
      ) +
      field(
        "audienceFeedback",
        "Audience or client feedback",
        "Comentarios de la audiencia o cliente",
        "What did they accept, question, or ask you to change?",
        "¿Qué aceptaron, cuestionaron o pidieron cambiar?",
        3,
      ) +
      field(
        "response",
        "How did you respond to that feedback?",
        "¿Cómo respondiste a esos comentarios?",
      ) +
      "</div></details>" +
      '<details class="cms-stage cms-transfer"><summary><span>7</span>' +
      bi("Transfer challenge", "Reto de transferencia") +
      '</summary><div class="cms-stage__body"><p><strong>' +
      bi(config.transfer.en, config.transfer.es) +
      "</strong></p>" +
      field(
        "transfer",
        "Solve the new case and explain what transfers from your original model",
        "Resuelve el nuevo caso y explica qué se transfiere de tu modelo original",
        "Do not simply repeat the first calculation.",
        "No repitas simplemente el primer cálculo.",
        4,
      ) +
      "</div></details>" +
      '<div class="cms-finish"><p id="cms-status" role="status" aria-live="polite"></p>' +
      '<div class="cms-finish__actions"><button type="button" data-cms-action="copy">' +
      bi("Copy evidence summary", "Copiar resumen de evidencia") +
      '</button><button type="button" data-cms-action="focus">' +
      bi("Go to next unfinished part", "Ir a la siguiente parte incompleta") +
      "</button></div></div>"
    );
  }

  function mount() {
    var panels = document.querySelectorAll(".step-panel");
    if (!panels.length || document.querySelector(".cms-studio")) return;
    var first = panels[0];
    var goals = goalCard();
    // Always mount as a direct child. The old heading-based insertion could
    // nest the brief inside the asynchronously injected warm-up; the partner
    // layer later moves that warm-up to the final step, taking the project
    // mission with it and hiding the purpose until students were finished.
    first.prepend(goals);

    var last = panels[panels.length - 1];
    var studio = document.createElement("section");
    studio.className = "cms-studio";
    studio.setAttribute("aria-labelledby", "cms-studio-title");
    studio.innerHTML = studioMarkup();
    var insertion = last.querySelector(".pps-quality, .pps-studio, .pub-selfassess");
    if (insertion) insertion.insertAdjacentElement("beforebegin", studio);
    else last.appendChild(studio);
    statusNode = studio.querySelector("#cms-status");
    bind(studio);
    updateStatus();
  }

  function bind(studio) {
    studio.querySelectorAll("[data-award-field]").forEach(function (node) {
      node.addEventListener("input", function () {
        state[node.dataset.awardField] = node.value;
        save();
      });
    });
    studio.querySelectorAll("[data-support]").forEach(function (button) {
      button.addEventListener("click", function () {
        showSupport(button.dataset.support);
      });
    });
    studio.querySelector('[data-cms-action="copy"]').addEventListener("click", copySummary);
    studio.querySelector('[data-cms-action="focus"]').addEventListener("click", focusNext);
  }

  function showSupport(level) {
    var output = document.getElementById("cms-support-output");
    if (!output) return;
    var content = {
      words: {
        en: "constraint · assumption · representation · evidence · compare · therefore · however · limitation · revise",
        es: "condición · suposición · representación · evidencia · comparar · por lo tanto · sin embargo · limitación · revisar",
      },
      sentence: {
        en: "My model assumes ___ because ___. The evidence ___ supports/challenges this assumption because ___.",
        es: "Mi modelo supone ___ porque ___. La evidencia ___ apoya/cuestiona esta suposición porque ___.",
      },
      argument: {
        en: "I recommend ___. My strongest mathematical evidence is ___. A limitation is ___. After feedback, I revised ___, which made the model ___.",
        es: "Recomiendo ___. Mi evidencia matemática más sólida es ___. Una limitación es ___. Después de recibir comentarios, revisé ___, lo cual hizo que el modelo fuera ___.",
      },
      none: {
        en: "Supports hidden. Use your own words and representations.",
        es: "Apoyos ocultos. Usa tus propias palabras y representaciones.",
      },
    };
    var chosen = content[level] || content.none;
    output.innerHTML = bi(chosen.en, chosen.es);
  }

  var required = [
    ["stakeholder", 3],
    ["need", 12],
    ["success", 12],
    ["estimate", 3],
    ["assumptions", 18],
    ["modelA", 18],
    ["modelB", 18],
    ["tradeoff", 18],
    ["validation", 18],
    ["limitations", 12],
    ["peerNotice", 8],
    ["peerQuestion", 8],
    ["peerChallenge", 8],
    ["revision", 18],
    ["defense", 30],
    ["audienceFeedback", 8],
    ["response", 12],
    ["transfer", 24],
  ];

  function completion() {
    var completed = required.filter(function (rule) {
      return String(state[rule[0]] || "").trim().length >= Number(rule[1]);
    });
    return {
      completed: completed.length,
      total: required.length,
      ready: completed.length === required.length,
    };
  }

  function updateStatus() {
    if (!statusNode) return;
    var result = completion();
    statusNode.dataset.ready = String(result.ready);
    statusNode.innerHTML = result.ready
      ? bi(
          "Community Math Studio complete: your evidence includes modeling, critique, revision, defense, and transfer.",
          "Estudio de matemáticas comunitarias completo: tu evidencia incluye modelación, crítica, revisión, defensa y transferencia.",
        )
      : bi(
          result.completed + " of " + result.total + " evidence parts are ready.",
          result.completed + " de " + result.total + " partes de evidencia están listas.",
        );
  }

  function firstIncomplete() {
    for (var index = 0; index < required.length; index += 1) {
      var rule = required[index];
      if (String(state[rule[0]] || "").trim().length < Number(rule[1]))
        return document.querySelector('[data-award-field="' + rule[0] + '"]');
    }
    return null;
  }

  function focusNext() {
    var node = firstIncomplete();
    if (!node) return;
    var details = node.closest("details");
    if (details) details.open = true;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    /** @type {HTMLElement} */ (node).focus({ preventScroll: true });
  }

  function summary() {
    var lines = [
      "COMMUNITY MATH STUDIO EVIDENCE",
      t(config.title),
      "",
      "Mathematics target: " + t(config.mathTarget),
      "Language target: " + t(config.languageTarget),
      "Driving question: " + t(config.question),
      "",
    ];
    required.forEach(function (rule) {
      var node = document.querySelector('[data-award-field="' + rule[0] + '"]');
      var label = node && document.querySelector('label[for="' + node.id + '"] .cms-field__label');
      lines.push((label ? label.textContent.trim() : rule[0]) + ":");
      lines.push(String(state[rule[0]] || "[not completed]").trim() || "[not completed]", "");
    });
    return lines.join("\n");
  }

  function copySummary() {
    var textValue = summary();
    var done = function () {
      if (statusNode)
        statusNode.innerHTML = bi("Evidence summary copied.", "Resumen de evidencia copiado.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard
        .writeText(textValue)
        .then(done)
        .catch(function () {});
    else {
      var area = document.createElement("textarea");
      area.value = textValue;
      area.hidden = true;
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        done();
      } catch (_error) {}
      area.remove();
    }
  }

  function evidence() {
    return {
      version: 1,
      model: "Community Math Studio",
      route: location.pathname,
      project: config ? config.title.en : "",
      completion: completion(),
      responses: Object.assign({}, state),
      summary: config ? summary() : "",
    };
  }

  function boot() {
    if (!document.body || !document.body.classList.contains("pro-projects")) return;
    if (document.body.dataset.awardInit) return;
    document.body.dataset.awardInit = "loading";
    fetch("/shared/projects/projects-award-config.json", { cache: "no-cache" })
      .then(function (response) {
        return response.ok ? response.json() : Promise.reject(new Error("config unavailable"));
      })
      .then(function (data) {
        config = data.projects && data.projects[location.pathname];
        if (!config) throw new Error("project configuration missing");
        mount();
        document.dispatchEvent(new CustomEvent("neft:award-studio-mounted"));
        document.body.dataset.awardInit = "1";
      })
      .catch(function (error) {
        document.body.dataset.awardInit = "error";
        console.error("Community Math Studio could not start:", error.message);
      });
  }

  window.NeftAwardStudio = { getEvidence: evidence, getSummary: summary, focusNext: focusNext };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
