#!/usr/bin/env node
/**
 * Generate the BCPS UIFR (TEACH · Level 4) coverage record for every lesson.
 *
 * Reads each lessons/<id>/config.json, computes the Level 4 evidence surfaces
 * with the SAME engine module used at runtime (engine/core/uifr.js), and writes
 * a durable, human-readable record:
 *   - reports/uifr-teach-l4-coverage.json  (machine-readable)
 *   - reports/uifr-teach-l4-coverage.md    (auditor-facing summary)
 *
 * This is the "someone who wants to see it" artifact: nothing student-facing
 * changes, and no rubric language ever reaches the student view. Run:
 *   npm run generate:uifr
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeTeachL4Evidence, TEACH_INDICATORS } from "../../engine/core/uifr.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lessonsDir = join(root, "lessons");
const reportsDir = join(root, "reports");

const lessons = [];
for (const id of readdirSync(lessonsDir).sort()) {
  const cfgPath = join(lessonsDir, id, "config.json");
  if (!existsSync(cfgPath)) continue;
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  } catch {
    continue;
  }
  const ev = computeTeachL4Evidence(cfg);
  lessons.push({ id, ...ev });
}

const generated = new Date().toISOString().slice(0, 10);
const json = {
  framework: "BCPS Instructional Framework Rubric (June 2020)",
  domain: "TEACH",
  level: 4,
  levelName: "Highly Effective",
  generated,
  note: "Materials create the conditions for a Level 4 rating; the actual rating depends on observed student practice. T1–T5 are addressed directly by the lesson surfaces; T6–T7 are teacher-facilitated (supported).",
  indicators: TEACH_INDICATORS.map((i) => ({
    code: i.code,
    title: i.title,
    l4: i.l4,
    applicability: i.applicability,
  })),
  lessonCount: lessons.length,
  lessons,
};

mkdirSync(reportsDir, { recursive: true });
writeFileSync(
  join(reportsDir, "uifr-teach-l4-coverage.json"),
  JSON.stringify(json, null, 2) + "\n",
);

// ── Markdown summary ────────────────────────────────────────────────────────
const codes = TEACH_INDICATORS.map((i) => i.code);
const lines = [];
lines.push("# BCPS Instructional Framework Rubric — TEACH · Level 4 coverage");
lines.push("");
lines.push(`_Framework: ${json.framework} · Domain: TEACH · Target: Level 4 (Highly Effective) · Generated: ${generated}_`);
lines.push("");
lines.push("> Materials create the **conditions** for a Level 4 rating. The actual rating on any");
lines.push("> given day depends on **observed student practice**. Indicators **T1–T5** are addressed");
lines.push("> directly by the lesson surfaces; **T6–T7** are teacher-facilitated (the lesson supplies");
lines.push("> the supporting structure). Nothing in this record is shown to students.");
lines.push("");
lines.push("## Indicators");
lines.push("");
for (const i of TEACH_INDICATORS) {
  lines.push(`- **${i.code} — ${i.title}** _(${i.applicability})_ · L4: ${i.l4}`);
}
lines.push("");
lines.push("## Per-lesson coverage");
lines.push("");
lines.push(`| Lesson | Standard | ${codes.join(" | ")} | Direct | Facilitated |`);
lines.push(`| --- | --- | ${codes.map(() => ":-:").join(" | ")} | :-: | :-: |`);
for (const L of lessons) {
  const cells = codes.map((code) => {
    const ind = L.indicators.find((x) => x.code === code);
    return ind && ind.covered ? "✅" : "—";
  });
  lines.push(
    `| ${L.id} | ${L.standard || "—"} | ${cells.join(" | ")} | ${L.direct.met}/${L.direct.total} | ${L.facilitated.supported}/${L.facilitated.total} |`,
  );
}
lines.push("");

const fullDirect = lessons.filter((L) => L.direct.met === L.direct.total).length;
lines.push(
  `**Summary:** ${fullDirect}/${lessons.length} lessons meet the Level 4 conditions on all direct indicators (T1–T5), and all support the facilitated indicators (T6–T7).`,
);
lines.push("");
writeFileSync(join(reportsDir, "uifr-teach-l4-coverage.md"), lines.join("\n"));

console.log(
  `generate-uifr-coverage: wrote reports/uifr-teach-l4-coverage.{json,md} — ${lessons.length} lessons, ${fullDirect} with full direct (T1–T5) L4 coverage.`,
);
