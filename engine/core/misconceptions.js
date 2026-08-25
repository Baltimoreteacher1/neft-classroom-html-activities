//
// Why this exists: until now the studio could only ever say "not right". Every
// judgment ran through isRight(), which is a boolean, so the richest signal in
// the room — *how* a grade-6 student got it wrong — was computed, displayed as a
// red outline, and thrown away. A teacher does not need to know that four
// students missed item 3; they need to know that three of them added the
// denominators.
//
// It was named `small-group-misconceptions.js` while the small-group studio was
// its only caller. It is now also the diagnosis behind every wrong multiple-choice
// answer in the main lesson path, so the name no longer earns the prefix. The
// taxonomy carries BOTH voices for each entry: `watchFor` is the teacher's next
// move, `student` is what the learner reads instead of "Not quite."
//
// How it works: we never guess from the wrong answer alone. We read the problem,
// derive the operands, and PREDICT the specific wrong result each named
// misconception would produce. A misconception is reported only when the
// student's actual answer matches exactly one prediction. Two predictions
// matching the same number is ambiguous, so we report nothing.
//
// That last rule is the whole design. It is the same invariant the build-step
// visualizer uses (never draw a picture you have not verified) applied to
// inference instead of rendering: no surface asserts what it cannot distinguish.
// A studio that confidently mislabels a student's thinking is worse than one
// that stays quiet, because a teacher will act on the label.

import { numberOf } from "./answer-match.js";

const EPS = 1e-9;
const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < EPS;

