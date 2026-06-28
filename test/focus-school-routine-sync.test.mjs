import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appJs = readFileSync("focus-school/app.js", "utf8");
const sandbox = {
  console,
  setInterval() {
    return 0;
  },
  clearInterval() {},
  setTimeout() {
    return 0;
  },
  clearTimeout() {},
  location: { protocol: "https:", search: "" },
  navigator: {},
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
  },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  },
  document: {
    readyState: "loading",
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  },
  window: {
    __FOCUS_SCHOOL_TEST__: {},
    addEventListener() {},
  },
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
let passed = 0;
function ok(name) {
  console.log(`  ✓ ${name}`);
  passed += 1;
}

const at = (hour, minute = 0, day = 1) => {
  const d = new Date("2026-06-29T00:00:00");
  d.setDate(d.getDate() + (day - d.getDay()));
  d.setHours(hour, minute, 0, 0);
  return d;
};

{
  assert.equal(api.pickRoutineForNow(at(6, 0)).name, "Morning Launch");
  assert.equal(api.pickRoutineForNow(at(8, 0)).name, "Morning Launch");
  assert.equal(api.pickRoutineForNow(at(8, 1)), null);
  assert.equal(api.pickRoutineForNow(at(15, 29)), null);
  assert.equal(api.pickRoutineForNow(at(15, 30)).name, "After-School Reset");
  assert.equal(api.pickRoutineForNow(at(18, 0)).name, "After-School Reset");
  assert.equal(api.pickRoutineForNow(at(18, 1)), null);
  assert.equal(api.pickRoutineForNow(at(19, 0)).name, "Nighttime Shutdown");
  assert.equal(api.pickRoutineForNow(at(23, 30)).name, "Nighttime Shutdown");
  assert.equal(api.pickRoutineForNow(at(23, 31)), null);
  ok("Right routine follows requested live time windows");
}

{
  let next = api.nextRoutineWindow(at(8, 1));
  assert.equal(next.label, "After School");
  assert.equal(next.routine.name, "After-School Reset");
  assert.equal(next.startsAt.getHours(), 15);
  assert.equal(next.startsAt.getMinutes(), 30);

  next = api.nextRoutineWindow(at(23, 31));
  assert.equal(next.label, "Morning");
  assert.equal(next.routine.name, "Morning Launch");
  assert.equal(next.startsAt.getDate(), at(23, 31).getDate() + 1);
  ok("Next routine window points to the upcoming live checklist");
}

{
  const merged = api.mergeRoutineLogs(
    {
      "2026-06-29": { r1: ["pack"], __awarded: ["r1"] },
      "2026-06-28": { r1: ["old"] },
    },
    {
      "2026-06-29": { r1: ["water"], r2: ["charger"], __awarded: ["r2"] },
    },
  );
  assert.deepEqual([...merged["2026-06-29"].r1].sort(), ["pack", "water"]);
  assert.deepEqual([...merged["2026-06-29"].r2], ["charger"]);
  assert.deepEqual([...merged["2026-06-29"].__awarded].sort(), ["r1", "r2"]);
  assert.deepEqual([...merged["2026-06-28"].r1], ["old"]);
  ok("routineLog sync unions checked live steps by date");
}

{
  const local = {
    ...api.seed(),
    assignments: [],
    classes: [],
    activity: {},
    wins: [],
    reflections: {},
    routineLog: { "2026-06-29": { r1: ["pack"] } },
  };
  const remote = {
    ...api.seed(),
    assignments: [],
    classes: [],
    activity: {},
    wins: [],
    reflections: {},
    routineLog: { "2026-06-29": { r1: ["water"] } },
  };
  const merged = api.mergeStates(local, remote);
  assert.deepEqual([...merged.routineLog["2026-06-29"].r1].sort(), [
    "pack",
    "water",
  ]);
  ok("mergeStates preserves live routine checklist progress from both devices");
}

console.log(`\nfocus-school-routine-sync: ${passed}/4 checks passed`);
