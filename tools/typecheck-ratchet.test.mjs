#!/usr/bin/env node
/**
 * The type-checking debt may only shrink.
 *
 * checkJs is on for assets/, engine/ and shared/ — 285 files. The ones that are
 * not clean yet carry a `// @ts-nocheck` marker at the top, and that marker IS
 * the debt register: removing one is the unit of work.
 *
 * The marker lives in the file rather than in a list in tsconfig.json for two
 * reasons. It is visible to whoever opens the file, and it solves something
 * `exclude` cannot — tsc follows imports regardless of exclude, so a single
 * un-typed file re-contaminates every clean file that imports it. engine/ is an
 * entangled import graph, which is exactly why an exclude list could not work
 * there and this pass started by replacing one.
 *
 * The easy way to make a type error disappear is to add a marker, so this test
 * pins the count: removing markers is a normal green change, adding one fails.
 * Lower BASELINE whenever you clean files — that is what locks the win in.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BASELINE = 88;

const checked = execFileSync("git", ["ls-files", "assets", "engine", "shared"], {
  cwd: ROOT,
  encoding: "utf8",
})
  .split("\n")
  .filter((f) => f.endsWith(".js") && !f.includes("vendor/") && !f.endsWith(".min.js"));

const marked = checked.filter((f) =>
  readFileSync(resolve(ROOT, f), "utf8").slice(0, 400).includes("@ts-nocheck"),
);

console.log("typecheck debt register");

if (marked.length > BASELINE) {
  console.error(
    `   ✗ ${marked.length} files carry @ts-nocheck, up from ${BASELINE}.\n` +
      `     ${marked.length - BASELINE} file(s) were silenced instead of fixed.\n` +
      `     Most failures are one of these, each fixed at the lookup rather than by\n` +
      `     loosening a type:\n` +
      `       window.X unknown            -> declare X in types/globals.d.ts\n` +
      `       .value/.checked on Element  -> /** @type {HTMLInputElement} */ (el)\n` +
      `       e.target.value              -> /** @type {HTMLInputElement} */ (e.target)\n` +
      `       setAttribute(name, number)  -> String(n)`,
  );
  process.exit(1);
}

// The tsconfig exclude list must stay infrastructure-only: putting source paths
// back there would route around the marker mechanism entirely, and silence
// nothing when the file is imported.
const config = JSON.parse(readFileSync(resolve(ROOT, "tsconfig.json"), "utf8"));
const INFRASTRUCTURE = new Set(["**/vendor/**", "**/*.min.js"]);
const sourceExcludes = config.exclude.filter((p) => !INFRASTRUCTURE.has(p));
if (sourceExcludes.length) {
  console.error(
    `   ✗ tsconfig.json "exclude" lists source paths: ${sourceExcludes.join(", ")}.\n` +
      `     Use a // @ts-nocheck marker in the file instead.`,
  );
  process.exit(1);
}

const clean = checked.length - marked.length;
if (marked.length < BASELINE) {
  console.log(
    `   ✓ ${clean}/${checked.length} files type-checked; ${marked.length} marked ` +
      `(down from ${BASELINE}) — lower BASELINE in this file to lock it in`,
  );
} else {
  console.log(`   ✓ ${clean}/${checked.length} files type-checked, ${marked.length} marked`);
}
