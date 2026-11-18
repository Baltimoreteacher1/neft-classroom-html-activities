#!/usr/bin/env node
// Builds the Word problems step that follows every curriculum practice studio (67 generated + 5 hand-built Unit 4):
//   math/word-problems/index.html        the shared page (assets/studio/word-problems.mjs runs it)
//   math/word-problems/unit-<n>.json     each lesson's title, problems, scenario and in-step checks (data/word-problems/)
// The button that opens it is written by the studio generators (scripts/lib/word-problems-page.mjs).
// Not to be confused with scripts/generate-word-problems.mjs, the percent-only family/student pages under lessons/.
//   node scripts/generate-studio-word-problems.mjs [--check]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { loadWordProblems, vizRenderer } from "../tools/validate-word-problems.mjs";
import { buildRegistry } from "./lib/math-studio-registry.mjs";
import { validateWordProblems } from "./lib/word-problems-data.mjs";
import { wordProblemsPage } from "./lib/word-problems-page.mjs";

export function outputs() {
  const lessons = buildRegistry().lessons;
  const byLesson = loadWordProblems();
  const problems = validateWordProblems(
    byLesson,
    lessons.map((/** @type {any} */ l) => l.id),
    { renderViz: vizRenderer() },
  );
  if (problems.length) throw new Error(`word problems:\n  ${problems.join("\n  ")}`);
  const units = /** @type {Record<string, Record<string, any>>} */ ({});
  for (const l of lessons) {
    const unit = l.id.split("-")[0];
    units[unit] ??= {};
    const { problems, scenario, steps } = byLesson[l.id];
    // The lesson's own worked example ("Watch me") and words, from the Learning Lab registry: shown after two
    // misses and in the word bank, so the help a student gets is the lesson's, not new text.
    const iDo = l.understand?.iDo;
    const example = iDo?.lines?.length
      ? {
          title: iDo.title || "Watch me",
          titleEs: iDo.titleEs,
          lines: iDo.lines,
          linesEs: iDo.linesEs,
        }
      : undefined;
    const words = (l.understand?.vocabulary || [])
      .filter((/** @type {any} */ v) => v.term && v.definition && v.role !== "concept")
      .slice(0, 8)
      .map((/** @type {any} */ v) => ({
        term: v.term,
        termEs: v.termEs,
        def: v.definition,
        defEs: v.definitionEs,
      }));
    units[unit][l.id] = { title: l.title, problems, scenario, steps, example, words };
  }
  const files = new Map();
  for (const [unit, data] of Object.entries(units)) {
    const body = `${JSON.stringify(data)}\n`;
    files.set(`math/word-problems/unit-${unit}.json`, body);
  }
  files.set("math/word-problems/index.html", wordProblemsPage());
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
