// Statistics worked solutions with one flawed step: the mean of a list with repeats, the median of an even list, and
// the total of a frequency table. They back the Grade 6 skills centerSpread (mean, median) and dataDisplays, which used
// to borrow the order-of-operations chain. Contract: see mistake-templates.js.
import { int, near, pick } from "./mistake-kit.js";

const sum = (list) => list.reduce((a, b) => a + b, 0);

// Mean: a list in which some values repeat. The flaw divides the total by the number of DIFFERENT values.
function meanDistinct(rng) {
  for (let tries = 0; tries < 800; tries += 1) {
    const n = int(rng, 4, 6);
    const d = int(rng, 2, n - 1);
    const kinds = new Set();
    while (kinds.size < d) kinds.add(int(rng, 2, 20));
    const base = [...kinds];
    const values = [...base, ...Array.from({ length: n - d }, () => pick(rng, base))].sort((a, b) => a - b);
    const total = sum(values);
    if (total % n !== 0 || total % d !== 0) continue;
    const [mean, flawedValue] = [total / n, total / d];
    const head = values[0] + values[1];
    const tail = total - head;
    const wrong = [
      [String(mean + 1), mean + 1],
      [String(mean - 1), mean - 1],
      [String(total), total],
      [String(total / (n - 1)), total / (n - 1)],
    ];
    return {
      start: `(${values.join(" + ")}) ÷ ${n}`,
      mode: "expr",
      steps: [`(${head} + ${tail}) ÷ ${n}`, `(${head} + ${tail}) ÷ ${d}`, String(flawedValue)],
      bad: 1,
      slip: "mean-distinct",
      decoys: ["mean-total", "mean-middle"],
      fix: `${total} ÷ ${n}`,
      near: near(wrong, mean, flawedValue),
      answer: String(mean),
      meta: { kind: "mean", values },
    };
  }
  throw new Error("meanDistinct: no list");
}

// Median of an even-sized list: the two middle values are added and then divided by 2. The flaw stops after adding.
function medianMiddles(rng) {
  const a = int(rng, 3, 15);
  const b = a + 2 * int(rng, 1, 6);
  const [total, median] = [a + b, (a + b) / 2];
  return {
    start: `(${a} + ${b}) ÷ 2`,
    mode: "expr",
    steps: [`${total} ÷ 2`, String(total), String(total)],
    bad: 1,
    slip: "median-no-divide",
    decoys: ["median-lower", "mean-total"],
    fix: String(median),
    near: near(
      [
        [String(a), a],
        [String(b), b],
        [String(median + 1), median + 1],
        [String(median - 1), median - 1],
      ],
      median,
      total,
    ),
    answer: String(median),
    meta: { kind: "median", a, b },
  };
}

// Frequency table: the total of the counts. The flaw leaves the last count out of the sum.
function tallyTotal(rng) {
  const n = int(rng, 4, 5);
  const counts = Array.from({ length: n }, () => int(rng, 1, 9));
  const total = sum(counts);
  const head = counts[0] + counts[1];
  const rest = counts.slice(2);
  const tail = sum(rest);
  const flawedTail = sum(rest.slice(0, -1));
  const flawedValue = head + flawedTail;
  const group = (list) => (list.length > 1 ? `(${list.join(" + ")})` : String(list[0]));
  return {
    start: counts.join(" + "),
    mode: "expr",
    steps: [`(${counts[0]} + ${counts[1]}) + ${group(rest)}`, `${head} + ${flawedTail}`, String(flawedValue)],
    bad: 1,
    slip: "tally-left-out",
    decoys: ["tally-rows", "tally-twice"],
    fix: `${head} + ${tail}`,
    near: near(
      [
        [`${head} + ${tail + 1}`, total + 1],
        [`${head + 1} + ${tail}`, total + 1],
        [`${head} + ${tail * 2}`, head + tail * 2],
        [`${head * 2} + ${tail}`, head * 2 + tail],
        [`${head} + ${tail - 1}`, total - 1],
      ],
      total,
      flawedValue,
    ),
    answer: String(total),
    meta: { kind: "tally", counts },
  };
}

export const DATA = {
  meanDistinct: { family: "whole", run: meanDistinct },
  medianMiddles: { family: "whole", run: medianMiddles },
  tallyTotal: { family: "whole", run: tallyTotal },
};
