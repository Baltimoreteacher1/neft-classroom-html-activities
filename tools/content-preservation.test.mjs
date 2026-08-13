// The instructional content of the core lessons may not change by accident.
//
// This is the ratchet half of tools/curriculum-content-baseline.mjs. It runs in
// `npm test`, so any commit that drops a hint, shifts choice feedback, strips
// authored Spanish, changes a correct answer, moves a standard or breaks a
// warmup contract fails here — even when the change came from a presentation
// refactor or a generator run that looked unrelated.
//
// Both of those have happened in this repo: a generator run stripped
// `choicesEs` / `hintsEs` from small-group configs, and a bulk edit left
// `choiceFeedback` shifted by one in lessons/2-3, where the "5.2" choice was
// told "7 is not the middle value". Neither was visible to any existing gate.
//
// When a change IS intentional, record it deliberately:
//     node tools/curriculum-content-baseline.mjs --update
// and say so in the commit message. Updating the baseline to silence a failure
// you have not read is the one way to make this gate useless.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let output = "";
let failed = false;
try {
  output = execFileSync(
    process.execPath,
    [join(ROOT, "tools/curriculum-content-baseline.mjs"), "--check"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
} catch (error) {
  failed = true;
  output = `${error.stdout || ""}${error.stderr || ""}`;
}

assert.ok(
  !failed,
  `core lesson content drifted from data/curriculum-content-baseline.json:\n${output}`,
);
assert.match(
  output,
  /lessons unchanged/,
  "the baseline check must actually compare lessons, not report nothing",
);

console.log(`PASS content-preservation: ${output.trim()}`);
