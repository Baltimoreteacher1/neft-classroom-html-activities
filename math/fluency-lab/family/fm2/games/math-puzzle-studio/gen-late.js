// Grade 8 rounds: two balance scales with two unknown weights (a system of equations), and squares that balance
// (a squared plus b squared equals c squared with whole-number sides). @fm2 FM-017 FM-051 FM-058 FM-060
import { solveAll } from "./rules.js";
import { balanceRound } from "./gen-early.js";
import { int, makePool, numberPool, openCell, pick, T } from "./gen-kit.js";

const box = (c, m, shape) => ({ c, m, box: shape });

// ---- two scales, two unknown weights ----------------------------------------------------------------------------
export function scaleSystem(level, rng) {
  const hi = level === 1 ? 9 : level === 2 ? 10 : 12;
  const top = level === 1 ? 2 : level === 2 ? 3 : 4;
  for (let tries = 0; tries < 500; tries += 1) {
    const x = int(rng, 1, hi);
    const y = int(rng, 1, hi);
    if (x === y) continue;
    const a1 = level === 1 ? 1 : int(rng, 1, top);
    const b1 = level === 1 ? 1 : int(rng, 1, top);
    const a2 = int(rng, 1, top);
    const b2 = int(rng, 1, top);
    if (a1 * b2 === a2 * b1) continue; // the two scales must say different things
    const k2 = level === 3 ? int(rng, 0, 4) : 0;
    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y + k2;
    const left2 = [box(0, a2, "cube"), box(1, b2, "ball"), ...(k2 ? [{ v: k2 }] : [])];
    const scales = [
      { l: [box(0, a1, "cube"), box(1, b1, "ball")], r: [{ v: c1 }], rel: "=" },
      { l: left2, r: [{ v: c2 }], rel: "=" },
    ];
    const pool = makePool(Array.from({ length: hi + 1 }, (_, i) => ({ v: i + 1 })));
    const round = balanceRound(
      rng,
      {
        level,
        reuse: true,
        cells: [openCell(), openCell()],
        pool,
        system: true,
        prompt: T(
          "Every cube weighs the same and every ball weighs the same. Place a weight for the cube and a weight for the ball so BOTH scales balance.",
          "Todos los cubos pesan lo mismo y todas las pelotas pesan lo mismo. Coloca un peso para el cubo y otro para la pelota de modo que LAS DOS balanzas queden equilibradas.",
        ),
      },
      scales,
      Math.max(c1, c2),
    );
    const { solutions } = solveAll(round, 2);
    if (solutions.length !== 1) continue;
    round.solution = solutions[0];
    return round;
  }
  throw new Error("could not build a scale system");
}

// ---- squares that balance ----------------------------------------------------------------------------------------
const TRIPLES = [
  [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [8, 15, 17],
  ],
  [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [9, 12, 15],
    [8, 15, 17],
    [12, 16, 20],
  ],
  [
    [12, 16, 20],
    [15, 20, 25],
    [7, 24, 25],
    [20, 21, 29],
    [10, 24, 26],
    [18, 24, 30],
    [9, 40, 41],
  ],
];

export function pythagSquares(level, rng) {
  const [p, q, c] = pick(rng, TRIPLES[level - 1]);
  const [a, b] = rng() < 0.5 ? [p, q] : [q, p];
  const missingLeg = level >= 2 && rng() < (level === 2 ? 0.6 : 0.5);
  const sq = (s) => ({ v: s * s, side: s });
  const answer = missingLeg ? b : c;
  const named = missingLeg
    ? [
        [c - a, "subtracted-sides"],
        [c * c - a * a, "area-not-side"],
        [answer + 1, "off-one"],
        [answer - 1, "off-one"],
      ]
    : [
        [a + b, "added-sides"],
        [a * a + b * b, "area-not-side"],
        [answer + 1, "off-one"],
        [answer - 1, "off-one"],
      ];
  const left = missingLeg ? [sq(a), { c: 0, p: 2 }] : [sq(a), sq(b)];
  const right = missingLeg ? [sq(c)] : [{ c: 0, p: 2 }];
  const hi = Math.max(c * c, a * a + b * b);
  return balanceRound(
    rng,
    {
      level,
      reuse: true,
      unit: "area",
      squares: true,
      cells: [openCell()],
      pool: numberPool(rng, {
        include: [answer],
        exclude: [answer],
        named,
        lo: 1,
        hi,
        fillHi: c + 6,
        size: 6,
      }),
      prompt: missingLeg
        ? T(
            `A square with side ${a} and a square with a missing side sit on the left pan. A square with side ${c} sits on the right pan. Place the missing side length so the areas balance.`,
            `Un cuadrado de lado ${a} y un cuadrado de lado desconocido están en el platillo izquierdo. Un cuadrado de lado ${c} está en el derecho. Coloca la longitud del lado que falta para que las áreas se equilibren.`,
          )
        : T(
            `Squares with sides ${a} and ${b} sit on the left pan. Place the side length of the square on the right pan so the areas balance.`,
            `Dos cuadrados de lados ${a} y ${b} están en el platillo izquierdo. Coloca la longitud del lado del cuadrado del platillo derecho para que las áreas se equilibren.`,
          ),
    },
    [{ l: left, r: right, rel: "=" }],
    c * c,
  );
}
