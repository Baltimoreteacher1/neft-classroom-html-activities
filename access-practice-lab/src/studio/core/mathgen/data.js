// Statistics: mean, median, mode and range of small data sets. Every prompt lists the data after a colon, so the
// tests can recompute the answer from the prompt alone.

import { R, choice, dec, errorItem, number, order } from "./kit.js";

const INTROS = [
  "Ana's quiz scores are",
  "The number of books Omar read each month is",
  "The points a team scored in each game are",
  "The number of pets in each family on a street is",
  "The minutes Lena practiced each day are",
  "The number of goals a player scored each week is",
];

const RANGE = [null, [1, 20], [20, 100], [10, 150]];
const sum = (a) => a.reduce((x, y) => x + y, 0);
const sortUp = (a) => [...a].sort((x, y) => x - y);
const median = (a) => {
  const s = sortUp(a);
  const m = s.length >> 1;
  return s.length % 2 ? R(s[m]) : R(s[m - 1] + s[m], 2);
};
const tryDec = (r) => {
  try {
    return dec(r);
  } catch {
    return null;
  }
};
/** n values whose mean is a terminating decimal. */
const goodCount = (rng, level) =>
  level === 1 ? rng.int(4, 8) : rng.pick(level === 2 ? [4, 5, 8] : [4, 5, 8, 10]);

function randomData(rng, level, n) {
  const [lo, hi] = RANGE[level];
  for (;;) {
    const v = Array.from({ length: n }, () => rng.int(lo, hi));
    if (new Set(v).size >= 3) return v;
  }
}

/** n values with a whole-number mean. */
function wholeMeanData(rng, level, n) {
  const [lo, hi] = RANGE[level];
  const spread = Math.max(3, Math.floor((hi - lo) / 4));
  for (let i = 0; i < 200; i++) {
    const m = rng.int(lo + spread, hi - spread);
    const off = Array.from({ length: n - 1 }, () => rng.int(-spread, spread));
    off.push(-sum(off));
    const v = off.map((o) => m + o);
    if (v.every((x) => x >= lo && x <= hi) && new Set(v).size >= 3) return v;
  }
  throw new Error("mathgen: no data");
}

/** Data with exactly one mode (a value that appears more often than any other). */
function modeData(rng, level) {
  const [lo, hi] = RANGE[level];
  for (;;) {
    const n = rng.int(6, 9);
    const mode = rng.int(lo, hi);
    const times = rng.int(2, 3);
    const v = Array(times).fill(mode);
    while (v.length < n) {
      const x = rng.int(lo, hi);
      if (!v.includes(x)) v.push(x);
    }
    if (new Set(v).size === n - times + 1) return { v: rng.shuffle(v), mode };
  }
}

const show = (v) => v.join(", ");
const list = (rng, v) => rng.shuffle(v);

const meanWork = (v) =>
  `Add: ${v.join(" + ")} = ${sum(v)}. Count: ${v.length} numbers. Divide: ${sum(v)} ÷ ${v.length} = ${dec(R(sum(v), v.length))}.`;

const medianWork = (v) => {
  const s = sortUp(v);
  const m = s.length >> 1;
  return s.length % 2
    ? `Put the numbers in order: ${show(s)}. The middle number is ${s[m]}.`
    : `Put the numbers in order: ${show(s)}. The two middle numbers are ${s[m - 1]} and ${s[m]}. (${s[m - 1]} + ${s[m]}) ÷ 2 = ${dec(median(v))}.`;
};

const meanData = (rng, level) => {
  const n = goodCount(rng, level);
  return level === 1 ? wholeMeanData(rng, level, n) : randomData(rng, level, n);
};

