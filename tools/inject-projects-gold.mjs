#!/usr/bin/env node
/**
 * Inject the Projects GOLD hardening layer:
 *
 *   1. Every unit culminating-project WIZARD page
 *      (math/unit-N/projects/version-{a,b}/index.html, + statistics):
 *        • /shared/projects/projects-gold.css  (print-all-steps, AA readout
 *          feedback, reduced-motion, mobile table scroll)
 *        • /shared/projects/projects-gold.js   (aria-live readouts,
 *          aria-pressed toggles, confetti motion gate, goStep focus, table
 *          wrappers, input clamps, teacher-console PIN gate)
 *
 *   2. Every unit-project ANSWER-KEY page
 *      (math/unit-N/projects/answer-key/index.html):
 *        • /shared/projects/answer-key-gate.css + .js (fail-closed teacher
 *          gate — PIN or nt-teacher-mode required to view solutions)
 *
 * Idempotent: begin/end sentinels + per-file guards; safe to re-run.
 * Splices at the LAST </head> and </body> (lastIndexOf) — never regex/first
 * match, which historically corrupted pages whose inline scripts contain
 * markup-like strings. Run with --dry-run to preview.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const GOLD_HEAD = [
  "    <!-- projects-gold-injected:begin (gold hardening layer — tools/inject-projects-gold.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/projects-gold.css" />',
  "    <!-- projects-gold-injected:end -->",
].join("\n");
const GOLD_BODY = [
  "  <!-- projects-gold-injected:begin (gold hardening layer — tools/inject-projects-gold.mjs) -->",
  '  <script src="/shared/projects/projects-gold.js" defer></script>',
  "  <!-- projects-gold-injected:end -->",
].join("\n");

const GATE_HEAD = [
  "    <!-- answer-key-gate-injected:begin (teacher gate — tools/inject-projects-gold.mjs) -->",
  '    <link rel="stylesheet" href="/shared/projects/answer-key-gate.css" />',
  "    <!-- answer-key-gate-injected:end -->",
].join("\n");
const GATE_BODY = [
  "  <!-- answer-key-gate-injected:begin (teacher gate — tools/inject-projects-gold.mjs) -->",
  '  <script src="/shared/projects/answer-key-gate.js" defer></script>',
  "  <!-- answer-key-gate-injected:end -->",
].join("\n");

function spliceBefore(html, closer, block) {
  const idx = html.lastIndexOf(closer);
  if (idx === -1) return null;
  return html.slice(0, idx) + block + "\n" + html.slice(idx);
}

function inject(rel, headBlock, bodyBlock, guard) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn(`  ! missing: ${rel}`);
    return false;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes(guard)) return false; // already injected
  let after = spliceBefore(before, "</head>", headBlock);
  if (after === null) {
    console.error(`  ✗ no </head> in ${rel} — skipped`);
    return false;
  }
  after = spliceBefore(after, "</body>", bodyBlock);
  if (after === null) {
    console.error(`  ✗ no </body> in ${rel} — skipped`);
    return false;
  }
  if (!DRY) fs.writeFileSync(file, after);
  console.log(`  + ${rel}`);
  return true;
}

const UNITS = [...Array.from({ length: 10 }, (_, i) => `unit-${i + 1}`), "statistics"];

let changed = 0;

console.log(`Projects GOLD injection${DRY ? " (dry-run)" : ""}:`);
for (const u of UNITS) {
  for (const v of ["version-a", "version-b"]) {
    if (inject(`math/${u}/projects/${v}/index.html`, GOLD_HEAD, GOLD_BODY, "projects-gold.css"))
      changed++;
  }
}

console.log(`Answer-key gate injection${DRY ? " (dry-run)" : ""}:`);
for (const u of UNITS) {
  if (u === "statistics") continue; // statistics has no answer-key
  if (
    inject(`math/${u}/projects/answer-key/index.html`, GATE_HEAD, GATE_BODY, "answer-key-gate.css")
  )
    changed++;
}

console.log(`${changed} file(s) updated${DRY ? " (would be)" : ""}.`);
