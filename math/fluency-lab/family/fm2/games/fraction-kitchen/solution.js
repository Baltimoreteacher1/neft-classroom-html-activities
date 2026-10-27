// One correct response for every round (solve) and the short answer text (answerText). Pure and exact.
// @fm2 FM-060 FM-062
import { cmp, frac, lcm, mul, sub, toString } from "../../rational.js";
import { compareSolutions } from "./rounds-shape.js";
import { approximations } from "./rounds-measure.js";
import { decimalParts, decimalText, evenCuts, groupScoops } from "./model.js";
import { decimalOf, ms } from "./words.js";

const firstServed = (count, total) => Array.from({ length: total }, (_, i) => i < count);

export function equalShape(parts, count, wholes = 1) {
  return { cuts: evenCuts(parts), served: firstServed(count, parts * wholes) };
}

// The parts-and-served pair a shape round uses in its model solution.
export function shapePlan(round) {
  switch (round.skillId) {
    case "fair-shares":
      return { parts: round.friends, count: round.serveCount };
    case "fix-the-cuts":
      return { parts: round.friends, count: 0 };
    case "serve-parts":
      return { parts: round.ask[1], count: round.ask[0] };
    case "pizza-equiv": {
      const parts = round.den ?? round.ref.d * 2;
      return { parts, count: (round.ref.n * parts) / round.ref.d };
    }
    case "compare-pieces": {
      const all = compareSolutions(round);
      const [parts, count] = all.find(([n]) => n >= 2) ?? all[0];
      return { parts, count };
    }
    default: {
      const parts = lcm(round.base.d, round.target.d);
      return { parts, count: (round.target.n * parts) / round.target.d };
    }
  }
}

// Scoop counts that fill the target (largest scoops first); with minKinds 2, one big scoop is traded for smaller ones.
export function scoopPlan(round) {
  const sizes = [...round.scoops];
  if (round.single) {
    const size = sizes.find((s) => (round.target.n * s.d) % round.target.d === 0);
    const count = (round.target.n * size.d) / round.target.d;
    return Array.from({ length: count }, () => size);
  }
  let rest = round.target;
  const counts = new Map();
  for (const size of sizes) {
    const take = Math.floor((rest.n * size.d) / (rest.d * size.n));
    if (take > 0) counts.set(size, take);
    rest = sub(rest, mul(size, frac(take)));
  }
  const used = [...counts.keys()];
  if (used.length < round.minKinds) {
    const big = used[0];
    const smaller = sizes.find((s) => cmp(s, big) < 0 && s.d % big.d === 0);
    counts.set(big, counts.get(big) - 1);
    counts.set(smaller, (counts.get(smaller) || 0) + smaller.d / big.d);
  }
  return [...counts].flatMap(([size, count]) => Array.from({ length: count }, () => size));
}

export const servingsOf = (round) => {
  const q = mul(round.amount, frac(round.size.d, round.size.n));
  return q.n;
};

export function digitsOf(target) {
  const scaled = (target.n * 1000) / target.d;
  return [
    Math.floor(scaled / 1000) % 10,
    Math.floor(scaled / 100) % 10,
    Math.floor(scaled / 10) % 10,
    scaled % 10,
  ];
}

export function measurePlan(round) {
  if (round.irr) {
    const [steps, ticks] = approximations(round.irr).sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
    return { ticks, steps, verdict: "close" };
  }
  const ticks = round.ticksOptions.find((m) => m % round.target.d === 0);
  return { ticks, steps: (round.target.n * ticks) / round.target.d };
}

export function solve(round) {
  switch (round.kind) {
    case "fair":
    case "fix":
    case "serve":
    case "equiv":
    case "compare":
    case "area": {
      const { parts, count } = shapePlan(round);
      return equalShape(parts, count, round.wholes);
    }
    case "cup":
    case "line":
      return measurePlan(round);
    case "fill":
      return { scoops: scoopPlan(round).map((s) => ({ n: s.n, d: s.d })) };
    case "serving":
      return { servings: servingsOf(round) };
    default: {
      const parts = decimalParts(round.target);
      if (round.mode === "repeat" && parts.rep)
        return { digits: [0, 0, 0, 0], never: true, block: parts.rep };
      return { digits: digitsOf(round.target), never: false, block: null };
    }
  }
}

export function answerText(round) {
  switch (round.kind) {
    case "fair":
      return `${round.serveCount}/${round.friends}`;
    case "fix":
      return `1/${round.friends}`;
    case "serve":
      return `${round.ask[0]}/${round.ask[1]}`;
    case "equiv":
    case "compare": {
      const { parts, count } = shapePlan(round);
      return `${count}/${parts}`;
    }
    case "area":
      return toString(round.target);
    case "cup":
    case "fill":
      return ms(round.target);
    case "line": {
      if (!round.irr) return ms(round.target);
      const { ticks, steps } = measurePlan(round);
      return `${steps}/${ticks}`;
    }
    case "serving":
      return String(servingsOf(round));
    default:
      return round.mode === "repeat"
        ? decimalText(decimalParts(round.target))
        : decimalOf(round.target);
  }
}

export const describeScoops = (round) => groupScoops(scoopPlan(round));
