// validate-test-writes.mjs — every test that writes has a reviewed reason.
//
// Two same-day incidents motivated this (2026-09-05): validate-cartridge's
// self-test rebuilt the real neft-library cartridge with --limit=5 on every
// `npm test` (fixed via --out-dir), and a sandbox test overwrote six REAL
// lesson configs when a refactor broke its generator's root redirection. A
// test that writes outside its own tmpdir is one refactor away from damaging
// the tree, and `npm test` runs on every push — so which tests write, and
// where, is a reviewed fact, not an accident.
//
// The contract: every *.test.{mjs,cjs,js} containing a write CALLSITE must
// have an entry in data/test-writes-review.json stating its target class and
// why that is safe. An entry whose file is gone, or no longer writes, FAILS —
// the registry cannot become stale absolutions (same rule as
// reveal-assets-retained and interactive-alignment-review).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REGISTRY = join(ROOT, "data", "test-writes-review.json");
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".qa-logs", "coverage"]);
const TEST_RE = /\.test\.(mjs|cjs|js)$/;

// Call syntax only — a comment naming cpSync, or a regex SOURCE containing
// `writeFileSync\(`, is not a write (both exist in this repo and must not
// force registry entries).
const WRITE_CALL =
  /\b(writeFileSync|appendFileSync|cpSync|rmSync|renameSync|createWriteStream|writeGenerated)\s*\(/;

// ---- self-test ----
const MUST_CATCH = [
  'writeFileSync(join(dir, "x.json"), data);',
  "rmSync (target, { recursive: true });",
  "await writeGenerated(file, html);",
];
const MUST_ALLOW = [
  "// cpSync hands the filter ABSOLUTE paths",
  String.raw`const re = /writeFileSync\(\s*new URL/;`,
  'const name = "writeFileSyncish";',
];
for (const line of MUST_CATCH) {
  if (!WRITE_CALL.test(line)) {
    console.error(`SELF-TEST FAIL — detector missed: ${line}`);
    process.exit(1);
  }
}
for (const line of MUST_ALLOW) {
  if (WRITE_CALL.test(line)) {
    console.error(`SELF-TEST FAIL — detector over-caught: ${line}`);
    process.exit(1);
  }
}

// ---- discover writing tests (same walk as tools/run-tests.mjs) ----
function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry) || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, acc);
    else if (TEST_RE.test(entry)) acc.push(full);
  }
  return acc;
}

const writers = new Set();
for (const file of walk(ROOT, [])) {
  const src = readFileSync(file, "utf8");
  if (WRITE_CALL.test(src)) writers.add(relative(ROOT, file));
}

// ---- reconcile against the registry ----
const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const failures = [];
const reviewed = new Set();
for (const entry of registry.entries) {
  reviewed.add(entry.file);
  if (!entry.targets || !entry.reason || entry.reason.length < 30) {
    failures.push(`registry entry for ${entry.file}: targets + a reason of 30+ chars required`);
  }
  if (!writers.has(entry.file)) {
    failures.push(
      `stale registry entry: ${entry.file} no longer exists or no longer writes — delete its entry`,
    );
  }
}
for (const w of [...writers].sort()) {
  if (!reviewed.has(w)) {
    failures.push(
      `unreviewed writing test: ${w} — review where its writes land and add an entry to data/test-writes-review.json`,
    );
  }
}

if (failures.length) {
  console.error(`FAIL validate:test-writes — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `PASS validate:test-writes — ${writers.size} writing test(s), all reviewed (self-tests 6/6).`,
);
