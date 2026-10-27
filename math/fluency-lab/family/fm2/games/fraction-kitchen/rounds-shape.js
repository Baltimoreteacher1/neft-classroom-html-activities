// Round generators for the shape (pizza / bar) tasks. Pure functions of (level, rng, grade); every fraction is an
// exact { n, d } object so a round is plain JSON. @fm2 FM-053 FM-060 FM-061
import { int, pick, sample } from "../../rng.js";
import { cmp, frac, gcd, mul } from "../../rational.js";
import { FOOD_IDS } from "./copy.js";
import { GRID, MAX_PARTS } from "./model.js";

const clamp = (g, lo, hi) => Math.min(hi, Math.max(lo, g));
const baseOf = (rng, wholes = 1) => {
  const shape = pick(rng, ["circle", "bar"]);
  return { shape, food: pick(rng, FOOD_IDS[shape]), wholes };
};
const reduced = (rng, b, lo = 1, hi = b - 1) => {
  const options = [];
  for (let a = lo; a <= hi; a += 1) if (gcd(a, b) === 1) options.push(a);
  return pick(rng, options);
};

const FAIR = {
  0: [
    [[2], [1]],
    [[2, 4], [1]],
    [[4], [2, 3]],
  ],
  1: [
    [[2, 4], [1]],
    [
      [2, 4],
      [1, 2],
    ],
    [[4], [2, 3]],
  ],
  2: [
    [[2, 3, 4], [1]],
    [
      [3, 4],
      [1, 2],
    ],
    [
      [3, 4],
      [2, 3],
    ],
  ],
};

export function fairShares(level, rng, grade) {
  const [friendsList, serves] = FAIR[clamp(grade, 0, 2)][level - 1];
  const friends = pick(rng, friendsList);
  const serveCount = pick(
    rng,
    serves.filter((m) => m < friends),
  );
  return { kind: "fair", ...baseOf(rng), friends, serveCount, target: frac(serveCount, friends) };
}

const FIX = {
  0: [
    [[2], 0],
    [[2], 1],
    [[4], 0],
  ],
  1: [
    [[2], 0],
    [[2, 3], 1],
    [[4], 1],
  ],
  2: [
    [[2, 3, 4], 0],
    [[2, 3], 1],
    [[3, 4], 1],
  ],
};

export function fixCuts(level, rng, grade) {
  const [friendsList, extra] = FIX[clamp(grade, 0, 2)][level - 1];
  const friends = pick(rng, friendsList);
  const pieces = friends + extra;
  let positions;
  let even;
  do {
    positions = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], pieces - 1).sort((a, b) => a - b);
    const gaps = positions
      .map((p, i) => p - (positions[i - 1] ?? 0))
      .concat(GRID - positions.at(-1));
    even = gaps.every((g) => g === gaps[0]);
  } while (pieces === friends && even);
  return {
    kind: "fix",
    ...baseOf(rng),
    friends,
    startCuts: positions.map((p) => frac(p, GRID)),
    share: frac(1, friends),
  };
}

const SERVE = {
  1: [[2, 4], [2, 4], [4]],
  2: [
    [2, 3, 4],
    [2, 3, 4],
    [3, 4],
  ],
  3: [
    [2, 3, 4, 6, 8],
    [2, 3, 4, 6, 8],
    [3, 4, 6, 8],
  ],
};

export function serveParts(level, rng, grade) {
  const b = pick(rng, SERVE[clamp(grade, 1, 3)][level - 1]);
  const a = level === 1 ? 1 : level === 2 ? int(rng, 1, b - 1) : int(rng, 2, b - 1);
  return {
    kind: "serve",
    ...baseOf(rng),
    ask: [a, b],
    target: frac(a, b),
    den: level === 3 ? b : null,
  };
}

const multiples = (b) =>
  Array.from({ length: Math.floor(MAX_PARTS / b) - 1 }, (_, i) => (i + 2) * b);

