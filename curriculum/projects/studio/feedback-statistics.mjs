/** Statistics missions: center, spread and quartiles of a small editable data set. */
import { fmt, trap } from "./feedback-util.mjs";
const MEASURE = {
  "unit-2-a": "build times",
  "unit-2-b": "temperatures",
  "statistics-a": "measurements",
  "statistics-b": "visit counts",
  "statistics-life": "activity minutes",
};
const med = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
export function spec(project, v) {
  const data = v.data;
  const W = MEASURE[project.id];
  const sorted = [...data].sort((x, y) => x - y);
  const n = sorted.length;
  const lo = sorted[0];
  const hi = sorted.at(-1);
  const sum = data.reduce((x, y) => x + y, 0);
  const mean = sum / n;
  const mid = Math.floor(n / 2);
  const lower = sorted.slice(0, mid);
  const upper = sorted.slice(n % 2 ? mid + 1 : mid);
  const q1 = med(lower);
  const q3 = med(upper);
  const below = (s) => sorted.filter((x) => x < s).length;
  const outside = (s) => s < lo || s > hi;
  const unsortedMid = med(data);
  const absDev = sorted.reduce((t, x) => t + Math.abs(x - mean), 0);
  const inclusiveLower = sorted.slice(0, Math.ceil(n / 2));
  const checks = {
    mean: {
      traps: [
        trap("gave-median", med(sorted), () => `That is the middle value, not the mean. The mean shares the total equally among all ${n} ${W}.`),
        trap("forgot-divide", sum, () => `That is the total of all ${n} ${W}. The mean shares that total equally, so it needs one more step.`),
        trap("divided-by-n-minus-1", sum / (n - 1), () => `Divide by the number of ${W}, which is ${n}, not by ${n - 1}.`),
        trap("midrange", (lo + hi) / 2, () => `That is halfway between the smallest and largest ${W}. The mean uses every value, not only the two ends.`),
      ],
      verify: (s) =>
        outside(s)
          ? `A mean always lies between the smallest and largest ${W}; ${fmt(s)} is outside that range.`
          : `${fmt(s)} × ${n} = ${fmt(s * n)}. That product should equal the total of all ${n} ${W}. Add them again carefully.`,
      next: `Add all ${n} ${W}, then divide by ${n}.`,
    },
    median: {
      traps: [
        trap("gave-mean", mean, () => `That is the mean. The median is the middle position of the sorted list.`),
        trap("unsorted-middle", unsortedMid, () => `That is the middle of the list in the order given. Sort the ${W} from least to greatest first.`),
        trap("midrange", (lo + hi) / 2, () => `That is halfway between the smallest and largest ${W}. The median is the middle position, not the middle of the range.`),
      ],
      verify: (s) =>
        outside(s)
          ? `A median lies between the smallest and largest ${W}; ${fmt(s)} does not.`
          : `${below(s)} of the ${n} ${W} are below ${fmt(s)} and ${sorted.filter((x) => x > s).length} are above it. A median leaves half on each side.`,
      next: `Sort the ${n} ${W}. With ${n % 2 ? "an odd" : "an even"} count, ${n % 2 ? "take the middle one" : "average the two middle ones"}.`,
    },
    range: {
      traps: [
        trap("gave-max", hi, () => `That is the largest value. The range is the distance from the smallest to the largest.`),
        trap("added-ends", lo + hi, () => `That adds the smallest and largest. The range subtracts them.`),
        trap("gave-iqr", q3 - q1, () => `That is the spread of the middle half (IQR). The range uses the smallest and largest values.`),
      ],
      verify: (s) =>
        s < 0
          ? `A range cannot be negative; ${fmt(s)} is below zero. Subtract the smallest of the ${n} ${W} from the largest.`
          : `${fmt(s)} is not the distance from the smallest to the largest of these ${n} ${W}. Find both ends in the sorted list and subtract.`,
      next: `Find the smallest and largest of the ${n} ${W}, then subtract.`,
    },
    mad: {
      traps: [
        trap("forgot-divide", absDev, () => `That adds the distances from the mean but does not share them equally. Divide by ${n}.`),
        trap("signed-deviations", 0, () => `Deviations above and below the mean of these ${n} ${W} cancel to 0. Use each distance as a positive number.`),
        trap("gave-range", hi - lo, () => `That is the range, which uses only the two ends. MAD uses every value's distance from the mean.`),
      ],
      verify: (s) =>
        s < 0
          ? `A mean absolute deviation is never negative; ${fmt(s)} is below zero because every distance is positive.`
          : `${fmt(s)} × ${n} = ${fmt(s * n)}. That should equal the total of the ${n} distances from the mean. Recompute each distance as a positive number.`,
      next: `Find the mean first, then each value's distance from it, then average those distances.`,
    },
    q1: {
      traps: [
        trap("gave-min", lo, () => `That is the smallest value. The first quartile is the median of the lower half.`),
        trap("gave-median", med(sorted), () => `That is the overall median. Q1 is the median of the lower half only.`),
        trap("kept-middle", n % 2 ? med(inclusiveLower) : [], () => `With an odd count, leave the overall median out of both halves before finding Q1.`),
        trap("lower-mean", lower.reduce((x, y) => x + y, 0) / lower.length, () => `That is the mean of the lower half. Q1 is its median.`),
      ],
      verify: (s) =>
        outside(s)
          ? `Q1 lies between the smallest and largest ${W}; ${fmt(s)} does not.`
          : `${below(s)} of the ${n} ${W} are below ${fmt(s)}. About a quarter of them should be below Q1.`,
      next: `Split the sorted list into a lower and an upper half, then take the median of the lower half.`,
    },
    iqr: {
      traps: [
        trap("gave-range", hi - lo, () => `That is the range. The IQR measures only the middle half, from Q1 to Q3.`),
        trap("gave-q3", q3, () => `That is Q3 on its own. The IQR is Q3 minus Q1.`),
        trap("added-quartiles", q1 + q3, () => `That adds the quartiles. The IQR subtracts Q1 from Q3.`),
        trap("reversed", q1 - q3, () => `The IQR cannot be negative; subtract Q1 from Q3, not the other way around.`),
      ],
      verify: (s) =>
        s < 0
          ? `An IQR cannot be negative; ${fmt(s)} is below zero. Subtract Q1 from Q3.`
          : `${fmt(s)} is not the distance between the quartiles of these ${n} ${W}. Find Q1 and Q3 from the lower and upper halves, then subtract.`,
      next: `Find the median of the lower half (Q1) and of the upper half (Q3), then subtract.`,
    },
  };
  // Sibling missions share a feedback shape but not a data set: name this mission's measurements in every message.
  for (const entry of Object.values(checks))
    for (const t of entry.traps) {
      const say = t.say;
      t.say = (s) => {
        const text = say(s);
        return text.includes(W) ? text : `${text} (These are the ${n} ${W} in your data set.)`;
      };
    }
  return checks;
}
