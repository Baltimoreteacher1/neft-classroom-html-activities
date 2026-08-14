/**
 * small-group-authored-banks.mjs — parallel-practice banks written for a
 * specific lesson's objective, replacing the generated family for that lesson.
 *
 * WHY THIS EXISTS
 *
 * buildParallelPractice() picks a practice family from LEGACY_TOPIC — a mapping
 * from each lesson to the strand it teaches. That mapping is deliberate and
 * mostly right: 2-11 "Add and Subtract Decimals" and 2-12 "Multiply Decimals"
 * get decimal families, which is exactly correct.
 *
 * But a mapping records a topic, not an objective, and for two lessons the
 * distance between those showed:
 *
 *   1-1 "Math is Mine" (MPP.3) — "describe the ways we are all doers of math,
 *   and compare my math story with a classmate's" — received twelve context-free
 *   exact decimal products (4.38 × 1.2 … 12.08 × 1.45, each first factor 0.70
 *   above the last). The mapping's own comment gives the reason as "estimating
 *   the Ferris wheel, a product -> multiply", and the lesson really does estimate
 *   a product — but the generated items contained no Ferris wheel, no estimation,
 *   and no comparing of approaches. They realized the mapping's DOMAIN and not
 *   its REASONING, and in the rendered lesson those drills were 12 of the 18
 *   items a struggling student met, in the Guided phase, unlabelled.
 *
 * THE RULE THIS ENCODES
 *
 *   A parallel-practice family must be justified by the current canonical
 *   objective, not merely by a historical mapping or legacy lesson coordinate.
 *
 * Legacy mappings stay useful infrastructure. They cannot by themselves
 * establish instructional alignment. Where a mapping is intentionally used for
 * spiral or prerequisite fluency rather than the current objective, that purpose
 * has to be explicit and must not masquerade as current-objective guided
 * practice.
 *
 * AUTHORING STANDARD — every task here has been solved and checked, and every
 * number, estimate and claim verified against the lesson's own context. Banks
 * are SHORT on purpose: a teacher-led group of 4-6 students is better served by
 * six tasks worth discussing than by twelve worth finishing.
 */

/**
 * 1-1 · MPP.3 — "Math is Mine"
 *
 * Objective: describe the ways we are all doers of math, and compare my math
 * story with a classmate's. Worked example: "Watch me estimate the Ferris
 * wheel" — 20 cars, about 4 people per car, "about 80 people", with the line
 * "an estimate is a reasoned answer that is close enough to be useful". Key
 * idea: "We do it differently, and sharing how we do it makes all of us better
 * at it."
 *
 * So the mathematics genuinely in this lesson is estimating a product, choosing
 * a strategy, and comparing approaches — which is also what MPP.3 asks students
 * to describe and compare. The bank runs that arc once: estimate, choose a
 * strategy, explain it, compare two approaches, judge a third, then transfer.
 *
 * ARITHMETIC CHECKED
 *   19 × 4 = 76 ; 20 × 4 = 80 ; |80 − 76| = 4 (≈5% high)
 *   22 × 4 = 88 ; 20 × 4 = 80
 *   200 ÷ 22 ≈ 9.1 riders per car, against a stated capacity of about 4
 *   31 × 3 = 93 ; 30 × 3 = 90
 *   rounding BOTH factors up cannot produce an estimate below the exact product
 */
