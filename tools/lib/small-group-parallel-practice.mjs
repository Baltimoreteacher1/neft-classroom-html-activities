import { authoredBank } from "./small-group-authored-banks.mjs";
import {
  buildCoordinatePractice,
  buildDataPractice,
  buildTwoVariablePractice,
} from "./small-group-parallel-practice-data.mjs";

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const tidy = (value) => Number(Number(value).toFixed(4));
const factors = (value) =>
  Array.from({ length: value }, (_, index) => index + 1).filter(
    (candidate) => value % candidate === 0,
  );

function primeFactors(value) {
  const result = [];
  let remaining = value;
  for (let divisor = 2; divisor * divisor <= remaining; divisor++) {
    while (remaining % divisor === 0) {
      result.push(divisor);
      remaining /= divisor;
    }
  }
  if (remaining > 1) result.push(remaining);
  return result;
}

function fraction(numerator, denominator) {
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  return { n: (sign * numerator) / divisor, d: Math.abs(denominator) / divisor };
}

const fractionText = ({ n, d }) => (d === 1 ? String(n) : `${n}/${d}`);
// Grade-6 display form: improper fractions read as mixed numbers ("2 1/2").
const mixedText = ({ n, d }) => {
  if (d === 1) return String(n);
  const whole = Math.trunc(n / d);
  const rest = Math.abs(n % d);
  if (!whole) return `${n}/${d}`;
  return rest ? `${whole} ${rest}/${d}` : String(whole);
};
const divideFractions = (left, right) => fraction(left.n * right.d, left.d * right.n);

// Spanish lane defaults — deterministic parallel templates, never runtime translation.
const ES_REREAD_HINT = "Vuelve a leer la pregunta. ¿Qué te pide encontrar exactamente?";
const ES_DEFAULT_STRATEGY = "Usa el modelo visual y completa un paso a la vez.";

function makeItem(
  context,
  index,
  { stem, stemEs, answer, visual, steps, hint, hintEs, explanation, explanationEs },
) {
  // Hints ladder nudge → strategy → worked first step, never the answer.
  // Steps arrive as [promptEn, answer, promptEs]; answers are shared across lanes.
  // Spanish is emitted ONLY when this builder authored a Spanish stem — the
  // engine's bi() helper falls back to English for every other item, so a
  // half-translated unit never leaks "undefined" or a stray Spanish hint.
  const strategy = hint || "Use the visual model, then complete one step at a time.";
  // The comment above says "never the answer", and until now the code broke that
  // promise: for any item whose FIRST step answer is also the item's final answer
  // (every LCM/GCF guided-fill, among others) filling the blank printed the answer
  // into hint 3. Detected fleet-wide by tools/eval-small-group-fleet.mjs. When the
  // first step would give the answer away, the hint points AT the step and leaves
  // the blank blank; otherwise it still works the step, which is the useful case.
  const firstStepIsAnswer = steps[0] && String(steps[0][1]) === String(answer);
  const firstStep = steps[0]
    ? firstStepIsAnswer
      ? String(steps[0][0])
      : String(steps[0][0]).replace("___", String(steps[0][1]))
    : null;
  const firstStepLead = firstStepIsAnswer ? "Start with this step" : "Start like this";
  const hasEs = Boolean(stemEs);
  const item = {
    id: `${context.lessonId}-parallel-${String(index + 1).padStart(2, "0")}`,
    type: "guided-fill",
    stem,
    answer: String(answer),
    visual,
    steps: steps.map(([prompt, stepAnswer, promptEs]) =>
      hasEs && promptEs
        ? { prompt, promptEs, answer: String(stepAnswer) }
        : { prompt, answer: String(stepAnswer) },
    ),
    hints: [
      "Re-read the question. What exactly is it asking you to find?",
      strategy,
      ...(firstStep ? [`${firstStepLead}: ${firstStep}`] : []),
    ],
    explanation:
      explanation || steps.map(([prompt, value]) => prompt.replace("___", value)).join(" "),
  };
  if (hasEs) {
    item.stemEs = stemEs;
    const firstStepEs =
      steps[0] && steps[0][2]
        ? firstStepIsAnswer
          ? String(steps[0][2])
          : String(steps[0][2]).replace("___", String(steps[0][1]))
        : null;
    const firstStepLeadEs = firstStepIsAnswer ? "Empieza con este paso" : "Empieza así";
    item.hintsEs = [
      ES_REREAD_HINT,
      hintEs || ES_DEFAULT_STRATEGY,
      ...(firstStepEs ? [`${firstStepLeadEs}: ${firstStepEs}`] : []),
    ];
    const explEs =
      explanationEs ||
      (steps.every((step) => step[2])
        ? steps.map(([, value, promptEs]) => String(promptEs).replace("___", value)).join(" ")
        : null);
    if (explEs) item.explanationEs = explEs;
  }
  return item;
}

