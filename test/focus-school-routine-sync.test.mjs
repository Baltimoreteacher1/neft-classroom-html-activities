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

{
  // Home card keeps a started-but-unfinished routine visible after its window,
  // so checked steps never appear to reset before the next day.
  const ymd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const at = (hour, minute = 0, day = 1) => {
    const d = new Date("2026-06-29T00:00:00");
    d.setDate(d.getDate() + (day - d.getDay()));
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const morning = api.state.routines.find((r) => r.name === "Morning Launch");
  assert.ok(morning && morning.items.length, "seed has a Morning Launch routine");
  const now = at(10, 0, 1); // Monday 10:00 — after the morning window
  const key = ymd(now);

  // active window always shows the window routine
  assert.equal(
    api.routineForHome(at(7, 0, 1))?.name,
    "Morning Launch",
    "active window shows the window routine",
  );

  // started but unfinished → stays visible after the window
  api.state.routineLog[key] = { [morning.id]: [morning.items[0].id] };
  assert.equal(
    api.routineForHome(now)?.name,
    "Morning Launch",
    "started routine stays on home after its window",
  );

  // completed → yields to the next routine (returns null here)
  api.state.routineLog[key][morning.id] = morning.items.map((it) => it.id);
  assert.equal(
    api.routineForHome(now),
    null,
    "completed routine no longer pins the home card",
  );

  // nothing started → null (next-routine card)
  api.state.routineLog[key] = {};
  assert.equal(
    api.routineForHome(now),
    null,
    "no progress → home shows the next routine instead",
  );
  ok("Home routine card persists checked progress until the next day");
}

{
  const local = {
    ...api.seed(),
    assignments: [],
    family: { note: "Bring folder", needsHelp: "", updatedAt: 10 },
    hebrew: {
      updatedAt: 10,
      weakWords: "shalom",
      practiceLog: { "2026-06-29": { chant: true, minutes: 5 } },
    },
  };
  const remote = {
    ...api.seed(),
    assignments: [],
    family: { note: "Quiz tomorrow", needsHelp: "vocab", updatedAt: 20 },
    hebrew: {
      updatedAt: 20,
      weakWords: "tefillah",
      practiceLog: { "2026-06-29": { prayer: true, minutes: 8 } },
    },
  };
  const merged = api.mergeStates(local, remote);
  assert.equal(merged.family.note, "Quiz tomorrow");
  assert.equal(merged.family.needsHelp, "vocab");
  assert.equal(merged.hebrew.weakWords, "tefillah");
  assert.equal(merged.hebrew.practiceLog["2026-06-29"].prayer, true);
  ok("family and Hebrew coaching data merge by their own update stamps");
}

{
  api.state.assignments = [];
  api.state.routines = [];
  api.state.routineLog = {};
  api.state.hebrew = {
    updatedAt: 0,
    weakWords: "",
    practiceLog: {},
  };
  const next = api.doNextAction();
  assert.equal(next.label, "Practice block");
  assert.equal(next.arg, "hebrew");
  ok("Do Next falls back to Hebrew practice when work is clear");
}

console.log(`\nfocus-school-routine-sync: ${passed}/7 checks passed`);
