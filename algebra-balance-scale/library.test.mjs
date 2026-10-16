// The device-local library of puzzles a student made: only share codes are stored,
// damaged or hand-edited entries are dropped, and blocked storage never throws.
import assert from "node:assert/strict";
import test from "node:test";
import { chipLabel, loadLabels } from "./labels.js";
import { addToLibrary, LIBRARY_KEY, loadLibrary, MAX_PUZZLES, removeFromLibrary } from "./library.js";
import { generate } from "./puzzles.js";
import { encodePuzzle } from "./share-code.js";

const memory = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};
const code = (level, i) => encodePuzzle(generate(level, i));

test("added puzzles come back newest first, once each", () => {
  const store = memory();
  addToLibrary(store, code(1, 0));
  addToLibrary(store, code(2, 0));
  addToLibrary(store, code(1, 0));
  assert.deepEqual(loadLibrary(store), [code(1, 0), code(2, 0)]);
});

test("only the code is stored: no names, no text, no equation", () => {
  const store = memory();
  addToLibrary(store, code(3, 1));
  assert.deepEqual(Object.keys(JSON.parse(store.data[LIBRARY_KEY])).sort(), ["codes", "v"]);
  assert.ok(!/[a-z]/.test(JSON.parse(store.data[LIBRARY_KEY]).codes[0]), "codes are upper-case characters only");
});

test("the library keeps at most 24 puzzles", () => {
  const store = memory();
  for (let i = 0; i < MAX_PUZZLES + 6; i += 1) addToLibrary(store, code(1, i));
  const list = loadLibrary(store);
  assert.equal(list.length, MAX_PUZZLES);
  assert.equal(list[0], code(1, MAX_PUZZLES + 5));
});

test("damaged, tampered or foreign entries are dropped, never trusted", () => {
  const good = code(2, 3);
  const flipped = `${good.slice(0, -1)}${good.endsWith("0") ? "1" : "0"}`;
  const store = memory({
    [LIBRARY_KEY]: JSON.stringify({ v: 1, codes: [good, flipped, "<script>", 7, null, { code: good }, "ZZZ-ZZZ-ZZZ"] }),
  });
  assert.deepEqual(loadLibrary(store), [good]);
  for (const junk of ["not json", "[]", "null", "{\"codes\":\"x\"}", ""]) {
    assert.deepEqual(loadLibrary(memory({ [LIBRARY_KEY]: junk })), []);
  }
});

test("a code pasted with spaces and lower case is saved in its canonical form", () => {
  const store = memory();
  addToLibrary(store, ` ${code(1, 2).toLowerCase().replaceAll("-", " ")} `);
  assert.deepEqual(loadLibrary(store), [code(1, 2)]);
  addToLibrary(store, "garbage");
  assert.equal(loadLibrary(store).length, 1);
});

test("a student can delete a puzzle", () => {
  const store = memory();
  addToLibrary(store, code(1, 0));
  addToLibrary(store, code(1, 1));
  assert.deepEqual(removeFromLibrary(store, code(1, 0).toLowerCase()), [code(1, 1)]);
  assert.deepEqual(loadLibrary(store), [code(1, 1)]);
});

test("blocked or full storage degrades to an empty library instead of throwing", () => {
  const blocked = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  assert.deepEqual(loadLibrary(blocked), []);
  assert.doesNotThrow(() => addToLibrary(blocked, code(1, 0)));
  assert.doesNotThrow(() => removeFromLibrary(blocked, code(1, 0)));
});

test("misconception chip labels come from the shared labels file, and fail quiet", async () => {
  const labels = {
    "sign-dropped": { label: "Right magnitude, lost the negative sign", labelEs: "Magnitud correcta, perdió el signo negativo" },
  };
  assert.equal(chipLabel(labels, "sign-dropped", "en"), "Right magnitude, lost the negative sign");
  assert.equal(chipLabel(labels, "sign-dropped", "es"), "Magnitud correcta, perdió el signo negativo");
  assert.equal(chipLabel(labels, "unknown-tag", "en"), null);
  assert.equal(chipLabel({}, "sign-dropped", "es"), null);
  const failing = () => Promise.reject(new Error("offline"));
  assert.deepEqual(await loadLabels(failing), {});
});