function unit1(context) {
  const lesson = context.lesson;
  const shift = context.group === 2 ? 12 : 0;
  if (lesson === 1) {
    const values = [42, 54, 66, 70, 75, 84, 88, 96, 99, 105, 110, 126];
    return values.map((base, index) => {
      const value = base + shift * 2;
      const primes = primeFactors(value);
      const first = primes[0];
      return makeItem(context, index, {
        stem: `Build a new factor tree for ${value}. Write the prime factorization.`,
        stemEs: `Construye un nuevo árbol de factores para ${value}. Escribe la factorización prima.`,
        answer: primes.join(" × "),
        visual: { kind: "factor-tree", value },
        steps: [
          [
            `The smallest prime factor of ${value} is ___.`,
            first,
            `El factor primo más pequeño de ${value} es ___.`,
          ],
          [`${value} ÷ ${first} = ___.`, value / first, `${value} ÷ ${first} = ___.`],
          [
            "Keep splitting until every end number is prime. Write the prime factorization: ___.",
            primes.join(" × "),
            "Sigue separando hasta que cada número del final sea primo. Escribe la factorización prima: ___.",
          ],
        ],
        hint: "Start by testing divisibility by 2, then 3, then 5.",
        hintEs: "Empieza probando la divisibilidad entre 2, luego entre 3 y luego entre 5.",
      });
    });
  }
  if (lesson === 2 || lesson === 3) {
    const pairs = [
      [18, 30],
      [24, 36],
      [28, 42],
      [32, 48],
      [35, 50],
      [40, 60],
      [45, 75],
      [54, 72],
      [56, 84],
      [63, 90],
      [70, 105],
      [72, 108],
    ];
    return pairs.map(([left, right], index) => {
      // Group 2 doubles the pair instead of shifting it: additive shifts made
      // near-coprime pairs (41 & 62) whose factor/multiple models are
      // unteachable; doubling preserves the structure at a harder scale.
      const scaleUp = context.group === 2 ? 2 : 1;
      const a = left * scaleUp;
      const b = right * scaleUp;
      const answer = lesson === 2 ? gcd(a, b) : lcm(a, b);
      const label = lesson === 2 ? "greatest common factor" : "least common multiple";
      const labelEs = lesson === 2 ? "máximo común divisor" : "mínimo común múltiplo";
      return makeItem(context, index, {
        stem: `Find the ${label} of ${a} and ${b}.`,
        stemEs: `Encuentra el ${labelEs} de ${a} y ${b}.`,
        answer,
        visual: { kind: lesson === 2 ? "factor-table" : "multiple-lanes", values: [a, b] },
        steps:
          lesson === 2
            ? [
                [
                  `List the factors of ${a}: ___.`,
                  factors(a).join(", "),
                  `Escribe los factores de ${a}: ___.`,
                ],
                [
                  `List the factors of ${b}: ___.`,
                  factors(b).join(", "),
                  `Escribe los factores de ${b}: ___.`,
                ],
                [
                  "Choose the greatest factor in both lists: ___.",
                  answer,
                  "Elige el factor más grande que aparece en las dos listas: ___.",
                ],
              ]
            : [
                [
                  `The smallest multiple that ${a} and ${b} share is ___.`,
                  answer,
                  `El múltiplo más pequeño que comparten ${a} y ${b} es ___.`,
                ],
                [
                  `Check: ${answer} ÷ ${a} = ___.`,
                  answer / a,
                  `Comprueba: ${answer} ÷ ${a} = ___.`,
                ],
                [
                  `Check: ${answer} ÷ ${b} = ___.`,
                  answer / b,
                  `Comprueba: ${answer} ÷ ${b} = ___.`,
                ],
              ],
      });
    });
  }
  if (lesson === 4) {
    return Array.from({ length: 12 }, (_, index) => {
      const divisor = 6 + (index % 7);
      const quotient = 42 + index * 3 + shift;
      const remainder = index % divisor;
      const dividend = divisor * quotient + remainder;
      return makeItem(context, index, {
        stem: `Divide ${dividend} by ${divisor}. Give the quotient and remainder.`,
        stemEs: `Divide ${dividend} entre ${divisor}. Escribe el cociente y el residuo.`,
        answer: `${quotient} R${remainder}`,
        visual: { kind: "division-box", values: [dividend, divisor] },
        steps: [
          [
            `${divisor} fits into ${dividend} about ___ times.`,
            quotient,
            `${divisor} cabe en ${dividend} aproximadamente ___ veces.`,
          ],
          [
            `Multiply back: ${divisor} × ${quotient} = ___.`,
            divisor * quotient,
            `Multiplica para comprobar: ${divisor} × ${quotient} = ___.`,
          ],
          ["The amount left is ___.", remainder, "La cantidad que sobra es ___."],
        ],
      });
    });
  }
  return Array.from({ length: 12 }, (_, index) => {
    const operation = lesson === 5 ? (index % 2 ? "−" : "+") : lesson === 6 ? "×" : "÷";
    const b = tidy(1.2 + (index % 5) * 0.25);
    let a = tidy(4.25 + index * 0.7 + context.group * 0.13);
    let answer;
    if (operation === "÷") {
      // Build the dividend from a clean quotient so every hand-worked
      // division terminates instead of grading a rounded value wrong.
      answer = tidy(2 + (index % 4) + (index % 2 ? 0.5 : 0.2) + (context.group === 2 ? 1 : 0));
      a = tidy(b * answer);
    } else {
      answer = operation === "+" ? tidy(a + b) : operation === "−" ? tidy(a - b) : tidy(a * b);
    }
    const placesA = String(a).split(".")[1]?.length || 0;
    const placesB = String(b).split(".")[1]?.length || 0;
    // Each operation gets a scaffold that matches HOW you actually do it:
    // add/subtract lines up place values, multiply works as whole numbers then
    // places the point, divide makes the divisor whole then divides. The old
    // template scaffolded every decimal op as if it were addition ("line up the
    // place values"), which made Multiply Decimals read like Add Decimals.
    let steps;
    if (operation === "×") {
      const intA = Math.round(a * 10 ** placesA);
      const intB = Math.round(b * 10 ** placesB);
      const totalPlaces = placesA + placesB;
      const plural = totalPlaces === 1 ? "" : "s";
      steps = [
        [
          `Multiply as whole numbers, ignoring the decimals: ${intA} × ${intB} = ___.`,
          intA * intB,
          `Multiplica como números enteros, sin los decimales: ${intA} × ${intB} = ___.`,
        ],
        [
          `Count the total decimal places in both factors (${placesA} + ${placesB}): ___.`,
          totalPlaces,
          `Cuenta el total de cifras decimales en los dos factores (${placesA} + ${placesB}): ___.`,
        ],
        [
          `Place the decimal point ${totalPlaces} place${plural} from the right: ___.`,
          answer,
          `Coloca el punto decimal ${totalPlaces} lugar${totalPlaces === 1 ? "" : "es"} desde la derecha: ___.`,
        ],
      ];
    } else if (operation === "÷") {
      const bWhole = Math.round(b * 10 ** placesB);
      const aShift = tidy(a * 10 ** placesB);
      const plural = placesB === 1 ? "" : "s";
      steps = [
        [
          `Move both decimals ${placesB} place${plural} right so the divisor is a whole number: ___.`,
          bWhole,
          `Mueve ambos decimales ${placesB} lugar${placesB === 1 ? "" : "es"} a la derecha para que el divisor sea entero: ___.`,
        ],
        [
          `Divide ${aShift} ÷ ${bWhole}, bringing the decimal point straight up: ___.`,
          answer,
          `Divide ${aShift} ÷ ${bWhole}, subiendo el punto decimal directamente: ___.`,
        ],
        [
          `Check by multiplying back: ${answer} × ${b} = ___.`,
          tidy(answer * b),
          `Comprueba multiplicando al revés: ${answer} × ${b} = ___.`,
        ],
      ];
    } else {
      const verb = operation === "+" ? "Add" : "Subtract";
      const verbEs = operation === "+" ? "Suma" : "Resta";
      const maxDec = Math.max(placesA, placesB);
      const estimate = tidy(
        operation === "+" ? Math.round(a) + Math.round(b) : Math.round(a) - Math.round(b),
      );
      steps = [
        [
          "Line up the decimal points. How many decimal places will the answer have? ___.",
          maxDec,
          "Alinea los puntos decimales. ¿Cuántas cifras decimales tendrá la respuesta? ___.",
        ],
        [
          `${verb} the digits column by column, keeping the points lined up: ___.`,
          answer,
          `${verbEs} los dígitos columna por columna, manteniendo los puntos alineados: ___.`,
        ],
        [
          `Estimate to check — ${Math.round(a)} ${operation} ${Math.round(b)} is about ___.`,
          estimate,
          `Estima para comprobar — ${Math.round(a)} ${operation} ${Math.round(b)} es aproximadamente ___.`,
        ],
      ];
    }
    return makeItem(context, index, {
      stem: `Solve the new decimal problem: ${a} ${operation} ${b}.`,
      stemEs: `Resuelve el nuevo problema con decimales: ${a} ${operation} ${b}.`,
      answer,
      visual: { kind: "place-value", values: [a, b], operation },
      steps,
    });
  });
}

