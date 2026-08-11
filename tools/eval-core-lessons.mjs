#!/usr/bin/env node
// eval-core-lessons.mjs — content evaluation for the 84 hand-authored core lessons.
//
// WHY THIS EXISTS
//
// Every gate in this repo checks the core lessons structurally. validate:math
// proves 1,819 answers are arithmetically right. lesson-tool-coverage proves the
// manipulatives mount. lesson-static-pages-fresh proves the generated pages match
// their config. Not one of them can see a problem whose ANSWER is correct while
// the coaching beside it describes a different problem — and that is what a
// student actually reads when they are stuck.
//
// That defect class is real here, not hypothetical. Lesson 2-5 shipped a
// shape-of-distribution question whose distractor feedback read "Count dots at
// heights below your target height" — coaching lifted from a dot-plot item that
// no longer existed anywhere in the lesson. It parsed, it linted, its answer key
// was right, and every gate passed.
//
// tools/eval-small-group-fleet.mjs already hunts exactly this class across the
// 148 GENERATED lessons. The detectors were extracted to
// tools/lib/practice-detectors.mjs so the hand-authored lessons — the ones every
// student meets first — get the same sweep.
//
// The detectors self-test before the sweep runs. A detector that silently stops
// firing reports a flawless curriculum, which is worse than no gate at all.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKS,
  checkChoiceFeedback,
  checkErrorAnalysis,
  checkGiveAway,
  checkOperatorConsistency,
} from "./lib/practice-detectors.mjs";

const root = join(import.meta.dirname, "..");
const LESSONS = join(root, "lessons");
const CORE_RE = /^\d+-\d+$/;

// ------------------------------------------------------------------ selftest

function selftest() {
  const fire = [];
  const quiet = [];

  // Each fixture is a defect this sweep exists to catch.
  checkOperatorConsistency(
    { stem: "What is 2.5 × 1.2?", hints: ["Line up the decimal points before you start."] },
    fire,
    "fixture:operator",
  );
  checkGiveAway(
    { stem: "What is 2.6 × 3.4?", answer: "8.84", hints: ["The answer is 8.84."] },
    fire,
    "fixture:giveaway",
  );
  checkErrorAnalysis(
    { workedExample: [{ label: "Step 1", work: "…" }], errorStep: 7 },
    fire,
    "fixture:errorstep",
  );
  checkChoiceFeedback(
    { choices: ["a", "b", "c"], choiceFeedback: ["", ""], correctIndex: 0 },
    fire,
    "fixture:misaligned",
  );
  checkChoiceFeedback(
    {
      choices: ["a", "b"],
      choiceFeedback: ["Not quite — try again.", "b is wrong"],
      correctIndex: 0,
    },
    fire,
    "fixture:negative-on-correct",
  );

  // …and each of these is legitimate content that must NOT be reported.
  checkOperatorConsistency(
    { stem: "What is 2.5 + 1.2?", hints: ["Line up the decimal points before you start."] },
    quiet,
    "fixture:ok-operator",
  );
  checkGiveAway(
    { stem: "What is 2.6 × 3.4?", answer: "8.84", hints: ["Multiply as whole numbers first."] },
    quiet,
    "fixture:ok-giveaway",
  );
  checkErrorAnalysis(
    {
      workedExample: [
        { label: "Step 1", work: "…" },
        { label: "Step 2", work: "…" },
      ],
      errorStep: 1,
    },
    quiet,
    "fixture:ok-errorstep",
  );
  checkChoiceFeedback(
    { choices: ["a", "b"], choiceFeedback: ["", "b is wrong because…"], correctIndex: 0 },
    quiet,
    "fixture:ok-feedback",
  );

  if (fire.length !== 5 || quiet.length !== 0) {
    console.error(
      `core lesson eval SELFTEST FAILED — expected 5 fires and 0 false alarms, got ${fire.length} and ${quiet.length}`,
    );
    process.exit(1);
  }
  console.log(
    `core lesson eval selftest: ${fire.length} detectors fire, 4 clean items stay quiet.`,
  );
}

// --------------------------------------------------------------------- sweep

/* The generated lessons carry a literal `answer` field; core multiple-choice
   items carry `choices` + `correctIndex` instead. Deriving the answer text here
   is what lets the give-away detector see a hint that simply states the correct
   choice. Connect checks name the key `answer` rather than `correctIndex`. */
function normalize(item) {
  if (item.answer !== undefined) return item;
  const index = Number.isInteger(item.correctIndex) ? item.correctIndex : item.answer;
  if (!Array.isArray(item.choices) || !Number.isInteger(index)) return item;
  const answer = item.choices[index];
  /* A hint cannot give away something the QUESTION already prints. When the
     correct choice is an entity named in the stem ("Chef B", "Runner A"), a hint
     that says "compare Chef B's rate" is ordinary coaching, not a leak — so the
     give-away check only applies to answers the stem does not already contain. */
  if (typeof answer === "string" && String(item.stem || "").includes(answer)) return item;
  return { ...item, answer, correctIndex: index };
}

function itemsOf(config) {
  const out = [];
  const practice = config.practice || {};
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    (practice[tier] || []).forEach((item, index) => {
      if (item && typeof item === "object")
        out.push({ item: normalize(item), label: `practice.${tier}[${index}]` });
    });
  }
  const ticket = config.reflect?.exitTicket;
  if (ticket && typeof ticket === "object")
    out.push({ item: normalize(ticket), label: "reflect.exitTicket" });
  // Connect's comprehension checks are answered before the practice set, and
  // carry their own explanations.
  (config.connect?.check || []).forEach((item, index) => {
    if (item && typeof item === "object")
      out.push({ item: normalize(item), label: `connect.check[${index}]` });
  });
  return out;
}

function sweep() {
  const lessons = readdirSync(LESSONS)
    .filter((name) => CORE_RE.test(name))
    .sort();
  const findings = [];
  let items = 0;

  for (const lesson of lessons) {
    const file = join(LESSONS, lesson, "config.json");
    let config;
    try {
      config = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      findings.push({ kind: "unreadable-config", where: lesson, detail: err.message });
      continue;
    }
    for (const { item, label } of itemsOf(config)) {
      items += 1;
      for (const check of CHECKS) check(item, findings, `${lesson} ${label}`);
    }
  }
  return { lessons: lessons.length, items, findings };
}

// ---------------------------------------------------------------------- main

selftest();
const result = sweep();

if (result.lessons < 80) {
  console.error(
    `core lesson eval found only ${result.lessons} lessons — the sweep is not reaching the curriculum`,
  );
  process.exit(1);
}

console.log(
  `Core lesson eval — ${result.lessons} lessons, ${result.items} items, ${result.findings.length} findings`,
);

if (result.findings.length) {
  const byKind = new Map();
  for (const f of result.findings) byKind.set(f.kind, (byKind.get(f.kind) || 0) + 1);
  console.error("\nCore lesson content defects:");
  for (const [kind, count] of [...byKind].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${kind}: ${count}`);
  }
  console.error("");
  for (const f of result.findings.slice(0, 40)) {
    console.error(`  ${f.where} — ${f.detail}`);
    if (f.stem) console.error(`      stem: ${String(f.stem).slice(0, 120)}`);
  }
  if (result.findings.length > 40) console.error(`  …and ${result.findings.length - 40} more`);
  process.exit(1);
}
console.log("\n✓ No core lesson content defects found.");
