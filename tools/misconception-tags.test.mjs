#!/usr/bin/env node
/**
 * Misconception tags may only get better, never worse.
 *
 * Pins two things from `node tools/audit-misconception-tags.mjs`: (1) no tag
 * array anywhere is malformed (`--strict`) — an id outside
 * data/misconception-taxonomy.json, a tag on the correct slot, or a length
 * that does not match the choices, because the engine trusts an authored tag
 * over its own predictor; (2) the count of small-group / catch-up items that
 * carry a usable tag (`--floor`), the number that decides whether the studio's
 * detector and adaptive coach can name an error. Raise FLOOR when a wave
 * lands; never lower it to make a run pass. The detector is self-tested first.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditItem, taxonomyIds } from "./audit-misconception-tags.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = join(ROOT, "tools", "audit-misconception-tags.mjs");

// 1092 = small-group items tagged after the 2026-08-29 authoring wave (eight
// decimal tags on non-decimal items were cleared by misconception-tags-resolve).
const FLOOR = 1092;

const ids = taxonomyIds();
assert.ok(ids.size >= 40, "taxonomy loaded");
const item = (misconceptionTags) => ({ choices: ["a", "b", "c", "d"], misconceptionTags });
assert.deepEqual(auditItem({ choices: ["a", "b"] }, 0, ids), ["untagged"]);
assert.deepEqual(auditItem(item([null, "ratio-inverted", null, null]), 0, ids), []);
assert.ok(
  auditItem(item(["ratio-inverted", null, null, null]), 0, ids).some((p) =>
    /correct choice/.test(p),
  ),
);
assert.ok(
  auditItem(item([null, "not-a-real-tag", null, null]), 0, ids).some((p) =>
    /not in the taxonomy/.test(p),
  ),
);
assert.ok(auditItem(item([null, "ratio-inverted"]), 0, ids).some((p) => /length/.test(p)));
assert.deepEqual(
  auditItem(item([null, null, null, null]), 0, ids),
  ["untagged"],
  "all-null = not authored",
);

let out = "";
let code = 0;
try {
  out = execFileSync(process.execPath, [AUDIT, "--strict", "--floor", String(FLOOR)], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (e) {
  code = e.status ?? 1;
  out = `${e.stdout || ""}${e.stderr || ""}`;
}
const m = /small-group: (\d+)\/(\d+)/.exec(out);
assert.ok(
  m,
  `audit output is unparseable — a gate that cannot read its subject is not a gate:\n${out.slice(0, 400)}`,
);
assert.equal(code, 0, `audit failed (floor ${FLOOR}):\n${out.slice(0, 1500)}`);
console.log(
  `misconception-tags ratchet: small-group ${m[1]}/${m[2]} tagged (floor ${FLOOR}); no malformed arrays`,
);