// Non-unit, already-lowest-terms fractions for unit2's lesson-1 (6-1) fraction
// ÷ whole-number items — see the comment where this is used.
const FRACTION_PAIRS = [
  [2, 3],
  [3, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [2, 7],
  [3, 7],
  [4, 7],
  [3, 8],
  [2, 9],
  [5, 6],
  [3, 10],
];

function unit2(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const a = 2 + (index % 5);
    const b = 3 + (index % 4);
    const c = 2 + ((index + 1) % 5);
    const d = 3 + ((index + 2) % 5);
    let left = fraction(a, b);
    let right = fraction(c, d);
    let stem;
    let stemEs;
    if (lesson === 1) {
      // 6-1's objective is whole ÷ unit fraction AND fraction ÷ whole number —
      // never fraction ÷ fraction, which is 6-2's strand. The generator this
      // replaced put a non-unit fraction on BOTH sides ("how many groups of
      // 1/4 fit in 2/3?"), so every one of 6-1's 12 guided-fill drills was
      // 6-2's mathematics under 6-1's small group. Round-robin the two shapes
      // 6-1 actually teaches, half and half, same as the lesson itself.
      // 6 items of each shape per row (index 0..11). period-7 walk on k means
      // k*3 mod 7 visits 6 distinct residues for k=0..5 — enough that the
      // varying side of each pair (the unit-fraction denominator, or the
      // whole-number divisor) never repeats within the 12, so no two stems
      // collide even where the other side does. A period-5 walk would not:
      // 6 values of k through a period-5 modulus must repeat by pigeonhole,
      // which is exactly how the first version of this fix shipped item 1
      // and item 11 as the same problem.
      const k = Math.floor(index / 2);
      const walk = (k * 3 + context.group) % 7;
      if (index % 2 === 0) {
        const whole = 2 + (k % 5);
        const denom = 3 + walk;
        left = fraction(whole, 1);
        right = fraction(1, denom);
        stem = `Divide the whole number by the unit fraction: ${fractionText(left)} ÷ ${fractionText(right)}.`;
        stemEs = `Divide el número entero entre la fracción unitaria: ${fractionText(left)} ÷ ${fractionText(right)}.`;
      } else {
        // Numerators are never 1 — a numerator of exactly 1 is the unit
        // fraction shape 6-1 already taught before this fix, and its own new
        // practice covers it. Pulled from a curated, already-reduced list
        // rather than built from k arithmetically: the arithmetic version
        // (numerator = 2 + k%3, denom = numerator * small factor) kept landing
        // on denominators that were multiples of the numerator, so `fraction()`
        // silently reduced 2/4 and 3/6 both down to 1/2 — the unit fraction
        // this branch exists to avoid, and four of the six items repeated it.
        const [numerator, denom] = FRACTION_PAIRS[(k + context.group * 3) % FRACTION_PAIRS.length];
        const whole = 2 + walk;
        left = fraction(numerator, denom);
        right = fraction(whole, 1);
        stem = `Divide the fraction by the whole number: ${fractionText(left)} ÷ ${fractionText(right)}.`;
        stemEs = `Divide la fracción entre el número entero: ${fractionText(left)} ÷ ${fractionText(right)}.`;
      }
    } else if (lesson === 2) {
      left = fraction(3 + index + context.group, 1);
      right = fraction(1 + (index % 3), 2 + (index % 4));
      stem = `Divide the whole number by the fraction: ${fractionText(left)} ÷ ${fractionText(right)}.`;
      stemEs = `Divide el número entero entre la fracción: ${fractionText(left)} ÷ ${fractionText(right)}.`;
    } else if (lesson === 4) {
      left = fraction((2 + (index % 4)) * 2 + 1, 2);
      right = fraction((1 + (index % 3)) * 3 + 1, 3);
      stem = `Divide the mixed-number amounts: ${mixedText(left)} ÷ ${mixedText(right)}.`;
      stemEs = `Divide las cantidades de números mixtos: ${mixedText(left)} ÷ ${mixedText(right)}.`;
    } else {
      if (lesson === 5) {
        // "How many pieces can be cut?" demands a WHOLE number of pieces, and
        // arbitrary fraction pairs answered it with 5/12 of a piece — a piece
        // longer than the ribbon, and the exact signature this strand's own
        // commonMistake teaches students to treat as an error. A unit-fraction
        // piece 1/(b·m) divides a/b into exactly a·m pieces, so the context
        // and the arithmetic agree by construction (2026-08-14 audit).
        // m varies by index BLOCK, not index%3 — the simplified ribbons repeat
        // ((2,4) and (3,6) both give 1/2), and a same-cycle m would then
        // duplicate whole stems.
        right = fraction(1, left.d * (1 + (Math.floor(index / 4) % 3)));
      }
      stem =
        lesson === 5
          ? `A ribbon is ${fractionText(left)} meter long. Each piece is ${fractionText(right)} meter. How many pieces can be cut?`
          : `Solve the new fraction quotient: ${fractionText(left)} ÷ ${fractionText(right)}.`;
      stemEs =
        lesson === 5
          ? `Una cinta mide ${fractionText(left)} de metro. Cada pedazo mide ${fractionText(right)} de metro. ¿Cuántos pedazos se pueden cortar?`
          : `Resuelve el nuevo cociente de fracciones: ${fractionText(left)} ÷ ${fractionText(right)}.`;
    }
    const answer = divideFractions(left, right);
    const reciprocal = fraction(right.d, right.n);
    const firstStep =
      lesson === 4
        ? [
            `Rewrite ${mixedText(left)} as an improper fraction: ___.`,
            fractionText(left),
            `Reescribe ${mixedText(left)} como fracción impropia: ___.`,
          ]
        : [`Keep the first number: ___.`, fractionText(left), `Conserva el primer número: ___.`];
    return makeItem(context, index, {
      stem,
      stemEs,
      answer: fractionText(answer),
      visual: { kind: "fraction-bars", left, right },
      steps: [
        firstStep,
        [
          `Use the reciprocal of ${fractionText(right)}: ___.`,
          fractionText(reciprocal),
          `Usa el recíproco de ${fractionText(right)}: ___.`,
        ],
        ["Multiply and simplify: ___.", fractionText(answer), "Multiplica y simplifica: ___."],
      ],
      hint: "Keep the first fraction, change division to multiplication, and flip the second fraction.",
      hintEs:
        "Conserva la primera fracción, cambia la división por multiplicación e invierte la segunda fracción.",
    });
  });
}

function unit3(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const left = 2 + (index % 6);
    const right = 3 + ((index * 2) % 7);
    const scale = 2 + (index % 5) + (context.group === 2 ? 2 : 0);
    const unitRate = tidy(right / left);
    let stem = `A new model has ${left} blue tiles for every ${right} gold tiles. Write the ratio blue:gold.`;
    let stemEs = `Un nuevo modelo tiene ${left} fichas azules por cada ${right} fichas doradas. Escribe la razón azul:dorado.`;
    let answer = `${left}:${right}`;
    let steps = [
      ["Blue tiles: ___.", left, "Fichas azules: ___."],
      ["Gold tiles: ___.", right, "Fichas doradas: ___."],
      ["Write blue first, then gold: ___.", answer, "Escribe primero azul y luego dorado: ___."],
    ];
    let visual = { kind: "ratio-dots", values: [left, right] };
    if ([2, 3, 4].includes(lesson)) {
      answer = `${left * scale}:${right * scale}`;
      stem = `Complete a new equivalent ratio: ${left}:${right} = ___:___. Use a scale factor of ${scale}.`;
      stemEs = `Completa una nueva razón equivalente: ${left}:${right} = ___:___. Usa un factor de escala de ${scale}.`;
      steps = [
        [`Multiply ${left} × ${scale}: ___.`, left * scale, `Multiplica ${left} × ${scale}: ___.`],
        [
          `Multiply ${right} × ${scale}: ___.`,
          right * scale,
          `Multiplica ${right} × ${scale}: ___.`,
        ],
        ["Write the equivalent ratio: ___.", answer, "Escribe la razón equivalente: ___."],
      ];
      visual = {
        kind: lesson === 3 ? "coordinate-ratio" : "ratio-table",
        values: [left, right, scale],
      };
    } else if ([5, 7].includes(lesson)) {
      const otherLeft = left + 1;
      const otherRight = right + 2;
      const otherRate = tidy(otherRight / otherLeft);
      answer = unitRate < otherRate ? "first" : "second";
      stem = `Compare gold tiles per blue tile for ${left}:${right} and ${otherLeft}:${otherRight}. Which ratio gives fewer gold tiles per blue tile? Type first or second.`;
      stemEs = `Compara las fichas doradas por cada ficha azul en ${left}:${right} y ${otherLeft}:${otherRight}. ¿Qué razón da menos fichas doradas por ficha azul? Escribe first (primera) o second (segunda).`;
      steps = [
        [
          `First rate — gold per blue: ${right} ÷ ${left} = ___.`,
          unitRate,
          `Primera tasa — doradas por azul: ${right} ÷ ${left} = ___.`,
        ],
        [
          `Second rate — gold per blue: ${otherRight} ÷ ${otherLeft} = ___.`,
          otherRate,
          `Segunda tasa — doradas por azul: ${otherRight} ÷ ${otherLeft} = ___.`,
        ],
        [
          "The smaller rate belongs to the ___ ratio (type first or second).",
          answer,
          "La tasa menor corresponde a la razón ___ (escribe first o second).",
        ],
      ];
      visual = { kind: "double-rate-bars", values: [left, right, otherLeft, otherRight] };
    } else if (lesson === 6) {
      answer = left * scale;
      stem = `A drawing uses a scale of 1:${scale}. A side is ${left} cm in the drawing. Find the actual length.`;
      stemEs = `Un dibujo usa una escala de 1:${scale}. Un lado mide ${left} cm en el dibujo. Encuentra la longitud real.`;
      steps = [
        [`Scale factor: ___.`, scale, `Factor de escala: ___.`],
        [`Multiply ${left} × ${scale}: ___.`, answer, `Multiplica ${left} × ${scale}: ___.`],
      ];
      visual = { kind: "scale-bars", values: [left, answer] };
    }
    return makeItem(context, index, { stem, stemEs, answer, visual, steps });
  });
}