// The taxonomy. Each entry carries two voices, because the same detection feeds
// two very different surfaces:
//   `watchFor` — teacher-facing and deliberately imperative. It appears in the
//                facilitation console and the next-move recommendation, where a
//                noun phrase ("place value") is useless and an instruction is not.
//   `student`  — what the learner reads in place of "Not quite." It names the
//                thinking without blaming the thinker and ends with ONE thing to
//                check. It never states the answer: the student still has a retry,
//                and a diagnosis that hands over the number wastes it.
export const MISCONCEPTIONS = {
  "op-added-instead-of-multiplied": {
    label: "Added when the problem multiplies",
    labelEs: "Sumó cuando el problema multiplica",
    watchFor: "Ask what the operation *does* to the quantity before they compute.",
    student:
      "It looks like you added those two numbers. This one is asking for groups of something, which means multiplying. How many groups are there, and how big is each one?",
    studentEs:
      "Parece que sumaste esos dos números. Aquí se piden grupos de algo, y eso es multiplicar. ¿Cuántos grupos hay y de qué tamaño es cada uno?",
  },
  "op-multiplied-instead-of-added": {
    label: "Multiplied when the problem adds",
    labelEs: "Multiplicó cuando el problema suma",
    watchFor: "Have them restate the problem as a story, then name the operation.",
    student:
      "It looks like you multiplied. This problem puts two amounts together, so it adds. Try telling it back as a story first, then pick the operation.",
    studentEs:
      "Parece que multiplicaste. Este problema junta dos cantidades, así que se suma. Cuéntalo como una historia primero y luego escoge la operación.",
  },
  "op-reversed-subtraction": {
    label: "Subtracted in the wrong order",
    labelEs: "Restó en el orden equivocado",
    watchFor: "Anchor both numbers on a number line before subtracting.",
    student:
      "You subtracted in the other order. Check which amount you started with — that one goes first.",
    studentEs:
      "Restaste en el orden contrario. Fíjate con cuál cantidad empezaste: esa va primero.",
  },
  "op-reversed-division": {
    label: "Divided in the wrong order",
    labelEs: "Dividió en el orden equivocado",
    watchFor: "Ask “what is being split, and into how many?” before they write it.",
    student:
      "The two numbers got swapped in the division. Ask yourself: what is being split up? That number goes first.",
    studentEs:
      "Los dos números se intercambiaron en la división. Pregúntate: ¿qué se está repartiendo? Ese número va primero.",
  },
  "op-divided-instead-of-multiplied": {
    label: "Divided when the problem multiplies",
    labelEs: "Dividió cuando el problema multiplica",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
    student:
      "It looks like you divided. Estimate before you compute: should this answer end up bigger or smaller than what you started with?",
    studentEs:
      "Parece que dividiste. Estima antes de calcular: ¿la respuesta debe ser más grande o más pequeña que con lo que empezaste?",
  },
  "op-multiplied-instead-of-divided": {
    label: "Multiplied when the problem divides",
    labelEs: "Multiplicó cuando el problema divide",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
    student:
      "It looks like you multiplied. Estimate before you compute: should this answer end up bigger or smaller than what you started with?",
    studentEs:
      "Parece que multiplicaste. Estima antes de calcular: ¿la respuesta debe ser más grande o más pequeña que con lo que empezaste?",
  },
  // One id, not two, and deliberately so. "Multiplied the digits and ignored the
  // points" and "computed correctly then misplaced the point" produce the SAME
  // number for the same problem — 451 × 12 = 5412 is also 5.412 shifted three
  // places. They are not distinguishable from the response, so naming them
  // separately would be asserting more than the evidence supports. The label and
  // the teacher move are therefore both scoped to what we can actually prove:
  // the digits are right and the magnitude is not.
  "decimal-place-value": {
    label: "Right digits, wrong magnitude",
    labelEs: "Dígitos correctos, magnitud equivocada",
    watchFor: "Estimate to the nearest whole first, then count decimal places out loud.",
    student:
      "Your digits are right — the decimal point landed in the wrong spot. Round to the nearest whole number first and see roughly where the answer should sit.",
    studentEs:
      "Tus dígitos están bien: el punto decimal quedó en el lugar equivocado. Redondea al número entero más cercano y fíjate más o menos dónde debe caer la respuesta.",
  },
  "fraction-added-denominators": {
    label: "Added the denominators",
    labelEs: "Sumó los denominadores",
    watchFor: "Return to a bar model — thirds plus fifths cannot become eighths.",
    student:
      "It looks like you added the bottom numbers too. Thirds plus fifths cannot turn into eighths — draw the bars and check what size the pieces really are.",
    studentEs:
      "Parece que también sumaste los números de abajo. Tercios más quintos no pueden volverse octavos: dibuja las barras y revisa de qué tamaño son las piezas.",
  },
  "fraction-straight-across-division": {
    label: "Divided numerators and denominators straight across",
    labelEs: "Dividió numeradores y denominadores directamente",
    watchFor: "Reground division as “how many of these fit into that?”",
    student:
      "You divided the tops and the bottoms straight across. Dividing asks “how many of these fit into that?” — try that question on a whole-number case you already trust.",
    studentEs:
      "Dividiste los de arriba y los de abajo directamente. Dividir pregunta “¿cuántos de estos caben en aquello?” — prueba esa pregunta con números enteros que ya conoces.",
  },
  "fraction-no-reciprocal": {
    label: "Divided fractions without inverting",
    labelEs: "Dividió fracciones sin invertir",
    watchFor: "Ask them to check with a whole-number case they already trust.",
    student:
      "You multiplied the fractions just as they were written. When you divide by a fraction, the second one flips first.",
    studentEs:
      "Multiplicaste las fracciones tal como estaban escritas. Cuando divides entre una fracción, primero se invierte la segunda.",
  },
  "percent-used-as-whole-number": {
    label: "Used the percent as a plain number",
    labelEs: "Usó el porcentaje como número entero",
    watchFor: "Make them say the percent as “per hundred” out loud.",
    student:
      "The percent got used as a plain number. Say it out loud as “per hundred” — 15% means 15 out of every 100, not 15.",
    studentEs:
      "El porcentaje se usó como número común. Dilo en voz alta como “por cien”: 15% significa 15 de cada 100, no 15.",
  },
  "percent-scale-off-by-100": {
    label: "Percent answer off by a factor of 100",
    labelEs: "Respuesta de porcentaje errada por un factor de 100",
    watchFor: "Benchmark against 50% and 10% before trusting the number.",
    student:
      "Your answer is off by a factor of 100. Check it against something you already know: 50% is half, and 10% is one tenth.",
    studentEs:
      "Tu respuesta está errada por un factor de 100. Compárala con algo que ya sabes: 50% es la mitad y 10% es una décima parte.",
  },
  "ratio-inverted": {
    label: "Flipped the ratio",
    labelEs: "Invirtió la razón",
    watchFor: "Have them label both quantities with units before writing the ratio.",
    student:
      "The ratio is flipped. Label both quantities with their units, then write them in the same order the question names them.",
    studentEs:
      "La razón está invertida. Etiqueta las dos cantidades con sus unidades y escríbelas en el mismo orden en que la pregunta las nombra.",
  },
  "rate-not-per-one": {
    label: "Gave the total instead of the unit rate",
    labelEs: "Dio el total en vez de la tasa unitaria",
    watchFor: "Ask “per ONE what?” and make them finish the sentence.",
    student:
      "That is the total, not the amount for ONE. Finish this sentence out loud: “for one ___, there is ___.”",
    studentEs:
      "Eso es el total, no la cantidad por UNO. Termina esta oración en voz alta: “por un ___, hay ___.”",
  },
  "exponent-as-multiplication": {
    label: "Multiplied the base by the exponent",
    labelEs: "Multiplicó la base por el exponente",
    watchFor: "Expand it once — write out every factor before evaluating.",
    student:
      "It looks like you multiplied the base by the exponent. 2³ means 2 × 2 × 2 — write out every factor before you evaluate.",
    studentEs:
      "Parece que multiplicaste la base por el exponente. 2³ significa 2 × 2 × 2: escribe todos los factores antes de calcular.",
  },
  "order-of-operations-left-to-right": {
    label: "Worked left to right instead of by operation order",
    labelEs: "Trabajó de izquierda a derecha en vez de por orden de operaciones",
    watchFor: "Have them circle the operation that must go first, then compute.",
    student:
      "You worked straight across from left to right. Circle the operation that has to happen first, then compute.",
    studentEs:
      "Trabajaste de izquierda a derecha sin parar. Encierra la operación que debe hacerse primero y luego calcula.",
  },
  "sign-dropped": {
    label: "Right magnitude, lost the negative sign",
    labelEs: "Magnitud correcta, perdió el signo negativo",
    watchFor: "Place the answer on a number line — which side of zero?",
    student:
      "The size of your answer is right, but the negative sign went missing. Put it on a number line — which side of zero does it belong on?",
    studentEs:
      "El tamaño de tu respuesta está bien, pero se perdió el signo negativo. Ponla en una recta numérica: ¿de qué lado del cero va?",
  },
  "stat-summed-instead-of-averaged": {
    label: "Added the data set instead of averaging it",
    labelEs: "Sumó el conjunto de datos en vez de promediarlo",
    watchFor: "Ask whether the answer could be a realistic single value in that set.",
    student:
      "That is the total of the data, not its average. Could your answer be one realistic value from that list? An average has to land inside the data.",
    studentEs:
      "Eso es el total de los datos, no su promedio. ¿Tu respuesta podría ser un valor real de esa lista? Un promedio tiene que caer dentro de los datos.",
  },
  "geom-triangle-area-no-half": {
    label: "Found base × height but forgot the half",
    labelEs: "Calculó base × altura pero olvidó la mitad",
    watchFor: "Draw the rectangle around the triangle — the triangle is half of it.",
    student:
      "You multiplied base × height, but that gives the whole rectangle. A triangle is half of that rectangle — take half of your answer.",
    studentEs:
      "Multiplicaste base × altura, pero eso da el rectángulo completo. Un triángulo es la mitad de ese rectángulo: toma la mitad de tu respuesta.",
  },
  // Authored-only, deliberately: there is no honest numeric predictor here.
  // The error is answering the WRONG QUESTION (volume when surface area was
  // asked), and l·w·h is a perfectly correct computation — nothing about the
  // value alone reveals the mistake. Only the item's own distractor knows.
  "geom-surface-area-as-volume": {
    label: "Found the volume instead of the surface area",
    labelEs: "Halló el volumen en vez del área total",
    watchFor:
      "Ask what the unit has to be — square units cover a surface, cubic units fill a space.",
    student:
      "That is the volume — the space inside. Surface area is the wrapping: find the area of all six faces and add them. Check your unit, too — a surface is measured in square units, not cubic.",
    studentEs:
      "Eso es el volumen: el espacio de adentro. El área total es la envoltura: halla el área de las seis caras y súmalas. Revisa también la unidad: una superficie se mide en unidades cuadradas, no cúbicas.",
  },
  "geom-volume-added-dimensions": {
    label: "Added the dimensions instead of multiplying",
    labelEs: "Sumó las dimensiones en vez de multiplicarlas",
    watchFor: "Build one layer of unit cubes first, then count the layers.",
    student:
      "You added length + width + height. Volume fills the box with cubes — build one layer, then multiply by how many layers stack up.",
    studentEs:
      "Sumaste largo + ancho + alto. El volumen llena la caja con cubos: arma una capa y multiplica por cuántas capas se apilan.",
  },
  "algebra-distributive-partial": {
    label: "Distributed to the first term only",
    labelEs: "Distribuyó solo al primer término",
    watchFor: "Draw the area model — the outside factor touches BOTH terms.",
    student:
      "The number outside the parentheses has to multiply BOTH terms inside, not just the first one. Draw the area model and check both pieces.",
    studentEs:
      "El número fuera del paréntesis debe multiplicar AMBOS términos de adentro, no solo el primero. Dibuja el modelo de área y revisa las dos partes.",
  },
  // ── equations ────────────────────────────────────────────────────────────
  // Both authored-only. An equation item's wrong answers are numbers the stem
  // already contains (the addend, the divisor, the total), so a numeric
  // predictor cannot tell "answered with the divisor" from "computed something
  // that happens to equal the divisor". Only the item's own distractor knows.
  "equation-not-inverse-operation": {
    label: "Did not undo the operation",
    labelEs: "No deshizo la operación",
    watchFor: "Have them name the operation acting on the variable BEFORE they touch both sides.",
    student:
      "To get the variable alone you have to undo what is being done to it, and that means the opposite operation. Doing the same one again — multiplying a second time, adding again — moves you further away. What is happening to the variable right now?",
    studentEs:
      "Para dejar sola la variable hay que deshacer lo que se le está haciendo, y eso significa la operación opuesta. Repetir la misma —multiplicar otra vez, sumar otra vez— te aleja más. ¿Qué le está pasando a la variable ahora mismo?",
  },
  "equation-answered-with-given-number": {
    label: "Answered with a number already in the equation",
    labelEs: "Respondió con un número que ya estaba en la ecuación",
    watchFor: "Ask them to substitute their answer back into the original equation out loud.",
    student:
      "That number is already in the equation — it is the amount being added, or the number you divide by. The unknown is the one nobody told you. Put your answer back into the equation and see whether both sides match.",
    studentEs:
      "Ese número ya está en la ecuación: es la cantidad que se suma o el número entre el que se divide. La incógnita es la que nadie te dio. Sustituye tu respuesta en la ecuación y fíjate si los dos lados coinciden.",
  },

  // ── inequalities ─────────────────────────────────────────────────────────
  // Three entries, not one, because the repairs are genuinely different: one is
  // about the symbol surviving a legal move, one about whether the endpoint is
  // in the set, and one about reading a picture. A student can have any one of
  // them right and the other two wrong.
  "inequality-direction-flipped": {
    label: "Right boundary, symbol reversed",
    labelEs: "Límite correcto, símbolo invertido",
    watchFor: "Ask which moves can flip a symbol — adding and subtracting never do.",
    student:
      "You found the right boundary number, but the symbol ended up pointing the other way. Adding or subtracting the same amount on both sides never changes which way an inequality points. Check the original symbol and keep it.",
    studentEs:
      "Encontraste el número límite correcto, pero el símbolo terminó apuntando al otro lado. Sumar o restar la misma cantidad en ambos lados nunca cambia hacia dónde apunta una desigualdad. Revisa el símbolo original y consérvalo.",
  },
  "inequality-boundary-inclusion": {
    label: "Boundary value wrongly included or excluded",
    labelEs: "Valor límite incluido o excluido por error",
    watchFor: "Have them test the boundary value itself — does it make the statement true?",
    student:
      "The direction is right; what is off is whether the boundary number itself counts. Test that exact number in the inequality. If it makes a true statement it belongs in the set — a filled circle, ≤ or ≥. If not, it stays out.",
    studentEs:
      "La dirección está bien; lo que falla es si el número límite cuenta o no. Prueba ese número exacto en la desigualdad. Si la hace verdadera, pertenece al conjunto: círculo relleno, ≤ o ≥. Si no, queda fuera.",
  },
  "inequality-graph-direction": {
    label: "Graph shaded toward the wrong side",
    labelEs: "Gráfica sombreada hacia el lado equivocado",
    watchFor: "Make them test one number from the shaded side out loud before accepting a graph.",
    student:
      "The shading is on the wrong side of the boundary. Pick any number from the shaded part and put it into the inequality — if it makes a false statement, the shading belongs on the other side.",
    studentEs:
      "El sombreado está del lado equivocado del límite. Escoge cualquier número de la parte sombreada y ponlo en la desigualdad: si resulta falso, el sombreado va del otro lado.",
  },

  // ── statistics ───────────────────────────────────────────────────────────
  // Four entries, deliberately narrow. The statistics bank describes many
  // distinct reasoning errors and it would be easy to collapse them into one
  // "stats confusion" tag; that tag would be useless to a teacher, because the
  // repair for "used the range when asked for the IQR" has nothing in common
  // with the repair for "read a data value where a frequency was asked".
  "stat-range-for-iqr": {
    label: "Used the full range instead of the IQR",
    labelEs: "Usó el rango completo en vez del rango intercuartílico",
    watchFor: "Have them mark Q1 and Q3 on the plot and cover everything outside them.",
    student:
      "That is the whole spread, from the smallest value to the largest. The IQR only measures the middle half: it is Q3 − Q1, and it ignores the extremes entirely. Find those two quartiles and subtract.",
    studentEs:
      "Esa es la dispersión completa, del valor más pequeño al más grande. El rango intercuartílico solo mide la mitad central: es Q3 − Q1 e ignora por completo los extremos. Halla esos dos cuartiles y resta.",
  },
  "stat-center-vs-spread": {
    label: "Confused a measure of center with a measure of spread",
    labelEs: "Confundió una medida de centro con una de dispersión",
    watchFor: "Ask what the question wants to know: a typical value, or how scattered the data is?",
    student:
      "Those two answer different questions. A measure of center says what a typical value is; a measure of spread says how far apart the values are. Read the question again and decide which one it is asking for.",
    studentEs:
      "Esas dos responden preguntas distintas. Una medida de centro dice cuál es un valor típico; una de dispersión dice qué tan separados están los valores. Vuelve a leer la pregunta y decide cuál te piden.",
  },
  "stat-mean-skewed-by-outlier": {
    label: "Chose the mean when an outlier distorts it",
    labelEs: "Eligió la media cuando un valor atípico la distorsiona",
    watchFor: "Have them cover the outlier and recompute — how far does the mean move?",
    student:
      "The mean uses every value, so one unusually high or low number drags it away from what is typical. The median does not move like that. Look at the data: is there a value far from the rest?",
    studentEs:
      "La media usa todos los valores, así que un número inusualmente alto o bajo la aleja de lo típico. La mediana no se mueve así. Mira los datos: ¿hay un valor muy alejado de los demás?",
  },
  "stat-frequency-vs-value": {
    label: "Reported a data value where a frequency was asked",
    labelEs: "Dio un valor de los datos donde se pedía una frecuencia",
    watchFor: "Ask them to point at the axis their number came from before they answer.",
    student:
      "That number came from the wrong axis. The bar's height counts HOW MANY, and the label underneath says WHICH values. The question is asking how many. Read the height, not the label.",
    studentEs:
      "Ese número viene del eje equivocado. La altura de la barra cuenta CUÁNTOS, y la etiqueta de abajo dice CUÁLES valores. La pregunta pide cuántos. Lee la altura, no la etiqueta.",
  },

  // Authored-only, like geom-surface-area-as-volume, and for the same reason:
  // there is no honest numeric predictor. (3, 5) and (5, 3) are both perfectly
  // well-formed ordered pairs, and nothing about the VALUE reveals which one the
  // student meant — only the item's own distractor knows. The coordinate unit
  // (7-5, 7-8, 7-9) states this error in its feedback on ~60 distractors and,
  // until this entry existed, could diagnose nothing at all.
  "coord-xy-swapped": {
    label: "Swapped the x and y coordinates",
    labelEs: "Intercambió las coordenadas x e y",
    watchFor: "Have them trace the horizontal move with a finger before the vertical one.",
    student:
      "The two numbers traded places. In an ordered pair the first number is the across move and the second is the up-or-down move. Trace across first, then up.",
    studentEs:
      "Los dos números cambiaron de lugar. En un par ordenado, el primer número es el movimiento horizontal y el segundo el vertical. Muévete primero de lado y luego hacia arriba o abajo.",
  },
  "measure-area-perimeter-swap": {
    label: "Swapped area and perimeter",
    labelEs: "Confundió área y perímetro",
    watchFor: "Ask what the unit should be — units or square units?",
    student:
      "Area and perimeter got swapped. Check the unit you should end with — plain units, or square units?",
    studentEs:
      "Se confundieron área y perímetro. Revisa con qué unidad debes terminar: ¿unidades o unidades cuadradas?",
  },

  // --- Proportional reasoning ----------------------------------------------
  // Authored-only, and necessarily so. 2:3 → 4:5 and 2:3 → 4:6 are both pairs of
  // whole numbers; the VALUE alone never says which move the student made, only
  // the item's own distractor does. This is the defining Grade 6 proportional
  // reasoning error — the jump from "add the same amount" to "multiply by the
  // same factor" is the whole point of the ratio unit — and unit 3 states it in
  // feedback on 65 distractors across 13 lessons that could diagnose nothing.
  "ratio-scaled-additively": {
    label: "Scaled a ratio by adding instead of multiplying",
    labelEs: "Escaló una razón sumando en vez de multiplicando",
    watchFor:
      "Ask what ONE batch is worth, then how many batches — a ratio grows by copies, not by steps.",
    student:
      "You added the same amount to both numbers. Equivalent ratios come from multiplying both parts by the same factor, not from adding to both. Ask: how many times bigger is the new amount?",
    studentEs:
      "Sumaste la misma cantidad a los dos números. Las razones equivalentes se hacen multiplicando las dos partes por el mismo factor, no sumando. Pregúntate: ¿cuántas veces más grande es la nueva cantidad?",
  },
  // Distinct from ratio-scaled-additively: that one keeps a ratio and grows it
  // wrongly; this one never forms a ratio at all, collapsing two quantities into
  // a single sum or difference. Also authored-only — 3 and 5 give 8 and 2 by
  // arithmetic the predictor can see, but nothing in the numbers says the
  // student meant "compare" rather than "combine".
  "ratio-as-difference": {
    label: "Combined the two amounts instead of comparing them",
    labelEs: "Combinó las dos cantidades en vez de compararlas",
    watchFor:
      "Have them say the comparison out loud — “for every ___ there are ___” — before writing anything.",
    student:
      "A ratio compares two amounts; it does not add or subtract them. Say it out loud first: “for every ___ there are ___.” Then write the two numbers in that order.",
    studentEs:
      "Una razón compara dos cantidades; no las suma ni las resta. Dilo primero en voz alta: “por cada ___ hay ___.” Luego escribe los dos números en ese orden.",
  },

  // --- Statistics ----------------------------------------------------------
  // Deliberately narrower than stat-center-vs-spread (which is a centre swapped
  // for a spread) and than stat-mean-skewed-by-outlier (which is choosing the
  // mean when an outlier makes the median the better summary). This entry is
  // only the procedural swap: the student computed or picked one measure of
  // centre when the question named the other.
  "stat-mean-vs-median": {
    label: "Used the mean where the median was asked (or the reverse)",
    labelEs: "Usó la media donde se pedía la mediana (o al revés)",
    watchFor:
      "Ask them to say which word the question used, then what that word tells you to DO with the numbers.",
    student:
      "Those are two different measures. The mean adds every value and divides; the median puts the values in order and takes the middle one. Read the question again and name which one it asked for.",
    studentEs:
      "Esas son dos medidas distintas. La media suma todos los valores y divide; la mediana ordena los valores y toma el del medio. Vuelve a leer la pregunta y di cuál te pidió.",
  },
  // Distinct from stat-frequency-vs-value, which is reading the wrong AXIS.
  // This is reading the right axis wrongly: counting values into the wrong bin,
  // comparing bar heights carelessly, or assuming a scale starts at zero when
  // the display does not show it. Authored-only — the predictor cannot see a
  // chart. Distribution SHAPE errors (skew, symmetry) are a separate error and
  // are deliberately NOT folded in here; see reports/misconception-tagging.md.
  "stat-histogram-bin-misread": {
    label: "Misread the bins or the scale on a data display",
    labelEs: "Leyó mal los intervalos o la escala de una gráfica",
    watchFor:
      "Have them point to the interval's two endpoints and say which values belong inside it.",
    student:
      "Check the display itself before you count. Every bar belongs to one interval, and a value counts only if it falls between that interval's endpoints. Point at the endpoints and count again.",
    studentEs:
      "Revisa la gráfica antes de contar. Cada barra pertenece a un intervalo, y un valor cuenta solo si cae entre los extremos de ese intervalo. Señala los extremos y cuenta otra vez.",
  },

  // ── Conceptual errors, authored-only by construction ────────────────────
  //
  // The five below name errors that are NOT arithmetic slips, so no numeric
  // predictor can reach them: the student's answer is a NAME or a CATEGORY
  // ("Associative Property", "1, 12"), and re-computing the stem tells you
  // nothing about why they chose it. Only the item's own distractor knows.
  //
  // They exist because `reports/misconception-coverage.md` found seven core
  // lessons that could diagnose NOTHING — not because their feedback was
  // missing (it is excellent) but because the error each one teaches against
  // had no entry in this taxonomy at all. A lesson that diagnoses nothing is
  // invisible to the heatmap, the class pulse and the family broadcast.
  /* The error lesson 2-6 names in its own commonMistake, and the reason the
     whole-number division lessons could not use `decimal-place-value`: the
     digits ARE right and the magnitude IS wrong, but nothing about it involves
     a decimal point, so the decimal tag's teacher move ("count decimal places
     out loud") is advice for a different mistake. */
  "division-quotient-missing-zero": {
    label: "Dropped a placeholder zero in the quotient",
    labelEs: "Omitió un cero de posición en el cociente",
    watchFor:
      "Estimate first — 4,896 ÷ 12 is about 400, not 40 — then check the quotient has a digit above every digit that was brought down.",
    student:
      "Your digits are right, but a place is missing. Every time a step will not divide, you still write a 0 in the quotient before bringing the next digit down — skip it and every digit after it slides one place over. 4,896 ÷ 12 is 408, not 48.",
    studentEs:
      "Tus dígitos están bien, pero falta un lugar. Cada vez que un paso no se puede dividir, igual escribes un 0 en el cociente antes de bajar el siguiente dígito; si lo saltas, todos los dígitos que siguen se recorren un lugar. 4,896 ÷ 12 es 408, no 48.",
  },
  "factors-multiples-confused": {
    label: "Confused factors with multiples",
    labelEs: "Confundió factores con múltiplos",
    watchFor: "Ask which number divides which — factors go INTO it, multiples come OUT of it.",
    student:
      "Those are multiples — where you land counting BY the number. Factors are the numbers that divide INTO it evenly. 12 has factors 1, 2, 3, 4, 6 and 12; its multiples are 12, 24, 36, 48.",
    studentEs:
      "Esos son múltiplos: donde caes al contar DE ese número en ese número. Los factores son los números que lo dividen exactamente. El 12 tiene factores 1, 2, 3, 4, 6 y 12; sus múltiplos son 12, 24, 36, 48.",
  },
  "property-order-vs-grouping": {
    label: "Confused the commutative and associative properties",
    labelEs: "Confundió la propiedad conmutativa con la asociativa",
    watchFor: "Ask what actually MOVED: the order of the numbers, or the parentheses?",
    student:
      "Commutative changes the ORDER the numbers are written in. Associative changes the GROUPING — which pair sits inside the parentheses. Read both sides left to right and name what moved.",
    studentEs:
      "La conmutativa cambia el ORDEN en que se escriben los números. La asociativa cambia la AGRUPACIÓN: qué par queda dentro del paréntesis. Lee los dos lados de izquierda a derecha y di qué se movió.",
  },
  "factorization-stopped-early": {
    label: "Stopped factoring before every factor was prime",
    labelEs: "Dejó de factorizar antes de que todos los factores fueran primos",
    watchFor: "Point at each factor and ask: can this one still be broken apart?",
    student:
      "That is a correct factor pair, but not the PRIME factorization — at least one of your factors still breaks down. Keep splitting every branch until it ends on a prime.",
    studentEs:
      "Ese es un par de factores correcto, pero no la descomposición en factores PRIMOS: al menos uno de tus factores todavía se puede separar. Sigue separando cada rama hasta que termine en un primo.",
  },
  "stat-question-no-variability": {
    label: "Chose a question with only one fixed answer",
    labelEs: "Escogió una pregunta con una sola respuesta fija",
    watchFor: "Ask: would two different people give two different answers?",
    student:
      "A statistical question expects answers that VARY. That one has a single fixed answer, so there is no data to collect. Ask what would change from one person to the next.",
    studentEs:
      "Una pregunta estadística espera respuestas que VARÍEN. Esa tiene una sola respuesta fija, así que no hay datos que recoger. Pregúntate qué cambiaría de una persona a otra.",
  },
  "ratio-compared-without-common-basis": {
    label: "Compared two ratios without a common basis",
    labelEs: "Comparó dos razones sin una base común",
    watchFor: "Ask what ONE of each is worth before either ratio is compared.",
    student:
      "Two ratios cannot be compared side by side until they share a basis. Turn each into an amount per ONE, or scale both until their second numbers match, and then compare.",
    studentEs:
      "Dos razones no se pueden comparar lado a lado hasta que compartan una base. Convierte cada una en una cantidad por UNO, o escala las dos hasta que sus segundos números coincidan, y luego compara.",
  },
};

