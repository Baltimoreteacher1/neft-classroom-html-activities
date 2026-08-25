#!/usr/bin/env node
/**
 * report-math-notes-coverage.mjs — what every lesson's Math Notes actually
 * offers a student, per lesson, with the field each string was taken from.
 *
 * Writes docs/math-notes-coverage.md. Report only; the gates are
 * validate:copy-panels and sweep:math-notes.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = readdirSync(join(ROOT, "lessons"))
  .filter((d) => /^\d+-\d+$/.test(d))
  .sort((a, b) => {
    const [au, al] = a.split("-").map(Number);
    const [bu, bl] = b.split("-").map(Number);
    return au - bu || al - bl;
  });

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const rows = [];
const kinds = {};

for (const id of ids) {
  const c = JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));
  const cps = (c.notebook && c.notebook.checkpoints) || [];
  const b1 = cps.find((x) => x.box === 1);
  const b2 = cps.find((x) => x.box === 2);
  const terms = (b1 && b1.copyPanel && b1.copyPanel.items) || [];
  const panel = b2 && b2.copyPanel;
  const kind = panel ? panel.anchorKind || "rule" : "student-generated";
  kinds[kind] = (kinds[kind] || 0) + 1;

  const ci = (c.launch || {}).conceptIntro || {};
  const inKey = panel && norm(ci.keyIdea).includes(norm(panel.rule));
  const source = !panel ? "—" : inKey ? "launch.conceptIntro.keyIdea" : "launch.conceptIntro.iDo";
  rows.push({
    id,
    title: c.title || "",
    s1type: terms.length ? "Vocabulary" : "—",
    s1: terms.map((t) => t.term).join(", "),
    s1src: terms.length ? "vocabulary[]" : "—",
    s2type: kind,
    s2: panel ? panel.rule : "(student writes their own)",
    s2src: source,
    anchor: terms.length > 0 || !!panel,
  });
}

const out = [];
out.push("# Math Notes coverage — all 84 core lessons");
out.push("");
out.push(
  "What a student actually gets when they open Math Notes, and the field each string was taken from. Every string is quoted from the lesson it appears on; `validate:copy-panels` fails the build if any of them stops tracing, and `sweep:math-notes` opens the dialog on all 84 lessons to prove the right lesson's notes reach the screen.",
);
out.push("");
out.push("## Anchor kinds");
out.push("");
out.push("| Kind | Lessons |");
out.push("| --- | ---: |");
for (const [k, n] of Object.entries(kinds).sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${n} |`);
out.push("");
out.push(
  `**Lessons with at least one concrete mathematical anchor: ${rows.filter((r) => r.anchor).length}/${rows.length}**`,
);
out.push("");
out.push("## Per lesson");
out.push("");
out.push(
  "| Lesson | Title | Section 1 | Section 1 content | Section 2 | Section 2 content | Section 2 source | Anchor |",
);
out.push("| --- | --- | --- | --- | --- | --- | --- | :-: |");
for (const r of rows) {
  const esc = (s) => String(s).replace(/\|/g, "\\|");
  out.push(
    `| ${r.id} | ${esc(r.title)} | ${r.s1type} | ${esc(r.s1)} | ${r.s2type} | ${esc(r.s2)} | ${r.s2src} | ${r.anchor ? "yes" : "**NO**"} |`,
  );
}
writeFileSync(join(ROOT, "docs", "math-notes-coverage.md"), out.join("\n"));
console.log(
  `Anchor kinds: ${Object.entries(kinds)
    .map(([k, n]) => `${k} ${n}`)
    .join(", ")}`,
);
console.log(`Lessons with an anchor: ${rows.filter((r) => r.anchor).length}/${rows.length}`);
console.log("Wrote docs/math-notes-coverage.md");
