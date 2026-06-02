/* STORY · Unit 1 · Lessons 1-5 & 1-6 · Graphic Novel #2 (Enrichment) · Decimal Docking Bay: Deep Space
   Comic-engine port of graphic-novels/lessons/u1-l5l6/graphic-novel-2.html.
   Act 1 (Supply Manifest · add three decimals & remaining capacity),
   Act 2 (Thruster Calibration · multiply decimals & scale the array),
   Final (Fleet Launch · multi-step add then multiply), Glossary,
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
    version: 2,
    level: "Enrichment",
    title: "Decimal Docking Bay: Deep Space",
    standard: "6.NS.3",
    assessment: "Graphic Novel U1 #2: Decimal Docking Bay: Deep Space",
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
    alt: "A confident cadet commands a deep-space station with multi-step decimal mission boards",
    blurbEn:
      "Command rank, Cadet. These missions chain several decimal operations and ask you to reason about place value, not just compute. AXIS keeps misplacing the decimal point — think it through, catch its mistakes, and launch the fleet.",
    blurbEs:
      "Rango de mando, Cadete. Estas misiones encadenan operaciones con decimales y piden razonar sobre el valor posicional. Piensa bien y lanza la flota.",
    startLabel: "Begin Command 🚀 ▶",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Supply Manifest",
      kicker: "Act 1 · Lesson 1-5",
      title: "The Supply Manifest",
      advanceLabel: "Confirm the manifest ▶",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "A holographic manifest listing several decimal supply masses",
          lastLabel: "Add the crates ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Commander, three crates: 2.45 kg, 1.8 kg, and 0.75 kg. I need the exact combined mass.",
              es: "Comandante, tres cajas: 2.45 kg, 1.8 kg y 0.75 kg. Necesito la masa combinada exacta.",
            },
            {
              who: "cadet",
              en: "I'll annex zeros so every value has two decimal places, then add carefully.",
              es: "Agregaré ceros para que todos tengan dos decimales y luego sumaré con cuidado.",
              vocab: [
                {
                  term: "decimal places",
                  en: "How many digits come after the decimal point.",
                  es: "Cuántos dígitos vienen después del punto decimal.",
                },
                {
                  term: "annex zeros",
                  en: "Adding zeros at the end of a decimal so numbers line up evenly.",
                  es: "Agregar ceros al final de un decimal para que se alineen.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll line up the digits without padding: 2.45 + 1.8 + 0.75 → I get 5.28 kg!",
              es: "Alineo los dígitos sin rellenar: 2.45 + 1.8 + 0.75 → ¡me da 5.28 kg!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "📦 Manifest Lock #1 — add all three crates: 2.45 + 1.8 + 0.75. What is the total mass?",
            es: "Suma las tres cajas: 2.45 + 1.8 + 0.75. ¿Cuál es la masa total?",
          },
          hint: {
            en: "Annex a zero so 1.8 = 1.80. Then 2.45 + 1.80 + 0.75. Add the hundredths first.",
            es: "Agrega un cero para que 1.8 = 1.80. Luego 2.45 + 1.80 + 0.75. Suma primero las centésimas.",
          },
          frame: {
            en: "“Lining up all three, 2.45 + 1.80 + 0.75 = ____ kg.”",
            es: "“Alineando las tres, 2.45 + 1.80 + 0.75 = ____ kg.”",
          },
          choices: [
            {
              en: "5.00 kg  (2.45 + 1.80 + 0.75)",
              es: "5.00 kg (2.45 + 1.80 + 0.75)",
              correct: true,
            },
            {
              en: "4.98 kg",
              es: "4.98 kg",
              correct: false,
            },
            {
              en: "5.28 kg",
              es: "5.28 kg",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly! 2.45 + 1.80 + 0.75 = 5.00 kg. Annexing 1.8 → 1.80 kept the places aligned.",
          goodEs: "¡Exacto! 2.45 + 1.80 + 0.75 = 5.00 kg.",
          badEn:
            "❌ Annex a zero (1.80) and add the hundredths column first: 5 + 0 + 5 = 10, carry the tenth.",
          badEs: "❌ Agrega un cero (1.80) y suma primero las centésimas.",
          solveBeat: {
            who: "cadet",
            en: "Manifest confirmed. Now find the difference from our 6 kg limit.",
            es: "Manifiesto confirmado. Ahora halla la diferencia con el límite de 6 kg.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "📦 Manifest Lock #2 — the cargo limit is 6 kg. With 5.00 kg loaded, how much more mass can you add?",
            es: "El límite es 6 kg. Con 5.00 kg cargados, ¿cuánta masa más cabe?",
          },
          hint: {
            en: "Subtract: 6.00 - 5.00. Annex zeros so both have two decimal places.",
            es: "Resta: 6.00 - 5.00. Agrega ceros para que ambos tengan dos decimales.",
          },
          frame: {
            en: "“6.00 - 5.00 = ____ kg of room left.”",
            es: "“6.00 - 5.00 = ____ kg de espacio libre.”",
          },
          choices: [
            {
              en: "1.00 kg",
              es: "1.00 kg",
              correct: true,
            },
            {
              en: "0.10 kg",
              es: "0.10 kg",
              correct: false,
            },
            {
              en: "11 kg",
              es: "11 kg",
              correct: false,
            },
          ],
          goodEn: "✅ Right! 6.00 - 5.00 = 1.00 kg of room remains.",
          goodEs: "¡Correcto! 6.00 - 5.00 = 1.00 kg de espacio.",
          badEn: "❌ Subtract 5.00 from 6.00: that leaves 1.00 kg.",
          badEs: "❌ Resta 5.00 de 6.00: queda 1.00 kg.",
          solveBeat: {
            who: "cadet",
            en: "Manifest signed off with capacity to spare. On to the thrusters.",
            es: "Manifiesto firmado con capacidad de sobra. Sigamos con los propulsores.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Thruster Calibration",
      kicker: "Act 2 · Lesson 1-6",
      title: "Thruster Calibration",
      advanceLabel: "Calibrate thrusters ▶",
      steps: [
        {
          type: "beats",
          art: "factor-tree.png",
          alt: "A cadet calibrating thrusters with decimal multiplier dials",
          lastLabel: "Calibrate ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Each thruster uses 0.25 units of plasma. We are firing 1.2 thruster-seconds. How much plasma?",
              es: "Cada propulsor usa 0.25 de plasma. Encenderemos 1.2 segundos. ¿Cuánto plasma?",
            },
            {
              who: "cadet",
              en: "Multiply like whole numbers, then count three decimal places total.",
              es: "Multiplico como enteros y cuento tres lugares decimales en total.",
              vocab: [
                {
                  term: "decimal places",
                  en: "How many digits come after the decimal point.",
                  es: "Cuántos dígitos vienen después del punto decimal.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "12 × 25 = 300, so 1.2 × 0.25 = 3.0 units! Calibrating to 3.0.",
              es: "12 × 25 = 300, ¡así que 1.2 × 0.25 = 3.0 unidades! Calibro a 3.0.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "axis",
            en: "🔥 Thruster Lock #1 — compute 1.2 × 0.25 to find the plasma used. What is the product?",
            es: "Calcula 1.2 × 0.25 para el plasma usado. ¿Cuál es el producto?",
          },
          hint: {
            en: "12 × 25 = 300. Decimal places: 1 (in 1.2) + 2 (in 0.25) = 3, so 0.300 = 0.3.",
            es: "12 × 25 = 300. Lugares decimales: 1 (en 1.2) + 2 (en 0.25) = 3, así que 0.300 = 0.3.",
          },
          frame: {
            en: "“12 × 25 = 300, and with 3 decimal places that is 0.3 units.”",
            es: "“12 × 25 = 300, y con 3 lugares decimales eso es 0.3 unidades.”",
          },
          choices: [
            {
              en: "0.3 units  (0.300)",
              es: "0.3 unidades (0.300)",
              correct: true,
            },
            {
              en: "3.0 units",
              es: "3.0 unidades",
              correct: false,
            },
            {
              en: "0.03 units",
              es: "0.03 unidades",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 12×25=300; 3 decimal places gives 0.300 = 0.3 units of plasma.",
          goodEs: "¡Sí! 12×25=300; 3 lugares dan 0.300 = 0.3.",
          badEn: "❌ 12×25=300. Count places: 1+2=3, so 0.300 = 0.3.",
          badEs: "❌ 12×25=300. Cuenta lugares: 1+2=3, así que 0.3.",
          solveBeat: {
            who: "cadet",
            en: "Calibrated! Now scale it up for the whole array.",
            es: "¡Calibrado! Ahora escálalo para todo el arreglo.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "cadet",
            en: "🔥 Thruster Lock #2 — the array has 4 thrusters. If one uses 0.3 units, the array uses 4 × 0.3. How much plasma total?",
            es: "El arreglo tiene 4 propulsores. Si uno usa 0.3, el arreglo usa 4 × 0.3. ¿Cuánto total?",
          },
          hint: {
            en: "4 × 3 = 12, and 0.3 has 1 decimal place, so the product has 1 decimal place: 1.2.",
            es: "4 × 3 = 12, y 0.3 tiene 1 lugar decimal, así que el producto tiene 1 lugar decimal: 1.2.",
          },
          frame: {
            en: "“4 × 0.3 = ____ units of plasma for the whole array.”",
            es: "“4 × 0.3 = ____ unidades de plasma para todo el arreglo.”",
          },
          choices: [
            {
              en: "1.2 units",
              es: "1.2 unidades",
              correct: true,
            },
            {
              en: "0.12 units",
              es: "0.12 unidades",
              correct: false,
            },
            {
              en: "12 units",
              es: "12 unidades",
              correct: false,
            },
          ],
          goodEn: "✅ Correct! 4 × 0.3 = 1.2 units. Array calibrated!",
          goodEs: "¡Correcto! 4 × 0.3 = 1.2 unidades.",
          badEn: "❌ 4 × 3 = 12, with 1 decimal place that is 1.2.",
          badEs: "❌ 4 × 3 = 12, con 1 lugar decimal es 1.2.",
          solveBeat: {
            who: "cadet",
            en: "Whole array calibrated and balanced. Time for the fleet launch code.",
            es: "Todo el arreglo calibrado y equilibrado. Hora del código de lanzamiento de la flota.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: Fleet Launch",
      kicker: "Final · Lessons 1-5 & 1-6",
      title: "The Fleet Launch Code",
      advanceLabel: "Launch the fleet! 🌟 ▶",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A commander entering a multi-step decimal launch code for a fleet",
          lastLabel: "Enter the code ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Final code, Commander: it chains a sum and a product. Reason carefully.",
              es: "Código final, Comandante: encadena una suma y un producto. Razona con cuidado.",
            },
            {
              who: "cadet",
              en: "Add 3.25 + 0.75 first, then multiply that sum by 0.5.",
              es: "Sumo 3.25 + 0.75 primero, luego multiplico por 0.5.",
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll start: 3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 20! Entering 20.",
              es: "Yo empiezo: 3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 20. ¡Ingreso 20!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "🔒 Fleet Code — compute (3.25 + 0.75) × 0.5. Which line is fully correct?",
            es: "Calcula (3.25 + 0.75) × 0.5. ¿Cuál línea es correcta?",
          },
          hint: {
            en: "3.25 + 0.75 = 4.00. Then 4.00 × 0.5 = 2.0 (half of 4).",
            es: "3.25 + 0.75 = 4.00. Luego 4.00 × 0.5 = 2.0 (la mitad de 4).",
          },
          frame: {
            en: "“3.25 + 0.75 = ____, and that sum × 0.5 = ____.”",
            es: "“3.25 + 0.75 = ____, y esa suma × 0.5 = ____.”",
          },
          choices: [
            {
              en: "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 2.0",
              es: "3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 2.0",
              correct: true,
            },
            {
              en: "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 20",
              es: "3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 20",
              correct: false,
            },
            {
              en: "3.25 + 0.75 = 3.90, then 3.90 × 0.5 = 1.95",
              es: "3.25 + 0.75 = 3.90, luego 3.90 × 0.5 = 1.95",
              correct: false,
            },
          ],
          goodEn:
            "✅ FLEET CODE ACCEPTED! 4.00 × 0.5 = 2.0 — exactly half of 4. The fleet launches!",
          goodEs: "¡CÓDIGO ACEPTADO! 4.00 × 0.5 = 2.0. ¡La flota despega!",
          badEn:
            "❌ Add first: 3.25 + 0.75 = 4.00. Then × 0.5 is HALF of 4, which is 2.0 — not 20.",
          badEs:
            "❌ Suma primero: 3.25 + 0.75 = 4.00. Luego × 0.5 es la MITAD de 4, o sea 2.0.",
          solveBeat: {
            who: "cadet",
            en: "Fleet launch code accepted — every ship is away! Command rank earned.",
            es: "¡Código de la flota aceptado, todas las naves despegan! Rango de mando ganado.",
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
    alt: "A proud commander salutes as a fleet of ships launches into deep space",
    badge: "🎉⭐",
    titleEn: "Fleet Launched!",
    en: "You chained decimal addition, subtraction, and multiplication across the whole mission. Command rank earned, Commander!",
    es: "¡Encadenaste sumas, restas y multiplicaciones con decimales en toda la misión! Rango de mando ganado.",
    master: {
      headingEn: "Bonus challenge — for mastery, not required.",
      promptEn: "Command challenge: (1.5 + 2.5) × 0.25. What is the result?",
      promptEs: "Reto de mando: (1.5 + 2.5) × 0.25. ¿Cuál es el resultado?",
      choices: [
        {
          en: "1  (4 × 0.25 = 1.00)",
          correct: true,
        },
        { en: "10", correct: false },
        { en: "0.4", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified: Fleet Launched!",
    },
  },
};