// Configs already carry a sparse authored vocabulary in `misconceptionTags` (a
// tag per choice, present on 91 of 3,429 items and using only two values). Where
// an author HAS named the error, that is ground truth and beats inference — so it
// is mapped into the taxonomy rather than ignored. The inference path below is
// what gives the remaining ~97% of items any coverage at all.
const AUTHORED_TAGS = {
  "place-value": "decimal-place-value",
  "sign-error": "sign-dropped",
  // Straight-across fraction division is ALGEBRAICALLY VALID, so it has no
  // numeric predictor (see the long note in predictions()) — an authored
  // distractor is the only honest way to name it, and until this mapping
  // existed an authored "straight-across" tag resolved to nothing at all.
  "straight-across": "fraction-straight-across-division",
  "triangle-half": "geom-triangle-area-no-half",
  "volume-added": "geom-volume-added-dimensions",
  "distributive-partial": "algebra-distributive-partial",
};

/**
 * Resolve an authored distractor tag to a MISCONCEPTIONS key.
 *
 * Two accepted forms, in priority order:
 *   1. a short alias from AUTHORED_TAGS above (kept for the 111 items already
 *      authored against them, and for genuinely nicer shorthand)
 *   2. a taxonomy id verbatim ("ratio-inverted")
 *
 * Form 2 exists because the alias map covered only 6 of the 22 taxonomy
 * entries, which quietly made the other 16 UNAUTHORABLE. That matters more
 * than it sounds: the numeric predictor can only infer an error from a stem it
 * can parse as arithmetic, and 82% of this curriculum's multiple-choice items
 * are prose word problems (see reports/misconception-coverage.md). For those,
 * an authored tag is the ONLY detection path — so an author who wanted to name
 * "flipped the ratio" on a distractor had no way to say it, and the tag they
 * wrote resolved to nothing at all with no warning.
 *
 * Unknown strings still resolve to null and fall through to the predictor,
 * so a typo degrades to today's behaviour rather than inventing a diagnosis.
 */
