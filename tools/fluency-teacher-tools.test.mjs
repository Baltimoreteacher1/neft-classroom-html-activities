// Teacher, family and fact-fluency tools: pure rules, each pinned with fixtures and negative cases.
// Expected values are written out here, not recomputed by the code under test.
import assert from "node:assert/strict";

import { clearStore } from "./lib/teacher-4-fixtures.mjs";

const lab = "../math/fluency-lab/";
const access = await import(`${lab}accommodations.js`);
const codec = await import(`${lab}assignment-codec.js`);
const { decodeAssignment, encodeAssignment, validateAssignment } = await import(
  `${lab}school-tools.js`
);
const { assignmentFromDraft } = await import(`${lab}teacher-4-assign.js`);

clearStore();

// ---- #3 accommodation profile ----
{
  assert.equal(access.cleanAccess({}), null, "an empty profile adds nothing");
  assert.equal(
    access.cleanAccess({ read: "yes", mc: 4 }),
    null,
    "only true flags and 2 or 3 choices",
  );
  assert.deepEqual(access.cleanAccess({ read: true, mc: 3, bogus: true }), { read: true, mc: 3 });
  const full = { read: true, es: true, focus: true, calc: true, mc: 2 };
  assert.equal(access.encodeAccess(full), "arsfc2");
  assert.deepEqual(access.decodeAccess("arsfc2"), full);
  assert.deepEqual(access.decodeAccess("ac"), { calc: true });
  for (const bad of ["a", "ax", "asr", "a4", "", "r"])
    assert.equal(access.decodeAccess(bad), null, bad);

  const base = {
    version: 1,
    grade: 4,
    keys: ["4:division"],
    count: 10,
    mode: "adaptive",
    challenge: "adaptive",
  };
  const plain = encodeAssignment(base);
  assert.equal(plain.split("|").length, 8, "a plain assignment link gains no field");
  const withAccess = { ...base, access: { read: true, mc: 3, calc: true } };
  const token = encodeAssignment(withAccess);
  assert.match(token, /\|arc3$/);
  assert.deepEqual(decodeAssignment(token).access, { read: true, calc: true, mc: 3 });
  assert.deepEqual(decodeAssignment(token).keys, ["4:division"]);
  // Combined with other extension parts in one field.
  const mixed = encodeAssignment({ ...withAccess, due: "2026-12-01", tiers: [2, 4] });
  const back = decodeAssignment(mixed);
  assert.deepEqual(
    [back.due, back.tiers, back.access],
    ["2026-12-01", [2, 4], { read: true, calc: true, mc: 3 }],
  );
  // A class code cannot carry a profile, so the teacher shares the link.
  assert.equal(codec.encodeShortCode(validateAssignment(withAccess)), null);
  assert.ok(
    codec.encodeShortCode(validateAssignment(base)),
    "a plain assignment still gets a code",
  );
  // The teacher form builds the same profile.
  const draft = {
    label: "",
    grade: 4,
    keys: ["4:division"],
    count: 10,
    mode: "adaptive",
    lang: "en",
    tierLow: 1,
    tierHigh: 5,
    target: false,
    score: 80,
    days: 2,
    due: "",
    access: { read: false, es: true, focus: true, calc: false, mc: 2 },
  };
  assert.deepEqual(assignmentFromDraft(draft).access, { es: true, focus: true, mc: 2 });
  assert.equal(assignmentFromDraft({ ...draft, access: {} }).access, undefined);

  // Only the assignment's own session uses the profile.
  assert.deepEqual(access.activeAccess(withAccess, "assignment"), {
    read: true,
    calc: true,
    mc: 3,
  });
  assert.equal(access.activeAccess(withAccess, "practice"), null);

  // Choices: the right one always stays, order is kept, comparisons and short lists are untouched.
  const choices = ["12", "14", "21", "24"];
  let seed = 1;
  const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 50; run += 1) {
    const two = access.trimChoices(choices, (c) => c === "21", 2, rng);
    assert.equal(two.length, 2);
    assert.ok(two.includes("21"));
    assert.deepEqual(
      two,
      choices.filter((c) => two.includes(c)),
      "original order kept",
    );
  }
  assert.equal(access.trimChoices(choices, (c) => c === "21", 3, rng).length, 3);
  assert.deepEqual(
    access.trimChoices(["<", "=", ">"], (c) => c === "=", 2, rng),
    ["<", "=", ">"],
  );
  assert.deepEqual(
    access.trimChoices(choices, () => false, 2, rng),
    choices,
    "no right choice found: untouched",
  );
  assert.deepEqual(
    access.trimChoices(choices, (c) => c === "12", 5, rng),
    choices,
  );

  // Calculator arithmetic, never eval.
  const ev = access.evaluateExpression;
  assert.equal(ev("2+3×4"), 14);
  assert.equal(ev("(2+3)×4"), 20);
  assert.equal(ev("7 ÷ 2"), 3.5);
  assert.equal(ev("−3+5"), 2);
  assert.equal(ev("0.1+0.2"), 0.3);
  assert.equal(ev("1÷0"), null);
  assert.equal(ev("2++"), null);
  assert.equal(ev("alert(1)"), null);
  assert.equal(ev("(2+3"), null);
  assert.deepEqual(access.accessSummary({ read: true, mc: 2 }).length, 2);
}

console.log("fluency-teacher-tools: ok");
