/* STORY · Unit 1 · Lesson 1-7 · Graphic Novel #2 (Enrichment) · Decimal Division Drive: Deep Space
   Full novel on the comic engine — Act 1 (Route Planning), Final (Precision Jump),
   Glossary, Mission Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, sentence frames, hints, and glossary
   are carried verbatim from
   graphic-novels/lessons/u1-l7/graphic-novel-2.html (6.NS.3).
   Note: unlike the U1 anchor #2, THIS Enrichment source HAS Spanish — it is
   preserved (fidelity). New: panels, speech, AXIS-voices-the-misconception
   (existing distractors only), vocab/hint/coach pop-ups. Source has 2 acts. */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 2,
    level: "Enrichment",
    title: "Decimal Division Drive: Deep Space",
    standard: "6.NS.3",
    assessment: "Graphic Novel U1 #2: Decimal Division Drive: Deep Space",
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
      blurb: "Station AI · shifts the decimal in only one number",
    },
    log: { name: "Station AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A commander planning multi-jump routes that divide decimal distances and check the math",
    blurbEn:
      "Command rank, Cadet. Plan multi-jump routes and reason about why moving the decimal keeps the quotient the same. Then check your own answer with multiplication.",
    blurbEs:
      "Rango de mando, Cadete. Planea rutas de varios saltos y razona por qué mover el punto no cambia el cociente. Luego comprueba con multiplicación.",
    startLabel: "Begin Command 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Route Planning",
      kicker: "Act 1 · Lesson 1-7",
      title: "Route Planning",
      advanceLabel: "Confirm the route 🚀",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "A holographic route map dividing a long decimal distance into equal legs",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Commander, plan a route of 12.6 light-units in legs of 0.6 each. How many legs?",
              es: "Comandante, planea una ruta de 12.6 unidades en tramos de 0.6. ¿Cuántos tramos?",
            },
            {
              who: "cadet",
              en: "Multiply both by 10 to get 126 ÷ 6. Moving the decimal the same way in both keeps the quotient identical.",
              es: "Multiplico ambos por 10: 126 ÷ 6. Mover el punto igual en ambos no cambia el cociente.",
              vocab: [
                {
                  term: "quotient",
                  en: "The answer when you divide.",
                  es: "El resultado cuando divides.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll shift only the divisor: 12.6 ÷ 0.6 = 12.6 ÷ 6 = 2.1 legs. Plotting it!",
              es: "Muevo solo el divisor: 12.6 ÷ 0.6 = 12.6 ÷ 6 = 2.1 tramos. ¡Lo trazo!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "Check me, Commander. Compute <b>12.6 ÷ 0.6</b> to count the legs. Make the divisor whole first.",
            es: "Compruébame, Comandante. Calcula 12.6 ÷ 0.6 para contar los tramos. Haz el divisor entero primero.",
          },
          hint: {
            en: "Multiply both by 10: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
            es: "Multiplica ambos por 10: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
          },
          frame: {
            en: "“12.6 ÷ 0.6 = 126 ÷ 6 = ____ legs.”",
            es: "“12.6 ÷ 0.6 = 126 ÷ 6 = ____ tramos.”",
          },
          choices: [
            {
              en: "21 legs&nbsp; (126 ÷ 6)",
              es: "21 tramos (126 ÷ 6).",
              correct: true,
            },
            { en: "2.1 legs", es: "2.1 tramos.", correct: false },
            { en: "12 legs", es: "12 tramos.", correct: false },
          ],
          goodEn:
            "✅ Exactly! 126 ÷ 6 = 21 legs. Same decimal shift in both keeps the quotient equal.",
          goodEs: "¡Exacto! 126 ÷ 6 = 21 tramos.",
          badEn: "❌ Multiply both by 10: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
          badEs: "❌ ×10 en ambos: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
          solveBeat: {
            who: "cadet",
            en: "Route set. Now I'll check it with multiplication.",
            es: "Ruta lista. Ahora la compruebo con multiplicación.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "Check your answer: if 12.6 ÷ 0.6 = 21, then 21 × 0.6 should equal 12.6. What is <b>21 × 0.6</b>?",
            es: "Comprueba: si 12.6 ÷ 0.6 = 21, entonces 21 × 0.6 debe ser 12.6. ¿Cuánto es 21 × 0.6?",
            vocab: [
              {
                term: "equivalent division",
                en: "Multiplying both numbers by 10 or 100 gives the same answer.",
                es: "Multiplicar ambos números por 10 o 100 da la misma respuesta.",
              },
            ],
          },
          hint: {
            en: "21 × 6 = 126, and 0.6 has 1 decimal place, so 21 × 0.6 = 12.6.",
            es: "21 × 6 = 126, y 0.6 tiene 1 lugar decimal, así que 21 × 0.6 = 12.6.",
          },
          frame: {
            en: "“21 × 0.6 = ____, which matches the original distance, so the division checks out.”",
            es: "“21 × 0.6 = ____, que coincide con la distancia original, así que la división se comprueba.”",
          },
          choices: [
            {
              en: "12.6&nbsp; (so the quotient is correct)",
              es: "12.6 (así que el cociente es correcto).",
              correct: true,
            },
            { en: "1.26", es: "1.26.", correct: false },
            { en: "126", es: "126.", correct: false },
          ],
          goodEn:
            "✅ Yes! 21 × 0.6 = 12.6 matches the original distance — your division is confirmed.",
          goodEs: "¡Sí! 21 × 0.6 = 12.6 coincide con la distancia original.",
          badEn:
            "❌ 21 × 6 = 126; with 1 decimal place that is 12.6, which matches the start.",
          badEs: "❌ 21 × 6 = 126; con 1 lugar decimal es 12.6.",
          solveBeat: {
            who: "cadet",
            en: "Route confirmed both ways. Now the precision leg home.",
            es: "Ruta confirmada de dos formas. Ahora el tramo de precisión a casa.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: Precision Jump",
      kicker: "Final · Lesson 1-7",
      title: "The Precision Jump",
      advanceLabel: "Execute the jump! 🌟",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A precise final jump computed by dividing a hundredths decimal distance",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Precision leg, Commander: 1.25 light-units in jumps of 0.25. How many?",
              es: "Tramo de precisión, Comandante: 1.25 unidades en saltos de 0.25. ¿Cuántos?",
            },
            {
              who: "cadet",
              en: "These have hundredths, so I multiply both by 100 to make the divisor whole.",
              es: "Tienen centésimas, así que multiplico ambos por 100 para hacer el divisor entero.",
              vocab: [
                {
                  term: "divisor",
                  en: "The number you split by in a division problem.",
                  es: "El número entre el que divides en una división.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll multiply both by 100: 125 ÷ 25 — but that's 50 jumps, right? Locking it!",
              es: "Multiplico ambos por 100: 125 ÷ 25 — pero son 50 saltos, ¿no? ¡Lo fijo!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "Careful, AXIS — recount that division. Compute <b>1.25 ÷ 0.25</b>. The divisor has hundredths. Which line is correct?",
            es: "Cuidado, AXIS: vuelve a contar esa división. Calcula 1.25 ÷ 0.25. El divisor tiene centésimas. ¿Cuál línea es correcta?",
          },
          hint: {
            en: "Multiply both by 100: 1.25 ÷ 0.25 = 125 ÷ 25 = 5.",
            es: "Multiplica ambos por 100: 1.25 ÷ 0.25 = 125 ÷ 25 = 5.",
          },
          frame: {
            en: "“1.25 ÷ 0.25 = 125 ÷ 25 = ____ jumps.”",
            es: "“1.25 ÷ 0.25 = 125 ÷ 25 = ____ saltos.”",
          },
          choices: [
            {
              en: "1.25 ÷ 0.25 = 125 ÷ 25 = 5 jumps",
              es: "1.25 ÷ 0.25 = 125 ÷ 25 = 5 saltos.",
              correct: true,
            },
            {
              en: "1.25 ÷ 0.25 = 125 ÷ 25 = 50 jumps",
              es: "1.25 ÷ 0.25 = 125 ÷ 25 = 50 saltos.",
              correct: false,
            },
            {
              en: "1.25 ÷ 0.25 = 12.5 ÷ 25 = 0.5 jumps",
              es: "1.25 ÷ 0.25 = 12.5 ÷ 25 = 0.5 saltos.",
              correct: false,
            },
          ],
          goodEn:
            "✅ PRECISION JUMP LOCKED! Multiply both by 100: 125 ÷ 25 = 5 jumps. Flawless navigation, Commander!",
          goodEs: "¡SALTO DE PRECISIÓN! ×100 en ambos: 125 ÷ 25 = 5 saltos.",
          badEn:
            "❌ Both numbers have hundredths — multiply both by 100: 125 ÷ 25 = 5, not 50.",
          badEs: "❌ Ambos tienen centésimas — ×100 en ambos: 125 ÷ 25 = 5.",
          solveBeat: {
            who: "cadet",
            en: "Precision jump executed — the fleet is home. Command rank earned, AXIS.",
            es: "Salto de precisión ejecutado: la flota llegó a casa. Rango de mando ganado, AXIS.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "📚",
      en: "Dividend",
      es: "Dividendo",
      def: "The number you are splitting up in a division problem.",
    },
    {
      ico: "📚",
      en: "Divisor",
      es: "Divisor",
      def: "The number you split by in a division problem.",
    },
    {
      ico: "📚",
      en: "Quotient",
      es: "Cociente",
      def: "The answer when you divide.",
    },
    {
      ico: "📚",
      en: "Decimal division",
      es: "División decimal",
      def: "Dividing with decimals. First make the number you divide by a whole number.",
    },
    {
      ico: "📚",
      en: "Equivalent division",
      es: "División equivalente",
      def: "Multiplying both numbers by 10 or 100 gives the same answer.",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "A commander confirms the fleet's safe arrival after precise decimal jumps",
    badge: "🎉⭐",
    titleEn: "Precision Achieved!",
    en: "You divided decimals by shifting the point in both numbers, checked your work by multiplying, and even handled hundredths. Command rank earned, Commander!",
    es: "¡Dividiste decimales moviendo el punto en ambos, comprobaste multiplicando y manejaste centésimas! Rango de mando ganado.",
    master: {
      headingEn: "Bonus challenge — for mastery, not required.",
      promptEn:
        "Command challenge: 3.6 ÷ 0.12. Make the divisor whole (×100). What is the quotient?",
      promptEs:
        "Reto de mando: 3.6 ÷ 0.12. Haz el divisor entero (×100). ¿Cuál es el cociente?",
      choices: [
        { en: "30&nbsp; (360 ÷ 12)", correct: true },
        { en: "3", correct: false },
        { en: "300", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified: Precision Achieved!",
    },
  },
};
