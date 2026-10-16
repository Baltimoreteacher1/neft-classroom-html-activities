/**
 * Puzzle specs for the Balance Builder: the four levels' generators, the
 * validator that guarantees exactly one whole-number answer (used for both the
 * built-in levels and student-made puzzles) and the difficulty rating.
 *
 * A spec is plain integers, so it can be saved, shared as a short code and checked
 * without trusting anyone: { rel, v, q, l: {a, b}, r: {a, b} } meaning
 *   (l.a / q)·v + l.b   rel   (r.a / q)·v + r.b
 * where v indexes VARIABLES and q divides the x-terms (q = 4 reads "x ÷ 4").
 */
import { equation, isolated, RELATIONS, side, solutionLength } from "./balance-model.js";
import * as R from "./rational.js";

export const VARIABLES = ["x", "n", "t", "m", "a", "y"];
export const LIMITS = { coef: 12, divisor: 12, constant: 99, answer: 99 };

/** Levels 1 and 4 are on-grade (6.AT.8, 6.AT.9); 2 and 3 are optional stretch. */
export const LEVELS = [
  { id: 1, key: "oneStep", stretch: false },
  { id: 2, key: "twoStep", stretch: true },
  { id: 3, key: "bothSides", stretch: true },
  { id: 4, key: "tilt", stretch: false },
];

export const toEquation = (spec) => {
  const x = (c) => R.rat(c, spec.q);
  return equation(side(x(spec.l.a), spec.l.b), side(x(spec.r.a), spec.r.b), spec.rel);
};

const isInt = Number.isInteger;
const inRange = (n, lo, hi) => isInt(n) && n >= lo && n <= hi;

/**
 * Checks a spec. On success `answer` is the unique whole-number solution (or the
 * boundary of an inequality). Callers must not show `answer` to a player.
 */
export function validatePuzzle(spec) {
  const errors = [];
  const ok = spec && typeof spec === "object" && spec.l && spec.r;
  if (!ok) return { ok: false, errors: ["shape"] };
  const { l, r } = spec;
  const fields = [
    inRange(spec.v, 0, VARIABLES.length - 1),
    RELATIONS.includes(spec.rel),
    inRange(spec.q, 1, LIMITS.divisor),
    inRange(l.a, 0, LIMITS.coef),
    inRange(r.a, 0, LIMITS.coef),
    inRange(l.b, -LIMITS.constant, LIMITS.constant),
    inRange(r.b, -LIMITS.constant, LIMITS.constant),
  ];
  if (!fields.every(Boolean)) return { ok: false, errors: ["range"] };
  if (l.a === 0 && r.a === 0) return { ok: false, errors: ["noVariable"] };
  if (l.a === r.a) return { ok: false, errors: ["sameCoefficient"] };
  if (spec.rel !== "=" && l.a < r.a) errors.push("tiltDirection");
  const gap = R.rat((l.a - r.a) * 1, spec.q);
  const answer = R.div(R.rat(r.b - l.b), gap);
  if (!R.isInt(answer)) errors.push("noWholeAnswer");
  else if (answer.n < 0) errors.push("negativeAnswer");
  else if (answer.n > LIMITS.answer) errors.push("range");
  if (errors.length) return { ok: false, errors };
  const eq = toEquation(spec);
  if (isolated(eq)) return { ok: false, errors: ["alreadySolved"] };
  return { ok: true, answer: answer.n, rating: rate(spec) };
}

/** Difficulty from the length of a careful solution plus what makes it harder. */
export function rate(spec) {
  const eq = toEquation(spec);
  const moves = solutionLength(eq);
  const features = [];
  if (spec.l.a > 0 && spec.r.a > 0) features.push("bothSides");
  if (spec.rel !== "=") features.push("inequality");
  if (spec.q > 1) features.push("division");
  if ([spec.l.b, spec.r.b].some((b) => b < 0)) features.push("subtraction");
  const weight = { bothSides: 2, inequality: 1 };
  const score = moves + features.reduce((sum, f) => sum + (weight[f] ?? 0), 0);
  const tier = score <= 1 ? "easy" : score <= 3 ? "medium" : "hard";
  return { moves, score, tier, features };
}

