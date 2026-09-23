#!/usr/bin/env node
/**
 * Self-test for the distractor gate.
 *
 * The whole-curriculum sweep reports zero failures. That is only trustworthy if
 * the rules still fire, so every rule here is proved in both directions: a
 * known-bad item must FAIL, the corresponding good item must PASS, and the
 * shapes the gate deliberately does not judge must SKIP.
 *
 * Run: npm run validate:distractors:selftest
 */
import { validateConfig } from "./validate-distractors.mjs";

const item = (o) => ({ practice: { rows: [o] } });

const cases = [
  // --- key-duplicate: two options correct, item unanswerable ----------------
  {
    want: "fail",
    rule: "key-duplicate",
    name: "distractor equals the key in another form",
    config: item({ stem: "What is 5 ÷ 2?", choices: ["2 1/2", "5/2", "3", "10"], correctIndex: 0 }),
  },
  {
    want: "pass",
    name: "distinct values, key unique",
    config: item({ stem: "What is 5 ÷ 2?", choices: ["2 1/2", "2", "3", "10"], correctIndex: 0 }),
  },
  // --- distractor-twin: warning only, must NOT fail -------------------------
  {
    want: "warn",
    rule: "distractor-twin",
    name: "two distractors share a value",
    config: item({
      stem: "What is 1 1/2 ÷ 3/4?",
      choices: ["1 1/8", "2", "3/4", "9/8"],
      correctIndex: 1,
    }),
  },
  // --- key-range ------------------------------------------------------------
  {
    want: "fail",
    rule: "key-range",
    name: "correctIndex past the end",
    config: item({ stem: "Pick one.", choices: ["1", "2"], correctIndex: 4 }),
  },
  {
    want: "fail",
    rule: "key-range",
    name: "scored item with no key at all",
    config: item({ stem: "Pick one.", choices: ["1", "2"], explanation: "because" }),
  },
  // --- feedback-arity -------------------------------------------------------
  {
    want: "fail",
    rule: "feedback-arity",
    name: "one feedback entry short",
    config: item({
      stem: "What is 2 + 2?",
      choices: ["4", "5", "6", "22"],
      correctIndex: 0,
      choiceFeedback: ["yes", "no", "no"],
    }),
  },
  {
    want: "pass",
    name: "feedback lines up 1:1",
    config: item({
      stem: "What is 2 + 2?",
      choices: ["4", "5", "6", "22"],
      correctIndex: 0,
      choiceFeedback: ["yes", "no", "no", "no"],
    }),
  },
  // --- deliberate non-judgements (must SKIP, never fail) --------------------
  // Equal values are the POINT of a form-selection item.
  {
    want: "skip",
    name: "prime factorization: all options equal 36 by design",
    config: item({
      stem: "A factor tree for 36 ends with which prime factors?",
      choices: ["2 × 2 × 3 × 3", "2 × 18", "3 × 12", "6 × 6"],
      correctIndex: 0,
    }),
  },
  {
    want: "skip",
    name: "associative-grouping item with two equal groupings",
    config: item({
      stem: "Which grouping makes 4 × 25 × 7 easiest to multiply mentally?",
      choices: ["(4 × 25) × 7", "4 × (25 + 7)", "(4 + 25) × 7", "(25 × 7) × 4"],
      correctIndex: 0,
    }),
  },
  // "What does 2³ mean?" — the distractors "2 × 3" and "2 + 2 + 2" both make 6,
  // but they encode two DIFFERENT misconceptions (multiply by the exponent vs.
  // add the base that many times). Both are worth keeping.
  {
    want: "skip",
    name: "meaning-of-notation item with two equal-valued misconceptions",
    config: item({
      stem: "What does 2³ mean?",
      choices: ["2 × 2 × 2", "2 × 3", "2 + 2 + 2", "3 × 3"],
      correctIndex: 0,
    }),
  },
  // Histogram bins: "60–63" is a range label, not 60 minus 63.
  {
    want: "skip",
    name: "histogram bin labels are ranges, not subtractions",
    config: item({
      stem: "Which interval has the most players?",
      choices: ["60–63 inches", "64–67 inches", "68–71 inches", "72–75 inches"],
      correctIndex: 2,
    }),
  },
  // Multi-term lists must compare term by term, not on the first term alone.
  {
    want: "pass",
    name: "expression lists differing after the first term",
    config: item({
      stem: "Which list is all equal to 78.5?",
      choices: ["70 + 8.5, 78 + 0.5", "70 + 8.5, 78 + 5", "1 + 1", "2 + 2"],
      correctIndex: 0,
    }),
  },
  {
    want: "skip",
    name: "prose options are not decidable",
    config: item({
      stem: "What happens to the mean?",
      choices: ["The mean is higher", "The mean is lower", "No change", "Cannot tell"],
      correctIndex: 0,
    }),
  },
  // A percent is not its bare number.
  {
    want: "pass",
    name: "50% and 50 are different options",
    config: item({
      stem: "What is half of 100?",
      choices: ["50", "50%", "5", "500"],
      correctIndex: 0,
    }),
  },
];

let failed = 0;
for (const c of cases) {
  const r = validateConfig(c.config);
  const got = r.failures.length
    ? "fail"
    : r.warnings.length
      ? "warn"
      : r.stats.decided > 0
        ? "pass"
        : "skip";
  const ruleOk =
    !c.rule ||
    r.failures.some((f) => f.rule === c.rule) ||
    r.warnings.some((w) => w.rule === c.rule);
  if (got !== c.want || !ruleOk) {
    failed++;
    console.log(`✗ ${c.name}: expected ${c.want}${c.rule ? ` (${c.rule})` : ""}, got ${got}`);
    for (const f of r.failures) console.log(`    FAIL [${f.rule}] ${f.detail}`);
    for (const w of r.warnings) console.log(`    WARN [${w.rule}] ${w.detail}`);
  }
}
console.log(
  failed
    ? `\n${failed}/${cases.length} self-test cases wrong`
    : `✓ distractor gate self-test: ${cases.length}/${cases.length}`,
);
process.exit(failed ? 1 : 0);
