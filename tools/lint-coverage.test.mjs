#!/usr/bin/env node
/**
 * Every shipped script must be visible to the linter.
 *
 * biome.json used to list only assets/, engine/, shared/, scripts/, tools/,
 * functions/ and workers/. That left ~370 tracked .js files — all of lessons/,
 * games/, curriculum/, teacher-tools/, graphic-novels/, math/ — checked by
 * nothing but a syntax parse. The gap was invisible because `npm run check`
 * reports how many files it checked, not how many it skipped, so a clean run
 * over 60% of the codebase looked exactly like a clean run over all of it.
 *
 * This test recomputes the set of shipped scripts from git and fails on any
 * file no include pattern matches, naming the file and the pattern to add.
 * Adding a new top-level app directory therefore fails here until it is
 * linted, rather than silently joining the blind spot.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(ROOT, "biome.json"), "utf8"));
const patterns = config.files.includes;

/** Translate one Biome include glob into a RegExp. */
function globToRe(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**/` matches any number of directories, including none.
        if (glob[i + 2] === "/") {
          re += "(?:[^/]+/)*";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === ".") re += "\\.";
    else if ("+?^${}()|[]\\".includes(c)) re += `\\${c}`;
    else re += c;
  }
  return new RegExp(`^${re}$`);
}

const includes = [];
const excludes = [];
for (const p of patterns) {
  // Biome uses `!` for exclusions; `!!` force-excludes a whole directory.
  const bang = p.startsWith("!!") ? 2 : p.startsWith("!") ? 1 : 0;
  const body = p.slice(bang);
  const target = bang ? excludes : includes;
  target.push(globToRe(bang === 2 ? `${body}/**` : body));
  if (bang === 2) target.push(globToRe(body));
}

const tracked = execFileSync("git", ["ls-files", "*.js", "*.mjs"], {
  cwd: ROOT,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

// Files that legitimately are not ours to lint.
const NOT_OURS =
  /(^|\/)(vendor|node_modules)\/|\.min\.js$|(^|\/)dist\/|^curriculum\/monster-math-academy\/assets\//;

const invisible = [];
for (const file of tracked) {
  if (NOT_OURS.test(file)) continue;
  if (excludes.some((re) => re.test(file))) continue;
  if (includes.some((re) => re.test(file))) continue;
  invisible.push(file);
}

console.log("lint coverage");

if (invisible.length) {
  const byDir = new Map();
  for (const f of invisible) {
    const dir = f.split("/")[0];
    byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
  }
  console.error(`   ✗ ${invisible.length} shipped script(s) match no biome.json include pattern:`);
  for (const [dir, n] of [...byDir].sort((a, b) => b[1] - a[1])) {
    console.error(
      `       ${String(n).padStart(4)}  ${dir}/   → add "${dir}/**/*.js" to files.includes`,
    );
  }
  console.error(`     e.g. ${invisible.slice(0, 3).join(", ")}`);
  process.exit(1);
}

// Coverage is two-tier on purpose, and the split is reported rather than left
// implicit. Every shipped script is linted for genuinely-undefined variables —
// the rule that catches typos and missing globals. The curated trees
// (assets, engine, shared, scripts, tools, functions, workers) additionally get
// the dead-code rules and the formatter. The wider tree carries ~321
// pre-existing unused-variable hits; turning those on repo-wide today would
// just paint the gate red, so they are a tracked backlog, not a silent gap.
const curated = (config.overrides?.[0]?.includes ?? []).map(globToRe);
const shipped = tracked.filter((f) => !NOT_OURS.test(f));
const inCurated = shipped.filter((f) => curated.some((re) => re.test(f))).length;

console.log(`   ✓ all ${shipped.length} shipped scripts are covered by biome.json`);
console.log(
  `     ${inCurated} in the curated tier (undefined-vars + dead-code + format), ` +
    `${shipped.length - inCurated} lint-lite (undefined-vars)`,
);
