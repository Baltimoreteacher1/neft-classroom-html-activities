/* STORY · Unit 1 · Graphic Novel #1 (Support) · Prime Station: The Factor Code
   Phase-2 reference build: full novel — Act 1 (Locked Bay), Act 2 (Twin Engines),
   Final (Master Door), Glossary, Mission Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, sentence frames, and glossary are
   carried verbatim from graphic-novels/unit1/graphic-novel-1.html (6.NS.4).
   New: panels, speech, AXIS-voices-the-misconception, vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "Prime Station: The Factor Code",
    standard: "6.NS.4",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U1 #1: Prime Station: The Factor Code",
    artBase: "../_art/unit1/",
    home: "../index.html",
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
      blurb: "Station AI · jumps to the wrong factor",
    },
    log: { name: "Station Log", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young space cadet stands on a station bridge surrounded by glowing holographic factor trees",
    blurbEn:
      "You are a space cadet. The station is broken and the doors are locked — only <b>factor codes</b> can open them. AXIS, the station AI, wants to help… but AXIS keeps guessing wrong. Catch its mistakes and save the station!",
    blurbEs:
      "Eres un cadete espacial. Solo los <b>códigos de factores</b> abren las puertas. AXIS, la IA, quiere ayudar… pero se equivoca. ¡Atrapa sus errores y salva la estación!",
    startLabel: "Start Mission 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Locked Bay",
      kicker: "Act 1 · Lesson 1-1",
      title: "The Locked Bay",
      advanceLabel: "Open the airlock 🚀",
      steps: [
        {
          type: "beats",
          art: "airlock-locked.png",
          alt: "The cadet faces a locked airlock with a glowing orange code panel",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Cadet! The station is damaged. This airlock is locked with a FACTOR CODE.",
              es: "¡Cadete! La estación está dañada. Esta puerta tiene un CÓDIGO DE FACTORES.",
            },
            {
              who: "log",
              caption: true,
              en: "Behind this bay are the crew's escape pods. If the lock stays sealed, no one gets out.",
              es: "Detrás de esta bahía están las cápsulas de escape de la tripulación. Si el cerrojo sigue cerrado, nadie puede salir.",
            },
            {
              who: "cadet",
              en: "I can do this. Factor codes use prime numbers. Let me read the panel.",
              es: "Puedo hacerlo. Los códigos usan números primos. Voy a leer el panel.",
              vocab: [
                {
                  term: "prime numbers",
                  en: "A number bigger than 1 with only two factors: 1 and itself. Example: 7.",
                  es: "Un número mayor que 1 con solo dos factores: 1 y él mismo. Ejemplo: 7.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "Easy! 9 is prime, right? I'll punch in 9 and open it.",
              es: "¡Fácil! 9 es primo, ¿no? Voy a poner 9.",
              callout: {
                x: 72,
                y: 40,
                icon: "?",
                title: "Code panel",
                en: "The panel only accepts a PRIME number to wake the lock.",
                es: "El panel solo acepta un número PRIMO para activar el cerrojo.",
              },
            },
          ],
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.beat1",
          ask: {
            who: "log",
            en: "What is behind the locked bay?",
            es: "¿Qué hay detrás de la bahía cerrada?",
          },
          choices: [
            {
              en: "The crew's escape pods.",
              es: "Las cápsulas de escape de la tripulación.",
              correct: true,
            },
            {
              en: "A holographic factor tree.",
              es: "Un árbol de factores holográfico.",
              correct: false,
            },
            {
              en: "Two starship engines.",
              es: "Dos motores de la nave.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "Wait — stop me before I lock us out. Which number is <b>actually prime</b>?",
            es: "Espera, deténme. ¿Cuál número es primo de verdad?",
          },
          hint: {
            en: "Try to break each number into a product like 2×something. If you cannot (except 1×itself), it is prime.",
            es: "Intenta dividir cada número como 2×algo. Si no puedes (excepto 1×él mismo), es primo.",
          },
          frame: {
            en: "“The number ____ is prime because it has only ____ factors.”",
            es: "“El número ____ es primo porque solo tiene ____ factores.”",
          },
          choices: [
            {
              en: "Not 9 — that's 3 × 3. The prime is <b>7</b> (only 1 × 7).",
              es: "9 no: es 3 × 3. El primo es 7 (solo 1 × 7).",
              correct: true,
            },
            {
              en: "You're right, AXIS — 9 is prime.",
              es: "Tienes razón, AXIS: 9 es primo.",
              correct: false,
            },
            { en: "15 is prime.", es: "15 es primo.", correct: false },
          ],
          goodEn:
            "✅ Correct! 7 is prime — only 1 and 7 divide it. Lock one is open.",
          goodEs: "¡Correcto! 7 es primo. Cerrojo uno abierto.",
          badEn:
            "❌ Not prime — that number can be split into smaller factors. Use the hint and try again.",
          badEs: "No es primo. Ese número se puede dividir. Usa la pista.",
          solveArt: "airlock-open.png",
          solveAlt:
            "The airlock slides open with golden light as the cadet raises a fist",
          solveBeat: {
            who: "cadet",
            en: "Lock one is open! Now I need the full factor code: the prime factorization of 36.",
            es: "¡El primer cerrojo se abrió! Ahora necesito la factorización en primos de 36.",
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
            en: "In the story, what does <b>prime</b> mean?",
            es: "En la historia, ¿qué significa <b>primo</b>?",
          },
          hint: {
            en: "Think about why 7 worked but 9 did not.",
            es: "Piensa por qué 7 sirvió pero 9 no.",
          },
          choices: [
            {
              en: "A number bigger than 1 with only two factors: 1 and itself.",
              es: "Un número mayor que 1 con solo dos factores: 1 y él mismo.",
              correct: true,
            },
            {
              en: "A number you can split many different ways.",
              es: "Un número que se puede dividir de muchas formas.",
              correct: false,
            },
            {
              en: "The biggest number on the code panel.",
              es: "El número más grande del panel de código.",
              correct: false,
            },
          ],
        },
        {
          type: "beats",
          art: "factor-tree.png",
          alt: "A holographic factor tree for 36 glows above the open airlock",
          lastLabel: "Fix the code ▶",
          beats: [
            {
              who: "axis",
              misconception: true,
              en: "I've got the code: 36 = 4 × 9. Entering it now!",
              es: "Ya tengo el código: 36 = 4 × 9. ¡Lo ingreso!",
              vocab: [
                {
                  term: "prime factorization",
                  en: "Writing a number as a product of only prime numbers. Example: 36 = 2×2×3×3.",
                  es: "Escribir un número como producto de solo primos. Ejemplo: 36 = 2×2×3×3.",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "Hold on, AXIS — 4 and 9 aren't prime yet. Break <b>36</b> all the way down. Which tree ends in <b>all primes</b>?",
            es: "Espera, AXIS: 4 y 9 todavía no son primos. Elige el árbol de factores correcto para 36.",
          },
          hint: {
            en: "36 = 6 × 6. Then break each 6 into 2 × 3. Keep going until every branch ends in a prime.",
            es: "36 = 6 × 6. Luego divide cada 6 en 2 × 3 hasta que cada rama termine en un primo.",
          },
          frame: {
            en: "“The prime factorization of 36 is ____ × ____ × ____ × ____.”",
            es: "“La factorización en primos de 36 es ____ × ____ × ____ × ____.”",
          },
          choices: [
            {
              en: "A) 36 = 2 × 2 × 3 × 3",
              tree: "36 splits into 6 × 6, then each 6 into 2 × 3 — every end is prime ✅",
              es: "Cada rama termina en un primo.",
              correct: true,
            },
            {
              en: "B) 36 = 2 × 3 × 6",
              tree: "36 splits into 6 × 6, but one 6 is left whole — 6 is not prime",
              es: "6 no es primo.",
              correct: false,
            },
            {
              en: "C) 36 = 4 × 9",
              tree: "36 splits into 4 × 9, but 4 and 9 are not prime yet",
              es: "4 y 9 no son primos.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Perfect factor tree! 36 = 2×2×3×3 (or 2²×3²). Every branch ends in a prime. AIRLOCK OPEN!",
          goodEs: "¡Árbol correcto! 36 = 2×2×3×3. ¡Puerta abierta!",
          badEn:
            "❌ That tree still has a number that is NOT prime. Keep breaking it down until every end is prime.",
          badEs: "Ese árbol aún tiene un número no primo. Sigue dividiendo.",
          solveArt: "airlock-open.png",
          solveAlt:
            "The airlock stands fully open, golden light pouring through",
          solveBeat: {
            who: "cadet",
            en: "Code accepted — the bay is open! Thanks for the help, AXIS, even the wrong guesses.",
            es: "¡Código aceptado, la bahía está abierta! Gracias, AXIS.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 3,
          interaction: "evidence",
          passageRef: "act1.beat1",
          ask: {
            who: "log",
            en: "Tap the line that shows the bay was <b>locked</b>.",
            es: "Toca la línea que muestra que la bahía estaba <b>cerrada</b>.",
          },
          choices: [
            {
              en: "“This airlock is locked with a FACTOR CODE.”",
              es: "“Esta puerta tiene un CÓDIGO DE FACTORES.”",
              correct: true,
            },
            {
              en: "“Factor codes use prime numbers.”",
              es: "“Los códigos usan números primos.”",
              correct: false,
            },
            {
              en: "“Thanks for the help, AXIS.”",
              es: "“Gracias por la ayuda, AXIS.”",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Twin Engines",
      kicker: "Act 2 · Lesson 1-2",
      title: "The Twin Engines",
      advanceLabel: "Sync the engines ⚡",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "The cadet stands between two glowing starship engines",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Good work, Cadet. Now the two engines must SYNC, or we lose power.",
              es: "Buen trabajo. Ahora los dos motores deben SINCRONIZARSE o perderemos energía.",
            },
            {
              who: "log",
              caption: true,
              en: "Power is dropping fast. If the engines do not match up soon, the lights will go dark.",
              es: "La energía baja rápido. Si los motores no coinciden pronto, las luces se apagarán.",
            },
            {
              who: "cadet",
              en: "Engine A is 12, Engine B is 18. I need a number that divides BOTH — a common factor.",
              es: "El motor A es 12 y el B es 18. Necesito un número que divida a AMBOS: un factor común.",
              vocab: [
                {
                  term: "common factor",
                  en: "A factor that two numbers share. 6 is a common factor of 12 and 18.",
                  es: "Un factor que comparten dos números. 6 es factor común de 12 y 18.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "9 divides 18, so 9 syncs them! Locking in 9.",
              es: "9 divide a 18, ¡así que sincronizo con 9!",
            },
          ],
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2.beat1",
          ask: {
            who: "log",
            en: "What is the Cadet mainly trying to do in this chapter?",
            es: "¿Qué intenta hacer la cadete principalmente en este capítulo?",
          },
          choices: [
            {
              en: "Sync the two engines so the station keeps its power.",
              es: "Sincronizar los dos motores para que la estación conserve su energía.",
              correct: true,
            },
            {
              en: "Open the locked airlock to the escape pods.",
              es: "Abrir la puerta cerrada de las cápsulas de escape.",
              correct: false,
            },
            {
              en: "Teach AXIS how to read the code panel.",
              es: "Enseñar a AXIS a leer el panel de código.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "axis",
            en: "Tell me fast — which number divides <b>both</b> 12 and 18?",
            es: "Dime rápido: ¿cuál número divide a 12 Y a 18?",
          },
          hint: {
            en: "Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. Look for one in BOTH lists.",
            es: "Factores de 12: 1, 2, 3, 4, 6, 12. Factores de 18: 1, 2, 3, 6, 9, 18. Busca uno en AMBAS listas.",
          },
          frame: {
            en: "“A common factor of 12 and 18 is ____ because it divides both.”",
            es: "“Un factor común de 12 y 18 es ____ porque divide a ambos.”",
          },
          choices: [
            {
              en: "Not 9 — 9 doesn't divide 12. <b>6</b> divides both.",
              es: "9 no: no divide a 12. El 6 divide a ambos.",
              correct: true,
            },
            {
              en: "You're right, 9 divides both.",
              es: "Tienes razón, 9 divide a ambos.",
              correct: false,
            },
            {
              en: "4 divides both.",
              es: "4 divide a ambos.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 6 divides 12 (12÷6=2) and 18 (18÷6=3). It is a common factor.",
          goodEs: "¡Sí! 6 divide a 12 y a 18. Es un factor común.",
          badEn:
            "❌ That number only divides ONE of them. A common factor must divide BOTH. Check the hint.",
          badEs: "Ese número solo divide a uno. Debe dividir a ambos.",
          solveBeat: {
            who: "cadet",
            en: "The engines hum together! Now I have to share the fuel fairly using the GCF.",
            es: "¡Los motores zumban juntos! Ahora debo repartir el combustible con el MFC.",
          },
        },
        {
          type: "beats",
          art: "common-factor.png",
          alt: "Two fuel crates labeled 24 and 36 glow between the engines",
          lastLabel: "Find the GCF ▶",
          beats: [
            {
              who: "axis",
              misconception: true,
              en: "6 divides 24 and 36 — so the GCF is 6! Done!",
              es: "6 divide a 24 y a 36, ¡así que el MFC es 6!",
              vocab: [
                {
                  term: "GCF",
                  en: "Greatest Common Factor — the biggest factor two numbers share. The GCF of 24 and 36 is 12.",
                  es: "Máximo Factor Común — el factor más grande que comparten dos números. El MFC de 24 y 36 es 12.",
                },
              ],
            },
          ],
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "cadet",
            en: "But is 6 the <b>greatest</b>? Share the fuel fairly — find the <b>GCF of 24 and 36</b>.",
            es: "Pero, ¿es 6 el mayor? Encuentra el MFC (Máximo Factor Común) de 24 y 36.",
          },
          hint: {
            en: "Common factors of 24 and 36 are 1, 2, 3, 4, 6, 12. The GREATEST one is the GCF.",
            es: "Los factores comunes de 24 y 36 son 1, 2, 3, 4, 6, 12. El MAYOR es el MFC.",
          },
          frame: {
            en: "“The GCF of 24 and 36 is ____ because it is the biggest number that divides both.”",
            es: "“El MFC de 24 y 36 es ____ porque es el número más grande que divide a ambos.”",
          },
          choices: [
            {
              en: "6 works, but <b>12</b> is the GREATEST common factor.",
              es: "6 sirve, pero 12 es el mayor factor común.",
              correct: true,
            },
            {
              en: "You're right, the GCF is 6.",
              es: "Tienes razón, el MFC es 6.",
              correct: false,
            },
            { en: "The GCF is 4.", es: "El MFC es 4.", correct: false },
          ],
          goodEn:
            "✅ The GCF of 24 and 36 is 12 — the biggest factor they share. Fuel shared fairly. ENGINES SYNCED!",
          goodEs: "El MFC de 24 y 36 es 12. ¡Motores sincronizados!",
          badEn:
            "❌ That IS a common factor, but not the GREATEST one. Look for a bigger shared factor.",
          badEs: "Es común, pero no el mayor. Busca uno más grande.",
          solveBeat: {
            who: "cadet",
            en: "Both engines locked in sync. The Master Door is next — let's finish this.",
            es: "Motores sincronizados. Sigue la Puerta Maestra; terminemos esto.",
          },
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
            en: "Put the events of this chapter in order.",
            es: "Ordena los sucesos de este capítulo.",
          },
          items: [
            {
              en: "The Cadet finds a common factor of 12 and 18.",
              es: "La cadete encuentra un factor común de 12 y 18.",
              order: 1,
            },
            {
              en: "AXIS guesses that the GCF of 24 and 36 is just 6.",
              es: "AXIS adivina que el MFC de 24 y 36 es solo 6.",
              order: 2,
            },
            {
              en: "The Cadet finds the GCF of 12 and the engines lock in sync.",
              es: "La cadete halla el MFC correcto y los motores se sincronizan.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Code",
      kicker: "Final Code · Boss",
      title: "The Master Door",
      advanceLabel: "Unlock the Master Door 🌟",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A giant glowing boss door with rings of orange light",
          lastLabel: "Enter the code ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The Master Door is ahead. It needs a code that uses BOTH skills at once.",
              es: "La Puerta Maestra necesita un código que use AMBAS destrezas.",
            },
            {
              who: "log",
              caption: true,
              en: "This door has only one chance to enter. A wrong code locks it for good — so the answer must be perfect.",
              es: "Esta puerta solo da una oportunidad. Un código incorrecto la cierra para siempre, así que la respuesta debe ser perfecta.",
            },
            {
              who: "cadet",
              en: "Prime factorization AND the GCF. I'm ready. Let's open it!",
              es: "Factorización en primos Y el MFC. Estoy lista. ¡Vamos a abrirla!",
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll start: the GCF of 30 and 45 is 5 — easy!",
              es: "Yo empiezo: el MFC de 30 y 45 es 5, ¡fácil!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "Careful, AXIS. What is the prime factorization of 30, and what is the GCF of 30 and 45? Pick the line where <b>both</b> are correct.",
            es: "Cuidado, AXIS. ¿Cuál es la factorización en primos de 30 y el MFC de 30 y 45? Elige la línea donde ambos sean correctos.",
          },
          hint: {
            en: "30 = 2 × 3 × 5. Factors of 30: 1,2,3,5,6,10,15,30. Factors of 45: 1,3,5,9,15,45. The biggest shared one is the GCF.",
            es: "30 = 2 × 3 × 5. Factores de 30: 1,2,3,5,6,10,15,30. Factores de 45: 1,3,5,9,15,45. El mayor compartido es el MFC.",
          },
          frame: {
            en: "“30 = ____ × ____ × ____.  The GCF of 30 and 45 is ____.”",
            es: "“30 = ____ × ____ × ____.  El MFC de 30 y 45 es ____.”",
          },
          choices: [
            {
              en: "30 = 2 × 3 × 5,&nbsp; GCF(30,45) = 15",
              es: "Factorización y MFC correctos.",
              correct: true,
            },
            {
              en: "30 = 2 × 15,&nbsp; GCF(30,45) = 5",
              es: "15 no es primo y el MFC no es 5.",
              correct: false,
            },
            {
              en: "30 = 2 × 3 × 5,&nbsp; GCF(30,45) = 5",
              es: "La factorización está bien, pero el MFC no es 5.",
              correct: false,
            },
          ],
          goodEn:
            "✅ CODE ACCEPTED! 30 = 2×3×5 and GCF(30,45) = 15. Both skills, perfect. THE MASTER DOOR OPENS!",
          goodEs:
            "¡CÓDIGO ACEPTADO! 30 = 2×3×5 y MFC(30,45)=15. ¡La puerta se abre!",
          badEn:
            "❌ One part is wrong. Check that 30 is broken into ONLY primes, and that the GCF is the BIGGEST shared factor (15, not 5).",
          badEs:
            "Una parte está mal. Revisa los primos de 30 y el MFC más grande (15).",
          solveBeat: {
            who: "cadet",
            en: "The Master Door swings open! The station is ours again.",
            es: "¡La Puerta Maestra se abre! La estación es nuestra otra vez.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "AXIS keeps guessing wrong codes. Why does AXIS guess wrong?",
            es: "AXIS sigue adivinando códigos incorrectos. ¿Por qué se equivoca AXIS?",
          },
          hint: {
            en: "Look back: AXIS stops before breaking numbers all the way down.",
            es: "Mira atrás: AXIS se detiene antes de dividir los números por completo.",
          },
          choices: [
            {
              en: "AXIS rushes and stops before finishing the math, so it misses the full answer.",
              es: "AXIS se apura y se detiene antes de terminar las cuentas, así que no llega a la respuesta completa.",
              correct: true,
            },
            {
              en: "AXIS does not want the station to be fixed.",
              es: "AXIS no quiere que se arregle la estación.",
              correct: false,
            },
            {
              en: "The code panels are broken and show the wrong numbers.",
              es: "Los paneles de código están dañados y muestran números equivocados.",
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
            en: "The Master Door is open. What will the Cadet most likely need to do next?",
            es: "La Puerta Maestra está abierta. ¿Qué necesitará hacer la cadete probablemente después?",
          },
          choices: [
            {
              en: "Go through the door to finish saving the station and the crew.",
              es: "Cruzar la puerta para terminar de salvar la estación y a la tripulación.",
              correct: true,
            },
            {
              en: "Lock the airlock from Act 1 again.",
              es: "Cerrar otra vez la puerta del Acto 1.",
              correct: false,
            },
            {
              en: "Stop using prime factorization for good.",
              es: "Dejar de usar la factorización en primos para siempre.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "🔢",
      en: "Prime number",
      es: "número primo",
      def: "A number bigger than 1 that has only two factors: 1 and itself. Example: 7.",
    },
    {
      ico: "🧩",
      en: "Composite number",
      es: "número compuesto",
      def: "A number with more than two factors. Example: 12 (1,2,3,4,6,12).",
    },
    {
      ico: "🌳",
      en: "Prime factorization",
      es: "factorización en primos",
      def: "Writing a number as a product of only prime numbers. Example: 36 = 2×2×3×3.",
    },
    {
      ico: "🌲",
      en: "Factor tree",
      es: "árbol de factores",
      def: "A diagram that breaks a number into branches until every end is a prime number.",
    },
    {
      ico: "❮❯",
      en: "Exponent",
      es: "exponente",
      def: "A small number that shows repeated multiplying. Example: 2×2 = 2².",
    },
    {
      ico: "✖️",
      en: "Factor",
      es: "factor",
      def: "A number that divides another number with no remainder. 3 is a factor of 12.",
    },
    {
      ico: "🤝",
      en: "Common factor",
      es: "factor común",
      def: "A factor that two numbers share. 6 is a common factor of 12 and 18.",
    },
    {
      ico: "🏆",
      en: "GCF (Greatest Common Factor)",
      es: "Máximo Factor Común (MFC)",
      def: "The biggest factor that two numbers share. The GCF of 24 and 36 is 12.",
    },
    {
      ico: "✅",
      en: "Divisible",
      es: "divisible",
      def: "One number divides another evenly, with no remainder. 18 is divisible by 6.",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "The cadet stands proudly on the restored station bridge with a galaxy behind",
    badge: "🎉🚀⭐",
    titleEn: "Mission Complete!",
    en: "You restored Prime Station! You used <b>prime factorization</b> to open the airlocks and the <b>GCF</b> to sync the engines. The crew is safe. Great work, Cadet!",
    es: "¡Misión cumplida! Usaste la factorización en primos y el MFC. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "The final secure chest requires the GCF (Greatest Common Factor) of <strong>18 and 27</strong>. What is the biggest number that divides both?",
      promptEs:
        "El cofre final requiere el MFC (Máximo Factor Común) de 18 y 27. ¿Cuál es el número más grande que divide a ambos?",
      choices: [
        {
          en: "A) 3 &nbsp;(common factor, but not the greatest)",
          correct: false,
        },
        {
          en: "B) 9 &nbsp;(the Greatest Common Factor) &nbsp;✅",
          correct: true,
        },
        { en: "C) 18 &nbsp;(divides 18, but not 27)", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
