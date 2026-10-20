#!/usr/bin/env node
/**
 * Accessibility pass over the publisher-sourced homework Word files.
 *
 *   node scripts/remediate-homework-docx.mjs            # rewrite files in place
 *   node scripts/remediate-homework-docx.mjs --check    # exit 1 if any file would change
 *   node scripts/remediate-homework-docx.mjs 3-4 6-7    # only these lesson folders
 *
 * Only files carrying the publisher's legacy style part are touched; the ones
 * scripts/generate-homework.mjs writes are already accessible by construction.
 * The pass is idempotent (see scripts/lib/homework-docx-a11y.mjs).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS_DIR } from "../tools/lib/curriculum-source.mjs";
import { isPublisherSourcedDocx, remediatePublisherHomework } from "./lib/homework-docx-a11y.mjs";

const args = process.argv.slice(2);
const check = args.includes("--check");
const only = args.filter((a) => !a.startsWith("--"));

let touched = 0;
let current = 0;
for (const id of readdirSync(LESSONS_DIR).sort()) {
  if (id.startsWith("_") || (only.length && !only.includes(id))) continue;
  const file = join(LESSONS_DIR, id, "homework.docx");
  let before;
  try {
    before = readFileSync(file);
  } catch {
    continue;
  }
  if (!(await isPublisherSourcedDocx(before))) continue;
  const after = await remediatePublisherHomework(before);
  if (Buffer.compare(before, after) === 0) {
    current++;
    continue;
  }
  touched++;
  if (!check) writeFileSync(file, after);
}

if (check && touched) {
  console.error(
    `remediate-homework-docx: ${touched} file(s) need the accessibility pass (run without --check).`,
  );
  process.exit(1);
}
console.log(
  `remediate-homework-docx: ${check ? "would update" : "updated"} ${touched}, already current ${current}.`,
);
