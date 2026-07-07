import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Per-step last-write-wins for routine checks: an UNCHECK on one device must
// propagate to the others (not be resurrected by their older check), a newer
// check must beat an older uncheck, and two devices checking DIFFERENT steps at
// once must both survive. Legacy data with no __ts still unions (nothing lost).

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
const { mergeRoutineLogs, mergeStates, seed } = api;
let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};

{
  // Local checked s1 at t=1000; remote unchecked it at t=2000 → uncheck wins.
  const merged = mergeRoutineLogs(
    { "2026-06-29": { r1: ["s1"], __ts: { r1: { s1: 1000 } } } },
    { "2026-06-29": { __ts: { r1: { s1: 2000 } } } },
  );
  assert.deepEqual(merged["2026-06-29"].r1 || [], [], "the newer uncheck removed s1");
  assert.equal(merged["2026-06-29"].__ts.r1.s1, 2000, "the newer timestamp is kept");
  ok("an uncheck with a newer timestamp propagates across devices");
}

{
  // Local unchecked s1 at t=1000; remote re-checked it at t=2000 → check wins.
  const merged = mergeRoutineLogs(
    { "2026-06-29": { __ts: { r1: { s1: 1000 } } } },
    { "2026-06-29": { r1: ["s1"], __ts: { r1: { s1: 2000 } } } },
  );
  assert.deepEqual([...merged["2026-06-29"].r1], ["s1"], "the newer check re-added s1");
  ok("a newer check beats an older uncheck");
}

{
  // Two devices check DIFFERENT steps concurrently → both survive.
  const merged = mergeRoutineLogs(
    { "2026-06-29": { r1: ["s1"], __ts: { r1: { s1: 1000 } } } },
    { "2026-06-29": { r1: ["s2"], __ts: { r1: { s2: 1500 } } } },
  );
  assert.deepEqual([...merged["2026-06-29"].r1].sort(), ["s1", "s2"], "both checks kept");
  ok("concurrent checks of different steps are both preserved");
}

{
  // Legacy data with no __ts must still union (backward compatible).
  const merged = mergeRoutineLogs(
    { "2026-06-29": { r1: ["a"] } },
    { "2026-06-29": { r1: ["b"] } },
  );
  assert.deepEqual([...merged["2026-06-29"].r1].sort(), ["a", "b"], "legacy union preserved");
  ok("legacy logs with no timestamps still union (nothing lost)");
}

{
  // End-to-end through mergeStates: an uncheck on one device wins.
  const mk = (log) => ({
    ...seed(),
    assignments: [],
    classes: [],
    activity: {},
    wins: [],
    reflections: {},
    routineLog: log,
  });
  const local = mk({ "2026-06-29": { r1: ["s1"], __ts: { r1: { s1: 1000 } } } });
  const remote = mk({ "2026-06-29": { __ts: { r1: { s1: 2000 } } } });
  const merged = mergeStates(local, remote);
  assert.deepEqual(merged.routineLog["2026-06-29"].r1 || [], [], "uncheck synced via mergeStates");
  ok("mergeStates syncs a routine uncheck end to end");
}

console.log(`\nfocus-school-routine-lww: ${passed}/5 checks passed`);
