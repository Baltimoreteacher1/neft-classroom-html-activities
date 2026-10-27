// Rounds for grades 2 to 4 that fill a grid from hidden numbers: sum grids, magic triangles, magic squares and
// factor (multiplication) grids. Each round is solved by the depth-first solver before it is returned, and is kept
// only if exactly one arrangement works, so "unique solution" is a fact about the round, not a hope.
// @fm2 FM-017 FM-051 FM-060
import { solveAll } from "./rules.js";
import {
  cmpRule,
  given,
  int,
  makePool,
  openCell,
  pick,
  placeRound,
  sample,
  shuffle,
  T,
} from "./gen-kit.js";

// Build a place round from full cell values, hiding the cells in `open`; the pool is the hidden values plus
// `extra` decoys. Returns the round only when the board has exactly one solution.
export function hide(rng, base, full, open, decoys) {
  const hidden = open.map((i) => full[i]);
  const values = [...hidden, ...decoys].sort((a, b) => a - b);
  const round = placeRound(rng, {
    ...base,
    cells: full.map((v, i) => (open.includes(i) ? openCell() : given(v))),
    pool: makePool(values.map((v) => ({ v }))),
  });
  const { solutions } = solveAll(round, 2);
  if (solutions.length !== 1) return null;
  round.solution = solutions[0];
  return round;
}

// Decoy numbers near the hidden ones that are not themselves hidden values.
export function decoysFor(rng, hidden, count, lo, hi, spread = 3) {
  const out = [];
  for (const v of shuffle(rng, hidden)) {
    if (out.length >= count) break;
    const options = shuffle(rng, [-spread, -2, -1, 1, 2, spread])
      .map((d) => v + d)
      .filter((x) => x >= lo && x <= hi && !hidden.includes(x) && !out.includes(x));
    if (options.length) out.push(options[0]);
  }
  return out;
}

// For boards where every number is different: a decoy that repeats a number already on the board (a trap, never a solution).
function withRepeat(rng, decoys, full, open, level) {
  const shown = full.filter((_, i) => !open.includes(i));
  if (level < 2 || !shown.length || !decoys.length) return decoys;
  return [pick(rng, shown), ...decoys.slice(1)];
}

function retry(tries, make) {
  for (let i = 0; i < tries; i += 1) {
    const round = make(i);
    if (round) return round;
  }
  throw new Error("could not build a unique puzzle");
}

// ---- sum grid: rows and columns add up to the numbers around the edge ----------------------------------------
export function gridSums(level, rng, grade) {
  const n = level === 1 ? 2 : 3;
  const hi = grade === 2 ? 30 : 250;
  const lo = grade === 2 ? 1 : 10;
  const want = level === 1 ? 2 : level === 2 ? 4 : grade === 2 ? 5 : 6;
  return retry(200, (attempt) => {
    const k = attempt > 80 ? Math.max(2, want - 1) : want;
    const full = Array.from({ length: n * n }, () => int(rng, lo, hi));
    const rowSums = Array.from({ length: n }, (_, r) =>
      full.slice(r * n, r * n + n).reduce((a, b) => a + b, 0),
    );
    const colSums = Array.from({ length: n }, (_, c) =>
      full.filter((_, i) => i % n === c).reduce((a, b) => a + b, 0),
    );
    const open = sample(rng, [...full.keys()], k).sort((a, b) => a - b);
    const hidden = open.map((i) => full[i]);
    const rules = [
      ...rowSums.map((s, r) =>
        cmpRule(
          Array.from({ length: n }, (_, c) => ({ c: r * n + c })),
          [{ v: s }],
        ),
      ),
      ...colSums.map((s, c) =>
        cmpRule(
          Array.from({ length: n }, (_, r) => ({ c: r * n + c })),
          [{ v: s }],
        ),
      ),
    ];
    const decoyCount = level === 3 ? 2 : 1;
    return hide(
      rng,
      {
        level,
        layout: "grid",
        n,
        rowSums,
        colSums,
        rules,
        prompt: T(
          "Fill the empty squares so every row and every column adds up to the number shown at its end.",
          "Llena los cuadros vacíos para que cada fila y cada columna sume el número que aparece en su extremo.",
        ),
      },
      full,
      open,
      decoysFor(rng, hidden, decoyCount, lo, hi),
    );
  });
}

// ---- magic triangle: the three numbers on every side add to the same total -----------------------------------
// Nodes: 0 top, 1 bottom-left, 2 bottom-right, 3 left side, 4 bottom side, 5 right side.
export const TRIANGLE_SIDES = [
  [0, 3, 1],
  [1, 4, 2],
  [0, 5, 2],
];