const statistics = [
  {
    id: "mean",
    make({ rng, level }) {
      const v = meanData(rng, level);
      return number({
        prompt: `${rng.pick(INTROS)}: ${show(list(rng, v))}. What is the mean?`,
        answer: dec(R(sum(v), v.length)),
        expr: `(${v.join("+")})/${v.length}`,
        hint: "The mean is the sum of the numbers divided by how many numbers there are.",
        explanation: meanWork(v),
        misconception: `Dividing by the wrong count, or finding the middle number (${dec(median(v))}) instead of the mean.`,
      });
    },
  },
  {
    id: "median",
    make({ rng, level }) {
      const n = level === 1 ? rng.pick([5, 7]) : rng.int(5, 9);
      const v = randomData(rng, level, n);
      const m = median(v);
      const s = sortUp(v);
      const mid = s.length >> 1;
      return number({
        prompt: `${rng.pick(INTROS)}: ${show(list(rng, v))}. What is the median?`,
        answer: dec(m),
        expr: s.length % 2 ? String(s[mid]) : `(${s[mid - 1]}+${s[mid]})/2`,
        hint: "Put the numbers in order from least to greatest first. Then find the middle.",
        explanation: medianWork(v),
        misconception: `Taking the middle of the list without putting it in order (${v[v.length >> 1]}).`,
      });
    },
  },
  {
    id: "mode",
    make({ rng, level }) {
      const { v, mode } = modeData(rng, level);
      return number({
        prompt: `${rng.pick(INTROS)}: ${show(v)}. What is the mode?`,
        answer: String(mode),
        expr: String(mode),
        hint: "The mode is the number that appears most often.",
        explanation: `${mode} appears ${v.filter((x) => x === mode).length} times, more than any other number. The mode is ${mode}.`,
        misconception: `Giving the mean (${tryDec(R(sum(v), v.length)) ?? "a fraction"}) or the greatest number instead of the number that repeats.`,
      });
    },
  },
  {
    id: "range",
    make({ rng, level }) {
      const v = randomData(rng, level, rng.int(5, 8));
      const hi = Math.max(...v);
      const lo = Math.min(...v);
      return number({
        prompt: `${rng.pick(INTROS)}: ${show(list(rng, v))}. What is the range?`,
        answer: String(hi - lo),
        expr: `${hi}-${lo}`,
        hint: "The range is the greatest number minus the least number.",
        explanation: `Greatest = ${hi}, least = ${lo}. ${hi} − ${lo} = ${hi - lo}. The range is ${hi - lo}.`,
        misconception: `Adding the greatest and least numbers (${hi + lo}) or giving the greatest number.`,
      });
    },
  },
  {
    id: "missing-value",
    levels: [2, 3],
    make({ rng, level }) {
      const n = rng.int(4, 6);
      const mean = rng.int(8, level === 3 ? 60 : 30);
      const parts = Array.from({ length: n - 1 }, () => Math.max(1, mean + rng.int(-6, 6)));
      const x = n * mean - sum(parts);
      if (x < 1 || parts.includes(x)) return null;
      return number({
        prompt: `The mean of ${n} numbers is ${mean}. ${n - 1} of the numbers are ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}. What is the other number?`,
        answer: String(x),
        expr: `${n}*${mean}-(${parts.join("+")})`,
        hint: "Find the total of all the numbers first. Then subtract the numbers you know.",
        explanation: `${n} × ${mean} = ${n * mean}. ${parts.join(" + ")} = ${sum(parts)}. ${n * mean} − ${sum(parts)} = ${x}.`,
        misconception: `Subtracting the mean from the sum of the known numbers instead of finding the total first.`,
      });
    },
  },
  {
    id: "choose",
    make({ rng, level }) {
      const median_ = rng.chance();
      const v = median_
        ? randomData(rng, level, level === 1 ? rng.pick([5, 7]) : rng.int(5, 9))
        : meanData(rng, level);
      const s = sortUp(v);
      const mid = s.length >> 1;
      const mean = R(sum(v), v.length);
      const med = median(v);
      const answer = median_ ? med : mean;
      const wrong = [];
      const add = (r, why) => {
        const t = r && tryDec(r);
        if (t !== null && t !== undefined) wrong.push({ text: t, why });
      };
      if (median_) {
        add(mean, "That is the mean, not the median.");
        add(R(v[v.length >> 1]), "Taking the middle of the list before putting it in order.");
        add(R(Math.max(...v) - Math.min(...v)), "That is the range.");
        add(R(Math.max(...v)), "That is the greatest number.");
        if (s.length % 2 === 0) {
          add(R(s[mid]), "Using only the larger of the two middle numbers.");
          add(R(s[mid - 1]), "Using only the smaller of the two middle numbers.");
        }
      } else {
        add(med, "That is the median, not the mean.");
        add(R(sum(v)), "That is the sum. The sum must be divided by how many numbers there are.");
        add(R(Math.max(...v) - Math.min(...v)), "That is the range.");
        add(R(sum(v), v.length + 1), "Dividing by one more than the number of values.");
        add(R(sum(v), v.length - 1), "Dividing by one less than the number of values.");
      }
      return choice(rng, {
        prompt: `${rng.pick(INTROS)}: ${show(list(rng, v))}. What is the ${median_ ? "median" : "mean"}?`,
        answer: dec(answer),
        expr: median_
          ? s.length % 2
            ? String(s[mid])
            : `(${s[mid - 1]}+${s[mid]})/2`
          : `(${v.join("+")})/${v.length}`,
        wrong,
        hint: median_
          ? "Put the numbers in order first."
          : "Add the numbers. Then divide by how many there are.",
        explanation: median_ ? medianWork(v) : meanWork(v),
        misconception: "Students mix up mean, median, mode and range.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, level }) {
      const v = meanData(rng, level);
      const n = v.length;
      const total = sum(v);
      const mean = dec(R(total, n));
      const kind = rng.pick(["slip", "count", "forgot"]);
      const slip = rng.pick([1, -1, 2, -2, 10]);
      const slipMean = tryDec(R(total + slip, n));
      const countMean = tryDec(R(total, n + 1));
      if ((kind === "slip" && !slipMean) || (kind === "count" && !countMean)) return null;
      const steps = [`Add, then divide: (${v.join(" + ")}) ÷ ${n}`];
      if (kind === "slip") steps.push(`Add: ${total + slip} ÷ ${n}`, `Divide: ${slipMean}`);
      else if (kind === "count") steps.push(`Add: ${total} ÷ ${n + 1}`, `Divide: ${countMean}`);
      else steps.push(`Add: ${total}`, `The mean is: ${total}`);
      return errorItem(rng, {
        prompt: `Sam finds the mean of ${show(v)}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: 1,
        expr: `(${v.join("+")})/${n}`,
        fixRight: `Add the numbers, then divide by how many there are: ${total} ÷ ${n} = ${mean}.`,
        fixWrong: [
          ...(countMean
            ? [
                {
                  text: `Divide by one more: ${total} ÷ ${n + 1} = ${countMean}.`,
                  why: "Dividing by the wrong count.",
                },
              ]
            : []),
          { text: `Add only: ${v.join(" + ")} = ${total}.`, why: "Forgetting to divide." },
          {
            text: `Use the middle number: the median = ${dec(median(v))}.`,
            why: "Finding the median instead of the mean.",
          },
          {
            text: `Subtract: ${Math.max(...v)} − ${Math.min(...v)} = ${Math.max(...v) - Math.min(...v)}.`,
            why: "Finding the range instead of the mean.",
          },
        ],
        hint: "The mean is the sum divided by how many numbers there are.",
        explanation: meanWork(v),
        misconception:
          kind === "slip"
            ? "An addition slip when finding the sum."
            : kind === "count"
              ? "Dividing by the wrong count."
              : "Forgetting to divide the sum.",
      });
    },
  },
  {
    id: "steps",
    make({ rng, level }) {
      const v = meanData(rng, level);
      const n = v.length;
      const s = sortUp(v);
      if (rng.chance()) {
        return order({
          prompt: `Put the steps in order to find the mean of ${show(v)}.`,
          items: [
            `Add all the numbers: ${v.join(" + ")} = ${sum(v)}`,
            `Count the numbers: there are ${n}`,
            `Divide the sum by the count: ${sum(v)} ÷ ${n} = ${dec(R(sum(v), n))}`,
          ],
          hint: "You need the sum and the count before you divide.",
          explanation: meanWork(v),
          misconception: "Dividing before finding the sum.",
        });
      }
      return order({
        prompt: `Put the steps in order to find the median of ${show(v)}.`,
        items: [
          `Put the numbers in order: ${show(s)}`,
          `Find the middle: ${n % 2 ? `the middle number is ${s[n >> 1]}` : `the middle numbers are ${s[(n >> 1) - 1]} and ${s[n >> 1]}`}`,
          `Write the median: ${dec(median(v))}`,
        ],
        hint: "Put the numbers in order before you look for the middle.",
        explanation: medianWork(v),
        misconception: "Finding the middle before putting the numbers in order.",
      });
    },
  },
];

export const DATA_TEMPLATES = { "mean-median-mode-range": statistics };
