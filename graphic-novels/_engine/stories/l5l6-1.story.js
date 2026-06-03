/* STORY · Unit 1 · Lessons 1-5 & 1-6 · Graphic Novel #1 (Support) · Decimal Docking Bay
   Comic-engine port of graphic-novels/lessons/u1-l5l6/graphic-novel-1.html.
   Act 1 (Fuel Totals · add & subtract decimals), Act 2 (Power Boost · multiply
   decimals & place the point), Final (Launch Code · add then multiply), Glossary,
   Mission Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, hints, sentence frames, and glossary
   are carried verbatim from the source HTML. New: panels, speech, AXIS voices the
   decimal-misplacement misconception, vocab pop-ups.
   NOTE: source HTML carried no `standard:` and no NTResults.finish(...) assessment
   string; meta.standard uses the unit decimal-operations standard and
   meta.assessment follows the reference naming pattern (see report FLAGS). */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "Decimal Docking Bay",
    standard: "6.NS.3",
    assessment: "Graphic Novel U1 #1: Decimal Docking Bay",
    artBase: "../../_art/unit1/",
    home: "../../index.html",
  },

  cast: {
    cadet: {
      name: "Cadet",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧑‍🚀",
      avatar: null,
      blurb: "You",
    },
    axis: {
      name: "AXIS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Station AI · misplaces the decimal point",
    },
    log: { name: "Station AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A space cadet stands at a glowing docking-bay console covered in decimal fuel readouts",
    blurbEn:
      "The station's fuel computer is glitching! Only correct <b>decimal math</b> can dock the supply ship. AXIS, the station AI, keeps misplacing the decimal point — line up those decimal points, catch its mistakes, and save the crew, Cadet.",
    blurbEs:
      "¡La computadora de combustible falla! Solo las matematicas con decimales pueden acoplar la nave. Alinea los puntos decimales y salva a la tripulacion.",
    startLabel: "Start Mission 🚀 ▶",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Fuel Totals",
      kicker: "Act 1 · Lesson 1-5",
      title: "Fuel Totals",
      advanceLabel: "Lock in the total ▶",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "Two fuel tanks with decimal gauges glowing on the bridge",
          lastLabel: "Add the fuel ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Cadet! Tank A holds 3.4 liters, Tank B holds 2.75 liters. I need the TOTAL fuel to dock.",
              es: "¡Cadete! El tanque A tiene 3.4 litros y el B tiene 2.75. Necesito el TOTAL para acoplar.",
            },
            {
              who: "cadet",
              en: "To add decimals I line up the decimal points first. I can annex a zero so 3.4 becomes 3.40.",
              es: "Para sumar decimales alineo los puntos primero. Puedo agregar un cero: 3.4 es 3.40.",
              vocab: [
                {
                  term: "decimal points",
                  en: "The dot that splits the whole number from the part after it.",
                  es: "El punto que separa el número entero de la parte que sigue.",
                },
                {
                  term: "annex a zero",
                  en: "Adding zeros at the end of a decimal so numbers line up evenly.",
                  es: "Agregar ceros al final de un decimal para que se alineen.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "Easy — I'll just add the digits: 3.4 + 2.75 = 6.9 liters. Entering it!",
              es: "Fácil: sumo los dígitos, 3.4 + 2.75 = 6.9 litros. ¡Lo ingreso!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "⛽ Fuel Lock #1 — stop me before I misalign it! Add the two tanks: 3.4 + 2.75. Line up the decimal points. What is the total?",
            es: "Suma los dos tanques: 3.4 + 2.75. Alinea los puntos. ¿Cuál es el total?",
          },
          hint: {
            en: "Annex a zero so both have 2 places: 3.40 + 2.75. Add hundredths, tenths, then ones.",
            es: "Agrega un cero para que ambos tengan 2 lugares: 3.40 + 2.75. Suma centésimas, décimas y unidades.",
          },
          frame: {
            en: "“I lined up the decimal points and added to get ____ liters.”",
            es: "“Alineé los puntos decimales y sumé para obtener ____ litros.”",
          },
          choices: [
            {
              en: "6.15 liters  (3.40 + 2.75)",
              es: "6.15 litros (3.40 + 2.75)",
              correct: true,
            },
            {
              en: "5.79 liters",
              es: "5.79 litros",
              correct: false,
            },
            {
              en: "6.9 liters  (added without lining up)",
              es: "6.9 litros (sumado sin alinear)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct! 3.40 + 2.75 = 6.15 liters. Lining up the points keeps each place value matched.",
          goodEs: "¡Correcto! 3.40 + 2.75 = 6.15 litros.",
          badEn:
            "❌ Check your places. Annex a zero (3.40) and line up the decimal points, then add.",
          badEs:
            "❌ Revisa los valores posicionales. Agrega un cero (3.40) y alinea los puntos.",
          solveBeat: {
            who: "cadet",
            en: "Total locked in! Now a leak — I must subtract what we lost.",
            es: "¡Total listo! Ahora hay una fuga: debo restar lo que perdimos.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "⛽ Fuel Lock #2 — a leak drains fuel. Start with 8.5 liters and subtract 3.27 liters. How much is left?",
            es: "Una fuga drena combustible. De 8.5 litros resta 3.27. ¿Cuánto queda?",
          },
          hint: {
            en: "Annex a zero: 8.50 - 3.27. Line up the points and subtract place by place.",
            es: "Agrega un cero: 8.50 - 3.27. Alinea los puntos y resta posición por posición.",
          },
          frame: {
            en: "“After lining up the points, 8.50 - 3.27 = ____ liters.”",
            es: "“Después de alinear los puntos, 8.50 - 3.27 = ____ litros.”",
          },
          choices: [
            {
              en: "5.23 liters  (8.50 - 3.27)",
              es: "5.23 litros (8.50 - 3.27)",
              correct: true,
            },
            {
              en: "5.27 liters",
              es: "5.27 litros",
              correct: false,
            },
            {
              en: "4.23 liters",
              es: "4.23 litros",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 8.50 - 3.27 = 5.23 liters. The decimal points stay lined up in the answer too.",
          goodEs: "¡Sí! 8.50 - 3.27 = 5.23 litros.",
          badEn:
            "❌ Annex a zero (8.50) and subtract place by place, keeping the decimal points aligned.",
          badEs: "❌ Agrega un cero (8.50) y resta posición por posición.",
          solveBeat: {
            who: "cadet",
            en: "Fuel total confirmed and the leak accounted for. The ship can dock!",
            es: "Total de combustible confirmado y la fuga contada. ¡La nave puede acoplar!",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Power Boost",
      kicker: "Act 2 · Lesson 1-6",
      title: "Power Boost",
      advanceLabel: "Charge the core ▶",
      steps: [
        {
          type: "beats",
          art: "factor-tree.png",
          alt: "A glowing reactor core multiplying decimal energy values",
          lastLabel: "Multiply ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Docking complete. Now multiply decimals to set the reactor power. No lining up needed — count the decimal places!",
              es: "Acople listo. Ahora multiplica decimales para la potencia. No alineas: ¡cuenta los lugares decimales!",
            },
            {
              who: "cadet",
              en: "Right — I multiply like whole numbers, then place the decimal point using the total number of decimal places.",
              es: "Claro: multiplico como enteros y luego coloco el punto usando el total de lugares decimales.",
              vocab: [
                {
                  term: "decimal places",
                  en: "How many digits come after the decimal point.",
                  es: "Cuántos dígitos vienen después del punto decimal.",
                },
                {
                  term: "product",
                  en: "The answer when you multiply.",
                  es: "El resultado cuando multiplicas.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "6 × 4 = 24, so 0.6 × 0.4 = 2.4! Setting reactor power to 2.4.",
              es: "6 × 4 = 24, ¡así que 0.6 × 0.4 = 2.4! Ajusto la potencia a 2.4.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "axis",
            en: "⚡ Power Lock #1 — set the reactor: 0.6 × 0.4. Multiply, then place the decimal point. What is the product?",
            es: "Ajusta el reactor: 0.6 × 0.4. Multiplica y coloca el punto. ¿Cuál es el producto?",
          },
          hint: {
            en: "6 × 4 = 24. There is 1 decimal place in 0.6 and 1 in 0.4 — that's 2 places total, so the product has 2 places.",
            es: "6 × 4 = 24. Hay 1 lugar decimal en 0.6 y 1 en 0.4: 2 lugares en total, así que el producto tiene 2 lugares.",
          },
          frame: {
            en: "“0.6 has 1 place and 0.4 has 1 place, so the product 0.24 has ____ decimal places.”",
            es: "“0.6 tiene 1 lugar y 0.4 tiene 1 lugar, así que el producto 0.24 tiene ____ lugares decimales.”",
          },
          choices: [
            {
              en: "0.24  (2 decimal places)",
              es: "0.24 (2 lugares decimales)",
              correct: true,
            },
            {
              en: "2.4",
              es: "2.4",
              correct: false,
            },
            {
              en: "0.024",
              es: "0.024",
              correct: false,
            },
          ],
          goodEn: "✅ Correct! 6×4=24, and 1+1=2 decimal places gives 0.24.",
          goodEs: "¡Correcto! 6×4=24, y 1+1=2 lugares: 0.24.",
          badEn:
            "❌ Multiply 6×4=24, then count decimal places: 1+1=2, so the answer is 0.24.",
          badEs:
            "❌ Multiplica 6×4=24 y cuenta los lugares: 1+1=2, así que es 0.24.",
          solveBeat: {
            who: "cadet",
            en: "Core stable! One more: a smaller setting with extra decimal places.",
            es: "¡Núcleo estable! Una más: un ajuste pequeño con más decimales.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "cadet",
            en: "⚡ Power Lock #2 — fine-tune the power: 1.2 × 0.05. Multiply, then place the decimal point correctly.",
            es: "Ajuste fino: 1.2 × 0.05. Multiplica y coloca bien el punto.",
          },
          hint: {
            en: "12 × 5 = 60. Places: 1 (in 1.2) + 2 (in 0.05) = 3. You may need to annex a zero in front.",
            es: "12 × 5 = 60. Lugares: 1 (en 1.2) + 2 (en 0.05) = 3. Quizás debas agregar un cero adelante.",
          },
          frame: {
            en: "“1.2 (1 place) × 0.05 (2 places) needs ____ decimal places, so the product is 0.06.”",
            es: "“1.2 (1 lugar) × 0.05 (2 lugares) necesita ____ lugares decimales, así que el producto es 0.06.”",
          },
          choices: [
            {
              en: "0.06  (3 decimal places, annex a zero)",
              es: "0.06 (3 lugares decimales, agrega un cero)",
              correct: true,
            },
            {
              en: "0.6",
              es: "0.6",
              correct: false,
            },
            {
              en: "0.006",
              es: "0.006",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 12×5=60; with 3 decimal places that is 0.060 = 0.06. Reactor tuned!",
          goodEs: "¡Sí! 12×5=60; con 3 lugares es 0.060 = 0.06.",
          badEn: "❌ 12×5=60. Count places: 1+2=3, so write 0.060 = 0.06.",
          badEs: "❌ 12×5=60. Cuenta lugares: 1+2=3, así que 0.060 = 0.06.",
          solveBeat: {
            who: "cadet",
            en: "Reactor charged and tuned. Now for the final launch code.",
            es: "Reactor cargado y ajustado. Ahora el código final de lanzamiento.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: Launch Code",
      kicker: "Final · Lessons 1-5 & 1-6",
      title: "The Launch Code",
      advanceLabel: "Launch! 🌟 ▶",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A glowing launch console asking for one combined decimal code",
          lastLabel: "Enter the code ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Final launch code, Cadet! It uses BOTH skills — add, then multiply.",
              es: "¡Código final, Cadete! Usa AMBAS destrezas: suma y luego multiplica.",
            },
            {
              who: "cadet",
              en: "First I add 4.5 + 1.5, then multiply the sum by 0.5. Order matters!",
              es: "Primero sumo 4.5 + 1.5, luego multiplico por 0.5. ¡El orden importa!",
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll start: 4.5 + 1.5 = 6.0, then 6.0 × 0.5 = 30! Entering 30.",
              es: "Yo empiezo: 4.5 + 1.5 = 6.0, luego 6.0 × 0.5 = 30. ¡Ingreso 30!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "🔒 Launch Code — compute (4.5 + 1.5) × 0.5. Add first, then multiply. Which line is fully correct?",
            es: "Calcula (4.5 + 1.5) × 0.5. Suma primero, luego multiplica. ¿Cuál línea es correcta?",
          },
          hint: {
            en: "4.5 + 1.5 = 6.0. Then 6.0 × 0.5 = 3.0 (half of 6).",
            es: "4.5 + 1.5 = 6.0. Luego 6.0 × 0.5 = 3.0 (la mitad de 6).",
          },
          frame: {
            en: "“4.5 + 1.5 = ____, and that sum × 0.5 = ____.”",
            es: "“4.5 + 1.5 = ____, y esa suma × 0.5 = ____.”",
          },
          choices: [
            {
              en: "4.5 + 1.5 = 6.0, then 6.0 × 0.5 = 3.0",
              es: "4.5 + 1.5 = 6.0, luego 6.0 × 0.5 = 3.0",
              correct: true,
            },
            {
              en: "4.5 + 1.5 = 6.0, then 6.0 × 0.5 = 30",
              es: "4.5 + 1.5 = 6.0, luego 6.0 × 0.5 = 30",
              correct: false,
            },
            {
              en: "4.5 + 1.5 = 5.0, then 5.0 × 0.5 = 2.5",
              es: "4.5 + 1.5 = 5.0, luego 5.0 × 0.5 = 2.5",
              correct: false,
            },
          ],
          goodEn:
            "✅ CODE ACCEPTED! 6.0 × 0.5 = 3.0 — exactly half of 6. Launch sequence go!",
          goodEs: "¡CÓDIGO ACEPTADO! 6.0 × 0.5 = 3.0. ¡Lanzamiento listo!",
          badEn:
            "❌ Add first: 4.5 + 1.5 = 6.0. Then 6.0 × 0.5 is HALF of 6, which is 3.0 — not 30.",
          badEs:
            "❌ Suma primero: 4.5 + 1.5 = 6.0. Luego × 0.5 es la MITAD de 6, o sea 3.0.",
          solveBeat: {
            who: "cadet",
            en: "Launch code accepted — the supply ship is away! Great teamwork, AXIS.",
            es: "¡Código aceptado, la nave despega! Buen trabajo en equipo, AXIS.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "📖",
      en: "Decimal",
      es: "Decimal",
      def: "A number with a dot that shows a part between whole numbers.",
    },
    {
      ico: "📖",
      en: "Place value",
      es: "Valor posicional",
      def: "What a digit is worth based on where it sits in a number.",
    },
    {
      ico: "📖",
      en: "Tenths",
      es: "Décimas",
      def: "The first spot after the decimal point. It shows parts out of 10.",
    },
    {
      ico: "📖",
      en: "Hundredths",
      es: "Centésimas",
      def: "The second spot after the decimal point. It shows parts out of 100.",
    },
    {
      ico: "📖",
      en: "Annex zeros",
      es: "Agregar ceros",
      def: "Adding zeros at the end of a decimal so numbers line up evenly.",
    },
    {
      ico: "📖",
      en: "Product",
      es: "Producto",
      def: "The answer when you multiply.",
    },
    {
      ico: "📖",
      en: "Decimal point",
      es: "Punto decimal",
      def: "The dot that splits the whole number from the part after it.",
    },
    {
      ico: "📖",
      en: "Estimate",
      es: "Estimar",
      def: "A close answer you get by rounding first.",
    },
    {
      ico: "📖",
      en: "Decimal places",
      es: "Cifras decimales",
      def: "How many digits come after the decimal point.",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "The cadet watches the supply ship launch safely into a star field",
    badge: "🎉⭐",
    titleEn: "Mission Complete!",
    en: "You added and subtracted decimals to dock the ship and multiplied decimals to power the launch. The station is fueled and flying. Great work, Cadet!",
    es: "¡Sumaste, restaste y multiplicaste decimales para salvar la estación! Excelente trabajo.",
    master: {
      headingEn: "Bonus challenge — for mastery, not required.",
      promptEn:
        "Master check: 2.5 × 0.4. Multiply, then place the decimal point. What is the product?",
      promptEs:
        "Reto maestro: 2.5 × 0.4. Multiplica y coloca el punto. ¿Cuál es el producto?",
      choices: [
        {
          en: "1  (25 × 4 = 100, 2 decimal places → 1.00)",
          correct: true,
        },
        { en: "10", correct: false },
        { en: "0.1", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
