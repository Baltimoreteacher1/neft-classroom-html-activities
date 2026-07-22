#!/usr/bin/env node
/**
 * CI gate: programmatic subset of docs/lesson-quality-rubric.md.
 *
 * Checks structural/mechanical rubric criteria that don't require human judgment:
 * DOK tier presence, duplicated error-analysis stubs, vocab translation completeness,
 * exit-ticket answer-key validity, common-mistake non-genericness, printables/readiness
 * completeness, and unit-mismatched project/graphic-novel links. Human-judgment
 * criteria (engagement, narrative quality, standards precision) stay in the rubric
 * doc for manual/agent audit passes. Run: npm run validate:lesson-quality
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const lessonsDir = join(root, "lessons");

const fails = [];
const warn = (id, msg) => fails.push({ id, level: "warn", msg });
const fail = (id, msg) => fails.push({ id, level: "fail", msg });

const GENERIC_MISTAKE_PATTERNS = [
  /check your work/i,
  /be careful/i,
  /make sure to/i,
  /^students? (may|often|sometimes) (make|make a) mistake/i,
];

for (const id of readdirSync(lessonsDir)) {
  const cfgPath = join(lessonsDir, id, "config.json");
  if (!existsSync(cfgPath)) continue;
  let d;
  try {
    d = JSON.parse(readFileSync(cfgPath, "utf8"));
  } catch (e) {
    fail(id, `config.json is not valid JSON: ${e.message}`);
    continue;
  }

  // 1. DOK tier presence — parent lessons must have all three difficulty tiers non-empty.
  const practice = d.practice || {};
  const isVariant = id.includes("-group") || id.includes("-catchup");
  if (!isVariant) {
    for (const tier of ["approaching", "onLevel", "extending"]) {
      if (!Array.isArray(practice[tier]) || practice[tier].length === 0) {
        fail(id, `practice.${tier} is missing or empty`);
      }
    }
  } else {
    const hasAnyTier = ["approaching", "onLevel", "extending"].some(
      (tier) => Array.isArray(practice[tier]) && practice[tier].length > 0,
    );
    if (!hasAnyTier) {
      fail(id, "variant practice has no tiers populated");
    }
  }

  // 2. Duplicated error-analysis stub — same bug class across tiers must not be
  // byte-identical workedExample content (see WAVE 0/1 of the 2026-07 audit).
  const errorItems = [];
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    for (const item of practice[tier] || []) {
      if (item && item.type === "error-analysis" && item.workedExample) {
        errorItems.push({ tier, key: JSON.stringify(item.workedExample) });
      }
    }
  }
  for (let i = 0; i < errorItems.length; i++) {
    for (let j = i + 1; j < errorItems.length; j++) {
      if (errorItems[i].key === errorItems[j].key) {
        fail(
          id,
          `practice.${errorItems[i].tier} and practice.${errorItems[j].tier} error-analysis workedExample are byte-identical (duplicate stub)`,
        );
      }
    }
  }

  // 3. Common mistake must be specific, not generic filler.
  const commonMistake = practice.commonMistake;
  if (!commonMistake || (typeof commonMistake === "string" && commonMistake.trim().length < 20)) {
    warn(id, "practice.commonMistake is missing or too short to be a real diagnostic");
  } else {
    const text = typeof commonMistake === "string" ? commonMistake : JSON.stringify(commonMistake);
    if (GENERIC_MISTAKE_PATTERNS.some((re) => re.test(text))) {
      warn(id, "practice.commonMistake reads as generic filler, not a specific misconception");
    }
  }

  // 4. Vocabulary translation completeness.
  for (const [i, v] of (d.vocabulary || []).entries()) {
    if (!v.termEs || !v.definitionEs) {
      fail(id, `vocabulary[${i}] ("${v.term}") missing termEs/definitionEs`);
    }
    if (!v.visual) warn(id, `vocabulary[${i}] ("${v.term}") missing visual`);
  }

  // 5. Exit ticket answer-key validity.
  const exitTicket = d.reflect && d.reflect.exitTicket;
  if (exitTicket) {
    const n = Array.isArray(exitTicket.choices) ? exitTicket.choices.length : 0;
    if (
      typeof exitTicket.correctIndex !== "number" ||
      exitTicket.correctIndex < 0 ||
      exitTicket.correctIndex >= n
    ) {
      fail(
        id,
        `reflect.exitTicket.correctIndex (${exitTicket.correctIndex}) out of range for ${n} choices`,
      );
    }
    if (!exitTicket.explanation || exitTicket.explanation.trim().length < 10) {
      warn(id, "reflect.exitTicket.explanation missing or too short");
    }
  } else {
    warn(id, "reflect.exitTicket is missing");
  }

  // 6. Reveal Apply word problem must actually pose a task, not just set up a
  // scenario. Accepts either a literal "?" or an imperative task verb, since
  // this lesson set phrases most Apply tasks as commands ("Find the unit
  // rate...", "Write an equation...") rather than questions.
  const wp = d.revealWordProblem;
  if (wp) {
    const hasQuestion = wp.text && /[?]/.test(wp.text);
    const hasImperativeTask =
      wp.text &&
      /\b(find|write|determine|calculate|solve|explain|show|draw|identify|describe|compare|graph|estimate|justify)\b/i.test(
        wp.text,
      );
    if (!wp.text || (!hasQuestion && !hasImperativeTask)) {
      fail(
        id,
        "revealWordProblem.text has no question mark or task verb — likely incomplete/unsolvable",
      );
    }
    if (!wp.sampleAnswer) {
      warn(id, "revealWordProblem missing sampleAnswer");
    }
  }

  // 7. Project/graphic-novel links should reference this lesson's own unit.
  const unit = String(d.unit ?? "").trim();
  if (d.graphicNovel && d.graphicNovel.href && unit) {
    const m = /unit(\d+)/i.exec(d.graphicNovel.href);
    if (m && m[1] !== unit) {
      warn(
        id,
        `graphicNovel.href points at unit${m[1]} but lesson is unit ${unit} (verify intentional cross-unit link)`,
      );
    }
  }

  // 8. Printables completeness (parent lessons).
  if (!isVariant && (!Array.isArray(d.printables) || d.printables.length === 0)) {
    warn(id, "printables is missing or empty");
  }
}

const failures = fails.filter((f) => f.level === "fail");
const warnings = fails.filter((f) => f.level === "warn");

for (const f of failures) console.error(`  FAIL  ${f.id}: ${f.msg}`);
for (const w of warnings) console.warn(`  WARN  ${w.id}: ${w.msg}`);

if (failures.length) {
  console.error(
    `\nvalidate-lesson-quality: FAIL — ${failures.length} failing checks, ${warnings.length} warnings.`,
  );
  process.exit(1);
}

console.log(
  `validate-lesson-quality: PASS — 0 failing checks, ${warnings.length} warnings across ${readdirSync(lessonsDir).length} lesson dirs.`,
);
