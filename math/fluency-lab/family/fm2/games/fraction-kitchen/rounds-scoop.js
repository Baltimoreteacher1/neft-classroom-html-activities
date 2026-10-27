// Round generators for the scoop, serving and place-value tasks. Pure functions of (level, rng, grade); fractions are
// exact { n, d } objects. @fm2 FM-053 FM-054 FM-060 FM-061
import { int, pick, sample, shuffle } from "../../rng.js";
import { add, cmp, frac, lcm, mul, sub, toNumber } from "../../rational.js";
import { INGREDIENTS } from "./copy.js";
import { MAX_SCOOPS, decimalParts, sciValue } from "./model.js";
import { clamp, descending, ingredient, reducedNumerator, unit } from "./rounds-util.js";

// ---- scoops and pitchers --------------------------------------------------------------------------------------

const capFor = (target) => Math.ceil(toNumber(target)) + 1;

export function mixedScoops(level, rng, grade) {
  const high = grade >= 5;
  const topWhole = high ? 3 : 2;
  const singles = high ? [3, 5, 6, 8, 10, 12] : [2, 3, 4, 5, 6, 8];
  const pairs = high
    ? [
        [3, 6],
        [5, 10],
        [4, 8],
        [6, 12],
        [2, 6],
        [3, 12],
        [2, 8],
      ]
    : [
        [2, 4],
        [3, 6],
        [4, 8],
        [2, 8],
      ];
  for (;;) {
    let sizes;
    let small;
    if (level === 1) {
      small = pick(rng, singles);
      sizes = [small];
    } else {
      const [big, little] = pick(rng, pairs);
      small = little;
      sizes =
        level === 3 && big * 2 === little && rng() < 0.5
          ? [big, little, little * 2 <= 12 ? little * 2 : little]
          : [big, little];
      if (new Set(sizes).size < sizes.length) sizes = [big, little];
    }
    const k = int(rng, small + 1, topWhole * small - 1);
    if (k % small === 0 || k > MAX_SCOOPS) continue;
    const target = frac(k, small);
    return {
      kind: "fill",
      op: "mixed",
      target,
      hidden: false,
      scoops: descending([...new Set(sizes)].map(unit)),
      single: false,
      minKinds: level === 3 ? 2 : 1,
      cap: capFor(target),
      ingredient: ingredient(rng),
    };
  }
}

export function batchRecipe(level, rng, grade) {
  const high = grade >= 5;
  for (;;) {
    const b = pick(rng, high ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6, 8, 10]);
    const batches = level === 1 ? int(rng, 2, 4) : level === 2 ? int(rng, 2, 5) : int(rng, 3, 8);
    const whole = high && level >= 2 ? (level === 3 ? int(rng, 1, 2) : 1) : 0;
    const amount = frac(whole * b + reducedNumerator(rng, b), b);
    const target = mul(frac(batches), amount);
    if (level === 1 && amount.n * batches > MAX_SCOOPS) continue;
    if (toNumber(target) > 12) continue;
    const scoops = level === 1 ? [unit(b)] : [frac(1), unit(b)];
    return {
      kind: "fill",
      op: "batch",
      batches,
      amount,
      target,
      hidden: true,
      scoops: descending(scoops),
      single: false,
      minKinds: 1,
      cap: capFor(target),
      ingredient: ingredient(rng),
    };
  }
}

const UNLIKE_PAIRS = {
  1: [
    [2, 3],
    [2, 4],
    [3, 6],
    [2, 6],
  ],
  2: [
    [3, 4],
    [4, 6],
    [2, 5],
    [5, 10],
    [2, 8],
    [4, 8],
    [3, 12],
    [2, 12],
  ],
  3: [
    [3, 4],
    [4, 6],
    [2, 3],
    [3, 6],
    [2, 4],
    [4, 12],
  ],
};
export const UNIT_SCOOPS = descending([2, 3, 4, 5, 6, 8, 10, 12].map(unit));

