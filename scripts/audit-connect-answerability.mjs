#!/usr/bin/env node
/**
 * audit-connect-answerability.mjs
 *
 * The Connect ("Real-World Connection") phase poses a scenario question — "your
 * friend says 35% off, another says 60% off, who is right?" — and then, before
 * this audit existed, gave the student nothing to answer it with: the sentence
 * frame drew read-only `___` spans, Submit replied "Great response!" no matter
 * what was typed, and the correct answer was never shown. A student could
 * complete the phase without ever settling the question or learning the answer.
 *
 * The renderer now supports three authored fields that close that loop:
 *
 *   connect.check[]      auto-graded questions with immediate feedback
 *   connect.answers[]    accepted answer per `___` blank in connect.prompt
 *   connect.modelAnswer  the resolution, revealed after submit
 *
 * This audit reports which lessons still lack them, and — the part a presence
 * check cannot do — verifies that what IS authored is internally sound:
 * `answers` must line up with the blank count, `check[].answer` must index a
 * real choice, and an authored explanation must exist. It also self-tests its
 * own detectors first, because a gate that silently stops firing reports a
 * perfectly clean fleet.
 *
 * Usage:
 *   node scripts/audit-connect-answerability.mjs           # report
 *   node scripts/audit-connect-answerability.mjs --check   # exit 1 on defects
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const REPORT = join(ROOT, "reports", "connect-answerability.md");

/** Number of `___` blanks in an authored sentence frame. */
export function blankCount(prompt) {
  return String(prompt || "").split("___").length - 1;
}

/**
 * Defects in one lesson's `connect` block. Returns [] for a sound lesson.
 * Severity `gap` = nothing to answer; `defect` = authored but broken.
 */
export function inspectConnect(cfg) {
  const out = [];
  if (!cfg || typeof cfg !== "object") return out;

  const blanks = blankCount(cfg.prompt);
  const check = Array.isArray(cfg.check) ? cfg.check : [];
  const answers = Array.isArray(cfg.answers) ? cfg.answers : null;

  // ── Coverage gaps ──
  if (check.length === 0)
    out.push({ severity: "gap", code: "no-check", detail: "no connect.check questions" });
  if (blanks > 0 && !answers)
    out.push({
      severity: "gap",
      code: "no-answers",
      detail: `${blanks} blank(s) with no connect.answers`,
    });
  if (!cfg.modelAnswer && !cfg.diagram?.caption && !cfg.visual?.caption)
    out.push({
      severity: "gap",
      code: "no-model-answer",
      detail: "no connect.modelAnswer and no caption fallback",
    });

  // ── Defects in what IS authored ──
  if (answers && answers.length !== blanks)
    out.push({
      severity: "defect",
      code: "answers-arity",
      detail: `connect.answers has ${answers.length} entries for ${blanks} blank(s)`,
    });
  if (answers)
    answers.forEach((a, i) => {
      const list = Array.isArray(a) ? a : [a];
      if (a !== null && list.some((v) => v === undefined || String(v).trim() === ""))
        out.push({
          severity: "defect",
          code: "answer-empty",
          detail: `connect.answers[${i}] is empty`,
        });
    });

  check.forEach((q, i) => {
    if (!q || !q.stem) {
      out.push({
        severity: "defect",
        code: "check-no-stem",
        detail: `connect.check[${i}] has no stem`,
      });
      return;
    }
    const choices = Array.isArray(q.choices) ? q.choices : [];
    if (choices.length < 2)
      out.push({
        severity: "defect",
        code: "check-choices",
        detail: `connect.check[${i}] has <2 choices`,
      });
    const idx = Number(q.answer ?? q.correct);
    if (!Number.isInteger(idx) || idx < 0 || idx >= choices.length)
      out.push({
        severity: "defect",
        code: "check-answer-range",
        detail: `connect.check[${i}].answer=${q.answer} is out of range for ${choices.length} choices`,
      });
    if (!q.explanation || String(q.explanation).trim().length < 10)
      out.push({
        severity: "defect",
        code: "check-no-explanation",
        detail: `connect.check[${i}] has no explanation`,
      });
    const dupes = new Set(choices.map((c) => String(c).trim().toLowerCase()));
    if (dupes.size !== choices.length)
      out.push({
        severity: "defect",
        code: "check-dupe-choices",
        detail: `connect.check[${i}] has duplicate choices`,
      });
  });

  return out;
}

