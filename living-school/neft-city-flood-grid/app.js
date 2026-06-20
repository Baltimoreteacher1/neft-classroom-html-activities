/* ============================================================
   NEFT CITY: FLOOD GRID — Living School simulation (Chapter 4)
   Vanilla JS. No dependencies, no backend, no external APIs.
   All "AI-style" feedback is generated locally from student work.

   Standards: 6.NS — integers & ordering; 6.NS — coordinate plane,
   reflections across an axis, and distance via absolute value.

   Architecture (mirrors Chapter 1 exactly):
     CONFIG        — dataset, answers, vocabulary, copy
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
  // Eight sensor elevations in meters relative to sea level (negative = below).
  const DATASET = [-5, 3, -2, 0, 7, -8, 4, -1];
  const SORTED = [...DATASET].sort((a, b) => a - b); // -8,-5,-2,-1,0,3,4,7

  const LOWEST = -8;  // deepest below sea level
  const HIGHEST = 7;  // highest above sea level

  const BEST_CHOICE = "A";

  // Coordinate plane spans x=-5..5, y=-5..5.
  const GRID = { min: -5, max: 5 };

  // Four sensors to plot on the grid.
  const SENSORS = [
    { id: "S1", x: 3, y: 2 },
    { id: "S2", x: -4, y: 1 },
    { id: "S3", x: -2, y: -3 },
    { id: "S4", x: 5, y: -2 },
  ];

  // Reflect/distance answer key (uses S1 (3,2) and a shared vertical line x=3).
  const TASKS = {
    reflectX: { px: 3, py: -2 }, // S1 across x-axis -> (3,-2)
    reflectY: { px: -3, py: 2 }, // S1 across y-axis -> (-3,2)
    distance: 7,                 // (3,2) to (3,-5): |2 - (-5)| = 7
  };

  const STEPS = [
    { id: "enter", label: "Enter City", icon: "🚪" },
    { id: "briefing", label: "Briefing", icon: "🏛️" },
    { id: "datalab", label: "Sensor Lab", icon: "🌊" },
    { id: "graph", label: "Grid", icon: "🗺️" },
    { id: "decision", label: "Decision", icon: "🗳️" },
    { id: "reaction", label: "City", icon: "🌆" },
    { id: "news", label: "News", icon: "📰" },
    { id: "passport", label: "Passport", icon: "🪪" },
  ];

  // Vocabulary is shown bilingually (English + Español) for ESOL learners.
  const VOCAB = [
    { term: "integer", es: "número entero", def: "A whole number that can be positive, negative, or zero (no fractions).", ex: "−8, 0, and 7 are all integers.", defEs: "Un número completo que puede ser positivo, negativo o cero (sin fracciones).", exEs: "−8, 0 y 7 son números enteros." },
    { term: "negative number", es: "número negativo", def: "A number less than zero. On a sensor, it means below sea level.", ex: "−8 means 8 meters below sea level.", defEs: "Un número menor que cero. En un sensor significa bajo el nivel del mar.", exEs: "−8 significa 8 metros bajo el nivel del mar." },
    { term: "positive number", es: "número positivo", def: "A number greater than zero. On a sensor, it means above sea level.", ex: "7 means 7 meters above sea level.", defEs: "Un número mayor que cero. En un sensor significa sobre el nivel del mar.", exEs: "7 significa 7 metros sobre el nivel del mar." },
    { term: "sea level", es: "nivel del mar", def: "The starting line for elevation, written as zero (0).", ex: "A sensor at 0 sits exactly at sea level.", defEs: "La línea de inicio para la elevación, escrita como cero (0).", exEs: "Un sensor en 0 está justo al nivel del mar." },
    { term: "coordinate plane", es: "plano de coordenadas", def: "A grid made by an x-axis and a y-axis crossing at the origin (0, 0).", ex: "We plot each sensor at its (x, y) spot.", defEs: "Una cuadrícula formada por un eje x y un eje y que se cruzan en el origen (0, 0).", exEs: "Ubicamos cada sensor en su punto (x, y)." },
    { term: "x-axis", es: "eje x", def: "The horizontal line on the grid. You move left (−) or right (+) along it.", ex: "x = 3 means 3 steps right of the origin.", defEs: "La línea horizontal de la cuadrícula. Te mueves a la izquierda (−) o derecha (+).", exEs: "x = 3 significa 3 pasos a la derecha del origen." },
    { term: "y-axis", es: "eje y", def: "The vertical line on the grid. You move up (+) or down (−) along it.", ex: "y = −2 means 2 steps down from the origin.", defEs: "La línea vertical de la cuadrícula. Te mueves arriba (+) o abajo (−).", exEs: "y = −2 significa 2 pasos hacia abajo desde el origen." },
    { term: "reflection", es: "reflexión", def: "Flipping a point across an axis, like a mirror.", ex: "(3, 2) reflected across the x-axis is (3, −2).", defEs: "Voltear un punto a través de un eje, como un espejo.", exEs: "(3, 2) reflejado en el eje x es (3, −2)." },
    { term: "absolute value", es: "valor absoluto", def: "How far a number is from zero. It is never negative.", ex: "The absolute value of −8 is 8.", defEs: "Qué tan lejos está un número de cero. Nunca es negativo.", exEs: "El valor absoluto de −8 es 8." },
    { term: "evidence", es: "evidencia", def: "Proof from your data that supports your idea.", ex: "“The lowest sensor is −8” is evidence.", defEs: "Prueba de tus datos que apoya tu idea.", exEs: "“El sensor más bajo es −8” es evidencia." },
  ];

  const DECISION_STARTERS = [
    "The data shows ",
    "The lowest elevation is ",
    "I recommend placing the pump ",
    "One piece of evidence is ",
    "Another piece of evidence is ",
  ];

  const NEWS_WORDS = ["integer", "negative", "positive", "sea level", "coordinate", "x-axis", "y-axis", "reflect", "distance", "recommend"];
  const NEWS_FRAMES = [
    "Neft City measured ",
    "The sensor data showed ",
    "On the grid we saw ",
    "I recommend ",
  ];

  const SKILLS = [
    { key: "order", label: "I can order integers." },
    { key: "compare", label: "I can compare positive and negative numbers." },
    { key: "plot", label: "I can plot points on the coordinate plane." },
    { key: "reflect", label: "I can reflect a point across an axis." },
    { key: "distance", label: "I can find distance using absolute value." },
    { key: "recommend", label: "I can recommend with evidence." },
    { key: "revise", label: "I can revise my thinking." },
  ];

  const ROLE_FLAVOR = {
    "Flood Engineer": "As our Flood Engineer, you'll decide where the water can be pumped out.",
    "Map Specialist": "As our Map Specialist, you'll plot every sensor on the city grid.",
    "Data Analyst": "As our Data Analyst, you'll dig into the elevation numbers first.",
    "News Reporter": "As our News Reporter, you'll explain the story to the whole city.",
    "Community Advocate": "As our Community Advocate, you'll speak up for families in the lowest neighborhoods.",
  };

  const ROLE_FLAVOR_ES = {
    "Flood Engineer": "Como Ingeniero de Inundaciones, decidirás dónde bombear el agua.",
    "Map Specialist": "Como Especialista de Mapas, ubicarás cada sensor en la cuadrícula de la ciudad.",
    "Data Analyst": "Como Analista de Datos, primero explorarás los números de elevación.",
    "News Reporter": "Como Reportero de Noticias, explicarás la historia a toda la ciudad.",
    "Community Advocate": "Como Defensor de la Comunidad, hablarás por las familias en los barrios más bajos.",
  };

  const DECISION_STARTERS_ES = [
    "Los datos muestran ",
    "La elevación más baja es ",
    "Recomiendo colocar la bomba ",
    "Una pieza de evidencia es ",
    "Otra pieza de evidencia es ",
  ];

  const NEWS_FRAMES_ES = [
    "Neft City midió ",
    "Los datos de los sensores mostraron ",
    "En la cuadrícula vimos ",
    "Recomiendo ",
  ];

  // Optional enrichment: reflect S4 (5,-2) across the y-axis -> (-5,-2);
  // distance from (5,-2) to (-5,-2) = |5| + |-5| = 10 units.
  const OUTLIER = {
    refX: -5,
    refY: -2,
    dist: 10,
    which: "samerow",
    whichOpts: [
      { key: "samerow", en: "Both points share the same y, so we add |5| + |−5|", es: "Ambos puntos comparten la misma y, así que sumamos |5| + |−5|" },
      { key: "subtract", en: "Because we subtract the y-values", es: "Porque restamos los valores de y" },
      { key: "guess", en: "It is just a guess", es: "Es solo una adivinanza" },
    ],
  };

  // Spanish strings for static elements tagged with data-i18n / data-i18n-html.
  // English comes from the captured DOM, so only Spanish lives here.
  const I18N_ES = {
    "ui.vocab": "📘 Vocabulario", "ui.back": "← Atrás", "ui.clear": "Borrar",
    "ui.check": "Revisar", "ui.tryit": "Inténtalo",
    "enter.eyebrow": "Living School · Capítulo 4",
    "enter.intro": "¡Una fuerte lluvia está inundando Neft City! Los sensores reportan <strong>elevaciones</strong> y están en una <strong>cuadrícula</strong> de la ciudad. Tu equipo debe leer los datos y decidir dónde colocar una nueva bomba. ¿Listo para ayudar?",
    "enter.nameLabel": "Primero, dinos tu <strong>nombre</strong>",
    "enter.nameHelp": "Lo usamos en tu reporte final.",
    "enter.roleLegend": "Elige tu <strong>rol</strong> en el equipo de la ciudad",
    "role.engineer": "Manejas las bombas y el agua.",
    "role.map": "Lees la cuadrícula y los puntos de la ciudad.",
    "role.analyst": "Te encantan los números y los patrones.",
    "role.reporter": "Cuentas la historia de la ciudad.",
    "role.advocate": "Hablas por la gente.",
    "enter.start": "Entrar a Neft City →",
    "briefing.title": "🏛️ Informe de la Misión",
    "briefing.goalsTitle": "🎯 Metas de tu Misión",
    "briefing.goal1": "Ordena las <em>elevaciones</em> de menor a mayor.",
    "briefing.goal2": "Ubica los sensores en el <em>plano de coordenadas</em>.",
    "briefing.goal3": "<em>Refleja</em> un punto a través de un eje.",
    "briefing.goal4": "Halla la <em>distancia</em> usando el <em>valor absoluto</em>.",
    "briefing.goal5": "Recomienda dónde colocar la bomba, usando <em>evidencia</em>.",
    "briefing.vocabHint": "¿Palabra nueva? Toca una palabra azul para ver qué significa:",
    "briefing.next": "Ir al Laboratorio de Sensores →",
    "datalab.title": "🌊 Laboratorio de Sensores",
    "datalab.intro": "Los <strong>8 sensores</strong> reportan elevaciones en metros comparadas con el <strong>nivel del mar</strong>. Un número <strong>negativo</strong> significa <strong>bajo el nivel del mar</strong>. Haz clic en los números en orden de <strong>menor a mayor</strong>.",
    "datalab.legBelow": "Bajo el nivel del mar",
    "datalab.legZero": "Al nivel del mar (0)",
    "datalab.legAbove": "Sobre el nivel del mar",
    "datalab.step1": "Paso 1 · Ordena las elevaciones",
    "datalab.step1help": "Haz clic en un número para ponerlo en fila. Haz clic en un número colocado para devolverlo.",
    "datalab.poolLabel": "Elevaciones por ordenar",
    "datalab.trayLabel": "Fila ordenada (menor → mayor)",
    "datalab.checkSort": "Revisar Orden",
    "datalab.step2": "Paso 2 · Compara las elevaciones",
    "datalab.step2help": "Recuerda: cuanto más bajo el nivel del mar, menor (más negativo) es el número. Después de dos intentos verás una pista.",
    "datalab.next": "Ubicar en la Cuadrícula →",
    "graph.title": "🗺️ Ubica la Cuadrícula de Sensores",
    "graph.lead": "Elige un sensor y haz clic en la celda de su ubicación <strong>(x, y)</strong>. Haz clic en un punto colocado para quitarlo. Los ejes se cruzan en el <strong>origen (0, 0)</strong>.",
    "graph.queueLabel": "Sensores por ubicar — toca uno para seleccionarlo",
    "graph.check": "Revisar Ubicación",
    "graph.reset": "Reiniciar puntos",
    "graph.interpTitle": "Refleja y mide",
    "graph.checkAnswers": "Revisar Respuestas",
    "graph.next": "Ir a la Sala de Decisiones →",
    "decision.title": "🗳️ Sala de Decisiones",
    "decision.council": "Concejo de la Ciudad",
    "decision.prompt": "¿Dónde debe Neft City colocar la nueva bomba? Elige una recomendación y explícala con <strong>evidencia</strong> de las elevaciones y la cuadrícula.",
    "decision.choiceA": "Colocar la bomba cerca del sensor más bajo (elevación −8), porque el agua se junta en el punto más bajo.",
    "decision.choiceB": "Colocar la bomba en el sensor más alto (elevación 7).",
    "decision.choiceC": "Colocar la bomba solo al nivel del mar (0).",
    "decision.choiceD": "Repartir bombas al azar por la ciudad.",
    "decision.explainTitle": "Explica con evidencia",
    "decision.explainHelp": "Usa al menos <strong>dos piezas de evidencia</strong> de las elevaciones y la cuadrícula. (Al menos 18 palabras.)",
    "decision.submit": "Enviar Recomendación",
    "reaction.title": "🌆 Reacción de la Ciudad",
    "reaction.status": "Estado de la Ciudad",
    "reaction.revise": "← Revisar Decisión",
    "reaction.next": "Escribir el Reporte de Noticias →",
    "outlier.summary": "🔬 Reto de Ampliación: Ciudad Espejo (opcional)",
    "outlier.intro": "Un mapa de respaldo refleja cada sensor a través del <strong>eje y</strong>. Refleja el sensor <strong>S4 (5, −2)</strong> a través del eje y y luego halla la <strong>distancia</strong> entre S4 y su espejo.",
    "outlier.reflQ": "S4 (5, −2) reflejado en el eje y = ?",
    "outlier.distQ": "¿Distancia de S4 (5, −2) a su espejo? (unidades)",
    "outlier.whichQ": "¿Por qué se halla la distancia sumando los valores absolutos de las x?",
    "outlier.reflectLabel": "En tus palabras, ¿qué le hace a un punto reflejarlo en el eje y? (1 oración)",
    "news.title": "📰 Noticias de Neft City",
    "news.lead": "Escribe un breve reporte público: <strong>3 a 5 oraciones</strong> sobre la inundación, qué mostraron los datos de los sensores y dónde debe poner la bomba Neft City. (Al menos 35 palabras.)",
    "news.wordbankLabel": "Banco de palabras — toca para agregar",
    "news.framesLabel": "Marcos de oración — toca para agregar",
    "news.checklistTitle": "📋 Lista para revisar mi reporte",
    "news.check1": "Expliqué el problema.",
    "news.check2": "Usé evidencia de los datos.",
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
      check: "Check", tryit: "Try it", solved: "✓ Solved", units: "units",
      qLowerName: "Which is lower, −8 or −2?",
      qLowestName: "What is the lowest elevation (deepest below sea level)?",
      qHighestName: "What is the highest elevation?",
      mTrust: "Public Trust", mFlood: "Flood Control", mConfidence: "Data Confidence", mExplanation: "Explanation Strength",
      welcome: ", welcome to the team! ", welcomeNoName: "Welcome to the team! ",
      briefBody: "A huge storm is flooding Neft City. Our <strong>8 sensors</strong> report how high or low each spot is compared to <strong>sea level</strong>, and each sensor has a spot on the city <strong>grid</strong>. Help us read the data and place a new pump.",
      skillOrder: "I can order integers.",
      skillCompare: "I can compare positive and negative numbers.",
      skillPlot: "I can plot points on the coordinate plane.",
      skillReflect: "I can reflect a point across an axis.",
      skillDistance: "I can find distance using absolute value.",
      skillRecommend: "I can recommend with evidence.",
      skillRevise: "I can revise my thinking.",
      outGood: "Your team used strong integer and grid evidence. Neft City builds the pump at the lowest point and the floodwater drains away.",
      outMedium: "Your team found some useful evidence, but the city needs a clearer explanation before building the pump.",
      outRevise: "The city placed the pump in the wrong spot and the low streets stayed flooded. Your team must revise the plan.",
      ppApproved: "Pump placed at the lowest point 🎉", ppReview: "Pump plan under review 🤔", ppRevise: "Plan sent back for revision ⚠️",
      olCorrect: "✅ Correct!", olTryRef: "Not yet. Reflecting across the y-axis flips the sign of x only: (5, −2) → (−5, −2).",
      olTryDist: "Not yet. The points are (5, −2) and (−5, −2). Add the absolute values: |5| + |−5| = 10.",
      olWhichRight: "✅ Yes! The points share the same y, so the distance is |5| + |−5| = 10 units.",
      olWhichWrong: "Look again: both points have the same y, and they sit on opposite sides of the y-axis.",
      olDone: "🌟 Enrichment complete! You reflected across the y-axis and measured distance with absolute value.",
    },
    es: {
      startReady: "¡Listo! Presiona el botón para comenzar.",
      startAdd: "Agrega tu nombre y elige un rol para comenzar.",
      locked: "🔒 Bloqueado", unlocked: "🔓 Desbloqueado",
      check: "Revisar", tryit: "Inténtalo", solved: "✓ Resuelto", units: "unidades",
      qLowerName: "¿Cuál es menor, −8 o −2?",
      qLowestName: "¿Cuál es la elevación más baja (más profunda bajo el nivel del mar)?",
      qHighestName: "¿Cuál es la elevación más alta?",
      mTrust: "Confianza Pública", mFlood: "Control de Inundación", mConfidence: "Confianza en Datos", mExplanation: "Fuerza de Explicación",
      welcome: ", ¡bienvenido al equipo! ", welcomeNoName: "¡Bienvenido al equipo! ",
      briefBody: "Una gran tormenta está inundando Neft City. Nuestros <strong>8 sensores</strong> reportan qué tan alto o bajo está cada lugar comparado con el <strong>nivel del mar</strong>, y cada sensor tiene un lugar en la <strong>cuadrícula</strong> de la ciudad. Ayúdanos a leer los datos y colocar una nueva bomba.",
      skillOrder: "Puedo ordenar números enteros.",
      skillCompare: "Puedo comparar números positivos y negativos.",
      skillPlot: "Puedo ubicar puntos en el plano de coordenadas.",
      skillReflect: "Puedo reflejar un punto a través de un eje.",
      skillDistance: "Puedo hallar distancia usando el valor absoluto.",
      skillRecommend: "Puedo recomendar con evidencia.",
      skillRevise: "Puedo revisar mi pensamiento.",
      outGood: "Tu equipo usó evidencia sólida de enteros y de la cuadrícula. Neft City construye la bomba en el punto más bajo y el agua se drena.",
      outMedium: "Tu equipo encontró evidencia útil, pero la ciudad necesita una explicación más clara antes de construir la bomba.",
      outRevise: "La ciudad colocó la bomba en el lugar equivocado y las calles bajas siguieron inundadas. Tu equipo debe revisar el plan.",
      ppApproved: "Bomba colocada en el punto más bajo 🎉", ppReview: "Plan de la bomba en revisión 🤔", ppRevise: "Plan devuelto para revisión ⚠️",
      olCorrect: "✅ ¡Correcto!", olTryRef: "Aún no. Reflejar en el eje y cambia solo el signo de x: (5, −2) → (−5, −2).",
      olTryDist: "Aún no. Los puntos son (5, −2) y (−5, −2). Suma los valores absolutos: |5| + |−5| = 10.",
      olWhichRight: "✅ ¡Sí! Los puntos comparten la misma y, así que la distancia es |5| + |−5| = 10 unidades.",
      olWhichWrong: "Mira otra vez: ambos puntos tienen la misma y y están en lados opuestos del eje y.",
      olDone: "🌟 ¡Ampliación completa! Reflejaste en el eje y y mediste la distancia con valor absoluto.",
    },
  };

  const STORAGE_KEY = "neftcity_floodgrid_v1";

  /* ============================ STATE ============================ */
  const defaultState = () => ({
    name: "",
    role: "",
    lang: "en", // "en" | "es"
    current: "enter",
    maxStep: 0, // highest unlocked step index
    sort: { tray: [], solved: false },
    calc: {
      lower: { value: "", attempts: 0, solved: false, hint: false },
      lowest: { value: "", attempts: 0, solved: false, hint: false },
      highest: { value: "", attempts: 0, solved: false, hint: false },
    },
    graph: { placed: {}, solved: false }, // placed: { S1: "3,2", ... }
    interp: { reflectX: "", reflectY: "", distance: "", solved: false },
    decision: { choice: "", text: "", submitted: false, accepted: false, revisions: 0 },
    news: { text: "", submitted: false },
    reflect: { r1: "", r2: "" },
    meters: { trust: 0, flood: 0, confidence: 0, explanation: 0 },
    outcomeTier: "", // good | medium | revise
    outlier: { refx: "", refy: "", refSolved: false, dist: "", distSolved: false, which: "", written: "" },
    // currently-selected sensor in the grid plotter (UI only, but persisted)
    activeSensor: "S1",
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
  // Parse an integer from messy input, tolerating en-dash / minus variants.
  const parseInt0 = (raw) => {
    const cleaned = String(raw).replace(/[‒–—−]/g, "-").replace(/[^0-9\-]/g, "");
    if (cleaned === "" || cleaned === "-") return NaN;
    return parseInt(cleaned, 10);
  };

  /* ============================ I18N ============================ */
  // t(key): JS-generated strings (English fallback). Static elements use applyLang().
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
    renderGraph();
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
    // screen-specific refresh
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
      unlock("datalab"); // briefing is informational; the Sensor Lab is the first gated task
      renderBriefing();
      go("briefing");
    });

    refresh();
  }

  /* ============================ 2. BRIEFING ============================ */
  function renderBriefing() {
    if (state.maxStep >= stepIndex("briefing")) unlock("datalab"); // keep Sensor Lab reachable on resume
    const intro = $("#mayorBriefing");
    const flavorMap = state.lang === "es" ? ROLE_FLAVOR_ES : ROLE_FLAVOR;
    const flavor = flavorMap[state.role] || "";
    const greeting = state.name
      ? `<strong>${escapeHtml(state.name)}</strong>${t("welcome")}`
      : t("welcomeNoName");
    intro.innerHTML = `${greeting}${flavor} ${t("briefBody")}`;

    // vocab chips (Spanish term shown when in ES mode)
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

  /* ============================ 3. SENSOR LAB — ORDER ============================ */
  function renderSort() {
    const pool = $("#sortPool");
    const tray = $("#sortTray");
    pool.innerHTML = "";
    tray.innerHTML = "";

    // numbers still in pool = dataset minus what's in tray (position-aware multiset)
    const trayCounts = {};
    state.sort.tray.forEach((n) => (trayCounts[n] = (trayCounts[n] || 0) + 1));
    const remaining = [];
    const used = {};
    DATASET.forEach((n) => {
      used[n] = used[n] || 0;
      if (used[n] < (trayCounts[n] || 0)) { used[n]++; } else { remaining.push(n); }
    });

    remaining.forEach((n) => {
      const b = makeChip(n, false);
      b.addEventListener("click", () => {
        state.sort.tray.push(n);
        save();
        renderSort();
      });
      pool.appendChild(b);
    });

    state.sort.tray.forEach((n, i) => {
      const b = makeChip(n, true);
      b.addEventListener("click", () => {
        state.sort.tray.splice(i, 1);
        save();
        renderSort();
      });
      tray.appendChild(b);
    });

    if (state.sort.solved) markSortSolved();
  }

  function makeChip(n, inTray) {
    const b = document.createElement("button");
    const tone = n < 0 ? "neg" : n > 0 ? "pos" : "zero";
    b.className = "num-chip " + tone + (inTray ? " in-tray" : "");
    b.type = "button";
    b.textContent = fmtInt(n);
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", inTray ? `${n}, placed. Click to remove.` : `${n}. Click to place in ordered line.`);
    return b;
  }

  function checkSort() {
    const fb = $("#sortFeedback");
    const tray = state.sort.tray;
    if (tray.length < DATASET.length) {
      setFeedback(fb, "no", `Place all ${DATASET.length} elevations first. You have ${tray.length}.`);
      return;
    }
    const correct = tray.every((n, i) => n === SORTED[i]);
    if (correct) {
      state.sort.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Perfect! The elevations are ordered least → greatest. Compare questions unlocked!");
      markSortSolved();
      awardXp("Integers ordered!");
    } else {
      // find first out-of-order index for targeted hint
      let firstBad = tray.findIndex((n, i) => n !== SORTED[i]);
      $$("#sortTray .num-chip").forEach((c, i) => {
        c.classList.toggle("bad", i >= firstBad);
      });
      setFeedback(fb, "no", "Check the order. Remember: more negative means lower. The smallest number goes first.");
    }
  }

  function markSortSolved() {
    $$("#sortTray .num-chip").forEach((c) => c.classList.remove("bad"));
    $("#calcBlock").classList.remove("locked");
    $("#calcBlock").setAttribute("aria-disabled", "false");
    $("#calcLockTag").textContent = t("unlocked");
    $("#calcLockTag").classList.add("unlocked");
  }

  /* ============================ 3. SENSOR LAB — COMPARE ============================ */
  const CALC_DEFS = [
    { key: "lower", nameKey: "qLowerName", placeholder: "e.g. -8", answer: LOWEST,
      hint: "−8 is further below sea level than −2, so −8 is the lower number.", aria: "Lower of -8 and -2" },
    { key: "lowest", nameKey: "qLowestName", placeholder: "e.g. -8", answer: LOWEST,
      hint: "The lowest elevation is the most negative number in your ordered line: −8.", aria: "Lowest elevation" },
    { key: "highest", nameKey: "qHighestName", placeholder: "e.g. 7", answer: HIGHEST,
      hint: "The highest elevation is the greatest number, at the end of your ordered line: 7.", aria: "Highest elevation" },
  ];

  function renderCalc() {
    // keep the Step-2 lock tag in sync with language + solved state
    const calcLock = $("#calcLockTag");
    if (calcLock) {
      calcLock.textContent = state.sort.solved ? t("unlocked") : t("locked");
      calcLock.classList.toggle("unlocked", state.sort.solved);
    }
    const grid = $("#calcGrid");
    grid.innerHTML = "";
    CALC_DEFS.forEach((def) => {
      const c = state.calc[def.key];
      const row = document.createElement("div");
      row.className = "calc-row";
      row.innerHTML = `
        <div class="calc-head">
          <span class="calc-name">${t(def.nameKey)}</span>
          <span class="calc-state ${c.solved ? "solved" : ""}" id="state-${def.key}">${c.solved ? t("solved") : t("tryit")}</span>
        </div>
        <div class="calc-input-row">
          <input type="text" inputmode="numeric" id="input-${def.key}" value="${escapeAttr(c.value)}"
            placeholder="${def.placeholder}" aria-label="${def.aria}" ${c.solved ? "disabled" : ""} />
          <button class="btn-primary" type="button" id="check-${def.key}" ${c.solved ? "disabled" : ""}>${t("check")}</button>
          <button class="btn-hint" type="button" id="hint-${def.key}">💡 Hint</button>
        </div>
        <p class="feedback" id="fb-${def.key}" role="status" aria-live="polite"></p>
        <div class="hintcard ${c.hint ? "show" : ""}" id="hintcard-${def.key}">💡 ${def.hint}</div>
      `;
      grid.appendChild(row);

      $(`#check-${def.key}`).addEventListener("click", () => checkCalc(def.key));
      $(`#input-${def.key}`).addEventListener("keydown", (e) => { if (e.key === "Enter") checkCalc(def.key); });
      $(`#input-${def.key}`).addEventListener("input", (e) => { state.calc[def.key].value = e.target.value; save(); });
      $(`#hint-${def.key}`).addEventListener("click", () => {
        state.calc[def.key].hint = true;
        save();
        $(`#hintcard-${def.key}`).classList.add("show");
      });

      if (c.solved) setFeedback($(`#fb-${def.key}`), "ok", "✓ Correct!");
    });
    refreshDataLabGate();
  }

  function checkCalc(key) {
    const c = state.calc[key];
    const fb = $(`#fb-${key}`);
    const raw = $(`#input-${key}`).value.trim();
    c.value = raw;
    if (raw === "") { setFeedback(fb, "no", "Type your answer first."); save(); return; }

    const ok = validateCalc(key, raw);
    if (ok) {
      c.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Correct! Nice work.");
      $(`#state-${key}`).textContent = t("solved");
      $(`#state-${key}`).classList.add("solved");
      $(`#input-${key}`).disabled = true;
      $(`#check-${key}`).disabled = true;
      awardXp("Comparison solved!");
      refreshDataLabGate();
    } else {
      c.attempts++;
      save();
      let msg = calcMissMessage(key, raw);
      if (c.attempts >= 2) {
        c.hint = true;
        $(`#hintcard-${key}`).classList.add("show");
        setFeedback(fb, "tip", `${msg} A hint is now open below. 💡`);
      } else {
        setFeedback(fb, "no", msg);
      }
    }
  }

  function validateCalc(key, raw) {
    const def = CALC_DEFS.find((d) => d.key === key);
    const v = parseInt0(raw);
    if (Number.isNaN(v)) return false;
    return v === def.answer;
  }

  // Targeted, misconception-aware feedback (generated locally).
  function calcMissMessage(key, raw) {
    const v = parseInt0(raw);
    if (key === "lower") {
      if (v === -2) return "Careful: −2 is closer to zero, so it is higher. −8 is deeper below sea level.";
      return "Not yet. The lower number is the one further below sea level (more negative).";
    }
    if (key === "lowest") {
      if (v === HIGHEST) return "That is the highest, not the lowest. The lowest is the most negative number.";
      if (v === 0) return "0 is sea level, not the lowest. Look for the most negative number.";
      return "Not yet. The lowest elevation is the most negative number: look at the start of your ordered line.";
    }
    if (key === "highest") {
      if (v === LOWEST) return "That is the lowest, not the highest. The highest is the greatest number.";
      return "Not yet. The highest elevation is the greatest number: look at the end of your ordered line.";
    }
    return "Not quite — try again.";
  }

  function refreshDataLabGate() {
    const allSolved = state.sort.solved && CALC_DEFS.every((d) => state.calc[d.key].solved);
    const btn = $("#toGraphBtn");
    if (btn) btn.disabled = !allSolved;
    if (allSolved) unlock("graph");
  }

  /* ============================ 4. COORDINATE GRID ============================ */
  const CELLS = GRID.max - GRID.min + 1; // 11
  const cellKey = (x, y) => `${x},${y}`;

  function renderGraph() {
    const plane = $("#coordPlane");
    plane.innerHTML = "";
    plane.style.setProperty("--cells", CELLS);

    // build cells top row (y=5) down to bottom row (y=-5); columns x=-5..5
    for (let y = GRID.max; y >= GRID.min; y--) {
      for (let x = GRID.min; x <= GRID.max; x++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "coord-cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        if (y === 0) cell.classList.add("on-xaxis");
        if (x === 0) cell.classList.add("on-yaxis");
        if (x === 0 && y === 0) cell.classList.add("origin");
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `x ${x}, y ${y}`);
        cell.addEventListener("click", () => onCellClick(x, y));
        plane.appendChild(cell);
      }
    }
    paintPins();

    // sensor queue
    const queue = $("#sensorQueue");
    queue.innerHTML = "";
    SENSORS.forEach((s) => {
      const placedAt = state.graph.placed[s.id];
      const done = !!placedAt;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sensor-pick" + (done ? " done" : "");
      b.setAttribute("aria-pressed", String(state.activeSensor === s.id));
      b.innerHTML = `
        <span class="s-tag">${s.id}</span>
        <span class="s-target">place at (${fmtInt(s.x)}, ${fmtInt(s.y)})</span>
        <span class="s-status">${done ? "✓ placed " + parens(placedAt) : ""}</span>`;
      b.addEventListener("click", () => {
        state.activeSensor = s.id;
        save();
        renderGraph();
      });
      queue.appendChild(b);
    });

    const interpLock = $("#interpLockTag");
    if (interpLock) {
      interpLock.textContent = state.graph.solved ? t("unlocked") : t("locked");
      interpLock.classList.toggle("unlocked", state.graph.solved);
    }
    if (state.graph.solved) {
      $("#interpBlock").classList.remove("locked");
      $("#interpBlock").setAttribute("aria-disabled", "false");
    }
    renderInterp();
  }

  function onCellClick(x, y) {
    const key = cellKey(x, y);
    // if a sensor is already placed here, remove it
    const occupantId = Object.keys(state.graph.placed).find((id) => state.graph.placed[id] === key);
    if (occupantId) {
      delete state.graph.placed[occupantId];
      state.activeSensor = occupantId; // re-select it for easy re-placement
      save();
      renderGraph();
      return;
    }
    // otherwise place the active sensor here (move it if already placed elsewhere)
    const active = state.activeSensor || SENSORS[0].id;
    state.graph.placed[active] = key;
    // auto-advance selection to next unplaced sensor for smoother flow
    const next = SENSORS.find((s) => !state.graph.placed[s.id]);
    if (next) state.activeSensor = next.id;
    save();
    renderGraph();
  }

  function paintPins() {
    $$("#coordPlane .coord-cell").forEach((cell) => {
      cell.classList.remove("placed", "correct", "wrong");
      cell.querySelectorAll(".pin").forEach((p) => p.remove());
    });
    Object.keys(state.graph.placed).forEach((id) => {
      const [x, y] = state.graph.placed[id].split(",").map(Number);
      const cell = $(`#coordPlane .coord-cell[data-x="${x}"][data-y="${y}"]`);
      if (!cell) return;
      cell.classList.add("placed");
      const pin = document.createElement("span");
      pin.className = "pin";
      pin.textContent = id;
      cell.appendChild(pin);
    });
  }

  function checkGraph() {
    const fb = $("#graphFeedback");
    const placedCount = Object.keys(state.graph.placed).length;
    if (placedCount < SENSORS.length) {
      setFeedback(fb, "no", `Place all ${SENSORS.length} sensors first. You have ${placedCount}.`);
      return;
    }
    let allRight = true;
    SENSORS.forEach((s) => {
      const at = state.graph.placed[s.id];
      const right = at === cellKey(s.x, s.y);
      const [x, y] = (at || "0,0").split(",").map(Number);
      const cell = $(`#coordPlane .coord-cell[data-x="${x}"][data-y="${y}"]`);
      if (cell) cell.classList.add(right ? "correct" : "wrong");
      if (!right) allRight = false;
    });
    if (allRight) {
      state.graph.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Every sensor is in the right spot! Reflect & measure unlocked.");
      $("#interpBlock").classList.remove("locked");
      $("#interpBlock").setAttribute("aria-disabled", "false");
      $("#interpLockTag").textContent = t("unlocked");
      $("#interpLockTag").classList.add("unlocked");
      awardXp("Grid plotted!");
    } else {
      setFeedback(fb, "no", "Some pins are off. Check the red pins: count x left/right first, then y up/down.");
    }
  }

  /* ---- reflect + distance ---- */
  function renderInterp() {
    const wrap = $("#interpQuestions");
    if (wrap.dataset.built === "1") { restoreInterpUI(); return; }
    wrap.innerHTML = "";

    const pair = document.createElement("div");
    pair.className = "task-pair";
    pair.innerHTML = `
      <div class="interp-q">
        <p>Reflect S1 (3, 2) across the <strong>x-axis</strong>. New point = ?</p>
        <div class="coord-input-row">
          <span class="paren">(</span>
          <input type="text" inputmode="numeric" id="rx-x" placeholder="x" aria-label="Reflect across x-axis, new x" />
          <span class="comma">,</span>
          <input type="text" inputmode="numeric" id="rx-y" placeholder="y" aria-label="Reflect across x-axis, new y" />
          <span class="paren">)</span>
        </div>
      </div>
      <div class="interp-q">
        <p>Reflect S1 (3, 2) across the <strong>y-axis</strong>. New point = ?</p>
        <div class="coord-input-row">
          <span class="paren">(</span>
          <input type="text" inputmode="numeric" id="ry-x" placeholder="x" aria-label="Reflect across y-axis, new x" />
          <span class="comma">,</span>
          <input type="text" inputmode="numeric" id="ry-y" placeholder="y" aria-label="Reflect across y-axis, new y" />
          <span class="paren">)</span>
        </div>
      </div>`;
    wrap.appendChild(pair);

    const distDiv = document.createElement("div");
    distDiv.className = "interp-q";
    distDiv.innerHTML = `
      <p>A flood line runs straight down from S1 (3, 2) to a drain at (3, −5).
         What is the <strong>distance</strong> between them? Use absolute value: |2 − (−5)|.</p>
      <div class="coord-input-row">
        <input type="text" inputmode="numeric" id="dist-in" placeholder="e.g. 7" aria-label="Distance in units" />
        <span class="comma">${t("units")}</span>
      </div>`;
    wrap.appendChild(distDiv);

    // wire inputs to state
    $("#rx-x").addEventListener("input", (e) => { state.interp.reflectX = setPairPart(state.interp.reflectX, 0, e.target.value); save(); });
    $("#rx-y").addEventListener("input", (e) => { state.interp.reflectX = setPairPart(state.interp.reflectX, 1, e.target.value); save(); });
    $("#ry-x").addEventListener("input", (e) => { state.interp.reflectY = setPairPart(state.interp.reflectY, 0, e.target.value); save(); });
    $("#ry-y").addEventListener("input", (e) => { state.interp.reflectY = setPairPart(state.interp.reflectY, 1, e.target.value); save(); });
    $("#dist-in").addEventListener("input", (e) => { state.interp.distance = e.target.value; save(); });

    wrap.dataset.built = "1";
    restoreInterpUI();
  }

  // store reflect answers as "x|y" pair strings so each input persists independently
  function setPairPart(pair, idx, val) {
    const parts = String(pair || "|").split("|");
    while (parts.length < 2) parts.push("");
    parts[idx] = val;
    return parts.join("|");
  }
  function pairPart(pair, idx) {
    const parts = String(pair || "|").split("|");
    return parts[idx] || "";
  }

  function restoreInterpUI() {
    const rxx = $("#rx-x"), rxy = $("#rx-y"), ryx = $("#ry-x"), ryy = $("#ry-y"), di = $("#dist-in");
    if (rxx) rxx.value = pairPart(state.interp.reflectX, 0);
    if (rxy) rxy.value = pairPart(state.interp.reflectX, 1);
    if (ryx) ryx.value = pairPart(state.interp.reflectY, 0);
    if (ryy) ryy.value = pairPart(state.interp.reflectY, 1);
    if (di) di.value = state.interp.distance;
  }

  function checkInterp() {
    const fb = $("#interpFeedback");
    const rxOk = parseInt0(pairPart(state.interp.reflectX, 0)) === TASKS.reflectX.px &&
                 parseInt0(pairPart(state.interp.reflectX, 1)) === TASKS.reflectX.py;
    const ryOk = parseInt0(pairPart(state.interp.reflectY, 0)) === TASKS.reflectY.px &&
                 parseInt0(pairPart(state.interp.reflectY, 1)) === TASKS.reflectY.py;
    const dOk = parseInt0(state.interp.distance) === TASKS.distance;

    if (rxOk && ryOk && dOk) {
      state.interp.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Reflections and distance are correct! The Decision Room is open.");
      $("#toDecisionBtn").disabled = false;
      unlock("decision");
      awardXp("Reflected & measured!");
      return;
    }
    const issues = [];
    if (!rxOk) issues.push("Across the x-axis, keep x the same and flip the sign of y: (3, 2) → (3, −2).");
    if (!ryOk) issues.push("Across the y-axis, keep y the same and flip the sign of x: (3, 2) → (−3, 2).");
    if (!dOk) issues.push("Distance: |2 − (−5)| = |7| = 7 units.");
    setFeedback(fb, "no", issues.join(" "));
  }

  /* ============================ 5. DECISION ============================ */
  function initDecision() {
    // choices
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
    if (!state.decision.choice) { setFeedback(fb, "no", "Pick a recommendation (A, B, C, or D) first."); return; }
    if (wc < 18) { setFeedback(fb, "no", `Write at least 18 words of evidence. You have ${wc}.`); return; }

    state.decision.submitted = true;

    if (state.decision.choice === BEST_CHOICE) {
      state.decision.accepted = true;
      save();
      setFeedback(fb, "ok", "✅ The city council is convinced! Heading to City Reaction…");
      computeScore();
      unlock("reaction");
      awardXp("Recommendation accepted!");
      setTimeout(() => go("reaction"), 700);
    } else {
      // revision event
      state.decision.accepted = false;
      state.decision.revisions++;
      save();
      setFeedback(fb, "no", "🏛️ The city council is not convinced yet. Look back at the elevations and revise. (Hint: water collects at the LOWEST point — elevation −8.)");
      // still let them see a (revise) reaction so the loop is visible
      computeScore();
      unlock("reaction");
      awardXp("Revision needed");
      setTimeout(() => go("reaction"), 900);
    }
  }

  /* ============================ 6. CITY REACTION + SCORING ============================ */
  // Deterministic local scoring -> four 0..100 meters.
  function computeScore() {
    const calcSolved = CALC_DEFS.filter((d) => state.calc[d.key].solved).length;
    const totalAttempts = CALC_DEFS.reduce((a, d) => a + state.calc[d.key].attempts, 0);
    const decWords = wordCount(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;

    // Data Confidence: order + compares + plot + reflect/distance
    let confidence = 0;
    if (state.sort.solved) confidence += 20;
    confidence += calcSolved * 10; // 3 -> 30
    if (state.graph.solved) confidence += 25;
    if (state.interp.solved) confidence += 15;
    confidence -= Math.min(20, totalAttempts * 2); // penalize many misses
    confidence = clamp(confidence);

    // Explanation Strength: words + evidence keywords + correctness
    const evidenceHits = countEvidence(state.decision.text);
    let explanation = Math.min(50, decWords * 1.5) + evidenceHits * 10;
    if (acceptedBest) explanation += 15;
    explanation = clamp(explanation);

    // Public Trust: best decision + strong explanation, minus revisions
    let trust = (acceptedBest ? 55 : 20) + Math.round(explanation * 0.3) - state.decision.revisions * 8;
    trust = clamp(trust);

    // Flood Control (higher = more water pumped out / solved)
    let flood = acceptedBest ? 70 : 30;
    if (state.graph.solved) flood += 15;
    if (acceptedBest && evidenceHits >= 2) flood += 15;
    flood = clamp(flood);

    state.meters = {
      trust: Math.round(trust),
      flood: Math.round(flood),
      confidence: Math.round(confidence),
      explanation: Math.round(explanation),
    };

    // outcome tier
    if (!acceptedBest) {
      state.outcomeTier = "revise";
    } else if (state.meters.explanation >= 65 && evidenceHits >= 2 && state.meters.confidence >= 70) {
      state.outcomeTier = "good";
    } else {
      state.outcomeTier = "medium";
    }
    save();
  }

  function countEvidence(text) {
    const tx = text.toLowerCase();
    let hits = 0;
    [/negative/, /below sea level|below sea/, /lowest/, /-\s?8|−\s?8|\bnegative eight\b/, /integer/, /coordinate|grid|\(.*,.*\)/, /reflect/, /distance/, /absolute value/].forEach((re) => {
      if (re.test(tx)) hits++;
    });
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
      { name: t("mFlood"), val: state.meters.flood },
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

    // News unlocks once they've seen reaction with an accepted best decision
    if (state.decision.accepted) unlock("news");

    renderOutlier();
  }

  /* ---- Enrichment: mirror city ---- */
  function renderOutlier() {
    const o = state.outlier;
    const rx = $("#input-orefx"), ry = $("#input-orefy"), di = $("#input-omedian");
    if (!rx || !ry || !di) return;
    rx.value = o.refx; ry.value = o.refy; di.value = o.dist;
    rx.disabled = o.refSolved; ry.disabled = o.refSolved; di.disabled = o.distSolved;
    const ms = $("#state-omean"), ds = $("#state-omedian");
    if (ms) { ms.textContent = o.refSolved ? t("solved") : t("tryit"); ms.classList.toggle("solved", o.refSolved); }
    if (ds) { ds.textContent = o.distSolved ? t("solved") : t("tryit"); ds.classList.toggle("solved", o.distSolved); }

    const opts = $("#outlierOpts");
    opts.innerHTML = "";
    OUTLIER.whichOpts.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      b.textContent = state.lang === "es" ? opt.es : opt.en;
      b.setAttribute("aria-pressed", String(o.which === opt.key));
      if (o.which === opt.key) b.classList.add(opt.key === OUTLIER.which ? "correct" : "wrong");
      b.addEventListener("click", () => {
        state.outlier.which = opt.key;
        save();
        const fb = $("#fb-owhich");
        const right = opt.key === OUTLIER.which;
        setFeedback(fb, right ? "ok" : "no", right ? t("olWhichRight") : t("olWhichWrong"));
        renderOutlier();
        maybeOutlierDone();
      });
      opts.appendChild(b);
    });

    const w = $("#outlierWritten");
    if (w) w.value = o.written;
  }

  function checkOutlierReflect() {
    const o = state.outlier;
    const fb = $("#fb-omean");
    o.refx = $("#input-orefx").value.trim();
    o.refy = $("#input-orefy").value.trim();
    const ok = parseInt0(o.refx) === OUTLIER.refX && parseInt0(o.refy) === OUTLIER.refY;
    if (ok) {
      o.refSolved = true;
      save();
      setFeedback(fb, "ok", t("olCorrect"));
      renderOutlier();
      maybeOutlierDone();
    } else {
      save();
      setFeedback(fb, "no", t("olTryRef"));
    }
  }

  function checkOutlierDist() {
    const o = state.outlier;
    const fb = $("#fb-omedian");
    o.dist = $("#input-omedian").value.trim();
    const ok = parseInt0(o.dist) === OUTLIER.dist;
    if (ok) {
      o.distSolved = true;
      save();
      setFeedback(fb, "ok", t("olCorrect"));
      renderOutlier();
      maybeOutlierDone();
    } else {
      save();
      setFeedback(fb, "no", t("olTryDist"));
    }
  }

  function maybeOutlierDone() {
    const o = state.outlier;
    if (o.refSolved && o.distSolved && o.which === OUTLIER.which) {
      setFeedback($("#outlierDone"), "ok", t("olDone"));
    }
  }

  function initOutlier() {
    $("#check-omean").addEventListener("click", checkOutlierReflect);
    $("#check-omedian").addEventListener("click", checkOutlierDist);
    $("#input-orefx").addEventListener("keydown", (e) => { if (e.key === "Enter") checkOutlierReflect(); });
    $("#input-orefy").addEventListener("keydown", (e) => { if (e.key === "Enter") checkOutlierReflect(); });
    $("#input-omedian").addEventListener("keydown", (e) => { if (e.key === "Enter") checkOutlierDist(); });
    $("#outlierWritten").addEventListener("input", (e) => { state.outlier.written = e.target.value; save(); });
  }

  /* ============================ 7. NEWS ============================ */
  function renderNewsSupports() {
    // Word bank keeps the academic English terms (target vocabulary).
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
    if (wc < 35) { setFeedback(fb, "no", `Write at least 35 words. You have ${wc}.`); return; }
    state.news.submitted = true;
    save();
    setFeedback(fb, "ok", "✅ Published! Generating your Proof-of-Learning Passport…");
    unlock("passport");
    awardXp("News published!");
    setTimeout(() => go("passport"), 700);
  }

  /* ============================ 8. PASSPORT ============================ */
  function earnedSkills() {
    // "recommend" credit requires the best choice AND real evidence,
    // not just the 18-word gate, so the checkmark reflects genuine reasoning.
    const recommendEarned = state.decision.accepted && countEvidence(state.decision.text) >= 2;
    return {
      order: state.sort.solved,
      compare: CALC_DEFS.every((d) => state.calc[d.key].solved),
      plot: state.graph.solved,
      reflect: state.interp.solved,
      distance: state.interp.solved,
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

    const earned = earnedSkills();
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
  function buildPrintHTML() {
    const m = state.meters;
    const tier = state.outcomeTier || "medium";
    const outcome = tier === "good" ? "Pump placed at the lowest point" : tier === "medium" ? "Pump plan under review" : "Plan sent back for revision";
    const earned = earnedSkills();
    const skills = {
      "Order integers": earned.order,
      "Compare positive & negative": earned.compare,
      "Plot points on the grid": earned.plot,
      "Reflect across an axis": earned.reflect,
      "Distance with absolute value": earned.distance,
      "Recommend with evidence": earned.recommend,
      "Revise thinking": earned.revise,
    };
    const sortedShown = state.sort.tray.length === DATASET.length ? state.sort.tray : SORTED;
    const plotRows = SENSORS.map((s) => `${s.id} target (${fmtInt(s.x)}, ${fmtInt(s.y)}) → placed ${state.graph.placed[s.id] ? parens(state.graph.placed[s.id]) : "—"}`).join(" &nbsp;·&nbsp; ");

    return `
      <h1>Neft City: Flood Grid — Proof of Learning</h1>
      <div class="pr-grid">
        <div class="pr-row"><b>Name:</b> ${escapeHtml(state.name || "—")}</div>
        <div class="pr-row"><b>Role:</b> ${escapeHtml(state.role || "—")}</div>
        <div class="pr-row"><b>Mission:</b> Flood Grid</div>
        <div class="pr-row"><b>City Outcome:</b> ${outcome}</div>
      </div>

      <h2>Ordered Elevations (least → greatest)</h2>
      <div class="pr-row">${sortedShown.map(fmtInt).join(", ")}</div>

      <h2>Integer Comparisons</h2>
      <div class="pr-grid">
        <div class="pr-row"><b>Lower of −8 / −2:</b> ${escapeHtml(state.calc.lower.value || "—")}</div>
        <div class="pr-row"><b>Lowest elevation:</b> ${escapeHtml(state.calc.lowest.value || "—")}</div>
        <div class="pr-row"><b>Highest elevation:</b> ${escapeHtml(state.calc.highest.value || "—")}</div>
      </div>

      <h2>Plotted Sensors</h2>
      <div class="pr-row">${plotRows}</div>

      <h2>Reflect &amp; Distance</h2>
      <div class="pr-grid">
        <div class="pr-row"><b>S1 across x-axis:</b> ${escapeHtml(prettyPair(state.interp.reflectX))}</div>
        <div class="pr-row"><b>S1 across y-axis:</b> ${escapeHtml(prettyPair(state.interp.reflectY))}</div>
        <div class="pr-row"><b>Distance (3,2)↔(3,−5):</b> ${escapeHtml(state.interp.distance || "—")} units</div>
      </div>

      <h2>Recommendation</h2>
      <div class="pr-row"><b>Choice:</b> ${state.decision.choice || "—"}</div>
      <div class="pr-row"><b>Explanation:</b> ${escapeHtml(state.decision.text || "—")}</div>

      <h2>News Report</h2>
      <div class="pr-row">${escapeHtml(state.news.text || "—")}</div>

      <h2>Reflection</h2>
      <div class="pr-row"><b>I understand better:</b> ${escapeHtml(state.reflect.r1 || "—")}</div>
      <div class="pr-row"><b>I want to practice:</b> ${escapeHtml(state.reflect.r2 || "—")}</div>

      <h2>Skill Checklist</h2>
      <ul>${Object.entries(skills).map(([k, v]) => `<li>${v ? "☑" : "☐"} ${k}</li>`).join("")}</ul>

      <h2>City Status</h2>
      <div class="pr-row">Public Trust: ${m.trust} &nbsp;·&nbsp; Flood Control: ${m.flood} &nbsp;·&nbsp; Data Confidence: ${m.confidence} &nbsp;·&nbsp; Explanation: ${m.explanation}</div>
    `;
  }

  function prettyPair(pair) {
    const x = pairPart(pair, 0), y = pairPart(pair, 1);
    if (x === "" && y === "") return "—";
    return `(${x || "?"}, ${y || "?"})`;
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
    a.download = `neft-city-flood-grid_${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Delay revocation so slower browsers (Firefox/Safari/mobile) finish the fetch.
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast("⬇️ Progress downloaded");
  }

  function resetMission() {
    if (!confirm("Reset the whole mission? This clears all your work on this device.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = defaultState();
    save();
    // rebuild dynamic UI
    $("#interpQuestions").dataset.built = "";
    location.reload();
  }

  /* ============================ 10. TEACHER VIEW ============================ */
  function buildTeacherHTML() {
    const c = state.calc;
    const calcSolved = CALC_DEFS.filter((d) => c[d.key].solved).length;
    const totalAttempts = CALC_DEFS.reduce((a, d) => a + c[d.key].attempts, 0);
    const decWords = wordCount(state.decision.text);
    const newsWords = wordCount(state.news.text);
    const evidenceHits = countEvidence(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;
    const placedCount = Object.keys(state.graph.placed).length;

    const pill = (ok, warn) => ok ? `<span class="t-pill good">strong</span>` : warn ? `<span class="t-pill warn">developing</span>` : `<span class="t-pill bad">not yet</span>`;

    // misconception detection (local)
    const misconceptions = [];
    if (c.lower.attempts >= 2 && !c.lower.solved) misconceptions.push("Comparing negatives: may think −2 < −8 (treating negatives like positives).");
    if (c.lowest.attempts >= 2 && !c.lowest.solved) misconceptions.push("Lowest elevation: may be picking the highest or sea level instead of the most negative.");
    if (c.highest.attempts >= 2 && !c.highest.solved) misconceptions.push("Highest elevation: may be confusing greatest with most negative.");
    if (!state.graph.solved && placedCount >= 1 && stepIndex(state.current) >= 3)
      misconceptions.push("Plotting: pins may be off — check whether x (left/right) and y (up/down) are swapped, or signs reversed.");
    if (state.interp.solved === false && stepIndex(state.current) >= 3 &&
        (state.interp.reflectX || state.interp.reflectY || state.interp.distance))
      misconceptions.push("Reflection/distance: may flip the wrong coordinate, or subtract instead of using absolute value.");
    if (!misconceptions.length) misconceptions.push("None detected so far.");

    // recommendation quality
    let recQuality, recPill;
    if (acceptedBest && evidenceHits >= 2 && decWords >= 18) { recQuality = "Strong — best choice with 2+ pieces of evidence."; recPill = `<span class="t-pill good">strong</span>`; }
    else if (acceptedBest) { recQuality = "On track — best choice, evidence could be richer."; recPill = `<span class="t-pill warn">developing</span>`; }
    else if (state.decision.submitted) { recQuality = "Needs revision — not yet the best-supported choice."; recPill = `<span class="t-pill bad">revise</span>`; }
    else { recQuality = "Not submitted yet."; recPill = `<span class="t-pill warn">pending</span>`; }

    // suggested next move
    let nextMove;
    if (c.lower.attempts >= 2 && !c.lower.solved) nextMove = "Review comparing negatives: use a vertical number line so −8 sits below −2.";
    else if ((c.lowest.attempts >= 2 && !c.lowest.solved) || (c.highest.attempts >= 2 && !c.highest.solved)) nextMove = "Review integer ordering: connect 'most negative = lowest' to the sorted line.";
    else if (!state.graph.solved && placedCount >= 1) nextMove = "Plotting support: practice reading (x, y) — across first, then up/down — with signed values.";
    else if (state.graph.solved && !state.interp.solved) nextMove = "Reflection/distance: model x-axis vs y-axis reflections and |a − b| on a shared line.";
    else if (acceptedBest && evidenceHits < 2) nextMove = "Student can compute but needs support explaining with evidence. Use sentence frames for academic explanation.";
    else if (calcSolved === CALC_DEFS.length && state.graph.solved && state.interp.solved && acceptedBest && evidenceHits >= 2) nextMove = "Student is ready for enrichment: reflect S4 across the y-axis and find the distance to its mirror.";
    else nextMove = "Continue mission; check in during the Decision Room for evidence quality.";

    return `
      <div class="teacher-section">
        <h3>Student</h3>
        <div class="tstat"><span>Name</span><b>${escapeHtml(state.name || "—")}</b></div>
        <div class="tstat"><span>Role</span><b>${escapeHtml(state.role || "—")}</b></div>
        <div class="tstat"><span>Current step</span><b>${state.current}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Score by Skill</h3>
        <div class="tstat"><span>Order integers</span>${pill(state.sort.solved, false)}</div>
        <div class="tstat"><span>Compare (${calcSolved}/${CALC_DEFS.length})</span>${pill(calcSolved === CALC_DEFS.length, calcSolved >= 1)}</div>
        <div class="tstat"><span>Plot the grid</span>${pill(state.graph.solved, placedCount >= 1)}</div>
        <div class="tstat"><span>Reflect &amp; distance</span>${pill(state.interp.solved, false)}</div>
        <div class="tstat"><span>Recommendation</span>${recPill}</div>
      </div>

      <div class="teacher-section">
        <h3>Attempts per Comparison</h3>
        <div class="tstat"><span>Lower of −8 / −2</span><b>${c.lower.attempts} ${c.lower.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Lowest elevation</span><b>${c.lowest.attempts} ${c.lowest.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Highest elevation</span><b>${c.highest.attempts} ${c.highest.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Sensors placed</span><b>${placedCount}/${SENSORS.length}</b></div>
        <div class="tstat"><span>Total misses</span><b>${totalAttempts}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Misconceptions Detected</h3>
        <ul>${misconceptions.map((m) => `<li>${m}</li>`).join("")}</ul>
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
      div.id = "vocab-" + slug(v.term);
      // Always bilingual so ESOL learners can use both languages side by side.
      div.innerHTML =
        `<h3>${v.term} <span class="vi-es">· ${v.es}</span></h3>` +
        `<p>${v.def}</p><p class="vi-ex">Example: ${v.ex}</p>` +
        `<p class="vi-trans"><strong>${v.es}:</strong> ${v.defEs}</p><p class="vi-ex">Ejemplo: ${v.exEs}</p>`;
      list.appendChild(div);
    });
  }
  function openVocab(term) {
    showModal("#vocabModal");
    if (term) {
      const el = $("#vocab-" + slug(term));
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
    const n = wordCount(text);
    el.textContent = `${n} words` + (n >= min ? " ✓" : ` (need ${min})`);
    el.classList.toggle("ok", n >= min);
  }
  function insertText(taSel, snippet, stateKey, field) {
    const ta = $(taSel);
    const start = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(ta.selectionEnd ?? start);
    const sep = before && !/\s$/.test(before) ? " " : "";
    ta.value = before + sep + snippet + after;
    const pos = (before + sep + snippet).length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    state[stateKey][field] = ta.value;
    save();
    // refresh counters
    if (stateKey === "decision") updateCount("#decisionCount", ta.value, 18);
    if (stateKey === "news") updateCount("#newsCount", ta.value, 35);
  }
  function awardXp(label) { toast("⭐ " + label, "xp"); }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  // Use a real minus sign for negatives so elevations read cleanly.
  function fmtInt(n) { return n < 0 ? "−" + Math.abs(n) : String(n); }
  function parens(key) { const [x, y] = String(key).split(",").map(Number); return `(${fmtInt(x)}, ${fmtInt(y)})`; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ============================ GLOBAL WIRING ============================ */
  function wireNavButtons() {
    $$("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        // render target screen content before showing
        if (target === "briefing") renderBriefing();
        if (target === "datalab") { renderSort(); renderCalc(); }
        if (target === "graph") renderGraph();
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

    // sensor lab
    $("#checkSortBtn").addEventListener("click", checkSort);
    $("#resetSortBtn").addEventListener("click", () => { state.sort.tray = []; state.sort.solved = false; save(); renderSort(); setFeedback($("#sortFeedback"), "", ""); });

    // grid
    $("#checkGraphBtn").addEventListener("click", checkGraph);
    $("#resetGraphBtn").addEventListener("click", () => { state.graph.placed = {}; state.graph.solved = false; state.activeSensor = SENSORS[0].id; save(); renderGraph(); setFeedback($("#graphFeedback"), "", ""); });
    $("#checkInterpBtn").addEventListener("click", checkInterp);

    // decision / news / passport / enrichment
    initDecision();
    initNews();
    initPassport();
    initOutlier();

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
    renderSort();
    renderCalc();
    renderGraph();
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
