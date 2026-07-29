#!/usr/bin/env node
/**
 * Self-test for the math answer gate.
 *
 * A validator that stops firing is indistinguishable from a clean curriculum,
 * so this asserts on both directions: known-good answers must PASS, known-wrong
 * answers must FAIL, and genuinely ambiguous shapes must SKIP (never fail).
 *
 * Run: npm run validate:math:selftest
 */
import { validateConfig } from "./validate-math.mjs";

const cases = [
  // --- must FAIL (a wrong answer that reaches a student is the whole point) ---
  {
    want: "fail",
    name: "wrong quotient",
    config: { practice: { rows: [{ given: "672 ÷ 8", answer: "85" }] } },
  },
  {
    want: "fail",
    name: "wrong order of operations",
    config: { practice: { diagram: { start: "4 × 5 + 3²", answer: "169" } } },
  },
  {
    want: "fail",
    name: "wrong fraction division",
    config: { explore: { rows: [{ problem: "3/4 ÷ 1/8", answer: "3/32" }] } },
  },
  {
    want: "fail",
    name: "wrong prime factorization",
    config: { practice: { rows: [{ given: "24", answer: "2 × 2 × 3" }] } },
  },
  {
    want: "fail",
    name: "non-prime in factor-tree answer",
    config: { practice: { rows: [{ given: "24", split: "4 × 6", answer: "4 × 6" }] } },
  },
  {
    want: "fail",
    name: "wrong GCF",
    config: { practice: { rows: [{ given: "18 and 24", shared: "2 × 3", answer: "12" }] } },
  },
  {
    want: "fail",
    name: "wrong LCM",
    config: {
      practice: { rows: [{ given: "6 and 10", first: "6, 12", second: "10, 20", answer: "60" }] },
    },
  },
  {
    want: "fail",
    name: "wrong remainder",
    config: { practice: { rows: [{ given: "2,578 ÷ 13", answer: "198", remainder: "9" }] } },
  },
  {
    want: "fail",
    name: "wrong equation solution",
    config: { explore: { rows: [{ equation: "3x = 21", solution: "x = 8" }] } },
  },
  {
    want: "fail",
    name: "wrong balance-scale answer",
    config: { practice: { equation: "2n + 3 = 11", variable: "n", answer: 5 } },
  },
  {
    want: "fail",
    name: "wrong blank fill",
    config: { practice: { rows: [{ given: "4.7 + ___ = 10", answer: "5.7" }] } },
  },
  {
    want: "fail",
    name: "work does not match problem",
    config: { practice: { rows: [{ given: "24", split: "4 × 5", answer: "2 × 2 × 2 × 3" }] } },
  },
  {
    want: "fail",
    name: "inconsistent equivalent forms",
    config: { practice: { rows: [{ answer: "5/2 = 2 1/4" }] } },
  },
  {
    want: "fail",
    name: "decimal precision",
    config: { practice: { rows: [{ given: "0.1 + 0.2", answer: "0.30001" }] } },
  },

  // --- must PASS (real shapes lifted from the curriculum) ---
  {
    want: "pass",
    name: "correct quotient",
    config: { practice: { rows: [{ given: "672 ÷ 8", answer: "84" }] } },
  },
  {
    want: "pass",
    name: "order of operations",
    config: { practice: { diagram: { start: "4 × 5 + 3²", answer: "29" } } },
  },
  {
    want: "pass",
    name: "implicit multiplication",
    config: { practice: { diagram: { start: "2(9 - 4)", answer: "10" } } },
  },
  {
    want: "pass",
    name: "fraction division",
    config: { explore: { rows: [{ problem: "3/4 ÷ 1/8", answer: "6" }] } },
  },
  {
    want: "pass",
    name: "mixed number division",
    config: { explore: { rows: [{ problem: "2 1/2 ÷ 1/2", answer: "5" }] } },
  },
  {
    want: "pass",
    name: "whole ÷ unit fraction",
    config: { practice: { rows: [{ given: "12 ÷ 1/2", answer: "24" }] } },
  },
  {
    want: "pass",
    name: "prime factorization",
    config: { practice: { rows: [{ given: "24", split: "4 × 6", answer: "2 × 2 × 2 × 3" }] } },
  },
  {
    want: "pass",
    name: "exponent factorization",
    config: {
      practice: { rows: [{ given: "72", expanded: "2 × 2 × 2 × 3 × 3", answer: "2³ × 3²" }] },
    },
  },
  {
    want: "pass",
    name: "GCF",
    config: { practice: { rows: [{ given: "18 and 24", shared: "2 × 3", answer: "6" }] } },
  },
  {
    want: "pass",
    name: "LCM",
    config: {
      practice: { rows: [{ given: "6 and 10", first: "6, 12", second: "10, 20", answer: "30" }] },
    },
  },
  {
    want: "pass",
    name: "division with remainder",
    config: { practice: { rows: [{ given: "2,578 ÷ 13", answer: "198", remainder: "4" }] } },
  },
  {
    want: "pass",
    name: "equation solution",
    config: { explore: { rows: [{ equation: "3x = 21", solution: "x = 7" }] } },
  },
  {
    want: "pass",
    name: "balance scale",
    config: { practice: { equation: "2n + 3 = 11", variable: "n", answer: 4 } },
  },
  {
    want: "pass",
    name: "blank fill",
    config: { practice: { rows: [{ given: "4.7 + ___ = 10", answer: "5.3" }] } },
  },
  {
    want: "pass",
    name: "equivalent forms",
    config: { practice: { rows: [{ answer: "5/2 = 2 1/2" }] } },
  },
  {
    want: "pass",
    name: "decimal / percent equivalence",
    config: { practice: { rows: [{ answer: "0.5 = 50%" }] } },
  },
  {
    want: "pass",
    name: "units on answer",
    config: { practice: { rows: [{ given: "10 × 4 × 3 ÷ 2", answer: "60 in³" }] } },
  },
  {
    want: "pass",
    name: "float-safe decimals",
    config: { practice: { rows: [{ given: "0.1 + 0.2", answer: "0.3" }] } },
  },
  {
    want: "pass",
    name: "decimal scaling work",
    config: {
      practice: {
        rows: [{ given: "2.5 × 4", whole: "25 × 4 = 100", places: "1", answer: "10.0" }],
      },
    },
  },
  {
    want: "pass",
    name: "KCF work shown",
    config: { practice: { rows: [{ given: "1/2 ÷ 1/6", kcf: "1/2 × 6/1 = 6/2", answer: "3" }] } },
  },

  // --- guided-step prompts (the bulk of the curriculum's answers) ---
  {
    want: "pass",
    name: "step expression",
    config: { steps: [{ prompt: "Base area: 3 × 5 = ___.", answer: "15" }] },
  },
  {
    want: "fail",
    name: "wrong step expression",
    config: { steps: [{ prompt: "Base area: 3 × 5 = ___.", answer: "8" }] },
  },
  {
    want: "pass",
    name: "step with leading verb",
    config: { steps: [{ prompt: "Multiply 2 × 2: ___.", answer: "4" }] },
  },
  {
    want: "pass",
    name: "correctly rounded step",
    config: { steps: [{ prompt: "Second rate: 5 ÷ 3 = ___.", answer: "1.6667" }] },
  },
  {
    want: "fail",
    name: "incorrectly rounded step",
    config: { steps: [{ prompt: "Second rate: 5 ÷ 3 = ___.", answer: "1.6000" }] },
  },
  {
    want: "pass",
    name: "list factors",
    config: { steps: [{ prompt: "List the factors of 18: ___.", answer: "1, 2, 3, 6, 9, 18" }] },
  },
  {
    want: "fail",
    name: "missing a factor",
    config: { steps: [{ prompt: "List the factors of 18: ___.", answer: "1, 2, 3, 6, 18" }] },
  },
  {
    want: "pass",
    name: "percent to decimal",
    config: { steps: [{ prompt: "Write 5% as a decimal: ___.", answer: "0.05" }] },
  },
  {
    want: "fail",
    name: "percent to decimal off by 10x",
    config: { steps: [{ prompt: "Write 5% as a decimal: ___.", answer: "0.5" }] },
  },
  {
    want: "pass",
    name: "reciprocal",
    config: { steps: [{ prompt: "Use the reciprocal of 1/4: ___.", answer: "4" }] },
  },
  {
    want: "fail",
    name: "wrong reciprocal",
    config: { steps: [{ prompt: "Use the reciprocal of 1/4: ___.", answer: "1/4" }] },
  },

  // --- must SKIP (undecidable — a false alarm here poisons the gate) ---
  {
    want: "skip",
    name: "non-numeric step answer",
    config: { steps: [{ prompt: "Use the symbol ___.", answer: ">" }] },
  },
  {
    want: "skip",
    name: "inequality step answer",
    config: { steps: [{ prompt: "Write the inequality: ___.", answer: "x > 5" }] },
  },
  {
    want: "skip",
    name: "word-problem prose",
    config: {
      practice: { rows: [{ problem: "A detective has 3/4 pound of plaster.", answer: "6" }] },
    },
  },
  {
    want: "skip",
    name: "non-numeric answer",
    config: {
      practice: {
        level0: { cloze: "A number with two factors is a ___ number.", answer: "prime" },
      },
    },
  },
  {
    want: "skip",
    name: "ambiguous pair",
    config: { practice: { rows: [{ given: "8 and 12", answer: "4" }] } },
  },
  // "24 → 4 × 6" with no factor-tree sibling may legitimately be "write 24 as a
  // product", so the gate must not call it wrong on its own.
  {
    want: "pass",
    name: "product without factor-tree context",
    config: { practice: { rows: [{ given: "24", answer: "4 × 6" }] } },
  },
];

let failed = 0;
for (const c of cases) {
  const r = validateConfig(c.config);
  const got = r.failures.length > 0 ? "fail" : r.checked > 0 ? "pass" : "skip";
  if (got !== c.want) {
    failed++;
    console.log(`✗ ${c.name}: expected ${c.want}, got ${got}`);
    for (const f of r.failures) console.log(`    [${f.rule}] ${f.detail}`);
    if (got === "skip") console.log("    (no rule produced a decidable check)");
  }
}

console.log(
  failed
    ? `\n${failed}/${cases.length} self-test cases wrong`
    : `✓ math gate self-test: ${cases.length}/${cases.length}`,
);
process.exit(failed ? 1 : 0);
