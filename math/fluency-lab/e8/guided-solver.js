// Guided Solver 2.0 (Enterprise 8): active, validated problem solving in place of passive step reveals.
//
// A problem the solver understands is broken into meaningful reasoning steps. For each step the learner makes a choice or
// enters a number; the solver validates it with exact arithmetic and answers a specific wrong response with a specific
// correction. Support fades: scaffold level 3 asks every step, 2 asks the key steps, 1 asks only the final answer with
// checks available, 0 asks the final answer alone. A correct answer reached with hints, reveals or support is recorded as
// supported, never independent; the learner then owes a fresh problem at the next lower scaffold level.
import { Rational, R, equivalent, parseRational } from "./rational.js";
import { bi } from "./engine-core.js";

const SIGN = "[+−-]";
const num = (text) => Number(String(text).replace(/,/g, ""));
const minus = (c) => c === "−" || c === "-";
const group = (n) => Number(n).toLocaleString("en-US");

const step = (o) => ({ minLevel: 3, kind: "number", hints: [], ...o });
const hints = (a, b, c) => [a, b, c].filter(Boolean);

// ---------------------------------------------------------------- family builders (question text -> plan)
function addSub(m) {
  const a = num(m[1]);
  const b = num(m[3]);
  const sub = minus(m[2]);
  if (sub && b > a) return null;
  const ad = String(a).split("").reverse().map(Number);
  const bd = String(b).split("").reverse().map(Number);
  const n = Math.max(ad.length, bd.length);
  const names = [
    "ones",
    "tens",
    "hundreds",
    "thousands",
    "ten-thousands",
    "hundred-thousands",
    "millions",
  ];
  const namesEs = [
    "unidades",
    "decenas",
    "centenas",
    "unidades de millar",
    "decenas de millar",
    "centenas de millar",
    "millones",
  ];
  const steps = [];
  let carry = 0;
  let top = ad.slice();
  const digits = [];
  for (let i = 0; i < n; i += 1) {
    const x = ad[i] ?? 0;
    const y = bd[i] ?? 0;
    if (!sub) {
      const total = x + y + carry;
      steps.push(
        step({
          id: `col${i}`,
          minLevel: 3,
          prompt: bi(
            `${names[i]}: ${x} + ${y}${carry ? ` + ${carry} carried` : ""} = ?`,
            `${namesEs[i]}: ${x} + ${y}${carry ? ` + ${carry} que llevas` : ""} = ?`,
          ),
          answer: R(total),
          hints: hints(
            bi(
              `Add the ${names[i]} digits${carry ? " and the carried 1" : ""}.`,
              `Suma los dígitos de las ${namesEs[i]}${carry ? " y el 1 que llevas" : ""}.`,
            ),
            bi(
              `Count up from ${Math.max(x, y)}.`,
              `Cuenta hacia adelante desde ${Math.max(x, y)}.`,
            ),
          ),
          wrong: (v) =>
            carry && Rational.of(v).eq(x + y)
              ? bi(
                  `You left out the carried ${carry}. Add it in: ${x} + ${y} + ${carry}.`,
                  `Olvidaste el ${carry} que llevas. Súmalo: ${x} + ${y} + ${carry}.`,
                )
              : null,
        }),
      );
      digits.push(total % 10);
      carry = total >= 10 ? 1 : 0;
    } else {
      let t = top[i];
      if (t < y) {
        steps.push(
          step({
            id: `reg${i}`,
            kind: "choice",
            minLevel: 3,
            prompt: bi(
              `${names[i]}: can you take ${y} from ${t}?`,
              `${namesEs[i]}: ¿puedes quitar ${y} de ${t}?`,
            ),
            choices: [
              {
                text: bi(
                  "No. Regroup: take 1 from the next place and make this digit 10 more.",
                  "No. Reagrupa: toma 1 del lugar siguiente y suma 10 a este dígito.",
                ),
                correct: true,
              },
              {
                text: bi(
                  `Yes. Just subtract ${t} from ${y} instead.`,
                  `Sí. Resta ${t} de ${y} al revés.`,
                ),
                correct: false,
                why: bi(
                  `Subtraction is not commutative: ${t} − ${y} is not the same as ${y} − ${t}. When the top digit is smaller you regroup.`,
                  `La resta no es conmutativa: ${t} − ${y} no es igual a ${y} − ${t}. Si el dígito de arriba es menor, reagrupas.`,
                ),
              },
              {
                text: bi("Yes. The answer is 0.", "Sí. La respuesta es 0."),
                correct: false,
                why: bi(
                  "You cannot take more than you have. Regroup from the next place.",
                  "No puedes quitar más de lo que tienes. Reagrupa del lugar siguiente.",
                ),
              },
            ],
            hints: hints(
              bi(
                "Is the top digit at least as big as the bottom digit?",
                "¿El dígito de arriba es al menos tan grande como el de abajo?",
              ),
            ),
          }),
        );
        t += 10;
        top[i + 1] -= 1;
      }
      steps.push(
        step({
          id: `col${i}`,
          prompt: bi(`${names[i]}: ${t} − ${y} = ?`, `${namesEs[i]}: ${t} − ${y} = ?`),
          answer: R(t - y),
          hints: hints(bi(`Count back ${y} from ${t}.`, `Cuenta hacia atrás ${y} desde ${t}.`)),
          wrong: (v) => (Rational.of(v).eq(Math.abs(t - y) + (t < y ? 0 : 0)) ? null : null),
        }),
      );
      digits.push(t - y);
    }
  }
  if (!sub && carry) digits.push(1);
  const answer = sub ? a - b : a + b;
  steps.push(
    step({
      id: "final",
      minLevel: 0,
      prompt: bi(
        `Put the columns together. ${a.toLocaleString("en-US")} ${sub ? "−" : "+"} ${b.toLocaleString("en-US")} = ?`,
        `Junta las columnas. ${a.toLocaleString("en-US")} ${sub ? "−" : "+"} ${b.toLocaleString("en-US")} = ?`,
      ),
      answer: R(answer),
      hints: hints(
        bi(
          "Read the digits you found from the leftmost column to the ones.",
          "Lee los dígitos que encontraste de la columna de la izquierda a las unidades.",
        ),
        bi(
          `Estimate first: about ${Math.round(a / 1000) * 1000} ${sub ? "−" : "+"} ${Math.round(b / 1000) * 1000}.`,
          `Estima primero: cerca de ${Math.round(a / 1000) * 1000} ${sub ? "−" : "+"} ${Math.round(b / 1000) * 1000}.`,
        ),
      ),
      wrong: (v) => {
        const w = Rational.of(v);
        return w.eq(sub ? a + b : Math.abs(a - b))
          ? bi(
              "Check the operation: this problem " + (sub ? "subtracts." : "adds."),
              "Revisa la operación: este problema " + (sub ? "resta." : "suma."),
            )
          : null;
      },
    }),
  );
  return {
    family: "addSub",
    objective: bi(
      `${sub ? "Subtract" : "Add"} multi-digit numbers by place value.`,
      `${sub ? "Resta" : "Suma"} números de varios dígitos por valor posicional.`,
    ),
    steps,
    answer: R(answer),
    visual: { model: "baseTen", params: { value: Math.min(999, a) } },
  };
}