export function pizzaEquiv(level, rng, grade) {
  let a;
  let b;
  if (grade < 4) {
    [a, b] =
      level === 3
        ? pick(rng, [
            [2, 3],
            [3, 4],
            [5, 6],
            [1, 6],
          ])
        : pick(rng, [
            [1, 2],
            [1, 3],
            [2, 3],
            [1, 4],
            [3, 4],
          ]);
  } else if (level < 3) {
    b = pick(rng, [2, 3, 4, 5, 6]);
    a = reduced(rng, b);
  } else {
    b = pick(rng, [2, 3, 4]);
    a = reduced(rng, b, b + 1, 2 * b - 1);
  }
  const ref = frac(a, b);
  const wholes = a > b ? 2 : 1;
  return {
    kind: "equiv",
    ...baseOf(rng, wholes),
    ref,
    den: level === 1 ? null : pick(rng, multiples(b)),
  };
}

// Every (parts, served) pair that satisfies a compare round, found by brute force (used to prove it is solvable).
export function compareSolutions(round) {
  const out = [];
  for (let n = 1; n <= MAX_PARTS; n += 1) {
    for (let k = 1; k <= n; k += 1) {
      if (round.den && n !== round.den) continue;
      if (round.num && k !== round.num) continue;
      const order = cmp(frac(k, n), round.ref);
      if ((round.relation === "more" && order > 0) || (round.relation === "less" && order < 0))
        out.push([n, k]);
    }
  }
  return out;
}

export function comparePieces(level, rng, grade) {
  const high = grade >= 4;
  for (;;) {
    const relation = pick(rng, ["more", "less"]);
    let b;
    let a;
    let d = null;
    if (level === 1) {
      b = int(rng, high ? 6 : 3, high ? 12 : 8);
      a = int(rng, relation === "less" ? 2 : 1, b - 1);
    } else if (level === 2) {
      b = int(rng, high ? 5 : 3, high ? 11 : 8);
      a = int(rng, 1, Math.min(3, b - 1));
    } else {
      b = high ? int(rng, 3, 8) : pick(rng, [2, 3, 4]);
      a = int(rng, 1, b - 1);
      d = high ? int(rng, 2, 12) : pick(rng, [2, 3, 4, 6, 8]);
      if (d === b) continue;
    }
    const mode = level === 1 ? "sameDen" : level === 2 ? "sameNum" : "den";
    const round = {
      kind: "compare",
      ...baseOf(rng),
      ref: frac(a, b),
      refAsk: [a, b],
      relation,
      mode,
      den: mode === "sameDen" ? b : mode === "den" ? d : null,
      num: mode === "sameNum" ? a : null,
    };
    if (compareSolutions(round).length > 0) return round;
  }
}

// Can the leftover region [0, base] be cut so a piece boundary falls on base and the answer is a whole number of
// pieces? Some n <= 12 must be a multiple of both denominators.
const roomFor = (base, target) =>
  Array.from({ length: MAX_PARTS }, (_, i) => i + 1).some(
    (n) => n % base.d === 0 && n % target.d === 0,
  );

export function partOfPart(level, rng) {
  for (;;) {
    const f2 =
      level === 1
        ? frac(1, 2)
        : level === 2
          ? frac(1, pick(rng, [2, 3, 4]))
          : pick(rng, [frac(2, 3), frac(3, 4)]);
    const b1 = pick(rng, level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 6] : [3, 4, 6]);
    const base = frac(level === 3 ? reduced(rng, b1, 2) : reduced(rng, b1), b1);
    const target = mul(base, f2);
    if (roomFor(base, target))
      return { kind: "area", op: "of", ...baseOf(rng), base, factor: f2, target };
  }
}

export function shareLeftover(level, rng) {
  const pairs =
    level === 1
      ? [
          [2, 2],
          [3, 2],
          [4, 2],
        ]
      : level === 2
        ? [
            [2, 2],
            [3, 2],
            [4, 2],
            [5, 2],
            [6, 2],
            [2, 3],
            [3, 3],
            [4, 3],
          ]
        : [
            [3, 4],
            [4, 3],
            [6, 2],
            [2, 5],
            [2, 6],
            [5, 2],
            [3, 3],
            [2, 4],
          ];
  const [b, friends] = pick(rng, pairs);
  return {
    kind: "area",
    op: "share",
    ...baseOf(rng),
    base: frac(1, b),
    factor: frac(1, friends),
    friends,
    target: frac(1, b * friends),
  };
}
