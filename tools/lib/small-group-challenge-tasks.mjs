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
    ],
  },

  "9-3-group2": {
    // ext6 is one multiplication the guided bank now rehearses; ext7 is
    // definition recall. The lesson also had no open-response anywhere — the
    // added task is the missing written-justification artifact.
    drop: ["What is the total cost of 2 months of membership", "what does m represent"],
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
