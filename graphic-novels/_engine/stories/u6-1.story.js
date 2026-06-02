/* STORY · Unit 6 · Graphic Novel #1 (Support) · Festival Producer: Power Up the Show
   Phase-2 build: full novel — Act 1 (Speaker Power), Act 2 (Stage & Lights),
   Final Show (The Headliner), Glossary, Show Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, sentence frames, and glossary are
   carried verbatim from graphic-novels/unit6/graphic-novel-1.html (6.EE.2c).
   New: panels, speech, ECHO-voices-the-misconception, vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 6,
    version: 1,
    level: "Support",
    title: "Festival Producer: Power Up the Show 🎤",
    standard: "6.EE.2c",
    assessment: "Graphic Novel U6 #1: Festival Producer: Power Up the Show",
    artBase: "../_art/unit6/",
    home: "../index.html",
  },

  cast: {
    producer: {
      name: "The Producer",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🎤",
      avatar: null,
      blurb: "You",
    },
    echo: {
      name: "ECHO",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🎚️",
      avatar: null,
      blurb: "Soundboard AI · reads left-to-right, ignores powers",
    },
    log: { name: "Festival Log", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Mika, a young festival producer, stands center stage at a glowing music festival with speakers and lights behind her",
    blurbEn:
      "You are <b>Mika</b>, a young music festival producer. The big show is tonight! But the stages are dark. To turn on the speakers, lights, and screens, you must solve <b>powers</b> and <b>expressions</b>. ECHO, the soundboard AI, wants to help… but it keeps reading the math left-to-right. Power up the show!",
    blurbEs:
      "Eres Mika, productora de un festival de música. Usa <b>potencias</b> y <b>expresiones</b> para encender el escenario.",
    startLabel: "Start the Show 🎉",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Speaker Power",
      kicker: "Act 1 · Powers & Exponents",
      title: "Speaker Power",
      advanceLabel: "Power the speakers 🔊",
      steps: [
        {
          type: "beats",
          art: "speaker-power.png",
          alt: "Mika looks up at a giant wall of speakers with a glowing power gauge",
          lastLabel: "Stop ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The show is tonight and the stages are dark! The speaker wall needs power 2 to the 4th.",
              es: "¡El show es esta noche y los escenarios están apagados! El muro de bocinas necesita la potencia 2 a la 4.",
            },
            {
              who: "producer",
              en: "A power means I multiply the base by itself. The base is 2, the exponent is 4. Let me read the panel.",
              es: "Una potencia significa multiplicar la base por sí misma. La base es 2 y el exponente es 4. Voy a leer el panel.",
              vocab: [
                {
                  term: "power",
                  en: "A way to show repeated multiplication. Example: 2⁴ means 2 multiplied 4 times.",
                  es: "Una forma de mostrar la multiplicación repetida. Ejemplo: 2⁴ significa 2 multiplicado 4 veces.",
                },
              ],
            },
            {
              who: "echo",
              misconception: true,
              en: "Easy — 2 to the 4th is just 2 × 4 = 8. I'll punch in 8 and wake the speakers!",
              es: "Fácil: 2 a la 4 es solo 2 × 4 = 8. ¡Voy a poner 8 para encender las bocinas!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "echo",
            en: "Wait — stop me before I get it wrong. The speaker power is <b>2<sup>4</sup></b>. A power means <b>repeated multiplication</b>. The base is 2 and the exponent is 4. What is 2<sup>4</sup>?",
            es: "¿Cuánto es 2⁴ (2 multiplicado 4 veces)?",
          },
          hint: {
            en: "2⁴ = 2 × 2 × 2 × 2. Multiply two at a time: 2×2 = 4, then 4×2 = 8, then 8×2 = 16.",
            es: "2⁴ = 2 × 2 × 2 × 2. Multiplica de dos en dos: 2×2 = 4, luego 4×2 = 8, luego 8×2 = 16.",
          },
          choices: [
            {
              en: "8",
              tree: "(that is only 2 × 4)",
              es: "(eso es solo 2 × 4)",
              correct: false,
            },
            {
              en: "16",
              tree: "(2 × 2 × 2 × 2 = 16)",
              es: "(2 × 2 × 2 × 2 = 16)",
              correct: true,
            },
            {
              en: "6",
              tree: "(that is only 2 + 4)",
              es: "(eso es solo 2 + 4)",
              correct: false,
            },
          ],
          goodEn: "✅ Yes! 2⁴ = 2×2×2×2 = 16. The speaker wall lights up!",
          goodEs: "¡Sí! 2⁴ = 16. ¡Las bocinas encienden!",
          badEn:
            "❌ An exponent means multiply, not add. 2⁴ is 2×2×2×2, not 2×4 or 2+4. Use the hint.",
          badEs:
            "El exponente significa multiplicar, no sumar. 2⁴ = 2×2×2×2. Usa la pista.",
          solveBeat: {
            who: "producer",
            en: "Speakers on! Now the light towers need power 5 to the 3rd. Let me evaluate it.",
            es: "¡Bocinas encendidas! Ahora las torres de luz necesitan 5 a la 3. Voy a evaluarla.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "producer",
            en: "Each light tower runs on <b>5<sup>3</sup></b> watts. <b>Evaluate</b> the power to turn on the towers.",
            es: "Evalúa la potencia 5³.",
            vocab: [
              {
                term: "Evaluate",
                en: "To find the value of a math expression. Evaluate 5³ to get 125.",
                es: "Hallar el valor de una expresión matemática. Evalúa 5³ para obtener 125.",
              },
            ],
          },
          hint: {
            en: "5³ = 5 × 5 × 5. First 5×5 = 25, then 25×5 = 125.",
            es: "5³ = 5 × 5 × 5. Primero 5×5 = 25, luego 25×5 = 125.",
          },
          frame: {
            en: "“The power 2⁴ means 2 times itself ____ times, which equals ____. The power 5³ equals ____.”",
            es: "“La potencia 2⁴ significa 2 multiplicado ____ veces, que es igual a ____. La potencia 5³ es igual a ____.”",
          },
          choices: [
            {
              en: "15",
              tree: "(that is only 5 × 3)",
              es: "(eso es solo 5 × 3)",
              correct: false,
            },
            {
              en: "25",
              tree: "(that is only 5 × 5)",
              es: "(eso es solo 5 × 5)",
              correct: false,
            },
            {
              en: "125",
              tree: "(5 × 5 × 5 = 125)",
              es: "(5 × 5 × 5 = 125)",
              correct: true,
            },
          ],
          goodEn:
            "✅ Perfect! 5³ = 5×5×5 = 125. The light towers glow. SPEAKERS AND LIGHTS ON!",
          goodEs: "¡Perfecto! 5³ = 125. ¡Bocinas y luces encendidas!",
          badEn:
            "❌ Remember 5³ means 5×5×5. First 5×5 = 25, then 25×5 = 125. Try again.",
          badEs: "5³ = 5×5×5 = 125. Inténtalo de nuevo.",
          solveArt: "stage-lit.png",
          solveAlt:
            "Mika raises a fist as the stage blazes to life with lights and lasers",
          solveBeat: {
            who: "producer",
            en: "The whole stage is glowing! Now we have to pay for the stage and the lights.",
            es: "¡Todo el escenario brilla! Ahora hay que pagar el escenario y las luces.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Stage & Lights",
      kicker: "Act 2 · Evaluate & Write Expressions",
      title: "Stage & Lights",
      advanceLabel: "Light the stage ✨",
      steps: [
        {
          type: "beats",
          art: "expression-build.png",
          alt: "Mika builds a glowing budget expression from floating math blocks at a mixing console",
          lastLabel: "Stop ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Great job, Mika! Now we have to pay for the stage and the lights. Watch your math!",
              es: "¡Buen trabajo, Mika! Ahora hay que pagar el escenario y las luces. ¡Cuidado con las matemáticas!",
            },
            {
              who: "producer",
              en: "The stage cost is 3 + 4 times 5. I have to multiply BEFORE I add. Order of operations!",
              es: "El costo del escenario es 3 + 4 por 5. Debo multiplicar ANTES de sumar. ¡Orden de operaciones!",
              vocab: [
                {
                  term: "Order of operations",
                  en: "The rules for what to do first: powers, then multiply/divide, then add/subtract.",
                  es: "Las reglas de qué hacer primero: potencias, luego multiplicar/dividir, luego sumar/restar.",
                },
              ],
            },
            {
              who: "echo",
              misconception: true,
              en: "I read it left to right: 3 + 4 = 7, then 7 × 5 = 35. Locking in 35 coins!",
              es: "Lo leo de izquierda a derecha: 3 + 4 = 7, luego 7 × 5 = 35. ¡Pongo 35 monedas!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "echo",
            en: "Hold on — the stage costs <b>3 + 4 × 5</b> coins. Use the <b>order of operations</b>: do <b>multiply</b> before <b>add</b>. What is the cost?",
            es: "Evalúa 3 + 4 × 5. Multiplica antes de sumar.",
          },
          hint: {
            en: "First multiply: 4 × 5 = 20. Then add: 3 + 20 = 23.",
            es: "Primero multiplica: 4 × 5 = 20. Luego suma: 3 + 20 = 23.",
          },
          choices: [
            {
              en: "35",
              tree: "(added 3 + 4 first — not allowed)",
              es: "(sumó 3 + 4 primero — no se permite)",
              correct: false,
            },
            {
              en: "23",
              tree: "(4 × 5 = 20, then 3 + 20 = 23)",
              es: "(4 × 5 = 20, luego 3 + 20 = 23)",
              correct: true,
            },
            {
              en: "27",
              tree: "(that is 3 × 4 + 5 — wrong order)",
              es: "(eso es 3 × 4 + 5 — orden incorrecto)",
              correct: false,
            },
          ],
          goodEn: "✅ Right! 4×5 = 20 first, then 3 + 20 = 23. Stage paid!",
          goodEs: "¡Correcto! 4×5 = 20, luego 3 + 20 = 23. ¡Escenario pagado!",
          badEn:
            "❌ Multiply BEFORE you add. Do 4×5 = 20 first, then add the 3. Use the hint.",
          badEs:
            "Multiplica ANTES de sumar. 4×5 = 20, luego suma 3. Usa la pista.",
          solveBeat: {
            who: "producer",
            en: "Stage paid! Now I will write an expression for the lights: 8 coins each, plus a setup fee.",
            es: "¡Escenario pagado! Ahora escribiré una expresión para las luces: 8 coins cada una, más una cuota.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "producer",
            en: "Each light costs <b>8 coins</b>. You buy <b>n</b> lights, plus a flat <b>20 coin</b> setup fee. Write the <b>expression</b> for the total cost.",
            es: "Escribe la expresión: 8 coins por cada luz (n luces) más 20 de cuota fija.",
            vocab: [
              {
                term: "expression",
                en: "Numbers, letters, and operations put together, like 8n + 20. It has no equals sign.",
                es: "Números, letras y operaciones juntas, como 8n + 20. No tiene signo de igual.",
              },
            ],
          },
          hint: {
            en: "“8 coins for each of n lights” means 8 × n = 8n. Then add the 20 fee: 8n + 20.",
            es: "“8 coins por cada una de n luces” significa 8 × n = 8n. Luego suma la cuota de 20: 8n + 20.",
          },
          frame: {
            en: "“3 + 4 × 5 equals ____ because I multiply first. ‘8 coins for each of n lights plus a 20 fee’ is the expression ____.”",
            es: "“3 + 4 × 5 es igual a ____ porque multiplico primero. ‘8 coins por cada una de n luces más una cuota de 20’ es la expresión ____.”",
          },
          choices: [
            {
              en: "8 + 20n",
              tree: "(the 20 is the flat fee, not per light)",
              es: "(el 20 es la cuota fija, no por luz)",
              correct: false,
            },
            {
              en: "8n + 20",
              tree: "(8 per light, plus 20 fee)",
              es: "(8 por luz, más cuota de 20)",
              correct: true,
            },
            {
              en: "28n",
              tree: "(you cannot add 8 and 20 here)",
              es: "(no puedes sumar 8 y 20 aquí)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Excellent! 8n means 8 coins for each of n lights, and + 20 is the flat fee. The expression is 8n + 20. LIGHTS PAID!",
          goodEs:
            "¡Excelente! 8n + 20: 8 por cada luz más 20 de cuota. ¡Luces pagadas!",
          badEn:
            "❌ The 8 is the cost for EACH light, so it multiplies n: 8n. The 20 is added once. Try 8n + 20.",
          badEs:
            "El 8 es por cada luz: 8n. El 20 se suma una vez. Prueba 8n + 20.",
          solveBeat: {
            who: "producer",
            en: "Lights paid for! The headliner is next — let's power the master switch.",
            es: "¡Luces pagadas! Sigue el show principal; vamos a encender el interruptor maestro.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Show",
      kicker: "Final Show · Boss",
      title: "The Headliner",
      advanceLabel: "Start the headliner 🌟",
      steps: [
        {
          type: "beats",
          art: "final-show.png",
          alt: "Mika at the master control booth ready to start the big headliner show",
          lastLabel: "Stop ECHO ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "It's almost showtime! The master switch needs BOTH skills at once, Mika.",
              es: "¡Ya casi es hora del show! El interruptor maestro necesita AMBAS destrezas, Mika.",
            },
            {
              who: "producer",
              en: "A power AND order of operations. I'm ready. Let's start the headliner!",
              es: "Una potencia Y el orden de operaciones. Estoy lista. ¡Que empiece el show principal!",
            },
            {
              who: "echo",
              misconception: true,
              en: "I'll start! 2³ + 6 × 4 — I'll add 2 + 6 first, then × 4: that's 56. Throwing the switch!",
              es: "¡Yo empiezo! 2³ + 6 × 4 — sumo 2 + 6 primero, luego × 4: eso da 56. ¡Activo el interruptor!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "producer",
            en: "Careful, ECHO. The big show needs BOTH skills. The master power is <b>2<sup>3</sup> + 6 × 4</b>. Evaluate it: do the <b>power</b> first, then <b>multiply</b>, then <b>add</b>. What is the total?",
            es: "Evalúa 2³ + 6 × 4 (potencia, luego multiplicar, luego sumar).",
          },
          hint: {
            en: "2³ = 8. Then 6 × 4 = 24. Last, add: 8 + 24 = 32.",
            es: "2³ = 8. Luego 6 × 4 = 24. Por último, suma: 8 + 24 = 32.",
          },
          frame: {
            en: "“First 2³ = ____. Then 6 × 4 = ____. Last, ____ + ____ = ____.”",
            es: "“Primero 2³ = ____. Luego 6 × 4 = ____. Por último, ____ + ____ = ____.”",
          },
          choices: [
            {
              en: "56",
              tree: "(added 8 + 6 first, then ×4 — wrong order)",
              es: "(sumó 8 + 6 primero, luego ×4 — orden incorrecto)",
              correct: false,
            },
            {
              en: "32",
              tree: "(8 + 24 = 32)",
              es: "(8 + 24 = 32)",
              correct: true,
            },
            {
              en: "44",
              tree: "(used 2 × 3 = 6 instead of 2³)",
              es: "(usó 2 × 3 = 6 en vez de 2³)",
              correct: false,
            },
          ],
          goodEn:
            "✅ SHOWTIME! 2³ = 8, then 6×4 = 24, then 8 + 24 = 32. Both skills, perfect. THE HEADLINER BEGINS!",
          goodEs:
            "¡HORA DEL SHOW! 2³ = 8, 6×4 = 24, 8 + 24 = 32. ¡Empieza el show principal!",
          badEn:
            "❌ Order matters: do the power 2³ = 8 first, then multiply 6×4 = 24, then add. The total is 32.",
          badEs:
            "El orden importa: 2³ = 8, luego 6×4 = 24, luego suma. El total es 32.",
          solveBeat: {
            who: "producer",
            en: "The headliner lights up the whole festival! Thanks for the help, ECHO — even the wrong guesses.",
            es: "¡El show principal ilumina todo el festival! Gracias, ECHO, hasta por los errores.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "❮❯",
      en: "Power",
      es: "potencia",
      def: "A way to show repeated multiplication. Example: 2⁴ means 2 multiplied 4 times.",
    },
    {
      ico: "🔢",
      en: "Base",
      es: "base",
      def: "The number being multiplied in a power. In 2⁴, the base is 2.",
    },
    {
      ico: "⬆️",
      en: "Exponent",
      es: "exponente",
      def: "The small raised number that tells how many times to multiply the base. In 2⁴, the exponent is 4.",
    },
    {
      ico: "✖️",
      en: "Evaluate",
      es: "evaluar",
      def: "To find the value of a math expression. Evaluate 5³ to get 125.",
    },
    {
      ico: "📝",
      en: "Expression",
      es: "expresión",
      def: "Numbers, letters, and operations put together, like 8n + 20. It has no equals sign.",
    },
    {
      ico: "🏷️",
      en: "Variable",
      es: "variable",
      def: "A letter that stands for a number we do not know yet. In 8n, the variable is n.",
    },
    {
      ico: "➕",
      en: "Order of operations",
      es: "orden de operaciones",
      def: "The rules for what to do first: powers, then multiply/divide, then add/subtract.",
    },
    {
      ico: "✕",
      en: "Coefficient",
      es: "coeficiente",
      def: "The number multiplied by a variable. In 8n, the coefficient is 8.",
    },
    {
      ico: "🎤",
      en: "Term",
      es: "término",
      def: "Each part of an expression separated by + or −. In 8n + 20, the terms are 8n and 20.",
    },
  ],

  complete: {
    art: "celebration.png",
    alt: "Mika celebrates with arms raised as the festival crowd cheers under fireworks and lights",
    badge: "🎉🎤⭐",
    titleEn: "Show Complete!",
    en: "You powered up the whole festival! You used <b>powers and exponents</b> for the speakers and lights, and <b>expressions</b> to plan the costs. The crowd is cheering. Amazing work, Producer Mika!",
    es: "¡Encendiste todo el festival! Usaste potencias y expresiones. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Music stage power: Evaluate the algebraic expression <strong>3x + 5</strong> when <strong>x = 4</strong>.",
      promptEs: "Evalúa la expresión algebraica 3x + 5 cuando x = 4.",
      choices: [
        {
          en: "A) 12 &nbsp;(only multiplied 3 × 4 and omitted the 5)",
          correct: false,
        },
        {
          en: "B) 17 &nbsp;(3(4) + 5 = 17) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 27 &nbsp;(calculated 3 × (4 + 5) by adding first)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
