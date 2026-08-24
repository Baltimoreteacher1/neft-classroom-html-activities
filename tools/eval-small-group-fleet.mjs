#!/usr/bin/env node
// eval-small-group-fleet.mjs — fleet evaluation for the 148 generated
// small-group and catch-up lessons.
//
// WHY THIS EXISTS
//
// These lessons are not 148 hand-authored files; they are one generator's output.
// That changes the shape of the risk completely. A single bad template does not
// produce one bad lesson, it produces six identical ones — which is exactly what
// happened when `small-group-parallel-practice.mjs` and `verticalDecimal()` each
// taught every decimal operation as ADDITION, so lessons 1.5, 1.6 and 1.7 asked
// students to multiply and then coached them to "line up the place values".
//
// Every gate in this repo is per-file and structural. `validate:math` is the
// strongest one and it is genuinely good — 1,819 arithmetic checks — but it
// verifies that ANSWERS are right. It cannot see that the answer is right while
// the scaffold beside it describes the wrong operation, which is the defect class
// that actually shipped, and which a student reads instead of the answer key.
//
// So this tool treats the generator as the artifact under test and the lessons as
// its output distribution. It sweeps the whole fleet, reports pass rates per
// stratum (unit × variant), and fails the build on the defect classes no other
// gate can see:
//
//   1. OPERATOR/SCAFFOLD MISMATCH — the shipped bug. A × stem coached as addition,
//      a ÷ stem coached as "multiply as whole numbers", and so on.
//   2. GIVE-AWAY HINTS — a hint that contains the final answer verbatim, so the
//      scaffold replaces the thinking instead of supporting it.
//   3. ERROR-ANALYSIS CONTRACT — errorStep is 0-based into workedExample; an
//      out-of-range value makes the correct step unreachable and the item
//      unsolvable, silently.
//   4. CHOICE FEEDBACK ALIGNMENT — choiceFeedback misaligned with choices means a
//      student gets another distractor's coaching.
//   5. NEGATIVE FEEDBACK ON THE CORRECT CHOICE — telling a student who is right
//      that they are wrong.
//
// It also reports (without failing) the authored-misconception coverage gap, since
// that is the input the new detector and the next-move recommendation both run on.
//
// Usage:
//   node tools/eval-small-group-fleet.mjs            # sweep + report + gate
//   node tools/eval-small-group-fleet.mjs --selftest # prove every detector fires
//   node tools/eval-small-group-fleet.mjs --report   # write the markdown report

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKS,
  checkChoiceFeedback,
  checkErrorAnalysis,
  checkGiveAway,
  checkOperatorConsistency,
  scaffoldText,
  stemOperator,
} from "./lib/practice-detectors.mjs";

const LESSONS = "lessons";
const REPORT = "reports/small-group-fleet-eval.md";
const VARIANT_RE = /^(\d{1,2})-(\d{1,2})-(group1|group2|catchup)$/;

// ---------------------------------------------------------------- detectors

// Language that only belongs to ONE operation. Keyed by the operation whose
// scaffolding the phrase describes; a phrase appearing beside a different
// operator is the shipped defect.

// ------------------------------------------------------------------- sweep

function itemsOf(config) {
  const out = [];
  const practice = config.practice || {};
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    (practice[tier] || []).forEach((item, index) => {
      if (item && typeof item === "object") out.push({ item, label: `practice.${tier}[${index}]` });
    });
  }
  // Generated parallel sets are keyed numerically and are the surface the
  // decimal defect actually shipped through.
  const parallel = config.parallelPractice || {};
  for (const key of Object.keys(parallel)) {
    const entry = parallel[key];
    if (entry && typeof entry === "object" && (entry.stem || entry.answer)) {
      out.push({ item: entry, label: `parallelPractice.${key}` });
    }
  }
  const ticket = config.exitTicket || config.check;
  if (ticket && typeof ticket === "object") out.push({ item: ticket, label: "exitTicket" });
  return out;
}

