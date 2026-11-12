/**
 * Shared instructional models for the publisher upgrade.
 *
 * Pure functions only: no DOM, no network, no student names. The lesson engine,
 * the ratio canvas, the misconception repair, and the tests all read this file
 * so a scale factor, a power, and an equation move cannot drift apart.
 */

export const SCHEMA_VERSION = 1;

export const HINT_ROLES = [
  { id: "strategic", en: "Strategic question", es: "Pregunta estratégica" },
  { id: "representation", en: "Representation or partial step", es: "Representación o paso parcial" },
  { id: "parallel", en: "Parallel worked example", es: "Ejemplo parecido resuelto" },
];

export const PRACTICE_ARC = [
  { id: "prepare", en: "Prepare", es: "Preparar" },
  { id: "explore", en: "Explore", es: "Explorar" },
  { id: "guided", en: "Guided", es: "Guiado" },
  { id: "independent", en: "Independent", es: "Independiente" },
  { id: "reason", en: "Reason", es: "Razonar" },
  { id: "apply", en: "Apply", es: "Aplicar" },
  { id: "improve", en: "Improve", es: "Mejorar" },
];

/** Family path. Stop ids stay the historical panel ids; these are the names a family hears. */
export const FAMILY_PATH = [
  { id: "learn", en: "What we are learning", es: "Qué estamos aprendiendo" },
  { id: "see", en: "See it", es: "Míralo" },
  { id: "together", en: "Try it together", es: "Pruébenlo juntos" },
  { id: "turn", en: "Your turn", es: "Tu turno" },
  { id: "help", en: "Need help", es: "¿Necesitan ayuda?" },
  { id: "finish", en: "Finish", es: "Terminar" },
];

export const FAMILY_OPTIONAL_LINE = {
  en: "This family practice is optional and ungraded.",
  es: "Esta práctica familiar es opcional y no lleva calificación.",
};

const FAMILY_REQUIRED = [
  /required homework/i,
  /this (assignment|homework) is required/i,
  /earn(?:ing)? bonus points?/i,
  /extra credit/i,
  /will be graded/i,
  /counts (as|toward) (a |your )?grade/i,
  /tarea obligatoria/i,
  /puntos extra por/i,
];

