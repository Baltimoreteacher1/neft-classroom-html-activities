/* STORY · Unit 9 · Graphic Novel #1 (Support) · Treasure Map Navigator
   Phase-2 build on the comic engine — Act 1 (The Map Grid), Act 2 (Above &
   Below the Sea), Final (X Marks the Spot), Glossary, Treasure Found +
   Master-Rank challenge.
   All math (coordinates, integers, absolute values), answers, distractors,
   Spanish, sentence frames, hints, and glossary are carried verbatim from
   graphic-novels/unit9/graphic-novel-1.html (6.NS.7).
   New: panels, speech, MARLOW-voices-the-misconception, vocab/hint/coach
   pop-ups. The reader is "The Navigator"; MARLOW is a talkative first mate who
   orders negatives by the size of their digits (says −7 > −3). */
window.GN_STORY = {
  meta: {
    unit: 9,
    version: 1,
    level: "Support",
    title: "Treasure Map Navigator",
    standard: "6.NS.7",
    assessment: "Graphic Novel U9 #1: Treasure Map Navigator",
    artBase: "../_art/unit9/",
    home: "../index.html",
  },

  cast: {
    navigator: {
      name: "The Navigator",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧭",
      avatar: null,
      blurb: "You",
    },
    marlow: {
      name: "MARLOW",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🦜",
      avatar: null,
      blurb: "First mate · says −7 is bigger than −3",
    },
    log: { name: "Old Map", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya the young explorer holds up a glowing treasure map on a tropical cliff above the sea",
    blurbEn:
      "You are <b>the Navigator</b>. You found an old treasure map! To reach the treasure, you must <b>plot points</b> on a grid and use <b>integers</b> (numbers above and below zero). MARLOW, your first mate, wants to help… but MARLOW keeps mixing up negative numbers. Catch the mistakes and find the gold!",
    blurbEs:
      "Eres el Navegante. Para llegar al tesoro, debes marcar puntos en una cuadrícula y usar números enteros (arriba y abajo de cero). MARLOW, tu primer oficial, quiere ayudar… pero confunde los números negativos. ¡Atrapa los errores!",
    startLabel: "Start the Hunt 🗺️",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Map Grid",
      kicker: "Act 1 · Graph on the Coordinate Plane",
      title: "The Map Grid",
      advanceLabel: "Follow the map 🧭",
      steps: [
        {
          type: "beats",
          art: "map-grid.png",
          alt: "Maya kneels over a treasure map with a glowing coordinate grid drawn on it",
          lastLabel: "Read the map ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Old map found! It has a GRID with numbers. To follow it, you must read points like (x, y).",
              es: "¡Mapa encontrado! Tiene una CUADRÍCULA. Debes leer puntos como (x, y).",
            },
            {
              who: "navigator",
              en: "Okay! The first number tells me left or right. The second tells me up or down. I can do this!",
              es: "¡Bien! El primer número es izquierda/derecha. El segundo es arriba/abajo.",
              vocab: [
                {
                  term: "ordered pair",
                  en: "Two numbers (x, y) that name one point. x first (left/right), y second (up/down).",
                  es: "Dos números (x, y) que nombran un punto. x primero (izquierda/derecha), y después (arriba/abajo).",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "First, find which QUADRANT the treasure clue is in.",
              es: "Primero, encuentra en qué CUADRANTE está la pista.",
              callout: {
                x: 60,
                y: 42,
                icon: "?",
                title: "Map grid",
                en: "The map shows the point (−4, 3). x = −4 (left), y = 3 (up).",
                es: "El mapa muestra el punto (−4, 3). x = −4 (izquierda), y = 3 (arriba).",
              },
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "navigator",
            en: "The map shows the point <b>(−4, 3)</b>. The first number is <b>x</b> (left/right). The second is <b>y</b> (up/down). Which quadrant is it in?",
            es: "El punto (−4, 3): x es izquierda/derecha, y es arriba/abajo. ¿En qué cuadrante está?",
            vocab: [
              {
                term: "quadrant",
                en: "One of the four regions of the plane. I (right-up), II (left-up), III (left-down), IV (right-down).",
                es: "Una de las cuatro regiones del plano. I (derecha-arriba), II (izquierda-arriba), III (izquierda-abajo), IV (derecha-abajo).",
              },
            ],
          },
          hint: {
            en: "x = −4 means go <b>LEFT</b>. y = 3 means go <b>UP</b>. Left + Up is the top-left, which is <b>Quadrant II</b>.",
            es: "x = −4 es izquierda, y = 3 es arriba. Izquierda + arriba es la parte superior izquierda: Cuadrante II.",
          },
          frame: {
            en: "“The point (−4, 3) is in Quadrant ____ because x is ____ and y is ____.”",
            es: "“El punto (−4, 3) está en el Cuadrante ____ porque x es ____ y y es ____.”",
          },
          choices: [
            {
              en: "Quadrant I &nbsp;(right + up)",
              es: "Cuadrante I (derecha + arriba)",
              correct: false,
            },
            {
              en: "Quadrant II &nbsp;(left + up)",
              es: "Cuadrante II (izquierda + arriba)",
              correct: true,
            },
            {
              en: "Quadrant III &nbsp;(left + down)",
              es: "Cuadrante III (izquierda + abajo)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! x = −4 (left) and y = 3 (up) is the top-left, Quadrant II.",
          goodEs: "¡Sí! Izquierda y arriba es el Cuadrante II.",
          badEn:
            "❌ Not quite. x = −4 means LEFT and y = 3 means UP. Use the hint and try again.",
          badEs: "Casi. x = −4 es izquierda, y = 3 es arriba. Usa la pista.",
          solveBeat: {
            who: "navigator",
            en: "Got the quadrant! Now the clue says move from the center. Let me plot the next point.",
            es: "¡Tengo el cuadrante! Ahora debo moverme desde el centro y marcar el punto.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "navigator",
            en: "From the center (0, 0), the clue says go <b>3 right</b> and <b>2 down</b>. Which ordered pair is that?",
            es: "Desde (0,0): 3 a la derecha y 2 hacia abajo. ¿Cuál par ordenado es?",
          },
          hint: {
            en: "Right is <b>positive x</b>. Down is <b>negative y</b>. So x = 3 and y = −2.",
            es: "La derecha es x positiva. Abajo es y negativa. Entonces x = 3 y y = −2.",
          },
          frame: {
            en: "“Going 3 right and 2 down is the point ( ____ , ____ ).”",
            es: "“Ir 3 a la derecha y 2 abajo es el punto ( ____ , ____ ).”",
          },
          choices: [
            { en: "(−3, 2)", es: "(−3, 2)", correct: false },
            { en: "(3, −2)", es: "(3, −2)", correct: true },
            { en: "(2, −3)", es: "(2, −3)", correct: false },
          ],
          goodEn:
            "✅ Correct! 3 right is x = 3 and 2 down is y = −2, so (3, −2). Path plotted!",
          goodEs: "¡Correcto! 3 a la derecha y 2 abajo es (3, −2).",
          badEn:
            "❌ Check the order: x first (right = +3), y second (down = −2).",
          badEs:
            "Revisa el orden: x primero (derecha = +3), y después (abajo = −2).",
          solveBeat: {
            who: "navigator",
            en: "Path plotted! The map leads toward the cliffs over the sea.",
            es: "¡Camino marcado! El mapa lleva hacia los acantilados sobre el mar.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Above & Below",
      kicker: "Act 2 · Integers & Absolute Value",
      title: "Above & Below the Sea",
      advanceLabel: "Dive for the chest 🦈",
      steps: [
        {
          type: "beats",
          art: "depth-dive.png",
          alt: "Maya dives down past a cliff that shows sea level, with depths below and heights above",
          lastLabel: "Stop MARLOW ▶",
          beats: [
            {
              who: "navigator",
              en: "The path leads to a cliff over the sea. Some clues are ABOVE the water and some are BELOW it.",
              es: "El camino lleva a un acantilado. Algunas pistas están ARRIBA del agua y otras ABAJO.",
            },
            {
              who: "log",
              caption: true,
              en: "Use INTEGERS. Sea level is 0. Up is positive (+). Below the water is negative (−). Order them!",
              es: "Usa NÚMEROS ENTEROS. El nivel del mar es 0. Arriba es +, abajo es −.",
              vocab: [
                {
                  term: "integers",
                  en: "Whole numbers that can be positive, negative, or zero: … −2, −1, 0, 1, 2 …",
                  es: "Números enteros que pueden ser positivos, negativos o cero: … −2, −1, 0, 1, 2 …",
                },
              ],
            },
            {
              who: "marlow",
              misconception: true,
              en: "Easy! −8 is below −15, because 8 is smaller than 15. So I'll order them 0, −8, −15, 6, 12!",
              es: "¡Fácil! −8 está debajo de −15, porque 8 es menor que 15. ¡Los ordeno 0, −8, −15, 6, 12!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "marlow",
            en: "The clues are at these heights: <b>6 m</b> up, <b>−8 m</b> (below sea level), <b>0 m</b> (sea level), <b>12 m</b> up, and <b>−15 m</b> deep. Put them in order from <b>lowest to highest</b> — stop me if I'm wrong!",
            es: "Ordena de menor a mayor: 6, −8, 0, 12, −15.",
          },
          hint: {
            en: "On a number line, numbers get <b>bigger</b> to the right. Negative numbers are <b>below zero</b>. The most negative (deepest) is the smallest.",
            es: "En una recta numérica, los números crecen hacia la derecha. Los negativos están bajo cero. El más negativo (más profundo) es el menor.",
          },
          frame: {
            en: "“From lowest to highest the order is ____.”",
            es: "“De menor a mayor el orden es ____.”",
          },
          choices: [
            {
              en: "0, −8, −15, 6, 12",
              es: "0, −8, −15, 6, 12",
              correct: false,
            },
            {
              en: "−15, −8, 0, 6, 12",
              es: "−15, −8, 0, 6, 12",
              correct: true,
            },
            {
              en: "12, 6, 0, −8, −15",
              es: "12, 6, 0, −8, −15",
              correct: false,
            },
          ],
          goodEn:
            "✅ Perfect: −15, −8, 0, 6, 12. The deepest (−15) is smallest; the highest (12) is largest.",
          goodEs: "¡Perfecto! −15, −8, 0, 6, 12. Lo más profundo es lo menor.",
          badEn:
            "❌ Remember: more negative = deeper = smaller. Order from the deepest up.",
          badEs: "Recuerda: más negativo = más profundo = menor.",
          solveBeat: {
            who: "navigator",
            en: "Ordered them! Now I dive deep. I need to know how FAR below the surface I am — the absolute value.",
            es: "¡Listo! Ahora me sumerjo. Necesito saber qué tan LEJOS estoy: el valor absoluto.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "navigator",
            en: "I dive to <b>−20 m</b> (20 meters below sea level). How <b>far</b> am I from the surface (0)? This is the <b>absolute value</b>, written |−20|.",
            es: "¿Qué tan lejos de la superficie estás a −20 m? Eso es el valor absoluto |−20|.",
            vocab: [
              {
                term: "absolute value",
                en: "The distance of a number from 0. It is never negative. |−20| = 20.",
                es: "La distancia de un número desde 0. Nunca es negativa. |−20| = 20.",
              },
            ],
          },
          hint: {
            en: "Absolute value is the <b>distance</b> from 0. It is never negative. |−20| = 20.",
            es: "El valor absoluto es la distancia desde 0. Nunca es negativa. |−20| = 20.",
          },
          frame: {
            en: "“The diver at −20 m is ____ meters from the surface because |−20| = ____.”",
            es: "“El buzo a −20 m está a ____ metros de la superficie porque |−20| = ____.”",
          },
          choices: [
            {
              en: "−20 m &nbsp;(distance is never negative)",
              es: "−20 m (la distancia nunca es negativa)",
              correct: false,
            },
            {
              en: "20 m &nbsp;(|−20| = 20)",
              es: "20 m (|−20| = 20)",
              correct: true,
            },
            {
              en: "0 m &nbsp;(that is the surface)",
              es: "0 m (esa es la superficie)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right! |−20| = 20. She is 20 meters from the surface. Distance is always positive.",
          goodEs:
            "¡Correcto! |−20| = 20. Está a 20 metros. La distancia siempre es positiva.",
          badEn:
            "❌ Absolute value is a DISTANCE, so it is never negative. |−20| = 20.",
          badEs:
            "El valor absoluto es una distancia, nunca negativa. |−20| = 20.",
          solveBeat: {
            who: "navigator",
            en: "Twenty meters down! The treasure is close now. X marks the spot.",
            es: "¡Veinte metros abajo! El tesoro está cerca. La X marca el lugar.",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: The Treasure",
      kicker: "Final · Navigate to the Treasure",
      title: "X Marks the Spot",
      advanceLabel: "Dig up the treasure 🌟",
      steps: [
        {
          type: "beats",
          art: "final-nav.png",
          alt: "Maya stands at a glowing X on the map grid near a steep cliff edge",
          lastLabel: "Find the spot ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "The treasure is close! Use BOTH skills: find the quadrant of the spot AND how deep it is buried.",
              es: "¡El tesoro está cerca! Usa AMBAS destrezas: el cuadrante y la profundidad.",
            },
            {
              who: "navigator",
              en: "Coordinate plane AND absolute value. I'm ready. X marks the spot!",
              es: "Plano de coordenadas Y valor absoluto. ¡Estoy lista! ¡La X marca el lugar!",
            },
            {
              who: "marlow",
              misconception: true,
              en: "I'll start: −5 is way below the surface, so the distance must be −5 too, right?",
              es: "Yo empiezo: −5 está muy abajo, así que la distancia también es −5, ¿no?",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "navigator",
            en: "Careful, MARLOW. The treasure is at point <b>(−2, −5)</b>, buried <b>5 m below</b> sea level. Pick the line that is <b>fully correct</b>: the quadrant of the point AND the distance of −5 from the surface.",
            es: "Elige la línea correcta: el cuadrante de (−2, −5) y la distancia de −5 desde 0.",
          },
          hint: {
            en: "x = −2 (left) and y = −5 (down) → bottom-left = <b>Quadrant III</b>. And |−5| = 5.",
            es: "x = −2 (izquierda) y y = −5 (abajo) → abajo a la izquierda = Cuadrante III. Y |−5| = 5.",
          },
          frame: {
            en: "“The point (−2, −5) is in Quadrant ____. The chest is ____ meters from the surface because |−5| = ____.”",
            es: "“El punto (−2, −5) está en el Cuadrante ____. El cofre está a ____ metros de la superficie porque |−5| = ____.”",
          },
          choices: [
            {
              en: "Quadrant II, &nbsp; |−5| = −5",
              es: "Cuadrante II, |−5| = −5",
              correct: false,
            },
            {
              en: "Quadrant III, &nbsp; |−5| = 5",
              es: "Cuadrante III, |−5| = 5",
              correct: true,
            },
            {
              en: "Quadrant III, &nbsp; |−5| = −5",
              es: "Cuadrante III, |−5| = −5",
              correct: false,
            },
          ],
          goodEn:
            "✅ X MARKS THE SPOT! (−2, −5) is Quadrant III (left + down), and |−5| = 5 meters deep. Dig!",
          goodEs:
            "¡La X marca el lugar! (−2, −5) es Cuadrante III y |−5| = 5 m. ¡A cavar!",
          badEn:
            "❌ One part is wrong. Left + down is Quadrant III, and absolute value is never negative: |−5| = 5.",
          badEs:
            "Una parte está mal. Izquierda y abajo = Cuadrante III, y |−5| = 5.",
          solveBeat: {
            who: "navigator",
            en: "The chest! We did it, MARLOW — even with your wild guesses. The gold is ours!",
            es: "¡El cofre! Lo logramos, MARLOW. ¡El oro es nuestro!",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "🌐",
      en: "Coordinate plane",
      es: "plano de coordenadas",
      def: "A flat grid made by a horizontal x-axis and a vertical y-axis crossing at 0.",
    },
    {
      ico: "📍",
      en: "Ordered pair",
      es: "par ordenado",
      def: "Two numbers (x, y) that name one point. x first (left/right), y second (up/down).",
    },
    {
      ico: "➕",
      en: "x-axis / y-axis",
      es: "eje x / eje y",
      def: "The x-axis goes left-right. The y-axis goes up-down. They cross at the origin (0, 0).",
    },
    {
      ico: "🧭",
      en: "Quadrant",
      es: "cuadrante",
      def: "One of the four regions of the plane. I (right-up), II (left-up), III (left-down), IV (right-down).",
    },
    {
      ico: "🎯",
      en: "Origin",
      es: "origen",
      def: "The center point (0, 0) where the two axes cross.",
    },
    {
      ico: "🌏",
      en: "Integer",
      es: "número entero",
      def: "A whole number that can be positive, negative, or zero: … −2, −1, 0, 1, 2 …",
    },
    {
      ico: "➖",
      en: "Negative number",
      es: "número negativo",
      def: "A number less than 0, like −8. It can mean below sea level or below zero.",
    },
    {
      ico: "📏",
      en: "Absolute value",
      es: "valor absoluto",
      def: "The distance of a number from 0. It is never negative. |−20| = 20.",
    },
    {
      ico: "⚖️",
      en: "Compare / order",
      es: "comparar / ordenar",
      def: "To say which integer is bigger or smaller. On a number line, right is bigger.",
    },
  ],

  complete: {
    art: "treasure-found.png",
    alt: "Maya opens a glowing treasure chest full of gold on the beach at sunset",
    badge: "🎉💰⭐",
    titleEn: "Treasure Found!",
    en: "You did it, Navigator! You used the <b>coordinate plane</b> to plot the path and <b>integers</b> and <b>absolute value</b> to find how deep the chest was buried. The gold is yours. Amazing navigating!",
    es: "¡Lo lograste! Usaste el plano de coordenadas y los números enteros para encontrar el tesoro. ¡Excelente!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Deep dive elevation: What is the <strong>absolute value</strong> of <strong>−15</strong>?",
      promptEs: "¿Cuál es el valor absoluto de −15?",
      choices: [
        {
          en: "A) 0 &nbsp;(absolute value is never zero unless value is zero)",
          correct: false,
        },
        {
          en: "B) 15 &nbsp;(represents distance from 0, always positive) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) −15 &nbsp;(absolute value cannot be negative)",
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
