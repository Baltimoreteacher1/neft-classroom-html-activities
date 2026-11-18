#!/usr/bin/env node
// Builds the Word problems step that follows every curriculum practice studio (67 generated + 5 hand-built Unit 4):
//   math/word-problems/index.html        the shared page (assets/studio/word-problems.mjs runs it)
//   math/word-problems/unit-<n>.json     each lesson's title and authored problems, from data/word-problems/
// The button that opens it is written by the studio generators (scripts/lib/word-problems-page.mjs).
// Not to be confused with scripts/generate-word-problems.mjs, the percent-only family/student pages under lessons/.
//   node scripts/generate-studio-word-problems.mjs [--check]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { loadWordProblems } from "../tools/validate-word-problems.mjs";
import { buildRegistry } from "./lib/math-studio-registry.mjs";
import { validateWordProblems } from "./lib/word-problems-data.mjs";
import { wordProblemsPage } from "./lib/word-problems-page.mjs";

const RUNTIME = [
  "assets/studio/word-problems.mjs",
  "assets/studio/word-problems-answer.mjs",
  "assets/studio/word-problems.css",
];

export function outputs() {
  const lessons = buildRegistry().lessons;
  const byLesson = loadWordProblems();
  const problems = validateWordProblems(
    byLesson,
    lessons.map((/** @type {any} */ l) => l.id),
  );
  if (problems.length) throw new Error(`word problems:\n  ${problems.join("\n  ")}`);
  const units = /** @type {Record<string, Record<string, any>>} */ ({});
  for (const l of lessons) {
    const unit = l.id.split("-")[0];
    units[unit] ??= {};
    units[unit][l.id] = { title: l.title, problems: byLesson[l.id].problems };
  }
  const files = new Map();
  const h = createHash("sha1");
  for (const f of RUNTIME) h.update(readFileSync(join(REPO_ROOT, f)));
  for (const [unit, data] of Object.entries(units)) {
    const body = `${JSON.stringify(data)}\n`;
    h.update(body);
    files.set(`math/word-problems/unit-${unit}.json`, body);
  }
  files.set("math/word-problems/index.html", wordProblemsPage(h.digest("hex").slice(0, 10)));
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  const stale = [];
  for (const [rel, body] of outputs()) {
    const abs = join(REPO_ROOT, rel);
    if (existsSync(abs) && readFileSync(abs, "utf8") === body) continue;
    if (check) stale.push(rel);
    else {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, body);
      console.log(`wrote ${rel}`);
    }
  }
  if (stale.length) {
    console.error(
      `stale (run node scripts/generate-studio-word-problems.mjs):\n  ${stale.join("\n  ")}`,
    );
    process.exit(1);
  }
  if (check) console.log("generate-studio-word-problems --check: current");
}
