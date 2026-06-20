/* ============================================================
   NEFT CITY: TALE OF TWO NEIGHBORHOODS — Living School simulation
   Chapter 5 · 6.SP measures of variability (range, quartiles, IQR)
   Vanilla JS. No dependencies, no backend, no external APIs.
   All "AI-style" feedback is generated locally from student work.

   Architecture (mirrors Chapter 1):
     CONFIG        — datasets, answers, vocabulary, copy
     state         — single source of truth, persisted to localStorage
     render*()     — paint UI from state
     validate*()   — check student work, return feedback
     score*()      — deterministic local scoring -> city meters
     export/print  — JSON + printable report
     teacher view  — local diagnostic summary
   ============================================================ */

(() => {
  "use strict";

  /* ============================ CONFIG ============================ */
  // Both data sets already sorted, n = 11 each (minutes).
  const HOODS = {
    A: {
      key: "A",
      name: "Northside",
      data: [10, 12, 14, 15, 15, 16, 18, 20, 22, 24, 30],
      // five-number summary
      min: 10, q1: 14, median: 16, q3: 22, max: 30,
      iqr: 8, range: 20,
    },
    B: {
      key: "B",
      name: "Riverbend",
      data: [14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21],
      min: 14, q1: 16, median: 17, q3: 19, max: 21,
      iqr: 3, range: 7,
    },
  };
  const HOOD_KEYS = ["A", "B"];

  // The five-number summary + IQR/range inputs students must find (per hood).
  const STAT_DEFS = [
    { key: "min", nameKey: "sMin" },
    { key: "q1", nameKey: "sQ1" },
    { key: "median", nameKey: "sMedian" },
    { key: "q3", nameKey: "sQ3" },
    { key: "max", nameKey: "sMax" },
    { key: "iqr", nameKey: "sIQR" },
    { key: "range", nameKey: "sRange" },
  ];

  // Shared box-plot scale (minutes). Spans both data sets with margin.
  const SCALE = { min: 8, max: 32, ticks: [8, 12, 16, 20, 24, 28, 32] };

  const BEST_CHOICE = "A"; // Help Northside (most spread out)

  const STEPS = [
    { id: "enter", label: "Enter City", icon: "🚪" },
    { id: "briefing", label: "Briefing", icon: "🏛️" },
    { id: "datalab", label: "Data Lab", icon: "🔬" },
    { id: "graph", label: "Box Plots", icon: "📦" },
    { id: "decision", label: "Decision", icon: "🗳️" },
    { id: "reaction", label: "City", icon: "🌆" },
    { id: "news", label: "News", icon: "📰" },
    { id: "passport", label: "Passport", icon: "🪪" },
  ];

  // Vocabulary is shown bilingually (English + Español) for ESOL learners.
  const VOCAB = [
    { term: "range", es: "rango", def: "The distance from the smallest to the largest value.", ex: "Range = maximum − minimum.", defEs: "La distancia del valor más pequeño al más grande.", exEs: "Rango = máximo − mínimo." },
    { term: "quartile", es: "cuartil", def: "A value that splits sorted data into four equal parts.", ex: "The three quartiles cut the data at 25%, 50%, and 75%.", defEs: "Un valor que divide los datos ordenados en cuatro partes iguales.", exEs: "Los tres cuartiles cortan los datos en 25%, 50% y 75%." },
    { term: "lower quartile (Q1)", es: "cuartil inferior (Q1)", def: "The median of the lower half of the data.", ex: "Q1 is the middle of the smaller 5 values.", defEs: "La mediana de la mitad inferior de los datos.", exEs: "Q1 es el valor del medio de los 5 valores más pequeños." },
    { term: "upper quartile (Q3)", es: "cuartil superior (Q3)", def: "The median of the upper half of the data.", ex: "Q3 is the middle of the larger 5 values.", defEs: "La mediana de la mitad superior de los datos.", exEs: "Q3 es el valor del medio de los 5 valores más grandes." },
    { term: "median", es: "mediana", def: "The middle value after sorting from least to greatest.", ex: "With 11 values, the median is the 6th value.", defEs: "El valor del medio después de ordenar de menor a mayor.", exEs: "Con 11 valores, la mediana es el 6.º valor." },
    { term: "interquartile range (IQR)", es: "rango intercuartílico (IQR)", def: "The spread of the middle half of the data: Q3 − Q1.", ex: "A small IQR means the data is more consistent.", defEs: "La amplitud de la mitad central de los datos: Q3 − Q1.", exEs: "Un IQR pequeño significa que los datos son más consistentes." },
    { term: "box plot", es: "diagrama de caja", def: "A graph that shows the five-number summary: min, Q1, median, Q3, max.", ex: "A shorter box means less spread.", defEs: "Una gráfica que muestra el resumen de cinco números: mín, Q1, mediana, Q3, máx.", exEs: "Una caja más corta significa menos dispersión." },
    { term: "spread / variability", es: "dispersión / variabilidad", def: "How far apart the data values are. More spread = less predictable.", ex: "Range and IQR both measure spread.", defEs: "Qué tan separados están los valores. Más dispersión = menos predecible.", exEs: "El rango y el IQR miden la dispersión." },
    { term: "evidence", es: "evidencia", def: "Proof from your data that supports your idea.", ex: "\"Northside's IQR is 8\" is evidence.", defEs: "Prueba de tus datos que apoya tu idea.", exEs: "\"El IQR de Northside es 8\" es evidencia." },
  ];

  const DECISION_STARTERS = [
    "The data shows ",
    "Northside's IQR is ",
    "Riverbend's IQR is ",
    "I recommend ",
    "One piece of evidence is ",
    "Another piece of evidence is ",
  ];

  const NEWS_WORDS = ["range", "quartile", "median", "IQR", "spread", "variability", "consistent", "box plot", "recommend"];
  const NEWS_FRAMES = [
    "Neft City compared ",
    "The data showed ",
    "The box plots helped us see ",
    "I recommend ",
  ];

  const SKILLS = [
    { key: "quartiles", label: "I can find quartiles." },
    { key: "iqr", label: "I can compute IQR and range." },
    { key: "boxplot", label: "I can build a box plot." },
    { key: "compare", label: "I can compare the spread of two data sets." },
    { key: "recommend", label: "I can recommend with evidence." },
    { key: "revise", label: "I can revise my thinking." },
  ];

  const ROLE_FLAVOR = {
    "Data Analyst": "As our Data Analyst, you'll measure the spread of each neighborhood.",
    "City Planner": "As our City Planner, you'll picture how a fix makes commutes reliable.",
    "News Reporter": "As our News Reporter, you'll explain the spread story to the whole city.",
    "Budget Advisor": "As our Budget Advisor, you'll weigh the cost of helping each neighborhood.",
    "Community Advocate": "As our Community Advocate, you'll speak up for the commuters with the least predictable trips.",
  };

  const ROLE_FLAVOR_ES = {
    "Data Analyst": "Como Analista de Datos, medirás la dispersión de cada vecindario.",
    "City Planner": "Como Planificador de la Ciudad, imaginarás cómo un cambio hace confiables los viajes.",
    "News Reporter": "Como Reportero de Noticias, explicarás la historia de la dispersión a toda la ciudad.",
    "Budget Advisor": "Como Asesor de Presupuesto, pesarás el costo de ayudar a cada vecindario.",
    "Community Advocate": "Como Defensor de la Comunidad, hablarás por los viajeros con los trayectos menos predecibles.",
  };

  const DECISION_STARTERS_ES = [
    "Los datos muestran ",
    "El IQR de Northside es ",
    "El IQR de Riverbend es ",
    "Recomiendo ",
    "Una pieza de evidencia es ",
    "Otra pieza de evidencia es ",
  ];

  const NEWS_FRAMES_ES = [
    "Neft City comparó ",
    "Los datos mostraron ",
    "Los diagramas de caja nos ayudaron a ver ",
    "Recomiendo ",
  ];

  // Optional enrichment: brief MAD (mean absolute deviation) concept.
  // Northside (A) has the larger spread, so it has the larger MAD.
  const MAD = {
    which: "A",
    whichOpts: [
      { key: "A", en: "Northside (more spread)", es: "Northside (más dispersión)" },
      { key: "B", en: "Riverbend (more consistent)", es: "Riverbend (más consistente)" },
      { key: "same", en: "They have the same MAD", es: "Tienen el mismo MAD" },
    ],
  };

  // Spanish strings for static elements tagged with data-i18n / data-i18n-html.
  const I18N_ES = {
    "ui.vocab": "📘 Vocabulario", "ui.back": "← Atrás", "ui.clear": "Borrar",
    "ui.check": "Revisar", "ui.tryit": "Inténtalo",
    "enter.eyebrow": "Living School · Capítulo 5",
    "enter.intro": "Dos vecindarios de Neft City dicen que sus viajes son injustos. Tu equipo comparará la <strong>dispersión</strong> de los tiempos de viaje de cada uno y recomendará a quién ayudar. ¿Listo?",
    "enter.nameLabel": "Primero, dinos tu <strong>nombre</strong>",
    "enter.nameHelp": "Lo usamos en tu reporte final.",
    "enter.roleLegend": "Elige tu <strong>rol</strong> en el equipo de la ciudad",
    "role.analyst": "Te encantan los números y los patrones.",
    "role.planner": "Diseñas cómo funciona la ciudad.",
    "role.reporter": "Cuentas la historia de la ciudad.",
    "role.budget": "Cuidas el dinero de la ciudad.",
    "role.advocate": "Hablas por la gente.",
    "enter.start": "Entrar a Neft City →",
    "briefing.title": "🏛️ Informe de la Misión",
    "briefing.goalsTitle": "🎯 Metas de tu Misión",
    "briefing.goal1": "Halla el <em>resumen de cinco números</em> de cada vecindario.",
    "briefing.goal2": "Calcula el <em>IQR</em> y el <em>rango</em> de cada uno.",
    "briefing.goal3": "Lee los diagramas de caja que muestran cada dispersión.",
    "briefing.goal4": "Decide qué vecindario necesita ayuda.",
    "briefing.goal5": "Explica tu decisión usando <em>evidencia</em>.",
    "briefing.vocabHint": "¿Palabra nueva? Toca una palabra azul para ver qué significa:",
    "briefing.next": "Ir al Laboratorio de Datos →",
    "datalab.title": "🔬 Laboratorio de Datos",
    "datalab.intro": "Los <strong>11 tiempos de viaje</strong> de cada vecindario (en minutos) ya están <strong>ordenados de menor a mayor</strong>. Halla cada resumen de cinco números, luego el IQR y el rango.",
    "datalab.fMedian": "Mediana", "datalab.fMedianD": "valor del medio (6.º de 11)",
    "datalab.fQ1": "Q1 (cuartil inferior)", "datalab.fQ1D": "del medio de los 5 inferiores",
    "datalab.fQ3": "Q3 (cuartil superior)", "datalab.fQ3D": "del medio de los 5 superiores",
    "datalab.fIQR": "IQR y Rango", "datalab.fIQRD": "Q3 − Q1 · máx − mín",
    "datalab.next": "Ver los Diagramas de Caja →",
    "graph.title": "📦 Compara los Diagramas de Caja",
    "graph.lead": "Estos diagramas de caja se construyen con <strong>tus resúmenes de cinco números correctos</strong>. Están en la <strong>misma escala</strong> para que compares la dispersión. Una caja y bigotes más cortos significan viajes más <strong>consistentes</strong>.",
    "graph.interpTitle": "Interpreta la dispersión",
    "graph.checkAnswers": "Revisar Respuestas",
    "graph.next": "Ir a la Sala de Decisiones →",
    "decision.title": "🗳️ Sala de Decisiones",
    "decision.council": "Concejo de la Ciudad",
    "decision.prompt": "¿A qué vecindario debe ayudar Neft City a hacer sus viajes más confiables? Elige una recomendación y explícala con <strong>evidencia</strong> de tus datos.",
    "decision.choiceA": "Ayudar a Northside, porque sus tiempos de viaje son los más dispersos (mayor IQR y rango), así que son los menos predecibles.",
    "decision.choiceB": "Ayudar a Riverbend, porque su mediana es más baja.",
    "decision.choiceC": "No ayudar a ninguno — los dos vecindarios son iguales.",
    "decision.choiceD": "Elegir uno al azar.",
    "decision.explainTitle": "Explica con evidencia",
    "decision.explainHelp": "Usa al menos <strong>dos piezas de evidencia</strong> de tus resúmenes y diagramas de caja. (Al menos 18 palabras.)",
    "decision.submit": "Enviar Recomendación",
    "reaction.title": "🌆 Reacción de la Ciudad",
    "reaction.status": "Estado de la Ciudad",
    "reaction.revise": "← Revisar Decisión",
    "reaction.next": "Escribir el Reporte de Noticias →",
    "mad.summary": "🔬 Reto de Ampliación: Desviación Media Absoluta (opcional)",
    "mad.intro": "El <em>IQR</em> mide la dispersión usando cuartiles. Otra medida de dispersión es la <strong>Desviación Media Absoluta (MAD)</strong> — la distancia promedio de cada valor a la media. Un MAD mayor también significa más dispersión. ¿Qué vecindario predices que tiene el MAD mayor?",
    "mad.whichQ": "¿Qué vecindario tiene el MAD mayor (más dispersión respecto a su media)?",
    "mad.reflectLabel": "¿Cómo lo sabes? Usa palabras de dispersión como IQR o rango. (1 oración)",
    "news.title": "📰 Noticias de Neft City",
    "news.lead": "Escribe un breve reporte público: <strong>3 a 5 oraciones</strong> sobre qué mostraron los datos, qué vecindario es más consistente y qué debe hacer Neft City. (Al menos 35 palabras.)",
    "news.wordbankLabel": "Banco de palabras — toca para agregar",
    "news.framesLabel": "Marcos de oración — toca para agregar",
    "news.checklistTitle": "📋 Lista para revisar mi reporte",
    "news.check1": "Expliqué el problema.",
    "news.check2": "Usé evidencia de los datos (IQR o rango).",
    "news.check3": "Hice una recomendación.",
    "news.check4": "Escribí oraciones completas.",
    "news.submit": "Publicar y Obtener Pasaporte →",
    "passport.title": "🪪 Pasaporte de Aprendizaje",
    "passport.mission": "Misión:",
    "passport.completed": "Completada",
    "passport.skills": "Habilidades demostradas",
    "passport.outcome": "Resultado de la Ciudad:",
    "passport.reflection": "Reflexión",
    "passport.reflect1": "Algo que entiendo mejor ahora es…",
    "passport.reflect2": "Algo que aún quiero practicar es…",
    "passport.export": "Exporta tu trabajo",
    "passport.print": "🖨️ Imprimir / Guardar PDF",
    "passport.download": "⬇️ Descargar JSON",
    "passport.reset": "♻️ Reiniciar Misión",
    "vocab.title": "📘 Ayuda de Vocabulario",
  };

  // Strings generated by JS (need both languages); t() falls back to English.
  const STR = {
    en: {
      startReady: "Ready! Press the button to begin.",
      startAdd: "Add your name and pick a role to begin.",
      locked: "🔒 Locked", unlocked: "🔓 Unlocked",
      check: "Check", tryit: "Try it", solved: "✓ Solved", minutes: "minutes",
      sMin: "Minimum", sQ1: "Q1 (lower quartile)", sMedian: "Median", sQ3: "Q3 (upper quartile)",
      sMax: "Maximum", sIQR: "IQR (Q3 − Q1)", sRange: "Range (max − min)",
      mTrust: "Public Trust", mReliability: "Commute Reliability", mConfidence: "Data Confidence", mExplanation: "Explanation Strength",
      welcome: ", welcome to the team! ", welcomeNoName: "Welcome to the team! ",
      briefBody: "Two neighborhoods — <strong>Northside</strong> and <strong>Riverbend</strong> — both complain about their commute times. We timed <strong>11 commuters</strong> in each one. Your job: compare the <strong>spread</strong> (how consistent each is) and tell us who needs help.",
      skillQuartiles: "I can find quartiles.",
      skillIqr: "I can compute IQR and range.",
      skillBoxplot: "I can build a box plot.",
      skillCompare: "I can compare the spread of two data sets.",
      skillRecommend: "I can recommend with evidence.",
      skillRevise: "I can revise my thinking.",
      outGood: "Your team used strong spread evidence. Neft City launches a reliability program for Northside, and its commutes become more predictable.",
      outMedium: "Your team found useful spread evidence, but the city needs a clearer explanation before funding the full program.",
      outRevise: "The city made a rushed decision and commute complaints continued. Your team must revise the data report.",
      ppApproved: "Reliability program approved 🎉", ppReview: "Decision under review 🤔", ppRevise: "Report sent back for revision ⚠️",
      cmpRange: "Range", cmpIQR: "IQR", cmpMedian: "Median",
      madRight: "✅ Yes! Northside's values stretch from 10 to 30, so they sit farther from the mean — a bigger MAD. Riverbend is bunched up.",
      madWrong: "Look again: which neighborhood has the bigger range and IQR? More spread means a bigger MAD.",
      madDone: "🌟 Enrichment complete! You connected IQR and range to another spread measure, the MAD.",
    },
    es: {
      startReady: "¡Listo! Presiona el botón para comenzar.",
      startAdd: "Agrega tu nombre y elige un rol para comenzar.",
      locked: "🔒 Bloqueado", unlocked: "🔓 Desbloqueado",
      check: "Revisar", tryit: "Inténtalo", solved: "✓ Resuelto", minutes: "minutos",
      sMin: "Mínimo", sQ1: "Q1 (cuartil inferior)", sMedian: "Mediana", sQ3: "Q3 (cuartil superior)",
      sMax: "Máximo", sIQR: "IQR (Q3 − Q1)", sRange: "Rango (máx − mín)",
      mTrust: "Confianza Pública", mReliability: "Confiabilidad del Viaje", mConfidence: "Confianza en Datos", mExplanation: "Fuerza de Explicación",
      welcome: ", ¡bienvenido al equipo! ", welcomeNoName: "¡Bienvenido al equipo! ",
      briefBody: "Dos vecindarios — <strong>Northside</strong> y <strong>Riverbend</strong> — se quejan de sus tiempos de viaje. Medimos a <strong>11 viajeros</strong> en cada uno. Tu trabajo: compara la <strong>dispersión</strong> (qué tan consistente es cada uno) y dinos a quién ayudar.",
      skillQuartiles: "Puedo hallar cuartiles.",
      skillIqr: "Puedo calcular el IQR y el rango.",
      skillBoxplot: "Puedo construir un diagrama de caja.",
      skillCompare: "Puedo comparar la dispersión de dos conjuntos de datos.",
      skillRecommend: "Puedo recomendar con evidencia.",
      skillRevise: "Puedo revisar mi pensamiento.",
      outGood: "Tu equipo usó evidencia sólida de dispersión. Neft City lanza un programa de confiabilidad para Northside y sus viajes se vuelven más predecibles.",
      outMedium: "Tu equipo encontró evidencia útil de dispersión, pero la ciudad necesita una explicación más clara antes de financiar el programa completo.",
      outRevise: "La ciudad tomó una decisión apresurada y las quejas de viaje continuaron. Tu equipo debe revisar el reporte de datos.",
      ppApproved: "Programa de confiabilidad aprobado 🎉", ppReview: "Decisión en revisión 🤔", ppRevise: "Reporte devuelto para revisión ⚠️",
      cmpRange: "Rango", cmpIQR: "IQR", cmpMedian: "Mediana",
      madRight: "✅ ¡Sí! Los valores de Northside van de 10 a 30, así que están más lejos de la media — un MAD mayor. Riverbend está agrupado.",
      madWrong: "Mira otra vez: ¿qué vecindario tiene el rango y el IQR mayores? Más dispersión significa un MAD mayor.",
      madDone: "🌟 ¡Ampliación completa! Conectaste el IQR y el rango con otra medida de dispersión, el MAD.",
    },
  };

  const STORAGE_KEY = "neftcity_twoneighborhoods_v1";

  /* ============================ STATE ============================ */
  const blankStat = () => ({ value: "", attempts: 0, solved: false, hint: false });
  const blankHoodCalc = () => {
    const o = {};
    STAT_DEFS.forEach((d) => (o[d.key] = blankStat()));
    return o;
  };

  const defaultState = () => ({
    name: "",
    role: "",
    lang: "en", // "en" | "es"
    current: "enter",
    maxStep: 0, // highest unlocked step index
    calc: { A: blankHoodCalc(), B: blankHoodCalc() },
    interp: { answers: {}, written: "", solved: false },
    decision: { choice: "", text: "", submitted: false, accepted: false, revisions: 0 },
    news: { text: "", submitted: false },
    reflect: { r1: "", r2: "" },
    meters: { trust: 0, reliability: 0, confidence: 0, explanation: 0 },
    outcomeTier: "", // good | medium | revise
    mad: { which: "", written: "" },
  });

  let state = load() || defaultState();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage may be unavailable */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Deep-merge onto a fresh default so older/partial saves keep every
      // nested key (prevents undefined-property crashes if the schema grows).
      const merge = (target, source) => {
        for (const key in source) {
          const val = source[key];
          if (val && typeof val === "object" && !Array.isArray(val)) {
            if (!target[key] || typeof target[key] !== "object") target[key] = {};
            merge(target[key], val);
          } else {
            target[key] = val;
          }
        }
        return target;
      };
      return merge(defaultState(), parsed);
    } catch (e) { return null; }
  }

  /* ============================ HELPERS ============================ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wordCount = (s) => (s.trim().match(/\S+/g) || []).length;
  const stepIndex = (id) => STEPS.findIndex((s) => s.id === id);

  /* ============================ I18N ============================ */
  const t = (key) => (STR[state.lang] && STR[state.lang][key]) ?? STR.en[key] ?? key;

  const ORIG = new Map(); // captured English text/html for [data-i18n] elements
  function applyLang() {
    const es = state.lang === "es";
    document.documentElement.lang = state.lang;
    $$("[data-i18n], [data-i18n-html]").forEach((el) => {
      const html = el.hasAttribute("data-i18n-html");
      const key = el.getAttribute(html ? "data-i18n-html" : "data-i18n");
      if (!ORIG.has(el)) ORIG.set(el, html ? el.innerHTML : el.textContent);
      const value = es ? (I18N_ES[key] != null ? I18N_ES[key] : ORIG.get(el)) : ORIG.get(el);
      if (html) el.innerHTML = value; else el.textContent = value;
    });
    const langBtn = $("#langBtn");
    if (langBtn) {
      langBtn.textContent = es ? "🌐 English" : "🌐 Español";
      langBtn.setAttribute("aria-label", es ? "Switch to English" : "Cambiar a Español");
    }
    // Repaint JS-generated, language-aware content (all read from state -> idempotent).
    buildVocab();
    renderBriefing();
    renderCalc();
    renderBoxplots();
    renderInterp();
    renderDecisionStarters();
    renderNewsSupports();
    if (state.current === "reaction") renderReaction();
    if (state.current === "passport") renderPassport();
  }

  function toggleLang() {
    state.lang = state.lang === "es" ? "en" : "es";
    save();
    applyLang();
  }

  let toastTimer;
  function toast(msg, type = "") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast" + (type ? " " + type : "");
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => (el.hidden = true), 320);
    }, 2200);
  }

  /* ============================ NAVIGATION ============================ */
  function unlock(stepId) {
    const idx = stepIndex(stepId);
    if (idx > state.maxStep) {
      state.maxStep = idx;
      save();
      renderProgress();
    }
  }

  function go(stepId) {
    const idx = stepIndex(stepId);
    if (idx > state.maxStep) {
      toast("🔒 Finish the current step first!");
      return;
    }
    state.current = stepId;
    save();
    $$(".screen").forEach((s) => {
      const active = s.dataset.screen === stepId;
      s.classList.toggle("is-active", active);
      s.hidden = !active;
    });
    renderProgress();
    if (stepId === "graph") renderBoxplots();
    if (stepId === "reaction") renderReaction();
    if (stepId === "passport") renderPassport();
    $("#main").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProgress() {
    const ol = $("#progressMap");
    ol.innerHTML = "";
    STEPS.forEach((step, i) => {
      const li = document.createElement("li");
      li.className = "progress-step";
      const locked = i > state.maxStep;
      if (locked) li.classList.add("is-locked");
      if (i < state.maxStep) li.classList.add("is-done");
      if (step.id === state.current) li.setAttribute("aria-current", "step");
      li.innerHTML = `<span class="ps-num" aria-hidden="true">${i < state.maxStep ? "✓" : i + 1}</span><span class="ps-label">${step.label}</span>`;
      li.setAttribute("role", "button");
      li.tabIndex = locked ? -1 : 0;
      li.setAttribute("aria-label", `${step.label}${locked ? " (locked)" : ""}`);
      if (!locked) {
        li.addEventListener("click", () => go(step.id));
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(step.id); } });
      }
      ol.appendChild(li);
    });
  }

  /* ============================ 1. ENTER ============================ */
  function initEnter() {
    const nameInput = $("#studentName");
    const startBtn = $("#startBtn");
    const startHelp = $("#startHelp");

    nameInput.value = state.name;

    const refresh = () => {
      const ok = state.name.trim().length > 0 && state.role;
      startBtn.disabled = !ok;
      startHelp.textContent = ok ? t("startReady") : t("startAdd");
    };

    nameInput.addEventListener("input", () => { state.name = nameInput.value; save(); refresh(); });

    $$("#roleGrid .role-card").forEach((btn) => {
      if (btn.dataset.role === state.role) btn.setAttribute("aria-pressed", "true");
      btn.addEventListener("click", () => {
        state.role = btn.dataset.role;
        $$("#roleGrid .role-card").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        save();
        refresh();
      });
    });

    startBtn.addEventListener("click", () => {
      unlock("briefing");
      unlock("datalab"); // briefing is informational; the Data Lab is the first gated task
      renderBriefing();
      go("briefing");
    });

    refresh();
  }

  /* ============================ 2. BRIEFING ============================ */
  function renderBriefing() {
    if (state.maxStep >= stepIndex("briefing")) unlock("datalab"); // keep Data Lab reachable on resume
    const intro = $("#mayorBriefing");
    if (!intro) return;
    const flavorMap = state.lang === "es" ? ROLE_FLAVOR_ES : ROLE_FLAVOR;
    const flavor = flavorMap[state.role] || "";
    const greeting = state.name
      ? `<strong>${escapeHtml(state.name)}</strong>${t("welcome")}`
      : t("welcomeNoName");
    intro.innerHTML = `${greeting}${flavor} ${t("briefBody")}`;

    const wrap = $("#briefingVocab");
    wrap.innerHTML = "";
    VOCAB.forEach((v) => {
      const b = document.createElement("button");
      b.className = "vocab-term";
      b.type = "button";
      b.textContent = state.lang === "es" ? v.es : v.term;
      b.addEventListener("click", () => openVocab(v.term));
      wrap.appendChild(b);
    });
  }

  /* ============================ 3. DATA LAB — FIVE-NUMBER SUMMARIES ============================ */
  // Per-hint copy, language-aware. Built from the hood config so values stay correct.
  function statHint(hoodKey, statKey) {
    const h = HOODS[hoodKey];
    const lower = h.data.slice(0, 5).join(", ");
    const upper = h.data.slice(6).join(", ");
    const es = state.lang === "es";
    switch (statKey) {
      case "min": return es ? `El mínimo es el primer valor ordenado: ${h.data[0]}.` : `The minimum is the first sorted value: ${h.data[0]}.`;
      case "max": return es ? `El máximo es el último valor ordenado: ${h.data[10]}.` : `The maximum is the last sorted value: ${h.data[10]}.`;
      case "median": return es ? `Con 11 valores, la mediana es el 6.º valor: ${h.median}.` : `With 11 values, the median is the 6th value: ${h.median}.`;
      case "q1": return es ? `Q1 es la mediana de los 5 inferiores (${lower}): el del medio es ${h.q1}.` : `Q1 is the median of the lower 5 (${lower}): the middle one is ${h.q1}.`;
      case "q3": return es ? `Q3 es la mediana de los 5 superiores (${upper}): el del medio es ${h.q3}.` : `Q3 is the median of the upper 5 (${upper}): the middle one is ${h.q3}.`;
      case "iqr": return es ? `IQR = Q3 − Q1 = ${h.q3} − ${h.q1} = ${h.iqr}.` : `IQR = Q3 − Q1 = ${h.q3} − ${h.q1} = ${h.iqr}.`;
      case "range": return es ? `Rango = máx − mín = ${h.max} − ${h.min} = ${h.range}.` : `Range = max − min = ${h.max} − ${h.min} = ${h.range}.`;
      default: return "";
    }
  }

  function renderCalc() {
    const grid = $("#hoodGrid");
    if (!grid) return;
    grid.innerHTML = "";
    HOOD_KEYS.forEach((hoodKey) => {
      const h = HOODS[hoodKey];
      const card = document.createElement("div");
      card.className = "hood-card hood-" + hoodKey.toLowerCase();
      const tag = hoodKey === "A" ? "A" : "B";
      card.innerHTML = `
        <h3 class="hood-title">${escapeHtml(h.name)} <span class="hood-tag">${tag}</span></h3>
        <div class="hood-data">${h.data.join(", ")}</div>
        <div class="fivenum-grid" id="fn-${hoodKey}"></div>
      `;
      grid.appendChild(card);

      const fnWrap = $(`#fn-${hoodKey}`, card);
      STAT_DEFS.forEach((def) => {
        const c = state.calc[hoodKey][def.key];
        const row = document.createElement("div");
        row.className = "fivenum-row";
        row.innerHTML = `
          <span class="fn-name">${t(def.nameKey)}</span>
          <input type="text" inputmode="numeric" id="in-${hoodKey}-${def.key}" value="${escapeAttr(c.value)}"
            placeholder="?" aria-label="${escapeAttr(h.name + " " + t(def.nameKey))}" ${c.solved ? "disabled" : ""} />
          <span class="fn-actions">
            <span class="fn-state ${c.solved ? "solved" : ""}" id="st-${hoodKey}-${def.key}">${c.solved ? t("solved") : t("tryit")}</span>
            <button class="btn-primary" type="button" id="ck-${hoodKey}-${def.key}" ${c.solved ? "disabled" : ""}>${t("check")}</button>
            <button class="btn-hint" type="button" id="hn-${hoodKey}-${def.key}">💡</button>
          </span>
          <p class="feedback" id="fb-${hoodKey}-${def.key}" role="status" aria-live="polite"></p>
          <div class="hintcard ${c.hint ? "show" : ""}" id="hc-${hoodKey}-${def.key}">💡 ${statHint(hoodKey, def.key)}</div>
        `;
        fnWrap.appendChild(row);

        $(`#ck-${hoodKey}-${def.key}`).addEventListener("click", () => checkCalc(hoodKey, def.key));
        $(`#in-${hoodKey}-${def.key}`).addEventListener("keydown", (e) => { if (e.key === "Enter") checkCalc(hoodKey, def.key); });
        $(`#in-${hoodKey}-${def.key}`).addEventListener("input", (e) => { state.calc[hoodKey][def.key].value = e.target.value; save(); });
        $(`#hn-${hoodKey}-${def.key}`).addEventListener("click", () => {
          state.calc[hoodKey][def.key].hint = true;
          save();
          $(`#hc-${hoodKey}-${def.key}`).classList.add("show");
        });
        if (c.solved) setFeedback($(`#fb-${hoodKey}-${def.key}`), "ok", "✓");
      });
    });
    refreshDataLabGate();
  }

  function checkCalc(hoodKey, statKey) {
    const c = state.calc[hoodKey][statKey];
    const fb = $(`#fb-${hoodKey}-${statKey}`);
    const raw = $(`#in-${hoodKey}-${statKey}`).value.trim();
    c.value = raw;
    if (raw === "") { setFeedback(fb, "no", state.lang === "es" ? "Escribe tu respuesta primero." : "Type your answer first."); save(); return; }

    const want = HOODS[hoodKey][statKey];
    const v = parseFloat(raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
    const ok = !Number.isNaN(v) && Math.abs(v - want) < 0.001;

    if (ok) {
      c.solved = true;
      save();
      setFeedback(fb, "ok", state.lang === "es" ? "✅ ¡Correcto!" : "✅ Correct!");
      $(`#st-${hoodKey}-${statKey}`).textContent = t("solved");
      $(`#st-${hoodKey}-${statKey}`).classList.add("solved");
      $(`#in-${hoodKey}-${statKey}`).disabled = true;
      $(`#ck-${hoodKey}-${statKey}`).disabled = true;
      awardXp(`${HOODS[hoodKey].name}: ${t(STAT_DEFS.find((d) => d.key === statKey).nameKey)} ✓`);
      refreshDataLabGate();
    } else {
      c.attempts++;
      save();
      const msg = calcMissMessage(hoodKey, statKey, v);
      if (c.attempts >= 2) {
        c.hint = true;
        $(`#hc-${hoodKey}-${statKey}`).classList.add("show");
        setFeedback(fb, "tip", `${msg} ${state.lang === "es" ? "Hay una pista abierta abajo. 💡" : "A hint is now open below. 💡"}`);
      } else {
        setFeedback(fb, "no", msg);
      }
    }
  }

  // Targeted, misconception-aware feedback (generated locally).
  function calcMissMessage(hoodKey, statKey, v) {
    const h = HOODS[hoodKey];
    const es = state.lang === "es";
    if (statKey === "iqr") {
      if (Math.abs(v - (h.q3 + h.q1)) < 0.001) return es ? "El IQR usa resta: Q3 − Q1, no la suma." : "IQR uses subtraction: Q3 − Q1, not addition.";
      if (Math.abs(v - h.range) < 0.001) return es ? "Ese es el rango. El IQR es Q3 − Q1 (la mitad central)." : "That's the range. IQR is Q3 − Q1 (the middle half).";
      return es ? "Aún no. IQR = Q3 − Q1." : "Not yet. IQR = Q3 − Q1.";
    }
    if (statKey === "range") {
      if (Math.abs(v - (h.max + h.min)) < 0.001) return es ? "El rango usa resta: máx − mín." : "Range uses subtraction: max − min.";
      if (Math.abs(v - h.iqr) < 0.001) return es ? "Ese es el IQR. El rango es máx − mín." : "That's the IQR. Range is max − min.";
      return es ? "Aún no. Rango = máx − mín." : "Not yet. Range = max − min.";
    }
    if (statKey === "median") return es ? "Aún no. Con 11 valores, la mediana es el 6.º valor ordenado." : "Not yet. With 11 values, the median is the 6th sorted value.";
    if (statKey === "q1") return es ? "Aún no. Q1 es la mediana de los 5 valores inferiores." : "Not yet. Q1 is the median of the lower 5 values.";
    if (statKey === "q3") return es ? "Aún no. Q3 es la mediana de los 5 valores superiores." : "Not yet. Q3 is the median of the upper 5 values.";
    if (statKey === "min") return es ? "Aún no. El mínimo es el valor más pequeño (el primero)." : "Not yet. The minimum is the smallest value (the first one).";
    if (statKey === "max") return es ? "Aún no. El máximo es el valor más grande (el último)." : "Not yet. The maximum is the largest value (the last one).";
    return es ? "No del todo — inténtalo otra vez." : "Not quite — try again.";
  }

  function allCalcSolved() {
    return HOOD_KEYS.every((k) => STAT_DEFS.every((d) => state.calc[k][d.key].solved));
  }

  function refreshDataLabGate() {
    const done = allCalcSolved();
    const btn = $("#toGraphBtn");
    if (btn) btn.disabled = !done;
    if (done) unlock("graph");
  }

  /* ============================ 4. BOX PLOTS ============================ */
  // Auto-rendered from the (correct) five-number summary once the Data Lab is done.
  function pos(val) {
    // map a minute value to a 0..100% position on the shared scale
    const frac = (val - SCALE.min) / (SCALE.max - SCALE.min);
    return Math.max(0, Math.min(100, frac * 100));
  }

  function renderBoxplots() {
    const wrap = $("#boxplots");
    if (!wrap) return;
    wrap.innerHTML = "";
    const ready = allCalcSolved();

    HOOD_KEYS.forEach((hoodKey) => {
      const h = HOODS[hoodKey];
      const card = document.createElement("div");
      card.className = "boxplot-card" + (ready ? "" : " locked");

      const pMin = pos(h.min), pQ1 = pos(h.q1), pMed = pos(h.median), pQ3 = pos(h.q3), pMax = pos(h.max);

      card.innerHTML = `
        <h4>${escapeHtml(h.name)} <span class="hood-tag" style="background:${hoodKey === "A" ? "#d7f6f2;color:var(--teal-deep)" : "#fdeccf;color:var(--gold-2)"}">${hoodKey}</span></h4>
        <div class="boxplot ${hoodKey === "A" ? "hood-a" : "hood-b"}">
          <div class="bp-axis-line" style="left:${pMin}%;right:${100 - pMax}%"></div>
          <div class="bp-whisker" style="left:${pMin}%"></div>
          <div class="bp-whisker" style="left:${pMax}%"></div>
          <div class="bp-box" style="left:${pQ1}%;width:${pQ3 - pQ1}%"></div>
          <div class="bp-median" style="left:${pMed}%"></div>
          <div class="bp-marker" style="left:${pMin}%"></div>
          <div class="bp-marker" style="left:${pMax}%"></div>
          <div class="bp-label bot" style="left:${pMin}%">min ${h.min}</div>
          <div class="bp-label top" style="left:${pQ1}%">Q1 ${h.q1}</div>
          <div class="bp-label med top" style="left:${pMed}%">med ${h.median}</div>
          <div class="bp-label top" style="left:${pQ3}%">Q3 ${h.q3}</div>
          <div class="bp-label bot" style="left:${pMax}%">max ${h.max}</div>
        </div>
        <div class="bp-scale">${SCALE.ticks.map((tk) => `<span class="bp-tick" style="left:${pos(tk)}%">${tk}</span>`).join("")}</div>
        <p class="bp-scale-label">${t("minutes")}</p>
      `;
      wrap.appendChild(card);
    });

    renderComparePanel(ready);
    renderInterp();
  }

  function renderComparePanel(ready) {
    const panel = $("#comparePanel");
    if (!panel) return;
    panel.innerHTML = "";
    if (!ready) return;
    const stats = [
      { label: t("cmpRange"), a: HOODS.A.range, b: HOODS.B.range },
      { label: t("cmpIQR"), a: HOODS.A.iqr, b: HOODS.B.iqr },
      { label: t("cmpMedian"), a: HOODS.A.median, b: HOODS.B.median },
    ];
    stats.forEach((s) => {
      const div = document.createElement("div");
      div.className = "compare-stat";
      div.innerHTML = `<div class="cs-label">${s.label}</div>
        <div class="cs-vals"><span class="cs-a">A: ${s.a}</span> · <span class="cs-b">B: ${s.b}</span></div>`;
      panel.appendChild(div);
    });
  }

  /* ---- interpretation (gated MC + written) ---- */
  function interpDefs() {
    const es = state.lang === "es";
    return [
      {
        id: "consistent",
        q: es ? "¿Qué vecindario es más consistente (menos disperso)?" : "Which neighborhood is more consistent (less spread out)?",
        opts: ["Northside", "Riverbend", es ? "Son iguales" : "They are the same"],
        answer: "Riverbend",
      },
      {
        id: "biggeriqr",
        q: es ? "¿Qué vecindario tiene el IQR mayor?" : "Which neighborhood has the bigger IQR?",
        opts: ["Northside", "Riverbend", es ? "Son iguales" : "They are the same"],
        answer: "Northside",
      },
      {
        id: "smalliqr",
        q: es ? "¿Qué nos dice un IQR pequeño?" : "What does a small IQR tell us?",
        opts: [
          es ? "Los datos están más juntos / son más predecibles" : "The data is closer together / more predictable",
          es ? "Los datos están más dispersos" : "The data is more spread out",
          es ? "El promedio es mayor" : "The average is higher",
        ],
        answer: es ? "Los datos están más juntos / son más predecibles" : "The data is closer together / more predictable",
      },
    ];
  }

  function renderInterp() {
    const wrap = $("#interpQuestions");
    if (!wrap) return;
    const defs = interpDefs();
    wrap.innerHTML = "";
    defs.forEach((q) => {
      const div = document.createElement("div");
      div.className = "interp-q";
      div.innerHTML = `<p>${q.q}</p><div class="opt-row" id="opts-${q.id}"></div>`;
      wrap.appendChild(div);
      const optWrap = $(`#opts-${q.id}`, div);
      q.opts.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.type = "button";
        b.textContent = opt;
        b.dataset.val = opt;
        b.setAttribute("aria-pressed", String(state.interp.answers[q.id] === opt));
        b.addEventListener("click", () => {
          state.interp.answers[q.id] = opt;
          $$(`#opts-${q.id} .opt`).forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
          save();
        });
        optWrap.appendChild(b);
      });
    });
    // short written response
    const writeDiv = document.createElement("div");
    writeDiv.className = "interp-q";
    const prompt = state.lang === "es"
      ? "En una oración: ¿cómo te ayudan los diagramas de caja a comparar la dispersión? (respuesta escrita)"
      : "In one sentence: how do the box plots help you compare the spread? (written response)";
    writeDiv.innerHTML = `<p>${prompt}</p>`;
    const ta = document.createElement("textarea");
    ta.className = "writebox";
    ta.rows = 2;
    ta.id = "interpWritten";
    ta.placeholder = state.lang === "es" ? "Escribe una oración sobre la dispersión…" : "Type one sentence about the spread…";
    ta.value = state.interp.written;
    ta.addEventListener("input", (e) => { state.interp.written = e.target.value; save(); });
    writeDiv.appendChild(ta);
    wrap.appendChild(writeDiv);

    if (state.interp.solved) $("#toDecisionBtn").disabled = false;
  }

  function checkInterp() {
    const fb = $("#interpFeedback");
    const defs = interpDefs();
    let correctCount = 0;
    defs.forEach((q) => {
      const picked = state.interp.answers[q.id];
      const right = picked === q.answer;
      if (right) correctCount++;
      $$(`#opts-${q.id} .opt`).forEach((o) => {
        o.classList.remove("correct", "wrong");
        if (o.dataset.val === picked) o.classList.add(right ? "correct" : "wrong");
        if (o.dataset.val === q.answer) o.classList.add("correct");
      });
    });
    const written = wordCount(state.interp.written) >= 3;
    if (correctCount === defs.length && written) {
      state.interp.solved = true;
      save();
      setFeedback(fb, "ok", state.lang === "es" ? "✅ ¡Gran lectura de la dispersión! La Sala de Decisiones está abierta." : "✅ Great reading of the spread! The Decision Room is open.");
      $("#toDecisionBtn").disabled = false;
      unlock("decision");
      awardXp("Spread interpreted!");
    } else {
      let msg = state.lang === "es"
        ? `Tienes ${correctCount} de ${defs.length} respuestas de opción múltiple correctas.`
        : `You have ${correctCount} of ${defs.length} multiple-choice answers correct.`;
      if (!written) msg += state.lang === "es" ? " También escribe al menos una oración completa." : " Also write at least one full sentence in the response box.";
      else msg += state.lang === "es" ? " Mira las respuestas resaltadas e inténtalo otra vez." : " Look at the highlighted answers and try again.";
      setFeedback(fb, "no", msg);
    }
  }

  /* ============================ 5. DECISION ============================ */
  function initDecision() {
    $$("#decisionChoices .choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.decision.choice = btn.dataset.choice;
        $$("#decisionChoices .choice").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        save();
      });
    });

    renderDecisionStarters();

    const ta = $("#decisionText");
    ta.addEventListener("input", () => {
      state.decision.text = ta.value;
      updateCount("#decisionCount", ta.value, 18);
      save();
    });

    $("#submitDecisionBtn").addEventListener("click", submitDecision);
  }

  function renderDecisionStarters() {
    const wrap = $("#decisionStarters");
    if (!wrap) return;
    wrap.innerHTML = "";
    const starters = state.lang === "es" ? DECISION_STARTERS_ES : DECISION_STARTERS;
    starters.forEach((s) => {
      const b = document.createElement("button");
      b.className = "starter";
      b.type = "button";
      b.textContent = s.trim() + "…";
      b.addEventListener("click", () => insertText("#decisionText", s, "decision", "text"));
      wrap.appendChild(b);
    });
  }

  function renderDecision() {
    $$("#decisionChoices .choice").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.choice === state.decision.choice))
    );
    $("#decisionText").value = state.decision.text;
    updateCount("#decisionCount", state.decision.text, 18);
  }

  function submitDecision() {
    const fb = $("#decisionFeedback");
    const wc = wordCount(state.decision.text);
    if (!state.decision.choice) { setFeedback(fb, "no", state.lang === "es" ? "Elige una recomendación (A, B, C o D) primero." : "Pick a recommendation (A, B, C, or D) first."); return; }
    if (wc < 18) { setFeedback(fb, "no", (state.lang === "es" ? `Escribe al menos 18 palabras de evidencia. Tienes ${wc}.` : `Write at least 18 words of evidence. You have ${wc}.`)); return; }

    state.decision.submitted = true;

    if (state.decision.choice === BEST_CHOICE) {
      state.decision.accepted = true;
      save();
      setFeedback(fb, "ok", state.lang === "es" ? "✅ ¡El concejo está convencido! Yendo a la Reacción de la Ciudad…" : "✅ The city council is convinced! Heading to City Reaction…");
      computeScore();
      unlock("reaction");
      awardXp("Recommendation accepted!");
      setTimeout(() => go("reaction"), 700);
    } else {
      state.decision.accepted = false;
      state.decision.revisions++;
      save();
      setFeedback(fb, "no", state.lang === "es"
        ? "🏛️ El concejo no está convencido aún. Mira la dispersión otra vez y revisa. (Pista: el IQR y el rango mayores muestran los viajes menos predecibles.)"
        : "🏛️ The city council is not convinced yet. Look back at the spread and revise your recommendation. (Hint: the bigger IQR and range show the least predictable commutes.)");
      computeScore();
      unlock("reaction");
      awardXp("Revision needed");
      setTimeout(() => go("reaction"), 900);
    }
  }

  /* ============================ 6. CITY REACTION + SCORING ============================ */
  // Deterministic local scoring -> four 0..100 meters.
  function computeScore() {
    const solvedStats = HOOD_KEYS.reduce((acc, k) => acc + STAT_DEFS.filter((d) => state.calc[k][d.key].solved).length, 0);
    const totalStats = HOOD_KEYS.length * STAT_DEFS.length; // 14
    const totalAttempts = HOOD_KEYS.reduce((acc, k) => acc + STAT_DEFS.reduce((a, d) => a + state.calc[k][d.key].attempts, 0), 0);
    const decWords = wordCount(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;

    // Data Confidence: summaries + interpretation
    let confidence = (solvedStats / totalStats) * 70;
    if (state.interp.solved) confidence += 30;
    confidence -= Math.min(20, totalAttempts * 1.5); // penalize many misses
    confidence = clamp(confidence);

    // Explanation Strength: words + evidence keywords + correctness
    const evidenceHits = countEvidence(state.decision.text);
    let explanation = Math.min(50, decWords * 1.5) + evidenceHits * 10;
    if (acceptedBest) explanation += 15;
    explanation = clamp(explanation);

    // Public Trust: best decision + strong explanation, minus revisions
    let trust = (acceptedBest ? 55 : 20) + Math.round(explanation * 0.3) - state.decision.revisions * 8;
    trust = clamp(trust);

    // Commute Reliability (higher = better plan to make commutes reliable)
    let reliability = acceptedBest ? 70 : 30;
    if (state.interp.solved) reliability += 15;
    if (acceptedBest && evidenceHits >= 2) reliability += 15;
    reliability = clamp(reliability);

    state.meters = {
      trust: Math.round(trust),
      reliability: Math.round(reliability),
      confidence: Math.round(confidence),
      explanation: Math.round(explanation),
    };

    if (!acceptedBest) {
      state.outcomeTier = "revise";
    } else if (state.meters.explanation >= 65 && evidenceHits >= 2 && state.meters.confidence >= 70) {
      state.outcomeTier = "good";
    } else {
      state.outcomeTier = "medium";
    }
    save();
  }

  // countEvidence keywords: IQR, range, quartile, median, spread, consistent, variability, 8, 20, box plot.
  function countEvidence(text) {
    const s = text.toLowerCase();
    let hits = 0;
    [
      /\biqr\b|interquartile/,
      /\brange\b|rango/,
      /quartile|cuartil|\bq1\b|\bq3\b/,
      /median|mediana/,
      /spread|disper/,
      /consistent|consisten/,
      /variability|variabilidad/,
      /\b8\b/,
      /\b20\b/,
      /box plot|box-and-whisker|diagrama de caja|caja/,
    ].forEach((re) => { if (re.test(s)) hits++; });
    return hits;
  }

  const OUTCOME_COPY = {
    good: { icon: "🎉", cls: "good", key: "outGood" },
    medium: { icon: "🤔", cls: "medium", key: "outMedium" },
    revise: { icon: "⚠️", cls: "revise", key: "outRevise" },
  };

  function renderReaction() {
    computeScore();
    const tier = state.outcomeTier || "medium";
    const copy = OUTCOME_COPY[tier];
    const banner = $("#outcomeBanner");
    banner.className = "outcome-banner " + copy.cls;
    $("#outcomeIcon").textContent = copy.icon;
    $("#outcomeStory").textContent = t(copy.key);

    const meters = [
      { name: t("mTrust"), val: state.meters.trust },
      { name: t("mReliability"), val: state.meters.reliability },
      { name: t("mConfidence"), val: state.meters.confidence },
      { name: t("mExplanation"), val: state.meters.explanation },
    ];
    const wrap = $("#meters");
    wrap.innerHTML = "";
    meters.forEach((m) => {
      const div = document.createElement("div");
      div.className = "meter";
      div.innerHTML = `
        <div class="meter-top"><span class="meter-name">${m.name}</span><span class="meter-val">${m.val}</span></div>
        <div class="meter-bar"><div class="meter-fill"></div></div>`;
      wrap.appendChild(div);
      requestAnimationFrame(() => { $(".meter-fill", div).style.width = m.val + "%"; });
    });

    if (state.decision.accepted) unlock("news");

    renderMad();
  }

  /* ---- Enrichment: MAD concept ---- */
  function renderMad() {
    const opts = $("#madOpts");
    if (!opts) return;
    opts.innerHTML = "";
    MAD.whichOpts.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      b.textContent = state.lang === "es" ? opt.es : opt.en;
      b.setAttribute("aria-pressed", String(state.mad.which === opt.key));
      if (state.mad.which === opt.key) b.classList.add(opt.key === MAD.which ? "correct" : "wrong");
      b.addEventListener("click", () => {
        state.mad.which = opt.key;
        save();
        const right = opt.key === MAD.which;
        setFeedback($("#fb-madwhich"), right ? "ok" : "no", right ? t("madRight") : t("madWrong"));
        renderMad();
        maybeMadDone();
      });
      opts.appendChild(b);
    });
    const w = $("#madWritten");
    if (w) w.value = state.mad.written;
    maybeMadDone();
  }

  function maybeMadDone() {
    if (state.mad.which === MAD.which && wordCount(state.mad.written) >= 3) {
      setFeedback($("#madDone"), "ok", t("madDone"));
    }
  }

  function initMad() {
    const w = $("#madWritten");
    if (w) w.addEventListener("input", (e) => { state.mad.written = e.target.value; save(); maybeMadDone(); });
  }

  /* ============================ 7. NEWS ============================ */
  function renderNewsSupports() {
    const bank = $("#newsWordbank");
    if (bank) {
      bank.innerHTML = "";
      NEWS_WORDS.forEach((w) => {
        const b = document.createElement("button");
        b.className = "word-chip";
        b.type = "button";
        b.textContent = w;
        b.addEventListener("click", () => insertText("#newsText", w + " ", "news", "text"));
        bank.appendChild(b);
      });
    }
    const frames = $("#newsStarters");
    if (frames) {
      frames.innerHTML = "";
      const list = state.lang === "es" ? NEWS_FRAMES_ES : NEWS_FRAMES;
      list.forEach((f) => {
        const b = document.createElement("button");
        b.className = "starter";
        b.type = "button";
        b.textContent = f.trim() + "…";
        b.addEventListener("click", () => insertText("#newsText", f, "news", "text"));
        frames.appendChild(b);
      });
    }
  }

  function initNews() {
    renderNewsSupports();
    const ta = $("#newsText");
    ta.addEventListener("input", () => {
      state.news.text = ta.value;
      updateCount("#newsCount", ta.value, 35);
      save();
    });
    $("#submitNewsBtn").addEventListener("click", submitNews);
  }

  function renderNews() {
    $("#newsText").value = state.news.text;
    updateCount("#newsCount", state.news.text, 35);
  }

  function submitNews() {
    const fb = $("#newsFeedback");
    const wc = wordCount(state.news.text);
    if (wc < 35) { setFeedback(fb, "no", (state.lang === "es" ? `Escribe al menos 35 palabras. Tienes ${wc}.` : `Write at least 35 words. You have ${wc}.`)); return; }
    state.news.submitted = true;
    save();
    setFeedback(fb, "ok", state.lang === "es" ? "✅ ¡Publicado! Generando tu Pasaporte de Aprendizaje…" : "✅ Published! Generating your Proof-of-Learning Passport…");
    unlock("passport");
    awardXp("News published!");
    setTimeout(() => go("passport"), 700);
  }

  /* ============================ 8. PASSPORT ============================ */
  function skillsEarned() {
    const recommendEarned = state.decision.accepted && countEvidence(state.decision.text) >= 2;
    return {
      quartiles: HOOD_KEYS.every((k) => ["q1", "median", "q3"].every((s) => state.calc[k][s].solved)),
      iqr: HOOD_KEYS.every((k) => ["iqr", "range"].every((s) => state.calc[k][s].solved)),
      boxplot: allCalcSolved(),
      compare: state.interp.solved,
      recommend: recommendEarned,
      revise: state.decision.revisions > 0 || state.decision.accepted,
    };
  }

  function renderPassport() {
    $("#ppName").textContent = state.name || "Student";
    $("#ppRole").textContent = state.role || "City Team";
    const tier = state.outcomeTier || "medium";
    $("#ppOutcome").textContent = tier === "good" ? t("ppApproved")
      : tier === "medium" ? t("ppReview") : t("ppRevise");

    const earned = skillsEarned();
    const list = $("#ppSkills");
    list.innerHTML = "";
    SKILLS.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = t("skill" + s.key.charAt(0).toUpperCase() + s.key.slice(1));
      if (!earned[s.key]) li.classList.add("not-yet");
      list.appendChild(li);
    });

    $("#reflect1").value = state.reflect.r1;
    $("#reflect2").value = state.reflect.r2;
  }

  function initPassport() {
    $("#reflect1").addEventListener("input", (e) => { state.reflect.r1 = e.target.value; save(); });
    $("#reflect2").addEventListener("input", (e) => { state.reflect.r2 = e.target.value; save(); });
    $("#printBtn").addEventListener("click", printReport);
    $("#downloadBtn").addEventListener("click", downloadJSON);
    $("#resetBtn").addEventListener("click", resetMission);
  }

  /* ============================ 9. EXPORT / PRINT ============================ */
  function summaryLine(hoodKey) {
    const c = state.calc[hoodKey];
    return STAT_DEFS.map((d) => `${t(d.nameKey)}: ${escapeHtml(c[d.key].value || "—")}`).join(" · ");
  }

  function buildPrintHTML() {
    const m = state.meters;
    const tier = state.outcomeTier || "medium";
    const outcome = tier === "good" ? "Reliability program approved" : tier === "medium" ? "Decision under review" : "Report sent back for revision";
    const earned = skillsEarned();
    const skillRows = SKILLS.map((s) => `<li>${earned[s.key] ? "☑" : "☐"} ${s.label}</li>`).join("");
    return `
      <h1>Neft City: Tale of Two Neighborhoods — Proof of Learning</h1>
      <div class="pr-grid">
        <div class="pr-row"><b>Name:</b> ${escapeHtml(state.name || "—")}</div>
        <div class="pr-row"><b>Role:</b> ${escapeHtml(state.role || "—")}</div>
        <div class="pr-row"><b>Mission:</b> Tale of Two Neighborhoods</div>
        <div class="pr-row"><b>City Outcome:</b> ${outcome}</div>
      </div>

      <h2>${escapeHtml(HOODS.A.name)} (A) data</h2>
      <div class="pr-row">${HOODS.A.data.join(", ")}</div>
      <div class="pr-row">${summaryLine("A")}</div>

      <h2>${escapeHtml(HOODS.B.name)} (B) data</h2>
      <div class="pr-row">${HOODS.B.data.join(", ")}</div>
      <div class="pr-row">${summaryLine("B")}</div>

      <h2>Recommendation</h2>
      <div class="pr-row"><b>Choice:</b> ${state.decision.choice || "—"}</div>
      <div class="pr-row"><b>Explanation:</b> ${escapeHtml(state.decision.text || "—")}</div>

      <h2>News Report</h2>
      <div class="pr-row">${escapeHtml(state.news.text || "—")}</div>

      <h2>Reflection</h2>
      <div class="pr-row"><b>I understand better:</b> ${escapeHtml(state.reflect.r1 || "—")}</div>
      <div class="pr-row"><b>I want to practice:</b> ${escapeHtml(state.reflect.r2 || "—")}</div>

      <h2>Skill Checklist</h2>
      <ul>${skillRows}</ul>

      <h2>City Status</h2>
      <div class="pr-row">Public Trust: ${m.trust} &nbsp;·&nbsp; Commute Reliability: ${m.reliability} &nbsp;·&nbsp; Data Confidence: ${m.confidence} &nbsp;·&nbsp; Explanation: ${m.explanation}</div>
    `;
  }

  function printReport() {
    $("#printReport").innerHTML = buildPrintHTML();
    window.print();
  }

  function downloadJSON() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (state.name || "student").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    a.href = url;
    a.download = `neft-city-two-neighborhoods_${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast("⬇️ Progress downloaded");
  }

  function resetMission() {
    if (!confirm("Reset the whole mission? This clears all your work on this device.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = defaultState();
    save();
    location.reload();
  }

  /* ============================ 10. TEACHER VIEW ============================ */
  function buildTeacherHTML() {
    const solvedA = STAT_DEFS.filter((d) => state.calc.A[d.key].solved).length;
    const solvedB = STAT_DEFS.filter((d) => state.calc.B[d.key].solved).length;
    const attemptsA = STAT_DEFS.reduce((a, d) => a + state.calc.A[d.key].attempts, 0);
    const attemptsB = STAT_DEFS.reduce((a, d) => a + state.calc.B[d.key].attempts, 0);
    const totalAttempts = attemptsA + attemptsB;
    const decWords = wordCount(state.decision.text);
    const newsWords = wordCount(state.news.text);
    const evidenceHits = countEvidence(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;

    const pill = (ok, warn) => ok ? `<span class="t-pill good">strong</span>` : warn ? `<span class="t-pill warn">developing</span>` : `<span class="t-pill bad">not yet</span>`;

    // misconception detection (local)
    const misconceptions = [];
    HOOD_KEYS.forEach((k) => {
      const c = state.calc[k];
      const nm = HOODS[k].name;
      if (c.iqr.attempts >= 2 && !c.iqr.solved) misconceptions.push(`${nm} IQR: may be adding Q3 + Q1 instead of subtracting, or confusing it with range.`);
      if (c.range.attempts >= 2 && !c.range.solved) misconceptions.push(`${nm} Range: may be confusing range with IQR, or adding instead of subtracting.`);
      if ((c.q1.attempts >= 2 && !c.q1.solved) || (c.q3.attempts >= 2 && !c.q3.solved)) misconceptions.push(`${nm} Quartiles: may not be splitting the data into a lower and upper half correctly.`);
      if (c.median.attempts >= 2 && !c.median.solved) misconceptions.push(`${nm} Median: may not be picking the 6th of 11 sorted values.`);
    });
    if (!misconceptions.length) misconceptions.push("None detected so far.");

    let recQuality, recPill;
    if (acceptedBest && evidenceHits >= 2 && decWords >= 18) { recQuality = "Strong — best choice (help Northside) with 2+ pieces of spread evidence."; recPill = `<span class="t-pill good">strong</span>`; }
    else if (acceptedBest) { recQuality = "On track — best choice, evidence could be richer (cite IQR=8 vs 3)."; recPill = `<span class="t-pill warn">developing</span>`; }
    else if (state.decision.submitted) { recQuality = "Needs revision — not yet the best-supported choice."; recPill = `<span class="t-pill bad">revise</span>`; }
    else { recQuality = "Not submitted yet."; recPill = `<span class="t-pill warn">pending</span>`; }

    let nextMove;
    if ((state.calc.A.iqr.attempts >= 2 && !state.calc.A.iqr.solved) || (state.calc.B.iqr.attempts >= 2 && !state.calc.B.iqr.solved))
      nextMove = "Review IQR: remind student IQR = Q3 − Q1 (the spread of the middle half), not Q3 + Q1.";
    else if ((state.calc.A.q1.attempts >= 2 && !state.calc.A.q1.solved) || (state.calc.A.q3.attempts >= 2 && !state.calc.A.q3.solved))
      nextMove = "Review quartiles: practice splitting an 11-value set into a lower 5 and upper 5 around the median.";
    else if (acceptedBest && evidenceHits < 2)
      nextMove = "Student can compute but needs support explaining with evidence. Use sentence frames and cite the numbers (IQR 8 vs 3, range 20 vs 7).";
    else if (allCalcSolved() && state.interp.solved && acceptedBest && evidenceHits >= 2)
      nextMove = "Student is ready for enrichment: discuss Mean Absolute Deviation (MAD) as another spread measure.";
    else
      nextMove = "Continue mission; check in during the Decision Room for evidence quality.";

    return `
      <div class="teacher-section">
        <h3>Student</h3>
        <div class="tstat"><span>Name</span><b>${escapeHtml(state.name || "—")}</b></div>
        <div class="tstat"><span>Role</span><b>${escapeHtml(state.role || "—")}</b></div>
        <div class="tstat"><span>Current step</span><b>${state.current}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Score by Skill</h3>
        <div class="tstat"><span>${escapeHtml(HOODS.A.name)} summary (${solvedA}/7)</span>${pill(solvedA === 7, solvedA >= 4)}</div>
        <div class="tstat"><span>${escapeHtml(HOODS.B.name)} summary (${solvedB}/7)</span>${pill(solvedB === 7, solvedB >= 4)}</div>
        <div class="tstat"><span>Interpretation (spread)</span>${pill(state.interp.solved, false)}</div>
        <div class="tstat"><span>Recommendation</span>${recPill}</div>
      </div>

      <div class="teacher-section">
        <h3>Attempts (misses)</h3>
        <div class="tstat"><span>${escapeHtml(HOODS.A.name)} misses</span><b>${attemptsA}</b></div>
        <div class="tstat"><span>${escapeHtml(HOODS.B.name)} misses</span><b>${attemptsB}</b></div>
        <div class="tstat"><span>Total misses</span><b>${totalAttempts}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Answer Key</h3>
        <div class="tstat"><span>${escapeHtml(HOODS.A.name)} (A)</span><b>min 10 · Q1 14 · med 16 · Q3 22 · max 30 · IQR 8 · range 20</b></div>
        <div class="tstat"><span>${escapeHtml(HOODS.B.name)} (B)</span><b>min 14 · Q1 16 · med 17 · Q3 19 · max 21 · IQR 3 · range 7</b></div>
        <div class="tstat"><span>Best choice</span><b>A — help Northside (most spread out)</b></div>
      </div>

      <div class="teacher-section">
        <h3>Misconceptions Detected</h3>
        <ul>${misconceptions.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>
      </div>

      <div class="teacher-section">
        <h3>Writing</h3>
        <div class="tstat"><span>Explanation words</span><b>${decWords}</b></div>
        <div class="tstat"><span>Evidence signals</span><b>${evidenceHits}</b></div>
        <div class="tstat"><span>News report words</span><b>${newsWords}</b></div>
        <div class="tstat"><span>Revisions</span><b>${state.decision.revisions}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Recommendation Quality</h3>
        <p>${recQuality}</p>
      </div>

      <div class="teacher-section">
        <h3>Suggested Teacher Next Move</h3>
        <div class="next-move">${nextMove}</div>
      </div>
    `;
  }

  function openTeacher() {
    $("#teacherBody").innerHTML = buildTeacherHTML();
    showModal("#teacherModal");
  }

  /* ============================ VOCAB MODAL ============================ */
  function buildVocab() {
    const list = $("#vocabList");
    list.innerHTML = "";
    VOCAB.forEach((v) => {
      const div = document.createElement("div");
      div.className = "vocab-item";
      div.id = "vocab-" + vocabSlug(v.term);
      div.innerHTML =
        `<h3>${escapeHtml(v.term)} <span class="vi-es">· ${escapeHtml(v.es)}</span></h3>` +
        `<p>${escapeHtml(v.def)}</p><p class="vi-ex">Example: ${escapeHtml(v.ex)}</p>` +
        `<p class="vi-trans"><strong>${escapeHtml(v.es)}:</strong> ${escapeHtml(v.defEs)}</p><p class="vi-ex">Ejemplo: ${escapeHtml(v.exEs)}</p>`;
      list.appendChild(div);
    });
  }
  function vocabSlug(term) { return term.replace(/[^a-z0-9]/gi, "_").toLowerCase(); }
  function openVocab(term) {
    showModal("#vocabModal");
    if (term) {
      const el = $("#vocab-" + vocabSlug(term));
      if (el) { el.scrollIntoView({ block: "center" }); el.style.outline = "3px solid var(--gold-1)"; setTimeout(() => (el.style.outline = ""), 1500); }
    }
  }

  /* ============================ MODAL PLUMBING ============================ */
  let lastFocus = null;
  function showModal(sel) {
    lastFocus = document.activeElement;
    const m = $(sel);
    m.hidden = false;
    const closeBtn = $(".modal-close", m);
    if (closeBtn) closeBtn.focus();
  }
  function hideModal(sel) {
    $(sel).hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  /* ============================ SHARED UI HELPERS ============================ */
  function setFeedback(el, kind, msg) {
    if (!el) return;
    el.className = "feedback " + kind;
    el.textContent = msg;
  }
  function updateCount(sel, text, min) {
    const el = $(sel);
    if (!el) return;
    const n = wordCount(text);
    const wordsLabel = state.lang === "es" ? "palabras" : "words";
    const needLabel = state.lang === "es" ? `(faltan ${min})` : `(need ${min})`;
    el.textContent = `${n} ${wordsLabel}` + (n >= min ? " ✓" : ` ${needLabel}`);
    el.classList.toggle("ok", n >= min);
  }
  function insertText(taSel, snippet, stateKey, field) {
    const ta = $(taSel);
    const start = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(ta.selectionEnd ?? start);
    const sep = before && !/\s$/.test(before) ? " " : "";
    ta.value = before + sep + snippet + after;
    const pos2 = (before + sep + snippet).length;
    ta.focus();
    ta.setSelectionRange(pos2, pos2);
    state[stateKey][field] = ta.value;
    save();
    if (stateKey === "decision") updateCount("#decisionCount", ta.value, 18);
    if (stateKey === "news") updateCount("#newsCount", ta.value, 35);
  }
  function awardXp(label) { toast("⭐ " + label, "xp"); }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ============================ GLOBAL WIRING ============================ */
  function wireNavButtons() {
    $$("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        if (target === "briefing") renderBriefing();
        if (target === "datalab") renderCalc();
        if (target === "graph") renderBoxplots();
        if (target === "decision") renderDecision();
        if (target === "news") renderNews();
        go(target);
      });
    });
  }

  function init() {
    renderProgress();
    buildVocab();
    initEnter();
    wireNavButtons();

    // graph / interpretation
    $("#checkInterpBtn").addEventListener("click", checkInterp);

    // decision / news / passport / enrichment
    initDecision();
    initNews();
    initPassport();
    initMad();

    // language toggle
    $("#langBtn").addEventListener("click", toggleLang);

    // modals
    $("#vocabOpenBtn").addEventListener("click", () => openVocab());
    $("#vocabClose").addEventListener("click", () => hideModal("#vocabModal"));
    $("#teacherBtn").addEventListener("click", openTeacher);
    $("#teacherClose").addEventListener("click", () => hideModal("#teacherModal"));
    $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) hideModal("#" + m.id); }));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") $$(".modal").forEach((m) => { if (!m.hidden) hideModal("#" + m.id); });
      if (e.shiftKey && (e.key === "T" || e.key === "t") && !/input|textarea/i.test(document.activeElement.tagName)) openTeacher();
    });

    // build dynamic content for current screen + restore
    renderBriefing();
    renderCalc();
    renderBoxplots();
    renderDecision();
    renderNews();

    // apply saved language to all static + dynamic content
    applyLang();

    // resume on last screen
    go(state.current || "enter");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