export function magicTriangle(level, rng, grade) {
  const top = grade === 2 ? 9 : 20;
  const want = [3, 4, 5][level - 1] + (grade >= 3 && level === 3 ? 1 : 0);
  return retry(400, (attempt) => {
    const [a, b, c] = sample(
      rng,
      Array.from({ length: top }, (_, i) => i + 1),
      3,
    );
    const S = int(rng, Math.max(a, b, c) + 3, Math.min(top * 2 + 3, a + b + c + 3));
    const mids = [S - a - b, S - c - a, S - b - c];
    const full = [a, b, c, mids[0], mids[2], mids[1]];
    if (full.some((v) => v < 1 || v > top) || new Set(full).size !== 6) return null;
    const open = sample(rng, [0, 1, 2, 3, 4, 5], Math.max(3, want - Math.floor(attempt / 40))).sort((x, y) => x - y);
    const hidden = open.map((i) => full[i]);
    return hide(
      rng,
      {
        level,
        layout: "triangle",
        target: S,
        rules: [
          ...TRIANGLE_SIDES.map((side) =>
            cmpRule(
              side.map((i) => ({ c: i })),
              [{ v: S }],
            ),
          ),
          { k: "distinct", cells: [0, 1, 2, 3, 4, 5] },
        ],
        prompt: T(
          `Place the missing numbers so the three numbers on every side of the triangle add up to ${S}. Each number is used once.`,
          `Coloca los números que faltan para que los tres números de cada lado del triángulo sumen ${S}. Cada número se usa una sola vez.`,
        ),
      },
      full,
      open,
      withRepeat(rng, decoysFor(rng, hidden, level === 3 ? 2 : 1, 1, top), full, open, level),
    );
  });
}

// ---- magic square: every row, column and diagonal adds to the magic sum -------------------------------------
const LO_SHU = [2, 7, 6, 9, 5, 1, 4, 3, 8];
const TURN = [6, 3, 0, 7, 4, 1, 8, 5, 2];
function lines3() {
  return [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
}
export const MAGIC_LINES = lines3();

export function magicSquare(level, rng, grade) {
  let base = LO_SHU;
  for (let i = int(rng, 0, 3); i > 0; i -= 1) base = TURN.map((from) => base[from]);
  if (rng() < 0.5) base = [2, 1, 0, 5, 4, 3, 8, 7, 6].map((from) => base[from]);
  const scale = grade === 3 ? int(rng, 1, level === 3 ? 3 : 2) : int(rng, 1, level === 1 ? 3 : 5);
  const shift = grade === 3 ? int(rng, 0, level === 1 ? 0 : 5) : int(rng, 0, 12);
  const full = base.map((v) => v * scale + shift);
  const S = 15 * scale + 3 * shift;
  const want = [3, 5, 6][level - 1];
  return retry(300, (attempt) => {
    const open = sample(rng, [...full.keys()], Math.max(3, want - Math.floor(attempt / 40))).sort((x, y) => x - y);
    const hidden = open.map((i) => full[i]);
    const top = Math.max(...full) + scale;
    return hide(
      rng,
      {
        level,
        layout: "magic",
        target: S,
        rules: [
          ...MAGIC_LINES.map((line) =>
            cmpRule(
              line.map((i) => ({ c: i })),
              [{ v: S }],
            ),
          ),
          { k: "distinct", cells: [...full.keys()] },
        ],
        prompt: T(
          `Place the missing numbers so every row, column and diagonal adds up to ${S}. Each number is used once.`,
          `Coloca los números que faltan para que cada fila, columna y diagonal sume ${S}. Cada número se usa una sola vez.`,
        ),
      },
      full,
      open,
      withRepeat(rng, decoysFor(rng, hidden, level === 3 ? 2 : 1, Math.max(1, shift + scale - 1), top, 2 * scale), full, open, level),
    );
  });
}

// ---- factor grid: row factor x column factor = the product in the square -------------------------------------
// Cells: column factors first, then row factors, then the products row by row.
export const factorIndex = (rows, cols) => ({
  col: (c) => c,
  row: (r) => cols + r,
  prod: (r, c) => cols + rows + r * cols + c,
});

export function factorGrid(level, rng, grade) {
  const rows = level === 1 ? 2 : 3;
  const cols = rows;
  const maxFactor = grade === 3 ? (level === 3 ? 10 : 9) : level === 1 ? 9 : 12;
  const want = [4, 6, 7][level - 1];
  const at = factorIndex(rows, cols);
  return retry(400, () => {
    const factors = sample(
      rng,
      Array.from({ length: maxFactor - 1 }, (_, i) => i + 2),
      rows + cols,
    );
    const colF = factors.slice(0, cols);
    const rowF = factors.slice(cols);
    const full = [...colF, ...rowF];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) full.push(rowF[r] * colF[c]);
    const headers = [...Array(rows + cols).keys()];
    const products = [...Array(rows * cols).keys()].map((i) => rows + cols + i);
    // at least one missing factor and one missing product, as the skill is about both
    const open = [
      ...sample(rng, headers, 1 + (level === 3 ? 1 : 0)),
      ...sample(rng, products, want - 1 - (level === 3 ? 1 : 0)),
    ].sort((x, y) => x - y);
    const hidden = open.map((i) => full[i]);
    const rules = [];
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1)
        rules.push({ k: "mul", a: at.row(r), b: at.col(c), c: at.prod(r, c) });
    return hide(
      rng,
      {
        level,
        layout: "factor",
        rows,
        cols,
        rules,
        prompt: T(
          "Fill the empty squares. Each square inside the grid is its row factor times its column factor. Each number is used once.",
          "Llena los cuadros vacíos. Cada cuadro dentro de la cuadrícula es el factor de su fila por el factor de su columna. Cada número se usa una sola vez.",
        ),
      },
      full,
      open,
      decoysFor(rng, hidden, level === 3 ? 2 : 1, 2, 12 * 12, 4),
    );
  });
}
