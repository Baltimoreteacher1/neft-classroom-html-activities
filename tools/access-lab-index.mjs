#!/usr/bin/env node
// Regenerate access-practice-lab/content/index.json from the content files.
// `--check` fails (exit 1) when the committed index is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildIndex, CONTENT_DIR } from "./lib/access-lab-content.mjs";

const file = join(CONTENT_DIR, "index.json");
const next = `${JSON.stringify(buildIndex(), null, 1)}\n`;
let current = "";
try {
  current = readFileSync(file, "utf8");
} catch {}

if (process.argv.includes("--check")) {
  if (current !== next) {
    console.error("access-lab-index: content/index.json is stale — run `node tools/access-lab-index.mjs`.");
    process.exit(1);
  }
  console.log("access-lab-index: index.json is current.");
} else if (current !== next) {
  writeFileSync(file, next);
  console.log("access-lab-index: wrote content/index.json.");
} else {
  console.log("access-lab-index: index.json already current.");
}
