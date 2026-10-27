// Round generators, grade 4 to grade 8: discs and digit tiles, decimal blocks, signed chips, powers of ten and
// scientific notation. Pure functions of (level, rng, grade). @fm2 FM-007 FM-019 FM-054 FM-055 FM-060 FM-061
import { int, pick, sample, shuffle } from "../../rng.js";
import { frac, mul, toDecimalString } from "../../rational.js";
import { promptFor } from "./copy-text.js";
import { pow10 } from "./logic-modes.js";
import {
  DECIMAL,
  DISCS,
  P,
  chip,
  count,
  dec,
  digitSum,
  kinds,
  piecesRound,
  retry,
  total,
} from "./rounds-kit.js";

const spec = (kit, target, pieces, extra = {}) => ({
  kit,
  target: String(target),
  pieces,
  ...extra,
});
const digitAt = (n, place) => Math.floor(n / place) % 10;
const PLACES6 = [100000, 10000, 1000, 100, 10, 1];

export function g4Discs(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("discs", 12345, DISCS(PLACES6.slice(1))));
  return retry(
    rng,
    40,
    () => {
      if (level === 1)
        return piecesRound(rng, 1, spec("discs", int(rng, 1000, 99999), DISCS(PLACES6.slice(1))));
      if (level === 2) {
        const t = int(rng, 10000, 999999);
        const lead = 10 ** (String(t).length - 1);
        const rule =
          rng() < 0.5 ? total("eq", digitSum(t)) : count(`d${lead}`, "eq", digitAt(t, lead) - 1);
        return piecesRound(rng, 2, spec("discs", t, DISCS(PLACES6), { constraints: [rule] }));
      }
      const t = int(rng, 100000, 999999);
      return piecesRound(
        rng,
        3,
        spec("discs", t, DISCS(PLACES6), {
          ways: 2,
          form: { type: "words" },
          constraints: [total("le", digitSum(t) + 9)],
        }),
      );
    },
    fallback,
  );
}

const chartRound = (tiles, goal, target) => {
  const round = { v: 1, mode: "chart", form: { type: "numeral" }, tiles, goal, target, constraints: [], ways: 1 };
  round.prompt = promptFor(round);
  return round;
};

export function g4Tiles(level, rng) {
  const goals = [["largest", "smallest"], ["largest", "smallest", "nearest"], ["nearest", "largestEven"]][level - 1];
  const n = [4, 5, 6][level - 1];
  const deal = () => (level === 3 ? Array.from({ length: n }, () => int(rng, 0, 9)) : sample(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], n));
  return retry(
    rng,
    40,
    () => {
      const tiles = deal();
      const goal = pick(rng, goals);
      if (goal === "largestEven" && !tiles.some((d) => d % 2 === 0)) return null;
      if (tiles.filter((d) => d !== 0).length < 2) return null;
      const target = goal === "nearest" ? String(1000 * int(rng, 10 ** (n - 1) / 1000, 10 ** n / 1000 - 1)) : "0";
      return chartRound(shuffle(rng, tiles), goal, target);
    },
    () => chartRound([3, 8, 0, 5], "largest", "0"),
  );
}

export function g5DecimalPieces(level, rng) {
  const fallback = () => piecesRound(rng, level, spec("decimal", "2.35", DECIMAL()));
  return retry(
    rng,
    30,
    () => {
      if (level === 1)
        return piecesRound(rng, 1, spec("decimal", dec(int(rng, 11, 399), 2), DECIMAL()));
      if (level === 2) {
        const n = int(rng, 101, 699);
        const rules =
          rng() < 0.5
            ? [total("eq", digitSum(n))]
            : [count("flat", "ge", 1), count("rod", "ge", 1), count("unit", "ge", 1)];
        return piecesRound(rng, 2, spec("decimal", dec(n, 2), DECIMAL(), { constraints: rules }));
      }
      const n = int(rng, 1001, 4999);
      const rules =
        rng() < 0.5
          ? { constraints: [total("eq", digitSum(n))] }
          : { ways: 2, constraints: [total("le", digitSum(n) + 9)] };
      return piecesRound(rng, 3, spec("decimal", dec(n, 3), DECIMAL(true), rules));
    },
    fallback,
  );
}

export function g5DecimalRegroup(level, rng) {
  const fallback = () =>
    piecesRound(
      rng,
      level,
      spec("decimal", "1.2", DECIMAL(), { constraints: [count("flat", "eq", 0)] }),
    );
  return retry(
    rng,
    30,
    () => {
      if (level === 1)
        return piecesRound(
          rng,
          1,
          spec("decimal", dec(int(rng, 11, 39), 1), DECIMAL(), {
            constraints: [count("flat", "eq", 0)],
          }),
        );
      if (level === 2) {
        const n = int(rng, 101, 399);
        return piecesRound(
          rng,
          2,
          spec("decimal", dec(n, 2), DECIMAL(), {
            constraints: [
              count("flat", "eq", digitAt(n, 100)),
              count("rod", "eq", digitAt(n, 10) - 1),
            ],
          }),
        );
      }
      const n = 1000 * int(rng, 0, 2) + 100 * int(rng, 1, 9) + int(rng, 10, 29);
      return piecesRound(
        rng,
        3,
        spec("decimal", dec(n, 3), DECIMAL(true), { constraints: [count("unit", "eq", 0)] }),
      );
    },
    fallback,
  );
}

