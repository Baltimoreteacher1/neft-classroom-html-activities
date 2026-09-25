import assert from "node:assert/strict";
import { resolve } from "./lib/engine-hooks.mjs";

// A shared node_modules workspace link may resolve into another checkout.
// Both supported test import forms must stay in the checkout owning the hook.
const expected = new URL("../engine/core/part-two-renderer.js", import.meta.url).href;
const wrongCheckout = () => ({ url: "file:///another-checkout/engine/core/part-two-renderer.js" });
for (const prefix of ["@engine/", "@eduwonderlab/engine/"]) {
  assert.deepEqual(resolve(`${prefix}core/part-two-renderer.js`, {}, wrongCheckout), {
    url: expected,
    shortCircuit: true,
  });
}
const delegated = { url: "file:///dependency/index.js" };
let calls = 0;
assert.equal(
  resolve("jsdom", {}, () => {
    calls++;
    return delegated;
  }),
  delegated,
);
assert.equal(calls, 1, "Unrelated dependencies must use the standard resolver");
console.log(
  "PASS engine test hooks: workspace imports stay in the current checkout; unrelated imports delegate.",
);