function multiply(m) {
  const a = num(m[1]);
  const b = num(m[2]);
  if (b > 99 || a > 9999) return null;
  const bParts = String(b)
    .split("")
    .map((d, i, arr) => Number(d) * 10 ** (arr.length - 1 - i))
    .filter(Boolean);
  const steps = bParts.map((part, i) =>
    step({
      id: `part${i}`,
      prompt: bi(
        `${a.toLocaleString("en-US")} × ${part} = ?`,
        `${a.toLocaleString("en-US")} × ${part} = ?`,
      ),
      answer: R(a * part),
      hints: hints(
        bi(
          part >= 10
            ? `Multiply ${a.toLocaleString("en-US")} × ${part / 10}, then write a zero for the tens.`
            : `Break ${a} into tens and ones and multiply each by ${part}.`,
          part >= 10
            ? `Multiplica ${a.toLocaleString("en-US")} × ${part / 10} y escribe un cero para las decenas.`
            : `Separa ${a} en decenas y unidades y multiplica cada una por ${part}.`,
        ),
      ),
      wrong: (v) =>
        part >= 10 && Rational.of(v).eq(a * (part / 10))
          ? bi(
              `That is ${a} × ${part / 10}. The ${part} is ${part / 10} tens, so the product is ten times as big.`,
              `Eso es ${a} × ${part / 10}. El ${part} son ${part / 10} decenas, así que el producto es diez veces mayor.`,
            )
          : null,
    }),
  );
  if (bParts.length > 1)
    steps.push(
      step({
        id: "sum",
        minLevel: 2,
        prompt: bi(
          `Add the partial products: ${bParts.map((p) => (a * p).toLocaleString("en-US")).join(" + ")} = ?`,
          `Suma los productos parciales: ${bParts.map((p) => (a * p).toLocaleString("en-US")).join(" + ")} = ?`,
        ),
        answer: R(a * b),
      }),
    );
  steps.push(
    step({
      id: "final",
      minLevel: 0,
      prompt: bi(
        `${a.toLocaleString("en-US")} × ${b} = ?`,
        `${a.toLocaleString("en-US")} × ${b} = ?`,
      ),
      answer: R(a * b),
      hints: hints(
        bi(
          `Estimate: ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10 || b}.`,
          `Estima: ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10 || b}.`,
        ),
      ),
    }),
  );
  return {
    family: "multiply",
    objective: bi("Multiply with partial products.", "Multiplica con productos parciales."),
    steps,
    answer: R(a * b),
    visual: { model: "areaMultiply", params: { a: Math.max(2, a), b: Math.max(2, b) } },
  };
}

