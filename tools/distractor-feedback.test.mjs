#!/usr/bin/env node
/**
 * Distractor feedback may only get better, never worse.
 *
 * `node tools/audit-distractor-feedback.mjs` counts the multiple-choice items
 * whose `choiceFeedback` is authored AND clean — one line per wrong choice, no
 * quoted answer, no named letter, no duplicates — across every pool the engine
 * surfaces it on (practice tiers, warm-up, Connect, exit ticket). This pins the
 * count as a floor: an edit that drops feedback, or authors a giveaway, fails
 * here. Raise FLOOR whenever a wave lands; never lower it to make a run pass.
 *
 * The detector is self-tested first, in both directions, so a regex that quietly
 * stopped matching cannot report a clean fleet.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditItem } from "./audit-distractor-feedback.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "tools", "audit-distractor-feedback.mjs");

// Raise when a wave lands. 808 = the fleet on 2026-08-29 before the authoring
// wave; the practice tiers were already covered, warm-up/Connect were not.
const FLOOR = 808;

const item = (choiceFeedback) => ({
  choices: ["12", "18", "6", "3"],
  correctIndex: 1,
  choiceFeedback,
});
assert.deepEqual(auditItem({ item: item(undefined), correct: 1 }), ["missing"]);
assert.deepEqual(
  auditItem({
    item: item(["You added the two numbers.", "", "You halved instead.", "You divided by 4."]),
    correct: 1,
  }),
  [],
  "clean feedback passes",
);
assert.ok(
  auditItem({ item: item(["The answer is 18.", "", "Halved.", "Divided."]), correct: 1 }).some(
    (p) => /names the answer/.test(p),
  ),
  "naming the answer is a leak",
);
assert.ok(
  auditItem({ item: item(["Pick B instead.", "", "Halved.", "Divided."]), correct: 1 }).some((p) =>
    /names the answer/.test(p),
  ),
  "naming the letter is a leak",
);
assert.ok(
  auditItem({ item: item(["Same line.", "", "Same line.", "Divided."]), correct: 1 }).some((p) =>
    /duplicates/.test(p),
  ),
  "duplicate lines are caught",
);
assert.ok(
  auditItem({
    item: item(["Wrong.", "Feedback on the right one.", "Halved.", "Divided."]),
    correct: 1,
  }).some((p) => /correct choice but carries/.test(p)),
  "feedback on the correct slot is caught",
);

let out = "";
let code = 0;
try {
  out = execFileSync(process.execPath, [AUDIT, "--floor", String(FLOOR)], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (e) {
  code = e.status ?? 1;
  out = `${e.stdout || ""}${e.stderr || ""}`;
}
const m = /distractor-feedback: (\d+)\/(\d+)/.exec(out);
assert.ok(
  m,
  `audit output is unparseable — a gate that cannot read its subject is not a gate:\n${out.slice(0, 400)}`,
);
assert.equal(code, 0, `audit failed (floor ${FLOOR}):\n${out.slice(0, 1200)}`);
console.log(`distractor-feedback ratchet: ${m[1]}/${m[2]} clean (floor ${FLOOR})`);
