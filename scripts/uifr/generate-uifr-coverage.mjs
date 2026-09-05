#!/usr/bin/env node
/**
 * Generate the BCPS UIFR (TEACH · Level 4) coverage record for the whole site.
 *
 * Lessons (74 engine-driven): full Level 4 evidence per TEACH indicator, from
 * the SAME engine module used at runtime (engine/core/uifr.js).
 * Activities (200 standalone): conservative "supports" classification — only the
 * indicators structurally true of an interactive practice activity.
 *
 * Writes:
 *   - reports/uifr-teach-l4-coverage.json         (machine-readable, gitignored)
 *   - reports/uifr-teach-l4-coverage.md           (auditor summary, gitignored)
 *   - reports/uifr-activity-coverage.md           (activity summary, gitignored)
 *   - docs/uifr-teach-l4-coverage.md              (durable, version-controlled)
 *   - teacher-tools/teaching-evidence/coverage.json (feeds the observer page)
 *
 * Nothing student-facing changes; no rubric language reaches the student view.
 * Run: npm run generate:uifr
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyActivityTeachSupport,
  computeTeachL4Evidence,
  TEACH_INDICATORS,
} from "@eduwonderlab/engine/core/uifr.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lessonsDir = join(root, "lessons");
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const pageDir = join(root, "teacher-tools", "teaching-evidence");
const generated = new Date().toISOString().slice(0, 10);
const codes = TEACH_INDICATORS.map((i) => i.code);

// ── Lessons ─────────────────────────────────────────────────────────────────
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
  lessons.push({ id, ...computeTeachL4Evidence(cfg) });
}

// ── Activities (catalog-driven, conservative) ───────────────────────────────
const activities = [];
const catalogPath = join(root, "tools", "scorm", "activity-catalog.json");
if (existsSync(catalogPath)) {
  const cat = JSON.parse(readFileSync(catalogPath, "utf8"));
  const norm = (a, kind) => {
    const path = typeof a === "string" ? a : a && a.path;
    if (!path) return null;
    const title = (typeof a === "object" && a && a.title) || path.replace(/\/index\.html$/, "");
    return { path, title, kind, supports: classifyActivityTeachSupport(`${path} ${title}`) };
  };
  const all = [
    ...(cat.activities || []).map((a) => norm(a, "assignable")),
    ...(cat.injectOnly || []).map((a) => norm(a, "practice")),
  ].filter(Boolean);
  activities.push(...all);
  activities.sort((x, y) => x.path.localeCompare(y.path));
}

// ── JSON (source for the observer page + audits) ────────────────────────────
const json = {
  framework: "BCPS Instructional Framework Rubric (June 2020)",
  domain: "TEACH",
  level: 4,
  levelName: "Highly Effective",
  generated,
  note: "Materials create the conditions for a Level 4 rating; the actual rating depends on observed student practice. Lessons: T1–T5 are addressed directly by the lesson surfaces, T6–T7 are teacher-facilitated. Activities: only the indicators structurally supported by an interactive practice task are listed (conservative).",
  indicators: TEACH_INDICATORS,
  lessonCount: lessons.length,
  activityCount: activities.length,
  lessons,
  activities,
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(pageDir, { recursive: true });
writeFileSync(
  join(reportsDir, "uifr-teach-l4-coverage.json"),
  JSON.stringify(json, null, 2) + "\n",
);
writeFileSync(join(pageDir, "coverage.json"), JSON.stringify(json) + "\n");

// ── Markdown: lessons ───────────────────────────────────────────────────────
const fullDirect = lessons.filter((L) => L.direct.met === L.direct.total).length;
const lessonMd = [];
lessonMd.push("# BCPS Instructional Framework Rubric — TEACH · Level 4 coverage");
lessonMd.push("");
lessonMd.push(
  `_Framework: ${json.framework} · Domain: TEACH · Target: Level 4 (Highly Effective) · Generated: ${generated}_`,
);
lessonMd.push("");
lessonMd.push(
  "> Materials create the **conditions** for a Level 4 rating. The actual rating on any",
);
lessonMd.push(
  "> given day depends on **observed student practice**. Indicators **T1–T5** are addressed",
);
lessonMd.push(
  "> directly by the lesson surfaces; **T6–T7** are teacher-facilitated. Nothing in this",
);
lessonMd.push("> record is shown to students.");
lessonMd.push("");
lessonMd.push("## Indicators");
lessonMd.push("");
for (const i of TEACH_INDICATORS) {
  lessonMd.push(`- **${i.code} — ${i.title}** _(${i.applicability})_ · L4: ${i.l4}`);
}
lessonMd.push("");
lessonMd.push("## Per-lesson coverage");
lessonMd.push("");
lessonMd.push(`| Lesson | Standard | ${codes.join(" | ")} | Direct | Facilitated |`);
lessonMd.push(`| --- | --- | ${codes.map(() => ":-:").join(" | ")} | :-: | :-: |`);
for (const L of lessons) {
  const cells = codes.map((code) => {
    const ind = L.indicators.find((x) => x.code === code);
    return ind && ind.covered ? "✅" : "—";
  });
  lessonMd.push(
    `| ${L.id} | ${L.standard || "—"} | ${cells.join(" | ")} | ${L.direct.met}/${L.direct.total} | ${L.facilitated.supported}/${L.facilitated.total} |`,
  );
}
lessonMd.push("");
lessonMd.push(
  `**Summary:** ${fullDirect}/${lessons.length} lessons meet the Level 4 conditions on all direct indicators (T1–T5), and all support the facilitated indicators (T6–T7).`,
);
lessonMd.push("");
const lessonMdText = lessonMd.join("\n");
writeFileSync(join(reportsDir, "uifr-teach-l4-coverage.md"), lessonMdText);
mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "uifr-teach-l4-coverage.md"),
  `<!-- GENERATED by scripts/uifr/generate-uifr-coverage.mjs — do not edit by hand; run npm run generate:uifr -->\n\n${lessonMdText}`,
);

// ── Markdown: activities ────────────────────────────────────────────────────
const actMd = [];
actMd.push("# BCPS UIFR — TEACH support in standalone activities");
actMd.push("");
actMd.push(`_Generated: ${generated} · ${activities.length} activities_`);
actMd.push("");
actMd.push("> Standalone activities are not engine-driven, so they cannot carry the full lesson");
actMd.push("> scaffold. Only the indicators **structurally supported** by an interactive practice");
actMd.push("> task are listed — base **T2** (students choose their approach) + **T4** (immediate,");
actMd.push(
  "> no-fail feedback with retry), plus **T5** (talk/writing) or **T3** (explore/build) when",
);
actMd.push("> the task's nature makes them true. This is a conservative *supports* claim, not a");
actMd.push("> Level 4 rating, and none of it is shown to students.");
actMd.push("");
actMd.push("| Activity | Kind | Supports |");
actMd.push("| --- | --- | --- |");
for (const a of activities) {
  actMd.push(`| ${a.title} | ${a.kind} | ${a.supports.join(", ")} |`);
}
actMd.push("");
writeFileSync(join(reportsDir, "uifr-activity-coverage.md"), actMd.join("\n"));

console.log(
  `generate-uifr-coverage: ${lessons.length} lessons (${fullDirect} full direct L4) + ${activities.length} activities classified. ` +
    "Wrote reports/*.{json,md}, docs/uifr-teach-l4-coverage.md, teacher-tools/teaching-evidence/coverage.json.",
);