function sweep() {
  const lessons = readdirSync(LESSONS)
    .filter((name) => VARIANT_RE.test(name))
    .sort();
  const findings = [];
  const strata = new Map();
  let items = 0;
  let taggedItems = 0;

  for (const lesson of lessons) {
    const file = join(LESSONS, lesson, "config.json");
    if (!existsSync(file)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      findings.push({
        kind: "unparseable-config",
        where: lesson,
        detail: String(error.message),
        stem: "",
      });
      continue;
    }
    const [, unit, , variant] = lesson.match(VARIANT_RE);
    const key = `unit ${unit} · ${variant}`;
    const stratum = strata.get(key) || { lessons: 0, items: 0, findings: 0 };
    stratum.lessons += 1;

    for (const { item, label } of itemsOf(config)) {
      items += 1;
      stratum.items += 1;
      if (Array.isArray(item.misconceptionTags) && item.misconceptionTags.some(Boolean)) {
        taggedItems += 1;
      }
      const before = findings.length;
      for (const check of CHECKS) check(item, findings, `${lesson} · ${label}`);
      stratum.findings += findings.length - before;
    }
    strata.set(key, stratum);
  }
  return { lessons: lessons.length, items, taggedItems, findings, strata };
}

// ---------------------------------------------------------------- selftest
// A gate that stops firing reports a clean fleet, which is the most expensive
// failure mode available here. Every detector must prove it still fires.
function selftest() {
  const cases = [
    [
      "operator-scaffold-mismatch",
      {
        stem: "What is 4.51 × 1.2?",
        answer: "5.412",
        hints: ["Line up the decimal points, then add."],
      },
    ],
    [
      "operator-scaffold-mismatch",
      {
        stem: "Compute 7.2 ÷ 0.4.",
        answer: "18",
        hints: ["Multiply as whole numbers, then count the total decimal places."],
      },
    ],
    [
      "give-away-hint",
      { stem: "What is 3.4 × 2.6?", answer: "8.84", hints: ["The answer is 8.84."] },
    ],
    [
      "error-step-out-of-range",
      { stem: "Find the break.", workedExample: [{ label: "a" }, { label: "b" }], errorStep: 7 },
    ],
    [
      "choice-feedback-misaligned",
      { stem: "Pick one.", choices: ["a", "b", "c"], choiceFeedback: ["x"], correctIndex: 0 },
    ],
    [
      "division-workspace-off-task",
      {
        // The 1-1 shape, moved into a field the extractor still reads: the
        // workspace mounts, but nothing in the task asks for division. (An
        // estimation wording would be suppressed by the extractor itself —
        // that guard has its own coverage in the engine test.)
        stem: "Explain your reasoning to a partner.",
        work: "936 ÷ 4",
        answer: "234",
      },
    ],
    [
      "negative-feedback-on-correct-choice",
      {
        stem: "Pick one.",
        choices: ["a", "b"],
        choiceFeedback: ["Not quite — look closer.", ""],
        correctIndex: 0,
      },
    ],
  ];
  const clean = [
    { stem: "What is 4.51 × 1.2?", answer: "5.412", hints: ["Multiply as whole numbers first."] },
    { stem: "Add 4.5 + 1.25.", answer: "5.75", hints: ["Line up the decimal points."] },
    {
      stem: "What is 3.4 × 2.6?",
      answer: "8.84",
      hints: ["Count the decimal places in both factors."],
    },
    { stem: "Find the break.", workedExample: [{ label: "a" }, { label: "b" }], errorStep: 0 },
    { stem: "Pick one.", choices: ["a", "b"], choiceFeedback: ["", "Not quite."], correctIndex: 0 },
  ];

  let failures = 0;
  for (const [expected, item] of cases) {
    const found = [];
    for (const check of CHECKS) check(item, found, "selftest");
    if (!found.some((finding) => finding.kind === expected)) {
      console.error(`SELFTEST FAIL: ${expected} did not fire on ${JSON.stringify(item.stem)}`);
      failures += 1;
    }
  }
  for (const item of clean) {
    const found = [];
    for (const check of CHECKS) check(item, found, "selftest");
    if (found.length) {
      console.error(
        `SELFTEST FAIL: false positive on a correct item ${JSON.stringify(item.stem)} → ${found
          .map((finding) => finding.kind)
          .join(", ")}`,
      );
      failures += 1;
    }
  }
  if (failures) {
    console.error(`\n${failures} selftest failure(s) — the fleet gate is not trustworthy.`);
    process.exit(1);
  }
  console.log(
    `fleet eval selftest: ${cases.length} detectors fire, ${clean.length} clean items stay quiet.`,
  );
}

