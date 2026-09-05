// validate-engine-imports.mjs — the engine package boundary, held.
//
// Phase 2a of the engine extraction (docs/superpowers/specs/
// 2026-09-05-engine-extraction-design.md) rerouted every ESM import of engine
// internals in tools/ and scripts/ through the @eduwonderlab/engine workspace
// package. This gate keeps it that way: a NEW `from "../engine/..."` (or
// dynamic `import("../engine/...")`) re-couples the caller to the engine's
// physical location and silently blocks the Phase 2 directory move.
//
// Template literals that EMIT browser code keep using the @engine Vite alias —
// those specifiers never start with "../", so they cannot match here.
//
// Decided by Joel 2026-09-05 ("Let's build #1" → productize the lesson engine;
// "Yes, do it" → Phase 2 reroute). Self-tests both detectors first.
import { execFileSync } from "node:child_process";
import process from "node:process";

const RELATIVE_ENGINE_IMPORT = /(from\s+|import\(\s*)["'](\.\.\/)+engine\//;

// ---- self-test: the detector must catch both forms and pass clean code ----
const MUST_CATCH = [
  'import { x } from "../engine/core/misconceptions.js";',
  'const m = await import("../../engine/core/twr.js");',
];
const MUST_ALLOW = [
  'import { x } from "@eduwonderlab/engine/core/misconceptions.js";',
  'const BOOT = `import { bootFlagship } from "@engine/templates/flagship/flagship.js";`;',
  'import { y } from "../tools/lib/write-set.mjs";',
];
for (const line of MUST_CATCH) {
  if (!RELATIVE_ENGINE_IMPORT.test(line)) {
    console.error(`SELF-TEST FAIL — detector missed: ${line}`);
    process.exit(1);
  }
}
for (const line of MUST_ALLOW) {
  if (RELATIVE_ENGINE_IMPORT.test(line)) {
    console.error(`SELF-TEST FAIL — detector false-positived on: ${line}`);
    process.exit(1);
  }
}

// ---- the sweep ----
let out = "";
try {
  out = execFileSync(
    "rg",
    [
      "-n",
      String.raw`(from\s+|import\(\s*)["'](\.\./)+engine/`,
      "tools",
      "scripts",
      "--glob",
      "*.mjs",
      "--glob",
      "*.js",
      // this file's own self-test fixtures and comments contain the pattern
      "--glob",
      "!tools/validate-engine-imports.mjs",
    ],
    { encoding: "utf8" },
  );
} catch (e) {
  // rg exits 1 on zero matches — that is the passing case.
  if (e.status !== 1) throw e;
}

const hits = out.trim().split("\n").filter(Boolean);
if (hits.length > 0) {
  console.error(
    `FAIL validate:engine-imports — ${hits.length} relative engine import(s) in tools/ or scripts/.`,
  );
  console.error(
    'Import through the package instead: "@eduwonderlab/engine/<core|components|styles|templates>/...".',
  );
  for (const h of hits.slice(0, 20)) console.error(`  ${h}`);
  process.exit(1);
}
console.log(
  "PASS validate:engine-imports — tools/ and scripts/ import engine internals only through @eduwonderlab/engine (self-tests 5/5).",
);
