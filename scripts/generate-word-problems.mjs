/**
 * For every data/family-word-problems/<id>.json writes
 *   lessons/<id>/family/word-problems/index.html   the family page
 *   lessons/<id>/word-problems/index.html          the student page, when
 *                                                  data/student-word-problems/<id>.json exists
 * `--check` fails when a page on disk is stale.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DATA_DIR, lessonPath, loadLessonConfig } from "../tools/lib/curriculum-source.mjs";
import { wordProblemsPage } from "./lib/family-word-problems-page.mjs";
import { homeworkChrome } from "./lib/homework-chrome.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { studentPage } from "./lib/student-word-problems.mjs";

const CHECK = process.argv.includes("--check");
const dir = join(DATA_DIR, "family-word-problems");
const stale = [];
let written = 0;

/** Write one page, or in --check mode note it when it is missing or stale. */
function emit(out, html) {
  if (CHECK) {
    if (!existsSync(out) || !isGeneratedFresh(out, html)) stale.push(out);
    return;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeGenerated(out, html);
  written++;
}

for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()) {
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  emit(
    lessonPath(data.lessonId, "family", "word-problems", "index.html"),
    wordProblemsPage(data, homeworkChrome(data.lessonId)),
  );
  const studentFile = join(DATA_DIR, "student-word-problems", file);
  if (existsSync(studentFile)) {
    const student = JSON.parse(readFileSync(studentFile, "utf8"));
    emit(
      lessonPath(data.lessonId, "word-problems", "index.html"),
      studentPage(student, data, loadLessonConfig(data.lessonId)),
    );
  }
}

if (CHECK && stale.length) {
  console.error(
    `generate-word-problems --check: ${stale.length} stale page(s) — run npm run generate-word-problems\n  ${stale.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  CHECK
    ? "generate-word-problems --check: all pages current"
    : `Wrote ${written} word-problem page(s)`,
);
