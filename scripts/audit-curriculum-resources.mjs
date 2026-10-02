#!/usr/bin/env node
/**
 * Curriculum Resource Auditor
 * --------------------------------------------------------------------------
 * Resource-completeness audit for every lesson on /curriculum/. Reads the
 * generated manifest (data/curriculum-manifest.json) and verifies every
 * resource path on disk, classifying each as:
 *
 *   exists      file present and non-empty (or route dir has index.html)
 *   missing     applicable resource with no file
 *   empty       file present but 0 bytes
 *   inline      lives inside config.json (e.g. exit ticket), not a file
 *   protected   intentionally gated (none auto-detected locally; reserved)
 *
 * Writes a machine report (reports/curriculum-audit-resources.json) and a
 * teacher report (reports/curriculum-audit-resources.md), prints a summary,
 * Optional --strict exits non-zero when applicable resources are missing.
 *
 * Read-only: never writes into a lesson folder, never deletes anything.
 *
 * Usage:
 *   node scripts/audit-curriculum-resources.mjs           # report + write files
 *   node scripts/audit-curriculum-resources.mjs --quiet   # summary only
 *   node scripts/audit-curriculum-resources.mjs --no-write # skip writing reports
 *   node scripts/audit-curriculum-resources.mjs --units 2-9 --strict
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT, tryLoadLessonConfig } from "../tools/lib/curriculum-source.mjs";

const root = REPO_ROOT;
const argv = new Set(process.argv.slice(2));
const QUIET = argv.has("--quiet");
const WRITE = !argv.has("--no-write");
const STRICT = argv.has("--strict");
const unitIndex = process.argv.indexOf("--units");
const unitRange =
  unitIndex < 0 ? null : /^(\d+)(?:-(\d+))?$/.exec(process.argv[unitIndex + 1] || "");
if (
  unitIndex >= 0 &&
  (!unitRange ||
    Number(unitRange[1]) < 1 ||
    Number(unitRange[2] || unitRange[1]) > 10 ||
    Number(unitRange[1]) > Number(unitRange[2] || unitRange[1]))
) {
  console.error("Use --units N or --units N-M with units from 1 through 10.");
  process.exit(2);
}
const inScope = (unit) =>
  !unitRange || (unit >= Number(unitRange[1]) && unit <= Number(unitRange[2] || unitRange[1]));

const manifestPath = join(root, "data", "curriculum-manifest.json");
if (!existsSync(manifestPath)) {
  console.error(
    "✗ data/curriculum-manifest.json not found. Run: node scripts/generate-curriculum-manifest.mjs",
  );
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// Human-friendly labels for each resource key.
const LABELS = {
  lesson: "Interactive Lesson",
  guidedNotes: "Guided Notes",
  guidedNotesPdf: "Notes PDF",
  guidedNotesDocx: "Notes DOCX",
  handout: "Handout",
  homework: "Homework (HTML)",
  homeworkDocx: "Homework (DOCX)",
  slides: "Slides",
  familyPage: "Family Page",
  teacherNotes: "Teacher Notes",
  studentHelp: "Student Help",
  exitTicket: "Exit Ticket",
};

function classify(r, key, lesson) {
  // Inline content must be checked against the current source, not the cached
  // manifest's `exists` flag; a removed exit ticket otherwise stays "present".
  if (r.inline) {
    const config = tryLoadLessonConfig(lesson.id);
    return key === "exitTicket" && config?.reflect?.exitTicket ? "inline" : "missing";
  }
  const abs = join(root, r.file);
  if (!existsSync(abs)) return "missing";
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const entry = join(abs, "index.html");
      return !existsSync(entry) ? "missing" : statSync(entry).size > 0 ? "exists" : "empty";
    }
    return st.size > 0 ? "exists" : "empty";
  } catch {
    return "missing";
  }
}

const perLesson = [];
const totals = { exists: 0, missing: 0, empty: 0, inline: 0, protected: 0 };
let resourcesChecked = 0;

for (const l of manifest.lessons.filter((lesson) => inScope(lesson.unit))) {
  const items = {};
  const missing = [];
  const empty = [];
  for (const [key, r] of Object.entries(l.resources)) {
    if (!r.applicable) continue;
    const state = classify(r, key, l);
    items[key] = state;
    resourcesChecked++;
    totals[state] = (totals[state] || 0) + 1;
    if (state === "missing") missing.push(key);
    if (state === "empty") empty.push(key);
  }
  const needsReview = l.status.needsReview || /needs review/i.test(l.standard);
  const complete = missing.length === 0 && empty.length === 0 && !needsReview;
  perLesson.push({
    id: l.id,
    unit: l.unit,
    title: l.title,
    standard: l.standard,
    needsReview,
    complete,
    items,
    missing,
    empty,
    protected: [],
  });
}

const completeCount = perLesson.filter((l) => l.complete).length;
const needsReviewCount = perLesson.filter((l) => l.needsReview).length;
const withMissing = perLesson.filter((l) => l.missing.length || l.empty.length).length;

const report = {
  generated: "run `npm run audit:curriculum` to refresh",
  scope: unitRange ? `Units ${unitRange[1]}${unitRange[2] ? `–${unitRange[2]}` : ""}` : "All units",
  coverage:
    "Resource existence and non-empty files; inline exit tickets checked against current configs. Does not verify mathematical correctness, rendered layout, or document contents.",
  totalLessons: perLesson.length,
  resourcesChecked,
  completeLessons: completeCount,
  lessonsMissingResources: withMissing,
  lessonsNeedingReview: needsReviewCount,
  brokenLinks: null,
  linkCheck: "Not run by this inventory. Run npm run audit:links for internal link resolution.",
  protectedLinks: totals.protected || 0,
  resourceTotals: totals,
  lessons: perLesson,
};

if (WRITE) {
  const reportsDir = join(root, "reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  writeFileSync(
    join(reportsDir, "curriculum-audit-resources.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  writeFileSync(join(reportsDir, "curriculum-audit-resources.md"), toMarkdown(report));
}

// ---- console summary ----
console.log("Curriculum Resource Audit");
console.log("=".repeat(40));
console.log(`Scope:                  ${report.scope}`);
console.log(`Lessons audited:        ${report.totalLessons}`);
console.log(`Resources checked:      ${report.resourcesChecked}`);
console.log(`Complete lessons:       ${completeCount}`);
console.log(`Lessons w/ missing:     ${withMissing}`);
console.log(`Lessons needing review: ${needsReviewCount}`);
console.log(
  `  exists ${totals.exists} · missing ${totals.missing} · empty ${totals.empty} · inline ${totals.inline} · protected ${totals.protected || 0}`,
);
if (!QUIET && totals.missing) {
  console.log("\nMissing by lesson:");
  for (const l of perLesson) {
    if (l.missing.length)
      console.log(`  ${l.id.padEnd(14)} ${l.missing.map((k) => LABELS[k] || k).join(", ")}`);
  }
}
if (WRITE) console.log("\n✓ reports/curriculum-audit-resources.{json,md}");

// Preserve the default report-only missing-resource behavior; --strict makes
// this usable as a real release gate for a requested unit range.
process.exit(totals.empty > 0 || (STRICT && (totals.missing > 0 || needsReviewCount > 0)) ? 1 : 0);

function toMarkdown(rep) {
  const lines = [];
  lines.push("# Curriculum Resource Audit");
  lines.push("");
  lines.push(`Scope: **${rep.scope}**. ${rep.coverage}`);
  lines.push("");
  lines.push(`- Lessons audited: **${rep.totalLessons}**`);
  lines.push(`- Resources checked: **${rep.resourcesChecked}**`);
  lines.push(`- Complete lessons: **${rep.completeLessons}**`);
  lines.push(`- Lessons missing resources: **${rep.lessonsMissingResources}**`);
  lines.push(`- Lessons needing review: **${rep.lessonsNeedingReview}**`);
  lines.push(`- Link checks: ${rep.linkCheck}`);
  lines.push(
    `- Resource states — exists: **${rep.resourceTotals.exists}**, missing: **${rep.resourceTotals.missing}**, empty: **${rep.resourceTotals.empty}**, inline: **${rep.resourceTotals.inline}**`,
  );
  lines.push("");
  lines.push("## Lesson status");
  lines.push("");
  lines.push("| Lesson | Title | Standard | Status | Missing |");
  lines.push("| ------ | ----- | -------- | ------ | ------- |");
  for (const l of rep.lessons) {
    const status = l.complete ? "✅ Ready" : l.needsReview ? "🟡 Needs Review" : "⚠️ Missing";
    const miss =
      [
        ...l.missing.map((k) => LABELS[k] || k),
        ...l.empty.map((k) => `${LABELS[k] || k} (empty)`),
      ].join(", ") || "—";
    lines.push(
      `| ${l.id} | ${l.title.replace(/\|/g, "/")} | ${l.standard} | ${status} | ${miss} |`,
    );
  }
  lines.push("");
  return lines.join("\n") + "\n";
}
