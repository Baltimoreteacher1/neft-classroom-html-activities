// Power Plant — the mathematics. Pure functions, no DOM, no game state.
// Lessons 6-3 (powers and exponents) and 6-4 (order of operations with
// exponents and grouping symbols). Everything the facility does with a number
// comes from here, and tools/universe/power-plant.test.mjs recomputes it
// independently.

/** base^exp as repeated multiplication (exact for the small integers used here). */
export function power(base, exp) {
  let p = 1;
  for (let i = 0; i < exp; i++) p *= base;
  return p;
}

/** The repeated-factor structure a reactor's coils show: [b, b, b, ...]. */
export function factors(base, exp) {
  return Array.from({ length: exp }, () => base);
}

/** Running products as each coil fires: 2^3 -> [2, 4, 8]. */
export function running(base, exp) {
  const out = [];
  let p = 1;
  for (let i = 0; i < exp; i++) out.push((p *= base));
  return out;
}

/** What "an exponent is just multiplication" computes. */
export function asMultiplication(base, exp) {
  return base * exp;
}

/** Every (base, exp) with base in `bases`, 1 <= exp <= maxExp, whose power is `target`. */
export function equivalents(target, bases, maxExp) {
  const out = [];
  for (const b of bases)
    for (let e = 1; e <= maxExp; e++) if (power(b, e) === target) out.push({ base: b, exp: e });
  return out;
}

// ---- Order of operations -------------------------------------------------
// An expression is a flat token list: numbers and the operators + − × ÷ ^,
// e.g. [2, "+", 3, "×", 4, "^", 2]. A grouping clamp is [i, j]: the operand
// positions (token indexes of numbers) it wraps, inclusive.

const PREC = { "^": 3, "×": 2, "÷": 2, "+": 1, "−": 1 };

function applyOp(op, a, b) {
  if (op === "+") return a + b;
  if (op === "−") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return a / b;
  return power(a, b);
}

/**
 * Evaluate with the standard order of operations, recording each step.
 * @param {(number | string)[]} tokens
 * @returns {{value: number, steps: Array<{op: string, a: number, b: number, result: number}>}}
 */
function evalFlat(tokens) {
  const t = tokens.slice();
  const steps = [];
  for (const level of [3, 2, 1]) {
    // Exponents here are single powers (no towers), so left to right is right for every level.
    for (let i = 1; i < t.length;) {
      const op = /** @type {string} */ (t[i]);
      if (PREC[op] !== level) {
        i += 2;
        continue;
      }
      const a = /** @type {number} */ (t[i - 1]);
      const b = /** @type {number} */ (t[i + 1]);
      const result = applyOp(op, a, b);
      steps.push({ op, a, b, result });
      t.splice(i - 1, 3, result);
    }
  }
  return { value: /** @type {number} */ (t[0]), steps };
}

/**
 * Evaluate with an optional grouping clamp [i, j] (token indexes of the first
 * and last number inside the parentheses).
 */
export function evaluate(tokens, group = null) {
  if (!group) return evalFlat(tokens);
  const [i, j] = group;
  const inner = evalFlat(tokens.slice(i, j + 1));
  const outer = evalFlat([...tokens.slice(0, i), inner.value, ...tokens.slice(j + 1)]);
  return { value: outer.value, steps: [...inner.steps, ...outer.steps] };
}

/** The misconception: work strictly left to right, ignoring precedence. */
export function leftToRight(tokens) {
  let v = /** @type {number} */ (tokens[0]);
  for (let i = 1; i < tokens.length; i += 2)
    v = applyOp(/** @type {string} */ (tokens[i]), v, /** @type {number} */ (tokens[i + 1]));
  return v;
}

/**
 * Every clamp that wraps exactly one operation or two (and not the whole
 * expression): the placements a sequencer's bracket can snap to. An exponent
 * is never split from its base on the right side ("4^2" stays one unit when
 * it is the clamp's last operand's power).
 */
export function clamps(tokens) {
  const out = [];
  const last = tokens.length - 1;
  for (let i = 0; i < last; i += 2)
    for (let j = i + 2; j <= last && j <= i + 4; j += 2) {
      if (i === 0 && j === last) continue;
      // Do not end a clamp on a base whose exponent sits outside it: (3 × 4)^2 is a
      // legal, different expression, so that placement is KEPT; what is excluded is
      // starting a clamp on an exponent (2 + 3 × 4^(2 ...) is not an expression here).
      if (i > 0 && tokens[i - 1] === "^") continue;
      out.push([i, j]);
    }
  return out;
}

/** Text for an expression, with its clamp shown as parentheses. */
export function show(tokens, group = null) {
  let s = "";
  for (let k = 0; k < tokens.length; k++) {
    if (group && k === group[0]) s += "(";
    const t = tokens[k];
    s += typeof t === "number" ? String(t) : t === "^" ? "^" : ` ${t} `;
    if (group && k === group[1]) s += ")";
  }
  return s;
}

/** Which rule a step used, for the sequencer's stage lights and Ori's distinctions. */
export function stageOf(op) {
  return op === "^" ? "power" : op === "×" || op === "÷" ? "times" : "plus";
}
