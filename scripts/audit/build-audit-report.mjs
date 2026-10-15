// Builds AUDIT_REPORT.md from data/audit/studio-audit/<id>.json (written by the forensic review of every studio).
//   node scripts/audit/build-audit-report.mjs [--check]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(ROOT, "data/audit/studio-audit");
const CLASSES = ["ALIGNED", "QUESTIONABLE", "MISALIGNED", "REDUNDANT", "BROKEN-MODEL"];
const WORST = ["BROKEN-MODEL", "MISALIGNED", "REDUNDANT", "QUESTIONABLE", "ALIGNED"];
const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();

export function load() {
  return readdirSync(DIR)
    .filter((f) => /^\d+-\d+\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")))
    .sort((a, b) => a.lesson.localeCompare(b.lesson, "en", { numeric: true }));
}

export function problems(rows) {
  const p = [];
  for (const r of rows) {
    if (!Array.isArray(r.widgets) || !r.widgets.length)
      p.push(`${r.lesson}: no widgets classified`);
    for (const w of r.widgets || []) {
      if (!CLASSES.includes(w.class)) p.push(`${r.lesson}: bad class "${w.class}"`);
      if (w.class !== "ALIGNED" && !String(w.replacement || "").trim())
        p.push(`${r.lesson}: ${w.class} widget "${w.component}" has no replacement spec`);
      if (!String(w.root || "").trim())
        p.push(`${r.lesson}: widget "${w.component}" has no root cause`);
    }
    const worst = WORST.find((c) => (r.widgets || []).some((w) => w.class === c)) || "ALIGNED";
    if (r.lessonClass !== worst)
      p.push(`${r.lesson}: lessonClass ${r.lessonClass} should be ${worst}`);
  }
  return p;
}

export function report(rows) {
  const total = { lessons: rows.length, widgets: 0 };
  const byClass = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  const byLesson = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  for (const r of rows) {
    byLesson[r.lessonClass]++;
    for (const w of r.widgets) {
      byClass[w.class]++;
      total.widgets++;
    }
  }
  const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "0%");
  const out = [];
  out.push("# AUDIT REPORT: Grade 6 HTML practice studios against the canonical lessons", "");
  out.push(
    `Generated from \`data/audit/studio-audit/<lesson>.json\` by \`scripts/audit/build-audit-report.mjs\`. Method and class definitions: \`docs/specs/studio-audit.md\`.`,
    "",
  );
  const fixedPath = join(ROOT, "data/audit/fixed.json");
  if (existsSync(fixedPath)) {
    const f = JSON.parse(readFileSync(fixedPath, "utf8"));
    out.push("## Fixed since this audit", "", f.note, "");
    for (const x of f.fixed)
      out.push(`- **${cell(x.finding)}**  \n  Fix: ${cell(x.fix)}  \n  Proof: ${cell(x.proof)}`);
    out.push("");
  }
  out.push("## Summary", "");
  out.push(`${total.lessons} lessons (Units 2-9), ${total.widgets} widgets classified.`, "");
  out.push(
    "| Class | Widgets | Share | Lessons whose worst widget is this class |",
    "| --- | ---: | ---: | ---: |",
  );
  for (const c of CLASSES)
    out.push(`| ${c} | ${byClass[c]} | ${pct(byClass[c], total.widgets)} | ${byLesson[c]} |`);
  out.push(
    "",
    `Aligned lessons: ${byLesson.ALIGNED} of ${total.lessons}. Lessons with at least one MISALIGNED or BROKEN-MODEL widget: ${byLesson.MISALIGNED + byLesson["BROKEN-MODEL"]}.`,
  );
  const early = rows.flatMap((r) =>
    (r.formulaOrder || [])
      .filter(
        (f) =>
          f.taughtIn &&
          f.earliestUseInStudio &&
          f.earliestUseInStudio.localeCompare(f.taughtIn, "en", { numeric: true }) < 0,
      )
      .map(
        (f) =>
          `${r.lesson}: ${f.formula} used in ${f.earliestUseInStudio}, taught in ${f.taughtIn}`,
      ),
  );
  out.push(
    "",
    "## Formulas used before they are taught",
    "",
    early.length ? early.map((e) => `- ${e}`).join("\n") : "None found.",
  );
  const typo = rows.flatMap((r) => (r.typography || []).map((t) => `${r.lesson}: ${t}`));
  out.push(
    "",
    "## Typography findings",
    "",
    typo.length ? typo.map((e) => `- ${e}`).join("\n") : "None found.",
  );
  const noModel = rows.filter((r) => r.missingModel && String(r.missingModel) !== "false");
  out.push(
    "",
    "## Lessons whose canonical model students cannot manipulate in the studio",
    "",
    noModel.length
      ? noModel.map((r) => `- ${r.lesson} ${r.title}: ${r.model}`).join("\n")
      : "None.",
  );
  out.push(
    "",
    "## Lesson by lesson",
    "",
    "| Unit | Lesson | Canonical objective | Current widget(s) | Classification | Root cause | Required replacement spec |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const r of rows)
    r.widgets.forEach((w, i) =>
      out.push(
        `| ${i ? "" : r.unit} | ${i ? "" : `${r.lesson} ${cell(r.title)}`} | ${i ? "" : cell(r.objective)} | ${cell(w.where)}: ${cell(w.component)} | ${w.class} | ${cell(w.root)} | ${cell(w.replacement)} |`,
      ),
    );
  out.push("");
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = existsSync(DIR) ? load() : [];
  const p = problems(rows);
  if (p.length) {
    for (const m of p) console.error(m);
    process.exit(1);
  }
  const text = report(rows);
  const path = join(ROOT, "AUDIT_REPORT.md");
  if (process.argv.includes("--check")) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== text) {
      console.error("AUDIT_REPORT.md is stale; run: node scripts/audit/build-audit-report.mjs");
      process.exit(1);
    }
    console.log("AUDIT_REPORT.md is current.");
  } else {
    writeFileSync(path, text);
    console.log(`AUDIT_REPORT.md: ${rows.length} lessons.`);
  }
}
