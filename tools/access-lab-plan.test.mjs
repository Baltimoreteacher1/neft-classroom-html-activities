import assert from "node:assert/strict";
import test from "node:test";
import { activityStatus, buildPracticePlan } from "../access-practice-lab/src/practice-plan.js";
import { CORE_DOMAINS } from "../access-practice-lab/src/util.js";
import { buildIndex } from "./lib/access-lab-content.mjs";

const record = (patch = {}) => ({ complete: [], answers: {}, notes: {}, results: {}, ...patch });
const rows = CORE_DOMAINS.flatMap((domain) =>
  ["A", "B", "C"].flatMap((level) =>
    [1, 2, 3].map((n) => ({
      band: "6-8",
      domain,
      level,
      id: `${domain}-${level}-${n}`,
      title: `Practice ${n}`,
    })),
  ),
);

test("status recognizes meaningful drafts and legacy responses, not empty fields", () => {
  for (const patch of [
    { answers: { x: "a" } },
    { selected: { x: "a" } },
    { notes: { x: "my idea" } },
    { practiced: { x: true } },
    { selfChecks: { x: { clear: true } } },
  ])
    assert.equal(activityStatus(record(patch), "x"), "draft");
  for (const patch of [
    { notes: { x: "  " } },
    { answers: { x: [] } },
    { selfChecks: { x: { clear: false } } },
  ])
    assert.equal(activityStatus(record(patch), "x"), "new");
  assert.equal(
    activityStatus(record({ results: { x: { ok: false } }, notes: { x: "draft" } }), "x"),
    "retry",
  );
  assert.equal(
    activityStatus(record({ complete: ["x"], results: { x: { ok: false } } }), "x"),
    "done",
  );
});

test("balanced plan includes each skill once before repeating and is deterministic", () => {
  const plan = buildPracticePlan(rows, {}, () => record());
  assert.deepEqual(
    plan.map((r) => r.domain),
    CORE_DOMAINS,
  );
  assert.deepEqual(
    plan,
    buildPracticePlan(rows, {}, () => record()),
  );
  assert.ok(plan.every((r) => r.level === "A" && r.reason));
});

test("drafts precede retry, new and completed work", () => {
  const getRecord = () =>
    record({
      complete: ["Listening-A-1"],
      notes: { "Writing-A-3": "saved words" },
      results: { "Reading-A-2": { ok: false } },
    });
  const plan = buildPracticePlan(rows, { count: 4 }, getRecord);
  assert.deepEqual(
    plan.slice(0, 2).map((r) => r.id),
    ["Writing-A-3", "Reading-A-2"],
  );
  assert.ok(!plan.some((r) => r.id === "Listening-A-1"));
});

test("focus, level and room preferences constrain plans; short pools stay unique", () => {
  const plan = buildPracticePlan(rows, { focus: "Writing", level: "B", count: 6 }, () => record());
  assert.equal(plan.length, 3);
  assert.ok(plan.every((r) => r.domain === "Writing" && r.level === "B"));
  assert.equal(new Set(plan.map((r) => r.id)).size, plan.length);
  const preferred = buildPracticePlan(rows, { tiers: { Writing: "C" } }, () => record());
  assert.equal(preferred.find((r) => r.domain === "Writing").level, "C");
});

test("all-done plans offer review and invalid settings fall back safely", () => {
  const plan = buildPracticePlan(rows, { focus: "bad", level: "bad", count: 999 }, () =>
    record({ complete: rows.map((r) => r.id) }),
  );
  assert.equal(plan.length, 4);
  assert.ok(plan.every((r) => r.status === "done" && r.level === "A"));
});

test("every shipping band supports all planner choices without crossing bands", () => {
  const index = buildIndex();
  for (const [band, content] of Object.entries(index.bands)) {
    const actual = Object.entries(content.domains).flatMap(([domain, d]) =>
      Object.entries(d.levels).flatMap(([level, l]) =>
        l.activities.map(([id, title]) => ({ band, domain, level, id, title })),
      ),
    );
    for (const focus of ["balanced", ...CORE_DOMAINS])
      for (const level of ["A", "B", "C"]) {
        const plan = buildPracticePlan(actual, { focus, level, count: 6 }, () => record());
        assert.ok(plan.length > 0, `${band} ${focus} ${level}`);
        assert.ok(plan.every((r) => r.band === band && r.level === level));
      }
  }
});