const LESSON_1_1_SUPPORT = [
  {
    // 1. ESTIMATE — the worked example's move, with new numbers, asked as a
    // judgement so a student who rounds is right rather than "not exact".
    type: "multiple-choice",
    stem: "Tonight the Ferris wheel has 19 cars, and about 4 people fit in each car. Mia rounds 19 up to 20 and says, “About 80 people can ride at one time.” Is Mia's estimate reasonable?",
    stemEs:
      "Esta noche la rueda de la fortuna tiene 19 cabinas y en cada una caben unas 4 personas. Mía redondea 19 a 20 y dice: “Unas 80 personas pueden subir a la vez”. ¿Es razonable su estimación?",
    choices: [
      "Yes — 20 is close to 19, and 20 × 4 = 80 is close to the exact 76",
      "No — she has to use 19, so 76 is the only answer allowed",
      "No — rounding up always makes an estimate too big to be useful",
      "Yes, but only because 80 is a round number",
    ],
    choicesEs: [
      "Sí — 20 está cerca de 19, y 20 × 4 = 80 está cerca del exacto 76",
      "No — tiene que usar 19, así que 76 es la única respuesta permitida",
      "No — redondear hacia arriba siempre hace que la estimación sea demasiado grande para servir",
      "Sí, pero solo porque 80 es un número redondo",
    ],
    correctIndex: 0,
    explanation:
      "19 × 4 = 76 and 20 × 4 = 80. Mia's estimate is 4 riders high — close enough to plan with, which is what an estimate is for.",
    explanationEs:
      "19 × 4 = 76 y 20 × 4 = 80. La estimación de Mía es 4 pasajeros más alta: lo bastante cerca para planear, que es para lo que sirve una estimación.",
    choiceFeedback: [
      "",
      "An estimate is allowed to change a number on purpose. Compare 80 with the exact 76 — how far off is it?",
      "Check the size of the gap: 80 against 76. Rounding up moved the answer by 4 riders.",
      "A round number is easier to say, but what makes it reasonable is how close it lands to 76.",
    ],
    choiceFeedbackEs: [
      "",
      "Una estimación puede cambiar un número a propósito. Compara 80 con el exacto 76: ¿qué tan lejos está?",
      "Fíjate en el tamaño de la diferencia: 80 frente a 76. Redondear movió la respuesta 4 pasajeros.",
      "Un número redondo es más fácil de decir, pero lo razonable es qué tan cerca queda de 76.",
    ],
    hints: [
      "Work out the exact answer first: 19 × 4.",
      "Now compare it with Mia's 80. How many riders apart are they?",
    ],
    hintsEs: [
      "Primero calcula la respuesta exacta: 19 × 4.",
      "Ahora compárala con el 80 de Mía. ¿Cuántos pasajeros de diferencia hay?",
    ],
  },
  {
    // 2. CHOOSE A STRATEGY — the decision, isolated from the computing.
    type: "multiple-choice",
    stem: "You want to estimate 19 × 4 in your head. Which move makes the numbers friendlier without changing the answer much?",
    stemEs:
      "Quieres estimar 19 × 4 mentalmente. ¿Qué movimiento hace los números más fáciles sin cambiar mucho la respuesta?",
    choices: [
      "Round 19 to 20 — then 20 × 4 is a double of a double",
      "Round 4 up to 10, because tens are the easiest to multiply",
      "Add 19 + 4 first, then multiply the total by 2",
      "Rewrite 19 as 19.0 so it looks like a decimal",
    ],
    choicesEs: [
      "Redondear 19 a 20 — así 20 × 4 es el doble de un doble",
      "Redondear 4 a 10, porque las decenas son las más fáciles de multiplicar",
      "Sumar 19 + 4 primero y luego multiplicar el total por 2",
      "Escribir 19 como 19.0 para que parezca un decimal",
    ],
    correctIndex: 0,
    explanation:
      "20 is one step from 19, and 20 × 4 is easy: double 20 to 40, double again to 80. Moving 4 up to 10 would more than double the riders in every car.",
    explanationEs:
      "20 está a un paso de 19, y 20 × 4 es fácil: el doble de 20 es 40, y el doble otra vez es 80. Subir el 4 a 10 más que duplicaría los pasajeros de cada cabina.",
    choiceFeedback: [
      "",
      "How many riders would that put in one car? Compare it with the 4 the problem gives.",
      "Adding joins two different quantities — cars and riders. Which operation matches “4 in each of 19 cars”?",
      "Writing 19.0 does not make the multiplication any easier — the numbers are the same.",
    ],
    choiceFeedbackEs: [
      "",
      "¿Cuántos pasajeros pondría eso en una cabina? Compáralo con los 4 que da el problema.",
      "Sumar junta dos cantidades distintas: cabinas y pasajeros. ¿Qué operación corresponde a “4 en cada una de 19 cabinas”?",
      "Escribir 19.0 no hace la multiplicación más fácil: los números son los mismos.",
    ],
    hints: [
      "A friendly number is one you can multiply without writing anything down.",
      "Which of the two numbers is already almost friendly — the 19 or the 4?",
    ],
    hintsEs: [
      "Un número amigable es uno que puedes multiplicar sin escribir nada.",
      "¿Cuál de los dos números ya es casi amigable: el 19 o el 4?",
    ],
  },
  {
    // 3. EXPLAIN — says what the strategy costs as well as what it buys, so the
    // explanation is about reasoning rather than about the answer.
    type: "open-response",
    stem: "Mia rounded 19 cars up to 20 before multiplying. Explain why that made the math easier — and say what she gave up by rounding.",
    stemEs:
      "Mía redondeó 19 cabinas a 20 antes de multiplicar. Explica por qué eso hizo la matemática más fácil, y di qué perdió al redondear.",
    modelAnswer:
      "Rounding 19 to 20 made it easier because 20 × 4 is a double of a double — 40, then 80 — and I can do that in my head. What she gave up is exactness: 80 is 4 riders more than the true 76. That trade is fine here, because she only needs a number close enough to be useful.",
    modelAnswerEs:
      "Redondear 19 a 20 lo hizo más fácil porque 20 × 4 es el doble de un doble — 40 y luego 80 — y eso lo puedo hacer mentalmente. Lo que perdió es la exactitud: 80 es 4 pasajeros más que el verdadero 76. Ese intercambio está bien aquí, porque solo necesita un número lo bastante cercano para servir.",
    sentenceStems: [
      "Rounding 19 to 20 made it easier because ___ .",
      "Her estimate is ___ riders away from the exact answer.",
      "That is a fair trade here because ___ .",
    ],
  },
  {
    // 4. COMPARE TWO APPROACHES — the heart of MPP.3. Both students are right;
    // the task is to say what each approach is FOR.
    type: "multiple-choice",
    stem: "A different wheel has 22 cars holding about 4 people each. Ana rounds 22 down to 20 and says “about 80.” Ben multiplies 22 × 4 and says “exactly 88.” Which statement describes both approaches fairly?",
    stemEs:
      "Otra rueda tiene 22 cabinas donde caben unas 4 personas en cada una. Ana redondea 22 a 20 y dice “unas 80”. Ben multiplica 22 × 4 y dice “exactamente 88”. ¿Qué afirmación describe con justicia las dos formas?",
    choices: [
      "Ana's is fast for a quick head count; Ben's is what the operator needs to sell tickets",
      "Ana is wrong, because she changed a number that was given",
      "Ben is wrong, because an estimate has to be a round number",
      "Only one of them can be doing real math",
    ],
    choicesEs: [
      "La de Ana sirve para un conteo rápido; la de Ben es la que el operador necesita para vender boletos",
      "Ana está equivocada, porque cambió un número que le dieron",
      "Ben está equivocado, porque una estimación tiene que ser un número redondo",
      "Solo una de las dos personas está haciendo matemática de verdad",
    ],
    correctIndex: 0,
    explanation:
      "22 × 4 = 88, and 20 × 4 = 80. Both are good mathematics doing different jobs: Ana's is quick and close, Ben's is exact. Choosing between them is a decision about what the number is for.",
    explanationEs:
      "22 × 4 = 88 y 20 × 4 = 80. Ambas son buena matemática con trabajos distintos: la de Ana es rápida y cercana, la de Ben es exacta. Elegir entre ellas es decidir para qué sirve el número.",
    choiceFeedback: [
      "",
      "Estimating means changing a number on purpose. Is 80 close enough to 88 to be useful?",
      "Ben was not estimating at all — he answered exactly. Is that allowed too?",
      "Look at what each number would be used for before deciding either one is not math.",
    ],
    choiceFeedbackEs: [
      "",
      "Estimar significa cambiar un número a propósito. ¿Está 80 lo bastante cerca de 88 para servir?",
      "Ben no estaba estimando: respondió exactamente. ¿Eso también se vale?",
      "Mira para qué se usaría cada número antes de decidir que alguno no es matemática.",
    ],
    hints: [
      "Work out both numbers first: 20 × 4 and 22 × 4.",
      "Now ask what each one is good for — a quick guess, or selling tickets?",
    ],
    hintsEs: [
      "Primero calcula los dos números: 20 × 4 y 22 × 4.",
      "Ahora pregunta para qué sirve cada uno: ¿una idea rápida o vender boletos?",
    ],
  },
  {
    // 5. JUDGE A THIRD ESTIMATE — reasonableness by reasoning back to the
    // quantity per car, not by recomputing.
    type: "multiple-choice",
    stem: "A third student looks at the same 22-car wheel and says, “About 200 people can ride at one time.” Why is that estimate not reasonable?",
    stemEs:
      "Otro estudiante mira la misma rueda de 22 cabinas y dice: “Unas 200 personas pueden subir a la vez”. ¿Por qué esa estimación no es razonable?",
    choices: [
      "It would mean about 9 people squeezed into every car, not about 4",
      "It is wrong only because 200 is not a multiple of 4",
      "It is fine — an estimate can be any number you like",
      "It is wrong because 200 is too round to be an estimate",
    ],
    choicesEs: [
      "Significaría unas 9 personas apretadas en cada cabina, no unas 4",
      "Está mal solo porque 200 no es múltiplo de 4",
      "Está bien: una estimación puede ser cualquier número",
      "Está mal porque 200 es demasiado redondo para ser una estimación",
    ],
    correctIndex: 0,
    explanation:
      "200 riders shared across 22 cars is about 9 per car (200 ÷ 22 ≈ 9), and the cars hold about 4. Checking an estimate against the quantity it came from is how you catch one that has drifted.",
    explanationEs:
      "200 pasajeros repartidos en 22 cabinas son unos 9 por cabina (200 ÷ 22 ≈ 9), y en las cabinas caben unas 4. Comprobar una estimación contra la cantidad de la que salió es como se detecta una que se desvió.",
    choiceFeedback: [
      "",
      "Estimates rarely land on multiples. Try dividing 200 by the 22 cars instead.",
      "An estimate still has to fit the situation. How many riders per car would 200 need?",
      "Round numbers are fine in estimates. The problem is how many people that puts in one car.",
    ],
    choiceFeedbackEs: [
      "",
      "Las estimaciones rara vez caen en múltiplos. Mejor divide 200 entre las 22 cabinas.",
      "Una estimación todavía tiene que caber en la situación. ¿Cuántos pasajeros por cabina necesitaría 200?",
      "Los números redondos están bien en una estimación. El problema es cuántas personas pone en una cabina.",
    ],
    hints: [
      "If 200 people rode at once, how many would be in each of the 22 cars?",
      "Divide 200 by 22. Compare that with the “about 4” the problem gives.",
    ],
    hintsEs: [
      "Si 200 personas subieran a la vez, ¿cuántas irían en cada una de las 22 cabinas?",
      "Divide 200 entre 22. Compáralo con las “unas 4” que da el problema.",
    ],
  },
  {
    // 6. TRANSFER, student's own strategy — and name it, which is the MPP.3
    // move: being able to say how you did it so someone else can compare.
    type: "open-response",
    stem: "The same fair has a carousel with 31 horses. About 1 rider fits on each horse, and it runs 3 times an hour. Estimate about how many people ride the carousel in one hour. Use any strategy you like — then name the strategy you used.",
    stemEs:
      "La misma feria tiene un carrusel con 31 caballos. En cada caballo cabe aproximadamente 1 persona, y funciona 3 veces por hora. Estima cuántas personas se suben al carrusel en una hora. Usa la estrategia que quieras y luego di qué estrategia usaste.",
    modelAnswer:
      "I rounded 31 down to 30 because 30 is friendly. 30 riders each turn, 3 turns an hour, so 30 × 3 = about 90 people in an hour. The exact number is 93, so my estimate is 3 low. I used rounding to a friendly number.",
    modelAnswerEs:
      "Redondeé 31 a 30 porque 30 es un número amigable. 30 personas por vuelta, 3 vueltas por hora, así que 30 × 3 = unas 90 personas en una hora. El número exacto es 93, así que mi estimación queda 3 por debajo. Usé redondeo a un número amigable.",
    sentenceStems: [
      "I estimated by ___ .",
      "My estimate is about ___ riders in one hour.",
      "I chose that strategy because ___ .",
    ],
  },
];

