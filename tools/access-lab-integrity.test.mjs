// Proves the integrity gate detects drift, and that the recorded hashes match the tree.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkIntegrity, computeIntegrity, INTEGRITY_FILE } from "./access-lab-integrity.mjs";

const recorded = JSON.parse(readFileSync(INTEGRITY_FILE, "utf8"));
const current = computeIntegrity();

assert.deepEqual(checkIntegrity(recorded, current), [], "recorded hashes match content");

const [firstKey] = Object.keys(current.activities);
const tampered = structuredClone(current);
tampered.activities[firstKey] = "0000000000000000";
assert.equal(checkIntegrity(recorded, tampered).length, 1, "a changed activity is reported");

delete tampered.activities[firstKey];
assert.match(checkIntegrity(recorded, tampered)[0], /removed/, "a removed activity is reported");

const allowed = { ...recorded, allow: [{ key: firstKey, reason: "test" }] };
assert.deepEqual(checkIntegrity(allowed, tampered), [], "allow-listed keys are tolerated");

console.log("access-lab-integrity.test: ok");