export function resolveAuthoredTag(tag) {
  const key = typeof tag === "string" ? tag.trim() : "";
  if (!key) return null;
  if (AUTHORED_TAGS[key]) return AUTHORED_TAGS[key];
  return MISCONCEPTIONS[key] ? key : null;
}

/** Split "3/4" into parts. Returns null unless the whole string is a fraction. */
function fractionParts(text) {
  const match = String(text ?? "")
    .trim()
    .match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const denominator = Number(match[2]);
  return denominator ? { n: Number(match[1]), d: denominator } : null;
}

/** Digits of a decimal with the point removed: 4.51 → 451. Powers the "computed
 *  as whole numbers" detector, which is exactly the shape of the shipped bug
 *  where every decimal operation was scaffolded as addition. */
function digitsOnly(text) {
  const clean = String(text ?? "").replace(/[^\d]/g, "");
  return clean ? Number(clean) : null;
}

const OPERATORS = [
  { symbols: ["×", "·", "*"], op: "*" },
  { symbols: ["÷"], op: "/" },
  { symbols: ["+"], op: "+" },
  { symbols: ["−", "–", "—"], op: "-" },
];

/**
 * Pull a single binary expression out of a stem. Conservative by construction:
 * both sides must parse as complete quantities, and an ambiguous stem (two
 * candidate expressions, or a bare "/" that could be a fraction bar) yields
 * null. A wrong guess here would mislabel a student, so we would rather return
 * nothing and let the studio say "not right" as it always has.
 */