const LESSON_1_1_CHALLENGE = [
  {
    // 1. Which estimate is more USEFUL — a step past "is it reasonable".
    type: "multiple-choice",
    stem: "A wheel has 23 cars holding about 4 riders each. Dev rounds 23 to 20 and says “about 80.” Priya rounds to 25 and says “about 100.” The operator needs to know whether one full turn can clear a line of 95 people. Whose estimate is more useful here, and why?",
    stemEs:
      "Una rueda tiene 23 cabinas donde caben unos 4 pasajeros en cada una. Dev redondea 23 a 20 y dice “unas 80”. Priya redondea a 25 y dice “unas 100”. El operador necesita saber si una vuelta completa puede atender una fila de 95 personas. ¿Qué estimación es más útil aquí y por qué?",
    choices: [
      "Dev's — it is below the exact 92, so it will not promise the operator more room than the wheel has",
      "Priya's — a bigger estimate is always the safer one to plan with",
      "Neither — only the exact answer 92 can be used for a decision",
      "Both equally — they are both estimates of the same quantity",
    ],
    choicesEs: [
      "La de Dev — queda por debajo del exacto 92, así que no le promete al operador más espacio del que hay",
      "La de Priya — una estimación más grande siempre es la más segura para planear",
      "Ninguna — solo la respuesta exacta 92 sirve para decidir",
      "Las dos igual — ambas estiman la misma cantidad",
    ],
    correctIndex: 0,
    explanation:
      "23 × 4 = 92, so one turn cannot clear 95. Dev's 80 is low and keeps the operator honest; Priya's 100 is high and would suggest the line clears when it does not. Which direction an estimate errs in matters as much as how close it is.",
    explanationEs:
      "23 × 4 = 92, así que una vuelta no alcanza para 95. El 80 de Dev queda bajo y mantiene honesto al operador; el 100 de Priya queda alto y sugeriría que la fila se atiende cuando no es así. La dirección del error importa tanto como la cercanía.",
    choiceFeedback: [
      "",
      "Work out the exact number first. Would Priya's 100 tell the operator the line clears?",
      "Estimates are used for decisions all the time. The question is which one points the right way.",
      "They are equally close to 92 — but they point in opposite directions. Does that matter here?",
    ],
    choiceFeedbackEs: [
      "",
      "Primero calcula el número exacto. ¿El 100 de Priya diría que la fila se atiende?",
      "Las estimaciones se usan para decidir todo el tiempo. La pregunta es cuál apunta en la dirección correcta.",
      "Están igual de cerca de 92, pero apuntan en direcciones opuestas. ¿Importa eso aquí?",
    ],
    hints: [
      "Find the exact number of riders in one turn: 23 × 4.",
      "The line is 95. Which estimate would make the operator think one turn is enough?",
    ],
    hintsEs: [
      "Halla el número exacto de pasajeros en una vuelta: 23 × 4.",
      "La fila es de 95. ¿Qué estimación haría creer al operador que una vuelta basta?",
    ],
  },
  {
    // 2. GENERALIZE — a claim about rounding, true for these positive
    // quantities, and checkable by trying to break it.
    type: "multiple-choice",
    stem: "Claim: “If you round BOTH numbers up before multiplying, your estimate can never come out below the exact answer.” For counts like cars and riders, is this claim always, sometimes, or never true?",
    stemEs:
      "Afirmación: “Si redondeas hacia arriba LOS DOS números antes de multiplicar, tu estimación nunca puede quedar por debajo de la respuesta exacta”. Para conteos como cabinas y pasajeros, ¿esta afirmación es siempre, a veces o nunca verdadera?",
    choices: [
      "Always — each factor got bigger, so the product cannot get smaller",
      "Sometimes — it depends which number you round first",
      "Sometimes — it fails when the two numbers are close together",
      "Never — rounding up changes the answer unpredictably",
    ],
    choicesEs: [
      "Siempre — cada factor se hizo más grande, así que el producto no puede achicarse",
      "A veces — depende de cuál número redondees primero",
      "A veces — falla cuando los dos números están cerca uno del otro",
      "Nunca — redondear hacia arriba cambia la respuesta de forma impredecible",
    ],
    correctIndex: 0,
    explanation:
      "Try to break it and you cannot: 19 × 4 = 76 goes to 20 × 5 = 100; 23 × 4 = 92 goes to 25 × 4 = 100. Making each factor larger can only make the product larger, so an estimate built this way is always at or above the exact answer — which is why it is the wrong move when you must not overpromise.",
    explanationEs:
      "Intenta romperla y no puedes: 19 × 4 = 76 pasa a 20 × 5 = 100; 23 × 4 = 92 pasa a 25 × 4 = 100. Hacer cada factor más grande solo puede agrandar el producto, así que una estimación así siempre queda igual o por encima del exacto — por eso es el movimiento equivocado cuando no debes prometer de más.",
    choiceFeedback: [
      "",
      "Order does not change a product. Try 20 × 5 and 5 × 20.",
      "Try a close pair, like 19 and 18, rounding both up. Does the estimate ever land below?",
      "Rounding up cannot lower a product — check 19 × 4 = 76 against 20 × 5 = 100.",
    ],
    choiceFeedbackEs: [
      "",
      "El orden no cambia un producto. Prueba 20 × 5 y 5 × 20.",
      "Prueba un par cercano, como 19 y 18, redondeando ambos hacia arriba. ¿Alguna vez queda por debajo?",
      "Redondear hacia arriba no puede bajar un producto: compara 19 × 4 = 76 con 20 × 5 = 100.",
    ],
    hints: [
      "Test it. Pick a pair, round both up, and compare with the exact product.",
      "Now try to find one that breaks it. What happens to a product when each factor grows?",
    ],
    hintsEs: [
      "Pruébalo. Elige un par, redondea ambos hacia arriba y compara con el producto exacto.",
      "Ahora intenta encontrar uno que la rompa. ¿Qué le pasa a un producto cuando cada factor crece?",
    ],
  },
  {
    // 3. CREATE — construct an estimate to a constraint, which is harder than
    // judging one and exposes whether the direction of rounding is understood.
    type: "open-response",
    stem: "The wheel has 23 cars holding about 4 riders each. Write an estimate that is deliberately a little LOW, and say how you made it low on purpose. Then say when a low estimate would be the responsible one to give.",
    stemEs:
      "La rueda tiene 23 cabinas donde caben unos 4 pasajeros. Escribe una estimación que quede un poco POR DEBAJO a propósito y di cómo la hiciste quedar baja. Luego di cuándo una estimación baja sería la responsable.",
    modelAnswer:
      "I rounded 23 down to 20 and kept 4, giving about 80. The exact answer is 92, so mine is 12 low. I made it low by rounding the number of cars down instead of up. A low estimate is the responsible one when running out would be the bad outcome — telling people a ride holds fewer than it does is safer than promising seats that do not exist.",
    modelAnswerEs:
      "Redondeé 23 a 20 y dejé el 4, lo que da unas 80. La respuesta exacta es 92, así que la mía queda 12 por debajo. La hice baja redondeando las cabinas hacia abajo en vez de hacia arriba. Una estimación baja es la responsable cuando quedarse corto sería el mal resultado: decir que caben menos personas es más seguro que prometer asientos que no existen.",
    sentenceStems: [
      "My low estimate is about ___ riders.",
      "I made it low by ___ .",
      "A low estimate is the responsible one when ___ .",
    ],
  },
  {
    // 4. COMPARE STRATEGIES — rounding against compatible numbers, both valid.
    type: "multiple-choice",
    stem: "Estimating 23 × 4, Sam rounds 23 to 20. Nia instead splits it: 23 × 4 = (20 × 4) + (3 × 4). Which comparison is accurate?",
    stemEs:
      "Al estimar 23 × 4, Sam redondea 23 a 20. Nia en cambio lo separa: 23 × 4 = (20 × 4) + (3 × 4). ¿Qué comparación es correcta?",
    choices: [
      "Sam's is faster but loses 12 riders; Nia's takes one more step and lands exactly on 92",
      "Both give exactly 92, so there is no difference between them",
      "Nia's is an estimate too, because she broke the number apart",
      "Sam's is the only real estimate, so Nia's method does not count",
    ],
    choicesEs: [
      "La de Sam es más rápida pero pierde 12 pasajeros; la de Nia da un paso más y llega exactamente a 92",
      "Las dos dan exactamente 92, así que no hay diferencia",
      "La de Nia también es una estimación, porque separó el número",
      "La de Sam es la única estimación real, así que el método de Nia no cuenta",
    ],
    correctIndex: 0,
    explanation:
      "Sam gets 20 × 4 = 80. Nia gets 80 + 12 = 92, which is exact — decomposing does not lose anything, it just reorganizes the work. Two students, two defensible routes, different trade-offs.",
    explanationEs:
      "Sam obtiene 20 × 4 = 80. Nia obtiene 80 + 12 = 92, que es exacto: descomponer no pierde nada, solo reorganiza el trabajo. Dos estudiantes, dos caminos defendibles, distintos intercambios.",
    choiceFeedback: [
      "",
      "Work Sam's out: 20 × 4. Does it land on 92?",
      "Add up Nia's two pieces. Is 80 + 12 an estimate or the exact answer?",
      "Both are mathematics. The question is what each one costs and buys.",
    ],
    choiceFeedbackEs: [
      "",
      "Calcula la de Sam: 20 × 4. ¿Llega a 92?",
      "Suma las dos partes de Nia. ¿80 + 12 es una estimación o la respuesta exacta?",
      "Las dos son matemática. La pregunta es qué cuesta y qué da cada una.",
    ],
    hints: [
      "Finish both methods before comparing them.",
      "Nia's pieces are 20 × 4 and 3 × 4. What do they add to?",
    ],
    hintsEs: [
      "Termina los dos métodos antes de compararlos.",
      "Las partes de Nia son 20 × 4 y 3 × 4. ¿Cuánto suman?",
    ],
  },
  {
    // 5. CHANGE THE CONSTRAINT — the estimate has to survive a changed
    // situation, which is where a memorized procedure stops helping.
    type: "multiple-choice",
    stem: "The operator removes 3 cars for repairs, so the 23-car wheel now runs 20 cars, and adds a fifth seat to every car. Without multiplying it out, what happens to the number of riders in one turn?",
    stemEs:
      "El operador quita 3 cabinas por reparación, así que la rueda de 23 ahora usa 20, y agrega un quinto asiento a cada cabina. Sin multiplicar, ¿qué pasa con el número de pasajeros en una vuelta?",
    choices: [
      "It goes up — losing 3 cars costs about 12 riders, but a fifth seat in 20 cars adds 20",
      "It stays the same — one change up and one change down cancel out",
      "It goes down — removing cars always matters more than adding seats",
      "There is no way to tell without doing the multiplication",
    ],
    choicesEs: [
      "Sube — perder 3 cabinas cuesta unos 12 pasajeros, pero un quinto asiento en 20 cabinas suma 20",
      "Se queda igual — un cambio hacia arriba y otro hacia abajo se cancelan",
      "Baja — quitar cabinas siempre pesa más que agregar asientos",
      "No hay forma de saberlo sin hacer la multiplicación",
    ],
    correctIndex: 0,
    explanation:
      "Before: 23 × 4 = 92. After: 20 × 5 = 100. The 3 lost cars were carrying about 4 each (−12), while the extra seat is added in all 20 remaining cars (+20). Net gain of 8, and you can see it without computing either product.",
    explanationEs:
      "Antes: 23 × 4 = 92. Después: 20 × 5 = 100. Las 3 cabinas perdidas llevaban unos 4 cada una (−12), mientras que el asiento extra se agrega en las 20 cabinas restantes (+20). Ganancia neta de 8, y se ve sin calcular ninguno de los productos.",
    choiceFeedback: [
      "",
      "Count each change separately: how many riders leave, and how many arrive?",
      "How many riders does one extra seat add across 20 cars? Compare that with what 3 cars carried.",
      "You can reason it out: 3 cars at about 4 riders, against one extra seat in 20 cars.",
    ],
    choiceFeedbackEs: [
      "",
      "Cuenta cada cambio por separado: ¿cuántos pasajeros se van y cuántos llegan?",
      "¿Cuántos pasajeros agrega un asiento extra en 20 cabinas? Compáralo con lo que llevaban 3 cabinas.",
      "Puedes razonarlo: 3 cabinas con unos 4 pasajeros, frente a un asiento extra en 20 cabinas.",
    ],
    hints: [
      "How many riders did the 3 removed cars carry?",
      "How many riders does one more seat add, if every one of the 20 cars gets one?",
    ],
    hintsEs: [
      "¿Cuántos pasajeros llevaban las 3 cabinas quitadas?",
      "¿Cuántos pasajeros agrega un asiento más, si cada una de las 20 cabinas recibe uno?",
    ],
  },
  {
    // 6. TRANSFER + COMPARE — the MPP.3 close: solve it your way, then say how
    // someone else's way would differ. Comparing is the objective, not a bonus.
    type: "open-response",
    stem: "At the same fair, a food stand sells about 38 drinks an hour and is open 7 hours. Estimate the drinks sold in a day, using a strategy of your choice. Then describe a DIFFERENT strategy a classmate could reasonably use, and say what each one is better for.",
    stemEs:
      "En la misma feria, un puesto vende unas 38 bebidas por hora y abre 7 horas. Estima las bebidas vendidas en un día usando la estrategia que prefieras. Luego describe una estrategia DISTINTA que un compañero podría usar con razón, y di para qué es mejor cada una.",
    modelAnswer:
      "I rounded 38 up to 40 and multiplied: 40 × 7 = about 280 drinks. The exact answer is 266, so mine is 14 high — good for making sure the stand orders enough. A classmate could decompose instead: (30 × 7) + (8 × 7) = 210 + 56 = 266 exactly. Rounding is faster for a quick order; decomposing is better when the number has to be right.",
    modelAnswerEs:
      "Redondeé 38 a 40 y multipliqué: 40 × 7 = unas 280 bebidas. La respuesta exacta es 266, así que la mía queda 14 por encima — sirve para asegurarse de que el puesto pida suficiente. Un compañero podría descomponer: (30 × 7) + (8 × 7) = 210 + 56 = 266 exacto. Redondear es más rápido para un pedido rápido; descomponer es mejor cuando el número tiene que ser exacto.",
    sentenceStems: [
      "My strategy was ___ , and my estimate is about ___ drinks.",
      "A classmate could instead ___ .",
      "Mine is better when ___ , and theirs is better when ___ .",
    ],
  },
];

