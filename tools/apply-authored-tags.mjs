#!/usr/bin/env node
// apply-authored-tags.mjs — write the hand-authored misconceptionTags in
// tools/authored-misconception-tags.json onto every item that carries the stem.
//
//   node tools/apply-authored-tags.mjs [--dry-run]
//
// WHY A SECOND PATH EXISTS
//
// tools/lib/operand-misconception-tagger.mjs derives tags by reconstructing the
// arithmetic from a stem's numbers, and it refuses anything it cannot prove.
// That is the right default, and it leaves a real class untouched: items whose
// CHOICES are expressions ("70 + 8.05") rather than single values, so there is no
// quantity to parse and no model to reconstruct. The decomposition family in
// Unit 1 is entirely that shape, and its distractors are the clearest
// place-value errors in the curriculum — 8.05 where 8.5 belongs, 5 where 0.5
// belongs, 7 where 70 belongs.
//
// So those are read and named by hand, once, in a file that keeps the stem
// beside the tags so a reviewer can check the judgement without running anything.
//
// Safety rails, because an authored tag is ground truth to detectMisconception():
//   • the array length must equal the item's choice count, or the run fails
//   • the entry for the CORRECT choice must be null, or the run fails
//   • an item that already has misconceptionTags is never overwritten
// Idempotent.

import { globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DRY = process.argv.includes("--dry-run");
const HERE = dirname(fileURLToPath(import.meta.url));
const AUTHORED = JSON.parse(readFileSync(join(HERE, "authored-misconception-tags.json"), "utf8"));

const entries = Object.entries(AUTHORED).filter(([key]) => !key.startsWith("_"));
if (!entries.length) {
  console.error("no authored tags found — did the file lose its entries?");
  process.exit(1);
}
const table = new Map(entries);

function walk(node, visit) {
  if (Array.isArray(node)) for (const child of node) walk(child, visit);
  else if (node && typeof node === "object") {
    visit(node);
    for (const value of Object.values(node)) walk(value, visit);
  }
}

let itemsTagged = 0;
let filesChanged = 0;
const matched = new Set();
const problems = [];

for (const file of globSync("lessons/*/config.json").sort()) {
  const config = JSON.parse(readFileSync(file, "utf8"));
  let changed = 0;

  walk(config, (node) => {
    const stem = typeof node.stem === "string" ? node.stem : null;
    if (!stem || !table.has(stem)) return;
    if (!Array.isArray(node.choices)) return;
    matched.add(stem);
    if (node.misconceptionTags) return;

    const tags = table.get(stem);
    if (tags.length !== node.choices.length) {
      problems.push(
        `${file}: "${stem.slice(0, 50)}…" has ${node.choices.length} choices, ${tags.length} tags`,
      );
      return;
    }
    if (Number.isInteger(node.correctIndex) && tags[node.correctIndex] !== null) {
      problems.push(`${file}: "${stem.slice(0, 50)}…" tags the CORRECT choice`);
      return;
    }
    node.misconceptionTags = [...tags];
    changed++;
  });

  if (!changed) continue;
  itemsTagged += changed;
  filesChanged++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

const unmatched = entries.map(([key]) => key).filter((stem) => !matched.has(stem));
if (unmatched.length) {
  problems.push(`authored stems that match no lesson item:\n  ${unmatched.join("\n  ")}`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(
  `${DRY ? "[dry-run] " : ""}authored misconception tags: ${itemsTagged} item(s) across ${filesChanged} config(s)`,
);
