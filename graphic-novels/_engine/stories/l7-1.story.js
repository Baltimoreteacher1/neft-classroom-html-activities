/* STORY · Unit 1 · Lesson 1-7 · Graphic Novel #1 (Support) · Decimal Division Drive
   Full novel on the comic engine — Act 1 (Equal Jumps), Final (The Home Jump),
   Glossary, Mission Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, sentence frames, hints, and glossary
   are carried verbatim from
   graphic-novels/lessons/u1-l7/graphic-novel-1.html (6.NS.3).
   New: panels, speech, AXIS-voices-the-misconception (existing distractors only),
   vocab/hint/coach pop-ups. Note: this source has 2 acts (Act 1 + Final). */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 1,
    level: "Support",
    title: "Decimal Division Drive",
    standard: "6.NS.3",
    assessment: "Graphic Novel U1 #1: Decimal Division Drive",
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
      blurb: "Station AI · forgets to shift the decimal in both numbers",
    },
    log: { name: "Station AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A space cadet at a navigation drive that divides decimal distances into equal jumps",
    blurbEn:
      "The hyperdrive splits long decimal distances into equal jumps. To divide with decimals, make the divisor a whole number first. Pilot us home, Cadet!",
    blurbEs:
      "El hiperimpulsor divide distancias decimales en saltos iguales. Para dividir, primero haz que el divisor sea entero. ¡Llévanos a casa, Cadete!",
    startLabel: "Start Mission 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Equal Jumps",
      kicker: "Act 1 · Lesson 1-7",
      title: "Equal Jumps",
      advanceLabel: "Plot the jumps 🚀",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "A navigation screen splitting a decimal distance into equal jump markers",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Cadet, we must cross 4.5 light-units in jumps of 0.5 each. How MANY jumps?",
              es: "Cadete, cruzamos 4.5 unidades en saltos de 0.5. ¿CUÁNTOS saltos?",
            },
            {
              who: "cadet",
              en: "To divide by a decimal, I make the divisor whole. Multiply BOTH numbers by 10: 4.5 ÷ 0.5 becomes 45 ÷ 5.",
              es: "Para dividir entre un decimal, hago el divisor entero. Multiplico AMBOS por 10: 4.5 ÷ 0.5 es 45 ÷ 5.",
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
              en: "I've got it — only the divisor needs shifting: 4.5 ÷ 0.5 = 4.5 ÷ 5 = 0.9 jumps!",
              es: "¡Ya está! Solo el divisor se mueve: 4.5 ÷ 0.5 = 4.5 ÷ 5 = 0.9 saltos.",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "Wait — count it for me. Compute <b>4.5 ÷ 0.5</b>. Make the divisor a whole number first. How many jumps?",
            es: "Espera, cuéntalo. Calcula 4.5 ÷ 0.5. Haz el divisor entero primero. ¿Cuántos saltos?",
          },
          hint: {
            en: "Multiply both by 10: 4.5 ÷ 0.5 = 45 ÷ 5 = 9.",
            es: "Multiplica ambos por 10: 4.5 ÷ 0.5 = 45 ÷ 5 = 9.",
          },
          frame: {
            en: "“I multiplied both numbers by 10, so 4.5 ÷ 0.5 = 45 ÷ 5 = ____.”",
            es: "“Multipliqué ambos números por 10, así que 4.5 ÷ 0.5 = 45 ÷ 5 = ____.”",
          },
          choices: [
            {
              en: "9 jumps&nbsp; (45 ÷ 5)",
              es: "9 saltos (45 ÷ 5).",
              correct: true,
            },
            {
              en: "0.9 jumps",
              es: "0.9 saltos.",
              correct: false,
            },
            { en: "90 jumps", es: "90 saltos.", correct: false },
          ],
          goodEn:
            "✅ Correct! Multiply both by 10: 45 ÷ 5 = 9 jumps. Same answer, easier division.",
          goodEs: "¡Correcto! ×10 en ambos: 45 ÷ 5 = 9 saltos.",
          badEn:
            "❌ Make the divisor whole: multiply both by 10 to get 45 ÷ 5 = 9.",
          badEs: "❌ Haz el divisor entero: ×10 en ambos para 45 ÷ 5 = 9.",
          solveBeat: {
            who: "cadet",
            en: "Course plotted! Now a longer leg with a tighter jump.",
            es: "¡Rumbo trazado! Ahora un tramo más largo con saltos más cortos.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "Now cross 9.6 light-units in jumps of 0.8. Compute <b>9.6 ÷ 0.8</b>.",
            es: "Ahora cruza 9.6 unidades en saltos de 0.8. Calcula 9.6 ÷ 0.8.",
            vocab: [
              {
                term: "quotient",
                en: "The answer when you divide.",
                es: "El resultado cuando divides.",
              },
            ],
          },
          hint: {
            en: "Multiply both by 10: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
            es: "Multiplica ambos por 10: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
          },
          frame: {
            en: "“Multiplying both by 10, 9.6 ÷ 0.8 = 96 ÷ 8 = ____.”",
            es: "“Multiplicando ambos por 10, 9.6 ÷ 0.8 = 96 ÷ 8 = ____.”",
          },
          choices: [
            {
              en: "12 jumps&nbsp; (96 ÷ 8)",
              es: "12 saltos (96 ÷ 8).",
              correct: true,
            },
            { en: "1.2 jumps", es: "1.2 saltos.", correct: false },
            { en: "8 jumps", es: "8 saltos.", correct: false },
          ],
          goodEn:
            "✅ Yes! 96 ÷ 8 = 12 jumps. The decimal point moved the same way in both numbers.",
          goodEs: "¡Sí! 96 ÷ 8 = 12 saltos.",
          badEn: "❌ Multiply both by 10: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
          badEs: "❌ ×10 en ambos: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
          solveBeat: {
            who: "cadet",
            en: "Both jumps locked in. Time for the final leg home.",
            es: "Los dos saltos están listos. Es hora del tramo final a casa.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: Home Jump",
      kicker: "Final · Lesson 1-7",
      title: "The Home Jump",
      advanceLabel: "Jump home! 🌟",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "The final hyperspace jump home shown as a decimal division on the console",
          lastLabel: "Stop AXIS ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Final leg, Cadet: 7.2 light-units in jumps of 0.9. Get us home!",
              es: "Tramo final, Cadete: 7.2 unidades en saltos de 0.9. ¡Llévanos a casa!",
            },
            {
              who: "cadet",
              en: "Multiply both by 10 and divide. Here we go!",
              es: "Multiplico ambos por 10 y divido. ¡Vamos!",
              vocab: [
                {
                  term: "decimal division",
                  en: "Dividing with decimals. First make the number you divide by a whole number.",
                  es: "Dividir con decimales. Primero haz que el número entre el que divides sea entero.",
                },
              ],
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll shift only the divisor: 7.2 ÷ 0.9 = 7.2 ÷ 9 = 0.8 jumps. Locking it in!",
              es: "Muevo solo el divisor: 7.2 ÷ 0.9 = 7.2 ÷ 9 = 0.8 saltos. ¡Lo fijo!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "Hold on, AXIS — shift the decimal in BOTH numbers. Compute <b>7.2 ÷ 0.9</b>. Which line is correct?",
            es: "Espera, AXIS: mueve el punto en AMBOS números. Calcula 7.2 ÷ 0.9. ¿Cuál línea es correcta?",
          },
          hint: {
            en: "Multiply both by 10: 7.2 ÷ 0.9 = 72 ÷ 9 = 8.",
            es: "Multiplica ambos por 10: 7.2 ÷ 0.9 = 72 ÷ 9 = 8.",
          },
          frame: {
            en: "“7.2 ÷ 0.9 = 72 ÷ 9 = ____ jumps.”",
            es: "“7.2 ÷ 0.9 = 72 ÷ 9 = ____ saltos.”",
          },
          choices: [
            {
              en: "7.2 ÷ 0.9 = 72 ÷ 9 = 8 jumps",
              es: "7.2 ÷ 0.9 = 72 ÷ 9 = 8 saltos.",
              correct: true,
            },
            {
              en: "7.2 ÷ 0.9 = 72 ÷ 9 = 0.8 jumps",
              es: "7.2 ÷ 0.9 = 72 ÷ 9 = 0.8 saltos.",
              correct: false,
            },
            {
              en: "7.2 ÷ 0.9 = 7.2 ÷ 9 = 0.8 jumps",
              es: "7.2 ÷ 0.9 = 7.2 ÷ 9 = 0.8 saltos.",
              correct: false,
            },
          ],
          goodEn:
            "✅ HOME JUMP LOCKED! 72 ÷ 9 = 8 jumps. You moved the decimal in BOTH numbers. We're home!",
          goodEs: "¡SALTO LISTO! 72 ÷ 9 = 8 saltos. ¡Llegamos a casa!",
          badEn:
            "❌ Move the decimal in BOTH numbers (×10): 7.2 ÷ 0.9 = 72 ÷ 9 = 8, not 0.8.",
          badEs:
            "❌ Mueve el punto en AMBOS números (×10): 72 ÷ 9 = 8, no 0.8.",
          solveBeat: {
            who: "cadet",
            en: "Home jump locked — we made it! Thanks for the help, AXIS, even the wrong guesses.",
            es: "¡Salto a casa listo, lo logramos! Gracias, AXIS.",
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
    alt: "The cadet arrives home as the station glows safely in orbit",
    badge: "🎉⭐",
    titleEn: "Mission Complete!",
    en: "You divided decimals by making each divisor a whole number, then dividing. Every jump landed perfectly and you piloted the crew home. Great work, Cadet!",
    es: "¡Dividiste decimales haciendo el divisor entero y luego dividiendo! Llevaste a la tripulación a casa.",
    master: {
      headingEn: "Bonus challenge — for mastery, not required.",
      promptEn:
        "Master check: 6.4 ÷ 0.4. Make the divisor whole first. What is the quotient?",
      promptEs:
        "Reto maestro: 6.4 ÷ 0.4. Haz el divisor entero. ¿Cuál es el cociente?",
      choices: [
        { en: "16&nbsp; (64 ÷ 4)", correct: true },
        { en: "1.6", correct: false },
        { en: "160", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