/**
 * 1-2 · 5.NF.B.4 — "Math is Exploring and Thinking"
 *
 * Objective: make sense of a problem, plan a strategy, and use FRACTIONS OF A
 * WHOLE NUMBER to compare quantities. Language objective: explain the plan using
 * "we know", "we don't know", "my strategy is ___". Key idea: make sense, plan,
 * check, and try another strategy at a dead end.
 *
 * The mapped family gave this lesson decimal ADDITION ("decomposing 105.76 ->
 * add and subtract decimals"). Its objective is fractions of a whole number used
 * to COMPARE — a different operation on different numbers, and no comparing.
 *
 * The bank uses the lesson's own Notice-and-Wonder: three students walking
 * different routes. That context carries the objective exactly — each student
 * has walked a fraction of a different whole, so comparing requires finding the
 * quantities first, which is the trap the lesson is built to expose.
 *
 * ARITHMETIC CHECKED
 *   1/2 of 24 = 12 ; 3/4 of 20 = 15 ; 1/4 of 20 = 5 (unit-fraction-only error)
 *   2/3 of 18 = 12 (ties Ana) ; 1/2 of 40 = 20 > 15 (breaks "bigger fraction wins")
 *   2/3 of 21 = 14 (reverse) ; 3/2 of 8 = 12 > 8 (breaks "always smaller")
 *   3/4 of 24 = 18 ; 2/3 of 27 = 18 ; 3/4 of 20 both ways = 15
 *   2/3 of 14 = 9 1/3 (14 is not divisible by 3)
 */
