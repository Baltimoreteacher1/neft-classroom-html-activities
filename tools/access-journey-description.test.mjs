import assert from "node:assert/strict";
import test from "node:test";
import pack from "../access-practice-lab/src/content/journey/m04.js";
import { matchDescription } from "../access-practice-lab/src/journey/engines/scene.js";

const task = pack.bands["3-5"].discover;
test("a vague description leaves multiple possibilities", () => {
  const result = matchDescription(task, { shape: "five" });
  assert.deepEqual(result.matches, ["a", "b", "d"]);
});
test("specific, incorrect and impossible descriptions produce distinct outcomes", () => {
  assert.deepEqual(matchDescription(task, { shape: "five", color: "dark", length: "12" }).matches, [
    "a",
  ]);
  assert.deepEqual(
    matchDescription(task, { color: "dark", length: "12", texture: "smooth" }).matches,
    ["a"],
  );
  assert.deepEqual(
    matchDescription(task, { shape: "five", length: "12", texture: "smooth" }).matches,
    ["a"],
  );
  assert.deepEqual(matchDescription(task, { shape: "three" }).matches, ["c"]);
  assert.deepEqual(matchDescription(task, { shape: "oval", color: "dark" }).matches, []);
  assert.equal(matchDescription(task, { shape: "unknown" }).count, 0);
});