/** Self-test: every detector must fire on a case built to trip it. */
function selfTest() {
  const cases = [
    [{ prompt: "a ___ b", answers: ["1"], check: [], modelAnswer: "x" }, "no-check"],
    [
      {
        prompt: "a ___ b",
        check: [{ stem: "s", choices: ["a", "b"], answer: 0, explanation: "because reasons" }],
        modelAnswer: "x",
      },
      "no-answers",
    ],
    [
      {
        prompt: "no blanks",
        answers: null,
        check: [{ stem: "s", choices: ["a", "b"], answer: 0, explanation: "because reasons" }],
      },
      "no-model-answer",
    ],
    [
      {
        prompt: "a ___ b ___ c",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a", "b"], answer: 0, explanation: "because reasons" }],
      },
      "answers-arity",
    ],
    [
      {
        prompt: "a ___ b",
        answers: [""],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a", "b"], answer: 0, explanation: "because reasons" }],
      },
      "answer-empty",
    ],
    [
      {
        prompt: "a ___ b",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ choices: ["a", "b"], answer: 0 }],
      },
      "check-no-stem",
    ],
    [
      {
        prompt: "a ___ b",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a"], answer: 0, explanation: "because reasons" }],
      },
      "check-choices",
    ],
    [
      {
        prompt: "a ___ b",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a", "b"], answer: 5, explanation: "because reasons" }],
      },
      "check-answer-range",
    ],
    [
      {
        prompt: "a ___ b",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a", "b"], answer: 0 }],
      },
      "check-no-explanation",
    ],
    [
      {
        prompt: "a ___ b",
        answers: ["1"],
        modelAnswer: "x",
        check: [{ stem: "s", choices: ["a", "A"], answer: 0, explanation: "because reasons" }],
      },
      "check-dupe-choices",
    ],
  ];
  const failed = [];
  for (const [cfg, code] of cases) {
    if (!inspectConnect(cfg).some((d) => d.code === code)) failed.push(code);
  }
  // A sound config must produce nothing.
  const clean = inspectConnect({
    prompt: "a ___ b",
    answers: ["1"],
    modelAnswer: "x",
    check: [{ stem: "s", choices: ["a", "b"], answer: 0, explanation: "because reasons" }],
  });
  if (clean.length) failed.push(`false-positive:${clean.map((d) => d.code).join(",")}`);
  if (failed.length) {
    console.error(`SELF-TEST FAILED — detectors not firing: ${failed.join(", ")}`);
    process.exit(2);
  }
  console.log(`Self-test: ${cases.length + 1} cases PASS ✅`);
}

function main() {
  selfTest();
  const check = process.argv.includes("--check");

  const ids = readdirSync(LESSONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(LESSONS, d.name, "config.json")))
    .map((d) => d.name)
    .sort();

  const rows = [];
  let withConnect = 0;
  for (const id of ids) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    } catch (e) {
      rows.push({
        id,
        defects: [{ severity: "defect", code: "unparseable", detail: String(e.message) }],
      });
      continue;
    }
    if (!cfg.connect || typeof cfg.connect !== "object") continue;
    withConnect += 1;
    const defects = inspectConnect(cfg.connect);
    if (defects.length) rows.push({ id, defects });
  }

  const hardDefects = rows.flatMap((r) => r.defects.filter((d) => d.severity === "defect"));
  const gapLessons = rows.filter((r) => r.defects.some((d) => d.severity === "gap"));
  const clean = withConnect - rows.length;

  const byCode = {};
  for (const r of rows) for (const d of r.defects) byCode[d.code] = (byCode[d.code] || 0) + 1;

  const lines = [
    "# Connect Answerability Audit",
    "",
    `Lessons with a \`connect\` block: **${withConnect}**`,
    `Fully answerable (check + answers + model answer): **${clean}**`,
    `Lessons with coverage gaps: **${gapLessons.length}**`,
    `Hard defects (authored but broken): **${hardDefects.length}**`,
    "",
    "## Counts by code",
    "",
    "| code | count |",
    "| --- | --- |",
    ...Object.entries(byCode)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `| \`${c}\` | ${n} |`),
    "",
    "## Per-lesson",
    "",
    "| lesson | severity | code | detail |",
    "| --- | --- | --- | --- |",
    ...rows.flatMap((r) =>
      r.defects.map((d) => `| ${r.id} | ${d.severity} | \`${d.code}\` | ${d.detail} |`),
    ),
    "",
  ];
  // `reports/` is gitignored, so it does not exist in a fresh clone, in CI, or
  // in the detached ship worktree — where this gate has to run.
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, lines.join("\n"));

  console.log(
    `Connect answerability: ${clean}/${withConnect} lessons fully answerable · ` +
      `${gapLessons.length} with gaps · ${hardDefects.length} hard defect(s)`,
  );
  console.log(`Report → reports/connect-answerability.md`);

  // --check gates on hard defects only. Coverage gaps are reported, not fatal,
  // so adding the audit does not immediately break every existing deploy.
  if (check && hardDefects.length) {
    console.error(`FAIL: ${hardDefects.length} hard defect(s) in authored Connect content.`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("audit-connect-answerability.mjs")) main();