const LESSON_1_2_SUPPORT = [
  {
    // 1. MAKE SENSE — name the question before touching a number. This is the
    // planning half of the objective, and it is where the lesson starts.
    type: "multiple-choice",
    stem: "Ana's route is 24 blocks long and she has walked 1/2 of it. Ben's route is 20 blocks and he has walked 3/4 of it. Before you calculate anything: which question do you have to answer to tell who has walked farther?",
    stemEs:
      "La ruta de Ana mide 24 cuadras y ha caminado 1/2 de ella. La ruta de Ben mide 20 cuadras y ha caminado 3/4 de ella. Antes de calcular nada: ¿qué pregunta tienes que responder para saber quién ha caminado más lejos?",
    choices: [
      "How many blocks each student has actually walked",
      "Whose whole route is longer",
      "Which student started walking first",
      "How many blocks Ana still has left",
    ],
    choicesEs: [
      "Cuántas cuadras ha caminado realmente cada estudiante",
      "Cuál ruta completa es más larga",
      "Cuál estudiante empezó a caminar primero",
      "Cuántas cuadras le faltan a Ana",
    ],
    correctIndex: 0,
    explanation:
      "The fractions are of different whole routes, so they cannot be compared directly. Turning each fraction into a number of blocks is the plan.",
    explanationEs:
      "Las fracciones son de rutas completas distintas, así que no se pueden comparar directamente. Convertir cada fracción en un número de cuadras es el plan.",
    hints: [
      "You are comparing distances. What unit would a distance be measured in here?",
      "Each fraction is a fraction OF something different. What do you need before you can compare?",
    ],
    hintsEs: [
      "Estás comparando distancias. ¿En qué unidad se mediría una distancia aquí?",
      "Cada fracción es una fracción DE algo distinto. ¿Qué necesitas antes de poder comparar?",
    ],
  },
  {
    // 2. FRACTION OF A WHOLE NUMBER — one quantity, cleanly.
    type: "multiple-choice",
    stem: "Ana has walked 1/2 of her 24-block route. How many blocks has she walked?",
    stemEs: "Ana ha caminado 1/2 de su ruta de 24 cuadras. ¿Cuántas cuadras ha caminado?",
    choices: ["12 blocks", "24 blocks", "2 blocks", "48 blocks"],
    choicesEs: ["12 cuadras", "24 cuadras", "2 cuadras", "48 cuadras"],
    correctIndex: 0,
    explanation: "1/2 of 24 means 24 split into 2 equal parts: 24 ÷ 2 = 12 blocks.",
    explanationEs: "1/2 de 24 significa 24 dividido en 2 partes iguales: 24 ÷ 2 = 12 cuadras.",
    choiceFeedback: [
      "",
      "That is the whole route, not the part she has walked.",
      "That is the denominator, not a number of blocks. Split the 24 into 2 equal parts.",
      "That doubles the route. Half of something is smaller than the whole.",
    ],
    choiceFeedbackEs: [
      "",
      "Esa es la ruta completa, no la parte que ha caminado.",
      "Ese es el denominador, no un número de cuadras. Divide las 24 en 2 partes iguales.",
      "Eso duplica la ruta. La mitad de algo es menor que el entero.",
    ],
    hints: ["Split 24 into 2 equal parts.", "24 ÷ 2 = ___ ."],
    hintsEs: ["Divide 24 en 2 partes iguales.", "24 ÷ 2 = ___ ."],
  },
  {
    // 3. THE OTHER QUANTITY, then the comparison. The 5-block distractor is the
    // unit-fraction-only error: finding 1/4 and forgetting the 3.
    type: "multiple-choice",
    stem: "Ben has walked 3/4 of his 20-block route. How many blocks is that, and who has walked farther — Ana (12 blocks) or Ben?",
    stemEs:
      "Ben ha caminado 3/4 de su ruta de 20 cuadras. ¿Cuántas cuadras son, y quién ha caminado más lejos: Ana (12 cuadras) o Ben?",
    choices: [
      "15 blocks — Ben has walked farther",
      "5 blocks — Ana has walked farther",
      "15 blocks — Ana has walked farther",
      "16 blocks — Ben has walked farther",
    ],
    choicesEs: [
      "15 cuadras — Ben ha caminado más lejos",
      "5 cuadras — Ana ha caminado más lejos",
      "15 cuadras — Ana ha caminado más lejos",
      "16 cuadras — Ben ha caminado más lejos",
    ],
    correctIndex: 0,
    explanation:
      "20 ÷ 4 = 5, and 3 of those parts is 5 × 3 = 15 blocks. 15 is greater than Ana's 12, so Ben has walked farther.",
    explanationEs:
      "20 ÷ 4 = 5, y 3 de esas partes son 5 × 3 = 15 cuadras. 15 es mayor que las 12 de Ana, así que Ben ha caminado más lejos.",
    choiceFeedback: [
      "",
      "5 is 1/4 of the route. The fraction is 3/4, so you need three of those parts.",
      "Check the two numbers again: is 15 more or less than 12?",
      "20 ÷ 4 is 5, not 4. Find one part first, then take three of them.",
    ],
    choiceFeedbackEs: [
      "",
      "5 es 1/4 de la ruta. La fracción es 3/4, así que necesitas tres de esas partes.",
      "Revisa los dos números otra vez: ¿15 es más o menos que 12?",
      "20 ÷ 4 es 5, no 4. Encuentra una parte primero y luego toma tres.",
    ],
    hints: [
      "First find 1/4 of 20 — that is one part.",
      "Now take 3 of those parts. Then compare with Ana's 12.",
    ],
    hintsEs: [
      "Primero encuentra 1/4 de 20: esa es una parte.",
      "Ahora toma 3 de esas partes. Luego compara con las 12 de Ana.",
    ],
  },
  {
    // 4. EXPLAIN THE PLAN — in the exact language the lesson's language
    // objective names.
    type: "open-response",
    stem: "Explain your plan for comparing Ana's and Ben's distances. Use the words we know, we don't know, and my strategy is.",
    stemEs:
      "Explica tu plan para comparar las distancias de Ana y Ben. Usa las palabras sabemos, no sabemos y mi estrategia es.",
    modelAnswer:
      "We know how long each route is and what fraction each student has walked. We don't know how many blocks each one actually walked. My strategy is to find the fraction of each whole number first — 1/2 of 24 is 12 and 3/4 of 20 is 15 — and then compare those two distances.",
    modelAnswerEs:
      "Sabemos cuánto mide cada ruta y qué fracción ha caminado cada estudiante. No sabemos cuántas cuadras caminó cada uno en realidad. Mi estrategia es encontrar primero la fracción de cada número entero — 1/2 de 24 es 12 y 3/4 de 20 es 15 — y luego comparar esas dos distancias.",
    sentenceStems: [
      "We know ___ .",
      "We don't know ___ .",
      "My strategy is to ___ , and then ___ .",
    ],
  },
  {
    // 5. THE TRAP THE LESSON EXISTS FOR — a bigger fraction of a different whole
    // is not a bigger quantity. Ben IS farther here, so the wrong reasoning
    // reaches the right answer, which is exactly why it needs exposing.
    type: "multiple-choice",
    stem: "Ben walked 3/4 of his route and Ana walked 1/2 of hers, and Ben did walk farther. Does a bigger fraction ALWAYS mean a longer distance?",
    stemEs:
      "Ben caminó 3/4 de su ruta y Ana 1/2 de la suya, y Ben sí caminó más lejos. ¿Una fracción más grande SIEMPRE significa una distancia más larga?",
    choices: [
      "No — each fraction is of a different route, so you have to compare the actual blocks",
      "Yes — 3/4 is greater than 1/2, so the person with 3/4 always walked farther",
      "No — fractions of different numbers can never be compared at all",
      "Yes, but only when both routes are longer than 20 blocks",
    ],
    choicesEs: [
      "No — cada fracción es de una ruta distinta, así que hay que comparar las cuadras reales",
      "Sí — 3/4 es mayor que 1/2, así que quien caminó 3/4 siempre fue más lejos",
      "No — las fracciones de números distintos nunca se pueden comparar",
      "Sí, pero solo cuando las dos rutas miden más de 20 cuadras",
    ],
    correctIndex: 0,
    explanation:
      "If Ana's route were 40 blocks instead, 1/2 of 40 = 20 blocks, which beats Ben's 15 — same fractions, opposite answer. The size of the whole decides as much as the fraction does.",
    explanationEs:
      "Si la ruta de Ana midiera 40 cuadras, 1/2 de 40 = 20 cuadras, más que las 15 de Ben — las mismas fracciones, respuesta opuesta. El tamaño del entero decide tanto como la fracción.",
    choiceFeedback: [
      "",
      "Try it with a longer route for Ana — say 40 blocks. Does 3/4 still win?",
      "They can be compared — you just have to turn each one into a number of blocks first.",
      "Try Ana's route at 40 blocks. The rule breaks without any route being short.",
    ],
    choiceFeedbackEs: [
      "",
      "Pruébalo con una ruta más larga para Ana, digamos 40 cuadras. ¿Sigue ganando 3/4?",
      "Sí se pueden comparar: solo hay que convertir cada una en un número de cuadras primero.",
      "Prueba la ruta de Ana con 40 cuadras. La regla se rompe sin que ninguna ruta sea corta.",
    ],
    hints: [
      "Try changing Ana's route length and see whether the answer changes.",
      "What is 1/2 of 40? Compare it with Ben's 15.",
    ],
    hintsEs: [
      "Prueba a cambiar la longitud de la ruta de Ana y mira si cambia la respuesta.",
      "¿Cuánto es 1/2 de 40? Compáralo con las 15 de Ben.",
    ],
  },
  {
    // 6. TRANSFER — a third student, and the answer is a TIE, which forces a
    // real comparison rather than a scan for the biggest fraction.
    type: "open-response",
    stem: "A third student, Cam, has walked 2/3 of an 18-block route. Work out how far Cam has walked, then place all three students in order. Say what strategy you used.",
    stemEs:
      "Un tercer estudiante, Cam, ha caminado 2/3 de una ruta de 18 cuadras. Calcula cuánto ha caminado Cam y luego ordena a los tres estudiantes. Di qué estrategia usaste.",
    modelAnswer:
      "18 ÷ 3 = 6, and 2 parts is 6 × 2 = 12 blocks. So Cam walked 12, the same as Ana, and Ben walked 15. Ben is farthest, and Cam and Ana are tied. My strategy was to divide by the denominator to get one part, then multiply by the numerator.",
    modelAnswerEs:
      "18 ÷ 3 = 6, y 2 partes son 6 × 2 = 12 cuadras. Así que Cam caminó 12, igual que Ana, y Ben caminó 15. Ben es el que más lejos llegó, y Cam y Ana están empatados. Mi estrategia fue dividir entre el denominador para obtener una parte y luego multiplicar por el numerador.",
    sentenceStems: [
      "Cam walked ___ blocks, because ___ .",
      "In order from farthest: ___ .",
      "My strategy was to ___ .",
    ],
  },
];

