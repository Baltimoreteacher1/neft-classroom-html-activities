// small-group-misconceptions.js — turn a wrong answer into a NAMED misconception.
//
// Why this exists: until now the studio could only ever say "not right". Every
// judgment ran through isRight(), which is a boolean, so the richest signal in
// the room — *how* a grade-6 student got it wrong — was computed, displayed as a
// red outline, and thrown away. A teacher does not need to know that four
// students missed item 3; they need to know that three of them added the
// denominators.
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

import { numberOf } from "./small-group-answers.js";

const EPS = 1e-9;
const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < EPS;

// The taxonomy. `watchFor` is teacher-facing and deliberately imperative — it is
// surfaced in the facilitation console and the next-move recommendation, where a
// noun phrase ("place value") is useless and an instruction is not.
export const MISCONCEPTIONS = {
  "op-added-instead-of-multiplied": {
    label: "Added when the problem multiplies",
    labelEs: "Sumó cuando el problema multiplica",
    watchFor: "Ask what the operation *does* to the quantity before they compute.",
  },
  "op-multiplied-instead-of-added": {
    label: "Multiplied when the problem adds",
    labelEs: "Multiplicó cuando el problema suma",
    watchFor: "Have them restate the problem as a story, then name the operation.",
  },
  "op-reversed-subtraction": {
    label: "Subtracted in the wrong order",
    labelEs: "Restó en el orden equivocado",
    watchFor: "Anchor both numbers on a number line before subtracting.",
  },
  "op-reversed-division": {
    label: "Divided in the wrong order",
    labelEs: "Dividió en el orden equivocado",
    watchFor: "Ask “what is being split, and into how many?” before they write it.",
  },
  "op-divided-instead-of-multiplied": {
    label: "Divided when the problem multiplies",
    labelEs: "Dividió cuando el problema multiplica",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
  },
  "op-multiplied-instead-of-divided": {
    label: "Multiplied when the problem divides",
    labelEs: "Multiplicó cuando el problema divide",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
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
  },
  "fraction-added-denominators": {
    label: "Added the denominators",
    labelEs: "Sumó los denominadores",
    watchFor: "Return to a bar model — thirds plus fifths cannot become eighths.",
  },
  "fraction-straight-across-division": {
    label: "Divided numerators and denominators straight across",
    labelEs: "Dividió numeradores y denominadores directamente",
    watchFor: "Reground division as “how many of these fit into that?”",
  },
  "fraction-no-reciprocal": {
    label: "Divided fractions without inverting",
    labelEs: "Dividió fracciones sin invertir",
    watchFor: "Ask them to check with a whole-number case they already trust.",
  },
  "percent-used-as-whole-number": {
    label: "Used the percent as a plain number",
    labelEs: "Usó el porcentaje como número entero",
    watchFor: "Make them say the percent as “per hundred” out loud.",
  },
  "percent-scale-off-by-100": {
    label: "Percent answer off by a factor of 100",
    labelEs: "Respuesta de porcentaje errada por un factor de 100",
    watchFor: "Benchmark against 50% and 10% before trusting the number.",
  },
  "ratio-inverted": {
    label: "Flipped the ratio",
    labelEs: "Invirtió la razón",
    watchFor: "Have them label both quantities with units before writing the ratio.",
  },
  "rate-not-per-one": {
    label: "Gave the total instead of the unit rate",
    labelEs: "Dio el total en vez de la tasa unitaria",
    watchFor: "Ask “per ONE what?” and make them finish the sentence.",
  },
  "exponent-as-multiplication": {
    label: "Multiplied the base by the exponent",
    labelEs: "Multiplicó la base por el exponente",
    watchFor: "Expand it once — write out every factor before evaluating.",
  },
  "order-of-operations-left-to-right": {
    label: "Worked left to right instead of by operation order",
    labelEs: "Trabajó de izquierda a derecha en vez de por orden de operaciones",
    watchFor: "Have them circle the operation that must go first, then compute.",
  },
  "sign-dropped": {
    label: "Right magnitude, lost the negative sign",
    labelEs: "Magnitud correcta, perdió el signo negativo",
    watchFor: "Place the answer on a number line — which side of zero?",
  },
  "stat-summed-instead-of-averaged": {
    label: "Added the data set instead of averaging it",
    labelEs: "Sumó el conjunto de datos en vez de promediarlo",
    watchFor: "Ask whether the answer could be a realistic single value in that set.",
  },
  "measure-area-perimeter-swap": {
    label: "Swapped area and perimeter",
    labelEs: "Confundió área y perímetro",
    watchFor: "Ask what the unit should be — units or square units?",
  },
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
 */
function predictions(item, correct) {
  const stem = item?.stem || item?.title || "";
  const out = [];
  const push = (id, value) => {
    if (value != null && Number.isFinite(value)) out.push({ id, value });
  };
  const expression = scanExpression(stem);

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
        if (right.d !== 0 && right.n !== 0) {
          push("fraction-straight-across-division", left.n / right.n / (left.d / right.d));
        }
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
 * Name the misconception behind a wrong response, or return null.
 *
 * @param {object} item   the practice item (stem + answer)
 * @param {string} typed  what the student actually entered or selected
 * @returns {string|null} a key of MISCONCEPTIONS
 */
export function detectMisconception(item, typed) {
  const answer = numberOf(item?.answer);
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