function unit4(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const n = index + 2 + context.group;
    if (lesson === 2) {
      const [numerator, denominator] = [
        [1, 2],
        [1, 4],
        [3, 4],
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 5],
        [1, 8],
        [3, 8],
        [5, 8],
        [7, 8],
        [9, 10],
      ][index];
      const decimal = tidy(numerator / denominator);
      const percent = tidy(decimal * 100);
      return makeItem(context, index, {
        stem: `Complete the new equivalence: ${numerator}/${denominator} = ___ decimal = ___%.`,
        stemEs: `Completa la nueva equivalencia: ${numerator}/${denominator} = ___ en decimal = ___%.`,
        answer: `${decimal} = ${percent}%`,
        visual: { kind: "percent-grid", percent },
        steps: [
          [
            `Divide ${numerator} ÷ ${denominator}: ___.`,
            decimal,
            `Divide ${numerator} ÷ ${denominator}: ___.`,
          ],
          [`Multiply the decimal by 100: ___.`, percent, `Multiplica el decimal por 100: ___.`],
          [
            "Write the percent with its symbol: ___.",
            `${percent}%`,
            "Escribe el porcentaje con su símbolo: ___.",
          ],
        ],
      });
    }
    if (lesson === 3) {
      const percent = index % 2 ? tidy(125 + n * 7.5) : tidy((n + 1) / 100);
      const decimal = tidy(percent / 100);
      return makeItem(context, index, {
        stem: `Rewrite the new percent ${percent}% as a decimal.`,
        stemEs: `Reescribe el nuevo porcentaje ${percent}% como decimal.`,
        answer: decimal,
        visual: { kind: "percent-grid", percent },
        steps: [
          ["Percent means divide by ___.", 100, "Porcentaje significa dividir entre ___."],
          [`${percent} ÷ 100 = ___.`, decimal, `${percent} ÷ 100 = ___.`],
        ],
      });
    }
    if (lesson === 8) {
      // Find the whole given the part and percent (4-5, 6.AT.4) — added by the
      // 2026-08-14 alignment audit. The identity mapping [4, 5] pointed at the
      // OLD 4-5's discount family, so a find-the-whole lesson drilled sale
      // prices. The whole is constructed first, so every quotient is exact.
      const percent = [50, 25, 20, 10, 40, 75][index % 6];
      const whole = 40 + (index + 2 + context.group) * 10;
      const part = tidy((whole * percent) / 100);
      const decimal = percent / 100;
      return makeItem(context, index, {
        stem: `${percent}% of a number is ${part}. Find the whole (the 100%).`,
        stemEs: `El ${percent}% de un número es ${part}. Encuentra el entero (el 100%).`,
        answer: whole,
        visual: { kind: "percent-grid", percent },
        steps: [
          [
            `Write ${percent}% as a decimal: ___.`,
            decimal,
            `Escribe ${percent}% como decimal: ___.`,
          ],
          [
            `The part ÷ the percent gives the whole: ${part} ÷ ${decimal} = ___.`,
            whole,
            `La parte ÷ el porcentaje da el entero: ${part} ÷ ${decimal} = ___.`,
          ],
          [
            `Check: ${percent}% of ${whole} = ___.`,
            part,
            `Comprueba: el ${percent}% de ${whole} = ___.`,
          ],
        ],
        hint: "You already HAVE the part — the question runs backward, so divide instead of multiplying.",
        hintEs:
          "Ya TIENES la parte: la pregunta va hacia atrás, así que divide en vez de multiplicar.",
      });
    }
    if (lesson === 9) {
      // Benchmark estimation of a percent (4-3, 6.AT.4) — added by the
      // 2026-08-14 alignment audit. The [4, 4] family computed exact percents
      // with the decimal algorithm, coaching the opposite of the objective
      // ("estimate using benchmark percents, rounding, compatible numbers").
      const percent = [19, 21, 52, 48, 9, 11][index % 6];
      const benchmark = [20, 20, 50, 50, 10, 10][index % 6];
      const base = 38 + (index + 2 + context.group) * 11;
      const friendly = Math.round(base / 10) * 10;
      const estimate = tidy((friendly * benchmark) / 100);
      return makeItem(context, index, {
        stem: `Estimate ${percent}% of ${base} using benchmarks — no exact computing.`,
        stemEs: `Estima el ${percent}% de ${base} usando puntos de referencia, sin calcular exacto.`,
        answer: estimate,
        visual: { kind: "percent-grid", percent: benchmark },
        steps: [
          [
            `Round ${percent}% to a benchmark percent: ___%.`,
            benchmark,
            `Redondea ${percent}% a un porcentaje de referencia: ___%.`,
          ],
          [
            `Round ${base} to a friendly number: ___.`,
            friendly,
            `Redondea ${base} a un número amigable: ___.`,
          ],
          [
            `${benchmark}% of ${friendly} = ___.`,
            estimate,
            `El ${benchmark}% de ${friendly} = ___.`,
          ],
        ],
        hint: `Benchmarks are the percents you can do in your head — 10% slides the decimal, 50% halves, 20% is double 10%.`,
        hintEs: `Los puntos de referencia son porcentajes mentales: 10% corre el decimal, 50% es la mitad, 20% es el doble de 10%.`,
      });
    }
    const base = 40 + n * 10;
    const percent = [5, 10, 15, 20, 25, 30, 40, 50][index % 8];
    const amount = tidy((base * percent) / 100);
    if ([4, 5].includes(lesson)) {
      const answer = lesson === 5 ? tidy(base - amount) : amount;
      const stem =
        lesson === 5
          ? `A new item costs $${base} and is ${percent}% off. Find the sale price.`
          : `Find ${percent}% of ${base} using a model or equation.`;
      const stemEs =
        lesson === 5
          ? `Un artículo nuevo cuesta $${base} y tiene un ${percent}% de descuento. Encuentra el precio de oferta.`
          : `Encuentra el ${percent}% de ${base} usando un modelo o una ecuación.`;
      return makeItem(context, index, {
        stem,
        stemEs,
        answer,
        visual: { kind: "percent-bar", whole: base, percent },
        steps: [
          [
            `Write ${percent}% as a decimal: ___.`,
            percent / 100,
            `Escribe ${percent}% como decimal: ___.`,
          ],
          [
            `Find the percent amount: ${base} × ${percent / 100} = ___.`,
            amount,
            `Encuentra la cantidad del porcentaje: ${base} × ${percent / 100} = ___.`,
          ],
          ...(lesson === 5
            ? [
                [
                  `Subtract the discount: ${base} − ${amount} = ___.`,
                  answer,
                  `Resta el descuento: ${base} − ${amount} = ___.`,
                ],
              ]
            : []),
        ],
      });
    }
    if (lesson === 6) {
      // Real unit pairs, not abstract "conversion factors" — meaning first.
      // Each tuple carries the Spanish plural + singular names for the ES lane.
      const [factor, bigUnit, smallUnit, bigUnitEs, smallUnitEs, oneBigEs] = [
        [12, "feet", "inches", "pies", "pulgadas", "pie"],
        [3, "yards", "feet", "yardas", "pies", "yarda"],
        [16, "pounds", "ounces", "libras", "onzas", "libra"],
        [100, "meters", "centimeters", "metros", "centímetros", "metro"],
        [1000, "kilograms", "grams", "kilogramos", "gramos", "kilogramo"],
      ][index % 5];
      const answer = n * factor;
      const oneBig = bigUnit.replace(/s$/, "");
      return makeItem(context, index, {
        stem: `1 ${oneBig} = ${factor} ${smallUnit}. Convert ${n} ${bigUnit} to ${smallUnit}.`,
        stemEs: `1 ${oneBigEs} = ${factor} ${smallUnitEs}. Convierte ${n} ${bigUnitEs} a ${smallUnitEs}.`,
        answer,
        visual: { kind: "conversion-table", values: [n, factor] },
        steps: [
          [
            `Each ${oneBig} is worth ___ ${smallUnit}.`,
            factor,
            `Cada ${oneBigEs} equivale a ___ ${smallUnitEs}.`,
          ],
          [`${n} × ${factor} = ___.`, answer, `${n} × ${factor} = ___.`],
        ],
        hint: `${smallUnit} are smaller than ${bigUnit}, so the number gets bigger — multiply.`,
        hintEs: `En ${smallUnitEs} el número será mayor que en ${bigUnitEs}, así que multiplica.`,
      });
    }
    const quantity = 3 + (index % 7);
    const cost = tidy(quantity * (2.25 + (index % 5) * 0.4));
    const answer = tidy(cost / quantity);
    return makeItem(context, index, {
      stem: `${quantity} items cost $${cost}. Find the new unit rate per item.`,
      stemEs: `${quantity} artículos cuestan $${cost}. Encuentra la nueva tasa unitaria por artículo.`,
      answer,
      visual: { kind: "unit-rate-table", values: [quantity, cost] },
      steps: [
        [
          `Divide cost by quantity: ${cost} ÷ ${quantity} = ___.`,
          answer,
          `Divide el costo entre la cantidad: ${cost} ÷ ${quantity} = ___.`,
        ],
        ["Write the rate for 1 item: $___.", answer, "Escribe la tasa para 1 artículo: $___."],
      ],
    });
  });
}

