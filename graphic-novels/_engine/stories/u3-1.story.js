/* STORY · Unit 3 · Graphic Novel #1 (Support) · Global Travel Planner
   Comic-engine port. Full novel — Act 1 (Paris Ratios), Act 2 (Tokyo Tables),
   Final (Last Gateway), Glossary, Trip Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, hints, sentence frames, and glossary
   carried verbatim from graphic-novels/unit3/graphic-novel-1.html (6.RP.3a).
   Protagonist = The Traveler (you, "Maya"); companion = COMPASS, a travel drone
   that compares raw totals instead of the ratio/rate. */
window.GN_STORY = {
  meta: {
    unit: 3,
    version: 1,
    level: "Support",
    title: "Global Travel Planner",
    standard: "6.RP.3a",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U3 #1: Global Travel Planner",
    artBase: "../_art/unit3/",
    home: "../index.html",
  },

  cast: {
    traveler: {
      name: "Maya",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧭",
      avatar: null,
      blurb: "You",
    },
    compass: {
      name: "COMPASS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🛸",
      avatar: null,
      blurb: "Travel drone · compares raw totals, not the ratio",
    },
    log: { name: "Travel App", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya, a young travel planner, stands on a giant glowing globe holding a travel map with airplane trails arcing between landmarks",
    blurbEn:
      "You are <b>Maya</b>, a young trip planner. You will travel around the world! Each city has a <b>ratio puzzle</b>. Solve it to unlock the next stop. COMPASS, your travel drone, wants to help… but it keeps comparing the wrong totals. Use math to plan the perfect trip!",
    blurbEs:
      "Eres Maya, una joven planificadora de viajes. Resuelve cada acertijo de razones para desbloquear la siguiente ciudad.",
    startLabel: "Start the Trip ✈️",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Paris Ratios",
      kicker: "Act 1 · Understand Ratios",
      title: "Paris: Compare the Groups",
      advanceLabel: "Fly to Tokyo ✈️",
      steps: [
        {
          type: "beats",
          art: "ratios-compare.png",
          alt: "Maya stands in front of the Eiffel Tower holding passports, with a glowing ratio comparison floating beside her",
          lastLabel: "Try the gate ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Welcome to Paris, Maya! This gate is locked. To open it, write the right RATIO.",
              es: "¡Bienvenida a París, Maya! Esta puerta está cerrada. Escribe la RAZÓN correcta.",
            },
            {
              who: "traveler",
              en: "A ratio compares two amounts. Let me look at the guides and the travelers.",
              es: "Una razón compara dos cantidades. Voy a mirar los guías y los viajeros.",
              vocab: [
                {
                  term: "ratio",
                  en: "A way to compare two amounts. The ratio of 2 guides to 6 travelers is 2 to 6 (or 2 : 6).",
                  es: "Una forma de comparar dos cantidades. La razón de 2 guías a 6 viajeros es 2 a 6 (o 2 : 6).",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "First, write the ratio of guides to travelers to wake the gate.",
              es: "Primero, escribe la razón de guías a viajeros para activar la puerta.",
            },
            {
              who: "traveler",
              en: "I count 2 guides in red caps and 6 travelers waiting by the gate. Order matters, so I'll write the guides first.",
              es: "Cuento 2 guías con gorras rojas y 6 viajeros junto a la puerta. El orden importa, así que escribo los guías primero.",
            },
            {
              who: "compass",
              misconception: true,
              en: "Easy! There are 6 travelers and 2 guides — so I'll write 6 to 2.",
              es: "¡Fácil! Hay 6 viajeros y 2 guías, así que escribo 6 a 2.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "log",
            en: "A <b>ratio</b> compares two amounts. The tour bus has <b>2 guides</b> and <b>6 travelers</b>. What is the ratio of <b>guides to travelers</b>?",
            es: "Una razón compara dos cantidades. ¿Cuál es la razón de guías a viajeros?",
          },
          hint: {
            en: "Write the first amount, then the second: guides : travelers = 2 : 6.",
            es: "Escribe la primera cantidad, luego la segunda: guías : viajeros = 2 : 6.",
          },
          frame: {
            en: "“The ratio of guides to travelers is ____ to ____.”",
            es: "“La razón de guías a viajeros es ____ a ____.”",
          },
          choices: [
            {
              en: "2 to 6 &nbsp;(2 guides : 6 travelers)",
              es: "2 a 6 (2 guías : 6 viajeros)",
              correct: true,
            },
            {
              en: "6 to 2 &nbsp;(that is travelers : guides)",
              es: "6 a 2 (eso es viajeros : guías)",
              correct: false,
            },
            {
              en: "2 to 8 &nbsp;(8 is not the number of travelers)",
              es: "2 a 8 (8 no es el número de viajeros)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct! The ratio of guides to travelers is 2 to 6. Gate one is open!",
          goodEs: "¡Correcto! La razón de guías a viajeros es 2 a 6.",
          badEn:
            "❌ Order matters. Write guides FIRST, then travelers: 2 to 6. Try again.",
          badEs: "El orden importa. Escribe guías primero: 2 a 6.",
          solveBeat: {
            who: "traveler",
            en: "Gate one is open! Now I need an EQUIVALENT ratio with the same pattern.",
            es: "¡La primera puerta se abrió! Ahora necesito una razón equivalente con el mismo patrón.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "In the story, what does the word <b>ratio</b> mean?",
            es: "En la historia, ¿qué significa la palabra <b>razón</b>?",
          },
          hint: {
            en: "Think about how Maya used 2 guides and 6 travelers.",
            es: "Piensa en cómo Maya usó 2 guías y 6 viajeros.",
          },
          choices: [
            {
              en: "A way to compare two amounts, like guides to travelers.",
              es: "Una forma de comparar dos cantidades, como guías a viajeros.",
              correct: true,
            },
            {
              en: "The total when you add two amounts together.",
              es: "El total cuando sumas dos cantidades.",
              correct: false,
            },
            {
              en: "The biggest number on the gate panel.",
              es: "El número más grande del panel de la puerta.",
              correct: false,
            },
          ],
        },
        {
          type: "beats",
          art: "ratios-compare.png",
          alt: "Maya studies a glowing ratio of stamps to passports beside the Eiffel Tower",
          lastLabel: "Match the ratio ▶",
          beats: [
            {
              who: "compass",
              misconception: true,
              en: "4 stamps and 3 passports each? That's 4 + 3 = 7 passports. Done!",
              es: "¿4 sellos y 3 pasaportes? Eso es 4 + 3 = 7 pasaportes. ¡Listo!",
              vocab: [
                {
                  term: "equivalent ratio",
                  en: "A different ratio with the same pattern. 1 : 3 is equivalent to 4 : 12.",
                  es: "Una razón diferente con el mismo patrón. 1 : 3 es equivalente a 4 : 12.",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "traveler",
            en: "Maya sees <b>1 souvenir stamp for every 3 passports</b>. A bigger group has <b>4 stamps</b>. How many passports do they have if the ratio stays the same?",
            es: "Hay 1 sello por cada 3 pasaportes. Si hay 4 sellos, ¿cuántos pasaportes hay?",
          },
          hint: {
            en: "1 stamp → 3 passports. So 4 stamps → 4 × 3 passports.",
            es: "1 sello → 3 pasaportes. Así que 4 sellos → 4 × 3 pasaportes.",
          },
          frame: {
            en: "“For every 1 stamp there are ____ passports, so 4 stamps means ____ passports.”",
            es: "“Por cada 1 sello hay ____ pasaportes, así que 4 sellos son ____ pasaportes.”",
          },
          choices: [
            {
              en: "7 passports &nbsp;(that is 4 + 3, not the ratio)",
              es: "7 pasaportes (eso es 4 + 3, no la razón)",
              correct: false,
            },
            {
              en: "12 passports &nbsp;(4 × 3 = 12)",
              es: "12 pasaportes (4 × 3 = 12)",
              correct: true,
            },
            {
              en: "4 passports &nbsp;(same as the stamps)",
              es: "4 pasaportes (igual que los sellos)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Perfect! 1 stamp goes with 3 passports, so 4 stamps go with 4×3 = 12 passports. PARIS UNLOCKED!",
          goodEs:
            "¡Perfecto! 1 sello = 3 pasaportes, así que 4 sellos = 12 pasaportes. ¡París desbloqueado!",
          badEn:
            "❌ Keep the same ratio. Each stamp brings 3 passports, so multiply by 3, not add. Try again.",
          badEs: "Mantén la misma razón. Multiplica por 3, no sumes.",
          solveArt: "unlock.png",
          solveAlt:
            "A glowing gateway opens to reveal pyramids as Maya cheers with raised fists",
          solveBeat: {
            who: "traveler",
            en: "The gateway opens to the pyramids! On to Tokyo to build a ratio table.",
            es: "¡La puerta se abre hacia las pirámides! Sigue Tokio para armar una tabla de razones.",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 2,
          interaction: "evidence",
          passageRef: "act1.1b",
          ask: {
            who: "log",
            en: "Tap the line that shows COMPASS <b>added</b> the amounts instead of using the ratio.",
            es: "Toca la línea que muestra que COMPASS <b>sumó</b> las cantidades en vez de usar la razón.",
          },
          choices: [
            {
              en: "“4 stamps and 3 passports each? That's 4 + 3 = 7 passports.”",
              es: "“¿4 sellos y 3 pasaportes? Eso es 4 + 3 = 7 pasaportes.”",
              correct: true,
            },
            {
              en: "“A ratio compares two amounts.”",
              es: "“Una razón compara dos cantidades.”",
              correct: false,
            },
            {
              en: "“Now I need an EQUIVALENT ratio with the same pattern.”",
              es: "“Ahora necesito una razón equivalente con el mismo patrón.”",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Tokyo Tables",
      kicker: "Act 2 · Ratio Tables & Graphs",
      title: "Tokyo: Build the Table",
      advanceLabel: "Fly to Egypt ✈️",
      steps: [
        {
          type: "beats",
          art: "ratio-table.png",
          alt: "Maya draws a glowing ratio table and a rising line graph in the air on a Tokyo street",
          lastLabel: "Fill the table ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Now you are in Tokyo! To buy train tickets, fill in a RATIO TABLE.",
              es: "¡Ahora estás en Tokio! Para comprar boletos, completa una TABLA DE RAZONES.",
            },
            {
              who: "traveler",
              en: "The neon ticket board glows: 50 miles for every 1 hour. Every hour the train goes the same distance. I can scale the table up step by step.",
              es: "El tablero de boletos brilla: 50 millas por cada 1 hora. Cada hora el tren recorre la misma distancia. Puedo aumentar la tabla paso a paso.",
              vocab: [
                {
                  term: "ratio table",
                  en: "A table that shows equivalent ratios in rows. Every row keeps the same ratio.",
                  es: "Una tabla que muestra razones equivalentes en filas. Cada fila mantiene la misma razón.",
                },
              ],
            },
            {
              who: "compass",
              misconception: true,
              en: "The last total was 150, and 4 is just one more hour — so I'll only add 40. That's 190 miles!",
              es: "El último total fue 150, y 4 es solo una hora más, así que sumo 40. ¡Son 190 millas!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "log",
            en: "The train goes <b>50 miles every 1 hour</b>. Finish the ratio table. How many miles in <b>4 hours</b>? <br><br>Hours: 1, 2, 3, 4 → Miles: 50, 100, 150, ?",
            es: "El tren recorre 50 millas por hora. ¿Cuántas millas en 4 horas?",
          },
          hint: {
            en: "Each hour adds 50 miles. 50, 100, 150, then add 50 more.",
            es: "Cada hora suma 50 millas. 50, 100, 150, luego suma 50 más.",
          },
          frame: {
            en: "“In 4 hours the train goes ____ miles because 4 × 50 = ____.”",
            es: "“En 4 horas el tren recorre ____ millas porque 4 × 50 = ____.”",
          },
          choices: [
            {
              en: "190 miles &nbsp;(only added 40)",
              es: "190 millas (solo sumó 40)",
              correct: false,
            },
            {
              en: "200 miles &nbsp;(4 × 50 = 200)",
              es: "200 millas (4 × 50 = 200)",
              correct: true,
            },
            {
              en: "150 miles &nbsp;(that is 3 hours)",
              es: "150 millas (eso son 3 horas)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 4 hours × 50 miles = 200 miles. The table keeps the same ratio in every row.",
          goodEs: "¡Sí! 4 horas × 50 millas = 200 millas.",
          badEn:
            "❌ Each hour adds 50 miles. 50, 100, 150, 200. Use the pattern and try again.",
          badEs: "Cada hora suma 50 millas: 50, 100, 150, 200.",
          solveBeat: {
            who: "traveler",
            en: "The table works! Now I need to swap money. Same idea: a ratio table for dollars and coins.",
            es: "¡La tabla funciona! Ahora cambio dinero. La misma idea: una tabla de dólares y monedas.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act2.2a",
          ask: {
            who: "log",
            en: "How far does the Tokyo train go in <b>1 hour</b>?",
            es: "¿Qué distancia recorre el tren de Tokio en <b>1 hora</b>?",
          },
          choices: [
            {
              en: "50 miles.",
              es: "50 millas.",
              correct: true,
            },
            {
              en: "200 miles.",
              es: "200 millas.",
              correct: false,
            },
            {
              en: "4 miles.",
              es: "4 millas.",
              correct: false,
            },
          ],
        },
        {
          type: "beats",
          art: "ratio-table.png",
          alt: "Maya stands at a Tokyo money desk with a glowing dollars-to-coins ratio table",
          lastLabel: "Swap the money ▶",
          beats: [
            {
              who: "compass",
              misconception: true,
              en: "$6 and 5 coins each? I'll just add them: 6 + 5 = 11 coins!",
              es: "¿$6 y 5 monedas? Solo los sumo: 6 + 5 = 11 monedas.",
              vocab: [
                {
                  term: "currency exchange",
                  en: "Trading money from one country for another using a fixed ratio, like $1 = 5 coins.",
                  es: "Cambiar dinero de un país por otro usando una razón fija, como $1 = 5 monedas.",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "traveler",
            en: "At the money desk, <b>$1 = 5 coins</b>. Maya changes <b>$6</b>. How many coins does she get? <br><br>Dollars: 1, 2, 6 → Coins: 5, 10, ?",
            es: "$1 equivale a 5 monedas. ¿Cuántas monedas por $6?",
          },
          hint: {
            en: "Multiply the dollars by 5. 6 × 5 = ?",
            es: "Multiplica los dólares por 5. 6 × 5 = ?",
          },
          frame: {
            en: "“For $6 Maya gets ____ coins because 6 × 5 = ____.”",
            es: "“Por $6 Maya recibe ____ monedas porque 6 × 5 = ____.”",
          },
          choices: [
            {
              en: "11 coins &nbsp;(that is 6 + 5)",
              es: "11 monedas (eso es 6 + 5)",
              correct: false,
            },
            {
              en: "30 coins &nbsp;(6 × 5 = 30)",
              es: "30 monedas (6 × 5 = 30)",
              correct: true,
            },
            {
              en: "25 coins &nbsp;(that is $5)",
              es: "25 monedas (eso es $5)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right! $1 = 5 coins, so $6 = 6×5 = 30 coins. TOKYO UNLOCKED!",
          goodEs: "¡Correcto! $6 × 5 = 30 monedas. ¡Tokio desbloqueado!",
          badEn:
            "❌ Multiply the dollars by 5, do not add. 6 × 5 = 30. Try again.",
          badEs: "Multiplica los dólares por 5: 6 × 5 = 30.",
          solveBeat: {
            who: "traveler",
            en: "Money swapped! The Last Gateway is next — it needs both skills at once.",
            es: "¡Dinero cambiado! Sigue la Última Puerta; necesita ambas destrezas a la vez.",
          },
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "What is Maya mainly doing in Tokyo?",
            es: "¿Qué hace principalmente Maya en Tokio?",
          },
          choices: [
            {
              en: "Using ratio tables to scale up miles and money the same way.",
              es: "Usar tablas de razones para aumentar millas y dinero de la misma forma.",
              correct: true,
            },
            {
              en: "Writing the very first ratio of guides to travelers.",
              es: "Escribir la primera razón de guías a viajeros.",
              correct: false,
            },
            {
              en: "Counting the bags each traveler is allowed to bring.",
              es: "Contar las maletas que cada viajero puede llevar.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "Put the events of the Tokyo chapter in order.",
            es: "Ordena los sucesos del capítulo de Tokio.",
          },
          items: [
            {
              en: "Maya fills the train table to find the miles in 4 hours.",
              es: "Maya completa la tabla del tren para hallar las millas en 4 horas.",
              order: 1,
            },
            {
              en: "COMPASS adds $6 and 5 coins to guess 11 coins.",
              es: "COMPASS suma $6 y 5 monedas y adivina 11 monedas.",
              order: 2,
            },
            {
              en: "Maya multiplies to change $6 into 30 coins and unlocks Tokyo.",
              es: "Maya multiplica para cambiar $6 por 30 monedas y desbloquea Tokio.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Trip",
      kicker: "Final Trip · Both Skills",
      title: "The Last Gateway",
      advanceLabel: "Finish the Trip 🎉",
      steps: [
        {
          type: "beats",
          art: "final-challenge.png",
          alt: "Maya stands before a huge glowing globe gateway with ratio tables and route lines orbiting her",
          lastLabel: "Open the gateway ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The Last Gateway is ahead. It needs BOTH skills: a ratio AND a ratio table.",
              es: "La Última Puerta necesita AMBAS destrezas: una razón Y una tabla de razones.",
            },
            {
              who: "traveler",
              en: "Ratios and tables together. I'm ready. Let's finish the trip!",
              es: "Razones y tablas juntas. Estoy lista. ¡Vamos a terminar el viaje!",
            },
            {
              who: "log",
              caption: true,
              en: "This gate has only one keypad and one try. A wrong code seals it, so the ratio and the table must both be exactly right.",
              es: "Esta puerta tiene un solo teclado y un solo intento. Un código incorrecto la cierra, así que la razón y la tabla deben estar exactamente bien.",
            },
            {
              who: "compass",
              misconception: true,
              en: "5 travelers and 2 bags each? I'll add them: 5 + 2 = 7 bags!",
              es: "¿5 viajeros y 2 maletas? Los sumo: 5 + 2 = 7 maletas.",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "traveler",
            en: "The last gate needs BOTH skills. The plane uses <b>2 bags for every 1 traveler</b>. Use the ratio table to find the bags for <b>5 travelers</b>. Pick the line that is fully correct. <br><br>Travelers: 1, 2, 3, 5 → Bags: 2, 4, 6, ?",
            es: "2 maletas por cada 1 viajero. ¿Cuántas maletas para 5 viajeros?",
          },
          hint: {
            en: "The ratio is bags : travelers = 2 : 1. Multiply travelers by 2. 5 × 2 = ?",
            es: "La razón es maletas : viajeros = 2 : 1. Multiplica los viajeros por 2. 5 × 2 = ?",
          },
          frame: {
            en: "“The ratio of bags to travelers is 2 to ____. For 5 travelers there are ____ bags because 5 × 2 = ____.”",
            es: "“La razón de maletas a viajeros es 2 a ____. Para 5 viajeros hay ____ maletas porque 5 × 2 = ____.”",
          },
          choices: [
            {
              en: "Ratio is 2 : 1, and 5 travelers need 7 bags",
              es: "La razón es 2 : 1, y 5 viajeros necesitan 7 maletas",
              correct: false,
            },
            {
              en: "Ratio is 2 : 1, and 5 travelers need 10 bags",
              es: "La razón es 2 : 1, y 5 viajeros necesitan 10 maletas",
              correct: true,
            },
            {
              en: "Ratio is 1 : 2, and 5 travelers need 10 bags",
              es: "La razón es 1 : 2, y 5 viajeros necesitan 10 maletas",
              correct: false,
            },
          ],
          goodEn:
            "✅ GATEWAY OPEN! The ratio is bags : travelers = 2 : 1, and 5 travelers need 5×2 = 10 bags. You did it!",
          goodEs:
            "¡PUERTA ABIERTA! La razón es 2 : 1, y 5 viajeros necesitan 10 maletas.",
          badEn:
            "❌ Check both parts. The ratio is 2 bags to 1 traveler, and 5×2 = 10 bags. Try again.",
          badEs: "Revisa ambas partes. La razón es 2 a 1 y 5 × 2 = 10 maletas.",
          solveBeat: {
            who: "traveler",
            en: "The Last Gateway opens! The whole trip is planned. Thanks, COMPASS — even the wrong guesses helped.",
            es: "¡La Última Puerta se abre! Todo el viaje está planeado. Gracias, COMPASS.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "COMPASS keeps adding the two amounts together. Why does COMPASS keep guessing wrong?",
            es: "COMPASS sigue sumando las dos cantidades. ¿Por qué COMPASS sigue adivinando mal?",
          },
          hint: {
            en: "Look back: COMPASS adds when it should multiply or keep the ratio.",
            es: "Mira atrás: COMPASS suma cuando debería multiplicar o mantener la razón.",
          },
          choices: [
            {
              en: "It adds the numbers instead of keeping the same ratio.",
              es: "Suma los números en vez de mantener la misma razón.",
              correct: true,
            },
            {
              en: "It does not want Maya to finish the trip.",
              es: "No quiere que Maya termine el viaje.",
              correct: false,
            },
            {
              en: "The gate panels show the wrong numbers.",
              es: "Los paneles de la puerta muestran números equivocados.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "The Last Gateway is open. What will Maya most likely do next?",
            es: "La Última Puerta está abierta. ¿Qué hará Maya probablemente después?",
          },
          choices: [
            {
              en: "Finish planning the trip and collect the last passport stamp.",
              es: "Terminar de planear el viaje y conseguir el último sello del pasaporte.",
              correct: true,
            },
            {
              en: "Fly back and lock the Paris gate again.",
              es: "Regresar y cerrar otra vez la puerta de París.",
              correct: false,
            },
            {
              en: "Stop using ratio tables for the rest of the trip.",
              es: "Dejar de usar tablas de razones por el resto del viaje.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "⚖️",
      en: "Ratio",
      es: "razón",
      def: "A way to compare two amounts. The ratio of 2 guides to 6 travelers is 2 to 6 (or 2 : 6).",
    },
    {
      ico: "💰",
      en: "Quantity",
      es: "cantidad",
      def: "An amount you can count or measure, like 6 travelers or 50 miles.",
    },
    {
      ico: "🧪",
      en: "Equivalent ratio",
      es: "razón equivalente",
      def: "A different ratio with the same pattern. 1 : 3 is equivalent to 4 : 12.",
    },
    {
      ico: "📊",
      en: "Ratio table",
      es: "tabla de razones",
      def: "A table that shows equivalent ratios in rows. Every row keeps the same ratio.",
    },
    {
      ico: "📈",
      en: "Graph of a ratio table",
      es: "gráfica de una tabla de razones",
      def: "When you plot the pairs from a ratio table, the points line up in a straight line.",
    },
    {
      ico: "➕",
      en: "Scale up",
      es: "aumentar a escala",
      def: "Make a ratio bigger while keeping the same pattern, often by multiplying.",
    },
    {
      ico: "⚡",
      en: "Unit rate",
      es: "tasa por unidad",
      def: "A ratio for just 1 unit, like 50 miles for 1 hour, or 5 coins for $1.",
    },
    {
      ico: "💲",
      en: "Currency exchange",
      es: "cambio de moneda",
      def: "Trading money from one country for another using a fixed ratio, like $1 = 5 coins.",
    },
    {
      ico: "✈️",
      en: "Distance",
      es: "distancia",
      def: "How far you travel, measured in units like miles or kilometers.",
    },
  ],

  complete: {
    art: "celebrate.png",
    alt: "Maya celebrates with arms wide, surrounded by world landmarks, fireworks, and a passport full of stamps",
    badge: "🎉✈️⭐",
    titleEn: "Trip Complete!",
    en: "You planned the whole trip around the world! You used <b>ratios</b> to compare groups and <b>ratio tables</b> to scale up trips, money, and bags. Your passport is full of stamps. Amazing work, Maya!",
    es: "¡Viaje completo! Usaste razones y tablas de razones. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Scale the ratio: the ratio of red to blue paint is <strong>3 to 5</strong>. If you use <strong>25 cups of blue paint</strong>, how many cups of red paint are needed?",
      promptEs:
        "La razón de pintura roja a azul es 3 a 5. Si usas 25 tazas de azul, ¿cuántas tazas de rojo necesitas?",
      choices: [
        {
          en: "A) 15 cups of red paint &nbsp;(multiplied both parts by 5) &nbsp;✅",
          correct: true,
        },
        {
          en: "B) 9 cups of red paint &nbsp;(incorrect scaling factor)",
          correct: false,
        },
        {
          en: "C) 20 cups of red paint &nbsp;(added instead of multiplying)",
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