// ── generators ─────────────────────────────────────────────────────────────
/** Small deterministic PRNG (mulberry32) so puzzle N of level L is the same every time. */
export function prng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return { next, int, pick: (list) => list[int(0, list.length - 1)] };
}

const mk = (rel, v, q, l, r) => ({ rel, v, q, l: { a: l[0], b: l[1] }, r: { a: r[0], b: r[1] } });

const FORMS = {
  1: [
    (g, v) => {
      const a = g.int(2, 15);
      return mk("=", v, 1, [1, a], [0, g.int(1, 20) + a]);
    },
    (g, v) => {
      const a = g.int(2, 15);
      return mk("=", v, 1, [1, -a], [0, g.int(2, 20)]);
    },
    (g, v) => {
      const a = g.int(2, 9);
      return mk("=", v, 1, [a, 0], [0, a * g.int(2, 12)]);
    },
    (g, v) => mk("=", v, g.int(2, 9), [1, 0], [0, g.int(2, 12)]),
  ],
  2: [
    (g, v) => {
      const a = g.int(2, 9);
      const b = g.int(1, 12);
      return mk("=", v, 1, [a, b], [0, a * g.int(1, 12) + b]);
    },
    (g, v) => {
      const a = g.int(2, 8);
      const b = g.int(1, 12);
      return mk("=", v, 1, [a, -b], [0, a * g.int(Math.ceil((b + 1) / a), 12) - b]);
    },
    (g, v) => {
      const q = g.int(2, 6);
      const b = g.int(1, 12);
      return mk("=", v, q, [1, b], [0, g.int(2, 9) + b]);
    },
    (g, v) => {
      const q = g.int(2, 6);
      const b = g.int(1, 9);
      return mk("=", v, q, [1, -b], [0, g.int(2, 9)]);
    },
  ],
  3: [
    (g, v) => {
      const c = g.int(1, 4);
      const a = c + g.int(1, 5);
      const b = g.int(0, 12);
      return mk("=", v, 1, [a, b], [c, b + (a - c) * g.int(1, 12)]);
    },
    (g, v) => {
      const c = g.int(1, 5);
      const a = c + g.int(1, 4);
      return mk("=", v, 1, [a, 0], [c, (a - c) * g.int(1, 12)]);
    },
    (g, v) => {
      const c = g.int(1, 4);
      const a = c + g.int(1, 5);
      const b = g.int(0, 12);
      return mk("=", v, 1, [c, b + (a - c) * g.int(1, 12)], [a, b]);
    },
  ],
  4: [
    (g, v) => {
      const a = g.int(2, 15);
      return mk(g.pick(["<", ">", "≤", "≥"]), v, 1, [1, a], [0, a + g.int(1, 20)]);
    },
    (g, v) => {
      const a = g.int(2, 12);
      return mk(g.pick(["<", ">", "≤", "≥"]), v, 1, [1, -a], [0, g.int(2, 20)]);
    },
    (g, v) => {
      const a = g.int(2, 9);
      return mk(g.pick(["<", ">", "≤", "≥"]), v, 1, [a, 0], [0, a * g.int(2, 12)]);
    },
    (g, v) => mk(g.pick(["<", ">", "≤", "≥"]), v, g.int(2, 9), [1, 0], [0, g.int(2, 12)]),
  ],
};

/** Puzzle number `index` (from 0) of a level: deterministic, always valid. */
export function generate(level, index) {
  const forms = FORMS[level];
  if (!forms) throw new RangeError(`unknown level ${level}`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const g = prng(level * 104729 + index * 7919 + attempt * 31 + 17);
    const form = forms[(index + attempt) % forms.length];
    const spec = form(g, g.next() < 0.6 ? 0 : g.int(1, VARIABLES.length - 1));
    if (validatePuzzle(spec).ok) return spec;
  }
  throw new Error(`no valid puzzle for level ${level} index ${index}`);
}
