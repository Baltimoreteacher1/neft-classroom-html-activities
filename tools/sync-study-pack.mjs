#!/usr/bin/env node
/* =============================================================================
 * sync-study-pack.mjs — keep the Study Pack engine single-sourced.
 * -----------------------------------------------------------------------------
 * The canonical engine lives in shared/study-pack/. Two surfaces consume it
 * from DIFFERENT deploy roots that cannot share a file at runtime:
 *   - eduwonderlab.com  ->  curriculum/study-pack/      (git auto-deploy)
 *   - noam.eduwonderlab.com -> focus-school/shared/study-pack/ (direct upload)
 *
 * This copies the client engine (study-pack.js/.css) into both consumer roots.
 * The contract (contract.mjs) is only needed server-side by the classroom
 * Pages Function, which imports it directly from shared/ — Noam calls that same
 * classroom endpoint cross-origin for generation, so it needs only the client
 * engine. Run in `npm run build` and commit the outputs so both deploy paths
 * (which read committed files) stay in lockstep.
 * ========================================================================== */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANSWER_MATCH_JS } from "../scripts/homework-answer-match.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "shared/study-pack");

// The engine is a classic script served from two deploy roots, so it cannot
// import the shared answer matcher — regenerate it into the file instead, from
// the same single source homework pages inline. Keeping this in the sync step
// means a change to engine/core/answer-match.js reaches every surface with one
// `npm run build`.
export const BEGIN = "/* answer-match-generated:begin */";
export const END = "/* answer-match-generated:end */";

export function withAnswerMatch(source) {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `shared/study-pack/study-pack.js is missing the ${BEGIN} / ${END} markers — ` +
        "the answer matcher cannot be regenerated into it.",
    );
  }
  const body = ANSWER_MATCH_JS.split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
  return `${source.slice(0, start)}${BEGIN}\n${body}\n  ${source.slice(end)}`;
}

// [file, ...destination dirs]
const JOBS = [
  ["study-pack.js", ["curriculum/study-pack", "focus-school/shared/study-pack"]],
  ["study-pack.css", ["curriculum/study-pack", "focus-school/shared/study-pack"]],
];

function sync() {
  // Refresh the generated block in the canonical engine before copying, so both
  // consumer roots receive the current matcher.
  const enginePath = resolve(SRC, "study-pack.js");
  const engineSource = readFileSync(enginePath, "utf8");
  const regenerated = withAnswerMatch(engineSource);
  if (regenerated !== engineSource) {
    writeFileSync(enginePath, regenerated);
    console.log("sync-study-pack: refreshed the inlined answer matcher");
  }

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
}

// Only sync when run as a command. The drift test imports `withAnswerMatch`
// from here, and a test must never rewrite the files it is checking.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  sync();
}