export function unlikeBars(level, rng, grade) {
  for (;;) {
    let terms;
    let op = "sum";
    let denominators;
    if (grade <= 4) {
      const b = pick(rng, [3, 4, 5, 6, 8, 10, 12]);
      denominators = [b, b];
      const a = int(rng, 1, b - 1);
      const c = int(rng, 1, b - 1);
      terms = [frac(a, b), frac(c, b)];
      if (level === 3)
        terms =
          rng() < 0.5 ? [frac(b + a, b), frac(c, b)] : [...terms, frac(int(rng, 1, b - 1), b)];
    } else {
      denominators = pick(rng, UNLIKE_PAIRS[level]);
      terms = denominators.map((d) => frac(reducedNumerator(rng, d), d));
      if (level === 3 && rng() < 0.5)
        terms = [frac(denominators[0] + terms[0].n, denominators[0]), terms[1]];
      else if (level === 3) terms = [...terms, frac(1, pick(rng, [2, 3, 4, 6]))];
    }
    if (level >= 2 && terms.length === 2 && rng() < 0.45 && cmp(terms[0], terms[1]) !== 0) {
      op = "diff";
      if (cmp(terms[0], terms[1]) < 0) terms = [terms[1], terms[0]];
    }
    const target =
      op === "diff" ? sub(terms[0], terms[1]) : terms.reduce((s, t) => add(s, t), frac(0));
    const common = terms.reduce((m, t) => lcm(m, t.d), 1);
    if (
      !UNIT_SCOOPS.some((s) => s.d % common === 0) ||
      toNumber(target) > 3 ||
      target.n * (UNIT_SCOOPS.find((s) => s.d % common === 0).d / target.d) > MAX_SCOOPS
    )
      continue;
    const ingredients = sample(rng, INGREDIENTS, terms.length);
    return {
      kind: "fill",
      op,
      terms,
      target,
      hidden: true,
      scoops: UNIT_SCOOPS,
      single: true,
      minKinds: 1,
      cap: capFor(target),
      ingredients,
    };
  }
}

export function wholeByUnit(level, rng) {
  for (;;) {
    const b = pick(rng, level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 5] : [3, 4, 5, 6]);
    const w = int(rng, level === 1 ? 1 : 2, level === 3 ? 4 : 3);
    if (w * b > 12) continue;
    const amount = frac(w);
    return {
      kind: "serving",
      amount,
      size: unit(b),
      hidden: false,
      cap: w + 1,
      ingredient: ingredient(rng),
    };
  }
}

export function divideFractions(level, rng) {
  for (;;) {
    const d = pick(
      rng,
      level === 1 ? [2, 3, 4] : level === 2 ? [3, 4, 5, 6, 8] : [5, 6, 8, 10, 12],
    );
    const c = level === 1 ? (rng() < 0.5 ? 1 : d - 1) : reducedNumerator(rng, d, 2, d - 1);
    const size = frac(c, d);
    const k = int(rng, level === 1 ? 2 : 3, level === 1 ? 6 : level === 2 ? 8 : 12);
    const amount = mul(frac(k), size);
    if (toNumber(amount) > 6 || toNumber(amount) <= 1 || (amount.d === 1 && level === 3)) continue;
    return {
      kind: "serving",
      amount,
      size,
      hidden: false,
      cap: Math.ceil(toNumber(amount)) + 1,
      ingredient: ingredient(rng),
    };
  }
}

// ---- place-value scoops ------------------------------------------------------------------------------------------

const PLACE_PLANS = {
  4: [
    { places: [1], ones: 0 },
    { places: [1, 2], ones: 0 },
    { places: [0, 1, 2], ones: 2 },
  ],
  5: [
    { places: [1, 2], ones: 0 },
    { places: [1, 2, 3], ones: 0 },
    { places: [0, 1, 2, 3], ones: 2 },
  ],
};