function unit5or10(context) {
  const { unit, lesson } = context;
  return Array.from({ length: 12 }, (_, index) => {
    const a = 4 + (index % 7) + context.group;
    const b = 3 + ((index * 2) % 6);
    const c = 2 + ((index * 3) % 5);
    if (unit === 10) {
      if (lesson <= 2) {
        const answer = a * b * c;
        return makeItem(context, index, {
          stem: `Find the volume of a new prism with dimensions ${a} by ${b} by ${c}.`,
          stemEs: `Encuentra el volumen de un nuevo prisma con dimensiones ${a} por ${b} por ${c}.`,
          answer,
          visual: { kind: "volume-prism", values: [a, b, c] },
          steps: [
            [`Base area: ${a} × ${b} = ___.`, a * b, `Área de la base: ${a} × ${b} = ___.`],
            [`Volume: ${a * b} × ${c} = ___.`, answer, `Volumen: ${a * b} × ${c} = ___.`],
            [
              "Label the answer in ___ units.",
              "cubic",
              "Etiqueta la respuesta en unidades ___ (escribe la palabra en inglés).",
            ],
          ],
        });
      }
      if (lesson === 3) {
        const answer = 2 * (a * b + a * c + b * c);
        return makeItem(context, index, {
          stem: `A rectangular prism net has length ${a}, width ${b}, and height ${c}. Find its total surface area.`,
          stemEs: `La red de un prisma rectangular tiene longitud ${a}, ancho ${b} y altura ${c}. Encuentra su área de superficie total.`,
          answer,
          visual: { kind: "prism-net", values: [a, b, c] },
          steps: [
            [
              `Find the top and bottom together: 2(${a} × ${b}) = ___.`,
              2 * a * b,
              `Encuentra la cara de arriba y la de abajo juntas: 2(${a} × ${b}) = ___.`,
            ],
            [
              `Find the front and back together: 2(${a} × ${c}) = ___.`,
              2 * a * c,
              `Encuentra el frente y la parte de atrás juntos: 2(${a} × ${c}) = ___.`,
            ],
            [
              `Find the two side faces: 2(${b} × ${c}) = ___.`,
              2 * b * c,
              `Encuentra las dos caras laterales: 2(${b} × ${c}) = ___.`,
            ],
            ["Add all six faces: ___.", answer, "Suma las seis caras: ___."],
          ],
        });
      }
      if (lesson === 4 && index % 2) {
        const [leg1, leg2, hypotenuse] = [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
          [8, 15, 17],
          [7, 24, 25],
          [9, 12, 15],
        ][Math.floor(index / 2)];
        const length = c + context.group + Math.floor(index / 4);
        const trianglePair = leg1 * leg2;
        const perimeter = leg1 + leg2 + hypotenuse;
        const lateralArea = perimeter * length;
        const answer = trianglePair + lateralArea;
        return makeItem(context, index, {
          stem: `A triangular prism is ${length} units long. Its right-triangle base has side lengths ${leg1}, ${leg2}, and ${hypotenuse}. Find the total surface area.`,
          stemEs: `Un prisma triangular mide ${length} unidades de largo. Su base es un triángulo rectángulo con lados de ${leg1}, ${leg2} y ${hypotenuse}. Encuentra el área de superficie total.`,
          answer,
          visual: {
            kind: "triangular-prism-surface",
            values: [leg1, leg2, hypotenuse, length],
          },
          steps: [
            [
              `Find both triangular ends: 2(1/2 × ${leg1} × ${leg2}) = ___.`,
              trianglePair,
              `Encuentra los dos extremos triangulares: 2(1/2 × ${leg1} × ${leg2}) = ___.`,
            ],
            [
              `Add the triangle side lengths: ${leg1} + ${leg2} + ${hypotenuse} = ___.`,
              perimeter,
              `Suma los lados del triángulo: ${leg1} + ${leg2} + ${hypotenuse} = ___.`,
            ],
            [
              `Find the three rectangles together: ${perimeter} × ${length} = ___.`,
              lateralArea,
              `Encuentra los tres rectángulos juntos: ${perimeter} × ${length} = ___.`,
            ],
            [
              "Add the ends and rectangles: ___.",
              answer,
              "Suma los extremos y los rectángulos: ___.",
            ],
          ],
        });
      }
      if (lesson === 4) {
        const threeFaceSum = a * b + a * c + b * c;
        const answer = 2 * threeFaceSum;
        return makeItem(context, index, {
          stem: `Find the surface area of a rectangular prism measuring ${a} by ${b} by ${c}.`,
          stemEs: `Encuentra el área de superficie de un prisma rectangular que mide ${a} por ${b} por ${c}.`,
          answer,
          visual: { kind: "surface-prism", values: [a, b, c] },
          steps: [
            [
              `Add one of each face pair: ${a * b} + ${a * c} + ${b * c} = ___.`,
              threeFaceSum,
              `Suma una cara de cada par: ${a * b} + ${a * c} + ${b * c} = ___.`,
            ],
            ["Double the three-face sum: ___.", answer, "Duplica la suma de las tres caras: ___."],
            [
              "Label the answer in ___ units.",
              "square",
              "Etiqueta la respuesta en unidades ___ (escribe la palabra en inglés).",
            ],
          ],
        });
      }
      const baseArea = a * a;
      const oneTriangle = tidy((a * c) / 2);
      const lateralArea = 4 * oneTriangle;
      const answer = baseArea + lateralArea;
      return makeItem(context, index, {
        stem: `A square pyramid has base edge ${a} and slant height ${c}. Find its total surface area.`,
        stemEs: `Una pirámide de base cuadrada tiene arista de la base ${a} y altura inclinada ${c}. Encuentra su área de superficie total.`,
        answer,
        visual: { kind: "pyramid-net", values: [a, c] },
        steps: [
          [
            `Find the square base: ${a} × ${a} = ___.`,
            baseArea,
            `Encuentra la base cuadrada: ${a} × ${a} = ___.`,
          ],
          [
            `Find one triangular face: 1/2 × ${a} × ${c} = ___.`,
            oneTriangle,
            `Encuentra una cara triangular: 1/2 × ${a} × ${c} = ___.`,
          ],
          [
            `Find all 4 triangular faces: 4 × ${oneTriangle} = ___.`,
            lateralArea,
            `Encuentra las 4 caras triangulares: 4 × ${oneTriangle} = ___.`,
          ],
          [
            "Add the base and all side faces: ___.",
            answer,
            "Suma la base y todas las caras laterales: ___.",
          ],
        ],
      });
    }
    let answer;
    let visual;
    let stem;
    let stemEs;
    let steps;
    if (lesson === 1) {
      answer = a * b;
      stem = `Find the area of a new parallelogram with base ${a} and perpendicular height ${b}.`;
      stemEs = `Encuentra el área de un nuevo paralelogramo con base ${a} y altura perpendicular ${b}.`;
      visual = { kind: "parallelogram-area", values: [a, b] };
      steps = [
        ["Use the perpendicular height: ___.", b, "Usa la altura perpendicular: ___."],
        [`Area = ${a} × ${b} = ___.`, answer, `Área = ${a} × ${b} = ___.`],
      ];
    } else if (lesson === 2) {
      answer = tidy(((a + b) * c) / 2);
      stem = `Find the area of a new trapezoid with bases ${a} and ${b} and height ${c}.`;
      stemEs = `Encuentra el área de un nuevo trapecio con bases ${a} y ${b} y altura ${c}.`;
      visual = { kind: "trapezoid-area", values: [a, b, c] };
      steps = [
        [`Add the bases: ${a} + ${b} = ___.`, a + b, `Suma las bases: ${a} + ${b} = ___.`],
        [
          `Multiply by height, then halve: ___.`,
          answer,
          `Multiplica por la altura y luego divide entre 2: ___.`,
        ],
      ];
    } else if (lesson === 3) {
      answer = tidy((a * b) / 2);
      stem = `Find the area of a new triangle with base ${a} and height ${b}.`;
      stemEs = `Encuentra el área de un nuevo triángulo con base ${a} y altura ${b}.`;
      visual = { kind: "triangle-area", values: [a, b] };
      steps = [
        [`Base × height: ${a} × ${b} = ___.`, a * b, `Base × altura: ${a} × ${b} = ___.`],
        ["Take one half: ___.", answer, "Toma la mitad: ___."],
      ];
    } else {
      answer = lesson === 4 ? tidy((6 * a * b) / 2) : a * b + c * b;
      stem =
        lesson === 4
          ? `A regular hexagon splits into 6 triangles with base ${a} and height ${b}. Find its area.`
          : `A composite figure has rectangles ${a}×${b} and ${c}×${b}. Find the total area.`;
      stemEs =
        lesson === 4
          ? `Un hexágono regular se divide en 6 triángulos con base ${a} y altura ${b}. Encuentra su área.`
          : `Una figura compuesta tiene rectángulos ${a}×${b} y ${c}×${b}. Encuentra el área total.`;
      visual = { kind: lesson === 4 ? "polygon-triangles" : "composite-area", values: [a, b, c] };
      steps =
        lesson === 4
          ? [
              ["Area of one triangle: ___.", tidy((a * b) / 2), "Área de un triángulo: ___."],
              ["Multiply by 6 triangles: ___.", answer, "Multiplica por los 6 triángulos: ___."],
            ]
          : [
              [
                `First rectangle: ${a} × ${b} = ___.`,
                a * b,
                `Primer rectángulo: ${a} × ${b} = ___.`,
              ],
              [
                `Second rectangle: ${c} × ${b} = ___.`,
                c * b,
                `Segundo rectángulo: ${c} × ${b} = ___.`,
              ],
              ["Add both areas: ___.", answer, "Suma las dos áreas: ___."],
            ];
    }
    return makeItem(context, index, { stem, stemEs, answer, visual, steps });
  });
}

