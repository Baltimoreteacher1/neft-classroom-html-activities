import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { interactiveVisualHost } from "@eduwonderlab/engine/core/interactive-visual.js";

const host = interactiveVisualHost(
  { kind: "factor-tree", value: 84 },
  { ariaLabel: "Complete the factor tree for 84" },
);

assert.match(host, /role="group"/);
assert.doesNotMatch(host, /role="img"/);

const lessonsRoot = join(process.cwd(), "lessons");
const homeworkPages = readdirSync(lessonsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(lessonsRoot, entry.name, "homework.html"))
  .filter((path) => {
    try {
      readFileSync(path);
      return true;
    } catch {
      return false;
    }
  });

for (const path of homeworkPages) {
  const html = readFileSync(path, "utf8");
  assert.doesNotMatch(
    html,
    /class="interactive-visual"[^>]*role="img"/,
    `${path} must not expose an interactive host as an image`,
  );
}

console.log(`interactive visual accessibility: ${homeworkPages.length} homework pages passed`);
