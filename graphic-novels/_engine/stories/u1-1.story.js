/* STORY · Unit 1 · Graphic Novel #1 (Support) · Prime Station: The Factor Code
   Phase-1 example build: Cover + Act 1 (both locks) + Glossary + Complete.
   All math, answers, distractors, Spanish, sentence frames, and glossary are
   carried verbatim from graphic-novels/unit1/graphic-novel-1.html — only the
   delivery (panels, speech, AXIS misconception, pop-ups) is new. */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "Prime Station: The Factor Code",
    standard: "6.NS.4",
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
      "Eres un cadete espacial. Solo los <b>códigos de factores</b> abren las puertas. AXIS, la IA, quiere ayudar… pero se equivoca. ¡Atrapa sus errores!",
    startLabel: "Start Mission 🚀",
  },

  acts: [
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
            {
              en: "15 is prime.",
              es: "15 es primo.",
              correct: false,
            },
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
          type: "beats",
          art: "airlock-open.png",
          alt: "The open airlock glows as the cadet studies a holographic 36",
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
          solveBeat: {
            who: "cadet",
            en: "Code accepted! The bay is open. Thanks for the help, AXIS — even the wrong guesses!",
            es: "¡Código aceptado! La bahía está abierta. Gracias, AXIS.",
          },
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
      ico: "❌",
      en: "Factor",
      es: "factor",
      def: "A number that divides another number with no remainder. 3 is a factor of 12.",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "The cadet stands proudly on the restored station bridge with a galaxy behind",
    badge: "🎉🚀⭐",
    titleEn: "Bay Restored!",
    en: "You caught AXIS's mistakes and opened the locked bay with <b>prime factorization</b>. (Full novel continues with the Twin Engines and the Master Door.)",
    es: "¡Atrapaste los errores de AXIS y abriste la bahía con la factorización en primos!",
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
      certifyTitle: "🏆 Master Certified: Bay Restored!",
    },
  },
};
