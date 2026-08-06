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
  "measure-area-perimeter-swap": {
    label: "Swapped area and perimeter",
    labelEs: "Confundió área y perímetro",
    watchFor: "Ask what the unit should be — units or square units?",
    student:
      "Area and perimeter got swapped. Check the unit you should end with — plain units, or square units?",
    studentEs:
      "Se confundieron área y perímetro. Revisa con qué unidad debes terminar: ¿unidades o unidades cuadradas?",
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
    const authored = AUTHORED_TAGS[it.misconceptionTags[choiceIndex]];
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