function fractionAddSub(m) {
  const [n1, d1, n2, d2] = [num(m[1]), num(m[2]), num(m[4]), num(m[5])];
  const sub = minus(m[3]);
  const A = R(n1, d1);
  const B = R(n2, d2);
  const result = sub ? A.sub(B) : A.add(B);
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  const lcd = (d1 / gcd(d1, d2)) * d2;
  const na = (n1 * lcd) / d1;
  const nb = (n2 * lcd) / d2;
  const rn = sub ? na - nb : na + nb;
  const steps = [
    step({
      id: "den",
      prompt: bi(
        `What is the least common denominator of ${d1} and ${d2}? (the smallest number both go into)`,
        `¿Cuál es el mínimo común denominador de ${d1} y ${d2}? (el menor número en el que caben ambos)`,
      ),
      answer: R(lcd),
      hints: hints(
        bi(
          `List multiples of ${Math.max(d1, d2)} until ${Math.min(d1, d2)} goes into one.`,
          `Enumera múltiplos de ${Math.max(d1, d2)} hasta que ${Math.min(d1, d2)} quepa en uno.`,
        ),
      ),
      wrong: (v) => {
        const w = Rational.of(v);
        return w.eq(d1 * d2) && d1 * d2 !== lcd
          ? bi(
              `${d1 * d2} works, but it is not the smallest. Look for a smaller shared multiple.`,
              `${d1 * d2} sirve, pero no es el menor. Busca un múltiplo compartido menor.`,
            )
          : w.eq(d1 + d2)
            ? bi(
                `Adding the denominators does not make equal parts. You need a number both ${d1} and ${d2} divide into.`,
                `Sumar los denominadores no hace partes iguales. Necesitas un número que ${d1} y ${d2} dividan.`,
              )
            : null;
      },
    }),
    step({
      id: "na",
      prompt: bi(
        `Rewrite ${n1}/${d1} with denominator ${lcd}: ${n1}/${d1} = ?/${lcd}. What is the numerator?`,
        `Reescribe ${n1}/${d1} con denominador ${lcd}: ${n1}/${d1} = ?/${lcd}. ¿Cuál es el numerador?`,
      ),
      answer: R(na),
      hints: hints(
        bi(
          `${d1} × ${lcd / d1} = ${lcd}, so multiply the top by ${lcd / d1} too.`,
          `${d1} × ${lcd / d1} = ${lcd}, así que multiplica también el numerador por ${lcd / d1}.`,
        ),
      ),
      wrong: (v) =>
        Rational.of(v).eq(n1)
          ? bi(
              "Changing only the bottom changes the amount. Multiply the top by the same number.",
              "Cambiar solo el denominador cambia la cantidad. Multiplica el numerador por el mismo número.",
            )
          : null,
    }),
    step({
      id: "nb",
      prompt: bi(
        `Rewrite ${n2}/${d2} with denominator ${lcd}. What is the numerator?`,
        `Reescribe ${n2}/${d2} con denominador ${lcd}. ¿Cuál es el numerador?`,
      ),
      answer: R(nb),
      hints: hints(
        bi(
          `${d2} × ${lcd / d2} = ${lcd}, so multiply the top by ${lcd / d2}.`,
          `${d2} × ${lcd / d2} = ${lcd}, así que multiplica el numerador por ${lcd / d2}.`,
        ),
      ),
    }),
    step({
      id: "combine",
      prompt: bi(
        `${na}/${lcd} ${sub ? "−" : "+"} ${nb}/${lcd}: ${sub ? "subtract" : "add"} the numerators. ${na} ${sub ? "−" : "+"} ${nb} = ?`,
        `${na}/${lcd} ${sub ? "−" : "+"} ${nb}/${lcd}: ${sub ? "resta" : "suma"} los numeradores. ${na} ${sub ? "−" : "+"} ${nb} = ?`,
      ),
      answer: R(rn),
      hints: hints(
        bi(
          "The denominators stay the same. Only the numerators combine.",
          "Los denominadores no cambian. Solo se combinan los numeradores.",
        ),
      ),
      wrong: (v) => (Rational.of(v).eq(rn) ? null : null),
    }),
    step({
      id: "final",
      minLevel: 0,
      prompt: bi(
        `${n1}/${d1} ${sub ? "−" : "+"} ${n2}/${d2} = ? (write it in simplest form)`,
        `${n1}/${d1} ${sub ? "−" : "+"} ${n2}/${d2} = ? (escríbelo en su forma más simple)`,
      ),
      answer: result,
      simplified: true,
      hints: hints(
        bi(
          `Check: does ${rn} share a factor with ${lcd}?`,
          `Comprueba: ¿${rn} comparte un factor con ${lcd}?`,
        ),
      ),
      wrong: (v) => {
        const w = parseRational(v);
        return w && w.eq(result)
          ? bi(
              "That has the right value, but it is not in simplest form yet. Divide the top and bottom by the same number.",
              "Tiene el valor correcto, pero aún no está en su forma más simple. Divide numerador y denominador entre el mismo número.",
            )
          : parseRational(v)?.eq(R(n1 + n2, d1 + d2))
            ? bi(
                "Adding tops and bottoms separately does not work: denominators name the size of the parts.",
                "Sumar numeradores y denominadores por separado no funciona: el denominador indica el tamaño de las partes.",
              )
            : null;
      },
    }),
  ];
  return {
    family: "fractionAddSub",
    objective: bi(
      `${sub ? "Subtract" : "Add"} fractions with unlike denominators.`,
      `${sub ? "Resta" : "Suma"} fracciones con distinto denominador.`,
    ),
    steps,
    answer: result,
    simplified: true,
    visual: { model: "fractionOps", params: { a: [n1, d1], b: [n2, d2], op: sub ? "-" : "+" } },
  };
}

