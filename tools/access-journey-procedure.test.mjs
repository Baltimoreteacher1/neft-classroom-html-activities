import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import pack from "../access-practice-lab/src/content/journey/m07.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { runProcedure } from "../access-practice-lab/src/journey/engines/procedure-plan.js";
import { init } from "../access-practice-lab/src/journey/engines/scene.js";
import { mount, render } from "../access-practice-lab/src/journey/ui/scene.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const task = pack.bands["6-8"].discover;
test("authored filter plans update the scene and preserve the intended contrast", () => {
  const all = runProcedure(task, "all", init(task));
  const noSand = runProcedure(task, "no-sand", init(task));
  const noCharcoal = runProcedure(task, "no-charcoal", init(task));
  assert.match(all.result, /30 centimeters/);
  assert.match(noSand.result, /12 centimeters/);
  assert.match(noCharcoal.result, /25 centimeters/);
  assert.equal(runProcedure(task, "missing", init(task)), null);
});
test("the learner can run a plan, see the result and revise it", () => {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>');
  const root = dom.window.document.getElementById("root");
  const env = {
    I: makeI18n("en"),
    band: "6-8",
    support: "A",
    independent: false,
    missionId: "m07",
    step: "discover",
    mission: { klu: "Explain", environment: "lab" },
    pack: pack.bands["6-8"],
    data: {},
    help() {},
    done() {},
    ledger() {},
    announce() {},
    navigate() {},
    update(patch) {
      env.data = { ...env.data, ...patch };
      paint();
    },
  };
  function paint() {
    root.innerHTML = toHtml(render(task, env));
    mount(root, env);
  }
  paint();
  root.querySelector("[data-sc-procedure-run]").click();
  assert.match(root.textContent, /Choose a plan first/);
  const select = root.querySelector("[data-sc-procedure-plan]");
  select.value = "no-sand";
  select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  root.querySelector("[data-sc-procedure-run]").click();
  assert.match(root.querySelector("[data-sc-procedure-result]").textContent, /12 centimeters/);
  assert.deepEqual(env.data.scene.controls, { sand: "none", charcoal: "charcoal" });
  assert.match(root.textContent, /not necessarily safe to drink/);
});
