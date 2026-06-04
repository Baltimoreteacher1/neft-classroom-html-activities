/* STORY · Unit 8 · Graphic Novel #1 (Support) · Court Vision: The Data Analyst
   Full novel on the comic engine. Two acts (The Big Question, Center of the
   Game) + Final Call, Glossary, Mission Complete + Master-Rank challenge.
   All math, data sets, answers, distractors, Spanish, sentence frames, and
   glossary are carried verbatim from graphic-novels/unit8/graphic-novel-1.html
   (6.SP.1). New: panels, speech, STATS-voices-the-misconception (mean vs.
   median / ignores spread), vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 8,
    version: 1,
    level: "Support",
    title: "Court Vision: The Data Analyst",
    standard: "6.SP.1",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U8 #1: Court Vision: The Data Analyst",
    artBase: "../_art/unit8/",
    home: "../index.html",
  },

  cast: {
    analyst: {
      name: "The Analyst",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "📊",
      avatar: null,
      blurb: "You",
    },
    stats: {
      name: "STATS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Courtside stats bot · reaches for the mean every time",
    },
    coach: { name: "Coach", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young sports data analyst stands in an arena data room surrounded by glowing holographic basketball stats",
    blurbEn:
      "You are the team's new <b>data analyst</b>! The coach needs your help. Read the <b>data</b>, find the <b>mean, median, and mode</b>, and make the right call to win the game! STATS, the courtside bot, will help… but it reaches for the mean every time, even when the median tells the truth.",
    blurbEs:
      "Eres la analista de datos del equipo. Lee los datos y haz la jugada correcta para ganar el partido.",
    startLabel: "Start the Game 🏀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Big Question",
      kicker: "Act 1 · Statistical Questions & Data",
      title: "The Big Question",
      advanceLabel: "Bring the data to Coach 🏀",
      steps: [
        {
          type: "beats",
          art: "data-room.png",
          alt: "Maya sits at a glowing analyst desk studying holographic player statistics",
          lastLabel: "Pick the question ▶",
          beats: [
            {
              who: "coach",
              caption: true,
              en: "Analyst! Big game tonight. I need you to study our data and help me make smart calls.",
              es: "¡Analista! Gran partido hoy. Necesito que estudies los datos y me ayudes a decidir.",
            },
            {
              who: "coach",
              caption: true,
              en: "The whole team is counting on these numbers. If we read the data wrong, we lose the game.",
              es: "Todo el equipo cuenta con estos números. Si leemos mal los datos, perdemos el partido.",
            },
            {
              who: "analyst",
              en: "On it, Coach! First I need a STATISTICAL question — one with many answers I can collect as data.",
              es: "¡Voy! Primero necesito una pregunta estadística: una con muchas respuestas que pueda recolectar.",
              vocab: [
                {
                  term: "STATISTICAL question",
                  en: "A question that has many different answers you collect as data. Example: How many points does Jordan score each game?",
                  es: "Una pregunta que tiene muchas respuestas diferentes que recolectas como datos. Ejemplo: ¿Cuántos puntos anota Jordan cada juego?",
                },
              ],
            },
            {
              who: "stats",
              misconception: true,
              en: "Easy — just ask how many points Jordan scored last night. One number, one answer. Done!",
              es: "Fácil: solo pregunta cuántos puntos anotó Jordan anoche. Un número, una respuesta. ¡Listo!",
            },
          ],
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.beat1",
          ask: {
            who: "coach",
            en: "Why does Coach need the Analyst to study the data tonight?",
            es: "¿Por qué necesita Coach que la Analista estudie los datos esta noche?",
          },
          choices: [
            {
              en: "To help the team make smart calls and win the big game.",
              es: "Para ayudar al equipo a tomar buenas decisiones y ganar el gran partido.",
              correct: true,
            },
            {
              en: "To clean the holographic desk in the data room.",
              es: "Para limpiar el escritorio holográfico de la sala de datos.",
              correct: false,
            },
            {
              en: "To teach STATS how to play basketball.",
              es: "Para enseñarle a STATS a jugar baloncesto.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "coach",
            en: "Good thinking. A <b>statistical question</b> has <b>many different answers</b> you collect as data. Which question is statistical?",
            es: "Buena idea. Una pregunta estadística tiene muchas respuestas diferentes. ¿Cuál lo es?",
          },
          hint: {
            en: "If everyone would give the same one answer, it is NOT statistical. If answers vary (change from game to game), it IS statistical.",
            es: "Si todos darían la misma respuesta, NO es estadística. Si las respuestas varían (cambian de juego a juego), SÍ lo es.",
          },
          frame: {
            en: "“A statistical question is statistical because the answers ____ (vary / stay the same).”",
            es: "“Una pregunta estadística lo es porque las respuestas ____ (varían / quedan iguales).”",
          },
          choices: [
            {
              en: 'How many points did Jordan score last night? <span class="calc">(only one answer)</span>',
              es: "¿Cuántos puntos anotó Jordan anoche? (solo una respuesta)",
              correct: false,
            },
            {
              en: 'How many points does Jordan score each game this season? <span class="calc">(many answers → data!)</span>',
              es: "¿Cuántos puntos anota Jordan cada juego esta temporada? (muchas respuestas → ¡datos!)",
              correct: true,
            },
            {
              en: 'How tall is the team\'s tallest player? <span class="calc">(only one answer)</span>',
              es: "¿Qué altura tiene el jugador más alto del equipo? (solo una respuesta)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! “How many points each game” gives many answers — that is a statistical question.",
          goodEs: "¡Sí! Esa pregunta tiene muchas respuestas: es estadística.",
          badEn:
            "❌ That question has only ONE answer. A statistical question must have answers that vary. Try again.",
          badEs:
            "Esa pregunta tiene solo UNA respuesta. Una pregunta estadística varía. Intenta otra vez.",
          solveBeat: {
            who: "analyst",
            en: "Statistical question, locked in! Now let me READ Jordan's points data table carefully.",
            es: "¡Pregunta estadística lista! Ahora voy a leer la tabla de puntos de Jordan con cuidado.",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "coach",
            en: "In the story, what makes a question a <b>statistical</b> question?",
            es: "En la historia, ¿qué hace que una pregunta sea <b>estadística</b>?",
          },
          hint: {
            en: "Think about why “points each game” worked but “points last night” did not.",
            es: "Piensa por qué “puntos cada juego” sirvió pero “puntos anoche” no.",
          },
          choices: [
            {
              en: "It has many different answers you collect as data.",
              es: "Tiene muchas respuestas diferentes que recolectas como datos.",
              correct: true,
            },
            {
              en: "It always has exactly one correct answer.",
              es: "Siempre tiene exactamente una respuesta correcta.",
              correct: false,
            },
            {
              en: "It is the hardest question on the data table.",
              es: "Es la pregunta más difícil de la tabla de datos.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          art: "data-room.png",
          alt: "A holographic table of Jordan's points per game glows on the analyst desk",
          ask: {
            who: "analyst",
            en: "Here is Jordan's points data for 5 games — <b>8, 12, 10, 6, 14</b>. Read the table. How many points did Jordan score in <b>Game 3</b>?",
            es: "Lee la tabla. ¿Cuántos puntos anotó en el Juego 3?",
            vocab: [
              {
                term: "data",
                en: "The facts or numbers you collect to answer a question. Example: 8, 12, 10, 6, 14 points.",
                es: "Los hechos o números que recolectas para responder una pregunta. Ejemplo: 8, 12, 10, 6, 14 puntos.",
              },
            ],
          },
          hint: {
            en: "Find the column labeled Game 3, then look at the Points row right below it: Game 1=8, Game 2=12, Game 3=10, Game 4=6, Game 5=14.",
            es: "Busca la columna del Juego 3 y la fila de Puntos justo debajo: Juego 1=8, Juego 2=12, Juego 3=10, Juego 4=6, Juego 5=14.",
          },
          frame: {
            en: "“In Game 3, Jordan scored ____ points.”",
            es: "“En el Juego 3, Jordan anotó ____ puntos.”",
          },
          choices: [
            { en: "8 points", es: "8 puntos", correct: false },
            { en: "10 points", es: "10 puntos", correct: true },
            { en: "14 points", es: "14 puntos", correct: false },
          ],
          goodEn:
            "✅ Correct! Game 3 shows 10 points. You read the data table perfectly!",
          goodEs:
            "¡Correcto! El Juego 3 muestra 10 puntos. ¡Leíste bien la tabla!",
          badEn:
            "❌ Look again — find the Game 3 column, then the Points row. Use the hint.",
          badEs:
            "Mira otra vez: busca la columna del Juego 3 y la fila de Puntos. Usa la pista.",
          solveBeat: {
            who: "analyst",
            en: "Data read and ready. Time to bring these numbers to Coach!",
            es: "Datos leídos y listos. ¡Hora de llevar estos números al Coach!",
          },
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
            who: "coach",
            en: "Tap the line that shows STATS reaching for the <b>wrong</b> kind of question.",
            es: "Toca la línea que muestra a STATS eligiendo el tipo de pregunta <b>equivocado</b>.",
          },
          choices: [
            {
              en: "“Just ask how many points Jordan scored last night. One number, one answer.”",
              es: "“Solo pregunta cuántos puntos anotó Jordan anoche. Un número, una respuesta.”",
              correct: true,
            },
            {
              en: "“First I need a STATISTICAL question — one with many answers.”",
              es: "“Primero necesito una pregunta estadística: una con muchas respuestas.”",
              correct: false,
            },
            {
              en: "“Time to bring these numbers to Coach!”",
              es: "“¡Hora de llevar estos números al Coach!”",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Center of the Game",
      kicker: "Act 2 · Mean, Median & Mode",
      title: "Center of the Game",
      advanceLabel: "Report the stats ⚡",
      steps: [
        {
          type: "beats",
          art: "mean-median.png",
          alt: "Maya points at a holographic display showing numbers balancing to find a center",
          lastLabel: "Find the mean ▶",
          beats: [
            {
              who: "coach",
              caption: true,
              en: "Great data! Now find the CENTER of Jordan's scores. Start with the mean — the average.",
              es: "¡Buenos datos! Ahora encuentra el centro. Empieza con la media: el promedio.",
            },
            {
              who: "coach",
              caption: true,
              en: "One number can sum up five games — that's what the center does. It tells us a player's typical score.",
              es: "Un solo número puede resumir cinco juegos: eso hace el centro. Nos dice el puntaje típico de un jugador.",
            },
            {
              who: "analyst",
              en: "Mean, median, and mode all describe the center. I'll compute each one step by step.",
              es: "La media, la mediana y la moda describen el centro. Calcularé cada una paso a paso.",
              vocab: [
                {
                  term: "mean",
                  en: "Add all the values, then divide by how many there are. Mean of 8,12,10,6,14 is 50 ÷ 5 = 10.",
                  es: "Suma todos los valores y divide entre cuántos hay. La media de 8,12,10,6,14 es 50 ÷ 5 = 10.",
                },
              ],
            },
            {
              who: "stats",
              misconception: true,
              en: "Why bother with median or mode? The mean is the only center anyone needs. Just average it!",
              es: "¿Para qué la mediana o la moda? La media es el único centro que se necesita. ¡Solo promédialo!",
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
            who: "coach",
            en: "What is this chapter mainly about?",
            es: "¿De qué trata principalmente este capítulo?",
          },
          choices: [
            {
              en: "Finding the center of the data using the mean, median, and mode.",
              es: "Encontrar el centro de los datos usando la media, la mediana y la moda.",
              correct: true,
            },
            {
              en: "Choosing which player gets the newest jersey.",
              es: "Elegir qué jugador recibe la camiseta más nueva.",
              correct: false,
            },
            {
              en: "Writing a statistical question for the first time.",
              es: "Escribir una pregunta estadística por primera vez.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "coach",
            en: "Jordan's points were <b>8, 12, 10, 6, 14</b>. The <b>mean</b> is the average: add them all, then divide by how many games. What is the mean?",
            es: "La media: suma todos los puntos y divide entre el número de juegos.",
          },
          hint: {
            en: "8 + 12 + 10 + 6 + 14 = 50. There are 5 games. Now do 50 ÷ 5.",
            es: "8 + 12 + 10 + 6 + 14 = 50. Hay 5 juegos. Ahora haz 50 ÷ 5.",
          },
          frame: {
            en: "“The mean is ____.”",
            es: "“La media es ____.”",
          },
          choices: [
            {
              en: '50 <span class="calc">(that is the total, not the mean)</span>',
              es: "50 (ese es el total, no la media)",
              correct: false,
            },
            {
              en: '10 <span class="calc">(50 ÷ 5 = 10)</span>',
              es: "10 (50 ÷ 5 = 10)",
              correct: true,
            },
            {
              en: '5 <span class="calc">(that is the number of games)</span>',
              es: "5 (ese es el número de juegos)",
              correct: false,
            },
          ],
          goodEn: "✅ The mean is 10! 8+12+10+6+14 = 50, and 50 ÷ 5 = 10.",
          goodEs: "¡La media es 10! 50 ÷ 5 = 10.",
          badEn:
            "❌ Not quite. Add to get 50, then divide by 5 games. Check the hint.",
          badEs: "Casi. Suma 50 y divide entre 5 juegos. Usa la pista.",
          solveBeat: {
            who: "analyst",
            en: "Mean done! Next is the MEDIAN — I put the numbers in order and find the middle one.",
            es: "¡Media lista! Ahora la mediana: pongo los números en orden y busco el del medio.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "analyst",
            en: "Put the points in order from least to greatest: <b>6, 8, 10, 12, 14</b>. The <b>median</b> is the <b>middle</b> number. What is the median?",
            es: "La mediana es el número del medio cuando están en orden.",
            vocab: [
              {
                term: "median",
                en: "The middle value when the numbers are in order from least to greatest. Median of 6,8,10,12,14 is 10.",
                es: "El valor del medio cuando los números están en orden de menor a mayor. La mediana de 6,8,10,12,14 es 10.",
              },
            ],
          },
          hint: {
            en: "With 5 numbers in order, the middle one is the 3rd number: 6, 8, 10, 12, 14.",
            es: "Con 5 números en orden, el del medio es el 3.º: 6, 8, 10, 12, 14.",
          },
          frame: {
            en: "“The median (middle) is ____.”",
            es: "“La mediana (del medio) es ____.”",
          },
          choices: [
            {
              en: '6 <span class="calc">(that is the smallest)</span>',
              es: "6 (ese es el más pequeño)",
              correct: false,
            },
            {
              en: '14 <span class="calc">(that is the largest)</span>',
              es: "14 (ese es el más grande)",
              correct: false,
            },
            {
              en: '10 <span class="calc">(the middle number)</span>',
              es: "10 (el número del medio)",
              correct: true,
            },
          ],
          goodEn: "✅ The median is 10 — the middle of 6, 8, 10, 12, 14.",
          goodEs:
            "¡La mediana es 10! Es el número del medio: 6, 8, 10, 12, 14.",
          badEn:
            "❌ The median is the MIDDLE number when in order. The middle of 5 numbers is the 3rd. Try again.",
          badEs:
            "La mediana es el número del MEDIO. En 5 números es el 3.º. Intenta otra vez.",
          solveBeat: {
            who: "analyst",
            en: "Median found! Last is the MODE — the number that shows up the most often.",
            es: "¡Mediana lista! Por último, la moda: el número que aparece más veces.",
          },
        },
        {
          type: "challenge",
          id: "2c",
          ask: {
            who: "analyst",
            en: "In a new game series, I wrote the assists: <b>7, 7, 9, 4, 7</b>. The <b>mode</b> is the number that appears <b>most often</b>. What is the mode?",
            es: "La moda es el número que aparece más veces.",
            vocab: [
              {
                term: "mode",
                en: "The value that appears the most often. Mode of 7,7,9,4,7 is 7.",
                es: "El valor que aparece con más frecuencia. La moda de 7,7,9,4,7 es 7.",
              },
            ],
          },
          hint: {
            en: "Count each number. 7 appears three times. Every other number appears once.",
            es: "Cuenta cada número. El 7 aparece tres veces. Los demás aparecen una vez.",
          },
          frame: {
            en: "“The mode (most often) is ____.”",
            es: "“La moda (la que más aparece) es ____.”",
          },
          choices: [
            {
              en: '4 <span class="calc">(appears only once)</span>',
              es: "4 (aparece solo una vez)",
              correct: false,
            },
            {
              en: '7 <span class="calc">(appears 3 times — the most)</span>',
              es: "7 (aparece 3 veces — la mayoría)",
              correct: true,
            },
            {
              en: '9 <span class="calc">(appears only once)</span>',
              es: "9 (aparece solo una vez)",
              correct: false,
            },
          ],
          goodEn:
            "✅ The mode is 7 — it appears 3 times, more than any other number. Stats complete!",
          goodEs: "¡La moda es 7! Aparece 3 veces, más que las demás.",
          badEn:
            "❌ The mode appears MOST often. Count how many times each number shows up. Try again.",
          badEs:
            "La moda aparece MÁS veces. Cuenta cada número. Intenta otra vez.",
          solveBeat: {
            who: "analyst",
            en: "Mean, median, and mode all reported. Now for the game-winning call!",
            es: "Media, mediana y moda reportadas. ¡Ahora la jugada que gana el partido!",
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
            who: "coach",
            en: "Put the steps the Analyst followed to describe the center in order.",
            es: "Ordena los pasos que siguió la Analista para describir el centro.",
          },
          items: [
            {
              en: "Add up the scores and divide to find the mean.",
              es: "Suma los puntajes y divide para hallar la media.",
              order: 1,
            },
            {
              en: "Put the scores in order and find the middle one — the median.",
              es: "Ordena los puntajes y halla el del medio: la mediana.",
              order: 2,
            },
            {
              en: "Count which value appears most often — the mode.",
              es: "Cuenta qué valor aparece más veces: la moda.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Call",
      kicker: "Final Call · Boss",
      title: "The Game-Winning Decision",
      advanceLabel: "Make the call 🌟",
      steps: [
        {
          type: "beats",
          art: "final-analysis.png",
          alt: "Maya stands before a giant wall of holographic data making a big decision",
          lastLabel: "Make the call ▶",
          beats: [
            {
              who: "coach",
              caption: true,
              en: "It's the final play. I need our most RELIABLE scorer. Use the stats to decide!",
              es: "Es la jugada final. Necesito al anotador más confiable. ¡Usa las estadísticas!",
            },
            {
              who: "coach",
              caption: true,
              en: "There's only one shot left on the clock. Pick the wrong player and the season ends right here.",
              es: "Solo queda un tiro en el reloj. Si eliges al jugador equivocado, la temporada termina aquí.",
            },
            {
              who: "analyst",
              en: "I'll use the mean AND the mode together. If both point to the same number, that player is steady.",
              es: "Usaré la media Y la moda juntas. Si ambas apuntan al mismo número, ese jugador es estable.",
            },
            {
              who: "stats",
              misconception: true,
              en: "Maya's last 5 shots: 5, 5, 5, 7, 3. The mean is 25 — that's a huge number, pick her!",
              es: "Los últimos 5 tiros de Maya: 5, 5, 5, 7, 3. La media es 25, ¡un número enorme, elígela!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "analyst",
            en: "Careful, STATS — 25 is the total, not the mean. Coach asks for the <b>most reliable</b> scorer. Maya's last 5 shots scored: <b>5, 5, 5, 7, 3</b>. What are the <b>mean</b> and the <b>mode</b> of her shots?",
            es: "Encuentra la media Y la moda. Elige la línea correcta.",
          },
          hint: {
            en: "Sum = 5+5+5+7+3 = 25, and 25 ÷ 5 = mean. The number that repeats most is the mode.",
            es: "Suma = 5+5+5+7+3 = 25, y 25 ÷ 5 = media. El número que más se repite es la moda.",
          },
          frame: {
            en: "“The mean is ____. The mode is ____. So Maya is a reliable scorer because her scores stay near ____.”",
            es: "“La media es ____. La moda es ____. Maya es confiable porque sus tiros se mantienen cerca de ____.”",
          },
          choices: [
            {
              en: 'Mean = 25, Mode = 5 <span class="calc">(25 is the total, not the mean)</span>',
              es: "Media = 25, Moda = 5 (25 es el total, no la media)",
              correct: false,
            },
            {
              en: 'Mean = 5, Mode = 5 <span class="calc">(25 ÷ 5 = 5; 5 repeats most)</span>',
              es: "Media = 5, Moda = 5 (25 ÷ 5 = 5; el 5 se repite más)",
              correct: true,
            },
            {
              en: 'Mean = 5, Mode = 7 <span class="calc">(7 appears only once)</span>',
              es: "Media = 5, Moda = 7 (el 7 aparece solo una vez)",
              correct: false,
            },
          ],
          goodEn:
            "✅ PERFECT CALL! Mean = 25 ÷ 5 = 5, and 5 is the mode (it repeats most). Maya is the reliable scorer!",
          goodEs:
            "¡JUGADA PERFECTA! Media = 5 y moda = 5. ¡Maya es la anotadora confiable!",
          badEn:
            "❌ One part is off. Mean = total 25 ÷ 5 = 5 (not 25). The mode is the value that repeats most (5).",
          badEs: "Una parte está mal. Media = 25 ÷ 5 = 5. La moda es 5.",
          solveBeat: {
            who: "analyst",
            en: "That's the call, Coach! The data says Maya — give her the ball!",
            es: "¡Esa es la jugada, Coach! Los datos dicen Maya: ¡denle el balón!",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "act2.beat1",
          ask: {
            who: "coach",
            en: "STATS keeps reaching for the mean and ignoring the median and mode. What can you tell about how STATS works?",
            es: "STATS siempre busca la media e ignora la mediana y la moda. ¿Qué puedes deducir sobre cómo trabaja STATS?",
          },
          hint: {
            en: "Look back: every time, STATS jumps to the average instead of checking the other centers.",
            es: "Mira atrás: cada vez, STATS salta al promedio en lugar de revisar los otros centros.",
          },
          choices: [
            {
              en: "STATS trusts only the mean, so it misses what the median and mode reveal.",
              es: "STATS confía solo en la media, así que se pierde lo que muestran la mediana y la moda.",
              correct: true,
            },
            {
              en: "STATS does not know how to add numbers at all.",
              es: "STATS no sabe sumar números en absoluto.",
              correct: false,
            },
            {
              en: "STATS wants the team to lose the game on purpose.",
              es: "STATS quiere que el equipo pierda el partido a propósito.",
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
            who: "coach",
            en: "The call is made and Maya gets the ball. What will most likely happen next?",
            es: "La jugada está hecha y Maya recibe el balón. ¿Qué pasará probablemente después?",
          },
          choices: [
            {
              en: "Maya takes the reliable shot the data pointed to, finishing the game.",
              es: "Maya hace el tiro confiable que indicaron los datos y termina el partido.",
              correct: true,
            },
            {
              en: "The Analyst starts the data report over from the beginning.",
              es: "La Analista empieza el reporte de datos otra vez desde el principio.",
              correct: false,
            },
            {
              en: "Coach throws away all of tonight's statistics.",
              es: "Coach tira a la basura todas las estadísticas de esta noche.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "❓",
      en: "Statistical question",
      es: "pregunta estadística",
      def: "A question that has many different answers you collect as data. Example: How many points does Jordan score each game?",
    },
    {
      ico: "📊",
      en: "Data",
      es: "datos",
      def: "The facts or numbers you collect to answer a question. Example: 8, 12, 10, 6, 14 points.",
    },
    {
      ico: "🔢",
      en: "Data set",
      es: "conjunto de datos",
      def: "A whole group of data values collected together, often shown in a table or list.",
    },
    {
      ico: "⚖️",
      en: "Mean (average)",
      es: "media (promedio)",
      def: "Add all the values, then divide by how many there are. Mean of 8,12,10,6,14 is 50 ÷ 5 = 10.",
    },
    {
      ico: "✋",
      en: "Median",
      es: "mediana",
      def: "The middle value when the numbers are in order from least to greatest. Median of 6,8,10,12,14 is 10.",
    },
    {
      ico: "🔥",
      en: "Mode",
      es: "moda",
      def: "The value that appears the most often. Mode of 7,7,9,4,7 is 7.",
    },
    {
      ico: "📏",
      en: "Order (least to greatest)",
      es: "ordenar de menor a mayor",
      def: "Lining up numbers from smallest to biggest. This helps you find the median.",
    },
    {
      ico: "➕",
      en: "Sum (total)",
      es: "suma (total)",
      def: "The answer when you add numbers together. The sum of 8+12+10+6+14 is 50.",
    },
    {
      ico: "➖",
      en: "Divide",
      es: "dividir",
      def: "To split a total into equal groups. To find the mean you divide the sum by the count.",
    },
  ],

  complete: {
    art: "celebrate.png",
    alt: "Maya celebrates on the court with the winning team holding her tablet high",
    badge: "🎉🏀⭐",
    titleEn: "Game Won!",
    en: "You did it, Analyst! You found the <b>statistical question</b>, read the <b>data</b>, and used the <b>mean, median, and mode</b> to make the game-winning call. The team is celebrating — thanks to you!",
    es: "¡Lo lograste! Usaste la media, la mediana y la moda para ganar. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Data statistics: Jordan's game scores are <strong>3, 5, 7, 8, 12</strong>. Find the <strong>median</strong> of this data set.",
      promptEs:
        "Los puntajes de Jordan son 3, 5, 7, 8, 12. Encuentra la mediana.",
      choices: [
        {
          en: "A) 8 &nbsp;(confused median with mode or upper values)",
          correct: false,
        },
        {
          en: "B) 7 &nbsp;(the middle value of the ordered set) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 9 &nbsp;(calculated the range or standard spread)",
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
