import assert from "node:assert/strict";
import test from "node:test";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => (values.has(key) ? values.get(key) : null),
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};

const { award, daysThisWeek, finishSession, getEngagement, saveEngagement, startSession, weekKey } =
  await import("../access-practice-lab/src/engagement.js");
const fakeContext = () => ({
  prefs: {},
  setPrefs(patch) {
    this.prefs = { ...this.prefs, ...patch };
  },
});

test("weekly goal accepts only supported choices and counts unique saved practice days", () => {
  const ctx = fakeContext();
  saveEngagement(ctx, { weeklyGoal: 5 });
  assert.equal(getEngagement(ctx.prefs).weeklyGoal, 5);
  ctx.prefs.engagement.weeklyGoal = 2;
  assert.equal(getEngagement(ctx.prefs).weeklyGoal, 3);
  const monday = new Date("2026-10-26T12:00:00");
  assert.equal(weekKey(monday), "2026-10-26");
  assert.equal(daysThisWeek(["2026-10-26", "2026-10-26", "2026-10-27", "2026-10-20"], monday), 2);
});

test("activity XP is idempotent and bounded for one authored activity", () => {
  const ctx = fakeContext();
  assert.equal(award(ctx, "activity:6-8:Reading:A:item-1", 4, "Practice").earned, 4);
  assert.equal(award(ctx, "activity:6-8:Reading:A:item-1", 4, "Practice").earned, 0);
  assert.equal(getEngagement(ctx.prefs).xp, 4);
});

test("completed sessions require practice and award only once per local day", () => {
  const ctx = fakeContext();
  const session = startSession(ctx, [{ id: "item-a" }], 5);
  assert.equal(finishSession(ctx, session.id, false).earned, 0);
  assert.equal(getEngagement(ctx.prefs).activeSession.id, session.id);
  assert.equal(finishSession(ctx, session.id, true).earned, 8);
  const later = startSession(ctx, [{ id: "item-b" }], 10);
  assert.equal(finishSession(ctx, later.id, true).earned, 0);
  assert.equal(getEngagement(ctx.prefs).xp, 8);
  assert.equal(getEngagement(ctx.prefs).activeSession, null);
});

test("saved session retains its selected activities and resume index", () => {
  const ctx = fakeContext();
  const session = startSession(ctx, [{ id: "a" }, { id: "b" }], 10);
  saveEngagement(ctx, { activeSession: { ...session, index: 1 } });
  assert.deepEqual(getEngagement(ctx.prefs).activeSession.ids, ["a", "b"]);
  assert.equal(getEngagement(ctx.prefs).activeSession.index, 1);
});
