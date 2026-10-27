// Round generators for signed chips, grades 6 and 7: integers with zero pairs, zero-sum combinations and signed
// decimal targets. Chip sets and rules vary from round to round; the solver keeps only solvable ones.
// @fm2 FM-007 FM-019 FM-054 FM-055 FM-060 FM-061
import { int, pick, sample } from "../../rng.js";
import { chip, count, dec, kinds, piecesRound, retry, total } from "./rounds-kit.js";

const spec = (target, pieces, extra = {}) => ({
  kit: "chips",
  target: String(target),
  pieces,
  ...extra,
});
const nonZero = (rng, lo, hi) => {
  const v = int(rng, lo, hi);
  return v === 0 ? hi : v;
};
const PM1 = () => [chip("pos", "1", 14), chip("neg", "-1", 14)];
// Chips worth +m and -m for each magnitude m (as decimal text), ids like p2 / n2 / p0.5.
const pairs = (mags, max = 8) =>
  mags.flatMap((m) => [chip(`p${m}`, String(m), max), chip(`n${m}`, String(-m), max)]);
const ids = (m) => [`p${m}`, `n${m}`];

export function g6Chips(level, rng) {
  const fallback = () => piecesRound(rng, level, spec(-4, PM1(), { cap: 24 }));
  return retry(
    rng,
    30,
    () => {
      if (level === 1) {
        const t = nonZero(rng, -9, 9);
        const rules = rng() < 0.5 ? [] : [total("le", Math.abs(t) + int(rng, 3, 6))];
        return piecesRound(rng, 1, spec(t, PM1(), { cap: 24, constraints: rules }));
      }
      if (level === 2)
        return piecesRound(
          rng,
          2,
          spec(nonZero(rng, -10, 10), PM1(), {
            cap: 24,
            constraints: [count("pos", "ge", int(rng, 2, 3)), count("neg", "ge", int(rng, 2, 3))],
          }),
        );
      const t = nonZero(rng, -12, 12);
      const k = int(rng, 2, Math.min(6, 14 - Math.abs(t)));
      return piecesRound(
        rng,
        3,
        spec(t, PM1(), {
          cap: 24,
          constraints: [
            total("eq", 2 * k + Math.abs(t)),
            count("pos", "ge", 2),
            count("neg", "ge", 2),
          ],
        }),
      );
    },
    fallback,
  );
}

export function g6ZeroPairs(level, rng) {
  const fallback = () =>
    piecesRound(rng, level, spec(0, PM1(), { cap: 12, constraints: [total("eq", 6)] }));
  return retry(
    rng,
    80,
    () => {
      if (level === 1) {
        const k = int(rng, 2, 5);
        const variant = int(rng, 0, 3);
        const rules = [
          [total("eq", 2 * k)],
          [total("ge", 2 * k), total("le", 10)],
          [count("pos", "eq", k)],
          [count("neg", "eq", k)],
        ][variant];
        return piecesRound(rng, 1, spec(0, PM1(), { cap: 10, constraints: rules }));
      }
      if (level === 2) {
        const [a, m] = sample(rng, [1, 2, 3, 5, 10], 2).sort((x, y) => x - y);
        return piecesRound(
          rng,
          2,
          spec(0, pairs([a, m]), {
            cap: 12,
            constraints: [total("eq", int(rng, 4, 6)), count(ids(m), "ge", 2)],
          }),
        );
      }
      const mags = sample(rng, [1, 2, 3, 5, 10], 3).sort((a, b) => a - b);
      return piecesRound(
        rng,
        3,
        spec(nonZero(rng, -9, 9), pairs(mags), {
          cap: 12,
          constraints: [total("eq", int(rng, 3, 5)), kinds(3)],
        }),
      );
    },
    fallback,
  );
}

export function g7SignedChips(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("-2.5", pairs([1, 0.5]), { cap: 20 }));
  return retry(
    rng,
    80,
    () => {
      if (level === 1) {
        const big = pick(rng, [1, 2, 1.5]);
        const half = 2 * int(rng, -8, 8) + 1;
        return piecesRound(rng, 1, spec(dec(5 * half, 1), pairs([big, 0.5]), { cap: 20 }));
      }
      if (level === 2) {
        const tenths = rng() < 0.5;
        const mags = tenths ? [1, 0.5, 0.1] : [1, 0.5, 0.25];
        const t = tenths ? dec(nonZero(rng, -59, 59), 1) : dec(25 * (2 * int(rng, -12, 11) + 1), 2);
        const positive = mags.map((m) => `p${m}`);
        const negative = mags.map((m) => `n${m}`);
        return piecesRound(
          rng,
          2,
          spec(t, pairs(mags), {
            cap: 20,
            constraints: [count(positive, "ge", 1), count(negative, "ge", 1)],
          }),
        );
      }
      return piecesRound(
        rng,
        3,
        spec(dec(25 * nonZero(rng, -36, 36), 2), pairs([2, 1, 0.5, 0.25]), {
          cap: 20,
          constraints: [total("eq", int(rng, 4, 8)), kinds(3)],
        }),
      );
    },
    fallback,
  );
}

export function g7ZeroSum(level, rng) {
  const fallback = () =>
    piecesRound(
      rng,
      level,
      spec(0, pairs([1, 2]), { cap: 12, constraints: [total("eq", 4), kinds(2)] }),
    );
  return retry(
    rng,
    100,
    () => {
      if (level === 1) {
        const mags = sample(rng, [1, 2, 3, 4], 2).sort((a, b) => a - b);
        return piecesRound(
          rng,
          1,
          spec(0, pairs(mags), {
            cap: 12,
            constraints: [total("eq", pick(rng, [4, 6, 8])), kinds(2)],
          }),
        );
      }
      if (level === 2) {
        const mags = sample(rng, [0.5, 1, 1.5, 2, 2.5], 3).sort((a, b) => a - b);
        const low = int(rng, 4, 5);
        return piecesRound(
          rng,
          2,
          spec(0, pairs(mags, 6), {
            cap: 12,
            constraints: [kinds(3), total("ge", low), total("le", low + int(rng, 1, 2))],
          }),
        );
      }
      const mags = sample(rng, [0.25, 0.5, 0.75, 1, 1.25, 1.5], 3).sort((a, b) => a - b);
      return piecesRound(
        rng,
        3,
        spec(0, pairs(mags, 6), {
          cap: 12,
          ways: 2,
          constraints: [kinds(3), total("ge", 4), total("le", int(rng, 5, 7))],
        }),
      );
    },
    fallback,
  );
}