const expDiscs = (lo, hi) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => hi - i).map((e) =>
    P(
      `e${e < 0 ? `m${-e}` : e}`,
      toDecimalString(frac(e >= 0 ? 10 ** e : 1, e >= 0 ? 1 : 10 ** -e)),
      "expdisc",
      15,
      { exp: e },
    ),
  );

export function g7ExponentDiscs(level, rng, grade) {
  const range =
    grade >= 7
      ? [
          [0, 2],
          [-2, 4],
          [-3, 5],
        ][level - 1]
      : [
          [0, 2],
          [0, 4],
          [0, 5],
        ][level - 1];
  const fallback = () => piecesRound(rng, level, spec("expdiscs", "235", expDiscs(0, 2)));
  return retry(
    rng,
    40,
    () => {
      const [lo, hi] = range;
      const pieces = expDiscs(lo, hi);
      const digits = Array.from({ length: hi - lo + 1 }, (_, i) =>
        i === 0 ? int(rng, 1, 9) : int(rng, 0, 9),
      );
      if (digits.every((d, i) => i === 0 || d === 0)) return null;
      const n = Number(digits.join(""));
      const target = dec(n, -lo);
      const ds = digitSum(n);
      if (level === 1) return piecesRound(rng, 1, spec("expdiscs", target, pieces));
      if (level === 2) {
        const rule = rng() < 0.5 ? total("eq", ds) : count(pieces[0].id, "eq", digits[0] - 1);
        return piecesRound(rng, 2, spec("expdiscs", target, pieces, { constraints: [rule] }));
      }
      return piecesRound(
        rng,
        3,
        spec("expdiscs", target, pieces, { ways: 2, constraints: [total("le", ds + 9)] }),
      );
    },
    fallback,
  );
}

// ---------- scientific notation ----------
const sciRound = (spec2) => {
  const round = {
    v: 1,
    mode: "sci",
    form: { type: "numeral" },
    constraints: [],
    ways: 1,
    ...spec2,
  };
  round.prompt = promptFor(round);
  return round;
};
const sciValueText = (coefTenths, exp, decimals = 1) =>
  toDecimalString(mul(frac(coefTenths, 10 ** decimals), pow10(exp)), 9);
const coefText = (n, decimals) => dec(n, decimals);

export function g8SciBuild(level, rng) {
  if (level === 1) {
    const n = int(rng, 11, 99);
    const e = int(rng, 2, 7);
    return sciRound({ target: sciValueText(n, e), constraints: [{ t: "normalized" }] });
  }
  if (level === 2) {
    const n = int(rng, 11, 99);
    const e = -int(rng, 2, 6);
    return sciRound({ target: sciValueText(n, e), constraints: [{ t: "normalized" }] });
  }
  const n = int(rng, 101, 999);
  const e = rng() < 0.5 ? int(rng, 3, 8) : -int(rng, 2, 6);
  return sciRound({ target: sciValueText(n, e, 2), constraints: [{ t: "normalized" }] });
}

export function g8ExpEquivalence(level, rng) {
  if (level === 1) {
    const n = int(rng, 11, 99);
    const e = int(rng, 3, 7);
    const shift = int(rng, 1, 2);
    return sciRound({
      target: sciValueText(n, e),
      expr: { c: coefText(n, 1), e },
      constraints: [{ t: "exp", op: "eq", n: e - shift }],
    });
  }
  if (level === 2) {
    const n = int(rng, 11, 99);
    const e = pick(rng, [-5, -4, -3, -2, 4, 5, 6]);
    return sciRound({
      target: sciValueText(n, e),
      expr: { c: coefText(n, 1), e },
      constraints: [{ t: "exp", op: "eq", n: e + 1 }],
    });
  }
  return retry(
    rng,
    20,
    () => {
      const n = int(rng, 11, 99);
      const e = int(rng, 3, 7);
      return sciRound({
        target: sciValueText(n, e),
        expr: { c: coefText(n, 1), e },
        ways: 2,
        constraints: [{ t: "exp", op: "ne", n: e }],
      });
    },
    () =>
      sciRound({
        target: "36000",
        expr: { c: "3.6", e: 4 },
        ways: 2,
        constraints: [{ t: "exp", op: "ne", n: 4 }],
      }),
  );
}