function equation(m, kind) {
  let a = 1;
  let b = 0;
  let rhs;
  if (kind === "axb") {
    a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : num(m[1]);
    b = m[2] ? (minus(m[2]) ? -num(m[3]) : num(m[3])) : 0;
    rhs = num(m[4]);
  } else {
    // x / a = c
    a = R(1, num(m[1]));
    rhs = num(m[2]);
  }
  const A = Rational.of(a);
  const x = R(rhs).sub(b).div(A);
  if (!x.isInteger() && kind === "axb") return null;
  const eqText =
    kind === "axb"
      ? `${A.eq(1) ? "" : A.eq(-1) ? "−" : A.toString()}x${b ? ` ${b < 0 ? "−" : "+"} ${Math.abs(b)}` : ""} = ${rhs}`
      : `x ÷ ${m[1]} = ${rhs}`;
  const steps = [];
  if (b) {
    steps.push(
      step({
        id: "inv1",
        kind: "choice",
        prompt: bi(
          `${eqText}. Which move undoes the ${b < 0 ? "−" : "+"} ${Math.abs(b)} on both sides?`,
          `${eqText}. ¿Qué movimiento deshace el ${b < 0 ? "−" : "+"} ${Math.abs(b)} en ambos lados?`,
        ),
        choices: [
          {
            text: bi(
              `${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} on both sides`,
              `${b < 0 ? "Sumar" : "Restar"} ${Math.abs(b)} en ambos lados`,
            ),
            correct: true,
          },
          {
            text: bi(
              `${b < 0 ? "Subtract" : "Add"} ${Math.abs(b)} on both sides`,
              `${b < 0 ? "Restar" : "Sumar"} ${Math.abs(b)} en ambos lados`,
            ),
            correct: false,
            why: bi(
              "That would make the number bigger, not cancel it. Use the opposite operation.",
              "Eso lo haría mayor, no lo cancela. Usa la operación opuesta.",
            ),
          },
          {
            text: bi(
              `Divide both sides by ${Math.abs(b)}`,
              `Dividir ambos lados entre ${Math.abs(b)}`,
            ),
            correct: false,
            why: bi(
              `Dividing is for undoing multiplication. ${b < 0 ? "Subtraction" : "Addition"} is undone by ${b < 0 ? "addition" : "subtraction"}.`,
              `Dividir deshace una multiplicación. ${b < 0 ? "La resta" : "La suma"} se deshace con ${b < 0 ? "la suma" : "la resta"}.`,
            ),
          },
        ],
      }),
    );
    steps.push(
      step({
        id: "rhs",
        prompt: bi(
          `${rhs} ${b < 0 ? "+" : "−"} ${Math.abs(b)} = ? (the new right side)`,
          `${rhs} ${b < 0 ? "+" : "−"} ${Math.abs(b)} = ? (el nuevo lado derecho)`,
        ),
        answer: R(rhs - b),
        hints: hints(
          bi(
            "Do the same thing to the right side so the scale stays balanced.",
            "Haz lo mismo en el lado derecho para mantener el equilibrio.",
          ),
        ),
      }),
    );
  }
  if (!A.eq(1)) {
    steps.push(
      step({
        id: "inv2",
        kind: "choice",
        minLevel: 2,
        prompt: bi(
          `Now ${A.eq(-1) ? "−" : A.isInteger() ? A.toString() : `1/${m[1]}`}x = ${rhs - b}. Which move leaves x alone?`,
          `Ahora ${A.eq(-1) ? "−" : A.isInteger() ? A.toString() : `1/${m[1]}`}x = ${rhs - b}. ¿Qué movimiento deja sola a x?`,
        ),
        choices: A.isInteger()
          ? [
              {
                text: bi(`Divide both sides by ${A}`, `Dividir ambos lados entre ${A}`),
                correct: true,
              },
              {
                text: bi(`Subtract ${A} from both sides`, `Restar ${A} de ambos lados`),
                correct: false,
                why: bi(
                  `${A}x means ${A} times x, so the opposite is dividing, not subtracting.`,
                  `${A}x significa ${A} por x, así que lo opuesto es dividir, no restar.`,
                ),
              },
              {
                text: bi(`Multiply both sides by ${A}`, `Multiplicar ambos lados por ${A}`),
                correct: false,
                why: bi(
                  "Multiplying would make x even more tangled up. Undo the multiplication with division.",
                  "Multiplicar enredaría más a x. Deshaz la multiplicación con una división.",
                ),
              },
            ]
          : [
              {
                text: bi(`Multiply both sides by ${m[1]}`, `Multiplicar ambos lados por ${m[1]}`),
                correct: true,
              },
              {
                text: bi(`Divide both sides by ${m[1]}`, `Dividir ambos lados entre ${m[1]}`),
                correct: false,
                why: bi(
                  "x is being divided already. Undo division with multiplication.",
                  "A x ya se le está dividiendo. Deshaz la división con una multiplicación.",
                ),
              },
            ],
      }),
    );
  }
  steps.push(
    step({
      id: "x",
      minLevel: 1,
      prompt: bi(`x = ?`, `x = ?`),
      answer: x,
      hints: hints(
        bi(
          `Use the move you chose on ${rhs - b}.`,
          `Usa el movimiento que elegiste con ${rhs - b}.`,
        ),
      ),
      wrong: (v) =>
        b && Rational.of(v).eq(R(rhs).div(A))
          ? bi(
              "It looks like the first step was skipped. Undo the addition or subtraction first.",
              "Parece que se saltó el primer paso. Primero deshaz la suma o la resta.",
            )
          : null,
    }),
  );
  steps.push(
    step({
      id: "final",
      minLevel: 0,
      prompt: bi(
        `Find x. (Check by putting your x back into ${eqText}.)`,
        `Halla x. (Comprueba poniendo tu x en ${eqText}.)`,
      ),
      answer: x,
      hints: hints(
        bi(
          "Undo the operations in the opposite order they were done.",
          "Deshaz las operaciones en el orden contrario al que se hicieron.",
        ),
      ),
      wrong: (v) =>
        b && Rational.of(v).eq(R(rhs).div(A))
          ? bi(
              "It looks like the first step was skipped. Undo the addition or subtraction first.",
              "Parece que se saltó el primer paso. Primero deshaz la suma o la resta.",
            )
          : null,
    }),
  );
  return {
    family: "equation",
    objective: bi(
      "Solve an equation by keeping both sides equal.",
      "Resuelve una ecuación manteniendo la igualdad.",
    ),
    steps,
    answer: x,
    visual:
      kind === "axb" && A.isInteger() && A.gt(0)
        ? { model: "balanceScale", params: { a: Number(A.n), b, c: 0, d: rhs } }
        : null,
  };
}