/** True when optional family copy starts to sound required or scored. Negations are ignored. */
export function familyCopyRequiresWork(text) {
  const s = String(text || "")
    .replace(/\bnot extra credit\b/gi, "")
    .replace(/\bno extra credit\b/gi, "")
    .replace(/\bnot bonus points?\b/gi, "")
    .replace(/\bno bonus points?\b/gi, "")
    .replace(/\bnot required homework\b/gi, "")
    .replace(/\bis(?: not|n't) required\b/gi, "");
  return FAMILY_REQUIRED.some((re) => re.test(s));
}

/**
 * One scale factor drives every ratio representation.
 * a and b are the base ratio; factor is a positive scale.
 */
export function connectedRatio(a, b, factor) {
  const A = Number(a);
  const B = Number(b);
  const k = Number(factor);
  if (!(A > 0) || !(B > 0) || !(k > 0) || !Number.isFinite(A + B + k)) {
    throw new RangeError("connectedRatio needs positive finite a, b, and factor");
  }
  const x = A * k;
  const y = B * k;
  return {
    factor: k,
    quantity: { groups: k, perGroup: [A, B], totals: [x, y] },
    tape: { copies: k, each: [A, B], totals: [x, y] },
    table: { row: [x, y], times: k },
    doubleNumberLine: { x, y },
    symbolic: `${trimNum(A)}:${trimNum(B)} = ${trimNum(x)}:${trimNum(y)}`,
    unitRate: B / A,
  };
}

/** Every representation names the same pair and the same scale. */
export function ratioScaleInvariant(model) {
  const [A, B] = model.quantity.perGroup;
  const [x, y] = model.quantity.totals;
  const k = model.factor;
  const sameTotals =
    model.tape.totals[0] === x &&
    model.tape.totals[1] === y &&
    model.table.row[0] === x &&
    model.table.row[1] === y &&
    model.doubleNumberLine.x === x &&
    model.doubleNumberLine.y === y;
  const sameScale = model.quantity.groups === k && model.tape.copies === k && model.table.times === k;
  const rateHeld = y / x === B / A && x / A === k && y / B === k;
  const statement = model.symbolic === `${trimNum(A)}:${trimNum(B)} = ${trimNum(x)}:${trimNum(y)}`;
  return sameTotals && sameScale && rateHeld && statement;
}

function trimNum(n) {
  if (Number.isInteger(n)) return String(n);
  const s = String(Math.round(n * 1e9) / 1e9);
  return s;
}

/** Repeated multiplication. 3^2 is 3×3 = 9, never 3×2. */
export function powerValue(base, exponent) {
  const b = Number(base);
  const e = Number(exponent);
  if (!Number.isInteger(b) || !Number.isInteger(e) || b <= 0 || e < 0 || e > 8) {
    throw new RangeError("powerValue expects a positive integer base and an exponent from 0 to 8");
  }
  const factors = [];
  let value = 1;
  for (let i = 0; i < e; i += 1) {
    factors.push(b);
    value *= b;
  }
  return {
    base: b,
    exponent: e,
    value: e === 0 ? 1 : value,
    expansion: e === 0 ? "1" : factors.join("×"),
  };
}

/** The "multiply the base by the exponent" value. For 3^2 this is 6, which is wrong. */
export function exponentProductBug(base, exponent) {
  return Number(base) * Number(exponent);
}

export function isExponentProductBug(base, exponent, answer) {
  const power = powerValue(base, exponent);
  const bug = exponentProductBug(base, exponent);
  const given = Number(answer);
  return given === bug && given !== power.value;
}

const FRESH = [
  [2, 3],
  [4, 2],
  [5, 2],
  [2, 4],
  [3, 3],
  [6, 2],
  [2, 5],
  [7, 2],
];

/**
 * A wrong 3^2 = 6 style answer opens a repair, then a fresh item that is not the same power.
 * The message says the error MAY indicate a misunderstanding. It does not claim to know the reasoning.
 */
export function repairExponent({ base, exponent, answer }) {
  const power = powerValue(base, exponent);
  const bug = isExponentProductBug(base, exponent, answer);
  const fresh = freshPowerItem(base, exponent);
  return {
    bug,
    correct: Number(answer) === power.value,
    expansion: power.expansion,
    value: power.value,
    productBug: exponentProductBug(base, exponent),
    message: bug
      ? `An answer of ${exponentProductBug(base, exponent)} may indicate a misunderstanding: multiplying ${base} by the exponent ${exponent}. ${base}^${exponent} means ${power.expansion}, which is ${power.value}. One numeric answer does not show how you were thinking. Write the factors, then try a new power.`
      : Number(answer) === power.value
        ? `${base}^${exponent} = ${power.expansion} = ${power.value}.`
        : `Check the factors. ${base}^${exponent} means ${power.expansion}. This answer may indicate a misunderstanding of what the exponent counts. It does not prove your reasoning.`,
    fresh,
  };
}

export function freshPowerItem(base, exponent) {
  const b = Number(base);
  const e = Number(exponent);
  const next = FRESH.find(([nb, ne]) => nb !== b || ne !== e) || [2, 3];
  const power = powerValue(next[0], next[1]);
  return {
    base: power.base,
    exponent: power.exponent,
    prompt: `What is ${power.base}^${power.exponent}? Write it as repeated multiplication first.`,
    expansion: power.expansion,
    value: power.value,
  };
}

/**
 * Doing the same operation to both sides of p*x + q = r keeps the solution.
 * op is { type: "add"|"sub"|"mul"|"div", k }.
 */
export function equationSolution(p, q, r) {
  const P = Number(p);
  const Q = Number(q);
  const R = Number(r);
  if (!(P !== 0) || !Number.isFinite(P + Q + R)) throw new RangeError("equation needs a nonzero p");
  return (R - Q) / P;
}

export function applyBothSides(equation, op) {
  const p = Number(equation.p);
  const q = Number(equation.q);
  const r = Number(equation.r);
  const k = Number(op?.k);
  if (!Number.isFinite(k)) throw new RangeError("operation needs a finite k");
  if (op.type === "add" || op.type === "sub") {
    const sign = op.type === "sub" ? -1 : 1;
    return { p, q: q + sign * k, r: r + sign * k };
  }
  if (op.type === "mul" || op.type === "div") {
    if (op.type === "div" && k === 0) throw new RangeError("cannot divide by zero");
    const m = op.type === "div" ? 1 / k : k;
    if (m === 0) throw new RangeError("cannot multiply both sides by zero");
    return { p: p * m, q: q * m, r: r * m };
  }
  throw new RangeError("operation type must be add, sub, mul, or div");
}

/**
 * Title, learning target, and standard should name the same work.
 * Returns mismatches. An empty list means the three agree on the verbs they share.
 */
export function lessonTargetMismatches(config, standard) {
  const title = String(config?.title || "");
  const goal = String(config?.contentObjective || "");
  const full = String(standard?.fullText || standard?.shortLabel || "");
  const mismatches = [];
  const goalL = goal.toLowerCase();
  const titleL = title.toLowerCase();
  const fullL = full.toLowerCase();
  if (!goal.trim()) mismatches.push("missing-learning-target");
  if (!title.trim()) mismatches.push("missing-title");
  if (fullL.includes("specific values") && !goalL.includes("specific value")) {
    mismatches.push("target-omits-standard-specific-values");
  }
  if (/exponent|power/.test(titleL) && !/power|exponent/.test(goalL)) {
    mismatches.push("target-omits-title-powers");
  }
  if (/evaluat/.test(titleL) && !/evaluat/.test(goalL)) {
    mismatches.push("target-omits-title-evaluate");
  }
  if (/expression/.test(fullL) && !/expression/.test(goalL)) {
    mismatches.push("target-omits-standard-expression");
  }
  return mismatches;
}

/** Teacher launch card. Student stage ids are not renamed. */
export function teacherLaunchCard(config) {
  const variant = /group2/.test(String(config?.lessonId || config?.variant || ""))
    ? "challenge"
    : /group1|catchup/.test(String(config?.lessonId || config?.variant || ""))
      ? "support"
      : "core";
  return {
    variant,
    goal: String(config?.contentObjective || config?.title || ""),
    standard: String(config?.standard || ""),
    arc: PRACTICE_ARC.map((step) => step.en),
    challengeDepth:
      variant === "challenge"
        ? "Challenge asks students to explain, compare, or find a flaw. It does not only use larger numbers."
        : "Support keeps the same mathematics with more guidance.",
    optionalHelp: "Hints are optional. A first try without a hint is the evidence that counts.",
  };
}

export const DEMO_ROUTES = [
  {
    id: "equivalent-ratios",
    path: "/curriculum/math-canvas/?scene=equivalent-ratios&lesson=3-3",
    file: "curriculum/math-canvas/index.html",
  },
  {
    id: "exponent-repair",
    path: "/curriculum/almost-right-lab/#exponent-repair",
    file: "curriculum/almost-right-lab/index.html",
  },
  {
    id: "teacher-small-group",
    path: "/curriculum/",
    file: "curriculum/index.html",
    also: "lessons/3-3-group1/index.html",
  },
  {
    id: "family-spanish",
    path: "/lessons/6-4/homework.html?lang=es",
    file: "lessons/6-4/homework.html",
  },
  {
    id: "project-studio",
    path: "/curriculum/projects/studio/?project=discovery",
    file: "curriculum/projects/studio/index.html",
  },
];
