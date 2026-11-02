// Make 24 rules: exact fractions, a solver that proves every dealt card can be solved, and one-step hints.
// Grades 3-5 only meet whole-number steps (a division must come out even); Grades 6-8 may pass through fractions.
function gcd(a, b) {
  let [x, y] = [Math.abs(a), Math.abs(b)];
  while (y) [x, y] = [y, x % y];
  return x;
}

export const OPS = ["+", "−", "×", "÷"];

export function frac(n, d = 1) {
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d) || 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export const showFrac = (value) => (value.d === 1 ? String(value.n) : `${value.n}/${value.d}`);

// a op b, or null when the move is not allowed (division by zero, or an uneven division in whole-number mode).
export function apply(a, b, op, wholeOnly = false) {
  let out;
  if (op === "+") out = frac(a.n * b.d + b.n * a.d, a.d * b.d);
  else if (op === "−") out = frac(a.n * b.d - b.n * a.d, a.d * b.d);
  else if (op === "×") out = frac(a.n * b.n, a.d * b.d);
  else if (b.n === 0) return null;
  else out = frac(a.n * b.d, a.d * b.n);
  if (wholeOnly && (out.d !== 1 || out.n < 0)) return null;
  return out;
}

const equals = (value, target) => value.d === 1 && value.n === target;

// The first solution found as steps [{ a, b, op, result }] (values as text), or null. `values` are whole numbers or fractions.
export function solve(values, { target = 24, wholeOnly = false } = {}) {
  const search = (tiles, steps) => {
    if (tiles.length === 1) return equals(tiles[0], target) ? steps : null;
    for (let i = 0; i < tiles.length; i += 1) {
      for (let j = 0; j < tiles.length; j += 1) {
        if (i === j) continue;
        for (const op of OPS) {
          if ((op === "+" || op === "×") && j < i) continue;
          const result = apply(tiles[i], tiles[j], op, wholeOnly);
          if (!result) continue;
          const rest = tiles.filter((_, k) => k !== i && k !== j);
          const found = search(
            [...rest, result],
            [
              ...steps,
              { a: showFrac(tiles[i]), b: showFrac(tiles[j]), op, result: showFrac(result) },
            ],
          );
          if (found) return found;
        }
      }
    }
    return null;
  };
  return search(
    values.map((n) => (typeof n === "number" ? frac(n) : n)),
    [],
  );
}

export const stepText = ({ a, b, op, result }) => `${a} ${op} ${b} = ${result}`;

export const rulesFor = (grade) => ({ high: grade <= 5 ? 9 : 13, wholeOnly: grade <= 5 });

const shuffleCard = (values, rng) =>
  values
    .map((v) => [rng(), v])
    .sort((x, y) => x[0] - y[0])
    .map(([, v]) => v);

// A card of four numbers that can make 24 under the grade's rules, with its solution.
export function dealCard(grade, rng = Math.random) {
  const { high, wholeOnly } = rulesFor(grade);
  for (let tries = 0; tries < 500; tries += 1) {
    const values = Array.from({ length: 4 }, () => 1 + Math.floor(rng() * high));
    const solution = solve(values, { wholeOnly });
    if (solution) return { values: shuffleCard(values, rng), solution, wholeOnly };
  }
  throw new Error(`Could not deal a Make 24 card for grade ${grade}`);
}
