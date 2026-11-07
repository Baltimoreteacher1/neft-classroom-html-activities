#!/usr/bin/env node
// Regenerate the generated content files from the authored ones:
//   access-practice-lab/content/index.json     activity and test listing
//   access-practice-lab/content/glossary.json  tap-a-word glossary (every authored vocabulary entry)
//   shared/class-platform/quiz-key.json        live class quiz answer key (tools/lib/access-quiz-key.mjs)
// `--check` fails (exit 1) when a committed file is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildAlignmentIndex } from "./lib/access-lab-alignment.mjs";
import { buildGlossary, buildIndex, CONTENT_DIR, REPO_ROOT } from "./lib/access-lab-content.mjs";
import { buildQuizKey } from "./lib/access-quiz-key.mjs";

const QUIZ_KEY = resolve(REPO_ROOT, "shared/class-platform/quiz-key.json");
const targets = [
  ["index.json", () => buildIndex()],
  ["glossary.json", () => buildGlossary()],
  ["alignment-index.json", () => buildAlignmentIndex()],
  // The live class quiz key lives with the class platform contract, not in the lab's content folder.
  [QUIZ_KEY, () => buildQuizKey()],
];
const check = process.argv.includes("--check");
let stale = 0;
for (const [name, build] of targets) {
  const file = name.startsWith("/") ? name : join(CONTENT_DIR, name);
  const label = name.startsWith("/") ? name.slice(REPO_ROOT.length + 1) : `content/${name}`;
  const next = `${JSON.stringify(build(), null, 1)}\n`;
  let current = "";
  try {
    current = readFileSync(file, "utf8");
  } catch {}
  if (check) {
    if (current !== next) {
      stale++;
      console.error(
        `access-lab-index: ${label} is stale — run \`node tools/access-lab-index.mjs\`.`,
      );
    } else console.log(`access-lab-index: ${label} is current.`);
  } else if (current !== next) {
    writeFileSync(file, next);
    console.log(`access-lab-index: wrote ${label}.`);
  } else console.log(`access-lab-index: ${label} already current.`);
}
if (stale) process.exit(1);
