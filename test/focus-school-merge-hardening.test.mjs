import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Sync-merge hardening (2026-07): per-step LWW for assignment checklists, per-
// item LWW for health check-ins, per-entry recency for reading responses,
// tombstone pruning, and local-day (not UTC) bucketing of the money ledger.

const appJs = readFileSync("focus-school/app.js", "utf8");
const sandbox = {
  console,
  setInterval: () => 0,
  clearInterval() {},
  setTimeout: () => 0,
  clearTimeout() {},
  location: { protocol: "https:", search: "" },
  navigator: {},
  localStorage: { getItem: () => null, setItem() {} },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    readyState: "loading",
    addEventListener() {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  window: { __FOCUS_SCHOOL_TEST__: {}, addEventListener() {} },
  addEventListener() {},
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.location = sandbox.location;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.sessionStorage = sandbox.sessionStorage;

vm.runInNewContext(appJs, sandbox, { filename: "focus-school/app.js" });
const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
const { ledgerDayKey, mergeAssignmentSteps, mergeStates, normalize, seed } = api;
let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};

const mk = (over) => ({ ...seed(), ...over });

{
  // Two devices toggle DIFFERENT steps of the same assignment concurrently —
  // both toggles must survive even though whole-object LWW picks one side.
  const base = {
    id: "a1",
    title: "Essay",
    steps: [
      { id: "s1", text: "Outline", done: false },
      { id: "s2", text: "Draft", done: false },
    ],
  };
  const local = mk({
    assignments: [
      {
        ...base,
        updatedAt: 2000,
        steps: [
          { id: "s1", text: "Outline", done: true, __ts: 2000 },
          { id: "s2", text: "Draft", done: false },
        ],
      },
    ],
  });
  const remote = mk({
    assignments: [
      {
        ...base,
        updatedAt: 1500,
        steps: [
          { id: "s1", text: "Outline", done: false },
          { id: "s2", text: "Draft", done: true, __ts: 1500 },
        ],
      },
    ],
  });
  const merged = mergeStates(local, remote);
  const steps = merged.assignments[0].steps;
  assert.equal(steps.find((s) => s.id === "s1").done, true, "local's s1 check kept");
  assert.equal(steps.find((s) => s.id === "s2").done, true, "remote's s2 check kept");
  ok("concurrent checks of different assignment steps both survive");
}

{
  // A newer UNCHECK on one device beats the other device's older check.
  const local = mk({
    assignments: [
      { id: "a1", title: "T", updatedAt: 1000, steps: [{ id: "s1", text: "x", done: true, __ts: 1000, credited: true }] },
    ],
  });
  const remote = mk({
    assignments: [
      { id: "a1", title: "T", updatedAt: 3000, steps: [{ id: "s1", text: "x", done: false, __ts: 3000 }] },
    ],
  });
  const merged = mergeStates(local, remote);
  const s1 = merged.assignments[0].steps[0];
  assert.equal(s1.done, false, "newer uncheck wins");
  assert.equal(s1.credited, true, "credit survives the uncheck (no double-award later)");
  ok("a newer assignment-step uncheck propagates and credit is never forgotten");
}

{
  // Direct helper: tie with no stamps unions (legacy behavior preserved).
  const merged = mergeAssignmentSteps(
    { steps: [{ id: "s1", text: "x", done: false }] },
    { steps: [{ id: "s1", text: "x", done: true }] },
  );
  assert.equal(merged[0].done, true, "unstamped tie unions to checked");
  ok("legacy assignment steps with no stamps still union");
}

{
  // normalize keeps the per-step stamp so it survives a sync round-trip.
  const st = normalize(
    mk({ assignments: [{ id: "a1", title: "T", steps: [{ id: "s1", text: "x", done: true, __ts: 4242 }] }] }),
  );
  assert.equal(st.assignments[0].steps[0].__ts, 4242, "step __ts preserved by normalize");
  ok("normalizeTask preserves per-step toggle stamps");
}

{
  // Health: an uncheck on one device must not be resurrected by the other
  // device's stale copy of the check.
  const local = mk({ health: { items: [], log: { "2026-07-07": { bike: 1, __ts: { bike: 1000 }, __paid: ["bike"] } } } });
  const remote = mk({ health: { items: [], log: { "2026-07-07": { __ts: { bike: 2000 }, __paid: ["bike"] } } } });
  const merged = mergeStates(local, remote);
  const day = merged.health.log["2026-07-07"];
  assert.equal(day.bike, undefined, "newer uncheck wins");
  assert.deepEqual([...day.__paid], ["bike"], "payment record survives (no re-pay, no clawback)");
  ok("a newer health uncheck propagates; __paid is preserved");
}

{
  // Health legacy union still works when no stamps exist.
  const local = mk({ health: { items: [], log: { "2026-07-07": { bike: 1 } } } });
  const remote = mk({ health: { items: [], log: { "2026-07-07": { lift: 1 } } } });
  const day = mergeStates(local, remote).health.log["2026-07-07"];
  assert.equal(day.bike, 1, "local check kept");
  assert.equal(day.lift, 1, "remote check kept");
  ok("legacy health logs with no stamps still union");
}

{
  // Reading: a newer SHORTER correction must beat older longer text.
  const local = mk({ readingProgress: { d1: { done: false, gist: "a much much longer stale answer", evidence: "", response: "", updatedAt: 1000 } } });
  const remote = mk({ readingProgress: { d1: { done: false, gist: "short fix", evidence: "", response: "", updatedAt: 2000 } } });
  const merged = mergeStates(local, remote);
  assert.equal(merged.readingProgress.d1.gist, "short fix", "newer edit wins over longer text");
  ok("a newer shorter reading correction beats older longer text");
}

{
  // Reading legacy entries (no stamp) keep the old done/length heuristic.
  const local = mk({ readingProgress: { d1: { done: false, gist: "aa", evidence: "", response: "" } } });
  const remote = mk({ readingProgress: { d1: { done: true, gist: "a", evidence: "", response: "" } } });
  const merged = mergeStates(local, remote);
  assert.equal(merged.readingProgress.d1.done, true, "done beats not-done for legacy entries");
  ok("legacy reading entries keep the done/length fallback");
}

{
  // Tombstones older than 180 days are pruned; recent ones are kept.
  const now = Date.now();
  const local = mk({ deletedIds: { old1: now - 200 * 86400000, fresh1: now - 1000 } });
  const remote = mk({ deletedIds: { old2: now - 190 * 86400000 } });
  const merged = mergeStates(local, remote);
  assert.equal(merged.deletedIds.old1, undefined, "ancient local tombstone pruned");
  assert.equal(merged.deletedIds.old2, undefined, "ancient remote tombstone pruned");
  assert.ok(merged.deletedIds.fresh1, "recent tombstone kept");
  ok("tombstones expire after 180 days instead of growing forever");
}

{
  // Ledger day bucketing is LOCAL, not a UTC string slice. 03:00 UTC on the
  // 8th is still the evening of the 7th anywhere west of UTC-3.
  const localDay = ledgerDayKey("2026-07-08T03:00:00.000Z");
  const d = new Date("2026-07-08T03:00:00.000Z");
  const expect = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.equal(localDay, expect, "bucketed by local calendar day");
  assert.equal(ledgerDayKey("zz-garbage"), "zz-garbage", "garbage falls back to a plain slice");
  ok("money ledger buckets earnings by local day (daily cap can't be dodged at night)");
}

console.log(`\nfocus-school-merge-hardening: ${passed}/10 checks passed`);
