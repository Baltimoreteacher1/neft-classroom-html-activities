// ONE plan for multiplying past the basic facts, read by the area model (studio/engine-area.js) and by the written
// steps (problem-bank item.steps via multiplySteps), so the rectangle and the words split the same factor into the
// same parts in the same order.
//   A basic fact with zeros (600 × 3, 40 × 30): the basic fact, then the zeros.
//   Otherwise: split the factor with more places by place value (348 = 300 + 40 + 8), keep the other whole,
//   multiply each part, add the parts.
const fmt = (n) => Number(n).toLocaleString("en-US");
export const placeParts = (n) => {
  const s = String(n);
  return [...s].map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean);
};

export function multiplyPlan(a, b) {
  const total = a * b;
  const zA = String(a).match(/0*$/)[0].length;
  const zB = String(b).match(/0*$/)[0].length;
  const [basicA, basicB] = [a / 10 ** zA, b / 10 ** zB];
  if (zA + zB > 0 && basicA <= 12 && basicB <= 12 && Math.max(a, b) > 12)
    return { kind: "zeros", a, b, basicA, basicB, zeros: zA + zB, fact: basicA * basicB, total };
  const splitA = placeParts(a).length >= placeParts(b).length;
  const parts = placeParts(splitA ? a : b);
  const other = splitA ? b : a;
  return { kind: "place", a, b, splitA, parts, other, products: parts.map((p) => p * other), total };
}

export function planMultiplySteps(plan) {
  if (plan.kind === "zeros")
    return [
      `Basic fact first: ${plan.basicA} × ${plan.basicB} = ${plan.fact}.`,
      `${fmt(plan.a)} × ${fmt(plan.b)} has ${plan.zeros} zero${plan.zeros === 1 ? "" : "s"} in all. Write them after ${plan.fact}: ${fmt(plan.total)}.`,
    ];
  const split = plan.splitA ? plan.a : plan.b;
  return [
    `Split ${fmt(split)} by place value: ${plan.parts.map(fmt).join(" + ")}. Keep ${fmt(plan.other)} whole.`,
    // Two parts are two steps; three or more share one step, so the walk stays at four steps or fewer.
    ...(plan.parts.length > 2
      ? [`Multiply each part: ${plan.parts.map((p, i) => `${fmt(p)} × ${fmt(plan.other)} = ${fmt(plan.products[i])}`).join("; ")}.`]
      : plan.parts.map((p, i) => `${fmt(p)} × ${fmt(plan.other)} = ${fmt(plan.products[i])}`)),
    `Add the parts: ${plan.products.map(fmt).join(" + ")} = ${fmt(plan.total)}`,
  ];
}

// "a × b = ?" with whole numbers past the basic facts (as the area model draws them), else null.
export function multiplySteps(item) {
  const q = String(item?.question || "").replaceAll(",", "");
  const d = q.match(/^(\d+) ÷ (\d+) = \?$/);
  if (d) {
    const [n, k] = [Number(d[1]), Number(d[2])];
    // A skill that teaches this as long division keeps its long-division steps (the lab draws the bracket).
    if (item.model?.type === "longDivision") return null;
    return k > 0 && k <= 12 && n > 0 && n % k === 0 && n / k <= 12 ? divideFactSteps(n, k) : null;
  }
  const m = q.match(/^(\d+) × (\d+) = \?$/);
  if (!m) return null;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (!a || !b || String(a).length > 4 || String(b).length > 4) return null;
  if (Math.max(a, b) <= 12) return factSteps(a, b);
  const plan = multiplyPlan(a, b);
  return plan.kind === "place" && plan.parts.length < 2 ? null : planMultiplySteps(plan);
}

// Basic facts as the array draws them: a rows of b. Columns of 6 or more break into 5 (or 10, for 11 and 12) and the
// rest; 5 or fewer are counted by b, one row at a time. Division facts are counted the same way, one row of d at a time.
export const factSplit = (b) => (b >= 11 ? 10 : b >= 6 && b !== 10 ? 5 : 0);
export const countBy = (step, times) => Array.from({ length: times }, (_, i) => step * (i + 1));

export function factSteps(a, b) {
  const total = a * b;
  if (b === 10)
    return [
      `${a} rows of 10. Count the tens: ${a} × 1 ten = ${a} tens.`,
      `Times 10, the ${a} moves one place left, into the tens.`,
      `${a} tens = ${total}`,
    ];
  const sp = factSplit(b);
  if (!sp) return [`${a} rows of ${b}.`, `Count by ${b}s, one row at a time: ${countBy(b, a).join(", ")}.`];
  const [p1, p2] = [a * sp, a * (b - sp)];
  return [`${a} rows of ${b}. Break ${b} into ${sp} and ${b - sp}.`, `${a} × ${sp} = ${p1}`, `${a} × ${b - sp} = ${p2}`, `Add the parts: ${p1} + ${p2} = ${total}`];
}
export const divideFactSteps = (n, d) => [
  `Think: ${n} ÷ ${d} = ? means ${d} × ? = ${n}.`,
  `Count by ${d}s until you reach ${n}, one row of ${d} at a time: ${countBy(d, n / d).join(", ")}.`,
  `Count the rows: ${n / d} rows of ${d} make ${n}, so ${n} ÷ ${d} = ${n / d}.`,
];
