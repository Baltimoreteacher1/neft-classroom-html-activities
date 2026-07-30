import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Routine STEP LISTS (not the checkboxes — that's focus-school-routine-lww) used
// to ride the whole-routine last-write-wins, so a step added on one device was
// erased the moment another device saved that same routine from a stale copy.
// It looked like "I added Hebrew Study and it never synced." These cover the
// union, the tombstone that keeps a real delete deleted, and the Now card
// rendering every step instead of only the first five.

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
const { mergeRoutineItems, mergeStates, normalize, seed } = api;
let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};
const texts = (items) => [...items].map((it) => it.text);
// Real epoch milliseconds: tombstones older than 180 days are pruned, so toy
// timestamps like 4000 would be discarded before the merge ever saw them.
const NOW = Date.now() - 100000;
const T = (n) => NOW + n;

const routine = (over = {}) => ({
  id: "r_night",
  name: "Night Time",
  emoji: "\u{1f647}",
  slot: "nighttime",
  days: ["Mon"],
  items: [
    { id: "i_a", text: "Charge computer", __ts: T(1000) },
    { id: "i_b", text: "Shower", __ts: T(1000) },
  ],
  updatedAt: T(1000),
  ...over,
});

{
  // The real bug: a step added on device A while device B edits the same routine
  // from a stale copy. B saves LAST, so B wins the whole-object LWW — but it
  // never saw the new step, so the step must survive.
  const deviceA = routine({
    items: [...routine().items, { id: "i_hebrew", text: "Hebrew Study", __ts: T(2000) }],
    updatedAt: T(2000),
  });
  const deviceB = routine({ name: "Night Time ⭐", updatedAt: T(3000) });
  const { items } = mergeRoutineItems(deviceB, deviceA);
  assert.deepEqual(texts(items), ["Charge computer", "Shower", "Hebrew Study"]);
  ok("a step added on one device survives a newer save from another device");
}

{
  // Same shape, but through the real sync path both ways round.
  const base = { ...seed(), routines: [], todos: [], classes: [], assignments: [] };
  const withStep = {
    ...base,
    routines: [
      routine({
        items: [...routine().items, { id: "i_hebrew", text: "Hebrew Study", __ts: T(2000) }],
        updatedAt: T(2000),
      }),
    ],
    updatedAt: T(2000),
  };
  const stale = { ...base, routines: [routine({ updatedAt: T(3000) })], updatedAt: T(3000) };
  for (const [local, remote, label] of [
    [stale, withStep, "inbound"],
    [withStep, stale, "outbound"],
  ]) {
    const merged = mergeStates(local, remote);
    assert.deepEqual(
      texts(merged.routines[0].items),
      ["Charge computer", "Shower", "Hebrew Study"],
      `${label}: the new step is kept`,
    );
  }
  ok("mergeStates keeps the added step in both merge directions");
}

{
  // A genuine delete must stay deleted: the deleting device leaves a tombstone,
  // so a peer holding the old copy can't union the step back on the next pull.
  const deleter = routine({
    items: [{ id: "i_a", text: "Charge computer", __ts: T(1000) }],
    removedItems: { i_b: T(4000) },
    updatedAt: T(4000),
  });
  const { items, removedItems } = mergeRoutineItems(deleter, routine());
  assert.deepEqual(texts(items), ["Charge computer"], "Shower stays deleted");
  assert.equal(removedItems.i_b, T(4000), "the tombstone is carried forward");
  // ...and it holds when the stale peer is the LWW winner.
  const flipped = mergeRoutineItems(routine({ updatedAt: T(5000) }), deleter);
  assert.deepEqual(texts(flipped.items), ["Charge computer"], "even when the stale copy wins LWW");
  ok("a deleted step is not resurrected by a stale device");
}

{
  // Re-adding a step after deleting it: the newer stamp beats the tombstone.
  const readded = routine({
    items: [...routine().items, { id: "i_b2", text: "Shower", __ts: T(6000) }],
    removedItems: { i_b2: T(5000) },
    updatedAt: T(6000),
  });
  const { items } = mergeRoutineItems(readded, routine());
  assert.ok(
    items.some((it) => it.id === "i_b2"),
    "the re-added step survives its own older tombstone",
  );
  ok("a step re-added after a delete survives");
}

{
  // Same step edited on both devices → the newer text wins, no duplicate row.
  const older = routine({ items: [{ id: "i_a", text: "Charge laptop", __ts: T(1000) }] });
  const newer = routine({ items: [{ id: "i_a", text: "Charge computer", __ts: T(9000) }] });
  assert.deepEqual(texts(mergeRoutineItems(older, newer).items), ["Charge computer"]);
  assert.deepEqual(texts(mergeRoutineItems(newer, older).items), ["Charge computer"]);
  ok("an edited step keeps the newest text and never duplicates");
}

{
  // Legacy rows carry no __ts and no tombstone map. They must still merge as a
  // plain union rather than throwing or vanishing.
  const legacy = { id: "r_night", name: "Night Time", items: [{ id: "i_a", text: "Old step" }] };
  const other = {
    id: "r_night",
    name: "Night Time",
    items: [{ id: "i_z", text: "New step", __ts: T(7000) }],
    updatedAt: T(7000),
  };
  const { items } = mergeRoutineItems(other, legacy);
  assert.deepEqual(texts(items).sort(), ["New step", "Old step"]);
  ok("legacy step rows with no timestamps still merge");
}

{
  // normalize() must carry __ts and removedItems through every load/import, or
  // the merge above loses its inputs on the very next save.
  const s = normalize({
    ...seed(),
    routines: [
      {
        ...routine(),
        removedItems: { i_gone: T(8000), i_ancient: 1, i_bogus: "nope" },
      },
    ],
  });
  const r = s.routines[0];
  assert.equal(r.items[0].__ts, T(1000), "step stamps survive normalize");
  assert.deepEqual(Object.keys(r.removedItems), ["i_gone"], "stale/invalid tombstones are dropped");
  ok("normalize preserves step stamps and prunes old tombstones");
}

{
  // The visible half of the bug: the Now card sliced the checklist to 5 steps
  // with no "+N more" hint, so step 6 read as missing.
  assert.doesNotMatch(
    appJs,
    /<ul class="steps">\$\{r\.items\s*\n\s*\.slice\(0, 5\)/,
    "the Now card must not truncate the routine checklist",
  );
  ok("the Now card renders every routine step");
}

{
  // The window prose is generated from ROUTINE_WINDOWS now, so it can't drift
  // out of date the way "Morning is 6:00–8:00 AM" did.
  assert.doesNotMatch(appJs, /Morning is 6:00–8:00 AM/, "no hardcoded stale window prose");
  assert.match(appJs, /function routineWindowsHint\(\)/, "hint is derived from ROUTINE_WINDOWS");
  ok("the routine-window hint is derived from the window table");
}

console.log(`\nfocus-school routine step sync: ${passed}/9 checks passed`);