function percentOf(m) {
  const p = R(m[1]);
  const w = R(m[2]);
  const part = w.mul(p).div(100);
  return {
    family: "percent",
    objective: bi("Find a percent of a number.", "Halla un porcentaje de un número."),
    steps: [
      step({
        id: "dec",
        prompt: bi(
          `${m[1]}% means ${m[1]} out of 100. Write it as a decimal.`,
          `${m[1]}% significa ${m[1]} de cada 100. Escríbelo como decimal.`,
        ),
        answer: p.div(100),
        hints: hints(
          bi(
            `Divide ${m[1]} by 100: move the decimal point 2 places left.`,
            `Divide ${m[1]} entre 100: mueve el punto decimal 2 lugares a la izquierda.`,
          ),
        ),
      }),
      step({
        id: "part",
        minLevel: 2,
        prompt: bi(`${p.div(100)} × ${m[2]} = ?`, `${p.div(100)} × ${m[2]} = ?`),
        answer: part,
        hints: hints(
          bi(
            `Of means multiply. Multiply ${m[2]} by ${p.div(100)}.`,
            `"De" significa multiplicar. Multiplica ${m[2]} por ${p.div(100)}.`,
          ),
        ),
      }),
      step({
        id: "final",
        minLevel: 0,
        prompt: bi(`What is ${m[1]}% of ${m[2]}?`, `¿Cuánto es ${m[1]}% de ${m[2]}?`),
        answer: part,
        hints: hints(
          bi(
            `Benchmark: 50% is half, 25% is a quarter, 10% is a tenth.`,
            `Referencia: 50% es la mitad, 25% es un cuarto, 10% es un décimo.`,
          ),
        ),
        wrong: (v) =>
          Rational.of(v).eq(p)
            ? bi(
                `${m[1]} is the percent, not the part. Find ${m[1]} out of every 100 of ${m[2]}.`,
                `${m[1]} es el porcentaje, no la parte. Halla ${m[1]} de cada 100 de ${m[2]}.`,
              )
            : null,
      }),
    ],
    answer: part,
    visual: { model: "percentBar", params: { whole: Number(w.n), pct: Number(p.n) } },
  };
}

