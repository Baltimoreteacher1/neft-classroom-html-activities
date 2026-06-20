/* ============================================================
   NEFT CITY: WATER WATCH — Living School simulation (Chapter 2)
   Vanilla JS. No dependencies, no backend, no external APIs.
   All "AI-style" feedback is generated locally from student work.

   Theme: mean vs. median + OUTLIERS (6.SP statistics).
   15 households report weekly water use (gallons). One mansion is a
   huge outlier (120) that pulls the MEAN up to 43 while the MEDIAN
   stays at 38 — the median better represents the typical household.

   Architecture (mirrors Chapter 1):
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
  // 15 households, weekly water use in gallons. The last value (120) is the
  // mansion outlier that drives the whole lesson.
  const DATASET = [30, 35, 40, 38, 42, 33, 37, 41, 39, 36, 44, 32, 40, 38, 120];
  const SORTED = [...DATASET].sort((a, b) => a - b); // 30,32,33,35,36,37,38,38,39,40,40,41,42,44,120

  const ANSWERS = {
    mean: 43, // 645 / 15
    median: 38, // 8th of 15
    mode: [38, 40], // each appears twice
    range: 90, // 120 - 30
  };

  const HISTO = {
    intervals: ["30–49", "50–69", "70–89", "90–109", "110–129"],
    correct: [14, 0, 0, 0, 1],
    max: 15,
  };

  const BEST_CHOICE = "A";

  const STEPS = [
    { id: "enter", labelKey: "stepEnter", icon: "🚪" },
    { id: "briefing", labelKey: "stepBriefing", icon: "🏛️" },
    { id: "datalab", labelKey: "stepDatalab", icon: "🔬" },
    { id: "graph", labelKey: "stepGraph", icon: "📊" },
    { id: "decision", labelKey: "stepDecision", icon: "🗳️" },
    { id: "reaction", labelKey: "stepReaction", icon: "🌆" },
    { id: "news", labelKey: "stepNews", icon: "📰" },
    { id: "passport", labelKey: "stepPassport", icon: "🪪" },
  ];

  // Vocabulary is shown bilingually (English + Español) for ESOL learners.
  const VOCAB = [
    { term: "data", es: "datos", def: "Facts and numbers we collect to learn something.", ex: "The 15 water totals are our data.", defEs: "Hechos y números que reunimos para aprender algo.", exEs: "Los 15 totales de agua son nuestros datos." },
    { term: "mean", es: "media", def: "The average. Add all the numbers, then divide by how many there are.", ex: "Mean = total ÷ number of values.", defEs: "El promedio. Suma todos los números y divide entre cuántos hay.", exEs: "Media = total ÷ número de valores." },
    { term: "median", es: "mediana", def: "The middle number after you sort from least to greatest.", ex: "With 15 numbers, the median is the 8th one.", defEs: "El número del medio después de ordenar de menor a mayor.", exEs: "Con 15 números, la mediana es el 8.º." },
    { term: "mode", es: "moda", def: "The number that appears the most. There can be more than one.", ex: "If 38 and 40 tie for most, both are modes.", defEs: "El número que aparece más veces. Puede haber más de uno.", exEs: "Si el 38 y el 40 empatan, ambos son modas." },
    { term: "range", es: "rango", def: "The distance from the smallest to the largest number.", ex: "Range = greatest − least.", defEs: "La distancia del número más pequeño al más grande.", exEs: "Rango = mayor − menor." },
    { term: "outlier", es: "valor atípico", def: "A value that is very different from the others — much higher or lower.", ex: "The mansion's 120 gallons is an outlier.", defEs: "Un valor muy diferente de los demás — mucho más alto o bajo.", exEs: "Los 120 galones de la mansión son un valor atípico." },
    { term: "typical", es: "típico", def: "What is usual or normal for most of the group.", ex: "A typical household uses about 38 gallons.", defEs: "Lo usual o normal para la mayoría del grupo.", exEs: "Un hogar típico usa unos 38 galones." },
    { term: "histogram", es: "histograma", def: "A bar graph that shows how many values fall into each group (interval).", ex: "Each bar shows how many homes used that much.", defEs: "Una gráfica de barras que muestra cuántos valores caen en cada grupo (intervalo).", exEs: "Cada barra muestra cuántos hogares usaron esa cantidad." },
    { term: "evidence", es: "evidencia", def: "Proof from your data that supports your idea.", ex: "“The median was 38 gallons” is evidence.", defEs: "Prueba de tus datos que apoya tu idea.", exEs: "“La mediana fue 38 galones” es evidencia." },
  ];

  const DECISION_STARTERS = [
    "The data shows ",
    "The typical household uses ",
    "The outlier was ",
    "I recommend ",
    "One piece of evidence is ",
    "Another piece of evidence is ",
  ];

  const NEWS_WORDS = ["data", "mean", "median", "mode", "range", "outlier", "histogram", "typical", "recommend"];
  const NEWS_FRAMES = [
    "Neft City studied ",
    "The data showed ",
    "The outlier was ",
    "I recommend ",
  ];

  const SKILLS = [
    { key: "sort", label: "I can sort data." },
    { key: "calc", label: "I can find mean, median, mode, and range." },
    { key: "graph", label: "I can build a graph from data." },
    { key: "skew", label: "I can explain why the median fits skewed data." },
    { key: "recommend", label: "I can make a recommendation using evidence." },
    { key: "revise", label: "I can revise my thinking." },
  ];

  const ROLE_FLAVOR = {
    "Data Analyst": "As our Data Analyst, you'll dig into the numbers first.",
    "City Planner": "As our City Planner, you'll picture how a water plan changes the city.",
    "News Reporter": "As our News Reporter, you'll explain the story to the whole city.",
    "Water Engineer": "As our Water Engineer, you'll think about how to keep water flowing fairly.",
    "Community Advocate": "As our Community Advocate, you'll speak up for the families in the city.",
  };

  const ROLE_FLAVOR_ES = {
    "Data Analyst": "Como Analista de Datos, primero explorarás los números.",
    "City Planner": "Como Planificador de la Ciudad, imaginarás cómo un plan de agua cambia la ciudad.",
    "News Reporter": "Como Reportero de Noticias, explicarás la historia a toda la ciudad.",
    "Water Engineer": "Como Ingeniero de Agua, pensarás cómo mantener el agua fluyendo de forma justa.",
    "Community Advocate": "Como Defensor de la Comunidad, hablarás por las familias de la ciudad.",
  };

  const DECISION_STARTERS_ES = [
    "Los datos muestran ",
    "El hogar típico usa ",
    "El valor atípico fue ",
    "Recomiendo ",
    "Una pieza de evidencia es ",
    "Otra pieza de evidencia es ",
  ];

  const NEWS_FRAMES_ES = [
    "Neft City estudió ",
    "Los datos mostraron ",
    "El valor atípico fue ",
    "Recomiendo ",
  ];

  // Spanish strings for static elements tagged with data-i18n / data-i18n-html.
  // English comes from the captured DOM, so only Spanish lives here.
  const I18N_ES = {
    "ui.vocab": "📘 Vocabulario", "ui.back": "← Atrás", "ui.clear": "Borrar",
    "ui.check": "Revisar", "ui.tryit": "Inténtalo",
    "enter.eyebrow": "Living School · Capítulo 2",
    "enter.intro": "La ciudad de Neft tiene una <strong>escasez de agua</strong>. El alcalde necesita que tu equipo estudie cuánta <strong>agua</strong> usa cada hogar y recomiende un plan justo. ¿Listo para ayudar?",
    "enter.nameLabel": "Primero, dinos tu <strong>nombre</strong>",
    "enter.nameHelp": "Lo usamos en tu reporte final.",
    "enter.roleLegend": "Elige tu <strong>rol</strong> en el equipo de la ciudad",
    "role.analyst": "Te encantan los números y los patrones.",
    "role.planner": "Diseñas cómo funciona la ciudad.",
    "role.reporter": "Cuentas la historia de la ciudad.",
    "role.engineer": "Mantienes el agua de la ciudad fluyendo.",
    "role.advocate": "Hablas por la gente.",
    "enter.start": "Entrar a Neft City →",
    "briefing.title": "🏛️ Informe de la Misión",
    "briefing.goalsTitle": "🎯 Metas de tu Misión",
    "briefing.goal1": "Ordena los datos de menor a mayor.",
    "briefing.goal2": "Halla la <em>media, mediana, moda</em> y el <em>rango</em>.",
    "briefing.goal3": "Construye un histograma (gráfica de barras) del uso de agua.",
    "briefing.goal4": "Halla el <em>valor atípico</em> y decide cuál medida es justa.",
    "briefing.goal5": "Recomienda una política y explícala con <em>evidencia</em>.",
    "briefing.vocabHint": "¿Palabra nueva? Toca una palabra azul para ver qué significa:",
    "briefing.next": "Ir al Laboratorio de Datos →",
    "datalab.title": "🔬 Laboratorio de Datos",
    "datalab.intro": "Aquí están los <strong>15 totales de agua por semana</strong> (en galones). Haz clic en los números en orden de <strong>menor a mayor</strong> para ordenarlos.",
    "datalab.step1": "Paso 1 · Ordena los datos",
    "datalab.step1help": "Haz clic en un número para ponerlo en fila. Haz clic en un número colocado para devolverlo.",
    "datalab.poolLabel": "Números por ordenar",
    "datalab.trayLabel": "Fila ordenada (menor → mayor)",
    "datalab.checkSort": "Revisar Orden",
    "datalab.step2": "Paso 2 · Halla los valores",
    "datalab.step2help": "Usa las tarjetas de fórmulas para ayudarte. Después de dos intentos verás una pista.",
    "datalab.next": "Construir la Gráfica →",
    "graph.title": "📊 Construye el Histograma",
    "graph.lead": "Cuenta cuántos hogares caen en cada intervalo. Usa <strong>+</strong> y <strong>−</strong> (o haz clic en una barra) para fijar la altura de cada barra.",
    "graph.check": "Revisar Gráfica",
    "graph.reset": "Reiniciar barras",
    "graph.interpTitle": "Interpreta tu gráfica",
    "graph.checkAnswers": "Revisar Respuestas",
    "graph.next": "Ir a la Sala de Decisiones →",
    "decision.title": "🗳️ Sala de Decisiones",
    "decision.council": "Concejo de la Ciudad",
    "decision.prompt": "¿Qué política de conservación debe fijar Neft City? Elige una recomendación y explícala con <strong>evidencia</strong> de tus datos.",
    "decision.choiceA": "Basar la meta en el uso TÍPICO (mediana ≈ 38 galones) y trabajar con los pocos usuarios extremos.",
    "decision.choiceB": "Fijar la meta en la media (43 galones) para todos.",
    "decision.choiceC": "No hacer nada — el uso de agua está bien.",
    "decision.choiceD": "Prohibir todo uso de agua los fines de semana.",
    "decision.explainTitle": "Explica con evidencia",
    "decision.explainHelp": "Usa al menos <strong>dos piezas de evidencia</strong> de tus datos y tu gráfica. (Al menos 18 palabras.)",
    "decision.submit": "Enviar Recomendación",
    "reaction.title": "🌆 Reacción de la Ciudad",
    "reaction.status": "Estado de la Ciudad",
    "reaction.revise": "← Revisar Decisión",
    "reaction.next": "Escribir el Reporte de Noticias →",
    "skew.title": "💧 Por qué la media y la mediana no coinciden",
    "skew.intro": "Una mansión usó <strong>120 galones</strong> — un <em>valor atípico</em>. Jala la <strong>media</strong> hacia arriba, pero la <strong>mediana</strong> se queda cerca de lo que la mayoría de los hogares realmente usa.",
    "skew.meanLabel": "Media (promedio)",
    "skew.meanNote": "Elevada por la mansión",
    "skew.medianLabel": "Mediana (del medio)",
    "skew.medianNote": "Más cerca de un hogar típico",
    "skew.takeaway": "La mediana (38) representa mejor al hogar TÍPICO. Una meta justa trabaja con los pocos usuarios extremos.",
    "news.title": "📰 Noticias de Neft City",
    "news.lead": "Escribe un breve reporte público: <strong>3 a 5 oraciones</strong> sobre la escasez de agua, qué mostraron los datos y qué debe hacer Neft City. (Al menos 35 palabras.)",
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
      check: "Check", tryit: "Try it", solved: "✓ Solved", gallons: "gallons",
      meanName: "Mean (average)", medianName: "Median (middle)", modeName: "Mode (most common)", rangeName: "Range (spread)",
      mTrust: "Public Trust", mCrisis: "Water Crisis", mConfidence: "Data Confidence", mExplanation: "Explanation Strength",
      welcome: ", welcome to the team! ", welcomeNoName: "Welcome to the team! ",
      briefBody: "Neft City has a <strong>water shortage</strong>. We collected the weekly water use (in gallons) from <strong>15 households</strong>. Your job: analyze the data and tell us a <strong>fair</strong> way to save water.",
      skillSort: "I can sort data.",
      skillCalc: "I can find mean, median, mode, and range.",
      skillGraph: "I can build a graph from data.",
      skillSkew: "I can explain why the median fits skewed data.",
      skillRecommend: "I can make a recommendation using evidence.",
      skillRevise: "I can revise my thinking.",
      outGood: "Your team used strong data evidence. Neft City sets a fair target near the typical household (38 gallons) and works with the few extreme users. Water use begins to drop.",
      outMedium: "Your team found some useful evidence, but the city needs a clearer explanation of why the median is fairer before approving the plan.",
      outRevise: "The city made a rushed decision and the plan was unfair to typical families. Your team must revise the water report.",
      ppApproved: "Fair conservation plan approved 🎉", ppReview: "Plan under review 🤔", ppRevise: "Report sent back for revision ⚠️",

      // navigation / gating
      lockStep: "🔒 Finish the current step first!",

      // sort feedback
      sortPlaceAll1: "Place all ", sortPlaceAll2: " numbers first. You have ",
      sortPerfect: "✅ Perfect! The data is sorted least → greatest. Calculations unlocked!",
      sortBadOrder: "Check the order. The numbers should go from least to greatest. Look at the highlighted spot.",

      // calc feedback
      calcTypeFirst: "Type your answer first.",
      calcCorrect: "✅ Correct! Nice work.",
      calcCorrectShort: "✓ Correct!",
      calcHintOpen1: "", calcHintOpen2: " A hint is now open below. 💡",
      // mean misses
      missMeanTotal: "That's the total. Now divide by the number of values (15).",
      missMeanMedian: "That's the median, not the mean. Mean = total ÷ number of values.",
      missMeanGeneric: "Not yet. Mean = total ÷ number of values. Total is 645.",
      // median misses
      missMedianMean: "That's the mean, not the median. The median is the middle value of the sorted list.",
      missMedianClose: "Close. Count carefully — with 15 values, the middle is the 8th one.",
      missMedianGeneric: "Not yet. The median is the middle value (the 8th of 15) after sorting.",
      // mode misses
      missModeOne: "There is more than one mode here. Look for every number that ties for most.",
      missModeGeneric: "Not yet. Find every number that appears the most times (each appears twice).",
      // range misses
      missRangeAdd: "That looks like greatest + least. Range uses subtraction: greatest − least.",
      missRangeGeneric: "Not yet. Range = greatest − least (120 − 30).",
      missGeneric: "Not quite — try again.",

      // graph feedback
      graphSuccess: "✅ Your histogram matches the data! Notice the lone bar way out at 110–129 — that's the outlier. Interpretation unlocked.",
      graphRecount: "Check the red bars. Count again from the sorted data.",
      graphSum1: "Your bars add up to ", graphSum2: ", but there are ", graphSum3: " households. Recount each interval.",

      // interpretation feedback
      interpSuccess: "✅ Great reading of the data! You see why the median fits skewed data. The Decision Room is open.",
      interpScore1: "You have ", interpScore2: " of ", interpScore3: " multiple-choice answers correct.",
      interpWriteSentence: " Also write at least one full sentence in the response box.",
      interpTryAgain: " Look at the highlighted answers and try again.",
      interpWritePrompt: "In one sentence: why does the outlier make the mean a poor measure of the typical household? (written response)",
      interpWritePlaceholder: "Type one sentence about the outlier and the mean…",

      // decision feedback
      decisionPick: "Pick a recommendation (A, B, C, or D) first.",
      decisionWords1: "Write at least 18 words of evidence. You have ", decisionWords2: ".",
      decisionAccepted: "✅ The city council is convinced! Heading to City Reaction…",
      decisionRevise: "🏛️ The city council is not convinced yet. Look back at your data and revise. (Hint: the mean (43) is pulled up by the 120-gallon outlier — the median (38) is closer to a typical home.)",

      // news feedback
      newsWords1: "Write at least 35 words. You have ", newsWords2: ".",
      newsPublished: "✅ Published! Generating your Proof-of-Learning Passport…",

      // calc placeholders / aria
      egPrefix: "e.g. ",
      ariaMean: "Mean answer", ariaMedian: "Median answer", ariaMode: "Mode answer", ariaRange: "Range answer",

      // calc hints
      hintBtn: "Hint",
      hintMean: "Add all 15 numbers (total = 645). Then divide: 645 ÷ 15.",
      hintMedian: "With 15 sorted numbers, the middle is the 8th value. Count to the 8th: it is 38.",
      hintMode: "Count each number. 38 appears twice and 40 appears twice. Two modes!",
      hintRange: "Greatest − least = 120 − 30.",

      // XP toast labels
      xpSorted: "Data sorted!",
      xpSolvedSuffix: " solved!",
      xpHistogram: "Histogram built!",
      xpInterp: "Graph interpreted!",
      xpAccepted: "Recommendation accepted!",
      xpRevision: "Revision needed",
      xpNews: "News published!",
      xpDownloaded: "⬇️ Progress downloaded",

      // reset
      resetConfirm: "Reset the whole mission? This clears all your work on this device.",

      // aria labels
      chipPlaced: ", placed. Click to remove.",
      chipPool: ". Click to place in sorted line.",
      barFor: "Bar for ", barGallons: " gallons",
      barDecrease1: "Decrease ", barDecrease2: " bar",
      barIncrease1: "Increase ", barIncrease2: " bar",
      lockedSuffix: " (locked)",

      // progress step labels
      stepEnter: "Enter City", stepBriefing: "Briefing", stepDatalab: "Data Lab",
      stepGraph: "Graph", stepDecision: "Decision", stepReaction: "City",
      stepNews: "News", stepPassport: "Passport",

      // passport fallbacks
      ppNameFallback: "Student", ppRoleFallback: "City Team",
    },
    es: {
      startReady: "¡Listo! Presiona el botón para comenzar.",
      startAdd: "Agrega tu nombre y elige un rol para comenzar.",
      locked: "🔒 Bloqueado", unlocked: "🔓 Desbloqueado",
      check: "Revisar", tryit: "Inténtalo", solved: "✓ Resuelto", gallons: "galones",
      meanName: "Media (promedio)", medianName: "Mediana (del medio)", modeName: "Moda (más común)", rangeName: "Rango (amplitud)",
      mTrust: "Confianza Pública", mCrisis: "Crisis del Agua", mConfidence: "Confianza en Datos", mExplanation: "Fuerza de Explicación",
      welcome: ", ¡bienvenido al equipo! ", welcomeNoName: "¡Bienvenido al equipo! ",
      briefBody: "La ciudad de Neft tiene una <strong>escasez de agua</strong>. Reunimos el uso semanal de agua (en galones) de <strong>15 hogares</strong>. Tu trabajo: analiza los datos y dinos una forma <strong>justa</strong> de ahorrar agua.",
      skillSort: "Puedo ordenar datos.",
      skillCalc: "Puedo hallar media, mediana, moda y rango.",
      skillGraph: "Puedo construir una gráfica con datos.",
      skillSkew: "Puedo explicar por qué la mediana sirve para datos sesgados.",
      skillRecommend: "Puedo hacer una recomendación usando evidencia.",
      skillRevise: "Puedo revisar mi pensamiento.",
      outGood: "Tu equipo usó evidencia sólida. Neft City fija una meta justa cerca del hogar típico (38 galones) y trabaja con los pocos usuarios extremos. El uso de agua empieza a bajar.",
      outMedium: "Tu equipo encontró evidencia útil, pero la ciudad necesita una explicación más clara de por qué la mediana es más justa antes de aprobar el plan.",
      outRevise: "La ciudad tomó una decisión apresurada y el plan fue injusto para las familias típicas. Tu equipo debe revisar el reporte del agua.",
      ppApproved: "Plan justo de conservación aprobado 🎉", ppReview: "Plan en revisión 🤔", ppRevise: "Reporte devuelto para revisión ⚠️",

      // navigation / gating
      lockStep: "🔒 ¡Termina el paso actual primero!",

      // sort feedback
      sortPlaceAll1: "Coloca primero los ", sortPlaceAll2: " números. Tienes ",
      sortPerfect: "✅ ¡Perfecto! Los datos están ordenados de menor → mayor. ¡Cálculos desbloqueados!",
      sortBadOrder: "Revisa el orden. Los números deben ir de menor a mayor. Mira el lugar resaltado.",

      // calc feedback
      calcTypeFirst: "Escribe tu respuesta primero.",
      calcCorrect: "✅ ¡Correcto! Buen trabajo.",
      calcCorrectShort: "✓ ¡Correcto!",
      calcHintOpen1: "", calcHintOpen2: " Ahora hay una pista abierta abajo. 💡",
      // mean misses
      missMeanTotal: "Ese es el total. Ahora divide entre el número de valores (15).",
      missMeanMedian: "Esa es la mediana, no la media. Media = total ÷ número de valores.",
      missMeanGeneric: "Todavía no. Media = total ÷ número de valores. El total es 645.",
      // median misses
      missMedianMean: "Esa es la media, no la mediana. La mediana es el valor del medio de la lista ordenada.",
      missMedianClose: "Casi. Cuenta con cuidado — con 15 valores, el del medio es el 8.º.",
      missMedianGeneric: "Todavía no. La mediana es el valor del medio (el 8.º de 15) después de ordenar.",
      // mode misses
      missModeOne: "Aquí hay más de una moda. Busca cada número que empate como el más frecuente.",
      missModeGeneric: "Todavía no. Halla cada número que aparece más veces (cada uno aparece dos veces).",
      // range misses
      missRangeAdd: "Eso parece mayor + menor. El rango usa resta: mayor − menor.",
      missRangeGeneric: "Todavía no. Rango = mayor − menor (120 − 30).",
      missGeneric: "No exactamente — inténtalo de nuevo.",

      // graph feedback
      graphSuccess: "✅ ¡Tu histograma coincide con los datos! Fíjate en la barra solitaria allá en 110–129 — ese es el valor atípico. Interpretación desbloqueada.",
      graphRecount: "Revisa las barras rojas. Cuenta de nuevo desde los datos ordenados.",
      graphSum1: "Tus barras suman ", graphSum2: ", pero hay ", graphSum3: " hogares. Vuelve a contar cada intervalo.",

      // interpretation feedback
      interpSuccess: "✅ ¡Gran lectura de los datos! Ves por qué la mediana sirve para datos sesgados. La Sala de Decisiones está abierta.",
      interpScore1: "Tienes ", interpScore2: " de ", interpScore3: " respuestas de opción múltiple correctas.",
      interpWriteSentence: " También escribe al menos una oración completa en la caja de respuesta.",
      interpTryAgain: " Mira las respuestas resaltadas e inténtalo de nuevo.",
      interpWritePrompt: "En una oración: ¿por qué el valor atípico hace que la media sea una mala medida del hogar típico? (respuesta escrita)",
      interpWritePlaceholder: "Escribe una oración sobre el valor atípico y la media…",

      // decision feedback
      decisionPick: "Elige primero una recomendación (A, B, C o D).",
      decisionWords1: "Escribe al menos 18 palabras de evidencia. Tienes ", decisionWords2: ".",
      decisionAccepted: "✅ ¡El concejo de la ciudad está convencido! Pasando a la Reacción de la Ciudad…",
      decisionRevise: "🏛️ El concejo de la ciudad aún no está convencido. Repasa tus datos y revisa. (Pista: la media (43) está elevada por el valor atípico de 120 galones — la mediana (38) está más cerca de un hogar típico.)",

      // news feedback
      newsWords1: "Escribe al menos 35 palabras. Tienes ", newsWords2: ".",
      newsPublished: "✅ ¡Publicado! Generando tu Pasaporte de Aprendizaje…",

      // calc placeholders / aria
      egPrefix: "p. ej. ",
      ariaMean: "Respuesta de la media", ariaMedian: "Respuesta de la mediana", ariaMode: "Respuesta de la moda", ariaRange: "Respuesta del rango",

      // calc hints
      hintBtn: "Pista",
      hintMean: "Suma los 15 números (total = 645). Luego divide: 645 ÷ 15.",
      hintMedian: "Con 15 números ordenados, el del medio es el 8.º valor. Cuenta hasta el 8.º: es 38.",
      hintMode: "Cuenta cada número. El 38 aparece dos veces y el 40 aparece dos veces. ¡Dos modas!",
      hintRange: "Mayor − menor = 120 − 30.",

      // XP toast labels
      xpSorted: "¡Datos ordenados!",
      xpSolvedSuffix: " resuelto!",
      xpHistogram: "¡Histograma construido!",
      xpInterp: "¡Gráfica interpretada!",
      xpAccepted: "¡Recomendación aceptada!",
      xpRevision: "Se necesita revisión",
      xpNews: "¡Noticia publicada!",
      xpDownloaded: "⬇️ Progreso descargado",

      // reset
      resetConfirm: "¿Reiniciar toda la misión? Esto borra todo tu trabajo en este dispositivo.",

      // aria labels
      chipPlaced: ", colocado. Haz clic para quitar.",
      chipPool: ". Haz clic para colocar en la fila ordenada.",
      barFor: "Barra de ", barGallons: " galones",
      barDecrease1: "Disminuir la barra de ", barDecrease2: "",
      barIncrease1: "Aumentar la barra de ", barIncrease2: "",
      lockedSuffix: " (bloqueado)",

      // progress step labels
      stepEnter: "Entrar", stepBriefing: "Informe", stepDatalab: "Laboratorio",
      stepGraph: "Gráfica", stepDecision: "Decisión", stepReaction: "Ciudad",
      stepNews: "Noticias", stepPassport: "Pasaporte",

      // passport fallbacks
      ppNameFallback: "Estudiante", ppRoleFallback: "Equipo de la Ciudad",
    },
  };

  const STORAGE_KEY = "neftcity_waterwatch_v1";

  /* ============================ STATE ============================ */
  const defaultState = () => ({
    name: "",
    role: "",
    lang: "en", // "en" | "es"
    current: "enter",
    maxStep: 0, // highest unlocked step index
    sort: { tray: [], solved: false },
    calc: {
      mean: { value: "", attempts: 0, solved: false, hint: false },
      median: { value: "", attempts: 0, solved: false, hint: false },
      mode: { value: "", attempts: 0, solved: false, hint: false },
      range: { value: "", attempts: 0, solved: false, hint: false },
    },
    graph: { bars: [0, 0, 0, 0, 0], solved: false },
    interp: { answers: {}, written: "", solved: false },
    decision: { choice: "", text: "", submitted: false, accepted: false, revisions: 0 },
    news: { text: "", submitted: false },
    reflect: { r1: "", r2: "" },
    meters: { trust: 0, crisis: 0, confidence: 0, explanation: 0 },
    outcomeTier: "", // good | medium | revise
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
    renderProgress();
    renderBriefing();
    renderSort();
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
      toast(t("lockStep"));
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
      const label = t(step.labelKey);
      li.innerHTML = `<span class="ps-num" aria-hidden="true">${i < state.maxStep ? "✓" : i + 1}</span><span class="ps-label">${label}</span>`;
      li.setAttribute("role", "button");
      li.tabIndex = locked ? -1 : 0;
      li.setAttribute("aria-label", `${label}${locked ? t("lockedSuffix") : ""}`);
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

  /* ============================ 3. DATA LAB — SORT ============================ */
  function renderSort() {
    const pool = $("#sortPool");
    const tray = $("#sortTray");
    pool.innerHTML = "";
    tray.innerHTML = "";

    // numbers still in pool = dataset minus what's in tray (by position-aware multiset)
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
    b.className = "num-chip" + (inTray ? " in-tray" : "");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", inTray ? `${n}${t("chipPlaced")}` : `${n}${t("chipPool")}`);
    return b;
  }

  function checkSort() {
    const fb = $("#sortFeedback");
    const tray = state.sort.tray;
    if (tray.length < DATASET.length) {
      setFeedback(fb, "no", `${t("sortPlaceAll1")}${DATASET.length}${t("sortPlaceAll2")}${tray.length}.`);
      return;
    }
    const correct = tray.every((n, i) => n === SORTED[i]);
    if (correct) {
      state.sort.solved = true;
      save();
      setFeedback(fb, "ok", t("sortPerfect"));
      markSortSolved();
      awardXp(t("xpSorted"));
    } else {
      // find first out-of-order index for targeted hint
      let firstBad = tray.findIndex((n, i) => n !== SORTED[i]);
      $$("#sortTray .num-chip").forEach((c, i) => {
        c.classList.toggle("bad", i >= firstBad);
      });
      setFeedback(fb, "no", t("sortBadOrder"));
    }
  }

  function markSortSolved() {
    $$("#sortTray .num-chip").forEach((c) => c.classList.remove("bad"));
    $("#calcBlock").classList.remove("locked");
    $("#calcBlock").setAttribute("aria-disabled", "false");
    $("#calcLockTag").textContent = t("unlocked");
    $("#calcLockTag").classList.add("unlocked");
  }

  /* ============================ 3. DATA LAB — CALCULATIONS ============================ */
  const CALC_DEFS = [
    { key: "mean", nameKey: "meanName", eg: "43", hintKey: "hintMean", ariaKey: "ariaMean" },
    { key: "median", nameKey: "medianName", eg: "38", hintKey: "hintMedian", ariaKey: "ariaMedian" },
    { key: "mode", nameKey: "modeName", eg: "38, 40", hintKey: "hintMode", ariaKey: "ariaMode" },
    { key: "range", nameKey: "rangeName", eg: "90", hintKey: "hintRange", ariaKey: "ariaRange" },
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
          <input type="text" inputmode="decimal" id="input-${def.key}" value="${escapeAttr(c.value)}"
            placeholder="${t("egPrefix")}${def.eg}" aria-label="${t(def.ariaKey)}" ${c.solved ? "disabled" : ""} />
          <button class="btn-primary" type="button" id="check-${def.key}" ${c.solved ? "disabled" : ""}>${t("check")}</button>
          <button class="btn-hint" type="button" id="hint-${def.key}">💡 ${t("hintBtn")}</button>
        </div>
        <p class="feedback" id="fb-${def.key}" role="status" aria-live="polite"></p>
        <div class="hintcard ${c.hint ? "show" : ""}" id="hintcard-${def.key}">💡 ${t(def.hintKey)}</div>
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

      if (c.solved) setFeedback($(`#fb-${def.key}`), "ok", t("calcCorrectShort"));
    });
    refreshDataLabGate();
  }

  function checkCalc(key) {
    const c = state.calc[key];
    const fb = $(`#fb-${key}`);
    const raw = $(`#input-${key}`).value.trim();
    c.value = raw;
    if (raw === "") { setFeedback(fb, "no", t("calcTypeFirst")); save(); return; }

    const ok = validateCalc(key, raw);
    if (ok) {
      c.solved = true;
      save();
      setFeedback(fb, "ok", t("calcCorrect"));
      $(`#state-${key}`).textContent = t("solved");
      $(`#state-${key}`).classList.add("solved");
      $(`#input-${key}`).disabled = true;
      $(`#check-${key}`).disabled = true;
      awardXp(`${t(CALC_DEFS.find((d) => d.key === key).nameKey).split(" ")[0]}${t("xpSolvedSuffix")}`);
      refreshDataLabGate();
    } else {
      c.attempts++;
      save();
      let msg = calcMissMessage(key, raw);
      if (c.attempts >= 2) {
        c.hint = true;
        $(`#hintcard-${key}`).classList.add("show");
        setFeedback(fb, "tip", `${t("calcHintOpen1")}${msg}${t("calcHintOpen2")}`);
      } else {
        setFeedback(fb, "no", msg);
      }
    }
  }

  function validateCalc(key, raw) {
    if (key === "mode") {
      const nums = (raw.match(/\d+/g) || []).map(Number);
      const set = new Set(nums);
      return set.size === ANSWERS.mode.length && ANSWERS.mode.every((m) => set.has(m));
    }
    const v = parseFloat(raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(v)) return false;
    if (key === "mean") return Math.abs(v - ANSWERS.mean) < 0.05;
    return Math.abs(v - ANSWERS[key]) < 0.001;
  }

  // Targeted, misconception-aware feedback (generated locally).
  function calcMissMessage(key, raw) {
    const v = parseFloat(raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
    if (key === "mean") {
      if (Math.abs(v - 645) < 0.5) return t("missMeanTotal");
      if (Math.abs(v - 38) < 0.001) return t("missMeanMedian");
      return t("missMeanGeneric");
    }
    if (key === "median") {
      if (Math.abs(v - 43) < 0.05) return t("missMedianMean");
      if (Math.abs(v - 40) < 0.001) return t("missMedianClose");
      return t("missMedianGeneric");
    }
    if (key === "mode") {
      const nums = (raw.match(/\d+/g) || []).map(Number);
      if (nums.length === 1) return t("missModeOne");
      return t("missModeGeneric");
    }
    if (key === "range") {
      if (Math.abs(v - 150) < 0.001) return t("missRangeAdd");
      return t("missRangeGeneric");
    }
    return t("missGeneric");
  }

  function refreshDataLabGate() {
    const allSolved = state.sort.solved && CALC_DEFS.every((d) => state.calc[d.key].solved);
    const btn = $("#toGraphBtn");
    if (btn) btn.disabled = !allSolved;
    if (allSolved) unlock("graph");
  }

  /* ============================ 4. GRAPH ============================ */
  function renderGraph() {
    const wrap = $("#histogram");
    wrap.innerHTML = "";
    HISTO.intervals.forEach((label, i) => {
      const col = document.createElement("div");
      col.className = "hbar-col";
      // The last interval (110–129) holds the lone mansion outlier; flag it
      // so it gets the gold highlight the styles define.
      const isOutlier = i === HISTO.intervals.length - 1;
      col.innerHTML = `
        <div class="hbar-track" id="track-${i}" role="slider" tabindex="0"
             aria-label="${t("barFor")}${label}${t("barGallons")}" aria-valuemin="0" aria-valuemax="${HISTO.max}" aria-valuenow="${state.graph.bars[i]}">
          <div class="hbar${isOutlier ? " is-outlier" : ""}" id="bar-${i}"><span class="hbar-val" id="barval-${i}">${state.graph.bars[i]}</span></div>
        </div>
        <div class="hbar-controls">
          <button class="hbar-btn" type="button" id="minus-${i}" aria-label="${t("barDecrease1")}${label}${t("barDecrease2")}">−</button>
          <button class="hbar-btn" type="button" id="plus-${i}" aria-label="${t("barIncrease1")}${label}${t("barIncrease2")}">+</button>
        </div>
        <span class="hbar-label">${label}</span>
        <span class="hbar-tick">${t("gallons")}</span>
      `;
      wrap.appendChild(col);

      $(`#plus-${i}`).addEventListener("click", () => setBar(i, state.graph.bars[i] + 1));
      $(`#minus-${i}`).addEventListener("click", () => setBar(i, state.graph.bars[i] - 1));
      const track = $(`#track-${i}`);
      track.addEventListener("click", (e) => {
        const rect = track.getBoundingClientRect();
        const frac = 1 - (e.clientY - rect.top) / rect.height;
        setBar(i, Math.round(frac * HISTO.max));
      });
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); setBar(i, state.graph.bars[i] + 1); }
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); setBar(i, state.graph.bars[i] - 1); }
      });
      paintBar(i);
    });
    const interpLock = $("#interpLockTag");
    if (interpLock) {
      interpLock.textContent = state.graph.solved ? t("unlocked") : t("locked");
      interpLock.classList.toggle("unlocked", state.graph.solved);
    }
    if (state.graph.solved) {
      $("#interpBlock").classList.remove("locked");
    }
    renderInterp();
  }

  function setBar(i, val) {
    val = Math.max(0, Math.min(HISTO.max, val));
    state.graph.bars[i] = val;
    save();
    paintBar(i);
  }

  function paintBar(i) {
    const bar = $(`#bar-${i}`);
    const val = state.graph.bars[i];
    bar.style.height = (val / HISTO.max) * 100 + "%";
    $(`#barval-${i}`).textContent = val;
    bar.classList.remove("correct", "wrong");
    const track = $(`#track-${i}`);
    if (track) track.setAttribute("aria-valuenow", val);
  }

  function checkGraph() {
    const fb = $("#graphFeedback");
    let allRight = true;
    state.graph.bars.forEach((v, i) => {
      const bar = $(`#bar-${i}`);
      const right = v === HISTO.correct[i];
      bar.classList.toggle("correct", right);
      bar.classList.toggle("wrong", !right);
      if (!right) allRight = false;
    });
    if (allRight) {
      state.graph.solved = true;
      save();
      setFeedback(fb, "ok", t("graphSuccess"));
      $("#interpBlock").classList.remove("locked");
      $("#interpLockTag").textContent = t("unlocked");
      $("#interpLockTag").classList.add("unlocked");
      awardXp(t("xpHistogram"));
    } else {
      const total = state.graph.bars.reduce((a, b) => a + b, 0);
      let hint = t("graphRecount");
      if (total !== DATASET.length) hint = `${t("graphSum1")}${total}${t("graphSum2")}${DATASET.length}${t("graphSum3")}`;
      setFeedback(fb, "no", hint);
    }
  }

  /* ---- interpretation: these questions surface the mean vs. median + outlier idea ---- */
  // Options carry a stable `key` so matching/storage never depends on the
  // displayed (language-specific) label. We compare by key and render by lang.
  const INTERP = [
    {
      id: "spread",
      q: { en: "Which interval holds the one household that is far from the rest?", es: "¿Qué intervalo contiene el único hogar que está lejos de los demás?" },
      answerKey: "c",
      opts: [
        { key: "a", en: "30–49", es: "30–49" },
        { key: "b", en: "50–69", es: "50–69" },
        { key: "c", en: "110–129", es: "110–129" },
      ],
    },
    {
      id: "cause",
      q: { en: "What caused the mean (43) to be higher than the median (38)?", es: "¿Qué hizo que la media (43) fuera más alta que la mediana (38)?" },
      answerKey: "a",
      opts: [
        { key: "a", en: "The outlier — the mansion that used 120 gallons", es: "El valor atípico — la mansión que usó 120 galones" },
        { key: "b", en: "A counting mistake", es: "Un error al contar" },
        { key: "c", en: "Most homes use a lot of water", es: "La mayoría de los hogares usa mucha agua" },
      ],
    },
    {
      id: "typical",
      q: { en: "Which is closer to what MOST households actually use — the mean or the median?", es: "¿Cuál está más cerca de lo que LA MAYORÍA de los hogares realmente usa — la media o la mediana?" },
      answerKey: "b",
      opts: [
        { key: "a", en: "The mean (43)", es: "La media (43)" },
        { key: "b", en: "The median (38)", es: "La mediana (38)" },
        { key: "c", en: "They are the same", es: "Son iguales" },
      ],
    },
    {
      id: "fair",
      q: { en: "For a FAIR conservation target, which measure should the city trust more?", es: "Para una meta de conservación JUSTA, ¿en qué medida debe confiar más la ciudad?" },
      answerKey: "a",
      opts: [
        { key: "a", en: "The median, because the outlier pulls the mean up", es: "La mediana, porque el valor atípico eleva la media" },
        { key: "b", en: "The mean, because it uses every number", es: "La media, porque usa todos los números" },
        { key: "c", en: "Neither — ignore the data", es: "Ninguna — ignorar los datos" },
      ],
    },
  ];

  const interpLabel = (opt) => (state.lang === "es" ? opt.es : opt.en);
  const interpQuestion = (q) => (state.lang === "es" ? q.q.es : q.q.en);

  // Rebuilt every call so labels follow the current language. The selected
  // answer lives in state (by stable key), so a rebuild preserves the choice.
  function renderInterp() {
    const wrap = $("#interpQuestions");
    wrap.innerHTML = "";
    INTERP.forEach((q) => {
      const div = document.createElement("div");
      div.className = "interp-q";
      div.innerHTML = `<p>${interpQuestion(q)}</p><div class="opt-row" id="opts-${q.id}"></div>`;
      wrap.appendChild(div);
      q.opts.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.type = "button";
        b.textContent = interpLabel(opt);
        b.dataset.optKey = opt.key;
        b.setAttribute("aria-pressed", String(state.interp.answers[q.id] === opt.key));
        b.addEventListener("click", () => {
          state.interp.answers[q.id] = opt.key;
          $$(`#opts-${q.id} .opt`).forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
          save();
        });
        $(`#opts-${q.id}`, div).appendChild(b);
      });
    });
    // short written response
    const writeDiv = document.createElement("div");
    writeDiv.className = "interp-q";
    writeDiv.innerHTML = `<p>${t("interpWritePrompt")}</p>`;
    const ta = document.createElement("textarea");
    ta.className = "writebox";
    ta.rows = 2;
    ta.id = "interpWritten";
    ta.placeholder = t("interpWritePlaceholder");
    ta.value = state.interp.written;
    ta.addEventListener("input", (e) => { state.interp.written = e.target.value; save(); });
    writeDiv.appendChild(ta);
    wrap.appendChild(writeDiv);
  }

  function checkInterp() {
    const fb = $("#interpFeedback");
    let correctCount = 0;
    INTERP.forEach((q) => {
      const picked = state.interp.answers[q.id];
      const right = picked === q.answerKey;
      if (right) correctCount++;
      $$(`#opts-${q.id} .opt`).forEach((o) => {
        o.classList.remove("correct", "wrong");
        if (o.dataset.optKey === picked) o.classList.add(right ? "correct" : "wrong");
        if (o.dataset.optKey === q.answerKey) o.classList.add("correct");
      });
    });
    const written = wordCount(state.interp.written) >= 3;
    if (correctCount === INTERP.length && written) {
      state.interp.solved = true;
      save();
      setFeedback(fb, "ok", t("interpSuccess"));
      $("#toDecisionBtn").disabled = false;
      unlock("decision");
      awardXp(t("xpInterp"));
    } else {
      let msg = `${t("interpScore1")}${correctCount}${t("interpScore2")}${INTERP.length}${t("interpScore3")}`;
      if (!written) msg += t("interpWriteSentence");
      else msg += t("interpTryAgain");
      setFeedback(fb, "no", msg);
    }
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
    if (!state.decision.choice) { setFeedback(fb, "no", t("decisionPick")); return; }
    if (wc < 18) { setFeedback(fb, "no", `${t("decisionWords1")}${wc}${t("decisionWords2")}`); return; }

    state.decision.submitted = true;

    if (state.decision.choice === BEST_CHOICE) {
      state.decision.accepted = true;
      save();
      setFeedback(fb, "ok", t("decisionAccepted"));
      computeScore();
      unlock("reaction");
      awardXp(t("xpAccepted"));
      setTimeout(() => go("reaction"), 700);
    } else {
      // revision event
      state.decision.accepted = false;
      state.decision.revisions++;
      save();
      setFeedback(fb, "no", t("decisionRevise"));
      // still let them see a (revise) reaction so the loop is visible
      computeScore();
      unlock("reaction");
      awardXp(t("xpRevision"));
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

    // Data Confidence: calculations + sort + graph + interpretation
    let confidence = 0;
    if (state.sort.solved) confidence += 20;
    confidence += calcSolved * 12.5; // 4 -> 50
    if (state.graph.solved) confidence += 20;
    if (state.interp.solved) confidence += 10;
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

    // Water Crisis meter (higher = more under control / improving)
    let crisis = acceptedBest ? 70 : 30;
    if (state.graph.solved) crisis += 15;
    if (acceptedBest && evidenceHits >= 2) crisis += 15;
    crisis = clamp(crisis);

    state.meters = {
      trust: Math.round(trust),
      crisis: Math.round(crisis),
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
    const t = text.toLowerCase();
    let hits = 0;
    [/mean/, /median/, /outlier/, /typical/, /\b38\b/, /\b43\b/, /\b120\b/, /mansion/, /skew/].forEach((re) => {
      if (re.test(t)) hits++;
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
      { name: t("mCrisis"), val: state.meters.crisis },
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
    if (wc < 35) { setFeedback(fb, "no", `${t("newsWords1")}${wc}${t("newsWords2")}`); return; }
    state.news.submitted = true;
    save();
    setFeedback(fb, "ok", t("newsPublished"));
    unlock("passport");
    awardXp(t("xpNews"));
    setTimeout(() => go("passport"), 700);
  }

  /* ============================ 8. PASSPORT ============================ */
  function renderPassport() {
    $("#ppName").textContent = state.name || t("ppNameFallback");
    $("#ppRole").textContent = state.role || t("ppRoleFallback");
    const tier = state.outcomeTier || "medium";
    $("#ppOutcome").textContent = tier === "good" ? t("ppApproved")
      : tier === "medium" ? t("ppReview") : t("ppRevise");

    // "recommend" skill credit requires the best choice AND real evidence,
    // not just the 18-word gate, so the checkmark reflects genuine reasoning.
    const recommendEarned = state.decision.accepted && countEvidence(state.decision.text) >= 2;
    const earned = {
      sort: state.sort.solved,
      calc: CALC_DEFS.every((d) => state.calc[d.key].solved),
      graph: state.graph.solved,
      skew: state.interp.solved,
      recommend: recommendEarned,
      revise: state.decision.revisions > 0 || state.decision.accepted,
    };
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
    const outcome = tier === "good" ? "Fair conservation plan approved" : tier === "medium" ? "Plan under review" : "Report sent back for revision";
    const skills = {
      "Sort data": state.sort.solved,
      "Mean/median/mode/range": CALC_DEFS.every((d) => state.calc[d.key].solved),
      "Build a graph": state.graph.solved,
      "Explain median for skewed data": state.interp.solved,
      "Recommend with evidence": state.decision.accepted && countEvidence(state.decision.text) >= 2,
      "Revise thinking": state.decision.revisions > 0 || state.decision.accepted,
    };
    return `
      <h1>Neft City: Water Watch — Proof of Learning</h1>
      <div class="pr-grid">
        <div class="pr-row"><b>Name:</b> ${escapeHtml(state.name || "—")}</div>
        <div class="pr-row"><b>Role:</b> ${escapeHtml(state.role || "—")}</div>
        <div class="pr-row"><b>Mission:</b> Water Watch — The Conservation Plan</div>
        <div class="pr-row"><b>City Outcome:</b> ${outcome}</div>
      </div>

      <h2>Sorted Data (least → greatest, gallons)</h2>
      <div class="pr-row">${state.sort.tray.length === DATASET.length ? state.sort.tray.join(", ") : SORTED.join(", ")}</div>

      <h2>Calculations</h2>
      <div class="pr-grid">
        <div class="pr-row"><b>Mean:</b> ${escapeHtml(state.calc.mean.value || "—")}</div>
        <div class="pr-row"><b>Median:</b> ${escapeHtml(state.calc.median.value || "—")}</div>
        <div class="pr-row"><b>Mode:</b> ${escapeHtml(state.calc.mode.value || "—")}</div>
        <div class="pr-row"><b>Range:</b> ${escapeHtml(state.calc.range.value || "—")}</div>
      </div>

      <h2>Graph Frequencies</h2>
      <div class="pr-row">${HISTO.intervals.map((iv, i) => `${iv}: ${state.graph.bars[i]}`).join(" &nbsp;·&nbsp; ")}</div>

      <h2>Mean vs. Median (the outlier)</h2>
      <div class="pr-row">Mean = 43 (pulled up by the 120-gallon mansion) · Median = 38 (typical household). The median is the fairer measure.</div>

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
      <div class="pr-row">Public Trust: ${m.trust} &nbsp;·&nbsp; Water Crisis: ${m.crisis} &nbsp;·&nbsp; Data Confidence: ${m.confidence} &nbsp;·&nbsp; Explanation: ${m.explanation}</div>
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
    a.download = `neft-city-water-watch_${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Delay revocation so slower browsers (Firefox/Safari/mobile) finish the fetch.
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast(t("xpDownloaded"));
  }

  function resetMission() {
    if (!confirm(t("resetConfirm"))) return;
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

    const pill = (ok, warn) => ok ? `<span class="t-pill good">strong</span>` : warn ? `<span class="t-pill warn">developing</span>` : `<span class="t-pill bad">not yet</span>`;

    // misconception detection (local)
    const misconceptions = [];
    if (c.median.attempts >= 2 && !c.median.solved) misconceptions.push("Median: may be reading the unsorted list or picking the mean (43) instead of the 8th value.");
    if (c.mode.attempts >= 2) misconceptions.push("Mode: may be giving only one mode instead of both (38 and 40).");
    if (c.range.attempts >= 2) misconceptions.push("Range: may be adding instead of subtracting greatest − least.");
    if (c.mean.attempts >= 2) misconceptions.push("Mean: may stop at the total (645) without dividing by 15.");
    if (state.decision.submitted && !acceptedBest && state.decision.choice === "B") misconceptions.push("Decision: chose the mean (43) target — may not see that the outlier skews the mean.");
    if (state.graph.solved === false && state.graph.bars.reduce((a, b) => a + b, 0) !== DATASET.length && stepIndex(state.current) >= 3)
      misconceptions.push("Histogram: bar frequencies do not total 15 — likely miscounting intervals.");
    if (!misconceptions.length) misconceptions.push("None detected so far.");

    // recommendation quality
    let recQuality, recPill;
    if (acceptedBest && evidenceHits >= 2 && decWords >= 18) { recQuality = "Strong — chose the median-based plan with 2+ pieces of evidence."; recPill = `<span class="t-pill good">strong</span>`; }
    else if (acceptedBest) { recQuality = "On track — best choice, evidence could name the outlier / median more explicitly."; recPill = `<span class="t-pill warn">developing</span>`; }
    else if (state.decision.submitted) { recQuality = "Needs revision — not yet the median-based, outlier-aware plan."; recPill = `<span class="t-pill bad">revise</span>`; }
    else { recQuality = "Not submitted yet."; recPill = `<span class="t-pill warn">pending</span>`; }

    // suggested next move
    let nextMove;
    if (c.median.attempts >= 2 && !c.median.solved) nextMove = "Review median: student may need to sort data before finding the 8th (middle) value.";
    else if (c.mode.attempts >= 2) nextMove = "Review mode: remind student a data set can have more than one mode (38 and 40).";
    else if (c.range.attempts >= 2) nextMove = "Review range: practice greatest − least with a number line.";
    else if (state.decision.choice === "B") nextMove = "Big idea: ask how the 120-gallon mansion changes the mean but not the median. Why is the median fairer for a typical home?";
    else if (acceptedBest && evidenceHits < 2) nextMove = "Student can calculate but needs support naming evidence (outlier, median 38, mean 43). Use sentence frames.";
    else if (calcSolved === 4 && state.graph.solved && acceptedBest && evidenceHits >= 2) nextMove = "Student is ready for enrichment: ask what would happen to the median if a SECOND mansion (130 gallons) were added.";
    else nextMove = "Continue mission; check in during the Decision Room for outlier-aware evidence.";

    return `
      <div class="teacher-section">
        <h3>Student</h3>
        <div class="tstat"><span>Name</span><b>${escapeHtml(state.name || "—")}</b></div>
        <div class="tstat"><span>Role</span><b>${escapeHtml(state.role || "—")}</b></div>
        <div class="tstat"><span>Current step</span><b>${state.current}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Score by Skill</h3>
        <div class="tstat"><span>Sort data</span>${pill(state.sort.solved, false)}</div>
        <div class="tstat"><span>Calculations (${calcSolved}/4)</span>${pill(calcSolved === 4, calcSolved >= 2)}</div>
        <div class="tstat"><span>Histogram</span>${pill(state.graph.solved, false)}</div>
        <div class="tstat"><span>Outlier / median reasoning</span>${pill(state.interp.solved, false)}</div>
        <div class="tstat"><span>Recommendation</span>${recPill}</div>
      </div>

      <div class="teacher-section">
        <h3>Attempts per Calculation</h3>
        <div class="tstat"><span>Mean</span><b>${c.mean.attempts} ${c.mean.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Median</span><b>${c.median.attempts} ${c.median.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Mode</span><b>${c.mode.attempts} ${c.mode.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Range</span><b>${c.range.attempts} ${c.range.solved ? "✓" : ""}</b></div>
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
      div.id = "vocab-" + v.term;
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
      const el = $("#vocab-" + term);
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

    // data lab
    $("#checkSortBtn").addEventListener("click", checkSort);
    $("#resetSortBtn").addEventListener("click", () => { state.sort.tray = []; state.sort.solved = false; save(); renderSort(); setFeedback($("#sortFeedback"), "", ""); });

    // graph
    $("#checkGraphBtn").addEventListener("click", checkGraph);
    $("#resetGraphBtn").addEventListener("click", () => { state.graph.bars = [0, 0, 0, 0, 0]; state.graph.solved = false; save(); renderGraph(); setFeedback($("#graphFeedback"), "", ""); });
    $("#checkInterpBtn").addEventListener("click", checkInterp);

    // decision / news / passport
    initDecision();
    initNews();
    initPassport();

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
