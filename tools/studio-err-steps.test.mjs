// "Find the Reasoning Error" items (assets/studio/kinds-basic.js K.err): the steps are numbered 1, 2, 3, never lettered,
// and Read (assets/studio/insight.js stageText) speaks them as "Step 2" / "Paso 2", never "Choice B".
// Every step used to show the letter "A": each step button sits in its own <li>, so the CSS letter counter restarted per step.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const dom = new JSDOM(
  `<!doctype html><body><section id="stage-1"><div class="host"></div></section></body>`,
  {
    runScripts: "outside-only",
  },
);
const w = dom.window;
for (const f of [
  "assets/studio-gen/core.js",
  "assets/studio/kinds-basic.js",
  "assets/studio/insight.js",
])
  w.eval(readFileSync(join(REPO_ROOT, f), "utf8"));

const host = /** @type {HTMLElement} */ (w.document.querySelector(".host"));
const it = {
  id: "e1",
  k: "err",
  t: "Maya solved 3x + 2 = 14.",
  tEs: "Maya resolvió 3x + 2 = 14.",
  s: [
    { l: "Step 1", lEs: "Paso 1", w: "3x = 12", wEs: "3x = 12" },
    { l: "Step 2", lEs: "Paso 2", w: "x = 36", wEs: "x = 36" },
    {
      l: "Step 3",
      lEs: "Paso 3",
      w: "Check: 3(36) + 2 = 110",
      wEs: "Comprobación: 3(36) + 2 = 110",
    },
  ],
  e: 1,
  fix: "Divide by 3.",
  x: "x = 4.",
  h: ["Undo the multiplication."],
};
w.StudioRT.kinds.err.mount({
  it,
  state: { picks: {} },
  host,
  solved: false,
  hintBlock: () => "",
  showSolved() {},
  solve() {},
  miss() {},
  misses: () => 1,
});

const buttons = [...host.querySelectorAll("button.err-step")];
assert.equal(buttons.length, 3);
const labels = buttons.map((b) => b.querySelector(".choice-letter")?.textContent);
assert.deepEqual(labels, ["1", "2", "3"], "each step shows its own number");

const stage = /** @type {HTMLElement} */ (w.document.querySelector("#stage-1"));
const en = w.StudioInsight.stageText(stage, false);
assert.match(en, /Step 1\. .*Step 2\. .*Step 3\./s, `read aloud numbers the steps: ${en}`);
assert.ok(!/Choice [A-D]/.test(en), `steps are not read as choices: ${en}`);
const es = w.StudioInsight.stageText(stage, true);
assert.match(es, /Paso 1\. .*Paso 2\. .*Paso 3\./s, `Spanish read aloud numbers the steps: ${es}`);
console.log("studio err steps: numbered 1-3 on screen and read as steps (EN + ES).");
