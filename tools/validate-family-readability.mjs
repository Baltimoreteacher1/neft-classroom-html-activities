#!/usr/bin/env node
/**
 * validate-family-readability.mjs — family-facing English reads at about grade 7 or below.
 *
 * Families read English or Spanish, and many caregivers have no math background. The sidecars in
 * data/family-homework-notes/ once held 1,080 strings of 8+ words above grade 7 (every learningTonight
 * but 39, most watchFor tips, most bridge lines). They were rewritten sentence by sentence. This gate keeps
 * the count from creeping back up: it fails when the number of strings above `threshold` exceeds the
 * `ceiling` in data/family-readability-budget.json. The ceiling may only go down.
 *
 * The grade is `fleschKincaid` from tools/lib/copy-scan.mjs. Strings under `minWords` words are not counted
 * (judge them by eye): one technical term in a short sentence is a known false positive of grade formulas.
 *
 * Self-tests first: a known hard sentence must flag, a known easy one must not, a sweep of zero strings
 * must FAIL, and a ceiling of one below the real count must FAIL. A gate that stops firing reports a clean file.
 *
 *   node tools/validate-family-readability.mjs [--report]   (--report lists every string above the limit)
 */
import { fleschKincaid } from "./lib/copy-scan.mjs";
import { readBudget, sweep, tooHard } from "./lib/family-readability.mjs";

const failures = [];
const expect = (cond, label) => {
  if (!cond) failures.push(`SELF-TEST: ${label}`);
};

const HARD =
  "Multiplying a positive starting amount by a fraction between zero and one produces a smaller quantity than the original.";
const EASY = "Count one small group. Then see how many of those groups fill the whole thing.";
const opts = { threshold: 7, minWords: 8 };
const row = (text) => ({ text, words: text.split(/\s+/).length, grade: fleschKincaid(text) });

function checkAgainst(rows, budget) {
  const hard = tooHard(rows, budget);
  const problems = [];
  if (!rows.length) problems.push("the sweep found zero family strings");
  if (hard.length > budget.ceiling)
    problems.push(
      `${hard.length} strings above grade ${budget.threshold}; the ceiling is ${budget.ceiling}`,
    );
  return { hard, problems };
}

expect(tooHard([row(HARD)], opts).length === 1, "a known hard sentence is flagged");
expect(tooHard([row(EASY)], opts).length === 0, "a known easy sentence is not flagged");
expect(
  tooHard([row("Equations and inequalities are interchangeable.")], opts).length === 0,
  "a short one-term sentence is judged by eye, not counted",
);
expect(
  checkAgainst([], { ...opts, ceiling: 0 }).problems.length > 0,
  "a sweep of zero strings fails",
);
expect(
  checkAgainst([row(HARD)], { ...opts, ceiling: 0 }).problems.length > 0,
  "a count above the ceiling fails",
);
expect(
  checkAgainst([row(EASY), row(HARD)], { ...opts, ceiling: 1 }).problems.length === 0,
  "a count at the ceiling passes",
);
if (failures.length) {
  for (const f of failures) console.error(f);
  process.exit(1);
}

const budget = readBudget();
const rows = sweep();
const { hard, problems } = checkAgainst(rows, budget);
if (rows.length < 5000)
  problems.push(`only ${rows.length} family strings swept; expected 5,000 or more`);

const byField = {};
for (const r of rows) {
  const b = (byField[r.field] ??= { total: 0, above: 0 });
  b.total++;
  if (r.words >= budget.minWords && r.grade > budget.threshold) b.above++;
}
console.log(
  `family readability: ${rows.length} English strings swept (grade limit ${budget.threshold}, 8+ words)`,
);
for (const [field, b] of Object.entries(byField))
  console.log(
    `  ${field.padEnd(20)} ${String(b.above).padStart(4)} above grade ${budget.threshold} of ${b.total}`,
  );
const worst = [...hard].sort((a, b) => b.grade - a.grade);
console.log(`worst ${Math.min(5, worst.length)}:`);
for (const r of worst.slice(0, 5))
  console.log(`  ${r.grade.toFixed(1)}  ${r.id} ${r.path}: ${r.text.slice(0, 110)}`);
if (process.argv.includes("--report"))
  for (const r of worst) console.log(`${r.grade.toFixed(1)}\t${r.id}\t${r.path}\t${r.text}`);
console.log(`above grade ${budget.threshold}: ${hard.length}, ceiling: ${budget.ceiling}`);
if (!problems.length && hard.length < budget.ceiling)
  console.log(
    `note: the count is below the ceiling; lower "ceiling" in data/family-readability-budget.json to ${hard.length}.`,
  );

if (problems.length) {
  for (const p of problems) console.error(`FAIL ${p}`);
  process.exit(1);
}
console.log("OK validate-family-readability (self-tests passed)");