function slope(m) {
  const [x1, y1, x2, y2] = m.slice(1, 5).map(Number);
  if (x1 === x2) return null;
  const s = R(y2 - y1, x2 - x1);
  return {
    family: "slope",
    objective: bi("Find the slope from two points.", "Halla la pendiente con dos puntos."),
    steps: [
      step({
        id: "rise",
        prompt: bi(
          `Rise: how far up or down from (${x1}, ${y1}) to (${x2}, ${y2})? ${y2} − ${y1} = ?`,
          `Elevación: ¿cuánto sube o baja de (${x1}, ${y1}) a (${x2}, ${y2})? ${y2} − ${y1} = ?`,
        ),
        answer: R(y2 - y1),
        hints: hints(
          bi(
            "Down is negative, up is positive.",
            "Hacia abajo es negativo, hacia arriba es positivo.",
          ),
        ),
      }),
      step({
        id: "run",
        prompt: bi(
          `Run: how far across? ${x2} − ${x1} = ?`,
          `Avance: ¿cuánto avanza? ${x2} − ${x1} = ?`,
        ),
        answer: R(x2 - x1),
        hints: hints(
          bi(
            "Subtract the x-values in the same order as the y-values.",
            "Resta los valores de x en el mismo orden que los de y.",
          ),
        ),
      }),
      step({
        id: "final",
        minLevel: 0,
        prompt: bi("Slope = rise ÷ run = ?", "Pendiente = elevación ÷ avance = ?"),
        answer: s,
        simplified: true,
        hints: hints(bi(`Divide ${y2 - y1} by ${x2 - x1}.`, `Divide ${y2 - y1} entre ${x2 - x1}.`)),
        wrong: (v) =>
          parseRational(v)?.eq(s.neg()) && !s.isZero()
            ? bi(
                "The sign is flipped. Check whether the rise and the run have the same direction.",
                "El signo está al revés. Revisa si la elevación y el avance van en la misma dirección.",
              )
            : parseRational(v)?.eq(R(x2 - x1, y2 - y1))
              ? bi(
                  "That is run ÷ rise. Slope is rise over run.",
                  "Eso es avance ÷ elevación. La pendiente es elevación entre avance.",
                )
              : null,
      }),
    ],
    answer: s,
    simplified: true,
    visual: { model: "linearGraph", params: { m: s.toString(), b: 0, x: 1 } },
  };
}

function integers(m) {
  const a = num(m[1]);
  const b = num(m[3]);
  const sub = minus(m[2]);
  const result = sub ? a - b : a + b;
  const steps = [];
  if (sub)
    steps.push(
      step({
        id: "rewrite",
        prompt: bi(
          `Subtracting ${b} is the same as adding what?`,
          `Restar ${b} es lo mismo que sumar qué número?`,
        ),
        answer: R(-b),
        hints: hints(
          bi(
            "Subtracting a number is adding its opposite.",
            "Restar un número es sumar su opuesto.",
          ),
        ),
      }),
    );
  const addend = sub ? -b : b;
  steps.push(
    step({
      id: "sign",
      kind: "choice",
      minLevel: 2,
      prompt: bi(
        `${a} + (${addend}): will the answer be positive, negative or zero?`,
        `${a} + (${addend}): ¿la respuesta será positiva, negativa o cero?`,
      ),
      choices: [
        {
          text: bi("Positive", "Positiva"),
          correct: result > 0,
          why: bi(
            "Compare the distances from zero: the number farther from zero decides the sign.",
            "Compara las distancias a cero: el número más lejano de cero decide el signo.",
          ),
        },
        {
          text: bi("Negative", "Negativa"),
          correct: result < 0,
          why: bi(
            "Compare the distances from zero: the number farther from zero decides the sign.",
            "Compara las distancias a cero: el número más lejano de cero decide el signo.",
          ),
        },
        {
          text: bi("Zero", "Cero"),
          correct: result === 0,
          why: bi(
            "Zero only happens when the two numbers are opposites.",
            "Solo es cero cuando los dos números son opuestos.",
          ),
        },
      ],
    }),
  );
  steps.push(
    step({
      id: "final",
      minLevel: 0,
      prompt: bi(
        `${a} ${sub ? "−" : "+"} ${b < 0 ? `(${b})` : b} = ?`,
        `${a} ${sub ? "−" : "+"} ${b < 0 ? `(${b})` : b} = ?`,
      ),
      answer: R(result),
      hints: hints(
        bi(
          "Picture a number line: start at the first number and move.",
          "Imagina una recta numérica: empieza en el primer número y avanza.",
        ),
      ),
      wrong: (v) =>
        Rational.of(v).eq(-result) && result !== 0
          ? bi(
              "The size is right but the sign is flipped. Which number is farther from zero?",
              "El tamaño es correcto pero el signo está al revés. ¿Qué número está más lejos de cero?",
            )
          : Rational.of(v).eq(Math.abs(a) + Math.abs(b)) && (a < 0 || b < 0)
            ? bi(
                "You added the sizes. With different signs the numbers partly cancel.",
                "Sumaste los tamaños. Con signos distintos los números se cancelan en parte.",
              )
            : null,
    }),
  );
  return {
    family: "integers",
    objective: bi("Add and subtract integers.", "Suma y resta enteros."),
    steps,
    answer: R(result),
    visual: { model: "integerChips", params: { a, expr: { a, b, op: sub ? "-" : "+" } } },
  };
}

