/* Native mission controls for the existing Phaser and DOM flagship engines.
 * Language follows localStorage['nt-lang']; the panel's language button writes it
 * and dispatches the site-wide `ewl:lang` event so every layer can relabel. */
(() => {
  "use strict";
  try {
    sessionStorage.setItem("gfx-brief:" + location.pathname, "1");
  } catch (_) {}
  document.querySelector("#gfx-mission-brief")?.remove();
  const game = window.__flagshipGame;
  const slug = location.pathname.split("/").filter(Boolean).pop().replace(".html", "");
  const isFactor = slug.includes("factor-frenzy");
  const isVolume = slug.includes("volume-vault");
  const lang = () => {
    try {
      return localStorage.getItem("nt-lang") === "es" ? "es" : "en";
    } catch (_) {
      return "en";
    }
  };
  const UI = {
    missionControls: { en: "Mission controls", es: "Controles de la misión" },
    missionLevel: { en: "Mission level", es: "Nivel de la misión" },
    launch: { en: "Launch mission", es: "Comenzar misión" },
    langButton: { en: "Español", es: "English" },
    langLabel: { en: "Cambiar a español", es: "Switch to English" },
    sessionProgress: { en: "Session progress", es: "Progreso de la sesión" },
    stepDone: {
      en: "Mission step complete. Keep building!",
      es: "Paso completado. ¡Sigue construyendo!",
    },
    tryAgain: {
      en: "Try another approach. Use the model to check your thinking.",
      es: "Prueba otra forma. Usa el modelo para revisar tu razonamiento.",
    },
    notYetChoice: {
      en: "Not yet — check your work and try another choice.",
      es: "Todavía no — revisa tu trabajo y prueba otra opción.",
    },
    correctPrefix: { en: "Correct. ", es: "Correcto. " },
    built: {
      en: "Construction complete. Building added to your city.",
      es: "Construcción completa. El edificio se agregó a tu ciudad.",
    },
    scaleBoth: {
      en: "Compare both ingredient amounts using the same scale factor.",
      es: "Compara las dos cantidades con el mismo factor de escala.",
    },
    jugCheck: {
      en: "Check the fraction against the jug divisions.",
      es: "Compara la fracción con las divisiones de la jarra.",
    },
    compareSale: {
      en: "Compare each original price × (1 − discount ÷ 100).",
      es: "Compara cada precio original × (1 − descuento ÷ 100).",
    },
    complete: {
      en: (a, s) =>
        `Mission complete · ${a}% accuracy · best streak ${s}. Choose a level and launch again.`,
      es: (a, s) =>
        `Misión completa · ${a}% de precisión · mejor racha ${s}. Elige un nivel y vuelve a empezar.`,
    },
    selfPaced: {
      en: "Take your time. Every mission is self-paced.",
      es: "Tómate tu tiempo. Cada misión va a tu ritmo.",
    },
    stats: {
      en: (sc, p, st, b) =>
        `Score ${sc}  ·  Accuracy ${p}%  ·  Streak ${st}  ·  Personal best ${b}`,
      es: (sc, p, st, b) => `Puntos ${sc}  ·  Precisión ${p}%  ·  Racha ${st}  ·  Mejor marca ${b}`,
    },
    stars: { en: "Stars", es: "Estrellas" },
    useModel: {
      en: "Use the model below to build and check your answer. Choose any mission level above.",
      es: "Usa el modelo de abajo para construir y revisar tu respuesta. Elige un nivel de misión arriba.",
    },
    chooseLevel: {
      en: "Choose your level and launch a mission. Controls are available here and in the game.",
      es: "Elige tu nivel y comienza una misión. Los controles están aquí y en el juego.",
    },
    data: { en: " Data: ", es: " Datos: " },
    jugOrder: {
      en: (i, n, d, j) => `Order ${i}: fill ${n}/${d} of the jug. Divisions: ${j}.`,
      es: (i, n, d, j) => `Pedido ${i}: llena ${n}/${d} de la jarra. Divisiones: ${j}.`,
    },
    currentMix: { en: "Current mix", es: "Mezcla actual" },
    lowestLane: {
      en: "Which lane offers the lowest sale price? Compare all three discounts.",
      es: "¿Qué carril tiene el precio de oferta más bajo? Compara los tres descuentos.",
    },
    continueMission: { en: "Continue mission", es: "Continuar la misión" },
    sliceDiv: {
      en: (c) => `Slice divisions (${c} per whole)`,
      es: (c) => `Divisiones (${c} por entero)`,
    },
    pieces: { en: "Pieces", es: "Piezas" },
    groups: { en: "Groups", es: "Grupos" },
    forge: { en: "Forge answer", es: "Forjar respuesta" },
    ingredient: { en: (i) => `Ingredient ${i}`, es: (i) => `Ingrediente ${i}` },
    clearMix: { en: "Clear mix", es: "Vaciar mezcla" },
    serve: { en: "Serve recipe", es: "Servir receta" },
    recipeHint: { en: "Recipe hint", es: "Pista de la receta" },
    lane: {
      en: (i, p, d) => `Lane ${i}: ${p} · ${d}% off`,
      es: (i, p, d) => `Carril ${i}: ${p} · ${d}% de descuento`,
    },
    seeResults: { en: "See results", es: "Ver resultados" },
    nextDeal: { en: "Next deal", es: "Siguiente oferta" },
    changeSlice: { en: "Change slice", es: "Cambiar corte" },
    totalArea: { en: "Total area", es: "Área total" },
    lock: { en: "Lock construction", es: "Fijar construcción" },
    pour: { en: "Hold to pour · release to check", es: "Mantén para servir · suelta para revisar" },
    addDivision: { en: "Add one jug division", es: "Agregar una división de la jarra" },
    checkFill: { en: "Check fill", es: "Revisar llenado" },
    liveRatio: {
      en: (a, b, cap, ca, cb, ok) =>
        `Live Ratio Lab: target ratio ${a}:${b}${cap ? ` (total ${cap})` : ""} · your mix ${ca}:${cb} (${ca + cb} scoops) · ${ok ? "equivalent ratio" : "scale both ingredients by the same multiplier"}`,
      es: (a, b, cap, ca, cb, ok) =>
        `Laboratorio de razones: razón meta ${a}:${b}${cap ? ` (total ${cap})` : ""} · tu mezcla ${ca}:${cb} (${ca + cb} cucharadas) · ${ok ? "razón equivalente" : "multiplica los dos ingredientes por el mismo número"}`,
    },
    liveFoundry: { en: "Live Fraction Foundry", es: "Fundición de fracciones" },
    cutsInfo: {
      en: (c, part, n) =>
        `Divisions per whole: ${c} · Selected ${part ? "pieces" : "groups"}: ${n}`,
      es: (c, part, n) =>
        `Divisiones por entero: ${c} · ${part ? "Piezas" : "Grupos"} elegidos: ${n}`,
    },
    liveJug: {
      en: (f, j, n, d) => `Live fraction jug: ${f} / ${j} divisions filled (target ${n}/${d})`,
      es: (f, j, n, d) => `Jarra de fracciones: ${f} / ${j} divisiones llenas (meta ${n}/${d})`,
    },
    howTo: {
      en: [
        "Choose a mission level, then launch.",
        "Use the readable mission controls or the game canvas. Keyboard and touch both work.",
        "Check each model carefully. Mistakes give you another chance to learn.",
      ],
      es: [
        "Elige un nivel de misión y comienza.",
        "Usa los controles de la misión o el juego. Funcionan con teclado y con pantalla táctil.",
        "Revisa cada modelo con cuidado. Los errores te dan otra oportunidad para aprender.",
      ],
    },
    coachTitle: {
      en: (u, t) => `Strategy Coach · ${u} (${t})`,
      es: (u, t) => `Entrenador de estrategia · ${u} (${t})`,
    },
  };
  const T = (key, ...args) => {
    const value = UI[key][lang()];
    return typeof value === "function" ? value(...args) : value;
  };
  // Lesson ids and standards follow data/curriculum-launch-manifest.json (district unit order).
  const configs = {
    "unit1-factor-frenzy": {
      unit: "Unit 6 · Lessons 6-7, 6-12, 6-13 (6.NOS.4)",
      es: {
        unit: "Unidad 6 · Lecciones 6-7, 6-12, 6-13 (6.NOS.4)",
        topic: "Factorización prima, MCD y mcm",
        coach:
          "Divide cada número compuesto en un par de factores hasta que cada rama sea prima (2, 3, 5, 7, 11). El MCD usa los primos en común; el mcm junta las potencias más altas.",
        levels: ["Herrero aprendiz", "Herrero oficial", "Maestro herrero"],
      },
      topic: "Prime Factorization, GCF & LCM",
      coach:
        "Split each composite number into a factor pair until every branch is prime (2, 3, 5, 7, 11). GCF shares common primes; LCM combines highest prime powers.",
      levels: ["Apprentice smith", "Journeyman smith", "Master smith"],
      data: (n) => ({ tier: n }),
    },
    "unit2-fraction-foundry": {
      unit: "Unit 6 · Lessons 6-1, 6-2, 6-9 to 6-11 (6.NOS.1)",
      es: {
        unit: "Unidad 6 · Lecciones 6-1, 6-2, 6-9 a 6-11 (6.NOS.1)",
        topic: "División de fracciones y números mixtos",
        coach:
          "Para dividir entre una fracción, parte cada entero en partes iguales según el denominador del divisor, o multiplica por el recíproco (a/b ÷ c/d = a/b × d/c).",
        levels: [
          "Entero ÷ fracción unitaria",
          "Entero ÷ fracción unitaria en contexto",
          "Entero ÷ fracción",
          "Fracción ÷ fracción",
          "Número mixto ÷ fracción",
        ],
      },
      topic: "Dividing Fractions & Mixed Numbers",
      coach:
        "To divide by a fraction, partition each whole into equal parts matching the divisor denominator, or multiply by the reciprocal (a/b ÷ c/d = a/b × d/c).",
      levels: [
        "Whole ÷ unit fraction",
        "Whole ÷ unit fraction in context",
        "Whole ÷ fraction",
        "Fraction ÷ fraction",
        "Mixed number ÷ fraction",
      ],
      data: (n) => ({ level: n - 1, score: 0, lives: 3 }),
    },
    "unit9-variable-velocity": {
      unit: "Unit 9 · Lessons 9-1 to 9-4 (6.AT.11)",
      es: {
        unit: "Unidad 9 · Lecciones 9-1 a 9-4 (6.AT.11)",
        topic: "Variables independientes y dependientes, tablas y ecuaciones",
        coach:
          "Mira cómo cambia y por cada aumento de 1 en x. Las reglas proporcionales multiplican (y = kx); las reglas aditivas suman un valor inicial (y = x + b).",
        levels: [
          "Reglas proporcionales",
          "Tablas y ecuaciones",
          "Predice el siguiente punto",
          "Reglas con valor inicial",
          "Explorador experto",
        ],
      },
      topic: "Independent & Dependent Variables, Tables & Equations",
      coach:
        "Check how y changes for each 1-unit increase in x. Proportional rules multiply (y = kx); additive rules add a starting offset (y = x + b).",
      levels: [
        "Proportional rules",
        "Tables and equations",
        "Predict the next point",
        "Rules with a starting value",
        "Master rover",
      ],
      data: (n) => ({ level: n - 1, score: 0, lives: 3 }),
    },
    "unit6-expression-engine": {
      unit: "Unit 6 · Lessons 6-3 to 6-5 (6.AT.5, 6.AT.6)",
      es: {
        unit: "Unidad 6 · Lecciones 6-3 a 6-5 (6.AT.5, 6.AT.6)",
        topic: "Exponentes, orden de las operaciones y expresiones algebraicas",
        coach:
          "Sigue el orden: primero los símbolos de agrupación, luego los exponentes, luego multiplica y divide de izquierda a derecha, y al final suma y resta de izquierda a derecha.",
        levels: ["Guiado: exponentes", "Estándar: expresiones mixtas", "Reto: expresiones mixtas"],
      },
      topic: "Exponents, Order of Operations & Algebraic Expressions",
      coach:
        "Follow GEMDAS: evaluate grouping symbols first, then exponents, then multiply/divide left to right, then add/subtract left to right.",
      levels: ["Guided: exponents", "Standard: mixed expressions", "Challenge: mixed expressions"],
      data: (n) => ({ difficulty: n - 1 }),
    },
    "unit5-area-architect": {
      unit: "Unit 5 · Lessons 5-1 to 5-4 (6.GR.1)",
      es: {
        unit: "Unidad 5 · Lecciones 5-1 a 5-4 (6.GR.1)",
        topic: "Área de paralelogramos, triángulos y polígonos compuestos",
        coach:
          "El área del paralelogramo es A = b · h y la del triángulo es A = ½ · b · h (usa siempre la altura perpendicular). Divide las figuras compuestas en rectángulos y triángulos.",
        levels: ["Construcción guiada", "Ciudad compuesta"],
      },
      topic: "Area of Parallelograms, Triangles & Composite Polygons",
      coach:
        "Parallelogram area is A = b · h and triangle area is A = ½ · b · h (always use the perpendicular height). Split composite shapes into rectangles and triangles.",
      levels: ["Guided construction", "Composite city"],
      data: (n) => ({ level: n }),
    },
    "unit3-ratio-rally": {
      unit: "Unit 3 · Lessons 3-1 to 3-7 (6.AT.1–3)",
      es: {
        unit: "Unidad 3 · Lecciones 3-1 a 3-7 (6.AT.1–3)",
        topic: "Razones, tablas, diagramas de cinta y tasas unitarias",
        coach:
          "Multiplica las dos partes de una razón por el mismo número. Para hallar una tasa unitaria, divide para encontrar la cantidad por 1 unidad.",
        levels: ["Apoyo", "Estándar", "Reto"],
      },
      topic: "Ratios, Tables, Tape Diagrams & Unit Rates",
      coach:
        "Scale both parts of a ratio by the same multiplier. To find a unit rate, divide to find the amount per 1 unit.",
      levels: ["Support", "Standard", "Challenge"],
      data: (n) => ({ difficulty: ["easy", "medium", "hard"][n - 1] }),
    },
    "6-rp-1game": {
      unit: "Unit 3 · Lessons 3-1, 3-3 (6.AT.1, 6.AT.3a)",
      es: {
        unit: "Unidad 3 · Lecciones 3-1, 3-3 (6.AT.1, 6.AT.3a)",
        topic: "Razones equivalentes, tablas de razones y mezclas",
        coach:
          "Multiplica o divide las dos cantidades por el mismo factor de escala para que la mezcla siga en la razón exacta.",
        levels: ["Recetas guiadas", "Recetas de reto"],
      },
      topic: "Equivalent Ratios, Ratio Tables & Mixtures",
      coach:
        "Multiply or divide both ingredient amounts by the same scale factor to keep the mixture in the exact target ratio.",
      levels: ["Guided recipes", "Challenge recipes"],
      data: (n) => ({ tier: n }),
    },
    "unit9-coordinate-quest": {
      unit: "Unit 7 · Lessons 7-5 to 7-7 (6.NOS.6–8)",
      es: {
        unit: "Unidad 7 · Lecciones 7-5 a 7-7 (6.NOS.6–8)",
        topic: "Plano de coordenadas de cuatro cuadrantes, reflexiones y distancia",
        coach:
          "Ubica (x, y) desde (0, 0): muévete primero en horizontal (x) y luego en vertical (y). Reflejar sobre el eje x cambia el signo de y; sobre el eje y cambia el signo de x.",
        levels: ["Apoyo: lo básico", "Estándar: misión completa", "Reto: navegación avanzada"],
      },
      topic: "Four-Quadrant Coordinate Plane, Reflections & Distance",
      coach:
        "Plot (x, y) from (0, 0): move horizontally first (x), then vertically (y). Reflecting across the x-axis flips y; reflecting across the y-axis flips x.",
      levels: ["Support: fundamentals", "Standard: full mission", "Challenge: advanced navigation"],
      data: (n) => ({ studioTier: n }),
    },
    "unit7-equation-escape": {
      unit: "Unit 8 · Lessons 8-1 to 8-6 (6.AT.8, 6.AT.9)",
      es: {
        unit: "Unidad 8 · Lecciones 8-1 a 8-6 (6.AT.8, 6.AT.9)",
        topic: "Ecuaciones y desigualdades de un paso",
        coach:
          "Usa operaciones inversas en LOS DOS lados para dejar sola la variable: deshaz la suma con una resta y la multiplicación con una división.",
        levels: ["Apoyo: salas de un paso", "Estándar: mazmorra completa", "Reto: salas avanzadas"],
      },
      topic: "One-Step Equations & Inequalities",
      coach:
        "Use inverse operations on BOTH sides to isolate the variable: undo addition with subtraction, and undo multiplication with division.",
      levels: ["Support: one-step rooms", "Standard: full dungeon", "Challenge: advanced rooms"],
      data: (n) => ({ studioTier: n }),
    },
    "unit8-stats-slam": {
      unit: "Unit 2 · Lessons 2-1 to 2-5, 2-8 to 2-10 (6.DS.1–6)",
      es: {
        unit: "Unidad 2 · Lecciones 2-1 a 2-5, 2-8 a 2-10 (6.DS.1–6)",
        topic: "Media, mediana, moda, rango, RIC y DAM",
        coach:
          "¡Primero ordena los datos de menor a mayor! Media = suma ÷ cantidad; mediana = valor del medio; rango = máximo − mínimo; RIC = Q3 − Q1.",
        levels: [
          "Apoyo: media, mediana, moda, rango",
          "Estándar: temporada completa",
          "Reto: estadística avanzada",
        ],
      },
      topic: "Mean, Median, Mode, Range, IQR & MAD",
      coach:
        "Order the data from least to greatest first! Mean = sum ÷ count; Median = middle value; Range = max − min; IQR = Q3 − Q1.",
      levels: [
        "Support: mean, median, mode, range",
        "Standard: full season",
        "Challenge: advanced statistics",
      ],
      data: (n) => ({ studioTier: n }),
    },
    "unit4-discount-dash": {
      unit: "Unit 4 · Lessons 4-4, 4-5 (6.AT.4)",
      es: {
        unit: "Unidad 4 · Lecciones 4-4, 4-5 (6.AT.4)",
        topic: "Porcentaje de un número, descuentos y hallar el total",
        coach:
          "Con un descuento pagas (100 − % de descuento)% del precio: precio × (100 − %) ÷ 100. Para hallar el precio original, piensa: ¿de qué número es esta cantidad ese porcentaje?",
        levels: [
          "Apoyo: precios fáciles",
          "Reto: descuentos mixtos",
          "Detective: halla el precio original",
        ],
      },
      topic: "Percent of a Number, Discounts & Finding the Whole",
      coach:
        "With a discount you pay (100 − % off)% of the price: price × (100 − %) ÷ 100. To find the original price, ask: this amount is that percent of what number?",
      levels: [
        "Support: friendly prices",
        "Challenge: mixed discounts",
        "Detective: find the original price",
      ],
      data: (n) => ({ studioTier: n }),
    },
    "unit2-fraction-kitchen": {
      unit: "Unit 6 · Lessons 6-7 to 6-10 (6.NOS.1)",
      es: {
        unit: "Unidad 6 · Lecciones 6-7 a 6-10 (6.NOS.1)",
        topic: "Fracciones equivalentes y modelos de fracciones",
        coach:
          "Multiplica o divide el numerador y el denominador por el mismo número (que no sea cero) para que coincida con las divisiones de la jarra.",
        levels: ["Apoyo: fracciones básicas", "Reto: fracciones equivalentes"],
      },
      topic: "Equivalent Fractions & Visual Fraction Models",
      coach:
        "Multiply or divide the numerator and denominator by the same nonzero number to match the jug divisions.",
      levels: ["Support: basic fractions", "Challenge: equivalent fractions"],
      data: (n) => ({ studioTier: n }),
    },
    "unit10-volume-vault": {
      unit: "Unit 5 · Lessons 5-5 to 5-7 (6.GR.2, 6.GR.4)",
      es: {
        unit: "Unidad 5 · Lecciones 5-5 a 5-7 (6.GR.2, 6.GR.4)",
        topic: "Volumen de prismas rectangulares y redes de área superficial",
        coach:
          "El volumen es largo × ancho × altura (V = l · a · h = B · h). El área superficial es la suma de las 6 caras rectangulares: 2(la + lh + ah).",
        levels: ["Bóveda de bronce", "Bóveda de plata", "Bóveda de oro"],
      },
      topic: "Volume of Rectangular Prisms & Surface Area Nets",
      coach:
        "Volume is length × width × height (V = l · w · h = B · h). Surface area is the sum of all 6 rectangular faces: 2(lw + lh + wh).",
      levels: ["Bronze vault", "Silver vault", "Gold vault"],
      data: (n) => ({ tier: n }),
    },
  };
  const fallbackLevels = isFactor
    ? {
        en: ["Apprentice smith", "Journeyman smith", "Master smith"],
        es: ["Herrero aprendiz", "Herrero oficial", "Maestro herrero"],
      }
    : isVolume
      ? {
          en: ["Bronze vault", "Silver vault", "Gold vault"],
          es: ["Bóveda de bronce", "Bóveda de plata", "Bóveda de oro"],
        }
      : { en: ["Guided recipes", "Challenge recipes"], es: ["Recetas guiadas", "Recetas de reto"] };
  const config = configs[slug] || {
    unit: "Grade 6 Math",
    topic: "Interactive Concept Practice",
    coach: "Use the visual model to check your mathematical reasoning step by step.",
    levels: fallbackLevels.en,
    es: {
      unit: "Matemáticas de 6.º grado",
      topic: "Práctica interactiva",
      coach: "Usa el modelo visual para revisar tu razonamiento paso a paso.",
      levels: fallbackLevels.es,
    },
    data: (n) => ({ tier: n }),
  };
  const C = (key) => (lang() === "es" && config.es?.[key]) || config[key];
  const panel = document.createElement("section");
  panel.className = "flagship-mission";
  panel.innerHTML = `<div class="fm-top"><div><span class="fm-eyebrow"></span><h2></h2></div><div class="fm-launch"><label for="fm-level"></label><select id="fm-level"></select><button id="fm-start" type="button"></button><button id="fm-lang" type="button"></button></div></div><div class="fm-stats"></div><p class="fm-question"></p><div class="fm-actions"></div><p class="fm-feedback" role="status" aria-live="polite"></p><div class="fm-progress" aria-hidden="true"><span></span></div>`;
  const header = document.querySelector(".ewl-arcade-header-bar");
  if (header) header.after(panel);
  else document.body.prepend(panel);
  panel.querySelector("h2").textContent = document.title.split("—")[0].trim();
  const eyebrow = panel.querySelector(".fm-eyebrow");
  const coachTitle = document.getElementById("ewl-coach-title");
  const coachText = document.getElementById("ewl-coach-text");
  const level = panel.querySelector("select");
  const langButton = panel.querySelector("#fm-lang");
  function relabelPanel() {
    const code = lang();
    document.documentElement.lang = code;
    panel.setAttribute("aria-label", T("missionControls"));
    const base = `${C("unit")} • ${C("topic")}`;
    eyebrow.dataset.base = base;
    eyebrow.textContent = base;
    panel.querySelector('label[for="fm-level"]').textContent = T("missionLevel");
    panel.querySelector("#fm-start").textContent = T("launch");
    panel.querySelector(".fm-stats").setAttribute("aria-label", T("sessionProgress"));
    langButton.textContent = T("langButton");
    langButton.lang = code === "es" ? "en" : "es";
    langButton.setAttribute("aria-label", T("langLabel"));
    const chosen = level.value || "1";
    level.replaceChildren(...C("levels").map((label, i) => new Option(label, String(i + 1))));
    level.value = chosen;
    if (coachTitle) coachTitle.textContent = T("coachTitle", C("unit"), C("topic"));
    if (coachText) {
      coachText.textContent = C("coach");
      coachText.setAttribute("data-en", config.coach);
      if (config.es?.coach) coachText.setAttribute("data-es", config.es.coach);
    }
  }
  langButton.addEventListener("click", () => {
    try {
      localStorage.setItem("nt-lang", lang() === "es" ? "en" : "es");
    } catch (_) {}
    document.dispatchEvent(new CustomEvent("ewl:lang", { detail: { lang: lang() } }));
  });
  let stage = null;
  function syncBounds() {
    try {
      game?.scale?.updateBounds?.();
    } catch (_) {}
  }
  function mountStage() {
    if (!game?.canvas || stage) return;
    stage = document.createElement("div");
    stage.className = "flagship-stage";
    stage.style.aspectRatio = game.config.width + "/" + game.config.height;
    stage.style.setProperty("--native-ratio", String(game.config.width / game.config.height));
    panel.after(stage);
    stage.append(game.canvas);
    game.scale.parent = stage;
    game.scale.parentIsWindow = false;
    game.scale.refresh();
    syncBounds();
    game.canvas.addEventListener("pointerdown", syncBounds, true);
    game.canvas.addEventListener("pointermove", syncBounds, { passive: true, capture: true });
    window.addEventListener("scroll", syncBounds, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        game.scale.refresh();
        syncBounds();
      },
      { passive: true },
    );
    new ResizeObserver(() => {
      game.scale.refresh();
      syncBounds();
    }).observe(stage);
  }
  mountStage();
  relabelPanel();
  const actions = panel.querySelector(".fm-actions");
  const question = panel.querySelector(".fm-question");
  const feedback = panel.querySelector(".fm-feedback");
  let session = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
  let best = 0;
  try {
    best = Number(localStorage.getItem("ewl.studio.best." + slug) || 0);
  } catch (_) {}
  let lastSignature = "";
  let sessionDone = false,
    lastScore = 0;
  let pausedScenes = [];
  let pauseStarted = 0;
  let scene = null;
  const emit = (name, detail) =>
    document.dispatchEvent(new CustomEvent("game:" + name, { detail }));
  // `scene` (optional): a game that writes its own, more specific coaching sets
  // scene.feedbackText while handling the move; the announcement then uses it.
  function track(correct, message, scene) {
    session.total++;
    session.correct += correct ? 1 : 0;
    session.streak = correct ? session.streak + 1 : 0;
    session.bestStreak = Math.max(session.streak, session.bestStreak);
    feedback.textContent = message || (correct ? T("stepDone") : T("tryAgain"));
    feedback.dataset.result = correct ? "correct" : "retry";
    const send = () =>
      emit("feedback", { correct, message: scene?.feedbackText || feedback.textContent });
    if (scene) queueMicrotask(send);
    else send();
  }
  function complete(score) {
    if (sessionDone) return;
    sessionDone = true;
    const accuracy = session.total ? Math.round((100 * session.correct) / session.total) : 0;
    if (score > best) {
      best = score;
      try {
        localStorage.setItem("ewl.studio.best." + slug, String(best));
      } catch (_) {}
    }
    feedback.textContent = T("complete", accuracy, session.bestStreak);
    emit("complete", {
      score,
      correct: session.correct,
      total: session.total,
      message: feedback.textContent,
    });
  }
  function currentQuestion(s) {
    return s.current || s.questions?.[s.qIndex ?? s.currentQ] || s.round;
  }
  function wrap(s, name, before) {
    const original = s[name];
    if (typeof original !== "function") return;
    s[name] = function (...args) {
      before.call(this, ...args);
      return original.apply(this, args);
    };
  }
  function install(s) {
    if (s.__studioInstalled) return;
    s.__studioInstalled = true;
    wrap(s, "submitAnswer", function (i) {
      if (this.answered || this.answerBtns?.[i]?.eliminated || this.removedChoices?.includes(i))
        return;
      const q = currentQuestion(this);
      const choice =
        this.answerBoxes?.[i]?.optText ?? this.answerBtns?.[i]?.optText ?? q?.options?.[i];
      if (q && choice != null)
        track(
          choice === q.correct,
          choice === q.correct ? T("correctPrefix") + (q.explain || "") : T("notYetChoice"),
          this,
        );
    });
    wrap(s, "pick", function (i) {
      if (!this.locked && this.current?.choices?.[i])
        track(
          !!this.current.choices[i].correct,
          this.current.choices[i].correct ? this.current.explain : T("notYetChoice"),
        );
    });
    wrap(s, "forge", function () {
      if (!this.locked && this.current) {
        const r = this.judge();
        track(r.correct, r.correct ? this.current.explain : r.why);
      }
    });
    wrap(s, "grabCell", function (row, i) {
      if (!row.scored && !row.wrong?.includes(i))
        track(
          row.data.bestIdxs.includes(i),
          row.data.bestIdxs.includes(i) ? "" : T("compareSale"),
          this,
        );
    });
    wrap(s, "resolveCorrect", () => track(true, T("built")));
    wrap(s, "resolveWrong", (message) => track(false, message));
    wrap(s, "serve", function () {
      if (!this.round || this.roundLocked) return;
      const r = this.round,
        [a, b] = this.counts;
      track(
        a > 0 && b > 0 && a * r.b === b * r.a && (!r.capacity || a + b === r.capacity),
        T("scaleBoth"),
        this,
      );
    });
    wrap(s, "release", function () {
      if (!this.locked && this.order)
        track(Math.round(this.fill * this.order.jugDen) === this.order.targetNum, T("jugCheck"));
    });
    wrap(s, "completeLevel", function () {
      this.__studioLevelDone = true;
    });
    ["endGame", "gameOver"].forEach((name) =>
      wrap(s, name, function () {
        complete(Number(this.score) || 0);
      }),
    );
    s.events.on("create", () => {
      lastSignature = "";
      s.__studioLevelDone = false;
      if (["Game", "GameScene"].includes(s.scene.key) && !s.score) {
        sessionDone = false;
        session = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
      }
    });
  }
  function setMuted(muted) {
    if (game) game.sound.mute = muted;
    window.__flagshipMuted = muted;
    if (window.GameFX?.AudioSynth) window.GameFX.AudioSynth.muted = muted;
  }
  function pause() {
    if (!game) return;
    pauseStarted = Date.now();
    pausedScenes = game.scene.getScenes(true).map((s) => s.scene.key);
    pausedScenes.forEach((key) => game.scene.pause(key));
    if (scene?.pouring) scene.pouring = false;
    refresh();
  }
  function resume() {
    const delta = Date.now() - pauseStarted;
    pausedScenes.forEach((key) => {
      const s = game.scene.getScene(key);
      ["startTime", "questionStartTime"].forEach((field) => {
        if (typeof s[field] === "number") s[field] += delta;
      });
      game.scene.resume(key);
    });
    pausedScenes = [];
    refresh();
  }
  function start(n) {
    n = Math.max(1, Math.min(config.levels.length, Number(n) || 1));
    level.value = String(n);
    sessionDone = false;
    lastScore = 0;
    session = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
    feedback.textContent = T("selfPaced");
    lastSignature = "";
    if (isFactor || isVolume) {
      window.__flagshipStart?.(n);
      return;
    }
    if (!game) return;
    if (window.GameStudio?.paused) window.GameStudio.resume();
    game.scene.getScenes(true).forEach((s) => game.scene.stop(s.scene.key));
    const key = game.scene.scenes.find((s) => s.scene.key === "GameScene") ? "GameScene" : "Game";
    game.scene.start(key, config.data(n));
    refresh();
  }
  panel.querySelector("#fm-start").addEventListener("click", () => start(level.value));
  // Replace the old cosmetic level buttons with the engine's actual mission selector.
  window.ewlSetLevel = (n) => start(n);
  document.querySelectorAll(".ewl-arcade-controls").forEach((el) => el.remove());
  document.querySelector("#ewl-level-badge")?.remove();
  function button(label, fn, disabled = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.disabled = disabled || !!window.GameStudio?.paused;
    b.addEventListener("click", () => {
      if (!window.GameStudio?.paused) {
        fn();
        refresh();
      }
    });
    actions.append(b);
    return b;
  }
  const money = (n) => "$" + Number(n).toFixed(2);
  function nativeActions(s, q) {
    if (s.__studioLevelDone) {
      const next = s.children.list.find(
        (o) => o.input?.enabled && o.type === "Rectangle" && o.depth === 21,
      );
      button(T("continueMission"), () => next?.emit("pointerdown"), !next);
      return;
    }
    if (s.submitAnswer && q?.options)
      q.options.forEach((o, i) =>
        button(
          `${i + 1}. ${o}`,
          () => s.submitAnswer(i),
          s.answered || s.answerBtns?.[i]?.eliminated,
        ),
      );
    else if (s.pick && q?.choices)
      q.choices.forEach((o, i) => button(`${i + 1}. ${o.label}`, () => s.pick(i), s.locked));
    else if (s.forge && q) {
      const part = q.mode === "partition";
      button(`− ${T("sliceDiv", s.cuts)}`, () => s.nudgeCuts(-1), s.locked);
      button(`+ ${T("sliceDiv", s.cuts)}`, () => s.nudgeCuts(1), s.locked);
      button(
        `− ${T(part ? "pieces" : "groups")} (${part ? s.sel : s.groups})`,
        () => s.nudgeCount(-1),
        s.locked,
      );
      button(
        `+ ${T(part ? "pieces" : "groups")} (${part ? s.sel : s.groups})`,
        () => s.nudgeCount(1),
        s.locked,
      );
      button(T("forge"), () => s.forge(), s.locked);
    } else if (s.addScoop && q) {
      [0, 1].forEach((i) => {
        button(
          "+ " + (q[i === 0 ? "ia" : "ib"]?.name || T("ingredient", i + 1)),
          () => s.addScoop(i),
          s.roundLocked,
        );
        button(
          "− " + (q[i === 0 ? "ia" : "ib"]?.name || T("ingredient", i + 1)),
          () => s.removeScoop(i),
          s.roundLocked,
        );
      });
      button(T("clearMix"), () => s.clearTubes(), s.roundLocked);
      button(T("serve"), () => s.serve(), s.roundLocked);
      button(T("recipeHint"), () => s.showHint(), s.roundLocked);
    } else if (s.confirmGrab) {
      s.row?.data.cells.forEach((cell, i) =>
        button(
          s.laneLabel ? s.laneLabel(i) : T("lane", i + 1, money(cell.base), cell.pct),
          () => {
            s.setLane(i);
            s.confirmGrab();
          },
          s.row.scored || s.row.wrong.includes(i),
        ),
      );
      if (s.row?.scored)
        button(s.round >= (s.maxRounds || 12) ? T("seeResults") : T("nextDeal"), () =>
          s.nextDeal(),
        );
    } else if (s.adjustDim && q) {
      if (q.type === "composite") {
        button(
          q.phase === "slice" ? T("changeSlice") : `− ${T("totalArea")}`,
          () => (q.phase === "slice" ? s.toggleSlice() : s.adjustTotal(-1)),
          s.lockBusy,
        );
        if (q.phase === "total") button(`+ ${T("totalArea")}`, () => s.adjustTotal(1), s.lockBusy);
      } else
        (s.rowKeys || []).forEach((key) => {
          button(`− ${key}: ${q.dims[key]}`, () => s.adjustDim(key, -1), s.lockBusy);
          button(`+ ${key}: ${q.dims[key]}`, () => s.adjustDim(key, 1), s.lockBusy);
        });
      button(T("lock"), () => s.onLock(), s.lockBusy);
    } else if (s.release && s.order) {
      const pour = button(T("pour"), () => {}, s.locked);
      const hold = (e) => {
        if (s.locked || window.GameStudio?.paused) return;
        e.preventDefault();
        s.pouring = true;
        if (e.pointerId != null) pour.setPointerCapture?.(e.pointerId);
      };
      const release = () => {
        if (s.pouring && !s.locked) s.release();
      };
      pour.addEventListener("pointerdown", hold);
      pour.addEventListener("pointerup", release);
      pour.addEventListener("pointercancel", () => {
        s.pouring = false;
      });
      pour.addEventListener("keydown", (e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) hold(e);
      });
      pour.addEventListener("keyup", (e) => {
        if (e.key === " " || e.key === "Enter") release();
      });
      button(
        T("addDivision"),
        () => {
          if (!s.locked) {
            s.fill = Math.min(1, s.fill + 1 / s.order.jugDen);
            s.drawLiquid();
          }
        },
        s.locked,
      );
      button(T("checkFill"), () => s.release(), s.locked);
    } else if (s.currentQ != null && s.paused && q?.choices) {
      const rects = s.children.list.filter(
        (o) => o.input?.enabled && o.type === "Rectangle" && o.width === 105 && o.height === 55,
      );
      q.choices.forEach((o, i) =>
        button(`${i + 1}. ${o}`, () => rects[i]?.emit("pointerdown"), !rects[i]?.input?.enabled),
      );
    }
  }
  function refresh() {
    mountStage();
    if (game) {
      game.scene.scenes.forEach(install);
      scene = game.scene
        .getScenes(true)
        .find((s) => s.scene.key === "Game" || s.scene.key === "GameScene");
    }
    panel.querySelector("#fm-start").disabled =
      !!game &&
      (!game.isRunning || !game.scene.getScenes(true).length) &&
      !window.GameStudio?.paused;
    if (scene) lastScore = Number(scene.score) || 0;
    if (game?.scene.getScenes(true).some((s) => ["Result", "Results"].includes(s.scene.key)))
      complete(lastScore);
    const score = Number(scene?.score ?? window.__flagshipState?.score ?? lastScore) || 0;
    const percent = session.total ? Math.round((session.correct / session.total) * 100) : 0;
    const studioStars = window.GameStudio?.session?.stars;
    panel.querySelector(".fm-stats").textContent =
      T("stats", score, percent, session.streak, best) +
      (Number.isFinite(studioStars) ? `  ·  ${T("stars")} ${studioStars}` : "");
    const q = scene ? currentQuestion(scene) : null;
    let text = q?.prompt || q?.text || scene?.promptText?.text || "";
    if (q?.data) text += T("data") + q.data;
    if (scene?.qText?.text && !text) text = scene.qText.text;
    if (scene?.order)
      text = T(
        "jugOrder",
        scene.orderIndex ?? "",
        scene.order.shownNum,
        scene.order.shownDen,
        scene.order.jugDen,
      );
    if (scene?.orderRatio?.text)
      text =
        scene.orderRatio.text +
        " · " +
        (scene.orderTask?.text || "") +
        " · " +
        T("currentMix") +
        " " +
        scene.counts.join(" : ");
    if (scene?.row?.data) text = scene.rowPrompt ? scene.rowPrompt() : T("lowestLane");
    if (!scene && (isFactor || isVolume)) text = T("useModel");
    if (!scene && !isFactor && !isVolume) text = T("chooseLevel");
    question.textContent = text;
    let modelEl = panel.querySelector(".fm-live-model");
    if (!modelEl) {
      modelEl = document.createElement("div");
      modelEl.className = "fm-live-model";
      modelEl.style.cssText =
        "margin:6px 0 8px;padding:8px 12px;border-radius:10px;background:rgba(56,189,248,0.12);border-left:3px solid #38bdf8;color:#e0f2fe;font-size:0.86rem;font-weight:700;";
      question.after(modelEl);
    }
    if (scene?.round && Array.isArray(scene.counts)) {
      const rA = scene.round.a || 1,
        rB = scene.round.b || 1,
        [cA, cB] = scene.counts;
      const eq = cA > 0 && cB > 0 && cA * rB === cB * rA;
      modelEl.textContent =
        "⚖️ " +
        T("liveRatio", rA, rB, scene.round.hideTotal ? 0 : scene.round.capacity, cA, cB, eq);
    } else if (scene?.forge && q) {
      modelEl.textContent = `🍕 ${T("liveFoundry")}: ${T("cutsInfo", scene.cuts || 1, q.mode === "partition", q.mode === "partition" ? scene.sel || 0 : scene.groups || 0)}`;
    } else if (scene?.order) {
      modelEl.textContent = `🧪 ${T("liveJug", Math.round((scene.fill || 0) * scene.order.jugDen), scene.order.jugDen, scene.order.shownNum, scene.order.shownDen)}`;
    } else {
      modelEl.textContent = `🔬 ${C("topic")}: ${C("coach")}`;
    }
    const signature = JSON.stringify([
      lang(),
      scene?.scene.key,
      scene?.qIndex,
      scene?.currentQ,
      q?.prompt,
      q?.text,
      q?.dims,
      q?.phase,
      q?.total,
      scene?.cuts,
      scene?.sel,
      scene?.groups,
      scene?.counts,
      scene?.row?.scored,
      scene?.row?.wrong,
      typeof scene?.round === "number" ? scene.round : null,
      scene?.locked,
      scene?.answered,
      scene?.roundLocked,
      scene?.lockBusy,
      scene?.__studioLevelDone,
      scene?.answerBtns?.map((b) => b.eliminated),
      window.GameStudio?.paused,
    ]);
    if (signature !== lastSignature) {
      const focusIndex = [...actions.children].indexOf(document.activeElement);
      lastSignature = signature;
      actions.replaceChildren();
      if (scene) nativeActions(scene, q);
      if (focusIndex >= 0) actions.children[focusIndex]?.focus({ preventScroll: true });
    }
    const completed =
      scene?.qIndex ??
      scene?.shapesPlaced ??
      scene?.served ??
      window.__flagshipState?.completed ??
      window.__flagshipState?.sealed ??
      0;
    const total = scene?.totalQ ?? scene?.maxRounds ?? scene?.queue?.length ?? 10;
    panel.querySelector(".fm-progress span").style.width =
      Math.min(100, (completed / total) * 100) + "%";
  }
  document.addEventListener("ewl:lang", () => {
    relabelPanel();
    lastSignature = "";
    refresh();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "nt-lang")
      document.dispatchEvent(new CustomEvent("ewl:lang", { detail: { lang: lang() } }));
  });
  if (window.GameStudio)
    window.GameStudio.register({
      title: document.title,
      instructions: UI.howTo[lang()],
      ...(game ? { pause, resume } : {}),
      setMuted,
      setMotion: (reduced) => {
        window.__flagshipReduced = reduced;
        game?.scene.scenes.forEach((s) => {
          s.reduceMotion = reduced;
          s.reducedMotion = reduced;
        });
      },
    });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.GameStudio?.[window.GameStudio.paused ? "resume" : "pause"]();
      }
    },
    true,
  );
  document.addEventListener("flagship:answer", (e) => track(e.detail.correct, e.detail.message));
  if (window.__flagshipOnFeedback) window.__flagshipOnFeedback(track, complete);
  refresh();
  setInterval(refresh, 180);
})();
