// Pure geometry for Array Architect: everything is measured from the cells a learner placed, never from the
// numbers a generator wrote down. @fm2 FM-050 FM-059 FM-060
export const cellKey = (r, c) => `${r},${c}`;

// Distinct cells from [[r, c, v?], ...]; bad entries are dropped so a damaged response cannot crash a check.
export function uniqueCells(list) {
  const seen = new Map();
  for (const cell of Array.isArray(list) ? list : []) {
    if (!Array.isArray(cell) || !Number.isInteger(cell[0]) || !Number.isInteger(cell[1])) continue;
    if (cell[0] < 0 || cell[1] < 0 || cell[0] > 400 || cell[1] > 400) continue;
    const v = Number.isInteger(cell[2]) && cell[2] > 0 ? cell[2] : 1;
    seen.set(cellKey(cell[0], cell[1]), [cell[0], cell[1], v]);
  }
  return [...seen.values()];
}

// Area, perimeter (open cell edges), bounding rows/columns and whether the cells are one solid rectangle.
export function measure(list) {
  const cells = uniqueCells(list);
  if (!cells.length) return { area: 0, perimeter: 0, rows: 0, cols: 0, rect: false, cells };
  const set = new Set(cells.map(([r, c]) => cellKey(r, c)));
  let perimeter = 0;
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const [r, c] of cells) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (!set.has(cellKey(r + dr, c + dc))) perimeter += 1;
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  return { area: cells.length, perimeter, rows, cols, rect: rows * cols === cells.length, cells };
}

export const rectCells = (rows, cols) => {
  const out = [];
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) out.push([r, c]);
  return out;
};

// Group cells by their value (the colour/tool they were painted with).
export function classesOf(list) {
  const groups = new Map();
  for (const cell of uniqueCells(list)) {
    if (!groups.has(cell[2])) groups.set(cell[2], []);
    groups.get(cell[2]).push(cell);
  }
  return groups;
}

export const sameCells = (a, b) => {
  const left = new Set(uniqueCells(a).map(([r, c]) => cellKey(r, c)));
  const right = new Set(uniqueCells(b).map(([r, c]) => cellKey(r, c)));
  return left.size === right.size && [...left].every((k) => right.has(k));
};

export function factorPairs(n) {
  const out = [];
  for (let a = 1; a * a <= n; a += 1) if (n % a === 0) out.push([a, n / a]);
  return out;
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const times = (a, b) => `${a} × ${b}`;
