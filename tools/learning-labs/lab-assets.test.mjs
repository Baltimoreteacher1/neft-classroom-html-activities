import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { labAssets } from "./lab-assets.mjs";

test("Power Plant assets are included in the appropriate document regions and exist", () => {
  const { head, body } = labAssets("power-plant");
  const document = new JSDOM(`<!doctype html><html><head>${head}</head><body>${body}</body></html>`)
    .window.document;
  const stylesheet = document.head.querySelector('link[rel="stylesheet"]');
  const script = document.body.querySelector('script[type="module"]');
  assert.equal(
    stylesheet?.getAttribute("href"),
    "/curriculum/learning-labs/power-plant/machine.css",
  );
  assert.equal(script?.getAttribute("src"), "/curriculum/learning-labs/power-plant/machine.mjs");
  assert.ok(existsSync(`.${stylesheet.getAttribute("href")}`));
  assert.ok(existsSync(`.${script.getAttribute("src")}`));
  assert.deepEqual(labAssets("ratio-railway"), { head: "", body: "" });
});
