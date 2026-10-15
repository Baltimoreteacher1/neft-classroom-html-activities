// My Progress shows Curriculum 2.0 work (mission steps, evidence, fluency) from ewl_state_v1, read-only and escaped.
//   node tools/ewl-progress.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { loadEwl } from "./lib/ewl-vm.mjs";

const dom = new JSDOM("<!doctype html><html lang='en'><body></body></html>", {
  runScripts: "outside-only",
  url: "https://eduwonderlab.com/curriculum/my-progress/",
});
for (const f of ["progress-stores.js", "progress-sections.js", "progress-reasoning.js"])
  dom.window.eval(readFileSync(new URL(`../assets/my-progress/${f}`, import.meta.url), "utf8"));
const RS = dom.window.NTProgressReasoning;
assert.ok(RS && typeof RS.read === "function");

// build real state with the real store, then read it back the way the page does
const ctx = loadEwl({ only: ["rational.js", "state-store.js", "reasoning.js", "ui.js"] });
const mem = {};
const storage = {
  getItem: (k) => mem[k] ?? null,
  setItem: (k, v) => (mem[k] = v),
  removeItem: (k) => delete mem[k],
};
const store = ctx.EWL.Store.create({ storage });
store.setLesson("4-3");
store.markStage("4-3", "curious");
store.markStage("4-3", "lab");
store.addEvidence("ewl.lab.discount-claim", { claim: "<img src=x onerror=alert(1)>", ok: true });
store.addEvidence("ewl.lab.discount-claim", { claim: "again" });
store.addEvidence("ewl.forge.kofi", { ok: true });
store.recordFluency(true);
store.recordFluency(false);

const r = RS.read(storage);
assert.equal(r.empty, false);
assert.equal(r.stages, 2);
assert.equal(r.lessons, 1);
assert.equal(r.activities.length, 2);
assert.equal(r.activities.find((a) => a.slug === "discount-claim").entries, 2);
assert.equal(r.activities.find((a) => a.slug === "discount-claim").ok, 1);
assert.equal(r.fluency.answered, 2);
const html = RS.html(r);
assert.match(html, /Reasoning and evidence/);
assert.match(html, /Math Reality Lab <span[^>]*>Laboratorio[^<]*<\/span> · Discount claim/);
assert.match(html, /Counterexample Forge <span[^>]*>Fragua[^<]*<\/span> · Kofi/);
assert.ok(!html.includes("<img"), "student text never reaches the page");

// empty, corrupt and foreign values never throw and show nothing
for (const raw of [
  null,
  "",
  "{nope",
  "[]",
  JSON.stringify({ v: 2 }),
  JSON.stringify({ v: 1 }),
  JSON.stringify({ v: 1, evidence: { "not.an.id": [{}], "ewl.lab.x": "str" } }),
]) {
  const rr = RS.read({ getItem: () => raw });
  assert.equal(rr.empty, true, String(raw));
  assert.equal(RS.html(rr), "");
}
// reading never writes
let wrote = false;
RS.read({
  getItem: (k) => mem[k],
  setItem: () => (wrote = true),
  removeItem: () => (wrote = true),
});
assert.equal(wrote, false);
console.log(
  "ewl-progress: reads Curriculum 2.0 state read-only, escapes student text, tolerates corrupt storage.",
);
