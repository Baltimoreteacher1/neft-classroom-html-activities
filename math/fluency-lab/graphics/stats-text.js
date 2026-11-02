// The working shown for each statistic: exact values with the steps that produce them. Every phrase goes through t().
import { t } from "./b-core.js";
import { decimalText, fmt, toNumber } from "./b-rational.js";

export const MINUS = "−";
// An exact value: a terminating decimal, or a fraction with its approximation.
export function val(r) {
  const dec = decimalText(r);
  if (dec !== null) return dec.replace("-", MINUS);
  return `${fmt(r).replace("-", MINUS)} ≈ ${toNumber(r).toFixed(2).replace("-", MINUS)}`;
}
const list = (items, max = 12) => (items.length > max ? `${items.slice(0, max).map(val).join(", ")}, …` : items.map(val).join(", "));

export function workingLines(sm, names) {
  const out = [];
  if (!sm.n) return [t("No data yet.")];
  for (const name of names) {
    if (name === "mean") {
      const parts = sm.n <= 10 ? `(${sm.sorted.map(val).join(" + ")}) ÷ ${sm.n} = ` : "";
      out.push(t("Mean: {work}{sum} ÷ {n} = {mean}", { work: parts, sum: val(sm.sum), n: sm.n, mean: val(sm.mean) }));
    } else if (name === "median") {
      const odd = sm.n % 2 === 1;
      const mid = Math.floor(sm.n / 2);
      out.push(
        odd
          ? t("Median: ordered list {list}. The middle value is {m}.", { list: list(sm.sorted, 20), m: val(sm.median) })
          : t("Median: ordered list {list}. The middle two are {a} and {b}, so ({a} + {b}) ÷ 2 = {m}.", { list: list(sm.sorted, 20), a: val(sm.sorted[mid - 1]), b: val(sm.sorted[mid]), m: val(sm.median) }),
      );
    } else if (name === "mode") {
      out.push(sm.modes.length ? t("Mode: {list}, which appears {n} times.", { list: list(sm.modes), n: sm.modeCount }) : t("Mode: no value appears more often than the others."));
    } else if (name === "range") {
      out.push(t("Range: {max} − {min} = {r}", { max: val(sm.max), min: val(sm.min), r: val(sm.range) }));
    } else if (name === "iqr") {
      if (sm.iqr === null) out.push(t("IQR needs at least 2 values."));
      else {
        out.push(t("IQR: Q3 − Q1 = {q3} − {q1} = {iqr}", { q3: val(sm.q3), q1: val(sm.q1), iqr: val(sm.iqr) }));
        out.push(t("Q1 is the median of the lower half ({lower}). Q3 is the median of the upper half ({upper}).", { lower: list(sm.lower, 10), upper: list(sm.upper, 10) }));
      }
    }
  }
  return out;
}

export function barLines(cats) {
  const total = cats.reduce((a, c) => a + c.count, 0);
  if (!cats.length || total === 0) return [t("No bars yet.")];
  const top = Math.max(...cats.map((c) => c.count));
  const low = Math.min(...cats.map((c) => c.count));
  const named = (n) => cats.filter((c) => c.count === n).map((c) => c.label).join(", ");
  return [
    t("Total: {sum} = {total}", { sum: cats.map((c) => c.count).join(" + "), total }),
    t("Most: {name} with {n}. Least: {low} with {m}.", { name: named(top), n: top, low: named(low), m: low }),
    t("Difference between most and least: {a} − {b} = {d}", { a: top, b: low, d: top - low }),
  ];
}