const LESSON_1_2_CHALLENGE = [
  {
    // 1. ERROR ANALYSIS on reasoning that reaches the RIGHT answer — the hardest
    // kind to catch, and the one this lesson's trap produces.
    type: "open-response",
    stem: "Ana walked 1/2 of 24 blocks; Ben walked 3/4 of 20. Dana says: “3/4 is bigger than 1/2, so Ben walked farther.” Her conclusion is correct — but her reasoning is not. Explain why the reasoning fails, and give a route length for Ana that would make her conclusion wrong.",
    stemEs:
      "Ana caminó 1/2 de 24 cuadras; Ben caminó 3/4 de 20. Dana dice: “3/4 es mayor que 1/2, así que Ben caminó más lejos”. Su conclusión es correcta, pero su razonamiento no. Explica por qué falla el razonamiento y da una longitud de ruta para Ana que haría su conclusión incorrecta.",
    modelAnswer:
      "Dana compared the fractions instead of the distances, and the two fractions are of different wholes — 24 and 20. She got lucky: 3/4 of 20 is 15 and 1/2 of 24 is 12. If Ana's route were 40 blocks, 1/2 of 40 = 20, which is more than Ben's 15, so the same reasoning would give the wrong answer.",
    modelAnswerEs:
      "Dana comparó las fracciones en vez de las distancias, y las dos fracciones son de enteros distintos: 24 y 20. Tuvo suerte: 3/4 de 20 es 15 y 1/2 de 24 es 12. Si la ruta de Ana midiera 40 cuadras, 1/2 de 40 = 20, más que las 15 de Ben, así que el mismo razonamiento daría la respuesta equivocada.",
    sentenceStems: [
      "Dana compared ___ instead of ___ .",
      "It works here only because ___ .",
      "If Ana's route were ___ blocks, then ___ .",
    ],
  },
  {
    // 2. REVERSE THE PROBLEM — given the part, find the whole.
    type: "multiple-choice",
    stem: "A student has walked 2/3 of her route and has covered 14 blocks. How long is the whole route?",
    stemEs:
      "Una estudiante ha caminado 2/3 de su ruta y ha recorrido 14 cuadras. ¿Cuánto mide la ruta completa?",
    choices: ["21 blocks", "28 blocks", "9 1/3 blocks", "42 blocks"],
    choicesEs: ["21 cuadras", "28 cuadras", "9 1/3 cuadras", "42 cuadras"],
    correctIndex: 0,
    explanation:
      "If 2 parts are 14 blocks, one part is 7, and the whole is 3 parts: 21 blocks. Check: 2/3 of 21 = 14.",
    explanationEs:
      "Si 2 partes son 14 cuadras, una parte son 7, y el entero son 3 partes: 21 cuadras. Comprueba: 2/3 de 21 = 14.",
    choiceFeedback: [
      "",
      "That doubles the 14. The 14 is already two of the three parts.",
      "That takes 2/3 OF 14, but 14 is the part, not the whole.",
      "That trebles the 14. Check by taking 2/3 of your answer — do you get back to 14?",
    ],
    choiceFeedbackEs: [
      "",
      "Eso duplica el 14. El 14 ya son dos de las tres partes.",
      "Eso toma 2/3 DE 14, pero 14 es la parte, no el entero.",
      "Eso triplica el 14. Comprueba tomando 2/3 de tu respuesta: ¿vuelves a 14?",
    ],
    hints: [
      "The 14 blocks are 2 of the 3 equal parts. How big is one part?",
      "One part is 7. How many parts make the whole route?",
    ],
    hintsEs: [
      "Las 14 cuadras son 2 de las 3 partes iguales. ¿Cuánto mide una parte?",
      "Una parte son 7. ¿Cuántas partes forman la ruta completa?",
    ],
  },
  {
    // 3. ALWAYS / SOMETIMES / NEVER — improper fractions break the rule most
    // students carry from Grade 5.
    type: "multiple-choice",
    stem: "Claim: “Taking a fraction of a whole number always gives you a smaller number.” Always, sometimes, or never true?",
    stemEs:
      "Afirmación: “Tomar una fracción de un número entero siempre da un número más pequeño”. ¿Siempre, a veces o nunca es verdadera?",
    choices: [
      "Sometimes — only when the fraction is less than 1",
      "Always — a fraction is a part, and a part is smaller",
      "Never — the answer is always larger",
      "Sometimes — it depends on whether the whole number is even",
    ],
    choicesEs: [
      "A veces — solo cuando la fracción es menor que 1",
      "Siempre — una fracción es una parte, y una parte es más pequeña",
      "Nunca — la respuesta siempre es más grande",
      "A veces — depende de si el número entero es par",
    ],
    correctIndex: 0,
    explanation:
      "3/2 of 8 is 12, which is larger than 8, and 4/4 of 8 is exactly 8. The claim holds only while the fraction is below 1.",
    explanationEs:
      "3/2 de 8 es 12, mayor que 8, y 4/4 de 8 es exactamente 8. La afirmación solo se cumple mientras la fracción sea menor que 1.",
    choiceFeedback: [
      "",
      "Try a fraction greater than 1, like 3/2 of 8.",
      "Try 1/2 of 8 — the answer is smaller. So it is not never.",
      "Try 3/2 of 8 and 3/2 of 9. Evenness is not what decides it.",
    ],
    choiceFeedbackEs: [
      "",
      "Prueba una fracción mayor que 1, como 3/2 de 8.",
      "Prueba 1/2 de 8: la respuesta es más pequeña. Así que no es nunca.",
      "Prueba 3/2 de 8 y 3/2 de 9. Ser par no es lo que lo decide.",
    ],
    hints: [
      "Try to find one fraction that breaks the claim.",
      "What happens with a fraction bigger than 1, like 3/2?",
    ],
    hintsEs: [
      "Intenta encontrar una fracción que rompa la afirmación.",
      "¿Qué pasa con una fracción mayor que 1, como 3/2?",
    ],
  },
  {
    // 4. CREATE TO A CONSTRAINT — 1/2 is excluded so the easy route is closed.
    type: "open-response",
    stem: "Invent a route length and a fraction so that the student walks exactly 18 blocks. Your fraction may NOT be 1/2. Show that your example works.",
    stemEs:
      "Inventa una longitud de ruta y una fracción para que el estudiante camine exactamente 18 cuadras. Tu fracción NO puede ser 1/2. Muestra que tu ejemplo funciona.",
    modelAnswer:
      "A 24-block route walked 3/4 of the way: 24 ÷ 4 = 6, and 6 × 3 = 18 blocks. Another that works is 2/3 of a 27-block route: 27 ÷ 3 = 9, and 9 × 2 = 18.",
    modelAnswerEs:
      "Una ruta de 24 cuadras caminada 3/4: 24 ÷ 4 = 6, y 6 × 3 = 18 cuadras. Otra que funciona es 2/3 de una ruta de 27 cuadras: 27 ÷ 3 = 9, y 9 × 2 = 18.",
    sentenceStems: [
      "My route is ___ blocks and my fraction is ___ .",
      "One part is ___ , so ___ parts is 18.",
    ],
  },
  {
    // 5. COMPARE STRATEGIES — both correct, one easier, and the trap is the
    // invented rule in choice D.
    type: "multiple-choice",
    stem: "To find 3/4 of 20, Sam divides by 4 and then multiplies by 3. Nia multiplies by 3 and then divides by 4. Both get 15. Which is easier for these numbers, and why?",
    stemEs:
      "Para hallar 3/4 de 20, Sam divide entre 4 y luego multiplica por 3. Nia multiplica por 3 y luego divide entre 4. Ambos obtienen 15. ¿Cuál es más fácil con estos números y por qué?",
    choices: [
      "Sam's — 20 divides evenly by 4, so the numbers stay small",
      "Nia's — multiplying first is always easier than dividing first",
      "They cannot both be correct, so one of them made an error",
      "Sam's — because you must always divide before you multiply",
    ],
    choicesEs: [
      "La de Sam — 20 se divide exactamente entre 4, así que los números se mantienen pequeños",
      "La de Nia — multiplicar primero siempre es más fácil que dividir primero",
      "No pueden ser correctas las dos, así que uno se equivocó",
      "La de Sam — porque siempre hay que dividir antes de multiplicar",
    ],
    correctIndex: 0,
    explanation:
      "Sam works 20 ÷ 4 = 5, then 5 × 3 = 15. Nia works 20 × 3 = 60, then 60 ÷ 4 = 15. Both are valid; Sam's keeps the numbers small because 4 divides 20 evenly. Neither order is a rule.",
    explanationEs:
      "Sam hace 20 ÷ 4 = 5 y luego 5 × 3 = 15. Nia hace 20 × 3 = 60 y luego 60 ÷ 4 = 15. Las dos son válidas; la de Sam mantiene pequeños los números porque 4 divide exactamente a 20. Ningún orden es una regla.",
    choiceFeedback: [
      "",
      "Try 2/3 of 14 both ways — does multiplying first stay easier there?",
      "Work both out. 20 ÷ 4 × 3 and 20 × 3 ÷ 4 both land on 15.",
      "There is no such rule. Nia's order works too — it just makes bigger numbers here.",
    ],
    choiceFeedbackEs: [
      "",
      "Prueba 2/3 de 14 de las dos formas: ¿multiplicar primero sigue siendo más fácil ahí?",
      "Calcula las dos. 20 ÷ 4 × 3 y 20 × 3 ÷ 4 dan 15 igual.",
      "No existe tal regla. El orden de Nia también funciona: solo genera números más grandes aquí.",
    ],
    hints: [
      "Work both methods all the way through before choosing.",
      "Which method never makes you handle a number bigger than 20?",
    ],
    hintsEs: [
      "Haz los dos métodos completos antes de elegir.",
      "¿Qué método nunca te hace manejar un número mayor que 20?",
    ],
  },
  {
    // 6. GENERALIZE the strategy choice, with one example each way — the lesson's
    // key idea is trying another strategy when one hits a dead end.
    type: "open-response",
    stem: "When is it easier to divide first, and when is it easier to multiply first, when finding a fraction of a whole number? Give one example of each.",
    stemEs:
      "¿Cuándo es más fácil dividir primero y cuándo multiplicar primero al hallar una fracción de un número entero? Da un ejemplo de cada caso.",
    modelAnswer:
      "Divide first when the denominator goes into the whole number evenly: for 3/4 of 20, 20 ÷ 4 = 5 and 5 × 3 = 15, and every number stays small. Multiply first when it does not divide evenly: for 2/3 of 14, dividing gives a messy 14 ÷ 3, but 14 × 2 = 28 and 28 ÷ 3 = 9 1/3.",
    modelAnswerEs:
      "Divide primero cuando el denominador cabe exacto en el número entero: para 3/4 de 20, 20 ÷ 4 = 5 y 5 × 3 = 15, y todos los números quedan pequeños. Multiplica primero cuando no cabe exacto: para 2/3 de 14, dividir da un 14 ÷ 3 incómodo, pero 14 × 2 = 28 y 28 ÷ 3 = 9 1/3.",
    sentenceStems: [
      "Divide first when ___ . For example, ___ .",
      "Multiply first when ___ . For example, ___ .",
    ],
  },
];

