import assert from "node:assert/strict";
import { test } from "node:test";
import { markToday, readWeek, recordStudioSave, weekStartFor, writeNight } from "./family-state.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), values };
}

test("weekly, lesson and studio progress share existing keys and store no names", () => {
  const storage = memoryStorage({ "hw_family_nights_v1": JSON.stringify(["2026-11-18"]), "ewl-family-math-studio-v1": JSON.stringify({ world: "game" }), "ws:v1:2026-11-16": JSON.stringify({ name: "Student name", initials: { "2026-11-18": "AB" }, done: {} }) });
  const date = new Date("2026-11-18T12:00:00");
  const start = weekStartFor(date);
  writeNight("2026-11-18", storage);
  recordStudioSave(storage, date);
  markToday(storage, date);
  assert.equal(readWeek(start, storage).done["2026-11-18"], true);
  assert.equal("name" in readWeek(start, storage), false);
  assert.equal("initials" in readWeek(start, storage), false);
  assert.deepEqual(JSON.parse(storage.getItem("hw_family_nights_v1")), ["2026-11-18"]);
  assert.ok(storage.getItem("ewl-family-math-studio-v1"));
  assert.ok([...storage.values.keys()].every((key) => key === "ws:v1:" + start || ["hw_family_nights_v1", "ewl-family-math-studio-v1"].includes(key)));
  assert.doesNotMatch([...storage.values.values()].join(" "), /student|learner|name/i);
});
