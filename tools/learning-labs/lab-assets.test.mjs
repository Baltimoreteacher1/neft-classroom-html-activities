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
  const mixture = labAssets("mixture-matchup");
  assert.match(mixture.head, /mixture-matchup\/delivery-network\.css/);
  assert.equal(mixture.body, "");
  assert.ok(existsSync("./curriculum/learning-labs/mixture-matchup/delivery-network.css"));
  assert.match(labAssets("packaging-workshop").head, /packaging-workshop\/district-design\.css/);
  assert.ok(existsSync("./curriculum/learning-labs/packaging-workshop/district-design.css"));
  assert.match(labAssets("hundred-square-studio").head, /hundred-square-studio\/power-grid\.css/);
  assert.ok(existsSync("./curriculum/learning-labs/hundred-square-studio/power-grid.css"));
});
