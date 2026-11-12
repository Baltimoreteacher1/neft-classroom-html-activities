// Order-of-operations engine for Power Up! — pure functions, no DOM.
// Tokens: {k:"n",v} number · {k:"o",v} operator ("+","-","*","/","^") · {k:"("} · {k:")"}
// An expression is solved one operation at a time; allowedOps() says which
// operations the order of operations permits right now (parentheses first, then
// exponents, then × ÷ left to right, then + − left to right).

export const GLYPH = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" };
export const RANK = { "^": 3, "*": 2, "/": 2, "+": 1, "-": 1 };
export const RANK_NAME = { 3: "exponent", 2: "multiply-divide", 1: "add-subtract" };

export const num = (v) => ({ k: "n", v });
export const op = (v) => ({ k: "o", v });
export const LP = { k: "(" };
export const RP = { k: ")" };

/** Apply one operation; returns null when the result leaves the whole numbers. */
export function apply(o, a, b) {
  if (o === "+") return a + b;
  if (o === "-") return a >= b ? a - b : null;
  if (o === "*") return a * b;
  if (o === "/") return b > 0 && a % b === 0 ? a / b : null;
  if (o === "^") return a ** b;
  return null;
}

/** Innermost parenthesis groups are "ready"; with no parentheses the whole line is one group. */
export function allowedOps(t) {
  const stack = [0];
  const hasChild = new Set();
  const ops = [];
  let gid = 0;
  t.forEach((x, i) => {
    if (x.k === "(") {
      hasChild.add(stack[stack.length - 1]);
      stack.push(++gid);
    } else if (x.k === ")") stack.pop();
    else if (x.k === "o") ops.push({ i, o: x.v, g: stack[stack.length - 1] });
  });
  const ready = new Set(ops.filter((p) => !hasChild.has(p.g)).map((p) => p.g));
  const out = [];
  for (const g of ready) {
    const inGroup = ops.filter((p) => p.g === g);
    const top = Math.max(...inGroup.map((p) => RANK[p.o]));
    for (const p of inGroup) {
      if (RANK[p.o] !== top) continue;
      if (t[p.i - 1]?.k !== "n" || t[p.i + 1]?.k !== "n") continue;
      const before = t[p.i - 2];
      // A chain like 8 ÷ 4 × 2 or 9 − 3 + 1 goes left to right.
      if (top < 3 && before?.k === "o" && RANK[before.v] === top) continue;
      out.push(p.i);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Why an operator is not available yet: the rank the student should look for. */
export function nextRank(t) {
  const hasParen = t.some((x) => x.k === "(");
  if (hasParen) return "paren";
  const ids = allowedOps(t);
  return ids.length ? RANK[t[ids[0]].v] : null;
}

/** Collapse tokens [i-1..i+1] to a single number, then drop parentheses around a lone number. */
export function reduceAt(t, i, value) {
  const next = [...t.slice(0, i - 1), num(value), ...t.slice(i + 2)];
  for (let j = 0; j < next.length - 2; j++) {
    if (next[j].k === "(" && next[j + 1].k === "n" && next[j + 2].k === ")") {
      next.splice(j, 3, next[j + 1]);
      j = -1;
    }
  }
  return next;
}

/** The operands of the operation at i, as the student will see them. */
export function operandsAt(t, i) {
  return { a: t[i - 1].v, o: t[i].v, b: t[i + 1].v };
}

/** Solve left to right through the allowed set; reports the steps and whether every one stayed in range. */
export function solve(t, cap = 99999) {
  let cur = t;
  const steps = [];
  while (cur.some((x) => x.k === "o")) {
    const ids = allowedOps(cur);
    if (!ids.length) return { ok: false, steps, final: null };
    const i = ids[0];
    const { a, o, b } = operandsAt(cur, i);
    const v = apply(o, a, b);
    if (v === null || v > cap) return { ok: false, steps, final: null };
    steps.push({ a, o, b, v });
    cur = reduceAt(cur, i, v);
  }
  return { ok: cur.length === 1, steps, final: cur[0]?.v ?? null };
}

export const toText = (t) =>
  t.map((x) => (x.k === "n" ? x.v : x.k === "o" ? ` ${GLYPH[x.v]} ` : x.k)).join("");
