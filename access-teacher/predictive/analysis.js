// Small-sample, distribution-free analyses for ACCESS proficiency levels. These routines never mix
// assessment versions and keep student-level pairs intact. The sign test is exact under independent
// students; ties are reported and excluded from its test statistic.
import { ASSESSMENTS, levelComparable } from "./rules.js";
import { recordsOf } from "./records.js";

const round = (n, places = 3) => Number(n.toFixed(places));

export function describe(values) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  const at = (p) => {
    const i = (a.length - 1) * p;
    const lo = Math.floor(i);
    return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
  };
  const mean = a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a.length > 1 ? Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / (a.length - 1)) : null;
  return { n: a.length, mean: round(mean, 2), sd: sd == null ? null : round(sd, 2), median: round(at(0.5), 2), q1: round(at(0.25), 2), q3: round(at(0.75), 2), min: a[0], max: a.at(-1) };
}

function binomialLowerTail(n, k) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let term = 2 ** -n;
  let total = term;
  for (let i = 1; i <= k; i++) {
    term *= (n - i + 1) / i;
    total += term;
  }
  return total;
}

export function exactSignTest(differences) {
  const nonzero = differences.filter((x) => x !== 0 && Number.isFinite(x));
  const positive = nonzero.filter((x) => x > 0).length;
  const negative = nonzero.length - positive;
  const tail = Math.min(positive, negative);
  const p = nonzero.length ? Math.min(1, 2 * binomialLowerTail(nonzero.length, tail)) : 1;
  return { n: nonzero.length, positive, negative, p, effect: nonzero.length ? round((positive - negative) / nonzero.length, 3) : null };
}

/** Distribution-free order-statistic interval; exact coverage is returned and may be below 95% for small n. */
export function medianInterval(values, alpha = 0.05) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  let k = 0;
  while (k + 1 <= Math.floor(a.length / 2) && 2 * binomialLowerTail(a.length, k + 1) <= alpha) k++;
  return { lo: a[k], hi: a[a.length - 1 - k], exactCoverage: Math.max(0, 1 - 2 * binomialLowerTail(a.length, k)) };
}

export function pairedSummary(differences) {
  const values = differences.filter(Number.isFinite);
  if (!values.length) return null;
  const desc = describe(values);
  const test = exactSignTest(values);
  return { ...desc, test, medianCI: medianInterval(values), ties: values.length - test.n };
}

const yearStart = (year) => Number(String(year).slice(0, 4));
export const nextSchoolYear = (year) => {
  const start = yearStart(year) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

/** Adjacent-year official pairs on the same assessment and level scale only. */
export function adjacentYearPairs(students) {
  const pairs = new Map();
  for (const student of students) {
    const rows = recordsOf(student).filter((r) => ASSESSMENTS[r.assessmentType]?.kind === "annual");
    for (const to of rows) {
      const fromYear = rows.find((r) => r.assessmentType === to.assessmentType && nextSchoolYear(r.academicYear) === to.academicYear);
      if (!fromYear || !levelComparable(fromYear, to)) continue;
      const key = `${to.assessmentType}|${fromYear.academicYear}|${to.academicYear}`;
      if (!pairs.has(key)) pairs.set(key, { key, type: to.assessmentType, from: fromYear.academicYear, to: to.academicYear, rows: [] });
      pairs.get(key).rows.push({ student, from: fromYear, to });
    }
  }
  return [...pairs.values()].sort((a, b) => b.to.localeCompare(a.to) || b.rows.length - a.rows.length);
}
