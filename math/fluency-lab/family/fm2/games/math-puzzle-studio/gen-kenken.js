// KenKen-lite (grades 4-5) and two-number factor puzzles (grades 4-5). A KenKen board is a Latin square of the digits
// 1..n cut into cages that each carry an operation and a target; the round is kept only when the depth-first solver
// finds exactly one filling. @fm2 FM-017 FM-051 FM-060
import { cageValue, solveAll } from "./rules.js";
import {
  cmpRule,
  int,
  makePool,
  numberPool,
  openCell,
  pick,
  placeRound,
  shuffle,
  T,
  given,
} from "./gen-kit.js";

const SIZES = { 4: [3, 4, 4], 5: [4, 4, 5] };
const WEIGHTS = [
  [1, 2, 2, 2, 3],
  [1, 2, 2, 3, 3],
  [1, 2, 2, 3, 4],
];

function latin(rng, n) {
  const rows = shuffle(rng, [...Array(n).keys()]);
  const cols = shuffle(rng, [...Array(n).keys()]);
  const sym = shuffle(rng, [...Array(n).keys()]);
  return rows.flatMap((r) => cols.map((c) => sym[(r + c) % n] + 1));
}

function partition(rng, n, level) {
  const owner = Array(n * n).fill(-1);
  const cages = [];
  const neighbors = (i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    return [r > 0 && i - n, r < n - 1 && i + n, c > 0 && i - 1, c < n - 1 && i + 1].filter(
      (x) => x !== false,
    );
  };
  const weights = WEIGHTS[level - 1];
  for (const start of shuffle(rng, [...owner.keys()])) {
    if (owner[start] >= 0) continue;
    const cells = [start];
    owner[start] = cages.length;
    const size = pick(rng, weights);
    while (cells.length < size) {
      const options = cells.flatMap(neighbors).filter((x) => owner[x] < 0);
      if (!options.length) break;
      const next = pick(rng, options);
      owner[next] = cages.length;
      cells.push(next);
    }
    cages.push({ cells: cells.sort((a, b) => a - b) });
  }
  return cages;
}

// Choose an operation and target for a cage over the solved values.
function dress(rng, cage, full, level) {
  const v = cage.cells.map((i) => full[i]);
  const options = ["+", "×"];
  if (cage.cells.length === 2) {
    const [hi, lo] = v[0] >= v[1] ? [v[0], v[1]] : [v[1], v[0]];
    if (level >= 2 && hi !== lo) options.push("−");
    if (level >= 3 && hi !== lo && hi % lo === 0) options.push("÷", "÷");
  }
  const op = pick(rng, options);
  return { ...cage, op, to: cageValue({ op, cells: cage.cells }, full).n };
}

export const cageLabel = (cage) => `${cage.to}${cage.op}`;

export function kenken(level, rng, grade) {
  const n = SIZES[grade === 4 ? 4 : 5][level - 1];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const full = latin(rng, n);
    const parts = partition(rng, n, level);
    const singles = parts.filter((c) => c.cells.length === 1).map((c) => c.cells[0]);
    const cages = parts.filter((c) => c.cells.length > 1).map((c) => dress(rng, c, full, level));
    const givens = new Set(singles);
    for (let guard = 0; guard <= n * n; guard += 1) {
      const round = placeRound(rng, {
        level,
        layout: "cage",
        n,
        reuse: true,
        cages,
        cells: full.map((v, i) => (givens.has(i) ? given(v) : openCell())),
        pool: makePool(Array.from({ length: n }, (_, i) => ({ v: i + 1 }))),
        rules: [
          ...Array.from({ length: n }, (_, r) => ({
            k: "distinct",
            line: "row",
            cells: Array.from({ length: n }, (_, c) => r * n + c),
          })),
          ...Array.from({ length: n }, (_, c) => ({
            k: "distinct",
            line: "col",
            cells: Array.from({ length: n }, (_, r) => r * n + c),
          })),
          ...cages.map((cage) => ({ k: "cage", ...cage })),
        ],
        prompt: T(
          `Fill the grid with the numbers 1 to ${n}. No number repeats in any row or column. Each cage must reach its target using its operation.`,
          `Llena la cuadrícula con los números del 1 al ${n}. Ningún número se repite en una fila ni en una columna. Cada jaula debe llegar a su meta con su operación.`,
        ),
      });
      const { solutions } = solveAll(round, 2);
      if (solutions.length === 1) {
        round.solution = solutions[0];
        return round;
      }
      if (attempt < 20) break; // try a fresh board before handing out extra givens
      const hidden = [...Array(n * n).keys()].filter((i) => !givens.has(i));
      givens.add(pick(rng, hidden));
    }
  }
  throw new Error("could not build a unique KenKen");
}

// ---- factor puzzle: two numbers from a product and a sum (or a difference) -----------------------------------
export function factorPairs(level, rng, grade) {
  const top = grade === 4 ? [9, 12, 12][level - 1] : [12, 15, 20][level - 1];
  const difference = level === 3;
  const a = int(rng, 2, top - 1);
  const b = difference ? a + int(rng, 1, 4) : int(rng, a + 1, top);
  if (b > top) return factorPairs(level, rng, grade);
  const product = a * b;
  const sum = a + b;
  const rules = [{ k: "prod", cells: [0, 1], to: product }];
  rules.push(
    difference
      ? cmpRule([{ c: 0 }, { v: b - a }], [{ c: 1 }])
      : cmpRule([{ c: 0 }, { c: 1 }], [{ v: sum }]),
  );
  const prompt = difference
    ? T(
        `Place two numbers that multiply to ${product}. The second number is ${b - a} more than the first.`,
        `Coloca dos números que al multiplicarse den ${product}. El segundo número es ${b - a} más que el primero.`,
      )
    : T(
        `Place two numbers that multiply to ${product} and add up to ${sum}.`,
        `Coloca dos números que al multiplicarse den ${product} y al sumarse den ${sum}.`,
      );
  const pool = numberPool(rng, {
    include: [a, b],
    named: [
      [a + 1, "off-one"],
      [b + 1, "off-one"],
      [a - 1, "off-one"],
      [b - 1, "off-one"],
    ],
    lo: 1,
    hi: top,
    size: 8,
  });
  return placeRound(rng, {
    level,
    layout: "pairs",
    reuse: true,
    product,
    sum: difference ? null : sum,
    gap: difference ? b - a : null,
    cells: [openCell(), openCell()],
    pool,
    rules,
    prompt,
  });
}
