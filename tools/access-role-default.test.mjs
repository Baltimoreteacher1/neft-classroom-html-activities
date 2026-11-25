#!/usr/bin/env node
/* The role a visitor sees: an explicit choice, else the remembered door, else Student (src/platform/role.js).
 * Before 2026-11-24 everybody started as "teacher", so a student's first page showed the Teacher view pressed. */
import assert from "node:assert/strict";
import { resolveRole } from "../access-practice-lab/src/platform/role.js";

// a choice made with the switch always wins
for (const chosen of ["teacher", "student", "family"])
  for (const audience of ["", "teacher", "student", "family"])
    assert.equal(
      resolveRole(chosen, audience),
      chosen,
      `explicit ${chosen} lost to audience "${audience}"`,
    );
// no choice: the door the person came through
assert.equal(resolveRole("", "teacher"), "teacher");
assert.equal(resolveRole(undefined, "family"), "family");
assert.equal(resolveRole(null, "student"), "student");
// nothing known: Student (the shipped default was Teacher: the defect this pins)
for (const unknown of [
  ["", ""],
  [undefined, undefined],
  [null, null],
  ["admin", "x"],
  ["Teacher", ""],
])
  assert.equal(
    resolveRole(...unknown),
    "student",
    `unknown input ${JSON.stringify(unknown)} did not fall back to student`,
  );
console.log("access-role-default: PASS (resolveRole: choice > door > student, 20 cases)");