function unit6or7(context) {
  const { unit, lesson } = context;
  return Array.from({ length: 12 }, (_, index) => {
    const x = 2 + index + context.group;
    const a = 2 + (index % 5);
    const b = 4 + ((index * 2) % 9);
    if (unit === 6) {
      if (lesson === 1) {
        const exponent = 2 + (index % 3);
        const answer = x ** exponent;
        return makeItem(context, index, {
          stem: `Evaluate the new power ${x}^${exponent}.`,
          stemEs: `Evalúa la nueva potencia ${x}^${exponent}.`,
          answer,
          visual: { kind: "power-array", values: [x, exponent] },
          steps: [
            [
              "Write the base as repeated factors: ___.",
              Array(exponent).fill(x).join(" × "),
              "Escribe la base como factores repetidos: ___.",
            ],
            ["Multiply the factors: ___.", answer, "Multiplica los factores: ___."],
          ],
        });
      }
      if (lesson === 2) {
        const answer = a * x + b;
        return makeItem(context, index, {
          stem: `Evaluate ${a}x + ${b} when x = ${x}.`,
          stemEs: `Evalúa ${a}x + ${b} cuando x = ${x}.`,
          answer,
          visual: { kind: "substitution-box", values: [a, x, b] },
          steps: [
            [
              `Substitute ${x} for x: ${a}(${x}) + ${b}. First multiply: ___.`,
              a * x,
              `Sustituye ${x} por x: ${a}(${x}) + ${b}. Primero multiplica: ___.`,
            ],
            [`Add ${b}: ___.`, answer, `Suma ${b}: ___.`],
          ],
        });
      }
      if (lesson === 3) {
        const answer = `${a}x + ${b}`;
        return makeItem(context, index, {
          stem: `Write an expression for ${b} more than ${a} times a number x.`,
          stemEs: `Escribe una expresión para ${b} más que ${a} veces un número x.`,
          answer,
          visual: { kind: "expression-tiles", values: [a, b] },
          steps: [
            [`“${a} times x” becomes ___.`, `${a}x`, `“${a} veces x” se convierte en ___.`],
            [`“${b} more” means add ___.`, b, `“${b} más” significa sumar ___.`],
            ["Write the full expression: ___.", answer, "Escribe la expresión completa: ___."],
          ],
        });
      }
      if (lesson === 4) {
        const answer = `${b} + ${a}`;
        return makeItem(context, index, {
          stem: `Use the commutative property to rewrite ${a} + ${b}.`,
          stemEs: `Usa la propiedad conmutativa para reescribir ${a} + ${b}.`,
          answer,
          visual: { kind: "operation-tiles", values: [a, b] },
          steps: [
            ["Keep the same operation: ___.", "+", "Conserva la misma operación: ___."],
            ["Switch the addends: ___.", answer, "Intercambia los sumandos: ___."],
          ],
        });
      }
      const coefficient = a + 2;
      const constant = b + 1;
      const answer =
        lesson === 5
          ? `${coefficient}x + ${coefficient * constant}`
          : `${coefficient + a}x + ${constant}`;
      const stem =
        lesson === 5
          ? `Expand ${coefficient}(x + ${constant}).`
          : `Simplify ${coefficient}x + ${a}x + ${constant}.`;
      const stemEs =
        lesson === 5
          ? `Desarrolla ${coefficient}(x + ${constant}).`
          : `Simplifica ${coefficient}x + ${a}x + ${constant}.`;
      return makeItem(context, index, {
        stem,
        stemEs,
        answer,
        visual: { kind: "algebra-tiles", values: [coefficient, a, constant] },
        steps:
          lesson === 5
            ? [
                [
                  `Multiply ${coefficient} × x: ___.`,
                  `${coefficient}x`,
                  `Multiplica ${coefficient} × x: ___.`,
                ],
                [
                  `Multiply ${coefficient} × ${constant}: ___.`,
                  coefficient * constant,
                  `Multiplica ${coefficient} × ${constant}: ___.`,
                ],
                [
                  "Write the expanded expression: ___.",
                  answer,
                  "Escribe la expresión desarrollada: ___.",
                ],
              ]
            : [
                [
                  `Add the x-coefficients: ${coefficient} + ${a} = ___.`,
                  coefficient + a,
                  `Suma los coeficientes de x: ${coefficient} + ${a} = ___.`,
                ],
                [
                  "Keep the constant term and write: ___.",
                  answer,
                  "Conserva el término constante y escribe: ___.",
                ],
              ],
      });
    }
    if (lesson === 1) {
      const answer = `x + ${a} = ${b}`;
      return makeItem(context, index, {
        stem: `Write an equation: a number x plus ${a} equals ${b}.`,
        stemEs: `Escribe una ecuación: un número x más ${a} es igual a ${b}.`,
        answer,
        visual: { kind: "balance-scale", values: [a, b] },
        steps: [
          ["Use x for the unknown: ___.", "x", "Usa x para el valor desconocido: ___."],
          [`“plus ${a}” becomes ___.`, `+ ${a}`, `“más ${a}” se convierte en ___.`],
          ["Write the equation: ___.", answer, "Escribe la ecuación: ___."],
        ],
      });
    }
    if ([2, 3].includes(lesson)) {
      const mult = lesson === 3;
      const result = mult ? a * x : x + a;
      const stem = mult
        ? `Solve the new equation ${a}x = ${result}.`
        : `Solve the new equation x + ${a} = ${result}.`;
      const stemEs = mult
        ? `Resuelve la nueva ecuación ${a}x = ${result}.`
        : `Resuelve la nueva ecuación x + ${a} = ${result}.`;
      return makeItem(context, index, {
        stem,
        stemEs,
        answer: x,
        visual: {
          kind: "balance-scale",
          values: [a, result],
          operation: mult ? "divide" : "subtract",
        },
        steps: mult
          ? [
              [`Divide both sides by ___.`, a, `Divide ambos lados entre ___.`],
              [`${result} ÷ ${a} = ___.`, x, `${result} ÷ ${a} = ___.`],
            ]
          : [
              [
                `Subtract ${a} from both sides: ${result} − ${a} = ___.`,
                x,
                `Resta ${a} de ambos lados: ${result} − ${a} = ___.`,
              ],
              ["Check by substituting x: ___.", result, "Comprueba sustituyendo x: ___."],
            ],
      });
    }
    const boundary = 4 + index + context.group;
    const symbol = index % 2 ? "≤" : ">";
    const answer = `x ${symbol} ${boundary}`;
    return makeItem(context, index, {
      stem:
        lesson === 4
          ? `Write an inequality: x is ${symbol === "≤" ? "at most" : "greater than"} ${boundary}.`
          : `Solve and graph the new inequality ${answer}.`,
      stemEs:
        lesson === 4
          ? `Escribe una desigualdad: x es ${symbol === "≤" ? "como máximo" : "mayor que"} ${boundary}.`
          : `Resuelve y grafica la nueva desigualdad ${answer}.`,
      answer,
      visual: { kind: "inequality-line", boundary, symbol },
      steps: [
        [`The boundary value is ___.`, boundary, `El valor de frontera es ___.`],
        [`Use the symbol ___.`, symbol, `Usa el símbolo ___.`],
        ["Write the inequality: ___.", answer, "Escribe la desigualdad: ___."],
      ],
    });
  });
}

