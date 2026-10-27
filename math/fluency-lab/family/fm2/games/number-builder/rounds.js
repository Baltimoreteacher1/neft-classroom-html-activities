// Round generators, kindergarten to grade 3. Each is a pure function of (level, rng): the rng decides the target and
// the rules, and the solver (logic.js) keeps only rounds that really have a build. @fm2 FM-007 FM-019 FM-060 FM-061
import { int, shuffle } from "../../rng.js";
import { BASE10, COUNTERS, DISCS, P, count, digitSum, piecesRound, retry, total } from "./rounds-kit.js";

const spec = (kit, target, pieces, extra = {}) => ({
  kit,
  target: String(target),
  pieces,
  ...extra,
});
const digitAt = (n, place) => Math.floor(n / place) % 10;

export function kCount(level, rng) {
  const fallback = () =>
    piecesRound(rng, level, spec("counters", 6, COUNTERS(10, false), { cap: 10 }));
  return retry(
    rng,
    20,
    () => {
      if (level === 1) {
        const piece = [P("red", "1", "counter", 10, { color: "red" }), P("yellow", "1", "counter", 10, { color: "yellow" })][int(rng, 0, 1)];
        return piecesRound(rng, 1, spec("counters", int(rng, 1, 10), [piece], { cap: 10 }));
      }
      if (level === 2) {
        const t = int(rng, 4, 10);
        const rules =
          rng() < 0.5
            ? [count("red", "eq", int(rng, 1, t - 1))]
            : [count("red", "ge", int(rng, 1, 3)), count("yellow", "ge", int(rng, 1, 3))];
        return piecesRound(
          rng,
          2,
          spec("counters", t, COUNTERS(10), { cap: 10, constraints: rules }),
        );
      }
      const t = int(rng, 11, 20);
      if (rng() < 0.5)
        return piecesRound(
          rng,
          3,
          spec("counters", t, COUNTERS(20), { cap: 20, constraints: [count("red", "eq", 10)] }),
        );
      return piecesRound(
        rng,
        3,
        spec("counters", t, COUNTERS(20), {
          cap: 20,
          ways: 2,
          constraints: [count("red", "ge", int(rng, 1, 4)), count("yellow", "ge", int(rng, 1, 4))],
        }),
      );
    },
    fallback,
  );
}

export function kBonds(level, rng) {
  const fallback = () =>
    piecesRound(
      rng,
      level,
      spec("counters", 5, COUNTERS(10), {
        cap: 10,
        constraints: [count("red", "ge", 1), count("yellow", "ge", 1)],
      }),
    );
  return retry(
    rng,
    20,
    () => {
      if (level === 1) {
        const t = int(rng, 2, 5);
        const r = int(rng, 1, t - 1);
        const rules = [
          [count("red", "ge", 1), count("yellow", "ge", 1)],
          [count("red", "eq", r)],
          [count("yellow", "eq", r)],
        ][int(rng, 0, 2)];
        return piecesRound(rng, 1, spec("counters", t, COUNTERS(10), { cap: 10, constraints: rules }));
      }
      if (level === 2) {
        const t = int(rng, 6, 10);
        return piecesRound(
          rng,
          2,
          spec("counters", t, COUNTERS(10), {
            cap: 10,
            constraints: [count("red", "eq", int(rng, 1, t - 1))],
          }),
        );
      }
      const t = int(rng, 7, 10);
      const rules = [count("red", "ge", int(rng, 1, 2)), count("yellow", "ge", int(rng, 1, 2))];
      if (rng() < 0.5) rules.push(count("yellow", "le", t - 3));
      return piecesRound(
        rng,
        3,
        spec("counters", t, COUNTERS(10), { cap: 10, ways: 2, constraints: rules }),
      );
    },
    fallback,
  );
}

const ROD_UNIT = () => [P("rod", "10", "rod", 9), P("unit", "1", "unit", 30)];
const tensOnes = (t) => [Math.floor(t / 10), t % 10];

export function g1TensOnes(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("base10", 34, ROD_UNIT()));
  return retry(
    rng,
    20,
    () => {
      if (level === 1) return piecesRound(rng, 1, spec("base10", int(rng, 11, 59), ROD_UNIT()));
      if (level === 2) {
        const t = int(rng, 30, 99);
        const [td, od] = tensOnes(t);
        const rule =
          rng() < 0.6
            ? count("rod", "eq", int(rng, Math.max(0, td - 2), td - 1))
            : total("eq", td + od);
        return piecesRound(rng, 2, spec("base10", t, ROD_UNIT(), { constraints: [rule] }));
      }
      const t = int(rng, 40, 99);
      const [td, od] = tensOnes(t);
      return piecesRound(
        rng,
        3,
        spec("base10", t, ROD_UNIT(), {
          ways: 2,
          constraints: [count("rod", "ge", 1), total("le", td + od + 10)],
        }),
      );
    },
    fallback,
  );
}

const TEEN_PIECES = () => [P("rod", "10", "rod", 4), P("unit", "1", "unit", 40)];

