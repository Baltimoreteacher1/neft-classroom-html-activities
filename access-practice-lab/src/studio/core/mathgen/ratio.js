// Ratio topics: equivalent ratios, unit rate, percent. Every template builds prompt, key and explanation from the same
// variables, and the kit builders re-check the key against its expression before a block leaves this file.

import { NAMES, R, choice, dec, errorItem, fillTable, fixed, gcd, number } from "./kit.js";

const SETUPS = [
  { setup: "A recipe uses", A: "cups of rice", B: "cups of water" },
  { setup: "A bracelet has", A: "red beads", B: "blue beads" },
  { setup: "A paint mix uses", A: "cans of blue paint", B: "cans of white paint" },
  { setup: "A drink mix has", A: "cups of juice", B: "cups of soda" },
  { setup: "A class trip has", A: "teachers", B: "students" },
];

/** A ratio a:b in lowest terms with both terms at least 2, plus a scale factor k. */
function ratioNumbers(rng, level) {
  const top = [0, 5, 8, 9][level];
  for (;;) {
    const a = rng.int(2, top);
    const b = rng.int(2, top);
    if (a !== b && gcd(a, b) === 1) return { a, b, k: rng.int(2, [0, 5, 9, 12][level]) };
  }
}

const equivalentRatios = [
  {
    id: "scale-up",
    make({ rng, level }) {
      const { a, b, k } = ratioNumbers(rng, level);
      const s = rng.pick(SETUPS);
      const x = a * k;
      return number({
        prompt: `${s.setup} ${a} ${s.A} and ${b} ${s.B}. The ratio stays the same. How many ${s.B} go with ${x} ${s.A}?`,
        answer: String(b * k),
        expr: `${b}/${a}*${x}`,
        hint: "Find how many times bigger the first amount is. Make the second amount that many times bigger.",
        explanation: `${x} ÷ ${a} = ${k}, so the amounts are ${k} times bigger. ${b} × ${k} = ${b * k}.`,
        misconception: `Adding ${x - a} to both amounts (${b} + ${x - a} = ${b + x - a}) instead of multiplying both by ${k}.`,
      });
    },
  },
  {
    id: "scale-down",
    make({ rng, level }) {
      if (level < 2) return null;
      const { a, b, k } = ratioNumbers(rng, level);
      const s = rng.pick(SETUPS);
      return number({
        prompt: `${s.setup} ${a * k} ${s.A} and ${b * k} ${s.B}. The ratio stays the same. How many ${s.B} go with ${a} ${s.A}?`,
        answer: String(b),
        expr: `${b * k}/${a * k}*${a}`,
        hint: "Divide both amounts by the same number to make the smaller ratio.",
        explanation: `${a * k} ÷ ${k} = ${a}, so divide ${b * k} by ${k} too. ${b * k} ÷ ${k} = ${b}.`,
        misconception: `Subtracting ${a * k - a} from both amounts (${b * k} − ${a * k - a} = ${b * k - a * k + a}) instead of dividing both by ${k}.`,
      });
    },
  },
  {
    id: "ratio-table",
    make({ rng, level }) {
      const { a, b } = ratioNumbers(rng, level);
      const s = rng.pick(SETUPS);
      const ms = rng
        .sample([2, 3, 4, 5, 6, 7, 8, 10].slice(0, level === 1 ? 5 : 8), 3)
        .sort((x, y) => x - y);
      const rows = [[String(a), String(b)]];
      const exprs = {};
      ms.forEach((m, i) => {
        const r = i + 1;
        const blankSecond = rng.chance();
        rows.push(
          blankSecond
            ? [String(a * m), { answer: String(b * m) }]
            : [{ answer: String(a * m) }, String(b * m)],
        );
        exprs[`${r}:${blankSecond ? 1 : 0}`] = blankSecond
          ? `r0c1/r0c0*r${r}c0`
          : `r0c0/r0c1*r${r}c1`;
      });
      return fillTable({
        prompt: `${a} ${s.A} go with ${b} ${s.B}. Complete the ratio table. Every row has the same ratio.`,
        headers: [s.A, s.B],
        rows,
        exprs,
        hint: "Find what the first row is multiplied by to make each row.",
        explanation: `Multiply both numbers in the first row by the same factor. For example, ${a} × ${ms[0]} = ${a * ms[0]} and ${b} × ${ms[0]} = ${b * ms[0]}.`,
        misconception:
          "Adding the same number to both columns instead of multiplying both by the same factor.",
      });
    },
  },
  {
    id: "which-equivalent",
    make({ rng, level }) {
      const { a, b, k } = ratioNumbers(rng, level);
      const n = rng.int(2, 5);
      const ra = `${a * k}:${b * k}`;
      return choice(rng, {
        prompt: `Which ratio is equivalent to ${a}:${b}?`,
        answer: ra,
        expr: `${a * k}/${b * k}`,
        wrong: [
          {
            text: `${a + n}:${b + n}`,
            why: `Adding ${n} to both terms (${a + n}:${b + n}) does not keep the ratio.`,
          },
          {
            text: `${b * k}:${a * k}`,
            why: "Writing the terms in the wrong order flips the ratio.",
          },
          { text: `${a * k}:${b + k}`, why: "Multiplying one term but adding to the other." },
          { text: `${a * k}:${b * k + 1}`, why: "A small slip in one term breaks the ratio." },
          {
            text: `${a + k}:${b + k}`,
            why: `Adding ${k} to both terms instead of multiplying by ${k}.`,
          },
        ],
        hint: "Multiply both terms by the same number.",
        explanation: `${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}. So ${a}:${b} is equivalent to ${ra}.`,
        misconception: "Students add instead of multiply.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, level }) {
      const { a, b, k } = ratioNumbers(rng, level);
      const x = a * k;
      const right = b * k;
      const slip = rng.pick([1, 2, -1, -2]);
      const variant = rng.pick(["add", "slip"]);
      if (variant === "add" && b + k === right) return null;
      const steps = [
        `Set up: n = ${b} × (${x} ÷ ${a})`,
        `Find the factor first: n = ${b} × ${k}`,
        `Multiply: n = ${right}`,
      ];
      if (variant === "add") {
        steps[1] = `Add the factor: n = ${b} + ${k}`;
        steps[2] = `Add: n = ${b + k}`;
      } else {
        steps[2] = `Multiply: n = ${right + slip}`;
      }
      return errorItem(rng, {
        prompt: `Omar solves ${a}:${b} = ${x}:n. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: variant === "add" ? 1 : 2,
        expr: `${b}*${x}/${a}`,
        fixRight: `Multiply by the factor: n = ${b} × ${k} = ${right}.`,
        fixWrong: [
          {
            text: `Add the factor: ${b} + ${k} = ${b + k}.`,
            why: "Adding the factor instead of multiplying.",
          },
          {
            text: `Use the factor as the answer: ${x} ÷ ${a} = ${k}.`,
            why: "Stopping at the scale factor.",
          },
          {
            text: `Add the difference: ${b} + ${x - a} = ${b + x - a}.`,
            why: "Using the difference of the first terms.",
          },
        ],
        hint: "Check each step. Does the ratio stay the same?",
        explanation: `The ratio grows by multiplying. ${x} ÷ ${a} = ${k}, so n = ${b} × ${k} = ${right}.`,
        misconception:
          variant === "add"
            ? "Adding the scale factor instead of multiplying by it."
            : "A multiplication slip in the last step.",
      });
    },
  },
];

// ── unit rate ───────────────────────────────────────────────────────────────

const ITEMS = [
  { pl: "notebooks", sg: "notebook" },
  { pl: "pens", sg: "pen" },
  { pl: "apples", sg: "apple" },
  { pl: "bottles of juice", sg: "bottle of juice" },
  { pl: "movie tickets", sg: "movie ticket" },
  { pl: "bags of rice", sg: "bag of rice" },
];

/** A price in cents: whole dollars at level 1, quarters at level 2, any 5 cents at level 3. */
const priceCents = (rng, level) =>
  level === 1 ? rng.int(2, 9) * 100 : level === 2 ? rng.int(8, 40) * 25 : rng.int(30, 250) * 5;
const money = (cents) => fixed(R(cents, 100), 2);

const tenths = (x) => dec(R(Math.round(x * 10), 10));

const unitRate = [
  {
    id: "unit-price",
    make({ rng, level }) {
      const it = rng.pick(ITEMS);
      const n = rng.int(3, level === 3 ? 12 : 8);
      const cents = priceCents(rng, level);
      const total = money(cents * n);
      return number({
        prompt: `${rng.pick(NAMES)} buys ${n} ${it.pl} for $${total}. Each one costs the same. What is the cost of 1 ${it.sg} in dollars?`,
        answer: money(cents),
        expr: `${total}/${n}`,
        hint: "A unit rate is the amount for 1. Divide the total cost by the number of items.",
        explanation: `$${total} ÷ ${n} = $${money(cents)}. One ${it.sg} costs $${money(cents)}.`,
        misconception: `Dividing the number of items by the cost (${n} ÷ ${total}) instead of cost ÷ number.`,
      });
    },
  },
  {
    id: "speed",
    make({ rng, level }) {
      const who = rng.pick(["A cyclist rides", "A bus travels", "A runner jogs", "A boat sails"]);
      const t = level === 3 ? rng.pick([2.5, 3.5, 4.5]) : rng.int(2, 6);
      const v = rng.int(level === 1 ? 4 : 8, level === 1 ? 20 : 60);
      const d = v * t;
      return number({
        prompt: `${who} ${tenths(d)} miles in ${t} hours at a steady speed. How many miles does it go in 1 hour?`,
        answer: String(v),
        expr: `${tenths(d)}/${t}`,
        hint: "Divide the distance by the time to find the distance for 1 hour.",
        explanation: `${tenths(d)} ÷ ${t} = ${v}. The speed is ${v} miles per hour.`,
        misconception: `Dividing the time by the distance (${t} ÷ ${tenths(d)}) or multiplying the two numbers.`,
        unit: "",
      });
    },
  },
  {
    id: "use-the-rate",
    make({ rng, level }) {
      const q = level === 3 ? rng.int(2, 9) + 0.5 : rng.int(2, 9);
      const t = level === 3 ? rng.pick([2, 4, 6]) : rng.int(2, 6);
      const d = q * t;
      const m = rng.int(t + 1, level === 1 ? 10 : 15);
      const per = dec(R(Math.round(q * 10), 10));
      const total = dec(R(Math.round(q * m * 10), 10));
      return number({
        prompt: `${rng.pick(NAMES)} reads ${d} pages in ${t} minutes. The pace stays the same. How many pages does this reader read in ${m} minutes?`,
        answer: total,
        expr: `${d}/${t}*${m}`,
        hint: "First find the pages for 1 minute. Then multiply by the number of minutes.",
        explanation: `${d} ÷ ${t} = ${per} pages in 1 minute. ${per} × ${m} = ${total}.`,
        misconception: `Adding ${m - t} to ${d} (${d + m - t}) instead of using the rate.`,
      });
    },
  },
  {
    id: "better-buy",
    make({ rng, level }) {
      const it = rng.pick(ITEMS);
      const lowCents = rng.int(level === 1 ? 4 : 6, level === 3 ? 60 : 40) * 5;
      const gap = rng.pick([10, 15, 20, 25, 30]);
      const nA = rng.int(2, 8);
      const nB = rng.int(2, 8);
      if (nA === nB) return null;
      const aCheaper = rng.chance();
      const cA = aCheaper ? lowCents : lowCents + gap;
      const cB = aCheaper ? lowCents + gap : lowCents;
      const totA = cA * nA;
      const totB = cB * nB;
      const best = Math.min(cA, cB);
      const bestTotal = Math.min(totA, totB);
      const bestN = aCheaper ? nA : nB;
      const wrong = [
        { text: `$${money(Math.max(cA, cB))}`, why: "That is the higher price per item." },
        { text: `$${money(bestTotal)}`, why: "That is the lower total, not the price of 1 item." },
        {
          text: `$${money(Math.abs(cA - cB))}`,
          why: "That is the difference between the two prices.",
        },
        {
          text: `$${money(Math.round((cA + cB) / 2))}`,
          why: "Averaging the two prices does not find the lower unit price.",
        },
      ];
      return choice(rng, {
        prompt: `Brand A: ${nA} ${it.pl} cost $${money(totA)}. Brand B: ${nB} ${it.pl} cost $${money(totB)}. What is the lower price for 1 ${it.sg}?`,
        answer: `$${money(best)}`,
        expr: `${money(bestTotal)}/${bestN}`,
        wrong,
        hint: "Find the price of 1 item for each brand. Then compare.",
        explanation: `Brand A: ${money(totA)} ÷ ${nA} = ${money(cA)}. Brand B: ${money(totB)} ÷ ${nB} = ${money(cB)}. The lower price is $${money(best)}.`,
        misconception: "Comparing total costs instead of the price for 1 item.",
      });
    },
  },
  {
    id: "rate-table",
    make({ rng, level }) {
      const it = rng.pick(ITEMS);
      const cents = priceCents(rng, level);
      const [n0, n2, n3] = rng.sample([2, 3, 4, 5, 6, 8, 10, 12], 3);
      const rows = [
        [String(n0), money(cents * n0)],
        ["1", { answer: money(cents) }],
        [String(n2), { answer: money(cents * n2) }],
        [{ answer: String(n3) }, money(cents * n3)],
      ];
      return fillTable({
        prompt: `${n0} ${it.pl} cost $${money(cents * n0)}. Each one costs the same. Complete the table.`,
        headers: [`Number of ${it.pl}`, "Cost ($)"],
        rows,
        exprs: { "1:1": "r0c1/r0c0*r1c0", "2:1": "r0c1/r0c0*r2c0", "3:0": "r0c0/r0c1*r3c1" },
        hint: "Find the cost of 1 first. Then use it for every row.",
        explanation: `$${money(cents * n0)} ÷ ${n0} = $${money(cents)} for 1. Then ${money(cents)} × ${n2} = ${money(cents * n2)}, and ${money(cents * n3)} ÷ ${money(cents)} = ${n3}.`,
        misconception: "Adding the same amount to each row instead of using the cost of 1.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng }) {
      const small = [2, 4, 5, 8, 10, 20, 25];
      const n = rng.pick(small);
      const y = rng.pick(small);
      if (n === y) return null;
      const it = rng.pick(ITEMS);
      const truth = dec(R(y, n));
      const flip = rng.chance();
      const bad = flip ? dec(R(n, y)) : String(y * n);
      return errorItem(rng, {
        prompt: `Ana says ${n} ${it.pl} cost $${y}. She finds the cost p of 1 ${it.sg}. One step has a mistake. Find it.`,
        steps: [
          flip ? `Set up: p = ${n} ÷ ${y}` : `Set up: p = ${y} × ${n}`,
          `Calculate: p = ${bad}`,
        ],
        errorIndex: 0,
        expr: `${y}/${n}`,
        fixRight: `Divide the cost by the number: ${y} ÷ ${n} = ${truth}.`,
        fixWrong: [
          {
            text: `Divide the number by the cost: ${n} ÷ ${y} = ${dec(R(n, y))}.`,
            why: "Flipping the division.",
          },
          { text: `Multiply: ${y} × ${n} = ${y * n}.`, why: "Multiplying to find a unit rate." },
          { text: `Add: ${y} + ${n} = ${y + n}.`, why: "Adding the two numbers." },
          { text: `Subtract: ${y} − ${n} = ${y - n}.`, why: "Subtracting the two numbers." },
        ].filter((w) => !w.text.includes("= -")),
        hint: "A unit rate is the cost for 1. What do you divide by what?",
        explanation: `Cost for 1 = total cost ÷ number of items: ${y} ÷ ${n} = ${truth}.`,
        misconception: flip
          ? "Dividing the number of items by the cost."
          : "Multiplying instead of dividing.",
      });
    },
  },
];

// ── percent ─────────────────────────────────────────────────────────────────

const PCTS = [
  null,
  [10, 20, 25, 50, 75],
  [5, 15, 30, 40, 60, 80, 90],
  [12, 35, 45, 65, 85, 24, 36],
];
/** A whole number that p% of is a whole number. */
const wholeFor = (rng, p, lo, hi) => {
  const step = 100 / gcd(p, 100);
  return step * rng.int(Math.ceil(lo / step), Math.floor(hi / step));
};

const percent = [
  {
    id: "percent-of",
    make({ rng, level }) {
      const p = rng.pick(PCTS[level]);
      const N = wholeFor(rng, p, 20, level === 1 ? 200 : 400);
      const res = (p * N) / 100;
      const prompt = rng.pick([
        `A class has ${N} students. ${p}% of them walk to school. How many students walk to school?`,
        `A store has ${N} shirts. ${p}% of the shirts are blue. How many shirts are blue?`,
        `What is ${p}% of ${N}?`,
        `${rng.pick(NAMES)} has $${N}. ${rng.pick(NAMES)} saves ${p}% of it. How many dollars are saved?`,
      ]);
      return number({
        prompt,
        answer: String(res),
        expr: `${p}/100*${N}`,
        hint: "Percent means out of 100. Write the percent as a fraction or decimal, then multiply.",
        explanation: `${p}% = ${p}/100. Multiply: ${p}/100 × ${N} = ${res}.`,
        misconception: `Multiplying ${p} × ${N} = ${p * N} and forgetting to divide by 100.`,
      });
    },
  },
  {
    id: "find-the-whole",
    make({ rng, level }) {
      const p = rng.pick(level === 1 ? [10, 20, 25, 50] : PCTS[level].concat([10, 20, 25]));
      const W = wholeFor(rng, p, 40, level === 1 ? 300 : 600);
      const part = (p * W) / 100;
      const one = dec(R(part, p));
      return number({
        prompt: rng.pick([
          `${part} students are in the band. This is ${p}% of all the students in the school. How many students are in the school?`,
          `${part} is ${p}% of a number. What is the number?`,
        ]),
        answer: String(W),
        expr: `${part}/(${p}/100)`,
        hint: "First find 1%. Then multiply by 100 to find the whole.",
        explanation: `Find 1%: ${part} ÷ ${p} = ${one}. Find 100%: ${one} × 100 = ${W}.`,
        misconception: `Finding ${p}% of ${part} (${dec(R(p * part, 100))}) instead of finding the whole.`,
      });
    },
  },
  {
    id: "percent-as-ratio",
    make({ rng }) {
      const whole = rng.pick([4, 5, 10, 20, 25, 50]);
      const part = rng.int(1, whole - 1);
      const pct = (part * 100) / whole;
      return number({
        prompt: `In a bag, ${part} of the ${whole} marbles are red. What percent of the marbles are red?`,
        answer: String(pct),
        unit: "%",
        expr: `${part}/${whole}*100`,
        hint: "Write the part over the whole. Then find an equal fraction out of 100.",
        explanation: `${part} ÷ ${whole} × 100 = ${pct}. So ${pct}% of the marbles are red.`,
        misconception: `Writing ${part}/${whole} as ${part}%, or dividing ${whole} by ${part}.`,
      });
    },
  },
  {
    id: "sale",
    make({ rng, level }) {
      const p = rng.pick(PCTS[level === 1 ? 1 : 2]);
      const N = wholeFor(rng, p, 20, 300);
      const D = (p * N) / 100;
      const price = rng.chance();
      const right = price ? N - D : D;
      return choice(rng, {
        prompt: price
          ? `A jacket costs $${N}. It is ${p}% off. What is the sale price?`
          : `A jacket costs $${N}. It is ${p}% off. How much money is taken off?`,
        answer: `$${right}`,
        expr: price ? `${N}-${p}/100*${N}` : `${p}/100*${N}`,
        wrong: [
          {
            text: `$${price ? D : N - D}`,
            why: price
              ? "That is the amount taken off, not the sale price."
              : "That is the sale price, not the amount taken off.",
          },
          { text: `$${N + D}`, why: "Adding the discount to the price." },
          { text: `$${p}`, why: "Using the percent as dollars." },
          { text: `$${N - p}`, why: "Subtracting the percent from the price." },
        ],
        hint: price
          ? "Find the amount taken off first. Then subtract."
          : "Find the percent of the price.",
        explanation: price
          ? `${p}/100 × ${N} = ${D} is taken off. ${N} − ${D} = ${N - D}. The sale price is $${N - D}.`
          : `${p}/100 × ${N} = ${D}. So $${D} is taken off.`,
        misconception: "Mixing up the amount taken off and the sale price.",
      });
    },
  },
  {
    id: "percent-table",
    make({ rng }) {
      const W = 20 * rng.int(2, 15);
      const ps = rng.sample([5, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90], 3);
      const rows = [["10%", String(W / 10)]];
      const exprs = {};
      ps.forEach((p, i) => {
        rows.push([`${p}%`, { answer: String((p * W) / 100) }]);
        exprs[`${i + 1}:1`] = `r${i + 1}c0*${W}`;
      });
      return fillTable({
        prompt: `Find each percent of ${W}. Write the amount.`,
        headers: [`Percent of ${W}`, "Amount"],
        rows,
        exprs,
        hint: `10% of ${W} is ${W / 10}. Use it to find the other amounts.`,
        explanation: `Multiply ${W} by each percent. For example, ${ps[0]}/100 × ${W} = ${(ps[0] * W) / 100}.`,
        misconception: "Forgetting to divide the percent by 100.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, level }) {
      const p = rng.pick(PCTS[level === 3 ? 3 : 2]);
      const N = wholeFor(rng, p, 20, 300);
      const res = (p * N) / 100;
      const d = dec(R(p, 100));
      const kind = rng.pick(["tenth", "raw"]);
      const badMult = kind === "tenth" ? R(p, 10) : R(p, 1);
      const bad = dec(badMult);
      const badRes = dec(R(Number(badMult.n) * N, Number(badMult.d)));
      return errorItem(rng, {
        prompt: `Lena finds ${p}% of ${N}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `Set up: a = ${p} ÷ 100 × ${N}`,
          `Change the percent: a = ${bad} × ${N}`,
          `Multiply: a = ${badRes}`,
        ],
        errorIndex: 1,
        expr: `${p}/100*${N}`,
        fixRight: `Write ${p}% as ${d}: ${d} × ${N} = ${res}.`,
        fixWrong: [
          {
            text: `Use ${p} as the decimal: ${p} × ${N} = ${p * N}.`,
            why: "Not dividing the percent by 100.",
          },
          {
            text: `Move the decimal one place: ${dec(R(p, 10))} × ${N} = ${dec(R(p * N, 10))}.`,
            why: "Moving the decimal point only one place.",
          },
          { text: `Add: ${p} + ${N} = ${p + N}.`, why: "Adding the percent and the whole." },
          {
            text: `Subtract: ${N} − ${p} = ${N - p}.`,
            why: "Subtracting the percent from the whole.",
          },
        ],
        hint: "A percent is a number out of 100. Check the decimal in step 2.",
        explanation: `${p}% = ${d}. Multiply: ${d} × ${N} = ${res}.`,
        misconception:
          kind === "tenth"
            ? "Moving the decimal one place instead of two."
            : "Using the percent number without dividing by 100.",
      });
    },
  },
];

export const RATIO_TEMPLATES = {
  "equivalent-ratios": equivalentRatios,
  "unit-rate": unitRate,
  percent,
};
