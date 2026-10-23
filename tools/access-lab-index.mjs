#!/usr/bin/env node
// Regenerate the generated content files from the authored ones:
//   access-practice-lab/content/index.json     activity and test listing
//   access-practice-lab/content/glossary.json  tap-a-word glossary (every authored vocabulary entry)
// `--check` fails (exit 1) when a committed file is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildGlossary, buildIndex, CONTENT_DIR } from "./lib/access-lab-content.mjs";

const targets = [
  ["index.json", () => buildIndex()],
  ["glossary.json", () => buildGlossary()],
];
const check = process.argv.includes("--check");
let stale = 0;
for (const [name, build] of targets) {
  const file = join(CONTENT_DIR, name);
  const next = `${JSON.stringify(build(), null, 1)}\n`;
  let current = "";
  try {
    current = readFileSync(file, "utf8");
  } catch {}
  if (check) {
    if (current !== next) {
      stale++;
      console.error(
        `access-lab-index: content/${name} is stale — run \`node tools/access-lab-index.mjs\`.`,
      );
    } else console.log(`access-lab-index: ${name} is current.`);
  } else if (current !== next) {
    writeFileSync(file, next);
    console.log(`access-lab-index: wrote content/${name}.`);
  } else console.log(`access-lab-index: ${name} already current.`);
}
if (stale) process.exit(1);