const PARSERS = [
  [/^\s*([\d,]+)\s*([+−-])\s*([\d,]+)\s*=\s*\?\s*$/, addSub],
  [/^\s*([\d,]+)\s*[×x*]\s*([\d,]+)\s*=\s*\?\s*$/, multiply],
  [/^\s*(\d+)\/(\d+)\s*([+−-])\s*(\d+)\/(\d+)\s*=\s*\?\s*$/, fractionAddSub],
  [
    /^\s*([+-]?\d*)x\s*(?:([+−-])\s*(\d+))?\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/,
    (m) => equation(m, "axb"),
  ],
  [/^\s*x\s*[÷/]\s*(\d+)\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/, (m) => equation(m, "xdiv")],
  [
    /^\s*x\s*([+−-])\s*(\d+)\s*=\s*(-?\d+)\.\s*Find x\.?\s*$/,
    (m) => equation(["", "", m[1], m[2], m[3]], "axb"),
  ],
  [/^\s*What is (\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?)\?\s*$/, percentOf],
  [/^\s*Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.?\s*$/, slope],
  [/^\s*\(?(-?\d+)\)?\s*([+−-])\s*\(?(-?\d+)\)?\s*=\s*\?\s*$/, integers],
];

export function buildPlan(question) {
  for (const [re, build] of PARSERS) {
    const m = re.exec(String(question));
    if (!m) continue;
    const plan = build(m);
    if (plan) return { ...plan, question: String(question) };
  }
  return null;
}
export const solverSupports = (question) => Boolean(buildPlan(question));

// ---------------------------------------------------------------- parallel problems in the same family
export function parallelQuestion(question, rng) {
  const plan = buildPlan(question);
  if (!plan) return null;
  const sameNumbers = (q) => q.replace(/[\s,]/g, "") === String(question).replace(/[\s,]/g, "");
  for (let tries = 0; tries < 40; tries += 1) {
    let q;
    const r = rng.int;
    switch (plan.family) {
      case "addSub": {
        const sub = /[−-]/.test(question.replace(/^\s*[\d,]+/, ""));
        const digits = String(num(/^\s*([\d,]+)/.exec(question)[1])).length;
        const hi = 10 ** digits - 1;
        const x = r(10 ** (digits - 1), hi);
        const y = r(10 ** (digits - 1), hi);
        q = sub
          ? `${group(Math.max(x, y))} − ${group(Math.min(x, y))} = ?`
          : `${group(x)} + ${group(y)} = ?`;
        break;
      }
      case "multiply": {
        const m = /^\s*([\d,]+)\s*[×x*]\s*([\d,]+)/.exec(question);
        q = `${group(r(2 * 10 ** (String(num(m[1])).length - 1), 10 ** String(num(m[1])).length - 1))} × ${r(2, 10 ** String(num(m[2])).length - 1)} = ?`;
        break;
      }
      case "fractionAddSub": {
        const d1 = r(2, 9);
        const d2 = rng.pick([2, 3, 4, 5, 6, 8, 10, 12].filter((d) => d !== d1));
        let [n1, n2] = [r(1, d1 - 1), r(1, d2 - 1)];
        const sub = /[−-]/.test(question.replace(/^\s*\d+\/\d+/, ""));
        // A subtraction keeps the larger fraction first so the result stays positive.
        if (sub && R(n1, d1).lt(R(n2, d2))) {
          [n1, n2] = [n2, n1];
          q = `${n1}/${d2} − ${n2}/${d1} = ?`;
        } else q = `${n1}/${d1} ${sub ? "−" : "+"} ${n2}/${d2} = ?`;
        break;
      }
      case "equation": {
        const x = r(2, 12);
        const a = r(2, 9);
        const b = r(1, 12);
        q = /\+|−|-/.test(question.replace(/=.*/, "").replace(/^\s*[+-]?\d*x/, ""))
          ? `${a}x ${rng.pick(["+", "−"])} ${b} = ${a * x + (rng.int(0, 1) ? b : -b)}. Find x.`
          : `${a}x = ${a * x}. Find x.`;
        if (!buildPlan(q)) continue;
        break;
      }
      case "percent":
        q = `What is ${rng.pick([10, 20, 25, 30, 40, 50, 75])}% of ${rng.pick([20, 40, 60, 80, 120, 200])}?`;
        break;
      case "slope": {
        const x1 = r(-4, 3);
        const y1 = r(-5, 5);
        q = `Find the slope through (${x1}, ${y1}) and (${x1 + r(1, 5)}, ${r(-6, 6)}).`;
        break;
      }
      case "integers":
        q = `${r(-9, 9)} ${rng.pick(["+", "−"])} ${r(-9, 9)} = ?`.replace(
          / ([+−]) (-\d+)/,
          " $1 ($2)",
        );
        break;
      default:
        return null;
    }
    if (q && !sameNumbers(q) && buildPlan(q)?.family === plan.family) return q;
  }
  return null;
}

// ---------------------------------------------------------------- fading scaffolds
// Two independent successes at a level fade one level of support; a miss brings one level back.
export function nextScaffold(level, outcomes) {
  const recent = outcomes.slice(-2);
  if (recent.length === 2 && recent.every((o) => o.independent && o.correct))
    return Math.max(0, level - 1);
  const last = outcomes.at(-1);
  if (last && !last.correct) return Math.min(3, level + 1);
  return level;
}