export function g1Teen(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("base10", 14, TEEN_PIECES()));
  return retry(
    rng,
    20,
    () => {
      if (level === 1) {
        const t = int(rng, 11, 19);
        const rules = rng() < 0.5 ? [] : [total("le", 1 + (t - 10) + int(rng, 1, 4))];
        return piecesRound(rng, 1, spec("base10", t, TEEN_PIECES(), { constraints: rules }));
      }
      if (level === 2)
        return piecesRound(rng, 2, spec("base10", int(rng, 11, 39), TEEN_PIECES(), { ways: 2 }));
      const t = int(rng, 11, 39);
      const [td, od] = tensOnes(t);
      return piecesRound(
        rng,
        3,
        spec("base10", t, TEEN_PIECES(), { constraints: [total("eq", td + od)] }),
      );
    },
    fallback,
  );
}

export function g2Hundreds(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("base10", 234, BASE10()));
  return retry(
    rng,
    30,
    () => {
      if (level === 1) return piecesRound(rng, 1, spec("base10", int(rng, 100, 399), BASE10()));
      if (level === 2) {
        if (rng() < 0.5) {
          const t = int(rng, 200, 999);
          return piecesRound(
            rng,
            2,
            spec("base10", t, BASE10(), { constraints: [total("eq", digitSum(t))] }),
          );
        }
        return piecesRound(
          rng,
          2,
          spec("base10", 10 * int(rng, 10, 99), BASE10(), {
            constraints: [count("unit", "eq", 0)],
          }),
        );
      }
      const t = int(rng, 300, 999);
      return piecesRound(
        rng,
        3,
        spec("base10", t, BASE10(), {
          ways: 2,
          constraints: [
            count("flat", "ge", 1),
            count("rod", "ge", 1),
            total("le", digitSum(t) + 10),
          ],
        }),
      );
    },
    fallback,
  );
}

export function g2Regroup(level, rng) {
  const fallback = () =>
    piecesRound(
      rng,
      level,
      spec("base10", 352, BASE10([9, 40, 40]), { constraints: [count("flat", "eq", 2)] }),
    );
  return retry(
    rng,
    30,
    () => {
      const pieces = BASE10([9, 40, 40]);
      if (level === 1) {
        const t = int(rng, 200, 399);
        return piecesRound(
          rng,
          1,
          spec("base10", t, pieces, { constraints: [count("flat", "eq", digitAt(t, 100) - 1)] }),
        );
      }
      if (level === 2) {
        const t = int(rng, 300, 999);
        return piecesRound(
          rng,
          2,
          spec("base10", t, pieces, {
            constraints: [count("flat", "eq", digitAt(t, 100) - 1), count("unit", "eq", t % 10)],
          }),
        );
      }
      const t = int(rng, 300, 999);
      return piecesRound(
        rng,
        3,
        spec("base10", t, pieces, {
          constraints: [count("flat", "eq", digitAt(t, 100) - 2), count("unit", "le", 9)],
        }),
      );
    },
    fallback,
  );
}

export function g3Discs(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("discs", 1234, DISCS([1000, 100, 10, 1])));
  return retry(
    rng,
    40,
    () => {
      const pieces = DISCS([1000, 100, 10, 1]);
      if (level === 1) return piecesRound(rng, 1, spec("discs", int(rng, 100, 2999), pieces));
      const t = int(rng, 1000, 9999);
      if (level === 2) {
        const rule =
          rng() < 0.5 ? total("eq", digitSum(t)) : count("d1000", "eq", digitAt(t, 1000) - 1);
        return piecesRound(rng, 2, spec("discs", t, pieces, { constraints: [rule] }));
      }
      return piecesRound(
        rng,
        3,
        spec("discs", t, pieces, {
          ways: 2,
          form: { type: "words" },
          constraints: [total("le", digitSum(t) + 9)],
        }),
      );
    },
    fallback,
  );
}

export function g3Expanded(level, rng) {
  const fallback = () =>
    piecesRound(
      rng,
      level,
      spec("discs", 4326, DISCS([1000, 100, 10, 1]), {
        form: { type: "expanded", terms: ["4000", "300", "20", "6"] },
      }),
    );
  const termsOf = (t) =>
    [1000, 100, 10, 1].filter((p) => digitAt(t, p)).map((p) => String(digitAt(t, p) * p));
  return retry(
    rng,
    40,
    () => {
      const pieces = DISCS([1000, 100, 10, 1]);
      if (level === 1) {
        const t = int(rng, 1000, 9999);
        return piecesRound(
          rng,
          1,
          spec("discs", t, pieces, { form: { type: "expanded", terms: termsOf(t) } }),
        );
      }
      if (level === 2) {
        const t = int(rng, 1000, 9999);
        const zeroed = 1000 * digitAt(t, 1000) + 10 * digitAt(t, 10) + digitAt(t, 1);
        const target = rng() < 0.5 ? zeroed : t;
        return piecesRound(
          rng,
          2,
          spec("discs", target, pieces, {
            form: { type: "expanded", terms: shuffle(rng, termsOf(target)) },
            constraints: [total("eq", digitSum(target))],
          }),
        );
      }
      const [a, b, c] = [int(rng, 10, 45), int(rng, 1, 9), int(rng, 1, 9)];
      const t = 100 * a + 10 * b + c;
      const terms = [
        { n: a, p: 100 },
        { n: b, p: 10 },
        { n: c, p: 1 },
      ];
      return piecesRound(
        rng,
        3,
        spec("discs", t, pieces, {
          form: { type: "unit", terms },
          constraints: [total("eq", digitSum(t))],
        }),
      );
    },
    fallback,
  );
}
