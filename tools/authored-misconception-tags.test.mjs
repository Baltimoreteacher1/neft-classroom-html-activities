#!/usr/bin/env node
/**
 * The hand-authored tag table is ground truth for detectMisconception(), and it
 * is keyed by a stem string — so it rots in two silent ways: a tag that stops
 * resolving to the taxonomy, and a stem that no longer matches any item because
 * the wording changed. Both leave the file looking fine and doing nothing.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MISCONCEPTIONS, resolveAuthoredTag } from "@eduwonderlab/engine/core/misconceptions.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const table = JSON.parse(readFileSync(join(HERE, "authored-misconception-tags.json"), "utf8"));
const entries = Object.entries(table).filter(([key]) => !key.startsWith("_"));

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`FAIL ${message}`);
};

if (!entries.length) fail("the authored tag table is empty");

// 1 · every tag resolves to a taxonomy entry that has student-facing text
for (const [stem, tags] of entries) {
  if (!Array.isArray(tags)) {
    fail(`"${stem.slice(0, 40)}…" is not an array of tags`);
    continue;
  }
  for (const tag of tags) {
    if (tag === null) continue;
    const resolved = resolveAuthoredTag(tag);
    if (!resolved || !MISCONCEPTIONS[resolved])
      fail(`"${tag}" (on "${stem.slice(0, 40)}…") resolves to no taxonomy entry`);
  }
}

// 2 · every stem still matches a real item, with the right choice count, and
//     never claims the correct choice is an error
const stems = new Map(entries);
const found = new Map();
for (const dir of readdirSync(join(ROOT, "lessons"))) {
  const file = join(ROOT, "lessons", dir, "config.json");
  if (!existsSync(file)) continue;
  const stack = [JSON.parse(readFileSync(file, "utf8"))];
  while (stack.length) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    for (const value of Object.values(node))
      if (value && typeof value === "object") stack.push(value);
    if (typeof node.stem !== "string" || !stems.has(node.stem)) continue;
    const tags = stems.get(node.stem);
    found.set(node.stem, (found.get(node.stem) || 0) + 1);
    if (Array.isArray(node.choices) && node.choices.length !== tags.length)
      fail(
        `${dir}: "${node.stem.slice(0, 40)}…" has ${node.choices.length} choices but ${tags.length} tags`,
      );
    if (Number.isInteger(node.correctIndex) && tags[node.correctIndex] !== null)
      fail(`${dir}: "${node.stem.slice(0, 40)}…" tags the correct choice as an error`);
  }
}
for (const [stem] of entries)
  if (!found.has(stem)) fail(`no lesson item matches the stem "${stem.slice(0, 60)}…"`);

if (failures) {
  console.error(`\nauthored misconception tags: ${failures} problem(s)`);
  console.error(
    "Repair: fix tools/authored-misconception-tags.json, then node tools/apply-authored-tags.mjs",
  );
  process.exit(1);
}
console.log(
  `authored misconception tags: ${entries.length} stems, all resolve and all still match lesson items (${[...found.values()].reduce((a, b) => a + b, 0)} items).`,
);