// ------------------------------------------------------------------ report

function writeReport(result) {
  const { lessons, items, taggedItems, findings, strata } = result;
  const byKind = new Map();
  for (const finding of findings) {
    byKind.set(finding.kind, [...(byKind.get(finding.kind) || []), finding]);
  }
  const lines = [
    "# Small-group fleet evaluation",
    "",
    "Generated by `npm run eval:small-groups`. These lessons are one generator's",
    "output, so a defect is correlated across the fleet rather than isolated to a",
    "file. This report measures the output distribution; `validate:math` covers",
    "answer arithmetic and is not repeated here.",
    "",
    `- Lessons swept: **${lessons}**`,
    `- Practice items examined: **${items}**`,
    `- Findings: **${findings.length}**`,
    `- Authored misconception coverage: **${taggedItems}/${items}** items carry a \`misconceptionTags\` entry`,
    "",
    "## Findings by class",
    "",
  ];
  if (!findings.length) {
    lines.push("None. Every detector ran and stayed quiet.", "");
  } else {
    for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
      lines.push(`### ${kind} — ${list.length}`, "");
      for (const finding of list.slice(0, 25)) {
        lines.push(`- \`${finding.where}\` — ${finding.detail}`);
        if (finding.stem) lines.push(`  - stem: ${String(finding.stem).slice(0, 140)}`);
      }
      if (list.length > 25) lines.push(`- …and ${list.length - 25} more`);
      lines.push("");
    }
  }
  lines.push(
    "## Coverage by stratum",
    "",
    "| stratum | lessons | items | findings |",
    "| --- | --- | --- | --- |",
  );
  for (const [key, stratum] of [...strata].sort()) {
    lines.push(`| ${key} | ${stratum.lessons} | ${stratum.items} | ${stratum.findings} |`);
  }
  lines.push("");
  mkdirSync("reports", { recursive: true });
  writeFileSync(REPORT, lines.join("\n"));
  return REPORT;
}

// -------------------------------------------------------------------- main

const args = new Set(process.argv.slice(2));
if (args.has("--selftest")) {
  selftest();
  process.exit(0);
}

// Always self-test before sweeping, for the same reason validate:math does.
selftest();
const result = sweep();
const path = writeReport(result);

console.log(
  `Small-group fleet eval — ${result.lessons} lessons, ${result.items} items, ${result.findings.length} findings`,
);
console.log(
  `  authored misconception coverage: ${result.taggedItems}/${result.items} items (${(
    (result.taggedItems / Math.max(1, result.items)) * 100
  ).toFixed(1)}%)`,
);
console.log(`  report: ${path}`);

if (result.findings.length) {
  const byKind = new Map();
  for (const finding of result.findings)
    byKind.set(finding.kind, (byKind.get(finding.kind) || 0) + 1);
  console.error("\nFleet defects found:");
  for (const [kind, count] of [...byKind].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${kind}: ${count}`);
  }
  console.error(
    `\nSee ${path}. These are generator-level defects — fix the template, not the file.`,
  );
  process.exit(1);
}
console.log("\n✓ No fleet defects found.");