const LESSON_1_2_MOVES = {
  1: {
    ask: "Which two numbers are you actually comparing — the fractions, or the blocks?",
    lookFor:
      "A student who converts each fraction to a distance BEFORE deciding who walked farther.",
    ifStuck:
      "Cover Ben's route. Ask for one part of Ana's 24 first, then how many parts she walked.",
  },
  2: {
    ask: "Dana reached the right answer with the wrong reasoning. What made it work this time?",
    lookFor:
      "A student who tests a claim by changing one quantity to try to break it, rather than by re-checking the arithmetic.",
    ifStuck:
      "Ask them to keep both fractions and change only Ana's route length until the answer flips.",
    extend:
      "Ask when dividing first beats multiplying first, and to name a case where it does not.",
  },
};

/*
 * Facilitation for an authored bank. The generated moves are derived from a
 * lesson's misconception tags, which for 1-1 produced teacher language about
 * decimal computation — the mathematics the old bank contained. These describe
 * the estimation and strategy-comparison work the bank now does, which is also
 * what MPP.3 asks a student to describe and compare.
 */
const LESSON_1_1_MOVES = {
  1: {
    ask: "Which number did you make friendlier — and what did that cost you?",
    lookFor: "A student who names the strategy they used, not only the number they landed on.",
    ifStuck:
      "Before any multiplying, ask for a friendly number near 19. Then ask what 20 fours would be.",
  },
  2: {
    ask: "Your estimate is close — but is it high or low, and does that direction matter for this decision?",
    lookFor:
      "A student who defends a strategy by what the number will be USED for, rather than by how close it is.",
    ifStuck:
      "Have them work the exact answer once, then ask which of the two estimates would have misled the operator.",
    extend: "Ask them to state the rule: when is rounding both numbers up the wrong move?",
  },
};

export const AUTHORED_BANKS = {
  "1-1": { 1: LESSON_1_1_SUPPORT, 2: LESSON_1_1_CHALLENGE, moves: LESSON_1_1_MOVES },
  "1-2": { 1: LESSON_1_2_SUPPORT, 2: LESSON_1_2_CHALLENGE, moves: LESSON_1_2_MOVES },
};

/** Authored teacher moves for a lesson + group, or null. */
export function authoredMoves(parentId, group) {
  return AUTHORED_BANKS[parentId]?.moves?.[group] || null;
}

/** The authored bank for a lesson + group, or null to use the mapped family. */
export function authoredBank(parentId, group) {
  const lesson = AUTHORED_BANKS[parentId];
  if (!lesson) return null;
  const bank = lesson[group];
  return bank
    ? bank.map((item, index) => ({
        ...item,
        id: `${parentId}-group${group}-authored-${String(index + 1).padStart(2, "0")}`,
      }))
    : null;
}

/** Lessons whose bank is authored here — used by the validator's size rule. */
export const AUTHORED_BANK_LESSONS = new Set(Object.keys(AUTHORED_BANKS));
