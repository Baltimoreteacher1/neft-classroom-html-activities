#!/usr/bin/env node
/* =============================================================================
 * validate-worksheet-audience.mjs — student worksheets must not ship answer keys.
 * -----------------------------------------------------------------------------
 * Wired into `npm run validate`.
 *
 * `/lessons/<id>/worksheet.html` is a student-routable page (hub search, small-
 * group launcher, student download presets). The generator used to append an
 * Answer Key for every practice tier into that same file (`ws-correct` markup,
 * "Answer Key" headings, `ws-keynote` sample answers). `isTeacherSurface()`
 * does not match `worksheet`, and adding it would retouch the frozen auth pin.
 *
 * Keys belong on `worksheet-answer-key.html`. That filename already matches
 * the existing `answer-key` substring in `isTeacherSurface()`, so Basic Auth
 * gates it without editing the five pinned auth files.
 *
 * The small-group Practice Set (`practice.html` / `practice-answer-key.html`,
 * scripts/generate-sg-practice.mjs) is split on exactly the same seam and for
 * exactly the same reason, so it is swept by the same rules rather than by a
 * second gate that could disagree with this one.
 *
 * This gate asserts, for BOTH page families:
 *   1. the student page does not contain key markup;
 *   2. a matching `*-answer-key.html` exists and does contain keys;
 *   3. the key file is marked `data-support-audience="teacher"`.
 *
 * CSS class *definitions* (`.ws-correct{`) on the student sheet are not a leak.
 * Self-tests those three detectors before sweeping, including the CSS trap.
 * ============================================================================= */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

/** Key markup a student page must not carry. CSS `.ws-correct{` is exempt. */
export function studentKeyLeaks(html) {
  const leaks = [];
  if (/class="[^"]*\bws-correct\b/.test(html)) leaks.push("ws-correct markup");
  if (/class="[^"]*\bws-keynote\b/.test(html)) leaks.push("ws-keynote markup");
  if (/Answer Key/.test(html)) leaks.push("Answer Key text");
  if (/<b>Watch for:<\/b>/.test(html)) leaks.push("Watch for cue");
  return leaks;
}

export function isTeacherKeyPage(html) {
  return (
    /Answer Key/.test(html) &&
    /data-support-audience="teacher"/.test(html) &&
    (/class="[^"]*\bws-correct\b/.test(html) || /class="[^"]*\bws-keynote\b/.test(html))
  );
}

/* --- Self-test ------------------------------------------------------------- */
const selfFails = [];
const studentOk = `<style>.ws-correct{color:teal;}</style><h1>Practice Worksheet</h1><li class="ws-opt"><span class="ws-bub">A</span>4</li>`;
const studentBad = `<h1>Version A — Answer Key</h1><li class="ws-opt ws-correct"><span class="ws-bub">A</span>4</li><p class="ws-keynote">The answer is 12.</p><p class="ws-watch"><b>Watch for:</b> lining up decimals</p>`;
const teacherOk = `<html data-support-audience="teacher"><h1>Version A — Answer Key</h1><p class="ws-keynote">12</p></html>`;
const teacherStudentMarked = `<html data-support-audience="student"><h1>Version A — Answer Key</h1><p class="ws-keynote">12</p></html>`;

if (studentKeyLeaks(studentOk).length)
  selfFails.push("CSS .ws-correct on a student page was treated as a leak");
if (!studentKeyLeaks(studentBad).includes("ws-correct markup"))
  selfFails.push("ws-correct markup detector did not fire");
if (!studentKeyLeaks(studentBad).includes("Answer Key text"))
  selfFails.push("Answer Key text detector did not fire");
if (!studentKeyLeaks(studentBad).includes("ws-keynote markup"))
  selfFails.push("ws-keynote detector did not fire");
if (!studentKeyLeaks(studentBad).includes("Watch for cue"))
  selfFails.push("Watch for detector did not fire");
if (!isTeacherKeyPage(teacherOk)) selfFails.push("teacher key page was not recognised");
if (isTeacherKeyPage(teacherStudentMarked))
  selfFails.push("a student-audience key page was accepted as a teacher key");
if (selfFails.length) {
  console.error("validate-worksheet-audience self-test FAILED:");
  for (const f of selfFails) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const dirs = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

/** The page families split into a student sheet and a teacher key. */
const FAMILIES = [
  { student: "worksheet.html", key: "worksheet-answer-key.html" },
  { student: "practice.html", key: "practice-answer-key.html" },
];

const findings = [];
const studentPages = new Map(FAMILIES.map((f) => [f.student, 0]));
let keyPages = 0;
for (const id of dirs) {
  for (const family of FAMILIES) {
    const student = join(LESSONS, id, family.student);
    if (!existsSync(student)) continue;
    studentPages.set(family.student, studentPages.get(family.student) + 1);
    const html = readFileSync(student, "utf8");
    const leaks = studentKeyLeaks(html);
    if (leaks.length) {
      findings.push(`lessons/${id}/${family.student} inlines answer keys (${leaks.join(", ")})`);
    }
    const keyFile = join(LESSONS, id, family.key);
    if (!existsSync(keyFile)) {
      findings.push(`lessons/${id}/${family.student} has no sibling ${family.key}`);
      continue;
    }
    keyPages++;
    const keyHtml = readFileSync(keyFile, "utf8");
    if (!isTeacherKeyPage(keyHtml)) {
      findings.push(`lessons/${id}/${family.key} is missing teacher-audience key markup`);
    }
  }
}

// A sweep that finds nothing has verified nothing — and it finds nothing the
// moment a generator's output moves or is renamed, which is precisely when the
// leak this gate exists for becomes possible again.
for (const [page, count] of studentPages) {
  if (count === 0) {
    console.error(`validate-worksheet-audience FAILED: found zero ${page} files`);
    process.exit(1);
  }
}

if (findings.length) {
  console.error(`validate-worksheet-audience FAILED (${findings.length}):`);
  for (const f of findings.slice(0, 25)) console.error(`  ✗ ${f}`);
  if (findings.length > 25) console.error(`  … ${findings.length - 25} more`);
  process.exit(1);
}

const swept = [...studentPages.values()].reduce((a, b) => a + b, 0);
console.log(
  `✓ worksheet-audience: ${swept} student sheets have no inlined keys ` +
    `(${[...studentPages].map(([p, n]) => `${n} ${p}`).join(", ")}); ` +
    `${keyPages} teacher key pages gated by filename.`,
);