export function scanExpression(stem) {
  const text = String(stem ?? "");
  const found = [];
  for (const { symbols, op } of OPERATORS) {
    for (const symbol of symbols) {
      let from = 0;
      for (;;) {
        const at = text.indexOf(symbol, from);
        if (at < 0) break;
        from = at + 1;
        // Grab the quantity on each side: digits, decimal points, fraction bars.
        const leftText = text.slice(0, at).match(/(-?[\d]+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*$/);
        const rightText = text
          .slice(at + symbol.length)
          .match(/^\s*(-?[\d]+(?:\.\d+)?(?:\s*\/\s*\d+)?)/);
        if (!leftText || !rightText) continue;
        const a = numberOf(leftText[1]);
        const b = numberOf(rightText[1]);
        if (a == null || b == null) continue;
        found.push({ a, b, op, aText: leftText[1].trim(), bText: rightText[1].trim() });
      }
    }
  }
  // "x" as a multiplication sign is intentionally NOT scanned: in grade-6 stems
  // it is a variable far more often than an operator ("x + 2 = 9").
  // Also handle whitespace-delimited division ("48 / 6") only when nothing else
  // matched, so "3/4 + 1/2" never reads as a division problem.
  if (!found.length) {
    const spaced = text.match(/(-?\d+(?:\.\d+)?)\s+\/\s+(-?\d+(?:\.\d+)?)/);
    if (spaced) {
      const a = numberOf(spaced[1]);
      const b = numberOf(spaced[2]);
      if (a != null && b != null) found.push({ a, b, op: "/", aText: spaced[1], bText: spaced[2] });
    }
  }
  return found.length === 1 ? found[0] : null;
}

/**
 * Recover the operands from the authored EXPLANATION when the stem is prose.
 *
 * Most grade-6 items are word problems — "Maria buys 3 shirts for $12 each" —
 * so scanExpression() finds nothing and the detector goes silent. Of the 581
 * multiple-choice items with a numeric answer, only 128 carry an expression in
 * the stem; 278 more have one in their explanation.
 *
 * Reading the explanation is safe ONLY because of the gate below: an extracted
 * (a, op, b) is accepted just when applying it actually REPRODUCES the item's
 * known-correct answer. If our reading of the problem does not reconstruct the
 * answer the author wrote, we read it wrong and stay silent — the extraction
 * verifies itself instead of trusting a regex. A tie (two different triples that
 * both reproduce the answer, e.g. 12 ÷ 4 and 1 × 3) predicts different wrong
 * answers, so it is ambiguous and also yields nothing.
 */
const EXPLANATION_EXPRESSION =
  /(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([×·*÷+−–—-])\s*(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)/g;

function verifiedExpression(item, correct) {
  if (correct == null || !Number.isFinite(correct)) return null;
  const text = String(item?.explanation ?? "");
  if (!text) return null;
  const seen = new Map();
  EXPLANATION_EXPRESSION.lastIndex = 0;
  let match = EXPLANATION_EXPRESSION.exec(text);
  while (match) {
    const op = /[×·*]/.test(match[2]) ? "*" : match[2] === "÷" ? "/" : match[2] === "+" ? "+" : "-";
    const aText = match[1].trim();
    const bText = match[3].trim();
    const a = numberOf(aText);
    const b = numberOf(bText);
    if (a != null && b != null && near(apply(a, b, op), correct)) {
      seen.set(`${a}${op}${b}`, { a, b, op, aText, bText });
    }
    match = EXPLANATION_EXPRESSION.exec(text);
  }
  return seen.size === 1 ? [...seen.values()][0] : null;
}

/** Every number in the stem, in order — used by the statistics detector. */
function allNumbers(stem) {
  return (String(stem ?? "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
}

const apply = (a, b, op) => {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  return b === 0 ? null : a / b;
};

/**
 * Build the candidate wrong answers for this problem, each tagged with the
 * misconception that produces it. Predictions equal to the CORRECT answer are
 * dropped by the caller — a prediction that coincides with the right answer
 * proves nothing about the student's thinking.
 *
 * Exported for misconceptions.deadprediction.test.mjs, which asserts that no
 * predictor is structurally inert (i.e. can ONLY ever produce the correct
 * answer, and so is silently dropped by the caller in 100% of cases).
 */
export function predictions(item, correct) {
  const stem = item?.stem || item?.title || "";
  const out = [];
  const push = (id, value) => {
    if (value != null && Number.isFinite(value)) out.push({ id, value });
  };
  // Stem first — an operator the student can SEE is the strongest evidence of
  // what they were asked to do. The verified explanation path only runs when the
  // stem is prose, so it can never override or weaken an existing detection.
  const expression = scanExpression(stem) || verifiedExpression(item, correct);

  if (expression) {
    const { a, b, op, aText, bText } = expression;
    // Fraction operands are parsed up front because they change which LABEL is
    // the honest one: on "7/2 ÷ 1/4" the generic "multiplied instead of dividing"
    // and the specific "divided without inverting" are the same arithmetic
    // (7/8). Reporting both would make every fraction-division miss ambiguous, so
    // the fraction-specific name wins and the generic one stands down.
    const left = fractionParts(aText);
    const right = fractionParts(bText);
    const bothFractions = Boolean(left && right);

    if (op === "*") {
      push("op-added-instead-of-multiplied", a + b);
      push("op-divided-instead-of-multiplied", apply(a, b, "/"));
    }
    if (op === "+") push("op-multiplied-instead-of-added", a * b);
    if (op === "-") push("op-reversed-subtraction", b - a);
    if (op === "/") {
      push("op-reversed-division", apply(b, a, "/"));
      if (!bothFractions) push("op-multiplied-instead-of-divided", a * b);
    }

    // Decimal place value: the digits are right, the point is not. Only fires
    // when at least one operand actually carries a decimal point, so a clean
    // whole-number problem never gets a decimal label.
    const hasDecimal = /\./.test(aText) || /\./.test(bText);
    if (hasDecimal && correct != null) {
      for (const power of [-3, -2, -1, 1, 2, 3]) {
        push("decimal-place-value", correct * 10 ** power);
      }
      push("decimal-place-value", apply(digitsOnly(aText), digitsOnly(bText), op));
    }

    // Fraction-specific errors need the written parts, not the values.
    if (bothFractions) {
      if (op === "+") push("fraction-added-denominators", (left.n + right.n) / (left.d + right.d));
      if (op === "/") {
        // NOTE: there is deliberately no numeric prediction for
        // "fraction-straight-across-division". Dividing straight across is
        // ALGEBRAICALLY VALID for fraction division —
        //   (a/b) ÷ (c/d) === (a÷c) / (b÷d)
        // — so a student who does it arrives at the correct answer, and there is
        // no wrong value to detect. The old predictor pushed
        // `left.n / right.n / (left.d / right.d)`, which is identically the
        // correct answer (verified for all 6561 single-digit fraction pairs).
        // detectMisconception() drops any candidate equal to the correct answer,
        // so that prediction was inert in 100% of cases: the tag could never fire
        // from telemetry, and it silently never reached the heatmap, the class
        // pulse, or the curriculum map.
        //
        // The tag itself remains fully supported through AUTHORED distractors
        // (item.misconceptionTags[choiceIndex]), which detectMisconception()
        // honours BEFORE any prediction — that is the only honest way to label
        // this error, because it is diagnosed from the student's WRITTEN METHOD,
        // not from their answer. misconceptions.deadprediction.test.mjs stops a
        // structurally-inert predictor from being reintroduced here.
        push("fraction-no-reciprocal", (left.n * right.n) / (left.d * right.d));
      }
    }
  }

  // Percent stems carry no operator symbol ("What is 15% of 60?"), so they are
  // scanned independently of the binary-expression path.
  const percent = stem.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of\s*(\d+(?:\.\d+)?))?/i);
  if (percent) {
    push("percent-used-as-whole-number", Number(percent[1]));
    if (correct != null) {
      push("percent-scale-off-by-100", correct * 100);
      push("percent-scale-off-by-100", correct / 100);
    }
  }

  // Exponents: 2³ read as 2 × 3.
  const power = stem.match(/(\d+)\s*(?:\^\s*(\d+)|([²³⁴⁵⁶]))/);
  if (power) {
    const base = Number(power[1]);
    const exponent = power[2]
      ? Number(power[2])
      : { "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6 }[power[3]];
    if (base && exponent) push("exponent-as-multiplication", base * exponent);
  }

  // Order of operations: evaluate strictly left to right and see if that is what
  // the student wrote. Only for stems that actually mix precedence levels.
  const chain = stem.match(/^[\s\d.+\-×÷*/()]+$/) ? stem : null;
  if (chain && /[+−\-]/.test(chain) && /[×÷*]/.test(chain)) {
    const tokens = chain.match(/-?\d+(?:\.\d+)?|[+×÷*\-−]/g) || [];
    if (tokens.length >= 5 && !/[()]/.test(chain)) {
      let running = Number(tokens[0]);
      for (let i = 1; i + 1 < tokens.length; i += 2) {
        const symbol = tokens[i];
        const next = Number(tokens[i + 1]);
        const op =
          symbol === "+"
            ? "+"
            : symbol === "×" || symbol === "*"
              ? "*"
              : symbol === "÷"
                ? "/"
                : "-";
        running = apply(running, next, op);
        if (running == null) break;
      }
      push("order-of-operations-left-to-right", running);
    }
  }

  // Statistics: the sum of a listed data set, offered instead of its mean.
  if (/\b(mean|average)\b/i.test(stem)) {
    const values = allNumbers(stem);
    if (values.length >= 3)
      push(
        "stat-summed-instead-of-averaged",
        values.reduce((s, v) => s + v, 0),
      );
  }

  // Rectangle measurement: area asked, perimeter given (and the reverse).
  const dimensions = stem.match(
    /(\d+(?:\.\d+)?)\s*(?:units?|cm|m|in|ft|mm)?\s*(?:by|×|x)\s*(\d+(?:\.\d+)?)/i,
  );
  if (dimensions) {
    const length = Number(dimensions[1]);
    const width = Number(dimensions[2]);
    if (/\barea\b/i.test(stem)) push("measure-area-perimeter-swap", 2 * (length + width));
    if (/\bperimeter\b/i.test(stem)) push("measure-area-perimeter-swap", length * width);
  }

  // Unit rate: the total handed over instead of the per-one value.
  if (/\bper\b|\beach\b|\bunit rate\b/i.test(stem) && expression && expression.op === "/") {
    push("rate-not-per-one", expression.a);
    push("ratio-inverted", apply(expression.b, expression.a, "/"));
  }

  // Triangle area: base × height offered without the half. Gated on the words
  // "triangle" AND "area" AND explicitly labelled base/height quantities, so a
  // rectangle problem or a bare "6 by 4" stem never earns a triangle label.
  if (/\btriangle\b/i.test(stem) && /\barea\b/i.test(stem)) {
    const base = stem.match(/base\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/i);
    const height = stem.match(/height\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/i);
    if (base && height) {
      push("geom-triangle-area-no-half", Number(base[1]) * Number(height[1]));
    }
  }

  // Volume of a rectangular prism: the three dimensions added instead of
  // multiplied. Needs the word "volume" and a full "L by W by H" chain.
  if (/\bvolume\b/i.test(stem)) {
    const triple = stem.match(
      /(\d+(?:\.\d+)?)\s*(?:units?|cm|m|in|ft|mm)?\s*(?:by|×|x)\s*(\d+(?:\.\d+)?)\s*(?:units?|cm|m|in|ft|mm)?\s*(?:by|×|x)\s*(\d+(?:\.\d+)?)/i,
    );
    if (triple) {
      push(
        "geom-volume-added-dimensions",
        Number(triple[1]) + Number(triple[2]) + Number(triple[3]),
      );
    }
  }

  // Distributive property: a(b + c) with the outside factor applied to the
  // first term only — a·b + c. Only for a literal numeric "N(N ± N)" in the
  // stem, so prose never triggers it.
  const distributive = stem.match(
    /(\d+(?:\.\d+)?)\s*\(\s*(\d+(?:\.\d+)?)\s*([+−–-])\s*(\d+(?:\.\d+)?)\s*\)/,
  );
  if (distributive) {
    const factor = Number(distributive[1]);
    const first = Number(distributive[2]);
    const second = Number(distributive[4]);
    const sign = distributive[3] === "+" ? 1 : -1;
    push("algebra-distributive-partial", factor * first + sign * second);
  }

  // Sign loss is the explanation of LAST RESORT, and only for negative answers.
  // On "12 − 30" the reversal (30 − 12) and the dropped sign (|−18|) are the same
  // number 18, so offering both would make every negative subtraction ambiguous
  // and the detector would go silent on its most common case. The reversal is the
  // more specific claim — it names what the student *did* to the operation — so a
  // bare sign claim is only added when nothing else already predicts that value.
  if (correct != null && correct < 0) {
    const magnitude = Math.abs(correct);
    if (!out.some(({ value }) => near(value, magnitude))) push("sign-dropped", magnitude);
  }

  return out;
}

/**
 * The correct answer as written, across the two item shapes this engine sees.
 * Small-group items carry a free-text `answer`; main-path lesson items carry
 * `choices` + `correctIndex`. Reading both here — rather than at each call site —
 * is what let the same detector serve the lesson renderer without a second copy
 * of the taxonomy.
 */
function correctAnswerText(item) {
  if (item?.answer != null) return item.answer;
  if (Array.isArray(item?.choices) && Number.isInteger(item?.correctIndex)) {
    return item.choices[item.correctIndex];
  }
  return null;
}

/**
 * Name the misconception behind a wrong response, or return null.
 *
 * @param {object} item   the practice item (stem + answer, or stem + choices)
 * @param {string} typed  what the student actually entered or selected
 * @returns {string|null} a key of MISCONCEPTIONS
 */
export function detectMisconception(item, typed, choiceIndex = null) {
  // Authored tag first: an author who named the error for this distractor knows
  // more than any predictor can.
  const it = /** @type {any} */ (item);
  if (Number.isInteger(choiceIndex) && Array.isArray(it?.misconceptionTags)) {
    const authored = resolveAuthoredTag(it.misconceptionTags[choiceIndex]);
    if (authored) return authored;
  }
  const answer = numberOf(correctAnswerText(item));
  const response = numberOf(String(typed ?? "").replace(/[a-z°²³\s./$%]+$/i, ""));
  if (response == null) return null;
  const candidates = predictions(item, answer);
  if (!candidates.length) return null;
  // A prediction that lands on the correct answer explains nothing, and a
  // response matching two different misconceptions is not evidence for either.
  const matched = [
    ...new Set(
      candidates
        .filter(({ value }) => !(answer != null && near(value, answer)))
        .filter(({ value }) => near(value, response))
        .map(({ id }) => id),
    ),
  ];
  return matched.length === 1 ? matched[0] : null;
}

/**
 * Diagnose a wrong multiple-choice selection.
 *
 * The lesson renderer knows only WHICH option was clicked, so it cannot call
 * detectMisconception() without first resolving that index back to the text the
 * student chose. Doing that here keeps the index→text step in one place and
 * keeps the ambiguity rule (below, in detectMisconception) authoritative for
 * every surface.
 *
 * @returns {{ id: string, label: string, student: string, watchFor: string }|null}
 */
export function diagnoseChoice(item, choiceIndex) {
  if (!Number.isInteger(choiceIndex)) return null;
  const chosen = Array.isArray(item?.choices) ? item.choices[choiceIndex] : null;
  if (chosen == null) return null;
  const id = detectMisconception(item, chosen, choiceIndex);
  if (!id || !MISCONCEPTIONS[id]) return null;
  return { id, ...MISCONCEPTIONS[id] };
}

/**
 * The learner-facing sentence for a misconception id, in the requested language.
 * Falls back to English when a Spanish string is absent so a partially
 * translated taxonomy degrades to readable, never to blank.
 */
export function studentExplanation(id, lang = "en") {
  const entry = MISCONCEPTIONS[id];
  if (!entry) return "";
  if (lang === "es") return entry.studentEs || entry.student || "";
  return entry.student || "";
}

/**
 * The short diagnosis chip ("Added the denominators") in the requested
 * language. Mirrors `studentExplanation` — same fallback rule, so a partially
 * translated taxonomy degrades to readable English, never to blank.
 *
 * Callers want this rather than `diagnoseChoice(...).labelEs`: that spread is
 * typed from the entries that carry no Spanish, so reaching into it is both a
 * type error and a silent `undefined` on any entry that was never translated.
 */
export function misconceptionLabel(id, lang = "en") {
  const entry = MISCONCEPTIONS[id];
  if (!entry) return "";
  if (lang === "es") return entry.labelEs || entry.label || "";
  return entry.label || "";
}

/**
 * Persist a misconception hit on this device. Counts only — never the typed
 * text, never a name. The aggregate is what a teacher can act on; the raw
 * response is what would make this surface a privacy problem.
 */
export function recordMisconception(store, id) {
  if (!id || !MISCONCEPTIONS[id]) return null;
  const counts = { ...(store?.get?.("misconceptions") || {}) };
  counts[id] = (counts[id] || 0) + 1;
  store?.set?.("misconceptions", counts);
  return counts;
}

/** The n most frequent misconceptions, highest first. */
export function topMisconceptions(counts, n = 2) {
  return Object.entries(counts || {})
    .filter(([id]) => MISCONCEPTIONS[id])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([id, count]) => ({ id, count, ...MISCONCEPTIONS[id] }));
}

export default detectMisconception;
