/**
 * Writes lessons/<id>/family/word-problems/index.html for every
 * data/family-word-problems/<id>.json. `--check` fails when a page on disk is stale.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DATA_DIR, lessonPath, loadLessonConfig } from "../tools/lib/curriculum-source.mjs";
import { wordProblemsPage } from "./lib/family-word-problems.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";

const CHECK = process.argv.includes("--check");
const dir = join(DATA_DIR, "family-word-problems");
const stale = [];
let written = 0;

for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()) {
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const html = wordProblemsPage(data, loadLessonConfig(data.lessonId));
  const out = lessonPath(data.lessonId, "family", "word-problems", "index.html");
  if (CHECK) {
    if (!existsSync(out) || !isGeneratedFresh(out, html)) stale.push(out);
    continue;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeGenerated(out, html);
  written++;
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
