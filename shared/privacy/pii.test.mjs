#!/usr/bin/env node
/**
 * Gates G-32 / G-44 (free-text PII and never-collect screen).
 * - Known-bad corpus: every string MUST be flagged, with the expected rule kind.
 * - Known-good corpus: every string MUST pass (aliases, ordinary student sentences, topic-neutral vocabulary).
 * - Negative controls: removing a rule makes its corpus entries pass, so the harness would notice a dead rule;
 *   every rule must be exercised by at least one bad fixture.
 * - rejectIfPII returns a 422 that never contains the submitted text.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectPII, RULES, rejectIfPII, scan } from "./pii.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const bad = JSON.parse(readFileSync(join(dir, "pii-bad.json"), "utf8"));
const good = JSON.parse(readFileSync(join(dir, "pii-good.json"), "utf8"));

let passed = 0;
const ok = (name) => {
  passed++;
  console.log(`   ✓ ${name}`);
};

console.log("shared/privacy/pii.mjs");

assert.ok(bad.length >= 40, `known-bad corpus too small (${bad.length})`);
assert.ok(good.length >= 40, `known-good corpus too small (${good.length})`);
ok(`corpora sized (${bad.length} bad, ${good.length} good)`);

for (const { text, kind } of bad) {
  const r = detectPII(text);
  assert.equal(r.found, true, `MISSED (must flag): ${text}`);
  assert.ok(r.kinds.includes(kind), `wrong kind for "${text}": got ${r.kinds}, expected ${kind}`);
}
ok("every known-bad string is flagged with its expected kind");

for (const text of good) {
  const r = detectPII(text);
  assert.equal(r.found, false, `FALSE POSITIVE (${r.kinds}): ${text}`);
}
ok("every known-good string passes");

for (let n = 1; n <= 28; n++) assert.equal(detectPII(`Star ${n}`).found, false, `alias Star ${n}`);
ok("aliases Star 1..Star 28 pass");

// Star 29 is not an alias; it is not itself PII either, but must not be stripped silently.
assert.equal(detectPII("my name is Star 29").found, true);
ok("Star 29 is not an alias (lead-in still flags)");

// Negative controls: each rule is load-bearing.
for (const rule of RULES) {
  const covered = bad.filter((b) => b.kind === rule.kind);
  assert.ok(covered.length > 0, `rule "${rule.kind}" has no known-bad fixture`);
  const without = RULES.filter((r) => r !== rule);
  const nowMissed = covered.filter((b) => !scan(b.text, without).kinds.includes(rule.kind));
  assert.equal(nowMissed.length, covered.length, `rule "${rule.kind}" not isolated by its fixtures`);
}
assert.equal(scan("My name is Maria", []).found, false, "empty rule set must flag nothing");
ok("negative control: a detector with rules removed misses the bad corpus");

// Non-string input is not PII (callers validate type separately).
for (const v of [null, undefined, 42, {}, "", "   "]) assert.equal(detectPII(v).found, false);
ok("non-string and empty input pass");

// rejectIfPII
assert.equal(rejectIfPII("Use the word bank.", "teacher_note"), null);
const res = rejectIfPII("Call me at 410-555-0134 or maria@x.org", "teacher_note");
assert.equal(res.status, 422);
const body = await res.json();
assert.equal(body.ok, false);
assert.equal(body.field, "teacher_note");
assert.deepEqual([...body.kinds].sort(), ["email", "phone"]);
const raw = JSON.stringify(body);
assert.ok(!raw.includes("410") && !raw.includes("maria@"), "response must not echo the submitted text");
ok("rejectIfPII returns 422 naming field and kinds, never echoing text");

console.log(`\n✓ pii: ${passed} checks`);
