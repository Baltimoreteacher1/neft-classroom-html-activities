/* ============================================================
   NEFT CITY: FOOD TRUCK FACE-OFF — Living School simulation
   Chapter 3 · 6th grade · 6.RP (ratios, rates, unit rate)
   Vanilla JS. No dependencies, no backend, no external APIs.
   All "AI-style" feedback is generated locally from student work.

   Architecture:
     CONFIG        — deals, answers, vocabulary, copy
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
  // Truck A "Taco Town": 3 tacos for $6  -> $2.00 / taco
  // Truck B "Salsa Stop": 5 tacos for $8 -> $1.60 / taco
  const DEALS = {
    A: { name: "Taco Town", tacos: 3, dollars: 6, unit: 2.0 },
    B: { name: "Salsa Stop", tacos: 5, dollars: 8, unit: 1.6 },
  };

  const ANSWERS = {
    unitA: 2.0,   // 6 / 3
    unitB: 1.6,   // 8 / 5
    better: "B",  // lower price per taco
  };

  // Ratio table for Salsa Stop (tacos -> dollars). $1.60 per taco.
  // Given cells are shown; missing cells are filled by the student.
  const RATIO = {
    truck: "Salsa Stop",
    rate: 1.6,
    rows: [
      { tacos: 1, dollars: 1.6, given: false },
      { tacos: 5, dollars: 8.0, given: true },  // the original deal — anchor
      { tacos: 10, dollars: 16.0, given: false },
      { tacos: 15, dollars: 24.0, given: false },
    ],
  };

  // Double number line for Salsa Stop: tacos (top) vs dollars (bottom).
  // tacos 0,5,10,15 -> dollars 0,8,16,24. Student sets each dollar value.
  const DNL = {
    tacos: [0, 5, 10, 15],
    dollars: [0, 8, 16, 24],
    step: 4, // +/- step in dollars (one step = 4 tacos worth-ish; keeps it quick)
    max: 28,
  };

  const BEST_CHOICE = "A"; // best decision-room choice (recommend Salsa Stop via unit rate)

  const STEPS = [
    { id: "enter", label: "Enter City", icon: "🚪" },
    { id: "briefing", label: "Briefing", icon: "🏛️" },
    { id: "datalab", label: "Price Lab", icon: "🔬" },
    { id: "graph", label: "Number Line", icon: "📏" },
    { id: "decision", label: "Decision", icon: "🗳️" },
    { id: "reaction", label: "City", icon: "🌆" },
    { id: "news", label: "News", icon: "📰" },
    { id: "passport", label: "Passport", icon: "🪪" },
  ];

  // Vocabulary is shown bilingually (English + Español) for ESOL learners.
  const VOCAB = [
    { term: "ratio", es: "razón", def: "A comparison of two amounts, like tacos to dollars.", ex: "3 tacos to $6 is a ratio.", defEs: "Una comparación de dos cantidades, como tacos y dólares.", exEs: "3 tacos por $6 es una razón." },
    { term: "rate", es: "tasa", def: "A ratio that compares two different units, like dollars and tacos.", ex: "$8 for 5 tacos is a rate.", defEs: "Una razón que compara dos unidades distintas, como dólares y tacos.", exEs: "$8 por 5 tacos es una tasa." },
    { term: "unit rate", es: "tasa unitaria", def: "The price for exactly ONE item. Divide the total by the number of items.", ex: "$8 ÷ 5 tacos = $1.60 per taco.", defEs: "El precio de UN solo artículo. Divide el total entre el número de artículos.", exEs: "$8 ÷ 5 tacos = $1.60 por taco." },
    { term: "per unit", es: "por unidad", def: "“For each one.” Per taco means for each single taco.", ex: "$1.60 per taco means each taco costs $1.60.", defEs: "“Por cada uno.” Por taco significa por cada taco.", exEs: "$1.60 por taco significa que cada taco cuesta $1.60." },
    { term: "ratio table", es: "tabla de razones", def: "A table that shows equal ratios, like tacos and their matching dollars.", ex: "1→$1.60, 5→$8.00, 10→$16.00.", defEs: "Una tabla que muestra razones iguales, como tacos y sus dólares.", exEs: "1→$1.60, 5→$8.00, 10→$16.00." },
    { term: "double number line", es: "doble recta numérica", def: "Two number lines lined up to compare two amounts, like tacos and dollars.", ex: "Tacos on top, dollars on the bottom.", defEs: "Dos rectas numéricas alineadas para comparar dos cantidades.", exEs: "Tacos arriba, dólares abajo." },
    { term: "value", es: "valor", def: "How good a deal is. Better value means you pay less per item.", ex: "Salsa Stop is a better value at $1.60 per taco.", defEs: "Qué tan buena es una oferta. Mejor valor significa pagar menos por artículo.", exEs: "Salsa Stop es mejor valor a $1.60 por taco." },
    { term: "evidence", es: "evidencia", def: "Proof from your numbers that supports your idea.", ex: "“$1.60 < $2.00 per taco” is evidence.", defEs: "Prueba de tus números que apoya tu idea.", exEs: "“$1.60 < $2.00 por taco” es evidencia." },
  ];

  const DECISION_STARTERS = [
    "The unit rate shows ",
    "Salsa Stop costs ",
    "Taco Town costs ",
    "I recommend ",
    "A fair price would be ",
  ];

  const NEWS_WORDS = ["ratio", "rate", "unit rate", "per", "dollars", "tacos", "compare", "value", "recommend"];
  const NEWS_FRAMES = [
    "Neft City compared ",
    "The unit rates showed ",
    "The better value was ",
    "I recommend ",
  ];

  const SKILLS = [
    { key: "unit", label: "I can find a unit rate." },
    { key: "table", label: "I can build and complete a ratio table." },
    { key: "dnl", label: "I can use a double number line." },
    { key: "compare", label: "I can compare deals with rates." },
    { key: "recommend", label: "I can recommend using evidence." },
    { key: "revise", label: "I can revise my thinking." },
  ];

  const ROLE_FLAVOR = {
    "Price Analyst": "As our Price Analyst, you'll dig into the unit rates first.",
    "Fair Planner": "As our Fair Planner, you'll picture how prices shape the fair.",
    "News Reporter": "As our News Reporter, you'll explain the story to the whole city.",
    "Budget Advisor": "As our Budget Advisor, you'll weigh the cost of each deal.",
    "Community Advocate": "As our Community Advocate, you'll make sure families get a fair price.",
  };

  const ROLE_FLAVOR_ES = {
    "Price Analyst": "Como Analista de Precios, primero explorarás las tasas unitarias.",
    "Fair Planner": "Como Planificador de la Feria, imaginarás cómo los precios afectan la feria.",
    "News Reporter": "Como Reportero de Noticias, explicarás la historia a toda la ciudad.",
    "Budget Advisor": "Como Asesor de Presupuesto, pesarás el costo de cada oferta.",
    "Community Advocate": "Como Defensor de la Comunidad, te asegurarás de que las familias paguen un precio justo.",
  };

  const DECISION_STARTERS_ES = [
    "La tasa unitaria muestra ",
    "Salsa Stop cuesta ",
    "Taco Town cuesta ",
    "Recomiendo ",
    "Un precio justo sería ",
  ];

  const NEWS_FRAMES_ES = [
    "Neft City comparó ",
    "Las tasas unitarias mostraron ",
    "El mejor valor fue ",
    "Recomiendo ",
  ];

  // Optional enrichment: scale both unit rates up to 25 tacos.
  // Taco Town: 25 * 2.00 = $50. Salsa Stop: 25 * 1.60 = $40. Salsa Stop saves $10.
  const OUTLIER = {
    aTotal: 50,   // 25 * 2.00
    bTotal: 40,   // 25 * 1.60
    which: "b10", // Salsa Stop, by $10
    whichOpts: [
      { key: "b10", en: "Salsa Stop, by $10", es: "Salsa Stop, por $10" },
      { key: "a10", en: "Taco Town, by $10", es: "Taco Town, por $10" },
      { key: "same", en: "They cost the same", es: "Cuestan lo mismo" },
    ],
  };

  // Spanish strings for static elements tagged with data-i18n / data-i18n-html.
  // English comes from the captured DOM, so only Spanish lives here.
  const I18N_ES = {
    "ui.vocab": "📘 Vocabulario", "ui.back": "← Atrás", "ui.clear": "Borrar",
    "ui.check": "Revisar", "ui.tryit": "Inténtalo",
    "enter.eyebrow": "Living School · Capítulo 3",
    "enter.intro": "¡Llegó la Feria de Neft City! Dos camiones de tacos quieren vender en la feria. El alcalde necesita que tu equipo use <strong>razones y tasa unitaria</strong> para hallar el mejor valor y fijar un precio justo. ¿Listo para ayudar?",
    "enter.nameLabel": "Primero, dinos tu <strong>nombre</strong>",
    "enter.nameHelp": "Lo usamos en tu reporte final.",
    "enter.roleLegend": "Elige tu <strong>rol</strong> en el equipo de la ciudad",
    "role.analyst": "Te encantan los números y los patrones.",
    "role.planner": "Diseñas cómo funciona la feria.",
    "role.reporter": "Cuentas la historia de la ciudad.",
    "role.budget": "Cuidas el dinero de la ciudad.",
    "role.advocate": "Hablas por la gente.",
    "enter.start": "Entrar a Neft City →",
    "briefing.title": "🏛️ Informe de la Misión",
    "briefing.goalsTitle": "🎯 Metas de tu Misión",
    "briefing.goal1": "Halla la <em>tasa unitaria</em> (precio por taco) de cada camión.",
    "briefing.goal2": "Construye una <em>tabla de razones</em> y una <em>doble recta numérica</em> para Salsa Stop.",
    "briefing.goal3": "Decide cuál camión tiene el mejor valor.",
    "briefing.goal4": "Recomienda un precio justo para la feria.",
    "briefing.goal5": "Explica tu decisión usando <em>evidencia</em>.",
    "briefing.vocabHint": "¿Palabra nueva? Toca una palabra azul para ver qué significa:",
    "briefing.next": "Ir al Laboratorio de Precios →",
    "datalab.title": "🔬 Laboratorio de Precios",
    "datalab.intro": "Cada camión vende tacos en paquete. Para compararlos justamente, halla la <strong>tasa unitaria</strong>: el precio de <strong>un taco</strong>.",
    "datalab.dealA": "3 tacos por $6",
    "datalab.dealB": "5 tacos por $8",
    "datalab.step1": "Paso 1 · Halla cada tasa unitaria",
    "datalab.step1help": "Tasa unitaria = dólares totales ÷ número de tacos. Después de dos intentos verás una pista.",
    "datalab.fcRateT": "Tasa unitaria", "datalab.fcRateD": "dólares ÷ tacos",
    "datalab.fcAT": "Taco Town", "datalab.fcAD": "$6 ÷ 3 tacos",
    "datalab.fcBT": "Salsa Stop", "datalab.fcBD": "$8 ÷ 5 tacos",
    "datalab.next": "Construir la Doble Recta Numérica →",
    "graph.title": "📏 Doble Recta Numérica",
    "graph.lead": "Salsa Stop cobra <strong>$1.60 por taco</strong>. Fija los dólares debajo de cada marca de tacos usando <strong>+</strong> y <strong>−</strong> (o escribe un valor), luego revisa.",
    "graph.tableTitle": "Paso 1 · Completa la tabla de razones (Salsa Stop)",
    "graph.tableHelp": "Llena los montos de dólares que faltan. Cada taco cuesta $1.60.",
    "graph.checkTable": "Revisar Tabla",
    "graph.dnlTitle": "Paso 2 · Construye la doble recta numérica",
    "graph.dnlHelp": "La línea de arriba muestra los tacos. Fija los dólares en la línea de abajo bajo cada marca de tacos.",
    "graph.check": "Revisar Recta Numérica",
    "graph.reset": "Reiniciar valores",
    "graph.interpTitle": "Interpreta tus tasas",
    "graph.checkAnswers": "Revisar Respuestas",
    "graph.next": "Ir a la Sala de Decisiones →",
    "decision.title": "🗳️ Sala de Decisiones",
    "decision.council": "Concejo de la Ciudad",
    "decision.prompt": "¿Cuál camión debe recomendar Neft City por el mejor valor? Elige una recomendación y explícala con <strong>evidencia</strong> de tus tasas.",
    "decision.choiceA": "Recomendar Salsa Stop porque su tasa unitaria ($1.60/taco) es más baja.",
    "decision.choiceB": "Recomendar Taco Town porque vende en cantidades más pequeñas.",
    "decision.choiceC": "Elegir el camión que tenga la fila más larga.",
    "decision.choiceD": "No comparar — solo adivinar.",
    "decision.explainTitle": "Explica con evidencia",
    "decision.explainHelp": "Usa las <strong>tasas unitarias</strong> como evidencia y nombra un precio justo. (Al menos 18 palabras.)",
    "decision.submit": "Enviar Recomendación",
    "reaction.title": "🌆 Reacción de la Ciudad",
    "reaction.status": "Estado de la Ciudad",
    "reaction.revise": "← Revisar Decisión",
    "reaction.next": "Escribir el Reporte de Noticias →",
    "outlier.summary": "🔬 Reto de Ampliación: Escálalo (opcional)",
    "outlier.intro": "Un grupo escolar quiere comprar <strong>25 tacos</strong> de cada camión. Usa las <em>tasas unitarias</em> para hallar el costo total de cada camión, y mira cuánto ahorra la ciudad.",
    "outlier.aQ": "¿25 tacos en Taco Town ($2.00/taco)?",
    "outlier.bQ": "¿25 tacos en Salsa Stop ($1.60/taco)?",
    "outlier.whichQ": "¿Cuál camión es la mejor oferta para 25 tacos, y por cuánto?",
    "outlier.reflectLabel": "¿Por qué la tasa unitaria más baja siempre ahorra más al comprar más? (1 oración)",
    "news.title": "📰 Noticias de Neft City",
    "news.lead": "Escribe un breve reporte público: <strong>3 a 5 oraciones</strong> sobre los dos camiones, qué mostraron las tasas unitarias y cuál camión debe recomendar la ciudad. (Al menos 35 palabras.)",
    "news.wordbankLabel": "Banco de palabras — toca para agregar",
    "news.framesLabel": "Marcos de oración — toca para agregar",
    "news.checklistTitle": "📋 Lista para revisar mi reporte",
    "news.check1": "Nombré los dos camiones.",
    "news.check2": "Usé las tasas unitarias como evidencia.",
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
      check: "Check", tryit: "Try it", solved: "✓ Solved",
      unitAName: "Taco Town — unit rate ($/taco)", unitBName: "Salsa Stop — unit rate ($/taco)",
      mTrust: "Public Trust", mFair: "Fair Pricing", mConfidence: "Data Confidence", mExplanation: "Explanation Strength",
      welcome: ", welcome to the team! ", welcomeNoName: "Welcome to the team! ",
      briefBody: "Two taco trucks want to sell at the Neft City Fair. <strong>Taco Town</strong> sells 3 tacos for $6. <strong>Salsa Stop</strong> sells 5 tacos for $8. Your job: find the <strong>unit rate</strong> (price per taco), decide the better value, and recommend a fair price.",
      skillUnit: "I can find a unit rate.",
      skillTable: "I can build and complete a ratio table.",
      skillDnl: "I can use a double number line.",
      skillCompare: "I can compare deals with rates.",
      skillRecommend: "I can recommend using evidence.",
      skillRevise: "I can revise my thinking.",
      outGood: "Your team used strong rate evidence. Neft City adopts fair pricing at the fair, and families pay the better-value price.",
      outMedium: "Your team found the better value, but the city needs a clearer explanation before setting the fair price.",
      outRevise: "The city made a rushed choice and families overpaid. Your team must revise the pricing report.",
      ppApproved: "Fair pricing adopted 🎉", ppReview: "Decision under review 🤔", ppRevise: "Report sent back for revision ⚠️",
      olCorrect: "✅ Correct!", olTryA: "Not yet. Multiply the unit rate by 25: 2.00 × 25.", olTryB: "Not yet. Multiply the unit rate by 25: 1.60 × 25.",
      olWhichRight: "✅ Yes! $50 vs $40 — Salsa Stop saves $10 on 25 tacos because $1.60 < $2.00 per taco.",
      olWhichWrong: "Look again: compare the two totals ($50 and $40).",
      olDone: "🌟 Enrichment complete! You scaled the unit rates and found the bigger savings.",

      // navigation / progress
      lockedStep: "🔒 Finish the current step first!",
      lockedSuffix: " (locked)",

      // price lab
      hintLabel: "💡 Hint",
      typeFirst: "Type your answer first.",
      correctNice: "✅ Correct! Nice work.",
      correctShort: "✓ Correct!",
      hintOpened: "A hint is now open below. 💡",
      hintCalcA: "Taco Town: $6 ÷ 3 tacos = $2.00 per taco.",
      hintCalcB: "Salsa Stop: $8 ÷ 5 tacos = $1.60 per taco.",
      ariaCalcA: "Taco Town unit rate", ariaCalcB: "Salsa Stop unit rate",
      xpRateA: "Taco Town rate solved!",
      xpRateB: "Salsa Stop rate solved!",
      // calc miss messages (A = Taco Town)
      missA6: "That's the total price for 3 tacos. Now divide by 3 tacos to get one taco.",
      missA3: "That's the number of tacos. Divide dollars by tacos: $6 ÷ 3.",
      missAinv: "Careful — you divided tacos by dollars. Unit rate is dollars ÷ tacos: $6 ÷ 3.",
      missA: "Not yet. Unit rate = dollars ÷ tacos. Taco Town: $6 ÷ 3.",
      missB8: "That's the total price for 5 tacos. Now divide by 5 tacos to get one taco.",
      missB5: "That's the number of tacos. Divide dollars by tacos: $8 ÷ 5.",
      missBinv: "Careful — you divided tacos by dollars. Unit rate is dollars ÷ tacos: $8 ÷ 5.",
      missB: "Not yet. Unit rate = dollars ÷ tacos. Salsa Stop: $8 ÷ 5.",
      missDefault: "Not quite — try again.",

      // ratio table
      tacosLabel: "Tacos", dollarsLabel: "Dollars",
      tableAria: "Dollars for {n} tacos",
      tableFillAll: "Fill in every missing dollar amount, then check.",
      tableOk: "✅ Great ratio table! Each taco is $1.60. The double number line is unlocked.",
      tableWrong: "Check the red cells. Each taco costs $1.60, so multiply tacos × $1.60.",
      xpTable: "Ratio table complete!",

      // double number line
      dnlTacos: "tacos",
      dnlAria: "Dollars for {n} tacos",
      dnlDecAria: "Decrease dollars for {n} tacos",
      dnlIncAria: "Increase dollars for {n} tacos",
      dnlOk: "✅ Your double number line matches $1.60 per taco! Interpretation unlocked.",
      dnlWrong: "Check the red marks. 5 tacos → $8, then add $8 each time: $16 and $24.",
      xpDnl: "Number line built!",

      // interpretation
      interpQLess: "Which truck costs less per taco?",
      interpQTen: "If you buy 10 tacos, how much cheaper is Salsa Stop than Taco Town?",
      interpQValue: "Which truck is the better value?",
      optTacoTownPrice: "Taco Town ($2.00)", optSalsaStopPrice: "Salsa Stop ($1.60)", optSame: "They cost the same",
      opt2cheaper: "$2 cheaper", opt4cheaper: "$4 cheaper", opt6cheaper: "$6 cheaper",
      optTacoTown: "Taco Town", optSalsaStop: "Salsa Stop", optCannotTell: "Cannot tell",
      interpWriteQ: "Why is unit rate useful for comparing deals? (written response)",
      interpWritePh: "Type one sentence about unit rate…",
      interpOk: "✅ Great reading of the rates! The Decision Room is open.",
      interpScore: "You have {n} of {total} multiple-choice answers correct.",
      interpNeedWritten: " Also write at least one full sentence in the response box.",
      interpTryAgain: " Look at the highlighted answers and try again.",
      xpInterp: "Rates interpreted!",

      // decision
      decPick: "Pick a recommendation (A, B, C, or D) first.",
      decWords: "Write at least 18 words of evidence. You have {n}.",
      decAccepted: "✅ The city council is convinced! Heading to City Reaction…",
      decRevise: "🏛️ The city council is not convinced yet. Look back at your unit rates and revise. (Hint: Salsa Stop is $1.60/taco, which is lower than Taco Town's $2.00/taco.)",
      xpDecAccepted: "Recommendation accepted!",
      xpDecRevise: "Revision needed",

      // news
      newsWords: "Write at least 35 words. You have {n}.",
      newsPublished: "✅ Published! Generating your Proof-of-Learning Passport…",
      xpNews: "News published!",

      // passport
      ppStudent: "Student", ppTeam: "City Team",
      downloaded: "⬇️ Progress downloaded",
      wordsLabel: "words", wordsNeed: "need",

      // reset
      resetConfirm: "Reset the whole mission? This clears all your work on this device.",
    },
    es: {
      startReady: "¡Listo! Presiona el botón para comenzar.",
      startAdd: "Agrega tu nombre y elige un rol para comenzar.",
      locked: "🔒 Bloqueado", unlocked: "🔓 Desbloqueado",
      check: "Revisar", tryit: "Inténtalo", solved: "✓ Resuelto",
      unitAName: "Taco Town — tasa unitaria ($/taco)", unitBName: "Salsa Stop — tasa unitaria ($/taco)",
      mTrust: "Confianza Pública", mFair: "Precio Justo", mConfidence: "Confianza en Datos", mExplanation: "Fuerza de Explicación",
      welcome: ", ¡bienvenido al equipo! ", welcomeNoName: "¡Bienvenido al equipo! ",
      briefBody: "Dos camiones de tacos quieren vender en la Feria de Neft City. <strong>Taco Town</strong> vende 3 tacos por $6. <strong>Salsa Stop</strong> vende 5 tacos por $8. Tu trabajo: halla la <strong>tasa unitaria</strong> (precio por taco), decide el mejor valor y recomienda un precio justo.",
      skillUnit: "Puedo hallar una tasa unitaria.",
      skillTable: "Puedo construir y completar una tabla de razones.",
      skillDnl: "Puedo usar una doble recta numérica.",
      skillCompare: "Puedo comparar ofertas con tasas.",
      skillRecommend: "Puedo recomendar usando evidencia.",
      skillRevise: "Puedo revisar mi pensamiento.",
      outGood: "Tu equipo usó evidencia sólida de las tasas. Neft City adopta precios justos en la feria y las familias pagan el precio de mejor valor.",
      outMedium: "Tu equipo encontró el mejor valor, pero la ciudad necesita una explicación más clara antes de fijar el precio.",
      outRevise: "La ciudad tomó una decisión apresurada y las familias pagaron de más. Tu equipo debe revisar el reporte de precios.",
      ppApproved: "Precios justos adoptados 🎉", ppReview: "Decisión en revisión 🤔", ppRevise: "Reporte devuelto para revisión ⚠️",
      olCorrect: "✅ ¡Correcto!", olTryA: "Aún no. Multiplica la tasa unitaria por 25: 2.00 × 25.", olTryB: "Aún no. Multiplica la tasa unitaria por 25: 1.60 × 25.",
      olWhichRight: "✅ ¡Sí! $50 vs $40 — Salsa Stop ahorra $10 en 25 tacos porque $1.60 < $2.00 por taco.",
      olWhichWrong: "Mira otra vez: compara los dos totales ($50 y $40).",
      olDone: "🌟 ¡Ampliación completa! Escalaste las tasas unitarias y hallaste el mayor ahorro.",

      // navigation / progress
      lockedStep: "🔒 ¡Termina el paso actual primero!",
      lockedSuffix: " (bloqueado)",

      // price lab
      hintLabel: "💡 Pista",
      typeFirst: "Escribe tu respuesta primero.",
      correctNice: "✅ ¡Correcto! Buen trabajo.",
      correctShort: "✓ ¡Correcto!",
      hintOpened: "Ahora hay una pista abierta abajo. 💡",
      hintCalcA: "Taco Town: $6 ÷ 3 tacos = $2.00 por taco.",
      hintCalcB: "Salsa Stop: $8 ÷ 5 tacos = $1.60 por taco.",
      ariaCalcA: "Tasa unitaria de Taco Town", ariaCalcB: "Tasa unitaria de Salsa Stop",
      xpRateA: "¡Tasa de Taco Town resuelta!",
      xpRateB: "¡Tasa de Salsa Stop resuelta!",
      // calc miss messages (A = Taco Town)
      missA6: "Ese es el precio total de 3 tacos. Ahora divide entre 3 tacos para hallar el precio de un taco.",
      missA3: "Ese es el número de tacos. Divide los dólares entre los tacos: $6 ÷ 3.",
      missAinv: "Cuidado — dividiste los tacos entre los dólares. La tasa unitaria es dólares ÷ tacos: $6 ÷ 3.",
      missA: "Aún no. Tasa unitaria = dólares ÷ tacos. Taco Town: $6 ÷ 3.",
      missB8: "Ese es el precio total de 5 tacos. Ahora divide entre 5 tacos para hallar el precio de un taco.",
      missB5: "Ese es el número de tacos. Divide los dólares entre los tacos: $8 ÷ 5.",
      missBinv: "Cuidado — dividiste los tacos entre los dólares. La tasa unitaria es dólares ÷ tacos: $8 ÷ 5.",
      missB: "Aún no. Tasa unitaria = dólares ÷ tacos. Salsa Stop: $8 ÷ 5.",
      missDefault: "No del todo — inténtalo otra vez.",

      // ratio table
      tacosLabel: "Tacos", dollarsLabel: "Dólares",
      tableAria: "Dólares por {n} tacos",
      tableFillAll: "Llena cada monto de dólares que falta y luego revisa.",
      tableOk: "✅ ¡Excelente tabla de razones! Cada taco cuesta $1.60. Se desbloqueó la doble recta numérica.",
      tableWrong: "Revisa las celdas rojas. Cada taco cuesta $1.60, así que multiplica tacos × $1.60.",
      xpTable: "¡Tabla de razones completa!",

      // double number line
      dnlTacos: "tacos",
      dnlAria: "Dólares por {n} tacos",
      dnlDecAria: "Disminuir los dólares de {n} tacos",
      dnlIncAria: "Aumentar los dólares de {n} tacos",
      dnlOk: "✅ ¡Tu doble recta numérica coincide con $1.60 por taco! Se desbloqueó la interpretación.",
      dnlWrong: "Revisa las marcas rojas. 5 tacos → $8, luego suma $8 cada vez: $16 y $24.",
      xpDnl: "¡Recta numérica construida!",

      // interpretation
      interpQLess: "¿Cuál camión cuesta menos por taco?",
      interpQTen: "Si compras 10 tacos, ¿cuánto más barato es Salsa Stop que Taco Town?",
      interpQValue: "¿Cuál camión es el mejor valor?",
      optTacoTownPrice: "Taco Town ($2.00)", optSalsaStopPrice: "Salsa Stop ($1.60)", optSame: "Cuestan lo mismo",
      opt2cheaper: "$2 más barato", opt4cheaper: "$4 más barato", opt6cheaper: "$6 más barato",
      optTacoTown: "Taco Town", optSalsaStop: "Salsa Stop", optCannotTell: "No se puede saber",
      interpWriteQ: "¿Por qué la tasa unitaria es útil para comparar ofertas? (respuesta escrita)",
      interpWritePh: "Escribe una oración sobre la tasa unitaria…",
      interpOk: "✅ ¡Buena lectura de las tasas! La Sala de Decisiones está abierta.",
      interpScore: "Tienes {n} de {total} respuestas de opción múltiple correctas.",
      interpNeedWritten: " También escribe al menos una oración completa en el cuadro de respuesta.",
      interpTryAgain: " Mira las respuestas resaltadas e inténtalo otra vez.",
      xpInterp: "¡Tasas interpretadas!",

      // decision
      decPick: "Elige una recomendación (A, B, C o D) primero.",
      decWords: "Escribe al menos 18 palabras de evidencia. Tienes {n}.",
      decAccepted: "✅ ¡El concejo de la ciudad está convencido! Yendo a la Reacción de la Ciudad…",
      decRevise: "🏛️ El concejo de la ciudad aún no está convencido. Vuelve a mirar tus tasas unitarias y revisa. (Pista: Salsa Stop cuesta $1.60/taco, lo cual es más bajo que los $2.00/taco de Taco Town.)",
      xpDecAccepted: "¡Recomendación aceptada!",
      xpDecRevise: "Se necesita revisión",

      // news
      newsWords: "Escribe al menos 35 palabras. Tienes {n}.",
      newsPublished: "✅ ¡Publicado! Generando tu Pasaporte de Aprendizaje…",
      xpNews: "¡Noticias publicadas!",

      // passport
      ppStudent: "Estudiante", ppTeam: "Equipo de la Ciudad",
      downloaded: "⬇️ Progreso descargado",
      wordsLabel: "palabras", wordsNeed: "faltan",

      // reset
      resetConfirm: "¿Reiniciar toda la misión? Esto borra todo tu trabajo en este dispositivo.",
    },
  };

  // Replace {n}, {total}, etc. placeholders in a t() string with values.
  const fmt = (key, vars) => {
    let s = t(key);
    for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  };

  const STORAGE_KEY = "neftcity_foodtrucks_v1";

  /* ============================ STATE ============================ */
  const defaultState = () => ({
    name: "",
    role: "",
    lang: "en", // "en" | "es"
    current: "enter",
    maxStep: 0, // highest unlocked step index
    calc: {
      unitA: { value: "", attempts: 0, solved: false, hint: false },
      unitB: { value: "", attempts: 0, solved: false, hint: false },
    },
    table: { cells: ["", "", ""], solved: false }, // missing rows: 1, 10, 15 (index aligned to RATIO non-given rows)
    graph: { dollars: [0, 0, 0, 0], solved: false }, // dollars under each taco mark
    interp: { answers: {}, written: "", solved: false },
    decision: { choice: "", text: "", submitted: false, accepted: false, revisions: 0 },
    news: { text: "", submitted: false },
    reflect: { r1: "", r2: "" },
    meters: { trust: 0, fair: 0, confidence: 0, explanation: 0 },
    outcomeTier: "", // good | medium | revise
    outlier: { a: "", aSolved: false, b: "", bSolved: false, which: "", written: "" },
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
  const money = (n) => "$" + Number(n).toFixed(2);
  // Parse a money/decimal string -> number (strips $, commas as decimals tolerated).
  const parseMoney = (raw) => parseFloat(String(raw).replace(/\$/g, "").replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));

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
    renderTable();
    renderGraph();
    renderDecisionStarters();
    renderNewsSupports();
    // refresh word counters so "words"/"need" labels follow the language
    if ($("#decisionCount")) updateCount("#decisionCount", state.decision.text, 18);
    if ($("#newsCount")) updateCount("#newsCount", state.news.text, 35);
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
      toast(t("lockedStep"));
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
      li.setAttribute("aria-label", `${step.label}${locked ? t("lockedSuffix") : ""}`);
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
      unlock("datalab"); // briefing is informational; the Price Lab is the first gated task
      renderBriefing();
      go("briefing");
    });

    refresh();
  }

  /* ============================ 2. BRIEFING ============================ */
  function renderBriefing() {
    if (state.maxStep >= stepIndex("briefing")) unlock("datalab"); // keep Price Lab reachable on resume
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

  /* ============================ 3. PRICE LAB — UNIT RATES ============================ */
  const CALC_DEFS = [
    { key: "unitA", nameKey: "unitAName", placeholder: "e.g. 2.00", hintKey: "hintCalcA", ariaKey: "ariaCalcA" },
    { key: "unitB", nameKey: "unitBName", placeholder: "e.g. 1.60", hintKey: "hintCalcB", ariaKey: "ariaCalcB" },
  ];

  function renderCalc() {
    const grid = $("#calcGrid");
    if (!grid) return;
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
            placeholder="${def.placeholder}" aria-label="${escapeAttr(t(def.ariaKey))}" ${c.solved ? "disabled" : ""} />
          <button class="btn-primary" type="button" id="check-${def.key}" ${c.solved ? "disabled" : ""}>${t("check")}</button>
          <button class="btn-hint" type="button" id="hint-${def.key}">${t("hintLabel")}</button>
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

      if (c.solved) setFeedback($(`#fb-${def.key}`), "ok", t("correctShort"));
    });
    refreshDataLabGate();
  }

  function checkCalc(key) {
    const c = state.calc[key];
    const fb = $(`#fb-${key}`);
    const raw = $(`#input-${key}`).value.trim();
    c.value = raw;
    if (raw === "") { setFeedback(fb, "no", t("typeFirst")); save(); return; }

    const ok = validateCalc(key, raw);
    if (ok) {
      c.solved = true;
      save();
      setFeedback(fb, "ok", t("correctNice"));
      $(`#state-${key}`).textContent = t("solved");
      $(`#state-${key}`).classList.add("solved");
      $(`#input-${key}`).disabled = true;
      $(`#check-${key}`).disabled = true;
      awardXp(t(key === "unitA" ? "xpRateA" : "xpRateB"));
      refreshDataLabGate();
    } else {
      c.attempts++;
      save();
      let msg = calcMissMessage(key, raw);
      if (c.attempts >= 2) {
        c.hint = true;
        $(`#hintcard-${key}`).classList.add("show");
        setFeedback(fb, "tip", `${msg} ${t("hintOpened")}`);
      } else {
        setFeedback(fb, "no", msg);
      }
    }
  }

  function validateCalc(key, raw) {
    const v = parseMoney(raw);
    if (Number.isNaN(v)) return false;
    const target = key === "unitA" ? ANSWERS.unitA : ANSWERS.unitB;
    return Math.abs(v - target) < 0.005; // accept 2, 2.0, 2.00, $2 ; 1.6, 1.60, $1.60
  }

  // Targeted, misconception-aware feedback (generated locally).
  function calcMissMessage(key, raw) {
    const v = parseMoney(raw);
    if (key === "unitA") {
      if (Math.abs(v - 6) < 0.01) return t("missA6");
      if (Math.abs(v - 3) < 0.01) return t("missA3");
      if (Math.abs(v - 0.5) < 0.01) return t("missAinv");
      return t("missA");
    }
    if (key === "unitB") {
      if (Math.abs(v - 8) < 0.01) return t("missB8");
      if (Math.abs(v - 5) < 0.01) return t("missB5");
      if (Math.abs(v - 0.625) < 0.01) return t("missBinv");
      return t("missB");
    }
    return t("missDefault");
  }

  function refreshDataLabGate() {
    const allSolved = CALC_DEFS.every((d) => state.calc[d.key].solved);
    const btn = $("#toGraphBtn");
    if (btn) btn.disabled = !allSolved;
    if (allSolved) unlock("graph");
  }

  /* ============================ 4. GRAPH — RATIO TABLE ============================ */
  // RATIO.rows: index 1 is the given anchor (5 -> $8). Editable rows are 0,2,3.
  const TABLE_EDIT_ROWS = RATIO.rows.map((r, i) => (r.given ? null : i)).filter((i) => i !== null); // [0,2,3]

  function renderTable() {
    const table = $("#ratioTable");
    if (!table) return;
    // header + two data rows (tacos / dollars)
    const tacosCells = RATIO.rows.map((r) => `<td class="${r.given ? "rt-given" : ""}">${r.tacos}</td>`).join("");
    let dollarCells = "";
    RATIO.rows.forEach((r, i) => {
      if (r.given) {
        dollarCells += `<td class="rt-given">${money(r.dollars)}</td>`;
      } else {
        const editIdx = TABLE_EDIT_ROWS.indexOf(i);
        const val = state.table.cells[editIdx] || "";
        dollarCells += `<td><input type="text" inputmode="decimal" id="rt-${i}" data-edit="${editIdx}"
          value="${escapeAttr(val)}" placeholder="$?" aria-label="${escapeAttr(fmt("tableAria", { n: r.tacos }))}" ${state.table.solved ? "disabled" : ""} /></td>`;
      }
    });
    table.innerHTML = `
      <thead>
        <tr><th>Salsa Stop</th>${RATIO.rows.map(() => "<th></th>").join("")}</tr>
      </thead>
      <tbody>
        <tr><td class="rt-label">${t("tacosLabel")}</td>${tacosCells}</tr>
        <tr><td class="rt-label">${t("dollarsLabel")}</td>${dollarCells}</tr>
      </tbody>`;

    // wire inputs
    TABLE_EDIT_ROWS.forEach((rowIdx, editIdx) => {
      const input = $(`#rt-${rowIdx}`);
      if (!input) return;
      input.addEventListener("input", (e) => { state.table.cells[editIdx] = e.target.value; save(); });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") checkTable(); });
    });
  }

  function checkTable() {
    const fb = $("#tableFeedback");
    let allRight = true;
    let anyBlank = false;
    TABLE_EDIT_ROWS.forEach((rowIdx, editIdx) => {
      const input = $(`#rt-${rowIdx}`);
      if (!input) return;
      const raw = (state.table.cells[editIdx] || "").trim();
      input.classList.remove("cell-correct", "cell-wrong");
      if (raw === "") { anyBlank = true; allRight = false; return; }
      const v = parseMoney(raw);
      const target = RATIO.rows[rowIdx].dollars;
      const right = !Number.isNaN(v) && Math.abs(v - target) < 0.005;
      input.classList.add(right ? "cell-correct" : "cell-wrong");
      if (!right) allRight = false;
    });
    if (anyBlank) { setFeedback(fb, "no", t("tableFillAll")); return; }
    if (allRight) {
      state.table.solved = true;
      save();
      setFeedback(fb, "ok", t("tableOk"));
      unlockDnl();
      awardXp(t("xpTable"));
    } else {
      setFeedback(fb, "no", t("tableWrong"));
    }
  }

  function unlockDnl() {
    const block = $("#dnlBlock");
    block.classList.remove("locked");
    block.setAttribute("aria-disabled", "false");
    const tag = $("#dnlLockTag");
    if (tag) { tag.textContent = t("unlocked"); tag.classList.add("unlocked"); }
  }

  function resetTable() {
    state.table.cells = ["", "", ""];
    state.table.solved = false;
    save();
    renderTable();
    setFeedback($("#tableFeedback"), "", "");
  }

  /* ============================ 4. GRAPH — DOUBLE NUMBER LINE ============================ */
  function renderGraph() {
    const wrap = $("#dnl");
    if (!wrap) return;
    wrap.innerHTML = "";
    DNL.tacos.forEach((tacos, i) => {
      const fixed = i === 0; // 0 tacos -> $0 is fixed/given
      const col = document.createElement("div");
      col.className = "dnl-col";
      col.innerHTML = `
        <span class="dnl-taco">${tacos}</span>
        <span class="dnl-tick" aria-hidden="true"></span>
        <span class="dnl-mid">${t("dnlTacos")}</span>
        <span class="dnl-dollar-tick" aria-hidden="true"></span>
        <input type="text" inputmode="numeric" class="dnl-input" id="dnl-${i}"
          value="${fixed ? "0" : (state.graph.dollars[i] || state.graph.dollars[i] === 0 ? state.graph.dollars[i] : "")}"
          aria-label="${escapeAttr(fmt("dnlAria", { n: tacos }))}" ${fixed || state.graph.solved ? "disabled" : ""} />
        <div class="dnl-controls">
          <button class="dnl-btn" type="button" id="dnl-minus-${i}" aria-label="${escapeAttr(fmt("dnlDecAria", { n: tacos }))}" ${fixed || state.graph.solved ? "disabled" : ""}>−</button>
          <button class="dnl-btn" type="button" id="dnl-plus-${i}" aria-label="${escapeAttr(fmt("dnlIncAria", { n: tacos }))}" ${fixed || state.graph.solved ? "disabled" : ""}>+</button>
        </div>
      `;
      wrap.appendChild(col);

      if (fixed) { state.graph.dollars[0] = 0; return; }

      const input = $(`#dnl-${i}`);
      input.addEventListener("input", (e) => {
        const v = parseInt(String(e.target.value).replace(/[^0-9]/g, ""), 10);
        state.graph.dollars[i] = Number.isNaN(v) ? 0 : v;
        save();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkGraph();
        if (e.key === "ArrowUp") { e.preventDefault(); setDnl(i, state.graph.dollars[i] + 1); }
        if (e.key === "ArrowDown") { e.preventDefault(); setDnl(i, state.graph.dollars[i] - 1); }
      });
      $(`#dnl-plus-${i}`).addEventListener("click", () => setDnl(i, (state.graph.dollars[i] || 0) + DNL.step));
      $(`#dnl-minus-${i}`).addEventListener("click", () => setDnl(i, (state.graph.dollars[i] || 0) - DNL.step));
    });

    const interpLock = $("#interpLockTag");
    if (interpLock) {
      interpLock.textContent = state.graph.solved ? t("unlocked") : t("locked");
      interpLock.classList.toggle("unlocked", state.graph.solved);
    }
    if (state.table.solved) unlockDnl();
    if (state.graph.solved) {
      $("#interpBlock").classList.remove("locked");
      $("#interpBlock").setAttribute("aria-disabled", "false");
    }
    renderInterp();
  }

  function setDnl(i, val) {
    val = Math.max(0, Math.min(DNL.max, val));
    state.graph.dollars[i] = val;
    save();
    const input = $(`#dnl-${i}`);
    if (input) input.value = val;
  }

  function checkGraph() {
    const fb = $("#graphFeedback");
    let allRight = true;
    DNL.dollars.forEach((target, i) => {
      const input = $(`#dnl-${i}`);
      if (!input) return;
      const v = state.graph.dollars[i];
      const right = v === target;
      input.classList.remove("cell-correct", "cell-wrong");
      input.classList.add(right ? "cell-correct" : "cell-wrong");
      if (!right) allRight = false;
    });
    if (allRight) {
      state.graph.solved = true;
      save();
      setFeedback(fb, "ok", t("dnlOk"));
      $("#interpBlock").classList.remove("locked");
      $("#interpBlock").setAttribute("aria-disabled", "false");
      $("#interpLockTag").textContent = t("unlocked");
      $("#interpLockTag").classList.add("unlocked");
      awardXp(t("xpDnl"));
    } else {
      setFeedback(fb, "no", t("dnlWrong"));
    }
  }

  function resetGraph() {
    state.graph.dollars = [0, 0, 0, 0];
    state.graph.solved = false;
    save();
    renderGraph();
    setFeedback($("#graphFeedback"), "", "");
  }

  /* ---- interpretation ---- */
  // Options carry a stable `key` plus per-language labels; selection is stored
  // and compared by key, so toggling language never breaks matching.
  const INTERP = [
    {
      id: "less", qKey: "interpQLess",
      opts: [
        { key: "ttPrice", labelKey: "optTacoTownPrice" },
        { key: "ssPrice", labelKey: "optSalsaStopPrice" },
        { key: "same", labelKey: "optSame" },
      ],
      answerKey: "ssPrice",
    },
    {
      id: "ten", qKey: "interpQTen",
      opts: [
        { key: "c2", labelKey: "opt2cheaper" },
        { key: "c4", labelKey: "opt4cheaper" },
        { key: "c6", labelKey: "opt6cheaper" },
      ],
      answerKey: "c4",
    },
    {
      id: "value", qKey: "interpQValue",
      opts: [
        { key: "tt", labelKey: "optTacoTown" },
        { key: "ss", labelKey: "optSalsaStop" },
        { key: "cant", labelKey: "optCannotTell" },
      ],
      answerKey: "ss",
    },
  ];

  // Rebuilt on every render so option labels track the current language;
  // selection persists because it is stored/compared by stable opt.key.
  function renderInterp() {
    const wrap = $("#interpQuestions");
    if (!wrap) return;
    // Preserve any in-progress written text from the live DOM before rebuilding.
    const liveTa = $("#interpWritten");
    if (liveTa) state.interp.written = liveTa.value;
    wrap.innerHTML = "";
    INTERP.forEach((q) => {
      const div = document.createElement("div");
      div.className = "interp-q";
      div.innerHTML = `<p>${t(q.qKey)}</p><div class="opt-row" id="opts-${q.id}"></div>`;
      wrap.appendChild(div);
      q.opts.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.type = "button";
        b.textContent = t(opt.labelKey);
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
    writeDiv.innerHTML = `<p>${t("interpWriteQ")}</p>`;
    const ta = document.createElement("textarea");
    ta.className = "writebox";
    ta.rows = 2;
    ta.id = "interpWritten";
    ta.placeholder = t("interpWritePh");
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
      setFeedback(fb, "ok", t("interpOk"));
      $("#toDecisionBtn").disabled = false;
      unlock("decision");
      awardXp(t("xpInterp"));
    } else {
      let msg = fmt("interpScore", { n: correctCount, total: INTERP.length });
      if (!written) msg += t("interpNeedWritten");
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
    if (!state.decision.choice) { setFeedback(fb, "no", t("decPick")); return; }
    if (wc < 18) { setFeedback(fb, "no", fmt("decWords", { n: wc })); return; }

    state.decision.submitted = true;

    if (state.decision.choice === BEST_CHOICE) {
      state.decision.accepted = true;
      save();
      setFeedback(fb, "ok", t("decAccepted"));
      computeScore();
      unlock("reaction");
      awardXp(t("xpDecAccepted"));
      setTimeout(() => go("reaction"), 700);
    } else {
      // revision event
      state.decision.accepted = false;
      state.decision.revisions++;
      save();
      setFeedback(fb, "no", t("decRevise"));
      // still let them see a (revise) reaction so the loop is visible
      computeScore();
      unlock("reaction");
      awardXp(t("xpDecRevise"));
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

    // Data Confidence: unit rates + table + number line + interpretation
    let confidence = 0;
    confidence += calcSolved * 20; // 2 -> 40
    if (state.table.solved) confidence += 20;
    if (state.graph.solved) confidence += 25;
    if (state.interp.solved) confidence += 15;
    confidence -= Math.min(20, totalAttempts * 3); // penalize many misses
    confidence = clamp(confidence);

    // Explanation Strength: words + evidence keywords + correctness
    const evidenceHits = countEvidence(state.decision.text);
    let explanation = Math.min(50, decWords * 1.5) + evidenceHits * 10;
    if (acceptedBest) explanation += 15;
    explanation = clamp(explanation);

    // Public Trust: best decision + strong explanation, minus revisions
    let trust = (acceptedBest ? 55 : 20) + Math.round(explanation * 0.3) - state.decision.revisions * 8;
    trust = clamp(trust);

    // Fair Pricing (higher = fairer outcome for families)
    let fair = acceptedBest ? 70 : 30;
    if (state.graph.solved) fair += 15;
    if (acceptedBest && evidenceHits >= 2) fair += 15;
    fair = clamp(fair);

    state.meters = {
      trust: Math.round(trust),
      fair: Math.round(fair),
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

  // countEvidence keywords: unit rate, per taco, 1.60, 2.00, ratio, cheaper, value, dollars.
  function countEvidence(text) {
    const s = text.toLowerCase();
    let hits = 0;
    [
      /unit rate/,
      /per taco|per unit|each taco|a taco/,
      /1\.6\b|1\.60|\$1\.6/,
      /2\.0\b|2\.00|\$2\b|\$2\.0/,
      /ratio|rate\b/,
      /cheaper|less|lower|saves?/,
      /value|better deal|deal\b/,
      /dollar|\$/,
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
      { name: t("mFair"), val: state.meters.fair },
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

  /* ---- Enrichment: scale it up ---- */
  function renderOutlier() {
    const o = state.outlier;
    const ai = $("#input-omean"), bi = $("#input-omedian");
    if (!ai || !bi) return;
    ai.value = o.a; bi.value = o.b;
    ai.disabled = o.aSolved; bi.disabled = o.bSolved;
    const as = $("#state-omean"), bs = $("#state-omedian");
    if (as) { as.textContent = o.aSolved ? t("solved") : t("tryit"); as.classList.toggle("solved", o.aSolved); }
    if (bs) { bs.textContent = o.bSolved ? t("solved") : t("tryit"); bs.classList.toggle("solved", o.bSolved); }

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

  function checkOutlierCalc(which) {
    const o = state.outlier;
    const id = which === "a" ? "omean" : "omedian";
    const input = $(`#input-${id}`);
    const fb = $(`#fb-${id}`);
    const raw = input.value.trim();
    o[which] = raw;
    const v = parseMoney(raw);
    const target = which === "a" ? OUTLIER.aTotal : OUTLIER.bTotal;
    const ok = !Number.isNaN(v) && Math.abs(v - target) < 0.01;
    if (ok) {
      o[which + "Solved"] = true;
      save();
      setFeedback(fb, "ok", t("olCorrect"));
      renderOutlier();
      maybeOutlierDone();
    } else {
      save();
      setFeedback(fb, "no", which === "a" ? t("olTryA") : t("olTryB"));
    }
  }

  function maybeOutlierDone() {
    const o = state.outlier;
    if (o.aSolved && o.bSolved && o.which === OUTLIER.which) {
      setFeedback($("#outlierDone"), "ok", t("olDone"));
    }
  }

  function initOutlier() {
    $("#check-omean").addEventListener("click", () => checkOutlierCalc("a"));
    $("#check-omedian").addEventListener("click", () => checkOutlierCalc("b"));
    $("#input-omean").addEventListener("keydown", (e) => { if (e.key === "Enter") checkOutlierCalc("a"); });
    $("#input-omedian").addEventListener("keydown", (e) => { if (e.key === "Enter") checkOutlierCalc("b"); });
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
    if (wc < 35) { setFeedback(fb, "no", fmt("newsWords", { n: wc })); return; }
    state.news.submitted = true;
    save();
    setFeedback(fb, "ok", t("newsPublished"));
    unlock("passport");
    awardXp(t("xpNews"));
    setTimeout(() => go("passport"), 700);
  }

  /* ============================ 8. PASSPORT ============================ */
  function renderPassport() {
    $("#ppName").textContent = state.name || t("ppStudent");
    $("#ppRole").textContent = state.role || t("ppTeam");
    const tier = state.outcomeTier || "medium";
    $("#ppOutcome").textContent = tier === "good" ? t("ppApproved")
      : tier === "medium" ? t("ppReview") : t("ppRevise");

    // "recommend" skill credit requires the best choice AND real evidence,
    // not just the 18-word gate, so the checkmark reflects genuine reasoning.
    const recommendEarned = state.decision.accepted && countEvidence(state.decision.text) >= 2;
    const earned = {
      unit: CALC_DEFS.every((d) => state.calc[d.key].solved),
      table: state.table.solved,
      dnl: state.graph.solved,
      compare: state.interp.solved,
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
    const outcome = tier === "good" ? "Fair pricing adopted" : tier === "medium" ? "Decision under review" : "Report sent back for revision";
    const skills = {
      "Find a unit rate": CALC_DEFS.every((d) => state.calc[d.key].solved),
      "Complete a ratio table": state.table.solved,
      "Use a double number line": state.graph.solved,
      "Compare deals with rates": state.interp.solved,
      "Recommend with evidence": state.decision.accepted && countEvidence(state.decision.text) >= 2,
      "Revise thinking": state.decision.revisions > 0 || state.decision.accepted,
    };
    return `
      <h1>Neft City: Food Truck Face-Off — Proof of Learning</h1>
      <div class="pr-grid">
        <div class="pr-row"><b>Name:</b> ${escapeHtml(state.name || "—")}</div>
        <div class="pr-row"><b>Role:</b> ${escapeHtml(state.role || "—")}</div>
        <div class="pr-row"><b>Mission:</b> Food Truck Face-Off at the Fair</div>
        <div class="pr-row"><b>City Outcome:</b> ${outcome}</div>
      </div>

      <h2>The Deals</h2>
      <div class="pr-row">Taco Town: 3 tacos for $6 &nbsp;·&nbsp; Salsa Stop: 5 tacos for $8</div>

      <h2>Unit Rates ($ per taco)</h2>
      <div class="pr-grid">
        <div class="pr-row"><b>Taco Town:</b> ${escapeHtml(state.calc.unitA.value || "—")} (key: $2.00)</div>
        <div class="pr-row"><b>Salsa Stop:</b> ${escapeHtml(state.calc.unitB.value || "—")} (key: $1.60)</div>
      </div>

      <h2>Ratio Table — Salsa Stop ($1.60/taco)</h2>
      <div class="pr-row">${RATIO.rows.map((r) => `${r.tacos} tacos → ${money(r.dollars)}`).join(" &nbsp;·&nbsp; ")}</div>

      <h2>Double Number Line (tacos → dollars)</h2>
      <div class="pr-row">${DNL.tacos.map((tk, i) => `${tk} → $${state.graph.dollars[i]}`).join(" &nbsp;·&nbsp; ")}</div>

      <h2>Recommendation</h2>
      <div class="pr-row"><b>Choice:</b> ${state.decision.choice || "—"} (best: A — recommend Salsa Stop)</div>
      <div class="pr-row"><b>Explanation:</b> ${escapeHtml(state.decision.text || "—")}</div>

      <h2>News Report</h2>
      <div class="pr-row">${escapeHtml(state.news.text || "—")}</div>

      <h2>Reflection</h2>
      <div class="pr-row"><b>I understand better:</b> ${escapeHtml(state.reflect.r1 || "—")}</div>
      <div class="pr-row"><b>I want to practice:</b> ${escapeHtml(state.reflect.r2 || "—")}</div>

      <h2>Skill Checklist</h2>
      <ul>${Object.entries(skills).map(([k, v]) => `<li>${v ? "☑" : "☐"} ${k}</li>`).join("")}</ul>

      <h2>City Status</h2>
      <div class="pr-row">Public Trust: ${m.trust} &nbsp;·&nbsp; Fair Pricing: ${m.fair} &nbsp;·&nbsp; Data Confidence: ${m.confidence} &nbsp;·&nbsp; Explanation: ${m.explanation}</div>
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
    a.download = `neft-city-food-trucks_${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Delay revocation so slower browsers (Firefox/Safari/mobile) finish the fetch.
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast(t("downloaded"));
  }

  function resetMission() {
    if (!confirm(t("resetConfirm"))) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = defaultState();
    save();
    // rebuild dynamic UI
    const iq = $("#interpQuestions");
    if (iq) iq.dataset.built = "";
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
    if (c.unitA.attempts >= 2 && !c.unitA.solved) misconceptions.push("Taco Town rate: may be stopping at the total ($6) or inverting (tacos ÷ dollars).");
    if (c.unitB.attempts >= 2 && !c.unitB.solved) misconceptions.push("Salsa Stop rate: may be stopping at the total ($8) or inverting (tacos ÷ dollars).");
    if (state.table.solved === false && stepIndex(state.current) >= 3)
      misconceptions.push("Ratio table: may not be multiplying tacos × $1.60 consistently.");
    if (state.graph.solved === false && stepIndex(state.current) >= 3)
      misconceptions.push("Double number line: may not be adding $8 for every 5 tacos.");
    if (!misconceptions.length) misconceptions.push("None detected so far.");

    // recommendation quality
    let recQuality, recPill;
    if (acceptedBest && evidenceHits >= 2 && decWords >= 18) { recQuality = "Strong — best choice (recommend Salsa Stop) with 2+ pieces of rate evidence."; recPill = `<span class="t-pill good">strong</span>`; }
    else if (acceptedBest) { recQuality = "On track — best choice, evidence could cite the unit rates more."; recPill = `<span class="t-pill warn">developing</span>`; }
    else if (state.decision.submitted) { recQuality = "Needs revision — not yet the best-supported choice."; recPill = `<span class="t-pill bad">revise</span>`; }
    else { recQuality = "Not submitted yet."; recPill = `<span class="t-pill warn">pending</span>`; }

    // suggested next move
    let nextMove;
    if ((c.unitA.attempts >= 2 && !c.unitA.solved) || (c.unitB.attempts >= 2 && !c.unitB.solved)) nextMove = "Review unit rate: practice dollars ÷ tacos and emphasize the order (dollars first).";
    else if (!state.table.solved && stepIndex(state.current) >= 3) nextMove = "Review ratio tables: model multiplying each taco count by $1.60.";
    else if (!state.graph.solved && stepIndex(state.current) >= 3) nextMove = "Review the double number line: line up tacos with dollars and add $8 per 5 tacos.";
    else if (acceptedBest && evidenceHits < 2) nextMove = "Student can compute but needs support citing rates as evidence. Use sentence frames.";
    else if (calcSolved === 2 && state.table.solved && state.graph.solved && acceptedBest && evidenceHits >= 2) nextMove = "Student is ready for enrichment: scale to 25 tacos and compare totals ($50 vs $40).";
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
        <div class="tstat"><span>Unit rates (${calcSolved}/2)</span>${pill(calcSolved === 2, calcSolved >= 1)}</div>
        <div class="tstat"><span>Ratio table</span>${pill(state.table.solved, false)}</div>
        <div class="tstat"><span>Double number line</span>${pill(state.graph.solved, false)}</div>
        <div class="tstat"><span>Interpretation</span>${pill(state.interp.solved, false)}</div>
        <div class="tstat"><span>Recommendation</span>${recPill}</div>
      </div>

      <div class="teacher-section">
        <h3>Attempts per Unit Rate</h3>
        <div class="tstat"><span>Taco Town</span><b>${c.unitA.attempts} ${c.unitA.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Salsa Stop</span><b>${c.unitB.attempts} ${c.unitB.solved ? "✓" : ""}</b></div>
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
      div.id = "vocab-" + cssId(v.term);
      // Always bilingual so ESOL learners can use both languages side by side.
      div.innerHTML =
        `<h3>${v.term} <span class="vi-es">· ${v.es}</span></h3>` +
        `<p>${v.def}</p><p class="vi-ex">Example: ${v.ex}</p>` +
        `<p class="vi-trans"><strong>${v.es}:</strong> ${v.defEs}</p><p class="vi-ex">Ejemplo: ${v.exEs}</p>`;
      list.appendChild(div);
    });
  }
  function cssId(term) { return term.replace(/\s+/g, "-"); }
  function openVocab(term) {
    showModal("#vocabModal");
    if (term) {
      const el = $("#vocab-" + cssId(term));
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
    el.textContent = `${n} ${t("wordsLabel")}` + (n >= min ? " ✓" : ` (${t("wordsNeed")} ${min})`);
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
        if (target === "datalab") renderCalc();
        if (target === "graph") { renderTable(); renderGraph(); }
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

    // price lab
    renderCalc();

    // ratio table + double number line
    $("#checkTableBtn").addEventListener("click", checkTable);
    $("#resetTableBtn").addEventListener("click", resetTable);
    $("#checkGraphBtn").addEventListener("click", checkGraph);
    $("#resetGraphBtn").addEventListener("click", resetGraph);
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
    renderTable();
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
