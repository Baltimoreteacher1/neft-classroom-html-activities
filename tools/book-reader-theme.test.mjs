import assert from "node:assert/strict";
import test from "node:test";
import { pagePosition, readerAtmosphere } from "../access-practice-lab/src/book/reader-theme.js";

test("reading atmosphere accepts known values and safely defaults older preferences", () => {
  assert.equal(readerAtmosphere(undefined), "daylight");
  assert.equal(readerAtmosphere("evening"), "evening");
  assert.equal(readerAtmosphere('" onload="alert(1)'), "daylight");
});
test("page seeking is bounded and handles malformed local values", () => {
  assert.deepEqual(pagePosition(3, 10), { page: 3, total: 10, fraction: 0.4 });
  assert.equal(pagePosition(100, 10).page, 9);
  assert.equal(pagePosition(-1, 10).page, 0);
  assert.equal(pagePosition(NaN, 0).total, 1);
  assert.deepEqual(pagePosition(Infinity, Infinity), { page: 0, total: 1, fraction: 1 });
});
