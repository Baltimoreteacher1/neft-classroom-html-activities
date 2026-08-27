/**
 * small-group-challenge-tasks.mjs — authored challenge mathematics.
 *
 * WHY THIS FILE EXISTS
 *
 * buildGroup2() in tools/generate-small-group-lessons.mjs assembles a challenge
 * lesson's practice by re-serving the CORE lesson's item pool:
 *
 *   uniquePractice(p.onLevel, p.extending, p.optional, p.approaching).slice(0, 12)
 *
 * Those items are correct — they are core-level items, doing their job. But a
 * challenge group is made of students who have already mastered the core target,
 * so re-serving core items means the extension is "the same questions again",
 * and where the core pool leans computational the challenge lesson inherits
 * arithmetic as its idea of depth. The audit found 24 of 84 challenge lessons
 * below the demand bar for exactly this reason.
 *
 * The generic "Prove It" routine (engine/core/small-group-innovation.js) wraps a
 * justification ritual around whatever problem is on screen — model it / explain
 * it / test it / teach it, identical for every lesson. That is a good routine,
 * but it cannot supply mathematics the item does not contain.
 *
 * So challenge depth has to be AUTHORED, per lesson, against that lesson's
 * objective. That is what this file holds.
 *
 * CONTRACT
 *
 *   drop  — stem fragments (case-insensitive) identifying inherited core items
 *           this lesson should not spend a challenge group's time on. Matching
 *           is on the fragment, so an item reworded later stops matching and
 *           reappears rather than silently vanishing — a validator catches that
 *           (see tools/validate-challenge-tasks.mjs) instead of the lesson
 *           quietly losing an item.
 *   add   — authored items, appended in order. Full EN + ES: the small-group
 *           fleet is 100% bilingual and validate:es-parity enforces it.
 *
 * AUTHORING STANDARD (every task here has been through it)
 *
 *   1. Read the canonical core lesson and confirm objective + standard.
 *   2. Read the existing challenge lesson in full.
 *   3. Name what students already know.
 *   4. Name the actual weakness.
 *   5. Choose the SMALLEST meaningful increase in demand.
 *   6. Author it, solve it, and verify every claimed answer, example,
 *      counterexample and generalization.
 *   7. Confirm it deepens THIS lesson's mathematics rather than jumping to a
 *      later lesson's content.
 *
 * Task forms are chosen because the mathematics calls for them, never to spread
 * variety across the fleet.
 */

