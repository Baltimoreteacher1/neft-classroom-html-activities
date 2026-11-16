#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalResourceCatalog } from "./lib/canonical-resource-registry.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "data/lesson-resource-catalog.json");
const check = process.argv.includes("--check");

const catalog = buildCanonicalResourceCatalog(ROOT);
const rendered = `${JSON.stringify(catalog, null, 2)}\n`;

if (check) {
  if (!existsSync(OUTPUT) || readFileSync(OUTPUT, "utf8") !== rendered) {
    console.error(
      "Lesson resource catalog is stale. Run: node scripts/generate-lesson-resource-catalog.mjs",
    );
    process.exit(1);
  }
  console.log(
    `Lesson resource catalog is up to date (${catalog.lessonCount} lessons, ${catalog.resourceCount} resources).`,
  );
} else {
  writeFileSync(OUTPUT, rendered, "utf8");
  console.log(
    `Generated ${OUTPUT} (${catalog.lessonCount} lessons, ${catalog.resourceCount} resources).`,
  );
}
