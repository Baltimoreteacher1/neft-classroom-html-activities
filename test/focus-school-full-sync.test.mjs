import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// "Everything syncs": the slices that mergeStates previously left device-local
// (checkins, daily goal, captureLog, garden, health.log) now merge across
// devices. Verifies each converges without losing data.

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
const { mergeStates, seed } = api;
let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};
const mk = (over) => ({ ...seed(), assignments: [], classes: [], wins: [], ...over });

{
  // A check-in made only on the remote device shows up locally.
  const local = mk({ checkins: {}, updatedAt: 1000 });
  const remote = mk({ checkins: { "2026-06-29": { mood: "good", priority: "math" } }, updatedAt: 2000 });
  const merged = mergeStates(local, remote);
  assert.equal(merged.checkins["2026-06-29"].priority, "math", "remote check-in synced in");
  ok("daily check-ins sync across devices");
}

{
  // The newer daily goal wins by goalDate.
  const local = mk({ daily: { goal: "old", goalDate: "2026-06-28" }, updatedAt: 5000 });
  const remote = mk({ daily: { goal: "new", goalDate: "2026-06-29" }, updatedAt: 1000 });
  const merged = mergeStates(local, remote);
  assert.equal(merged.daily.goal, "new", "later-dated goal wins regardless of updatedAt");
  ok("today's goal syncs (later date wins)");
}

{
  // Garden: the blob with the most xp (furthest progress) wins wholesale, so
  // waterReservoir/plantStage/plantType travel together and spent water is never
  // resurrected.
  const local = mk({ garden: { xp: 10, wateredCount: 3, waterReservoir: 5, plantStage: 1, plantType: "cactus" }, updatedAt: 2000 });
  const remote = mk({ garden: { xp: 25, wateredCount: 6, waterReservoir: 0, plantStage: 2, plantType: "fern" }, updatedAt: 1000 });
  const merged = mergeStates(local, remote);
  assert.equal(merged.garden.xp, 25, "the higher-xp garden wins");
  assert.equal(merged.garden.waterReservoir, 0, "spent water is not resurrected");
  assert.equal(merged.garden.plantType, "fern", "plant look travels with the winning blob");
  ok("garden progress syncs to the furthest-along device");
}

{
  // Health: a movement check on either device shows on both; money counts once.
  const local = mk({ health: { log: { "2026-06-29": { bike: 1, __paid: ["bike"] } }, items: [] } });
  const remote = mk({ health: { log: { "2026-06-29": { lift: 1, __paid: ["lift"] } }, items: [] } });
  const merged = mergeStates(local, remote);
  const day = merged.health.log["2026-06-29"];
  assert.equal(day.bike, 1, "local check kept");
  assert.equal(day.lift, 1, "remote check merged in");
  assert.deepEqual([...day.__paid].sort(), ["bike", "lift"], "__paid unioned (no double pay)");
  ok("health movement check-ins sync across devices");
}

{
  // captureLog is grow-only across devices.
  const local = mk({ captureLog: { "2026-06-28": true } });
  const remote = mk({ captureLog: { "2026-06-29": true } });
  const merged = mergeStates(local, remote);
  assert.ok(merged.captureLog["2026-06-28"] && merged.captureLog["2026-06-29"], "both days kept");
  ok("captureLog markers union across devices");
}

console.log(`\nfocus-school-full-sync: ${passed}/5 checks passed`);
