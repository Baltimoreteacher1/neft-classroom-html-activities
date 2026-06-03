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
    readingStandard: "RL.6.1",
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
              who: "log",
              caption: true,
              en: "The hyperdrive only fires in equal jumps, so every leg of the trip home is one decimal division.",
              es: "El hiperimpulsor solo dispara en saltos iguales, así que cada tramo del viaje a casa es una división decimal.",
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
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.beat1",
          ask: {
            who: "log",
            en: "How long is the first leg the crew must cross?",
            es: "¿Qué tan largo es el primer tramo que debe cruzar la tripulación?",
          },
          choices: [
            {
              en: "4.5 light-units, in jumps of 0.5 each.",
              es: "4.5 unidades, en saltos de 0.5 cada uno.",
              correct: true,
            },
            {
              en: "9.6 light-units, in jumps of 0.8 each.",
              es: "9.6 unidades, en saltos de 0.8 cada uno.",
              correct: false,
            },
            {
              en: "7.2 light-units, in jumps of 0.9 each.",
              es: "7.2 unidades, en saltos de 0.9 cada uno.",
              correct: false,
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
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "In the story, the <b>divisor</b> is the number you divide by. In 4.5 ÷ 0.5, which number is the divisor?",
            es: "En la historia, el <b>divisor</b> es el número entre el que divides. En 4.5 ÷ 0.5, ¿cuál número es el divisor?",
          },
          hint: {
            en: "It is the number that tells you the size of each jump.",
            es: "Es el número que dice el tamaño de cada salto.",
          },
          choices: [
            {
              en: "0.5 — the size of each jump you divide by.",
              es: "0.5 — el tamaño de cada salto entre el que divides.",
              correct: true,
            },
            {
              en: "4.5 — the total distance being split up.",
              es: "4.5 — la distancia total que se reparte.",
              correct: false,
            },
            {
              en: "9 — the number of jumps you get.",
              es: "9 — el número de saltos que obtienes.",
              correct: false,
            },
          ],
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
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act1",
          ask: {
            who: "log",
            en: "What is this chapter mostly about?",
            es: "¿De qué trata principalmente este capítulo?",
          },
          choices: [
            {
              en: "Making the divisor a whole number to count equal decimal jumps.",
              es: "Hacer el divisor un número entero para contar saltos decimales iguales.",
              correct: true,
            },
            {
              en: "Choosing which color the hyperdrive should glow.",
              es: "Elegir de qué color debe brillar el hiperimpulsor.",
              correct: false,
            },
            {
              en: "Teaching AXIS the names of the stars.",
              es: "Enseñar a AXIS los nombres de las estrellas.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 2,
          interaction: "evidence",
          passageRef: "act1.beat1",
          ask: {
            who: "log",
            en: "Tap the line that shows you must move the decimal in <b>both</b> numbers.",
            es: "Toca la línea que muestra que debes mover el punto en <b>ambos</b> números.",
          },
          choices: [
            {
              en: "“Multiply BOTH numbers by 10: 4.5 ÷ 0.5 becomes 45 ÷ 5.”",
              es: "“Multiplico AMBOS por 10: 4.5 ÷ 0.5 es 45 ÷ 5.”",
              correct: true,
            },
            {
              en: "“We must cross 4.5 light-units in jumps of 0.5 each.”",
              es: "“Cruzamos 4.5 unidades en saltos de 0.5.”",
              correct: false,
            },
            {
              en: "“Course plotted! Now a longer leg with a tighter jump.”",
              es: "“¡Rumbo trazado! Ahora un tramo más largo.”",
              correct: false,
            },
          ],
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
              who: "log",
              caption: true,
              en: "One last decimal division stands between the crew and home — line up the point in both numbers and the jump count comes out whole.",
              es: "Una última división decimal separa a la tripulación de casa: alinea el punto en ambos números y el número de saltos será entero.",
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
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "final",
          ask: {
            who: "log",
            en: "Put the steps for the home jump in the right order.",
            es: "Pon los pasos del salto a casa en el orden correcto.",
          },
          items: [
            {
              en: "The crew must cross 7.2 light-units in jumps of 0.9.",
              es: "La tripulación debe cruzar 7.2 unidades en saltos de 0.9.",
              order: 1,
            },
            {
              en: "Multiply both numbers by 10 to get 72 ÷ 9.",
              es: "Multiplica ambos números por 10 para obtener 72 ÷ 9.",
              order: 2,
            },
            {
              en: "Divide to find 8 jumps and lock the home jump.",
              es: "Divide para hallar 8 saltos y fija el salto a casa.",
              order: 3,
            },
          ],
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
            en: "AXIS keeps getting answers like 0.9 and 0.8 jumps. Why does AXIS keep getting them wrong?",
            es: "AXIS sigue obteniendo respuestas como 0.9 y 0.8 saltos. ¿Por qué AXIS se sigue equivocando?",
          },
          hint: {
            en: "Look at what AXIS does with the decimal point each time.",
            es: "Mira lo que AXIS hace con el punto decimal cada vez.",
          },
          choices: [
            {
              en: "AXIS shifts the decimal in only one number instead of both.",
              es: "AXIS mueve el punto en solo un número en vez de en ambos.",
              correct: true,
            },
            {
              en: "AXIS does not want to get the crew home.",
              es: "AXIS no quiere llevar a la tripulación a casa.",
              correct: false,
            },
            {
              en: "The navigation screen shows the wrong distances.",
              es: "La pantalla de navegación muestra distancias equivocadas.",
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
            en: "The home jump is locked. What will the Cadet most likely do next?",
            es: "El salto a casa está fijo. ¿Qué hará probablemente la cadete después?",
          },
          choices: [
            {
              en: "Fire the hyperdrive and bring the crew safely home.",
              es: "Disparar el hiperimpulsor y llevar a la tripulación a casa con seguridad.",
              correct: true,
            },
            {
              en: "Start the very first leg over again from 4.5.",
              es: "Empezar otra vez el primer tramo desde 4.5.",
              correct: false,
            },
            {
              en: "Stop using decimal division for good.",
              es: "Dejar de usar la división decimal para siempre.",
              correct: false,
            },
          ],
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
