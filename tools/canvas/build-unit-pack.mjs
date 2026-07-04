#!/usr/bin/env node
/**
 * build-unit-pack.mjs — one command to assemble EVERYTHING a teacher needs to
 * put one unit (or every unit) into Canvas, in a single folder.
 *
 * For each requested unit it produces canvas-packages/unit-<N>/ containing:
 *   - neft-lessons-unit<N>.imscc     (lesson assignments, completion-code)
 *   - neft-quizzes-unit<N>.zip       (native auto-graded QTI quizzes)
 *   - neft-course-unit<N>.imscc      (pages + quizzes in modules)
 *   - TEACHER-GUIDE.md               (which file to import, how to grade)
 *   - STUDENT-INSTRUCTIONS.md        (the 6 steps students follow)
 *   - IMPORT-CHECKLIST.md            (tick-box import + publish steps)
 *   - lesson-links.txt               (every live lesson URL)
 *   - quiz-titles.txt                (every quiz that will be created)
 *
 * Usage:
 *   node tools/canvas/build-unit-pack.mjs 3      |  npm run unit-pack -- 3
 *   node tools/canvas/build-unit-pack.mjs all    |  npm run unit-pack -- all
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const pkgDir = resolve(repoRoot, "canvas-packages");
const QUIZ_MAX = Number(process.env.QUIZ_MAX || 8);

const arg = (process.argv[2] || "").toLowerCase();
if (!arg) {
  console.error("Usage: build-unit-pack.mjs <unitNumber|all>");
  process.exit(1);
}

const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
const lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);
const allUnits = [...new Set(lessons.map((l) => Number(l.unit)))].sort((a, b) => a - b);
const units = arg === "all" ? allUnits : [Number(arg)];
if (arg !== "all" && !allUnits.includes(Number(arg))) {
  console.error(`Unit ${arg} not found. Available: ${allUnits.join(", ")}`);
  process.exit(1);
}

const UNSUPPORTED = new Set([
  "drag-sort",
  "drag-and-drop",
  "sequence",
  "ordering",
  "sorting",
  "error-analysis",
  "fill-blank",
  "fill-in-the-blank",
  "short-answer",
  "open-response",
  "number-line",
  "graphing",
]);
function quizCount(id) {
  const p = resolve(repoRoot, "lessons", id, "config.json");
  if (!existsSync(p)) return 0;
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return 0;
  }
  let mc = 0,
    match = 0;
  (function walk(o) {
    if (o && typeof o === "object") {
      if (
        o.type === "multiple-choice" &&
        Array.isArray(o.choices) &&
        o.choices.length >= 2 &&
        Number.isInteger(o.correctIndex)
      )
        mc++;
      else if (
        o.type === "matching-game" &&
        Array.isArray(o.pairs) &&
        o.pairs.length >= 2 &&
        o.pairs.every((x) => x && x.term != null && x.match != null)
      )
        match++;
      for (const k in o) walk(o[k]);
    }
  })(cfg);
  return Math.min(mc + match, QUIZ_MAX);
}

const run = (script, ...a) =>
  execFileSync("node", [resolve(__dirname, script), ...a], {
    cwd: repoRoot,
    stdio: "pipe",
    env: process.env,
  }).toString();

function moveInto(dir, name) {
  const src = resolve(pkgDir, name);
  if (existsSync(src)) {
    renameSync(src, resolve(dir, name));
    return true;
  }
  return false;
}

function buildUnit(u) {
  const uLessons = lessons
    .filter((l) => Number(l.unit) === u)
    .sort((a, b) => Number(a.lesson) - Number(b.lesson));
  const dir = resolve(pkgDir, `unit-${u}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // 1-3: build the three packages (build-course self-validates answer keys)
  run("build-cartridge.mjs", String(u));
  run("build-course.mjs", String(u), "--quizzes-only");
  run("build-course.mjs", String(u));

  const got = {
    cartridge: moveInto(dir, `neft-lessons-unit${u}.imscc`),
    quizzes: moveInto(dir, `neft-quizzes-unit${u}.zip`),
    course: moveInto(dir, `neft-course-unit${u}.imscc`),
  };

  // lesson links + quiz titles
  const links = uLessons.map(
    (l) => `Unit ${l.unit} Lesson ${l.lesson} — ${l.title}\n  ${SITE}/lessons/${l.id}/`,
  );
  const quizTitles = uLessons
    .filter((l) => quizCount(l.id) > 0)
    .map(
      (l) => `Unit ${l.unit} Lesson ${l.lesson} Check: ${l.title}  (${quizCount(l.id)} questions)`,
    );
  writeFileSync(resolve(dir, "lesson-links.txt"), links.join("\n\n") + "\n");
  writeFileSync(resolve(dir, "quiz-titles.txt"), quizTitles.join("\n") + "\n");

  // teacher guide
  const teacherGuide = `# Unit ${u} — Canvas import pack

Everything you need to put Unit ${u} into Canvas. No district IT required.

## What's in this folder
| File | What it does | When to use |
| --- | --- | --- |
| \`neft-quizzes-unit${u}.zip\` | Native auto-graded Canvas quizzes (QTI) | **Best path** — quizzes grade themselves |
| \`neft-lessons-unit${u}.imscc\` | One graded assignment per lesson (completion code) | When you want lessons tracked, graded by code |
| \`neft-course-unit${u}.imscc\` | Lesson pages + quizzes in a Unit ${u} module | When you want the full course layout |

## Recommended: native quizzes (no codes, no IT)
1. Canvas → your course → **Settings → Import Course Content**.
2. Content Type: **QTI .zip file**.
3. Choose \`neft-quizzes-unit${u}.zip\` → **Import**.
4. Everything imports **UNPUBLISHED**. Go to **Quizzes**, publish only what you need.
5. Students take the quiz; Canvas grades it into the gradebook automatically.

## Lesson assignments (completion-code path)
1. Settings → Import Course Content → **Common Cartridge 1.x Package**.
2. Choose \`neft-lessons-unit${u}.imscc\` → Import (imports unpublished).
3. Publish the assignments you need. Students do the lesson, paste the code, submit.
4. Grade with the **Canvas Grade Bridge** (teacher-tools/canvas-grades).

## Quizzes in this unit
${quizTitles.length ? quizTitles.map((t) => `- ${t}`).join("\n") : "- (none — use the completion-code lesson assignments)"}

## Notes
- ${uLessons.length} lessons in this unit.
- Answer keys for every quiz were validated against the lesson source at build time.
`;
  writeFileSync(resolve(dir, "TEACHER-GUIDE.md"), teacherGuide);

  // student instructions
  writeFileSync(
    resolve(dir, "STUDENT-INSTRUCTIONS.md"),
    `# How to turn in a Unit ${u} lesson (students)

1. Click the lesson link in Canvas.
2. Complete the lesson.
3. When you finish, a code pops up — it is copied automatically.
4. Return to Canvas.
5. Paste the code in the text box.
6. Click **Submit Assignment**.

(For native quizzes there is no code — just answer the questions and submit. Canvas grades it.)
`,
  );

  // import checklist
  writeFileSync(
    resolve(dir, "IMPORT-CHECKLIST.md"),
    `# Unit ${u} import checklist

- [ ] Open Canvas → course → Settings → Import Course Content
- [ ] Import \`neft-quizzes-unit${u}.zip\` as **QTI .zip file** (auto-graded quizzes)
- [ ] (optional) Import \`neft-lessons-unit${u}.imscc\` as **Common Cartridge 1.x**
- [ ] Confirm items imported **unpublished**
- [ ] Publish only the quizzes / assignments you need this week
- [ ] Assign due dates
- [ ] Spot-check one quiz: take it, confirm it grades correctly
- [ ] (code path) Confirm the Canvas Grade Bridge reads completion codes
`,
  );

  return { dir, got, lessons: uLessons.length, quizzes: quizTitles.length };
}

console.log(`Building unit pack(s): ${units.join(", ")}\n`);
for (const u of units) {
  const r = buildUnit(u);
  const built = Object.entries(r.got)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");
  console.log(`✓ unit-${u}/  — ${r.lessons} lessons, ${r.quizzes} quizzes, packages: ${built}`);
}
console.log(`\nDone. Folders under canvas-packages/unit-<N>/`);