// ---------------------------------------------------------------- controller
export class GuidedSolver {
  constructor(question, { scaffold = 3, onEvent = () => {} } = {}) {
    const plan = buildPlan(question);
    if (!plan) throw new Error("This problem has no guided plan");
    this.plan = plan;
    this.scaffold = Math.max(0, Math.min(3, scaffold));
    this.onEvent = onEvent;
    this.steps = plan.steps.filter((s) => s.minLevel <= this.scaffold || s.id === "final");
    this.index = 0;
    this.stats = { hints: 0, reveals: 0, wrong: 0, attempts: 0, steps: this.steps.length };
    this.stepWrong = 0;
    this.hintRung = 0;
    this.finished = false;
    this.firstTryFinal = null;
  }

  current() {
    return this.finished ? null : this.steps[this.index];
  }

  emit(type, detail = {}) {
    this.onEvent({ type, step: this.current()?.id, scaffold: this.scaffold, ...detail });
  }

  check(step, value) {
    if (step.kind === "choice") {
      const choice = step.choices[Number(value)];
      if (!choice)
        return {
          ok: false,
          feedback: bi("Choose one of the options.", "Elige una de las opciones."),
        };
      return choice.correct
        ? { ok: true }
        : {
            ok: false,
            feedback:
              choice.why || bi("Not quite. Try another choice.", "Todavía no. Prueba otra opción."),
          };
    }
    const parsed = parseRational(value);
    if (!parsed)
      return {
        ok: false,
        feedback: bi(
          "Enter a number, a fraction like 3/4, or a decimal.",
          "Escribe un número, una fracción como 3/4 o un decimal.",
        ),
        invalid: true,
      };
    const right = equivalent(value, step.answer, { simplified: Boolean(step.simplified) });
    if (right) return { ok: true };
    const targeted = step.wrong?.(value);
    if (targeted) return { ok: false, feedback: targeted };
    if (equivalent(value, step.answer))
      return {
        ok: false,
        feedback: bi(
          "That has the right value but is not in the form asked for. Simplify it.",
          "Tiene el valor correcto pero no está en la forma pedida. Simplifícalo.",
        ),
      };
    return {
      ok: false,
      feedback: bi(
        "Not quite. Look at the hint or try the step again.",
        "Todavía no. Mira la pista o intenta el paso de nuevo.",
      ),
    };
  }

  submit(value) {
    const step = this.current();
    if (!step) return { ok: false, done: true };
    this.stats.attempts += 1;
    const result = this.check(step, value);
    if (result.invalid) return { ...result, done: false };
    if (!result.ok) {
      this.stats.wrong += 1;
      this.stepWrong += 1;
      this.emit("wrong", { value });
      return { ...result, done: false };
    }
    if (step.id === "final" && this.firstTryFinal === null)
      this.firstTryFinal = this.stepWrong === 0;
    this.emit("right", { value });
    this.index += 1;
    this.stepWrong = 0;
    this.hintRung = 0;
    if (this.index >= this.steps.length) this.finished = true;
    return { ok: true, done: this.finished };
  }

  hint() {
    const step = this.current();
    if (!step) return null;
    const list = step.hints;
    if (!list.length)
      return {
        rung: 0,
        text: bi(
          "Look back at the question and try one small piece.",
          "Vuelve a la pregunta y prueba una parte pequeña.",
        ),
      };
    const text = list[Math.min(this.hintRung, list.length - 1)];
    this.hintRung += 1;
    this.stats.hints += 1;
    this.emit("hint", { rung: this.hintRung });
    return { rung: this.hintRung, text };
  }

  // Showing an answer completes the step but is always recorded as support.
  reveal() {
    const step = this.current();
    if (!step) return null;
    this.stats.reveals += 1;
    const shown =
      step.kind === "choice"
        ? step.choices.find((c) => c.correct).text
        : bi(`${step.answer}`, `${step.answer}`);
    this.emit("reveal");
    this.index += 1;
    this.stepWrong = 0;
    this.hintRung = 0;
    if (this.index >= this.steps.length) this.finished = true;
    return { shown };
  }

  // What the evidence engine may be told. Independent means: no support level, no hint, no reveal, right the first time.
  summary() {
    const supported = this.scaffold > 0 || this.stats.hints > 0 || this.stats.reveals > 0;
    const correct = this.finished && this.stats.reveals === 0;
    const independent =
      correct && !supported && this.firstTryFinal === true && this.stats.wrong === 0;
    return {
      family: this.plan.family,
      finished: this.finished,
      correct,
      independent,
      supported: correct && supported,
      scaffold: this.scaffold,
      hints: this.stats.hints,
      reveals: this.stats.reveals,
      wrong: this.stats.wrong,
      // After supported success the learner owes a fresh problem at the next lower level before it counts as independent.
      owesFreshAttempt: correct && !independent,
      nextScaffold:
        correct && supported
          ? Math.max(0, this.scaffold - (this.stats.hints + this.stats.reveals ? 0 : 1))
          : this.scaffold,
    };
  }
}