/* ── Which practice strand a lesson belongs to ──────────────────────────────
 * The builders below are organised by the ORIGINAL unit numbering, because
 * that is what their arithmetic is about — unit1 is number-system fluency,
 * unit6or7 is expressions and equations, and so on.
 *
 * The book-TOC renumbering broke the assumption that a lesson's unit number
 * names its topic: Prime Factorization moved from 1-1 to 6-13, so dispatching
 * on the new unit handed it unit 6's ALGEBRA practice ("Simplify 4x + 2x + 5"
 * under a factor-tree lesson). Parallel practice is generated, so nothing
 * per-file could see it.
 *
 * LEGACY_TOPIC maps each lesson to the (unit, lesson) coordinates whose strand
 * it actually teaches. Moved lessons keep exactly the practice they had before
 * the renumbering. The 20 lessons authored for the book get the closest strand:
 * the "Math Is..." units are mixed-fluency, so unit 1 for the opening unit and
 * the measurement strand for the closing one; 2-8 is statistics; 4-3 percents;
 * 7-1 and 7-7 the integer/coordinate strand; and Unit 9's two-variable lessons
 * the ratio-table strand, which is the same two-column reasoning.
 */
const LEGACY_TOPIC = {
  // ── moved lessons: new id -> the coordinates they had before ──
  "6-13": [1, 1],
  "6-7": [1, 2],
  "6-12": [1, 3],
  "2-6": [1, 4],
  "2-11": [1, 5],
  "2-12": [1, 6],
  "2-7": [1, 7],
  "6-1": [2, 1],
  "6-9": [2, 2],
  "6-2": [2, 3],
  "6-10": [2, 4],
  "6-11": [2, 5],
  "3-1": [3, 1],
  "3-3": [3, 2],
  "3-4": [3, 3],
  "3-9": [3, 4],
  "3-5": [3, 5],
  "3-6": [3, 6],
  "3-7": [3, 7],
  "3-2": [4, 1],
  "4-2": [4, 2],
  "4-1": [4, 3],
  "4-4": [4, 4],
  // 2026-08-14 task-alignment audit: the identity tuple [4, 5] pointed at the
  // OLD 4-5's discount/sale-price family, while the renumbered 4-5 teaches
  // find-the-WHOLE given the part and percent. [4, 8] is the find-the-whole
  // family written for exactly this objective (part ÷ percent, with a check).
  "4-5": [4, 8],
  "3-10": [4, 6],
  "3-8": [4, 7],
  "5-1": [5, 1],
  "5-3": [5, 2],
  "5-2": [5, 3],
  "5-9": [5, 4],
  "5-4": [5, 5],
  "6-3": [6, 1],
  "6-4": [6, 2],
  "6-5": [6, 3],
  "6-8": [6, 4],
  "6-14": [6, 5],
  "6-6": [6, 6],
  "6-15": [6, 7],
  "8-1": [7, 1],
  "8-2": [7, 2],
  "8-3": [7, 3],
  "8-4": [7, 4],
  "8-5": [7, 5],
  "8-6": [7, 6],
  "8-7": [7, 7],
  "2-1": [8, 1],
  "2-3": [8, 2],
  "2-9": [8, 3],
  "2-10": [8, 4],
  "2-4": [8, 5],
  "2-2": [8, 6],
  "2-5": [8, 7],
  "7-5": [9, 1],
  "7-3": [9, 2],
  "7-4": [9, 3],
  "7-2": [9, 4],
  "7-8": [9, 5],
  "7-6": [9, 6],
  "7-9": [9, 7],
  "5-5": [10, 1],
  "5-10": [10, 2],
  "5-6": [10, 3],
  "5-7": [10, 4],
  "5-8": [10, 5],
  // ── authored for the book ──
  // The "Math Is..." lessons teach disposition, but each carries REAL arithmetic
  // from its deck, and THAT is what its small groups must practise. Mapping them
  // by unit number served 10-2 ("Math is Beauty" — bilateral symmetry) twelve
  // surface-area-of-a-net problems. Each entry is the strand of the lesson's own
  // maths, named so the next person can check it against the deck.
  // The comment here used to say "20 x 4 -> whole-number computation" while the
  // tuple pointed at [1, 4], which is the DIVISION-with-remainder family that
  // 1-3 and 10-5 legitimately use. So a lesson about estimating a Ferris wheel
  // served twelve "Divide 252 by 6. Give the quotient and remainder." problems,
  // with the long-division box lab attached — exactly the failure this map was
  // written to prevent (see the 10-2 note above). Reported from the classroom,
  // 2026-08-12.
  //
  // [1, 6] is the multiplication family. Unit 1 has no whole-number-product
  // family — 5 is add/subtract, 6 is multiply, and both operate on decimals —
  // and decimals are the right call here anyway: the lesson's own estimate
  // lands on 78.5 people, not a whole number.
  "1-1": [1, 6], // estimating the Ferris wheel, a product -> multiply
  "1-2": [1, 5], // decomposing 105.76 -> add and subtract decimals
  // 2026-08-14 task-alignment audit: [1, 4] (division with remainder) matched
  // one deck subtask's domain but none of the objective — "represent with a
  // tape diagram or TABLE and use DECIMAL operations". [11, 6] is the decimal
  // scaling-table family, the lesson's own youDo (35 min → 1 trip, 350 → 10).
  "1-3": [11, 6],
  "1-4": [10, 1], // garden beds holding 48 cubic feet -> volume
  // 2026-08-14 task-alignment audit: [3, 2] delivered equivalent-ratio scaling
  // ("2:3 = 4:6"), which carries no pattern RULE, no table of values and no
  // generalization — the objective's three verbs. [11, 5] is the pattern-rule
  // family (rule → table → predict a far position without listing rows).
  "1-5": [11, 5],
  "1-6": [3, 1], // "6 times as many wheels" -> multiplicative comparison
  "10-1": [10, 1], // the 4 x 2 x 1 planter -> volume
  "10-2": [9, 7], // bilateral symmetry -> reflection across a line
  "10-3": [6, 1], // Tower of Hanoi doubling -> powers and exponents
  "10-4": [3, 1], // gear ratio, 40 teeth to 10 -> ratios
  "10-5": [1, 4], // position divided by pattern-unit length -> division with remainder
  "10-6": [4, 4], // 78.5 as 50% of 157 -> percent of a number
  "2-8": [8, 2], //  measures of centre, which is where the mean lives
  // 2026-08-14 task-alignment audit: [4, 4] computes EXACT percents with the
  // decimal algorithm, coaching the opposite of "estimate using benchmark
  // percents, rounding, and compatible numbers". [4, 9] is the benchmark
  // estimation family (round the percent, round the base, estimate mentally).
  "4-3": [4, 9],
  // 2026-08-14 task-alignment audit: [9, 3] is compare/order — 7-4's objective,
  // not 7-1's "represent quantities, explain what 0 means, name the opposite".
  // [9, 8] is the opposites family (situation → integer → opposite → zero).
  "7-1": [9, 8],
  "7-7": [9, 5], //  plotting ordered pairs, which is how a polygon's vertices go down
  // 2026-08-14 task-alignment audit: Unit 9 (6.AT.11) now has its own family,
  // [11, x] = buildTwoVariablePractice. The old tuples were the audit's worst
  // class — 9-1/9-2 drew equivalent-ratio SCALING (no two quantities, no
  // dependence), and 9-3 drew one-variable "x + 2 = 4" translation under an
  // objective about equations for TWO-variable relationships. The rationale
  // comments those tuples carried were honest about the topic and wrong about
  // the reasoning, which is exactly the 1-1 failure documented in
  // small-group-authored-banks.mjs.
  "9-1": [11, 1], // covariation table + name the dependent variable
  "9-2": [11, 2], // read the relationship from its table, extend it
  "9-3": [11, 3], // write the equation the table shows (y = kx / y = x + b)
  "9-4": [11, 4], // use a given rate equation to solve
};

