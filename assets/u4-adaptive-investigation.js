/* Lesson-specific, local-first investigations for the ten hand-built Unit 4 studios. */
(() => {
  const host = document.getElementById("u4-lab-bench");
  if (!host) return;
  const path = location.pathname;
  const lesson = /4-([2-5])-practice-studio/.exec(path)?.[1] || "1";
  const challenge = path.includes("challenging");
  const key = `neft_u4_investigation_v1_4-${lesson}_${challenge ? "challenge" : "practice"}`;
  const cases = {
    1: {
      title: "Build a percent relationship",
      es: "Construye una relación porcentual",
      labels: ["Part", "Whole"],
      labelsEs: ["Parte", "Total"],
      start: [25, 100],
      read: ([a, b]) => `${a} of ${b} = ${fmt((100 * a) / b)}%`,
      prompt: "Change the part and whole. What stays the same when both are scaled equally?",
      promptEs:
        "Cambia la parte y el total. ¿Qué permanece igual si ambos se multiplican por el mismo factor?",
      check: [30, 120, 25],
      transfer: [18, 72, 25],
    },
    2: {
      title: "Connect fraction, decimal, and percent",
      es: "Conecta fracción, decimal y porcentaje",
      labels: ["Numerator", "Denominator"],
      labelsEs: ["Numerador", "Denominador"],
      start: [3, 4],
      read: ([a, b]) => `${a}/${b} = ${fmt(a / b)} = ${fmt((100 * a) / b)}%`,
      prompt:
        "Change both numbers. Which fraction produces 75%? Find a second equivalent fraction.",
      promptEs:
        "Cambia ambos números. ¿Qué fracción representa 75%? Encuentra otra fracción equivalente.",
      check: [3, 4, 75],
      transfer: [7, 20, 35],
    },
    3: {
      title: "Test a percent estimate",
      es: "Comprueba una estimación porcentual",
      labels: ["Percent", "Whole"],
      labelsEs: ["Porcentaje", "Total"],
      start: [18, 80],
      read: ([a, b]) => `${a}% of ${b} = ${fmt((a * b) / 100)}; 20% benchmark = ${fmt(b / 5)}`,
      prompt: "Move the percent around 20%. How does the exact result compare with the benchmark?",
      promptEs:
        "Mueve el porcentaje cerca de 20%. ¿Cómo se compara el resultado exacto con la referencia?",
      check: [18, 80, 14.4],
      transfer: [22, 50, 11],
    },
    4: {
      title: "Compare percentages of different wholes",
      es: "Compara porcentajes de diferentes totales",
      labels: ["Percent A", "Whole A", "Percent B", "Whole B"],
      labelsEs: ["Porcentaje A", "Total A", "Porcentaje B", "Total B"],
      start: [50, 12, 25, 40],
      read: ([a, b, c, d]) =>
        `${a}% of ${b} = ${fmt((a * b) / 100)}; ${c}% of ${d} = ${fmt((c * d) / 100)}`,
      prompt:
        "Can a smaller percentage give a larger amount? Change the two wholes to test your prediction.",
      promptEs:
        "¿Puede un porcentaje menor dar una cantidad mayor? Cambia los totales para comprobarlo.",
      check: [50, 12, 25, 40, 10],
      transfer: [40, 15, 20, 50, 10],
    },
    5: {
      title: "Build a missing whole",
      es: "Construye un total desconocido",
      labels: ["Known percent", "Known part"],
      labelsEs: ["Porcentaje conocido", "Parte conocida"],
      start: [40, 18],
      read: ([a, b]) =>
        `${a}% is ${b}; 100% = ${fmt((100 * b) / a)}; ${fmt(b)} ÷ ${fmt(a / 100)} = ${fmt((100 * b) / a)}`,
      prompt:
        "Adjust the known part or percent. How does the whole change? Check by finding the percent of your whole.",
      promptEs:
        "Cambia la parte o el porcentaje. ¿Cómo cambia el total? Comprueba hallando el porcentaje del total.",
      check: [40, 18, 45],
      transfer: [25, 16, 64],
    },
  };
  const cfg = cases[lesson];
  const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));
  const safe = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const bi = (en, es) => `${safe(en)}<span class="es-text" lang="es">${safe(es)}</span>`;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    /* storage can be blocked */
  }
  let state = {
    values: cfg.start.slice(),
    attempts: 0,
    modelTests: 0,
    revisions: 0,
    independent: 0,
    assisted: 0,
    completed: {},
    diagnostic: null,
    explanation: "",
    ...saved,
  };
  if (!Array.isArray(state.values) || state.values.length !== cfg.start.length)
    state.values = cfg.start.slice();
  if (!state.completed || typeof state.completed !== "object") state.completed = {};
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* session still works */
    }
  };
  const section = document.createElement("section");
  section.className = "u4-investigation";
  section.setAttribute("aria-labelledby", "u4-investigation-title");
  section.innerHTML = `<div class="u4-investigation-heading"><div><p class="u4-investigation-kicker">${bi("Math investigation", "Investigación matemática")}</p><h2 id="u4-investigation-title">${bi(cfg.title, cfg.es)}</h2></div><p class="u4-investigation-evidence" id="u4-investigation-evidence"></p></div>
    <details class="u4-entry"><summary>${bi("Optional 1-minute entry check", "Comprobación inicial opcional de un minuto")}</summary><p>${bi("Two quick questions suggest a useful starting point. They do not measure mastery.", "Dos preguntas rápidas sugieren por dónde empezar. No miden el dominio.")}</p><div class="u4-entry-items"></div><button type="button" class="btn u4-entry-check">${bi("Check starting point", "Comprueba el punto de partida")}</button><p class="u4-entry-result" role="status"></p></details>
    <p>${bi(cfg.prompt, cfg.promptEs)}</p><div class="u4-investigation-workspace"><div class="u4-investigation-controls"></div><div class="u4-investigation-model"><div class="u4-investigation-bars"></div><p class="u4-investigation-equation" aria-live="polite"></p></div></div>
    <label class="u4-investigation-label">${bi(challenge ? "Predict and defend a relationship" : "Predict before changing the model", challenge ? "Predice y defiende una relación" : "Predice antes de cambiar el modelo")}<textarea class="u4-prediction" rows="2"></textarea></label>
    <button type="button" class="btn u4-test">${bi("Test model", "Comprueba el modelo")}</button><p class="u4-test-result" role="status"></p>
    <div class="u4-independent"><h3>${bi(challenge ? "Construct, solve, and justify" : "New independent problem", challenge ? "Construye, resuelve y justifica" : "Nuevo problema independiente")}</h3><p class="u4-independent-question"></p><label class="u4-investigation-label">${bi("Your answer", "Tu respuesta")}<input class="u4-independent-answer" type="text" inputmode="decimal" autocomplete="off"></label><label class="u4-investigation-label">${bi("Explain how your model or equation supports your answer", "Explica cómo tu modelo o ecuación apoya tu respuesta")}<textarea class="u4-explanation" rows="2"></textarea></label><button type="button" class="btn u4-independent-check">${bi("Check my calculation", "Comprueba mi cálculo")}</button><p class="u4-independent-feedback" role="status"></p></div>`;
  host.before(section);
  const $ = (selector) => section.querySelector(selector);
  const values = () => state.values.map(Number);
  const target = (tuple) => tuple.at(-1);
  const question = (tuple) =>
    lesson === "1"
      ? `What percent is ${tuple[0]} of ${tuple[1]}?`
      : lesson === "2"
        ? `Write ${tuple[0]}/${tuple[1]} as a percent.`
        : lesson === "3"
          ? `Find ${tuple[0]}% of ${tuple[1]}. Estimate first.`
          : lesson === "4"
            ? `Compare ${tuple[0]}% of ${tuple[1]} and ${tuple[2]}% of ${tuple[3]}. What is the second amount?`
            : `If ${tuple[0]}% is ${tuple[1]}, what is 100%?`;
  const challengePrompt = {
    1: "Construct a different part and whole that still give 25%. Explain why both ratios are equivalent.",
    2: "Construct a fraction other than 3/4 that still represents 75%. Defend the equivalence.",
    3: "Construct a percent above 20% and show why the 20% benchmark underestimates the exact amount.",
    4: "Construct a case where the larger percentage gives the smaller amount. Explain the role of the wholes.",
    5: "Construct a different known part and percent with the same whole, 45. Explain the inverse relationship.",
  };
  const challengeValid = (v) =>
    lesson === "1"
      ? v[0] / v[1] === 0.25 && !(v[0] === 25 && v[1] === 100)
      : lesson === "2"
        ? v[0] / v[1] === 0.75 && !(v[0] === 3 && v[1] === 4)
        : lesson === "3"
          ? v[0] > 20
          : lesson === "4"
            ? (v[0] - v[2]) * (v[0] * v[1] - v[2] * v[3]) < 0
            : (100 * v[1]) / v[0] === 45 && !(v[0] === 40 && v[1] === 18);
  const problem = () => (state.completed?.check || state.attempts > 0 ? cfg.transfer : cfg.check);
  const control = (label, es, value, i) =>
    `<label>${bi(label, es)}<input type="number" inputmode="decimal" min="1" max="200" step="1" data-control="${i}" value="${value}"></label>`;
  $(".u4-investigation-controls").innerHTML = cfg.labels
    .map((label, i) => control(label, cfg.labelsEs[i], state.values[i], i))
    .join("");
  $(".u4-prediction").value = state.prediction || "";
  $(".u4-explanation").value = state.explanation || "";
  const entryQuestions = [cfg.check, cfg.transfer];
  $(".u4-entry-items").innerHTML = entryQuestions
    .map(
      (p, i) =>
        `<label>${safe(question(p))}<input type="text" inputmode="decimal" data-entry="${i}" autocomplete="off"></label>`,
    )
    .join("");
  function bar(pct, caption, whole = 100, maxWhole = 100) {
    const bounded = Math.max(0, Math.min(100, pct));
    return `<div class="u4-investigation-bar"><strong>${safe(caption)}</strong><div class="u4-investigation-track" style="width:${(100 * whole) / maxWhole}%" role="img" aria-label="${safe(caption)}: ${fmt(pct)} percent of ${fmt(whole)} is ${fmt((pct * whole) / 100)}"><span style="width:${bounded}%"></span></div><output>${fmt((pct * whole) / 100)}</output></div>`;
  }
  function render() {
    const v = values();
    const pct =
      lesson === "1" || lesson === "2"
        ? (100 * v[0]) / v[1]
        : lesson === "3" || lesson === "5"
          ? v[0]
          : v[0];
    $(".u4-investigation-bars").innerHTML =
      lesson === "4"
        ? bar(v[0], "A", v[1], Math.max(v[1], v[3])) + bar(v[2], "B", v[3], Math.max(v[1], v[3]))
        : bar(pct, cfg.title);
    $(".u4-investigation-equation").textContent = cfg.read(v);
    $(".u4-independent-question").textContent =
      (challenge ? challengePrompt[lesson] + " Then solve: " : "") + question(problem());
    $(".u4-investigation-evidence").textContent =
      `${state.independent} independent · ${state.revisions} successful revisions · ${state.assisted} supports used`;
  }
  section.addEventListener("input", (event) => {
    const input = event.target;
    if (input.matches("[data-control]")) {
      const i = Number(input.dataset.control),
        n = Number(input.value);
      if (Number.isFinite(n) && n > 0 && n <= 200) {
        state.values[i] = n;
        save();
        render();
      }
    }
    if (input.matches(".u4-prediction")) {
      state.prediction = input.value;
      save();
    }
    if (input.matches(".u4-explanation")) {
      state.explanation = input.value;
      save();
    }
  });
  $(".u4-entry-check").addEventListener("click", () => {
    const entries = [...section.querySelectorAll("[data-entry]")];
    if (entries.some((el) => !el.value.trim())) {
      $(".u4-entry-result").textContent =
        "Answer both questions first. / Responde las dos preguntas primero.";
      return;
    }
    state.diagnostic = entries.filter(
      (el, i) => Math.abs(Number(el.value) - target(entryQuestions[i])) < 0.00001,
    ).length;
    save();
    $(".u4-entry-result").textContent =
      state.diagnostic === 2
        ? "Both checks are correct. Try an independent problem or choose a later stage above. / Ambas respuestas son correctas. Prueba un problema independiente o elige una etapa posterior arriba."
        : "Use the model below, then try a new problem. / Usa el modelo de abajo y después prueba un problema nuevo.";
  });
  $(".u4-test").addEventListener("click", () => {
    state.modelTests += 1;
    save();
    $(".u4-test-result").textContent =
      cfg.read(values()) +
      " — " +
      (challenge
        ? challengeValid(values())
          ? "Your construction meets the stated mathematical condition. Explain why it works. / Tu construcción cumple la condición matemática. Explica por qué funciona."
          : "This construction does not yet meet the challenge condition. Revise the quantities and test again. / Esta construcción todavía no cumple la condición del desafío. Cambia las cantidades y vuelve a probar."
        : "Compare this with your prediction, revise it if needed, and explain why the relationship changes or stays the same. / Compara el resultado con tu predicción, revísala si hace falta y explica por qué cambia o se conserva la relación.");
  });
  $(".u4-independent-check").addEventListener("click", () => {
    const el = $(".u4-independent-answer");
    const n = Number(el.value.trim());
    const feedback = $(".u4-independent-feedback");
    if (challenge && !challengeValid(values())) {
      feedback.textContent =
        "First construct a model that meets the challenge condition, then test it. / Primero construye un modelo que cumpla la condición del desafío y después compruébalo.";
      return;
    }
    if (challenge && !state.explanation.trim()) {
      feedback.textContent =
        "Write your mathematical justification before checking the calculation. A teacher or partner can review your reasoning. / Escribe tu justificación matemática antes de comprobar el cálculo. Un docente o compañero puede revisar tu razonamiento.";
      return;
    }
    if (!el.value.trim() || !Number.isFinite(n)) {
      feedback.textContent = "Enter a number first. / Escribe primero un número.";
      return;
    }
    const current = problem() === cfg.check ? "check" : "transfer";
    const correct = Math.abs(n - target(problem())) < 0.00001;
    if (!correct) {
      state.assisted += 1;
      state.attempts += 1;
      save();
      render();
      feedback.textContent =
        lesson === "5"
          ? "Check whether your answer is the whole: multiply it by the known percent. Then solve the new problem shown above. / Comprueba si tu respuesta es el total: multiplícala por el porcentaje conocido. Después resuelve el nuevo problema."
          : "Use the synchronized model to locate the relationship. Then solve the new problem shown above. / Usa el modelo sincronizado para encontrar la relación. Después resuelve el nuevo problema.";
      el.value = "";
      return;
    }
    if (!state.completed[current]) {
      state.independent += 1;
      if (state.attempts > 0) state.revisions += 1;
      state.completed[current] = true;
    }
    state.attempts = 0;
    save();
    render();
    feedback.textContent = challenge
      ? "The calculation is correct. Use your written explanation to defend why it must work; a teacher or partner can review the reasoning. / El cálculo es correcto. Usa tu explicación para defender por qué funciona; un docente o compañero puede revisar el razonamiento."
      : "The calculation is correct. Your explanation is saved for review. / El cálculo es correcto. Tu explicación se guardó para revisión.";
  });
  render();
})();
