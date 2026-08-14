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
    const hit = inherited.find((it) =>
      String(it.stem || "")
        .toLowerCase()
        .includes(needle),
    );
    if (hit) dropped.push(hit);
    else unmatchedDrops.push(fragment);
  }

  const items = inherited.filter((it) => !dropped.includes(it)).concat(spec.add || []);
  return { items, dropped, added: (spec.add || []).length, unmatchedDrops };
}