export function buildParallelPractice(base, lessonId, group) {
  const parentId = lessonId.replace(/-group[12]$/, "");
  // A lesson whose practice was written against its own objective gets NO
  // generated family: parallelPractice is a guided-fill drill slot, and authored
  // reasoning tasks belong in the practice tiers instead. See
  // tools/lib/small-group-authored-banks.mjs for the rule — a family must be
  // justified by the current canonical objective, not by a historical mapping.
  if (authoredBank(parentId, group)) return null;
  // Dispatch on the lesson's TOPIC, not its book number — see LEGACY_TOPIC.
  const [unit, lesson] = LEGACY_TOPIC[parentId] ?? parentId.split("-").map(Number);
  const context = { base, lessonId, parentId, unit, lesson, group };
  let items;
  if (unit === 1) items = unit1(context);
  else if (unit === 2) items = unit2(context);
  else if (unit === 3) items = unit3(context);
  else if (unit === 4) items = unit4(context);
  else if (unit === 5 || unit === 10) items = unit5or10(context);
  else if (unit === 6 || unit === 7) items = unit6or7(context);
  else if (unit === 8) items = buildDataPractice(context);
  else if (unit === 9) items = buildCoordinatePractice(context);
  else if (unit === 11) items = buildTwoVariablePractice(context);
  else throw new Error(`${lessonId}: no parallel-practice builder for unit ${unit}`);
  if (items.length !== 12) throw new Error(`${lessonId}: expected 12 parallel items`);
  return items;
}

export default buildParallelPractice;