export function tenthsCup(level, rng, grade) {
  const plan = PLACE_PLANS[clamp(grade, 4, 5)][level - 1];
  const digits = [0, 0, 0, 0];
  if (plan.ones) digits[0] = int(rng, 1, plan.ones);
  plan.places
    .filter((p) => p !== 0)
    .forEach((p, i, all) => {
      digits[p] = int(rng, i === all.length - 1 ? 1 : 0, 9);
    });
  if (plan.places.length === 1) digits[1] = int(rng, 1, 9);
  const target = digits.reduce((s, d, i) => add(s, frac(d, 10 ** i)), frac(0));
  const show =
    level === 1 && grade === 4
      ? "frac"
      : level === 2 && grade === 4 && rng() < 0.5
        ? "frac"
        : "dec";
  return {
    kind: "place",
    mode: "dec",
    places: plan.places,
    target,
    show,
    cap: plan.ones ? 3 : 1,
    ingredient: ingredient(rng),
  };
}

const REPEATING = {
  1: [
    [1, 3],
    [2, 3],
    [1, 9],
    [2, 9],
    [4, 9],
    [5, 9],
    [7, 9],
    [8, 9],
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
  ],
  2: [
    [1, 6],
    [5, 6],
    [1, 11],
    [2, 11],
    [5, 12],
    [7, 12],
    [11, 12],
    [1, 12],
    [3, 20],
    [7, 20],
    [9, 25],
    [11, 40],
    [2, 15],
    [4, 15],
  ],
  3: [
    [4, 11],
    [5, 11],
    [6, 11],
    [7, 11],
    [1, 33],
    [7, 33],
    [7, 30],
    [11, 30],
    [13, 30],
    [8, 15],
    [11, 15],
    [9, 40],
    [17, 50],
    [21, 25],
    [7, 45],
    [5, 36],
  ],
};

const repeatValue = (lead, block) => {
  const L = lead.length;
  const B = block.length;
  const whole = Number(`${lead}${block}`) - (lead ? Number(lead) : 0);
  return frac(whole, 10 ** L * (10 ** B - 1));
};

export function repeatingDecimals(level, rng) {
  const [n, d] = pick(rng, REPEATING[level]);
  const target = frac(n, d);
  const { lead, rep } = decimalParts(target);
  const real = rep || lead;
  const options = new Set([real]);
  const tries = [
    lead.slice(-1) + real,
    `${real}${real}`.slice(0, real.length + 1),
    real.length > 1 ? real[0] : `${(Number(real) + 1) % 10}`,
    real.length > 1 ? real.split("").reverse().join("") : "7",
    ((Number(real.slice(-1)) + 4) % 10) + real.slice(0, -1),
  ];
  for (const wrong of tries) {
    if (options.size >= 3) break;
    if (!wrong || options.has(wrong) || wrong.length > 4) continue;
    if (rep && cmp(repeatValue(lead, wrong), frac(n, d)) === 0) continue;
    options.add(wrong);
  }
  return {
    kind: "place",
    mode: "repeat",
    places: [1, 2, 3],
    target,
    cap: 1,
    blocks: shuffle(rng, [...options]),
    ingredient: ingredient(rng),
  };
}

export function sciMeasures(level, rng) {
  const digit = () => int(rng, 1, 9);
  let terms;
  if (level === 1) terms = [{ m: String(digit()), e: -int(rng, 1, 3) }];
  else if (level === 2) terms = [{ m: `${digit()}.${digit()}`, e: -int(rng, 1, 2) }];
  else {
    const e1 = pick(rng, [0, -1]);
    const e2 = int(rng, -3, e1 - 2);
    const m2 =
      e2 === -3 ? String(digit()) : rng() < 0.5 ? String(digit()) : `${digit()}.${digit()}`;
    terms = [
      { m: String(digit()), e: e1 },
      { m: m2, e: m2.includes(".") ? Math.max(e2, -2) : e2 },
    ];
  }
  const target = terms.reduce((sum, term) => add(sum, sciValue(term)), frac(0));
  return {
    kind: "place",
    mode: "sci",
    places: [0, 1, 2, 3],
    terms,
    target,
    cap: Math.ceil(toNumber(target)) + 1,
    ingredient: ingredient(rng),
  };
}
