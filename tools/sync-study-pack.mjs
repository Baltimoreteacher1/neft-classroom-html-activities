#!/usr/bin/env node
/* =============================================================================
 * sync-study-pack.mjs — keep the Study Pack engine single-sourced.
 * -----------------------------------------------------------------------------
 * The canonical engine lives in shared/study-pack/. Two surfaces consume it
 * from DIFFERENT deploy roots that cannot share a file at runtime:
 *   - eduwonderlab.com  ->  curriculum/study-pack/      (git auto-deploy)
 *   - noam.eduwonderlab.com -> focus-school/shared/study-pack/ (direct upload)
 *
 * This copies the client engine (study-pack.js/.css) into both consumer roots
 * and the contract (contract.mjs) into focus-school so Noam's Pages Function can
 * import it from within its own project root. Run in `npm run build` and commit
 * the outputs so both deploy paths (which read committed files) stay in lockstep.
 * ========================================================================== */
import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "shared/study-pack");

// [file, ...destination dirs]
const JOBS = [
  ["study-pack.js", ["curriculum/study-pack", "focus-school/shared/study-pack"]],
  ["study-pack.css", ["curriculum/study-pack", "focus-school/shared/study-pack"]],
  ["contract.mjs", ["focus-school/shared/study-pack"]],
];

let copied = 0;
for (const [file, dests] of JOBS) {
  const from = resolve(SRC, file);
  for (const dest of dests) {
    const destDir = resolve(ROOT, dest);
    mkdirSync(destDir, { recursive: true });
    cpSync(from, resolve(destDir, file));
    copied++;
  }
}
console.log(`sync-study-pack: copied ${copied} file(s) from shared/study-pack -> consumers`);
