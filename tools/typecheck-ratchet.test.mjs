#!/usr/bin/env node
/**
 * The type-checking debt register may only shrink.
 *
 * tsconfig.json turns on checkJs for assets/ and lists the files that do not
 * pass yet in `exclude`. That list is debt, not configuration: the easy way to
 * make a type error go away is to add the file to it, which would quietly undo
 * the gate one line at a time. This test pins the count, so removing a file is
 * a normal green change and adding one fails with an explicit message.
 *
 * Raise BASELINE only when you have cleaned files (i.e. lowered it).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(ROOT, "tsconfig.json"), "utf8"));

// Files excluded because they are not ours to check (vendor, minified).
const INFRASTRUCTURE = new Set(["**/vendor/**", "**/*.min.js"]);
const debt = config.exclude.filter((p) => !INFRASTRUCTURE.has(p));

const BASELINE = 34;

console.log("typecheck debt register");

if (debt.length > BASELINE) {
  const added = debt.length - BASELINE;
  console.error(
    `   ✗ ${debt.length} files excluded from type checking, up from ${BASELINE}.\n` +
      `     ${added} file(s) were added to tsconfig.json "exclude" instead of being fixed.\n` +
      `     Most failures are one of two shapes:\n` +
      `       • window.X is unknown        → declare X in types/globals.d.ts\n` +
      `       • .value/.checked on HTMLElement → JSDoc cast at the lookup, e.g.\n` +
      `         const el = /** @type {HTMLInputElement} */ (document.getElementById("x"));`,
  );
  process.exit(1);
}

if (debt.length < BASELINE) {
  console.log(
    `   ✓ ${debt.length} files excluded (down from ${BASELINE}) — ` +
      `lower BASELINE in ${"tools/typecheck-ratchet.test.mjs"} to lock the win in`,
  );
} else {
  console.log(`   ✓ ${debt.length} files excluded from type checking, unchanged`);
}
