import assert from "node:assert/strict";
import test from "node:test";
import pack from "../access-practice-lab/src/content/journey/m12.js";
import { evaluateSelection, init } from "../access-practice-lab/src/journey/engines/xray.js";

for (const band of ["3-5", "6-8"]) {
  test(`${band}: feedback explains only the selected evidence and a weak choice`, () => {
    const task = pack.bands[band].understand.read;
    const state = { ...init(task), claim: "s1", selected: ["s3", "s6"] };
    const result = evaluateSelection(task, state);
    assert.equal(result.status, "partial");
    assert.deepEqual(
      result.items.map((item) => item.id),
      ["s3", "s6"],
    );
    assert.equal(result.items[0].authored, true);
    assert.deepEqual(result.items[0].note, task.challenge.rationales.s3);
    assert.deepEqual(result.items[1].note, task.challenge.rationales.s6);
    assert.ok(!JSON.stringify(result).includes(task.challenge.rationales.s4[0]));
  });
}

test("the reading activity displays the selected connections after checking", async () => {
  const { JSDOM } = await import("jsdom");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const UI = await import("../access-practice-lab/src/journey/ui/xray.js");
  const band = "3-5";
  const task = pack.bands[band].understand.read;
  const root = new JSDOM("<main></main>").window.document.querySelector("main");
  const env = {
    I: makeI18n("en"),
    band,
    support: "A",
    independent: false,
    missionId: "m12",
    mission: { klu: "Argue" },
    pack: pack.bands[band],
    data: {},
    update(patch) {
      this.data = { ...this.data, ...patch };
      draw();
    },
    announce() {},
    help() {},
    ledger() {},
    done() {},
  };
  function draw() {
    root.innerHTML = String(UI.render(task, env));
    UI.mount(root, env);
  }
  draw();
  for (const id of ["s1", "s3", "s6"])
    root.querySelector(`[data-xr="pick"][data-sid="${id}"]`).click();
  root.querySelector('[data-xr="check"]').click();
  assert.match(root.querySelector('[data-sid="s3"] .xr-why').textContent, /different places/);
  assert.match(root.querySelector('[data-sid="s6"] .xr-why').textContent, /color/);
  assert.equal(root.querySelector('[data-sid="s4"] .xr-why'), null);
});