export const CHALLENGE_TASKS = {
  // -------------------------------------------------------------------------
  // 9-1 · 6.AT.11 — independent vs dependent variables
  //
  // Core objective: "I can recognize when two quantities change together, and
  // identify which one is the independent variable and which is the dependent
  // variable."
  //
  // Already known: these students identify the roles reliably.
  //
  // The weakness: all 12 inherited items were multiple-choice identification.
  // Three (the gym rate, the plant table, the cheese total) were pure
  // arithmetic — challenge as bigger numbers, which is the one thing extension
  // must not be. Worst, one item read "Give an example where the SAME quantity
  // can be independent in one problem and dependent in another" and then handed
  // the student four options: the act of CREATING an example had been converted
  // into recognising one.
  //
  // The deepening: keep the discrimination items (they are good), drop the
  // arithmetic, and make students interrogate the RULE that assigns the roles —
  // which is the actual mathematics of 6.AT.11 — by critiquing a plausible wrong
  // rule, testing a claim about the roles, constructing both roles for one
  // quantity, and running the relationship backwards from a dependency sentence.
  // All four stay inside 6.AT.11; none reaches forward to graphing (9-2) or to
  // writing equations.
  // -------------------------------------------------------------------------
  "9-2-group2": {
    facilitation: {
      ask: "What does that point claim, in words, about tickets and dollars?",
      lookFor:
        "A student who reads a point as a PAIR of quantities — “4 tickets cost $100” — rather than as two numbers.",
      ifStuck:
        "Point at one plotted point and ask what its two numbers stand for. Then ask what swapping them would say.",
      extend:
        "Ask what a graph would look like if the price per ticket changed halfway through, and why.",
    },
    drop: [
      "A table pairs hours with kilometers", // rate-table lookup
      "Using the ticket table, what are the coordinates of the point for", // recall of the iDo
      "Nakai's savings account has a principal of $750", // pure interest computation
      "Football tickets cost $45 each. What is the total cost of 3 tickets", // the iDo's own number
      "Which ordered pair belongs on the ticket graph for 2 tickets", // the iDo's own pair
    ],
    add: [
      {
        // ERROR ANALYSIS — the reversed pair, which every identification item in
        // the lesson would let a student keep believing.
        type: "open-response",
        stem: "The ticket graph has “Number of tickets” across the bottom and “Total cost ($)” up the side. Rowan plots the first ticket as the point (45, 1). What did Rowan misunderstand — and what does his point actually claim about tickets and money?",
        stemEs:
          "La gráfica de boletos tiene “Número de boletos” en la parte de abajo y “Costo total ($)” en el lado. Rowan grafica el primer boleto como el punto (45, 1). ¿Qué entendió mal Rowan y qué afirma en realidad su punto sobre los boletos y el dinero?",
        modelAnswer:
          "Rowan swapped the order. The independent variable goes first, so one ticket at $45 is the point (1, 45). His point (45, 1) says that 45 tickets cost one dollar altogether, which is not what the table shows.",
        modelAnswerEs:
          "Rowan invirtió el orden. La variable independiente va primero, así que un boleto de $45 es el punto (1, 45). Su punto (45, 1) dice que 45 boletos cuestan un dólar en total, que no es lo que muestra la tabla.",
        sentenceStems: [
          "Rowan put ___ first instead of ___ .",
          "His point (45, 1) claims that ___ .",
          "The correct point is ___ because ___ .",
        ],
      },
      {
        // STEEPNESS AS RATE — read the graph instead of computing points.
        type: "multiple-choice",
        stem: "Two trams both start at the bottom at 0 minutes. One climbs 1,200 feet each minute, the other 900. Both are graphed on the same axes with minutes across. Without working out a single point, how can you tell which line belongs to the faster tram?",
        stemEs:
          "Dos tranvías arrancan abajo a los 0 minutos. Uno sube 1,200 pies por minuto y el otro 900. Ambos se grafican en los mismos ejes con los minutos en el eje horizontal. Sin calcular ni un punto, ¿cómo sabes cuál recta es la del tranvía más rápido?",
        choices: [
          "Its line rises more steeply — it gains more feet in the same minute",
          "Its line starts higher up the vertical axis",
          "Its line is longer than the other one",
          "You cannot tell without plotting points for both",
        ],
        choicesEs: [
          "Su recta sube más empinada: gana más pies en el mismo minuto",
          "Su recta empieza más arriba en el eje vertical",
          "Su recta es más larga que la otra",
          "No se puede saber sin graficar puntos de las dos",
        ],
        correctIndex: 0,
        explanation:
          "Both trams start at 0 feet at 0 minutes, so both lines begin at the same corner. The only thing that can differ is how fast they climb, and that is the steepness: 1,200 feet in one minute against 900.",
        explanationEs:
          "Los dos tranvías empiezan en 0 pies a los 0 minutos, así que las dos rectas parten de la misma esquina. Lo único que puede diferir es qué tan rápido suben, y eso es lo empinado: 1,200 pies en un minuto frente a 900.",
        choiceFeedback: [
          "",
          "Both start at 0 feet at 0 minutes. Where do the two lines begin?",
          "Length depends on how far the graph is drawn, not on the tram's speed.",
          "Compare one minute on each line. Which one has climbed further by then?",
        ],
        choiceFeedbackEs: [
          "",
          "Los dos empiezan en 0 pies a los 0 minutos. ¿Dónde comienzan las dos rectas?",
          "El largo depende de hasta dónde se dibuje la gráfica, no de la velocidad del tranvía.",
          "Compara un minuto en cada recta. ¿Cuál ha subido más para entonces?",
        ],
        hints: [
          "At 0 minutes, how high is each tram?",
          "Look at what has happened to each line after exactly one minute.",
        ],
        hintsEs: [
          "A los 0 minutos, ¿a qué altura está cada tranvía?",
          "Mira qué le pasó a cada recta después de exactamente un minuto.",
        ],
      },
      {
        // ALWAYS / SOMETIMES / NEVER — the counterexample is a relationship the
        // student can check by hand.
        type: "multiple-choice",
        stem: "Claim: “If two quantities grow together, the points on their graph always lie on a straight line.” Always, sometimes, or never true?",
        stemEs:
          "Afirmación: “Si dos cantidades crecen juntas, los puntos de su gráfica siempre quedan en línea recta”. ¿Siempre, a veces o nunca es verdadera?",
        choices: [
          "Sometimes — only when the quantity grows by the same amount each step",
          "Always — growing together is what makes a line",
          "Never — real data never lines up",
          "Sometimes — only when both quantities are measured in the same unit",
        ],
        choicesEs: [
          "A veces — solo cuando la cantidad crece la misma cantidad en cada paso",
          "Siempre — crecer juntas es lo que forma una recta",
          "Nunca — los datos reales nunca se alinean",
          "A veces — solo cuando ambas cantidades se miden en la misma unidad",
        ],
        correctIndex: 0,
        explanation:
          "The tickets rise by the same $45 every time, so they line up. The side and area of a square both grow — (1, 1), (2, 4), (3, 9) — but the jumps are 3 then 5, so those points bend upward instead of forming a line.",
        explanationEs:
          "Los boletos suben los mismos $45 cada vez, así que se alinean. El lado y el área de un cuadrado crecen los dos — (1, 1), (2, 4), (3, 9) — pero los saltos son 3 y luego 5, así que esos puntos se curvan hacia arriba en vez de formar una recta.",
        choiceFeedback: [
          "",
          "Try side and area of a square: (1, 1), (2, 4), (3, 9). Are the jumps equal?",
          "The ticket graph does line up. Check the jumps between its points.",
          "Tickets and dollars are different units and they still form a line.",
        ],
        choiceFeedbackEs: [
          "",
          "Prueba el lado y el área de un cuadrado: (1, 1), (2, 4), (3, 9). ¿Son iguales los saltos?",
          "La gráfica de boletos sí se alinea. Revisa los saltos entre sus puntos.",
          "Boletos y dólares son unidades distintas y aun así forman una recta.",
        ],
        hints: [
          "Find one growing relationship whose points do NOT line up.",
          "List (1, 1), (2, 4), (3, 9) and look at the size of each jump.",
        ],
        hintsEs: [
          "Encuentra una relación creciente cuyos puntos NO se alineen.",
          "Escribe (1, 1), (2, 4), (3, 9) y mira el tamaño de cada salto.",
        ],
      },
      {
        // REVERSE — from a plotted point back to the unit rate, then forward.
        type: "multiple-choice",
        stem: "A different event's ticket graph passes through the point (4, 100). What does one ticket cost, and where would the point for 7 tickets sit?",
        stemEs:
          "La gráfica de boletos de otro evento pasa por el punto (4, 100). ¿Cuánto cuesta un boleto y dónde quedaría el punto para 7 boletos?",
        choices: [
          "$25 each, and the point would be (7, 175)",
          "$25 each, and the point would be (175, 7)",
          "$400 each, and the point would be (7, 2800)",
          "There is not enough information to find the cost of one ticket",
        ],
        choicesEs: [
          "$25 cada uno, y el punto quedaría en (7, 175)",
          "$25 cada uno, y el punto quedaría en (175, 7)",
          "$400 cada uno, y el punto quedaría en (7, 2800)",
          "No hay información suficiente para hallar el costo de un boleto",
        ],
        correctIndex: 0,
        explanation:
          "The point (4, 100) says 4 tickets cost $100 altogether, so one ticket is 100 ÷ 4 = $25. Seven tickets are 7 × 25 = $175, plotted as (7, 175) with the number of tickets first.",
        explanationEs:
          "El punto (4, 100) dice que 4 boletos cuestan $100 en total, así que un boleto cuesta 100 ÷ 4 = $25. Siete boletos son 7 × 25 = $175, graficado como (7, 175) con el número de boletos primero.",
        choiceFeedback: [
          "",
          "The cost is right, but check the order — which quantity goes first?",
          "That multiplies instead of dividing. 4 tickets cost $100 in total, not $100 each.",
          "One point is enough here: it gives you 4 tickets and their total cost.",
        ],
        choiceFeedbackEs: [
          "",
          "El costo está bien, pero revisa el orden: ¿qué cantidad va primero?",
          "Eso multiplica en vez de dividir. 4 boletos cuestan $100 en total, no $100 cada uno.",
          "Un punto basta aquí: te da 4 boletos y su costo total.",
        ],
        hints: [
          "What do the two numbers in (4, 100) stand for?",
          "Split the $100 between the 4 tickets first.",
        ],
        hintsEs: [
          "¿Qué representan los dos números de (4, 100)?",
          "Primero reparte los $100 entre los 4 boletos.",
        ],
      },
      {
        // CREATE — a falling relationship, which no item in the lesson contains.
        type: "open-response",
        stem: "Every graph in this lesson rises to the right. Invent a situation where the dependent quantity goes DOWN as the independent quantity goes up. Give three ordered pairs, say what each quantity is, and describe what your graph looks like.",
        stemEs:
          "Todas las gráficas de esta lección suben hacia la derecha. Inventa una situación donde la cantidad dependiente BAJE mientras la independiente sube. Da tres pares ordenados, di qué es cada cantidad y describe cómo se ve tu gráfica.",
        modelAnswer:
          "Minutes riding the tram and miles still left to travel. At 0 minutes there are 12 miles left, at 1 minute 10 miles, at 2 minutes 8 miles: (0, 12), (1, 10), (2, 8). Two miles disappear every minute, so the points drop by the same amount each step and the line falls to the right.",
        modelAnswerEs:
          "Minutos viajando en el tranvía y millas que faltan por recorrer. A los 0 minutos faltan 12 millas, a 1 minuto 10 millas, a 2 minutos 8 millas: (0, 12), (1, 10), (2, 8). Desaparecen dos millas cada minuto, así que los puntos bajan lo mismo en cada paso y la recta cae hacia la derecha.",
        sentenceStems: [
          "My two quantities are ___ and ___ .",
          "My ordered pairs are ___ , ___ , ___ .",
          "The graph ___ because ___ .",
        ],
      },
      {
        // READ THE ORIGIN — a point students routinely dismiss.
        type: "open-response",
        stem: "On the tram graph — minutes across, feet climbed up the side — a classmate marks the point (0, 0) and says it is meaningless. Do you agree? Say what (0, 0) claims about the tram, and why the line passes through it.",
        stemEs:
          "En la gráfica del tranvía — minutos en el eje horizontal, pies subidos en el vertical — un compañero marca el punto (0, 0) y dice que no significa nada. ¿Estás de acuerdo? Di qué afirma (0, 0) sobre el tranvía y por qué la recta pasa por ahí.",
        modelAnswer:
          "I disagree. The point (0, 0) says that after 0 minutes the tram has climbed 0 feet, which is exactly where it starts. It is the most reliable point on the graph, and the line passes through it because the tram begins the climb from the bottom.",
        modelAnswerEs:
          "No estoy de acuerdo. El punto (0, 0) dice que después de 0 minutos el tranvía ha subido 0 pies, que es justo donde empieza. Es el punto más confiable de la gráfica, y la recta pasa por ahí porque el tranvía comienza la subida desde abajo.",
        sentenceStems: [
          "I agree / disagree because ___ .",
          "The point (0, 0) says that ___ .",
          "The line passes through it because ___ .",
        ],
      },
    ],
  },
  "9-1-group2": {
    /*
     * Authored facilitation, because the generated moves were about another
     * lesson's mathematics entirely.
     *
     * buildTeacherMoves() keys off the lesson's FIRST misconception tag. For a
     * challenge lesson those tags come from inherited core items, so 9-1-group2
     * — independent and dependent variables — was handed
     * `op-added-instead-of-multiplied` by a Ferris-wheel arithmetic item and
     * told its teacher to ask "When does repeated addition stop being a
     * practical method?" and to look for a student explaining why an addition
     * error fails. There is no repeated addition in 6.AT.11.
     *
     * Where a lesson authors its own tasks it authors its own moves: the two
     * have to describe the same mathematics or the teacher is reading a script
     * for a different room.
     */
    facilitation: {
      ask: "In this situation, who does the choosing — and how does that decide which variable is which?",
      lookFor:
        "A student who tests the claim by hunting for a case where it FAILS, instead of confirming one case where it works.",
      ifStuck:
        "Cover the numbers with your hand. Ask: what did someone decide, and what happened as a result? Then uncover them.",
      extend:
        "Ask them to write a situation where the two roles could be argued either way, then say what one extra sentence would settle it.",
    },
    drop: [
      "Claire jogs 30 minutes and burns 123 Calories", // rate arithmetic
      "A plant grows 2 cm for every hour", // table arithmetic
      "The pizza shop spends $1.15 on cheese per pizza", // total-cost arithmetic
      "Give an example where the SAME quantity", // a creation task served as MC
    ],
    add: [
      {
        // ERROR ANALYSIS. The wrong rule is "whatever comes first in time is
        // independent" — plausible, common, and it survives every identification
        // item in the original lesson, which is why identification could not
        // expose it. The scenario is pinned ("decides each morning how many
        // pizzas to make") so the roles are genuinely determined; without that
        // sentence a shop working from a fixed cheese delivery would make the
        // student's answer defensible, and an error-analysis task whose error is
        // arguable teaches the wrong lesson.
        type: "open-response",
        stem: "A pizza shop decides each morning how many pizzas to make, then weighs out the cheese it needs. Devon says: “Cheese is the independent variable, because the shop buys the cheese before it makes any pizzas.” Devon is wrong. What rule did Devon use, and why does that rule fail here?",
        stemEs:
          "Una pizzería decide cada mañana cuántas pizzas va a hacer y luego pesa el queso que necesita. Devon dice: “El queso es la variable independiente, porque la pizzería compra el queso antes de hacer las pizzas”. Devon está equivocado. ¿Qué regla usó Devon y por qué esa regla falla aquí?",
        modelAnswer:
          "Devon used the rule “whatever happens first in time is the independent variable.” That rule fails because the roles depend on what is chosen, not on what happens first. The shop chooses the number of pizzas, so pizzas is the independent variable, and the cheese used responds to that choice — cheese is dependent.",
        modelAnswerEs:
          "Devon usó la regla “lo que ocurre primero en el tiempo es la variable independiente”. Esa regla falla porque los papeles dependen de lo que se elige, no de lo que ocurre primero. La pizzería elige el número de pizzas, así que las pizzas son la variable independiente, y el queso usado responde a esa elección — el queso es dependiente.",
        sentenceStems: [
          "Devon's rule was ___ .",
          "That rule fails because the independent variable is the one that ___ .",
          "Here the shop chooses ___ , so ___ depends on ___ .",
        ],
        sentenceStemsEs: [
          "La regla de Devon fue ___ .",
          "Esa regla falla porque la variable independiente es la que ___ .",
          "Aquí la pizzería elige ___ , así que ___ depende de ___ .",
        ],
      },
      {
        // ALWAYS / SOMETIMES / NEVER. Verified both directions before authoring:
        //   dependent SMALLER — choose 90 minutes jogging, run 9 miles (9 < 90)
        //   dependent LARGER  — choose 3 hours of sunlight, plant reaches 12 cm
        // so the claim is true sometimes and the size of the numbers is simply
        // irrelevant to the role. The fourth option is the trap worth having:
        // it sounds like a careful hedge and is still wrong.
        type: "multiple-choice",
        stem: "Claim: “The dependent variable always has the larger values.” Is this claim always, sometimes, or never true?",
        stemEs:
          "Afirmación: “La variable dependiente siempre tiene los valores más grandes”. ¿Esta afirmación es siempre, a veces o nunca verdadera?",
        choices: [
          "Sometimes — the size of the numbers has nothing to do with which variable is which",
          "Always — the dependent variable is the result, so it is bigger",
          "Never — the independent variable is always the larger one",
          "Only when both quantities are measured in the same unit",
        ],
        choicesEs: [
          "A veces — el tamaño de los números no tiene nada que ver con cuál variable es cuál",
          "Siempre — la variable dependiente es el resultado, así que es más grande",
          "Nunca — la variable independiente siempre es la más grande",
          "Solo cuando ambas cantidades se miden en la misma unidad",
        ],
        correctIndex: 0,
        explanation:
          "Sometimes. Jog for 90 minutes and you might run 9 miles — the dependent value (9) is smaller. Give a plant 3 hours of sunlight and it might reach 12 cm — the dependent value (12) is larger. The role is decided by which quantity is subject to choice, not by which numbers are bigger.",
        explanationEs:
          "A veces. Si trotas 90 minutos podrías correr 9 millas — el valor dependiente (9) es más pequeño. Si le das a una planta 3 horas de sol podría llegar a 12 cm — el valor dependiente (12) es más grande. El papel lo decide cuál cantidad se elige, no cuáles números son más grandes.",
        choiceFeedback: [
          "",
          "Find one case where the dependent value is smaller — 90 minutes of jogging, 9 miles run — and the claim breaks.",
          "That is the same mistake in reverse. Try to find a case where the dependent value is larger.",
          "Units do not decide the roles either. 90 minutes → 9 miles uses different units and the dependent value is still smaller.",
        ],
        hints: [
          "Try to find ONE example where the claim is false. One is enough to rule out “always”.",
          "Jog 90 minutes and run 9 miles. Which value is larger — the one you chose, or the one that responded?",
        ],
        hintsEs: [
          "Intenta encontrar UN ejemplo donde la afirmación sea falsa. Uno basta para descartar “siempre”.",
          "Trota 90 minutos y corre 9 millas. ¿Cuál valor es más grande — el que elegiste o el que respondió?",
        ],
      },
      {
        // CREATE AN EXAMPLE — restored to an actual creation task. This is the
        // idea the dropped multiple-choice item was reaching for: one quantity
        // taking both roles depending on what is chosen. Both directions are
        // verified in the model answer, and the task asks students to name the
        // chooser, which is the criterion doing the work.
        type: "open-response",
        stem: "Describe one situation where time is the independent variable, and a different situation where time is the dependent variable. For each one, say who or what does the choosing.",
        stemEs:
          "Describe una situación donde el tiempo sea la variable independiente y una situación distinta donde el tiempo sea la variable dependiente. En cada una, di quién o qué hace la elección.",
        modelAnswer:
          "Independent: I choose to jog for 30 minutes and see how many Calories I burn. I chose the time, so time is independent and Calories depend on it. Dependent: I run exactly 3 miles and record how long it takes. I chose the distance, so time responded — time is dependent. Same quantity, opposite roles, because a different thing was chosen each time.",
        modelAnswerEs:
          "Independiente: elijo trotar 30 minutos y veo cuántas calorías quemo. Yo elegí el tiempo, así que el tiempo es independiente y las calorías dependen de él. Dependiente: corro exactamente 3 millas y registro cuánto tardo. Yo elegí la distancia, así que el tiempo respondió — el tiempo es dependiente. La misma cantidad, papeles opuestos, porque en cada caso se eligió algo distinto.",
        sentenceStems: [
          "Time is independent when ___ chooses ___ , and ___ responds.",
          "Time is dependent when ___ chooses ___ , and the time responds.",
          "The role changed because ___ .",
        ],
        sentenceStemsEs: [
          "El tiempo es independiente cuando ___ elige ___ , y ___ responde.",
          "El tiempo es dependiente cuando ___ elige ___ , y el tiempo responde.",
          "El papel cambió porque ___ .",
        ],
      },
      {
        // REVERSE THE PROBLEM. Every other item hands over a situation and asks
        // for the roles; this hands over the roles and asks for the situation.
        // Same mathematics, run backwards — which is where you find out whether
        // "depends on" is understood or just matched.
        type: "open-response",
        stem: "Here is the result of an experiment: “Water temperature depends on how long the pot has been on the stove.” Working backwards, describe the experiment. What would you choose, what would you measure, and what would the two column headings of your table be?",
        stemEs:
          "Este es el resultado de un experimento: “La temperatura del agua depende de cuánto tiempo lleva la olla en la estufa”. Trabajando al revés, describe el experimento. ¿Qué elegirías, qué medirías y cuáles serían los dos encabezados de las columnas de tu tabla?",
        modelAnswer:
          "I would choose the number of minutes the pot stays on the stove — that is the independent variable, because I decide it. I would measure the water temperature at each of those times — that is the dependent variable, because it responds. My table's columns would be “Minutes on the stove” and “Water temperature (°C)”, with the chosen quantity in the first column.",
        modelAnswerEs:
          "Elegiría el número de minutos que la olla permanece en la estufa — esa es la variable independiente, porque yo la decido. Mediría la temperatura del agua en cada uno de esos momentos — esa es la variable dependiente, porque responde. Las columnas de mi tabla serían “Minutos en la estufa” y “Temperatura del agua (°C)”, con la cantidad elegida en la primera columna.",
        sentenceStems: [
          "I would choose ___ , so that is the ___ variable.",
          "I would measure ___ , so that is the ___ variable.",
          "My two columns would be ___ and ___ .",
        ],
        sentenceStemsEs: [
          "Yo elegiría ___ , así que esa es la variable ___ .",
          "Yo mediría ___ , así que esa es la variable ___ .",
          "Mis dos columnas serían ___ y ___ .",
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6-14 · 6.AT.7 — The Distributive Property (2026-08-14 alignment audit).
  //
  // The objective reads "expand AND FACTOR", but the challenge variant's whole
  // practice spine expanded only: the remix pulled three approaching-level
  // items into the extending bucket — pure arithmetic 4(5 − 2), a recall item
  // ("you must multiply 'a' by:"), and a third copy of Expand 3(x + 4) that
  // also lives in optional's Light Cue 1. Factoring appeared nowhere a student
  // could DO it. Dropped the three, added the factoring half: two factor-with-
  // the-GCF items whose distractors are complete-but-not-GCF factorings (the
  // real misconception), and an equivalence judgment where every choice must
  // be expanded to find the impostor. Arithmetic checked: 6(2x+3)=12x+18;
  // 2(6x+9)=12x+18 but not GCF; 8(3a+2)=24a+16; 4(6a+4)=24a+16 not GCF;
  // 6(x+12)=6x+72 ≠ 6x+12 while 6(x+2), 2(3x+6), 3(2x+4) all equal it.
  // -------------------------------------------------------------------------
  "6-14-group2": {
    drop: ["Expand 4(5", "must multiply", "Expand 3(x + 4) using"],
    add: [
      {
        type: "multiple-choice",
        stem: "Factor 12x + 18 using the GCF.",
        stemEs: "Factoriza 12x + 18 usando el MCD.",
        choices: ["6(2x + 3)", "2(6x + 9)", "12(x + 18)", "6(2x + 18)"],
        choicesEs: ["6(2x + 3)", "2(6x + 9)", "12(x + 18)", "6(2x + 18)"],
        correctIndex: 0,
        explanation:
          "The GCF of 12 and 18 is 6: 12x + 18 = 6(2x + 3). Check by expanding: 6 × 2x = 12x and 6 × 3 = 18.",
        explanationEs:
          "El MCD de 12 y 18 es 6: 12x + 18 = 6(2x + 3). Comprueba desarrollando: 6 × 2x = 12x y 6 × 3 = 18.",
        choiceFeedback: [
          "",
          "Expand it — 2(6x + 9) does equal 12x + 18, but 6x and 9 still share a factor. Factoring with the GCF leaves nothing else to pull out.",
          "Expand to check: 12 × 18 = 216, not 18. Only the 12x term was considered.",
          "Expand to check: 6 × 18 = 108, not 18. The second term inside must multiply back to 18.",
        ],
        choiceFeedbackEs: [
          "",
          "Desarróllala: 2(6x + 9) sí es igual a 12x + 18, pero 6x y 9 todavía comparten un factor. Factorizar con el MCD no deja nada más por sacar.",
          "Comprueba desarrollando: 12 × 18 = 216, no 18. Solo se consideró el término 12x.",
          "Comprueba desarrollando: 6 × 18 = 108, no 18. El término de adentro debe multiplicar de vuelta a 18.",
        ],
        hints: [
          "Factoring runs the distributive property backwards: what number divides BOTH 12 and 18?",
          "The greatest common factor of 12 and 18 is 6. Divide each term by it.",
          "12x ÷ 6 = 2x and 18 ÷ 6 = 3. Write the factored form, then expand it to check.",
        ],
        hintsEs: [
          "Factorizar es la propiedad distributiva al revés: ¿qué número divide a 12 Y a 18?",
          "El máximo común divisor de 12 y 18 es 6. Divide cada término entre él.",
          "12x ÷ 6 = 2x y 18 ÷ 6 = 3. Escribe la forma factorizada y desarróllala para comprobar.",
        ],
      },
      {
        type: "multiple-choice",
        stem: "Factor 24a + 16 completely, using the GCF.",
        stemEs: "Factoriza 24a + 16 por completo, usando el MCD.",
        choices: ["8(3a + 2)", "4(6a + 4)", "8(3a + 8)", "16(a + 1)"],
        choicesEs: ["8(3a + 2)", "4(6a + 4)", "8(3a + 8)", "16(a + 1)"],
        correctIndex: 0,
        explanation:
          "The GCF of 24 and 16 is 8: 24a + 16 = 8(3a + 2). Expanding gives 24a + 16 back, and 3a and 2 share no factor.",
        explanationEs:
          "El MCD de 24 y 16 es 8: 24a + 16 = 8(3a + 2). Al desarrollar regresa 24a + 16, y 3a y 2 no comparten factores.",
        choiceFeedback: [
          "",
          "4(6a + 4) expands to 24a + 16, but 6a and 4 still share a 2 — the factoring is not complete. What is the GREATEST common factor?",
          "Expand: 8 × 8 = 64, not 16. Check the second term inside the parentheses.",
          "Expand: 16 × a = 16a, not 24a. The first term no longer matches.",
        ],
        choiceFeedbackEs: [
          "",
          "4(6a + 4) se desarrolla a 24a + 16, pero 6a y 4 todavía comparten un 2 — la factorización no está completa. ¿Cuál es el MÁXIMO factor común?",
          "Desarrolla: 8 × 8 = 64, no 16. Revisa el segundo término de adentro.",
          "Desarrolla: 16 × a = 16a, no 24a. El primer término ya no coincide.",
        ],
        hints: [
          "List the factors 24 and 16 share; take the greatest.",
          "The GCF is 8. Divide both terms by 8.",
          "24a ÷ 8 = 3a and 16 ÷ 8 = 2. Write it, then expand to confirm nothing is lost.",
        ],
        hintsEs: [
          "Enumera los factores que comparten 24 y 16; toma el mayor.",
          "El MCD es 8. Divide ambos términos entre 8.",
          "24a ÷ 8 = 3a y 16 ÷ 8 = 2. Escríbelo y desarrolla para confirmar que nada se pierde.",
        ],
      },
      {
        type: "multiple-choice",
        stem: "Which expression is NOT equivalent to 6x + 12?",
        stemEs: "¿Cuál expresión NO es equivalente a 6x + 12?",
        choices: ["6(x + 12)", "6(x + 2)", "2(3x + 6)", "3(2x + 4)"],
        choicesEs: ["6(x + 12)", "6(x + 2)", "2(3x + 6)", "3(2x + 4)"],
        correctIndex: 0,
        explanation:
          "6(x + 12) expands to 6x + 72 — the 12 was left unmultiplied. The other three all expand to exactly 6x + 12.",
        explanationEs:
          "6(x + 12) se desarrolla a 6x + 72: el 12 quedó sin multiplicar por completo. Las otras tres sí dan exactamente 6x + 12.",
        choiceFeedback: [
          "",
          "Expand it: 6 × x = 6x and 6 × 2 = 12. This one IS equivalent — you need the impostor.",
          "Expand it: 2 × 3x = 6x and 2 × 6 = 12. Equivalent — keep hunting.",
          "Expand it: 3 × 2x = 6x and 3 × 4 = 12. Equivalent — one of the others fails the check.",
        ],
        choiceFeedbackEs: [
          "",
          "Desarróllala: 6 × x = 6x y 6 × 2 = 12. Esta SÍ es equivalente — busca la impostora.",
          "Desarróllala: 2 × 3x = 6x y 2 × 6 = 12. Equivalente — sigue buscando.",
          "Desarróllala: 3 × 2x = 6x y 3 × 4 = 12. Equivalente — otra opción falla la comprobación.",
        ],
        hints: [
          "Expand each choice and compare it with 6x + 12.",
          "A factored form is equivalent only if BOTH products land back on the original terms.",
          "Check the constant each expansion produces: 6 × 12, 6 × 2, 2 × 6, 3 × 4. Which is not 12?",
        ],
        hintsEs: [
          "Desarrolla cada opción y compárala con 6x + 12.",
          "Una forma factorizada es equivalente solo si AMBOS productos regresan a los términos originales.",
          "Revisa la constante de cada desarrollo: 6 × 12, 6 × 2, 2 × 6, 3 × 4. ¿Cuál no es 12?",
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2026-08-14 alignment audit — challenge buckets carrying approaching-level
  // recall. The remix promotes inherited core items into the challenge
  // sequence; in these four lessons the promoted items were one-step
  // computations or duplicates, so mastery students spent extension time on
  // work below the guided set. Each spec drops the confirmed recall items and
  // adds one authored deepening task. Depth already present (error analyses,
  // interpretation items) is untouched.
  // -------------------------------------------------------------------------
  "2-9-group2": {
    // ext3/ext5 are single-subtraction items; ext4 is the CORE APPROACHING
    // MAD item promoted verbatim. ext6 (interpretation) and ext7 (the full
    // deviation table) stay.
    drop: [
      "The mean of a data set is 15. One value is 11",
      "A data set has absolute deviations of 3, 1, 5, 2, 4",
      "The mean of a data set is 20. A value is 26",
    ],
    add: [
      {
        // Always/sometimes/never on MAD = 0 — a generalization no computation
        // item can reach. Checked: identical values ⇒ every deviation 0 ⇒
        // MAD 0; any two different values ⇒ some positive deviation ⇒ MAD > 0.
        type: "multiple-choice",
        stem: "Claim: “A data set's MAD can equal 0.” Always, sometimes, or never true — and when?",
        stemEs:
          "Afirmación: “La MAD de un conjunto de datos puede ser 0”. ¿Siempre, a veces o nunca es verdadera — y cuándo?",
        choices: [
          "Sometimes — exactly when every value in the set is identical",
          "Never — absolute values are always positive, so their average is too",
          "Always — every data set has SOME value equal to its mean",
          "Sometimes — whenever the mean happens to be 0",
        ],
        choicesEs: [
          "A veces — exactamente cuando todos los valores del conjunto son idénticos",
          "Nunca — los valores absolutos siempre son positivos, así que su promedio también",
          "Siempre — todo conjunto tiene ALGÚN valor igual a su media",
          "A veces — siempre que la media resulte ser 0",
        ],
        correctIndex: 0,
        explanation:
          "If every value is the same — say 7, 7, 7, 7 — the mean is 7, every deviation is 0, and the MAD is 0: zero spread. The moment any two values differ, some deviation is positive and the MAD rises above 0. MAD measures spread, and 0 spread means no variation at all.",
        explanationEs:
          "Si todos los valores son iguales — por ejemplo 7, 7, 7, 7 — la media es 7, cada desviación es 0 y la MAD es 0: cero dispersión. En cuanto dos valores difieren, alguna desviación es positiva y la MAD sube de 0. La MAD mide la dispersión, y dispersión 0 significa ninguna variación.",
        choiceFeedback: [
          "",
          "|0| = 0, which is not positive. Try the data set 7, 7, 7, 7 — what is each deviation?",
          "Having one value at the mean does not make ALL deviations zero. What would every value have to be?",
          "Try 5, 5, 5 (mean 5, MAD 0) against −2, 0, 2 (mean 0, MAD above 0). Is the mean's value what decides?",
        ],
        choiceFeedbackEs: [
          "",
          "|0| = 0, que no es positivo. Prueba el conjunto 7, 7, 7, 7: ¿cuánto vale cada desviación?",
          "Que un valor esté en la media no hace cero TODAS las desviaciones. ¿Cómo tendrían que ser todos los valores?",
          "Prueba 5, 5, 5 (media 5, MAD 0) contra −2, 0, 2 (media 0, MAD mayor que 0). ¿Decide el valor de la media?",
        ],
        hints: [
          "Build a tiny data set and compute its MAD by hand.",
          "What data set would make EVERY deviation equal 0?",
          "Try 7, 7, 7, 7 — then change one value to 8 and watch what happens to the MAD.",
        ],
        hintsEs: [
          "Construye un conjunto pequeño y calcula su MAD a mano.",
          "¿Qué conjunto haría que TODAS las desviaciones fueran 0?",
          "Prueba 7, 7, 7, 7 — luego cambia un valor a 8 y observa qué pasa con la MAD.",
        ],
      },
    ],
  },

  "5-3-group2": {
    // ext3 repeats the guided computation, ext5 is first-step recall, ext7
    // repeats ext2's forgot-the-half error with near-identical numbers.
    drop: [
      "What is the area of a trapezoid with bases 6 cm and 10 cm",
      "What is the first step when finding the area of a trapezoid",
      "Find the Missing Half", // ext2 is "Level 2 Extension — The Missing Half"; this fragment hits only the duplicate
    ],
    add: [
      {
        // CREATE to a constraint — checked: (4 + 8) ÷ 2 × 4 = 24, and the
        // alternative (2 + 6) ÷ 2 × 6 = 24 shows multiple valid designs.
        type: "open-response",
        stem: "Design a trapezoid whose area is exactly 24 sq ft, where one base is 4 ft LONGER than the other. Give both bases and the height, and show your design checks out. Could a classmate's correct design use different numbers than yours?",
        stemEs:
          "Diseña un trapecio cuya área sea exactamente 24 pies², donde una base sea 4 pies MÁS LARGA que la otra. Da las dos bases y la altura, y demuestra que tu diseño cumple. ¿Podría el diseño correcto de un compañero usar números distintos a los tuyos?",
        modelAnswer:
          "Bases 4 ft and 8 ft with height 4 ft: (4 + 8) ÷ 2 = 6, and 6 × 4 = 24 sq ft ✓. Yes — a classmate could use bases 2 ft and 6 ft with height 6 ft: (2 + 6) ÷ 2 = 4, and 4 × 6 = 24 sq ft. Any base pair 4 apart whose average divides 24 gives a valid height.",
        modelAnswerEs:
          "Bases de 4 y 8 pies con altura 4: (4 + 8) ÷ 2 = 6, y 6 × 4 = 24 pies² ✓. Sí — un compañero podría usar bases de 2 y 6 con altura 6: (2 + 6) ÷ 2 = 4, y 4 × 6 = 24 pies². Cualquier par de bases con diferencia 4 cuya media divida a 24 da una altura válida.",
        sentenceStems: [
          "My bases are ___ and ___ , and my height is ___ .",
          "Check: ( ___ + ___ ) ÷ 2 × ___ = 24.",
          "A different correct design could be ___ .",
        ],
        sentenceStemsEs: [
          "Mis bases son ___ y ___ , y mi altura es ___ .",
          "Comprueba: ( ___ + ___ ) ÷ 2 × ___ = 24.",
          "Otro diseño correcto podría ser ___ .",
        ],
      },
    ],
  },

  "7-6-group2": {
    // ext4 duplicates the guided same-side case (both points in quadrant I);
    // ext5/ext6 stay — they cross zero, which is this lesson's real hurdle.
    drop: ["The Bank is at (2, 3) and the Library is at (2, 9)"],
    add: [
      {
        // Run the distance backwards — two valid endpoints. Checked:
        // −2 + 7 = 5 and −2 − 7 = −9; the distractors measure 11, 3, and a
        // horizontal move.
        type: "multiple-choice",
        stem: "A vertical path starts at (3, −2) and is exactly 7 blocks long. Where could it end?",
        stemEs:
          "Un camino vertical empieza en (3, −2) y mide exactamente 7 cuadras. ¿Dónde podría terminar?",
        choices: [
          "(3, 5) or (3, −9) — seven blocks up, or seven blocks down",
          "(3, 5) only — distances always count upward",
          "(10, −2) or (−4, −2)",
          "(3, 9) or (3, −5)",
        ],
        choicesEs: [
          "(3, 5) o (3, −9) — siete cuadras hacia arriba o siete hacia abajo",
          "(3, 5) solamente — las distancias siempre se cuentan hacia arriba",
          "(10, −2) o (−4, −2)",
          "(3, 9) o (3, −5)",
        ],
        correctIndex: 0,
        explanation:
          "Vertical means x stays 3 and y moves 7: up gives −2 + 7 = 5, down gives −2 − 7 = −9. Both check: |5 − (−2)| = 7 and |−9 − (−2)| = 7. A distance fixes how far, never which direction.",
        explanationEs:
          "Vertical significa que x se queda en 3 y y se mueve 7: hacia arriba, −2 + 7 = 5; hacia abajo, −2 − 7 = −9. Ambos cumplen: |5 − (−2)| = 7 y |−9 − (−2)| = 7. Una distancia fija cuánto, nunca hacia dónde.",
        choiceFeedback: [
          "",
          "Check the downward option: is |−9 − (−2)| also 7? Distance has no preferred direction.",
          "Those endpoints changed the x-coordinate — that is a HORIZONTAL path.",
          "Measure them: |9 − (−2)| = 11 and |−5 − (−2)| = 3. Neither is 7 blocks.",
        ],
        choiceFeedbackEs: [
          "",
          "Revisa la opción hacia abajo: ¿|−9 − (−2)| también es 7? La distancia no tiene dirección preferida.",
          "Esos extremos cambiaron la coordenada x: ese es un camino HORIZONTAL.",
          "Mídelos: |9 − (−2)| = 11 y |−5 − (−2)| = 3. Ninguno mide 7 cuadras.",
        ],
        hints: [
          "A vertical path keeps x the same. Which coordinate moves?",
          "From y = −2, travel 7 in each direction along the y-axis.",
          "−2 + 7 and −2 − 7. Check each candidate with |end − start| = 7.",
        ],
        hintsEs: [
          "Un camino vertical mantiene la x igual. ¿Qué coordenada se mueve?",
          "Desde y = −2, viaja 7 en cada dirección por el eje y.",
          "−2 + 7 y −2 − 7. Comprueba cada candidato con |final − inicio| = 7.",
        ],
      },
      {
        // Depth wave 2026-08-27. Name the boundary of the method: absolute value
        // measures along a grid line, so two points sharing NEITHER coordinate
        // are outside what this lesson can measure directly. Checked:
        // |2 − (−3)| = 5 and |−1 − 4| = 5 are the two legs, not the distance.
        demand: "generalization",
        type: "open-response",
        stem: "Every distance in this lesson used two points that shared a coordinate. Take (−3, 4) and (2, −1), which share NEITHER. Explain why subtracting coordinates does not give the distance between them, and say exactly what the two subtractions DO tell you.",
        stemEs:
          "Todas las distancias de esta lección usaron dos puntos que compartían una coordenada. Toma (−3, 4) y (2, −1), que no comparten NINGUNA. Explica por qué restar coordenadas no da la distancia entre ellos, y di exactamente qué SÍ dicen las dos restas.",
        modelAnswer:
          "Subtracting coordinates measures along a grid line, and that only IS the distance when the two points sit on the same line — same x means a vertical segment, same y a horizontal one. These two share neither, so the straight path between them is a slanted one that no grid line follows. What the subtractions do tell you: |2 − (−3)| = 5 is how far apart they are left-to-right, and |−1 − 4| = 5 is how far apart they are up-and-down. Those are the two legs of a right triangle whose slanted side is the real distance. You could also say the trip is 5 + 5 = 10 units if you have to travel along the streets — which is a real answer to a different question.",
        modelAnswerEs:
          "Restar coordenadas mide a lo largo de una línea de la cuadrícula, y eso SOLO es la distancia cuando los dos puntos están sobre la misma línea — la misma x da un segmento vertical, la misma y uno horizontal. Estos no comparten ninguna, así que el camino recto entre ellos es inclinado y ninguna línea de la cuadrícula lo sigue. Lo que sí dicen las restas: |2 − (−3)| = 5 es qué tan separados están de izquierda a derecha, y |−1 − 4| = 5 qué tan separados están de arriba abajo. Esos son los dos catetos de un triángulo rectángulo cuyo lado inclinado es la distancia real. También puedes decir que el recorrido es 5 + 5 = 10 unidades si hay que ir por las calles — que es una respuesta real a otra pregunta.",
        sentenceStems: [
          "Subtracting coordinates gives the distance only when ___ .",
          "|2 − (−3)| = ___ tells me ___ .",
          "The straight-line distance is not ___ because ___ .",
        ],
        sentenceStemsEs: [
          "Restar coordenadas da la distancia solo cuando ___ .",
          "|2 − (−3)| = ___ me dice ___ .",
          "La distancia en línea recta no es ___ porque ___ .",
        ],
      },
    ],
  },

  "9-3-group2": {
    // ext6 is one multiplication the guided bank now rehearses; ext7 is
    // definition recall. The lesson also had no open-response anywhere — the
    // added task is the missing written-justification artifact.
    // Depth wave 2026-08-27 adds the third fragment: a full-year total is the
    // same one-step substitution onLevel[0] already runs, and the lesson had to
    // stay at 14 items to make room for the proportionality task below.
    drop: [
      "What is the total cost of 2 months of membership",
      "what does m represent",
      "Miguel wants the cost of a full year",
    ],
    add: [
      {
        // Compare two rate equations. Checked: 15(1)=15 vs 12(1)+6=18;
        // 15(2)=30 vs 12(2)+6=30; 15(4)=60 vs 12(4)+6=54.
        type: "open-response",
        stem: "The canoe shop's equation is c = 15h. A rival shop advertises c = 12h + 6 and claims “we are ALWAYS cheaper.” Test the claim with at least two values of h, then tell the truth about when each shop is the better deal.",
        stemEs:
          "La ecuación del local de canoas es c = 15h. Un local rival anuncia c = 12h + 6 y afirma: “SIEMPRE somos más baratos”. Pon a prueba la afirmación con al menos dos valores de h y di la verdad sobre cuándo conviene cada local.",
        modelAnswer:
          "At h = 1: the first shop charges 15(1) = $15, the rival 12(1) + 6 = $18 — the claim already fails. At h = 2 both charge $30. At h = 4: 15(4) = $60 against 12(4) + 6 = $54, so the rival wins. The truth: the rival is cheaper only for rentals LONGER than 2 hours, because its lower rate needs time to make up the $6 fee.",
        modelAnswerEs:
          "Con h = 1: el primero cobra 15(1) = $15 y el rival 12(1) + 6 = $18 — la afirmación ya falla. Con h = 2 ambos cobran $30. Con h = 4: 15(4) = $60 contra 12(4) + 6 = $54, y gana el rival. La verdad: el rival es más barato solo para rentas de MÁS de 2 horas, porque su tarifa menor necesita tiempo para compensar los $6 fijos.",
        sentenceStems: [
          "At h = ___ , the first shop charges ___ and the rival charges ___ .",
          "The claim is ___ , because ___ .",
          "The rival is the better deal when ___ .",
        ],
        sentenceStemsEs: [
          "Con h = ___ , el primer local cobra ___ y el rival cobra ___ .",
          "La afirmación es ___ , porque ___ .",
          "El rival es la mejor opción cuando ___ .",
        ],
      },
      {
        // Depth wave 2026-08-27. Both lesson equations happen to be proportional,
        // so "proportional" is invisible until something is not. Checked:
        // c = 19.95m + 30 gives c = 30 at m = 0, so it fails the through-origin
        // test, and 19.95(2) + 30 = 69.90 is not double 19.95(1) + 30 = 49.95.
        demand: "generalization",
        type: "open-response",
        stem: "The two equations in this lesson, c = 24.95m and c = 15h, look alike. Say what they have in common that makes both PROPORTIONAL. Then write an equation for a gym charging a $30 joining fee plus $19.95 a month, and give two different tests that show it is not proportional.",
        stemEs:
          "Las dos ecuaciones de esta lección, c = 24.95m y c = 15h, se parecen. Di qué tienen en común que hace que las dos sean PROPORCIONALES. Después escribe una ecuación para un gimnasio que cobra $30 de inscripción más $19.95 al mes, y da dos pruebas distintas que muestren que no es proporcional.",
        modelAnswer:
          "Both are a single rate times a variable and nothing else, so doubling the input doubles the output and zero months cost zero dollars. The new gym is c = 19.95m + 30. Test 1, the zero test: at m = 0 the cost is $30, not $0 — you pay before you have used anything, so the graph does not pass through the origin. Test 2, the doubling test: one month is 19.95 + 30 = $49.95 and two months is 39.90 + 30 = $69.90, which is not double $49.95. The $30 is added once and never scales, and that single added term is what breaks proportionality.",
        modelAnswerEs:
          "Las dos son una sola tasa por una variable y nada más, así que duplicar la entrada duplica la salida y cero meses cuestan cero dólares. El gimnasio nuevo es c = 19.95m + 30. Prueba 1, la del cero: con m = 0 el costo es $30, no $0 — pagas antes de haber usado nada, así que la gráfica no pasa por el origen. Prueba 2, la del doble: un mes son 19.95 + 30 = $49.95 y dos meses son 39.90 + 30 = $69.90, que no es el doble de $49.95. Los $30 se suman una sola vez y nunca escalan, y ese término sumado es lo que rompe la proporcionalidad.",
        sentenceStems: [
          "Both equations are proportional because ___ .",
          "The new gym's equation is ___ .",
          "It is not proportional because at m = 0 ___ , and doubling m ___ .",
        ],
        sentenceStemsEs: [
          "Las dos ecuaciones son proporcionales porque ___ .",
          "La ecuación del gimnasio nuevo es ___ .",
          "No es proporcional porque con m = 0 ___ , y duplicar m ___ .",
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Depth wave, 2026-08-27. The audit graded thirteen challenge lessons C for
  // the same reason: "depth comes from bigger numbers, not deeper thinking."
  // Each entry below drops one redundant computation and adds one task the
  // student cannot finish by running the procedure again — a rule to state, a
  // claim to judge, a case the method does not cover. `demand` is declared
  // because these were authored AS deep tasks; that is a decision, not a guess.
  // ---------------------------------------------------------------------------

  "2-6-group2": {
    // ext3 is a third bare quotient after 4,896 ÷ 12 and 5,084 ÷ 31 — the
    // lesson already proved the student can run the algorithm.
    drop: ["What is 7,225 ÷ 25?"],
    add: [
      {
        // Checked: 4,896 ÷ 12 = 408; ÷24 halves it to 204; ÷6 doubles it to 816.
        demand: "generalization",
        type: "open-response",
        stem: "You already found 4,896 ÷ 12 = 408. WITHOUT dividing again, work out 4,896 ÷ 24 and 4,896 ÷ 6, and state the rule that connects them. Then say what happens to the quotient if the DIVIDEND doubles instead of the divisor.",
        stemEs:
          "Ya encontraste 4,896 ÷ 12 = 408. SIN volver a dividir, halla 4,896 ÷ 24 y 4,896 ÷ 6, y enuncia la regla que los conecta. Después di qué le pasa al cociente si se duplica el DIVIDENDO en vez del divisor.",
        modelAnswer:
          "4,896 ÷ 24 = 204 and 4,896 ÷ 6 = 816. Rule: with the dividend fixed, doubling the divisor halves the quotient and halving the divisor doubles it — the same total split into twice as many groups gives groups half the size. Check: 204 × 24 = 4,896 ✓ and 816 × 6 = 4,896 ✓. Doubling the DIVIDEND instead doubles the quotient: 9,792 ÷ 12 = 816. Divisor and quotient move opposite ways; dividend and quotient move together.",
        modelAnswerEs:
          "4,896 ÷ 24 = 204 y 4,896 ÷ 6 = 816. Regla: con el dividendo fijo, duplicar el divisor reduce el cociente a la mitad y reducir el divisor a la mitad lo duplica — el mismo total repartido en el doble de grupos da grupos de la mitad de tamaño. Comprueba: 204 × 24 = 4,896 ✓ y 816 × 6 = 4,896 ✓. Duplicar el DIVIDENDO en cambio duplica el cociente: 9,792 ÷ 12 = 816. El divisor y el cociente se mueven en sentidos opuestos; el dividendo y el cociente se mueven juntos.",
        sentenceStems: [
          "4,896 ÷ 24 = ___ because ___ .",
          "When the divisor doubles, the quotient ___ .",
          "When the dividend doubles, the quotient ___ .",
        ],
        sentenceStemsEs: [
          "4,896 ÷ 24 = ___ porque ___ .",
          "Cuando el divisor se duplica, el cociente ___ .",
          "Cuando el dividendo se duplica, el cociente ___ .",
        ],
      },
    ],
  },

  "2-7-group2": {
    // ext3 is a third bare decimal quotient after 4.8 ÷ 0.6 and 15 ÷ 0.25.
    drop: ["What is 9.45 ÷ 0.9?"],
    add: [
      {
        // Checked: 9.6÷0.8 = 12, 96÷8 = 12, 0.96÷0.08 = 12; and 96÷0.8 = 120.
        demand: "generalization",
        type: "open-response",
        stem: "These are all 12: 9.6 ÷ 0.8, 96 ÷ 8, and 0.96 ÷ 0.08. Write the rule for which changes to a division leave the quotient alone. Then give one change to 9.6 ÷ 0.8 that does NOT leave it alone, and say what it becomes.",
        stemEs:
          "Todas estas dan 12: 9.6 ÷ 0.8, 96 ÷ 8 y 0.96 ÷ 0.08. Escribe la regla sobre qué cambios en una división dejan igual el cociente. Después da un cambio a 9.6 ÷ 0.8 que NO lo deje igual, y di en qué se convierte.",
        modelAnswer:
          "Rule: multiplying or dividing BOTH numbers by the same amount leaves the quotient unchanged, because the two numbers keep the same relative size. 9.6 ÷ 0.8 → both ×10 → 96 ÷ 8 = 12 ✓; both ÷10 → 0.96 ÷ 0.08 = 12 ✓. A change that breaks it: scale only the dividend. 96 ÷ 0.8 = 120, ten times bigger, because the divisor never moved. That is exactly the mistake this lesson warns about — the point has to move in BOTH numbers.",
        modelAnswerEs:
          "Regla: multiplicar o dividir LOS DOS números por la misma cantidad deja el cociente igual, porque los dos números conservan el mismo tamaño relativo. 9.6 ÷ 0.8 → los dos ×10 → 96 ÷ 8 = 12 ✓; los dos ÷10 → 0.96 ÷ 0.08 = 12 ✓. Un cambio que lo rompe: escalar solo el dividendo. 96 ÷ 0.8 = 120, diez veces más grande, porque el divisor no se movió. Ese es justo el error que advierte esta lección — el punto tiene que moverse en LOS DOS números.",
        sentenceStems: [
          "The quotient stays the same when ___ .",
          "It stays the same because ___ .",
          "One change that breaks it is ___ , which gives ___ .",
        ],
        sentenceStemsEs: [
          "El cociente se mantiene igual cuando ___ .",
          "Se mantiene igual porque ___ .",
          "Un cambio que lo rompe es ___ , que da ___ .",
        ],
      },
    ],
  },

  "5-10-group2": {
    // A cube edge 5 is a third bare volume after the 8×5×4 prism and the 6×4×3 box.
    drop: ["A cube has an edge length of 5 cm"],
    add: [
      {
        // Checked: 2×3×4 = 24, 1×4×6 = 24, 2×2×6 = 24. Doubling one edge → 48;
        // doubling all three → 2×2×2 = 8 times, 24 → 192.
        demand: "generalization",
        type: "open-response",
        stem: "A box has a volume of 24 cm³. Give THREE different sets of whole-number edge lengths that work. Then explain why doubling just ONE edge doubles the volume, but doubling ALL THREE multiplies it by 8 — not by 6.",
        stemEs:
          "Una caja tiene un volumen de 24 cm³. Da TRES conjuntos distintos de aristas con números enteros que funcionen. Después explica por qué duplicar UNA sola arista duplica el volumen, pero duplicar LAS TRES lo multiplica por 8 — no por 6.",
        modelAnswer:
          "Three that work: 2 × 3 × 4 = 24, 1 × 4 × 6 = 24, and 2 × 2 × 6 = 24. Volume multiplies the three edges, so doubling one edge multiplies the product by 2: 2 × 3 × 8 = 48. Doubling all three multiplies by 2 three times — 2 × 2 × 2 = 8 — so 24 becomes 192. It is not 6 because the edges are multiplied together, not added; 2 + 2 + 2 would be the answer if volume were a sum, and it is not.",
        modelAnswerEs:
          "Tres que funcionan: 2 × 3 × 4 = 24, 1 × 4 × 6 = 24 y 2 × 2 × 6 = 24. El volumen multiplica las tres aristas, así que duplicar una arista multiplica el producto por 2: 2 × 3 × 8 = 48. Duplicar las tres multiplica por 2 tres veces — 2 × 2 × 2 = 8 — así que 24 se convierte en 192. No es 6 porque las aristas se multiplican, no se suman; 2 + 2 + 2 sería la respuesta si el volumen fuera una suma, y no lo es.",
        sentenceStems: [
          "Three sets that give 24 cm³ are ___ , ___ , and ___ .",
          "Doubling one edge doubles the volume because ___ .",
          "Doubling all three multiplies by 8 because ___ .",
        ],
        sentenceStemsEs: [
          "Tres conjuntos que dan 24 cm³ son ___ , ___ y ___ .",
          "Duplicar una arista duplica el volumen porque ___ .",
          "Duplicar las tres multiplica por 8 porque ___ .",
        ],
      },
    ],
  },

  "7-2-group2": {
    // "What is the opposite of -3/4" is recall; the lesson already has ordering
    // and placement items that do the same work with more thinking in them.
    drop: ["What is the opposite of -3/4?"],
    add: [
      {
        // Checked: 0.5 > 0.25 supports the claim; 0.7 > 0.65 and 0.9 > 0.1000
        // break it. The real rule compares place by place from the left.
        demand: "reasoning",
        type: "open-response",
        stem: "A classmate says: 'The more digits after the decimal point, the smaller the number — look at 0.5 and 0.25.' Find a pair of numbers where that reasoning gives the WRONG answer, and write what is actually true. Where would each of your numbers sit on the number line?",
        stemEs:
          "Un compañero dice: 'Mientras más cifras haya después del punto decimal, más pequeño es el número — mira 0.5 y 0.25.' Encuentra un par de números donde ese razonamiento dé la respuesta INCORRECTA, y escribe lo que realmente es cierto. ¿Dónde estaría cada uno de tus números en la recta numérica?",
        modelAnswer:
          "The example works by luck: 0.5 > 0.25 is true. But 0.7 and 0.65 break it — 0.65 has more digits and is still smaller, so the rule 'more digits means smaller' would call 0.7 the smaller one, which is wrong. So does 0.9 versus 0.1000, where four digits is the LARGER count and the smaller number. What is actually true: compare place value from the left. 0.7 is 7 tenths, 0.65 is 6 tenths and 5 hundredths, and 7 tenths beats 6 tenths before the hundredths matter. On the number line 0.65 sits between 0.6 and 0.7, so 0.7 is to its right.",
        modelAnswerEs:
          "El ejemplo funciona por suerte: 0.5 > 0.25 es cierto. Pero 0.7 y 0.65 lo rompen — 0.65 tiene más cifras y aun así es menor, así que la regla 'más cifras significa menor' diría que 0.7 es el menor, lo cual es falso. También lo rompe 0.9 frente a 0.1000, donde cuatro cifras es la cantidad MAYOR y el número menor. Lo que sí es cierto: compara el valor posicional desde la izquierda. 0.7 son 7 décimos; 0.65 son 6 décimos y 5 centésimos, y 7 décimos gana a 6 décimos antes de que importen los centésimos. En la recta numérica 0.65 está entre 0.6 y 0.7, así que 0.7 queda a su derecha.",
        sentenceStems: [
          "My pair is ___ and ___ .",
          "The classmate's rule would say ___ , but really ___ .",
          "What is actually true is ___ .",
        ],
        sentenceStemsEs: [
          "Mi par es ___ y ___ .",
          "La regla del compañero diría ___ , pero en realidad ___ .",
          "Lo que sí es cierto es ___ .",
        ],
      },
    ],
  },

  "7-8-group2": {
    // Naming the quadrant of (-3, 5) is recall the lesson tests twice more.
    drop: ["In which quadrant is the point (-3, 5)?"],
    add: [
      {
        // Checked: (x,y) → across x-axis → (x,−y) → across y-axis → (−x,−y).
        // QI→QIII, QII→QIV, QIII→QI, QIV→QII. Same as a half-turn about origin.
        demand: "generalization",
        type: "open-response",
        stem: "A point is reflected across the x-axis, and then that image is reflected across the y-axis. Predict which quadrant it lands in for a start in EACH of the four quadrants, then state the rule for what happens to the coordinates (x, y). Does the order of the two reflections matter?",
        stemEs:
          "Un punto se refleja sobre el eje x, y luego esa imagen se refleja sobre el eje y. Predice en qué cuadrante termina si empieza en CADA uno de los cuatro cuadrantes, y después enuncia la regla de lo que les pasa a las coordenadas (x, y). ¿Importa el orden de las dos reflexiones?",
        modelAnswer:
          "Reflecting across the x-axis sends (x, y) to (x, −y); reflecting that across the y-axis sends it to (−x, −y). Both signs flip. So Quadrant I → III, II → IV, III → I, IV → II — every point lands in the quadrant diagonally opposite. Test with (3, −6): across the x-axis gives (3, 6), then across the y-axis gives (−3, 6), which is Quadrant II, and (3, −6) started in Quadrant IV ✓. The order does not matter: reflecting first across the y-axis gives (−x, y), then across the x-axis gives (−x, −y) — the same point.",
        modelAnswerEs:
          "Reflejar sobre el eje x envía (x, y) a (x, −y); reflejar eso sobre el eje y lo envía a (−x, −y). Los dos signos cambian. Así que el Cuadrante I → III, II → IV, III → I, IV → II — cada punto cae en el cuadrante diagonalmente opuesto. Compruébalo con (3, −6): sobre el eje x da (3, 6), y luego sobre el eje y da (−3, 6), que está en el Cuadrante II, y (3, −6) empezó en el Cuadrante IV ✓. El orden no importa: reflejar primero sobre el eje y da (−x, y), y luego sobre el eje x da (−x, −y) — el mismo punto.",
        sentenceStems: [
          "Starting in Quadrant ___ , the point lands in Quadrant ___ .",
          "The rule is (x, y) → ___ .",
          "The order ___ matter, because ___ .",
        ],
        sentenceStemsEs: [
          "Empezando en el Cuadrante ___ , el punto cae en el Cuadrante ___ .",
          "La regla es (x, y) → ___ .",
          "El orden ___ importa, porque ___ .",
        ],
      },
    ],
  },

  "7-7-group2": {
    add: [
      {
        // Checked: sides w and h; perimeter 2(w + h); area w·h. a and b locate
        // the rectangle but never change its size — the translation invariance.
        demand: "generalization",
        type: "open-response",
        stem: "A rectangle has vertices (a, b), (a + w, b), (a + w, b + h), and (a, b + h). Write expressions for its side lengths, perimeter, and area that work for ANY a, b, w, and h. Then explain why a and b never appear in your perimeter or area.",
        stemEs:
          "Un rectángulo tiene vértices (a, b), (a + w, b), (a + w, b + h) y (a, b + h). Escribe expresiones para sus lados, su perímetro y su área que sirvan para CUALQUIER a, b, w y h. Después explica por qué a y b nunca aparecen en tu perímetro ni en tu área.",
        modelAnswer:
          "Horizontal side: |(a + w) − a| = w. Vertical side: |(b + h) − b| = h. Perimeter = 2(w + h), area = w · h. The a and b subtract away, because a side length is a DIFFERENCE of coordinates and both endpoints carry the same a (or the same b). That is the whole reason they vanish: a and b say where the rectangle sits, not how big it is. Slide it anywhere on the plane and w and h are untouched, so the perimeter and area cannot change.",
        modelAnswerEs:
          "Lado horizontal: |(a + w) − a| = w. Lado vertical: |(b + h) − b| = h. Perímetro = 2(w + h), área = w · h. La a y la b se restan y desaparecen, porque la longitud de un lado es una DIFERENCIA de coordenadas y los dos extremos llevan la misma a (o la misma b). Esa es toda la razón: a y b dicen dónde está el rectángulo, no qué tan grande es. Deslízalo a cualquier lugar del plano y w y h no cambian, así que el perímetro y el área tampoco pueden cambiar.",
        sentenceStems: [
          "The horizontal side is ___ and the vertical side is ___ .",
          "Perimeter = ___ and area = ___ .",
          "a and b do not appear because ___ .",
        ],
        sentenceStemsEs: [
          "El lado horizontal es ___ y el lado vertical es ___ .",
          "Perímetro = ___ y área = ___ .",
          "a y b no aparecen porque ___ .",
        ],
      },
    ],
  },

  "2-2-group2": {
    add: [
      {
        // Not a computation: a wider bin is a lossy summary, not an error. The
        // lesson's own items already build both histograms of the same 40 scores.
        demand: "reasoning",
        type: "open-response",
        stem: "Two histograms show the SAME 40 test scores — one uses intervals of 5, the other intervals of 20. A classmate says the interval-of-20 histogram is simply wrong because it hides the shape of the data. Is a wider interval WRONG, or just different? Give one question the interval-of-20 display answers BETTER, and one it answers worse.",
        stemEs:
          "Dos histogramas muestran LOS MISMOS 40 puntajes — uno usa intervalos de 5 y el otro de 20. Un compañero dice que el histograma de intervalos de 20 simplemente está mal porque oculta la forma de los datos. ¿Un intervalo más ancho está MAL, o solo es distinto? Da una pregunta que el histograma de 20 responda MEJOR y una que responda peor.",
        modelAnswer:
          "It is not wrong — both histograms show the same 40 scores and neither invents or loses a value. A wider interval is a coarser summary: it trades detail for shape at a glance. The interval-of-20 display answers 'roughly how many students passed, above and below?' better, because two or three tall bars are easier to compare than eight short ones. It answers 'where exactly does the data cluster?' worse — a bin of 50–69 cannot tell you whether the students sat at 51 or at 68. Wrong would mean a bar with the wrong count in it. This is a choice about how much detail the question needs.",
        modelAnswerEs:
          "No está mal — los dos histogramas muestran los mismos 40 puntajes y ninguno inventa ni pierde un valor. Un intervalo más ancho es un resumen más grueso: cambia detalle por forma a simple vista. El histograma de 20 responde mejor '¿más o menos cuántos estudiantes aprobaron, por encima y por debajo?', porque dos o tres barras altas se comparan más fácil que ocho bajitas. Responde peor '¿dónde se agrupan exactamente los datos?' — un intervalo de 50–69 no dice si los estudiantes estaban en 51 o en 68. Estar mal significaría una barra con el conteo equivocado. Esto es una decisión sobre cuánto detalle necesita la pregunta.",
        sentenceStems: [
          "A wider interval is ___ , not ___ , because ___ .",
          "The interval-of-20 display answers ___ better.",
          "It answers ___ worse, because ___ .",
        ],
        sentenceStemsEs: [
          "Un intervalo más ancho es ___ , no ___ , porque ___ .",
          "El histograma de 20 responde mejor ___ .",
          "Responde peor ___ , porque ___ .",
        ],
      },
    ],
  },

  "10-2-group2": {
    add: [
      {
        // Judge a case the definition does not cleanly cover — real symmetry is
        // never exact, so the student has to say what "symmetric" is FOR.
        demand: "generalization",
        type: "open-response",
        stem: "A butterfly's wings are bilaterally symmetric, but if you measured them the two halves would never be EXACTLY identical. Does that mean the butterfly is not symmetric? Write a rule for when 'symmetric' is still a useful description even though the two halves differ, and name one case where the difference would be big enough to matter.",
        stemEs:
          "Las alas de una mariposa tienen simetría bilateral, pero si las midieras las dos mitades nunca serían EXACTAMENTE idénticas. ¿Significa eso que la mariposa no es simétrica? Escribe una regla sobre cuándo 'simétrica' sigue siendo una descripción útil aunque las dos mitades difieran, y nombra un caso donde la diferencia sí importaría.",
        modelAnswer:
          "In mathematics a figure is symmetric when a mirror line maps it exactly onto itself, and no real butterfly meets that test. In nature the useful rule is about scale: call it symmetric when the difference between the halves is small compared with the whole — a wing 2 mm longer on a 60 mm wing is under 4%, and every description built on the symmetry still holds. A case where it matters: if one wing is torn or half the size, predictions built on the mirror line break — you could no longer use one side to describe the other, which is what the symmetry was FOR.",
        modelAnswerEs:
          "En matemáticas una figura es simétrica cuando una línea espejo la lleva exactamente sobre sí misma, y ninguna mariposa real cumple esa prueba. En la naturaleza la regla útil es de escala: dila simétrica cuando la diferencia entre las mitades sea pequeña comparada con el total — un ala 2 mm más larga en un ala de 60 mm es menos del 4%, y toda descripción basada en la simetría sigue valiendo. Un caso donde sí importa: si un ala está rota o mide la mitad, las predicciones basadas en la línea espejo fallan — ya no podrías usar un lado para describir el otro, que es justo para lo que servía la simetría.",
        sentenceStems: [
          "The mathematical definition says ___ , but a real butterfly ___ .",
          "My rule is: call it symmetric when ___ .",
          "The difference would matter if ___ .",
        ],
        sentenceStemsEs: [
          "La definición matemática dice ___ , pero una mariposa real ___ .",
          "Mi regla es: dila simétrica cuando ___ .",
          "La diferencia importaría si ___ .",
        ],
      },
    ],
  },

  "10-5-group2": {
    add: [
      {
        // Checked: unit length 3. 100 ÷ 3 = 33 r 1, so shape 100 is position 1
        // of the unit — the circle. The classmate is wrong on BOTH counts, and
        // the remainder is the rule.
        demand: "generalization",
        type: "open-response",
        stem: "The border repeats circle–square–triangle. A classmate says: 'Shape number 100 must be a triangle, because 100 is even.' Is the reasoning right, the answer right, both, or neither? Then write a rule that finds shape number n for ANY n, and use it on shape 100.",
        stemEs:
          "La cenefa repite círculo–cuadrado–triángulo. Un compañero dice: 'La figura número 100 tiene que ser un triángulo, porque 100 es par.' ¿Es correcto el razonamiento, la respuesta, las dos cosas, o ninguna? Después escribe una regla que encuentre la figura número n para CUALQUIER n, y úsala en la figura 100.",
        modelAnswer:
          "Neither. The reasoning is wrong because the pattern unit has THREE shapes, so whether n is even or odd tells you nothing — evenness would matter for a two-shape unit. The answer is wrong too. The rule: divide n by 3 and read the remainder. Remainder 1 → circle, remainder 2 → square, remainder 0 → triangle. For n = 100: 100 ÷ 3 = 33 remainder 1, so 33 complete units have gone by and shape 100 is the first of the next unit — a circle, not a triangle. Check it on a known one: shape 12 gives 12 ÷ 3 = 4 remainder 0, a triangle, which matches the border.",
        modelAnswerEs:
          "Ninguna. El razonamiento está mal porque la unidad del patrón tiene TRES figuras, así que si n es par o impar no dice nada — la paridad importaría en una unidad de dos figuras. La respuesta también está mal. La regla: divide n entre 3 y lee el residuo. Residuo 1 → círculo, residuo 2 → cuadrado, residuo 0 → triángulo. Para n = 100: 100 ÷ 3 = 33 con residuo 1, así que han pasado 33 unidades completas y la figura 100 es la primera de la siguiente unidad — un círculo, no un triángulo. Compruébalo con una conocida: la figura 12 da 12 ÷ 3 = 4 con residuo 0, un triángulo, que coincide con la cenefa.",
        sentenceStems: [
          "The reasoning is ___ because the pattern unit has ___ shapes.",
          "My rule for shape n is ___ .",
          "For n = 100, ___ , so shape 100 is a ___ .",
        ],
        sentenceStemsEs: [
          "El razonamiento es ___ porque la unidad del patrón tiene ___ figuras.",
          "Mi regla para la figura n es ___ .",
          "Para n = 100, ___ , así que la figura 100 es un ___ .",
        ],
      },
    ],
  },

  "10-1-group2": {
    // The planter question is a bare 8 ÷ 2 wearing a gardening hat, and the
    // lesson keeps a richer planter question in extending[3].
    drop: ["A gardener's planter has an area of 8 square feet"],
    add: [
      {
        // Checked: 8 gal/day × 365 = 2,920/person/yr; ×3 = 8,760; ×6 = 17,520.
        // The arithmetic is right and the MODEL is what needs judging.
        demand: "reasoning",
        type: "open-response",
        stem: "One person saves 8 gallons of water a day, so a household of 3 saves 8,760 gallons a year. A classmate concludes: 'Then a household of 6 saves twice as much — 17,520 gallons.' The arithmetic is correct. Is the CONCLUSION safe? Name one thing about a real house that could make it wrong.",
        stemEs:
          "Una persona ahorra 8 galones de agua al día, así que una casa de 3 personas ahorra 8,760 galones al año. Un compañero concluye: 'Entonces una casa de 6 personas ahorra el doble — 17,520 galones.' La aritmética es correcta. ¿Es segura la CONCLUSIÓN? Nombra algo de una casa real que podría hacerla incorrecta.",
        modelAnswer:
          "The arithmetic checks: 8 × 365 = 2,920 per person, 2,920 × 3 = 8,760, and 2,920 × 6 = 17,520. But the conclusion assumes every extra person saves exactly the same 2,920 gallons, and a real house does not work that way. Six people share the same sinks and the same dishwasher, so some water is used once for the whole household no matter how many live there — those gallons cannot be saved twice. The model is proportional; the house is not entirely. The answer is a reasonable ESTIMATE and an upper bound, not a fact.",
        modelAnswerEs:
          "La aritmética cuadra: 8 × 365 = 2,920 por persona, 2,920 × 3 = 8,760 y 2,920 × 6 = 17,520. Pero la conclusión supone que cada persona adicional ahorra exactamente los mismos 2,920 galones, y una casa real no funciona así. Seis personas comparten los mismos lavabos y el mismo lavavajillas, así que parte del agua se usa una sola vez para toda la casa sin importar cuántos vivan ahí — esos galones no se pueden ahorrar dos veces. El modelo es proporcional; la casa no lo es del todo. La respuesta es una ESTIMACIÓN razonable y un tope máximo, no un hecho.",
        sentenceStems: [
          "The arithmetic is ___ because ___ .",
          "The conclusion assumes ___ .",
          "In a real house, ___ , so the true saving would be ___ .",
        ],
        sentenceStemsEs: [
          "La aritmética es ___ porque ___ .",
          "La conclusión supone ___ .",
          "En una casa real, ___ , así que el ahorro verdadero sería ___ .",
        ],
      },
      {
        // A second deep task: this lesson sat at 15%, the lowest of the thirteen.
        demand: "strategic",
        type: "open-response",
        stem: "A chef, a gardener, and a plumber all use mathematics, but they would not all reach for the same tool. Pick TWO of them, describe one problem each actually has to solve, and say which representation — a table, an equation, or a scale drawing — you would hand each one, and why that one and not the others.",
        stemEs:
          "Un chef, un jardinero y un plomero usan matemáticas, pero no todos usarían la misma herramienta. Elige DOS de ellos, describe un problema real que cada uno tenga que resolver, y di qué representación — una tabla, una ecuación o un dibujo a escala — le darías a cada uno, y por qué esa y no las otras.",
        modelAnswer:
          "Chef: 120 customers, 1 in 4 order soup, 2 cups of broth each — that is 30 servings and 60 cups. a table is the right tool, because the chef re-runs the same question for many different customer counts and wants to read the answer off a row rather than recompute. Gardener: how many plants fit a bed. a scale drawing is the right tool, because the answer depends on the shape of the bed and on spacing, and a drawing shows what an equation hides — a long thin bed and a square bed of equal area do not hold the same number of plants. An equation would suit the plumber best, since pipe volume follows one fixed formula he applies to any measurements.",
        modelAnswerEs:
          "Chef: 120 clientes, 1 de cada 4 pide sopa, 2 tazas de caldo cada una — son 30 porciones y 60 tazas. una tabla es la herramienta correcta, porque el chef repite la misma pregunta con muchos números de clientes y quiere leer la respuesta en una fila en vez de recalcular. Jardinero: cuántas plantas caben en un cantero. un dibujo a escala es lo correcto, porque la respuesta depende de la forma del cantero y del espaciado, y un dibujo muestra lo que una ecuación esconde — un cantero largo y angosto y uno cuadrado de la misma área no admiten la misma cantidad de plantas. Una ecuación le vendría mejor al plomero, ya que el volumen de un tubo sigue una fórmula fija que aplica a cualquier medida.",
        sentenceStems: [
          "The ___ has to solve ___ .",
          "I would give them a ___ because ___ .",
          "A ___ would work less well here because ___ .",
        ],
        sentenceStemsEs: [
          "El ___ tiene que resolver ___ .",
          "Le daría una ___ porque ___ .",
          "Una ___ funcionaría peor aquí porque ___ .",
        ],
      },
    ],
  },

  "10-6-group2": {
    // onLevel[0] is a bare 80 × 6; the reflection items around it carry the lesson.
    drop: ["about 80 riders per turn, 6 turns each hour"],
    add: [
      {
        // Checked: 157 ÷ 2 = 78.5; 10% of 157 = 15.7, ×5 = 78.5. Both exact.
        demand: "strategic",
        type: "open-response",
        stem: "In September you estimated 157 riders. This year you learned percents. Show TWO different ways to find 50% of 157, then say which one you would trust more if you had to do it in your head standing at the fair — and why.",
        stemEs:
          "En septiembre estimaste 157 pasajeros. Este año aprendiste porcentajes. Muestra DOS maneras distintas de hallar el 50% de 157, y después di en cuál confiarías más si tuvieras que hacerlo mentalmente parado en la feria — y por qué.",
        modelAnswer:
          "Way 1 — halving: 50% means half, and 157 ÷ 2 = 78.5. Way 2 — build from 10%: 10% of 157 is 15.7, and five of those is 15.7 × 5 = 78.5. Both give 78.5, which is a good check that neither slipped. In my head at the fair I would trust halving, because it is one step and 157 splits easily as 150 + 7 → 75 + 3.5. The 10% method needs five multiplications of a decimal, which is more places to lose track — but it is the better method when the percent is not 50, like 35%, where halving does not help at all.",
        modelAnswerEs:
          "Manera 1 — dividir a la mitad: 50% significa la mitad, y 157 ÷ 2 = 78.5. Manera 2 — construir desde 10%: el 10% de 157 es 15.7, y cinco de esos son 15.7 × 5 = 78.5. Las dos dan 78.5, lo que confirma que ninguna falló. Mentalmente en la feria confiaría en dividir a la mitad, porque es un solo paso y 157 se separa fácil como 150 + 7 → 75 + 3.5. El método del 10% necesita cinco multiplicaciones de un decimal, que son más lugares donde perderse — pero es el mejor método cuando el porcentaje no es 50, como 35%, donde dividir a la mitad no ayuda en nada.",
        sentenceStems: [
          "Way 1: ___ , which gives ___ .",
          "Way 2: ___ , which gives ___ .",
          "In my head I would use ___ because ___ .",
        ],
        sentenceStemsEs: [
          "Manera 1: ___ , que da ___ .",
          "Manera 2: ___ , que da ___ .",
          "Mentalmente usaría ___ porque ___ .",
        ],
      },
      {
        // Second deep task: this lesson also sat at 15%.
        demand: "reasoning",
        type: "open-response",
        stem: "In September, a rider estimate of 'about 480 per hour' would have been written down and left alone. Now you would check it. Describe how you would decide whether 480 is reasonable WITHOUT recomputing it the same way, and explain what makes a second method a real check rather than just doing the same thing twice.",
        stemEs:
          "En septiembre, una estimación de 'unos 480 pasajeros por hora' se habría anotado y ya. Ahora la revisarías. Describe cómo decidirías si 480 es razonable SIN recalcularlo de la misma manera, y explica qué hace que un segundo método sea una comprobación real y no solo hacer lo mismo dos veces.",
        modelAnswer:
          "I would check it a different way round. If 480 riders go through in an hour, that is 480 ÷ 60 = 8 riders a minute, and a ride that seats about 80 running 6 times an hour means one turn every 10 minutes — 8 a minute matches. Working backwards from the answer uses the same numbers in a different ORDER, so an error in the original multiplication will not repeat itself. Redoing 80 × 6 a second time is not a check, because the same mistake is just as likely the second time; a real check either reverses the operation or reaches the answer through a quantity the first method never used.",
        modelAnswerEs:
          "Lo revisaría al revés. Si pasan 480 personas en una hora, eso es 480 ÷ 60 = 8 personas por minuto, y un juego que lleva unas 80 y da 6 vueltas por hora significa una vuelta cada 10 minutos — 8 por minuto coincide. Trabajar hacia atrás desde la respuesta usa los mismos números en otro ORDEN, así que un error en la multiplicación original no se repetirá. Volver a hacer 80 × 6 no es una comprobación, porque el mismo error es igual de probable la segunda vez; una comprobación real invierte la operación o llega a la respuesta por una cantidad que el primer método nunca usó.",
        sentenceStems: [
          "A different way to check 480 is ___ .",
          "It gives ___ , which ___ the first answer.",
          "Doing the same method twice is not a check because ___ .",
        ],
        sentenceStemsEs: [
          "Otra manera de comprobar 480 es ___ .",
          "Da ___ , lo cual ___ la primera respuesta.",
          "Hacer el mismo método dos veces no es una comprobación porque ___ .",
        ],
      },
    ],
  },
};

/**
 * Apply authored challenge tasks to an inherited practice list.
 * Returns { items, dropped, added } so the generator can report what it did and
 * a validator can assert every declared `drop` actually matched something.
 */
export function challengeFacilitation(lessonId) {
  return CHALLENGE_TASKS[lessonId]?.facilitation || null;
}

export function applyChallengeTasks(lessonId, inherited) {
  const spec = CHALLENGE_TASKS[lessonId];
  if (!spec) return { items: inherited, dropped: [], added: 0, unmatchedDrops: [] };

  const dropped = [];
  const unmatchedDrops = [];
  for (const fragment of spec.drop || []) {
    const needle = fragment.toLowerCase();
    // Match stem OR title: error-analysis items carry their identity in
    // `title` and have no stem, so a stem-only matcher could never drop one.
    const hit = inherited.find((it) =>
      `${it.stem || ""} ${it.title || ""}`.toLowerCase().includes(needle),
    );
    if (hit) dropped.push(hit);
    else unmatchedDrops.push(fragment);
  }

  const items = inherited.filter((it) => !dropped.includes(it)).concat(spec.add || []);
  return { items, dropped, added: (spec.add || []).length, unmatchedDrops };
}
